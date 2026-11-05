// Immutable C03/A.1 response for explicit regression/legacy replay only.
import {steeringEnvelope} from './controls.js';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export class LegacySteeringResponse{
 constructor(){this.position=0;this.target=0;this.raw=0;this.mode='digital';}
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
  const rate=mode==='digital'?(this.raw?.62:1.8):reversing?2.4:returning?2:1.8;
  const tau=mode==='digital'?.025:.035+.02*blend;
  const delta=(this.target-this.position)*(1-Math.exp(-h/tau));
  this.position+=clamp(delta,-rate*h,rate*h);
  if(this.target===0&&Math.abs(this.position)<1e-5)this.position=0;
  return this.position;
 }
}
