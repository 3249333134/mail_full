/**
 * 阶段2：下载素材包 → mailfile/xinshi/_source/
 * 断点续传 + 限流 + 重试
 */
const fs = require('fs');
const path = require('path');
const sources = require('./sources.json');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';
const OUT_DIR = path.resolve(__dirname, '../../mailfile/xinshi/_source');
const DONE_FILE = path.join(__dirname, 'download-state.json');

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const rand = (a, b) => a + Math.floor(Math.random() * (b - a));

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

// 断点续传状态
const state = fs.existsSync(DONE_FILE) ? JSON.parse(fs.readFileSync(DONE_FILE, 'utf8')) : { done: [] };

function normalizeUrl(u) {
  if (!u) return null;
  if (u.startsWith('//')) return 'https:' + u;
  if (u.startsWith('/')) return 'https://opengameart.org' + u;
  return u;
}

async function download(url, dest) {
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': UA, 'Accept': '*/*' },
        redirect: 'follow',
        signal: AbortSignal.timeout(60000)
      });
      if (res.status === 429 || res.status === 503) {
        const wait = 15000 * (attempt + 1);
        console.log(`    429/503，等待 ${wait / 1000}s 重试...`);
        await sleep(wait);
        continue;
      }
      if (!res.ok) { console.log(`    HTTP ${res.status}`); return false; }
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 100) { console.log(`    文件过小(${buf.length}B)，可能被反爬拦截`); return false; }
      fs.writeFileSync(dest, buf);
      return true;
    } catch (e) {
      console.log(`    下载失败: ${e.message.slice(0, 80)}`);
      await sleep(8000 * (attempt + 1));
    }
  }
  return false;
}

(async () => {
  const packages = sources.packages.filter(p => p.zip);
  console.log(`共 ${packages.length} 个包待下载\n`);
  let ok = 0, skip = 0, fail = 0;

  for (let i = 0; i < packages.length; i++) {
    const p = packages[i];
    const ext = path.extname(new URL(normalizeUrl(p.zip)).pathname) || '.zip';
    const dest = path.join(OUT_DIR, p.slug + ext);

    if (state.done.includes(p.slug) && fs.existsSync(dest)) { skip++; console.log(`[${i + 1}/${packages.length}] SKIP ${p.slug}`); continue; }

    process.stdout.write(`[${i + 1}/${packages.length}] 下载 ${p.slug} ... `);
    const url = normalizeUrl(p.zip);
    const success = await download(url, dest);
    if (success) {
      state.done.push(p.slug);
      fs.writeFileSync(DONE_FILE, JSON.stringify(state));
      const sizeMB = (fs.statSync(dest).size / 1024 / 1024).toFixed(2);
      console.log(`OK (${sizeMB}MB)`);
      ok++;
    } else {
      console.log('FAIL');
      fail++;
    }
    await sleep(rand(2500, 5000));
  }

  console.log(`\n完成: 成功 ${ok} / 跳过 ${skip} / 失败 ${fail}`);
})();
