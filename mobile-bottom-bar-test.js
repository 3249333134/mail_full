/* 移动端底部选择栏验证脚本
   覆盖测试清单：桌面端不变 / 窄屏底部栏 / tab 面板切换 / 元素插入 / cover-mode */
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-proxy-server'] });
  const results = [];
  const check = (name, ok, detail) => results.push({ name, ok, detail });

  async function openEditor(page, viewportName) {
    const errors = [];
    page.on('pageerror', e => errors.push(String(e).slice(0, 200)));
    await page.route(/fonts\.|gstatic\./, r => r.abort());
    await page.goto('http://localhost:3005/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2500);
    await page.click('.preset-btn[data-username="修璟"]');
    await page.waitForTimeout(3500);
    const isNarrow = viewportName === 'mobile';
    if (isNarrow) {
      // 窄屏：先点汉堡菜单打开侧边栏抽屉
      await page.click('#home-menu-toggle').catch(() => {});
      await page.waitForTimeout(800);
    }
    const card = page.locator('text=修璟的信箱').first();
    await card.waitFor({ timeout: 10000 }).catch(() => {});
    await card.click().catch(() => {});
    await page.waitForTimeout(3500);
    // 绕过既有窄屏 bug：home 抽屉遮罩残留 active 会拦截点击
    if (isNarrow) {
      await page.evaluate(() => document.querySelectorAll('.sidebar-overlay.active').forEach(o => o.classList.remove('active')));
      await page.waitForTimeout(300);
      // 窄屏下「新建信件」按钮在 mailbox 抽屉里，先打开抽屉
      await page.click('#mailbox-menu-toggle').catch(() => {});
      await page.waitForTimeout(800);
    }
    await page.click('#new-letter-btn').catch(() => {});
    await page.waitForTimeout(1200);
    await page.locator('.recipient-picker-item').first().click().catch(() => {});
    await page.waitForTimeout(2500);
    const ok = await page.evaluate(() => document.getElementById('editor-view').classList.contains('active'));
    return { ok, errors };
  }

  // ========== 1. 移动端视口 390x844 ==========
  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const mob = await openEditor(mobile, 'mobile');
  check('移动端: 编辑器打开', mob.ok, '');
  if (mob.ok) {
    // 1) 侧栏隐藏 + 底部栏可见
    const layout = await mobile.evaluate(() => {
      const tb = document.getElementById('toolbar');
      const pp = document.getElementById('property-panel');
      const bar = document.getElementById('mobile-bottom-bar');
      const barRect = bar.getBoundingClientRect();
      return {
        toolbarHidden: getComputedStyle(tb).display === 'none',
        panelHidden: getComputedStyle(pp).display === 'none',
        barVisible: getComputedStyle(bar).display !== 'none',
        barBottom: Math.round(barRect.bottom),
        barHeight: Math.round(barRect.height),
        tabs: document.querySelectorAll('.mobile-tab').length,
        vh: window.innerHeight
      };
    });
    check('移动端: toolbar/property-panel 隐藏', layout.toolbarHidden && layout.panelHidden, JSON.stringify(layout));
    check('移动端: 底部栏可见且贴底', layout.barVisible && layout.barBottom === layout.vh, `bottom=${layout.barBottom} vh=${layout.vh}`);
    check('移动端: 5 个 tab', layout.tabs === 5, `tabs=${layout.tabs}`);

    // 2) tab 面板内容迁移（page → add → sticker → style → property）
    const groups = await mobile.evaluate(() => {
      const g = {};
      document.querySelectorAll('.mobile-sheet-panel').forEach(p => {
        g[p.dataset.panel] = p.querySelectorAll('[data-mobile-group], .mode-tab, .prop-group').length;
      });
      return g;
    });
    check('移动端: 各面板内容已迁移', groups.pages > 0 && groups.add > 0 && groups.property > 0, JSON.stringify(groups));

    // 3) 点击「添加」tab → sheet 打开 + 面板激活
    await mobile.click('.mobile-tab[data-tab="add"]');
    await mobile.waitForTimeout(600);
    const addSheet = await mobile.evaluate(() => {
      const sheet = document.getElementById('mobile-bottom-sheet');
      const panel = document.querySelector('.mobile-sheet-panel[data-panel="add"]');
      const tools = panel.querySelectorAll('.tool-btn').length;
      const widgets = panel.querySelectorAll('.widget-item').length;
      return {
        open: sheet.classList.contains('open'),
        panelActive: panel.classList.contains('active'),
        tools, widgets,
        sheetH: Math.round(sheet.getBoundingClientRect().height),
        vh: window.innerHeight
      };
    });
    check('移动端: 「添加」面板滑出', addSheet.open && addSheet.panelActive, JSON.stringify(addSheet));
    // 工具 5 个 + BGM 1 个（均为 .tool-btn），组件 6 个
    check('移动端: 添加面板含工具+BGM+6 组件', addSheet.tools >= 5 && addSheet.widgets === 6, `tools=${addSheet.tools} widgets=${addSheet.widgets}`);
    check('移动端: 面板高度 <= 58vh', addSheet.sheetH <= Math.round(addSheet.vh * 0.58) + 5, `h=${addSheet.sheetH} vh=${addSheet.vh}`);

    // 4) 点击「T」插入文字元素
    await mobile.click('.mobile-sheet-panel[data-panel="add"] .tool-btn[data-tool="text"]');
    await mobile.waitForTimeout(600);
    const textAdded = await mobile.evaluate(() => {
      const els = document.querySelectorAll('#paper-canvas .paper-element');
      return els.length > 0 && Array.from(els).some(el => el.textContent.includes('在此输入文字'));
    });
    check('移动端: 添加文字元素成功', textAdded, '');

    // 5) 点击功能组件「日期」
    await mobile.click('.mobile-sheet-panel[data-panel="add"] .widget-item[data-widget="date"]');
    await mobile.waitForTimeout(800);
    const widgetAdded = await mobile.evaluate(() => {
      const els = document.querySelectorAll('#paper-canvas .paper-element');
      return Array.from(els).some(el => el.classList.contains('element-widget-date') || (el.dataset && el.dataset.widget === 'date'));
    });
    check('移动端: 添加日期组件成功', widgetAdded, '');

    // 6) 贴纸 tab
    await mobile.click('.mobile-tab[data-tab="sticker"]');
    await mobile.waitForTimeout(600);
    const stickerOk = await mobile.evaluate(() => {
      const panel = document.querySelector('.mobile-sheet-panel[data-panel="sticker"]');
      return panel.classList.contains('active') && panel.querySelectorAll('.stamp-grid .stamp-item, #stamp-grid .stamp-item').length > 0;
    });
    check('移动端: 贴纸面板 + 贴纸可选', stickerOk, '');

    // 7) 属性 tab → 信纸/封面切换
    await mobile.click('.mobile-tab[data-tab="property"]');
    await mobile.waitForTimeout(600);
    const propOk = await mobile.evaluate(() => {
      const panel = document.querySelector('.mobile-sheet-panel[data-panel="property"]');
      const tabs = panel.querySelectorAll('.mode-tab');
      return panel.classList.contains('active') && tabs.length === 2;
    });
    check('移动端: 属性面板含信纸/封面切换', propOk, '');

    // 8) cover-mode：点击「封面」→ 底部栏只剩贴纸+属性 tab
    await mobile.click('.mobile-sheet-panel[data-panel="property"] .mode-tab[data-mode="cover"]');
    await mobile.waitForTimeout(800);
    const coverOk = await mobile.evaluate(() => {
      const bar = document.getElementById('mobile-bottom-bar');
      const sheet = document.getElementById('mobile-bottom-sheet');
      const visibleTabs = Array.from(bar.querySelectorAll('.mobile-tab')).filter(t => getComputedStyle(t).display !== 'none');
      return {
        barCover: bar.classList.contains('cover-mode'),
        sheetCover: sheet.classList.contains('cover-mode'),
        visibleTabs: visibleTabs.map(t => t.dataset.tab)
      };
    });
    check('移动端: cover-mode 只剩贴纸+属性 tab', coverOk.barCover && coverOk.sheetCover && coverOk.visibleTabs.length === 2 && coverOk.visibleTabs.includes('sticker') && coverOk.visibleTabs.includes('property'), JSON.stringify(coverOk));

    // 9) 切回信纸模式 + 关闭面板（× 按钮）
    await mobile.click('.mobile-sheet-panel[data-panel="property"] .mode-tab[data-mode="content"]');
    await mobile.waitForTimeout(600);
    await mobile.click('#mobile-sheet-close');
    await mobile.waitForTimeout(500);
    const closed = await mobile.evaluate(() => {
      const sheet = document.getElementById('mobile-bottom-sheet');
      const overlay = document.getElementById('mobile-sheet-overlay');
      return !sheet.classList.contains('open') && !overlay.classList.contains('open');
    });
    check('移动端: 关闭按钮收起面板', closed, '');

    // 10) 遮罩关闭：打开再点遮罩
    await mobile.click('.mobile-tab[data-tab="pages"]');
    await mobile.waitForTimeout(500);
    await mobile.click('#mobile-sheet-overlay', { position: { x: 195, y: 300 } }).catch(async () => {
      await mobile.evaluate(() => document.getElementById('mobile-sheet-overlay').click());
    });
    await mobile.waitForTimeout(500);
    const overlayClosed = await mobile.evaluate(() => !document.getElementById('mobile-bottom-sheet').classList.contains('open'));
    check('移动端: 点击遮罩收起面板', overlayClosed, '');

    // 11) 页面无 JS 错误
    check('移动端: 无页面 JS 错误', mob.errors.length === 0, mob.errors.slice(0, 2).join(' | '));

    // 截图
    await mobile.click('.mobile-tab[data-tab="add"]');
    await mobile.waitForTimeout(500);
    await mobile.screenshot({ path: 'mobile-bottom-bar-sheet.png' });
    await mobile.click('#mobile-sheet-close');
    await mobile.waitForTimeout(400);
    await mobile.screenshot({ path: 'mobile-bottom-bar-closed.png' });
  }
  await mobile.close();

  // ========== 2. 桌面端 1280x800 ==========
  const desktop = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const dsk = await openEditor(desktop, 'desktop');
  check('桌面端: 编辑器打开', dsk.ok, '');
  if (dsk.ok) {
    const deskLayout = await desktop.evaluate(() => {
      const tb = document.getElementById('toolbar');
      const pp = document.getElementById('property-panel');
      const bar = document.getElementById('mobile-bottom-bar');
      return {
        toolbarVisible: getComputedStyle(tb).display !== 'none',
        panelVisible: getComputedStyle(pp).display !== 'none',
        barHidden: getComputedStyle(bar).display === 'none',
        toolbarW: Math.round(tb.getBoundingClientRect().width),
        panelW: Math.round(pp.getBoundingClientRect().width)
      };
    });
    check('桌面端: 双侧栏保持 + 底部栏隐藏', deskLayout.toolbarVisible && deskLayout.panelVisible && deskLayout.barHidden, JSON.stringify(deskLayout));
    check('桌面端: 侧栏宽度 240px', deskLayout.toolbarW === 240 && deskLayout.panelW === 240, `tb=${deskLayout.toolbarW} pp=${deskLayout.panelW}`);

    // 桌面端插入文字功能
    await desktop.click('.tool-btn[data-tool="text"]');
    await desktop.waitForTimeout(600);
    const dText = await desktop.evaluate(() => document.querySelectorAll('#paper-canvas .paper-element').length > 0);
    check('桌面端: 添加文字正常', dText, '');

    check('桌面端: 无页面 JS 错误', dsk.errors.length === 0, dsk.errors.slice(0, 2).join(' | '));
    await desktop.screenshot({ path: 'desktop-editor-unchanged.png' });
  }
  await desktop.close();

  await browser.close();

  // ========== 汇总 ==========
  const passed = results.filter(r => r.ok).length;
  console.log(`\n===== 结果 ${passed}/${results.length} 通过 =====`);
  results.forEach(r => {
    console.log(`${r.ok ? '✅' : '❌'} ${r.name}${r.ok ? '' : '  → ' + r.detail}`);
  });
  process.exit(passed === results.length ? 0 : 1);
})();
