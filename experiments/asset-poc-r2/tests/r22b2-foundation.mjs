import assert from 'node:assert/strict';
import * as T from '../viewer/vendor/three.module.js';
import {createRoadImproved,macroPhase} from '../road/road-surface-improved.mjs';
import {tilePhaseFromMillimetres} from '../road/road-surface.mjs';
assert.deepEqual(macroPhase(-1000n),[42,70]);assert.deepEqual(macroPhase(3053000n),[0,0]);assert.deepEqual(macroPhase(1000000000000000000n),macroPhase(1000000000000000000n+3053000n));assert.equal(tilePhaseFromMillimetres(-500n),.75);assert.throws(()=>macroPhase(1));
const tex=()=>new T.Texture();let m=createRoadImproved(T,{color:tex(),normal:tex(),roughness:tex(),widthMetres:12,lengthMetres:250,anisotropy:1,startMm:-1000n});let s={vertexShader:T.ShaderLib.standard.vertexShader,fragmentShader:T.ShaderLib.standard.fragmentShader,uniforms:{}};m.onBeforeCompile(s);assert.match(s.fragmentShader,/roadRough1/);assert.match(s.fragmentShader,/roadN1/);assert.match(s.vertexShader,/roadLocalMetres/);assert.equal(s.uniforms.roadPhase43.value,42);assert.equal(m.metalness,0);assert.throws(()=>m.onBeforeCompile({vertexShader:'',fragmentShader:'',uniforms:{}}));console.log('R2.2b-2 foundation passed, no GPU compilation performed');
