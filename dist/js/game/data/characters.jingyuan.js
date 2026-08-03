// 挟剑七人：每个人物都是独立定义，动作、属性、资源和初始物品互不共享。
const ROOT = '../../fill/jingyuan-chibi20-delivery-20260719';

const STANDARD_ACTIONS = Object.freeze({
  personality: { label: '静息', frameDir: 'personality', frameCount: 4, frameInterval: 3000, loop: true },
  run: { label: '奔跑', frameDir: 'run', frameCount: 4, frameInterval: 105, loop: true },
  etiquette: { label: '礼仪', frameDir: 'etiquette', frameCount: 4, frameInterval: 220, loop: false },
  martial: { label: '武术', frameDir: 'martial', frameCount: 4, frameInterval: 110, loop: false },
  signature: { label: '招牌', frameDir: 'signature', frameCount: 4, frameInterval: 180, loop: false },
});

function character(id, name, sect, dir, martial, defaultItems, extra = {}) {
  return {
    id, name, sect, dir,
    category: 'jingyuan',
    frameRoot: `${ROOT}/${dir}/frames`,
    portraitPath: `${ROOT}/${dir}/frames/personality/00.png`,
    collision: { width: 42, height: 34, offsetY: 34 },
    render: { width: 112, height: 112, nameplateOffsetY: 62 },
    baseStats: { maxHp: 100, martial, attack: 6 + martial * 2, defense: 4, speed: 1 },
    defaultItems,
    equipmentSlots: ['weapon', 'clothing', 'accessory'],
    actions: Object.fromEntries(Object.entries(STANDARD_ACTIONS).map(([key, value]) => [key, { ...value }])),
    ...extra,
  };
}

export const JINGYUAN_CHARACTER_IDS = [
  'zhou-ran', 'he-qingfeng', 'ren-chaoye', 'shen-chiyi',
  'qi-pingchuan', 'jiang-huaian', 'tang-wanchu',
];

export const JINGYUAN_CHARACTER_DEFS = {
  'zhou-ran': character('zhou-ran', '周然', '道华观', '01-周然', 5,
    ['zhou_ran_dragon_sword', 'taoist_whisk', 'taoist_robe', 'jade_hairpin']),
  'he-qingfeng': character('he-qingfeng', '贺清风', '天行教', '02-贺清风', 9,
    ['bone_fan', 'sect_leader_token', 'tianxing_black_robe']),
  'ren-chaoye': character('ren-chaoye', '任朝野', '天行教', '03-任朝野', 7,
    ['zunqian_sword', 'tianxing_black_robe']),
  'shen-chiyi': character('shen-chiyi', '沈池懿', '静远书院', '04-沈池懿', 3,
    ['scholar_defensive_sword', 'hanlin_official_robe', 'jade_pendant', 'official_seal', 'life_saving_gold_plaque']),
  'qi-pingchuan': character('qi-pingchuan', '戚凭川', '桃止门', '05-戚凭川', 6,
    ['jade_bee_needles', 'peach_folding_fan', 'poison_manual']),
  'jiang-huaian': character('jiang-huaian', '江淮安', '丹溪谷', '06-江淮安', 3,
    ['silver_needle_case', 'physician_box', 'medicine_pouch', 'medical_valley_dress', 'white_jade_bracelet', 'plum_fall_poison']),
  'tang-wanchu': character('tang-wanchu', '唐挽初', '不还门', '07-唐挽初', 7,
    ['tang_wanchu_sword', 'young_sect_master_token', 'righteous_sect_robe']),
};

export const LEGACY_CHARACTER_ID_ALIASES = Object.freeze({ 'jiang-haian': 'jiang-huaian' });

export default JINGYUAN_CHARACTER_DEFS;
