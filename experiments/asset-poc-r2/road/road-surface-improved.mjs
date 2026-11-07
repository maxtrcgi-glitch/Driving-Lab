import {createRoadBaseline} from './road-surface.mjs';

// Repeats only after 43 * 71 metres; phases stay bounded for large positions.
// The period is a prototype choice, not a claim of measured road structure.
export function macroPhase(startMm) {
  if (typeof startMm !== 'bigint') throw new TypeError('startMm must be BigInt');
  const remainder = (p) => Number(((startMm % p) + p) % p) / 1000;
  return [remainder(43000n), remainder(71000n)];
}
function replaceOne(source, needle, replacement) {
  const first = source.indexOf(needle);
  if (first < 0 || source.indexOf(needle, first + needle.length) >= 0) throw new Error(`Unsupported Three.js shader: expected exactly one ${needle}`);
  return source.replace(needle, replacement);
}

/** Experimental B. Meshes MUST supply roadLocalMetres: 2D road (cross, along)
 * per vertex, relative to chunk origin. For curved roads use continuous road
 * coordinates and matching tangent frames. Set startMm from stable road chainage.
 * Each independently phased chunk needs its own material/texture transforms.
 * No use in production until validated visually and on target devices. */
export function createRoadImproved(THREE, options) {
  const { startMm = 0n, ...base } = options;
  const material = createRoadBaseline(THREE, base);
  const [phase43, phase71] = macroPhase(startMm);
  material.onBeforeCompile = (shader) => {
    shader.uniforms.roadPhase43 = { value: phase43 };
    shader.uniforms.roadPhase71 = { value: phase71 };
    shader.vertexShader = replaceOne(shader.vertexShader, '#include <common>', `#include <common>\nattribute vec2 roadLocalMetres;\nvarying vec2 vRoadLocal;`);
    shader.vertexShader = replaceOne(shader.vertexShader, '#include <begin_vertex>', `#include <begin_vertex>\nvRoadLocal = roadLocalMetres;`);
    shader.fragmentShader = replaceOne(shader.fragmentShader, '#include <common>', `#include <common>
      varying vec2 vRoadLocal;
      uniform float roadPhase43;
      uniform float roadPhase71;
      float roadMix() {
        float a = sin(6.28318530718 * ((vRoadLocal.y + roadPhase43) / 43.0 + vRoadLocal.x / 31.0));
        float b = sin(6.28318530718 * ((vRoadLocal.y + roadPhase71) / 71.0 - vRoadLocal.x / 47.0));
        return 0.5 + 0.25 * a * b;
      }
    `);
    shader.fragmentShader = replaceOne(shader.fragmentShader, '#include <map_fragment>', `
      #ifdef USE_MAP
        float roadWeight = roadMix();
        vec4 roadColor0 = texture2D(map, vMapUv);
        vec4 roadColor1 = texture2D(map, vMapUv + vec2(0.371, 0.613));
        diffuseColor *= mix(roadColor0, roadColor1, roadWeight);
        diffuseColor.rgb *= 0.98 + 0.04 * roadWeight;
      #endif`);
    shader.fragmentShader = replaceOne(shader.fragmentShader, '#include <roughnessmap_fragment>', `
      float roughnessFactor = roughness;
      #ifdef USE_ROUGHNESSMAP
        float roadRough0 = texture2D(roughnessMap, vRoughnessMapUv).g;
        float roadRough1 = texture2D(roughnessMap, vRoughnessMapUv + vec2(0.371, 0.613)).g;
        roughnessFactor *= mix(roadRough0, roadRough1, roadMix());
      #endif`);
    shader.fragmentShader = replaceOne(shader.fragmentShader, '#include <normal_fragment_maps>', `
      #ifdef USE_NORMALMAP_TANGENTSPACE
        vec3 roadN0 = texture2D(normalMap, vNormalMapUv).xyz * 2.0 - 1.0;
        vec3 roadN1 = texture2D(normalMap, vNormalMapUv + vec2(0.371, 0.613)).xyz * 2.0 - 1.0;
        vec3 mapN = normalize(mix(roadN0, roadN1, roadMix()));
        mapN.xy *= normalScale;
        normal = normalize(tbn * mapN);
      #elif defined(USE_NORMALMAP_OBJECTSPACE) || defined(USE_BUMPMAP)
        #error road_material_requires_tangent_space_normal_map
      #endif`);
  };
  material.customProgramCacheKey = () => 'driving-lab-road-b-1';
  return material;
}
