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
  const cf = cacheFileFor(clean);
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
  let fromCache = false;
  try { fromCache = fs.existsSync(cf); } catch (_) {}
  if (fromCache) {
    res.writeHead(200, {
      ...commonHeaders,
      'Content-Type': mimeOf(clean),
      'X-Asset-Source': 'cache'
    });
    fs.createReadStream(cf).pipe(res);
    return;
  }

  // ② MySQL 兜底 + 回填缓存（不阻塞响应）
  if (mysqlReady()) {
    try {
      const meta = await mysqlDao.getAssetMeta(clean);
      const data = await mysqlDao.getAssetDataByPath(clean);
      if (data) {
        try {
          const tmp = cf + '.tmp' + process.pid;
          fs.writeFileSync(tmp, data);
          fs.renameSync(tmp, cf);
        } catch (_) {}
        res.writeHead(200, {
          ...commonHeaders,
          'Content-Type': (meta && meta.mimeType) || mimeOf(clean),
          'X-Asset-Source': 'mysql'
        });
        res.end(data);
        return;
      }
    } catch (e) {
      console.warn('[asset] MySQL 兜底失败:', e?.message || e);
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
