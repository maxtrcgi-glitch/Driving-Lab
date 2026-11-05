// Observe the driving pipeline without feeding it back.
// Appending fields preserves all CSV/3 column indices.
export const drivingDiagnosticColumns=[
 'driving_experience','touch_fraction','touch_active','steer_demand',
 'steer_target_pre_rate','steer_processed_command','steer_final_command',
 'assist_available','assist_state','assist_correction','skid_detected','skid_phase',
 'local_long_m_s','local_lat_m_s','body_long_m_s','body_lat_m_s',
 'FR_motion_deg','FL_motion_deg','forward_motion_valid',
 'input_event_timestamp_ms','input_received_timestamp_ms','input_age_at_sample_ms',
 'yaw_accel_deg_s2',
 'shadow_only','assist_requested_on','assist_requested_strength_pct','assist_effective_strength_pct',
 'state_valid','state_reason_bits','state_age_s','com_U_m_s','com_V_m_s','com_beta_deg',
 'com_beta_dot_deg_s','com_beta_dot_kin_deg_s','chassis_yaw_dot_deg_s','pose_yaw_rate_deg_s','yaw_rate_residual_deg_s',
 'reference_valid','reference_reason_bits','alignment_rack_deg','alignment_input','kinematic_yaw_ref_deg_s',
 'FR_alpha_geom_deg','FL_alpha_geom_deg','RR_alpha_geom_deg','RL_alpha_geom_deg',
 'FR_body_lateral_N','FL_body_lateral_N','RR_body_lateral_N','RL_body_lateral_N',
 'slip_phase_code','slip_quality','slip_reason_bits','slip_event_id','slip_original_side','slip_event_side',
 'slip_pending_code','slip_dwell_s','slip_front_alpha_abs_deg','slip_rear_alpha_abs_deg','slip_rear_use',
 'slip_rear_alpha_rate_deg_s','slip_beta_limit_deg','secondary_transition_warning','slip_transition_candidate',
 'front_tyre_yaw_moment_approx_Nm','rear_tyre_yaw_moment_approx_Nm','alignment_saturated',
 'predictor_enabled','predictor_valid','predictor_reason_bits','predictor_preliminary_decision',
 ...['hold','unwind'].flatMap(a=>[50,100,200,400].flatMap(h=>[`predict_${a}_${h}_beta_deg`,`predict_${a}_${h}_yaw_rad_s`]))
];
const degrees=v=>v*180/Math.PI;
const projection=(n,b)=>n&&b?n.vx*b[0]+n.vy*b[1]+n.vz*b[2]:NaN;
function frontDirection(v,w){
 const n=v.nodes?.[w?.hub],u=projection(n,v.basis?.forward),s=projection(n,v.basis?.right);
 return Number.isFinite(u)&&Number.isFinite(s)&&Math.hypot(u,s)>3?degrees(Math.atan2(s,u)):null;
}
export function drivingDiagnosticValues(v,input,extra){
 const c=extra.steering,p=extra.pad,e=extra.experience,sn=Math.sin(v.yaw),cs=Math.cos(v.yaw);
 const u=v.vx*sn+v.vz*cs,s=v.vx*cs-v.vz*sn;
 const bu=projection(v,v.basis?.forward),bs=projection(v,v.basis?.right);
 const fronts=v.wheels?.filter(w=>w.front)??[];
 // Signal validity only; NOT a skid detector or an assistance gate.
 const valid=Number.isFinite(bu)&&Number.isFinite(bs)&&Number.isFinite(v.yawRate)&&bu>3&&v.basis?.up?.[1]>.5&&fronts.length===2&&fronts.every(w=>w.contact);
 const received=p?.receivedTime,age=Number.isFinite(received)&&Number.isFinite(extra.now)?Math.max(0,extra.now-received):null;
 return [e?.modeCode??0,p?.fraction??null,p?+p.active:null,c?.raw??null,c?.target??null,c?.position??null,input.steer,
  e?+e.assistanceAvailable:0,e?.assistanceState??0,e?.correction??0,null,null,u,s,bu,bs,frontDirection(v,fronts[0]),frontDirection(v,fronts[1]),+valid,
  p?.eventTime??null,received??null,age,null,
  1,e?+e.assistRequested:0,e?.strength??0,0,
  e?+e.state.valid:null,e?.state.reasons??null,e?.state.age??null,
  e?.state.U??null,e?.state.V??null,e?degrees(e.state.beta):null,
  e&&e.state.age>=.12?degrees(e.state.betaDot):null,e&&e.state.age>=.12?degrees(e.state.betaDotKinematic):null,
  e&&e.state.age>=.12?degrees(e.state.rDot):null,e&&e.state.age>=.12?degrees(e.state.poseRate):null,e&&e.state.age>=.12?degrees(e.state.yawResidual):null,
  e?+e.reference.valid:null,e?.reference.reasons??null,
  e?.reference.valid?degrees(e.reference.alignmentRack):null,e?.reference.valid?e.reference.alignmentInput:null,e?.reference.valid?degrees(e.reference.yawKinematic):null,
  ...[0,1,2,3].map(i=>e&&e.state.wheels[i].valid?degrees(e.state.wheels[i].alphaGeom):null),
  ...[0,1,2,3].map(i=>e&&e.state.wheels[i].valid?e.state.wheels[i].bodyLateralForce:null),
  e?.slip?.code??null,e?.slip?.confidence??null,e?.slip?.reasons??null,e?.slip?.eventId??null,e?.slip?.originalSide??null,e?.slip?.eventSide??null,
  e?.slip?({UNKNOWN:0,NORMAL:1,DRIFT_LIKE:2,UNSTABLE_SLIDE:3,RECOVERING:4,SIDE_TRANSITION:5}[e.slip.pending]):null,e?.slip?.dwell??null,
  e?.slip?degrees(e.slip.frontAlpha):null,e?.slip?degrees(e.slip.rearAlpha):null,e?.slip?.rearUse??null,
  e?.slip?degrees(e.slip.rearRate):null,e?.slip?degrees(e.slip.betaLimit):null,e?.slip?+e.slip.warning:null,e?.slip?+e.slip.possibleTransition:null,
  e?.state.valid?e.state.frontMoment:null,e?.state.valid?e.state.rearMoment:null,e?.reference.valid?+e.reference.saturated:null,
  e?+e.predictorEnabled:0,e?+e.predictor.valid:0,e?.predictor.reason??null,e?.predictor.decision??0,
  ...[0,1].flatMap(a=>[0,1,2,3].flatMap(i=>{const o=e?.predictor.candidates[a].outputs[i];return e?.predictorEnabled&&e.predictor.valid?[degrees(o.beta),o.r]:[null,null];}))];
}
export const drivingDiagnosticNotes={
 stage:'A.3 Steering Test; bounded large-command ergonomics changes C03 response; optional C03 shadow predictor copied new processor parameters, no active assist. Small/digital commands retain explicit legacy identity',
 predictor:'Disabled by default. Enable drivingExperience.configurePredictor(true), disable(false). Numeric decision0 ABSTAIN,+1 UNWIND,-1 HOLD is an experimental comparison, NEVER an issued command. Reasons1 state invalid,2 nonplanar/inconsistent,4 nonfinite,8 no countersteer evidence,16 ambiguous. 50/100/200/400ms forecasts repeat current adapter demand or reduce it over200ms; fixed loads/frozen drive torque, not node-beam physics. Heldout validation limitations apply; not calibrated safety confidence. Diagnostic samples can lag prediction by<=1/30s',
 experience:'0 legacy diagnostic sample; 1 legacy internal name Simulation = Assist Off baseline; three-mode product concept cancelled',
 assistance:'available=0, state=1 disabled baseline (0 legacy/no layer), correction=0; active assist NOT implemented; legacy skid_detected/skid_phase/yaw_accel stay unavailable (null); preliminary classifier has distinct slip_* fields',
 input:'touch_fraction is normalized finger travel before precision; steer_demand is adapter output; target_pre_rate is shaped target; processed/final are frame-end commands. Touch timestamps are last accepted gesture/release; reset clears them. input_age_at_sample_ms is handler-to-RAF-sample age, NOT latency to physics or display',
 axes:'local_* use horizontal yaw basis (+long forward,+lat basis right); body_* use full chassis basis; front motion uses hub velocity in that basis, not tire slip. Input sign is opposite physical rack; compare FR/FL steer_deg and alpha_deg separately',
 validity:'forward_motion_valid is legacy simple gate, not shadow validity. state_reason_bits: 1 history,2 forward speed,4 contact/load,8 pose,16 damage/toe,32 nonfinite,64 dt,128 collision,256 split grip; reference adds512 restricted geometry. Qualification flags are experimental guards, NOT calibrated confidence',
 shadow:'Only diagnostic estimates. all-node COM beta differs from chassis beta; 40ms derivative filters after120ms warmup. chassis_yaw_dot is derivative of momentum-based yawRate, not total tyre moment/inertia. alpha_geom matches contact-plane formula with denominator floor; relaxed alpha remains separate original wheel fields. Force projections/moments at final-tick geometry approximate prior tyre Fx/Fy; normal/resistance/drag/structural forces excluded. Alignment/reference are geometric, not optimum countersteer or stable path. On request and strength are diagnostic configuration only; effective strength/correction always0',
 slip:'phase codes0 UNKNOWN,1 NORMAL,2 DRIFT_LIKE,3 UNSTABLE_SLIDE,4 RECOVERING,5 SIDE_TRANSITION; quality NOT calibrated probability or assist eligibility. Reasons use state bits plus1024 consistency/warmup. DRIFT_LIKE does not infer driver intent/control; RECOVERING does not guarantee restored trajectory. Warning is an observed pattern, not a rollout forecast. Fixed-step dwell before labels; UNKNOWN immediately at hard invalidity. 5Hz export may miss short states'
};
