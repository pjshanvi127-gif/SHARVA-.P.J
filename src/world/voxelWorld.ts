/**
 * VoxelWorld - Procedural Terrain, Chunk Data & Mesh Management
 */

import * as THREE from 'three';
import { BlockType } from '../types/game';
import { textureAtlas } from '../textures/textureAtlas';
import { BLOCK_REGISTRY } from './blockDefinitions';

export const WORLD_X = 64;
export const WORLD_Y = 36;
export const WORLD_Z = 64;

export const STARTER_COTTAGE_X = 26;
export const STARTER_COTTAGE_Z = 26;

export class VoxelWorld {
  public scene: THREE.Scene;
  private blocks: Uint8Array;
  private blockMeshes: Map<string, THREE.Mesh> = new Map();
  private sharedBoxGeom: THREE.BoxGeometry;
  public lightsMap: Map<string, THREE.PointLight> = new Map();

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.blocks = new Uint8Array(WORLD_X * WORLD_Y * WORLD_Z);
    this.sharedBoxGeom = new THREE.BoxGeometry(1, 1, 1);
  }

  public getIndex(x: number, y: number, z: number): number {
    return x + y * WORLD_X + z * WORLD_X * WORLD_Y;
  }

  public inBounds(x: number, y: number, z: number): boolean {
    return x >= 0 && x < WORLD_X && y >= 0 && y < WORLD_Y && z >= 0 && z < WORLD_Z;
  }

  public getBlock(x: number, y: number, z: number): BlockType {
    if (!this.inBounds(x, y, z)) return BlockType.AIR;
    return this.blocks[this.getIndex(x, y, z)];
  }

  public setBlockDirect(x: number, y: number, z: number, type: BlockType) {
    if (!this.inBounds(x, y, z)) return;
    this.blocks[this.getIndex(x, y, z)] = type;
  }

  // Check if a block at (x,y,z) is completely surrounded by opaque blocks (culled)
  private isBlockHidden(x: number, y: number, z: number): boolean {
    const neighbors = [
      [x + 1, y, z],
      [x - 1, y, z],
      [x, y + 1, z],
      [x, y - 1, z],
      [x, y, z + 1],
      [x, y, z - 1],
    ];

    for (const [nx, ny, nz] of neighbors) {
      if (!this.inBounds(nx, ny, nz)) return false; // Boundary is open to air
      const nType = this.getBlock(nx, ny, nz);
      if (nType === BlockType.AIR) return false;
      const def = BLOCK_REGISTRY[nType];
      if (def && def.isTransparent) return false;
    }
    return true;
  }

  // Updates mesh representation of a single block
  public refreshBlockMesh(x: number, y: number, z: number) {
    if (!this.inBounds(x, y, z)) return;
    const key = `${x},${y},${z}`;
    const type = this.getBlock(x, y, z);

    // Remove old mesh if any
    const existingMesh = this.blockMeshes.get(key);
    if (existingMesh) {
      this.scene.remove(existingMesh);
      this.blockMeshes.delete(key);
    }

    // Remove old light if any
    const existingLight = this.lightsMap.get(key);
    if (existingLight) {
      this.scene.remove(existingLight);
      this.lightsMap.delete(key);
    }

    // If AIR or fully concealed inside ground, do not render
    if (type === BlockType.AIR || this.isBlockHidden(x, y, z)) {
      return;
    }

    // Create block mesh using textured materials
    const materials = textureAtlas.getBlockMaterials(type);
    const mesh = new THREE.Mesh(this.sharedBoxGeom, materials);
    mesh.position.set(x + 0.5, y + 0.5, z + 0.5);
    mesh.castShadow = type !== BlockType.GLASS && type !== BlockType.WATER;
    mesh.receiveShadow = true;
    (mesh as unknown as { userData: { voxelCoord: [number, number, number] } }).userData = {
      voxelCoord: [x, y, z],
    };

    this.scene.add(mesh);
    this.blockMeshes.set(key, mesh);

    // Dynamic point light for glowstone
    if (type === BlockType.GLOWSTONE) {
      const pLight = new THREE.PointLight(0xffe082, 1.2, 8, 2);
      pLight.position.set(x + 0.5, y + 0.5, z + 0.5);
      this.scene.add(pLight);
      this.lightsMap.set(key, pLight);
    }
  }

  // Update block + neighbor visibility
  public setBlock(x: number, y: number, z: number, type: BlockType) {
    if (!this.inBounds(x, y, z)) return;
    this.setBlockDirect(x, y, z, type);

    this.refreshBlockMesh(x, y, z);
    // Refresh 6 neighbors
    const neighbors = [
      [x + 1, y, z],
      [x - 1, y, z],
      [x, y + 1, z],
      [x, y - 1, z],
      [x, y, z + 1],
      [x, y, z - 1],
    ];
    for (const [nx, ny, nz] of neighbors) {
      this.refreshBlockMesh(nx, ny, nz);
    }
  }

  // Generate procedural big mountain terrain & lush valleys
  public generateTerrain() {
    // 1. Base terrain heightmap with towering mountain peaks & lake basin
    for (let x = 0; x < WORLD_X; x++) {
      for (let z = 0; z < WORLD_Z; z++) {
        const nx = x / WORLD_X; // 0..1
        const nz = z / WORLD_Z; // 0..1

        // Northwestern soaring mountain massif (peaks reaching Y=26..32)
        const mtnNorthDist = Math.hypot(nx - 0.22, nz - 0.22);
        const mtnNorth = Math.max(0, 1 - mtnNorthDist / 0.52);
        const mtnNorthRidge = Math.pow(mtnNorth, 1.5) * 23.0;

        // Eastern mountain ridge (peaks reaching Y=22..28)
        const mtnEastDist = Math.hypot(nx - 0.8, nz - 0.55);
        const mtnEast = Math.max(0, 1 - mtnEastDist / 0.42);
        const mtnEastRidge = Math.pow(mtnEast, 1.6) * 19.0;

        // Southern scenic foothills
        const mtnSouthDist = Math.hypot(nx - 0.35, nz - 0.82);
        const mtnSouth = Math.max(0, 1 - mtnSouthDist / 0.38);
        const mtnSouthRidge = Math.pow(mtnSouth, 1.5) * 12.0;

        // Lake basin depression where water pools for fish (around nx: 0.52, nz: 0.52)
        const lakeDist = Math.hypot(nx - 0.52, nz - 0.52);
        const lakeDip = Math.max(0, 1 - lakeDist / 0.26) * 7.5;

        // Rolling crags, mountain ridges & harmonic ripples
        const ripple1 = Math.sin(x * 0.16) * Math.cos(z * 0.16) * 2.8;
        const ripple2 = Math.sin((x + z) * 0.11) * 1.8;
        const ridgeNoise = Math.abs(Math.sin(x * 0.08 + z * 0.08)) * 3.2;

        const baseElevation = Math.floor(
          7.5 + mtnNorthRidge + mtnEastRidge + mtnSouthRidge - lakeDip + ripple1 + ripple2 + ridgeNoise
        );
        const elevation = Math.max(2, Math.min(WORLD_Y - 4, baseElevation));

        for (let y = 0; y < WORLD_Y; y++) {
          if (y === 0) {
            // Bedrock layer
            this.setBlockDirect(x, y, z, BlockType.STONE);
          } else if (y < elevation - 3) {
            // Deep underground stone with rich ore deposits
            const oreRand = Math.random();
            if (oreRand < 0.02 && y < 7) {
              this.setBlockDirect(x, y, z, BlockType.DIAMOND_ORE);
            } else if (oreRand < 0.05 && y < 12) {
              this.setBlockDirect(x, y, z, BlockType.GOLD_ORE);
            } else if (oreRand < 0.12 && y < 22) {
              this.setBlockDirect(x, y, z, BlockType.COAL_ORE);
            } else {
              this.setBlockDirect(x, y, z, BlockType.STONE);
            }
          } else if (y < elevation - 1) {
            // Mountain sub-layer: Stone on high peaks, Dirt in valleys
            if (elevation >= 20) {
              this.setBlockDirect(x, y, z, BlockType.STONE);
            } else {
              this.setBlockDirect(x, y, z, BlockType.DIRT);
            }
          } else if (y === elevation - 1) {
            // Surface Block:
            // High mountain peaks: Stone / Cobblestone summits
            // Shores near water level (<= 5): Golden sand
            // Mid elevations (6..19): Vibrant lush grass
            if (elevation >= 22) {
              this.setBlockDirect(
                x,
                y,
                z,
                Math.random() < 0.4 ? BlockType.COBBLESTONE : BlockType.STONE
              );
            } else if (elevation <= 5) {
              this.setBlockDirect(x, y, z, BlockType.SAND);
            } else {
              this.setBlockDirect(x, y, z, BlockType.GRASS);
            }
          } else if (y < 5) {
            // Water lake basins where swimming fish roam
            this.setBlockDirect(x, y, z, BlockType.WATER);
          } else {
            this.setBlockDirect(x, y, z, BlockType.AIR);
          }
        }
      }
    }

    // 2. Procedural Trees in valleys and foothills (below high mountain lines)
    for (let x = 4; x < WORLD_X - 4; x += 3) {
      for (let z = 4; z < WORLD_Z - 4; z += 3) {
        if (Math.random() < 0.22) {
          const surfaceY = this.getHighestSolidBlock(x, z);
          const surfaceType = this.getBlock(x, surfaceY, z);
          // Only grow trees on grass in valleys and gentle hills (Y <= 17)
          if (surfaceType === BlockType.GRASS && surfaceY <= 17 && surfaceY + 6 < WORLD_Y) {
            this.growTree(x, surfaceY + 1, z);
          }
        }
      }
    }

    // 3. Build cozy starter house nestled in the lakeside valley with panoramic mountain view
    const cottageGround = this.getHighestSolidBlock(STARTER_COTTAGE_X, STARTER_COTTAGE_Z);
    this.spawnCottage(STARTER_COTTAGE_X, cottageGround + 1, STARTER_COTTAGE_Z);

    // 4. Initialize all visible block meshes
    this.rebuildAllMeshes();
  }

  // Grow an authentic oak tree
  public growTree(trunkX: number, startY: number, trunkZ: number) {
    const trunkHeight = 4 + Math.floor(Math.random() * 2);
    // Trunk
    for (let dy = 0; dy < trunkHeight; dy++) {
      this.setBlockDirect(trunkX, startY + dy, trunkZ, BlockType.OAK_WOOD);
    }
    // Leaves canopy
    const leafBase = startY + trunkHeight - 2;
    for (let lx = -2; lx <= 2; lx++) {
      for (let lz = -2; lz <= 2; lz++) {
        for (let ly = 0; ly <= 3; ly++) {
          const isCorner = Math.abs(lx) === 2 && Math.abs(lz) === 2;
          const isTop = ly === 3;
          if (isCorner && (ly >= 2 || Math.random() < 0.5)) continue;
          if (isTop && (Math.abs(lx) > 1 || Math.abs(lz) > 1)) continue;
          const targetX = trunkX + lx;
          const targetY = leafBase + ly;
          const targetZ = trunkZ + lz;
          if (this.inBounds(targetX, targetY, targetZ)) {
            if (this.getBlock(targetX, targetY, targetZ) === BlockType.AIR) {
              this.setBlockDirect(targetX, targetY, targetZ, BlockType.OAK_LEAVES);
            }
          }
        }
      }
    }
  }

  // Spawn an architectural cozy cottage with wooden beams, glass windows, glowstone lamp, bookshelf & bed
  public spawnCottage(sx: number, sy: number, sz: number) {
    const width = 6;
    const depth = 6;
    const height = 4;

    // Foundation & Floor
    for (let x = 0; x < width; x++) {
      for (let z = 0; z < depth; z++) {
        this.setBlockDirect(sx + x, sy - 1, sz + z, BlockType.COBBLESTONE);
        this.setBlockDirect(sx + x, sy, sz + z, BlockType.PLANKS);
      }
    }

    // Walls & Corners
    for (let y = 1; y <= height; y++) {
      for (let x = 0; x < width; x++) {
        for (let z = 0; z < depth; z++) {
          const isBorder = x === 0 || x === width - 1 || z === 0 || z === depth - 1;
          const isCorner = (x === 0 || x === width - 1) && (z === 0 || z === depth - 1);
          if (isBorder) {
            const posY = sy + y;
            if (isCorner) {
              // Wooden support pillars on corners
              this.setBlockDirect(sx + x, posY, sz + z, BlockType.OAK_WOOD);
            } else if (y === 2 && ((x === 2 || x === 3) && z === 0)) {
              // Glass windows on front wall
              this.setBlockDirect(sx + x, posY, sz + z, BlockType.GLASS);
            } else if (y === 2 && ((x === 2 || x === 3) && z === depth - 1)) {
              // Glass window on back wall
              this.setBlockDirect(sx + x, posY, sz + z, BlockType.GLASS);
            } else if (x === 0 && z === 2 && y <= 2) {
              // Doorway opening on side wall
              this.setBlockDirect(sx + x, posY, sz + z, BlockType.AIR);
            } else {
              this.setBlockDirect(sx + x, posY, sz + z, BlockType.PLANKS);
            }
          } else {
            // Interior air
            this.setBlockDirect(sx + x, sy + y, sz + z, BlockType.AIR);
          }
        }
      }
    }

    // Pyramid Plank Roof
    for (let rx = -1; rx <= width; rx++) {
      for (let rz = -1; rz <= depth; rz++) {
        this.setBlockDirect(sx + rx, sy + height + 1, sz + rz, BlockType.BRICK);
      }
    }

    // Interior Furniture
    // Comfy Bed in back corner
    this.setBlockDirect(sx + width - 2, sy + 1, sz + depth - 2, BlockType.BED);
    this.setBlockDirect(sx + width - 2, sy + 1, sz + depth - 3, BlockType.BED);

    // Bookshelf
    this.setBlockDirect(sx + 1, sy + 1, sz + depth - 2, BlockType.BOOKSHELF);
    this.setBlockDirect(sx + 1, sy + 2, sz + depth - 2, BlockType.BOOKSHELF);

    // Glowstone Chandelier hanging from ceiling
    this.setBlockDirect(sx + 3, sy + height, sz + 3, BlockType.GLOWSTONE);
  }

  // Get highest non-air block at column (x, z)
  public getHighestSolidBlock(x: number, z: number): number {
    for (let y = WORLD_Y - 1; y >= 0; y--) {
      const b = this.getBlock(x, y, z);
      if (b !== BlockType.AIR && b !== BlockType.WATER) {
        return y;
      }
    }
    return 1;
  }

  // Rebuild all visible block meshes
  public rebuildAllMeshes() {
    // Clear old
    for (const [, mesh] of this.blockMeshes) {
      this.scene.remove(mesh);
    }
    this.blockMeshes.clear();

    for (const [, light] of this.lightsMap) {
      this.scene.remove(light);
    }
    this.lightsMap.clear();

    for (let x = 0; x < WORLD_X; x++) {
      for (let y = 0; y < WORLD_Y; y++) {
        for (let z = 0; z < WORLD_Z; z++) {
          this.refreshBlockMesh(x, y, z);
        }
      }
    }
  }

  // Explode blocks in radius around center
  public explodeAt(cx: number, cy: number, cz: number, radius = 3.5): { removedCount: number; center: THREE.Vector3 } {
    const intRadius = Math.ceil(radius);
    let count = 0;
    const modifiedCoords: [number, number, number][] = [];

    for (let dx = -intRadius; dx <= intRadius; dx++) {
      for (let dy = -intRadius; dy <= intRadius; dy++) {
        for (let dz = -intRadius; dz <= intRadius; dz++) {
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
          if (dist <= radius) {
            const bx = Math.floor(cx + dx);
            const by = Math.floor(cy + dy);
            const bz = Math.floor(cz + dz);
            if (this.inBounds(bx, by, bz)) {
              const current = this.getBlock(bx, by, bz);
              if (current !== BlockType.AIR && by > 0) {
                // Don't blow up bedrock Y=0
                this.setBlockDirect(bx, by, bz, BlockType.AIR);
                count++;
                modifiedCoords.push([bx, by, bz]);
              }
            }
          }
        }
      }
    }

    // Refresh meshes
    for (const [mx, my, mz] of modifiedCoords) {
      this.refreshBlockMesh(mx, my, mz);
      const neighbors = [
        [mx + 1, my, mz],
        [mx - 1, my, mz],
        [mx, my + 1, mz],
        [mx, my - 1, mz],
        [mx, my, mz + 1],
        [mx, my, mz - 1],
      ];
      for (const [nx, ny, nz] of neighbors) {
        this.refreshBlockMesh(nx, ny, nz);
      }
    }

    return {
      removedCount: count,
      center: new THREE.Vector3(cx, cy, cz),
    };
  }

  public dispose() {
    for (const [, mesh] of this.blockMeshes) {
      this.scene.remove(mesh);
    }
    this.blockMeshes.clear();
    for (const [, light] of this.lightsMap) {
      this.scene.remove(light);
    }
    this.lightsMap.clear();
    this.sharedBoxGeom.dispose();
  }
}
