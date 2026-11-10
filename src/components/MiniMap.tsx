/**
 * MiniMap - High-Performance Real-Time Radar & Top-Down View
 * Renders player surroundings, terrain relief, bot companions, and points of interest.
 * Optimized for mobile with zoom and collapse controls.
 */

import React, { useRef, useEffect, useState } from 'react';
import { VoxelWorld, WORLD_X, WORLD_Z, STARTER_COTTAGE_X, STARTER_COTTAGE_Z } from '../world/voxelWorld';
import { BlockType } from '../types/game';
import { ZoomIn, ZoomOut, Compass, ChevronDown, ChevronUp } from 'lucide-react';

interface MiniMapProps {
  playerX: number;
  playerZ: number;
  playerYaw: number;
  world: VoxelWorld | null;
  bots: { name: string; x: number; z: number }[];
  monsters?: { x: number; z: number }[];
  fishes?: { x: number; z: number }[];
  isMobile?: boolean;
}

// Color palette for top-down voxel mapping
const BLOCK_COLORS: Record<number, string> = {
  [BlockType.AIR]: '#0a0a0c',
  [BlockType.GRASS]: '#4ade80',
  [BlockType.DIRT]: '#854d0e',
  [BlockType.STONE]: '#64748b',
  [BlockType.COBBLESTONE]: '#475569',
  [BlockType.OAK_WOOD]: '#78350f',
  [BlockType.OAK_LEAVES]: '#15803d',
  [BlockType.PLANKS]: '#b45309',
  [BlockType.BRICK]: '#b91c1c',
  [BlockType.SAND]: '#fde047',
  [BlockType.GLASS]: '#67e8f9',
  [BlockType.GLOWSTONE]: '#facc15',
  [BlockType.BED]: '#dc2626',
  [BlockType.BOOKSHELF]: '#a16207',
  [BlockType.TNT]: '#ef4444',
  [BlockType.COAL_ORE]: '#1e293b',
  [BlockType.GOLD_ORE]: '#eab308',
  [BlockType.DIAMOND_ORE]: '#38bdf8',
  [BlockType.WATER]: '#0284c7',
};

export const MiniMap: React.FC<MiniMapProps> = ({
  playerX,
  playerZ,
  playerYaw,
  world,
  bots,
  monsters = [],
  fishes = [],
  isMobile = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoomLevel, setZoomLevel] = useState<1 | 2>(1); // 1 = 14 radius, 2 = 28 radius
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  // Render Minimap frame
  useEffect(() => {
    if (isCollapsed || !world || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radiusPx = (width / 2) - 4;

    // View radius in voxel blocks (16 blocks for close-up, 32 for panoramic landscape)
    const blockRadius = zoomLevel === 1 ? 16 : 32;
    const scale = radiusPx / blockRadius;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Save clip to circle
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radiusPx, 0, Math.PI * 2);
    ctx.clip();

    // Background fill (dark void)
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);

    // Render terrain grid around player
    const startX = Math.floor(playerX - blockRadius);
    const endX = Math.ceil(playerX + blockRadius);
    const startZ = Math.floor(playerZ - blockRadius);
    const endZ = Math.ceil(playerZ + blockRadius);

    for (let x = startX; x <= endX; x++) {
      for (let z = startZ; z <= endZ; z++) {
        const dx = x - playerX;
        const dz = z - playerZ;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist > blockRadius + 0.5) continue;

        const screenX = centerX + dx * scale;
        const screenY = centerY + dz * scale;

        if (x >= 0 && x < WORLD_X && z >= 0 && z < WORLD_Z) {
          const highY = world.getHighestSolidBlock(x, z);
          const blockType = world.getBlock(x, highY, z);
          let color = BLOCK_COLORS[blockType] || '#64748b';

          // Elevation shading relative to sea level (Y=5)
          const elevationDiff = highY - 5;
          ctx.fillStyle = color;
          ctx.fillRect(screenX, screenY, Math.ceil(scale) + 1, Math.ceil(scale) + 1);

          // Subtle hill relief highlight / shadow
          if (elevationDiff > 2) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
            ctx.fillRect(screenX, screenY, Math.ceil(scale), Math.ceil(scale));
          } else if (elevationDiff < 0) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.fillRect(screenX, screenY, Math.ceil(scale), Math.ceil(scale));
          }
        } else {
          // Out of bounds void
          ctx.fillStyle = '#090d16';
          ctx.fillRect(screenX, screenY, Math.ceil(scale), Math.ceil(scale));
        }
      }
    }

    // Draw starter cottage marker
    const cottageDx = STARTER_COTTAGE_X - playerX;
    const cottageDz = STARTER_COTTAGE_Z - playerZ;
    const cottageDist = Math.sqrt(cottageDx * cottageDx + cottageDz * cottageDz);
    if (cottageDist <= blockRadius - 1) {
      const cX = centerX + cottageDx * scale;
      const cY = centerY + cottageDz * scale;
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(cX, cY, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Draw bot companion markers
    for (const bot of bots) {
      const bdx = bot.x - playerX;
      const bdz = bot.z - playerZ;
      const bDist = Math.sqrt(bdx * bdx + bdz * bdz);

      if (bDist <= blockRadius) {
        const bx = centerX + bdx * scale;
        const by = centerY + bdz * scale;

        // Bot circle dot
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(bx, by, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    // Draw swimming fish markers (golden-orange dots)
    if (fishes) {
      for (const fish of fishes) {
        const fdx = fish.x - playerX;
        const fdz = fish.z - playerZ;
        const fDist = Math.sqrt(fdx * fdx + fdz * fdz);
        if (fDist <= blockRadius) {
          const fx = centerX + fdx * scale;
          const fy = centerY + fdz * scale;
          ctx.fillStyle = '#f97316';
          ctx.beginPath();
          ctx.arc(fx, fy, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // Draw hostile zombie monsters (bright red dots with warning pulse ring)
    if (monsters) {
      for (const mob of monsters) {
        const mdx = mob.x - playerX;
        const mdz = mob.z - playerZ;
        const mDist = Math.sqrt(mdx * mdx + mdz * mdz);
        if (mDist <= blockRadius) {
          const mx = centerX + mdx * scale;
          const my = centerY + mdz * scale;

          // Glowing danger ring
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(mx, my, 5.5, 0, Math.PI * 2);
          ctx.stroke();

          // Red zombie dot
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(mx, my, 3.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // Draw Player Vision Cone (Field of view)
    ctx.save();
    ctx.translate(centerX, centerY);
    // playerYaw is horizontal angle; in canvas, standard angle 0 is right (+X), -Z is up.
    // Three.js forward is (0, 0, -1) rotated by yaw.
    const forwardAngle = -playerYaw - Math.PI / 2;

    const fovHalf = 0.45; // ~50 degrees FOV cone
    const coneRadius = radiusPx * 0.75;
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, coneRadius);
    gradient.addColorStop(0, 'rgba(56, 189, 248, 0.4)');
    gradient.addColorStop(1, 'rgba(56, 189, 248, 0.0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, coneRadius, forwardAngle - fovHalf, forwardAngle + fovHalf);
    ctx.closePath();
    ctx.fill();

    // Draw Player Triangular Heading Arrow
    ctx.rotate(forwardAngle);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(7, 0); // front tip
    ctx.lineTo(-5, -4.5);
    ctx.lineTo(-2, 0);
    ctx.lineTo(-5, 4.5);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    ctx.restore(); // Restore clip

    // Radar border ring
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radiusPx, 0, Math.PI * 2);
    ctx.stroke();

    // Compass Cardinal Marks: N, S, E, W
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#f87171'; // Red for North
    ctx.fillText('N', centerX, centerY - radiusPx + 8);
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('S', centerX, centerY + radiusPx - 8);
    ctx.fillText('W', centerX - radiusPx + 8, centerY);
    ctx.fillText('E', centerX + radiusPx - 8, centerY);
  }, [playerX, playerZ, playerYaw, world, bots, monsters, fishes, zoomLevel, isCollapsed]);

  // Canvas size: compact on mobile, standard on desktop
  const size = isMobile ? 124 : 144;

  return (
    <div className="pointer-events-auto flex flex-col items-end select-none font-mono">
      {/* MiniMap Card Container */}
      <div className="bg-stone-950/90 border border-stone-700/80 rounded-2xl p-1.5 shadow-2xl flex flex-col items-center">
        {/* Top Control Header */}
        <div className="w-full flex items-center justify-between px-1.5 py-0.5 text-[10px] text-stone-300 border-b border-stone-800 mb-1">
          <div className="flex items-center gap-1 font-bold text-amber-400">
            <Compass className="w-3 h-3 text-amber-400" />
            <span>RADAR</span>
          </div>

          <div className="flex items-center gap-1">
            {/* Zoom toggle button */}
            {!isCollapsed && (
              <button
                onClick={() => setZoomLevel((z) => (z === 1 ? 2 : 1))}
                className="p-1 hover:bg-stone-800 rounded text-stone-400 hover:text-white transition cursor-pointer"
                title={`Zoom: ${zoomLevel === 1 ? 'Close-up' : 'Wide-area'}`}
              >
                {zoomLevel === 1 ? <ZoomIn className="w-3 h-3" /> : <ZoomOut className="w-3 h-3" />}
              </button>
            )}

            {/* Collapse / Expand toggle button for mobile */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1 hover:bg-stone-800 rounded text-stone-400 hover:text-white transition cursor-pointer"
              title={isCollapsed ? 'Expand MiniMap' : 'Collapse MiniMap'}
            >
              {isCollapsed ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
            </button>
          </div>
        </div>

        {/* Collapsible Canvas Map View */}
        {!isCollapsed && (
          <div className="relative flex flex-col items-center">
            <canvas
              ref={canvasRef}
              width={size}
              height={size}
              className="rounded-full shadow-inner bg-slate-950"
              style={{ width: `${size}px`, height: `${size}px` }}
            />

            {/* Bottom Sub-info: X/Z Coordinates & Bot Indicator */}
            <div className="mt-1 flex items-center justify-between w-full px-1 text-[9px] text-stone-400 tabular-nums">
              <span>X:{Math.round(playerX)} Z:{Math.round(playerZ)}</span>
              <span className="text-emerald-400 font-semibold">{bots.length} online</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
