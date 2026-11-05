import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
// Run the production menu handlers with queued native dialog close events.
// This catches transitions that would resume the car behind another modal.
const source=fs.readFileSync('dist/app.js','utf8'),queue=[];
class Element extends EventTarget{
 constructor(){super();this.open=false;this.attributes={};this.classList={toggle:()=>{},add:()=>{},remove:()=>{}};}
 setAttribute(k,v){this.attributes[k]=v;}
 showModal(){assert.equal(this.open,false);this.open=true;}
 close(){if(!this.open)return;this.open=false;queue.push(()=>this.dispatchEvent(new Event('close')));}
 click(){this.dispatchEvent(new Event('click'));}
}
const ids=new Map();const $=id=>{if(!ids.has(id))ids.set(id,new Element());return ids.get(id);};
let cleared=0,keptTilt=0,reset=0;
const ctx=vm.createContext({cameraOrbit:{cancel(){}},cameraRig:{resume(){}},cameraRoad:{reset(){}},vehicle:{},$,document:{body:$('body')},running:true,paused:false,location:'track',clearInput(keep){cleared++;if(keep===true)keptTilt++;},place(){reset++;},toast(){}});
const menu=source.slice(source.indexOf("const pauseMenu=$('pause-menu');"),source.indexOf('function repair()'));
const settings=source.slice(source.indexOf("const settings=$('settings');"),source.indexOf("$('move-btn')"));
vm.runInContext(menu+'\n'+settings,ctx);
const flush=()=>{while(queue.length)queue.shift()();};
$('pause-btn').click();assert.equal(ctx.paused,true);assert.equal($('pause-menu').open,true);assert.ok(cleared>0,'Opening a menu releases held pedals');
$('settings-btn').click();flush();assert.equal($('settings').open,true);assert.equal($('pause-menu').open,false);assert.equal(ctx.paused,true,'Queued close must not resume behind settings');
$('close-settings').click();flush();assert.equal($('pause-menu').open,true);assert.equal(ctx.paused,true);
$('reset-btn').click();assert.equal(reset,1);assert.equal(ctx.paused,true,'Restart waits for explicit resume');
$('resume-btn').click();flush();assert.equal(ctx.paused,false);assert.equal($('pause-menu').open,false);assert.equal(cleared,keptTilt,'Menu navigation keeps sensor calibration');
vm.runInContext('running=false',ctx);$('welcome-settings').click();flush();assert.equal(ctx.paused,true);$('close-settings').click();flush();assert.equal(ctx.paused,false);assert.equal($('pause-menu').open,false);
console.log('Menu: pause, held input release, settings transitions, restart, resume and pre-race setup verified.');
