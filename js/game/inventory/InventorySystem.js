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
    
    // 优先从 bootstrap API 获取 itemDefinitions
    if (useRemote) {
      try {
        // 尝试从 /api/game/bootstrap 获取完整定义
        const bootstrapResponse = await fetch('/api/game/bootstrap', { cache: 'no-cache' });
        if (bootstrapResponse.ok) {
          const payload = await bootstrapResponse.json();
          if (payload.itemDefinitions && typeof payload.itemDefinitions === 'object') {
            this.applyDefinitions(payload.itemDefinitions);
            return this.getDefsPlainObject();
          }
        }
      } catch (_) {}
      
      // 备选方案：通过 RemoteResourceLoader 加载
      try {
        const remote = await RemoteResourceLoader.loadItems();
        if (remote) this.applyDefinitions(remote);
      } catch (_) {}
    }
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
