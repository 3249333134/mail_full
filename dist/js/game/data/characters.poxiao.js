// 破晓七人：角色定义（使用破晓专属帧动画资源，每角色 20 个动作，每动作 1 帧）
const ASSET_ROOT = 'poxiao/characters';
const PORTRAIT_ROOT = 'poxiao/characters/portraits';

// 每个角色的 20 个动作文件夹名（按编号排列）
const POXIAO_ACTION_DIRS = {
  zhou_ran: [
    '01_放松站立', '02_调制颜料', '03_画架作画', '04_速写记录', '05_手持画具',
    '06_清洗画笔', '07_装饰蛋糕', '08_端送蛋糕', '09_凝视卜算坠饰', '10_投掷卜算钱币',
    '11_阅读密报', '12_递交密封信', '13_查看手机', '14_蹲身搜索', '15_携速写本奔跑',
    '16_贴墙隐蔽', '17_挺身保护同伴', '18_挥手致意', '19_盘腿休息', '20_卧底警戒',
  ],
  he_yinsheng: [
    '01_自信站立', '02_警察敬礼', '03_拔出手枪', '04_双手瞄准', '05_蹲姿瞄准',
    '06_快速冲刺', '07_战术翻滚', '08_使用手铐', '09_跪地查证', '10_肩麦通话',
    '11_吸烟', '12_踩灭香烟', '13_握红色护符', '14_查看S项链', '15_黑裙伪装',
    '16_举掌喝止', '17_侧踢破门', '18_护住同伴', '19_坐姿沉思', '20_负伤跪地',
  ],
  jiang_yan: [
    '01_沉静站立', '02_戴检验手套', '03_蹲查现场', '04_棉签取样', '05_显微镜检验',
    '06_记录夹书写', '07_封装证物袋', '08_相机取证', '09_持法医刀', '10_打开医药箱',
    '11_举瓶分析', '12_书写案情', '13_紧急通话', '14_携箱奔跑', '15_跪地急救',
    '16_手握红围巾', '17_栽种橄榄树', '18_凝视传承坠饰', '19_警察敬礼', '20_坐读报告',
  ],
  chen_zhou: [
    '01_威严站立', '02_扶正眼镜', '03_监听耳麦', '04_递交情报', '05_双手持枪',
    '06_战术蹲伏', '07_大步冲刺', '08_翻越矮墙', '09_墙后隐蔽', '10_收紧风衣伪装',
    '11_查看城市地图', '12_望远镜观星', '13_查看雨花石', '14_端金鱼缸', '15_伸臂保护',
    '16_手臂负伤', '17_跛行前进', '18_使用手铐', '19_噤声手势', '20_回首离开',
  ],
  li_pingchuan: [
    '01_戒备站立', '02_手持奶茶', '03_制作奶茶', '04_摇制饮品', '05_递送奶茶',
    '06_整理红围巾', '07_旧日敬礼', '08_持枪瞄准', '09_快速奔跑', '10_战术蹲伏',
    '11_栽种橄榄树', '12_三击暗号', '13_赠送白百合', '14_查看白星石', '15_观察星形花',
    '16_凝视毒药瓶', '17_查看照片钱包', '18_黑西装葬礼', '19_低头独坐', '20_剪断橄榄枝',
  ],
  shen_xinghe: [
    '01_沉着站立', '02_阅读情报', '03_笔记本电脑办公', '04_电脑入侵', '05_查看定位地图',
    '06_相机摄影', '07_无线电通话', '08_警察敬礼', '09_拔枪', '10_蹲姿瞄准',
    '11_快速奔跑', '12_守门员扑救', '13_查看半块玉佩', '14_照料金鱼', '15_肃穆黑西装',
    '16_中毒踉跄', '17_胸口包扎', '18_蹲查证物', '19_指认嫌疑人', '20_坐姿回忆',
  ],
  tang_qi: [
    '01_冷峻站立', '02_警察敬礼', '03_拔枪', '04_双手瞄准', '05_跪姿瞄准',
    '06_快速冲刺', '07_奔跑追捕', '08_使用手铐', '09_电击枪瞄准', '10_蹲查针管',
    '11_封装证物', '12_警棍防御', '13_警校训练', '14_黑西装正装', '15_吃冰棍',
    '16_查看水晶项链', '17_愤怒握拳', '18_肩部负伤', '19_跪地悔恨', '20_放下武器',
  ],
};

// 标准动作映射（索引 0-19 对应 act_01 ~ act_20）
const POXIAO_STANDARD_MAP = {
  zhou_ran:     { personality: 0,  run: 14, etiquette: 17, martial: 19, signature: 2 },
  he_yinsheng:  { personality: 0,  run: 5,  etiquette: 1,  martial: 2,  signature: 16 },
  jiang_yan:    { personality: 0,  run: 13, etiquette: 18, martial: 8,  signature: 16 },
  chen_zhou:    { personality: 0,  run: 6,  etiquette: 3,  martial: 4,  signature: 17 },
  li_pingchuan: { personality: 0,  run: 8,  etiquette: 6,  martial: 7,  signature: 12 },
  shen_xinghe:  { personality: 0,  run: 10, etiquette: 7,  martial: 8,  signature: 11 },
  tang_qi:      { personality: 0,  run: 5,  etiquette: 1,  martial: 2,  signature: 7 },
};

// 标准动作的帧间隔和循环配置
const STANDARD_TIMING = {
  personality: { frameInterval: 3000, loop: true },
  run:         { frameInterval: 105,  loop: true },
  etiquette:   { frameInterval: 220,  loop: false },
  martial:     { frameInterval: 110,  loop: false },
  signature:   { frameInterval: 180,  loop: false },
};

function buildActions(dir) {
  const dirs = POXIAO_ACTION_DIRS[dir];
  const stdMap = POXIAO_STANDARD_MAP[dir];
  const actions = {};

  // 5 个标准动作（兼容 gameMapRenderer 的 personality/run/etiquette/martial/signature）
  for (const [stdKey, idx] of Object.entries(stdMap)) {
    const frameDir = dirs[idx];
    actions[stdKey] = {
      label: frameDir.replace(/^\d+_/, ''),
      frameDir,
      frameCount: 1,
      frameInterval: STANDARD_TIMING[stdKey].frameInterval,
      loop: STANDARD_TIMING[stdKey].loop,
    };
  }

  // 20 个完整动作（act_01 ~ act_20）
  dirs.forEach((frameDir, i) => {
    const num = String(i + 1).padStart(2, '0');
    actions[`act_${num}`] = {
      label: frameDir.replace(/^\d+_/, ''),
      frameDir,
      frameCount: 1,
      frameInterval: 200,
      loop: false,
    };
  });

  return actions;
}

function character(id, name, sect, dir, portraitFile, martial, defaultItems) {
  return {
    id, name, sect, dir,
    category: 'poxiao',
    frameRoot: `${ASSET_ROOT}/${dir}`,
    portraitPath: `${PORTRAIT_ROOT}/${portraitFile}`,
    collision: { width: 42, height: 34, offsetY: 34 },
    render: { width: 112, height: 112, nameplateOffsetY: 62 },
    baseStats: { maxHp: 100, martial, attack: 6 + martial * 2, defense: 4, speed: 1 },
    defaultItems,
    equipmentSlots: ['weapon', 'clothing', 'accessory'],
    actions: buildActions(dir),
  };
}

export const POXIAO_CHARACTER_IDS = [
  'px-tangqi', 'px-lipingchuan', 'px-jiangyan', 'px-xinghe',
  'px-heyinsheng', 'px-chenzhou', 'px-zhouran',
];

export const POXIAO_CHARACTER_DEFS = {
  'px-tangqi':      character('px-tangqi',      '唐岐',   '缉毒警',     'tang_qi',      '07_tang_qi.png',      7, ['handcuffs', 'evidence_syringe']),
  'px-lipingchuan': character('px-lipingchuan', '李平川', '奶茶店老板', 'li_pingchuan', '05_li_pingchuan.png', 5, ['red_scarf', 'star_flower']),
  'px-jiangyan':    character('px-jiangyan',    '江宴',   '法医',       'jiang_yan',    '03_jiang_yan.png',    3, ['olive_sapling', 'casablanca_lilies']),
  'px-xinghe':      character('px-xinghe',      '沈星何', '情报科',     'shen_xinghe',  '06_shen_xinghe.png',  4, ['half_jade_pendant', 'goldfish_bowl']),
  'px-heyinsheng':  character('px-heyinsheng',  '贺引生', '缉毒警',     'he_yinsheng',  '02_he_yinsheng.png',  6, ['super_s_necklace', 'protection_talisman', 'crystal_pendant']),
  'px-chenzhou':    character('px-chenzhou',    '陈昼',   '卧底',       'chen_zhou',    '04_chen_zhou.png',    8, ['rainflower_stone', 'divination_pendant']),
  'px-zhouran':     character('px-zhouran',     '周然',   '画家',       'zhou_ran',     '01_zhou_ran.png',     5, ['painter_apron', 'divorce_agreement', 'legless_bird_board']),
};

export default POXIAO_CHARACTER_DEFS;
