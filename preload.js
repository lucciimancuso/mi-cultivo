'use strict';
const { contextBridge, ipcRenderer } = require('electron');
const paths = ipcRenderer.sendSync('paths');
contextBridge.exposeInMainWorld('api', {
  isDesktop: true,
  photosBase: paths.photosBase,
  load: () => ipcRenderer.invoke('load'),
  save: (j) => ipcRenderer.invoke('save', j),
  saveSync: (j) => ipcRenderer.sendSync('saveSync', j),
  savePhoto: (id, dataUrl) => ipcRenderer.invoke('photo:save', id, dataUrl),
  readPhoto: (rel) => ipcRenderer.invoke('photo:read', rel),
  deletePhoto: (rel) => ipcRenderer.invoke('photo:delete', rel),
  deletePlantPhotos: (id) => ipcRenderer.invoke('photo:deletePlant', id),
  exportFile: (name, text) => ipcRenderer.invoke('export', name, text),
  printPdf: (name) => ipcRenderer.invoke('pdf', name),
  backup: () => ipcRenderer.invoke('backup'),
  restore: () => ipcRenderer.invoke('restore'),
  openDir: () => ipcRenderer.invoke('openDir'),
  notify: (t, b) => ipcRenderer.invoke('notify', t, b),
  cfgGet: () => ipcRenderer.invoke('cfg:get'),
  cfgSet: (o) => ipcRenderer.invoke('cfg:set', o),
  lockNow: () => ipcRenderer.invoke('lock:now'),
  unlock: (pin) => ipcRenderer.invoke('lock:unlock', pin),
  pinSet: (cur, pin) => ipcRenderer.invoke('pin:set', cur, pin),
  pinClear: (cur) => ipcRenderer.invoke('pin:clear', cur),
  openUrl: (u) => ipcRenderer.invoke('openUrl', u)
});
