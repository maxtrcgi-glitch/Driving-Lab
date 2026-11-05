import {buildGR86} from './gr86-model.js';
import {GR86} from './vehicle-spec.js';
import * as THREE from './three.module.js';
import {points,segments,courseLength,elevation,barriers,terrain as contactTerrain,nearest,roadHalfWidth,runoffHalfWidth} from './course.js';
export function buildWorld(){
 const scene=new THREE.Scene();scene.background=new THREE.Color(0xa5bdc8);scene.fog=new THREE.FogExp2(0xa5bdc8,.0017);
 // Small original sky panorama supplies coherent reflections without image downloads.
 const ew=128,eh=64,pixels=new Uint8Array(ew*eh*4);
 for(let y=0;y<eh;y++)for(let x=0;x<ew;x++){const t=y/(eh-1),i=(y*ew+x)*4,sky=t<.52,light=Math.exp(-((x/ew-.18)**2/.004+(t-.31)**2/.009))*95;const c=sky?[105+70*t,147+60*t,182+35*t]:[65,76,62];pixels[i]=Math.min(255,c[0]+light);pixels[i+1]=Math.min(255,c[1]+light);pixels[i+2]=Math.min(255,c[2]+light);pixels[i+3]=255;}
 const environment=new THREE.DataTexture(pixels,ew,eh);environment.mapping=THREE.EquirectangularReflectionMapping;environment.colorSpace=THREE.SRGBColorSpace;environment.needsUpdate=true;scene.environment=environment;scene.environmentIntensity=.55;
 const hemi=new THREE.HemisphereLight(0xdcecf6,0x4c5746,2.0);scene.add(hemi);
 const sun=new THREE.DirectionalLight(0xffead1,2.6);sun.position.set(60,95,45);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-32;sun.shadow.camera.right=32;sun.shadow.camera.top=32;sun.shadow.camera.bottom=-32;sun.shadow.camera.near=1;sun.shadow.camera.far=220;sun.shadow.bias=-.0007;sun.shadow.normalBias=.03;scene.add(sun);scene.add(sun.target);
 const materials={grass:new THREE.MeshStandardMaterial({color:0x667656,roughness:1}),road:new THREE.MeshStandardMaterial({color:0x343b40,roughness:.96}),gravel:new THREE.MeshStandardMaterial({color:0xa3977b,roughness:1}),metal:new THREE.MeshStandardMaterial({color:0x8c9699,metalness:.6,roughness:.55}),dark:new THREE.MeshStandardMaterial({color:0x303938,roughness:.85}),white:new THREE.MeshStandardMaterial({color:0xe5e5d8,roughness:.75}),red:new THREE.MeshStandardMaterial({color:0xc6543c,roughness:.75})};
 const terrain=new THREE.PlaneGeometry(1600,1600,160,160);terrain.rotateX(-Math.PI/2);const pos=terrain.attributes.position;
 for(let i=0;i<pos.count;i++){const x=pos.getX(i),z=pos.getZ(i);pos.setY(i,elevation(x,z)-.30);}terrain.computeVertexNormals();
 const ground=new THREE.Mesh(terrain,materials.grass);ground.receiveShadow=true;scene.add(ground);
 function ribbon(inner,outer,material,raised=.015,alternating=false){
  const vertices=[],indices=[],colors=[];
  for(let i=0;i<=points.length;i++){
   const k=i%points.length,p=points[k],prev=points[(k-1+points.length)%points.length],next=points[(k+1)%points.length],dx=next.x-prev.x,dz=next.z-prev.z,l=Math.hypot(dx,dz),nx=dz/l,nz=-dx/l;
   for(let offset of [inner,outer]){const x=p.x+nx*offset,z=p.z+nz*offset;vertices.push(x,contactTerrain(x,z).height+raised,z);if(alternating){const c=new THREE.Color(Math.floor(segments[k]?.start/3)%2?0xdbd8ca:0xb64c39);colors.push(c.r,c.g,c.b);}}
   if(i<points.length){const a=i*2;indices.push(a,a+2,a+1,a+1,a+2,a+3);}
  }
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geo.setIndex(indices);if(alternating)geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geo.computeVertexNormals();
  const mesh=new THREE.Mesh(geo,material);mesh.receiveShadow=true;scene.add(mesh);return mesh;
 }
 ribbon(-runoffHalfWidth,runoffHalfWidth,materials.gravel,.005);const trackRoad=ribbon(-roadHalfWidth,roadHalfWidth,materials.road,.02);
 const curb=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.85,side:THREE.DoubleSide});for(const sign of [-1,1])for(const [a,b] of [[5,5.2],[5.2,5.45],[5.45,5.65]])ribbon(sign*a,sign*b,curb,.02,true);
 const lineMat=new THREE.MeshBasicMaterial({color:0xd7d5c9,side:THREE.DoubleSide});ribbon(-4.78,-4.68,lineMat,.027);ribbon(4.68,4.78,lineMat,.027);
 function box(x,y,z,sx,sy,sz,mat,shadow=true){const mesh=new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz),mat);mesh.position.set(x,y,z);mesh.castShadow=shadow;mesh.receiveShadow=true;scene.add(mesh);return mesh;}
 // Open paved test area: braking, slalom, skidpad, bumps and collision targets.
 box(87.5,-.045,2.5,89,.06,153,materials.road,false);
 box(159,-.045,2.5,30,.06,153,materials.road,false);
 box(138,-.045,-54.5,12,.06,39,materials.road,false);
 box(138,-.045,52,12,.06,54,materials.road,false);
 const bumpGeo=new THREE.PlaneGeometry(12,60,2,240);bumpGeo.rotateX(-Math.PI/2);const bp=bumpGeo.attributes.position;
 for(let i=0;i<bp.count;i++){const x=bp.getX(i)+138,z=bp.getZ(i)-5;bp.setXYZ(i,x,elevation(x,z)+.03,z);}bumpGeo.computeVertexNormals();
 const bumpMesh=new THREE.Mesh(bumpGeo,materials.road);bumpMesh.receiveShadow=true;scene.add(bumpMesh);
 for(let z=-60;z<=65;z+=10)box(90,.007,z,.10,.014,3,materials.white,false);
 for(let x of [60,119,130,146,164])box(x,.009,2.5,.1,.015,143,materials.white,false);
 for(let z=-32;z<26;z+=2)box(138,elevation(138,z)+.01,z,11,.02,.18,materials.gravel,false);
 const ringGeo=new THREE.RingGeometry(17.9,18.05,96);ringGeo.rotateX(-Math.PI/2);const ring=new THREE.Mesh(ringGeo,lineMat);ring.position.set(76,.013,0);scene.add(ring);
 const coneMat=new THREE.MeshStandardMaterial({color:0xdd6c30,roughness:.7});
 for(let i=0;i<8;i++){const cone=new THREE.Mesh(new THREE.ConeGeometry(.23,.7,10),coneMat);cone.position.set(i%2?113:109,.35,-43+i*10);cone.castShadow=true;scene.add(cone);}
 for(const b of barriers){if(b.type==='pole'){const p=new THREE.Mesh(new THREE.CylinderGeometry(b.r,b.r,b.height,16),materials.metal);p.position.set(b.x,b.height/2,b.z);p.castShadow=true;scene.add(p);}else box(b.x,b.height/2,b.z,1.5,b.height,1.4,materials.gravel);}
 for(let i=0;i<8;i++)box(83+i*2,.83,52.27,.9,.19,.02,i%2?materials.white:materials.red,false);
 // Procedural distant trees; deterministic layout avoids downloads and asset licenses.
 let seed=174;const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 const trunkMat=new THREE.MeshStandardMaterial({color:0x625645}),leafMat=new THREE.MeshStandardMaterial({color:0x445d41,roughness:1});
 const trunkGeo=new THREE.CylinderGeometry(.17,.27,3,6),leafGeo=new THREE.ConeGeometry(2.1,7,7);
 const trunks=new THREE.InstancedMesh(trunkGeo,trunkMat,160),leaves=new THREE.InstancedMesh(leafGeo,leafMat,160),dummy=new THREE.Object3D();let count=0;
 for(let tries=0;tries<1500&&count<160;tries++){
  const x=-650+rnd()*950,z=-520+rnd()*1050;if(x>30&&x<190&&z>-90&&z<95)continue;
  if(nearest(x,z).distance<20)continue;
  const h=elevation(x,z),scale=.7+rnd()*.65;dummy.position.set(x,h+1.5*scale,z);dummy.scale.set(scale,scale,scale);dummy.rotation.set(0,0,0);dummy.updateMatrix();trunks.setMatrixAt(count,dummy.matrix);
  dummy.position.y=h+5*scale;dummy.updateMatrix();leaves.setMatrixAt(count,dummy.matrix);count++;
 }trunks.count=leaves.count=count;scene.add(trunks,leaves);
 // 150 / 100 / 50 m boards before the first hairpin approach.
 for(const [z,metres] of [[180,150],[230,100],[280,50]]){
  box(8,.75,z,.12,1.5,.12,materials.metal,false);
  box(8,1.5,z,1.6,.85,.12,materials.white,false);
  if(typeof document!=='undefined'){
   const canvas=document.createElement('canvas');canvas.width=512;canvas.height=256;const context=canvas.getContext('2d');
   if(context){context.fillStyle='#f5f4e9';context.fillRect(0,0,512,256);context.fillStyle='#172025';context.font='bold 180px sans-serif';context.textAlign='center';context.textBaseline='middle';context.fillText(String(metres),256,140);
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
    const face=new THREE.Mesh(new THREE.PlaneGeometry(1.6,.85),new THREE.MeshBasicMaterial({map:texture}));face.position.set(8,1.5,z-.066);face.rotation.y=Math.PI;scene.add(face);
   }
  }else for(let j=0;j<metres/50;j++)box(7.5+j*.45,1.5,z-.08,.15,.60,.02,materials.dark,false);
 }
 // Start stripe at z=0 on the straight, with a small pit marker.
 for(let i=0;i<10;i++)for(let j=0;j<2;j++)box(-4.5+i,elevation(-4.5+i,j*.65)+.04,j*.65,1,.04,.65,(i+j)%2?materials.dark:materials.white,false);
 return {scene,sun,materials,courseLength,trackRoad};
}
export const buildCar=buildGR86;
