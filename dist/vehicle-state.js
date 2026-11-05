// Read-only, fixed-tick shadow observations. No skid classifier or controller.
import {GR86} from './vehicle-spec.js';
export const stateReasons=Object.freeze({history:1,speed:2,contact:4,pose:8,damage:16,nonfinite:32,dt:64,collision:128,splitGrip:256});
export const wrapAngle=x=>Math.atan2(Math.sin(x),Math.cos(x));
const dot=(x,y,z,b)=>x*b[0]+y*b[1]+z*b[2];
export class VehicleStateEstimator{
 constructor(){this.wheels=Array.from({length:4},()=>({}));this.reset();}
 reset(){this.age=0;this.forward=false;this.previous=false;this.valid=false;this.reasons=1;this.U=this.V=this.beta=this.betaDot=this.r=this.rDot=this.poseRate=this.betaDotKinematic=this.yawResidual=0;this.ax=this.az=0;this.tick=0;this.generation=(this.generation||0)+1;for(const w of this.wheels)Object.assign(w,{valid:false,alphaGeom:null,alphaRelaxed:null,phi:null,load:0});}
 update(v,dt){
  this.tick++;this.valid=false;this.reasons=0;
  if(!Number.isFinite(dt)||dt<=0||dt>.04){this.reset();this.reasons=stateReasons.dt;return this;}
  let mass=0,x=0,y=0,z=0,vx=0,vy=0,vz=0,finite=true;
  for(const n of v.nodes){finite&&=Number.isFinite(n.x+n.y+n.z+n.vx+n.vy+n.vz+n.mass)&&n.mass>0;mass+=n.mass;x+=n.x*n.mass;y+=n.y*n.mass;z+=n.z*n.mass;vx+=n.vx*n.mass;vy+=n.vy*n.mass;vz+=n.vz*n.mass;}
  finite&&=Number.isFinite(v.yaw+v.yawRate+v.steer+v.damage+v.roll+v.pitch+v.vx+v.vz+mass)&&mass>0;
  if(!finite){this.reset();this.reasons=stateReasons.nonfinite;return this;}
  this.mass=mass;this.x=x/mass;this.y=y/mass;this.z=z/mass;vx/=mass;vy/=mass;vz/=mass;
  const sn=Math.sin(v.yaw),cs=Math.cos(v.yaw),U=vx*sn+vz*cs,V=vx*cs-vz*sn,beta=Math.atan2(V,U),g=1-Math.exp(-dt/.04);
  this.U=U;this.V=V;this.beta=beta;this.r=v.yawRate;
  this.chassisU=v.vx*sn+v.vz*cs;this.chassisV=v.vx*cs-v.vz*sn;
  if(this.previous){
   const pose=wrapAngle(v.yaw-this.lastYaw)/dt,fd=wrapAngle(beta-this.lastBeta)/dt;
   const ax=(vx-this.lastVX)/dt,az=(vz-this.lastVZ)/dt;
   this.ax+=(ax-this.ax)*g;this.az+=(az-this.az)*g;
   this.poseRate+=(pose-this.poseRate)*g;this.betaDot+=(fd-this.betaDot)*g;this.rDot+=((v.yawRate-this.lastR)/dt-this.rDot)*g;
   const af=ax*sn+az*cs,ar=ax*cs-az*sn,kin=(U*ar-V*af)/Math.max(U*U+V*V,1)-pose;
   this.betaDotKinematic+=(kin-this.betaDotKinematic)*g;
  }
  this.lastVX=vx;this.lastVZ=vz;this.lastYaw=v.yaw;this.lastBeta=beta;this.lastR=v.yawRate;this.previous=true;this.age+=dt;
  this.yawResidual=this.r-this.poseRate;
  this.forward=U>(this.forward?3:5);if(!this.forward)this.reasons|=stateReasons.speed;
  if(this.age<.12)this.reasons|=stateReasons.history;
  const basis=v.basis;let geometry=!!basis&&Number.isFinite(basis.forward[0]+basis.forward[1]+basis.forward[2]+basis.right[0]+basis.right[1]+basis.right[2]+basis.up[0]+basis.up[1]+basis.up[2]);
  if(!geometry){for(const w of this.wheels)w.valid=false;this.reasons|=stateReasons.nonfinite;return this;}
  if(basis.up[1]<.9||Math.abs(v.roll)>.35||Math.abs(v.pitch)>.35)this.reasons|=stateReasons.pose;
  if(v.damage>.03||v.brokenBeams>0)this.reasons|=stateReasons.damage;
  if(v.collisionPulse>.05)this.reasons|=stateReasons.collision;
  let frontLoad=0,rearLoad=0,frontMoment=0,rearMoment=0,minGrip=Infinity,maxGrip=-Infinity;
  for(let i=0;i<4;i++){
   const w=v.wheels[i],n=v.nodes[w.hub],o=this.wheels[i],normal=w.plane?.normal;
   o.load=w.load;o.contact=w.contact;o.steer=w.steerAngle;o.toe=w.toe;o.alphaRelaxed=w.alpha;o.kappa=w.slip;o.fx=w.fx;o.fy=w.fy;o.forceLimit=w.forceLimit;o.x=w.x;o.z=w.z;
   o.valid=!!normal&&normal.every(Number.isFinite)&&Number.isFinite(w.load+w.steerAngle+w.toe+w.alpha+w.slip+w.fx+w.fy+w.forceLimit+w.grip+w.damage+n.vx+n.vy+n.vz);
   o.alphaGeom=o.phi=null;
   if(!o.valid){this.reasons|=stateReasons.nonfinite;continue;}
   if(!w.contact||w.load<100)this.reasons|=stateReasons.contact;
   if(w.damage>.03||Math.abs(w.toe)>.08)this.reasons|=stateReasons.damage;
   minGrip=Math.min(minGrip,w.grip);maxGrip=Math.max(maxGrip,w.grip);if(w.front)frontLoad+=w.load;else rearLoad+=w.load;
   const a=w.steerAngle+w.toe,ca=Math.cos(a),sa=Math.sin(a),f=basis.forward,r=basis.right;
   let fx=f[0]*ca+r[0]*sa,fy=f[1]*ca+r[1]*sa,fz=f[2]*ca+r[2]*sa;
   const p=dot(fx,fy,fz,normal);fx-=normal[0]*p;fy-=normal[1]*p;fz-=normal[2]*p;
   const length=Math.hypot(fx,fy,fz);if(length<1e-6){o.valid=false;this.reasons|=stateReasons.pose;continue;}fx/=length;fy/=length;fz/=length;
   let lx=normal[1]*fz-normal[2]*fy,ly=normal[2]*fx-normal[0]*fz,lz=normal[0]*fy-normal[1]*fx;const ll=Math.hypot(lx,ly,lz);if(ll<1e-6){o.valid=false;this.reasons|=stateReasons.pose;continue;}lx/=ll;ly/=ll;lz/=ll;
   o.long=n.vx*fx+n.vy*fy+n.vz*fz;o.lat=n.vx*lx+n.vy*ly+n.vz*lz;
   o.alphaGeom=Math.atan2(o.lat,Math.max(Math.abs(o.long),1));
   o.hubU=dot(n.vx,n.vy,n.vz,f);o.hubV=dot(n.vx,n.vy,n.vz,r);o.phi=Math.atan2(o.hubV,o.hubU);
   o.bodyLateralForce=dot(w.fx*fx+w.fy*lx,w.fx*fy+w.fy*ly,w.fx*fz+w.fy*lz,r);
   // End-tick approximation of tyre Fx/Fy moment about true all-node COM.
   // Normal force, rolling resistance, drag and structural forces excluded.
   o.yawMoment=(n.z-GR86.tireRadius*normal[2]-this.z)*(w.fx*fx+w.fy*lx)-(n.x-GR86.tireRadius*normal[0]-this.x)*(w.fx*fz+w.fy*lz);
   if(w.front)frontMoment+=o.yawMoment;else rearMoment+=o.yawMoment;
   o.flatNormal=normal[1]>.995;
  }
  this.frontLoad=frontLoad;this.rearLoad=rearLoad;this.frontMoment=frontMoment;this.rearMoment=rearMoment;if(frontLoad<500||rearLoad<500)this.reasons|=stateReasons.contact;
  if(maxGrip-minGrip>.12)this.reasons|=stateReasons.splitGrip;
  this.valid=this.reasons===0;return this;
 }
}
