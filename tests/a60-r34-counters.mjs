import assert from 'node:assert/strict';
import {Highway,LANES} from '../dist/highway.js';
import {createIntent} from '../dist/traffic-intent.js';

const h=new Highway(86);
h.reset(86,917);
h.setDiagnostics(true);
const [ego,lead]=h.cars.filter(c=>c.dir===1);
function place(c,s,lane,speed){
 Object.assign(c,h.point(s,LANES[lane]),{s,lane,targetLane:lane,offset:LANES[lane],speed,changing:0,crashed:false,aborting:false,cooldown:1000,intent:createIntent()});
}
place(ego,40,1,30);place(lead,10,0,18);
h.cars=[ego,lead];
Object.assign(ego.intent,{state:'WAIT_FOR_GAP',targetId:lead.id,targetGeneration:lead.generation});
h.decide(ego,null);
assert.equal(h.diagnostics.counts.ACTUAL_PASS_COMPLETED??0,0,'A waiting goal with no committed lane change is not a completed pass');

h.setDiagnostics(true);
place(ego,0,1,30);h.cars=[ego];
ego.aborting=true;ego.changing=.005;ego.changeDuration=3.8;ego.startOffset=ego.offset;
const player=h.point(-150,LANES[2]);
h.step(1/30,{...player,vx:0,vz:0,speed:0});
assert.equal(h.diagnostics.counts.LANE_CHANGE_COMPLETED??0,0,'Abort settlement is not a completed lane change');
assert.equal(h.diagnostics.counts.LANE_CHANGE_ABORT_SETTLED,1);
ego.intent={...createIntent(),state:'WAIT_FOR_GAP',targetId:lead.id,targetGeneration:lead.generation};
for(let i=0;i<200;i++)h.diagnostics.safeOpportunity(ego);
assert.equal(h.diagnostics.counts.SAFE_OPPORTUNITY_EVALUATIONS,200);
assert.equal(h.diagnostics.counts.INTENTS_WITH_SAFE_OPPORTUNITY,1);
console.log('Pass, abort and safe opportunity counters distinguish unique goals from evaluations.');
