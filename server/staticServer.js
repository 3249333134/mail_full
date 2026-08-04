/**
 * 静态前端服务器（前后端分离架构）
 *
 * 仅提供 d:\prj\mail 根目录下的静态文件服务（index.html / js / css / sendbox / 资源等）。
 * 不提供 API 与 WebSocket —— 前端硬编码连 :3000 后端，故任意端口的前端共享同一后端数据与 WS 房间。
 *
 * 启动：cross-env PORT=3005 node server/staticServer.js
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.PORT || 3005);
const ROOT_DIR = path.resolve(__dirname, '..');

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

// 长缓存扩展名（带 ?v= 版本号时缓存 7 天，否则 1 小时）
const LONG_CACHE_EXT = new Set([
  '.js', '.mjs', '.css', '.png', '.jpg', '.jpeg', '.gif', '.webp',
  '.svg', '.ico', '.bmp', '.mp3', '.wav', '.ogg', '.mp4', '.webm',
  '.woff', '.woff2', '.ttf', '.eot', '.map', '.json'
]);

function safeJoin(root, target) {
  const resolved = path.resolve(root, target);
  if (resolved !== root && !resolved.startsWith(root + path.sep)) {
    return null; // 目录穿越拦截
  }
  return resolved;
}

function sendFile(res, filePath, status = 200) {
  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not Found');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    const mime = MIME_TYPES[ext] || 'application/octet-stream';
    const headers = { 'Content-Type': mime };

    // HTML 不缓存，保证最新
    if (ext === '.html') {
      headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
      headers['Pragma'] = 'no-cache';
      headers['Expires'] = '0';
    } else if (LONG_CACHE_EXT.has(ext)) {
      // 静态资源长缓存 + ETag 校验
      headers['Cache-Control'] = 'public, max-age=604800';
      headers['ETag'] = `"${stat.size.toString(16)}-${stat.mtimeMs.toString(16)}"`;
    } else {
      headers['Cache-Control'] = 'public, max-age=3600';
    }
    headers['Access-Control-Allow-Origin'] = '*';

    res.writeHead(status, headers);
    fs.createReadStream(filePath)
      .on('error', () => {
        try { res.end(); } catch (_) {}
      })
      .pipe(res);
  });
}

const server = http.createServer((req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    let pathname = decodeURIComponent(url.pathname);
    if (pathname === '/') pathname = '/index.html';
    // 去掉前导斜杠，避免 Windows 下 path.resolve 把 '/index.html' 当作盘根绝对路径
    const cleanPath = pathname.replace(/^[/\\]+/, '');

    const filePath = safeJoin(ROOT_DIR, cleanPath);
    if (!filePath) {
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Forbidden');
      return;
    }

    // 目录则回落到 index.html
    fs.stat(filePath, (err, stat) => {
      if (!err && stat.isDirectory()) {
        sendFile(res, path.join(filePath, 'index.html'));
        return;
      }
      sendFile(res, filePath);
    });
  } catch (e) {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Bad Request');
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[staticServer] 静态前端服务已启动: http://0.0.0.0:${PORT}`);
  console.log(`[staticServer] 根目录: ${ROOT_DIR}`);
  console.log(`[staticServer] API/WS 仍由后端 :3000 提供（前端硬编码）`);
});
