export const SAVE_KEY = 'pixelSandbox_save_v1';
export const SAVE_VERSION = 1;

export class SaveSystem {
  constructor(storage = globalThis.localStorage) {
    this.storage = storage;
  }

  save(payload) {
    if (!this.storage) return false;
    try {
      const envelope = { version: SAVE_VERSION, savedAt: Date.now(), ...payload };
      this.storage.setItem(SAVE_KEY, JSON.stringify(envelope));
      // 若父窗口或本窗口存在 MailService，则把 farm 背包同步到远端 /api/inventories/save
      if (payload?.farm) {
        try {
          const MailService = globalThis.MailService || (globalThis.parent && globalThis.parent.MailService);
          if (MailService && typeof MailService.isRemoteAvailable === 'function' &&
              typeof MailService.saveRemoteInventory === 'function') {
            const entries = Array.isArray(payload.farm.inventory) ? payload.farm.inventory : [];
            const items = entries.map(([itemId, quantity]) => ({
              id: itemId,
              itemId,
              quantity: Number(quantity) || 0,
              type: /^seed-/i.test(itemId) ? 'seed' : 'item'
            })).filter(x => x.quantity > 0);
            const equipment = payload.farm.equipment || {};
            const quickSlots = payload.farm.quickSlots || {};
            (async () => {
              try {
                const ok = await MailService.isRemoteAvailable();
                if (ok) await MailService.saveRemoteInventory({ items, equipment, quickSlots });
              } catch (_) {}
            })();
          }
        } catch (_) { /* ignore remote push errors */ }
      }
      return true;
    } catch {
      return false;
    }
  }

  load() {
    if (!this.storage) return null;
    try {
      const raw = this.storage.getItem(SAVE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (!data || data.version !== SAVE_VERSION) return null;
      return data;
    } catch {
      return null;
    }
  }

  clear() {
    if (!this.storage) return false;
    this.storage.removeItem(SAVE_KEY);
    return true;
  }
}
