import assert from 'node:assert/strict';
import { CharacterSystem, MapSystem, GameSystems, RemoteResourceLoader } from '../js/game/index.js';
import { Character } from '../js/game/character/Character.js';
import { GameMap } from '../js/game/map/GameMap.js';

await GameSystems.bootstrap({ skipRemote: true });

const ids = CharacterSystem.getAllIds().jingyuan;
assert.equal(ids.length, 7);
assert.ok(ids.includes('jiang-huaian'));
assert.ok(!ids.includes('jiang-haian'));

const expected = {
  'zhou-ran': ['道华观', 5, 4], 'he-qingfeng': ['天行教', 9, 3],
  'ren-chaoye': ['天行教', 7, 2], 'shen-chiyi': ['静远书院', 3, 5],
  'qi-pingchuan': ['桃止门', 6, 3], 'jiang-huaian': ['丹溪谷', 3, 6],
  'tang-wanchu': ['不还门', 7, 3]
};
for (const [id, [sect, martial, itemCount]] of Object.entries(expected)) {
  const character = CharacterSystem.getCharacter(id);
  assert.ok(character instanceof Character);
  assert.equal(character.sect, sect);
  assert.equal(character.baseStats.martial, martial);
  assert.equal(character.defaultItemDefs.length, itemCount);
  assert.equal(character.getAction('personality').frameInterval, 3000);
  assert.equal(character.getActionFramePaths('run').length, 4);
}
assert.notEqual(CharacterSystem.getCharacter('zhou-ran'), CharacterSystem.getCharacter('he-qingfeng'));

const maps = MapSystem.getXiejianMapOrder();
assert.equal(maps.length, 11);
for (const key of maps) {
  const map = MapSystem.getMap(key);
  assert.ok(map instanceof GameMap);
  assert.ok(map.bgPath.endsWith('.png'));
  assert.ok(map.isCharacterAllowed('jiang-huaian'));
}

RemoteResourceLoader.configure({ assetBaseUrls: ['https://cdn.example/game/'], localAssetBaseUrl: './local/' });
assert.deepEqual(RemoteResourceLoader.resolveAssetCandidates('characters/a.png'), [
  'https://cdn.example/game/characters/a.png', './local/characters/a.png'
]);

console.log('domain module tests passed');
