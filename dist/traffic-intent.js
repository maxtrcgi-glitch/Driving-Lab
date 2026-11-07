// Strategic memory; all physical lane-change safety remains in Highway.
export function createIntent(){return {state:'CRUISE',reconsiderAt:0,targetId:null,targetGeneration:null,targetLane:null,since:0,waiting:0,abandonReason:'none',passCompleted:false};}
export function abandonIntent(intent,reason,now){intent.state='CRUISE';intent.targetId=null;intent.targetGeneration=null;intent.targetLane=null;intent.waiting=0;intent.since=now;intent.abandonReason=reason;intent.passCompleted=false;intent.reconsiderAt=now+3;}
export function updateIntent(car,leader,blocked,now,lookup){
 const i=car.intent??(car.intent=createIntent());if(now<i.reconsiderAt){i.state=blocked?'FOLLOW':'CRUISE';return i;}
 if(i.targetId!==null){const target=lookup.get(i.targetId);
  if(!target||target.generation!==i.targetGeneration){abandonIntent(i,'target_unavailable',now);return i;}
  if(!car.changing&&(car.s-target.s)*car.dir>(car.length+target.length)/2+5&&!i.passCompleted){i.passCompleted=true;i.state='PASS_COMPLETE';i.since=now;return i;}
  if(i.passCompleted){if(!car.changing&&car.lane===car.cruiseLane){abandonIntent(i,'returned_to_cruise',now);return i;}if(now-i.since>.5)i.state='RETURN_TO_CRUISE';return i;}
  if(car.aborting){abandonIntent(i,'trajectory_aborted',now);return i;}
  if(car.changing||i.state==='EXECUTE_PASS')return i;
  i.waiting=Math.max(0,now-i.since);
  if(i.waiting>12+18*(car.traits?.patience??.5)){abandonIntent(i,'wait_timeout',now);return i;}
  if(car.desired<target.speed+.5||Math.abs(car.s-target.s)>300){abandonIntent(i,'target_irrelevant',now);return i;}
  i.state=i.waiting>.1?'WAIT_FOR_GAP':'CONSIDER_PASS';return i;
 }
 if(blocked&&leader&&!car.changing){i.targetId=leader.id;i.targetGeneration=leader.generation;i.targetLane=car.lane%3>0?car.lane-1:car.lane+1;i.since=now;i.waiting=0;i.abandonReason='none';i.passCompleted=false;i.state='CONSIDER_PASS';}
 else if(!car.changing)i.state=blocked?'FOLLOW':'CRUISE';
 return i;
}
