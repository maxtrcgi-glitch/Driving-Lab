// Invoke this synchronously from a native click; all permission APIs run before awaiting.
export function requestTiltAccess(env){
 const embedded=env.top!==env.self;
 if(env.isSecureContext===false)return Promise.resolve({ok:false,reason:'insecure',embedded});
 const policy=env.document?.permissionsPolicy||env.document?.featurePolicy;
 if(policy&&embedded){try{if(!policy.allowsFeature('accelerometer')||!policy.allowsFeature('gyroscope'))return Promise.resolve({ok:false,reason:'policy',embedded});}catch{}}
 const requests=[];
 for(const [name,api] of [['orientation',env.DeviceOrientationEvent],['motion',env.DeviceMotionEvent]]){
  if(!api)continue;
  try{requests.push({name,result:typeof api.requestPermission==='function'?api.requestPermission.call(api):Promise.resolve('granted')});}
  catch(error){requests.push({name,result:Promise.reject(error)});}
 }
 if(!requests.length)return Promise.resolve({ok:false,reason:'unsupported',embedded});
 return Promise.allSettled(requests.map(r=>r.result)).then(results=>{
  const states=Object.fromEntries(results.map((r,i)=>[requests[i].name,r.status==='fulfilled'?r.value:r.reason?.name||'error']));
  const ok=Object.values(states).includes('granted');
  return {ok,reason:ok?'granted':Object.values(states).includes('NotAllowedError')?'gesture':'denied',embedded,states};
 });
}
export function orientationGravity(beta,gamma){
 if(![beta,gamma].every(Number.isFinite))return null;
 const b=beta*Math.PI/180,g=gamma*Math.PI/180;
 return {x:-9.81*Math.cos(b)*Math.sin(g),y:9.81*Math.sin(b),z:9.81*Math.cos(b)*Math.cos(g)};
}
