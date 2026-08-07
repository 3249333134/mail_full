/**
 * 阶段1b：精选素材包批量探测 → 生成 sources.json
 * 对候选 slug 列表探测 license + zip 链接，输出可下载清单
 */
const fs = require('fs');
const path = require('path');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';
const BASE = 'https://opengameart.org';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// 精选候选包（slug → 用途说明）
const CANDIDATES = [
  // ---- 动物包（一个包可切多动物）----
  ['animated-wild-animals', 'wild-animals', '动物包：狼鹿兔狐等'],
  ['cute-16x16-animal-icons', 'cute-animals', '动物图标包 16x16'],
  ['pixel-animals-16x16', 'pixel-animals', '像素动物 16x16'],
  ['street-animal-pixel-art', 'street-animals', '街头动物（猫狗等）'],
  ['random-animals', 'random-animals', '随机动物合集'],
  ['gb-funky-fauna', 'funky-fauna', 'GB 风动物'],
  ['admurins-flora-and-fauna', 'flora-fauna', '动植物合集'],
  ['tiny-creatures', 'tiny-creatures', '小生物（多种）'],
  ['pond-pals-art-pack', 'pond-pals', '池塘生物'],
  ['16x16-pigeon-shrimp-bee-snail-pack', 'pigeon-bee-snail', '鸽子蜜蜂蜗牛虾'],
  ['frog-dogcatpig2d-pixel-1616', 'frog-dog-cat-pig', '青蛙狗猫猪'],
  ['pixel-art-dog-and-cat', 'dog-cat', '狗和猫'],
  ['cats-pixel-art', 'cats', '猫合集'],
  ['dogwolf-spritesheet', 'dog-wolf', '狗/狼精灵表'],
  ['wolf-pack-32x32-walking-wolf-animation', 'wolf-pack', '狼走路动画'],
  ['fox-1', 'fox', '狐狸'],
  ['bunny-sprite', 'bunny', '兔子'],
  ['horse-pixel-art-animation', 'horse', '马动画'],
  ['tiny-horses', 'tiny-horses', '小马'],
  ['pixel-squirrel', 'squirrel', '松鼠'],
  ['open-ocean-game-art-mostly-2d-fish-animations', 'ocean-fish', '海洋鱼类'],
  ['turkey-0', 'turkey', '火鸡'],
  ['pixel-art-duck-20x20', 'duck', '鸭子'],
  ['64x64-pixel-art-pixel-bird', 'pixel-bird', '像素鸟'],
  ['blue-bird-48x48', 'blue-bird', '蓝鸟'],
  ['16x16-echinoderms', 'echinoderms', '棘皮动物（海星海胆）'],
  // ---- 奇幻包 ----
  ['10-fantasy-rpg-enemies', 'fantasy-enemies', '10种RPG敌人'],
  ['15-pixel-bones-and-skeletons', 'bones-skeletons', '骷髅骨头'],
  ['werewolf', 'werewolf', '狼人'],
  ['cat-demon', 'cat-demon', '猫恶魔'],
  ['pixel-dragon', 'pixel-dragon', '像素龙'],
  ['chinese-dragon', 'chinese-dragon', '中国龙'],
  ['dragon-idle-animation', 'dragon-idle', '龙待机动画'],
  ['dragon-icon-pack', 'dragon-icons', '龙图标包'],
  ['magic-pixel-art', 'magic', '魔法特效'],
  ['dawnlike-16x16-universal-rogue-like-tileset-v181', 'dawnlike', 'roguelike 全生物超大包'],
  // ---- 载具包 ----
  ['16x16-fantasy-pixel-art-vehicles', 'fantasy-vehicles', '16x16 奇幻载具'],
  ['pixel-vehicle-pack', 'pixel-vehicles-1', '像素载具包1'],
  ['pixel-vehicle-pack-0', 'pixel-vehicles-2', '像素载具包2'],
  ['wooden-boat', 'wooden-boat', '木船'],
  ['animated-pixel-art-raft-sprite', 'raft', '竹筏'],
  ['lpc-ship', 'lpc-ship', '帆船'],
  ['hot-air-balloon', 'hot-air-balloon', '热气球'],
  ['airship-and-hot-air-balloon', 'airship', '飞艇+热气球'],
  ['saturn-v-pixel-rocket', 'rocket', '土星5火箭'],
  ['pixel-art-rocket', 'pixel-rocket', '像素火箭'],
  ['8-bit-space-shuttle', 'space-shuttle', '太空梭'],
  // ---- 自然/概念 ----
  ['pixel-lightning', 'lightning', '闪电'],
  ['space-pixel-art', 'space', '太空元素'],
  ['wintery-pixel-art-pack', 'wintery', '冬季元素'],
  ['winter-pixel-art-background-with-mountain', 'winter-mountain', '雪山背景'],
  // ---- 痕迹包 ----
  ['footprints', 'footprints', '脚印痕迹'],
  ['footprint-shoeprint-silhouette', 'footprint-silhouette', '脚印剪影'],
  ['fx-smoke-trail-pixel', 'smoke-trail', '烟雾拖尾'],
  ['rocket-thruster-effect-animations', 'rocket-thruster', '火箭推进痕迹']
];

async function getHtml(url) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': UA, 'Accept': 'text/html,application/xhtml+xml' },
        redirect: 'follow',
        signal: AbortSignal.timeout(20000)
      });
      if (res.status === 429 || res.status === 503) { await sleep(8000 * (attempt + 1)); continue; }
      if (res.status === 200) return await res.text();
      return null;
    } catch { await sleep(5000); }
  }
  return null;
}

function decodeHtmlEntities(s) {
  return s.replace(/&#0?39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&')
    .replace(/&#039;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
}

(async () => {
  const results = [];
  for (let i = 0; i < CANDIDATES.length; i++) {
    const [slug, tag, note] = CANDIDATES[i];
    const url = `${BASE}/content/${slug}`;
    const html = await getHtml(url);
    let item = { slug, tag, note, url, license: [], zip: null, title: slug };
    if (html) {
      const licRe = /license-name'>([^<]+)<\/div>/gi;
      let m;
      while ((m = licRe.exec(html)) !== null) item.license.push(m[1].trim());
      // zip 优先（相对或绝对路径）
      const zipRe = /href="([^"]+\.zip)"/gi;
      while ((m = zipRe.exec(html)) !== null) {
        if (!item.zip) item.zip = decodeHtmlEntities(m[1]);
      }
      if (!item.zip) {
        // 否则抓第一个非 css 的 files 资源（png/jpg/gif 等，兼容绝对/相对路径）
        const fileRe = /href="((?:https:\/\/opengameart\.org)?\/sites\/default\/files\/[^"]+\.(?:png|jpg|jpeg|gif|webp))"/gi;
        while ((m = fileRe.exec(html)) !== null) {
          if (!item.zip && !/css|styles\//.test(m[1])) item.zip = decodeHtmlEntities(m[1]);
        }
      }
      if (!item.zip) {
        // 再退：任意 files 资源（排除 css/js）
        const anyRe = /href="((?:https:\/\/opengameart\.org)?\/sites\/default\/files\/[^"]+)"/gi;
        while ((m = anyRe.exec(html)) !== null) {
          if (!item.zip && !/css|\.js|styles\//.test(m[1])) item.zip = decodeHtmlEntities(m[1]);
        }
      }
      const titleRe = /<title>([^<]+)<\/title>/i;
      const tm = html.match(titleRe);
      if (tm) item.title = tm[1].replace(/ - .*/, '').trim();
      item.license = [...new Set(item.license)];
    }
    results.push(item);
    console.log(`[${i + 1}/${CANDIDATES.length}] ${item.slug} | license=${item.license.join(',') || '?'} | zip=${item.zip ? 'Y' : 'N'}`);
    await sleep(2000);
  }

  // 只保留有下载链接的
  const withZip = results.filter(r => r.zip);
  const sources = {
    generatedAt: new Date().toISOString(),
    licenseNote: 'CC0=可商用无署名; OGA-BY=需署名; CC-BY=需署名; GPL/CC-BY-SA 谨慎使用',
    packages: withZip
  };
  fs.writeFileSync(path.join(__dirname, 'sources.json'), JSON.stringify(sources, null, 2));
  console.log(`\n共 ${results.length} 个候选，${withZip.length} 个有下载链接，已写入 sources.json`);
})();
