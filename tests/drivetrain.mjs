import {Vehicle,DT,differentialTransfer} from '../dist/physics.js';
import assert from 'node:assert/strict';
const v=new Vehicle();v.reset(0,0,0,20);for(let i=0;i<480;i++){v.step(DT,{});assert.equal(v.absActive,false,'ABS must not intervene without service brake');}
for(let i=0;i<480;i++){v.step(DT,{brake:1});}
let maxSpin=0,shiftSpin=0;v.reset();for(let i=0;i<2400;i++){v.step(DT,{gas:1});maxSpin=Math.max(maxSpin,v.wheels[2].slip);if(v.gear===2)shiftSpin=Math.max(shiftSpin,v.wheels[2].slip);}
for(let t of [-600,0,600]){const f=differentialTransfer(100,90,t,1/1920);assert.ok(Math.abs(f)<=Math.abs(t)*(2.5-1)/(2*(2.5+1))+1e-8);assert.ok(f>=0);assert.equal(differentialTransfer(90,100,t,1/1920),-f);assert.ok(f*(100-90)>=0,'Diff friction removes relative wheel energy');}
assert.ok(shiftSpin<.35,'Shift throttle cut keeps this straight-line shift below 35% slip');
console.log(JSON.stringify({maxSpin,shiftSpin,absReleased:false}));
