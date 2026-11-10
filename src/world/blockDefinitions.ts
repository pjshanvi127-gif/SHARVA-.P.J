/**
 * VoxelCraft 3D - Block Registry & Character Skins
 */

import { BlockType, BlockDef, CharacterSkin } from '../types/game';

export const BLOCK_REGISTRY: Record<BlockType, BlockDef> = {
  [BlockType.AIR]: {
    id: BlockType.AIR,
    name: 'Air',
    icon: '💨',
    soundType: 'dirt',
  },
  [BlockType.GRASS]: {
    id: BlockType.GRASS,
    name: 'Grass Block',
    icon: '🌿',
    soundType: 'grass',
  },
  [BlockType.DIRT]: {
    id: BlockType.DIRT,
    name: 'Dirt',
    icon: '🟤',
    soundType: 'dirt',
  },
  [BlockType.STONE]: {
    id: BlockType.STONE,
    name: 'Stone',
    icon: '🪨',
    soundType: 'stone',
  },
  [BlockType.COBBLESTONE]: {
    id: BlockType.COBBLESTONE,
    name: 'Cobblestone',
    icon: '🧱',
    soundType: 'stone',
  },
  [BlockType.OAK_WOOD]: {
    id: BlockType.OAK_WOOD,
    name: 'Oak Log',
    icon: '🪵',
    soundType: 'wood',
  },
  [BlockType.OAK_LEAVES]: {
    id: BlockType.OAK_LEAVES,
    name: 'Oak Leaves',
    icon: '🍃',
    isTransparent: true,
    soundType: 'grass',
  },
  [BlockType.PLANKS]: {
    id: BlockType.PLANKS,
    name: 'Oak Planks',
    icon: '📦',
    soundType: 'wood',
  },
  [BlockType.BRICK]: {
    id: BlockType.BRICK,
    name: 'Bricks',
    icon: '🧱',
    soundType: 'stone',
  },
  [BlockType.SAND]: {
    id: BlockType.SAND,
    name: 'Sand',
    icon: '🏖️',
    soundType: 'sand',
  },
  [BlockType.GLASS]: {
    id: BlockType.GLASS,
    name: 'Glass',
    icon: '🪟',
    isTransparent: true,
    soundType: 'glass',
  },
  [BlockType.GLOWSTONE]: {
    id: BlockType.GLOWSTONE,
    name: 'Glowstone',
    icon: '💡',
    isLightSource: true,
    lightIntensity: 1.2,
    soundType: 'glass',
  },
  [BlockType.BED]: {
    id: BlockType.BED,
    name: 'Bed',
    icon: '🛏️',
    soundType: 'cloth',
  },
  [BlockType.BOOKSHELF]: {
    id: BlockType.BOOKSHELF,
    name: 'Bookshelf',
    icon: '📚',
    soundType: 'wood',
  },
  [BlockType.TNT]: {
    id: BlockType.TNT,
    name: 'TNT Dynamite',
    icon: '🧨',
    soundType: 'grass',
  },
  [BlockType.COAL_ORE]: {
    id: BlockType.COAL_ORE,
    name: 'Coal Ore',
    icon: '🖤',
    soundType: 'stone',
  },
  [BlockType.GOLD_ORE]: {
    id: BlockType.GOLD_ORE,
    name: 'Gold Ore',
    icon: '🟡',
    soundType: 'stone',
  },
  [BlockType.DIAMOND_ORE]: {
    id: BlockType.DIAMOND_ORE,
    name: 'Diamond Ore',
    icon: '💎',
    soundType: 'stone',
  },
  [BlockType.WATER]: {
    id: BlockType.WATER,
    name: 'Water',
    icon: '💧',
    isTransparent: true,
    soundType: 'dirt',
  },
};

// Default 9 hotbar slots for convenient sandbox play
export const DEFAULT_HOTBAR_BLOCKS: BlockType[] = [
  BlockType.GRASS,
  BlockType.DIRT,
  BlockType.STONE,
  BlockType.PLANKS,
  BlockType.BRICK,
  BlockType.GLASS,
  BlockType.GLOWSTONE,
  BlockType.BED,
  BlockType.TNT,
];

// All available inventory blocks for creative palette selection
export const INVENTORY_BLOCKS: BlockType[] = [
  BlockType.GRASS,
  BlockType.DIRT,
  BlockType.STONE,
  BlockType.COBBLESTONE,
  BlockType.OAK_WOOD,
  BlockType.OAK_LEAVES,
  BlockType.PLANKS,
  BlockType.BRICK,
  BlockType.SAND,
  BlockType.GLASS,
  BlockType.GLOWSTONE,
  BlockType.BED,
  BlockType.BOOKSHELF,
  BlockType.TNT,
  BlockType.COAL_ORE,
  BlockType.GOLD_ORE,
  BlockType.DIAMOND_ORE,
  BlockType.WATER,
];

// Character skins with colors and description
export const CHARACTER_SKINS: CharacterSkin[] = [
  {
    id: 'steve',
    name: 'Steve Classic',
    shirtColor: 0x00bcd4,
    sleeveColor: 0x008ba3,
    skinColor: 0xffcc99,
    pantsColor: 0x1a237e,
    description: 'The iconic blue-shirted pioneer of the voxel realms.',
  },
  {
    id: 'alex',
    name: 'Alex Explorer',
    shirtColor: 0x4caf50,
    sleeveColor: 0x388e3c,
    skinColor: 0xffdbac,
    pantsColor: 0x5d4037,
    description: 'Agile wilderness explorer clad in green woodland tunic.',
  },
  {
    id: 'knight',
    name: 'Iron Paladin',
    shirtColor: 0x9e9e9e,
    sleeveColor: 0x616161,
    skinColor: 0xe0e0e0,
    pantsColor: 0x424242,
    description: 'Heavy armor forged in deep subterranean ore caverns.',
  },
  {
    id: 'cyber',
    name: 'Cyber Automaton',
    shirtColor: 0xff9800,
    sleeveColor: 0xe65100,
    skinColor: 0x212121,
    pantsColor: 0x37474f,
    description: 'Futuristic clockwork bot powered by redstone microcircuits.',
  },
  {
    id: 'mage',
    name: 'Arch Sorcerer',
    shirtColor: 0x673ab7,
    sleeveColor: 0x512da8,
    skinColor: 0xffd1a4,
    pantsColor: 0x311b92,
    description: 'Master of celestial daylight spells and mystical bookshelves.',
  },
  {
    id: 'punk',
    name: 'Neon Punk',
    shirtColor: 0xe91e63,
    sleeveColor: 0xc2185b,
    skinColor: 0x81d4fa,
    pantsColor: 0x111111,
    description: 'Electrified synthwave rebel with vibrant hair and neon jacket.',
  },
  {
    id: 'nether',
    name: 'Nether Wanderer',
    shirtColor: 0xb71c1c,
    sleeveColor: 0x7f0000,
    skinColor: 0x4e342e,
    pantsColor: 0x212121,
    description: 'Hardened survivor from molten subterranean fortresses.',
  },
  {
    id: 'ender',
    name: 'Ender Warden',
    shirtColor: 0x18ffff,
    sleeveColor: 0x00b0ff,
    skinColor: 0x121212,
    pantsColor: 0x000000,
    description: 'Mysterious shadowy figure with glowing cyan particle eyes.',
  },
];
