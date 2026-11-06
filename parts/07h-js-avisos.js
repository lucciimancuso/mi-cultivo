
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
 if(c.flor&&c.flor.length)L.push({t:lst(c.flor)+(c.flor.length===1?' empieza':' empiezan')+' a florecer',b:'Cambiá al fertilizante de floración y cuidá la humedad del ambiente.'});
 if(c.maceta&&c.maceta.length)L.push({t:'Pensá en trasplantar a '+lst(c.maceta),b:'La maceta queda chica para esta genética. Trasplantá a la tarde y regá suave.'});
 if(c.lista&&c.lista.length)L.push({t:lst(c.lista)+(c.lista.length===1?' está lista':' están listas')+' para cosechar',b:'Según la genética ya cumplió la floración. Revisá los tricomas antes de cortar.'});
 if(!L.length)return null;
 if(L.length===1)return{title:L[0].t,body:L[0].b};
 return{title:'Hoy en Mi Cultivo',body:L.map(x=>x.t).join(' · ')}}

/* qué toca en los próximos días. Cada planta avisa cuando a ELLA le toca regar (según su humedad y su ritmo),
   siempre dentro del horario elegido; lo demás (etapas, curado, cosecha) sale al abrirse el horario. */
const AV_JUNTAR=45*60e3;     /* avisos que caen con menos de 45 min de diferencia se consideran "a la vez" */
function avisosVentana(){
 const m=h=>{const x=String(h).split(':').map(Number);return(x[0]||0)*60+(x[1]||0)};
 const a=m(S.set.avisoHora||'09:00');let b=m(S.set.avisoHasta||'21:00');if(b<=a)b=Math.min(1439,a+60);return{a:a,b:b}}
function avisosPlan(){
 const now=Date.now(),W=avisosVentana(),I=[];
 const dayAt=(k,min)=>{const d=new Date(now);d.setDate(d.getDate()+k);d.setHours(Math.floor(min/60),min%60,0,0);return d.getTime()};
 /* un momento cualquiera, llevado adentro del horario */
 const slot=t=>{t=Math.max(t,now+120e3);const d=new Date(t),m=d.getHours()*60+d.getMinutes(),k=dayDiff(now,t);
  if(m<W.a)return dayAt(k,W.a);if(m>W.b)return dayAt(k+1,W.a);return t};
 /* algo del día k (sin hora propia): al abrirse el horario; si hoy ya pasó, mañana */
 const dia=k=>{const t=dayAt(Math.max(0,k),W.a);return t>now+120e3?t:dayAt(Math.max(0,k)+1,W.a)};
 const put=(at,tipo,name)=>{if(at-now>8.5*864e5)return;I.push({at:at,tipo:tipo,name:name})};
 S.plants.forEach(p=>{
  const sd=seedOf(p),h=at0(()=>hum(p)),r=Math.max(.01,at0(()=>rateOf(p,0)));
  if(h>.3)put(slot(now+(h-.3)/r*DAY),'agua',p.name);        /* le toca cuando su humedad llega al punto de riego */
  else{                                                    /* ya le toca: recordatorio en 1 h si tiene sed, 3 h si no; después una vez por día */
   const t1=slot(now+(h<=.2?1:3)*36e5);put(t1,'agua',p.name);
   const k1=dayDiff(now,t1);put(dayAt(k1+1,W.a),'agua2',p.name);put(dayAt(k1+2,W.a),'agua2',p.name)}
  const fs=flowerStart(p);
  if(fs!=null){const tf=p.sownAt+fs*DAY,tc=p.sownAt+(fs+sd.fw*7)*DAY;
   if(tf>now)put(dia(dayDiff(now,tf)),'flor',p.name);
   if(tc>now)put(dia(dayDiff(now,tc)),'lista',p.name)}
  const tv=p.sownAt+22*DAY;                                /* empieza el vegetativo con la maceta chica */
  if(tv>now&&p.pot<sd.pot*.85)put(dia(dayDiff(now,tv)),'maceta',p.name)});
 S.archive.forEach(p=>{const s=curState(p);if(!s)return;
  if(s.fase==='secando')put(dia(s.dias>=7?0:7-s.dias),'tallo',p.name);
  else if(s.fase==='frascos'){
   if(s.lista)put(dia(0),'curada',p.name);
   else{put(dia(s.due?0:curProxAbrir(p,s)),'abrir',p.name);if(s.due)put(dia(0)+864e5,'abrir',p.name)}
   if(!s.lista&&s.dias<CUR_DONE&&CUR_DONE-s.dias<=8)put(dia(CUR_DONE-s.dias),'curada',p.name)}});
 I.sort((a,b)=>a.at-b.at);
 const out=[],pushT=(at,c)=>{const t=avisosTextos(c);if(t)out.push({at:at,title:t.title.slice(0,80),body:t.body.slice(0,200)})};
 /* riego: un aviso por planta; solo si se juntan 5 o más a la vez, va uno solo */
 ['agua','agua2'].forEach(tp=>{const L=I.filter(x=>x.tipo===tp);let i=0;
  while(i<L.length){let j=i;while(j<L.length&&L[j].at-L[i].at<=AV_JUNTAR)j++;const G=L.slice(i,j);
   if(G.length>=5)pushT(G[0].at,{[tp]:G.map(x=>x.name)});else G.forEach((x,n)=>pushT(x.at+n*120e3,{[tp]:[x.name]}));i=j}});
 /* lo demás (etapas, curado, cosecha) se junta por franja */
 let g=null;const cierra=()=>{if(g)pushT(g.at,g.c);g=null};
 I.filter(x=>x.tipo!=='agua'&&x.tipo!=='agua2').forEach(x=>{if(g&&x.at-g.at>AV_JUNTAR)cierra();if(!g)g={at:x.at,c:{}};(g.c[x.tipo]=g.c[x.tipo]||[]).push(x.name)});cierra();
 out.sort((a,b)=>a.at-b.at);
 return out.slice(0,40)}
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
  native:'Cada planta te avisa cuando le toca regar, dentro del horario que elijas, aunque la app esté cerrada. Además: planta con sed, cambio de etapa, cosecha lista y curado',
  push:'Cada planta te avisa cuando le toca regar, dentro del horario que elijas, aunque la app esté cerrada. Además: planta con sed, cambio de etapa, cosecha lista y curado',
  instalar:'En iPhone primero hay que instalar la app: tocá Compartir, después "Agregar a inicio", y abrila desde el ícono',
  nada:'Este navegador no permite avisos. Probá instalando la app en el celu'}[m];
 $('#sAvisosT').textContent=T;
 sw.checked=!!AV.on;sw.disabled=m==='instalar'||m==='nada';
 const sinHora=m==='instalar'||m==='nada';$('#sAvisoGrid').hidden=sinHora;$('#sAvisoBtn').hidden=sinHora;
 $('#sAvisoHasta').closest('.field').hidden=m==='desktop';$('#sAvisoHoraL').textContent=m==='desktop'?'Hora del aviso':'Avisarme desde';
 $('#sAvisoHora').value=S.set.avisoHora||'09:00';$('#sAvisoHasta').value=S.set.avisoHasta||'21:00';
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
   S.set.avisos=true;AV.on=true;AV.perm='granted';await avisosSync(true);toast('Listo: te aviso entre las '+(S.set.avisoHora||'09:00')+' y las '+(S.set.avisoHasta||'21:00'));return}
  if(m==='push'){
   const perm=await Notification.requestPermission();AV.perm=perm;
   if(perm!=='granted'){toast(perm==='denied'?'Las notificaciones están bloqueadas: habilitalas en los ajustes del celu':'No diste el permiso para avisarte');return}
   const reg=await navigator.serviceWorker.ready;let sub=await reg.pushManager.getSubscription();
   const key=b64uBytes(VAPID_PUB);
   if(sub&&!sameBytes(sub.options&&sub.options.applicationServerKey,key)){try{await sub.unsubscribe()}catch(e){}sub=null}
   if(!sub)sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:key});
   const j=sub.toJSON();
   await rpc('push_subscribe',{p_endpoint:j.endpoint,p_p256dh:j.keys.p256dh,p_auth:j.keys.auth});
   AV.endpoint=j.endpoint;S.set.avisos=true;AV.on=true;await avisosSync(true);toast('Listo: te aviso entre las '+(S.set.avisoHora||'09:00')+' y las '+(S.set.avisoHasta||'21:00'));return}
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
 AV.msg='';
 try{
  if(m==='native'){await LN().schedule({notifications:[{id:999,title:'Prueba de avisos',body:'Si ves esto, los avisos de Mi Cultivo funcionan en este celu.',smallIcon:'ic_stat_icon',iconColor:'#1E5B3A',schedule:{at:new Date(Date.now()+5000),allowWhileIdle:true}}]});toast('Te llega en unos segundos');return}
  if(m==='push'){
   /* 1) una notificación local, al instante: si no sale, el problema es el permiso o el navegador */
   let local=true;
   try{const reg=await navigator.serviceWorker.ready;await reg.showNotification('Prueba local',{body:'Si ves esto, este celu puede mostrar los avisos de Mi Cultivo.',icon:'icon-192.png',tag:'mc-prueba-local'})}
   catch(e){local=false;AV.msg='Este navegador no pudo mostrar la notificación ('+((e&&e.message)||'error')+'). Revisá el permiso de notificaciones del sitio.'}
   /* 2) un push de verdad por el servidor, también al instante */
   const r=await avisosPruebaServidor();
   if(r.ok){toast(local?'Te mandé dos avisos: uno local y otro desde el servidor':'Te mandé el aviso desde el servidor')}
   else{AV.msg=(AV.msg?AV.msg+' ':'')+r.msg;toast('El aviso del servidor no salió: mirá el mensaje de abajo')}
   avisosPintar()}
 }catch(e){toast('No pude pedir el aviso de prueba')}}
async function avisosPruebaServidor(){
 try{
  const ss=await cloud.sb.auth.getSession(),tok=ss.data&&ss.data.session&&ss.data.session.access_token;
  if(!tok)return{ok:false,msg:'Tu sesión venció, volvé a entrar.'};
  if(!AV.endpoint)return{ok:false,msg:'Este celu no está dado de alta: apagá y volvé a activar los avisos.'};
  const res=await fetch(CFG.url+'/functions/v1/notify',{method:'POST',headers:{'content-type':'application/json',authorization:'Bearer '+tok,apikey:CFG.anonKey},body:JSON.stringify({test:true,endpoint:AV.endpoint})});
  let j=null;try{j=await res.json()}catch(e){}
  if(res.ok&&j&&j.ok)return{ok:true};
  if(res.status===404&&!(j&&j.msg))return{ok:false,msg:'La función "notify" no está desplegada en Supabase (falta el paso de crearla).'};
  if(res.status===401&&j&&/autorizado/i.test(j.msg||'')){ /* función vieja: solo entendía al reloj; dejo la prueba en cola */
   try{await rpc('push_test',{p_endpoint:AV.endpoint});return{ok:false,msg:'Tu función "notify" es la versión vieja: pegá el index.ts nuevo y desplegala. Mientras tanto dejé un aviso en cola: llega en menos de 5 minutos.'}}catch(e){}}
  return{ok:false,msg:(j&&j.msg)||('El servidor contestó '+res.status+'.')}
 }catch(e){return{ok:false,msg:'No pude hablar con el servidor: revisá tu conexión.'}}}
/* al salir de la cuenta: este celu deja de recibir avisos de ese grupo */
async function avisosAlSalir(){
 try{if(avisosModo()==='push'){const reg=await navigator.serviceWorker.ready,sub=await reg.pushManager.getSubscription();
   if(sub){await rpc('push_unsubscribe',{p_endpoint:sub.endpoint});await sub.unsubscribe()}}
  else if(avisosModo()==='native'){const ln=LN(),p=await ln.getPending();if(p.notifications&&p.notifications.length)await ln.cancel({notifications:p.notifications})}}catch(e){}}
function avisosInit(){
 avisosEstado().then(()=>avisosSync(false));
 setInterval(()=>{if(!document.hidden)avisosSync(false)},30000);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)avisosEstado().then(()=>avisosSync(false))})}
