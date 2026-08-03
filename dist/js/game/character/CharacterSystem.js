import { CharacterFactory } from './CharacterFactory.js';
import { deepMerge, RemoteResourceLoader } from '../remote/RemoteResourceLoader.js';
import { JINGYUAN_CHARACTER_DEFS, JINGYUAN_CHARACTER_IDS, LEGACY_CHARACTER_ID_ALIASES } from '../data/characters.jingyuan.js';
import { HANMEN_CHARACTER_DEFS, HANMEN_CHARACTER_IDS } from '../data/characters.hanmen.js';
import { MAIN_CHARACTER_DEFS, MAIN_CHARACTER_IDS } from '../data/characters.main.js';

const LOCAL_DEFS = { ...JINGYUAN_CHARACTER_DEFS, ...HANMEN_CHARACTER_DEFS, ...MAIN_CHARACTER_DEFS };
const CATEGORY_FILTER = {
  jingyuan: d => d.category === 'jingyuan', xiejian: d => d.category === 'jingyuan',
  hanmen: d => d.category === 'hanmen', main: d => d.category === 'main',
};

export const CharacterSystem = {
  _cache: new Map(), _defs: new Map(), _bootstrapped: false, _inventoryDefs: null,

  normalizeId(id) { return LEGACY_CHARACTER_ID_ALIASES[id] || id; },

  ensureLocal(inventoryDefs = null) {
    if (inventoryDefs) this._inventoryDefs = inventoryDefs;
    if (!this._defs.size) Object.entries(LOCAL_DEFS).forEach(([id, def]) => this._defs.set(id, def));
    this._bootstrapped = true;
    return this;
  },

  applyDefinitions(remote = {}) {
    this.ensureLocal();
    Object.entries(remote || {}).forEach(([rawId, def]) => {
      const id = this.normalizeId(rawId);
      if (!LOCAL_DEFS[id] || !def || typeof def !== 'object') return;
      this._defs.set(id, deepMerge(LOCAL_DEFS[id], { ...def, id }));
      this._cache.delete(id);
    });
    return this;
  },

  async bootstrap(inventoryDefs = null, { useRemote = true } = {}) {
    this.ensureLocal(inventoryDefs);
    if (useRemote) this.applyDefinitions(await RemoteResourceLoader.loadCharacters().catch(() => null));
    return this;
  },

  getCharacter(rawId) {
    this.ensureLocal();
    const id = this.normalizeId(rawId);
    if (!id || !this._defs.has(id)) return null;
    if (!this._cache.has(id)) this._cache.set(id, CharacterFactory.fromDef(this._defs.get(id), { inventoryDefs: this._inventoryDefs }));
    return this._cache.get(id);
  },

  getCharacterDef(rawId) { this.ensureLocal(); return this._defs.get(this.normalizeId(rawId)) || null; },
  getCharacterListForCategory(categoryKey) {
    this.ensureLocal();
    const filter = CATEGORY_FILTER[categoryKey] || (() => true);
    return Array.from(this._defs.values()).filter(filter).map(d => ({
      id: d.id, name: d.name, dir: d.dir || '', sect: d.sect || '', gender: d.gender || null,
      group: d.group || null, portraitPath: d.portraitPath || '', martial: d.baseStats?.martial || 0,
      defaultItems: [...(d.defaultItems || [])], actions: Object.keys(d.actions || {}),
    }));
  },
  getLegacyCharacterArrays() { return { JINGYUAN: this.getCharacterListForCategory('jingyuan'), HANMEN: this.getCharacterListForCategory('hanmen'), MAIN: this.getCharacterListForCategory('main') }; },
  createInitialInventory(id) { const ch = this.getCharacter(id); return { items: ch ? [...ch.defaultItemDefs] : [], quickSlots: [null, null, null, null] }; },
  createInitialCombatStats(id) { return this.getCharacter(id)?.computeCombatStats() || null; },
  isCategory(id, cat) { const d = this.getCharacterDef(id); return !!d && (cat === 'xiejian' ? d.category === 'jingyuan' : d.category === cat); },
  getAllIds() { return { jingyuan: [...JINGYUAN_CHARACTER_IDS], hanmen: [...HANMEN_CHARACTER_IDS], main: [...MAIN_CHARACTER_IDS] }; },
};

CharacterSystem.ensureLocal();
export default CharacterSystem;
