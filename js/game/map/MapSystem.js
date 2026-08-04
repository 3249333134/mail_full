import { GameMap } from './GameMap.js';
import { deepMerge, RemoteResourceLoader } from '../remote/RemoteResourceLoader.js';
import { XIEJIAN_MAP_DEFS, XIEJIAN_MAP_ORDER } from '../data/maps.xiejian.js';
import { BASIC_MAP_DEFS } from '../data/maps.basic.js';
import { HANMEN_MAP_DEFS } from '../data/maps.hanmen.js';
import { POXIAO_MAP_DEFS, POXIAO_MAP_ORDER } from '../data/maps.poxiao.js';

const LOCAL_DEFS = { ...BASIC_MAP_DEFS, ...XIEJIAN_MAP_DEFS, ...HANMEN_MAP_DEFS, ...POXIAO_MAP_DEFS };

export const MapSystem = {
  _cache: new Map(), _defs: new Map(), _bootstrapped: false, _itemDefs: null,
  ensureLocal(itemDefs = null) {
    if (itemDefs) this._itemDefs = itemDefs;
    if (!this._defs.size) Object.entries(LOCAL_DEFS).forEach(([key, def]) => this._defs.set(key, def));
    this._bootstrapped = true;
    return this;
  },
  applyDefinitions(remote = {}) {
    this.ensureLocal();
    Object.entries(remote || {}).forEach(([key, def]) => {
      if (!LOCAL_DEFS[key] || !def || typeof def !== 'object') return;
      this._defs.set(key, deepMerge(LOCAL_DEFS[key], { ...def, key }));
      this._cache.delete(key);
    });
    return this;
  },
  async bootstrap(itemDefs = null, { useRemote = true } = {}) {
    this.ensureLocal(itemDefs);
    if (useRemote) this.applyDefinitions(await RemoteResourceLoader.loadMaps().catch(() => null));
    return this;
  },
  getMap(key) {
    this.ensureLocal();
    if (!key || !this._defs.has(key)) return null;
    if (!this._cache.has(key)) this._cache.set(key, new GameMap(this._defs.get(key), { itemDefs: this._itemDefs }));
    return this._cache.get(key);
  },
  getMapDef(key) { this.ensureLocal(); return this._defs.get(key) || null; },
  getXiejianMapOrder() { return [...XIEJIAN_MAP_ORDER]; },
  getPoxiaoMapOrder() { return [...POXIAO_MAP_ORDER]; },
  getMapListForUI(category = null) { this.ensureLocal(); return Array.from(this._defs.values()).filter(d => !category || d.category === category).map(d => ({ key: d.key, name: d.name, category: d.category, bgThumbnailPath: d.bgThumbnailPath || d.bgPath || '' })); },
  getLegacyXiejianMaps() {
    const xjMapMap = {}, xjMapNames = {};
    XIEJIAN_MAP_ORDER.forEach(key => { const def = this.getMapDef(key); if (def) { xjMapMap[key] = def.bgFileName || def.bgPath.split('/').pop(); xjMapNames[key] = def.name; } });
    return { xjMapMap, xjMapNames };
  },
  getLegacyPoxiaoMaps() {
    const pxMapMap = {}, pxMapNames = {};
    POXIAO_MAP_ORDER.forEach(key => { const def = this.getMapDef(key); if (def) { pxMapMap[key] = def.bgFileName || def.bgPath.split('/').pop(); pxMapNames[key] = def.name; } });
    return { pxMapMap, pxMapNames };
  },
};

MapSystem.ensureLocal();
export default MapSystem;
