export class LetterAttachment {
  constructor(raw = {}) {
    this.instanceId = String(raw.instanceId || '');
    this.definitionId = String(raw.definitionId || raw.defId || '');
    this.name = String(raw.name || this.definitionId);
    this.icon = String(raw.icon || '');
    this.description = String(raw.description || '');
    this.originLabel = String(raw.originLabel || '既有物品');
    this.acquisitionLabel = String(raw.acquisitionLabel || '');
    this.status = raw.status || 'escrow';
  }
  toJSON() { return { ...this }; }
}

export default LetterAttachment;
