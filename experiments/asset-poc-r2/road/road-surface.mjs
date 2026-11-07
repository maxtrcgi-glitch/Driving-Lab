/** R2.2b-1 baseline foundation. Inputs and UVs are owned by the caller. */
export const ROAD_TILE_METRES = 2;

/** Chunk start is an integer millimetre BigInt, never a large GPU float.
 * Returned phase is stable for positive and negative chunk offsets. */
export function tilePhaseFromMillimetres(chunkStartMm, tileMm = 2000n) {
  if (typeof chunkStartMm !== 'bigint' || typeof tileMm !== 'bigint' || tileMm <= 0n) throw new TypeError('Expected integer millimetres and positive tile size as BigInt');
  return Number(((chunkStartMm % tileMm) + tileMm) % tileMm) / Number(tileMm);
}

/** Baseline comparable to R2.2a. One material per UV/repeat/phase configuration.
 * Textures are mutated: do not share these instances between differently configured materials. */
export function createRoadBaseline(THREE, { color, normal, roughness, widthMetres, lengthMetres, phaseU = 0, phaseV = 0, anisotropy = 1 }) {
  if (![widthMetres, lengthMetres, anisotropy, phaseU, phaseV].every(Number.isFinite) || widthMetres <= 0 || lengthMetres <= 0 || anisotropy < 1) throw new RangeError('Invalid road dimensions, phase or anisotropy');
  if (!color || !normal || !roughness || new Set([color,normal,roughness]).size !== 3) throw new TypeError('Provide three distinct texture instances');
  for (const map of [color, normal, roughness]) {
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    map.repeat.set(widthMetres / ROAD_TILE_METRES, lengthMetres / ROAD_TILE_METRES);
    map.offset.set(phaseU, phaseV);
    map.magFilter = THREE.LinearFilter;
    map.minFilter = THREE.LinearMipmapLinearFilter;
    map.generateMipmaps = true;
    map.anisotropy = anisotropy;
    map.needsUpdate = true;
  }
  color.colorSpace = THREE.SRGBColorSpace;
  normal.colorSpace = roughness.colorSpace = THREE.NoColorSpace;
  return new THREE.MeshStandardMaterial({ map: color, normalMap: normal, roughnessMap: roughness, roughness: 1, metalness: 0 });
}
