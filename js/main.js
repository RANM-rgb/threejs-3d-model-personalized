import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { Octree } from "three/addons/math/Octree.js";
import { Capsule } from "three/addons/math/Capsule.js";

// =====================================================
// UI
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

// HUD simple
const hud = document.createElement("div");
hud.style.position = "fixed";
hud.style.top = "12px";
hud.style.right = "12px";
hud.style.width = "240px";
hud.style.padding = "10px 12px";
hud.style.borderRadius = "12px";
hud.style.background = "rgba(10,16,30,0.82)";
hud.style.color = "#fff";
hud.style.fontFamily = "Arial, sans-serif";
hud.style.fontSize = "13px";
hud.style.zIndex = "999";
hud.innerHTML = `
  <div style="font-weight:700;margin-bottom:8px;">Estado del combate</div>
  <div>Vida jugador</div>
  <div style="height:12px;background:#2b3550;border-radius:999px;overflow:hidden;margin:6px 0 10px;">
    <div id="playerLifeBar" style="height:100%;width:100%;background:#53d769;"></div>
  </div>
  <div id="playerLifeText">100 / 100</div>
  <div id="enemyCounter" style="margin-top:10px;">Enemigos vivos: 0</div>
`;
document.body.appendChild(hud);

const $playerLifeBar = document.getElementById("playerLifeBar");
const $playerLifeText = document.getElementById("playerLifeText");
const $enemyCounter = document.getElementById("enemyCounter");

function updatePlayerHUD() {
  const pct = Math.max(0, (player.life / player.maxLife) * 100);
  $playerLifeBar.style.width = `${pct}%`;
  $playerLifeText.textContent = `${Math.ceil(player.life)} / ${player.maxLife}`;
}

function updateEnemyHUD() {
  const alive = enemies.filter((e) => !e.dead).length;
  $enemyCounter.textContent = `Enemigos vivos: ${alive}`;
}

// =====================================================
// CONFIG
// =====================================================
const BASE_CHARACTER = "assets/models/Paladin WProp J Nordstrom.fbx";
const SCENARIO_FILE = "assets/scenarios/castle/scene.gltf";
const COLLISION_FILE = "assets/models/collision-world.glb";

const ANIMS = [
  { key: "idle", name: "Idle", file: "assets/models/Idle.fbx", type: "idle" },
  { key: "walk", name: "Walk", file: "assets/models/Walking.fbx", type: "walk" },
  { key: "run", name: "Run", file: "assets/models/Unarmed Run Forward.fbx", type: "run" },
  { key: "jump", name: "Jump", file: "assets/models/Jumping Up.fbx", type: "jump" },

  { key: "1", name: "Attack 1", file: "assets/models/Great Sword Slash.fbx", type: "attack", damage: 20, range: 2.2, hitStart: 0.18, hitEnd: 0.52 },
  { key: "2", name: "Attack 2", file: "assets/models/Sword And Shield Attack.fbx", type: "attack", damage: 18, range: 1.9, hitStart: 0.16, hitEnd: 0.48 },
  { key: "3", name: "Attack 3", file: "assets/models/Stepping Backward.fbx", type: "attack", damage: 12, range: 1.6, hitStart: 0.08, hitEnd: 0.30 },
  { key: "4", name: "Attack 4", file: "assets/models/Sword And Shield Turn.fbx", type: "attack", damage: 16, range: 1.8, hitStart: 0.12, hitEnd: 0.42 },
  { key: "5", name: "Attack 5", file: "assets/models/Great Sword Strafe.fbx", type: "attack", damage: 15, range: 1.8, hitStart: 0.14, hitEnd: 0.44 },
  { key: "6", name: "Attack 6", file: "assets/models/Great Sword Attack.fbx", type: "attack", damage: 24, range: 2.1, hitStart: 0.20, hitEnd: 0.58 },

  { key: "7", name: "Block", file: "assets/models/Sword And Shield Crouch Block Idle.fbx", type: "blockHold" },
  { key: "f", name: "Quick Attack", file: "assets/models/Draw A Great Sword 2.fbx", type: "quickAttack", damage: 14, range: 1.5, hitStart: 0.08, hitEnd: 0.28 }
];

const IDLE_KEY = "idle";
const WALK_KEY = "walk";
const RUN_KEY = "run";
const JUMP_KEY = "jump";
const BLOCK_KEY = "7";
const QUICK_KEY = "f";
const ATTACK_KEYS = ["1", "2", "3", "4", "5", "6"];

const PLAYER_HEIGHT = 1.8;
const PLAYER_RADIUS = 0.35;
const PLAYER_MODEL_VISUAL_HEIGHT = 1.8;

const GRAVITY = 30;
const WALK_SPEED = 4.8;
const RUN_SPEED = 8.0;
const ATTACK_MOVE_SPEED = 2.2;
const BLOCK_MOVE_SPEED = 1.25;
const JUMP_SPEED = 11;

const CAMERA_HEIGHT = 1.25;
const CAMERA_DISTANCE = 4.6;
const CAMERA_LERP = 0.12;
const TARGET_LERP = 0.18;

const FALL_LIMIT_Y = -20;

// más fino para subir escalones sin trabarse
const STEP_HEIGHT = 0.25;
const PLAYER_GROUND_EPS = 0.08;

// enemigos
const ENEMY_COUNT = 6;
const ENEMY_SPEED = 2.2;
const ENEMY_ATTACK_RANGE = 1.25;
const ENEMY_DETECT_RANGE = 16;
const ENEMY_CONTACT_DAMAGE = 10;
const ENEMY_ATTACK_COOLDOWN = 1.0;

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

const cameraTarget = new THREE.Vector3();
const cameraDesired = new THREE.Vector3();

let activeAttack = null;
const enemies = [];

// =====================================================
// PLAYER DATA
// =====================================================
const player = {
  maxLife: 100,
  life: 100,
  invulTime: 0
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

function updateStatusLabel(label) {
  setStatus(`
    Actual: <b>${label}</b><br>
    WASD mover · Shift correr · Espacio saltar<br>
    1-6 ataques · 7 cubrirse · F ataque rápido<br>
    Mouse cámara · Q/E zoom · Flechas cámara · N/M niebla · Z/X luz
  `);
}

function isOneShotType(type) {
  return type === "attack" || type === "quickAttack" || type === "jump";
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
// ANIMACIONES
// =====================================================
function beginAttack(meta) {
  activeAttack = {
    key: meta.key,
    damage: meta.damage ?? 10,
    range: meta.range ?? 1.6,
    hitStart: meta.hitStart ?? 0.12,
    hitEnd: meta.hitEnd ?? 0.34,
    hasHit: false
  };
}

function clearAttack() {
  activeAttack = null;
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
    ["f", "Ataque rápido"]
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

      if (actionLocked) queuedActionKey = key;
      else playAnimation(key);
    });
    $buttons.appendChild(btn);
  }
}

// =====================================================
// COLISIONES
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

// forward corregido: ya no va invertido
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

// side vector corregido
function getSideVector() {
  const forward = getForwardVector().clone();
  return new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();
}

function getMoveSpeed() {
  if (currentActionKey === BLOCK_KEY) return BLOCK_MOVE_SPEED;
  if (ATTACK_KEYS.includes(currentActionKey) || currentActionKey === QUICK_KEY) {
    return ATTACK_MOVE_SPEED;
  }
  return (keys["shift"] || keys["shiftleft"] || keys["shiftright"])
    ? RUN_SPEED
    : WALK_SPEED;
}

function movePlayerHorizontal(deltaTime) {
  let inputX = 0;
  let inputZ = 0;

  if (keys["w"]) inputZ += 1;
  if (keys["s"]) inputZ -= 1;
  if (keys["a"]) inputX -= 1;
  if (keys["d"]) inputX += 1;

  if (inputX === 0 && inputZ === 0) return false;

  const moveInput = new THREE.Vector3(inputX, 0, inputZ).normalize();

  const forward = getForwardVector().clone();
  const right = getSideVector().clone();

  // composición más estable del vector de movimiento
  const moveDir = new THREE.Vector3();
  moveDir.x = forward.x * moveInput.z + right.x * moveInput.x;
  moveDir.z = forward.z * moveInput.z + right.z * moveInput.x;

  if (moveDir.lengthSq() === 0) return false;
  moveDir.normalize();

  const speed = getMoveSpeed();
  const moveDistance = speed * deltaTime;
  const moveDelta = moveDir.clone().multiplyScalar(moveDistance);

  const oldStart = playerCollider.start.clone();
  const oldEnd = playerCollider.end.clone();

  // intento normal
  playerCollider.translate(moveDelta);
  let hit = worldOctree.capsuleIntersect(playerCollider);

  if (hit) {
    playerCollider.start.copy(oldStart);
    playerCollider.end.copy(oldEnd);

    // intento de escalón
    playerCollider.translate(new THREE.Vector3(0, STEP_HEIGHT, 0));
    playerCollider.translate(moveDelta);

    let stepHit = worldOctree.capsuleIntersect(playerCollider);

    if (stepHit) {
      // restaurar
      playerCollider.start.copy(oldStart);
      playerCollider.end.copy(oldEnd);

      // deslizar sobre la pared usando la normal del primer choque
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
      // si logró subir, baja suave para ajustarse al piso
      playerCollider.translate(new THREE.Vector3(0, -STEP_HEIGHT, 0));
      playerCollisions();
    }
  }

  // rotación suave
  const targetAngle = Math.atan2(moveDir.x, moveDir.z);
  character.rotation.y = angleLerp(character.rotation.y, targetAngle, 0.2);

  return true;
}

// =====================================================
// COMBATE
// =====================================================
function getAttackProgress() {
  if (!activeAttack || !currentAction) return 0;
  const clip = currentAction.getClip();
  if (!clip || clip.duration <= 0) return 0;
  return currentAction.time / clip.duration;
}

function damageEnemy(enemy, damage, knockbackDir) {
  if (enemy.dead) return;
  enemy.life -= damage;
  enemy.hitCooldown = 0.2;
  enemy.velocity.addScaledVector(knockbackDir, 5);

  enemy.lifeBar.style.width = `${clamp((enemy.life / enemy.maxLife) * 100, 0, 100)}%`;

  if (enemy.life <= 0) {
    enemy.dead = true;
    enemy.mesh.visible = false;
    enemy.lifeWrap.style.display = "none";
    updateEnemyHUD();
  }
}

function updateAttackHits() {
  if (!activeAttack || !character || activeAttack.hasHit) return;

  const progress = getAttackProgress();
  if (progress < activeAttack.hitStart || progress > activeAttack.hitEnd) return;

  const playerPos = character.position.clone();
  const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(character.quaternion).normalize();

  for (const enemy of enemies) {
    if (enemy.dead) continue;

    const toEnemy = enemy.mesh.position.clone().sub(playerPos);
    const dist = toEnemy.length();
    if (dist > activeAttack.range) continue;

    toEnemy.y = 0;
    if (toEnemy.lengthSq() === 0) continue;
    toEnemy.normalize();

    const facing = forward.dot(toEnemy);
    if (facing < 0.15) continue;

    damageEnemy(enemy, activeAttack.damage, forward);
    activeAttack.hasHit = true;
    break;
  }
}

function damagePlayer(amount) {
  if (player.invulTime > 0) return;

  if (holdBlockRequested || currentActionKey === BLOCK_KEY) {
    amount *= 0.25;
  }

  player.life = Math.max(0, player.life - amount);
  player.invulTime = 0.5;
  updatePlayerHUD();

  if (player.life <= 0) {
    player.life = player.maxLife;
    updatePlayerHUD();

    playerCollider.start.set(0, PLAYER_RADIUS + 0.05, 0);
    playerCollider.end.set(0, PLAYER_HEIGHT + 0.05, 0);
    playerVelocity.set(0, 0, 0);
  }
}

// =====================================================
// ENEMIGOS
// =====================================================
function createEnemy(x, z) {
  const mesh = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.35, 1.0, 4, 8),
    new THREE.MeshStandardMaterial({
      color: 0xb33b3b,
      roughness: 0.75,
      metalness: 0.08
    })
  );
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.position.set(x, 0.9, z);
  scene.add(mesh);

  const lifeWrap = document.createElement("div");
  lifeWrap.style.position = "fixed";
  lifeWrap.style.width = "44px";
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

  return {
    mesh,
    velocity: new THREE.Vector3(),
    life: 50,
    maxLife: 50,
    dead: false,
    hitCooldown: 0,
    attackCooldown: Math.random() * 0.8,
    lifeWrap,
    lifeBar
  };
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

function updateEnemyBillboards() {
  for (const enemy of enemies) {
    if (enemy.dead) continue;

    const pos = enemy.mesh.position.clone();
    pos.y += 1.6;
    pos.project(camera);

    const x = (pos.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-pos.y * 0.5 + 0.5) * window.innerHeight;

    enemy.lifeWrap.style.left = `${x - 22}px`;
    enemy.lifeWrap.style.top = `${y - 20}px`;
  }
}

function updateEnemies(dt) {
  if (!character) return;

  const playerPos = character.position.clone();

  for (const enemy of enemies) {
    if (enemy.dead) continue;

    enemy.hitCooldown = Math.max(0, enemy.hitCooldown - dt);
    enemy.attackCooldown = Math.max(0, enemy.attackCooldown - dt);

    const toPlayer = playerPos.clone().sub(enemy.mesh.position);
    const flat = toPlayer.clone();
    flat.y = 0;

    const dist = flat.length();

    if (dist > 0.001) {
      flat.normalize();
      enemy.mesh.rotation.y = Math.atan2(flat.x, flat.z);
    }

    if (dist < ENEMY_DETECT_RANGE && dist > ENEMY_ATTACK_RANGE) {
      enemy.velocity.addScaledVector(flat, ENEMY_SPEED * dt);
    }

    enemy.velocity.multiplyScalar(0.9);
    enemy.mesh.position.addScaledVector(enemy.velocity, dt);

    const enemyCapsule = new Capsule(
      new THREE.Vector3(enemy.mesh.position.x, 0.35, enemy.mesh.position.z),
      new THREE.Vector3(enemy.mesh.position.x, 1.75, enemy.mesh.position.z),
      0.35
    );

    const result = worldOctree.capsuleIntersect(enemyCapsule);
    if (result) {
      enemy.mesh.position.add(result.normal.multiplyScalar(result.depth));
    }

    if (enemy.mesh.position.y < 0.9) enemy.mesh.position.y = 0.9;

    if (dist <= ENEMY_ATTACK_RANGE && enemy.attackCooldown <= 0) {
      damagePlayer(ENEMY_CONTACT_DAMAGE);
      enemy.attackCooldown = ENEMY_ATTACK_COOLDOWN;
    }
  }

  updateEnemyBillboards();
}

// =====================================================
// PLAYER UPDATE
// =====================================================
function updatePlayer(deltaTime) {
  if (!character) return;

  player.invulTime = Math.max(0, player.invulTime - deltaTime);

  if (!playerOnFloor) {
    playerVelocity.y -= GRAVITY * deltaTime;
  } else {
    playerVelocity.y = Math.max(0, playerVelocity.y);
  }

  if ((keys[" "] || keys["space"]) && playerOnFloor && !actionLocked) {
    playerVelocity.y = JUMP_SPEED;
    playerOnFloor = false;
    playAnimation(JUMP_KEY);
  }

  for (const atkKey of ATTACK_KEYS) {
    if (keys[atkKey]) {
      if (playerOnFloor && currentActionKey !== atkKey) {
        if (actionLocked) queuedActionKey = atkKey;
        else playAnimation(atkKey);
      }
      keys[atkKey] = false;
    }
  }

  if (keys["f"]) {
    if (playerOnFloor && currentActionKey !== QUICK_KEY) {
      if (actionLocked) queuedActionKey = QUICK_KEY;
      else playAnimation(QUICK_KEY);
    }
    keys["f"] = false;
  }

  holdBlockRequested = !!keys[BLOCK_KEY];

  if (holdBlockRequested && playerOnFloor) {
    if (!actionLocked || currentActionKey !== BLOCK_KEY) {
      playAnimation(BLOCK_KEY, 0.08, true);
    }
  } else if (currentActionKey === BLOCK_KEY) {
    actionLocked = false;
  }

  const wasMoving = movePlayerHorizontal(deltaTime);

  tempVector.copy(playerVelocity).multiplyScalar(deltaTime);
  playerCollider.translate(tempVector);

  playerCollisions();

  // suaviza micro-trabas
  playerVelocity.multiplyScalar(0.98);

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

  updateAttackHits();

  if (!playerOnFloor && playerVelocity.y < -2) {
    if (currentActionKey !== JUMP_KEY) playAnimation(JUMP_KEY, 0.08, true);
    return;
  }

  if (holdBlockRequested) {
    if (currentActionKey !== BLOCK_KEY) playAnimation(BLOCK_KEY, 0.08, true);
    return;
  }

  if (actionLocked && (ATTACK_KEYS.includes(currentActionKey) || currentActionKey === QUICK_KEY)) {
    return;
  }

  const running = !!(keys["shift"] || keys["shiftleft"] || keys["shiftright"]);

  if (wasMoving && running) {
    playAnimation(RUN_KEY);
  } else if (wasMoving) {
    playAnimation(WALK_KEY);
  } else {
    playAnimation(IDLE_KEY);
  }
}

// =====================================================
// CÁMARA
// =====================================================
function updateThirdPersonCamera() {
  if (!character) return;

  const charPos = character.position.clone();
  const forward = new THREE.Vector3(0, 0, 1)
    .applyQuaternion(character.quaternion)
    .normalize();

  cameraTarget.set(
    charPos.x,
    charPos.y + CAMERA_HEIGHT,
    charPos.z
  );

  cameraDesired
    .copy(cameraTarget)
    .addScaledVector(forward, -CAMERA_DISTANCE)
    .add(new THREE.Vector3(0, 1.8, 0));

  controls.target.lerp(cameraTarget, TARGET_LERP);
  camera.position.lerp(cameraDesired, CAMERA_LERP);
}

function updateCameraKeyboard(dt) {
  const rotateSpeed = 1.2;
  const zoomSpeed = 4.5;

  if (keys["arrowleft"]) {
    camera.position.sub(controls.target);
    camera.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotateSpeed * dt);
    camera.position.add(controls.target);
  }

  if (keys["arrowright"]) {
    camera.position.sub(controls.target);
    camera.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), -rotateSpeed * dt);
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
// INIT
// =====================================================
async function init() {
  buildButtons();
  updatePlayerHUD();

  setStatus("Cargando escenario...");
  await loadScenario();

  setStatus("Cargando personaje...");
  try {
    character = await loadFBX(BASE_CHARACTER);
  } catch ({ url, err }) {
    showError(
      `No se pudo cargar el personaje: ${url}\n\n` +
      `Error: ${err?.message || err}`
    );
    throw err;
  }

  character.traverse((obj) => {
    if (obj.isMesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
      if (obj.material) obj.material.side = THREE.FrontSide;
    }
  });

  normalizeCharacter(character);
  scene.add(character);

  mixer = new THREE.AnimationMixer(character);
  hookAnimationFinished();

  for (let i = 0; i < ANIMS.length; i++) {
    const meta = ANIMS[i];
    setStatus(`Cargando animaciones... <b>${i + 1}/${ANIMS.length}</b><br>${meta.name}`);

    let fbxAnim;
    try {
      fbxAnim = await loadFBX(meta.file);
    } catch ({ url, err }) {
      showError(
        `No se pudo cargar la animación: ${url}\n\n` +
        `Error: ${err?.message || err}`
      );
      throw err;
    }

    const clip = getFirstClip(fbxAnim);
    if (!clip) {
      showError(`El archivo no trae clip de animación: ${meta.file}`);
      throw new Error("FBX sin clip");
    }

    clip.name = meta.name;
    const action = mixer.clipAction(clip);
    actions.set(meta.key, { action, meta });
  }

  playerCollider.start.set(0, PLAYER_RADIUS + 0.05, 0);
  playerCollider.end.set(0, PLAYER_HEIGHT + 0.05, 0);

  spawnEnemies();
  playAnimation(IDLE_KEY, 0.01, true);

  window.addEventListener("keydown", (e) => {
    keys[e.key.toLowerCase()] = true;
    keys[e.code.toLowerCase()] = true;
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

  const deltaTime = Math.min(clock.getDelta(), 0.05);

  if (mixer) mixer.update(deltaTime);

  updatePlayer(deltaTime);
  updateEnemies(deltaTime);
  updateThirdPersonCamera();
  updateCameraKeyboard(deltaTime);

  controls.update();
  renderer.render(scene, camera);
}

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

init().catch((err) => console.error(err));