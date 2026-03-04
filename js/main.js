import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";

// ======================
// UI helpers
// ======================
const $status = document.getElementById("status");
const $buttons = document.getElementById("buttons");
const $errors = document.getElementById("errors");

function setStatus(html) { $status.innerHTML = html; }
function showError(msg) {
  $errors.style.display = "block";
  $errors.textContent = msg;
}

// ======================
// CONFIG (TU IDLE)
// ======================
// ✅ Idle = Body Block (puedes cambiarlo a otra key si quieres)
const IDLE_KEY = "1";

// Personaje base (With Skin)
const BASE_CHARACTER = "assets/models/Mutant.fbx";

// Animaciones (Without Skin)
// type: "idle" | "attack" | "move" (attack = one-shot que regresa a idle)
const ANIMS = [
  { key: "1", name: "Body Block (Idle)", file: "assets/models/Body Block.fbx", type: "idle" },
  { key: "2", name: "Punching",          file: "assets/models/Punching.fbx", type: "attack" },
  { key: "3", name: "Drop Kick",         file: "assets/models/Drop Kick.fbx", type: "attack" },
  { key: "4", name: "Double Dagger",     file: "assets/models/Double Dagger Stab.fbx", type: "attack" },
  { key: "5", name: "Left Turn 45",      file: "assets/models/Left Turn 45.fbx", type: "move" }
];

// ======================
// THREE setup
// ======================
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b0f1a);

const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.set(80, 90, 140);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 60, 0);

scene.add(new THREE.HemisphereLight(0xffffff, 0x223355, 0.9));
const dir = new THREE.DirectionalLight(0xffffff, 1.1);
dir.position.set(120, 200, 120);
scene.add(dir);

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(2000, 2000),
  new THREE.MeshStandardMaterial({ color: 0x141a2a, roughness: 1 })
);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

const grid = new THREE.GridHelper(2000, 40, 0x2a3552, 0x1b2440);
grid.position.y = 0.01;
scene.add(grid);

// ======================
// FBX loading + animation system
// ======================
const loader = new FBXLoader();

let character = null;
let mixer = null;

const actions = new Map(); // key -> { action, meta }
let currentKey = null;

function loadFBX(url) {
  return new Promise((resolve, reject) => {
    loader.load(
      encodeURI(url),
      resolve,
      undefined,
      (err) => reject({ url, err })
    );
  });
}

function getFirstClip(fbx) {
  return (fbx.animations && fbx.animations.length) ? fbx.animations[0] : null;
}

function normalizeToFloor(obj) {
  const box = new THREE.Box3().setFromObject(obj);
  const size = new THREE.Vector3();
  box.getSize(size);

  const desiredHeight = 120;
  const height = Math.max(1e-6, size.y);
  const s = desiredHeight / height;
  obj.scale.setScalar(s);

  const box2 = new THREE.Box3().setFromObject(obj);
  obj.position.y += -box2.min.y;

  const center = new THREE.Vector3();
  box2.getCenter(center);
  obj.position.x += -center.x;
  obj.position.z += -center.z;
}

function updateUICurrent() {
  const meta = actions.get(currentKey)?.meta;
  const label = meta ? meta.name : "—";
  setStatus(`Actual: <b>${label}</b>`);
}

function play(key, fade = 0.18) {
  const pack = actions.get(key);
  if (!pack) return;

  const next = pack.action;
  const meta = pack.meta;

  if (currentKey === key) return;

  // prepare next
  next.reset();
  next.enabled = true;

  // one-shot for attacks
  if (meta.type === "attack") {
    next.setLoop(THREE.LoopOnce, 1);
    next.clampWhenFinished = true;
  } else {
    next.setLoop(THREE.LoopRepeat, Infinity);
    next.clampWhenFinished = false;
  }

  next.fadeIn(fade).play();

  // fade out current
  if (currentKey) {
    const prev = actions.get(currentKey)?.action;
    if (prev) prev.fadeOut(fade);
  }

  currentKey = key;
  updateUICurrent();
}

// when an action finishes (attack), go back to idle
function hookOneShotReturnToIdle() {
  mixer.addEventListener("finished", (e) => {
    // Si lo que terminó era un ataque, regresamos a idle
    const finishedAction = e.action;
    for (const [k, pack] of actions.entries()) {
      if (pack.action === finishedAction && pack.meta.type === "attack") {
        play(IDLE_KEY, 0.12);
        break;
      }
    }
  });
}

// ======================
// Dynamic buttons
// ======================
function buildButtons() {
  $buttons.innerHTML = "";
  for (const a of ANIMS) {
    const btn = document.createElement("button");
    btn.dataset.key = a.key;
    btn.innerHTML = `${a.name}<small>Tecla ${a.key} · ${a.type}</small>`;
    btn.addEventListener("click", () => play(a.key));
    $buttons.appendChild(btn);
  }
}

// ======================
// Init
// ======================
async function init() {
  buildButtons();
  setStatus("Cargando personaje…");

  // 1) base character
  try {
    character = await loadFBX(BASE_CHARACTER);
  } catch ({ url, err }) {
    showError(
      `No se pudo cargar: ${url}\n\n` +
      `Error: ${err?.message || err}\n\n` +
      `Si ves "FileVersion: 6100", ese FBX es viejo (6.1) y three.js no lo soporta.\n` +
      `Solución: re-descargar o convertir en Blender a FBX 7.x / glb.`
    );
    throw err;
  }

  character.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = false;
      o.receiveShadow = false;
    }
  });

  normalizeToFloor(character);
  scene.add(character);

  // 2) mixer
  mixer = new THREE.AnimationMixer(character);
  hookOneShotReturnToIdle();

  // 3) load animations
  for (let i = 0; i < ANIMS.length; i++) {
    const meta = ANIMS[i];
    setStatus(`Cargando animaciones… <b>${i + 1}/${ANIMS.length}</b><br><span style="opacity:.85">${meta.name}</span>`);

    let fbxAnim;
    try {
      fbxAnim = await loadFBX(meta.file);
    } catch ({ url, err }) {
      showError(
        `No se pudo cargar: ${url}\n\n` +
        `Error: ${err?.message || err}\n\n` +
        `Si ves "FileVersion: 6100", convierte ese FBX en Blender o re-descárgalo.`
      );
      throw err;
    }

    const clip = getFirstClip(fbxAnim);
    if (!clip) {
      showError(`El archivo no trae clip de animación: ${meta.file}`);
      throw new Error("FBX sin animations[0]");
    }

    clip.name = meta.name;
    const action = mixer.clipAction(clip);

    actions.set(meta.key, { action, meta });
  }

  // 4) start idle
  if (!actions.has(IDLE_KEY)) {
    showError(`Tu IDLE_KEY="${IDLE_KEY}" no existe en ANIMS. Cámbialo por una key válida.`);
    throw new Error("IDLE_KEY inválida");
  }

  play(IDLE_KEY, 0.01);

  // 5) keyboard
  window.addEventListener("keydown", (e) => {
    const k = e.key;
    if (actions.has(k)) play(k);
  });

  animate();
}

const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const dt = clock.getDelta();
  if (mixer) mixer.update(dt);
  controls.update();
  renderer.render(scene, camera);
}

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

init().catch((err) => console.error(err));