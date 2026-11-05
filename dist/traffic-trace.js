// Read-only 5Hz traffic diagnostics: six minutes, fixed storage, no physics writes.
export const trafficColumns=['t','active','sameDirection','oncoming','ahead100','ahead250','ahead500','ahead1000','nearestAheadM','relativeSpeedMps','nextPotentialPassS','spawned','retired','spawnFailures','spawnRateHz','retireRateHz'];
export class TrafficTrace{
 constructor(capacity=1800){this.capacity=capacity;this.data=new Float64Array(capacity*trafficColumns.length);this.reset();}
 reset(){this.count=0;this.cursor=0;this.next=0;this.previousTime=0;this.previousSpawn=0;this.previousRetire=0;}
 capture(h,vehicle){const t=h.clock;if(t<this.next)return false;this.next=t+.2-1e-9;const p=h.project(vehicle.x,vehicle.z),g=h.gradient(p.s),v=(vehicle.vx*g+vehicle.vz)/Math.hypot(1,g);let same=0,oncoming=0,n100=0,n250=0,n500=0,n1000=0,nearest=Infinity,relative=0;
  for(const c of h.cars){if(c.dir<0){oncoming++;continue;}same++;const d=c.s-p.s;if(d<=0)continue;if(d<=100)n100++;if(d<=250)n250++;if(d<=500)n500++;if(d<=1000)n1000++;if(d<nearest){nearest=d;relative=v/Math.hypot(1,g)-c.speed/Math.hypot(1,h.gradient(c.s));}}
  const a=this.data,o=this.cursor*trafficColumns.length,elapsed=t-this.previousTime; a[o]=t;a[o+1]=h.cars.length;a[o+2]=same;a[o+3]=oncoming;a[o+4]=n100;a[o+5]=n250;a[o+6]=n500;a[o+7]=n1000;a[o+8]=nearest;a[o+9]=relative;a[o+10]=relative>0?nearest/relative:Infinity;a[o+11]=h.spawned;a[o+12]=h.retired;a[o+13]=h.spawnFailures;a[o+14]=elapsed>0?(h.spawned-this.previousSpawn)/elapsed:0;a[o+15]=elapsed>0?(h.retired-this.previousRetire)/elapsed:0;
  this.previousTime=t;this.previousSpawn=h.spawned;this.previousRetire=h.retired;this.count=Math.min(this.capacity,this.count+1);this.cursor=(this.cursor+1)%this.capacity;return true;
 }
 export(){const rows=[];for(let i=0;i<this.count;i++){const at=((this.cursor-this.count+i+this.capacity)%this.capacity)*trafficColumns.length;rows.push(Array.from(this.data.subarray(at,at+trafficColumns.length),n=>Number.isFinite(n)?Number(n.toFixed(3)):null));}return {schema:'DrivingLabTraffic/1',rateHz:5,capacity:this.capacity,columns:trafficColumns,rows,potentialPass:'Instant relative-speed extrapolation in road-s; not a predicted safe overtake',visibility:'Counts in road-s, not rendered or occlusion-tested vehicles'};}
}
