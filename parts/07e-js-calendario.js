/* ---------- calendario: lo hecho y lo que viene ---------- */
let calMes=null,calSel=null;
const dKey=t=>dayKey(t);
const TIPOS={riego:['Riego','ri'],fert:['Fertilizante','fe'],poda:['Poda o atado','po'],foto:['Foto','fo'],medida:['Medición','me'],cosecha:['Cosecha','co'],nota:['Nota','no'],flor:['Empieza a florecer','fl'],lista:['Lista para cosechar','li'],plan:['Riego previsto','pl'],siembra:['Siembra','si'],cura:['Secado y curado','cu']};
/* junta lo registrado y lo proyectado en un mapa por día */
function calData(){
 const M={},add=(t,tipo,txt,pid)=>{const k=dKey(t);(M[k]=M[k]||[]).push({tipo:tipo,txt:txt,pid:pid,t:t})};
 allPlants().forEach(p=>{
  add(p.sownAt,'siembra',p.name+': siembra',p.id);
  p.notes.forEach(n=>{const tipo=TIPOS[n.k]?n.k:'nota';add(n.t,tipo,p.name+': '+n.x,p.id)});
  p.photos.forEach(f=>add(f.t,'foto',p.name+': foto',p.id));
  if(p.harvest&&p.harvest.t)add(p.harvest.t,'cosecha',p.name+': cosechada'+(p.harvest.dry!=null?' ('+fmtN(p.harvest.dry)+' g secos)':''),p.id)});
 const hoy=Date.now();
 S.archive.forEach(p=>{const s=curState(p);if(!s)return;
  if(s.fase==='secando'){const t=p.harvest.t+10*DAY;if(t>hoy)add(t,'cura',p.name+': probar el tallo (estimado)',p.id)}
  if(s.fase==='frascos'){const t=s.jar+CUR_DONE*DAY;if(t>hoy)add(t,'cura',p.name+': cumple 4 semanas de curado (estimado)',p.id)}});
 S.plants.forEach(p=>{
  const s=seedOf(p),fs=flowerStart(p);
  if(fs!=null){const tf=p.sownAt+fs*DAY;if(tf>hoy)add(tf,'flor',p.name+': arranca la floración',p.id);
   const tc=p.sownAt+(fs+s.fw*7)*DAY;if(tc>hoy)add(tc,'lista',p.name+': lista para cosechar (estimado)',p.id)}
  /* riegos previstos: el primero según la humedad de hoy y después según cuánto tarda en secarse */
  const r=at0(()=>rateOf(p,0)),iv=Math.max(1,Math.round((.86-.3)/Math.max(.02,r)));
  let d=at0(()=>waterDays(p));
  for(let i=0;i<10;i++){const t=hoy+d*DAY;if(d>0||i>0)add(t,'plan',p.name+': riego previsto',p.id);d+=iv;if(d>70)break}});
 return M}
function renderCalendario(){
 const now=new Date();if(!calMes)calMes=new Date(now.getFullYear(),now.getMonth(),1);
 const M=calData(),y=calMes.getFullYear(),m=calMes.getMonth();
 $('#calTitle').textContent=MESES[m][0].toUpperCase()+MESES[m].slice(1)+' '+y;
 const first=new Date(y,m,1),start=(first.getDay()+6)%7,dias=new Date(y,m+1,0).getDate();
 let html='<div class="cal-h">'+['lun','mar','mié','jue','vie','sáb','dom'].map(d=>'<span>'+d+'</span>').join('')+'</div><div class="cal-b">';
 for(let i=0;i<start;i++)html+='<span class="cal-d off"></span>';
 for(let d=1;d<=dias;d++){
  const k=y+'-'+pad(m+1)+'-'+pad(d),ev=(M[k]||[]),hoy=k===dKey(Date.now());
  const tipos=[];ev.forEach(e=>{if(!tipos.includes(e.tipo))tipos.push(e.tipo)});
  html+='<button type="button" class="cal-d'+(hoy?' hoy':'')+(calSel===k?' sel':'')+(ev.length?' con':'')+'" data-cd="'+k+'"><b>'+d+'</b>'+
   '<span class="pts">'+tipos.slice(0,4).map(t=>'<i class="pt '+TIPOS[t][1]+'" title="'+esc(TIPOS[t][0])+'"></i>').join('')+'</span>'+
   (ev.length>1?'<small>'+ev.length+'</small>':'')+'</button>'}
 html+='</div>';
 $('#calGrid').innerHTML=html;
 $('#calLeg').innerHTML=['riego','plan','fert','flor','lista','cosecha','cura','foto'].map(t=>'<span class="lg"><i class="pt '+TIPOS[t][1]+'"></i>'+TIPOS[t][0]+'</span>').join('');
 const k=calSel||dKey(Date.now()),ev=(M[k]||[]).slice().sort((a,b)=>a.t-b.t);
 const fecha=new Date(k+'T12:00:00').toLocaleDateString('es-AR',{weekday:'long',day:'numeric',month:'long'});
 $('#calDet').innerHTML='<div class="glass card" style="margin-top:16px"><h2>'+esc(fecha[0].toUpperCase()+fecha.slice(1))+'</h2>'+
  (ev.length?'<ul class="evlist">'+ev.map(e=>'<li><i class="pt '+TIPOS[e.tipo][1]+'"></i><span>'+esc(e.txt)+'</span><small>'+esc(TIPOS[e.tipo][0])+'</small></li>').join('')+'</ul>'
   :'<p class="muted">Nada anotado ni previsto para este día.</p>')+'</div>'}
$('#calGrid').addEventListener('click',e=>{const b=e.target.closest('[data-cd]');if(!b)return;calSel=b.dataset.cd;renderCalendario()});
$('#calPrev').addEventListener('click',()=>{calMes=new Date(calMes.getFullYear(),calMes.getMonth()-1,1);renderCalendario()});
$('#calNext').addEventListener('click',()=>{calMes=new Date(calMes.getFullYear(),calMes.getMonth()+1,1);renderCalendario()});
$('#calNow').addEventListener('click',()=>{const n=new Date();calMes=new Date(n.getFullYear(),n.getMonth(),1);calSel=dKey(Date.now());renderCalendario()});
renderers.calendario=renderCalendario;

/* ---------- avisos de riego ---------- */
function plantasQueRiegan(){return S.plants.filter(p=>{const t=at0(()=>statusOf(p)).tone;return t==='water'||(t==='warn'&&at0(()=>hum(p))<=.2)})}
function chequearAvisos(forzar){
 if(!store.isDesktop||!S.set.avisos)return;
 const hoy=dayKey(),hora=String(S.set.avisoHora||'09:00'),n=new Date();
 const hm=pad(n.getHours())+':'+pad(n.getMinutes());
 if(!forzar&&(hm<hora||S.set.avisoDia===hoy))return;
 const c=curPend(),msg=avisosTextos({agua:plantasQueRiegan().map(p=>p.name),abrir:c.abrir.map(p=>p.name),tallo:c.probar.map(p=>p.name),curada:c.listas.map(p=>p.name)});
 if(!forzar)S.set.avisoDia=hoy;
 if(!msg){if(forzar)toast('No hay nada para avisarte ahora mismo');return}
 store.notify(msg.title,msg.body);if(forzar)toast('Te mandé un aviso de prueba')}
setInterval(()=>chequearAvisos(false),6e4*5);
setTimeout(()=>chequearAvisos(false),8000);
