/* ============================================================
 *  migrateStateToMysql.js — 一次性数据迁移脚本
 *  把 server/data/state.json 中的所有数据迁移到 MySQL。
 *
 *  用法：
 *    node migrateStateToMysql.js            # 执行迁移
 *    node migrateStateToMysql.js --dry-run  # 预览不写入
 * ============================================================ */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { initMysql, isMysqlEnabled, closeMysql, query } = require('./mysqlClient');
const mysqlDao = require('./mysqlDao');

const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(__dirname, 'data'));
const STATE_FILE = path.join(DATA_DIR, 'state.json');

async function showTableCounts() {
  const tables = ['users', 'accounts', 'profiles', 'world_profiles', 'world_role_bindings',
                  'mailboxes', 'mailbox_codes', 'letters', 'item_instances',
                  'inventories', 'combat_profiles', 'journals', 'item_respawns'];
  console.log('\n=== 当前 MySQL 各表行数 ===');
  for (const t of tables) {
    try {
      const rows = await query(`SELECT COUNT(*) AS cnt FROM \`${t}\``);
      const cnt = rows && rows.length > 0 ? rows[0].cnt : 0;
      console.log(`  ${t.padEnd(25)} ${cnt}`);
    } catch (e) {
      console.log(`  ${t.padEnd(25)} [错误: ${e.message}]`);
    }
  }
}

async function main() {
  const isDryRun = process.argv.includes('--dry-run');
  console.log(`[migrate] 模式: ${isDryRun ? 'DRY-RUN（预览）' : '执行迁移'}`);
  console.log(`[migrate] state.json 路径: ${STATE_FILE}`);

  if (!fs.existsSync(STATE_FILE)) {
    console.warn('[migrate] state.json 不存在，无需迁移');
    process.exit(0);
  }

  const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  if (!state) {
    console.warn('[migrate] state.json 内容为空');
    process.exit(0);
  }

  console.log('\n=== state.json 数据统计 ===');
  console.log(`  accounts:       ${Object.keys(state.accounts || {}).length}`);
  console.log(`  profiles:       ${Object.keys(state.profiles || {}).length}`);
  console.log(`  worldProfiles:  ${Object.keys(state.worldProfiles || {}).length}`);
  console.log(`  worldRoleBindings: ${Object.keys(state.worldRoleBindings || {}).length}`);
  console.log(`  mailboxes:      ${Object.keys(state.mailboxes || {}).length}`);
  console.log(`  mailboxCodes:   ${Object.keys(state.mailboxCodes || {}).length}`);
  console.log(`  letters:        ${Object.keys(state.letters || {}).length}`);
  console.log(`  itemInstances:  ${Object.keys(state.itemInstances || {}).length}`);
  console.log(`  inventories:   ${Object.keys(state.inventories || {}).length}`);
  console.log(`  combatProfiles: ${Object.keys(state.combatProfiles || {}).length}`);
  console.log(`  itemRespawns:   ${(state.itemRespawns || []).length}`);

  await initMysql();
  if (!isMysqlEnabled()) {
    console.error('[migrate] MySQL 未启用，无法迁移');
    process.exit(1);
  }

  await showTableCounts();

  if (isDryRun) {
    console.log('\n[migrate] DRY-RUN 模式，不执行写入。');
    await closeMysql();
    process.exit(0);
  }

  console.log('\n[migrate] 开始迁移...');
  const stats = await mysqlDao.importFromState(state);
  console.log('\n[migrate] 迁移完成，统计：', stats);

  await showTableCounts();
  await closeMysql();
  process.exit(0);
}

main().catch(err => {
  console.error('[migrate] 迁移失败：', err);
  process.exit(1);
});
