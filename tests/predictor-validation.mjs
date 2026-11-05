import assert from 'node:assert/strict';
import fs from 'node:fs';
import {performance} from 'node:perf_hooks';
import {Vehicle,DT} from '../dist/physics.js';
import {DrivingExperience} from '../dist/driving-experience.js';
import {BoundedSteeringPredictor,predictionHorizons} from '../dist/steering-predictor.js';
import {predictionInput,predictionSplits} from './prediction-scenarios.mjs';
import {vehicleSnapshot,restoreVehicle,experienceSnapshot,restoreExperience,actualState} from './full-state.mjs';
import {outcomeLabel} from './prediction-oracle.mjs';
const [out,split='heldout']=process.argv.slice(2);assert.ok(out&&predictionSplits[split]);
const cases=[],traces=[],timings=[],snapTicks=[300,384,468,552],predictor=new BoundedSteeringPredictor();let exactDuplicates=0;
function rollout(snapshot,history,pedals,action,start){
 const v=new Vehicle(),e=new DrivingExperience();restoreVehicle(v,snapshot);restoreExperience(e,history);const outputs=[];
 for(let tick=0;tick<96;tick++){
  const raw=history.processor.raw*(action?Math.max(0,1-tick*DT/.2):1),steer=e.value(raw,v.speed,DT,history.processor.mode);
  v.step(DT,{...pedals,steer});e.observe(v,DT);
  if([12,24,48,96].includes(tick+1))outputs.push(actualState(v,start.yaw,start.x,start.z));
 }
 return {outputs,state:vehicleSnapshot(v),experience:experienceSnapshot(e)};
}
for(const kmh of predictionSplits[split].speeds)for(const name of predictionSplits[split].names)for(const side of [-1,1]){
 const v=new Vehicle(),e=new DrivingExperience();v.reset(0,0,0,kmh/3.6);for(let i=0;i<96;i++)v.step(DT,{});
 const rows=[];
 for(let tick=0;tick<960;tick++){
  const t=tick*DT,input=predictionInput(name,t,side),steer=e.value(input.raw,v.speed,DT,'touch');v.step(DT,{...input,steer});e.observe(v,DT);assert.equal(e.correction,0);
  if(tick%12===0){predictor.predict(v,e.state,e.processor);rows.push({t,...actualState(v),rack:v.steer,warning:e.slip.warning,phase:e.slip.phase,valid:predictor.valid,recommendation:predictor.recommendation});}
  if(!snapTicks.includes(tick))continue;
  const saved=vehicleSnapshot(v),history=experienceSnapshot(e),s=e.state;
  const begin=performance.now();predictor.predict(v,s,e.processor);timings.push(performance.now()-begin);
  assert.deepEqual(vehicleSnapshot(v),saved,'Predictor read-only');assert.deepEqual(experienceSnapshot(e),history,'No filter mutation');
  if(!predictor.valid){cases.push({kmh,name,side,t,accepted:false,reason:predictor.reason});continue;}
  const predicted=predictor.candidates.map(c=>structuredClone(c.outputs)),start={yaw:v.yaw,x:s.x,z:s.z};
  const hold=rollout(saved,history,input,0,start),duplicate=rollout(saved,history,input,0,start),unwind=rollout(saved,history,input,1,start);
  assert.deepEqual(hold,duplicate,'Identical complete-state HOLD replay');exactDuplicates++;
  const horizons=predictionHorizons.map((h,i)=>({h,predicted:[predicted[0][i],predicted[1][i]],actual:[hold.outputs[i],unwind.outputs[i]],label:outcomeLabel(hold.outputs[i],unwind.outputs[i]),predictedOutcome:outcomeLabel({...predicted[0][i],contacts:4,damage:0},{...predicted[1][i],contacts:4,damage:0})}));
  cases.push({kmh,name,side,t,accepted:true,initial:actualState(v),betaDot:s.betaDot,yawAcceleration:s.rDot,processor:history.processor,recommendation:predictor.recommendation,reason:predictor.reason,horizons});
 }
 traces.push({kmh,name,side,rows});console.log(JSON.stringify({kmh,name,side,accepted:cases.filter(c=>c.kmh===kmh&&c.name===name&&c.side===side&&c.accepted).length}));
}
const metrics={};
for(let i=0;i<4;i++){
 const m={samples:0,futureInvalid:0,beta:[],yaw:[],lateral:[],rack:[],path:[],yawDirectionCorrect:0,betaDirectionCorrect:0,ranking:{},forecastRanking:{},predictedOpposite:0,actualOpposite:0};
 for(const c of cases.filter(x=>x.accepted)){
  const h=c.horizons[i];m.ranking[h.label]??={UNWIND:0,HOLD:0,ABSTAIN:0};m.ranking[h.label][c.recommendation]++;
  m.forecastRanking[h.label]??={UNWIND:0,HOLD:0,AMBIGUOUS:0,UNKNOWN:0};m.forecastRanking[h.label][h.predictedOutcome]++;
  for(let a=0;a<2;a++){
   const p=h.predicted[a],v=h.actual[a];m.samples++;if(v.contacts!==4||v.damage>.03)m.futureInvalid++;
   m.beta.push((p.beta-v.beta)*180/Math.PI);m.yaw.push(p.r-v.r);m.lateral.push(p.V-v.V);m.rack.push((p.rack-v.rack)*180/Math.PI);m.path.push(Math.hypot(p.x-v.x,p.z-v.z));
   if(Math.sign(p.r-c.initial.r)===Math.sign(v.r-c.initial.r))m.yawDirectionCorrect++;
   if(Math.sign(p.beta-c.initial.beta)===Math.sign(v.beta-c.initial.beta))m.betaDirectionCorrect++;
   if(Math.abs(c.initial.beta)>=3*Math.PI/180&&p.beta*c.initial.beta<0&&Math.abs(p.beta)>3*Math.PI/180)m.predictedOpposite++;
   if(Math.abs(c.initial.beta)>=3*Math.PI/180&&v.beta*c.initial.beta<0&&Math.abs(v.beta)>3*Math.PI/180)m.actualOpposite++;
  }
 }
 for(const key of ['beta','yaw','lateral','rack','path']){let a=m[key];m[key]={mae:a.reduce((s,x)=>s+Math.abs(x),0)/a.length,rmse:Math.sqrt(a.reduce((s,x)=>s+x*x,0)/a.length),max:Math.max(...a.map(Math.abs))};}
 metrics[predictionHorizons[i]]=m;
}
let mirrorMax=0;for(const c of cases.filter(x=>x.accepted&&x.side===1)){const other=cases.find(x=>x.accepted&&x.side===-1&&x.kmh===c.kmh&&x.name===c.name&&x.t===c.t);if(other)for(let i=0;i<4;i++)for(let a=0;a<2;a++)mirrorMax=Math.max(mirrorMax,Math.abs(c.horizons[i].predicted[a].beta+other.horizons[i].predicted[a].beta));}
const secondary=[];for(const tr of traces){let initialSide=0;for(let i=0;i<tr.rows.length;i++){const r=tr.rows[i];if(!initialSide&&Math.abs(r.beta)>3*Math.PI/180)initialSide=Math.sign(r.beta);if(initialSide&&r.beta*initialSide<-3*Math.PI/180){const warnings=tr.rows.slice(0,i).filter(x=>x.warning),predictions=tr.rows.slice(0,i).filter(x=>x.valid&&x.recommendation==='UNWIND');secondary.push({kmh:tr.kmh,name:tr.name,side:tr.side,onset:r.t,warningLead:warnings.length?r.t-warnings[0].t:null,predictorLead:predictions.length?r.t-predictions[0].t:null});break;}}}
timings.sort((a,b)=>a-b);const report={split,cases:cases.length,accepted:cases.filter(x=>x.accepted).length,exactDuplicateReplays:exactDuplicates,mirrorBetaMaxRad:mirrorMax,metrics,secondary,nodeSnapshotCostMs:{median:timings[Math.floor(timings.length*.5)],p95:timings[Math.floor(timings.length*.95)],notIPhoneFPS:true},details:cases,traces};
fs.writeFileSync(out,JSON.stringify(report,null,2));console.log(JSON.stringify({...report,details:undefined,traces:undefined}));
