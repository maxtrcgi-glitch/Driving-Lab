// Independent OFFLINE observation labels. No estimator/detector import.
// Future trajectory + force/contact observations; proxies, NOT driver intent.
// Frozen before held-out evaluation; constants intentionally differ from runtime.
export const oracleProtocol=Object.freeze({angleOnDeg:8,quietDeg:2.5,futureSeconds:.35,growthDeg:2,sideConfirmDeg:5,plateauSeconds:.5,plateauSpanDeg:3});
const wrap=x=>Math.atan2(Math.sin(x),Math.cos(x)),deg=x=>x*180/Math.PI;
export function labelTrace(rows){
 let episodeSide=0;
 return rows.map((x,i)=>{
  const ahead=rows.slice(i,Math.min(rows.length,i+11)),future=rows[i+7];
  if(!future||ahead.length<11||x.speed<5||x.damage>.03||x.contactCount<4)return 'UNKNOWN';
  const error=deg(wrap(x.yaw-Math.atan2(x.comVX,x.comVZ))),abs=Math.abs(error),side=Math.sign(error);
  const errors=ahead.map(y=>deg(wrap(y.yaw-Math.atan2(y.comVX,y.comVZ))));
  const fError=errors[7],growth=Math.abs(fError)-abs;
  const rearSlip=x.exactRearAlpha,frontSlip=x.exactFrontAlpha,forceSupport=x.rearUtil>.6||x.frontUtil>.65;
  if(episodeSide&&side!==episodeSide&&abs>oracleProtocol.sideConfirmDeg&&growth>1&&rearSlip>.06)return 'SIDE_TRANSITION';
  if(abs>oracleProtocol.angleOnDeg&&rearSlip>.06&&forceSupport){
   if(!episodeSide)episodeSide=side;
   if(growth>oracleProtocol.growthDeg)return 'UNSTABLE_SLIDE';
   if(growth<-oracleProtocol.growthDeg&&future.speed>x.speed*.85)return 'RECOVERING';
   const sameSide=errors.every(e=>Math.sign(e)===side),span=Math.max(...errors)-Math.min(...errors);
   const velocityHeadDelta=Math.abs(wrap(Math.atan2(ahead[10].comVX,ahead[10].comVZ)-Math.atan2(x.comVX,x.comVZ)));
   const bodyHeadDelta=Math.abs(wrap(ahead[10].yaw-x.yaw));
   if(sameSide&&span<oracleProtocol.plateauSpanDeg&&ahead[10].speed>x.speed*.9&&Math.abs(velocityHeadDelta-bodyHeadDelta)<.06)return 'DRIFT_LIKE';
  }
  if(abs<oracleProtocol.quietDeg&&frontSlip<.08&&rearSlip<.08&&errors.every(e=>Math.abs(e)<4))return 'NORMAL';
  return 'UNKNOWN';
 });
}
