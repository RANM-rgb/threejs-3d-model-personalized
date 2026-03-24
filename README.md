# ⚔️ SHADOW ARENA

### Juego 3D de combate en tiempo real con Three.js

---

## 🎮 Descripción

**Shadow Arena** es un videojuego 3D desarrollado con **Three.js** que combina mecánicas de combate cuerpo a cuerpo, inteligencia artificial de enemigos, físicas básicas y efectos visuales avanzados en un entorno tipo arena/castillo.

El jugador controla un personaje capaz de ejecutar múltiples ataques, esquivar, bloquear y enfrentarse a oleadas de enemigos hasta llegar a un **boss final**, todo mientras administra vida, stamina y posicionamiento estratégico.

---

## 🚀 Características principales

### ⚔️ Sistema de combate

* ✔️ 6 ataques distintos con animaciones independientes
* ✔️ Ataque rápido adicional
* ✔️ Sistema de combos dinámico
* ✔️ Knockback y detección por cono de ataque
* ✔️ Sistema de daño con feedback visual

### 🧠 IA de enemigos

* ✔️ Enemigos con persecución al jugador
* ✔️ Ataques automáticos por proximidad
* ✔️ Sistema de separación entre enemigos
* ✔️ Boss con mayor dificultad y habilidades

### 🧍‍♂️ Movimiento del jugador

* ✔️ Movimiento libre con WASD
* ✔️ Sprint (Shift)
* ✔️ Salto (Espacio)
* ✔️ Esquive con invulnerabilidad (iframes)
* ✔️ Sistema de colisiones con Octree

### 🎯 Sistema de cámara

* ✔️ Cámara en tercera persona dinámica
* ✔️ Lock-on a enemigos
* ✔️ Zoom automático en combate
* ✔️ Interpolación suave

### 💥 Efectos visuales

* ✔️ Partículas de impacto
* ✔️ Trails en ataques
* ✔️ Flash al golpear
* ✔️ Texto de daño flotante
* ✔️ Slow motion en golpes críticos

### 🔊 Audio

* ✔️ Música de fondo dinámica
* ✔️ Efectos de sonido (golpes, pasos, dodge, etc.)
* ✔️ Sistema de audio con THREE.Audio

### 📊 HUD (Interfaz)

* ✔️ Vida y stamina
* ✔️ Puntaje y high score
* ✔️ Contador de enemigos
* ✔️ Sistema de combos
* ✔️ Indicador de objetivo (lock-on)
* ✔️ HUD especial para boss

---

## 🎮 Controles

| Tecla   | Acción           |
| ------- | ---------------- |
| W A S D | Movimiento       |
| Shift   | Correr           |
| Espacio | Saltar           |
| 1 - 6   | Ataques          |
| F       | Ataque rápido    |
| 7       | Bloquear         |
| V       | Esquivar         |
| R       | Lock-on          |
| TAB     | Cambiar objetivo |
| P       | Pausa            |
| T       | Reiniciar        |

---

## 🧱 Tecnologías utilizadas

* 🟦 **Three.js**
* 🎮 WebGL
* ⚙️ JavaScript ES6 Modules
* 🧠 Octree (colisiones)
* 🎞️ FBX / GLTF Animations
* 🔊 THREE.Audio

---

## 🗂️ Estructura del proyecto

```
assets/
│
├── models/
│   ├── Paladin.fbx
│   ├── Attack1.fbx
│   └── ...
│
├── scenarios/
│   └── castle/
│
├── audio/
│   ├── punch.wav
│   ├── dodge.wav
│   ├── victory.wav
│   └── deuslower-atmosphere-dark-fantasy.mp3
│
└── textures/
```

---

## 🧠 Mecánicas del juego

* El jugador debe sobrevivir a múltiples **oleadas (waves)**
* Cada wave incrementa la dificultad
* Al llegar a cierto nivel aparece el **BOSS**
* El juego termina cuando:

  * 💀 el jugador muere
  * 🏆 el boss es derrotado

---

## 📈 Sistema de progreso

* Sistema de puntuación basado en:

  * daño infligido
  * combos
  * kills
* Guardado de **High Score** en `localStorage`

---

## ⚙️ Instalación y ejecución

1. Clona el repositorio:

```bash
git clone https://github.com/tu-usuario/shadow-arena.git
```

2. Abre con VS Code

3. Ejecuta con Live Server o servidor local:

```bash
npx serve
```

4. Abre en navegador:

```
http://localhost:3000
```

---

## ⚠️ Notas importantes

* El audio requiere interacción del usuario (click) para activarse
* Algunos modelos FBX pueden requerir versiones compatibles
* Se recomienda usar **Chrome o Edge**

---

## 🧪 Posibles mejoras futuras

* 🎯 Sistema de armas equipables
* 🧟 Más tipos de enemigos
* 🌍 Múltiples escenarios
* 🎵 Música dinámica por estado del juego
* 🧠 IA más avanzada
* 🕹️ Soporte para control/gamepad
* 💾 Sistema de guardado

---

## 👨‍💻 Autor

**Jennifer Paola Verde Espitia**
Ingeniería en Tecnologías de la Información y Comunicaciones (ITICS)

---

## 🏆 Créditos

* Mixamo (animaciones)
* Three.js
* Sketchfab (modelos 3D)

---

## ⭐ Demo

Puedes desplegar el proyecto en:

* GitHub Pages
* Netlify
* Vercel

---

## 💥 Frase del proyecto

> “No es solo sobrevivir… es dominar la arena.”

---
