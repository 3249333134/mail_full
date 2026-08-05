/* ============================================================
 *  migrateAssetsToMysql.js — 存量资产批量入库（挟剑/破晓相关）
 *
 *  用法：
 *    node server/migrateAssetsToMysql.js            # 全量迁移（含断点续传）
 *    node server/migrateAssetsToMysql.js --dry-run  # 只统计不写入
 *    node server/migrateAssetsToMysql.js --limit 200
 *    node server/migrateAssetsToMysql.js --concurrency 5 --batch-size 50
 *    node server/migrateAssetsToMysql.js --include sendbox/src/assets/xiejian
 *
 *  幂等：按 sha1 去重（asset_files.sha1 索引），重跑安全。
 *  断点续传：server/data/asset-migration-state.json 记录游标。
 * ============================================================ */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const mysqlClient = require('./mysqlClient');
const mysqlDao = require('./mysqlDao');
const assetStore = require('./assetStore');

const ROOT = path.resolve(__dirname, '..');
const STATE_FILE = path.join(__dirname, 'data', 'asset-migration-state.json');

// 默认迁移目录：挟剑与破晓相关（可 --include 追加）
const DEFAULT_DIRS = [
  'sendbox/src/assets/xiejian',
  'sendbox/src/assets/poxiao',
  'sendbox/src/assets/maps',
  'sendbox/fill/jingyuan-chibi20-delivery-20260719',
  'mailfile/bgm'
];

// 单文件上限（30MB，与上传接口一致）
const MAX_BYTES = 30 * 1024 * 1024;

function parseArgs(argv) {
  const args = { include: [], dryRun: false, limit: 0, batchSize: 50, concurrency: 10, resume: true };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dry-run') args.dryRun = true;
    else if (a === '--no-resume') args.resume = false;
    else if (a.startsWith('--include=')) args.include.push(a.slice('--include='.length));
    else if (a === '--include' && argv[i + 1]) { args.include.push(argv[i + 1]); i++; }
    else if (a.startsWith('--limit=')) args.limit = parseInt(a.slice('--limit='.length)) || 0;
    else if (a.startsWith('--batch-size=')) args.batchSize = parseInt(a.slice('--batch-size='.length)) || 50;
    else if (a.startsWith('--concurrency=')) args.concurrency = parseInt(a.slice('--concurrency='.length)) || 10;
  }
  return args;
}

function walkFiles(dir, out = []) {
  let entries = [];
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (_) { return out; }
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walkFiles(full, out);
    else if (ent.isFile()) out.push(full);
  }
  return out;
}

function sha1OfFile(file) {
  return crypto.createHash('sha1').update(fs.readFileSync(file)).digest('hex');
}

function readState() {
  try { return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')); } catch (_) { return { done: {} }; }
}

function saveState(state) {
  try {
    fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
    fs.writeFileSync(STATE_FILE, JSON.stringify(state), 'utf8');
  } catch (_) {}
}

async function main() {
  const args = parseArgs(process.argv);
  const dirs = [...DEFAULT_DIRS, ...args.include];
  console.log('=== 资产迁移（挟剑/破晓 → MySQL）===');
  console.log('扫描目录:', dirs.join(', '));
  if (args.dryRun) console.log('模式: DRY-RUN（只统计，不写入）');
  if (args.limit) console.log('限制: 最多', args.limit, '个文件');

  // 收集文件清单（相对项目根路径）
  const fileList = [];
  const seen = new Set();
  for (const d of dirs) {
    const absDir = path.join(ROOT, d);
    for (const f of walkFiles(absDir)) {
      const rel = path.relative(ROOT, f).replace(/\\/g, '/');
      if (seen.has(rel)) continue;
      seen.add(rel);
      fileList.push({ abs: f, rel });
    }
  }
  console.log(`共发现 ${fileList.length} 个文件`);

  // 断点续传：已成功的跳过
  let state = args.resume ? readState() : { done: {} };
  const doneSet = new Set(Object.keys(state.done || {}));
  const pending = fileList.filter(x => !doneSet.has(x.rel));
  console.log(`去重后待处理 ${pending.length} 个（已完成 ${fileList.length - pending.length}）`);

  if (args.dryRun) {
    console.log('--- DRY-RUN 清单（前 20）---');
    pending.slice(0, 20).forEach(x => console.log('  ', x.rel));
    console.log('DRY-RUN 完成，未写入任何数据');
    process.exit(0);
  }

  await mysqlClient.initMysql();
  if (!mysqlClient.isMysqlEnabled()) {
    console.error('MySQL 不可用，迁移中止');
    process.exit(1);
  }

  const concurrency = Math.max(1, args.concurrency);
  const batchSize = Math.max(1, args.batchSize);
  let cursor = 0;
  let okCount = 0, skipCount = 0, failCount = 0, oversizeCount = 0;
  const t0 = Date.now();

  const processFile = async (item) => {
    try {
      const stat = fs.statSync(item.abs);
      if (stat.size > MAX_BYTES) {
        oversizeCount++;
        console.warn(`[跳过] 超过 30MB: ${item.rel} (${(stat.size / 1048576).toFixed(1)}MB)`);
        state.done[item.rel] = 'oversize';
        return;
      }
      // 去重：按【路径】存在性判断（同一路径重跑跳过）。
      // 注意：不能按 sha1 全局去重 —— 不同路径的相同内容（如 fill 帧与 src 帧）各有用途，
      // 若只保留第一条路径，其他路径在 /api/assets 下会 404。
      if (await mysqlDao.assetExists(item.rel)) {
        skipCount++;
        state.done[item.rel] = 'exists';
        return;
      }
      const buf = fs.readFileSync(item.abs);
      const mime = assetStore.mimeOf(item.rel);
      const worldCategory = item.rel.includes('poxiao') ? 'poxiao'
        : item.rel.includes('xiejian') ? 'xiejian'
        : item.rel.startsWith('mailfile/') ? 'bgm'
        : 'game';
      const meta = await assetStore.putAsset(item.rel, mime, buf, worldCategory);
      if (meta) {
        okCount++;
        state.done[item.rel] = meta.sha1;
      } else {
        throw new Error('putAsset 返回空');
      }
    } catch (e) {
      failCount++;
      console.warn(`[失败] ${item.rel}: ${e?.message || e}`);
      // 失败不标记 done → 下次重跑重试
    }
  };

  // 分批 + 限流并发
  while (cursor < pending.length) {
    const batch = pending.slice(cursor, cursor + batchSize);
    const workers = [];
    for (let i = 0; i < Math.min(batch.length, concurrency); i++) workers.push(processFile(batch[i]));
    const rest = batch.slice(Math.min(batch.length, concurrency));
    for (const item of rest) {
      await Promise.all(workers.splice(0, workers.length)); // 等当前批
      workers.push(processFile(item));
    }
    await Promise.all(workers);
    cursor += batchSize;
    saveState(state);
    const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
    console.log(`进度 ${Math.min(cursor, pending.length)}/${pending.length} | 成功 ${okCount} 跳过 ${skipCount} 失败 ${failCount} 超限 ${oversizeCount} | ${elapsed}s`);
    if (args.limit && okCount + skipCount >= args.limit) break;
  }

  saveState(state);
  const total = await mysqlDao.countAssets();
  console.log('=== 迁移完成 ===');
  console.log(`成功 ${okCount} / 去重跳过 ${skipCount} / 失败 ${failCount} / 超限 ${oversizeCount} | 总耗时 ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  console.log(`asset_files 表现有 ${total} 条资产`);
  if (failCount > 0) console.log('有失败项，重跑脚本可自动重试');
}

main().catch(e => {
  console.error('迁移异常:', e?.message || e);
  process.exit(1);
});
