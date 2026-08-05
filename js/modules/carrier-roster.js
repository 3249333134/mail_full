/* ============================================================
 * 万物信使库 — carrier-roster.js
 * 「万物皆可送信」的信使档案：真实类 + 科幻/奇幻类
 * 每个信使的属性驱动旅程事件引擎（journey-engine.js）
 * ============================================================ */

const CARRIER_ROSTER = [
  // ---------- 真实类 ----------
  {
    id: 'ant', name: '工蚁', category: 'real', emoji: '🐜',
    baseSpeed: 0.2, lifespan: 5, reproductionRate: 0.6, predationRate: 0.7,
    predators: ['sparrow', 'lizard', 'fish'],
    envPreference: ['land', 'underground'], specialAbilities: [],
    timeSense: 'dilated',
    lineageNaming: { base: '小黑', pattern: '{base}的{N}世曾孙' },
    lore: '一只普通的工蚁，背着一封信，用一生去走一段路。'
  },
  {
    id: 'homing-pigeon', name: '信鸽', category: 'real', emoji: '🕊️',
    baseSpeed: 0.8, lifespan: 12, reproductionRate: 0.15, predationRate: 0.3,
    predators: ['hawk', 'cat'],
    envPreference: ['sky'], specialAbilities: ['homing'],
    timeSense: 'normal',
    lineageNaming: { base: '雪翎', pattern: '{base}的{N}世孙' },
    lore: '认得归途的翅膀，把思念直线送达。'
  },
  {
    id: 'migratory-bird', name: '南迁的候鸟', category: 'real', emoji: '🦅',
    baseSpeed: 0.9, lifespan: 20, reproductionRate: 0.25, predationRate: 0.3,
    predators: ['hawk', 'human'],
    envPreference: ['sky', 'water'], specialAbilities: ['cross-ocean', 'seasonal'],
    timeSense: 'normal',
    lineageNaming: { base: '南星', pattern: '{base}的第{N}代' },
    lore: '顺着季风南迁，一路把信捎给远方的人。'
  },
  {
    id: 'migratory-fish', name: '洄游鱼', category: 'real', emoji: '🐟',
    baseSpeed: 0.5, lifespan: 10, reproductionRate: 0.3, predationRate: 0.5,
    predators: ['bird', 'human', 'seal'],
    envPreference: ['water'], specialAbilities: ['upstream'],
    timeSense: 'normal',
    lineageNaming: { base: '银鳞', pattern: '{base}的{N}世孙' },
    lore: '逆流而上，把信从大海带回出生的河流。'
  },
  {
    id: 'stray-cat', name: '流浪猫', category: 'real', emoji: '🐈',
    baseSpeed: 0.7, lifespan: 8, reproductionRate: 0.2, predationRate: 0.1,
    predators: ['human'],
    envPreference: ['land'], specialAbilities: ['hitchhike'],
    timeSense: 'normal',
    lineageNaming: { base: '阿橘', pattern: '{base}的孩子' },
    lore: '巷口的老猫，搭过三轮、睡过屋檐，也替人送过信。'
  },
  {
    id: 'firefly', name: '萤火虫', category: 'real', emoji: '✨',
    baseSpeed: 0.3, lifespan: 4, reproductionRate: 0.5, predationRate: 0.6,
    predators: ['frog', 'bird', 'spider'],
    envPreference: ['land', 'water'], specialAbilities: ['night-glow'],
    timeSense: 'dilated',
    lineageNaming: { base: '微光', pattern: '{base}的{N}代' },
    lore: '黑夜里的光点，把信照亮成一串发光的足迹。'
  },
  {
    id: 'spider', name: '蜘蛛', category: 'real', emoji: '🕷️',
    baseSpeed: 0.25, lifespan: 9, reproductionRate: 0.35, predationRate: 0.4,
    predators: ['bird', 'lizard', 'wasp'],
    envPreference: ['land', 'sky'], specialAbilities: ['web-bridge'],
    timeSense: 'dilated',
    lineageNaming: { base: '织云', pattern: '{base}的第{N}世' },
    lore: '吐丝跨过溪涧，把信暂时挂在网上等风来。'
  },
  {
    id: 'river', name: '河流', category: 'real', emoji: '🌊',
    baseSpeed: 0.6, lifespan: Infinity, reproductionRate: 0, predationRate: 0,
    predators: [],
    envPreference: ['water'], specialAbilities: ['uncontrollable', 'fork'],
    timeSense: 'dilated',
    lineageNaming: null,
    lore: '河水不识字，但它知道每封信终将漂到有人等待的地方。'
  },
  {
    id: 'wind', name: '一阵风', category: 'real', emoji: '🌬️',
    baseSpeed: 0.95, lifespan: 3, reproductionRate: 0, predationRate: 0,
    predators: [],
    envPreference: ['sky', 'water', 'land'], specialAbilities: ['phase-through', 'cross-ocean'],
    timeSense: 'instant',
    lineageNaming: null,
    lore: '没有脚，没有心，却总能把信吹进该去的窗。'
  },
  {
    id: 'drift-bottle', name: '漂流瓶', category: 'real', emoji: '🍾',
    baseSpeed: 0.1, lifespan: Infinity, reproductionRate: 0, predationRate: 0,
    predators: [],
    envPreference: ['water'], specialAbilities: ['passive-drift', 'beached'],
    timeSense: 'dilated',
    lineageNaming: null,
    lore: '被海浪推着走，被沙滩留下，被陌生人拾起，又被放回海里。'
  },

  // ---------- 科幻 / 奇幻类 ----------
  {
    id: 'time-capsule', name: '时间胶囊', category: 'scifi', emoji: '⏳',
    baseSpeed: 0, lifespan: Infinity, reproductionRate: 0, predationRate: 0,
    predators: [],
    envPreference: ['underground'], specialAbilities: ['time-skip', 'sealed'],
    timeSense: 'compressed',
    lineageNaming: null,
    lore: '埋进时间的土壤，等到约定的那天才发芽。'
  },
  {
    id: 'portal-sprite', name: '传送门精灵', category: 'scifi', emoji: '🌀',
    baseSpeed: 0.98, lifespan: 15, reproductionRate: 0.1, predationRate: 0.2,
    predators: ['stellar-courier'],
    envPreference: ['space', 'dream'], specialAbilities: ['teleport', 'misroute'],
    timeSense: 'compressed',
    lineageNaming: { base: '吱吱', pattern: '{base}（{N}号）' },
    lore: '穿过一道门，却常常迷路到奇怪的时代和地方。'
  },
  {
    id: 'stellar-courier', name: '星际信使', category: 'scifi', emoji: '🚀',
    baseSpeed: 1.0, lifespan: 30, reproductionRate: 0.05, predationRate: 0.15,
    predators: ['black-hole'],
    envPreference: ['space'], specialAbilities: ['warp', 'time-dilation'],
    timeSense: 'compressed',
    lineageNaming: { base: '星使', pattern: '{base}-{N}号' },
    lore: '在光年之间跃迁，短暂的黑洞俘获只是绕路的风景。'
  },
  {
    id: 'dream-walker', name: '梦境使者', category: 'scifi', emoji: '🌙',
    baseSpeed: 1.0, lifespan: 1, reproductionRate: 0, predationRate: 0,
    predators: [],
    envPreference: ['dream'], specialAbilities: ['dream-walk', 'instant'],
    timeSense: 'instant',
    lineageNaming: null,
    lore: '走进你的梦境，把信放在枕边——醒来时信已在那里。'
  },
  {
    id: 'ghost-postman', name: '幽灵邮差', category: 'scifi', emoji: '👻',
    baseSpeed: 0.6, lifespan: Infinity, reproductionRate: 0, predationRate: 0,
    predators: [],
    envPreference: ['land', 'dream'], specialAbilities: ['phase-through', 'cross-life'],
    timeSense: 'normal',
    lineageNaming: null,
    lore: '穿墙过巷，风雨夜现身，也能把信送到另一个世界的收信人。'
  },
  {
    id: 'paper-crane', name: '纸鹤', category: 'scifi', emoji: '🕊️',
    baseSpeed: 0.4, lifespan: 2, reproductionRate: 0, predationRate: 0.3,
    predators: ['rain', 'fire'],
    envPreference: ['sky'], specialAbilities: ['folded-life', 'seek-beloved'],
    timeSense: 'dilated',
    lineageNaming: null,
    lore: '折纸之术赋予的短暂生命，只够飞向思念的那个人。'
  },
  {
    id: 'rewind-courier', name: '时光回溯信使', category: 'scifi', emoji: '⏰',
    baseSpeed: 0, lifespan: Infinity, reproductionRate: 0, predationRate: 0,
    predators: [],
    envPreference: ['time'], specialAbilities: ['rewind'],
    timeSense: 'compressed',
    lineageNaming: null,
    lore: '信在过去送达——收信人先于寄信人收到了它。因果，倒着写。'
  }
];

// 便捷查询
CARRIER_ROSTER.byId = (id) => CARRIER_ROSTER.find(c => c.id === id) || null;
CARRIER_ROSTER.random = () => CARRIER_ROSTER[Math.floor(Math.random() * CARRIER_ROSTER.length)];
CARRIER_ROSTER.real = () => CARRIER_ROSTER.filter(c => c.category === 'real');
CARRIER_ROSTER.scifi = () => CARRIER_ROSTER.filter(c => c.category === 'scifi');

window.CARRIER_ROSTER = CARRIER_ROSTER;
