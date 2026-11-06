/* ---------- costos: calculadora de precios y rinde esperado ---------- */
const CAMPOS=[
 ['kwh','Precio del kWh','$','Lo sacás de la boleta: total dividido los kWh del período.'],
 ['watts','Consumo de la lámpara','W','Lo que dice la lámpara o el equipo LED.'],
 ['hVeg','Horas de luz en crecimiento','h','Normalmente 18.'],
 ['hFlo','Horas de luz en floración','h','Normalmente 12.'],
 ['coolers','Cantidad de coolers','u','Ventiladores de la carpa o el invernadero. Consumen energía todo el ciclo.'],
 ['coolW','Consumo de cada cooler','W','Un ventilador de PC gasta 3 a 8 W; uno de extracción más grande, 20 a 40 W.'],
 ['coolH','Horas por día que andan los coolers','h','Si van prendidos siempre, 24.'],
 ['coolPrecio','Precio de cada cooler','$','Es una compra única, se suma al costo del ciclo.'],
 ['aguaM3','Precio de 1.000 litros de agua','$','Si pagás un fijo por mes, dejalo vacío y ponelo en gastos fijos.'],
 ['fertPrecio','Precio del envase de fertilizante','$',''],
 ['fertMl','Contenido del envase','ml',''],
 ['fertDosis','Dosis por litro de agua','ml','Lo que indica la etiqueta, casi siempre entre 1 y 4.'],
 ['sustPrecio','Precio de la bolsa de sustrato','$',''],
 ['sustL','Litros por bolsa','L',''],
 ['semilla','Precio de cada semilla','$','Los esquejes no suman: salen de una planta tuya.'],
 ['maceta','Precio de cada maceta','$','Si las reusás, dejalo vacío.'],
 ['fijo','Otros gastos fijos por mes','$','Ventilación, alquiler del espacio, lo que sumes.']];
let costSel=null,costMod='hoy',costFormOk=false;
function costForm(){
 $('#costForm').innerHTML=CAMPOS.map(c=>'<div class="field"><label for="cf_'+c[0]+'">'+esc(c[1])+' <span class="muted">('+c[2]+')</span></label>'+
  '<input id="cf_'+c[0]+'" data-cf="'+c[0]+'" type="text" inputmode="decimal" autocomplete="off" value="'+(S.cost[c[0]]==null?'':String(S.cost[c[0]]).replace('.',','))+'">'+
  (c[3]?'<small class="hint">'+esc(c[3])+'</small>':'')+'</div>').join('');
 costFormOk=true}
function costBody(){
 const proy=costMod==='fin',c=cycleCost(costSel,proy),y=cycleYield(costSel);
 if(!c.plantas){$('#costBody').innerHTML='<div class="glass card empty-card"><h2>Todavía no hay plantas en este ciclo</h2><p class="muted">Cargá una planta y acá te muestro cuánto llevás gastado y cuánto te sale el gramo.</p></div>';return}
 const gr=proy?y.total:(y.real||y.total),porG=gr>0?c.total/gr:NaN;
 const K=[[money(c.total),proy?'Costo del ciclo completo':'Gastado hasta hoy'],
  [money(c.total/c.plantas),'Por planta'],
  [gramosN(gr),proy?'Gramos esperados':'Gramos (real + esperado)'],
  [isFinite(porG)?money(porG)+'/g':'—','Costo por gramo'],
  [Math.round(c.dias)+' días','Duración del ciclo']];
 const vacio=CAMPOS.every(f=>['watts','hVeg','hFlo','fertMl','sustL','fertDosis','coolW','coolH'].includes(f[0])||S.cost[f[0]]==null);
 const tabla='<div class="glass card"><h2>De dónde sale</h2><div class="tblwrap"><table class="tbl"><thead><tr><th>Concepto</th><th>Detalle</th><th class="ar">Costo</th></tr></thead><tbody>'+
  c.items.map(it=>'<tr><td><b>'+esc(it[0])+'</b></td><td class="hint">'+esc(it[2])+'</td><td class="ar">'+money(it[1])+'</td></tr>').join('')+
  '<tr class="tot"><td colspan="2"><b>Total</b></td><td class="ar"><b>'+money(c.total)+'</b></td></tr></tbody></table></div>'+
  (vacio?'<p class="hint">Cargá los precios de arriba para que esto deje de dar cero.</p>':'')+'</div>';
 const L=S.plants.filter(p=>p.grow===costSel),mine=userGL(),cp=c.total/c.plantas;
 const rinde=L.length?'<div class="glass card" style="margin-top:16px"><h2>Rinde esperado por planta</h2>'+
  '<p class="hint">Sale de la genética y el tamaño de maceta, ajustado por tus mediciones de altura y el estado de la planta'+(mine?', y calibrado con tus cosechas anteriores ('+fmtN(mine)+' g por litro de maceta).':'. Cuando cargues cosechas, lo calibro con tus propios números.')+'</p>'+
  '<div class="tblwrap"><table class="tbl"><thead><tr><th>Planta</th><th>Etapa</th><th>Esperado</th><th>Confianza</th><th class="ar">Costo por gramo</th></tr></thead><tbody>'+
  L.map(p=>{const e=yieldEst(p);return'<tr><td><b>'+esc(p.name)+'</b><br><span class="hint">'+esc(seedOf(p).name)+' · '+p.pot+' L'+(p.madre?' · esqueje':'')+'</span></td>'+
   '<td>'+stageOf(p)+'</td><td><b>'+gramosN(e.mid)+'</b><br><span class="hint">entre '+fmtN(e.min)+' y '+fmtN(e.max)+' g</span></td>'+
   '<td><span class="chip plain">'+e.conf+'</span></td><td class="ar">'+(e.mid>0?money(cp/e.mid)+'/g':'—')+'</td></tr>'}).join('')+
  '</tbody></table></div></div>':'';
 $('#costBody').innerHTML='<div class="glass card kpis">'+K.map(k=>'<div class="kpi"><b style="font-size:28px">'+k[0]+'</b><span>'+k[1]+'</span></div>').join('')+'</div>'+tabla+rinde}
function renderCostos(){
 if(!costFormOk)costForm();
 if(!costSel||!S.grows.some(g=>g.id===costSel))costSel=S.grow;
 $('#costSel').innerHTML=S.grows.slice().reverse().map(g=>'<option value="'+g.id+'"'+(g.id===costSel?' selected':'')+'>'+esc(g.name)+(g.id===S.grow?' (actual)':'')+'</option>').join('');
 $('#costMod').value=costMod;costBody()}
$('#costForm').addEventListener('input',e=>{const el=e.target.closest('[data-cf]');if(!el)return;
 const v=el.value.trim(),n=num(v);S.cost[el.dataset.cf]=v===''?null:(isFinite(n)?n:null);costBody()});
$('#costSel').addEventListener('change',e=>{costSel=e.target.value;costBody()});
$('#costMod').addEventListener('change',e=>{costMod=e.target.value;costBody()});
$('#costReset').addEventListener('click',()=>{S.cost=Object.assign({},COST0);costForm();costBody();toast('Precios borrados')});
renderers.costos=renderCostos;
