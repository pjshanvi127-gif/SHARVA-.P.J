/**
 * VoxelCraft 3D - Types & Data Models
 */

export enum BlockType {
  AIR = 0,
  GRASS = 1,
  DIRT = 2,
  STONE = 3,
  COBBLESTONE = 4,
  OAK_WOOD = 5,
  OAK_LEAVES = 6,
  PLANKS = 7,
  BRICK = 8,
  SAND = 9,
  GLASS = 10,
  GLOWSTONE = 11,
  BED = 12,
  BOOKSHELF = 13,
  TNT = 14,
  COAL_ORE = 15,
  GOLD_ORE = 16,
  DIAMOND_ORE = 17,
  WATER = 18,
}

export interface BlockDef {
  id: BlockType;
  name: string;
  icon: string;
  isTransparent?: boolean;
  isLightSource?: boolean;
  lightIntensity?: number;
  soundType: 'stone' | 'dirt' | 'wood' | 'grass' | 'sand' | 'glass' | 'cloth';
}

export interface CharacterSkin {
  id: string;
  name: string;
  shirtColor: number;
  sleeveColor: number;
  skinColor: number;
  pantsColor: number;
  description: string;
}

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  senderColor?: string;
  timestamp: number;
}

export type GameMode = 'survival' | 'creative';
export type GameState = 'title' | 'playing' | 'paused' | 'sleeping';

export interface GameStats {
  fps: number;
  x: number;
  y: number;
  z: number;
  targetBlock: string;
  timeString: string;
  isDay: boolean;
  health: number;
  maxHealth: number;
  hunger: number;
  activeSkin: CharacterSkin;
  selectedBlock: BlockType;
  selectedSlot: number;
  isFlying: boolean;
  gameMode: GameMode;
  yaw: number;
  pitch: number;
  bots: { name: string; x: number; z: number }[];
  monsters: { x: number; z: number }[];
  fishes: { x: number; z: number }[];
}
