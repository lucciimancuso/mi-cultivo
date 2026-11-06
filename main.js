'use strict';
const { app, BrowserWindow, ipcMain, dialog, shell, safeStorage, Menu, session, nativeTheme, Notification } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { pathToFileURL } = require('url');

if (process.env.MICULTIVO_DATA) app.setPath('userData', process.env.MICULTIVO_DATA);

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) { app.quit(); }

const dataDir = () => app.getPath('userData');
const dataFile = () => path.join(dataDir(), 'cultivo.json');
const bakFile = () => path.join(dataDir(), 'cultivo.bak.json');
const photosDir = () => path.join(dataDir(), 'fotos');
const keyFile = () => path.join(dataDir(), 'claude.key');
let win = null;
let lastBak = 0;
let lastAB = 0;

/* ---------- configuración, PIN y copia automática ---------- */
const cfgFile = () => path.join(dataDir(), 'config.json');
const backupsDir = () => path.join(dataDir(), 'copias');
let cfg = null;
function readCfg() {
  if (cfg) return cfg;
  try { cfg = JSON.parse(fs.readFileSync(cfgFile(), 'utf8')); } catch (e) { cfg = {}; }
  if (!cfg || typeof cfg !== 'object') cfg = {};
  if (typeof cfg.autoBackup !== 'boolean') cfg.autoBackup = true;
  return cfg;
}
function writeCfg() { try { fs.mkdirSync(dataDir(), { recursive: true }); writeAtomic(cfgFile(), JSON.stringify(cfg)); } catch (e) {} }
let unlocked = false;
const isLocked = () => !!readCfg().pin && !unlocked;
const hashPin = (pin, salt) => crypto.scryptSync(String(pin), salt, 32).toString('hex');
function checkPin(pin) {
  const c = readCfg();
  if (!c.pin) return true;
  try {
    const a = Buffer.from(hashPin(pin, c.pin.s), 'hex'), b = Buffer.from(c.pin.h, 'hex');
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch (e) { return false; }
}
let fails = 0, blockedUntil = 0;
function tryPin(pin) {
  const now = Date.now();
  if (now < blockedUntil) return { ok: false, msg: 'Demasiados intentos. Esperá ' + Math.ceil((blockedUntil - now) / 1000) + ' segundos.' };
  if (checkPin(pin)) { fails = 0; return { ok: true }; }
  fails++;
  if (fails >= 5) { fails = 0; blockedUntil = now + 30000; return { ok: false, msg: 'Demasiados intentos. Esperá 30 segundos.' }; }
  return { ok: false, msg: 'PIN incorrecto. Te quedan ' + (5 - fails) + ' intentos.' };
}
const ymd = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
function autoBackup() {
  try {
    const c = readCfg();
    if (!c.autoBackup || isLocked()) return;
    const f = dataFile();
    if (!fs.existsSync(f)) return;
    const dest = path.join(backupsDir(), 'auto-' + ymd(new Date()) + '.json');
    if (fs.existsSync(dest)) return; // una por día: guarda cómo estaba todo al empezar el día, así un error de hoy no pisa la copia
    const t = fs.readFileSync(f, 'utf8');
    JSON.parse(t);
    fs.mkdirSync(backupsDir(), { recursive: true });
    writeAtomic(dest, t);
    c.lastBackup = Date.now(); writeCfg();
    const files = fs.readdirSync(backupsDir()).filter((n) => /^auto-\d{4}-\d{2}-\d{2}\.json$/.test(n)).sort();
    while (files.length > 7) fs.unlinkSync(path.join(backupsDir(), files.shift()));
  } catch (e) {}
}

function ensureDirs() { fs.mkdirSync(photosDir(), { recursive: true }); }

function writeAtomic(file, text) {
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, text, 'utf8');
  fs.renameSync(tmp, file);
}
function saveData(text) {
  if (typeof text !== 'string' || text.length > 50 * 1024 * 1024) return false;
  try {
    ensureDirs();
    const f = dataFile();
    if (fs.existsSync(f) && Date.now() - lastBak > 10 * 60 * 1000) { try { fs.copyFileSync(f, bakFile()); lastBak = Date.now(); } catch (e) {} }
    writeAtomic(f, text);
    if (Date.now() - lastAB > 60000) { lastAB = Date.now(); autoBackup(); }
    return true;
  } catch (e) { return false; }
}
function loadData() {
  for (const f of [dataFile(), bakFile()]) {
    try {
      if (!fs.existsSync(f)) continue;
      const t = fs.readFileSync(f, 'utf8');
      JSON.parse(t);
      return t;
    } catch (e) {
      try { fs.renameSync(f, f + '.corrupto-' + Date.now()); } catch (e2) {}
    }
  }
  return null;
}

const okId = (s) => typeof s === 'string' && /^[A-Za-z0-9_-]{1,64}$/.test(s);
function safePhotoPath(rel) {
  if (typeof rel !== 'string' || rel.indexOf('data:') === 0) return null;
  const full = path.resolve(photosDir(), rel);
  if (!full.startsWith(path.resolve(photosDir()) + path.sep)) return null;
  return full;
}

ipcMain.on('paths', (e) => {
  ensureDirs();
  e.returnValue = { photosBase: pathToFileURL(photosDir()).href + '/', dir: dataDir() };
});
ipcMain.handle('load', () => (isLocked() ? null : loadData()));
ipcMain.handle('save', (e, text) => (isLocked() ? false : saveData(text)));
ipcMain.on('saveSync', (e, text) => { if (!isLocked()) saveData(text); e.returnValue = true; });
ipcMain.handle('cfg:get', () => { const c = readCfg(); return { desktop: true, locked: isLocked(), hasPin: !!c.pin, autoBackup: !!c.autoBackup, lastBackup: c.lastBackup || null }; });
ipcMain.handle('cfg:set', (e, o) => { if (isLocked() || !o || typeof o.autoBackup !== 'boolean') return { ok: false }; readCfg().autoBackup = o.autoBackup; writeCfg(); if (o.autoBackup) autoBackup(); return { ok: true }; });
ipcMain.handle('lock:now', () => { if (readCfg().pin) unlocked = false; return { ok: true }; });
ipcMain.handle('lock:unlock', (e, pin) => { if (!isLocked()) return { ok: true }; const r = tryPin(pin); if (r.ok) { unlocked = true; autoBackup(); } return r; });
ipcMain.handle('pin:set', (e, cur, pin) => {
  if (isLocked()) return { ok: false, msg: 'La app está bloqueada' };
  if (typeof pin !== 'string' || !/^\d{4,12}$/.test(pin)) return { ok: false, msg: 'El PIN tiene que tener entre 4 y 12 números' };
  const c = readCfg();
  if (c.pin) { const r = tryPin(cur); if (!r.ok) return r; }
  const salt = crypto.randomBytes(16).toString('hex');
  c.pin = { s: salt, h: hashPin(pin, salt) }; writeCfg(); unlocked = true;
  return { ok: true };
});
ipcMain.handle('pin:clear', (e, cur) => {
  if (isLocked()) return { ok: false, msg: 'La app está bloqueada' };
  const c = readCfg();
  if (!c.pin) return { ok: true };
  const r = tryPin(cur); if (!r.ok) return r;
  delete c.pin; writeCfg(); unlocked = false;
  return { ok: true };
});

ipcMain.handle('photo:save', (e, plantId, dataUrl) => {
  try {
    if (isLocked()) return null;
    if (!okId(plantId) || typeof dataUrl !== 'string') return null;
    const m = /^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
    if (!m) return null;
    const buf = Buffer.from(m[1], 'base64');
    if (buf.length > 12 * 1024 * 1024) return null;
    const dir = path.join(photosDir(), plantId);
    fs.mkdirSync(dir, { recursive: true });
    const name = Date.now() + '.jpg';
    fs.writeFileSync(path.join(dir, name), buf);
    return plantId + '/' + name;
  } catch (err) { return null; }
});
ipcMain.handle('photo:read', (e, rel) => {
  try {
    if (isLocked()) return null;
    const f = safePhotoPath(rel);
    if (!f || !fs.existsSync(f)) return null;
    const buf = fs.readFileSync(f);
    if (buf.length > 15 * 1024 * 1024) return null;
    return 'data:image/jpeg;base64,' + buf.toString('base64');
  } catch (err) { return null; }
});
ipcMain.handle('photo:delete', (e, rel) => { try { if (isLocked()) return false; const f = safePhotoPath(rel); if (f && fs.existsSync(f)) fs.unlinkSync(f); return true; } catch (err) { return false; } });
ipcMain.handle('photo:deletePlant', (e, plantId) => { try { if (isLocked() || !okId(plantId)) return false; fs.rmSync(path.join(photosDir(), plantId), { recursive: true, force: true }); return true; } catch (err) { return false; } });

ipcMain.handle('export', async (e, name, text) => {
  if (isLocked()) return { ok: false };
  if (typeof name !== 'string' || typeof text !== 'string') return { ok: false };
  const r = await dialog.showSaveDialog(win, { defaultPath: path.join(app.getPath('documents'), name.replace(/[\\/:*?"<>|]/g, '-')) });
  if (r.canceled || !r.filePath) return { ok: false };
  try { fs.writeFileSync(r.filePath, text, 'utf8'); return { ok: true }; } catch (err) { return { ok: false, msg: 'No pude guardar el archivo' }; }
});

ipcMain.handle('pdf', async (e, name) => {
  if (isLocked()) return { ok: false };
  const r = await dialog.showSaveDialog(win, { defaultPath: path.join(app.getPath('documents'), String(name || 'Informe.pdf').replace(/[\\/:*?"<>|]/g, '-')), filters: [{ name: 'PDF', extensions: ['pdf'] }] });
  if (r.canceled || !r.filePath) return { ok: false };
  try {
    const buf = await win.webContents.printToPDF({ printBackground: true, pageSize: 'A4', preferCSSPageSize: true });
    fs.writeFileSync(r.filePath, buf);
    shell.showItemInFolder(r.filePath);
    return { ok: true };
  } catch (err) { return { ok: false, msg: 'No pude generar el PDF' }; }
});

ipcMain.handle('backup', async () => {
  if (isLocked()) return { ok: false };
  const r = await dialog.showSaveDialog(win, { defaultPath: path.join(app.getPath('documents'), 'copia-mi-cultivo-' + new Date().toISOString().slice(0, 10) + '.json'), filters: [{ name: 'Copia de Mi Cultivo', extensions: ['json'] }] });
  if (r.canceled || !r.filePath) return { ok: false };
  try {
    const t = loadData();
    const d = t ? JSON.parse(t) : { v: 1, plants: [] };
    [...(d.plants || []), ...(d.archive || [])].forEach((p) => (p.photos || []).forEach((x) => {
      const f = safePhotoPath(x.f);
      if (f && fs.existsSync(f)) x.d = fs.readFileSync(f).toString('base64');
    }));
    fs.writeFileSync(r.filePath, JSON.stringify(d), 'utf8');
    return { ok: true };
  } catch (err) { return { ok: false, msg: 'No pude guardar la copia' }; }
});
ipcMain.handle('restore', async () => {
  if (isLocked()) return { ok: false };
  const r = await dialog.showOpenDialog(win, { defaultPath: fs.existsSync(backupsDir()) ? backupsDir() : app.getPath('documents'), properties: ['openFile'], filters: [{ name: 'Copia de Mi Cultivo', extensions: ['json'] }] });
  if (r.canceled || !r.filePaths[0]) return { ok: false };
  try {
    const d = JSON.parse(fs.readFileSync(r.filePaths[0], 'utf8'));
    if (!d || !Array.isArray(d.plants)) return { ok: false, msg: 'Ese archivo no es una copia de Mi Cultivo' };
    ensureDirs();
    [...d.plants, ...(Array.isArray(d.archive) ? d.archive : [])].forEach((p) => {
      if (!p || !okId(p.id)) return;
      (p.photos || []).forEach((x) => {
        if (x.d && typeof x.f === 'string' && x.f.indexOf('data:') !== 0) {
          const f = safePhotoPath(x.f);
          if (f) { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, Buffer.from(x.d, 'base64')); }
        }
        delete x.d;
      });
    });
    if (fs.existsSync(dataFile())) fs.copyFileSync(dataFile(), path.join(dataDir(), 'antes-de-restaurar.json'));
    return saveData(JSON.stringify(d)) ? { ok: true } : { ok: false, msg: 'No pude restaurar la copia' };
  } catch (err) { return { ok: false, msg: 'No pude leer ese archivo' }; }
});
ipcMain.handle('openDir', () => (isLocked() ? '' : shell.openPath(dataDir())));
ipcMain.handle('notify', (e, title, body) => {
  try {
    if (!Notification.isSupported()) return false;
    const n = new Notification({ title: String(title || 'Mi Cultivo').slice(0, 80), body: String(body || '').slice(0, 300), icon: path.join(__dirname, 'build', 'icon.png'), silent: false });
    n.on('click', () => { if (win) { if (win.isMinimized()) win.restore(); win.show(); win.focus(); } });
    n.show();
    return true;
  } catch (e2) { return false; }
});

/* La IA ahora corre en el servidor del grupo (Supabase + Gemini): la app de escritorio ya no guarda ninguna clave. */
ipcMain.handle('openUrl', (e, url) => {
  try { const u = new URL(String(url)); if (u.protocol !== 'https:') return false; shell.openExternal(u.toString()); return true; } catch (err) { return false; }
});

function createWindow() {
  const st = readCfg().win || {};
  const okBounds = st && st.w > 700 && st.h > 500 &&
    require('electron').screen.getAllDisplays().some(d => {
      const a = d.workArea;
      return st.x + st.w > a.x + 40 && st.x < a.x + a.width - 40 && st.y + st.h > a.y + 40 && st.y < a.y + a.height - 40;
    });
  win = new BrowserWindow({
    width: okBounds ? st.w : 1360, height: okBounds ? st.h : 860,
    x: okBounds ? st.x : undefined, y: okBounds ? st.y : undefined,
    minWidth: 1040, minHeight: 620,
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#08131f' : '#c3e1ee',
    title: 'Mi Cultivo', show: false, autoHideMenuBar: true,
    icon: path.join(__dirname, 'build', 'icon.png'),
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true, spellcheck: false }
  });
  Menu.setApplicationMenu(null);
  win.setMenuBarVisibility(false);
  if (st && st.max) win.maximize();
  win.once('ready-to-show', () => win.show());
  const saveBounds = () => {
    try {
      const c = readCfg();
      const b = win.isMaximized() || win.isMinimized() ? (c.win || {}) : win.getBounds();
      c.win = { x: b.x, y: b.y, w: b.width || (c.win && c.win.w), h: b.height || (c.win && c.win.h), max: win.isMaximized() };
      writeCfg();
    } catch (e) {}
  };
  let bt = null;
  const laterSave = () => { clearTimeout(bt); bt = setTimeout(saveBounds, 700); };
  win.on('resize', laterSave); win.on('move', laterSave);
  win.on('maximize', laterSave); win.on('unmaximize', laterSave);
  win.on('close', saveBounds);
  win.loadFile(path.join(__dirname, 'src', 'index.html'));
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', (ev, url) => { if (!url.startsWith('file://')) ev.preventDefault(); });
  win.webContents.on('before-input-event', (ev, input) => {
    if (input.type !== 'keyDown') return;
    if (input.key === 'F11') { win.setFullScreen(!win.isFullScreen()); ev.preventDefault(); }
    if (input.control && input.shift && input.key.toLowerCase() === 'i' && !app.isPackaged) win.webContents.toggleDevTools();
  });
  win.on('closed', () => { win = null; });
}

if (process.platform === 'win32') { try { app.setAppUserModelId('com.lucci.micultivo'); } catch (e) {} }
app.whenReady().then(() => {
  session.defaultSession.setPermissionRequestHandler((wc, perm, cb) => cb(false));
  createWindow();
  autoBackup();
  setInterval(autoBackup, 30 * 60 * 1000);
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on('second-instance', () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });
app.on('window-all-closed', () => app.quit());
