
/* ---------- guardado en la compu ---------- */
/* bloqueo con PIN en el navegador/celu: guarda un hash PBKDF2 (210.000 vueltas) con sal; es una traba de pantalla, no cifra los datos */
const WL={k:'micultivo-pin',kf:'micultivo-pinfail',
 get(){try{return JSON.parse(localStorage.getItem(this.k)||'null')}catch(e){return null}},
 unlocked(){try{return sessionStorage.getItem('micultivo-unl')==='1'}catch(e){return false}},
 hex:b=>Array.from(new Uint8Array(b)).map(x=>x.toString(16).padStart(2,'0')).join(''),
 unhex:h=>new Uint8Array((h.match(/../g)||[]).map(x=>parseInt(x,16))),
 async hash(pin,salt){const k=await crypto.subtle.importKey('raw',new TextEncoder().encode(String(pin)),'PBKDF2',false,['deriveBits']);
  return this.hex(await crypto.subtle.deriveBits({name:'PBKDF2',salt:salt,iterations:210000,hash:'SHA-256'},k,256))},
 failState(){try{return JSON.parse(localStorage.getItem(this.kf)||'{"n":0,"until":0}')}catch(e){return{n:0,until:0}}},
 async check(pin){const p=this.get();if(!p)return{ok:true};const f=this.failState(),now=Date.now();
  if(now<f.until)return{ok:false,msg:'Demasiados intentos. Esperá '+Math.ceil((f.until-now)/1000)+' segundos.'};
  const h=await this.hash(pin,this.unhex(p.s));let d=h.length^p.h.length;for(let i=0;i<h.length;i++)d|=h.charCodeAt(i)^(p.h.charCodeAt(i)||0);
  if(d===0){localStorage.removeItem(this.kf);return{ok:true}}
  f.n++;if(f.n>=5){f.n=0;f.until=now+30000;localStorage.setItem(this.kf,JSON.stringify(f));return{ok:false,msg:'Demasiados intentos. Esperá 30 segundos.'}}
  localStorage.setItem(this.kf,JSON.stringify(f));return{ok:false,msg:'PIN incorrecto. Te quedan '+(5-f.n)+' intentos.'}}};
const store=Object.assign({},(window.api&&window.api.isDesktop)?window.api:{
 isDesktop:false,photosBase:'',
 load:async()=>{try{return localStorage.getItem('micultivo')}catch(e){return null}},
 save:async(j)=>{try{localStorage.setItem('micultivo',j);return true}catch(e){return false}},
 saveSync:j=>{try{localStorage.setItem('micultivo',j)}catch(e){}},
 savePhoto:async(id,dataUrl)=>dataUrl,
 deletePhoto:async()=>true,deletePlantPhotos:async()=>true,
 exportFile:async(name,text,mime)=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type:mime||'text/plain'}));a.download=name;document.body.appendChild(a);a.click();a.remove();return{ok:true}},
 backup:async()=>({ok:false,msg:'La copia de seguridad está en la app de escritorio'}),restore:async()=>({ok:false}),openDir:async()=>{},
 printPdf:async()=>{window.print();return{ok:true}},
 readPhoto:async()=>null,cfgGet:async()=>{const p=WL.get();return{desktop:false,web:true,locked:!!p&&!WL.unlocked(),hasPin:!!p,autoBackup:false}},cfgSet:async()=>({ok:false}),lockNow:async()=>{try{sessionStorage.removeItem('micultivo-unl')}catch(e){}return{ok:true}},unlock:async pin=>{const r=await WL.check(pin);if(r.ok){try{sessionStorage.setItem('micultivo-unl','1')}catch(e){}}return r},pinSet:async(cur,pin)=>{if(!/^\d{4,12}$/.test(pin))return{ok:false,msg:'El PIN tiene que tener entre 4 y 12 números'};if(WL.get()){const r=await WL.check(cur);if(!r.ok)return r}const salt=crypto.getRandomValues(new Uint8Array(16));localStorage.setItem(WL.k,JSON.stringify({s:WL.hex(salt),h:await WL.hash(pin,salt)}));try{sessionStorage.setItem('micultivo-unl','1')}catch(e){}return{ok:true}},pinClear:async cur=>{const r=await WL.check(cur);if(!r.ok)return r;localStorage.removeItem(WL.k);return{ok:true}},
 notify:async()=>false,
 hasKey:async()=>false,setKey:async()=>({ok:false,msg:'Solo en la app de escritorio'}),clearKey:async()=>true,analyze:async()=>({ok:false,msg:'Solo en la app de escritorio'}),lookup:async()=>({ok:false,msg:'Solo en la app de escritorio'}),openUrl:async u=>{try{window.open(u,'_blank','noopener')}catch(e){}return true}

});
const dayKey=t=>{const d=new Date(t==null?Date.now():t);return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())};
const photoSrc=x=>x&&x.f?(x.f.indexOf('data:')===0?x.f:x.f.indexOf('c:')===0?cloud.imgSrc(x.f.slice(2)):store.photosBase+encodeURI(x.f)):'';
const fmtD=(t,o)=>new Date(t).toLocaleDateString('es-AR',o||{day:'numeric',month:'numeric'});
const fmtDT=t=>fmtD(t)+' '+new Date(t).toLocaleTimeString('es-AR',{hour:'2-digit',minute:'2-digit',hour12:false});
const fmtN=n=>String(Math.round(n*10)/10).replace('.',',');
const sameDay=(a,b)=>dayKey(a)===dayKey(b);
function logEv(p,k,x){p.notes.unshift({t:Date.now(),k:k,x:x})}
function refreshAges(){S.plants.forEach(p=>{p.age=Math.max(0,(Date.now()-p.sownAt)/DAY)});S.archive.forEach(p=>{p.age=Math.max(0,((p.harvest&&p.harvest.t||Date.now())-p.sownAt)/DAY)})}
function recordHist(){const k=dayKey();S.plants.forEach(p=>{(S.hist[p.id]=S.hist[p.id]||{})[k]=at0(()=>statusOf(p)).tone})}
const stripP=p=>{const q=Object.assign({},p);delete q.age;return q};
function snapshot(){return{v:2,cost:S.cost,plants:S.plants.map(stripP),archive:S.archive.map(stripP),grows:S.grows,grow:S.grow,env:S.env,stock:S.stock,seedEdits:S.seedEdits,have:[...S.have],rooms:S.rooms,room:S.room,seeds:SEEDS.filter(s=>s.custom),ferts:FERTS.filter(f=>f.custom),subs:S.subs,set:S.set,hist:S.hist,sel:S.sel,day:S.day,guide:S.guide||null}}
function seedFromEdit(s,e){const auto=s.kind==='auto',lo=+e.lo,hi=+e.hi,fw=Math.round(+e.fw);
 s.fw=fw;s.flow=auto?'Florece sola; ciclo total de '+(3+fw)+' a '+(5+fw)+' semanas':Math.max(1,fw-1)+' a '+(fw+1)+' semanas';
 s.hcm=lo+' a '+hi+' cm';s.H=Math.max(.2,+(((lo+hi)/2/45)/(1+s.stretch)-.12).toFixed(2));s.pot=+e.pot||s.pot;s.diff=Math.min(5,Math.max(1,+e.diff||s.diff));if(typeof e.note==='string')s.note=e.note;s.edited=true}
function cleanPlant(p){p.notes=Array.isArray(p.notes)?p.notes:[];p.photos=Array.isArray(p.photos)?p.photos:[];p.meas=Array.isArray(p.meas)?p.meas:[];
  if(p.madre&&typeof p.madre!=='string')delete p.madre;
  p.sownAt=+p.sownAt||Date.now();p.t0=+p.t0||Date.now();p.h0=isFinite(p.h0)?p.h0:.7;p.rate=p.rate>0?p.rate:.07;p.pot=+p.pot||11;p.hour=p.hour||'12:00';return p}
function hydrate(d){
 if(!d||typeof d!=='object')return;
 (d.seeds||[]).forEach(s=>{if(s&&s.id&&!SEEDS.some(x=>x.id===s.id))SEEDS.push(s)});
 (d.ferts||[]).forEach(f=>{if(f&&f.id&&f.name&&!FERTS.some(x=>x.id===f.id))FERTS.push(f)});
 S.subs=Array.isArray(d.subs)?d.subs.filter(x=>x&&x.name):[];
 S.seedEdits=d.seedEdits&&typeof d.seedEdits==='object'?d.seedEdits:{};
 Object.keys(S.seedEdits).forEach(id=>{const s=SEEDS.find(x=>x.id===id);if(s)seedFromEdit(s,S.seedEdits[id])});
 const ok=p=>p&&p.id&&p.seed;
 S.plants=(Array.isArray(d.plants)?d.plants:[]).filter(ok).map(cleanPlant);
 S.archive=(Array.isArray(d.archive)?d.archive:[]).filter(ok).map(cleanPlant);
 S.grows=Array.isArray(d.grows)?d.grows.filter(g=>g&&g.id):[];S.grow=d.grow||null;
 S.env=Array.isArray(d.env)?d.env.filter(e=>e&&e.t):[];S.stock=Array.isArray(d.stock)?d.stock.filter(x=>x&&x.id&&x.seed):[];
 S.have.clear();(Array.isArray(d.have)?d.have:[]).forEach(x=>S.have.add(x));
 if(d.set)Object.assign(S.set,d.set);
 S.cost=Object.assign({},COST0,d.cost&&typeof d.cost==='object'?d.cost:{});
 S.hist=d.hist&&typeof d.hist==='object'?d.hist:{};
 S.guide=d.guide&&typeof d.guide==='object'&&typeof d.guide.text==='string'&&d.guide.text?{name:String(d.guide.name||'Guía').slice(0,80),text:d.guide.text.slice(0,40000),t:+d.guide.t||0,by:String(d.guide.by||'').slice(0,30)}:null;
 S.sel=S.plants.some(p=>p.id===d.sel)?d.sel:(S.plants[0]?S.plants[0].id:null);
 if(typeof d.day==='boolean')S.day=d.day;
 S.rooms=(Array.isArray(d.rooms)?d.rooms.filter(r=>r&&r.id).map(r=>({id:String(r.id),name:String(r.name||'').trim().slice(0,14)})):[]);if(!S.rooms.length)S.rooms=[{id:'r1'}];
 S.room=S.rooms.some(r=>r.id===d.room)?d.room:S.rooms[0].id;ensurePlacement();
 ensureGrow();refreshAges()}
function ensureGrow(){if(!S.grows.length){S.grows.push({id:'g1',name:'Ciclo 1',start:S.plants.length||S.archive.length?Math.min.apply(null,S.plants.concat(S.archive).map(p=>p.sownAt)):Date.now()});S.grow='g1'}
 if(!S.grows.some(g=>g.id===S.grow))S.grow=S.grows[S.grows.length-1].id;
 S.plants.concat(S.archive).forEach(p=>{if(!p.grow||!S.grows.some(g=>g.id===p.grow))p.grow=S.grows[0].id})}
let lastSaved='';
function saveNow(sync){const j=JSON.stringify(snapshot());if(j===lastSaved)return;lastSaved=j;if(sync)store.saveSync(j);else store.save(j);if(cloud.on)cloud.touch()}
function startAutosave(){lastSaved=JSON.stringify(snapshot());setInterval(()=>saveNow(false),1500);
 addEventListener('beforeunload',()=>saveNow(true));document.addEventListener('visibilitychange',()=>{if(document.hidden)saveNow(true)})}
async function loadAll(){let raw=null;try{raw=await store.load()}catch(e){}
 if(raw){try{hydrate(JSON.parse(raw))}catch(e){toast('No pude leer los datos guardados. Quedó una copia aparte.')}}
 ensureGrow();recordHist()}
