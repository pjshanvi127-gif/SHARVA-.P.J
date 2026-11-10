/**
 * Articulated Multiplayer NPC Bots for VoxelCraft 3D
 * Built as multi-part composite hierarchical THREE.Group with swinging limbs and nameplates.
 */

import * as THREE from 'three';
import { VoxelWorld, WORLD_X, WORLD_Z } from '../world/voxelWorld';
import { BlockType } from '../types/game';

export interface BotConfig {
  name: string;
  shirtColor: number;
  pantsColor: number;
  skinColor: number;
  initialPos: THREE.Vector3;
}

export class BotAvatar {
  public group: THREE.Group;
  public name: string;
  public position: THREE.Vector3;
  private target: THREE.Vector3;
  private head: THREE.Mesh;
  private leftArm: THREE.Mesh;
  private rightArm: THREE.Mesh;
  private leftLeg: THREE.Mesh;
  private rightLeg: THREE.Mesh;
  private actionTimer: number = 0;
  private chatTimer: number = 0;
  private walkCycle: number = 0;
  private world: VoxelWorld;
  public onChat?: (sender: string, text: string) => void;

  constructor(cfg: BotConfig, world: VoxelWorld) {
    this.name = cfg.name;
    this.world = world;
    this.position = cfg.initialPos.clone();
    this.target = cfg.initialPos.clone();
    this.group = new THREE.Group();

    // 1. Torso
    const torsoGeom = new THREE.BoxGeometry(0.48, 0.72, 0.28);
    const torsoMat = new THREE.MeshLambertMaterial({ color: cfg.shirtColor });
    const torso = new THREE.Mesh(torsoGeom, torsoMat);
    torso.position.y = 0.76;
    torso.castShadow = true;
    this.group.add(torso);

    // 2. Head
    const headGeom = new THREE.BoxGeometry(0.44, 0.44, 0.44);
    const headMat = new THREE.MeshLambertMaterial({ color: cfg.skinColor });
    this.head = new THREE.Mesh(headGeom, headMat);
    this.head.position.y = 1.34;
    this.head.castShadow = true;
    this.group.add(this.head);

    // Head Hat / Hair accent
    const hairGeom = new THREE.BoxGeometry(0.46, 0.16, 0.46);
    const hairMat = new THREE.MeshLambertMaterial({ color: 0x3e2723 });
    const hair = new THREE.Mesh(hairGeom, hairMat);
    hair.position.y = 1.5;
    this.group.add(hair);

    // 3. Arms (Pivoted near shoulders)
    const armGeom = new THREE.BoxGeometry(0.2, 0.68, 0.2);
    // Shift geometry down so pivot is at top
    armGeom.translate(0, -0.3, 0);
    const armMat = new THREE.MeshLambertMaterial({ color: cfg.shirtColor });

    this.leftArm = new THREE.Mesh(armGeom, armMat);
    this.leftArm.position.set(-0.35, 1.08, 0);
    this.leftArm.castShadow = true;
    this.group.add(this.leftArm);

    this.rightArm = new THREE.Mesh(armGeom.clone(), armMat);
    this.rightArm.position.set(0.35, 1.08, 0);
    this.rightArm.castShadow = true;
    this.group.add(this.rightArm);

    // 4. Legs (Pivoted near hips)
    const legGeom = new THREE.BoxGeometry(0.22, 0.72, 0.24);
    legGeom.translate(0, -0.36, 0);
    const legMat = new THREE.MeshLambertMaterial({ color: cfg.pantsColor });

    this.leftLeg = new THREE.Mesh(legGeom, legMat);
    this.leftLeg.position.set(-0.13, 0.72, 0);
    this.leftLeg.castShadow = true;
    this.group.add(this.leftLeg);

    this.rightLeg = new THREE.Mesh(legGeom.clone(), legMat);
    this.rightLeg.position.set(0.13, 0.72, 0);
    this.rightLeg.castShadow = true;
    this.group.add(this.rightLeg);

    // 5. Nameplate Floating Sprite above head
    const nameSprite = this.createNameplateSprite(cfg.name);
    nameSprite.position.y = 1.95;
    this.group.add(nameSprite);

    this.group.position.copy(this.position);
    this.actionTimer = 2 + Math.random() * 3;
    this.chatTimer = 6 + Math.random() * 12;
  }

  // Create crisp nameplate sprite
  private createNameplateSprite(text: string): THREE.Sprite {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.roundRect(8, 8, 240, 48, 8);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 128, 32);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.SpriteMaterial({ map: texture, depthTest: false });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(1.4, 0.35, 1);
    return sprite;
  }

  public update(delta: number) {
    this.actionTimer -= delta;
    this.chatTimer -= delta;

    // Pick new wandering target
    if (this.actionTimer <= 0) {
      this.actionTimer = 5 + Math.random() * 7;
      const rx = Math.max(3, Math.min(WORLD_X - 3, this.position.x + (Math.random() - 0.5) * 14));
      const rz = Math.max(3, Math.min(WORLD_Z - 3, this.position.z + (Math.random() - 0.5) * 14));
      const groundY = this.world.getHighestSolidBlock(Math.floor(rx), Math.floor(rz)) + 1;
      this.target.set(rx, groundY, rz);

      // Bot occasional block interaction (e.g. planting a flower or cobblestone)
      if (Math.random() < 0.25) {
        const bx = Math.floor(this.position.x);
        const bz = Math.floor(this.position.z);
        const by = this.world.getHighestSolidBlock(bx, bz);
        if (this.world.getBlock(bx, by + 1, bz) === BlockType.AIR) {
          const placeables = [BlockType.PLANKS, BlockType.COBBLESTONE, BlockType.GLOWSTONE];
          const choice = placeables[Math.floor(Math.random() * placeables.length)];
          this.world.setBlock(bx, by + 1, bz, choice);
        }
      }
    }

    // Chat utterance
    if (this.chatTimer <= 0) {
      this.chatTimer = 18 + Math.random() * 22;
      const botQuotes = [
        "Building a lookout tower near the mountain!",
        "Found some sparkling gold ore down by the cave!",
        "Watch out for the dark at night, always carry torches or beds.",
        "Check your hotbar—slot 8 has a bed you can place!",
        "Press 'C' if you want to customize your character skin.",
        "Type /spawn house in chat to build another cottage!",
        "TNT blocks make huge explosions when you right click them!",
        "The sunrise over the hills looks awesome today."
      ];
      const quote = botQuotes[Math.floor(Math.random() * botQuotes.length)];
      if (this.onChat) {
        this.onChat(this.name, quote);
      }
    }

    // Move toward target
    const dir = new THREE.Vector3().subVectors(this.target, this.position);
    dir.y = 0; // Horizontal movement
    const dist = dir.length();

    if (dist > 0.3) {
      dir.normalize();
      const speed = 2.4;
      this.position.x += dir.x * speed * delta;
      this.position.z += dir.z * speed * delta;

      // Adjust height to terrain
      const currentGround = this.world.getHighestSolidBlock(Math.floor(this.position.x), Math.floor(this.position.z)) + 1;
      this.position.y = THREE.MathUtils.damp(this.position.y, currentGround, 8.0, delta);

      this.group.position.copy(this.position);
      this.group.rotation.y = Math.atan2(dir.x, dir.z);

      // Limb swinging walk cycle
      this.walkCycle += delta * 7.5;
      const limbAngle = Math.sin(this.walkCycle) * 0.65;
      this.leftArm.rotation.x = limbAngle;
      this.rightArm.rotation.x = -limbAngle;
      this.leftLeg.rotation.x = -limbAngle;
      this.rightLeg.rotation.x = limbAngle;
    } else {
      // Idle pose
      this.leftArm.rotation.x = THREE.MathUtils.damp(this.leftArm.rotation.x, 0, 10, delta);
      this.rightArm.rotation.x = THREE.MathUtils.damp(this.rightArm.rotation.x, 0, 10, delta);
      this.leftLeg.rotation.x = THREE.MathUtils.damp(this.leftLeg.rotation.x, 0, 10, delta);
      this.rightLeg.rotation.x = THREE.MathUtils.damp(this.rightLeg.rotation.x, 0, 10, delta);
    }
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
