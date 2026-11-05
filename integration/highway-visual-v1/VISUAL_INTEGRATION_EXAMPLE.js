// Integration example v1.0.0; detached from the game loop. No vehicle/AI writes.
import * as T from './reference/three.module.js';
export const SEGMENT_LENGTH=200;
// A42-compatible read-only adapter. s is global Z parameter, NOT arc distance.
export function createA42RoadAdapter(road){
 const scratch=new T.Vector3(),axisR=new T.Vector3(),axisF=new T.Vector3(),axisU=new T.Vector3(),rotation=new T.Matrix4();
 return {
  roadId:'highway-main',parameterization:'legacy-global-z-v1',
  segmentKey:s=>Math.floor(s/SEGMENT_LENGTH),
  seed:()=>road.seed,origin:()=>road.origin,
  createFrame:()=>({position:new T.Vector3(),right:new T.Vector3(),up:new T.Vector3(),forward:new T.Vector3(),quaternion:new T.Quaternion()}),
  sampleFrame(out,s,t=0,{alignment='upright',facing=1}={}){
   if(!Number.isFinite(s+t)||![-1,1].includes(facing)||!['upright','surface'].includes(alignment))throw Error('Invalid frame request');
   const p=road.point(s,t),g=road.gradient(s),n=Math.hypot(1,g),g2=road.curvature(s);
   out.position.set(p.x,p.y,p.z);axisR.set(1/n,0,-g/n);
   if(alignment==='surface'){
    // Derivative of the ACTUAL legacy offset surface, no bank or arc-length assumption.
    const grade=road.heightGradient?road.heightGradient(s):5/950*Math.cos(s/950)+2/380*Math.cos(s/380);
    axisF.set(g-t*g*g2/n**3,grade,1-t*g2/n**3).normalize();
    axisU.crossVectors(axisF,axisR).normalize();
   }else{axisF.set(g/n,0,1/n);axisU.set(0,1,0);}
   out.right.copy(axisR).multiplyScalar(facing);out.up.copy(axisU);out.forward.copy(axisF).multiplyScalar(facing);
   rotation.makeBasis(out.right,out.up,out.forward);out.quaternion.setFromRotationMatrix(rotation).normalize();return out;
  },
  // Current host chunks only translate world Z; X and Y remain world-like in the mesh.
  toSegmentLocal(out,frame,segment){return out.copy(frame.position).add(scratch.set(0,0,road.origin-segment.s0));},
  // Future spline/arc-length/banking adapter must implement the same frame methods,
  // but publish a DIFFERENT parameterization ID and a full chunk transform.
 };
}
// Provider supplies render resources only. Host supplies all road positions.
export class VisualAssetRegistry{
 constructor(){this.assets=new Map();}
 register(descriptor,parts){
  if(!descriptor?.id||descriptor.units!=='m'||descriptor.pivot!=='ground'||descriptor.frontAxis!=='+Z'||!Array.isArray(parts)||!parts.length)throw Error('Invalid asset contract');
  if(this.assets.has(descriptor.id))throw Error('Duplicate asset');
  for(const p of parts)if(!p.geometry?.isBufferGeometry||!p.material?.isMaterial||Array.isArray(p.material))throw Error('Use one geometry/material per part');
  this.assets.set(descriptor.id,{descriptor,parts});return this;
 }
 get(id){const a=this.assets.get(id);if(!a)throw Error('Unregistered asset '+id);return a;}
 // Only host calls shutdown after every segment has released instance buffers.
 dispose(){const g=new Set(),m=new Set(),textures=new Set();for(const a of this.assets.values())for(const p of a.parts){g.add(p.geometry);m.add(p.material);for(const v of Object.values(p.material))if(v?.isTexture)textures.add(v);}for(const v of g)v.dispose();for(const v of m)v.dispose();for(const v of textures)v.dispose();this.assets.clear();}
}
// s0<=anchor.s<s1 owns the anchor; global period/phase avoids seam duplicates.
export function periodicAnchors(segment,{id,assetId,t,spacing,phase=0,lift=0,facing=1,alignment='upright'}){
 if(!Number.isFinite(spacing+phase+segment.s0+segment.s1)||!(spacing>0)||!(segment.s1>segment.s0))throw Error('Invalid spacing/segment');const a=[];
 for(let i=Math.ceil((segment.s0-phase)/spacing);;i++){const s=phase+i*spacing;if(s>=segment.s1)break;a.push({id:id+':'+i,assetId,s,t,lift,facing,alignment});}
 return a;
}
export function createSegmentVisuals(adapter,registry,segment,anchors){
 const root=new T.Group(),batches=[];root.position.z=segment.s0-adapter.origin();
 const frame=adapter.createFrame(),local=new T.Vector3(),scale=new T.Vector3(1,1,1),matrix=new T.Matrix4(),partMatrix=new T.Matrix4();
 const grouped=new Map();for(const a of anchors){if(a.s<segment.s0||a.s>=segment.s1)throw Error('Wrong segment owner');if(!grouped.has(a.assetId))grouped.set(a.assetId,[]);grouped.get(a.assetId).push(a);}
 for(const [id,list] of grouped){const asset=registry.get(id);for(const part of asset.parts){const batch=new T.InstancedMesh(part.geometry,part.material,list.length);batch.castShadow=false;batch.receiveShadow=true;
  for(let i=0;i<list.length;i++){const a=list[i];adapter.sampleFrame(frame,a.s,a.t,{alignment:a.alignment||'upright',facing:a.facing||1});adapter.toSegmentLocal(local,frame,segment);local.addScaledVector(frame.up,a.lift||0);matrix.compose(local,frame.quaternion,scale);partMatrix.copy(matrix);if(part.localMatrix)partMatrix.multiply(part.localMatrix);batch.setMatrixAt(i,partMatrix);}
  batch.instanceMatrix.needsUpdate=true;batch.computeBoundingBox();batch.computeBoundingSphere();root.add(batch);batches.push(batch);
 }}
 let released=false;return {root,segment,batches,rebase(){if(!released)root.position.z=segment.s0-adapter.origin();},release(){if(released)return;released=true;root.removeFromParent();for(const b of batches){b.removeFromParent();b.dispose();}batches.length=0;}};
}
// Small demonstrator: one material, one part, geometry baked to ground pivot.
export function exampleRegistry(){const r=new VisualAssetRegistry(),geo=new T.BoxGeometry(.18,1.5,.18);geo.translate(0,.75,0);r.register({id:'demo.reflector-post',units:'m',pivot:'ground',frontAxis:'+Z'},[{geometry:geo,material:new T.MeshStandardMaterial({color:0xe9e6db,roughness:.8})}]);return r;}
