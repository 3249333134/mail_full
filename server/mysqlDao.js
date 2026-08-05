/* ============================================================
 *  mysqlDao.js — 基于 MySQL 的数据访问层（DAO）
 *  - 所有方法：当 MySQL 不可用（!isMysqlEnabled()）时返回 null 或空数组，
 *    调用方（server.js）据此回退到 state.json 文件模式。
 *  - 所有 upsert 类方法统一做幂等，前端「离线 → 在线」时安全 merge。
 *  - 方法签名与原 mongoDao.js 完全一致，确保 server.js 改动最小。
 * ============================================================ */
const bcrypt = require('bcryptjs');
const { isMysqlEnabled, query, execute } = require('./mysqlClient');

const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS || 10);
const LETTER_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 去 0/O/1/I

/* ---------------- 工具 ---------------- */

function sanitizeUser(user) {
  if (!user) return null;
  const { passwordHash, ...safe } = user;
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
  if (!isMysqlEnabled()) return null;
  function randomCode(len) {
    let s = '';
    for (let i = 0; i < len; i++) s += LETTER_CODE_ALPHABET[(Math.random() * LETTER_CODE_ALPHABET.length) | 0];
    return s;
  }
  const lengths = [6, 6, 6, 6, 6, 6, 6, 8, 8, 8, 10];
  for (let attempt = 0; attempt < lengths.length; attempt++) {
    const len = lengths[attempt];
    let code = '';
    const firstChar = String(nameHint || '').replace(/[^A-Za-z\u4e00-\u9fa5]/g, '').slice(0, 1);
    if (firstChar) {
      const letter = LETTER_CODE_ALPHABET[(firstChar.charCodeAt(0) >>> 0) % LETTER_CODE_ALPHABET.length];
      code = letter + randomCode(len - 1);
    } else {
      code = randomCode(len);
    }
    try {
      // 先占坑避免并发重复
      const result = await execute(
        `INSERT INTO mailbox_codes (code, mailboxId, createdBy, createdAt, updatedAt) VALUES (?, NULL, 'system', ?, ?)`,
        [code, Date.now(), Date.now()]
      );
      if (result && result.affectedRows > 0) return code;
    } catch (e) {
      const isDup = String(e?.message || '').includes('Duplicate') || e?.code === 'ER_DUP_ENTRY';
      if (!isDup) {
        console.warn('[dao] generateMailboxCode 非重复错误：', e?.message || e);
      }
      continue;
    }
  }
  return null;
}

/* ---------------- 用户 / 认证 ---------------- */

async function createUser({ username, password, displayName, role = 'user', avatar = '' }) {
  if (!isMysqlEnabled()) return null;
  username = String(username || '').trim();
  if (!username || !password) return { error: '用户名或密码不能为空' };
  const existing = await query('SELECT id FROM users WHERE username = ? LIMIT 1', [username]);
  if (existing && existing.length > 0) return { error: '用户名已存在' };
  const passwordHash = await bcrypt.hash(String(password), BCRYPT_ROUNDS);
  const id = genBusinessId('user');
  const now = Date.now();
  await execute(
    `INSERT INTO users (id, username, passwordHash, displayName, avatar, role, createdAt, updatedAt, lastLoginAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
    [id, username, passwordHash, displayName || username, avatar || '', role, now, now]
  );
  const rows = await query('SELECT * FROM users WHERE id = ? LIMIT 1', [id]);
  return rows && rows.length > 0 ? sanitizeUser(rows[0]) : null;
}

async function findUserByUsername(username) {
  if (!isMysqlEnabled()) return null;
  const rows = await query('SELECT * FROM users WHERE username = ? LIMIT 1', [String(username || '').trim()]);
  return rows && rows.length > 0 ? rows[0] : null;
}

async function verifyPassword(user, password) {
  if (!user || !password) return false;
  return bcrypt.compare(String(password), String(user.passwordHash || ''));
}

async function recordLogin(userId) {
  if (!isMysqlEnabled()) return;
  await execute('UPDATE users SET lastLoginAt = ?, updatedAt = ? WHERE id = ?', [Date.now(), Date.now(), userId]);
}

/* ---------------- 账户 / 档案 ---------------- */

async function syncAccount(body) {
  if (!isMysqlEnabled()) return null;
  const accountKey = normalizeAccountKey(body.accountKey);
  if (!accountKey) return null;
  const now = Date.now();
  const existing = await query('SELECT * FROM accounts WHERE accountKey = ? LIMIT 1', [accountKey]);
  if (existing && existing.length > 0) {
    await execute(
      `UPDATE accounts SET username = ?, displayName = ?, role = ?, updatedAt = ? WHERE accountKey = ?`,
      [body.username || accountKey, body.displayName || body.username || accountKey, body.role || 'user', now, accountKey]
    );
  } else {
    const id = genBusinessId('account');
    await execute(
      `INSERT INTO accounts (id, accountKey, username, displayName, role, userId, linkedMailboxIds, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, accountKey,
        body.username || accountKey,
        body.displayName || body.username || accountKey,
        body.role || 'user',
        body.userId || null,
        JSON.stringify([]),
        now, now
      ]
    );
  }
  const rows = await query('SELECT * FROM accounts WHERE accountKey = ? LIMIT 1', [accountKey]);
  return rows && rows.length > 0 ? rows[0] : null;
}

async function accountProfile(accountKey) {
  if (!isMysqlEnabled()) return { xiejianCharacterId: '' };
  accountKey = normalizeAccountKey(accountKey);
  const rows = await query('SELECT * FROM profiles WHERE accountKey = ? LIMIT 1', [accountKey]);
  if (rows && rows.length > 0) {
    const p = rows[0];
    return { accountKey, xiejianCharacterId: p.xiejianCharacterId || '', lastXiejianMapKey: p.lastXiejianMapKey || '' };
  }
  return { accountKey, xiejianCharacterId: '' };
}

async function setProfile(accountKey, patch = {}) {
  if (!isMysqlEnabled()) return null;
  accountKey = normalizeAccountKey(accountKey);
  const now = Date.now();
  const existing = await query('SELECT id FROM profiles WHERE accountKey = ? LIMIT 1', [accountKey]);
  const xiejianCharacterId = patch.xiejianCharacterId || '';
  const lastXiejianMapKey = patch.lastXiejianMapKey || '';
  if (existing && existing.length > 0) {
    await execute(
      `UPDATE profiles SET xiejianCharacterId = ?, lastXiejianMapKey = ?, updatedAt = ? WHERE accountKey = ?`,
      [xiejianCharacterId, lastXiejianMapKey, now, accountKey]
    );
  } else {
    const id = `profile-${accountKey}-${Date.now().toString(36)}`;
    await execute(
      `INSERT INTO profiles (id, accountKey, xiejianCharacterId, lastXiejianMapKey, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, accountKey, xiejianCharacterId, lastXiejianMapKey, now, now]
    );
  }
  const rows = await query('SELECT * FROM profiles WHERE accountKey = ? LIMIT 1', [accountKey]);
  return rows && rows.length > 0 ? rows[0] : null;
}

/* ---------------- 信箱 ---------------- */

async function createMailbox({ name, desc, icon, themeColor, mapBackground, isCustom = true, ownerAccountKey, visibility = 'public' }) {
  if (!isMysqlEnabled()) return null;
  ownerAccountKey = normalizeAccountKey(ownerAccountKey);
  if (!name) return { error: '信箱名称必填' };
  if (!mapBackground) return { error: '创建信箱必须选择地图' };
  const mailboxId = genBusinessId('mailbox');
  const mailboxCode = await generateMailboxCode(name);
  if (!mailboxCode) return { error: '信箱号生成失败，请重试' };
  const now = Date.now();
  const memberAccountKeys = ownerAccountKey ? [ownerAccountKey] : [];
  await execute(
    `INSERT INTO mailboxes (id, name, \`desc\`, icon, themeColor, mapBackground, isCustom, visibility, mailboxCode, ownerAccountKey, memberAccountKeys, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      mailboxId, name, desc || '', icon || '📫', themeColor || '#8a6d3b', mapBackground,
      isCustom ? 1 : 0, visibility === 'private' ? 'private' : 'public',
      mailboxCode, ownerAccountKey, JSON.stringify(memberAccountKeys), now, now
    ]
  );
  // 回填 mailbox_codes 表
  await execute(
    `UPDATE mailbox_codes SET mailboxId = ?, createdBy = ?, updatedAt = ? WHERE code = ?`,
    [mailboxId, ownerAccountKey || 'system', now, mailboxCode]
  );
  const rows = await query('SELECT * FROM mailboxes WHERE id = ? LIMIT 1', [mailboxId]);
  return rows && rows.length > 0 ? { ...rows[0], code: rows[0].mailboxCode } : null;
}

async function upsertMailboxRemote(patch) {
  if (!isMysqlEnabled()) return null;
  if (!patch || !patch.id) return null;
  const now = Date.now();
  patch.updatedAt = now;
  if (patch.mailboxCode && !patch.code) patch.code = patch.mailboxCode;
  if (patch.code && !patch.mailboxCode) patch.mailboxCode = patch.code;

  const existing = await query('SELECT * FROM mailboxes WHERE id = ? LIMIT 1', [patch.id]);
  if (existing && existing.length > 0) {
    // UPDATE：动态构建
    const fields = [];
    const values = [];
    const fieldMap = {
      name: 'name', desc: '`desc`', icon: 'icon', themeColor: 'themeColor',
      mapBackground: 'mapBackground', isCustom: 'isCustom', visibility: 'visibility',
      mailboxCode: 'mailboxCode', ownerAccountKey: 'ownerAccountKey',
      memberAccountKeys: 'memberAccountKeys',
      memberNames: 'memberNames', memberCharacters: 'memberCharacters'
    };
    for (const [k, col] of Object.entries(fieldMap)) {
      if (patch[k] !== undefined) {
        fields.push(`${col} = ?`);
        if (k === 'isCustom') values.push(patch[k] ? 1 : 0);
        else if (k === 'memberAccountKeys' || k === 'memberNames' || k === 'memberCharacters') values.push(JSON.stringify(patch[k] || {}));
        else values.push(patch[k]);
      }
    }
    fields.push('updatedAt = ?');
    values.push(now);
    values.push(patch.id);
    if (fields.length > 1) {
      await execute(`UPDATE mailboxes SET ${fields.join(', ')} WHERE id = ?`, values);
    }
  } else {
    // INSERT
    const memberAccountKeys = patch.memberAccountKeys || (patch.ownerAccountKey ? [patch.ownerAccountKey] : []);
    const memberNames = patch.memberNames || {};
    const memberCharacters = patch.memberCharacters || {};
    await execute(
      `INSERT INTO mailboxes (id, name, \`desc\`, icon, themeColor, mapBackground, isCustom, visibility, mailboxCode, ownerAccountKey, memberAccountKeys, memberNames, memberCharacters, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        patch.id,
        patch.name || '未命名信箱',
        patch.desc || '',
        patch.icon || '📫',
        patch.themeColor || '#8a6d3b',
        patch.mapBackground || '',
        patch.isCustom !== false ? 1 : 0,
        patch.visibility === 'private' ? 'private' : (patch.visibility || 'public'),
        patch.mailboxCode || '',
        patch.ownerAccountKey || '',
        JSON.stringify(memberAccountKeys),
        JSON.stringify(memberNames),
        JSON.stringify(memberCharacters),
        patch.createdAt || now,
        now
      ]
    );
  }

  if (patch.mailboxCode) {
    try {
      const existingCode = await query('SELECT code FROM mailbox_codes WHERE code = ? LIMIT 1', [patch.mailboxCode]);
      if (existingCode && existingCode.length > 0) {
        await execute(
          'UPDATE mailbox_codes SET mailboxId = ?, updatedAt = ? WHERE code = ?',
          [patch.id, now, patch.mailboxCode]
        );
      } else {
        await execute(
          'INSERT INTO mailbox_codes (code, mailboxId, createdBy, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)',
          [patch.mailboxCode, patch.id, patch.ownerAccountKey || 'migration', now, now]
        );
      }
    } catch (e) {
      // 重复 code → 不报错，继续
    }
  }

  const rows = await query('SELECT * FROM mailboxes WHERE id = ? LIMIT 1', [patch.id]);
  return rows && rows.length > 0 ? { ...rows[0], code: rows[0].mailboxCode } : null;
}

async function listMailboxesByMember(accountKey) {
  if (!isMysqlEnabled()) return null;
  accountKey = normalizeAccountKey(accountKey);
  if (!accountKey) return [];
  // memberAccountKeys 是 JSON 数组，使用 JSON_CONTAINS 查询
  const rows = await query(
    `SELECT * FROM mailboxes
     WHERE ownerAccountKey = ? OR JSON_CONTAINS(memberAccountKeys, JSON_QUOTE(?))
     ORDER BY updatedAt DESC`,
    [accountKey, accountKey]
  );
  return (rows || []).map(row => {
    // Parse JSON columns that may be stored as strings
    const parseJson = (val) => {
      if (!val) return {};
      if (typeof val === 'object') return val;
      try { return JSON.parse(val); } catch (_) { return {}; }
    };
    return {
      ...row,
      code: row.mailboxCode,
      memberNames: parseJson(row.memberNames),
      memberCharacters: parseJson(row.memberCharacters),
      memberAccountKeys: parseJson(row.memberAccountKeys)
    };
  });
}

async function listPublicMailboxes(queryText = '') {
  if (!isMysqlEnabled()) return null;
  const text = String(queryText || '').trim();
  let sql = 'SELECT * FROM mailboxes WHERE visibility != ?';
  let params = ['private'];
  if (text) {
    sql += ' AND (mailboxCode = ? OR name LIKE ?)';
    params.push(text.toUpperCase(), `%${text}%`);
  }
  sql += ' ORDER BY updatedAt DESC LIMIT 50';
  const rows = await query(sql, params);
  const parseJson = (val) => {
    if (!val) return {};
    if (typeof val === 'object') return val;
    try { return JSON.parse(val); } catch (_) { return {}; }
  };
  return (rows || []).map(row => ({
    ...row,
    code: row.mailboxCode,
    memberNames: parseJson(row.memberNames),
    memberCharacters: parseJson(row.memberCharacters),
    memberAccountKeys: parseJson(row.memberAccountKeys)
  }));
}

async function getMailboxById(id) {
  if (!isMysqlEnabled()) return null;
  const rows = await query('SELECT * FROM mailboxes WHERE id = ? LIMIT 1', [id]);
  if (rows && rows.length > 0) {
    const row = rows[0];
    const parseJson = (val) => {
      if (!val) return {};
      if (typeof val === 'object') return val;
      try { return JSON.parse(val); } catch (_) { return {}; }
    };
    return {
      ...row,
      code: row.mailboxCode,
      memberNames: parseJson(row.memberNames),
      memberCharacters: parseJson(row.memberCharacters),
      memberAccountKeys: parseJson(row.memberAccountKeys)
    };
  }
  return null;
}

async function findMailboxByCode(code) {
  if (!isMysqlEnabled()) return null;
  const c = String(code || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!c) return null;
  const codeRows = await query('SELECT mailboxId FROM mailbox_codes WHERE code = ? LIMIT 1', [c]);
  if (!codeRows || codeRows.length === 0 || !codeRows[0].mailboxId) return null;
  const mailboxId = codeRows[0].mailboxId;
  const rows = await query('SELECT * FROM mailboxes WHERE id = ? LIMIT 1', [mailboxId]);
  if (rows && rows.length > 0) {
    const row = rows[0];
    const parseJson = (val) => {
      if (!val) return {};
      if (typeof val === 'object') return val;
      try { return JSON.parse(val); } catch (_) { return {}; }
    };
    return {
      ...row,
      code: row.mailboxCode,
      memberNames: parseJson(row.memberNames),
      memberCharacters: parseJson(row.memberCharacters),
      memberAccountKeys: parseJson(row.memberAccountKeys)
    };
  }
  return null;
}

async function joinMailboxByCode(code, accountKey) {
  if (!isMysqlEnabled()) return null;
  accountKey = normalizeAccountKey(accountKey);
  if (!accountKey) return { error: '用户未登录' };
  const c = String(code || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!c) return { error: '信箱号不能为空' };
  const codeRows = await query('SELECT mailboxId FROM mailbox_codes WHERE code = ? LIMIT 1', [c]);
  if (!codeRows || codeRows.length === 0 || !codeRows[0].mailboxId) return { error: '该信箱号不存在' };
  const mailboxId = codeRows[0].mailboxId;
  const mbRows = await query('SELECT * FROM mailboxes WHERE id = ? LIMIT 1', [mailboxId]);
  if (!mbRows || mbRows.length === 0) return { error: '信箱数据已损坏，请重新创建' };
  const mb = mbRows[0];
  
  const parseJson = (val, def) => {
    if (!val) return def || {};
    if (typeof val === 'object') return val;
    try { return JSON.parse(val); } catch (_) { return def || {}; }
  };
  
  let members = parseJson(mb.memberAccountKeys, []);
  let memberNames = parseJson(mb.memberNames, {});
  let memberCharacters = parseJson(mb.memberCharacters, {});
  
  // Try to get user's display name
  let displayName = accountKey;
  try {
    const userRows = await query('SELECT displayName, username, role FROM accounts WHERE accountKey = ? LIMIT 1', [accountKey]);
    if (userRows && userRows.length > 0) {
      const u = userRows[0];
      displayName = u.displayName || u.username || accountKey;
      if (u.role && !memberCharacters[accountKey]) {
        memberCharacters[accountKey] = { characterId: u.role, boundAt: Date.now() };
      }
    } else {
      // Try users table
      const userRows2 = await query('SELECT displayName, username, role FROM users WHERE username = ? LIMIT 1', [accountKey]);
      if (userRows2 && userRows2.length > 0) {
        const u = userRows2[0];
        displayName = u.displayName || u.username || accountKey;
        if (u.role && !memberCharacters[accountKey]) {
          memberCharacters[accountKey] = { characterId: u.role, boundAt: Date.now() };
        }
      }
    }
  } catch (_) {}
  
  memberNames[accountKey] = displayName;
  
  if (!members.includes(accountKey)) {
    members.push(accountKey);
  }
  
  await execute(
    'UPDATE mailboxes SET memberAccountKeys = ?, memberNames = ?, memberCharacters = ?, updatedAt = ? WHERE id = ?',
    [JSON.stringify(members), JSON.stringify(memberNames), JSON.stringify(memberCharacters), Date.now(), mailboxId]
  );
  
  const updatedRows = await query('SELECT * FROM mailboxes WHERE id = ? LIMIT 1', [mailboxId]);
  if (updatedRows && updatedRows.length > 0) {
    const row = updatedRows[0];
    return {
      ...row,
      code: row.mailboxCode,
      memberNames: parseJson(row.memberNames, {}),
      memberCharacters: parseJson(row.memberCharacters, {}),
      memberAccountKeys: parseJson(row.memberAccountKeys, [])
    };
  }
  return null;
}

async function deleteMailbox(id) {
  if (!isMysqlEnabled() || !id) return false;
  const pool = require('./mysqlClient').getPool();
  if (!pool) return false;
  const conn = await pool.getConnection();
  try {
    await conn.query('DELETE FROM letters WHERE mailboxId = ?', [id]);
    const [result] = await conn.query('DELETE FROM mailboxes WHERE id = ?', [id]);
    return result.affectedRows > 0;
  } finally {
    conn.release();
  }
}

/* ---------------- 信件 ---------------- */

async function saveLetter(record) {
  if (!isMysqlEnabled()) return null;
  if (!record || !record.id) return null;
  const now = Date.now();
  record.updatedAt = now;

  const existing = await query('SELECT id FROM letters WHERE id = ? LIMIT 1', [record.id]);
  const fields = {
    mailboxId: String(record.mailboxId || ''),
    senderAccountKey: String(record.senderAccountKey || ''),
    recipientAccountKey: String(record.recipientAccountKey || ''),
    senderIdentity: record.senderIdentity ? JSON.stringify(record.senderIdentity) : null,
    recipientIdentity: record.recipientIdentity ? JSON.stringify(record.recipientIdentity) : null,
    deliveryStatus: String(record.deliveryStatus || 'sent'),
    sentAt: record.sentAt || null,
    readAt: record.readAt || null,
    clientMessageId: record.clientMessageId || null,
    letter: record.letter ? JSON.stringify(record.letter) : null,
    itemAttachments: record.itemAttachments ? JSON.stringify(record.itemAttachments) : null,
    updatedAt: now
  };

  if (existing && existing.length > 0) {
    const sets = [];
    const values = [];
    for (const [k, v] of Object.entries(fields)) {
      sets.push(`\`${k}\` = ?`);
      values.push(v);
    }
    values.push(record.id);
    await execute(`UPDATE letters SET ${sets.join(', ')} WHERE id = ?`, values);
  } else {
    const cols = ['id', 'createdAt'];
    const vals = [record.id, record.createdAt || now];
    for (const [k, v] of Object.entries(fields)) {
      cols.push(k);
      vals.push(v);
    }
    await execute(
      `INSERT INTO letters (${cols.map(c => `\`${c}\``).join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`,
      vals
    );
  }
  const rows = await query('SELECT * FROM letters WHERE id = ? LIMIT 1', [record.id]);
  if (rows && rows.length > 0) {
    const row = rows[0];
    return _parseLetterRow(row);
  }
  return null;
}

function _parseLetterRow(row) {
  if (!row) return null;
  const parsed = { ...row };
  try { parsed.senderIdentity = typeof row.senderIdentity === 'string' ? JSON.parse(row.senderIdentity) : row.senderIdentity; } catch (_) {}
  try { parsed.recipientIdentity = typeof row.recipientIdentity === 'string' ? JSON.parse(row.recipientIdentity) : row.recipientIdentity; } catch (_) {}
  try { parsed.letter = typeof row.letter === 'string' ? JSON.parse(row.letter) : row.letter; } catch (_) {}
  try { parsed.itemAttachments = typeof row.itemAttachments === 'string' ? JSON.parse(row.itemAttachments) : row.itemAttachments; } catch (_) {}
  try {
    if (typeof row.memberAccountKeys === 'string') {
      parsed.memberAccountKeys = JSON.parse(row.memberAccountKeys);
    }
  } catch (_) {}
  return parsed;
}

async function loadLetters(mailboxId, accountKey) {
  if (!isMysqlEnabled()) return null;
  const acc = normalizeAccountKey(accountKey);
  const rows = await query(
    'SELECT * FROM letters WHERE mailboxId = ? ORDER BY updatedAt DESC',
    [String(mailboxId || '')]
  );
  if (!rows) return [];
  return rows
    .map(_parseLetterRow)
    .filter(record => {
      if (!record) return false;
      if (record.deliveryStatus === 'draft') return record.senderAccountKey === acc;
      return record.senderAccountKey === acc || record.recipientAccountKey === acc;
    });
}

/** 管理后台：列出全部信件（无账号过滤，含草稿） */
async function listAllLetters() {
  if (!isMysqlEnabled()) return [];
  const rows = await query('SELECT * FROM letters');
  if (!rows) return [];
  return rows.map(_parseLetterRow).filter(Boolean);
}

/** 管理后台：按 id 查单封信件（完整 letter JSON） */
async function loadLetterById(id) {
  if (!isMysqlEnabled()) return null;
  const rows = await query('SELECT * FROM letters WHERE id = ? LIMIT 1', [String(id)]);
  if (!rows || !rows.length) return null;
  return _parseLetterRow(rows[0]);
}

async function markLetterRead(id, accountKey) {
  if (!isMysqlEnabled()) return null;
  const acc = normalizeAccountKey(accountKey);
  const now = Date.now();
  return execute(
    `UPDATE letters SET readAt = ?, updatedAt = ?
     WHERE id = ? AND (recipientAccountKey = ? OR senderAccountKey = ?)`,
    [now, now, id, acc, acc]
  );
}

async function deleteLetter(id, accountKey) {
  if (!isMysqlEnabled()) return null;
  return execute(
    'DELETE FROM letters WHERE id = ? AND senderAccountKey = ?',
    [id, normalizeAccountKey(accountKey)]
  );
}

/* ---------------- 背包 / 手账 / 战斗 ---------------- */

async function inventoryState(accountKey) {
  if (!isMysqlEnabled()) return null;
  const acc = normalizeAccountKey(accountKey);
  const rows = await query('SELECT * FROM inventories WHERE accountKey = ? LIMIT 1', [acc]);
  if (rows && rows.length > 0) {
    const doc = rows[0];
    let itemIds = [], equipment = {}, quickSlots = [];
    try { itemIds = typeof doc.itemIds === 'string' ? JSON.parse(doc.itemIds) : (doc.itemIds || []); } catch (_) {}
    try { equipment = typeof doc.equipment === 'string' ? JSON.parse(doc.equipment) : (doc.equipment || {}); } catch (_) {}
    try { quickSlots = typeof doc.quickSlots === 'string' ? JSON.parse(doc.quickSlots) : (doc.quickSlots || []); } catch (_) {}
    return {
      items: itemIds,
      equipment,
      quickSlots,
      starterGrantVersion: doc.starterGrantVersion || 0,
      pendingCoating: doc.pendingCoating || ''
    };
  }
  return { items: [], equipment: {}, quickSlots: [] };
}

async function saveInventory(accountKey, inventory) {
  if (!isMysqlEnabled()) return null;
  const acc = normalizeAccountKey(accountKey);
  if (!acc) return null;
  const now = Date.now();
  const items = JSON.stringify(Array.isArray(inventory?.items) ? inventory.items : []);
  const equipment = JSON.stringify(inventory?.equipment || {});
  const quickSlots = JSON.stringify(inventory?.quickSlots || []);
  const starterGrantVersion = Number(inventory?.starterGrantVersion) || 0;
  const starterCharacterId = String(inventory?.starterCharacterId || '');
  const pendingCoating = String(inventory?.pendingCoating || '');

  const existing = await query('SELECT id FROM inventories WHERE accountKey = ? LIMIT 1', [acc]);
  if (existing && existing.length > 0) {
    await execute(
      `UPDATE inventories SET itemIds = ?, equipment = ?, quickSlots = ?, starterGrantVersion = ?, starterCharacterId = ?, pendingCoating = ?, updatedAt = ?
       WHERE accountKey = ?`,
      [items, equipment, quickSlots, starterGrantVersion, starterCharacterId, pendingCoating, now, acc]
    );
  } else {
    const id = `inv-${acc}-${Date.now().toString(36)}`;
    await execute(
      `INSERT INTO inventories (id, accountKey, itemIds, equipment, quickSlots, starterGrantVersion, starterCharacterId, pendingCoating, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, acc, items, equipment, quickSlots, starterGrantVersion, starterCharacterId, pendingCoating, now, now]
    );
  }
  return {
    accountKey: acc,
    items: Array.isArray(inventory?.items) ? inventory.items : [],
    equipment: inventory?.equipment || {},
    quickSlots: inventory?.quickSlots || [],
    starterGrantVersion,
    starterCharacterId,
    pendingCoating,
    updatedAt: now
  };
}

async function loadJournal(accountKey, { year, month, day } = {}) {
  if (!isMysqlEnabled()) return null;
  const acc = normalizeAccountKey(accountKey);
  if (day !== undefined && day !== null) {
    const rows = await query(
      'SELECT * FROM journals WHERE accountKey = ? AND year = ? AND month = ? AND day = ? LIMIT 1',
      [acc, year, month, day]
    );
    if (rows && rows.length > 0) {
      const row = rows[0];
      let entries = [];
      try { entries = typeof row.entries === 'string' ? JSON.parse(row.entries) : (row.entries || []); } catch (_) {}
      return { ...row, entries };
    }
    return null;
  }
  const rows = await query(
    'SELECT * FROM journals WHERE accountKey = ? AND year = ? AND month = ? ORDER BY day ASC',
    [acc, year, month]
  );
  if (!rows) return [];
  return rows.map(row => {
    let entries = [];
    try { entries = typeof row.entries === 'string' ? JSON.parse(row.entries) : (row.entries || []); } catch (_) {}
    return { ...row, entries };
  });
}

async function saveJournal(accountKey, entry) {
  if (!isMysqlEnabled()) return null;
  const acc = normalizeAccountKey(accountKey);
  if (!acc || entry?.year == null || entry?.month == null || entry?.day == null) return null;
  const now = Date.now();
  const year = Number(entry.year);
  const month = Number(entry.month);
  const day = Number(entry.day);
  const entries = JSON.stringify(Array.isArray(entry.entries) ? entry.entries : []);

  const existing = await query(
    'SELECT id FROM journals WHERE accountKey = ? AND year = ? AND month = ? AND day = ? LIMIT 1',
    [acc, year, month, day]
  );
  if (existing && existing.length > 0) {
    await execute(
      'UPDATE journals SET entries = ?, updatedAt = ? WHERE accountKey = ? AND year = ? AND month = ? AND day = ?',
      [entries, now, acc, year, month, day]
    );
  } else {
    const id = `jr-${acc}-${year}${month}${day}-${Math.random().toString(36).slice(2, 6)}`;
    await execute(
      `INSERT INTO journals (id, accountKey, year, month, day, entries, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, acc, year, month, day, entries, now, now]
    );
  }
  return { accountKey: acc, year, month, day, entries: JSON.parse(entries), updatedAt: now };
}

async function getCombatProfile(accountKey, characterId) {
  if (!isMysqlEnabled()) return null;
  const rows = await query(
    'SELECT * FROM combat_profiles WHERE accountKey = ? AND characterId = ? LIMIT 1',
    [normalizeAccountKey(accountKey), characterId]
  );
  return rows && rows.length > 0 ? rows[0] : null;
}

async function saveCombatProfile(accountKey, characterId, profile) {
  if (!isMysqlEnabled()) return null;
  const acc = normalizeAccountKey(accountKey);
  const now = Date.now();
  const existing = await query(
    'SELECT id FROM combat_profiles WHERE accountKey = ? AND characterId = ? LIMIT 1',
    [acc, characterId]
  );
  const fields = {
    hp: Number(profile.hp ?? 100),
    maxHp: Number(profile.maxHp ?? 100),
    martial: Number(profile.martial ?? 0),
    baseDefense: Number(profile.baseDefense ?? 4),
    poisonedUntil: Number(profile.poisonedUntil ?? 0),
    nextPoisonTickAt: Number(profile.nextPoisonTickAt ?? 0),
    immobilizedUntil: Number(profile.immobilizedUntil ?? 0),
    invulnerableUntil: Number(profile.invulnerableUntil ?? 0),
    lastAttackAt: Number(profile.lastAttackAt ?? 0),
    goldPlaqueCooldownUntil: Number(profile.goldPlaqueCooldownUntil ?? 0),
    lastOnlineAt: Number(profile.lastOnlineAt ?? Date.now()),
    updatedAt: now
  };
  if (existing && existing.length > 0) {
    const sets = [];
    const values = [];
    for (const [k, v] of Object.entries(fields)) {
      sets.push(`\`${k}\` = ?`);
      values.push(v);
    }
    values.push(acc, characterId);
    await execute(`UPDATE combat_profiles SET ${sets.join(', ')} WHERE accountKey = ? AND characterId = ?`, values);
  } else {
    const id = `cp-${acc}-${characterId}-${Math.random().toString(36).slice(2, 6)}`;
    const cols = ['id', 'accountKey', 'characterId', 'createdAt'];
    const vals = [id, acc, characterId, now];
    for (const [k, v] of Object.entries(fields)) {
      cols.push(k);
      vals.push(v);
    }
    await execute(
      `INSERT INTO combat_profiles (${cols.map(c => `\`${c}\``).join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`,
      vals
    );
  }
  const rows = await query(
    'SELECT * FROM combat_profiles WHERE accountKey = ? AND characterId = ? LIMIT 1',
    [acc, characterId]
  );
  return rows && rows.length > 0 ? rows[0] : null;
}

/* ---------------- 扩展：物品实例 / 世界档案 / 角色绑定 ---------------- */

async function saveItemInstance(instance) {
  if (!isMysqlEnabled()) return null;
  if (!instance || !instance.instanceId) return null;
  const now = Date.now();
  const existing = await query('SELECT instanceId FROM item_instances WHERE instanceId = ? LIMIT 1', [instance.instanceId]);
  const fields = {
    definitionId: String(instance.definitionId || ''),
    locationType: String(instance.locationType || 'world'),
    mapKey: String(instance.mapKey || ''),
    nodeId: String(instance.nodeId || ''),
    nx: Number(instance.nx) || 0,
    ny: Number(instance.ny) || 0,
    ownerAccountKey: String(instance.ownerAccountKey || ''),
    equippedSlot: String(instance.equippedSlot || ''),
    origin: instance.origin ? JSON.stringify(instance.origin) : null,
    acquisition: instance.acquisition ? JSON.stringify(instance.acquisition) : null,
    escrowLetterId: String(instance.escrowLetterId || ''),
    pendingOwnerAccountKey: String(instance.pendingOwnerAccountKey || ''),
    spawnedAt: Number(instance.spawnedAt) || now,
    generation: Number(instance.generation) || 1
  };
  if (existing && existing.length > 0) {
    const sets = [];
    const values = [];
    for (const [k, v] of Object.entries(fields)) {
      sets.push(`\`${k}\` = ?`);
      values.push(v);
    }
    values.push(instance.instanceId);
    await execute(`UPDATE item_instances SET ${sets.join(', ')} WHERE instanceId = ?`, values);
  } else {
    const cols = ['instanceId'];
    const vals = [instance.instanceId];
    for (const [k, v] of Object.entries(fields)) {
      cols.push(k);
      vals.push(v);
    }
    await execute(
      `INSERT INTO item_instances (${cols.map(c => `\`${c}\``).join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`,
      vals
    );
  }
  return instance;
}

async function getItemInstance(instanceId) {
  if (!isMysqlEnabled()) return null;
  const rows = await query('SELECT * FROM item_instances WHERE instanceId = ? LIMIT 1', [instanceId]);
  if (rows && rows.length > 0) {
    const row = rows[0];
    try { row.origin = typeof row.origin === 'string' ? JSON.parse(row.origin) : row.origin; } catch (_) {}
    try { row.acquisition = typeof row.acquisition === 'string' ? JSON.parse(row.acquisition) : row.acquisition; } catch (_) {}
    return row;
  }
  return null;
}

async function listItemInstances(filter = {}) {
  if (!isMysqlEnabled()) return null;
  const conditions = [];
  const params = [];
  if (filter.mapKey) { conditions.push('mapKey = ?'); params.push(filter.mapKey); }
  if (filter.locationType) { conditions.push('locationType = ?'); params.push(filter.locationType); }
  if (filter.ownerAccountKey) { conditions.push('ownerAccountKey = ?'); params.push(filter.ownerAccountKey); }
  if (filter.escrowLetterId) { conditions.push('escrowLetterId = ?'); params.push(filter.escrowLetterId); }
  let sql = 'SELECT * FROM item_instances';
  if (conditions.length > 0) sql += ' WHERE ' + conditions.join(' AND ');
  const rows = await query(sql, params);
  if (!rows) return [];
  return rows.map(row => {
    try { row.origin = typeof row.origin === 'string' ? JSON.parse(row.origin) : row.origin; } catch (_) {}
    try { row.acquisition = typeof row.acquisition === 'string' ? JSON.parse(row.acquisition) : row.acquisition; } catch (_) {}
    return row;
  });
}

async function deleteItemInstance(instanceId) {
  if (!isMysqlEnabled()) return null;
  return execute('DELETE FROM item_instances WHERE instanceId = ?', [instanceId]);
}

async function saveWorldProfile(worldId, accountKey, patch = {}) {
  if (!isMysqlEnabled()) return null;
  const acc = normalizeAccountKey(accountKey);
  const now = Date.now();
  const xiejianCharacterId = patch.xiejianCharacterId || '';
  const lastXiejianMapKey = patch.lastXiejianMapKey || '';
  const existing = await query(
    'SELECT id FROM world_profiles WHERE worldId = ? AND accountKey = ? LIMIT 1',
    [worldId, acc]
  );
  if (existing && existing.length > 0) {
    await execute(
      'UPDATE world_profiles SET xiejianCharacterId = ?, lastXiejianMapKey = ?, updatedAt = ? WHERE worldId = ? AND accountKey = ?',
      [xiejianCharacterId, lastXiejianMapKey, now, worldId, acc]
    );
  } else {
    const id = `wp-${worldId}-${acc}-${Math.random().toString(36).slice(2, 6)}`;
    await execute(
      `INSERT INTO world_profiles (id, worldId, accountKey, xiejianCharacterId, lastXiejianMapKey, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, worldId, acc, xiejianCharacterId, lastXiejianMapKey, now, now]
    );
  }
  return { worldId, accountKey: acc, xiejianCharacterId, lastXiejianMapKey, updatedAt: now };
}

async function getWorldProfile(worldId, accountKey) {
  if (!isMysqlEnabled()) return null;
  const rows = await query(
    'SELECT * FROM world_profiles WHERE worldId = ? AND accountKey = ? LIMIT 1',
    [worldId, normalizeAccountKey(accountKey)]
  );
  return rows && rows.length > 0 ? rows[0] : null;
}

async function saveWorldRoleBinding(worldId, characterId, accountKey) {
  if (!isMysqlEnabled()) return null;
  const acc = normalizeAccountKey(accountKey);
  const now = Date.now();
  const existing = await query(
    'SELECT id FROM world_role_bindings WHERE worldId = ? AND characterId = ? LIMIT 1',
    [worldId, characterId]
  );
  if (existing && existing.length > 0) {
    await execute(
      'UPDATE world_role_bindings SET accountKey = ?, updatedAt = ? WHERE worldId = ? AND characterId = ?',
      [acc, now, worldId, characterId]
    );
  } else {
    const id = `wrb-${worldId}-${characterId}`;
    await execute(
      `INSERT INTO world_role_bindings (id, worldId, characterId, accountKey, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, worldId, characterId, acc, now, now]
    );
  }
  return { worldId, characterId, accountKey: acc, updatedAt: now };
}

async function getWorldRoleBindings(worldId) {
  if (!isMysqlEnabled()) return null;
  const rows = await query('SELECT * FROM world_role_bindings WHERE worldId = ?', [worldId]);
  if (!rows || rows.length === 0) return {};
  const bindings = {};
  for (const row of rows) {
    bindings[row.characterId] = row.accountKey;
  }
  return bindings;
}

async function saveItemRespawn(item) {
  if (!isMysqlEnabled()) return null;
  if (!item) return null;
  const now = Date.now();
  const id = item.id || `ir-${item.instanceId || Math.random().toString(36).slice(2, 10)}`;
  const existing = await query('SELECT id FROM item_respawns WHERE id = ? LIMIT 1', [id]);
  if (existing && existing.length > 0) {
    await execute(
      'UPDATE item_respawns SET instanceId = ?, mapKey = ?, nodeId = ?, definitionId = ?, respawnAt = ? WHERE id = ?',
      [item.instanceId || '', item.mapKey || '', item.nodeId || '', item.definitionId || '', Number(item.respawnAt) || 0, id]
    );
  } else {
    await execute(
      `INSERT INTO item_respawns (id, instanceId, mapKey, nodeId, definitionId, respawnAt, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, item.instanceId || '', item.mapKey || '', item.nodeId || '', item.definitionId || '', Number(item.respawnAt) || 0, now]
    );
  }
  return item;
}

async function listItemRespawns() {
  if (!isMysqlEnabled()) return null;
  return query('SELECT * FROM item_respawns');
}

/* ---------------- 角色/地图定义管理（动态上传）---------------- */

async function saveCharacterDefinition(worldCategory, def) {
  if (!isMysqlEnabled() || !def || !def.id) return null;
  const now = Date.now();
  const definitionJson = JSON.stringify(def);
  const existing = await query('SELECT id FROM character_definitions WHERE id = ? LIMIT 1', [def.id]);
  if (existing && existing.length > 0) {
    await execute(
      `UPDATE character_definitions SET worldCategory = ?, name = ?, definition = ?, enabled = 1, updatedAt = ? WHERE id = ?`,
      [worldCategory, def.name || '', definitionJson, now, def.id]
    );
  } else {
    await execute(
      `INSERT INTO character_definitions (id, worldCategory, name, definition, displayOrder, enabled, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [def.id, worldCategory, def.name || '', definitionJson, 999, 1, now, now]
    );
  }
  return def;
}

async function listCharacterDefinitions(worldCategory = null) {
  if (!isMysqlEnabled()) return [];
  let sql = 'SELECT * FROM character_definitions WHERE enabled = 1';
  const params = [];
  if (worldCategory) { sql += ' AND worldCategory = ?'; params.push(worldCategory); }
  sql += ' ORDER BY displayOrder ASC, createdAt ASC';
  const rows = await query(sql, params);
  if (!rows) return [];
  return rows.map(row => {
    let def = {};
    try { def = typeof row.definition === 'string' ? JSON.parse(row.definition) : (row.definition || {}); } catch (_) {}
    return { ...def, id: row.id, worldCategory: row.worldCategory };
  });
}

/** 返回全部角色定义（含 enabled=0 的软删除墓碑），definition 为已解析对象 */
async function listAllCharacterDefinitions(worldCategory = null) {
  if (!isMysqlEnabled()) return [];
  let sql = 'SELECT * FROM character_definitions';
  const params = [];
  if (worldCategory) { sql += ' WHERE worldCategory = ?'; params.push(worldCategory); }
  sql += ' ORDER BY displayOrder ASC, createdAt ASC';
  const rows = await query(sql, params);
  if (!rows) return [];
  return rows.map(row => ({
    id: row.id,
    worldCategory: row.worldCategory,
    name: row.name,
    enabled: !!row.enabled,
    displayOrder: row.displayOrder,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    definition: (() => {
      try { return typeof row.definition === 'string' ? JSON.parse(row.definition) : (row.definition || {}); } catch (_) { return {}; }
    })(),
  }));
}

async function deleteCharacterDefinition(characterId) {
  if (!isMysqlEnabled() || !characterId) return false;
  const result = await execute('DELETE FROM character_definitions WHERE id = ?', [characterId]);
  return result && result.affectedRows > 0;
}

/** 软删除（墓碑）：将内置角色禁用并持久化，重启后依然隐藏；重新上传同 id 会恢复 */
async function disableCharacterDefinition(characterId, worldCategory = 'custom', name = '') {
  if (!isMysqlEnabled() || !characterId) return false;
  const now = Date.now();
  const existing = await query('SELECT id FROM character_definitions WHERE id = ? LIMIT 1', [characterId]);
  if (existing && existing.length > 0) {
    const result = await execute(
      'UPDATE character_definitions SET enabled = 0, updatedAt = ? WHERE id = ?',
      [now, characterId]
    );
    return !!(result && result.affectedRows > 0);
  }
  const result = await execute(
    `INSERT INTO character_definitions (id, worldCategory, name, definition, displayOrder, enabled, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [characterId, worldCategory, name, JSON.stringify({ id: characterId }), 999, 0, now, now]
  );
  return !!(result && result.affectedRows > 0);
}

async function saveMapDefinition(worldCategory, def) {
  if (!isMysqlEnabled() || !def || !def.key) return null;
  const now = Date.now();
  const definitionJson = JSON.stringify(def);
  const existing = await query('SELECT id FROM map_definitions WHERE id = ? LIMIT 1', [def.key]);
  if (existing && existing.length > 0) {
    await execute(
      `UPDATE map_definitions SET worldCategory = ?, name = ?, definition = ?, enabled = 1, updatedAt = ? WHERE id = ?`,
      [worldCategory, def.name || '', definitionJson, now, def.key]
    );
  } else {
    await execute(
      `INSERT INTO map_definitions (id, worldCategory, name, definition, displayOrder, enabled, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [def.key, worldCategory, def.name || '', definitionJson, 999, 1, now, now]
    );
  }
  return def;
}

async function listMapDefinitions(worldCategory = null) {
  if (!isMysqlEnabled()) return [];
  let sql = 'SELECT * FROM map_definitions WHERE enabled = 1';
  const params = [];
  if (worldCategory) { sql += ' AND worldCategory = ?'; params.push(worldCategory); }
  sql += ' ORDER BY displayOrder ASC, createdAt ASC';
  const rows = await query(sql, params);
  if (!rows) return [];
  return rows.map(row => {
    let def = {};
    try { def = typeof row.definition === 'string' ? JSON.parse(row.definition) : (row.definition || {}); } catch (_) {}
    return { ...def, key: row.id, id: row.id, worldCategory: row.worldCategory };
  });
}

/** 返回全部地图定义（含 enabled=0 的软删除墓碑），definition 为已解析对象 */
async function listAllMapDefinitions(worldCategory = null) {
  if (!isMysqlEnabled()) return [];
  let sql = 'SELECT * FROM map_definitions';
  const params = [];
  if (worldCategory) { sql += ' WHERE worldCategory = ?'; params.push(worldCategory); }
  sql += ' ORDER BY displayOrder ASC, createdAt ASC';
  const rows = await query(sql, params);
  if (!rows) return [];
  return rows.map(row => ({
    id: row.id,
    worldCategory: row.worldCategory,
    name: row.name,
    enabled: !!row.enabled,
    displayOrder: row.displayOrder,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    definition: (() => {
      try { return typeof row.definition === 'string' ? JSON.parse(row.definition) : (row.definition || {}); } catch (_) { return {}; }
    })(),
  }));
}

async function deleteMapDefinition(mapKey) {
  if (!isMysqlEnabled() || !mapKey) return false;
  const result = await execute('DELETE FROM map_definitions WHERE id = ?', [mapKey]);
  return result && result.affectedRows > 0;
}

/** 软删除（墓碑）：将内置地图禁用并持久化，重启后依然隐藏；重新上传同 key 会恢复 */
async function disableMapDefinition(mapKey, worldCategory = 'custom', name = '') {
  if (!isMysqlEnabled() || !mapKey) return false;
  const now = Date.now();
  const existing = await query('SELECT id FROM map_definitions WHERE id = ? LIMIT 1', [mapKey]);
  if (existing && existing.length > 0) {
    const result = await execute(
      'UPDATE map_definitions SET enabled = 0, updatedAt = ? WHERE id = ?',
      [now, mapKey]
    );
    return !!(result && result.affectedRows > 0);
  }
  const result = await execute(
    `INSERT INTO map_definitions (id, worldCategory, name, definition, displayOrder, enabled, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [mapKey, worldCategory, name, JSON.stringify({ id: mapKey }), 999, 0, now, now]
  );
  return !!(result && result.affectedRows > 0);
}

/* ---------------- 批量：把内存 state.json 中的数据迁到 MySQL（冷启动一次即可） ---------------- */

async function importFromState(state, options = {}) {
  if (!isMysqlEnabled() || !state) return;
  const {
    writeAccounts = true,
    writeLetters = true,
    writeInventories = true,
    writeProfiles = true,
    writeMailboxes = true,
    writeItemInstances = true,
    writeCombatProfiles = true,
    writeWorldProfiles = true,
    writeWorldRoleBindings = true,
    writeItemRespawns = true,
    writeUsers = true
  } = options;

  const stats = { accounts: 0, profiles: 0, letters: 0, inventories: 0, mailboxes: 0, itemInstances: 0, combatProfiles: 0, worldProfiles: 0, worldRoleBindings: 0, itemRespawns: 0, users: 0 };

  // users（如果 state 里有独立 users 表）
  if (writeUsers && state.users) {
    for (const [, u] of Object.entries(state.users)) {
      try {
        const existing = await query('SELECT id FROM users WHERE username = ? LIMIT 1', [u.username]);
        if (!existing || existing.length === 0) {
          const now = Date.now();
          await execute(
            `INSERT INTO users (id, username, passwordHash, displayName, avatar, role, createdAt, updatedAt, lastLoginAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [u.id || genBusinessId('user'), u.username, u.passwordHash || '', u.displayName || u.username, u.avatar || '', u.role || 'user', u.createdAt || now, u.updatedAt || now, u.lastLoginAt || null]
          );
          stats.users++;
        }
      } catch (e) { console.warn('[dao] import user 跳过：', e?.message || e); }
    }
  }

  if (writeAccounts && state.accounts) {
    for (const [k, a] of Object.entries(state.accounts)) {
      try {
        const ak = normalizeAccountKey(k);
        await syncAccount({
          accountKey: ak,
          username: a.username || ak,
          displayName: a.displayName,
          role: a.role,
          userId: a.userId
        });
        stats.accounts++;
      } catch (e) { console.warn('[dao] import account 跳过：', e?.message || e); }
    }
  }

  if (writeProfiles && state.profiles) {
    for (const [k, p] of Object.entries(state.profiles)) {
      try {
        await setProfile(k, typeof p === 'object' ? p : { xiejianCharacterId: String(p || '') });
        stats.profiles++;
      } catch (e) { console.warn('[dao] import profile 跳过：', e?.message || e); }
    }
  }

  if (writeWorldProfiles && state.worldProfiles) {
    for (const [worldId, profiles] of Object.entries(state.worldProfiles || {})) {
      for (const [accountKey, p] of Object.entries(profiles || {})) {
        try {
          await saveWorldProfile(worldId, accountKey, p || {});
          stats.worldProfiles++;
        } catch (e) { console.warn('[dao] import world profile 跳过：', e?.message || e); }
      }
    }
  }

  if (writeWorldRoleBindings && state.worldRoleBindings) {
    for (const [worldId, bindings] of Object.entries(state.worldRoleBindings || {})) {
      for (const [characterId, accountKey] of Object.entries(bindings || {})) {
        try {
          await saveWorldRoleBinding(worldId, characterId, accountKey);
          stats.worldRoleBindings++;
        } catch (e) { console.warn('[dao] import world role binding 跳过：', e?.message || e); }
      }
    }
  }

  if (writeMailboxes && state.mailboxes) {
    for (const [, mb] of Object.entries(state.mailboxes)) {
      try {
        await upsertMailboxRemote(mb);
        stats.mailboxes++;
      } catch (e) { console.warn('[dao] import mailbox 跳过：', e?.message || e); }
    }
  }

  if (writeLetters && state.letters) {
    for (const [, l] of Object.entries(state.letters)) {
      try {
        await saveLetter(l);
        stats.letters++;
      } catch (e) { console.warn('[dao] import letter 跳过：', e?.message || e); }
    }
  }

  if (writeInventories && state.inventories) {
    for (const [k, inv] of Object.entries(state.inventories)) {
      try {
        await saveInventory(k, inv);
        stats.inventories++;
      } catch (e) { console.warn('[dao] import inventory 跳过：', e?.message || e); }
    }
  }

  if (writeItemInstances && state.itemInstances) {
    for (const [, inst] of Object.entries(state.itemInstances)) {
      try {
        await saveItemInstance(inst);
        stats.itemInstances++;
      } catch (e) { console.warn('[dao] import item instance 跳过：', e?.message || e); }
    }
  }

  if (writeCombatProfiles && state.combatProfiles) {
    for (const [accountKey, profile] of Object.entries(state.combatProfiles)) {
      try {
        // 兼容旧数据：characterId 可能在 profile 内，也可能为空
        const characterId = profile.characterId || '';
        await saveCombatProfile(accountKey, characterId, profile);
        stats.combatProfiles++;
      } catch (e) { console.warn('[dao] import combat profile 跳过：', e?.message || e); }
    }
  }

  if (writeItemRespawns && Array.isArray(state.itemRespawns)) {
    for (const item of state.itemRespawns) {
      try {
        await saveItemRespawn(item);
        stats.itemRespawns++;
      } catch (e) { console.warn('[dao] import item respawn 跳过：', e?.message || e); }
    }
  }

  console.log('[dao] importFromState 完成：', stats);
  return stats;
}

/* ---------------- 启动时从 MySQL 加载到内存（避免冷启动空数据） ---------------- */

async function loadAllFromState(persistentState) {
  if (!isMysqlEnabled()) return;
  const pool = require('./mysqlClient').getPool();
  if (!pool) return;

  try {
    // accounts
    const accounts = await query('SELECT * FROM accounts');
    if (accounts) {
      for (const a of accounts) {
        let linkedMailboxIds = [];
        try { linkedMailboxIds = typeof a.linkedMailboxIds === 'string' ? JSON.parse(a.linkedMailboxIds) : (a.linkedMailboxIds || []); } catch (_) {}
        persistentState.accounts[a.accountKey] = {
          id: a.id,
          accountKey: a.accountKey,
          username: a.username,
          displayName: a.displayName,
          role: a.role,
          userId: a.userId,
          linkedMailboxIds,
          createdAt: a.createdAt,
          updatedAt: a.updatedAt,
          lastSeenAt: a.updatedAt
        };
      }
    }

    // profiles
    const profiles = await query('SELECT * FROM profiles');
    if (profiles) {
      for (const p of profiles) {
        persistentState.profiles[p.accountKey] = {
          xiejianCharacterId: p.xiejianCharacterId || '',
          lastXiejianMapKey: p.lastXiejianMapKey || ''
        };
      }
    }

    // worldProfiles + worldRoleBindings
    const worldProfiles = await query('SELECT * FROM world_profiles');
    if (worldProfiles) {
      for (const wp of worldProfiles) {
        persistentState.worldProfiles[wp.worldId] ||= {};
        persistentState.worldProfiles[wp.worldId][wp.accountKey] = {
          xiejianCharacterId: wp.xiejianCharacterId || '',
          lastXiejianMapKey: wp.lastXiejianMapKey || ''
        };
      }
    }
    const worldRoleBindings = await query('SELECT * FROM world_role_bindings');
    if (worldRoleBindings) {
      for (const wrb of worldRoleBindings) {
        persistentState.worldRoleBindings[wrb.worldId] ||= {};
        persistentState.worldRoleBindings[wrb.worldId][wrb.characterId] = wrb.accountKey;
      }
    }

    // mailboxes + mailboxCodes
    const mailboxes = await query('SELECT * FROM mailboxes');
    if (mailboxes) {
      for (const mb of mailboxes) {
        let memberAccountKeys = [];
        try { memberAccountKeys = typeof mb.memberAccountKeys === 'string' ? JSON.parse(mb.memberAccountKeys) : (mb.memberAccountKeys || []); } catch (_) {}
        persistentState.mailboxes[mb.id] = {
          ...mb,
          isCustom: !!mb.isCustom,
          memberAccountKeys,
          code: mb.mailboxCode,
          mailboxCode: mb.mailboxCode,
          joinCode: mb.mailboxCode
        };
        if (mb.mailboxCode) {
          persistentState.mailboxCodes[mb.mailboxCode] = mb.id;
        }
      }
    }

    // letters
    const letters = await query('SELECT * FROM letters');
    if (letters) {
      for (const l of letters) {
        const parsed = _parseLetterRow(l);
        if (parsed) persistentState.letters[parsed.id] = parsed;
      }
    }

    // itemInstances
    const itemInstances = await query('SELECT * FROM item_instances');
    if (itemInstances) {
      for (const inst of itemInstances) {
        let origin = inst.origin, acquisition = inst.acquisition;
        try { origin = typeof inst.origin === 'string' ? JSON.parse(inst.origin) : inst.origin; } catch (_) {}
        try { acquisition = typeof inst.acquisition === 'string' ? JSON.parse(inst.acquisition) : inst.acquisition; } catch (_) {}
        persistentState.itemInstances[inst.instanceId] = {
          instanceId: inst.instanceId,
          definitionId: inst.definitionId,
          locationType: inst.locationType,
          mapKey: inst.mapKey,
          nodeId: inst.nodeId,
          nx: inst.nx,
          ny: inst.ny,
          ownerAccountKey: inst.ownerAccountKey,
          equippedSlot: inst.equippedSlot,
          origin,
          acquisition,
          escrowLetterId: inst.escrowLetterId,
          pendingOwnerAccountKey: inst.pendingOwnerAccountKey,
          spawnedAt: inst.spawnedAt,
          generation: inst.generation
        };
      }
    }

    // inventories
    const inventories = await query('SELECT * FROM inventories');
    if (inventories) {
      for (const inv of inventories) {
        let itemIds = [], equipment = {}, quickSlots = [];
        try { itemIds = typeof inv.itemIds === 'string' ? JSON.parse(inv.itemIds) : (inv.itemIds || []); } catch (_) {}
        try { equipment = typeof inv.equipment === 'string' ? JSON.parse(inv.equipment) : (inv.equipment || {}); } catch (_) {}
        try { quickSlots = typeof inv.quickSlots === 'string' ? JSON.parse(inv.quickSlots) : (inv.quickSlots || []); } catch (_) {}
        persistentState.inventories[inv.accountKey] = {
          itemIds,
          equipment,
          quickSlots,
          starterGrantVersion: inv.starterGrantVersion || 0,
          starterCharacterId: inv.starterCharacterId || '',
          pendingCoating: inv.pendingCoating || ''
        };
      }
    }

    // combatProfiles
    const combatProfiles = await query('SELECT * FROM combat_profiles');
    if (combatProfiles) {
      for (const cp of combatProfiles) {
        persistentState.combatProfiles[cp.accountKey] = {
          hp: cp.hp,
          maxHp: cp.maxHp,
          martial: cp.martial,
          baseDefense: cp.baseDefense,
          poisonedUntil: cp.poisonedUntil,
          nextPoisonTickAt: cp.nextPoisonTickAt,
          immobilizedUntil: cp.immobilizedUntil,
          invulnerableUntil: cp.invulnerableUntil,
          lastAttackAt: cp.lastAttackAt,
          goldPlaqueCooldownUntil: cp.goldPlaqueCooldownUntil,
          lastOnlineAt: cp.lastOnlineAt,
          characterId: cp.characterId
        };
      }
    }

    // itemRespawns
    const itemRespawns = await query('SELECT * FROM item_respawns');
    if (itemRespawns) {
      persistentState.itemRespawns = itemRespawns.map(r => ({
        instanceId: r.instanceId,
        mapKey: r.mapKey,
        nodeId: r.nodeId,
        definitionId: r.definitionId,
        respawnAt: r.respawnAt
      }));
    }

    // worldSeedVersion
    if (Object.keys(persistentState.itemInstances).length > 0) {
      persistentState.worldSeedVersion = 1;
    }

    console.log('[dao] loadAllFromState 完成：',
      'accounts=', Object.keys(persistentState.accounts).length,
      'mailboxes=', Object.keys(persistentState.mailboxes).length,
      'letters=', Object.keys(persistentState.letters).length,
      'itemInstances=', Object.keys(persistentState.itemInstances).length);
  } catch (e) {
    console.warn('[dao] loadAllFromState 失败：', e?.message || e);
  }
}

module.exports = {
  // utils
  normalizeAccountKey,
  generateMailboxCode,
  sanitizeUser,
  genBusinessId,
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
  deleteMailbox,
  // letters
  saveLetter,
  loadLetters,
  listAllLetters,
  loadLetterById,
  markLetterRead,
  deleteLetter,
  // inventory / journal / combat
  inventoryState,
  saveInventory,
  loadJournal,
  saveJournal,
  getCombatProfile,
  saveCombatProfile,
  // 扩展
  saveItemInstance,
  getItemInstance,
  listItemInstances,
  deleteItemInstance,
  saveWorldProfile,
  getWorldProfile,
  saveWorldRoleBinding,
  getWorldRoleBindings,
  saveItemRespawn,
  listItemRespawns,
  // migration
  importFromState,
  loadAllFromState,
  // character/map definitions
  saveCharacterDefinition,
  listCharacterDefinitions,
  listAllCharacterDefinitions,
  deleteCharacterDefinition,
  disableCharacterDefinition,
  saveMapDefinition,
  listMapDefinitions,
  listAllMapDefinitions,
  deleteMapDefinition,
  disableMapDefinition
};
