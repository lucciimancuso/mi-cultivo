
/* ---------- cosechas y ciclos ---------- */
const gOf=id=>S.grows.find(g=>g.id===id);
const gramos=x=>x==null?'—':fmtN(x)+' g';
let cosSel=null,cosEdit=null,cosDel=null;
function harvestStats(L){const dry=L.filter(p=>p.harvest.dry!=null),wet=L.filter(p=>p.harvest.wet!=null),sum=(A,f)=>A.reduce((a,p)=>a+f(p),0);
 const td=sum(dry,p=>p.harvest.dry),tw=sum(wet,p=>p.harvest.wet),pots=sum(dry,p=>p.pot),days=L.length?sum(L,p=>p.age)/L.length:0;
 return{n:L.length,td:td,tw:tw,avg:dry.length?td/dry.length:null,gl:pots?td/pots:null,days:days,nd:dry.length}}
/* comparación entre ciclos: barras con lo cosechado y lo que falta cosechar */
function compararCiclos(){
 const D=S.grows.map(g=>{const y=cycleYield(g.id),H=S.archive.filter(p=>p.grow===g.id);
  const gl=(()=>{const l=H.reduce((a,p)=>a+(p.harvest&&p.harvest.dry!=null?p.pot:0),0);const d=H.reduce((a,p)=>a+(p.harvest&&p.harvest.dry||0),0);return l?d/l:null})();
  return{id:g.id,name:g.name,real:y.real,esp:y.esp,n:y.cosechadas,gl:gl}}).filter(d=>d.real>0||d.esp>0);
 if(D.length<2)return'';
 const max=Math.max.apply(null,D.map(d=>d.real+d.esp))||1;
 const barras=D.map(d=>{const hr=Math.round(d.real/max*100),he=Math.round(d.esp/max*100);
  return'<div class="bar" title="'+esc(d.name)+'">'+(d.esp>0?'<i class="esp" style="height:'+he+'%"></i>':'')+'<i style="height:'+hr+'%"></i>'+
   '<b>'+(d.real>0?fmtN(d.real)+' g':'—')+'</b><span>'+esc(d.name)+'</span></div>'}).join('');
 const mejor=D.slice().filter(d=>d.gl!=null).sort((a,b)=>b.gl-a.gl)[0];
 return'<div class="glass card" style="margin-bottom:16px"><h2>Comparar ciclos</h2>'+
  '<p class="hint">Barra llena: lo que ya cosechaste. Barra rayada: lo que falta cosechar, estimado.</p>'+
  '<div class="bars">'+barras+'</div>'+
  (mejor?'<p class="hint">Tu mejor ciclo por litro de maceta es <b>'+esc(mejor.name)+'</b>, con '+fmtN(mejor.gl)+' g por litro.</p>':'')+'</div>'}
function renderCosechas(){
 if(!cosSel||!gOf(cosSel)){cosSel=S.grow;if(S.archive.length&&!S.archive.some(p=>p.grow===cosSel))cosSel=S.archive[0].grow}
 $('#gSel').innerHTML=S.grows.slice().reverse().map(g=>'<option value="'+g.id+'"'+(g.id===cosSel?' selected':'')+'>'+esc(g.name)+(g.id===S.grow?' (actual)':'')+'</option>').join('');
 const g=gOf(cosSel);if(document.activeElement&&document.activeElement.id!=='gName')$('#gName').value=g.name;
 const H=S.archive.filter(p=>p.grow===cosSel).sort((a,b)=>b.harvest.t-a.harvest.t),live=S.plants.filter(p=>p.grow===cosSel).length;
 $('#gHint').textContent=(live?live+(live===1?' planta sigue':' plantas siguen')+' en el invernadero dentro de este ciclo. ':'')+'Las plantas que cargues de ahora en más van al ciclo "'+gOf(S.grow).name+'".';
 $('#gNew').disabled=!(S.archive.length||S.plants.length);
 if(!H.length){$('#cosBody').innerHTML='<div class="glass card empty-card"><h2>Todavía no hay cosechas en este ciclo</h2><p class="muted">Cuando una planta esté lista, abrí su ficha en el invernadero y apretá "Cosechar". Se guarda acá con su peso, los días de cultivo y sus fotos.</p></div>';return}
 const st=harvestStats(H);
 const K=[[st.n,'Plantas cosechadas'],[st.nd?gramos(st.td):'—','Peso seco total'],[st.avg!=null?gramos(st.avg):'—','Seco por planta'],[st.gl!=null?fmtN(st.gl)+' g/L':'—','Seco por litro de maceta'],[Math.round(st.days)+' días','Promedio de cultivo']];
 $('#cosBody').innerHTML='<div class="glass card kpis">'+K.map(k=>'<div class="kpi"><b style="font-size:30px">'+k[0]+'</b><span>'+k[1]+'</span></div>').join('')+'</div>'+compararCiclos()+curadoHtml(H)+
 '<div class="glass card" style="margin-top:16px"><h2>Plantas cosechadas</h2><div class="tblwrap"><table class="tbl"><thead><tr><th>Planta</th><th>Cultivo</th><th>Húmedo</th><th>Seco</th><th>Notas</th><th></th></tr></thead><tbody>'+
 H.map(p=>{const s=seedOf(p);return'<tr><td><b>'+esc(p.name)+'</b><br><span class="hint">'+esc(s.name)+' · '+p.pot+' L</span></td><td>'+Math.round(p.age)+' días<br><span class="hint">'+esc(fmtD(p.harvest.t,{day:'numeric',month:'short',year:'numeric'}))+'</span></td><td>'+gramos(p.harvest.wet)+'</td><td>'+gramos(p.harvest.dry)+'</td><td>'+esc(p.harvest.note||'')+'</td>'+
  '<td><div class="row tight">'+(p.photos.length?'<button class="btn sm" data-vw="'+p.id+'">Fotos ('+p.photos.length+')</button>':'')+'<button class="btn sm" data-hedit="'+p.id+'">Editar</button><button class="btn sm" data-hback="'+p.id+'">Volver al invernadero</button><button class="btn sm danger" data-hdel="'+p.id+'">'+(cosDel===p.id?'Sí, eliminar':'Eliminar')+'</button></div></td></tr>'}).join('')+'</tbody></table></div></div>'+
 (cosEdit&&H.some(p=>p.id===cosEdit)?(()=>{const p=plantAny(cosEdit);return'<form class="glass card actform" id="hForm" style="margin-top:16px"><h2 style="flex:1 1 100%">Datos de la cosecha de '+esc(p.name)+'</h2><div class="field" style="flex:1 1 140px"><label for="eWet">Peso húmedo (g)</label><input id="eWet" type="text" inputmode="decimal" value="'+(p.harvest.wet!=null?fmtN(p.harvest.wet):'')+'"></div><div class="field" style="flex:1 1 140px"><label for="eDry">Peso seco (g)</label><input id="eDry" type="text" inputmode="decimal" value="'+(p.harvest.dry!=null?fmtN(p.harvest.dry):'')+'"></div><div class="field" style="flex:2 1 260px"><label for="eNote">Cómo salió</label><input id="eNote" type="text" maxlength="200" value="'+esc(p.harvest.note||'')+'"></div><button class="btn primary" type="submit">Guardar</button><button class="btn" type="button" data-hcancel="1">Cancelar</button></form>'})():'')}
$('#gSel').addEventListener('change',e=>{cosSel=e.target.value;cosEdit=null;cosDel=null;renderCosechas()});
$('#gName').addEventListener('change',e=>{const g=gOf(cosSel),v=e.target.value.trim();if(g&&v){g.name=v.slice(0,40);renderCosechas();toast('Ciclo renombrado')}else if(g)e.target.value=g.name});
$('#gNew').addEventListener('click',()=>{const n=S.grows.length+1,id='g'+Date.now().toString(36);S.grows.push({id:id,name:'Ciclo '+n,start:Date.now()});S.grow=id;cosSel=id;cosEdit=null;renderCosechas();toast('Empezó el "Ciclo '+n+'". Las plantas nuevas van acá')});
$('#cosBody').addEventListener('click',e=>{
 const vw=e.target.closest('[data-vw]');if(vw){openViewer(vw.dataset.vw);return}
 const ed=e.target.closest('[data-hedit]');if(ed){cosEdit=ed.dataset.hedit;cosDel=null;renderCosechas();const i=$('#eWet');if(i)i.focus();return}
 if(e.target.closest('[data-hcancel]')){cosEdit=null;renderCosechas();return}
 const bk=e.target.closest('[data-hback]');if(bk){const p=S.archive.find(x=>x.id===bk.dataset.hback);if(!p)return;
  S.archive=S.archive.filter(x=>x!==p);delete p.harvest;refreshAges();logEv(p,'nota','Volvió al invernadero (cosecha deshecha)');S.plants.push(p);S.sel=p.id;G.sync();labelTags();recordHist();toast(p.name+' volvió al invernadero');renderCosechas();return}
 const dl=e.target.closest('[data-hdel]');if(dl){const id=dl.dataset.hdel;if(cosDel!==id){cosDel=id;renderCosechas();setTimeout(()=>{if(cosDel===id){cosDel=null;if(S.view==='cosechas')renderCosechas()}},5000);return}
  const p=S.archive.find(x=>x.id===id);S.archive=S.archive.filter(x=>x.id!==id);delete S.hist[id];store.deletePlantPhotos(id);cosDel=null;toast((p?p.name:'Planta')+' eliminada del historial');renderCosechas()}});
$('#cosBody').addEventListener('submit',e=>{e.preventDefault();if(e.target.id!=='hForm')return;const p=S.archive.find(x=>x.id===cosEdit);if(!p)return;
 const w=num($('#eWet').value),d=num($('#eDry').value),ok=x=>isFinite(x)&&x>=0&&x<=20000;
 if(($('#eWet').value.trim()&&!ok(w))||($('#eDry').value.trim()&&!ok(d))){toast('Revisá los pesos: tienen que ser números en gramos');return}
 p.harvest.wet=ok(w)?w:null;p.harvest.dry=ok(d)?d:null;p.harvest.note=$('#eNote').value.trim();cosEdit=null;renderCosechas();toast('Cosecha actualizada')});
renderers.cosechas=renderCosechas;

/* ---------- cuidados: nutrición, ambiente, podas ---------- */
const cc={tab:'nutri',plant:null,metric:'ph',ans:''};
const SUBK=s=>{const c=(S.subs||[]).find(x=>x.name===s);if(c)return c.tipo==='Coco'?'coco':c.tipo==='Hidroponia'?'hidro':/viva|soil/i.test(c.name)?'viva':'tierra';return/coco/i.test(s||'')?'coco':/hidro/i.test(s||'')?'hidro':/viva/i.test(s||'')?'viva':'tierra'};
const PHR={tierra:[6,6.5],viva:[6.3,6.8],coco:[5.8,6.2],hidro:[5.5,6]};
function nutriWeek(p,wk){
 const a=wk*7+3,stg=stageOf(p,a),s=seedOf(p),sk=SUBK(p.sub),fs=flowerStart(p),wf=fs!=null&&a>=fs?(a-fs)/7:-1,ph=PHR[sk],mineral=sk!=='viva';
 const r={stage:stg,ph:ph[0]+' a '+ph[1],ec:(sk==='coco'||sk==='hidro')?null:'No hace falta',dose:'0%',what:'',note:''};
 const ecr=(sk==='coco'||sk==='hidro');
 if(stg==='Lista para cosechar'){r.what='Solo agua. No fertilices más.';r.ec=ecr?'menos de 0,4':r.ec;r.note='Mirá los tricomas con una lupa para elegir el día.';return r}
 if(wf>=0&&wf>=s.fw-2){r.what='Lavado: solo agua con pH ajustado.';r.dose='0%';r.ec=ecr?'menos de 0,4':r.ec;r.note='Las últimas dos semanas sirven para limpiar el sustrato.';return r}
 if(sk==='viva'){r.what=wf>=0?'Solo agua. Si ves amarillear hojas de arriba, sumá un té de compost suave.':'Solo agua: el súper soil ya trae los nutrientes.';r.dose='—';r.ec='No hace falta';r.note='No agregues fertilizante mineral al súper soil sin necesidad.';return r}
 if(stg==='Germinación'||stg==='Plántula'){r.what='Agua con pH ajustado. Si querés, un enraizante suave.';r.dose=a<7?'0%':'25%';r.ec=ecr?'0,4 a 0,8':r.ec;r.note='La plántula se alimenta de la semilla y del sustrato: no la fuerces.';return r}
 if(wf<0){const v=Math.max(0,Math.floor((a-21)/7)),d=[50,50,75,100][Math.min(v,3)];
  r.what='Fertilizante de crecimiento (nitrógeno alto)'+(sk==='coco'||sk==='hidro'?' más calcio y magnesio':'')+'.';r.dose=d+'%';r.ec=ecr?(d<=50?'1,0 a 1,2':d<=75?'1,2 a 1,4':'1,4 a 1,6'):r.ec;
  r.note=s.kind==='foto'&&p.flowerAt==null?'Mientras siga en 18/6 se queda en crecimiento. Al pasar a 12/12 el plan cambia a floración.':'Subí la dosis de a poco y mirá las hojas: puntas quemadas piden bajar.';return r}
 if(wf<2){r.what='Transición: mitad fertilizante de crecimiento y mitad de floración.';r.dose='75%';r.ec=ecr?'1,4 a 1,6':r.ec;r.note='Es el estirón: no cambies de golpe.';return r}
 r.what='Fertilizante de floración (fósforo y potasio altos)'+(ecr?' más calcio y magnesio':'')+'.';r.dose=wf<3?'75%':'100%';r.ec=ecr?(wf<3?'1,6 a 1,8':'1,8 a 2,0'):r.ec;r.note='Si las hojas de abajo amarillean de a poco al final, es normal.';return r}
function weeksNutri(p){const w0=Math.floor(ageNow(p)/7),out=[];for(let i=0;i<8;i++)out.push({wk:w0+i,i:i,r:nutriWeek(p,w0+i)});return out}
function plantPicker(all){const L=all?S.plants:S.plants;if(!L.length)return'';if(!L.some(p=>p.id===cc.plant))cc.plant=(plantOf(S.sel)?S.sel:L[0].id);
 return'<div class="field"><label for="cPlant">Planta</label><select id="cPlant">'+L.map(p=>'<option value="'+p.id+'"'+(p.id===cc.plant?' selected':'')+'>'+esc(p.name)+' ('+esc(seedOf(p).name)+')</option>').join('')+'</select></div>'}
const noPlants='<div class="glass card empty-card"><h2>Primero cargá una planta</h2><p class="muted">El plan de nutrición y las podas se arman para cada planta.</p><button class="btn primary" data-go2="nueva" type="button">Plantar la primera</button></div>';
function tabNutri(){
 if(!S.plants.length)return noPlants;
 const p=plantOf(cc.plant)||S.plants[0],W=weeksNutri(p),cur=W[0].r,sk=SUBK(p.sub);
 const own=p.fert&&!/Recomendado|Todavía sin/.test(p.fert)?'<p class="hint">Tu fertilizante: <b>'+esc(p.fert)+'</b>. Los porcentajes son de la dosis que indica su etiqueta.</p>':'<p class="hint">Los porcentajes son de la dosis que indica la etiqueta de tu fertilizante. Si es la primera vez, empezá con la mitad.</p>';
 return plantPicker()+'<div class="two" style="margin-top:16px"><div class="glass card"><div class="hd"><h2>Esta semana</h2><span class="chip plain">'+esc(cur.stage)+'</span></div>'+
  '<div class="advice"><b>'+esc(cur.what)+'</b><span>'+esc(cur.note)+'</span></div>'+
  '<div class="facts"><div><span>Dosis</span><span>'+cur.dose+'</span></div><div><span>pH del agua</span><span>'+cur.ph+'</span></div><div><span>EC (mS/cm)</span><span>'+cur.ec+'</span></div><div><span>Sustrato</span><span>'+esc(p.sub||'Sin dato')+'</span></div></div>'+own+
  '<div class="row"><button class="btn primary" id="nutriDone" type="button">Anotar que lo di</button></div></div>'+
  '<div class="glass card"><h2>Próximas semanas</h2><div class="tblwrap"><table class="tbl"><thead><tr><th>Semana</th><th>Etapa</th><th>Qué darle</th><th>Dosis</th></tr></thead><tbody>'+
  W.map(x=>'<tr'+(x.i===0?' style="font-weight:700"':'')+'><td>'+(x.wk+1)+'<br><span class="hint">'+esc(fmtD(p.sownAt+x.wk*7*DAY))+'</span></td><td>'+esc(x.r.stage)+'</td><td>'+esc(x.r.what)+'</td><td>'+x.r.dose+'</td></tr>').join('')+'</tbody></table></div><p class="hint">Plan orientativo según la etapa, el sustrato y la genética. Si el banco de tu semilla o el fertilizante indican otra cosa, mandan ellos.</p></div></div>'}
/* ambiente */
const ETAPAS=['Germinación','Plántula','Vegetativo','Pre-floración','Floración','Lista para cosechar'];
/* etapa de la carpa: la que tienen más plantas (si empatan, la más avanzada) */
function envStage(){const L=S.plants;if(!L.length)return'Vegetativo';const c={};L.forEach(p=>{const t=stageOf(p);c[t]=(c[t]||0)+1});let best=null;ETAPAS.forEach(t=>{if(c[t]&&(best==null||c[t]>=c[best]))best=t});return best||'Vegetativo'}
function envRange(m){const r=(RANGOS[envStage()]||RANGOS['Vegetativo'])[m];return r||[0,1]}
const ENVM={ph:{n:'pH',u:'',d:1,get r(){return envRange('ph')}},ec:{n:'EC',u:' mS/cm',d:2,get r(){return envRange('ec')}},temp:{n:'Temperatura',u:' °C',d:1,get r(){return envRange('temp')}},hum:{n:'Humedad',u:' %',d:0,get r(){return envRange('hum')}},vpd:{n:'VPD',u:' kPa',d:2,get r(){return envRange('vpd')}}};
/* el VPD no se carga: sale de la temperatura y la humedad de la misma medición */
const envFmt=(m,v)=>m==='vpd'?v.toFixed(2).replace('.',','):fmtN(+v.toFixed(ENVM[m].d));
const envVal=(e,m)=>m==='vpd'?((typeof e.temp==='number'&&typeof e.hum==='number')?vpd(e.temp,e.hum):null):(e[m]==null?null:e[m]);
function envChart(m){
 const M=ENVM[m],L=S.env.filter(e=>envVal(e,m)!=null).sort((a,b)=>a.t-b.t).slice(-30);
 if(L.length<2)return'<p class="hint">'+(L.length?'Con una medición más ya se puede dibujar el gráfico.':'Todavía no cargaste mediciones de '+M.n.toLowerCase()+'.')+'</p>';
 const W=760,H=260,mg={l:46,r:16,t:16,b:34},pw=W-mg.l-mg.r,ph=H-mg.t-mg.b,vs=L.map(e=>envVal(e,m));
 let lo=Math.min(M.r[0],Math.min.apply(null,vs)),hi=Math.max(M.r[1],Math.max.apply(null,vs));const pad_=(hi-lo)*.12||1;lo-=pad_;hi+=pad_;
 const t0=L[0].t,t1=L[L.length-1].t,X=t=>mg.l+(t-t0)/Math.max(1,t1-t0)*pw,Y=v=>mg.t+ph-(v-lo)/(hi-lo)*ph;
 let s='<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="'+M.n+' en el tiempo, con la zona ideal sombreada">';
 s+='<rect x="'+mg.l+'" y="'+Y(M.r[1])+'" width="'+pw+'" height="'+(Y(M.r[0])-Y(M.r[1]))+'" fill="var(--leaf-soft)"/>';
 for(let i=0;i<=4;i++){const v=lo+(hi-lo)*i/4;s+='<line x1="'+mg.l+'" x2="'+(W-mg.r)+'" y1="'+Y(v)+'" y2="'+Y(v)+'" stroke="currentColor" stroke-opacity=".12"/><text x="'+(mg.l-8)+'" y="'+(Y(v)+4)+'" text-anchor="end">'+envFmt(m,v)+'</text>'}
 s+='<text x="'+mg.l+'" y="'+(H-8)+'">'+esc(fmtD(t0))+'</text><text x="'+(W-mg.r)+'" y="'+(H-8)+'" text-anchor="end">'+esc(fmtD(t1))+'</text>';
 s+='<path d="'+L.map((e,i)=>(i?'L':'M')+X(e.t).toFixed(1)+' '+Y(envVal(e,m)).toFixed(1)).join(' ')+'" fill="none" stroke="var(--leaf)" stroke-width="3" stroke-linejoin="round"/>';
 L.forEach(e=>{const v=envVal(e,m),out=v<M.r[0]||v>M.r[1];s+='<circle cx="'+X(e.t).toFixed(1)+'" cy="'+Y(envVal(e,m)).toFixed(1)+'" r="5" style="fill:'+(out?'var(--warn)':'var(--leaf)')+'" stroke="#fff" stroke-width="2"/>'});
 return s+'</svg>'}
function envChips(e){return Object.keys(ENVM).filter(m=>envVal(e,m)!=null).map(m=>{const M=ENVM[m],v=envVal(e,m),out=v<M.r[0]||v>M.r[1];return'<span class="chip'+(out?' warn':'')+'">'+M.n+' '+envFmt(m,v)+M.u+'</span>'}).join(' ')}
function tabAmb(){
 const rec=S.env.slice().sort((a,b)=>b.t-a.t),last=rec[0];
 return'<div class="two"><div class="stack"><form class="glass card" id="envForm" autocomplete="off"><h2>Anotar una medición</h2><p class="hint">Cargá solo lo que mediste hoy. Usá coma o punto para los decimales.</p>'+
  '<div class="grid2"><div class="field"><label for="eph">pH del agua o del sustrato</label><input id="eph" type="text" inputmode="decimal" placeholder="6,2"></div><div class="field"><label for="eec">EC (mS/cm)</label><input id="eec" type="text" inputmode="decimal" placeholder="1,4"></div>'+
  '<div class="field"><label for="etemp">Temperatura (°C)</label><input id="etemp" type="text" inputmode="decimal" placeholder="24"></div><div class="field"><label for="ehum">Humedad ambiente (%)</label><input id="ehum" type="text" inputmode="decimal" placeholder="55"></div></div>'+
  '<div class="row"><button class="btn primary" type="submit">Guardar medición</button></div></form>'+
  '<div class="glass card"><h2>Últimas mediciones</h2>'+(rec.length?'<ul class="log">'+rec.slice(0,8).map(e=>'<li><span>'+esc(fmtDT(e.t))+'</span><span>'+envChips(e)+' <button class="btn sm" data-edel="'+e.id+'" aria-label="Borrar medición">Borrar</button></span></li>').join('')+'</ul>':'<p class="hint">Todavía no hay mediciones.</p>')+'</div></div>'+
  '<div class="glass card"><div class="hd"><div class="seg" id="envTabs" role="tablist" aria-label="Qué medir">'+Object.keys(ENVM).map(m=>'<button role="tab" data-em="'+m+'" aria-selected="'+(cc.metric===m)+'">'+ENVM[m].n+'</button>').join('')+'</div></div>'+
  '<div class="chartbox sm" id="envChart">'+envChart(cc.metric)+'</div><p class="hint">La franja verde es el rango recomendado para la etapa de tu carpa ('+esc(envStage())+'): '+envFmt(cc.metric,ENVM[cc.metric].r[0])+' a '+envFmt(cc.metric,ENVM[cc.metric].r[1])+ENVM[cc.metric].u+'. Los puntos rojos están afuera. El VPD sale solo de la temperatura y la humedad que cargues juntas. Las mediciones también aparecen en el informe semanal.</p>'+(last?'<div class="sumrow">'+envChips(last)+'</div>':'')+'</div></div>'}
/* podas */
function trainAdvice(p){const a=p.age,s=seedOf(p),fs=flowerStart(p),wf=fs!=null&&a>=fs?(a-fs)/7:-1;
 if(a<14)return'Todavía es muy chica: no hace falta tocarla.';
 if(wf>=s.fw-3&&wf>=0)return'Ya casi está: no podes ni ates con fuerza. Solo sacá hojas secas.';
 if(wf>=3)return'Defoliación suave de las hojas que tapan cogollos y retirada de ramas bajas sin flor. Nada de podas fuertes.';
 if(wf>=0)return'Última ventana antes del estirón: acomodá ramas con atado suave y poné la malla o los tutores.';
 if(s.kind==='auto')return'En autoflorecientes alcanza con un atado suave antes del día 28. Evitá las podas fuertes: no alcanzan a recuperarse.';
 if(a>=25&&a<=50)return'Buen momento para despuntar sobre el 4.º o 5.º nudo y atar las ramas hacia los costados. Dejá 5 a 7 días de recuperación.';
 return'Todavía no hace falta podar. Cuando tenga 4 o 5 nudos, ya se puede despuntar.'}
function tabPoda(){
 if(!S.plants.length)return noPlants;
 const p=plantOf(cc.plant)||S.plants[0],all=[];allPlants().forEach(q=>q.notes.forEach(n=>{if(n.k==='poda')all.push({p:q,n:n})}));all.sort((a,b)=>b.n.t-a.n.t);
 const cnt={};all.filter(o=>o.p.id===p.id).forEach(o=>{const k=o.n.x.split(': ')[0];cnt[k]=(cnt[k]||0)+1});
 return plantPicker()+'<div class="two" style="margin-top:16px"><form class="glass card" id="podaForm" autocomplete="off"><h2>Registrar una poda o un atado</h2>'+
  '<div class="advice"><b>Para '+esc(p.name)+'</b><span>'+esc(trainAdvice(p))+'</span></div>'+
  '<div class="field"><label for="pdType">Qué le hiciste</label><select id="pdType">'+PODAS.map(l=>'<option>'+l+'</option>').join('')+'</select></div>'+
  '<div class="field"><label for="pdNote">Detalle (opcional)</label><input id="pdNote" type="text" maxlength="140" placeholder="Por ejemplo: despunté sobre el 5.º nudo"></div>'+
  '<div class="row"><button class="btn primary" type="submit">Guardar</button></div>'+(Object.keys(cnt).length?'<div class="sumrow">'+Object.keys(cnt).map(k=>'<span class="chip plain">'+esc(k)+': '+cnt[k]+'</span>').join('')+'</div>':'')+'</form>'+
  '<div class="glass card"><h2>Historial de podas</h2>'+(all.length?'<ul class="log">'+all.slice(0,14).map(o=>'<li><span>'+esc(fmtD(o.n.t))+' · '+esc(o.p.name)+'</span><span>'+esc(o.n.x)+'</span></li>').join('')+'</ul>':'<p class="hint">Todavía no registraste podas ni atados.</p>')+'</div></div>'}
function renderCuidados(){
 $$('#cTabs button').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.c===cc.tab)));
 const ae=document.activeElement;if(ae&&ae.closest&&ae.closest('#cBody')&&/^(INPUT)$/.test(ae.tagName))return;
 $('#cBody').innerHTML=cc.tab==='nutri'?tabNutri():cc.tab==='amb'?tabAmb():cc.tab==='guia'?tabGuia():tabPoda()}
$('#cTabs').addEventListener('click',e=>{const b=e.target.closest('[data-c]');if(!b)return;cc.tab=b.dataset.c;if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();renderCuidados()});
$('#cBody').addEventListener('change',e=>{if(e.target.id==='cPlant'){cc.plant=e.target.value;renderCuidados()}});
$('#cBody').addEventListener('click',e=>{
 const g=e.target.closest('[data-go2]');if(g){go(g.dataset.go2);return}
 const em=e.target.closest('[data-em]');if(em){cc.metric=em.dataset.em;renderCuidados();return}
 const dl=e.target.closest('[data-edel]');if(dl){S.env=S.env.filter(x=>x.id!==dl.dataset.edel);renderCuidados();toast('Medición borrada');return}
 if(e.target.closest('#nutriDone')){const p=plantOf(cc.plant);if(!p||noFuture())return;const r=nutriWeek(p,Math.floor(p.age/7));logEv(p,'fert','Plan de nutrición, semana '+(Math.floor(p.age/7)+1)+': '+r.what.replace(/\.$/,'')+' ('+r.dose+' de la dosis)');toast('Anotado en la bitácora de '+p.name)}});
$('#cBody').addEventListener('submit',e=>{e.preventDefault();
 if(e.target.id==='envForm'){const v={ph:num($('#eph').value),ec:num($('#eec').value),temp:num($('#etemp').value),hum:num($('#ehum').value)},lim={ph:[3,10],ec:[0,8],temp:[0,50],hum:[0,100]},ent={id:'e'+Date.now().toString(36),t:Date.now()};let n=0;
  for(const k of Object.keys(v)){const raw=$('#e'+k).value.trim();if(!raw){ent[k]=null;continue}if(!isFinite(v[k])||v[k]<lim[k][0]||v[k]>lim[k][1]){toast('Revisá '+ENVM[k].n.toLowerCase()+': el valor no parece correcto');$('#e'+k).focus();return}ent[k]=v[k];n++}
  if(!n){toast('Cargá al menos un valor');return}S.env.push(ent);if(S.env.length>1500)S.env.splice(0,S.env.length-1500);
  if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();renderCuidados();toast('Medición guardada');return}
 if(e.target.id==='podaForm'){const p=plantOf(cc.plant);if(!p||noFuture())return;const t=$('#pdType').value,d=$('#pdNote').value.trim();logEv(p,'poda',t+(d?': '+d:''));if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();renderCuidados();toast('Anotado en la bitácora de '+p.name)}});
renderers.cuidados=renderCuidados;
/* ambiente de la semana para el informe */
function envWeek(w){const L=S.env.filter(e=>e.t>=w.t0&&e.t<w.t1);if(!L.length)return null;
 return Object.keys(ENVM).map(m=>{const v=L.map(e=>envVal(e,m)).filter(x=>x!=null);if(!v.length)return null;return{m:m,n:v.length,avg:v.reduce((a,b)=>a+b,0)/v.length,min:Math.min.apply(null,v),max:Math.max.apply(null,v)}}).filter(Boolean)}
function envHtml(w){const R=envWeek(w);if(!R||!R.length)return'<p class="hint">No cargaste mediciones de ambiente esta semana.</p>';
 return'<div class="tblwrap"><table class="tbl"><thead><tr><th>Medida</th><th>Promedio</th><th>Mínimo</th><th>Máximo</th><th>Mediciones</th></tr></thead><tbody>'+R.map(r=>{const M=ENVM[r.m],bad=r.avg<M.r[0]||r.avg>M.r[1];return'<tr><td><b>'+M.n+'</b></td><td><span class="chip'+(bad?' warn':'')+'">'+envFmt(r.m,r.avg)+M.u+'</span></td><td>'+envFmt(r.m,r.min)+M.u+'</td><td>'+envFmt(r.m,r.max)+M.u+'</td><td>'+r.n+'</td></tr>'}).join('')+'</tbody></table></div>'}
