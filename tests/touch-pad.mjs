import assert from 'node:assert/strict';
import {bindSteeringPad,pedalLevel} from '../dist/controls.js';
class Pad extends EventTarget{getBoundingClientRect(){return {width:250,bottom:200,height:120};}setPointerCapture(){}fire(type,x,id=1){const e=new Event(type,{cancelable:true});e.clientX=x;e.pointerId=id;this.dispatchEvent(e);}}
const pad=new Pad();let value=0,active=false;const binding=bindSteeringPad(pad,(v,a)=>{value=v;active=a;});
pad.fire('pointerdown',30);assert.equal(value,0);assert.equal(active,true,'Neutral touch overrides sensor mode while held');pad.fire('pointermove',130);assert.equal(value,1,'Full countersteer remains available');pad.fire('pointermove',-70);assert.equal(value,-1);pad.fire('pointercancel',0);assert.equal(value,0);assert.equal(active,false);
pad.fire('pointerdown',180);pad.fire('pointermove',205);assert.ok(value>0&&value<.25,'Fine steering around arbitrary anchor');binding.reset();assert.equal(value,0);pad.fire('pointermove',240);assert.equal(value,0,'Reset clears held gesture');
assert.equal(pedalLevel(80,pad.getBoundingClientRect()),1);assert.equal(pedalLevel(140,pad.getBoundingClientRect()),.5);assert.equal(pedalLevel(200,pad.getBoundingClientRect()),0);
console.log('Touch pad: arbitrary start, full countersteer, cancellation, reset and proportional pedal travel verified.');
const tuned=new Pad();let demand=0;bindSteeringPad(tuned,v=>demand=v,()=>({travel:1.5,precision:2}));tuned.fire('pointerdown',0);tuned.fire('pointermove',75);assert.ok(Math.abs(demand-.25)<1e-9);tuned.fire('pointermove',150);assert.equal(demand,1);tuned.fire('pointermove',-150);assert.equal(demand,-1);tuned.fire('pointercancel',0);assert.equal(demand,0);
