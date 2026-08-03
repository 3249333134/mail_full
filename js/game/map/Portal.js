// 传送门数据结构（为将来"走到边缘自动切图"预留）
export class Portal {
  constructor(def) {
    this.toMapKey = def.toMapKey;
    this.triggerXRatio = def.triggerXRatio ?? null;
    this.triggerYRange = def.triggerYRange || [0, 1];
    this.label = def.label || null;
  }
  isTriggered(xRatio, yRatio) {
    if (this.triggerXRatio != null && Math.abs(xRatio - this.triggerXRatio) > 0.02) return false;
    const [yMin, yMax] = this.triggerYRange;
    return yRatio >= yMin && yRatio <= yMax;
  }
  toJSON() { return { ...this }; }
}
export default Portal;
