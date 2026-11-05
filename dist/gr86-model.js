import * as THREE from './three.module.js';
import {GR86} from './vehicle-spec.js';
// Original lightweight reconstruction from Toyota's dimensions and reference
// photography. No ripped game assets. Surface details are approximations.
export function buildGR86(){
 const root=new THREE.Group(),body=new THREE.Group();root.add(body);root.name='Toyota GR86 reconstruction';
 const origin=.681,front=GR86.wheelbase*(1-GR86.frontWeight),rear=-GR86.wheelbase*GR86.frontWeight;
 const nose=front+GR86.frontOverhang,tail=rear-GR86.rearOverhang;
 const paint=new THREE.MeshPhysicalMaterial({color:0xb0182c,metalness:.38,roughness:.26,clearcoat:1,clearcoatRoughness:.16,side:THREE.DoubleSide});
 const black=new THREE.MeshStandardMaterial({color:0x101318,roughness:.7,side:THREE.DoubleSide});
 const rubber=new THREE.MeshStandardMaterial({color:0x17191b,roughness:.96});
 const silver=new THREE.MeshStandardMaterial({color:0x969da4,metalness:.85,roughness:.3});
 const glass=new THREE.MeshPhysicalMaterial({color:0x263c48,roughness:.16,metalness:.28,transparent:true,opacity:.78,side:THREE.DoubleSide});
 const lens=new THREE.MeshPhysicalMaterial({color:0x788893,metalness:.45,roughness:.15,clearcoat:1,side:THREE.DoubleSide});
 const white=new THREE.MeshStandardMaterial({color:0xd8e8f2,emissive:0xc6dcff,emissiveIntensity:.6});
 const red=new THREE.MeshStandardMaterial({color:0x901424,emissive:0xa50d22,emissiveIntensity:.7});
 const trim=new THREE.MeshStandardMaterial({color:0x4f535a,roughness:.7,metalness:.25});
 const deformables=[],cabinParts=[];
 const local=p=>[p[0],p[1]-origin,p[2]];
 function mesh(verts,indices,mat=paint,parent=body,deform=true,name=''){
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(verts.flat(),3));g.setIndex(indices);g.computeVertexNormals();
  const m=new THREE.Mesh(g,mat);m.name=name;m.castShadow=true;m.receiveShadow=true;parent.add(m);
  if(deform)deformables.push({mesh:m,base:Float32Array.from(verts.flat())});return m;
 }
 function panel(points,mat=paint,name=''){return mesh(points.map(local),points.slice(1,-1).flatMap((_,i)=>[0,i+1,i+2]),mat,body,true,name);}
 function loft(rows,mat=paint,name=''){const cols=rows[0].length,indices=[];for(let j=0;j<rows.length-1;j++)for(let i=0;i<cols-1;i++){const a=j*cols+i,b=a+cols;indices.push(a,b,a+1,a+1,b,b+1);}return mesh(rows.flat().map(local),indices,mat,body,true,name);}
 function box(x,h,z,sx,sy,sz,mat=black,parent=body,name=''){
  const g=new THREE.BoxGeometry(sx,sy,sz),p=g.attributes.position,verts=[];for(let i=0;i<p.count;i++)verts.push([p.getX(i)+x,p.getY(i)+h-origin,p.getZ(i)+z]);return mesh(verts,[...g.index.array],mat,parent,parent===body,name);
 }
 function line(points,mat=black,width=.004,parent=body){const path=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...local(p))));const m=new THREE.Mesh(new THREE.TubeGeometry(path,Math.max(6,points.length*3),width,5,false),mat);parent.add(m);return m;}
 const profile=[ [tail,.82,.72],[-2.05,.82,.73],[-1.65,.8875,.78],[-1.2,.876,.77],[-.5,.86,.755],[.25,.855,.755],[.75,.872,.78],[front,.8875,.75],[1.65,.86,.68],[nose,.79,.59] ];
 function section(z){let j=1;while(j<profile.length-1&&profile[j][0]<z)j++;const a=profile[j-1],b=profile[j],t=THREE.MathUtils.clamp((z-a[0])/(b[0]-a[0]),0,1);const u=t*t*(3-2*t);return {w:THREE.MathUtils.lerp(a[1],b[1],u),h:THREE.MathUtils.lerp(a[2],b[2],u)};}
 // Actual open wheel arches, rather than wheels intersecting a solid box.
 const zs=[];for(let z=tail;z<nose;z+=.035)zs.push(z);zs.push(nose);
 function lower(z){const d=Math.min(Math.abs(z-front),Math.abs(z-rear));if(d<.36)return .299+Math.sqrt(.36*.36-d*d);if(d<.39)return THREE.MathUtils.lerp(.299,.155,(d-.36)/.03);return .155;}
 for(const side of [-1,1]){
  loft(zs.map(z=>{const p=section(z),bottom=lower(z);return [0,.18,.48,.83,1].map(t=>[side*(p.w-.025*(1-t)-.038*Math.sin(Math.PI*t)),THREE.MathUtils.lerp(bottom,p.h,t),z-.20*Math.pow(Math.max(0,(z-(nose-.4))/.4),2)]);}),paint,'arched side shell');
  // Rolled arch lips and recessed dark liners.
  for(const wz of [rear,front]){
   const rows=[];for(let i=0;i<=40;i++){const a=Math.PI*i/40,z=wz+Math.cos(a)*.36,h=.299+Math.sin(a)*.36,p=section(z);rows.push([[side*(p.w+.004),h,z],[side*(p.w-.022),h+.015,z]]);}loft(rows,paint,'wheel arch lip');
   const liner=new THREE.Mesh(new THREE.CylinderGeometry(.346,.346,.05,40,1,true,0,Math.PI).rotateZ(Math.PI/2),black);liner.position.set(side*.83,.299-origin,wz);body.add(liner);
  }
  // GR86's vent behind the front wheel, sculpted sill and door shut line.
  panel([[side*.878,.61,.78],[side*.878,.56,.64],[side*.868,.32,.67],[side*.872,.32,.75]],black,'front fender vent');
  line([[side*.883,.61,.80],[side*.883,.59,.59],[side*.876,.39,.64]],paint,.012);
  box(side*.857,.15,-.05,.047,.065,1.72,black);
  line([[side*.87,.73,.49],[side*.875,.38,.48],[side*.854,.22,.36],[side*.861,.22,-.92],[side*.88,.71,-.99]],black,.0025);
  box(side*.863,.66,-.52,.018,.021,.145,paint);
 }
 // Continuous shoulder surfaces join the door skins to the inset glasshouse.
 // Previously these bands were absent, leaving visible holes through the cabin.
 for(const side of [-1,1]){
  const stations=[[-1.54,.78,.78],[-1.42,.77,.79],[-.94,.738,.79],[-.5,.739,.79],[.12,.738,.79],[.64,.735,.79],[.68,.72,.78]];
  loft(stations.map(([z,w,h])=>{const p=section(z);return [[side*p.w,p.h,z],[side*(p.w-.034),p.h+.018,z],[side*w,h,z]];}),paint,'continuous shoulder and beltline');
  // Crease follows the rear haunch into the door and the front wing.
  line([[side*.864,.702,-1.90],[side*.889,.738,rear],[side*.875,.728,-.95],[side*.862,.721,-.30],[side*.867,.731,.54]],paint,.006);
  panel([[side*.859,.27,.54],[side*.869,.23,.35],[side*.870,.22,-.91],[side*.855,.18,-.94]],paint,'sculpted rocker');
 }
 // Rounded bonnet with characteristic raised outer ridges; curved trunk.
 const bonnetZ=[.67,.9,front,1.55,1.82,nose];
 loft(bonnetZ.map(z=>{const p=section(z);return [-1,-.83,-.68,0,.68,.83,1].map(t=>[t*p.w,p.h+.015*(1-t*t)+.022*Math.exp(-(((Math.abs(t)-.72)/.12)**2)),z-.20*t*t*Math.pow(Math.max(0,(z-(nose-.4))/.4),2)]);}),paint,'bonnet');
 loft([tail,-2.05,-1.8,-1.5,-1.25].map(z=>{const p=section(z);return [-1,-.82,0,.82,1].map(t=>[p.w*t,p.h+.024*(1-t*t),z]);}),paint,'trunk');
 for(const side of [-1,1])line([[side*.64,.775,.67],[side*.66,.766,front],[side*.64,.69,1.65],[side*.57,.618,1.95]],black,.002);
 // Low swept cabin: 1310 mm roof, frameless side glazing and quarter windows.
 const roofRows=[[-1.02,.57,1.19],[-.80,.61,1.255],[-.50,.625,1.280],[-.22,.60,1.265],[-.08,.57,1.22]];
 const roof=loft(roofRows.map(([z,w,h])=>[-1,-.7,0,.7,1].map(t=>[w*t,h-.022*t*t,z])),paint,'roof');cabinParts.push(roof);
 panel([[-.035,1.28,-.58],[.035,1.28,-.58],[.027,1.31,-.72],[-.027,1.31,-.72]],paint,'roof antenna');
 const windshield=loft([[.68,.72,.78],[.39,.68,.96],[-.08,.57,1.20]].map(([z,w,h])=>[-1,-.5,0,.5,1].map(t=>[w*t,h+.012*(1-t*t),z])),glass,'windscreen');
 loft([[-1.53,.77,.79],[-1.32,.69,.98],[-1.02,.57,1.19]].map(([z,w,h])=>[-1,-.5,0,.5,1].map(t=>[w*t,h+.012*(1-t*t),z])),glass,'rear glass');
 for(const side of [-1,1]){
  panel([[side*.735,.79,.64],[side*.568,1.195,-.08],[side*.596,1.235,-.78],[side*.733,.79,-.89]],glass,'door glass');
  panel([[side*.733,.79,-.95],[side*.592,1.21,-.87],[side*.762,.79,-1.43]],glass,'quarter glass');
  const ap=line([[side*.739,.78,.68],[side*.68,.96,.39],[side*.577,1.215,-.08]],paint,.025);cabinParts.push(ap);
  const cp=panel([[side*.57,1.19,-1.02],[side*.60,1.24,-.86],[side*.77,.79,-1.42],[side*.78,.78,-1.54]],paint,'C pillar');cabinParts.push(cp);
  line([[side*.577,1.215,-.08],[side*.60,1.245,-.30],[side*.613,1.24,-.78],[side*.592,1.21,-.87]],paint,.014);
  line([[side*.73,.78,-.92],[side*.735,.80,-.86],[side*.596,1.235,-.78]],black,.013);
  line([[side*.735,.78,.64],[side*.74,.78,-.93]],black,.009);
  const mirror=new THREE.Mesh(new THREE.SphereGeometry(1,16,8),black);mirror.position.set(side*.97,.875-origin,.49);mirror.scale.set(.135,.055,.09);body.add(mirror);cabinParts.push(mirror);
  line([[side*.73,.82,.52],[side*.90,.84,.48]],black,.023);
  const mirrorGlass=new THREE.Mesh(new THREE.SphereGeometry(1,12,6),lens);mirrorGlass.position.set(side*.974,.875-origin,.419);mirrorGlass.scale.set(.106,.038,.012);body.add(mirrorGlass);cabinParts.push(mirrorGlass);
 }
 // Rounded front fascia. Every opening follows the same bumper curvature,
 // so the lamps and ducts sit on the body instead of floating on a flat box.
 const frontZ=x=>nose-.20*Math.pow(Math.abs(x)/.82,2);
 const backZ=x=>tail+.10*Math.pow(Math.abs(x)/.82,2);
 const fascia=(x,h,frontFace=true,depth=.006)=>[x,h,(frontFace?frontZ(x)+depth:backZ(x)-depth)];
 loft([[.155,.73],[.24,.80],[.40,.82],[.56,.81],[.61,.79]].map(([h,w])=>[-1,-.8,-.5,0,.5,.8,1].map(t=>fascia(w*t,h,true,0))),paint,'sculpted front bumper');
 // Join the bonnet to the rounded bumper all the way across its leading edge.
 loft([0,1].map(t=>[-1,-.8,-.5,0,.5,.8,1].map(u=>{const x=.79*u;return [x,THREE.MathUtils.lerp(.61,section(nose).h+.015*(1-u*u),t),frontZ(x)];})),paint,'bonnet leading return');
 const mouth=[[-.49,.50],[.49,.50],[.59,.31],[.53,.245],[-.53,.245],[-.59,.31]];
 loft([[.245,.50],[.31,.59],[.50,.49]].map(([h,w])=>Array.from({length:21},(_,i)=>fascia(w*(i/10-1),h,true,.009))),black,'GR matrix intake');
 // Recessed diamond lattice, coarser than the reference for a mobile budget.
 for(let row=0;row<3;row++)for(let col=-6;col<=6;col++){
  const x=col*.074+(row%2)*.037,h=.285+row*.065;
  if(Math.abs(x)>.47)continue;
  line([[x-.032,h,frontZ(x-.032)+.010],[x,h+.027,frontZ(x)+.010],[x+.032,h,frontZ(x+.032)+.010]],trim,.0018);
 }
 for(const side of [-1,1]){
  const lamp=[[side*.415,0,nose-.026],[side*.59,0,nose-.045],[side*.779,0,nose-.23],[side*.795,0,nose-.46],[side*.73,0,nose-.43],[side*.57,0,nose-.18]].map(([x,h,z])=>[x,section(z).h+.036,z]);
  panel(lamp,black,'swept headlamp recess');
  // Silver projector barrels below an eyebrow signature instead of white blocks.
  for(const [x,z,r] of [[side*.665,nose-.22,.035],[side*.725,nose-.30,.029]]){
   const projector=new THREE.Mesh(new THREE.SphereGeometry(r,12,6),lens);projector.scale.y=.30;projector.position.set(x,section(z).h+.043-origin,z);body.add(projector);
  }
  line([[side*.435,0,nose-.029],[side*.585,0,nose-.083],[side*.744,0,nose-.26],[side*.777,0,nose-.39]].map(([x,h,z])=>[x,section(z).h+.047,z]),white,.006);
  const duct=[[side*.645,.48],[side*.75,.49],[side*.793,.30],[side*.738,.205],[side*.683,.26],[side*.685,.39]];
  panel(duct.map(([x,h])=>fascia(x,h,true,.012)),black,'deep corner air duct');
  line([[side*.664,.462],[side*.727,.465],[side*.757,.31]].map(([x,h])=>fascia(x,h,true,.018)),trim,.006);
  line([[side*.61,.22],[side*.68,.20],[side*.76,.22]].map(([x,h])=>fascia(x,h,true,.015)),paint,.015);
 }
 line([[-.75,.16],[0,.145],[.75,.16]].map(([x,h])=>fascia(x,h,true,.006)),black,.019);
 // Rear fascia closes the former open band between trunk and bumper.
 loft([[.16,.71],[.28,.82],[.46,.83],[.61,.83],[.735,.81]].map(([h,w])=>[-1,-.8,-.5,0,.5,.8,1].map(t=>fascia(w*t,h,false,0))),paint,'rounded rear bumper');
 panel([[-.68,.34],[.68,.34],[.74,.23],[.60,.155],[-.60,.155],[-.74,.23]].map(([x,h])=>fascia(x,h,false,.009)),black,'rear lower valance');
 line([[-.73,.738],[0,.745],[.73,.738]].map(([x,h])=>fascia(x,h,false,.003)),paint,.012);
 line([[-.77,.671],[-.39,.635],[.39,.635],[.77,.671]].map(([x,h])=>fascia(x,h,false,.017)),black,.015);
 for(const side of [-1,1]){
  panel([[side*.37,.72],[side*.73,.729],[side*.79,.65],[side*.73,.57],[side*.42,.59]].map(([x,h])=>fascia(x,h,false,.012)),black,'rear lamp housing');
  line([[side*.43,.697],[side*.70,.704],[side*.755,.656],[side*.69,.604],[side*.48,.609]].map(([x,h])=>fascia(x,h,false,.025)),red,.011);
  line([[side*.47,.64],[side*.66,.64]].map(([x,h])=>fascia(x,h,false,.021)),lens,.007);
  const exhaust=new THREE.Mesh(new THREE.CylinderGeometry(.048,.048,.16,20,1,true).rotateX(Math.PI/2),silver);exhaust.position.set(side*.60,.24-origin,tail+.005);body.add(exhaust);
  const hole=new THREE.Mesh(new THREE.CircleGeometry(.040,20),black);hole.position.set(side*.60,.24-origin,tail-.079);hole.rotation.y=Math.PI;body.add(hole);
  line([[side*.67,.35],[side*.74,.35]].map(([x,h])=>fascia(x,h,false,.015)),red,.007);
 }
 for(const x of [-.35,0,.35])box(x,.205,tail+.05,.014,.10,.17,black);
 box(0,.465,tail-.010,.32,.10,.015,black);
 for(const [h,z] of [[.57,nose+.016],[.60,tail-.019]]){const badge=new THREE.Mesh(new THREE.TorusGeometry(.025,.003,5,24),silver);badge.scale.x=1.45;badge.position.set(0,h-origin,z);body.add(badge);}
 // Visible seats and floor also in exterior views.
 box(0,.23,-.45,1.44,.04,1.60,black);for(const side of [-1,1]){box(side*.37,.38,-.43,.45,.12,.48,black);const seat=box(side*.37,.71,-.71,.43,.61,.11,black);seat.rotation.x=-.12;box(side*.37,1.08,-.78,.20,.17,.09,black);}

 // Wheels: 17-inch machined ten-spoke base wheels, independent physical hubs.
 const wheels=[];
 for(let i=0;i<4;i++){
  const pivot=new THREE.Group(),spin=new THREE.Group();pivot.add(spin);root.add(pivot);pivot.position.set((i%2?1:-1)*(i<2?GR86.frontTrack:GR86.rearTrack)/2,.299-origin,i<2?front:rear);
  const tyre=new THREE.Mesh(new THREE.CylinderGeometry(GR86.tireRadius,GR86.tireRadius,.195,48).rotateZ(Math.PI/2),rubber);tyre.castShadow=true;spin.add(tyre);
  const barrel=new THREE.Mesh(new THREE.CylinderGeometry(.212,.212,.207,40).rotateZ(Math.PI/2),black);spin.add(barrel);
  const disc=new THREE.Mesh(new THREE.CylinderGeometry(i<2?.147:.145,i<2?.147:.145,.025,36).rotateZ(Math.PI/2),silver);spin.add(disc);
  for(const side of [-1,1]){
   const ring=new THREE.Mesh(new THREE.TorusGeometry(.205,.010,6,40).rotateY(Math.PI/2),silver);ring.position.x=side*.107;spin.add(ring);
   const bead=new THREE.Mesh(new THREE.TorusGeometry(.260,.038,6,40).rotateY(Math.PI/2),rubber);bead.position.x=side*.074;spin.add(bead);
   for(let k=0;k<10;k++){const a=k*Math.PI/5,spoke=new THREE.Mesh(new THREE.BoxGeometry(.012,.155,.020),silver);spoke.position.set(side*.110,Math.cos(a)*.12,Math.sin(a)*.12);spoke.rotation.x=a;spin.add(spoke);}
   const cap=new THREE.Mesh(new THREE.CylinderGeometry(.036,.036,.02,20).rotateZ(Math.PI/2),silver);cap.position.x=side*.110;spin.add(cap);
  }
  const caliper=new THREE.Mesh(new THREE.BoxGeometry(.042,.11,.05),black);caliper.position.set(i%2?.07:-.07,.03,-.12);pivot.add(caliper);wheels.push({pivot,spin});
 }
 const shadow=new THREE.Mesh(new THREE.PlaneGeometry(4.6,2),new THREE.MeshBasicMaterial({color:0x11151b,transparent:true,opacity:.16,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.rotation.z=Math.PI/2;root.add(shadow);
 // Driver-facing cabin. Digital GR86 display, three HVAC knobs and 3-spoke wheel.
 const cockpit=new THREE.Group();body.add(cockpit);cockpit.visible=false;
 const cabin=new THREE.MeshStandardMaterial({color:0x14171c,roughness:.94,side:THREE.DoubleSide});
 const dashRows=[[-.72,.77],[-.61,.83],[-.20,.83],[.05,.83],[.22,.865],[.52,.865],[.68,.81],[.72,.77]].map(([x,h])=>[[x,.58,.55],[x,h-.035,.51],[x,h,.64],[x,h-.04,.85]].map(local));
 const dashIndices=[];for(let j=0;j<dashRows.length-1;j++)for(let i=0;i<3;i++){const a=j*4+i,b=a+4;dashIndices.push(a,b,a+1,a+1,b,b+1);}mesh(dashRows.flat(),dashIndices,cabin,cockpit,false,'dashboard');
 for(const x of [-.61,.63]){const vent=new THREE.Mesh(new THREE.TorusGeometry(.043,.008,6,24),trim);vent.position.set(x,.79-origin,.503);cockpit.add(vent);const hole=new THREE.Mesh(new THREE.CircleGeometry(.038,24),black);hole.position.copy(vent.position);hole.position.z+=.002;cockpit.add(hole);for(let k=-1;k<=1;k++)box(x,.79+k*.018,.501,.063,.003,.002,trim,cockpit);}
 box(-.07,.928,.51,.26,.046,.035,black,cockpit);for(let i=0;i<4;i++)box(-.17+i*.055,.928,.490,.041,.004,.004,trim,cockpit);
 
 box(0,.23,-.3,1.48,.04,1.8,cabin,cockpit);box(-.08,.42,-.02,.25,.34,1.02,cabin,cockpit);
 for(const side of [-1,1]){box(side*.727,.59,-.27,.07,.37,1.28,cabin,cockpit);box(side*.702,.69,-.33,.035,.04,.54,trim,cockpit);line([[side*.72,.79,.67],[side*.67,.95,.39],[side*.57,1.21,-.08]],cabin,.022,cockpit);}
 box(0,1.21,-.08,1.15,.04,.04,cabin,cockpit);box(0,1.255,-.52,1.2,.04,.88,cabin,cockpit);
 const screenMat=new THREE.MeshBasicMaterial({color:0x080d15,side:THREE.DoubleSide});
 box(.37,.87,.523,.38,.17,.035,cabin,cockpit,'instrument hood');box(.37,.855,.500,.325,.115,.008,screenMat,cockpit,'7-inch digital cluster');
 box(-.07,.83,.493,.195,.125,.014,screenMat,cockpit,'8-inch infotainment');
 for(let i=0;i<3;i++){const dial=new THREE.Mesh(new THREE.CylinderGeometry(.027,.027,.016,20).rotateX(Math.PI/2),trim);dial.position.set(-.16+i*.088,.659-origin,.49);cockpit.add(dial);}
 box(-.07,.60,.492,.22,.023,.012,trim,cockpit);box(-.07,.475,.25,.045,.06,.055,cabin,cockpit);
 const shifter=new THREE.Mesh(new THREE.SphereGeometry(.025,12,8),trim);shifter.position.set(-.07,.525-origin,.22);cockpit.add(shifter);
 const steeringWheel=new THREE.Group();steeringWheel.position.set(.37,.735-origin,.295);cockpit.add(steeringWheel);
 const steeringMaterial=new THREE.MeshStandardMaterial({color:0x101216,roughness:.75,side:THREE.DoubleSide});
 steeringWheel.add(new THREE.Mesh(new THREE.TorusGeometry(.175,.018,8,48),steeringMaterial));
 const wheelHub=new THREE.Mesh(new THREE.CylinderGeometry(.063,.063,.043,24).rotateX(Math.PI/2),steeringMaterial);steeringWheel.add(wheelHub);
 for(const side of [-1,1]){const spoke=new THREE.Mesh(new THREE.BoxGeometry(.13,.044,.022),trim);spoke.position.set(side*.108,0,0);spoke.rotation.z=side*.16;steeringWheel.add(spoke);}
 const spoke=new THREE.Mesh(new THREE.BoxGeometry(.045,.10,.025),trim);spoke.position.y=-.11;steeringWheel.add(spoke);
 // Screen texture only contains instruments; geometry remains usable without DOM.
 let canvas,ctx,texture,clusterFace;
 if(typeof document!=='undefined'){
  canvas=document.createElement('canvas');canvas.width=768;canvas.height=256;ctx=canvas.getContext('2d');
  if(ctx){texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;clusterFace=new THREE.Mesh(new THREE.PlaneGeometry(.319,.109),new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide}));clusterFace.rotation.y=Math.PI;clusterFace.position.set(.37,.855-origin,.494);cockpit.add(clusterFace);}
 }
 let lastText='',lastDraw=-Infinity;
 function updateInstruments(speed,rpm,gear,time=0){if(time<lastDraw)lastDraw=-Infinity;if(!ctx||time-lastDraw<.1)return;const key=`${Math.round(speed)}:${Math.round(rpm/100)}:${gear}`;if(key===lastText)return;lastText=key;lastDraw=time;
  ctx.fillStyle='#080d15';ctx.fillRect(0,0,768,256);ctx.strokeStyle='#76848f';ctx.lineWidth=4;ctx.beginPath();ctx.arc(350,155,115,Math.PI*.85,Math.PI*2.15);ctx.stroke();
  ctx.strokeStyle=rpm>6500?'#ec4949':'#e7edf1';ctx.lineWidth=11;ctx.beginPath();ctx.arc(350,155,115,Math.PI*.85,Math.PI*.85+Math.PI*1.3*Math.min(rpm/8000,1));ctx.stroke();
  ctx.textAlign='center';ctx.fillStyle='#f2f5f8';ctx.font='bold 76px sans-serif';ctx.fillText(Math.round(speed),350,164);ctx.font='20px sans-serif';ctx.fillText('km/h',350,197);
  ctx.font='bold 83px sans-serif';ctx.fillText(String(gear),548,151);ctx.font='22px sans-serif';ctx.fillText('GEAR',548,191);ctx.textAlign='left';ctx.font='24px sans-serif';ctx.fillText('GR 86',35,49);ctx.font='18px sans-serif';ctx.fillStyle='#9daab5';ctx.fillText('0   2   4   6   8',255,37);texture.needsUpdate=true;
 }
 updateInstruments(0,900,'N',1);
 // Keep compatibility with older instrumentation hooks; digital screen is active.
 const speedNeedle=new THREE.Group(),rpmNeedle=new THREE.Group();
 const eye=new THREE.Vector3(.37,1.12-origin,-.13);
 // Consolidate opaque pieces by material to avoid hundreds of draw calls on iOS.
 function consolidate(group,deform=false){
  const sets=new Map();for(const o of [...group.children]){if(!o.isMesh||o.material.transparent||cabinParts.includes(o))continue;const list=sets.get(o.material)||[];list.push(o);sets.set(o.material,list);}
  for(const [mat,list] of sets){if(list.length<2)continue;const positions=[],indices=[];for(const o of list){o.updateMatrix();const p=o.geometry.attributes.position,idx=o.geometry.index?.array||Array.from({length:p.count},(_,i)=>i),offset=positions.length/3;
    for(let i=0;i<p.count;i++){const v=new THREE.Vector3().fromBufferAttribute(p,i).applyMatrix4(o.matrix);positions.push(v.x,v.y,v.z);}for(const i of idx)indices.push(i+offset);group.remove(o);const at=deformables.findIndex(p=>p.mesh===o);if(at>=0)deformables.splice(at,1);o.geometry.dispose();}
   const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();const o=new THREE.Mesh(g,mat);o.castShadow=true;o.receiveShadow=true;group.add(o);if(deform)deformables.push({mesh:o,base:Float32Array.from(positions)});
  }
 }
 consolidate(body,true);consolidate(cockpit);consolidate(steeringWheel);for(const w of wheels)consolidate(w.spin);
 
 return {root,body,wheels,deformables,shadow,cabinParts,cockpit,steeringWheel,speedNeedle,rpmNeedle,glass,eye,updateInstruments,dimensions:{length:GR86.length,width:GR86.width,height:GR86.height},modelNote:'Original approximate GR86 reconstruction; not a scan.'};
}
