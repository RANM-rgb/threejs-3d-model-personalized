import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { Octree } from "three/addons/math/Octree.js";
import { Capsule } from "three/addons/math/Capsule.js";
import * as SkeletonUtils from "three/addons/utils/SkeletonUtils.js";

// =====================================================
// UI BASE
// =====================================================
const $status = document.getElementById("status");
const $buttons = document.getElementById("buttons");
const $errors = document.getElementById("errors");

function setStatus(html) {
  if ($status) $status.innerHTML = html;
}

function showError(msg) {
  if ($errors) {
    $errors.style.display = "block";
    $errors.textContent = msg;
  }
  console.error(msg);
}

// =====================================================
// HUD
// =====================================================
const hud = document.createElement("div");
hud.style.position = "fixed";
hud.style.top = "12px";
hud.style.right = "12px";
hud.style.width = "300px";
hud.style.padding = "12px 14px";
hud.style.borderRadius = "14px";
hud.style.background = "rgba(10,16,30,0.86)";
hud.style.color = "#fff";
hud.style.fontFamily = "Arial, sans-serif";
hud.style.fontSize = "13px";
hud.style.zIndex = "999";
hud.style.boxShadow = "0 10px 30px rgba(0,0,0,.35)";
hud.innerHTML = `
  <div style="font-weight:700;margin-bottom:8px;font-size:15px;">Estado del combate</div>

  <div>Vida jugador</div>
  <div style="height:12px;background:#2b3550;border-radius:999px;overflow:hidden;margin:6px 0 6px;">
    <div id="playerLifeBar" style="height:100%;width:100%;background:#53d769;"></div>
  </div>
  <div id="playerLifeText">100 / 100</div>

  <div style="margin-top:10px;">Stamina</div>
  <div style="height:12px;background:#2b3550;border-radius:999px;overflow:hidden;margin:6px 0 6px;">
    <div id="playerStaminaBar" style="height:100%;width:100%;background:#46c2ff;"></div>
  </div>
  <div id="playerStaminaText">100 / 100</div>

  <div id="enemyCounter" style="margin-top:10px;">Enemigos vivos: 0</div>
  <div id="lockOnText" style="margin-top:8px;opacity:.9;">Lock-on: no</div>
`;
document.body.appendChild(hud);

const comboUI = document.createElement("div");
comboUI.style.position = "fixed";
comboUI.style.left = "50%";
comboUI.style.top = "18%";
comboUI.style.transform = "translateX(-50%) scale(0.9)";
comboUI.style.padding = "10px 18px";
comboUI.style.borderRadius = "999px";
comboUI.style.background = "rgba(255,255,255,0.08)";
comboUI.style.backdropFilter = "blur(8px)";
comboUI.style.color = "#fff";
comboUI.style.fontFamily = "Arial, sans-serif";
comboUI.style.fontWeight = "900";
comboUI.style.fontSize = "24px";
comboUI.style.letterSpacing = "1px";
comboUI.style.opacity = "0";
comboUI.style.pointerEvents = "none";
comboUI.style.zIndex = "1001";
comboUI.style.transition = "opacity 0.14s ease, transform 0.14s ease";
comboUI.textContent = "COMBO x1";
document.body.appendChild(comboUI);

const hitFlash = document.createElement("div");
hitFlash.style.position = "fixed";
hitFlash.style.inset = "0";
hitFlash.style.background = "radial-gradient(circle, rgba(255,255,255,.22) 0%, rgba(255,255,255,.08) 22%, rgba(255,255,255,0) 58%)";
hitFlash.style.opacity = "0";
hitFlash.style.pointerEvents = "none";
hitFlash.style.zIndex = "1000";
hitFlash.style.transition = "opacity 0.08s linear";
document.body.appendChild(hitFlash);

const victoryBanner = document.createElement("div");
victoryBanner.style.position = "fixed";
victoryBanner.style.left = "50%";
victoryBanner.style.top = "50%";
victoryBanner.style.transform = "translate(-50%, -50%) scale(0.95)";
victoryBanner.style.padding = "20px 32px";
victoryBanner.style.borderRadius = "18px";
victoryBanner.style.background = "rgba(14,20,38,.92)";
victoryBanner.style.color = "#fff";
victoryBanner.style.fontFamily = "Arial, sans-serif";
victoryBanner.style.fontWeight = "900";
victoryBanner.style.fontSize = "34px";
victoryBanner.style.letterSpacing = "1px";
victoryBanner.style.boxShadow = "0 20px 50px rgba(0,0,0,.4)";
victoryBanner.style.opacity = "0";
victoryBanner.style.pointerEvents = "none";
victoryBanner.style.transition = "opacity 0.25s ease, transform 0.25s ease";
victoryBanner.style.zIndex = "1002";
victoryBanner.textContent = "VICTORIA";
document.body.appendChild(victoryBanner);

const centerMessage = document.createElement("div");
centerMessage.style.position = "fixed";
centerMessage.style.left = "50%";
centerMessage.style.top = "30%";
centerMessage.style.transform = "translate(-50%, -50%) scale(0.9)";
centerMessage.style.padding = "14px 24px";
centerMessage.style.borderRadius = "16px";
centerMessage.style.background = "rgba(12,18,34,.86)";
centerMessage.style.color = "#fff";
centerMessage.style.fontFamily = "Arial, sans-serif";
centerMessage.style.fontWeight = "900";
centerMessage.style.fontSize = "30px";
centerMessage.style.letterSpacing = "1px";
centerMessage.style.opacity = "0";
centerMessage.style.pointerEvents = "none";
centerMessage.style.zIndex = "1003";
centerMessage.style.transition = "opacity .18s ease, transform .18s ease";
document.body.appendChild(centerMessage);

const $playerLifeBar = document.getElementById("playerLifeBar");
const $playerLifeText = document.getElementById("playerLifeText");
const $playerStaminaBar = document.getElementById("playerStaminaBar");
const $playerStaminaText = document.getElementById("playerStaminaText");
const $enemyCounter = document.getElementById("enemyCounter");
const $lockOnText = document.getElementById("lockOnText");

// =====================================================
// CONFIG
// =====================================================
const BASE_CHARACTER = "assets/models/Paladin WProp J Nordstrom.fbx";
const SCENARIO_FILE = "assets/scenarios/castle/scene.gltf";
const COLLISION_FILE = "assets/models/collision-world.glb";

const ENEMY_MODEL_FILE = "assets/models/enemies/Ch10_nonPBR.fbx";
const ENEMY_ATTACK_FILE = "assets/models/enemies/Zombie Attack.fbx";
const ENEMY_ATTACK_FILE_2 = "assets/models/enemies/Zombie Punching.fbx";

const ANIMS = [
  { key: "idle", name: "Idle", file: "assets/models/Idle.fbx", type: "idle" },
  { key: "walk", name: "Walk", file: "assets/models/Walking.fbx", type: "walk" },
  { key: "run", name: "Run", file: "assets/models/Unarmed Run Forward.fbx", type: "run" },
  { key: "jump", name: "Jump", file: "assets/models/Jumping Up.fbx", type: "jump" },

  { key: "1", name: "Attack 1", file: "assets/models/Great Sword Slash.fbx", type: "attack", damage: 20, range: 2.7, hitStart: 0.13, hitEnd: 0.64, staminaCost: 10, coneDeg: 100, knockback: 4.2, trailSize: 1.05 },
  { key: "2", name: "Attack 2", file: "assets/models/Sword And Shield Attack.fbx", type: "attack", damage: 18, range: 2.48, hitStart: 0.11, hitEnd: 0.58, staminaCost: 9, coneDeg: 96, knockback: 3.85, trailSize: 0.95 },
  { key: "3", name: "Attack 3", file: "assets/models/Stepping Backward.fbx", type: "attack", damage: 12, range: 2.24, hitStart: 0.04, hitEnd: 0.36, staminaCost: 8, coneDeg: 120, knockback: 3.25, trailSize: 0.9 },
  { key: "4", name: "Attack 4", file: "assets/models/Sword And Shield Turn.fbx", type: "attack", damage: 16, range: 2.38, hitStart: 0.07, hitEnd: 0.50, staminaCost: 9, coneDeg: 110, knockback: 3.65, trailSize: 0.95 },
  { key: "5", name: "Attack 5", file: "assets/models/Great Sword Strafe.fbx", type: "attack", damage: 15, range: 2.34, hitStart: 0.10, hitEnd: 0.52, staminaCost: 9, coneDeg: 108, knockback: 3.45, trailSize: 0.95 },
  { key: "6", name: "Attack 6", file: "assets/models/Great Sword Attack.fbx", type: "attack", damage: 24, range: 2.82, hitStart: 0.16, hitEnd: 0.68, staminaCost: 12, coneDeg: 92, knockback: 5.0, trailSize: 1.12 },

  { key: "7", name: "Block", file: "assets/models/Sword And Shield Crouch Block Idle.fbx", type: "blockHold" },
  { key: "f", name: "Quick Attack", file: "assets/models/Draw A Great Sword 2.fbx", type: "quickAttack", damage: 14, range: 2.18, hitStart: 0.04, hitEnd: 0.34, staminaCost: 7, coneDeg: 130, knockback: 3.0, trailSize: 0.82 },

  { key: "v", name: "Dodge", file: "assets/models/Stepping Backward.fbx", type: "dodge", staminaCost: 14, duration: 0.42, iframeStart: 0.06, iframeEnd: 0.26, speed: 9.5 }
];

const IDLE_KEY = "idle";
const WALK_KEY = "walk";
const RUN_KEY = "run";
const JUMP_KEY = "jump";
const BLOCK_KEY = "7";
const QUICK_KEY = "f";
const DODGE_KEY = "v";
const ATTACK_KEYS = ["1", "2", "3", "4", "5", "6"];

const PLAYER_HEIGHT = 1.8;
const PLAYER_RADIUS = 0.35;
const PLAYER_MODEL_VISUAL_HEIGHT = 1.8;

const GRAVITY = 30;
const WALK_SPEED = 4.95;
const RUN_SPEED = 8.1;
const ATTACK_MOVE_SPEED = 2.35;
const BLOCK_MOVE_SPEED = 1.2;
const JUMP_SPEED = 11;
const DODGE_COOLDOWN = 0.55;

const CAMERA_HEIGHT = 1.25;
const CAMERA_DISTANCE = 4.9;
const CAMERA_MIN_DISTANCE = 1.1;
const CAMERA_LERP = 0.12;
const TARGET_LERP = 0.18;
const CAMERA_WALL_OFFSET = 0.22;
const CAMERA_LOCK_HEIGHT = 1.7;
const CAMERA_NORMAL_HEIGHT = 1.8;
const CAMERA_LOCK_DISTANCE = 4.15;
const CAMERA_COMBAT_DISTANCE = 4.35;

const FALL_LIMIT_Y = -20;
const STEP_HEIGHT = 0.28;
const PLAYER_GROUND_EPS = 0.08;

const ENEMY_COUNT = 6;
const ENEMY_SPEED = 1.95;
const ENEMY_ATTACK_RANGE = 1.35;
const ENEMY_DETECT_RANGE = 16;
const ENEMY_CONTACT_DAMAGE = 10;
const ENEMY_ATTACK_COOLDOWN = 1.2;
const ENEMY_SEPARATION_DISTANCE = 1.4;
const ENEMY_SEPARATION_FORCE = 2.2;
const ENEMY_HEIGHT = 1.75;
const ENEMY_RADIUS = 0.32;
const ENEMY_SCALE = 0.011;
const ENEMY_FALL_LIMIT_Y = -20;

const LOCK_ON_RANGE = 18;

const PARTICLE_MAX_LIFE = 0.5;
const COMBO_RESET_TIME = 1.5;
const CAMERA_SHAKE_DAMP = 6.0;
const TIME_SCALE_RETURN_SPEED = 10.0;

// =====================================================
// THREE SETUP
// =====================================================
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x09101d);
scene.fog = new THREE.Fog(0x09101d, 18, 90);

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 3, 6);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
controls.minDistance = 2.5;
controls.maxDistance = 8;
controls.maxPolarAngle = Math.PI / 2.05;

// =====================================================
// WORLD GROUP
// =====================================================
const worldGroup = new THREE.Group();
scene.add(worldGroup);

// =====================================================
// LIGHTS
// =====================================================
const hemiLight = new THREE.HemisphereLight(0xdde7ff, 0x1c2438, 1.1);
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1.25);
dirLight.position.set(15, 25, 10);
dirLight.castShadow = true;
dirLight.shadow.mapSize.set(2048, 2048);
dirLight.shadow.camera.near = 0.1;
dirLight.shadow.camera.far = 120;
dirLight.shadow.camera.left = -35;
dirLight.shadow.camera.right = 35;
dirLight.shadow.camera.top = 35;
dirLight.shadow.camera.bottom = -35;
scene.add(dirLight);

const fillLight = new THREE.PointLight(0x6b8cff, 0.45, 60);
fillLight.position.set(-8, 6, -6);
scene.add(fillLight);

// =====================================================
// BACKUP FLOOR
// =====================================================
const backupFloor = new THREE.Mesh(
  new THREE.PlaneGeometry(300, 300),
  new THREE.MeshStandardMaterial({
    color: 0x12192a,
    roughness: 0.95,
    metalness: 0.03
  })
);
backupFloor.rotation.x = -Math.PI / 2;
backupFloor.receiveShadow = true;
worldGroup.add(backupFloor);

const grid = new THREE.GridHelper(300, 60, 0x2c3e66, 0x182238);
grid.position.y = 0.02;
scene.add(grid);

// =====================================================
// LOADERS
// =====================================================
const fbxLoader = new FBXLoader();
const gltfLoader = new GLTFLoader();

// =====================================================
// GLOBALS
// =====================================================
let character = null;
let scenarioRoot = null;
let mixer = null;
let currentAction = null;
let currentActionKey = null;

const actions = new Map();
const worldOctree = new Octree();

let actionLocked = false;
let queuedActionKey = null;
let holdBlockRequested = false;

const keys = {};
const pressedOnce = {};
const clock = new THREE.Clock();

const playerCollider = new Capsule(
  new THREE.Vector3(0, PLAYER_RADIUS + 0.05, 0),
  new THREE.Vector3(0, PLAYER_HEIGHT + 0.05, 0),
  PLAYER_RADIUS
);

const playerVelocity = new THREE.Vector3();
const playerDirection = new THREE.Vector3();
let playerOnFloor = false;

const tempVector = new THREE.Vector3();
const tempBox = new THREE.Box3();
const tempRay = new THREE.Ray();
const worldUp = new THREE.Vector3(0, 1, 0);

const cameraTarget = new THREE.Vector3();
const cameraDesired = new THREE.Vector3();

let activeAttack = null;
const enemies = [];
let lockedEnemy = null;
let combatWon = false;

const particles = [];
const slashTrails = [];
const damageTexts = [];

const particleGeo = new THREE.BufferGeometry();
particleGeo.setAttribute("position", new THREE.Float32BufferAttribute([0, 0, 0], 3));
const particleMat = new THREE.PointsMaterial({
  size: 0.12,
  transparent: true,
  opacity: 1,
  depthWrite: false
});

let comboCount = 0;
let comboTimer = 0;

let hitFlashTimer = 0;
let cameraShake = 0;
let centerMessageTimer = 0;

let globalTimeScale = 1;
let slowMotionTimer = 0;
let requestedCombatZoom = CAMERA_DISTANCE;

let rightWeaponBone = null;
let leftWeaponBone = null;

const enemyAssets = {
  loaded: false,
  model: null,
  clips: {
    idle: null,
    walk: null,
    attack1: null,
    attack2: null
  }
};

// =====================================================
// PLAYER DATA
// =====================================================
const player = {
  maxLife: 100,
  life: 100,
  invulTime: 0,

  maxStamina: 100,
  stamina: 100,
  sprintDrainPerSec: 26,
  staminaRegenPerSec: 18,
  staminaRegenDelay: 0.8,
  staminaCooldown: 0,
  exhausted: false,

  dodgeCooldown: 0,
  dodgeTimer: 0,
  dodging: false,
  dodgeVector: new THREE.Vector3(),
  iframeTimer: 0
};

// =====================================================
// HELPERS
// =====================================================
function loadFBX(url) {
  return new Promise((resolve, reject) => {
    fbxLoader.load(
      encodeURI(url),
      resolve,
      undefined,
      (err) => reject({ url, err })
    );
  });
}

function loadGLTF(url) {
  return new Promise((resolve, reject) => {
    gltfLoader.load(
      encodeURI(url),
      resolve,
      undefined,
      (err) => reject({ url, err })
    );
  });
}

function getFirstClip(fbx) {
  return fbx.animations?.[0] || null;
}

function normalizeCharacter(obj) {
  const box = new THREE.Box3().setFromObject(obj);
  const size = new THREE.Vector3();
  box.getSize(size);

  const scale = PLAYER_MODEL_VISUAL_HEIGHT / Math.max(size.y, 0.001);
  obj.scale.setScalar(scale);

  const box2 = new THREE.Box3().setFromObject(obj);
  const center = new THREE.Vector3();
  box2.getCenter(center);

  obj.position.x -= center.x;
  obj.position.z -= center.z;
  obj.position.y -= box2.min.y;
}

function prepareEnemyVisual(obj) {
  obj.scale.setScalar(ENEMY_SCALE);

  obj.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
      if (child.material) child.material.side = THREE.FrontSide;
    }
  });

  const box = new THREE.Box3().setFromObject(obj);
  const center = new THREE.Vector3();
  box.getCenter(center);

  obj.position.x -= center.x;
  obj.position.z -= center.z;
  obj.position.y -= box.min.y;
}

function updateStatusLabel(label) {
  setStatus(`
    Actual: <b>${label}</b><br>
    WASD mover · Shift sprint · Espacio saltar · V esquive<br>
    1-6 ataques · 7 cubrirse · F ataque rápido · R lock-on<br>
    Mouse cámara · Q/E zoom · Flechas cámara · N/M niebla · Z/X luz
  `);
}

function isOneShotType(type) {
  return type === "attack" || type === "quickAttack" || type === "jump" || type === "dodge";
}

function getCapsuleCenter(capsule) {
  return capsule.start.clone().add(capsule.end).multiplyScalar(0.5);
}

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

function angleLerp(a, b, t) {
  let diff = b - a;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return a + diff * t;
}

function consumePressed(key) {
  if (pressedOnce[key]) {
    pressedOnce[key] = false;
    return true;
  }
  return false;
}

function spendStamina(amount) {
  if (player.stamina < amount) return false;
  player.stamina = Math.max(0, player.stamina - amount);
  player.staminaCooldown = player.staminaRegenDelay;

  if (player.stamina <= 0) {
    player.exhausted = true;
    showCenterMessage("SIN STAMINA", 0.7);
  }

  updatePlayerHUD();
  return true;
}

function hasMovementInput() {
  return !!(keys["w"] || keys["a"] || keys["s"] || keys["d"]);
}

function getEnemyHitPoint(enemy) {
  const p = enemy.group.position.clone();
  p.y += 0.95;
  return p;
}

function updatePlayerHUD() {
  const lifePct = Math.max(0, (player.life / player.maxLife) * 100);
  const staminaPct = Math.max(0, (player.stamina / player.maxStamina) * 100);

  $playerLifeBar.style.width = `${lifePct}%`;
  $playerLifeText.textContent = `${Math.ceil(player.life)} / ${player.maxLife}`;

  $playerStaminaBar.style.width = `${staminaPct}%`;
  $playerStaminaText.textContent = `${Math.ceil(player.stamina)} / ${player.maxStamina}`;
}

function updateEnemyHUD() {
  const alive = enemies.filter((e) => !e.dead).length;
  $enemyCounter.textContent = `Enemigos vivos: ${alive}`;

  if (!combatWon && alive === 0 && enemies.length > 0) {
    combatWon = true;
    victoryBanner.style.opacity = "1";
    victoryBanner.style.transform = "translate(-50%, -50%) scale(1)";
    triggerCameraShake(0.2);
    slowMotion(0.16, 0.35);
    showCenterMessage("FINISH", 0.7);
  }
}

function updateLockHUD() {
  $lockOnText.textContent = `Lock-on: ${lockedEnemy && !lockedEnemy.dead ? "sí" : "no"}`;
}

function triggerHitFlash() {
  hitFlashTimer = 0.08;
  hitFlash.style.opacity = "1";
}

function triggerCameraShake(amount = 0.12) {
  cameraShake = Math.max(cameraShake, amount);
}

function registerCombo() {
  comboCount += 1;
  comboTimer = COMBO_RESET_TIME;

  comboUI.textContent = `COMBO x${comboCount}`;
  comboUI.style.opacity = "1";
  comboUI.style.transform = "translateX(-50%) scale(1.05)";

  setTimeout(() => {
    comboUI.style.transform = "translateX(-50%) scale(1)";
  }, 60);
}

function updateCombo(dt) {
  comboTimer = Math.max(0, comboTimer - dt);

  if (comboTimer <= 0 && comboCount > 0) {
    comboCount = 0;
    comboUI.style.opacity = "0";
    comboUI.style.transform = "translateX(-50%) scale(0.9)";
  }
}

function updateEffects(dt) {
  if (hitFlashTimer > 0) {
    hitFlashTimer -= dt;
    if (hitFlashTimer <= 0) hitFlash.style.opacity = "0";
  }

  cameraShake = Math.max(0, cameraShake - dt * CAMERA_SHAKE_DAMP);

  if (centerMessageTimer > 0) {
    centerMessageTimer -= dt;
    if (centerMessageTimer <= 0) {
      centerMessage.style.opacity = "0";
      centerMessage.style.transform = "translate(-50%, -50%) scale(0.9)";
    }
  }
}

function showCenterMessage(text, duration = 0.45) {
  centerMessage.textContent = text;
  centerMessageTimer = duration;
  centerMessage.style.opacity = "1";
  centerMessage.style.transform = "translate(-50%, -50%) scale(1)";
}

function slowMotion(duration = 0.08, scale = 0.45) {
  slowMotionTimer = Math.max(slowMotionTimer, duration);
  globalTimeScale = Math.min(globalTimeScale, scale);
}

function updateTimeScale(dtUnscaled) {
  if (slowMotionTimer > 0) {
    slowMotionTimer -= dtUnscaled;
    if (slowMotionTimer <= 0) slowMotionTimer = 0;
  }

  if (slowMotionTimer <= 0) {
    globalTimeScale = THREE.MathUtils.lerp(globalTimeScale, 1, dtUnscaled * TIME_SCALE_RETURN_SPEED);
    if (Math.abs(globalTimeScale - 1) < 0.01) globalTimeScale = 1;
  }
}

function findBoneByKeywords(root, keywords) {
  let found = null;

  root.traverse((obj) => {
    if (found) return;
    if (!obj.isBone) return;

    const name = obj.name.toLowerCase();
    const ok = keywords.every((k) => name.includes(k));
    if (ok) found = obj;
  });

  return found;
}

function detectWeaponBones() {
  if (!character) return;

  rightWeaponBone =
    findBoneByKeywords(character, ["right", "hand"]) ||
    findBoneByKeywords(character, ["r", "hand"]) ||
    findBoneByKeywords(character, ["hand_r"]) ||
    findBoneByKeywords(character, ["weapon", "r"]) ||
    findBoneByKeywords(character, ["mixamorig", "righthand"]);

  leftWeaponBone =
    findBoneByKeywords(character, ["left", "hand"]) ||
    findBoneByKeywords(character, ["l", "hand"]) ||
    findBoneByKeywords(character, ["hand_l"]) ||
    findBoneByKeywords(character, ["weapon", "l"]) ||
    findBoneByKeywords(character, ["mixamorig", "lefthand"]);
}

function getTrailAnchorWorldPosition(out = new THREE.Vector3()) {
  if (rightWeaponBone) {
    rightWeaponBone.updateMatrixWorld(true);
    out.setFromMatrixPosition(rightWeaponBone.matrixWorld);
    return out;
  }

  if (leftWeaponBone) {
    leftWeaponBone.updateMatrixWorld(true);
    out.setFromMatrixPosition(leftWeaponBone.matrixWorld);
    return out;
  }

  out.copy(character.position);
  out.y += 1.15;
  out.add(new THREE.Vector3(0.35, 0, 0));
  return out;
}

// =====================================================
// PARTICLES / TEXTS
// =====================================================
function spawnImpactParticles(position, dir, count = 16, multiplier = 1) {
  for (let i = 0; i < count; i++) {
    const vel = new THREE.Vector3(
      (Math.random() - 0.5) * 4.4 * multiplier + dir.x * 1.65 * multiplier,
      (Math.random() * 3.8 + 0.9) * multiplier,
      (Math.random() - 0.5) * 4.4 * multiplier + dir.z * 1.65 * multiplier
    );

    const sprite = new THREE.Points(particleGeo, particleMat.clone());
    sprite.position.copy(position);
    sprite.material.size = (0.07 + Math.random() * 0.14) * multiplier;
    sprite.material.opacity = 1;
    scene.add(sprite);

    const maxLife = PARTICLE_MAX_LIFE * (0.85 + Math.random() * 0.5);

    particles.push({
      mesh: sprite,
      velocity: vel,
      life: maxLife,
      maxLife,
      bounce: 0.22 + Math.random() * 0.14
    });
  }
}

function spawnSlashTrail(position, forward, size = 1) {
  const material = new THREE.SpriteMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.42,
    depthWrite: false
  });

  const sprite = new THREE.Sprite(material);
  sprite.position.copy(position);
  sprite.scale.set(1.45 * size, 0.55 * size, 1);
  scene.add(sprite);

  const side = new THREE.Vector3(-forward.z, 0, forward.x).normalize();
  const vel = forward.clone().multiplyScalar(2.4).addScaledVector(side, (Math.random() - 0.5) * 3.2);
  vel.y += 0.2 + Math.random() * 0.4;

  slashTrails.push({
    mesh: sprite,
    velocity: vel,
    life: 0.12,
    maxLife: 0.12
  });
}

function spawnDamageText(text, worldPosition, isFinisher = false) {
  const el = document.createElement("div");
  el.style.position = "fixed";
  el.style.left = "0";
  el.style.top = "0";
  el.style.pointerEvents = "none";
  el.style.zIndex = "1004";
  el.style.fontFamily = "Arial, sans-serif";
  el.style.fontWeight = "900";
  el.style.fontSize = isFinisher ? "28px" : "22px";
  el.style.color = isFinisher ? "#ffe066" : "#ffffff";
  el.style.textShadow = isFinisher
    ? "0 0 10px rgba(255,224,102,.8), 0 0 20px rgba(255,140,0,.6)"
    : "0 0 10px rgba(0,0,0,.65)";
  el.textContent = text;
  document.body.appendChild(el);

  damageTexts.push({
    el,
    position: worldPosition.clone(),
    velocity: new THREE.Vector3((Math.random() - 0.5) * 0.6, 1.2 + Math.random() * 0.4, 0),
    life: isFinisher ? 0.9 : 0.65,
    maxLife: isFinisher ? 0.9 : 0.65
  });
}

function updateDamageTexts(dt) {
  for (let i = damageTexts.length - 1; i >= 0; i--) {
    const t = damageTexts[i];
    t.life -= dt;

    if (t.life <= 0) {
      t.el.remove();
      damageTexts.splice(i, 1);
      continue;
    }

    t.velocity.y += 0.25 * dt;
    t.position.addScaledVector(t.velocity, dt);

    const p = t.position.clone().project(camera);
    const visible = p.z < 1;

    if (!visible) {
      t.el.style.opacity = "0";
      continue;
    }

    const x = (p.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-p.y * 0.5 + 0.5) * window.innerHeight;

    t.el.style.left = `${x}px`;
    t.el.style.top = `${y}px`;
    t.el.style.transform = "translate(-50%, -50%)";
    t.el.style.opacity = `${clamp(t.life / t.maxLife, 0, 1)}`;
  }
}

function spawnFinisherBurst(position, dir) {
  spawnImpactParticles(position, dir, 34, 1.45);
  triggerCameraShake(0.24);
  triggerHitFlash();
  slowMotion(0.16, 0.28);
  showCenterMessage("FINISHER", 0.48);
  spawnDamageText("FINISH!", position.clone().add(new THREE.Vector3(0, 1.1, 0)), true);
}

function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life -= dt;

    if (p.life <= 0) {
      scene.remove(p.mesh);
      p.mesh.material.dispose();
      particles.splice(i, 1);
      continue;
    }

    p.velocity.y -= 18 * dt;
    p.velocity.multiplyScalar(0.96);
    p.mesh.position.addScaledVector(p.velocity, dt);

    if (p.mesh.position.y <= 0.05) {
      p.mesh.position.y = 0.05;
      if (p.velocity.y < 0) p.velocity.y *= -p.bounce;
      p.velocity.x *= 0.82;
      p.velocity.z *= 0.82;
    }

    const alpha = clamp(p.life / p.maxLife, 0, 1);
    p.mesh.material.opacity = alpha * alpha;
    p.mesh.scale.setScalar(0.72 + (1 - alpha) * 1.0);
  }

  for (let i = slashTrails.length - 1; i >= 0; i--) {
    const t = slashTrails[i];
    t.life -= dt;

    if (t.life <= 0) {
      scene.remove(t.mesh);
      t.mesh.material.dispose();
      slashTrails.splice(i, 1);
      continue;
    }

    t.mesh.position.addScaledVector(t.velocity, dt);
    t.mesh.scale.x *= 1.015;
    t.mesh.scale.y *= 0.985;
    const a = clamp(t.life / t.maxLife, 0, 1);
    t.mesh.material.opacity = a * 0.4;
  }

  updateDamageTexts(dt);
}

// =====================================================
// ESCENARIO
// =====================================================
async function loadScenario() {
  try {
    const gltf = await loadGLTF(SCENARIO_FILE);
    scenarioRoot = gltf.scene;

    scenarioRoot.traverse((obj) => {
      if (obj.isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
        if (obj.material) obj.material.side = THREE.FrontSide;
      }
    });

    tempBox.setFromObject(scenarioRoot);
    const size = new THREE.Vector3();
    tempBox.getSize(size);

    const scale = 45 / Math.max(size.x, size.y, size.z, 1);
    scenarioRoot.scale.setScalar(scale);

    tempBox.setFromObject(scenarioRoot);
    const center = new THREE.Vector3();
    tempBox.getCenter(center);

    scenarioRoot.position.x -= center.x;
    scenarioRoot.position.z -= center.z;

    tempBox.setFromObject(scenarioRoot);
    scenarioRoot.position.y -= tempBox.min.y;

    worldGroup.add(scenarioRoot);

    const collisionGLTF = await loadGLTF(COLLISION_FILE);
    const collider = collisionGLTF.scene;
    collider.visible = false;
    collider.scale.copy(scenarioRoot.scale);
    collider.position.copy(scenarioRoot.position);
    collider.rotation.copy(scenarioRoot.rotation);
    worldGroup.add(collider);

    worldOctree.fromGraphNode(collider);
    return true;
  } catch (err) {
    console.warn("Error cargando escenario:", err);
    worldOctree.fromGraphNode(worldGroup);
    return false;
  }
}

// =====================================================
// ANIMACIONES PLAYER
// =====================================================
function beginAttack(meta) {
  activeAttack = {
    key: meta.key,
    damage: meta.damage ?? 10,
    range: meta.range ?? 1.6,
    hitStart: meta.hitStart ?? 0.12,
    hitEnd: meta.hitEnd ?? 0.34,
    staminaCost: meta.staminaCost ?? 0,
    coneDeg: meta.coneDeg ?? 95,
    knockback: meta.knockback ?? 3.5,
    trailSize: meta.trailSize ?? 1,
    hitIds: new Set(),
    trailTimer: 0
  };
}

function clearAttack() {
  activeAttack = null;
}

function canQueueCombo() {
  if (!currentAction || !currentActionKey) return false;
  if (!(ATTACK_KEYS.includes(currentActionKey) || currentActionKey === QUICK_KEY)) return false;

  const clip = currentAction.getClip();
  if (!clip || clip.duration <= 0) return false;

  const progress = currentAction.time / clip.duration;
  return progress >= 0.28 && progress <= 0.96;
}

function playAnimation(key, fade = 0.12, force = false) {
  const pack = actions.get(key);
  if (!pack) return;

  const next = pack.action;
  const meta = pack.meta;

  if (actionLocked && !force) return;
  if (currentActionKey === key && currentAction === next && !force) return;

  next.reset();
  next.enabled = true;
  next.setEffectiveTimeScale(1);
  next.setEffectiveWeight(1);

  if (meta.type === "blockHold") {
    next.setLoop(THREE.LoopRepeat, Infinity);
    next.clampWhenFinished = false;
    actionLocked = true;
    clearAttack();
  } else if (isOneShotType(meta.type)) {
    next.setLoop(THREE.LoopOnce, 1);
    next.clampWhenFinished = true;
    actionLocked = true;

    if (meta.type === "attack" || meta.type === "quickAttack") {
      beginAttack(meta);
    } else {
      clearAttack();
    }
  } else {
    next.setLoop(THREE.LoopRepeat, Infinity);
    next.clampWhenFinished = false;
    clearAttack();
  }

  if (currentAction) currentAction.fadeOut(fade);

  next.fadeIn(fade).play();
  currentAction = next;
  currentActionKey = key;
  updateStatusLabel(meta.name);
}

function releaseToBaseAnimation() {
  actionLocked = false;
  clearAttack();
  player.dodging = false;
  player.dodgeTimer = 0;

  if (holdBlockRequested && actions.has(BLOCK_KEY)) {
    playAnimation(BLOCK_KEY, 0.08, true);
    return;
  }

  if (queuedActionKey && actions.has(queuedActionKey)) {
    const nextKey = queuedActionKey;
    queuedActionKey = null;
    playAnimation(nextKey, 0.08, true);
    return;
  }

  playAnimation(IDLE_KEY, 0.1, true);
}

function hookAnimationFinished() {
  mixer.addEventListener("finished", (e) => {
    let meta = null;

    for (const [, pack] of actions.entries()) {
      if (pack.action === e.action) {
        meta = pack.meta;
        break;
      }
    }

    if (!meta) return;

    if (isOneShotType(meta.type)) {
      releaseToBaseAnimation();
    }
  });
}

// =====================================================
// BOTONES
// =====================================================
function buildButtons() {
  if (!$buttons) return;
  $buttons.innerHTML = "";

  const items = [
    ["1", "Ataque 1"],
    ["2", "Ataque 2"],
    ["3", "Ataque 3"],
    ["4", "Ataque 4"],
    ["5", "Ataque 5"],
    ["6", "Ataque 6"],
    ["7", "Cubrirse"],
    ["f", "Ataque rápido"],
    ["v", "Esquive"]
  ];

  for (const [key, label] of items) {
    const btn = document.createElement("button");
    btn.innerHTML = `${label}<small>Tecla ${key.toUpperCase()}</small>`;
    btn.addEventListener("click", () => {
      if (key === BLOCK_KEY) {
        holdBlockRequested = true;
        if (!actionLocked || currentActionKey !== BLOCK_KEY) {
          playAnimation(BLOCK_KEY, 0.08, true);
        }
        return;
      }

      if (key === DODGE_KEY) {
        tryStartDodge();
        return;
      }

      if (actionLocked) {
        if (canQueueCombo()) queuedActionKey = key;
      } else {
        const meta = ANIMS.find((a) => a.key === key);
        if (!meta || spendStamina(meta.staminaCost ?? 0)) {
          playAnimation(key);
        }
      }
    });
    $buttons.appendChild(btn);
  }
}

// =====================================================
// COLISIONES PLAYER
// =====================================================
function playerCollisions() {
  const result = worldOctree.capsuleIntersect(playerCollider);

  playerOnFloor = false;

  if (result) {
    playerOnFloor = result.normal.y > 0.25;

    if (playerOnFloor) {
      playerVelocity.y = 0;
    } else {
      playerVelocity.addScaledVector(
        result.normal,
        -result.normal.dot(playerVelocity)
      );
    }

    playerCollider.translate(result.normal.multiplyScalar(result.depth));
  }

  if (playerCollider.start.y < PLAYER_RADIUS + PLAYER_GROUND_EPS) {
    const delta = (PLAYER_RADIUS + PLAYER_GROUND_EPS) - playerCollider.start.y;
    playerCollider.start.y += delta;
    playerCollider.end.y += delta;
    playerOnFloor = true;
    playerVelocity.y = 0;
  }
}

function getForwardVector() {
  camera.getWorldDirection(playerDirection);
  playerDirection.y = 0;

  if (playerDirection.lengthSq() < 0.0001) {
    playerDirection.set(0, 0, 1);
  } else {
    playerDirection.normalize();
  }

  return playerDirection;
}

function getSideVector() {
  const forward = getForwardVector().clone();
  return new THREE.Vector3().crossVectors(forward, worldUp).normalize();
}

function getInputMoveDirection() {
  let inputX = 0;
  let inputZ = 0;

  if (keys["w"]) inputZ += 1;
  if (keys["s"]) inputZ -= 1;
  if (keys["a"]) inputX -= 1;
  if (keys["d"]) inputX += 1;

  if (inputX === 0 && inputZ === 0) return null;

  const moveInput = new THREE.Vector3(inputX, 0, inputZ).normalize();

  let forward;
  let right;

  if (lockedEnemy && !lockedEnemy.dead && character) {
    forward = lockedEnemy.group.position.clone().sub(character.position);
    forward.y = 0;
    if (forward.lengthSq() < 0.0001) forward.set(0, 0, 1);
    else forward.normalize();
    right = new THREE.Vector3().crossVectors(forward, worldUp).normalize();
  } else {
    forward = getForwardVector().clone();
    right = getSideVector().clone();
  }

  const moveDir = new THREE.Vector3();
  moveDir.x = forward.x * moveInput.z + right.x * moveInput.x;
  moveDir.z = forward.z * moveInput.z + right.z * moveInput.x;

  if (moveDir.lengthSq() < 0.0001) return null;
  return moveDir.normalize();
}

function isSprinting() {
  const wantsSprint = keys["shift"] || keys["shiftleft"] || keys["shiftright"];
  const canSprint =
    wantsSprint &&
    hasMovementInput() &&
    playerOnFloor &&
    !actionLocked &&
    !holdBlockRequested &&
    !player.exhausted &&
    !player.dodging &&
    player.stamina > 0.5;

  return !!canSprint;
}

function getMoveSpeed() {
  if (player.dodging) return 0;
  if (currentActionKey === BLOCK_KEY) return BLOCK_MOVE_SPEED;
  if (ATTACK_KEYS.includes(currentActionKey) || currentActionKey === QUICK_KEY) {
    return ATTACK_MOVE_SPEED;
  }
  return isSprinting() ? RUN_SPEED : WALK_SPEED;
}

function tryTranslateCapsule(moveDelta) {
  const oldStart = playerCollider.start.clone();
  const oldEnd = playerCollider.end.clone();

  playerCollider.translate(moveDelta);
  let hit = worldOctree.capsuleIntersect(playerCollider);

  if (hit) {
    playerCollider.start.copy(oldStart);
    playerCollider.end.copy(oldEnd);

    playerCollider.translate(new THREE.Vector3(0, STEP_HEIGHT, 0));
    playerCollider.translate(moveDelta);

    const stepHit = worldOctree.capsuleIntersect(playerCollider);

    if (stepHit) {
      playerCollider.start.copy(oldStart);
      playerCollider.end.copy(oldEnd);

      const slideNormal = hit.normal.clone();
      const slide = moveDelta.clone().projectOnPlane(slideNormal);
      playerCollider.translate(slide);

      const slideHit = worldOctree.capsuleIntersect(playerCollider);
      if (slideHit) {
        playerCollider.start.copy(oldStart);
        playerCollider.end.copy(oldEnd);
        return false;
      }
    } else {
      playerCollider.translate(new THREE.Vector3(0, -STEP_HEIGHT, 0));
      playerCollisions();
    }
  }

  return true;
}

function movePlayerHorizontal(deltaTime) {
  const moveDir = getInputMoveDirection();
  if (!moveDir) return false;

  const speed = getMoveSpeed();
  const moveDistance = speed * deltaTime;
  const moveDelta = moveDir.clone().multiplyScalar(moveDistance);

  const moved = tryTranslateCapsule(moveDelta);

  if (moved && (!lockedEnemy || lockedEnemy.dead)) {
    const targetAngle = Math.atan2(moveDir.x, moveDir.z);
    character.rotation.y = angleLerp(character.rotation.y, targetAngle, 0.28);
  }

  return moved;
}

// =====================================================
// DODGE
// =====================================================
function tryStartDodge() {
  const meta = ANIMS.find((a) => a.key === DODGE_KEY);
  if (!meta) return false;
  if (player.dodgeCooldown > 0) return false;
  if (!playerOnFloor) return false;
  if (actionLocked) return false;
  if (!spendStamina(meta.staminaCost ?? 0)) return false;

  let dir = getInputMoveDirection();
  if (!dir) {
    dir = new THREE.Vector3(0, 0, 1).applyQuaternion(character.quaternion).normalize();
  }

  player.dodgeVector.copy(dir);
  player.dodging = true;
  player.dodgeTimer = meta.duration ?? 0.4;
  player.iframeTimer = 0;
  player.dodgeCooldown = DODGE_COOLDOWN;

  const targetAngle = Math.atan2(dir.x, dir.z);
  character.rotation.y = targetAngle;

  playAnimation(DODGE_KEY, 0.06, true);
  showCenterMessage("DODGE", 0.2);
  return true;
}

function updateDodge(dt) {
  if (player.dodgeCooldown > 0) {
    player.dodgeCooldown = Math.max(0, player.dodgeCooldown - dt);
  }

  if (!player.dodging) return;

  const meta = ANIMS.find((a) => a.key === DODGE_KEY);
  player.dodgeTimer = Math.max(0, player.dodgeTimer - dt);
  player.iframeTimer += dt;

  const speed = meta?.speed ?? 9;
  const intensity = clamp(player.dodgeTimer / (meta?.duration ?? 0.4), 0, 1);
  const move = player.dodgeVector.clone().multiplyScalar(speed * dt * (0.55 + intensity * 0.45));
  tryTranslateCapsule(move);

  if (player.dodgeTimer <= 0) {
    player.dodging = false;
  }
}

function isPlayerInIFrames() {
  if (!player.dodging) return false;
  const meta = ANIMS.find((a) => a.key === DODGE_KEY);
  if (!meta) return false;
  return player.iframeTimer >= (meta.iframeStart ?? 0.05) && player.iframeTimer <= (meta.iframeEnd ?? 0.2);
}

// =====================================================
// COMBATE PLAYER
// =====================================================
function getAttackProgress() {
  if (!activeAttack || !currentAction) return 0;
  const clip = currentAction.getClip();
  if (!clip || clip.duration <= 0) return 0;
  return currentAction.time / clip.duration;
}

function pulseEnemy(enemy, scale = 1.12, duration = 0.09) {
  enemy.hitPulse = {
    timer: duration,
    duration,
    scale
  };
}

function damageEnemy(enemy, damage, knockbackDir) {
  if (enemy.dead) return;

  const willDie = enemy.life - damage <= 0;

  enemy.life -= damage;
  enemy.hitCooldown = 0.3;
  enemy.stunTimer = 0.24;
  enemy.velocity.addScaledVector(knockbackDir, activeAttack?.knockback ?? 3.8);
  enemy.velocity.y += 0.35;

  enemy.lifeBar.style.width = `${clamp((enemy.life / enemy.maxLife) * 100, 0, 100)}%`;

  const hitPos = getEnemyHitPoint(enemy);
  spawnImpactParticles(hitPos, knockbackDir, willDie ? 26 : 18, willDie ? 1.25 : 1);
  triggerHitFlash();
  triggerCameraShake(willDie ? 0.16 : 0.11);
  registerCombo();
  pulseEnemy(enemy);
  slowMotion(willDie ? 0.12 : 0.065, willDie ? 0.34 : 0.48);

  spawnDamageText(`-${damage}`, hitPos.clone().add(new THREE.Vector3(0, 0.6, 0)), willDie);

  if (willDie) {
    spawnFinisherBurst(hitPos, knockbackDir);
  }

  if (enemy.life <= 0) {
    enemy.dead = true;
    enemy.attackCooldown = 999;
    enemy.lifeWrap.style.display = "none";

    if (enemy.actions.idle) enemy.actions.idle.stop();
    if (enemy.actions.walk) enemy.actions.walk.stop();
    if (enemy.actions.attack1) enemy.actions.attack1.stop();
    if (enemy.actions.attack2) enemy.actions.attack2.stop();

    enemy.group.visible = false;

    if (lockedEnemy === enemy) {
      lockedEnemy = null;
      updateLockHUD();
    }

    updateEnemyHUD();
  }
}

function updateAttackTrails(dt) {
  if (!activeAttack || !character) return;

  const progress = getAttackProgress();
  if (progress < activeAttack.hitStart || progress > activeAttack.hitEnd) return;

  activeAttack.trailTimer -= dt;
  if (activeAttack.trailTimer > 0) return;

  activeAttack.trailTimer = 0.018;

  const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(character.quaternion).normalize();
  const anchor = getTrailAnchorWorldPosition();
  spawnSlashTrail(anchor, forward, activeAttack.trailSize);
}

function updateAttackHits(dt) {
  if (!activeAttack || !character) return;

  updateAttackTrails(dt);

  const progress = getAttackProgress();
  if (progress < activeAttack.hitStart || progress > activeAttack.hitEnd) return;

  const playerPos = character.position.clone();

  if (lockedEnemy && !lockedEnemy.dead) {
    const dirToLocked = lockedEnemy.group.position.clone().sub(playerPos);
    dirToLocked.y = 0;
    if (dirToLocked.lengthSq() > 0.0001) {
      dirToLocked.normalize();
      const a = Math.atan2(dirToLocked.x, dirToLocked.z);
      character.rotation.y = angleLerp(character.rotation.y, a, 0.38);
    }
  }

  const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(character.quaternion).normalize();
  const halfConeRad = THREE.MathUtils.degToRad(activeAttack.coneDeg * 0.5);

  let bestEnemy = null;
  let bestScore = -Infinity;

  for (let i = 0; i < enemies.length; i++) {
    const enemy = enemies[i];
    if (enemy.dead) continue;
    if (activeAttack.hitIds.has(i)) continue;

    const hitPoint = getEnemyHitPoint(enemy);
    const toEnemy = hitPoint.clone().sub(playerPos);

    const verticalDiff = Math.abs(toEnemy.y);
    if (verticalDiff > 2.0) continue;

    const flatToEnemy = toEnemy.clone();
    flatToEnemy.y = 0;

    const dist = flatToEnemy.length();
    const effectiveRange = activeAttack.range + ENEMY_RADIUS + 0.4;
    if (dist > effectiveRange || dist < 0.0001) continue;

    flatToEnemy.normalize();
    const angle = Math.acos(clamp(forward.dot(flatToEnemy), -1, 1));

    const veryClose = dist < 1.6;
    const closeBonus = dist < 1.25 ? 1 : 0;
    const inCone = angle <= halfConeRad || veryClose;

    if (!inCone) continue;

    const score = (1 - angle / Math.max(halfConeRad, 0.001)) * 3.1 - dist * 0.72 + closeBonus * 1.2;

    if (score > bestScore) {
      bestScore = score;
      bestEnemy = { enemy, index: i };
    }
  }

  if (bestEnemy) {
    const enemy = bestEnemy.enemy;
    const knockDir = enemy.group.position.clone().sub(playerPos);
    knockDir.y = 0;
    if (knockDir.lengthSq() < 0.0001) knockDir.copy(forward);
    else knockDir.normalize();

    damageEnemy(enemy, activeAttack.damage, knockDir);
    activeAttack.hitIds.add(bestEnemy.index);
  }
}

function damagePlayer(amount) {
  if (player.invulTime > 0) return;
  if (isPlayerInIFrames()) {
    showCenterMessage("MISS", 0.18);
    return;
  }

  if (holdBlockRequested || currentActionKey === BLOCK_KEY) {
    amount *= 0.25;
    showCenterMessage("BLOCK", 0.2);
  }

  player.life = Math.max(0, player.life - amount);
  player.invulTime = 0.5;
  triggerCameraShake(0.08);
  triggerHitFlash();
  updatePlayerHUD();

  if (player.life <= 0) {
    showCenterMessage("DERROTA", 0.9);
    player.life = player.maxLife;
    player.stamina = player.maxStamina;
    player.exhausted = false;
    player.staminaCooldown = 0;
    comboCount = 0;
    comboTimer = 0;
    comboUI.style.opacity = "0";
    updatePlayerHUD();

    playerCollider.start.set(0, PLAYER_RADIUS + 0.05, 0);
    playerCollider.end.set(0, PLAYER_HEIGHT + 0.05, 0);
    playerVelocity.set(0, 0, 0);
  }
}

// =====================================================
// LOCK ON
// =====================================================
function findNearestEnemy() {
  if (!character) return null;

  let best = null;
  let bestDist = Infinity;
  const pos = character.position;

  for (const enemy of enemies) {
    if (enemy.dead) continue;
    const dist = enemy.group.position.distanceTo(pos);
    if (dist < LOCK_ON_RANGE && dist < bestDist) {
      bestDist = dist;
      best = enemy;
    }
  }

  return best;
}

function toggleLockOn() {
  if (lockedEnemy && !lockedEnemy.dead) {
    lockedEnemy = null;
  } else {
    lockedEnemy = findNearestEnemy();
  }
  updateLockHUD();
}

// =====================================================
// ENEMY ASSETS
// =====================================================
async function loadEnemyAssets() {
  setStatus("Cargando zombies...");

  const [zombieBase, attackA, attackB] = await Promise.all([
    loadFBX(ENEMY_MODEL_FILE),
    loadFBX(ENEMY_ATTACK_FILE),
    loadFBX(ENEMY_ATTACK_FILE_2)
  ]);

  enemyAssets.model = zombieBase;
  enemyAssets.clips.idle = getFirstClip(zombieBase) || getFirstClip(attackB) || getFirstClip(attackA);
  enemyAssets.clips.walk = getFirstClip(attackB) || getFirstClip(zombieBase) || getFirstClip(attackA);
  enemyAssets.clips.attack1 = getFirstClip(attackA) || getFirstClip(attackB) || getFirstClip(zombieBase);
  enemyAssets.clips.attack2 = getFirstClip(attackB) || getFirstClip(attackA) || getFirstClip(zombieBase);
  enemyAssets.loaded = true;
}

function playEnemyAction(enemy, key, fade = 0.15) {
  if (!enemy.actions[key]) return;
  if (enemy.currentActionKey === key) return;

  const next = enemy.actions[key];
  if (enemy.currentAction) enemy.currentAction.fadeOut(fade);

  next.reset();
  next.enabled = true;
  next.setEffectiveWeight(1);
  next.setEffectiveTimeScale(1);

  if (key === "attack1" || key === "attack2") {
    next.setLoop(THREE.LoopOnce, 1);
    next.clampWhenFinished = true;
  } else {
    next.setLoop(THREE.LoopRepeat, Infinity);
    next.clampWhenFinished = false;
  }

  next.fadeIn(fade).play();
  enemy.currentAction = next;
  enemy.currentActionKey = key;
}

function createEnemyLifeUI() {
  const lifeWrap = document.createElement("div");
  lifeWrap.style.position = "fixed";
  lifeWrap.style.width = "52px";
  lifeWrap.style.height = "6px";
  lifeWrap.style.background = "rgba(0,0,0,0.45)";
  lifeWrap.style.borderRadius = "999px";
  lifeWrap.style.overflow = "hidden";
  lifeWrap.style.pointerEvents = "none";
  lifeWrap.style.zIndex = "998";
  document.body.appendChild(lifeWrap);

  const lifeBar = document.createElement("div");
  lifeBar.style.width = "100%";
  lifeBar.style.height = "100%";
  lifeBar.style.background = "#ff4d4f";
  lifeWrap.appendChild(lifeBar);

  return { lifeWrap, lifeBar };
}

function createEnemy(x, z) {
  const group = new THREE.Group();
  scene.add(group);

  const model = SkeletonUtils.clone(enemyAssets.model);
  prepareEnemyVisual(model);
  group.add(model);

  const mixer = new THREE.AnimationMixer(model);
  const actions = {};

  if (enemyAssets.clips.idle) actions.idle = mixer.clipAction(enemyAssets.clips.idle);
  if (enemyAssets.clips.walk) actions.walk = mixer.clipAction(enemyAssets.clips.walk);
  if (enemyAssets.clips.attack1) actions.attack1 = mixer.clipAction(enemyAssets.clips.attack1);
  if (enemyAssets.clips.attack2) actions.attack2 = mixer.clipAction(enemyAssets.clips.attack2);

  const ui = createEnemyLifeUI();

  const enemy = {
    group,
    model,
    mixer,
    actions,
    currentAction: null,
    currentActionKey: null,

    capsule: new Capsule(
      new THREE.Vector3(x, ENEMY_RADIUS + 0.05, z),
      new THREE.Vector3(x, ENEMY_HEIGHT + 0.05, z),
      ENEMY_RADIUS
    ),

    velocity: new THREE.Vector3(),
    onFloor: false,

    life: 60,
    maxLife: 60,
    dead: false,
    hitCooldown: 0,
    stunTimer: 0,
    attackCooldown: Math.random() * 0.8,
    attackTimer: 0,
    attackDidDamage: false,
    hitPulse: null,

    lifeWrap: ui.lifeWrap,
    lifeBar: ui.lifeBar
  };

  mixer.addEventListener("finished", () => {
    if (enemy.dead) return;
    if (enemy.currentActionKey === "attack1" || enemy.currentActionKey === "attack2") {
      enemy.attackTimer = 0;
      enemy.attackDidDamage = false;
      playEnemyAction(enemy, "idle");
    }
  });

  playEnemyAction(enemy, "idle", 0.01);
  return enemy;
}

function spawnEnemies() {
  const positions = [
    [-5, -4],
    [4, -5],
    [6, 3],
    [-7, 5],
    [2, 8],
    [-3, 9]
  ];

  for (let i = 0; i < ENEMY_COUNT; i++) {
    const p = positions[i % positions.length];
    enemies.push(createEnemy(p[0], p[1]));
  }

  updateEnemyHUD();
}

function enemyCollisions(enemy) {
  const result = worldOctree.capsuleIntersect(enemy.capsule);

  enemy.onFloor = false;

  if (result) {
    enemy.onFloor = result.normal.y > 0.25;

    if (enemy.onFloor) {
      enemy.velocity.y = 0;
    } else {
      enemy.velocity.addScaledVector(
        result.normal,
        -result.normal.dot(enemy.velocity)
      );
    }

    enemy.capsule.translate(result.normal.multiplyScalar(result.depth));
  }

  if (enemy.capsule.start.y < ENEMY_RADIUS + 0.03) {
    const delta = (ENEMY_RADIUS + 0.03) - enemy.capsule.start.y;
    enemy.capsule.start.y += delta;
    enemy.capsule.end.y += delta;
    enemy.onFloor = true;
    enemy.velocity.y = 0;
  }
}

function updateEnemyBillboards() {
  for (const enemy of enemies) {
    if (enemy.dead) continue;

    const pos = enemy.group.position.clone();
    pos.y += 2.05;
    pos.project(camera);

    const visible = pos.z < 1;
    enemy.lifeWrap.style.display = visible ? "block" : "none";

    const x = (pos.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-pos.y * 0.5 + 0.5) * window.innerHeight;

    enemy.lifeWrap.style.left = `${x - 26}px`;
    enemy.lifeWrap.style.top = `${y - 20}px`;
  }
}

function applyEnemySeparation(enemy, dt) {
  const push = new THREE.Vector3();

  for (const other of enemies) {
    if (other === enemy || other.dead) continue;

    tempVector.copy(enemy.group.position).sub(other.group.position);
    tempVector.y = 0;

    const dist = tempVector.length();
    if (dist > 0 && dist < ENEMY_SEPARATION_DISTANCE) {
      tempVector.normalize();
      const strength = (ENEMY_SEPARATION_DISTANCE - dist) * ENEMY_SEPARATION_FORCE;
      push.addScaledVector(tempVector, strength * dt);
    }
  }

  enemy.velocity.add(push);
}

function updateEnemyAttack(enemy, dt, distToPlayer) {
  if (enemy.dead) return;

  enemy.attackCooldown = Math.max(0, enemy.attackCooldown - dt);

  if (
    distToPlayer <= ENEMY_ATTACK_RANGE &&
    enemy.attackCooldown <= 0 &&
    enemy.currentActionKey !== "attack1" &&
    enemy.currentActionKey !== "attack2" &&
    enemy.stunTimer <= 0
  ) {
    const attackKey = Math.random() > 0.5 ? "attack1" : "attack2";
    playEnemyAction(enemy, attackKey);
    enemy.attackCooldown = ENEMY_ATTACK_COOLDOWN;
    enemy.attackTimer = 0;
    enemy.attackDidDamage = false;
  }

  if (enemy.currentActionKey === "attack1" || enemy.currentActionKey === "attack2") {
    enemy.attackTimer += dt;

    if (!enemy.attackDidDamage && enemy.attackTimer >= 0.45 && distToPlayer <= ENEMY_ATTACK_RANGE + 0.25) {
      damagePlayer(ENEMY_CONTACT_DAMAGE);
      enemy.attackDidDamage = true;
    }
  }
}

function updateEnemyVisualEffects(enemy, dt) {
  if (!enemy.hitPulse) {
    enemy.group.scale.setScalar(1);
    return;
  }

  enemy.hitPulse.timer -= dt;
  const t = clamp(enemy.hitPulse.timer / enemy.hitPulse.duration, 0, 1);
  const s = THREE.MathUtils.lerp(1, enemy.hitPulse.scale, t);
  enemy.group.scale.setScalar(s);

  if (enemy.hitPulse.timer <= 0) {
    enemy.hitPulse = null;
    enemy.group.scale.setScalar(1);
  }
}

function updateEnemies(dt) {
  if (!character) return;

  const playerPos = character.position.clone();

  for (const enemy of enemies) {
    if (enemy.dead) continue;

    enemy.mixer.update(dt);
    enemy.hitCooldown = Math.max(0, enemy.hitCooldown - dt);
    enemy.stunTimer = Math.max(0, enemy.stunTimer - dt);

    if (!enemy.onFloor) {
      enemy.velocity.y -= GRAVITY * dt;
    }

    const toPlayer = playerPos.clone().sub(enemy.group.position);
    const flat = toPlayer.clone();
    flat.y = 0;
    const dist = flat.length();

    if (dist > 0.001) {
      flat.normalize();
      const angle = Math.atan2(flat.x, flat.z);
      enemy.group.rotation.y = angle;
    }

    const isAttacking = enemy.currentActionKey === "attack1" || enemy.currentActionKey === "attack2";

    if (enemy.stunTimer <= 0) {
      if (!isAttacking && dist < ENEMY_DETECT_RANGE && dist > ENEMY_ATTACK_RANGE) {
        enemy.velocity.addScaledVector(flat, ENEMY_SPEED * dt);

        if (Math.random() < 0.018) {
          const strafe = new THREE.Vector3(-flat.z, 0, flat.x).normalize();
          enemy.velocity.addScaledVector(strafe, (Math.random() - 0.5) * 0.9);
        }

        playEnemyAction(enemy, "walk");
      } else if (!isAttacking && dist <= ENEMY_ATTACK_RANGE) {
        playEnemyAction(enemy, "idle");
      } else if (!isAttacking && dist >= ENEMY_DETECT_RANGE) {
        playEnemyAction(enemy, "idle");
      }

      updateEnemyAttack(enemy, dt, dist);
    }

    applyEnemySeparation(enemy, dt);

    enemy.velocity.x *= enemy.onFloor ? 0.86 : 0.96;
    enemy.velocity.z *= enemy.onFloor ? 0.86 : 0.96;

    const moveDelta = enemy.velocity.clone().multiplyScalar(dt);
    enemy.capsule.translate(moveDelta);

    enemyCollisions(enemy);

    const center = getCapsuleCenter(enemy.capsule);
    enemy.group.position.set(
      center.x,
      enemy.capsule.start.y - ENEMY_RADIUS - 0.03,
      center.z
    );

    updateEnemyVisualEffects(enemy, dt);

    if (enemy.group.position.y < ENEMY_FALL_LIMIT_Y) {
      enemy.capsule.start.set(0, ENEMY_RADIUS + 0.05, 0);
      enemy.capsule.end.set(0, ENEMY_HEIGHT + 0.05, 0);
      enemy.velocity.set(0, 0, 0);
    }
  }

  updateEnemyBillboards();
}

// =====================================================
// PLAYER UPDATE
// =====================================================
function updateStamina(dt) {
  const sprinting = isSprinting();

  if (sprinting) {
    player.stamina = Math.max(0, player.stamina - player.sprintDrainPerSec * dt);
    player.staminaCooldown = player.staminaRegenDelay;

    if (player.stamina <= 0) {
      player.stamina = 0;
      player.exhausted = true;
      showCenterMessage("AGOTADO", 0.55);
    }
  } else {
    player.staminaCooldown = Math.max(0, player.staminaCooldown - dt);

    if (player.staminaCooldown <= 0) {
      player.stamina = Math.min(player.maxStamina, player.stamina + player.staminaRegenPerSec * dt);
      if (player.stamina > player.maxStamina * 0.25) {
        player.exhausted = false;
      }
    }
  }

  updatePlayerHUD();
}

function tryPlayAttackByKey(key) {
  const meta = ANIMS.find((a) => a.key === key);
  if (!meta) return;

  if (actionLocked) {
    if (canQueueCombo()) queuedActionKey = key;
    return;
  }

  if (!spendStamina(meta.staminaCost ?? 0)) return;
  playAnimation(key);
}

function handleAttackInputs() {
  for (const atkKey of ATTACK_KEYS) {
    if (keys[atkKey]) {
      if (playerOnFloor && currentActionKey !== atkKey && !player.dodging) {
        tryPlayAttackByKey(atkKey);
      }
      keys[atkKey] = false;
    }
  }

  if (keys["f"]) {
    if (playerOnFloor && currentActionKey !== QUICK_KEY && !player.dodging) {
      tryPlayAttackByKey(QUICK_KEY);
    }
    keys["f"] = false;
  }

  if (keys["v"]) {
    tryStartDodge();
    keys["v"] = false;
  }
}

function updatePlayerFacing(dt) {
  if (!character) return;
  if (player.dodging) return;

  if (lockedEnemy && !lockedEnemy.dead) {
    const dir = lockedEnemy.group.position.clone().sub(character.position);
    dir.y = 0;
    if (dir.lengthSq() > 0.0001) {
      dir.normalize();
      const angle = Math.atan2(dir.x, dir.z);
      character.rotation.y = angleLerp(character.rotation.y, angle, Math.min(1, dt * 10));
    }
  }
}

function updatePlayer(deltaTime) {
  if (!character) return;

  if (lockedEnemy && lockedEnemy.dead) {
    lockedEnemy = null;
    updateLockHUD();
  }

  if (consumePressed("r")) {
    toggleLockOn();
  }

  player.invulTime = Math.max(0, player.invulTime - deltaTime);
  updateStamina(deltaTime);

  if (!playerOnFloor) {
    playerVelocity.y -= GRAVITY * deltaTime;
  } else {
    playerVelocity.y = Math.max(0, playerVelocity.y);
  }

  if ((keys[" "] || keys["space"]) && playerOnFloor && !actionLocked && !player.dodging) {
    playerVelocity.y = JUMP_SPEED;
    playerOnFloor = false;
    playAnimation(JUMP_KEY);
  }

  handleAttackInputs();

  holdBlockRequested = !!keys[BLOCK_KEY] && !player.dodging;

  if (holdBlockRequested && playerOnFloor && !player.dodging) {
    if (!actionLocked || currentActionKey !== BLOCK_KEY) {
      playAnimation(BLOCK_KEY, 0.08, true);
    }
  } else if (currentActionKey === BLOCK_KEY && !keys[BLOCK_KEY]) {
    actionLocked = false;
  }

  updateDodge(deltaTime);

  if (!player.dodging) {
    movePlayerHorizontal(deltaTime);
  }

  tempVector.copy(playerVelocity).multiplyScalar(deltaTime);
  playerCollider.translate(tempVector);

  playerCollisions();

  if (playerOnFloor) {
    playerVelocity.x *= 0.72;
    playerVelocity.z *= 0.72;
  } else {
    playerVelocity.x *= 0.96;
    playerVelocity.z *= 0.96;
  }

  const center = getCapsuleCenter(playerCollider);
  character.position.set(
    center.x,
    playerCollider.start.y - PLAYER_RADIUS,
    center.z
  );

  if (character.position.y < FALL_LIMIT_Y) {
    playerCollider.start.set(0, PLAYER_RADIUS + 0.05, 0);
    playerCollider.end.set(0, PLAYER_HEIGHT + 0.05, 0);
    playerVelocity.set(0, 0, 0);
    playerOnFloor = false;
  }

  updatePlayerFacing(deltaTime);
  updateAttackHits(deltaTime);

  if (!playerOnFloor && playerVelocity.y < -2) {
    if (currentActionKey !== JUMP_KEY) playAnimation(JUMP_KEY, 0.08, true);
    return;
  }

  if (player.dodging) return;

  if (holdBlockRequested) {
    if (currentActionKey !== BLOCK_KEY) playAnimation(BLOCK_KEY, 0.08, true);
    return;
  }

  if (actionLocked && (ATTACK_KEYS.includes(currentActionKey) || currentActionKey === QUICK_KEY || currentActionKey === DODGE_KEY)) {
    return;
  }

  const sprinting = isSprinting();
  const moving = !!getInputMoveDirection();

  if (moving && sprinting) {
    playAnimation(RUN_KEY);
  } else if (moving) {
    playAnimation(WALK_KEY);
  } else {
    playAnimation(IDLE_KEY);
  }
}

// =====================================================
// CÁMARA
// =====================================================
function resolveCameraCollision(origin, desired) {
  const dir = desired.clone().sub(origin);
  const distance = dir.length();

  if (distance <= 0.001) return desired;
  dir.normalize();

  tempRay.origin.copy(origin);
  tempRay.direction.copy(dir);

  let safeDistance = distance;

  if (typeof worldOctree.rayIntersect === "function") {
    const hit = worldOctree.rayIntersect(tempRay);
    if (hit && hit.distance < distance) {
      safeDistance = Math.max(CAMERA_MIN_DISTANCE, hit.distance - CAMERA_WALL_OFFSET);
    }
  }

  return origin.clone().add(dir.multiplyScalar(safeDistance));
}

function getNearestAliveEnemyDistance() {
  if (!character) return Infinity;

  let best = Infinity;
  for (const enemy of enemies) {
    if (enemy.dead) continue;
    const d = enemy.group.position.distanceTo(character.position);
    if (d < best) best = d;
  }
  return best;
}

function updateThirdPersonCamera(dt) {
  if (!character) return;

  const charPos = character.position.clone();

  let forward;
  let desiredDistance = CAMERA_DISTANCE;
  let desiredHeight = CAMERA_NORMAL_HEIGHT;

  const nearestEnemyDist = getNearestAliveEnemyDistance();
  const nearCombat = nearestEnemyDist < 5.5;

  if (lockedEnemy && !lockedEnemy.dead) {
    forward = lockedEnemy.group.position.clone().sub(charPos);
    forward.y = 0;
    if (forward.lengthSq() < 0.0001) forward.set(0, 0, 1);
    else forward.normalize();

    desiredDistance = CAMERA_LOCK_DISTANCE;
    desiredHeight = CAMERA_LOCK_HEIGHT;

    const mid = charPos.clone().lerp(lockedEnemy.group.position, 0.38);
    cameraTarget.set(mid.x, charPos.y + CAMERA_HEIGHT, mid.z);
  } else {
    forward = new THREE.Vector3(0, 0, 1).applyQuaternion(character.quaternion).normalize();
    cameraTarget.set(charPos.x, charPos.y + CAMERA_HEIGHT, charPos.z);

    if (nearCombat) {
      desiredDistance = CAMERA_COMBAT_DISTANCE;
      desiredHeight = CAMERA_NORMAL_HEIGHT - 0.05;
    }
  }

  requestedCombatZoom = THREE.MathUtils.lerp(requestedCombatZoom, desiredDistance, dt * 5.5);

  cameraDesired
    .copy(cameraTarget)
    .addScaledVector(forward, -requestedCombatZoom)
    .add(new THREE.Vector3(0, desiredHeight, 0));

  const safeDesired = resolveCameraCollision(cameraTarget, cameraDesired);

  controls.target.lerp(cameraTarget, TARGET_LERP);
  camera.position.lerp(safeDesired, CAMERA_LERP);

  if (cameraShake > 0) {
    camera.position.x += (Math.random() - 0.5) * cameraShake;
    camera.position.y += (Math.random() - 0.5) * cameraShake * 0.7;
    camera.position.z += (Math.random() - 0.5) * cameraShake;
  }
}

function updateCameraKeyboard(dt) {
  if (lockedEnemy && !lockedEnemy.dead) return;

  const rotateSpeed = 1.2;
  const zoomSpeed = 4.5;

  if (keys["arrowleft"]) {
    camera.position.sub(controls.target);
    camera.position.applyAxisAngle(worldUp, rotateSpeed * dt);
    camera.position.add(controls.target);
  }

  if (keys["arrowright"]) {
    camera.position.sub(controls.target);
    camera.position.applyAxisAngle(worldUp, -rotateSpeed * dt);
    camera.position.add(controls.target);
  }

  if (keys["q"]) {
    tempVector.subVectors(camera.position, controls.target).normalize();
    camera.position.addScaledVector(tempVector, zoomSpeed * dt);
  }

  if (keys["e"]) {
    tempVector.subVectors(camera.position, controls.target).normalize();
    camera.position.addScaledVector(tempVector, -zoomSpeed * dt);
  }
}

// =====================================================
// ENTORNO
// =====================================================
function handleEnvironmentKeys(e) {
  switch (e.key.toLowerCase()) {
    case "n":
      scene.fog.near = Math.max(2, scene.fog.near - 1);
      scene.fog.far = Math.max(scene.fog.near + 5, scene.fog.far - 2);
      break;
    case "m":
      scene.fog.near += 1;
      scene.fog.far += 2;
      break;
    case "z":
      dirLight.intensity = Math.max(0.2, dirLight.intensity - 0.1);
      hemiLight.intensity = Math.max(0.2, hemiLight.intensity - 0.05);
      break;
    case "x":
      dirLight.intensity += 0.1;
      hemiLight.intensity += 0.05;
      break;
  }
}

// =====================================================
// CARGA PLAYER CON PROMISE.ALL
// =====================================================
async function loadPlayerAndAnimations() {
  setStatus("Cargando personaje y animaciones...");
  const promises = [loadFBX(BASE_CHARACTER), ...ANIMS.map((a) => loadFBX(a.file))];
  const results = await Promise.all(promises);

  const base = results[0];
  const animFiles = results.slice(1);

  character = base;

  character.traverse((obj) => {
    if (obj.isMesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
      if (obj.material) obj.material.side = THREE.FrontSide;
    }
  });

  normalizeCharacter(character);
  scene.add(character);

  detectWeaponBones();

  mixer = new THREE.AnimationMixer(character);
  hookAnimationFinished();

  for (let i = 0; i < ANIMS.length; i++) {
    const meta = ANIMS[i];
    const fbxAnim = animFiles[i];
    const clip = getFirstClip(fbxAnim);

    if (!clip) {
      showError(`El archivo no trae clip de animación: ${meta.file}`);
      throw new Error(`FBX sin clip: ${meta.file}`);
    }

    clip.name = meta.name;
    const action = mixer.clipAction(clip);
    actions.set(meta.key, { action, meta });
  }
}

// =====================================================
// INIT
// =====================================================
async function init() {
  buildButtons();
  updatePlayerHUD();
  updateLockHUD();

  setStatus("Cargando escenario...");
  await loadScenario();

  try {
    await loadPlayerAndAnimations();
  } catch (error) {
    const url = error?.url;
    const err = error?.err || error;

    if (url || err) {
      showError(
        `No se pudo cargar el personaje/animaciones.\nArchivo: ${url || "desconocido"}\n\n` +
        `Error: ${err?.message || err}`
      );
    }

    throw err || new Error("Error cargando personaje o animaciones");
  }

  try {
    await loadEnemyAssets();
  } catch (error) {
    const url = error?.url;
    const err = error?.err || error;

    showError(
      `No se pudieron cargar los archivos del zombie.\nArchivo: ${url || "desconocido"}\n\n` +
      `Error: ${err?.message || err}`
    );
    throw err;
  }

  playerCollider.start.set(0, PLAYER_RADIUS + 0.05, 0);
  playerCollider.end.set(0, PLAYER_HEIGHT + 0.05, 0);

  spawnEnemies();
  playAnimation(IDLE_KEY, 0.01, true);

  window.addEventListener("keydown", (e) => {
    const key = e.key.toLowerCase();
    const code = e.code.toLowerCase();

    if (!keys[key]) pressedOnce[key] = true;
    if (!keys[code]) pressedOnce[code] = true;

    keys[key] = true;
    keys[code] = true;

    handleEnvironmentKeys(e);
  });

  window.addEventListener("keyup", (e) => {
    keys[e.key.toLowerCase()] = false;
    keys[e.code.toLowerCase()] = false;

    if (e.key.toLowerCase() === BLOCK_KEY) {
      holdBlockRequested = false;
      if (currentActionKey === BLOCK_KEY) {
        actionLocked = false;
      }
    }
  });

  animate();
}

function animate() {
  requestAnimationFrame(animate);

  const dtUnscaled = Math.min(clock.getDelta(), 0.05);
  updateTimeScale(dtUnscaled);
  const deltaTime = dtUnscaled * globalTimeScale;

  if (mixer) mixer.update(deltaTime);

  updatePlayer(deltaTime);
  updateEnemies(deltaTime);
  updateParticles(deltaTime);
  updateCombo(deltaTime);
  updateEffects(deltaTime);
  updateThirdPersonCamera(dtUnscaled);
  updateCameraKeyboard(dtUnscaled);

  controls.update();
  renderer.render(scene, camera);
}

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

init().catch((err) => console.error(err));