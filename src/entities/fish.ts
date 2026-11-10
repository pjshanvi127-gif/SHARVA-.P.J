/**
 * Voxel Swimming Fish - Articulated Multi-Part Water Creature
 * Built as an articulated 3D composite group with wiggling tail, flapping fins, and swimming AI.
 */

import * as THREE from 'three';
import { VoxelWorld, WORLD_X, WORLD_Z } from '../world/voxelWorld';
import { BlockType } from '../types/game';

export interface FishConfig {
  color: number;
  finColor: number;
  initialPos: THREE.Vector3;
}

export class VoxelFish {
  public group: THREE.Group;
  public position: THREE.Vector3;
  private velocity: THREE.Vector3;
  private target: THREE.Vector3;
  private tail: THREE.Mesh;
  private leftFin: THREE.Mesh;
  private rightFin: THREE.Mesh;
  private world: VoxelWorld;
  private swimTimer: number = 0;
  private wiggleSpeed: number = 6.0;
  public isScared: boolean = false;

  constructor(cfg: FishConfig, world: VoxelWorld) {
    this.world = world;
    this.position = cfg.initialPos.clone();
    this.velocity = new THREE.Vector3();
    this.target = cfg.initialPos.clone();
    this.group = new THREE.Group();

    // 1. Fish Body (Vibrant main torso)
    const bodyGeom = new THREE.BoxGeometry(0.22, 0.28, 0.55);
    const bodyMat = new THREE.MeshLambertMaterial({ color: cfg.color });
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    body.castShadow = false;
    body.receiveShadow = true;
    this.group.add(body);

    // 2. Head / Snout
    const headGeom = new THREE.BoxGeometry(0.18, 0.22, 0.2);
    const head = new THREE.Mesh(headGeom, bodyMat);
    head.position.set(0, -0.02, 0.32);
    this.group.add(head);

    // 3. Eyes (Left and Right)
    const eyeGeom = new THREE.BoxGeometry(0.04, 0.05, 0.05);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
    const leftEye = new THREE.Mesh(eyeGeom, eyeMat);
    leftEye.position.set(-0.1, 0.03, 0.35);
    this.group.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeom, eyeMat);
    rightEye.position.set(0.1, 0.03, 0.35);
    this.group.add(rightEye);

    // 4. Dorsal Fin (Top)
    const dorsalGeom = new THREE.BoxGeometry(0.04, 0.16, 0.24);
    const finMat = new THREE.MeshLambertMaterial({ color: cfg.finColor });
    const dorsal = new THREE.Mesh(dorsalGeom, finMat);
    dorsal.position.set(0, 0.2, -0.05);
    this.group.add(dorsal);

    // 5. Caudal Tail Fin (Articulated at rear pivot for swimming wiggle)
    const tailGeom = new THREE.BoxGeometry(0.04, 0.3, 0.28);
    tailGeom.translate(0, 0, -0.14); // Shift pivot to front of tail
    this.tail = new THREE.Mesh(tailGeom, finMat);
    this.tail.position.set(0, 0, -0.28);
    this.group.add(this.tail);

    // 6. Pectoral Fins (Left & Right)
    const pecGeom = new THREE.BoxGeometry(0.14, 0.04, 0.12);
    this.leftFin = new THREE.Mesh(pecGeom, finMat);
    this.leftFin.position.set(-0.16, -0.06, 0.1);
    this.leftFin.rotation.z = -0.3;
    this.group.add(this.leftFin);

    this.rightFin = new THREE.Mesh(pecGeom, finMat);
    this.rightFin.position.set(0.16, -0.06, 0.1);
    this.rightFin.rotation.z = 0.3;
    this.group.add(this.rightFin);

    this.group.position.copy(this.position);
    this.pickNewTarget();
  }

  // Pick a valid water destination inside water blocks
  private pickNewTarget() {
    this.swimTimer = 3.5 + Math.random() * 4.0;
    // Water pools are located near Y=2.5..4.5
    for (let attempts = 0; attempts < 10; attempts++) {
      const rx = Math.max(2, Math.min(WORLD_X - 2, this.position.x + (Math.random() - 0.5) * 10));
      const rz = Math.max(2, Math.min(WORLD_Z - 2, this.position.z + (Math.random() - 0.5) * 10));
      const ry = 2.8 + Math.random() * 1.5; // Stays below water surface (water is Y=4)

      // Ensure block is water
      const bx = Math.floor(rx);
      const by = Math.floor(ry);
      const bz = Math.floor(rz);
      const bType = this.world.getBlock(bx, by, bz);

      if (bType === BlockType.WATER || bType === BlockType.AIR) {
        this.target.set(rx, ry, rz);
        return;
      }
    }
  }

  public update(delta: number, playerPos?: THREE.Vector3) {
    this.swimTimer -= delta;

    // Check player proximity to trigger schooling / scatter
    if (playerPos) {
      const distToPlayer = this.position.distanceTo(playerPos);
      if (distToPlayer < 4.5) {
        this.isScared = true;
        // Swim away from player
        const fleeDir = this.position.clone().sub(playerPos).normalize();
        this.target.copy(this.position).addScaledVector(fleeDir, 5.0);
        this.target.y = Math.max(2.2, Math.min(4.2, this.target.y));
        this.wiggleSpeed = 16.0;
      } else {
        this.isScared = false;
        this.wiggleSpeed = 7.0;
      }
    }

    if (this.swimTimer <= 0) {
      this.pickNewTarget();
    }

    // Direction vector towards destination
    const dir = new THREE.Vector3().subVectors(this.target, this.position);
    const dist = dir.length();

    if (dist > 0.15) {
      dir.normalize();
      const speed = this.isScared ? 3.2 : 1.4;
      this.position.addScaledVector(dir, speed * delta);

      // Smooth rotation towards movement direction
      const targetYaw = Math.atan2(dir.x, dir.z);
      const targetPitch = Math.asin(Math.max(-1, Math.min(1, -dir.y)));

      this.group.rotation.y = THREE.MathUtils.damp(this.group.rotation.y, targetYaw, 6.0, delta);
      this.group.rotation.x = THREE.MathUtils.damp(this.group.rotation.x, targetPitch, 4.0, delta);

      // Swimming tail wag animation (sine wave)
      const time = performance.now() * 0.001;
      this.tail.rotation.y = Math.sin(time * this.wiggleSpeed) * 0.55;
      this.leftFin.rotation.z = -0.3 + Math.sin(time * this.wiggleSpeed) * 0.25;
      this.rightFin.rotation.z = 0.3 - Math.sin(time * this.wiggleSpeed) * 0.25;
    }

    this.group.position.copy(this.position);
  }

  public dispose() {
    this.group.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });
  }
}
