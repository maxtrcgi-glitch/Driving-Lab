import {Highway,LANES} from '../dist/highway.js';
import {performance} from 'node:perf_hooks';
import fs from 'node:fs';
const rows=[];
for(const density of [28,72,120]){
 const h=new Highway(86);h.density=density;h.reset(86,917);const refs=new Set(h.cars),samples=[];let s=0;
 for(let i=0;i<3600;i++){const p=h.point(s,LANES[1]),v={...p,vx:Math.sin(p.yaw)*55.56,vz:Math.cos(p.yaw)*55.56,speed:55.56};const t=performance.now();for(let k=0;k<4;k++)h.step(1/240,v);samples.push(performance.now()-t);s+=55.56/60/h.metric(s,LANES[1]);}
 samples.sort((a,b)=>a-b);const speeds=h.cars.filter(c=>c.dir>0).map(c=>c.desired),mean=speeds.reduce((a,b)=>a+b)/speeds.length;
 rows.push({density,seed:917,simulatedSeconds:60,trafficFourStepsMsP50:samples[1800],trafficFourStepsMsP95:samples[3420],trafficFourStepsMsMax:samples.at(-1),desiredMeanKmh:mean*3.6,desiredStdKmh:Math.sqrt(speeds.reduce((a,b)=>a+(b-mean)**2,0)/speeds.length)*3.6,laneChanges:h.laneChanges,rejectedChanges:h.rejectedChanges,decisions:h.decisions,spawnFailures:h.spawnFailures,spawned:h.spawned,retired:h.retired,active:h.cars.length,objectsReused:h.cars.every(c=>refs.has(c)),npcContacts:h.npcContacts,barrierContacts:h.barrierContacts});
}
const result={scope:'Node traffic CPU only; no renderer/player physics; not FPS, iPhone, allocation count or GC spike measurement',node:process.version,rows};fs.mkdirSync('reports/A60',{recursive:true});fs.writeFileSync(process.argv[2]||'reports/A60/baseline.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
