// Inventory 实例类（每个人物/背包 = 一个实例）
// Phase 0：最简实现（不破坏现有逻辑）；Phase 2 接入后完全生效
import { computeCombatStats } from './CombatStatComputer.js';

let _globalInstanceId = 0;

export class Inventory {
  constructor(initialItems = [], opts = {}) {
    this._defs = opts.defs || null;
    this._baseStats = opts.baseStats || null;
    this.items = [];
    this.quickSlots = [null, null, null, null];
    this._idSet = new Set();

    (initialItems || []).forEach(item => {
      this.add(item.defId, item.qty || 1, {
        quickSlot: item.quickSlot ?? null,
        equippedSlot: item.equippedSlot ?? null,
      });
    });
  }

  _genId() { return `inv_${Date.now().toString(36)}_${(_globalInstanceId++).toString(36)}`; }
  _find(instanceId) { return this.items.find(i => i.instanceId === instanceId); }
  _getDef(defId) { return this._defs?.[defId] || null; }

  add(defId, qty = 1, opts = {}) {
    const def = this._getDef(defId);
    const stackable = def?.stackable ?? true;
    const realQty = stackable ? Math.max(1, qty | 0) : 1;
    const instanceId = opts.instanceId || this._genId();
    const item = {
      instanceId, defId, qty: realQty,
      equippedSlot: opts.equippedSlot || null,
    };
    this.items.push(item);
    this._idSet.add(instanceId);
    if (opts.quickSlot != null && opts.quickSlot >= 0 && opts.quickSlot < this.quickSlots.length) {
      this.quickSlots[opts.quickSlot] = instanceId;
    }
    return { added: [instanceId], overflow: [] };
  }

  removeByInstanceId(instanceId, qty = 1) {
    const idx = this.items.findIndex(i => i.instanceId === instanceId);
    if (idx < 0) return false;
    const it = this.items[idx];
    if ((it.qty || 1) <= qty) {
      this.items.splice(idx, 1);
      this._idSet.delete(instanceId);
      this.quickSlots = this.quickSlots.map(s => s === instanceId ? null : s);
    } else {
      it.qty -= qty;
    }
    return true;
  }

  equip(instanceId, slot) {
    const it = this._find(instanceId);
    if (!it) return false;
    const def = this._getDef(it.defId);
    if (!def || def.equipmentSlot !== slot) return false;
    this.items.forEach(i => { if (i.equippedSlot === slot) i.equippedSlot = null; });
    it.equippedSlot = slot;
    return true;
  }

  use(instanceId /*, ctx = {} */) {
    const it = this._find(instanceId);
    if (!it) return { effects: null, consumed: false };
    const def = this._getDef(it.defId);
    if (!def?.effect) return { effects: null, consumed: false };
    const effects = { ...def.effect };
    const consumed = this.removeByInstanceId(instanceId, 1);
    return { effects, consumed };
  }

  computeCombatStats(baseStats = this._baseStats || {}) {
    return computeCombatStats(baseStats, this.items, this._defs || {});
  }

  toJSON() {
    return {
      items: this.items.map(i => ({ ...i })),
      quickSlots: [...this.quickSlots],
    };
  }

  static fromJSON(saved, defs = null) {
    const inv = new Inventory([], { defs });
    if (!saved) return inv;
    (saved.items || []).forEach(i => {
      inv.add(i.defId, i.qty || 1, {
        instanceId: i.instanceId, equippedSlot: i.equippedSlot,
      });
    });
    inv.quickSlots = [...(saved.quickSlots || [null, null, null, null])];
    return inv;
  }
}

Inventory.EMPTY_JSON = { items: [], quickSlots: [null, null, null, null] };
export default Inventory;
