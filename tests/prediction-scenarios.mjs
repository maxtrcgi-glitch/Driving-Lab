// New family split frozen before heldout use; stimulus names are not labels.
export const predictionSplits={calibration:{speeds:[80,140],names:['smooth-release','long-counter','steady-demand','straight']},heldout:{speeds:[110,180,220],names:['delayed-unwind','two-pulse','brake-turn','opposite-flick']}};
export function predictionInput(name,t,side){
 let raw=0,gas=.16,brake=0,handbrake=0;
 const ramp=(a,b)=>Math.max(0,Math.min(1,(t-a)/(b-a)));
 if(name==='smooth-release'){raw=t<1.05?.60*ramp(.3,.7):t<1.8?-.48*ramp(1.05,1.25):-.48*Math.max(0,1-(t-1.8)/.35);handbrake=t>.72&&t<1?.25:0;}
 if(name==='long-counter'){raw=t<1?.58*ramp(.25,.55):t<2.65?-.62*ramp(1,1.18):0;handbrake=t>.62&&t<.9?.18:0;}
 if(name==='steady-demand'){raw=.47*ramp(.35,.8);gas=.36;handbrake=t>.85?.035:0;}
 if(name==='delayed-unwind'){raw=t<.95?.68*ramp(.25,.5):t<2.4?-.51*ramp(.95,1.22):-.51*Math.max(0,1-(t-2.4)/.5);handbrake=t>.6&&t<.86?.16:0;}
 if(name==='two-pulse'){raw=t<.85?.53*ramp(.3,.5):t<1.55?-.66*ramp(.85,1.1):t<2.45?.36*ramp(1.55,1.8):0;gas=.22;}
 if(name==='brake-turn'){raw=t<1.25?.39*ramp(.3,.75):t<2.5?-.43*ramp(1.25,1.5):0;brake=t>.8&&t<1.15?.42:0;gas=t<1.3?0:.1;}
 if(name==='opposite-flick'){raw=t<.95?.73*ramp(.3,.45):t<2.8?-.76*ramp(.95,1.04):0;handbrake=t>.63&&t<.94?.12:0;}
 return {raw:raw*side,gas,brake,handbrake};
}
