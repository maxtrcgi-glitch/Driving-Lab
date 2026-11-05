// Numerical test driver only. No path following or yaw assistance runs in the game.
import assert from 'node:assert/strict';
import {Vehicle,DT,clamp} from '../dist/physics.js';
import {terrain,nearest,points,segments,courseLength} from '../dist/course.js';
const v=new Vehicle(terrain);let travel=0,previous=nearest(v.x,v.z).progress,maxOffset=0,maxBeta=0,maxRoll=0;
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));const curvature=i=>{const a=segments[(i+segments.length)%segments.length],b=segments[(i+5)%segments.length],c=segments[(i-5+segments.length)%segments.length];return Math.abs(wrap(Math.atan2(b.dx,b.dz)-Math.atan2(c.dx,c.dz)))/20;};
const start=performance.now();
for(let t=0;t<320;t+=DT){
 const road=nearest(v.x,v.z),ahead=8+v.speed*.55,index=(road.index+Math.round(ahead/2))%points.length,target=points[index],heading=Math.atan2(target.x-v.x,target.z-v.z),error=wrap(heading-v.yaw);
 let k=0;for(let j=0;j<35;j+=5)k=Math.max(k,curvature(road.index+j));const desired=Math.min(22,Math.sqrt(4.5/Math.max(k,.001)));
 const gas=clamp(.22+(desired-v.speed)*.22,0,.8),brake=clamp((v.speed-desired)*.22,0,1),steer=clamp(-Math.atan(2*2.575*Math.sin(error)/ahead)/.57,-1,1);
 v.step(DT,{gas:brake>.1?0:gas,brake,steer});let d=road.progress-previous;if(d>courseLength/2)d-=courseLength;if(d< -courseLength/2)d+=courseLength;travel+=d;previous=road.progress;
 maxOffset=Math.max(maxOffset,road.distance);maxRoll=Math.max(maxRoll,Math.abs(v.roll));if(v.speed>5)maxBeta=Math.max(maxBeta,Math.abs(wrap(Math.atan2(v.vx,v.vz)-v.yaw)));
 if(road.distance>12||!Number.isFinite(v.x)){console.log('FAIL',{t,travel,maxOffset,v:v.state()});process.exit(1);}
 if(travel>courseLength){assert.ok(maxOffset<5,'Numerical test driver completes asphalt lap');assert.equal(v.brokenBeams,0);assert.equal(v.damage,0);console.log({lapSeconds:t,maxOffsetM:maxOffset,maxBetaDeg:maxBeta*180/Math.PI,maxRollDeg:maxRoll*180/Math.PI,damage:v.damage,broken:v.brokenBeams,cpuMs:performance.now()-start});process.exit(0);}
}
console.log('NO LAP',{travel,v:v.state()});process.exit(1);
