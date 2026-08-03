const ROOT = 'characters/hanmen/xiujing-xuanxuan';

function singleFrameActions(mapping) {
  return Object.fromEntries(Object.entries(mapping).map(([key, frameDir]) => [key, {
    label: key,
    frameDir,
    frames: ['00.png'],
    frameInterval: key === 'personality' || key === 'idle' ? 3000 : 220,
    loop: key === 'personality' || key === 'idle' || key === 'run',
  }]));
}

export const HANMEN_CHARACTER_IDS = ['xuan-xuan', 'xiu-jing'];

export const HANMEN_CHARACTER_DEFS = {
  'xuan-xuan': {
    id: 'xuan-xuan', name: '萱宣', sect: '寒门', category: 'hanmen', gender: 'female',
    dir: 'xiujing-xuanxuan/xuanxuan', frameRoot: `${ROOT}/xuanxuan/frames`,
    portraitPath: `${ROOT}/xuanxuan/frames/noble_idle/00.png`,
    collision: { width: 38, height: 30, offsetY: 30 }, render: { width: 104, height: 104 },
    baseStats: { maxHp: 100, martial: 0, attack: 4, defense: 4, speed: 1 }, defaultItems: [],
    actions: singleFrameActions({
      personality: 'noble_idle', idle: 'noble_idle', run: 'run', etiquette: 'curtsey', martial: 'salute', signature: 'write_letter',
      adjust_hairpin: 'adjust_hairpin', annoyed: 'annoyed', arrange_sleeve: 'arrange_sleeve', cross_puddle: 'cross_puddle',
      drink_tea: 'drink_tea', embroider: 'embroider', hold_fan: 'hold_fan', petal_dance: 'petal_dance', play_guqin: 'play_guqin',
      point_order: 'point_order', pour_tea: 'pour_tea', read_letter: 'read_letter', shy_smile: 'shy_smile', startled: 'startled', walk: 'walk',
    }),
  },
  'xiu-jing': {
    id: 'xiu-jing', name: '修璟', sect: '寒门', category: 'hanmen', gender: 'male',
    dir: 'xiujing-xuanxuan/xiujing', frameRoot: `${ROOT}/xiujing/frames`,
    portraitPath: `${ROOT}/xiujing/frames/idle_book/00.png`,
    collision: { width: 38, height: 30, offsetY: 30 }, render: { width: 104, height: 104 },
    baseStats: { maxHp: 100, martial: 0, attack: 4, defense: 4, speed: 1 }, defaultItems: [],
    actions: singleFrameActions({
      personality: 'idle_book', idle: 'idle_book', run: 'run', etiquette: 'salute', martial: 'deep_bow', signature: 'calligraphy',
      arrange_tablets: 'arrange_tablets', kneeling_rite: 'kneeling_rite', meditate_books: 'meditate_books',
      mute_writing_board: 'mute_writing_board', offer_incense: 'offer_incense', offer_scroll: 'offer_scroll', pick_page: 'pick_page',
      protect_manuscript: 'protect_manuscript', read_book: 'read_book', recite: 'recite', silent_thanks: 'silent_thanks',
      study_long_scroll: 'study_long_scroll', teach_etiquette: 'teach_etiquette', think_brush: 'think_brush', walk_bamboo_slips: 'walk_bamboo_slips',
    }),
  },
};

export default HANMEN_CHARACTER_DEFS;
