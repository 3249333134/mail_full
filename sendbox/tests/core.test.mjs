import test from 'node:test';
import assert from 'node:assert/strict';

import { Player } from '../src/player.js';
import { Pathfinder } from '../src/pathfinder.js';
import { TILE } from '../src/gameConfig.js';

const openMap = { isSolid: () => false };

test('WASD and arrow keys move the player and cancel click-to-move', () => {
  const player = new Player();
  player.setPosition(5 * TILE + TILE / 2, 5 * TILE + TILE / 2);
  player.setPath([{ x: 10 * TILE, y: 10 * TILE }]);

  const startX = player.x;
  player.update(16, openMap, { d: true });

  assert.ok(player.x > startX);
  assert.equal(player.y, 5 * TILE + TILE / 2);
  assert.deepEqual(player.path, []);
  assert.equal(player.direction, 'right');
});

test('diagonal keyboard movement is normalized', () => {
  const player = new Player();
  player.setPosition(5 * TILE + TILE / 2, 5 * TILE + TILE / 2);
  const start = { x: player.x, y: player.y };

  player.update(16, openMap, { d: true, s: true });

  const distance = Math.hypot(player.x - start.x, player.y - start.y);
  assert.ok(Math.abs(distance - 2.5) < 0.001);
});

test('pathfinder does not cut diagonally through blocked corners', () => {
  const blocked = new Set(['2,1', '1,2']);
  const mapManager = {
    isSolid(px, py) {
      const key = `${Math.floor(px / TILE)},${Math.floor(py / TILE)}`;
      return blocked.has(key);
    }
  };
  const pathfinder = new Pathfinder(mapManager);

  const path = pathfinder.findPath(1.5 * TILE, 1.5 * TILE, 2.5 * TILE, 2.5 * TILE);
  assert.ok(path.length > 2, 'a valid route may go around the corner');
  assert.notDeepEqual(path[1], { x: 2.5 * TILE, y: 2.5 * TILE });
});
