import fs from 'node:fs';
import {Vehicle,DT} from '../dist/physics.js';
import {DrivingExperience} from '../dist/driving-experience.js';
import {driverInput,scenarioNames} from './slip-scenarios.mjs';
import {contactProbe} from './contact-probe.mjs';
const output=process.argv[2];if(!output)throw Error('Pass output JSON');
const results=[];
for(const kmh of [60,120])for(const name of scenarioNames){
 const v=new Vehicle(),e=new DrivingExperience();v.reset(0,0,0,kmh/3.6);for(let i=0;i<96;i++)v.step(DT,{});const probe=contactProbe(v),rows=[];
 for(let i=0;i<960;i++){
  const t=i*DT,cmd=driverInput(name,t),steer=e.value(cmd.raw,v.speed,DT,'touch');v.step(DT,{steer,gas:cmd.gas,handbrake:cmd.handbrake});e.observe(v,DT);
  if(i%12===0){const s=e.state,p=probe();rows.push({t,speed:v.speed,beta:s.beta,betaDot:s.betaDot,r:s.r,rDot:s.rDot,residual:s.yawResidual,kinResidual:s.betaDot-s.betaDotKinematic,valid:s.valid,reasons:s.reasons,ref:e.reference.alignmentRack,refValid:e.reference.valid,rack:v.steer,yaw:v.yaw,x:v.x,damage:v.damage,frontAlpha:s.wheels.slice(0,2).map(w=>w.alphaRelaxed),rearAlpha:s.wheels.slice(2).map(w=>w.alphaRelaxed),frontMoment:p.frontMoment,rearMoment:p.rearMoment});}
 }
 results.push({kmh,name,rows});console.log(JSON.stringify({kmh,name,maxBetaDeg:Math.max(...rows.map(x=>Math.abs(x.beta)))*180/Math.PI,maxR:Math.max(...rows.map(x=>Math.abs(x.r))),valid:rows.filter(x=>x.valid).length,yaw:v.yaw,x:v.x}));
}
fs.writeFileSync(output,JSON.stringify(results));
