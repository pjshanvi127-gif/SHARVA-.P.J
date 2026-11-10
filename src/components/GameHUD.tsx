/**
 * GameHUD - Low Occlusion In-Game Overlay
 * Keeps >85% of viewport unobstructed, crisp pixel typography, zero backdrop-filter.
 * Integrates real-time top-down MiniMap radar, landscape action bar, and fullscreen toggle.
 */

import React from 'react';
import { GameStats, BlockType } from '../types/game';
import { BLOCK_REGISTRY } from '../world/blockDefinitions';
import { VoxelWorld } from '../world/voxelWorld';
import { MiniMap } from './MiniMap';
import {
  Volume2,
  VolumeX,
  Pause,
  Sun,
  Moon,
  Sparkles,
  Shirt,
  Home,
  Smartphone,
  Maximize2,
  Minimize2,
} from 'lucide-react';

interface GameHUDProps {
  stats: GameStats;
  hotbar: BlockType[];
  selectedSlot: number;
  world: VoxelWorld | null;
  onSelectSlot: (idx: number) => void;
  onOpenSkins: () => void;
  onTogglePause: () => void;
  onSpawnHouse: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onToggleChat: () => void;
  isChatOpen: boolean;
  isMobile?: boolean;
  showMobileControls?: boolean;
  onToggleMobileControls?: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  stats,
  hotbar,
  selectedSlot,
  world,
  onSelectSlot,
  onOpenSkins,
  onTogglePause,
  onSpawnHouse,
  isMuted,
  onToggleMute,
  onToggleChat,
  isChatOpen,
  isMobile = false,
  showMobileControls = false,
  onToggleMobileControls,
  isFullscreen = false,
  onToggleFullscreen,
}) => {
  return (
    <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-2 sm:p-4 select-none font-mono">
      {/* Top Bar: Left Stats Cluster & Right Quick Actions + MiniMap */}
      <div className="flex justify-between items-start gap-2">
        {/* Left Stats Cluster */}
        <div className="bg-stone-900/85 border border-stone-700/80 p-1.5 sm:p-2.5 rounded-xl shadow-xl space-y-0.5 sm:space-y-1 text-xs">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="font-bold text-amber-400 text-[11px] sm:text-xs">⛏️ VoxelCraft</span>
            <span className="px-1 py-0.2 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded text-[9px] sm:text-[10px]">
              {stats.gameMode.toUpperCase()}
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 text-stone-300 tabular-nums text-[10px] sm:text-xs">
            <span>FPS: <strong className={stats.fps >= 50 ? 'text-emerald-400' : 'text-amber-400'}>{stats.fps}</strong></span>
            <span>XYZ: <strong className="text-cyan-300">{stats.x.toFixed(1)}, {stats.y.toFixed(1)}, {stats.z.toFixed(1)}</strong></span>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-stone-300">
            <span>Target:</span>
            <span className="text-amber-300 font-bold bg-stone-800/80 px-1.5 py-0.5 rounded border border-stone-700 text-[11px]">
              {stats.targetBlock}
            </span>
          </div>

          <div className="flex items-center gap-2 text-stone-300 tabular-nums text-[10px] sm:text-xs">
            {stats.isDay ? <Sun className="w-3 h-3 text-amber-400" /> : <Moon className="w-3 h-3 text-cyan-300" />}
            <span className={stats.isDay ? 'text-amber-300' : 'text-cyan-300'}>{stats.timeString}</span>
            {stats.isFlying && (
              <span className="text-[9px] sm:text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/40 px-1 rounded flex items-center gap-0.5">
                <Sparkles className="w-2.5 h-2.5" /> FLY
              </span>
            )}
          </div>
        </div>

        {/* Right Area: Action Buttons + MiniMap */}
        <div className="flex flex-col items-end gap-1.5 sm:gap-2 pointer-events-auto">
          {/* Action Buttons Row */}
          <div className="flex items-center gap-1 sm:gap-1.5">
            <button
              onClick={onSpawnHouse}
              title="Instant House Blueprint"
              className="flex items-center gap-1 px-2 py-1.5 sm:px-2.5 sm:py-2 bg-stone-900/85 hover:bg-stone-800 border border-stone-700 rounded-lg text-amber-300 text-[10px] sm:text-xs shadow-lg transition cursor-pointer"
            >
              <Home className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">Cottage</span>
            </button>

            <button
              onClick={onOpenSkins}
              title="Change Character Skin [C]"
              className="flex items-center gap-1 px-2 py-1.5 sm:px-2.5 sm:py-2 bg-indigo-950/85 hover:bg-indigo-900 border border-indigo-700 rounded-lg text-indigo-200 text-[10px] sm:text-xs shadow-lg transition cursor-pointer"
            >
              <Shirt className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden md:inline">Skins</span>
            </button>

            {/* Mobile Touch Controls Toggle */}
            {onToggleMobileControls && (
              <button
                onClick={onToggleMobileControls}
                title={showMobileControls ? "Hide Touch Controls" : "Show Touch Controls"}
                className={`p-1.5 sm:p-2 border rounded-lg text-xs transition cursor-pointer flex items-center ${
                  showMobileControls
                    ? 'bg-amber-600/90 border-amber-400 text-white'
                    : 'bg-stone-900/85 border-stone-700 text-stone-300 hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Landscape Fullscreen Toggle */}
            {onToggleFullscreen && (
              <button
                onClick={onToggleFullscreen}
                title={isFullscreen ? "Exit Fullscreen" : "Enter Landscape Fullscreen"}
                className="p-1.5 sm:p-2 bg-stone-900/85 hover:bg-stone-800 border border-stone-700 rounded-lg text-stone-300 hover:text-white transition cursor-pointer"
              >
                {isFullscreen ? <Minimize2 className="w-3.5 h-3.5 text-amber-400" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
            )}

            <button
              onClick={onToggleMute}
              title="Toggle Audio"
              className="p-1.5 sm:p-2 bg-stone-900/85 hover:bg-stone-800 border border-stone-700 rounded-lg text-stone-300 transition cursor-pointer"
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
            </button>

            <button
              onClick={onTogglePause}
              title="Pause Menu [Esc]"
              className="p-1.5 sm:p-2 bg-stone-900/85 hover:bg-stone-800 border border-stone-700 rounded-lg text-stone-300 hover:text-white transition cursor-pointer"
            >
              <Pause className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* MiniMap Radar Component */}
          <MiniMap
            playerX={stats.x}
            playerZ={stats.z}
            playerYaw={stats.yaw}
            world={world}
            bots={stats.bots || []}
            monsters={stats.monsters || []}
            fishes={stats.fishes || []}
            isMobile={isMobile}
          />
        </div>
      </div>

      {/* Center Pixel Crosshair */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative w-5 h-5 flex items-center justify-center">
          <div className="absolute w-full h-[2px] bg-white drop-shadow-[0_1px_1px_rgba(0,0,0,1)]"></div>
          <div className="absolute h-full w-[2px] bg-white drop-shadow-[0_1px_1px_rgba(0,0,0,1)]"></div>
          <div className="w-1 h-1 bg-white rounded-full"></div>
        </div>
      </div>

      {/* Bottom Area: Health, Hunger, Hotbar & Chat Toggle */}
      <div className="flex flex-col items-center justify-center gap-1 sm:gap-1.5 pb-1">
        {/* Health Hearts, Hunger Drumsticks, & Skin Badge */}
        <div className="flex items-center gap-3 sm:gap-6 px-2.5 sm:px-4 py-0.5 sm:py-1 bg-stone-950/85 border border-stone-800 rounded-full shadow-xl">
          {/* 10 Health Hearts */}
          <div className="flex items-center gap-0.5 text-xs sm:text-sm" title={`Health: ${stats.health}/10`}>
            {Array.from({ length: 10 }).map((_, i) => (
              <span key={i} className={i < stats.health ? 'opacity-100' : 'opacity-25 grayscale'}>
                ❤️
              </span>
            ))}
          </div>

          {/* 10 Hunger Drumsticks */}
          <div className="flex items-center gap-0.5 text-xs sm:text-sm" title={`Hunger: ${stats.hunger}/10`}>
            {Array.from({ length: 10 }).map((_, i) => (
              <span key={i} className={i < stats.hunger ? 'opacity-100' : 'opacity-25 grayscale'}>
                🍗
              </span>
            ))}
          </div>

          {/* Active Skin Badge */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-stone-300 border-l border-stone-800 pl-3">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: `#${stats.activeSkin.shirtColor.toString(16).padStart(6, '0')}` }}></span>
            <span className="text-[11px]">{stats.activeSkin.name}</span>
          </div>
        </div>

        {/* 9 Hotbar Slots (Cleanly centered for landscape play) */}
        <div className="flex items-center gap-1 sm:gap-1.5 p-1 sm:p-1.5 bg-stone-950/90 border-2 border-stone-700 rounded-2xl shadow-2xl pointer-events-auto max-w-full overflow-x-auto">
          {hotbar.map((blockType, idx) => {
            const def = BLOCK_REGISTRY[blockType];
            const isSelected = idx === selectedSlot;

            return (
              <button
                key={idx}
                onClick={() => onSelectSlot(idx)}
                className={`relative w-8 h-8 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer shrink-0 ${
                  isSelected
                    ? 'bg-stone-800 border-2 border-white scale-105 shadow-[0_0_12px_rgba(255,255,255,0.7)] z-10'
                    : 'bg-stone-900/90 border border-stone-700/80 hover:bg-stone-800/80'
                }`}
                title={`${def ? def.name : 'Empty'} (Slot ${idx + 1})`}
              >
                <span className="text-sm sm:text-xl filter drop-shadow-sm">{def ? def.icon : '—'}</span>
                <span className="absolute bottom-0.5 right-0.5 text-[7px] sm:text-[9px] font-bold text-stone-400">
                  {idx + 1}
                </span>
              </button>
            );
          })}
        </div>

        {/* Chat Toggle Indicator */}
        <div className="pointer-events-auto">
          <button
            onClick={onToggleChat}
            className="text-[9px] sm:text-[10px] text-stone-400 hover:text-white bg-stone-950/70 border border-stone-800 px-2 py-0.5 rounded-md transition cursor-pointer"
          >
            {isChatOpen ? 'Close chat [Esc]' : 'Tap to Chat / Commands'}
          </button>
        </div>
      </div>
    </div>
  );
};
