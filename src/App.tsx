/**
 * VoxelCraft 3D - Full WebGL Sandbox Main App
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { GameEngine } from './engine/GameEngine';
import { TitleScreen } from './components/TitleScreen';
import { GameHUD } from './components/GameHUD';
import { SkinModal } from './components/SkinModal';
import { ChatBox } from './components/ChatBox';
import { PauseMenu } from './components/PauseMenu';
import { MobileControls } from './components/MobileControls';
import { RotatePrompt } from './components/RotatePrompt';
import { sounds } from './audio/soundEngine';
import {
  GameMode,
  GameState,
  GameStats,
  ChatMessage,
  CharacterSkin,
  BlockType,
} from './types/game';
import { CHARACTER_SKINS, DEFAULT_HOTBAR_BLOCKS } from './world/blockDefinitions';

export default function App() {
  const mountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const [gameState, setGameState] = useState<GameState>('title');
  const [isSkinModalOpen, setIsSkinModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [activeSkin, setActiveSkin] = useState<CharacterSkin>(CHARACTER_SKINS[0]);
  const [hotbar, setHotbar] = useState<BlockType[]>([...DEFAULT_HOTBAR_BLOCKS]);
  const [selectedSlot, setSelectedSlot] = useState(0);

  // Mobile detection & touch controls visibility
  const isTouchDevice =
    typeof window !== 'undefined' &&
    ('ontouchstart' in window || navigator.maxTouchPoints > 0 || window.innerWidth <= 840);
  const [showMobileControls, setShowMobileControls] = useState<boolean>(isTouchDevice);

  // Orientation & Fullscreen state
  const [showRotatePrompt, setShowRotatePrompt] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Check orientation on mount & resize
  useEffect(() => {
    const checkOrientation = () => {
      const portrait = window.innerHeight > window.innerWidth;
      if (portrait && isTouchDevice) {
        setShowRotatePrompt(true);
      }
      setIsFullscreen(!!document.fullscreenElement);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);
    document.addEventListener('fullscreenchange', () => {
      setIsFullscreen(!!document.fullscreenElement);
    });

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, [isTouchDevice]);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      sender: 'System',
      text: 'Welcome to VoxelCraft 3D! Use the new 360° virtual joystick in the bottom-left corner.',
      senderColor: '#facc15',
      timestamp: Date.now(),
    },
    {
      id: 'init-2',
      sender: 'Alex_Explorer',
      text: 'Playing in landscape gives you the optimal thumb reach and widest field-of-view!',
      senderColor: '#34d399',
      timestamp: Date.now() + 500,
    },
  ]);

  const [stats, setStats] = useState<GameStats>({
    fps: 60,
    x: 20,
    y: 12,
    z: 20,
    targetBlock: 'None',
    timeString: '06:00 AM',
    isDay: true,
    health: 10,
    maxHealth: 10,
    hunger: 10,
    activeSkin: CHARACTER_SKINS[0],
    selectedBlock: DEFAULT_HOTBAR_BLOCKS[0],
    selectedSlot: 0,
    isFlying: false,
    gameMode: 'survival',
    yaw: 0,
    pitch: 0,
    bots: [],
    monsters: [],
    fishes: [],
  });

  // Initialize GameEngine
  useEffect(() => {
    if (!mountRef.current) return;

    const engine = new GameEngine(mountRef.current);
    engineRef.current = engine;

    engine.onStatsUpdate = (newStats) => {
      setStats(newStats);
      setSelectedSlot(newStats.selectedSlot);
    };

    engine.onChatMessage = (msg) => {
      setChatMessages((prev) => [...prev.slice(-40), msg]);
    };

    engine.onStateChange = (newState) => {
      setGameState(newState);
    };

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  // Listen for Enter / 'C' key when playing
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if (gameState === 'playing') {
        if (e.code === 'KeyC') {
          if (document.pointerLockElement) document.exitPointerLock();
          setIsSkinModalOpen(true);
        } else if (e.code === 'Enter') {
          if (document.pointerLockElement) document.exitPointerLock();
          setIsChatOpen((prev) => !prev);
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, [gameState]);

  // Start Game handler
  const handleStartGame = useCallback((mode: GameMode) => {
    if (!engineRef.current) return;
    engineRef.current.setGameMode(mode);
    engineRef.current.setGameState('playing');
    setGameState('playing');
  }, []);

  // Hotbar select
  const handleSelectSlot = useCallback((idx: number) => {
    if (!engineRef.current) return;
    engineRef.current.selectHotbarSlot(idx);
    setSelectedSlot(idx);
  }, []);

  // Skin Select
  const handleSelectSkin = useCallback((skin: CharacterSkin) => {
    setActiveSkin(skin);
    if (engineRef.current) {
      engineRef.current.setCharacterSkin(skin);
    }
  }, []);

  // Mute toggle
  const handleToggleMute = useCallback(() => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    sounds.setMuted(nextMuted);
  }, [isMuted]);

  // Volume change
  const handleVolumeChange = useCallback((vol: number) => {
    setVolume(vol);
    sounds.setVolume(vol);
  }, []);

  // Toggle Pause
  const handleTogglePause = useCallback(() => {
    if (!engineRef.current) return;
    if (gameState === 'playing') {
      engineRef.current.setGameState('paused');
      setGameState('paused');
    } else if (gameState === 'paused') {
      engineRef.current.setGameState('playing');
      setGameState('playing');
    }
  }, [gameState]);

  // Toggle Game Mode
  const handleToggleGameMode = useCallback(() => {
    if (!engineRef.current) return;
    const nextMode: GameMode = stats.gameMode === 'survival' ? 'creative' : 'survival';
    engineRef.current.setGameMode(nextMode);
  }, [stats.gameMode]);

  // Fullscreen Landscape helper
  const handleEnterLandscapeFullscreen = useCallback(async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
      if (screen.orientation && 'lock' in screen.orientation) {
        await (screen.orientation as unknown as { lock: (orient: string) => Promise<void> })
          .lock('landscape')
          .catch(() => {});
      }
      setShowRotatePrompt(false);
    } catch {
      setShowRotatePrompt(false);
    }
  }, []);

  // Fullscreen toggle helper
  const handleToggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        }
        if (screen.orientation && 'lock' in screen.orientation) {
          await (screen.orientation as unknown as { lock: (orient: string) => Promise<void> })
            .lock('landscape')
            .catch(() => {});
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      }
    } catch {
      // Ignored
    }
  }, []);

  // Spawn Cottage Blueprint
  const handleSpawnHouse = useCallback(() => {
    if (!engineRef.current) return;
    const px = Math.floor(engineRef.current.player.position.x) - 2;
    const py = Math.floor(engineRef.current.player.position.y);
    const pz = Math.floor(engineRef.current.player.position.z) - 2;
    engineRef.current.world.spawnCottage(px, py, pz);
    engineRef.current.world.rebuildAllMeshes();

    setChatMessages((prev) => [
      ...prev,
      {
        id: Math.random().toString(),
        sender: 'System',
        text: `Constructed a cozy wooden cottage at (${px}, ${py}, ${pz})!`,
        senderColor: '#f59e0b',
        timestamp: Date.now(),
      },
    ]);
  }, []);

  // Handle Chat & Commands
  const handleSendMessage = useCallback(
    (text: string) => {
      if (!engineRef.current) return;

      if (text.startsWith('/')) {
        const parts = text.slice(1).trim().split(/\s+/);
        const cmd = parts[0].toLowerCase();

        if (cmd === 'help') {
          setChatMessages((prev) => [
            ...prev,
            {
              id: Math.random().toString(),
              sender: 'Console',
              text: 'Available Commands: /time set day | /time set night | /spawn house | /fly | /gamemode [survival|creative] | /tnt | /clear',
              senderColor: '#38bdf8',
              timestamp: Date.now(),
            },
          ]);
        } else if (cmd === 'time') {
          if (parts[1] === 'set') {
            if (parts[2] === 'day') {
              engineRef.current.dayTimeRatio = 0.25;
              setChatMessages((prev) => [
                ...prev,
                {
                  id: Math.random().toString(),
                  sender: 'Console',
                  text: 'Set time to Sunrise (06:00 AM)',
                  senderColor: '#facc15',
                  timestamp: Date.now(),
                },
              ]);
            } else if (parts[2] === 'night') {
              engineRef.current.dayTimeRatio = 0.75;
              setChatMessages((prev) => [
                ...prev,
                {
                  id: Math.random().toString(),
                  sender: 'Console',
                  text: 'Set time to Sunset (06:00 PM)',
                  senderColor: '#818cf8',
                  timestamp: Date.now(),
                },
              ]);
            }
          }
        } else if (cmd === 'spawn' && parts[1] === 'house') {
          handleSpawnHouse();
        } else if (cmd === 'fly') {
          engineRef.current.player.isFlying = !engineRef.current.player.isFlying;
          setChatMessages((prev) => [
            ...prev,
            {
              id: Math.random().toString(),
              sender: 'Console',
              text: `Flight mode is now ${engineRef.current?.player.isFlying ? 'ENABLED' : 'DISABLED'}`,
              senderColor: '#c084fc',
              timestamp: Date.now(),
            },
          ]);
        } else if (cmd === 'gamemode') {
          const m = parts[1]?.toLowerCase();
          if (m === 'creative' || m === 'survival') {
            engineRef.current.setGameMode(m as GameMode);
            setChatMessages((prev) => [
              ...prev,
              {
                id: Math.random().toString(),
                sender: 'Console',
                text: `Game mode switched to ${m.toUpperCase()}`,
                senderColor: '#34d399',
                timestamp: Date.now(),
              },
            ]);
          }
        } else if (cmd === 'tnt') {
          const px = Math.floor(engineRef.current.player.position.x);
          const py = Math.floor(engineRef.current.player.position.y);
          const pz = Math.floor(engineRef.current.player.position.z) - 2;
          engineRef.current.world.setBlock(px, py, pz, BlockType.TNT);
          setChatMessages((prev) => [
            ...prev,
            {
              id: Math.random().toString(),
              sender: 'Console',
              text: `Spawned live TNT at (${px}, ${py}, ${pz})! Right-click or tap to detonate.`,
              senderColor: '#ef4444',
              timestamp: Date.now(),
            },
          ]);
        } else if (cmd === 'clear') {
          setChatMessages([]);
        } else {
          setChatMessages((prev) => [
            ...prev,
            {
              id: Math.random().toString(),
              sender: 'Console',
              text: `Unknown command: /${cmd}. Type /help for list of commands.`,
              senderColor: '#f87171',
              timestamp: Date.now(),
            },
          ]);
        }
      } else {
        setChatMessages((prev) => [
          ...prev,
          {
            id: Math.random().toString(),
            sender: 'You',
            text,
            senderColor: '#38bdf8',
            timestamp: Date.now(),
          },
        ]);
      }
    },
    [handleSpawnHouse]
  );

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black select-none">
      {/* 3D WebGL Canvas Container */}
      <div ref={mountRef} className="absolute inset-0 z-0 cursor-crosshair" />

      {/* Title Screen Overlay */}
      {gameState === 'title' && (
        <TitleScreen
          onStartGame={handleStartGame}
          onOpenSkins={() => setIsSkinModalOpen(true)}
          activeSkin={activeSkin}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onEnterLandscapeFullscreen={handleEnterLandscapeFullscreen}
          isMobile={isTouchDevice}
        />
      )}

      {/* Active Game HUD (Playing or Paused) */}
      {gameState !== 'title' && (
        <GameHUD
          stats={stats}
          hotbar={hotbar}
          selectedSlot={selectedSlot}
          world={engineRef.current?.world || null}
          onSelectSlot={handleSelectSlot}
          onOpenSkins={() => {
            if (document.pointerLockElement) document.exitPointerLock();
            setIsSkinModalOpen(true);
          }}
          onTogglePause={handleTogglePause}
          onSpawnHouse={handleSpawnHouse}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onToggleChat={() => {
            if (document.pointerLockElement) document.exitPointerLock();
            setIsChatOpen((prev) => !prev);
          }}
          isChatOpen={isChatOpen}
          isMobile={isTouchDevice}
          showMobileControls={showMobileControls}
          onToggleMobileControls={() => setShowMobileControls((prev) => !prev)}
          isFullscreen={isFullscreen}
          onToggleFullscreen={handleToggleFullscreen}
        />
      )}

      {/* Mobile Touch Controls Overlay with Analog Joystick Panel */}
      {gameState === 'playing' && showMobileControls && (
        <MobileControls
          onMoveVector={(vx, vz) => engineRef.current?.setTouchMove(vx, vz)}
          onLookDelta={(dx, dy) => engineRef.current?.applyTouchLook(dx, dy)}
          onMine={() => engineRef.current?.triggerMine()}
          onPlace={() => engineRef.current?.triggerPlace()}
          onJump={() => engineRef.current?.triggerJump()}
          onFlyToggle={() => {
            if (engineRef.current) {
              engineRef.current.player.isFlying = !engineRef.current.player.isFlying;
            }
          }}
          isFlying={stats.isFlying}
          gameMode={stats.gameMode}
        />
      )}

      {/* Landscape Rotation Suggestion Prompt */}
      {showRotatePrompt && isTouchDevice && (
        <RotatePrompt
          isOpen={showRotatePrompt}
          onEnterLandscape={handleEnterLandscapeFullscreen}
          onDismiss={() => setShowRotatePrompt(false)}
        />
      )}

      {/* Live Chat Log & Input */}
      {gameState !== 'title' && (
        <ChatBox
          isOpen={isChatOpen}
          messages={chatMessages}
          onSendMessage={handleSendMessage}
          onClose={() => {
            setIsChatOpen(false);
            if (gameState === 'playing') {
              engineRef.current?.requestPointerLock();
            }
          }}
        />
      )}

      {/* Pause Menu Modal */}
      <PauseMenu
        isOpen={gameState === 'paused' && !isSkinModalOpen}
        onResume={() => {
          if (engineRef.current) {
            engineRef.current.setGameState('playing');
          }
          setGameState('playing');
        }}
        onOpenSkins={() => setIsSkinModalOpen(true)}
        onSpawnHouse={handleSpawnHouse}
        onExitToTitle={() => {
          if (engineRef.current) {
            engineRef.current.setGameState('title');
          }
          setGameState('title');
        }}
        gameMode={stats.gameMode}
        onToggleGameMode={handleToggleGameMode}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        volume={volume}
        onVolumeChange={handleVolumeChange}
      />

      {/* Skin Customizer Wardrobe Modal */}
      <SkinModal
        isOpen={isSkinModalOpen}
        activeSkin={activeSkin}
        onSelectSkin={handleSelectSkin}
        onClose={() => {
          setIsSkinModalOpen(false);
          if (gameState === 'playing') {
            engineRef.current?.requestPointerLock();
          }
        }}
      />

      {/* Sleep Night Scene Transition Overlay */}
      <div
        className={`absolute inset-0 bg-black z-50 flex items-center justify-center transition-opacity duration-1000 pointer-events-none ${
          gameState === 'sleeping' ? 'opacity-95' : 'opacity-0'
        }`}
      >
        <div className="text-center font-mono space-y-3">
          <div className="text-4xl text-amber-300 font-bold tracking-widest animate-pulse">
            Z z z . . .
          </div>
          <p className="text-sm text-stone-300">
            Sleeping peacefully through the night until sunrise...
          </p>
          <p className="text-xs text-emerald-400">Restoring full health and energy</p>
        </div>
      </div>
    </div>
  );
}
