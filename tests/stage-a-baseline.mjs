// Compare actual baseline adapters/controllers: no copied reference formula.
import assert from 'node:assert/strict';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import fs from 'node:fs';
import * as Current from '../dist/controls.js';
const baseline=process.argv[2];if(!baseline)throw Error('Pass immutable v0.14A.1 source checkout');
const Previous=await import(pathToFileURL(path.resolve(baseline,'dist/controls.js')));
for(const f of ['physics.js','vehicle-spec.js','highway.js','highway-world.js','world.js'])assert.deepEqual(fs.readFileSync(`dist/${f}`),fs.readFileSync(path.join(baseline,'dist',f)),`${f} unchanged`);
let samples=0;
for(const kmh of [0,50,100,150,200,250])for(const mode of ['touch','digital','tilt'])for(const hz of [30,60,120]){
 const a=new Previous.SteeringResponse(),b=new Current.SteeringResponse();
 for(let frame=0;frame<hz*3;frame++){
  const demand=frame<hz?.55**1.45:frame<hz*2?-1:0;
  assert.equal(a.value(demand,kmh/3.6,0,mode),b.value(demand,kmh/3.6,0,mode));
  for(let n=0;n<240/hz;n++){assert.equal(a.value(demand,kmh/3.6,1/240,mode),b.value(demand,kmh/3.6,1/240,mode));assert.equal(a.target,b.target);samples++;}
 }
}
class Pad extends EventTarget{getBoundingClientRect(){return {width:250};}setPointerCapture(){}fire(type,x){const e=new Event(type,{cancelable:true});Object.assign(e,{clientX:x,pointerId:1});this.dispatchEvent(e);}touch(type,x){const e=new Event(type,{cancelable:true});e.changedTouches=[{clientX:x,identifier:2}];this.dispatchEvent(e);}}
for(const travel of [1,1.5])for(const precision of [1.45,2]){
 const a=new Pad(),b=new Pad(),ra=[],rb=[];const pa=Previous.bindSteeringPad(a,(...v)=>ra.push(v),()=>({travel,precision})),pb=Current.bindSteeringPad(b,(...v)=>rb.push(v),()=>({travel,precision}));
 for(const release of ['pointerup','pointercancel','lostpointercapture'])for(const pad of [a,b]){pad.fire('pointerdown',40);for(const x of [60,90,250,-120])pad.fire('pointermove',x);pad.fire(release,0);}
 for(const pad of [a,b]){pad.touch('touchstart',100);pad.touch('touchmove',150);pad.touch('touchcancel',150);}
 pa.reset();pb.reset();assert.deepEqual(ra,rb,'Adapter outputs and callback ordering unchanged');
}
console.log(JSON.stringify({baseline:'0ef5b8db80c325e23a11827fe370e8b031bf5c24',fixedStepSamples:samples,output:'exact equality',rafRates:[30,60,120],speedsKmh:[0,50,100,150,200,250],physicsAndScene:'byte-identical'}));
