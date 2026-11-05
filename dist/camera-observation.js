import * as THREE from './three.module.js';
const finite=v=>Number.isFinite(v.x)&&Number.isFinite(v.y)&&Number.isFinite(v.z);
// Seat kinematics use the SAME anchor and chassis frame as the rendered car.
// Finite differences are simulation-time samples; rebasing translates history.
export class CameraObservation{
 constructor(eye){this.eye=eye.clone();for(const k of ['position','previousPosition','velocity','previousVelocity','acceleration','filteredAcceleration','slowAcceleration','omega','previousOmega','alpha','localAlpha','previousOrigin'])this[k]=new THREE.Vector3();this.q=new THREE.Quaternion();this.previousQ=new THREE.Quaternion();this.deltaQ=new THREE.Quaternion();this.inverseQ=new THREE.Quaternion();this.matrix=new THREE.Matrix4();this.r=new THREE.Vector3();this.u=new THREE.Vector3();this.f=new THREE.Vector3();this.ready=0;this.valid=false;this.generation=0;this.speed=0;this.forwardSpeed=0;this.beta=0;this.safe=0;this.age=0;}
 pose(v){this.r.fromArray(v.basis.right);this.u.fromArray(v.basis.up);this.f.fromArray(v.basis.forward);this.matrix.makeBasis(this.r,this.u,this.f);this.q.setFromRotationMatrix(this.matrix).normalize();this.position.copy(this.eye).applyQuaternion(this.q).add(this.previousOrigin.set(v.x,v.y,v.z));}
 reset(v){this.ready=0;this.age=0;this.generation++;this.pose(v);this.previousPosition.copy(this.position);this.previousQ.copy(this.q);this.velocity.set(0,0,0);this.previousVelocity.set(0,0,0);this.previousOmega.set(0,0,0);this.acceleration.set(0,0,0);this.filteredAcceleration.set(0,0,0);this.slowAcceleration.set(0,0,0);this.localAlpha.set(0,0,0);this.valid=false;this.safe=0;this.speed=0;this.forwardSpeed=0;this.beta=0;}
 rebase(shift){this.position.z-=shift;this.previousPosition.z-=shift;this.previousOrigin.z-=shift;}
 invalidate(){this.ready=0;this.valid=false;this.safe=0;this.speed=0;this.forwardSpeed=0;this.beta=0;}
 step(v,h){this.pose(v);if(!(h>0&&h<=.025)||!finite(this.position)||!Number.isFinite(v.vx+v.vy+v.vz)||this.position.distanceToSquared(this.previousPosition)>4){this.reset(v);return;}
 this.velocity.copy(this.position).sub(this.previousPosition).multiplyScalar(1/h);
 this.deltaQ.copy(this.previousQ).conjugate();this.deltaQ.premultiply(this.q);if(this.deltaQ.w<0)this.deltaQ.set(-this.deltaQ.x,-this.deltaQ.y,-this.deltaQ.z,-this.deltaQ.w);const n=Math.hypot(this.deltaQ.x,this.deltaQ.y,this.deltaQ.z),k=n>1e-9?2*Math.atan2(n,this.deltaQ.w)/(n*h):2/h;this.omega.set(this.deltaQ.x*k,this.deltaQ.y*k,this.deltaQ.z*k);
 this.inverseQ.copy(this.q).conjugate();
 if(this.ready>0){this.acceleration.copy(this.velocity).sub(this.previousVelocity).multiplyScalar(1/h);this.alpha.copy(this.omega).sub(this.previousOmega).multiplyScalar(1/h).applyQuaternion(this.inverseQ);
 // Specific-force change from upright rest, limited BEFORE spring forcing.
 this.acceleration.y+=9.80665;this.acceleration.applyQuaternion(this.inverseQ);this.acceleration.y-=9.80665;
 this.acceleration.clampScalar(-50,50);this.alpha.clampScalar(-30,30);this.filteredAcceleration.lerp(this.acceleration,1-Math.exp(-h/.04));this.slowAcceleration.lerp(this.filteredAcceleration,1-Math.exp(-h/.22));this.localAlpha.lerp(this.alpha,1-Math.exp(-h/.08));}
 this.previousPosition.copy(this.position);this.previousVelocity.copy(this.velocity);this.previousQ.copy(this.q);this.previousOmega.copy(this.omega);this.ready++;this.age+=h;
 const U=v.vx*this.f.x+v.vy*this.f.y+v.vz*this.f.z,V=v.vx*this.r.x+v.vy*this.r.y+v.vz*this.r.z;this.forwardSpeed=U;this.speed=Math.hypot(v.vx,v.vy,v.vz);this.beta=Math.atan2(V,U);this.valid=this.ready>2&&finite(this.filteredAcceleration)&&Number.isFinite(this.beta);
 let contacts=0;for(const w of v.wheels)if(w.contact)contacts++;this.safe=this.valid&&this.u.y>.45&&contacts>=2&&v.damage<.65&&v.collisionPulse<.5?1:0;
 }
}
