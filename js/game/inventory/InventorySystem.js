// InventorySystem 注册表单例（Phase 0：空实现，Phase 2 完整接入）
import { deepMerge, RemoteResourceLoader } from '../remote/RemoteResourceLoader.js';
import { XIEJIAN_ITEM_DEFS } from '../data/items.xiejian.js';
import { BASIC_ITEM_DEFS } from '../data/items.basic.js';

export const InventorySystem = {
  _defs: new Map(),
  _bootstrapped: false,

  ensureLocal() {
    const allLocal = { ...XIEJIAN_ITEM_DEFS, ...BASIC_ITEM_DEFS };
    Object.entries(allLocal).forEach(([id, def]) => { if (def && id && !this._defs.has(id)) this._defs.set(id, def); });
    this._bootstrapped = true;
    return this.getDefsPlainObject();
  },

  applyDefinitions(remoteData = {}) {
    this.ensureLocal();
    Object.entries(remoteData || {}).forEach(([id, def]) => {
      if (!def || typeof def !== 'object') return;
      this._defs.set(id, deepMerge(this._defs.get(id) || { id }, { ...def, id }));
    });
    return this.getDefsPlainObject();
  },

  async bootstrap({ useRemote = true } = {}) {
    this.ensureLocal();
    let remote = null;
    if (useRemote) { try { remote = await RemoteResourceLoader.loadItems(); } catch(_){} }
    if (remote) this.applyDefinitions(remote);
    return this.getDefsPlainObject();
  },

  getDefinition(id) { return this._defs.get(id) || null; },
  getDefsPlainObject() { return Object.fromEntries(this._defs.entries()); },
  isPortable(id) { return this.getDefinition(id)?.portable ?? true; },
  getAttachables(inventoryItems = []) {
    return inventoryItems.filter(i => this.isPortable(i.defId));
  },
};

InventorySystem.ensureLocal();

export default InventorySystem;
