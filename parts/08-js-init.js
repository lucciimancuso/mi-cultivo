
/* ---------- ajustes ---------- */
function pressed(group,attr,val){$$(group+' button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset[attr]===val)))}
$('#sQ').addEventListener('click',e=>{const b=e.target.closest('[data-q]');if(!b)return;S.set.q=b.dataset.q;pressed('#sQ','q',S.set.q);G.setQuality(S.set.q);toast('Calidad gráfica: '+S.set.q)});
$('#sDet').addEventListener('click',e=>{const b=e.target.closest('[data-det]');if(!b)return;S.set.det=b.dataset.det;pressed('#sDet','det',S.set.det);toast('Los consejos van a ser más '+(S.set.det==='breve'?'cortos':S.set.det==='largo'?'explicados':'equilibrados'))});
$('#sTags').addEventListener('change',e=>{S.set.tags=e.target.checked;document.body.dataset.tags=e.target.checked?'on':'off'});
$('#sLuz').addEventListener('change',e=>setDay(e.target.checked));
$('#sRot').addEventListener('change',e=>{S.set.rot=e.target.checked;walkSync()});
$('#sPaisaje').addEventListener('change',e=>{S.set.paisaje=e.target.checked;if(sceneOk)G.setPaisaje(e.target.checked);toast(e.target.checked?'Paisaje encendido':'Invernadero en modo limpio')});
$('#sMot').addEventListener('change',e=>{S.set.mot=e.target.checked;document.body.dataset.motion=e.target.checked?'on':'off'});
$('#sFondo').addEventListener('change',e=>{S.set.fondo=e.target.checked;document.body.dataset.fondo=e.target.checked?'on':'off'});
$('#sAvisos').addEventListener('change',e=>{S.set.avisos=e.target.checked;toast(e.target.checked?'Listo: te aviso cuando alguna planta pida agua':'Avisos de riego apagados')});
$('#sAvisoHora').addEventListener('change',e=>{S.set.avisoHora=e.target.value||'09:00'});
$('#sAvisoTest').addEventListener('click',()=>chequearAvisos(true));
$('#sFotoDia').addEventListener('change',e=>{S.set.fotoDia=e.target.checked;renderToday()});
$('#sLuzOn').addEventListener('change',e=>{if(/^\d{2}:\d{2}$/.test(e.target.value)){S.set.luzOn=e.target.value;toast('La lámpara se enciende a las '+e.target.value)}else e.target.value=S.set.luzOn||'06:00'});
$('#sPh').addEventListener('change',e=>{S.set.ph=e.target.checked;renderToday()});
function csvCell(v){v=String(v==null?'':v);return /[",\n;]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v}
$('#sExp').addEventListener('click',async()=>{
 const rows=[['Fecha','Hora','Planta','Genética','Tipo','Detalle']];
 allPlants().forEach(p=>p.notes.forEach(n=>{const d=new Date(n.t);rows.push([d.toLocaleDateString('es-AR'),d.toLocaleTimeString('es-AR',{hour:'2-digit',minute:'2-digit',hour12:false}),p.name,seedOf(p).name,n.k||'nota',n.x])}));
 if(rows.length===1){toast('Todavía no hay nada para exportar');return}
 rows.splice(1,rows.length-1,...rows.slice(1).sort((a,b)=>{const pa=a[0].split('/').reverse().join('-')+a[1],pb=b[0].split('/').reverse().join('-')+b[1];return pa<pb?1:-1}));
 const r=await store.exportFile('bitacora-mi-cultivo.csv','﻿'+rows.map(r=>r.map(csvCell).join(';')).join('\r\n'),'text/csv');
 if(r&&r.ok)toast('Bitácora exportada')});
$('#sBackup').addEventListener('click',async()=>{saveNow(true);const r=await store.backup();if(r&&r.ok)toast('Copia guardada');else if(r&&r.msg)toast(r.msg)});
$('#sRestore').addEventListener('click',async()=>{const r=await store.restore();if(r&&r.ok){toast('Copia restaurada');setTimeout(()=>location.reload(),700)}else if(r&&r.msg)toast(r.msg)});
$('#sOpen').addEventListener('click',()=>store.openDir());
function resetState(plants){S.rooms=[{id:'r1'}];S.room='r1';S.plants=plants;ensurePlacement();S.archive=[];S.grows=[];S.grow=null;S.env=[];S.hist={};ensureGrow();plants.forEach(p=>{p.grow=S.grow});S.sel=plants[0]?plants[0].id:null;S.off=0;S.playing=false;act=null;if(S.simOn)setSim(false);S.shot=null;S.result=null;renderPlay();G.sync();S.inRoom=false;G.place('campus');G.campusView();labelTags();go('inicio');recordHist();stagePulse()}
$('#sDemo').addEventListener('click',()=>{if(S.plants.length||S.archive.length){toast('Para cargar el ejemplo, primero borrá todo');return}resetState(demoPlants());toast('Cargué cuatro plantas de ejemplo')});
let wipeT=0;
$('#sWipe').addEventListener('click',()=>{
 if(!wipeT){$('#wipeHint').hidden=false;$('#sWipe').textContent='Sí, borrar todo';wipeT=setTimeout(()=>{wipeT=0;$('#wipeHint').hidden=true;$('#sWipe').textContent='Borrar todo'},6000);return}
 clearTimeout(wipeT);wipeT=0;$('#wipeHint').hidden=true;$('#sWipe').textContent='Borrar todo';
 allPlants().forEach(p=>store.deletePlantPhotos(p.id));resetState([]);toast('Se borraron todos los datos')});
function refreshAI(){$('#keyState').textContent=cloud.on?'La IA está activa: mira tus fotos, busca datos de semillas y sigue tu guía.':'La IA necesita que entres con tu cuenta (arriba).'}
/* copia automática, PIN y bloqueo */
async function refreshPriv(){const c=await store.cfgGet();
 $('#sAuto').checked=!!c.autoBackup;$('#sAuto').disabled=!store.isDesktop;
 $('#sAutoHint').textContent=store.isDesktop?'Cada día guarda una copia de cómo estaba todo y deja las últimas 7'+(c.lastBackup?'. Última: '+fmtDT(c.lastBackup):'')+'. Las fotos no se copian: quedan en la carpeta de datos.':'Solo funciona en la app de escritorio.';
 $('#pinState').textContent=c.hasPin?'El PIN está activado: se pide al abrir la app'+(c.desktop?'.':' y si la dejás en segundo plano más de un minuto.'):'No hay PIN. Cualquiera que abra la app ve tus plantas.';
 $('#pinCur').closest('.field').hidden=!c.hasPin;$('#pinClear').hidden=!c.hasPin;$('#pinLock').hidden=!c.hasPin;
 $('#pinSet').textContent=c.hasPin?'Cambiar PIN':'Activar PIN';$('#pinSet').disabled=false;$('#pinNew').disabled=false}
$('#sAuto').addEventListener('change',async e=>{const r=await store.cfgSet({autoBackup:e.target.checked});toast(e.target.checked?'Copia automática activada':'Copia automática apagada');refreshPriv()});
$('#pinSet').addEventListener('click',async()=>{const n=$('#pinNew').value.trim();if(!/^\d{4,12}$/.test(n)){toast('El PIN tiene que tener entre 4 y 12 números');return}
 const r=await store.pinSet($('#pinCur').value.trim(),n);$('#pinCur').value='';$('#pinNew').value='';toast(r&&r.ok?'PIN guardado':(r&&r.msg)||'No pude guardar el PIN');refreshPriv()});
$('#pinClear').addEventListener('click',async()=>{const r=await store.pinClear($('#pinCur').value.trim());$('#pinCur').value='';toast(r&&r.ok?'PIN quitado':(r&&r.msg)||'No pude quitar el PIN');refreshPriv()});
$('#pinLock').addEventListener('click',async()=>{saveNow(true);await store.lockNow();location.reload()});
async function gate(){const c=await store.cfgGet();if(!c.locked)return;
 document.body.dataset.locked='1';const box=$('#lock');box.hidden=false;$('#lockPin').focus();
 await new Promise(res=>{$('#lockForm').addEventListener('submit',async ev=>{ev.preventDefault();const r=await store.unlock($('#lockPin').value.trim());
  if(r&&r.ok){box.hidden=true;delete document.body.dataset.locked;res()}else{$('#lockMsg').textContent=(r&&r.msg)||'PIN incorrecto';$('#lockPin').value='';$('#lockPin').focus()}})})}
renderers.ajustes=()=>{refreshAI();refreshPriv();renderCloudCard();$('#dataWhere').textContent=cloud.on?'Tus plantas se guardan en el servidor de tu grupo y en este dispositivo. Las fotos van a un almacenamiento privado que solo ve tu grupo.':store.isDesktop?'Todo se guarda en esta compu, en la carpeta de datos de la app. No se sube a ningún lado.':'Los datos se guardan solo en este navegador.'};

/* ---------- arranque ---------- */
(async function boot(){
 await gate();
 await cloud.boot();
 await loadAll();
 if(cloud.on)await cloud.initialSync();
 const sceneOk=initScene();
 if(!sceneOk&&!NOD){const sp=$('.spacer');sp.setAttribute('aria-hidden','false');sp.innerHTML='<p class="muted glass card">No pude iniciar el 3D en este equipo. El resto de la app funciona igual.</p>'}
 $('#sMot').checked=S.set.mot;$('#sFondo').checked=S.set.fondo!==false;document.body.dataset.fondo=S.set.fondo===false?'off':'on';$('#sAvisos').checked=!!S.set.avisos;$('#sAvisoHora').value=S.set.avisoHora||'09:00';
 $('#sAvisos').closest('.sw').hidden=!store.isDesktop;$('#sAvisoHora').closest('.grid2').hidden=!store.isDesktop;$('#sTags').checked=S.set.tags;$('#sRot').checked=S.set.rot;$('#sFotoDia').checked=S.set.fotoDia;$('#sLuzOn').value=S.set.luzOn||'06:00';$('#sPh').checked=S.set.ph;
 document.body.dataset.motion=S.set.mot?'on':'off';document.body.dataset.tags=S.set.tags?'on':'off';
 pressed('#sQ','q',S.set.q);pressed('#sDet','det',S.set.det);if(sceneOk)G.setQuality(S.set.q);
 $('#sPaisaje').checked=!!S.set.paisaje;if(sceneOk)G.setPaisaje(!!S.set.paisaje);
 applyTema();try{matchMedia('(prefers-color-scheme: dark)').addEventListener('change',applyTema);new MutationObserver(applyTema).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']})}catch(e){}
 setDay(S.day);renderPlay();
 const v0=Object.keys(HASH).find(k=>'#'+HASH[k]===location.hash)||'inicio';
 go(v0,true);
 requestAnimationFrame(uiLoop);
 startAutosave();
 if(!store.isDesktop){let hid=0;document.addEventListener('visibilitychange',async()=>{if(document.hidden){hid=Date.now();return}const c=await store.cfgGet();if(c.hasPin&&hid&&Date.now()-hid>60000){saveNow(true);await store.lockNow();location.reload()}})}
 setInterval(()=>{if(S.playing)return;refreshAges();recordHist();stagePulse()},300000);
 addEventListener('focus',()=>{if(S.playing)return;refreshAges();recordHist();stagePulse()});
 /* animaciones globales: pulso al click y luz que sigue al mouse en tarjetas */
 (function(){
  document.addEventListener('pointerdown',e=>{if(document.body.dataset.motion==='off')return;const b=e.target.closest&&e.target.closest('.btn,.tab,.chip,.gh-card,.rc');if(!b)return;
   const r=b.getBoundingClientRect(),d=Math.max(r.width,r.height)*1.6,x=document.createElement('span');x.className='ripple';
   x.style.cssText='width:'+d+'px;height:'+d+'px;left:'+(e.clientX-r.left-d/2)+'px;top:'+(e.clientY-r.top-d/2)+'px';
   const cs=getComputedStyle(b);if(cs.position==='static')b.style.position='relative';if(cs.overflow==='visible')b.style.overflow='hidden';
   b.appendChild(x);setTimeout(()=>x.remove(),600)},{passive:true});
  let raf=0;document.addEventListener('pointermove',e=>{const c=e.target.closest&&e.target.closest('.gh-card');if(!c||raf)return;raf=requestAnimationFrame(()=>{raf=0;const r=c.getBoundingClientRect();c.style.setProperty('--mx',(e.clientX-r.left)+'px');c.style.setProperty('--my',(e.clientY-r.top)+'px')})},{passive:true});
 })();
 window.__G=G;window.__ready=true;
})();
})();
</script>
