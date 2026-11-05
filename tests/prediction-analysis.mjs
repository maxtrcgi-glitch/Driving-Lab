import fs from 'node:fs';
import path from 'node:path';
import {outcomeLabel} from './prediction-oracle.mjs';
const [dir]=process.argv.slice(2);if(!dir)throw Error('Pass evidence directory');
const report=JSON.parse(fs.readFileSync(path.join(dir,'heldout.json'))),rows=['split,speed_kmh,horizon_ms,branch_samples,beta_MAE_deg,beta_RMSE_deg,beta_max_deg,yaw_MAE_rad_s,yaw_RMSE_rad_s,yaw_max_rad_s,lateral_MAE_m_s,path_MAE_m'];
const summary={accepted:report.accepted,total:report.cases,abstain:0,rejected:report.cases-report.accepted,rankings:{},opposite:{},riskEvents:[],falseRiskTraces:[],errorsBySpeed:{}};
for(const speed of [...new Set(report.details.map(x=>x.kmh))])for(let index=0;index<4;index++){
 const data=report.details.filter(x=>x.accepted&&x.kmh===speed).flatMap(c=>c.horizons[index].actual.map((a,i)=>({beta:(c.horizons[index].predicted[i].beta-a.beta)*180/Math.PI,yaw:c.horizons[index].predicted[i].r-a.r,lateral:c.horizons[index].predicted[i].V-a.V,path:Math.hypot(c.horizons[index].predicted[i].x-a.x,c.horizons[index].predicted[i].z-a.z)})));
 const stats=k=>{const a=data.map(x=>x[k]);return {mae:a.reduce((s,x)=>s+Math.abs(x),0)/a.length,rmse:Math.sqrt(a.reduce((s,x)=>s+x*x,0)/a.length),max:Math.max(...a.map(Math.abs))};};
 const b=stats('beta'),y=stats('yaw'),l=stats('lateral'),p=stats('path'),h=report.details.find(x=>x.accepted).horizons[index].h;
 rows.push([report.split,speed,h*1000,data.length,b.mae,b.rmse,b.max,y.mae,y.rmse,y.max,l.mae,p.mae].join(','));summary.errorsBySpeed[speed+'_'+h]={beta:b,yaw:y,lateral:l,path:p};
}
for(const c of report.details.filter(x=>x.accepted)){
 if(c.recommendation==='ABSTAIN')summary.abstain++;
 for(const h of c.horizons){
  const predicted=h.predictedOutcome??outcomeLabel({...h.predicted[0],contacts:4,damage:0},{...h.predicted[1],contacts:4,damage:0});
  summary.rankings[h.h]??={};const key=h.label+' -> '+predicted;summary.rankings[h.h][key]=(summary.rankings[h.h][key]||0)+1;
  summary.opposite[h.h]??={TP:0,FP:0,FN:0,TN:0};
  for(let a=0;a<2;a++){
   const opposite=x=>Math.abs(c.initial.beta)>=3*Math.PI/180&&x.beta*c.initial.beta<0&&Math.abs(x.beta)>3*Math.PI/180;
   const p=opposite(h.predicted[a]),v=opposite(h.actual[a]);summary.opposite[h.h][p?(v?'TP':'FP'):(v?'FN':'TN')]++;
  }
 }
}
for(const tr of report.traces){
 let side=0,onset=null;for(const r of tr.rows){if(!side&&Math.abs(r.beta)>3*Math.PI/180)side=Math.sign(r.beta);if(side&&r.beta*side<-3*Math.PI/180){onset=r.t;break;}}
 // Export trace recommendation is an experimental advantage, not a hazard
 // flag. Do not claim lead as a counterfactual safety guarantee.
 const alerts=tr.rows.filter(r=>r.valid&&r.recommendation==='UNWIND');
 if(onset!==null){const before=alerts.filter(r=>r.t<onset),warning=tr.rows.filter(r=>r.warning&&r.t<onset);summary.riskEvents.push({speed:tr.kmh,name:tr.name,side:tr.side,onset,advantageLead:before.length?onset-before[0].t:null,warningLead:warning.length?onset-warning[0].t:null});}
 else if(alerts.length)summary.falseRiskTraces.push({speed:tr.kmh,name:tr.name,side:tr.side,unwindAdvantageSamples:alerts.length});
}
fs.writeFileSync(path.join(dir,'prediction-errors-by-speed.csv'),rows.join('\n')+'\n');fs.writeFileSync(path.join(dir,'C03_analysis.json'),JSON.stringify(summary,null,2));console.log(JSON.stringify({...summary,errorsBySpeed:undefined}));
