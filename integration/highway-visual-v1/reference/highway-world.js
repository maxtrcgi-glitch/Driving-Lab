import * as T from './three.module.js';
import {CHUNK,hash,MAX_TRAFFIC} from './highway.js';
// Eight bounded road chunks; geometry is recycled, never accumulated by distance.
export function buildHighwayWorld(road){
 const root=new T.Group(),chunks=new Map();root.visible=false;
 const mat=(color,roughness=.85)=>new T.MeshStandardMaterial({color,roughness});
 const materials={road:mat(0x343b40),grass:mat(0x697453),shoulder:mat(0xaaa18b),line:mat(0xe6e5d3),barrier:mat(0xa8aaa4),trunk:mat(0x645b48),leaves:mat(0x445b44),glass:mat(0x182b35,.25),rubber:mat(0x191c20),lights:new T.MeshBasicMaterial({color:0xffe6b6}),brakes:new T.MeshBasicMaterial({color:0xef3d28})};
 const box=new T.BoxGeometry(1,1,1),cone=new T.IcosahedronGeometry(.65,1),cylinder=new T.CylinderGeometry(1,1,1,10);cylinder.rotateZ(Math.PI/2);
 const grain=new Uint8Array(64*64*4);for(let i=0;i<4096;i++){const c=185+Math.floor(hash(i+17)*50);grain[i*4]=grain[i*4+1]=grain[i*4+2]=c;grain[i*4+3]=255;}
 const asphalt=new T.DataTexture(grain,64,64);asphalt.wrapS=asphalt.wrapT=T.RepeatWrapping;asphalt.magFilter=T.LinearFilter;asphalt.minFilter=T.LinearMipmapLinearFilter;asphalt.generateMipmaps=true;asphalt.needsUpdate=true;materials.road.map=asphalt;
 const dummy=new T.Object3D();
 function strip(start,left,right,lift,material){const v=[],idx=[],uv=[];for(let i=0;i<=40;i++){for(const o of [left,right]){const p=road.point(start+i*5,o);v.push(p.x,p.y+lift,p.z+road.origin-start);uv.push(o*.5,(start+i*5)*.5);}}for(let i=0;i<40;i++){const a=i*2;idx.push(a,a+2,a+1,a+1,a+2,a+3);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(v,3));g.setIndex(idx);g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.computeVertexNormals();const m=new T.Mesh(g,material);m.receiveShadow=true;return m;}
 function instances(geometry,material,items){const m=new T.InstancedMesh(geometry,material,items.length);items.forEach((p,i)=>{dummy.position.set(p.x,p.y,p.z);dummy.rotation.set(0,p.yaw||0,0);dummy.scale.set(p.w,p.h,p.l);dummy.updateMatrix();m.setMatrixAt(i,dummy.matrix);});m.instanceMatrix.needsUpdate=true;m.receiveShadow=true;return m;}
 function chunk(k){const g=new T.Group(),start=k*CHUNK;g.add(strip(start,-160,160,-.04,materials.grass),strip(start,-16,-14,.003,materials.shoulder),strip(start,14,16,.003,materials.shoulder),strip(start,-14,14,0,materials.road),strip(start,-1.6,1.6,.012,materials.grass));
  for(const o of [-13.4,-2.1,2.1,13.4])g.add(strip(start,o-.06,o+.06,.018,materials.line));
  const dashes=[],walls=[],trees=[],trunks=[],posts=[];
  for(let ds=0;ds<CHUNK;ds+=12)for(const o of [-9.2,-5.6,5.6,9.2]){const p=road.point(start+ds+2,o);dashes.push({...p,z:p.z+road.origin-start,y:p.y+.025,w:.12,h:.015,l:4});}
  for(let ds=0;ds<CHUNK;ds+=5)for(const o of [-14.2,-1.3,1.3,14.2]){const p=road.point(start+ds+2.5,o);walls.push({...p,z:p.z+road.origin-start,y:p.y+.4,w:1.1,h:.8,l:5.03});}
  for(let ds=0;ds<CHUNK;ds+=40)for(const side of [-1,1]){const p=road.point(start+ds,side*15.9);posts.push({...p,z:p.z+road.origin-start,y:p.y+.75,w:.1,h:1.5,l:.15});}
  for(let i=0;i<26;i++){const r=hash(k*73+i+road.seed*93),p=road.point(start+hash(k*211+i*3)*CHUNK,(i%2?1:-1)*(24+r*110)),h=5+hash(i+k*91)*8;trees.push({...p,z:p.z+road.origin-start,y:p.y+h*.65,w:h*.42,h:h,l:h*.42});trunks.push({...p,z:p.z+road.origin-start,y:p.y+1.5,w:.35,h:3,l:.35});}
  g.add(instances(box,materials.line,dashes),instances(box,materials.barrier,walls),instances(box,materials.line,posts),instances(cone,materials.leaves,trees),instances(box,materials.trunk,trunks));root.add(g);chunks.set(k,g);return g;
 }
 const palette=[0xe7e8e5,0x333e50,0xa94334,0x869aa7,0xc3b99c,0x405e58,0x252a30];
 const traffic=new T.Group();root.add(traffic);const models=new Map(),batches={};
 const paintMaterial=mat(0xffffff,.35);
 for(const [name,geometry,material,capacity]of [['paint',box,paintMaterial,MAX_TRAFFIC*4],['glass',box,materials.glass,MAX_TRAFFIC],['cargo',box,materials.line,MAX_TRAFFIC],['tires',cylinder,materials.rubber,MAX_TRAFFIC*4],['headlights',box,materials.lights,MAX_TRAFFIC*2],['taillights',box,materials.brakes,MAX_TRAFFIC*3]]){const m=new T.InstancedMesh(geometry,material,capacity);m.instanceMatrix.setUsage(T.DynamicDrawUsage);m.castShadow=true;m.frustumCulled=false;traffic.add(m);batches[name]=m;}
 const color=new T.Color();
 function part(name,c,x,y,z,w,h,l){const m=batches[name],i=m.count++,sn=Math.sin(c.yaw),cs=Math.cos(c.yaw);dummy.position.set(c.x+cs*x+sn*z,c.y+y,c.z-sn*x+cs*z);dummy.rotation.set(0,c.yaw,0);dummy.scale.set(w,h,l);dummy.updateMatrix();m.setMatrixAt(i,dummy.matrix);if(name==='paint')m.setColorAt(i,color.setHex(palette[c.id%palette.length]));}
 function updateTraffic(){for(const m of Object.values(batches))m.count=0;models.clear();for(const c of road.cars){models.set(c.id,c);const l=c.length,w=c.width;part('paint',c,0,.62,0,w,.62,l);
  if(c.truck){part('cargo',c,0,1.65,-.65,w*.97,1.55,l*.68);part('glass',c,0,1.24,l*.34,w*.9,.5,1.25);}else{part('glass',c,0,1.12,-.22,w*.82,.48,l*.49);part('paint',c,0,1.39,-.22,w*.78,.07,l*.43);part('paint',c,0,.86,l*.34,w*.94,.13,l*.25);}
  for(const x of [-w*.48,w*.48])for(const z of [-l*.3,l*.3])part('tires',c,x,.33,z,.24,.32,.32);
  for(const x of [-w*.34,w*.34]){part('headlights',c,x,.72,l*.5+.01,.32,.12,.035);part('taillights',c,x,.72,-l*.5-.015,.34,.13,.035);}if(c.braking)part('taillights',c,0,.93,-l*.5-.02,.65,.06,.035);
 }for(const m of Object.values(batches)){m.instanceMatrix.needsUpdate=true;if(m.instanceColor)m.instanceColor.needsUpdate=true;}}
 function clear(){for(const g of chunks.values()){g.traverse(o=>{if(o.isInstancedMesh)o.dispose();else if(o.isMesh)o.geometry.dispose();});root.remove(g);}chunks.clear();}
 let seed=road.seed;
 function update(s){if(seed!==road.seed){clear();seed=road.seed;}const k=Math.floor(s/CHUNK);for(const [key,g]of chunks)if(key<k-2||key>k+5){g.traverse(o=>{if(o.isInstancedMesh)o.dispose();else if(o.isMesh)o.geometry.dispose();});root.remove(g);chunks.delete(key);}for(let j=k-2;j<=k+5;j++){const g=chunks.get(j)||chunk(j);g.position.z=j*CHUNK-road.origin;}
  updateTraffic();
 }
 return {root,update,clear,chunks,models,materials};
}
