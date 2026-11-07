
/* ---------- navegación ---------- */
const HASH={inicio:'inicio',stage:'invernadero',nueva:'nueva-planta',foto:'fotos',cuidados:'cuidados',calendario:'calendario',informes:'informes',cosechas:'cosechas',costos:'costos',biblio:'biblioteca',miembros:'miembros',ajustes:'ajustes'};
const renderers={};
function go(v,silent){
 if(v==='stage'&&S.view!=='stage'&&S.inRoom)leaveRoom({instant:true});
 if(v!=='stage'&&S.simOn)setSim(false);
 S.view=v;document.body.dataset.view=v;
 $$('.view').forEach(el=>{el.hidden=el.dataset.view!==v});
 $$('.tab').forEach(b=>{if(b.dataset.go===v)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')});
 if(!silent&&location.hash!=='#'+HASH[v])location.hash=HASH[v];
 scrollTo(0,0);G.resize();
 if(renderers[v])renderers[v]();
 stageSync();railSync();segSyncAll()}
addEventListener('hashchange',()=>{const v=Object.keys(HASH).find(k=>'#'+HASH[k]===location.hash);if(v&&v!==S.view)go(v,true)});
$$('.tab[data-go]').forEach(b=>{b.addEventListener('click',()=>{go(b.dataset.go);b.classList.remove('pop');void b.offsetWidth;b.classList.add('pop')});b.addEventListener('animationend',()=>b.classList.remove('pop'))});

/* ---------- invernadero ---------- */
let curTasks=[];
const hasPhotoToday=p=>p.photos.length&&sameDay(p.photos[0].t,Date.now());
function renderRooms(){
 const el=$('#roomsel');if(!el)return;const n=roomPlants().length;
 el.innerHTML='<div class="rtit"><b>Invernadero <button type="button" class="rname" data-rename="1" title="Tocá para cambiar el nombre o el número" aria-label="Cambiar el nombre del invernadero '+esc(roomLabel(S.room))+'"><span>'+esc(roomLabel(S.room))+'</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg></button></b><span class="muted">'+n+' de '+SLOTS.length+' macetas</span></div><div class="rchips" role="group" aria-label="Invernaderos">'+
  S.rooms.map((r,i)=>'<button type="button" class="rc" data-room="'+r.id+'" aria-pressed="'+(r.id===S.room)+'" aria-label="Entrar al invernadero '+esc(roomLabel(r.id))+', '+roomPlants(r.id).length+' macetas" title="Invernadero '+esc(roomLabel(r.id))+'">'+esc(roomLabel(r.id))+'</button>').join('')+
  '<button type="button" class="btn sm rexit" data-leave="1" title="Volver a ver todos los invernaderos (Esc)">Salir</button></div>';
 const a=$('#roomAct');if(a)a.innerHTML='<div class="row tight">'+(n<SLOTS.length?'<button type="button" class="btn sm" data-addpot="1">+ Agregar planta</button>':'<span class="hint">Completo: '+SLOTS.length+' macetas.</span>')+
  (S.rooms.length>1&&!n?'<button type="button" class="btn sm" data-delroom="1">Quitar invernadero</button>':'')+'</div>'}
/* entrar y salir de los invernaderos */
let busy=false;
/* el canvas 3D queda en display:none mientras se ven las tarjetas: al mostrarse hay que reajustar el tamaño o queda en 2x2 */
try{let _rt=0;new ResizeObserver(()=>{if(_rt)return;_rt=requestAnimationFrame(()=>{_rt=0;if(G.resize)G.resize()})}).observe(document.getElementById('gl'))}catch(e){}
function stageSync(){if(!S.inRoom)delete document.body.dataset.sheet;const _rl=document.getElementById('roomLoader');if(_rl&&!S.inRoom)_rl.classList.remove('on');if(_rl&&S.inRoom)setTimeout(()=>_rl.classList.remove('on'),1200);document.body.dataset.in=S.inRoom?'room':'campus';const c=$('#campAdd');if(c)c.hidden=S.inRoom||S.view!=='stage';const h=$('#campHint');if(h){h.hidden=S.inRoom;h.innerHTML='<span>Tocá un invernadero o entrá a:</span>'+S.rooms.map((r,i)=>'<button type="button" class="rc" data-enter="'+r.id+'" aria-label="Entrar al invernadero '+esc(roomLabel(r.id))+'">'+esc(roomLabel(r.id))+'</button>').join('')+'<span>· Tocá el número para cambiarlo</span>'}}
function transition(mid){
 if(!S.set.mot){mid();return}
 busy=true;const f=$('#fade');f.classList.add('on');
 setTimeout(()=>{mid();setTimeout(()=>{f.classList.remove('on');setTimeout(()=>{busy=false},320)},140)},320)}
function enterRoom(rid,o){o=o||{};if(NOD)o.instant=true;var _rl=document.getElementById('roomLoader');if(_rl&&!NOD){_rl.classList.add('on')};if(busy||!S.rooms.some(r=>r.id===rid))return;
 const apply=()=>{S.room=rid;S.inRoom=true;const L=roomPlants();if(!L.some(p=>p.id===S.sel))S.sel=L[0]?L[0].id:null;
  G.zooming=false;G.sync();G.place('room');G.roomView(!o.instant&&S.set.mot);stageSync();labelTags();renderCard();setPcTab();renderPlist();walkSync()};
 if(o.instant||!S.set.mot){apply();return}
 if(S.inRoom){transition(apply);return}
 busy=true;G.zooming=true;G.zoomInto(rid);setTimeout(()=>{busy=false;transition(apply)},420)}
function leaveRoom(o){o=o||{};if(NOD)o.instant=true;if(!S.inRoom||busy)return;const rid=S.room;
 const apply=()=>{S.inRoom=false;G.sync();G.place('campus');G.campusView(o.instant||!S.set.mot?null:rid);stageSync();renderPlist()};
 if(o.instant||!S.set.mot){apply();return}transition(apply)}
function setRoom(id){enterRoom(id)}
G.onPickRoom=id=>enterRoom(id);
document.addEventListener('click',e=>{
 const en=e.target.closest&&e.target.closest('[data-enter]');if(en){enterRoom(en.dataset.enter);return}
 if(e.target.closest&&e.target.closest('#campAdd')){if(busy)return;const r=addRoom();G.sync();toast('Sumaste el invernadero '+roomLabel(r.id)+'. Tocalo para entrar.');renderPlist();stageSync();return}
 const t=e.target.closest&&e.target.closest('#roomsel,#roomAct');if(!t)return;
 const rn=e.target.closest('[data-rename]');if(rn){const b=rn.getBoundingClientRect();openNameEdit(S.room,b.left+b.width/2,b.bottom-8);return}
 const rm=e.target.closest('[data-room]');if(rm){if(rm.dataset.room!==S.room)enterRoom(rm.dataset.room);return}
 if(e.target.closest('[data-leave]')){leaveRoom();return}
 if(e.target.closest('[data-addpot]')){np.room=S.room;np.slot=null;go('nueva');return}
 if(e.target.closest('[data-delroom]')){if(roomPlants().length||S.rooms.length<2)return;const i=S.rooms.findIndex(r=>r.id===S.room);S.rooms.splice(i,1);S.room=S.rooms[Math.max(0,i-1)].id;leaveRoom({instant:true});G.sync();toast('Invernadero quitado')}});
function renderPlist(){
 renderRoom2D();const ul=$('#plist');if(!ul)return;renderRooms();const RP=roomPlants();
 if(!RP.length){ul.innerHTML='<li><p class="hint" style="padding:8px 6px">'+(S.plants.length?'Este invernadero está vacío.':'Todavía no cargaste ninguna planta.')+'</p></li>';return}
 ul.innerHTML=RP.slice().sort((a,b)=>a.slot-b.slot).map(p=>{const st=statusOf(p);return'<li><button type="button" class="pl '+(st.tone==='ok'?'':st.tone)+'" data-pl="'+esc(p.id)+'" aria-current="'+(p.id===S.sel)+'"><i></i><b>'+(G.slot(p.id)>=0?(G.slot(p.id)+1)+'. ':'')+esc(p.name)+'</b><span>'+esc(stageOf(p))+' · '+esc(st.label)+'</span></button></li>'}).join('')}
function renderToday(){
 $('#hoyDate').textContent=fmtDate(S.off,{day:'numeric',month:'short'});
 renderPlist();brandSync();walkSync();
 if(S.view==='inicio')renderHome();
}
$('#plist').addEventListener('click',e=>{const b=e.target.closest('[data-pl]');if(b)selectPlant(b.dataset.pl)});
function noFuture(){if(S.off>.4){toast('Estás viendo el futuro. Volvé a "Hoy" para registrar.');return true}if(S.off>0){S.off=0;renderTime()}return false}
/* aprende tu ritmo de riego a partir de los intervalos que registraste */
function learnRate(p){const ts=p.notes.filter(n=>n.k==='riego'&&!/ya estaba muy/.test(n.x)).map(n=>n.t).sort((a,b)=>b-a).slice(0,6),iv=[];
 for(let i=0;i<ts.length-1;i++){const d=(ts[i]-ts[i+1])/DAY;if(d>=1&&d<=14)iv.push(d)}
 if(iv.length<3)return false;iv.sort((a,b)=>a-b);const med=iv[Math.floor(iv.length/2)],obs=clamp(.5/med,.03,.2);
 p.rate=clamp(.75*p.rate+.25*obs,.03,.2);p.rAge=p.age;return true}
const SUS={seco:['seco',.2],humedo:['húmedo',.55],empapado:['empapado',.93]};
function calibrate(p,lv){const t=SUS[lv];if(!t)return;const hm=humAt(p,0),d=(Date.now()-p.t0)/DAY;let msg='Listo, ya anoté cómo está el sustrato';
 if(t[1]>hm+.12){p.rate=clamp(p.rate*.85,.03,.2);msg='Estaba más húmedo de lo que calculaba: ahora estima que se seca más lento'}
 else if(t[1]<hm-.12&&d>=.5){const obs=(p.h0-t[1])/d;if(obs>.02&&obs<.4){p.rate=clamp(.6*p.rate+.4*obs,.03,.2);msg='Estaba más seco de lo que calculaba: ahora estima que se seca más rápido'}}
 p.rAge=p.age;p.h0=t[1];p.t0=Date.now();logEv(p,'nota','Revisé el sustrato: '+t[0]);toast(msg)}
function riego(id){const p=plantOf(id);if(!p||noFuture())return;const h=hum(p);
 if(S.view==='stage')G.water(id);
 const wet=h>.88;
 toast(wet?p.name+' ya estaba muy húmeda: mejor esperar antes de volver a regar':p.name+' regada');
 setTimeout(()=>{p.h0=wet?Math.min(1,h+.05):Math.max(h,Math.min(.86,h+.5));p.t0=Date.now();logEv(p,'riego',wet?'Riego (el sustrato ya estaba muy húmedo)':'Riego registrado');if(learnRate(p))toast(p.name+' regada. Ajusté el ritmo según tus riegos anteriores');recordHist();stagePulse()},S.view==='stage'?900:350)}
let act=null;
const PODAS=['Poda apical (despunte)','Entrenamiento de bajo estrés (atado)','Defoliación','Supercropping','Poda de ramas bajas','Tutor o malla','Otra'];
const ACT={nota:['Escribí una nota','text'],fert:['Qué le diste (ej: crecimiento 2 ml por litro)','text'],medir:['Altura real en cm (ej: 32,5)','text'],nombre:['Nuevo nombre','text']};
function agoText(t){const d=(Date.now()-t)/DAY;if(d<1/24)return'hace minutos';if(d<1)return'hace '+Math.round(d*24)+' h';const n=Math.floor(d);return n===1?'ayer':'hace '+n+' días'}
function actBox(p){if(!act||act.pid!==p.id)return'';
 if(act.mode==='maceta')return'<form class="actform" id="actForm"><label class="sr" for="actIn">Maceta nueva</label><select id="actIn">'+POTS.map(l=>'<option value="'+l+'"'+(l===p.pot?' selected':'')+'>'+l+' L</option>').join('')+'</select><button class="btn primary" type="submit">Guardar</button><button class="btn" type="button" data-act="cancel">Cancelar</button></form>';
 if(act.mode==='sustrato')return'<form class="actform" id="actForm"><p class="hint" style="flex:1 1 100%">Metele un dedo 3 cm en el sustrato o levantá la maceta. ¿Cómo está?</p><button class="btn" type="button" data-sus="seco">Seco</button><button class="btn" type="button" data-sus="humedo">Húmedo</button><button class="btn" type="button" data-sus="empapado">Empapado</button><button class="btn ghost" type="button" data-act="cancel">Cancelar</button></form>';
 if(act.mode==='poda')return'<form class="actform" id="actForm"><label class="sr" for="actIn">Qué le hiciste</label><select id="actIn">'+PODAS.map(l=>'<option>'+l+'</option>').join('')+'</select><button class="btn primary" type="submit">Guardar</button><button class="btn" type="button" data-act="cancel">Cancelar</button></form>';
 if(act.mode==='cosecha')return'<form class="actform" id="actForm"><p class="hint" style="flex:1 1 100%">Cosechar a '+esc(p.name)+' la pasa al historial de Cosechas. Los pesos son opcionales: los podés cargar después.</p><div class="field" style="flex:1 1 120px"><label for="hWet">Peso húmedo (g)</label><input id="hWet" type="text" inputmode="decimal" placeholder="120"></div><div class="field" style="flex:1 1 120px"><label for="hDry">Peso seco (g)</label><input id="hDry" type="text" inputmode="decimal" placeholder="30"></div><div class="field" style="flex:1 1 100%"><label for="hNote">Cómo salió</label><input id="hNote" type="text" maxlength="200" placeholder="Aroma, densidad, curado…"></div><button class="btn primary" type="submit">Cosechar</button><button class="btn" type="button" data-act="cancel">Cancelar</button></form>';
 if(act.mode==='borrar')return'<form class="actform" id="actForm"><p class="hint" style="flex:1 1 100%">¿Eliminar a '+esc(p.name)+' con todo su historial y sus fotos? No se puede deshacer.</p><button class="btn danger" type="submit">Sí, eliminar</button><button class="btn" type="button" data-act="cancel">Cancelar</button></form>';
 const m=ACT[act.mode];if(!m)return'';
 return'<form class="actform" id="actForm"><label class="sr" for="actIn">'+esc(m[0])+'</label><input id="actIn" type="'+m[1]+'"'+(m[1]==='number'?' min="1" max="500" step="0.5" inputmode="decimal"':' maxlength="140"')+' placeholder="'+esc(m[0])+'"'+(act.mode==='nombre'?' value="'+esc(p.name)+'"':'')+'><button class="btn primary" type="submit">Guardar</button><button class="btn" type="button" data-act="cancel">Cancelar</button></form>'}
/* ficha completa de la planta: todo lo que la app sabe de ella */
const fmtMl=n=>n>=1000?fmtN(n/1000)+' L':Math.round(n)+' ml';
const fmtDF=t=>new Date(t).toLocaleDateString('es-AR',{day:'numeric',month:'long',year:'numeric'});
function subRet(p){const c=(S.subs||[]).find(x=>x.name===p.sub);if(c)return c.ret==='alta'?.38:c.ret==='baja'?.22:.3;
 return /coco/i.test(p.sub||'')?.36:/hidro/i.test(p.sub||'')?.5:/viva/i.test(p.sub||'')?.34:.3}
function waterInfo(p){const h=hum(p),capMl=Math.round(p.pot*1000*subRet(p)),curMl=Math.round(h*capMl),needMl=Math.max(0,Math.round((.9-h)*capMl)),dayMl=Math.round(rateOf(p,S.off)*capMl);
 return{h:h,capMl:capMl,curMl:curMl,needMl:needMl,dayMl:dayMl,recMl:needMl>0?Math.max(50,Math.round(needMl*1.15/50)*50):0}}
function waterHist(p){const ts=p.notes.filter(n=>n.k==='riego').map(n=>n.t).sort((a,b)=>b-a),iv=[];
 for(let i=0;i<ts.length-1&&i<6;i++){const d=(ts[i]-ts[i+1])/DAY;if(d>=.5&&d<=20)iv.push(d)}
 return{n:ts.length,last:ts[0]||null,avg:iv.length?iv.reduce((a,b)=>a+b,0)/iv.length:null}}
function fertInfo(p){const f=FERTS.find(x=>norm(x.name)===norm(p.fert||''));return f}
function subInfo(p){return (S.subs||[]).find(x=>x.name===p.sub)}
function row(a,b){return'<div><span>'+a+'</span><span>'+b+'</span></div>'}
function renderCard(){
 const el=$('#plantcard'),p0=plantOf(S.sel),p=p0&&p0.room===S.room?p0:null;
 if(act&&document.activeElement&&/^(actIn|hWet|hDry|hNote)$/.test(document.activeElement.id))return;
 el.hidden=!p||G.camMode==='door';el.classList.toggle('min',!!S.set.cardMin);if(!p){el.innerHTML='';return}
 const s=seedOf(p),st=statusOf(p),adv=advise(p),w=waterInfo(p),wh=waterHist(p),d=waterDays(p),fi=fertInfo(p),si=subInfo(p);
 const meas=p.meas.length?p.meas[p.meas.length-1]:null,fs=flowerStart(p),age=Math.floor(ageNow(p));
 const ye=yieldEst(p),madre=p.madre?plantAny(p.madre):null,hijos=allPlants().filter(x=>x.madre===p.id).length;
 const slot=G.slot(p.id),cnt=k=>p.notes.filter(n=>n.k===k).length;
 const wetNow=Math.round(w.h*100);
 const nextW=d===0?'Hoy':'En '+d+(d===1?' día':' días')+' ('+new Date(Date.now()+(S.off+d)*DAY).toLocaleDateString('es-AR',{weekday:'short',day:'numeric',month:'short'})+')';
 const recTxt=w.recMl?fmtMl(w.recMl)+', repartido alrededor del tallo, hasta que drene un poco':(st.label==='Exceso de agua'?'Ninguno: esperá a que se seque':'Ninguno por ahora');
 const harvDate=fs!=null?new Date(p.sownAt+(fs+s.fw*7)*DAY):null,flowDate=fs!=null?new Date(p.sownAt+fs*DAY):null,toH=harvDate?Math.round((harvDate-Date.now())/DAY)-S.off:null;
 const lightTxt=s.kind==='auto'?'Autofloreciente: florece sola desde el día 28':(p.flowerAt!=null?'12/12 (floración) desde el día '+Math.round(p.flowerAt):'18/6 (crecimiento)');
 const sec=(t,g,b)=>'<div class="pc-sec" data-g="'+g+'"><h3>'+t+'</h3>'+b+'</div>';
 el.innerHTML='<div class="pc-top"><div><h2>'+esc(p.name)+'</h2><p class="muted">'+esc(s.name)+'</p></div><span class="pcr"><span class="chip '+(st.tone==='ok'?'':st.tone)+'">'+st.label+'</span><button type="button" class="pcmin" data-min="card" aria-expanded="'+(!S.set.cardMin)+'" aria-label="'+(S.set.cardMin?'Desplegar':'Minimizar')+' la ficha" title="'+(S.set.cardMin?'Desplegar':'Minimizar')+'"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button></span></div>'+
 '<div class="sumrow">'+(slot>=0?'<span class="chip plain">Estación '+(slot+1)+'</span>':'')+'<span class="chip plain">'+stageOf(p)+'</span><span class="chip plain">Día '+age+'</span><span class="chip plain">Maceta '+p.pot+' L</span></div>'+ (function(){var pcTab=p.__tab||'resumen';var tb=function(id,t){return '<button type="button" data-pctab="'+id+'" class="'+(pcTab===id?'on':'')+'">'+esc(t)+'</button>'};return '<div class="pc-tabs" role="tablist">'+tb('resumen','Resumen')+tb('crece','Crecimiento')+tb('agua','Agua')+tb('datos','Datos')+tb('reg','Registro')+'</div>'})()+
 '<div class="stats"><div class="stat"><b>'+heightCm(p)+' cm</b><span>Altura estimada</span></div><div class="stat"><b>'+(d===0?'Hoy':d+(d===1?' día':' días'))+'</b><span>Próximo riego</span></div></div>'+
 '<div class="advice '+adv.tone+'"><b>'+esc(adv.title)+'</b><span>'+esc(adv.text)+'</span></div>'+(function(){var rng=RANGOS[stageOf(p)]||RANGOS['Vegetativo'];var e=(S.env||[]).slice().reverse().find(x=>x&&isFinite(x.temp)&&isFinite(x.hum))||{};var vp=(isFinite(e.temp)&&isFinite(e.hum))?vpd(e.temp,e.hum):null;var gT=w.h>.88?'alert':w.h<=.2?'alert':w.h<=.3?'warn':'';var gH=gaugeSvg(clamp(w.h,0,1),gT,wetNow+'%','humedad del sustrato');var hs=[];for(var i=14;i>=0;i--)hs.push(Math.round(humAt(p,-i)*100));var rc='<div class="ranges" style="margin-top:12px">'+rangeChip('Temperatura',isFinite(e.temp)?e.temp:'—','°C',10,40,rng.temp[0],rng.temp[1])+rangeChip('Humedad',isFinite(e.hum)?e.hum:'—','%',20,90,rng.hum[0],rng.hum[1])+rangeChip('VPD',vp!=null?vp:'—','kPa',0,2.5,rng.vpd[0],rng.vpd[1])+rangeChip('pH',isFinite(e.ph)?e.ph:'—','',4,8,rng.ph[0],rng.ph[1])+'</div>';var tip=e.t?'Última medición de ambiente: '+esc(fmtD(e.t))+'. ':'Todavía no cargaste lecturas de ambiente. ';return '<div class="pc-sec" data-g="resumen"><h3>Humedad y ambiente</h3><div class="row" style="align-items:center;gap:20px;flex-wrap:wrap"><div style="flex:0 0 200px">'+gH+'</div><div style="flex:1 1 240px;min-width:0"><p class="muted" style="margin:0">'+(d===0?'Regar hoy':'Próximo riego en '+d+(d===1?' día':' días'))+'</p>'+sparkSvg(hs,'humedad')+'<p class="hint" style="margin:4px 0 0">Humedad del sustrato — últimas 2 semanas</p></div></div>'+rc+'<p class="hint">'+tip+'Rangos orientativos para '+stageOf(p)+'.</p></div>'})()+
 sec('Agua','agua','<div class="field"><div class="hd"><span class="lbl">Humedad del sustrato</span><span class="muted num">'+wetNow+'%</span></div><div class="meter"><i class="'+(w.h>.88||w.h<=.2?'hi':'')+'" style="width:'+wetNow+'%"></i></div></div>'+
  '<div class="facts">'+row('En la maceta ahora','<b class="num">'+fmtMl(w.curMl)+'</b> de '+fmtMl(w.capMl))+row('Le falta para estar bien',w.needMl?'<b class="num">'+fmtMl(w.needMl)+'</b>':'Nada')+row('Riego recomendado',esc(recTxt))+row('Consume por día','~'+fmtMl(w.dayMl))+row('Próximo riego',nextW)+
  row('Último riego',wh.last?agoText(wh.last)+' · '+fmtD(wh.last):'Sin registro')+row('Riegos anotados',wh.n+(wh.avg?' · cada '+fmtN(wh.avg)+' días en promedio':''))+'</div>'+
  '<p class="hint">Son estimaciones: se asume que el sustrato retiene ~'+Math.round(subRet(p)*100)+'% de su volumen en agua. Si la maceta pesa distinto de lo que dice, tocá "Revisé el sustrato" y la app se ajusta.</p>')+
 sec('Rinde esperado','resumen','<div class="facts">'+row('Cosecha estimada','<b>'+gramosN(ye.mid)+'</b> secos')+row('Rango','entre '+fmtN(ye.min)+' y '+fmtN(ye.max)+' g')+row('Confianza',ye.conf)+(S.cost&&cycleCost(p.grow,true).plantas?row('Costo por gramo',(()=>{const c=cycleCost(p.grow,true);return ye.mid>0&&c.total>0?money((c.total/c.plantas)/ye.mid)+'/g':'—'})()):'')+'</div>'+
  '<p class="hint">Se calcula con la genética, el tamaño de maceta, tus mediciones de altura y el estado de la planta. Cuanto más medís, más fino queda. Los precios se cargan en Costos.</p>')+
 sec('Altura','crece',(function(){var m=p.meas.slice(-12).map(x=>x.cm);var n=Math.max(8,Math.floor(age));var st=Math.max(1,Math.floor(n/10));var e=[];for(var i=0;i<=n;i+=st)e.push(heightU(p,i)*CM);e.push(heightU(p,age)*CM);return (m.length>1?'<p class="hint" style="margin:0 0 2px"><b>Tu medición</b></p>'+sparkSvg(m,'altura real'):'')+'<p class="hint" style="margin:12px 0 2px"><b>Estimada por genética</b></p>'+sparkSvg(e,'altura estimada')+(m.length<2?'<p class="hint">Cargá al menos 2 mediciones con el botón "Medí" para comparar con tu curva real.</p>':'')})())+sec('Crecimiento','crece','<div class="facts">'+row('Etapa',stageOf(p))+row('Edad','Día '+age+' desde la siembra')+row('Altura estimada',heightCm(p)+' cm')+(madre?row('Esqueje de',esc(madre.name)):'')+(hijos?row('Esquejes tomados',hijos):'')+row('Última medición real',meas?fmtN(meas.cm)+' cm · '+fmtD(meas.t):'Sin medir')+row('Altura final esperada',esc(s.hcm))+'</div>')+
 sec('Fechas','datos','<div class="facts">'+row('Sembrada',fmtDF(p.sownAt)+' · '+esc(p.hour))+row('Empieza a florecer',flowDate?fmtDF(flowDate):'Sin definir (pasala a 12/12)')+row('Cosecha estimada',harvDate?fmtDF(harvDate)+(toH>0?' · en '+toH+(toH===1?' día':' días'):' · ya toca'):'Se calcula al empezar a florecer')+'</div>')+
 sec('Genética','datos','<div class="facts">'+row('Tipo',esc(s.type))+row('Ciclo',s.kind==='auto'?'Autofloreciente':'Fotoperíodo')+row('Floración',esc(s.flow))+row('Dificultad',['','Muy fácil','Fácil','Media','Exigente','Para expertos'][s.diff]||'')+row('Maceta ideal',s.pot+' L')+(s.banco?row('Banco',esc(s.banco)):'')+(s.linaje?row('Linaje',esc(s.linaje)):'')+'</div><p class="hint">'+esc(s.riego)+' '+esc(s.note)+'</p>')+
 sec('Cultivo','datos','<div class="facts">'+row('Maceta',p.pot+' L')+row('Sustrato',esc(p.sub||'Sin dato'))+row('Lugar',esc(p.loc||'Sin dato'))+row('Ciclo de luz',lightTxt)+row('Fertilizante',esc(p.fert||'Sin dato'))+row('Ciclo de cultivo',esc((S.grows.find(g=>g.id===p.grow)||{}).name||'—'))+'</div>'+
  (si?'<p class="hint"><b>Sustrato:</b> '+esc(si.note||'')+(si.riego?' '+esc(si.riego):'')+'</p>':'')+(fi?'<p class="hint"><b>Fertilizante:</b> '+esc(fi.note)+' '+esc(fi.dose)+'</p>':''))+
 sec('Registro','reg','<div class="facts">'+row('Riegos',cnt('riego'))+row('Notas',cnt('nota'))+row('Fertilizaciones',cnt('fert'))+row('Podas y atados',cnt('poda'))+row('Mediciones',p.meas.length)+row('Fotos',p.photos.length)+'</div>')+
 sec('Acciones','accion',cycHtml(p,s)+
 '<div class="row"><button class="btn water" data-act="water"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3c3.5 4.5 6 7.5 6 11a6 6 0 0 1-12 0c0-3.5 2.5-6.5 6-11z"/></svg>Regar</button><button class="btn" data-act="foto">Foto</button><button class="btn" data-act="nota">Nota</button></div>'+
 '<div class="row tight" style="margin-top:8px"><button class="btn sm" data-act="sustrato">Revisé el sustrato</button><button class="btn sm" data-act="fert">Fertilicé</button><button class="btn sm" data-act="medir">Medí</button><button class="btn sm" data-act="poda">Poda o atado</button></div>'+
 '<div class="row tight" style="margin-top:8px"><button class="btn sm" data-act="esqueje">Hacer esqueje</button><button class="btn sm" data-act="maceta">Trasplanté</button><button class="btn sm'+(stageOf(p)==='Lista para cosechar'?' primary':'')+'" data-act="cosecha">Cosechar</button><button class="btn sm" data-act="nombre">Renombrar</button><button class="btn sm danger" data-act="borrar">Eliminar planta</button></div>'+
 actBox(p))+
 sec('Bitácora','reg','<ul class="log">'+(p.notes.length?p.notes.slice(0,12).map(n=>'<li><span>'+esc(fmtD(n.t))+'</span><span>'+esc(n.x)+'</span></li>').join(''):'<li><span></span><span class="muted">Todavía no hay registros.</span></li>')+'</ul>');
 if(act&&act.pid===p.id){const i=$('#actIn');if(i&&act.focus){act.focus=false;i.focus();if(i.select&&act.mode==='nombre')i.select()}}
}
function cycHtml(p,s){
 if(s.kind==='auto')return'<p class="hint">Autofloreciente: florece sola desde el día 28, con el ciclo de luz que uses.</p>';
 const fl=p.flowerAt!=null;
 return'<div class="field"><span class="lbl">Ciclo de luz de esta planta</span><div class="seg" role="group" aria-label="Ciclo de luz"><button type="button" data-cic="18/6" aria-pressed="'+(!fl)+'">18/6 crecimiento</button><button type="button" data-cic="12/12" aria-pressed="'+fl+'">12/12 floración</button></div>'+(fl?'<p class="hint">Floración desde el día '+Math.round(p.flowerAt)+' ('+new Date(p.sownAt+p.flowerAt*DAY).toLocaleDateString('es-AR')+').</p>':'')+'</div>'}
/* esqueje: una planta nueva con la misma genética, sin costo de semilla */
function hacerEsqueje(m){
 let rid=m.room,sl=freeSlot(rid,null);
 if(sl<0){const r=S.rooms.find(r=>freeSlot(r.id,null)>=0);if(r){rid=r.id;sl=freeSlot(rid,null)}else{const nr=addRoom();rid=nr.id;sl=0}}
 const n=allPlants().filter(x=>x.madre===m.id).length+1,ahora=Date.now(),s=seedOf(m);
 const pot=Math.max(1,Math.min(m.pot,3)),sub=m.sub||'';
 const p={id:'p'+ahora.toString(36)+Math.floor(Math.random()*1e3),name:(m.name+' · esqueje '+n).slice(0,24),seed:m.seed,sownAt:ahora,age:0,pot:pot,h0:.8,t0:ahora,
  rate:baseRate(pot,0,sub),rAge:0,flowerAt:null,grow:S.grow,hour:new Date().toTimeString().slice(0,5),sub:sub,loc:m.loc||'',room:rid,slot:sl,
  fert:m.fert||'Recomendado por el asistente',madre:m.id,notes:[],photos:[],meas:[]};
 p.notes.push({t:ahora,k:'siembra',x:'Esqueje de '+m.name+' ('+s.name+'), en maceta de '+pot+' L'});
 S.plants.push(p);logEv(m,'poda','Se le tomó un esqueje: '+p.name);
 recordHist();G.sync();selectPlant(p.id);
 toast('Listo: '+p.name+' entró al invernadero '+roomLabel(rid)+'. Mantenelo húmedo y sin sol directo los primeros días.')}
function harvestPlant(p,wet,dry,note){
 const ok=x=>isFinite(x)&&x>=0&&x<=20000;if((isFinite(wet)&&!ok(wet))||(isFinite(dry)&&!ok(dry))){toast('Revisá los pesos: tienen que ser números en gramos');return}
 p.harvest={t:Date.now(),wet:isFinite(wet)?wet:null,dry:isFinite(dry)?dry:null,note:note||''};p.age=(p.harvest.t-p.sownAt)/DAY;
 logEv(p,'cosecha','Cosechada'+(p.harvest.dry!=null?': '+fmtN(p.harvest.dry)+' g secos':p.harvest.wet!=null?': '+fmtN(p.harvest.wet)+' g húmedos':''));
 recordHist();S.plants=S.plants.filter(x=>x.id!==p.id);S.archive.unshift(p);
 if(S.sel===p.id)S.sel=S.plants[0]?S.plants[0].id:null;act=null;if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();
 G.sync();labelTags();if(S.sel)G.focus(S.sel);else G.door();stagePulse();toast(p.name+' cosechada. La encontrás en Cosechas')}
function removePlant(id){const p=plantOf(id);if(!p)return;
 S.plants=S.plants.filter(x=>x.id!==id);delete S.hist[id];store.deletePlantPhotos(id);
 if(S.sel===id)S.sel=S.plants[0]?S.plants[0].id:null;
 act=null;G.sync();labelTags();if(S.sel)G.focus(S.sel);else G.door();stagePulse();toast(p.name+' eliminada')}
$('#plantcard').addEventListener('click',e=>{if(e.target.closest('[data-min]')){S.set.cardMin=!S.set.cardMin;renderCard();return}const cb=e.target.closest('[data-cic]');if(cb){setPlantCycle(S.sel,cb.dataset.cic);return}const sb=e.target.closest('[data-sus]');if(sb){const p=plantOf(S.sel);if(p&&!noFuture()){calibrate(p,sb.dataset.sus);act=null;stagePulse()}return}
 const b=e.target.closest('[data-act]');if(!b)return;const a=b.dataset.act;
 if(a==='nueva'){go('nueva');return}
 const p=plantOf(S.sel);if(!p)return;
 if(a==='cancel'){act=null;renderCard();return}
 if(a==='water'){riego(p.id);return}
 if(a==='foto'){go('foto');return}
 if(a==='esqueje'){if(noFuture())return;hacerEsqueje(p);return}
 if(['nota','fert','medir','maceta','nombre','borrar','sustrato','poda','cosecha'].includes(a)){if(a!=='nombre'&&a!=='borrar'&&noFuture())return;act={mode:a,pid:p.id,focus:true};renderCard()}});
$('#plantcard').addEventListener('submit',e=>{e.preventDefault();if(e.target.id!=='actForm'||!act)return;const p=plantOf(act.pid);if(!p){act=null;return}
 const mode=act.mode,v=($('#actIn')||{}).value;if(mode==='sustrato')return;const val=(v||'').trim();
 if(mode==='borrar'){removePlant(p.id);return}
 if(mode==='nota'&&val){logEv(p,'nota',val);toast('Nota guardada')}
 else if(mode==='fert'&&val){logEv(p,'fert','Fertilizante: '+val);p.fert=val;toast('Fertilizante anotado')}
 else if(mode==='medir'){const n=parseFloat(val.replace(',','.'));if(!(n>0&&n<=500)){toast('Poné una altura en centímetros, por ejemplo 32');return}p.meas.push({t:Date.now(),cm:n});logEv(p,'medida','Medida real: '+fmtN(n)+' cm');toast('Medida guardada')}
 else if(mode==='maceta'){const l=+v;if(l&&l!==p.pot){logEv(p,'trasplante','Trasplante: de '+p.pot+' L a '+l+' L');p.rate=clamp(p.rate*Math.pow(p.pot/l,.35),.03,.2);p.rAge=p.age;p.h0=hum(p);p.t0=Date.now();p.pot=l;toast('Maceta actualizada')}}
 else if(mode==='poda'&&val){logEv(p,'poda',val);toast('Anotado: '+val.toLowerCase())}
 else if(mode==='cosecha'){harvestPlant(p,num(($('#hWet')||{}).value),num(($('#hDry')||{}).value),(($('#hNote')||{}).value||'').trim());return}
 else if(mode==='nombre'&&val){const old=p.name;if(val!==old){p.name=val;logEv(p,'nota','Renombrada (antes: '+old+')');labelTags()}}
 act=null;if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();stagePulse()});
/* etiquetas sobre las plantas */
const tagEls=new Map();
function labelTags(){
 const box=$('#tags');
 S.plants.forEach(p=>{if(!tagEls.has(p.id)){const b=document.createElement('button');b.type='button';b.innerHTML='<i></i><span></span>';b.addEventListener('click',()=>selectPlant(p.id));box.appendChild(b);tagEls.set(p.id,b)}});
 tagEls.forEach((b,id)=>{const p=plantOf(id);if(!p){b.remove();tagEls.delete(id);return}
  const st=statusOf(p),cls='tag'+(st.tone==='warn'?' warn':'')+(id===S.sel?' sel':'');
  if(b.className!==cls)b.className=cls;
  const sl=G.slot(id),tx=(sl>=0?(sl+1)+' · ':'')+p.name+' · '+st.label,lab=b.lastChild;if(lab.textContent!==tx)lab.textContent=tx;b.setAttribute('aria-label',tx+'. Ver ficha')});
}
function placeTags(){if(S.view!=='stage')return;
 if(!S.inRoom||!S.set.tags)return;
 tagEls.forEach((b,id)=>{if(G.camMode==='walk'&&id!==S.sel){b.style.visibility='hidden';return}const pr=G.project(id,.55);if(!pr||!pr.ok){b.style.visibility='hidden';return}b.style.visibility='';b.style.transform='translate3d('+pr.x.toFixed(1)+'px,'+pr.y.toFixed(1)+'px,0) translate(-50%,-110%)'})}
function selectPlant(id){const pp=plantOf(id);if(pp&&(pp.room!==S.room||!S.inRoom)){busy=false;enterRoom(pp.room,{instant:true})}S.sel=id;G.focus(id);renderCard();renderPlist();labelTags();walkSync()}
G.onPickEmpty=sl=>{if(!S.inRoom)return;np.room=S.room;np.slot=sl;toast('Estación '+(sl+1)+' libre: cargá una planta nueva');go('nueva')};
G.onPick=selectPlant;
/* nombre o número del invernadero: se edita tocando el cartel */
let nameFor=null;
function openNameEdit(rid,x,y){const r=S.rooms.find(q=>q.id===rid);if(!r)return;nameFor=rid;const f=$('#nameEdit'),i=$('#neIn');i.value=r.name||String(roomNo(rid));f.hidden=false;
 const w=f.offsetWidth||250,h=f.offsetHeight||52;f.style.left=Math.max(8,Math.min(innerWidth-w-8,x-w/2))+'px';f.style.top=Math.max(8,Math.min(innerHeight-h-8,y+14))+'px';i.focus();i.select()}
function closeNameEdit(save){const f=$('#nameEdit');if(f.hidden)return;const rid=nameFor;nameFor=null;f.hidden=true;if(!save)return;const r=S.rooms.find(q=>q.id===rid);if(!r)return;
 let v=$('#neIn').value.replace(/\s+/g,' ').trim().slice(0,14);if(v===String(roomNo(rid)))v='';
 if((r.name||'')===v)return;if(v)r.name=v;else delete r.name;
 G.sync();stageSync();renderPlist();walkSync();labelTags();toast(v?'Invernadero renombrado: '+v:'Volvió al número '+roomNo(rid))}
G.onPickLabel=(rid,x,y)=>{if(busy)return;openNameEdit(rid,x,y)};
$('#nameEdit').addEventListener('submit',e=>{e.preventDefault();closeNameEdit(true)});
$('#nameEdit').addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();closeNameEdit(false)}});
document.addEventListener('pointerdown',e=>{if(!$('#nameEdit').hidden&&!e.target.closest('#nameEdit'))closeNameEdit(true)},true);
$('#viewAll').addEventListener('click',()=>{G.door()});
/* tiempo */
function renderTime(){const o=S.off;$('#tlLabel').textContent=o<.5?'Hoy':'Dentro de '+Math.round(o)+' días';$('#tlDate').textContent=fmtDate(o);$('#off').value=o}
function stagePulse(){G.rebuild();renderTime();renderCard();renderToday();labelTags()}
$('#off').addEventListener('input',e=>{S.off=+e.target.value;S.playing=false;renderPlay();stagePulse()});
function renderPlay(){$('#playIco').innerHTML=S.playing?'<path d="M7 5h4v14H7zM13 5h4v14h-4z"/>':'<path d="M8 5v14l11-7z"/>';$('#play').setAttribute('aria-label',S.playing?'Pausar el crecimiento':'Reproducir el crecimiento')}
$('#play').addEventListener('click',()=>{if(!S.playing&&S.off>=69.9)S.off=0;S.playing=!S.playing;renderPlay();if(S.playing){G.door();toast('Mirá cómo crecen en las próximas 10 semanas')}});
/* ciclo de luz por planta */
function setPlantCycle(id,c){const p=plantOf(id);if(!p||noFuture())return;const s=seedOf(p);if(s.kind==='auto')return;
 if(c==='12/12'&&p.flowerAt==null){p.flowerAt=Math.max(p.age,24);logEv(p,'ciclo','Pasó a 12/12 (floración)'+(p.age<24?'. Empieza a florecer al cumplir 24 días':''));toast(p.name+' pasó a 12/12')}
 else if(c==='18/6'&&p.flowerAt!=null){p.flowerAt=null;logEv(p,'ciclo','Volvió a 18/6 (vegetativo)');toast(p.name+' volvió a 18/6')}
 recordHist();stagePulse()}
/* simulación del futuro */
function setSim(on){S.simOn=on;if(on)document.body.dataset.sim='1';else delete document.body.dataset.sim;$('#timebar').hidden=!on;$('#simTag').hidden=!on;$('#simBtn').textContent=on?'Salir de la simulación':'Simular crecimiento';
 if(!on){S.off=0;S.playing=false;renderPlay();stagePulse()}else{G.overview();renderTime()}}
$('#simBtn').addEventListener('click',()=>setSim(!S.simOn));
$('#simClose').addEventListener('click',()=>setSim(false));
/* lámpara día y noche (ajuste) */
function setDay(v){S.day=v;document.documentElement.dataset.luz=v?'dia':'noche';const el=$('#sLuz');if(el)el.checked=v}
/* tema claro, oscuro o automático */
function computeDark(){const t=S.set.tema;if(t==='oscuro')return true;if(t==='claro')return false;const x=document.documentElement.dataset.theme;if(x==='dark')return true;if(x==='light')return false;return matchMedia('(prefers-color-scheme: dark)').matches}
function applyTema(){const t=S.set.tema,r=document.documentElement;r.classList.add('no-trans');requestAnimationFrame(()=>requestAnimationFrame(()=>r.classList.remove('no-trans')));if(t==='auto')delete r.dataset.tema;else r.dataset.tema=t;S.dark=computeDark();
 const b=$('#tema');b.setAttribute('aria-pressed',String(S.dark));b.setAttribute('aria-label',S.dark?'Cambiar a modo claro':'Cambiar a modo oscuro');$('#temaTxt').textContent=S.dark?'Modo claro':'Modo oscuro';
 $('#temaIco').innerHTML=S.dark?'<circle cx="12" cy="12" r="4"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"/>':'<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/>';
 $$('#sTema button').forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.tema===t)))}
$('#tema').addEventListener('click',()=>{S.set.tema=S.dark?'claro':'oscuro';applyTema()});
$('#sTema').addEventListener('click',e=>{const b=e.target.closest('[data-tema]');if(!b)return;S.set.tema=b.dataset.tema;applyTema();toast('Tema: '+b.textContent.toLowerCase())});
/* bucle de interfaz */
let last=performance.now(),uiAcc=0;
function uiLoop(now){requestAnimationFrame(uiLoop);const dt=Math.min(.05,(now-last)/1000);last=now;
 if(S.playing){S.off=Math.min(70,S.off+dt*5);G.rebuild();uiAcc+=dt;
  if(uiAcc>.12||S.off>=70){uiAcc=0;renderTime();renderCard();renderToday();labelTags()}
  if(S.off>=70){S.playing=false;renderPlay()}}
 placeTags()}

$('#plantcard').addEventListener('click',e=>{var b=e.target.closest('[data-pctab]');if(!b)return;var p=plantOf(S.sel);if(!p)return;p.__tab=b.dataset.pctab;renderCard();setPcTab()});

function setPcTab(){var p=plantOf(S.sel),tab=(p&&p.__tab)||'resumen';var el=$('#plantcard');if(el){el.classList.remove('pc','tab-resumen','tab-crece','tab-agua','tab-datos','tab-reg');el.classList.add('pc','tab-'+tab)}}
renderers.stage=()=>{renderToday();renderCard();renderTime();labelTags()};

/* ---------- vista 2D de invernaderos ---------- */
function renderCampus(){
 const grid=$('#campgrid');if(!grid)return;
 const parts=S.rooms.map((r,i)=>{
  const plants=S.plants.filter(p=>p.room===r.id),free=SLOTS.length-plants.length;
  const anyWarn=plants.filter(p=>at0(()=>statusOf(p)).tone==='warn').length;
  const anyWater=plants.filter(p=>at0(()=>statusOf(p)).tone==='water').length;
  const chip=plants.length===0?'<span class="gh-chip empty">Vacío</span>':
   anyWarn?'<span class="gh-chip alert">'+anyWarn+' con alerta</span>':
   anyWater?'<span class="gh-chip warn">'+anyWater+' a regar</span>':
   '<span class="gh-chip">Todo en orden</span>';
  /* las plantas se ven adentro, atrás del vidrio */
  const svgDots=plants.slice(0,SLOTS.length).map((p,k)=>{const t=at0(()=>statusOf(p)).tone;const col=t==='warn'?'#EE6B1F':t==='water'?'#5E9A7B':'#2b7a4b';const row=Math.floor(k/3),col3=k%3;const cx=58+col3*42,cy=112+row*14;return'<g transform="translate('+cx+' '+cy+')"><ellipse cx="0" cy="2" rx="5" ry="2" fill="rgba(0,0,0,.18)"/><circle cx="0" cy="0" r="5.5" fill="'+col+'"/><circle cx="-1.5" cy="-1.5" r="1.8" fill="rgba(255,255,255,.5)"/><animateTransform attributeName="transform" type="translate" values="'+cx+' '+cy+';'+cx+' '+(cy-1.5).toFixed(1)+';'+cx+' '+cy+'" dur="'+(2.8+k*.19).toFixed(1)+'s" repeatCount="indefinite"/></g>'}).join('');
  const svg='<svg class="gh-house" viewBox="0 0 240 180" preserveAspectRatio="xMidYMax meet" aria-hidden="true">'+
   /* sombra del piso */'<ellipse cx="120" cy="172" rx="96" ry="5" fill="rgba(0,0,0,.14)"/>'+
   /* base de ladrillo */'<rect x="26" y="138" width="188" height="26" rx="2" fill="url(#gh-brick)"/>'+
   '<rect x="26" y="138" width="188" height="26" rx="2" fill="url(#gh-brickShade)"/>'+
   /* paredes de vidrio laterales */'<rect x="26" y="90" width="188" height="48" fill="url(#gh-glass)" opacity=".88"/>'+
   /* techo a dos aguas: borde oscuro + vidrio */
   '<path d="M18 95 L120 24 L222 95 Z" fill="#2d3a33"/>'+
   '<path d="M26 95 L120 30 L214 95 Z" fill="url(#gh-roof)" opacity=".95"/>'+
   /* cresta del techo */'<rect x="26" y="93" width="188" height="4" fill="#2d3a33"/>'+
   /* marcos del techo */
   '<g stroke="#2d3a33" stroke-width="1.6" fill="none" stroke-linecap="round">'+
    '<line x1="120" y1="30" x2="120" y2="95"/>'+
    '<line x1="26" y1="95" x2="120" y2="30"/>'+
    '<line x1="120" y1="30" x2="214" y2="95"/>'+
    '<line x1="54" y1="74" x2="120" y2="54"/>'+
    '<line x1="120" y1="54" x2="186" y2="74"/>'+
    '<line x1="76" y1="95" x2="120" y2="62"/>'+
    '<line x1="120" y1="62" x2="164" y2="95"/>'+
   '</g>'+
   /* marcos verticales de las paredes */
   '<g stroke="#2d3a33" stroke-width="1.6" fill="none">'+
    '<line x1="56" y1="97" x2="56" y2="138"/>'+
    '<line x1="88" y1="97" x2="88" y2="138"/>'+
    '<line x1="152" y1="97" x2="152" y2="138"/>'+
    '<line x1="184" y1="97" x2="184" y2="138"/>'+
    '<rect x="26" y="90" width="188" height="48" rx="1"/>'+
   '</g>'+
   /* reflejo del vidrio */
   '<path d="M30 94 L50 94 L72 134 L52 134 Z" fill="rgba(255,255,255,.26)"/>'+
   /* plantas */'<g>'+svgDots+'</g>'+
   /* puerta con marco visible */
   '<rect x="104" y="106" width="32" height="32" fill="#faf5e8"/>'+
   '<rect x="104" y="106" width="32" height="32" fill="none" stroke="#2d3a33" stroke-width="1.6"/>'+
   '<line x1="120" y1="106" x2="120" y2="138" stroke="#2d3a33" stroke-width="1.4"/>'+
   '<circle cx="116" cy="124" r="1.3" fill="#8a5a2a"/>'+
   '<circle cx="124" cy="124" r="1.3" fill="#8a5a2a"/>'+
   /* escalón */'<rect x="100" y="138" width="40" height="4" fill="#e0d7c3"/>'+
   '<rect x="100" y="138" width="40" height="4" fill="none" stroke="#8a7a5c" stroke-width=".8"/>'+
   /* macetas al frente */
   '<g><rect x="34" y="150" width="16" height="12" rx="1" fill="#8a5a2a"/><circle cx="42" cy="146" r="6" fill="#4a7540"/></g>'+
   '<g><rect x="190" y="150" width="16" height="12" rx="1" fill="#8a5a2a"/><circle cx="198" cy="146" r="6" fill="#4a7540"/></g>'+
   '<defs>'+
    '<linearGradient id="gh-roof" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6f3e5" stop-opacity=".92"/><stop offset=".7" stop-color="#d9e2cf" stop-opacity=".85"/><stop offset="1" stop-color="#b8c7ad" stop-opacity=".8"/></linearGradient>'+
    '<linearGradient id="gh-glass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fcfaef" stop-opacity=".95"/><stop offset="1" stop-color="#e4e9d5" stop-opacity=".85"/></linearGradient>'+
    '<linearGradient id="gh-brick" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--ladrillo)"/><stop offset="1" style="stop-color:var(--ladrillo2)"/></linearGradient>'+
    '<pattern id="gh-brickShade" x="0" y="0" width="22" height="10" patternUnits="userSpaceOnUse"><line x1="0" y1="5" x2="22" y2="5" stroke="rgba(60,30,15,.4)" stroke-width=".7"/><line x1="11" y1="0" x2="11" y2="5" stroke="rgba(60,30,15,.4)" stroke-width=".7"/><line x1="0" y1="5" x2="0" y2="10" stroke="rgba(60,30,15,.4)" stroke-width=".7"/><line x1="22" y1="5" x2="22" y2="10" stroke="rgba(60,30,15,.4)" stroke-width=".7"/></pattern>'+
   '</defs></svg>';
  return'<button class="gh-card" type="button" data-enter="'+esc(r.id)+'" aria-label="Entrar al invernadero '+esc(roomLabel(r.id))+'">'+
   '<div class="gh-hd"><div><h3>Invernadero '+esc(roomLabel(r.id))+'</h3><span class="gh-sub">'+plants.length+' de '+SLOTS.length+' estaciones · '+(free?free+' libres':'completo')+'</span></div>'+chip+'</div>'+
   '<div class="gh-house-wrap"><i class="gh-cloud" style="top:22px"></i><i class="gh-cloud c2"></i>'+svg+'</div>'+
   '<div class="gh-foot"><div class="gh-stats">'+(plants.length?'<span>Altura media <b>'+Math.round(plants.reduce((a,p)=>a+heightCm(p),0)/plants.length)+' cm</b></span>':'<span>Sin plantas todavía</span>')+'</div><span class="gh-link">Entrar →</span></div>'+
   '</button>'});
 parts.push('<button class="gh-card gh-add" type="button" id="ghAdd" aria-label="Agregar invernadero"><span class="plus">+</span><span>Agregar invernadero</span><span class="hint" style="text-align:center;margin:0">Hasta '+SLOTS.length+' estaciones por invernadero</span></button>');
 grid.innerHTML=parts.join('');
 const sub=$('#campSub'),total=S.plants.length;
 if(sub)sub.textContent=S.rooms.length+(S.rooms.length===1?' invernadero · ':' invernaderos · ')+total+' planta'+(total===1?'':'s')+' en total.';
}
/* enganche: cuando se renderiza stage y estamos en campus, dibujar también la vista 2D */
const oldStageR=renderers.stage;
renderers.stage=function(){if(oldStageR)oldStageR();if(!S.inRoom)renderCampus()};
document.addEventListener('click',e=>{
 const sl=e.target.closest&&e.target.closest('.gh-slot[data-pid]');
 if(sl&&!S.inRoom){e.preventDefault();e.stopPropagation();enterRoom(sl.dataset.rid);setTimeout(()=>{selectPlant(sl.dataset.pid)},200);return}
 const emp=e.target.closest&&e.target.closest('.gh-slot[data-sl]:not(.has)');
 if(emp&&!S.inRoom){e.preventDefault();e.stopPropagation();const rid=emp.dataset.rid,sl=+emp.dataset.sl;enterRoom(rid);setTimeout(()=>{np.room=rid;np.slot=sl;go('nueva')},400);return}
 const add=e.target.closest&&e.target.closest('#ghAdd');
 if(add&&!S.inRoom){e.preventDefault();if(busy)return;const r=addRoom();G.sync();renderCampus();toast('Sumaste el invernadero '+roomLabel(r.id)+'. Tocalo para entrar.')}
},true);
/* lo volvemos a dibujar cuando se agrega o quita una planta */
const oldSync=G.sync;G.sync=function(){oldSync();if(!S.inRoom&&S.view==='stage')renderCampus()};
