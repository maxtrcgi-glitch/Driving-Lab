import assert from 'node:assert/strict';
import fs from 'node:fs';
import {points,segments,courseLength,nearest,elevation,terrain,trackFeatures,spawns} from '../dist/course.js';
import {buildWorld} from '../dist/world.js';
assert.ok(courseLength>2000&&courseLength<2200);
assert.ok(segments.every(s=>s.length>0&&s.length<2.1),'Uniform sampling and seamless loop');
// Non-neighboring centerline branches must not overlap the road/runoff.
let clearance=Infinity;
for(let i=0;i<points.length;i+=5)for(let j=i+5;j<points.length;j+=5){const arc=Math.min(Math.abs(segments[i].start-segments[j].start),courseLength-Math.abs(segments[i].start-segments[j].start));if(arc<35)continue;clearance=Math.min(clearance,Math.hypot(points[i].x-points[j].x,points[i].z-points[j].z));}
assert.ok(clearance>18,'No crossing or overlapping branches');
const heights=points.map(p=>elevation(p.x,p.z)),range=Math.max(...heights)-Math.min(...heights);assert.ok(range>8&&range<16,'Useful but moderate elevation range');
let maxGrade=0,positive=0,negative=0;
for(let i=0;i<points.length;i++){const a=segments[i],b=segments[(i+1)%segments.length];maxGrade=Math.max(maxGrade,Math.abs(elevation(a.a.x,a.a.z)-elevation(a.b.x,a.b.z))/a.length);const turn=Math.atan2(a.dx*b.dz-a.dz*b.dx,a.dx*b.dx+a.dz*b.dz);if(turn>.001)positive++;if(turn<-.001)negative++;}
assert.ok(maxGrade<.15);assert.ok(positive>50&&negative>50,'Circuit contains left and right turns');
for(let z=0;z<=285;z+=5){assert.ok(nearest(0,z).distance<.01,'Main braking straight stays straight');assert.equal(elevation(0,z),0,'Main straight stays flat');assert.equal(terrain(0,z).surface,'asphalt');}
assert.equal(terrain(5.32,100).surface,'curb');assert.ok(terrain(5.32,100).height>.04);assert.equal(terrain(6.5,100).surface,'gravel');assert.equal(terrain(10,100).surface,'grass');
for(const point of trackFeatures)assert.ok(nearest(point.x,point.z).distance<30);
for(const spawn of Object.values(spawns))assert.equal(terrain(spawn.x,spawn.z).surface,'asphalt');
const world=buildWorld(),position=world.trackRoad.geometry.attributes.position;
for(let i=0;i<position.count;i+=19)assert.ok(Math.abs(position.getY(i)-terrain(position.getX(i),position.getZ(i)).height-.02)<.00001,'Visible asphalt agrees with physical surface');
for(const file of ['dist/index.html','dist/app.js'])assert.ok(!/[А-Яа-яЁё]/.test(fs.readFileSync(file,'utf8')),'English UI and runtime messages');
console.log(JSON.stringify({lengthM:courseLength,minimumBranchClearanceM:clearance,elevationRangeM:range,maximumGrade:maxGrade,leftSamples:positive,rightSamples:negative}));
