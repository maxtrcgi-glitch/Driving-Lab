import assert from 'node:assert/strict';
import {SteeringTrace} from '../dist/steering-trace.js';
import {Vehicle,DT} from '../dist/physics.js';
import {SteeringResponse} from '../dist/controls.js';
import {vehicleSnapshot} from './full-state.mjs';
const t=new SteeringTrace(),v=new Vehicle(),c=new SteeringResponse(),saved=vehicleSnapshot(v);
for(let i=0;i<6000;i++)t.capture(v,c,{fraction:.5,receivedTime:10},20,DT);
assert.equal(t.count,1200);assert.equal(t.exportCSV().split('\n').length,1203);assert.deepEqual(vehicleSnapshot(v),saved);assert.ok(t.exportCSV().includes('NOT hardware touch/display latency'));console.log('SteeringTrace60Hz bounded1200 samples, read-only and export passed');
