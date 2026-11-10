/**
 * Procedural Pixel-Art Textures Generator for VoxelCraft 3D
 * Generates crisp 16x16 pixel textures for all block faces via HTML5 2D Canvas.
 */

import * as THREE from 'three';
import { BlockType } from '../types/game';

// Helper to draw a pixel on a canvas context
function drawPixel(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, 1, 1);
}

// Generate a 16x16 CanvasTexture
function create16x16Texture(drawFn: (ctx: CanvasRenderingContext2D) => void): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 16;
  canvas.height = 16;
  const ctx = canvas.getContext('2d')!;
  drawFn(ctx);

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Pseudo random with seed for deterministic block patterns
function seededRandom(seed: number) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

export class TextureAtlas {
  private materialsCache: Map<string, THREE.Material[]> = new Map();

  constructor() {
    this.initTextures();
  }

  // Pre-generate face textures for each block type
  private textures: Record<string, THREE.CanvasTexture> = {};

  private initTextures() {
    // 1. Dirt Texture
    this.textures['dirt'] = create16x16Texture((ctx) => {
      ctx.fillStyle = '#614126';
      ctx.fillRect(0, 0, 16, 16);
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          const r = seededRandom(x * 16 + y);
          if (r < 0.25) drawPixel(ctx, x, y, '#54371f');
          else if (r > 0.8) drawPixel(ctx, x, y, '#704c2e');
          else if (r > 0.92) drawPixel(ctx, x, y, '#422a15');
        }
      }
    });

    // 2. Grass Top Texture
    this.textures['grass_top'] = create16x16Texture((ctx) => {
      ctx.fillStyle = '#5c8e32';
      ctx.fillRect(0, 0, 16, 16);
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          const r = seededRandom(x * 37 + y * 13);
          if (r < 0.25) drawPixel(ctx, x, y, '#4d7828');
          else if (r > 0.8) drawPixel(ctx, x, y, '#6aa43b');
          else if (r > 0.95) drawPixel(ctx, x, y, '#7abf43');
        }
      }
    });

    // 3. Grass Side Texture (Grass rim on top of dirt)
    this.textures['grass_side'] = create16x16Texture((ctx) => {
      ctx.fillStyle = '#614126';
      ctx.fillRect(0, 0, 16, 16);
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          const r = seededRandom(x * 23 + y * 7);
          if (r < 0.2) drawPixel(ctx, x, y, '#54371f');
          else if (r > 0.85) drawPixel(ctx, x, y, '#704c2e');
        }
      }
      // Grass overhangs
      const overhangs = [3, 4, 3, 2, 4, 3, 5, 4, 2, 3, 4, 3, 2, 4, 3, 2];
      for (let x = 0; x < 16; x++) {
        const depth = overhangs[x];
        for (let y = 0; y < depth; y++) {
          const r = seededRandom(x + y * 31);
          drawPixel(ctx, x, y, r > 0.5 ? '#5c8e32' : '#4d7828');
        }
        drawPixel(ctx, x, depth, '#452b17'); // shadow line below grass
      }
    });

    // 4. Stone Texture
    this.textures['stone'] = create16x16Texture((ctx) => {
      ctx.fillStyle = '#7a7a7a';
      ctx.fillRect(0, 0, 16, 16);
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          const r = seededRandom(x * 19 + y * 29);
          if (r < 0.2) drawPixel(ctx, x, y, '#6b6b6b');
          else if (r < 0.4) drawPixel(ctx, x, y, '#888888');
          else if (r > 0.88) drawPixel(ctx, x, y, '#595959');
        }
      }
    });

    // 5. Cobblestone Texture
    this.textures['cobblestone'] = create16x16Texture((ctx) => {
      ctx.fillStyle = '#6e6e6e';
      ctx.fillRect(0, 0, 16, 16);
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          const r = seededRandom(x * 53 + y * 41);
          if (r < 0.3) drawPixel(ctx, x, y, '#555555');
          else if (r > 0.75) drawPixel(ctx, x, y, '#8c8c8c');
        }
      }
      // Mortar lines
      for (let i = 0; i < 16; i++) {
        drawPixel(ctx, i, 4, '#3b3b3b');
        drawPixel(ctx, i, 9, '#3b3b3b');
        drawPixel(ctx, i, 14, '#3b3b3b');
      }
      drawPixel(ctx, 4, 1, '#3b3b3b');
      drawPixel(ctx, 11, 2, '#3b3b3b');
      drawPixel(ctx, 7, 6, '#3b3b3b');
      drawPixel(ctx, 13, 7, '#3b3b3b');
      drawPixel(ctx, 3, 11, '#3b3b3b');
      drawPixel(ctx, 9, 12, '#3b3b3b');
    });

    // 6. Oak Wood Side (Bark)
    this.textures['wood_side'] = create16x16Texture((ctx) => {
      ctx.fillStyle = '#6b5030';
      ctx.fillRect(0, 0, 16, 16);
      for (let x = 0; x < 16; x++) {
        for (let y = 0; y < 16; y++) {
          if (x % 4 === 0) {
            drawPixel(ctx, x, y, '#4d371d');
          } else if (x % 4 === 1) {
            drawPixel(ctx, x, y, '#5c4326');
          } else {
            const r = seededRandom(x * 17 + y * 3);
            drawPixel(ctx, x, y, r > 0.5 ? '#7a5d38' : '#6b5030');
          }
        }
      }
    });

    // 7. Oak Wood Top (Rings)
    this.textures['wood_top'] = create16x16Texture((ctx) => {
      ctx.fillStyle = '#9e8052';
      ctx.fillRect(0, 0, 16, 16);
      // Bark rim
      for (let i = 0; i < 16; i++) {
        drawPixel(ctx, i, 0, '#4d371d');
        drawPixel(ctx, i, 15, '#4d371d');
        drawPixel(ctx, 0, i, '#4d371d');
        drawPixel(ctx, 15, i, '#4d371d');
      }
      // Tree rings
      ctx.strokeStyle = '#7c6138';
      ctx.lineWidth = 1;
      ctx.strokeRect(3, 3, 10, 10);
      ctx.strokeRect(6, 6, 4, 4);
    });

    // 8. Oak Leaves
    this.textures['leaves'] = create16x16Texture((ctx) => {
      ctx.fillStyle = '#327022';
      ctx.fillRect(0, 0, 16, 16);
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          const r = seededRandom(x * 29 + y * 71);
          if (r < 0.25) drawPixel(ctx, x, y, '#225315');
          else if (r > 0.75) drawPixel(ctx, x, y, '#438f30');
          else if (r > 0.92) drawPixel(ctx, x, y, '#54aa3c');
        }
      }
    });

    // 9. Planks
    this.textures['planks'] = create16x16Texture((ctx) => {
      ctx.fillStyle = '#9e7943';
      ctx.fillRect(0, 0, 16, 16);
      for (let y = 0; y < 16; y++) {
        if (y === 3 || y === 7 || y === 11 || y === 15) {
          for (let x = 0; x < 16; x++) drawPixel(ctx, x, y, '#5a411f');
        } else {
          for (let x = 0; x < 16; x++) {
            const r = seededRandom(x * 11 + y * 19);
            if (r < 0.2) drawPixel(ctx, x, y, '#8e6c38');
            else if (r > 0.8) drawPixel(ctx, x, y, '#b0874e');
          }
        }
      }
      // Nail specks
      drawPixel(ctx, 2, 1, '#412d14');
      drawPixel(ctx, 14, 5, '#412d14');
      drawPixel(ctx, 3, 9, '#412d14');
      drawPixel(ctx, 13, 13, '#412d14');
    });

    // 10. Brick
    this.textures['brick'] = create16x16Texture((ctx) => {
      ctx.fillStyle = '#9c3d2e';
      ctx.fillRect(0, 0, 16, 16);
      // Mortar
      const mortarColor = '#c7b299';
      for (let x = 0; x < 16; x++) {
        drawPixel(ctx, x, 3, mortarColor);
        drawPixel(ctx, x, 7, mortarColor);
        drawPixel(ctx, x, 11, mortarColor);
        drawPixel(ctx, x, 15, mortarColor);
      }
      drawPixel(ctx, 4, 0, mortarColor);
      drawPixel(ctx, 4, 1, mortarColor);
      drawPixel(ctx, 4, 2, mortarColor);
      drawPixel(ctx, 12, 0, mortarColor);
      drawPixel(ctx, 12, 1, mortarColor);
      drawPixel(ctx, 12, 2, mortarColor);

      drawPixel(ctx, 8, 4, mortarColor);
      drawPixel(ctx, 8, 5, mortarColor);
      drawPixel(ctx, 8, 6, mortarColor);

      drawPixel(ctx, 4, 8, mortarColor);
      drawPixel(ctx, 4, 9, mortarColor);
      drawPixel(ctx, 4, 10, mortarColor);
      drawPixel(ctx, 12, 8, mortarColor);
      drawPixel(ctx, 12, 9, mortarColor);
      drawPixel(ctx, 12, 10, mortarColor);

      drawPixel(ctx, 8, 12, mortarColor);
      drawPixel(ctx, 8, 13, mortarColor);
      drawPixel(ctx, 8, 14, mortarColor);
    });

    // 11. Sand
    this.textures['sand'] = create16x16Texture((ctx) => {
      ctx.fillStyle = '#ded195';
      ctx.fillRect(0, 0, 16, 16);
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          const r = seededRandom(x * 61 + y * 43);
          if (r < 0.25) drawPixel(ctx, x, y, '#cfbe7e');
          else if (r > 0.8) drawPixel(ctx, x, y, '#ece1ae');
        }
      }
    });

    // 12. Glass (Translucent)
    this.textures['glass'] = create16x16Texture((ctx) => {
      ctx.fillStyle = 'rgba(215, 235, 245, 0.28)';
      ctx.fillRect(0, 0, 16, 16);
      // Border frame
      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.fillRect(0, 0, 16, 1);
      ctx.fillRect(0, 15, 16, 1);
      ctx.fillRect(0, 0, 1, 16);
      ctx.fillRect(15, 0, 1, 16);
      // Glint streaks
      drawPixel(ctx, 3, 3, 'rgba(255, 255, 255, 0.9)');
      drawPixel(ctx, 4, 4, 'rgba(255, 255, 255, 0.9)');
      drawPixel(ctx, 5, 5, 'rgba(255, 255, 255, 0.9)');
      drawPixel(ctx, 11, 10, 'rgba(255, 255, 255, 0.8)');
      drawPixel(ctx, 12, 11, 'rgba(255, 255, 255, 0.8)');
    });

    // 13. Glowstone
    this.textures['glowstone'] = create16x16Texture((ctx) => {
      ctx.fillStyle = '#f5c35b';
      ctx.fillRect(0, 0, 16, 16);
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          const r = seededRandom(x * 79 + y * 83);
          if (r < 0.25) drawPixel(ctx, x, y, '#d49733');
          else if (r > 0.7) drawPixel(ctx, x, y, '#fff0a6');
          else if (r > 0.9) drawPixel(ctx, x, y, '#ffffff');
        }
      }
    });

    // 14. Bed (Top: red blanket & white pillow)
    this.textures['bed_top'] = create16x16Texture((ctx) => {
      ctx.fillStyle = '#b71c1c'; // Red blanket
      ctx.fillRect(0, 0, 16, 16);
      // White pillow top quarter
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(1, 1, 14, 5);
      // Pillow shadow
      ctx.fillStyle = '#cfd8dc';
      ctx.fillRect(1, 5, 14, 1);
      // Blanket pattern
      for (let y = 6; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          const r = seededRandom(x * 13 + y * 17);
          if (r > 0.8) drawPixel(ctx, x, y, '#d32f2f');
          else if (r < 0.2) drawPixel(ctx, x, y, '#991515');
        }
      }
    });

    this.textures['bed_side'] = create16x16Texture((ctx) => {
      ctx.fillStyle = '#6d4c41'; // Wooden base
      ctx.fillRect(0, 0, 16, 16);
      // White sheet rim
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 16, 4);
      // Red mattress top
      ctx.fillStyle = '#b71c1c';
      ctx.fillRect(0, 0, 16, 2);
      // Bed legs
      ctx.fillStyle = '#3e2723';
      ctx.fillRect(0, 10, 3, 6);
      ctx.fillRect(13, 10, 3, 6);
    });

    // 15. Bookshelf
    this.textures['bookshelf'] = create16x16Texture((ctx) => {
      ctx.fillStyle = '#9e7943'; // Planks frame
      ctx.fillRect(0, 0, 16, 16);
      // Two rows of books
      const bookColors = ['#c62828', '#1565c0', '#2e7d32', '#f9a825', '#6a1b9a', '#ad1457', '#37474f'];
      for (let shelf = 0; shelf < 2; shelf++) {
        const topY = shelf * 7 + 2;
        ctx.fillStyle = '#3e2723';
        ctx.fillRect(1, topY, 14, 5);
        let currX = 2;
        let cIdx = 0;
        while (currX < 14) {
          const bookWidth = Math.floor(seededRandom(currX + shelf * 20) * 2) + 1;
          const height = 4 + Math.floor(seededRandom(currX * 3) * 2);
          ctx.fillStyle = bookColors[cIdx % bookColors.length];
          ctx.fillRect(currX, topY + (5 - height), bookWidth, height);
          currX += bookWidth;
          cIdx++;
        }
      }
    });

    // 16. TNT Side
    this.textures['tnt_side'] = create16x16Texture((ctx) => {
      ctx.fillStyle = '#d32f2f'; // Red dynamite
      ctx.fillRect(0, 0, 16, 16);
      // Vertical stick divisions
      for (let x = 0; x < 16; x += 4) {
        ctx.fillStyle = '#b71c1c';
        ctx.fillRect(x, 0, 1, 16);
      }
      // White label band
      ctx.fillStyle = '#f5f5f5';
      ctx.fillRect(0, 5, 16, 6);
      // "TNT" black letters
      ctx.fillStyle = '#111111';
      // T
      ctx.fillRect(2, 6, 3, 1);
      ctx.fillRect(3, 7, 1, 3);
      // N
      ctx.fillRect(6, 6, 1, 4);
      ctx.fillRect(7, 7, 1, 1);
      ctx.fillRect(8, 8, 1, 1);
      ctx.fillRect(9, 6, 1, 4);
      // T
      ctx.fillRect(11, 6, 3, 1);
      ctx.fillRect(12, 7, 1, 3);
    });

    // 17. TNT Top
    this.textures['tnt_top'] = create16x16Texture((ctx) => {
      ctx.fillStyle = '#c62828';
      ctx.fillRect(0, 0, 16, 16);
      // Fuse center
      ctx.fillStyle = '#616161';
      ctx.fillRect(6, 6, 4, 4);
      ctx.fillStyle = '#212121';
      drawPixel(ctx, 7, 7, '#212121');
      drawPixel(ctx, 8, 7, '#d32f2f'); // spark fuse
    });

    // 18. Diamond Ore
    this.textures['diamond_ore'] = create16x16Texture((ctx) => {
      ctx.fillStyle = '#7a7a7a';
      ctx.fillRect(0, 0, 16, 16);
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          const r = seededRandom(x * 19 + y * 29);
          if (r < 0.2) drawPixel(ctx, x, y, '#6b6b6b');
          else if (r < 0.4) drawPixel(ctx, x, y, '#888888');
        }
      }
      // Sparkling diamond flecks
      const gems = [[3, 3], [4, 4], [11, 2], [12, 3], [7, 8], [8, 9], [3, 12], [4, 13], [12, 11]];
      gems.forEach(([gx, gy]) => {
        drawPixel(ctx, gx, gy, '#40e0d0');
        drawPixel(ctx, gx + 1, gy, '#00ffff');
        drawPixel(ctx, gx, gy + 1, '#ffffff');
      });
    });

    // 19. Gold Ore
    this.textures['gold_ore'] = create16x16Texture((ctx) => {
      ctx.fillStyle = '#7a7a7a';
      ctx.fillRect(0, 0, 16, 16);
      const gems = [[2, 4], [3, 5], [10, 4], [11, 5], [6, 10], [7, 11], [12, 12], [13, 13]];
      gems.forEach(([gx, gy]) => {
        drawPixel(ctx, gx, gy, '#ffd700');
        drawPixel(ctx, gx + 1, gy, '#ffae19');
        drawPixel(ctx, gx, gy + 1, '#fff494');
      });
    });

    // 20. Coal Ore
    this.textures['coal_ore'] = create16x16Texture((ctx) => {
      ctx.fillStyle = '#7a7a7a';
      ctx.fillRect(0, 0, 16, 16);
      const coal = [[3, 4], [4, 4], [10, 3], [11, 3], [6, 8], [7, 8], [8, 9], [3, 11], [12, 10]];
      coal.forEach(([cx, cy]) => {
        drawPixel(ctx, cx, cy, '#212121');
        drawPixel(ctx, cx + 1, cy, '#111111');
      });
    });

    // 21. Water
    this.textures['water'] = create16x16Texture((ctx) => {
      ctx.fillStyle = 'rgba(41, 128, 185, 0.72)';
      ctx.fillRect(0, 0, 16, 16);
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          if ((x + y) % 4 === 0) {
            drawPixel(ctx, x, y, 'rgba(84, 160, 255, 0.85)');
          }
        }
      }
    });
  }

  // Get 6-sided materials array for a block type: [+X, -X, +Y, -Y, +Z, -Z]
  // In Three.js BoxGeometry face material order is: Right, Left, Top, Bottom, Front, Back
  public getBlockMaterials(type: BlockType): THREE.Material[] {
    const key = `mat_${type}`;
    if (this.materialsCache.has(key)) {
      return this.materialsCache.get(key)!;
    }

    let right: THREE.CanvasTexture = this.textures['stone'];
    let left: THREE.CanvasTexture = this.textures['stone'];
    let top: THREE.CanvasTexture = this.textures['stone'];
    let bottom: THREE.CanvasTexture = this.textures['stone'];
    let front: THREE.CanvasTexture = this.textures['stone'];
    let back: THREE.CanvasTexture = this.textures['stone'];
    let isTranslucent = false;
    let opacity = 1.0;
    let emissiveColor = 0x000000;
    let emissiveIntensity = 0;

    switch (type) {
      case BlockType.GRASS:
        top = this.textures['grass_top'];
        bottom = this.textures['dirt'];
        right = left = front = back = this.textures['grass_side'];
        break;
      case BlockType.DIRT:
        top = bottom = right = left = front = back = this.textures['dirt'];
        break;
      case BlockType.STONE:
        top = bottom = right = left = front = back = this.textures['stone'];
        break;
      case BlockType.COBBLESTONE:
        top = bottom = right = left = front = back = this.textures['cobblestone'];
        break;
      case BlockType.OAK_WOOD:
        top = bottom = this.textures['wood_top'];
        right = left = front = back = this.textures['wood_side'];
        break;
      case BlockType.OAK_LEAVES:
        top = bottom = right = left = front = back = this.textures['leaves'];
        break;
      case BlockType.PLANKS:
        top = bottom = right = left = front = back = this.textures['planks'];
        break;
      case BlockType.BRICK:
        top = bottom = right = left = front = back = this.textures['brick'];
        break;
      case BlockType.SAND:
        top = bottom = right = left = front = back = this.textures['sand'];
        break;
      case BlockType.GLASS:
        top = bottom = right = left = front = back = this.textures['glass'];
        isTranslucent = true;
        opacity = 0.55;
        break;
      case BlockType.GLOWSTONE:
        top = bottom = right = left = front = back = this.textures['glowstone'];
        emissiveColor = 0xf5c35b;
        emissiveIntensity = 0.8;
        break;
      case BlockType.BED:
        top = this.textures['bed_top'];
        bottom = this.textures['wood_top'];
        right = left = front = back = this.textures['bed_side'];
        break;
      case BlockType.BOOKSHELF:
        top = bottom = this.textures['planks'];
        right = left = front = back = this.textures['bookshelf'];
        break;
      case BlockType.TNT:
        top = bottom = this.textures['tnt_top'];
        right = left = front = back = this.textures['tnt_side'];
        break;
      case BlockType.DIAMOND_ORE:
        top = bottom = right = left = front = back = this.textures['diamond_ore'];
        break;
      case BlockType.GOLD_ORE:
        top = bottom = right = left = front = back = this.textures['gold_ore'];
        break;
      case BlockType.COAL_ORE:
        top = bottom = right = left = front = back = this.textures['coal_ore'];
        break;
      case BlockType.WATER:
        top = bottom = right = left = front = back = this.textures['water'];
        isTranslucent = true;
        opacity = 0.65;
        break;
      default:
        top = bottom = right = left = front = back = this.textures['stone'];
    }

    const createMat = (map: THREE.CanvasTexture) => {
      return new THREE.MeshLambertMaterial({
        map,
        transparent: isTranslucent,
        opacity,
        emissive: new THREE.Color(emissiveColor),
        emissiveIntensity,
      });
    };

    const mats = [
      createMat(right),
      createMat(left),
      createMat(top),
      createMat(bottom),
      createMat(front),
      createMat(back),
    ];

    this.materialsCache.set(key, mats);
    return mats;
  }
}

export const textureAtlas = new TextureAtlas();
