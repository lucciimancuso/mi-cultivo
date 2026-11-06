
/* ---------- invernadero sin 3D (celular): 9 casilleros y ficha en hoja inferior ---------- */
const NOD=!!document.documentElement.dataset.nod;
function renderRoom2D(){
 const el=$('#room2d');if(!el||!NOD)return;
 if(!S.inRoom){el.innerHTML='';return}
 const by={};roomPlants().forEach(p=>{by[p.slot]=p});let h='';
 for(let i=0;i<SLOTS.length;i++){const p=by[i];
  if(p){const st=statusOf(p);
   h+='<button type="button" class="r2-slot has '+(st.tone==='ok'?'ok':st.tone)+(p.id===S.sel?' sel':'')+'" data-r2="'+esc(p.id)+'" aria-label="'+esc(p.name+', '+stageOf(p)+', '+st.label)+'"><span class="n">'+(i+1)+'</span><span class="pdot" aria-hidden="true"></span><b>'+esc(p.name)+'</b><small>'+esc(stageOf(p))+' · '+esc(st.label)+'</small><em>'+Math.round(heightCm(p))+' cm</em></button>'}
  else h+='<button type="button" class="r2-slot" data-r2e="'+i+'" aria-label="Estación '+(i+1)+' libre: agregar una planta"><span class="n">'+(i+1)+'</span><span class="plus" aria-hidden="true">+</span><small>Libre</small></button>'}
 el.innerHTML='<div class="r2-grid">'+h+'</div>'}
function openSheet(){document.body.dataset.sheet='1'}
function closeSheet(){delete document.body.dataset.sheet}
document.addEventListener('click',e=>{
 const s=e.target.closest&&e.target.closest('[data-r2]');if(s){selectPlant(s.dataset.r2);openSheet();return}
 const f=e.target.closest&&e.target.closest('[data-r2e]');if(f){np.room=S.room;np.slot=+f.dataset.r2e;toast('Estación '+(np.slot+1)+' libre: cargá la planta');go('nueva');return}
 if(e.target.closest&&e.target.closest('#sheetX,#sheetBg'))closeSheet()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.body.dataset.sheet)closeSheet()});
/* barra inferior del celular: "Más" abre el resto de las secciones */
(function(){const r=$('#rail');if(!r)return;
 const more=document.createElement('button');more.type='button';more.id='moreBtn';more.className='tab';more.setAttribute('aria-label','Más secciones');more.setAttribute('aria-expanded','false');
 more.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/></svg><span>Más</span>';
 r.appendChild(more);
 const close=()=>{r.classList.remove('open');more.setAttribute('aria-expanded','false')};
 more.addEventListener('click',e=>{e.stopPropagation();const o=r.classList.toggle('open');more.setAttribute('aria-expanded',String(o))});
 document.addEventListener('click',e=>{if(r.classList.contains('open')&&!e.target.closest('#rail'))close()});
 r.addEventListener('click',e=>{if(e.target.closest('.tab[data-go]'))close()})})();
