/* 改版视觉验证：悬浮胶囊 + SVG 图标 + sheet 标题栏 + active 实心填充 */
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-proxy-server'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  page.on('pageerror', e => console.log('PAGEERROR:', String(e).slice(0, 300)));
  await page.route(/fonts\.|gstatic\./, r => r.abort());
  await page.goto('http://localhost:3005/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2500);
  await page.click('.preset-btn[data-username="修璟"]');
  await page.waitForTimeout(3500);
  await page.click('#home-menu-toggle').catch(() => {});
  await page.waitForTimeout(800);
  await page.locator('text=修璟的信箱').first().click().catch(() => {});
  await page.waitForTimeout(3500);
  await page.evaluate(() => document.querySelectorAll('.sidebar-overlay.active').forEach(o => o.classList.remove('active')));
  await page.click('#mailbox-menu-toggle').catch(() => {});
  await page.waitForTimeout(800);
  await page.click('#new-letter-btn').catch(() => {});
  await page.waitForTimeout(1200);
  await page.locator('.recipient-picker-item').first().click().catch(() => {});
  await page.waitForTimeout(2500);

  const results = [];
  const check = (name, ok, detail) => results.push({ name, ok, detail });

  // 1) 胶囊结构与样式
  const pill = await page.evaluate(() => {
    const pillEl = document.querySelector('.mobile-pill');
    const bar = document.getElementById('mobile-bottom-bar');
    const cs = getComputedStyle(pillEl);
    const barCs = getComputedStyle(bar);
    const r = pillEl.getBoundingClientRect();
    const barR = bar.getBoundingClientRect();
    return {
      pillExists: !!pillEl,
      height: Math.round(r.height),
      radius: cs.borderRadius,
      border: cs.borderTopWidth,
      shadow: cs.boxShadow !== 'none',
      barPadding: barCs.paddingLeft,
      barPE: barCs.pointerEvents,
      pillPE: cs.pointerEvents,
      pillX: Math.round(r.x),
      pillW: Math.round(r.width),
      barW: Math.round(barR.width)
    };
  });
  check('胶囊存在且高 62px', pill.pillExists && pill.height === 62, JSON.stringify(pill));
  check('胶囊圆角 36px + 边框 + 阴影', pill.radius === '36px' && pill.border === '1px' && pill.shadow, `radius=${pill.radius} border=${pill.border}`);
  check('容器有左右 padding 且不拦点击', pill.barPadding === '21px' && pill.barPE === 'none' && pill.pillPE === 'auto', JSON.stringify(pill));
  check('胶囊左右留白悬浮', pill.pillX > 0 && pill.pillX + pill.pillW < pill.barW, `x=${pill.pillX} w=${pill.pillW} barW=${pill.barW}`);

  // 2) SVG 图标 + 尺寸
  const svg = await page.evaluate(() => {
    const icons = document.querySelectorAll('.mobile-tab svg');
    const first = icons[0];
    const r = first.getBoundingClientRect();
    return {
      count: icons.length,
      size: Math.round(r.width),
      hasStroke: (first.getAttribute('stroke') || '') === 'currentColor',
      viewBox: first.getAttribute('viewBox'),
      fill: first.getAttribute('fill')
    };
  });
  check('5 个 SVG 线性图标 18px', svg.count === 5 && svg.size === 18, JSON.stringify(svg));
  check('SVG 统一 currentColor + 24 viewBox', svg.hasStroke && svg.viewBox === '0 0 24 24' && svg.fill === 'none', JSON.stringify(svg));

  // 3) active 实心填充
  await page.click('.mobile-tab[data-tab="add"]');
  await page.waitForTimeout(600);
  const active = await page.evaluate(() => {
    const tab = document.querySelector('.mobile-tab.active');
    const cs = getComputedStyle(tab);
    return {
      activeTab: tab.dataset.tab,
      bg: cs.backgroundImage.includes('gradient') ? 'gradient' : cs.backgroundColor,
      color: cs.color,
      radius: cs.borderRadius,
      iconColor: getComputedStyle(tab.querySelector('svg')).color,
      labelColor: getComputedStyle(tab.querySelector('span')).color
    };
  });
  check('active 实心渐变 + 白字白图标', active.activeTab === 'add' && active.bg === 'gradient' && active.color === 'rgb(255, 255, 255)' && active.iconColor === 'rgb(255, 255, 255)', JSON.stringify(active));
  check('active 圆角 26px', active.radius === '26px', active.radius);

  // 4) sheet 悬浮 + 标题栏
  const sheet = await page.evaluate(() => {
    const s = document.getElementById('mobile-bottom-sheet');
    const cs = getComputedStyle(s);
    const r = s.getBoundingClientRect();
    const title = document.querySelector('.mobile-sheet-panel[data-panel="add"] .mobile-sheet-title');
    const titlePos = title ? getComputedStyle(title).position : 'none';
    const close = document.getElementById('mobile-sheet-close');
    const closeR = close.getBoundingClientRect();
    return {
      open: s.classList.contains('open'),
      left: Math.round(r.left),
      right: Math.round(window.innerWidth - r.right),
      bottom: Math.round(window.innerHeight - r.bottom),
      radius: cs.borderRadius,
      bg: cs.backgroundColor,
      titleText: title ? title.textContent : '',
      titlePos,
      closeSize: Math.round(closeR.width),
      closeRadius: getComputedStyle(close).borderRadius
    };
  });
  check('sheet 悬浮（左右留白 12px）', sheet.left === 12 && sheet.right === 12, `left=${sheet.left} right=${sheet.right}`);
  check('sheet 底缘悬浮于胶囊上方', sheet.bottom > 90 && sheet.bottom < 105, `bottom=${sheet.bottom}`);
  check('sheet 圆角 20px + 暖纸底', sheet.radius === '20px' && sheet.bg === 'rgb(255, 250, 242)', `radius=${sheet.radius} bg=${sheet.bg}`);
  check('面板标题栏 sticky 且文本正确', sheet.titleText === '工具与组件' && sheet.titlePos === 'sticky', `text=${sheet.titleText} pos=${sheet.titlePos}`);
  check('关闭钮为 28px 圆钮', sheet.closeSize === 28 && sheet.closeRadius === '999px', `size=${sheet.closeSize} radius=${sheet.closeRadius}`);

  // 5) property 面板：自带 <h3> 隐藏 + 标题栏
  await page.click('.mobile-tab[data-tab="property"]');
  await page.waitForTimeout(600);
  const prop = await page.evaluate(() => {
    const panel = document.querySelector('.mobile-sheet-panel[data-panel="property"]');
    const h3s = Array.from(panel.querySelectorAll('h3'));
    const visibleH3 = h3s.filter(h => getComputedStyle(h).display !== 'none').map(h => h.textContent.trim());
    const title = panel.querySelector('.mobile-sheet-title');
    return {
      panelActive: panel.classList.contains('active'),
      titleText: title ? title.textContent : '',
      visibleH3
    };
  });
  check('property 面板标题栏为「属性」且无重复 h3', prop.panelActive && prop.titleText === '属性' && prop.visibleH3.length === 0, JSON.stringify(prop));

  // 6) cover-mode：胶囊自动收窄
  await page.click('.mobile-sheet-panel[data-panel="property"] .mode-tab[data-mode="cover"]');
  await page.waitForTimeout(800);
  const cover = await page.evaluate(() => {
    const bar = document.getElementById('mobile-bottom-bar');
    const visibleTabs = Array.from(bar.querySelectorAll('.mobile-tab')).filter(t => getComputedStyle(t).display !== 'none');
    const pill = document.querySelector('.mobile-pill');
    return {
      coverMode: bar.classList.contains('cover-mode'),
      visibleTabs: visibleTabs.map(t => t.dataset.tab),
      pillVisible: getComputedStyle(pill).display !== 'none'
    };
  });
  check('cover-mode 只剩贴纸+属性且胶囊仍在', cover.coverMode && cover.visibleTabs.length === 2 && cover.pillVisible, JSON.stringify(cover));

  // 截图
  await page.click('.mobile-sheet-panel[data-panel="property"] .mode-tab[data-mode="content"]');
  await page.waitForTimeout(600);
  await page.click('.mobile-tab[data-tab="add"]');
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'mobile-pill-sheet-v2.png' });
  await page.click('#mobile-sheet-close');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'mobile-pill-bar-v2.png' });

  const passed = results.filter(r => r.ok).length;
  console.log(`\n===== 改版视觉验证 ${passed}/${results.length} 通过 =====`);
  results.forEach(r => console.log(`${r.ok ? '✅' : '❌'} ${r.name}${r.ok ? '' : '  → ' + r.detail}`));
  await browser.close();
  process.exit(passed === results.length ? 0 : 1);
})();
