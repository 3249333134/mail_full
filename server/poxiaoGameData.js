// 破晓世界服务端数据：地图、道具、角色定义
const fs = require('fs');
const path = require('path');

const ASSET_ROOT = path.resolve(__dirname, '..', 'sendbox', 'src', 'assets', 'poxiao');
const ICON_ROOT_URL = 'sendbox/src/assets/poxiao/items/icons';

// 读取 manifest.json
const manifestPath = path.join(__dirname, '..', 'sendbox', 'fill', 'poxiao-world', 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

// 地图定义：mapKey → [name, bgFileName, nativeSize]
const MAPS = {
  'px-d-city': ['D市总览', '01-d-city-overview.png', [945, 1665]],
  'px-stella': ['STELLA画廊', '02-stella-gallery.png', [1085, 1450]],
  'px-seafood': ['海鲜市场-冷库-生石灰厂', '03-seafood-lime-compound.png', [1022, 1539]],
  'px-police': ['公安大学', '04-police-university.png', [1023, 1537]],
  'px-village': ['西南边陲小村', '05-southwest-village.png', [941, 1672]],
  'px-docks': ['郊区厂房-码头', '06-industrial-docks-region.png', [1024, 1536]],
};

// PNG 尺寸读取（×2 世界缩放）
function pngSize(file) {
  try {
    const buffer = fs.readFileSync(file);
    return {
      width: buffer.readUInt32BE(16) * 2,
      height: buffer.readUInt32BE(20) * 2
    };
  } catch (_) {
    return { width: 2048, height: 2048 };
  }
}

// 计算每张地图的世界尺寸
const mapDimensions = {};
for (const [mapKey, [name, filename, nativeSize]] of Object.entries(MAPS)) {
  const fullPath = path.join(ASSET_ROOT, 'maps', filename);
  mapDimensions[mapKey] = pngSize(fullPath);
  // 如果读取失败，用 nativeSize × 2
  if (mapDimensions[mapKey].width === 4096 && mapDimensions[mapKey].height === 4096) {
    mapDimensions[mapKey] = { width: nativeSize[0] * 2, height: nativeSize[1] * 2 };
  }
}

// 道具定义
const ITEM_DEFS = [
  { id: 'red_scarf', name: '红围巾', file: '01_red_scarf.png', category: 'bond', portable: true, description: '江宴亲手织，分手时还回' },
  { id: 'olive_sapling', name: '橄榄树苗', file: '02_olive_sapling.png', category: 'bond', portable: true, description: '李平川与江宴一起种下' },
  { id: 'casablanca_lilies', name: '六朵卡萨布兰卡', file: '03_casablanca_lilies.png', category: 'bond', portable: true, description: '花语永恒的美丽' },
  { id: 'white_star_stone', name: '白色星星石头', file: '04_white_star_stone.png', category: 'bond', portable: true, description: '贺引生送给李平川的信物' },
  { id: 'protection_talisman', name: '护身符', file: '05_protection_talisman.png', category: 'bond', portable: true, description: '周然送给贺引生' },
  { id: 'painter_apron', name: '围裙', file: '06_painter_apron.png', category: 'bond', portable: true, description: '写着贺引生微信号的定情信物' },
  { id: 'divorce_agreement', name: '离婚协议书', file: '07_divorce_agreement.png', category: 'bond', portable: true, description: '周然签字，贺引生兜里发现' },
  { id: 'divination_pendant', name: '观卦吊坠', file: '08_divination_pendant.png', category: 'accessory', portable: true, description: '周然的玄学信仰标志' },
  { id: 'super_s_necklace', name: '超人S项链', file: '09_super_s_necklace.png', category: 'accessory', portable: true, description: '小岳送给贺引生' },
  { id: 'half_jade_pendant', name: '半块玉佩', file: '10_half_jade_pendant.png', category: 'accessory', portable: true, description: '被赶出家门的小孩所赠' },
  { id: 'goldfish_bowl', name: '金鱼缸', file: '11_goldfish_bowl.png', category: 'story', portable: true, description: '任远送沈星何的金鱼' },
  { id: 'police_portrait', name: '周然的画作', file: '12_police_portrait.png', category: 'story', portable: true, description: '周然画任远与沈星何的画' },
  { id: 'rainflower_stone', name: '雨花石', file: '13_rainflower_stone.png', category: 'story', portable: true, description: '沈星何的念想' },
  { id: 'star_flower', name: '星花', file: '14_star_flower.png', category: 'story', portable: true, description: '毒品原料植物，只在黎明时盛开' },
  { id: 'qiming_vial', name: '启明', file: '15_qiming_vial.png', category: 'story', portable: true, description: '从星花提取的毒品' },
  { id: 'legless_bird_board', name: '无脚鸟图案木板', file: '16_legless_bird_board.png', category: 'story', portable: true, description: '警方卧底代号标志' },
  { id: 'crystal_pendant', name: '水晶吊坠', file: '17_crystal_pendant.png', category: 'accessory', portable: true, description: '贺引生小时候家中物品' },
  { id: 'pear_soup', name: '冰糖雪梨', file: '18_pear_soup.png', category: 'consumable', portable: true, description: '沈星何与李平川拜把子的酒' },
  { id: 'evidence_syringe', name: '针管证物', file: '19_evidence_syringe.png', category: 'story', portable: true, description: '唐岐委托周然进冰库找的证物' },
  { id: 'handcuffs', name: '手铐', file: '20_handcuffs.png', category: 'weapon', portable: true, description: '唐岐用来铐住周然的凶器' },
];

const SLOT_BY_ID = {
  handcuffs: 'weapon',
  evidence_syringe: 'weapon',
  divination_pendant: 'accessory',
  super_s_necklace: 'accessory',
  half_jade_pendant: 'accessory',
  crystal_pendant: 'accessory',
  painter_apron: 'clothing',
};

const itemDefinitions = Object.fromEntries(ITEM_DEFS.map(def => [def.id, {
  ...def,
  icon: `${ICON_ROOT_URL}/${def.file}`,
  equipmentSlot: SLOT_BY_ID[def.id] || null,
  attackBonus: def.category === 'weapon' ? 3 : 0,
  defenseBonus: def.category === 'clothing' ? 2 : 0,
  effect: def.category === 'consumable' ? { kind: 'heal', amount: 20 } : null,
  respawnMs: 30000,
}]));

// 角色定义
const CHARACTER_META = [
  ['px-tangqi', '唐岐', '缉毒警', '01-周然', 7],
  ['px-lipingchuan', '李平川', '奶茶店老板', '02-贺清风', 5],
  ['px-jiangyan', '江宴', '法医', '03-任朝野', 3],
  ['px-xinghe', '沈星何', '情报科', '04-沈池懿', 4],
  ['px-heyinsheng', '贺引生', '缉毒警', '05-戚凭川', 6],
  ['px-chenzhou', '陈昼', '卧底', '06-江淮安', 8],
  ['px-zhouran', '周然', '画家', '07-唐挽初', 5],
];

const martialByCharacter = Object.fromEntries(CHARACTER_META.map(([id, , , , m]) => [id, m]));

const starterItems = {
  'px-tangqi': ['handcuffs', 'evidence_syringe'],
  'px-lipingchuan': ['red_scarf', 'star_flower'],
  'px-jiangyan': ['olive_sapling', 'casablanca_lilies'],
  'px-xinghe': ['half_jade_pendant', 'goldfish_bowl'],
  'px-heyinsheng': ['super_s_necklace', 'protection_talisman', 'crystal_pendant'],
  'px-chenzhou': ['rainflower_stone', 'divination_pendant'],
  'px-zhouran': ['painter_apron', 'divorce_agreement', 'legless_bird_board'],
};

const standardActions = {
  personality: { label: '静息', frameDir: 'personality', frameCount: 4, frameInterval: 3000, loop: true },
  run: { label: '奔跑', frameDir: 'run', frameCount: 4, frameInterval: 105, loop: true },
  etiquette: { label: '礼仪', frameDir: 'etiquette', frameCount: 4, frameInterval: 220, loop: false },
  martial: { label: '武术', frameDir: 'martial', frameCount: 4, frameInterval: 110, loop: false },
  signature: { label: '招牌', frameDir: 'signature', frameCount: 4, frameInterval: 180, loop: false },
};

const FRAME_ROOT = '../../fill/jingyuan-chibi20-delivery-20260719';
const characterDefinitions = Object.fromEntries(CHARACTER_META.map(([id, name, sect, dir, martial]) => [id, {
  id, name, sect, dir, category: 'poxiao', martial,
  frameRoot: `${FRAME_ROOT}/${dir}/frames`,
  portraitPath: `${FRAME_ROOT}/${dir}/frames/personality/00.png`,
  collision: { width: 42, height: 34, offsetY: 34 },
  render: { width: 112, height: 112, nameplateOffsetY: 62 },
  baseStats: { maxHp: 100, martial, attack: 6 + martial * 2, defense: 4, speed: 1 },
  defaultItems: starterItems[id] || [],
  equipmentSlots: ['weapon', 'clothing', 'accessory'],
  actions: standardActions,
}]));

// 道具放置：[mapKey, nodeId, defId, nx, ny] — 使用归一化坐标（0~1）
const placements = [
  // D市总览
  ['px-d-city', 'stella_area', 'police_portrait', 0.30, 0.25],
  ['px-d-city', 'police_area', 'handcuffs', 0.70, 0.30],
  ['px-d-city', 'bridge_area', 'red_scarf', 0.50, 0.50],
  // STELLA画廊
  ['px-stella', 'main_hall', 'painter_apron', 0.40, 0.35],
  ['px-stella', 'tea_area', 'pear_soup', 0.60, 0.45],
  ['px-stella', 'office', 'divorce_agreement', 0.30, 0.65],
  ['px-stella', 'secret_compartment', 'legless_bird_board', 0.70, 0.70],
  // 海鲜市场-冷库-生石灰厂
  ['px-seafood', 'cold_storage', 'evidence_syringe', 0.35, 0.40],
  ['px-seafood', 'lime_factory', 'qiming_vial', 0.65, 0.55],
  ['px-seafood', 'pool', 'handcuffs', 0.50, 0.75],
  // 公安大学
  ['px-police', 'plaza', 'super_s_necklace', 0.45, 0.30],
  ['px-police', 'library', 'half_jade_pendant', 0.60, 0.50],
  ['px-police', 'dorm', 'goldfish_bowl', 0.35, 0.65],
  // 西南边陲小村
  ['px-village', 'house', 'white_star_stone', 0.40, 0.35],
  ['px-village', 'field', 'star_flower', 0.60, 0.50],
  ['px-village', 'escape_path', 'olive_sapling', 0.30, 0.70],
  // 郊区厂房-码头
  ['px-docks', 'factory', 'crystal_pendant', 0.35, 0.40],
  ['px-docks', 'dock', 'casablanca_lilies', 0.65, 0.55],
  ['px-docks', 'warehouse', 'protection_talisman', 0.50, 0.70],
  ['px-docks', 'pier', 'rainflower_stone', 0.45, 0.80],
];

// 简化版 nodePosition：直接用 placements 中的 nx/ny
const nodePositionMap = {};
placements.forEach(([mapKey, nodeId, defId, nx, ny]) => {
  if (!nodePositionMap[mapKey]) nodePositionMap[mapKey] = {};
  nodePositionMap[mapKey][nodeId] = { nx, ny };
});

function nodePosition(mapKey, nodeId, offsetIndex = 0) {
  const nodes = nodePositionMap[mapKey] || {};
  const node = nodes[nodeId] || { nx: 0.5, ny: 0.5 };
  const angle = offsetIndex * 2.39996;
  const radius = offsetIndex ? Math.min(0.025, 0.008 + offsetIndex * 0.003) : 0;
  return {
    nx: Math.max(0.02, Math.min(0.98, node.nx + Math.cos(angle) * radius)),
    ny: Math.max(0.02, Math.min(0.98, node.ny + Math.sin(angle) * radius))
  };
}

function worldPosition(mapKey, nx, ny) {
  const dimensions = mapDimensions[mapKey] || { width: 2048, height: 2048 };
  return { x: nx * dimensions.width, y: ny * dimensions.height };
}

function nearestRoutePosition(mapKey, x, y) {
  const dimensions = mapDimensions[mapKey] || { width: 2048, height: 2048 };
  const nx = x / dimensions.width;
  const ny = y / dimensions.height;
  const nodes = nodePositionMap[mapKey] || {};
  let nearest = { nx: 0.5, ny: 0.5 };
  let minDist = Infinity;
  for (const node of Object.values(nodes)) {
    const dist = Math.hypot(node.nx - nx, node.ny - ny);
    if (dist < minDist) { minDist = dist; nearest = node; }
  }
  return nearest;
}

const MAP_NAMES = Object.fromEntries(Object.entries(MAPS).map(([key, [name]]) => [key, name]));

const mapDefinitions = Object.fromEntries(Object.entries(MAPS).map(([key, [name, filename]]) => [key, {
  key, name, category: 'poxiao', routeGraphId: key, bgFileName: filename,
  bgPath: `poxiao/maps/${filename}`,
  bgThumbnailPath: `poxiao/maps/${filename}`,
  worldScale: 2, worldSize: mapDimensions[key],
  allowedCharacterIds: Object.keys(characterDefinitions),
  initialWorldItems: placements.filter(row => row[0] === key).map(row => ({
    nodeId: row[1], defId: row[2], nx: row[3], ny: row[4], count: 1
  }))
}]));

module.exports = {
  characterDefinitions,
  mapDefinitions,
  itemDefinitions,
  starterItems,
  martialByCharacter,
  placements,
  mapDimensions,
  nodePosition,
  worldPosition,
  nearestRoutePosition,
};
