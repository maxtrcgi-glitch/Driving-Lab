// Deterministic road-space driver with the production CameraRig projection.
import fs from 'node:fs';
import {Highway,LANES} from '../dist/highway.js';
import {PerspectiveCamera,Vector3} from '../dist/three.module.js';
import {CameraRig} from '../dist/camera-rig.js';
import {cameraDefaults} from '../dist/camera-settings.js';

const DT=1/30, seconds=300;
const rows=[];
for(const density of [28,72,120])for(const kmh of [100,150,200,250])for(const seed of [917,2027,8123]){
 const highway=new Highway(86);
 highway.density=density;
 highway.reset(86,seed);
 highway.setDiagnostics(true);
 const camera=new PerspectiveCamera(cameraDefaults.fov,844/390,.025,1500);
 const rig=new CameraRig(camera,new Vector3(-.33,.58,.20),{...cameraDefaults,mode:1});
 const basis=highway.frame(0,LANES[1]);
 const v=kmh/3.6, player={basis,speed:v};
 let s=0, minActive=Infinity, maxActive=0, ahead=0,behind=0, nearest=0, nearestRear=0, nearestN=0, rearN=0, samples=0;
 const bins=[0,0,0], allBins=[0,0,0], lanes=[0,0,0,0,0,0], localLanes=[0,0,0,0,0,0], distances=[], clustering=[];
 const gaps={100:[],250:[],500:[],1000:[],all500:[]}, current={100:0,250:0,500:0,1000:0,all500:0};
 const closeGap=(range)=>{if(current[range])gaps[range].push({s:current[range]*DT,m:current[range]*DT*v});current[range]=0;};
 for(let tick=0;tick<seconds/DT;tick++){
  s+=v*DT/highway.metric(s,LANES[1]);
  highway.frame(s,LANES[1],basis);
  const [x,y,z]=basis.position;
  Object.assign(player,{x,y:y+.68,z,yaw:basis.yaw,pitch:Math.atan(basis.grade),vx:v*basis.forward[0],vy:v*basis.forward[1],vz:v*basis.forward[2]});
  highway.step(DT,player);
  minActive=Math.min(minActive,highway.cars.length);maxActive=Math.max(maxActive,highway.cars.length);
  let front=Infinity,rear=Infinity,anyFront=Infinity,f=0,b=0;
  const local=[0,0,0];
  const sample=tick%30===0, sorted=[];
  for(const car of highway.cars){
   const d=car.s-s;
   if(d>0)anyFront=Math.min(anyFront,d);
   if(sample){lanes[car.lane]++;if(d>0&&d<=500){localLanes[car.lane]++;allBins[d<=100?0:d<=250?1:2]++;}}
   if(car.dir<0)continue;
   if(d>0){f++;front=Math.min(front,d);if(d<=500)local[d<=100?0:d<=250?1:2]++;if(sample&&d<=1000)sorted.push(d);}
   else{b++;rear=Math.min(rear,-d);}
  }
  for(const range of [100,250,500,1000]){if(front>range)current[range]++;else closeGap(range);}
  if(anyFront>500)current.all500++;else closeGap('all500');
  if(sample){
   samples++;ahead+=f;behind+=b;for(let i=0;i<3;i++)bins[i]+=local[i];
   if(Number.isFinite(front)){nearest+=front;nearestN++;distances.push(front);}
   if(Number.isFinite(rear)){nearestRear+=rear;rearN++;}
   sorted.sort((a,b)=>a-b);
   for(let i=1;i<sorted.length;i++)clustering.push(sorted[i]-sorted[i-1]);
  }
  if(tick%3===0){rig.apply(player,DT*3);camera.updateMatrixWorld();highway.diagnostics.sampleView(highway.clock,camera);}
 }
 for(const range of [100,250,500,1000,'all500'])closeGap(range);
 rows.push({density,kmh,seed,active:[minActive,maxActive],meanAhead:ahead/samples,meanBehind:behind/samples,
  meanNearestAhead:nearestN?nearest/nearestN:null,meanNearestBehind:rearN?nearestRear/rearN:null,distances,clustering,
  bins:bins.map(n=>n/samples),allDirectionBins:allBins.map(n=>n/samples),laneOccupancy:lanes.map(n=>n/samples),laneAhead500:localLanes.map(n=>n/samples),gaps,
  spawned:highway.spawned,recycled:highway.retired,spawnFailures:highway.spawnFailures,npcContacts:highway.npcContacts,
  playerPasses:highway.passes,safetyRejectedCandidates:highway.rejectedChanges,traffic:highway.diagnostics.counts});
}
const path=process.argv[2]??'reports/A60/r34-density.json';
fs.mkdirSync(path.slice(0,path.lastIndexOf('/'))||'.',{recursive:true});
fs.writeFileSync(path,JSON.stringify({seconds,scope:'Constant-speed road-space player, same-direction bands; production CameraRig pose and perspective at 844x390, no GPU, occlusion or device inference',rows}));
console.log(`Wrote ${rows.length} density/camera scenarios to ${path}`);
