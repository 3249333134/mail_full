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
