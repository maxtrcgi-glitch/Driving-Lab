// Opt-in, bounded instrumentation. This module never influences decisions.
export class TrafficDiagnostics {
 constructor(limit=128){this.limit=limit;this.events=[];this.counts={};this.states=new Map();this.maneuvers=new Map();this.lastViewSample=-Infinity;}
 state(car){let s=this.states.get(car.id);if(!s||s.generation!==car.generation){if(!s&&this.states.size>=256)this.states.delete(this.states.keys().next().value);s={generation:car.generation,motivation:'not_observed',lastDecisionReason:'not_observed',lastRejectionReason:'none',leaderGap:Infinity,leaderSpeed:null};this.states.set(car.id,s);}return s;}
 event(car,type,reason=''){const s=this.state(car);if(type==='PASS_REJECTED')s.lastRejectionReason=reason;else s.lastDecisionReason=reason||type;this.counts[type]=(this.counts[type]||0)+1;if(this.events.length===this.limit)this.events.shift();this.events.push({id:car.id,generation:car.generation,type,reason});}
 increment(key){this.counts[key]=(this.counts[key]??0)+1;}
 decision(car,leader,slower,clock,eligible){
  this.increment('DECISION_EVALUATIONS');
  const state=this.state(car);
  if(slower){
   if(state.slowerId!==leader.id||state.slowerGeneration!==leader.generation)this.increment('SLOWER_LEADER_ENCOUNTERS');
   state.slowerId=leader.id;
   state.slowerGeneration=leader.generation;
   const dt=car.lastDecisionAt>=0?Math.min(.1,Math.max(0,clock-car.lastDecisionAt)):1/30;
   this.counts.SLOWER_FOLLOW_SECONDS=(this.counts.SLOWER_FOLLOW_SECONDS??0)+dt;
   const previousFollow=state.followSeconds??0;
   state.followSeconds=previousFollow+dt;
   if(previousFollow<10&&state.followSeconds>=10)this.increment('SLOWER_FOLLOW_OVER_10S');
   this.counts.MAX_SLOWER_FOLLOW_SECONDS=Math.max(this.counts.MAX_SLOWER_FOLLOW_SECONDS??0,state.followSeconds);
   if(!eligible)this.increment(car.changing?'SLOWER_CHANGING':car.cooldown>0?'SLOWER_COOLDOWN':'SLOWER_RECONSIDER');
  }else{state.slowerId=null;state.followSeconds=0;}
  if(car.intent.state==='WAIT_FOR_GAP'){
   const dt=car.lastDecisionAt>=0?Math.min(.1,Math.max(0,clock-car.lastDecisionAt)):1/30;
   this.counts.INTENT_WAIT_SECONDS=(this.counts.INTENT_WAIT_SECONDS??0)+dt;
   this.counts.MAX_INTENT_WAIT_SECONDS=Math.max(this.counts.MAX_INTENT_WAIT_SECONDS??0,car.intent.waiting);
   if(!state.wait10&&car.intent.waiting>=10){state.wait10=true;this.increment('INTENT_WAIT_OVER_10S');}
  }
 }
 safeOpportunity(car){
  this.increment('SAFE_OPPORTUNITY_EVALUATIONS');
  if(car.intent.targetId===null||car.intent.state==='EXECUTE_PASS'||car.intent.passCompleted)return;
  const state=this.state(car);
  if(state.intentSafe)return;
  state.intentSafe=true;
  this.increment('INTENTS_WITH_SAFE_OPPORTUNITY');
 }
 startManeuver(car,playerS,reason){
  this.event(car,'LANE_CHANGE_STARTED','candidate_selected');
  if(car.s>playerS&&car.s-playerS<=250)this.increment('START_AHEAD_250');
  if(reason==='cruising_lane')this.increment('RETURN_STARTED');
  if(this.maneuvers.size>=128)this.maneuvers.delete(this.maneuvers.keys().next().value);
  this.maneuvers.set(car.id,{car,generation:car.generation,reason,seen:false,sustained:false,visibleSince:null,nearSince:null,nearSustained:false});
 }
 endManeuver(car){this.maneuvers.delete(car.id);}
 sampleView(seconds,camera){
  if(!this.maneuvers.size||seconds-this.lastViewSample<.099)return;
  const interrupted=seconds-this.lastViewSample>.22;
  this.lastViewSample=seconds;
  const view=camera.matrixWorldInverse.elements,projection=camera.projectionMatrix.elements;
  for(const [id,record] of this.maneuvers){
   const car=record.car;
   if(car.generation!==record.generation||!car.changing||car.crashed||car.aborting){this.maneuvers.delete(id);continue;}
   if(!centerInFrustum(car.x,car.y+.7,car.z,view,projection)){record.visibleSince=record.nearSince=null;continue;}
   if(!record.seen){record.seen=true;this.increment('FRUSTUM_SEEN');if(record.reason==='cruising_lane')this.increment('FRUSTUM_RETURN_SEEN');}
   if(interrupted||record.visibleSince===null)record.visibleSince=seconds;
   if(!record.sustained&&seconds-record.visibleSince>=.5-1e-8){record.sustained=true;this.increment('FRUSTUM_SUSTAINED');if(record.reason==='cruising_lane')this.increment('FRUSTUM_RETURN_SUSTAINED');}
   const distanceSq=(car.x-camera.position.x)**2+(car.y+.7-camera.position.y)**2+(car.z-camera.position.z)**2;
   if(distanceSq>250**2){record.nearSince=null;continue;}
   if(interrupted||record.nearSince===null)record.nearSince=seconds;
   if(!record.nearSustained&&seconds-record.nearSince>=.5-1e-8){record.nearSustained=true;this.increment('FRUSTUM_NEAR_SUSTAINED');}

  }
 }
 snapshot(car){const s=this.state(car);return {id:car.id,generation:car.generation,driverProfile:car.driverProfile,traits:car.traits?{...car.traits,headway:car.headway,maxAccel:car.maxAccel,comfortableBrake:car.comfortableBrake}:null,desiredSpeed:car.desired,actualSpeed:car.speed,currentLane:car.lane,targetLane:car.targetLane,leaderGap:s.leaderGap,leaderSpeed:s.leaderSpeed,intent:car.intent?{...car.intent}:null,motivation:s.motivation,verifiedPass:!!s.verifiedPass,laneChangeState:car.aborting?'aborting':car.changing?'changing':'idle',lastDecisionReason:s.lastDecisionReason,lastRejectionReason:s.lastRejectionReason};}
}

// Center-point proxy, with the same view and perspective matrices as the renderer.
// It does not model occlusion, fog, apparent size or partial mesh intersection.
function centerInFrustum(x,y,z,v,p){
 const vx=v[0]*x+v[4]*y+v[8]*z+v[12];
 const vy=v[1]*x+v[5]*y+v[9]*z+v[13];
 const vz=v[2]*x+v[6]*y+v[10]*z+v[14];
 const w=p[3]*vx+p[7]*vy+p[11]*vz+p[15];
 if(!(w>0))return false;
 const cx=p[0]*vx+p[4]*vy+p[8]*vz+p[12];
 const cy=p[1]*vx+p[5]*vy+p[9]*vz+p[13];
 const cz=p[2]*vx+p[6]*vy+p[10]*vz+p[14];
 return Math.abs(cx)<=w&&Math.abs(cy)<=w&&Math.abs(cz)<=w;
}
