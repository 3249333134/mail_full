const WebSocket = require('ws');
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { URL } = require('url');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { initMysql, isMysqlEnabled } = require('./mysqlClient');
const mysqlDao = require('./mysqlDao');
const assetStore = require('./assetStore');
const carrierSeed = require('./carrierSeed');
const {
  itemDefinitions,
  starterItems,
  martialByCharacter,
  placements,
  mapDimensions,
  nodePosition,
  worldPosition,
  nearestRoutePosition,
  characterDefinitions,
  mapDefinitions
} = require('./xiejianGameData');

// 内置信使判定：以 carrierSeed.BUILTIN_CARRIERS（与前端 carrier-roster.js 一致的 17 个）为准
const BUILTIN_CARRIER_IDS = new Set((carrierSeed.BUILTIN_CARRIERS || []).map(c => c.id));
function isBuiltinCarrier(id) { return BUILTIN_CARRIER_IDS.has(id); }

const poxiaoData = require('./poxiaoGameData');
const poxiaoItemDefinitions = poxiaoData.itemDefinitions;
const poxiaoCharacterDefinitions = poxiaoData.characterDefinitions;
const poxiaoMapDefinitions = poxiaoData.mapDefinitions;
const poxiaoPlacements = poxiaoData.placements;
const poxiaoMapDimensions = poxiaoData.mapDimensions;
const poxiaoNodePosition = poxiaoData.nodePosition;
const poxiaoWorldPosition = poxiaoData.worldPosition;
const poxiaoStarterItems = poxiaoData.starterItems;
const poxiaoMartialByCharacter = poxiaoData.martialByCharacter;

const Busboy = require('busboy');
const packageGen = require('./packageGen');

// ─── Agnes AI（旅程文案生成）───
const AGNES_API_BASE = process.env.AGNES_API_BASE || 'https://apihub.agnes-ai.com/v1';
const AGNES_API_BASE_CN = 'https://apihub.agnes-ai.cn/v1'; // 国内节点（网络不通时自动回退）
const AGNES_MODEL = process.env.AGNES_MODEL || 'agnes-2.5-flash';
let HttpsProxyAgent;
try { HttpsProxyAgent = require('https-proxy-agent').HttpsProxyAgent; } catch (_) {}

function callAgnesAI(apiKey, messages, maxTokens = 1800, temperature = 0.9) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({ model: AGNES_MODEL, messages, max_tokens: maxTokens, temperature });
    const ATTEMPT_TIMEOUT = 10000;
    // 尝试顺序：直连 .com → 直连 .cn → 代理 .com → 代理 .cn
    const attempts = [
      { url: AGNES_API_BASE + '/chat/completions', useProxy: false },
      { url: AGNES_API_BASE_CN + '/chat/completions', useProxy: false },
    ];
    if (HttpsProxyAgent) {
      const proxyUrl = process.env.AGNES_PROXY || process.env.https_proxy || process.env.HTTPS_PROXY
        || process.env.http_proxy || process.env.HTTP_PROXY || 'http://127.0.0.1:7890';
      attempts.push(
        { url: AGNES_API_BASE + '/chat/completions', useProxy: true, proxyUrl },
        { url: AGNES_API_BASE_CN + '/chat/completions', useProxy: true, proxyUrl }
      );
    }
    let idx = 0;
    const tryNext = () => {
      if (idx >= attempts.length) return reject(new Error('AI 请求超时'));
      const attempt = attempts[idx++];
      const requestOptions = {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + apiKey,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
        timeout: ATTEMPT_TIMEOUT,
      };
      if (attempt.useProxy && HttpsProxyAgent) requestOptions.agent = new HttpsProxyAgent(attempt.proxyUrl);
      const req = https.request(attempt.url, requestOptions, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            if (json.error) return reject(new Error(json.error.message || 'AI API error'));
            resolve(json.choices?.[0]?.message?.content || '');
          } catch (e) { reject(new Error('AI 响应解析失败: ' + e.message)); }
        });
      });
      req.on('error', () => tryNext());              // 连接失败 → 换下一方案
      req.on('timeout', () => { req.destroy(); tryNext(); }); // 超时 → 换下一方案
      req.write(payload);
      req.end();
    };
    tryNext();
  });
}

const PORT = Number(process.env.PORT || 3000);
const HTTP_ONLY = process.env.HTTP_ONLY === '1';
const ROOT_DIR = path.resolve(__dirname, '..');
const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(__dirname, 'data'));
const STATE_FILE = path.join(DATA_DIR, 'state.json');
const MEDIA_DIR = path.join(DATA_DIR, 'media');
const MAX_ROOM_CONNECTIONS = 11;
const COMBAT_ATTACK_COOLDOWN_MS = Number(process.env.COMBAT_ATTACK_COOLDOWN_MS || 900);
const XIEJIAN_CHARACTERS = new Set(Object.keys(characterDefinitions));
const XIEJIAN_CHARACTER_NAMES = Object.fromEntries(Object.entries(characterDefinitions).map(([id, def]) => [id, def.name]));
const POXIAO_CHARACTERS_SET = new Set(Object.keys(poxiaoCharacterDefinitions));
const POXIAO_CHARACTER_NAMES = Object.fromEntries(Object.entries(poxiaoCharacterDefinitions).map(([id, def]) => [id, def.name]));
// 全局角色名映射（所有信箱的角色）
const GLOBAL_CHARACTER_NAMES = {
  ...XIEJIAN_CHARACTER_NAMES,
  ...POXIAO_CHARACTER_NAMES,
  'xiu-jing': '修璟',
  'xuan-xuan': '萱宣',
};
// 寒门角色初始装备（复用既有 itemDefinitions 中的同类物品）
// 修璟（儒生）→ 防身剑 + 儒生袍 + 玉佩；萱宣 → 白羽扇 + 书院外袍 + 白玉镯
const HANMEN_STARTER_ITEMS = {
  'xiu-jing': ['scholar_defensive_sword', 'scholar_robe', 'jade_pendant'],
  'xuan-xuan': ['white_feather_fan', 'academy_outer_robe', 'white_jade_bracelet']
};
// 合并后的初始物品查询表（挟剑 + 寒门 + 破晓）
const STARTER_ITEMS_ALL = { ...starterItems, ...HANMEN_STARTER_ITEMS, ...poxiaoStarterItems };
// 合并后的道具定义查询表（挟剑 + 破晓）
const ALL_ITEM_DEFINITIONS = { ...itemDefinitions, ...poxiaoItemDefinitions };
// 统一位置函数：根据 mapKey 前缀分发到破晓或挟剑
function unifiedWorldPosition(mapKey, nx, ny) {
  if (String(mapKey || '').startsWith('px-')) return poxiaoWorldPosition(mapKey, nx, ny);
  return worldPosition(mapKey, nx, ny);
}
function unifiedNodePosition(mapKey, nodeId, index) {
  if (String(mapKey || '').startsWith('px-')) return poxiaoNodePosition(mapKey, nodeId, index);
  return nodePosition(mapKey, nodeId, index);
}
// 寒门角色支持的武术值（与 characterDefinitions 解耦，default 模式下用）
const HANMEN_MARTIAL = { 'xiu-jing': 4, 'xuan-xuan': 5 };
const DEFINITIONS_VERSION = String(process.env.GAME_RESOURCE_VERSION || '20260802-domain-v1');
const DEFAULT_XIEJIAN_MAP = 'xj-jingyuan';
const DEFAULT_POXIAO_MAP = 'px-d-city';
const ITEM_DATA_VERSION = 2;
const MAP_SOURCE_NAMES = {
  'xj-jingyuan': '静远书院',
  'xj-daohua': '道华观',
  'xj-tianxing': '天行教',
  'xj-danxi': '丹溪谷',
  'xj-buhuan': '不还门',
  'xj-taozhi': '桃止门',
  'xj-dongjia': '东嘉沈府',
  'xj-ren': '任府',
  'xj-capital': '京城翰林院',
  'xj-forgetfulness': '忘川',
  'xj-border': '边陲小镇',
  'px-d-city': 'D市总览',
  'px-stella': 'STELLA画廊',
  'px-seafood': '海鲜市场-冷库-生石灰厂',
  'px-police': '公安大学',
  'px-village': '西南边陲小村',
  'px-docks': '郊区厂房-码头'
};
const NODE_SOURCE_NAMES = {
  disciple_rooms: '弟子厢房',
  main_hall: '正殿',
  teacher_rooms: '先生住处',
  library: '藏书阁',
  kitchen: '膳房',
  wish_river: '许愿河',
  pavilion: '亭中',
  masked_room: '面具人厢房',
  practice: '练功场',
  crane_yard: '鹤院',
  tailor_cottage: '裁衣小筑',
  crane_court: '鹤庭',
  memorial: '祭台',
  alchemy: '丹房',
  leader_hall: '教主殿',
  guardian_hall: '护法殿',
  secret_room: '密室',
  herb_field_upper: '药田',
  medicine_room: '药房',
  master_room: '门主厢房',
  zhengqi_hall: '正气堂',
  laboratory: '毒室',
  poison_garden: '毒花园',
  pigeon_loft: '信鸽楼',
  study: '书房',
  armory: '兵器库',
  mother_court: '母亲院落',
  ancestral: '祠堂',
  hanlin: '翰林院',
  lantern_bridge: '上元灯会',
  lantern_river_south: '灯河',
  memory_left: '旧忆左岸',
  memory_right: '旧忆右岸',
  mengpo: '孟婆汤铺',
  choice_square: '轮回台',
  childhood_home: '姐妹旧居'
};

const SYSTEM_MAILBOXES = [
  ['mailbox-brenuo', '布勒诺信笺', 'BRN2A7'], ['mailbox-daliang', '大梁信笺', 'DLG3B8'],
  ['mailbox-tianzhu', '天竺信笺', 'TZH4C9'], ['mailbox-rugu', '如故信笺', 'RUG5D2'],
  ['mailbox-taozhi', '桃止信笺', 'TAZ6E3'], ['mailbox-zhaixing', '摘星信笺', 'ZHX7F4'],
  ['mailbox-xiaowangzi', '小王子信笺', 'XWZ8G5'], ['mailbox-xiejian', '挟剑惊风', 'XJJ9H6'],
  ['mailbox-poxiao', '破晓世界', 'PX2026'],
  ['mailbox-hanmen-duet', '寒门信笺', 'HNM2J7']
];
const MAILBOX_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

fs.mkdirSync(MEDIA_DIR, { recursive: true });

function emptyState() {
  return {
    accounts: {},
    profiles: {},
    roleBindings: {},
    worldProfiles: {},
    worldRoleBindings: {},
    letters: {},
    mailboxes: {},
    mailboxCodes: {},
    itemInstances: {},
    inventories: {},
    combatProfiles: {},
    itemRespawns: [],
    worldSeedVersion: 0,
    poxiaoSeedVersion: 0,
    itemDataVersion: 0
  };
}

function loadState() {
  try {
    const parsed = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    return {
      ...emptyState(),
      ...parsed,
      accounts: parsed.accounts || {},
      profiles: parsed.profiles || {},
      roleBindings: parsed.roleBindings || {},
      worldProfiles: parsed.worldProfiles || {},
      worldRoleBindings: parsed.worldRoleBindings || {},
      letters: parsed.letters || {},
      mailboxes: parsed.mailboxes || {},
      mailboxCodes: parsed.mailboxCodes || {},
      itemInstances: parsed.itemInstances || {},
      inventories: parsed.inventories || {},
      combatProfiles: parsed.combatProfiles || {},
      itemRespawns: parsed.itemRespawns || [],
      worldSeedVersion: Number(parsed.worldSeedVersion) || 0,
      poxiaoSeedVersion: Number(parsed.poxiaoSeedVersion) || 0,
      itemDataVersion: Number(parsed.itemDataVersion) || 0
    };
  } catch (_) {
    return emptyState();
  }
}

let persistentState = loadState();

// saveState 防抖状态（内存态实时生效，落盘延迟批量 + 退出前 flush）
let _stateDirty = false;
let _stateTimer = null;
process.on('exit', () => {
  if (_stateDirty) {
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
      const tempFile = `${STATE_FILE}.tmp`;
      fs.writeFileSync(tempFile, JSON.stringify(persistentState, null, 2), 'utf8');
      fs.renameSync(tempFile, STATE_FILE);
    } catch (_) {}
  }
});

function normalizeMailboxCode(value) {
  return String(value || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);
}

function generateLocalMailboxCode() {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    let code = '';
    for (let i = 0; i < 6; i += 1) code += MAILBOX_CODE_ALPHABET[(Math.random() * MAILBOX_CODE_ALPHABET.length) | 0];
    if (!persistentState.mailboxCodes[code]) return code;
  }
  return `MB${Date.now().toString(36).toUpperCase().slice(-8)}`;
}

function normalizeMailboxRecord(input = {}, ownerAccountKey = '') {
  const id = String(input.id || `mailbox-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`).slice(0, 160);
  const existing = persistentState.mailboxes[id] || {};
  const requestedCode = normalizeMailboxCode(input.mailboxCode || input.joinCode || input.code);
  const mailboxCode = requestedCode || existing.mailboxCode || generateLocalMailboxCode();
  const owner = normalizeAccountKey(input.ownerAccountKey || ownerAccountKey || existing.ownerAccountKey);
  const members = new Set([...(existing.memberAccountKeys || []), ...(input.memberAccountKeys || []), owner].filter(Boolean).map(normalizeAccountKey));
  return {
    ...existing, ...input, id,
    name: String(input.name || existing.name || '未命名信箱').slice(0, 120),
    desc: String(input.desc || existing.desc || '').slice(0, 500),
    mailboxCode, joinCode: mailboxCode, code: mailboxCode,
    ownerAccountKey: owner,
    memberAccountKeys: [...members],
    visibility: input.visibility === 'private' ? 'private' : (existing.visibility || 'public'),
    isCustom: input.isCustom !== false,
    createdAt: existing.createdAt || Date.now(), updatedAt: Date.now()
  };
}

function upsertLocalMailbox(input, ownerAccountKey = '') {
  const mailbox = normalizeMailboxRecord(input, ownerAccountKey);
  const occupiedId = persistentState.mailboxCodes[mailbox.mailboxCode];
  if (occupiedId && occupiedId !== mailbox.id) return { error: '信箱号已被使用' };
  persistentState.mailboxes[mailbox.id] = mailbox;
  persistentState.mailboxCodes[mailbox.mailboxCode] = mailbox.id;
  return mailbox;
}

function seedSystemMailboxes() {
  SYSTEM_MAILBOXES.forEach(([id, name, mailboxCode]) => {
    upsertLocalMailbox({ id, name, mailboxCode, isCustom: false, visibility: 'public' });
  });
}

async function seedSystemMailboxCodesToMysql() {
  if (!isMysqlEnabled()) return;
  const { query } = require('./mysqlClient');
  let imported = 0;
  for (const [id, name, mailboxCode] of SYSTEM_MAILBOXES) {
    try {
      // 1. 确保 mailbox_codes 表有索引条目
      const codeRows = await query('SELECT mailboxId FROM mailbox_codes WHERE code = ? LIMIT 1', [mailboxCode]);
      if (!codeRows || codeRows.length === 0) {
        await query(
          'INSERT INTO mailbox_codes (code, mailboxId, createdBy, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)',
          [mailboxCode, id, 'system', Date.now(), Date.now()]
        );
      } else if (!codeRows[0].mailboxId) {
        await query('UPDATE mailbox_codes SET mailboxId = ?, updatedAt = ? WHERE code = ?', [id, Date.now(), mailboxCode]);
      }
      // 2. 确保 mailboxes 表有记录（如果缺失则插入，已有则跳过）
      const mbRows = await query('SELECT id FROM mailboxes WHERE id = ? LIMIT 1', [id]);
      if (!mbRows || mbRows.length === 0) {
        await query(
          `INSERT INTO mailboxes (id, name, \`desc\`, icon, themeColor, mapBackground, isCustom, visibility, mailboxCode, ownerAccountKey, memberAccountKeys, createdAt, updatedAt)
           VALUES (?, ?, '', '📮', '#667eea', '', 0, 'public', ?, '', '[]', ?, ?)`,
          [id, name, mailboxCode, Date.now(), Date.now()]
        );
        imported++;
      }
    } catch (e) {
      console.warn(`[bootstrap] seed mailbox ${mailboxCode} (${id}) failed:`, e?.message || e);
    }
  }
  if (imported > 0) console.log(`[bootstrap] MySQL system mailbox seed: ${imported} new mailbox(es) inserted`);
}

function migrateLegacyCharacterIds() {
  const legacy = 'jiang-haian';
  const canonical = 'jiang-huaian';
  for (const profile of Object.values(persistentState.profiles || {})) {
    if (profile?.xiejianCharacterId === legacy) profile.xiejianCharacterId = canonical;
  }
  if (persistentState.roleBindings?.[legacy] && !persistentState.roleBindings[canonical]) {
    persistentState.roleBindings[canonical] = persistentState.roleBindings[legacy];
  }
  if (persistentState.roleBindings) delete persistentState.roleBindings[legacy];
  for (const worldProfiles of Object.values(persistentState.worldProfiles || {})) {
    for (const profile of Object.values(worldProfiles || {})) {
      if (profile?.xiejianCharacterId === legacy) profile.xiejianCharacterId = canonical;
    }
  }
  for (const bindings of Object.values(persistentState.worldRoleBindings || {})) {
    if (bindings?.[legacy] && !bindings[canonical]) bindings[canonical] = bindings[legacy];
    if (bindings) delete bindings[legacy];
  }
  for (const instance of Object.values(persistentState.itemInstances || {})) {
    if (instance?.origin?.starterCharacterId === legacy) instance.origin.starterCharacterId = canonical;
  }
}

function migrateWorldScopedRoles() {
  const worldId = 'mailbox-xiejian';
  persistentState.worldProfiles[worldId] ||= {};
  persistentState.worldRoleBindings[worldId] ||= {};
  for (const [accountKey, profile] of Object.entries(persistentState.profiles || {})) {
    if (!profile?.xiejianCharacterId) continue;
    persistentState.worldProfiles[worldId][accountKey] ||= {
      xiejianCharacterId: profile.xiejianCharacterId,
      lastXiejianMapKey: profile.lastXiejianMapKey || DEFAULT_XIEJIAN_MAP
    };
  }
  for (const [characterId, accountKey] of Object.entries(persistentState.roleBindings || {})) {
    if (characterId && accountKey && !persistentState.worldRoleBindings[worldId][characterId]) {
      persistentState.worldRoleBindings[worldId][characterId] = accountKey;
    }
  }
}

function findLocalMailboxByCode(code) {
  const normalized = normalizeMailboxCode(code);
  const id = persistentState.mailboxCodes[normalized];
  return id ? persistentState.mailboxes[id] || null : null;
}

function joinLocalMailbox(code, accountKey) {
  const mailbox = findLocalMailboxByCode(code);
  if (!mailbox) return { error: '该信箱号不存在' };
  const key = normalizeAccountKey(accountKey);
  if (!key) return { error: '用户未登录' };
  const members = new Set(mailbox.memberAccountKeys || []);
  members.add(key);
  mailbox.memberAccountKeys = [...members];
  mailbox.updatedAt = Date.now();
  return mailbox;
}

seedSystemMailboxes();
migrateLegacyCharacterIds();
migrateWorldScopedRoles();

function createItemInstance(instanceId, definitionId, location) {
  const definition = ALL_ITEM_DEFINITIONS[definitionId];
  if (!definition) return null;
  return {
    instanceId,
    definitionId,
    locationType: location.locationType || 'world',
    mapKey: location.mapKey || '',
    nodeId: location.nodeId || '',
    nx: Number(location.nx) || 0,
    ny: Number(location.ny) || 0,
    ownerAccountKey: location.ownerAccountKey || '',
    equippedSlot: location.equippedSlot || '',
    origin: location.origin || null,
    acquisition: location.acquisition || null,
    escrowLetterId: location.escrowLetterId || '',
    pendingOwnerAccountKey: location.pendingOwnerAccountKey || '',
    spawnedAt: Date.now(),
    generation: Number(location.generation) || 1
  };
}

function ensureWorldSeed() {
  if (persistentState.worldSeedVersion >= 1) return;
  const itemsToSave = [];
  for (const [mapKey, nodeId, definitionId, rawCount] of placements) {
    const count = Number(rawCount) || 1;
    for (let index = 0; index < count; index += 1) {
      const instanceId = `world:v1:${mapKey}:${definitionId}:${index + 1}`;
      if (persistentState.itemInstances[instanceId]) continue;
      const position = nodePosition(mapKey, nodeId, index);
      const instance = createItemInstance(instanceId, definitionId, {
        locationType: 'world',
        mapKey,
        nodeId,
        ...position,
        origin: { type: 'map', mapKey, nodeId, ...position },
        acquisition: { method: 'world', at: Date.now(), mapKey, nodeId }
      });
      persistentState.itemInstances[instanceId] = instance;
      itemsToSave.push(instance);
    }
  }
  persistentState.worldSeedVersion = 1;
  
  // 同步到 MySQL
  if (isMysqlEnabled() && itemsToSave.length > 0) {
    itemsToSave.forEach(item => {
      mysqlDao.saveItemInstance(item).catch(err => {
        console.warn('[ensureWorldSeed] 保存道具实例到 MySQL 失败:', err?.message || err);
      });
    });
  }
}

function ensurePoxiaoWorldSeed() {
  if (persistentState.poxiaoSeedVersion >= 1) return;
  const itemsToSave = [];
  for (const [mapKey, nodeId, definitionId] of poxiaoPlacements) {
    const instanceId = `world:px:v1:${mapKey}:${definitionId}:1`;
    if (persistentState.itemInstances[instanceId]) continue;
    const position = poxiaoNodePosition(mapKey, nodeId, 0);
    const instance = createItemInstance(instanceId, definitionId, {
      locationType: 'world',
      mapKey,
      nodeId,
      ...position,
      origin: { type: 'map', mapKey, nodeId, ...position },
      acquisition: { method: 'world', at: Date.now(), mapKey, nodeId }
    });
    if (instance) {
      persistentState.itemInstances[instanceId] = instance;
      itemsToSave.push(instance);
    }
  }
  persistentState.poxiaoSeedVersion = 1;
  if (isMysqlEnabled() && itemsToSave.length > 0) {
    itemsToSave.forEach(item => {
      mysqlDao.saveItemInstance(item).catch(err => {
        console.warn('[ensurePoxiaoWorldSeed] 保存道具实例到 MySQL 失败:', err?.message || err);
      });
    });
  }
}

function ensureInventory(accountKey) {
  if (!persistentState.inventories[accountKey]) {
    persistentState.inventories[accountKey] = {
      itemIds: [],
      equipment: { weapon: '', clothing: '', accessory: '' },
      quickSlots: ['', '', '', ''],
      starterGrantVersion: 0,
      pendingCoating: ''
    };
  }
  const inventory = persistentState.inventories[accountKey];
  inventory.itemIds = Array.isArray(inventory.itemIds) ? inventory.itemIds : [];
  inventory.equipment = {
    weapon: '',
    clothing: '',
    accessory: '',
    ...(inventory.equipment || {})
  };
  inventory.quickSlots = Array.isArray(inventory.quickSlots)
    ? inventory.quickSlots.slice(0, 4)
    : ['', '', '', ''];
  while (inventory.quickSlots.length < 4) inventory.quickSlots.push('');
  return inventory;
}

function ensureCombatProfile(accountKey, characterId = '') {
  if (!persistentState.combatProfiles[accountKey]) {
    persistentState.combatProfiles[accountKey] = {
      hp: 100,
      maxHp: 100,
      martial: martialByCharacter[characterId] || poxiaoMartialByCharacter[characterId] || HANMEN_MARTIAL[characterId] || 0,
      baseDefense: 4,
      poisonedUntil: 0,
      nextPoisonTickAt: 0,
      immobilizedUntil: 0,
      invulnerableUntil: 0,
      lastAttackAt: 0,
      goldPlaqueCooldownUntil: 0,
      lastOnlineAt: Date.now()
    };
  }
  const profile = persistentState.combatProfiles[accountKey];
  profile.maxHp = 100;
  profile.hp = Math.max(0, Math.min(100, Number(profile.hp ?? 100)));
  profile.martial = martialByCharacter[characterId] || poxiaoMartialByCharacter[characterId] || HANMEN_MARTIAL[characterId] || Number(profile.martial) || 0;
  profile.baseDefense = 4;
  return profile;
}

function grantStarterItems(accountKey, characterId) {
  const inventory = ensureInventory(accountKey);
  if (!characterId) {
    ensureCombatProfile(accountKey, characterId);
    return;
  }
  // 角色切换时（如从挟剑角色切换到寒门角色）需要重新发放并替换装备
  const characterChanged = inventory.starterCharacterId && inventory.starterCharacterId !== characterId;
  // 从 v1/v2 升级到 v3 时，也需要清空旧 starter 装备（starterCharacterId 可能未记录或装备未替换）
  const upgradingFromOld = inventory.starterGrantVersion < 3;
  if (inventory.starterGrantVersion >= 3 && !characterChanged) {
    ensureCombatProfile(accountKey, characterId);
    return;
  }
  // 合并查询：挟剑 starterItems + 寒门 HANMEN_STARTER_ITEMS
  const list = STARTER_ITEMS_ALL[characterId] || [];
  // 角色切换或旧版本升级时，清空旧 starter 装备槽，让新角色装备能顶上
  if (characterChanged || upgradingFromOld) {
    for (const slot of ['weapon', 'clothing', 'accessory']) {
      const oldId = inventory.equipment[slot];
      if (oldId && String(oldId).startsWith('starter:')) {
        inventory.equipment[slot] = '';
        const oldInst = persistentState.itemInstances[oldId];
        if (oldInst) oldInst.equippedSlot = '';
      }
    }
  }
  for (const definitionId of list) {
    const instanceId = `starter:v2:${accountKey}:${definitionId}`;
    if (!persistentState.itemInstances[instanceId]) {
      persistentState.itemInstances[instanceId] = createItemInstance(instanceId, definitionId, {
        locationType: 'inventory',
        ownerAccountKey: accountKey,
        origin: { type: 'starter', starterCharacterId: characterId },
        acquisition: { method: 'starter', at: Date.now(), starterCharacterId: characterId }
      });
    }
    if (!inventory.itemIds.includes(instanceId)) inventory.itemIds.push(instanceId);
    const slot = ALL_ITEM_DEFINITIONS[definitionId]?.equipmentSlot;
    if (slot && !inventory.equipment[slot]) {
      inventory.equipment[slot] = instanceId;
      persistentState.itemInstances[instanceId].equippedSlot = slot;
    }
  }
  inventory.starterGrantVersion = 3;
  inventory.starterCharacterId = characterId;
  ensureCombatProfile(accountKey, characterId);
  // 同步到 MySQL（物品实例 + 背包），保证跨重启持久化
  if (isMysqlEnabled()) {
    for (const definitionId of list) {
      const instanceId = `starter:v2:${accountKey}:${definitionId}`;
      const inst = persistentState.itemInstances[instanceId];
      if (inst) {
        mysqlDao.saveItemInstance(inst).catch(err => {
          console.warn('[grantStarterItems] 保存初始物品到 MySQL 失败:', err?.message || err);
        });
      }
    }
    // 注意：mysqlDao.saveInventory 读取 inventory.items，而本地结构用 itemIds，需要映射
    mysqlDao.saveInventory(accountKey, {
      items: inventory.itemIds,
      equipment: inventory.equipment,
      quickSlots: inventory.quickSlots,
      starterGrantVersion: inventory.starterGrantVersion,
      starterCharacterId: inventory.starterCharacterId,
      pendingCoating: inventory.pendingCoating
    }).catch(err => {
      console.warn('[grantStarterItems] 保存背包到 MySQL 失败:', err?.message || err);
    });
  }
}

function originLabel(instance) {
  const origin = instance?.origin || {};
  if (origin.starterCharacterId) {
    const characterName = GLOBAL_CHARACTER_NAMES[origin.starterCharacterId] || origin.starterCharacterId;
    return `来自 ${characterName}的初始行囊`;
  }
  if (origin.mapKey) {
    const mapName = MAP_SOURCE_NAMES[origin.mapKey] || origin.mapKey;
    const nodeName = NODE_SOURCE_NAMES[origin.nodeId] || String(origin.nodeId || '').replace(/_/g, ' ');
    return nodeName ? `来自 ${mapName} · ${nodeName}` : `来自 ${mapName}`;
  }
  return '来自 既有物品';
}

function acquisitionLabel(instance) {
  const acquisition = instance?.acquisition || {};
  if (acquisition.method === 'pickup') return '最近由你拾取';
  if (acquisition.method === 'gift') {
    return `最近由 ${acquisition.fromIdentity || acquisition.fromAccountKey || '其他玩家'} 赠送`;
  }
  if (acquisition.method === 'mail') {
    return `随 ${acquisition.fromIdentity || acquisition.fromAccountKey || '其他玩家'} 的信收到`;
  }
  if (acquisition.method === 'starter') return '角色绑定时获得';
  if (acquisition.method === 'world') return '仍在原始地点';
  return '既有物品';
}

function ensureItemMetadata() {
  if (persistentState.itemDataVersion >= ITEM_DATA_VERSION) return;
  for (const instance of Object.values(persistentState.itemInstances)) {
    if (!instance.origin) instance.origin = {};
    if (!instance.origin.type) {
      instance.origin.type = instance.origin.starterCharacterId ? 'starter'
        : instance.origin.mapKey ? 'map' : 'legacy';
    }
    if (!instance.acquisition) {
      if (instance.origin.starterCharacterId) {
        instance.acquisition = {
          method: 'starter',
          at: instance.spawnedAt || Date.now(),
          starterCharacterId: instance.origin.starterCharacterId
        };
      } else if (instance.locationType === 'world') {
        instance.acquisition = {
          method: 'world',
          at: instance.spawnedAt || Date.now(),
          mapKey: instance.origin.mapKey || instance.mapKey,
          nodeId: instance.origin.nodeId || instance.nodeId
        };
      } else if (instance.ownerAccountKey && instance.origin.mapKey) {
        instance.acquisition = {
          method: 'pickup',
          at: instance.spawnedAt || Date.now(),
          mapKey: instance.origin.mapKey,
          nodeId: instance.origin.nodeId
        };
      } else {
        instance.acquisition = { method: 'legacy', at: instance.spawnedAt || Date.now() };
      }
    }
    instance.escrowLetterId = instance.escrowLetterId || '';
    instance.pendingOwnerAccountKey = instance.pendingOwnerAccountKey || '';
  }
  persistentState.itemDataVersion = ITEM_DATA_VERSION;
}

function publicInstance(instance) {
  if (!instance) return null;
  const definition = ALL_ITEM_DEFINITIONS[instance.definitionId];
  if (!definition) return null;
  let position = { x: 0, y: 0 };
  if (instance.locationType === 'world') {
    // 优先使用 origin.nx/ny（节点归一化坐标，历史数据可能 instance.nx/ny 为旧版算法残留）
    // 兼容历史数据：若 nx/ny 是整数（0/1）或与 origin 不一致，以 origin 为准
    const nx = Number(instance.origin?.nx ?? instance.nx);
    const ny = Number(instance.origin?.ny ?? instance.ny);
    position = unifiedWorldPosition(instance.mapKey, nx, ny);
  }
  return {
    ...instance,
    ...position,
    definition,
    originLabel: originLabel(instance),
    acquisitionLabel: acquisitionLabel(instance)
  };
}

function inventoryState(accountKey) {
  const inventory = ensureInventory(accountKey);
  return {
    ...inventory,
    items: inventory.itemIds
      .map(instanceId => publicInstance(persistentState.itemInstances[instanceId]))
      .filter(Boolean),
    combat: combatState(accountKey)
  };
}

// 解析账号当前绑定的角色 ID（优先 mailbox.memberCharacters，其次 account.role，最后 xiejianCharacterId）
function resolveCharacterId(accountKey, mailboxId = '') {
  if (mailboxId) {
    const mailbox = persistentState.mailboxes[mailboxId];
    if (mailbox?.memberCharacters && mailbox.memberCharacters[accountKey]) {
      const raw = mailbox.memberCharacters[accountKey];
      const cid = typeof raw === 'string' ? raw : (raw.characterId || raw.id || '');
      if (cid) return cid;
    }
  }
  const account = persistentState.accounts[accountKey];
  if (account?.role === 'xiu-jing' || account?.role === 'xuan-xuan') return account.role;
  const profile = accountProfile(accountKey);
  return profile.poxiaoCharacterId || profile.xiejianCharacterId || '';
}

function combatState(accountKey) {
  const characterId = resolveCharacterId(accountKey);
  const profile = ensureCombatProfile(accountKey, characterId);
  const inventory = ensureInventory(accountKey);
  let attackBonus = 0;
  let defenseBonus = 0;
  const equipped = {};
  for (const [slot, instanceId] of Object.entries(inventory.equipment)) {
    const instance = persistentState.itemInstances[instanceId];
    const definition = instance && ALL_ITEM_DEFINITIONS[instance.definitionId];
    if (!definition) continue;
    equipped[slot] = { instanceId, definitionId: definition.id, icon: definition.icon, name: definition.name };
    attackBonus += definition.attackBonus || 0;
    defenseBonus += definition.defenseBonus || 0;
  }
  return {
    hp: profile.hp,
    maxHp: 100,
    martial: profile.martial,
    attack: 6 + profile.martial * 2 + attackBonus,
    defense: profile.baseDefense + defenseBonus,
    poisonedUntil: profile.poisonedUntil || 0,
    immobilizedUntil: profile.immobilizedUntil || 0,
    invulnerableUntil: profile.invulnerableUntil || 0,
    pendingCoating: inventory.pendingCoating || '',
    goldPlaqueCooldownUntil: profile.goldPlaqueCooldownUntil || 0,
    equipment: equipped
  };
}

function worldItemsForMap(mapKey) {
  return Object.values(persistentState.itemInstances)
    .filter(instance => instance.locationType === 'world' && instance.mapKey === mapKey)
    .map(publicInstance)
    .filter(Boolean);
}

// ------- 自定义角色/地图定义管理（动态上传，可覆盖/禁用内置定义）--------

// 内存中维护的自定义定义缓存
// 覆盖内置定义时使用 _override=true；禁用内置定义时使用 _disabled=true（墓碑）
const customCharacterDefs = {};
const customMapDefs = {};

function isBuiltinCharacter(id) {
  return !!(characterDefinitions[id] || poxiaoCharacterDefinitions[id]);
}

function isBuiltinMap(key) {
  return !!(mapDefinitions[key] || poxiaoMapDefinitions[key]);
}

function addCustomCharacter(worldCategory, def) {
  if (!def || !def.id) return;
  const builtin = isBuiltinCharacter(def.id);
  customCharacterDefs[def.id] = {
    ...def,
    worldCategory,
    _custom: !builtin,
    _override: builtin
  };
  // 更新全局角色名映射
  if (def.name) GLOBAL_CHARACTER_NAMES[def.id] = def.name;
  // 根据 worldCategory 更新对应的 character set
  if (worldCategory === 'xiejian' || worldCategory === 'jingyuan') {
    if (def.name) XIEJIAN_CHARACTER_NAMES[def.id] = def.name;
    if (!builtin) XIEJIAN_CHARACTERS.add(def.id);
  } else if (worldCategory === 'poxiao') {
    if (def.name) POXIAO_CHARACTER_NAMES[def.id] = def.name;
    if (!builtin) POXIAO_CHARACTERS_SET.add(def.id);
  }
}

function removeCustomCharacter(characterId) {
  const def = customCharacterDefs[characterId];
  delete customCharacterDefs[characterId];
  if (!def) return;
  if (isBuiltinCharacter(characterId)) {
    // 还原内置定义：恢复内置名称映射
    if (characterDefinitions[characterId]) {
      XIEJIAN_CHARACTER_NAMES[characterId] = characterDefinitions[characterId].name;
      if (characterDefinitions[characterId].name) GLOBAL_CHARACTER_NAMES[characterId] = characterDefinitions[characterId].name;
    } else if (poxiaoCharacterDefinitions[characterId]) {
      POXIAO_CHARACTER_NAMES[characterId] = poxiaoCharacterDefinitions[characterId].name;
      if (poxiaoCharacterDefinitions[characterId].name) GLOBAL_CHARACTER_NAMES[characterId] = poxiaoCharacterDefinitions[characterId].name;
    }
    return;
  }
  if (def.worldCategory === 'xiejian' || def.worldCategory === 'jingyuan') {
    XIEJIAN_CHARACTERS.delete(characterId);
    delete XIEJIAN_CHARACTER_NAMES[characterId];
  } else if (def.worldCategory === 'poxiao') {
    POXIAO_CHARACTERS_SET.delete(characterId);
    delete POXIAO_CHARACTER_NAMES[characterId];
  }
  delete GLOBAL_CHARACTER_NAMES[characterId];
}

/** 内存中禁用内置角色（墓碑），会覆盖同 id 的覆盖/自定义定义 */
function disableBuiltinCharacter(characterId) {
  const wc = characterDefinitions[characterId]
    ? (characterDefinitions[characterId].category || 'xiejian')
    : 'poxiao';
  customCharacterDefs[characterId] = { id: characterId, worldCategory: wc, _disabled: true, _builtin: true };
  return wc;
}

function isBuiltinCharacterDisabled(id) {
  return !!(customCharacterDefs[id] && customCharacterDefs[id]._disabled);
}

function addCustomMap(worldCategory, def) {
  if (!def || !def.key) return;
  const builtin = isBuiltinMap(def.key);
  customMapDefs[def.key] = {
    ...def,
    worldCategory,
    _custom: !builtin,
    _override: builtin
  };
  // 更新地图来源名称
  if (def.name) MAP_SOURCE_NAMES[def.key] = def.name;
}

function removeCustomMap(mapKey) {
  delete customMapDefs[mapKey];
  if (mapDefinitions[mapKey]) MAP_SOURCE_NAMES[mapKey] = mapDefinitions[mapKey].name;
  else if (poxiaoMapDefinitions[mapKey]) MAP_SOURCE_NAMES[mapKey] = poxiaoMapDefinitions[mapKey].name;
}

/** 内存中禁用内置地图（墓碑） */
function disableBuiltinMap(mapKey) {
  const wc = mapDefinitions[mapKey] ? 'xiejian' : 'poxiao';
  customMapDefs[mapKey] = { key: mapKey, id: mapKey, worldCategory: wc, _disabled: true, _builtin: true };
  return wc;
}

/** 合并内置定义与自定义定义（覆盖定义顶替内置，禁用定义隐藏内置） */
function getMergedCharacterDefs() {
  const result = { ...characterDefinitions, ...poxiaoCharacterDefinitions };
  for (const [id, def] of Object.entries(customCharacterDefs)) {
    if (def._disabled) delete result[id];
    else result[id] = def;
  }
  return result;
}

function getMergedMapDefs() {
  const result = { ...mapDefinitions, ...poxiaoMapDefinitions };
  for (const [key, def] of Object.entries(customMapDefs)) {
    if (def._disabled) delete result[key];
    else result[key] = def;
  }
  return result;
}

// 启动时从 MySQL 加载自定义定义（含禁用墓碑）
async function loadCustomDefinitions() {
  if (!isMysqlEnabled()) return;
  try {
    const chars = await mysqlDao.listAllCharacterDefinitions();
    for (const row of chars) {
      if (!row.enabled) {
        // 禁用墓碑：仅对内置角色生效，隐藏内置定义
        if (isBuiltinCharacter(row.id)) disableBuiltinCharacter(row.id);
        continue;
      }
      addCustomCharacter(row.worldCategory || 'custom', { ...row.definition, id: row.id });
    }
    console.log(`[custom-defs] 加载了 ${chars.length} 个自定义角色（含禁用墓碑）`);

    const maps = await mysqlDao.listAllMapDefinitions();
    for (const row of maps) {
      if (!row.enabled) {
        if (isBuiltinMap(row.id)) disableBuiltinMap(row.id);
        continue;
      }
      addCustomMap(row.worldCategory || 'custom', { ...row.definition, key: row.id, id: row.id });
    }
    console.log(`[custom-defs] 加载了 ${maps.length} 个自定义地图（含禁用墓碑）`);
  } catch (e) {
    console.warn('[custom-defs] 加载自定义定义失败：', e?.message || e);
  }
}

if (!HTTP_ONLY) {
  ensureWorldSeed();
  ensurePoxiaoWorldSeed();
  for (const [accountKey, profile] of Object.entries(persistentState.profiles)) {
    if (profile?.xiejianCharacterId) grantStarterItems(accountKey, profile.xiejianCharacterId);
  }
  ensureItemMetadata();
  saveState();
}

function saveState() {
  // 防抖批量写：state.json 可能很大（含大信 base64），每次全量 JSON.stringify+写盘会阻塞
  // 事件循环数百毫秒~数秒（发送/保存慢的根因之一）。内存态已实时生效，落盘延迟 2s 批量做；
  // 进程退出前同步 flush 保证不丢。
  _stateDirty = true;
  if (_stateTimer) return;
  _stateTimer = setTimeout(() => {
    _stateTimer = null;
    flushStateNow();
  }, 2000);
}

function flushStateNow() {
  _stateDirty = false;
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    const tempFile = `${STATE_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(persistentState, null, 2), 'utf8');
    fs.renameSync(tempFile, STATE_FILE);
  } catch (e) {
    console.warn('[state] 落盘失败（内存态不受影响）:', e?.message || e);
  }
  // 注：各 API 调用点已做双写（内存 + MySQL），此处不再全量热同步
}

function normalizeAccountKey(value) {
  return String(value || '').trim().toLocaleLowerCase('en-US').slice(0, 80);
}

function envUrlList(name) {
  return String(process.env[name] || '').split(',').map(value => value.trim()).filter(Boolean);
}

// 灰度开关：GAME_ASSET_API=0 时不注入资产 API 源（全链路回退本地静态加载）
function disableAssetApi() {
  return String(process.env.GAME_ASSET_API || '1') === '0';
}

// 资产 API 基址（双端互通：任意端口/设备前端都指向本后端）
function apiAssetBaseUrl(req) {
  if (disableAssetApi()) return '';
  const host = (req && req.headers && req.headers.host) ? String(req.headers.host) : '';
  if (!host) return '';
  const proto = String(req.headers['x-forwarded-proto'] || 'http').split(',')[0].trim();
  return `${proto}://${host}/api/assets/`;
}

function accountProfile(accountKey, worldId = 'mailbox-xiejian') {
  persistentState.worldProfiles[worldId] ||= {};
  if (!persistentState.worldProfiles[worldId][accountKey]) {
    persistentState.worldProfiles[worldId][accountKey] = {
      xiejianCharacterId: '',
      lastXiejianMapKey: DEFAULT_XIEJIAN_MAP,
      poxiaoCharacterId: '',
      lastPoxiaoMapKey: DEFAULT_POXIAO_MAP
    };
  }
  return persistentState.worldProfiles[worldId][accountKey];
}

function roleBindingsForWorld(worldId = 'mailbox-xiejian') {
  persistentState.worldRoleBindings[worldId] ||= {};
  return persistentState.worldRoleBindings[worldId];
}

function syncAccount(input) {
  const accountKey = normalizeAccountKey(input.accountKey || input.username);
  if (!accountKey) return null;
  const existing = persistentState.accounts[accountKey] || {};
  persistentState.accounts[accountKey] = {
    accountKey,
    username: String(input.username || existing.username || accountKey).slice(0, 80),
    displayName: String(input.displayName || existing.displayName || input.username || accountKey).slice(0, 100),
    role: String(input.role || existing.role || 'user').slice(0, 80),
    lastSeenAt: Date.now()
  };
  accountProfile(accountKey);
  return persistentState.accounts[accountKey];
}

function jsonResponse(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

function readJsonBody(req, maxBytes = 55 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', chunk => {
      size += chunk.length;
      if (size > maxBytes) {
        reject(new Error('payload_too_large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      try {
        resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {});
      } catch (_) {
        reject(new Error('invalid_json'));
      }
    });
    req.on('error', reject);
  });
}

function getAccountIdentity(accountKey, mailboxId) {
  const account = persistentState.accounts[accountKey] || {
    accountKey,
    username: accountKey,
    displayName: accountKey,
    role: 'user'
  };
  const profile = accountProfile(accountKey, mailboxId || 'mailbox-xiejian');
  
  // 1. 优先从 mailbox 的 memberCharacters 获取角色
  let characterId = '';
  if (mailboxId) {
    const mailbox = persistentState.mailboxes[mailboxId];
    if (mailbox?.memberCharacters && mailbox.memberCharacters[accountKey]) {
      const raw = mailbox.memberCharacters[accountKey];
      characterId = typeof raw === 'string' ? raw : (raw.characterId || raw.id || '');
    }
  }
  
  // 2. 如果 mailbox 没有，再从 worldProfiles 获取（挟剑/破晓地图）
  if (!characterId && mailboxId === 'mailbox-xiejian' && profile.xiejianCharacterId) {
    characterId = profile.xiejianCharacterId;
  }
  if (!characterId && mailboxId === 'mailbox-poxiao' && profile.poxiaoCharacterId) {
    characterId = profile.poxiaoCharacterId;
  }
  
  // 3. 从 account.role 获取（寒门双主角）
  if (!characterId) {
    if (account.role === 'xiu-jing' || account.role === 'xuan-xuan') {
      characterId = account.role;
    }
  }
  
  // 决定显示名
  let identityName = account.displayName || account.username || accountKey;
  if (characterId && GLOBAL_CHARACTER_NAMES[characterId]) {
    identityName = GLOBAL_CHARACTER_NAMES[characterId];
  } else if (mailboxId === 'mailbox-xiejian' && characterId) {
    identityName = XIEJIAN_CHARACTER_NAMES[characterId] || characterId;
  } else if (mailboxId === 'mailbox-poxiao' && characterId) {
    identityName = POXIAO_CHARACTER_NAMES[characterId] || characterId;
  } else if (mailboxId === 'mailbox-hanmen-duet') {
    if (account.role === 'xiu-jing') identityName = '修璟';
    if (account.role === 'xuan-xuan') identityName = '萱宣';
  }
  
  return {
    accountKey,
    username: account.username,
    displayName: account.displayName,
    role: account.role,
    characterId: characterId || (mailboxId === 'mailbox-xiejian' ? profile.xiejianCharacterId : (mailboxId === 'mailbox-poxiao' ? profile.poxiaoCharacterId : account.role)),
    identityName
  };
}

function getMailboxRecipients(mailboxId, requesterKey) {
  return Object.keys(persistentState.accounts)
    .filter(accountKey => accountKey !== requesterKey)
    .map(accountKey => getAccountIdentity(accountKey, mailboxId))
    .filter(identity => {
      if (mailboxId === 'mailbox-xiejian') return Boolean(identity.characterId);
      if (mailboxId === 'mailbox-poxiao') return Boolean(identity.characterId);
      if (mailboxId === 'mailbox-hanmen-duet') {
        return identity.role === 'xiu-jing' || identity.role === 'xuan-xuan';
      }
      return true;
    })
    .sort((a, b) => a.identityName.localeCompare(b.identityName, 'zh-CN'));
}

function publicLetter(record, accountKey) {
  const direction = record.senderAccountKey === accountKey ? 'sent' : 'inbox';
  return {
    ...record.letter,
    itemAttachmentIds: Array.isArray(record.letter?.itemAttachmentIds)
      ? record.letter.itemAttachmentIds.slice(0, 8)
      : [],
    itemAttachments: Array.isArray(record.itemAttachments)
      ? record.itemAttachments.map(item => ({ ...item }))
      : [],
    id: record.id,
    mailboxId: record.mailboxId,
    senderAccountKey: record.senderAccountKey,
    recipientAccountKey: record.recipientAccountKey,
    senderIdentity: record.senderIdentity,
    recipientIdentity: record.recipientIdentity,
    deliveryStatus: record.deliveryStatus,
    sentAt: record.sentAt,
    readAt: record.readAt || null,
    clientMessageId: record.clientMessageId,
    direction,
    isUnread: direction === 'inbox' && !record.readAt,
    status: direction === 'sent' ? 'sent' : 'received',
    serverLetter: true
  };
}

function normalizeAttachmentIds(value) {
  if (!Array.isArray(value)) return [];
  return value.map(id => String(id || '').slice(0, 180)).filter(Boolean).slice(0, 9);
}

function attachmentSnapshot(instance, status = 'escrow') {
  const definition = ALL_ITEM_DEFINITIONS[instance.definitionId];
  return {
    instanceId: instance.instanceId,
    definitionId: instance.definitionId,
    name: definition?.name || instance.definitionId,
    icon: definition?.icon || '',
    description: definition?.description || '',
    originLabel: originLabel(instance),
    acquisitionLabel: acquisitionLabel(instance),
    status,
    escrowedAt: status === 'escrow' ? Date.now() : null,
    receivedAt: status === 'received' ? Date.now() : null
  };
}

function validateMailAttachments(accountKey, rawIds) {
  const ids = normalizeAttachmentIds(rawIds);
  if (ids.length > 8) return { error: 'item_attachment_limit' };
  if (new Set(ids).size !== ids.length) return { error: 'item_attachment_duplicate' };
  const inventory = ensureInventory(accountKey);
  const instances = [];
  for (const instanceId of ids) {
    const instance = persistentState.itemInstances[instanceId];
    if (!instance || instance.locationType !== 'inventory' ||
        instance.ownerAccountKey !== accountKey || !inventory.itemIds.includes(instanceId)) {
      return { error: 'item_attachment_invalid', instanceId };
    }
    if (instance.equippedSlot || Object.values(inventory.equipment).includes(instanceId)) {
      return { error: 'item_attachment_equipped', instanceId };
    }
    instances.push(instance);
  }
  return { ids, instances, inventory };
}

function notifyInventoryForAccount(accountKey) {
  const session = activeAccounts.get(accountKey);
  if (session?.ws) sendInventory(session.ws, accountKey);
}

// ─── 资源包上传处理（multipart zip） ───

function handlePackageUpload(req, res) {
  return new Promise((resolve) => {
    const busboy = Busboy({ headers: req.headers, limits: { fileSize: 200 * 1024 * 1024 } });
    const fields = {};
    let zipPath = null;
    let tempDir = null;
    let hasError = false;
    let fileWriteDone = false;

    busboy.on('field', (name, val) => {
      fields[name] = val;
    });

    busboy.on('file', (fieldname, fileStream, info) => {
      const { filename, mimeType } = info;
      if (!filename || !/\.zip$/i.test(filename)) {
        hasError = true;
        fileStream.resume();
        jsonResponse(res, 400, { error: '只接受 .zip 文件' });
        return;
      }
      tempDir = path.join(os.tmpdir(), `pkg-upload-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
      fs.mkdirSync(tempDir, { recursive: true });
      zipPath = path.join(tempDir, 'upload.zip');
      const writeStream = fs.createWriteStream(zipPath);
      fileStream.pipe(writeStream);
      writeStream.on('finish', () => {
        fileWriteDone = true;
      });
      writeStream.on('error', (err) => {
        hasError = true;
        fileWriteDone = true;
        jsonResponse(res, 500, { error: `写入文件失败: ${err.message}` });
      });
    });

    busboy.on('finish', async () => {
      // 等待文件写入完成
      await new Promise((r) => {
        const check = () => {
          if (fileWriteDone || hasError) return r();
          setTimeout(check, 50);
        };
        check();
      });

      if (hasError || !zipPath) {
        if (!hasError) jsonResponse(res, 400, { error: '未上传文件' });
        if (tempDir) try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (_) {}
        resolve(true);
        return;
      }

      // 确认文件已写入
      if (!fs.existsSync(zipPath) || fs.statSync(zipPath).size === 0) {
        jsonResponse(res, 400, { error: '上传文件为空' });
        if (tempDir) try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (_) {}
        resolve(true);
        return;
      }

      try {
        const worldCategory = fields.worldCategory || 'poxiao';
        const metadata = {
          sect: fields.sect || '',
          martial: parseInt(fields.martial) || 5,
          description: fields.description || '',
        };
        const useAI = fields.useAI === '1' || fields.useAI === 'true';
        const apiKey = process.env.AGNES_AI_API_KEY || '';

        console.log('[upload] zip size:', fs.statSync(zipPath).size, 'bytes, useAI:', useAI);

        const result = await packageGen.processPackage(zipPath, worldCategory, metadata, {
          useAI,
          apiKey,
        });

        // 保存到 MySQL
        const savedChars = [];
        const savedMaps = [];
        for (const [id, def] of Object.entries(result.characters)) {
          await mysqlDao.saveCharacterDefinition(worldCategory, def);
          savedChars.push(id);
        }
        for (const [key, def] of Object.entries(result.maps)) {
          await mysqlDao.saveMapDefinition(worldCategory, def);
          savedMaps.push(key);
        }

        // 更新内存（走统一入口，识别覆盖内置定义）
        for (const [id, def] of Object.entries(result.characters)) {
          addCustomCharacter(worldCategory, { ...def, id });
        }
        for (const [key, def] of Object.entries(result.maps)) {
          addCustomMap(worldCategory, { ...def, key, id: key });
        }

        // 清理临时文件
        if (tempDir) try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (_) {}

        // 双端互通：资源包复制到磁盘的每个资产同时入库 MySQL + 写缓存
        try {
          const copied = Array.isArray(result.copyResults) ? result.copyResults : [];
          let assetCount = 0;
          for (const c of copied) {
            const dest = String(c.dest || c.target || c.path || '');
            if (!dest) continue;
            const rel = path.relative(ROOT_DIR, dest).replace(/\\/g, '/');
            if (!rel || rel.startsWith('..')) continue;
            let buf = null;
            try {
              if (c.buffer) buf = Buffer.isBuffer(c.buffer) ? c.buffer : Buffer.from(c.buffer);
              else if (fs.existsSync(dest)) buf = fs.readFileSync(dest);
            } catch (_) {}
            if (!buf) continue;
            const cat = rel.includes('poxiao') ? 'poxiao'
              : rel.includes('xiejian') ? 'xiejian'
              : String(worldCategory || 'game');
            await assetStore.putAsset(rel, '', buf, cat);
            assetCount++;
          }
          if (assetCount > 0) console.log(`[upload] 资源包资产已入库 ${assetCount} 个（MySQL + 缓存）`);
        } catch (e) {
          console.warn('[upload] 资源包资产入库失败（磁盘文件已复制）:', e?.message || e);
        }

        // 广播更新
        broadcastAdmin({ type: 'packages_updated', packageType: result.packageType, characters: savedChars, maps: savedMaps });

        jsonResponse(res, 200, {
          success: true,
          packageType: result.packageType,
          generated: {
            characters: result.characterCount,
            maps: result.mapCount,
          },
          saved: { characters: savedChars, maps: savedMaps },
          copyResults: result.copyResults,
          warnings: result.warnings,
          aiAnalysis: result.aiAnalysis,
          fileTreeSummary: result.fileTreeSummary,
        });
      } catch (err) {
        if (tempDir) try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (_) {}
        jsonResponse(res, 500, { error: `处理失败: ${err.message}` });
      }
      resolve(true);
    });

    busboy.on('error', (err) => {
      if (tempDir) try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (_) {}
      jsonResponse(res, 400, { error: `解析上传数据失败: ${err.message}` });
      resolve(true);
    });

    req.pipe(busboy);
  });
}

async function handleApi(req, res, parsedUrl) {
  // 管理后台页面
  if (parsedUrl.pathname === '/admin' || parsedUrl.pathname === '/admin/') {
    const adminHtml = path.join(__dirname, 'admin.html');
    if (fs.existsSync(adminHtml)) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(fs.readFileSync(adminHtml, 'utf8'));
    } else {
      res.writeHead(404);
      res.end('Admin page not found');
    }
    return true;
  }

  if (!parsedUrl.pathname.startsWith('/api/')) return false;

  try {
    // ======== 资源持久化：bootstrap 配置 ========
    if (req.method === 'GET' && parsedUrl.pathname === '/api/resources/bootstrap') {
      jsonResponse(res, 200, {
        resourceVersion: DEFINITIONS_VERSION,
        cacheVersion: DEFINITIONS_VERSION,
        // 远端 CDN / 备用服务器地址（按优先级排列）
        remoteBaseUrls: envUrlList('RESOURCE_REMOTE_BASE_URLS'),
        assetBaseUrls: envUrlList('RESOURCE_REMOTE_BASE_URLS'),
        remoteAssetApiBase: apiAssetBaseUrl(req),
        localBaseUrl: './',
        maxRetries: 3,
        enableCache: true,
      });
      return true;
    }

    // ======== AI：信件旅程文案生成（预期抵达 / 中途经历 / 结语） ========
    if (req.method === 'POST' && parsedUrl.pathname === '/api/ai/generate-journey') {
      const aiKey = process.env.AGNES_CARRIER_API_KEY || process.env.AGNES_AI_API_KEY || '';
      if (!aiKey) { jsonResponse(res, 503, { error: 'ai_not_configured', fallback: true }); return true; }
      let body = {};
      try { body = await readJsonBody(req, 1024 * 64); } catch (_) { jsonResponse(res, 400, { error: 'invalid_json', fallback: true }); return true; }
      const carrier = body.carrier || {};
      const letter = body.letter || {};
      const sys = '你是一位书信旅程叙事师。你会为「万物送信」系统撰写诗意的旅程文案。' +
        '必须返回严格有效的 JSON，不要包含任何 markdown 代码块标记、注释或多余说明。JSON 结构如下：' +
        '{"expectedDelivery":"...","events":[{"type":"...","description":"..."}],"epilogue":"..."}。' +
        'expectedDelivery 是诗意模糊的送达时间，必须专门根据该信使的 baseSpeed / lifespan / timeSense 属性生成，严禁与信使属性无关的通用文案。参考映射：' +
        'baseSpeed >= 0.8（极快）→ "茶未凉便至""晨光未散即到""一炷香内"；' +
        'baseSpeed 0.5~0.8（快）→ "半日之内""明日前""月出之时"；' +
        'baseSpeed 0.2~0.5（中）→ "数日之后""等一场雨后""下弦月前"；' +
        'baseSpeed <= 0.2（慢）→ "数载之后""等一场梅雨落尽""长路尽头"；' +
        'timeSense=dilated（慢感知）→ 如"蚂蚁的一生""河水从源头到入海"类长周期；' +
        'timeSense=compressed（快感知）→ 如"光年之外的回音""仿佛一瞬"类瞬时感。' +
        '每次生成的 expectedDelivery 要与该信使一致且每次不同。' +
        'events 是 8~12 个旅途中的际遇描述，type 只能是 departure、environment、encounter、serendipity、lineage、transfer、delivery 之一，' +
        '描述要生动、有画面感，并呼应信使的属性（速度、寿命、捕食关系、栖息地）与寄收信人；' +
        'epilogue 是一句凝练的旅程结语。';
      const carrierBrief = JSON.stringify({
        id: carrier.id || '', name: carrier.name || '', category: carrier.category || '',
        baseSpeed: typeof carrier.baseSpeed === 'number' ? carrier.baseSpeed : null,   // 0~1 相对速度
        lifespan: typeof carrier.lifespan === 'number' ? carrier.lifespan : null,     // 相对寿命
        timeSense: carrier.timeSense || '',          // dilated 慢感知 / normal / compressed 快感知
        envPreference: Array.isArray(carrier.envPreference) ? carrier.envPreference : [],
        predators: Array.isArray(carrier.predators) ? carrier.predators : [],
        reproductionRate: typeof carrier.reproductionRate === 'number' ? carrier.reproductionRate : null,
        predationRate: typeof carrier.predationRate === 'number' ? carrier.predationRate : null,
        lore: (carrier.lore || '').slice(0, 120),
      });
      const user = `所选信使：${carrierBrief}\n` +
        `信件：寄信人 ${letter.sender || '(未知)'}，收信人 ${letter.recipient || '(未知)'}，标题 ${letter.title || '(无题)'}\n` +
        `要求：expectedDelivery 用诗意模糊时间，参考 baseSpeed 越高送达越快、lifespan 越大寿命越长、timeSense 决定时间感知节奏，写一句贴合该信使的文案；事件要随机、每次不同，覆盖启程与送达。`;
      try {
        const text = await callAgnesAI(aiKey, [{ role: 'system', content: sys }, { role: 'user', content: user }], 1800, 0.9);
        // 模型可能返回 markdown 代码块或前后说明，剥离后取第一个 JSON 对象
        let ai = null;
        const raw = String(text || '').replace(/```(?:json)?/gi, '').trim();
        const js = raw.indexOf('{');
        const je = raw.lastIndexOf('}');
        if (js >= 0 && je > js) {
          try { ai = JSON.parse(raw.slice(js, je + 1)); } catch (_) { ai = null; }
        }
        if (!ai) throw new Error('AI 未返回有效 JSON');
        const events = Array.isArray(ai.events)
          ? ai.events.filter(e => e && typeof e.description === 'string' &&
              /^(departure|environment|encounter|serendipity|lineage|transfer|delivery)$/.test(e.type || '')).slice(0, 20)
          : [];
        jsonResponse(res, 200, {
          expectedDelivery: typeof ai.expectedDelivery === 'string' ? ai.expectedDelivery.slice(0, 60) : '',
          events,
          epilogue: typeof ai.epilogue === 'string' ? ai.epilogue.slice(0, 120) : '',
        });
      } catch (e) {
        jsonResponse(res, 502, { error: 'ai_failed', fallback: true, detail: String(e.message || e).slice(0, 200) });
      }
      return true;
    }

    // ======== AI：书信正文润色（选中的一段文字 → 优化版） ========
    if (req.method === 'POST' && parsedUrl.pathname === '/api/ai/polish-text') {
      const aiKey = process.env.AGNES_AI_API_KEY || '';
      if (!aiKey) { jsonResponse(res, 503, { error: 'ai_not_configured' }); return true; }
      let body = {};
      try { body = await readJsonBody(req, 1024 * 64); } catch (_) { jsonResponse(res, 400, { error: 'invalid_json' }); return true; }
      const text = String(body.text || '').trim();
      if (!text) { jsonResponse(res, 400, { error: 'empty_text' }); return true; }
      const letter = body.letter || {};
      const sys = '你是一位中文书信润色师，服务于「信笺」书信应用。' +
        '用户会给你一段信件文字，请在不改变原意、不改变事实、不增减段落结构的前提下润色语言表达：' +
        '让文字更生动、更有书信的温度与画面感，贴合寄信人与收信人的关系以及信件标题的氛围。' +
        '保留原有的换行与段落（用 \\n 分隔），保留标点习惯但不输出多余符号。' +
        '只返回润色后的纯文本本身，不要任何 markdown 标记、代码块、JSON 包装、说明或引号。';
      const user = `寄信人：${letter.sender || '(未知)'}；收信人：${letter.recipient || '(未知)'}；信件标题：${letter.title || letter.letterTitle || '(无题)'}\n` +
        `请润色以下信件文字（保持段落结构）：\n${text}`;
      try {
        const out = await callAgnesAI(aiKey, [{ role: 'system', content: sys }, { role: 'user', content: user }], 1500, 0.8);
        const cleaned = String(out || '').trim()
          .replace(/^```(?:text|txt)?/i, '')
          .replace(/```\s*$/, '')
          .trim()
          .slice(0, 2000);
        if (!cleaned) throw new Error('AI 返回空文本');
        jsonResponse(res, 200, { text: cleaned });
      } catch (e) {
        jsonResponse(res, 502, { error: 'ai_failed', detail: String(e.message || e).slice(0, 200) });
      }
      return true;
    }

    // ======== 信使档案（万物送信：内置 + xinshi 扩展，来自 MySQL） ========
    if (req.method === 'GET' && parsedUrl.pathname === '/api/carriers') {
      let carriers = [];
      try {
        carriers = await mysqlDao.listAllCarrierDefinitions();
      } catch (_) { carriers = []; }
      // 内置 + MySQL 合并：内置缺失时用内置默认，内置被禁用（enabled=0 墓碑）则隐藏
      const byId = new Map((carriers || []).map(r => [r.id, r]));
      const out = [];
      for (const builtin of (carrierSeed.BUILTIN_CARRIERS || [])) {
        const row = byId.get(builtin.id);
        if (row && !row.enabled) continue; // 已禁用
        if (row) out.push({ ...row.definition, id: row.id, name: row.name, category: row.category });
        else out.push({ ...builtin });
      }
      for (const row of (carriers || [])) {
        if (!row.enabled) continue;
        if (isBuiltinCarrier(row.id)) continue; // 已作为内置处理
        out.push({ ...row.definition, id: row.id, name: row.name, category: row.category });
      }
      carriers = out;
      if (!carriers || !carriers.length) {
        jsonResponse(res, 200, { version: 2, source: 'local', carriers: [] });
        return true;
      }
      // 图片相对路径 → 完整资产 API URL（MySQL 主存，经 /api/assets 读取）
      const apiBase = apiAssetBaseUrl(req);
      carriers = carriers.map(c => {
        const d = { ...c };
        if (apiBase && d.small) d.small = apiBase + String(d.small).replace(/^\/+/, '');
        if (apiBase && d.large) d.large = apiBase + String(d.large).replace(/^\/+/, '');
        if (apiBase && d.trace) d.trace = apiBase + String(d.trace).replace(/^\/+/, '');
        return d;
      });
      jsonResponse(res, 200, { version: 2, source: 'mysql', carriers });
      return true;
    }

    // ===== 信使管理（后台 CRUD）=====

    // 全量列表：内置 + 自定义合并去重，禁用墓碑隐藏，图片 URL 重写
    if (req.method === 'GET' && parsedUrl.pathname === '/api/admin/carriers') {
      let rows = [];
      try { rows = await mysqlDao.listAllCarrierDefinitions(); } catch (_) { rows = []; }
      const byId = new Map((rows || []).map(r => [r.id, r]));
      const out = [];
      // 内置信使：被覆盖则展示覆盖定义，被禁用则隐藏
      for (const builtin of (carrierSeed.BUILTIN_CARRIERS || [])) {
        const row = byId.get(builtin.id);
        if (row && !row.enabled) continue; // 已禁用
        if (row) {
          out.push({ ...row.definition, id: row.id, name: row.name, category: row.category, _builtin: true, _modified: true, enabled: true });
        } else {
          out.push({ ...builtin, enabled: true, _builtin: true });
        }
      }
      // 自定义信使（非内置 id）
      for (const row of (rows || [])) {
        if (!row.enabled) continue;
        if (isBuiltinCarrier(row.id)) continue;
        out.push({ ...row.definition, id: row.id, name: row.name, category: row.category, _custom: true, enabled: true });
      }
      // 图片相对路径 → 完整资产 API URL
      const apiBase = apiAssetBaseUrl(req);
      if (apiBase) {
        for (const c of out) {
          if (c.small) c.small = apiBase + String(c.small).replace(/^\/+/, '');
          if (c.large) c.large = apiBase + String(c.large).replace(/^\/+/, '');
          if (c.trace) c.trace = apiBase + String(c.trace).replace(/^\/+/, '');
        }
      }
      jsonResponse(res, 200, { success: true, carriers: out });
      return true;
    }

    // 新建/编辑信使（UPSERT，同 id 覆盖）
    if (req.method === 'POST' && parsedUrl.pathname === '/api/admin/carriers') {
      const body = await readJsonBody(req);
      const definition = body.definition || {};
      if (!definition || !definition.id) {
        jsonResponse(res, 400, { error: 'definition（含 id）必填' });
        return true;
      }
      if (!definition.name) definition.name = definition.id;
      const result = await mysqlDao.saveCarrierDefinition(definition);
      if (!result) {
        jsonResponse(res, 500, { success: false, message: '保存信使定义失败（可能 MySQL 未启用）' });
        return true;
      }
      broadcastAdmin({ type: 'carrier_updated', carrierId: definition.id, action: 'saved', timestamp: Date.now() });
      jsonResponse(res, 200, { success: true, carrier: definition, isBuiltin: isBuiltinCarrier(definition.id) });
      return true;
    }

    // 删除信使定义（内置 → 软删除禁用；自定义 → 硬删除）
    const carrierDeleteMatch = parsedUrl.pathname.match(/^\/api\/admin\/carriers\/([^/]+)\/delete$/);
    if (req.method === 'POST' && carrierDeleteMatch) {
      const carrierId = decodeURIComponent(carrierDeleteMatch[1]);
      if (!carrierId) { jsonResponse(res, 400, { error: 'missing_id' }); return true; }
      if (isBuiltinCarrier(carrierId)) {
        const builtin = (carrierSeed.BUILTIN_CARRIERS || []).find(c => c.id === carrierId);
        const result = await mysqlDao.disableCarrierDefinition(carrierId, (builtin && builtin.name) || carrierId);
        if (!result) {
          jsonResponse(res, 500, { success: false, message: '禁用内置信使失败（可能 MySQL 未启用）' });
          return true;
        }
        broadcastAdmin({ type: 'carrier_updated', carrierId, action: 'disabled', timestamp: Date.now() });
        jsonResponse(res, 200, { success: true, carrierId, action: 'disabled', builtin: true });
        return true;
      }
      const result = await mysqlDao.deleteCarrierDefinition(carrierId);
      broadcastAdmin({ type: 'carrier_updated', carrierId, action: 'deleted', timestamp: Date.now() });
      jsonResponse(res, 200, { success: !!result, carrierId, action: 'deleted' });
      return true;
    }

    // 还原信使定义（删除墓碑/覆盖记录，内置恢复默认 / 自定义移除）
    const carrierRestoreMatch = parsedUrl.pathname.match(/^\/api\/admin\/carriers\/([^/]+)\/restore$/);
    if (req.method === 'POST' && carrierRestoreMatch) {
      const carrierId = decodeURIComponent(carrierRestoreMatch[1]);
      if (!carrierId) { jsonResponse(res, 400, { error: 'missing_id' }); return true; }
      const result = await mysqlDao.deleteCarrierDefinition(carrierId);
      broadcastAdmin({ type: 'carrier_updated', carrierId, action: 'restored', timestamp: Date.now() });
      jsonResponse(res, 200, { success: !!result, carrierId, action: 'restored', builtin: isBuiltinCarrier(carrierId) });
      return true;
    }

    if (req.method === 'GET' && parsedUrl.pathname === '/api/game/bootstrap') {
      jsonResponse(res, 200, {
        resourceVersion: DEFINITIONS_VERSION,
        characterDefinitions: getMergedCharacterDefs(),
        mapDefinitions: getMergedMapDefs(),
        itemDefinitions,
        // 额外信息：标识哪些是自定义的
        customCharacters: Object.keys(customCharacterDefs).filter(id => customCharacterDefs[id] && customCharacterDefs[id]._custom),
        customMaps: Object.keys(customMapDefs).filter(key => customMapDefs[key] && customMapDefs[key]._custom),
        resources: {
          resourceVersion: DEFINITIONS_VERSION,
          manifestBaseUrls: envUrlList('GAME_MANIFEST_BASE_URLS'),
          assetBaseUrls: envUrlList('GAME_ASSET_BASE_URLS'),
          // 双端互通：资产统一从本后端 /api/assets 拉取（MySQL 主存 + 磁盘缓存）
          assetApiBaseUrl: apiAssetBaseUrl(req),
          localManifestBaseUrl: '/assets/game/',
          localAssetBaseUrl: './sendbox/src/assets/'
        },
        features: { remoteResources: envUrlList('GAME_ASSET_BASE_URLS').length > 0 || !disableAssetApi(), localFallback: true }
      });
      return true;
    }

    if (req.method === 'POST' && parsedUrl.pathname === '/api/accounts/sync') {
      const body = await readJsonBody(req);
      const account = syncAccount(body);
      if (!account) {
        jsonResponse(res, 400, { error: 'invalid_account' });
        return true;
      }
      saveState();
      jsonResponse(res, 200, {
        account,
        profile: accountProfile(account.accountKey),
        roleBindings: roleBindingsForWorld('mailbox-xiejian'),
        worldRoleBindings: persistentState.worldRoleBindings
      });
      return true;
    }

    if (req.method === 'GET' && parsedUrl.pathname === '/api/mail/recipients') {
      const accountKey = normalizeAccountKey(parsedUrl.searchParams.get('accountKey'));
      const mailboxId = String(parsedUrl.searchParams.get('mailboxId') || '');
      jsonResponse(res, 200, { recipients: getMailboxRecipients(mailboxId, accountKey) });
      return true;
    }

    if (req.method === 'GET' && parsedUrl.pathname === '/api/game/inventory') {
      const accountKey = normalizeAccountKey(parsedUrl.searchParams.get('accountKey'));
      if (!accountKey) {
        jsonResponse(res, 400, { error: 'invalid_account' });
        return true;
      }
      // 确保账号按当前绑定角色发放初始装备（寒门角色也会在此补发）
      const characterId = resolveCharacterId(accountKey);
      if (characterId) {
        grantStarterItems(accountKey, characterId);
        saveState();
      }
      jsonResponse(res, 200, { inventory: inventoryState(accountKey) });
      return true;
    }

    if (req.method === 'GET' && parsedUrl.pathname === '/api/game/world-items') {
      const accountKey = normalizeAccountKey(parsedUrl.searchParams.get('accountKey'));
      const mapKey = String(parsedUrl.searchParams.get('mapKey') || '');
      if (!mapKey) {
        jsonResponse(res, 400, { error: 'invalid_world_item_query' });
        return true;
      }
      jsonResponse(res, 200, { mapKey, accountKey: accountKey || '', items: worldItemsForMap(mapKey) });
      return true;
    }

    if (req.method === 'GET' && parsedUrl.pathname === '/api/mail/letters') {
      const accountKey = normalizeAccountKey(parsedUrl.searchParams.get('accountKey'));
      const mailboxId = String(parsedUrl.searchParams.get('mailboxId') || '');
      // 内存优先（<1ms）：loadAllFromState 启动时已把 MySQL 全量信件载入 persistentState.letters，
      // 运行期写入双写内存+MySQL。避免每次打开信箱都打远程 MySQL（0.3~0.5s RTT）——
      // 那是"信箱打开/搜索/发送慢"并挤占连接池的根因之一。
      let rawRecords = Object.values(persistentState.letters || {})
        .filter(r => r && r.mailboxId === mailboxId);
      // 内存为空（跨服务器写入的极端场景）→ MySQL 兜底
      if (rawRecords.length === 0 && isMysqlEnabled()) {
        try {
          const mongoLetters = await mysqlDao.loadLetters(mailboxId, accountKey);
          if (Array.isArray(mongoLetters) && mongoLetters.length) rawRecords = mongoLetters;
        } catch (_) {}
      }
      const letters = rawRecords
        .filter(record => {
          if (record.deliveryStatus === 'draft') return record.senderAccountKey === accountKey;
          return record.senderAccountKey === accountKey || record.recipientAccountKey === accountKey;
        })
        .map(record => record.deliveryStatus === 'draft'
          ? {
              ...(record.letter || record),
              id: record.id,
              mailboxId: record.mailboxId,
              senderAccountKey: record.senderAccountKey,
              recipientAccountKey: record.recipientAccountKey || '',
              deliveryStatus: 'draft',
              direction: 'draft',
              status: 'draft',
              serverLetter: true
            }
          : publicLetter(record, accountKey))
        .sort((a, b) => (b.sentAt || b.updatedAt || b.createdAt || 0) - (a.sentAt || a.updatedAt || a.createdAt || 0));
      jsonResponse(res, 200, {
        letters,
        unreadCount: letters.filter(letter => letter.isUnread).length,
        remote: isMysqlEnabled() && rawRecords.length > 0,
        fromCount: rawRecords.length
      });
      return true;
    }

    if (req.method === 'POST' && parsedUrl.pathname === '/api/mail/draft') {
      const body = await readJsonBody(req);
      const accountKey = normalizeAccountKey(body.accountKey);
      const mailboxId = String(body.mailboxId || '');
      const letter = body.letter && typeof body.letter === 'object' ? body.letter : null;
      if (!accountKey || !mailboxId || !letter) {
        jsonResponse(res, 400, { error: 'invalid_draft' });
        return true;
      }
      syncAccount(body.account || { accountKey });
      const id = String(letter.id || `letter-${Date.now()}`);
      const existing = persistentState.letters[id];
      if (existing && existing.senderAccountKey !== accountKey) {
        jsonResponse(res, 403, { error: 'not_draft_owner' });
        return true;
      }
      const draftRecord = {
        id,
        mailboxId,
        senderAccountKey: accountKey,
        recipientAccountKey: normalizeAccountKey(body.recipientAccountKey),
        senderIdentity: getAccountIdentity(accountKey, mailboxId),
        recipientIdentity: body.recipientAccountKey
          ? getAccountIdentity(normalizeAccountKey(body.recipientAccountKey), mailboxId)
          : null,
        deliveryStatus: 'draft',
        sentAt: null,
        readAt: null,
        clientMessageId: '',
        letter: {
          ...letter,
          id,
          mailboxId,
          status: 'draft',
          itemAttachmentIds: normalizeAttachmentIds(letter.itemAttachmentIds).slice(0, 8),
          itemAttachments: undefined,
          updatedAt: Date.now()
        }
      };
      persistentState.letters[id] = draftRecord;
      if (isMysqlEnabled()) {
        // 草稿自动保存高频，MySQL 持久化异步化避免卡顿
        try { mysqlDao.saveLetter(draftRecord).catch(() => {}); } catch (_) {}
      }
      saveState();
      jsonResponse(res, 200, { letter: persistentState.letters[id].letter, remote: isMysqlEnabled() });
      return true;
    }

    if (req.method === 'DELETE' && parsedUrl.pathname.startsWith('/api/mail/draft/')) {
      const id = decodeURIComponent(parsedUrl.pathname.slice('/api/mail/draft/'.length));
      const accountKey = normalizeAccountKey(parsedUrl.searchParams.get('accountKey'));
      const record = persistentState.letters[id];
      if (!record || record.deliveryStatus !== 'draft') {
        jsonResponse(res, 404, { error: 'draft_not_found' });
        return true;
      }
      if (record.senderAccountKey !== accountKey) {
        jsonResponse(res, 403, { error: 'not_draft_owner' });
        return true;
      }
      delete persistentState.letters[id];
      if (isMysqlEnabled()) {
        try { await mysqlDao.deleteLetter(id, accountKey); } catch (_) {}
      }
      saveState();
      jsonResponse(res, 200, { success: true, remote: isMysqlEnabled() });
      return true;
    }

    if (req.method === 'POST' && parsedUrl.pathname === '/api/mail/send') {
      const body = await readJsonBody(req);
      const accountKey = normalizeAccountKey(body.accountKey);
      const recipientAccountKey = normalizeAccountKey(body.recipientAccountKey);
      const mailboxId = String(body.mailboxId || '');
      const clientMessageId = String(body.clientMessageId || '').slice(0, 120);
      const letter = body.letter && typeof body.letter === 'object' ? body.letter : null;
      if (!accountKey || !recipientAccountKey || accountKey === recipientAccountKey || !mailboxId || !clientMessageId || !letter) {
        jsonResponse(res, 400, { error: 'invalid_letter' });
        return true;
      }
      if (!persistentState.accounts[recipientAccountKey]) {
        // 本地内存没有，但 Mongo 里可能有（另一台服务器注册的），不挡
      }
      const duplicate = Object.values(persistentState.letters).find(record =>
        record.senderAccountKey === accountKey && record.clientMessageId === clientMessageId
      ) || (isMysqlEnabled() ? null : null);
      if (duplicate) {
        jsonResponse(res, 200, { letter: publicLetter(duplicate, accountKey), duplicate: true });
        return true;
      }
      const attachmentValidation = validateMailAttachments(accountKey, letter.itemAttachmentIds);
      if (attachmentValidation.error) {
        jsonResponse(res, 409, {
          error: attachmentValidation.error,
          instanceId: attachmentValidation.instanceId || ''
        });
        return true;
      }
      const id = String(letter.id || `letter-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
      const sentAt = Date.now();
      const itemAttachments = attachmentValidation.instances.map(instance => attachmentSnapshot(instance));
      const record = {
        id,
        mailboxId,
        senderAccountKey: accountKey,
        recipientAccountKey,
        senderIdentity: getAccountIdentity(accountKey, mailboxId),
        recipientIdentity: getAccountIdentity(recipientAccountKey, mailboxId),
        deliveryStatus: 'sent',
        sentAt,
        readAt: null,
        clientMessageId,
        itemAttachments,
        letter: {
          ...letter,
          id,
          mailboxId,
          sender: getAccountIdentity(accountKey, mailboxId).identityName,
          recipient: getAccountIdentity(recipientAccountKey, mailboxId).identityName,
          status: 'sent',
          itemAttachmentIds: attachmentValidation.ids,
          itemAttachments: undefined,
          createdAt: letter.createdAt || sentAt,
          updatedAt: sentAt
        }
      };
      for (const instance of attachmentValidation.instances) {
        attachmentValidation.inventory.itemIds = attachmentValidation.inventory.itemIds
          .filter(instanceId => instanceId !== instance.instanceId);
        attachmentValidation.inventory.quickSlots = attachmentValidation.inventory.quickSlots
          .map(instanceId => instanceId === instance.instanceId ? '' : instanceId);
        instance.locationType = 'mail_escrow';
        instance.ownerAccountKey = '';
        instance.equippedSlot = '';
        instance.mapKey = '';
        instance.nodeId = '';
        instance.escrowLetterId = id;
        instance.pendingOwnerAccountKey = recipientAccountKey;
      }
      persistentState.letters[id] = record;
      if (isMysqlEnabled()) {
        // MySQL 持久化改为后台异步写（远程库 RTT 0.3~0.5s 是"发送很久"的主因之一）：
        // 内存态已实时生效，响应不等待；读取链路内存优先，不会读到缺信。
        mysqlDao.saveLetter(record).catch(() => {});
      }
      saveState();
      notifyInventoryForAccount(accountKey);
      jsonResponse(res, 200, { letter: publicLetter(record, accountKey), duplicate: false, remote: isMysqlEnabled() });
      return true;
    }

    if (req.method === 'POST' && parsedUrl.pathname.startsWith('/api/mail/read/')) {
      const id = decodeURIComponent(parsedUrl.pathname.slice('/api/mail/read/'.length));
      const body = await readJsonBody(req);
      const accountKey = normalizeAccountKey(body.accountKey);
      const record = persistentState.letters[id];
      if (!record || record.recipientAccountKey !== accountKey) {
        jsonResponse(res, 404, { error: 'letter_not_found' });
        return true;
      }
      const receivedItems = [];
      const recipientInventory = ensureInventory(accountKey);
      for (const attachment of record.itemAttachments || []) {
        if (attachment.status === 'received') continue;
        const instance = persistentState.itemInstances[attachment.instanceId];
        if (!instance || instance.locationType !== 'mail_escrow' ||
            instance.escrowLetterId !== record.id ||
            instance.pendingOwnerAccountKey !== accountKey) {
          continue;
        }
        instance.locationType = 'inventory';
        instance.ownerAccountKey = accountKey;
        instance.escrowLetterId = '';
        instance.pendingOwnerAccountKey = '';
        instance.acquisition = {
          method: 'mail',
          at: Date.now(),
          fromAccountKey: record.senderAccountKey,
          fromIdentity: record.senderIdentity?.identityName || record.senderAccountKey,
          letterId: record.id
        };
        if (!recipientInventory.itemIds.includes(instance.instanceId)) {
          recipientInventory.itemIds.push(instance.instanceId);
        }
        attachment.status = 'received';
        attachment.receivedAt = Date.now();
        attachment.acquisitionLabel = acquisitionLabel(instance);
        receivedItems.push(publicInstance(instance));
      }
      record.readAt = record.readAt || Date.now();
      if (isMysqlEnabled()) {
        // 异步持久化（远程 MySQL RTT 0.3~0.5s，不阻塞"打开信件"响应）
        try {
          Promise.resolve(mysqlDao.saveLetter(record)).catch(() => {});
          Promise.resolve(mysqlDao.markLetterRead(id, accountKey)).catch(() => {});
        } catch (_) {}
      }
      saveState();
      notifyInventoryForAccount(accountKey);
      jsonResponse(res, 200, {
        readAt: record.readAt,
        receivedItems,
        inventory: inventoryState(accountKey),
        letter: publicLetter(record, accountKey),
        remote: isMysqlEnabled()
      });
      return true;
    }

    // ====== 通用信件 CRUD 接口（mailbox 编辑器用，直接 upsert 整封信件到云端） ======
    if (req.method === 'POST' && parsedUrl.pathname === '/api/letters/upsert') {
      const body = await readJsonBody(req);
      const record = body.record || body.letterRecord || null;
      if (!record || !record.id) {
        jsonResponse(res, 400, { success: false, message: 'record.id 必填' });
        return true;
      }
      // 格式化确保字段完整
      if (!record.mailboxId) record.mailboxId = String(body.mailboxId || '');
      if (!record.deliveryStatus) record.deliveryStatus = body.deliveryStatus || 'sent';
      if (!record.senderAccountKey) record.senderAccountKey = normalizeAccountKey(body.accountKey || record.senderAccountKey || '');
      if (!record.senderIdentity && record.senderAccountKey) {
        record.senderIdentity = getAccountIdentity(record.senderAccountKey, record.mailboxId);
      }
      if (record.recipientAccountKey && !record.recipientIdentity) {
        record.recipientIdentity = getAccountIdentity(record.recipientAccountKey, record.mailboxId);
      }
      if (!record.letter) record.letter = body.letter || { id: record.id, mailboxId: record.mailboxId };
      if (!record.letter.updatedAt) record.letter.updatedAt = Date.now();
      if (!record.updatedAt) record.updatedAt = Date.now();
      persistentState.letters[record.id] = record;
      let saved = null;
      if (isMysqlEnabled()) {
        try { saved = await mysqlDao.saveLetter(record); } catch (e) { saved = null; }
      }
      saveState();
      jsonResponse(res, 200, { success: true, record: saved || record, remote: !!saved });
      return true;
    }

    if (req.method === 'POST' && parsedUrl.pathname === '/api/letters/batch_upsert') {
      const body = await readJsonBody(req);
      const records = Array.isArray(body.records) ? body.records : [];
      const accountKey = normalizeAccountKey(body.accountKey || '');
      const results = [];
      for (const r of records) {
        if (!r || !r.id) continue;
        if (!r.updatedAt) r.updatedAt = Date.now();
        persistentState.letters[r.id] = r;
        if (isMysqlEnabled()) {
          try { await mysqlDao.saveLetter(r); results.push({ id: r.id, ok: true }); }
          catch (e) { results.push({ id: r.id, ok: false, err: String(e?.message || e) }); }
        } else {
          results.push({ id: r.id, ok: true, local: true });
        }
      }
      saveState();
      jsonResponse(res, 200, { success: true, results, remote: isMysqlEnabled() });
      return true;
    }

    if (req.method === 'GET' && parsedUrl.pathname === '/api/letters/list') {
      const accountKey = normalizeAccountKey(parsedUrl.searchParams.get('accountKey'));
      const mailboxId = String(parsedUrl.searchParams.get('mailboxId') || '');
      // 内存优先（<1ms），MySQL 兜底（跨服务器写入的极端场景）
      let list = Object.values(persistentState.letters || {}).filter(r =>
        r && r.mailboxId === mailboxId &&
        (r.senderAccountKey === accountKey || r.recipientAccountKey === accountKey ||
          (r.deliveryStatus === 'draft' && r.senderAccountKey === accountKey))
      );
      if (list.length === 0 && isMysqlEnabled()) {
        try { list = await mysqlDao.loadLetters(mailboxId, accountKey) || []; }
        catch (_) { list = []; }
      }
      jsonResponse(res, 200, { success: true, letters: list, remote: isMysqlEnabled() && list.length > 0 });
      return true;
    }

    // ======== 我的往来联系人（跨信箱聚合，解决"个人信箱之间无法建链"） ========
    // 聚合服务端全部信件（内存 + MySQL）中与该账号有实际往来（sent/inbox）的人，
    // 不依赖"当前用户可见信箱列表"——对方个人信箱即使对当前用户不可见，也能提取出来。
    if (req.method === 'GET' && parsedUrl.pathname === '/api/letters/contacts') {
      const accountKey = normalizeAccountKey(parsedUrl.searchParams.get('accountKey'));
      if (!accountKey) {
        jsonResponse(res, 400, { success: false, message: 'accountKey 必填' });
        return true;
      }
      const byId = new Map();
      // 内存态即权威：bootstrap 启动时已通过 loadAllFromState 将 MySQL 全量信件加载进 persistentState.letters
      // （避免对远程 MySQL 实时全表查询导致的连接排队/卡顿）
      for (const r of Object.values(persistentState.letters || {})) {
        if (r && r.id) byId.set(String(r.id), r);
      }
      const contacts = new Map(); // key -> contact
      for (const r of byId.values()) {
        if (!r || !r.id || r.deliveryStatus === 'draft') continue; // 只算实际往来
        const s = normalizeAccountKey(r.senderAccountKey);
        const t = normalizeAccountKey(r.recipientAccountKey);
        if (!s || !t || s === t) continue;
        const ts = Number(r.sentAt || r.updatedAt || r.createdAt || 0);
        const mbId = String(r.mailboxId || '');
        let otherKey = null;
        if (s === accountKey) otherKey = t;
        else if (t === accountKey) otherKey = s;
        if (!otherKey) continue;
        const existing = contacts.get(otherKey);
        if (!existing || ts > existing.lastContactAt) {
          contacts.set(otherKey, {
            accountKey: otherKey,
            mailboxId: mbId,
            mailboxName: (persistentState.mailboxes && persistentState.mailboxes[mbId]) ? (persistentState.mailboxes[mbId].name || '') : '',
            lastContactAt: ts
          });
        }
      }
      const list = Array.from(contacts.values())
        .sort((a, b) => (b.lastContactAt || 0) - (a.lastContactAt || 0))
        .slice(0, 50);
      jsonResponse(res, 200, { success: true, contacts: list, remote: isMysqlEnabled() });
      return true;
    }

    if (req.method === 'POST' && parsedUrl.pathname === '/api/letters/delete') {
      const body = await readJsonBody(req);
      const id = String(body.id || '');
      const accountKey = normalizeAccountKey(body.accountKey || '');
      if (!id) { jsonResponse(res, 400, { success: false, message: 'id 必填' }); return true; }
      delete persistentState.letters[id];
      if (isMysqlEnabled()) {
        try { await mysqlDao.deleteLetter(id, accountKey); } catch (_) {}
      }
      saveState();
      jsonResponse(res, 200, { success: true, remote: isMysqlEnabled() });
      return true;
    }

    if (req.method === 'POST' && parsedUrl.pathname === '/api/media') {
      const body = await readJsonBody(req);
      const accountKey = normalizeAccountKey(body.accountKey);
      const mimeType = String(body.mimeType || 'application/octet-stream').slice(0, 100);
      const base64 = String(body.base64 || '');
      if (!accountKey || !base64 || base64.length > 70 * 1024 * 1024) {
        jsonResponse(res, 400, { error: 'invalid_media' });
        return true;
      }
      const id = String(body.id || `media-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`)
        .replace(/[^a-zA-Z0-9_-]/g, '')
        .slice(0, 120);
      const mediaBuf = Buffer.from(base64, 'base64');
      fs.writeFileSync(path.join(MEDIA_DIR, id), mediaBuf);
      fs.writeFileSync(path.join(MEDIA_DIR, `${id}.json`), JSON.stringify({ mimeType }), 'utf8');
      // 双端互通：媒体同时入库 MySQL（任意端口/设备可通过 /api/media/:id 读取）
      try {
        await assetStore.putAsset('media/' + id, mimeType, mediaBuf, 'user');
      } catch (e) {
        console.warn('[media] 入库 MySQL 失败（磁盘文件保留）:', e?.message || e);
      }
      jsonResponse(res, 200, { id, url: `/api/media/${id}` });
      return true;
    }

    // ======== 远端 MySQL 接口 ========

    // 健康检查（前端用它判断能不能走云端模式）
    if (req.method === 'GET' && parsedUrl.pathname === '/api/health') {
      jsonResponse(res, 200, {
        ok: true,
        server: 'xinjian',
        mysqlEnabled: isMysqlEnabled(),
        mongoEnabled: isMysqlEnabled(), // 兼容前端旧字段
        port: PORT,
        time: Date.now()
      });
      return true;
    }

    // ------- 认证：注册/登录 -------
    if (req.method === 'POST' && parsedUrl.pathname === '/api/auth/register') {
      const body = await readJsonBody(req);
      const username = String(body.username || '').trim();
      const password = String(body.password || '');
      const displayName = body.displayName || body.username;
      const role = body.role || 'user';
      if (username.length < 3) {
        jsonResponse(res, 400, { success: false, message: '用户名至少需要3个字符', user: null });
        return true;
      }
      if (password.length < 6) {
        jsonResponse(res, 400, { success: false, message: '密码至少需要6个字符', user: null });
        return true;
      }
      if (isMysqlEnabled()) {
        const r = await mysqlDao.createUser({ username, password, displayName, role });
        if (r && r.error) {
          jsonResponse(res, 409, { success: false, message: r.error, user: null });
        } else if (r) {
          // 同步创建一条 account，保持 /api/accounts/sync 的语义一致
          await mysqlDao.syncAccount({ accountKey: username, username, displayName, role, userId: r.id });
          jsonResponse(res, 200, { success: true, message: '注册成功（云端）', user: r, remote: true });
        } else {
          jsonResponse(res, 500, { success: false, message: '云端注册失败，请稍后再试', user: null });
        }
      } else {
        // 降级：本地内存注册（保留 state.json 原有行为）
        const exists = Object.values(persistentState.accounts || {}).find(a => String(a.username || a.accountKey || '').toLowerCase() === username.toLowerCase());
        if (exists) {
          jsonResponse(res, 409, { success: false, message: '用户名已存在', user: null });
          return true;
        }
        const id = 'user-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
        const accountKey = username.toLowerCase();
        persistentState.accounts = persistentState.accounts || {};
        persistentState.accounts[accountKey] = {
          id, accountKey, username, displayName: displayName || username, role,
          createdAt: Date.now(), lastSeenAt: Date.now()
        };
        saveState();
        jsonResponse(res, 200, { success: true, message: '注册成功（本地模式）', user: { id, username, displayName, role, createdAt: Date.now() }, remote: false });
      }
      return true;
    }

    if (req.method === 'POST' && parsedUrl.pathname === '/api/auth/login') {
      const body = await readJsonBody(req);
      const username = String(body.username || '').trim();
      const password = String(body.password || '');
      if (!username || !password) {
        jsonResponse(res, 400, { success: false, message: '用户名和密码不能为空', user: null });
        return true;
      }
      if (isMysqlEnabled()) {
        const user = await mysqlDao.findUserByUsername(username);
        if (!user) {
          jsonResponse(res, 404, { success: false, message: '用户不存在', user: null });
          return true;
        }
        const ok = await mysqlDao.verifyPassword(user, password);
        if (!ok) {
          jsonResponse(res, 401, { success: false, message: '密码错误', user: null });
          return true;
        }
        await mysqlDao.recordLogin(user.id);
        const safe = mysqlDao.sanitizeUser(user);
        // 同时也 syncAccount 确保 accounts 表里有这个用户（后续 mail/letters/inventory 用）
        await mysqlDao.syncAccount({ accountKey: username, username: safe.username, displayName: safe.displayName, role: safe.role, userId: safe.id });
        jsonResponse(res, 200, { success: true, message: '登录成功（云端）', user: safe, remote: true });
      } else {
        // 降级：走内存 state（兼容本地模式；这里不做密码严格校验因为本地没有 passwordHash）
        const accountKey = username.toLowerCase();
        const acc = (persistentState.accounts || {})[accountKey];
        if (!acc) {
          jsonResponse(res, 404, { success: false, message: '用户不存在', user: null });
          return true;
        }
        acc.lastSeenAt = Date.now();
        saveState();
        jsonResponse(res, 200, {
          success: true, message: '登录成功（本地模式）',
          user: {
            id: acc.id, username: acc.username || accountKey,
            displayName: acc.displayName, role: acc.role,
            createdAt: acc.createdAt
          },
          remote: false
        });
      }
      return true;
    }

    if (req.method === 'POST' && parsedUrl.pathname === '/api/auth/logout') {
      const body = await readJsonBody(req).catch(() => ({}));
      if (isMysqlEnabled() && body?.userId) {
        await mysqlDao.recordLogin(body.userId); // 记录 lastSeenAt
      }
      jsonResponse(res, 200, { success: true, message: '已退出' });
      return true;
    }

    // ------- 信箱 CRUD -------
    // 列表
    if (req.method === 'GET' && parsedUrl.pathname === '/api/mailboxes') {
      const accountKey = normalizeAccountKey(parsedUrl.searchParams.get('accountKey'));
      if (isMysqlEnabled()) {
        const list = await mysqlDao.listMailboxesByMember(accountKey);
        jsonResponse(res, 200, { mailboxes: Array.isArray(list) ? list : [], remote: true });
      } else {
        const list = Object.values(persistentState.mailboxes).filter(mailbox =>
          !mailbox.isCustom || mailbox.ownerAccountKey === accountKey || (mailbox.memberAccountKeys || []).includes(accountKey)
        ).sort((a, b) => Number(b.updatedAt || 0) - Number(a.updatedAt || 0));
        jsonResponse(res, 200, { mailboxes: list, remote: false, persistent: true });
      }
      return true;
    }
    // 创建 / 编辑 / 迁移 upsert（有 id 或 mailboxCode 时走 upsert，否则 create）
    if (req.method === 'POST' && parsedUrl.pathname === '/api/mailboxes') {
      const body = await readJsonBody(req);
      const ownerAccountKey = normalizeAccountKey(body.ownerAccountKey || body.accountKey);
      if (isMysqlEnabled()) {
        const hasId = !!body.id;
        const hasMailboxCode = !!body.mailboxCode;
        let r;
        if (hasId || hasMailboxCode) {
          // 编辑 / 迁移 upsert：按 id 判重，保证幂等
          const patch = { ...body };
          if (ownerAccountKey && !patch.ownerAccountKey) patch.ownerAccountKey = ownerAccountKey;
          if (hasMailboxCode && !patch.id) {
            // 只有 mailboxCode 没有 id：先按 code 找原 id，找不到就生成新 id
            const existing = await mysqlDao.findMailboxByCode(hasMailboxCode);
            if (existing && existing.id) patch.id = existing.id;
            else patch.id = 'mailbox-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
          }
          if (!patch.memberAccountKeys && ownerAccountKey) patch.memberAccountKeys = [ownerAccountKey];
          r = await mysqlDao.upsertMailboxRemote(patch);
        } else {
          r = await mysqlDao.createMailbox({
            name: body.name, desc: body.desc, icon: body.icon,
            themeColor: body.themeColor, mapBackground: body.mapBackground,
            isCustom: body.isCustom !== false, ownerAccountKey, visibility: body.visibility
          });
        }
        if (r && r.error) {
          jsonResponse(res, 400, { success: false, message: r.error });
        } else if (r) {
          broadcastAdmin({ type: 'mailbox_changed', mailboxId: r.id, action: body.id ? 'updated' : 'created', timestamp: Date.now() });
          jsonResponse(res, 200, { success: true, mailbox: r, remote: true });
        } else {
          jsonResponse(res, 500, { success: false, message: '创建失败' });
        }
      } else {
        const mailbox = upsertLocalMailbox(body, ownerAccountKey);
        if (mailbox.error) jsonResponse(res, 400, { success: false, message: mailbox.error });
        else { saveState(); broadcastAdmin({ type: 'mailbox_changed', mailboxId: mailbox.id, action: body.id ? 'updated' : 'created', timestamp: Date.now() }); jsonResponse(res, 200, { success: true, mailbox, remote: false, persistent: true }); }
      }
      return true;
    }
    if (req.method === 'GET' && parsedUrl.pathname === '/api/mailboxes/directory') {
      const query = String(parsedUrl.searchParams.get('q') || '').trim().toLowerCase();
      const source = isMysqlEnabled()
        ? (await mysqlDao.listPublicMailboxes(query) || [])
        : Object.values(persistentState.mailboxes)
          .filter(mailbox => mailbox.visibility === 'public')
          .filter(mailbox => !query || mailbox.name.toLowerCase().includes(query) || mailbox.mailboxCode.toLowerCase().includes(query));
      const directory = source.map(mailbox => ({ id: mailbox.id, name: mailbox.name, desc: mailbox.desc, icon: mailbox.icon, mailboxCode: mailbox.mailboxCode, memberCount: (mailbox.memberAccountKeys || []).length, isCustom: mailbox.isCustom })).slice(0, 50);
      jsonResponse(res, 200, { mailboxes: directory, remote: isMysqlEnabled(), persistent: true });
      return true;
    }

    // 按 id 详情
    if (req.method === 'GET' && parsedUrl.pathname.startsWith('/api/mailboxes/')) {
      const id = decodeURIComponent(parsedUrl.pathname.slice('/api/mailboxes/'.length));
      if (!id) { jsonResponse(res, 400, { error: 'missing_id' }); return true; }
      if (isMysqlEnabled()) {
        const mb = await mysqlDao.getMailboxById(id);
        jsonResponse(res, mb ? 200 : 404, { mailbox: mb || null });
      } else {
        const mailbox = persistentState.mailboxes[id] || null;
        jsonResponse(res, mailbox ? 200 : 404, { mailbox, remote: false, persistent: true });
      }
      return true;
    }

    // ------- 信箱号跨用户查询 & 加入（核心！） -------
    // 每个用户的个人信箱（不存在则自动创建，幂等）
    if (req.method === 'GET' && parsedUrl.pathname === '/api/mailbox/personal') {
      const accountKey = normalizeAccountKey(parsedUrl.searchParams.get('accountKey'));
      const displayName = String(parsedUrl.searchParams.get('displayName') || accountKey || '').slice(0, 40);
      if (!accountKey) { jsonResponse(res, 400, { success: false, message: 'accountKey 必填' }); return true; }
      const personalId = 'personal-' + accountKey;
      if (isMysqlEnabled()) {
        let mb = await mysqlDao.getMailboxById(personalId);
        if (!mb) {
          const mailboxCode = await mysqlDao.generateMailboxCode(displayName + '的信箱');
          if (mailboxCode) {
            const created = await mysqlDao.upsertMailboxRemote({
              id: personalId,
              name: `${displayName}的信箱`,
              desc: '我的专属信箱，凭信箱码即可给我寄信',
              icon: '📮',
              themeColor: '#8a6d3b',
              accent: '#8a6d3b',
              cardAccent: '#8a6d3b',
              mapBackground: '',
              isCustom: true,
              visibility: 'public',
              mailboxCode,
              ownerAccountKey: accountKey,
              memberAccountKeys: [accountKey],
              memberNames: { [accountKey]: displayName || accountKey },
              memberCharacters: {},
              createdAt: Date.now(),
              updatedAt: Date.now()
            });
            mb = created && !created.error ? created : null;
          }
        }
        if (mb) {
          saveState();
          broadcastAdmin({ type: 'mailbox_changed', mailboxId: personalId, action: 'created', timestamp: Date.now() });
          jsonResponse(res, 200, { success: true, mailbox: mb, remote: true });
        } else {
          jsonResponse(res, 500, { success: false, message: '个人信箱创建失败' });
        }
      } else {
        // 本地降级：直接 upsert 到内存 state
        let mb = persistentState.mailboxes[personalId];
        if (!mb) {
          const mailboxCode = await mysqlDao.generateMailboxCode(displayName + '的信箱');
          mb = {
            id: personalId, name: `${displayName}的信箱`, desc: '我的专属信箱，凭信箱码即可给我寄信',
            icon: '📮', themeColor: '#8a6d3b', accent: '#8a6d3b', cardAccent: '#8a6d3b', mapBackground: '', isCustom: true, visibility: 'public',
            mailboxCode: mailboxCode || 'MB' + Math.random().toString(36).slice(2, 8).toUpperCase(),
            ownerAccountKey: accountKey,
            memberAccountKeys: [accountKey], memberNames: { [accountKey]: displayName || accountKey },
            memberCharacters: {}, createdAt: Date.now(), updatedAt: Date.now()
          };
          persistentState.mailboxes[personalId] = mb;
          saveState();
          broadcastAdmin({ type: 'mailbox_changed', mailboxId: personalId, action: 'created', timestamp: Date.now() });
        }
        jsonResponse(res, 200, { success: true, mailbox: mb, remote: false });
      }
      return true;
    }

    if (req.method === 'GET' && parsedUrl.pathname === '/api/mailbox_codes/lookup') {
      const code = String(parsedUrl.searchParams.get('code') || '').trim().toUpperCase();
      if (!code) { jsonResponse(res, 400, { success: false, message: 'code 为空' }); return true; }
      // 内存优先（<1ms）：loadAllFromState 启动时已把 MySQL 全量 mailboxCodes/mailboxes 载入内存，
      // 避免每次搜索都打远程 MySQL（0.3~0.5s RTT）——这是"搜索信箱很久"的根因。
      const memoryMb = findLocalMailboxByCode(code);
      if (memoryMb) {
        // 异步补录 MySQL（补全 mailbox_codes 索引，不阻塞响应）
        try {
          mysqlDao.upsertMailboxRemote({
            id: memoryMb.id,
            name: memoryMb.name,
            mailboxCode: code,
            ownerAccountKey: memoryMb.ownerAccountKey || '',
            memberAccountKeys: memoryMb.memberAccountKeys || [],
            memberNames: memoryMb.memberNames || {},
            memberCharacters: memoryMb.memberCharacters || {}
          }).catch(() => {});
        } catch (_) {}
        jsonResponse(res, 200, { success: true, code, mailbox: memoryMb, remote: false });
        return true;
      }
      // MySQL 兜底（内存未命中但 MySQL 有——跨服务器写入的极少数场景）
      if (isMysqlEnabled()) {
        const mb = await mysqlDao.findMailboxByCode(code);
        if (mb) {
          jsonResponse(res, 200, { success: true, code, mailbox: mb, remote: true });
          return true;
        }
      }
      jsonResponse(res, 404, { success: false, message: '该信箱号不存在（云端与本地均未找到）', code });
      return true;
    }
    if (req.method === 'POST' && parsedUrl.pathname === '/api/mailbox_codes/join') {
      const body = await readJsonBody(req);
      const code = String(body.code || '').trim().toUpperCase();
      const accountKey = normalizeAccountKey(body.accountKey);
      if (!code) { jsonResponse(res, 400, { success: false, message: 'code 为空' }); return true; }
      if (!accountKey) { jsonResponse(res, 401, { success: false, message: '未登录' }); return true; }
      if (isMysqlEnabled()) {
        const r = await mysqlDao.joinMailboxByCode(code, accountKey);
        if (r && r.error) {
          jsonResponse(res, 404, { success: false, message: r.error });
        } else if (r) {
          jsonResponse(res, 200, { success: true, message: '已加入', mailbox: r, remote: true });
        } else {
          jsonResponse(res, 500, { success: false, message: '加入失败' });
        }
      } else {
        const mailbox = joinLocalMailbox(code, accountKey);
        if (mailbox.error) jsonResponse(res, 404, { success: false, message: mailbox.error });
        else { saveState(); jsonResponse(res, 200, { success: true, message: '已加入', mailbox, remote: false, persistent: true }); }
      }
      return true;
    }

    // 后端版 XJ:// 分享包（可选），保留前端版即可，这里只暴露 build 端点
    if (req.method === 'POST' && parsedUrl.pathname === '/api/mailboxes/share/build') {
      const body = await readJsonBody(req);
      const mailboxId = String(body.mailboxId || '');
      if (!mailboxId || !isMysqlEnabled()) {
        jsonResponse(res, 400, { success: false, message: mailboxId ? '云端未启用' : '缺少 mailboxId' });
        return true;
      }
      const mb = await mysqlDao.getMailboxById(mailboxId);
      if (!mb) { jsonResponse(res, 404, { success: false, message: '信箱不存在' }); return true; }
      const letters = await mysqlDao.loadLetters(mailboxId, mb.ownerAccountKey || '') || [];
      const lts = (letters || []).slice(0, Number(body.maxLetters || 10)).map(l => ({
        id: l.letter?.id || l.id, title: l.letter?.title || '', from: l.letter?.senderIdentity || l.letter?.from || '',
        to: l.letter?.recipientIdentity || l.letter?.to || '', date: l.sentAt || l.updatedAt || 0,
        preview: String(l.letter?.bodyText || l.letter?.preview || '').slice(0, 40),
        mailboxId: mailboxId, readAt: l.readAt
      })).filter(x => x.id);
      const pack = { v: 1, mb: JSON.parse(JSON.stringify(mb)), lts };
      const b64 = Buffer.from(JSON.stringify(pack), 'utf8').toString('base64');
      jsonResponse(res, 200, { success: true, package: 'XJ://' + b64 });
      return true;
    }

    // ------- 背包 -------
    if (req.method === 'POST' && parsedUrl.pathname === '/api/inventories/save') {
      const body = await readJsonBody(req);
      const accountKey = normalizeAccountKey(body.accountKey);
      if (!accountKey) { jsonResponse(res, 400, { error: 'invalid_account' }); return true; }
      if (isMysqlEnabled()) {
        const r = await mysqlDao.saveInventory(accountKey, body.inventory);
        jsonResponse(res, 200, { success: true, inventory: r, remote: true });
      } else {
        // 降级：写回 state.json（兼容）
        persistentState.inventories = persistentState.inventories || {};
        persistentState.inventories[accountKey] = {
          items: Array.isArray(body.inventory?.items) ? body.inventory.items : [],
          equipment: body.inventory?.equipment || {},
          quickSlots: body.inventory?.quickSlots || {},
          updatedAt: Date.now()
        };
        saveState();
        jsonResponse(res, 200, { success: true, inventory: persistentState.inventories[accountKey], remote: false });
      }
      return true;
    }

    // ------- 手账 -------
    if (req.method === 'GET' && parsedUrl.pathname === '/api/journals') {
      const accountKey = normalizeAccountKey(parsedUrl.searchParams.get('accountKey'));
      const y = parsedUrl.searchParams.get('year');
      const m = parsedUrl.searchParams.get('month');
      const d = parsedUrl.searchParams.get('day');
      if (!accountKey) { jsonResponse(res, 400, { error: 'invalid_account' }); return true; }
      if (isMysqlEnabled()) {
        const year = y == null ? null : Number(y);
        const month = m == null ? null : Number(m);
        const day = d == null ? null : Number(d);
        const query = year != null && month != null ? { year, month, ...(day != null ? { day } : {}) } : {};
        const r = await mysqlDao.loadJournal(accountKey, query);
        jsonResponse(res, 200, { success: true, entries: Array.isArray(r) ? r : (r ? [r] : []), remote: true });
      } else {
        jsonResponse(res, 200, { success: true, entries: [], remote: false, fallback: true });
      }
      return true;
    }
    if (req.method === 'POST' && parsedUrl.pathname === '/api/journals/save') {
      const body = await readJsonBody(req);
      const accountKey = normalizeAccountKey(body.accountKey);
      if (!accountKey) { jsonResponse(res, 400, { error: 'invalid_account' }); return true; }
      if (isMysqlEnabled()) {
        const r = await mysqlDao.saveJournal(accountKey, body);
        jsonResponse(res, 200, { success: true, entry: r, remote: true });
      } else {
        jsonResponse(res, 503, { success: false, message: '云端未启用，手账保存在本地', fallback: true });
      }
      return true;
    }

    // ======== 资产 API（双端互通：统一从 MySQL 读资产，磁盘仅作缓存） ========
    // GET /api/assets/<assetPath> —— 代理读取（缓存优先 → MySQL 兜底 → 404）
    if (req.method === 'GET' && parsedUrl.pathname.startsWith('/api/assets/')) {
      const assetPath = parsedUrl.pathname.slice('/api/assets/'.length);
      await assetStore.serveAsset(req, res, assetPath);
      return true;
    }

    // POST /api/assets —— 单文件上传入库（JSON: {path, mimeType, base64}，也可用 buffer 字段传二进制）
    if (req.method === 'POST' && parsedUrl.pathname === '/api/assets') {
      const body = await readJsonBody(req);
      const assetPath = String(body.path || '');
      const base64 = String(body.base64 || '');
      const bufferField = body.buffer || body.data || null;
      if (!assetPath) { jsonResponse(res, 400, { success: false, message: 'path 必填' }); return true; }
      let data = null;
      if (bufferField != null) {
        data = Buffer.isBuffer(bufferField) ? bufferField : Buffer.from(bufferField);
      } else if (base64) {
        data = Buffer.from(base64, 'base64');
      }
      if (!data || data.length === 0) { jsonResponse(res, 400, { success: false, message: '内容为空' }); return true; }
      const MAX_ASSET_BYTES = 30 * 1024 * 1024;
      if (data.length > MAX_ASSET_BYTES) { jsonResponse(res, 413, { success: false, message: '单文件超过 30MB 上限' }); return true; }
      const meta = await assetStore.putAsset(assetPath, String(body.mimeType || ''), data, String(body.worldCategory || 'game'));
      jsonResponse(res, 200, { success: true, asset: meta });
      return true;
    }

    // POST /api/assets/import —— 服务端本地文件导入（迁移脚本复用；localPath 相对项目根）
    if (req.method === 'POST' && parsedUrl.pathname === '/api/assets/import') {
      const body = await readJsonBody(req);
      const localPath = String(body.localPath || '').replace(/^\.?\//, '');
      if (!localPath) { jsonResponse(res, 400, { success: false, message: 'localPath 必填' }); return true; }
      const abs = path.resolve(ROOT_DIR, localPath);
      if (!abs.startsWith(ROOT_DIR + path.sep) && abs !== ROOT_DIR) {
        jsonResponse(res, 403, { success: false, message: '仅允许导入项目内文件' }); return true;
      }
      if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) {
        jsonResponse(res, 404, { success: false, message: '文件不存在' }); return true;
      }
      const buf = fs.readFileSync(abs);
      const meta = await assetStore.putAsset(localPath, String(body.mimeType || ''), buf, String(body.worldCategory || 'game'));
      jsonResponse(res, 200, { success: true, asset: meta });
      return true;
    }

    // ======== 现有接口（media）=======
    if (req.method === 'GET' && parsedUrl.pathname.startsWith('/api/media/')) {
      const id = decodeURIComponent(parsedUrl.pathname.slice('/api/media/'.length))
        .replace(/[^a-zA-Z0-9_-]/g, '');
      const file = path.join(MEDIA_DIR, id);
      if (!id) {
        res.writeHead(404);
        res.end('Not Found');
        return true;
      }
      // 磁盘文件优先（兼容存量媒体）→ MySQL 兜底（双端互通：任意端口/设备可读）
      if (fs.existsSync(file)) {
        let mimeType = 'application/octet-stream';
        try {
          mimeType = JSON.parse(fs.readFileSync(`${file}.json`, 'utf8')).mimeType || mimeType;
        } catch (_) {}
        res.writeHead(200, { 'Content-Type': mimeType });
        fs.createReadStream(file).pipe(res);
        return true;
      }
      await assetStore.serveAsset(req, res, 'media/' + id);
      return true;
    }

    // ======== 管理后台 API ========
    if (req.method === 'GET' && parsedUrl.pathname === '/api/admin/state') {
      jsonResponse(res, 200, adminState());
      return true;
    }

    // 管理后台：全部信件列表（含草稿/已发送，字段从 letter 子对象与顶层正确提取）
    // 注意：直接从内存读取（启动时已从 MySQL 全量加载、写入路径同步双写），
    // 避免实时 SELECT * 传输超大 letter JSON（曾出现 2.4MB 单封信导致 9s+ 挂起）。
    if (req.method === 'GET' && parsedUrl.pathname === '/api/admin/letters') {
      const status = String(parsedUrl.searchParams.get('status') || '').trim();
      const mailboxId = String(parsedUrl.searchParams.get('mailboxId') || '').trim();
      const limit = Math.min(parseInt(parsedUrl.searchParams.get('limit') || '500') || 500, 2000);
      const byId = new Map(Object.entries(persistentState.letters || {}));
      let letters = Array.from(byId.values());
      if (status) letters = letters.filter(l => String(l.deliveryStatus || 'draft') === status);
      if (mailboxId) letters = letters.filter(l => String(l.mailboxId || '') === mailboxId);
      // 信箱名称映射
      const mbNames = {};
      for (const m of Object.values(persistentState.mailboxes || {})) mbNames[m.id] = m.name || m.id;
      letters = letters
        .map(l => {
          const letter = l.letter && typeof l.letter === 'object' ? l.letter : l;
          const sender = letter.sender || l.senderAccountKey || letter.senderAccountKey || l.sender || '';
          const recipient = letter.recipient || l.recipientAccountKey || letter.recipientAccountKey || l.recipient || '';
          return {
            id: l.id,
            mailboxId: l.mailboxId || letter.mailboxId || '',
            mailboxName: mbNames[l.mailboxId] || l.mailboxId || '',
            title: letter.letterTitle || letter.title || '无标题',
            bodyText: String(letter.content || letter.bodyText || '').slice(0, 200),
            letterType: l.letterType || letter.type || 'letter',
            deliveryStatus: l.deliveryStatus || letter.status || 'draft',
            sender,
            recipient,
            createdAt: l.createdAt || letter.createdAt || l.sentAt || letter.updatedAt || l.updatedAt || 0,
            updatedAt: l.updatedAt || letter.updatedAt || 0,
            sentAt: l.sentAt || null,
            hasBody: !!(letter.content || letter.bodyText)
          };
        })
        .sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0))
        .slice(0, limit);
      jsonResponse(res, 200, { letters, count: letters.length, total: byId.size });
      return true;
    }

    // 管理后台：单封信件详情（完整正文）
    const letterDetailMatch = parsedUrl.pathname.match(/^\/api\/admin\/letter\/([^/]+)$/);
    if (req.method === 'GET' && letterDetailMatch) {
      const letterId = decodeURIComponent(letterDetailMatch[1]);
      let rec = persistentState.letters[letterId];
      if (!rec && isMysqlEnabled()) {
        try { rec = await mysqlDao.loadLetterById(letterId); } catch (_) {}
      }
      if (!rec) { jsonResponse(res, 404, { success: false, message: '信件不存在' }); return true; }
      const letter = rec.letter && typeof rec.letter === 'object' ? rec.letter : rec;
      const mbNames = {};
      for (const m of Object.values(persistentState.mailboxes || {})) mbNames[m.id] = m.name || m.id;
      const mailboxId = rec.mailboxId || letter.mailboxId || '';
      jsonResponse(res, 200, {
        success: true,
        letter: {
          id: rec.id,
          mailboxId,
          mailboxName: mbNames[mailboxId] || mailboxId || '',
          title: letter.letterTitle || letter.title || '无标题',
          bodyText: String(letter.content || letter.bodyText || '').slice(0, 50000),
          letterType: rec.letterType || letter.type || 'letter',
          deliveryStatus: rec.deliveryStatus || letter.status || 'draft',
          sender: letter.sender || rec.senderAccountKey || letter.senderAccountKey || rec.sender || '',
          recipient: letter.recipient || rec.recipientAccountKey || letter.recipientAccountKey || rec.recipient || '',
          createdAt: rec.createdAt || letter.createdAt || rec.sentAt || letter.updatedAt || rec.updatedAt || 0,
          updatedAt: rec.updatedAt || letter.updatedAt || 0,
          sentAt: rec.sentAt || null
        }
      });
      return true;
    }

    if (req.method === 'POST' && parsedUrl.pathname === '/api/admin/role-bind') {
      const body = await readJsonBody(req);
      const { characterId, accountKey, worldId } = body;
      if (!characterId || !accountKey) {
        jsonResponse(res, 400, { success: false, message: 'characterId 和 accountKey 必填' });
        return true;
      }
      const wId = worldId || 'mailbox-xiejian';
      const bindings = roleBindingsForWorld(wId);
      bindings[characterId] = normalizeAccountKey(accountKey);
      saveState();
      jsonResponse(res, 200, { success: true, characterId, accountKey: bindings[characterId] });
      return true;
    }

    if (req.method === 'POST' && parsedUrl.pathname === '/api/admin/role-unbind') {
      const body = await readJsonBody(req);
      const { characterId, worldId } = body;
      if (!characterId) {
        jsonResponse(res, 400, { success: false, message: 'characterId 必填' });
        return true;
      }
      const wId = worldId || 'mailbox-xiejian';
      const bindings = roleBindingsForWorld(wId);
      delete bindings[characterId];
      saveState();
      jsonResponse(res, 200, { success: true, characterId });
      return true;
    }

    if (req.method === 'POST' && parsedUrl.pathname === '/api/admin/combat-update') {
      const body = await readJsonBody(req);
      const { accountKey, characterId, hp, maxHp, atk, def, spd } = body;
      if (!accountKey) {
        jsonResponse(res, 400, { success: false, message: 'accountKey 必填' });
        return true;
      }
      const profile = ensureCombatProfile(accountKey, characterId || resolveCharacterId(accountKey));
      if (hp !== undefined) profile.hp = Math.max(0, Math.min(profile.maxHp || 100, Number(hp)));
      if (maxHp !== undefined) profile.maxHp = Math.max(1, Number(maxHp));
      if (atk !== undefined) profile.atk = Math.max(0, Number(atk));
      if (def !== undefined) profile.def = Math.max(0, Number(def));
      if (spd !== undefined) profile.spd = Math.max(0, Number(spd));
      saveState();
      jsonResponse(res, 200, { success: true, combat: profile });
      return true;
    }

    // ======== 信箱管理增强 API ========
    // 删除信箱
    const mbDeleteMatch = parsedUrl.pathname.match(/^\/api\/admin\/mailbox\/([^/]+)\/delete$/);
    if (req.method === 'POST' && mbDeleteMatch) {
      const mailboxId = decodeURIComponent(mbDeleteMatch[1]);
      if (!mailboxId) { jsonResponse(res, 400, { error: 'missing_id' }); return true; }
      const mailbox = persistentState.mailboxes[mailboxId];
      if (!mailbox) {
        jsonResponse(res, 404, { success: false, message: '信箱不存在（请确认信箱已通过前端创建或在本地状态中）' });
        return true;
      }
      const relatedLetters = Object.entries(persistentState.letters || {})
        .filter(([, l]) => l.mailboxId === mailboxId);
      for (const [letterId] of relatedLetters) delete persistentState.letters[letterId];
      delete persistentState.mailboxes[mailboxId];
      saveState();
      broadcastAdmin({ type: 'mailbox_deleted', mailboxId, action: 'deleted', timestamp: Date.now() });
      jsonResponse(res, 200, { success: true, mailboxId, lettersCleaned: relatedLetters.length });
      return true;
    }

    // 信箱成员管理 - 添加成员
    const mbAddMemberMatch = parsedUrl.pathname.match(/^\/api\/admin\/mailbox\/([^/]+)\/members$/);
    if (req.method === 'POST' && mbAddMemberMatch) {
      const mailboxId = decodeURIComponent(mbAddMemberMatch[1]);
      if (!mailboxId) { jsonResponse(res, 400, { error: 'missing_id' }); return true; }
      const body = await readJsonBody(req);
      const { accountKey, displayName, characterId } = body;
      const normalizedKey = normalizeAccountKey(accountKey);
      if (!normalizedKey) { jsonResponse(res, 400, { success: false, message: 'accountKey 必填' }); return true; }
      const mailbox = persistentState.mailboxes[mailboxId];
      if (!mailbox) { jsonResponse(res, 404, { success: false, message: '信箱不存在' }); return true; }
      if (!mailbox.memberAccountKeys) mailbox.memberAccountKeys = [];
      if (!mailbox.memberNames) mailbox.memberNames = {};
      if (!mailbox.memberCharacters) mailbox.memberCharacters = {};
      if (!mailbox.memberAccountKeys.includes(normalizedKey)) {
        mailbox.memberAccountKeys.push(normalizedKey);
      }
      if (displayName) mailbox.memberNames[normalizedKey] = displayName;
      if (characterId) {
        mailbox.memberCharacters[normalizedKey] = {
          characterId,
          boundAt: Date.now()
        };
      }
      mailbox.updatedAt = Date.now();
      saveState();
      broadcastAdmin({ type: 'mailbox_changed', mailboxId, action: 'updated', timestamp: Date.now() });
      jsonResponse(res, 200, { success: true, mailboxId, accountKey: normalizedKey, memberCount: mailbox.memberAccountKeys.length });
      return true;
    }

    // 信箱成员管理 - 移除成员
    const mbRemoveMemberMatch = parsedUrl.pathname.match(/^\/api\/admin\/mailbox\/([^/]+)\/members\/([^/]+)$/);
    if ((req.method === 'DELETE' || req.method === 'POST') && mbRemoveMemberMatch) {
      const mailboxId = decodeURIComponent(mbRemoveMemberMatch[1]);
      const accountKey = decodeURIComponent(mbRemoveMemberMatch[2]);
      if (!mailboxId || !accountKey) { jsonResponse(res, 400, { error: 'missing_params' }); return true; }
      const normalizedKey = normalizeAccountKey(accountKey);
      const mailbox = persistentState.mailboxes[mailboxId];
      if (!mailbox) { jsonResponse(res, 404, { success: false, message: '信箱不存在' }); return true; }
      if (mailbox.memberAccountKeys) {
        mailbox.memberAccountKeys = mailbox.memberAccountKeys.filter(k => normalizeAccountKey(k) !== normalizedKey);
      }
      if (mailbox.memberNames) {
        delete mailbox.memberNames[normalizedKey];
      }
      if (mailbox.memberCharacters) {
        delete mailbox.memberCharacters[normalizedKey];
      }
      mailbox.updatedAt = Date.now();
      saveState();
      broadcastAdmin({ type: 'mailbox_changed', mailboxId, action: 'updated', timestamp: Date.now() });
      jsonResponse(res, 200, { success: true, mailboxId, accountKey: normalizedKey, memberCount: (mailbox.memberAccountKeys || []).length });
      return true;
    }

    // 获取信箱的所有信件
    const mbLettersMatch = parsedUrl.pathname.match(/^\/api\/admin\/mailbox\/([^/]+)\/letters$/);
    if (req.method === 'GET' && mbLettersMatch) {
      const mailboxId = decodeURIComponent(mbLettersMatch[1]);
      if (!mailboxId) { jsonResponse(res, 400, { error: 'missing_id' }); return true; }
      const letters = Object.values(persistentState.letters || {})
        .filter(l => l.mailboxId === mailboxId)
        .map(l => ({
          id: l.id,
          letterTitle: l.letterTitle || '无标题',
          letterType: l.letterType || 'letter',
          deliveryStatus: l.deliveryStatus || 'draft',
          sender: l.sender || '',
          recipient: l.recipient || '',
          createdAt: l.createdAt || l.sentAt || l.updatedAt,
          updatedAt: l.updatedAt,
          sentAt: l.sentAt,
          direction: l.sender === l.recipient ? 'draft'
            : (l.deliveryStatus === 'sent' ? 'sent' : 'received')
        }))
        .sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0));
      jsonResponse(res, 200, { letters, count: letters.length, mailboxId });
      return true;
    }

    // 删除信件
    const letterDeleteMatch = parsedUrl.pathname.match(/^\/api\/admin\/letter\/([^/]+)\/delete$/);
    if (req.method === 'POST' && letterDeleteMatch) {
      const letterId = decodeURIComponent(letterDeleteMatch[1]);
      if (!letterId) { jsonResponse(res, 400, { error: 'missing_id' }); return true; }
      const letter = persistentState.letters[letterId];
      if (!letter) { jsonResponse(res, 404, { success: false, message: '信件不存在' }); return true; }
      const mailboxId = letter.mailboxId;
      delete persistentState.letters[letterId];
      saveState();
      broadcastAdmin({ type: 'letter_changed', mailboxId, letterId, action: 'deleted', timestamp: Date.now() });
      jsonResponse(res, 200, { success: true, letterId, mailboxId });
      return true;
    }

    // 切换信箱可见性
    const mbVisibilityMatch = parsedUrl.pathname.match(/^\/api\/admin\/mailbox\/([^/]+)\/visibility$/);
    if (req.method === 'POST' && mbVisibilityMatch) {
      const mailboxId = decodeURIComponent(mbVisibilityMatch[1]);
      if (!mailboxId) { jsonResponse(res, 400, { error: 'missing_id' }); return true; }
      const body = await readJsonBody(req);
      const { visibility } = body;
      if (!visibility || !['public', 'private'].includes(visibility)) {
        jsonResponse(res, 400, { success: false, message: 'visibility 必须为 public 或 private' });
        return true;
      }
      const mailbox = persistentState.mailboxes[mailboxId];
      if (!mailbox) { jsonResponse(res, 404, { success: false, message: '信箱不存在' }); return true; }
      mailbox.visibility = visibility;
      mailbox.updatedAt = Date.now();
      saveState();
      broadcastAdmin({ type: 'mailbox_changed', mailboxId, action: 'updated', timestamp: Date.now() });
      jsonResponse(res, 200, { success: true, mailboxId, visibility });
      return true;
    }

    // ======== 角色/地图定义管理 API ========

    // 上传/更新角色定义（同 id 可覆盖内置定义，同 id 被禁用则自动恢复）
    if (req.method === 'POST' && parsedUrl.pathname === '/api/game/characters/upload') {
      const body = await readJsonBody(req);
      const { worldCategory, definition } = body;
      if (!worldCategory || !definition || !definition.id) {
        jsonResponse(res, 400, { error: 'worldCategory 和 definition（含 id）必填' });
        return true;
      }
      const result = await mysqlDao.saveCharacterDefinition(worldCategory, definition);
      if (!result) {
        jsonResponse(res, 500, { success: false, message: '保存角色定义失败（可能 MySQL 未启用）' });
        return true;
      }
      // 实时更新内存中的角色定义
      const wasDisabled = isBuiltinCharacter(definition.id) && isBuiltinCharacterDisabled(definition.id);
      addCustomCharacter(worldCategory, definition);
      const isBuiltin = isBuiltinCharacter(definition.id);
      saveState();
      broadcastAdmin({ type: 'character_updated', characterId: definition.id, worldCategory, action: isBuiltin ? 'overridden' : 'uploaded', timestamp: Date.now() });
      jsonResponse(res, 200, { success: true, character: definition, kind: isBuiltin ? 'override' : 'custom', isRestore: wasDisabled });
      return true;
    }

    // 查询角色定义列表（内置 + 自定义，覆盖/禁用合并去重）
    if (req.method === 'GET' && parsedUrl.pathname === '/api/game/characters/list') {
      const worldCategory = parsedUrl.searchParams.get('worldCategory') || null;
      const rows = await mysqlDao.listAllCharacterDefinitions();
      const byId = new Map(rows.map(r => [r.id, r]));
      const out = [];

      // 内置角色：被覆盖则展示覆盖定义，被禁用则隐藏
      const builtInCharPairs = [[characterDefinitions, 'xiejian'], [poxiaoCharacterDefinitions, 'poxiao']];
      for (const [defs, wc] of builtInCharPairs) {
        for (const [id, def] of Object.entries(defs)) {
          if (worldCategory && def.category !== worldCategory) continue;
          const row = byId.get(id);
          if (row && !row.enabled) continue; // 已禁用
          if (row) {
            out.push({ ...row.definition, id: row.id, worldCategory: row.worldCategory, _builtin: true, _modified: true });
          } else {
            out.push({ ...def, _builtin: true, worldCategory: wc || def.category });
          }
        }
      }

      // 自定义角色（非内置 id）
      for (const row of rows) {
        if (!row.enabled) continue;
        if (isBuiltinCharacter(row.id)) continue; // 已作为内置处理
        if (worldCategory && row.worldCategory !== worldCategory) continue;
        out.push({ ...row.definition, id: row.id, worldCategory: row.worldCategory, _custom: true });
      }

      jsonResponse(res, 200, { characters: out });
      return true;
    }

    // 删除角色定义（内置 → 软删除禁用；自定义 → 硬删除）
    const charDeleteMatch = parsedUrl.pathname.match(/^\/api\/game\/characters\/([^/]+)\/delete$/);
    if (req.method === 'POST' && charDeleteMatch) {
      const characterId = decodeURIComponent(charDeleteMatch[1]);
      if (!characterId) { jsonResponse(res, 400, { error: 'missing_id' }); return true; }
      if (isBuiltinCharacter(characterId)) {
        const builtinDef = characterDefinitions[characterId] || poxiaoCharacterDefinitions[characterId];
        const wc = characterDefinitions[characterId] ? (builtinDef.category || 'xiejian') : 'poxiao';
        const result = await mysqlDao.disableCharacterDefinition(characterId, wc, builtinDef.name || characterId);
        if (!result) {
          jsonResponse(res, 500, { success: false, message: '禁用内置角色失败（可能 MySQL 未启用）' });
          return true;
        }
        disableBuiltinCharacter(characterId);
        saveState();
        broadcastAdmin({ type: 'character_updated', characterId, action: 'disabled', timestamp: Date.now() });
        jsonResponse(res, 200, { success: true, characterId, action: 'disabled', builtin: true });
        return true;
      }
      const result = await mysqlDao.deleteCharacterDefinition(characterId);
      removeCustomCharacter(characterId);
      saveState();
      broadcastAdmin({ type: 'character_updated', characterId, action: 'deleted', timestamp: Date.now() });
      jsonResponse(res, 200, { success: result, characterId, action: 'deleted' });
      return true;
    }

    // 还原角色定义（删除覆盖/禁用墓碑，恢复内置或移除自定义）
    const charRestoreMatch = parsedUrl.pathname.match(/^\/api\/game\/characters\/([^/]+)\/restore$/);
    if (req.method === 'POST' && charRestoreMatch) {
      const characterId = decodeURIComponent(charRestoreMatch[1]);
      if (!characterId) { jsonResponse(res, 400, { error: 'missing_id' }); return true; }
      const result = await mysqlDao.deleteCharacterDefinition(characterId);
      removeCustomCharacter(characterId);
      saveState();
      broadcastAdmin({ type: 'character_updated', characterId, action: 'restored', timestamp: Date.now() });
      jsonResponse(res, 200, { success: result, characterId, action: 'restored', builtin: isBuiltinCharacter(characterId) });
      return true;
    }

    // 上传/更新地图定义（同 key 可覆盖内置地图，同 key 被禁用则自动恢复）
    if (req.method === 'POST' && parsedUrl.pathname === '/api/game/maps/upload') {
      const body = await readJsonBody(req);
      const { worldCategory, definition } = body;
      if (!worldCategory || !definition || !definition.key) {
        jsonResponse(res, 400, { error: 'worldCategory 和 definition（含 key）必填' });
        return true;
      }
      // 确保 id 与 key 一致
      if (!definition.id) definition.id = definition.key;
      const result = await mysqlDao.saveMapDefinition(worldCategory, definition);
      if (!result) {
        jsonResponse(res, 500, { success: false, message: '保存地图定义失败（可能 MySQL 未启用）' });
        return true;
      }
      addCustomMap(worldCategory, definition);
      const isBuiltin = isBuiltinMap(definition.key);
      saveState();
      broadcastAdmin({ type: 'map_updated', mapKey: definition.key, worldCategory, action: isBuiltin ? 'overridden' : 'uploaded', timestamp: Date.now() });
      jsonResponse(res, 200, { success: true, map: definition, kind: isBuiltin ? 'override' : 'custom' });
      return true;
    }

    // 查询地图定义列表（内置 + 自定义，覆盖/禁用合并去重）
    if (req.method === 'GET' && parsedUrl.pathname === '/api/game/maps/list') {
      const worldCategory = parsedUrl.searchParams.get('worldCategory') || null;
      const rows = await mysqlDao.listAllMapDefinitions();
      const byId = new Map(rows.map(r => [r.id, r]));
      const out = [];

      // 内置地图：被覆盖则展示覆盖定义，被禁用则隐藏
      const builtInMapPairs = [[mapDefinitions, 'xiejian'], [poxiaoMapDefinitions, 'poxiao']];
      for (const [defs, wc] of builtInMapPairs) {
        for (const [key, def] of Object.entries(defs)) {
          if (worldCategory && def.category !== worldCategory) continue;
          const row = byId.get(key);
          if (row && !row.enabled) continue; // 已禁用
          if (row) {
            out.push({ ...row.definition, key: row.id, id: row.id, worldCategory: row.worldCategory, _builtin: true, _modified: true });
          } else {
            out.push({ ...def, _builtin: true, worldCategory: wc || def.category });
          }
        }
      }

      // 自定义地图（非内置 key）
      for (const row of rows) {
        if (!row.enabled) continue;
        if (isBuiltinMap(row.id)) continue; // 已作为内置处理
        if (worldCategory && row.worldCategory !== worldCategory) continue;
        out.push({ ...row.definition, key: row.id, id: row.id, worldCategory: row.worldCategory, _custom: true });
      }

      jsonResponse(res, 200, { maps: out });
      return true;
    }

    // 删除地图定义（内置 → 软删除禁用；自定义 → 硬删除）
    const mapDeleteMatch = parsedUrl.pathname.match(/^\/api\/game\/maps\/([^/]+)\/delete$/);
    if (req.method === 'POST' && mapDeleteMatch) {
      const mapKey = decodeURIComponent(mapDeleteMatch[1]);
      if (!mapKey) { jsonResponse(res, 400, { error: 'missing_key' }); return true; }
      if (isBuiltinMap(mapKey)) {
        const builtinDef = mapDefinitions[mapKey] || poxiaoMapDefinitions[mapKey];
        const wc = mapDefinitions[mapKey] ? 'xiejian' : 'poxiao';
        const result = await mysqlDao.disableMapDefinition(mapKey, wc, builtinDef.name || mapKey);
        if (!result) {
          jsonResponse(res, 500, { success: false, message: '禁用内置地图失败（可能 MySQL 未启用）' });
          return true;
        }
        disableBuiltinMap(mapKey);
        saveState();
        broadcastAdmin({ type: 'map_updated', mapKey, action: 'disabled', timestamp: Date.now() });
        jsonResponse(res, 200, { success: true, mapKey, action: 'disabled', builtin: true });
        return true;
      }
      const result = await mysqlDao.deleteMapDefinition(mapKey);
      removeCustomMap(mapKey);
      saveState();
      broadcastAdmin({ type: 'map_updated', mapKey, action: 'deleted', timestamp: Date.now() });
      jsonResponse(res, 200, { success: result, mapKey, action: 'deleted' });
      return true;
    }

    // 还原地图定义（删除覆盖/禁用墓碑，恢复内置或移除自定义）
    const mapRestoreMatch = parsedUrl.pathname.match(/^\/api\/game\/maps\/([^/]+)\/restore$/);
    if (req.method === 'POST' && mapRestoreMatch) {
      const mapKey = decodeURIComponent(mapRestoreMatch[1]);
      if (!mapKey) { jsonResponse(res, 400, { error: 'missing_key' }); return true; }
      const result = await mysqlDao.deleteMapDefinition(mapKey);
      removeCustomMap(mapKey);
      saveState();
      broadcastAdmin({ type: 'map_updated', mapKey, action: 'restored', timestamp: Date.now() });
      jsonResponse(res, 200, { success: result, mapKey, action: 'restored', builtin: isBuiltinMap(mapKey) });
      return true;
    }

    // 上传资源文件（角色帧动画/地图背景图等）
    if (req.method === 'POST' && parsedUrl.pathname === '/api/game/assets/upload') {
      if (!isMysqlEnabled()) {
        jsonResponse(res, 503, { error: 'asset_upload_requires_mysql' });
        return true;
      }
      const body = await readJsonBody(req);
      const { relativePath, fileName, base64Data } = body;
      if (!relativePath || !fileName || !base64Data) {
        jsonResponse(res, 400, { error: 'relativePath, fileName, base64Data 必填' });
        return true;
      }
      // 安全检查：禁止路径穿越
      const safeRelPath = relativePath.replace(/\.\./g, '').replace(/\\/g, '/');
      const safeFileName = fileName.replace(/\.\./g, '').replace(/\\/g, '/').replace(/[^a-zA-Z0-9_.\-/\u4e00-\u9fa5]/g, '_');
      const targetDir = path.join(ROOT_DIR, safeRelPath);
      const targetFile = path.join(targetDir, safeFileName);
      if (!targetFile.startsWith(ROOT_DIR)) {
        jsonResponse(res, 403, { error: '路径穿越被拒绝' });
        return true;
      }
      try {
        fs.mkdirSync(targetDir, { recursive: true });
        const buffer = Buffer.from(base64Data, 'base64');
        fs.writeFileSync(targetFile, buffer);
        // 双端互通：资产同时入库 MySQL + 写磁盘缓存（worldCategory 按路径推导）
        try {
          const rel = path.join(safeRelPath, safeFileName).replace(/\\/g, '/');
          const worldCategory = rel.includes('poxiao') ? 'poxiao'
            : rel.includes('xiejian') ? 'xiejian'
            : rel.includes('sendbox') ? 'game' : 'game';
          await assetStore.putAsset(rel, '', buffer, worldCategory);
        } catch (e) {
          console.warn('[assets/upload] 入库失败（磁盘文件已保存）:', e?.message || e);
        }
        jsonResponse(res, 200, { success: true, path: path.join(safeRelPath, safeFileName).replace(/\\/g, '/') });
      } catch (err) {
        jsonResponse(res, 500, { error: `写入文件失败: ${err.message}` });
      }
      return true;
    }

    // 资源包上传（multipart zip 文件）
    if (req.method === 'POST' && parsedUrl.pathname === '/api/game/packages/upload') {
      if (!isMysqlEnabled()) {
        jsonResponse(res, 503, { error: 'package_upload_requires_mysql' });
        return true;
      }
      return await handlePackageUpload(req, res);
    }

    jsonResponse(res, 404, { error: 'api_not_found' });
    return true;
  } catch (error) {
    const status = error.message === 'payload_too_large' ? 413 : 400;
    jsonResponse(res, status, { error: error.message || 'request_failed' });
    return true;
  }
}

// ===== 前后端分离架构 =====
// 本服务只提供 HTTP API 与 WebSocket，不再提供静态文件。
// 前端静态文件请通过 npx serve / nginx / server/staticServer.js 提供（默认端口 3005）。
const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  let parsedUrl = null;
  try {
    parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  } catch (_) {
    res.writeHead(400);
    res.end('Bad Request');
    return;
  }

  if (await handleApi(req, res, parsedUrl)) return;

  // 非 API 路由：告知用户这是后端 API 服务，前端请通过静态服务器访问
  jsonResponse(res, 404, {
    error: 'not_found',
    message: 'This is the backend API server. For the frontend, please use the static file server (default port 3005).',
    apiBase: `http://${req.headers.host}`
  });
});

const rooms = {};
const activeAccounts = new Map();

function getRoom(roomId) {
  if (!rooms[roomId]) {
    rooms[roomId] = {
      id: roomId,
      clients: new Map(),
      players: {}
    };
  }
  return rooms[roomId];
}

function send(ws, message) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

function broadcastToRoom(roomId, message, excludeId = null) {
  const room = rooms[roomId];
  if (!room) return;
  for (const [userId, client] of room.clients) {
    if (userId === excludeId) continue;
    send(client.ws, message);
  }
}

function broadcastToMap(room, mapKey, message, excludeId = null) {
  if (!room) return;
  for (const [userId, client] of room.clients) {
    if (userId === excludeId) continue;
    if (room.players[userId]?.mapKey !== mapKey) continue;
    send(client.ws, message);
  }
}

// ===== 管理后台 WebSocket 广播 =====
const adminConnections = new Set();

function broadcastAdmin(message) {
  for (const ws of adminConnections) {
    try {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
      } else {
        adminConnections.delete(ws);
      }
    } catch (_) {
      adminConnections.delete(ws);
    }
  }
}

function sendInventory(ws, accountKey) {
  send(ws, {
    type: 'inventory_state',
    inventory: inventoryState(accountKey),
    timestamp: Date.now()
  });
}

function rejectItem(ws, action, reason, extra = {}) {
  send(ws, {
    type: 'item_action_rejected',
    action,
    reason,
    ...extra,
    timestamp: Date.now()
  });
}

function distanceBetween(a, b) {
  return Math.hypot((Number(a?.x) || 0) - (Number(b?.x) || 0), (Number(a?.y) || 0) - (Number(b?.y) || 0));
}

// ===== 管理后台数据聚合 =====
function adminState() {
  const accounts = Object.entries(persistentState.accounts).map(([key, acc]) => ({
    accountKey: key,
    id: acc.id,
    username: acc.username || key,
    displayName: acc.displayName || key,
    role: acc.role || 'user',
    createdAt: acc.createdAt,
    lastSeenAt: acc.lastSeenAt,
    characterId: resolveCharacterId(key)
  }));

  const roleBindings = {};
  for (const [worldId, bindings] of Object.entries(persistentState.worldRoleBindings || {})) {
    roleBindings[worldId] = { ...bindings };
  }

  const mailboxes = Object.values(persistentState.mailboxes || {}).map(m => ({
    id: m.id,
    name: m.name,
    desc: m.desc || '',
    mailboxCode: m.mailboxCode,
    ownerAccountKey: m.ownerAccountKey,
    memberAccountKeys: m.memberAccountKeys || [],
    memberNames: m.memberNames || {},
    memberCharacters: m.memberCharacters || {},
    memberCount: (m.memberAccountKeys || []).length,
    isCustom: m.isCustom,
    visibility: m.visibility,
    updatedAt: m.updatedAt,
    letterCount: Object.values(persistentState.letters || {}).filter(l => l.mailboxId === m.id).length
  })).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

  const letterCount = Object.keys(persistentState.letters || {}).length;
  const sentCount = Object.values(persistentState.letters || {}).filter(l => l.deliveryStatus === 'sent').length;
  const draftCount = Object.values(persistentState.letters || {}).filter(l => l.deliveryStatus === 'draft').length;

  // 游戏世界 - 房间状态
  const roomsState = {};
  for (const [roomId, room] of Object.entries(rooms)) {
    roomsState[roomId] = {
      id: roomId,
      clientCount: room.clients.size,
      playerCount: Object.keys(room.players).length,
      players: Object.values(room.players).map(p => ({
        accountKey: p.accountKey || '',
        characterId: p.characterId || '',
        characterName: (p.characterId && GLOBAL_CHARACTER_NAMES[p.characterId]) || p.characterName || '',
        mapKey: p.mapKey || '',
        x: p.x,
        y: p.y,
        online: !!p.characterId
      }))
    };
  }

  // 物品实例
  const itemInstanceCount = Object.keys(persistentState.itemInstances || {}).length;
  const inventoryCount = Object.keys(persistentState.inventories || {}).length;

  // 战斗档案
  const combatProfiles = {};
  for (const [key, profile] of Object.entries(persistentState.combatProfiles || {})) {
    combatProfiles[key] = {
      accountKey: key,
      characterId: profile.characterId || '',
      hp: profile.hp,
      maxHp: profile.maxHp,
      atk: profile.atk,
      def: profile.def,
      spd: profile.spd,
      level: profile.level,
      exp: profile.exp
    };
  }

  return {
    accounts,
    accountCount: accounts.length,
    roleBindings,
    mailboxes,
    mailboxCount: mailboxes.length,
    letterCount,
    sentCount,
    draftCount,
    roomsState,
    roomCount: Object.keys(rooms).length,
    itemInstanceCount,
    inventoryCount,
    combatProfiles,
    serverInfo: {
      port: PORT,
      mysqlEnabled: isMysqlEnabled(),
      httpOnly: HTTP_ONLY,
      definitionsVersion: DEFINITIONS_VERSION,
      dataDir: DATA_DIR,
      time: Date.now()
    }
  };
}

function getOccupiedCharacters(worldId = 'mailbox-xiejian') {
  return Object.keys(roleBindingsForWorld(worldId));
}

function broadcastCharacterOccupancy(room) {
  const bindings = roleBindingsForWorld(room.id);
  broadcastToRoom(room.id, {
    type: 'character_occupancy',
    occupiedCharacters: getOccupiedCharacters(room.id),
    roleBindings: bindings,
    timestamp: Date.now()
  });
}

function publicPlayers(room, excludeId = null) {
  const players = {};
  for (const [userId, player] of Object.entries(room.players)) {
    if (userId !== excludeId) {
      players[userId] = {
        ...player,
        combat: player.characterId ? combatState(userId) : null
      };
    }
  }
  return players;
}

function removeClient(roomId, userId, reason = 'leave', expectedWs = null) {
  const room = rooms[roomId];
  if (!room || !userId || !room.clients.has(userId)) return;
  const currentClient = room.clients.get(userId);
  if (expectedWs && currentClient.ws !== expectedWs) return;

  room.clients.delete(userId);
  delete room.players[userId];
  const active = activeAccounts.get(userId);
  if (!active || !expectedWs || active.ws === expectedWs) {
    activeAccounts.delete(userId);
  }
  if (persistentState.combatProfiles[userId]) {
    persistentState.combatProfiles[userId].lastOnlineAt = Date.now();
    saveState();
  }

  broadcastToRoom(roomId, {
    type: 'leave',
    userId,
    reason,
    timestamp: Date.now()
  }, userId);
  broadcastCharacterOccupancy(room);

  if (room.clients.size === 0) {
    delete rooms[roomId];
  }
}

let wss = null;
if (!HTTP_ONLY) {
  wss = new WebSocket.Server({ server });

  wss.on('connection', (ws, req) => {
    const clientIP = req.socket.remoteAddress;
    let clientId = null;
    let currentRoomId = null;

    // admin 连接识别：URL 带 ?admin=true 参数
    const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
    const isAdmin = url.searchParams.get('admin') === 'true';
    if (isAdmin) {
      adminConnections.add(ws);
      send(ws, { type: 'admin_connected', timestamp: Date.now() });
    }

    ws.on('close', () => {
      if (isAdmin) adminConnections.delete(ws);
    });
    ws.on('error', () => {
      if (isAdmin) adminConnections.delete(ws);
    });

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());

        if (message.type === 'join') {
          const requestedUserId = normalizeAccountKey(
            message.accountKey || message.username || message.userId
          );
          const requestedRoomId = String(message.roomId || '').trim();
          if (!requestedUserId || !requestedRoomId) {
            send(ws, { type: 'join_rejected', reason: 'invalid_join' });
            return;
          }

          let room = getRoom(requestedRoomId);
          const previousSession = activeAccounts.get(requestedUserId);
          if (previousSession && previousSession.ws !== ws) {
            send(previousSession.ws, {
              type: 'session_replaced',
              accountKey: requestedUserId,
              timestamp: Date.now()
            });
            removeClient(previousSession.roomId, requestedUserId, 'session_replaced', previousSession.ws);
            try {
              previousSession.ws.close(4001, 'session_replaced');
            } catch (_) {}
            room = getRoom(requestedRoomId);
          }
          if (room.clients.size >= MAX_ROOM_CONNECTIONS) {
            send(ws, {
              type: 'join_rejected',
              reason: 'room_full',
              maxConnections: MAX_ROOM_CONNECTIONS
            });
            return;
          }

          clientId = requestedUserId;
          currentRoomId = requestedRoomId;
          const account = syncAccount({
            accountKey: clientId,
            username: message.username || clientId,
            displayName: message.displayName || message.username || clientId,
            role: message.role || 'user'
          });
          const profile = accountProfile(clientId, currentRoomId);
          const mode = (message.mode === 'xiejian' || message.mode === 'poxiao') ? message.mode : 'default';
          const isGameMode = mode === 'xiejian' || mode === 'poxiao';
          const initialCharacter = isGameMode
            ? String((mode === 'poxiao' ? profile.poxiaoCharacterId : profile.xiejianCharacterId) || '')
            : String(message.characterId || '');
          const initialMapKey = isGameMode
            ? String((mode === 'poxiao' ? (profile.lastPoxiaoMapKey || DEFAULT_POXIAO_MAP) : (profile.lastXiejianMapKey || DEFAULT_XIEJIAN_MAP)) || '')
            : String(message.mapKey || '');
          if (initialCharacter) {
            // 挟剑模式 与 寒门(default)模式 都发放初始装备
            grantStarterItems(clientId, initialCharacter);
          }

          room.clients.set(clientId, {
            ws,
            userId: clientId,
            accountKey: clientId,
            mode,
            lastSeenAt: Date.now()
          });
          activeAccounts.set(clientId, { ws, roomId: currentRoomId });
          room.players[clientId] = {
            userId: clientId,
            accountKey: clientId,
            username: account.username,
            displayName: account.displayName,
            characterId: initialCharacter,
            mapKey: initialMapKey,
            x: Number(message.x) || 0,
            y: Number(message.y) || 0,
            direction: message.direction || 'down',
            action: message.action || 'personality',
            frame: Number(message.frame) || 0,
            moving: false,
            ready: !isGameMode || Boolean(initialCharacter),
            lastUpdate: Date.now(),
            isOnline: true
          };

          send(ws, {
            type: 'room_state',
            roomId: currentRoomId,
            players: publicPlayers(room, clientId),
            playerCount: room.clients.size,
            maxConnections: MAX_ROOM_CONNECTIONS,
            occupiedCharacters: getOccupiedCharacters(currentRoomId),
            roleBindings: roleBindingsForWorld(currentRoomId),
            accountProfile: {
              accountKey: clientId,
              xiejianCharacterId: profile.xiejianCharacterId || '',
              lastXiejianMapKey: profile.lastXiejianMapKey || DEFAULT_XIEJIAN_MAP,
              poxiaoCharacterId: profile.poxiaoCharacterId || '',
              lastPoxiaoMapKey: profile.lastPoxiaoMapKey || DEFAULT_POXIAO_MAP
            },
            itemDefinitions: isGameMode ? ALL_ITEM_DEFINITIONS : {},
            inventory: isGameMode ? inventoryState(clientId) : null,
            combatProfile: isGameMode ? combatState(clientId) : null,
            worldItems: isGameMode ? worldItemsForMap(initialMapKey) : [],
            definitionsVersion: DEFINITIONS_VERSION
          });

          if (room.players[clientId].ready) {
            broadcastToRoom(currentRoomId, {
              type: 'join',
              ...room.players[clientId],
              combat: isGameMode ? combatState(clientId) : null,
              timestamp: Date.now()
            }, clientId);
          }
          saveState();
          console.log(`[${currentRoomId}] joined: ${clientId} (${room.clients.size}/${MAX_ROOM_CONNECTIONS}) mode=${mode} char=${initialCharacter || '-'} map=${initialMapKey || '-'}`);
          return;
        }

        if (!currentRoomId || !clientId) return;
        const room = rooms[currentRoomId];
        const player = room && room.players[clientId];
        if (!room || !player) return;
        const connectedClient = room.clients.get(clientId);
        if (!connectedClient || connectedClient.ws !== ws) return;
        connectedClient.lastSeenAt = Date.now();

        if (message.type === 'select_character') {
          const characterId = String(message.characterId || '');
          const isPoxiaoChar = POXIAO_CHARACTERS_SET.has(characterId);
          if (!XIEJIAN_CHARACTERS.has(characterId) && !isPoxiaoChar) {
            send(ws, { type: 'character_rejected', characterId, reason: 'unavailable' });
            return;
          }

          const profile = accountProfile(clientId, currentRoomId);
          const worldBindings = roleBindingsForWorld(currentRoomId);

          // Check if target character is occupied by another player
          const owner = worldBindings[characterId];
          if (owner && owner !== clientId) {
            send(ws, { type: 'character_rejected', characterId, reason: 'occupied' });
            return;
          }

          // If player has a bound character and it's not the target character,
          // allow switching only if target is not occupied (already checked above)
          const profileCharKey = isPoxiaoChar ? 'poxiaoCharacterId' : 'xiejianCharacterId';
          const profileMapKey = isPoxiaoChar ? 'lastPoxiaoMapKey' : 'lastXiejianMapKey';
          const defaultMap = isPoxiaoChar ? DEFAULT_POXIAO_MAP : DEFAULT_XIEJIAN_MAP;
          if (profile[profileCharKey] && profile[profileCharKey] !== characterId) {
            // Remove the old character binding
            delete worldBindings[profile[profileCharKey]];
          }

          const previousCharacter = profile[profileCharKey] || player.characterId;
          worldBindings[characterId] = clientId;
          profile[profileCharKey] = characterId;
          profile[profileMapKey] = profile[profileMapKey] || defaultMap;
          player.characterId = characterId;
          player.mapKey = profile[profileMapKey];
          player.ready = true;
          player.lastUpdate = Date.now();
          grantStarterItems(clientId, characterId);
          saveState();

          send(ws, {
            type: 'character_selected',
            characterId,
            previousCharacter,
            mapKey: profile[profileMapKey],
            occupiedCharacters: getOccupiedCharacters(currentRoomId),
            roleBindings: worldBindings,
            permanent: true
          });
          sendInventory(ws, clientId);
          send(ws, {
            type: 'world_items',
            mapKey: player.mapKey,
            items: worldItemsForMap(player.mapKey),
            timestamp: Date.now()
          });
          broadcastToRoom(currentRoomId, {
            type: 'player_ready',
            ...player,
            combat: combatState(clientId),
            timestamp: Date.now()
          }, clientId);
          broadcastCharacterOccupancy(room);
          console.log(`[${currentRoomId}] ${clientId} select_character -> ${characterId} (map=${player.mapKey}, ready=true)`);
          return;
        }

        if (message.type === 'map_change') {
          if (!player.ready) return;
          const requestedMapKey = String(message.mapKey || '');
          const isPoxiaoMap = String(requestedMapKey).startsWith('px-');
          const validMap = isPoxiaoMap ? poxiaoMapDimensions[requestedMapKey] : mapDimensions[requestedMapKey];
          if (!validMap) {
            send(ws, { type: 'map_change_rejected', reason: 'invalid_map', mapKey: requestedMapKey });
            return;
          }
          player.mapKey = requestedMapKey;
          player.x = Number(message.x) || 0;
          player.y = Number(message.y) || 0;
          player.lastUpdate = Date.now();
          const profile = accountProfile(clientId, currentRoomId);
          if (isPoxiaoMap) {
            profile.lastPoxiaoMapKey = player.mapKey;
          } else {
            profile.lastXiejianMapKey = player.mapKey || DEFAULT_XIEJIAN_MAP;
          }
          saveState();
          send(ws, {
            type: 'world_items',
            mapKey: player.mapKey,
            items: worldItemsForMap(player.mapKey),
            timestamp: Date.now()
          });
          broadcastToRoom(currentRoomId, {
            type: 'map_change',
            userId: clientId,
            mapKey: player.mapKey,
            x: player.x,
            y: player.y,
            timestamp: player.lastUpdate
          }, clientId);
          console.log(`[${currentRoomId}] ${clientId} map_change -> ${player.mapKey} (${player.x},${player.y})`);
          return;
        }

        if (message.type === 'state') {
          if (!player.ready) return;
          const combat = ensureCombatProfile(clientId, player.characterId);
          const movementLocked = Date.now() < (combat.immobilizedUntil || 0);
          if (!movementLocked && message.x !== undefined) player.x = Number(message.x) || 0;
          if (!movementLocked && message.y !== undefined) player.y = Number(message.y) || 0;
          if (message.direction !== undefined) player.direction = message.direction;
          if (message.action !== undefined) player.action = message.action;
          if (message.frame !== undefined) player.frame = Number(message.frame) || 0;
          if (message.moving !== undefined) player.moving = movementLocked ? false : Boolean(message.moving);
          player.lastUpdate = Date.now();
          player.isOnline = true;

          broadcastToRoom(currentRoomId, {
            type: 'state',
            userId: clientId,
            characterId: player.characterId,
            mapKey: player.mapKey,
            x: player.x,
            y: player.y,
            direction: player.direction,
            action: player.action,
            frame: player.frame,
            moving: player.moving,
            combat: combatState(clientId),
            timestamp: player.lastUpdate
          }, clientId);
          return;
        }

        if (message.type === 'item_pickup') {
          const instanceId = String(message.instanceId || '');
          const instance = persistentState.itemInstances[instanceId];
          const definition = instance && ALL_ITEM_DEFINITIONS[instance.definitionId];
          if (!instance || instance.locationType !== 'world') {
            rejectItem(ws, 'pickup', 'already_taken', { instanceId });
            return;
          }
          if (instance.mapKey !== player.mapKey) {
            rejectItem(ws, 'pickup', 'different_map', { instanceId });
            return;
          }
          const itemPosition = unifiedWorldPosition(instance.mapKey, instance.nx, instance.ny);
          if (distanceBetween(player, itemPosition) > 80) {
            rejectItem(ws, 'pickup', 'too_far', { instanceId });
            return;
          }
          if (!definition?.portable) {
            send(ws, {
              type: 'world_item_inspected',
              instance: publicInstance(instance),
              timestamp: Date.now()
            });
            return;
          }
          const inventory = ensureInventory(clientId);
          instance.locationType = 'inventory';
          instance.ownerAccountKey = clientId;
          instance.mapKey = '';
          instance.equippedSlot = '';
          instance.acquisition = {
            method: 'pickup',
            at: Date.now(),
            mapKey: instance.origin?.mapKey || player.mapKey,
            nodeId: instance.origin?.nodeId || instance.nodeId
          };
          if (!inventory.itemIds.includes(instanceId)) inventory.itemIds.push(instanceId);
          saveState();
          
          // 同步到 MySQL
          if (isMysqlEnabled()) {
            mysqlDao.saveItemInstance(instance).catch(err => {
              console.warn('[item_pickup] 保存道具实例到 MySQL 失败:', err?.message || err);
            });
            mysqlDao.saveInventory(clientId, inventory).catch(err => {
              console.warn('[item_pickup] 保存背包到 MySQL 失败:', err?.message || err);
            });
          }
          
          broadcastToMap(room, player.mapKey, {
            type: 'world_item_removed',
            instanceId,
            mapKey: player.mapKey,
            reason: 'picked_up',
            byAccountKey: clientId,
            timestamp: Date.now()
          });
          sendInventory(ws, clientId);
          return;
        }

        if (message.type === 'item_drop') {
          const instanceId = String(message.instanceId || '');
          const inventory = ensureInventory(clientId);
          const instance = persistentState.itemInstances[instanceId];
          if (!instance || instance.ownerAccountKey !== clientId || !inventory.itemIds.includes(instanceId)) {
            rejectItem(ws, 'drop', 'not_owned', { instanceId });
            return;
          }
          const routePosition = nearestRoutePosition(player.mapKey, player.x, player.y);
          for (const [slot, equippedId] of Object.entries(inventory.equipment)) {
            if (equippedId === instanceId) inventory.equipment[slot] = '';
          }
          inventory.quickSlots = inventory.quickSlots.map(id => id === instanceId ? '' : id);
          instance.locationType = 'world';
          instance.ownerAccountKey = '';
          instance.equippedSlot = '';
          instance.mapKey = player.mapKey;
          instance.nodeId = routePosition.nodeId;
          instance.nx = routePosition.nx;
          instance.ny = routePosition.ny;
          inventory.itemIds = inventory.itemIds.filter(id => id !== instanceId);
          saveState();
          
          // 同步到 MySQL
          if (isMysqlEnabled()) {
            mysqlDao.saveItemInstance(instance).catch(err => {
              console.warn('[item_drop] 保存道具实例到 MySQL 失败:', err?.message || err);
            });
            mysqlDao.saveInventory(clientId, inventory).catch(err => {
              console.warn('[item_drop] 保存背包到 MySQL 失败:', err?.message || err);
            });
          }
          
          sendInventory(ws, clientId);
          broadcastToMap(room, player.mapKey, {
            type: 'world_item_spawned',
            instance: publicInstance(instance),
            timestamp: Date.now()
          });
          return;
        }

        if (message.type === 'item_gift') {
          const instanceId = String(message.instanceId || '');
          const targetAccountKey = normalizeAccountKey(message.toAccountKey);
          const target = room.players[targetAccountKey];
          const targetClient = room.clients.get(targetAccountKey);
          const inventory = ensureInventory(clientId);
          const instance = persistentState.itemInstances[instanceId];
          if (!instance || instance.ownerAccountKey !== clientId || !inventory.itemIds.includes(instanceId)) {
            rejectItem(ws, 'gift', 'not_owned', { instanceId });
            return;
          }
          if (!target || !targetClient || target.mapKey !== player.mapKey) {
            rejectItem(ws, 'gift', 'different_map', { instanceId });
            return;
          }
          if (distanceBetween(player, target) > 96) {
            rejectItem(ws, 'gift', 'too_far', { instanceId });
            return;
          }
          for (const [slot, equippedId] of Object.entries(inventory.equipment)) {
            if (equippedId === instanceId) inventory.equipment[slot] = '';
          }
          inventory.quickSlots = inventory.quickSlots.map(id => id === instanceId ? '' : id);
          inventory.itemIds = inventory.itemIds.filter(id => id !== instanceId);
          const targetInventory = ensureInventory(targetAccountKey);
          if (!targetInventory.itemIds.includes(instanceId)) targetInventory.itemIds.push(instanceId);
          instance.ownerAccountKey = targetAccountKey;
          instance.equippedSlot = '';
          instance.acquisition = {
            method: 'gift',
            at: Date.now(),
            fromAccountKey: clientId,
            fromIdentity: getAccountIdentity(clientId, currentRoomId).identityName
          };
          saveState();
          sendInventory(ws, clientId);
          sendInventory(targetClient.ws, targetAccountKey);
          send(ws, { type: 'item_action_success', action: 'gift', instanceId, toAccountKey: targetAccountKey });
          send(targetClient.ws, { type: 'item_action_success', action: 'received', instanceId, fromAccountKey: clientId });
          return;
        }

        if (message.type === 'item_equip') {
          const instanceId = String(message.instanceId || '');
          const inventory = ensureInventory(clientId);
          const instance = persistentState.itemInstances[instanceId];
          const definition = instance && ALL_ITEM_DEFINITIONS[instance.definitionId];
          if (!instance || instance.ownerAccountKey !== clientId || !inventory.itemIds.includes(instanceId)) {
            rejectItem(ws, 'equip', 'not_owned', { instanceId });
            return;
          }
          if (!definition?.equipmentSlot) {
            rejectItem(ws, 'equip', 'not_equipment', { instanceId });
            return;
          }
          const slot = definition.equipmentSlot;
          const oldId = inventory.equipment[slot];
          if (oldId === instanceId) {
            inventory.equipment[slot] = '';
            instance.equippedSlot = '';
          } else {
            if (oldId && persistentState.itemInstances[oldId]) {
              persistentState.itemInstances[oldId].equippedSlot = '';
            }
            inventory.equipment[slot] = instanceId;
            instance.equippedSlot = slot;
          }
          saveState();
          sendInventory(ws, clientId);
          broadcastToMap(room, player.mapKey, {
            type: 'combat_state',
            userId: clientId,
            combat: combatState(clientId),
            timestamp: Date.now()
          });
          return;
        }

        if (message.type === 'item_use') {
          const instanceId = String(message.instanceId || '');
          const inventory = ensureInventory(clientId);
          const instance = persistentState.itemInstances[instanceId];
          const definition = instance && ALL_ITEM_DEFINITIONS[instance.definitionId];
          if (!instance || instance.ownerAccountKey !== clientId || !inventory.itemIds.includes(instanceId)) {
            rejectItem(ws, 'use', 'not_owned', { instanceId });
            return;
          }
          if (!definition?.effect) {
            rejectItem(ws, 'use', 'not_usable', { instanceId });
            return;
          }
          const combat = ensureCombatProfile(clientId, player.characterId);
          if (definition.effect.kind === 'heal') {
            combat.hp = Math.min(100, combat.hp + definition.effect.amount);
          } else if (definition.effect.kind === 'antidote') {
            combat.poisonedUntil = 0;
            combat.nextPoisonTickAt = 0;
          } else if (definition.effect.kind === 'coat') {
            inventory.pendingCoating = definition.effect.status;
          }
          inventory.itemIds = inventory.itemIds.filter(id => id !== instanceId);
          inventory.quickSlots = inventory.quickSlots.map(id => id === instanceId ? '' : id);
          delete persistentState.itemInstances[instanceId];
          if (definition.respawnMs > 0 && instance.origin?.mapKey) {
            persistentState.itemRespawns.push({
              definitionId: instance.definitionId,
              origin: instance.origin,
              dueAt: Date.now() + definition.respawnMs,
              generation: (instance.generation || 1) + 1
            });
          }
          saveState();
          sendInventory(ws, clientId);
          broadcastToMap(room, player.mapKey, {
            type: 'combat_state',
            userId: clientId,
            combat: combatState(clientId),
            timestamp: Date.now()
          });
          return;
        }

        if (message.type === 'item_quick_assign') {
          const instanceId = String(message.instanceId || '');
          const slotIndex = Math.max(0, Math.min(3, Number(message.slotIndex) || 0));
          const inventory = ensureInventory(clientId);
          if (instanceId && !inventory.itemIds.includes(instanceId)) {
            rejectItem(ws, 'quick_assign', 'not_owned', { instanceId });
            return;
          }
          inventory.quickSlots[slotIndex] = instanceId;
          saveState();
          sendInventory(ws, clientId);
          return;
        }

        if (message.type === 'combat_attack') {
          const targetAccountKey = normalizeAccountKey(message.targetAccountKey);
          const target = room.players[targetAccountKey];
          const targetClient = room.clients.get(targetAccountKey);
          const attackerCombat = ensureCombatProfile(clientId, player.characterId);
          const now = Date.now();
          if (!target || !targetClient || targetAccountKey === clientId || target.mapKey !== player.mapKey) {
            rejectItem(ws, 'attack', 'invalid_target');
            return;
          }
          if (distanceBetween(player, target) > 96) {
            rejectItem(ws, 'attack', 'too_far');
            return;
          }
          if (now - (attackerCombat.lastAttackAt || 0) < COMBAT_ATTACK_COOLDOWN_MS) {
            rejectItem(ws, 'attack', 'cooldown');
            return;
          }
          if (now < (attackerCombat.immobilizedUntil || 0)) {
            rejectItem(ws, 'attack', 'immobilized');
            return;
          }
          const targetCombat = ensureCombatProfile(targetAccountKey, target.characterId);
          if (now < (targetCombat.invulnerableUntil || 0)) {
            rejectItem(ws, 'attack', 'target_invulnerable');
            return;
          }
          attackerCombat.lastAttackAt = now;
          const attackerStats = combatState(clientId);
          const targetStats = combatState(targetAccountKey);
          let damage = Math.max(1, attackerStats.attack - targetStats.defense);
          const targetInventory = ensureInventory(targetAccountKey);
          const accessoryId = targetInventory.equipment.accessory;
          const accessory = persistentState.itemInstances[accessoryId];
          const hasGoldPlaque = accessory?.definitionId === 'life_saving_gold_plaque';
          if (damage >= targetCombat.hp && hasGoldPlaque && now >= (targetCombat.goldPlaqueCooldownUntil || 0)) {
            damage = Math.max(0, targetCombat.hp - 1);
            targetCombat.goldPlaqueCooldownUntil = now + 600000;
          }
          targetCombat.hp = Math.max(0, targetCombat.hp - damage);
          const attackerInventory = ensureInventory(clientId);
          const coating = attackerInventory.pendingCoating;
          attackerInventory.pendingCoating = '';
          if (coating === 'poison') {
            targetCombat.poisonedUntil = now + 10000;
            targetCombat.nextPoisonTickAt = now + 2000;
          } else if (coating === 'sleep') {
            targetCombat.immobilizedUntil = now + 2000;
          }
          const hit = {
            type: 'combat_hit',
            attackerAccountKey: clientId,
            targetAccountKey,
            mapKey: player.mapKey,
            damage,
            coating,
            targetCombat: combatState(targetAccountKey),
            attackerCombat: combatState(clientId),
            timestamp: now
          };
          broadcastToMap(room, player.mapKey, hit);
          sendInventory(ws, clientId);
          sendInventory(targetClient.ws, targetAccountKey);
          if (targetCombat.hp <= 0) {
            const defeatedMap = target.mapKey;
            const isPoxiaoWorld = String(defeatedMap).startsWith('px-');
            const returnMap = isPoxiaoWorld ? DEFAULT_POXIAO_MAP : DEFAULT_XIEJIAN_MAP;
            targetCombat.hp = 100;
            targetCombat.poisonedUntil = 0;
            targetCombat.nextPoisonTickAt = 0;
            targetCombat.immobilizedUntil = 0;
            targetCombat.invulnerableUntil = now + 5000;
            target.mapKey = returnMap;
            const spawn = unifiedWorldPosition(returnMap, 0.5, 0.82);
            target.x = spawn.x;
            target.y = spawn.y;
            const targetProfile = accountProfile(targetAccountKey, currentRoomId);
            if (isPoxiaoWorld) targetProfile.lastPoxiaoMapKey = returnMap;
            else targetProfile.lastXiejianMapKey = returnMap;
            broadcastToMap(room, defeatedMap, {
              type: 'player_defeated',
              userId: targetAccountKey,
              byAccountKey: clientId,
              returnMapKey: returnMap,
              x: target.x,
              y: target.y,
              timestamp: now
            }, targetAccountKey);
            send(targetClient.ws, {
              type: 'player_defeated',
              userId: targetAccountKey,
              byAccountKey: clientId,
              returnMapKey: returnMap,
              x: target.x,
              y: target.y,
              timestamp: now
            });
            send(targetClient.ws, {
              type: 'world_items',
              mapKey: returnMap,
              items: worldItemsForMap(returnMap),
              timestamp: now
            });
            sendInventory(targetClient.ws, targetAccountKey);
            broadcastToRoom(currentRoomId, {
              type: 'map_change',
              userId: targetAccountKey,
              mapKey: returnMap,
              x: target.x,
              y: target.y,
              timestamp: now
            }, targetAccountKey);
          }
          saveState();
          return;
        }

        if (message.type === 'action') {
          if (!player.ready) return;
          broadcastToRoom(currentRoomId, {
            type: 'action',
            userId: clientId,
            mapKey: player.mapKey,
            action: message.action,
            timestamp: Date.now()
          }, clientId);
          return;
        }

        if (message.type === 'interact') {
          const target = room.players[message.toUserId];
          const targetClient = room.clients.get(message.toUserId);
          if (!target || !targetClient || target.mapKey !== player.mapKey) {
            send(ws, { type: 'interact_rejected', reason: 'different_map' });
            return;
          }
          send(targetClient.ws, {
            type: 'interact',
            fromUserId: clientId,
            toUserId: message.toUserId,
            actionType: message.actionType,
            timestamp: Date.now()
          });
          return;
        }

        if (message.type === 'private_chat') {
          const toUserId = message.toUserId;
          if (!toUserId) {
            send(ws, { type: 'error', reason: 'missing toUserId for private_chat' });
            return;
          }
          const targetClient = room.clients.get(toUserId);
          if (targetClient) {
            send(targetClient.ws, {
              type: 'private_chat',
              userId: clientId,
              accountKey: message.accountKey || clientId,
              messageId: message.messageId || '',
              mapKey: player.mapKey,
              content: message.content,
              senderName: message.senderName || clientId,
              characterId: message.characterId || '',
              timestamp: Date.now()
            });
          }
          // Also send back to sender so they can see their own message
          send(ws, {
            type: 'private_chat',
            userId: clientId,
            accountKey: message.accountKey || clientId,
            messageId: message.messageId || '',
            mapKey: player.mapKey,
            content: message.content,
            senderName: message.senderName || clientId,
            characterId: message.characterId || '',
            timestamp: Date.now()
          });
          return;
        }

        if (message.type === 'chat') {
          broadcastToRoom(currentRoomId, {
            type: 'chat',
            userId: clientId,
            accountKey: message.accountKey || clientId,
            messageId: message.messageId || '',
            mapKey: player.mapKey,
            content: message.content,
            senderName: message.senderName || clientId,
            characterId: message.characterId || '',
            timestamp: Date.now()
          }, clientId);
          return;
        }

        // 万物送信：信件送达广播（带 journey 快照，收端本地合并）
        if (message.type === 'mail_delivery') {
          broadcastToRoom(currentRoomId, {
            type: 'mail_delivery',
            fromUserId: clientId,
            letterId: message.letterId,
            mailboxId: message.mailboxId,
            journey: message.journey,
            timestamp: Date.now()
          }, clientId);
          return;
        }

        if (message.type === 'leave') {
          removeClient(currentRoomId, clientId, 'leave', ws);
          clientId = null;
          currentRoomId = null;
          return;
        }

        if (message.type === 'ping') {
          connectedClient.lastSeenAt = Date.now();
          send(ws, { type: 'pong', timestamp: Date.now() });
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      if (currentRoomId && clientId) {
        removeClient(currentRoomId, clientId, 'disconnect', ws);
        console.log(`[${currentRoomId}] disconnected: ${clientId} (${clientIP})`);
      }
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  setInterval(() => {
    const cutoff = Date.now() - 15000;
    for (const [accountKey, session] of activeAccounts) {
      const room = rooms[session.roomId];
      const client = room?.clients.get(accountKey);
      if (!client || client.ws !== session.ws) {
        activeAccounts.delete(accountKey);
        continue;
      }
      if (client.lastSeenAt >= cutoff) continue;
      send(client.ws, { type: 'connection_timeout', timestamp: Date.now() });
      removeClient(session.roomId, accountKey, 'timeout', client.ws);
      try {
        client.ws.close(4000, 'timeout');
      } catch (_) {}
    }
  }, 5000).unref();

  setInterval(() => {
    const now = Date.now();
    let changed = false;

    const due = persistentState.itemRespawns.filter(entry => entry.dueAt <= now);
    persistentState.itemRespawns = persistentState.itemRespawns.filter(entry => entry.dueAt > now);
    for (const entry of due) {
      const instanceId = `respawn:${entry.definitionId}:${entry.dueAt}:${Math.random().toString(36).slice(2, 8)}`;
      const instance = createItemInstance(instanceId, entry.definitionId, {
        locationType: 'world',
        ...entry.origin,
        origin: entry.origin,
        generation: entry.generation
      });
      if (!instance) continue;
      persistentState.itemInstances[instanceId] = instance;
      changed = true;
      for (const room of Object.values(rooms)) {
        broadcastToMap(room, instance.mapKey, {
          type: 'world_item_spawned',
          instance: publicInstance(instance),
          timestamp: now
        });
      }
    }

    for (const [accountKey, session] of activeAccounts) {
      const room = rooms[session.roomId];
      const player = room?.players[accountKey];
      const client = room?.clients.get(accountKey);
      const combat = persistentState.combatProfiles[accountKey];
      if (!player || !client || !combat) continue;
      if (combat.poisonedUntil && combat.poisonedUntil <= now) {
        combat.poisonedUntil = 0;
        combat.nextPoisonTickAt = 0;
        changed = true;
      }
      if (!combat.poisonedUntil || now < (combat.nextPoisonTickAt || 0)) continue;
      combat.hp = Math.max(0, combat.hp - 3);
      combat.nextPoisonTickAt = now + 2000;
      changed = true;
      broadcastToMap(room, player.mapKey, {
        type: 'combat_hit',
        attackerAccountKey: 'status:poison',
        targetAccountKey: accountKey,
        mapKey: player.mapKey,
        damage: 3,
        coating: 'poison_tick',
        targetCombat: combatState(accountKey),
        timestamp: now
      });
      sendInventory(client.ws, accountKey);
      if (combat.hp > 0) continue;

      const oldMapKey = player.mapKey;
      const isPoxiaoWorld = String(oldMapKey).startsWith('px-');
      const returnMap = isPoxiaoWorld ? DEFAULT_POXIAO_MAP : DEFAULT_XIEJIAN_MAP;
      combat.hp = 100;
      combat.poisonedUntil = 0;
      combat.nextPoisonTickAt = 0;
      combat.immobilizedUntil = 0;
      combat.invulnerableUntil = now + 5000;
      player.mapKey = returnMap;
      const spawn = unifiedWorldPosition(returnMap, 0.5, 0.82);
      player.x = spawn.x;
      player.y = spawn.y;
      const poisonProfile = accountProfile(accountKey, session.roomId);
      if (isPoxiaoWorld) poisonProfile.lastPoxiaoMapKey = returnMap;
      else poisonProfile.lastXiejianMapKey = returnMap;
      broadcastToMap(room, oldMapKey, {
        type: 'player_defeated',
        userId: accountKey,
        byAccountKey: 'status:poison',
        returnMapKey: returnMap,
        x: player.x,
        y: player.y,
        timestamp: now
      }, accountKey);
      send(client.ws, {
        type: 'player_defeated',
        userId: accountKey,
        byAccountKey: 'status:poison',
        returnMapKey: returnMap,
        x: player.x,
        y: player.y,
        timestamp: now
      });
      send(client.ws, {
        type: 'world_items',
        mapKey: returnMap,
        items: worldItemsForMap(returnMap),
        timestamp: now
      });
      sendInventory(client.ws, accountKey);
      broadcastToRoom(room.id, {
        type: 'map_change',
        userId: accountKey,
        mapKey: returnMap,
        x: player.x,
        y: player.y,
        timestamp: now
      }, accountKey);
    }

    if (changed || due.length) saveState();
  }, 500).unref();
}

// 预设账号种子：为已知账号创建 users 认证记录（state.json 中无密码信息）
const PRESET_USERS = [
  { username: 'xiujing', password: '123456', displayName: '修璟', role: 'xiu-jing' },
  { username: 'xuanxuan', password: '123456', displayName: '萱宣', role: 'xuan-xuan' },
  { username: 'xumin', password: 'xumin999', displayName: '徐敏', role: 'user' }
];

async function seedPresetUsers() {
  if (!isMysqlEnabled()) return;
  for (const preset of PRESET_USERS) {
    try {
      const existing = await mysqlDao.findUserByUsername(preset.username);
      if (!existing) {
        const created = await mysqlDao.createUser({
          username: preset.username,
          password: preset.password,
          displayName: preset.displayName,
          role: preset.role
        });
        if (created && !created.error) {
          // 同步创建 account 记录
          await mysqlDao.syncAccount({
            accountKey: preset.username.toLowerCase(),
            username: preset.username,
            displayName: preset.displayName,
            role: preset.role,
            userId: created.id
          });
          console.log(`[bootstrap] 预设账号已创建: ${preset.username}`);
        }
      }
    } catch (e) {
      // 重复或其他错误，忽略
    }
  }
}

// 启动前初始化 MySQL（失败自动降级到 state.json）
(async function bootstrap() {
  try {
    await initMysql();
    if (isMysqlEnabled()) {
      try {
        // 先检查 MySQL 中是否已有数据（mailboxes 表行数）
        const { query } = require('./mysqlClient');
        const rows = await query('SELECT COUNT(*) AS cnt FROM mailboxes');
        const mysqlMailboxCount = rows && rows.length > 0 ? Number(rows[0].cnt) : 0;
        console.log(`[bootstrap] MySQL mailboxes 表行数: ${mysqlMailboxCount}`);

        if (mysqlMailboxCount === 0) {
          // MySQL 为空：从 state.json 迁移数据到 MySQL
          console.log('[bootstrap] MySQL 数据库为空，尝试从 state.json 迁移数据...');
          if (fs.existsSync(STATE_FILE)) {
            try {
              const stateFromFile = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
              const stateMailboxCount = Object.keys(stateFromFile.mailboxes || {}).length;
              if (stateMailboxCount > 0) {
                console.log(`[bootstrap] state.json 有 ${stateMailboxCount} 个信箱，开始迁移...`);
                await mysqlDao.importFromState(stateFromFile);
                console.log('[bootstrap] state.json → MySQL 迁移完成');
              }
            } catch (e) {
              console.warn('[bootstrap] state.json 迁移失败：', e?.message || e);
            }
          }
        }

        // 为预设账号创建 users 认证记录（state.json 中没有密码信息）
        await seedPresetUsers();

        // 确保系统信箱在 MySQL mailbox_codes 表中存在（避免云端查不到）
        await seedSystemMailboxCodesToMysql();

        // 从 MySQL 加载所有数据到内存 persistentState（覆盖 state.json 的数据，以 MySQL 为准）
        await mysqlDao.loadAllFromState(persistentState);

        // 从 MySQL 加载自定义角色/地图定义
        await loadCustomDefinitions();

        // 信使档案 seed：carrier_definitions 为空时自动写入（内置 17 + xinshi 扩展 + 素材入库）
        try {
          const carrierCount = await mysqlDao.countCarrierDefinitions();
          if (!carrierCount) {
            const seedResult = await carrierSeed.seedCarriersToMysql();
            console.log(`[carrier] seed 完成：档案 ${seedResult.carriers}/${seedResult.totalCarriers}，素材 ${seedResult.assets}`);
          } else {
            console.log(`[carrier] 信使档案已存在（${carrierCount}），跳过 seed`);
          }
        } catch (e) {
          console.warn('[carrier] seed 异常（忽略，继续启动）:', e?.message || e);
        }
      } catch (e) {
        console.warn('[bootstrap] 数据加载异常（忽略）：', e?.message || e);
      }
    }
  } catch (err) {
    console.warn('[bootstrap] initMysql 异常（忽略，继续本地模式）：', err?.message || err);
  }
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[API Server] 后端 API 服务已启动: http://0.0.0.0:${PORT}`);
    console.log(`[API Server] 仅提供 REST API 与 WebSocket，不提供静态文件。`);
    console.log(`[API Server] 前端请访问静态服务器（默认 http://0.0.0.0:3005）。`);
    console.log(HTTP_ONLY ? '[API Server] WebSocket: disabled (HTTP-only test client)' : `[API Server] WebSocket: ws://0.0.0.0:${PORT}`);
  });
})();
