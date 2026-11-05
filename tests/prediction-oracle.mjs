// Independent branch-end/path proxy. Never imports predictor or detector.
export function outcomeLabel(hold,unwind){
 if(hold.contacts!==4||unwind.contacts!==4||hold.damage>.03||unwind.damage>.03)return 'UNKNOWN';
 const better=(a,b)=>Math.abs(b.beta)-Math.abs(a.beta)>=2*Math.PI/180&&Math.abs(b.V)-Math.abs(a.V)>=.5&&Math.abs(a.r)<=Math.abs(b.r)+.1&&Math.abs(a.x)<=Math.abs(b.x)+.5;
 return better(unwind,hold)?'UNWIND':better(hold,unwind)?'HOLD':'AMBIGUOUS';
}
