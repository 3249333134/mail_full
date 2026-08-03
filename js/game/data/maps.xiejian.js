import { JINGYUAN_CHARACTER_IDS } from './characters.jingyuan.js';

const ROOT = 'xiejian/sanshi-pixel-assets/location-maps';
const MAP_META = [
  ['xj-jingyuan', '静远书院', 'jingyuan_academy', 'jingyuan-academy-map.png', 'main_hall', [0.50, 0.72]],
  ['xj-daohua', '道华观', 'daohua_temple', 'daohua-temple-map.png', 'main_hall', [0.50, 0.76]],
  ['xj-tianxing', '天行教', 'tianxing_cult', 'tianxing-cult-map.png', 'leader_hall', [0.50, 0.76]],
  ['xj-danxi', '丹溪谷', 'danxi_valley', 'danxi-valley-map.png', 'medicine_room', [0.52, 0.74]],
  ['xj-buhuan', '不还门', 'buhuan_sect', 'buhuan-sect-map.png', 'zhengqi_hall', [0.50, 0.76]],
  ['xj-taozhi', '桃止门', 'taozhi_sect', 'taozhi-sect-map.png', 'master_room', [0.50, 0.76]],
  ['xj-dongjia', '东嘉沈府', 'dongjia_shen_manor', 'dongjia-shen-manor-map.png', 'main_hall', [0.50, 0.77]],
  ['xj-ren', '任府', 'ren_manor', 'ren-manor-map.png', 'main_hall', [0.50, 0.77]],
  ['xj-capital', '京城翰林院', 'capital_hanlin', 'capital-hanlin-map.png', 'hanlin', [0.50, 0.77]],
  ['xj-forgetfulness', '忘川', 'forgetfulness_river', 'forgetfulness-river-map.png', 'choice_square', [0.50, 0.78]],
  ['xj-border', '边陲小镇', 'border_town', 'border-town-map.png', 'childhood_home', [0.50, 0.78]],
];

export const XIEJIAN_MAP_ORDER = MAP_META.map(row => row[0]);
export const XIEJIAN_MAP_DEFS = Object.fromEntries(MAP_META.map(([key, name, routeGraphId, bgFileName, spawnNodeId, ratios]) => [key, {
  key, name, category: 'xiejian', routeGraphId, spawnNodeId,
  bgPath: `${ROOT}/full-maps/${bgFileName}`,
  bgThumbnailPath: `${ROOT}/full-maps/${bgFileName}`,
  bgFileName, worldScale: 2,
  spawnPoint: { worldXRatio: ratios[0], worldYRatio: ratios[1] },
  allowedCharacterIds: [...JINGYUAN_CHARACTER_IDS],
  initialWorldItems: [], npcs: [], portals: [], ambientSfx: [],
}]));

export default XIEJIAN_MAP_DEFS;
