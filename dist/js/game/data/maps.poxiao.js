// 破晓世界：6张地图组成复合地图，每张地图有独立的场景与道具
const ROOT = 'poxiao/maps';

const MAP_META = [
  ['px-d-city', 'D市总览', '01-d-city-overview.png', [0.50, 0.72]],
  ['px-stella', 'STELLA画廊', '02-stella-gallery.png', [0.50, 0.70]],
  ['px-seafood', '海鲜市场-冷库-生石灰厂', '03-seafood-lime-compound.png', [0.50, 0.72]],
  ['px-police', '公安大学', '04-police-university.png', [0.50, 0.72]],
  ['px-village', '西南边陲小村', '05-southwest-village.png', [0.50, 0.74]],
  ['px-docks', '郊区厂房-码头', '06-industrial-docks-region.png', [0.50, 0.72]],
];

export const POXIAO_MAP_ORDER = MAP_META.map(row => row[0]);
export const POXIAO_MAP_DEFS = Object.fromEntries(MAP_META.map(([key, name, bgFileName, ratios]) => [key, {
  key, name, category: 'poxiao', routeGraphId: key,
  bgPath: `${ROOT}/${bgFileName}`,
  bgThumbnailPath: `${ROOT}/${bgFileName}`,
  bgFileName, worldScale: 2,
  spawnPoint: { worldXRatio: ratios[0], worldYRatio: ratios[1] },
  allowedCharacterIds: [], // 由 CharacterSystem 动态填充
  initialWorldItems: [], npcs: [], portals: [], ambientSfx: [],
}]));

export default POXIAO_MAP_DEFS;
