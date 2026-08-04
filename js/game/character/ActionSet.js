// 动作集合类（每个人物的动作集独立，帧/时长/音效/事件 hook 均可定制）
// Phase 0：最简实现，只注册/查询；Phase 1 接入 Character

export class ActionSet {
  constructor(actions = {}, opts = {}) {
    this._actions = new Map();
    this._frameRoot = opts.frameRoot || '';
    this._fallback = opts.defaultFallback || null;
    Object.entries(actions).forEach(([key, cfg]) => this._register(key, cfg));
  }

  _register(key, cfg) {
    const explicitFrames = Array.isArray(cfg.frames) ? cfg.frames.filter(Boolean) : null;
    this._actions.set(key, {
      key,
      frameDir: cfg.frameDir || key,
      frameCount: explicitFrames?.length || cfg.frameCount || 4,
      frameInterval: cfg.frameInterval || 200,
      loop: cfg.loop ?? true,
      soundEffect: cfg.soundEffect || null,
      onFrameEvents: cfg.onFrameEvents || {},
      frames: explicitFrames,
      ...cfg,
    });
  }

  has(key) { return this._actions.has(key) || (this._fallback && this._fallback.has(key)); }

  get(key) {
    const a = this._actions.get(key);
    if (a) return a;
    return this._fallback ? this._fallback.get(key) : null;
  }

  listKeys() { return Array.from(this._actions.keys()); }

  /** 返回某动作的完整帧路径数组（相对资源根）*/
  getFramePaths(key) {
    const act = this.get(key);
    if (!act) return [];
    if (Array.isArray(act.frames) && act.frames.length) {
      return act.frames.map(frame => /^https?:\/\//i.test(frame) || frame.startsWith('/')
        ? frame
        : `${this._frameRoot}/${act.frameDir}/${frame}`);
    }
    const paths = [];
    for (let i = 0; i < act.frameCount; i++) {
      const pad = String(i).padStart(2, '0');
      paths.push(`${this._frameRoot}/${act.frameDir}/${pad}.png`);
    }
    return paths;
  }

  toJSON() { return Object.fromEntries(this._actions.entries()); }
}

// ===== 默认动作模板（兜底，保证每个角色最少有 5 个标准动作）=====
ActionSet.DEFAULT_JINGYUAN = new ActionSet({
  personality: { frameCount: 4, frameInterval: 3000, loop: true },
  run:          { frameCount: 4, frameInterval: 105, loop: true },
  etiquette:    { frameCount: 4, frameInterval: 220, loop: false },
  martial:      { frameCount: 4, frameInterval: 110, loop: false },
  signature:    { frameCount: 4, frameInterval: 180, loop: false },
});

ActionSet.DEFAULT_HANMEN = new ActionSet({
  personality: { frameDir: 'idle', frameCount: 4, frameInterval: 240, loop: true },
  run:         { frameCount: 4, frameInterval: 105, loop: true },
  etiquette:   { frameCount: 4, frameInterval: 220, loop: false },
  martial:     { frameCount: 4, frameInterval: 110, loop: false },
  signature:   { frameCount: 4, frameInterval: 180, loop: false },
});

ActionSet.DEFAULT_MAIN = new ActionSet({
  personality: { frameDir: 'Idle', frameCount: 1, frameInterval: 200, loop: true },
  run:         { frameDir: 'Run',  frameCount: 1, frameInterval: 100, loop: true },
});

// 破晓角色兜底：单帧动作，标准 5 动作兼容
ActionSet.DEFAULT_POXIAO = new ActionSet({
  personality: { frameCount: 1, frameInterval: 3000, loop: true },
  run:         { frameCount: 1, frameInterval: 105,  loop: true },
  etiquette:   { frameCount: 1, frameInterval: 220,  loop: false },
  martial:     { frameCount: 1, frameInterval: 110,  loop: false },
  signature:   { frameCount: 1, frameInterval: 180,  loop: false },
});

export default ActionSet;
