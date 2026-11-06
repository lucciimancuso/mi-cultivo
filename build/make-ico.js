// Genera build/icon.ico (PNG dentro de ICO) a partir de icon.png. Uso: node build/make-ico.js
const sharp = require('sharp'); const fs = require('fs'); const path = require('path');
(async () => {
  const sizes = [16, 24, 32, 48, 64, 128, 256];
  const bufs = [];
  for (const s of sizes) bufs.push(await sharp(path.join(__dirname, 'icon.png')).resize(s, s).png().toBuffer());
  const head = Buffer.alloc(6); head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(sizes.length, 4);
  let off = 6 + 16 * sizes.length; const dir = [];
  sizes.forEach((s, i) => { const e = Buffer.alloc(16); e[0] = s === 256 ? 0 : s; e[1] = s === 256 ? 0 : s; e.writeUInt16LE(1, 4); e.writeUInt16LE(32, 6); e.writeUInt32LE(bufs[i].length, 8); e.writeUInt32LE(off, 12); off += bufs[i].length; dir.push(e); });
  fs.writeFileSync(path.join(__dirname, 'icon.ico'), Buffer.concat([head, ...dir, ...bufs]));
  console.log('icon.ico listo');
})();
