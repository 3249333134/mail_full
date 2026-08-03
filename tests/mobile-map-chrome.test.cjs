const assert = require('node:assert/strict');
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    await page.goto('http://127.0.0.1:3000/?fix=20260802s#home', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(900);

    await page.evaluate(() => {
      document.querySelector('#home-view').classList.remove('active');
      const mapView = document.querySelector('#mailbox-map-view');
      mapView.closest('.gallery-main').classList.add('map-mode');
      mapView.closest('.view').classList.add('active');
      mapView.style.display = 'block';
      mapView.classList.add('xiejian-mode');
      document.querySelector('#xiejian-backpack-btn').hidden = false;
      App._bindMobileMapChrome();
    });

    const folded = await page.evaluate(() => {
      const display = selector => getComputedStyle(document.querySelector(selector)).display;
      return {
        charPanel: display('.char-panel'),
        desktopActions: display('.character-selector .action-section'),
        onlineToggle: display('#xiejian-online-toggle'),
        mapSelect: display('.map-select-control'),
        interactButton: display('#mobile-interact-btn'),
        viewLetters: display('.view-letters'),
        viewDiary: display('.view-diary'),
        viewMap: display('.view-map'),
        chat: display('#chat-input-container'),
        actionPointer: getComputedStyle(document.querySelector('#mobile-actions')).pointerEvents,
        quickActions: document.querySelectorAll('.mobile-quick-actions').length,
        chatRect: document.querySelector('#chat-input-container').getBoundingClientRect().toJSON(),
        viewRect: document.querySelector('#view-switch').getBoundingClientRect().toJSON(),
        viewPosition: getComputedStyle(document.querySelector('#view-switch')).position,
        viewDirection: getComputedStyle(document.querySelector('#view-switch')).flexDirection,
        viewButtonRect: document.querySelector('#view-switch .view-btn').getBoundingClientRect().toJSON()
      };
    });

    assert.equal(folded.charPanel, 'none');
    assert.equal(folded.desktopActions, 'none');
    assert.equal(folded.onlineToggle, 'none');
    assert.equal(folded.mapSelect, 'none');
    assert.notEqual(folded.interactButton, 'none');
    assert.notEqual(folded.viewLetters, 'none');
    assert.notEqual(folded.viewDiary, 'none');
    assert.notEqual(folded.viewMap, 'none');
    assert.notEqual(folded.chat, 'none');
    assert.equal(folded.actionPointer, 'none');
    assert.equal(folded.quickActions, 0);
    assert.ok(Math.abs((folded.chatRect.left + folded.chatRect.width / 2) - 195) < 2);
    assert.equal(folded.viewPosition, 'fixed');
    assert.equal(folded.viewDirection, 'row');
    assert.ok(390 - folded.viewRect.right <= 10);
    assert.ok(844 - folded.viewRect.bottom <= 12);
    assert.equal(folded.viewButtonRect.width, 44);
    assert.equal(folded.viewButtonRect.height, 44);

    for (const selector of [
      '#mobile-map-controls-toggle',
      '#mobile-actions-toggle',
      '#char-toggle-btn'
    ]) {
      await page.locator(selector).click();
    }

    const expanded = await page.evaluate(() => ({
      charOpen: document.querySelector('#character-selector').classList.contains('open'),
      mapOpen: document.querySelector('.map-controls').classList.contains('mobile-expanded'),
      chatOpen: document.querySelector('#chat-input-container').classList.contains('mobile-open'),
      actionsOpen: document.querySelector('#mobile-actions').classList.contains('open'),
      onlineToggleVisible: getComputedStyle(document.querySelector('#xiejian-online-toggle')).display !== 'none',
      mapSelectVisible: getComputedStyle(document.querySelector('.map-select-control')).display !== 'none',
      aria: [
        '#char-toggle-btn',
        '#mobile-map-controls-toggle',
        '#mobile-actions-toggle'
      ].map(selector => document.querySelector(selector).getAttribute('aria-expanded'))
    }));

    assert.deepEqual(expanded, {
      charOpen: true,
      mapOpen: true,
      chatOpen: true,
      actionsOpen: true,
      onlineToggleVisible: true,
      mapSelectVisible: true,
      aria: ['true', 'true', 'true']
    });

    await page.locator('#xiejian-online-toggle').click();
    const online = await page.evaluate(() => ({
      open: document.querySelector('#online-players-panel').classList.contains('open'),
      aria: document.querySelector('#xiejian-online-toggle').getAttribute('aria-expanded')
    }));
    assert.deepEqual(online, { open: true, aria: 'true' });

    await page.evaluate(() => {
      App.currentMailboxId = 'mailbox-xiejian';
      window.gameMapRenderer = {
        nearbyPlayer: null,
        getNearbyWorldItem: () => ({
          instanceId: 'test-world-item',
          definition: { name: '测试物品', portable: true, icon: '' }
        })
      };
      window.__pickedItemId = '';
      MultiplayerSync.pickupItem = instanceId => { window.__pickedItemId = instanceId; };
      App._bindXiejianGameUI();
      App._startXiejianPromptLoop();
    });
    await page.waitForTimeout(150);
    const interactButton = page.locator('#mobile-interact-btn');
    assert.equal(await interactButton.isEnabled(), true);
    await interactButton.click();
    assert.equal(await page.evaluate(() => window.__pickedItemId), 'test-world-item');
    await page.evaluate(() => clearInterval(App._xiejianPromptTimer));

    const mapDock = {
      rightGap: 390 - folded.viewRect.right,
      bottomGap: 844 - folded.viewRect.bottom
    };

    await page.evaluate(() => {
      document.querySelector('#mailbox-map-view').closest('.gallery-main').classList.remove('map-mode');
    });
    const nonMapDock = await page.evaluate(() => {
      const dock = document.querySelector('#view-switch');
      const rect = dock.getBoundingClientRect();
      const style = getComputedStyle(dock);
      return {
        position: style.position,
        direction: style.flexDirection,
        rightGap: innerWidth - rect.right,
        bottomGap: innerHeight - rect.bottom,
        width: rect.width,
        height: rect.height
      };
    });
    assert.equal(nonMapDock.position, 'fixed');
    assert.equal(nonMapDock.direction, 'row');
    assert.ok(nonMapDock.rightGap <= 10);
    assert.ok(nonMapDock.bottomGap <= 12);
    assert.equal(nonMapDock.width, folded.viewRect.width);
    assert.equal(nonMapDock.height, folded.viewRect.height);
    assert.equal(nonMapDock.rightGap, mapDock.rightGap);
    assert.equal(nonMapDock.bottomGap, mapDock.bottomGap);

    console.log('mobile map chrome: ok');
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
