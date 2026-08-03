// Quest 实例 + 状态机
import { QuestObjective } from './QuestObjective.js';

export const QuestState = {
  UNACCEPTED: 'UNACCEPTED',
  IN_PROGRESS: 'IN_PROGRESS',
  READY_TO_CLAIM: 'READY_TO_CLAIM',
  CLAIMED: 'CLAIMED',
};

export class Quest {
  constructor(def, state = null) {
    this.id = def.id;
    this.title = def.title || def.id;
    this.description = def.description || '';
    this.npc = def.npc || null;
    this.prerequisiteIds = def.prerequisites || [];
    this.objectives = (def.objectives || []).map(o => new QuestObjective(o));
    this.rewards = def.rewards || { items: [], exp: 0, gold: 0 };
    this.state = state || QuestState.UNACCEPTED;
  }
  onEvent(evt) {
    if (this.state !== QuestState.IN_PROGRESS) return;
    this.objectives.forEach(o => o.onEvent(evt));
    if (this.objectives.every(o => o.isComplete())) this.state = QuestState.READY_TO_CLAIM;
  }
  accept() { if (this.state === QuestState.UNACCEPTED) this.state = QuestState.IN_PROGRESS; return this.state; }
  claim(inventory) {
    if (this.state !== QuestState.READY_TO_CLAIM) return { ok: false, reason: 'not_ready' };
    (this.rewards.items || []).forEach(({ defId, qty }) => {
      try { inventory.add?.(defId, qty); } catch (_) {}
    });
    this.state = QuestState.CLAIMED;
    return { ok: true, rewards: this.rewards };
  }
  getProgress() { return this.objectives.map(o => ({ key: o.key, type: o.type, current: o.progress, target: o.target })); }
  toJSON() { return { id: this.id, state: this.state, objectives: this.objectives.map(o => o.toJSON()) }; }
}

export default Quest;
