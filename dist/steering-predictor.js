// Experimental read-only planar approximation. NEVER an actuator or target.
import {SteeringResponse} from './controls.js';
import {GR86} from './vehicle-spec.js';
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const horizonTicks=[96,192,384,768];
export const predictionHorizons=Object.freeze([.05,.1,.2,.4]);
export const predictorParameters=Object.freeze({step:1/1920,unwindSeconds:.2,residualSeconds:.04,interval:1/30,betaMargin:.045,lateralMargin:.7,yawTolerance:.07,pathTolerance:.35});
// Scalar duplicate of the current shared brush law avoids temporary force
// objects in the shadow loop. Equivalence to tireForce is tested explicitly.
export function brushInto(o,load,rest,mu,kappa,alpha,front){
 if(load<=0||mu<=0){o.fx=o.fy=o.limit=0;return;}
 const n=clamp(load/rest,.08,3.5),limit=mu*clamp(Math.pow(n,-.10),.85,1.16)*load,k=Math.pow(n,.80);
 const x=rest*23*k*kappa,y=-(front?46000:60000)*k*Math.tan(clamp(alpha,-1.3,1.3)),q=Math.hypot(x,y),t=q/(3*limit);
 const amplitude=t<1?limit*(1-Math.pow(1-t,3)):limit*(1-.09*(1-Math.exp(-(t-1)*1.5))),f=q>1e-8?amplitude/q:0;
 o.fx=x*f;o.fy=y*f;o.limit=limit;
}
class Candidate{
 constructor(){this.processor=new SteeringResponse();this.wheels=Array.from({length:4},()=>({}));this.outputs=Array.from({length:4},()=>({}));}
}
export class BoundedSteeringPredictor{
 constructor(){this.candidates=[new Candidate(),new Candidate()];this.reset();}
 reset(){this.valid=false;this.reason=1;this.decision=0;this.recommendation='ABSTAIN';this.generation=(this.generation||0)+1;this.betaDot=this.yawAcceleration=0;for(const c of this.candidates)for(const o of c.outputs){o.valid=false;o.beta=o.r=o.V=o.rack=o.x=o.z=o.yaw=0;}return this;}
 predict(v,s,processor){
  this.valid=false;this.reason=0;this.decision=0;this.recommendation='ABSTAIN';
  this.betaDot=s.betaDot;this.yawAcceleration=s.rDot;
  if(!s.valid){this.reason=1;return this;}
  if(Math.abs(v.roll)>.08||Math.abs(v.pitch)>.08||Math.abs(s.yawResidual)>.25||Math.abs(s.betaDot-s.betaDotKinematic)>.08){this.reason=2;return this;}
  for(let i=0;i<4;i++)if(!s.wheels[i].flatNormal){this.reason=2;return this;}
  let mass=0,I=0;for(const n of v.nodes){mass+=n.mass;if(n.kind==='chassis')I+=n.mass*((n.x-v.x)**2+(n.z-v.z)**2);}
  if(!Number.isFinite(mass+I+s.U+s.V+s.r+s.rDot+s.ax+s.az+processor.position+processor.raw)||I<500){this.reason=4;return this;}
  const sn=Math.sin(v.yaw),cs=Math.cos(v.yaw),af=s.ax*sn+s.az*cs,ar=s.ax*cs-s.az*sn;
  for(let action=0;action<2;action++){
   const c=this.candidates[action];c.U=s.U;c.V=s.V;c.r=s.r;c.rack=v.steer;c.x=c.z=c.yaw=0;
   Object.assign(c.processor,processor);
   let FU=0,FV=0,M=0;
   for(let i=0;i<4;i++){
    const w=v.wheels[i],n=v.nodes[w.hub],o=c.wheels[i],dx=n.x-s.x,dz=n.z-s.z;
    o.x=dx*cs-dz*sn;o.z=dx*sn+dz*cs;o.front=w.front;o.toe=w.toe;o.nominalX=w.x;o.load=w.load;o.grip=w.grip;
    o.alpha=w.alpha;o.kappa=w.slip;o.omega=w.omega;o.drive=w.driveTorque;o.abs=w.absFactor;
    o.rest=GR86.mass*9.81*(w.front?GR86.frontWeight:1-GR86.frontWeight)/2;
    o.hubU=s.wheels[i].hubU-(s.U-s.r*o.x);o.hubV=s.wheels[i].hubV-(s.V+s.r*o.z);
    const a=w.steerAngle+w.toe,co=Math.cos(a),si=Math.sin(a),fu=w.fx*co-w.fy*si,fv=w.fx*si+w.fy*co;
    FU+=fu;FV+=fv;M+=o.z*fv-o.x*fu;
   }
   c.resU=clamp(af-FU/mass,-6,6);c.resV=clamp(ar-FV/mass,-6,6);c.resR=clamp(s.rDot-M/I,-3,3);
   const h=predictorParameters.step;let out=0,cmd=processor.position;
   for(let tick=0;tick<768;tick++){
    const t=tick*h,decay=Math.exp(-t/predictorParameters.residualSeconds);
    if(tick%8===0){const raw=processor.raw*(action?Math.max(0,1-t/predictorParameters.unwindSeconds):1);cmd=c.processor.value(raw,Math.hypot(c.U,c.V),1/240,processor.mode);}
    c.rack+=clamp(-.57*cmd-c.rack,-3*h,3*h);FU=FV=M=0;
    for(let i=0;i<4;i++){
     const o=c.wheels[i],a=(o.front&&Math.abs(c.rack)>1e-5?Math.atan(GR86.wheelbase/(GR86.wheelbase/Math.tan(c.rack)-o.nominalX)):0)+o.toe;
     const co=Math.cos(a),si=Math.sin(a),u=c.U-c.r*o.x+o.hubU*decay,vlat=c.V+c.r*o.z+o.hubV*decay;
     const long=u*co+vlat*si,lat=vlat*co-u*si,transport=Math.max(Math.abs(long),2);
     const geom=Math.atan2(lat,Math.max(Math.abs(long),1)),k=clamp((o.omega*GR86.tireRadius-long)/transport,-5,5);
     o.alpha+=(geom-o.alpha)*(1-Math.exp(-h*transport/.30));o.kappa+=(k-o.kappa)*(1-Math.exp(-h*transport/.25));
     brushInto(o,o.load,o.rest,o.grip,o.kappa,o.alpha,o.front);
     const targetABS=v.config.abs&&v.brake>.02&&Math.abs(long)>2&&Math.sign(long)*o.kappa<-.13?.12:1;
     o.abs+=(targetABS-o.abs)*(1-Math.exp(-h/.018));
     let braking=v.brake*(o.front?1550:1050)*o.abs+(o.front?0:v.handbrake*2600);
     if(v.config.tcs&&o.drive!==0&&v.throttle>.02&&!v.handbrake){const use=clamp(Math.abs(o.fy)/Math.max(o.limit,1),0,1),target=Math.max(.035,.105*Math.sqrt(1-use*use));if(o.kappa>target)braking+=clamp((o.kappa-target)*6500,0,1600);}
     let om=o.omega+(o.drive-o.fx*GR86.tireRadius-o.omega*.045)/GR86.wheelInertia*h;
     o.omega=clamp(Math.sign(om)*Math.max(0,Math.abs(om)-braking/GR86.wheelInertia*h),-500,500);
     const resistance=o.load*.011*Math.tanh(long*3),fu=(o.fx-resistance)*co-o.fy*si,fv=(o.fx-resistance)*si+o.fy*co;
     FU+=fu;FV+=fv;M+=o.z*fv-o.x*fu;
    }
    const drag=.5*1.225*GR86.dragArea*Math.hypot(c.U,c.V);FU-=c.U*drag;FV-=c.V*drag;
    const dU=FU/mass+c.r*c.V+c.resU*decay,dV=FV/mass-c.r*c.U+c.resV*decay;
    c.U+=dU*h;c.V+=dV*h;c.r+=(M/I+c.resR*decay)*h;c.yaw+=c.r*h;
    c.x+=(c.U*Math.sin(c.yaw)+c.V*Math.cos(c.yaw))*h;c.z+=(c.U*Math.cos(c.yaw)-c.V*Math.sin(c.yaw))*h;
    if(tick+1===horizonTicks[out]){const o=c.outputs[out++];o.beta=Math.atan2(c.V,c.U);o.r=c.r;o.V=c.V;o.rack=c.rack;o.x=c.x;o.z=c.z;o.yaw=c.yaw;o.valid=Number.isFinite(o.beta+o.r+o.V+o.rack+o.x+o.z);}
   }
  }
  this.valid=true;for(const c of this.candidates)for(const o of c.outputs)if(!o.valid)this.valid=false;
  if(!this.valid){this.reason=4;return this;}
  const hold=this.candidates[0].outputs[3],unwind=this.candidates[1].outputs[3],p=predictorParameters;
  if(Math.abs(s.beta)<.05||v.steer*s.beta<=0){this.reason=8;return this;}
  const better=(a,b)=>Math.abs(b.beta)-Math.abs(a.beta)>p.betaMargin&&Math.abs(b.V)-Math.abs(a.V)>p.lateralMargin&&Math.abs(a.r)<=Math.abs(b.r)+p.yawTolerance&&Math.abs(a.x)<=Math.abs(b.x)+p.pathTolerance;
  if(better(unwind,hold)){this.decision=1;this.recommendation='UNWIND';}else if(better(hold,unwind)){this.decision=-1;this.recommendation='HOLD';}else this.reason=16;
  return this;
 }
}
