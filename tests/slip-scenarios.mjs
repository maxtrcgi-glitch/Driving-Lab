// Fixed driver manoeuvres; no injected beta/yaw/node velocities after reset.
// Names describe the stimulus, NOT guaranteed outcome/phase ground truth.
export const scenarioNames=['straight','turn','lane','front-demand','rear-brake','counter-release','counter-hold','pendulum','mild-release','mild-hold','steady-slide-probe'];
export function driverInput(name,t,side=1){
 let raw=0,gas=.12,handbrake=0;
 if(name==='turn')raw=t>.4?.10:0;
 if(name==='lane')raw=t<.4?0:t<.9?.28:t<1.4?-.28:0;
 if(name==='front-demand')raw=t<.4?0:t<1.5?.8:0;
 if(name==='rear-brake'){
  raw=t<.4?0:t<1.6?.35:0;handbrake=t>.7&&t<1.2?.65:0;
 }
 if(name==='counter-release'||name==='counter-hold'){
  raw=t<.4?0:t<1?.4:t<(name==='counter-hold'?2.6:1.6)?-.7:0;
  handbrake=t>.65&&t<1?.55:0;
 }
 if(name==='pendulum')raw=t<.4?0:t<1?.65:t<1.9?-.85:t<2.6?.65:0;
 if(name==='mild-release'||name==='mild-hold')raw=t<.4?0:t<1?.65:t<(name==='mild-hold'?2.6:1.45)?-.55:0;
 if(name==='steady-slide-probe'){raw=t>.4?.42:0;gas=.5;handbrake=t>.8?.025:0;}
 return {raw:raw*side,gas,handbrake};
}
