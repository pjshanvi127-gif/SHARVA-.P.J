/**
 * Title Screen for VoxelCraft 3D
 * Live atmospheric 3D camera pan, bespoke SVG title lockup, Start CTA, and landscape optimization.
 */

import React, { useEffect } from 'react';
import { GameMode, CharacterSkin } from '../types/game';
import { sounds } from '../audio/soundEngine';
import { Volume2, VolumeX, Sparkles, Shield, Compass, Shirt, Maximize2 } from 'lucide-react';

interface TitleScreenProps {
  onStartGame: (mode: GameMode) => void;
  onOpenSkins: () => void;
  activeSkin: CharacterSkin;
  isMuted: boolean;
  onToggleMute: () => void;
  onEnterLandscapeFullscreen?: () => void;
  isMobile?: boolean;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStartGame,
  onOpenSkins,
  activeSkin,
  isMuted,
  onToggleMute,
  onEnterLandscapeFullscreen,
  isMobile = false,
}) => {
  const [selectedMode, setSelectedMode] = React.useState<GameMode>('survival');

  // Allow pressing Enter or Space to start instantly
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Enter' || e.code === 'Space') {
        sounds.playClickSound();
        onStartGame(selectedMode);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onStartGame, selectedMode]);

  return (
    <div className="absolute inset-0 z-30 pointer-events-none flex flex-col justify-between p-3 sm:p-6 lg:p-8 select-none overflow-y-auto">
      {/* Top Header: Brand & Quick Toggles */}
      <div className="flex justify-between items-center pointer-events-auto">
        <div className="flex items-center gap-1.5 bg-stone-900/80 border border-stone-700/80 px-2.5 py-1 rounded-lg text-[10px] sm:text-xs font-mono text-stone-300">
          <span className="w-2 h-2 rounded-sm bg-emerald-500 animate-pulse"></span>
          <span>WebGL 2.0 · Landscape Engine</span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {onEnterLandscapeFullscreen && (
            <button
              onClick={() => {
                sounds.playClickSound();
                onEnterLandscapeFullscreen();
              }}
              title="Fullscreen Landscape Mode"
              className="p-1.5 sm:p-2 bg-amber-600/80 hover:bg-amber-600 border border-amber-400 text-white rounded-lg text-xs font-mono transition cursor-pointer flex items-center gap-1"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Landscape Fullscreen</span>
            </button>
          )}

          <button
            onClick={onToggleMute}
            aria-label="Toggle Audio"
            className="p-1.5 sm:p-2 bg-stone-900/80 hover:bg-stone-800 border border-stone-700/80 rounded-lg text-stone-300 hover:text-white transition cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
          </button>

          <button
            onClick={() => {
              sounds.playClickSound();
              onOpenSkins();
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-950/80 hover:bg-indigo-900/90 border border-indigo-700/80 rounded-lg text-indigo-200 hover:text-white text-[11px] sm:text-xs font-mono transition cursor-pointer"
          >
            <Shirt className="w-3.5 h-3.5 text-indigo-400" />
            <span>Skin: <b className="text-white">{activeSkin.name}</b></span>
          </button>
        </div>
      </div>

      {/* Hero Centerpiece: Bespoke SVG Title Lockup */}
      <div className="flex flex-col items-center justify-center my-auto pointer-events-auto max-w-lg mx-auto text-center space-y-3 sm:space-y-4 py-2">
        <div className="space-y-1.5">
          {/* Bespoke SVG Title Lockup */}
          <svg viewBox="0 0 540 90" className="w-full max-w-xs sm:max-w-md filter drop-shadow-[0_8px_20px_rgba(0,0,0,0.85)]">
            <defs>
              <linearGradient id="voxelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#facc15" />
                <stop offset="50%" stopColor="#eab308" />
                <stop offset="100%" stopColor="#ca8a04" />
              </linearGradient>
            </defs>
            <text x="272" y="58" textAnchor="middle" fill="#000000" fontSize="50" fontFamily="'Press Start 2P', monospace" fontWeight="900" opacity="0.9">
              VOXELCRAFT
            </text>
            <text x="270" y="56" textAnchor="middle" fill="url(#voxelGrad)" fontSize="50" fontFamily="'Press Start 2P', monospace" fontWeight="900">
              VOXELCRAFT
            </text>
            <rect x="445" y="16" width="60" height="26" rx="4" fill="#22c55e" stroke="#15803d" strokeWidth="2" />
            <text x="475" y="34" textAnchor="middle" fill="#ffffff" fontSize="14" fontFamily="'Press Start 2P', monospace" fontWeight="bold">
              3D
            </text>
          </svg>

          <p className="text-stone-300 font-mono text-[11px] sm:text-xs max-w-sm mx-auto leading-relaxed drop-shadow-md">
            Procedural voxel sandbox with dynamic day-night cycle, building, and multiplayer companions.
          </p>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex p-1 bg-stone-900/90 border border-stone-700 rounded-xl w-full max-w-sm shadow-xl">
          <button
            onClick={() => {
              sounds.playClickSound();
              setSelectedMode('survival');
            }}
            className={`flex-1 py-1.5 sm:py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 text-[11px] sm:text-xs font-mono transition cursor-pointer ${
              selectedMode === 'survival'
                ? 'bg-emerald-600 text-white font-bold shadow-lg border border-emerald-400'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Survival</span>
          </button>
          <button
            onClick={() => {
              sounds.playClickSound();
              setSelectedMode('creative');
            }}
            className={`flex-1 py-1.5 sm:py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 text-[11px] sm:text-xs font-mono transition cursor-pointer ${
              selectedMode === 'creative'
                ? 'bg-amber-600 text-white font-bold shadow-lg border border-amber-400'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Creative (Fly)</span>
          </button>
        </div>

        {/* Start Game Action Button */}
        <div className="w-full max-w-sm space-y-2">
          <button
            onClick={() => {
              sounds.playClickSound();
              onStartGame(selectedMode);
            }}
            className="w-full py-3 px-5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 active:scale-[0.98] text-white font-mono font-bold tracking-wider text-sm rounded-xl border-b-4 border-emerald-800 shadow-[0_8px_20px_rgba(16,185,129,0.35)] transition cursor-pointer flex items-center justify-center gap-2"
          >
            <Compass className="w-4 h-4 text-emerald-200" />
            <span>PLAY GAME</span>
          </button>
        </div>
      </div>

      {/* Bottom Flat Control Hint Line */}
      <div className="flex justify-center pointer-events-auto pb-1">
        <div className="bg-stone-950/85 border border-stone-800 px-3 py-1 rounded-xl text-stone-400 text-[10px] sm:text-xs font-mono tracking-wide text-center">
          {isMobile ? (
            <span>Landscape Thumb Controls: Left D-Pad Move · Right Buttons Mine/Place · Drag to Look</span>
          ) : (
            <span>WASD Move · L-Click Mine · R-Click Place · 1-9 Hotbar · E Sleep · C Skins · Esc Pause</span>
          )}
        </div>
      </div>
    </div>
  );
};
