const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const WebSocket = require('ws');

const port = 3107;
const dataDir = path.join(__dirname, `.test-data-${process.pid}`);
const serverProcess = spawn(process.execPath, ['server.js'], {
  cwd: __dirname,
  env: { ...process.env, PORT: String(port), DATA_DIR: dataDir, MONGO_ENABLED: '0' },
  stdio: ['ignore', 'pipe', 'pipe']
});

function waitForServer() {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('server start timeout')), 5000);
    serverProcess.stdout.on('data', data => {
      if (data.toString().includes(`:${port}`)) {
        clearTimeout(timeout);
        resolve();
      }
    });
    serverProcess.once('exit', code => reject(new Error(`server exited with ${code}`)));
  });
}

function waitForMessage(ws, type, predicate = () => true, timeoutMs = 3000) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      ws.off('message', onMessage);
      reject(new Error(`timeout waiting for ${type}`));
    }, timeoutMs);
    const onMessage = raw => {
      const message = JSON.parse(raw.toString());
      if (message.type !== type || !predicate(message)) return;
      clearTimeout(timeout);
      ws.off('message', onMessage);
      resolve(message);
    };
    ws.on('message', onMessage);
  });
}

async function connect(username, roomId = 'mailbox-xiejian') {
  const ws = new WebSocket(`ws://127.0.0.1:${port}`);
  await new Promise((resolve, reject) => {
    ws.once('open', resolve);
    ws.once('error', reject);
  });
  const response = waitForMessage(ws, 'room_state');
  ws.send(JSON.stringify({
    type: 'join',
    roomId,
    accountKey: username,
    username,
    displayName: username,
    mode: 'xiejian'
  }));
  const roomState = await response;
  return { ws, roomState };
}

async function api(pathname, options = {}) {
  const response = await fetch(`http://127.0.0.1:${port}${pathname}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const body = await response.json();
  assert.ok(response.ok, `${pathname}: ${response.status} ${JSON.stringify(body)}`);
  return body;
}

async function apiResult(pathname, options = {}) {
  const response = await fetch(`http://127.0.0.1:${port}${pathname}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  return { status: response.status, body: await response.json() };
}

async function run() {
  const sockets = [];
  try {
    await waitForServer();

    const firstConnection = await connect('SameUser');
    let first = firstConnection.ws;
    sockets.push(first);
    assert.strictEqual(firstConnection.roomState.playerCount, 1);
    assert.strictEqual(firstConnection.roomState.accountProfile.lastXiejianMapKey, 'xj-jingyuan');

    const selected = waitForMessage(first, 'character_selected');
    first.send(JSON.stringify({ type: 'select_character', characterId: 'qi-pingchuan' }));
    assert.strictEqual((await selected).permanent, true);
    first.send(JSON.stringify({ type: 'map_change', mapKey: 'xj-daohua', x: 10, y: 20 }));

    const replaced = waitForMessage(first, 'session_replaced');
    const takeoverConnection = await connect('sameuser');
    const takeover = takeoverConnection.ws;
    sockets.push(takeover);
    assert.strictEqual((await replaced).accountKey, 'sameuser');
    assert.strictEqual(takeoverConnection.roomState.playerCount, 1);
    assert.strictEqual(
      takeoverConnection.roomState.accountProfile.xiejianCharacterId,
      'qi-pingchuan'
    );
    assert.strictEqual(
      takeoverConnection.roomState.accountProfile.lastXiejianMapKey,
      'xj-daohua'
    );
    first = takeover;

    const secondConnection = await connect('other-user');
    const second = secondConnection.ws;
    sockets.push(second);
    const occupied = waitForMessage(second, 'character_rejected');
    second.send(JSON.stringify({ type: 'select_character', characterId: 'qi-pingchuan' }));
    assert.strictEqual((await occupied).reason, 'occupied');

    const secondSelected = waitForMessage(second, 'character_selected');
    second.send(JSON.stringify({ type: 'select_character', characterId: 'jiang-huaian' }));
    await secondSelected;
    const bindingLocked = waitForMessage(second, 'character_rejected');
    second.send(JSON.stringify({ type: 'select_character', characterId: 'zhou-ran' }));
    assert.strictEqual((await bindingLocked).reason, 'binding_locked');

    // 角色只在当前信箱世界内唯一；另一个信箱世界可以独立绑定同一角色。
    const otherWorldConnection = await connect('third-world-user', 'mailbox-public-world-2');
    const otherWorld = otherWorldConnection.ws;
    sockets.push(otherWorld);
    assert.ok(!otherWorldConnection.roomState.occupiedCharacters.includes('qi-pingchuan'));
    const otherWorldSelected = waitForMessage(otherWorld, 'character_selected');
    otherWorld.send(JSON.stringify({ type: 'select_character', characterId: 'qi-pingchuan' }));
    assert.strictEqual((await otherWorldSelected).characterId, 'qi-pingchuan');

    const secondMapObserved = waitForMessage(first, 'map_change', message =>
      message.userId === 'other-user' && message.mapKey === 'xj-jingyuan'
    );
    second.send(JSON.stringify({
      type: 'map_change',
      mapKey: 'xj-jingyuan',
      x: 30,
      y: 40
    }));
    await secondMapObserved;
    const interactRejected = waitForMessage(first, 'interact_rejected');
    first.send(JSON.stringify({ type: 'interact', toUserId: 'other-user', actionType: 'greet' }));
    assert.strictEqual((await interactRejected).reason, 'different_map');

    const sameMapObserved = waitForMessage(second, 'map_change', message =>
      message.userId === 'sameuser' && message.mapKey === 'xj-jingyuan'
    );
    first.send(JSON.stringify({
      type: 'map_change',
      mapKey: 'xj-jingyuan',
      x: 60,
      y: 70
    }));
    await sameMapObserved;
    const movementObserved = waitForMessage(second, 'state', message =>
      message.userId === 'sameuser' && message.x === 77 && message.y === 88
    );
    first.send(JSON.stringify({
      type: 'state',
      mapKey: 'xj-jingyuan',
      x: 77,
      y: 88,
      direction: 'right',
      action: 'run',
      frame: 2,
      moving: true
    }));
    const movement = await movementObserved;
    assert.strictEqual(movement.characterId, 'qi-pingchuan');
    assert.strictEqual(movement.moving, true);

    for (let index = 3; index <= 11; index += 1) {
      const connection = await connect(`user-${index}`);
      sockets.push(connection.ws);
    }

    const twelfth = new WebSocket(`ws://127.0.0.1:${port}`);
    sockets.push(twelfth);
    await new Promise(resolve => twelfth.once('open', resolve));
    const full = waitForMessage(twelfth, 'join_rejected');
    twelfth.send(JSON.stringify({
      type: 'join',
      roomId: 'mailbox-xiejian',
      accountKey: 'user-12',
      username: 'user-12',
      mode: 'xiejian'
    }));
    const rejection = await full;
    assert.strictEqual(rejection.reason, 'room_full');
    assert.strictEqual(rejection.maxConnections, 11);

    await api('/api/accounts/sync', {
      method: 'POST',
      body: JSON.stringify({
        accountKey: 'sender',
        username: 'Sender',
        displayName: '寄信人'
      })
    });
    await api('/api/accounts/sync', {
      method: 'POST',
      body: JSON.stringify({
        accountKey: 'recipient',
        username: 'Recipient',
        displayName: '收信人'
      })
    });

    const accountInventory = await api('/api/game/inventory?accountKey=sameuser');
    const attachable = accountInventory.inventory.items.find(item =>
      item.definitionId === 'poison_manual'
    );
    const equipped = accountInventory.inventory.items.find(item => item.equippedSlot);
    assert.ok(attachable);
    assert.ok(equipped);
    assert.match(attachable.originLabel, /初始行囊/);

    const attachmentDraft = {
      id: 'attachment-draft',
      mailboxId: 'mailbox-demo',
      letterTitle: '带物品的信',
      itemAttachmentIds: [attachable.instanceId],
      content: [],
      createdAt: Date.now()
    };
    await api('/api/mail/draft', {
      method: 'POST',
      body: JSON.stringify({
        accountKey: 'sameuser',
        mailboxId: 'mailbox-demo',
        recipientAccountKey: 'recipient',
        letter: attachmentDraft
      })
    });
    const inventoryAfterDraft = await api('/api/game/inventory?accountKey=sameuser');
    assert.ok(inventoryAfterDraft.inventory.items.some(item => item.instanceId === attachable.instanceId));

    const equippedRejected = await apiResult('/api/mail/send', {
      method: 'POST',
      body: JSON.stringify({
        accountKey: 'sameuser',
        mailboxId: 'mailbox-demo',
        recipientAccountKey: 'recipient',
        clientMessageId: 'equipped-must-fail',
        letter: { ...attachmentDraft, itemAttachmentIds: [equipped.instanceId] }
      })
    });
    assert.strictEqual(equippedRejected.status, 409);
    assert.strictEqual(equippedRejected.body.error, 'item_attachment_equipped');

    const attachmentSendPayload = {
      accountKey: 'sameuser',
      mailboxId: 'mailbox-demo',
      recipientAccountKey: 'recipient',
      clientMessageId: 'attachment-idempotency-test',
      letter: attachmentDraft
    };
    const attachmentSent = await api('/api/mail/send', {
      method: 'POST',
      body: JSON.stringify(attachmentSendPayload)
    });
    assert.strictEqual(attachmentSent.letter.itemAttachments[0].status, 'escrow');
    assert.strictEqual((await api('/api/mail/send', {
      method: 'POST',
      body: JSON.stringify(attachmentSendPayload)
    })).duplicate, true);
    const senderAfterEscrow = await api('/api/game/inventory?accountKey=sameuser');
    assert.ok(!senderAfterEscrow.inventory.items.some(item => item.instanceId === attachable.instanceId));

    const claimed = await api(`/api/mail/read/${encodeURIComponent(attachmentSent.letter.id)}`, {
      method: 'POST',
      body: JSON.stringify({ accountKey: 'recipient' })
    });
    assert.strictEqual(claimed.receivedItems.length, 1);
    assert.strictEqual(claimed.letter.itemAttachments[0].status, 'received');
    assert.match(claimed.receivedItems[0].acquisitionLabel, /随 .* 的信收到/);
    const claimedAgain = await api(`/api/mail/read/${encodeURIComponent(attachmentSent.letter.id)}`, {
      method: 'POST',
      body: JSON.stringify({ accountKey: 'recipient' })
    });
    assert.strictEqual(claimedAgain.receivedItems.length, 0);
    const recipientInventory = await api('/api/game/inventory?accountKey=recipient');
    assert.strictEqual(
      recipientInventory.inventory.items.filter(item => item.instanceId === attachable.instanceId).length,
      1
    );

    const draftLetter = {
      id: 'draft-test',
      mailboxId: 'mailbox-demo',
      letterTitle: '测试草稿',
      content: [{ type: 'text', text: '草稿内容' }],
      createdAt: Date.now()
    };
    await api('/api/mail/draft', {
      method: 'POST',
      body: JSON.stringify({
        accountKey: 'sender',
        mailboxId: 'mailbox-demo',
        recipientAccountKey: 'recipient',
        letter: draftLetter
      })
    });
    const senderDrafts = await api(
      '/api/mail/letters?accountKey=sender&mailboxId=mailbox-demo'
    );
    assert.strictEqual(senderDrafts.letters.filter(letter => letter.direction === 'draft').length, 1);

    const sendPayload = {
      accountKey: 'sender',
      mailboxId: 'mailbox-demo',
      recipientAccountKey: 'recipient',
      clientMessageId: 'message-idempotency-test',
      letter: { ...draftLetter, letterTitle: '测试投递' }
    };
    const sent = await api('/api/mail/send', {
      method: 'POST',
      body: JSON.stringify(sendPayload)
    });
    assert.strictEqual(sent.duplicate, false);
    const duplicate = await api('/api/mail/send', {
      method: 'POST',
      body: JSON.stringify(sendPayload)
    });
    assert.strictEqual(duplicate.duplicate, true);

    const inbox = await api(
      '/api/mail/letters?accountKey=recipient&mailboxId=mailbox-demo'
    );
    assert.strictEqual(inbox.unreadCount, 1);
    assert.strictEqual(inbox.letters[0].direction, 'inbox');
    await api(`/api/mail/read/${encodeURIComponent(sent.letter.id)}`, {
      method: 'POST',
      body: JSON.stringify({ accountKey: 'recipient' })
    });
    const readInbox = await api(
      '/api/mail/letters?accountKey=recipient&mailboxId=mailbox-demo'
    );
    assert.strictEqual(readInbox.unreadCount, 0);

    const sentMailbox = await api(
      '/api/mail/letters?accountKey=sender&mailboxId=mailbox-demo'
    );
    assert.ok(sentMailbox.letters.some(letter => letter.direction === 'sent'));
    assert.ok(fs.existsSync(path.join(dataDir, 'state.json')));

    console.log('protocol and mail tests passed');
  } finally {
    for (const socket of sockets) {
      if (socket.readyState === WebSocket.OPEN) socket.close();
    }
    serverProcess.kill();
    fs.rmSync(dataDir, { recursive: true, force: true });
  }
}

run().catch(error => {
  console.error(error);
  serverProcess.kill();
  fs.rmSync(dataDir, { recursive: true, force: true });
  process.exitCode = 1;
});
