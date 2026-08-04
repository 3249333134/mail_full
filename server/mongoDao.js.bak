/* ============================================================
 *  mongoDao.js — 基于 MongoDB 的数据访问层（DAO）
 *  - 所有方法：当 mongo 不可用（!isMongoEnabled()）时返回 null 或空数组，
 *    调用方（server.js）据此回退到 state.json 文件模式。
 *  - 所有 upsert 类方法统一做幂等，前端「离线 → 在线」时安全 merge。
 * ============================================================ */
const bcrypt = require('bcryptjs');
const { isMongoEnabled, getCollection, COLLECTIONS } = require('./mongoClient');

const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS || 10);
const LETTER_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 去 0/O/1/I

/* ---------------- 工具 ---------------- */

function sanitizeUser(user) {
  if (!user) return null;
  const { passwordHash, _id, ...safe } = user;
  return safe;
}

function normalizeAccountKey(v) {
  return String(v || '').trim().toLocaleLowerCase('en-US');
}

function genBusinessId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** 生成 6 位信箱码（唯一；冲突重试最多 20 次；依然冲突则升级到 8/10 位） */
async function generateMailboxCode(nameHint = '') {
  const codes = getCollection(COLLECTIONS.MAILBOX_CODES);
  if (!codes) return null;
  function randomCode(len) {
    let s = '';
    for (let i = 0; i < len; i++) s += LETTER_CODE_ALPHABET[(Math.random() * LETTER_CODE_ALPHABET.length) | 0];
    return s;
  }
  const lengths = [6, 6, 6, 6, 6, 6, 6, 8, 8, 8, 10]; // 前6次6位，接着3次8位，再10位兜底
  for (let attempt = 0; attempt < lengths.length; attempt++) {
    const len = lengths[attempt];
    // 用名字首字母（如有）+ 随机，可读性更好；非关键，纯随机也行
    let code = '';
    const firstChar = String(nameHint || '').replace(/[^A-Za-z\u4e00-\u9fa5]/g, '').slice(0, 1);
    if (firstChar) {
      const letter = LETTER_CODE_ALPHABET[(firstChar.charCodeAt(0) >>> 0) % LETTER_CODE_ALPHABET.length];
      code = letter + randomCode(len - 1);
    } else {
      code = randomCode(len);
    }
    try {
      await codes.insertOne({
        code,
        mailboxId: null, // 先占坑避免并发重复，成功后由调用方 updateOne
        createdBy: 'system',
        createdAt: Date.now()
      });
      return code;
    } catch (e) {
      // E11000 duplicate key → 重试
      const isDup = String(e?.message || '').includes('E11000') || e?.code === 11000;
      if (!isDup) {
        console.warn('[dao] generateMailboxCode 非重复错误：', e?.message || e);
        // 非去重错误直接再试一次，不行就返回 null，让调用端降级
      }
      continue;
    }
  }
  return null;
}

/* ---------------- 用户 / 认证 ---------------- */

async function createUser({ username, password, displayName, role = 'user', avatar = '' }) {
  const col = getCollection(COLLECTIONS.USERS);
  if (!col) return null;
  username = String(username || '').trim();
  if (!username || !password) return { error: '用户名或密码不能为空' };
  const existing = await col.findOne({ username });
  if (existing) return { error: '用户名已存在' };
  const passwordHash = await bcrypt.hash(String(password), BCRYPT_ROUNDS);
  const user = {
    id: genBusinessId('user'),
    username,
    passwordHash,
    displayName: displayName || username,
    avatar: avatar || '',
    role,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    lastLoginAt: null
  };
  await col.insertOne(user);
  return sanitizeUser(user);
}

async function findUserByUsername(username) {
  const col = getCollection(COLLECTIONS.USERS);
  if (!col) return null;
  return col.findOne({ username: String(username || '').trim() });
}

async function verifyPassword(user, password) {
  if (!user || !password) return false;
  return bcrypt.compare(String(password), String(user.passwordHash || ''));
}

async function recordLogin(userId) {
  const col = getCollection(COLLECTIONS.USERS);
  if (!col) return;
  await col.updateOne(
    { id: userId },
    { $set: { lastLoginAt: Date.now(), updatedAt: Date.now() } }
  );
}

/* ---------------- 账户 / 档案（现有 server.js persistentState.accounts） ---------------- */

async function syncAccount(body) {
  const col = getCollection(COLLECTIONS.ACCOUNTS);
  if (!col) return null;
  const accountKey = normalizeAccountKey(body.accountKey);
  if (!accountKey) return null;
  const now = Date.now();
  const update = {
    $set: {
      accountKey,
      username: body.username || accountKey,
      displayName: body.displayName || body.username || accountKey,
      role: body.role || 'user',
      updatedAt: now
    },
    $setOnInsert: {
      id: genBusinessId('account'),
      userId: body.userId || null,
      linkedMailboxIds: [],
      createdAt: now
    }
  };
  await col.updateOne({ accountKey }, update, { upsert: true });
  return col.findOne({ accountKey }, { projection: { _id: 0 } });
}

async function accountProfile(accountKey) {
  const col = getCollection(COLLECTIONS.PROFILES);
  if (!col) return { xiejianCharacterId: '' };
  accountKey = normalizeAccountKey(accountKey);
  const p = await col.findOne({ accountKey }, { projection: { _id: 0 } });
  return p || { accountKey, xiejianCharacterId: '' };
}

async function setProfile(accountKey, patch = {}) {
  const col = getCollection(COLLECTIONS.PROFILES);
  if (!col) return null;
  accountKey = normalizeAccountKey(accountKey);
  const now = Date.now();
  await col.updateOne(
    { accountKey },
    { $set: { ...patch, accountKey, updatedAt: now }, $setOnInsert: { createdAt: now } },
    { upsert: true }
  );
  return col.findOne({ accountKey }, { projection: { _id: 0 } });
}

/* ---------------- 信箱 ---------------- */

/** 创建新信箱：返回含 mailboxCode 的完整对象；若 mongo 不可用返回 null */
async function createMailbox({ name, desc, icon, themeColor, mapBackground, isCustom = true, ownerAccountKey, visibility = 'public' }) {
  const mbCol = getCollection(COLLECTIONS.MAILBOXES);
  const codesCol = getCollection(COLLECTIONS.MAILBOX_CODES);
  if (!mbCol || !codesCol) return null;
  ownerAccountKey = normalizeAccountKey(ownerAccountKey);
  if (!name) return { error: '信箱名称必填' };
  if (!mapBackground) return { error: '创建信箱必须选择地图' };
  const mailboxId = genBusinessId('mailbox');
  const mailboxCode = await generateMailboxCode(name);
  if (!mailboxCode) return { error: '信箱号生成失败，请重试' };
  const now = Date.now();
  const mailbox = {
    id: mailboxId,
    name,
    desc: desc || '',
    icon: icon || '📫',
    themeColor: themeColor || '#8a6d3b',
    mapBackground,
    isCustom: Boolean(isCustom),
    visibility: visibility === 'private' ? 'private' : 'public',
    mailboxCode,
    code: mailboxCode,
    ownerAccountKey,
    memberAccountKeys: ownerAccountKey ? [ownerAccountKey] : [],
    createdAt: now,
    updatedAt: now
  };
  // 先写 mailboxes，再把 codes.mailboxId 回填
  await mbCol.insertOne(mailbox);
  await codesCol.updateOne({ code: mailboxCode }, { $set: { mailboxId, createdBy: ownerAccountKey } });
  return { ...mailbox };
}

async function upsertMailboxRemote(patch) {
  const mbCol = getCollection(COLLECTIONS.MAILBOXES);
  if (!mbCol) return null;
  if (!patch || !patch.id) return null;
  const now = Date.now();
  patch.updatedAt = now;
  if (patch.mailboxCode && !patch.code) patch.code = patch.mailboxCode;
  if (patch.code && !patch.mailboxCode) patch.mailboxCode = patch.code;
  await mbCol.updateOne(
    { id: patch.id },
    { $set: patch, $setOnInsert: { createdAt: now } },
    { upsert: true }
  );
  if (patch.mailboxCode) {
    const codesCol = getCollection(COLLECTIONS.MAILBOX_CODES);
    try {
      await codesCol.updateOne(
        { code: patch.mailboxCode },
        { $set: { mailboxId: patch.id, updatedAt: now }, $setOnInsert: { createdAt: now, createdBy: patch.ownerAccountKey || 'migration' } },
        { upsert: true }
      );
    } catch (e) {
      // E11000 代表 code 已有 → 不报错，继续
    }
  }
  return mbCol.findOne({ id: patch.id }, { projection: { _id: 0 } });
}

async function listMailboxesByMember(accountKey) {
  const mbCol = getCollection(COLLECTIONS.MAILBOXES);
  if (!mbCol) return null;
  accountKey = normalizeAccountKey(accountKey);
  if (!accountKey) return [];
  const list = await mbCol
    .find({
      $or: [
        { ownerAccountKey: accountKey },
        { memberAccountKeys: accountKey }
      ]
    }, { projection: { _id: 0 } })
    .sort({ updatedAt: -1 })
    .toArray();
  return list;
}

async function listPublicMailboxes(query = '') {
  const mbCol = getCollection(COLLECTIONS.MAILBOXES);
  if (!mbCol) return null;
  const text = String(query || '').trim();
  const filter = { visibility: { $ne: 'private' } };
  if (text) filter.$or = [
    { mailboxCode: text.toUpperCase() },
    { name: { $regex: text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } }
  ];
  return mbCol.find(filter, { projection: { _id: 0 } }).sort({ updatedAt: -1 }).limit(50).toArray();
}

async function getMailboxById(id) {
  const mbCol = getCollection(COLLECTIONS.MAILBOXES);
  if (!mbCol) return null;
  return mbCol.findOne({ id }, { projection: { _id: 0 } });
}

async function findMailboxByCode(code) {
  const codesCol = getCollection(COLLECTIONS.MAILBOX_CODES);
  const mbCol = getCollection(COLLECTIONS.MAILBOXES);
  if (!codesCol || !mbCol) return null;
  const c = String(code || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!c) return null;
  const hit = await codesCol.findOne({ code: c });
  if (!hit || !hit.mailboxId) return null;
  return mbCol.findOne({ id: hit.mailboxId }, { projection: { _id: 0 } });
}

/** 按 code 加入；成功返回 mailbox，失败返回 {error} */
async function joinMailboxByCode(code, accountKey) {
  const codesCol = getCollection(COLLECTIONS.MAILBOX_CODES);
  const mbCol = getCollection(COLLECTIONS.MAILBOXES);
  if (!codesCol || !mbCol) return null;
  accountKey = normalizeAccountKey(accountKey);
  if (!accountKey) return { error: '用户未登录' };
  const c = String(code || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!c) return { error: '信箱号不能为空' };
  const hit = await codesCol.findOne({ code: c });
  if (!hit || !hit.mailboxId) return { error: '该信箱号不存在' };
  const mb = await mbCol.findOne({ id: hit.mailboxId }, { projection: { _id: 0 } });
  if (!mb) return { error: '信箱数据已损坏，请重新创建' };
  const now = Date.now();
  await mbCol.updateOne(
    { id: mb.id },
    {
      $addToSet: { memberAccountKeys: accountKey },
      $set: { updatedAt: now }
    }
  );
  return (await mbCol.findOne({ id: mb.id }, { projection: { _id: 0 } }));
}

/* ---------------- 信件（迁移原有 persistentState.letters） ---------------- */

async function saveLetter(record) {
  const col = getCollection(COLLECTIONS.LETTERS);
  if (!col) return null;
  if (!record || !record.id) return null;
  const now = Date.now();
  record.updatedAt = now;
  await col.updateOne(
    { id: record.id },
    { $set: record, $setOnInsert: { createdAt: now } },
    { upsert: true }
  );
  return col.findOne({ id: record.id }, { projection: { _id: 0 } });
}

async function loadLetters(mailboxId, accountKey) {
  const col = getCollection(COLLECTIONS.LETTERS);
  if (!col) return null;
  const acc = normalizeAccountKey(accountKey);
  const filter = { mailboxId: String(mailboxId || '') };
  const docs = await col.find(filter, { projection: { _id: 0 } }).sort({ updatedAt: -1 }).toArray();
  return docs.filter(record => {
    if (record.deliveryStatus === 'draft') return record.senderAccountKey === acc;
    return record.senderAccountKey === acc || record.recipientAccountKey === acc;
  });
}

async function markLetterRead(id, accountKey) {
  const col = getCollection(COLLECTIONS.LETTERS);
  if (!col) return null;
  const acc = normalizeAccountKey(accountKey);
  return col.updateOne(
    { id, $or: [{ recipientAccountKey: acc }, { senderAccountKey: acc }] },
    { $set: { readAt: Date.now(), updatedAt: Date.now() } }
  );
}

async function deleteLetter(id, accountKey) {
  const col = getCollection(COLLECTIONS.LETTERS);
  if (!col) return null;
  return col.deleteOne({ id, senderAccountKey: normalizeAccountKey(accountKey) });
}

/* ---------------- 背包 / 手账 / 战斗档案 ---------------- */

async function inventoryState(accountKey) {
  const col = getCollection(COLLECTIONS.INVENTORIES);
  if (!col) return null;
  const acc = normalizeAccountKey(accountKey);
  const doc = await col.findOne({ accountKey: acc }, { projection: { _id: 0 } });
  return doc ? { items: doc.items || [], equipment: doc.equipment || {}, quickSlots: doc.quickSlots || {} }
            : { items: [], equipment: {}, quickSlots: {} };
}

async function saveInventory(accountKey, inventory) {
  const col = getCollection(COLLECTIONS.INVENTORIES);
  if (!col) return null;
  const acc = normalizeAccountKey(accountKey);
  if (!acc) return null;
  const now = Date.now();
  const data = {
    accountKey: acc,
    items: Array.isArray(inventory?.items) ? inventory.items : [],
    equipment: inventory?.equipment || {},
    quickSlots: inventory?.quickSlots || {},
    updatedAt: now
  };
  await col.updateOne({ accountKey: acc }, { $set: data, $setOnInsert: { createdAt: now } }, { upsert: true });
  return data;
}

async function loadJournal(accountKey, { year, month, day }) {
  const col = getCollection(COLLECTIONS.JOURNALS);
  if (!col) return null;
  const acc = normalizeAccountKey(accountKey);
  if (day !== undefined && day !== null) {
    return col.findOne({ accountKey: acc, year, month, day }, { projection: { _id: 0 } });
  }
  const filter = { accountKey: acc, year, month };
  return col.find(filter, { projection: { _id: 0 } }).sort({ day: 1 }).toArray();
}

async function saveJournal(accountKey, entry) {
  const col = getCollection(COLLECTIONS.JOURNALS);
  if (!col) return null;
  const acc = normalizeAccountKey(accountKey);
  if (!acc || entry?.year == null || entry?.month == null || entry?.day == null) return null;
  const now = Date.now();
  const doc = {
    accountKey: acc,
    year: Number(entry.year),
    month: Number(entry.month),
    day: Number(entry.day),
    entries: Array.isArray(entry.entries) ? entry.entries : [],
    updatedAt: now
  };
  await col.updateOne(
    { accountKey: acc, year: doc.year, month: doc.month, day: doc.day },
    { $set: doc, $setOnInsert: { createdAt: now } },
    { upsert: true }
  );
  return doc;
}

async function getCombatProfile(accountKey, characterId) {
  const col = getCollection(COLLECTIONS.COMBAT_PROFILES);
  if (!col) return null;
  return col.findOne({ accountKey: normalizeAccountKey(accountKey), characterId }, { projection: { _id: 0 } });
}

async function saveCombatProfile(accountKey, characterId, profile) {
  const col = getCollection(COLLECTIONS.COMBAT_PROFILES);
  if (!col) return null;
  const acc = normalizeAccountKey(accountKey);
  const now = Date.now();
  await col.updateOne(
    { accountKey: acc, characterId },
    { $set: { ...profile, accountKey: acc, characterId, updatedAt: now }, $setOnInsert: { createdAt: now } },
    { upsert: true }
  );
  return col.findOne({ accountKey: acc, characterId }, { projection: { _id: 0 } });
}

/* ---------------- 批量：把内存 state.json 中的数据迁到 Mongo（冷启动一次即可） ---------------- */

async function importFromState(state, { writeAccounts = true, writeLetters = true, writeInventories = true, writeProfiles = true } = {}) {
  if (!isMongoEnabled() || !state) return;
  const ops = [];
  if (writeAccounts && state.accounts) {
    for (const [k, a] of Object.entries(state.accounts)) {
      const ak = normalizeAccountKey(k);
      ops.push(syncAccount({
        accountKey: ak,
        username: a.username || ak,
        displayName: a.displayName,
        role: a.role,
        userId: a.userId
      }));
    }
  }
  if (writeProfiles && state.profiles) {
    for (const [k, p] of Object.entries(state.profiles)) {
      ops.push(setProfile(k, typeof p === 'object' ? p : { xiejianCharacterId: String(p || '') }));
    }
  }
  if (writeLetters && state.letters) {
    for (const [, l] of Object.entries(state.letters)) {
      ops.push(saveLetter(l));
    }
  }
  if (writeInventories && state.inventories) {
    for (const [k, inv] of Object.entries(state.inventories)) {
      ops.push(saveInventory(k, inv));
    }
  }
  await Promise.all(ops.map(p => Promise.resolve(p).catch(e => console.warn('[dao] importFromState 跳过一条：', e?.message || e))));
}

module.exports = {
  // utils
  normalizeAccountKey,
  generateMailboxCode,
  sanitizeUser,
  // auth
  createUser,
  findUserByUsername,
  verifyPassword,
  recordLogin,
  // account/profile
  syncAccount,
  accountProfile,
  setProfile,
  // mailboxes
  createMailbox,
  upsertMailboxRemote,
  listMailboxesByMember,
  listPublicMailboxes,
  getMailboxById,
  findMailboxByCode,
  joinMailboxByCode,
  // letters
  saveLetter,
  loadLetters,
  markLetterRead,
  deleteLetter,
  // inventory / journal / combat
  inventoryState,
  saveInventory,
  loadJournal,
  saveJournal,
  getCombatProfile,
  saveCombatProfile,
  // migration
  importFromState
};
