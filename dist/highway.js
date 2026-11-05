// Deterministic endless road, road-space traffic and a floating render origin.
// Traffic uses a lightweight planar model; only the player has node/beam dynamics.
import {clamp} from './physics.js';
import {RoadGeometry} from './road-geometry.js';
export const LANE_WIDTH=3.6,LANES=[-3.8,-7.4,-11,3.8,7.4,11],CHUNK=200,MAX_TRAFFIC=120;
// Outside the unchanged fog visibility envelope (~1262m at 1% contrast).
export const TRAFFIC_RETIRE=2200,TRAFFIC_ENTRY=1320,TRAFFIC_REAR=1300;
export function hash(n){const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x);}
export class Highway{
 constructor(seed=86){this.seed=seed;this.geometry=new RoadGeometry(seed);this._roadSample={};this.origin=0;this.cars=[];this.density=28;this.passes=0;this.contacts=0;this.topSpeed=0;this.distance=0;this.serial=0;this.clock=0;this.aiClock=0;this.spawnFailures=0;this.spawned=0;this.retired=0;this.trafficSeed=seed>>>0;this._current={};this._candidate={};this._crashed=new Uint16Array(MAX_TRAFFIC);this.decisions=0;this.laneChanges=0;this.rejectedChanges=0;this.barrierContacts=0;this.npcContacts=0;this.pairChecks=0;this._laneLists=Array.from({length:6},()=>[]);this._useLaneIndex=false;this.abortedChanges=0;}
 sample(s){if(this.geometry.seed!==this.seed){this.geometry.seed=this.seed;this.geometry.blocks.clear();}return this.geometry.sample(s,this._roadSample);}
 center(s){return this.sample(s).x;}
 gradient(s){return this.sample(s).g;}
 curvature(s){return this.sample(s).g2;}
 height(s){return this.sample(s).y;}
 heightGradient(s){return this.sample(s).grade;}
 metric(s,offset=0){const p=this.sample(s),n=Math.hypot(1,p.g),factor=1-offset*p.g2/n**3;return Math.hypot(n*factor,p.grade);}
 point(s,offset=0){const p=this.sample(s),n=Math.hypot(1,p.g),factor=1-offset*p.g2/n**3;return {x:p.x+offset/n,y:p.y,z:s-offset*p.g/n-this.origin,yaw:Math.atan(p.g),pitch:Math.atan2(p.grade,n*factor)};}
 // Additive numeric Road Frame API; caller owns reusable array storage.
 frame(s,offset=0,out={position:[],right:[],up:[],forward:[]}){const p=this.sample(s),n=Math.hypot(1,p.g),factor=1-offset*p.g2/n**3,L=Math.hypot(n*factor,p.grade),rx=1/n,rz=-p.g/n,fx=p.g*factor/L,fy=p.grade/L,fz=factor/L;
  out.position[0]=p.x+offset/n;out.position[1]=p.y;out.position[2]=s-offset*p.g/n-this.origin;out.right[0]=rx;out.right[1]=0;out.right[2]=rz;out.forward[0]=fx;out.forward[1]=fy;out.forward[2]=fz;out.up[0]=fy*rz;out.up[1]=fz*rx-fx*rz;out.up[2]=-fy*rx;out.grade=p.grade/(n*factor);out.curvature=p.g2/n**3;out.yaw=Math.atan(p.g);out.parameterization='legacy-global-z-v1';return out;}
 project(x,z){const globalZ=z+this.origin;let s=globalZ;for(let i=0;i<3;i++){const dx=this.center(s)-x,g=this.gradient(s);s-=(s-globalZ+dx*g)/(1+g*g+dx*this.curvature(s));}const g=this.gradient(s),offset=((x-this.center(s))-(globalZ-s)*g)/Math.hypot(1,g);return {s,offset};}
 terrain(x,z){const {s,offset}=this.project(x,z),a=Math.abs(offset);return {height:this.height(s),grip:a>=1.6&&a<=14?1:a<16?.72:.55,surface:a>=1.6&&a<=14?'asphalt':a<16?'gravel':'grass'};}
 reset(seed=this.seed,trafficSeed=seed){this.seed=seed;this.trafficSeed=trafficSeed>>>0;this.origin=0;this.cars.length=0;this.clock=0;this.aiClock=1/30;this.spawnFailures=0;this.spawned=0;this.retired=0;this.passes=0;this.contacts=0;this.topSpeed=0;this.distance=0;this.serial=0;this.playerForwardSpeed=0;this.decisions=0;this.laneChanges=0;this.rejectedChanges=0;this.barrierContacts=0;this.npcContacts=0;this.pairChecks=0;this.abortedChanges=0;this._useLaneIndex=false;this.setDensity(this.density,0);let lead=null,rear=null;for(const c of this.cars)if(c.lane===1){if(c.s>0&&(!lead||c.s<lead.s))lead=c;if(c.s<0&&(!rear||c.s>rear.s))rear=c;}const speed=lead?.speed??28;if(rear)rear.speed=Math.min(rear.speed,speed);return {...this.point(0,LANES[1]),speed};}
 setDensity(count,playerS,playerOffset=LANES[1]){this.playerOffset=playerOffset;this.density=clamp(Math.round(count),0,MAX_TRAFFIC);while(this.cars.length>this.density){this.cars.pop();this.retired++;}let attempts=0;while(this.cars.length<this.density&&attempts++<500)this.spawn(playerS,true);}
 spawn(playerS,initial=false,existing=null){
  const id=existing?.id??this.serial++,generation=existing?existing.generation+1:0,key=id+this.trafficSeed*99+generation*1009;
  const baseLane=id%6===5?3+Math.floor(id/6)%3:id%3;
  let lane=existing?.lane??baseLane;const dir=lane<3?1:-1,r=hash(key),truck=existing?.truck??(r>.78+hash(this.trafficSeed+17)*.10);
  let row=0;for(const c of this.cars)if(c!==existing&&c.lane===lane)row++;
  const spacing=60+hash(this.trafficSeed+lane*31)*6,phase=[18,0,-18,8,-12,25][lane];
  const ownLane=Math.abs(LANES[lane]-(this.playerOffset??LANES[1]))<2.8;
  const slot=ownLane?(row%2===0?1+row/2:-(row+1)/2):(row===0?0:row%2===1?(row+1)/2:-(row/2));
  // Keep rolling-start neighbours, spread the remaining population across
  // the persistent ring. The old compact rows exhausted together.
  const coIndex=id-Math.floor((id+1)/6),coTotal=this.density-Math.floor(this.density/6);
  const anchors=4,rank=coIndex-(coIndex>4?4:coIndex>2?3:coIndex);
  const count=dir>0?Math.max(1,coTotal-anchors):Math.max(1,Math.floor(this.density/6)-1);
  const anchor=dir>0?(ownLane?row<2:row===0):row===0;
  const spreadRank=dir>0?rank:Math.floor(id/6)-1;
  const boundedRank=((spreadRank%count)+count)%count;
  const spread=-1240+(boundedRank+.5)*2480/count;
  // Select the arrival side from relative road velocity. NPC speed is never
  // increased to chase the player. Outgoing actors re-enter beyond visibility.
  const relative=existing?existing.dir*existing.speed-(this.playerForwardSpeed??28):0;
  const entrySide=relative>0?-1:1;
  let s=playerS+(initial?(anchor?slot*spacing+phase+(hash(key+7)-.5)*6:spread):entrySide*(TRAFFIC_ENTRY+hash(key+this.clock)*12)),found=false;
  for(let choice=0;choice<(existing?3:1)&&!found;choice++){
   if(choice){lane=Math.floor(baseLane/3)*3+(baseLane%3+choice)%3;s=playerS+entrySide*TRAFFIC_ENTRY;}
   for(let tries=0;tries<160;tries++){
    let clear=Math.abs(LANES[lane]-(this.playerOffset??LANES[1]))>2.8||Math.abs(s-playerS)>55;
    if(clear)for(const c of this.cars)if(c!==existing&&Math.abs(c.s-s)<=46&&(c.lane===lane||c.targetLane===lane||Math.abs(c.offset-LANES[lane])<=2.6)){clear=false;break;}
    if(clear){found=true;break;}
    if(initial){s+=12;if(s>playerS+1240)s=playerS-1240;}
    else{s+=entrySide*12;if(Math.abs(s-playerS)>TRAFFIC_RETIRE-8)s=playerS+entrySide*TRAFFIC_ENTRY;}
   }
  }
  if(!found){this.spawnFailures++;return null;}
  const profile=existing?.profile??(hash(key+101)<.23?'cautious':hash(key+101)>.77?'brisk':'regular');
  const headway=profile==='cautious'?1.75:profile==='brisk'?1.18:1.45;
  const speed=existing?.desired??clamp((truck?21:25)+hash(key+3)*7+(lane%3===0?2:0)+(profile==='brisk'?3:profile==='cautious'?-2:0),18,truck?29:39),p=this.point(s,LANES[lane]);
  const car={id,generation,lane,targetLane:lane,offset:LANES[lane],dir,s,speed,desired:speed,profile,headway,driverProfile:profile==='brisk'?'Assertive':profile==='cautious'?'Calm':'Normal',comfortableBrake:profile==='cautious'?2.5:3,jerkLimit:profile==='brisk'?3:2.2,lastDecisionAt:-1,maxAccel:profile==='brisk'?1.9:profile==='cautious'?1.2:1.5,truck,length:truck?6.8:4.55,width:truck?2.3:1.82,mass:truck?4200:1500,inertia:truck?19000:2600,x:p.x,z:p.z,y:p.y,pitch:p.pitch*dir,yaw:p.yaw+(dir<0?Math.PI:0),vx:Math.sin(p.yaw)*speed*dir,vz:Math.cos(p.yaw)*speed*dir,yawRate:0,acceleration:0,braking:false,changing:0,changeDuration:3.8+hash(key+19)*.6,startOffset:LANES[lane],cooldown:3+hash(key+29)*7,crashed:false,hitAt:-Infinity,passed:false,wasAhead:s>playerS+5,lastAhead:s-playerS};
  this.spawned++;if(existing){this.retired++;Object.assign(existing,car);}else this.cars.push(car);return car;
 }
 buildLaneIndex(){for(const list of this._laneLists)list.length=0;for(const c of this.cars)for(let lane=0;lane<6;lane++)if(this.occupies(c,lane))this._laneLists[lane].push(c);for(const list of this._laneLists)list.sort((a,b)=>a.s-b.s||a.id-b.id);this._useLaneIndex=!this.cars.some(c=>c.crashed);}
 reserveLane(c,lane){if(!this._useLaneIndex)return;const list=this._laneLists[lane];if(!list.includes(c)){list.push(c);list.sort((a,b)=>a.s-b.s||a.id-b.id);}}
 occupies(c,lane){return c.lane===lane||c.targetLane===lane||Math.abs(c.offset-LANES[lane])<(c.width+2.3)/2;}
 laneInfo(car,lane,player,out){
  out.gap=Infinity;out.lead=null;out.leadSpeed=car.speed;out.rearGap=Infinity;out.rearSpeed=0;out.rear=null;
  let candidates=this.cars;
  if(this._useLaneIndex){const list=this._laneLists[lane];let lo=0,hi=list.length;while(lo<hi){const mid=(lo+hi)>>>1;if(list[mid].s<car.s)lo=mid+1;else hi=mid;}let a=lo-1,b=lo;while(a>=0&&(list[a]===car||!this.occupies(list[a],lane)))a--;while(b<list.length&&(list[b]===car||!this.occupies(list[b],lane)))b++;this._neighbors??=[null,null];this._neighbors[0]=a>=0?list[a]:null;this._neighbors[1]=b<list.length?list[b]:null;candidates=this._neighbors;}
  for(const other of candidates){if(!other||other===car||other.dir!==car.dir||!this.occupies(other,lane))continue;
   const d=(other.s-car.s)*car.dir,g=Math.abs(d)-(car.length+other.length)/2;
   if(d>=0&&g<out.gap){out.gap=g;out.lead=other;out.leadSpeed=other.speed;}else if(d<0&&g<out.rearGap){out.rearGap=g;out.rear=other;out.rearSpeed=other.speed;}
  }
  if(player&&Math.abs(player.s-car.s)<=220&&Math.abs(player.offset-LANES[lane])<2.6){const d=(player.s-car.s)*car.dir,g=Math.abs(d)-(car.length+4.55)/2;
   if(d>=0&&g<out.gap){out.gap=g;out.lead=null;out.leadSpeed=player.forwardSpeed*car.dir;}else if(d<0&&g<out.rearGap){out.rearGap=g;out.rear=null;out.rearSpeed=player.forwardSpeed*car.dir;}
  }return out;
 }
 gap(car,lane){return this.laneInfo(car,lane,null,{gap:0});}
 targetSpeed(car){
  // Persistent desired speed, modified deterministically by lane, density, curve and grade.
  const lane=car.targetLane%3,laneFactor=lane===0?1.035:lane===2?.98:1;
  const curve=Math.abs(this.curvature(car.s)),curveLimit=Math.sqrt((car.truck?1.6:2.5)/Math.max(curve,1e-6));
  const grade=Math.max(0,this.heightGradient(car.s)*car.dir),densityFactor=1-.04*Math.max(0,(this.density-28)/92);
  return Math.max(10,Math.min(car.desired*laneFactor*densityFactor/(1+grade*(car.truck?2:1)),curveLimit));
 }
 accelerationFor(car,gap,leadSpeed){const brake=car.comfortableBrake??3,target=this.targetSpeed(car),wanted=5+car.speed*car.headway+Math.max(0,car.speed*(car.speed-leadSpeed)/(2*Math.sqrt(car.maxAccel*brake)));
  return clamp(car.maxAccel*(1-(car.speed/target)**4-(wanted/Math.max(gap,.5))**2),-8,car.maxAccel);
 }
 laneSafe(car,info){
  const frontClosing=Math.max(0,car.speed-info.leadSpeed),rearClosing=Math.max(0,info.rearSpeed-car.speed),duration=car.changeDuration??4;
  return info.gap>Math.max(12,car.speed*.7,frontClosing*duration+8)&&info.rearGap>Math.max(12,info.rearSpeed*.8,rearClosing*duration+10)&&this.accelerationFor(car,info.gap,info.leadSpeed)>-2.5&&(info.rearGap===Infinity||info.rearGap>6+info.rearSpeed*1.1+Math.max(0,info.rearSpeed*(info.rearSpeed-car.speed)/(2*Math.sqrt(1.5*3))));
 }
 safeLane(car,lane,player){if(lane<0||lane>5||Math.floor(lane/3)!==Math.floor(car.lane/3))return false;return this.laneSafe(car,this.laneInfo(car,lane,player,this._candidate));}
 decide(car,player){
  if(car.changing&&car.targetLane!==car.lane&&!car.aborting&&1-car.changing/car.changeDuration<.35&&car.speed>8){
   const target=this.laneInfo(car,car.targetLane,player,this._candidate),frontClosing=Math.max(0,car.speed-target.leadSpeed),rearClosing=Math.max(0,target.rearSpeed-car.speed);
   const threatened=target.gap<8||target.rearGap<8||(frontClosing>0&&target.gap/frontClosing<2)||(rearClosing>0&&target.rearGap/rearClosing<2);
   if(threatened&&this.safeLane(car,car.lane,player)){car.startOffset=car.offset;car.startLateralV=car.lateralV||0;car.startLateralA=car.lateralA||0;car.targetLane=car.lane;car.changeDuration=3.8;car.changing=car.changeDuration;car.aborting=true;car.cooldown=Math.max(car.cooldown,12);this.abortedChanges++;}
  }
  this.decisions++;const current=this.laneInfo(car,car.targetLane,player,this._current);let acc=this.accelerationFor(car,current.gap,current.leadSpeed);
  if(!car.changing&&car.cooldown<=0){let best=-1,bestScore=.3;const blocked=current.gap<100&&current.leadSpeed<car.desired-1.5;
   for(let delta=-1;delta<=1;delta+=2){const lane=car.lane+delta;if(lane<0||lane>5||Math.floor(lane/3)!==Math.floor(car.lane/3))continue;
    // Keep outer lanes when clear. No gratuitous passing-lane oscillation.
    if(!blocked&&delta<0)continue;const next=this.laneInfo(car,lane,player,this._candidate);
    if(!this.laneSafe(car,next)){this.rejectedChanges++;continue;}
    const nextAcc=this.accelerationFor(car,next.gap,next.leadSpeed),score=nextAcc-acc+(blocked?(delta<0?.4:0):(delta>0?.38:0));
    if(score>bestScore&&(blocked?next.gap>current.gap+12:nextAcc>-.15)){best=lane;bestScore=score;}
   }
   if(best>=0){car.targetLane=best;this.reserveLane(car,best);car.startOffset=car.offset;car.startLateralV=car.startLateralA=0;car.aborting=false;car.changing=car.changeDuration;car.cooldown=12+hash(car.id+this.trafficSeed+this.clock)*7;this.laneChanges++;const next=this.laneInfo(car,best,player,this._candidate);acc=Math.min(acc,this.accelerationFor(car,next.gap,next.leadSpeed));}
  }
  // Reserve both lanes throughout the manoeuvre; brake for either lead.
  if(car.changing&&car.lane!==car.targetLane){const source=this.laneInfo(car,car.lane,player,this._candidate);acc=Math.min(acc,this.accelerationFor(car,source.gap,source.leadSpeed));}
  const closing=Math.max(0,car.speed-current.leadSpeed),ttc=closing>.1?current.gap/closing:Infinity;
  const emergency=acc<-3&&(ttc<1.5||current.gap<4+car.speed*.65);
  const decisionDt=car.lastDecisionAt>=0?clamp(this.clock-car.lastDecisionAt,0,.1):1/30;
  if(!emergency)acc=clamp(acc,car.acceleration-(car.jerkLimit??2.2)*decisionDt,car.acceleration+(car.jerkLimit??2.2)*decisionDt);
  car.lastDecisionAt=this.clock;car.emergencyBraking=emergency;car.acceleration=acc;car.braking=acc<-.7;
 }
 step(dt,vehicle){
  this.clock+=dt;const player=this.project(vehicle.x,vehicle.z),g=this.gradient(player.s);player.forwardSpeed=(vehicle.vx*g+vehicle.vz)/Math.hypot(1,g);this.playerOffset=player.offset;this.playerForwardSpeed=player.forwardSpeed;this.distance=Math.max(this.distance,player.s);this.topSpeed=Math.max(this.topSpeed,vehicle.speed*3.6);
  this.aiClock+=dt;const decide=this.aiClock>=1/30-1e-9;if(decide){this.aiClock=Math.max(0,this.aiClock-1/30);this.buildLaneIndex();}
  for(const c of this.cars){
   const closing=c.dir*c.speed-player.forwardSpeed;
   if(c.s<player.s-(closing>0?TRAFFIC_RETIRE:TRAFFIC_REAR)||c.s>player.s+(closing>0?TRAFFIC_REAR:TRAFFIC_RETIRE)){this.spawn(player.s,false,c);this._useLaneIndex=false;continue;}
   if(c.crashed){const speed=Math.hypot(c.vx,c.vz),factor=Math.max(0,1-(1.1+.002*speed*speed)*dt/Math.max(speed,.01));c.vx*=factor;c.vz*=factor;c.x+=c.vx*dt;c.z+=c.vz*dt;c.yaw+=c.yawRate*dt;c.yawRate*=Math.exp(-dt*1.3);const projected=this.project(c.x,c.z);c.s=projected.s;c.offset=projected.offset;c.speed=Math.hypot(c.vx,c.vz);c.y=this.height(c.s);this.barrierContact(c);continue;}
   c.cooldown-=dt;if(decide)this.decide(c,player);c.speed=Math.max(0,c.speed+c.acceleration*dt);c.s+=c.dir*c.speed*dt/this.metric(c.s,c.offset);
   if(c.changing){
    c.changing=Math.max(0,c.changing-dt*clamp(c.speed/8,0,1));const T=c.changeDuration,t=1-c.changing/T,D=LANES[c.targetLane]-c.startOffset,V=(c.startLateralV||0)*T,A=(c.startLateralA||0)*T*T;
    const q3=10*D-6*V-1.5*A,q4=-15*D+8*V+1.5*A,q5=6*D-3*V-.5*A;
    c.offset=c.startOffset+V*t+.5*A*t*t+q3*t**3+q4*t**4+q5*t**5;
    c.lateralV=(V+A*t+3*q3*t*t+4*q4*t**3+5*q5*t**4)/T;c.lateralA=(A+6*q3*t+12*q4*t*t+20*q5*t**3)/(T*T);
    if(c.changing===0){c.lane=c.targetLane;c.lateralV=c.lateralA=0;c.aborting=false;}
   }
   const p=this.point(c.s,c.offset),oldX=c.x,oldZ=c.z;c.x=p.x;c.z=p.z;c.y=p.y;c.pitch=p.pitch*c.dir;c.vx=(c.x-oldX)/dt;c.vz=(c.z-oldZ)/dt;c.yaw=Math.hypot(c.vx,c.vz)>.01?Math.atan2(c.vx,c.vz):p.yaw+(c.dir<0?Math.PI:0);c.yawRate=0;this.barrierContact(c,true);
   const ahead=(c.s-player.s);if(ahead>5)c.wasAhead=true;if(c.dir>0&&c.wasAhead&&ahead<-5&&!c.passed&&this.clock-c.hitAt>5){c.passed=true;this.passes++;}c.lastAhead=ahead;
  }
  this._useLaneIndex=false;this.crashContacts();
 }
 // Road-space OBB support against the existing continuous barrier strips.
 // Sweep-end containment prevents tunnelling; impulses only change NPC state.
 barrierContact(c,onRoad=false){
  const p=onRoad?c:this.project(c.x,c.z),yaw=Math.atan(this.gradient(p.s)),delta=c.yaw-yaw,extent=Math.abs(Math.cos(delta))*c.width*.5+Math.abs(Math.sin(delta))*c.length*.5;
  const side=c.dir>0?-1:1,a=p.offset*side,low=1.3+.55+extent,high=14.2-.55-extent;
  if(a>=low&&a<=high)return false;const target=clamp(a,low,high),q=this.point(p.s,target*side),sign=a<low?side:-side,nx=Math.cos(yaw)*sign,nz=-Math.sin(yaw)*sign;
  c.x=q.x;c.z=q.z;c.s=p.s;c.offset=target*side;const vn=c.vx*nx+c.vz*nz;
  if(vn<0){c.vx-=1.04*vn*nx;c.vz-=1.04*vn*nz;const tx=Math.sin(yaw),tz=Math.cos(yaw),vt=c.vx*tx+c.vz*tz,friction=Math.min(Math.abs(vt),.15*Math.abs(vn));c.vx-=Math.sign(vt)*friction*tx;c.vz-=Math.sign(vt)*friction*tz;c.yawRate*=.45;}
  if(this.clock-(c.wallHitAt??-Infinity)>.25)this.barrierContacts++;c.wallHitAt=this.clock;c.crashed=true;c.speed=Math.hypot(c.vx,c.vz);return true;
 }
 crashContacts(){
  let count=0;for(let i=0;i<this.cars.length;i++)if(this.cars[i].crashed)this._crashed[count++]=i;
  for(let k=0;k<count;k++){const i=this._crashed[k],a=this.cars[i];for(let j=0;j<this.cars.length;j++){const b=this.cars[j];if(j===i||b.crashed&&j<i)continue;if(Math.abs(a.x-b.x)>9||Math.abs(a.z-b.z)>10)continue;this.pairChecks++;
    // Closest points of planar capsule centre segments (bounded, no allocations).
    const ah=a.length*.5-a.width*.5,bh=b.length*.5-b.width*.5,as=Math.sin(a.yaw),ac=Math.cos(a.yaw),bs=Math.sin(b.yaw),bc=Math.cos(b.yaw);
    const ax=a.x-as*ah,az=a.z-ac*ah,bx=b.x-bs*bh,bz=b.z-bc*bh,ux=2*as*ah,uz=2*ac*ah,vx=2*bs*bh,vz=2*bc*bh,wx=ax-bx,wz=az-bz;
    const uu=ux*ux+uz*uz,vv=vx*vx+vz*vz,uv=ux*vx+uz*vz,uw=ux*wx+uz*wz,vw=vx*wx+vz*wz,den=uu*vv-uv*uv;
    let ta=den>1e-8?clamp((uv*vw-vv*uw)/den,0,1):0,tb=clamp((uv*ta+vw)/vv,0,1);ta=clamp((uv*tb-uw)/uu,0,1);tb=clamp((uv*ta+vw)/vv,0,1);
    const px=ax+ux*ta,pz=az+uz*ta,qx=bx+vx*tb,qz=bz+vz*tb,dx=px-qx,dz=pz-qz,dist=Math.hypot(dx,dz),radius=(a.width+b.width)*.5;if(dist>=radius)continue;
    const nx=dist>1e-7?dx/dist:Math.cos(a.yaw),nz=dist>1e-7?dz/dist:-Math.sin(a.yaw),ia=1/a.mass,ib=1/b.mass,pen=radius-dist;
    a.x+=nx*pen*ia/(ia+ib);a.z+=nz*pen*ia/(ia+ib);b.x-=nx*pen*ib/(ia+ib);b.z-=nz*pen*ib/(ia+ib);
    const ra=(pz-a.z)*nx-(px-a.x)*nz,rb=(qz-b.z)*nx-(qx-b.x)*nz,closing=(a.vx-b.vx)*nx+(a.vz-b.vz)*nz+a.yawRate*ra-b.yawRate*rb;
    if(closing<0){const impulse=-1.03*closing/(ia+ib+ra*ra/a.inertia+rb*rb/b.inertia);a.vx+=nx*impulse*ia;a.vz+=nz*impulse*ia;b.vx-=nx*impulse*ib;b.vz-=nz*impulse*ib;a.yawRate+=impulse*ra/a.inertia;b.yawRate-=impulse*rb/b.inertia;this.npcContacts++;}
    a.crashed=b.crashed=true;for(const c of [a,b]){const p=this.project(c.x,c.z);c.s=p.s;c.offset=p.offset;c.speed=Math.hypot(c.vx,c.vz);this.barrierContact(c);}
   }}
 }
 rebase(vehicle){if(Math.abs(vehicle.z)<2000)return 0;const shift=Math.trunc(vehicle.z/1000)*1000;this.origin+=shift;for(const n of vehicle.nodes)n.z-=shift;vehicle.syncPose();for(const c of this.cars)c.z-=shift;return shift;}
 collide(vehicle){let hit=false;for(const c of this.cars){if(Math.abs(c.x-vehicle.x)>7||Math.abs(c.z-vehicle.z)>9)continue;
  const sn=Math.sin(c.yaw),cs=Math.cos(c.yaw),r=c.width*.5;
  for(const along of [-c.length*.5+r,0,c.length*.5-r])if(vehicle.collideCircle(c.x+sn*along,c.z+cs*along,r,c.truck?2.5:1.4,c)){hit=true;if(this.clock-c.hitAt>1)this.contacts++;c.hitAt=this.clock;c.crashed=true;}
 }
 const p=this.project(vehicle.x,vehicle.z);
 for(const offset of [-14.2,-1.3,1.3,14.2])if(Math.abs(p.offset-offset)<3.2)for(const ds of [-2,-1,0,1,2]){const b=this.point(p.s+ds,offset);if(vehicle.collideCircle(b.x,b.z,.55,.85))hit=true;}
 return hit;}
}

