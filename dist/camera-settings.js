// Camera preferences never share or overwrite vehicle/steering preferences.
export const CAMERA_KEY='driving-lab-camera-v014a4';
// Conservative bounds for the current cabin, including existing head-motion reserve.
// Future vehicles supply their own bounds to CameraRig; the base eye is always vehicle-owned.
export const seatLimits=Object.freeze({height:Object.freeze([-.15,.02]),forward:Object.freeze([-.20,.02])});
export const cameraDefaults=Object.freeze({mode:1,firstPerson:'driver',seatHeight:0,seatForward:0,inertia:true,intensity:25,headPreset:'natural',gazePreset:'natural',gazeIntensity:100,gazeMax:25,horizon:true,autoLook:true,drift:false,dynamicFov:0,fov:60,chaseDistance:5.6,chaseHeight:2.15,recenter:true,recenterSpeed:1});
const ranges={gazeIntensity:[0,100],gazeMax:[10,25],intensity:[0,100],fov:[55,90],chaseDistance:[4.5,10],chaseHeight:[1.3,4],recenterSpeed:[.4,2.5]};
export function sanitizeCameraSettings(value,bounds=seatLimits){const s={...cameraDefaults};if(!value||typeof value!=='object')return s;for(const k of ['inertia','horizon','autoLook','drift','recenter'])if(typeof value[k]==='boolean')s[k]=value[k];for(const [k,[lo,hi]] of Object.entries(ranges))if(typeof value[k]==='number'&&Number.isFinite(value[k]))s[k]=Math.max(lo,Math.min(hi,value[k]));for(const [key,axis] of [['seatHeight','height'],['seatForward','forward']]){const limits=bounds?.[axis],range=Array.isArray(limits)&&limits.length===2&&limits.every(Number.isFinite)&&limits[0]<=0&&limits[1]>=0?limits:seatLimits[axis];if(typeof value[key]==='number'&&Number.isFinite(value[key]))s[key]=Math.max(range[0],Math.min(range[1],value[key]));}if([0,1,2].includes(value.mode))s.mode=value.mode;for(const k of ['headPreset','gazePreset'])if(['reference','natural','strong'].includes(value[k]))s[k]=value[k];if(['static','driver'].includes(value.firstPerson))s.firstPerson=value.firstPerson;if([0,3,6].includes(value.dynamicFov))s.dynamicFov=value.dynamicFov;return s;}
export function loadCameraSettings(storage){try{return sanitizeCameraSettings(JSON.parse(storage.getItem(CAMERA_KEY)));}catch{return {...cameraDefaults};}}
export function saveCameraSettings(storage,s){try{storage.setItem(CAMERA_KEY,JSON.stringify(sanitizeCameraSettings(s)));return true;}catch{return false;}}
// Only this dedicated element owns orbit pointers. Never bind the canvas or steering pad.
export function bindCameraOrbit(element,rig,enabled,eventRoot){let pointer=null,x=0,y=0;
 const release=e=>{if(pointer===null||e?.pointerId!==undefined&&e.pointerId!==pointer)return;const id=pointer;pointer=null;rig.releaseOrbit();if(element.hasPointerCapture?.(id))element.releasePointerCapture(id);};
 element.addEventListener('pointerdown',e=>{if(!enabled()||pointer!==null||e.button>0)return;e.preventDefault();pointer=e.pointerId;x=e.clientX;y=e.clientY;rig.beginOrbit();element.setPointerCapture(pointer);});
 element.addEventListener('pointermove',e=>{if(e.pointerId!==pointer)return;e.preventDefault();rig.moveOrbit((e.clientX-x)*.007,(e.clientY-y)*.005);x=e.clientX;y=e.clientY;});
 for(const name of ['pointerup','pointercancel','lostpointercapture'])element.addEventListener(name,release);eventRoot?.addEventListener('blur',()=>release());return {cancel:()=>release()};
}
