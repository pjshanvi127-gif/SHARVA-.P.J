/**
 * 1st-Person Player Arm & Held Block Model
 * Features walking bobbing, mining/placement swing kinematics, and skin customization.
 */

import * as THREE from 'three';
import { CharacterSkin, BlockType } from '../types/game';
import { textureAtlas } from '../textures/textureAtlas';

export class PlayerArm {
  public group: THREE.Group;
  private sleeveMesh: THREE.Mesh;
  private handMesh: THREE.Mesh;
  private heldItemMesh: THREE.Mesh | null = null;
  private swingAngle = 0;
  private currentBlockType: BlockType = BlockType.GRASS;
  private miniBlockGeom: THREE.BoxGeometry;

  constructor(initialSkin: CharacterSkin) {
    this.group = new THREE.Group();
    this.miniBlockGeom = new THREE.BoxGeometry(0.22, 0.22, 0.22);

    // Sleeve (Arm upper part)
    const sleeveGeom = new THREE.BoxGeometry(0.22, 0.6, 0.22);
    const sleeveMat = new THREE.MeshLambertMaterial({ color: initialSkin.sleeveColor });
    this.sleeveMesh = new THREE.Mesh(sleeveGeom, sleeveMat);

    // Hand (Skin colored bottom part)
    const handGeom = new THREE.BoxGeometry(0.2, 0.22, 0.2);
    const handMat = new THREE.MeshLambertMaterial({ color: initialSkin.skinColor });
    this.handMesh = new THREE.Mesh(handGeom, handMat);
    this.handMesh.position.y = -0.34;

    this.group.add(this.sleeveMesh);
    this.group.add(this.handMesh);

    // Initial positioning in bottom right of camera view
    this.group.position.set(0.38, -0.38, -0.58);
    this.group.rotation.set(0.2, -0.25, 0.05);

    this.updateHeldBlock(BlockType.GRASS);
  }

  public updateSkin(skin: CharacterSkin) {
    (this.sleeveMesh.material as THREE.MeshLambertMaterial).color.setHex(skin.sleeveColor);
    (this.handMesh.material as THREE.MeshLambertMaterial).color.setHex(skin.skinColor);
  }

  public updateHeldBlock(blockType: BlockType) {
    this.currentBlockType = blockType;
    if (this.heldItemMesh) {
      this.group.remove(this.heldItemMesh);
      this.heldItemMesh = null;
    }

    if (blockType !== BlockType.AIR) {
      const mats = textureAtlas.getBlockMaterials(blockType);
      this.heldItemMesh = new THREE.Mesh(this.miniBlockGeom, mats);
      this.heldItemMesh.position.set(-0.06, -0.32, -0.16);
      this.heldItemMesh.rotation.set(0.3, 0.5, 0.2);
      this.group.add(this.heldItemMesh);
    }
  }

  public triggerSwing() {
    this.swingAngle = Math.PI / 2.5;
  }

  public update(delta: number, isMoving: boolean) {
    const time = performance.now() * 0.003;
    let bobX = 0;
    let bobY = 0;

    if (isMoving) {
      bobX = Math.sin(time * 2.5) * 0.035;
      bobY = Math.abs(Math.cos(time * 2.5)) * 0.04;
    } else {
      bobX = Math.sin(time) * 0.008;
      bobY = Math.cos(time * 1.5) * 0.008;
    }

    // Recover swing angle
    if (this.swingAngle > 0) {
      this.swingAngle -= delta * 9.5;
      if (this.swingAngle < 0) this.swingAngle = 0;
    }

    const swingSin = Math.sin(this.swingAngle);
    this.group.position.set(
      0.38 + bobX - swingSin * 0.15,
      -0.38 + bobY - swingSin * 0.22,
      -0.58 - swingSin * 0.16
    );

    this.group.rotation.x = 0.2 + swingSin * 0.9;
    this.group.rotation.y = -0.25 + swingSin * 0.4;
    this.group.rotation.z = 0.05 - swingSin * 0.3;
  }

  public dispose() {
    this.sleeveMesh.geometry.dispose();
    (this.sleeveMesh.material as THREE.Material).dispose();
    this.handMesh.geometry.dispose();
    (this.handMesh.material as THREE.Material).dispose();
    this.miniBlockGeom.dispose();
    if (this.heldItemMesh) {
      this.group.remove(this.heldItemMesh);
    }
  }
}
