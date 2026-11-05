import assert from 'node:assert/strict';
import fs from 'node:fs';
import {SteeringResponse,bindSteeringPad} from '../dist/controls.js';
import {LegacySteeringResponse} from '../dist/steering-legacy.js';
import {Vehicle,DT} from '../dist/physics.js';
const out=process.argv[2];assert.ok(out,'Pass output directory');fs.mkdirSync(out,{recursive:true});
class Pad extends EventTarget{getBoundingClientRect(){return {width:250};}setPointerCapture(){}fire(type,f){const e=new Event(type,{cancelable:true});e.pointerId=1;e.clientX=f*100;this.dispatchEvent(e);}}
const variants={legacy:()=>new LegacySteeringResponse(),selected:()=>new SteeringResponse(),medium:()=>new SteeringResponse({fastRate:4.2,fastTauScale:.65}),maximum:()=>new SteeringResponse({fastRate:5.2,fastTauScale:.5})};
const cases=[[0,1],[.5,-.5],[1,-1],[-1,1],[.2,-.2],[1,0],[.5,1]],results=[],csv=['profile,kmh,start_finger,end_finger,t_s,touch_fraction,raw_demand,shaped_target,command,rack_deg,W0_deg,W1_deg'];
const thresholds=(a,b)=>({t50:null,t90:null,t100Tolerance:null,t100Exact:null});
for(const [profile,make] of Object.entries(variants))for(const kmh of [50,100,150,200,250])for(const [from,to] of cases){
 const c=make(),pad=new Pad();let raw=0;bindSteeringPad(pad,x=>raw=x);pad.fire('pointerdown',0);pad.fire('pointermove',from);
 for(let i=0;i<960;i++)c.value(raw,kmh/3.6,DT,'touch');
 const v=new Vehicle();v.reset();v.steer=-.57*c.position;v.step(DT,{steer:c.position});
 const start={command:c.position,rack:v.steer,wheels:v.wheels.slice(0,2).map(w=>w.steerAngle)};
 pad.fire('pointermove',to);c.value(raw,kmh/3.6,0,'touch');const goal=-.57*c.target,target=c.target;
 const wheelGoals=v.wheels.slice(0,2).map(w=>Math.abs(goal)<1e-5?0:Math.atan(2.575/(2.575/Math.tan(goal)-w.x)));
 const times={command:thresholds(),rack:thresholds(),W0:thresholds(),W1:thresholds()};let peakRackRate=0,last=v.steer;
 function observe(o,x,a,b,t,tolerance){const distance=Math.abs(b-a),progress=distance<1e-12?1:(x-a)/(b-a);if(o.t50===null&&progress>=.5)o.t50=t;if(o.t90===null&&progress>=.9)o.t90=t;if(o.t100Tolerance===null&&Math.abs(x-b)<=tolerance)o.t100Tolerance=t;if(o.t100Exact===null&&x===b)o.t100Exact=t;}
 for(let tick=0;tick<720;tick++){
  const t=(tick+1)*DT,command=c.value(raw,kmh/3.6,DT,'touch');v.step(DT,{steer:command});peakRackRate=Math.max(peakRackRate,Math.abs(v.steer-last)/DT);last=v.steer;
  observe(times.command,command,start.command,target,t,.05*Math.PI/180/.57);observe(times.rack,v.steer,start.rack,goal,t,.05*Math.PI/180);
  for(let i=0;i<2;i++)observe(times['W'+i],v.wheels[i].steerAngle,start.wheels[i],wheelGoals[i],t,.05*Math.PI/180);
  if(tick%4===0)csv.push([profile,kmh,from,to,t,pad?to:null,raw,target,command,v.steer*180/Math.PI,...v.wheels.slice(0,2).map(w=>w.steerAngle*180/Math.PI)].join(','));
 }
 assert.ok(peakRackRate<=3+1e-9);results.push({profile,kmh,from,to,raw,target,start,goalRackDeg:goal*180/Math.PI,wheelGoalsDeg:wheelGoals.map(x=>x*180/Math.PI),times,peakRackRadS:peakRackRate,displayQuantization: [15,30,60,120].map(hz=>({hz,rack90Observed:Math.ceil(times.rack.t90*hz)/hz}))});
}
// Exact explicit legacy baseline; no rewriting old expectations silently.
for(const mode of ['touch','tilt','digital'])for(const kmh of [0,50,100,150,200,250]){
 const legacy=new LegacySteeringResponse(),current=new SteeringResponse();
 for(let i=0;i<720;i++){const raw=mode==='digital'?(i<240?1:i<480?-1:0):i<240?.2:i<480?-.2:0;assert.equal(legacy.value(raw,kmh/3.6,DT,mode),current.value(raw,kmh/3.6,DT,mode),'Small/digital commands bit exact');}
 for(const raw of [-1,-.5,0,.5,1]){legacy.value(raw,kmh/3.6,0,mode);current.value(raw,kmh/3.6,0,mode);assert.equal(legacy.target,current.target);}
}
const mirrored=new SteeringResponse(),positive=new SteeringResponse();for(let i=0;i<720;i++){const raw=i<240?1:i<480?-1:0;assert.equal(mirrored.value(-raw,200/3.6,DT)+positive.value(raw,200/3.6,DT),0);}
fs.writeFileSync(out+'/steering-latency.json',JSON.stringify({conditions:'Isolated actuator bench: stationary full Vehicle physics, nominal speed supplied only to command map, complete touch pad curve. DT240Hz. Threshold progression from initial to requested angle. 100% tolerance0.05deg; exact endpoint reported separately (lowpass asymptotic). Synthetic event handler, hardware/sensor/display latency NOT measured. displayQuantization is arithmetic only, not FPS test.',results},null,2));fs.writeFileSync(out+'/steering-latency.csv',csv.join('\n')+'\n');
console.table(results.filter(x=>x.kmh===200&&Math.abs(x.from)===1&&x.to===-x.from).map(x=>({profile:x.profile,from:x.from,to:x.to,command90:x.times.command.t90,rack50:x.times.rack.t50,rack90:x.times.rack.t90,rack100tol:x.times.rack.t100Tolerance,peakRackRadS:x.peakRackRadS})));
