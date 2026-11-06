// Se ejecuta después de armar la carpeta de la app.
// 1) Saca los idiomas de Chromium que no se usan (ahorra ~35 MB).
// 2) En Windows, le pone el ícono propio al .exe (no se puede hacer desde Linux).
const fs = require('fs');
const path = require('path');

exports.default = async function (context) {
  const dir = context.appOutDir;
  try {
    const loc = path.join(dir, 'locales');
    if (fs.existsSync(loc)) {
      const keep = new Set(['es.pak', 'es-419.pak', 'en-US.pak']);
      for (const f of fs.readdirSync(loc)) if (f.endsWith('.pak') && !keep.has(f)) fs.unlinkSync(path.join(loc, f));
    }
  } catch (e) { console.log('No pude limpiar los idiomas:', e.message); }

  if (process.platform === 'win32') {
    try {
      const exe = path.join(dir, context.packager.appInfo.productFilename + '.exe');
      const mod = require('rcedit');
      const rcedit = mod.rcedit || mod.default || mod;
      await rcedit(exe, {
        icon: path.join(__dirname, 'icon.ico'),
        'version-string': { ProductName: 'Mi Cultivo', FileDescription: 'Mi Cultivo', CompanyName: 'Lucci', LegalCopyright: 'Lucci' },
        'file-version': context.packager.appInfo.version,
        'product-version': context.packager.appInfo.version
      });
      console.log('Ícono aplicado al .exe');
    } catch (e) { console.log('No pude poner el ícono al .exe (la app funciona igual):', e.message); }
  }
};
