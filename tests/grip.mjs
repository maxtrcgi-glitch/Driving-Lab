import assert from 'node:assert/strict';
import {Vehicle,DT,defaults} from '../dist/physics.js';
const flat=()=>({height:0,grip:1,surface:'asphalt'});
function stop(wet){const v=new Vehicle(flat);v.config.wet=wet;v.reset(0,0,0,20);let distance=0;for(let t=0;t<6;t+=DT){v.step(DT,{brake:1});distance+=v.speed*DT;if(v.speed<.2)return distance;}throw Error('Did not stop');}
const dry=stop(false),wet=stop(true);assert.ok(dry>18&&dry<28,'Dry 72 km/h stop should remain near tire-limited range, not ice-like');assert.ok(wet>dry*1.25,'Wet asphalt should take longer');
const v=new Vehicle(flat);v.reset(0,0,0,15);for(let t=0;t<3;t+=DT)v.step(DT,{gas:.18,steer:.1});
assert.ok(Math.abs(v.ay)>3&&Math.abs(v.ay)<5,'Moderate steering should generate predictable lateral acceleration');
assert.ok(v.wheels.every(w=>Math.abs(w.alpha)<.05),'Moderate cornering should not require large tire slip angles');
assert.ok(Math.abs(v.wheels.reduce((s,w)=>s+w.load,0)-defaults.mass*9.81)<100,'Vertical loads balance weight');
for(const w of v.wheels)assert.ok(Math.hypot(w.fx,w.fy)<=w.grip*w.load+1,'Combined force must respect friction circle');
const left=new Vehicle(flat);left.reset(0,0,0,15);for(let t=0;t<3;t+=DT)left.step(DT,{gas:.18,steer:-.1});assert.ok(Math.abs(v.x+left.x)<.001,'Left/right tire response symmetry');
console.log(JSON.stringify({dryStop72kmhM:dry,wetStop72kmhM:wet,lateralG:Math.abs(v.ay)/9.81,maxSlipDegrees:Math.max(...v.wheels.map(w=>Math.abs(w.alpha)))*180/Math.PI}));
