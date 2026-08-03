const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const port = 3110;
const dataDir = path.join(__dirname, `.domain-test-data-${process.pid}`);
const child = spawn(process.execPath, ['server.js'], {
  cwd: __dirname,
  env: { ...process.env, PORT: String(port), DATA_DIR: dataDir, MONGO_ENABLED: '0', HTTP_ONLY: '1' },
  stdio: ['ignore', 'pipe', 'pipe']
});

function waitForServer() {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('server start timeout')), 5000);
    child.stdout.on('data', chunk => {
      if (!chunk.toString().includes(`:${port}`)) return;
      clearTimeout(timer); resolve();
    });
    child.stderr.on('data', chunk => process.stderr.write(chunk));
  });
}

async function api(pathname, options = {}) {
  const response = await fetch(`http://127.0.0.1:${port}${pathname}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }
  });
  const body = await response.json();
  assert.ok(response.ok, `${pathname}: ${response.status} ${JSON.stringify(body)}`);
  return body;
}

(async () => {
  try {
    await waitForServer();
    const bootstrap = await api('/api/game/bootstrap');
    assert.equal(Object.keys(bootstrap.characterDefinitions).length, 7);
    assert.equal(Object.keys(bootstrap.mapDefinitions).length, 11);
    assert.ok(bootstrap.resourceVersion);
    assert.deepEqual(bootstrap.resources.assetBaseUrls, []);

    const created = await api('/api/mailboxes', {
      method: 'POST', body: JSON.stringify({ name: '模块测试信箱', ownerAccountKey: 'owner-a', visibility: 'public', mapBackground: 'hanmen' })
    });
    assert.ok(created.mailbox.mailboxCode);
    const lookup = await api(`/api/mailbox_codes/lookup?code=${created.mailbox.mailboxCode}`);
    assert.equal(lookup.mailbox.id, created.mailbox.id);
    const joined = await api('/api/mailbox_codes/join', {
      method: 'POST', body: JSON.stringify({ code: created.mailbox.mailboxCode, accountKey: 'friend-b' })
    });
    assert.ok(joined.mailbox.memberAccountKeys.includes('friend-b'));
    const list = await api('/api/mailboxes?accountKey=friend-b');
    assert.ok(list.mailboxes.some(mailbox => mailbox.id === created.mailbox.id));
    const system = await api('/api/mailbox_codes/lookup?code=XJJ9H6');
    assert.equal(system.mailbox.id, 'mailbox-xiejian');
    assert.ok(fs.existsSync(path.join(dataDir, 'state.json')));
    console.log('domain http tests passed');
  } finally {
    child.kill();
    setTimeout(() => fs.rmSync(dataDir, { recursive: true, force: true }), 100);
  }
})().catch(error => { console.error(error); child.kill(); process.exitCode = 1; });
