
/* ---------- informes ---------- */
const PCOL=['#2F8F5B','#4C7DF0','#D9622B','#9B6BD6','#C48A1A','#D44A86'];
let rep='altura',wk=0;const repOn=new Set();
const wkStart=k=>{const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-((d.getDay()+6)%7)+k*7);return d.getTime()};
const dayLbl=(t,o)=>new Date(t).toLocaleDateString('es-AR',o||{day:'numeric',month:'long'});
function weekData(k){
 const t0=wkStart(k),t1=t0+7*DAY,ti=k===0?(new Date().getDay()+6)%7:(k<0?6:-1);
 const done=Array(7).fill(0),perPlant={},pred=Array(7).fill(0);
 allPlants().forEach(p=>{perPlant[p.id]=0;p.notes.forEach(n=>{if(n.k==='riego'&&n.t>=t0&&n.t<t1){const i=Math.min(6,Math.floor((n.t-t0)/DAY));done[i]++;perPlant[p.id]++}})});
 if(k===0){S.plants.forEach(p=>{const h=humAt(p,0),d=h<=.3?0:Math.ceil((h-.3)/rateOf(p,0)),per=Math.max(1,Math.round(.5/rateOf(p,0)));
   for(let i=ti;i<7;i++){const j=i-ti;if(j>=d&&(j-d)%per===0)pred[i]++}})}
 const photos=[];allPlants().forEach(p=>p.photos.forEach(x=>{if(x.t>=t0&&x.t<t1)photos.push({p:p,x:x})}));photos.sort((a,b)=>a.x.t-b.x.t);
 const bit=[];allPlants().forEach(p=>p.notes.forEach(n=>{if(n.k!=='riego'&&n.k!=='siembra'&&n.t>=t0&&n.t<t1)bit.push({p:p,n:n})}));bit.sort((a,b)=>a.n.t-b.n.t);
 return{k:k,t0:t0,t1:t1,ti:ti,done:done,pred:pred,perPlant:perPlant,photos:photos,bit:bit}}
function plantsIn(k){const t1=wkStart(k)+7*DAY,t0=wkStart(k);return allPlants().filter(p=>p.sownAt<t1&&(!p.harvest||p.harvest.t>=t0))}
const aliveEnd=(p,k)=>!p.harvest||p.harvest.t>=wkStart(k)+7*DAY;
function ageEnd(p,k){return Math.max(0,Math.min(p.age,(wkStart(k)+7*DAY-p.sownAt)/DAY))}
function toneAtEnd(p,k){if(k===0&&!p.harvest)return at0(()=>statusOf(p)).tone;const h=S.hist[p.id]||{};const t0=wkStart(k);for(let i=6;i>=0;i--){const v=h[dayKey(t0+i*DAY)];if(v)return v}return null}
function countUp(el,to,suf){if(!S.set.mot){el.textContent=to+(suf||'');return}const t0=performance.now();
 (function f(n){const k=Math.min(1,(n-t0)/900),e=1-Math.pow(1-k,3);el.textContent=Math.round(to*e)+(suf||'');if(k<1)requestAnimationFrame(f)})(t0)}
function renderInformes(){
 const k=wk,w=weekData(k),P=plantsIn(k),t0=w.t0,t1=w.t1-DAY;
 if(!repOn.size||![...repOn].some(id=>plantOf(id)))S.plants.forEach(p=>repOn.add(p.id));
 const hecho=w.done.reduce((a,b)=>a+b,0),pend=w.pred.slice(Math.max(0,w.ti)).reduce((a,b)=>a+b,0);
 const PA=P.filter(p=>aliveEnd(p,k)),sanas=PA.filter(p=>{const t=toneAtEnd(p,k);return t==='ok'||t==='water'}).length;
 let usedMeas=0;
 const crec=PA.length?Math.round(PA.reduce((a,p)=>{const e=ageEnd(p,k),mm=p.meas.filter(q=>q.t<w.t1).sort((x,y)=>x.t-y.t),last=mm[mm.length-1],prev=mm.filter(q=>q.t<=w.t1-7*DAY).pop();
   if(last&&prev&&last!==prev&&last.t>=w.t1-7*DAY){usedMeas++;return a+Math.round((last.cm-prev.cm)*7*DAY/Math.max(DAY,last.t-prev.t))}
   return a+(heightCm(p,e)-heightCm(p,Math.max(0,e-7)))},0)/PA.length):0;
 const warn=PA.filter(p=>toneAtEnd(p,k)==='warn').length;
 $('#repLead').textContent='Semana del '+dayLbl(t0)+' al '+dayLbl(t1)+(k===0?' (esta semana).':k===-1?' (la semana pasada).':'.');
 $('#repSummary').textContent=allPlants().length?('Regaste '+hecho+(hecho===1?' vez':' veces')+' y sacaste '+w.photos.length+(w.photos.length===1?' foto':' fotos')+'.'+(k===0&&pend?(pend===1?' Falta 1 riego previsto hasta el domingo.':' Faltan unos '+pend+' riegos previstos hasta el domingo.'):'')+(warn?' '+warn+(warn===1?' planta quedó con alerta.':' plantas quedaron con alerta.'):' Ninguna planta con alerta.')):'';
 const K=[[hecho,k===0?' de '+(hecho+pend):'',k===0?'Riegos de la semana':'Riegos hechos'],[w.photos.length,'','Fotos de seguimiento'],[sanas,' de '+PA.length,'Plantas sanas'],[crec,' cm',(usedMeas&&usedMeas===PA.length?'Crecimiento medido en 7 días':'Crecimiento en 7 días (estimado)')]];
 $('#kpis').innerHTML=K.map(x=>'<div class="kpi"><b>0</b><span>'+x[2]+'</span></div>').join('');
 $$('#kpis b').forEach((b,i)=>countUp(b,K[i][0],K[i][1]));
 const minW=allPlants().length?Math.min.apply(null,allPlants().map(p=>p.sownAt)):Date.now();
 $('#wkPrev').disabled=wkStart(k-1)+7*DAY<=minW;$('#wkNext').disabled=k>=0;$('#wkNow').disabled=k===0;
 const none=!allPlants().length;
 $('#repEmpty').hidden=!none;$('#repBody').hidden=none;
 $('#repPrint').innerHTML=printBlock(k,w,P,K);
 renderRepChart();$('#repTable').innerHTML=tableHtml(k,w,P);renderRepExtra(k,w,P);
}
function legendHtml(){
 if(rep==='altura')return S.plants.map((p,i)=>'<label><input type="checkbox" data-rp="'+p.id+'"'+(repOn.has(p.id)?' checked':'')+'><i style="background:'+PCOL[i%PCOL.length]+'"></i>'+esc(p.name)+'</label>').join('');
 if(rep==='riegos')return '<span class="chip"><i style="width:10px;height:10px;background:var(--leaf);border-radius:3px;display:block"></i>Hechos</span><span class="chip plain">Previstos</span>';
 return '<span class="chip">Sana</span><span class="chip water">Toca regar</span><span class="chip warn">Atención</span><span class="chip plain">Sin registro</span>'}
function repNoteTxt(){return rep==='altura'?'Línea llena: crecimiento estimado hasta hoy según la genética y el ciclo de luz. Punteada: cómo seguiría. Los puntos con aro son alturas que mediste vos.':rep==='riegos'?'Las barras llenas son riegos que registraste. Las rayadas son los que se prevén según el estado del sustrato.':'Cada cuadrado es un día. Los grises son días en que no abriste la app.'}
function renderRepChart(){
 $$('#repTabs button').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.rep===rep)));
 $('#repLegend').innerHTML=legendHtml();
 $('#repChart').innerHTML=rep==='altura'?chartAltura(true,'a'):rep==='riegos'?chartRiegos(wk,'a'):chartEstado(wk);
 $$('#repChart path.draw').forEach(pa=>pa.style.setProperty('--len',Math.ceil(pa.getTotalLength?pa.getTotalLength():400)));
 $('#repNote').textContent=repNoteTxt()}
function chartAltura(draw,uid,all){
 const W=760,H=320,m={l:44,r:16,t:16,b:40},pw=W-m.l-m.r,ph=H-m.t-m.b;
 const XM=Math.max(70,Math.ceil((S.plants.reduce((a,p)=>Math.max(a,p.age),0)+21)/10)*10);
 let ymax=60;S.plants.forEach(p=>{ymax=Math.max(ymax,heightU(p,XM)*CM);p.meas.forEach(q=>{ymax=Math.max(ymax,q.cm)})});ymax=Math.ceil(ymax/20)*20;
 const X=a=>m.l+a/XM*pw,Y=c=>m.t+ph-c/ymax*ph,step=XM>100?20:10;
 let s='<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Altura de cada planta en centímetros según los días desde la siembra">';
 for(let c=0;c<=ymax;c+=20)s+='<line x1="'+m.l+'" x2="'+(W-m.r)+'" y1="'+Y(c)+'" y2="'+Y(c)+'" stroke="currentColor" stroke-opacity=".14"/><text x="'+(m.l-8)+'" y="'+(Y(c)+4)+'" text-anchor="end">'+c+'</text>';
 for(let a=0;a<=XM;a+=step)s+='<text x="'+X(a)+'" y="'+(H-20)+'" text-anchor="middle">'+a+'</text>';
 s+='<text x="'+m.l+'" y="11">cm</text><text x="'+(m.l+pw/2)+'" y="'+(H-3)+'" text-anchor="middle">días desde la siembra</text>';
 S.plants.forEach((p,i)=>{if(!all&&!repOn.has(p.id))return;const col=PCOL[i%PCOL.length],now=Math.min(p.age,XM);let d1='M'+X(0)+' '+Y(heightU(p,0)*CM),d2='';
  for(let a=1;a<=now;a++)d1+=' L'+X(a).toFixed(1)+' '+Y(heightU(p,a)*CM).toFixed(1);
  d1+=' L'+X(now).toFixed(1)+' '+Y(heightU(p,now)*CM).toFixed(1);
  d2='M'+X(now).toFixed(1)+' '+Y(heightU(p,now)*CM).toFixed(1);for(let a=Math.ceil(now);a<=XM;a++)d2+=' L'+X(a).toFixed(1)+' '+Y(heightU(p,a)*CM).toFixed(1);
  s+='<path d="'+d2+'" fill="none" stroke="'+col+'" stroke-width="2.5" stroke-dasharray="3 6" stroke-linecap="round" opacity=".7"/><path class="'+(draw?'draw':'')+'" d="'+d1+'" fill="none" stroke="'+col+'" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="'+X(now).toFixed(1)+'" cy="'+Y(heightU(p,now)*CM).toFixed(1)+'" r="5.5" fill="'+col+'" stroke="#fff" stroke-width="2"/>';
  p.meas.forEach(q=>{const a=(q.t-p.sownAt)/DAY;if(a>=0&&a<=XM)s+='<circle cx="'+X(a).toFixed(1)+'" cy="'+Y(q.cm).toFixed(1)+'" r="5" fill="none" stroke="'+col+'" stroke-width="2.5"/>'})});
 return s+'</svg>'}
function chartRiegos(k,uid){
 const W=760,H=300,m={l:36,r:12,t:16,b:34},pw=W-m.l-m.r,ph=H-m.t-m.b,w=weekData(k),tot=w.done.map((v,i)=>v+w.pred[i]),ym=Math.max(3,Math.max.apply(null,tot)+1),dn=['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'],bw=pw/7;
 const Y=v=>m.t+ph-v/ym*ph,hat='hat'+uid;
 let s='<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Riegos hechos y previstos por día de la semana"><defs><pattern id="'+hat+'" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="7" height="7" fill="none"/><line x1="0" y1="0" x2="0" y2="7" stroke="var(--ink2)" stroke-width="2"/></pattern></defs>';
 for(let v=0;v<=ym;v++)s+='<line x1="'+m.l+'" x2="'+(W-m.r)+'" y1="'+Y(v)+'" y2="'+Y(v)+'" stroke="currentColor" stroke-opacity=".14"/><text x="'+(m.l-8)+'" y="'+(Y(v)+4)+'" text-anchor="end">'+v+'</text>';
 dn.forEach((n,d)=>{const x=m.l+d*bw+bw*.2,b=bw*.6,dn_=w.done[d],pr=w.pred[d];
  if(pr>0)s+='<rect x="'+x+'" y="'+Y(dn_+pr)+'" width="'+b+'" height="'+(Y(0)-Y(dn_+pr))+'" rx="6" fill="url(#'+hat+')" stroke="var(--ink2)" stroke-width="1.5" opacity=".55"/>';
  if(dn_>0)s+='<rect x="'+(x+4)+'" y="'+Y(dn_)+'" width="'+(b-8)+'" height="'+(Y(0)-Y(dn_))+'" rx="4" fill="var(--leaf)"/>';
  s+='<text x="'+(x+b/2)+'" y="'+(H-12)+'" text-anchor="middle"'+(d===w.ti?' style="font-weight:700;fill:var(--ink)"':'')+'>'+n+'</text>';
  if(dn_+pr>0)s+='<text x="'+(x+b/2)+'" y="'+(Y(dn_+pr)-6)+'" text-anchor="middle">'+(pr>0?dn_+'/'+(dn_+pr):dn_)+'</text>'});
 return s+'</svg>'}
function chartEstado(k){
 const P=plantsIn(k),W=760,rowH=44,H=Math.max(1,P.length)*rowH+46,lx=96,cw=(W-lx-12)/14,endT=k===0?Date.now():wkStart(k)+6*DAY;
 let s='<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Estado diario de cada planta en los últimos 14 días">';
 P.forEach((p,r)=>{const y=r*rowH+8,h=S.hist[p.id]||{};
  s+='<text x="0" y="'+(y+22)+'">'+esc(p.name.length>11?p.name.slice(0,10)+'…':p.name)+'</text>';
  for(let d=0;d<14;d++){const tone=h[dayKey(endT-(13-d)*DAY)];
   const f=tone==='ok'?'var(--leaf)':tone==='warn'?'var(--warn)':tone==='water'?'var(--water)':'var(--line)';
   s+='<rect x="'+(lx+d*cw+2)+'" y="'+y+'" width="'+(cw-4)+'" height="32" rx="7" style="fill:'+f+'" opacity="'+(tone==='ok'?.6:1)+'"/>'}});
 for(let d=0;d<14;d+=2)s+='<text x="'+(lx+d*cw+cw/2)+'" y="'+(H-8)+'" text-anchor="middle">'+fmtD(endT-(13-d)*DAY)+'</text>';
 return s+'</svg>'}
function tableHtml(k,w,P){
 return '<table class="tbl"><thead><tr><th>Planta</th><th>Etapa</th><th>Altura</th><th>Riegos</th><th>Estado</th>'+(k===0?'<th>Qué sigue</th>':'')+'</tr></thead><tbody>'+
 P.map(p=>{const e=ageEnd(p,k),tone=toneAtEnd(p,k),lab=p.harvest&&k===0?'Cosechada':k===0?at0(()=>statusOf(p)).label:(tone==='ok'?'Sana':tone==='warn'?'Atención':tone==='water'?'Tocaba regar':'Sin registro'),ms=p.meas.filter(q=>q.t<w.t1).pop();
  return'<tr><td><b>'+esc(p.name)+'</b><br><span class="hint">'+esc(seedOf(p).name)+'</span></td><td>'+stageOf(p,e)+'</td><td>'+heightCm(p,e)+' cm'+(ms?'<br><span class="hint">medida: '+ms.cm+' cm</span>':'')+'</td><td>'+w.perPlant[p.id]+'</td><td><span class="chip '+(tone==='ok'||!tone?'':tone)+'">'+lab+'</span></td>'+(k===0?'<td>'+(p.harvest?'Cosechada':esc(at0(()=>advise(p)).title))+'</td>':'')+'</tr>'}).join('')+'</tbody></table>'}
function photosHtml(w){return w.photos.length?'<div class="photogrid">'+w.photos.map(o=>'<figure><img src="'+esc(photoSrc(o.x))+'" alt="Foto de '+esc(o.p.name)+'"><figcaption>'+esc(o.p.name)+' · '+esc(fmtD(o.x.t))+'</figcaption></figure>').join('')+'</div>':'<p class="hint">No guardaste fotos esta semana.</p>'}
function bitHtml(w){return w.bit.length?'<ul class="bitl">'+w.bit.map(o=>'<li><span>'+esc(fmtD(o.n.t))+' · '+esc(o.p.name)+'</span><span>'+esc(o.n.x)+'</span></li>').join('')+'</ul>':'<p class="hint">No hay notas ni mediciones esta semana.</p>'}
function recHtml(P0){const P=P0.filter(p=>!p.harvest);return P.length?'<div>'+P.map(p=>{const a=at0(()=>advise(p));return'<div class="find'+(a.tone==='ok'?' ok':'')+'"><span class="n" aria-hidden="true">'+(a.tone==='ok'?'+':'!')+'</span><div><b>'+esc(p.name)+': '+esc(a.title)+'</b><p class="hint">'+esc(a.text)+'</p></div></div>'}).join('')+'</div>':''}
function renderRepExtra(k,w,P){
 const fo=$('#repFotos').checked,rc=$('#repRec').checked,bt=$('#repBit').checked,ev=$('#repEnv').checked;
 $('#repExtra').innerHTML=(ev?'<div class="glass card"><h2>Ambiente de la semana</h2>'+envHtml(w)+'</div>':'')+(fo?'<div class="glass card"><h2>Fotos de la semana</h2>'+photosHtml(w)+'</div>':'')+(bt?'<div class="glass card"><h2>Bitácora de la semana</h2>'+bitHtml(w)+'</div>':'')+(rc&&k===0?'<div class="glass card"><h2>Para la semana que viene</h2>'+recHtml(P)+'</div>':'')}
function printBlock(k,w,P,K){
 const fo=$('#repFotos').checked,rc=$('#repRec').checked,bt=$('#repBit').checked,ev=$('#repEnv').checked;
 return '<h1 style="font-size:26px;margin-bottom:4px">Mi Cultivo · Informe semanal</h1><p class="sumtext">'+esc($('#repLead').textContent)+'</p><p class="hint">'+esc($('#repSummary').textContent)+'</p>'+
  '<div class="glass card kpis">'+K.map(x=>'<div class="kpi"><b>'+x[0]+x[1]+'</b><span>'+x[2]+'</span></div>').join('')+'</div>'+
  '<div class="glass card"><h2>Detalle por planta</h2><div class="tblwrap">'+tableHtml(k,w,P)+'</div></div>'+
  '<div class="glass card"><h2>Altura</h2>'+chartAltura(false,'p',true)+'<p class="hint">Línea llena: estimado hasta hoy. Punteada: proyección. Aros: alturas medidas.</p></div>'+
  '<div class="glass card"><h2>Riegos de la semana</h2>'+chartRiegos(k,'p')+'</div><div class="glass card"><h2>Estado diario</h2>'+chartEstado(k)+'</div>'+
  (ev?'<div class="glass card"><h2>Ambiente de la semana</h2>'+envHtml(w)+'</div>':'')+(fo?'<div class="glass card"><h2>Fotos de la semana</h2>'+photosHtml(w)+'</div>':'')+(bt?'<div class="glass card"><h2>Bitácora de la semana</h2>'+bitHtml(w)+'</div>':'')+(rc&&k===0?'<div class="glass card"><h2>Para la semana que viene</h2>'+recHtml(P)+'</div>':'')+
  '<p class="hint">Generado el '+new Date().toLocaleDateString('es-AR')+'. Las alturas y la humedad son estimaciones según la genética y tus registros.</p>'}
$('#repTabs').addEventListener('click',e=>{const b=e.target.closest('[data-rep]');if(!b)return;rep=b.dataset.rep;renderRepChart()});
$('#repLegend').addEventListener('change',e=>{const id=e.target.dataset.rp;if(!id)return;if(e.target.checked)repOn.add(id);else repOn.delete(id);$('#repChart').innerHTML=chartAltura(true,'a');$$('#repChart path.draw').forEach(pa=>pa.style.setProperty('--len',Math.ceil(pa.getTotalLength?pa.getTotalLength():400)))});
['#repFotos','#repRec','#repBit','#repEnv'].forEach(id=>$(id).addEventListener('change',()=>renderInformes()));
$('#wkPrev').addEventListener('click',()=>{wk--;renderInformes()});
$('#wkNext').addEventListener('click',()=>{if(wk<0){wk++;renderInformes()}});
$('#wkNow').addEventListener('click',()=>{wk=0;renderInformes()});
$('#repPdf').addEventListener('click',async()=>{
 if(!allPlants().length){toast('Todavía no hay plantas para el informe');return}
 const keepT=S.set.tema;S.set.tema='claro';applyTema();document.documentElement.dataset.print='1';renderInformes();
 await new Promise(r=>setTimeout(r,350));
 let r=null;try{r=await store.printPdf('Informe Mi Cultivo '+dayKey(wkStart(wk))+'.pdf')}catch(e){}
 delete document.documentElement.dataset.print;S.set.tema=keepT;applyTema();renderInformes();
 if(r&&r.ok)toast('Informe guardado');else if(r&&r.msg)toast(r.msg)});
renderers.informes=renderInformes;

/* ---------- biblioteca ---------- */
const B={tab:'semillas',f:'todas',q:'',sort:'facil',edit:null,del:null};
const BF={semillas:[['todas','Todas'],['indica','Índica'],['sativa','Sativa'],['hibrida','Híbrida'],['auto','Autofloreciente']],stock:[],ferts:[['todas','Todos'],['Plántula','Plántula'],['Vegetativo','Vegetativo'],['Floración','Floración'],['Preventivo','Preventivo']],glos:[]};
const GLOSS=[
 {g:'Luz',t:'18/6',d:'Ciclo de luz para crecer: 18 horas de luz y 6 de oscuridad por día. Es el que se usa en la etapa vegetativa.'},
 {g:'Luz',t:'12/12',d:'Ciclo de luz para florecer: 12 horas de luz y 12 de oscuridad. En las plantas fotoperiódicas este cambio dispara la floración.'},
 {g:'Luz',t:'Fotoperiódica',d:'Planta que florece cuando le bajás la luz a 12/12. Si la dejás en 18/6 sigue creciendo.'},
 {g:'Luz',t:'Autofloreciente (auto)',d:'Planta que florece sola por la edad, sin importar las horas de luz. Suele ser más chica y rápida. Por eso en la app ignora el ciclo 12/12.'},
 {g:'Planta',t:'Genética',d:'La variedad de la semilla (por ejemplo, una índica o una híbrida). Define cuánto crece y cuánto tarda en florecer.'},
 {g:'Planta',t:'Plántula',d:'Planta recién nacida, con las primeras hojitas. Es la etapa más delicada: poco riego y poca dosis.'},
 {g:'Planta',t:'Vegetativo',d:'Etapa de crecimiento de tallos y hojas, antes de florecer.'},
 {g:'Planta',t:'Floración',d:'Etapa en que se forman los cogollos (las flores). Dura varias semanas, según la genética.'},
 {g:'Planta',t:'Esqueje (clon)',d:'Rama cortada de una planta madre que echa raíces y crece como una planta nueva, igual a la madre.'},
 {g:'Planta',t:'Poda y atado',d:'Recortar o atar ramas para controlar la altura y que la luz llegue a toda la planta. Atar sin cortar se llama LST.'},
 {g:'Planta',t:'Carencia y exceso',d:'Falta o sobra de un nutriente. Se nota en el color y la forma de las hojas. La foto con IA ayuda a sospechar cuál es, pero es orientativo.'},
 {g:'Agua y nutrientes',t:'pH',d:'Qué tan ácida o alcalina es el agua de riego. En la app el rango sugerido cambia según la etapa, alrededor de 5,8 a 6,5. Se mide con un medidor o con tiras.'},
 {g:'Agua y nutrientes',t:'EC',d:'Conductividad eléctrica: cuántos nutrientes (sales) hay disueltos en el agua. Más EC es una solución más fuerte; si te pasás se queman las puntas de las hojas. Se mide con un medidor de EC.'},
 {g:'Agua y nutrientes',t:'VPD',d:'Déficit de presión de vapor: combina temperatura y humedad para decir qué tan seco está el aire para la planta. La app lo calcula sola con tus lecturas de ambiente.'},
 {g:'Agua y nutrientes',t:'Enraizante',d:'Producto que ayuda a que salgan raíces, sobre todo en esquejes y plántulas.'},
 {g:'Agua y nutrientes',t:'Sustrato',d:'Lo que hay dentro de la maceta: tierra, fibra de coco, perlita, etc.'},
 {g:'Agua y nutrientes',t:'Perlita',d:'Piedritas blancas muy livianas que se mezclan con la tierra para que drene y respire mejor.'},
 {g:'Agua y nutrientes',t:'Tierra viva (súper soil)',d:'Tierra preparada con nutrientes y microorganismos. Muchas veces alcanza con regar con agua.'},
 {g:'En la app',t:'Invernadero y estación',d:'Un invernadero es tu espacio de cultivo (carpa, balcón...). Tiene hasta 9 estaciones: los lugares para una maceta.'},
 {g:'En la app',t:'Curado',d:'Después de cosechar y secar, se guardan las flores en frascos y se abren cada tanto durante semanas. La app te avisa cuándo.'}];
const hiCm=s=>{const m=/(\d+)\D+(\d+)/.exec(s.hcm||'');return m?+m[2]:0};
const SORTS={facil:(a,b)=>a.diff-b.diff||a.name.localeCompare(b.name,'es'),az:(a,b)=>a.name.localeCompare(b.name,'es'),alta:(a,b)=>hiCm(b)-hiCm(a)||a.name.localeCompare(b.name,'es'),corta:(a,b)=>a.fw-b.fw||a.name.localeCompare(b.name,'es')};
function seedEditForm(s){const m=/(\d+)\D+(\d+)/.exec(s.hcm||'')||[0,80,120];
 return'<form class="glass lib" data-seedform="'+s.id+'" autocomplete="off"><h3>Editar '+esc(s.name)+'</h3><p class="hint">Cargá los datos que dice el sobre o el banco de semillas.</p>'+
 '<div class="grid2"><div class="field"><label for="sfLo">Altura mínima (cm)</label><input id="sfLo" type="text" inputmode="numeric" value="'+m[1]+'"></div><div class="field"><label for="sfHi">Altura máxima (cm)</label><input id="sfHi" type="text" inputmode="numeric" value="'+m[2]+'"></div>'+
 '<div class="field"><label for="sfFw">Semanas de floración</label><input id="sfFw" type="text" inputmode="numeric" value="'+s.fw+'"></div><div class="field"><label for="sfPot">Maceta final</label><select id="sfPot">'+POTS.map(l=>'<option value="'+l+'"'+(l===s.pot?' selected':'')+'>'+l+' L</option>').join('')+'</select></div>'+
 '<div class="field"><label for="sfDiff">Dificultad</label><select id="sfDiff">'+['Muy fácil','Fácil','Media','Exigente','Para expertos'].map((l,i)=>'<option value="'+(i+1)+'"'+(s.diff===i+1?' selected':'')+'>'+l+'</option>').join('')+'</select></div></div>'+
 '<div class="field"><label for="sfNote">Nota</label><textarea id="sfNote" maxlength="240">'+esc(s.note||'')+'</textarea></div>'+
 '<div class="row"><button class="btn primary" type="submit">Guardar</button><button class="btn" type="button" data-bcancel="1">Cancelar</button></div></form>'}
function seedCard(s){
 if(B.edit===s.id)return seedEditForm(s);
 const have=stockOf(s.id);
 return'<article class="glass lib"><div class="hd"><h3>'+esc(s.name)+'</h3><span class="chip plain">'+(s.kind==='auto'?'Auto':'Foto')+'</span></div><span class="muted">'+esc(s.type)+(s.edited?' · datos editados':'')+(s.custom?' · cargada por vos':'')+'</span>'+
 (have?'<div><span class="chip">Tenés '+have+(have===1?' semilla':' semillas')+'</span></div>':'')+
 '<div class="facts"><div><span>Floración</span><span>'+esc(s.flow)+'</span></div><div><span>Altura</span><span>'+esc(s.hcm)+'</span></div><div><span>Maceta</span><span>'+s.pot+' L o más</span></div></div>'+
 '<div class="hd"><span class="hint">Dificultad</span><span class="bar5" role="img" aria-label="Dificultad '+s.diff+' de 5">'+[1,2,3,4,5].map(i=>'<i class="'+(i<=s.diff?'on':'')+'"></i>').join('')+'</span></div>'+
 '<p class="hint">'+esc(s.note)+'</p><div class="row tight"><button class="btn primary" type="button" data-plant="'+s.id+'">Plantar esta</button><button class="btn sm" type="button" data-bedit="'+s.id+'">Editar datos</button>'+
 (s.edited&&SEED0.has(s.id)?'<button class="btn sm" type="button" data-breset="'+s.id+'">Restaurar originales</button>':'')+(s.custom?'<button class="btn sm danger" type="button" data-bdel="'+s.id+'">'+(B.del===s.id?'Sí, eliminar':'Eliminar')+'</button>':'')+'</div></article>'}
function stockRows(q){const L=S.stock.filter(x=>{const s=SEEDS.find(y=>y.id===x.seed);return s&&(!q||(s.name+' '+(x.bank||'')).toLowerCase().indexOf(q)>-1)}).sort((a,b)=>b.t-a.t);
 return L.length?L.map(x=>{const s=SEEDS.find(y=>y.id===x.seed);return'<article class="glass lib"><div class="hd"><h3>'+esc(s.name)+'</h3><span class="chip'+(x.qty?'':' warn')+'">'+x.qty+(x.qty===1?' semilla':' semillas')+'</span></div><span class="muted">'+(x.bank?esc(x.bank)+' · ':'')+'cargada el '+esc(fmtD(x.t,{day:'numeric',month:'short',year:'numeric'}))+'</span>'+(x.note?'<p class="hint">'+esc(x.note)+'</p>':'')+
  '<div class="row tight"><button class="btn sm" type="button" data-sq="-1" data-sid="'+x.id+'" aria-label="Una semilla menos">−1</button><button class="btn sm" type="button" data-sq="1" data-sid="'+x.id+'" aria-label="Una semilla más">+1</button><button class="btn primary sm" type="button" data-plant="'+s.id+'">Plantar</button><button class="btn sm danger" type="button" data-sdel="'+x.id+'">Borrar</button></div></article>'}).join(''):'<p class="muted">Todavía no cargaste semillas. Sumá lo que compraste con el formulario de arriba.</p>'}
function renderBiblio(){
 $$('#bTabs button').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.b===B.tab)));
 $('#bFilters').innerHTML=BF[B.tab].map(f=>'<button type="button" data-f="'+f[0]+'" aria-pressed="'+(B.f===f[0])+'">'+f[1]+'</button>').join('');$('#bFilters').hidden=!BF[B.tab].length;
 $('#bSortBox').hidden=B.tab!=='semillas';$('#bSort').value=B.sort;
 const q=B.q.trim().toLowerCase();let html='';
 if(B.tab==='semillas'){
  const L=SEEDS.filter(s=>(B.f==='todas'||(B.f==='indica'&&s.type.indexOf('Índica')===0)||(B.f==='sativa'&&s.type.indexOf('Sativa')===0)||(B.f==='hibrida'&&s.type.indexOf('Híbrida')===0)||(B.f==='auto'&&s.kind==='auto'))&&(!q||s.name.toLowerCase().indexOf(q)>-1)).sort(SORTS[B.sort]);
  html=L.map(seedCard).join('')}
 else if(B.tab==='stock'){
  const tot=S.stock.reduce((a,x)=>a+(+x.qty||0),0);
  html='<form class="glass lib" id="stockForm" autocomplete="off" style="grid-column:1/-1"><h3>Sumar semillas que compraste</h3><div class="grid2"><div class="field"><label for="stSeed">Genética</label><select id="stSeed">'+SEEDS.slice().sort(SORTS.az).map(s=>'<option value="'+s.id+'">'+esc(s.name)+'</option>').join('')+'</select></div><div class="field"><label for="stQty">Cantidad</label><input id="stQty" type="text" inputmode="numeric" value="1"></div><div class="field"><label for="stBank">Banco o lugar de compra</label><input id="stBank" type="text" maxlength="60"></div><div class="field"><label for="stNote">Nota</label><input id="stNote" type="text" maxlength="120"></div></div><div class="row"><button class="btn primary" type="submit">Agregar a mi stock</button><span class="chip plain">Total: '+tot+(tot===1?' semilla':' semillas')+'</span></div></form><div id="stockList" style="display:contents">'+stockRows(q)+'</div>'}
 else if(B.tab==='glos'){
  html=GLOSS.filter(x=>!q||(x.t+' '+x.d+' '+x.g).toLowerCase().indexOf(q)>-1).map(x=>'<article class="glass lib"><div class="hd"><h3>'+esc(x.t)+'</h3></div><span class="chip plain gl-chip">'+esc(x.g)+'</span><p>'+esc(x.d)+'</p></article>').join('')}
 else{
  const L=FERTS.filter(f=>(B.f==='todas'||f.stage===B.f||f.kind===B.f)&&(!q||f.name.toLowerCase().indexOf(q)>-1));
  html=L.map(f=>'<article class="glass lib"><div class="hd"><h3>'+esc(f.name)+'</h3></div><div class="sumrow"><span class="chip">'+esc(f.stage)+'</span><span class="chip plain">'+esc(f.kind)+'</span></div><p>'+esc(f.note)+'</p><p class="hint">'+esc(f.dose)+'</p><button class="btn" type="button" data-have="'+f.id+'" aria-pressed="'+S.have.has(f.id)+'">'+(S.have.has(f.id)?'Lo tengo':'Marcar que lo tengo')+'</button>'+(f.custom?' <button class="btn sm" type="button" data-fdel="'+f.id+'">Quitar de la lista</button>':'')+'</article>').join('')}
 $('#bList').innerHTML=html||'<p class="muted">No hay resultados. Probá con otro filtro o borrá la búsqueda.</p>';
}
$('#bTabs').addEventListener('click',e=>{const b=e.target.closest('[data-b]');if(!b)return;B.tab=b.dataset.b;B.f='todas';B.edit=null;B.del=null;renderBiblio()});
$('#bFilters').addEventListener('click',e=>{const b=e.target.closest('[data-f]');if(!b)return;B.f=b.dataset.f;renderBiblio()});
$('#bQ').addEventListener('input',e=>{B.q=e.target.value;if(B.tab==='stock'){$('#stockList').innerHTML=stockRows(B.q.trim().toLowerCase())}else renderBiblio()});
$('#bSort').addEventListener('change',e=>{B.sort=e.target.value;renderBiblio()});
$('#bList').addEventListener('click',e=>{
 const pl=e.target.closest('[data-plant]');if(pl){np.seed=pl.dataset.plant;go('nueva');return}
 const hv=e.target.closest('[data-have]');if(hv){const id=hv.dataset.have;if(S.have.has(id))S.have.delete(id);else S.have.add(id);renderBiblio();toast(S.have.has(id)?'Anotado en tus fertilizantes':'Quitado de tus fertilizantes');return}
 const fd=e.target.closest('[data-fdel]');if(fd){const i=FERTS.findIndex(x=>x.id===fd.dataset.fdel);if(i>-1){const nm=FERTS[i].name;FERTS.splice(i,1);S.have.delete(fd.dataset.fdel);renderBiblio();toast(nm+' quitado de la lista')}return}
 const ed=e.target.closest('[data-bedit]');if(ed){B.edit=ed.dataset.bedit;B.del=null;renderBiblio();const i=$('#sfLo');if(i)i.focus();return}
 if(e.target.closest('[data-bcancel]')){B.edit=null;renderBiblio();return}
 const rs=e.target.closest('[data-breset]');if(rs){const id=rs.dataset.breset,s=SEEDS.find(x=>x.id===id);if(s&&SEED0.has(id)){Object.keys(s).forEach(k=>delete s[k]);Object.assign(s,JSON.parse(JSON.stringify(SEED0.get(id))));delete S.seedEdits[id];renderBiblio();toast('Datos originales de '+s.name)}return}
 const dl=e.target.closest('[data-bdel]');if(dl){const id=dl.dataset.bdel,s=SEEDS.find(x=>x.id===id);if(!s)return;
  if(allPlants().some(p=>p.seed===id)){toast('No se puede eliminar: hay plantas que usan esta genética');return}
  if(B.del!==id){B.del=id;renderBiblio();setTimeout(()=>{if(B.del===id){B.del=null;if(S.view==='biblio')renderBiblio()}},5000);return}
  SEEDS.splice(SEEDS.indexOf(s),1);S.stock=S.stock.filter(x=>x.seed!==id);delete S.seedEdits[id];if(np.seed===id)np.seed='ww';B.del=null;renderBiblio();toast(s.name+' eliminada de la lista');return}
 const sq=e.target.closest('[data-sq]');if(sq){const x=S.stock.find(y=>y.id===sq.dataset.sid);if(x){x.qty=Math.max(0,(+x.qty||0)+(+sq.dataset.sq));renderBiblio()}return}
 const sd=e.target.closest('[data-sdel]');if(sd){S.stock=S.stock.filter(y=>y.id!==sd.dataset.sdel);renderBiblio();toast('Borrado del stock')}});
$('#bList').addEventListener('submit',e=>{e.preventDefault();
 if(e.target.id==='stockForm'){const q=Math.round(num($('#stQty').value));if(!(q>=1&&q<=500)){toast('Poné una cantidad entre 1 y 500');return}
  const seed=$('#stSeed').value,ex=S.stock.find(x=>x.seed===seed&&(x.bank||'')===$('#stBank').value.trim());
  if(ex){ex.qty+=q;if($('#stNote').value.trim())ex.note=$('#stNote').value.trim()}else S.stock.push({id:'s'+Date.now().toString(36),seed:seed,qty:q,bank:$('#stBank').value.trim(),note:$('#stNote').value.trim(),t:Date.now()});
  renderBiblio();toast('Sumaste '+q+(q===1?' semilla':' semillas')+' al stock');return}
 const id=e.target.dataset.seedform,s=SEEDS.find(x=>x.id===id);if(!s)return;
 const lo=num($('#sfLo').value),hi=num($('#sfHi').value),fw=num($('#sfFw').value);
 if(!(lo>=15&&hi>=lo&&hi<=500)){toast('Revisá las alturas: la mínima no puede ser mayor que la máxima');return}
 if(!(fw>=4&&fw<=16)){toast('Las semanas de floración van de 4 a 16');return}
 S.seedEdits[id]={lo:Math.round(lo),hi:Math.round(hi),fw:Math.round(fw),pot:+$('#sfPot').value,diff:+$('#sfDiff').value,note:$('#sfNote').value.trim().slice(0,240)};
 seedFromEdit(s,S.seedEdits[id]);B.edit=null;renderBiblio();stagePulse();toast('Datos de '+s.name+' guardados')});
renderers.biblio=renderBiblio;
/* cualquier botón con data-gloss abre la Biblioteca en la pestaña Glosario */
document.addEventListener('click',e=>{if(!e.target.closest('[data-gloss]'))return;B.tab='glos';B.f='todas';B.q='';B.edit=null;B.del=null;const qi=$('#bQ');if(qi)qi.value='';go('biblio')});
