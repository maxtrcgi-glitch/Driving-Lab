import * as THREE from 'three';
import { GLTFLoader } from './vendor/GLTFLoader.js';
import { instanceRepeatedMeshes } from './instance.js';

const status = document.getElementById('status');
const stats = document.getElementById('stats');
const root = document.getElementById('view');
const start = performance.now();
const abort = AbortSignal.timeout(30000);
const diagnostics = { camera: 'driver', webglErrors: [] };
window.diagnostics = diagnostics;

async function request(path) {
  const response = await fetch(path, { signal: abort });
  if (!response.ok) throw new Error(`${path} returned HTTP ${response.status}`);
  return response;
}

async function loadAsset() {
  const response = await request('./highway.glb');
  const total = Number(response.headers.get('content-length'));
  const reader = response.body.getReader();
  const chunks = [];
  let received = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.byteLength;
    status.textContent = total ? `Loading scene · ${Math.round(100 * received / total)}%`
      : `Loading scene · ${(received / 1e6).toFixed(1)} MB`;
  }
  diagnostics.assetBytes = received;
  status.textContent = 'Preparing the first frame…';
  return new GLTFLoader().parseAsync(await new Blob(chunks).arrayBuffer(), './');
}

document.getElementById('copy').onclick = async () => {
  const value = JSON.stringify(diagnostics, null, 2);
  try { await navigator.clipboard.writeText(value); status.textContent = 'Diagnostics copied.'; }
  catch {
    let field = document.querySelector('textarea');
    if (!field) {
      field = document.createElement('textarea');
      field.setAttribute('aria-label', 'Diagnostics');
      document.querySelector('main').append(field);
    }
    field.value = value;
    field.select();
  }
};

try {
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.AgXToneMapping;
  renderer.toneMappingExposure = 1.39;
  renderer.domElement.addEventListener('webglcontextlost', event => {
    event.preventDefault();
    window.fail('WebGL context lost. Reload to retry.');
  });
  root.append(renderer.domElement);
  const [data, gltf] = await Promise.all([request('./scene.json').then(r => r.json()), loadAsset()]);
  if (window.loadFailure) throw new Error(window.loadFailure);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xaabacb);
  diagnostics.instancedDrawsAvoided = instanceRepeatedMeshes(gltf.scene);
  scene.add(gltf.scene);
  scene.add(new THREE.HemisphereLight(0xe8f1ff, 0xb1b2b2, 2.55));
  const sun = new THREE.DirectionalLight(0xfffaf3, 2.15);
  sun.position.set(-45, 60, 20);
  scene.add(sun);
  const conversion = new THREE.Matrix4().set(1,0,0,0, 0,0,1,0, 0,-1,0,0, 0,0,0,1);
  const camera = new THREE.PerspectiveCamera(35, 16/9, .05, 750);
  camera.matrixAutoUpdate = false;
  let previous, frames = 0, elapsed = 0, cpuTime = 0;
  function changeCamera(name) {
    const source = data.cameras[name];
    camera.fov = source.fov;
    camera.updateProjectionMatrix();
    camera.matrix.copy(conversion).multiply(new THREE.Matrix4().set(...source.matrix.flat()));
    camera.updateMatrixWorld(true);
    diagnostics.camera = name;
    document.querySelectorAll('[data-camera]').forEach(button => {
      button.setAttribute('aria-pressed', button.dataset.camera === name);
    });
  }
  function render(now) {
    if (window.loadFailure) return;
    const before = performance.now();
    renderer.render(scene, camera);
    cpuTime += performance.now() - before;
    frames++;
    if (previous !== undefined) elapsed += now - previous;
    previous = now;
    if (elapsed >= 600 || !window.ready) {
      diagnostics.drawCalls = renderer.info.render.calls;
      diagnostics.triangles = renderer.info.render.triangles;
      diagnostics.fps = elapsed ? Math.round(frames * 1000 / elapsed) : null;
      diagnostics.frameIntervalMs = elapsed ? +(elapsed / frames).toFixed(1) : null;
      diagnostics.cpuSubmitMs = +(cpuTime / frames).toFixed(2);
      const error = renderer.getContext().getError();
      if (error) diagnostics.webglErrors.push(error);
      stats.textContent = `${diagnostics.drawCalls} draws · ${diagnostics.triangles.toLocaleString()} triangles · ${diagnostics.fps ?? '—'} FPS · ${diagnostics.frameIntervalMs ?? '—'} ms`;
      frames = elapsed = cpuTime = 0;
    }
    window.ready = true;
    if (!new URLSearchParams(location.search).has('capture')) requestAnimationFrame(render);
  }
  function resize() {
    const width = Math.min(1280, Math.round(root.clientWidth * Math.min(devicePixelRatio, 1.5)));
    renderer.setSize(width, Math.round(width * 9/16), false);
  }
  window.setCamera = name => { changeCamera(name); render(performance.now()); };
  document.querySelectorAll('[data-camera]').forEach(button => {
    button.onclick = () => changeCamera(button.dataset.camera);
  });
  addEventListener('resize', resize);
  resize();
  changeCamera('driver');
  const textures = new Set();
  gltf.scene.traverse(o => {
    if (o.isMesh) for (const m of [o.material].flat()) {
      for (const v of Object.values(m)) if (v?.isTexture) textures.add(v);
    }
  });
  diagnostics.textureMiB = +([...textures].reduce((bytes,t) => {
    const im = t.image;
    return bytes + (im?.width ?? 0) * (im?.height ?? 0) * 16 / 3;
  }, 0)/1048576).toFixed(2);
  diagnostics.textureCount = textures.size;
  diagnostics.loadMs = Math.round(performance.now() - start);
  status.textContent = 'Scene loaded.';
  clearTimeout(window.deadline);
  requestAnimationFrame(render);
} catch (error) {
  clearTimeout(window.deadline);
  window.fail(error.message);
}
