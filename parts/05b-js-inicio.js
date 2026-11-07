/* ---------- Inicio: bienvenida y resumen del día ---------- */
const DOW=['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
const MESES=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
const pl=(n,s,p)=>n+' '+(n===1?s:p);
const pad2=n=>String(n).padStart(2,'0');
const hhmm=h=>{const t=Math.round((((h%24)+24)%24)*60)%1440;return pad2(Math.floor(t/60))+':'+pad2(t%60)};
function luzOn(){const m=/^(\d{1,2}):(\d{2})$/.exec(S.set.luzOn||'');return m?clamp(+m[1],0,23)+(+m[2])/60:6}
const isFlora=p=>seedOf(p).kind!=='auto'&&p.flowerAt!=null;
const IC={
 check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m8 12.5 2.8 2.8L16 9.5"/></svg>',
 plus:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
 cam:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8h3l1.5-2.5h7L17 8h3v11H4z"/><circle cx="12" cy="13.5" r="3.5"/></svg>'
};

/* tareas del día (las mismas que antes aparecían en el panel del invernadero) */
function computeTasks(){
 const out=[];
 S.plants.forEach(p=>{const st=statusOf(p),h=Math.round(hum(p)*100);
  if(st.label==='Regar hoy')out.push({t:'Regar '+p.name,sub:'Humedad estimada '+h+' %',btn:'Regar',tone:'water',run:()=>riego(p.id)});
  if(st.label==='Con sed')out.push({t:'Regar ya '+p.name,sub:'Con sed · humedad estimada '+h+' %',btn:'Regar',tone:'water',run:()=>riego(p.id)});
  if(st.label==='Exceso de agua')out.push({t:'Revisar el drenaje de '+p.name,sub:'Exceso de agua · sacale una foto',btn:'Sacar foto',tone:'warn',run:()=>{S.sel=p.id;go('foto')}})});
 const sinFoto=S.plants.filter(p=>!hasPhotoToday(p));
 if(S.set.fotoDia&&S.off<.5&&sinFoto.length)out.push({t:sinFoto.length===1?'Foto de hoy de '+sinFoto[0].name:'Foto de hoy de las plantas',sub:sinFoto.length===1?'Todavía no la sacaste':sinFoto.length+' sin foto',btn:'Sacar foto',tone:'',run:()=>{S.sel=sinFoto[0].id;go('foto')}});
 const wat=S.plants.filter(p=>statusOf(p).tone==='water').length;
 if(S.set.ph&&S.off<.5&&wat)out.push({t:'Medir el pH del agua antes de regar',sub:'Rango recomendado 5,8 a 6,5',btn:'Anotar',tone:'',run:()=>toast('Anotá el pH en la bitácora de cada planta con el botón Nota')});
 curTareas(out);
 return out}

/* Reloj de luz: anillo de 24 h con la ventana de la lámpara */
function relojHtml(){
 const P=S.plants;if(!P.length)return'';
 const on=luzOn(),flo=P.filter(isFlora).length,veg=P.length-flo;
 const rings=[];if(veg)rings.push({d:18,n:veg,c:'',l:'18/6'});if(flo)rings.push({d:12,n:flo,c:' flora',l:'12/12'});
 const R=rings.length>1?[80,64]:[80],C=100,ang=on/24*360-90;
 let g='';
 for(let h=0;h<24;h++){const a=(h/24*360-90)*Math.PI/180,big=h%6===0,r1=86.5,r2=big?92:88.5;
  g+='<line class="tk" x1="'+(C+r1*Math.cos(a)).toFixed(2)+'" y1="'+(C+r1*Math.sin(a)).toFixed(2)+'" x2="'+(C+r2*Math.cos(a)).toFixed(2)+'" y2="'+(C+r2*Math.sin(a)).toFixed(2)+'"/>';
  if(big){const rl=100.5;g+='<text x="'+(C+rl*Math.cos(a)).toFixed(1)+'" y="'+(C+rl*Math.sin(a)+4).toFixed(1)+'">'+h+'</text>'}}
 rings.forEach((rg,i)=>{const r=R[i],circ=2*Math.PI*r,len=circ*rg.d/24;
  g+='<circle class="trk" cx="'+C+'" cy="'+C+'" r="'+r+'"/><circle class="arc'+rg.c+'" cx="'+C+'" cy="'+C+'" r="'+r+'" stroke-dasharray="'+len.toFixed(2)+' '+circ.toFixed(2)+'" transform="rotate('+ang.toFixed(2)+' '+C+' '+C+')"/>'});
 const now=new Date(),nowH=now.getHours()+now.getMinutes()/60,prim=rings.slice().sort((a,b)=>b.n-a.n)[0];
 const lit=((nowH-on+24)%24)<prim.d;
 g+='<g transform="rotate('+(nowH/24*360).toFixed(2)+' '+C+' '+C+')"><line x1="'+C+'" y1="'+(C-46)+'" x2="'+C+'" y2="'+(C-R[0]-8)+'"/><circle cx="'+C+'" cy="'+(C-R[0]-8)+'" r="3.5"/></g>';
 g+='<text class="core" x="'+C+'" y="'+(C+4)+'">'+hhmm(nowH)+'</text><text x="'+C+'" y="'+(C+20)+'">'+(lit?'lámpara encendida':'lámpara apagada')+'</text>';
 const cap=rings.map(rg=>'<span class="rl'+rg.c+'"><i></i><b>'+rg.l+'</b> · '+hhmm(on)+' a '+hhmm(on+rg.d)+' · '+pl(rg.n,'planta','plantas')+'</span>').join('');
 const alt='Reloj de luz de 24 horas. '+rings.map(rg=>rg.l+' de '+hhmm(on)+' a '+hhmm(on+rg.d)).join('; ')+'. Ahora son las '+hhmm(nowH)+' y la lámpara está '+(lit?'encendida':'apagada')+'.';
 return'<figure class="reloj"><svg viewBox="-8 -8 216 216" role="img" aria-label="'+esc(alt)+'">'+g+'</svg><figcaption>'+cap+'</figcaption></figure>'}

/* Lámina de planta: altura (regla compartida en cm), hojas según el estadio y agua de la maceta según la humedad */
const POT='M68 172H132L124 203Q123.5 206 120.5 206H79.5Q76.5 206 76 203Z';
const LEAF=L=>'M0 0C'+(L*.25).toFixed(1)+' '+(-L*.2).toFixed(1)+' '+(L*.7).toFixed(1)+' '+(-L*.17).toFixed(1)+' '+L.toFixed(1)+' 0C'+(L*.7).toFixed(1)+' '+(L*.17).toFixed(1)+' '+(L*.25).toFixed(1)+' '+(L*.2).toFixed(1)+' 0 0Z';
function pairSvg(y,L,a){const d=LEAF(L);return'<g transform="translate(100 '+y.toFixed(1)+')"><path class="lam-leaf" d="'+d+'" transform="rotate('+(-a)+')"/><path class="lam-leaf" d="'+d+'" transform="scale(-1 1) rotate('+(-a)+')"/></g>'}
function plantSvg(p,k,idx){
 const cm=heightCm(p),hp=Math.max(4,cm*k),st=stageOf(p),ty=172-hp,h=hum(p),cs=colaSize(p);
 let g='<path class="lam-stem" d="M100 172V'+ty.toFixed(1)+'"/>';
 if(st==='Germinación'){g+=pairSvg(ty+1,8,12)}
 else{const n=clamp(Math.round(hp/15),1,8);
  for(let i=0;i<n;i++){const f=n===1?.55:.14+.72*i/(n-1),L=(10+22*Math.min(1,hp/80))*(1-.38*i/n);g+=pairSvg(172-hp*f,L,14+34*(i/Math.max(1,n-1)))}
  g+=pairSvg(ty+2,6+8*Math.min(1,hp/80),68)}
 if(cs>0||/floraci|Lista/i.test(st)){const c=Math.max(cs,.12);
  g+='<ellipse class="lam-cola" cx="100" cy="'+(ty-3*c).toFixed(1)+'" rx="'+(2.5+4*c).toFixed(1)+'" ry="'+(6+14*c).toFixed(1)+'"/>';
  if(hp>40){g+='<circle class="lam-cola" cx="94" cy="'+(ty+hp*.16).toFixed(1)+'" r="'+(1.6+2.4*c).toFixed(1)+'"/><circle class="lam-cola" cx="106" cy="'+(ty+hp*.24).toFixed(1)+'" r="'+(1.6+2.4*c).toFixed(1)+'"/>'}}
 const wh=34*h,id='pc'+idx;
 const pot='<clipPath id="'+id+'"><path d="'+POT+'"/></clipPath><rect class="pot-water" x="68" y="'+(206-wh).toFixed(1)+'" width="64" height="'+(wh+1).toFixed(1)+'" clip-path="url(#'+id+')"/><path class="lam-pot" d="'+POT+'" fill="none"/><ellipse class="lam-soil" cx="100" cy="172" rx="32" ry="3.4"/>';
 return g+pot}
function rulerSvg(top,k){
 const step=top<=50?10:top<=100?25:50;let g='<line x1="12" y1="172" x2="12" y2="'+(172-top*k).toFixed(1)+'"/>';
 for(let v=0;v<=top;v+=step){const y=172-v*k;g+='<line x1="12" y1="'+y.toFixed(1)+'" x2="'+(v?18:20)+'" y2="'+y.toFixed(1)+'"/>'+(v?'<text x="22" y="'+(y+4).toFixed(1)+'">'+v+' cm</text>':'')}
 return'<g class="lam-rule">'+g+'</g>'}
function lamHtml(p,i,top,k){
 const s=seedOf(p),st=statusOf(p),cm=heightCm(p),h=hum(p);
 const svg='<svg viewBox="0 0 200 212" role="img" aria-label="'+esc(p.name+': '+stageOf(p)+', '+cm+' cm, humedad estimada '+Math.round(h*100)+' %')+'" focusable="false">'+rulerSvg(top,k)+plantSvg(p,k,i)+'</svg>';
 const needs=st.label==='Regar hoy'||st.label==='Con sed';
 return'<article class="lam" style="--i:'+i+'"><button class="lam-open" type="button" data-open="'+esc(p.id)+'" data-k="o'+esc(p.id)+'" aria-label="Abrir la ficha de '+esc(p.name)+'"></button>'+
  '<div class="lam-art">'+svg+'</div><div class="lam-body"><h3>'+esc(p.name)+'</h3><span class="g">'+esc(s.name)+(s.kind==='auto'?' · Auto':'')+'</span>'+
  '<span class="m num">Día '+Math.floor(ageNow(p))+' · '+esc(stageOf(p))+' · '+cm+' cm</span>'+
  '<div class="s"><span class="chip '+(st.tone==='ok'?'':st.tone)+'">'+esc(st.label)+'</span>'+(st.label==='Exceso de agua'?'':'<button class="btn sm'+(needs?' water':'')+'" type="button" data-water="'+esc(p.id)+'" data-k="w'+esc(p.id)+'">Regar</button>')+'</div></div></article>'}

function ambHtml(){
 const L=S.env.slice().sort((a,b)=>b.t-a.t);
 const items=Object.keys(ENVM).map(m=>{const M=ENVM[m],e=L.find(x=>envVal(x,m)!=null),span=M.r[1]-M.r[0],lo=M.r[0]-span,hi=M.r[1]+span,pc=x=>(clamp((x-lo)/(hi-lo),0,1)*100).toFixed(1);
  const band='<i style="left:'+pc(M.r[0])+'%;width:'+(pc(M.r[1])-pc(M.r[0])).toFixed(1)+'%"></i>',rg=fmtN(M.r[0])+' a '+fmtN(M.r[1]);
  if(!e)return'<div class="amb-i"><span class="k">'+M.n+'</span><span class="v" aria-label="sin dato">—</span><div class="rng" aria-hidden="true">'+band+'</div><span class="w">Sin mediciones · rango '+rg+'</span></div>';
  const v=envVal(e,m),out=v<M.r[0]||v>M.r[1];
  return'<div class="amb-i'+(out?' out':'')+'"><span class="k">'+M.n+'</span><span class="v num">'+v.toFixed(M.d).replace('.',',')+(M.u?'<small>'+esc(M.u.trim())+'</small>':'')+'</span><div class="rng" aria-hidden="true">'+band+'<b style="left:'+pc(v)+'%"></b></div><span class="w">'+(out?(v<M.r[0]?'Bajo':'Alto')+' · ':'')+'Rango '+rg+' · '+agoText(e.t)+'</span></div>'}).join('');
 return'<div class="amb">'+items+'</div>'+(S.plants.length?'<p class="hint" style="padding-top:8px">Rangos para la etapa de tu carpa: <b>'+esc(envStage())+'</b>.</p>':'')+(L.length?'':'<p class="hint" style="padding-top:12px">Todavía no anotaste el ambiente de la carpa. Medir seguido ayuda a entender qué le pasa a las plantas.</p>')}

function weekHtml(){
 const dk=d=>d.getFullYear()*10000+d.getMonth()*100+d.getDate(),now=new Date(),cols=[];
 for(let d=6;d>=0;d--){const x=new Date(now.getFullYear(),now.getMonth(),now.getDate()-d);cols.push({x,k:dk(x),r:0,f:0,n:0,o:0})}
 const by={};cols.forEach(c=>{by[c.k]=c});
 allPlants().forEach(p=>{
  p.notes.forEach(n=>{const c=by[dk(new Date(n.t))];if(!c)return;if(n.k==='riego')c.r++;else if(n.k==='nota')c.n++;else c.o++});
  p.photos.forEach(f=>{const c=by[dk(new Date(f.t))];if(c)c.f++})});
 let total=0;
 const html=cols.map((c,i)=>{const t=c.r+c.f+c.n+c.o;total+=t;
  const seq=[].concat(Array(c.r).fill('r'),Array(c.f).fill('f'),Array(c.n).fill('n'),Array(c.o).fill('o'));
  const shown=seq.length>6?seq.slice(0,5):seq,more=seq.length>6?seq.length-5:0;
  const parts=[];if(c.r)parts.push(pl(c.r,'riego','riegos'));if(c.f)parts.push(pl(c.f,'foto','fotos'));if(c.n)parts.push(pl(c.n,'nota','notas'));if(c.o)parts.push(pl(c.o,'otro registro','otros registros'));
  const lab=DOW[c.x.getDay()]+' '+c.x.getDate()+': '+(parts.length?parts.join(', '):'sin registros');
  return'<div class="day'+(i===6?' hoy':'')+'"><div class="dl">'+DOW[c.x.getDay()].slice(0,3)+'<b class="num">'+c.x.getDate()+'</b></div><div class="dots" role="img" aria-label="'+esc(lab)+'">'+shown.map(s=>'<i class="'+(s==='r'?'':s)+'"></i>').join('')+(more?'<em>+'+more+'</em>':'')+'</div></div>'}).join('');
 const leg=total?'<div class="wk-legend"><span><i></i>Riego</span><span><i class="f"></i>Foto</span><span><i class="n"></i>Nota</span><span><i class="o"></i>Otro</span></div>':'<p class="hint" style="padding-top:12px">Todavía no anotaste nada en los últimos 7 días.</p>';
 return'<div class="week">'+html+'</div>'+leg}

function archHtml(){
 const all=allPlants();let lastPh=null;
 all.forEach(p=>p.photos.forEach(x=>{if(!lastPh||x.t>lastPh.x.t)lastPh={p:p,x:x}}));
 const H=S.archive,dry=H.reduce((a,p)=>a+(p.harvest&&p.harvest.dry||0),0),g=S.grows.find(x=>x.id===S.grow);
 const a1=lastPh?'<button class="arch-i" type="button" data-photo="'+esc(lastPh.p.id)+'" data-k="aph"><span class="ph"><img src="'+esc(photoSrc(lastPh.x))+'" alt=""></span><span class="arch-t"><span>Última foto</span><b>'+esc(lastPh.p.name)+'</b><span>'+agoText(lastPh.x.t)+'</span></span></button>'
  :'<button class="arch-i" type="button" data-goto="foto" data-k="aph"><span class="ph">'+IC.cam+'</span><span class="arch-t"><span>Fotos</span><b>Sin fotos</b><span>Sacá la primera</span></span></button>';
 const a2='<button class="arch-i" type="button" data-goto="cosechas" data-k="ahv"><span class="arch-t"><span>Cosechas</span><b class="num">'+(H.length?pl(H.length,'cosecha','cosechas'):'Ninguna todavía')+'</b><span>'+(dry>0?fmtN(dry)+' g secos en total':H.length?'Sin pesos cargados':'Cuando coseches, queda acá')+'</span></span></button>';
 const days=g?Math.max(1,Math.floor((Date.now()-g.start)/DAY)+1):0;
 const a3='<button class="arch-i" type="button" data-goto="cosechas" data-k="agr"><span class="arch-t"><span>'+esc(g?g.name:'Ciclo')+'</span><b class="num">Día '+days+'</b><span>Desde el '+(g?fmtD(g.start,{day:'numeric',month:'long'}):'—')+'</span></span></button>';
 return'<div class="arch">'+a1+a2+a3+'</div>'}

function welcomeHtml(){
 return'<div class="welcome" data-rise style="--i:0"><h1>Mi Cultivo</h1><p class="verdict">Tu cuaderno de campo. Cargá la primera planta y desde acá vas a ver qué hacer cada día.</p>'+
 '<ol class="steps"><li><span class="n">1</span><b>Plantá</b><span>Elegí la genética, la maceta y la fecha. La planta aparece en tu invernadero.</span></li><li><span class="n">2</span><b>Registrá</b><span>Regá, anotá y sacá fotos. La app estima la humedad y la altura por vos.</span></li><li><span class="n">3</span><b>Mirá</b><span>Cada día, qué hace falta. Cada semana, un informe con gráficos.</span></li></ol>'+
 '<div class="row"><button class="btn primary" type="button" data-goto="nueva" data-k="wn">Plantar la primera</button><button class="btn" type="button" data-demo="1" data-k="wd">Cargar plantas de ejemplo</button></div></div>'}

function homeHtml(){
 const P=S.plants;
 if(!P.length&&!S.archive.length)return welcomeHtml();
 const now=new Date(),tasks=computeTasks();curTasks=tasks;
 const riegos=P.filter(p=>{const l=statusOf(p).label;return l==='Regar hoy'||l==='Con sed'}).length,alertas=P.filter(p=>statusOf(p).label==='Exceso de agua').length;
 let verdict,lead='';
 if(!P.length)verdict='No hay plantas en el invernadero.';
 else if(!riegos&&!alertas){verdict='Todo en orden. Ninguna planta pide atención hoy.';
  const nx=P.map(p=>({p:p,d:waterDays(p)})).sort((a,b)=>a.d-b.d)[0];
  if(nx)lead='La próxima en pedir agua es '+nx.p.name+', '+(nx.d<=0?'hoy':nx.d===1?'mañana':'en '+nx.d+' días')+'.'}
 else{const parts=[];if(riegos)parts.push('<em>'+pl(riegos,'riego','riegos')+'</em>');if(alertas)parts.push('<em class="warn">'+pl(alertas,'alerta','alertas')+'</em>');verdict='Hoy tenés '+parts.join(' y ')+'.'}
 const hero='<header class="hero" data-rise style="--i:0"><div><h1 class="sr">Inicio</h1><div class="dateblock"><div class="bigday num" aria-hidden="true">'+now.getDate()+'</div><div class="datemeta"><b>'+DOW[now.getDay()]+'</b><span>'+MESES[now.getMonth()]+' de '+now.getFullYear()+'</span></div></div>'+
  '<p class="verdict">'+verdict+'</p>'+(lead?'<p class="lead" style="margin-top:10px">'+esc(lead)+'</p>':'')+'</div>'+relojHtml()+'</header>';
 const todo=tasks.length?'<ul class="todos">'+tasks.map((k,i)=>'<li class="todo'+(k.tone==='warn'?' warn':'')+'" data-i="'+i+'"><div class="todo-in"><div class="todo-row"><button class="tick" type="button" data-tick="'+i+'" data-k="t'+i+'" aria-label="Marcar como hecho: '+esc(k.t)+'"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7"/></svg></button><div class="todo-t"><b>'+esc(k.t)+'</b><span>'+esc(k.sub)+'</span></div><button class="btn sm'+(k.tone==='water'?' water':k.tone==='warn'?' danger':'')+'" type="button" data-tick="'+i+'" data-k="b'+i+'">'+esc(k.btn)+'</button></div></div></li>').join('')+'</ul>'
  :'<div class="todo-ok">'+IC.check+'<span>'+(P.length||S.archive.length?'Nada pendiente por hoy.':'Sin plantas activas, no hay tareas.')+'</span></div>';
 const secTodo='<section data-rise style="--i:1" aria-labelledby="hTar"><div class="sec-h"><h2 id="hTar">Para hoy</h2>'+(tasks.length?'<span class="hint">'+pl(tasks.length,'tarea','tareas')+'</span>':'')+'</div>'+todo+'</section>';
 const cms=P.map(p=>heightCm(p)),mx=Math.max.apply(null,cms.concat([20])),top=[30,50,75,100,150,200,250,300].find(v=>v>=mx*1.04)||Math.ceil(mx/50)*50,k=140/top;
 const lams=P.map((p,i)=>lamHtml(p,i,top,k)).join('')+(!P.length?'<button class="lam nueva" type="button" data-goto="nueva" data-k="nn" style="--i:0">'+IC.plus+'<b>Nueva planta</b><span class="hint">Plantá una semilla</span></button>':'');
 const secPl='<section data-rise style="--i:2" aria-labelledby="hPl"><div class="sec-h"><h2 id="hPl">Tus plantas</h2><span class="row tight">'+(P.length?'<button class="btn" type="button" data-goto="nueva" data-k="gnu">Nueva planta</button>':'')+'<button class="btn" type="button" data-goto="stage" data-k="gst">'+(NOD?'Ver invernadero':'Ver en 3D')+'</button></span></div><div class="lams">'+lams+'</div></section>';
 const two='<div class="two-sec" data-rise style="--i:3"><section aria-labelledby="hAmb"><div class="sec-h"><h2 id="hAmb">Ambiente</h2><button class="btn" type="button" data-goto="cuidados" data-k="gca">Anotar</button></div>'+ambHtml()+'</section><section aria-labelledby="hSem"><div class="sec-h"><h2 id="hSem">Esta semana</h2><button class="btn" type="button" data-goto="informes" data-k="gin">Informe</button></div>'+weekHtml()+'</section></div>';
 const secArch='<section data-rise style="--i:4" aria-labelledby="hArc"><div class="sec-h"><h2 id="hArc">Archivo</h2></div>'+archHtml()+'</section>';
 return hero+secTodo+secPl+two+secArch}

let homeSig='',homeFirst=true;
function renderHome(force){
 const el=$('#home');if(!el||S.view!=='inicio')return;
 const html=homeHtml();if(!force&&html===homeSig&&el.firstChild)return;
 const ak=document.activeElement&&el.contains(document.activeElement)?document.activeElement.dataset.k:null;
 homeSig=html;el.classList.toggle('enter',homeFirst);el.innerHTML=html;
 if(homeFirst){homeFirst=false;setTimeout(()=>el.classList.remove('enter'),1500)}
 if(ak){const n=el.querySelector('[data-k="'+ak+'"]');if(n)n.focus({preventScroll:true})}}
renderers.inicio=()=>renderHome(true);
$('#home').addEventListener('click',e=>{
 const t=e.target.closest('[data-tick]');
 if(t){const li=t.closest('.todo'),k=curTasks[+t.dataset.tick];if(!k||!li||li.classList.contains('done'))return;
  li.classList.add('done');setTimeout(()=>{k.run()},300);setTimeout(()=>{if(S.view==='inicio')renderHome(true)},1100);return}
 const o=e.target.closest('[data-open]');
 if(o){const id=o.dataset.open;S.sel=id;go('stage');G.focus(id);renderCard();labelTags();return}
 const w=e.target.closest('[data-water]');if(w){riego(w.dataset.water);return}
 const g=e.target.closest('[data-goto]');if(g){go(g.dataset.goto);return}
 const ph=e.target.closest('[data-photo]');if(ph){openViewer(ph.dataset.photo);return}
 if(e.target.closest('[data-demo]')){$('#sDemo').click()}});

/* ---------- riel: indicador deslizante, resumen de la marca ---------- */
function railSync(){
 const ind=$('#railInd'),cur=$('.rail .tab[aria-current="page"]');if(!ind)return;
 if(!cur||getComputedStyle(ind).display==='none'){ind.classList.remove('on');return}
 const r=$('#rail').getBoundingClientRect(),c=cur.getBoundingClientRect();
 const first=!ind.classList.contains('on');
 if(first)ind.style.transition='none';
 ind.style.setProperty('--y',(c.top-r.top).toFixed(1)+'px');ind.style.height=c.height.toFixed(1)+'px';
 if(first){void ind.offsetWidth;ind.classList.add('on');ind.style.transition=''}}
addEventListener('resize',railSync);
/* si el menú lateral se desplaza, el indicador tiene que seguir al botón activo */
{const rs=document.querySelector('.rail-scroll');if(rs)rs.addEventListener('scroll',railSync,{passive:true});}
function brandSync(){const el=$('#brandMeta');if(!el)return;const g=S.grows.find(x=>x.id===S.grow),n=S.plants.length;
 el.textContent=(g?g.name+' · ':'')+(n?pl(n,'planta','plantas'):'sin plantas')}

/* ---------- selector segmentado: el indicador desliza ---------- */
function segSyncAll(){
 $$('.seg').forEach(sg=>{
  const b=sg.querySelector('[aria-pressed="true"],[aria-selected="true"]');
  const kids=Array.from(sg.children).filter(x=>x.offsetWidth);
  if(!b||!sg.offsetWidth||!b.offsetWidth||!kids.every(x=>Math.abs(x.offsetTop-kids[0].offsetTop)<3)){sg.removeAttribute('data-ind');return}
  sg.style.setProperty('--sx',b.offsetLeft+'px');sg.style.setProperty('--sw',b.offsetWidth+'px');
  if(!sg.hasAttribute('data-ind')){void sg.offsetWidth;sg.setAttribute('data-ind','')}})}
let segRaf=0;const segLater=()=>{if(!segRaf)segRaf=requestAnimationFrame(()=>{segRaf=0;segSyncAll()})};
new MutationObserver(segLater).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['aria-pressed','aria-selected','hidden']});
addEventListener('resize',segLater);
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(segLater);

/* ---------- paleta de comandos (Ctrl o Cmd + K) ---------- */
const NAVS=[['inicio','Inicio'],['stage','Invernadero'],['nueva','Nueva planta'],['foto','Fotos'],['cuidados','Cuidados'],['calendario','Calendario'],['informes','Informes'],['cosechas','Cosechas'],['costos','Costos'],['biblio','Biblioteca'],['miembros','Miembros'],['ajustes','Ajustes']];
const fold=s=>String(s).normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
let cmdItems=[],cmdSel=0,cmdBack=null;
function cmdBuild(q){
 const all=[];
 NAVS.forEach((n,i)=>all.push({l:'Ir a '+n[1],s:'Sección',kw:n[1],k:i<9?String(i+1):'',run:()=>go(n[0])}));
 all.push({l:S.dark?'Cambiar a modo claro':'Cambiar a modo oscuro',s:'Acción',kw:'tema oscuro claro',run:()=>$('#tema').click()});
 all.push({l:'Plantar una planta nueva',s:'Acción',kw:'nueva semilla sembrar',run:()=>go('nueva')});
 all.push({l:S.simOn?'Salir de la simulación':'Simular crecimiento',s:'Acción',kw:'futuro simulacion',run:()=>{if(S.simOn)setSim(false);else{go('stage');setSim(true)}}});
 S.plants.forEach(p=>{
  all.push({l:'Abrir '+p.name,s:'Planta',kw:seedOf(p).name,run:()=>{S.sel=p.id;go('stage');G.focus(p.id)}});
  all.push({l:'Regar '+p.name,s:'Planta',kw:'riego agua',run:()=>riego(p.id)})});
 const toks=fold(q).split(/\s+/).filter(Boolean);
 return all.filter(it=>{const h=fold(it.l+' '+it.kw);return toks.every(t=>h.indexOf(t)>-1)})}
function cmdRender(){
 const ul=$('#cmdkList');
 ul.innerHTML=cmdItems.length?cmdItems.map((it,i)=>'<li role="option" id="ck'+i+'" data-i="'+i+'" aria-selected="'+(i===cmdSel)+'"><span>'+esc(it.l)+'</span><small>'+(it.k&&!$('#cmdkIn').value?esc(it.k)+' · ':'')+esc(it.s)+'</small></li>').join(''):'<li role="option" aria-selected="false" style="color:var(--tinta2)">Nada coincide</li>';
 $('#cmdkIn').setAttribute('aria-activedescendant',cmdItems.length?'ck'+cmdSel:'');
 const cur=ul.children[cmdSel];if(cur&&cur.scrollIntoView)cur.scrollIntoView({block:'nearest'})}
function cmdOpen(){
 if(document.body.dataset.locked||!$('#viewer').hidden)return;
 cmdBack=document.activeElement;const box=$('#cmdk');box.hidden=false;document.body.dataset.modal='1';
 $('#cmdkIn').value='';cmdItems=cmdBuild('');cmdSel=0;cmdRender();$('#cmdkIn').focus()}
function cmdClose(){const box=$('#cmdk');if(box.hidden)return;box.hidden=true;delete document.body.dataset.modal;if(cmdBack&&cmdBack.focus&&document.contains(cmdBack))cmdBack.focus();cmdBack=null}
function cmdRun(i){const it=cmdItems[i];if(!it)return;cmdClose();it.run()}
$('#cmdkIn').addEventListener('input',e=>{cmdItems=cmdBuild(e.target.value);cmdSel=0;cmdRender()});
$('#cmdkList').addEventListener('click',e=>{const li=e.target.closest('li[data-i]');if(li)cmdRun(+li.dataset.i)});
$('#cmdk').addEventListener('mousedown',e=>{if(e.target===$('#cmdk'))cmdClose()});
$('#cmdkBtn').addEventListener('click',cmdOpen);
document.addEventListener('keydown',e=>{
 if((e.ctrlKey||e.metaKey)&&!e.shiftKey&&!e.altKey&&e.key.toLowerCase()==='k'){e.preventDefault();if($('#cmdk').hidden)cmdOpen();else cmdClose();return}
 if(!$('#cmdk').hidden){
  if(e.key==='Escape'){e.preventDefault();cmdClose()}
  else if(e.key==='ArrowDown'){e.preventDefault();if(cmdItems.length){cmdSel=(cmdSel+1)%cmdItems.length;cmdRender()}}
  else if(e.key==='ArrowUp'){e.preventDefault();if(cmdItems.length){cmdSel=(cmdSel-1+cmdItems.length)%cmdItems.length;cmdRender()}}
  else if(e.key==='Enter'){e.preventDefault();cmdRun(cmdSel)}
  else if(e.key==='Tab'){e.preventDefault()}
  return}
 if(e.ctrlKey||e.metaKey||e.altKey||document.body.dataset.modal||document.body.dataset.locked)return;
 const tg=e.target&&e.target.tagName;if(/^(INPUT|TEXTAREA|SELECT)$/.test(tg)||(e.target&&e.target.isContentEditable))return;
 if(/^[1-9]$/.test(e.key)){const n=NAVS[+e.key-1];if(n){e.preventDefault();go(n[0])}}});

/* ---------- recorrido de la sala ---------- */
const stationList=()=>roomPlants().sort((a,b)=>a.slot-b.slot);
function walkSync(){
 const m=G.camMode,fpm=m==='door'||m==='walk',out=m==='general',p=plantOf(S.sel),sl=p?G.slot(p.id):-1,n=roomPlants().length,lab=roomLabel(S.room);
 document.body.dataset.cam=fpm?'fp':out?'out':'campus';
 const inv='Invernadero '+lab+(n?' · '+pl(n,'planta','plantas'):' vacío');
 $('#walkLbl').textContent=m==='walk'&&p?'Estación '+(sl+1)+' · '+p.name:m==='door'?'Entrada · '+inv:inv;
 $('#camOut').setAttribute('aria-pressed',String(out));$('#camOutTxt').textContent=out?'Volver adentro':'Ver desde afuera';
 $('#camOut').title=out?'Volver adentro del invernadero':'Ver el invernadero desde afuera';
 $('#camResetTxt').textContent=out?'Centrar':'Entrada';$('#camReset').hidden=m==='door';
 const ca=$('#camAuto');ca.hidden=!out;ca.setAttribute('aria-pressed',String(!!S.set.rot));
 $('#sideL').disabled=$('#sideR').disabled=!n;
 const bm=$('#walkbar');bm.classList.toggle('min',!!S.set.barMin);$('#barMin').setAttribute('aria-expanded',String(!S.set.barMin));$('#barMin').title=S.set.barMin?'Desplegar':'Minimizar';$('#barMin').setAttribute('aria-label',S.set.barMin?'Desplegar la barra':'Minimizar la barra');
 const h=$('#roomHint');if(h)h.textContent=fpm?'Arrastrá para mirar alrededor · Rueda para acercar · Flechas para pasar de una planta a otra':'Arrastrá para girar · Shift o click derecho para mover · Rueda para acercar';
 arrowsPlace()}
/* las flechas quedan pegadas al borde de cada panel (o de la pantalla) */
function arrowsPlace(){const L=$('#sideL'),R=$('#sideR');if(!L||!R||document.body.dataset.cam!=='fp')return;
 if(innerWidth<=760){L.style.left='10px';R.style.left=(innerWidth-66)+'px';return}
 const t=$('.today'),pc=$('#plantcard'),rail=document.querySelector('.rail');
 const lx=Math.max(t&&t.offsetParent!==null?t.getBoundingClientRect().right:0,rail?rail.getBoundingClientRect().right:0)+12;
 const rx=pc&&!pc.hidden?pc.getBoundingClientRect().left:innerWidth;
 L.style.left=lx+'px';R.style.left=Math.max(lx+70,rx-12-(R.offsetWidth||56))+'px'}
G.onMode=()=>{walkSync();renderCard()};
addEventListener('resize',arrowsPlace);
if(window.ResizeObserver){const ro=new ResizeObserver(arrowsPlace);['.today','#plantcard'].forEach(q=>{const e=document.querySelector(q);if(e)ro.observe(e)})}
function walkStep(d){const L=stationList();if(!L.length||busy)return;
 if(G.camMode==='general'){let i=L.findIndex(p=>p.id===S.sel);i=i<0?0:(i+d+L.length)%L.length;selectPlant(L[i].id);return}
 /* 0 = entrada, 1..n = cada planta; al pasar la última vuelve a la entrada */
 const C=L.length+1;let c=G.camMode==='door'?0:L.findIndex(p=>p.id===S.sel)+1;if(G.camMode==='walk'&&c<1)c=1;
 const nx=(c+d+C)%C;if(nx===0)G.door();else selectPlant(L[nx-1].id)}
$('#camAuto').addEventListener('click',()=>{S.set.rot=!S.set.rot;const c=$('#sRot');if(c)c.checked=S.set.rot;walkSync()});
$('#camReset').addEventListener('click',()=>{if(G.camMode==='general')G.outside();else G.door()});
$('#sideL').addEventListener('click',()=>walkStep(-1));
$('#sideR').addEventListener('click',()=>walkStep(1));
$('#camOut').addEventListener('click',()=>{if(busy||!S.inRoom)return;const out=G.camMode==='general';transition(()=>{if(out)G.door(true);else G.outside();walkSync();renderCard()})});
$('#barMin').addEventListener('click',()=>{S.set.barMin=!S.set.barMin;walkSync()});
document.addEventListener('keydown',e=>{
 if(S.view!=='stage'||e.ctrlKey||e.metaKey||e.altKey||document.body.dataset.modal||document.body.dataset.locked)return;
 const tg=e.target&&e.target.tagName;if(/^(INPUT|TEXTAREA|SELECT)$/.test(tg))return;
 if(e.key==='Escape'&&S.inRoom){e.preventDefault();leaveRoom();return}
 if(!S.inRoom)return;
 if(e.key==='ArrowRight'||e.key==='d'||e.key==='D'){e.preventDefault();walkStep(1)}
 else if(e.key==='ArrowLeft'||e.key==='a'||e.key==='A'){e.preventDefault();walkStep(-1)}});
