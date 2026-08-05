/* ============================================================
 * 万物送信 · 旅程事件引擎 — journey-engine.js
 * 信寄出后生成一条随机事件链：传递/代际/环境/奇遇 → 送达
 * 送达时生成「旅程志」（信物传记）
 * ============================================================ */

const JourneyEngine = {

  // ---------- 工具 ----------

  _pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; },
  _rand(min, max) { return min + Math.random() * (max - min); },
  _hit(rate) { return Math.random() < rate; },

  _speciesName(carrierId) {
    const map = {
      ant: '工蚁', 'homing-pigeon': '信鸽', 'migratory-bird': '候鸟',
      'migratory-fish': '洄游鱼', 'stray-cat': '流浪猫', firefly: '萤火虫',
      spider: '蜘蛛', river: '河流', wind: '风', 'drift-bottle': '漂流瓶',
      'time-capsule': '时间胶囊', 'portal-sprite': '传送门精灵',
      'stellar-courier': '星际信使', 'dream-walker': '梦境使者',
      'ghost-postman': '幽灵邮差', 'paper-crane': '纸鹤', 'rewind-courier': '时光回溯信使',
      sparrow: '麻雀', lizard: '蜥蜴', fish: '鱼', hawk: '鹰', cat: '野猫',
      frog: '青蛙', wasp: '黄蜂', seal: '海豹', human: '路人', 'black-hole': '黑洞',
      rain: '雨', fire: '火', '老渔夫': '老渔夫'
    };
    return map[carrierId] || carrierId;
  },

  _nextName(carrier, generation) {
    if (!carrier.lineageNaming) return carrier.lineageNamingBase || carrier.name;
    const { base, pattern } = carrier.lineageNaming;
    return pattern.replace('{base}', base).replace('{N}', String(generation));
  },

  // ---------- 模糊时间 ----------

  fuzzyTime(carrier, complexity = 3) {
    const pools = {
      real: ['春暖花开时', '某个雨夜', '待候鸟南归', '数载之后', '秋风乍起时', '第一场雪落前'],
      scifi: ['星辰对齐之夜', '下一个月圆', '时间的褶皱处', '梦境将醒未醒时', '宇宙微波背景辐射之中'],
      dilated: ['蚂蚁的一生，或许多生', '河水从源头到入海', '等一盏灯灭，再等它亮'],
      compressed: ['仿佛一瞬，又像永恒', '光年之外的回音']
    };
    if (carrier.id === 'time-capsule') return this._pick(['你设定的那个时刻', '约定之日', '多年以后']);;
    if (carrier.id === 'dream-walker') return '今夜入梦时';
    if (carrier.id === 'rewind-courier') return '在一切发生之前';
    const sensePool = pools[carrier.timeSense] || pools[carrier.category] || pools.real;
    return this._pick(sensePool);
  },

  // ---------- 事件模板 ----------

  _templates: {
    transfer: [
      '{carrier}在{hazard}被{predator}盯上，{predator}叼起信继续赶路',
      '一阵扑棱声——{predator}将信从{carrier}背上夺走',
      '{carrier}躲闪不及，信落进{water}里，被{predator}衔起',
    ],
    lineage: [
      '{carrier}把一生走完，将信交给{next}，嘱咐它继续',
      '{next}从{carrier}背上接过信，踏上{carrier}未走完的路',
      '暮色里，{carrier}与{next}完成了交接，信换了一双脚',
    ],
    environment: [
      '突降暴雨，信被淋得洇开了一片字迹，路径也偏了半里',
      '大风把信吹进一条岔路，多绕了一个山坳',
      '大雾弥漫，{carrier}停了三日，等雾散才敢动身',
      '洪水漫过浅滩，{carrier}顺水漂了一段，反而快了',
      '大雪封路，{carrier}蜷进洞里，旅程暂停了整整一冬',
    ],
    encounter: [
      '一个旅人捡起信端详片刻，又轻轻放回原处',
      '{carrier}搭了一段顺风车，路程省下了好些时日',
      '好心的婆婆把信收进怀里暖了一夜，次日放行',
      '遇到另一只{carrier}，它们并肩走了一程，又各自散去',
    ],
    serendipity: [
      '信被一个孩童捡去折了纸船，玩够了又被放回路上',
      '一位收藏家把信夹进旧书，多年后书流入旧货市场，信被人买下转寄',
      '风卷起信，直直吹进了收信人家的院子，落在窗台上',
      '信被鱼吞下，鱼晒成鱼干，剖开鱼腹时信重见天日',
      '信被埋进土里，多年后施工挖出，邮戳上的字迹还认得',
      '{carrier}临终前，将信托付给路过的{stranger}',
    ],
    delivery: [
      '历经千山万水，信终于递到了收信人手上',
      '收信人在门口捡起一封信，信封上的字迹已经有些模糊',
      '信被塞进门缝，收信人拆开时，还带着旅途的温度',
      '{carrier}在收信人窗前停下，轻轻放下信，转身离去',
    ],
  },

  _fillTemplate(tpl, ctx) {
    let s = tpl;
    for (const [k, v] of Object.entries(ctx)) {
      s = s.split('{' + k + '}').join(String(v ?? ''));
    }
    return s;
  },

  // ---------- 主流程 ----------

  /**
   * 寄出：初始化旅程
   * opts.mode: 'instant'（默认，立即模拟完整旅程并送达）| 'transit'（在途，随时间惰性推进）
   * opts.deliverAt: 可选送达时间戳（ms），transit 模式映射 timeScale
   */
  startJourney(letter, carrierId, opts = {}) {
    const roster = window.CARRIER_ROSTER || CARRIER_ROSTER;
    const carrier = (roster.byId ? roster.byId(carrierId) : null) || (roster.random ? roster.random() : roster[0]);
    const now = Date.now();
    const mode = opts.mode === 'transit' ? 'transit' : 'instant';
    const journey = {
      carrierId: carrier.id,
      mode,
      deliverAt: opts.deliverAt && opts.deliverAt > now ? opts.deliverAt : null,
      status: 'in-transit',
      expectedDelivery: this.fuzzyTime(carrier),
      startTime: now,
      deliverTime: null,
      events: [],
      plannedEvents: [],
      eventCursor: 0,
      totalTime: 0,
      timeScale: 0,
      carrierChain: [],
      path: [],
      letterState: { wear: 0, wet: 0, burn: 0, bite: 0, stain: 0, fold: 0, footprint: 0 },
    };

    // 生成完整计划链（含启程与送达），time 统一为旅程单位（从 0 起）
    this._simulateJourney(journey, carrier, opts);
    journey.totalTime = journey.plannedEvents.length
      ? journey.plannedEvents[journey.plannedEvents.length - 1].time
      : 0;

    if (mode === 'instant') {
      // 即时送达：全部揭示 + 旅程志（保持旧行为）
      journey.events = journey.plannedEvents.slice();
      journey.eventCursor = journey.plannedEvents.length;
      journey.status = 'delivered';
      journey.deliverTime = now;
      journey.report = this.buildReport(journey, carrier);
      return journey;
    }

    // 在途模式：仅揭示启程事件，其余随时间推进
    journey.timeScale = journey.deliverAt
      ? journey.totalTime / Math.max(1, (journey.deliverAt - now) / 1000)
      : journey.totalTime / this._defaultSeconds(carrier);
    journey.events = journey.plannedEvents.slice(0, 1);
    journey.eventCursor = 1;
    this._applyStateChange(journey.letterState, journey.plannedEvents[0] ? (journey.plannedEvents[0].effects || {}).stateChange : null);
    return journey;
  },

  /** 默认旅程耗时（真实秒）：按信使速度反推，20~300 秒 */
  _defaultSeconds(carrier) {
    return Math.max(20, Math.min(300, Math.round(120 * (1 - (carrier.baseSpeed || 0.5) * 0.7))));
  },

  /**
   * 惰性推进：按真实经过时间揭示已发生事件（纯函数，可重算）
   * 返回 { changed, delivered }
   */
  tick(letter, now = Date.now()) {
    const j = letter && letter.journey;
    if (!j || j.status !== 'in-transit' || !Array.isArray(j.plannedEvents) || !j.plannedEvents.length) {
      return { changed: false, delivered: false };
    }
    const elapsed = (now - (j.startTime || now)) / 1000 * (j.timeScale || 1);
    let changed = false;
    while (j.eventCursor < j.plannedEvents.length &&
           (j.plannedEvents[j.eventCursor].time || 0) <= elapsed) {
      const evt = j.plannedEvents[j.eventCursor];
      j.events.push(evt);
      this._applyStateChange(j.letterState, (evt.effects || {}).stateChange);
      j.eventCursor++;
      changed = true;
    }
    if (j.eventCursor >= j.plannedEvents.length) {
      j.status = 'delivered';
      j.deliverTime = now;
      const roster = window.CARRIER_ROSTER || CARRIER_ROSTER;
      const carrier = roster.byId ? roster.byId(j.carrierId) : null;
      j.report = this.buildReport(j, carrier || roster[0]);
      return { changed: true, delivered: true };
    }
    return { changed, delivered: false };
  },

  /** 加速：直接揭示全部事件并送达 */
  accelerate(letter, now = Date.now()) {
    const j = letter && letter.journey;
    if (!j || j.status !== 'in-transit' || !Array.isArray(j.plannedEvents)) return { delivered: false };
    for (; j.eventCursor < j.plannedEvents.length; j.eventCursor++) {
      const evt = j.plannedEvents[j.eventCursor];
      j.events.push(evt);
      this._applyStateChange(j.letterState, (evt.effects || {}).stateChange);
    }
    j.status = 'delivered';
    j.deliverTime = now;
    const roster = window.CARRIER_ROSTER || CARRIER_ROSTER;
    const carrier = roster.byId ? roster.byId(j.carrierId) : null;
    j.report = this.buildReport(j, carrier || roster[0]);
    return { delivered: true };
  },

  /** 剩余时间估算 → "约 X 分钟后送达" 文案 */
  estimate(letter, now = Date.now()) {
    const j = letter && letter.journey;
    if (!j || j.status === 'delivered') return '已送达';
    const elapsed = (now - (j.startTime || now)) / 1000 * (j.timeScale || 1);
    const remainUnits = Math.max(0, (j.totalTime || 0) - elapsed);
    const remainSecs = remainUnits / (j.timeScale || 1);
    if (remainSecs <= 0) return '即将送达';
    if (remainSecs < 60) return `约 ${Math.max(1, Math.round(remainSecs))} 秒后送达`;
    if (remainSecs < 3600) return `约 ${Math.max(1, Math.round(remainSecs / 60))} 分钟后送达`;
    return `约 ${Math.max(1, Math.round(remainSecs / 3600))} 小时后送达`;
  },

  /** 状态累积（信物状态） */
  _applyStateChange(letterState, stateChange) {
    if (!letterState || !stateChange) return;
    for (const [k, v] of Object.entries(stateChange)) {
      letterState[k] = Math.min(1, (letterState[k] || 0) + (v || 0));
    }
  },

  _firstCarrierName(carrier) {
    if (carrier.lineageNaming) {
      return carrier.lineageNaming.pattern.replace('{base}', carrier.lineageNaming.base).replace('{N}', '1').replace('的1世', '');
    }
    return carrier.name;
  },

  /** 模拟旅程：按载体属性概率生成完整事件链（写入 plannedEvents，含启程与送达） */
  _simulateJourney(journey, initialCarrier, opts) {
    let carrier = initialCarrier;
    let generation = 1;
    let t = 0;
    const roster = window.CARRIER_ROSTER || CARRIER_ROSTER;
    const predatorMap = { sparrow: '麻雀', lizard: '蜥蜴', fish: '鱼', hawk: '鹰', cat: '野猫', frog: '青蛙', wasp: '黄蜂', seal: '海豹', human: '路人', 'black-hole': '黑洞', rain: '骤雨', fire: '野火' };
    const hazardMap = { land: '草丛', sky: '云端', water: '水畔', underground: '洞道', space: '星海', dream: '梦境', time: '时间深处' };

    // 启程事件（旅程单位 time=0）
    journey.carrierChain.push({ name: this._firstCarrierName(carrier), species: this._speciesName(carrier.id), generation: 1, role: '启程' });
    journey.plannedEvents.push({
      id: 'evt-depart', type: 'departure', time: 0, location: { x: 0, y: 0 },
      actor: journey.carrierChain[0],
      description: `${journey.carrierChain[0].name}衔起这封信，踏上了旅程。`
    });

    // 特殊信使：直达式旅程
    if (carrier.id === 'time-capsule') {
      t += 3;
      journey.plannedEvents.push(this._evt('environment', t, { carrier: carrier.name }, '信被埋入时间的土壤，静静等待约定的时刻。', { bur: 0, wear: 0 }));
      t += 5;
      journey.plannedEvents.push(this._evt('serendipity', t, { carrier: carrier.name }, '岁月流转，有人挖出了这枚时间胶囊，轻轻拆开。', { wear: 0.25 }));
      t += 1;
      journey.plannedEvents.push(this._evt('delivery', t, { carrier: carrier.name }, this._fillTemplate(this._pick(this._templates.delivery), { carrier: carrier.name }), {}));
      return;
    }
    if (carrier.id === 'dream-walker') {
      t += 1;
      journey.plannedEvents.push(this._evt('encounter', t, { carrier: carrier.name }, '梦境使者穿过层层睡梦，找到了收信人的影子。', {}));
      t += 1;
      journey.plannedEvents.push(this._evt('delivery', t, { carrier: carrier.name }, '黎明前，信轻轻落在收信人枕边——醒来时，梦境与信都在。', {}));
      return;
    }
    if (carrier.id === 'rewind-courier') {
      t += 1;
      journey.plannedEvents.push(this._evt('serendipity', t, { carrier: carrier.name }, '时光倒流，这封信在寄出之前就已经送达。收信人记得自己读过它。', { fold: 0.3 }));
      journey.plannedEvents.push(this._evt('delivery', t, { carrier: carrier.name }, '因果倒置的送达：收信人先收到，寄信人才写下。', {}));
      return;
    }

    // 通用旅程：10~18 个事件
    const eventCount = Math.floor(this._rand(10, 18));
    let speciesCount = new Set([carrier.id]);
    let transfers = 0;
    let lineages = 0;

    for (let i = 0; i < eventCount && transfers + lineages < 8; i++) {
      t += Math.floor(this._rand(1, 6));

      // 1) 捕食传递（新载体接手）
      if (carrier.predationRate > 0 && this._hit(carrier.predationRate) && carrier.predators && carrier.predators.length) {
        const predatorId = this._pick(carrier.predators);
        const predatorName = predatorMap[predatorId] || this._speciesName(predatorId);
        const oldName = this._currentCarrierName(carrier, generation);
        const hazard = this._pick(Object.values(hazardMap));
        journey.plannedEvents.push(this._evt('transfer', t, { carrier: oldName, predator: predatorName, hazard },
          this._fillTemplate(this._pick(this._templates.transfer), { carrier: oldName, predator: predatorName, hazard, water: hazard }), { bite: this._rand(0.1, 0.4) }));
        // 切换载体
        const nextCarrier = roster.byId(predatorId) || carrier;
        carrier = nextCarrier;
        generation = 1;
        speciesCount.add(predatorId);
        transfers++;
        journey.carrierChain.push({ name: predatorName, species: this._speciesName(predatorId), generation: 1, role: '捕食传递' });
        // 如果捕食者是"人"，直接送达
        if (predatorId === 'human') {
          t += 1;
          journey.plannedEvents.push(this._evt('delivery', t, { carrier: predatorName }, '这位路人恰好认识收信人，把信径直送到了门前。', {}));
          journey.carrierChain.push({ name: '收信人', species: '人', role: '收信' });
          return;
        }
        continue;
      }

      // 2) 代际更迭
      if (carrier.lineageNaming && this._hit(carrier.reproductionRate)) {
        generation++;
        const nextName = this._nextName(carrier, generation);
        const curName = this._currentCarrierName(carrier, generation - 1);
        journey.plannedEvents.push(this._evt('lineage', t, { carrier: curName, next: nextName },
          this._fillTemplate(this._pick(this._templates.lineage), { carrier: curName, next: nextName }), { wear: this._rand(0.05, 0.15) }));
        journey.carrierChain.push({ name: nextName, species: this._speciesName(carrier.id), generation, role: '代际传承' });
        lineages++;
        continue;
      }

      // 3) 环境事件
      if (this._hit(0.35)) {
        const tpl = this._pick(this._templates.environment);
        const curName = this._currentCarrierName(carrier, generation);
        journey.plannedEvents.push(this._evt('environment', t, { carrier: curName },
          this._fillTemplate(tpl, { carrier: curName }), this._envStateChange(tpl)));
        continue;
      }

      // 4) 相遇 / 奇遇事件
      const curName = this._currentCarrierName(carrier, generation);
      if (this._hit(0.3)) {
        const tpl = this._pick(this._templates.encounter);
        journey.plannedEvents.push(this._evt('encounter', t, { carrier: curName },
          this._fillTemplate(tpl, { carrier: curName }), { fold: this._rand(0, 0.2) }));
      } else if (this._hit(0.25)) {
        const tpl = this._pick(this._templates.serendipity);
        const stranger = this._pick(['一只蜗牛', '一条蛇', '一只刺猬', '一个货郎', '一只野兔', '一位僧人']);
        journey.plannedEvents.push(this._evt('serendipity', t, { carrier: curName, stranger },
          this._fillTemplate(tpl, { carrier: curName, stranger }), this._envStateChange(tpl)));
      }
    }

    // 收尾：送达
    const finalName = this._currentCarrierName(carrier, generation);
    journey.plannedEvents.push(this._evt('delivery', t + 1, { carrier: finalName },
      this._fillTemplate(this._pick(this._templates.delivery), { carrier: finalName }), {}));
    journey.carrierChain.push({ name: '收信人', species: '人', role: '收信' });
  },

  _currentCarrierName(carrier, generation) {
    if (carrier.lineageNaming) return this._nextName(carrier, generation);
    return carrier.name;
  },

  _envStateChange(tpl) {
    const st = {};
    if (tpl.includes('雨')) st.wet = this._rand(0.3, 0.7);
    if (tpl.includes('火')) st.burn = this._rand(0.2, 0.5);
    if (tpl.includes('雪') || tpl.includes('雾')) st.wet = this._rand(0.1, 0.3);
    if (tpl.includes('土')) st.wear = this._rand(0.15, 0.4);
    if (tpl.includes('鱼')) st.wet = this._rand(0.4, 0.8);
    if (tpl.includes('埋')) st.wear = this._rand(0.2, 0.45);
    if (Math.random() < 0.3) st.fold = this._rand(0.1, 0.3);
    if (Math.random() < 0.2) st.footprint = this._rand(0.1, 0.4);
    return st;
  },

  _evt(type, time, actor, description, stateChange) {
    const location = { x: Math.floor(this._rand(0, 100)), y: Math.floor(this._rand(0, 100)) };
    const evt = {
      id: 'evt-' + type + '-' + time + '-' + Math.random().toString(36).slice(2, 6),
      type, time, location, actor: { ...actor },
      description,
      effects: { stateChange: stateChange || {} }
    };
    return evt;
  },

  // ---------- 旅程志 ----------

  buildReport(journey, initialCarrier) {
    const roster = window.CARRIER_ROSTER || CARRIER_ROSTER;
    const carrier = roster.byId(journey.carrierId) || initialCarrier || roster[0];
    const events = journey.events || [];
    const chain = journey.carrierChain || [];

    // 状态累积
    const letterState = { wear: 0, wet: 0, burn: 0, bite: 0, stain: 0, fold: 0, footprint: 0 };
    for (const evt of events) {
      const stateChange = (evt.effects || {}).stateChange || {};
      for (const [k, v] of Object.entries(stateChange)) {
        letterState[k] = Math.min(1, (letterState[k] || 0) + v);
      }
    }
    journey.letterState = letterState;

    const speciesCount = new Set(chain.map(c => c.species)).size;
    const generations = Math.max(1, chain.filter(c => c.role === '代际传承').length + 1);
    const eventCount = events.length;
    const durationFuzzy = carrier.id === 'dream-walker' ? '一夜'
      : carrier.id === 'rewind-courier' ? '在过去'
      : carrier.timeSense === 'dilated' ? `${Math.floor(2 + eventCount * 1.5)}年${Math.floor(Math.random() * 11)}个月`
      : `${Math.floor(2 + eventCount * 0.5)}天`;
    const distance = `${Math.floor(eventCount * this._rand(7, 30))} 公里`;

    // 结语
    const speciesList = [...new Set(chain.map(c => c.species))].filter(s => s && s !== '人');
    const firstSpecies = speciesList[0] || carrier.name;

    const report = {
      carrierId: carrier.id,
      carrierName: carrier.name,
      carrierEmoji: carrier.emoji || '',
      deliveryChain: chain,
      eventTimeline: events,
      letterState,
      stats: {
        duration: durationFuzzy,
        generations,
        speciesCount,
        distance,
        eventCount,
        carrierId: carrier.id
      },
      epilogue: chain.length > 2
        ? `这封信历经${generations}代${firstSpecies}的毕生，辗转${speciesCount}种载体，走了${distance}，最终抵达收信人手中。`
        : `${carrier.name}背着这封信出发，走了${distance}，最终抵达收信人手中。`
    };
    return report;
  },

  /** 收信页面：信物状态叠加层 CSS（数值 0~1 → CSS 变量） */
  stateToCss(letterState) {
    const s = letterState || {};
    return {
      '--st-wear': (s.wear || 0).toFixed(2),
      '--st-wet': (s.wet || 0).toFixed(2),
      '--st-burn': (s.burn || 0).toFixed(2),
      '--st-bite': (s.bite || 0).toFixed(2),
      '--st-stain': (s.stain || 0).toFixed(2),
      '--st-fold': (s.fold || 0).toFixed(2),
      '--st-footprint': (s.footprint || 0).toFixed(2)
    };
  }
};

window.JourneyEngine = JourneyEngine;
