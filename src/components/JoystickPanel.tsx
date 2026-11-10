/**
 * JoystickPanel - 360° Virtual Analog Joystick for Landscape Mobile HUD
 * Provides smooth, analog directional movement for the left thumb with
 * concentric ring feedback and dynamic thumb knob centering.
 */

import React, { useRef, useState, useCallback, useEffect } from 'react';

interface JoystickPanelProps {
  onMove: (vx: number, vz: number) => void;
  size?: number; // Base diameter in pixels
}

export const JoystickPanel: React.FC<JoystickPanelProps> = ({
  onMove,
  size = 120,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [knobPos, setKnobPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isActive, setIsActive] = useState<boolean>(false);
  const touchIdRef = useRef<number | null>(null);

  const radius = size / 2;
  const maxDistance = radius * 0.75; // Maximum displacement for the knob

  const updatePosition = useCallback(
    (clientX: number, clientY: number) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const deltaX = clientX - centerX;
      const deltaY = clientY - centerY;
      const distance = Math.hypot(deltaX, deltaY);

      if (distance === 0) {
        setKnobPos({ x: 0, y: 0 });
        onMove(0, 0);
        return;
      }

      // Clamp knob movement to maxDistance
      const clampedDist = Math.min(distance, maxDistance);
      const angle = Math.atan2(deltaY, deltaX);

      const knobX = Math.cos(angle) * clampedDist;
      const knobY = Math.sin(angle) * clampedDist;

      setKnobPos({ x: knobX, y: knobY });

      // Calculate normalized move vector (-1 to 1)
      // deltaX = horizontal strafe (+X is right, -X is left)
      // deltaY = vertical forward/backward (+Y is down/back, -Y is up/forward)
      const normDist = clampedDist / maxDistance;
      const vx = Math.cos(angle) * normDist;
      const vz = Math.sin(angle) * normDist;

      onMove(vx, vz);
    },
    [maxDistance, onMove]
  );

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    if (touchIdRef.current !== null) return;
    const touch = e.changedTouches[0];
    touchIdRef.current = touch.identifier;
    setIsActive(true);
    updatePosition(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === touchIdRef.current) {
        updatePosition(touch.clientX, touch.clientY);
        break;
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === touchIdRef.current) {
        touchIdRef.current = null;
        setIsActive(false);
        setKnobPos({ x: 0, y: 0 });
        onMove(0, 0);
        break;
      }
    }
  };

  // Reset if unmounted or touched out
  useEffect(() => {
    return () => {
      onMove(0, 0);
    };
  }, [onMove]);

  return (
    <div className="relative pointer-events-auto select-none touch-none flex items-center justify-center font-mono">
      {/* Outer Joystick Base Ring */}
      <div
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        style={{ width: `${size}px`, height: `${size}px` }}
        className={`relative rounded-full border-2 transition-colors duration-200 flex items-center justify-center shadow-2xl backdrop-blur-none cursor-pointer ${
          isActive
            ? 'bg-stone-900/80 border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.35)]'
            : 'bg-stone-950/70 border-stone-700/80'
        }`}
      >
        {/* Subtle Cardinal Direction Indicators */}
        <span className="absolute top-1.5 text-[9px] font-bold text-stone-500 pointer-events-none">▲</span>
        <span className="absolute bottom-1.5 text-[9px] font-bold text-stone-500 pointer-events-none">▼</span>
        <span className="absolute left-1.5 text-[9px] font-bold text-stone-500 pointer-events-none">◄</span>
        <span className="absolute right-1.5 text-[9px] font-bold text-stone-500 pointer-events-none">►</span>

        {/* Center Resting Dot */}
        <div className="w-2.5 h-2.5 rounded-full bg-stone-700/60 pointer-events-none"></div>

        {/* Movable Thumb Knob */}
        <div
          style={{
            transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
            transition: isActive ? 'none' : 'transform 0.15s cubic-bezier(0.18, 0.89, 0.32, 1.28)',
          }}
          className={`absolute w-12 h-12 rounded-full border-2 flex items-center justify-center pointer-events-none shadow-xl ${
            isActive
              ? 'bg-gradient-to-br from-amber-400 to-amber-600 border-amber-200 text-stone-950 scale-105'
              : 'bg-stone-800/95 border-stone-600 text-stone-300'
          }`}
        >
          {/* Knob Inner Grip Texture */}
          <div className="w-4 h-4 rounded-full border border-stone-900/30 bg-black/20 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-white/60"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
