import assert from 'node:assert/strict';
import {DrivingExperience,drivingModes} from '../dist/driving-experience.js';
import {SteeringResponse} from '../dist/controls.js';
import {Vehicle,DT} from '../dist/physics.js';
const e=new DrivingExperience(),c=new SteeringResponse();
assert.equal(e.mode,'simulation');assert.equal(e.modeCode,1);assert.equal(e.correction,0);assert.equal(e.assistanceAvailable,false);
assert.equal('balanced' in drivingModes,false);assert.equal('assisted' in drivingModes,false);
// Any attempted vehicle feedback read is a failure in Simulation.
const forbiddenState=new Proxy({}, {get(){throw Error('Simulation read dynamic state');},set(){throw Error('Simulation wrote dynamic state');}});
for(const kmh of [0,50,100,150,200,250])for(const source of ['touch','tilt','digital']){
 e.reset();c.reset();
 for(let n=0;n<720;n++){
  const raw=n<240?.3:n<480?-1:0;
  assert.equal(e.value(raw,kmh/3.6,DT,source,forbiddenState),c.value(raw,kmh/3.6,DT,source));assert.equal(e.correction,0);
  if(n===300){const before=JSON.stringify(e.processor);assert.equal(e.setMode('simulation'),e.command);for(const mode of ['balanced','assisted','bad'])assert.throws(()=>e.setMode(mode),RangeError);assert.equal(JSON.stringify(e.processor),before);}
 }
}
for(const sign of [-1,1]){
 e.reset();for(let n=0;n<480;n++)assert.equal(e.value(0,50,DT,'touch',forbiddenState),0);
 for(let n=0;n<480;n++)e.value(sign,200/3.6,DT,'touch');assert.equal(e.processor.target,sign);assert.ok(Math.abs(e.command-sign)<1e-8);
 for(let n=0;n<480;n++)e.value(0,200/3.6,DT,'digital');assert.equal(e.command,0,'Ordinary return, no residual assist');
}
const v=new Vehicle();for(const abs of [false,true])for(const tcs of [false,true]){
 Object.assign(v.config,{abs,tcs});const config=JSON.stringify(v.config);e.setMode('simulation');e.reset();e.value(.5,20,DT,'touch',v);assert.equal(JSON.stringify(v.config),config);
}
e.reset();assert.equal(e.command,0);assert.equal(e.processor.raw,0);assert.equal(e.processor.target,0);assert.equal(e.mode,'simulation');
console.log('Simulation: shared A.3 ergonomics; explicit A.1 legacy replay is tested separately, unread vehicle-state contract, zero correction, full analog range, neutral/release/reset, rejected future modes without jump, independent ABS/TCS.');
