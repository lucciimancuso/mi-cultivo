
/* ---------- cuenta y grupo (Ajustes) ---------- */
const fmtCode=c=>c&&c.length===10?c.slice(0,5)+'-'+c.slice(5):c||'';
function renderCloudCard(){
 const b=$('#cloudBody');if(!b)return;
 if(!cloud.cfg){b.innerHTML='<p class="hint">La cuenta compartida todavía no está configurada en esta versión de la app.</p>';return}
 if(!cloud.on){b.innerHTML='<p class="hint">Estás usando la app solo en esta compu. Entrá con tu cuenta para compartir el cultivo con tu grupo y usar la IA.</p><div class="row"><button class="btn primary" id="cdIn" type="button">Entrar o crear cuenta</button></div>';return}
 const g=cloud.grow,owner=g.role==='owner',mem=Array.isArray(g.members)?g.members:[],solo=owner&&mem.length<=1;
 const accHint=(owner&&!solo?'Sos quien creó el grupo y hay más gente: primero sacá a los demás o borrá el grupo.':solo?'Como sos la única persona del grupo, se borra tu cuenta y el grupo con todas sus plantas y fotos.':'Se borra tu cuenta y salís del grupo. Lo que cargaste queda en el grupo, porque es del cultivo compartido.')+(store.isDesktop?' Lo que está guardado en esta compu no se borra.':'');
 b.innerHTML='<div class="cd-top"><div><b>'+esc(g.name)+'</b><span class="hint"> · '+(owner?'creaste este grupo':'sos parte del grupo')+'</span></div><span class="chip plain" id="cdSync"></span></div>'+
  '<ul class="cd-mem">'+mem.map(m=>'<li><span>'+esc(m.display_name)+(m.user_id===g.me?' (vos)':'')+(m.role==='owner'?' · creó el grupo':'')+'</span>'+(owner&&m.user_id!==g.me?'<button class="btn sm" data-kick="'+esc(m.user_id)+'" type="button">Sacar</button>':'')+'</li>').join('')+'</ul>'+
  '<div class="field"><label>Código para invitar ('+mem.length+' de 6)</label><div class="cd-code"><code id="cdCode">'+esc(fmtCode(g.invite_code))+'</code><button class="btn sm" id="cdCopy" type="button">Copiar</button><button class="btn sm" id="cdShare" type="button">Compartir</button>'+(owner?'<button class="btn sm" id="cdRot" type="button">Cambiar código</button>':'')+'</div>'+
  '<p class="hint">Cualquiera con este código puede entrar al grupo y ver todo el cultivo. Si se lo pasaste a alguien que no querés, cambialo.</p></div>'+
  '<div class="row"><button class="btn" id="cdOut" type="button">Cerrar sesión</button>'+(owner?'<button class="btn danger" id="cdDel" type="button">Borrar el grupo</button>':'<button class="btn" id="cdLeave" type="button">Salir del grupo</button>')+'</div>'+
  '<p class="hint">'+(store.isDesktop?'Los datos están en esta compu y también en el servidor del grupo.':'Los datos están en el servidor del grupo y hay una copia en este celu para verlos sin internet.')+'</p>'+
  '<div class="cd-acc"><div class="row"><button class="btn sm danger" id="cdAcc" type="button">Borrar mi cuenta</button></div><p class="hint">'+esc(accHint)+'</p></div>';
 const t=$('#cdSync');if(t)t.textContent=({ok:'Sincronizado',sync:'Guardando…',offline:'Sin conexión',err:'Error al sincronizar'})[cloud.status]||'Sincronizado'}
function armBtn(btn,label,fn){if(btn.dataset.armed){clearTimeout(+btn.dataset.armed);delete btn.dataset.armed;fn();return}
 const old=btn.textContent;btn.textContent=label;btn.dataset.armed=setTimeout(()=>{btn.textContent=old;delete btn.dataset.armed},5000)}
async function copyText(t){try{await navigator.clipboard.writeText(t);return true}catch(e){try{const i=document.createElement('textarea');i.value=t;i.style.cssText='position:fixed;opacity:0';document.body.appendChild(i);i.select();const ok=document.execCommand('copy');i.remove();return ok}catch(_){return false}}}
$('#cloudBody').addEventListener('click',async e=>{
 const t=e.target.closest('button');if(!t)return;
 try{
  if(t.id==='cdIn'){lsDel('micultivo-nocloud');location.reload();return}
  if(t.id==='cdCopy'){toast(await copyText(cloud.grow.invite_code)?'Código copiado':'No pude copiar, anotalo a mano');return}
  if(t.id==='cdShare'){const c=fmtCode(cloud.grow.invite_code),msg='Sumate a mi cultivo en Mi Cultivo. Creá tu cuenta y entrá con este código de grupo: '+c;
   if(navigator.share){try{await navigator.share({text:msg});return}catch(er){if(er&&er.name==='AbortError')return}}
   toast(await copyText(msg)?'Mensaje copiado, pegalo en WhatsApp':'No pude compartir');return}
  if(t.id==='cdRot'){armBtn(t,'Tocá de nuevo para cambiarlo',async()=>{await cloud.rotate();renderCloudCard();toast('Código nuevo listo. El anterior ya no sirve')});return}
  if(t.dataset.kick){armBtn(t,'¿Seguro?',async()=>{await cloud.kick(t.dataset.kick);renderCloudCard();toast('Lo sacaste del grupo')});return}
  if(t.id==='cdOut'){armBtn(t,'Tocá de nuevo para salir',()=>cloud.signOut());return}
  if(t.id==='cdLeave'){armBtn(t,'¿Seguro? Tocá de nuevo',async()=>{await cloud.leave();cloud.signOut()});return}
  if(t.id==='cdDel'){armBtn(t,'Se borra para todos. Tocá de nuevo',async()=>{await cloud.deleteGrow();cloud.signOut()});return}
  if(t.id==='cdAcc'){armBtn(t,'Se borra tu cuenta para siempre. Tocá de nuevo',async()=>{try{t.disabled=true;await cloud.deleteAccount();toast('Cuenta borrada');cloud.signOut()}catch(er){t.disabled=false;t.textContent='Borrar mi cuenta';toast(cerr(er))}})}
 }catch(err){toast(cerr(err))}});

/* ---------- guía de cultivo (PDF) y preguntas a la IA ---------- */
function mdLite(t){const out=[];let ul=false;
 String(t||'').split('\n').forEach(raw=>{const l=esc(raw).replace(/\*\*(.+?)\*\*/g,'<b>$1</b>');
  const li=/^\s*[-*•]\s+(.*)$/.exec(l),h=/^#{1,4}\s+(.*)$/.exec(l);
  if(li){if(!ul){out.push('<ul>');ul=true}out.push('<li>'+li[1]+'</li>');return}
  if(ul){out.push('</ul>');ul=false}
  if(h)out.push('<h4>'+h[1]+'</h4>');else if(l.trim())out.push('<p>'+l+'</p>')});
 if(ul)out.push('</ul>');return out.join('')}
function askContext(p){return{planta:p.name,genetica:seedOf(p).name,etapa:stageOf(p),dias_de_vida:Math.round(p.age),semana_de_vida:Math.floor(p.age/7)+1,maceta_litros:p.pot,altura_cm:Math.round(heightCm(p)),hoy:new Date().toLocaleDateString('es-AR')}}
function tabGuia(){
 const g=S.guide,p=plantOf(cc.plant),can=!!(cloud.on||window.__AIMOCK);
 const subir='<div class="glass card"><h2>Tu guía de cultivo</h2>'+
  (g?'<p class="hint">Guía activa: <b>'+esc(g.name)+'</b>'+(g.by?' · la subió '+esc(g.by):'')+(g.t?' · '+esc(fmtD(g.t,{day:'numeric',month:'short'})):'')+'. La IA la sigue cuando mira tus fotos y cuando le preguntás.</p>':
   '<p class="hint">Subí una guía en PDF (hasta 8 MB). La IA la lee, arma un plan por etapa y desde ahí te aconseja siguiendo esos pasos: dosis, riegos y tareas de cada semana.</p>')+
  (can?'':'<p class="hint">Para subir una guía tenés que entrar con tu cuenta (Ajustes).</p>')+
  '<div class="row"><input type="file" id="gFile" accept="application/pdf,.pdf" hidden><button class="btn primary" id="gPick" type="button"'+(can?'':' disabled')+'>'+(g?'Cambiar la guía':'Elegir el PDF')+'</button>'+(g?'<button class="btn" id="gDel" type="button">Quitar la guía</button>':'')+'</div><p class="hint" id="gMsg" role="status"></p>'+
  (g?'<details class="gdet"><summary>Ver el plan que armó la IA</summary><div class="gtext">'+mdLite(g.text)+'</div></details>':'')+'</div>';
 const ask='<div class="glass card" style="margin-top:16px"><h2>Preguntale a la IA</h2>'+(plantPicker()||'')+
  (p?'<div class="field"><label for="aQ">Tu pregunta sobre '+esc(p.name)+'</label><textarea id="aQ" rows="2" maxlength="400" placeholder="Por ejemplo: ¿qué le toca esta semana?"></textarea></div>'+
   '<div class="row"><button class="btn primary" id="aGo" type="button"'+(can?'':' disabled')+'>Preguntar</button><button class="btn" data-aq="¿Qué le toca hoy a esta planta según la guía?" type="button"'+(can?'':' disabled')+'>¿Qué toca hoy?</button><button class="btn" data-aq="¿Cómo voy comparado con la guía? ¿Hay algo que corregir?" type="button"'+(can?'':' disabled')+'>¿Cómo voy?</button></div>':'<p class="hint">Cargá una planta para poder preguntar.</p>')+
  '<div class="aans" id="aAns" aria-live="polite">'+(cc.ans?'<p>'+esc(cc.ans).replace(/\n/g,'<br>')+'</p>':'')+'</div></div>';
 return subir+ask}
function readB64(file){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(String(r.result).split(',')[1]||'');r.onerror=()=>rej(new Error('No pude leer el archivo'));r.readAsDataURL(file)})}
async function askIA(q){const p=plantOf(cc.plant);if(!p||!q)return;const a=$('#aAns');if(a)a.innerHTML='<p class="hint">Pensando…</p>';
 const r=await store.ask(q,askContext(p));cc.ans=r&&r.ok?r.data.text:'';
 if(!(r&&r.ok)){toast((r&&r.msg)||'No pude consultar a la IA')}renderCuidados()}
$('#cBody').addEventListener('click',async e=>{
 if(cc.tab!=='guia')return;
 if(e.target.closest('#gPick')){$('#gFile').click();return}
 if(e.target.closest('#gDel')){S.guide=null;saveNow(false);renderCuidados();toast('Guía quitada');return}
 if(e.target.closest('#aGo')){const q=$('#aQ').value.trim();if(q.length<3){toast('Escribí tu pregunta');return}askIA(q);return}
 const q=e.target.closest('[data-aq]');if(q)askIA(q.dataset.aq)});
$('#cBody').addEventListener('change',async e=>{
 if(e.target.id!=='gFile')return;const f=e.target.files&&e.target.files[0];e.target.value='';if(!f)return;
 const m=$('#gMsg');
 if(!/pdf$/i.test(f.type)&&!/\.pdf$/i.test(f.name)){m.textContent='Ese archivo no es un PDF';return}
 if(f.size>8*1024*1024){m.textContent='El PDF pesa más de 8 MB. Probá comprimirlo o subir solo las páginas que importan';return}
 m.textContent='Leyendo la guía con la IA… puede tardar medio minuto';$('#gPick').disabled=true;
 try{const r=await store.guide(await readB64(f));
  if(r&&r.ok&&r.data&&r.data.text){S.guide={name:f.name.replace(/\.pdf$/i,'').slice(0,80),text:r.data.text,t:Date.now(),by:cloud.grow&&cloud.grow.display_name||''};saveNow(false);renderCuidados();toast('Listo: la IA ya sigue tu guía')}
  else{m.textContent=(r&&r.msg)||'No pude leer la guía';$('#gPick').disabled=false}
 }catch(err){m.textContent=cerr(err);$('#gPick').disabled=false}});

(function(){const el=$('#instBody');if(el)el.innerHTML=installGuide()})();
