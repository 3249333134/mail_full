// GameMap 基类（一张地图 = 一个实例）
// Phase 0：最简实现；Phase 3 接入真实 initialWorldItems / spawnPoint 差异化
import { Portal } from './Portal.js';

export class GameMap {
  constructor(def, opts = {}) {
    if (!def || !def.key) throw new Error('GameMap: def.key is required');

    this.key = def.key;
    this.name = def.name || def.key;
    this.category = def.category || 'basic';
    this.bgPath = def.bgPath || '';
    this.bgThumbnailPath = def.bgThumbnailPath || null;
    this.worldScale = def.worldScale ?? 2;
    this.worldSize = def.worldSize || null;
    this.routeGraphId = def.routeGraphId || null;
    this.spawnNodeId = def.spawnNodeId || null;

    // 出生点（世界坐标比例 0~1）
    this.spawnPoint = def.spawnPoint || { worldXRatio: 0.50, worldYRatio: 0.72 };

    // 允许角色 ['*']=全部
    this.allowedCharacterIds = Array.isArray(def.allowedCharacterIds) && def.allowedCharacterIds.length
      ? def.allowedCharacterIds
      : ['*'];

    // 初始世界物品（[{defId, worldXRatio, worldYRatio, fixed?, respawnMs?}]）
    this.initialWorldItemDefs = def.initialWorldItems || [];

    // NPC / 传送门
    this.npcDefs = def.npcs || [];
    this.portalDefs = (def.portals || []).map(p => new Portal(p));

    // BGM / 环境音
    this.bgmKey = def.bgmKey || null;
    this.ambientSfx = def.ambientSfx || [];

    this._itemDefs = opts.itemDefs || null;
  }

  isCharacterAllowed(charId) {
    if (this.allowedCharacterIds.includes('*')) return true;
    return this.allowedCharacterIds.includes(charId);
  }

  getSpawnPixelCoords(worldW, worldH) {
    return {
      x: Math.round((this.spawnPoint.worldXRatio ?? 0.5) * (worldW || 0)),
      y: Math.round((this.spawnPoint.worldYRatio ?? 0.72) * (worldH || 0)),
    };
  }

  /** 给 worldItems 实例化带唯一 instanceId 的数组 */
  instantiateWorldItems({ seed = Date.now(), worldW, worldH } = {}) {
    const w = worldW || this.worldSize?.width || 0;
    const h = worldH || this.worldSize?.height || 0;
    let counter = 0;
    return this.initialWorldItemDefs.map(d => {
      const defId = d.defId || d.definitionId;
      const itemDef = this._itemDefs?.[defId] || {};
      return {
        instanceId: `wi_${this.key}_${seed}_${counter++}`,
        defId,
        nodeId: d.nodeId || null,
        x: Math.round((d.worldXRatio ?? 0) * w),
        y: Math.round((d.worldYRatio ?? 0) * h),
        portable: d.portable ?? (itemDef.portable ?? true),
        fixed: d.fixed ?? false,
        respawnMs: d.respawnMs ?? (itemDef.respawnMs ?? 0),
      };
    });
  }

  toJSON() {
    return { key: this.key, name: this.name, category: this.category };
  }
}

export default GameMap;
