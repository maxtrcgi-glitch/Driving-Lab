import {GR86} from './vehicle-spec.js';
// Geometric references only. Neither is a stabilizing/control target.
export class SteeringReferenceEstimator{
 constructor(){this.reset();}
 reset(){this.valid=false;this.alignmentRack=null;this.alignmentInput=null;this.yawKinematic=null;this.reasons=1;this.saturated=false;}
 update(state,vehicle){
  this.reset();this.reasons=state.reasons;
  // Weighted inversion of the existing Ackermann geometry, restricted to
  // near-level road/body. No false accuracy on slopes or unloaded wheels.
  if(!state.valid)return this;
  if(Math.abs(vehicle.roll)>.08||Math.abs(vehicle.pitch)>.08){this.reasons|=512;return this;}
  let weighted=0,loads=0;
  for(let i=0;i<2;i++){
   const w=state.wheels[i];if(!w.valid||!w.flatNormal||w.hubU<3||Math.abs(w.phi)>.7){this.reasons|=512;return this;}
   const ideal=w.phi-w.toe,t=Math.tan(ideal),rack=Math.atan2(GR86.wheelbase*t,GR86.wheelbase+w.x*t);
   weighted+=rack*w.load;loads+=w.load;
  }
  if(loads<=0){this.reasons|=4;return this;}
  const raw=weighted/loads;this.saturated=Math.abs(raw)>.57;this.alignmentRack=Math.max(-.57,Math.min(.57,raw));this.alignmentInput=-this.alignmentRack/.57;
  this.yawKinematic=state.U*Math.tan(vehicle.steer)/GR86.wheelbase;
  this.valid=true;this.reasons=0;return this;
 }
}
