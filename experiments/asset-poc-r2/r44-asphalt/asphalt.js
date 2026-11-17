import { MeshStandardMaterial } from 'three';

const asphaltFunctions = `
uniform sampler2D scanColor;
uniform sampler2D scanData;
varying vec2 vRoad;
struct Asphalt {
  vec3 color;
  vec3 tangentNormal;
  float roughness;
};

mat2 quarterTurn(uint q) {
  if (q == 1u) return mat2(0., 1., -1., 0.);
  if (q == 2u) return mat2(-1., 0., 0., -1.);
  if (q == 3u) return mat2(0., -1., 1., 0.);
  return mat2(1.);
}

uint cellHash(uvec2 p, uint salt) {
  uint h = p.x * 0x9e3779b1u ^ p.y * 0x85ebca77u ^ salt;
  h ^= h >> 16u;
  h *= 0x7feb352du;
  h ^= h >> 15u;
  h *= 0x846ca68bu;
  return h ^ (h >> 16u);
}

vec3 unpackNormal(vec2 xy) {
  xy = xy * 2. - 1.;
  return normalize(vec3(xy, sqrt(max(1. - dot(xy, xy), 0.))));
}

Asphalt sampleScan(vec2 uv, vec2 dx, vec2 dy) {
  vec3 color = textureGrad(scanColor, uv, dx, dy).rgb;
  vec3 packedData = textureGrad(scanData, uv, dx, dy).rgb;
  return Asphalt(color, unpackNormal(packedData.rg), packedData.b);
}

Asphalt sampleNeighbor(vec2 id, vec2 uv, vec2 dx, vec2 dy) {
  uvec2 key = uvec2(ivec2(id));
  uint h = cellHash(key, 0u);
  vec2 offset = vec2(float(h & 65535u), float(h >> 16u)) / 65536.;
  mat2 turn = quarterTurn(cellHash(key, 0x632be5abu) & 3u);
  // Derivatives must rotate with the UV. Differentiating the per-cell hash
  // introduces outlier mip levels, visible seams and motion artifacts.
  Asphalt p = sampleScan(turn * uv + offset, turn * dx, turn * dy);
  p.tangentNormal.xy = transpose(turn) * p.tangentNormal.xy;
  return p;
}

Asphalt asphalt() {
  vec2 uv = vRoad * .25;
  vec2 dx = dFdx(uv);
  vec2 dy = dFdy(uv);
#ifdef STOCHASTIC_ASPHALT
  const mat2 rotateLattice = mat2(.95233357, .30505864, -.30505864, .95233357);
  vec2 p = rotateLattice * vRoad;
  vec2 lattice = vec2(p.x - p.y * .5773502692, p.y * 1.154700538) / 6.1;
  vec2 cell = floor(lattice);
  vec2 f = fract(lattice);
  float sum = f.x + f.y;
  float upper = step(1., sum);
  vec3 w = max(vec3(abs(1. - sum), f + upper * (1. - sum)), 0.);
  w = w * w * w;
  w /= dot(w, vec3(1.));
  Asphalt a = sampleNeighbor(cell + upper, uv, dx, dy);
  Asphalt b = sampleNeighbor(cell + vec2(1., 0.), uv, dx, dy);
  Asphalt c = sampleNeighbor(cell + vec2(0., 1.), uv, dx, dy);
  return Asphalt(a.color*w.x + b.color*w.y + c.color*w.z,
    normalize(a.tangentNormal*w.x + b.tangentNormal*w.y + c.tangentNormal*w.z),
    dot(vec3(a.roughness, b.roughness, c.roughness), w));
#else
  return sampleScan(uv, dx, dy);
#endif
}

mat3 asphaltFrame(vec3 p, vec3 n, vec2 uv) {
  vec3 px = dFdx(p), py = dFdy(p);
  vec2 tx = dFdx(uv), ty = dFdy(uv);
  float handedness = sign(tx.x * ty.y - tx.y * ty.x);
  vec3 tangent = (px * ty.y - py * tx.y) * handedness;
  tangent = normalize(tangent - n * dot(n, tangent));
  vec3 bitangent = py * tx.x - px * ty.x;
  vec3 b = cross(n, tangent);
  return mat3(tangent, b * sign(dot(b, bitangent) * handedness), n);
}
`;

function inject(source, key, replacement) {
  if (!source.includes(key)) throw new Error(`Unsupported Three.js shader chunk: ${key}`);
  return source.replace(key, replacement);
}

export function createAsphalt(maps, stochastic) {
  const material = new MeshStandardMaterial({ roughness: 1, metalness: 0 });
  material.name = stochastic ? 'Stochastic R4.3d' : 'Tiled control';
  material.customProgramCacheKey = () => stochastic ? 'r44-stochastic' : 'r44-tiled';
  material.onBeforeCompile = shader => {
    shader.uniforms.scanColor = { value: maps.scanColor };
    shader.uniforms.scanData = { value: maps.scanData };
    shader.vertexShader = inject(shader.vertexShader, '#include <common>',
      '#include <common>\nvarying vec2 vRoad;');
    // Blender glTF exports V as 1 - V. Restore native UV orientation and units.
    shader.vertexShader = inject(shader.vertexShader, '#include <uv_vertex>',
      '#include <uv_vertex>\nvRoad = vec2(uv.x, 1. - uv.y) * 2.15;');
    shader.fragmentShader = inject(shader.fragmentShader, '#include <common>',
      '#include <common>\n' + (stochastic ? '#define STOCHASTIC_ASPHALT\n' : '') + asphaltFunctions);
    shader.fragmentShader = inject(shader.fragmentShader, '#include <map_fragment>',
      'Asphalt paving = asphalt(); diffuseColor.rgb *= paving.color;');
    shader.fragmentShader = inject(shader.fragmentShader, '#include <roughnessmap_fragment>',
      'float roughnessFactor = paving.roughness;');
    shader.fragmentShader = inject(shader.fragmentShader, '#include <normal_fragment_maps>',
      'normal = normalize(asphaltFrame(-vViewPosition, normal, vRoad) * paving.tangentNormal);');
  };
  return material;
}
