const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const WebSocket = require('ws');

const port = 3108;
const dataDir = path.join(__dirname, `.game-test-data-${process.pid}`);
const serverProcess = spawn(process.execPath, ['server.js'], {
  cwd: __dirname,
  env: {
    ...process.env,
    PORT: String(port),
    DATA_DIR: dataDir,
    MONGO_ENABLED: '0',
    ITEM_RESPAWN_MS: '50',
    COMBAT_ATTACK_COOLDOWN_MS: '10'
  },
  stdio: ['ignore', 'pipe', 'pipe']
});

function waitForServer() {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('server start timeout')), 5000);
    serverProcess.stdout.on('data', data => {
      if (!data.toString().includes(`:${port}`)) return;
      clearTimeout(timeout);
      resolve();
    });
    serverProcess.stderr.on('data', data => process.stderr.write(data));
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

async function connect(accountKey) {
  const ws = new WebSocket(`ws://127.0.0.1:${port}`);
  await new Promise((resolve, reject) => {
    ws.once('open', resolve);
    ws.once('error', reject);
  });
  const statePromise = waitForMessage(ws, 'room_state');
  ws.send(JSON.stringify({
    type: 'join',
    roomId: 'mailbox-xiejian',
    accountKey,
    username: accountKey,
    mode: 'xiejian'
  }));
  return { ws, state: await statePromise };
}

async function select(ws, characterId) {
  const selected = waitForMessage(ws, 'character_selected');
  const inventory = waitForMessage(ws, 'inventory_state');
  ws.send(JSON.stringify({ type: 'select_character', characterId }));
  await selected;
  return (await inventory).inventory;
}

function sendState(ws, x, y) {
  ws.send(JSON.stringify({
    type: 'state',
    mapKey: 'xj-jingyuan',
    x,
    y,
    direction: 'down',
    action: 'personality',
    moving: false
  }));
}

async function run() {
  const sockets = [];
  try {
    await waitForServer();
    const a = await connect('combat-a');
    const b = await connect('combat-b');
    sockets.push(a.ws, b.ws);
    assert.strictEqual(Object.keys(a.state.itemDefinitions).length, 80);
    assert.ok(a.state.worldItems.length > 0);

    const inventoryA = await select(a.ws, 'he-qingfeng');
    const inventoryB = await select(b.ws, 'jiang-huaian');
    assert.ok(inventoryA.items.some(item => item.definitionId === 'bone_fan'));
    assert.ok(inventoryB.items.some(item => item.definitionId === 'plum_fall_poison'));
    assert.strictEqual(inventoryA.combat.martial, 9);
    assert.ok(inventoryA.combat.attack >= 30);

    const worldItem = a.state.worldItems.find(item => item.definition.portable);
    assert.ok(worldItem);
    sendState(a.ws, worldItem.x, worldItem.y);
    sendState(b.ws, worldItem.x, worldItem.y);
    await new Promise(resolve => setTimeout(resolve, 30));

    const aInventoryAfterPickup = waitForMessage(a.ws, 'inventory_state', message =>
      message.inventory.items.some(item => item.instanceId === worldItem.instanceId)
    ).catch(() => null);
    const bInventoryAfterPickup = waitForMessage(b.ws, 'inventory_state', message =>
      message.inventory.items.some(item => item.instanceId === worldItem.instanceId)
    ).catch(() => null);
    const aRejected = waitForMessage(a.ws, 'item_action_rejected', message =>
      message.instanceId === worldItem.instanceId
    ).catch(() => null);
    const bRejected = waitForMessage(b.ws, 'item_action_rejected', message =>
      message.instanceId === worldItem.instanceId
    ).catch(() => null);
    a.ws.send(JSON.stringify({ type: 'item_pickup', instanceId: worldItem.instanceId }));
    b.ws.send(JSON.stringify({ type: 'item_pickup', instanceId: worldItem.instanceId }));
    const [pickedA, pickedB, rejectedA, rejectedB] = await Promise.all([
      aInventoryAfterPickup,
      bInventoryAfterPickup,
      aRejected,
      bRejected
    ]);
    assert.strictEqual(Boolean(pickedA) + Boolean(pickedB), 1);
    assert.strictEqual(Boolean(rejectedA) + Boolean(rejectedB), 1);

    const owner = pickedA ? a : b;
    const recipient = pickedA ? b : a;
    const received = waitForMessage(recipient.ws, 'inventory_state', message =>
      message.inventory.items.some(item => item.instanceId === worldItem.instanceId)
    );
    owner.ws.send(JSON.stringify({
      type: 'item_gift',
      instanceId: worldItem.instanceId,
      toAccountKey: pickedA ? 'combat-b' : 'combat-a'
    }));
    assert.ok((await received).inventory.items.some(item => item.instanceId === worldItem.instanceId));

    const poison = inventoryB.items.find(item => item.definitionId === 'plum_fall_poison');
    const coated = waitForMessage(b.ws, 'inventory_state', message =>
      message.inventory.combat.pendingCoating === 'poison'
    );
    b.ws.send(JSON.stringify({ type: 'item_use', instanceId: poison.instanceId }));
    assert.strictEqual((await coated).inventory.combat.pendingCoating, 'poison');

    sendState(a.ws, 1000, 1000);
    sendState(b.ws, 1030, 1000);
    await new Promise(resolve => setTimeout(resolve, 30));
    const poisonedHit = waitForMessage(a.ws, 'combat_hit', message =>
      message.attackerAccountKey === 'combat-b'
    );
    b.ws.send(JSON.stringify({ type: 'combat_attack', targetAccountKey: 'combat-a' }));
    assert.strictEqual((await poisonedHit).coating, 'poison');

    let defeated = null;
    for (let index = 0; index < 6 && !defeated; index += 1) {
      const defeatedPromise = waitForMessage(b.ws, 'player_defeated', message =>
        message.userId === 'combat-b'
      , 250).catch(() => null);
      a.ws.send(JSON.stringify({ type: 'combat_attack', targetAccountKey: 'combat-b' }));
      defeated = await defeatedPromise;
      await new Promise(resolve => setTimeout(resolve, 15));
    }
    assert.ok(defeated);
    assert.strictEqual(defeated.returnMapKey, 'xj-jingyuan');
    const saved = JSON.parse(fs.readFileSync(path.join(dataDir, 'state.json'), 'utf8'));
    assert.strictEqual(saved.itemInstances[worldItem.instanceId].ownerAccountKey, pickedA ? 'combat-b' : 'combat-a');
    assert.strictEqual(saved.combatProfiles['combat-b'].hp, 100);

    console.log('inventory and combat tests passed');
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
