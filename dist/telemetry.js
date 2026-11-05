import {drivingDiagnosticColumns,drivingDiagnosticValues,drivingDiagnosticNotes} from './driving-diagnostics.js';
const round=v=>Number.isFinite(v)?Math.round(v*1000)/1000:null;
const degrees=v=>v*180/Math.PI;
const surfaces={asphalt:0,curb:1,gravel:2,grass:3};
const base=['t_s','car_t_s','x_m','z_m','speed_kmh','beta_deg','yaw_deg','yaw_rate_deg_s','ax_filtered_m_s2','ay_filtered_m_s2','roll_deg','pitch_deg','steer_input','steer_actual_deg','gas_input','gas_actual','brake_input','brake_actual','handbrake','rpm','gear','reverse','abs_active','tcs_active','damage','broken_beams','max_beam_strain','max_arm_damage','frame_max_ms','render_max_ms','physics_max_ms','physics_steps','backlog_ms','discarded_ms','input_mode','tilt_raw_deg','tilt_deg','tilt_neutral_deg','sensor_age_ms','sensor_ready','clutch_torque_Nm','clutch_engagement','shift_timer_s','yaw_inertia_kgm2','body_y_m','body_vy_m_s','body_contacts','body_normal_impulse_Ns','traffic_step_max_ms','traffic_contact_max_ms','active_traffic','requested_traffic','raf_hz'];
const wheelFields=['load_N','slip_ratio','alpha_deg','fx_N','fy_N','omega_rad_s','contact','surface','steer_deg','force_limit_N','drive_torque_Nm'];
export const columns=[...base,...['FR','FL','RR','RL'].flatMap(name=>wheelFields.map(f=>`${name}_${f}`)),...drivingDiagnosticColumns];
export class TelemetryLog{
 constructor(version){this.version=version;this.rows=[];this.events=[];this.last=-Infinity;this.context='';this.startedAt=new Date().toISOString();this.frameMax=0;this.renderMax=0;this.steps=0;this.discarded=0;this.physicsMax=0;this.trafficMax=0;this.trafficContactMax=0;this.frameTotal=0;this.frameCount=0;this.lastRafHz=0;this.physicsSampleMs=0;this.trafficSampleMs=0;this.renderSampleMs=0;}
 get duration(){return this.rows.length>1?this.rows.at(-1)[0]-this.rows[0][0]:0;}
 get markCount(){return this.events.filter(e=>e.type==='issue').length;}
 event(t,type,data={}){this.events.push({t:round(t),type,...data});if(this.events.length>256)this.events.shift();}
 capture(t,v,input,extra){
  this.frameMax=Math.max(this.frameMax,extra.frameMs);this.renderMax=Math.max(this.renderMax,extra.renderMs);this.physicsMax=Math.max(this.physicsMax,extra.physicsMs||0);this.steps+=extra.steps;this.discarded+=extra.discardedMs;
  this.trafficMax=Math.max(this.trafficMax,extra.trafficMs||0);this.trafficContactMax=Math.max(this.trafficContactMax,extra.trafficContactMs||0);this.frameTotal+=extra.frameMs;this.frameCount++;
  const context={config:{...v.config},location:extra.location,slow:extra.slow,camera:extra.cameraMode,sound:extra.sound,mode:extra.mode,tiltRange:extra.tilt.range,tiltInvert:extra.tilt.invert};
  const signature=JSON.stringify(context);if(signature!==this.context){this.context=signature;this.event(t,'setup',context);}
  if(t-this.last<.099999)return;
  this.last=t;
  const sn=Math.sin(v.yaw),cs=Math.cos(v.yaw),long=v.vx*sn+v.vz*cs,lat=v.vx*cs-v.vz*sn;
  const beta=v.speed>.5?degrees(Math.atan2(lat,long)):0;
  const age=extra.now-extra.tilt.lastTime;
  const row=[t,v.time,v.x,v.z,v.speed*3.6,beta,degrees(v.yaw),degrees(v.yawRate),v.ax,v.ay,degrees(v.roll),degrees(v.pitch),input.steer,degrees(v.steer),input.gas,v.throttle,input.brake,v.brake,input.handbrake,v.rpm,v.gear,+input.reverse,+v.absActive,+v.tcsActive,v.damage,v.brokenBeams??0,Math.max(...(v.beams??[]).filter(b=>!b.broken&&b.kind!=='strut').map(b=>Math.abs(Math.hypot(v.nodes[b.a].x-v.nodes[b.b].x,v.nodes[b.a].y-v.nodes[b.b].y,v.nodes[b.a].z-v.nodes[b.b].z)/b.original-1))),Math.max(...v.wheels.map(w=>w.damage)),this.frameMax,this.renderMax,this.physicsMax,this.steps,extra.backlogMs,this.discarded,{touch:0,tilt:1,digital:2}[extra.mode],extra.tilt.rawAngle,extra.tilt.angle,extra.tilt.neutral,Number.isFinite(age)?age:null,+extra.tilt.ready,v.clutchTorque,v.clutchEngagement,v.shiftTimer,v.yawInertia,v.y,v.vy,v.bodyContactCount??0,v.bodyNormalImpulse??0,this.trafficMax,this.trafficContactMax,extra.activeTraffic??0,extra.requestedTraffic??0,this.frameCount*1000/Math.max(this.frameTotal,.001)];
  for(const w of v.wheels)row.push(w.load,w.slip,degrees(w.alpha),w.fx,w.fy,w.omega,+w.contact,surfaces[w.surface]??-1,degrees(w.steerAngle),w.forceLimit,w.driveTorque);
  row.push(...drivingDiagnosticValues(v,input,extra));
  this.lastRafHz=this.frameCount*1000/Math.max(this.frameTotal,.001);this.physicsSampleMs=this.physicsMax;this.trafficSampleMs=this.trafficMax;this.renderSampleMs=this.renderMax;this.trafficMax=this.trafficContactMax=this.frameTotal=this.frameCount=0;
  this.rows.push(row.map(round));this.frameMax=this.renderMax=this.physicsMax=this.steps=this.discarded=0;
  while(this.rows.length&&(t-this.rows[0][0]>60.001||this.rows.length>602))this.rows.shift();
  // Retain the setup in force at the beginning of the buffer.
  const first=this.rows[0][0];const previousSetup=this.events.filter(e=>e.type==='setup'&&e.t<first).at(-1);
  this.events=this.events.filter(e=>e.t>=first||e===previousSetup);
 }
 export(seconds=30,metadata={}){
  if(!this.rows.length)return '';
  const end=this.rows.at(-1)[0],start=Math.max(this.rows[0][0],end-seconds);let last=-Infinity;
  const rows=this.rows.filter(r=>{if(r[0]<start-1e-5||r[0]-last<.199)return false;last=r[0];return true;});
  const previous=this.events.filter(e=>e.type==='setup'&&e.t<start).at(-1),events=this.events.filter(e=>e.t>=start&&e.t<=end+.101||e===previous);
  const header={format:'DrivingLabCSV/4',drivingDiagnostics:drivingDiagnosticNotes,version:this.version,startedAt:this.startedAt,range_s:[rows[0][0],rows.at(-1)[0]],sampleRateHz:5,...metadata,events,notes:{clock:'t_s is monotonic simulation driving time; car_t_s resets with car. Pauses excluded. Samples at frame end ~10 Hz, copy decimated to ~5 Hz; spikes below 0.2 s may be missed.',modes:'0 touch, 1 tilt, 2 digital',surfaces:'0 asphalt, 1 curb, 2 gravel, 3 grass',wheelOrder:'FR x<0 front; FL x>0 front; RR x<0 rear; RL x>0 rear (vehicle forward +z)',steering:'input +1 right; physics actual angle has opposite sign',timing:'frame_max_ms is maximum RAF interval since sample; render_max_ms is CPU scene update/render submission time, not GPU time; physics_max_ms excludes traffic in 0.13; traffic_step_max_ms includes AI and movement; traffic_contact_max_ms includes player/NPC and road barrier contacts; raf_hz is observed RAF cadence over the sample, not GPU FPS; active/requested traffic expose allocation; discarded_ms is frame time excluded by 80 ms clamp',forces:'fx longitudinal; fy lateral in wheel coordinates; body_contacts counts chassis node contacts, body_normal_impulse_Ns is the last substep ground impulse; ax/ay are filtered model accelerations; null means unavailable'}};
  return 'DRIVING LAB TELEMETRY\n'+JSON.stringify(header)+'\n'+columns.join(',')+'\n'+rows.map(r=>r.map(v=>v===null?'':v).join(',')).join('\n')+'\nEND TELEMETRY';
 }
}
export async function copyTelemetry(text,nav,textarea,fallback,doc){
 try{if(nav.clipboard?.writeText){await nav.clipboard.writeText(text);fallback.hidden=true;return true;}}catch{}
 fallback.hidden=false;textarea.value=text;textarea.focus();textarea.select();textarea.setSelectionRange(0,text.length);
 try{if(doc.execCommand('copy')){fallback.hidden=true;return true;}}catch{}
 return false;
}
