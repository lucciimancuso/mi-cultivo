
/* ---------- avisos: riego, frascos y cosecha ----------
   El celu calcula qué toca en los próximos días ("plan") y lo deja listo para que salga a la hora elegida:
   - iPhone / Android instalado como app: el plan se guarda en Supabase y una función del servidor manda el push (aunque la app esté cerrada).
   - APK: se programan notificaciones locales en el propio celu.
   - Windows: la notificación de siempre, mientras la app está abierta. */
const VAPID_PUB='BOlXRQ_xl3jv8VyvNTysCyjSvq-5tcdmnLWICXa8hZo408TSpX0xYeYDFevNfJEbyusaa4cIJwYrWOhY24v_yAc';
const AV={mode:'',on:false,perm:'',endpoint:'',lastSig:'',syncing:false,again:false,msg:''};
const isNative=()=>{try{return !!(window.Capacitor&&Capacitor.isNativePlatform&&Capacitor.isNativePlatform())}catch(e){return false}};
/* en una app sin empaquetador el plugin hay que pedirlo con registerPlugin; isPluginAvailable dice si el APK lo trae */
const LN=()=>{try{const C=window.Capacitor;if(!isNative()||!C.isPluginAvailable||!C.isPluginAvailable('LocalNotifications'))return null;return AV.ln||(AV.ln=C.registerPlugin('LocalNotifications'))}catch(e){return null}};
const isStandalone=()=>{try{return matchMedia('(display-mode: standalone)').matches||navigator.standalone===true}catch(e){return false}};
const isIOS=()=>/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
const pushOk=()=>!!(cloud.cfg&&cloud.on&&'serviceWorker' in navigator&&'PushManager' in window&&'Notification' in window&&(location.protocol==='https:'||location.hostname==='localhost'));
function avisosModo(){
 if(store.isDesktop)return'desktop';
 if(LN())return'native';
 if(isIOS()&&!isStandalone())return'instalar';
 if(pushOk())return'push';
 return'nada'}
const b64uBytes=s=>{const p='='.repeat((4-s.length%4)%4),b=atob((s+p).replace(/-/g,'+').replace(/_/g,'/')),u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return u};
const sameBytes=(a,b)=>{if(!a||!b||a.byteLength!==b.byteLength)return false;const x=new Uint8Array(a),y=new Uint8Array(b);for(let i=0;i<x.length;i++)if(x[i]!==y[i])return false;return true};

/* texto de un aviso a partir de lo que toca */
function avisosTextos(c){
 const L=[],lst=A=>A.length<=2?A.join(' y '):A.slice(0,2).join(', ')+' y '+(A.length-2)+' más';
 if(c.agua&&c.agua.length)L.push(c.agua.length===1?{t:c.agua[0]+' necesita agua',b:'Está en punto de riego. Registrá el riego cuando la riegues.'}:{t:c.agua.length+' plantas necesitan agua',b:lst(c.agua)});
 if(c.agua2&&c.agua2.length)L.push({t:'Sigue pidiendo agua: '+lst(c.agua2),b:'Pasó un día y no registraste el riego.'});
 if(c.abrir&&c.abrir.length)L.push({t:c.abrir.length===1?'Abrir el frasco de '+c.abrir[0]:'Abrir los frascos ('+c.abrir.length+')',b:'Unos 10 a 15 minutos para que salga la humedad.'});
 if(c.tallo&&c.tallo.length)L.push({t:'Probar el tallo de '+lst(c.tallo),b:'Si se quiebra en vez de doblarse, pasala a frascos.'});
 if(c.curada&&c.curada.length)L.push({t:lst(c.curada)+(c.curada.length===1?' cumplió':' cumplieron')+' 4 semanas de curado',b:'Ya podés darla por curada.'});
 if(c.lista&&c.lista.length)L.push({t:lst(c.lista)+(c.lista.length===1?' está lista':' están listas')+' para cosechar',b:'Según la genética ya cumplió la floración. Revisá los tricomas antes de cortar.'});
 if(!L.length)return null;
 if(L.length===1)return{title:L[0].t,body:L[0].b};
 return{title:'Hoy en Mi Cultivo',body:L.map(x=>x.t).join(' · ')}}

/* qué toca en los próximos días, un aviso por día a la hora elegida */
function avisosPlan(){
 const now=Date.now(),hm=String(S.set.avisoHora||'09:00').split(':').map(Number),B=new Map();
 const at=k=>{const d=new Date(now);d.setDate(d.getDate()+k);d.setHours(hm[0]||0,hm[1]||0,0,0);return d.getTime()};
 const prox=k=>at(k)>now+90e3?k:k+1;                 /* si la hora de hoy ya pasó, sale mañana */
 const put=(k,tipo,name)=>{if(k<0||k>8)return;const b=B.get(k)||{};(b[tipo]=b[tipo]||[]).push(name);B.set(k,b)};
 S.plants.forEach(p=>{
  const d=at0(()=>waterDays(p));
  if(d<=0){const k=prox(0);put(k,'agua',p.name);put(k+1,'agua2',p.name)}
  else put(prox(d),'agua',p.name);
  const fs=flowerStart(p),sd=seedOf(p);
  if(fs!=null){const tc=p.sownAt+(fs+sd.fw*7)*DAY;if(tc>now)put(prox(dayDiff(now,tc)),'lista',p.name)}});
 S.archive.forEach(p=>{const s=curState(p);if(!s)return;
  if(s.fase==='secando'){put(prox(s.dias>=7?0:7-s.dias),'tallo',p.name)}
  else if(s.fase==='frascos'){
   if(s.lista)put(prox(0),'curada',p.name);
   else{put(prox(s.due?0:curProxAbrir(p,s)),'abrir',p.name);if(s.due)put(prox(0)+1,'abrir',p.name)}
   if(!s.lista&&s.dias<CUR_DONE&&CUR_DONE-s.dias<=8)put(prox(CUR_DONE-s.dias),'curada',p.name)}});
 const out=[];
 [...B.keys()].sort((a,b)=>a-b).forEach(k=>{const t=avisosTextos(B.get(k));if(t)out.push({at:at(k),title:t.title.slice(0,80),body:t.body.slice(0,200)})});
 return out}
/* días hasta el próximo "abrir el frasco" de una planta que hoy no lo necesita */
function curProxAbrir(p,s){
 const B=((p.cur&&p.cur.burps)||[]).map(b=>b.t).filter(t=>t>=p.cur.jar),last=B.length?Math.max.apply(null,B):p.cur.jar;
 return Math.max(1,s.iv-dayDiff(last,Date.now()))}

/* estado real de este celu */
async function avisosEstado(){
 const m=avisosModo();AV.mode=m;AV.perm='';AV.endpoint='';AV.on=false;
 try{
  if(m==='native'){const r=await LN().checkPermissions();AV.perm=r.display||'';AV.on=!!S.set.avisos&&AV.perm==='granted'}
  else if(m==='push'){AV.perm=Notification.permission;const reg=await navigator.serviceWorker.ready,sub=await reg.pushManager.getSubscription();
   if(sub){AV.endpoint=sub.endpoint;AV.on=!!S.set.avisos&&AV.perm==='granted'}}
  else if(m==='desktop')AV.on=!!S.set.avisos;
 }catch(e){}
 avisosPintar()}
function avisosPintar(){
 const sw=$('#sAvisos');if(!sw)return;
 const m=AV.mode||avisosModo(),T={
  desktop:'Te aviso con una notificación de Windows cuando alguna planta llega al punto de riego o toca revisar lo cosechado',
  native:'Te llega una notificación a la hora que elijas, aunque la app esté cerrada: riego, frascos y cosecha lista',
  push:'Te llega una notificación a la hora que elijas, aunque la app esté cerrada: riego, frascos y cosecha lista',
  instalar:'En iPhone primero hay que instalar la app: tocá Compartir, después "Agregar a inicio", y abrila desde el ícono',
  nada:'Este navegador no permite avisos. Probá instalando la app en el celu'}[m];
 $('#sAvisosT').textContent=T;
 sw.checked=!!AV.on;sw.disabled=m==='instalar'||m==='nada';
 $('#sAvisoGrid').hidden=m==='instalar'||m==='nada';
 $('#sAvisoHora').value=S.set.avisoHora||'09:00';
 const est=$('#sAvisoEst');let x='';
 if((m==='push'||m==='native')&&AV.perm==='denied')x='Las notificaciones están bloqueadas para esta app. Habilitalas en los ajustes del celu y volvé a activar el aviso.';
 else if(AV.msg)x=AV.msg;
 else if(AV.on&&(m==='push'||m==='native'))x='Activado en este celu. El aviso sale una vez por día, a la hora elegida, solo si hay algo para hacer.';
 est.textContent=x;est.hidden=!x}
async function avisosActivar(){
 const m=avisosModo();AV.mode=m;AV.msg='';
 try{
  if(m==='desktop'){S.set.avisos=true;AV.on=true;toast('Listo: te aviso cuando alguna planta pida agua');return}
  if(m==='native'){const r=await LN().requestPermissions();if(r.display!=='granted'){AV.perm=r.display||'denied';toast('Sin el permiso no puedo avisarte. Habilitalo en los ajustes del celu');return}
   S.set.avisos=true;AV.on=true;AV.perm='granted';await avisosSync(true);toast('Listo: te aviso a las '+(S.set.avisoHora||'09:00'));return}
  if(m==='push'){
   const perm=await Notification.requestPermission();AV.perm=perm;
   if(perm!=='granted'){toast(perm==='denied'?'Las notificaciones están bloqueadas: habilitalas en los ajustes del celu':'No diste el permiso para avisarte');return}
   const reg=await navigator.serviceWorker.ready;let sub=await reg.pushManager.getSubscription();
   const key=b64uBytes(VAPID_PUB);
   if(sub&&!sameBytes(sub.options&&sub.options.applicationServerKey,key)){try{await sub.unsubscribe()}catch(e){}sub=null}
   if(!sub)sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:key});
   const j=sub.toJSON();
   await rpc('push_subscribe',{p_endpoint:j.endpoint,p_p256dh:j.keys.p256dh,p_auth:j.keys.auth});
   AV.endpoint=j.endpoint;S.set.avisos=true;AV.on=true;await avisosSync(true);toast('Listo: te aviso a las '+(S.set.avisoHora||'09:00'));return}
  toast('Este celu no permite avisos')
 }catch(e){AV.on=false;AV.msg='No pude activar los avisos: '+((e&&e.message)||'error')+'. Si recién actualizaste el servidor, revisá que hayas corrido el SQL de avisos.';toast('No pude activar los avisos')}
 finally{avisosPintar()}}
async function avisosApagar(){
 S.set.avisos=false;AV.on=false;AV.msg='';AV.lastSig='';
 try{
  if(AV.mode==='native'){const ln=LN(),p=await ln.getPending();if(p.notifications&&p.notifications.length)await ln.cancel({notifications:p.notifications})}
  else if(AV.mode==='push'){const reg=await navigator.serviceWorker.ready,sub=await reg.pushManager.getSubscription();
   if(sub){try{await rpc('push_unsubscribe',{p_endpoint:sub.endpoint})}catch(e){}try{await sub.unsubscribe()}catch(e){}}AV.endpoint=''}
 }catch(e){}
 avisosPintar();toast('Avisos apagados')}
/* sube / programa lo que viene; solo si cambió */
async function avisosSync(force){
 const m=avisosModo();if(m!=='push'&&m!=='native')return;
 if(!S.set.avisos||!AV.on)return;
 if(AV.syncing){AV.again=true;return}
 const plan=avisosPlan(),sig=JSON.stringify(plan);
 if(!force&&sig===AV.lastSig)return;
 AV.syncing=true;
 try{
  if(m==='native'){const ln=LN(),p=await ln.getPending();
   if(p.notifications&&p.notifications.length)await ln.cancel({notifications:p.notifications});
   if(plan.length)await ln.schedule({notifications:plan.map((x,i)=>({id:101+i,title:x.title,body:x.body,smallIcon:'ic_stat_icon',iconColor:'#1E5B3A',schedule:{at:new Date(x.at),allowWhileIdle:true}}))})}
  else{if(!AV.endpoint)return;await rpc('push_plan_set',{p_endpoint:AV.endpoint,p_items:plan})}
  AV.lastSig=sig;if(AV.msg){AV.msg='';avisosPintar()}
 }catch(e){AV.lastSig='';if(force){AV.msg='No pude guardar los avisos: '+((e&&e.message)||'error');avisosPintar()}}
 finally{AV.syncing=false;if(AV.again){AV.again=false;setTimeout(()=>avisosSync(false),800)}}}
async function avisosProbar(){
 const m=avisosModo();
 if(m==='desktop'){chequearAvisos(true);return}
 if(!AV.on){toast('Primero activá los avisos');return}
 try{
  if(m==='native'){await LN().schedule({notifications:[{id:999,title:'Prueba de avisos',body:'Si ves esto, los avisos de Mi Cultivo funcionan en este celu.',smallIcon:'ic_stat_icon',iconColor:'#1E5B3A',schedule:{at:new Date(Date.now()+5000),allowWhileIdle:true}}]});toast('Te llega en unos segundos');return}
  if(m==='push'){if(!AV.endpoint){toast('Primero activá los avisos');return}await rpc('push_test',{p_endpoint:AV.endpoint});toast('Listo: en unos minutos te llega el aviso de prueba')}
 }catch(e){toast('No pude pedir el aviso de prueba')}}
/* al salir de la cuenta: este celu deja de recibir avisos de ese grupo */
async function avisosAlSalir(){
 try{if(avisosModo()==='push'){const reg=await navigator.serviceWorker.ready,sub=await reg.pushManager.getSubscription();
   if(sub){await rpc('push_unsubscribe',{p_endpoint:sub.endpoint});await sub.unsubscribe()}}
  else if(avisosModo()==='native'){const ln=LN(),p=await ln.getPending();if(p.notifications&&p.notifications.length)await ln.cancel({notifications:p.notifications})}}catch(e){}}
function avisosInit(){
 avisosEstado().then(()=>avisosSync(false));
 setInterval(()=>{if(!document.hidden)avisosSync(false)},30000);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)avisosEstado().then(()=>avisosSync(false))})}
