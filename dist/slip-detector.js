// Diagnostic morphology only. NEVER a steering eligibility/intent controller.
export const slipPhases=Object.freeze({UNKNOWN:0,NORMAL:1,DRIFT_LIKE:2,UNSTABLE_SLIDE:3,RECOVERING:4,SIDE_TRANSITION:5});
// Frozen before held-out evaluation. Calibration stimuli are 60/120km/h.
export const slipParameters=Object.freeze({betaBase:.060,betaPerMS:.0005,betaExitRatio:.75,rearEnter:.045,rearExit:.075,
 growth:.060,recoverRate:.070,steadyBetaRate:.040,steadyYawAccel:.35,steadyRearRate:.080,
 evidenceDwell:.080,normalDwell:.20,driftDwell:.30,minConfidence:.55,warningDwell:.060});
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export class SlipStateDetector{
 constructor(){this.reset();}
 reset(){this.phase='UNKNOWN';this.code=0;this.confidence=0;this.reasons=1;this.pending='UNKNOWN';this.dwell=0;this.eventSide=0;this.originalSide=0;this.transitionAge=0;this.eventId=0;this.sideAge=0;this.coolAge=0;this.age=0;this.warning=false;this.warningAge=0;this.lastRack=null;this.lastRear=null;this.rearRate=0;this.rackRate=0;this.frontAlpha=this.rearAlpha=this.rearUse=0;this.slipMagnitude=0;this.betaLimit=0;this.supported=false;this.possibleTransition=false;}
 unknown(reason){this.phase='UNKNOWN';this.code=0;this.confidence=0;this.reasons=reason;this.pending='UNKNOWN';this.dwell=0;this.eventSide=0;this.originalSide=0;this.transitionAge=0;this.sideAge=0;this.coolAge=0;this.warning=false;this.warningAge=0;this.lastRack=this.lastRear=null;this.rearRate=this.rackRate=0;this.supported=false;this.possibleTransition=false;return this;}
 update(s,v,dt){
  if(!s.valid||!Number.isFinite(dt)||dt<=0||dt>.04)return this.unknown(s.reasons||64);
  const p=slipParameters,g=1-Math.exp(-dt/.06);this.age+=dt;this.reasons=0;
  let front=0,rear=0,rearUse=0;
  for(let i=0;i<4;i++){const w=s.wheels[i];if(!w.valid||!Number.isFinite(w.alphaRelaxed+w.fx+w.fy+w.forceLimit))return this.unknown(32);
   if(i<2)front+=Math.abs(w.alphaRelaxed)/2;else{rear+=Math.abs(w.alphaRelaxed)/2;rearUse+=Math.hypot(w.fx,w.fy)/Math.max(w.forceLimit,1)/2;}}
  this.frontAlpha=front;this.rearAlpha=rear;this.rearUse=rearUse;
  if(this.lastRear!==null)this.rearRate+=((rear-this.lastRear)/dt-this.rearRate)*g;
  if(this.lastRack!==null)this.rackRate+=((v.steer-this.lastRack)/dt-this.rackRate)*g;
  this.lastRear=rear;this.lastRack=v.steer;
  // A quality score for consistency, NOT a calibrated probability of phase.
  const yawQuality=clamp(1-Math.abs(s.yawResidual)/.50,0,1),betaQuality=clamp(1-Math.abs(s.betaDot-s.betaDotKinematic)/.12,0,1);
  this.confidence=Math.min(clamp((s.age-.12)/.16,0,1),yawQuality,betaQuality);
  if(this.confidence<p.minConfidence)return this.unknown(1024);
  this.betaLimit=p.betaBase+p.betaPerMS*Math.min(s.U,60);this.slipMagnitude=Math.abs(s.beta);
  const magnitude=this.slipMagnitude,side=Math.sign(s.beta),growth=side*s.betaDot,
   support=rear>p.rearEnter||magnitude>2*this.betaLimit;
  this.supported=magnitude>this.betaLimit&&support;
  // Preserve episode side through small beta/brief side crossing, not invalidity.
  if(this.eventSide){this.sideAge+=dt;if(magnitude<this.betaLimit*p.betaExitRatio&&rear<p.rearExit&&Math.abs(s.betaDot)<.08)this.coolAge+=dt;else this.coolAge=0;
   if(this.coolAge>.6){this.eventSide=0;this.sideAge=this.coolAge=0;}}
  const crossing=this.eventSide&&side!==this.eventSide&&magnitude>.45*this.betaLimit&&growth>.035&&rear>p.rearEnter;
  // Candidate early warning: converging beta but persistent yaw/rack/rear memory.
  // This is an observed tension, NOT a prediction that a second slide will occur.
  const unwinding=this.eventSide&&side===this.eventSide&&growth<-.07&&magnitude<2*this.betaLimit;
  const warningCandidate=!!(unwinding&&Math.abs(s.r)>.18&&(rear>.025||rearUse>.6)&&Math.abs(v.steer)>.035&&s.r*this.eventSide>0&&v.steer*this.eventSide>0&&Math.abs(this.rackRate)<.35);
  this.warningAge=warningCandidate?this.warningAge+dt:0;this.warning=this.warningAge>=p.warningDwell;
  this.possibleTransition=!!crossing;
  let candidate='UNKNOWN';
  if(crossing||this.transitionAge>0)candidate='SIDE_TRANSITION';
  else if(this.eventSide&&growth<-p.recoverRate&&magnitude>.4*this.betaLimit&&rear>p.rearEnter&&this.rearRate<.10&&s.r*s.rDot<=.15)candidate='RECOVERING';
  else if(this.supported&&Math.abs(s.betaDot)<p.steadyBetaRate&&Math.abs(s.rDot)<p.steadyYawAccel&&Math.abs(this.rearRate)<p.steadyRearRate&&Math.abs(this.rackRate)<.25&&Math.abs(s.r)>.04)candidate='DRIFT_LIKE';
  else if(this.supported&&(growth>p.growth||(magnitude>2*this.betaLimit&&rear>.10&&s.r*s.rDot>.10)))candidate='UNSTABLE_SLIDE';
  else if(magnitude<this.betaLimit*p.betaExitRatio&&rear<p.rearExit)candidate='NORMAL';
  if(candidate===this.pending)this.dwell+=dt;else{this.pending=candidate;this.dwell=dt;}
  const delay=candidate==='NORMAL'?p.normalDwell:candidate==='DRIFT_LIKE'?p.driftDwell:p.evidenceDwell;
  // Ambiguous observations abstain immediately; confirmed labels require dwell.
  if(candidate==='UNKNOWN'){this.phase='UNKNOWN';this.code=0;}
  else if(this.dwell>=delay){this.phase=candidate;this.code=slipPhases[candidate];
   if(candidate==='SIDE_TRANSITION'&&crossing){this.eventSide=side;this.transitionAge=.16;this.sideAge=0;}
   if(!this.eventSide&&this.supported){this.eventSide=this.originalSide=side;this.sideAge=0;this.eventId++;}
  }else{this.phase='UNKNOWN';this.code=0;}
  this.transitionAge=Math.max(0,this.transitionAge-dt);
  return this;
 }
}
