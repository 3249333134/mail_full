/**
 * 静态前端服务器（前后端分离架构）- 增强版
 *
 * 仅提供 d:\prj\mail 根目录下的静态文件服务（index.html / js / css / sendbox / 资源等）。
 * 不提供 API 与 WebSocket —— 前端通过 mailService.js 自动连接 :3000 后端。
 *
 * 特性：
 *   - SPA fallback：非文件路径自动返回 index.html
 *   - 目录穿越防护
 *   - 长缓存 + ETag 校验
 *   - CORS 支持（允许跨域调用后端）
 *
 * 启动：cross-env PORT=3005 node server/staticServer.js
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const PORT = Number(process.env.PORT || 3005);
const ROOT_DIR = path.resolve(__dirname, '..');

// ---------- MIME 类型 ----------
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.bmp': 'image/bmp',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.map': 'application/json; charset=utf-8'
};

// 可压缩的文本类型
const COMPRESSIBLE_EXT = new Set([
  '.html', '.js', '.mjs', '.css', '.json', '.svg', '.txt', '.md', '.map', '.xml'
]);

// 长缓存扩展名（生产环境可缓存；开发环境建议配合 no-cache 使用）
const LONG_CACHE_EXT = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.webp',
  '.svg', '.ico', '.bmp', '.mp3', '.wav', '.ogg', '.mp4', '.webm',
  '.woff', '.woff2', '.ttf', '.eot', '.map'
]);

// ---------- 工具函数 ----------
function safeJoin(directory, target) {
  const resolved = path.resolve(directory, target);
  if (resolved !== directory && !resolved.startsWith(directory + path.sep)) {
    return null; // 目录穿越拦截
  }
  return resolved;
}

function supportsGzip(req) {
  const ae = req.headers['accept-encoding'] || '';
  return ae.includes('gzip');
}

function serveFile(res, filePath, status = 200, req = null) {
  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const mime = MIME_TYPES[ext] || 'application/octet-stream';
    const headers = {
      'Content-Type': mime,
      'Access-Control-Allow-Origin': '*'
    };

    // 缓存策略：开发环境 CSS/JS 不缓存，避免改代码后浏览器仍用旧版本
    if (ext === '.html' || ext === '.css' || ext === '.js' || ext === '.mjs') {
      headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
      headers['Pragma'] = 'no-cache';
      headers['Expires'] = '0';
    } else if (LONG_CACHE_EXT.has(ext)) {
      headers['Cache-Control'] = 'public, max-age=604800, immutable';
      headers['ETag'] = `"${stat.size.toString(36)}-${stat.mtimeMs.toString(36)}"`;
    } else {
      headers['Cache-Control'] = 'public, max-age=3600';
    }

    // Gzip 压缩（文本类型）
    const shouldCompress = req && supportsGzip(req) && COMPRESSIBLE_EXT.has(ext) && stat.size < 1024 * 1024;
    if (shouldCompress) {
      headers['Content-Encoding'] = 'gzip';
      headers['Vary'] = 'Accept-Encoding';
      delete headers['Content-Length'];
      res.writeHead(status, headers);
      const gzip = zlib.createGzip({ level: 6 });
      fs.createReadStream(filePath).pipe(gzip).pipe(res);
    } else {
      res.writeHead(status, headers);
      fs.createReadStream(filePath)
        .on('error', () => { try { res.end(); } catch (_) {} })
        .pipe(res);
    }
  });
}

// SPA fallback：目录或无后缀路径回退到 index.html
function serveSpaFallback(res) {
  const indexPath = path.join(ROOT_DIR, 'index.html');
  serveFile(res, indexPath, 200);
}

// ---------- HTTP 服务器 ----------
const server = http.createServer((req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    let pathname = decodeURIComponent(url.pathname);

    // 根路径 → index.html
    if (pathname === '/') pathname = '/index.html';

    const cleanPath = pathname.replace(/^[/\\]+/, '');
    const filePath = safeJoin(ROOT_DIR, cleanPath);

    if (!filePath) {
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Forbidden');
      return;
    }

    // 目录 → 尝试 index.html
    fs.stat(filePath, (err, stat) => {
      if (!err && stat.isDirectory()) {
        serveFile(res, path.join(filePath, 'index.html'), 200, req);
        return;
      }

      if (!err && stat.isFile()) {
        serveFile(res, filePath, 200, req);
        return;
      }

      // 文件不存在 → SPA fallback（无后缀路径退回 index.html）
      const isFileRequest = path.extname(pathname).length > 0;
      if (!isFileRequest) {
        serveSpaFallback(res);
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Not Found');
      }
    });
  } catch (e) {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Bad Request');
  }
});

// ---------- 启动 ----------
server.listen(PORT, '0.0.0.0', () => {
  console.log('══════════════════════════════════════════');
  console.log(`  [Frontend] 前端静态服务已启动`);
  console.log(`  URL:      http://0.0.0.0:${PORT}`);
  console.log(`  根目录:   ${ROOT_DIR}`);
  console.log(`  后端 API: http://0.0.0.0:3000 (由 server.js 提供)`);
  console.log(`  特性:     SPA fallback + Gzip + 长缓存`);
  console.log('══════════════════════════════════════════');
});
