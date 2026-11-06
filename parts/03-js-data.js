<script>
(function(){
'use strict';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)), lerp=(a,b,t)=>a+(b-a)*t;
const sstep=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t)};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function rng(seed){let a=seed>>>0;return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function hash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
const DAY=864e5, CM=45;
const fmtDate=(d,o)=>new Date(Date.now()+d*DAY).toLocaleDateString('es-AR',o||{weekday:'short',day:'numeric',month:'short'});
const pad=n=>String(n).padStart(2,'0');
const num=v=>{const n=parseFloat(String(v==null?'':v).trim().replace(',','.'));return isFinite(n)?n:NaN};
/* ritmo de secado del sustrato (fracción por día): depende de la maceta, la edad y el sustrato */
function baseRate(pot,age,sub){const cs=(S.subs||[]).find(x=>x.name===sub),fast=(cs?/coco|hidro/i.test(cs.tipo):/coco|hidro/i.test(sub||''))?1.2:1,grow=.75+.5*Math.min(1,Math.max(0,age)/50);return clamp(.07*fast*grow*Math.pow(11/Math.max(1,pot),.35),.03,.2)}

/* ---------- datos ---------- */
const SEEDS=[
 {id:'nl',name:'Northern Lights',type:'Índica dominante',kind:'foto',fw:8,flow:'7 a 9 semanas',H:1.3,stretch:.45,hcm:'80 a 120 cm',riego:'Cuando los primeros 3 cm de sustrato estén secos. Perdona algún error.',pot:11,diff:2,sc:.9,note:'Compacta y robusta. Buena para empezar.'},
 {id:'ww',name:'White Widow',type:'Híbrida',kind:'foto',fw:9,flow:'8 a 9 semanas',H:1.6,stretch:.6,hcm:'90 a 140 cm',riego:'Riego moderado. No le gusta el sustrato encharcado.',pot:11,diff:2,sc:1,note:'Crece pareja y responde bien al entrenamiento de ramas.'},
 {id:'ah',name:'Amnesia Haze',type:'Sativa dominante',kind:'foto',fw:11,flow:'10 a 12 semanas',H:2,stretch:.9,hcm:'150 a 220 cm',riego:'Maceta grande y riegos espaciados: el exceso de agua es su problema más común.',pot:15,diff:4,sc:1.12,note:'Muy alta y con mucho estirón al florecer. Pide espacio y paciencia.'},
 {id:'gg',name:'Gorilla Glue',type:'Híbrida',kind:'foto',fw:9,flow:'8 a 9 semanas',H:1.7,stretch:.55,hcm:'100 a 150 cm',riego:'Riego regular. Es golosa con los nutrientes: arrancá con media dosis.',pot:11,diff:3,sc:1,note:'Cogollos muy resinosos y ramas que necesitan sostén.'},
 {id:'bd',name:'Blue Dream',type:'Sativa dominante',kind:'foto',fw:10,flow:'9 a 10 semanas',H:1.85,stretch:.75,hcm:'120 a 180 cm',riego:'Riego moderado y buena ventilación.',pot:15,diff:3,sc:1.05,note:'Equilibrada y vigorosa. Aguanta bien los cambios de clima.'},
 {id:'ca',name:'Critical Auto',type:'Híbrida autofloreciente',kind:'auto',fw:7,flow:'Florece sola; ciclo total de 9 a 11 semanas',H:1.1,stretch:.35,hcm:'60 a 100 cm',riego:'Riegos suaves y frecuentes. No tolera trasplantes: sembrala en la maceta final.',pot:11,diff:2,sc:.85,note:'No depende del ciclo de luz. Ideal para cosechar rápido.'},
 {id:'lh',name:'Lemon Haze',type:'Sativa dominante',kind:'foto',fw:10,flow:'9 a 11 semanas',H:1.9,stretch:.85,hcm:'140 a 200 cm',riego:'Maceta aireada y riegos espaciados.',pot:15,diff:4,sc:1.08,note:'Aroma cítrico intenso. Necesita altura de techo.'}
];
/* genéticas extra: [id, nombre, tipo, kind, semanas de floración, alto mín cm, alto máx cm, dificultad, riego, nota] */
(function(){
 const T={I:'Índica dominante',H:'Híbrida',S:'Sativa dominante',IA:'Índica autofloreciente',HA:'Híbrida autofloreciente',SA:'Sativa autofloreciente'};
 const ST={I:.45,H:.6,S:.85,IA:.35,HA:.35,SA:.4},SC={I:.9,H:1,S:1.08,IA:.8,HA:.85,SA:.9};
 const R={
  f:'Cuando los primeros 3 cm de sustrato estén secos. Perdona algún error.',
  m:'Riego moderado. No le gusta el sustrato encharcado.',
  s:'Maceta aireada y riegos espaciados: el exceso de agua es su problema más común.',
  h:'Riego regular. Es golosa con los nutrientes: arrancá con media dosis.',
  a:'Riegos suaves y frecuentes. No tolera trasplantes: sembrala en la maceta final.',
  d:'Aguanta períodos secos. Regá solo cuando el sustrato esté seco en profundidad.'};
 const X=[
  ['og','OG Kush','H',9,90,150,3,'m','Aroma a pino y limón con fondo terroso. Pide buena ventilación.'],
  ['gsc','Girl Scout Cookies','H',9,100,150,3,'h','Cogollos densos y dulces. Se beneficia de podas suaves.'],
  ['sd','Sour Diesel','S',10,150,220,4,'s','Aroma a combustible y cítricos. Se estira mucho al florecer.'],
  ['ak','AK-47','H',8,90,140,2,'f','Muy agradecida y estable. Buena opción para empezar.'],
  ['sk1','Skunk #1','H',8,90,130,1,'f','Clásica y resistente. Perdona errores y huele fuerte.'],
  ['ph','Purple Haze','S',10,120,190,3,'s','Algunos fenotipos viran a violeta con noches frescas.'],
  ['jh','Jack Herer','S',10,130,200,3,'s','Aroma a pino y especias. Crece alta y ramifica bien.'],
  ['gc','Green Crack','S',8,100,160,2,'m','Vigorosa y de floración corta para ser sativa.'],
  ['ssh','Super Silver Haze','S',10,150,220,4,'s','Gran estirón y cogollos largos. Necesita techo alto.'],
  ['gdp','Granddaddy Purple','I',8,80,120,2,'f','Compacta y fácil. Los tonos violetas aparecen con frío nocturno.'],
  ['pe','Pineapple Express','H',9,110,160,3,'m','Aroma frutal tropical. Crece pareja y responde bien al entrenamiento.'],
  ['ch','Cheese','H',8,90,140,2,'f','Olor muy intenso: ojo con la discreción. Resistente y fácil.'],
  ['cm','Critical Mass','I',8,90,130,2,'h','Ramas cargadas que piden sostén. Muy productiva.'],
  ['zk','Zkittlez','I',8,90,130,3,'m','Perfil frutal y dulce. Prefiere nutrientes suaves.'],
  ['wc','Wedding Cake','I',9,90,140,3,'h','Cogollos gruesos y resinosos. Cuidá la humedad en floración.'],
  ['ge','Gelato','H',9,100,150,3,'m','Dulce y cremosa. Colores llamativos en floración.'],
  ['dp','Durban Poison','S',9,150,230,3,'d','Sativa pura de origen africano. Tolera calor y sequedad.'],
  ['afk','Afghan Kush','I',8,70,110,1,'d','Muy robusta y baja. Aguanta casi todo.'],
  ['bb','Bruce Banner','H',9,120,170,3,'h','Muy vigorosa. Ramas pesadas que necesitan tutores.'],
  ['dsd','Do-Si-Dos','I',9,90,130,3,'m','Aroma dulce y floral. Sensible al exceso de nitrógeno.'],
  ['rz','Runtz','H',9,100,140,4,'m','Exigente con el ambiente: pide humedad y temperatura estables.'],
  ['mi','Mimosa','H',9,110,160,3,'m','Aroma cítrico. Crece equilibrada y ramifica bien.'],
  ['sc','Strawberry Cough','S',9,120,170,3,'s','Aroma a frutilla. Algo sensible a los excesos de riego.'],
  ['slh','Super Lemon Haze','S',10,150,210,3,'s','Cítrica y de gran estirón. Necesita espacio vertical.'],
  ['bl','Blueberry','I',9,90,140,2,'f','Dulce y tranquila. Se tiñe de azul con el frío.'],
  ['pp','Purple Punch','I',8,80,120,2,'f','Compacta y rápida para florecer. Aroma a uva.'],
  ['tw','Trainwreck','H',9,120,180,3,'s','Crece rápido y alta. Le gusta la luz fuerte.'],
  ['cd','Chemdawg','H',10,120,180,4,'m','Aroma químico muy fuerte. Genética exigente.'],
  ['cp','Cherry Pie','H',9,90,140,3,'m','Compacta y frutal. Buena para espacios chicos.'],
  ['ag','Acapulco Gold','S',11,180,250,4,'d','Sativa clásica de ciclo largo. Pide paciencia y mucho espacio.'],
  ['th','Thai','S',13,200,300,5,'d','Ciclo muy largo y planta enorme. Mejor al aire libre.'],
  ['km','Kali Mist','S',10,150,220,4,'s','Sativa competitiva de aroma cítrico. Necesita espacio.'],
  ['hk','Hindu Kush','I',8,80,120,1,'f','Rústica y baja. Ideal para quien recién empieza.'],
  ['mk','Master Kush','I',8,80,120,2,'f','Compacta, resinosa y estable.'],
  ['ls','Lemon Skunk','H',8,100,150,2,'f','Cítrica y potente de olor. Crece sin dar problemas.'],
  ['st','Sweet Tooth','I',8,80,120,2,'f','Dulce y fácil. Buena para armarios y carpas chicas.'],
  ['bk','Bubba Kush','I',8,80,120,2,'f','Baja y ancha, con cogollos densos.'],
  ['ss','Sunset Sherbet','I',9,90,130,3,'m','Aroma a sorbete y cítricos. Cogollos coloridos.'],
  ['tg','Tangie','S',9,130,190,3,'s','Aroma a mandarina. Crece alta y ramificada.'],
  ['ac','ACDC (rica en CBD)','H',9,100,150,3,'m','Variedad rica en CBD y muy bajo THC. Crece pareja.'],
  ['hq','Harlequin (rica en CBD)','S',9,120,180,3,'m','Relación CBD:THC alta. Crece vigorosa.'],
  ['ct','Cannatonic (rica en CBD)','H',9,100,150,3,'m','Variedad con mucho CBD y poco THC. Fácil de manejar.'],
  /* autofloreciente */
  ['nla','Northern Lights Auto','IA',7,60,100,1,'a','Compacta y fácil. Muy buena primera autofloreciente.'],
  ['wwa','White Widow Auto','HA',7,70,110,2,'a','Rápida y resinosa. Perdona errores.'],
  ['gga','Gorilla Glue Auto','HA',8,80,120,3,'a','Cogollos resinosos. Pide nutrientes suaves.'],
  ['bda','Blue Dream Auto','HA',9,90,130,3,'a','Equilibrada y vigorosa. Crece algo más alta que otras autos.'],
  ['aha','Amnesia Haze Auto','SA',9,90,140,3,'a','Perfil sativa con ciclo corto. Necesita buena luz.'],
  ['lha','Lemon Haze Auto','SA',9,90,130,3,'a','Aroma cítrico en versión rápida.'],
  ['oga','OG Kush Auto','HA',8,70,110,3,'a','Aroma clásico a pino y limón en ciclo corto.'],
  ['gsa','Girl Scout Cookies Auto','HA',8,70,110,3,'a','Dulce y densa. Responde bien a la poda suave.'],
  ['sda','Sour Diesel Auto','SA',9,90,130,3,'a','Aroma a combustible. Crece más alta que el promedio.'],
  ['aka','AK-47 Auto','HA',7,70,110,1,'a','Rápida y muy resistente. Excelente para empezar.'],
  ['gea','Gelato Auto','HA',8,70,110,3,'a','Dulce y cremosa. Colores llamativos.'],
  ['zka','Zkittlez Auto','HA',8,70,100,3,'a','Perfil frutal. Compacta y vistosa.'],
  ['wca','Wedding Cake Auto','HA',8,70,110,3,'a','Cogollos gruesos. Cuidá la humedad al final.'],
  ['jha','Jack Herer Auto','SA',9,90,130,3,'a','Aroma a pino y especias en ciclo corto.'],
  ['gca','Green Crack Auto','SA',8,80,120,2,'a','Vigorosa y rápida. Crece derecha.'],
  ['cha','Cheese Auto','HA',7,70,110,2,'a','Olor intenso. Resistente y fácil.'],
  ['bba','Bruce Banner Auto','HA',8,80,120,3,'a','Vigorosa. Las ramas pueden necesitar sostén.'],
  ['ska','Skunk Auto','HA',7,60,100,1,'a','Clásica y resistente. Muy buena para principiantes.'],
  ['rd','Royal Dwarf (mini auto)','HA',6,35,60,1,'a','Diminuta: cabe en cualquier rincón. Ideal para macetas chicas y balcón.'],
  ['lr','Lowryder (mini auto)','HA',6,40,70,1,'a','Mini autofloreciente histórica. Casi no necesita cuidados.']
 ];
 const fixLoHi=(lo,hi)=>lo+' a '+hi+' cm';
 X.forEach(r=>{
  const [id,name,tc,fw,lo,hi,diff,rc,note]=r,auto=tc.length===2,mid=(lo+hi)/2,tot=mid/45,H=+(tot/(1+ST[tc])-.12).toFixed(2);
  SEEDS.push({id:id,name:name,type:T[tc],kind:auto?'auto':'foto',fw:fw,
   flow:auto?'Florece sola; ciclo total de '+(3+fw)+' a '+(5+fw)+' semanas':(fw-1)+' a '+(fw+1)+' semanas',
   H:H,stretch:ST[tc],hcm:fixLoHi(lo,hi),riego:R[rc],pot:auto?(hi<70?7:11):(mid>=230?20:mid>=130?15:11),diff:diff,sc:SC[tc],note:note});
 });
 SEEDS.sort((a,b)=>a.name.localeCompare(b.name,'es'));
})();
const SEED0=new Map(SEEDS.map(s=>[s.id,JSON.parse(JSON.stringify(s))]));
const FERTS=[
 {id:'f1',name:'Enraizante de algas y humatos',stage:'Plántula',kind:'Aditivo',note:'Ayuda a que la raíz arranque fuerte.',dose:'Un cuarto de la dosis de la etiqueta.'},
 {id:'f2',name:'Fertilizante de crecimiento (nitrógeno alto)',stage:'Vegetativo',kind:'Base',note:'Para las semanas de hojas y ramas.',dose:'Media dosis al principio; subí de a poco.'},
 {id:'f3',name:'Humus de lombriz',stage:'Vegetativo',kind:'Orgánico',note:'Mejora el sustrato y alimenta suave.',dose:'Una capa fina sobre la superficie cada pocas semanas.'},
 {id:'f4',name:'Fertilizante de floración (fósforo y potasio altos)',stage:'Floración',kind:'Base',note:'Para formar cogollos. Reemplaza al de crecimiento.',dose:'Media dosis al empezar a florecer.'},
 {id:'f5',name:'Calcio y magnesio',stage:'Todas',kind:'Aditivo',note:'Útil con agua blanda o sustrato de coco.',dose:'Siguiendo la etiqueta, con el agua ya corregida de pH.'},
 {id:'f6',name:'Aceite de neem',stage:'Vegetativo',kind:'Preventivo',note:'Prevención de plagas. No se usa en floración avanzada.',dose:'Diluido según la etiqueta, a la tarde y con la lámpara apagada.'}
];
function demoPlants(){const n=Date.now();
 const mk=(id,name,seed,age,pot,h0,rate,hour,sub,fert,notes)=>({id:id,name:name,seed:seed,sownAt:n-age*DAY,age:age,pot:pot,h0:h0,t0:n,rate:rate,flowerAt:null,hour:hour,sub:sub,loc:'Interior, carpa con luz LED',fert:fert,
  notes:notes.map(x=>({t:n-x[0]*DAY-(x[3]||0)*36e5,k:x[1],x:x[2]})),photos:[],meas:[]});
 return [
 mk('p1','Planta 1','nl',12,3,.62,.07,'21:10','Tierra universal con perlita','Enraizante de algas y humatos',[[1,'nota','Primer par de hojas verdaderas'],[3,'riego','Riego de 300 ml']]),
 mk('p2','Planta 2','ww',34,11,.27,.075,'20:45','Mezcla de coco y perlita','Fertilizante de crecimiento',[[3,'riego','Riego de 1 L con pH 6,3'],[7,'nota','Atado suave de ramas'],[6,'riego','Riego de 1 L']]),
 mk('p3','Planta 3','ah',41,11,.97,.06,'20:30','Tierra universal con perlita','Fertilizante de crecimiento',[[0,'riego','Riego de 1 L con pH 6,3'],[1,'nota','Puntas amarillas en hojas de abajo'],[4,'riego','Riego de 1 L']]),
 mk('p4','Planta 4','gg',9,3,.3,.08,'19:55','Tierra universal con perlita','Todavía sin fertilizante',[[3,'nota','Salió de la tierra, dos cotiledones abiertos'],[2,'riego','Riego de 200 ml']])
]}
/* estaciones de la nave: tres hileras a lo largo (izquierda 1 a 3, medio 4 a 6, derecha 7 a 9); la 1, la 6 y la 7 son las más cercanas a la puerta */
const SLOTS=[[-7,3],[-7,-3.5],[-7,-10],[0,-10],[0,-3.5],[0,3],[7,3],[7,-3.5],[7,-10]];

/* ---------- estado ---------- */
const S={inRoom:false,rooms:[{id:'r1'}],room:'r1',subs:[],off:0,day:true,simOn:false,sel:null,view:'inicio',playing:false,plants:[],archive:[],grows:[],grow:null,env:[],stock:[],seedEdits:{},have:new Set(),hist:{},
 set:{rot:false,mot:!matchMedia('(prefers-reduced-motion: reduce)').matches,tags:true,q:'alta',det:'normal',tema:'auto',ph:false,fotoDia:true,luzOn:'06:00',avisos:true,avisoHora:'09:00',avisoDia:'',fondo:true,paisaje:false},
 shot:null,reOf:null,result:null,conf:0,analyzed:false};
const seedOf=p=>SEEDS.find(s=>s.id===p.seed)||SEEDS.find(x=>x.id==='ww')||SEEDS[0];
const plantOf=id=>S.plants.find(p=>p.id===id);
/* invernaderos: cada uno tiene 9 estaciones */
const roomPlants=id=>S.plants.filter(p=>p.room===(id||S.room));
const roomNo=id=>Math.max(0,S.rooms.findIndex(r=>r.id===id))+1;
const roomLabel=id=>{const r=S.rooms.find(x=>x.id===id);return r&&r.name?r.name:String(roomNo(id))};
function freeSlot(rid,pref){const u=new Set(S.plants.filter(p=>p.room===rid).map(p=>p.slot));
 if(pref!=null&&pref>=0&&pref<SLOTS.length&&!u.has(pref))return pref;
 for(let i=0;i<SLOTS.length;i++)if(!u.has(i))return i;return -1}
function addRoom(){const n=S.rooms.reduce((m,r)=>Math.max(m,+String(r.id).slice(1)||0),0)+1;const r={id:'r'+n};S.rooms.push(r);return r}
function ensurePlacement(){
 const used={},ok=new Set();S.rooms.forEach(r=>{used[r.id]=new Set()});
 S.plants.forEach(p=>{if(p.room&&used[p.room]&&Number.isInteger(p.slot)&&p.slot>=0&&p.slot<SLOTS.length&&!used[p.room].has(p.slot)){used[p.room].add(p.slot);ok.add(p)}});
 S.plants.forEach(p=>{if(ok.has(p))return;
  const order=[p.room&&used[p.room]?p.room:S.room].concat(S.rooms.map(r=>r.id));let placed=false;
  for(const rid of order){if(!used[rid])continue;for(let i=0;i<SLOTS.length;i++)if(!used[rid].has(i)){p.room=rid;p.slot=i;used[rid].add(i);placed=true;break}if(placed)break}
  if(!placed){const r=addRoom();used[r.id]=new Set([0]);p.room=r.id;p.slot=0}})}
const ageNow=p=>p.age+S.off;
const allPlants=()=>S.plants.concat(S.archive);
const plantAny=id=>allPlants().find(p=>p.id===id);
const flowerStart=p=>seedOf(p).kind==='auto'?28:p.flowerAt;
function stageOf(p,a){a=a==null?ageNow(p):a;const s=seedOf(p),fs=flowerStart(p);
 if(fs!=null&&a>=fs){const w=(a-fs)/7;if(w>=s.fw)return'Lista para cosechar';if(w<2)return'Pre-floración';return'Floración'}
 if(a<=6)return'Germinación';if(a<=21)return'Plántula';return'Vegetativo'}
function colaSize(p){const fs=flowerStart(p);if(fs==null)return 0;const s=seedOf(p);return sstep(10,s.fw*7,ageNow(p)-fs)}
function gcurve(a){const k=x=>1/(1+Math.exp(-(x-24)/9));return clamp((k(a)-k(0))/(k(80)-k(0)),0,1)}
function heightU(p,a){a=a==null?ageNow(p):a;const s=seedOf(p),fs=flowerStart(p);
 if(fs!=null&&a>fs){return(0.12+s.H*gcurve(fs))*(1+s.stretch*sstep(0,24,a-fs))}
 return 0.12+s.H*gcurve(a)}
const heightCm=(p,a)=>Math.round(heightU(p,a)*CM);
const afac=a=>.75+.5*Math.min(1,Math.max(0,a)/50);
const rateOf=(p,off)=>p.rate*(p.rAge==null?1:afac(p.age+(off||0))/afac(p.rAge));
const humAt=(p,off)=>clamp(p.h0-rateOf(p,off)*Math.max(0,(Date.now()-p.t0)/DAY+off),.02,1);
const hum=p=>humAt(p,S.off);
const at0=fn=>{const o=S.off;S.off=0;try{return fn()}finally{S.off=o}};
const droopOf=p=>{const h=hum(p);return Math.max(sstep(.8,.97,h)*.55,sstep(.2,.05,h)*.75)};
function waterDays(p){const h=hum(p);return h<=.3?0:Math.ceil((h-.3)/rateOf(p,S.off))}
function statusOf(p){const h=hum(p);
 if(h>.88)return{tone:'warn',label:'Exceso de agua'};
 if(h<=.2)return{tone:'warn',label:'Con sed'};
 if(h<=.3)return{tone:'water',label:'Regar hoy'};
 return{tone:'ok',label:'Sana'}}
function advise(p){const h=hum(p),st=stageOf(p),s=seedOf(p),det=S.set.det;
 const ex=(a,b)=>det==='breve'?a:a+' '+b;
 if(h>.88)return{tone:'warn',title:'No la riegues todavía',text:ex('Las hojas caen y la maceta sigue pesada: lo más probable es exceso de agua.','Esperá a que los primeros 3 cm de sustrato se sequen y verificá que la maceta drene.')};
 if(h<=.2)return{tone:'warn',title:'Regá ya',text:ex('El sustrato está seco y las hojas empiezan a caer.','Dale agua despacio hasta que salga un poco por abajo y revisá el pH.')};
 if(h<=.3)return{tone:'water',title:'Hoy toca regar',text:ex('El sustrato llegó al punto de riego.','Usá agua a temperatura ambiente con pH entre 6,0 y 6,5 y repartila alrededor del tallo.')};
 if(st==='Germinación'||st==='Plántula')return{tone:'ok',title:'Todo en orden',text:ex('Riego en '+waterDays(p)+' días.','Con una plántula conviene regar poco y cerca del tallo, y evitar el fertilizante fuerte.')};
 if(p.pot<s.pot*.85&&st==='Vegetativo')return{tone:'ok',title:'Pensá en trasplantar',text:ex('La maceta de '+p.pot+' L queda chica para '+s.name+'.','Esta genética rinde mejor en '+s.pot+' L o más. Trasplantá a la tarde y regá suave.')};
 if(st==='Pre-floración'||st==='Floración')return{tone:'ok',title:'Cambiá a fertilizante de floración',text:ex('Riego en '+waterDays(p)+' días.','Bajá el nitrógeno y subí fósforo y potasio. Revisá humedad ambiente para evitar hongos.')};
 if(st==='Lista para cosechar')return{tone:'ok',title:'Mirá los tricomas',text:ex('Está cerca de la cosecha.','Con una lupa, cuando la mayoría pasan de transparentes a lechosos, es el momento.')};
 return{tone:'ok',title:'Todo en orden',text:ex('Riego en '+waterDays(p)+' días.','Seguí con foto diaria y 18 horas de luz. Es buen momento para entrenar las ramas.')}}

let toastT;
function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('on');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('on'),2800)}

/* ---------- plata: precios, costo del ciclo y rinde esperado ---------- */
const COST0={kwh:null,watts:250,equipo:null,equipoCiclos:4,hVeg:18,hFlo:12,coolers:null,coolW:6,coolH:24,coolPrecio:null,aguaM3:null,fertPrecio:null,fertMl:1000,fertDosis:2,sustPrecio:null,sustL:50,semilla:null,maceta:null,fijo:null};
S.cost=Object.assign({},COST0);
const money=n=>!isFinite(n)?'—':'$'+Math.round(n).toLocaleString('es-AR');
const gramosN=n=>!isFinite(n)?'—':fmtN(n)+' g';
/* gramos secos esperados por litro de maceta, según la genética */
function gLBase(s){const alto=clamp((s.H-.9)/1.1,0,1);return 3.6+1.8*alto}
/* vigor: compara la última medición real con la altura que debería tener */
function vigorOf(p){const m=p.meas&&p.meas.length?p.meas[p.meas.length-1]:null;if(!m)return 1;
 const edad=Math.max(1,(m.t-p.sownAt)/DAY),esp=heightU(p,edad)*CM;if(!(esp>0))return 1;
 return clamp(m.cm/esp,.6,1.4)}
/* promedio propio de gramos por litro, de las cosechas ya hechas */
function userGL(){const H=S.archive.filter(p=>p.harvest&&p.harvest.dry>0&&p.pot>0);
 if(!H.length)return null;const g=H.reduce((a,p)=>a+p.harvest.dry,0),l=H.reduce((a,p)=>a+p.pot,0);return l?g/l:null}
/* rinde esperado de una planta: genética + maceta + vigor + salud, calibrado con tus cosechas */
function yieldEst(p){
 if(p.harvest&&p.harvest.dry!=null)return{mid:p.harvest.dry,min:p.harvest.dry,max:p.harvest.dry,conf:'real',gl:p.pot?p.harvest.dry/p.pot:null,vig:1,sal:1,pot:1};
 const s=seedOf(p),a=ageNow(p),fs=flowerStart(p);
 const gl=gLBase(s),vig=vigorOf(p);
 const potF=p.pot<s.pot?.82+.18*(p.pot/s.pot):1;
 const st=at0(()=>statusOf(p)).tone,sal=st==='warn'?.9:st==='water'?.97:1;
 let mid=p.pot*gl*vig*potF*sal;
 const mine=userGL();if(mine)mid=mid*.6+(p.pot*mine*vig*potF*sal)*.4;
 const prog=fs==null?0:clamp((a-fs)/(s.fw*7),0,1);
 const sp=a<21?.45:fs==null||a<fs?.3:lerp(.28,.1,prog);
 return{mid:mid,min:mid*(1-sp),max:mid*(1+sp),gl:gl,vig:vig,sal:sal,pot:potF,
  conf:a<21?'baja':fs==null||a<fs?'media':prog>.5?'alta':'media'}}
function cycleYield(gid){const L=S.plants.filter(p=>p.grow===gid),H=S.archive.filter(p=>p.grow===gid);
 const real=H.reduce((a,p)=>a+(p.harvest&&p.harvest.dry||0),0);
 const esp=L.reduce((a,p)=>a+yieldEst(p).mid,0);
 return{real:real,esp:esp,total:real+esp,vivas:L.length,cosechadas:H.length}}
/* agua que toma una planta por día (ml): poquita de plántula, sube en vegetativo y llega al pico en plena floración */
function waterDayMl(p,a,fsEff){
 const s=seedOf(p),auto=s.kind==='auto',pot=Math.pow(Math.max(1,p.pot)/10,.6);let ml;
 if(a<=7)ml=20;
 else if(a<=21)ml=20+(a-7)/14*80;
 else if(fsEff==null||a<fsEff)ml=100+Math.min(1,(a-21)/21)*300;
 else{const w=(a-fsEff)/7,pk=s.fw*.55;ml=w<=pk?450+350*(w/pk):800-200*Math.min(1,(w-pk)/(s.fw*.45))}
 return ml*pot*(auto?.65:1)}
/* total de la vida de la planta hasta el día "d", sumando un 15 % que sale por abajo de la maceta */
function waterUseMl(p,d,proy){const fs=flowerStart(p),fsEff=fs==null?(proy?35:null):fs;let t=0;for(let a=0;a<d;a++)t+=waterDayMl(p,a+.5,fsEff);return t*1.15}
/* costo del ciclo: luz, agua, fertilizante, sustrato, semillas, macetas y gastos fijos */
function cycleCost(gid,proy){
 const c=S.cost,L=S.plants.filter(p=>p.grow===gid),H=S.archive.filter(p=>p.grow===gid),P=L.concat(H);
 const g=S.grows.find(x=>x.id===gid);
 if(!P.length)return{total:0,items:[],dias:0,plantas:0,litros:0,kwh:0};
 const ini=Math.min.apply(null,P.map(p=>p.sownAt).concat(g&&g.start?[g.start]:[]));
 const finReal=Math.max.apply(null,P.map(p=>p.harvest&&p.harvest.t?p.harvest.t:Date.now()));
 const finEsp=Math.max.apply(null,P.map(p=>{const fs=flowerStart(p),s=seedOf(p);
  return p.harvest&&p.harvest.t?p.harvest.t:p.sownAt+((fs==null?35:fs)+s.fw*7)*DAY}));
 const fin=proy?Math.max(finEsp,Date.now()):Date.now();
 const dias=Math.max(1,(fin-ini)/DAY);
 /* luz: horas de crecimiento hasta la primera floración, después horas de floración */
 const fsAbs=P.map(p=>{const fs=flowerStart(p);return fs==null?null:p.sownAt+fs*DAY}).filter(x=>x!=null);
 const corte=fsAbs.length?Math.min.apply(null,fsAbs):fin;
 const dVeg=clamp((Math.min(corte,fin)-ini)/DAY,0,dias),dFlo=Math.max(0,dias-dVeg);
 const kwh=(c.watts||0)/1000*((c.hVeg||0)*dVeg+(c.hFlo||0)*dFlo);
 /* coolers: ventiladores que andan todo el día (o las horas que cargues) durante todo el ciclo */
 const nC=Math.max(0,Math.round(c.coolers||0)),kwhC=nC*(c.coolW||0)/1000*(c.coolH==null?24:c.coolH)*dias;
 /* agua: lo que consume cada planta por día según su maceta y su etapa */
 let litros=0;P.forEach(p=>{
  const fin2=p.harvest&&p.harvest.t?p.harvest.t:(proy?p.sownAt+((flowerStart(p)==null?35:flowerStart(p))+seedOf(p).fw*7)*DAY:Date.now());
  const d=Math.max(1,(fin2-p.sownAt)/DAY);
  litros+=waterUseMl(p,d,proy)/1000});
 const eqCic=Math.max(1,Math.round(c.equipoCiclos||1)),eq=(c.equipo||0)/eqCic;
 const items=[
  ['Luz',(c.kwh||0)*kwh,Math.round(kwh)+' kWh · '+(c.watts||0)+' W'],
  ['Equipo (carpa, lámpara, etc.)',eq,c.equipo?money(c.equipo)+' repartido en '+eqCic+(eqCic===1?' ciclo':' ciclos'):'Sin equipo cargado'],
  ['Coolers (energía)',(c.kwh||0)*kwhC,nC?nC+' × '+(c.coolW||0)+' W · '+(c.coolH==null?24:c.coolH)+' h/día · '+Math.round(kwhC)+' kWh':'Sin coolers cargados'],
  ['Coolers (compra)',(c.coolPrecio||0)*nC,nC+' coolers'],
  ['Agua',(c.aguaM3||0)*litros/1000,Math.round(litros)+' L'],
  ['Fertilizante',(c.fertPrecio&&c.fertMl?c.fertPrecio/c.fertMl:0)*(c.fertDosis||0)*litros,fmtN((c.fertDosis||0)*litros)+' ml'],
  ['Sustrato',(c.sustPrecio&&c.sustL?c.sustPrecio/c.sustL:0)*P.reduce((a,p)=>a+p.pot,0),P.reduce((a,p)=>a+p.pot,0)+' L'],
  ['Semillas',(c.semilla||0)*P.filter(p=>!p.madre).length,P.filter(p=>!p.madre).length+' semillas'+(P.some(p=>p.madre)?' ('+P.filter(p=>p.madre).length+' esquejes, gratis)':'')],
  ['Macetas',(c.maceta||0)*P.length,P.length+' macetas'],
  ['Gastos fijos',(c.fijo||0)*dias/30,Math.round(dias)+' días']];
 return{total:items.reduce((a,x)=>a+(isFinite(x[1])?x[1]:0),0),items:items,dias:dias,plantas:P.length,litros:litros,kwh:kwh+kwhC,kwhLuz:kwh,kwhCool:kwhC}}

/* ---------- helpers de gráficos ---------- */
function sparkPath(vals,w,h,pad){pad=pad==null?2:pad;const n=vals.length;if(!n)return{line:'',area:'',marks:[]};
 const mn=Math.min.apply(null,vals),mx=Math.max.apply(null,vals),r=Math.max(1e-6,mx-mn);
 const px=i=>pad+i*(w-pad*2)/Math.max(1,n-1),py=v=>pad+(1-(v-mn)/r)*(h-pad*2);
 const pts=vals.map((v,i)=>[px(i),py(v)]);
 const line='M '+pts.map(p=>p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' L ');
 const area='M '+pts[0][0].toFixed(1)+' '+(h-pad)+' L '+pts.map(p=>p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' L ')+' L '+pts[pts.length-1][0].toFixed(1)+' '+(h-pad)+' Z';
 return{line:line,area:area,marks:pts,mn:mn,mx:mx}}
function sparkSvg(vals,ariaLabel){const w=320,h=52,p=sparkPath(vals,w,h);if(!p.line)return'<p class="hint">Sin datos todavía.</p>';
 const last=p.marks[p.marks.length-1];
 return'<svg class="spark" viewBox="0 0 '+w+' '+h+'" preserveAspectRatio="none" aria-label="'+esc(ariaLabel||'')+'"><path class="ar" d="'+p.area+'"/><path class="ln" d="'+p.line+'"/><circle class="mk" cx="'+last[0].toFixed(1)+'" cy="'+last[1].toFixed(1)+'" r="3"/></svg>'}
function gaugeSvg(frac,tone,val,lbl){const w=160,h=120,cx=w/2,cy=h-14,r=52;
 const full=Math.PI*r,off=full*(1-clamp(frac,0,1));
 return'<div class="gauge-wrap"><svg class="gauge '+(tone||'')+'" viewBox="0 0 '+w+' '+h+'" aria-label="'+esc(lbl||'')+' '+val+'"><path class="tr" d="M '+(cx-r)+' '+cy+' A '+r+' '+r+' 0 0 1 '+(cx+r)+' '+cy+'" stroke-dasharray="'+full.toFixed(1)+'" stroke-dashoffset="0"/><path class="fg" d="M '+(cx-r)+' '+cy+' A '+r+' '+r+' 0 0 1 '+(cx+r)+' '+cy+'" stroke-dasharray="'+full.toFixed(1)+'" stroke-dashoffset="'+off.toFixed(1)+'"/><text class="val" x="0" y="0"></text></svg>'+
  '<span class="val">'+val+'</span><span class="lbl">'+esc(lbl)+'</span></div>'}
function rangeChip(name,val,unit,min,max,ok0,ok1){const r=Math.max(1e-6,max-min),pct=v=>clamp((v-min)/r*100,0,100);const noData=!(typeof val==="number"&&isFinite(val));
 const tone=noData?'':(val<ok0||val>ok1?(val<ok0*0.6||val>ok1*1.4?'alert':'warn'):'');
 const okL=pct(ok0),okR=pct(ok1),pt=noData?-100:pct(val);
 return'<div class="rngx '+tone+(noData?' nd':'')+'"><div class="hd"><span class="lbl">'+esc(name)+'</span><b>'+(noData?'—':esc(val)+'<small> '+esc(unit)+'</small>')+'</b></div>'+
  '<div class="bar"><span class="ok" style="left:'+okL.toFixed(1)+'%;right:'+(100-okR).toFixed(1)+'%"></span><span class="pt" style="left:'+pt.toFixed(1)+'%"></span></div>'+
  '<small class="rtxt">Rango objetivo '+esc(ok0)+' a '+esc(ok1)+' '+esc(unit)+'</small></div>'}
/* rangos objetivo por etapa (orientativos) */
const RANGOS={
 'Germinación':{temp:[22,26],hum:[65,75],ph:[6,6.5],ec:[0.4,0.8],vpd:[0.4,0.8]},
 'Plántula':{temp:[22,26],hum:[60,70],ph:[6,6.5],ec:[0.8,1.2],vpd:[0.6,1.0]},
 'Vegetativo':{temp:[22,28],hum:[55,65],ph:[5.8,6.3],ec:[1.2,1.8],vpd:[0.8,1.2]},
 'Pre-floración':{temp:[22,27],hum:[50,60],ph:[5.8,6.3],ec:[1.4,2.0],vpd:[1.0,1.4]},
 'Floración':{temp:[21,26],hum:[40,50],ph:[6.0,6.5],ec:[1.6,2.2],vpd:[1.2,1.5]},
 'Lista para cosechar':{temp:[18,24],hum:[40,50],ph:[6.0,6.5],ec:[0.8,1.2],vpd:[1.2,1.6]}};
function vpd(t,hr){const svp=.6108*Math.exp(17.27*t/(t+237.3));return+(svp*(1-hr/100)).toFixed(2)}
