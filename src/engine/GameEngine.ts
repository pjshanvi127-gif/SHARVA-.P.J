/**
 * GameEngine - Core 3D Voxel Engine & Physics Loop
 */

import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  VoxelWorld,
  WORLD_X,
  WORLD_Y,
  WORLD_Z,
  STARTER_COTTAGE_X,
  STARTER_COTTAGE_Z,
} from '../world/voxelWorld';
import { ParticleSystem } from '../world/particles';
import { PlayerArm } from '../entities/playerArm';
import { BotAvatar } from '../entities/bots';
import { VoxelFish } from '../entities/fish';
import { VoxelZombie } from '../entities/zombie';
import { sounds } from '../audio/soundEngine';
import {
  BlockType,
  CharacterSkin,
  GameMode,
  GameState,
  GameStats,
  ChatMessage,
} from '../types/game';
import {
  BLOCK_REGISTRY,
  CHARACTER_SKINS,
  DEFAULT_HOTBAR_BLOCKS,
} from '../world/blockDefinitions';

export class GameEngine {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public container: HTMLElement;
  public world: VoxelWorld;
  public particles: ParticleSystem;
  public arm: PlayerArm;
  public bots: BotAvatar[] = [];
  public fishes: VoxelFish[] = [];
  public zombies: VoxelZombie[] = [];
  private wasNight: boolean = false;
  private zombieSpawnTimer: number = 0;

  // Environment & Lights
  public ambientLight: THREE.AmbientLight;
  public directionalLight: THREE.DirectionalLight;
  public hemiLight: THREE.HemisphereLight;
  public sunMesh: THREE.Mesh;
  public moonMesh: THREE.Mesh;
  public cloudsGroup: THREE.Group;
  public starsPoints: THREE.Points;

  // Player State
  public player = {
    position: new THREE.Vector3(18, 12, 18),
    velocity: new THREE.Vector3(),
    onGround: false,
    height: 1.68,
    radius: 0.32,
    walkSpeed: 6.5,
    sprintSpeed: 9.8,
    jumpSpeed: 7.8,
    isFlying: false,
    flySpeed: 10.0,
  };
  public yaw = 0;
  public pitch = 0;
  public health = 10;
  public maxHealth = 10;
  public hunger = 10;
  public activeSkin: CharacterSkin = CHARACTER_SKINS[0];
  public hotbar: BlockType[] = [...DEFAULT_HOTBAR_BLOCKS];
  public selectedSlot: number = 0;
  public gameMode: GameMode = 'survival';
  public gameState: GameState = 'title';

  // Raycast & Target
  private raycaster = new THREE.Raycaster();
  public targetBlockPos: THREE.Vector3 | null = null;
  public targetPlacePos: THREE.Vector3 | null = null;
  private selectionOutlineBox: THREE.LineSegments;

  // Day / Night System
  public dayTimeRatio = 0.25; // 0.25 = 6:00 AM Sunrise
  public dayDuration = 240; // 4 minutes full cycle
  public isSleeping = false;

  // Input & Camera Shake
  private keyMap: Record<string, boolean> = {};
  public touchMoveVector = new THREE.Vector2(0, 0);
  public isPointerLocked = false;
  private cameraShake = 0;
  private lastStepSoundTime = 0;
  private lastSpacePressTime = 0;

  // Title Screen Cinematic Orbit
  private titleAngle = 0;

  // Software WebGL Detection
  private isSoftwareGl: boolean;

  // Frame Timing & FPS
  private frameId: number = 0;
  private lastTime: number = performance.now();
  private frameCount: number = 0;
  private currentFps: number = 60;
  private lastFpsUpdate: number = performance.now();

  // Callbacks to React
  public onStatsUpdate?: (stats: GameStats) => void;
  public onChatMessage?: (msg: ChatMessage) => void;
  public onStateChange?: (state: GameState) => void;

  constructor(container: HTMLElement) {
    this.container = container;

    // 1. Detect Software WebGL
    this.isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // 2. Initialize Three.js Scene & Camera
    this.scene = new THREE.Scene();
    const skyColor = new THREE.Color(0x87ceeb);
    this.scene.background = skyColor;
    this.scene.fog = new THREE.FogExp2(0x87ceeb, 0.016);

    this.camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      250
    );
    this.camera.position.copy(this.player.position);
    this.scene.add(this.camera);

    // 3. Renderer with Three.js r160+ directives
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(this.renderer.domElement);

    // 4. RoomEnvironment for Studio PBR Reflections
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 5. Lighting Setup: Warm Key light + Cool Hemisphere fill
    this.hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x4e3629, 0.55);
    this.scene.add(this.hemiLight);

    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.35);
    this.scene.add(this.ambientLight);

    this.directionalLight = new THREE.DirectionalLight(0xfff5e6, 0.95);
    this.directionalLight.castShadow = !this.isSoftwareGl;
    if (!this.isSoftwareGl) {
      this.directionalLight.shadow.mapSize.width = 1024;
      this.directionalLight.shadow.mapSize.height = 1024;
      this.directionalLight.shadow.camera.near = 0.5;
      this.directionalLight.shadow.camera.far = 140;
      const d = 36;
      this.directionalLight.shadow.camera.left = -d;
      this.directionalLight.shadow.camera.right = d;
      this.directionalLight.shadow.camera.top = d;
      this.directionalLight.shadow.camera.bottom = -d;
      this.directionalLight.shadow.bias = -0.0005;
      this.directionalLight.shadow.normalBias = 0.02;
    }
    this.scene.add(this.directionalLight);

    // Celestial Sun & Moon
    const sunGeom = new THREE.SphereGeometry(2.5, 12, 12);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xffea00 });
    this.sunMesh = new THREE.Mesh(sunGeom, sunMat);
    this.scene.add(this.sunMesh);

    const moonGeom = new THREE.SphereGeometry(1.8, 12, 12);
    const moonMat = new THREE.MeshBasicMaterial({ color: 0xe0e6ed });
    this.moonMesh = new THREE.Mesh(moonGeom, moonMat);
    this.scene.add(this.moonMesh);

    // Starfield for night sky
    this.starsPoints = this.buildStarfield();
    this.scene.add(this.starsPoints);

    // Floating Voxel Clouds
    this.cloudsGroup = this.buildClouds();
    this.scene.add(this.cloudsGroup);

    // Target Selection Outline Box
    const outlineGeom = new THREE.BoxGeometry(1.01, 1.01, 1.01);
    const outlineMat = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 });
    this.selectionOutlineBox = new THREE.LineSegments(
      new THREE.EdgesGeometry(outlineGeom),
      outlineMat
    );
    this.selectionOutlineBox.visible = false;
    this.scene.add(this.selectionOutlineBox);

    // 6. Sub-systems: VoxelWorld & Particles & PlayerArm
    this.world = new VoxelWorld(this.scene);
    this.world.generateTerrain();

    this.particles = new ParticleSystem(this.scene);
    this.arm = new PlayerArm(this.activeSkin);
    this.camera.add(this.arm.group);

    // Spawn articulated bots & swimming water fish
    this.spawnBots();
    this.spawnFishes();

    // Place player safely on ground just outside the starter cottage facing the mountains
    const startX = STARTER_COTTAGE_X + 2;
    const startZ = STARTER_COTTAGE_Z + 8;
    const groundY = this.world.getHighestSolidBlock(startX, startZ) + 1;
    this.player.position.set(startX + 0.5, groundY, startZ + 0.5);
    this.camera.position.copy(this.player.position).add(new THREE.Vector3(0, this.player.height, 0));

    // Bind event handlers
    this.bindEvents();

    // Start render loop
    this.startLoop();
  }

  // Build twinkling night starfield
  private buildStarfield(): THREE.Points {
    const starCount = 350;
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const radius = 120 + Math.random() * 40;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = Math.abs(radius * Math.cos(phi)) + 15; // upper hemisphere
      positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
    }
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 1.5,
      transparent: true,
      opacity: 0,
    });
    return new THREE.Points(geom, mat);
  }

  // Build floating stylized voxel clouds drifting over the mountains
  private buildClouds(): THREE.Group {
    const clouds = new THREE.Group();
    const cloudMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.78,
    });

    for (let i = 0; i < 22; i++) {
      const w = 5 + Math.floor(Math.random() * 6);
      const d = 5 + Math.floor(Math.random() * 6);
      const h = 1.4;
      const geom = new THREE.BoxGeometry(w, h, d);
      const mesh = new THREE.Mesh(geom, cloudMat);
      mesh.position.set(
        Math.random() * WORLD_X * 1.5 - WORLD_X * 0.25,
        WORLD_Y + 5 + Math.random() * 4,
        Math.random() * WORLD_Z * 1.5 - WORLD_Z * 0.25
      );
      clouds.add(mesh);
    }
    return clouds;
  }

  // Spawn online multiplayer bots
  private spawnBots() {
    const botData = [
      {
        name: 'Alex_Explorer',
        shirtColor: 0x4caf50,
        pantsColor: 0x5d4037,
        skinColor: 0xffdbac,
        initialPos: new THREE.Vector3(22, 10, 24),
      },
      {
        name: 'BuilderBob',
        shirtColor: 0xff9800,
        pantsColor: 0x263238,
        skinColor: 0xffcc99,
        initialPos: new THREE.Vector3(30, 10, 22),
      },
      {
        name: 'MinerDave',
        shirtColor: 0x2196f3,
        pantsColor: 0x3e2723,
        skinColor: 0xffd1a4,
        initialPos: new THREE.Vector3(28, 10, 32),
      },
    ];

    botData.forEach((cfg) => {
      const hy =
        this.world.getHighestSolidBlock(
          Math.floor(cfg.initialPos.x),
          Math.floor(cfg.initialPos.z)
        ) + 1;
      cfg.initialPos.y = hy;
      const bot = new BotAvatar(cfg, this.world);
      bot.onChat = (sender, text) => {
        if (this.onChatMessage) {
          this.onChatMessage({
            id: Math.random().toString(36).substring(2, 9),
            sender,
            text,
            senderColor: '#34d399',
            timestamp: Date.now(),
          });
        }
      };
      this.scene.add(bot.group);
      this.bots.push(bot);
    });
  }

  // Spawn swimming fish inside water pools
  private spawnFishes() {
    // Collect coordinates of water blocks
    const waterCoords: THREE.Vector3[] = [];
    for (let x = 2; x < WORLD_X - 2; x += 2) {
      for (let z = 2; z < WORLD_Z - 2; z += 2) {
        for (let y = 2; y <= 4; y++) {
          if (this.world.getBlock(x, y, z) === BlockType.WATER) {
            waterCoords.push(new THREE.Vector3(x + 0.5, y + 0.5, z + 0.5));
          }
        }
      }
    }

    const fishPalettes = [
      { color: 0xff7043, finColor: 0xffffff }, // Clownfish Orange & White
      { color: 0x0288d1, finColor: 0xfdd835 }, // Blue Tang with Yellow fin
      { color: 0xec407a, finColor: 0xf48fb1 }, // Pink Salmon
      { color: 0xffb300, finColor: 0xffe082 }, // Golden Koi
      { color: 0x26a69a, finColor: 0x80cbc4 }, // Turquoise Tropical
      { color: 0x7e57c2, finColor: 0xb39ddb }, // Royal Violet
      { color: 0xe53935, finColor: 0xff5252 }, // Ruby Guppy
      { color: 0x43a047, finColor: 0x81c784 }, // Emerald Minnow
    ];

    const spawnCount = Math.max(6, Math.min(10, waterCoords.length > 0 ? waterCoords.length : 8));
    for (let i = 0; i < spawnCount; i++) {
      const pos =
        waterCoords.length > 0
          ? waterCoords[i % waterCoords.length].clone()
          : new THREE.Vector3(8 + (i % 3) * 4, 3.2, 8 + Math.floor(i / 3) * 4);
      pos.y = 3.2; // Optimal swimming level beneath surface

      const palette = fishPalettes[i % fishPalettes.length];
      const fish = new VoxelFish(
        {
          color: palette.color,
          finColor: palette.finColor,
          initialPos: pos,
        },
        this.world
      );

      this.scene.add(fish.group);
      this.fishes.push(fish);
    }
  }

  // Spawn hostile zombie wave in the vicinity of the player
  public spawnZombieWave(count: number) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 14 + Math.random() * 10;
      const sx = Math.floor(this.player.position.x + Math.cos(angle) * dist);
      const sz = Math.floor(this.player.position.z + Math.sin(angle) * dist);

      if (sx >= 2 && sx < WORLD_X - 2 && sz >= 2 && sz < WORLD_Z - 2) {
        const sy = this.world.getHighestSolidBlock(sx, sz) + 1;
        const blockAt = this.world.getBlock(sx, sy - 1, sz);
        // Avoid spawning directly inside deep water
        if (blockAt !== BlockType.WATER && sy > 4) {
          const zombie = new VoxelZombie(new THREE.Vector3(sx + 0.5, sy, sz + 0.5), this.world);
          this.scene.add(zombie.group);
          this.zombies.push(zombie);
        }
      }
    }
  }

  // Raycast against hostile zombies for melee attack
  public checkZombieRaycast(): VoxelZombie | null {
    this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    const ray = this.raycaster.ray;
    const maxReach = 4.2;

    let closestZombie: VoxelZombie | null = null;
    let closestDist = maxReach;

    for (const zombie of this.zombies) {
      if (zombie.isDead) continue;
      // Approximate center of zombie body at waist / chest (Y + 0.9)
      const zombieCenter = zombie.position.clone().add(new THREE.Vector3(0, 0.9, 0));
      const distToRay = ray.distanceToPoint(zombieCenter);
      if (distToRay < 0.85) {
        const distAlongRay = ray.origin.distanceTo(zombieCenter);
        if (distAlongRay < closestDist) {
          closestDist = distAlongRay;
          closestZombie = zombie;
        }
      }
    }
    return closestZombie;
  }

  // Nighttime Zombie Mob Management (Spawning, Pursuing & Sunrise Burning)
  private updateHostileMobs(delta: number) {
    const hours = this.dayTimeRatio * 24;
    const isNight = hours >= 18 || hours <= 6;

    // Transition into nighttime
    if (isNight && !this.wasNight) {
      this.wasNight = true;
      if (this.onChatMessage) {
        this.onChatMessage({
          id: Math.random().toString(),
          sender: 'Nightfall',
          text: '⚠️ Darkness has fallen! Hostile Zombies are emerging from the shadows...',
          senderColor: '#ef4444',
          timestamp: Date.now(),
        });
      }
      this.spawnZombieWave(5);
    }

    // Periodic reinforcement during night
    if (isNight) {
      this.zombieSpawnTimer -= delta;
      if (this.zombieSpawnTimer <= 0) {
        this.zombieSpawnTimer = 18.0;
        if (this.zombies.length < 6) {
          this.spawnZombieWave(2);
        }
      }
    }

    // Sunrise transition: Burn away remaining monsters
    if (!isNight && this.wasNight) {
      this.wasNight = false;
      if (this.zombies.length > 0) {
        if (this.onChatMessage) {
          this.onChatMessage({
            id: Math.random().toString(),
            sender: 'Sunrise',
            text: '☀️ The morning sun burns away the nighttime monsters!',
            senderColor: '#facc15',
            timestamp: Date.now(),
          });
        }
        for (const z of this.zombies) {
          sounds.playZombieDeath();
          this.particles.spawnExplosionParticles(
            z.position.clone().add(new THREE.Vector3(0, 1.0, 0)),
            18
          );
          this.scene.remove(z.group);
          z.dispose();
        }
        this.zombies = [];
      }
    }

    // Update active zombies
    for (let i = this.zombies.length - 1; i >= 0; i--) {
      const z = this.zombies[i];
      if (z.isDead) {
        this.scene.remove(z.group);
        z.dispose();
        this.zombies.splice(i, 1);
        continue;
      }

      z.update(delta, this.player.position, (damage) => {
        if (this.gameMode === 'survival') {
          this.damagePlayer(damage);
        }
      });
    }
  }

  // Pointer lock & Input events
  private bindEvents() {
    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = document.pointerLockElement === this.container;
      if (!this.isPointerLocked && this.gameState === 'playing') {
        this.setGameState('paused');
      }
    });

    this.container.addEventListener('click', () => {
      if (this.gameState === 'playing' && !this.isPointerLocked) {
        this.requestPointerLock();
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isPointerLocked || this.gameState !== 'playing' || this.isSleeping) return;
      const sensitivity = 0.0022;
      this.yaw -= e.movementX * sensitivity;
      this.pitch -= e.movementY * sensitivity;
      this.pitch = Math.max(-Math.PI / 2 + 0.02, Math.min(Math.PI / 2 - 0.02, this.pitch));

      this.updateCameraRotation();
    });

    window.addEventListener('keydown', (e) => {
      this.keyMap[e.code] = true;

      if (this.gameState === 'playing' && !this.isSleeping) {
        // Hotbar digit keys 1-9
        if (e.code.startsWith('Digit')) {
          const num = parseInt(e.code.replace('Digit', ''));
          if (num >= 1 && num <= 9) {
            this.selectHotbarSlot(num - 1);
          }
        }

        // Toggle Fly in Creative on Space double-tap
        if (e.code === 'Space') {
          const now = performance.now();
          if (now - this.lastSpacePressTime < 300) {
            this.player.isFlying = !this.player.isFlying;
            sounds.playJumpSound();
            if (this.onChatMessage) {
              this.onChatMessage({
                id: Math.random().toString(),
                sender: 'System',
                text: `Flight mode: ${this.player.isFlying ? 'ENABLED' : 'DISABLED'}`,
                senderColor: '#fbbf24',
                timestamp: Date.now(),
              });
            }
          }
          this.lastSpacePressTime = now;
        }

        // Sleep / Bed interaction key 'E'
        if (e.code === 'KeyE') {
          this.trySleepAtBed();
        }
      }

      // Pause toggle
      if (e.code === 'Escape') {
        if (this.gameState === 'playing') {
          this.setGameState('paused');
        } else if (this.gameState === 'paused') {
          this.setGameState('playing');
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keyMap[e.code] = false;
    });

    window.addEventListener('blur', () => {
      this.keyMap = {};
    });

    // Mouse wheel for hotbar selection
    window.addEventListener('wheel', (e) => {
      if (!this.isPointerLocked || this.gameState !== 'playing') return;
      if (e.deltaY > 0) {
        this.selectHotbarSlot((this.selectedSlot + 1) % 9);
      } else {
        this.selectHotbarSlot((this.selectedSlot - 1 + 9) % 9);
      }
    });

    // Mining (L-Click) & Placing (R-Click)
    window.addEventListener('mousedown', (e) => {
      if (!this.isPointerLocked || this.gameState !== 'playing' || this.isSleeping) return;

      if (e.button === 0) {
        // Left Click: Attack Zombie or Break Block
        this.performMineOrAttack();
      } else if (e.button === 2) {
        // Right Click: Place block or trigger Bed / TNT
        this.arm.triggerSwing();

        // Check if targeted block is interactable (e.g. Bed or TNT)
        if (this.targetBlockPos) {
          const hitType = this.world.getBlock(
            this.targetBlockPos.x,
            this.targetBlockPos.y,
            this.targetBlockPos.z
          );

          if (hitType === BlockType.BED) {
            this.trySleepAtBed();
            return;
          }

          if (hitType === BlockType.TNT) {
            // Ignite TNT explosion!
            this.igniteTNT(this.targetBlockPos.clone());
            return;
          }
        }

        // Place block
        if (this.targetPlacePos) {
          const selectedBlock = this.hotbar[this.selectedSlot];
          if (selectedBlock === BlockType.AIR) return;

          // Bounding box collision check: do not place block inside player
          const pMin = this.player.position
            .clone()
            .sub(new THREE.Vector3(this.player.radius, 0, this.player.radius));
          const pMax = this.player.position
            .clone()
            .add(new THREE.Vector3(this.player.radius, this.player.height, this.player.radius));

          const bMin = this.targetPlacePos.clone();
          const bMax = this.targetPlacePos.clone().add(new THREE.Vector3(1, 1, 1));

          const intersects =
            pMin.x < bMax.x &&
            pMax.x > bMin.x &&
            pMin.y < bMax.y &&
            pMax.y > bMin.y &&
            pMin.z < bMax.z &&
            pMax.z > bMin.z;

          if (!intersects) {
            this.world.setBlock(
              this.targetPlacePos.x,
              this.targetPlacePos.y,
              this.targetPlacePos.z,
              selectedBlock
            );
            const def = BLOCK_REGISTRY[selectedBlock];
            sounds.playPlaceSound(def ? def.soundType : 'stone');
          }
        }
      }
    });

    window.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('resize', this.onResize.bind(this));
    window.addEventListener('orientationchange', () => {
      setTimeout(() => this.onResize(), 150);
    });
  }

  // Ignite TNT block with brief fuse, blast radius, camera shake, sound & particles
  public igniteTNT(pos: THREE.Vector3) {
    sounds.playBreakSound('wood');
    this.world.setBlock(pos.x, pos.y, pos.z, BlockType.AIR);

    // Fuse countdown
    setTimeout(() => {
      sounds.playExplosionSound();
      this.cameraShake = 0.45;
      this.particles.spawnExplosionParticles(pos.clone().add(new THREE.Vector3(0.5, 0.5, 0.5)), 45);
      this.world.explodeAt(pos.x, pos.y, pos.z, 3.8);

      // Check damage to player if close
      const dist = this.player.position.distanceTo(pos);
      if (dist < 4.5 && this.gameMode === 'survival') {
        const dmg = Math.max(1, Math.floor((4.5 - dist) * 2));
        this.damagePlayer(dmg);
      }
    }, 600);
  }

  // Sleep interaction
  public trySleepAtBed() {
    const hours = this.dayTimeRatio * 24;
    const isNight = hours >= 18 || hours <= 6;
    if (!isNight) {
      if (this.onChatMessage) {
        this.onChatMessage({
          id: Math.random().toString(),
          sender: 'System',
          text: 'You can only sleep at night or during thunderstorms!',
          senderColor: '#f87171',
          timestamp: Date.now(),
        });
      }
      return;
    }

    this.isSleeping = true;
    sounds.playSleepSound();
    if (this.onStateChange) this.onStateChange('sleeping');

    setTimeout(() => {
      this.dayTimeRatio = 0.25; // 6:00 AM Sunrise
      this.health = this.maxHealth;
      this.hunger = 10;
      this.isSleeping = false;

      // Despawn all nighttime monsters on morning wake
      for (const z of this.zombies) {
        this.scene.remove(z.group);
        z.dispose();
      }
      this.zombies = [];
      this.wasNight = false;

      if (this.onStateChange) this.onStateChange('playing');
      if (this.onChatMessage) {
        this.onChatMessage({
          id: Math.random().toString(),
          sender: 'System',
          text: 'You slept soundly through the night. Health and hunger restored!',
          senderColor: '#34d399',
          timestamp: Date.now(),
        });
      }
    }, 2400);
  }

  // Player damage
  public damagePlayer(amt: number) {
    this.health = Math.max(0, this.health - amt);
    sounds.playHurtSound();
    this.cameraShake = 0.25;

    if (this.health <= 0) {
      if (this.onChatMessage) {
        this.onChatMessage({
          id: Math.random().toString(),
          sender: 'System',
          text: 'You succumbed to your injuries! Respawning at starter cottage...',
          senderColor: '#ef4444',
          timestamp: Date.now(),
        });
      }
      // Respawn at starter cottage in the valley
      const startX = STARTER_COTTAGE_X + 2;
      const startZ = STARTER_COTTAGE_Z + 8;
      const groundY = this.world.getHighestSolidBlock(startX, startZ) + 1;
      this.player.position.set(startX + 0.5, groundY, startZ + 0.5);
      this.player.velocity.set(0, 0, 0);
      this.health = this.maxHealth;
    }
  }

  public selectHotbarSlot(index: number) {
    this.selectedSlot = Math.max(0, Math.min(8, index));
    const block = this.hotbar[this.selectedSlot];
    this.arm.updateHeldBlock(block);
    sounds.playClickSound();
  }

  public setCharacterSkin(skin: CharacterSkin) {
    this.activeSkin = skin;
    this.arm.updateSkin(skin);
    sounds.playClickSound();
  }

  public setGameMode(mode: GameMode) {
    this.gameMode = mode;
    if (mode === 'creative') {
      this.player.isFlying = true;
    } else {
      this.player.isFlying = false;
    }
  }

  // Keep camera orientation strictly straight & level (zero roll slant)
  public updateCameraRotation() {
    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.x = this.pitch;
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.z = 0; // Strictly 0 roll guarantees the picture is straight!
  }

  public setGameState(state: GameState) {
    this.gameState = state;
    if (state === 'playing') {
      this.pitch = 0;
      this.updateCameraRotation();
      this.camera.position
        .copy(this.player.position)
        .add(new THREE.Vector3(0, this.player.height, 0));
      this.requestPointerLock();
    } else {
      if (document.pointerLockElement) {
        document.exitPointerLock();
      }
    }
    if (this.onStateChange) {
      this.onStateChange(state);
    }
  }

  public requestPointerLock() {
    try {
      this.container.requestPointerLock?.();
    } catch {
      // Ignored if blocked
    }
  }

  // Mobile Touch Helpers
  public setTouchMove(vx: number, vz: number) {
    this.touchMoveVector.set(vx, vz);
  }

  public applyTouchLook(dx: number, dy: number) {
    if (this.isSleeping || this.gameState !== 'playing') return;
    const sensitivity = 0.004;
    this.yaw -= dx * sensitivity;
    this.pitch -= dy * sensitivity;
    this.pitch = Math.max(-Math.PI / 2 + 0.02, Math.min(Math.PI / 2 - 0.02, this.pitch));

    this.updateCameraRotation();
  }

  // Unified combat and mining action (works for desktop left-click & mobile MINE button)
  public performMineOrAttack() {
    if (this.gameState !== 'playing' || this.isSleeping) return;
    this.arm.triggerSwing();

    // 1. Prioritize attacking hostile monsters in front of crosshair
    const hitZombie = this.checkZombieRaycast();
    if (hitZombie) {
      const knockback = new THREE.Vector3()
        .subVectors(hitZombie.position, this.player.position)
        .normalize();

      this.particles.spawnBlockBreakParticles(
        hitZombie.position.clone().add(new THREE.Vector3(0, 0.9, 0)),
        0x3d7028,
        14
      );

      const killed = hitZombie.takeDamage(1.5, knockback);
      if (killed) {
        this.particles.spawnExplosionParticles(
          hitZombie.position.clone().add(new THREE.Vector3(0, 1.0, 0)),
          22
        );
        if (this.onChatMessage) {
          this.onChatMessage({
            id: Math.random().toString(),
            sender: 'Combat',
            text: '⚔️ Defeated a hostile Zombie!',
            senderColor: '#4ade80',
            timestamp: Date.now(),
          });
        }
      }
      return;
    }

    // 2. Otherwise mine target block
    if (this.targetBlockPos) {
      const { x, y, z } = this.targetBlockPos;
      const hitType = this.world.getBlock(x, y, z);
      if (hitType !== BlockType.AIR) {
        const def = BLOCK_REGISTRY[hitType];
        sounds.playBreakSound(def ? def.soundType : 'dirt');

        let particleColor = 0x888888;
        if (hitType === BlockType.GRASS) particleColor = 0x5c8e32;
        else if (hitType === BlockType.DIRT) particleColor = 0x614126;
        else if (hitType === BlockType.OAK_WOOD) particleColor = 0x6b5030;
        else if (hitType === BlockType.OAK_LEAVES) particleColor = 0x327022;
        else if (hitType === BlockType.PLANKS) particleColor = 0x9e7943;
        else if (hitType === BlockType.BRICK) particleColor = 0x9c3d2e;
        else if (hitType === BlockType.TNT) particleColor = 0xd32f2f;
        else if (hitType === BlockType.GLOWSTONE) particleColor = 0xf5c35b;
        else if (hitType === BlockType.DIAMOND_ORE) particleColor = 0x40e0d0;

        this.particles.spawnBlockBreakParticles(this.targetBlockPos, particleColor);
        this.world.setBlock(x, y, z, BlockType.AIR);
      }
    }
  }

  public triggerMine() {
    this.performMineOrAttack();
  }

  public triggerPlace() {
    if (this.gameState !== 'playing' || this.isSleeping) return;
    this.arm.triggerSwing();

    if (this.targetBlockPos) {
      const hitType = this.world.getBlock(
        this.targetBlockPos.x,
        this.targetBlockPos.y,
        this.targetBlockPos.z
      );

      if (hitType === BlockType.BED) {
        this.trySleepAtBed();
        return;
      }

      if (hitType === BlockType.TNT) {
        this.igniteTNT(this.targetBlockPos.clone());
        return;
      }
    }

    if (this.targetPlacePos) {
      const selectedBlock = this.hotbar[this.selectedSlot];
      if (selectedBlock === BlockType.AIR) return;

      const pMin = this.player.position
        .clone()
        .sub(new THREE.Vector3(this.player.radius, 0, this.player.radius));
      const pMax = this.player.position
        .clone()
        .add(new THREE.Vector3(this.player.radius, this.player.height, this.player.radius));

      const bMin = this.targetPlacePos.clone();
      const bMax = this.targetPlacePos.clone().add(new THREE.Vector3(1, 1, 1));

      const intersects =
        pMin.x < bMax.x &&
        pMax.x > bMin.x &&
        pMin.y < bMax.y &&
        pMax.y > bMin.y &&
        pMin.z < bMax.z &&
        pMax.z > bMin.z;

      if (!intersects) {
        this.world.setBlock(
          this.targetPlacePos.x,
          this.targetPlacePos.y,
          this.targetPlacePos.z,
          selectedBlock
        );
        const def = BLOCK_REGISTRY[selectedBlock];
        sounds.playPlaceSound(def ? def.soundType : 'stone');
      }
    }
  }

  public triggerJump() {
    if (this.gameState !== 'playing' || this.isSleeping) return;
    if (this.player.isFlying) {
      this.player.velocity.y = this.player.flySpeed;
    } else if (this.player.onGround) {
      this.player.velocity.y = this.player.jumpSpeed;
      this.player.onGround = false;
      sounds.playJumpSound();
    }
  }

  // Raycasting for target block & placement face
  private updateRaycasting() {
    if (this.gameState !== 'playing') {
      this.selectionOutlineBox.visible = false;
      this.targetBlockPos = null;
      this.targetPlacePos = null;
      return;
    }

    this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    const ray = this.raycaster.ray;
    const step = 0.05;
    const reach = 6.2;
    const curr = ray.origin.clone();
    let prevPos: THREE.Vector3 | null = null;
    this.targetBlockPos = null;
    this.targetPlacePos = null;

    for (let d = 0; d < reach; d += step) {
      curr.addScaledVector(ray.direction, step);
      const bx = Math.floor(curr.x);
      const by = Math.floor(curr.y);
      const bz = Math.floor(curr.z);

      const block = this.world.getBlock(bx, by, bz);
      if (block !== BlockType.AIR && block !== BlockType.WATER) {
        this.targetBlockPos = new THREE.Vector3(bx, by, bz);
        this.targetPlacePos = prevPos;
        this.selectionOutlineBox.position.set(bx + 0.5, by + 0.5, bz + 0.5);
        this.selectionOutlineBox.visible = true;
        return;
      }
      prevPos = new THREE.Vector3(bx, by, bz);
    }

    this.selectionOutlineBox.visible = false;
  }

  // Player movement physics & collision resolution
  private updatePhysics(delta: number) {
    const move = new THREE.Vector3();
    const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
    const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);

    if (this.keyMap['KeyW']) move.add(forward);
    if (this.keyMap['KeyS']) move.sub(forward);
    if (this.keyMap['KeyD']) move.add(right);
    if (this.keyMap['KeyA']) move.sub(right);

    // Mobile touch vector
    if (this.touchMoveVector.lengthSq() > 0.01) {
      move.addScaledVector(forward, -this.touchMoveVector.y);
      move.addScaledVector(right, this.touchMoveVector.x);
    }

    const isMoving = move.lengthSq() > 0;
    if (isMoving) move.normalize();

    const isSprinting = !!this.keyMap['ShiftLeft'];
    const currentSpeed = this.player.isFlying
      ? this.player.flySpeed * (isSprinting ? 1.8 : 1.0)
      : isSprinting
      ? this.player.sprintSpeed
      : this.player.walkSpeed;

    this.player.velocity.x = move.x * currentSpeed;
    this.player.velocity.z = move.z * currentSpeed;

    if (this.player.isFlying) {
      let flyY = 0;
      if (this.keyMap['Space']) flyY += currentSpeed;
      if (this.keyMap['ShiftLeft']) flyY -= currentSpeed;
      this.player.velocity.y = flyY;
    } else {
      // Normal Gravity
      this.player.velocity.y -= 24.0 * delta;

      if (this.keyMap['Space'] && this.player.onGround) {
        this.player.velocity.y = this.player.jumpSpeed;
        this.player.onGround = false;
        sounds.playJumpSound();
      }
    }

    // Footstep audio
    if (isMoving && this.player.onGround && !this.player.isFlying) {
      const now = performance.now();
      const stepInterval = isSprinting ? 280 : 420;
      if (now - this.lastStepSoundTime > stepInterval) {
        sounds.playStepSound();
        this.lastStepSoundTime = now;
      }
    }

    // Axis-by-axis collision resolution
    this.resolveCollision(this.player.velocity.x * delta, 0, 0);
    this.resolveCollision(0, this.player.velocity.y * delta, 0);
    this.resolveCollision(0, 0, this.player.velocity.z * delta);

    // Fall safety respawn
    if (this.player.position.y < -15) {
      const startX = Math.floor(WORLD_X / 2);
      const startZ = Math.floor(WORLD_Z / 2);
      this.player.position.set(startX, this.world.getHighestSolidBlock(startX, startZ) + 2, startZ);
      this.player.velocity.set(0, 0, 0);
      sounds.playHurtSound();
    }

    // Camera follow with camera shake
    const shakeOffset = new THREE.Vector3(
      (Math.random() - 0.5) * this.cameraShake,
      (Math.random() - 0.5) * this.cameraShake,
      (Math.random() - 0.5) * this.cameraShake
    );
    this.camera.position
      .copy(this.player.position)
      .add(new THREE.Vector3(0, this.player.height, 0))
      .add(shakeOffset);

    // Keep camera orientation strictly straight & level (zero roll slant)
    this.updateCameraRotation();

    // Decay camera shake
    if (this.cameraShake > 0) {
      this.cameraShake -= delta * 1.5;
      if (this.cameraShake < 0) this.cameraShake = 0;
    }

    // Update First Person Arm
    this.arm.update(delta, isMoving);
  }

  // AABB collision helper
  private resolveCollision(dx: number, dy: number, dz: number) {
    const next = this.player.position.clone().add(new THREE.Vector3(dx, dy, dz));
    const minX = Math.floor(next.x - this.player.radius);
    const maxX = Math.floor(next.x + this.player.radius);
    const minY = Math.floor(next.y);
    const maxY = Math.floor(next.y + this.player.height);
    const minZ = Math.floor(next.z - this.player.radius);
    const maxZ = Math.floor(next.z + this.player.radius);

    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        for (let z = minZ; z <= maxZ; z++) {
          const b = this.world.getBlock(x, y, z);
          if (b !== BlockType.AIR && b !== BlockType.WATER) {
            if (dy < 0) {
              this.player.onGround = true;
              this.player.velocity.y = 0;
            } else if (dy > 0) {
              this.player.velocity.y = 0;
            }
            return; // Block movement along this axis
          }
        }
      }
    }

    if (dy < 0) this.player.onGround = false;
    this.player.position.add(new THREE.Vector3(dx, dy, dz));
  }

  // Day / Night Cycle System
  private updateCelestialLighting(delta: number) {
    if (!this.isSleeping) {
      this.dayTimeRatio = (this.dayTimeRatio + delta / this.dayDuration) % 1.0;
    }

    const angle = this.dayTimeRatio * Math.PI * 2;
    const orbitR = 120;

    // Sun & Moon orbital trajectory
    const cx = WORLD_X / 2;
    const cz = WORLD_Z / 2;

    this.sunMesh.position.set(
      cx + Math.cos(angle) * orbitR,
      Math.sin(angle) * orbitR,
      cz + Math.sin(angle) * 30
    );

    this.moonMesh.position.set(
      cx - Math.cos(angle) * orbitR,
      -Math.sin(angle) * orbitR,
      cz - Math.sin(angle) * 30
    );

    this.directionalLight.position.copy(this.sunMesh.position);

    const isDay = this.sunMesh.position.y > 0;
    const daylightFactor = Math.max(0, Math.min(1, (this.sunMesh.position.y + 15) / 30));

    // Sky & Fog color blend
    const daySky = new THREE.Color(0x87ceeb);
    const nightSky = new THREE.Color(0x060618);
    const sunsetSky = new THREE.Color(0xec5d39);

    let skyCol = new THREE.Color();
    if (daylightFactor > 0.5) {
      skyCol = daySky.clone().lerp(sunsetSky, (1 - daylightFactor) * 0.4);
    } else {
      skyCol = sunsetSky.clone().lerp(nightSky, 1 - daylightFactor * 2);
    }

    this.scene.background = skyCol;
    (this.scene.fog as THREE.FogExp2).color.copy(skyCol);

    this.ambientLight.intensity = 0.15 + 0.55 * daylightFactor;
    this.hemiLight.intensity = 0.2 + 0.6 * daylightFactor;
    this.directionalLight.intensity = 0.1 + 0.85 * daylightFactor;

    // Stars opacity during night
    (this.starsPoints.material as THREE.PointsMaterial).opacity = Math.max(
      0,
      1 - daylightFactor * 1.8
    );

    // Drifting clouds
    this.cloudsGroup.position.x = (this.cloudsGroup.position.x + delta * 0.6) % (WORLD_X * 2);
  }

  // Title screen smooth cinematic camera pan (level, straight, and upright)
  private updateTitleCamera(delta: number) {
    this.titleAngle += delta * 0.1;
    const cx = WORLD_X / 2;
    const cz = WORLD_Z / 2;
    const orbitRadius = 38;
    const eyeLevelY = 17; // Elevated level straight camera height for panoramic view

    this.camera.position.set(
      cx + Math.cos(this.titleAngle) * orbitRadius,
      eyeLevelY,
      cz + Math.sin(this.titleAngle) * orbitRadius
    );
    this.camera.up.set(0, 1, 0);
    this.camera.lookAt(cx, 14, cz);
    this.camera.rotation.z = 0; // Strictly zero roll ensures straight picture
  }

  // Main Render Loop
  private startLoop() {
    const tick = () => {
      this.frameId = requestAnimationFrame(tick);
      const now = performance.now();
      const delta = Math.min((now - this.lastTime) / 1000, 0.05); // Clamp dt to 0.05
      this.lastTime = now;

      // FPS tracking
      this.frameCount++;
      if (now - this.lastFpsUpdate >= 1000) {
        this.currentFps = this.frameCount;
        this.frameCount = 0;
        this.lastFpsUpdate = now;
      }

      // Update world systems
      if (this.gameState === 'title') {
        this.updateTitleCamera(delta);
      } else if (this.gameState === 'playing') {
        this.updatePhysics(delta);
        this.updateRaycasting();
      }

      this.updateCelestialLighting(delta);
      this.particles.update(delta);

      // Update bot multiplayer companions
      for (const bot of this.bots) {
        bot.update(delta);
      }

      // Update water swimming fish
      for (const fish of this.fishes) {
        fish.update(delta, this.player.position);
      }

      // Update nighttime hostile zombie mobs
      this.updateHostileMobs(delta);

      // Render Three.js scene
      this.renderer.render(this.scene, this.camera);

      // Notify React HUD of updated stats
      if (this.onStatsUpdate) {
        const totalHours = Math.floor(this.dayTimeRatio * 24);
        const minutes = Math.floor(((this.dayTimeRatio * 24) % 1) * 60);
        const period = totalHours >= 12 ? 'PM' : 'AM';
        const displayH = totalHours % 12 === 0 ? 12 : totalHours % 12;
        const timeStr = `${displayH.toString().padStart(2, '0')}:${minutes
          .toString()
          .padStart(2, '0')} ${period}`;

        const targetDef = this.targetBlockPos
          ? BLOCK_REGISTRY[
              this.world.getBlock(
                this.targetBlockPos.x,
                this.targetBlockPos.y,
                this.targetBlockPos.z
              )
            ]
          : null;

        this.onStatsUpdate({
          fps: this.currentFps,
          x: Math.round(this.player.position.x * 10) / 10,
          y: Math.round(this.player.position.y * 10) / 10,
          z: Math.round(this.player.position.z * 10) / 10,
          targetBlock: targetDef ? targetDef.name : 'Air',
          timeString: timeStr,
          isDay: this.sunMesh.position.y > 0,
          health: this.health,
          maxHealth: this.maxHealth,
          hunger: this.hunger,
          activeSkin: this.activeSkin,
          selectedBlock: this.hotbar[this.selectedSlot],
          selectedSlot: this.selectedSlot,
          isFlying: this.player.isFlying,
          gameMode: this.gameMode,
          yaw: this.yaw,
          pitch: this.pitch,
          bots: this.bots.map((b) => ({
            name: b.name,
            x: Math.round(b.position.x * 10) / 10,
            z: Math.round(b.position.z * 10) / 10,
          })),
          monsters: this.zombies.map((z) => ({
            x: Math.round(z.position.x * 10) / 10,
            z: Math.round(z.position.z * 10) / 10,
          })),
          fishes: this.fishes.map((f) => ({
            x: Math.round(f.position.x * 10) / 10,
            z: Math.round(f.position.z * 10) / 10,
          })),
        });
      }
    };

    tick();
  }

  public onResize() {
    if (!this.container) return;
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    if (w <= 0 || h <= 0) return;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  public dispose() {
    cancelAnimationFrame(this.frameId);
    this.world.dispose();
    this.particles.dispose();
    this.arm.dispose();
    for (const b of this.bots) {
      b.dispose();
    }
    for (const f of this.fishes) {
      f.dispose();
    }
    for (const z of this.zombies) {
      z.dispose();
    }
    this.renderer.dispose();
    if (this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
