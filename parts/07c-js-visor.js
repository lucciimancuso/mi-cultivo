
/* ---------- visor de fotos: línea de tiempo, comparar, borrar, volver a analizar ---------- */
const vw={pid:null,list:[],i:0,cmp:false,timer:null,del:false,last:null};
function openViewer(pid,photo){const p=plantAny(pid);if(!p||!p.photos.length){toast('Esta planta todavía no tiene fotos');return}
 vw.pid=pid;vw.list=p.photos.slice().sort((a,b)=>a.t-b.t);vw.i=photo?Math.max(0,vw.list.indexOf(photo)):vw.list.length-1;vw.cmp=false;vw.del=false;vw.last=document.activeElement;
 $('#viewer').hidden=false;document.body.dataset.modal='1';renderViewer();$('#vwClose').focus()}
function stopPlay(){if(vw.timer){clearInterval(vw.timer);vw.timer=null}const b=$('#vwPlay');if(b)b.textContent='Reproducir'}
function closeViewer(){stopPlay();$('#viewer').hidden=true;delete document.body.dataset.modal;if(vw.last&&vw.last.focus&&document.contains(vw.last))vw.last.focus()}
function renderViewer(){const p=plantAny(vw.pid),L=vw.list,x=L[vw.i];if(!p||!x){closeViewer();return}
 const fig=(y,cap)=>'<figure><img src="'+esc(photoSrc(y))+'" alt="Foto de '+esc(p.name)+' del '+esc(fmtD(y.t))+'">'+(cap?'<figcaption>'+esc(cap)+'</figcaption>':'')+'</figure>';
 const cmp=vw.cmp&&vw.i>0;
 $('#vwTitle').textContent=p.name+' · foto '+(vw.i+1)+' de '+L.length;
 $('#vwSub').textContent=fmtDT(x.t)+' · día '+Math.max(0,Math.floor((x.t-p.sownAt)/DAY))+' · '+(x.label||'sin diagnóstico')+(x.ia?' (con IA)':'');
 $('#vwImgs').className='vwimgs'+(cmp?' two':'');
 $('#vwImgs').innerHTML=cmp?fig(L[0],'Primera · '+fmtD(L[0].t)+' · día '+Math.max(0,Math.floor((L[0].t-p.sownAt)/DAY)))+fig(x,'Esta · '+fmtD(x.t)+' · día '+Math.max(0,Math.floor((x.t-p.sownAt)/DAY))):fig(x,'');
 const r=$('#vwRange');r.max=Math.max(0,L.length-1);r.value=vw.i;r.disabled=L.length<2;
 $('#vwPrev').disabled=vw.i<=0;$('#vwNext').disabled=vw.i>=L.length-1;$('#vwPlay').disabled=L.length<2;
 $('#vwCmp').disabled=L.length<2||vw.i===0;$('#vwCmp').setAttribute('aria-pressed',String(vw.cmp));
 $('#vwRe').hidden=!plantOf(vw.pid);$('#vwDel').textContent=vw.del?'Sí, eliminar':'Eliminar foto'}
function vwGo(i){vw.i=Math.max(0,Math.min(vw.list.length-1,i));vw.del=false;$('#vwMsg').textContent='';renderViewer()}
$('#vwClose').addEventListener('click',closeViewer);
$('#viewer').addEventListener('click',e=>{if(e.target.id==='viewer')closeViewer()});
$('#vwRange').addEventListener('input',e=>{stopPlay();vwGo(+e.target.value)});
$('#vwPrev').addEventListener('click',()=>{stopPlay();vwGo(vw.i-1)});
$('#vwNext').addEventListener('click',()=>{stopPlay();vwGo(vw.i+1)});
$('#vwCmp').addEventListener('click',()=>{stopPlay();vw.cmp=!vw.cmp;renderViewer()});
$('#vwPlay').addEventListener('click',()=>{if(vw.timer){stopPlay();return}if(vw.list.length<2)return;vw.cmp=false;if(vw.i>=vw.list.length-1)vw.i=0;renderViewer();$('#vwPlay').textContent='Pausar';
 vw.timer=setInterval(()=>{if(vw.i>=vw.list.length-1){stopPlay();return}vwGo(vw.i+1)},S.set.mot?750:1200)});
$('#vwDel').addEventListener('click',async()=>{const p=plantAny(vw.pid),x=vw.list[vw.i];if(!p||!x)return;
 if(!vw.del){vw.del=true;renderViewer();$('#vwMsg').textContent='Se borra la foto de la compu. No se puede deshacer.';setTimeout(()=>{if(vw.del){vw.del=false;if(!$('#viewer').hidden){renderViewer();$('#vwMsg').textContent=''}}},4000);return}
 stopPlay();try{await store.deletePhoto(x.f)}catch(e){}
 p.photos=p.photos.filter(y=>y!==x);vw.list=vw.list.filter(y=>y!==x);vw.del=false;$('#vwMsg').textContent='';
 if(S.reOf===x)S.reOf=null;
 toast('Foto eliminada');if(!vw.list.length){closeViewer()}else{vwGo(Math.min(vw.i,vw.list.length-1))}
 if(S.view==='foto')renderStrip();if(S.view==='cosechas')renderCosechas();if(S.view==='stage')renderCard()});
$('#vwRe').addEventListener('click',async()=>{const p=plantOf(vw.pid),x=vw.list[vw.i];if(!p||!x)return;
 let d=null;try{d=await store.readPhoto(x.f)}catch(e){}
 if(!d){$('#vwMsg').textContent='No pude abrir esa foto desde la compu';return}
 closeViewer();S.sel=p.id;setShot(d);S.reOf=x;go('foto');toast('Foto cargada. Apretá Analizar para verla de nuevo')});
document.addEventListener('keydown',e=>{if($('#viewer').hidden)return;
 if(e.key==='Escape'){e.preventDefault();closeViewer();return}
 if(e.target&&/^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName)&&e.target.id!=='vwRange')return;
 if(e.key==='ArrowLeft'){e.preventDefault();stopPlay();vwGo(vw.i-1)}
 else if(e.key==='ArrowRight'){e.preventDefault();stopPlay();vwGo(vw.i+1)}
 else if(e.key==='Tab'){const f=$$('#viewer button:not([disabled]):not([hidden]),#viewer input:not([disabled])');if(!f.length)return;const a=f[0],z=f[f.length-1];
  if(e.shiftKey&&document.activeElement===a){e.preventDefault();z.focus()}else if(!e.shiftKey&&document.activeElement===z){e.preventDefault();a.focus()}}});
