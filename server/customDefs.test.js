const assert = require('assert');
const path = require('path');
const { spawn } = require('child_process');

const port = 3117;
const dataDir = path.join(__dirname, `.custom-defs-test-${process.pid}`);
const ts = `${Date.now()}-${process.pid}`;
const customCharId = `test-custom-char-${ts}`;
const customMapId = `test-custom-map-${ts}`;
const BUILTIN_CHAR = 'zhou-ran';   // 挟剑内置角色
const BUILTIN_MAP = 'xj-jingyuan'; // 挟剑内置地图

const child = spawn(process.execPath, ['server.js'], {
  cwd: __dirname,
  env: { ...process.env, PORT: String(port), DATA_DIR: dataDir },
  stdio: ['ignore', 'pipe', 'pipe']
});

function waitForServer() {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('server start timeout')), 25000);
    child.stdout.on('data', chunk => {
      const text = chunk.toString();
      if (!text.includes(`:${port}`)) return;
      clearTimeout(timer); resolve();
    });
    child.stderr.on('data', chunk => {
      const text = chunk.toString();
      if (text.includes(`:${port}`)) { clearTimeout(timer); resolve(); return; }
      process.stderr.write(chunk);
    });
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

function findById(arr, id) {
  return arr.find(x => x.id === id || x.key === id);
}

(async () => {
  const modifiedIds = [];
  try {
    await waitForServer();

    // ---- 1. 列表基线：内置角色唯一、无重复 ----
    let list = await api('/api/game/characters/list');
    let ids = (list.characters || []).map(c => c.id);
    assert.ok(ids.includes(BUILTIN_CHAR), '内置角色应存在');
    assert.equal(new Set(ids).size, ids.length, '角色列表不应有重复 id');
    const builtinRow = findById(list.characters, BUILTIN_CHAR);
    assert.equal(builtinRow._builtin, true);
    assert.equal(builtinRow._modified, undefined);

    // ---- 2. 新增自定义角色 ----
    let up = await api('/api/game/characters/upload', {
      method: 'POST',
      body: JSON.stringify({ worldCategory: 'xiejian', definition: {
        id: customCharId, name: '测试角色', category: 'jingyuan', sect: '测试', baseStats: { maxHp: 100 },
        actions: {}
      } })
    });
    assert.equal(up.kind, 'custom');
    modifiedIds.push(customCharId);
    list = await api('/api/game/characters/list');
    const customRow = findById(list.characters, customCharId);
    assert.ok(customRow && customRow._custom === true, '自定义角色应标记 _custom');

    // ---- 3. 覆盖内置角色（编辑已有资源）----
    up = await api('/api/game/characters/upload', {
      method: 'POST',
      body: JSON.stringify({ worldCategory: 'xiejian', definition: {
        id: BUILTIN_CHAR, name: '周然·改', category: 'jingyuan', sect: '测试门派', baseStats: { maxHp: 999 },
        actions: {}
      } })
    });
    assert.equal(up.kind, 'override', '覆盖内置角色应返回 kind=override');
    list = await api('/api/game/characters/list');
    const overridden = list.characters.filter(c => c.id === BUILTIN_CHAR);
    assert.equal(overridden.length, 1, '覆盖后不应出现重复行');
    assert.equal(overridden[0]._builtin, true);
    assert.equal(overridden[0]._modified, true);
    assert.equal(overridden[0].name, '周然·改', '覆盖定义应生效');
    // bootstrap 合并定义同样生效
    const boot = await api('/api/game/bootstrap');
    assert.equal(boot.characterDefinitions[BUILTIN_CHAR].name, '周然·改');
    assert.equal(boot.characterDefinitions[BUILTIN_CHAR].baseStats.maxHp, 999);

    // ---- 4. 还原内置角色 ----
    const restored = await api(`/api/game/characters/${BUILTIN_CHAR}/restore`, { method: 'POST' });
    assert.equal(restored.success, true);
    list = await api('/api/game/characters/list');
    const back = findById(list.characters, BUILTIN_CHAR);
    assert.equal(back.name, builtinRow.name, '还原后应恢复内置默认名称');
    assert.equal(back._modified, undefined, '还原后不应再标记 _modified');

    // ---- 5. 禁用内置角色 ----
    const disabled = await api(`/api/game/characters/${BUILTIN_CHAR}/delete`, { method: 'POST' });
    assert.equal(disabled.action, 'disabled');
    assert.equal(disabled.builtin, true);
    list = await api('/api/game/characters/list');
    assert.ok(!findById(list.characters, BUILTIN_CHAR), '禁用后内置角色应隐藏');
    const boot2 = await api('/api/game/bootstrap');
    assert.equal(boot2.characterDefinitions[BUILTIN_CHAR], undefined, 'bootstrap 合并定义应剔除禁用角色');
    modifiedIds.push(BUILTIN_CHAR);

    // ---- 6. 还原被禁用的内置角色 ----
    await api(`/api/game/characters/${BUILTIN_CHAR}/restore`, { method: 'POST' });
    list = await api('/api/game/characters/list');
    assert.ok(findById(list.characters, BUILTIN_CHAR), '还原后内置角色应重新出现');

    // ---- 7. 删除自定义角色 ----
    const del = await api(`/api/game/characters/${customCharId}/delete`, { method: 'POST' });
    assert.equal(del.action, 'deleted');
    list = await api('/api/game/characters/list');
    assert.ok(!findById(list.characters, customCharId), '自定义角色应被删除');

    // ---- 8. 地图流程（新增/覆盖/还原/禁用/还原）----
    let mlist = await api('/api/game/maps/list');
    const mBaseline = findById(mlist.maps, BUILTIN_MAP);
    assert.ok(mBaseline && mBaseline._builtin, '内置地图应存在');

    up = await api('/api/game/maps/upload', {
      method: 'POST',
      body: JSON.stringify({ worldCategory: 'xiejian', definition: {
        key: BUILTIN_MAP, name: '静远书院·改', worldSize: { width: 999, height: 888 },
        allowedCharacterIds: []
      } })
    });
    assert.equal(up.kind, 'override');
    mlist = await api('/api/game/maps/list');
    const mOver = mlist.maps.filter(m => m.key === BUILTIN_MAP);
    assert.equal(mOver.length, 1, '覆盖后地图不应出现重复行');
    assert.equal(mOver[0].name, '静远书院·改');
    await api(`/api/game/maps/${BUILTIN_MAP}/restore`, { method: 'POST' });

    await api('/api/game/maps/upload', {
      method: 'POST',
      body: JSON.stringify({ worldCategory: 'xiejian', definition: {
        key: customMapId, name: '测试地图', worldSize: { width: 100, height: 100 }, allowedCharacterIds: []
      } })
    });
    mlist = await api('/api/game/maps/list');
    assert.ok(findById(mlist.maps, customMapId) && findById(mlist.maps, customMapId)._custom);

    const mDisabled = await api(`/api/game/maps/${BUILTIN_MAP}/delete`, { method: 'POST' });
    assert.equal(mDisabled.action, 'disabled');
    mlist = await api('/api/game/maps/list');
    assert.ok(!findById(mlist.maps, BUILTIN_MAP), '禁用后内置地图应隐藏');
    const boot3 = await api('/api/game/bootstrap');
    assert.equal(boot3.mapDefinitions[BUILTIN_MAP], undefined, 'bootstrap 合并地图应剔除禁用地图');
    modifiedIds.push(BUILTIN_MAP);

    await api(`/api/game/maps/${BUILTIN_MAP}/restore`, { method: 'POST' });
    await api(`/api/game/maps/${customMapId}/delete`, { method: 'POST' });

    console.log('custom defs tests passed');
  } finally {
    // 兜底清理：还原所有被测试修改的内置定义
    try {
      await api(`/api/game/characters/${BUILTIN_CHAR}/restore`, { method: 'POST' });
      await api(`/api/game/maps/${BUILTIN_MAP}/restore`, { method: 'POST' });
      await api(`/api/game/characters/${customCharId}/delete`, { method: 'POST' });
      await api(`/api/game/maps/${customMapId}/delete`, { method: 'POST' });
    } catch (_) {}
    child.kill();
    setTimeout(() => {
      try { require('fs').rmSync(dataDir, { recursive: true, force: true }); } catch (_) {}
    }, 100);
  }
})().catch(error => { console.error(error); child.kill(); process.exitCode = 1; });
