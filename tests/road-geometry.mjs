import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Highway,LANES} from '../dist/highway.js';
import {buildHighwayWorld} from '../dist/highway-world.js';
import {ROAD_BLOCK} from '../dist/road-geometry.js';
const rows=[],eps=.001;
const frame=()=>({position:[],forward:[],right:[],up:[]});
for(const seed of [86,917,2027,99881]){
 const h=new Highway(seed),f=frame();let maxCurvature=0,maxGrade=0,maxHeight=0,maxHeading=0,minMetric=Infinity,straight=0,samples=0;
 for(let s=-4800;s<100000;s+=13){h.frame(s,0,f);maxCurvature=Math.max(maxCurvature,Math.abs(f.curvature));maxGrade=Math.max(maxGrade,Math.abs(f.grade));maxHeight=Math.max(maxHeight,Math.abs(f.position[1]));maxHeading=Math.max(maxHeading,Math.abs(f.yaw));if(Math.abs(f.curvature)<1e-8)straight++;samples++;
  for(const t of LANES){const p=h.point(s,t),q=h.project(p.x,p.z);assert.ok(Math.abs(q.s-s)<1e-6);assert.ok(Math.abs(q.offset-t)<1e-6);minMetric=Math.min(minMetric,h.metric(s,t));h.frame(s,t,f);for(const a of [f.right,f.up,f.forward])assert.ok(Math.abs(Math.hypot(...a)-1)<1e-12);assert.ok(Math.abs(f.right.reduce((sum,x,i)=>sum+x*f.forward[i],0))<1e-12);
   const dz=(h.terrain(p.x,p.z+.02).height-h.terrain(p.x,p.z-.02).height)/.04,dx=(h.terrain(p.x+.02,p.z).height-h.terrain(p.x-.02,p.z).height)/.04,n=Math.hypot(dx,1,dz);assert.ok(Math.abs(f.up[0]+dx/n)<1e-6);assert.ok(Math.abs(f.up[2]+dz/n)<1e-6);
  }
 }
 // Both transition boundaries and block joins, including negative/large coordinates.
 for(let k=-2;k<22;k++){const p=h.geometry.profile(k),o=k*ROAD_BLOCK;for(const s of [o,o+p.start,o+p.start+p.rise,o+p.start+p.rise+p.hold,o+p.start+p.rise+p.hold+p.fall,o+p.hillStart,o+p.hillStart+p.hillRise,o+p.hillStart+p.hillRise+p.hillHold,o+p.hillStart+p.hillRise+p.hillHold+p.hillFall,o+ROAD_BLOCK]){const a={},b={};h.geometry.sample(s-eps,a);h.geometry.sample(s+eps,b);for(const key of ['x','y'])assert.ok(Math.abs(a[key]-b[key])<.001);for(const key of ['g','grade'])assert.ok(Math.abs(a[key]-b[key])<3e-6);for(const key of ['g2','y2'])assert.ok(Math.abs(a[key]-b[key])<1e-7);}}
 assert.ok(maxCurvature<.0012);assert.ok(maxGrade<.04);assert.ok(maxHeight<=22);assert.ok(minMetric>.98);assert.ok(straight/samples>.2);rows.push({seed,maxCurvaturePerM:maxCurvature,minRadiusM:1/maxCurvature,maxGradePercent:maxGrade*100,maxHeightM:maxHeight,maxHeadingDeg:maxHeading*180/Math.PI,straightSampleFraction:straight/samples,minLaneMetric:minMetric});
}
const h=new Highway(86),w=buildHighwayWorld(h);let meshes=0,disposed=0,created=0,maxBlocks=0;
for(let s=0;s<=500000;s+=2000){h.origin=Math.floor(s/2000)*2000;w.update(s);assert.equal(w.chunks.size,8);assert.ok(h.geometry.blocks.size<=8);maxBlocks=Math.max(maxBlocks,h.geometry.blocks.size);
 for(const g of w.chunks.values())for(const m of g.children){if(m.isMesh&&!m.isInstancedMesh&&!m.geometry.userData.counted){m.geometry.userData.counted=true;created++;m.geometry.addEventListener('dispose',()=>disposed++);}}
 // Adjacent surface mesh positions and analytic normals match exactly (float32 tolerance).
 const keys=[...w.chunks.keys()].sort((a,b)=>a-b);for(let j=1;j<keys.length;j++){const ga=w.chunks.get(keys[j-1]),gb=w.chunks.get(keys[j]);for(let m=0;m<9;m++){const a=ga.children[m].geometry.attributes,b=gb.children[m].geometry.attributes;for(let side=0;side<2;side++)for(let axis=0;axis<3;axis++){const ai=(80+side)*3+axis,bi=side*3+axis;const av=a.position.array[ai]+(axis===2?ga.position.z:0),bv=b.position.array[bi]+(axis===2?gb.position.z:0);assert.ok(Math.abs(av-bv)<.00005,'mesh seam');assert.equal(a.normal.array[ai],b.normal.array[bi]);}}}
}
w.root.traverse(o=>{if(o.isMesh)meshes++;});assert.equal(created-disposed,72);assert.ok(meshes<150);const cacheBefore=h.point(502333,-7.4);h.reset(86,917);assert.deepEqual(h.point(502333,-7.4),{...cacheBefore,z:cacheBefore.z+500000});w.clear();assert.equal(disposed,created);assert.equal(w.chunks.size,0);
const report={rows,streamingKm:500,maxCachedProfiles:maxBlocks,chunkLimit:8,roadSurfaceGeometriesCreated:created,roadSurfaceGeometriesDisposed:disposed,meshesBeforeClear:meshes,seams:'world positions + analytic normals',parameterization:'legacy-global-z-v1',continuity:'C2, not C3',GPUClaim:false};fs.mkdirSync('reports/A51',{recursive:true});fs.writeFileSync('reports/A51/geometry.json',JSON.stringify(report,null,2));console.log(report);
