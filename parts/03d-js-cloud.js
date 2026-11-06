
/* ---------- nube: cuentas, grupo compartido, sincronización, fotos e IA ---------- */
const CFG=window.CLOUD_CFG||{};
document.documentElement.dataset.platform=store.isDesktop?'desktop':'web';if(!window.THREE)document.documentElement.dataset.nod='1';
const lsGet=k=>{try{return localStorage.getItem(k)}catch(e){return null}};
const lsSet=(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}};
const lsDel=k=>{try{localStorage.removeItem(k)}catch(e){}};
const cloud={
 cfg:!!(CFG.url&&CFG.anonKey&&window.supabase&&/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(CFG.url)),
 sb:null,user:null,grow:null,on:false,rev:0,base:null,lastJSON:'',status:'off',pushing:false,again:false,timer:0,chan:null,poll:0,
 imgs:new Map(),imgQ:[],imgBusy:0,offline:false};
const origStore=Object.assign({},store);
const AUTH_ES=[[/Invalid login credentials/i,'Email o contraseña incorrectos'],[/already registered|already been registered/i,'Ese email ya tiene cuenta: entrá con tu contraseña'],
 [/Email not confirmed/i,'Falta confirmar el email: revisá tu casilla'],[/at least \d+ char/i,'La contraseña es muy corta (mínimo 8 caracteres)'],
 [/rate limit|too many|security purposes/i,'Demasiados intentos, esperá un rato y probá de nuevo'],[/valid email|invalid format/i,'Ese email no parece válido'],
 [/weak|easy to guess|pwned/i,'Esa contraseña es muy fácil de adivinar, probá otra']];
function cerr(e){const m=String((e&&e.message)||e||'');
 for(const [re,t] of AUTH_ES)if(re.test(m))return t;
 if(/fetch|network|Failed to|Load failed|NetworkError/i.test(m))return'Sin conexión: revisá internet';
 return m.replace(/^.*?:\s*/,function(x){return x.length<24?'':x}).slice(0,160)||'Algo salió mal'}
const rpc=async(n,a)=>{const r=await cloud.sb.rpc(n,a||{});if(r.error)throw r.error;return r.data};
const myGrow=async()=>{const g=await rpc('my_grow');if(g)lsSet('micultivo-growcache',JSON.stringify(g));return g};
const sharedNow=()=>sharedOf(snapshot());
const baseKey=()=>'micultivo-base-'+(cloud.grow&&cloud.grow.id);
function loadBase(){try{return JSON.parse(lsGet(baseKey())||'null')}catch(e){return null}}
function saveBase(){lsSet(baseKey(),JSON.stringify({rev:cloud.rev,data:cloud.base}))}
function setStatus(s){cloud.status=s;document.body.dataset.sync=s;const t={ok:'Sincronizado',sync:'Guardando…',off:'',offline:'Sin conexión: se guarda acá y se sube al volver',err:'No se pudo sincronizar'}[s]||'';
 const el=document.getElementById('syncTxt');if(el)el.textContent=t;const d=document.getElementById('syncDot');if(d){d.hidden=!cloud.on;d.title=t}}
function applyShared(sh){const mine=snapshot();hydrate(Object.assign({},sh,{set:mine.set,sel:mine.sel,room:mine.room,day:mine.day}))}
function cloudRefresh(){const a=document.activeElement;if(a&&/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)&&a.closest&&a.closest('.view'))return;
 try{if(typeof renderers!=='undefined'&&renderers[S.view])renderers[S.view]();stageSync();renderToday()}catch(e){}}

/* ----- estado compartido ----- */
async function fetchRev(){const r=await cloud.sb.from('grow_rev').select('rev,updated_by').eq('grow_id',cloud.grow.id).maybeSingle();if(r.error)throw r.error;return r.data}
async function fetchState(){const r=await cloud.sb.from('grow_state').select('data,rev').eq('grow_id',cloud.grow.id).single();if(r.error)throw r.error;return r.data}
async function pull(force){
 if(!cloud.on||cloud.pulling)return;cloud.pulling=true;
 try{
  if(!force){const r=await fetchRev();if(!r||r.rev<=cloud.rev){cloud.offline=false;if(cloud.status!=='sync')setStatus('ok');return}}
  const rem=await fetchState();
  const loc=sharedNow(),merged=mergeShared(cloud.base,loc,rem.data||{});
  applyShared(merged);cloud.rev=rem.rev;cloud.base=rem.data||{};saveBase();cloud.offline=false;
  if(!jEq(sharedOf(merged),cloud.base)){cloud.lastJSON='';schedulePush(400)}else{cloud.lastJSON=JSON.stringify(sharedNow())}
  setStatus('ok');cloudRefresh();lastSaved='';
 }catch(e){cloud.offline=true;setStatus('offline')}finally{cloud.pulling=false}}
function schedulePush(ms){if(!cloud.on)return;clearTimeout(cloud.timer);cloud.timer=setTimeout(push,ms==null?2500:ms)}
async function push(){
 if(!cloud.on)return;if(cloud.pushing){cloud.again=true;return}
 const sh=sharedNow(),j=JSON.stringify(sh);if(j===cloud.lastJSON){if(!cloud.offline)setStatus('ok');return}
 cloud.pushing=true;setStatus('sync');
 try{
  const r=await rpc('save_state',{p_grow:cloud.grow.id,p_base_rev:cloud.rev,p_data:sh});
  if(r&&r.ok){cloud.rev=r.rev;cloud.base=sh;cloud.lastJSON=j;saveBase();cloud.offline=false;setStatus('ok')}
  else if(r&&r.conflict){cloud.pushing=false;await pull(true);cloud.again=true}
  else setStatus('err')
 }catch(e){cloud.offline=/fetch|network|Failed|Load failed/i.test(String(e&&e.message));setStatus(cloud.offline?'offline':'err');clearTimeout(cloud.timer);cloud.timer=setTimeout(push,15000)}
 finally{cloud.pushing=false;if(cloud.again){cloud.again=false;setTimeout(push,300)}}}
cloud.touch=()=>{if(cloud.on&&JSON.stringify(sharedNow())!==cloud.lastJSON)schedulePush()};
function startSync(){
 if(cloud.chan)return;
 try{cloud.chan=cloud.sb.channel('grow-'+cloud.grow.id).on('postgres_changes',{event:'UPDATE',schema:'public',table:'grow_rev',filter:'grow_id=eq.'+cloud.grow.id},p=>{if(p.new&&p.new.rev>cloud.rev)pull()}).subscribe()}catch(e){}
 cloud.poll=setInterval(()=>{if(!document.hidden)pull()},30000);
 document.addEventListener('visibilitychange',()=>{if(document.hidden){clearTimeout(cloud.timer);push()}else pull()});
 addEventListener('online',()=>{pull();push()});
}
cloud.initialSync=async()=>{
 const gid=cloud.grow.id,last=lsGet('micultivo-growid');
 if(last&&last!==gid){ /* este equipo venía de otro grupo: guardo una copia y arranco con lo del grupo nuevo */
  try{lsSet('micultivo-prelink-'+Date.now(),JSON.stringify(snapshot()))}catch(e){}
  hydrate(Object.assign({},{plants:[],archive:[],grows:[],env:[],stock:[],hist:{},rooms:[{id:'r1'}]}));lsDel('micultivo-base-'+last)}
 lsSet('micultivo-growid',gid);
 try{
  const rem=await fetchState(),loc=sharedNow(),b=loadBase();
  const remEmpty=!rem.data||!Object.keys(rem.data).length;
  cloud.rev=rem.rev;
  if(remEmpty){cloud.base={};cloud.lastJSON='';await push()}
  else{const merged=mergeShared(b&&b.data||null,loc,rem.data);applyShared(merged);cloud.base=rem.data;saveBase();
   cloud.lastJSON=jEq(sharedOf(merged),rem.data)?JSON.stringify(sharedNow()):'';if(cloud.lastJSON==='')schedulePush(600)}
  setStatus('ok')
 }catch(e){cloud.offline=true;const b=loadBase();if(b){cloud.rev=b.rev;cloud.base=b.data}setStatus('offline');schedulePush(15000)}
 startSync();setTimeout(migratePhotos,4000)};

/* ----- fotos en Storage ----- */
const GIF1='data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
function fitJpeg(dataUrl,maxDim,q){return new Promise((res,rej)=>{const im=new Image();im.onload=()=>{let w=im.naturalWidth,h=im.naturalHeight;const k=Math.min(1,maxDim/Math.max(w,h));w=Math.max(1,Math.round(w*k));h=Math.max(1,Math.round(h*k));
 const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,w,h);x.drawImage(im,0,0,w,h);c.toBlob(b=>b?res(b):rej(new Error('No pude preparar la foto')),'image/jpeg',q)};im.onerror=()=>rej(new Error('No pude leer la foto'));im.src=dataUrl})}
async function uploadPhoto(pid,dataUrl){
 let b=await fitJpeg(dataUrl,1280,.8);if(b.size>1400000)b=await fitJpeg(dataUrl,900,.7);
 const path=cloud.grow.id+'/'+String(pid).replace(/[^A-Za-z0-9_-]/g,'')+'/'+Date.now().toString(36)+Math.random().toString(36).slice(2,6)+'.jpg';
 const r=await cloud.sb.storage.from('grow-photos').upload(path,b,{contentType:'image/jpeg',upsert:false});if(r.error)throw r.error;
 cloud.imgs.set(path,URL.createObjectURL(b));return'c:'+path}
function imgPump(){while(cloud.imgBusy<3&&cloud.imgQ.length){const p=cloud.imgQ.shift();cloud.imgBusy++;
 cloud.sb.storage.from('grow-photos').download(p).then(r=>{if(r.error||!r.data)return;const u=URL.createObjectURL(r.data);cloud.imgs.set(p,u);
  const tag='#'+p;Array.from(document.images).forEach(im=>{if(im.src.slice(-tag.length)===tag)im.src=u})}).catch(()=>{}).finally(()=>{cloud.imgBusy--;imgPump()})}}
cloud.imgSrc=p=>{if(!p||!/^[0-9a-f-]{36}\/[A-Za-z0-9_-]+\/[A-Za-z0-9]+\.jpg$/.test(p))return GIF1;
 if(cloud.imgs.has(p))return cloud.imgs.get(p);
 if(cloud.on&&cloud.imgQ.indexOf(p)<0){cloud.imgQ.push(p);imgPump()}return GIF1+'#'+p};
async function readCloudPhoto(f){const p=f.slice(2);const r=await cloud.sb.storage.from('grow-photos').download(p);if(r.error||!r.data)return null;
 return await new Promise(res=>{const fr=new FileReader();fr.onload=()=>res(fr.result);fr.onerror=()=>res(null);fr.readAsDataURL(r.data)})}
async function migratePhotos(){ /* fotos viejas que estaban solo en esta compu: se suben una vez */
 if(!cloud.on||!store.isDesktop||cloud.migrating)return;cloud.migrating=true;let n=0;
 try{for(const p of S.plants.concat(S.archive)){for(const x of p.photos){
  if(!x||!x.f||x.f.indexOf('c:')===0||x.f.indexOf('data:')===0)continue;
  const d=await origStore.readPhoto(x.f);if(!d)continue;
  try{x.f=await uploadPhoto(p.id,d);n++}catch(e){return}}}}
 finally{cloud.migrating=false;if(n){toast('Subí '+n+' foto'+(n>1?'s':'')+' al grupo');saveNow(false)}}}

/* ----- IA (Gemini, vía la función del servidor) ----- */
async function callAI(task,payload){
 if(window.__AIMOCK)return window.__AIMOCK(task,payload);
 if(!cloud.on)return{ok:false,msg:'Entrá con tu cuenta para usar la IA'};
 const s=await cloud.sb.auth.getSession(),tok=s.data&&s.data.session&&s.data.session.access_token;
 if(!tok)return{ok:false,msg:'Tu sesión venció, volvé a entrar'};
 const ctl=new AbortController(),to=setTimeout(()=>ctl.abort(),120000);
 try{const res=await fetch(CFG.url+'/functions/v1/ai',{method:'POST',signal:ctl.signal,headers:{'content-type':'application/json',authorization:'Bearer '+tok,apikey:CFG.anonKey},body:JSON.stringify(Object.assign({task:task},payload))});
  let j=null;try{j=await res.json()}catch(e){}
  if(j&&typeof j==='object'&&'ok' in j)return j;
  return{ok:false,msg:res.status===404?'La IA todavía no está instalada en el servidor':'La IA respondió con un error ('+res.status+')'}
 }catch(e){return{ok:false,msg:e&&e.name==='AbortError'?'La IA tardó demasiado':'No pude conectar (¿hay internet?)'}}finally{clearTimeout(to)}}
store.hasKey=async()=>cloud.on||!!window.__AIMOCK;
store.analyze=p=>callAI('analyze',{image:p&&p.image,context:p&&p.context});
store.lookup=(kind,q)=>callAI('lookup',{kind:kind,query:q});
store.ask=(question,context)=>callAI('ask',{question:question,context:context});
store.guide=pdf=>callAI('guide',{pdf:pdf});
store.setKey=async()=>({ok:false});store.clearKey=async()=>true;
store.savePhoto=(id,u)=>cloud.on?uploadPhoto(id,u):origStore.savePhoto(id,u);
store.readPhoto=async f=>(f&&f.indexOf('c:')===0)?readCloudPhoto(f):origStore.readPhoto(f);
store.deletePhoto=async f=>{if(f&&f.indexOf('c:')===0){try{await cloud.sb.storage.from('grow-photos').remove([f.slice(2)])}catch(e){}return true}return origStore.deletePhoto(f)};
store.deletePlantPhotos=async id=>{
 if(cloud.on){try{const dir=cloud.grow.id+'/'+String(id).replace(/[^A-Za-z0-9_-]/g,'');const l=await cloud.sb.storage.from('grow-photos').list(dir,{limit:500});
  if(l.data&&l.data.length)await cloud.sb.storage.from('grow-photos').remove(l.data.map(o=>dir+'/'+o.name))}catch(e){}}
 return origStore.deletePlantPhotos(id)};

/* ----- cuenta y grupo ----- */
cloud.signUp=async(email,pw)=>{const r=await cloud.sb.auth.signUp({email:email,password:pw});if(r.error)throw r.error;
 if(!r.data.session)throw new Error('CONFIRMAR');cloud.user=r.data.user};
cloud.signIn=async(email,pw)=>{const r=await cloud.sb.auth.signInWithPassword({email:email,password:pw});if(r.error)throw r.error;cloud.user=r.data.user};
cloud.createGrow=async(name,dn)=>{await rpc('create_grow',{p_name:name,p_display:dn});cloud.grow=await myGrow()};
cloud.joinGrow=async(code,dn)=>{const r=await rpc('join_grow',{p_code:code,p_display:dn});if(!r||r.ok!==true)throw new Error((r&&r.error)||'No pude unirme');cloud.grow=await myGrow()};
cloud.rotate=async()=>{await rpc('rotate_code',{p_grow:cloud.grow.id});cloud.grow=await myGrow()};
cloud.kick=async uid=>{await rpc('remove_member',{p_grow:cloud.grow.id,p_user:uid});cloud.grow=await myGrow()};
cloud.leave=async()=>{await rpc('leave_grow')};
cloud.deleteGrow=async()=>{await rpc('delete_grow',{p_grow:cloud.grow.id})};
cloud.signOut=async()=>{try{await cloud.sb.auth.signOut()}catch(e){}
 if(!store.isDesktop){try{Object.keys(localStorage).filter(k=>/^micultivo/.test(k)).forEach(k=>localStorage.removeItem(k))}catch(e){}}
 else{lsDel('micultivo-growid')}
 location.reload()};

/* pantalla de entrada */
function authGate(){return new Promise(resolve=>{
 const box=document.getElementById('authGate'),q=s=>box.querySelector(s);
 let mode='in',gmode='new';
 const msg=(t,ok)=>{const m=q('#agMsg');m.textContent=t||'';m.dataset.ok=ok?'1':''};
 const step=n=>{q('#agS1').hidden=n!==1;q('#agS2').hidden=n!==2;msg('');if(n===1)q('#agMail').focus();else q('#agName').focus()};
 const setMode=m=>{mode=m;q('#agTabs').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.m===m)));
  q('#agGo').textContent=m==='in'?'Entrar':'Crear cuenta';q('#agPw').autocomplete=m==='in'?'current-password':'new-password';
  q('#agSub').textContent=m==='in'?'Entrá con tu cuenta para ver tu cultivo compartido.':'Creá tu cuenta (te pide solo email y contraseña).'};
 const setG=m=>{gmode=m;q('#agGTabs').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.g===m)));
  q('#agGroupF').hidden=m!=='new';q('#agCodeF').hidden=m!=='join';q('#agGo2').textContent=m==='new'?'Crear grupo':'Unirme';
  q('#agSub').textContent=m==='new'?'Vos creás el grupo y después compartís el código con tus amigos.':'Pedile el código de 10 letras a quien creó el grupo.'};
 q('#agSkip').hidden=!store.isDesktop;
 const finish=()=>{box.hidden=true;delete document.body.dataset.gate;resolve('ready')};
 q('#agTabs').onclick=e=>{const b=e.target.closest('button[data-m]');if(b){setMode(b.dataset.m);msg('')}};
 q('#agGTabs').onclick=e=>{const b=e.target.closest('button[data-g]');if(b){setG(b.dataset.g);msg('')}};
 q('#agPwEye').onclick=()=>{const p=q('#agPw');p.type=p.type==='password'?'text':'password';q('#agPwEye').textContent=p.type==='password'?'Ver':'Ocultar'};
 q('#agAuth').onsubmit=async ev=>{ev.preventDefault();const email=q('#agMail').value.trim(),pw=q('#agPw').value;
  if(!/^\S+@\S+\.\S+$/.test(email)){msg('Escribí un email válido');return}
  if(pw.length<8){msg('La contraseña tiene que tener al menos 8 caracteres');return}
  const btn=q('#agGo');btn.disabled=true;msg(mode==='in'?'Entrando…':'Creando tu cuenta…',true);
  try{if(mode==='in')await cloud.signIn(email,pw);else await cloud.signUp(email,pw);
   cloud.grow=await myGrow();if(cloud.grow)finish();else{setG('new');step(2)}
  }catch(err){if(err&&err.message==='CONFIRMAR'){msg('Listo. Te mandamos un mail para confirmar la cuenta; confirmalo y después entrá.',true);setMode('in')}else msg(cerr(err))}
  finally{btn.disabled=false}};
 q('#agGrowF').onsubmit=async ev=>{ev.preventDefault();const dn=q('#agName').value.trim();
  if(!dn){msg('Escribí tu nombre (lo ven tus amigos)');return}
  const btn=q('#agGo2');btn.disabled=true;msg('Un segundo…',true);
  try{if(gmode==='new'){const gn=q('#agGroup').value.trim();if(!gn){msg('Ponele un nombre al grupo');btn.disabled=false;return}await cloud.createGrow(gn,dn)}
   else{const c=q('#agCode').value.trim();if(c.replace(/[^A-Za-z0-9]/g,'').length<8){msg('El código tiene 10 letras y números');btn.disabled=false;return}await cloud.joinGrow(c,dn)}
   finish()
  }catch(err){msg(cerr(err))}finally{btn.disabled=false}};
 q('#agOut').onclick=async()=>{try{await cloud.sb.auth.signOut()}catch(e){}cloud.user=null;step(1)};
 q('#agSkip').onclick=()=>{lsSet('micultivo-nocloud','1');box.hidden=true;delete document.body.dataset.gate;resolve('skip')};
 document.body.dataset.gate='1';box.hidden=false;setMode('in');setG('new');
 if(cloud.user&&!cloud.grow){setG('new');step(2)}else step(1)})}

cloud.boot=async()=>{
 if(!cloud.cfg)return'off';
 cloud.sb=window.supabase.createClient(CFG.url,CFG.anonKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false,storageKey:'micultivo-auth'}});
 const skip=store.isDesktop&&lsGet('micultivo-nocloud')==='1';
 let r='ready';
 try{const s=await cloud.sb.auth.getSession();cloud.user=s.data.session?s.data.session.user:null;
  if(skip&&!cloud.user)return'off';
  if(cloud.user)cloud.grow=await myGrow()}
 catch(e){ /* sin internet: si ya habíamos entrado, seguimos con lo guardado */
  if(skip)return'off';
  try{cloud.grow=JSON.parse(lsGet('micultivo-growcache')||'null')}catch(_){}
  if(cloud.grow&&cloud.user){cloud.offline=true}else cloud.grow=null}
 if(!cloud.user||!cloud.grow)r=await authGate();
 if(r!=='ready')return'off';
 cloud.on=true;document.body.dataset.cloud='1';return'ready'};
