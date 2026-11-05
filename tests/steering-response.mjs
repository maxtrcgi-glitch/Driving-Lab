import assert from 'node:assert/strict';
import {SteeringResponse,steeringEnvelope} from '../dist/controls.js';
// Command mechanics, not claims about tire grip or device ergonomics.
for(const mode of ['touch','tilt','digital'])for(const kmh of [0,50,100,150,200,250]){
 const c=new SteeringResponse();let previous=0;
 for(let i=0;i<240;i++){const v=c.value(.25,kmh/3.6,1/240,mode);assert.ok(Number.isFinite(v));assert.ok(Math.abs(v-previous)<=2.4/240+1e-10);previous=v;}
 assert.ok(c.position>0&&c.position<=1);
 const settled=c.position;c.value(-1,kmh/3.6,0,mode);assert.equal(c.position,settled,'Events with dt=0 cannot teleport steering');
 for(let i=0;i<120;i++)c.value(-1,kmh/3.6,1/240,mode);
 assert.ok(c.position<0,'Timely countersteering remains possible');
 for(let i=0;i<240;i++)c.value(0,kmh/3.6,1/240,mode);
 assert.equal(c.position,0,'Release fully clears command');
 c.value(1,0,1/60,mode);c.reset();assert.equal(c.position,0);assert.equal(c.target,0);assert.equal(c.raw,0);
 c.value(NaN,NaN,NaN,mode);assert.equal(c.position,0);
}
assert.equal(steeringEnvelope(0),1);assert.equal(steeringEnvelope(8),1);assert.ok(steeringEnvelope(50/3.6)>.9);
for(const kmh of [50,100,150,200,250])assert.equal(steeringEnvelope(-kmh/3.6),steeringEnvelope(kmh/3.6));
for(const hz of [30,60,120,240]){const c=new SteeringResponse();for(let i=0;i<hz;i++)c.value(.15,200/3.6,1/hz);assert.ok(Math.abs(c.position-.15**(1+.35*((200/3.6-8)/48))*steeringEnvelope(200/3.6))<1e-7);}
const small=new SteeringResponse(),full=new SteeringResponse();for(let i=0;i<240;i++){small.value(.1,200/3.6,1/240);full.value(1,200/3.6,1/240);}assert.ok(full.position/small.position>20,'Progressive center response with end-travel reserve');
console.log('Steering response: all inputs, 0–250 km/h, finite/rate/reversal/release/reset, speed symmetry, 30–240 Hz constant-input convergence passed.');
