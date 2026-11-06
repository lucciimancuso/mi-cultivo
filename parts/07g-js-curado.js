
/* ---------- secado y curado de lo cosechado ----------
   Se guarda en la planta archivada: p.cur={jar:t,done:t,burps:[{t}]}.
   El secado arranca el día de la cosecha (p.harvest.t). */
const CUR_DONE=28;
const dayDiff=(a,b)=>Math.round((new Date(dayKey(b)+'T12:00:00')-new Date(dayKey(a)+'T12:00:00'))/DAY);
function curState(p){
 const h=p.harvest;if(!h||!h.t)return null;
 const c=p.cur||{},now=Date.now();
 if(!p.cur&&now-h.t>60*DAY)return null; /* cosechas viejas, de antes de esta función */
 if(c.done){const j=c.jar||c.done;return{fase:'listo',dias:Math.max(0,dayDiff(j,c.done)),jar:j,done:c.done}}
 if(c.jar){
  const dj=dayDiff(c.jar,now)+1,B=(c.burps||[]).map(b=>b.t).filter(t=>t>=c.jar),last=B.length?Math.max.apply(null,B):c.jar;
  const iv=dj<=7?1:dj<=14?2:7,gap=dayDiff(last,now);
  return{fase:'frascos',dias:dj,iv:iv,due:gap>=iv,hoy:B.some(t=>dayKey(t)===dayKey(now)),veces:B.length,jar:c.jar,lista:dj>=CUR_DONE}}
 return{fase:'secando',dias:dayDiff(h.t,now)+1}}
function curAdvice(p){
 const s=curState(p);if(!s)return null;
 if(s.fase==='secando'){
  if(s.dias<7)return{tone:'ok',chip:'Secando · día '+s.dias,pct:s.dias/10,
   text:'Colgada boca abajo, a oscuras, entre 18 y 20 °C y 55 a 62 % de humedad. Que el aire circule pero sin pegarle directo. Todavía no toca probarla.'};
  if(s.dias<=14)return{tone:'ok',chip:'Secando · día '+s.dias+' · probá el tallo',pct:Math.min(1,s.dias/10),
   text:'Doblá una rama chica: si se quiebra con un chasquido en vez de doblarse, ya está para pasar a frascos. Si todavía se dobla, esperá un día y volvé a probar.'};
  return{tone:'warn',chip:'Lleva '+s.dias+' días secando',pct:1,
   text:'Ya pasó de las dos semanas. Revisala hoy: si el tallo quiebra, pasala a frascos. Si se sigue secando pierde aroma.'}}
 if(s.fase==='frascos'){
  const base='En frascos · día '+s.dias;
  if(s.lista)return{tone:'ok',chip:base+' · cumplió 4 semanas',pct:1,
   text:'Ya está curada. Desde acá mejora más despacio: guardala en frascos cerrados, a oscuras y entre 15 y 20 °C, y abrilos una vez por semana o cada dos. Podés darla por lista cuando quieras.'};
  if(s.dias<=7)return{tone:s.due?'warn':'ok',chip:base+(s.due?' · abrir hoy':''),pct:s.dias/CUR_DONE,
   text:'Abrí los frascos unos 10 a 15 minutos una vez por día, para que salga la humedad. Llenalos hasta tres cuartos y, si tenés higrómetro, buscá 58 a 62 %. Si huele a pasto o a amoníaco, abrilos más seguido y dejalos más rato.'};
  if(s.dias<=14)return{tone:s.due?'warn':'ok',chip:base+(s.due?' · abrir hoy':''),pct:s.dias/CUR_DONE,
   text:'Ahora alcanza con abrirlos cada 2 o 3 días, unos 10 minutos. Si el aroma está parejo y no hay humedad en las paredes, vas bien.'};
  return{tone:s.due?'warn':'ok',chip:base+(s.due?' · abrir hoy':''),pct:s.dias/CUR_DONE,
   text:'Una vez por semana alcanza. El aroma sigue mejorando hasta las 4 semanas o más.'}}
 return{tone:'ok',chip:'Curada · '+s.dias+(s.dias===1?' día':' días')+' en frascos',pct:1,text:''}}

function curBurp(ids){
 const t=Date.now();let n=0;
 ids.forEach(id=>{const p=S.archive.find(x=>x.id===id);if(!p||!p.cur||!p.cur.jar)return;
  p.cur.burps=(p.cur.burps||[]).concat([{t:t+n}]);n++});
 if(n){toast(n===1?'Anotado: abriste el frasco':'Anotado: abriste '+n+' frascos');if(S.view==='cosechas')renderCosechas()}}
function curSet(p,fase){
 const t=Date.now();p.cur=p.cur||{};
 if(fase==='frascos'){p.cur.jar=t;p.cur.done=null;logEv(p,'cura','Pasó a frascos')}
 else if(fase==='listo'){p.cur.jar=p.cur.jar||t;p.cur.done=t;logEv(p,'cura','Curado listo')}
 else if(fase==='secando'){p.cur.jar=null;p.cur.done=null}}

function curadoHtml(H){
 const L=H.map(p=>({p:p,s:curState(p)})).filter(x=>x.s);
 if(!L.length)return'';
 const en=L.filter(x=>x.s.fase!=='listo'),ok=L.filter(x=>x.s.fase==='listo');
 const burpAll=en.filter(x=>x.s.fase==='frascos'&&x.s.due).length;
 const item=x=>{const p=x.p,s=x.s,a=curAdvice(p);
  const btn=s.fase==='secando'?'<button class="btn sm primary" data-cur="jar" data-id="'+p.id+'">Pasó a frascos</button>'
   :'<button class="btn sm'+(s.due?' primary':'')+'" data-cur="burp" data-id="'+p.id+'">'+(s.hoy?'Abierto hoy ✓ · otra vez':'Abrí el frasco')+'</button>'+
    '<button class="btn sm'+(s.lista?' primary':'')+'" data-cur="done" data-id="'+p.id+'">Dar por curada</button>';
  const back=s.fase==='frascos'?'<button class="btn sm" data-cur="back" data-id="'+p.id+'">Volver a secado</button>':'';
  return'<li class="cura-i"><div class="cura-h"><b>'+esc(p.name)+'</b><span class="chip'+(a.tone==='warn'?' warn':'')+'">'+esc(a.chip)+'</span></div>'+
   '<div class="cura-p'+(a.tone==='warn'?' w':'')+'" role="img" aria-label="Avance"><i style="width:'+Math.round(Math.max(.04,Math.min(1,a.pct))*100)+'%"></i></div>'+
   '<p class="hint" style="margin:0">'+esc(a.text)+'</p>'+
   '<div class="row tight">'+btn+back+'</div></li>'};
 const done=ok.length?'<ul class="cura cura-ok">'+ok.map(x=>{const a=curAdvice(x.p);return'<li class="cura-i ok"><div class="cura-h"><b>'+esc(x.p.name)+'</b><span class="chip plain">'+esc(a.chip)+'</span><button class="btn sm" data-cur="reopen" data-id="'+x.p.id+'">Volver a frascos</button></div></li>'}).join('')+'</ul>':'';
 return'<div class="glass card" id="curaCard"><div class="hd" style="display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between"><h2 style="margin:0">Secado y curado</h2>'+(burpAll>1?'<button class="btn sm primary" data-cur="burpall">Abrí todos los frascos ('+burpAll+')</button>':'')+'</div>'+
  '<p class="hint">El secado lleva de 7 a 14 días; el curado en frascos, 2 semanas como mínimo y 4 o más para que salga lo mejor. Si ves moho (pelusa gris o blanca) o huele a amoníaco, no la guardes: sacala y revisá el resto.</p>'+
  (en.length?'<ul class="cura">'+en.map(item).join('')+'</ul>':'<p class="hint">No hay nada secándose ahora.</p>')+done+'</div>'}

$('#cosBody').addEventListener('click',e=>{
 const b=e.target.closest('[data-cur]');if(!b)return;
 const k=b.dataset.cur;
 if(k==='burpall'){const ids=S.archive.filter(p=>{const s=p.grow===cosSel&&curState(p);return s&&s.fase==='frascos'&&s.due}).map(p=>p.id);curBurp(ids);return}
 const p=S.archive.find(x=>x.id===b.dataset.id);if(!p)return;
 if(k==='burp'){curBurp([p.id]);return}
 if(k==='jar'){curSet(p,'frascos');toast(p.name+' pasó a frascos. Abrilos una vez por día la primera semana');renderCosechas();return}
 if(k==='done'){curSet(p,'listo');toast(p.name+' curada. Buen trabajo');renderCosechas();return}
 if(k==='back'){curSet(p,'secando');toast(p.name+' volvió a secado');renderCosechas();return}
 if(k==='reopen'){p.cur.done=null;toast(p.name+' volvió a frascos');renderCosechas()}});

/* tareas de "Para hoy" y avisos: lo que toca con lo cosechado */
function curPend(){
 const L=S.archive.map(p=>({p:p,s:curState(p)})).filter(x=>x.s);
 return{abrir:L.filter(x=>x.s.fase==='frascos'&&x.s.due).map(x=>x.p),
  probar:L.filter(x=>x.s.fase==='secando'&&x.s.dias>=7).map(x=>x.p),
  listas:L.filter(x=>x.s.fase==='frascos'&&x.s.lista).map(x=>x.p)}}
const curNombres=A=>A.length<=2?A.map(p=>p.name).join(' y '):A.slice(0,2).map(p=>p.name).join(', ')+' y '+(A.length-2)+' más';
function curVer(p){cosSel=p.grow;cosEdit=null;go('cosechas')}
function curTareas(out){
 const c=curPend();
 if(c.abrir.length)out.push({t:c.abrir.length===1?'Abrir el frasco de '+c.abrir[0].name:'Abrir los frascos ('+c.abrir.length+')',sub:'Unos 10 a 15 minutos para que salga la humedad',btn:'Ya los abrí',tone:'',run:()=>curBurp(c.abrir.map(p=>p.id))});
 if(c.probar.length)out.push({t:'Probar el tallo de '+curNombres(c.probar),sub:'Si se quiebra en vez de doblarse, pasala a frascos',btn:'Ver',tone:'',run:()=>curVer(c.probar[0])});
 if(c.listas.length)out.push({t:curNombres(c.listas)+(c.listas.length===1?' cumplió':' cumplieron')+' 4 semanas de curado',sub:'Ya podés darla por curada',btn:'Ver',tone:'',run:()=>curVer(c.listas[0])})}
