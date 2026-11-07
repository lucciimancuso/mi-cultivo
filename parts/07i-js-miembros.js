/* ---------- miembros: quién está en el grupo y quién tiene la app abierta ahora ----------
   "Conectado" sale de Supabase Realtime Presence: cada equipo con la app abierta se anota en un canal del grupo y se borra solo
   al cerrar la app o perder internet. No se guarda nada en la base de datos: solo viaja el id del usuario, si la app está a la vista
   y la hora. La lista de nombres sale de my_grow() (la misma de Ajustes). Sirve igual en Windows, web/PWA y APK. */
const PRES={ch:null,state:'off',on:{},seen:{},hb:0,tick:0,n:0,refreshing:false,lastGrow:0,retry:0,bound:false};
const presMe=()=>(cloud.grow&&cloud.grow.me)||(cloud.user&&cloud.user.id)||'';
const presKey=()=>'micultivo-seen-'+(cloud.grow&&cloud.grow.id);
function presPayload(){return{name:(cloud.grow&&cloud.grow.display_name)||'',vis:!document.hidden,t:Date.now()}}
const presHidden=()=>lsGet('micultivo-invisible')==='1';
/* modo invisible: no se anota en el canal, así que los demás ven "Desconectado" aunque la app esté abierta */
function presTrack(){if(PRES.ch&&PRES.state==='on'){try{const r=presHidden()?PRES.ch.untrack():PRES.ch.track(presPayload());if(r&&r.catch)r.catch(()=>{})}catch(e){}}}
function presLive(){return PRES.state==='on'&&navigator.onLine!==false}

function startPresence(){
 if(PRES.ch||!cloud.sb||!cloud.grow||!cloud.user)return;
 try{PRES.seen=JSON.parse(lsGet(presKey())||'{}')||{}}catch(e){PRES.seen={}}
 PRES.state='connecting';PRES.on={};
 try{
  const ch=cloud.sb.channel('presence-'+cloud.grow.id,{config:{presence:{key:presMe()}}});
  PRES.ch=ch;
  ch.on('presence',{event:'sync'},()=>{if(PRES.ch===ch)presSync()});
  ch.subscribe(st=>{
   if(PRES.ch!==ch)return;
   if(st==='SUBSCRIBED'){PRES.state='on';presTrack();presSync()}
   else if(st==='CHANNEL_ERROR'||st==='TIMED_OUT'||st==='CLOSED'){PRES.state='err';presDraw()}});
 }catch(e){PRES.state='err'}
 clearInterval(PRES.hb);clearInterval(PRES.tick);
 PRES.hb=setInterval(presTrack,45000);
 PRES.tick=setInterval(()=>{if(document.hidden||S.view!=='miembros')return;PRES.n++;presDraw();if(PRES.n%2===0)presRefreshMembers()},30000);
 if(!PRES.bound){PRES.bound=true;
  document.addEventListener('visibilitychange',()=>{
   if(!PRES.ch&&cloud.on&&cloud.grow&&!document.hidden){startPresence();return}
   if(PRES.state==='on')presTrack();else if(!document.hidden&&PRES.ch&&PRES.state==='err')presRestart()});
  addEventListener('online',()=>{if(PRES.state!=='on')presRestart();else presDraw()});
  addEventListener('offline',presDraw);
  addEventListener('pagehide',()=>{try{if(PRES.ch)PRES.ch.untrack()}catch(e){}})}
 presDraw()}
function stopPresence(){
 clearInterval(PRES.hb);clearInterval(PRES.tick);
 const ch=PRES.ch;PRES.ch=null;PRES.state='off';PRES.on={};
 if(ch){try{ch.untrack()}catch(e){}try{cloud.sb.removeChannel(ch)}catch(e){}}}
function presRestart(){stopPresence();startPresence()}

function presSync(){
 if(!PRES.ch)return;
 let st={};try{st=PRES.ch.presenceState()||{}}catch(e){}
 const now=Date.now(),on={};
 Object.keys(st).forEach(k=>{const metas=st[k]||[];if(!metas.length)return;
  on[k]={name:(metas[metas.length-1]||{}).name||'',vis:metas.some(m=>m&&m.vis!==false)}});
 Object.keys(on).forEach(k=>{PRES.seen[k]=now});
 Object.keys(PRES.on).forEach(k=>{if(!on[k])PRES.seen[k]=now});
 PRES.on=on;lsSet(presKey(),JSON.stringify(PRES.seen));
 const known=new Set(((cloud.grow&&cloud.grow.members)||[]).map(m=>m.user_id));
 if(Object.keys(on).some(k=>!known.has(k)))presRefreshMembers();
 presDraw()}
async function presRefreshMembers(){
 if(PRES.refreshing||!cloud.on||!cloud.sb)return;
 const n=Date.now(),wait=10000-(n-PRES.lastGrow);
 if(wait>0){if(!PRES.retry)PRES.retry=setTimeout(()=>{PRES.retry=0;presRefreshMembers()},wait+50);return}
 PRES.refreshing=true;PRES.lastGrow=n;
 try{const g=await myGrow();if(g&&cloud.grow&&g.id===cloud.grow.id)cloud.grow=g}catch(e){}
 PRES.refreshing=false;presDraw()}

function presAgo(ts){
 const s=Math.max(0,(Date.now()-ts)/1000);if(s<90)return'hace un momento';
 const m=Math.round(s/60);if(m<60)return'hace '+m+' min';
 const h=Math.round(m/60);if(h<24)return'hace '+h+(h===1?' hora':' horas');
 const d=Math.round(h/24);return d<30?'hace '+d+(d===1?' día':' días'):'hace más de un mes'}
/* estado de cada miembro: on (conectado), off (desconectado), wait (conectando), unk (no se puede saber sin conexión) */
function presOf(m){
 const me=m.user_id===presMe(),live=presLive();
 if(me){if(live)return presHidden()?{k:'hid',t:'Oculto',s:'solo lo ves vos'}:{k:'on',t:'Conectado',s:''};return PRES.state==='connecting'&&navigator.onLine!==false?{k:'wait',t:'Conectando…',s:''}:{k:'off',t:'Sin conexión',s:''}}
 if(!live)return{k:'unk',t:'Sin datos',s:'sin conexión no se sabe'};
 const o=PRES.on[m.user_id];
 if(o)return{k:'on',t:'Conectado',s:o.vis?'':'app en segundo plano'};
 const sn=PRES.seen[m.user_id];
 return{k:'off',t:'Desconectado',s:sn?'visto '+presAgo(sn):''}}
function presList(){
 const g=cloud.grow,mem=(Array.isArray(g&&g.members)?g.members:[]).map(m=>Object.assign({},m,{st:presOf(m)}));
 const rank=m=>(m.user_id===presMe()?0:m.st.k==='on'?1:m.st.k==='unk'?2:3);
 return mem.sort((a,b)=>rank(a)-rank(b)||String(a.display_name).localeCompare(String(b.display_name),'es'))}

const MEM_ICO='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5"/><circle cx="17" cy="9" r="2.4"/><path d="M17.5 14.6c2.3.3 3.8 2 3.8 4.4"/></svg>';
function renderMiembros(){
 const b=$('#memBody');if(!b)return;
 if(!cloud.cfg||!cloud.on||!cloud.grow){
  b.innerHTML='<div class="mem-empty"><span class="mem-ico">'+MEM_ICO+'</span><h2>Todavía no estás en un grupo</h2><p class="hint">Entrá con tu cuenta para compartir el cultivo con tus amigos y ver quién está conectado.</p>'+
   (cloud.cfg?'<div class="row"><button class="btn primary" data-mem="entrar" type="button">Entrar o crear cuenta</button></div>':'')+'</div>';return}
 const g=cloud.grow,list=presList(),n=list.length,k=list.filter(m=>m.st.k==='on').length,live=presLive();
 const liveT=live?'En vivo':PRES.state==='connecting'&&navigator.onLine!==false?'Conectando…':'Sin conexión',liveK=live?'on':liveT==='Conectando…'?'wait':'off';
 b.innerHTML='<div class="mem-head"><span class="mem-ico">'+MEM_ICO+'</span><div class="mem-title"><span class="mem-k">Tu grupo</span><h2>'+esc(g.name)+'</h2>'+
  '<span class="mem-sub">'+n+(n===1?' miembro':' miembros')+(live?' · '+k+(k===1?' conectado':' conectados'):'')+'</span></div>'+
  '<span class="mem-live" data-k="'+liveK+'">'+liveT+'</span></div>'+
  (live?'':'<p class="mem-note" role="status">'+(liveK==='wait'?'Conectando con el grupo…':'Sin conexión no puedo ver quién está conectado. Se actualiza solo cuando vuelve internet.')+'</p>')+
  '<ul class="mem-list" aria-label="Miembros del grupo">'+list.map(m=>{
   const me=m.user_id===presMe(),nm=String(m.display_name||'?').trim()||'?',ini=Array.from(nm)[0].toUpperCase();
   return'<li class="mem-row" data-k="'+m.st.k+'"><span class="mem-av" aria-hidden="true"><b>'+esc(ini)+'</b><i class="mem-dot"></i></span>'+
    '<span class="mem-who"><b>'+esc(nm)+(me?' <small>(vos)</small>':'')+'</b><span>'+(m.role==='owner'?'Creó el grupo':'Miembro')+'</span></span>'+
    '<span class="mem-st"><b>'+m.st.t+'</b>'+(m.st.s?'<small>'+esc(m.st.s)+'</small>':'')+'</span></li>'}).join('')+'</ul>'+
  '<label class="sw mem-inv"><input type="checkbox" id="memVis"'+(presHidden()?'':' checked')+'><span class="knob"></span><span class="t">Aparecer conectado<small>Si lo apagás, tus amigos te ven como «Desconectado» aunque tengas la app abierta. Vale para este equipo.</small></span></label>'+
  '<p class="hint">Conectado quiere decir que tiene la app abierta en este momento, en la compu o en el celu.</p>'+
  '<div class="row"><button class="btn" data-mem="ajustes" type="button">Invitar o administrar el grupo</button></div>'}
function presDraw(){
 const pip=$('#memPip');
 if(pip){const others=presLive()&&Object.keys(PRES.on).some(k=>k!==presMe());pip.hidden=!others;
  const t=$('.tab[data-go="miembros"]');if(t)t.setAttribute('aria-label',others?'Miembros, hay gente conectada':'Miembros')}
 if(S.view==='miembros')renderMiembros()}
renderers.miembros=()=>{renderMiembros();presRefreshMembers()};
$('#memBody').addEventListener('click',e=>{const t=e.target.closest('button[data-mem]');if(!t)return;
 if(t.dataset.mem==='ajustes')go('ajustes');
 else if(t.dataset.mem==='entrar'){lsDel('micultivo-nocloud');location.reload()}});
$('#memBody').addEventListener('change',e=>{if(e.target.id!=='memVis')return;
 if(e.target.checked)lsDel('micultivo-invisible');else lsSet('micultivo-invisible','1');
 presTrack();renderMiembros();toast(e.target.checked?'Tus amigos te ven cuando tenés la app abierta':'Ahora te ven como desconectado')});
