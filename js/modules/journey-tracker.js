/* ============================================================
 * 万物送信 · 旅程追踪 — journey-tracker.js
 * 在途信件 → 世界坐标路径 / 当前信使位置 / 事件点
 * 供游戏地图标记（gameMapRenderer）与抽屉 HTML 路线图共用
 * ============================================================ */

const JourneyTracker = {
  letters: [],       // 在途信件（含 journey）
  worldSize: { w: 1000, h: 500 },
  start: { x: 200, y: 300 },
  end: { x: 800, y: 150 },
  _lastRefreshAt: 0,

  /** 初始化：收集在途信件 + 设置地图范围 */
  init(letters = [], opts = {}) {
    this.letters = (letters || []).filter(l => l && l.journey && l.journey.status === 'in-transit' && Array.isArray(l.journey.plannedEvents));
    if (opts.worldSize) this.worldSize = opts.worldSize;
    if (opts.start) this.start = opts.start;
    if (opts.end) this.end = opts.end;
    return this;
  },

  /** 刷新在途信件（从 MailboxManager 全量收集） */
  refresh(mailboxId = null) {
    const collected = [];
    try {
      const mailboxes = MailboxManager.getMailboxes ? MailboxManager.getMailboxes() : [];
      const targets = mailboxId ? mailboxes.filter(m => m.id === mailboxId) : mailboxes;
      for (const mb of targets) {
        const letters = MailboxManager.loadMailboxLetters ? (MailboxManager.loadMailboxLetters(mb.id) || []) : [];
        for (const l of letters) {
          if (l && l.journey && l.journey.status === 'in-transit') {
            if (window.JourneyEngine) window.JourneyEngine.tick(l, Date.now());
            if (l.journey.status === 'in-transit') collected.push(l);
          }
        }
      }
    } catch (_) {}
    this.letters = collected;
    return this.letters;
  },

  /** 事件点世界坐标（0-100 抽象路径 → 世界 px，Lissajous 扰动防重叠） */
  _eventPositions(letter) {
    const events = letter.journey.plannedEvents || [];
    const n = Math.max(1, events.length);
    const pts = [];
    for (let i = 0; i < n; i++) {
      const t = n === 1 ? 0 : i / (n - 1);
      const wobbleX = Math.sin(i * 2.399 + letter.journey.carrierId.length) * 46;
      const wobbleY = Math.cos(i * 1.617 + (letter.journey.carrierId || '').charCodeAt(0) || 7) * 34;
      pts.push({
        x: this.start.x + (this.end.x - this.start.x) * t + wobbleX,
        y: this.start.y + (this.end.y - this.start.y) * t + wobbleY
      });
    }
    return pts;
  },

  /** 当前信使位置：最后一个已发生事件处（按时间插值） */
  currentPos(letter, now = Date.now()) {
    const j = letter.journey;
    const pts = this._eventPositions(letter);
    const done = Math.max(1, j.events ? j.events.length : 1);
    const idx = Math.min(pts.length - 1, done - 1);
    const p = pts[idx];
    // 在相邻事件间按 elapsed 比例插值，让信使"走"起来
    if (j.timeScale && idx < pts.length - 1) {
      const elapsed = (now - (j.startTime || now)) / 1000 * (j.timeScale || 1);
      const curTime = j.plannedEvents[idx] ? (j.plannedEvents[idx].time || 0) : 0;
      const nextTime = j.plannedEvents[idx + 1] ? (j.plannedEvents[idx + 1].time || 0) : curTime + 1;
      const seg = nextTime > curTime ? Math.min(1, Math.max(0, (elapsed - curTime) / (nextTime - curTime))) : 0;
      return {
        x: p.x + (pts[idx + 1].x - p.x) * seg,
        y: p.y + (pts[idx + 1].y - p.y) * seg,
        seg
      };
    }
    return { x: p.x, y: p.y, seg: 0 };
  },

  /** 已走轨迹点（前 done 个事件） */
  trailPoints(letter) {
    const pts = this._eventPositions(letter);
    const done = Math.max(1, letter.journey.events ? letter.journey.events.length : 1);
    return pts.slice(0, Math.min(pts.length, done));
  },

  /** 信使 emoji */
  carrierEmoji(letter) {
    const carrier = (window.CARRIER_ROSTER || []).find(c => c.id === letter.journey.carrierId);
    return carrier ? carrier.emoji : '✉';
  },

  /** 抽屉小地图（canvas 46px 高）：虚线轨迹 + emoji + 事件点 */
  renderMiniMap(canvas, letter) {
    if (!canvas || !letter || !letter.journey) return;
    const dpr = window.devicePixelRatio || 1;
    const W = canvas.clientWidth || 260;
    const H = canvas.clientHeight || 46;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, W, H);

    const pts = this._eventPositions(letter);
    const done = Math.max(1, letter.journey.events ? letter.journey.events.length : 1);
    const map = (p) => ({ x: 6 + (p.x / (this.worldSize.w || 1000)) * (W - 12), y: H / 2 + (p.y - (this.worldSize.h || 500) / 2) / (this.worldSize.h || 500) * (H - 14) });

    // 虚线轨迹（已走）
    const trail = pts.slice(0, Math.min(pts.length, done));
    ctx.beginPath();
    trail.forEach((p, i) => {
      const m = map(p);
      if (i === 0) ctx.moveTo(m.x, m.y); else ctx.lineTo(m.x, m.y);
    });
    ctx.strokeStyle = 'rgba(176,149,106,0.55)';
    ctx.lineWidth = 1.4;
    ctx.setLineDash([4, 3]);
    ctx.stroke();
    ctx.setLineDash([]);

    // 事件点
    pts.forEach((p, i) => {
      const m = map(p);
      ctx.beginPath();
      ctx.arc(m.x, m.y, i < done ? 2.6 : 2, 0, Math.PI * 2);
      ctx.fillStyle = i < done ? '#8a6d3b' : 'rgba(138,109,59,0.35)';
      ctx.fill();
    });

    // 当前信使 emoji
    const cur = this.currentPos(letter);
    const mc = map(cur);
    ctx.font = '20px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.carrierEmoji(letter), mc.x, mc.y - 6);
  },

  /** 在途总览地图（一张图看所有在途信件）：轨迹 + 事件点 + 信使 emoji + 起终点 */
  renderOverview(canvas, letters) {
    if (!canvas || !Array.isArray(letters) || !letters.length) return;
    const dpr = window.devicePixelRatio || 1;
    const W = canvas.clientWidth || 320;
    const H = canvas.clientHeight || 210;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, W, H);

    // 纸张底 + 网格（简约地图感）
    ctx.fillStyle = '#f8f3e7';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(138,109,59,0.12)';
    ctx.lineWidth = 1;
    for (let gx = 0; gx <= W; gx += 28) {
      ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke();
    }
    for (let gy = 0; gy <= H; gy += 28) {
      ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke();
    }

    const map = (p) => ({
      x: 16 + (p.x / (this.worldSize.w || 1000)) * (W - 32),
      y: 12 + (p.y / (this.worldSize.h || 500)) * (H - 24)
    });
    const palette = ['#8a6d3b', '#3f6b45', '#4a6fa5', '#b0473e', '#7a4a8f', '#b8860b', '#2e7d8a', '#9c5b1f'];

    // 起点 / 终点
    const s = map(this.start);
    const e = map(this.end);
    ctx.font = '11px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#8a6d3b';
    ctx.beginPath(); ctx.arc(s.x, s.y, 5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(e.x, e.y, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillText('始', s.x, s.y);
    ctx.fillText('终', e.x, e.y);

    // 各在途信件：轨迹 + 事件点 + 当前信使
    letters.forEach((l, idx) => {
      if (!l || !l.journey) return;
      const color = palette[idx % palette.length];
      const pts = this._eventPositions(l);
      const done = Math.max(1, l.journey.events ? l.journey.events.length : 1);
      const mapped = pts.map(map);

      // 已走轨迹（实线）
      const trail = mapped.slice(0, Math.min(mapped.length, done));
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.6;
      ctx.setLineDash([]);
      ctx.beginPath();
      trail.forEach((m, i) => { if (i === 0) ctx.moveTo(m.x, m.y); else ctx.lineTo(m.x, m.y); });
      ctx.stroke();
      // 未走轨迹（虚线）
      if (done < mapped.length) {
        const rest = mapped.slice(done - 1);
        ctx.strokeStyle = color;
        ctx.globalAlpha = 0.35;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        rest.forEach((m, i) => { if (i === 0) ctx.moveTo(m.x, m.y); else ctx.lineTo(m.x, m.y); });
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;
      }

      // 事件点
      mapped.forEach((m, i) => {
        ctx.beginPath();
        ctx.arc(m.x, m.y, i < done ? 3 : 2.2, 0, Math.PI * 2);
        ctx.fillStyle = i < done ? color : 'rgba(138,109,59,0.3)';
        ctx.fill();
      });

      // 当前信使 emoji（大号 + 序号徽标）
      const cur = this.currentPos(l);
      const mc = map(cur);
      ctx.font = '22px serif';
      ctx.fillText(this.carrierEmoji(l), mc.x, mc.y - 10);
      ctx.font = 'bold 10px serif';
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(mc.x + 10, mc.y - 16, 7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = color;
      ctx.fillText(String(idx + 1), mc.x + 10, mc.y - 16);
    });
  },

  /** 总览地图命中检测：返回距点击点最近的在途信件（≤34px） */
  hitTestOverview(canvas, letters, x, y) {
    const W = canvas.clientWidth || 320;
    const H = canvas.clientHeight || 210;
    const map = (p) => ({
      x: 16 + (p.x / (this.worldSize.w || 1000)) * (W - 32),
      y: 12 + (p.y / (this.worldSize.h || 500)) * (H - 24)
    });
    let best = null;
    let bestD = 36;
    (letters || []).forEach(l => {
      if (!l || !l.journey) return;
      const cur = this.currentPos(l);
      const m = map(cur);
      const d = Math.hypot(m.x - x, m.y - y);
      if (d < bestD) { bestD = d; best = l; }
    });
    return best;
  }
};

window.JourneyTracker = JourneyTracker;
