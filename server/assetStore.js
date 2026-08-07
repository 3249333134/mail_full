/* ============================================================
 *  assetStore.js — 资产统一存储（双端互通核心）
 *
 *  分层：
 *    MySQL  asset_files 表   —— 唯一持久化数据源（所有资产入库）
 *    磁盘    server/assets-cache/ —— 读取加速缓存（按 sha1(assetPath) 命名）
 *
 *  读取顺序：磁盘缓存 → MySQL（回填缓存）→ 404
 *  写入：MySQL upsert + 磁盘缓存 双写（幂等，assetPath 唯一）
 * ============================================================ */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const mysqlClient = require('./mysqlClient');
const mysqlDao = require('./mysqlDao');

const CACHE_DIR = path.join(__dirname, 'assets-cache');
try { fs.mkdirSync(CACHE_DIR, { recursive: true }); } catch (_) {}

const MIME_BY_EXT = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.bmp': 'image/bmp',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.m4a': 'audio/mp4',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.json': 'application/json',
  '.txt': 'text/plain',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.html': 'text/html; charset=utf-8'
};

function sha1Of(str) {
  return crypto.createHash('sha1').update(String(str)).digest('hex');
}

function extOf(assetPath) {
  const m = /\.([a-zA-Z0-9]+)$/.exec(String(assetPath || ''));
  return m ? '.' + m[1].toLowerCase() : '';
}

function mimeOf(assetPath, fallback = 'application/octet-stream') {
  return MIME_BY_EXT[extOf(assetPath)] || fallback;
}

function cacheFileFor(assetPath) {
  return path.join(CACHE_DIR, sha1Of(assetPath) + extOf(assetPath));
}

/** 路径安全校验：去穿越、空段、控制字符 */
function sanitizeAssetPath(raw) {
  if (!raw) return null;
  let p = String(raw);
  try { p = decodeURIComponent(p); } catch (_) {}
  p = p.replace(/\\/g, '/').replace(/^\/+/, '');
  if (!p || p === '.' || p === '..') return null;
  if (p.includes('\0')) return null;
  const parts = p.split('/');
  for (const part of parts) {
    if (!part || part === '.' || part === '..') return null;
  }
  return p.slice(0, 500);
}

/**
 * 规范化相对路径：解析 ./ 与 ../ 段（前端代码常见 ../../fill/... 相对写法）。
 * 仅用于生成可命中 MySQL 的候选路径，最终仍须过 sanitizeAssetPath 安全校验。
 */
function normalizeRelPath(raw) {
  const segs = String(raw || '').split('/');
  const out = [];
  for (const seg of segs) {
    if (!seg || seg === '.') continue;
    if (seg === '..') { out.pop(); continue; }
    out.push(seg);
  }
  return out.join('/');
}

/**
 * 生成可命中 MySQL asset_files 的候选路径列表。
 * 前端两类不匹配：
 *  1) 地图/道具路径 xiejian/... 无前缀，而 MySQL 存 sendbox/src/assets/xiejian/...
 *  2) 角色帧路径 ../../fill/... 含 .. 段，而 MySQL 存 sendbox/fill/...
 */
function candidateAssetPaths(raw) {
  const rawStr = String(raw || '').replace(/\\/g, '/').replace(/^\/+/, '').replace(/^\.\//, '');
  const norm = normalizeRelPath(rawStr);
  const set = new Set();
  const add = (p) => { if (p) set.add(p); };
  add(rawStr);
  add(norm);
  // 去掉 sendbox 前缀后的路径（兼容前端用前缀、MySQL 存无前缀的情况）
  add(rawStr.replace(/^sendbox\/src\/assets\//, ''));
  add(rawStr.replace(/^sendbox\/fill\//, ''));
  add(rawStr.replace(/^sendbox\//, ''));
  add(norm.replace(/^sendbox\/src\/assets\//, ''));
  add(norm.replace(/^sendbox\/fill\//, ''));
  add(norm.replace(/^sendbox\//, ''));
  // 加上 sendbox 标准前缀（兼容前端用无前缀、MySQL 存带前缀的情况）
  add('sendbox/src/assets/' + norm);
  add('sendbox/fill/' + norm);
  add('sendbox/' + norm);
  // 角色帧：前端 ../../fill/... 规范化后为 fill/...，MySQL 存 sendbox/fill/...
  if (norm.startsWith('fill/')) {
    add('sendbox/fill/' + norm.slice(5));
  }
  const out = [];
  for (const p of set) {
    const safe = sanitizeAssetPath(p);
    if (safe) out.push(safe);
  }
  return [...new Set(out)];
}

function mysqlReady() {
  return !!(mysqlClient && typeof mysqlClient.isMysqlEnabled === 'function' && mysqlClient.isMysqlEnabled());
}

/**
 * 写入资产：MySQL upsert + 磁盘缓存双写。
 * MySQL 失败仅告警（不阻断），缓存仍写——读取链路磁盘优先，保证功能不中断。
 */
async function putAsset(assetPath, mimeType, data, worldCategory = 'game') {
  const clean = sanitizeAssetPath(assetPath);
  if (!clean || data == null) return null;
  const buf = Buffer.isBuffer(data) ? data : Buffer.from(data);
  const meta = {
    assetPath: clean,
    mimeType: String(mimeType || mimeOf(clean)),
    data: buf,
    worldCategory: String(worldCategory || 'game')
  };
  if (mysqlReady()) {
    try {
      await mysqlDao.upsertAsset(meta);
    } catch (e) {
      console.warn('[asset] upsert MySQL 失败（磁盘缓存保留）:', e?.message || e);
    }
  }
  try {
    const cf = cacheFileFor(clean);
    const tmp = cf + '.tmp' + process.pid;
    fs.writeFileSync(tmp, buf);
    fs.renameSync(tmp, cf);
  } catch (e) {
    console.warn('[asset] 写磁盘缓存失败:', e?.message || e);
  }
  return meta;
}

/** 从磁盘缓存删除一个资产文件（测试/回滚用） */
function removeCacheFile(assetPath) {
  const clean = sanitizeAssetPath(assetPath);
  if (!clean) return false;
  try {
    const cf = cacheFileFor(clean);
    if (fs.existsSync(cf)) { fs.unlinkSync(cf); return true; }
  } catch (_) {}
  return false;
}

/**
 * 服务资产：磁盘缓存优先（<1ms，不查 MySQL）→ MySQL 兜底（并回填缓存）→ 404。
 * 支持 ETag / If-None-Match / Cache-Control。
 *
 * 性能要点：磁盘缓存命中时【绝不】访问 MySQL —— 远程库 RTT 0.3~0.5s，
 * 首屏多图并发若都先查 MySQL 会挤爆连接池，阻塞后续所有 API（搜索/发送"挂起"的根因）。
 */
async function serveAsset(req, res, assetPath) {
  const clean = sanitizeAssetPath(assetPath);
  if (!clean) {
    res.writeHead(400, { 'Content-Type': 'text/plain' });
    res.end('Bad Request');
    return;
  }
  // 多候选路径：兼容前端无前缀（xiejian/...）与含 ..（../../fill/...）的相对写法
  const candidates = candidateAssetPaths(assetPath);
  // 缓存路径 sha1 作 ETag（不依赖 MySQL），浏览器 304 校验走本地
  const etag = `"${sha1Of(clean)}"`;
  const ifNoneMatch = String(req.headers['if-none-match'] || '');
  if (ifNoneMatch && ifNoneMatch.includes(etag)) {
    res.writeHead(304, { ETag: etag, 'Cache-Control': 'public, max-age=3600' });
    res.end();
    return;
  }
  const commonHeaders = {
    ETag: etag,
    'Cache-Control': 'public, max-age=3600',
    'Access-Control-Allow-Origin': '*'
  };

  // ① 磁盘缓存优先（命中即返回，零 MySQL 往返）
  for (const cand of candidates) {
    let fromCache = false;
    try { fromCache = fs.existsSync(cacheFileFor(cand)); } catch (_) {}
    if (fromCache) {
      res.writeHead(200, {
        ...commonHeaders,
        'Content-Type': mimeOf(cand),
        'X-Asset-Source': 'cache'
      });
      fs.createReadStream(cacheFileFor(cand)).pipe(res);
      return;
    }
  }

  // ② MySQL 兜底 + 回填缓存（不阻塞响应）
  if (mysqlReady()) {
    for (const cand of candidates) {
      try {
        const meta = await mysqlDao.getAssetMeta(cand);
        const data = await mysqlDao.getAssetDataByPath(cand);
        if (data) {
          try {
            const cf = cacheFileFor(cand);
            const tmp = cf + '.tmp' + process.pid;
            fs.writeFileSync(tmp, data);
            fs.renameSync(tmp, cf);
          } catch (_) {}
          res.writeHead(200, {
            ...commonHeaders,
            'Content-Type': (meta && meta.mimeType) || mimeOf(cand),
            'X-Asset-Source': 'mysql'
          });
          res.end(data);
          return;
        }
      } catch (e) {
        console.warn('[asset] MySQL 兜底失败:', e?.message || e);
      }
    }
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
}

module.exports = {
  CACHE_DIR,
  putAsset,
  serveAsset,
  removeCacheFile,
  sanitizeAssetPath,
  mimeOf,
  cacheFileFor,
  sha1Of
};
