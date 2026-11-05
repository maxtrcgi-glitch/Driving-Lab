import {assertA52Integrity} from './support/integrity.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';

import {Vehicle,DT} from '../dist/physics.js';
import {Highway} from '../dist/highway.js';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import {DrivingExperience} from '../dist/driving-experience.js';
const BaselineExperience=DrivingExperience; // both worlds use the accepted current player controller.
import {vehicleSnapshot} from './full-state.mjs';
const out=process.argv[2]||'/tmp/driving-lab-traffic-ai2';fs.mkdirSync(out,{recursive:true});
const hashes=assertA52Integrity();
let ticks=0;for(const speed of [50,100,150,200,250])for(const sign of [-1,1]){
 const h=new Highway(86),b=new Highway(86);h.density=28;b.density=0;h.reset();b.reset();
 const a=new Vehicle((x,z)=>h.terrain(x,z)),v=new Vehicle((x,z)=>b.terrain(x,z)),ea=new DrivingExperience(),ev=new BaselineExperience(),p=h.point(0,-7.4);a.reset(p.x,p.z,p.yaw,speed/3.6);v.reset(p.x,p.z,p.yaw,speed/3.6);
 ea.configureAssist(true,100);ev.configureAssist(true,100);
 for(let i=0;i<720;i++){const t=i*DT,demand=sign*(t<.6?.15:t<1.2?-.2:t<1.6?.7:t<2?-.7:0),gas=t<1.5?.4:0,steerA=ea.value(demand,a.speed,DT,'touch'),steerB=ev.value(demand,v.speed,DT,'touch');assert.equal(steerA,steerB);
  const observed=vehicleSnapshot(a);h.step(DT,a);assert.deepEqual(vehicleSnapshot(a),observed,'NPC traffic observation must not mutate player');b.step(DT,v);a.step(DT,{gas,steer:steerA});v.step(DT,{gas,steer:steerB});ea.observe(a,DT);ev.observe(v,DT);assert.deepEqual(ea.state,ev.state);assert.equal(ea.correction,ev.correction);
  // No collisions invoked: identity of the player under no external contacts.
  assert.deepEqual(vehicleSnapshot(a),vehicleSnapshot(v));ticks++;
 }
}
const report={baseline:'A52 traffic-on vs traffic-off on identical current geometry',protectedHashes:hashes,bitExactPlayerTicks:ticks,speedsKmh:[50,100,150,200,250],leftRight:true,requestedOn100NoCorrection:true,noExternalContacts:true,acceptedDistIntegrity:true};fs.writeFileSync(out+'/player-identity.json',JSON.stringify(report,null,2));console.log(report);
