// 原生 6 张像素地图定义（本地兜底）
// Phase 0: 1:1 从现有 sendbox/src/assets/maps 目录映射

const BASIC_MAP_ROOT = 'assets/maps';

export const BASIC_MAP_ORDER = ['village', 'desert', 'forest', 'farm', 'mine', 'hanmen'];

export const BASIC_MAP_DEFS = {
  'village': {
    key: 'village',
    name: '村庄',
    category: 'basic',
    bgPath: `${BASIC_MAP_ROOT}/bg-village.png`,
    worldScale: 2,
    spawnPoint: { worldXRatio: 0.50, worldYRatio: 0.72 },
    allowedCharacterIds: ['*'],
    initialWorldItems: [],
    npcs: [],
    portals: [],
  },
  'desert': {
    key: 'desert',
    name: '沙漠',
    category: 'basic',
    bgPath: `${BASIC_MAP_ROOT}/bg-desert.png`,
    worldScale: 2,
    spawnPoint: { worldXRatio: 0.50, worldYRatio: 0.72 },
    allowedCharacterIds: ['*'],
    initialWorldItems: [],
    npcs: [],
    portals: [],
  },
  'forest': {
    key: 'forest',
    name: '森林',
    category: 'basic',
    bgPath: `${BASIC_MAP_ROOT}/bg-forest.png`,
    worldScale: 2,
    spawnPoint: { worldXRatio: 0.50, worldYRatio: 0.72 },
    allowedCharacterIds: ['*'],
    initialWorldItems: [],
    npcs: [],
    portals: [],
  },
  'farm': {
    key: 'farm',
    name: '农场',
    category: 'basic',
    bgPath: `${BASIC_MAP_ROOT}/bg-farm.png`,
    worldScale: 2,
    spawnPoint: { worldXRatio: 0.50, worldYRatio: 0.72 },
    allowedCharacterIds: ['*'],
    initialWorldItems: [],
    npcs: [],
    portals: [],
  },
  'mine': {
    key: 'mine',
    name: '矿洞',
    category: 'basic',
    bgPath: `${BASIC_MAP_ROOT}/bg-mine.png`,
    worldScale: 2,
    spawnPoint: { worldXRatio: 0.50, worldYRatio: 0.72 },
    allowedCharacterIds: ['*'],
    initialWorldItems: [],
    npcs: [],
    portals: [],
  },
  // 寒门像素背景（非挟剑寒门地图）
  'hanmen-bg': {
    key: 'hanmen-bg',
    name: '寒门',
    category: 'hanmen',
    bgPath: `${BASIC_MAP_ROOT}/hanmen-bg.png`,
    worldScale: 2,
    spawnPoint: { worldXRatio: 0.50, worldYRatio: 0.72 },
    allowedCharacterIds: ['xiu-jing', 'xuan-xuan'],
    initialWorldItems: [],
    npcs: [],
    portals: [],
  },
};

export default BASIC_MAP_DEFS;
