import assert from 'node:assert/strict';
import {Vehicle,DT} from '../dist/physics.js';
import {SteeringResponse} from '../dist/controls.js';
// Larger thumb travel must still permit a lane-width maneuver at speed.
// This is an open-loop flat-road bench, not a guarantee in traffic or a drift assist.
for(const kmh of [200,250]){
 const v=new Vehicle(()=>({height:0,grip:1,surface:'asphalt'})),c=new SteeringResponse();v.reset(0,0,0,kmh/3.6);
 for(let i=0;i<.4/DT;i++)v.step(DT,{});
 let maxBeta=0;
 for(let i=0;i<3/DT;i++){
  const t=i*DT,raw=t>=.2&&t<.75?.55**1.45:t>=.75&&t<1.3?-(.55**1.45):0;
  v.step(DT,{steer:c.value(raw,v.speed,DT)});
  const f=v.vx*Math.sin(v.yaw)+v.vz*Math.cos(v.yaw),r=v.vx*Math.cos(v.yaw)-v.vz*Math.sin(v.yaw);
  maxBeta=Math.max(maxBeta,Math.abs(Math.atan2(r,f)*180/Math.PI));
 }
 console.log({test:'lane-width counter-pulse',imposedInitialKmh:kmh,lateralM:v.x,finalYawDeg:v.yaw*180/Math.PI,maxBetaDeg:maxBeta});
 assert.ok(Math.abs(v.x)>3&&Math.abs(v.x)<6,'End-travel reserve permits lane-width displacement');
 assert.ok(Math.abs(v.yaw)<.04,'Counter-pulse approximately recovers heading');assert.ok(maxBeta<12);assert.equal(v.brokenBeams,0);assert.equal(c.position,0);

}
