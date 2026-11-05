// Visual calibration, not measured physiology. No vehicle/input writes.
export const profileIndex=key=>key==='reference'?0:key==='strong'?2:1;
export const HEAD_PROFILES=Object.freeze([
 Object.freeze({translationAccel:.7/(2*Math.PI*3.2)**2,translationBrake:.7/(2*Math.PI*3.2)**2,pitchAccel:.0045,pitchBrake:.0045,back:.03,front:.03,stateLimit:.06,pitchSoft:.06,pitchCap:.06,translationHz:3.2,pitchHz:2.6,releaseHz:2.6,onsetTranslation:0,onsetPitch:0}),
 Object.freeze({translationAccel:.0045,translationBrake:.0055,pitchAccel:.0085,pitchBrake:.0095,back:.03,front:.04,stateLimit:.12,pitchSoft:.10,pitchCap:.085,translationHz:3.2,pitchHz:2.8,releaseHz:3.4,onsetTranslation:.00035,onsetPitch:.0006}),
 Object.freeze({translationAccel:.0062,translationBrake:.008,pitchAccel:.011,pitchBrake:.0127,back:.034,front:.043,stateLimit:.14,pitchSoft:.12,pitchCap:.105,translationHz:3.4,pitchHz:3.0,releaseHz:3.7,onsetTranslation:.0006,onsetPitch:.001})
]);
export const GAZE_PROFILES=Object.freeze([
 Object.freeze({blend:0,influence:.8,filter:.08,enter:.12,exit:.075,full:.174533,hz:2.8,rate:.8,acceleration:2}),
 Object.freeze({blend:1,influence:.8,filter:.08,enter:.069813,exit:.043633,full:.174533,hz:2.2,rate:.8,acceleration:2}),
 Object.freeze({blend:1,influence:1,filter:.065,enter:.061087,exit:.03927,full:.139626,hz:2.4,rate:1,acceleration:2.5})
]);
const headKeys=Object.keys(HEAD_PROFILES[0]),gazeKeys=Object.keys(GAZE_PROFILES[0]);
export function calibration(out,mix,table){const i=Math.min(1,Math.floor(mix)),t=mix-i,keys=table===HEAD_PROFILES?headKeys:gazeKeys;for(const k of keys)out[k]=table[i][k]+(table[i+1][k]-table[i][k])*t;return out;}
export function transition(current,target,h){const n=current+(target-current)*(1-Math.exp(-h/.20));return Math.abs(n-target)<1e-6?target:n;}
