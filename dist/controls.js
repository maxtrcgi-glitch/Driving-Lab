const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const smoothStep=x=>{x=clamp(x,0,1);return x*x*(3-2*x);};
// Input convention: -1 left, +1 right, independent of renderer axes.
export function steeringDemand(keys,actions,tilt=0){
 const held=[...actions.values()];
 const right=keys.has('KeyD')||keys.has('ArrowRight')||held.includes('right');
 const left=keys.has('KeyA')||keys.has('ArrowLeft')||held.includes('left');
 return right||left?Number(right)-Number(left):tilt;
}
export function bindHold(button,id,actions,changed){
 const suppress=e=>{if(e.cancelable)e.preventDefault();};
 button.addEventListener('pointerdown',e=>{suppress(e);try{button.setPointerCapture(e.pointerId);}catch{}actions.set(e.pointerId,id);changed();});
 const release=e=>{actions.delete(e.pointerId);changed();};
 for(const type of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(type,release);
 // Active touch listeners suppress Safari long-press selection/loupe and
 // keep a fallback hold alive if the browser cancels its pointer stream.
 button.addEventListener('touchstart',e=>{suppress(e);for(const t of e.changedTouches)actions.set('touch-'+t.identifier,id);changed();},{passive:false});
 button.addEventListener('touchmove',suppress,{passive:false});
 for(const type of ['touchend','touchcancel'])button.addEventListener(type,e=>{suppress(e);for(const t of e.changedTouches)actions.delete('touch-'+t.identifier);changed();},{passive:false});
 for(const type of ['contextmenu','selectstart','dragstart'])button.addEventListener(type,suppress);
 const key='keyboard-'+id;
 button.addEventListener('keydown',e=>{if(['Space','Enter'].includes(e.code)){suppress(e);actions.set(key,id);changed();}});
 button.addEventListener('keyup',e=>{if(['Space','Enter'].includes(e.code)){actions.delete(key);changed();}});
 button.addEventListener('blur',()=>{actions.delete(key);changed();});
}
export function bindTap(button){
 const touches=new Map();
 const suppress=e=>{if(e.cancelable)e.preventDefault();};
 button.addEventListener('touchstart',e=>{suppress(e);for(const t of e.changedTouches)touches.set(t.identifier,{x:t.clientX,y:t.clientY,cancelled:false});},{passive:false});
 button.addEventListener('touchmove',e=>{suppress(e);for(const t of e.changedTouches){const start=touches.get(t.identifier);if(start&&Math.hypot(t.clientX-start.x,t.clientY-start.y)>18)start.cancelled=true;}},{passive:false});
 button.addEventListener('touchend',e=>{suppress(e);let activate=false;for(const t of e.changedTouches){const start=touches.get(t.identifier);touches.delete(t.identifier);if(start&&!start.cancelled)activate=true;}if(activate&&!button.disabled)button.click();},{passive:false});
 button.addEventListener('touchcancel',e=>{suppress(e);for(const t of e.changedTouches)touches.delete(t.identifier);},{passive:false});
 for(const type of ['contextmenu','selectstart','dragstart'])button.addEventListener(type,suppress);
}
export class DigitalSteering{
 constructor(){this.position=0;}
 reset(){this.position=0;}
 value(demand,speed,dt){
  // Input assistance only for binary buttons; sensor steering keeps full range.
  const limit=.85/(1+Math.pow(Math.abs(speed)/13,1.7));
  const target=demand*limit,rate=demand?.62:1.8;
  this.position+=clamp(target-this.position,-rate*dt,rate*dt);
  return this.position;
 }
}
// Shared driver-command shaping; wheel/vehicle dynamics remain in Vehicle.
// Rates are normalized command/s, speed is m/s. Analog end travel still
// provides a useful countersteer reserve; small movements receive precision.
export function steeringEnvelope(speed){
 const s=Number.isFinite(speed)?Math.abs(speed):0;
 return .14+.86/(1+Math.pow(Math.max(0,s-8)/18,2));
}
export class SteeringResponse{
 constructor({fastRate=3.4,fastTauScale=.8}={}){this.position=0;this.target=0;this.raw=0;this.mode='digital';this.fastRate=clamp(fastRate,2.4,5.2);this.fastTauScale=clamp(fastTauScale,.5,1);}
 reset(){this.position=this.target=this.raw=0;}
 value(demand,speed,dt,mode='touch'){
  this.raw=Number.isFinite(demand)?clamp(demand,-1,1):0;this.mode=mode;
  const s=Number.isFinite(speed)?Math.abs(speed):0;
  const blend=clamp((s-8)/48,0,1),a=Math.abs(this.raw);
  // Pad already applies its configurable center curve. Tilt has no pad curve.
  const exponent=mode==='digital'?1:1+(mode==='tilt'?.15:0)+.35*blend;
  const limit=mode==='digital'?.85/(1+Math.pow(s/13,1.7)):steeringEnvelope(s);
  const shaped=Math.pow(a,exponent);
  // Preserve v0.14A precision through the center/midrange. Only deliberate
  // outer travel unlocks the existing mechanical lock, without reading slip,
  // yaw or choosing a steering direction on the driver's behalf.
  const outer=mode==='digital'?0:clamp((shaped-.45)/.55,0,1);
  const reserve=outer*outer*(3-2*outer);
  this.target=Math.sign(this.raw)*(shaped*limit+(1-limit)*reserve);
  if(!Number.isFinite(dt)||dt<=0)return this.position;
  const h=Math.min(dt,.08),reversing=this.position*this.target<0;
  const returning=this.target===0||(!reversing&&Math.abs(this.target)<Math.abs(this.position));
  // Pure input ergonomics: a fast large command creates a large tracking
  // error; a slow ramp usually does not. No beta/yaw/vehicle-state feedback.
  // Exact legacy response for |target|<=.30 or tracking error<=.12, return,
  // and digital controls. Boost remains continuous through zero crossing.
  const fast=mode==='digital'||returning?0:smoothStep((Math.abs(this.target)-.30)/.70)*smoothStep((Math.abs(this.target-this.position)-.12)/.68);
  const normalRate=mode==='digital'?(this.raw?.62:1.8):reversing?2.4:returning?2:1.8;
  const rate=normalRate+(this.fastRate-normalRate)*fast;
  const tau=(mode==='digital'?.025:.035+.02*blend)*(1-(1-this.fastTauScale)*fast);
  const delta=(this.target-this.position)*(1-Math.exp(-h/tau));
  this.position+=clamp(delta,-rate*h,rate*h);
  if(this.target===0&&Math.abs(this.position)<1e-5)this.position=0;
  return this.position;
 }
}
export class TiltSteering{
 constructor(){this.range=40;this.invert=false;this.ready=false;this.lastTime=-Infinity;this.angle=0;this.neutral=0;this.filtered=null;this.screenAngle=null;}
 sample(g,screenAngle,now){
 if(![g.x,g.y,g.z,screenAngle,now].every(Number.isFinite))return false;
 const magnitude=Math.hypot(g.x,g.y,g.z);if(magnitude<4||magnitude>18)return false;
 const a=screenAngle*Math.PI/180;
 // Screen orientation angle is counter-clockwise from natural device axes.
 const x=g.x*Math.cos(a)-g.y*Math.sin(a),y=g.x*Math.sin(a)+g.y*Math.cos(a);
 const measured=-Math.atan2(x,Math.hypot(y,g.z))*180/Math.PI;this.rawAngle=measured;
 if(this.screenAngle!==screenAngle){this.ready=false;this.filtered=null;this.screenAngle=screenAngle;}
 const dt=Math.min(.2,Math.max(0,(now-this.lastTime)/1000));
 this.filtered=this.filtered===null||now-this.lastTime>500?measured:this.filtered+(measured-this.filtered)*(1-Math.exp(-dt/.085));
 this.angle=this.filtered;this.lastTime=now;return true;
 }
 calibrate(now=this.lastTime){if(now-this.lastTime>500||this.filtered===null||!Number.isFinite(this.angle))return false;this.neutral=this.angle;this.ready=true;return true;}
 suspend(){this.ready=false;this.filtered=null;this.lastTime=-Infinity;}
 value(now){if(!this.ready||now-this.lastTime>500)return 0;const d=(this.angle-this.neutral)*(this.invert?-1:1),dead=1.5;return Math.sign(d)*clamp((Math.abs(d)-dead)/(this.range-dead),0,1);}
}
export function pedalLevel(y,rect){return clamp((rect.bottom-y)/rect.height,0,1);}
export function bindPedal(button,id,actions,levels,changed){
 bindHold(button,id,actions,changed);
 const set=(key,y)=>{if(actions.has(key)&&Number.isFinite(y)){levels.set(key,pedalLevel(y,button.getBoundingClientRect()));changed();}};
 for(const event of ['pointerdown','pointermove'])button.addEventListener(event,e=>set(e.pointerId,e.clientY));
 for(const event of ['touchstart','touchmove'])button.addEventListener(event,e=>{for(const t of e.changedTouches)set('touch-'+t.identifier,t.clientY);},{passive:false});
 for(const event of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(event,e=>levels.delete(e.pointerId));
 for(const event of ['touchend','touchcancel'])button.addEventListener(event,e=>{for(const t of e.changedTouches)levels.delete('touch-'+t.identifier);},{passive:false});
}
export function bindSteeringPad(element,changed,options=()=>({})){
 let pointer=null,touch=null,anchor=0,value=0,fraction=0,eventTime=null,receivedTime=null;
 // Read-only diagnostics. Never advance steering or change event ownership.
 const stamp=e=>{eventTime=Number.isFinite(e?.timeStamp)?e.timeStamp:null;receivedTime=e?performance.now():null;};
 const suppress=e=>{if(e.cancelable)e.preventDefault();};
 const move=(x,e)=>{const settings=options(),extent=Math.max(55,element.getBoundingClientRect().width*.40)*(settings.travel||1);fraction=clamp((x-anchor)/extent,-1,1);stamp(e);value=Math.sign(fraction)*Math.pow(Math.abs(fraction),settings.precision||1.45);changed(value,true);};
 const release=e=>{pointer=touch=null;value=fraction=0;stamp(e);changed(0,false);};
 element.addEventListener('pointerdown',e=>{suppress(e);if(pointer!==null||touch!==null)return;pointer=e.pointerId;anchor=e.clientX;try{element.setPointerCapture(pointer);}catch{}move(e.clientX,e);});
 element.addEventListener('pointermove',e=>{if(pointer===e.pointerId)move(e.clientX,e);});
 for(const event of ['pointerup','pointercancel','lostpointercapture'])element.addEventListener(event,e=>{if(pointer===e.pointerId&&touch===null)release(e);});
 element.addEventListener('touchstart',e=>{suppress(e);if(touch!==null)return;const t=e.changedTouches[0];if(!t)return;touch=t.identifier;anchor=t.clientX;move(t.clientX,e);},{passive:false});
 element.addEventListener('touchmove',e=>{suppress(e);for(const t of e.changedTouches)if(t.identifier===touch)move(t.clientX,e);},{passive:false});
 for(const event of ['touchend','touchcancel'])element.addEventListener(event,e=>{suppress(e);for(const t of e.changedTouches)if(t.identifier===touch)release(e);},{passive:false});
 for(const event of ['contextmenu','selectstart'])element.addEventListener(event,suppress);
 return {reset:()=>release(),get value(){return value;},get fraction(){return fraction;},get active(){return pointer!==null||touch!==null;},get eventTime(){return eventTime;},get receivedTime(){return receivedTime;}};
}
