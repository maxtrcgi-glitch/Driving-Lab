import * as THREE from 'three';
import { GLTFLoader } from './vendor/GLTFLoader.js';
import { createAsphalt } from './asphalt.js';

const get = id => document.getElementById(id);
const canvas = get('road');
const modeButtons = [...document.querySelectorAll('[data-mode]')];
const cameraSelect = get('camera');
const motionButton = get('motion');
const benchmarkButton = get('benchmark');
const copyButton = get('copy');
const retryButton = get('retry');
const controls = [...modeButtons, cameraSelect, motionButton, benchmarkButton];
const diagnostics = {
  material: 'A',
  camera: 'driver',
  shader: { A: 'pending', B: 'pending' },
  shaderErrors: [],
  webglErrors: [],
  frameTime: null,
  benchmark: null,
};
window.r44Diagnostics = diagnostics;

let renderer, gl, scene, camera, road, cameras, materials, gltf, maps;
let running = false;
let activeCompile = null;
let previousFrame = null;
let liveSamples = [];
let measurement = null;
let dollyStart = null;
let errorCheck = 0;
let benchmarkCancelled = false;
let animationHandle;
let contextLost = false;
const conversion = new THREE.Matrix4().set(1, 0, 0, 0, 0, 0, 1, 0, 0, -1, 0, 0, 0, 0, 0, 1);
const baseCamera = new THREE.Matrix4();
const dollyOffset = new THREE.Matrix4();

function showStatus(message, retry = false) {
  get('loading').hidden = false;
  get('status').textContent = message;
  get('progress').hidden = retry;
  retryButton.hidden = !retry;
}

function shaderError(context, program, vertex, fragment) {
  diagnostics.shaderErrors.push({
    mode: activeCompile ?? diagnostics.material,
    program: context.getProgramInfoLog(program),
    vertex: context.getShaderInfoLog(vertex),
    fragment: context.getShaderInfoLog(fragment),
  });
  diagnostics.shader[activeCompile ?? diagnostics.material] = 'failed';
  showRenderStatus();
}

function collectGLErrors() {
  if (!gl || contextLost) return;
  for (let code = gl.getError(); code !== gl.NO_ERROR; code = gl.getError()) {
    const name = '0x' + code.toString(16);
    if (!diagnostics.webglErrors.includes(name)) diagnostics.webglErrors.push(name);
    if (code === gl.CONTEXT_LOST_WEBGL) break;
  }
}

function showRenderStatus() {
  const { shader, webglErrors } = diagnostics;
  get('render-status').textContent =
    `Shader A ${shader.A} · B ${shader.B} · WebGL errors ${webglErrors.length}`;
}

function setControls(enabled) {
  for (const control of controls) control.disabled = !enabled;
}

async function loadAssets() {
  const abort = new AbortController();
  const manifestResponse = await fetch('./asset-manifest.json', { cache: 'no-cache' });
  if (!manifestResponse.ok) throw new Error(`Asset manifest HTTP ${manifestResponse.status}`);
  const manifest = await manifestResponse.json();
  diagnostics.assets = manifest;
  const assets = Object.entries(manifest);
  const total = assets.reduce((sum, [, asset]) => sum + asset.bytes, 0);
  let loaded = 0;
  let completed = 0;
  function progress() {
    const meter = get('progress');
    meter.max = total;
    meter.value = loaded;
    get('status').textContent =
      `Downloading ${(loaded / 1048576).toFixed(1)} / ${(total / 1048576).toFixed(1)} MiB · ${completed}/${assets.length} files`;
  }
  progress();
  let inactivity;
  function resetInactivity() {
    clearTimeout(inactivity);
    inactivity = setTimeout(() => abort.abort(new Error('Asset transfer stalled for 25 seconds')), 25000);
  }
  resetInactivity();
  try {
    const entries = await Promise.all(assets.map(async ([name, {bytes, sha256}]) => {
      const response = await fetch(`./assets/${name}?v=${sha256.slice(0, 16)}`, {signal: abort.signal});
      if (!response.ok) throw new Error(`${name} HTTP ${response.status}`);
      const reader = response.body.getReader();
      const buffer = new Uint8Array(bytes);
      let offset = 0;
      while (true) {
        const {value, done} = await reader.read();
        if (done) break;
        resetInactivity();
        buffer.set(value, offset);
        offset += value.length;
        loaded += value.length;
        progress();
      }
      if (offset !== bytes) throw new Error(`${name} arrived incomplete`);
      if (crypto.subtle) {
        const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', buffer));
        const hex = Array.from(digest, n => n.toString(16).padStart(2, '0')).join('');
        if (hex !== sha256) throw new Error(`${name} failed SHA-256 verification`);
      }
      completed++;
      progress();
      return [name, buffer];
    }));
    return Object.fromEntries(entries);
  } catch (error) {
    abort.abort(error);
    throw abort.signal.reason;
  } finally {
    clearTimeout(inactivity);
  }
}

async function decodeWebP(bytes) {
  const url = URL.createObjectURL(new Blob([bytes], {type: 'image/webp'}));
  const image = new Image();
  try {
    image.src = url;
    await image.decode();
    return image;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function scanTexture(image, colorSpace) {
  const texture = new THREE.Texture(image);
  texture.colorSpace = colorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  texture.needsUpdate = true;
  return texture;
}

async function decodeMaps(assets) {
  const [color, upper, lower] = await Promise.all(
    ['scan-color.webp', 'scan-data-0.webp', 'scan-data-1.webp'].map(name => decodeWebP(assets[name])),
  );
  if (color.width !== 2048 || color.height !== 2048 || upper.width !== color.width ||
      lower.width !== color.width || upper.height !== 1024 || lower.height !== 1024) {
    throw new Error('Unexpected Asphalt 04 map dimensions');
  }
  const data = document.createElement('canvas');
  data.width = color.width;
  data.height = color.height;
  const context = data.getContext('2d', { alpha: false, colorSpace: 'srgb' });
  context.drawImage(upper, 0, 0);
  context.drawImage(lower, 0, upper.height);
  diagnostics.maps = { resolution: [color.width, color.height], anisotropy: Math.min(8, renderer.capabilities.getMaxAnisotropy()) };
  return { scanColor: scanTexture(color, THREE.SRGBColorSpace), scanData: scanTexture(data, THREE.NoColorSpace) };
}

function resetSamples() {
  previousFrame = null;
  liveSamples = [];
}

function setCamera(name) {
  const source = cameras[name];
  diagnostics.camera = name;
  cameraSelect.value = name;
  camera.fov = source.fov;
  camera.updateProjectionMatrix();
  baseCamera.copy(conversion).multiply(new THREE.Matrix4().set(...source.matrix.flat()));
  camera.matrix.copy(baseCamera);
  camera.updateMatrixWorld(true);
  resetSamples();
}

function setMode(name) {
  road.material = materials[name];
  diagnostics.material = name;
  for (const button of modeButtons) button.setAttribute('aria-pressed', String(button.dataset.mode === name));
  resetSamples();
}

function resize() {
  if (!renderer) return;
  // Render at a fixed DPR of one. Both materials use the same pixels per trial.
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  if (!width || !height || (canvas.width === width && canvas.height === height)) return;
  renderer.setSize(width, height, false);
  diagnostics.drawingBuffer = [canvas.width, canvas.height];
  if (measurement) benchmarkCancelled = true;
  resetSamples();
}

function summarize(samples) {
  const sorted = [...samples].sort((a, b) => a - b);
  const mean = samples.reduce((sum, sample) => sum + sample, 0) / samples.length;
  return {
    samples: samples.length,
    meanMs: mean,
    medianMs: sorted[Math.floor(sorted.length / 2)],
    p95Ms: sorted[Math.ceil(sorted.length * .95) - 1],
    fps: 1000 / mean,
  };
}

function render() {
  renderer.render(scene, camera);
  const { calls, triangles } = renderer.info.render;
  diagnostics.drawCalls = calls;
  diagnostics.triangles = triangles;
}

function tick(now) {
  if (!running) return;
  if (!document.hidden) {
    if (dollyStart !== null) {
      const displacement = 1.5 * Math.sin((now - dollyStart) / 1300);
      camera.matrix.copy(baseCamera).multiply(dollyOffset.makeTranslation(0, 0, displacement));
      camera.updateMatrixWorld(true);
    }
    const start = performance.now();
    render();
    const submitMs = performance.now() - start;
    if (previousFrame !== null) {
      const interval = now - previousFrame;
      liveSamples.push(interval);
      if (measurement && now >= measurement.after) {
        measurement.samples.push(interval);
        measurement.submit.push(submitMs);
      }
    }
    previousFrame = now;
    if (now - errorCheck >= 1000 && liveSamples.length) {
      collectGLErrors();
      showRenderStatus();
      const summary = diagnostics.frameTime = summarize(liveSamples);
      get('stats').textContent =
        `${summary.fps.toFixed(1)} FPS · median ${summary.medianMs.toFixed(1)} ms · p95 ${summary.p95Ms.toFixed(1)} ms · ${diagnostics.drawCalls} draws · ${diagnostics.triangles.toLocaleString()} triangles`;
      liveSamples = [];
      errorCheck = now;
    }
  }
  animationHandle = requestAnimationFrame(tick);
}

function sampleMode(mode, warmup = 1500, duration = 4500) {
  setMode(mode);
  const after = performance.now() + warmup;
  const sample = measurement = { after, samples: [], submit: [] };
  return new Promise((resolve, reject) => setTimeout(() => {
    measurement = null;
    if (benchmarkCancelled || contextLost || sample.samples.length < 5) {
      reject(new Error('Timing interrupted. Keep the tab visible and the viewport steady.'));
      return;
    }
    const submit = summarize(sample.submit);
    resolve({ ...summarize(sample.samples), submitMedianMs: submit.medianMs, submitP95Ms: submit.p95Ms });
  }, warmup + duration));
}

async function benchmark() {
  const original = diagnostics.material;
  const test = get('benchmark-result');
  const passes = [];
  diagnostics.benchmark = null;
  benchmarkCancelled = false;
  setControls(false);
  dollyStart = null;
  motionButton.setAttribute('aria-pressed', 'false');
  setCamera(diagnostics.camera);
  try {
    for (const mode of ['A', 'B', 'B', 'A']) {
      test.textContent = `Sampling ${mode} · pass ${passes.length + 1}/4`;
      passes.push({ mode, ...await sampleMode(mode) });
    }
    diagnostics.benchmark = { camera: diagnostics.camera, drawingBuffer: diagnostics.drawingBuffer, passes };
    test.textContent = passes.map(p =>
      `${p.mode}  ${p.fps.toFixed(1)} FPS · median ${p.medianMs.toFixed(2)} ms · p95 ${p.p95Ms.toFixed(2)} ms · n=${p.samples}`,
    ).join('\n');
  } catch (error) {
    test.textContent = error.message;
  } finally {
    if (!contextLost) {
      setMode(original);
      setControls(true);
    }
  }
}

function dispose() {
  running = false;
  cancelAnimationFrame(animationHandle);
  if (gltf) gltf.scene.traverse(obj => {
    if (!obj.isMesh) return;
    obj.geometry.dispose();
    obj.material.dispose();
  });
  Object.values(materials ?? {}).forEach(material => material.dispose());
  Object.values(maps ?? {}).forEach(map => map.dispose());
  renderer?.dispose();
  renderer = gl = gltf = maps = materials = null;
}

async function start() {
  setControls(false);
  dispose();
  showStatus('Requesting scene assets…');
  get('progress').removeAttribute('value');
  diagnostics.shader = { A: 'pending', B: 'pending' };
  diagnostics.shaderErrors = [];
  diagnostics.webglErrors = [];
  diagnostics.failure = null;
  diagnostics.benchmark = null;
  diagnostics.frameTime = null;
  diagnostics.drawingBuffer = [canvas.width, canvas.height];
  contextLost = false;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.AgXToneMapping;
    renderer.toneMappingExposure = 1;
    renderer.debug.onShaderError = shaderError;
    gl = renderer.getContext();
    const debug = gl.getExtension('WEBGL_debug_renderer_info');
    diagnostics.webgl = gl.getParameter(gl.VERSION);
    diagnostics.renderer = debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
    diagnostics.userAgent = navigator.userAgent;
    copyButton.disabled = false;
    const assets = await loadAssets();
    showStatus('Decoding pavement and 2K maps…');
    const config = JSON.parse(new TextDecoder().decode(assets['scene.json']));
    cameras = config.cameras;
    maps = await decodeMaps(assets);
    gltf = await new GLTFLoader().parseAsync(assets['road.glb'].buffer, './assets/');
    road = gltf.scene.getObjectByName('Asphalt');
    const paint = gltf.scene.getObjectByName('Lane_markings');
    if (!road?.isMesh || !paint?.isMesh || !road.geometry.hasAttribute('uv')) {
      throw new Error('The Blender pavement, station UVs or lane-marking mesh is missing');
    }
    road.material.dispose();
    paint.material.dispose();
    paint.material = new THREE.MeshStandardMaterial({ color: 0xd9d7cd, roughness: .76 });
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x9fafbc);
    scene.add(gltf.scene, new THREE.HemisphereLight(0xe8f1ff, 0xb1b2b2, 1.25));
    const sun = new THREE.DirectionalLight(new THREE.Color().fromArray(config.sunColor), config.sunEnergy);
    sun.position.fromArray(config.sunDirection).applyMatrix4(conversion);
    scene.add(sun);
    materials = { A: createAsphalt(maps, false), B: createAsphalt(maps, true) };
    camera = new THREE.PerspectiveCamera(35, 16 / 9, .05, 500);
    camera.matrixAutoUpdate = false;
    setCamera('driver');
    resize();
    showStatus('Compiling both WebGL2 materials…');
    for (const name of ['A', 'B']) {
      setMode(name);
      activeCompile = name;
      await renderer.compileAsync(scene, camera);
      render();
      collectGLErrors();
      if (diagnostics.shader[name] !== 'failed') diagnostics.shader[name] = 'ready';
    }
    activeCompile = null;
    if (diagnostics.shaderErrors.length || diagnostics.webglErrors.length || !diagnostics.triangles) {
      throw new Error('WebGL validation failed. See Copy Diagnostics.');
    }
    setMode('A');
    get('loading').hidden = true;
    showRenderStatus();
    setControls(true);
    running = true;
    animationHandle = requestAnimationFrame(tick);
  } catch (error) {
    activeCompile = null;
    diagnostics.failure = error.message;
    collectGLErrors();
    showRenderStatus();
    showStatus(diagnostics.failure, true);
    copyButton.disabled = false;
    dispose();
  }
}

retryButton.onclick = () => contextLost ? location.reload() : start();
cameraSelect.onchange = () => setCamera(cameraSelect.value);
modeButtons.forEach(button => button.onclick = () => setMode(button.dataset.mode));
motionButton.onclick = () => {
  dollyStart = dollyStart === null ? performance.now() : null;
  motionButton.setAttribute('aria-pressed', String(dollyStart !== null));
  if (dollyStart === null) setCamera(diagnostics.camera);
};
benchmarkButton.onclick = benchmark;
copyButton.onclick = async () => {
  const output = get('diagnostics-output');
  output.value = JSON.stringify(diagnostics, null, 2);
  try {
    await navigator.clipboard.writeText(output.value);
    get('feedback').textContent = 'Diagnostics copied.';
  } catch {
    output.hidden = false;
    output.focus();
    output.select();
    get('feedback').textContent = 'Select and copy the diagnostics below.';
  }
};
canvas.addEventListener('webglcontextlost', () => {
  contextLost = true;
  diagnostics.webglErrors.push('CONTEXT_LOST_WEBGL');
  diagnostics.failure = 'WebGL context lost.';
  running = false;
  setControls(false);
  showStatus(diagnostics.failure, true);
  showRenderStatus();
});
new ResizeObserver(resize).observe(get('stage'));
document.addEventListener('visibilitychange', () => {
  if (document.hidden && measurement) benchmarkCancelled = true;
  resetSamples();
});
start();
