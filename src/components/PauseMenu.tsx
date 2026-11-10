/**
 * PauseMenu - In-Game Pause, Settings & Controls Modal
 */

import React from 'react';
import { GameMode } from '../types/game';
import { sounds } from '../audio/soundEngine';
import { Play, Home, Shirt, Volume2, VolumeX, Sparkles, LogOut, X } from 'lucide-react';

interface PauseMenuProps {
  isOpen: boolean;
  onResume: () => void;
  onOpenSkins: () => void;
  onSpawnHouse: () => void;
  onExitToTitle: () => void;
  gameMode: GameMode;
  onToggleGameMode: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  volume: number;
  onVolumeChange: (vol: number) => void;
}

export const PauseMenu: React.FC<PauseMenuProps> = ({
  isOpen,
  onResume,
  onOpenSkins,
  onSpawnHouse,
  onExitToTitle,
  gameMode,
  onToggleGameMode,
  isMuted,
  onToggleMute,
  volume,
  onVolumeChange,
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-40 bg-stone-950/80 flex items-center justify-center p-4 select-none font-mono">
      <div className="bg-stone-900 border-2 border-stone-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-stone-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">⏸️</span>
            <h2 className="text-xl font-bold text-amber-400">GAME PAUSED</h2>
          </div>
          <button
            onClick={onResume}
            className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Primary Action Buttons */}
        <div className="space-y-2.5">
          <button
            onClick={() => {
              sounds.playClickSound();
              onResume();
            }}
            className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition shadow-lg cursor-pointer text-sm"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>RESUME PLAYING [ESC]</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                sounds.playClickSound();
                onSpawnHouse();
                onResume();
              }}
              className="py-2.5 px-3 bg-stone-800 hover:bg-stone-700 border border-stone-600 text-amber-300 font-semibold rounded-xl flex items-center justify-center gap-2 transition text-xs cursor-pointer"
            >
              <Home className="w-4 h-4 text-amber-400" />
              <span>Build Cottage</span>
            </button>

            <button
              onClick={() => {
                sounds.playClickSound();
                onOpenSkins();
              }}
              className="py-2.5 px-3 bg-indigo-950 hover:bg-indigo-900 border border-indigo-700 text-indigo-200 font-semibold rounded-xl flex items-center justify-center gap-2 transition text-xs cursor-pointer"
            >
              <Shirt className="w-4 h-4 text-indigo-400" />
              <span>Wardrobe [C]</span>
            </button>
          </div>
        </div>

        {/* Settings: Audio & Game Mode */}
        <div className="bg-stone-950/70 border border-stone-800 p-4 rounded-xl space-y-4 text-xs text-stone-300">
          <div className="text-stone-400 font-bold uppercase tracking-wider text-[10px]">
            Game Settings
          </div>

          {/* Sound Volume Slider & Mute */}
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2 text-stone-200">
              <button
                onClick={onToggleMute}
                className="hover:text-white transition cursor-pointer"
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
              </button>
              <span>Volume</span>
            </span>

            <div className="flex items-center gap-3 flex-1 max-w-[180px]">
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <span className="w-8 text-right font-bold text-stone-400">
                {Math.round(volume * 100)}%
              </span>
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-stone-200">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>Game Mode</span>
            </span>
            <button
              onClick={() => {
                sounds.playClickSound();
                onToggleGameMode();
              }}
              className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 border border-stone-600 rounded-lg text-amber-300 font-bold transition cursor-pointer"
            >
              {gameMode === 'survival' ? 'SURVIVAL' : 'CREATIVE (FLY)'}
            </button>
          </div>
        </div>

        {/* Controls Cheatsheet */}
        <div className="bg-stone-950/70 border border-stone-800 p-3.5 rounded-xl text-[11px] text-stone-400 space-y-1">
          <div className="text-amber-400 font-bold mb-1">Controls Guide:</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
            <div>• <b className="text-stone-200">WASD</b>: Walk / Strafe</div>
            <div>• <b className="text-stone-200">Space</b>: Jump / Fly Up</div>
            <div>• <b className="text-stone-200">Shift</b>: Sprint / Fly Down</div>
            <div>• <b className="text-stone-200">L-Click</b>: Break Voxel</div>
            <div>• <b className="text-stone-200">R-Click</b>: Place Block</div>
            <div>• <b className="text-stone-200">1 - 9 / Scroll</b>: Hotbar</div>
            <div>• <b className="text-stone-200">E</b>: Sleep at Night (Bed)</div>
            <div>• <b className="text-stone-200">Enter</b>: Chat & Commands</div>
          </div>
        </div>

        {/* Exit Button */}
        <button
          onClick={() => {
            sounds.playClickSound();
            onExitToTitle();
          }}
          className="w-full py-2.5 px-4 bg-stone-800 hover:bg-red-950/80 border border-stone-700 hover:border-red-700 text-stone-300 hover:text-red-200 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer text-xs"
        >
          <LogOut className="w-4 h-4" />
          <span>Exit to Title Screen</span>
        </button>
      </div>
    </div>
  );
};
