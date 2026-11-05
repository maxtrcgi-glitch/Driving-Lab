import {clamp} from './physics.js';
// Original handling circuit: flat braking straight, tight hairpin, esses,
// sustained sweepers, elevation/compression and a slow technical return.
const control=[[0,-40],[0,0],[0,150],[0,250],[0,290],[0,310],[-40,370],[-85,350],[-100,270],[-150,220],[-200,270],[-260,260],[-300,180],[-360,160],[-400,40],[-370,-100],[-290,-170],[-330,-250],[-280,-320],[-210,-305],[-160,-220],[-100,-200],[-55,-250],[0,-245],[35,-200],[10,-145],[0,-80]];
export const trackName='Handling Circuit';
export const roadHalfWidth=5,curbWidth=.65,runoffHalfWidth=8;
function cat(p0,p1,p2,p3,t){const t2=t*t,t3=t2*t;return .5*((2*p1)+(-p0+p2)*t+(2*p0-5*p1+4*p2-p3)*t2+(-p0+3*p1-3*p2+p3)*t3);}
const raw=[];
for(let i=0;i<control.length;i++)for(let j=0;j<48;j++){
 const p0=control[(i-1+control.length)%control.length],p1=control[i],p2=control[(i+1)%control.length],p3=control[(i+2)%control.length],t=j/48;
 raw.push({x:cat(p0[0],p1[0],p2[0],p3[0],t),z:cat(p0[1],p1[1],p2[1],p3[1],t)});
}
// Approximately uniform 2 m spacing keeps contact and render geometry consistent.
export const points=[raw[0]];let remaining=2;
for(let i=0;i<raw.length;i++){
 let a={...raw[i]},b=raw[(i+1)%raw.length],length=Math.hypot(b.x-a.x,b.z-a.z);
 while(length>=remaining){const t=remaining/length;a={x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t};points.push(a);length-=remaining;remaining=2;}
 remaining-=length;
}
if(Math.hypot(points.at(-1).x-points[0].x,points.at(-1).z-points[0].z)<.5)points.pop();
if(Math.hypot(points.at(-1).x-points[0].x,points.at(-1).z-points[0].z)>2.1)points.push({x:(points.at(-1).x+points[0].x)/2,z:(points.at(-1).z+points[0].z)/2});
let total=0;
export const segments=points.map((a,i)=>{const b=points[(i+1)%points.length],dx=b.x-a.x,dz=b.z-a.z,length=Math.hypot(dx,dz),s={a,b,dx,dz,length,start:total,index:i};total+=length;return s;});
export const courseLength=total;
const grid=new Map(),cell=20;
for(const s of segments){for(let x=Math.floor(Math.min(s.a.x,s.b.x)/cell)-1;x<=Math.floor(Math.max(s.a.x,s.b.x)/cell)+1;x++)for(let z=Math.floor(Math.min(s.a.z,s.b.z)/cell)-1;z<=Math.floor(Math.max(s.a.z,s.b.z)/cell)+1;z++){const k=x+','+z;(grid.get(k)||grid.set(k,[]).get(k)).push(s);}}
export function nearest(x,z){
 const list=grid.get(Math.floor(x/cell)+','+Math.floor(z/cell))||segments;let bestSquared=Infinity,bestIndex=0,bestProgress=0,bestX=0,bestZ=0;
 for(const s of list){const t=clamp(((x-s.a.x)*s.dx+(z-s.a.z)*s.dz)/(s.length*s.length),0,1),px=s.a.x+t*s.dx,pz=s.a.z+t*s.dz,d=(x-px)**2+(z-pz)**2;if(d<bestSquared){bestSquared=d;bestIndex=s.index;bestProgress=s.start+t*s.length;bestX=px;bestZ=pz;}}
 return {distance:Math.sqrt(bestSquared),index:bestIndex,progress:bestProgress,x:bestX,z:bestZ};
}
export function elevation(x,z){
 // The main straight and separate test pad are flat. Smooth hills are localized
 // to the far side of the circuit; avoid steps in the physical road surface.
 const blend=clamp((-x-45)/70,0,1),smooth=blend*blend*(3-2*blend);
 let h=smooth*(9*Math.exp(-(((x+360)/105)**2+((z-100)/130)**2))-4*Math.exp(-(((x+340)/75)**2+((z+180)/85)**2))+3*Math.exp(-(((x+180)/55)**2+((z-255)/40)**2)));
 if(x>132&&x<144&&z>-35&&z<25){const t=(z+35)/60;h+=.06*Math.sin((z+35)*Math.PI/2)*Math.sin(Math.PI*t)**2;}
 return h;
}
export function curbHeight(distance){const t=(distance-roadHalfWidth)/curbWidth;return t>0&&t<1?.045*Math.sin(Math.PI*t)**2:0;}
export function terrain(x,z){
 if(x>43&&x<174&&z>-74&&z<79)return {height:elevation(x,z),grip:1,surface:'asphalt'};
 const road=nearest(x,z),pad=false;
 const onRoad=road.distance<roadHalfWidth,curb=road.distance>=roadHalfWidth&&road.distance<roadHalfWidth+curbWidth,runoff=road.distance<runoffHalfWidth;
 return {height:elevation(x,z)+(pad?0:curbHeight(road.distance)),grip:pad||onRoad?1.0:curb?.92:runoff?.72:.55,surface:pad||onRoad?'asphalt':curb?'curb':runoff?'gravel':'grass'};
}
export const trackFeatures=[
 {name:'Braking straight',x:0,z:150},{name:'Hairpin',x:-50,z:365},
 {name:'Esses',x:-165,z:235},{name:'Crest & sweeper',x:-360,z:120},
 {name:'Compression',x:-340,z:-180},{name:'Technical return',x:-40,z:-250}
].map(feature=>{const p=nearest(feature.x,feature.z);return {...feature,x:p.x,z:p.z};});
export const barriers=[];
for(let x=82;x<=98;x+=1.5)barriers.push({x,z:53,r:.85,height:1.1,type:'barrier'});
barriers.push({x:110,z:42,r:.35,height:2.8,type:'pole'});
export const spawns={track:{x:0,z:0,yaw:0},pad:{x:90,z:-40,yaw:0},bumps:{x:138,z:-45,yaw:0}};
