/* ============================================================
 *  mysqlClient.js — MySQL 连接池（单例）
 *  连接：MYSQL_ENABLED=1 才真正连接，=0 则降级到 state.json，
 *  上层 DAO/server.js 根据 isMysqlEnabled() 判断走本地降级。
 * ============================================================ */
require('dotenv').config();
const mysql = require('mysql2/promise');

const HOST = process.env.MYSQL_HOST || '47.115.220.98';
const PORT = Number(process.env.MYSQL_PORT || 3306);
const USER = process.env.MYSQL_USER || 'root';
const PASSWORD = process.env.MYSQL_PASSWORD || 'xumin999';
const DATABASE = process.env.MYSQL_DATABASE || 'mail';
const CONNECTION_LIMIT = Number(process.env.MYSQL_CONNECTION_LIMIT || 20);
const CHARSET = process.env.MYSQL_CHARSET || 'utf8mb4';
const ENABLED = String(process.env.MYSQL_ENABLED || '1') === '1';

let _pool = null;
let _initPromise = null;
let _enabled = false;

/** 连接 MySQL（幂等）。如果连接失败则标记为不可用，走本地降级。
 *  @returns {Promise<boolean>} 连接成功返回 true，失败返回 false
 */
async function initMysql() {
  if (_initPromise) return _initPromise;
  _initPromise = (async () => {
    if (!ENABLED) {
      console.log('[mysql] MYSQL_ENABLED != 1，跳过 MySQL，本地 state.json 模式');
      return false;
    }
    try {
      // 先连接 MySQL 服务器（不指定数据库），创建数据库 if not exists
      const bootstrapConn = await mysql.createConnection({
        host: HOST,
        port: PORT,
        user: USER,
        password: PASSWORD,
        charset: CHARSET
      });
      await bootstrapConn.query(
        `CREATE DATABASE IF NOT EXISTS \`${DATABASE}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
      );
      await bootstrapConn.end();

      // 创建连接池
      _pool = mysql.createPool({
        host: HOST,
        port: PORT,
        user: USER,
        password: PASSWORD,
        database: DATABASE,
        charset: CHARSET,
        connectionLimit: CONNECTION_LIMIT,
        waitForConnections: true,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 10000,
        connectTimeout: 5000,
        multipleStatements: false
      });

      // 测试连接
      const conn = await _pool.getConnection();
      await conn.ping();
      conn.release();

      _enabled = true;
      console.log(`[mysql] 已连接 → ${DATABASE}@${HOST}:${PORT}`);

      await ensureSchema();
      return true;
    } catch (err) {
      console.warn('[mysql] 连接失败，自动降级到 state.json 本地模式：', err?.message || err);
      _enabled = false;
      try { if (_pool) await _pool.end().catch(() => {}); } catch (_) {}
      _pool = null;
      return false;
    }
  })();
  return _initPromise;
}

function isMysqlEnabled() { return _enabled; }

function getPool() {
  if (!_enabled || !_pool) return null;
  return _pool;
}

/** 执行查询（带参数绑定），MySQL 未启用返回 null
 *  调用方需判空。
 */
async function query(sql, params = []) {
  if (!_enabled || !_pool) return null;
  const [rows] = await _pool.execute(sql, params);
  return rows;
}

/** 执行写操作（INSERT/UPDATE/DELETE），返回 { affectedRows, insertId } */
async function execute(sql, params = []) {
  if (!_enabled || !_pool) return null;
  const [result] = await _pool.execute(sql, params);
  return result;
}

/** 建表 SQL：所有表使用 InnoDB + utf8mb4 */
async function ensureSchema() {
  if (!_pool) return;
  const pool = _pool;

  const statements = [
    `CREATE TABLE IF NOT EXISTS \`users\` (
      \`id\` VARCHAR(80) NOT NULL,
      \`username\` VARCHAR(80) NOT NULL,
      \`passwordHash\` VARCHAR(255) NOT NULL DEFAULT '',
      \`displayName\` VARCHAR(120) NOT NULL DEFAULT '',
      \`avatar\` VARCHAR(500) NOT NULL DEFAULT '',
      \`role\` VARCHAR(20) NOT NULL DEFAULT 'user',
      \`createdAt\` BIGINT NOT NULL DEFAULT 0,
      \`updatedAt\` BIGINT NOT NULL DEFAULT 0,
      \`lastLoginAt\` BIGINT NULL,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`uk_username\` (\`username\`),
      KEY \`idx_created_at\` (\`createdAt\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    `CREATE TABLE IF NOT EXISTS \`accounts\` (
      \`id\` VARCHAR(80) NOT NULL,
      \`accountKey\` VARCHAR(120) NOT NULL,
      \`username\` VARCHAR(80) NOT NULL DEFAULT '',
      \`displayName\` VARCHAR(120) NOT NULL DEFAULT '',
      \`role\` VARCHAR(20) NOT NULL DEFAULT 'user',
      \`userId\` VARCHAR(80) NULL,
      \`linkedMailboxIds\` JSON NULL,
      \`createdAt\` BIGINT NOT NULL DEFAULT 0,
      \`updatedAt\` BIGINT NOT NULL DEFAULT 0,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`uk_account_key\` (\`accountKey\`),
      UNIQUE KEY \`uk_user_id\` (\`userId\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    `CREATE TABLE IF NOT EXISTS \`profiles\` (
      \`id\` VARCHAR(120) NOT NULL,
      \`accountKey\` VARCHAR(120) NOT NULL,
      \`xiejianCharacterId\` VARCHAR(80) NOT NULL DEFAULT '',
      \`lastXiejianMapKey\` VARCHAR(80) NOT NULL DEFAULT '',
      \`createdAt\` BIGINT NOT NULL DEFAULT 0,
      \`updatedAt\` BIGINT NOT NULL DEFAULT 0,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`uk_account_key\` (\`accountKey\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    `CREATE TABLE IF NOT EXISTS \`world_profiles\` (
      \`id\` VARCHAR(200) NOT NULL,
      \`worldId\` VARCHAR(120) NOT NULL,
      \`accountKey\` VARCHAR(120) NOT NULL,
      \`xiejianCharacterId\` VARCHAR(80) NOT NULL DEFAULT '',
      \`lastXiejianMapKey\` VARCHAR(80) NOT NULL DEFAULT '',
      \`createdAt\` BIGINT NOT NULL DEFAULT 0,
      \`updatedAt\` BIGINT NOT NULL DEFAULT 0,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`uk_world_account\` (\`worldId\`, \`accountKey\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    `CREATE TABLE IF NOT EXISTS \`world_role_bindings\` (
      \`id\` VARCHAR(200) NOT NULL,
      \`worldId\` VARCHAR(120) NOT NULL,
      \`characterId\` VARCHAR(80) NOT NULL,
      \`accountKey\` VARCHAR(120) NOT NULL DEFAULT '',
      \`createdAt\` BIGINT NOT NULL DEFAULT 0,
      \`updatedAt\` BIGINT NOT NULL DEFAULT 0,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`uk_world_character\` (\`worldId\`, \`characterId\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    `CREATE TABLE IF NOT EXISTS \`mailboxes\` (
      \`id\` VARCHAR(160) NOT NULL,
      \`name\` VARCHAR(120) NOT NULL DEFAULT '未命名信箱',
      \`desc\` VARCHAR(500) NOT NULL DEFAULT '',
      \`icon\` VARCHAR(50) NOT NULL DEFAULT '📫',
      \`themeColor\` VARCHAR(30) NOT NULL DEFAULT '#8a6d3b',
      \`mapBackground\` VARCHAR(120) NOT NULL DEFAULT '',
      \`isCustom\` TINYINT(1) NOT NULL DEFAULT 1,
      \`visibility\` VARCHAR(20) NOT NULL DEFAULT 'public',
      \`mailboxCode\` VARCHAR(20) NOT NULL DEFAULT '',
      \`ownerAccountKey\` VARCHAR(120) NOT NULL DEFAULT '',
      \`memberAccountKeys\` JSON NULL,
      \`memberNames\` JSON NULL,
      \`memberCharacters\` JSON NULL,
      \`createdAt\` BIGINT NOT NULL DEFAULT 0,
      \`updatedAt\` BIGINT NOT NULL DEFAULT 0,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`uk_mailbox_code\` (\`mailboxCode\`),
      KEY \`idx_owner\` (\`ownerAccountKey\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    `CREATE TABLE IF NOT EXISTS \`mailbox_codes\` (
      \`code\` VARCHAR(20) NOT NULL,
      \`mailboxId\` VARCHAR(160) NULL,
      \`createdBy\` VARCHAR(120) NOT NULL DEFAULT 'system',
      \`createdAt\` BIGINT NOT NULL DEFAULT 0,
      \`updatedAt\` BIGINT NOT NULL DEFAULT 0,
      PRIMARY KEY (\`code\`),
      KEY \`idx_mailbox_id\` (\`mailboxId\`),
      KEY \`idx_created_at\` (\`createdAt\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    `CREATE TABLE IF NOT EXISTS \`letters\` (
      \`id\` VARCHAR(160) NOT NULL,
      \`mailboxId\` VARCHAR(160) NOT NULL DEFAULT '',
      \`senderAccountKey\` VARCHAR(120) NOT NULL DEFAULT '',
      \`recipientAccountKey\` VARCHAR(120) NOT NULL DEFAULT '',
      \`senderIdentity\` JSON NULL,
      \`recipientIdentity\` JSON NULL,
      \`deliveryStatus\` VARCHAR(30) NOT NULL DEFAULT 'sent',
      \`sentAt\` BIGINT NULL,
      \`readAt\` BIGINT NULL,
      \`clientMessageId\` VARCHAR(160) NULL,
      \`letter\` JSON NULL,
      \`itemAttachments\` JSON NULL,
      \`createdAt\` BIGINT NOT NULL DEFAULT 0,
      \`updatedAt\` BIGINT NOT NULL DEFAULT 0,
      PRIMARY KEY (\`id\`),
      KEY \`idx_mailbox_sender\` (\`mailboxId\`, \`senderAccountKey\`),
      KEY \`idx_mailbox_recipient\` (\`mailboxId\`, \`recipientAccountKey\`),
      KEY \`idx_mailbox_updated\` (\`mailboxId\`, \`updatedAt\`),
      KEY \`idx_client_msg_id\` (\`clientMessageId\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    `CREATE TABLE IF NOT EXISTS \`item_instances\` (
      \`instanceId\` VARCHAR(200) NOT NULL,
      \`definitionId\` VARCHAR(80) NOT NULL DEFAULT '',
      \`locationType\` VARCHAR(30) NOT NULL DEFAULT 'world',
      \`mapKey\` VARCHAR(80) NOT NULL DEFAULT '',
      \`nodeId\` VARCHAR(80) NOT NULL DEFAULT '',
      \`nx\` INT NOT NULL DEFAULT 0,
      \`ny\` INT NOT NULL DEFAULT 0,
      \`ownerAccountKey\` VARCHAR(120) NOT NULL DEFAULT '',
      \`equippedSlot\` VARCHAR(30) NOT NULL DEFAULT '',
      \`origin\` JSON NULL,
      \`acquisition\` JSON NULL,
      \`escrowLetterId\` VARCHAR(160) NOT NULL DEFAULT '',
      \`pendingOwnerAccountKey\` VARCHAR(120) NOT NULL DEFAULT '',
      \`spawnedAt\` BIGINT NOT NULL DEFAULT 0,
      \`generation\` INT NOT NULL DEFAULT 1,
      PRIMARY KEY (\`instanceId\`),
      KEY \`idx_owner\` (\`ownerAccountKey\`),
      KEY \`idx_location\` (\`locationType\`, \`mapKey\`),
      KEY \`idx_escrow\` (\`escrowLetterId\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    `CREATE TABLE IF NOT EXISTS \`inventories\` (
      \`id\` VARCHAR(160) NOT NULL,
      \`accountKey\` VARCHAR(120) NOT NULL,
      \`itemIds\` JSON NULL,
      \`equipment\` JSON NULL,
      \`quickSlots\` JSON NULL,
      \`starterGrantVersion\` INT NOT NULL DEFAULT 0,
      \`pendingCoating\` VARCHAR(50) NOT NULL DEFAULT '',
      \`createdAt\` BIGINT NOT NULL DEFAULT 0,
      \`updatedAt\` BIGINT NOT NULL DEFAULT 0,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`uk_account_key\` (\`accountKey\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    `CREATE TABLE IF NOT EXISTS \`combat_profiles\` (
      \`id\` VARCHAR(200) NOT NULL,
      \`accountKey\` VARCHAR(120) NOT NULL,
      \`characterId\` VARCHAR(80) NOT NULL DEFAULT '',
      \`hp\` INT NOT NULL DEFAULT 100,
      \`maxHp\` INT NOT NULL DEFAULT 100,
      \`martial\` INT NOT NULL DEFAULT 0,
      \`baseDefense\` INT NOT NULL DEFAULT 4,
      \`poisonedUntil\` BIGINT NOT NULL DEFAULT 0,
      \`nextPoisonTickAt\` BIGINT NOT NULL DEFAULT 0,
      \`immobilizedUntil\` BIGINT NOT NULL DEFAULT 0,
      \`invulnerableUntil\` BIGINT NOT NULL DEFAULT 0,
      \`lastAttackAt\` BIGINT NOT NULL DEFAULT 0,
      \`goldPlaqueCooldownUntil\` BIGINT NOT NULL DEFAULT 0,
      \`lastOnlineAt\` BIGINT NOT NULL DEFAULT 0,
      \`createdAt\` BIGINT NOT NULL DEFAULT 0,
      \`updatedAt\` BIGINT NOT NULL DEFAULT 0,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`uk_account_character\` (\`accountKey\`, \`characterId\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    `CREATE TABLE IF NOT EXISTS \`journals\` (
      \`id\` VARCHAR(200) NOT NULL,
      \`accountKey\` VARCHAR(120) NOT NULL,
      \`year\` INT NOT NULL,
      \`month\` INT NOT NULL,
      \`day\` INT NOT NULL,
      \`entries\` JSON NULL,
      \`createdAt\` BIGINT NOT NULL DEFAULT 0,
      \`updatedAt\` BIGINT NOT NULL DEFAULT 0,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`uk_account_ymd\` (\`accountKey\`, \`year\`, \`month\`, \`day\`),
      KEY \`idx_account_ym\` (\`accountKey\`, \`year\`, \`month\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    `CREATE TABLE IF NOT EXISTS \`item_respawns\` (
      \`id\` VARCHAR(200) NOT NULL,
      \`instanceId\` VARCHAR(200) NOT NULL DEFAULT '',
      \`mapKey\` VARCHAR(80) NOT NULL DEFAULT '',
      \`nodeId\` VARCHAR(80) NOT NULL DEFAULT '',
      \`definitionId\` VARCHAR(80) NOT NULL DEFAULT '',
      \`respawnAt\` BIGINT NOT NULL DEFAULT 0,
      \`createdAt\` BIGINT NOT NULL DEFAULT 0,
      PRIMARY KEY (\`id\`),
      KEY \`idx_respawn_at\` (\`respawnAt\`),
      KEY \`idx_map_node\` (\`mapKey\`, \`nodeId\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    `CREATE TABLE IF NOT EXISTS \`character_definitions\` (
      \`id\` VARCHAR(80) NOT NULL,
      \`worldCategory\` VARCHAR(20) NOT NULL DEFAULT 'custom',
      \`name\` VARCHAR(80) NOT NULL DEFAULT '',
      \`definition\` JSON NOT NULL,
      \`displayOrder\` INT NOT NULL DEFAULT 999,
      \`enabled\` TINYINT(1) NOT NULL DEFAULT 1,
      \`createdAt\` BIGINT NOT NULL DEFAULT 0,
      \`updatedAt\` BIGINT NOT NULL DEFAULT 0,
      PRIMARY KEY (\`id\`),
      KEY \`idx_world_category\` (\`worldCategory\`),
      KEY \`idx_enabled\` (\`enabled\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    `CREATE TABLE IF NOT EXISTS \`map_definitions\` (
      \`id\` VARCHAR(120) NOT NULL,
      \`worldCategory\` VARCHAR(20) NOT NULL DEFAULT 'custom',
      \`name\` VARCHAR(120) NOT NULL DEFAULT '',
      \`definition\` JSON NOT NULL,
      \`displayOrder\` INT NOT NULL DEFAULT 999,
      \`enabled\` TINYINT(1) NOT NULL DEFAULT 1,
      \`createdAt\` BIGINT NOT NULL DEFAULT 0,
      \`updatedAt\` BIGINT NOT NULL DEFAULT 0,
      PRIMARY KEY (\`id\`),
      KEY \`idx_world_category\` (\`worldCategory\`),
      KEY \`idx_enabled\` (\`enabled\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    // ===== 信使档案表（万物送信 · 内置信使 + xinshi 扩展统一入库） =====
    `CREATE TABLE IF NOT EXISTS \`carrier_definitions\` (
      \`id\` VARCHAR(80) NOT NULL,
      \`name\` VARCHAR(120) NOT NULL DEFAULT '',
      \`category\` VARCHAR(20) NOT NULL DEFAULT 'real',
      \`definition\` JSON NULL,
      \`displayOrder\` INT NOT NULL DEFAULT 0,
      \`enabled\` TINYINT(1) NOT NULL DEFAULT 1,
      \`createdAt\` BIGINT NOT NULL DEFAULT 0,
      \`updatedAt\` BIGINT NOT NULL DEFAULT 0,
      PRIMARY KEY (\`id\`),
      KEY \`idx_enabled\` (\`enabled\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    // ===== 资产文件表（双端互通：所有图片/音频等资产统一入库，服务器磁盘仅作缓存） =====
    `CREATE TABLE IF NOT EXISTS \`asset_files\` (
      \`id\` VARCHAR(80) NOT NULL,
      \`assetPath\` VARCHAR(500) NOT NULL,
      \`mimeType\` VARCHAR(100) NOT NULL DEFAULT '',
      \`size\` BIGINT NOT NULL DEFAULT 0,
      \`sha1\` CHAR(40) NOT NULL DEFAULT '',
      \`worldCategory\` VARCHAR(20) NOT NULL DEFAULT 'game',
      \`data\` LONGBLOB,
      \`createdAt\` BIGINT NOT NULL DEFAULT 0,
      \`updatedAt\` BIGINT NOT NULL DEFAULT 0,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`uk_asset_path\` (\`assetPath\`),
      KEY \`idx_sha1\` (\`sha1\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
  ];

  for (const sql of statements) {
    await pool.execute(sql);
  }

  // Migration: add new columns to mailboxes table if not exists
  try {
    await pool.execute(`ALTER TABLE \`mailboxes\` ADD COLUMN \`memberNames\` JSON NULL AFTER \`memberAccountKeys\``);
  } catch (_) { /* column may already exist */ }
  try {
    await pool.execute(`ALTER TABLE \`mailboxes\` ADD COLUMN \`memberCharacters\` JSON NULL AFTER \`memberNames\``);
  } catch (_) { /* column may already exist */ }
  // Migration: add starterCharacterId column to inventories table if not exists
  try {
    await pool.execute(`ALTER TABLE \`inventories\` ADD COLUMN \`starterCharacterId\` VARCHAR(80) NOT NULL DEFAULT '' AFTER \`starterGrantVersion\``);
  } catch (_) { /* column may already exist */ }

  console.log('[mysql] 所有表已就绪');
}

async function closeMysql() {
  if (_pool) {
    try { await _pool.end(); } catch (_) {}
    _pool = null;
  }
  _enabled = false;
  _initPromise = null;
}

module.exports = {
  initMysql,
  isMysqlEnabled,
  getPool,
  query,
  execute,
  closeMysql,
  ensureSchema
};
