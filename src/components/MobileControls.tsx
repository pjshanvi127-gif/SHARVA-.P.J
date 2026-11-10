/**
 * MobileControls - Landscape Touch HUD with Analog JoystickPanel & Action Cluster
 * Features a 360° virtual analog joystick for left-thumb navigation,
 * drag-to-look camera panning, and right-thumb Mine / Place / Jump action cluster.
 */

import React, { useRef, useState } from 'react';
import { JoystickPanel } from './JoystickPanel';
import { sounds } from '../audio/soundEngine';
import { Pickaxe, Boxes, Sparkles, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Dices } from 'lucide-react';

interface MobileControlsProps {
  onMoveVector: (vx: number, vz: number) => void;
  onLookDelta: (dx: number, dy: number) => void;
  onMine: () => void;
  onPlace: () => void;
  onJump: () => void;
  onFlyToggle: () => void;
  isFlying: boolean;
  gameMode: string;
}

export const MobileControls: React.FC<MobileControlsProps> = ({
  onMoveVector,
  onLookDelta,
  onMine,
  onPlace,
  onJump,
  onFlyToggle,
  isFlying,
  gameMode,
}) => {
  // Toggle between Analog Joystick and Classic D-Pad (default to analog joystick)
  const [controlType, setControlType] = useState<'joystick' | 'dpad'>('joystick');

  const [activeDpad, setActiveDpad] = useState({
    up: false,
    down: false,
    left: false,
    right: false,
  });

  const lookTouchId = useRef<number | null>(null);
  const lastLookPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Handle D-pad changes
  const updateDpad = (dir: 'up' | 'down' | 'left' | 'right', active: boolean) => {
    setActiveDpad((prev) => {
      const next = { ...prev, [dir]: active };
      let vx = 0;
      let vz = 0;
      if (next.up) vz -= 1;
      if (next.down) vz += 1;
      if (next.left) vx -= 1;
      if (next.right) vx += 1;
      onMoveVector(vx, vz);
      return next;
    });
  };

  // Touch handlers for Look Zone
  const handleTouchStartLook = (e: React.TouchEvent) => {
    if (lookTouchId.current !== null) return;
    const touch = e.changedTouches[0];
    lookTouchId.current = touch.identifier;
    lastLookPos.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchMoveLook = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === lookTouchId.current) {
        const dx = touch.clientX - lastLookPos.current.x;
        const dy = touch.clientY - lastLookPos.current.y;
        lastLookPos.current = { x: touch.clientX, y: touch.clientY };
        onLookDelta(dx, dy);
        break;
      }
    }
  };

  const handleTouchEndLook = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === lookTouchId.current) {
        lookTouchId.current = null;
        break;
      }
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-15 select-none font-mono">
      {/* Upper-Right Look Surface (Landscape optimized) */}
      <div
        className="absolute right-0 top-14 bottom-28 w-1/2 pointer-events-auto touch-none"
        onTouchStart={handleTouchStartLook}
        onTouchMove={handleTouchMoveLook}
        onTouchEnd={handleTouchEndLook}
        onTouchCancel={handleTouchEndLook}
      >
        <div className="absolute right-3 top-2 text-[9px] text-stone-400/40 pointer-events-none tracking-wider">
          Drag to look ↻
        </div>
      </div>

      {/* Bottom Left: Landscape Joystick Panel */}
      <div className="absolute left-3 sm:left-6 bottom-3 sm:bottom-4 pointer-events-auto flex flex-col items-center gap-1.5">
        {controlType === 'joystick' ? (
          /* Analog 360° Joystick Panel */
          <JoystickPanel onMove={onMoveVector} size={118} />
        ) : (
          /* Classic 4-Way D-Pad */
          <div className="flex flex-col items-center gap-1">
            <button
              onTouchStart={(e) => {
                e.preventDefault();
                updateDpad('up', true);
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                updateDpad('up', false);
              }}
              className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 transition active:scale-95 shadow-lg ${
                activeDpad.up
                  ? 'bg-amber-500 border-amber-300 text-stone-950 scale-95'
                  : 'bg-stone-900/90 border-stone-700 text-stone-200'
              }`}
            >
              <ArrowUp className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1">
              <button
                onTouchStart={(e) => {
                  e.preventDefault();
                  updateDpad('left', true);
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  updateDpad('left', false);
                }}
                className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 transition active:scale-95 shadow-lg ${
                  activeDpad.left
                    ? 'bg-amber-500 border-amber-300 text-stone-950 scale-95'
                    : 'bg-stone-900/90 border-stone-700 text-stone-200'
                }`}
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="w-10 h-10 rounded-xl bg-stone-950/80 border border-stone-800 flex items-center justify-center text-[9px] text-stone-500">
                PAD
              </div>
              <button
                onTouchStart={(e) => {
                  e.preventDefault();
                  updateDpad('right', true);
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  updateDpad('right', false);
                }}
                className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 transition active:scale-95 shadow-lg ${
                  activeDpad.right
                    ? 'bg-amber-500 border-amber-300 text-stone-950 scale-95'
                    : 'bg-stone-900/90 border-stone-700 text-stone-200'
                }`}
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <button
              onTouchStart={(e) => {
                e.preventDefault();
                updateDpad('down', true);
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                updateDpad('down', false);
              }}
              className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 transition active:scale-95 shadow-lg ${
                activeDpad.down
                  ? 'bg-amber-500 border-amber-300 text-stone-950 scale-95'
                  : 'bg-stone-900/90 border-stone-700 text-stone-200'
              }`}
            >
              <ArrowDown className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Small Toggle between Joystick and D-Pad */}
        <button
          onClick={() => {
            sounds.playClickSound();
            setControlType((t) => (t === 'joystick' ? 'dpad' : 'joystick'));
          }}
          className="text-[9px] text-stone-400 hover:text-white bg-stone-950/80 border border-stone-800 px-2 py-0.5 rounded-md flex items-center gap-1 transition cursor-pointer"
        >
          <Dices className="w-3 h-3 text-amber-400" />
          <span>{controlType === 'joystick' ? 'Analog Stick' : 'D-Pad'}</span>
        </button>
      </div>

      {/* Bottom Right: Landscape Action Cluster for Right Thumb */}
      <div className="absolute right-3 sm:right-6 bottom-3 sm:bottom-4 pointer-events-auto flex items-end gap-2 sm:gap-2.5">
        {/* Jump Button */}
        <button
          onClick={() => {
            sounds.playClickSound();
            onJump();
          }}
          className="w-12 h-12 sm:w-13 sm:h-13 rounded-2xl bg-emerald-600 active:bg-emerald-500 border-2 border-emerald-400 text-white shadow-xl flex flex-col items-center justify-center transition active:scale-95 cursor-pointer"
          aria-label="Jump"
        >
          <ArrowUp className="w-5 h-5 text-emerald-100" />
          <span className="text-[9px] font-bold tracking-tight">JUMP</span>
        </button>

        {/* Fly Toggle if in creative or already flying */}
        {(gameMode === 'creative' || isFlying) && (
          <button
            onClick={() => {
              sounds.playClickSound();
              onFlyToggle();
            }}
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-purple-700 active:bg-purple-600 border-2 border-purple-400 text-white shadow-xl flex flex-col items-center justify-center text-[9px] transition active:scale-95 cursor-pointer"
            aria-label="Toggle Fly"
          >
            <Sparkles className="w-4 h-4 text-purple-200" />
            <span className="font-bold">{isFlying ? 'FLY' : 'WALK'}</span>
          </button>
        )}

        {/* Mine Block Button */}
        <button
          onClick={() => {
            onMine();
          }}
          className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-red-600 active:bg-red-500 border-2 border-red-400 text-white shadow-xl flex flex-col items-center justify-center transition active:scale-95 cursor-pointer"
          aria-label="Mine Block"
        >
          <Pickaxe className="w-5 h-5 text-red-100" />
          <span className="text-[10px] font-bold">MINE</span>
        </button>

        {/* Place Block Button */}
        <button
          onClick={() => {
            onPlace();
          }}
          className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-blue-600 active:bg-blue-500 border-2 border-blue-400 text-white shadow-xl flex flex-col items-center justify-center transition active:scale-95 cursor-pointer"
          aria-label="Place Block"
        >
          <Boxes className="w-5 h-5 text-blue-100" />
          <span className="text-[10px] font-bold">PLACE</span>
        </button>
      </div>
    </div>
  );
};
