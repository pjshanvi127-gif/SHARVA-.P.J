/**
 * SkinModal - Character Skin & Avatar Customizer
 */

import React from 'react';
import { CharacterSkin } from '../types/game';
import { CHARACTER_SKINS } from '../world/blockDefinitions';
import { sounds } from '../audio/soundEngine';
import { X, Check } from 'lucide-react';

interface SkinModalProps {
  isOpen: boolean;
  activeSkin: CharacterSkin;
  onSelectSkin: (skin: CharacterSkin) => void;
  onClose: () => void;
}

export const SkinModal: React.FC<SkinModalProps> = ({
  isOpen,
  activeSkin,
  onSelectSkin,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-40 bg-stone-950/80 flex items-center justify-center p-4 select-none">
      <div className="bg-stone-900 border-2 border-stone-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 font-mono">
        {/* Modal Header */}
        <div className="flex justify-between items-center border-b border-stone-800 pb-4">
          <div>
            <h2 className="text-xl font-bold text-amber-400">CHARACTER SKIN WARDROBE</h2>
            <p className="text-xs text-stone-400">
              Customize your first-person sleeves, arms, and multiplayer avatar appearance.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Skins Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 max-h-[60vh] overflow-y-auto pr-1">
          {CHARACTER_SKINS.map((skin) => {
            const isSelected = skin.id === activeSkin.id;
            const shirtHex = `#${skin.shirtColor.toString(16).padStart(6, '0')}`;
            const skinHex = `#${skin.skinColor.toString(16).padStart(6, '0')}`;
            const pantsHex = `#${skin.pantsColor.toString(16).padStart(6, '0')}`;

            return (
              <div
                key={skin.id}
                onClick={() => {
                  sounds.playClickSound();
                  onSelectSkin(skin);
                }}
                className={`p-3.5 rounded-xl border-2 flex flex-col items-center text-center cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-stone-800 border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.3)] scale-[1.02]'
                    : 'bg-stone-950/60 border-stone-800 hover:border-stone-600 hover:bg-stone-800/50'
                }`}
              >
                {/* 2D Voxel Character Silhouette Preview */}
                <div className="w-16 h-20 mb-3 relative flex flex-col items-center justify-center">
                  {/* Head */}
                  <div
                    className="w-7 h-7 rounded-sm border border-black/40 shadow-sm relative"
                    style={{ backgroundColor: skinHex }}
                  >
                    {/* Hair */}
                    <div className="absolute top-0 left-0 right-0 h-2 bg-stone-900/40 rounded-t-sm"></div>
                    {/* Eyes */}
                    <div className="absolute top-3 left-1 w-1.5 h-1 bg-white"></div>
                    <div className="absolute top-3 right-1 w-1.5 h-1 bg-white"></div>
                  </div>
                  {/* Torso & Arms */}
                  <div className="flex items-center gap-0.5 mt-0.5">
                    <div className="w-2 h-6 rounded-xs" style={{ backgroundColor: shirtHex }}></div>
                    <div className="w-6 h-6 rounded-xs" style={{ backgroundColor: shirtHex }}></div>
                    <div className="w-2 h-6 rounded-xs" style={{ backgroundColor: shirtHex }}></div>
                  </div>
                  {/* Legs */}
                  <div className="flex items-center gap-0.5 mt-0.5">
                    <div className="w-2.5 h-6 rounded-xs" style={{ backgroundColor: pantsHex }}></div>
                    <div className="w-2.5 h-6 rounded-xs" style={{ backgroundColor: pantsHex }}></div>
                  </div>
                </div>

                <div className="font-bold text-xs text-stone-100 flex items-center gap-1">
                  <span>{skin.name}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-amber-400" />}
                </div>

                <p className="text-[10px] text-stone-400 mt-1 line-clamp-2 leading-tight">
                  {skin.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="pt-2 border-t border-stone-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-xl transition cursor-pointer"
          >
            CONFIRM & RETURN TO GAME
          </button>
        </div>
      </div>
    </div>
  );
};
