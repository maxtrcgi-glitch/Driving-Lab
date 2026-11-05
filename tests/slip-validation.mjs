import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Vehicle,DT} from '../dist/physics.js';
import {DrivingExperience} from '../dist/driving-experience.js';
import {slipParameters,slipPhases} from '../dist/slip-detector.js';
import {driverInput,scenarioNames} from './slip-scenarios.mjs';
import {contactProbe,localRackProbe} from './contact-probe.mjs';
import {labelTrace,oracleProtocol} from './slip-oracle.mjs';
const [out,split='heldout']=process.argv.slice(2);if(!out)throw Error('Pass report JSON and calibration|heldout');
const speeds=split==='calibration'?[60,120]:[90,160,200];
const runs=[],confusion={},events=[],references={samples:0,accepted:0,alphaErrorAbsMax:0,forceProjectionRelativeMax:0,alignmentYawAccelerating:0,alignmentYawDamping:0,localCompared:0,frontLateralReduction:0};
let total=0,invalidKnown=0,mirrorMismatch=0;
const phaseKeys=Object.keys(slipPhases);for(const a of phaseKeys)confusion[a]=Object.fromEntries(phaseKeys.map(b=>[b,0]));
for(const kmh of speeds)for(const name of scenarioNames)for(const side of [-1,1]){
 const v=new Vehicle(),e=new DrivingExperience();v.reset(0,0,0,kmh/3.6);for(let i=0;i<96;i++)v.step(DT,{});
 const probe=contactProbe(v),rows=[];let transitions=0,lastPhase='UNKNOWN';
 for(let i=0;i<960;i++){
  const t=i*DT,c=driverInput(name,t*(split==='heldout'?.9:1),side);
  if(split==='heldout'){c.raw*=.9;c.handbrake*=.8;c.gas*=1.1;}
  const steer=e.value(c.raw,v.speed,DT,'touch');v.step(DT,{steer,gas:c.gas,handbrake:c.handbrake});e.observe(v,DT);assert.equal(e.correction,0);
  const s=e.state,d=e.slip,p=probe();total++;if(!s.valid&&d.phase!=='UNKNOWN')invalidKnown++;
  assert.ok(Number.isFinite(s.beta+s.r+s.betaDot+s.rDot));
  if(d.phase!==lastPhase){transitions++;lastPhase=d.phase;}
  if(i%12!==0)continue;
  const ownCOM=v.nodes.reduce((a,n)=>({mass:a.mass+n.mass,x:a.x+n.mass*n.vx,z:a.z+n.mass*n.vz}),{mass:0,x:0,z:0});
  const forceRel=Math.abs(s.wheels[0].bodyLateralForce-p.wheels[0].bodyLateral)/Math.max(100,Math.abs(p.wheels[0].bodyLateral));
  let localHold=null,localAlignment=null;
  if(e.reference.valid){references.accepted++;references.forceProjectionRelativeMax=Math.max(references.forceProjectionRelativeMax,forceRel);
   references.alphaErrorAbsMax=Math.max(references.alphaErrorAbsMax,Math.abs(s.wheels[0].alphaGeom-p.wheels[0].alpha));
   localHold=localRackProbe(p,v.steer);localAlignment=localRackProbe(p,e.reference.alignmentRack);
   if(Math.abs(s.r)>.05&&Math.abs(localAlignment.moment-localHold.moment)>50){references.localCompared++;
    if((localAlignment.moment-localHold.moment)*s.r>0)references.alignmentYawAccelerating++;else references.alignmentYawDamping++;
    if(Math.abs(localAlignment.lateral)<Math.abs(localHold.lateral))references.frontLateralReduction++;
   }
  }
  references.samples++;
  const frontUtil=p.wheels.slice(0,2).reduce((a,w)=>a+Math.hypot(w.fx,w.fy)/Math.max(w.limit,1)/2,0),rearUtil=p.wheels.slice(2).reduce((a,w)=>a+Math.hypot(w.fx,w.fy)/Math.max(w.limit,1)/2,0);
  rows.push({t,speed:v.speed,comVX:ownCOM.x/ownCOM.mass,comVZ:ownCOM.z/ownCOM.mass,yaw:v.yaw,x:v.x,z:v.z,damage:v.damage,contactCount:v.wheels.filter(w=>w.contact).length,
   beta:s.beta,betaDot:s.betaDot,kinBetaDot:s.betaDotKinematic,r:s.r,rDot:s.rDot,poseRate:s.poseRate,residual:s.yawResidual,rack:v.steer,raw:c.raw,stateValid:s.valid,stateReasons:s.reasons,
   phase:d.phase,confidence:d.confidence,reasonBits:d.reasons,warning:d.warning,eventSide:d.eventSide,frontUtil,rearUtil,
   exactFrontAlpha:p.wheels.slice(0,2).reduce((a,w)=>a+Math.abs(w.alpha)/2,0),exactRearAlpha:p.wheels.slice(2).reduce((a,w)=>a+Math.abs(w.alpha)/2,0),
   reference:e.reference.alignmentRack,referenceValid:e.reference.valid,frontMoment:p.frontMoment,rearMoment:p.rearMoment,
   frontLateral:p.wheels.slice(0,2).reduce((a,w)=>a+w.bodyLateral,0),rearLateral:p.wheels.slice(2).reduce((a,w)=>a+w.bodyLateral,0),alphaError:s.wheels[0].alphaGeom-p.wheels[0].alpha,forceRel,localHold,localAlignment});
 }
 const labels=labelTrace(rows);for(let i=0;i<rows.length;i++){rows[i].label=labels[i];confusion[labels[i]][rows[i].phase]++;}
 for(const target of ['UNSTABLE_SLIDE','RECOVERING','DRIFT_LIKE','SIDE_TRANSITION']){
  let start=-1;for(let i=0;i<=rows.length;i++){
   if(i<rows.length&&labels[i]===target){if(start<0)start=i;continue;}
   if(start>=0&&i-start>=2){const onset=rows[start].t,end=rows[i-1].t,hit=rows.find(r=>r.t>=onset-.2&&r.t<=end+.2&&r.phase===target);
    events.push({kmh,name,side,target,onset,end,detected:!!hit,delayS:hit?hit.t-onset:null});}start=-1;
  }
 }
 runs.push({kmh,name,side,transitions,rows});
 console.log(JSON.stringify({kmh,name,side,phases:Object.fromEntries(phaseKeys.map(k=>[k,rows.filter(r=>r.phase===k).length])),referenceAccepted:rows.filter(r=>r.referenceValid).length}));
}
for(let i=0;i<runs.length;i+=2){const a=runs[i],b=runs[i+1];for(let j=0;j<a.rows.length;j++)if(a.rows[j].phase!==b.rows[j].phase)mirrorMismatch++;}
assert.equal(invalidKnown,0);assert.equal(mirrorMismatch,0,'Mirrored dynamics should yield identical phase/time, not signed labels');
const normalCount=Object.values(confusion.NORMAL).reduce((a,b)=>a+b,0),falseNormal=Object.entries(confusion.NORMAL).filter(([k])=>!['NORMAL','UNKNOWN'].includes(k)).reduce((a,[,b])=>a+b,0);
const eventMetrics=Object.fromEntries(['UNSTABLE_SLIDE','RECOVERING','DRIFT_LIKE','SIDE_TRANSITION'].map(k=>{
 const e=events.filter(x=>x.target===k),h=e.filter(x=>x.detected);return [k,{events:e.length,detected:h.length,missed:e.length-h.length,delayRangeS:h.length?[Math.min(...h.map(x=>x.delayS)),Math.max(...h.map(x=>x.delayS))]:null}];}));
const secondaryWarnings=[];
for(const run of runs){let warned=false;for(let i=0;i<run.rows.length;i++){
 const x=run.rows[i];if(!x.warning){warned=false;continue;}if(warned)continue;warned=true;
 const original=Math.sign(x.beta),next=run.rows.slice(i+1).find(y=>y.t<=x.t+.75&&Math.sign(y.beta)!==original&&Math.abs(y.beta)>5*Math.PI/180);
 const zero=run.rows.slice(i+1).find(y=>y.t<=x.t+.75&&Math.sign(y.beta)!==original);
 secondaryWarnings.push({kmh:run.kmh,name:run.name,side:run.side,at:x.t,confirmedOppositeWithin750ms:!!next,leadToZeroS:zero?zero.t-x.t:null,leadTo5DegS:next?next.t-x.t:null});
}}
const bySpeed=Object.fromEntries(speeds.map(k=>{const rows=runs.filter(r=>r.kmh===k).flatMap(r=>r.rows),normal=rows.filter(r=>r.label==='NORMAL');return [k,{samples:rows.length,unknown:rows.filter(r=>r.phase==='UNKNOWN').length,proxyNormal:normal.length,falseNormal:normal.filter(r=>!['NORMAL','UNKNOWN'].includes(r.phase)).length}];}));
const report={split,parameters:slipParameters,oracleProtocol,waveform:split==='heldout'?{timeScale:.9,rawScale:.9,handbrakeScale:.8,gasScale:1.1}:{timeScale:1,rawScale:1,handbrakeScale:1,gasScale:1},speeds,pairs:runs.length,totalFixedSteps:total,invalidKnown,mirrorMismatch,confusion,normalProxy:{samples:normalCount,falseAlerts:falseNormal,rate:normalCount?falseNormal/normalCount:null,unknown:confusion.NORMAL.UNKNOWN},eventMetrics,references,bySpeed,secondaryWarnings,events,runs,
 limitation:'Offline future trajectory/contact/force proxy labels, NOT independently annotated driver intent or full ground truth. UNKNOWN includes abstention and unlabelled intervals. Do not tune on held-out data.'};
fs.writeFileSync(out,JSON.stringify(report));console.log(JSON.stringify({...report,events:undefined,runs:undefined}));
