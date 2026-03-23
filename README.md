# Juego de Combate 3D con Three.js

## Descripción

Este proyecto es un juego de combate en tercera persona desarrollado con **Three.js**, en el que el jugador controla a un personaje 3D dentro de un escenario con colisiones físicas, enemigos con inteligencia artificial básica y un sistema de combate dinámico.

El objetivo principal es derrotar a todos los enemigos del escenario utilizando ataques, bloqueo, esquive, administración de stamina y lock-on.

---

## Características principales

### Jugador
- Movimiento en tercera persona con **W, A, S, D**
- **Sprint** con Shift
- **Salto** con barra espaciadora
- Sistema de **vida**
- Sistema de **stamina**
- **Bloqueo** de ataques
- **Esquive** con i-frames
- **Lock-on** sobre enemigos
- Combos de ataque
- Ataque rápido

### Combate
- 6 ataques principales
- 1 ataque rápido
- Sistema de detección de impacto por:
  - distancia
  - cono de ataque
  - prioridad de objetivo
- Knockback en enemigos
- Slow motion al impactar
- Trails visuales en ataques
- Partículas de impacto
- Texto de daño flotante
- Finisher visual al derrotar enemigos

### Enemigos
- IA básica con persecución
- Separación entre enemigos para evitar que se encimen
- Ataques cuerpo a cuerpo
- Barra de vida individual
- Reacción al daño
- Eliminación al quedarse sin vida

### Entorno y cámara
- Escenario 3D cargado en formato GLTF
- Colisiones físicas mediante **Octree** y **Capsule**
- Cámara en tercera persona con:
  - interpolación suave
  - colisión con paredes
  - zoom dinámico en combate
  - modo lock-on

### Interfaz
- HUD de vida y stamina
- Contador de enemigos vivos
- Indicador de lock-on
- Indicador de combo
- Mensajes en pantalla
- Pantalla de victoria

---

## Tecnologías utilizadas

- **Three.js**
- **JavaScript**
- **FBXLoader**
- **GLTFLoader**
- **OrbitControls**
- **Octree**
- **Capsule**
- **SkeletonUtils**

---

## Estructura general del proyecto

```bash
assets/
│
├── models/
│   ├── Paladin WProp J Nordstrom.fbx
│   ├── Idle.fbx
│   ├── Walking.fbx
│   ├── Unarmed Run Forward.fbx
│   ├── Jumping Up.fbx
│   ├── Great Sword Slash.fbx
│   ├── Sword And Shield Attack.fbx
│   ├── Stepping Backward.fbx
│   ├── Sword And Shield Turn.fbx
│   ├── Great Sword Strafe.fbx
│   ├── Great Sword Attack.fbx
│   ├── Draw A Great Sword 2.fbx
│   ├── Sword And Shield Crouch Block Idle.fbx
│   ├── collision-world.glb
│   └── enemies/
│       ├── Ch10_nonPBR.fbx
│       ├── Zombie Attack.fbx
│       └── Zombie Punching.fbx
│
└── scenarios/
    └── castle/
        └── scene.gltf
