
/* ---------- nueva planta ---------- */
const np={room:null,slot:null,seed:'ww',pot:11,fm:'rec',q:'',f:'todas',cyc:'18/6'},POTS=[1,3,5,7,11,15,20,30];let idc=100;
const stockOf=id=>S.stock.filter(x=>x.seed===id).reduce((a,x)=>a+(+x.qty||0),0);
const norm=t=>String(t).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
function seedMatch(s){const f=np.f,q=norm(np.q.trim());
 const okF=f==='todas'||(f==='foto'&&s.kind==='foto')||(f==='auto'&&s.kind==='auto')||(f==='indica'&&s.type.indexOf('Índica')===0)||(f==='hibrida'&&s.type.indexOf('Híbrida')===0)||(f==='sativa'&&s.type.indexOf('Sativa')===0);
 if(!okF)return false;if(!q)return true;
 const hay=norm(s.name+' '+s.type+' '+(s.kind==='auto'?'auto autofloreciente':'fotoperiodo'));return q.split(/\s+/).every(w=>hay.indexOf(w)>-1)}
function renderSeeds(){
 const L=SEEDS.filter(seedMatch);
 $('#npSeeds').innerHTML=L.length?L.map(s=>'<button type="button" class="seedbtn" role="radio" aria-checked="'+(np.seed===s.id)+'" data-seed="'+s.id+'"><b>'+esc(s.name)+'</b><span>'+esc(s.type)+'</span></button>').join(''):'<p class="empty">No hay genéticas con ese filtro. Probá otra búsqueda o cargá la tuya con el botón de abajo.</p>';
 $('#npCount').textContent=L.length+' de '+SEEDS.length+' genéticas'+(SEEDS.find(x=>x.id===np.seed)&&!L.some(x=>x.id===np.seed)?' · Elegida: '+SEEDS.find(x=>x.id===np.seed).name:'');
 $$('#npF button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.f===np.f)));
 const on=$('#npSeeds [aria-checked="true"]');if(on&&on.scrollIntoView){const box=$('#npSeeds');if(on.offsetTop<box.scrollTop||on.offsetTop+on.offsetHeight>box.scrollTop+box.clientHeight)box.scrollTop=Math.max(0,on.offsetTop-box.offsetTop-8)}
}
function renderNueva(){
 renderSeeds();subOpts();renderNpRoom();
 $('#npPots').innerHTML=POTS.map(l=>'<button type="button" aria-pressed="'+(np.pot===l)+'" data-pot="'+l+'">'+l+' L</button>').join('');
 if(!$('#npDate').value){const d=new Date();$('#npDate').value=d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());$('#npTime').value=pad(d.getHours())+':'+pad(d.getMinutes())}
 $$('#npFm button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.fm===np.fm)));
 $$('#npCyc button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.cyc===np.cyc)));
 $('#npFertName').hidden=np.fm!=='ya';
 renderNpPreview();renderNpFert();renderWeb('semilla');renderWeb('fert');renderWeb('sub');
}
function renderNpRoom(){const sel=$('#npRoom'),keep=np.room||sel.value||S.room;
 sel.innerHTML=S.rooms.map((r,i)=>{const f=SLOTS.length-roomPlants(r.id).length;return'<option value="'+r.id+'"'+(f<=0?' disabled':'')+'>Invernadero '+esc(roomLabel(r.id))+' · '+(f>0?f+(f===1?' lugar libre':' lugares libres'):'lleno')+'</option>'}).join('');
 sel.value=S.rooms.some(r=>r.id===keep&&SLOTS.length-roomPlants(r.id).length>0)?keep:(S.rooms.find(r=>roomPlants(r.id).length<SLOTS.length)||S.rooms[0]).id}
$('#npRoom').addEventListener('change',()=>{np.room=$('#npRoom').value;np.slot=null});
function renderNpPreview(){
 const s=SEEDS.find(x=>x.id===np.seed),small=np.pot<s.pot,sc=(.5+.5*Math.sqrt(np.pot/30)).toFixed(3);
 const adv=small?'<div class="advice warn"><b>Maceta chica para esta genética</b><span>'+(s.kind==='auto'?'Las autoflorecientes no toleran bien los trasplantes: sembrala directamente en ':'Con '+np.pot+' L se queda corta. Lo ideal es ')+s.pot+' L o más.'+(s.kind==='auto'?'':' También podés empezar en una más chica y trasplantar al mes.')+'</span></div>':'<div class="advice"><b>Buen tamaño de maceta</b><span>'+np.pot+' L le alcanza a '+esc(s.name)+' para crecer sin apretarse.</span></div>';
 $('#npPreview').innerHTML='<div class="hd"><h2>'+esc(s.name)+'</h2><span class="chip plain">'+esc(s.type)+'</span></div>'+
 '<div class="potviz"><svg viewBox="0 0 140 150" aria-hidden="true"><g class="g" style="transform:scale('+sc+')"><path d="M70 112V62" stroke="var(--leaf)" stroke-width="4" stroke-linecap="round" fill="none"/><g fill="var(--leaf)"><ellipse cx="70" cy="46" rx="6" ry="20"/><ellipse cx="70" cy="50" rx="5" ry="17" transform="rotate(-48 70 62)"/><ellipse cx="70" cy="50" rx="5" ry="17" transform="rotate(48 70 62)"/><ellipse cx="70" cy="54" rx="4" ry="13" transform="rotate(-82 70 70)"/><ellipse cx="70" cy="54" rx="4" ry="13" transform="rotate(82 70 70)"/></g><path d="M36 112h68l-9 30H45z" fill="currentColor" style="color:var(--ink2)"/></g></svg></div>'+adv+
 '<div class="facts"><div><span>Tipo</span><span>'+(s.kind==='auto'?'Autofloreciente':'Fotoperíodo')+'</span></div><div><span>Floración</span><span>'+esc(s.flow)+'</span></div><div><span>Altura final</span><span>'+esc(s.hcm)+'</span></div><div><span>Riego</span><span>'+esc(s.riego)+'</span></div><div><span>Dificultad</span><span>'+['','Muy fácil','Fácil','Media','Exigente','Para expertos'][s.diff]+'</span></div></div>'+
 (stockOf(s.id)?'<p class="hint"><b>Tenés '+stockOf(s.id)+(stockOf(s.id)===1?' semilla':' semillas')+' de esta genética.</b> Se descuenta al plantar.</p>':'')+'<p class="hint">'+esc(s.note)+' Los datos son orientativos: si el banco de tu semilla dice otra cosa, mandan sus indicaciones.</p>';
}
function renderNpFert(){
 const el=$('#npFert');
 if(np.fm==='ya'){const f=FERTS.find(x=>norm(x.name)===norm($('#npFertName').value||''));el.innerHTML='<h2>Tu fertilizante</h2>'+(f?'<div class="find ok"><span class="n" aria-hidden="true">+</span><div><b>'+esc(f.name)+'</b><p class="hint">'+esc(f.note)+' '+esc(f.dose)+'</p></div></div>':'<p class="muted">Anotalo y el asistente ajusta las dosis según la etapa de cada planta. Si es uno que no está en la app, buscalo en internet con el botón de abajo del nombre. Si no estás seguro de la dosis, empezá con la mitad de la que indica la etiqueta.</p>');return}
 const list=FERTS.filter(f=>['f1','f2','f5'].includes(f.id));
 el.innerHTML='<h2>Fertilizantes para las primeras semanas</h2>'+list.map(f=>'<div class="find ok"><span class="n" aria-hidden="true">+</span><div><b>'+esc(f.name)+'</b><p class="hint">'+esc(f.note)+' '+esc(f.dose)+'</p></div></div>').join('')+'<p class="hint">En plántula alcanza con agua y, como mucho, un enraizante suave.</p>';
}
$('#npSeeds').addEventListener('click',e=>{const b=e.target.closest('[data-seed]');if(!b)return;np.seed=b.dataset.seed;
 $$('#npSeeds .seedbtn').forEach(x=>x.setAttribute('aria-checked',String(x===b)));renderNpPreview();renderNpFert()});
$('#npQ').addEventListener('input',e=>{np.q=e.target.value;renderSeeds()});
$('#npQ').addEventListener('keydown',e=>{if(e.key==='Enter')e.preventDefault()});
$('#npF').addEventListener('click',e=>{const b=e.target.closest('[data-f]');if(!b)return;np.f=b.dataset.f;renderSeeds()});
$('#npCustomBtn').addEventListener('click',()=>{const o=$('#npCustom').hidden;$('#npCustom').hidden=!o;$('#npCustomBtn').setAttribute('aria-expanded',String(o));if(o)$('#cName').focus()});
$('#cAdd').addEventListener('click',()=>{
 const name=$('#cName').value.trim(),kind=$('#cKind').value,cm=+$('#cCm').value,fw=+$('#cFw').value;
 if(!name){toast('Ponele un nombre a la genética');$('#cName').focus();return}
 if(!(cm>=20&&cm<=400)){toast('La altura tiene que estar entre 20 y 400 cm');$('#cCm').focus();return}
 if(!(fw>=4&&fw<=16)){toast('Las semanas de floración van de 4 a 16');$('#cFw').focus();return}
 const auto=kind==='auto',st=auto?.35:.55,tot=cm/45,id='c'+Date.now().toString(36);
 SEEDS.push({id:id,custom:true,name:name,type:auto?'Híbrida autofloreciente':'Híbrida',kind:kind,fw:Math.round(fw),
  flow:auto?'Florece sola; ciclo total de '+(3+Math.round(fw))+' a '+(5+Math.round(fw))+' semanas':Math.max(1,Math.round(fw)-1)+' a '+(Math.round(fw)+1)+' semanas',
  H:Math.max(.2,+(tot/(1+st)-.12).toFixed(2)),stretch:st,hcm:Math.round(cm*.85)+' a '+Math.round(cm*1.15)+' cm',
  riego:'Regá cuando los primeros 3 cm de sustrato estén secos. Es una genética cargada a mano: si el banco indica otra cosa, mandan sus indicaciones.',
  pot:auto?(cm<70?7:11):(cm>=230?20:cm>=130?15:11),diff:3,sc:cm<90?.85:cm>180?1.08:1,note:'Genética cargada por vos.'});
 np.seed=id;np.q='';np.f='todas';$('#npQ').value='';$('#cName').value='';
 $('#npCustom').hidden=true;$('#npCustomBtn').setAttribute('aria-expanded','false');
 renderNueva();toast(name+' quedó en la lista')});
$('#npPots').addEventListener('click',e=>{const b=e.target.closest('[data-pot]');if(!b)return;np.pot=+b.dataset.pot;renderNueva()});
$('#npCyc').addEventListener('click',e=>{const b=e.target.closest('[data-cyc]');if(!b)return;np.cyc=b.dataset.cyc;renderNueva()});
$('#npFm').addEventListener('click',e=>{const b=e.target.closest('[data-fm]');if(!b)return;np.fm=b.dataset.fm;renderNueva()});
$('#np').addEventListener('reset',()=>setTimeout(()=>{np.room=null;np.slot=null;Object.keys(WEB).forEach(k=>{WEB[k]={st:'idle'}});$('#npSubName').hidden=true;np.q='';np.f='todas';np.fm='rec';np.cyc='18/6';$('#npCustom').hidden=true;$('#npCustomBtn').setAttribute('aria-expanded','false');renderNueva()},0));
$('#np').addEventListener('submit',e=>{e.preventDefault();
 const rid=$('#npRoom').value||S.room;if(freeSlot(rid)<0){toast('Ese invernadero está lleno ('+SLOTS.length+' macetas). Elegí otro o sumá uno con el botón +.');return}
 const d=$('#npDate').value,t=$('#npTime').value||'12:00',s=SEEDS.find(x=>x.id===np.seed);if(!s){toast('Elegí una semilla');return}
 let sown=Date.now();
 if(d){const ms=new Date(d+'T'+t).getTime();if(isFinite(ms)){if(ms>Date.now())toast('La fecha es futura: la cargo como si fuera hoy');else sown=ms}}
 const age=(Date.now()-sown)/DAY;
 const note=$('#npNotes').value.trim(),name=$('#npName').value.trim()||('Planta '+(S.plants.length+1));
 const sub=$('#npSub').value==='__otro'?($('#npSubName').value.trim()||'Sustrato sin nombre'):$('#npSub').value,rate=baseRate(np.pot,age,sub);
 const p={id:'p'+Date.now().toString(36)+Math.floor(Math.random()*1e3),name:name,seed:np.seed,sownAt:sown,age:age,pot:np.pot,h0:.8,t0:sown,rate:rate,rAge:age,flowerAt:null,grow:S.grow,hour:t,sub:sub,loc:$('#npLoc').value,room:rid,slot:freeSlot(rid,np.room===rid?np.slot:null),
  fert:np.fm==='ya'?($('#npFertName').value.trim()||'Sin nombre'):'Recomendado por el asistente',notes:[],photos:[],meas:[]};
 p.notes.push({t:sown,k:'siembra',x:'Sembrada: '+s.name+' en maceta de '+np.pot+' L'});
 const wd=+$('#npWater').value;
 if(wd>=0){const wt=Math.max(sown,Date.now()-wd*DAY);p.t0=wt;if(wt>sown+36e5)p.notes.push({t:wt,k:'riego',x:'Último riego (cargado al crear la planta)'})}
 if(note)p.notes.unshift({t:Date.now(),k:'nota',x:note});
 if(np.cyc==='12/12'&&s.kind==='foto')p.flowerAt=Math.max(24,age);
 const stk=S.stock.find(x=>x.seed===np.seed&&x.qty>0);let stkMsg='';if(stk){stk.qty--;stkMsg=' Te quedan '+stk.qty+(stk.qty===1?' semilla':' semillas')+' de '+s.name+'.'}
 S.off=0;S.playing=false;renderPlay();S.plants.push(p);recordHist();G.sync();go('stage');stagePulse();selectPlant(p.id);
 toast(name+' ya está en el invernadero.'+stkMsg);$('#np').reset()});

/* ---------- foto ---------- */
function setShot(url){S.shot=url;S.result=null;S.analyzed=false;const img=$('#shotImg');img.src=url;img.hidden=false;$('#shotEmpty').hidden=true;$('#analyze').disabled=!S.plants.length;$('#marks').innerHTML='';renderResult()}
function renderFoto(){
 const has=S.plants.length>0;
 $('#fPlant').innerHTML=has?S.plants.map(p=>'<option value="'+p.id+'"'+(p.id===S.sel?' selected':'')+'>'+esc(p.name)+' ('+esc(seedOf(p).name)+')</option>').join(''):'<option value="">Todavía no hay plantas</option>';
 $('#fPlant').disabled=!has;$('#analyze').disabled=!has||!S.shot;
 renderResult();renderStrip();updateConf();
 store.hasKey().then(k=>{$('#keyHint').textContent=k?'La IA va a mirar tu foto de verdad'+(S.guide?' y a seguir tu guía.':'.'):'Sin sesión, el análisis usa tus datos y reglas simples, pero no mira la imagen. Entrá con tu cuenta (Ajustes) para usar la IA.'})
}
$('#fPlant').addEventListener('change',e=>{S.sel=e.target.value;S.reOf=null;S.analyzed=false;S.result=null;$('#marks').innerHTML='';renderResult();renderStrip();labelTags()});
function shrinkImage(file,max){return new Promise((res,rej)=>{const url=URL.createObjectURL(file),im=new Image();
 im.onload=()=>{const k=Math.min(1,max/Math.max(im.naturalWidth,im.naturalHeight)),w=Math.max(1,Math.round(im.naturalWidth*k)),h=Math.max(1,Math.round(im.naturalHeight*k)),c=document.createElement('canvas');c.width=w;c.height=h;
  const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,w,h);x.drawImage(im,0,0,w,h);URL.revokeObjectURL(url);res(c.toDataURL('image/jpeg',.86))};
 im.onerror=()=>{URL.revokeObjectURL(url);rej(new Error('img'))};im.src=url})}
$('#file').addEventListener('change',async e=>{const f=e.target.files&&e.target.files[0];e.target.value='';if(!f)return;if(!/^image\//.test(f.type)){toast('Ese archivo no es una imagen');return}
 try{setShot(await shrinkImage(f,1600));S.reOf=null}catch(err){toast('No pude abrir esa imagen. Probá con un JPG o PNG')}});
function plantContext(p){const v=id=>$(id).value,h=at0(()=>hum(p)),lw=p.notes.find(n=>n.k==='riego');
 return{planta:p.name,genetica:seedOf(p).name,tipo:seedOf(p).kind==='auto'?'autofloreciente':'fotoperiodo',etapa:stageOf(p,p.age),dias_desde_siembra:Math.floor(p.age),maceta_litros:p.pot,sustrato:p.sub,lugar:p.loc,ciclo_de_luz:(p.flowerAt!=null?'12/12':'18/6'),
  humedad_estimada_sustrato_pct:Math.round(h*100),ultimo_riego:lw?agoText(lw.t):'sin registro',fertilizante:p.fert,peso_maceta:v('#dPeso')||null,ph_agua:num(v('#dPh'))||null,temperatura_c:num(v('#dTemp'))||null,humedad_ambiente_pct:num(v('#dHum'))||null}}
$('#analyze').addEventListener('click',async()=>{const p=plantOf(S.sel);if(!p||!S.shot)return;
 const sc=$('#scan');sc.classList.remove('go');void sc.offsetWidth;sc.classList.add('go');$('#analyze').disabled=true;
 const withIA=await store.hasKey();
 $('#result').innerHTML='<h2>Analizando la foto</h2><div class="meter"><i style="width:70%"></i></div><p class="hint">'+(withIA?'La IA está mirando tu foto. Puede tardar unos segundos.':'Armando el diagnóstico con tus datos.')+'</p>';
 let res=null,err='';
 if(withIA){try{const r=await store.analyze({image:S.shot,context:plantContext(p)});if(r&&r.ok)res=r.data;else err=(r&&r.msg)||'No pude usar la IA'}catch(e){err='No pude usar la IA'}}
 if(err)toast(err+'. Muestro el análisis básico.');
 S.result=res?Object.assign({src:'ia'},res):rulesResult(p);
 S.analyzed=true;sc.classList.remove('go');showMarks();renderResult();$('#analyze').disabled=false});
function showMarks(){const r=S.result;if(!r)return;
 const pts=r.tone==='warn'?[[30,68],[66,34]]:r.tone==='water'?[[42,60]]:[];
 $('#marks').innerHTML=r.src==='ia'?'':pts.map((q,i)=>'<div class="mk" style="left:'+q[0]+'%;top:'+q[1]+'%;animation-delay:'+(i*.25)+'s">'+(i+1)+'</div>').join('')}
function findings(p){const h=hum(p),stg=stageOf(p),f=[],v=id=>$(id).value;
 if(h>.88){f.push(['Sustrato muy húmedo','Según tus registros el sustrato debería estar saturado. Si las hojas se ven caídas, puede ser exceso de riego.']);f.push(['Revisá hojas de abajo','Con exceso de agua las raíces absorben peor y el amarillo aparece desde abajo.'])}
 else if(h<=.2)f.push(['Sustrato seco según tus registros','Hace mucho que no la regás. Si las hojas están flácidas, suele recuperarse rápido después de regar.']);
 else if(h<=.3)f.push(['Sustrato en punto de riego','Según tus registros ya es momento de regar.']);
 else f.push(['Sin señales de estrés en los datos','Los registros de riego están en un rango normal. Para ver las hojas hace falta que lo mires vos o usar el análisis con IA.']);
 if((stg==='Plántula'||stg==='Germinación')&&h>.3&&h<=.88)f.push(['Etapa temprana','Con una plántula conviene regar poco y cerca del tallo, y evitar el fertilizante fuerte.']);
 if(v('#dPeso')==='Pesada'&&h>.88)f.push(['El peso confirma el exceso de agua','Maceta pesada y sustrato húmedo apuntan a poco oxígeno en la raíz.']);
 if(v('#dPeso')==='Liviana'&&h>.88)f.push(['La maceta liviana no encaja con exceso de agua','Revisá otras causas, como nutrientes o estado de las raíces.']);
 const ph=num(v('#dPh'));if(ph&&(ph<5.5||ph>7))f.push(['pH fuera de rango','Con ese pH la planta absorbe mal los nutrientes. Corregí el agua a 6,0 o 6,5.']);
 const tp=num(v('#dTemp'));if(tp&&tp>30)f.push(['Temperatura alta','Arriba de 30 °C la planta transpira de más y se estresa.']);
 const hm=num(v('#dHum'));if(hm&&hm>70)f.push(['Humedad ambiente alta','Aumenta el riesgo de hongos. Ventilá y bajá la humedad.']);
 return f}
function rulesResult(p){const st=at0(()=>statusOf(p)),adv=at0(()=>advise(p));return{src:'reglas',tone:st.tone,label:st.label,findings:at0(()=>findings(p)),advice:adv}}
function renderResult(){
 const el=$('#result'),p=plantOf(S.sel);
 if(!p){el.innerHTML='<h2>Resultado</h2><p class="muted">Primero cargá una planta en "Nueva planta".</p>';return}
 if(!S.shot){el.innerHTML='<h2>Resultado</h2><p class="muted">Elegí o sacá una foto para empezar.</p>';return}
 if(!S.analyzed||!S.result){el.innerHTML='<h2>Resultado</h2><p class="muted">La foto está lista. Apretá Analizar.</p>';return}
 const r=S.result,tone=r.tone==='ok'?'':r.tone;
 el.innerHTML='<div class="hd"><h2>'+esc(p.name)+'</h2><span class="chip '+tone+'">'+esc(r.label||'')+'</span></div>'+
 r.findings.map((x,i)=>'<div class="find'+(r.tone==='ok'?' ok':'')+'"><span class="n">'+(i+1)+'</span><div><b>'+esc(x[0])+'</b><p class="hint">'+esc(x[1])+'</p></div></div>').join('')+
 '<div class="advice '+r.advice.tone+'"><b>'+esc(r.advice.title)+'</b><span>'+esc(r.advice.text)+'</span></div>'+
 '<div class="row"><button class="btn primary" id="saveShot" type="button">Guardar en la bitácora</button></div>'+
 '<p class="hint">'+(r.src==='ia'?'Análisis de la IA sobre tu foto. Es una ayuda, no un diagnóstico seguro: si algo te preocupa, comparalo con lo que ves vos.':'Análisis básico: se arma con tus registros y los datos de la derecha. No mira la imagen.')+'</p>';
}
$('#result').addEventListener('click',async e=>{if(!e.target.closest('#saveShot'))return;const p=plantOf(S.sel);if(!p||!S.shot||!S.result)return;
 const btn=e.target.closest('#saveShot');btn.disabled=true;
 if(S.reOf&&p.photos.includes(S.reOf)){const x=S.reOf,r=S.result;x.tone=r.tone;x.label=r.label||'';x.ia=r.src==='ia';btn.disabled=false;logEv(p,'foto','Foto del '+fmtD(x.t)+' analizada de nuevo: '+(r.label||'').toLowerCase());S.reOf=null;recordHist();renderStrip();stagePulse();toast('Actualicé el diagnóstico de esa foto');return}
 let f=null;try{f=await store.savePhoto(p.id,S.shot)}catch(err){}
 if(!f){toast('No pude guardar la foto');btn.disabled=false;return}
 const r=S.result;p.photos.unshift({t:Date.now(),f:f,tone:r.tone,label:r.label||'',ia:r.src==='ia'});
 logEv(p,'foto','Foto de seguimiento: '+(r.label||'').toLowerCase()+(r.src==='ia'&&r.advice?'. '+r.advice.title:''));
 recordHist();renderStrip();stagePulse();toast('Foto guardada en la bitácora de '+p.name)});
function renderStrip(){const p=plantOf(S.sel),a=p?p.photos:[];$('#strip').innerHTML=a.length?a.map((x,i)=>'<div class="thumb" data-ph="'+i+'" role="button" tabindex="0" aria-label="Ver foto del '+esc(fmtD(x.t))+'"><img src="'+esc(photoSrc(x))+'" alt="Foto guardada el '+esc(fmtD(x.t))+'"><span>'+esc(fmtD(x.t))+'</span></div>').join(''):'<p class="hint">Las fotos que guardes se ven acá. Tocá una para ver la línea de tiempo, compararlas o reproducirlas.</p>'}
$('#strip').addEventListener('click',e=>{const t=e.target.closest('[data-ph]');if(!t)return;const p=plantOf(S.sel);if(!p)return;const x=p.photos[+t.dataset.ph];if(x)openViewer(p.id,x)});
$('#strip').addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.dataset.ph!=null){e.preventDefault();e.target.click()}});
function updateConf(){let n=0;['#dPeso','#dPh','#dTemp','#dHum'].forEach(id=>{if($(id).value)n++});
 $('#confBar').style.width=(n*25)+'%';$('#confTxt').textContent=n?n+' de 4 datos cargados. Cuantos más, mejor el diagnóstico.':'Todavía no cargaste ningún dato.'}
['#dPeso','#dPh','#dTemp','#dHum'].forEach(id=>$(id).addEventListener('input',()=>{updateConf();if(S.analyzed&&S.result&&S.result.src==='reglas'){const p=plantOf(S.sel);if(p){S.result=rulesResult(p);renderResult()}}}));
renderers.nueva=renderNueva;renderers.foto=renderFoto;

/* ---------- búsqueda en internet: genética, fertilizante, sustrato ---------- */
const WEBK={
 semilla:{host:'#npWeb',kind:'semilla',q:()=>np.q.trim(),label:'genética',g:'semilla cannabis genética',exists:q=>SEEDS.some(s=>norm(s.name)===norm(q))},
 fert:{host:'#npFertWeb',kind:'fertilizante',q:()=>$('#npFertName').value.trim(),label:'fertilizante',g:'fertilizante para cultivo',exists:q=>FERTS.some(f=>norm(f.name)===norm(q))},
 sub:{host:'#npSubWeb',kind:'sustrato',q:()=>$('#npSubName').value.trim(),label:'sustrato',g:'sustrato para macetas',exists:q=>(S.subs||[]).some(x=>norm(x.name)===norm(q))}
};
const WEB={semilla:{st:'idle'},fert:{st:'idle'},sub:{st:'idle'}};
const gUrl=(k,q)=>'https://www.google.com/search?q='+encodeURIComponent(q+' '+WEBK[k].g);
function webFacts(k,d){const r=(a,b)=>b?'<div><span>'+a+'</span><span>'+esc(b)+'</span></div>':'';
 if(k==='semilla')return r('Nombre',d.nombre)+r('Banco',d.banco)+r('Tipo',d.tipo+(d.auto?' · autofloreciente':' · fotoperíodo'))+r('Linaje',d.linaje)+r('Floración',d.semanas+' semanas')+r('Altura',d.min+' a '+d.max+' cm')+r('Maceta ideal',d.maceta+' L')+r('Dificultad',d.dif)+r('Riego',d.riego);
 if(k==='fert')return r('Nombre',d.nombre)+r('Marca',d.marca)+r('Tipo',d.tipo)+r('Etapa',d.etapa)+r('NPK',d.npk)+r('Dosis',d.dosis);
 return r('Nombre',d.nombre)+r('Tipo',d.tipo)+r('Retiene agua',d.retencion)+r('Drenaje',d.drenaje)+r('pH ideal',fmtN(d.ph[0])+' a '+fmtN(d.ph[1]))+r('Riego',d.riego)}
function renderWeb(k){const W=WEBK[k],w=WEB[k],el=$(W.host),q=W.q();if(!el)return;
 if(k==='fert'&&np.fm!=='ya'){el.innerHTML='';return}
 if(w.st!=='idle'&&w.q!==q&&w.st!=='load'){w.st='idle'}
 if(w.st==='load'){el.innerHTML='<div class="wf"><p><span class="spin" aria-hidden="true"></span>Buscando «'+esc(w.q)+'» en internet. Puede tardar hasta un minuto.</p></div>';return}
 if(w.st==='res'){const d=w.data;el.innerHTML='<div class="wf"><h3>Encontré esto sobre «'+esc(w.q)+'»</h3><div class="facts">'+webFacts(k,d)+'</div>'+(d.nota?'<p class="hint">'+esc(d.nota)+'</p>':'')+
  (w.fuentes&&w.fuentes.length?'<div class="wsrc"><span>Fuentes:</span>'+w.fuentes.map(f=>'<button type="button" data-url="'+esc(f.url)+'">'+esc(f.titulo)+'</button>').join('')+'</div>':'')+
  '<p class="hint">Son datos sacados de internet por la IA: revisalos, y si tu producto trae otra indicación, mandan las de la etiqueta.</p><div class="row"><button type="button" class="btn primary" data-webadd="'+k+'">Agregar y usar</button><button type="button" class="btn" data-webno="'+k+'">Descartar</button></div></div>';return}
 if(w.st==='err'){el.innerHTML='<div class="wf"><p>'+esc(w.msg)+'</p><div class="row">'+(w.sinClave?'<button type="button" class="btn" data-webkey="1">Cargar clave en Ajustes</button>':'<button type="button" class="btn" data-web="'+k+'">Reintentar</button>')+'<button type="button" class="btn" data-url="'+esc(gUrl(k,w.q))+'">Buscar en Google</button></div></div>';return}
 if(q.length>=2&&!W.exists(q))el.innerHTML='<div class="row"><button type="button" class="btn" data-web="'+k+'">'+(k==='semilla'&&!SEEDS.some(s=>seedMatch(s))?'No está en la lista. ':'')+'Buscar «'+esc(q)+'» en internet</button></div>';else el.innerHTML=''}
async function webRun(k){const W=WEBK[k],w=WEB[k],q=W.q();if(q.length<2){toast('Escribí el nombre primero');return}
 w.st='load';w.q=q;renderWeb(k);
 let r;try{r=await store.lookup(W.kind,q)}catch(e){r={ok:false,msg:'No pude buscar'}}
 if(w.q!==q||w.st!=='load')return;
 if(r&&r.ok){w.st='res';w.data=r.data;w.fuentes=r.fuentes||[]}else{w.st='err';w.msg=(r&&r.msg)||'No pude buscar';w.sinClave=!!(r&&r.sinClave)}
 renderWeb(k)}
function webAdd(k){const w=WEB[k],d=w.data;if(!d)return;
 const src=(w.fuentes||[]).map(f=>f.url).slice(0,3);
 if(k==='semilla'){
  const ex=SEEDS.find(s=>norm(s.name)===norm(d.nombre));
  if(ex){np.seed=ex.id}else{
   const auto=d.auto,st=auto?.35:({bajo:.3,medio:.5,alto:.75})[d.stretch]||.5,cm=(d.min+d.max)/2,id='c'+Date.now().toString(36),fw=Math.round(d.semanas);
   SEEDS.push({id:id,custom:true,web:true,name:d.nombre,type:({Indica:'Índica',Sativa:'Sativa','Híbrida':'Híbrida'})[d.tipo]+(auto?' autofloreciente':''),kind:auto?'auto':'foto',fw:fw,
    flow:auto?'Florece sola; ciclo total de '+(3+fw)+' a '+(5+fw)+' semanas':Math.max(1,fw-1)+' a '+(fw+1)+' semanas',
    H:Math.max(.2,+((cm/45)/(1+st)-.12).toFixed(2)),stretch:st,hcm:d.min+' a '+d.max+' cm',
    riego:d.riego||'Regá cuando los primeros 3 cm de sustrato estén secos.',pot:d.maceta,diff:({'Fácil':2,Media:3,'Difícil':4})[d.dif]||3,sc:cm<90?.85:cm>180?1.08:1,
    note:(d.nota?d.nota+' ':'')+'Datos buscados en internet: verificalos con el banco.',banco:d.banco||'',linaje:d.linaje||'',fuentes:src});
   np.seed=id}
  np.q='';np.f='todas';$('#npQ').value='';
 }else if(k==='fert'){
  let f=FERTS.find(x=>norm(x.name)===norm(d.nombre));
  if(!f){const nm=d.marca&&norm(d.nombre).indexOf(norm(d.marca))<0?d.nombre+' ('+d.marca+')':d.nombre;
   f={id:'fw'+Date.now().toString(36),name:nm,stage:d.etapa,kind:d.tipo,note:(d.nota?d.nota+' ':'')+(d.npk?'NPK '+d.npk+'. ':'')+'Datos buscados en internet.',dose:d.dosis||'Seguí la etiqueta, empezando con media dosis.',custom:true,web:true,fuentes:src};FERTS.push(f)}
  S.have.add(f.id);$('#npFertName').value=f.name;
 }else{
  let c=(S.subs||[]).find(x=>norm(x.name)===norm(d.nombre));
  if(!c){c={name:d.nombre,tipo:d.tipo,ret:d.retencion,drain:d.drenaje,ph:d.ph,note:d.nota,riego:d.riego,web:true,fuentes:src};S.subs.push(c)}
  subOpts();$('#npSub').value=c.name;$('#npSubName').value='';$('#npSubName').hidden=true;
 }
 w.st='idle';w.data=null;renderNueva();toast('Listo, quedó guardado en la app')}
function subOpts(){const sel=$('#npSub'),keep=sel.value;Array.from(sel.querySelectorAll('[data-cs]')).forEach(o=>o.remove());const otro=sel.querySelector('[value="__otro"]');
 (S.subs||[]).forEach(c=>{const o=document.createElement('option');o.value=c.name;o.textContent=c.name;o.dataset.cs='1';sel.insertBefore(o,otro)});if(keep&&Array.from(sel.options).some(o=>o.value===keep))sel.value=keep}
['#npWeb','#npFertWeb','#npSubWeb'].forEach(h=>$(h).addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b)return;
 if(b.dataset.web)webRun(b.dataset.web);
 else if(b.dataset.webadd)webAdd(b.dataset.webadd);
 else if(b.dataset.webno){WEB[b.dataset.webno].st='idle';renderWeb(b.dataset.webno)}
 else if(b.dataset.webkey)go('ajustes');
 else if(b.dataset.url)store.openUrl(b.dataset.url)}));
$('#npQ').addEventListener('input',()=>renderWeb('semilla'));
$('#npFertName').addEventListener('input',()=>{renderWeb('fert');renderNpFert()});
$('#npSubName').addEventListener('input',()=>renderWeb('sub'));
$('#npSub').addEventListener('change',()=>{const o=$('#npSub').value==='__otro';$('#npSubName').hidden=!o;if(o)$('#npSubName').focus();renderWeb('sub')});
