/* ============================================================
 *  mongoClient.js — MongoDB 连接池（单例）
 *  连接：MONGO_ENABLED=1 才真正连接，=0 则 getCollection 返回 null，
 *  上层 DAO/server.js 根据 isMongoEnabled() 判断走 state.json 降级。
 * ============================================================ */
require('dotenv').config();
const { MongoClient } = require('mongodb');

const DEFAULT_URI = process.env.MONGO_URI || 'mongodb://47.115.220.98:27017/map_data';
const DEFAULT_DB = process.env.MONGO_DB_NAME || 'map_data';
const ENABLED = String(process.env.MONGO_ENABLED || '0') === '1';

let _client = null;
let _db = null;
let _initPromise = null;
let _enabled = false;

const COLLECTIONS = {
  USERS: 'users',
  ACCOUNTS: 'accounts',
  PROFILES: 'profiles',
  MAILBOXES: 'mailboxes',
  MAILBOX_CODES: 'mailbox_codes',
  LETTERS: 'letters',
  INVENTORIES: 'inventories',
  JOURNALS: 'journals',
  COMBAT_PROFILES: 'combat_profiles',
  MAP_POINTS: 'map_points'
};

/** 连接 MongoDB（幂等）。如果连接失败则标记为不可用，走本地降级。
 *  @returns {Promise<boolean>} 连接成功返回 true，失败返回 false
 */
async function initMongo() {
  if (_initPromise) return _initPromise;
  _initPromise = (async () => {
    if (!ENABLED) {
      console.log('[mongo] MONGO_ENABLED != 1，跳过 MongoDB，本地 state.json 模式');
      return false;
    }
    try {
      const opts = {
        connectTimeoutMS: 5000,
        serverSelectionTimeoutMS: 5000,
        maxPoolSize: 20
      };
      _client = new MongoClient(DEFAULT_URI, opts);
      await _client.connect();
      _db = _client.db(DEFAULT_DB);
      _enabled = true;
      console.log(`[mongo] 已连接 → ${DEFAULT_URI}，DB=${DEFAULT_DB}`);
      await _ensureIndexes();
      return true;
    } catch (err) {
      console.warn('[mongo] 连接失败，自动降级到 state.json 本地模式：', err?.message || err);
      _enabled = false;
      try { if (_client) await _client.close().catch(() => {}); } catch (_) {}
      _client = null;
      _db = null;
      return false;
    }
  })();
  return _initPromise;
}

function isMongoEnabled() { return _enabled; }

function getDb() {
  if (!_enabled) return null;
  return _db;
}

/** 获取集合；Mongo 未启用/未连接返回 null
 *  调用方需判空。
 */
function getCollection(name) {
  if (!_enabled || !_db) return null;
  if (!COLLECTIONS[name] || Object.values(COLLECTIONS).includes(name)) return _db.collection(name);
  return _db.collection(name);
}

async function _ensureIndexes() {
  if (!_db) return;
  const db = _db;

  // users
  await db.collection(COLLECTIONS.USERS).createIndex({ username: 1 }, { unique: true });
  await db.collection(COLLECTIONS.USERS).createIndex({ createdAt: -1 });

  // accounts（老的默认是空 1:1 对 users
  await db.collection(COLLECTIONS.ACCOUNTS).createIndex({ accountKey: 1 }, { unique: true });
  await db.collection(COLLECTIONS.ACCOUNTS).createIndex({ userId: 1 }, { unique: true });

  // profiles
  await db.collection(COLLECTIONS.PROFILES).createIndex({ accountKey: 1 }, { unique: true });

  // mailboxes
  await db.collection(COLLECTIONS.MAILBOXES).createIndex({ id: 1 }, { unique: true });
  await db.collection(COLLECTIONS.MAILBOXES).createIndex({ mailboxCode: 1 }, { unique: true, sparse: true });
  await db.collection(COLLECTIONS.MAILBOXES).createIndex({ ownerAccountKey: 1 });
  await db.collection(COLLECTIONS.MAILBOXES).createIndex({ memberAccountKeys: 1 });

  // mailbox_codes —— 全局唯一信箱码 → mailboxId 索引表
  await db.collection(COLLECTIONS.MAILBOX_CODES).createIndex({ code: 1 }, { unique: true });
  await db.collection(COLLECTIONS.MAILBOX_CODES).createIndex({ mailboxId: 1 });
  await db.collection(COLLECTIONS.MAILBOX_CODES).createIndex({ createdAt: -1 });

  // letters
  await db.collection(COLLECTIONS.LETTERS).createIndex({ id: 1 }, { unique: true });
  await db.collection(COLLECTIONS.LETTERS).createIndex({ mailboxId: 1, senderAccountKey: 1 });
  await db.collection(COLLECTIONS.LETTERS).createIndex({ mailboxId: 1, recipientAccountKey: 1 });
  await db.collection(COLLECTIONS.LETTERS).createIndex({ mailboxId: 1, updatedAt: -1 });
  await db.collection(COLLECTIONS.LETTERS).createIndex({ clientMessageId: 1 });

  // inventories
  await db.collection(COLLECTIONS.INVENTORIES).createIndex({ accountKey: 1 }, { unique: true });

  // journals
  await db.collection(COLLECTIONS.JOURNALS).createIndex(
    { accountKey: 1, year: 1, month: 1, day: 1 },
    { unique: true }
  );
  await db.collection(COLLECTIONS.JOURNALS).createIndex({ accountKey: 1, year: 1, month: 1 });

  // combat_profiles
  await db.collection(COLLECTIONS.COMBAT_PROFILES).createIndex(
    { accountKey: 1, characterId: 1 },
    { unique: true }
  );

  console.log('[mongo] 所有集合索引已就绪');
}

async function closeMongo() {
  if (_client) {
    try { await _client.close(); } catch (_) {}
    _client = null;
  }
  _db = null;
  _enabled = false;
  _initPromise = null;
}

module.exports = {
  initMongo,
  isMongoEnabled,
  getDb,
  getCollection,
  closeMongo,
  COLLECTIONS
};
