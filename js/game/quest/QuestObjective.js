// 单个任务目标（Phase 0：最小实现，Phase 6 接入）
export class QuestObjective {
  constructor(def) {
    this.key = def.key || def.type || 'generic';
    this.type = def.type || 'collect_item';
    this.target = def.target || 1;
    this.progress = def.progress || 0;
    this.meta = def.meta || {}; // {defId?, mapKey?, actionType?}
  }
  isComplete() { return this.progress >= this.target; }
  onEvent(evt) {
    if (this.isComplete()) return;
    // 匹配规则（最简）
    let matches = false;
    switch (this.type) {
      case 'action:etiquette': matches = evt.type === 'action:etiquette'; break;
      case 'action:martial':   matches = evt.type === 'action:martial'; break;
      case 'action:signature': matches = evt.type === 'action:signature'; break;
      case 'pickup_item':
        matches = evt.type === 'pickup_item' && (!this.meta.defId || this.meta.defId === evt.defId);
        break;
      case 'letter_sent': matches = evt.type === 'letter_sent'; break;
      default: break;
    }
    if (matches) this.progress = Math.min(this.target, this.progress + 1);
  }
  toJSON() { return { key: this.key, type: this.type, target: this.target, progress: this.progress, meta: this.meta }; }
}
export default QuestObjective;
