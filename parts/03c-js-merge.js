
/* ---------- fusión de datos compartidos (3 vías: base, lo mío, lo del grupo) ---------- */
/* Lo personal (preferencias, qué planta tenés abierta) no se comparte. */
const PERSONAL=['set','sel','room','day','v'];
function sharedOf(snap){const o={};Object.keys(snap).forEach(k=>{if(PERSONAL.indexOf(k)<0)o[k]=snap[k]});return o}
const jEq=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const isObj=v=>v&&typeof v==='object'&&!Array.isArray(v);
function keyOf(o){if(o&&typeof o==='object'){if(o.id!=null)return'i'+o.id;if(o.name!=null&&o.t==null)return'n'+o.name;if(o.t!=null)return't'+o.t+(o.k!=null?'|'+o.k:'');return'j'+JSON.stringify(o)}return'p'+String(o)}
/* si cambié yo, gano yo; si no, el valor del grupo */
const pick3=(b,l,r)=>jEq(l,b)?r:l;
function unionByT(l,r,descHint){
 const m=new Map();(r||[]).forEach(x=>m.set(keyOf(x),x));(l||[]).forEach(x=>m.set(keyOf(x),x));
 const a=Array.from(m.values());
 const ref=(l&&l.length>1?l:r)||[];const desc=descHint||(ref.length>1&&(+ref[0].t||0)>=(+ref[ref.length-1].t||0));
 if(a.length&&a.every(x=>x&&typeof x==='object'&&x.t!=null))a.sort((x,y)=>desc?y.t-x.t:x.t-y.t);
 return a}
function mergeEntity(b,l,r){
 if(!isObj(l)||!isObj(r))return l;
 const out={};b=isObj(b)?b:{};
 Object.keys(Object.assign({},r,l)).forEach(f=>{
  const lv=l[f],rv=r[f];
  if(Array.isArray(lv)||Array.isArray(rv)){
   const la=Array.isArray(lv)?lv:[],ra=Array.isArray(rv)?rv:[];
   if(jEq(la,ra))out[f]=la;else if(la.length&&ra.length&&la.concat(ra).every(x=>x&&typeof x==='object'&&(x.t!=null||x.id!=null)))out[f]=unionByT(la,ra,f==='notes');
   else out[f]=pick3(b[f],la,ra)}
  else if(isObj(lv)&&isObj(rv))out[f]=mergeEntity(b[f],lv,rv);
  else out[f]=(f in l)?pick3(b[f],lv,rv):rv});
 return out}
function mergeArr(b,l,r){
 b=Array.isArray(b)?b:[];l=Array.isArray(l)?l:[];r=Array.isArray(r)?r:[];
 const B=new Map(b.map(x=>[keyOf(x),x])),L=new Map(l.map(x=>[keyOf(x),x])),R=new Map(r.map(x=>[keyOf(x),x]));
 const prim=[l,r,b].every(a=>a.every(x=>x==null||typeof x!=='object'));
 if(prim){const sb=new Set(b),sl=new Set(l),sr=new Set(r),o=[];
  new Set(r.concat(l)).forEach(x=>{const iL=sl.has(x),iR=sr.has(x),iB=sb.has(x);if((iL&&iR)||(!iB&&(iL||iR)))o.push(x)});return o}
 const out=[],seen=new Set();
 const take=k=>{
  if(seen.has(k))return;seen.add(k);
  const eb=B.get(k),el=L.get(k),er=R.get(k);
  if(el&&er){out.push(jEq(el,er)?el:(eb&&jEq(eb,el))?er:(eb&&jEq(eb,er))?el:mergeEntity(eb,el,er))}
  else if(el){if(!eb||!jEq(eb,el))out.push(el)}            /* nuevo mío, o lo borró el grupo pero yo lo cambié */
  else if(er){if(!eb||!jEq(eb,er))out.push(er)}            /* nuevo del grupo, o lo borré yo pero ellos lo cambiaron */
 };
 r.forEach(x=>take(keyOf(x)));l.forEach(x=>take(keyOf(x)));
 return out}
function mergeHist(b,l,r){
 const out={};b=b||{};l=l||{};r=r||{};
 Object.keys(Object.assign({},r,l)).forEach(pid=>{out[pid]=Object.assign({},r[pid]||{},l[pid]||{})});
 return out}
const ATOMIC=['guide'];
function mergeShared(base,local,remote){
 base=base||{};const out={};
 Object.keys(Object.assign({},remote,local)).forEach(k=>{
  const b=base[k],l=local[k],r=remote[k];
  if(k==='hist')out[k]=mergeHist(b,l,r);
  else if(Array.isArray(l)||Array.isArray(r))out[k]=mergeArr(b,l,r);
  else if(ATOMIC.indexOf(k)>=0){out[k]=(l&&r&&(l.t||0)!==(r.t||0))?((l.t||0)>(r.t||0)?l:r):pick3(b,l,r)}
  else if(isObj(l)&&isObj(r)){
   const o={};Object.keys(Object.assign({},r,l)).forEach(f=>{
    const lv=l[f],rv=r[f],bv=isObj(b)?b[f]:undefined;
    if(!(f in l))o[f]=(bv!==undefined&&jEq(bv,rv))?undefined:rv;           /* lo quité yo */
    else if(!(f in r))o[f]=(bv!==undefined&&jEq(bv,lv))?undefined:lv;      /* lo quitó el grupo */
    else o[f]=pick3(bv,lv,rv)});
   Object.keys(o).forEach(f=>{if(o[f]===undefined)delete o[f]});out[k]=o}
  else out[k]=(k in local)?pick3(b,l,r):r});
 return out}
