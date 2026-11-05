// CPU-only benchmark; do not report these results as iPhone FPS/GPU performance.
import {Highway} from '../dist/highway.js';
import {Vehicle,DT} from '../dist/physics.js';
import {performance} from 'node:perf_hooks';
const results=[];
for(const count of [0,28,42,72,120]){
 const h=new Highway();h.density=count;h.reset();let i=0;
 function run(n){const samples=[];for(let j=0;j<n;j++,i++){const p=h.point(i*DT*32,-7.4);const start=performance.now();h.step(DT,{...p,vx:Math.sin(p.yaw)*32,vz:Math.cos(p.yaw)*32,speed:32});samples.push(performance.now()-start);}samples.sort((a,b)=>a-b);return {meanMs:samples.reduce((a,b)=>a+b,0)/n,p95Ms:samples[Math.floor(n*.95)]};}
 run(720);const measured=run(4800);results.push({count,active:h.cars.length,...measured});
}
const v=new Vehicle();v.reset(0,0,0,28);for(let i=0;i<240;i++)v.step(DT,{gas:.2});const start=performance.now();for(let i=0;i<1200;i++)v.step(DT,{gas:.2});
console.log(JSON.stringify({environment:'Node '+process.version+' '+process.platform+' '+process.arch,nodeCPUOnly:true,trafficDecisionHz:30,movementHz:240,traffic:results,vehicleStepMeanMs:(performance.now()-start)/1200,renderMs:null,FPS:null,phoneValidated:false},null,2));
