/* Mi Cultivo: guarda la app para que abra rápido y sin conexión. Los datos (Supabase) nunca se guardan acá. */
const V='__BUILD__';
const SHELL=['./','index.html','app.js','config.js','vendor/supabase.js','vendor/bricolage-grotesque-latin-wght-normal.woff2','vendor/figtree-latin-wght-normal.woff2','manifest.webmanifest','icon-192.png','icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(SHELL.map(u=>new Request(u,{cache:'reload'})))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
 const r=e.request,u=new URL(r.url);
 if(r.method!=='GET'||u.origin!==location.origin)return;           /* todo lo de afuera (Supabase) va directo a la red */
 e.respondWith(caches.match(r,{ignoreSearch:true}).then(hit=>{
  const net=fetch(r,{cache:'no-cache'}).then(res=>{if(res&&res.ok){const cp=res.clone();caches.open(V).then(c=>c.put(r,cp))}return res}).catch(()=>hit);
  return hit&&!/config\.js$/.test(u.pathname)?hit:net}))});
