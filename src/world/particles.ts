/**
 * Procedural Particle System for VoxelCraft 3D
 * Handles block break debris, TNT explosions, and sparkling dust.
 */

import * as THREE from 'three';

interface Particle {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  active: boolean;
}

export class ParticleSystem {
  private particles: Particle[] = [];
  private poolSize = 120;
  private scene: THREE.Scene;
  private particleGeom: THREE.BoxGeometry;
  private particleMat: THREE.MeshBasicMaterial;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.particleGeom = new THREE.BoxGeometry(0.12, 0.12, 0.12);
    this.particleMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    for (let i = 0; i < this.poolSize; i++) {
      const mesh = new THREE.Mesh(this.particleGeom, this.particleMat.clone());
      mesh.visible = false;
      this.scene.add(mesh);
      this.particles.push({
        mesh,
        velocity: new THREE.Vector3(),
        life: 0,
        maxLife: 1.0,
        active: false,
      });
    }
  }

  // Spawn a burst of crumbling block particles
  public spawnBlockBreakParticles(pos: THREE.Vector3, colorHex: number, count = 16) {
    let spawned = 0;
    for (const p of this.particles) {
      if (!p.active) {
        p.active = true;
        p.mesh.visible = true;
        (p.mesh.material as THREE.MeshBasicMaterial).color.setHex(colorHex);
        p.mesh.position.set(
          pos.x + 0.5 + (Math.random() - 0.5) * 0.6,
          pos.y + 0.5 + (Math.random() - 0.5) * 0.6,
          pos.z + 0.5 + (Math.random() - 0.5) * 0.6
        );
        p.mesh.scale.setScalar(0.7 + Math.random() * 0.6);
        p.velocity.set(
          (Math.random() - 0.5) * 4.5,
          Math.random() * 4.0 + 1.5,
          (Math.random() - 0.5) * 4.5
        );
        p.life = 0;
        p.maxLife = 0.45 + Math.random() * 0.3;
        spawned++;
        if (spawned >= count) break;
      }
    }
  }

  // Spawn intense TNT explosion debris and fire sparks
  public spawnExplosionParticles(center: THREE.Vector3, count = 40) {
    let spawned = 0;
    const colors = [0xff3d00, 0xff9100, 0xffea00, 0x424242, 0x757575];
    for (const p of this.particles) {
      if (!p.active) {
        p.active = true;
        p.mesh.visible = true;
        const color = colors[Math.floor(Math.random() * colors.length)];
        (p.mesh.material as THREE.MeshBasicMaterial).color.setHex(color);
        p.mesh.position.copy(center);
        p.mesh.scale.setScalar(1.0 + Math.random() * 0.8);
        p.velocity.set(
          (Math.random() - 0.5) * 12.0,
          Math.random() * 8.0 + 3.0,
          (Math.random() - 0.5) * 12.0
        );
        p.life = 0;
        p.maxLife = 0.7 + Math.random() * 0.5;
        spawned++;
        if (spawned >= count) break;
      }
    }
  }

  public update(delta: number) {
    const gravity = -18.0;
    for (const p of this.particles) {
      if (p.active) {
        p.life += delta;
        if (p.life >= p.maxLife) {
          p.active = false;
          p.mesh.visible = false;
          continue;
        }

        p.velocity.y += gravity * delta;
        p.mesh.position.x += p.velocity.x * delta;
        p.mesh.position.y += p.velocity.y * delta;
        p.mesh.position.z += p.velocity.z * delta;

        // Shrink towards end of life
        const progress = p.life / p.maxLife;
        const scale = Math.max(0.01, 1 - progress);
        p.mesh.scale.setScalar(scale);
      }
    }
  }

  public dispose() {
    for (const p of this.particles) {
      this.scene.remove(p.mesh);
      p.mesh.geometry.dispose();
      (p.mesh.material as THREE.Material).dispose();
    }
    this.particles = [];
  }
}
