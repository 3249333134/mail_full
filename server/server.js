const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');
const {
  itemDefinitions,
  starterItems,
  martialByCharacter,
  placements,
  mapDimensions,
  nodePosition,
  worldPosition,
  nearestRoutePosition
} = require('./xiejianGameData');

const PORT = Number(process.env.PORT || 3000);
const HTTP_ONLY = process.env.HTTP_ONLY === '1';
const ROOT_DIR = path.resolve(__dirname, '..');
const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(__dirname, 'data'));
const STATE_FILE = path.join(DATA_DIR, 'state.json');
const MEDIA_DIR = path.join(DATA_DIR, 'media');
const MAX_ROOM_CONNECTIONS = 11;
const COMBAT_ATTACK_COOLDOWN_MS = Number(process.env.COMBAT_ATTACK_COOLDOWN_MS || 900);
const XIEJIAN_CHARACTERS = new Set([
  'zhou-ran',
  'he-qingfeng',
  'ren-chaoye',
  'shen-chiyi',
  'qi-pingchuan',
  'jiang-huaian',
  'tang-wanchu'
]);
const XIEJIAN_CHARACTER_NAMES = {
  'zhou-ran': '周然',
  'he-qingfeng': '贺清风',
  'ren-chaoye': '任朝野',
  'shen-chiyi': '沈池懿',
  'qi-pingchuan': '戚凭川',
  'jiang-huaian': '江淮安',
  'tang-wanchu': '唐挽初'
};
const DEFAULT_XIEJIAN_MAP = 'xj-jingyuan';
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
  'xj-border': '边陲小镇'
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

fs.mkdirSync(MEDIA_DIR, { recursive: true });

function emptyState() {
  return {
    accounts: {},
    profiles: {},
    roleBindings: {},
    letters: {},
    itemInstances: {},
    inventories: {},
    combatProfiles: {},
    itemRespawns: [],
    worldSeedVersion: 0,
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
      letters: parsed.letters || {},
      itemInstances: parsed.itemInstances || {},
      inventories: parsed.inventories || {},
      combatProfiles: parsed.combatProfiles || {},
      itemRespawns: parsed.itemRespawns || [],
      worldSeedVersion: Number(parsed.worldSeedVersion) || 0,
      itemDataVersion: Number(parsed.itemDataVersion) || 0
    };
  } catch (_) {
    return emptyState();
  }
}

let persistentState = loadState();

function createItemInstance(instanceId, definitionId, location) {
  const definition = itemDefinitions[definitionId];
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
  for (const [mapKey, nodeId, definitionId, rawCount] of placements) {
    const count = Number(rawCount) || 1;
    for (let index = 0; index < count; index += 1) {
      const instanceId = `world:v1:${mapKey}:${definitionId}:${index + 1}`;
      if (persistentState.itemInstances[instanceId]) continue;
      const position = nodePosition(mapKey, nodeId, index);
      persistentState.itemInstances[instanceId] = createItemInstance(instanceId, definitionId, {
        locationType: 'world',
        mapKey,
        nodeId,
        ...position,
        origin: { type: 'map', mapKey, nodeId, ...position },
        acquisition: { method: 'world', at: Date.now(), mapKey, nodeId }
      });
    }
  }
  persistentState.worldSeedVersion = 1;
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
      martial: martialByCharacter[characterId] || 0,
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
  profile.martial = martialByCharacter[characterId] || Number(profile.martial) || 0;
  profile.baseDefense = 4;
  return profile;
}

function grantStarterItems(accountKey, characterId) {
  const inventory = ensureInventory(accountKey);
  if (!characterId || inventory.starterGrantVersion >= 1) {
    ensureCombatProfile(accountKey, characterId);
    return;
  }
  for (const definitionId of starterItems[characterId] || []) {
    const instanceId = `starter:v1:${accountKey}:${definitionId}`;
    if (!persistentState.itemInstances[instanceId]) {
      persistentState.itemInstances[instanceId] = createItemInstance(instanceId, definitionId, {
        locationType: 'inventory',
        ownerAccountKey: accountKey,
        origin: { type: 'starter', starterCharacterId: characterId },
        acquisition: { method: 'starter', at: Date.now(), starterCharacterId: characterId }
      });
    }
    if (!inventory.itemIds.includes(instanceId)) inventory.itemIds.push(instanceId);
    const slot = itemDefinitions[definitionId]?.equipmentSlot;
    if (slot && !inventory.equipment[slot]) {
      inventory.equipment[slot] = instanceId;
      persistentState.itemInstances[instanceId].equippedSlot = slot;
    }
  }
  inventory.starterGrantVersion = 1;
  ensureCombatProfile(accountKey, characterId);
}

function originLabel(instance) {
  const origin = instance?.origin || {};
  if (origin.starterCharacterId) {
    const characterName = XIEJIAN_CHARACTER_NAMES[origin.starterCharacterId] || origin.starterCharacterId;
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
  const definition = itemDefinitions[instance.definitionId];
  if (!definition) return null;
  const position = instance.locationType === 'world'
    ? worldPosition(instance.mapKey, instance.nx, instance.ny)
    : { x: 0, y: 0 };
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

function combatState(accountKey) {
  const characterId = accountProfile(accountKey).xiejianCharacterId || '';
  const profile = ensureCombatProfile(accountKey, characterId);
  const inventory = ensureInventory(accountKey);
  let attackBonus = 0;
  let defenseBonus = 0;
  const equipped = {};
  for (const [slot, instanceId] of Object.entries(inventory.equipment)) {
    const instance = persistentState.itemInstances[instanceId];
    const definition = instance && itemDefinitions[instance.definitionId];
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

if (!HTTP_ONLY) {
  ensureWorldSeed();
  for (const [accountKey, profile] of Object.entries(persistentState.profiles)) {
    if (profile?.xiejianCharacterId) grantStarterItems(accountKey, profile.xiejianCharacterId);
  }
  ensureItemMetadata();
  saveState();
}

function saveState() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tempFile = `${STATE_FILE}.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(persistentState, null, 2), 'utf8');
  fs.renameSync(tempFile, STATE_FILE);
}

function normalizeAccountKey(value) {
  return String(value || '').trim().toLocaleLowerCase('en-US').slice(0, 80);
}

function accountProfile(accountKey) {
  if (!persistentState.profiles[accountKey]) {
    persistentState.profiles[accountKey] = {
      xiejianCharacterId: '',
      lastXiejianMapKey: DEFAULT_XIEJIAN_MAP
    };
  }
  return persistentState.profiles[accountKey];
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
  const profile = accountProfile(accountKey);
  let identityName = account.displayName || account.username || accountKey;
  if (mailboxId === 'mailbox-xiejian' && profile.xiejianCharacterId) {
    identityName = XIEJIAN_CHARACTER_NAMES[profile.xiejianCharacterId] || profile.xiejianCharacterId;
  } else if (mailboxId === 'mailbox-hanmen-duet') {
    if (account.role === 'xiu-jing') identityName = '修璟';
    if (account.role === 'xuan-xuan') identityName = '萱宣';
  }
  return {
    accountKey,
    username: account.username,
    displayName: account.displayName,
    role: account.role,
    characterId: mailboxId === 'mailbox-xiejian' ? profile.xiejianCharacterId : account.role,
    identityName
  };
}

function getMailboxRecipients(mailboxId, requesterKey) {
  return Object.keys(persistentState.accounts)
    .filter(accountKey => accountKey !== requesterKey)
    .map(accountKey => getAccountIdentity(accountKey, mailboxId))
    .filter(identity => {
      if (mailboxId === 'mailbox-xiejian') return Boolean(identity.characterId);
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
  const definition = itemDefinitions[instance.definitionId];
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

async function handleApi(req, res, parsedUrl) {
  if (!parsedUrl.pathname.startsWith('/api/')) return false;

  try {
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
        roleBindings: persistentState.roleBindings
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
      jsonResponse(res, 200, { inventory: inventoryState(accountKey) });
      return true;
    }

    if (req.method === 'GET' && parsedUrl.pathname === '/api/mail/letters') {
      const accountKey = normalizeAccountKey(parsedUrl.searchParams.get('accountKey'));
      const mailboxId = String(parsedUrl.searchParams.get('mailboxId') || '');
      const letters = Object.values(persistentState.letters)
        .filter(record => record.mailboxId === mailboxId)
        .filter(record => {
          if (record.deliveryStatus === 'draft') return record.senderAccountKey === accountKey;
          return record.senderAccountKey === accountKey || record.recipientAccountKey === accountKey;
        })
        .map(record => record.deliveryStatus === 'draft'
          ? {
              ...record.letter,
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
        unreadCount: letters.filter(letter => letter.isUnread).length
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
      persistentState.letters[id] = {
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
      saveState();
      jsonResponse(res, 200, { letter: persistentState.letters[id].letter });
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
      saveState();
      jsonResponse(res, 200, { success: true });
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
        jsonResponse(res, 404, { error: 'recipient_unavailable' });
        return true;
      }
      const duplicate = Object.values(persistentState.letters).find(record =>
        record.senderAccountKey === accountKey && record.clientMessageId === clientMessageId
      );
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
      saveState();
      notifyInventoryForAccount(accountKey);
      jsonResponse(res, 200, { letter: publicLetter(record, accountKey), duplicate: false });
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
      saveState();
      notifyInventoryForAccount(accountKey);
      jsonResponse(res, 200, {
        readAt: record.readAt,
        receivedItems,
        inventory: inventoryState(accountKey),
        letter: publicLetter(record, accountKey)
      });
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
      fs.writeFileSync(path.join(MEDIA_DIR, id), Buffer.from(base64, 'base64'));
      fs.writeFileSync(path.join(MEDIA_DIR, `${id}.json`), JSON.stringify({ mimeType }), 'utf8');
      jsonResponse(res, 200, { id, url: `/api/media/${id}` });
      return true;
    }

    if (req.method === 'GET' && parsedUrl.pathname.startsWith('/api/media/')) {
      const id = decodeURIComponent(parsedUrl.pathname.slice('/api/media/'.length))
        .replace(/[^a-zA-Z0-9_-]/g, '');
      const file = path.join(MEDIA_DIR, id);
      if (!id || !fs.existsSync(file)) {
        res.writeHead(404);
        res.end('Not Found');
        return true;
      }
      let mimeType = 'application/octet-stream';
      try {
        mimeType = JSON.parse(fs.readFileSync(`${file}.json`, 'utf8')).mimeType || mimeType;
      } catch (_) {}
      res.writeHead(200, { 'Content-Type': mimeType });
      fs.createReadStream(file).pipe(res);
      return true;
    }

    jsonResponse(res, 404, { error: 'api_not_found' });
    return true;
  } catch (error) {
    const status = error.message === 'payload_too_large' ? 413 : 400;
    jsonResponse(res, status, { error: error.message || 'request_failed' });
    return true;
  }
}

const contentTypes = {
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.mp3': 'audio/mpeg',
  '.m4a': 'audio/mpeg',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  let urlPath = '/';
  let parsedUrl = null;
  try {
    parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    urlPath = decodeURIComponent(parsedUrl.pathname);
  } catch (_) {
    res.writeHead(400);
    res.end('Bad Request');
    return;
  }

  if (await handleApi(req, res, parsedUrl)) return;

  const relativePath = urlPath === '/' ? 'index.html' : urlPath.replace(/^[/\\]+/, '');
  const filePath = path.resolve(ROOT_DIR, relativePath);
  if (filePath !== ROOT_DIR && !filePath.startsWith(ROOT_DIR + path.sep)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not Found');
      return;
    }
    const contentType = contentTypes[path.extname(filePath).toLowerCase()] || 'text/html; charset=utf-8';
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
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

function getOccupiedCharacters() {
  return Object.keys(persistentState.roleBindings);
}

function broadcastCharacterOccupancy(room) {
  broadcastToRoom(room.id, {
    type: 'character_occupancy',
    occupiedCharacters: getOccupiedCharacters(),
    roleBindings: persistentState.roleBindings,
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
          const profile = accountProfile(clientId);
          const mode = message.mode === 'xiejian' ? 'xiejian' : 'default';
          const initialCharacter = mode === 'xiejian'
            ? String(profile.xiejianCharacterId || '')
            : String(message.characterId || '');
          const initialMapKey = mode === 'xiejian'
            ? String(profile.lastXiejianMapKey || DEFAULT_XIEJIAN_MAP)
            : String(message.mapKey || '');
          if (mode === 'xiejian' && initialCharacter) {
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
            ready: mode !== 'xiejian' || Boolean(initialCharacter),
            lastUpdate: Date.now(),
            isOnline: true
          };

          send(ws, {
            type: 'room_state',
            roomId: currentRoomId,
            players: publicPlayers(room, clientId),
            playerCount: room.clients.size,
            maxConnections: MAX_ROOM_CONNECTIONS,
            occupiedCharacters: getOccupiedCharacters(),
            roleBindings: persistentState.roleBindings,
            accountProfile: {
              accountKey: clientId,
              xiejianCharacterId: profile.xiejianCharacterId || '',
              lastXiejianMapKey: profile.lastXiejianMapKey || DEFAULT_XIEJIAN_MAP
            },
            itemDefinitions: mode === 'xiejian' ? itemDefinitions : {},
            inventory: mode === 'xiejian' ? inventoryState(clientId) : null,
            combatProfile: mode === 'xiejian' ? combatState(clientId) : null,
            worldItems: mode === 'xiejian' ? worldItemsForMap(initialMapKey) : []
          });

          if (room.players[clientId].ready) {
            broadcastToRoom(currentRoomId, {
              type: 'join',
              ...room.players[clientId],
              combat: mode === 'xiejian' ? combatState(clientId) : null,
              timestamp: Date.now()
            }, clientId);
          }
          saveState();
          console.log(`[${currentRoomId}] joined: ${clientId} (${room.clients.size}/${MAX_ROOM_CONNECTIONS})`);
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
          if (!XIEJIAN_CHARACTERS.has(characterId)) {
            send(ws, { type: 'character_rejected', characterId, reason: 'unavailable' });
            return;
          }

          const profile = accountProfile(clientId);
          if (profile.xiejianCharacterId && profile.xiejianCharacterId !== characterId) {
            send(ws, {
              type: 'character_rejected',
              characterId,
              reason: 'binding_locked',
              boundCharacterId: profile.xiejianCharacterId
            });
            return;
          }

          const owner = persistentState.roleBindings[characterId];
          if (owner && owner !== clientId) {
            send(ws, { type: 'character_rejected', characterId, reason: 'occupied' });
            return;
          }

          const previousCharacter = profile.xiejianCharacterId || player.characterId;
          persistentState.roleBindings[characterId] = clientId;
          profile.xiejianCharacterId = characterId;
          profile.lastXiejianMapKey = profile.lastXiejianMapKey || DEFAULT_XIEJIAN_MAP;
          player.characterId = characterId;
          player.mapKey = profile.lastXiejianMapKey;
          player.ready = true;
          player.lastUpdate = Date.now();
          grantStarterItems(clientId, characterId);
          saveState();

          send(ws, {
            type: 'character_selected',
            characterId,
            previousCharacter,
            mapKey: profile.lastXiejianMapKey,
            occupiedCharacters: getOccupiedCharacters(),
            roleBindings: persistentState.roleBindings,
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
          return;
        }

        if (message.type === 'map_change') {
          if (!player.ready) return;
          const requestedMapKey = String(message.mapKey || '');
          if (!mapDimensions[requestedMapKey]) {
            send(ws, { type: 'map_change_rejected', reason: 'invalid_map', mapKey: requestedMapKey });
            return;
          }
          player.mapKey = requestedMapKey;
          player.x = Number(message.x) || 0;
          player.y = Number(message.y) || 0;
          player.lastUpdate = Date.now();
          const profile = accountProfile(clientId);
          profile.lastXiejianMapKey = player.mapKey || DEFAULT_XIEJIAN_MAP;
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
          const definition = instance && itemDefinitions[instance.definitionId];
          if (!instance || instance.locationType !== 'world') {
            rejectItem(ws, 'pickup', 'already_taken', { instanceId });
            return;
          }
          if (instance.mapKey !== player.mapKey) {
            rejectItem(ws, 'pickup', 'different_map', { instanceId });
            return;
          }
          const itemPosition = worldPosition(instance.mapKey, instance.nx, instance.ny);
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
            fromIdentity: getAccountIdentity(clientId, 'mailbox-xiejian').identityName
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
          const definition = instance && itemDefinitions[instance.definitionId];
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
          const definition = instance && itemDefinitions[instance.definitionId];
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
            targetCombat.hp = 100;
            targetCombat.poisonedUntil = 0;
            targetCombat.nextPoisonTickAt = 0;
            targetCombat.immobilizedUntil = 0;
            targetCombat.invulnerableUntil = now + 5000;
            target.mapKey = DEFAULT_XIEJIAN_MAP;
            const spawn = worldPosition(DEFAULT_XIEJIAN_MAP, 0.5, 0.82);
            target.x = spawn.x;
            target.y = spawn.y;
            const targetProfile = accountProfile(targetAccountKey);
            targetProfile.lastXiejianMapKey = DEFAULT_XIEJIAN_MAP;
            broadcastToMap(room, defeatedMap, {
              type: 'player_defeated',
              userId: targetAccountKey,
              byAccountKey: clientId,
              returnMapKey: DEFAULT_XIEJIAN_MAP,
              x: target.x,
              y: target.y,
              timestamp: now
            }, targetAccountKey);
            send(targetClient.ws, {
              type: 'player_defeated',
              userId: targetAccountKey,
              byAccountKey: clientId,
              returnMapKey: DEFAULT_XIEJIAN_MAP,
              x: target.x,
              y: target.y,
              timestamp: now
            });
            send(targetClient.ws, {
              type: 'world_items',
              mapKey: DEFAULT_XIEJIAN_MAP,
              items: worldItemsForMap(DEFAULT_XIEJIAN_MAP),
              timestamp: now
            });
            sendInventory(targetClient.ws, targetAccountKey);
            broadcastToRoom(currentRoomId, {
              type: 'map_change',
              userId: targetAccountKey,
              mapKey: DEFAULT_XIEJIAN_MAP,
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

        if (message.type === 'chat') {
          broadcastToRoom(currentRoomId, {
            type: 'chat',
            userId: clientId,
            mapKey: player.mapKey,
            content: message.content,
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
      combat.hp = 100;
      combat.poisonedUntil = 0;
      combat.nextPoisonTickAt = 0;
      combat.immobilizedUntil = 0;
      combat.invulnerableUntil = now + 5000;
      player.mapKey = DEFAULT_XIEJIAN_MAP;
      const spawn = worldPosition(DEFAULT_XIEJIAN_MAP, 0.5, 0.82);
      player.x = spawn.x;
      player.y = spawn.y;
      accountProfile(accountKey).lastXiejianMapKey = DEFAULT_XIEJIAN_MAP;
      broadcastToMap(room, oldMapKey, {
        type: 'player_defeated',
        userId: accountKey,
        byAccountKey: 'status:poison',
        returnMapKey: DEFAULT_XIEJIAN_MAP,
        x: player.x,
        y: player.y,
        timestamp: now
      }, accountKey);
      send(client.ws, {
        type: 'player_defeated',
        userId: accountKey,
        byAccountKey: 'status:poison',
        returnMapKey: DEFAULT_XIEJIAN_MAP,
        x: player.x,
        y: player.y,
        timestamp: now
      });
      send(client.ws, {
        type: 'world_items',
        mapKey: DEFAULT_XIEJIAN_MAP,
        items: worldItemsForMap(DEFAULT_XIEJIAN_MAP),
        timestamp: now
      });
      sendInventory(client.ws, accountKey);
      broadcastToRoom(room.id, {
        type: 'map_change',
        userId: accountKey,
        mapKey: DEFAULT_XIEJIAN_MAP,
        x: player.x,
        y: player.y,
        timestamp: now
      }, accountKey);
    }

    if (changed || due.length) saveState();
  }, 500).unref();
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Xinjian HTTP: http://0.0.0.0:${PORT}`);
  console.log(HTTP_ONLY ? 'WebSocket: disabled (HTTP-only test client)' : `WebSocket: ws://0.0.0.0:${PORT}`);
});
