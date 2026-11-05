import assert from 'node:assert/strict';
import {Highway} from '../dist/highway.js';
import {TrafficTrace,trafficColumns} from '../dist/traffic-trace.js';
const h=new Highway(86);h.reset(86,917);const log=new TrafficTrace(12);let writes=0;
for(let i=0;i<600;i++){const p=h.point(i*2,-7.4),v={...p,vx:0,vz:50,speed:50};h.step(1/60,v);const before=JSON.stringify(h.cars);writes+=+log.capture(h,v);assert.equal(JSON.stringify(h.cars),before,'Read-only diagnostics');}
assert.ok(writes>=49&&writes<=51);assert.equal(log.count,12);const e=log.export();assert.equal(e.rows.length,12);assert.equal(e.rows[0].length,trafficColumns.length);assert.ok(e.rows[0][0]<e.rows.at(-1)[0]);assert.equal(h.spawned,h.retired+28);log.reset();assert.equal(log.count,0);assert.equal(log.next,0);
console.log({boundedRows:12,writes,rateHz:5,readOnly:true,counters:true});
