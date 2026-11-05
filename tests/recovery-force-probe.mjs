// Offline only; records exact pre-integration forces, never changes dynamics.
import {Vehicle} from '../dist/physics.js';
import {GR86} from '../dist/vehicle-spec.js';
export function momentum(v){let m=0,x=0,y=0,z=0,vx=0,vz=0;for(const n of v.nodes){m+=n.mass;x+=n.mass*n.x;y+=n.mass*n.y;z+=n.mass*n.z;vx+=n.mass*n.vx;vz+=n.mass*n.vz;}x/=m;y/=m;z/=m;vx/=m;vz/=m;let L=0,I=0;for(const n of v.nodes){const dx=n.x-x,dz=n.z-z;L+=n.mass*(dz*(n.vx-vx)-dx*(n.vz-vz));I+=n.mass*(dx*dx+dz*dz);}return {m,x,y,z,vx,vz,L,I};}
export class ForceProbe{
 constructor(v){this.v=v;this.sums=new Float64Array(13);this.wheels=new Float64Array(4*12);this.count=0;this.closureMax=0;const original=v.distributeCouple;const p=this;v.distributeCouple=function(){p.recordBefore();original.call(this);p.recordAfter();};}
 clear(){this.sums.fill(0);this.wheels.fill(0);this.count=0;}
 recordBefore(){const v=this.v,m=momentum(v);this.com=m;const f=v.basis.forward,r=v.basis.right;let frontM=0,rearM=0,normalM=0,frontR=0,rearR=0,frontF=0,rearF=0,rollM=0,fxM=0,fyM=0;
 for(let i=0;i<4;i++){const w=v.wheels[i],n=v.nodes[w.hub],normal=w.plane.normal,a=w.steerAngle+w.toe,c=Math.cos(a),s=Math.sin(a);let x=f[0]*c+r[0]*s,y=f[1]*c+r[1]*s,z=f[2]*c+r[2]*s;const d=x*normal[0]+y*normal[1]+z*normal[2];x-=normal[0]*d;y-=normal[1]*d;z-=normal[2]*d;let len=Math.hypot(x,y,z);x/=len;y/=len;z/=len;let lx=normal[1]*z-normal[2]*y,ly=normal[2]*x-normal[0]*z,lz=normal[0]*y-normal[1]*x;len=Math.hypot(lx,ly,lz);lx/=len;ly/=len;lz/=len;
 const long=n.vx*x+n.vy*y+n.vz*z,lat=n.vx*lx+n.vy*ly+n.vz*lz,rx=n.x-GR86.tireRadius*normal[0]-m.x,rz=n.z-GR86.tireRadius*normal[2]-m.z;
 const roll=-w.load*(w.surface==='grass'?.045:w.surface==='gravel'?.026:.011)*Math.tanh(long*3),tx=(w.fx+roll)*x+w.fy*lx,tz=(w.fx+roll)*z+w.fy*lz,mt=rz*tx-rx*tz;
 const right=tx*Math.cos(v.yaw)-tz*Math.sin(v.yaw),forward=tx*Math.sin(v.yaw)+tz*Math.cos(v.yaw);
 if(w.front){frontM+=mt;frontR+=right;frontF+=forward;}else{rearM+=mt;rearR+=right;rearF+=forward;}
 normalM+=rz*normal[0]*w.load-rx*normal[2]*w.load;rollM+=roll*(rz*x-rx*z);fxM+=w.fx*(rz*x-rx*z);fyM+=w.fy*(rz*lx-rx*lz);
 const rest=GR86.mass*9.81*(w.front?GR86.frontWeight:1-GR86.frontWeight)/2,scale=Math.pow(Math.max(.08,Math.min(3.5,w.load/rest)),.8),q=Math.hypot(rest*23*scale*w.slip,(w.front?46000:60000)*scale*Math.tan(Math.max(-1.3,Math.min(1.3,w.alpha)))),k=i*12;
 const vals=[Math.atan2(lat,Math.max(Math.abs(long),1)),w.alpha,w.slip,w.fx,w.fy,w.load,w.forceLimit,w.load>100?q/(3*Math.max(w.forceLimit,1)):NaN,w.driveTorque,w.steerAngle,w.contact?1:0,mt];for(let j=0;j<12;j++)this.wheels[k+j]+=vals[j];
 }
 const vals=[frontM,rearM,normalM,frontR,rearR,frontF,rearF,rollM,fxM,fyM,0,0,0];for(let j=0;j<10;j++)this.sums[j]+=vals[j];this.currentM=frontM+rearM+normalM;
 }
 recordAfter(){let total=0;const m=this.com;for(const n of this.v.nodes)total+=(n.z-m.z)*n.fx-(n.x-m.x)*n.fz;const error=total-this.currentM;this.sums[10]+=total;this.sums[11]+=error;this.sums[12]+=Math.abs(error);this.closureMax=Math.max(this.closureMax,Math.abs(error));this.count++;}
 mean(){return {axles:Array.from(this.sums,x=>x/this.count),wheels:Array.from(this.wheels,x=>x/this.count)};}
}
