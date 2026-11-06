
/* ---------- escena 3D ---------- */
const G={where:'campus',place(){},campusView(){},zoomInto(){},roomView(){},projectAdd(){return null},onPickRoom:null,ok:false,onFrame:null,onPick:null,rebuild(){},sync(){},focus(){},overview(){},walk(){},setMode(){},slot(){return -1},camMode:'general',water(){},setQuality(){},resize(){},snap(){return null},project(){return null},height(){return 0}};
function initScene(){
 const canvas=$('#gl');
 if(!window.THREE)return false;
 let renderer;
 try{renderer=new THREE.WebGLRenderer({canvas:canvas,antialias:true,alpha:true})}catch(e){return false}
 renderer.outputEncoding=THREE.sRGBEncoding;
 renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 const scene=new THREE.Scene();scene.background=new THREE.Color(0xcfd8e3);const CV={l:0,t:0,w:innerWidth,h:innerHeight};
 const camera=new THREE.PerspectiveCamera(40,1,.1,420);
 const cA=new THREE.Color(),cB=new THREE.Color();
 const mixC=(t,n,d,k)=>{t.set(n);cB.set(d);t.lerp(cB,k)};
 /* invernadero de cultivo comercial: nave larga con tres hileras de mesas blancas, redes de entutorado y barras de luz violeta */
 scene.fog=new THREE.Fog(new THREE.Color().setRGB(.51,.73,.96),80,300);
 const roomG=new THREE.Group();scene.add(roomG);
 const hemi=new THREE.HemisphereLight(0xeaf1ff,0x8a929e,.5);scene.add(hemi);
 const sun=new THREE.DirectionalLight(0xfff2de,.5);sun.position.set(3,12,5);sun.castShadow=true;
 sun.shadow.mapSize.set(1024,1024);const sc=sun.shadow.camera;sc.left=-8;sc.right=8;sc.top=8;sc.bottom=-8;sc.near=1;sc.far=34;sun.shadow.bias=-.0006;
 scene.add(sun);scene.add(sun.target);
 const RW=24,RD=32,RH=8.6,RR=12,TRAY=1.1,BW=3.4,ROWX=[-7,0,7],AIS=3.5,HALL=10.5,BZC=-3.5,BL=19.5;
 const mkCv=(w,h,fn)=>{const c=document.createElement('canvas');c.width=w;c.height=h;fn(c.getContext('2d'),w,h);return c};
 const mkTx=(c,rx,ry)=>{const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(rx,ry);t.encoding=THREE.sRGBEncoding;t.anisotropy=4;return t};
 const Bx=(w,h,d)=>new THREE.BoxGeometry(w,h,d);
 const P3=(geo,mat,x,y,z,rx,ry,rz)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);if(rx||ry||rz)m.rotation.set(rx||0,ry||0,rz||0);roomG.add(m);return m};
 const mSteel=new THREE.MeshStandardMaterial({color:0x8a97a6,roughness:.5,metalness:.3}),mGalv=new THREE.MeshStandardMaterial({color:0xaab3bf,roughness:.4,metalness:.6}),
  mWhite=new THREE.MeshStandardMaterial({color:0xf1f4f8,roughness:.55,metalness:.1}),mConc=new THREE.MeshStandardMaterial({color:0xa7adb5,roughness:.95}),
  mDarkI=new THREE.MeshStandardMaterial({color:0x2b303a,roughness:.6,metalness:.3});
 const glassM=new THREE.MeshStandardMaterial({color:0xd7e4f2,roughness:.85,emissive:0x7f98b8,emissiveIntensity:.5});
 const roofM=new THREE.MeshStandardMaterial({color:0xe2ecf7,roughness:.8,emissive:0x8ea6c6,emissiveIntensity:.5,
  map:mkTx(mkCv(8,64,(x,w,h)=>{x.fillStyle='#fff';x.fillRect(0,0,w,h);x.fillStyle='rgba(110,125,152,.6)';x.fillRect(0,0,w,3)}),1,RD/2)});
 /* piso de hormigón con los pasillos marcados */
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(RW,RD),new THREE.MeshStandardMaterial({color:0xffffff,roughness:.82,
  map:mkTx(mkCv(512,512,(x,w,h)=>{const r=rng(3);x.fillStyle='#8d9299';x.fillRect(0,0,w,h);
   for(let i=0;i<9000;i++){const v=112+Math.floor(r()*58);x.fillStyle='rgba('+v+','+(v+2)+','+(v+6)+','+(.08+r()*.18)+')';x.fillRect(r()*w,r()*h,1+r()*2,1+r()*2)}
   x.strokeStyle='rgba(38,42,50,.5)';x.lineWidth=3;x.strokeRect(0,0,w,h)}),RW/8,RD/8)}));
 floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;roomG.add(floor);
 [-AIS,AIS].forEach(x=>{const a=new THREE.Mesh(new THREE.PlaneGeometry(3,RD-1),new THREE.MeshStandardMaterial({color:0x6c727c,roughness:.9}));a.rotation.x=-Math.PI/2;a.position.set(x,.006,0);roomG.add(a)});
 /* paredes laterales (paneles esmerilados, se ven desde adentro) y frentes con puerta */
 [[-RW/2,Math.PI/2],[RW/2,-Math.PI/2]].forEach(w=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(RD,RH),glassM);m.position.set(w[0],RH/2,0);m.rotation.y=w[1];roomG.add(m)});
 const gable=door=>{const s=new THREE.Shape();s.moveTo(-RW/2,0);s.lineTo(RW/2,0);s.lineTo(RW/2,RH);s.lineTo(0,RR);s.lineTo(-RW/2,RH);s.closePath();
  if(door){const h=new THREE.Path();h.moveTo(-1.9,0);h.lineTo(-1.9,6.2);h.lineTo(1.9,6.2);h.lineTo(1.9,0);h.closePath();s.holes.push(h)}return new THREE.ShapeGeometry(s)};
 {const b=new THREE.Mesh(gable(false),glassM);b.position.z=-RD/2;roomG.add(b);const f=new THREE.Mesh(gable(true),glassM);f.position.z=RD/2;f.rotation.y=Math.PI;roomG.add(f)}
 /* techo a dos aguas: se ve solo desde adentro, así de afuera queda abierto */
 function roofGeo(s){const v=[0,RR,-RD/2,s*RW/2,RH,-RD/2,s*RW/2,RH,RD/2,0,RR,RD/2],g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(v,3));g.setAttribute('uv',new THREE.Float32BufferAttribute([0,0,1,0,1,1,0,1],2));
  g.setIndex(s>0?[0,1,2,0,2,3]:[0,2,1,0,3,2]);g.computeVertexNormals();return g}
 [1,-1].forEach(s=>roomG.add(new THREE.Mesh(roofGeo(s),roofM)));
 const rfY=x=>RR-Math.abs(x)*(RR-RH)/(RW/2);
 /* zócalo de hormigón, parantes y travesaños */
 [-1,1].forEach(s=>{P3(Bx(.4,1.2,RD),mConc,s*(RW/2-.2),.6,0);P3(Bx(.34,.34,RD),mSteel,s*(RW/2-.17),RH+.12,0);
  for(let i=0;i<=RD/2;i++)P3(Bx(.16,RH-1.2,.16),mSteel,s*(RW/2-.08),1.2+(RH-1.2)/2,-RD/2+i*2);
  P3(Bx(.12,.12,RD),mSteel,s*(RW/2-.06),4.6,0)});
 P3(Bx(RW-.8,1.2,.4),mConc,0,.6,-RD/2+.2);[-1,1].forEach(s=>P3(Bx(RW/2-1.9-.4,1.2,.4),mConc,s*((RW/2+1.9)/2-.2),.6,RD/2-.2));
 for(let i=-RW/4;i<=RW/4;i++){P3(Bx(.14,rfY(i*2)-1.2,.14),mSteel,i*2,1.2+(rfY(i*2)-1.2)/2,-RD/2+.1);if(Math.abs(i*2)>2.2)P3(Bx(.14,rfY(i*2)-1.2,.14),mSteel,i*2,1.2+(rfY(i*2)-1.2)/2,RD/2-.1)}
 /* puerta doble */
 [-1,1].forEach(s=>{P3(Bx(.22,6.4,.3),mSteel,s*2,3.2,RD/2-.1);const l=new THREE.Mesh(new THREE.PlaneGeometry(1.9,6.1),glassM);l.position.set(s*.96,3.1,RD/2-.07);l.rotation.y=Math.PI;roomG.add(l);P3(Bx(.08,1.1,.1),mGalv,-s*.18,3.1,RD/2-.16)});
 P3(Bx(4.2,.26,.3),mSteel,0,6.3,RD/2-.1);P3(Bx(.1,6.1,.1),mSteel,0,3.1,RD/2-.1);
 /* cerchas de acero cada 4 m */
 const rL=Math.hypot(RW/2,RR-RH),rA=Math.atan2(RR-RH,RW/2),gR=Bx(rL,.34,.2),gT=Bx(RW,.22,.16),gK=Bx(.16,RR-RH,.16),gS=Bx(.14,(RR-RH)/2,.14),gC=Bx(.3,RH,.3),dL=Math.hypot(RW/4,(RR-RH)/2),dA=Math.atan2((RR-RH)/2,RW/4),gD=Bx(dL,.1,.1);
 [-14,-10,-6,-2,2,6,10,14].forEach(z=>{
  P3(gT,mSteel,0,RH-.05,z);P3(gK,mSteel,0,RH+(RR-RH)/2,z);
  [-1,1].forEach(s=>{P3(gR,mSteel,s*RW/4,(RH+RR)/2,z,0,0,-s*rA);P3(gC,mSteel,s*(RW/2-.2),RH/2,z);
   P3(gS,mSteel,s*RW/4,RH+(RR-RH)/4,z);P3(gD,mSteel,s*RW/8,RH+(RR-RH)/4,z,0,0,s*dA)})});
 [-1,1].forEach(s=>[3,6,9].forEach(x=>P3(Bx(.12,.12,RD),mSteel,s*x,rfY(x)-.1,0)));
 P3(Bx(.3,.26,RD),mSteel,0,RR-.1,0);
 /* tubería blanca, tanque y deshumidificador como en los invernaderos reales */
 [-1,1].forEach(s=>{const p=new THREE.Mesh(new THREE.CylinderGeometry(.15,.15,RW-.6,14),mWhite);p.rotation.z=Math.PI/2;p.position.set(0,3.4,s*(RD/2-.38));roomG.add(p);
  const q=new THREE.Mesh(new THREE.CylinderGeometry(.07,.07,RW-.6,10),new THREE.MeshStandardMaterial({color:0x4a9be0,roughness:.45,metalness:.3}));q.rotation.z=Math.PI/2;q.position.set(0,2.7,s*(RD/2-.38));roomG.add(q);
  const w=new THREE.Mesh(new THREE.CylinderGeometry(.15,.15,RD-.8,14),mWhite);w.rotation.x=Math.PI/2;w.position.set(s*(RW/2-.45),3.4,0);roomG.add(w)});
 P3(Bx(1.9,3.2,1.4),new THREE.MeshStandardMaterial({color:0xd8cdb6,roughness:.7}),-10.6,1.6,-RD/2+1.2);P3(Bx(1.5,.9,.06),mDarkI,-10.6,1.9,-RD/2+1.2+.72);
 P3(new THREE.CylinderGeometry(.9,.9,2.8,24),mWhite,10.6,1.4,-RD/2+1.2);P3(new THREE.CylinderGeometry(.9,.9,.14,24),mGalv,10.6,2.86,-RD/2+1.2);
 /* ventiladores de extracción en las paredes */
 const exF=[];
 [-1,1].forEach(s=>{P3(Bx(.3,3.6,3.6),mSteel,s*(RW/2-.3),4.6,0);const g=new THREE.Group();g.position.set(s*(RW/2-.5),4.6,0);roomG.add(g);exF.push(g);
  for(let k=0;k<3;k++){const b=new THREE.Mesh(Bx(.05,2.9,.5),mDarkI);b.rotation.x=k*Math.PI/3;g.add(b)}});
 /* ventiladores de circulación colgados sobre los pasillos */
 const haf=[];
 [[-AIS,-6],[AIS,-6],[-AIS,4],[AIS,4]].forEach(f=>{const g=new THREE.Group();g.position.set(f[0],8.1,f[1]);g.rotation.x=.4;roomG.add(g);
  const hr=new THREE.Mesh(new THREE.TorusGeometry(.95,.07,8,28),mDarkI);g.add(hr);const hub=new THREE.Mesh(new THREE.CylinderGeometry(.18,.18,.26,12),mDarkI);hub.rotation.x=Math.PI/2;g.add(hub);
  const bl=new THREE.Group();g.add(bl);haf.push(bl);for(let k=0;k<4;k++){const b=new THREE.Mesh(Bx(.8,.26,.04),mDarkI);b.position.set(Math.cos(k*Math.PI/2)*.5,Math.sin(k*Math.PI/2)*.5,0);b.rotation.z=k*Math.PI/2+.3;bl.add(b)}
  const top=rfY(f[0])-.1;[-.7,.7].forEach(o=>{const L=top-8.3;P3(new THREE.CylinderGeometry(.015,.015,L,5),mGalv,f[0],8.3+L/2,f[1]+o)})});
 const uv=[],cLed=new THREE.Color(0xb98cff),cLedOff=new THREE.Color(0x2a2040);
 const bodyMat=new THREE.MeshStandardMaterial({color:0xe9ecf2,roughness:.5,metalness:.2});
 const plateMeshes=[],plateTex=[],netMeshes=[];
 function mkPlateTex(n,free){const c=document.createElement('canvas');c.width=256;c.height=160;const x=c.getContext('2d');
  x.fillStyle=free?'#1b1626':'#0f0a1d';x.fillRect(0,0,256,160);x.strokeStyle=free?'#4a3f66':'#a77bff';x.lineWidth=6;x.strokeRect(5,5,246,150);
  x.fillStyle=free?'#7a6f94':'#ffffff';x.textAlign='center';x.textBaseline='middle';x.font='800 '+(free?80:108)+'px "Bricolage Grotesque","Segoe UI",sans-serif';x.fillText(String(n),128,free?60:76);
  if(free){x.font='600 26px Figtree,"Segoe UI",sans-serif';x.fillText('libre',128,122)}
  const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;t.anisotropy=4;return t}
 /* cartel con el nombre del invernadero en la pared del fondo (se edita tocándolo) */
 const signMat=new THREE.MeshBasicMaterial({color:0xffffff}),sign=new THREE.Mesh(new THREE.PlaneGeometry(8.4,2.8),signMat);sign.position.set(0,5.6,-RD/2+.3);sign.userData.sign=true;roomG.add(sign);
 function mkSignTex(label){return new THREE.CanvasTexture(mkCv(1024,340,(x,w,h)=>{
  x.beginPath();x.roundRect?x.roundRect(8,8,w-16,h-16,36):x.rect(8,8,w-16,h-16);x.fillStyle='#10151f';x.fill();x.strokeStyle='rgba(255,255,255,.2)';x.lineWidth=4;x.stroke();
  x.fillStyle='#a77bff';x.fillRect(8,8,22,h-16);
  x.textAlign='center';x.textBaseline='middle';x.fillStyle='#b9a6ff';x.font='700 50px Figtree,"Segoe UI",sans-serif';x.fillText('I N V E R N A D E R O',w/2+10,72);
  let fs=200;x.font='800 '+fs+'px "Bricolage Grotesque","Segoe UI",sans-serif';const tw=x.measureText(label).width;if(tw>860){fs=Math.max(60,Math.floor(fs*860/tw));x.font='800 '+fs+'px "Bricolage Grotesque","Segoe UI",sans-serif'}
  x.fillStyle='#fff';x.fillText(label,w/2+10,186);x.fillStyle='rgba(255,255,255,.4)';x.font='600 30px Figtree,"Segoe UI",sans-serif';x.fillText('tocá para cambiar el nombre',w/2+10,300)}))}
 let signKey='';function signSync(){const lb=roomLabel(S.room);if(signKey===lb)return;signKey=lb;const t=mkSignTex(lb);t.encoding=THREE.sRGBEncoding;t.anisotropy=4;if(signMat.map)signMat.map.dispose();signMat.map=t;signMat.needsUpdate=true}
 /* tres hileras de mesas a lo largo de la nave */
 const benchTx=mkTx(mkCv(64,64,(x,w,h)=>{x.fillStyle='#f3f6fa';x.fillRect(0,0,w,h);x.fillStyle='rgba(100,112,130,.28)';for(let i=0;i<4;i++)x.fillRect(0,i*16+6,w,4)}),BW/1.1,BL/1.1);
 const benchM=new THREE.MeshStandardMaterial({color:0xffffff,map:benchTx,roughness:.5,metalness:.05}),
  netTx=mkTx(mkCv(64,64,(x,w,h)=>{x.strokeStyle='rgba(238,214,72,.85)';x.lineWidth=1.6;x.strokeRect(0,0,w,h)}),(BW-.3)/.65,6.2/.65),
  netM=new THREE.MeshBasicMaterial({map:netTx,transparent:true,side:THREE.DoubleSide,depthWrite:false,alphaTest:.04});
 const gBTop=Bx(BW,.12,BL),gRimL=Bx(.1,.26,BL),gRimE=Bx(BW-.2,.26,.1),gLeg=Bx(.16,TRAY-.12,.16),gBrL=Bx(.07,.07,BL-.6),gBrX=Bx(BW-.5,.07,.07),gPost=Bx(.06,2.3,.06),gNet=new THREE.PlaneGeometry(BW-.3,6.2);
 const gPlate=new THREE.PlaneGeometry(1.5,.94),gLamp=Bx(2.4,.16,4.8),gDif=new THREE.PlaneGeometry(2.2,4.5),gStr=Bx(.04,.02,4.5),gCone=new THREE.CylinderGeometry(1.2,2.7,6.2,28,1,true);
 ROWX.forEach(x=>{
  const top=P3(gBTop,benchM,x,TRAY-.06,BZC);top.receiveShadow=true;
  [-1,1].forEach(q=>{P3(gRimL,mWhite,x+q*(BW/2-.05),TRAY+.02,BZC);P3(gRimE,mWhite,x,TRAY+.02,BZC+q*(BL/2-.05));P3(gBrL,mGalv,x+q*(BW/2-.3),.42,BZC)});
  [-1,0,1].forEach(k=>{[-1,1].forEach(q=>P3(gLeg,mGalv,x+q*(BW/2-.3),(TRAY-.12)/2,BZC+k*(BL/2-.3)));P3(gBrX,mGalv,x,.42,BZC+k*(BL/2-.3))});
  [-9.75,-3.25,3.25,9.75].forEach(dz=>[-1,1].forEach(q=>P3(gPost,mGalv,x+q*(BW/2-.1),TRAY+1.15,BZC+dz)))});
 SLOTS.forEach((sl,i)=>{
  const x=sl[0],z=sl[1],col=x<-3?0:x>3?2:1,side=col===0?1:-1;
  {const nt=P3(gNet,netM,x,TRAY+2.1,z,-Math.PI/2,0,0);nt.renderOrder=2;netMeshes.push(nt)}
  const pm=new THREE.Mesh(gPlate,new THREE.MeshBasicMaterial({color:0xffffff}));pm.position.set(x+side*(BW/2+.03),TRAY-.62,z);pm.rotation.y=side*Math.PI/2;pm.userData.slot=i;roomG.add(pm);plateMeshes.push(pm);
  /* barra de luz ultravioleta colgada de la cercha */
  const g=new THREE.Group();g.position.set(x,7.3,z);
  g.add(new THREE.Mesh(gLamp,bodyMat));
  const ledMat=new THREE.MeshBasicMaterial({color:0xb98cff});
  const dif=new THREE.Mesh(gDif,ledMat);dif.rotation.x=Math.PI/2;dif.position.y=-.09;g.add(dif);
  for(let k=-2;k<=2;k++){const s=new THREE.Mesh(gStr,new THREE.MeshBasicMaterial({color:0x17122a}));s.position.set(k*.5,-.095,0);g.add(s)}
  const cL=rfY(x)-.1-7.3;[-2,2].forEach(cz=>{const c=new THREE.Mesh(new THREE.CylinderGeometry(.014,.014,cL,6),new THREE.MeshBasicMaterial({color:0x8b88a0}));c.position.set(0,cL/2,cz);g.add(c)});
  const glow=new THREE.MeshBasicMaterial({color:0x9b6cff,transparent:true,opacity:.055,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending});
  const cone=new THREE.Mesh(gCone,glow);cone.position.y=-3.2;g.add(cone);
  roomG.add(g);
  const light=new THREE.PointLight(0xc2a8ff,1.35,19,1.5);light.position.set(x,6.4,z);light.intensity=0;scene.add(light);
  uv.push({light:light,led:ledMat,glow:glow})});
 function plateSync(){plateMeshes.forEach((pm,i)=>{const used=Array.from(recs.values()).some(r=>r.slot===i);
  if(!plateTex[i])plateTex[i]={};if(!plateTex[i].occ){plateTex[i].occ=mkPlateTex(i+1,false);plateTex[i].free=mkPlateTex(i+1,true)}
  pm.material.map=used?plateTex[i].occ:plateTex[i].free;pm.material.needsUpdate=true;if(netMeshes[i])netMeshes[i].visible=used})}
 if(document.fonts&&document.fonts.ready)document.fonts.ready.then(()=>{plateTex.length=0;plateSync()});
 const ring=new THREE.Mesh(new THREE.RingGeometry(.86,.96,64),new THREE.MeshBasicMaterial({color:0xbfe04f,transparent:true,opacity:.95,side:THREE.DoubleSide}));
 ring.rotation.x=-Math.PI/2;ring.position.y=TRAY+.03;roomG.add(ring);
 const gaugeGlass=new THREE.MeshBasicMaterial({color:0xcfd8ff,transparent:true,opacity:.22,depthWrite:false,side:THREE.DoubleSide});
 /* partículas */
 const DN=130,dpos=new Float32Array(DN*3),dvel=new Float32Array(DN*3),rd=rng(7);
 for(let i=0;i<DN;i++){dpos[i*3]=(rd()-.5)*(RW-3);dpos[i*3+1]=rd()*8.5;dpos[i*3+2]=(rd()-.5)*(RD-4);dvel[i*3]=(rd()-.5)*.1;dvel[i*3+1]=.03+rd()*.08;dvel[i*3+2]=(rd()-.5)*.1}
 const dg=new THREE.BufferGeometry();dg.setAttribute('position',new THREE.BufferAttribute(dpos,3));
 const dmat=new THREE.PointsMaterial({color:0xcdb6ff,size:.06,transparent:true,opacity:.5,depthWrite:false});
 const dust=new THREE.Points(dg,dmat);roomG.add(dust);

 /* hojas palmeadas */
 function leafletShape(){const sh=new THREE.Shape(),N=26,top=[];
  for(let i=0;i<=N;i++){const t=i/N,w=.11*Math.sin(Math.PI*Math.pow(t,.72))*(1-.25*t),saw=(i>2&&i<N-1)?1+.2*(((t*9)%1)-.5)*2:1;top.push([t,w*saw])}
  sh.moveTo(0,0);for(let i=1;i<=N;i++)sh.lineTo(top[i][0],top[i][1]);for(let i=N-1;i>=1;i--)sh.lineTo(top[i][0],-top[i][1]);sh.lineTo(0,0);return sh}
 const LP=new THREE.ShapeGeometry(leafletShape(),1).toNonIndexed().attributes.position.array;
 const cDark=new THREE.Color(0x1b5a2c),cLight=new THREE.Color(0x58ad3c),cT=new THREE.Color();
 function makeLeaf(ang,len){const pos=[],col=[];
  for(let li=0;li<ang.length;li++){const ph=ang[li]*Math.PI/180,l=len[li],cp=Math.cos(ph),sp=Math.sin(ph);
   for(let v=0;v<LP.length;v+=3){const x0=LP[v],y0=LP[v+1],z0=Math.abs(y0)*.9;
    const x=x0*l,y=y0*l,z=z0*l,X=x,Y=z-.09*(Math.abs(ph)/1.6)*x0*l,Z=-y;
    pos.push(X*cp+Z*sp,Y,-X*sp+Z*cp);cT.copy(cDark).lerp(cLight,Math.pow(x0,.8));col.push(cT.r,cT.g,cT.b)}}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));g.computeVertexNormals();return g}
 const LEAF={
  1:makeLeaf([0],[1]),
  3:makeLeaf([-38,0,38],[.72,1,.72]),
  5:makeLeaf([-62,-32,0,32,62],[.5,.82,1,.82,.5]),
  7:makeLeaf([-82,-54,-27,0,27,54,82],[.36,.62,.86,1,.86,.62,.36]),
  9:makeLeaf([-96,-70,-47,-24,0,24,47,70,96],[.28,.45,.66,.86,1,.86,.66,.45,.28])};
 const cotShape=new THREE.Shape();cotShape.absellipse(.26,0,.26,.15,0,Math.PI*2,false,0);
 const cotGeo=(function(){const g=new THREE.ShapeGeometry(cotShape,16).toNonIndexed(),p=g.attributes.position.array,pos=[],col=[];
  for(let v=0;v<p.length;v+=3){pos.push(p[v],Math.abs(p[v+1])*.5,-p[v+1]);col.push(.42,.7,.3)}
  const o=new THREE.BufferGeometry();o.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));o.setAttribute('color',new THREE.Float32BufferAttribute(col,3));o.computeVertexNormals();return o})();
 const stemMat=new THREE.MeshStandardMaterial({color:0x4f8a35,roughness:.7});
 const potMat=new THREE.MeshStandardMaterial({color:0x9a5236,roughness:.9});
 const colaMat=new THREE.MeshStandardMaterial({color:0x8fc23f,roughness:.85});
 const pistilMat=new THREE.MeshStandardMaterial({color:0xff8a3d,roughness:.6,emissive:0x5a2000,emissiveIntensity:.5});
 const cyl=new THREE.CylinderGeometry(1,1,1,7),sph=new THREE.SphereGeometry(1,10,8),cn=new THREE.ConeGeometry(.5,1.6,5);
 const UP=new THREE.Vector3(0,1,0),recs=new Map();

 function seg(parent,a,b,r){const d=new THREE.Vector3().subVectors(b,a),len=d.length();if(len<1e-4)return;
  const m=new THREE.Mesh(cyl,stemMat);m.scale.set(r,len,r);m.position.copy(a).addScaledVector(d,.5);m.quaternion.setFromUnitVectors(UP,d.normalize());m.castShadow=true;parent.add(m)}
 function addCola(parent,x,y,z,sz,r){const g=new THREE.Group();g.position.set(x,y,z);
  const core=new THREE.Mesh(sph,colaMat);core.scale.set(.11*sz,.34*sz,.11*sz);core.position.y=.2*sz;core.castShadow=true;g.add(core);
  for(let i=0;i<7;i++){const a=i*.9+r()*2,b=new THREE.Mesh(sph,colaMat);b.scale.setScalar(.075*sz);b.position.set(Math.cos(a)*.085*sz,(.03+r()*.36)*sz,Math.sin(a)*.085*sz);g.add(b)}
  for(let i=0;i<8;i++){const a=i*.8+r()*2,c=new THREE.Mesh(cn,pistilMat);c.scale.set(.05*sz,.07*sz,.05*sz);c.position.set(Math.cos(a)*.12*sz,(.04+r()*.34)*sz,Math.sin(a)*.12*sz);c.rotation.set(Math.sin(a)*.9,0,-Math.cos(a)*.9);g.add(c)}
  parent.add(g)}
 const CNT=[0,1,3,5,7,7,9,9,9,9,9,9,7,7,7];
 /* modelos 3D reales (glb embebidos): autos, dealer, mesa, porro, planta, pasto y campo */
 const MOD={ready:false,t:{},P:{},pl:[],pot:null};
 /* los modelos se arman de a uno para no trabar la app al abrirla */
 function modelsLoad(){
  if(!window.MODELS||!THREE.GLTFLoader)return;
  const ld=new THREE.GLTFLoader(),names=Object.keys(window.MODELS);let i=0;
  const next=()=>setTimeout(step,20);
  const step=()=>{
   if(i>=names.length){window.MODELS=null;try{modelsReady()}catch(e){console.warn('modelos',e)}return}
   const n=names[i++],d=window.MODELS[n];window.MODELS[n]=null;
   try{const b=atob(d),u=new Uint8Array(b.length);for(let k=0;k<b.length;k++)u[k]=b.charCodeAt(k);
    ld.parse(u.buffer,'',g=>{MOD.t[n]=g.scene;next()},()=>next())}catch(e){next()}};
  setTimeout(step,600)}
 function buildFoliage(rec){
  const p=rec.p,a=ageNow(p),s=seedOf(p);
  while(rec.fol.children.length)rec.fol.remove(rec.fol.children[0]);
  rec.sway.length=0;
  const h=heightU(p,a),n=clamp(Math.round(2+Math.min(a,75)/5.2),2,15),dr=droopOf(p),r=rng(hash(p.id)),ph0=hash(p.id)%7;
  const tint=clamp(dr/.7,0,1);rec.leafMat.color.setRGB(1,1-.1*tint,1-.55*tint);
  if(MOD.ok){const mdl=MOD.pl[Math.round(tint*3)].clone(true),hs=Math.max(.3,h*1.12);mdl.scale.setScalar(hs);mdl.rotation.y=hash(p.id)%628/100;rec.fol.add(mdl);rec.sway.push({g:mdl,b:0,ph:hash(p.id)%7,a:.05});
   rec.hit.scale.set(1.15,Math.max(1,(h+rec.Hh+.5)/3.4),1.15);rec.hit.position.y=1.7*rec.hit.scale.y;return}
  const R0=.018+.05*gcurve(a)*(s.H/1.6);
  const ys=[];for(let k=0;k<n;k++)ys.push(h*(.12+.88*Math.pow(n>1?k/(n-1):1,1.1)));
  const wob=y=>new THREE.Vector3(Math.sin(y*2.1+ph0)*.05*(y/h)+dr*.3*Math.pow(y/h,2),y,Math.cos(y*1.7+ph0)*.04*(y/h));
  const P=[wob(0)];ys.forEach(y=>P.push(wob(y)));if(ys[n-1]<h-.001)P.push(wob(h));
  for(let i=0;i<P.length-1;i++){const f=P[i].y/h;seg(rec.fol,P[i],P[i+1],R0*(1-.62*f))}
  const addLeaf=(pos,geo,size,yaw,pitch,dd,pet,tF)=>{
   const pv=new THREE.Group();pv.position.copy(pos);pv.rotation.y=yaw;pv.rotation.z=pitch-dd*1.2;
   if(pet>0){const pe=new THREE.Mesh(cyl,stemMat);pe.scale.set(.012+.01*size,pet,.012+.01*size);pe.rotation.z=Math.PI/2;pe.position.x=pet/2;pv.add(pe)}
   const lf=new THREE.Mesh(geo,rec.leafMat);lf.position.x=pet;lf.scale.setScalar(size);lf.rotation.z=-.1-dd*.5;lf.castShadow=true;pv.add(lf);
   rec.fol.add(pv);rec.sway.push({g:pv,b:pv.rotation.z,ph:r()*6.28,a:.03+.05*(1-tF)})};
  const base=.3+.62*sstep(0,38,a);
  for(let k=0;k<n;k++){
   const tF=n>1?k/(n-1):0,pos=P[k+1],nodeAge=a-Math.max(0,k-1)*5.2,gk=.25+.75*sstep(0,16,nodeAge);
   const size=base*(1-.6*Math.pow(tF,1.5))*s.sc*gk;
   if(k===0){const cs=.3*(1-.35*sstep(10,30,a));[0,Math.PI].forEach(yaw=>addLeaf(pos,cotGeo,cs,yaw,.12,dr*.5,0,.3));continue}
   let cnt=Math.min(CNT[k]||7,k>=n-2?5:9);if(k===n-1&&n>6)cnt=3;if(k===1)cnt=1;
   const pitch=lerp(-.12,.5,tF),pet=.14*size+.06,yaw0=k<=5?k*Math.PI/2+k*.2:k*2.399;
   addLeaf(pos,LEAF[cnt],size,yaw0,pitch,dr,pet,tF);
   if(k<=5&&k<n-1)addLeaf(pos,LEAF[cnt],size,yaw0+Math.PI,pitch,dr,pet,tF);
   if(k>=3&&k<=n-3&&k%2===1&&a>24){const L=.45*h*(1-tF)*.6+.12,yaw=yaw0+1.2,dir=new THREE.Vector3(Math.cos(yaw),.55,-Math.sin(yaw)).normalize(),end=pos.clone().addScaledVector(dir,L);
    seg(rec.fol,pos,end,R0*.45);const bs=size*.55;addLeaf(end,LEAF[5],bs,yaw+.5,.2,dr,.05,tF);addLeaf(end,LEAF[5],bs,yaw-.5,.2,dr,.05,tF)}
  }
  rec.hit.scale.set(1.15,Math.max(1,(h+rec.Hh+.5)/3.4),1.15);rec.hit.position.y=1.7*rec.hit.scale.y;
  const cs=colaSize(p);
  if(cs>.02){const top=P[P.length-1];addCola(rec.fol,top.x,top.y,top.z,.5+1.6*cs,r);
   for(let k=Math.max(2,n-5);k<n-1;k++){const y=ys[k],yaw=k*2.1,L=.22+.3*cs;addCola(rec.fol,P[k+1].x+Math.cos(yaw)*L,y+.1,P[k+1].z-Math.sin(yaw)*L,(.3+.9*cs)*(1-.12*(n-k)),r)}}
 }
 function makeRecord(p,slot){
  const g=new THREE.Group();g.position.set(SLOTS[slot][0],TRAY,SLOTS[slot][1]);
  const R=.26+.085*Math.sqrt(p.pot),Hh=R*1.15;
  const pot=new THREE.Mesh(new THREE.CylinderGeometry(R,R*.84,Hh,32),potMat);pot.position.y=Hh/2;pot.castShadow=true;pot.receiveShadow=true;g.add(pot);
  const lip=new THREE.Mesh(new THREE.TorusGeometry(R,.03,8,32),potMat);lip.rotation.x=Math.PI/2;lip.position.y=Hh;g.add(lip);
  const soilMat=new THREE.MeshStandardMaterial({color:0x3b2a20,roughness:1});
  const soil=new THREE.Mesh(new THREE.CircleGeometry(R*.96,32),soilMat);soil.rotation.x=-Math.PI/2;soil.position.y=Hh-.015;g.add(soil);
  const fol=new THREE.Group();fol.position.y=Hh;g.add(fol);
  const hit=new THREE.Mesh(new THREE.CylinderGeometry(1.1,1.1,3.4,12),new THREE.MeshBasicMaterial({visible:false}));hit.position.y=1.7;hit.userData.pid=p.id;g.add(hit);
  const gaugeMat=new THREE.MeshBasicMaterial({color:0x5aa0ff});
  const gt=new THREE.Mesh(new THREE.CylinderGeometry(.075,.075,1.25,12,1,true),gaugeGlass);gt.position.set(R+.45,.63,0);g.add(gt);
  const gf=new THREE.Mesh(new THREE.CylinderGeometry(.055,.055,1.2,12),gaugeMat);gf.geometry.translate(0,.6,0);gf.position.set(R+.45,.02,0);g.add(gf);
  const leafMat=new THREE.MeshStandardMaterial({vertexColors:true,side:THREE.DoubleSide,roughness:.55});
  const rec={p:p,group:g,fol:fol,soilMat:soilMat,leafMat:leafMat,sway:[],R:R,Hh:Hh,slot:slot,spawn:0,splash:0,ph:r6(p.id),hit:hit,gauge:gf,gaugeMat:gaugeMat};
  roomG.add(g);recs.set(p.id,rec);buildFoliage(rec);return rec}
 const r6=id=>(hash(id)%628)/100;

 /* sincronizar con el estado */
 G.sync=function(){ensurePlacement();
  const vis=new Set(S.plants.filter(p=>p.room===S.room));
  recs.forEach((rec,id)=>{if(!vis.has(rec.p)||rec.slot!==rec.p.slot){roomG.remove(rec.group);recs.delete(id);disposeUnused(rec.group)}});
  vis.forEach(p=>{if(Array.from(recs.values()).some(x=>x.p===p))return;
   const rec=makeRecord(p,p.slot);rec.spawn=.001;rec.delay=firstSync?.25+p.slot*.12:0});firstSync=false;plateSync()};
 G.slot=id=>{const r=recs.get(id);return r?r.slot:-1};
 let firstSync=true;
 let dirty=true,lastBuild=0;
 G.rebuild=()=>{dirty=true};
 G.height=id=>{const r=recs.get(id);return r?r.Hh+heightU(r.p):0};
 /* cámara: orbital (afuera y vista desde afuera del invernadero) o en primera persona (desde la puerta y frente a cada planta) */
 const GEN={tx:0,ty:3,tz:2,th:0,ph:.92,d:92};
 const cam=Object.assign({},GEN),cur=Object.assign({},cam);let idle=0,drag=null;
 G.camMode='general';
 const wrapPi=a=>{a=(a+Math.PI)%(2*Math.PI);if(a<0)a+=2*Math.PI;return a-Math.PI};
 const DOORP={x:0,y:4.9,z:RD/2-1.1,yaw:0,pitch:-.17,fov:68};
 const fp=Object.assign({zoom:1},DOORP),fc=Object.assign({},DOORP),lk={y:0,p:0},lkc={y:0,p:0};let mv=null;
 const isFP=()=>G.camMode==='door'||G.camMode==='walk';
 G.camState=()=>({mode:G.camMode,tx:cam.tx,tz:cam.tz,ty:cam.ty,d:cam.d,th:cam.th,ph:cam.ph,yaw:fp.yaw,pitch:fp.pitch,fx:fp.x,fy:fp.y,fz:fp.z,cx:camera.position.x,cy:camera.position.y,cz:camera.position.z,fov:camera.fov,moving:!!mv,world:worldG.visible,ly:lk.y,lp:lk.p,zoom:fp.zoom});
 /* recorrido: se camina por los pasillos laterales y por el hall de la puerta para no atravesar las mesas */
 function route(a,b){if(Math.abs(a[0]-b[0])<.05)return[b];
  if(a[1]>=HALL-.05)return[[b[0],a[1]],b];if(b[1]>=HALL-.05)return[[a[0],b[1]],b];return[[a[0],HALL],[b[0],HALL],b]}
 function fpGo(pose,snap){
  Object.assign(fp,pose);fp.zoom=1;lk.y=lk.p=0;
  if(snap){Object.assign(fc,{x:fp.x,y:fp.y,z:fp.z,yaw:fp.yaw,pitch:fp.pitch,fov:fp.fov});lkc.y=lkc.p=0;mv=null;return}
  const all=[[fc.x,fc.z]].concat(route([fc.x,fc.z],[fp.x,fp.z])),cum=[0];let L=0;
  for(let i=1;i<all.length;i++){L+=Math.hypot(all[i][0]-all[i-1][0],all[i][1]-all[i-1][1]);cum.push(L)}
  mv={all:all,cum:cum,L:L,t:0,T:clamp(L/13,.55,1.6),y0:fc.y,p0:fc.pitch,yaw0:fc.yaw,yawT:fc.yaw+wrapPi(fp.yaw-fc.yaw)}}
 function updWorld(){worldG.visible=!(where==='room'&&isFP());roomOutG.visible=where==='room'&&!isFP()}
 const fovOrbit=()=>paisaje?40:27;
 function useOrbitCam(){const f=fovOrbit();if(camera.fov!==f){camera.fov=f;camera.updateProjectionMatrix()}}
 G.door=snap=>{const sn=!!snap||G.camMode==='general'||G.camMode==='campus';G.camMode='door';fpGo(DOORP,sn);updWorld();if(G.onMode)G.onMode()};
 G.outside=()=>{G.camMode='general';Object.assign(cam,GEN);Object.assign(cur,GEN);updWorld();useOrbitCam();idle=0;if(G.onMode)G.onMode()};
 G.overview=()=>{G.outside()};
 G.setMode=m=>{if(m==='general')G.outside();else if(m==='door')G.door()};
 function stationPose(r){const h=heightU(r.p),px=SLOTS[r.slot][0],pz=SLOTS[r.slot][1],col=px<-3?0:px>3?2:1;
  const cx=col===2?AIS:-AIS,ty=TRAY+r.Hh+h*.5,ey=clamp(TRAY+r.Hh+h*.55+.9,2.9,5.2);
  return{x:cx,y:ey,z:pz,yaw:col===0?Math.PI/2:-Math.PI/2,pitch:Math.atan2(ty-ey,Math.abs(px-cx)),fov:58}}
 G.focus=(id,snap)=>{const r=recs.get(id);if(!r)return;
  if(G.camMode==='general'){const h=heightU(r.p);cam.tx=r.group.position.x;cam.tz=r.group.position.z;cam.ty=TRAY+h*.5+1;cam.d=Math.min(cam.d,26);if(G.onMode)G.onMode();return}
  G.camMode='walk';fpGo(stationPose(r),!!snap);updWorld();if(G.onMode)G.onMode()};
 G.resize=function(){const rc=canvas.getBoundingClientRect(),w=Math.max(2,Math.round(rc.width)),h=Math.max(2,Math.round(rc.height));CV.l=rc.left;CV.t=rc.top;CV.w=w;CV.h=h;renderer.setSize(w,h,false);camera.aspect=w/h;if(G.where==='campus'&&G.camMode==='campus'&&!G.zooming)Object.assign(cam,campCam());
  if(w<=900&&S.view==='stage')camera.setViewOffset(w,h,0,Math.round(h*.24),w,h);else camera.clearViewOffset();camera.updateProjectionMatrix()};
 function applyPR(){renderer.setPixelRatio(Math.max(.6,prBase*prAuto));G.resize();shadowDirty()}
 G.setQuality=function(q){qCur=q;prAuto=1;prBase=q==='baja'?1:Math.min(devicePixelRatio||1,q==='media'?1.1:1.35);renderer.setPixelRatio(prBase);daySun.castShadow=q!=='baja';daySun.shadow.mapSize.set(q==='alta'?2048:1024,q==='alta'?2048:1024);if(daySun.shadow.map){daySun.shadow.map.dispose();daySun.shadow.map=null}sun.castShadow=q!=='baja';sun.shadow.mapSize.set(q==='alta'?1024:512,q==='alta'?1024:512);if(sun.shadow.map){sun.shadow.map.dispose();sun.shadow.map=null}sun.shadow.autoUpdate=false;shadowDirty();G.resize()};
 G.project=function(id,dy){const r=recs.get(id);if(!r)return null;const v=new THREE.Vector3(r.group.position.x,TRAY+r.Hh+heightU(r.p)+(dy||.5),r.group.position.z).project(camera);
  return{x:CV.l+(v.x*.5+.5)*CV.w,y:CV.t+(-v.y*.5+.5)*CV.h,ok:v.z<1}};
 /* riego */
 const drops=[],dropGeo=new THREE.SphereGeometry(.035,6,6),dropMat=new THREE.MeshStandardMaterial({color:0x6fb6ff,transparent:true,opacity:.85,roughness:.2});
 G.water=function(id){const r=recs.get(id);if(!r)return;const y0=TRAY+r.Hh+heightU(r.p)+1.1,rr=rng(Date.now()&0xffff);
  for(let i=0;i<46;i++){const m=new THREE.Mesh(dropGeo,dropMat);m.position.set(r.group.position.x+(rr()-.5)*r.R*1.7,y0+rr()*.9,r.group.position.z+(rr()-.5)*r.R*1.7);m.userData={vy:0,delay:rr()*.55,rec:r};roomG.add(m);drops.push(m)}};
 /* foto de ejemplo */
 G.snap=function(id){const r=recs.get(id);if(!r)return null;
  const vis=[],bg=scene.background,fv0=camera.fov;let tmp=null;
  const lint=[];scene.traverse(o=>{if(o.isLight&&o!==hemi){lint.push([o,o.intensity]);o.intensity=0}});
  const restore=()=>{vis.forEach(v=>{v[0].visible=v[1]});lint.forEach(l=>{l[0].intensity=l[1]});scene.background=bg;camera.fov=fv0;if(tmp){scene.remove(tmp);tmp=null}};
  try{const W=800,H=600,pr=renderer.getPixelRatio();renderer.setPixelRatio(1);renderer.setSize(W,H,false);camera.clearViewOffset();camera.fov=40;camera.aspect=W/H;camera.updateProjectionMatrix();
   const hh=heightU(r.p),px=r.group.position.x,pz=r.group.position.z,sv=camera.position.clone(),sq=camera.quaternion.clone();
   const hide=o=>{vis.push([o,o.visible]);o.visible=false},recG=new Set(Array.from(recs.values()).map(x=>x.group));
   hide(campG);hide(worldG);vis.push([roomG,roomG.visible]);roomG.visible=true;
   roomG.children.forEach(c=>{if(!c.isLight&&!recG.has(c))hide(c)});
   recs.forEach(o=>{if(o!==r)hide(o.group)});
   roomG.children.forEach(c=>{if(c.isLight)hide(c)});
   tmp=new THREE.DirectionalLight(0xffffff,1.15);tmp.position.set(3,9,7);scene.add(tmp);daySun.shadow.needsUpdate=true;sun.shadow.needsUpdate=true;
   scene.background=new THREE.Color(S.day?0xeee9db:0x0c120e);
   const d=2.4+hh*1.7,ty=TRAY+r.Hh+hh*.5+.1;
   camera.position.set(px+d*.5,ty+.2+hh*.12,pz+d*.86);camera.lookAt(px,ty,pz);ring.visible=false;
   renderer.render(scene,camera);const url=canvas.toDataURL('image/jpeg',.88);
   ring.visible=true;camera.position.copy(sv);camera.quaternion.copy(sq);renderer.setPixelRatio(pr);
   restore();G.resize();shadowDirty();return url}
  catch(e){restore();ring.visible=true;G.resize();shadowDirty();return null}};
 const sph8=new THREE.SphereGeometry(1,8,6);
 /* mundo: cielo de día con sol, pasto, colinas, plantaciones de cannabis al aire libre y construcciones rurales */
 const worldG=new THREE.Group();scene.add(worldG);
 const C=h=>new THREE.Color(h).convertSRGBToLinear(),gam=v=>Math.pow(v,2.2),mx=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];
 const glowTex=(function(){const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d'),g=x.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.35,'rgba(255,255,255,.35)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,128,128);return new THREE.CanvasTexture(c)})();
 const GLN='float h21(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h21(i),h21(i+vec2(1.,0.)),f.x),mix(h21(i+vec2(0.,1.)),h21(i+vec2(1.,1.)),f.x),f.y);}float fbm(vec2 p){float a=.5,s=0.;for(int i=0;i<4;i++){s+=a*vn(p);p=p*2.03+7.1;a*=.5;}return s;}';
 const SUN=new THREE.Vector3(-.5,.6,.62).normalize();
 const wU={uT:{value:0},uSun:{value:SUN.clone()}};
 const sky=new THREE.Mesh(new THREE.SphereGeometry(148,32,16),new THREE.ShaderMaterial({uniforms:wU,side:THREE.BackSide,depthWrite:false,fog:false,
  vertexShader:'varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:'varying vec3 vP;uniform float uT;uniform vec3 uSun;'+GLN+`
void main(){vec3 d=normalize(vP);float h=d.y;
 vec3 zen=vec3(.30,.52,.72),hor=vec3(.88,.88,.80);
 vec3 c=mix(hor,zen,pow(clamp(h,0.,1.),.5));
 c=mix(c,hor,smoothstep(0.,-.35,h));
 float sd=max(dot(d,normalize(uSun)),0.);
 c+=vec3(1.,.84,.58)*(pow(sd,6.)*.18+pow(sd,48.)*.3);
 vec2 q=d.xz/(h+.32);float n=fbm(q*.75+vec2(uT*.008,3.));float cl=smoothstep(.5,.88,n)*smoothstep(.03,.32,h)*(1.-smoothstep(.62,1.,h));
 vec3 cc=mix(vec3(.88,.89,.86),vec3(1.,.99,.96),smoothstep(.45,.95,fbm(q*1.7+4.)));
 c=mix(c,cc,cl*.9);
 c=mix(c,vec3(1.,.98,.9),smoothstep(.9985,.9992,sd));
 gl_FragColor=vec4(c,1.);}`}));
 sky.renderOrder=-2;sky.frustumCulled=false;worldG.add(sky);
 scene.fog=new THREE.FogExp2(C(0xE6E4D6).getHex(),.0030);
 const fogDia=new THREE.Color(C(0xE6E4D6)),fogNoche=new THREE.Color(C(0x10202c));
 const rg=rng(9);
 function canTex(draw,sz,rep){const c=document.createElement('canvas');c.width=c.height=sz;draw(c.getContext('2d'),sz);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.encoding=THREE.sRGBEncoding;t.anisotropy=8;t.repeat.set(rep[0],rep[1]);return t}
 const grassTex=canTex((x,n)=>{x.fillStyle='#6b8f52';x.fillRect(0,0,n,n);
  for(let i=0;i<70;i++){x.fillStyle='rgba('+(70+rg()*30|0)+','+(120+rg()*40|0)+',40,.13)';x.beginPath();x.arc(rg()*n,rg()*n,14+rg()*50,0,6.3);x.fill()}
  for(let i=0;i<9000;i++){const g=100+rg()*90|0;x.fillStyle='rgba('+(g*.55|0)+','+g+','+(g*.3|0)+','+(.25+rg()*.4)+')';x.fillRect(rg()*n,rg()*n,1,2+rg()*3)}},512,[85,85]);
 const concTex=()=>canTex((x,n)=>{x.fillStyle='#b6b3ab';x.fillRect(0,0,n,n);
  for(let i=0;i<5000;i++){const v=150+Math.floor(rg()*60);x.fillStyle='rgba('+v+','+v+','+(v-6)+','+(.12+rg()*.22)+')';x.fillRect(rg()*n,rg()*n,1+rg()*2,1+rg()*2)}
  x.strokeStyle='rgba(80,78,72,.55)';x.lineWidth=3;x.strokeRect(0,0,n,n)},256,[4,5]);
 const brickTex=canTex((x,n)=>{x.fillStyle='#6e3a2c';x.fillRect(0,0,n,n);const bw=n/4,bh=n/8;
  for(let r=0;r<8;r++)for(let c=-1;c<5;c++){const v=Math.floor(rg()*34);x.fillStyle='rgb('+(156+v)+','+(76+v/2)+','+(54+v/3)+')';x.fillRect(c*bw+(r%2)*bw/2+2,r*bh+2,bw-4,bh-4)}},256,[1,1]);
 const brickMat=(w,h,tw,th)=>{const t=brickTex.clone();t.needsUpdate=true;t.repeat.set(Math.max(1,w/tw),Math.max(1,h/th));return new THREE.MeshStandardMaterial({map:t,roughness:.85})};
 const ground=new THREE.Mesh(new THREE.CircleGeometry(148,72),new THREE.MeshStandardMaterial({map:grassTex,roughness:1,metalness:0}));
 ground.material.color.setScalar(.82);ground.rotation.x=-Math.PI/2;ground.renderOrder=-1;ground.receiveShadow=true;worldG.add(ground);
 const hillsG=new THREE.Group();worldG.add(hillsG);
 const hillM=new THREE.MeshStandardMaterial({color:C(0x6f9456),roughness:1}),rh=rng(31);
 for(let i=0;i<30;i++){const a=i/30*6.283+rh()*.2,r=118+rh()*16,s=20+rh()*26,hh=5+rh()*9,m=new THREE.Mesh(new THREE.SphereGeometry(1,14,8),hillM);m.scale.set(s,hh,s*(.7+rh()*.5));m.position.set(Math.cos(a)*r,-1,Math.sin(a)*r);m.rotation.y=rh()*6;hillsG.add(m)}
 /* luz del sol */
 const dayHemi=new THREE.HemisphereLight(0xe7ecdd,0x8a9a6c,.8),daySun=new THREE.DirectionalLight(0xfff3dd,1.75);scene.add(dayHemi);scene.add(daySun);scene.add(daySun.target);
 daySun.castShadow=true;daySun.shadow.mapSize.set(2048,2048);daySun.shadow.bias=-.0005;daySun.shadow.normalBias=.06;daySun.shadow.autoUpdate=false;
 let shNeed=3,prBase=1.5,prAuto=1,qCur='alta';
 function shadowDirty(){shNeed=3}
 G.shadowDirty=shadowDirty;
 function sunFit(cx,cz,half){daySun.target.position.set(cx,0,cz);daySun.position.copy(SUN).multiplyScalar(80).add(daySun.target.position);const s=daySun.shadow.camera;s.left=-half;s.right=half;s.top=half;s.bottom=-half;s.near=10;s.far=170;s.updateProjectionMatrix()}
 sunFit(0,0,26);
 const envG=new THREE.Group();worldG.add(envG);const ENVS=2.8;
 /* geometrías de poca resolución con colores por vértice */
 function GBld(){const P=[],N=[],K=[];
  return{tri(a,b,c,ca,cb,cc){cb=cb||ca;cc=cc||ca;const ux=b[0]-a[0],uy=b[1]-a[1],uz=b[2]-a[2],vx=c[0]-a[0],vy=c[1]-a[1],vz=c[2]-a[2];let nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx;const l=Math.hypot(nx,ny,nz)||1;nx/=l;ny/=l;nz/=l;
   P.push(a[0],a[1],a[2],b[0],b[1],b[2],c[0],c[1],c[2]);for(let i=0;i<3;i++)N.push(nx,ny,nz);[ca,cb,cc].forEach(q=>K.push(q[0],q[1],q[2]))},
   geo(){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(N,3));g.setAttribute('color',new THREE.Float32BufferAttribute(K,3));return g}}}
 /* cannabis de exterior: hojas palmeadas en verticilos, cogollos en la punta y en las ramas */
 function fieldPlant(kind){const B=GBld(),H=[1.5,2.15,2.4][kind],c0=[[.07,.24,.03],[.035,.16,.025],[.04,.15,.025]][kind],c1=[[.2,.5,.07],[.1,.34,.05],[.12,.3,.05]][kind];
  const leaf=(bx,by,bz,th,ph,L)=>{const ang=[0,.55,-.55,1.1,-1.1],len=[1,.88,.88,.62,.62];
   const xf=(x,y,z)=>{const x1=x*Math.cos(ph)-y*Math.sin(ph),y1=x*Math.sin(ph)+y*Math.cos(ph);return[bx+x1*Math.cos(th)+z*Math.sin(th),by+y1,bz-x1*Math.sin(th)+z*Math.cos(th)]};
   for(let i=0;i<5;i++){const l=L*len[i],w=l*.21,dx=Math.cos(ang[i]),dz=Math.sin(ang[i]),px=-dz,pz=dx,cm=mx(c0,c1,.5);
    const p0=xf(0,0,0),m1=xf(dx*l*.45+px*w,0,dz*l*.45+pz*w),m2=xf(dx*l*.45-px*w,0,dz*l*.45-pz*w),tp=xf(dx*l,-.02*l,dz*l);
    B.tri(p0,m1,m2,c0,cm,cm);B.tri(m1,tp,m2,cm,c1,cm)}};
  const stem=(y0,y1,r0,r1,c)=>{for(let i=0;i<4;i++){const a0=i*Math.PI/2,a1=(i+1)*Math.PI/2,p=(a,r,y)=>[Math.cos(a)*r,y,Math.sin(a)*r];B.tri(p(a0,r0,y0),p(a1,r0,y0),p(a1,r1,y1),c);B.tri(p(a0,r0,y0),p(a1,r1,y1),p(a0,r1,y1),c)}};
  const cola=(cx,cy,cz,r,hc,cb,ct)=>{for(let i=0;i<6;i++){const a0=i*1.0472,a1=(i+1)*1.0472;B.tri([cx+Math.cos(a0)*r,cy,cz+Math.sin(a0)*r],[cx+Math.cos(a1)*r,cy,cz+Math.sin(a1)*r],[cx,cy+hc,cz],cb,cb,ct)}};
  stem(0,H*.9,.055,.025,[.3,.24,.12]);
  const W=kind===0?3:4;
  for(let w=0;w<W;w++){const f=w/(W-1),y=H*(.22+.64*f),L=H*(.56-.24*f)*(kind===0?.8:1);
   for(let i=0;i<5;i++)leaf(0,y,0,i*1.2566+w*.63,-.38+.55*f,L)}
  if(kind>=1){const big=kind===2,cb=big?[.2,.34,.07]:[.15,.28,.06],ct=big?[.7,.3,.06]:[.4,.4,.1];
   cola(0,H*.86,0,big?.2:.12,big?.75:.4,cb,ct);
   if(big)for(let i=0;i<6;i++){const a=i*1.047+.3,rr=.42+.1*(i%2),y=H*(.5+.12*(i%3));cola(Math.cos(a)*rr,y,Math.sin(a)*rr,.1,.42,cb,ct)}
   else for(let i=0;i<3;i++){const a=i*2.1,y=H*(.62+.1*i);cola(Math.cos(a)*.3,y,Math.sin(a)*.3,.07,.25,cb,ct)}}
  return B.geo()}
 function farPlant(){const B=GBld(),star=(y,R,cc,ct)=>{const cen=[0,y+.12*R,0];for(let i=0;i<8;i++){const a0=i*Math.PI/4,a1=(i+1)*Math.PI/4,am=a0+Math.PI/8,t0=[Math.cos(a0)*R,y-.14*R,Math.sin(a0)*R],t1=[Math.cos(a1)*R,y-.14*R,Math.sin(a1)*R],md=[Math.cos(am)*R*.4,y+.06*R,Math.sin(am)*R*.4];B.tri(cen,t0,md,cc,ct,cc);B.tri(cen,md,t1,cc,cc,ct)}};
  star(.45,1.0,[.03,.12,.02],[.1,.32,.05]);star(.95,.95,[.035,.14,.025],[.11,.34,.05]);star(1.45,.74,[.04,.16,.03],[.12,.36,.06]);star(1.9,.5,[.05,.18,.03],[.13,.38,.06]);
  for(let i=0;i<6;i++){const a0=i*1.0472,a1=(i+1)*1.0472,r=.14;B.tri([Math.cos(a0)*r,2.0,Math.sin(a0)*r],[Math.cos(a1)*r,2.0,Math.sin(a1)*r],[0,2.7,0],[.2,.32,.07],[.2,.32,.07],[.6,.3,.06])}return B.geo()}
 const mPl=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.85,side:THREE.DoubleSide});
 const mkInst=(geo,cap)=>{const m=new THREE.InstancedMesh(geo,mPl,cap);m.instanceColor=new THREE.InstancedBufferAttribute(new Float32Array(cap*3).fill(1),3);m.frustumCulled=false;m.count=0;envG.add(m);return m};
 const NEAR=[0,1,2].map(k=>mkInst(fieldPlant(k),1500)),FAR=mkInst(farPlant(),7500);
 const mBed=new THREE.MeshStandardMaterial({color:C(0x4b3426),roughness:1}),mPlot=new THREE.MeshStandardMaterial({color:C(0x8a7254),roughness:1});
 const BEDS=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),mBed,2600),PLOTS=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),mPlot,420);
 [BEDS,PLOTS].forEach(m=>{m.frustumCulled=false;m.count=0;m.receiveShadow=true;envG.add(m)});
 const RIBS=new THREE.InstancedMesh(new THREE.TorusGeometry(2.8,.045,4,18),new THREE.MeshStandardMaterial({color:C(0xd8dde2),roughness:.5,metalness:.4}),260);RIBS.frustumCulled=false;RIBS.count=0;envG.add(RIBS);
 const tunG=new THREE.CylinderGeometry(2.8,2.8,15.6,18,1,true),tunM=new THREE.MeshStandardMaterial({color:0xffffff,transparent:true,opacity:.34,roughness:.2,side:THREE.DoubleSide,depthWrite:false});
 tunG.rotateX(Math.PI/2);
 const tunnels=[];for(let i=0;i<22;i++){const m=new THREE.Mesh(tunG,tunM);m.visible=false;envG.add(m);tunnels.push(m)}
 /* carteles y cosas del campo */
 const props=[],RES=[{x0:-2.4,x1:2.4,z0:9,z1:400}];
 const addProp=(o,x,z,hw,hd,res)=>{o.position.set(x,0,z);envG.add(o);props.push({o:o,x0:x-hw,x1:x+hw,z0:z-hd,z1:z+hd});if(res!==false)RES.push({x0:x-hw-1,x1:x+hw+1,z0:z-hd-1,z1:z+hd+1});return o};
 const M3=(o)=>new THREE.MeshStandardMaterial(o);
 const mRed=M3({color:C(0x9b2f25),roughness:.8}),mWhiteP=M3({color:C(0xece7dc),roughness:.7}),mRoofD=M3({color:C(0x4a4f56),roughness:.6,metalness:.3}),mMetal=M3({color:C(0xb4bcc4),roughness:.45,metalness:.5}),
  mBlue=M3({color:C(0x2f5d8c),roughness:.5,metalness:.3}),mWood=M3({color:C(0x8a6a44),roughness:.9}),mHay=M3({color:C(0xd3b25a),roughness:1}),mCont=M3({color:C(0x2f6a4f),roughness:.6,metalness:.2}),
  mTire=M3({color:C(0x1c1d20),roughness:.9}),mGlD=M3({color:C(0x2a3a4a),roughness:.15,metalness:.3}),mBarB=M3({color:C(0x2b5fa8),roughness:.5,metalness:.2}),mBarW=M3({color:C(0xe4e6e8),roughness:.5}),mBag=M3({color:C(0xeeeeee),roughness:.9}),mGreenP=M3({color:C(0x4f8a3a),roughness:1});
 /* geometrías compartidas: evita crear cientos de buffers nuevos por invernadero */
 const _gc={};
 const cBox=(w,h,d)=>_gc['b'+w+'|'+h+'|'+d]||(_gc['b'+w+'|'+h+'|'+d]=new THREE.BoxGeometry(w,h,d));
 const cCyl=(a,b,h,sg)=>_gc['c'+a+'|'+b+'|'+h+'|'+sg]||(_gc['c'+a+'|'+b+'|'+h+'|'+sg]=new THREE.CylinderGeometry(a,b,h,sg));
 const cSph=(r,w,h)=>_gc['s'+r+'|'+w+'|'+h]||(_gc['s'+r+'|'+w+'|'+h]=new THREE.SphereGeometry(r,w,h));
 const cPla=(w,h)=>_gc['p'+w+'|'+h]||(_gc['p'+w+'|'+h]=new THREE.PlaneGeometry(w,h));
 const cTor=(r,t,a,b,arc)=>_gc['t'+r+'|'+t+'|'+a+'|'+b+'|'+arc]||(_gc['t'+r+'|'+t+'|'+a+'|'+b+'|'+arc]=arc?new THREE.TorusGeometry(r,t,a,b,arc):new THREE.TorusGeometry(r,t,a,b));
 const cCir=(r,sg,a0,al)=>_gc['r'+r+'|'+sg+'|'+a0+'|'+al]||(_gc['r'+r+'|'+sg+'|'+a0+'|'+al]=al?new THREE.CircleGeometry(r,sg,a0,al):new THREE.CircleGeometry(r,sg));
 const bxm=(p,w,h,d,mat,x,y,z,rx,ry,rz)=>{const m=new THREE.Mesh(cBox(w,h,d),mat);m.position.set(x,y,z);if(rx||ry||rz)m.rotation.set(rx||0,ry||0,rz||0);p.add(m);return m};
 const cym=(p,r,h,mat,x,y,z,rx,rz,seg)=>{const m=new THREE.Mesh(cCyl(r,r,h,seg||14),mat);m.position.set(x,y,z);if(rx||rz)m.rotation.set(rx||0,0,rz||0);p.add(m);return m};
 {/* granero rojo con techo a la holandesa */
  const g=new THREE.Group(),sh=new THREE.Shape();sh.moveTo(-5,0);sh.lineTo(5,0);sh.lineTo(5,3.2);sh.lineTo(3.4,5.6);sh.lineTo(0,6.6);sh.lineTo(-3.4,5.6);sh.lineTo(-5,3.2);sh.closePath();
  const bg=new THREE.ExtrudeGeometry(sh,{depth:14,bevelEnabled:false});bg.translate(0,0,-7);bg.rotateY(Math.PI/2);const b=new THREE.Mesh(bg,mRed);g.add(b);
  [-1,1].forEach(s=>{bxm(g,14.6,.22,2.95,mRoofD,0,4.4,s*4.2,s*.977,0,0);bxm(g,14.6,.22,3.6,mRoofD,0,6.1,s*1.7,s*.286,0,0)});
  bxm(g,3.4,3.8,.12,mWhiteP,0,1.9,5.05);bxm(g,.14,3.8,.14,mWhiteP,0,1.9,5.12);[-1,1].forEach(s=>{bxm(g,4.1,.14,.14,mWhiteP,s*0,1.9,5.14,0,0,s*.9)});bxm(g,3.6,.14,.14,mWhiteP,0,3.85,5.12);
  bxm(g,1.6,1.2,.12,mWhiteP,0,5.0,5.08);bxm(g,1.2,.8,.14,mGlD,0,5.0,5.12);
  [-1,1].forEach(s=>{for(let i=0;i<3;i++)bxm(g,.14,1.0,1.1,mGlD,s*7.05,2.6,-3.6+i*3.6,0,0,0)});
  g.children.forEach(m=>{m.castShadow=true});g.rotation.y=0;addProp(g,-33,24,8,6.3)}
 {/* torre de agua */
  const g=new THREE.Group();[[-1.6,-1.6],[1.6,-1.6],[-1.6,1.6],[1.6,1.6]].forEach(l=>{cym(g,.14,13,mMetal,l[0],6.5,l[1],0,0,6)});
  [4,8].forEach(y=>[[-1,0],[1,0],[0,-1],[0,1]].forEach(d=>bxm(g,d[0]?.08:3.3,.08,d[0]?3.3:.08,mMetal,0,y,0)));
  cym(g,3,4.2,M3({color:C(0xc9d1d8),roughness:.5,metalness:.3}),0,15.2,0,0,0,22);const co=new THREE.Mesh(new THREE.ConeGeometry(3.2,1.8,22),mRoofD);co.position.y=18.2;g.add(co);
  g.children.forEach(m=>{m.castShadow=true});addProp(g,32,-32,3.6,3.6)}
 let truckG=null;
 {/* camioneta */
  const g=new THREE.Group();bxm(g,2.0,.7,5.4,mBlue,0,.85,0);bxm(g,1.9,.75,1.9,mBlue,0,1.55,-1.2);bxm(g,1.92,.5,1.5,mGlD,0,1.6,-1.2);bxm(g,1.9,.1,2.4,mRoofD,0,1.15,1.3);
  [-1,1].forEach(s=>{bxm(g,.08,.45,2.4,mBlue,s*.96,1.4,1.3);[-1.6,1.5].forEach(z=>{cym(g,.46,.34,mTire,s*1.0,.46,z,0,Math.PI/2,12)})});
  bxm(g,1.7,.5,.08,mBlue,0,1.4,2.5);for(let i=0;i<4;i++){const pl=new THREE.Mesh(new THREE.SphereGeometry(.28,7,5),mGreenP);pl.position.set((i%2?.4:-.4),1.35,.5+i*.5);pl.scale.y=1.2;g.add(pl)}
  g.children.forEach(m=>{m.castShadow=true});g.rotation.y=.35;truckG=addProp(g,6.4,17,2.6,3.6)}
 {/* contenedor */
  const g=new THREE.Group(),ct=canTex((x,n)=>{x.fillStyle='#3d7d5c';x.fillRect(0,0,n,n);for(let i=0;i<16;i++){x.fillStyle=i%2?'rgba(0,0,0,.18)':'rgba(255,255,255,.08)';x.fillRect(i*n/16,0,n/16,n)}},128,[10,1]);
  const m=bxm(g,6.1,2.6,2.5,new THREE.MeshStandardMaterial({map:ct,roughness:.6,metalness:.2}),0,1.3,0);m.castShadow=true;bxm(g,.1,2.2,.1,mMetal,3.07,1.3,.4);bxm(g,.1,2.2,.1,mMetal,3.07,1.3,-.4);g.rotation.y=-.2;addProp(g,-11,17.5,3.6,2.4)}
 {/* tambores y palets con bolsas */
  const g=new THREE.Group();[[0,0],[1,.3],[.5,1.1],[-.8,.9]].forEach((p,i)=>{const c=cym(g,.42,1.0,i%2?mBarB:mBarW,p[0],.5,p[1],0,0,12);c.castShadow=true});addProp(g,-5.4,13.2,1.4,1.4);
  const h=new THREE.Group();[[0,0],[1.4,0]].forEach(p=>{bxm(h,1.3,.14,1.1,mWood,p[0],.07,p[1]);for(let k=0;k<3;k++){const bg2=bxm(h,1.0,.4,.8,mBag,p[0],.35+k*.4,p[1]);bg2.castShadow=true}});addProp(h,11.5,13.6,1.8,1.2);
  const hb=new THREE.Group();[[0,0,0],[1.9,0,.2],[.9,0,1.9]].forEach((p,i)=>{const c=cym(hb,.8,1.2,mHay,p[0],.8,p[2],Math.PI/2,0,14);c.rotation.z=Math.PI/2;c.rotation.y=i*.7;c.castShadow=true});addProp(hb,16,23.5,2.6,2.6)}
 const treesG=new THREE.Group();worldG.add(treesG);
 /* árboles redondos al fondo */
 {const TR=new THREE.InstancedMesh(new THREE.CylinderGeometry(.25,.35,3,6),M3({color:C(0x5a4030),roughness:1}),90),CR=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,1),M3({color:C(0x4a7540),roughness:.95}),90),rt=rng(61),D=new THREE.Object3D();let k=0;
  for(let i=0;i<90;i++){const a=rt()*6.283,r=86+rt()*48,s=3.2+rt()*3.4;D.position.set(Math.cos(a)*r,1.5*s/3,Math.sin(a)*r);D.rotation.set(0,0,0);D.scale.set(s/3,s/3,s/3);D.updateMatrix();TR.setMatrixAt(k,D.matrix);
   D.position.y=s*1.25+1.4;D.scale.set(s,s*.9,s);D.updateMatrix();CR.setMatrixAt(k,D.matrix);CR.setColorAt(k,new THREE.Color().setHSL(.25+rt()*.06,.3,.34+rt()*.1));k++}
  TR.frustumCulled=CR.frustumCulled=false;treesG.add(TR);treesG.add(CR)}
 /* camino de tierra hacia el frente */
 const roadTex=canTex((x,n)=>{x.fillStyle='#a8957a';x.fillRect(0,0,n,n);for(let i=0;i<3000;i++){const v=130+rg()*70|0;x.fillStyle='rgba('+v+','+(v-14)+','+(v-40)+','+(.25+rg()*.3)+')';x.fillRect(rg()*n,rg()*n,1+rg()*2,1+rg()*2)}
  x.fillStyle='rgba(60,45,30,.22)';x.fillRect(n*.28,0,n*.1,n);x.fillRect(n*.62,0,n*.1,n)},256,[1,20]);
 const road=new THREE.Mesh(new THREE.PlaneGeometry(4,1),new THREE.MeshStandardMaterial({map:roadTex,roughness:1}));road.rotation.x=-Math.PI/2;road.position.y=.02;road.receiveShadow=true;envG.add(road);
 /* parcelas de plantación */
 const CELLS=[],rc=rng(404);
 for(let m=-5;m<=5;m++){const cxs=[0];for(let j=0;j<7;j++)cxs.push(13.6+12.6*j,-(13.6+12.6*j));
  cxs.forEach(cx=>{const cz=m*18.6,d=Math.hypot(cx,cz);if(d>100)return;const r=rc(),sd=Math.floor(rc()*1e6);
   if(RES.some(q=>cx-5.9<q.x1&&cx+5.9>q.x0&&cz-8.7<q.z1&&cz+8.7>q.z0))return;
   CELLS.push({cx:cx,cz:cz,d:d,type:r<.24&&d>22&&d<80?1:r>.95?2:0,sd:sd})})}
 let keep={x0:-6.8,x1:6.8,z0:-6.8,z1:10.6},keepKey='';
 const HICAP=230,MIDCAP=800,FARCAP=3400,GRSCAP=560;
 let HI=null,MID=null,FARM=null,GRS=null,padRects=[];
 const cTmp=new THREE.Color();
 const DUM=new THREE.Object3D();
 /* pasto por todo lo que no es cultivo, vereda ni camino */
 function grassSync(){
  if(!GRS)return;
  const gr=rng(4242),R=58;let n=0;
  const x0=Math.max(keep.x0-R,-120),x1=Math.min(keep.x1+R,120),z0=Math.max(keep.z0-R,-120),z1=Math.min(keep.z1+R,120);
  const inCell=(x,z)=>CELLS.some(c=>c.type!==2&&Math.abs(x-c.cx)<6.4&&Math.abs(z-c.cz)<9.2&&
   !(c.cx-5.9<keep.x1+.8&&c.cx+5.9>keep.x0-.8&&c.cz-8.7<keep.z1+.8&&c.cz+8.7>keep.z0-.8));
  const inPad=(x,z)=>padRects.some(q=>x>q.x0&&x<q.x1&&z>q.z0&&z<q.z1);
  const inProp=(x,z)=>props.some(q=>q.o.visible&&x>q.x0-.6&&x<q.x1+.6&&z>q.z0-.6&&z<q.z1+.6);
  for(let x=x0;x<x1&&n<GRSCAP;x+=2.7)for(let z=z0;z<z1&&n<GRSCAP;z+=2.7){
   const px=x+(gr()-.5)*2.1,pz=z+(gr()-.5)*2.1;
   if(Math.abs(px)<2.9&&pz>keep.z1)continue;
   if(inPad(px,pz)||inCell(px,pz)||inProp(px,pz))continue;
   DUM.position.set(px,0,pz);DUM.rotation.set(0,gr()*6.28,0);const sc=.7+gr()*.42;DUM.scale.set(sc,.62+gr()*.4,sc);DUM.updateMatrix();
   GRS.setMatrixAt(n,DUM.matrix);GRS.setColorAt(n,cTmp.setHSL(.25+gr()*.04,.18+gr()*.1,.46+gr()*.12));n++}
  GRS.count=n;GRS.instanceMatrix.needsUpdate=true;if(GRS.instanceColor)GRS.instanceColor.needsUpdate=true}
 function fieldSync(){
  const kk=[keep.x0,keep.x1,keep.z0,keep.z1].join();if(kk===keepKey)return;keepKey=kk;
  const nc=[0,0,0];let nf=0,nb=0,np=0,nr=0,nt=0,nh=0,nmd=0;
  road.scale.y=Math.max(1,150-keep.z1);road.position.z=(keep.z1+150)/2;roadTex.repeat.set(1,road.scale.y/6);
  CELLS.forEach(c=>{if(c.type===2)return;
   if(c.cx-5.9<keep.x1+.8&&c.cx+5.9>keep.x0-.8&&c.cz-8.7<keep.z1+.8&&c.cz+8.7>keep.z0-.8)return;
   const r=rng(c.sd),hi=c.d<27,near=c.d<58;
   if(np<420){DUM.position.set(c.cx,.04,c.cz);DUM.rotation.set(0,0,0);DUM.scale.set(11.6,.08,16.4);DUM.updateMatrix();PLOTS.setMatrixAt(np++,DUM.matrix)}
   const place=(x,z,kind)=>{const s=.85+r()*.4;DUM.position.set(x,0,z);DUM.rotation.set(0,r()*6.28,0);DUM.scale.set(s,s*(.9+r()*.25),s);DUM.updateMatrix();
    if(HI){const tn=cTmp.setHSL(.26+r()*.05,.28+r()*.16,.54+r()*.16);
     if(hi&&nh<HICAP){HI.setMatrixAt(nh,DUM.matrix);HI.setColorAt(nh,tn);nh++}
     else if(near&&nmd<MIDCAP){MID.setMatrixAt(nmd,DUM.matrix);MID.setColorAt(nmd,tn);nmd++}
     else if(nf<FARCAP){FARM.setMatrixAt(nf,DUM.matrix);FARM.setColorAt(nf,tn);nf++}
     return}
    if(near&&nc[kind]<MIDCAP){NEAR[kind].setMatrixAt(nc[kind],DUM.matrix);NEAR[kind].setColorAt(nc[kind],cTmp.setHSL(.27+r()*.05,.15+r()*.15,.8+r()*.2));nc[kind]++}
    else if(nf<FARCAP){FAR.setMatrixAt(nf,DUM.matrix);FAR.setColorAt(nf,cTmp.setHSL(.28+r()*.05,.1+r()*.15,.75+r()*.25));nf++}};
   const bed=(x,z,len)=>{if(nb<2600){DUM.position.set(x,.1,z);DUM.rotation.set(0,0,0);DUM.scale.set(.9,.22,len);DUM.updateMatrix();BEDS.setMatrixAt(nb++,DUM.matrix)}};
   const kind=()=>{const q=r();return q<.25?0:q<.6?1:2};
   if(c.type===1){[-1,1].forEach(s=>{const tx=c.cx+s*3.0;
     for(let i=0;i<2;i++){bed(tx+(i?1.2:-1.2),c.cz,14.8);for(let j=0;j<10;j++)place(tx+(i?1.2:-1.2),c.cz-6.8+j*1.5,2)}
     if(nt<tunnels.length){const t=tunnels[nt++];t.visible=true;t.position.set(tx,0,c.cz)}
     for(let q=0;q<7;q++){if(nr<260){DUM.position.set(tx,0,c.cz-7+q*2.33);DUM.rotation.set(0,0,0);DUM.scale.set(1,1,1);DUM.updateMatrix();RIBS.setMatrixAt(nr++,DUM.matrix)}}})}
   else for(let i=0;i<6;i++){const x=c.cx+(i-2.5)*1.9;bed(x,c.cz,14.6);for(let j=0;j<10;j++)place(x+(r()-.5)*.3,c.cz-6.75+j*1.5+(r()-.5)*.25,kind())}});
  for(;nt<tunnels.length;nt++)tunnels[nt].visible=false;
  const upd=m=>{m.instanceMatrix.needsUpdate=true;if(m.instanceColor)m.instanceColor.needsUpdate=true};
  [PLOTS,BEDS,RIBS].forEach((m,i)=>{m.count=[np,nb,nr][i];upd(m)});
  if(HI){HI.count=nh;MID.count=nmd;FARM.count=nf;[HI,MID,FARM].forEach(upd);FAR.count=0;NEAR.forEach(m=>{m.count=0})}
  else{FAR.count=nf;upd(FAR);NEAR.forEach((m,i)=>{m.count=nc[i];upd(m)})}
  grassSync();
  props.forEach(p=>{p.o.visible=!(p.x0<keep.x1+1.5&&p.x1>keep.x0-1.5&&p.z0<keep.z1+1.5&&p.z1>keep.z0-1.5)});shadowDirty()}
 /* personajes decorativos: dos patovas que cuidan la puerta y un dealer apoyado en la pared de atrás */
 const mSkinA=M3({color:C(0xc08a63),roughness:.8}),mSkinB=M3({color:C(0x7a4a30),roughness:.8}),mSuit=M3({color:C(0x15171c),roughness:.7}),mShirt=M3({color:C(0xf2f2f2),roughness:.8}),mTie=M3({color:C(0x7a1620),roughness:.7}),
  mShades=M3({color:0x020202,roughness:.2,metalness:.5}),mHood=M3({color:C(0x4d5d4a),roughness:.95}),mJeans=M3({color:C(0x2f4f80),roughness:.9}),mShoe=M3({color:C(0xeeeeee),roughness:.7}),mBeanie=M3({color:C(0x8a2e2a),roughness:1}),
  mEmber=new THREE.MeshBasicMaterial({color:0xff5a1f}),mPaper=M3({color:C(0xf4f0e2),roughness:.9}),mZip=new THREE.MeshStandardMaterial({color:0xffffff,transparent:true,opacity:.42,roughness:.1,side:THREE.DoubleSide,depthWrite:false}),mBudC=M3({color:C(0x5aa02a),roughness:.9}),mBlueS=new THREE.MeshBasicMaterial({color:0x2d6fe0});
 const _ya=new THREE.Vector3(0,1,0);
 function limb(p,a,b,r,mat,seg){const A=new THREE.Vector3(a[0],a[1],a[2]),Bv=new THREE.Vector3(b[0],b[1],b[2]),d=Bv.clone().sub(A),L=Math.round(d.length()*500)/500,m=new THREE.Mesh(cCyl(r,r*.88,L,seg||7),mat);m.position.copy(A).addScaledVector(d,.5);m.quaternion.setFromUnitVectors(_ya,d.normalize());p.add(m);return m}
 const spm=(p,r,mat,x,y,z,sx,sy,sz)=>{const m=new THREE.Mesh(cSph(r,10,8),mat);m.position.set(x,y,z);m.scale.set(sx||1,sy||1,sz||1);p.add(m);return m};
 function mkGuard(skin){const g=new THREE.Group(),tor=new THREE.Group();g.add(tor);
  [-1,1].forEach(s=>{bxm(g,.25,.86,.28,mSuit,s*.14,.5,0);bxm(g,.27,.1,.4,M3({color:0x050505,roughness:.4}),s*.14,.05,.06)});
  bxm(tor,.66,.82,.38,mSuit,0,1.3,0);bxm(tor,.84,.22,.42,mSuit,0,1.62,0);bxm(tor,.18,.54,.02,mShirt,0,1.36,.2);bxm(tor,.07,.42,.02,mTie,0,1.33,.215);
  limb(tor,[-.42,1.6,0],[-.45,1.32,.08],.1,mSuit);limb(tor,[.42,1.6,0],[.45,1.32,.08],.1,mSuit);
  limb(tor,[-.45,1.3,.1],[.1,1.25,.28],.085,mSuit);limb(tor,[.45,1.3,.1],[-.12,1.38,.3],.085,mSuit);spm(tor,.09,skin,.12,1.25,.29);spm(tor,.09,skin,-.14,1.38,.31);
  cym(tor,.09,.14,skin,0,1.78,0,0,0,8);const hd=new THREE.Group();hd.position.set(0,1.93,0);tor.add(hd);spm(hd,.16,skin,0,0,0,1,1.1,1);bxm(hd,.3,.06,.05,mShades,0,.02,.13);bxm(hd,.02,.1,.02,M3({color:0x111111}),.17,-.03,0);
  g.userData={head:hd,tor:tor,ph:Math.random()*6};return g}
 function mkDealer(){const g=new THREE.Group(),sk=mSkinA;
  /* la espalda toca la pared en z=0 y el cuerpo mira hacia +z */
  limb(g,[-.13,.12,.62],[-.12,.58,.34],.08,mJeans);limb(g,[-.12,.58,.34],[-.12,1.0,.2],.095,mJeans);bxm(g,.2,.1,.34,mShoe,-.13,.05,.68);
  limb(g,[.13,1.0,.2],[.15,.66,.62],.095,mJeans);limb(g,[.15,.66,.62],[.13,.44,.1],.08,mJeans);bxm(g,.2,.3,.1,mShoe,.13,.44,.06,0,0,0);
  const tor=new THREE.Group();tor.position.set(0,1.28,.18);tor.rotation.x=-.12;g.add(tor);bxm(tor,.54,.66,.3,mHood,0,0,0);bxm(tor,.3,.1,.02,M3({color:C(0x2c3a2b)}),0,-.2,.16);
  limb(g,[.3,1.52,.1],[.38,1.22,.24],.085,mHood);limb(g,[.38,1.22,.24],[.08,1.66,.34],.075,mHood);spm(g,.07,sk,.07,1.69,.35);
  const jt=new THREE.Group();jt.position.set(.05,1.7,.38);jt.rotation.set(0,-.25,Math.PI/2-.35);g.add(jt);cym(jt,.014,.2,mPaper,0,.1,0,0,0,6);const em=new THREE.Mesh(new THREE.SphereGeometry(.022,6,5),mEmber);em.position.set(0,.205,0);jt.add(em);
  limb(g,[-.3,1.52,.1],[-.4,1.18,.26],.085,mHood);limb(g,[-.4,1.18,.26],[-.2,1.12,.5],.075,mHood);spm(g,.07,sk,-.2,1.12,.52);
  const bag=new THREE.Group();bag.position.set(-.2,1.2,.56);bag.rotation.set(-.2,.25,.15);g.add(bag);bxm(bag,.2,.28,.012,mZip,0,0,0);bxm(bag,.2,.025,.016,mBlueS,0,.13,0);
  [[-.04,-.05],[.04,-.08],[0,.0],[.05,-.02]].forEach(p=>{const b=spm(bag,.035,mBudC,p[0],p[1],0,1,1,.6)});
  cym(g,.09,.14,sk,0,1.74,.15,0,0,8);const hd=new THREE.Group();hd.position.set(0,1.9,.17);hd.rotation.set(-.12,.35,0);g.add(hd);spm(hd,.16,sk,0,0,0,1,1.1,1);const bn=spm(hd,.17,mBeanie,0,.07,-.01,1,.75,1.05);bxm(hd,.04,.04,.03,M3({color:0x201008}),.06,.02,.15);bxm(hd,.04,.04,.03,M3({color:0x201008}),-.06,.02,.15);
  const sm=[];for(let i=0;i<7;i++){const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:0xe8eaee,transparent:true,opacity:.3,depthWrite:false}));sp.userData.ph=i/7;g.add(sp);sm.push(sp)}
  g.userData={head:hd,tor:tor,smoke:sm,tip:new THREE.Vector3(.0,1.82,.46),ph:Math.random()*6};return g}
 function charTick(c,t){const u=c.userData;if(!u)return;
  if(u.smoke){u.smoke.forEach(sp=>{const k=(t*.16+sp.userData.ph)%1;sp.position.set(u.tip.x+Math.sin(k*7+sp.userData.ph*9)*.1*k+k*.18,u.tip.y+k*1.15,u.tip.z+k*.3);const s=.1+k*.55;sp.scale.set(s,s,1);sp.material.opacity=.55*(1-k)*Math.min(1,k*6)});
   u.head.rotation.y=.35+Math.sin(t*.4+u.ph)*.12;u.tor.scale.y=1+Math.sin(t*1.6)*.006}
  else{u.head.rotation.y=Math.sin(t*.45+u.ph)*.55;u.tor.scale.y=1+Math.sin(t*1.5+u.ph)*.006}}

 /* entorno exterior */
 const campG=new THREE.Group();campG.visible=false;scene.add(campG);
 const SX=12,SZ=14.5,models=new Map();let where='campus';G.where='campus';let paisaje=false;
 const ACC=[0x2fbf8a,0x9a7cf5,0xf2784b,0xe9b93c,0x3fb0e0,0xe85d93],WHITE=new THREE.Color(0xffffff),LEDC=new THREE.Color(.55,.18,1);
 const accIdx=()=>1;
 /* materiales */
 const envMats=[],mkE=o=>{const m=new THREE.MeshStandardMaterial(o);envMats.push(m);return m};
 const mAl=mkE({color:C(0x2b363c),metalness:.5,roughness:.45,envMapIntensity:1.2}),mDark=new THREE.MeshStandardMaterial({color:0x0f1115,metalness:.35,roughness:.6}),
  mGlass=mkE({color:C(0x9fd6cf),transparent:true,opacity:.26,roughness:.05,metalness:.1,side:THREE.DoubleSide,depthWrite:false,envMapIntensity:2.2}),
  mCurb=new THREE.MeshStandardMaterial({color:C(0x9a9a94),roughness:.9}),mFloor=mkE({color:0x8a8f96,roughness:.8,metalness:.05,envMapIntensity:.2}),
  mTank=new THREE.MeshStandardMaterial({color:C(0xc9d1d8),roughness:.5,metalness:.3}),mWarm=new THREE.MeshBasicMaterial({color:0xffd9a0}),
  mShadow=new THREE.MeshBasicMaterial({color:0x000000,map:glowTex,transparent:true,opacity:.6,depthWrite:false}),
  mPlant=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.7,side:THREE.DoubleSide});
 const mBench=new THREE.MeshStandardMaterial({color:C(0xe9edf1),roughness:.6,metalness:0});
 const accM=[];
 function accOf(ai){if(accM[ai])return accM[ai];const c=new THREE.Color(ACC[ai]);
  return accM[ai]={c:c,css:'#'+c.clone().lerp(WHITE,.15).getHexString(),
   paint:new THREE.MeshStandardMaterial({color:c.clone().multiplyScalar(.75),roughness:.45,metalness:.25}),
   trim:new THREE.MeshBasicMaterial({color:c}),led:new THREE.MeshBasicMaterial({color:LEDC.clone()}),
   cone:new THREE.MeshBasicMaterial({color:0xb070ff,transparent:true,opacity:.03,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending}),
   vglow:new THREE.SpriteMaterial({map:glowTex,color:0x8a38ff,transparent:true,opacity:.5,blending:THREE.AdditiveBlending,depthWrite:false}),
   rglow:new THREE.MeshBasicMaterial({map:glowTex,color:0x8a38ff,transparent:true,opacity:.2,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}),
   halo:new THREE.MeshBasicMaterial({color:new THREE.Color(0xb070ff).lerp(c,.3),map:glowTex,transparent:true,opacity:.3,blending:THREE.AdditiveBlending,depthWrite:false})}}
 /* cannabis en miniatura: hojas palmeadas reales, una sola malla por planta (geometría cacheada) */
 const potG=new THREE.CylinderGeometry(.34,.27,.36,12),soilG=new THREE.CircleGeometry(.3,12),stemG=new THREE.CylinderGeometry(.5,1,1,6),budG=new THREE.SphereGeometry(1,8,6),
  TINT={ok:[1,1,1],water:[.78,.95,1.2],warn:[1.3,.98,.5]},plantCache={};
 function plantGeo(tone,hq){const key=tone+hq;if(plantCache[key])return plantCache[key];
  const h=.55+hq/10*1.1,T=3+Math.round(hq/10*3),tn=TINT[tone]||TINT.ok,pos=[],nor=[],col=[],M=new THREE.Matrix4(),Q=new THREE.Quaternion(),E=new THREE.Euler(),P=new THREE.Vector3(),S=new THREE.Vector3(),N3=new THREE.Matrix3(),v=new THREE.Vector3();
  const put=(geo,c,x,y,z,sx,sy,sz,rx,ry,rz,tint,vc)=>{const g=geo.index?geo.toNonIndexed():geo,a=g.attributes.position.array,b=g.attributes.normal.array,cc=vc?g.attributes.color.array:null;
   E.set(rx,ry,rz);Q.setFromEuler(E);P.set(x,y,z);S.set(sx,sy,sz);M.compose(P,Q,S);N3.getNormalMatrix(M);
   for(let i=0;i<a.length;i+=3){v.set(a[i],a[i+1],a[i+2]).applyMatrix4(M);pos.push(v.x,v.y,v.z);v.set(b[i],b[i+1],b[i+2]).applyMatrix3(N3).normalize();nor.push(v.x,v.y,v.z);
    if(cc)col.push(cc[i]*tn[0]*tint,cc[i+1]*tn[1]*tint,cc[i+2]*tn[2]*tint);else col.push(c[0],c[1],c[2])}};
  put(potG,[.05,.05,.06],0,.18,0,1,1,1,0,0,0,1);put(soilG,[.1,.07,.05],0,.37,0,1,1,1,-Math.PI/2,0,0,1);
  put(stemG,[.2,.34,.12],0,.36+h/2,0,.07,h,.07,0,0,0,1);
  for(let t=0;t<T;t++){const f=T>1?t/(T-1):0,y=.36+h*(.22+.72*f),k=.8-.4*f,L=LEAF[f<.3?9:f<.6?7:f<.85?5:3],sz=(.5+.4*(hq/10))*k;
   for(let j=0;j<2;j++){const yaw=t*2.4+j*Math.PI;put(L,null,Math.cos(yaw)*.05,y,-Math.sin(yaw)*.05,sz,sz,sz,0,yaw,.12-.3*f,.88+.22*f,true)}}
  if(hq>=7){const y=.36+h;[[0,0,0,.13],[.1,-.1,.05,.09],[-.1,-.12,.04,.09],[.03,-.2,-.08,.08]].forEach(b=>put(budG,[.34,.52,.18],b[0],y+b[1],b[2],b[3],b[3]*1.6,b[3],0,0,0,1));
   for(let q=0;q<5;q++){put(budG,[.95,.5,.18],Math.cos(q*1.3)*.11,y+(q%3)*.05,Math.sin(q*1.3)*.11,.025,.04,.025,0,0,0,1)}}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));return plantCache[key]=g}
 /* cartel del invernadero: placa oscura con el número y las 9 macetas */
 function mkRoomTex(label,used,css){const cv=document.createElement('canvas');cv.width=512;cv.height=300;const x=cv.getContext('2d');
  const rr=(a,b,w,h,r)=>{x.beginPath();x.roundRect?x.roundRect(a,b,w,h,r):x.rect(a,b,w,h)};
  rr(10,10,492,280,40);x.fillStyle='rgba(12,14,20,.9)';x.fill();x.strokeStyle='rgba(255,255,255,.14)';x.lineWidth=3;x.stroke();
  rr(10,10,16,280,8);x.fillStyle=css;x.fill();
  x.fillStyle='#fff';x.textAlign='center';x.textBaseline='middle';let fs=150;x.font='800 '+fs+'px "Bricolage Grotesque","Segoe UI",sans-serif';const tw=x.measureText(label).width;if(tw>420){fs=Math.max(52,Math.floor(fs*420/tw));x.font='800 '+fs+'px "Bricolage Grotesque","Segoe UI",sans-serif'}x.fillText(label,262,116);
  for(let i=0;i<SLOTS.length;i++){const bx=116+i*30;rr(bx,212,22,10,5);x.fillStyle=i<used?css:'rgba(255,255,255,.16)';x.fill()}
  x.fillStyle='rgba(255,255,255,.62)';x.font='600 38px Figtree,"Segoe UI",sans-serif';x.fillText(used+' de '+SLOTS.length+' macetas',256,254);
  const t=new THREE.CanvasTexture(cv);t.encoding=THREE.sRGBEncoding;t.anisotropy=4;return t}
 /* reflejos del cielo en vidrio y aluminio */
 let envTex=null;function buildEnv(){if(envTex)return;try{const c=mkCv(512,256,(x,w,h)=>{const g=x.createLinearGradient(0,0,0,h);g.addColorStop(0,'#3d78d8');g.addColorStop(.5,'#bcd9f6');g.addColorStop(.52,'#8fae78');g.addColorStop(1,'#4f7a3a');x.fillStyle=g;x.fillRect(0,0,w,h);
   const rgd=x.createRadialGradient(w*.36,h*.22,0,w*.36,h*.22,60);rgd.addColorStop(0,'rgba(255,250,220,1)');rgd.addColorStop(1,'rgba(255,250,220,0)');x.fillStyle=rgd;x.fillRect(0,0,w,h)});
  const t=new THREE.CanvasTexture(c);t.mapping=THREE.EquirectangularReflectionMapping;t.encoding=THREE.sRGBEncoding;const pm=new THREE.PMREMGenerator(renderer);envTex=pm.fromEquirectangular(t).texture;pm.dispose();
  envMats.forEach(m=>{m.envMap=envTex;m.needsUpdate=true})}catch(e){envTex=null}}
 G.dbgEnv=on=>{envMats.forEach(m=>{m.envMap=on?envTex:null;m.needsUpdate=true})};
 const bx=(w,h,d)=>cBox(w,h,d),FW=3.2,FD=4.2,GWH=2.9,GRH=4.6,BH=.95,RA=Math.atan2(GRH-GWH,FW),RL=Math.hypot(FW,GRH-GWH);
 const gB={pad:bx(8.6,.14,10.6),apron:bx(3.4,.14,3.8),rail:bx(.05,.05,8.4),raf:bx(RL,.08,.08),post:bx(.08,GWH-BH-.1,.08),
  ridge:bx(.14,.14,8.5),vent:bx(.3,.07,8),vstrip:bx(.04,.02,8),bench:bx(.95,.06,5.2),leg:bx(.06,.8,.06),bar:bx(.5,.09,1.3),
  sideG:new THREE.PlaneGeometry(8.4,GWH-BH-.1),roofG:new THREE.PlaneGeometry(RL,8.4),tank:new THREE.CylinderGeometry(.85,.85,1.9,20),hv:bx(1.3,1.1,.9),fanD:new THREE.CylinderGeometry(.46,.46,.06,18),blade:bx(.8,.03,.14),
  bol:new THREE.CylinderGeometry(.07,.07,.7,8),barCone:new THREE.CylinderGeometry(.3,.9,1.7,16,1,true)};
 const gShp=new THREE.Shape();gShp.moveTo(-FW,BH+.1);gShp.lineTo(FW,BH+.1);gShp.lineTo(FW,GWH);gShp.lineTo(0,GRH);gShp.lineTo(-FW,GWH);gShp.closePath();const endG=new THREE.ShapeGeometry(gShp);
 const mHV=M3({color:C(0xe6e8ea),roughness:.5,metalness:.3}),mWoodP=M3({color:C(0x8a6542),roughness:.9}),mLeafP=M3({color:C(0x3f7f33),roughness:.9}),mFlw=[0xe8537a,0xf2c230,0xffffff].map(c=>M3({color:C(c),roughness:.8})),
  mBackW=M3({color:C(0xcfd8de),roughness:.6,metalness:.2,map:(function(){const t=canTex((x,n)=>{x.fillStyle='#dfe6ea';x.fillRect(0,0,n,n);for(let i=0;i<8;i++){x.fillStyle=i%2?'rgba(0,0,0,.12)':'rgba(255,255,255,.4)';x.fillRect(i*n/8,0,n/8,n)}},128,[1,1]);t.repeat.set(26,1);return t})()});
 const mSashG=new THREE.MeshStandardMaterial({color:C(0x9fd6cf),transparent:true,opacity:.42,roughness:.1,metalness:.1,side:THREE.DoubleSide,depthWrite:false});envMats.push(mSashG);
 /* hoja de ventana: marco oscuro + vidrio, en el plano XY */
 function sashGrp(w,h,t,gm,fm){const g=new THREE.Group(),th=t||.07;const gl=new THREE.Mesh(cPla(w,h),gm||mSashG);g.add(gl);
  [-1,1].forEach(s=>{bxm(g,w,th,.06,fm||mAl,0,s*(h/2-th/2),0);bxm(g,th,h,.06,fm||mAl,s*(w/2-th/2),0,0)});bxm(g,th*.6,h,.05,fm||mAl,0,0,0);bxm(g,w,th*.6,.05,fm||mAl,0,0,0);return g}
 const shMat={},shPad=[];
 function padMat(rep2){const k='pad'+rep2;if(shMat[k])return shMat[k];
  const m=new THREE.MeshStandardMaterial({map:concTex(),roughness:.92});if(rep2!==1)m.map.repeat.set(rep2,rep2);shMat[k]=m;return m}
 function brickShared(w,h,tw,th){const k=[w,h,tw,th].join('_');if(shMat[k])return shMat[k];const m=brickMat(w,h,tw,th);shMat[k]=m;return m}
 function mkModel(ai){const A=accOf(ai),g=new THREE.Group(),add=(geo,mat,x,y,z,ry)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);if(ry)m.rotation.y=ry;g.add(m);return m};
  const padM=padMat(1),apM=padMat(2);
  add(gB.pad,padM,0,.03,0);add(gB.apron,apM,0,.03,7.1);
  const fl=new THREE.Mesh(new THREE.PlaneGeometry(2*FW,2*FD),mFloor);fl.rotation.x=-Math.PI/2;fl.position.y=.101;g.add(fl);
  /* base de ladrillo con hueco en la puerta */
  [-1,1].forEach(s=>{add(bx(.22,BH,2*FD+.22),brickShared(2*FD,BH,1.4,.95),s*(FW+.1),.1+BH/2,0);add(bx(FW-.8,BH,.22),brickShared(FW-.8,BH,1.4,.95),s*(.8+(FW-.8)/2),.1+BH/2,FD+.1)});
  const bk=add(bx(2*FW+.44,2.6,.14),mBackW,0,.1+1.3,-FD-.1);
  const post9=[-4.2,-3.15,-2.1,-1.05,0,1.05,2.1,3.15,4.2];
  [-4.2,-2.1,0,2.1,4.2].forEach(z=>[-1,1].forEach(s=>add(gB.post,mAl,s*FW,(BH+.1+GWH)/2,z)));
  post9.forEach(z=>[-1,1].forEach(s=>{const r=add(gB.raf,mAl,s*FW/2,(GWH+GRH)/2,z);r.rotation.z=-s*RA}));
  [-1,1].forEach(s=>{add(bx(.16,.12,2*FD+.3),mAl,s*(FW+.06),GWH,0);add(gB.rail,mAl,s*FW,1.8,0);add(gB.rail,mAl,s*FW/2,(GWH+GRH)/2+.05,0);add(gB.rail,mAl,s*FW*.75,(GWH*.5+GRH*.5+GWH)/2+.1,0)});
  add(gB.ridge,mAl,0,GRH,0);
  [-1,1].forEach(s=>[-1,1].forEach(q=>{const d=add(cCyl(.045,.045,GWH-.2,6),mAl,s*(FW+.14),(GWH-.2)/2+.1,q*(FD-.1))}));
  add(gB.sideG,mGlass,-FW,(BH+.1+GWH)/2,0,Math.PI/2);add(gB.sideG,mGlass,FW,(BH+.1+GWH)/2,0,Math.PI/2);
  [-1,1].forEach(s=>{const rp=new THREE.Mesh(gB.roofG,mGlass);rp.position.set(s*FW/2,(GWH+GRH)/2,0);rp.rotation.set(-Math.PI/2,0,-s*RA,'ZXY');g.add(rp);
   const rg2=new THREE.Mesh(gB.roofG,A.rglow);rg2.position.set(s*FW/2,(GWH+GRH)/2-.14,0);rg2.rotation.copy(rp.rotation);g.add(rg2)});
  const eg=new THREE.Mesh(endG,mGlass);eg.position.z=FD;g.add(eg);const eb=new THREE.Mesh(endG,mGlass);eb.position.z=-FD-.02;eb.rotation.y=Math.PI;g.add(eb);
  /* ventanas laterales abiertas hacia afuera */
  [-1,1].forEach(s=>[-3.15,-1.05,1.05,3.15].forEach(z=>{const pv=new THREE.Group();pv.position.set(s*(FW+.03),2.55,z);pv.rotation.z=s*.62;g.add(pv);const sh=sashGrp(1.9,1.2);sh.rotation.y=Math.PI/2;sh.position.y=-.6;pv.add(sh)}));
  /* ventanas de techo abiertas */
  [-1,1].forEach(s=>[-3.15,-1.05,1.05,3.15].forEach(z=>{const pv=new THREE.Group();pv.position.set(s*.28,GRH-.28*(GRH-GWH)/FW,z);pv.rotation.z=-s*(RA-.5);g.add(pv);const sh=sashGrp(1.5,1.9);sh.rotation.x=-Math.PI/2;sh.position.x=s*.75;pv.add(sh)}));
  /* puerta doble con montante en abanico y marquesina */
  [-1,1].forEach(s=>{const lf=sashGrp(.74,2.3,.08);lf.position.set(s*.39,1.25,FD+.05);g.add(lf);bxm(g,.04,.5,.05,mDark,-s*.12,1.2,FD+.12)});
  const fan2=new THREE.Mesh(cTor(.8,.05,6,18,Math.PI),mAl);fan2.position.set(0,2.4,FD+.05);g.add(fan2);for(let i=1;i<5;i++){const a=i*Math.PI/5;bxm(g,.03,.78,.03,mAl,Math.cos(a)*.39,2.4+Math.sin(a)*.39,FD+.05,0,0,a-Math.PI/2)}
  const fg=new THREE.Mesh(cCir(.8,18,0,Math.PI),mSashG);fg.position.set(0,2.4,FD+.04);g.add(fg);
  const oc=new THREE.Mesh(cTor(.3,.05,6,16),mAl);oc.position.set(0,3.75,FD+.04);g.add(oc);const og=new THREE.Mesh(cCir(.3,16),mSashG);og.position.set(0,3.75,FD+.035);g.add(og);
  const can=bxm(g,2.8,.07,1.0,mAl,0,2.95,FD+.5,.1);[-1,1].forEach(s=>bxm(g,.05,.5,.05,mAl,s*1.3,2.72,FD+.1,0,0,0));
  add(bx(1.3,.03,.6),M3({color:C(0x4a3a2e),roughness:1}),0,.12,FD+.9);
  add(bx(.22,.12,.22),mDark,0,2.78,FD+.28);const lamp=add(sph8,mWarm,0,2.62,FD+.3);lamp.scale.setScalar(.09);
  /* canteros con arbustos y flores */
  [-1,1].forEach(s=>{const px=s*2.55,pz=FD+.55;add(bx(1.3,.42,.55),mWoodP,px,.1+.21,pz);for(let i=0;i<4;i++){const b=new THREE.Mesh(sph8,mLeafP);b.position.set(px+(i-1.5)*.3,.62,pz+(i%2?.06:-.06));b.scale.set(.27,.24,.27);g.add(b)}
   for(let i=0;i<7;i++){const f=new THREE.Mesh(sph8,mFlw[i%3]);f.position.set(px+(rg()-.5)*1.1,.78+rg()*.1,pz+(rg()-.5)*.35);f.scale.setScalar(.05);g.add(f)}});
  [-1,1].forEach(s=>{add(gB.bol,mDark,s*1.7,.45,FD+3);const b=add(sph8,mWarm,s*1.7,.84,FD+3);b.scale.setScalar(.09)});
  add(gB.tank,mTank,4.85,.95,-2.8);add(cyl,mDark,4.85,1.95,-2.8).scale.set(.25,.2,.25);add(cyl,mTank,4.0,.6,-1.8).scale.set(.08,1.2,.08);
  add(gB.hv,mHV,-4.9,.55,-2.6);add(gB.fanD,mDark,-4.9,1.13,-2.6);const fan=new THREE.Group();fan.position.set(-4.9,1.18,-2.6);g.add(fan);for(let k=0;k<2;k++){const b=new THREE.Mesh(gB.blade,mDark);b.rotation.y=k*Math.PI/2+.3;fan.add(b)}
  /* tres mesas largas, redes y barras violetas por estación */
  [-1,0,1].forEach(c=>{add(gB.bench,mBench,c*1.87,.9,-.92);[-1,1].forEach(q=>[-1,0,1].forEach(k=>add(gB.leg,mAl,c*1.87+q*.4,.5,-.92+k*2.4)))});
  SLOTS.forEach(sl=>{const x=sl[0]*.267,z=sl[1]*.2625;add(gB.bar,A.led,x,2.55,z);const vg=new THREE.Sprite(A.vglow);vg.position.set(x,2.62,z);vg.scale.set(2.4,2.4,1);g.add(vg);add(gB.barCone,A.cone,x,1.7,z)});
  const light=null;
  /* patovas custodiando la puerta, uno de cada lado */
  const gd=[mkGuard(mSkinA),mkGuard(mSkinB)];gd.forEach((q,i)=>{q.position.set(i?1.4:-1.4,.1,FD+.7);q.rotation.y=i?-.15:.15;g.add(q)});
  /* dealer apoyado atrás de la nave */
  const dl=mkDealer();dl.position.set(-1.2,.1,-FD-.17);dl.rotation.y=Math.PI;g.add(dl);
  g.traverse(o=>{if(o.isMesh&&!o.material.transparent&&!o.material.isMeshBasicMaterial){o.castShadow=true;o.receiveShadow=true}});
  const dots=new THREE.Group();g.add(dots);
  const spr=new THREE.Sprite(new THREE.SpriteMaterial({transparent:true,depthWrite:false}));spr.position.set(0,7.1,0);spr.scale.set(2.7,1.58,1);g.add(spr);
  const hit=new THREE.Mesh(bx(8.6,5.4,10.6),new THREE.MeshBasicMaterial({visible:false}));hit.position.y=2.6;g.add(hit);
  return{g:g,dots:dots,spr:spr,hit:hit,A:A,css:A.css,fan:fan,glows:[],halo:null,light:light,chars:gd.concat([dl]),dealer:dl,plants:[],ai:ai,key:'',hov:0,pop:.001,x:null,z:null,tx:0,tz:0}}
 /* envoltura exterior de la nave (vidrio, ladrillo, ventanas abiertas, canteros) y los personajes a su escala: solo se ve desde afuera */
 const roomOutG=new THREE.Group();roomOutG.visible=false;scene.add(roomOutG);
 const skinG=new THREE.Group();roomG.add(skinG);
 const gl2=new THREE.MeshStandardMaterial({color:C(0x9fd6cf),transparent:true,opacity:.12,roughness:.08,metalness:.1,depthWrite:false}),dkF=M3({color:C(0x2b363c),roughness:.45,metalness:.5}),
  mSashR=new THREE.MeshStandardMaterial({color:C(0xa9e0d8),transparent:true,opacity:.22,roughness:.1,side:THREE.DoubleSide,depthWrite:false});envMats.push(gl2,dkF,mSashR);
 const SK=(geo,mat,x,y,z,rx,ry,rz)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.rotation.set(rx||0,ry||0,rz||0);m.castShadow=!mat.transparent;skinG.add(m);return m};
 {const bk=(w,h)=>brickMat(w,h,4.2,2.8);
  [-1,1].forEach(s=>{SK(Bx(.2,1.95,RD+.4),bk(RD,1.95),s*(RW/2+.1),.225,0);SK(Bx(RW/2-1.9+.2,1.95,.2),bk(RW/2-1.9,1.95),s*((RW/2+1.9)/2),.225,RD/2+.1)});SK(Bx(RW+.4,1.95,.2),bk(RW,1.95),0,.225,-RD/2-.1);
  [[1,Math.PI/2],[-1,-Math.PI/2]].forEach(w=>SK(new THREE.PlaneGeometry(RD,RH-1.2),gl2,w[0]*(RW/2+.03),1.2+(RH-1.2)/2,0,0,w[1]));
  SK(gable(true),gl2,0,0,RD/2+.03);SK(gable(false),gl2,0,0,-RD/2-.03,0,Math.PI);
  [1,-1].forEach(s=>{const g=roofGeo(s);g.setIndex(s>0?[0,2,1,0,3,2]:[0,1,2,0,2,3]);g.computeVertexNormals();const m=new THREE.Mesh(g,gl2);m.position.y=.05;skinG.add(m);
   for(let z=-16;z<=16;z+=2)SK(Bx(rL,.1,.1),dkF,s*RW/4,(RH+RR)/2+.07,z,0,0,-s*rA);
   [3,6,9].forEach(x=>SK(Bx(.09,.09,RD),dkF,s*x,rfY(x)+.07,0));
   for(let z=-16;z<=16;z+=2)SK(Bx(.1,RH-1.2,.1),dkF,s*(RW/2+.06),1.2+(RH-1.2)/2,z);
   [3.6,6.4].forEach(y=>SK(Bx(.1,.1,RD),dkF,s*(RW/2+.06),y,0));
   SK(Bx(.36,.22,RD+.5),dkF,s*(RW/2+.25),RH-.12,0);[-1,1].forEach(q=>SK(new THREE.CylinderGeometry(.1,.1,RH+.4,8),dkF,s*(RW/2+.25),(RH-.35)/2,q*(RD/2-.2)));
   [-12,-8,-4,0,4,8,12].forEach(z=>{const pv=new THREE.Group();pv.position.set(s*(RW/2+.05),6.3,z);pv.rotation.z=s*.62;skinG.add(pv);const sh=sashGrp(3.6,2.1,.12,mSashR,dkF);sh.rotation.y=Math.PI/2;sh.position.y=-1.05;pv.add(sh);
    const pr=new THREE.Group();pr.position.set(s*.6,RR-.6*(RR-RH)/(RW/2)+.08,z);pr.rotation.z=-s*(rA-.5);skinG.add(pr);const sr=sashGrp(4.6,3.5,.12,mSashR,dkF);sr.rotation.x=-Math.PI/2;sr.position.x=s*2.3;pr.add(sr)})});
  for(let x=-10;x<=10;x+=2){const h=rfY(x)-1.2;if(Math.abs(x)>2.2)SK(Bx(.1,h,.1),dkF,x,1.2+h/2,RD/2+.07);SK(Bx(.1,h,.1),dkF,x,1.2+h/2,-RD/2-.07)}
  SK(Bx(RW+.6,.14,.14),dkF,0,RH+.05,RD/2+.07);SK(Bx(RW+.6,.14,.14),dkF,0,RH+.05,-RD/2-.07);
  /* puerta, rampa, marquesina, canteros */
  SK(Bx(8.6,.75,2.8),mConc,0,-.375,RD/2+1.4);
  [-1,1].forEach(s=>{const lf=sashGrp(1.85,6.1,.16,gl2,dkF);lf.position.set(s*.95,3.1,RD/2+.06);skinG.add(lf);SK(Bx(.12,1.6,.14),mGalv,-s*.22+s*.0,3.0,RD/2+.2)});
  SK(Bx(6.4,.22,2.8),dkF,0,7.1,RD/2+1.4,.06);[-1,1].forEach(s=>SK(new THREE.CylinderGeometry(.1,.1,7,8),dkF,s*3.1,3.5,RD/2+2.6));
  [-1,1].forEach(s=>{const px=s*6.4,pz=RD/2+1.9;SK(Bx(4.2,1.3,1.6),mWoodP,px,-.75+.65,pz);
   for(let i=0;i<5;i++){const b=new THREE.Mesh(sph8,mLeafP);b.position.set(px+(i-2)*.8,.95,pz);b.scale.set(.85,.75,.85);b.castShadow=true;skinG.add(b)}
   for(let i=0;i<10;i++){const f=new THREE.Mesh(sph8,mFlw[i%3]);f.position.set(px+(rg()-.5)*3.6,1.5+rg()*.25,pz+(rg()-.5)*1.2);f.scale.setScalar(.14);skinG.add(f)}})}
 {const gs=[mkGuard(mSkinA),mkGuard(mSkinB)];gs.forEach((q,i)=>{q.scale.setScalar(ENVS);q.position.set(i?3.4:-3.4,0,RD/2+1.5);q.rotation.y=i?-.15:.15;roomOutG.add(q)});
  const dl=mkDealer();dl.scale.setScalar(ENVS);dl.position.set(-4,-.75,-RD/2-.24);dl.rotation.y=Math.PI;roomOutG.add(dl);roomOutG.userData.chars=gs.concat([dl]);roomOutG.userData.dl=dl;
  roomOutG.traverse(o=>{if(o.isMesh&&!o.material.transparent&&!o.material.isMeshBasicMaterial){o.castShadow=true}})}
 /* ===== modelos 3D: preparación y colocación ===== */
 function mkProto(o,target,mode,alongZ){const w=new THREE.Group(),inner=new THREE.Group();inner.add(o);w.add(inner);
  let b=new THREE.Box3().setFromObject(o),sz=b.getSize(new THREE.Vector3());
  if(alongZ&&sz.x>sz.z){o.rotation.y=Math.PI/2;b=new THREE.Box3().setFromObject(o);sz=b.getSize(new THREE.Vector3())}
  const c=b.getCenter(new THREE.Vector3()),s=target/(mode==='len'?Math.max(sz.x,sz.z):sz.y);
  o.position.set(o.position.x-c.x,o.position.y-b.min.y,o.position.z-c.z);inner.scale.setScalar(s);
  w.updateMatrixWorld(true);w.userData.sz=sz.clone().multiplyScalar(s);return w}
 function prepMats(o,o2){o.traverse(m=>{if(!m.isMesh&&!m.isSkinnedMesh)return;m.castShadow=!(o2&&o2.noShadow);m.receiveShadow=!(o2&&o2.noShadow);if(m.isSkinnedMesh)m.frustumCulled=false;
  (Array.isArray(m.material)?m.material:[m.material]).forEach(mt=>{if(!mt||!mt.isMeshStandardMaterial)return;
   if(o2&&o2.alpha){mt.transparent=false;mt.alphaTest=o2.aT||.3;mt.depthWrite=true;mt.side=THREE.DoubleSide;mt.alphaToCoverage=!o2.noA2C;
    if(o2.tint)mt.color.setRGB(o2.tint[0],o2.tint[1],o2.tint[2]);
    mt.metalness=0;mt.roughness=Math.max(mt.roughness||0,.94);
    if(mt.map){mt.map.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());mt.map.needsUpdate=true}}
   mt.envMapIntensity=o2&&o2.env!=null?o2.env:.5;if(envTex)mt.envMap=envTex;else envMats.push(mt);mt.needsUpdate=true})})}
 const cloneP=p=>THREE.SkeletonUtils.clone(p);
 /* instancia un modelo varias veces con una sola llamada de dibujo por material */
 function packInst(proto,places,parent,shadow){const out=[];proto.updateMatrixWorld(true);const M=new THREE.Matrix4(),P=new THREE.Matrix4(),E=new THREE.Euler();
  proto.traverse(m=>{if(!m.isMesh)return;
   const im=new THREE.InstancedMesh(m.geometry,m.material,places.length);im.castShadow=!!shadow;im.receiveShadow=false;
   places.forEach((q,i)=>{E.set(0,q.ry||0,0);P.compose(new THREE.Vector3(q.x,q.y||0,q.z),new THREE.Quaternion().setFromEuler(E),new THREE.Vector3(q.s||1,q.s||1,q.s||1));
    M.multiplyMatrices(P,m.matrixWorld);im.setMatrixAt(i,M)});
   im.instanceMatrix.needsUpdate=true;parent.add(im);out.push(im)});
  return out}
 function plantTint(k){const o=MOD.P.plant.clone(true),t=k/3;o.traverse(m=>{if(m.isMesh){m.material=m.material.clone();m.material.color.setRGB(1,1-.12*t,1-.6*t);if(envTex)m.material.envMap=envTex}});return o}
 function modelsReady(){
  const T=MOD.t,P=MOD.P;
  ['merc','bmw','cadi'].forEach(n=>{if(T[n]){prepMats(T[n],{env:.9});P[n]=mkProto(T[n],5.1,'len',true)}});
  if(T.dealer){prepMats(T.dealer,{env:.3});P.dealer=mkProto(T.dealer,1.95,'h')}
  if(T.table){prepMats(T.table,{env:.3});P.table=mkProto(T.table,1.5,'len')}
  if(T.joint){prepMats(T.joint,{env:.2,noShadow:1});P.joint=mkProto(T.joint,.5,'len')}
  if(T.grass){prepMats(T.grass,{alpha:1,aT:.42,noA2C:1,tint:[.55,.8,.44],env:0,noShadow:1});P.grass=mkProto(T.grass,2.5,'len')}
  MOD.pot=new THREE.MeshStandardMaterial({color:C(0x9a5236),roughness:.9});
  if(T.plant){prepMats(T.plant,{alpha:1,env:.2});P.plant=mkProto(T.plant,1,'h');MOD.pl=[0,1,2,3].map(plantTint);MOD.ok=true}
  /* plantación de afuera y pasto: todo sale del mismo modelo, en tres niveles de detalle */
  const geoOf=(obj,target,mode)=>{obj.updateMatrixWorld(true);let src=null;obj.traverse(m=>{if(m.isMesh&&!src)src=m});if(!src)return null;
   const g=src.geometry.clone();g.applyMatrix4(src.matrixWorld);g.computeBoundingBox();const b=g.boundingBox;
   g.translate(-(b.max.x+b.min.x)/2,0,-(b.max.z+b.min.z)/2);g.computeBoundingBox();
   const bb=g.boundingBox,sc=target/(mode==='len'?Math.max(bb.max.x-bb.min.x,bb.max.z-bb.min.z):bb.max.y-bb.min.y);
   g.scale(sc,sc,sc);g.computeBoundingBox();g.translate(0,-g.boundingBox.min.y,0);return g};
  const matOf=o=>{let m=null;o.traverse(x=>{if(x.isMesh&&!m)m=x.material});return m};
  const mkField=(g,mat,cap)=>{const m=new THREE.InstancedMesh(g,mat,cap);
   m.instanceColor=new THREE.InstancedBufferAttribute(new Float32Array(cap*3).fill(1),3);
   m.frustumCulled=false;m.count=0;m.castShadow=false;m.receiveShadow=false;envG.add(m);return m};
  const pMat=T.plant?matOf(T.plant):null,gMat=T.grass?matOf(T.grass):null;
  if(pMat&&T.plantlow&&T.plantmid&&T.plantfar){
   const fMat=pMat.clone();fMat.alphaTest=.2;fMat.envMapIntensity=.08;
   HI=mkField(geoOf(T.plantlow,2.2),fMat,HICAP);
   MID=mkField(geoOf(T.plantmid,2.3),fMat,MIDCAP);
   FARM=mkField(geoOf(T.plantfar,2.4),fMat,FARCAP);
   NEAR.forEach(m=>{m.count=0;m.visible=false});FAR.count=0;FAR.visible=false}
  if(gMat&&T.grasslo){const gf=gMat.clone();gf.alphaTest=.34;gf.color.setRGB(.42,.66,.33);GRS=mkField(geoOf(T.grasslo,1.25,'len'),gf,GRSCAP)}
  keepKey='';
  MOD.ready=true;
  models.forEach((m,id)=>decorate(m,Array.from(models.keys()).indexOf(id)));
  decorateRoom();
  if(truckG){while(truckG.children.length)truckG.remove(truckG.children[0]);if(P.cadi){const c=cloneP(P.cadi);c.scale.setScalar(1.02);truckG.add(c)}}
  models.forEach(m=>{m.key=''});campSync();G.rebuild();shadowDirty();
  setTimeout(()=>{try{renderer.compile(scene,camera)}catch(e){}},80)}
 const jrng=rng(777);
 const JPL=[[-1.2,-FD-1.5],[2.3,-FD-1.1],[.9,FD+1.6],[-2.4,FD+2.1],[5.3,FD+.4],[-3.8,-FD-.6]];
 const GPL=[[-7.6,-3.5,1],[-7.4,4.5,.9],[8.1,-6.2,1],[2.4,-9.4,1.1],[-3.6,-9.4,1],[6.8,9,1],[-5.4,9.2,1],[-3.4,10.6,.9],[3.6,10.4,1]];
 function decorate(m,idx){
  if(m.deco||!MOD.ready)return;m.deco=true;const P=MOD.P,g0=m.g;
  const g=new THREE.Group();g0.add(g);m.decoG=g;g.visible=paisaje;
  /* un dealer atrás de la nave (reemplaza al procedural) */
  if(P.dealer){if(m.dealer){g.remove(m.dealer);m.chars=m.chars.filter(c=>c!==m.dealer);m.dealer=null}
   const o=cloneP(P.dealer);o.position.set(-1.6,.1,-FD-.85);o.rotation.y=Math.PI+.22;g.add(o)}
  if(m.chars)m.chars.forEach(c=>{if(c.parent===g0)g0.remove(c),g.add(c)});
  /* mesa con cosas de marihuana en una esquina */
  if(P.table){const t=cloneP(P.table);t.position.set(2.3,.1,3.0);t.rotation.y=Math.PI/2;g.add(t)}
  /* auto estacionado al costado */
  const cn=['merc','bmw','cadi'][idx%3];if(P[cn]){const c=cloneP(P[cn]);c.position.set(6.1,.03,2.4);c.rotation.y=(idx%2?0:Math.PI)+.1;g.add(c)}
  /* porros tirados y pasto, instanciados */
  if(P.joint)packInst(P.joint,JPL.map(q=>({x:q[0],y:.13,z:q[1],ry:jrng()*6.28})),g,false);
  if(P.grass)packInst(P.grass,GPL.map(q=>({x:q[0],y:.02,z:q[1],ry:jrng()*6.28,s:q[2]})),g,false)}
 function decorateRoom(){
  const P=MOD.P,roomDeco=new THREE.Group();roomOutG.add(roomDeco);roomOutG.userData.deco=roomDeco;roomDeco.visible=paisaje;
  (roomOutG.userData.chars||[]).forEach(c=>{if(c.parent===roomOutG)roomOutG.remove(c),roomDeco.add(c)});
  if(P.table){const t=cloneP(P.table);t.scale.setScalar(ENVS);t.position.set(-9.4,0,-14.5);roomG.add(t)}
  if(P.dealer){const od=roomOutG.userData.dl;if(od){roomOutG.remove(od);roomOutG.userData.chars=roomOutG.userData.chars.filter(c=>c!==od);roomOutG.userData.dl=null}
   const o=cloneP(P.dealer);o.scale.setScalar(ENVS);o.position.set(-4.4,-.75,-RD/2-2.4);o.rotation.y=Math.PI+.22;roomDeco.add(o)}
  [['merc',-19,3.5,.1],['bmw',19,-4,-.12],['cadi',18.5,10.5,.2]].forEach(c=>{if(P[c[0]]){const o=cloneP(P[c[0]]);o.scale.setScalar(ENVS);o.position.set(c[1],-.75,c[2]);o.rotation.y=c[3]+(c[1]>0?Math.PI:0);roomDeco.add(o)}});
  if(P.joint)packInst(P.joint,[[-3,RD/2+5],[5,RD/2+6.5],[-9,RD/2+3.5],[10,RD/2+4],[-2,-RD/2-5.5],[6,-RD/2-4.8]].map(q=>({x:q[0],y:-.6,z:q[1],ry:jrng()*6.28,s:ENVS})),roomDeco,false);
  if(P.grass)packInst(P.grass,[[-16,12],[16,16],[-17,-8],[17,-10],[-6,RD/2+9],[8,RD/2+10],[0,-RD/2-8],[-13,RD/2+7]].map(q=>({x:q[0],y:-.74,z:q[1],ry:jrng()*6.28,s:ENVS})),roomDeco,false)}
 /* libera lo que quedó sin uso después de sacar algo de la escena (no toca lo compartido) */
 function disposeUnused(root){
  const useG=new Set(),useM=new Set(),useT=new Set();
  const grab=(o,sg,sm)=>{if(o.geometry)sg.add(o.geometry);const mm=o.material;if(mm)(Array.isArray(mm)?mm:[mm]).forEach(x=>x&&sm.add(x))};
  scene.traverse(o=>grab(o,useG,useM));
  useM.forEach(m=>{for(const k in m){const v=m[k];if(v&&v.isTexture)useT.add(v)}});
  const oldG=new Set(),oldM=new Set();root.traverse(o=>grab(o,oldG,oldM));
  oldG.forEach(g=>{if(!useG.has(g))g.dispose()});
  oldM.forEach(m=>{if(useM.has(m))return;
   for(const k in m){const v=m[k];if(v&&v.isTexture&&!useT.has(v))v.dispose()}
   const i=envMats.indexOf(m);if(i>=0)envMats.splice(i,1);
   m.dispose()})}
 /* luces del campus: cantidad fija para que agregar un invernadero no recompile shaders */
 const CAMPL=[];for(let i=0;i<4;i++){const L=new THREE.PointLight(0xc77bff,0,11,1.6);L.position.set(0,-40,0);scene.add(L);CAMPL.push(L)}
 function campSync(){
  const n=S.rooms.length,cols=Math.max(1,Math.min(n,4)),rows=Math.ceil(n/cols);
  models.forEach((m,id)=>{if(!S.rooms.some(r=>r.id===id)){campG.remove(m.g);models.delete(id);disposeUnused(m.g);shadowDirty()}});
  S.rooms.forEach((r,i)=>{let m=models.get(r.id);if(!m){m=mkModel(accIdx(r.id));m.hit.userData.mroom=r.id;m.spr.userData.mroom=r.id;campG.add(m.g);models.set(r.id,m);if(MOD.ready)decorate(m,models.size-1);shadowDirty()}
   m.tx=(i%cols-(cols-1)/2)*SX;m.tz=(Math.floor(i/cols)-(rows-1)/2)*SZ;if(m.x==null){m.x=m.tx;m.z=m.tz}
   const P=roomPlants(r.id),key=roomLabel(r.id)+'|'+P.map(q=>q.slot+':'+at0(()=>statusOf(q)).tone+':'+Math.round(heightU(q)*10)).join(',');
   if(key!==m.key){m.key=key;shadowDirty();while(m.dots.children.length)m.dots.remove(m.dots.children[0]);m.plants.length=0;
    P.forEach(q=>{const gx=SLOTS[q.slot][0]*.267,gz=SLOTS[q.slot][1]*.2625,tn=at0(()=>statusOf(q)).tone,hq=Math.round(Math.min(1,heightU(q)/1.6)*10);
     let pm,bs=1.3;
     if(MOD.ok){pm=new THREE.Group();const pt=new THREE.Mesh(potG,MOD.pot);pt.position.y=.1;pt.castShadow=true;pm.add(pt);const md=MOD.pl[tn==='warn'?3:tn==='water'?2:0].clone(true);md.scale.setScalar(.3+.95*hq/10);md.position.y=.17;pm.add(md);pm.position.set(gx,.93,gz);bs=1}
     else{pm=new THREE.Mesh(plantGeo(tn==='warn'?'warn':tn==='water'?'water':'ok',hq),mPlant);pm.position.set(gx,.93,gz);pm.scale.setScalar(1.3)}
     pm.rotation.y=q.slot*1.7;pm.userData.bs=bs;pm.userData.ph=q.slot*1.3;pm.userData.ry=q.slot*1.7;m.dots.add(pm);m.plants.push(pm)});
    if(m.spr.material.map)m.spr.material.map.dispose();m.spr.material.map=mkRoomTex(roomLabel(r.id),P.length,m.css);m.spr.material.needsUpdate=true}});
  padRects=[];models.forEach(m=>padRects.push({x0:m.tx-5.2,x1:m.tx+5.2,z0:m.tz-6.2,z1:m.tz+9.6}));
  const kx=(cols-1)*SX/2+6.8,kb=(rows-1)*SZ/2+6.8,kf=(rows-1)*SZ/2+10.6;campKeep={x0:-kx,x1:kx,z0:-kb,z1:kf};if(where==='campus'){keep=campKeep;fieldSync();sunFit(0,(kf-kb)/2,Math.max(kx,(kf+kb)/2)+9)}
  CAMPL.forEach((L,i)=>{const m=models.get((S.rooms[i]||{}).id);if(m){L.position.set(m.tx,2.3,m.tz);L.userData.on=1}else L.userData.on=0});
  const chg=camp.n!==n;camp.n=n;camp.cols=cols;camp.rows=rows;
  if(chg&&where==='campus'&&G.camMode==='campus'&&!G.zooming)Object.assign(cam,campCam())}
 let campKeep=null;
 const camp={cols:1,rows:1,n:-1};
 const campCam=()=>{const asp=CV.w/CV.h,W=(camp.cols-1)*SX+15,D=(camp.rows-1)*SZ+12;
  const k=paisaje?1:1.5,d=Math.min(paisaje?62:94,Math.max(15,W/(.73*Math.max(asp,.7)*.98),D*1.7)*k);
  return{tx:.9,ty:paisaje?3.4:2.6,tz:0,th:.1,ph:paisaje?1.27:1.12,d:d}};
 /* dos modos: "estudio" (limpio, como un render del cultivo) y "paisaje" (el campo con todo alrededor) */
 const studioTex=(function(){const c=mkCv(8,256,(x,w,h)=>{const g=x.createLinearGradient(0,0,0,h);
   g.addColorStop(0,'#eceadc');g.addColorStop(.5,'#e6e4d5');g.addColorStop(.78,'#dcdcc9');g.addColorStop(1,'#cfd2bd');x.fillStyle=g;x.fillRect(0,0,w,h)});
  const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;return t})();
 const studioNoche=(function(){const c=mkCv(8,256,(x,w,h)=>{const g=x.createLinearGradient(0,0,0,h);
   g.addColorStop(0,'#16222c');g.addColorStop(.6,'#111b22');g.addColorStop(1,'#0c141a');x.fillStyle=g;x.fillRect(0,0,w,h)});
  const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;return t})();
 G.setPaisaje=function(on){
  paisaje=!!on;
  envG.visible=paisaje;hillsG.visible=paisaje;treesG.visible=paisaje;sky.visible=paisaje;
  scene.background=paisaje?null:studioTex;
  ground.material.map=paisaje?grassTex:null;
  ground.material.color.copy(paisaje?C(0xd1d1d1):C(0xD8D6C4));ground.material.needsUpdate=true;
  scene.fog.density=paisaje?.0030:.0045;
  models.forEach(m=>{if(m.decoG)m.decoG.visible=paisaje});
  if(roomOutG.userData&&roomOutG.userData.deco)roomOutG.userData.deco.visible=paisaje;
  if(!isFP())useOrbitCam();
  if(where==='campus'&&G.camMode==='campus'&&!G.zooming)Object.assign(cam,campCam());
  shadowDirty();G.resize()};
 G.place=w=>{shadowDirty();where=w;G.where=w;roomG.visible=w==='room';campG.visible=w==='campus';ground.position.y=w==='room'?-.75:-.04;envG.position.y=w==='room'?-.75:-.04;envG.scale.setScalar(w==='room'?ENVS:1);
  if(w==='room'){padRects=[{x0:-(RW/2+2)/ENVS,x1:(RW/2+2)/ENVS,z0:-(RD/2+3)/ENVS,z1:(RD/2+6)/ENVS}];keep={x0:-6.8,x1:6.8,z0:-6.8,z1:10.6};keepKey='';fieldSync();sunFit(0,6,52)}else if(campKeep){keep=campKeep;keepKey='';fieldSync();sunFit(0,(keep.z1+keep.z0)/2,Math.max(keep.x1,(keep.z1-keep.z0)/2)+9)}updWorld()};
 G.campusView=rid=>{G.camMode='campus';mv=null;useOrbitCam();updWorld();Object.assign(cam,campCam());
  if(rid){const m=models.get(rid);if(m){Object.assign(cur,{tx:m.tx,ty:1.8,tz:m.tz,th:.1,ph:1.3,d:9})}}if(G.onMode)G.onMode()};
 G.zoomInto=rid=>{const m=models.get(rid);if(!m)return;G.camMode='campus';cam.tx=m.tx;cam.ty=1.8;cam.tz=m.tz;cam.d=8;cam.ph=1.3};
 G.roomView=()=>{G.door(true)};
 G.projectAdd=()=>null;
 G.signPos=()=>{const v=new THREE.Vector3(0,5.6,-RD/2+.3).project(camera);return{x:CV.l+(v.x*.5+.5)*CV.w,y:CV.t+(-v.y*.5+.5)*CV.h,ok:v.z<1}};
 G.labelPos=rid=>{const m=models.get(rid);if(!m)return null;const v=new THREE.Vector3(m.x,7.1*m.g.scale.y,m.z).project(camera);return{x:CV.l+(v.x*.5+.5)*CV.w,y:CV.t+(-v.y*.5+.5)*CV.h,ok:v.z<1}};
 const sync0=G.sync;G.sync=function(){sync0();signSync();campSync()};
 /* interacción */
 const ray=new THREE.Raycaster(),ndc=new THREE.Vector2();
 const pickRoom=e=>{ndc.set((e.clientX-CV.l)/CV.w*2-1,-((e.clientY-CV.t)/CV.h)*2+1);ray.setFromCamera(ndc,camera);const i=ray.intersectObjects(Array.from(models.values()).map(m=>m.hit),false);return i.length?i[0].object.userData.mroom:null};
 const hits=()=>Array.from(recs.values()).map(x=>x.hit);
 const plateHits=()=>plateMeshes;
 const pickLabelCamp=e=>{ndc.set((e.clientX-CV.l)/CV.w*2-1,-((e.clientY-CV.t)/CV.h)*2+1);ray.setFromCamera(ndc,camera);const i=ray.intersectObjects(Array.from(models.values()).map(m=>m.spr),false);return i.length?i[0].object.userData.mroom:null};
 const pickSign=e=>{ndc.set((e.clientX-CV.l)/CV.w*2-1,-((e.clientY-CV.t)/CV.h)*2+1);ray.setFromCamera(ndc,camera);return ray.intersectObject(sign,false).length>0};
 function pickSlot(e){ndc.set((e.clientX-CV.l)/CV.w*2-1,-((e.clientY-CV.t)/CV.h)*2+1);ray.setFromCamera(ndc,camera);const i=ray.intersectObjects(plateHits(),false);return i.length?i[0].object.userData.slot:null}
 function pick(e){ndc.set((e.clientX-CV.l)/CV.w*2-1,-((e.clientY-CV.t)/CV.h)*2+1);ray.setFromCamera(ndc,camera);const i=ray.intersectObjects(hits(),false);return i.length?i[0].object.userData.pid:null}
 canvas.addEventListener('pointerdown',e=>{if(S.view!=='stage')return;drag={x:e.clientX,y:e.clientY,sx:e.clientX,sy:e.clientY,moved:false,pan:e.button===2||e.button===1||e.shiftKey};canvas.style.cursor=drag.pan?'move':'grabbing';idle=0;try{canvas.setPointerCapture(e.pointerId)}catch(_){}});
 canvas.addEventListener('pointermove',e=>{if(S.view!=='stage')return;
  if(drag){const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
   if(isFP()){const big=G.camMode==='door'?3.3:1.5;lk.y=clamp(lk.y+dx*.0045,-big,big);lk.p=clamp(lk.p+dy*.0035,-.8,.8)}
   else if(drag.pan){const sp=cur.d*.0021,sT=Math.sin(cur.th),cT=Math.cos(cur.th);
    cam.tx+=-cT*dx*sp-sT*dy*sp;cam.tz+=sT*dx*sp-cT*dy*sp;
    const bx=where==='room'?RW/2-1:48,bz=where==='room'?RD/2-1:48;cam.tx=clamp(cam.tx,-bx,bx);cam.tz=clamp(cam.tz,-bz,bz)}
   else{cam.th-=dx*.006;cam.ph=clamp(cam.ph-dy*.005,.3,1.52)}
   drag.x=e.clientX;drag.y=e.clientY;if(Math.hypot(e.clientX-drag.sx,e.clientY-drag.sy)>5)drag.moved=true;idle=0}
  else if(where==='campus'){const id=pickRoom(e),lb=pickLabelCamp(e);models.forEach((m,k)=>{m.hovT=k===id||k===lb?1:0});canvas.style.cursor=lb?'text':id?'pointer':'grab'}
  else{const o=pick(e);const sl=o?null:pickSlot(e);canvas.style.cursor=o?'pointer':(sl!=null&&!Array.from(recs.values()).some(r=>r.slot===sl))?'pointer':pickSign(e)?'text':'grab'}});
 canvas.addEventListener('pointerup',e=>{canvas.style.cursor='grab';if(drag&&drag.pan){drag=null;return}if(drag&&!drag.moved&&where==='campus'){const lr=pickLabelCamp(e);if(lr&&G.onPickLabel)G.onPickLabel(lr,e.clientX,e.clientY);else{const rid=pickRoom(e);if(rid&&G.onPickRoom)G.onPickRoom(rid)}}else if(drag&&!drag.moved){const id=pick(e);if(id&&G.onPick)G.onPick(id);else if(pickSign(e)&&G.onPickLabel)G.onPickLabel(S.room,e.clientX,e.clientY);else{const sl=pickSlot(e);if(sl!=null&&!Array.from(recs.values()).some(r=>r.slot===sl)&&G.onPickEmpty)G.onPickEmpty(sl)}}drag=null});
 canvas.addEventListener('pointercancel',()=>{drag=null});canvas.addEventListener('contextmenu',e=>e.preventDefault());
 canvas.addEventListener('wheel',e=>{if(S.view!=='stage')return;e.preventDefault();if(isFP())fp.zoom=clamp(fp.zoom*(1+e.deltaY*.0012),.5,1.2);else cam.d=G.camMode==='campus'?clamp(cam.d*(1+e.deltaY*.0012),7,64):clamp(cam.d*(1+e.deltaY*.0012),6,150);idle=0},{passive:false});
 addEventListener('resize',G.resize);
 {const tg=$('#tags');if(tg)tg.addEventListener('wheel',e=>{if(S.view!=='stage')return;e.preventDefault();canvas.dispatchEvent(new WheelEvent('wheel',{deltaY:e.deltaY,deltaMode:e.deltaMode,cancelable:true}))},{passive:false})}

 /* bucle */
 const clock=new THREE.Clock();let lightT=1,lastDraw=0;const shSun={x:1e9,z:1e9};let shLit=1,fT=0,fN=0,fCool=0;
 function tick(){
  requestAnimationFrame(tick);
  const nowT=performance.now();
  if(S.view!=='stage')return;if(idle>20&&!S.playing&&!drag&&nowT-lastDraw<33)return;
  lastDraw=nowT;
  const dt=Math.min(clock.getDelta(),.05),t=clock.elapsedTime;
  const mot=S.set.mot;
  if(G.onFrame)G.onFrame(dt);
  if(dirty&&performance.now()-lastBuild>(S.playing?60:16)){dirty=false;lastBuild=performance.now();recs.forEach(buildFoliage);shadowDirty()}
  const rdt=Math.min((nowT-(tick.p||nowT))/1000,.2);idle+=Math.min((nowT-(tick.p||nowT))/1000,5);tick.p=nowT;if(S.set.rot&&where==='room'&&G.camMode==='general'&&!drag&&idle>1.2)cam.th+=rdt*.14;
  const k=1-Math.exp(-dt*5);for(const key in cam)cur[key]+=(cam[key]-cur[key])*k;
  let ftx=cur.tx,ftz=cur.tz;
  if(isFP()&&where==='room'){
   if(mv){mv.t=Math.min(1,mv.t+rdt/mv.T);const e=mv.t<.5?4*mv.t*mv.t*mv.t:1-Math.pow(-2*mv.t+2,3)/2,d=e*mv.L;let i=1;while(i<mv.cum.length-1&&mv.cum[i]<d)i++;
    const a=mv.all[i-1],b=mv.all[i],sl=(mv.cum[i]-mv.cum[i-1])||1,u=clamp((d-mv.cum[i-1])/sl,0,1);
    fc.x=a[0]+(b[0]-a[0])*u;fc.z=a[1]+(b[1]-a[1])*u;fc.y=mv.y0+(fp.y-mv.y0)*e;fc.yaw=mv.yaw0+(mv.yawT-mv.yaw0)*e;fc.pitch=mv.p0+(fp.pitch-mv.p0)*e;
    if(mv.t>=1){mv=null;if(G.onArrive)G.onArrive()}}
   const kk=1-Math.exp(-rdt*14),kz=1-Math.exp(-rdt*6);lkc.y+=(lk.y-lkc.y)*kk;lkc.p+=(lk.p-lkc.p)*kk;fc.fov+=(fp.fov*fp.zoom-fc.fov)*kz;
   const yw=fc.yaw+lkc.y,pt=clamp(fc.pitch+lkc.p,-1.2,.9),cp=Math.cos(pt);
   camera.position.set(fc.x,fc.y,fc.z);camera.lookAt(fc.x-Math.sin(yw)*cp,fc.y+Math.sin(pt),fc.z-Math.cos(yw)*cp);
   if(Math.abs(camera.fov-fc.fov)>.02){camera.fov=fc.fov;camera.updateProjectionMatrix()}
   ftx=fc.x;ftz=fc.z}
  else{const asp=CV.w/CV.h,dEff=Math.min(150,cur.d*Math.max(1,Math.pow(1.15/asp,.85)));
   camera.position.set(cur.tx+dEff*Math.sin(cur.ph)*Math.sin(cur.th),cur.ty+dEff*Math.cos(cur.ph),cur.tz+dEff*Math.sin(cur.ph)*Math.cos(cur.th));
   camera.lookAt(cur.tx,cur.ty,cur.tz)}
  lightT+=((S.day?1:0)-lightT)*(1-Math.exp(-dt*2.4));
  hemi.intensity=(where==='room'?1:0)*lerp(.1,.5,lightT);mixC(hemi.color,0x241a3d,0xeaf1ff,lightT);mixC(hemi.groundColor,0x0a0714,0x8a929e,lightT);glassM.emissiveIntensity=roofM.emissiveIntensity=lerp(.05,.5,lightT);netM.color.setScalar(lerp(.3,1,lightT));
  sun.intensity=(where==='room'?1:0)*lerp(0,.5,lightT);sun.target.position.set(ftx,0,ftz);sun.position.set(ftx+3,12,ftz+5);
  if(Math.abs(ftx-shSun.x)>.8||Math.abs(ftz-shSun.z)>.8){shSun.x=ftx;shSun.z=ftz;sun.shadow.needsUpdate=true}
  if(Math.abs(lightT-shLit)>.02){shLit=lightT;shadowDirty()}
  const inRoom=where==='room'?1:0;
  for(let i=0;i<uv.length;i++){const u=uv[i];u.light.intensity=inRoom*lerp(0,.36,lightT);u.led.color.copy(cLedOff).lerp(cLed,lightT);u.glow.opacity=lerp(0,.022,lightT)}
  dmat.opacity=lerp(.18,.5,lightT);
  accM.forEach(A=>{A.led.color.copy(LEDC).lerp(A.c,.12).multiplyScalar(lerp(.16,1.1,lightT));A.cone.opacity=lerp(.0,.05,lightT);A.vglow.opacity=lerp(0,.5,lightT);A.rglow.opacity=lerp(0,.3,lightT)});
  scene.fog.color.copy(fogNoche).lerp(fogDia,where==='campus'?1:Math.max(.35,lightT*.8));
  if(!paisaje){const nb=where==='room'&&lightT<.5?studioNoche:studioTex;if(scene.background!==nb)scene.background=nb}
  wU.uT.value=t;sky.position.copy(camera.position);const wv=worldG.visible?1:0;daySun.intensity=wv*(where==='campus'?1.75:isFP()?0:.9);dayHemi.intensity=wv*.8;
  if(where==='room'&&mot){exF.forEach(g=>{g.rotation.x+=dt*4});haf.forEach(g=>{g.rotation.z+=dt*5})}
  if(roomOutG.visible)roomOutG.userData.chars.forEach(c=>charTick(c,t));
  CAMPL.forEach(L=>{L.intensity=(where==='campus'&&L.userData.on)?lerp(.05,.85,lightT):0});
  if(where==='campus')models.forEach(m=>{m.x+=(m.tx-m.x)*k;m.z+=(m.tz-m.z)*k;if(m.pop<1)m.pop=Math.min(1,m.pop+dt*1.4);
   const x=m.pop,c1=1.7,c3=c1+1,e=m.pop>=1?1:Math.max(.001,1+c3*Math.pow(x-1,3)+c1*Math.pow(x-1,2));m.hov+=((m.hovT||0)-m.hov)*k;
   m.g.position.set(m.x,0,m.z);m.g.scale.setScalar(e*(1+.05*m.hov));if(m.pop<1||Math.abs(m.tx-m.x)>.02)shadowDirty();
   m.fan.rotation.y+=dt*(4+m.hov*3);m.chars.forEach(c=>charTick(c,t));

   if(mot)for(let q=0;q<m.plants.length;q++){const pm=m.plants[q],ph=pm.userData.ph;pm.rotation.y=pm.userData.ry+Math.sin(t*.5+ph)*.08;pm.scale.y=pm.userData.bs*(1+Math.sin(t*1.1+ph)*.015)}});
  recs.forEach(rec=>{
   if(rec.delay>0){rec.delay-=dt;rec.group.scale.setScalar(.001);return}
   if(rec.spawn>0&&rec.spawn<1){rec.spawn=Math.min(1,rec.spawn+dt*1.1);const x=rec.spawn,c1=1.7,c3=c1+1,e=1+c3*Math.pow(x-1,3)+c1*Math.pow(x-1,2);rec.group.scale.setScalar(Math.max(.001,e))}else if(rec.spawn>=1&&rec.group.scale.x!==1)rec.group.scale.setScalar(1);
   for(const sw of rec.sway)sw.g.rotation.z=sw.b+(mot?Math.sin(t*1.25+sw.ph)*sw.a*.5:0);
   rec.fol.rotation.z=mot?Math.sin(t*.7+rec.ph)*.012:0;rec.fol.rotation.x=mot?Math.cos(t*.6+rec.ph)*.01:0;
   rec.splash=Math.max(0,rec.splash-dt*.5);const h=hum(rec.p);
   mixC(rec.soilMat.color,0x7a6450,0x2a1b13,clamp(h+rec.splash*.6,0,1));
   rec.gauge.scale.y=Math.max(.03,h);rec.gaugeMat.color.setHex(h>.88||h<=.2?0xff8f5a:0x5aa0ff)});
  for(let i=drops.length-1;i>=0;i--){const m=drops[i],u=m.userData;
   if(u.delay>0){u.delay-=dt;continue}
   u.vy-=9*dt;m.position.y+=u.vy*dt;
   if(m.position.y<=TRAY+u.rec.Hh+.02){u.rec.splash=1;roomG.remove(m);drops.splice(i,1)}}
  if(mot){const a=dg.attributes.position.array;for(let i=0;i<DN;i++){a[i*3]+=dvel[i*3]*dt;a[i*3+1]+=dvel[i*3+1]*dt;a[i*3+2]+=dvel[i*3+2]*dt;if(a[i*3+1]>8.5)a[i*3+1]=.1}dg.attributes.position.needsUpdate=true}
  const sr=recs.get(S.sel);if(sr&&S.view==='stage'){ring.visible=true;ring.position.x=sr.group.position.x;ring.position.z=sr.group.position.z;ring.scale.setScalar((sr.R+.4)/.9*(1+(mot?Math.sin(t*3)*.03:0)))}else ring.visible=false;
  if(shNeed>0){shNeed--;daySun.shadow.needsUpdate=true;sun.shadow.needsUpdate=true}
  renderer.render(scene,camera);
  /* si va trabado, baja la resolución interna sin tocar la calidad elegida */
  fT+=performance.now()-nowT;fN++;
  if(fN>=70){const avg=fT/fN;fT=0;fN=0;if(fCool>0)fCool--;
   else if(avg>40&&prAuto>.62){prAuto=Math.max(.62,prAuto*.82);fCool=3;applyPR()}
   else if(avg<15&&prAuto<1){prAuto=Math.min(1,prAuto*1.12);fCool=3;applyPR()}}
 }
 G.dbg={cam:cam,cur:cur,renderer:renderer,scene:scene,camera:camera,roomG:roomG,skinG:skinG,worldG:worldG,envG:envG,sun:sun,daySun:daySun};
 G.setQuality('alta');G.sync();G.place('campus');buildEnv();G.campusView();G.resize();tick();modelsLoad();G.ok=true;return true;
}
