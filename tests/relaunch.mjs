import assert from 'node:assert/strict';
import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
const modulePath=process.argv[2],out=process.argv[3]||'reports/relaunch-fixed.json';
const {Vehicle,DT}=await import(modulePath?pathToFileURL(modulePath).href:'../dist/physics.js');
const failures=[],results=[];
const cases=[];for(const drive of ['rwd','fwd','awd'])for(const tcs of [false,true])for(const lsd of [false,true])cases.push({drive,tcs,lsd,target:drive==='rwd'?120:80,cycles:drive==='rwd'&&!tcs&&lsd?2:1});cases.push({drive:'rwd',tcs:false,lsd:true,target:100,collision:true,cycles:1},{drive:'rwd',tcs:true,lsd:true,target:80,reverse:true,cycles:1});
for(const config of cases){const v=new Vehicle();Object.assign(v.config,config);const samples=[];let contacts=0;
 const record=phase=>samples.push({phase,t:v.time,kmh:v.speed*3.6,rpm:v.rpm,gear:v.gear,shiftRecovery:v.shiftRecovery,shiftTimer:v.shiftTimer,clutch:v.clutchEngagement,clutchTorqueNm:v.clutchTorque,driveTorqueNm:v.wheels.map(w=>w.driveTorque),wheelRPM:v.wheels.map(w=>w.omega*30/Math.PI),damage:v.damage});
 function step(command,n,phase){for(let i=0;i<n;i++){v.step(DT,command);if(i%24===0)record(phase);}}
 for(let cycle=0;cycle<config.cycles;cycle++){
  let i=0;for(;i<240*45&&v.speed*3.6<config.target;i++){v.step(DT,{gas:1});if(i%24===0)record('accelerate'+cycle);}assert.ok(v.speed*3.6>=config.target,'initial acceleration '+JSON.stringify(config));record('target');
  let hit=false;for(i=0;i<240*9;i++){v.step(DT,{brake:1});if(config.collision&&!hit&&v.speed<1.5){hit=v.collideCircle(v.x+.55,v.z+2.645,.4,1.2);if(hit)contacts++;}if(i%24===0)record('brake'+cycle);}record('stopped');assert.ok(v.speed<.05,'complete stop');assert.equal(v.gear,1,'automatic downshift to first');assert.equal(v.brokenBeams,0,'no broken drivetrain/body links');
  step({},120,'release');record('before-relaunch');let to20=null;for(i=0;i<240*8;i++){v.step(DT,{gas:1,reverse:!!config.reverse});if(i%24===0)record('relaunch'+cycle);if(v.speed*3.6>=20&&to20===null)to20=(i+1)*DT;assert.ok(Number.isFinite(v.rpm+v.speed+v.clutchTorque));}
  record('end');if(to20===null||v.speed*3.6<30)failures.push({config,cycle,end:samples.at(-1)});results.push({config,cycle,secondsTo20:to20,endKmh:v.speed*3.6,contacts,samples:samples.splice(0)});if(to20===null)break;
 }
 if(config.collision)assert.ok(contacts>0,'collision path exercised');
}
fs.mkdirSync(out.slice(0,out.lastIndexOf('/'))||'.',{recursive:true});fs.writeFileSync(out,JSON.stringify({module:modulePath||'current',cases:results.length,failures,results},null,2));console.log(JSON.stringify({cases:results.length,failures:failures.length,secondsTo20:results.map(x=>x.secondsTo20)}));assert.equal(failures.length,0,'repeat launch must succeed in every configuration');
