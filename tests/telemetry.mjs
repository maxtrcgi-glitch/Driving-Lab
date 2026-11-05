import assert from 'node:assert/strict';
import fs from 'node:fs';
import {TelemetryLog,columns,copyTelemetry} from '../dist/telemetry.js';
import {Vehicle,DT,defaults} from '../dist/physics.js';
import {TiltSteering,bindSteeringPad,bindHold} from '../dist/controls.js';
const log=new TelemetryLog('0.8'),v=new Vehicle(),tilt=new TiltSteering();
const input={gas:.3,brake:0,steer:0,handbrake:0,reverse:false};let clock=0;
for(let f=0;f<70*60;f++){
 for(let n=0;n<4;n++){v.step(DT,input);clock+=DT;}
 if(f===65*60)log.event(clock,'issue');
 if(f===66*60){v.reset();log.event(clock,'reset');}
 log.capture(clock,v,input,{frameMs:f===69*60?140:16.667,renderMs:3,steps:4,backlogMs:0,discardedMs:0,mode:'touch',tilt,now:f*16.667,location:'track',slow:false,cameraMode:1,sound:true});
}
assert.ok(log.rows.length<=602&&log.duration<=60.001&&log.duration>59);
assert.equal(log.markCount,1);assert.ok(log.rows.every(r=>r.length===columns.length));
const text=log.export(15,{vehicle:'GR86'}),lines=text.split('\n'),meta=JSON.parse(lines[1]);
assert.ok(meta.events.some(e=>e.type==='setup'&&e.t<meta.range_s[0]),'Setup in force at buffer start retained');
assert.ok(meta.events.some(e=>e.type==='issue'));assert.ok(meta.events.some(e=>e.type==='reset'));
assert.ok(lines.length>70&&lines.length<85);assert.ok(meta.range_s[1]-meta.range_s[0]<=15.001);
assert.ok(log.rows.at(-1)[1]<5,'Car time can reset without breaking session clock');
assert.ok(log.rows.some(r=>r[columns.indexOf('frame_max_ms')]===140),'Frame spike preserved');
assert.ok(!text.includes('Infinity')&&!text.includes('NaN'));assert.equal(defaults.tcs,false);
const textarea={focus(){},select(){},setSelectionRange(){}};let fallback={hidden:true};
assert.equal(await copyTelemetry('abc',{clipboard:{writeText:async t=>assert.equal(t,'abc')}},textarea,fallback,{}),true);
assert.equal(await copyTelemetry('abc',{clipboard:{writeText:async()=>{throw Error();}}},textarea,fallback,{execCommand:()=>false}),false);assert.equal(textarea.value,'abc');assert.equal(fallback.hidden,false);
assert.equal(await copyTelemetry('abc',{},textarea,fallback,{execCommand:()=>true}),true);
class Button extends EventTarget {getBoundingClientRect(){return {width:250};}setPointerCapture(){}fire(type,id,x=0){const e=new Event(type,{cancelable:true});e.pointerId=id;e.clientX=x;this.dispatchEvent(e);}}
const pad=new Button(),handbrake=new Button(),actions=new Map();let steering=0;
bindSteeringPad(pad,v=>steering=v);bindHold(handbrake,'handbrake',actions,()=>{});
pad.fire('pointerdown',1,50);pad.fire('pointermove',1,100);const held=steering;
handbrake.fire('pointerdown',2);assert.equal(steering,held);assert.equal(actions.get(2),'handbrake');handbrake.fire('pointerup',2);assert.equal(steering,held);pad.fire('pointerup',1);assert.equal(steering,0);
const html=fs.readFileSync('dist/index.html','utf8');assert.ok(html.indexOf('id="handbrake"')>html.indexOf('class="pedals"'));assert.ok(html.includes('id="sound" type="checkbox" checked'));assert.ok(!html.includes('id="tcs" type="checkbox" checked'));
console.log(JSON.stringify({telemetryRows:log.rows.length,copyRows:lines.length-4,copyCharacters:text.length,columns:columns.length,checks:'bounded buffer, reset, markers, setup, clipboard fallback, frame spike, simultaneous steering/handbrake, defaults'}));
