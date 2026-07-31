const fs = require('fs');
const path = require('path');

const ASSET_ROOT = path.resolve(
  __dirname,
  '..',
  'sendbox',
  'src',
  'assets',
  'xiejian',
  'sanshi-pixel-assets'
);
const ICON_ROOT_URL = 'sendbox/src/assets/xiejian/sanshi-pixel-assets/items/icons';
const manifest = JSON.parse(
  fs.readFileSync(path.join(ASSET_ROOT, 'items', 'icons', 'manifest.json'), 'utf8')
).actions;
const routeGraph = JSON.parse(
  fs.readFileSync(path.join(ASSET_ROOT, 'location-maps', 'route-graph.json'), 'utf8')
).maps;

const MAPS = {
  'xj-jingyuan': ['jingyuan_academy', 'jingyuan-academy-map.png'],
  'xj-daohua': ['daohua_temple', 'daohua-temple-map.png'],
  'xj-tianxing': ['tianxing_cult', 'tianxing-cult-map.png'],
  'xj-danxi': ['danxi_valley', 'danxi-valley-map.png'],
  'xj-buhuan': ['buhuan_sect', 'buhuan-sect-map.png'],
  'xj-taozhi': ['taozhi_sect', 'taozhi-sect-map.png'],
  'xj-dongjia': ['dongjia_shen_manor', 'dongjia-shen-manor-map.png'],
  'xj-ren': ['ren_manor', 'ren-manor-map.png'],
  'xj-capital': ['capital_hanlin', 'capital-hanlin-map.png'],
  'xj-forgetfulness': ['forgetfulness_river', 'forgetfulness-river-map.png'],
  'xj-border': ['border_town', 'border-town-map.png']
};

function pngSize(file) {
  const buffer = fs.readFileSync(file);
  return {
    width: buffer.readUInt32BE(16) * 2,
    height: buffer.readUInt32BE(20) * 2
  };
}

const mapDimensions = {};
const routeNodes = {};
for (const [mapKey, [routeId, filename]] of Object.entries(MAPS)) {
  const graph = routeGraph.find(item => item.id === routeId);
  routeNodes[mapKey] = Object.fromEntries((graph?.nodes || []).map(node => [node.id, node]));
  mapDimensions[mapKey] = pngSize(
    path.join(ASSET_ROOT, 'location-maps', 'full-maps', filename)
  );
}

const SLOT_BY_ID = {
  zhou_ran_dragon_sword: 'weapon',
  bone_fan: 'weapon',
  zunqian_sword: 'weapon',
  tang_wanchu_sword: 'weapon',
  peachwood_sword: 'weapon',
  scholar_defensive_sword: 'weapon',
  silver_needle_case: 'weapon',
  jade_bee_needles: 'weapon',
  twin_short_knives: 'weapon',
  taoist_whisk: 'weapon',
  white_feather_fan: 'weapon',
  peach_folding_fan: 'weapon',
  curved_saber: 'weapon',
  general_armor: 'clothing',
  bridal_robe: 'clothing',
  academy_outer_robe: 'clothing',
  taoist_robe: 'clothing',
  tianxing_black_robe: 'clothing',
  scholar_robe: 'clothing',
  medical_valley_dress: 'clothing',
  righteous_sect_robe: 'clothing',
  hanlin_official_robe: 'clothing',
  jade_hairpin: 'accessory',
  jade_pendant: 'accessory',
  white_jade_bracelet: 'accessory',
  life_saving_gold_plaque: 'accessory'
};
const SIGNATURE_WEAPONS = new Set([
  'zhou_ran_dragon_sword',
  'bone_fan',
  'zunqian_sword',
  'tang_wanchu_sword',
  'silver_needle_case',
  'jade_bee_needles'
]);
const FIXED_IDS = new Set([
  'training_sword_target',
  'alchemy_furnace',
  'incense_burner',
  'crane_incense_burner',
  'white_crane',
  'carrier_pigeon',
  'meng_po_soup',
  'reincarnation_light'
]);
const CONSUMABLES = {
  rare_herbs: { kind: 'heal', amount: 15 },
  medicine_gourd_pills: { kind: 'heal', amount: 30 },
  rock_sugar_snow_pear: { kind: 'heal', amount: 10 },
  antidote: { kind: 'antidote' },
  plum_fall_poison: { kind: 'coat', status: 'poison' },
  poison_powder: { kind: 'coat', status: 'poison' },
  sleeping_drug: { kind: 'coat', status: 'sleep' }
};

const categoryNames = {
  bond: '信物',
  weapons: '装备',
  medicine: '药品',
  clothing: '装备',
  story: '故事物品'
};
const descriptions = {
  crescent_jade_charm: '一枚弯月形玉佩，边缘被岁月磨得温润。',
  life_saving_gold_plaque: '可在致命一击时护住持有者一次。',
  three_wish_slips: '书院中写下心愿的纸笺。',
  graduation_wish_slip: '结业时留下的愿笺，记录一段共同的求学时光。',
  revolving_horse_lantern: '灯影转动时会映出旧日景象。',
  reincarnation_light: '忘川尽头的光，只可驻足观看。',
  meng_po_soup: '忘川汤铺中的一碗汤，只作地点介绍。',
  training_sword_target: '书院练剑木桩，可用来查看当前攻击伤害。',
  white_crane: '栖居于庭院的白鹤，不能收入背包。',
  carrier_pigeon: '往返传信的信鸽，不能收入背包。',
  alchemy_furnace: '用于炼制丹药的丹炉，固定在丹房。',
  incense_burner: '供人静心焚香的香炉，固定在原处。',
  crane_incense_burner: '刻有鹤纹的书院香炉，固定在原处。'
};

const itemDefinitions = Object.fromEntries(
  Object.entries(manifest).map(([id, entry]) => {
    const equipmentSlot = SLOT_BY_ID[id] || '';
    const consumable = CONSUMABLES[id] || null;
    return [id, {
      id,
      name: entry.name,
      category: entry.category,
      categoryName: categoryNames[entry.category] || '物品',
      icon: `${ICON_ROOT_URL}/${entry.frames[0]}`,
      description: descriptions[id] || `${entry.name}，可在挟剑地图中查看、携带或使用。`,
      portable: !FIXED_IDS.has(id),
      equipmentSlot,
      attackBonus: equipmentSlot === 'weapon' ? (SIGNATURE_WEAPONS.has(id) ? 6 : 3) : 0,
      defenseBonus: id === 'general_armor' ? 6 : (equipmentSlot === 'clothing' ? 2 : 0),
      effect: consumable,
      respawnMs: consumable ? Number(process.env.ITEM_RESPAWN_MS || 600000) : 0
    }];
  })
);

const starterItems = {
  'zhou-ran': ['zhou_ran_dragon_sword', 'taoist_whisk', 'taoist_robe', 'jade_hairpin'],
  'he-qingfeng': ['bone_fan', 'sect_leader_token', 'tianxing_black_robe'],
  'ren-chaoye': ['zunqian_sword', 'tianxing_black_robe'],
  'shen-chiyi': ['scholar_defensive_sword', 'hanlin_official_robe', 'jade_pendant', 'official_seal', 'life_saving_gold_plaque'],
  'qi-pingchuan': ['jade_bee_needles', 'peach_folding_fan', 'poison_manual'],
  'jiang-huaian': ['silver_needle_case', 'physician_box', 'medicine_pouch', 'medical_valley_dress', 'white_jade_bracelet', 'plum_fall_poison'],
  'tang-wanchu': ['tang_wanchu_sword', 'young_sect_master_token', 'righteous_sect_robe']
};

const martialByCharacter = {
  'zhou-ran': 5,
  'he-qingfeng': 9,
  'ren-chaoye': 7,
  'shen-chiyi': 3,
  'qi-pingchuan': 6,
  'jiang-huaian': 3,
  'tang-wanchu': 7
};

const placements = [
  ['xj-jingyuan', 'disciple_rooms', 'academy_outer_robe', 7],
  ['xj-jingyuan', 'main_hall', 'three_wish_slips'], ['xj-jingyuan', 'main_hall', 'graduation_wish_slip'],
  ['xj-jingyuan', 'teacher_rooms', 'fate_cards'], ['xj-jingyuan', 'main_hall', 'exam_and_answer_slip'],
  ['xj-jingyuan', 'teacher_rooms', 'academy_grade_roster'], ['xj-jingyuan', 'library', 'twig_bound_script'],
  ['xj-jingyuan', 'kitchen', 'rock_sugar_snow_pear'], ['xj-jingyuan', 'wish_river', 'wish_lantern'],
  ['xj-jingyuan', 'pavilion', 'star_moon_poetry_paper'], ['xj-jingyuan', 'library', 'four_treasures'],
  ['xj-jingyuan', 'library', 'scrolls_and_books'], ['xj-jingyuan', 'masked_room', 'scarred_half_mask'],
  ['xj-jingyuan', 'practice', 'training_sword_target'], ['xj-jingyuan', 'main_hall', 'crane_incense_burner'],
  ['xj-jingyuan', 'crane_yard', 'white_crane'],
  ['xj-daohua', 'tailor_cottage', 'wedding_invitation'], ['xj-daohua', 'tailor_cottage', 'bridal_robe'],
  ['xj-daohua', 'tailor_cottage', 'bridal_sewing_kit'], ['xj-daohua', 'practice', 'peachwood_sword'],
  ['xj-daohua', 'crane_court', 'white_feather_fan'], ['xj-daohua', 'library', 'taoist_scripture'],
  ['xj-daohua', 'crane_court', 'crane_feathers'], ['xj-daohua', 'memorial', 'preserved_white_plum'],
  ['xj-daohua', 'alchemy', 'alchemy_furnace'], ['xj-daohua', 'main_hall', 'incense_burner'],
  ['xj-tianxing', 'leader_hall', 'secret_command_scroll'], ['xj-tianxing', 'guardian_hall', 'curved_saber'],
  ['xj-tianxing', 'secret_room', 'twin_short_knives'],
  ['xj-danxi', 'herb_field_upper', 'rare_herbs', 3], ['xj-danxi', 'medicine_room', 'medicine_gourd_pills', 2],
  ['xj-danxi', 'medicine_room', 'antidote', 2], ['xj-danxi', 'library', 'medical_manual'],
  ['xj-danxi', 'master_room', 'rouge_box'], ['xj-danxi', 'master_room', 'jewelry_box'],
  ['xj-danxi', 'alchemy', 'alchemy_furnace'],
  ['xj-buhuan', 'zhengqi_hall', 'martial_alliance_token'], ['xj-buhuan', 'library', 'sect_rules_bamboo_book'],
  ['xj-taozhi', 'laboratory', 'sleeping_drug', 2], ['xj-taozhi', 'laboratory', 'poison_powder', 2],
  ['xj-taozhi', 'laboratory', 'antidote'], ['xj-taozhi', 'poison_garden', 'poisonous_peach_branch'],
  ['xj-taozhi', 'master_room', 'peach_blossom_wine'],
  ['xj-dongjia', 'pigeon_loft', 'secret_letter_pigeon'], ['xj-dongjia', 'study', 'scholar_robe'],
  ['xj-dongjia', 'pigeon_loft', 'carrier_pigeon'], ['xj-dongjia', 'crane_court', 'white_crane'],
  ['xj-ren', 'armory', 'general_armor'], ['xj-ren', 'mother_court', 'baby_name_maple_charm'],
  ['xj-ren', 'main_hall', 'betrothal_scrolls'], ['xj-ren', 'ancestral', 'plum_blossom_seal'],
  ['xj-capital', 'hanlin', 'memorial_scroll'], ['xj-capital', 'lantern_bridge', 'folded_sky_lanterns'],
  ['xj-capital', 'lantern_river_south', 'ceremonial_salt_cups'],
  ['xj-forgetfulness', 'memory_left', 'revolving_horse_lantern'], ['xj-forgetfulness', 'memory_right', 'ceremonial_salt_cups'],
  ['xj-forgetfulness', 'mengpo', 'meng_po_soup'], ['xj-forgetfulness', 'choice_square', 'reincarnation_light'],
  ['xj-border', 'childhood_home', 'crescent_jade_charm']
];

function nodePosition(mapKey, nodeId, offsetIndex = 0) {
  const nodes = routeNodes[mapKey] || {};
  const node = nodes[nodeId] || Object.values(nodes)[0] || { x: 0.5, y: 0.5 };
  const angle = offsetIndex * 2.39996;
  const radius = offsetIndex ? Math.min(0.025, 0.008 + offsetIndex * 0.003) : 0;
  return {
    nx: Math.max(0.02, Math.min(0.98, node.x + Math.cos(angle) * radius)),
    ny: Math.max(0.02, Math.min(0.98, node.y + Math.sin(angle) * radius))
  };
}

function worldPosition(mapKey, nx, ny) {
  const dimensions = mapDimensions[mapKey] || { width: 2048, height: 2048 };
  return { x: nx * dimensions.width, y: ny * dimensions.height };
}

function nearestRoutePosition(mapKey, x, y) {
  const nodes = Object.values(routeNodes[mapKey] || {});
  if (!nodes.length) return { nodeId: 'route', nx: 0.5, ny: 0.5 };
  let nearest = nodes[0];
  let nearestDistance = Infinity;
  for (const node of nodes) {
    const point = worldPosition(mapKey, node.x, node.y);
    const distance = Math.hypot(point.x - x, point.y - y);
    if (distance < nearestDistance) {
      nearest = node;
      nearestDistance = distance;
    }
  }
  return { nodeId: nearest.id, nx: nearest.x, ny: nearest.y };
}

module.exports = {
  itemDefinitions,
  starterItems,
  martialByCharacter,
  placements,
  mapDimensions,
  nodePosition,
  worldPosition,
  nearestRoutePosition
};
