import {segments,courseLength,nearest,elevation} from './course.js';
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
// Read-only preview. Track search stays on the initial branch/progress window.
export class CameraRoad{
 constructor(highway){this.highway=highway;this.clock=1;this.index=null;this.location=null;this.out={x:0,y:0,z:0,confidence:0,curvature:0,branch:'none'};}
 reset(){this.clock=1;this.index=null;this.location=null;this.out.confidence=0;}
 rebase(shift){this.out.z-=shift;}
 step(v,location,h){this.clock+=h;if(location!==this.location){this.reset();this.location=location;}if(this.clock<1/30)return;this.clock=0;const o=this.out,L=clamp(v.speed*.65,8,55),f=v.basis.forward;o.confidence=0;
 if(location==='highway'){const p=this.highway.project(v.x,v.z),g=this.highway.gradient(p.s),alignment=(f[0]*g+f[2])/Math.hypot(g,1);if(Math.abs(p.offset)>15||alignment<.65)return;const t=this.highway.point(p.s+L,p.offset);o.x=t.x;o.z=t.z;o.y=t.y+(v.y-this.highway.height(p.s));o.curvature=this.highway.curvature(p.s);o.confidence=alignment*clamp((16-Math.abs(p.offset))/3,0,1);o.branch='highway-forward';}
 else if(location==='track'){if(this.index===null)this.index=nearest(v.x,v.z).index;let best=Infinity,chosen=null,t=0;const count=segments.length,window=18;for(let j=-window;j<=window;j++){const s=segments[(this.index+j+count)%count],u=clamp(((v.x-s.a.x)*s.dx+(v.z-s.a.z)*s.dz)/(s.length*s.length),0,1),x=s.a.x+u*s.dx,z=s.a.z+u*s.dz,d=(v.x-x)**2+(v.z-z)**2;if(d<best){best=d;chosen=s;t=u;}}if(!chosen||best>144)return;const alignment=(f[0]*chosen.dx+f[2]*chosen.dz)/chosen.length;if(alignment<.55)return;this.index=chosen.index;const offset=((v.x-chosen.a.x-t*chosen.dx)*chosen.dz-(v.z-chosen.a.z-t*chosen.dz)*chosen.dx)/chosen.length;const progress=(chosen.start+t*chosen.length+L)%courseLength;let future=chosen;for(let j=0;j<80;j++){const s=segments[(chosen.index+j)%count];if(progress>=s.start&&progress<=s.start+s.length){future=s;break;}}const u=clamp((progress-future.start)/future.length,0,1);o.x=future.a.x+u*future.dx+offset*future.dz/future.length;o.z=future.a.z+u*future.dz-offset*future.dx/future.length;o.y=elevation(o.x,o.z)+(v.y-elevation(v.x,v.z));o.curvature=Math.atan2(future.dx*chosen.dz-future.dz*chosen.dx,future.dx*chosen.dx+future.dz*chosen.dz)/L;o.confidence=alignment*clamp((12-Math.sqrt(best))/5,0,1);o.branch='circuit-continuous';}
 }
}
