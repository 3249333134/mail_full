// Character 基类（一个人物 = 一个实例）
// Phase 0：最简实现，只存属性 + actionSet；inventory/quests Phase 2 接入
import { ActionSet } from './ActionSet.js';

const DEFAULT_QUEST_LOG = { entries: [] };

export class Character {
  constructor(def, opts = {}) {
    if (!def || !def.id) throw new Error('Character: def.id is required');

    this.id = def.id;
    this.name = def.name || def.id;
    this.sect = def.sect || null;
    this.gender = def.gender || null;
    this.category = def.category || null;

    // dir / group / frameRoot 三个定位资源的字段（兼容旧代码）
    this.dir = def.dir || null;
    this.group = def.group || null;
    this.frameRoot = def.frameRoot || (def.dir ? `characters/jingyuan/${def.dir}/frames` : '');
    this.portraitPath = def.portraitPath || '';
    this.collision = { width: 40, height: 32, offsetY: 32, ...(def.collision || {}) };
    this.render = { width: 112, height: 112, nameplateOffsetY: 60, ...(def.render || {}) };
    this.equipmentSlots = [...(def.equipmentSlots || ['weapon', 'clothing', 'accessory'])];

    // 基线战斗属性（装备后叠加）
    this.baseStats = {
      maxHp: def.baseStats?.maxHp ?? 100,
      martial: def.baseStats?.martial ?? 0,
      attack: def.baseStats?.attack ?? 4,
      defense: def.baseStats?.defense ?? 4,
      speed: def.baseStats?.speed ?? 1,
      ...(def.baseStats || {}),
    };

    // 动作集合：选对应兜底模板
    const fallback = this.category === 'hanmen'
      ? ActionSet.DEFAULT_HANMEN
      : this.category === 'main'
        ? ActionSet.DEFAULT_MAIN
        : ActionSet.DEFAULT_JINGYUAN;

    this.actionSet = new ActionSet(def.actions || {}, {
      frameRoot: this.frameRoot,
      defaultFallback: fallback,
    });

    // 默认物品（Phase 2 真实接入 Inventory）
    this.defaultItemDefs = def.defaultItems || [];

    // 任务日志（最简占位）
    this.questLog = def.questLog || { ...DEFAULT_QUEST_LOG };

    // 运行时 flag（会话级，不持久化）
    this.runtimeFlags = { ...(def.initialFlags || {}) };
  }

  canDoAction(actionKey) { return this.actionSet.has(actionKey); }
  listAvailableActions() { return this.actionSet.listKeys(); }
  getAction(key) { return this.actionSet.get(key); }
  getActionFramePaths(key) { return this.actionSet.getFramePaths(key); }

  /** Phase 2 接入 Inventory 后会真实计算；当前返回 baseStats 副本 */
  computeCombatStats() {
    return {
      hp: this.baseStats.maxHp,
      maxHp: this.baseStats.maxHp,
      martial: this.baseStats.martial,
      attack: this.baseStats.attack,
      defense: this.baseStats.defense,
      speed: this.baseStats.speed,
    };
  }

  toJSON() {
    return {
      id: this.id,
      baseStats: { ...this.baseStats },
      actionSet: this.actionSet.toJSON(),
      defaultItemDefs: [...this.defaultItemDefs],
      portraitPath: this.portraitPath,
      collision: { ...this.collision },
      render: { ...this.render },
      questLog: { ...this.questLog },
      flags: { ...this.runtimeFlags },
    };
  }
}

export default Character;
