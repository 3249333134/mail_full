// 寒门专属地图定义（本地兜底）
// Phase 0: 占位，Phase 3 细化

export const HANMEN_MAP_DEFS = {
  'hanmen': {
    key: 'hanmen',
    name: '寒门',
    category: 'hanmen',
    bgPath: 'assets/maps/hanmen-bg.png',
    worldScale: 2,
    spawnPoint: { worldXRatio: 0.50, worldYRatio: 0.70 },
    allowedCharacterIds: ['xiu-jing', 'xuan-xuan'],
    initialWorldItems: [],
    npcs: [],
    portals: [],
  },
};

export default HANMEN_MAP_DEFS;
