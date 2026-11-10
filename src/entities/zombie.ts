/**
 * VoxelZombie - Articulated Night Hostile Monster
 * Outstretched arms, glowing red eyes, groaning audio, player attack AI, and sunlight burning.
 */

import * as THREE from 'three';
import { VoxelWorld, WORLD_X, WORLD_Z } from '../world/voxelWorld';
import { sounds } from '../audio/soundEngine';

export class VoxelZombie {
  public group: THREE.Group;
  public position: THREE.Vector3;
  public health: number = 4;
  public maxHealth: number = 4;
  public isDead: boolean = false;
  private head: THREE.Mesh;
  private torso: THREE.Mesh;
  private leftArm: THREE.Mesh;
  private rightArm: THREE.Mesh;
  private leftLeg: THREE.Mesh;
  private rightLeg: THREE.Mesh;
  private leftEye: THREE.Mesh;
  private rightEye: THREE.Mesh;
  private world: VoxelWorld;
  private walkCycle: number = 0;
  private groanTimer: number = 0;
  private attackCooldown: number = 0;
  private hitFlashTimer: number = 0;
  private originalMaterials: Map<THREE.Mesh, THREE.Material> = new Map();
  private flashMat: THREE.MeshBasicMaterial;

  constructor(initialPos: THREE.Vector3, world: VoxelWorld) {
    this.world = world;
    this.position = initialPos.clone();
    this.group = new THREE.Group();
    this.flashMat = new THREE.MeshBasicMaterial({ color: 0xff4444 });

    // Rotting Zombie Color Palette
    const skinColor = 0x3d7028; // Decaying mossy green
    const shirtColor = 0x00838f; // Tattered cyan shirt
    const pantsColor = 0x283593; // Dark indigo pants

    // 1. Torso
    const torsoGeom = new THREE.BoxGeometry(0.5, 0.75, 0.3);
    const torsoMat = new THREE.MeshLambertMaterial({ color: shirtColor });
    this.torso = new THREE.Mesh(torsoGeom, torsoMat);
    this.torso.position.y = 0.76;
    this.torso.castShadow = true;
    this.group.add(this.torso);
    this.originalMaterials.set(this.torso, torsoMat);

    // 2. Zombie Head
    const headGeom = new THREE.BoxGeometry(0.44, 0.44, 0.44);
    const headMat = new THREE.MeshLambertMaterial({ color: skinColor });
    this.head = new THREE.Mesh(headGeom, headMat);
    this.head.position.y = 1.34;
    this.head.castShadow = true;
    this.group.add(this.head);
    this.originalMaterials.set(this.head, headMat);

    // Head Hair / Scalp Rot
    const hairGeom = new THREE.BoxGeometry(0.46, 0.14, 0.46);
    const hairMat = new THREE.MeshLambertMaterial({ color: 0x1b3b12 });
    const hair = new THREE.Mesh(hairGeom, hairMat);
    hair.position.y = 1.5;
    this.group.add(hair);
    this.originalMaterials.set(hair, hairMat);

    // Glowing Red Night Eyes
    const eyeGeom = new THREE.BoxGeometry(0.08, 0.08, 0.04);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff1744 });
    this.leftEye = new THREE.Mesh(eyeGeom, eyeMat);
    this.leftEye.position.set(-0.11, 1.35, 0.23);
    this.group.add(this.leftEye);

    this.rightEye = new THREE.Mesh(eyeGeom, eyeMat);
    this.rightEye.position.set(0.11, 1.35, 0.23);
    this.group.add(this.rightEye);

    // 3. Outstretched Arms (Classic Zombie Reaching Forward Pose)
    const armGeom = new THREE.BoxGeometry(0.2, 0.68, 0.2);
    armGeom.translate(0, -0.3, 0); // Pivot at shoulder
    const armMat = new THREE.MeshLambertMaterial({ color: skinColor });

    this.leftArm = new THREE.Mesh(armGeom, armMat);
    this.leftArm.position.set(-0.35, 1.08, 0);
    this.leftArm.rotation.x = -Math.PI / 2.3; // Reaching forward
    this.leftArm.castShadow = true;
    this.group.add(this.leftArm);
    this.originalMaterials.set(this.leftArm, armMat);

    this.rightArm = new THREE.Mesh(armGeom.clone(), armMat);
    this.rightArm.position.set(0.35, 1.08, 0);
    this.rightArm.rotation.x = -Math.PI / 2.3; // Reaching forward
    this.rightArm.castShadow = true;
    this.group.add(this.rightArm);
    this.originalMaterials.set(this.rightArm, armMat);

    // 4. Legs
    const legGeom = new THREE.BoxGeometry(0.22, 0.72, 0.24);
    legGeom.translate(0, -0.36, 0); // Pivot at hip
    const legMat = new THREE.MeshLambertMaterial({ color: pantsColor });

    this.leftLeg = new THREE.Mesh(legGeom, legMat);
    this.leftLeg.position.set(-0.13, 0.72, 0);
    this.leftLeg.castShadow = true;
    this.group.add(this.leftLeg);
    this.originalMaterials.set(this.leftLeg, legMat);

    this.rightLeg = new THREE.Mesh(legGeom.clone(), legMat);
    this.rightLeg.position.set(0.13, 0.72, 0);
    this.rightLeg.castShadow = true;
    this.group.add(this.rightLeg);
    this.originalMaterials.set(this.rightLeg, legMat);

    this.group.position.copy(this.position);
    this.groanTimer = 2.0 + Math.random() * 4.0;
  }

  // Take damage from player attack
  public takeDamage(amount: number, knockbackDir?: THREE.Vector3): boolean {
    if (this.isDead) return false;
    this.health -= amount;
    sounds.playZombieHurt();
    this.hitFlashTimer = 0.18;

    // Apply knockback
    if (knockbackDir) {
      this.position.x += knockbackDir.x * 0.8;
      this.position.z += knockbackDir.z * 0.8;
      this.position.y += 0.3;
    }

    if (this.health <= 0) {
      this.isDead = true;
      sounds.playZombieDeath();
      return true; // Monster died
    }
    return false;
  }

  // Update zombie AI, walking, groaning, and attacking
  public update(
    delta: number,
    playerPos: THREE.Vector3,
    onPlayerAttack?: (damage: number) => void
  ) {
    if (this.isDead) return;

    // Hit flash handling
    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer -= delta;
      const flash = this.hitFlashTimer > 0;
      this.originalMaterials.forEach((origMat, mesh) => {
        mesh.material = flash ? this.flashMat : origMat;
      });
    }

    // Cooldown timers
    this.groanTimer -= delta;
    this.attackCooldown -= delta;

    // Distance to player
    const distToPlayer = this.position.distanceTo(playerPos);
    const aggroRadius = 24.0; // Zombies detect player within 24 blocks

    // Occasional groaning sound when player is near
    if (this.groanTimer <= 0) {
      this.groanTimer = 6.0 + Math.random() * 8.0;
      if (distToPlayer <= aggroRadius) {
        sounds.playZombieGroan();
      }
    }

    // Pursue player if in range
    if (distToPlayer <= aggroRadius) {
      const dir = new THREE.Vector3(
        playerPos.x - this.position.x,
        0,
        playerPos.z - this.position.z
      );
      const horizontalDist = dir.length();

      if (horizontalDist > 1.2) {
        dir.normalize();
        const speed = 2.1; // Lumbering relentless walk
        this.position.x += dir.x * speed * delta;
        this.position.z += dir.z * speed * delta;

        // Snap/interpolate height to terrain surface
        const groundY = this.world.getHighestSolidBlock(
          Math.floor(this.position.x),
          Math.floor(this.position.z)
        ) + 1;
        this.position.y = THREE.MathUtils.damp(this.position.y, groundY, 10.0, delta);

        // Rotate towards player
        this.group.rotation.y = Math.atan2(dir.x, dir.z);

        // Limb swinging walk cycle
        this.walkCycle += delta * 7.0;
        const limbAngle = Math.sin(this.walkCycle) * 0.55;
        this.leftLeg.rotation.x = -limbAngle;
        this.rightLeg.rotation.x = limbAngle;

        // Reaching arms sway slightly
        this.leftArm.rotation.x = -Math.PI / 2.3 + Math.sin(this.walkCycle * 0.5) * 0.15;
        this.rightArm.rotation.x = -Math.PI / 2.3 - Math.sin(this.walkCycle * 0.5) * 0.15;
      } else {
        // Melee Attack Range (< 1.2 blocks)!
        if (this.attackCooldown <= 0) {
          this.attackCooldown = 1.4; // Attack every 1.4 seconds
          sounds.playZombieAttack();

          // Lunging arm swipe animation
          this.leftArm.rotation.x = -Math.PI / 1.4;
          this.rightArm.rotation.x = -Math.PI / 1.4;

          if (onPlayerAttack) {
            onPlayerAttack(1.5); // Deal 1.5 hearts damage
          }
        }
      }
    }

    this.group.position.copy(this.position);
  }

  public dispose() {
    this.group.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
      }
    });
    this.flashMat.dispose();
  }
}
