// Offline only. structuredClone retains wheel/strut/arm/node alias topology.
export function vehicleSnapshot(v){return {vehicle:structuredClone(Object.fromEntries(Object.entries(v).filter(([k,x])=>typeof x!=='function'&&k!=='deformation'))),skin:{damage:v.deformation.damage,revision:v.deformation.revision}};}
export function restoreVehicle(v,s){Object.assign(v,structuredClone(s.vehicle));Object.assign(v.deformation,{vehicle:v,nodes:v.nodes,beams:v.beams,...s.skin});}
export function experienceSnapshot(e){return structuredClone({processor:e.processor,state:e.state,reference:e.reference,slip:e.slip,assistRequested:e.assistRequested,strength:e.strength});}
export function restoreExperience(e,s){for(const k of ['processor','state','reference','slip'])Object.assign(e[k],structuredClone(s[k]));e.assistRequested=s.assistRequested;e.strength=s.strength;}
export function actualState(v,startYaw=0,startX=0,startZ=0){
 let m=0,vx=0,vz=0,x=0,z=0;for(const n of v.nodes){m+=n.mass;vx+=n.mass*n.vx;vz+=n.mass*n.vz;x+=n.mass*n.x;z+=n.mass*n.z;}
 vx/=m;vz/=m;x/=m;z/=m;const sn=Math.sin(v.yaw),cs=Math.cos(v.yaw),U=vx*sn+vz*cs,V=vx*cs-vz*sn;
 return {beta:Math.atan2(V,U),U,V,r:v.yawRate,rack:v.steer,x:(x-startX)*Math.cos(startYaw)-(z-startZ)*Math.sin(startYaw),z:(x-startX)*Math.sin(startYaw)+(z-startZ)*Math.cos(startYaw),yaw:v.yaw-startYaw,contacts:v.wheels.filter(w=>w.contact).length,damage:v.damage,abs:v.absActive,tcs:v.tcsActive};
}
