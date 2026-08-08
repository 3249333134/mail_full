/* 跨断点 resize 测试：390↔1280 切换时 DOM 移回/移出无重复无丢失 */
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-proxy-server'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  page.on('pageerror', e => console.log('PAGEERROR:', String(e).slice(0, 200)));
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
  const countSections = () => page.evaluate(() => {
    const tb = document.getElementById('toolbar');
    const sheets = Array.from(document.querySelectorAll('.mobile-sheet-panel'));
    return {
      inToolbar: tb.querySelectorAll('[data-mobile-group]').length,
      inSheets: sheets.reduce((s, p) => s + p.querySelectorAll('[data-mobile-group]').length, 0),
      propInPanel: document.getElementById('property-panel').children.length,
      propInSheet: document.querySelector('.mobile-sheet-panel[data-panel="property"]').children.length
    };
  });

  // 初始窄屏
  let s = await countSections();
  check('窄屏: 全部 section 移入 sheet', s.inToolbar === 0 && s.inSheets === 9, JSON.stringify(s));

  // 切到桌面
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.waitForTimeout(800);
  s = await countSections();
  check('切桌面: 全部 section 移回 toolbar', s.inToolbar === 9 && s.inSheets === 0, JSON.stringify(s));
  const barHidden = await page.evaluate(() => getComputedStyle(document.getElementById('mobile-bottom-bar')).display === 'none');
  check('切桌面: 底部栏隐藏', barHidden, '');

  // 切回窄屏
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(800);
  s = await countSections();
  check('切回窄屏: section 再次移入且不重复', s.inToolbar === 0 && s.inSheets === 9, JSON.stringify(s));

  // 再切桌面（第二次往返）
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.waitForTimeout(800);
  s = await countSections();
  check('二次切桌面: 仍无重复', s.inToolbar === 9 && s.inSheets === 0, JSON.stringify(s));

  // 桌面端插入文字仍正常
  await page.click('.tool-btn[data-tool="text"]');
  await page.waitForTimeout(600);
  const dText = await page.evaluate(() => document.querySelectorAll('#paper-canvas .paper-element').length);
  check('往返后桌面插入文字正常', dText >= 1, `count=${dText}`);

  // 回窄屏后底部栏 tab 仍可点击
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(800);
  await page.click('.mobile-tab[data-tab="add"]');
  await page.waitForTimeout(600);
  const sheetOpen = await page.evaluate(() => document.getElementById('mobile-bottom-sheet').classList.contains('open'));
  check('回窄屏后 tab 面板仍可打开', sheetOpen, '');

  const passed = results.filter(r => r.ok).length;
  console.log(`\n===== 跨断点测试 ${passed}/${results.length} 通过 =====`);
  results.forEach(r => console.log(`${r.ok ? '✅' : '❌'} ${r.name}${r.ok ? '' : '  → ' + r.detail}`));
  await browser.close();
  process.exit(passed === results.length ? 0 : 1);
})();
