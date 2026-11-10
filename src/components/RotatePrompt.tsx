/**
 * RotatePrompt - Mobile Landscape Orientation Helper
 * Prompts players to rotate their device into landscape for optimal FOV and controls,
 * with one-tap fullscreen landscape locking.
 */

import React from 'react';
import { Smartphone, RotateCw, Maximize2, X } from 'lucide-react';
import { sounds } from '../audio/soundEngine';

interface RotatePromptProps {
  isOpen: boolean;
  onEnterLandscape: () => void;
  onDismiss: () => void;
}

export const RotatePrompt: React.FC<RotatePromptProps> = ({
  isOpen,
  onEnterLandscape,
  onDismiss,
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-50 bg-stone-950/92 flex items-center justify-center p-6 select-none font-mono text-center">
      <div className="max-w-xs w-full bg-stone-900 border-2 border-amber-500/80 rounded-2xl p-6 shadow-2xl flex flex-col items-center space-y-4 relative">
        {/* Dismiss Button */}
        <button
          onClick={() => {
            sounds.playClickSound();
            onDismiss();
          }}
          className="absolute top-3 right-3 p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition cursor-pointer"
          title="Continue in portrait"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Animated Rotating Smartphone Graphic */}
        <div className="relative w-20 h-20 flex items-center justify-center my-1">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border-2 border-amber-400/40 flex items-center justify-center shadow-inner">
            <Smartphone className="w-9 h-9 text-amber-400 animate-spin" style={{ animationDuration: '4s' }} />
          </div>
          <div className="absolute -bottom-1 -right-1 bg-amber-500 text-stone-950 p-1 rounded-full shadow">
            <RotateCw className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="space-y-1">
          <h3 className="text-base font-bold text-amber-400 tracking-wide">
            ROTATE TO LANDSCAPE
          </h3>
          <p className="text-xs text-stone-300 leading-relaxed">
            VoxelCraft 3D is designed for wide landscape gaming with thumb controls and radar map.
          </p>
        </div>

        {/* Primary Action: Enter Landscape Fullscreen */}
        <div className="w-full space-y-2 pt-2">
          <button
            onClick={() => {
              sounds.playClickSound();
              onEnterLandscape();
            }}
            className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <Maximize2 className="w-4 h-4" />
            <span>FULLSCREEN LANDSCAPE</span>
          </button>

          <button
            onClick={() => {
              sounds.playClickSound();
              onDismiss();
            }}
            className="w-full py-2 text-stone-400 hover:text-stone-200 text-[11px] underline cursor-pointer"
          >
            Play in Portrait anyway
          </button>
        </div>
      </div>
    </div>
  );
};
