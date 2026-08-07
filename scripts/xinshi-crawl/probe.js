/**
 * 阶段1：侦察 OpenGameArt 素材包清单
 * 探测搜索结果页结构 + 详情页许可证/zip 链接
 * 用法: node scripts/xinshi-crawl/probe.js
 */
const fs = require('fs');
const path = require('path');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';
const BASE = 'https://opengameart.org';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// 抓取 HTML
async function getHtml(url) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': UA, 'Accept': 'text/html,application/xhtml+xml' },
        redirect: 'follow',
        signal: AbortSignal.timeout(20000)
      });
      if (res.status === 429 || res.status === 503) {
        console.log(`  429/503 on ${url}, backoff...`);
        await sleep(8000 * (attempt + 1));
        continue;
      }
      if (res.status === 200) return await res.text();
      console.log(`  HTTP ${res.status} on ${url}`);
      return null;
    } catch (e) {
      console.log(`  fetch err: ${e.message.slice(0, 80)}`);
      await sleep(5000);
    }
  }
  return null;
}

// 提取搜索页结果（链接 + 标题）
function parseSearchResults(html) {
  const results = [];
  // OpenGameArt 搜索结果: <span class="art-preview-title"><a href="/content/xxx">标题</a></span>
  const re = /<span class="art-preview-title"><a href="(\/content\/[^"]+)"[^>]*>([\s\S]*?)<\/a><\/span>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const title = m[2].replace(/<[^>]+>/g, '').trim();
    results.push({ url: BASE + m[1], title });
  }
  return results;
}

async function probeSearch(keyword) {
  const url = `${BASE}/art-search-advanced?keys=${encodeURIComponent(keyword)}&field_art_type_tid%5B0%5D=9`;
  console.log(`\n=== 搜索: "${keyword}" ===`);
  const html = await getHtml(url);
  if (!html) return [];
  const results = parseSearchResults(html);
  console.log(`  找到 ${results.length} 条:`);
  results.slice(0, 12).forEach((r, i) => console.log(`  ${i + 1}. ${r.title} -> ${r.url}`));
  await sleep(2500);
  return results;
}

// 详情页：许可证 + zip 链接
async function probeDetail(url) {
  const html = await getHtml(url);
  if (!html) return null;
  // 许可证: <div class='license-name'>CC0</div> 或 OGA-BY 3.0
  const licenses = [];
  const licRe = /license-name'>([^<]+)<\/div>/gi;
  let m;
  while ((m = licRe.exec(html)) !== null) licenses.push(m[1].trim());
  // zip 链接
  const zips = [];
  const zipRe = /href="([^"]+\.zip)"/gi;
  while ((m = zipRe.exec(html)) !== null) zips.push(m[1]);
  // 下载按钮链接（有时是 /sites/default/files/... 但非 .zip）
  const downloadRe = /href="(\/sites\/default\/files\/[^"]+)"/gi;
  while ((m = downloadRe.exec(html)) !== null) {
    if (!zips.includes(m[1])) zips.push(m[1]);
  }
  return { license: [...new Set(licenses)], zips: [...new Set(zips)].slice(0, 3) };
}

(async () => {
  const out = { probedAt: new Date().toISOString(), searches: {}, details: [] };

  // 1) 批量搜索（覆盖信使 4 大类 + 具体动物 + 痕迹）
  const keywords = [
    // 大类
    'pixel animal', 'pixel bird', 'pixel fantasy creature',
    'pixel vehicle', 'pixel boat', 'pixel dragon',
    '16x16 animal', 'pixel nature',
    // 痕迹
    'footprint', 'paw print', 'animal tracks', 'pixel trail',
    // 具体动物（信使候选）
    'pixel pigeon', 'pixel owl', 'pixel fox', 'pixel deer',
    'pixel wolf', 'pixel horse', 'pixel butterfly', 'pixel whale',
    'pixel dolphin', 'pixel cat', 'pixel dog', 'pixel frog',
    'pixel snake', 'pixel turtle', 'pixel bee', 'pixel fish',
    'pixel spider', 'pixel rabbit', 'pixel squirrel', 'pixel duck',
    // 奇幻
    'pixel ghost', 'pixel skeleton', 'pixel unicorn', 'pixel phoenix',
    'pixel wizard', 'pixel fairy', 'pixel robot',
    // 载具
    'pixel rocket', 'pixel airplane', 'hot air balloon', 'pixel train',
    'pixel bicycle', 'pixel ship',
    // 自然/概念
    'pixel lightning', 'pixel snow', 'pixel star', 'pixel cloud',
    'pixel paper crane', 'pixel bottle'
  ];
  for (const kw of keywords) {
    out.searches[kw] = await probeSearch(kw);
    await sleep(2500);
  }

  // 2) 探测 3 个详情页确认许可证/zip 结构
  const sampleUrls = [];
  for (const kw of Object.keys(out.searches)) {
    for (const r of out.searches[kw]) {
      sampleUrls.push(r.url);
      if (sampleUrls.length >= 5) break;
    }
    if (sampleUrls.length >= 5) break;
  }
  for (const u of sampleUrls.slice(0, 3)) {
    console.log(`\n=== 详情页: ${u} ===`);
    const d = await probeDetail(u);
    console.log('  license:', d ? d.license : 'null');
    console.log('  zips:', d ? d.zips : 'null');
    if (d) out.details.push({ url: u, ...d });
    await sleep(2500);
  }

  fs.writeFileSync(path.join(__dirname, 'probe-result.json'), JSON.stringify(out, null, 2));
  console.log('\n结果已保存: scripts/xinshi-crawl/probe-result.json');
})();
