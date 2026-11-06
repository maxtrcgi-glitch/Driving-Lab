import assert from 'node:assert/strict';
import {Highway,LANES} from '../dist/highway.js';
import fs from 'node:fs';
const rows=[],measureOnly=process.argv.includes('--measure-only');
for(const density of [28,72,120])for(const speedKmh of [100,150,200])for(const seed of [917,2027,8123]){
 const h=new Highway(86);h.density=density;h.reset(86,seed);let s=0;
 const events=[],passes=[],pending=new Map();const decide=h.decide;
 h.decide=function(c,p){const changing=c.changing,lead=this.laneInfo(c,c.lane,null,{}).lead;decide.call(this,c,p);
  if(!changing&&c.changing){events.push({t:h.clock,s:c.s,relativeS:c.s-p.s,dir:c.dir,from:c.lane,to:c.targetLane,id:c.id,generation:c.generation});
   if(c.dir>0&&lead&&lead.dir>0&&lead.speed<c.desired-2&&Math.abs(c.s-lead.s)<200)pending.set(c.id,{c,lead,generation:c.generation,leadGeneration:lead.generation,time:h.clock,lane:c.lane});
  }
 };
 const speeds=[];let completions=0,visibleCompletions=0,closeCompletions=0,lateCloseCompletions=0,inconsistentEntries=0,minGap=Infinity;
 for(let tick=0;tick<300*30;tick++){
  const v=speedKmh/3.6;s+=v/30/h.metric(s,LANES[1]);const p=h.point(s,LANES[1]);const before=h.cars.map(c=>[c.id,c.generation,c.changing,c.lane]);h.step(1/30,{...p,vx:Math.sin(p.yaw)*v,vz:Math.cos(p.yaw)*v,speed:v});
  for(let j=0;j<h.cars.length;j++){const c=h.cars[j],b=before[j];if(c.generation!==b[1]&&(c.s-s)*(c.dir*c.speed-h.playerForwardSpeed)>.001)inconsistentEntries++;if(c.generation===b[1]&&b[2]&&!c.changing&&c.lane!==b[3]){completions++;if(c.dir>0&&c.s-s>0&&c.s-s<250)visibleCompletions++;if(c.dir>0&&c.s-s>0&&c.s-s<150){closeCompletions++;if(h.clock>30)lateCloseCompletions++;}}}
  for(const [id,q] of pending){if(q.c.generation!==q.generation||q.lead.generation!==q.leadGeneration||h.clock-q.time>30){pending.delete(id);continue;}if(!q.c.changing&&q.c.lane!==q.lane&&(q.c.s-q.lead.s)>(q.c.length+q.lead.length)/2+5){passes.push({t:h.clock,relativeS:q.c.s-s,id});pending.delete(id);}}
  assert.equal(h.cars.length,density);assert.ok(h.cars.every(c=>Number.isFinite(c.s+c.speed+c.offset)));
  if(tick%30===0){for(const c of h.cars)if(c.dir>0&&c.s-s>0&&c.s-s<250)speeds.push(c.speed*3.6);for(let a=0;a<h.cars.length;a++)for(let b=a+1;b<h.cars.length;b++){const c=h.cars[a],d=h.cars[b];if(Math.abs(c.offset-d.offset)<(c.width+d.width)/2+.03)minGap=Math.min(minGap,Math.abs(c.s-d.s)-(c.length+d.length)/2);}}
 }
 assert.ok(minGap>0);assert.equal(h.spawnFailures,0,JSON.stringify({density,speedKmh,seed,spawnFailures:h.spawnFailures}));assert.equal(h.npcContacts,0);assert.equal(h.barrierContacts,0);
 const near=events.filter(e=>e.dir>0&&e.relativeS>0&&e.relativeS<250),late=near.filter(e=>e.t>30),mean=speeds.reduce((a,b)=>a+b,0)/speeds.length;
 rows.push({density,speedKmh,seed,seconds:300,starts:events.length,startsAhead250:near.length,startsAhead250After30s:late.length,overtakeStartsAhead250:near.filter(e=>e.to<e.from).length,completions,completionsAhead250:visibleCompletions,completionsAhead150:closeCompletions,completionsAhead150After30s:lateCloseCompletions,inconsistentEntries,npcPasses:passes.length,npcPassesAhead250:passes.filter(e=>e.relativeS>0&&e.relativeS<250).length,actualSpeedMeanKmh:mean,actualSpeedStdKmh:Math.sqrt(speeds.reduce((a,b)=>a+(b-mean)**2,0)/speeds.length),minBodyGapM:minGap,spawnFailures:h.spawnFailures,npcContacts:h.npcContacts,barrierContacts:h.barrierContacts,events:near,passEvents:passes});
}
const result={qualityGateEnabled:!measureOnly,scope:'Road-s front250m observation proxy, not rendered visibility or iPhone proof; starts and completions separate; no player collision solver',rows};
result.qualityGatePassed=measureOnly?null:false;
fs.mkdirSync('reports/A60',{recursive:true});fs.writeFileSync(process.argv.slice(2).find(a=>!a.startsWith('--'))||'reports/A60/visible-flow.json',JSON.stringify(result,null,2)+'\n');
if(!measureOnly){
 for(const row of rows){assert.equal(row.inconsistentEntries,0);if(row.density>=72){assert.ok(row.completionsAhead150After30s>=1,'No nearby completed maneuver after warmup: '+JSON.stringify(row));assert.ok(row.passEvents.some(e=>e.t>30&&e.relativeS>0&&e.relativeS<250),'No completed NPC pass ahead after warmup');}}
 for(const density of [28,72,120]){const group=rows.filter(r=>r.density===density);assert.ok(group.reduce((n,r)=>n+r.actualSpeedStdKmh,0)/group.length>=12,'Actual speed diversity must not collapse to the old narrow flow');}
}

result.qualityGatePassed=measureOnly?null:true;
fs.mkdirSync('reports/A60',{recursive:true});fs.writeFileSync(process.argv.slice(2).find(a=>!a.startsWith('--'))||'reports/A60/visible-flow.json',JSON.stringify(result,null,2)+'\n');
for(const r of rows)console.log(JSON.stringify({...r,events:undefined}));
