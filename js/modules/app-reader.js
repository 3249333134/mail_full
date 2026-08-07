/* ========================================
   App - Reader View
   ======================================== */

Object.assign(App, {
  async renderReader(letterId, overrideLetter = null) {
    let letter = overrideLetter;
    const allMailboxes = MailboxManager.getMailboxes();
    for (const mb of allMailboxes) {
      if (letter) break;
      const letters = MailboxManager.loadMailboxLetters(mb.id);
      const found = letters.find(x => x.id === letterId);
      if (found) {
        letter = found;
        this.currentMailboxId = mb.id;
        break;
      }
    }

    if (!letter) {
      letter = await STORAGE.loadLetter(letterId);
    }

    if (!letter) {
      document.getElementById('reader-content').innerHTML = '<p class="hint">信件不存在</p>';
      return;
    }

    this.currentMailboxId = letter.mailboxId;
    // 万物送信：惰性推进在途旅程（纯函数重算，中间态不落库）
    let journeyTransitioned = false;
    if (letter.journey && window.JourneyEngine &&
        letter.journey.mode === 'transit' && letter.journey.status === 'in-transit') {
      const tickR = window.JourneyEngine.tick(letter, Date.now());
      if (tickR.delivered) journeyTransitioned = true;
    }
    const isShared = MailboxManager.isSharedMailbox(letter.mailboxId);
    // 优先使用 identity（含角色名），其次用 letter 上已保存的 sender/recipient，最后才是 author.username
    let senderName = letter.senderIdentity?.identityName || letter.sender || '';
    let recipientName = letter.recipientIdentity?.identityName || letter.recipient || '';

    if (!senderName && letter.author) {
      senderName = letter.author.displayName || letter.author.username || '';
    }

    if (isShared && letter.author) {
      document.getElementById('reader-title').textContent = `${senderName} 致 ${recipientName || '未知的人'}`;
    } else {
      document.getElementById('reader-title').textContent = `致 ${recipientName || '未知的人'}`;
    }

    const content = document.getElementById('reader-content');

    let pages = [];
    if (letter.pages && Array.isArray(letter.pages) && letter.pages.length > 0) {
      pages = letter.pages;
    } else {
      pages = [{
        id: 'page-1',
        paperStyle: letter.paperStyle || 'vintage-literary',
        elements: letter.content || []
      }];
    }

    let html = '';
    pages.forEach((page, pageIdx) => {
      const style = page.paperStyle || 'vintage-literary';
      html += `<div class="reader-paper paper-${style}">`;

      if (style === 'chinese-bamboo') {
        html += this._renderReaderBambooDecorations();
      }

      if (pageIdx === 0) {
        html += this.renderReaderHeader(letter, style);

        if (letter.bodyText && style === 'vintage-literary') {
          html += `<div class="vintage-body">`;
          const paragraphs = letter.bodyText.split('\n').filter(p => p.trim() !== '');
          
          let insertAfter = -1;
          if (letter.illustration && letter.illustration.position) {
            const match = letter.illustration.position.match(/after-(\d+)(st|nd|rd|th)/);
            if (match) {
              insertAfter = parseInt(match[1]) - 1;
            }
          }
          
          for (let i = 0; i < paragraphs.length; i++) {
            html += `<p>${paragraphs[i]}</p>`;
            
            if (i === insertAfter && letter.illustration) {
              html += `<div class="vintage-illustration">`;
              if (letter.illustration.svg) {
                html += letter.illustration.svg;
              } else if (letter.illustration.src) {
                html += `<img src="${letter.illustration.src}" alt="${letter.illustration.caption || ''}">`;
              }
              if (letter.illustration.caption) {
                html += `<div class="illustration-caption">${letter.illustration.caption}</div>`;
              }
              html += `</div>`;
            }
          }
          html += `</div>`;
        }
      }

      for (const elem of (page.elements || [])) {
        html += this.renderReaderElement(elem);
      }

      if (pageIdx === pages.length - 1) {
        html += this.renderReaderFooter(letter, style);
      }

      html += '</div>';
    });
    if (Array.isArray(letter.itemAttachments) && letter.itemAttachments.length) {
      html += this.renderReaderItemAttachments(letter.itemAttachments);
    }

    // 万物送信：在途进度 / 旅程志入口
    if (letter.journey) {
      const carrier = (window.CARRIER_ROSTER || []).find(c => c.id === letter.journey.carrierId);
      const j = letter.journey;
      const report = j.report || null;
      const st = j.letterState || {};
      const stateDesc = ['wear', 'wet', 'burn', 'bite', 'stain', 'fold', 'footprint']
        .filter(k => (st[k] || 0) > 0.2)
        .map(k => ({ wear: '边缘磨损', wet: '水渍洇开', burn: '焦痕', bite: '啃咬缺角', stain: '污渍', fold: '折痕', footprint: '脚印' }[k])).join('、');
      if (j.status === 'in-transit' && Array.isArray(j.plannedEvents) && j.plannedEvents.length) {
        // ===== 在途：进度面板 =====
        const estimate = window.JourneyEngine ? JourneyEngine.estimate(letter) : '';
        const total = j.plannedEvents.length;
        const done = Math.min(total, Math.max(1, j.events.length));
        const progress = Math.round((done / total) * 100);
        const revealedEvents = (j.events || []).map((evt, i) => `
          <div class="journey-progress-event">
            <span class="dot">◆</span>
            <span class="text">${this._escapeReaderHtml(evt.description || '')}</span>
          </div>`).join('');
        html += `
          <div class="journey-report-banner">
            <div class="journey-banner-head">
              <span class="journey-banner-emoji">${carrier?.emoji || '✉'}</span>
              <div class="journey-banner-info">
                <div class="journey-banner-title">${carrier?.name || '未知信使'}正在赶路…</div>
                <div class="journey-banner-sub">${estimate} · 预期${j.expectedDelivery || '未知'}</div>
              </div>
            </div>
            <div class="journey-progress-track">
              <div class="journey-progress-bar" style="width:${progress}%"></div>
            </div>
            <div class="journey-progress-caption">旅程进度 ${progress}% · 已发生 ${done} / ${total} 个事件</div>
            <div class="journey-progress-events">${revealedEvents}</div>
            <button id="accelerate-journey-btn" type="button" class="journey-accel-btn">⚡ 加速送达</button>
          </div>`;
      } else {
        // ===== 已送达：旅程志入口 =====
        html += `
          <div class="journey-report-banner delivered">
            <div class="journey-banner-head">
              <span class="journey-banner-emoji">${carrier?.emoji || '✉'}</span>
              <div class="journey-banner-info">
                <div class="journey-banner-title">${carrier?.name || '未知信使'}送来的信</div>
                <div class="journey-banner-sub">${report?.stats?.duration || ''} · ${report?.stats?.distance || ''} · ${report?.stats?.eventCount || 0} 个事件${stateDesc ? ' · ' + stateDesc : ''}</div>
              </div>
            </div>
            <p class="journey-banner-epilogue">${this._escapeReaderHtml(report?.epilogue || '这封信完成了一段旅程。')}</p>
            <button id="open-journey-report-btn" type="button" class="journey-report-open-btn">📜 拆开旅程志</button>
          </div>`;
      }
    }

    content.innerHTML = html;

    // 旅程志按钮
    const reportBtn = document.getElementById('open-journey-report-btn');
    if (reportBtn && letter.journey) {
      reportBtn.addEventListener('click', () => this.renderJourneyReport(letter));
    }

    // 在途：加速按钮 + 5s 定时重渲染
    const accelBtn = document.getElementById('accelerate-journey-btn');
    if (accelBtn && letter.journey && window.JourneyEngine) {
      accelBtn.addEventListener('click', () => {
        window.JourneyEngine.accelerate(letter, Date.now());
        this._persistJourneyTransition(letter);
        this.renderReader(letter.id, letter);
      });
      if (!this._journeyTickTimer) {
        this._journeyTickTimer = setInterval(() => {
          if (document.visibilityState === 'hidden') return;
          const r = window.JourneyEngine.tick(letter, Date.now());
          if (r.delivered) {
            clearInterval(this._journeyTickTimer);
            this._journeyTickTimer = null;
            this._persistJourneyTransition(letter);
            this.renderReader(letter.id, letter);
          }
        }, 5000);
      }
    }

    // 在途旅程刚送达：落库 + 广播（广播在多人同步步骤实现）
    if (journeyTransitioned) {
      this._persistJourneyTransition(letter);
    }

    // 信物状态叠加层（letterState 非零时注入首个信纸）
    if (letter.journey && letter.journey.letterState && window.JourneyEngine) {
      const hasState = Object.values(letter.journey.letterState).some(v => (v || 0) > 0.02);
      if (hasState) {
        const paperEl = content.querySelector('.reader-paper');
        if (paperEl) this._injectJourneyOverlay(paperEl, letter.journey.letterState);
      }
    }

    this._initRecordPlayer(letterId, letter.recordDuration || 0);
  },

  // 在途 → 送达：一次性落库（本地 + 远端幂等 upsert）+ 广播
  _persistJourneyTransition(letter) {
    try {
      if (typeof STORAGE !== 'undefined' && STORAGE.updateLetterFields) {
        STORAGE.updateLetterFields(letter.id, { journey: letter.journey });
      }
    } catch (_) {}
    try {
      if (typeof MailService !== 'undefined' && typeof MailService._request === 'function') {
        MailService._request('/api/letters/upsert', {
          method: 'POST',
          body: JSON.stringify({ letter })
        }).catch(() => {});
      }
    } catch (_) {}
    // 多人同步广播（可选，第 6 步启用）
    try {
      if (typeof MultiplayerSync !== 'undefined' && MultiplayerSync.isConnected && MultiplayerSync.isConnected()) {
        MultiplayerSync.sendMailDelivery && MultiplayerSync.sendMailDelivery({
          letterId: letter.id, mailboxId: letter.mailboxId, journey: letter.journey
        });
      }
    } catch (_) {}
  },

  // 注入信物状态叠加层（7 层，CSS 变量驱动）
  _injectJourneyOverlay(paperEl, letterState) {
    if (!paperEl || !window.JourneyEngine) return;
    const st = window.JourneyEngine.stateToCss(letterState);
    const el = document.createElement('div');
    el.className = 'letter-journey-overlay';
    for (const [k, v] of Object.entries(st)) el.style.setProperty(k, v);
    ['wear', 'wet', 'burn', 'bite', 'stain', 'fold', 'footprint'].forEach(k => {
      const d = document.createElement('div');
      d.className = 'st-' + k;
      el.appendChild(d);
    });
    paperEl.appendChild(el);
  },

  _escapeReaderHtml(str) {
    return String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  },

  // 万物送信：旅程志长卷
  renderJourneyReport(letter) {
    const overlay = document.getElementById('journey-report-overlay');
    const body = document.getElementById('journey-report-body');
    const closeBtn = document.getElementById('journey-report-close');
    if (!overlay || !body || !letter.journey) return;
    const journey = letter.journey;
    const report = journey.report || {};
    const carrier = (window.CARRIER_ROSTER || []).find(c => c.id === journey.carrierId);
    const st = report.letterState || journey.letterState || {};
    const chain = report.deliveryChain || [];
    const events = report.eventTimeline || journey.events || [];

    const stateBars = ['wear', 'wet', 'burn', 'bite', 'stain', 'fold', 'footprint'].map(k => {
      const v = st[k] || 0;
      const label = { wear: '磨损', wet: '洇湿', burn: '焦痕', bite: '啃痕', stain: '污渍', fold: '折痕', footprint: '脚印' }[k];
      return `<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
        <span style="width:44px;color:#8b7355">${label}</span>
        <div style="flex:1;height:8px;background:#eee2cd;border-radius:4px;overflow:hidden">
          <div style="height:100%;width:${Math.round(v * 100)}%;background:linear-gradient(90deg,#c9a86a,#8a6d3b)"></div>
        </div>
        <span style="width:34px;text-align:right;color:#8b7355">${Math.round(v * 100)}%</span>
      </div>`;
    }).join('');

    const chainHtml = chain.length ? chain.map((c, i) => `
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
        <span style="min-width:110px;font-weight:bold">${this._escapeReaderHtml(c.name || '')}</span>
        <span style="font-size:12px;color:#8b7355;width:80px">${this._escapeReaderHtml(c.species || '')}</span>
        <span style="font-size:11px;color:#b8956a;flex:1">${this._escapeReaderHtml(c.role || '')}${c.generation ? ' · 第' + c.generation + '代' : ''}</span>
        ${i < chain.length - 1 ? '<span style="color:#c9a86a">→</span>' : ''}
      </div>`).join('') : '<div style="color:#8b7355">无传递链</div>';

    const eventsHtml = events.map((evt, i) => `
      <div style="display:flex;gap:10px;margin-bottom:8px">
        <div style="display:flex;flex-direction:column;align-items:center">
          <span style="width:10px;height:10px;border-radius:50%;background:${this._evtColor(evt.type)};flex-shrink:0;margin-top:4px"></span>
          ${i < events.length - 1 ? '<span style="width:2px;flex:1;background:#e5d9c3"></span>' : ''}
        </div>
        <div style="flex:1;padding-bottom:4px">
          <div style="font-size:11px;color:#b8956a">${this._evtLabel(evt.type)} · 旅程第 ${Math.max(1, Math.round((evt.time || i) / 1000) + 1)} 段</div>
          <div>${this._escapeReaderHtml(evt.description || '')}</div>
        </div>
      </div>`).join('') || '<div style="color:#8b7355">无事件记录</div>';

    const stats = report.stats || {};
    body.innerHTML = `
      <div style="text-align:center;margin-bottom:16px">
        <div style="font-size:44px">${carrier?.emoji || '✉'}</div>
        <div style="font-size:17px;font-weight:bold;margin-top:6px">${carrier?.name || '未知信使'} · ${journey.expectedDelivery || ''}</div>
        <div style="font-size:12px;color:#8b7355;margin-top:4px">${this._escapeReaderHtml(report.epilogue || '')}</div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-bottom:16px">
        ${[['历时', stats.duration || '-'], ['传递链', stats.speciesCount + ' 种载体'], ['代际', stats.generations + ' 代'], ['路程', stats.distance || '-'], ['事件', stats.eventCount + ' 个'], ['信使', carrier?.name || '-']].map(([k, v]) => `
          <div style="background:#faf6ee;border:1px solid #eee2cd;border-radius:8px;padding:8px 10px">
            <div style="font-size:11px;color:#8b7355">${k}</div>
            <div style="font-weight:bold">${this._escapeReaderHtml(v)}</div>
          </div>`).join('')}
      </div>
      <h4 style="margin:12px 0 8px;color:#5c4a2e">传递链 · 族谱</h4>
      <div style="background:#fff;border:1px solid #eee2cd;border-radius:8px;padding:12px">${chainHtml}</div>
      <h4 style="margin:16px 0 8px;color:#5c4a2e">事件年表</h4>
      <div>${eventsHtml}</div>
      <h4 style="margin:16px 0 8px;color:#5c4a2e">信物状态</h4>
      <div style="background:#fff;border:1px solid #eee2cd;border-radius:8px;padding:12px">${stateBars}</div>
      <div style="text-align:center;margin-top:16px;font-size:11px;color:#b8956a">—— 万物送信 · 这封信的传记 ——</div>
    `;
    overlay.classList.add('active');
    overlay.setAttribute('aria-hidden', 'false');
    if (closeBtn) closeBtn.addEventListener('click', () => {
      overlay.classList.remove('active');
      overlay.setAttribute('aria-hidden', 'true');
    });
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('active');
        overlay.setAttribute('aria-hidden', 'true');
      }
    });
  },

  _evtColor(type) {
    return { departure: '#8a6d3b', transfer: '#b5543c', lineage: '#7a9e6b', environment: '#5a8fb0', encounter: '#a47fc4', serendipity: '#e0a83c', delivery: '#c9762e' }[type] || '#8a6d3b';
  },

  _evtLabel(type) {
    return { departure: '启程', transfer: '传递', lineage: '代际', environment: '环境', encounter: '相遇', serendipity: '奇遇', delivery: '送达' }[type] || type;
  },

  renderReaderHeader(letter, style) {
    const dateInfo = this._parseReaderDate(letter.date);
    const timeStr = letter.time || '';
    const weekday = letter.weekday || '';
    const letterTitle = letter.letterTitle || '';
    // 优先使用 recipientIdentity（含角色名）
    const recipient = letter.recipientIdentity?.identityName || letter.recipient || '';
    const dateStr = letter.date || '';

    switch (style) {
      case 'vintage-literary':
        return this._renderReaderVintageHeader(dateInfo, timeStr, weekday, letterTitle, recipient);
      case 'modern-minimal':
        return this._renderReaderModernHeader(dateStr, recipient, letterTitle);
      case 'cute-doodle':
        return this._renderReaderCuteHeader(dateStr, recipient, weekday);
      case 'japanese-vertical':
        return this._renderReaderJapaneseHeader(dateStr, recipient, weekday);
      case 'floral':
        return this._renderReaderFloralHeader(dateStr, recipient, letterTitle);
      case 'night-letter':
        return this._renderReaderNightHeader(dateInfo, timeStr, weekday, recipient);
      case 'kraft':
        return this._renderReaderKraftHeader(dateInfo, recipient, dateStr);
      case 'ocean':
        return this._renderReaderOceanHeader(dateStr, recipient, weekday);
      case 'chinese-bamboo':
        return this._renderReaderChineseBambooHeader(dateInfo, recipient, dateStr, weekday);
      default:
        return '';
    }
  },

  renderReaderFooter(letter, style) {
    // 优先使用 senderIdentity（含角色名）
    const sender = letter.senderIdentity?.identityName || letter.sender || '';
    const location = letter.location || '';

    switch (style) {
      case 'vintage-literary':
        return this._renderReaderVintageFooter(sender, location);
      case 'modern-minimal':
        return this._renderReaderModernFooter(sender, location);
      case 'cute-doodle':
        return this._renderReaderCuteFooter(sender, location);
      case 'japanese-vertical':
        return this._renderReaderJapaneseFooter(sender, location);
      case 'floral':
        return this._renderReaderFloralFooter(sender, location);
      case 'night-letter':
        return this._renderReaderNightFooter(sender, location);
      case 'kraft':
        return this._renderReaderKraftFooter(sender, location);
      case 'ocean':
        return this._renderReaderOceanFooter(sender, location);
      case 'chinese-bamboo':
        return this._renderReaderChineseBambooFooter(sender, location);
      default:
        return '';
    }
  },

  _renderReaderVintageHeader(dateInfo, timeStr, weekday, letterTitle, recipient) {
    let html = '';
    html += `<div class="vintage-date-block">
      <div class="vintage-date-number">${dateInfo.day}</div>
      <div class="vintage-date-month">${dateInfo.month}</div>
      <div class="vintage-date-year">${dateInfo.year}</div>
    </div>`;

    if (timeStr || weekday) {
      html += `<div class="vintage-time-box">
        ${timeStr ? `<div class="vintage-time">${timeStr}</div>` : ''}
        ${weekday ? `<div class="vintage-weekday">${weekday}</div>` : ''}
      </div>`;
    }

    if (recipient) {
      html += `<div class="vintage-recipient">${recipient}，</div>`;
    }
    return html;
  },

  _renderReaderVintageFooter(sender, location) {
    let html = '';
    if (sender) {
      html += `<div class="vintage-signature">`;
      html += `<div class="signer">${sender}</div>`;
      if (location) html += `<div class="location">${location}</div>`;
      html += `</div>`;
    }
    html += `<div class="vintage-seal">
      <svg viewBox="0 0 60 60" width="70" height="70">
        <circle cx="30" cy="30" r="27" fill="none" stroke="#c44" stroke-width="2" opacity="0.5"/>
        <text x="30" y="35" text-anchor="middle" fill="#c44" font-size="14" opacity="0.5" font-family="serif">笺</text>
      </svg>
    </div>`;
    return html;
  },

  _renderReaderModernHeader(date, recipient, letterTitle) {
    return `
      <div class="style-header modern-header">
        <div class="modern-date">${date || ''}</div>
        ${letterTitle ? `<div class="modern-title">${letterTitle}</div>` : ''}
        ${recipient ? `<div class="modern-recipient">致 ${recipient}</div>` : ''}
      </div>
    `;
  },

  _renderReaderModernFooter(sender, location) {
    if (!sender) return '';
    return `
      <div class="style-footer modern-footer">
        ${location ? `<div class="modern-location">${location}</div>` : ''}
        <div class="modern-sender">${sender}</div>
      </div>
    `;
  },

  _renderReaderCuteHeader(date, recipient, weekday) {
    return `
      <div class="style-header cute-header">
        <div class="cute-header-deco">✿ ♡ ✿</div>
        <div class="cute-date">${date || ''} ${weekday || ''}</div>
        ${recipient ? `<div class="cute-recipient">致 ${recipient} ♡</div>` : ''}
      </div>
    `;
  },

  _renderReaderCuteFooter(sender, location) {
    return `
      <div class="style-footer cute-footer">
        <div class="cute-footer-deco">~(◕‿◕)~</div>
        ${location ? `<div class="cute-location">📍 ${location}</div>` : ''}
        ${sender ? `<div class="cute-sender">${sender} 敬上</div>` : ''}
        <div class="cute-footer-deco">♡ ✿ ♡</div>
      </div>
    `;
  },

  _renderReaderJapaneseHeader(date, recipient, weekday) {
    return `
      <div class="style-header japanese-header">
        <div class="japanese-date">${date || ''} ${weekday || ''}</div>
        ${recipient ? `<div class="japanese-recipient">${recipient} 様</div>` : ''}
        <div class="japanese-greeting">謹啓</div>
      </div>
    `;
  },

  _renderReaderJapaneseFooter(sender, location) {
    return `
      <div class="style-footer japanese-footer">
        <div class="japanese-closing">敬具</div>
        ${location ? `<div class="japanese-location">${location}</div>` : ''}
        ${sender ? `<div class="japanese-sender">${sender} 筆</div>` : ''}
      </div>
    `;
  },

  _renderReaderFloralHeader(date, recipient, letterTitle) {
    return `
      <div class="style-header floral-header">
        <div class="floral-divider-top">✿ ❀ ✿ ❀ ✿</div>
        <div class="floral-date">${date || ''}</div>
        ${letterTitle ? `<div class="floral-title">${letterTitle}</div>` : ''}
        ${recipient ? `<div class="floral-recipient">致 ${recipient}</div>` : ''}
      </div>
    `;
  },

  _renderReaderFloralFooter(sender, location) {
    return `
      <div class="style-footer floral-footer">
        ${location ? `<div class="floral-location">📍 ${location}</div>` : ''}
        ${sender ? `<div class="floral-sender">${sender}</div>` : ''}
        <div class="floral-divider-bottom">❀ ✿ ❀ ✿ ❀</div>
      </div>
    `;
  },

  _renderReaderNightHeader(dateInfo, timeStr, weekday, recipient) {
    return `
      <div class="style-header night-header">
        <div class="night-moon">🌙</div>
        <div class="night-date">
          <span class="night-day">${dateInfo.day}</span>
          <span class="night-month-year">${dateInfo.month} ${dateInfo.year}</span>
        </div>
        <div class="night-time">${timeStr || ''} ${weekday || ''}</div>
        ${recipient ? `<div class="night-recipient">✦ 致 ${recipient} ✦</div>` : ''}
      </div>
    `;
  },

  _renderReaderNightFooter(sender, location) {
    return `
      <div class="style-footer night-footer">
        <div class="night-stars">✦ ✧ ✦ ✧ ✦</div>
        ${location ? `<div class="night-location">📍 ${location}</div>` : ''}
        ${sender ? `<div class="night-sender">${sender}</div>` : ''}
        <div class="night-end">✨ 晚安 ✨</div>
      </div>
    `;
  },

  _renderReaderKraftHeader(dateInfo, recipient, dateStr) {
    return `
      <div class="style-header kraft-header">
        <div class="kraft-stamp">${dateInfo.day || ''}</div>
        <div class="kraft-date">${dateStr || ''}</div>
        ${recipient ? `<div class="kraft-recipient">致 ${recipient}：</div>` : ''}
        <div class="kraft-line"></div>
      </div>
    `;
  },

  _renderReaderKraftFooter(sender, location) {
    return `
      <div class="style-footer kraft-footer">
        <div class="kraft-line-bottom"></div>
        ${location ? `<div class="kraft-location">📍 ${location}</div>` : ''}
        ${sender ? `<div class="kraft-sender">${sender} 手书</div>` : ''}
        <div class="kraft-wax-seal">
          <svg viewBox="0 0 60 60" width="60" height="60">
            <circle cx="30" cy="30" r="25" fill="#8b4513" opacity="0.4"/>
            <text x="30" y="36" text-anchor="middle" fill="#5c3317" font-size="12" font-family="serif">信</text>
          </svg>
        </div>
      </div>
    `;
  },

  _renderReaderOceanHeader(date, recipient, weekday) {
    return `
      <div class="style-header ocean-header">
        <div class="ocean-shells">🐚 🐚 🐚</div>
        <div class="ocean-date">${date || ''} ${weekday || ''}</div>
        ${recipient ? `<div class="ocean-recipient">致 ${recipient}</div>` : ''}
        <div class="ocean-wave-divider">
          <svg viewBox="0 0 300 20" preserveAspectRatio="none">
            <path d="M0,10 Q37.5,0 75,10 T150,10 T225,10 T300,10 L300,20 L0,20 Z" fill="#87ceeb" opacity="0.3"/>
          </svg>
        </div>
      </div>
    `;
  },

  _renderReaderOceanFooter(sender, location) {
    return `
      <div class="style-footer ocean-footer">
        <div class="ocean-wave-divider-bottom">
          <svg viewBox="0 0 300 20" preserveAspectRatio="none">
            <path d="M0,10 Q37.5,0 75,10 T150,10 T225,10 T300,10 L300,20 L0,20 Z" fill="#4682b4" opacity="0.25"/>
          </svg>
        </div>
        ${location ? `<div class="ocean-location">📍 ${location}</div>` : ''}
        ${sender ? `<div class="ocean-sender">${sender}</div>` : ''}
        <div class="ocean-footer-deco">⚓ 🐚 ⚓</div>
      </div>
    `;
  },

  _renderReaderChineseBambooHeader(dateInfo, recipient, dateStr, weekday) {
    return `
      <div class="style-header chinese-bamboo-header">
        <div class="chinese-date">${dateStr || ''} ${weekday || ''}</div>
        ${recipient ? `<div class="chinese-recipient">${recipient} 親啟</div>` : ''}
        <div class="chinese-greeting">敬啟者</div>
      </div>
    `;
  },

  _renderReaderBambooDecorations() {
    return `
      <div class="bamboo-left-deco">
        <svg viewBox="0 0 40 250" width="35" height="250">
          <path d="M20,0 L20,250" stroke="#2d5a27" stroke-width="3" opacity="0.5"/>
          <ellipse cx="20" cy="25" rx="7" ry="2.5" fill="none" stroke="#2d5a27" stroke-width="1.5" opacity="0.45"/>
          <ellipse cx="20" cy="75" rx="7" ry="2.5" fill="none" stroke="#2d5a27" stroke-width="1.5" opacity="0.45"/>
          <ellipse cx="20" cy="125" rx="7" ry="2.5" fill="none" stroke="#2d5a27" stroke-width="1.5" opacity="0.45"/>
          <ellipse cx="20" cy="175" rx="7" ry="2.5" fill="none" stroke="#2d5a27" stroke-width="1.5" opacity="0.45"/>
          <ellipse cx="20" cy="225" rx="7" ry="2.5" fill="none" stroke="#2d5a27" stroke-width="1.5" opacity="0.45"/>
          <path d="M20,25 Q38,18 48,5" stroke="#4a7c43" stroke-width="1.5" fill="none" opacity="0.45"/>
          <path d="M20,75 Q2,68 -8,52" stroke="#4a7c43" stroke-width="1.5" fill="none" opacity="0.45"/>
          <path d="M20,125 Q38,118 48,102" stroke="#4a7c43" stroke-width="1.5" fill="none" opacity="0.45"/>
          <path d="M20,175 Q2,168 -8,152" stroke="#4a7c43" stroke-width="1.5" fill="none" opacity="0.45"/>
          <ellipse cx="48" cy="7" rx="10" ry="3" fill="#5a8c53" opacity="0.35" transform="rotate(-28 48 7)"/>
          <ellipse cx="-6" cy="55" rx="10" ry="3" fill="#5a8c53" opacity="0.35" transform="rotate(28 -6 55)"/>
          <ellipse cx="48" cy="105" rx="10" ry="3" fill="#5a8c53" opacity="0.35" transform="rotate(-22 48 105)"/>
          <ellipse cx="-6" cy="155" rx="10" ry="3" fill="#5a8c53" opacity="0.35" transform="rotate(22 -6 155)"/>
        </svg>
      </div>
      <div class="bamboo-right-deco">
        <svg viewBox="0 0 40 250" width="35" height="250">
          <path d="M20,0 L20,250" stroke="#2d5a27" stroke-width="3" opacity="0.5"/>
          <ellipse cx="20" cy="50" rx="7" ry="2.5" fill="none" stroke="#2d5a27" stroke-width="1.5" opacity="0.45"/>
          <ellipse cx="20" cy="100" rx="7" ry="2.5" fill="none" stroke="#2d5a27" stroke-width="1.5" opacity="0.45"/>
          <ellipse cx="20" cy="150" rx="7" ry="2.5" fill="none" stroke="#2d5a27" stroke-width="1.5" opacity="0.45"/>
          <ellipse cx="20" cy="200" rx="7" ry="2.5" fill="none" stroke="#2d5a27" stroke-width="1.5" opacity="0.45"/>
          <path d="M20,50 Q2,43 -8,28" stroke="#4a7c43" stroke-width="1.5" fill="none" opacity="0.45"/>
          <path d="M20,100 Q38,93 48,78" stroke="#4a7c43" stroke-width="1.5" fill="none" opacity="0.45"/>
          <path d="M20,150 Q2,143 -8,128" stroke="#4a7c43" stroke-width="1.5" fill="none" opacity="0.45"/>
          <path d="M20,200 Q38,193 48,178" stroke="#4a7c43" stroke-width="1.5" fill="none" opacity="0.45"/>
          <ellipse cx="-6" cy="31" rx="10" ry="3" fill="#5a8c53" opacity="0.35" transform="rotate(28 -6 31)"/>
          <ellipse cx="48" cy="81" rx="10" ry="3" fill="#5a8c53" opacity="0.35" transform="rotate(-22 48 81)"/>
          <ellipse cx="-6" cy="131" rx="10" ry="3" fill="#5a8c53" opacity="0.35" transform="rotate(28 -6 131)"/>
          <ellipse cx="48" cy="181" rx="10" ry="3" fill="#5a8c53" opacity="0.35" transform="rotate(-22 48 181)"/>
        </svg>
      </div>
    `;
  },

  _renderReaderChineseBambooFooter(sender, location) {
    return `
      <div class="style-footer chinese-bamboo-footer">
        <div class="chinese-closing">此致</div>
        <div class="chinese-salutation">敬頌 時祺</div>
        ${location ? `<div class="chinese-location">📍 ${location}</div>` : ''}
        ${sender ? `<div class="chinese-sender">${sender} 謹啟</div>` : ''}
        <div class="chinese-seal">
          <svg viewBox="0 0 60 60" width="65" height="65">
            <rect x="5" y="5" width="50" height="50" fill="none" stroke="#8b0000" stroke-width="2" opacity="0.6"/>
            <text x="30" y="25" text-anchor="middle" fill="#8b0000" font-size="12" opacity="0.7" font-family="serif">竹韻</text>
            <text x="30" y="42" text-anchor="middle" fill="#8b0000" font-size="12" opacity="0.7" font-family="serif">墨香</text>
          </svg>
        </div>
      </div>
    `;
  },

  _initRecordPlayer(letterId, savedDuration) {
    const recordPlayer = document.getElementById('record-player');
    const recordBtn = document.getElementById('record-btn');
    const recordDuration = document.getElementById('record-duration');
    if (!recordPlayer || !recordBtn || !recordDuration) return;

    // 资源统一从 MySQL 经 /api/assets 获取
    const testRecordUrl = () => {
      const rel = 'mailfile/mail_re/6月27日.m4a';
      const apiBase = (window.MailService && typeof window.MailService.getBaseUrl === 'function')
        ? String(window.MailService.getBaseUrl() || '').replace(/\/+$/, '')
        : '';
      return apiBase ? `${apiBase}/api/assets/${rel}` : rel;
    };

    this._currentRecordLetterId = letterId;
    this._recordBlob = null;
    this._recordUrl = null;
    this._recordDuration = 0;
    this._recordAudio = null;

    STORAGE.getMedia(`record_${letterId}`).then(blob => {
      if (blob && blob.size > 0) {
        if (!blob.type || blob.type === '') {
          this._recordBlob = new Blob([blob], { type: 'audio/mp4' });
        } else {
          this._recordBlob = blob;
        }
        this._recordDuration = savedDuration;
        recordDuration.textContent = this._formatDuration(this._recordDuration);
        recordPlayer.style.display = 'flex';
        console.log('[录音] 已加载，大小:', blob.size, '类型:', this._recordBlob.type);
      } else if (letterId === 'brenuo-1') {
        this._recordUrl = testRecordUrl();
        this._recordDuration = savedDuration || 4;
        recordDuration.textContent = this._formatDuration(this._recordDuration);
        recordPlayer.style.display = 'flex';
        console.log('[录音] 使用测试URL:', this._recordUrl);
      } else {
        recordPlayer.style.display = 'none';
      }
    }).catch((err) => {
      console.error('[录音] 加载失败:', err);
      if (letterId === 'brenuo-1') {
        this._recordUrl = testRecordUrl();
        this._recordDuration = savedDuration || 4;
        recordDuration.textContent = this._formatDuration(this._recordDuration);
        recordPlayer.style.display = 'flex';
        console.log('[录音] IndexedDB失败，使用测试URL:', this._recordUrl);
      } else {
        recordPlayer.style.display = 'none';
      }
    });
  },

  _formatDuration(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  },

  _parseReaderDate(dateStr) {
    const result = { day: '', month: '', year: '' };
    if (!dateStr) return result;

    const cnMonthMatch = dateStr.match(/([一二三四五六七八九十]+)月/);
    const cnDayMatch = dateStr.match(/(\d+|[一二三四五六七八九十]+)日/);
    const cnYearMatch = dateStr.match(/([一二三四五六七八九零〇]+年)/);

    if (cnYearMatch) {
      result.year = cnYearMatch[1];
    } else {
      const numYearMatch = dateStr.match(/(\d{4})/);
      if (numYearMatch) result.year = numYearMatch[1] + '年';
    }

    if (cnMonthMatch) {
      result.month = cnMonthMatch[1] + '月';
    } else {
      const numMonthMatch = dateStr.match(/(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/);
      if (numMonthMatch) {
        const monthNum = parseInt(numMonthMatch[2], 10);
        const cnMonths = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'];
        result.month = cnMonths[monthNum - 1] + '月';
      } else {
        result.month = dateStr;
      }
    }

    if (cnDayMatch) {
      result.day = cnDayMatch[1];
    } else {
      const numDayMatch = dateStr.match(/(\d{1,2})[日号]/);
      if (numDayMatch) {
        result.day = numDayMatch[1];
      } else {
        const dayNum = dateStr.match(/\/(\d{1,2})/) || dateStr.match(/-(\d{1,2})$/);
        if (dayNum) result.day = dayNum[1];
      }
    }

    if (!result.day && !result.month && !result.year) {
      result.day = dateStr;
    }

    return result;
  },

  renderReaderElement(elem) {
    const style = `position:absolute;left:${elem.x || 0}px;top:${elem.y || 0}px;`;
    const rotation = elem.rotation ?? elem.rotate ?? 0;
    const rot = rotation ? `transform:rotate(${rotation}deg);` : '';

    switch (elem.type) {
      case 'text':
        return `<div style="${style}${rot}font-family:var(--font-handwriting);font-size:${elem.fontSize || 16}px;line-height:1.8;padding:4px 8px;white-space:pre-wrap;">${(elem.text || '').replace(/\n/g, '<br>')}</div>`;
      case 'image':
        return `<div style="${style}${rot}width:${elem.width || 200}px;"><div class="${ImageFrames.className(elem.frameStyle)}"><img src="${elem.src}" alt="信件图片"></div></div>`;
      case 'voice':
        const dur = elem.duration || 0;
        const dm = Math.floor(dur / 60);
        const ds = dur % 60;
        return `<div style="${style}${rot}background:rgba(139,69,19,0.08);border:1px solid rgba(139,69,19,0.2);border-radius:20px;padding:10px 20px;display:inline-flex;align-items:center;gap:10px;"><span style="font-size:1.4rem;">🎤</span><button onclick="this.textContent=this.textContent==='▶'?'⏸':'▶';const a=new Audio('${elem.src}');a.play();" style="background:none;border:none;color:var(--color-accent);cursor:pointer;font-size:1.2rem;">▶</button><span style="font-size:0.8rem;color:#999;">${dm}:${String(ds).padStart(2,'0')}</span></div>`;
      case 'video':
        return `<div style="${style}${rot}max-width:${elem.width || 300}px;"><video src="${elem.src}" controls style="width:100%;border-radius:6px;"></video></div>`;
      case 'stamp':
        return `<div style="${style}${rot}width:80px;height:80px;">${MediaHandler.generateStampSVG(elem.stampType)}</div>`;
      case 'doodle':
        return `<div style="${style}${rot}pointer-events:none;z-index:3;opacity:0.8;">${elem.svg}</div>`;
      default:
        return '';
    }
  },

  renderReaderItemAttachments(items) {
    const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[char]);
    return `
      <section class="reader-item-attachments" aria-label="随信物品">
        <header>
          <h3>随信物品</h3>
          <p>${items.every(item => item.status === 'received') ? '物品已收入收信账号背包' : '物品正在由信件安全托管'}</p>
        </header>
        <div class="reader-item-attachment-grid">
          ${items.map(item => `
            <article class="reader-item-attachment">
              <img src="${escape(item.icon || '')}" alt="">
              <div>
                <h4>${escape(item.name || item.definitionId)}</h4>
                <p>${escape(item.description || '')}</p>
                <small>${escape(item.originLabel || '来自 既有物品')}</small>
                <em>${item.status === 'received' ? '已到账' : '已托管'}</em>
              </div>
            </article>
          `).join('')}
        </div>
      </section>
    `;
  },

  /* ========================================
     信箱级别 BGM 管理
     ======================================== */

});
