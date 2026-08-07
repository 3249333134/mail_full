/* ============================================================
 * 万物送信 · 信使档案 seed（carrierSeed.js）
 * 将「内置 17 个信使 + xinshi 扩展 108 个信使」写入 MySQL：
 *   - 信使档案 → carrier_definitions 表（definition JSON）
 *   - xinshi 插图（small/large/trace PNG）→ asset_files 表（assetStore.putAsset）
 * 服务启动时检测空表自动 seed；也可 `node server/carrierSeed.js` 手动执行。
 * ============================================================ */
const path = require('path');
const fs = require('fs');
const mysqlDao = require('./mysqlDao');
const assetStore = require('./assetStore');

const ROOT_DIR = path.resolve(__dirname, '..');
const XINSHI_INDEX_PATH = path.join(ROOT_DIR, 'mailfile', 'xinshi', 'index.json');
const XINSHI_DIR = path.join(ROOT_DIR, 'mailfile', 'xinshi');

/* ---------------- 内置 17 个信使（与前端 carrier-roster.js 保持一致） ---------------- */

const BUILTIN_CARRIERS = [
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

/* ---------------- xinshi 扩展信使 enrich（与前端 editor.js 逻辑一致） ---------------- */

function hashString(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) >>> 0;
  return h / 4294967295;
}

function derivePredators(envList, h) {
  const pool = [
    { id: 'sparrow', env: ['land', 'sky'] },
    { id: 'lizard', env: ['land'] },
    { id: 'fish', env: ['water'] },
    { id: 'hawk', env: ['sky'] },
    { id: 'cat', env: ['land'] },
    { id: 'frog', env: ['land', 'water'] },
    { id: 'wasp', env: ['land', 'sky'] },
    { id: 'seal', env: ['water'] },
    { id: 'human', env: ['land', 'water', 'sky', 'underground'] },
    { id: 'black-hole', env: ['space'] }
  ];
  const candidates = [];
  pool.forEach(p => { if (envList.some(e => p.env.includes(e))) candidates.push(p.id); });
  const count = Math.max(0, Math.min(3, Math.floor(h * 5)));
  const out = [];
  for (let i = 0; i < count && candidates.length; i++) {
    out.push(candidates[Math.floor((h * 1000 + i) % candidates.length)]);
  }
  return [...new Set(out)];
}

function enrichXinshiCarrier(raw) {
  const traceEnvMap = {
    paw: ['land'], feather: ['sky'], sparkle: ['sky', 'dream'],
    smoke: ['sky', 'space'], bolt: ['sky', 'space'], flame: ['sky', 'space'],
    trail: ['land', 'water'], ripple: ['water'], footprint: ['land'],
    arc: ['space', 'dream'], snow: ['land', 'sky'], vortex: ['space', 'dream', 'time']
  };
  const traceAbilityMap = {
    paw: 'stealth', feather: 'homing', sparkle: 'night-glow',
    smoke: 'smoke-screen', bolt: 'warp', flame: 'warp',
    trail: 'seek-beloved', ripple: 'upstream', footprint: 'hitchhike',
    arc: 'teleport', snow: 'phase-through', vortex: 'time-skip'
  };
  const h = hashString(raw.id);
  const isReal = raw.category === 'real';
  const env = traceEnvMap[raw.traceType] || ['land'];
  const abilities = traceAbilityMap[raw.traceType] ? [traceAbilityMap[raw.traceType]] : [];
  const inanimate = ['vortex', 'snow', 'ripple', 'bolt', 'flame', 'smoke', 'arc'].includes(raw.traceType);

  return {
    id: 'xs-' + raw.id,
    name: raw.name,
    category: raw.category,
    emoji: raw.emoji || (isReal ? '📨' : '✨'),
    _xinshi: true,
    _originalId: raw.id,
    small: raw.small,
    large: raw.large,
    trace: raw.trace,
    traceType: raw.traceType,
    baseSpeed: isReal ? 0.25 + h * 0.65 : 0.45 + h * 0.55,
    lifespan: inanimate ? Infinity : (isReal ? 4 + Math.floor(h * 18) : 10 + Math.floor(h * 25)),
    reproductionRate: inanimate ? 0 : (isReal ? 0.1 + h * 0.45 : 0.05 + h * 0.25),
    predationRate: isReal ? 0.05 + h * 0.65 : 0.02 + h * 0.3,
    predators: derivePredators(env, h),
    envPreference: env,
    specialAbilities: abilities,
    timeSense: isReal ? (h < 0.25 ? 'dilated' : 'normal') : (h < 0.5 ? 'compressed' : 'normal'),
    lineageNaming: inanimate ? null : { base: (raw.name.slice(0, 2) || raw.name), pattern: '{base}的{N}世孙' },
    lore: `${raw.name}接到了这封信，准备踏上属于自己的旅程。`
  };
}

/* ---------------- 组装全部信使 ---------------- */

function buildAllCarriers() {
  const builtin = BUILTIN_CARRIERS.map((c, i) => ({ ...c, displayOrder: i }));
  let xinshi = [];
  try {
    if (fs.existsSync(XINSHI_INDEX_PATH)) {
      const data = JSON.parse(fs.readFileSync(XINSHI_INDEX_PATH, 'utf8'));
      const carriers = (data.carriers || []).filter(c => c && c.id);
      xinshi = carriers.map((c, i) => enrichXinshiCarrier({ ...c, displayOrder: builtin.length + i }));
    } else {
      console.warn('[carrierSeed] xinshi index.json 不存在:', XINSHI_INDEX_PATH);
    }
  } catch (e) {
    console.warn('[carrierSeed] 读取 xinshi index.json 失败:', e.message);
  }
  return [...builtin, ...xinshi];
}

/* ---------------- 图片素材入库（asset_files） ---------------- */

function collectXinshiImages() {
  const images = [];
  if (!fs.existsSync(XINSHI_DIR)) return images;
  const dirs = fs.readdirSync(XINSHI_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory() && !d.name.startsWith('_'))
    .map(d => d.name);
  for (const dir of dirs) {
    const dirPath = path.join(XINSHI_DIR, dir);
    let files = [];
    try { files = fs.readdirSync(dirPath).filter(f => /\.png$/i.test(f)); } catch (_) {}
    for (const f of files) {
      const abs = path.join(dirPath, f);
      try {
        const buf = fs.readFileSync(abs);
        images.push({
          assetPath: `mailfile/xinshi/${dir}/${f}`,
          mimeType: 'image/png',
          data: buf,
        });
      } catch (_) {}
    }
  }
  return images;
}

/* ---------------- 主入口 ---------------- */

async function seedCarriersToMysql() {
  const carriers = buildAllCarriers();
  let savedCarriers = 0;
  for (const c of carriers) {
    const ok = await mysqlDao.saveCarrierDefinition(c);
    if (ok) savedCarriers++;
  }

  const images = collectXinshiImages();
  let savedAssets = 0;
  for (const img of images) {
    try {
      const ok = await assetStore.putAsset(img.assetPath, img.mimeType, img.data, 'carrier');
      if (ok) savedAssets++;
    } catch (e) {
      console.warn('[carrierSeed] 素材入库失败', img.assetPath, e.message);
    }
  }

  return { carriers: savedCarriers, assets: savedAssets, totalCarriers: carriers.length };
}

/* 手动执行：node server/carrierSeed.js */
if (require.main === module) {
  const { initMysql, closeMysql } = require('./mysqlClient');
  (async () => {
    try {
      await initMysql();
      const result = await seedCarriersToMysql();
      console.log(`[carrierSeed] 完成：档案 ${result.carriers}/${result.totalCarriers}，素材 ${result.assets}`);
    } catch (e) {
      console.error('[carrierSeed] 失败:', e.message);
      process.exit(1);
    } finally {
      closeMysql();
    }
  })();
}

module.exports = { BUILTIN_CARRIERS, enrichXinshiCarrier, buildAllCarriers, collectXinshiImages, seedCarriersToMysql };
