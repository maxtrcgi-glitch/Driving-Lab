import { InstancedMesh, Matrix4 } from 'three';

export function instanceRepeatedMeshes(scene) {
  scene.updateMatrixWorld(true);
  const groups = new Map();
  scene.traverse(mesh => {
    if (!mesh.isMesh || mesh.isInstancedMesh || mesh.children.length ||
        Array.isArray(mesh.material) || mesh.material.transparent ||
        mesh.matrixWorld.determinant() <= 0) return;
    const key = mesh.geometry.uuid + ':' + mesh.material.uuid;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(mesh);
  });
  const inverse = new Matrix4().copy(scene.matrixWorld).invert();
  let replaced = 0;
  for (const meshes of groups.values()) {
    if (meshes.length < 2) continue;
    const first = meshes[0];
    const batch = new InstancedMesh(first.geometry, first.material, meshes.length);
    batch.name = first.name + ' instances';
    meshes.forEach((mesh, index) => {
      batch.setMatrixAt(index, new Matrix4().multiplyMatrices(inverse, mesh.matrixWorld));
      mesh.removeFromParent();
    });
    batch.computeBoundingSphere();
    scene.add(batch);
    replaced += meshes.length - 1;
  }
  return replaced;
}
