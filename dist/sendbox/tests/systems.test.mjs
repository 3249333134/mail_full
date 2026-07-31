import test from 'node:test';
import assert from 'node:assert/strict';

import { FarmSystem } from '../src/farmSystem.js';
import { BattleSystem } from '../src/battleSystem.js';
import { QuestSystem } from '../src/questSystem.js';
import { SaveSystem, SAVE_KEY } from '../src/saveSystem.js';
import { MapManager } from '../src/mapManager.js';
import { MAP_W, MAP_H, TILE_SOLID, TILE_TYPE } from '../src/gameConfig.js';

test('farm starts with seeds and keeps fields scoped to their map', () => {
  const farm = new FarmSystem();
  assert.equal(farm.getSeedCount('cabbage'), 5);
  assert.equal(farm.plantCrop(4, 5, 'cabbage', 'farm'), true);
  assert.ok(farm.getFieldAt(4, 5, 'farm'));
  assert.equal(farm.getFieldAt(4, 5, 'map-0'), undefined);

  const restored = new FarmSystem();
  restored.restore(farm.serialize());
  assert.ok(restored.getFieldAt(4, 5, 'farm'));
  assert.equal(restored.getSeedCount('cabbage'), 4);
});

test('battle attack method is callable and clearing a floor unlocks descent', () => {
  const battle = new BattleSystem();
  battle.currentMonster = { name: '测试怪物', hp: 1, attack: 0, defense: 0, expReward: 1, drops: [], isBoss: false };
  battle.monsterHp = 1;
  battle.monsterMaxHp = 1;
  battle.isInBattle = true;
  const result = battle.playerAttack();
  assert.equal(result.result, 'victory');
  assert.equal(battle.floorCleared, true);
  assert.equal(battle.goDown(), true);
  assert.equal(battle.currentFloor, 2);
  assert.equal(battle.floorCleared, false);
});

test('quest progress becomes ready and rewards can only be claimed once', () => {
  const quests = new QuestSystem();
  assert.equal(quests.acceptQuest('ch1_q1'), true);
  quests.recordEvent('plantCrops', 5);
  assert.equal(quests.readyToClaim.has('ch1_q1'), true);
  assert.equal(quests.completedQuests.has('ch1_q1'), false);
  const rewards = quests.claimQuest('ch1_q1');
  assert.equal(rewards.money, 500);
  assert.equal(quests.claimQuest('ch1_q1'), null);
});

test('mine floor objectives use the highest reached floor', () => {
  const quests = new QuestSystem();
  quests.currentQuestOrder = 3;
  assert.equal(quests.acceptQuest('ch1_q4'), true);
  quests.recordEvent('reachMineFloor', 7);
  quests.recordEvent('reachMineFloor', 4);
  assert.equal(quests.getQuestProgress('ch1_q4')[0].current, 7);
  quests.recordEvent('reachMineFloor', 10);
  assert.equal(quests.readyToClaim.has('ch1_q4'), true);
});

test('versioned save round-trips and rejects corrupt data', () => {
  const values = new Map();
  const storage = {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: key => values.delete(key),
  };
  const saves = new SaveSystem(storage);
  assert.equal(saves.save({ mapIndex: 4, player: { x: 10, y: 20 } }), true);
  assert.equal(saves.load().mapIndex, 4);
  values.set(SAVE_KEY, '{broken');
  assert.equal(saves.load(), null);
});

test('every mine resource and door has a reachable adjacent tile', () => {
  const maps = new MapManager();
  maps.loadMap(4);
  const spawn = maps.getSafeSpawnPosition();
  const start = [Math.floor(spawn.x / 32), Math.floor(spawn.y / 32)];
  const visited = new Set([start.join(',')]);
  const queue = [start];
  while (queue.length) {
    const [x, y] = queue.shift();
    for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || nx >= MAP_W || ny < 0 || ny >= MAP_H || TILE_SOLID[maps.map[ny][nx]]) continue;
      const key = `${nx},${ny}`;
      if (!visited.has(key)) { visited.add(key); queue.push([nx, ny]); }
    }
  }
  const interactive = new Set([TILE_TYPE.ORE_COPPER, TILE_TYPE.ORE_IRON, TILE_TYPE.ORE_GOLD, TILE_TYPE.CHEST, TILE_TYPE.DOOR]);
  for (let y = 0; y < MAP_H; y++) for (let x = 0; x < MAP_W; x++) {
    if (!interactive.has(maps.map[y][x])) continue;
    const reachable = [[0, -1], [1, 0], [0, 1], [-1, 0]].some(([dx, dy]) => visited.has(`${x + dx},${y + dy}`));
    assert.equal(reachable, true, `interactive tile at ${x},${y} should be reachable`);
  }
});
