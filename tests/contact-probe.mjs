// Test-only read-only force hook at actual final substep, before integration.
// Never copied into runtime or used to choose driver commands.
import {GR86} from '../dist/vehicle-spec.js';
import {tireForce} from '../dist/physics.js';
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const norm=a=>{const l=Math.hypot(...a);return a.map(x=>x/l);};
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
export function contactProbe(v){
 const original=v.distributeCouple;let latest=null,calls=0;
 v.distributeCouple=function(){
  // Stand uses DT=1/240, eight1/1920 substeps; capture only the eighth.
  if(++calls%8!==0)return original.call(this);
  let mass=0,x=0,y=0,z=0,vx=0,vz=0;
  for(const n of this.nodes){mass+=n.mass;x+=n.mass*n.x;y+=n.mass*n.y;z+=n.mass*n.z;vx+=n.mass*n.vx;vz+=n.mass*n.vz;}x/=mass;y/=mass;z/=mass;vx/=mass;vz/=mass;
  const wheels=this.wheels.map(w=>{
   const hub=this.nodes[w.hub],N=w.plane.normal,a=w.steerAngle+w.toe,co=Math.cos(a),si=Math.sin(a);
   let f=this.basis.forward.map((q,i)=>q*co+this.basis.right[i]*si);const projection=dot(f,N);f=norm(f.map((q,i)=>q-N[i]*projection));const lat=norm(cross(N,f));
   const velocity=[hub.vx,hub.vy,hub.vz],long=dot(velocity,f),lateral=dot(velocity,lat),alpha=Math.atan2(lateral,Math.max(Math.abs(long),1));
   const F=f.map((q,i)=>w.fx*q+w.fy*lat[i]),rx=hub.x-GR86.tireRadius*N[0]-x,rz=hub.z-GR86.tireRadius*N[2]-z;
   const moment=rz*F[0]-rx*F[2];
   return {x:w.x,z:w.z,front:w.front,alpha,relaxed:w.alpha,load:w.load,kappa:w.slip,fx:w.fx,fy:w.fy,limit:w.forceLimit,grip:w.grip,omega:w.omega,normal:[...N],hubVelocity:velocity,rx,rz,bodyLateral:dot(F,this.basis.right),moment,contact:w.contact,steer:w.steerAngle,toe:w.toe,
    hubU:dot(velocity,this.basis.forward),hubV:dot(velocity,this.basis.right)};
  });
  latest={x,y,z,vx,vz,yaw:this.yaw,r:this.yawRate,basis:structuredClone(this.basis),wheels,frontMoment:wheels.slice(0,2).reduce((s,w)=>s+w.moment,0),rearMoment:wheels.slice(2).reduce((s,w)=>s+w.moment,0)};
  return original.call(this);
 };
 return ()=>latest;
}
// Frozen contact/load/hub velocities; memory relaxation only. This is NOT a
// vehicle rollout, steering issuance, feasible rate trajectory or recovery proof.
export function localRackProbe(p,rack,horizon=.05){
 let moment=0,lateral=0,alphaAbs=0;
 for(const w of p.wheels.slice(0,2)){
  const angle=(Math.abs(rack)<1e-5?0:Math.atan(GR86.wheelbase/(GR86.wheelbase/Math.tan(rack)-w.x)))+w.toe;
  let f=p.basis.forward.map((q,i)=>q*Math.cos(angle)+p.basis.right[i]*Math.sin(angle));const projection=dot(f,w.normal);f=norm(f.map((q,i)=>q-w.normal[i]*projection));const lat=norm(cross(w.normal,f));
  const long=dot(w.hubVelocity,f),side=dot(w.hubVelocity,lat),transport=Math.max(Math.abs(long),2);
  const geom=Math.atan2(side,Math.max(Math.abs(long),1)),alpha=w.relaxed+(geom-w.relaxed)*(1-Math.exp(-horizon*transport/.30));
  const slip=Math.max(-5,Math.min(5,(w.omega*GR86.tireRadius-long)/transport));const kappa=w.kappa+(slip-w.kappa)*(1-Math.exp(-horizon*transport/.25));
  const force=tireForce(w.load,GR86.mass*9.81*GR86.frontWeight/2,w.grip,kappa,alpha,true),F=f.map((q,i)=>force.fx*q+force.fy*lat[i]);
  moment+=w.rz*F[0]-w.rx*F[2];lateral+=dot(F,p.basis.right);alphaAbs+=Math.abs(geom)/2;
 }
 return {moment,lateral,alphaAbs};
}
