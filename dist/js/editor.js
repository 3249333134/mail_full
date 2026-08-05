/* ========================================
   信笺 — 信纸编辑器核心
   ======================================== */

const Editor = {
  letter: null,
  mailboxId: null,
  pendingRecipient: null,
  paperStyle: 'vintage-literary',
  pages: [],
  currentPageIndex: 0,
  selectedId: null,
  dragState: null,
  resizeState: null,
  rotateState: null,
  bgmAudio: null,
  metaMode: false,
  currentMode: 'content',
  undoStack: [],
  redoStack: [],
  maxUndoSteps: 50,

  init(letterId) {
    if (letterId) {
      this.letter = null;
      this.letter = STORAGE.loadLetters().find(l => l.id === letterId);
      if (!this.letter) {
        const allMailboxes = MailboxManager.getMailboxes();
        for (const mb of allMailboxes) {
          if (MailboxManager.isSharedMailbox(mb.id)) {
            const letters = STORAGE.loadSharedLetters(mb.id);
            const found = letters.find(l => l.id === letterId);
            if (found) {
              this.letter = found;
              this.mailboxId = mb.id;
              break;
            }
          }
        }
      }
      if (!this.letter && typeof MailService !== 'undefined') {
        const cached = MailService.getCachedMailbox(this.mailboxId).letters || [];
        this.letter = cached.find(letter => letter.id === letterId) || null;
      }
    }
    if (!this.letter) {
      const now = new Date();
      const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const currentUser = AuthManager.getCurrentUser();
      const isShared = this.mailboxId ? MailboxManager.isSharedMailbox(this.mailboxId) : false;
      
      // 使用当前 mailboxId，如果没有则保持为空，让 getIdentityName 搜索所有信箱
      const effectiveMailboxId = this.mailboxId || '';
      
      this.letter = {
        id: 'letter-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
        mailboxId: effectiveMailboxId,
        paperStyle: this.paperStyle,
        envelopeStyle: 'kraft-brown',
        recipient: '',
        sender: '',
        date: now.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }),
        time: `${hours}:${minutes}`,
        weekday: weekdays[now.getDay()],
        location: '',
        letterTitle: '',
        bgm: null,
        content: [],
        pages: null,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      if (isShared && currentUser) {
        this.letter.author = {
          userId: currentUser.id,
          username: currentUser.username,
          displayName: currentUser.displayName || currentUser.username
        };
      }

      if (currentUser) {
        this.letter.senderAccountKey = MailService.getAccountKey(currentUser);
        // 传入空字符串让 getIdentityName 搜索所有信箱的角色绑定
        this.letter.sender = MailService.getIdentityName(effectiveMailboxId || null, currentUser);
      }
      if (this.pendingRecipient) {
        this.letter.recipientAccountKey = this.pendingRecipient.accountKey;
        // 优先使用 identityName（角色名），否则通过 getIdentityName 获取
        if (this.pendingRecipient.identityName) {
          this.letter.recipient = this.pendingRecipient.identityName;
        } else if (typeof MailService !== 'undefined' && this.pendingRecipient.accountKey) {
          // 创建临时用户对象来获取角色名（getAccountKey 使用 username 或 id）
          const tempUser = {
            username: this.pendingRecipient.accountKey,
            id: this.pendingRecipient.accountKey,
            displayName: this.pendingRecipient.displayName,
            role: this.pendingRecipient.characterId || ''
          };
          this.letter.recipient = MailService.getIdentityName(effectiveMailboxId || null, tempUser);
        } else {
          this.letter.recipient = this.pendingRecipient.displayName ||
            this.pendingRecipient.username ||
            this.pendingRecipient.fullName;
        }
      }
    }
    this.letter.itemAttachmentIds = Array.isArray(this.letter.itemAttachmentIds)
      ? [...new Set(this.letter.itemAttachmentIds)].slice(0, 8)
      : [];

    if (this.letter.pages && Array.isArray(this.letter.pages) && this.letter.pages.length > 0) {
      this.pages = JSON.parse(JSON.stringify(this.letter.pages));
    } else {
      this.pages = [{
        id: 'page-1',
        pageNumber: 1,
        paperStyle: this.letter.paperStyle || 'vintage-literary',
        elements: [...(this.letter.content || [])]
      }];
    }

    this._ensureBodyTextElement();
    this.currentPageIndex = 0;
    this.selectedId = null;
    this.render();
    this.renderMetaForm();
    this.setupEventListeners();
    this.renderPaperElements();
    this._updateItemAttachmentButton();
    this.switchMode(this.currentMode);
  },

  get elements() {
    return this.pages[this.currentPageIndex]?.elements || [];
  },

  set elements(val) {
    if (this.pages[this.currentPageIndex]) {
      this.pages[this.currentPageIndex].elements = val;
    }
  },

  get paperStyle() {
    return this.pages[this.currentPageIndex]?.paperStyle || 'vintage-literary';
  },

  set paperStyle(val) {
    if (this.pages[this.currentPageIndex]) {
      this.pages[this.currentPageIndex].paperStyle = val;
    }
  },

  _getDefaultFontFamily() {
    const currentFont = this.letter.fontFamily || 'brush-xingkai';
    const font = this.fontStyles.find(f => f.id === currentFont);
    return font ? font.family : 'var(--font-brush-xingkai)';
  },

  _ensureBodyTextElement() {
    if (!this.letter.bodyText) return;
    if (!this.pages || this.pages.length === 0) return;

    const firstPage = this.pages[0];
    const hasBodyTextElem = firstPage.elements.some(e => e._isBodyText);
    if (hasBodyTextElem) return;

    const style = firstPage.paperStyle || this.letter.paperStyle || 'vintage-literary';
    const verticalStyles = ['chinese-bamboo', 'japanese-vertical', 'red-frame-vertical'];
    const isVertical = verticalStyles.includes(style);

    firstPage.elements.unshift({
      id: 'body-text-' + Date.now(),
      type: 'text',
      text: this.letter.bodyText,
      x: isVertical ? 760 : 50,
      y: 80,
      fontSize: 16,
      color: '#2c2c2c',
      fontFamily: 'KaiTi, STKaiti, serif',
      width: isVertical ? undefined : 500,
      _isBodyText: true,
      vertical: isVertical
    });
  },

  render() {
    this.renderPaper();
    this.renderStampGrid();
    this.renderPaperStyleGrid();
    this.renderFontStyleGrid();
    this.renderToolbarEnvelope();
    this.renderPagesList();
    this.updateTitle();
  },

  renderPagesList() {
    const list = document.getElementById('pages-list');
    if (!list) return;

    list.innerHTML = this.pages.map((page, idx) => `
      <div class="page-item ${idx === this.currentPageIndex ? 'active' : ''}" data-index="${idx}">
        <div class="page-thumb">${idx + 1}</div>
        <span class="page-label">第${idx + 1}页</span>
        ${this.pages.length > 1 ? `<button class="delete-page-btn" data-index="${idx}" title="删除此页">×</button>` : ''}
      </div>
    `).join('');

    list.querySelectorAll('.page-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-page-btn')) return;
        const idx = parseInt(item.dataset.index);
        this.switchPage(idx);
      });
    });

    list.querySelectorAll('.delete-page-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.dataset.index);
        this.deletePage(idx);
      });
    });
  },

  switchPage(index) {
    if (index < 0 || index >= this.pages.length) return;
    if (index === this.currentPageIndex) return;

    this.currentPageIndex = index;
    this.selectedId = null;
    this.renderPaper();
    this.renderPaperStyleGrid();
    this.renderPaperElements();
    this.renderPagesList();
    this.updateUndoButtons();
  },

  addPage() {
    const newPage = {
      id: 'page-' + Date.now(),
      pageNumber: this.pages.length + 1,
      paperStyle: this.pages[this.currentPageIndex]?.paperStyle || 'vintage-literary',
      elements: []
    };
    this.pages.push(newPage);
    this.currentPageIndex = this.pages.length - 1;
    this.selectedId = null;
    this.renderPaper();
    this.renderPaperStyleGrid();
    this.renderPaperElements();
    this.renderPagesList();
  },

  deletePage(index) {
    if (this.pages.length <= 1) return;
    if (!confirm(`确定要删除第${index + 1}页吗？`)) return;

    this.pages.splice(index, 1);
    if (this.currentPageIndex >= this.pages.length) {
      this.currentPageIndex = this.pages.length - 1;
    }
    this.selectedId = null;
    this.renderPaper();
    this.renderPaperStyleGrid();
    this.renderPaperElements();
    this.renderPagesList();
  },

  renderToolbarEnvelope() {
    const grid = document.getElementById('toolbar-envelope-grid');
    const preview = document.getElementById('envelope-large-preview');
    if (!grid || !preview) return;

    grid.innerHTML = this.envelopeStyles.map(style => `
      <div class="envelope-style-item ${this.letter.envelopeStyle === style.id ? 'active' : ''}" data-style="${style.id}" title="${style.name}">
        <div class="envelope-preview" style="--env-color:${style.color};--env-flap:${style.flapColor};">
          <div class="env-flap"></div>
          <div class="env-body"></div>
          <div class="env-seal">✉</div>
        </div>
      </div>
    `).join('');

    // 初始化左侧大预览
    this._renderToolbarLargeEnvelope(this.letter.envelopeStyle || 'vintage-stamp');

    grid.querySelectorAll('.envelope-style-item').forEach(item => {
      item.addEventListener('click', () => {
        const styleId = item.dataset.style;
        this.letter.envelopeStyle = styleId;
        document.querySelectorAll('#toolbar-envelope-grid .envelope-style-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        
        // 更新左侧大预览
        this._renderToolbarLargeEnvelope(styleId);

        // 更新右侧面板的信封预览
        if (this._renderEnvelopePreview) {
          this._renderEnvelopePreview(styleId);
        }
        // 同步激活中间区域的样式选择项
        document.querySelectorAll('#envelope-style-grid .envelope-style-item').forEach(i => {
          i.classList.remove('active');
          if (i.dataset.style === styleId) i.classList.add('active');
        });
      });
    });
  },

  _renderToolbarLargeEnvelope(styleId) {
    const preview = document.getElementById('toolbar-large-envelope');
    if (!preview) return;
    
    this.envelopeStyles.forEach(s => {
      preview.classList.remove('env-' + s.id);
    });
    preview.classList.add('env-' + styleId);
    
    let details = '';
    if (styleId === 'vintage-stamp') {
      details = '<div class="env-stamp"></div><div class="env-postmark"></div><div class="env-address"><span class="line">Miss Lin</span><span class="line">Hengshan Rd</span></div>';
    } else if (styleId === 'airmail-blue') {
      details = '<div class="env-par-avion">PAR AVION</div><div class="env-stamp"></div><div class="env-postmark"></div><div class="env-address"><span class="line">Shanghai</span></div>';
    } else if (styleId === 'chinese-kraft') {
      details = '<div class="env-red-frame"></div><div class="env-stamp"></div><div class="env-postmark"></div><div class="env-vertical-text"><div class="col">木生吾夫</div><div class="col">亲启</div></div>';
    } else if (styleId === 'telegram-urgent') {
      details = '<div class="env-telegram-header"><span class="env-telegram-title">TELEGRAM</span><span class="env-urgent-tag">URGENT</span></div><div class="env-telegram-content"><div>抵达 STOP</div><div>月明 STOP</div></div><div class="env-postmark"></div>';
    } else if (styleId === 'qiaopi-red-band') {
      details = '<div class="env-red-band"></div><div class="env-qiaopi-char">家书</div><div class="env-stamp"></div><div class="env-postmark"></div><div class="env-vertical-text"><div class="col">木生</div><div class="col">珍重</div></div>';
    } else if (styleId === 'old-receipt') {
      details = '<div class="env-table-header">汇款凭单</div><div class="env-table-line"></div><div class="env-table-line"></div><div class="env-table-line"></div><div class="env-vertical-text"><div class="col">平安</div></div><div class="env-postmark"></div>';
    } else if (styleId === 'vertical-photo') {
      details = '<div class="env-photo"></div><div class="env-postmark"></div><div class="env-red-vertical l1"></div><div class="env-red-vertical l2"></div><div class="env-red-vertical l3"></div><div class="env-vertical-text"><div class="col">纸短情长</div></div>';
    } else if (styleId === 'modern-parcel') {
      details = '<div class="env-courier-label"><div class="label-text">SHIP</div><div class="label-line"></div></div><div class="env-barcode"></div><div class="env-fragile-tag">FRAGILE</div>';
    }
    preview.innerHTML = details;
  },

  renderPaperStyleGrid() {
    const grid = document.getElementById('paper-style-grid');
    if (!grid) return;

    const paperStyles = [
      { id: 'vintage-literary', name: '文艺复古', icon: '📜' },
      { id: 'modern-minimal', name: '现代简约', icon: '📄' },
      { id: 'cute-doodle', name: '可爱手绘', icon: '🎨' },
      { id: 'japanese-vertical', name: '日式和风', icon: '🍵' },
      { id: 'floral', name: '花语信纸', icon: '🌸' },
      { id: 'night-letter', name: '夜书信纸', icon: '🌙' },
      { id: 'kraft', name: '牛皮纸', icon: '📦' },
      { id: 'ocean', name: '海洋风', icon: '🌊' },
      { id: 'chinese-bamboo', name: '中国风竹韵', icon: '🎋' },
      { id: 'warm-desk', name: '暖光桌面', icon: '🕯️' },
      { id: 'scan-manuscript', name: '扫描稿纸', icon: '📋' },
      { id: 'red-frame-vertical', name: '红框竖排', icon: '🟥' },
      { id: 'red-column-brush', name: '红栏毛笔', icon: '🏮' },
      { id: '80s-horizontal', name: '80年代家书', icon: '✉️' },
      { id: 'red-vertical-column', name: '红色竖栏', icon: '🧧' },
      { id: 'damaged-vertical', name: '破损情书', icon: '💔' },
      { id: 'torn-short-note', name: '撕边短笺', icon: '📝' },
      { id: 'revision-manuscript', name: '修改稿纸', icon: '✏️' },
      { id: 'pen-blue-ink', name: '蓝墨横线', icon: '🖋️' },
      { id: 'airmail-thin', name: '航空薄信', icon: '✈️' },
      { id: 'master-aged', name: '做旧母版', icon: '🏺' }
    ];

    const currentStyle = this.paperStyle;

    grid.innerHTML = paperStyles.map(style => `
      <div class="paper-style-item ${currentStyle === style.id ? 'active' : ''}" data-style="${style.id}" title="${style.name}">
        <span class="paper-style-icon">${style.icon}</span>
        <span class="paper-style-name">${style.name}</span>
      </div>
    `).join('');

    grid.querySelectorAll('.paper-style-item').forEach(item => {
      item.addEventListener('click', () => {
        const styleId = item.dataset.style;
        this.paperStyle = styleId;
        this.letter.paperStyle = styleId;
        document.querySelectorAll('.paper-style-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        this.renderPaper();
        this.renderPaperElements();
      });
    });
  },

  fontStyles: [
    { id: 'brush-xingkai', name: '毛笔行楷', family: 'var(--font-brush-xingkai)', category: 'brush', icon: '✏️' },
    { id: 'brush-kaishu', name: '毛笔楷书', family: 'var(--font-brush-kaishu)', category: 'brush', icon: '✒️' },
    { id: 'brush-caoshu', name: '毛笔草书', family: 'var(--font-brush-caoshu)', category: 'brush', icon: '🖌️' },
    { id: 'brush-xiaokai', name: '毛笔小楷', family: 'var(--font-brush-xiaokai)', category: 'brush', icon: '✍️' },
    { id: 'brush-longcang', name: '龙藏毛笔', family: 'var(--font-brush-longcang)', category: 'brush', icon: '🐲' },
    { id: 'brush-liujian', name: '流江毛草', family: 'var(--font-brush-liujian)', category: 'brush', icon: '🌊' },
    { id: 'brush-shufa', name: '书法行书', family: 'var(--font-brush-shufa)', category: 'brush', icon: '📜' },
    { id: 'brush-songti', name: '毛笔宋体', family: 'var(--font-brush-songti)', category: 'brush', icon: '📝' },
    { id: 'pen-kai', name: '钢笔楷书', family: 'var(--font-pen-kai)', category: 'pen', icon: '✐' },
    { id: 'pen-song', name: '钢笔宋体', family: 'var(--font-pen-song)', category: 'pen', icon: '📄' },
    { id: 'pen-youyuan', name: '钢笔幼圆', family: 'var(--font-pen-youyuan)', category: 'pen', icon: '✎' },
    { id: 'pen-fangsong', name: '钢笔仿宋', family: 'var(--font-pen-fangsong)', category: 'pen', icon: '✑' },
    { id: 'typewriter', name: '打字机', family: 'var(--font-typewriter)', category: 'typewriter', icon: '⌨️' },
    { id: 'cyber-pixel', name: '赛博像素', family: 'var(--font-cyber-pixel)', category: 'cyber', icon: '💻' },
    { id: 'cyber-mono', name: '赛博等宽', family: 'var(--font-cyber-mono)', category: 'cyber', icon: '📟' }
  ],

  renderFontStyleGrid() {
    const grid = document.getElementById('font-style-grid');
    if (!grid) return;

    let currentFont = this.letter.fontFamily || 'brush-xingkai';
    if (this.selectedId) {
      const selectedElem = this.elements.find(el => el.id === this.selectedId);
      if (selectedElem && selectedElem.type === 'text' && selectedElem.fontFamily) {
        const font = this.fontStyles.find(f => f.family === selectedElem.fontFamily);
        if (font) currentFont = font.id;
      }
    }

    grid.innerHTML = this.fontStyles.map(font => `
      <div class="font-style-item ${currentFont === font.id ? 'active' : ''}" data-font="${font.id}" title="${font.name}" style="font-family: ${font.family}">
        <span class="font-style-icon">${font.icon}</span>
        <span class="font-style-name">${font.name}</span>
      </div>
    `).join('');

    grid.querySelectorAll('.font-style-item').forEach(item => {
      item.addEventListener('click', () => {
        const fontId = item.dataset.font;
        const font = this.fontStyles.find(f => f.id === fontId);
        if (font) {
          this.letter.fontFamily = fontId;
          document.querySelectorAll('.font-style-item').forEach(i => i.classList.remove('active'));
          item.classList.add('active');
          if (this.selectedId) {
            const selectedElem = this.elements.find(el => el.id === this.selectedId);
            if (selectedElem && selectedElem.type === 'text') {
              selectedElem.fontFamily = font.family;
              this.saveUndoState();
            }
          } else {
            this.elements.forEach(el => {
              if (el.type === 'text') {
                el.fontFamily = font.family;
              }
            });
            this.saveUndoState();
          }
          this.renderPaperElements();
          this._renderEnvelopePreview(this.letter.envelopeStyle || 'vintage-stamp');
          if (this.selectedId) {
            this.selectElement(this.selectedId);
          }
        }
      });
    });
  },

  renderStampGrid() {
    const grid = document.getElementById('stamp-grid');
    if (!grid) return;

    const stampTypes = MediaHandler.getStampTypes();
    grid.innerHTML = stampTypes.map(type => {
      return `<div class="stamp-item" data-stamp="${type}" title="${type}" draggable="true">
        ${MediaHandler.generateStampSVG(type)}
      </div>`;
    }).join('');

    grid.querySelectorAll('.stamp-item').forEach(item => {
      item.addEventListener('click', () => {
        const stampType = item.dataset.stamp;
        if (this.currentMode === 'cover') {
          this._addStampToCover(stampType);
        } else {
          this.addElement('stamp', { stampType });
        }
      });
      
      item.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('stampType', item.dataset.stamp);
        e.dataTransfer.setData('dragType', 'stamp');
        item.style.opacity = '0.5';
      });
      
      item.addEventListener('dragend', (e) => {
        item.style.opacity = '1';
      });
    });
  },

  envelopeStyles: [
    { id: 'vintage-stamp', name: '旧邮戳信封', color: '#e8e0d0', flapColor: '#f0e8d8', bgColor: '#fdfaf3', type: 'vintage' },
    { id: 'airmail-blue', name: '航邮蓝红边', color: '#1d5774', flapColor: '#2a6b8a', bgColor: '#e8f4f8', type: 'airmail' },
    { id: 'chinese-kraft', name: '中式牛皮纸', color: '#d4a574', flapColor: '#dbb586', bgColor: '#f5ebe0', type: 'chinese' },
    { id: 'telegram-urgent', name: '电报急件', color: '#f0e068', flapColor: '#f4e878', bgColor: '#fdf8e8', type: 'telegram' },
    { id: 'qiaopi-red-band', name: '家书红带', color: '#b33b3f', flapColor: '#c44', bgColor: '#fdf0e8', type: 'qiaopi' },
    { id: 'old-receipt', name: '旧票据批信', color: '#e8d4b8', flapColor: '#f0dcbe', bgColor: '#fdf8e8', type: 'receipt' },
    { id: 'vertical-photo', name: '竖排家书', color: '#f5ead4', flapColor: '#f7f0e0', bgColor: '#fdfaf3', type: 'vertical' },
    { id: 'modern-parcel', name: '现代邮件', color: '#d4a574', flapColor: '#dbb586', bgColor: '#f5ebe0', type: 'modern' }
  ],

  stampStyles: [
    { id: 'classic-gold', name: '经典金', color: '#e8c878', borderColor: 'rgba(120,90,40,0.4)' },
    { id: 'red-circle', name: '红圈', color: '#c44', borderColor: 'rgba(100,20,20,0.5)' },
    { id: 'blue-star', name: '蓝星', color: '#4a7abc', borderColor: 'rgba(30,60,120,0.4)' },
    { id: 'green-leaf', name: '绿叶', color: '#6b9a4d', borderColor: 'rgba(40,80,30,0.4)' },
    { id: 'purple-flower', name: '紫花', color: '#9a6bba', borderColor: 'rgba(70,40,100,0.4)' },
    { id: 'brown-wood', name: '木色', color: '#a67c52', borderColor: 'rgba(80,50,20,0.4)' }
  ],

  postmarkStyles: [
    { id: 'circle-date', name: '圆形日期', type: 'circle', content: 'PEKING 28.12' },
    { id: 'square-city', name: '方形城市', type: 'square', content: 'SHANGHAI' },
    { id: 'oval-stamp', name: '椭圆形', type: 'oval', content: '家书' },
    { id: 'no-postmark', name: '无邮戳', type: 'none', content: '' },
    { id: 'seal-letter', name: '家书之章', type: 'circle', content: '家书之章' },
    { id: 'seal-love', name: '平安', type: 'circle', content: '平安' },
    { id: 'seal-miss', name: '思念', type: 'circle', content: '思念' },
    { id: 'seal-home', name: '家信', type: 'circle', content: '家信' }
  ],

  renderMetaForm() {
    const paperArea = document.getElementById('paper-area');
    const existing = paperArea.querySelector('.meta-form-container');
    if (existing) existing.remove();

    const container = document.createElement('div');
    container.className = 'meta-form-container';
    container.innerHTML = `
      <div class="meta-section">
        <div class="meta-form-inner">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:15px;">
            <div class="prop-group field-recipient">
              <label class="prop-label">收信人</label>
              <input class="prop-input" id="meta-recipient" value="${this.letter.recipient || ''}" placeholder="例如：缪医生">
            </div>
            <div class="prop-group field-sender">
              <label class="prop-label">写信人</label>
              <input class="prop-input" id="meta-sender" value="${this.letter.sender || ''}" placeholder="例如：以撒">
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:15px;">
            <div class="prop-group field-date">
              <label class="prop-label">日期</label>
              <input class="prop-input" id="meta-date" value="${this.letter.date || ''}" placeholder="一九九五年五月二十日">
            </div>
            <div class="prop-group field-time">
              <label class="prop-label">时间</label>
              <input class="prop-input" id="meta-time" value="${this.letter.time || ''}" placeholder="05:20">
            </div>
            <div class="prop-group field-weekday">
              <label class="prop-label">星期</label>
              <input class="prop-input" id="meta-weekday" value="${this.letter.weekday || ''}" placeholder="周六">
            </div>
          </div>
          <div class="prop-group field-location">
            <label class="prop-label">地点</label>
            <input class="prop-input" id="meta-location" value="${this.letter.location || ''}" placeholder="例如：于布雷诺老屋">
          </div>
          <div class="prop-group field-letter-title">
            <label class="prop-label">信件标题/序</label>
            <input class="prop-input" id="meta-letter-title" value="${this.letter.letterTitle || ''}" placeholder="例如：第一封：医院初遇后，她刚离开布雷诺，未寄出">
          </div>
          <div class="prop-group field-address">
            <label class="prop-label">地址</label>
            <input class="prop-input" id="meta-address" value="${this.letter.address || ''}" placeholder="例如：Hengshan Road 18, Shanghai">
          </div>
          <div class="prop-group field-telegram-content">
            <label class="prop-label">电报内容</label>
            <textarea class="prop-input" id="meta-telegram-content" rows="3" placeholder="例如：抵达 STOP 月明 STOP 一切平安 STOP">${this.letter.telegramContent || ''}</textarea>
          </div>
          <div class="prop-group field-vertical-text">
            <label class="prop-label">竖排文字</label>
            <textarea class="prop-input" id="meta-vertical-text" rows="2" placeholder="例如：纸短情长 伏惟珍重">${this.letter.verticalText || ''}</textarea>
          </div>
          <div class="prop-group field-stamp-style">
            <label class="prop-label">信戳样式</label>
            <div class="stamp-style-grid" id="stamp-style-grid"></div>
          </div>
          <div class="prop-group field-postmark-style">
            <label class="prop-label">邮戳样式</label>
            <div class="postmark-style-grid" id="postmark-style-grid"></div>
          </div>
        </div>
      </div>

      <div class="envelope-section">
        <h3 class="section-title">信封样式</h3>
        <div class="envelope-layout">
          <div class="envelope-style-grid" id="envelope-style-grid">
            ${this.envelopeStyles.map(style => {
              let envClass = 'env-' + style.id;
              let details = '';
              if (style.id === 'vintage-stamp') {
                details = '<div class="env-stamp"></div><div class="env-postmark"></div><div class="env-address"><span class="line">Miss Lin Mei</span><span class="line">Hengshan Rd 18</span><span class="line">Shanghai</span></div><div class="env-wavy-lines"><span></span><span></span><span></span></div>';
              } else if (style.id === 'airmail-blue') {
                details = '<div class="env-par-avion">PAR AVION</div><div class="env-stamp"></div><div class="env-postmark"></div><div class="env-address"><span class="line">木生吾丈夫</span><span class="line">Paris / Rue 12</span></div>';
              } else if (style.id === 'chinese-kraft') {
                details = '<div class="env-red-frame"></div><div class="env-stamp"></div><div class="env-postmark"></div><div class="env-vertical-text"><div class="col">木生吾夫亲启</div><div class="col">信远寄此</div></div>';
              } else if (style.id === 'telegram-urgent') {
                details = '<div class="env-telegram-header"><span class="env-telegram-title">TELEGRAM / 电报</span><span class="env-urgent-tag">URGENT</span></div><div class="env-telegram-content"><div>抵达 <span class="stop">STOP</span></div><div>月明 <span class="stop">STOP</span></div><div>一切平安 <span class="stop">STOP</span></div></div><div class="env-telegram-no">NO. 064912</div><div class="env-postmark"></div>';
              } else if (style.id === 'qiaopi-red-band') {
                details = '<div class="env-red-band"></div><div class="env-qiaopi-char">家书</div><div class="env-stamp"></div><div class="env-postmark"></div><div class="env-vertical-text"><div class="col">木生吾夫亲启</div><div class="col">纸短情长 伏惟珍重</div></div><div class="env-paper-stack"></div>';
              } else if (style.id === 'old-receipt') {
                details = '<div class="env-table-header">民国邮政汇款凭单</div><div class="env-table-line"></div><div class="env-table-line"></div><div class="env-table-line"></div><div class="env-table-line"></div><div class="env-table-line"></div><div class="env-vertical-text"><div class="col">木生吾夫五月二十日收讫平安</div></div><div class="env-postmark"></div>';
              } else if (style.id === 'vertical-photo') {
                details = '<div class="env-photo"></div><div class="env-postmark"></div><div class="env-red-vertical l1"></div><div class="env-red-vertical l2"></div><div class="env-red-vertical l3"></div><div class="env-red-vertical l4"></div><div class="env-red-vertical l5"></div><div class="env-red-vertical l6"></div><div class="env-vertical-text"><div class="col">纸短情长伏惟珍重</div><div class="col">你的家乡被雾笼罩</div></div>';
              } else if (style.id === 'modern-parcel') {
                details = '<div class="env-courier-label"><div class="label-text">SHIP TO</div><div class="label-line"></div><div class="label-line"></div></div><div class="env-barcode"></div><div class="env-fragile-tag">FRAGILE</div><div class="env-tape"></div>';
              }
              return `
              <div class="envelope-style-item ${this.letter.envelopeStyle === style.id ? 'active' : ''}" data-style="${style.id}">
                <div class="meta-envelope ${envClass}">
                  ${details}
                </div>
                <span class="env-style-name">${style.name}</span>
              </div>
              `;
            }).join('')}
          </div>
          <div class="envelope-preview-panel">
            <div class="envelope-preview-header">预览</div>
            <div class="envelope-preview-box">
              <div class="meta-envelope env-${this.letter.envelopeStyle || 'vintage-stamp'}" id="main-envelope-preview"></div>
            </div>
          </div>
        </div>
      </div>
    `;
    paperArea.appendChild(container);

    const recipientInput = document.getElementById('meta-recipient');
    const senderInput = document.getElementById('meta-sender');
    
    recipientInput.readOnly = true;
    recipientInput.title = '点击选择收信人';
    recipientInput.addEventListener('click', () => {
      App._openRecipientPicker(this.letter.mailboxId, recipient => {
        this.letter.recipientAccountKey = recipient.accountKey;
        this.letter.recipient = recipient.identityName || recipient.displayName || recipient.username || recipient.fullName;
        recipientInput.value = this.letter.recipient;
        this.updateTitle();
        this.updateAllWidgets();
        this._renderEnvelopePreview(this.letter.envelopeStyle || 'vintage-stamp');
      });
    });

    if (this.letter.senderAccountKey) {
      senderInput.readOnly = true;
      senderInput.title = '写信身份由当前账号决定';
    }

    senderInput.addEventListener('input', (e) => {
      this.letter.sender = e.target.value;
      this.updateAllWidgets();
      this._renderEnvelopePreview(this.letter.envelopeStyle || 'vintage-stamp');
    });
    document.getElementById('meta-date').addEventListener('input', (e) => {
      this.letter.date = e.target.value;
      this.renderPaper();
      this.updateAllWidgets();
      this._renderEnvelopePreview(this.letter.envelopeStyle || 'vintage-stamp');
    });
    document.getElementById('meta-time').addEventListener('input', (e) => {
      this.letter.time = e.target.value;
      this.renderPaper();
      this.updateAllWidgets();
    });
    document.getElementById('meta-weekday').addEventListener('input', (e) => {
      this.letter.weekday = e.target.value;
      this.renderPaper();
      this.updateAllWidgets();
    });
    document.getElementById('meta-location').addEventListener('input', (e) => {
      this.letter.location = e.target.value;
      this.renderPaper();
      this.updateAllWidgets();
    });
    document.getElementById('meta-letter-title').addEventListener('input', (e) => {
      this.letter.letterTitle = e.target.value;
      this.renderPaper();
      this.updateAllWidgets();
    });

    document.getElementById('meta-address').addEventListener('input', (e) => {
      this.letter.address = e.target.value;
      this._renderEnvelopePreview(this.letter.envelopeStyle || 'vintage-stamp');
    });
    document.getElementById('meta-telegram-content').addEventListener('input', (e) => {
      this.letter.telegramContent = e.target.value;
      this._renderEnvelopePreview(this.letter.envelopeStyle || 'vintage-stamp');
    });
    document.getElementById('meta-vertical-text').addEventListener('input', (e) => {
      this.letter.verticalText = e.target.value;
      this._renderEnvelopePreview(this.letter.envelopeStyle || 'vintage-stamp');
    });

    // 渲染信戳样式选择器
    this._renderStampSelector();
    // 渲染邮戳样式选择器
    this._renderPostmarkSelector();

    // 初始化信封预览内容（右侧面板）
    const initStyle = this.letter.envelopeStyle || 'vintage-stamp';
    this._renderEnvelopePreview(initStyle);
    this._updateFormFieldsVisibility(initStyle);

    // 信封样式选择
    document.querySelectorAll('.envelope-style-item').forEach(item => {
      item.addEventListener('click', () => {
        const styleId = item.dataset.style;
        this.letter.envelopeStyle = styleId;
        document.querySelectorAll('.envelope-style-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        // 更新信封预览
        this._renderEnvelopePreview(styleId);
        this._updateFormFieldsVisibility(styleId);
      });
    });
  },

  _updateFormFieldsVisibility(styleId) {
    const formContainer = document.querySelector('.meta-form-inner');
    if (!formContainer) return;
    
    const allFields = ['recipient', 'sender', 'date', 'time', 'weekday', 'location', 'letter-title', 'address', 'telegram-content', 'vertical-text', 'stamp-style', 'postmark-style'];
    let visibleFields = [];
    
    if (styleId === 'vintage-stamp' || styleId === 'airmail-blue') {
      visibleFields = ['recipient', 'sender', 'date', 'time', 'weekday', 'location', 'letter-title', 'address', 'stamp-style', 'postmark-style'];
    } else if (styleId === 'chinese-kraft' || styleId === 'qiaopi-red-band') {
      visibleFields = ['recipient', 'sender', 'date', 'time', 'weekday', 'location', 'letter-title', 'vertical-text', 'stamp-style', 'postmark-style'];
    } else if (styleId === 'telegram-urgent') {
      visibleFields = ['recipient', 'sender', 'date', 'time', 'weekday', 'location', 'letter-title', 'telegram-content', 'postmark-style'];
    } else if (styleId === 'old-receipt' || styleId === 'vertical-photo') {
      visibleFields = ['recipient', 'sender', 'date', 'time', 'weekday', 'location', 'letter-title', 'vertical-text', 'postmark-style'];
    } else if (styleId === 'modern-parcel') {
      visibleFields = ['recipient', 'sender', 'date', 'time', 'weekday', 'location', 'letter-title', 'address'];
    }
    
    allFields.forEach(field => {
      const el = formContainer.querySelector('.field-' + field);
      if (el) {
        el.style.display = visibleFields.includes(field) ? '' : 'none';
      }
    });
  },

  _renderEnvelopePreview(styleId) {
    const preview = document.getElementById('main-envelope-preview');
    if (preview) {
      this.envelopeStyles.forEach(s => {
        preview.classList.remove('env-' + s.id);
      });
      preview.classList.add('env-' + styleId);
      
      const font = this.fontStyles.find(f => f.id === (this.letter.fontFamily || 'brush-xingkai'));
      const fontFamily = font ? font.family : 'var(--font-brush-xingkai)';
      preview.style.setProperty('--envelope-font', fontFamily);
      
      const recipient = this.letter.recipient || 'Miss Lin Mei';
      const sender = this.letter.sender || '以撒';
      const date = this.letter.date || '2026年7月11日';
      const address = this.letter.address || 'Hengshan Road 18, Shanghai';
      const telegramContent = this.letter.telegramContent || '抵达 STOP 月明 STOP 一切平安 STOP';
      const verticalText = this.letter.verticalText || '纸短情长 伏惟珍重';
      
      const postmarkStyle = this.postmarkStyles.find(s => s.id === this.letter.postmarkStyle) || this.postmarkStyles[0];
      const postmarkContent = postmarkStyle.content;
      const postmarkType = postmarkStyle.type;
      
      const stampStyle = this.stampStyles.find(s => s.id === this.letter.stampStyle) || this.stampStyles[0];
      const stampColor = stampStyle.color;
      const stampBorderColor = stampStyle.borderColor;
      
      const stampStyleAttr = 'style="background:' + stampColor + ';border-color:' + stampBorderColor + '"';
      
      let details = '';
      if (styleId === 'vintage-stamp') {
        const addrLines = address.split(',').map(l => l.trim()).filter(l => l);
        details = '<div class="env-stamp" ' + stampStyleAttr + '></div><div class="env-postmark" data-content="' + postmarkContent + '" data-type="' + postmarkType + '"></div><div class="env-address">';
        details += '<span class="line">' + recipient + '</span>';
        addrLines.forEach(line => details += '<span class="line">' + line + '</span>');
        details += '</div><div class="env-wavy-lines"><span></span><span></span><span></span></div>';
      } else if (styleId === 'airmail-blue') {
        const addrLines = address.split(',').map(l => l.trim()).filter(l => l);
        details = '<div class="env-par-avion">PAR AVION</div><div class="env-stamp" ' + stampStyleAttr + '></div><div class="env-postmark" data-content="' + postmarkContent + '" data-type="' + postmarkType + '"></div><div class="env-address">';
        details += '<span class="line">' + recipient + '</span>';
        addrLines.forEach(line => details += '<span class="line">' + line + '</span>');
        details += '</div>';
      } else if (styleId === 'chinese-kraft') {
        const vtLines = verticalText.split(' ').filter(l => l);
        details = '<div class="env-red-frame"></div><div class="env-stamp" ' + stampStyleAttr + '></div><div class="env-postmark" data-content="' + postmarkContent + '" data-type="' + postmarkType + '"></div><div class="env-vertical-text">';
        details += '<div class="col">' + recipient + '亲启</div>';
        vtLines.forEach(line => details += '<div class="col">' + line + '</div>');
        details += '</div>';
      } else if (styleId === 'telegram-urgent') {
        const tgLines = telegramContent.split('STOP').map(l => l.trim()).filter(l => l);
        details = '<div class="env-telegram-header"><span class="env-telegram-title">TELEGRAM / 电报</span><span class="env-urgent-tag">URGENT</span></div><div class="env-telegram-content">';
        tgLines.forEach(line => details += '<div>' + line + ' <span class="stop">STOP</span></div>');
        details += '</div><div class="env-telegram-no">NO. 064912</div><div class="env-postmark" data-content="' + postmarkContent + '" data-type="' + postmarkType + '"></div>';
      } else if (styleId === 'qiaopi-red-band') {
        const vtLines = verticalText.split(' ').filter(l => l);
        details = '<div class="env-red-band"></div><div class="env-qiaopi-char">家书</div><div class="env-stamp" ' + stampStyleAttr + '></div><div class="env-postmark" data-content="' + postmarkContent + '" data-type="' + postmarkType + '"></div><div class="env-vertical-text">';
        details += '<div class="col">' + recipient + '亲启</div>';
        vtLines.forEach(line => details += '<div class="col">' + line + '</div>');
        details += '</div><div class="env-paper-stack"></div>';
      } else if (styleId === 'old-receipt') {
        details = '<div class="env-table-header">民国邮政汇款凭单</div><div class="env-table-line"></div><div class="env-table-line"></div><div class="env-table-line"></div><div class="env-table-line"></div><div class="env-table-line"></div><div class="env-table-line"></div><div class="env-vertical-text"><div class="col">' + recipient + date + '收讫平安</div></div><div class="env-postmark" data-content="' + postmarkContent + '" data-type="' + postmarkType + '"></div>';
      } else if (styleId === 'vertical-photo') {
        const vtLines = verticalText.split(' ').filter(l => l);
        details = '<div class="env-photo"></div><div class="env-postmark" data-content="' + postmarkContent + '" data-type="' + postmarkType + '"></div><div class="env-red-vertical l1"></div><div class="env-red-vertical l2"></div><div class="env-red-vertical l3"></div><div class="env-red-vertical l4"></div><div class="env-red-vertical l5"></div><div class="env-red-vertical l6"></div><div class="env-vertical-text">';
        vtLines.forEach(line => details += '<div class="col">' + line + '</div>');
        details += '</div>';
      } else if (styleId === 'modern-parcel') {
        details = '<div class="env-courier-label"><div class="label-text">SHIP TO</div><div class="label-line"></div><div class="label-line"></div><div class="label-line"></div></div><div class="env-barcode"></div><div class="env-fragile-tag">FRAGILE</div><div class="env-tape"></div>';
      }
      
      if (this.letter.coverStamps && this.letter.coverStamps.length > 0) {
        console.log('Rendering coverStamps:', this.letter.coverStamps);
        this.letter.coverStamps.forEach(stamp => {
          const svg = MediaHandler.generateStampSVG(stamp.stampType);
          console.log('Stamp SVG for', stamp.stampType, ':', svg.substring(0, 50), '...');
          details += `<div class="env-cover-stamp" data-id="${stamp.id}" style="left:${stamp.x}%;top:${stamp.y}%;transform:translate(-50%, -50%) rotate(${stamp.rotation}deg) scale(${stamp.scale});">${svg}</div>`;
        });
      }
      
      preview.innerHTML = details;
      console.log('Preview innerHTML length:', details.length);
      
      this._setupCoverStampDrag();
    }
  },

  _setupCoverDragAndDrop() {
    const preview = document.getElementById('main-envelope-preview');
    const previewBox = document.querySelector('.envelope-preview-box');
    
    console.log('_setupCoverDragAndDrop called');
    console.log('preview element:', preview);
    console.log('previewBox element:', previewBox);
    
    if (!previewBox) return;
    
    previewBox.addEventListener('dragover', (e) => {
      e.preventDefault();
      previewBox.style.background = 'rgba(179, 59, 63, 0.1)';
      console.log('dragover on previewBox');
    });
    
    previewBox.addEventListener('dragleave', (e) => {
      previewBox.style.background = '';
    });
    
    previewBox.addEventListener('drop', (e) => {
      e.preventDefault();
      previewBox.style.background = '';
      
      const dragType = e.dataTransfer.getData('dragType');
      console.log('drop event, dragType:', dragType);
      
      if (dragType === 'stamp') {
        const stampType = e.dataTransfer.getData('stampType');
        console.log('stampType:', stampType);
        this._addStampToCover(stampType);
      }
    });
  },

  _setupCoverStampDrag() {
    const preview = document.getElementById('main-envelope-preview');
    if (!preview) return;
    
    const stamps = preview.querySelectorAll('.env-cover-stamp');
    stamps.forEach(stampEl => {
      let isDragging = false;
      let startX, startY, startLeft, startTop;
      
      stampEl.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        
        const rect = preview.getBoundingClientRect();
        const stampRect = stampEl.getBoundingClientRect();
        startLeft = ((stampRect.left + stampRect.width / 2) - rect.left) / rect.width * 100;
        startTop = ((stampRect.top + stampRect.height / 2) - rect.top) / rect.height * 100;
        
        document.addEventListener('mousemove', onDrag);
        document.addEventListener('mouseup', onDragEnd);
      });
      
      const onDrag = (e) => {
        if (!isDragging) return;
        
        const rect = preview.getBoundingClientRect();
        const deltaX = (e.clientX - startX) / rect.width * 100;
        const deltaY = (e.clientY - startY) / rect.height * 100;
        
        let newX = startLeft + deltaX;
        let newY = startTop + deltaY;
        
        newX = Math.max(12, Math.min(88, newX));
        newY = Math.max(12, Math.min(88, newY));
        
        const stampId = stampEl.dataset.id;
        const stamp = this.letter.coverStamps?.find(s => s.id === stampId);
        if (stamp) {
          stamp.x = newX;
          stamp.y = newY;
          stampEl.style.left = newX + '%';
          stampEl.style.top = newY + '%';
        }
      };
      
      const onDragEnd = () => {
        isDragging = false;
        document.removeEventListener('mousemove', onDrag);
        document.removeEventListener('mouseup', onDragEnd);
      };
    });
  },

  _renderStampSelector() {
    const grid = document.getElementById('stamp-style-grid');
    if (!grid) return;
    grid.innerHTML = this.stampStyles.map(style => {
      const isActive = this.letter.stampStyle === style.id;
      return `
        <div class="stamp-style-item ${isActive ? 'active' : ''}" data-style="${style.id}" style="background:${style.color};border-color:${style.borderColor}">
          <div class="stamp-thumb"></div>
          <span>${style.name}</span>
        </div>
      `;
    }).join('');
    
    grid.querySelectorAll('.stamp-style-item').forEach(item => {
      item.addEventListener('click', () => {
        this.letter.stampStyle = item.dataset.style;
        grid.querySelectorAll('.stamp-style-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        this._renderEnvelopePreview(this.letter.envelopeStyle || 'vintage-stamp');
      });
    });
  },

  _renderPostmarkSelector() {
    const grid = document.getElementById('postmark-style-grid');
    if (!grid) return;
    grid.innerHTML = this.postmarkStyles.map(style => {
      const isActive = this.letter.postmarkStyle === style.id;
      return `
        <div class="postmark-style-item ${isActive ? 'active' : ''}" data-style="${style.id}">
          <div class="postmark-thumb ${style.type}"></div>
          <span>${style.name}</span>
        </div>
      `;
    }).join('');
    
    grid.querySelectorAll('.postmark-style-item').forEach(item => {
      item.addEventListener('click', () => {
        this.letter.postmarkStyle = item.dataset.style;
        grid.querySelectorAll('.postmark-style-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        this._renderEnvelopePreview(this.letter.envelopeStyle || 'vintage-stamp');
      });
    });
  },

  renderPaper() {
    const canvas = document.getElementById('paper-canvas');
    const paperArea = document.getElementById('paper-area');
    const style = this.paperStyle || 'vintage-literary';
    const verticalStyles = ['chinese-bamboo', 'japanese-vertical', 'red-frame-vertical'];
    const isVertical = verticalStyles.includes(style);

    canvas.className = `paper-canvas paper-${style}`;
    canvas.innerHTML = '';

    if (paperArea) {
      if (isVertical) {
        paperArea.classList.add('paper-area-vertical');
        paperArea.style.direction = 'rtl';
        canvas.style.margin = '0';
        canvas.style.maxWidth = 'none';
        canvas.style.transition = 'none';
      } else {
        paperArea.classList.remove('paper-area-vertical');
        paperArea.style.direction = '';
        canvas.style.margin = '';
        canvas.style.maxWidth = '';
        canvas.style.transition = '';
      }
    }

    if (style === 'chinese-bamboo') {
      this._renderBambooDecorations(canvas);
    }
    if (style === 'warm-desk') {
      this._renderWarmDeskDecorations(canvas);
    }
    if (style === 'scan-manuscript') {
      this._renderScanManuscriptDecorations(canvas);
    }
    if (style === 'red-frame-vertical') {
      this._renderRedFrameDecorations(canvas);
    }
    if (style === 'red-column-brush') {
      this._renderRedColumnDecorations(canvas);
    }
    if (style === '80s-horizontal') {
      this._render80sHorizontalDecorations(canvas);
    }
    if (style === 'red-vertical-column') {
      this._renderRedVerticalColumnDecorations(canvas);
    }
    if (style === 'damaged-vertical') {
      this._renderDamagedVerticalDecorations(canvas);
    }
    if (style === 'torn-short-note') {
      this._renderTornShortNoteDecorations(canvas);
    }
    if (style === 'revision-manuscript') {
      this._renderRevisionManuscriptDecorations(canvas);
    }
    if (style === 'pen-blue-ink') {
      this._renderPenBlueInkDecorations(canvas);
    }
    if (style === 'airmail-thin') {
      this._renderAirmailThinDecorations(canvas);
    }
    if (style === 'master-aged') {
      this._renderMasterAgedDecorations(canvas);
    }

    // 万物送信：编辑已送达/带 journey 的信件时，预览同步呈现信物状态
    if (this.letter && this.letter.journey && this.letter.journey.letterState && window.JourneyEngine) {
      const hasState = Object.values(this.letter.journey.letterState).some(v => (v || 0) > 0.02);
      if (hasState) {
        const st = window.JourneyEngine.stateToCss(this.letter.journey.letterState);
        const el = document.createElement('div');
        el.className = 'letter-journey-overlay';
        for (const [k, v] of Object.entries(st)) el.style.setProperty(k, v);
        ['wear', 'wet', 'burn', 'bite', 'stain', 'fold', 'footprint'].forEach(k => {
          const d = document.createElement('div');
          d.className = 'st-' + k;
          el.appendChild(d);
        });
        canvas.appendChild(el);
      }
    }

    this.renderPaperElements();
  },

  _renderBambooDecorations(canvas) {
    const leftBamboo = document.createElement('div');
    leftBamboo.className = 'bamboo-left-deco';
    leftBamboo.innerHTML = `
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
    `;
    canvas.appendChild(leftBamboo);

    const rightBamboo = document.createElement('div');
    rightBamboo.className = 'bamboo-right-deco';
    rightBamboo.innerHTML = `
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
    `;
    canvas.appendChild(rightBamboo);
  },

  _renderWarmDeskDecorations(canvas) {
    const props = document.createElement('div');
    props.className = 'warm-desk-props';
    props.innerHTML = '✒️';
    canvas.appendChild(props);
  },

  _renderScanManuscriptDecorations(canvas) {
    const fold1 = document.createElement('div');
    fold1.className = 'scan-fold fold-1';
    canvas.appendChild(fold1);
    const fold2 = document.createElement('div');
    fold2.className = 'scan-fold fold-2';
    canvas.appendChild(fold2);
  },

  _renderRedFrameDecorations(canvas) {
    const columns = document.createElement('div');
    columns.className = 'red-frame-columns';
    for (let i = 0; i < 6; i++) {
      const col = document.createElement('div');
      col.className = 'red-frame-column';
      columns.appendChild(col);
    }
    canvas.appendChild(columns);

    const header = document.createElement('div');
    header.className = 'red-frame-header';
    header.textContent = '第 ' + (this.currentPageIndex + 1) + ' 頁';
    canvas.appendChild(header);
  },

  _renderRedColumnDecorations(canvas) {
    const lines = document.createElement('div');
    lines.className = 'red-column-lines';
    for (let i = 0; i < 5; i++) {
      const line = document.createElement('div');
      line.className = 'red-column-line';
      lines.appendChild(line);
    }
    canvas.appendChild(lines);

    const pageNum = document.createElement('div');
    pageNum.className = 'red-column-page-num';
    pageNum.textContent = '— ' + (this.currentPageIndex + 1) + ' —';
    canvas.appendChild(pageNum);
  },

  _render80sHorizontalDecorations(canvas) {
    const envelope = document.createElement('div');
    envelope.className = 'envelope-deco';
    const envText = document.createElement('div');
    envText.style.cssText = 'position:absolute;top:12px;right:18px;font-size:11px;color:#3D2818;font-family:"Ma Shan Zheng","Noto Serif SC",serif;writing-mode:vertical-rl;letter-spacing:3px;transform:rotate(-6deg);';
    envText.textContent = '徐州铜山';
    envelope.appendChild(envText);
    canvas.appendChild(envelope);

    const ruler = document.createElement('div');
    ruler.className = 'ruler-deco';
    canvas.appendChild(ruler);

    const stains = ['s1', 's2', 's3', 's4', 's5'];
    stains.forEach(s => {
      const stain = document.createElement('div');
      stain.className = 'stain-speck ' + s;
      canvas.appendChild(stain);
    });
  },

  _renderRedVerticalColumnDecorations(canvas) {
    const ruler = document.createElement('div');
    ruler.className = 'ruler-side';
    canvas.appendChild(ruler);

    const ovals = ['o1', 'o2', 'o3', 'o4', 'o5'];
    ovals.forEach(o => {
      const oval = document.createElement('div');
      oval.className = 'paper-oval ' + o;
      canvas.appendChild(oval);
    });
  },

  _renderDamagedVerticalDecorations(canvas) {
    const holes = ['h1', 'h2'];
    holes.forEach(h => {
      const hole = document.createElement('div');
      hole.className = 'paper-hole ' + h;
      canvas.appendChild(hole);
    });

    const tapes = ['t1', 't2'];
    tapes.forEach(t => {
      const tape = document.createElement('div');
      tape.className = 'tape-fix ' + t;
      canvas.appendChild(tape);
    });
  },

  _renderTornShortNoteDecorations(canvas) {
    const dateSig = document.createElement('div');
    dateSig.className = 'date-signature';
    dateSig.innerHTML = '2024.05.20<span class="sig-line"></span>';
    canvas.appendChild(dateSig);

    const coffee = document.createElement('div');
    coffee.className = 'coffee-stain';
    canvas.appendChild(coffee);

    const tapeTl = document.createElement('div');
    tapeTl.className = 'tape-top tl';
    canvas.appendChild(tapeTl);

    const tapeTr = document.createElement('div');
    tapeTr.className = 'tape-top tr';
    canvas.appendChild(tapeTr);
  },

  _renderRevisionManuscriptDecorations(canvas) {
    const seal = document.createElement('div');
    seal.className = 'seal-stamp';
    seal.innerHTML = '<div class="seal-inner"></div>';
    canvas.appendChild(seal);

    const marks = ['m1', 'm2', 'm3'];
    marks.forEach(m => {
      const mark = document.createElement('div');
      mark.className = 'pencil-mark ' + m;
      canvas.appendChild(mark);
    });

    const fibers = ['f1', 'f2', 'f3', 'f4', 'f5'];
    fibers.forEach(f => {
      const fiber = document.createElement('div');
      fiber.className = 'paper-fiber ' + f;
      canvas.appendChild(fiber);
    });

    const smudges = ['r1', 'r2'];
    smudges.forEach(r => {
      const smudge = document.createElement('div');
      smudge.className = 'rubber-smudge ' + r;
      canvas.appendChild(smudge);
    });

    const corrections = ['c1', 'c2'];
    corrections.forEach(c => {
      const mark = document.createElement('div');
      mark.className = 'correction-mark ' + c;
      mark.textContent = '改';
      canvas.appendChild(mark);
    });
  },

  _renderPenBlueInkDecorations(canvas) {
    const blobs = ['b1', 'b2', 'b3', 'b4'];
    blobs.forEach(b => {
      const blob = document.createElement('div');
      blob.className = 'ink-blob ' + b;
      canvas.appendChild(blob);
    });

    const pressures = ['p1', 'p2', 'p3'];
    pressures.forEach(p => {
      const pressure = document.createElement('div');
      pressure.className = 'pen-pressure ' + p;
      canvas.appendChild(pressure);
    });

    const fibers = ['f1', 'f2', 'f3', 'f4', 'f5'];
    fibers.forEach(f => {
      const fiber = document.createElement('div');
      fiber.className = 'paper-fiber ' + f;
      canvas.appendChild(fiber);
    });

    const headerLine = document.createElement('div');
    headerLine.className = 'header-line';
    canvas.appendChild(headerLine);
  },

  _renderAirmailThinDecorations(canvas) {
    const stamp = document.createElement('div');
    stamp.className = 'stamp-corner';
    stamp.innerHTML = '<div class="stamp-design"><span class="stamp-value">80</span></div>';
    canvas.appendChild(stamp);

    const postmark = document.createElement('div');
    postmark.className = 'postmark';
    postmark.innerHTML = '<div class="postmark-inner"></div><div class="postmark-text">AIR MAIL</div>';
    canvas.appendChild(postmark);

    const fibers = ['f1', 'f2', 'f3', 'f4', 'f5'];
    fibers.forEach(f => {
      const fiber = document.createElement('div');
      fiber.className = 'paper-fiber ' + f;
      canvas.appendChild(fiber);
    });

    const lines = ['l1', 'l2', 'l3', 'l4'];
    lines.forEach(l => {
      const line = document.createElement('div');
      line.className = 'address-line ' + l;
      canvas.appendChild(line);
    });

    const overlay = document.createElement('div');
    overlay.className = 'transparent-overlay';
    canvas.appendChild(overlay);
  },

  _renderMasterAgedDecorations(canvas) {
    const fibers = ['f1', 'f2', 'f3', 'f4', 'f5'];
    fibers.forEach(f => {
      const fiber = document.createElement('div');
      fiber.className = 'paper-fiber ' + f;
      canvas.appendChild(fiber);
    });

    const tapes = ['t1', 't2', 't3'];
    tapes.forEach(t => {
      const tape = document.createElement('div');
      tape.className = 'tape-fix ' + t;
      tape.innerHTML = '<div class="tape-shine"></div><div class="tape-shadow"></div>';
      canvas.appendChild(tape);
    });

    const specks = ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8'];
    specks.forEach(s => {
      const speck = document.createElement('div');
      speck.className = 'speck ' + s;
      canvas.appendChild(speck);
    });

    const stains = ['a1', 'a2', 'a3'];
    stains.forEach(a => {
      const stain = document.createElement('div');
      stain.className = 'aged-stain ' + a;
      canvas.appendChild(stain);
    });

    const edges = ['e1', 'e2', 'e3'];
    edges.forEach(e => {
      const edge = document.createElement('div');
      edge.className = 'edge-damage ' + e;
      canvas.appendChild(edge);
    });
  },

  renderStyleHeader(canvas, style) {
    const letter = this.letter;
    const dateInfo = this._parseDate(letter.date);
    const timeStr = letter.time || '';
    const weekday = letter.weekday || '';
    const letterTitle = letter.letterTitle || '';
    const recipient = letter.recipient || '';

    switch (style) {
      case 'vintage-literary':
        this._renderVintageHeader(canvas, dateInfo, timeStr, weekday, letterTitle, recipient);
        break;
      case 'modern-minimal':
        this._renderModernHeader(canvas, letter.date, recipient, letterTitle);
        break;
      case 'cute-doodle':
        this._renderCuteHeader(canvas, letter.date, recipient, weekday);
        break;
      case 'japanese-vertical':
        this._renderJapaneseHeader(canvas, letter.date, recipient, weekday);
        break;
      case 'floral':
        this._renderFloralHeader(canvas, letter.date, recipient, letterTitle);
        break;
      case 'night-letter':
        this._renderNightHeader(canvas, dateInfo, timeStr, weekday, recipient);
        break;
      case 'kraft':
        this._renderKraftHeader(canvas, dateInfo, recipient, letter.date);
        break;
      case 'ocean':
        this._renderOceanHeader(canvas, letter.date, recipient, weekday);
        break;
      case 'chinese-bamboo':
        this._renderChineseBambooHeader(canvas, dateInfo, recipient, letter.date, weekday);
        break;
    }
  },

  renderStyleFooter(canvas, style) {
    const letter = this.letter;
    const sender = letter.sender || '';
    const location = letter.location || '';
    const dateStr = letter.date || '';

    switch (style) {
      case 'vintage-literary':
        this._renderVintageFooter(canvas, sender, location);
        break;
      case 'modern-minimal':
        this._renderModernFooter(canvas, sender, location);
        break;
      case 'cute-doodle':
        this._renderCuteFooter(canvas, sender, location);
        break;
      case 'japanese-vertical':
        this._renderJapaneseFooter(canvas, sender, location);
        break;
      case 'floral':
        this._renderFloralFooter(canvas, sender, location);
        break;
      case 'night-letter':
        this._renderNightFooter(canvas, sender, location);
        break;
      case 'kraft':
        this._renderKraftFooter(canvas, sender, location);
        break;
      case 'ocean':
        this._renderOceanFooter(canvas, sender, location);
        break;
      case 'chinese-bamboo':
        this._renderChineseBambooFooter(canvas, sender, location);
        break;
    }
  },

  _renderVintageHeader(canvas, dateInfo, timeStr, weekday, letterTitle, recipient) {
    const dateBlock = document.createElement('div');
    dateBlock.className = 'vintage-date-block';
    dateBlock.innerHTML = `
      <div class="vintage-date-number">${dateInfo.day}</div>
      <div class="vintage-date-month">${dateInfo.month}</div>
      <div class="vintage-date-year">${dateInfo.year}</div>
    `;
    canvas.appendChild(dateBlock);

    if (timeStr || weekday) {
      const timeBox = document.createElement('div');
      timeBox.className = 'vintage-time-box';
      timeBox.innerHTML = `
        ${timeStr ? `<div class="vintage-time">${timeStr}</div>` : ''}
        ${weekday ? `<div class="vintage-weekday">${weekday}</div>` : ''}
      `;
      canvas.appendChild(timeBox);
    }

    if (letterTitle) {
      const titleEl = document.createElement('div');
      titleEl.className = 'vintage-letter-title';
      titleEl.textContent = letterTitle;
      canvas.appendChild(titleEl);
    }

    if (recipient) {
      const recipientEl = document.createElement('div');
      recipientEl.className = 'vintage-recipient';
      recipientEl.textContent = `${recipient}，`;
      canvas.appendChild(recipientEl);
    }
  },

  _renderVintageFooter(canvas, sender, location) {
    if (sender) {
      const signature = document.createElement('div');
      signature.className = 'vintage-signature';
      signature.innerHTML = `
        <div class="signer">${sender}</div>
        ${location ? `<div class="location">${location}</div>` : ''}
      `;
      canvas.appendChild(signature);
    }

    const seal = document.createElement('div');
    seal.className = 'vintage-seal';
    seal.innerHTML = `<svg viewBox="0 0 60 60" width="70" height="70">
      <circle cx="30" cy="30" r="27" fill="none" stroke="#c44" stroke-width="2" opacity="0.5"/>
      <text x="30" y="35" text-anchor="middle" fill="#c44" font-size="14" opacity="0.5" font-family="serif">笺</text>
    </svg>`;
    canvas.appendChild(seal);
  },

  _renderModernHeader(canvas, date, recipient, letterTitle) {
    const header = document.createElement('div');
    header.className = 'style-header modern-header';
    header.innerHTML = `
      <div class="modern-date">${date || ''}</div>
      ${letterTitle ? `<div class="modern-title">${letterTitle}</div>` : ''}
      ${recipient ? `<div class="modern-recipient">致 ${recipient}</div>` : ''}
    `;
    canvas.appendChild(header);
  },

  _renderModernFooter(canvas, sender, location) {
    if (!sender) return;
    const footer = document.createElement('div');
    footer.className = 'style-footer modern-footer';
    footer.innerHTML = `
      ${location ? `<div class="modern-location">${location}</div>` : ''}
      <div class="modern-sender">${sender}</div>
    `;
    canvas.appendChild(footer);
  },

  _renderCuteHeader(canvas, date, recipient, weekday) {
    const header = document.createElement('div');
    header.className = 'style-header cute-header';
    header.innerHTML = `
      <div class="cute-header-deco">✿ ♡ ✿</div>
      <div class="cute-date">${date || ''} ${weekday || ''}</div>
      ${recipient ? `<div class="cute-recipient">致 ${recipient} ♡</div>` : ''}
    `;
    canvas.appendChild(header);
  },

  _renderCuteFooter(canvas, sender, location) {
    const footer = document.createElement('div');
    footer.className = 'style-footer cute-footer';
    footer.innerHTML = `
      <div class="cute-footer-deco">~(◕‿◕)~</div>
      ${location ? `<div class="cute-location">📍 ${location}</div>` : ''}
      ${sender ? `<div class="cute-sender">${sender} 敬上</div>` : ''}
      <div class="cute-footer-deco">♡ ✿ ♡</div>
    `;
    canvas.appendChild(footer);
  },

  _renderJapaneseHeader(canvas, date, recipient, weekday) {
    const header = document.createElement('div');
    header.className = 'style-header japanese-header';
    header.innerHTML = `
      <div class="japanese-date">${date || ''} ${weekday || ''}</div>
      ${recipient ? `<div class="japanese-recipient">${recipient} 様</div>` : ''}
      <div class="japanese-greeting">謹啓</div>
    `;
    canvas.appendChild(header);
  },

  _renderJapaneseFooter(canvas, sender, location) {
    const footer = document.createElement('div');
    footer.className = 'style-footer japanese-footer';
    footer.innerHTML = `
      <div class="japanese-closing">敬具</div>
      ${location ? `<div class="japanese-location">${location}</div>` : ''}
      ${sender ? `<div class="japanese-sender">${sender} 筆</div>` : ''}
    `;
    canvas.appendChild(footer);
  },

  _renderFloralHeader(canvas, date, recipient, letterTitle) {
    const header = document.createElement('div');
    header.className = 'style-header floral-header';
    header.innerHTML = `
      <div class="floral-divider-top">✿ ❀ ✿ ❀ ✿</div>
      <div class="floral-date">${date || ''}</div>
      ${letterTitle ? `<div class="floral-title">${letterTitle}</div>` : ''}
      ${recipient ? `<div class="floral-recipient">致 ${recipient}</div>` : ''}
    `;
    canvas.appendChild(header);
  },

  _renderFloralFooter(canvas, sender, location) {
    const footer = document.createElement('div');
    footer.className = 'style-footer floral-footer';
    footer.innerHTML = `
      ${location ? `<div class="floral-location">📍 ${location}</div>` : ''}
      ${sender ? `<div class="floral-sender">${sender}</div>` : ''}
      <div class="floral-divider-bottom">❀ ✿ ❀ ✿ ❀</div>
    `;
    canvas.appendChild(footer);
  },

  _renderNightHeader(canvas, dateInfo, timeStr, weekday, recipient) {
    const header = document.createElement('div');
    header.className = 'style-header night-header';
    header.innerHTML = `
      <div class="night-moon">🌙</div>
      <div class="night-date">
        <span class="night-day">${dateInfo.day}</span>
        <span class="night-month-year">${dateInfo.month} ${dateInfo.year}</span>
      </div>
      <div class="night-time">${timeStr || ''} ${weekday || ''}</div>
      ${recipient ? `<div class="night-recipient">✦ 致 ${recipient} ✦</div>` : ''}
    `;
    canvas.appendChild(header);
  },

  _renderNightFooter(canvas, sender, location) {
    const footer = document.createElement('div');
    footer.className = 'style-footer night-footer';
    footer.innerHTML = `
      <div class="night-stars">✦ ✧ ✦ ✧ ✦</div>
      ${location ? `<div class="night-location">📍 ${location}</div>` : ''}
      ${sender ? `<div class="night-sender">${sender}</div>` : ''}
      <div class="night-end">✨ 晚安 ✨</div>
    `;
    canvas.appendChild(footer);
  },

  _renderKraftHeader(canvas, dateInfo, recipient, dateStr) {
    const header = document.createElement('div');
    header.className = 'style-header kraft-header';
    header.innerHTML = `
      <div class="kraft-stamp">${dateInfo.day || ''}</div>
      <div class="kraft-date">${dateStr || ''}</div>
      ${recipient ? `<div class="kraft-recipient">致 ${recipient}：</div>` : ''}
      <div class="kraft-line"></div>
    `;
    canvas.appendChild(header);
  },

  _renderKraftFooter(canvas, sender, location) {
    const footer = document.createElement('div');
    footer.className = 'style-footer kraft-footer';
    footer.innerHTML = `
      <div class="kraft-line-bottom"></div>
      ${location ? `<div class="kraft-location">📍 ${location}</div>` : ''}
      ${sender ? `<div class="kraft-sender">${sender} 手书</div>` : ''}
      <div class="kraft-wax-seal">
        <svg viewBox="0 0 60 60" width="60" height="60">
          <circle cx="30" cy="30" r="25" fill="#8b4513" opacity="0.4"/>
          <text x="30" y="36" text-anchor="middle" fill="#5c3317" font-size="12" font-family="serif">信</text>
        </svg>
      </div>
    `;
    canvas.appendChild(footer);
  },

  _renderOceanHeader(canvas, date, recipient, weekday) {
    const header = document.createElement('div');
    header.className = 'style-header ocean-header';
    header.innerHTML = `
      <div class="ocean-shells">🐚 🐚 🐚</div>
      <div class="ocean-date">${date || ''} ${weekday || ''}</div>
      ${recipient ? `<div class="ocean-recipient">致 ${recipient}</div>` : ''}
      <div class="ocean-wave-divider">
        <svg viewBox="0 0 300 20" preserveAspectRatio="none">
          <path d="M0,10 Q37.5,0 75,10 T150,10 T225,10 T300,10 L300,20 L0,20 Z" fill="#87ceeb" opacity="0.3"/>
        </svg>
      </div>
    `;
    canvas.appendChild(header);
  },

  _renderOceanFooter(canvas, sender, location) {
    const footer = document.createElement('div');
    footer.className = 'style-footer ocean-footer';
    footer.innerHTML = `
      <div class="ocean-wave-divider-bottom">
        <svg viewBox="0 0 300 20" preserveAspectRatio="none">
          <path d="M0,10 Q37.5,0 75,10 T150,10 T225,10 T300,10 L300,20 L0,20 Z" fill="#4682b4" opacity="0.25"/>
        </svg>
      </div>
      ${location ? `<div class="ocean-location">📍 ${location}</div>` : ''}
      ${sender ? `<div class="ocean-sender">${sender}</div>` : ''}
      <div class="ocean-footer-deco">⚓ 🐚 ⚓</div>
    `;
    canvas.appendChild(footer);
  },

  _renderChineseBambooHeader(canvas, dateInfo, recipient, dateStr, weekday) {
    const header = document.createElement('div');
    header.className = 'style-header chinese-bamboo-header';
    header.innerHTML = `
      <div class="chinese-date">${dateStr || ''} ${weekday || ''}</div>
      ${recipient ? `<div class="chinese-recipient">${recipient} 親啟</div>` : ''}
      <div class="chinese-greeting">敬啟者</div>
    `;
    canvas.appendChild(header);
  },

  _renderChineseBambooFooter(canvas, sender, location) {
    const footer = document.createElement('div');
    footer.className = 'style-footer chinese-bamboo-footer';
    footer.innerHTML = `
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
    `;
    canvas.appendChild(footer);
  },

  _parseDate(dateStr) {
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
      result.month = dateStr;
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

  renderPaperElements() {
    const canvas = document.getElementById('paper-canvas');
    // 保留 header/footer，移除旧的 elements
    canvas.querySelectorAll('.paper-element').forEach(el => el.remove());

    this.elements.forEach(elem => {
      const el = this.createElementDOM(elem);
      canvas.appendChild(el);
      // 同步元素的实际尺寸
      elem.height = el.offsetHeight;
      elem.width = el.offsetWidth;
    });

    this.adjustPaperSize();
    this.renderLayersList();
  },

  renderLayersList() {
    const list = document.getElementById('layers-list');
    const countEl = document.getElementById('elem-count');
    if (!list || !countEl) return;

    let displayElements = [...this.elements];
    
    if (this.currentMode === 'cover') {
      const coverElements = this._getCoverElements();
      displayElements = [...displayElements, ...coverElements];
    }

    countEl.textContent = displayElements.length;

    if (displayElements.length === 0) {
      list.innerHTML = '<div class="layer-empty">暂无元素</div>';
      return;
    }

    const widgetIcons = {
      'widget-date': '🗓',
      'widget-time': '⏰',
      'widget-weekday': '📅',
      'widget-time-weekday': '⏱️',
      'widget-recipient': '👤',
      'widget-sender': '✍️',
      'widget-signature': '🖋',
      'widget-location': '📍',
      'widget-title': '📄',
      'widget-year-planner': '📆',
      'widget-monthly': '📅',
      'widget-weekly': '📆',
      'widget-daily': '📋'
    };

    const typeNames = {
      text: '文字',
      image: '图片',
      voice: '语音',
      video: '视频',
      stamp: '贴纸',
      doodle: '涂鸦',
      'widget-date': '日期',
      'widget-time': '时间',
      'widget-weekday': '星期',
      'widget-time-weekday': '时间星期',
      'widget-recipient': '收信人',
      'widget-sender': '写信人',
      'widget-signature': '签名',
      'widget-location': '地点',
      'widget-title': '信件标题',
      'widget-year-planner': '年度计划',
      'widget-monthly': '月计划',
      'cover-recipient': '收信人',
      'cover-sender': '写信人',
      'cover-date': '日期',
      'cover-time': '时间',
      'cover-weekday': '星期',
      'cover-location': '地点',
      'cover-title': '信件标题',
      'cover-address': '地址',
      'cover-vertical-text': '竖排文字',
      'cover-stamp': '信戳',
      'cover-postmark': '邮戳',
      'cover-sticker': '封面贴纸'
    };

    const getElementName = (elem) => {
      if (elem.type && elem.type.startsWith('cover-')) {
        return elem.text || typeNames[elem.type] || '封面元素';
      }
      if (elem.type === 'text' && elem.text) {
        return elem.text.slice(0, 12);
      }
      if (elem.type === 'stamp' && elem.stampType) {
        const stampNames = {
          'heart': '爱心贴纸',
          'flower-pink': '粉色花朵',
          'flower-yellow': '黄色小花',
          'rose': '玫瑰',
          'leaf': '绿叶',
          'star': '星星',
          'cloud': '云朵',
          'rainbow': '彩虹',
          'umbrella': '雨伞',
          'snowflake': '雪花',
          'apple': '苹果',
          'strawberry': '草莓',
          'key': '钥匙',
          'coffee': '咖啡',
          'candle': '蜡烛',
          'arrow': '箭头',
          'butterfly': '蝴蝶',
          'envelope': '信封',
          'feather': '羽毛'
        };
        return stampNames[elem.stampType] || '贴纸';
      }
      if (elem.type === 'image') {
        return '图片';
      }
      if (elem.type === 'voice') {
        return '语音片段';
      }
      if (elem.type === 'doodle') {
        return '涂鸦';
      }
      return typeNames[elem.type] || elem.type;
    };

    const coverIcons = {
      'cover-recipient': '👤',
      'cover-sender': '✍️',
      'cover-date': '🗓',
      'cover-time': '⏰',
      'cover-weekday': '📆',
      'cover-location': '📍',
      'cover-title': '📄',
      'cover-address': '🏠',
      'cover-vertical-text': '📜',
      'cover-stamp': '🔖',
      'cover-postmark': '🔘',
      'cover-sticker': '🎨'
    };

    const getElementIcon = (elem) => {
      if (elem.type && elem.type.startsWith('cover-')) {
        return `<span class="layer-icon cover-icon">${coverIcons[elem.type] || '✉'}</span>`;
      }
      if (elem.type === 'stamp' && elem.stampType) {
        const svg = MediaHandler.generateStampSVG(elem.stampType);
        return `<span class="layer-icon layer-icon-stamp">${svg}</span>`;
      }
      if (elem.type === 'text') {
        return '<span class="layer-icon">📝</span>';
      }
      if (elem.type === 'image') {
        return '<span class="layer-icon">🖼</span>';
      }
      if (elem.type === 'voice') {
        return '<span class="layer-icon">🎤</span>';
      }
      if (elem.type === 'video') {
        return '<span class="layer-icon">🎬</span>';
      }
      if (elem.type === 'doodle') {
        return '<span class="layer-icon">✏️</span>';
      }
      if (elem.type && elem.type.startsWith('widget-')) {
        return `<span class="layer-icon">${widgetIcons[elem.type] || '📦'}</span>`;
      }
      return '<span class="layer-icon">📦</span>';
    };

    const reversed = [...displayElements].reverse();
    list.innerHTML = reversed.map((elem, idx) => {
      const name = getElementName(elem);
      const icon = getElementIcon(elem);
      const isCover = elem._isCoverElement ? 'cover-element' : '';
      return `
        <div class="layer-item ${this.selectedId === elem.id ? 'active' : ''} ${isCover}" data-id="${elem.id}" data-type="${elem.type}">
          ${icon}
          <span class="layer-name">${name}</span>
        </div>
      `;
    }).join('');

    list.querySelectorAll('.layer-item').forEach(item => {
      item.addEventListener('click', () => {
        const id = item.dataset.id;
        const type = item.dataset.type;
        if (type && type.startsWith('cover-')) {
          this._selectCoverElement(type, id);
        } else {
          this.selectElement(id);
        }
      });
    });
  },

  _getCoverElements() {
    const elements = [];
    
    if (this.letter.recipient) {
      elements.push({ id: 'cover-recipient', type: 'cover-recipient', text: this.letter.recipient, _isCoverElement: true });
    }
    if (this.letter.sender) {
      elements.push({ id: 'cover-sender', type: 'cover-sender', text: this.letter.sender, _isCoverElement: true });
    }
    if (this.letter.date) {
      elements.push({ id: 'cover-date', type: 'cover-date', text: this.letter.date, _isCoverElement: true });
    }
    if (this.letter.time) {
      elements.push({ id: 'cover-time', type: 'cover-time', text: this.letter.time, _isCoverElement: true });
    }
    if (this.letter.weekday) {
      elements.push({ id: 'cover-weekday', type: 'cover-weekday', text: this.letter.weekday, _isCoverElement: true });
    }
    if (this.letter.location) {
      elements.push({ id: 'cover-location', type: 'cover-location', text: this.letter.location, _isCoverElement: true });
    }
    if (this.letter.letterTitle) {
      elements.push({ id: 'cover-title', type: 'cover-title', text: this.letter.letterTitle, _isCoverElement: true });
    }
    if (this.letter.address) {
      elements.push({ id: 'cover-address', type: 'cover-address', text: this.letter.address, _isCoverElement: true });
    }
    if (this.letter.verticalText) {
      elements.push({ id: 'cover-vertical-text', type: 'cover-vertical-text', text: this.letter.verticalText, _isCoverElement: true });
    }
    if (this.letter.stampStyle) {
      elements.push({ id: 'cover-stamp', type: 'cover-stamp', text: '信戳', _isCoverElement: true });
    }
    if (this.letter.postmarkStyle) {
      elements.push({ id: 'cover-postmark', type: 'cover-postmark', text: '邮戳', _isCoverElement: true });
    }
    
    if (this.letter.coverStamps && this.letter.coverStamps.length > 0) {
      const stampNames = {
        'flower': '花朵',
        'cherry_blossom': '樱花',
        'sunflower': '向日葵',
        'tulip': '郁金香',
        'leaf': '绿叶',
        'heart': '爱心',
        'sparkling_heart': '闪亮爱心',
        'star': '星星',
        'moon': '月亮',
        'cloud': '云朵',
        'rainbow': '彩虹',
        'rain': '雨滴',
        'snowflake': '雪花',
        'bird': '小鸟',
        'strawberry': '草莓',
        'apple': '苹果',
        'cherry': '樱桃',
        'envelope': '信封',
        'feather': '羽毛',
        'key': '钥匙',
        'coffee': '咖啡',
        'candle': '蜡烛',
        'arrow': '箭头',
        'ribbon': '丝带',
        'ampersand': '符号'
      };
      
      this.letter.coverStamps.forEach(stamp => {
        elements.push({ 
          id: stamp.id, 
          type: 'cover-sticker', 
          text: stampNames[stamp.stampType] || '贴纸',
          stampType: stamp.stampType,
          _isCoverElement: true 
        });
      });
    }
    
    return elements;
  },

  _selectCoverElement(type, id) {
    const fieldMap = {
      'cover-recipient': 'meta-recipient',
      'cover-sender': 'meta-sender',
      'cover-date': 'meta-date',
      'cover-time': 'meta-time',
      'cover-weekday': 'meta-weekday',
      'cover-location': 'meta-location',
      'cover-title': 'meta-letter-title',
      'cover-address': 'meta-address',
      'cover-vertical-text': 'meta-vertical-text',
      'cover-stamp': 'stamp-style-grid',
      'cover-postmark': 'postmark-style-grid'
    };
    
    if (type === 'cover-sticker' && id) {
      if (confirm('确定要删除这个封面贴纸吗？')) {
        if (this.letter.coverStamps) {
          this.letter.coverStamps = this.letter.coverStamps.filter(s => s.id !== id);
        }
        this._renderEnvelopePreview(this.letter.envelopeStyle);
        this.renderLayersList();
      }
      return;
    }
    
    const fieldId = fieldMap[type];
    if (fieldId) {
      const input = document.getElementById(fieldId);
      if (input) {
        input.focus();
        input.scrollIntoView({ behavior: 'smooth', block: 'center' });
        input.classList.add('highlight');
        setTimeout(() => input.classList.remove('highlight'), 2000);
      }
    }
  },

  _addStampToCover(stampType) {
    console.log('_addStampToCover called with:', stampType);
    
    if (!this.letter.coverStamps) {
      this.letter.coverStamps = [];
    }
    
    const newStamp = {
      id: 'cover-stamp-' + Date.now(),
      stampType: stampType,
      x: 20 + Math.random() * 60,
      y: 20 + Math.random() * 60,
      rotation: Math.random() * 20 - 10,
      scale: 0.6 + Math.random() * 0.3
    };
    
    console.log('newStamp:', newStamp);
    this.letter.coverStamps.push(newStamp);
    console.log('coverStamps array:', this.letter.coverStamps);
    
    this._renderEnvelopePreview(this.letter.envelopeStyle);
    this.renderLayersList();
    this._setupCoverStampDrag();
  },

  adjustPaperSize() {
    const canvas = document.getElementById('paper-canvas');
    const paperArea = document.getElementById('paper-area');
    if (!canvas) return;

    const style = this.paperStyle || 'vintage-literary';
    const verticalStyles = ['chinese-bamboo', 'japanese-vertical', 'red-frame-vertical'];
    const isVertical = verticalStyles.includes(style);

    if (isVertical) {
      const baseMinWidth = 900;
      const leftPadding = 80;
      const rightPadding = 80;
      const expandStep = 200;
      let minLeft = Infinity;
      let maxRight = 0;

      this.elements.forEach(elem => {
        const el = canvas.querySelector(`[data-id="${elem.id}"]`);
        let elemWidth = elem.width || 100;
        let elemX = elem.x || 0;
        if (el) {
          elemWidth = el.offsetWidth;
          elem.height = el.offsetHeight;
          elem.width = elemWidth;
        }
        if (elemX < minLeft) minLeft = elemX;
        const elemRight = elemX + elemWidth;
        if (elemRight > maxRight) maxRight = elemRight;
      });

      if (this.elements.length === 0) {
        minLeft = 0;
        maxRight = 0;
      }

      const finalHeight = (style === 'chinese-bamboo' ? 1300 : 1200);
      let currentWidth = canvas.offsetWidth;
      let totalDelta = 0;

      if (minLeft < leftPadding) {
        const needExpand = leftPadding - minLeft + expandStep;
        const expandAmount = Math.ceil(needExpand / expandStep) * expandStep;
        const newWidth = currentWidth + expandAmount;
        const deltaW = newWidth - currentWidth;

        this.elements.forEach(elem => {
          elem.x = (elem.x || 0) + deltaW;
          const el = canvas.querySelector(`[data-id="${elem.id}"]`);
          if (el) {
            el.style.left = elem.x + 'px';
          }
        });

        totalDelta += deltaW;
        canvas.style.minWidth = newWidth + 'px';
        currentWidth = newWidth;
      }

      if (maxRight + rightPadding > currentWidth) {
        const rightExpand = maxRight + rightPadding - currentWidth;
        const expandAmount = Math.ceil(rightExpand / expandStep) * expandStep;
        const newWidth = currentWidth + expandAmount;
        canvas.style.minWidth = newWidth + 'px';
      }

      const currentMinHeight = canvas.style.minHeight;
      const newMinHeight = finalHeight + 'px';
      if (currentMinHeight !== newMinHeight) {
        canvas.style.minHeight = newMinHeight;
      }
      if (!canvas.style.minWidth) {
        canvas.style.minWidth = baseMinWidth + 'px';
      }
    } else {
      let baseMinHeight = 900;
      if (style === 'chinese-bamboo') {
        baseMinHeight = 1000;
      }

      let maxBottom = baseMinHeight;
      const padding = 100;

      this.elements.forEach(elem => {
        const el = canvas.querySelector(`[data-id="${elem.id}"]`);
        let elemHeight = elem.height || 200;
        if (el) {
          elemHeight = el.offsetHeight;
          elem.height = elemHeight;
          elem.width = el.offsetWidth;
        }
        const elemBottom = (elem.y || 0) + elemHeight;
        if (elemBottom + padding > maxBottom) {
          maxBottom = elemBottom + padding;
        }
      });

      const newMinHeight = maxBottom + 'px';
      if (canvas.style.minHeight !== newMinHeight) {
        canvas.style.minHeight = newMinHeight;
      }
      if (canvas.style.minWidth) {
        canvas.style.minWidth = '';
      }
      if (canvas.style.maxWidth) {
        canvas.style.maxWidth = '';
      }
    }
  },

  createElementDOM(elem) {
    const div = document.createElement('div');
    div.className = 'paper-element element-' + elem.type;
    div.dataset.id = elem.id;
    div.style.left = (elem.x || 0) + 'px';
    div.style.top = (elem.y || 0) + 'px';

    if (elem.rotation) {
      div.style.transform = `rotate(${elem.rotation}deg)`;
    }

    let inner = '';
    switch (elem.type) {
      case 'text':
        div.classList.add('element-text');
        div.style.fontSize = (elem.fontSize || 16) + 'px';
        div.style.fontWeight = elem.bold ? 'bold' : 'normal';
        div.style.fontStyle = elem.italic ? 'italic' : 'normal';
        const fontFamily = elem.fontFamily || this._getDefaultFontFamily() || 'inherit';
        div.style.setProperty('font-family', fontFamily, 'important');
        div.style.minWidth = '100px';
        div.style.minHeight = '30px';
        if (elem.vertical) {
          div.style.writingMode = 'vertical-rl';
          div.style.textOrientation = 'mixed';
          div.style.minWidth = '30px';
          div.style.minHeight = '100px';
        }
        div.innerHTML = (elem.text || '').replace(/\n/g, '<br>') +
          '<div class="resize-handle"></div><div class="rotate-handle">↻</div>';
        break;
      case 'image':
        div.classList.add('element-image');
        div.style.width = (elem.width || 200) + 'px';
        inner = `<div class="${ImageFrames.className(elem.frameStyle)}"><img src="${elem.src}" alt="信件图片"></div><div class="resize-handle"></div><div class="rotate-handle">↻</div>`;
        div.innerHTML = inner;
        break;
      case 'voice':
        div.classList.add('element-voice');
        div.style.minWidth = '180px';
        const dur = elem.duration || 0;
        const dm = Math.floor(dur / 60);
        const ds = dur % 60;
        inner = `
          <span class="voice-icon">🎤</span>
          <button class="voice-play-btn" data-src="${elem.src || ''}">▶</button>
          <span class="voice-duration">${dm}:${String(ds).padStart(2, '0')}</span>
          <div class="resize-handle"></div>`;
        div.innerHTML = inner + '<div class="rotate-handle">↻</div>';
        break;
      case 'video':
        div.classList.add('element-video');
        div.style.width = (elem.width || 300) + 'px';
        inner = `<video src="${elem.src}" controls preload="metadata"></video><div class="resize-handle"></div><div class="rotate-handle">↻</div>`;
        div.innerHTML = inner;
        break;
      case 'stamp':
        div.classList.add('element-stamp');
        div.innerHTML = MediaHandler.generateStampSVG(elem.stampType) +
          '<div class="resize-handle"></div><div class="rotate-handle">↻</div>';
        break;
      case 'widget-date':
        div.classList.add('element-widget', 'element-widget-date');
        const dateInfo = this._parseDateInfo(this.letter.date);
        div.innerHTML = `
          <div class="widget-date-block">
            <div class="widget-date-day">${dateInfo.day || '日'}</div>
            <div class="widget-date-month">${dateInfo.month || '月'}</div>
            <div class="widget-date-year">${dateInfo.year || '年'}</div>
          </div>
          <div class="resize-handle"></div><div class="rotate-handle">↻</div>`;
        break;
      case 'widget-time':
        div.classList.add('element-widget', 'element-widget-time');
        const timeValue = this.getWidgetValue('widget-time');
        div.innerHTML = `
          <div class="widget-time-box">
            <div class="widget-time">${timeValue || '时间'}</div>
          </div>
          <div class="resize-handle"></div><div class="rotate-handle">↻</div>`;
        break;
      case 'widget-weekday':
        div.classList.add('element-widget', 'element-widget-weekday');
        const weekdayValue = this.getWidgetValue('widget-weekday');
        div.innerHTML = `
          <div class="widget-weekday-box">
            <div class="widget-weekday">${weekdayValue || '星期'}</div>
          </div>
          <div class="resize-handle"></div><div class="rotate-handle">↻</div>`;
        break;
      case 'widget-recipient':
        div.classList.add('element-widget', 'element-widget-recipient');
        const recipientValue = this.getWidgetValue('widget-recipient');
        div.innerHTML = `<div class="widget-recipient"><span class="widget-content">${recipientValue}</span>，</div>
          <div class="resize-handle"></div><div class="rotate-handle">↻</div>`;
        break;
      case 'widget-sender':
        div.classList.add('element-widget', 'element-widget-sender');
        const senderValue = this.getWidgetValue('widget-sender');
        div.innerHTML = `
          <div class="widget-sender-block">
            <div class="widget-signer">${senderValue || '写信人'}</div>
          </div>
          <div class="widget-seal">
            <svg viewBox="0 0 60 60" width="70" height="70">
              <circle cx="30" cy="30" r="27" fill="none" stroke="#c44" stroke-width="2" opacity="0.5"/>
              <text x="30" y="35" text-anchor="middle" fill="#c44" font-size="14" opacity="0.5" font-family="serif">笺</text>
            </svg>
          </div>
          <div class="resize-handle"></div><div class="rotate-handle">↻</div>`;
        break;
      case 'widget-location':
        div.classList.add('element-widget', 'element-widget-location');
        const locationValue = this.getWidgetValue('widget-location');
        div.innerHTML = `<div class="widget-location"><span class="widget-content">${locationValue}</span></div>
          <div class="resize-handle"></div><div class="rotate-handle">↻</div>`;
        break;
      case 'widget-title':
        div.classList.add('element-widget', 'element-widget-title');
        const titleValue = this.getWidgetValue('widget-title');
        div.innerHTML = `<div class="widget-title"><span class="widget-content">${titleValue}</span></div>
          <div class="resize-handle"></div><div class="rotate-handle">↻</div>`;
        break;
      case 'widget-time-weekday':
        div.classList.add('element-widget', 'element-widget-time-weekday');
        const twTime = this.getWidgetValue('widget-time');
        const twWeekday = this.getWidgetValue('widget-weekday');
        div.innerHTML = `
          <div class="widget-time-weekday-box">
            <div class="widget-tw-time">${twTime || '时间'}</div>
            <div class="widget-tw-weekday">${twWeekday || '星期'}</div>
          </div>
          <div class="resize-handle"></div><div class="rotate-handle">↻</div>`;
        break;
      case 'widget-signature':
        div.classList.add('element-widget', 'element-widget-signature');
        const sigSender = this.getWidgetValue('widget-sender');
        const sigLocation = this.getWidgetValue('widget-location');
        div.innerHTML = `
          <div class="widget-signature-block">
            <div class="widget-signer-name">${sigSender || '写信人'}</div>
            ${sigLocation ? `<div class="widget-signer-location">${sigLocation}</div>` : ''}
          </div>
          <div class="widget-sig-seal">
            <svg viewBox="0 0 60 60" width="70" height="70">
              <circle cx="30" cy="30" r="27" fill="none" stroke="#c44" stroke-width="2" opacity="0.5"/>
              <text x="30" y="35" text-anchor="middle" fill="#c44" font-size="14" opacity="0.5" font-family="serif">笺</text>
            </svg>
          </div>
          <div class="resize-handle"></div><div class="rotate-handle">↻</div>`;
        break;
      case 'widget-year-planner':
        div.classList.add('element-widget', 'element-widget-year-planner', 'year-planner-widget');
        div.style.width = '650px';
        div.style.minHeight = '800px';
        div.innerHTML = '<div class="year-planner-inner"></div><div class="resize-handle"></div><div class="rotate-handle">↻</div>';
        this.renderYearPlanner(elem, div);
        break;
      case 'widget-monthly':
        div.classList.add('element-widget', 'element-widget-monthly', 'monthly-planner-widget');
        div.style.width = '580px';
        div.style.minHeight = '880px';
        div.innerHTML = '<div class="monthly-planner-inner"></div><div class="resize-handle"></div><div class="rotate-handle">↻</div>';
        this.renderMonthlyPlanner(elem, div);
        break;
      case 'widget-weekly':
        div.classList.add('element-widget', 'element-widget-weekly', 'weekly-planner-widget');
        div.style.width = '520px';
        div.style.minHeight = '820px';
        div.innerHTML = '<div class="weekly-planner-inner"></div><div class="resize-handle"></div><div class="rotate-handle">↻</div>';
        this.renderWeeklyPlanner(elem, div);
        break;
      case 'widget-daily':
        div.classList.add('element-widget', 'element-widget-daily', 'daily-planner-widget');
        div.style.width = '480px';
        div.style.minHeight = '780px';
        div.innerHTML = '<div class="daily-planner-inner"></div><div class="resize-handle"></div><div class="rotate-handle">↻</div>';
        this.renderDailyPlanner(elem, div);
        break;
    }

    // 事件绑定
    div.addEventListener('mousedown', (e) => this.onElementMouseDown(e, elem.id));
    div.addEventListener('touchstart', (e) => this.onElementTouchStart(e, elem.id), { passive: false });
    div.addEventListener('click', (e) => {
      if (!this.dragState) {
        this.selectElement(elem.id);
      }
    });

    // 语音播放按钮
    if (elem.type === 'voice') {
      const playBtn = div.querySelector('.voice-play-btn');
      if (playBtn) {
        playBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (elem.src) {
            const audio = new Audio(elem.src);
            audio.play();
            playBtn.textContent = '⏸';
            audio.onended = () => { playBtn.textContent = '▶'; };
          }
        });
      }
    }

    // 年度计划组件内部元素阻止冒泡
    if (elem.type === 'widget-year-planner') {
      this._bindYearPlannerInnerEvents(div);
    }

    // 月计划组件内部元素阻止冒泡
    if (elem.type === 'widget-monthly') {
      this._bindMonthlyPlannerInnerEvents(div);
    }

    // 周计划组件内部元素阻止冒泡
    if (elem.type === 'widget-weekly') {
      this._bindWeeklyPlannerInnerEvents(div);
    }

    // 日计划组件内部元素阻止冒泡
    if (elem.type === 'widget-daily') {
      this._bindDailyPlannerInnerEvents(div);
    }

    // 文字编辑
    if (elem.type === 'text') {
      const textDiv = div.querySelector('.element-text');
      // contenteditable handled by click
    }

    // 图片加载完成后固定高度
    if (elem.type === 'image') {
      const img = div.querySelector('img');
      if (img) {
        img.addEventListener('load', () => {
          const ratio = img.naturalHeight / img.naturalWidth;
          div.style.height = ((elem.width || 200) * ratio) + 'px';
        });
      }
    }

    return div;
  },
};

/* ========================================
   Editor Core Extension
   ======================================== */

Object.assign(Editor, {
  selectElement(id) {
    document.querySelectorAll('.paper-element.selected').forEach(el => {
      el.classList.remove('selected');
      el.style.zIndex = '';
    });
    this.selectedId = id;

    const layerActions = document.getElementById('layer-actions');
    if (layerActions) layerActions.style.display = id ? 'block' : 'none';

    const alignActions = document.getElementById('align-actions');
    if (alignActions) alignActions.style.display = id ? 'block' : 'none';

    if (id) {
      const el = document.querySelector(`.paper-element[data-id="${id}"]`);
      if (el) {
        el.classList.add('selected');
        el.style.zIndex = '100';
      }
      this.renderPropertyPanel(id);
    } else {
      document.getElementById('property-content').innerHTML = '<p class="hint">选择信纸上的元素以编辑属性</p>';
    }

    const list = document.getElementById('layers-list');
    if (list) {
      list.querySelectorAll('.layer-item').forEach(item => {
        item.classList.toggle('active', item.dataset.id === id);
      });
    }
  },

  renderPropertyPanel(id) {
    const elem = this.elements.find(e => e.id === id);
    if (!elem) return;

    const panel = document.getElementById('property-content');
    let html = '';

    switch (elem.type) {
      case 'text':
        html = `
          <div class="prop-group">
            <label class="prop-label">字号</label>
            <input type="range" class="prop-range" min="10" max="36" value="${elem.fontSize || 16}" data-prop="fontSize">
            <span style="font-size:0.75rem;color:#999;">${elem.fontSize || 16}px</span>
          </div>
          <div class="prop-group">
            <label class="prop-label">粗体 / 斜体</label>
            <label style="display:flex;align-items:center;gap:6px;font-size:0.8rem;margin-top:4px;">
              <input type="checkbox" ${elem.bold ? 'checked' : ''} data-prop="bold"> 粗体
            </label>
            <label style="display:flex;align-items:center;gap:6px;font-size:0.8rem;margin-top:4px;">
              <input type="checkbox" ${elem.italic ? 'checked' : ''} data-prop="italic"> 斜体
            </label>
          </div>
          <div class="prop-group">
            <label class="prop-label">排版方向</label>
            <label style="display:flex;align-items:center;gap:6px;font-size:0.8rem;margin-top:4px;">
              <input type="checkbox" ${elem.vertical ? 'checked' : ''} data-prop="vertical"> 竖排模式
            </label>
          </div>
        `;
        break;
      case 'image': {
        const currentFrame = ImageFrames.normalize(elem.frameStyle);
        html = `
          <div class="prop-group">
            <label class="prop-label">宽度 (px)</label>
            <input type="number" class="prop-input" value="${elem.width || 200}" data-prop="width">
          </div>
          <div class="prop-group">
            <label class="prop-label">图片边框</label>
            <div class="image-frame-picker">
              ${ImageFrames.styles.map(frame => `
                <button type="button" class="image-frame-choice${frame.id === currentFrame ? ' active' : ''}"
                  data-frame-style="${frame.id}" aria-pressed="${frame.id === currentFrame}">
                  <span class="${ImageFrames.className(frame.id)}"><span class="image-frame-swatch"></span></span>
                  <em>${frame.name}</em>
                </button>
              `).join('')}
            </div>
          </div>
        `;
        break;
      }
      case 'video':
        html = `
          <div class="prop-group">
            <label class="prop-label">宽度 (px)</label>
            <input type="number" class="prop-input" value="${elem.width || 300}" data-prop="width">
          </div>
        `;
        break;
      case 'voice':
        html = `
          <div class="prop-group">
            <label class="prop-label">时长</label>
            <span style="font-size:0.85rem;color:#666;">${elem.duration || 0} 秒</span>
          </div>
        `;
        break;
      case 'stamp':
        html = `
          <div class="prop-group">
            <label class="prop-label">类型</label>
            <span style="font-size:0.85rem;color:#666;">${elem.stampType || 'flower'}</span>
          </div>
        `;
        break;
      case 'widget-date':
      case 'widget-time':
      case 'widget-weekday':
      case 'widget-recipient':
      case 'widget-sender':
      case 'widget-location':
      case 'widget-title':
      case 'widget-time-weekday':
      case 'widget-signature':
        const widgetNames = {
          'widget-date': '日期组件',
          'widget-time': '时间组件',
          'widget-weekday': '星期组件',
          'widget-time-weekday': '时间星期组合',
          'widget-recipient': '收信人组件',
          'widget-sender': '写信人组件',
          'widget-signature': '签名组合组件',
          'widget-location': '地点组件',
          'widget-title': '信件标题组件'
        };
        const currentVal = this.getWidgetValue(elem.type);
        html = `
          <div class="prop-group">
            <label class="prop-label">组件类型</label>
            <span style="font-size:0.85rem;color:#666;">${widgetNames[elem.type] || '功能组件'}</span>
          </div>
          <div class="prop-group">
            <label class="prop-label">当前值</label>
            <span style="font-size:0.9rem;color:var(--color-accent);">${currentVal}</span>
          </div>
          <div class="prop-group">
            <p style="font-size:0.75rem;color:#999;line-height:1.6;">💡 双击组件可直接编辑内容</p>
          </div>
        `;
        break;
      case 'widget-year-planner': {
        const plannerData = elem.plannerData || {};
        const activeCat = plannerData.activeCategory || 1;
        const catData = (plannerData.categories && plannerData.categories[activeCat]) || {};
        const taskCount = (catData.tasks || []).length;
        const goalCount = ((catData.goal && catData.goal.goals) || []).length;
        const listCount = (plannerData.lists || []).length;
        const layoutNames = { plan: 'PLAN 季度概览', task: 'TASK 任务打卡', goal: 'GOAL 目标拆解' };
        const catNames = { 1: '日常', 2: '工作', 3: '成长', 4: '重要' };
        html = `
          <div class="prop-group">
            <label class="prop-label">组件类型</label>
            <span style="font-size:0.85rem;color:#666;">年度计划三版式组件</span>
          </div>
          <div class="prop-group">
            <label class="prop-label">当前版式</label>
            <span style="font-size:0.9rem;color:var(--color-accent);">${layoutNames[plannerData.yearLayout] || 'PLAN'}</span>
          </div>
          <div class="prop-group">
            <label class="prop-label">当前分类</label>
            <span style="font-size:0.9rem;color:var(--color-accent);">${catNames[activeCat] || '日常'}</span>
          </div>
          <div class="prop-group">
            <label class="prop-label">数据统计</label>
            <div style="font-size:0.8rem;color:#666;line-height:1.8;margin-top:4px;">
              <div>📋 任务数: ${taskCount}</div>
              <div>🎯 目标数: ${goalCount}</div>
              <div>📝 清单数: ${listCount}</div>
            </div>
          </div>
          <div class="prop-group">
            <p style="font-size:0.75rem;color:#999;line-height:1.6;">💡 直接在组件内编辑内容，所有修改自动保存</p>
          </div>
        `;
        break;
      }
      case 'widget-monthly': {
        const monthlyData = elem.monthlyData || {};
        const todoCount = (monthlyData.todos || []).length;
        const completedTodos = (monthlyData.todos || []).filter(t => t.completed).length;
        const goalCount = (monthlyData.goals || []).filter(g => g && g.trim()).length;
        const hasReview = monthlyData.review && (monthlyData.review.myGoal || monthlyData.review.achievement);
        let currentLayout = '';
        if (monthlyData.activePage === 'calendar') {
          currentLayout = monthlyData.showLunar ? '月历 · 农历版' : '月历 · 无农历版';
        } else {
          currentLayout = monthlyData.summaryMode === 'list' ? '待办 · 清单版' : '待办 · 回顾版';
        }
        html = `
          <div class="prop-group">
            <label class="prop-label">组件类型</label>
            <span style="font-size:0.85rem;color:#666;">月计划三版式组件</span>
          </div>
          <div class="prop-group">
            <label class="prop-label">当前版式</label>
            <span style="font-size:0.9rem;color:var(--color-accent);">${currentLayout}</span>
          </div>
          <div class="prop-group">
            <label class="prop-label">当前月份</label>
            <span style="font-size:0.9rem;color:var(--color-accent);">${monthlyData.year || new Date().getFullYear()}年 ${(monthlyData.month || 0) + 1}月</span>
          </div>
          <div class="prop-group">
            <label class="prop-label">数据统计</label>
            <div style="font-size:0.8rem;color:#666;line-height:1.8;margin-top:4px;">
              <div>✅ 待办: ${completedTodos}/${todoCount}</div>
              <div>🎯 目标: ${goalCount} 个</div>
              <div>📝 回顾: ${hasReview ? '已填写' : '未填写'}</div>
            </div>
          </div>
          <div class="prop-group">
            <p style="font-size:0.75rem;color:#999;line-height:1.6;">💡 直接在组件内编辑内容，所有修改自动保存</p>
          </div>
        `;
        break;
      }
      case 'widget-weekly': {
        const weeklyData = elem.weeklyData || {};
        const layoutNames = { simple: '简约 · 七分行', timeline: '时间轴版' };
        const daysWithContent = Object.values(weeklyData.dailyData || {}).filter(d => d.content && d.content.trim()).length;
        const totalTimelineHours = Object.values(weeklyData.dailyData || {}).reduce((sum, d) => sum + (d.timeline || []).length, 0);
        html = `
          <div class="prop-group">
            <label class="prop-label">组件类型</label>
            <span style="font-size:0.85rem;color:#666;">周计划双版式组件</span>
          </div>
          <div class="prop-group">
            <label class="prop-label">当前版式</label>
            <span style="font-size:0.9rem;color:var(--color-accent);">${layoutNames[weeklyData.activeLayout] || '简约版'}</span>
          </div>
          <div class="prop-group">
            <label class="prop-label">当前周次</label>
            <span style="font-size:0.9rem;color:var(--color-accent);">${weeklyData.year || new Date().getFullYear()}年 ${(weeklyData.month || 0) + 1}月 第${weeklyData.weekOfMonth || 1}周</span>
          </div>
          <div class="prop-group">
            <label class="prop-label">数据统计</label>
            <div style="font-size:0.8rem;color:#666;line-height:1.8;margin-top:4px;">
              <div>📝 已填写天数: ${daysWithContent}/7</div>
              <div>⏰ 时间轴标记: ${totalTimelineHours} 小时</div>
            </div>
          </div>
          <div class="prop-group">
            <p style="font-size:0.75rem;color:#999;line-height:1.6;">💡 直接在组件内编辑内容，所有修改自动保存</p>
          </div>
        `;
        break;
      }
      case 'widget-daily': {
        const dailyData = elem.dailyData || {};
        const layoutNames = { timegrid: '时间格子', timeline: '时间轴', gratitude: '感恩日记' };
        const tabNames = { year: 'YEAR 日计划', note: 'NOTE 笔记', list: 'LIST 清单' };
        const record = (dailyData.dailyRecords && dailyData.dailyRecords[dailyData.currentDate]) || {};
        const todoCount = (record.todos || []).length;
        const completedTodos = (record.todos || []).filter(t => t.completed).length;
        const timeCellCount = (record.timeCells || []).length;
        const notePages = ((dailyData.notes && dailyData.notes.pages) || []).length;
        html = `
          <div class="prop-group">
            <label class="prop-label">组件类型</label>
            <span style="font-size:0.85rem;color:#666;">日计划三版式组件</span>
          </div>
          <div class="prop-group">
            <label class="prop-label">当前标签</label>
            <span style="font-size:0.9rem;color:var(--color-accent);">${tabNames[dailyData.activeTab] || 'YEAR'}</span>
          </div>
          <div class="prop-group">
            <label class="prop-label">当前日期</label>
            <span style="font-size:0.9rem;color:var(--color-accent);">${dailyData.currentDate || '-'}</span>
          </div>
          <div class="prop-group">
            <label class="prop-label">当前版式</label>
            <span style="font-size:0.9rem;color:var(--color-accent);">${layoutNames[dailyData.activeLayout] || '时间格子'}</span>
          </div>
          <div class="prop-group">
            <label class="prop-label">数据统计</label>
            <div style="font-size:0.8rem;color:#666;line-height:1.8;margin-top:4px;">
              <div>✅ 待办: ${completedTodos}/${todoCount}</div>
              <div>⏰ 时间格: ${timeCellCount} 格</div>
              <div>📝 笔记页: ${notePages} 页</div>
            </div>
          </div>
          <div class="prop-group">
            <p style="font-size:0.75rem;color:#999;line-height:1.6;">💡 直接在组件内编辑内容，所有修改自动保存</p>
          </div>
        `;
        break;
      }
    }

    html += `<button class="delete-element-btn" data-delete="${id}">🗑 删除此元素</button>`;
    panel.innerHTML = html;

    // 绑定属性变更
    panel.querySelectorAll('[data-prop]').forEach(input => {
      const handler = (e) => {
        const prop = e.target.dataset.prop;
        const oldValue = elem[prop];
        
        if (e.target.type === 'checkbox') {
          elem[prop] = e.target.checked;
        } else if (e.target.type === 'range' || e.target.type === 'number') {
          elem[prop] = parseFloat(e.target.value);
          const span = e.target.parentElement.querySelector('span');
          if (span && e.target.type === 'range') span.textContent = e.target.value + 'px';
        }
        
        if (elem[prop] !== oldValue) {
          this.saveUndoState();
          this.renderPaperElements();
          this.selectElement(id);
        }
      };
      input.addEventListener('input', handler);
      input.addEventListener('change', handler);
    });

    panel.querySelectorAll('[data-frame-style]').forEach(button => {
      button.addEventListener('click', () => {
        const nextFrame = ImageFrames.normalize(button.dataset.frameStyle);
        if (nextFrame === ImageFrames.normalize(elem.frameStyle)) return;
        this.saveUndoState();
        elem.frameStyle = nextFrame;
        this.renderPaperElements();
        this.selectElement(id);
      });
    });

    // 删除按钮
    const deleteBtn = panel.querySelector('[data-delete]');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => {
        this.removeElement(deleteBtn.dataset.delete);
      });
    }
  },

  removeElement(id) {
    this.saveUndoState();
    this.elements = this.elements.filter(e => e.id !== id);
    const domEl = document.querySelector(`.paper-element[data-id="${id}"]`);
    if (domEl) domEl.remove();
    this.selectElement(null);
    this.renderLayersList();
  },

  addWidget(widgetType, options = {}) {
    const typeMap = {
      'date': 'widget-date',
      'time': 'widget-time',
      'weekday': 'widget-weekday',
      'time-weekday': 'widget-time-weekday',
      'recipient': 'widget-recipient',
      'sender': 'widget-sender',
      'signature': 'widget-signature',
      'location': 'widget-location',
      'title': 'widget-title',
      'year-planner': 'widget-year-planner',
      'monthly': 'widget-monthly',
      'weekly': 'widget-weekly',
      'daily': 'widget-daily'
    };
    const elemType = typeMap[widgetType] || 'widget-' + widgetType;
    return this.addElement(elemType, options);
  },

  getWidgetValue(widgetType) {
    switch (widgetType) {
      case 'widget-date':
        return this.letter.date || '日期';
      case 'widget-time':
        return this.letter.time || '时间';
      case 'widget-weekday':
        return this.letter.weekday || '星期';
      case 'widget-recipient':
        return this.letter.recipient || '收信人';
      case 'widget-sender':
        return this.letter.sender || '写信人';
      case 'widget-location':
        return this.letter.location || '地点';
      case 'widget-title':
        return this.letter.letterTitle || '信件标题';
      default:
        return '';
    }
  },

  _parseDateInfo(dateStr) {
    const result = { day: '', month: '', year: '' };
    if (!dateStr) return result;

    const cnMonths = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'];

    const yearMatch = dateStr.match(/(\d{4}|[一二三四五六七八九零〇]+)年/);
    if (yearMatch) {
      result.year = yearMatch[0];
    }

    const cnMonthMatch = dateStr.match(/([一二三四五六七八九十]+)月/);
    const numMonthMatch = dateStr.match(/(\d{1,2})月/);
    if (cnMonthMatch) {
      result.month = cnMonthMatch[0];
    } else if (numMonthMatch) {
      const monthNum = parseInt(numMonthMatch[1], 10);
      if (monthNum >= 1 && monthNum <= 12) {
        result.month = cnMonths[monthNum - 1] + '月';
      }
    }

    const cnDayMatch = dateStr.match(/([一二三四五六七八九十]+)日/);
    const numDayMatch = dateStr.match(/(\d{1,2})日/);
    if (cnDayMatch) {
      result.day = cnDayMatch[1];
    } else if (numDayMatch) {
      result.day = numDayMatch[1];
    }

    if (!result.year && !result.month && !result.day) {
      const dashMatch = dateStr.match(/(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/);
      if (dashMatch) {
        result.year = dashMatch[1] + '年';
        const monthNum = parseInt(dashMatch[2], 10);
        if (monthNum >= 1 && monthNum <= 12) {
          result.month = cnMonths[monthNum - 1] + '月';
        }
        result.day = dashMatch[3];
      }
    }

    if (!result.day && !result.month && !result.year) {
      result.day = dateStr;
    }

    return result;
  },

  updateAllWidgets() {
    this.elements.forEach(elem => {
      if (elem.type && elem.type.startsWith('widget-')) {
        const domEl = document.querySelector(`.paper-element[data-id="${elem.id}"]`);
        if (!domEl) return;

        if (elem.type === 'widget-date') {
          const dateInfo = this._parseDateInfo(this.letter.date);
          const dayEl = domEl.querySelector('.widget-date-day');
          const monthEl = domEl.querySelector('.widget-date-month');
          const yearEl = domEl.querySelector('.widget-date-year');
          if (dayEl) dayEl.textContent = dateInfo.day || '日';
          if (monthEl) monthEl.textContent = dateInfo.month || '月';
          if (yearEl) yearEl.textContent = dateInfo.year || '年';
        } else if (elem.type === 'widget-sender') {
          const signerEl = domEl.querySelector('.widget-signer');
          if (signerEl) signerEl.textContent = this.letter.sender || '写信人';
        } else if (elem.type === 'widget-time-weekday') {
          const timeEl = domEl.querySelector('.widget-tw-time');
          const weekdayEl = domEl.querySelector('.widget-tw-weekday');
          if (timeEl) timeEl.textContent = this.letter.time || '时间';
          if (weekdayEl) weekdayEl.textContent = this.letter.weekday || '星期';
        } else if (elem.type === 'widget-signature') {
          const nameEl = domEl.querySelector('.widget-signer-name');
          const locEl = domEl.querySelector('.widget-signer-location');
          if (nameEl) nameEl.textContent = this.letter.sender || '写信人';
          if (locEl) {
            if (this.letter.location) {
              locEl.textContent = this.letter.location;
              locEl.style.display = 'block';
            } else {
              locEl.style.display = 'none';
            }
          }
        } else {
          const contentEl = domEl.querySelector('.widget-content');
          if (contentEl) {
            contentEl.textContent = this.getWidgetValue(elem.type);
          }
        }
      }
    });
  },

  _editWidgetInline(elem, elemEl) {
    const fieldMap = {
      'widget-date': 'date',
      'widget-time': 'time',
      'widget-weekday': 'weekday',
      'widget-recipient': 'recipient',
      'widget-sender': 'sender',
      'widget-location': 'location',
      'widget-title': 'letterTitle',
      'widget-time-weekday': 'time',
      'widget-signature': 'sender'
    };
    const field = fieldMap[elem.type];
    if (!field) return;

    let editTarget = null;
    if (elem.type === 'widget-date') {
      editTarget = elemEl.querySelector('.widget-date-block');
    } else if (elem.type === 'widget-sender') {
      editTarget = elemEl.querySelector('.widget-signer');
    } else if (elem.type === 'widget-time-weekday') {
      editTarget = elemEl.querySelector('.widget-tw-time');
    } else if (elem.type === 'widget-signature') {
      editTarget = elemEl.querySelector('.widget-signer-name');
    } else {
      editTarget = elemEl.querySelector('.widget-content');
    }
    if (!editTarget) return;

    const oldValue = this.letter[field] || '';
    editTarget.setAttribute('contenteditable', 'true');
    editTarget.style.outline = '2px dashed rgba(139, 69, 19, 0.5)';
    editTarget.style.outlineOffset = '4px';
    editTarget.focus();

    const range = document.createRange();
    range.selectNodeContents(editTarget);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);

    const finishEdit = () => {
      editTarget.removeAttribute('contenteditable');
      editTarget.style.outline = '';
      editTarget.style.outlineOffset = '';
      const newValue = editTarget.textContent.trim();
      if (newValue !== oldValue) {
        this.letter[field] = newValue;
        this.saveUndoState();
        this.updateAllWidgets();
        const isShared = MailboxManager.isSharedMailbox(this.letter.mailboxId);
        const updatedLetter = { ...this.letter, content: this.elements };
        if (isShared) {
          const letters = STORAGE.loadSharedLetters(this.letter.mailboxId);
          const idx = letters.findIndex(l => l.id === this.letter.id);
          if (idx >= 0) {
            letters[idx] = updatedLetter;
          } else {
            letters.push(updatedLetter);
          }
          STORAGE.saveSharedLetters(this.letter.mailboxId, letters);
        } else {
          STORAGE.saveLetters(STORAGE.loadLetters().map(l =>
            l.id === this.letter.id ? updatedLetter : l
          ));
        }
      }
    };

    editTarget.addEventListener('blur', finishEdit, { once: true });
    editTarget.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        editTarget.blur();
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        editTarget.textContent = oldValue;
        editTarget.blur();
      }
    });
  },

  addElement(type, props = {}) {
    const style = this.paperStyle || 'vintage-literary';
    const verticalStyles = ['chinese-bamboo', 'japanese-vertical', 'red-frame-vertical'];
    const isVertical = verticalStyles.includes(style);

    let defaultX = 50 + Math.random() * 100;
    let defaultY = 100 + Math.random() * 200;

    if (type === 'text' && isVertical) {
      // 竖排风格：文字默认从右侧开始
      defaultX = 760;
      defaultY = 120;
      if (!props.vertical) {
        props.vertical = true;
      }
    }

    if (type === 'widget-year-planner') {
      defaultX = 50;
      defaultY = 80;
      
      const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      
      const generatePlanData = () => {
        const months = {};
        for (let i = 0; i < 12; i++) {
          months[i] = { content: '' };
        }
        return months;
      };
      
      const generateTaskData = () => ([]);
      
      const generateGoalData = () => ({
        goals: [
          { id: 'goal-1', title: '' },
          { id: 'goal-2', title: '' },
          { id: 'goal-3', title: '' }
        ],
        motivation: '',
        challenges: '',
        achievements: '',
        progress: '',
        needImprove: ''
      });
      
      const categories = {};
      for (let c = 1; c <= 4; c++) {
        categories[c] = {
          plan: generatePlanData(),
          tasks: generateTaskData(),
          goal: generateGoalData()
        };
      }
      
      const sampleLists = [
        { id: 'list-' + Date.now() + '-1', name: '愿望清单', items: [] },
        { id: 'list-' + Date.now() + '-2', name: '读书清单', items: [] },
        { id: 'list-' + Date.now() + '-3', name: '观影清单', items: [] }
      ];
      
      const layoutMap = { 'task': 'task', 'goal': 'goal', 'calendar': 'plan' };
      const initialLayout = layoutMap[props.initialTemplate] || 'plan';
      
      props.plannerData = {
        activeTab: 'year',
        yearLayout: initialLayout,
        activeCategory: 1,
        activeMonth: null,
        categories: categories,
        noteContent: '',
        lists: sampleLists,
        isEditing: false,
        activeListId: null
      };
    }

    if (type === 'widget-monthly') {
      defaultX = 100;
      defaultY = 100;

      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();

      const generateTodos = () => ([
        { id: 'todo-1', text: '', color: 1, completed: false },
        { id: 'todo-2', text: '', color: 2, completed: false },
        { id: 'todo-3', text: '', color: 3, completed: false },
        { id: 'todo-4', text: '', color: 4, completed: false },
        { id: 'todo-5', text: '', color: 5, completed: false }
      ]);

      const pageMap = { 'calendar': 'calendar', 'summary': 'summary', 'list': 'summary', 'review': 'summary' };
      const initialPage = pageMap[props.initialTemplate] || 'calendar';
      const initialSummaryMode = props.initialTemplate === 'review' ? 'review' : 'list';

      props.monthlyData = {
        year: currentYear,
        month: currentMonth,
        showLunar: true,
        activePage: initialPage,
        summaryMode: initialSummaryMode,
        goals: ['', '', ''],
        todos: generateTodos(),
        review: {
          rating: 0,
          myGoal: '',
          achievement: '',
          needImprove: '',
          thisMonth: '',
          nextMonth: ''
        },
        dateNotes: {}
      };
    }

    if (type === 'widget-weekly') {
      defaultX = 120;
      defaultY = 120;

      const now = new Date();
      const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1;
      const monday = new Date(now);
      monday.setDate(now.getDate() - dayOfWeek);

      const getWeekOfMonth = (date) => {
        const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
        const firstDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
        const dayOfMonth = date.getDate();
        return Math.ceil((dayOfMonth + firstDayOfWeek) / 7);
      };

      props.weeklyData = {
        year: monday.getFullYear(),
        month: monday.getMonth(),
        weekStart: monday.getTime(),
        weekOfMonth: getWeekOfMonth(monday),
        activeLayout: props.initialTemplate || 'simple',
        showLunar: true,
        transparentBg: false,
        dailyData: {}
      };
    }

    if (type === 'widget-daily') {
      defaultX = 140;
      defaultY = 100;
      const now = new Date();
      const dateKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      props.dailyData = {
        currentDate: dateKey,
        activeTab: 'year',
        activeLayout: props.initialTemplate || 'timegrid',
        transparentBg: false,
        dailyRecords: {
          [dateKey]: {
            weather: '',
            mood: '',
            timeCells: [],
            timelineBlocks: [],
            gratitude: { goal: '', topMoment: '', grateful: '' },
            todos: []
          }
        },
        notes: {
          activeNotePage: 0,
          pages: [
            { id: 'note_grid', type: 'grid', content: '' },
            { id: 'note_line', type: 'line', content: '' },
            { id: 'note_dot', type: 'dot', content: '' },
            { id: 'note_cornell', type: 'cornell', content: '' }
          ]
        },
        lists: {
          activeList: 'todo',
          todo: { items: [] },
          shopping: { items: [] },
          wish: { items: [] },
          custom: []
        }
      };
    }

    const elem = {
      id: 'el-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      type,
      x: defaultX,
      y: defaultY,
      rotation: 0,
      ...props
    };
    this.saveUndoState();
    this.elements.push(elem);
    const canvas = document.getElementById('paper-canvas');
    const domEl = this.createElementDOM(elem);
    canvas.appendChild(domEl);
    elem.height = domEl.offsetHeight;
    elem.width = domEl.offsetWidth;
    this.selectElement(elem.id);
    this.adjustPaperSize();
    this.renderLayersList();
    return elem;
  },

  // === 拖拽逻辑 ===
  onElementMouseDown(e, elemId) {
    if (e.target.classList.contains('resize-handle')) {
      this.startResize(e, elemId);
      return;
    }
    if (e.target.classList.contains('rotate-handle')) {
      this.startRotate(e, elemId);
      return;
    }
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON' ||
        e.target.tagName === 'VIDEO' || e.target.closest('.voice-play-btn')) {
      return;
    }
    if (e.target.getAttribute('contenteditable') === 'true' ||
        e.target.closest('[contenteditable="true"]')) {
      return;
    }
    if (e.target.closest('.year-planner-inner')) {
      if (e.target.closest('button, .yp-cat-dot, .yp-task-mark-cell, .yp-task-checkbox, .yp-list-checkbox, .yp-list-delete')) {
        return;
      }
    }
    if (e.target.closest('.monthly-planner-inner')) {
      if (e.target.closest('button, .mp-month-num, .mp-nav-btn, .mp-month-title, .mp-todo-checkbox, .mp-star, .mp-add-todo-btn, .mp-page-switch, .mp-goal-input, .mp-review-text, .mp-todo-text, .mp-top-tab, .mp-cal-note')) {
        return;
      }
    }
    if (e.target.closest('.weekly-planner-inner')) {
      if (e.target.closest('button, .wp-month-num, .wp-nav-btn, .wp-week-title, .wp-day-content, .wp-tl-dot, .wp-mini-cell, .wp-layout-switch, .wp-top-tab')) {
        return;
      }
    }
    if (e.target.closest('.daily-planner-inner')) {
      if (e.target.closest('button, .dp-month-num, .dp-nav-btn, .dp-date-info, .dp-wm-icon, .dp-tg-cell, .dp-todo-checkbox, .dp-todo-text, .dp-layout-btn, .dp-top-tab, .dp-note-cat-dot, .dp-list-cat-dot, .dp-list-checkbox, .dp-list-text, .dp-grat-dot-area, .dp-grat-bubble, .dp-notes-area, .dp-note-content')) {
        return;
      }
    }

    const elem = this.elements.find(el => el.id === elemId);
    if (!elem) return;

    this.selectElement(elemId);
    const canvas = document.getElementById('paper-canvas');
    const rect = canvas.getBoundingClientRect();

    this.saveUndoState();

    this.dragState = {
      elemId,
      startX: e.clientX,
      startY: e.clientY,
      origX: elem.x,
      origY: elem.y,
      moved: false
    };

    e.preventDefault();
  },

  onElementTouchStart(e, elemId) {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    // 模拟 mousedown
    const mockEvent = {
      clientX: touch.clientX,
      clientY: touch.clientY,
      target: touch.target,
      preventDefault: () => e.preventDefault()
    };
    this.onElementMouseDown(mockEvent, elemId);
  },

  setupEventListeners() {
    // 全局鼠标移动/松开
    document.addEventListener('mousemove', (e) => this.onMouseMove(e));
    document.addEventListener('mouseup', (e) => this.onMouseUp(e));
    document.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: false });
    document.addEventListener('touchend', (e) => this.onTouchEnd(e));

    // 工具栏按钮
    document.querySelectorAll('.tool-btn').forEach(btn => {
      if (btn.id === 'open-carrier-picker') return; // 信使按钮单独绑定
      btn.addEventListener('click', () => this.onToolClick(btn));
    });

    // 选择信使（万物送信）
    const openCarrierBtn = document.getElementById('open-carrier-picker');
    if (openCarrierBtn) {
      openCarrierBtn.addEventListener('click', () => this.openCarrierPicker());
    }
    const carrierClose = document.getElementById('carrier-picker-close');
    if (carrierClose) carrierClose.addEventListener('click', () => this.closeCarrierPicker());
    const carrierOverlay = document.getElementById('carrier-picker-overlay');
    if (carrierOverlay) {
      carrierOverlay.addEventListener('click', (e) => {
        if (e.target === carrierOverlay) this.closeCarrierPicker();
      });
    }
    const carrierRandom = document.getElementById('carrier-picker-random');
    if (carrierRandom) carrierRandom.addEventListener('click', () => {
      const roster = window.CARRIER_ROSTER || [];
      if (roster.length) this.selectCarrier(roster[Math.floor(Math.random() * roster.length)].id, true);
    });

    // 添加页面按钮
    const addPageBtn = document.getElementById('add-page-btn');
    if (addPageBtn) {
      addPageBtn.addEventListener('click', () => this.addPage());
    }

    // 功能组件
    document.querySelectorAll('.widget-item').forEach(item => {
      item.addEventListener('click', () => {
        const widgetType = item.dataset.widget;
        if (widgetType === 'year-planner') {
          const templateSelect = document.getElementById('yp-template-select');
          const template = templateSelect ? templateSelect.value : 'task';
          this.addWidget(widgetType, { initialTemplate: template });
        } else if (widgetType === 'monthly') {
          const templateSelect = document.getElementById('mp-template-select');
          const template = templateSelect ? templateSelect.value : 'calendar';
          this.addWidget(widgetType, { initialTemplate: template });
        } else if (widgetType === 'weekly') {
          const templateSelect = document.getElementById('wp-template-select');
          const template = templateSelect ? templateSelect.value : 'simple';
          this.addWidget(widgetType, { initialTemplate: template });
        } else if (widgetType === 'daily') {
          const templateSelect = document.getElementById('dp-template-select');
          const template = templateSelect ? templateSelect.value : 'timegrid';
          this.addWidget(widgetType, { initialTemplate: template });
        } else {
          this.addWidget(widgetType);
        }
      });
    });

    // 编辑模式切换
    document.querySelectorAll('.mode-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const mode = tab.dataset.mode;
        this.switchMode(mode);
      });
    });

    // 保存按钮
    document.getElementById('save-letter-btn').onclick = () => this.save(true);

    // 阅读按钮
    document.getElementById('read-letter-btn').onclick = async () => {
      await this.save(false);
      App.navigate('reader', { letterId: this.letter.id });
    };

    const sendButton = document.getElementById('send-letter-btn');
    if (sendButton) sendButton.onclick = () => this.send();
    const itemButton = document.getElementById('letter-item-attachments-btn');
    if (itemButton) itemButton.onclick = () => this.openItemAttachmentDrawer();
    const itemClose = document.getElementById('letter-item-drawer-close');
    if (itemClose) itemClose.onclick = () => this.closeItemAttachmentDrawer();

    // 退格键删除
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Delete' && this.selectedId && document.activeElement.tagName !== 'INPUT' &&
          document.activeElement.tagName !== 'TEXTAREA' && !document.activeElement.getAttribute('contenteditable')) {
        this.removeElement(this.selectedId);
      }
      
      // 撤销/重做快捷键
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          this.undo();
        } else if ((e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
          e.preventDefault();
          this.redo();
        }
      }
    });

    // 撤销/重做按钮
    const undoBtn = document.getElementById('undo-btn');
    const redoBtn = document.getElementById('redo-btn');
    if (undoBtn) undoBtn.addEventListener('click', () => this.undo());
    if (redoBtn) redoBtn.addEventListener('click', () => this.redo());

    // 层级操作按钮
    document.querySelectorAll('.layer-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.adjustLayer(btn.dataset.layer);
      });
    });

    // 对齐操作按钮
    document.querySelectorAll('.align-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.alignElements(btn.dataset.align);
      });
    });

    // 备份导出/导入
    const exportBtn = document.getElementById('export-backup-btn');
    const importBtn = document.getElementById('import-backup-btn');
    if (exportBtn) exportBtn.addEventListener('click', () => this.exportBackup());
    if (importBtn) importBtn.addEventListener('click', () => this.importBackup());

    // 自动草稿保存（25秒）
    if (this._autoSaveTimer) clearInterval(this._autoSaveTimer);
    this._autoSaveTimer = setInterval(() => this.autoSaveDraft(), 25000);

    // 双击文字元素进入编辑
    document.getElementById('paper-canvas').addEventListener('dblclick', (e) => {
      const elemEl = e.target.closest('.paper-element');
      if (!elemEl) return;
      const elemId = elemEl.dataset.id;
      const elem = this.elements.find(el => el.id === elemId);
      if (!elem) return;

      if (elem.type === 'text') {
        elemEl.setAttribute('contenteditable', 'true');
        elemEl.focus();
        const onSave = () => {
          elemEl.removeAttribute('contenteditable');
          elem.text = elemEl.innerHTML.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '');
          elem.height = elemEl.offsetHeight;
          this.saveUndoState();
          const isShared = MailboxManager.isSharedMailbox(this.letter.mailboxId);
          const updatedLetter = { ...this.letter, content: this.elements };
          if (isShared) {
            const letters = STORAGE.loadSharedLetters(this.letter.mailboxId);
            const idx = letters.findIndex(l => l.id === this.letter.id);
            if (idx >= 0) {
              letters[idx] = updatedLetter;
            } else {
              letters.push(updatedLetter);
            }
            STORAGE.saveSharedLetters(this.letter.mailboxId, letters);
          } else {
            STORAGE.saveLetters(STORAGE.loadLetters().map(l =>
              l.id === this.letter.id ? updatedLetter : l
            ));
          }
          this.adjustPaperSize();
        };
        elemEl.addEventListener('blur', onSave, { once: true });
      } else if (elem.type && elem.type.startsWith('widget-')) {
        this._editWidgetInline(elem, elemEl);
      }
    });
  },

  switchMode(mode) {
    this.currentMode = mode;
    document.querySelectorAll('.mode-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.mode === mode);
    });

    const paperArea = document.getElementById('paper-area');
    const metaForm = paperArea.querySelector('.meta-form-container');
    const canvas = document.getElementById('paper-canvas');
    const toolbar = document.getElementById('toolbar');

    if (mode === 'content') {
      if (metaForm) metaForm.style.display = 'none';
      canvas.style.display = 'block';
      if (toolbar) toolbar.classList.remove('cover-mode');
    } else {
      if (!metaForm) {
        this.renderMetaForm();
        this._setupCoverDragAndDrop();
      }
      metaForm.style.display = 'block';
      canvas.style.display = 'none';
      if (toolbar) toolbar.classList.add('cover-mode');
    }
    
    this.renderLayersList();
  },

  // === 撤销/重做系统 ===
  saveUndoState() {
    this.undoStack.push({
      pageIndex: this.currentPageIndex,
      snapshot: JSON.parse(JSON.stringify(this.elements)),
      selectedId: this.selectedId,
      timestamp: Date.now()
    });
    if (this.undoStack.length > this.maxUndoSteps) {
      this.undoStack.shift();
    }
    this.redoStack = [];
    this.updateUndoButtons();
  },

  updateUndoButtons() {
    const undoBtn = document.getElementById('undo-btn');
    const redoBtn = document.getElementById('redo-btn');
    if (undoBtn) {
      undoBtn.disabled = this.undoStack.length === 0;
      undoBtn.style.opacity = this.undoStack.length === 0 ? '0.4' : '1';
    }
    if (redoBtn) {
      redoBtn.disabled = this.redoStack.length === 0;
      redoBtn.style.opacity = this.redoStack.length === 0 ? '0.4' : '1';
    }
  },

  undo() {
    if (this.undoStack.length === 0) return;
    const state = this.undoStack.pop();
    this.redoStack.push({
      pageIndex: this.currentPageIndex,
      snapshot: JSON.parse(JSON.stringify(this.elements)),
      selectedId: this.selectedId
    });
    if (state.pageIndex !== undefined && state.pageIndex !== this.currentPageIndex) {
      this.currentPageIndex = state.pageIndex;
      this.renderPagesList();
    }
    this.elements = state.snapshot;
    this.selectedId = state.selectedId;
    this.renderPaperElements();
    this.selectElement(this.selectedId);
    this.updateUndoButtons();
  },

  redo() {
    if (this.redoStack.length === 0) return;
    const state = this.redoStack.pop();
    this.undoStack.push({
      pageIndex: this.currentPageIndex,
      snapshot: JSON.parse(JSON.stringify(this.elements)),
      selectedId: this.selectedId
    });
    if (state.pageIndex !== undefined && state.pageIndex !== this.currentPageIndex) {
      this.currentPageIndex = state.pageIndex;
      this.renderPagesList();
    }
    this.elements = state.snapshot;
    this.selectedId = state.selectedId;
    this.renderPaperElements();
    this.selectElement(this.selectedId);
    this.updateUndoButtons();
  },

  // === 层级操作 ===
  adjustLayer(direction) {
    if (!this.selectedId) return;
    const idx = this.elements.findIndex(el => el.id === this.selectedId);
    if (idx === -1) return;

    this.saveUndoState();

    let newIdx = idx;
    switch (direction) {
      case 'bring-to-front':
        newIdx = this.elements.length - 1;
        break;
      case 'bring-forward':
        newIdx = Math.min(idx + 1, this.elements.length - 1);
        break;
      case 'send-backward':
        newIdx = Math.max(idx - 1, 0);
        break;
      case 'send-to-back':
        newIdx = 0;
        break;
    }

    if (newIdx !== idx) {
      const [removed] = this.elements.splice(idx, 1);
      this.elements.splice(newIdx, 0, removed);
      this.renderPaperElements();
      this.selectElement(this.selectedId);
    }
  },

  // === 对齐辅助线 ===
  showAlignmentGuides(elem) {
    const canvas = document.getElementById('paper-canvas');
    let guides = canvas.querySelectorAll('.alignment-guide');
    guides.forEach(g => g.remove());

    const elemRect = document.querySelector(`.paper-element[data-id="${elem.id}"]`)?.getBoundingClientRect();
    if (!elemRect) return;

    const canvasRect = canvas.getBoundingClientRect();
    const elemX = elemRect.left - canvasRect.left;
    const elemY = elemRect.top - canvasRect.top;
    const elemW = elemRect.width;
    const elemH = elemRect.height;

    const elemCenterX = elemX + elemW / 2;
    const elemCenterY = elemY + elemH / 2;

    const snapThreshold = 10;
    const snapValues = { x: [], y: [] };

    snapValues.x.push(0, canvasRect.width);
    snapValues.y.push(0, canvasRect.height);
    snapValues.x.push(canvasRect.width / 2);
    snapValues.y.push(canvasRect.height / 2);

    this.elements.forEach(other => {
      if (other.id === elem.id) return;
      const otherEl = document.querySelector(`.paper-element[data-id="${other.id}"]`);
      if (!otherEl) return;
      const otherRect = otherEl.getBoundingClientRect();
      const otherX = otherRect.left - canvasRect.left;
      const otherY = otherRect.top - canvasRect.top;
      const otherW = otherRect.width;
      const otherH = otherRect.height;

      snapValues.x.push(otherX, otherX + otherW);
      snapValues.y.push(otherY, otherY + otherH);
      snapValues.x.push(otherX + otherW / 2);
      snapValues.y.push(otherY + otherH / 2);
    });

    let newX = elem.x;
    let newY = elem.y;

    snapValues.x.forEach(snapX => {
      if (Math.abs(elemCenterX - snapX) < snapThreshold) {
        this.createGuide(canvas, snapX, 'vertical');
        newX = snapX - elemW / 2;
      } else if (Math.abs(elemX - snapX) < snapThreshold) {
        this.createGuide(canvas, snapX, 'vertical');
        newX = snapX;
      } else if (Math.abs(elemX + elemW - snapX) < snapThreshold) {
        this.createGuide(canvas, snapX, 'vertical');
        newX = snapX - elemW;
      }
    });

    snapValues.y.forEach(snapY => {
      if (Math.abs(elemCenterY - snapY) < snapThreshold) {
        this.createGuide(canvas, snapY, 'horizontal');
        newY = snapY - elemH / 2;
      } else if (Math.abs(elemY - snapY) < snapThreshold) {
        this.createGuide(canvas, snapY, 'horizontal');
        newY = snapY;
      } else if (Math.abs(elemY + elemH - snapY) < snapThreshold) {
        this.createGuide(canvas, snapY, 'horizontal');
        newY = snapY - elemH;
      }
    });

    return { x: Math.round(newX), y: Math.round(newY) };
  },

  createGuide(canvas, pos, type) {
    const guide = document.createElement('div');
    guide.className = 'alignment-guide guide-' + type;
    if (type === 'vertical') {
      guide.style.left = pos + 'px';
      guide.style.top = '0';
      guide.style.height = '100%';
    } else {
      guide.style.top = pos + 'px';
      guide.style.left = '0';
      guide.style.width = '100%';
    }
    canvas.appendChild(guide);
  },

  hideAlignmentGuides() {
    const canvas = document.getElementById('paper-canvas');
    canvas.querySelectorAll('.alignment-guide').forEach(g => g.remove());
  },

  onMouseMove(e) {
    if (this.dragState) {
      const dx = e.clientX - this.dragState.startX;
      const dy = e.clientY - this.dragState.startY;
      const elem = this.elements.find(el => el.id === this.dragState.elemId);
      if (elem) {
        const newX = this.dragState.origX + dx;
        const newY = this.dragState.origY + dy;
        elem.x = newX;
        elem.y = newY;
        const domEl = document.querySelector(`.paper-element[data-id="${elem.id}"]`);
        if (domEl) {
          domEl.style.left = elem.x + 'px';
          domEl.style.top = elem.y + 'px';
        }
        this.showAlignmentGuides(elem);
      }
    }
    if (this.resizeState) {
      const dx = e.clientX - this.resizeState.startX;
      const dy = e.clientY - this.resizeState.startY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const origW = this.resizeState.origWidth;
      const newW = Math.max(50, origW + dist * 0.5);
      const elem = this.elements.find(el => el.id === this.resizeState.elemId);
      if (elem) {
        elem.width = Math.round(newW);
        const domEl = document.querySelector(`.paper-element[data-id="${elem.id}"]`);
        if (domEl) {
          domEl.style.width = newW + 'px';
          if (elem.type === 'image') {
            const img = domEl.querySelector('img');
            if (img && img.naturalWidth) {
              const ratio = img.naturalHeight / img.naturalWidth;
              const newH = newW * ratio;
              domEl.style.height = newH + 'px';
              elem.height = Math.round(newH);
            }
          } else {
            elem.height = domEl.offsetHeight;
          }
        }
      }
    }
    if (this.rotateState) {
      const canvas = document.getElementById('paper-canvas');
      const rect = canvas.getBoundingClientRect();
      const cx = this.rotateState.elemX + rect.left;
      const cy = this.rotateState.elemY + rect.top;
      const angle = Math.atan2(e.clientY - cy, e.clientX - cx) * 180 / Math.PI + 90;
      const elem = this.elements.find(el => el.id === this.rotateState.elemId);
      if (elem) {
        elem.rotation = Math.round(angle);
        const domEl = document.querySelector(`.paper-element[data-id="${elem.id}"]`);
        if (domEl) {
          domEl.style.transform = `rotate(${elem.rotation}deg)`;
        }
      }
    }
  },

  onMouseUp(e) {
    let hadOperation = false;
    if (this.dragState) {
      const dx = e.clientX - this.dragState.startX;
      const dy = e.clientY - this.dragState.startY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        this.dragState.moved = true;
      }
      this.dragState = null;
      hadOperation = true;
    }
    if (this.resizeState) {
      this.resizeState = null;
      hadOperation = true;
    }
    if (this.rotateState) {
      this.rotateState = null;
      hadOperation = true;
    }
    this.hideAlignmentGuides();
    if (hadOperation) {
      this.adjustPaperSize();
    }
  },

  onTouchMove(e) {
    if (e.touches.length !== 1) return;
    e.preventDefault();
    const touch = e.touches[0];
    this.onMouseMove({ clientX: touch.clientX, clientY: touch.clientY });
  },

  onTouchEnd(e) {
    this.onMouseUp({ clientX: 0, clientY: 0 });
  },

  startResize(e, elemId) {
    const elem = this.elements.find(el => el.id === elemId);
    if (!elem) return;
    this.saveUndoState();
    this.resizeState = {
      elemId,
      startX: e.clientX,
      startY: e.clientY,
      origWidth: elem.width || 200,
      origHeight: elem.height || 100
    };
    e.stopPropagation();
    e.preventDefault();
  },

  startRotate(e, elemId) {
    const elem = this.elements.find(el => el.id === elemId);
    if (!elem) return;
    this.saveUndoState();
    const domEl = document.querySelector(`.paper-element[data-id="${elemId}"]`);
    this.rotateState = {
      elemId,
      elemX: elem.x || 0,
      elemY: elem.y || 0,
      origRotation: elem.rotation || 0
    };
    e.stopPropagation();
    e.preventDefault();
  },

  onToolClick(btn) {
    const tool = btn.dataset.tool;
    if (!tool) return;

    switch (tool) {
      case 'text':
        this.addElement('text', { text: '在此输入文字...', fontSize: 16, fontFamily: this._getDefaultFontFamily() });
        break;
      case 'image': {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.className = 'hidden-input';
        input.addEventListener('change', async () => {
          const result = await MediaHandler.loadImageFromFile(input);
          if (result) {
            const blob = await fetch(result.src).then(r => r.blob());
            const mediaId = 'media-img-' + Date.now();
            await STORAGE.saveMedia(mediaId, 'image', blob);
            this.addElement('image', {
              src: result.src,
              width: 200,
              frameStyle: 'thin-white',
              id: mediaId,
              _blob: blob
            });
          }
        });
        document.body.appendChild(input);
        input.click();
        input.remove();
        break;
      }
      case 'voice':
        this.startVoiceRecording();
        break;
      case 'video': {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'video/*';
        input.className = 'hidden-input';
        input.addEventListener('change', async () => {
          const result = await MediaHandler.loadVideoFromFile(input);
          if (result) {
            const mediaId = 'media-video-' + Date.now();
            await STORAGE.saveMedia(mediaId, 'video', result.blob);
            this.addElement('video', {
              src: result.src,
              width: 300,
              id: mediaId
            });
          }
        });
        document.body.appendChild(input);
        input.click();
        input.remove();
        break;
      }
      case 'stamp':
        // 切换到贴纸面板
        document.getElementById('stamp-grid').scrollIntoView({ behavior: 'smooth' });
        break;
      case 'bgm': {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'audio/*';
        input.className = 'hidden-input';
        input.addEventListener('change', async () => {
          const result = await MediaHandler.loadAudioFromFile(input);
          if (result) {
            this.letter.bgm = { src: result.src, name: result.name };
            const player = document.getElementById('bgm-player');
            player.style.display = 'block';
            const audio = document.getElementById('bgm-audio');
            audio.src = result.src;
            const removeBtn = document.getElementById('remove-bgm-btn');
            removeBtn.onclick = () => {
              this.letter.bgm = null;
              audio.src = '';
              player.style.display = 'none';
            };
          }
        });
        document.body.appendChild(input);
        input.click();
        input.remove();
        break;
      }
    }
  },

  startVoiceRecording() {
    const toolbar = document.getElementById('toolbar');
    let indicator = toolbar.querySelector('.recording-indicator');
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.className = 'recording-indicator';
      indicator.innerHTML = `
        <div class="recording-dot"></div>
        <span class="recording-time" id="recording-time">00:00</span>
        <button class="tool-btn" id="stop-recording-btn" style="width:auto;padding:4px 10px;font-size:0.75rem;" title="停止录制">■ 停止</button>
      `;
      toolbar.querySelector('.toolbar-section:last-child').after(indicator);

      document.getElementById('stop-recording-btn').addEventListener('click', async () => {
        MediaHandler.stopRecording();
        indicator.classList.remove('active');
        clearInterval(recordingInterval);

        const blob = MediaHandler.currentRecordingBlob;
        if (blob) {
          const mediaId = 'media-voice-' + Date.now();
          await STORAGE.saveMedia(mediaId, 'voice', blob);
          const duration = Math.ceil((Date.now() - MediaHandler.recordingStartTime) / 1000);
          this.addElement('voice', {
            src: URL.createObjectURL(blob),
            duration,
            id: mediaId
          });
        }
        indicator.remove();
      });
    }

    indicator.classList.add('active');
    MediaHandler.startRecording((timeStr) => {
      const el = document.getElementById('recording-time');
      if (el) el.textContent = timeStr;
    });
  },

  updateTitle() {
    const title = document.getElementById('editor-title');
    if (this.letter.recipient) {
      title.textContent = `写信给 ${this.letter.recipient}`;
    } else {
      title.textContent = '新建信件';
    }
  },

  _serializeLetter() {
    const bodyTextElem = this.elements.find(e => e._isBodyText);
    if (bodyTextElem) {
      this.letter.bodyText = bodyTextElem.text || '';
    }

    const filterElements = (elements) => elements
      .filter(e => !e._isBodyText)
      .map(e => {
        const clean = { ...e };
        delete clean._blob;
        delete clean._isBodyText;
        return clean;
      });

    this.letter.pages = this.pages.map(page => ({
      ...page,
      elements: filterElements(page.elements)
    }));
    this.letter.content = filterElements(this.elements);
    this.letter.updatedAt = Date.now();
    this.letter.status = 'draft';
    return this.letter;
  },

  _escapeItemText(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[char]);
  },

  _updateItemAttachmentButton() {
    const button = document.getElementById('letter-item-attachments-btn');
    if (!button || !this.letter) return;
    const count = Array.isArray(this.letter.itemAttachmentIds) ? this.letter.itemAttachmentIds.length : 0;
    button.textContent = `🎁 随信物品 ${count}/8`;
  },

  async openItemAttachmentDrawer() {
    const drawer = document.getElementById('letter-item-drawer');
    const status = document.getElementById('letter-item-drawer-status');
    if (!drawer) return;
    drawer.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
    if (status) status.textContent = '正在读取账号背包…';
    try {
      this._mailInventory = await MailService.getInventory();
      this.renderItemAttachmentDrawer();
    } catch (error) {
      console.error('[Editor] Load inventory failed:', error);
      if (status) status.textContent = '背包读取失败，请确认 3000 服务已启动后重试。';
    }
  },

  closeItemAttachmentDrawer() {
    const drawer = document.getElementById('letter-item-drawer');
    drawer?.classList.remove('open');
    drawer?.setAttribute('aria-hidden', 'true');
  },

  renderItemAttachmentDrawer() {
    const grid = document.getElementById('letter-item-grid');
    const status = document.getElementById('letter-item-drawer-status');
    if (!grid || !this.letter) return;
    const items = this._mailInventory?.items || [];
    const selectedIds = this.letter.itemAttachmentIds || [];
    const byId = Object.fromEntries(items.map(item => [item.instanceId, item]));
    const cards = items.map(item => {
      const selected = selectedIds.includes(item.instanceId);
      const equipped = Boolean(item.equippedSlot);
      const definition = item.definition || {};
      return `
        <button type="button" class="letter-item-card${selected ? ' selected' : ''}"
          data-letter-item-id="${this._escapeItemText(item.instanceId)}"
          ${equipped ? 'disabled' : ''} aria-pressed="${selected}">
          <img src="${this._escapeItemText(definition.icon || '')}" alt="">
          <span><strong>${this._escapeItemText(definition.name || item.definitionId)}</strong>
            <small>${this._escapeItemText(item.originLabel || '来自 既有物品')}</small>
            <em>${equipped ? '已装备，请先卸下' : this._escapeItemText(item.acquisitionLabel || '既有物品')}</em>
          </span>
        </button>
      `;
    });
    for (const instanceId of selectedIds) {
      if (byId[instanceId]) continue;
      cards.unshift(`
        <button type="button" class="letter-item-card unavailable selected"
          data-letter-item-id="${this._escapeItemText(instanceId)}" aria-pressed="true">
          <span><strong>物品已不可用</strong><small>可能已使用、丢弃或转赠</small><em>点击从草稿移除</em></span>
        </button>
      `);
    }
    grid.innerHTML = cards.join('') || '<p class="letter-item-empty">当前账号背包中还没有可随信寄出的物品。</p>';
    grid.querySelectorAll('[data-letter-item-id]').forEach(button => {
      button.addEventListener('click', () => {
        const instanceId = button.dataset.letterItemId;
        const current = this.letter.itemAttachmentIds || [];
        if (current.includes(instanceId)) {
          this.letter.itemAttachmentIds = current.filter(id => id !== instanceId);
        } else {
          if (current.length >= 8) {
            if (status) status.textContent = '一封信最多只能附带 8 件物品。';
            return;
          }
          this.letter.itemAttachmentIds = [...current, instanceId];
        }
        this.letter.updatedAt = Date.now();
        this._updateItemAttachmentButton();
        this.renderItemAttachmentDrawer();
      });
    });
    if (status) {
      status.textContent = selectedIds.length
        ? `已选择 ${selectedIds.length}/8 件；发送前仍会由服务器统一核验。`
        : '选择物品后，它们会在发送成功时进入托管。';
    }
  },

  async save(showMessage = true) {
    const saveButton = document.getElementById('save-letter-btn');
    this._serializeLetter();
    if (saveButton) saveButton.disabled = true;
    try {
      if (AuthManager.getCurrentUser() && typeof MailService !== 'undefined') {
        await MailService.saveDraft(this.letter, this.letter.recipientAccountKey || '');
        await MailService.getMailbox(this.letter.mailboxId);
      } else {
        const isShared = MailboxManager.isSharedMailbox(this.letter.mailboxId);
        if (isShared) {
          await STORAGE.saveSharedLetterWithMedia(this.letter.mailboxId, this.letter);
        } else {
          await STORAGE.saveLetterWithMedia(this.letter);
        }
      }
      if (showMessage) alert('草稿已保存。');
      return true;
    } catch (error) {
      console.error('[Editor] Save draft failed:', error);
      if (showMessage) alert('草稿保存失败，请确认 3000 服务已启动后重试。');
      return false;
    } finally {
      if (saveButton) saveButton.disabled = false;
    }
  },

  // ===== 万物送信 · 信使选择 =====
  openCarrierPicker() {
    const overlay = document.getElementById('carrier-picker-overlay');
    const grid = document.getElementById('carrier-picker-grid');
    if (!overlay || !grid) return;
    const roster = window.CARRIER_ROSTER || [];
    const current = this.letter.carrierId ? roster.find(c => c.id === this.letter.carrierId) : null;
    grid.innerHTML = roster.map(c => {
      const speed = Math.max(1, Math.round(c.baseSpeed * 5));
      const risk = c.predationRate ? Math.round(c.predationRate * 5) : 0;
      const life = c.lifespan === Infinity ? 5 : Math.min(5, Math.max(1, Math.round(c.lifespan / 6)));
      const wonder = c.category === 'scifi' ? 5 : (c.specialAbilities.length ? 4 : 2);
      const isActive = current && current.id === c.id;
      return `
        <div class="carrier-card ${isActive ? 'active' : ''}" data-carrier-id="${c.id}">
          <div class="carrier-emoji">${c.emoji || '✉'}</div>
          <div class="carrier-name">${c.name}</div>
          <div class="carrier-meta">${c.category === 'real' ? '真实' : '科幻/奇幻'} · ${c.lore.slice(0, 18)}…</div>
          <div class="carrier-stats">
            ${['speed', 'life', 'risk', 'wonder'].map((k, i) => {
              const v = [speed, life, risk, wonder][i];
              const label = ['速', '寿', '险', '奇'][i];
              return `<span class="carrier-stat" title="${label}">
                <span class="carrier-stat-label">${label}</span>
                <span class="carrier-stat-bars">${'▮'.repeat(v)}${'▯'.repeat(5 - v)}</span>
              </span>`;
            }).join('')}
          </div>
          <div class="carrier-lore">${c.lore}</div>
        </div>`;
    }).join('') || '<div class="carrier-grid-empty">信使库为空</div>';

    grid.querySelectorAll('.carrier-card').forEach(card => {
      card.addEventListener('click', () => this.selectCarrier(card.dataset.carrierId));
    });
    // 回填在途/定时选项
    const transitCheck = document.getElementById('carrier-transit-check');
    const deliverAtInput = document.getElementById('carrier-deliver-at');
    if (transitCheck) transitCheck.checked = this.letter.journeyMode === 'transit';
    if (deliverAtInput) {
      deliverAtInput.value = this.letter.journeyDeliverAt
        ? new Date(this.letter.journeyDeliverAt).toISOString().slice(0, 16)
        : '';
    }
    overlay.classList.add('active');
    overlay.setAttribute('aria-hidden', 'false');
  },

  closeCarrierPicker() {
    const overlay = document.getElementById('carrier-picker-overlay');
    if (overlay) {
      overlay.classList.remove('active');
      overlay.setAttribute('aria-hidden', 'true');
    }
  },

  selectCarrier(carrierId, auto = false) {
    const roster = window.CARRIER_ROSTER || [];
    const carrier = roster.find(c => c.id === carrierId);
    if (!carrier) return;
    this.letter.carrierId = carrier.id;
    this._renderCarrierSelected();
    // 生成预期提示
    const status = document.getElementById('carrier-picker-status');
    if (status && window.JourneyEngine) {
      status.textContent = `已选择「${carrier.name}」— ` + JourneyEngine.fuzzyTime(carrier);
    }
    // 更新卡片高亮
    document.querySelectorAll('#carrier-picker-grid .carrier-card').forEach(card => {
      card.classList.toggle('active', card.dataset.carrierId === carrierId);
    });
    if (auto) {
      setTimeout(() => this.closeCarrierPicker(), 600);
    }
  },

  _renderCarrierSelected() {
    const roster = window.CARRIER_ROSTER || [];
    const carrier = roster.find(c => c.id === this.letter.carrierId);
    const box = document.getElementById('carrier-selected');
    if (!box) return;
    if (!carrier) {
      box.style.display = 'none';
      return;
    }
    let expected = '';
    if (window.JourneyEngine) expected = JourneyEngine.fuzzyTime(carrier);
    box.style.display = 'block';
    box.innerHTML = `
      <div class="carrier-selected-row">
        <span class="carrier-selected-emoji">${carrier.emoji || '✉'}</span>
        <div class="carrier-selected-info">
          <div class="carrier-selected-name">${carrier.name}</div>
          <div class="carrier-selected-detail">${carrier.category === 'real' ? '真实' : '科幻/奇幻'}信使</div>
        </div>
        <button id="carrier-clear-btn" type="button" class="carrier-clear-btn">重选</button>
      </div>
      ${expected ? `<div class="carrier-selected-expected">预期抵达：${expected}</div>` : ''}
    `;
    const clearBtn = document.getElementById('carrier-clear-btn');
    if (clearBtn) clearBtn.addEventListener('click', () => {
      delete this.letter.carrierId;
      this._renderCarrierSelected();
    });
  },

  // 读取在途/定时选项到 letter（供 send 使用）
  _syncCarrierJourneyOptions() {
    const transitCheck = document.getElementById('carrier-transit-check');
    const deliverAtInput = document.getElementById('carrier-deliver-at');
    if (transitCheck) {
      if (transitCheck.checked) this.letter.journeyMode = 'transit';
      else delete this.letter.journeyMode;
    }
    if (deliverAtInput && deliverAtInput.value) {
      this.letter.journeyDeliverAt = new Date(deliverAtInput.value).getTime();
    } else {
      delete this.letter.journeyDeliverAt;
    }
  },

  async send() {
    if (!this.letter.recipientAccountKey) {
      alert('请先选择真实收信人。');
      return;
    }
    const sendButton = document.getElementById('send-letter-btn');
    this._serializeLetter();
    // 读取在途/定时选项（若信使弹窗未关则先同步）
    this._syncCarrierJourneyOptions();
    // 万物送信：未选信使则随机指派，并生成旅程（事件链 + 旅程志）
    if (window.JourneyEngine && window.CARRIER_ROSTER) {
      if (!this.letter.carrierId) {
        const roster = window.CARRIER_ROSTER;
        this.letter.carrierId = (roster.random ? roster.random() : roster[0]).id;
      }
      const opts = { mode: this.letter.journeyMode === 'transit' ? 'transit' : 'instant' };
      if (this.letter.journeyDeliverAt) opts.deliverAt = this.letter.journeyDeliverAt;
      this.letter.journey = window.JourneyEngine.startJourney(this.letter, this.letter.carrierId, opts);
    }
    if (sendButton) {
      sendButton.disabled = true;
      sendButton.textContent = '正在发送…';
    }
    try {
      await MailService.sendLetter(this.letter, this.letter.recipientAccountKey);
      await MailService.getMailbox(this.letter.mailboxId);
      this.letter.itemAttachmentIds = [];
      this._updateItemAttachmentButton();
      this.closeItemAttachmentDrawer();
      this.pendingRecipient = null;
      alert(`信件已发送给 ${this.letter.recipient}。`);
      App._mailFolder = 'sent';
      document.querySelectorAll('.mail-folder-tab').forEach(tab => {
        const active = tab.dataset.folder === 'sent';
        tab.classList.toggle('active', active);
        tab.setAttribute('aria-selected', active ? 'true' : 'false');
      });
      // 跨信箱寄信：目标可能是对方个人信箱（不在当前用户可见列表），
      // 发送后跳转若找不到会白屏 —— 回退到进入编辑器前的信箱。
      const targetMailboxId = this.letter.mailboxId;
      const targetVisible = (typeof MailboxManager !== 'undefined' && MailboxManager.getMailboxes
        ? (MailboxManager.getMailboxes() || []).some(m => m && m.id === targetMailboxId)
        : true);
      const jumpMailboxId = targetVisible ? targetMailboxId : (App.currentMailboxId || targetMailboxId);
      App.navigate('mailbox', { mailboxId: jumpMailboxId });
    } catch (error) {
      console.error('[Editor] Send failed:', error);
      const itemErrors = {
        item_attachment_limit: '一封信最多只能附带 8 件物品。',
        item_attachment_duplicate: '随信物品中有重复项，请重新选择。',
        item_attachment_invalid: '有随信物品已被使用、丢弃或转赠。请打开随信物品面板移除失效项后重试。',
        item_attachment_equipped: '有随信物品仍处于装备状态，请先在背包中卸下。'
      };
      alert(error.code === 'recipient_unavailable'
        ? '收信账号当前不可用，请重新选择收信人。'
        : itemErrors[error.code] ||
          '发送失败，内容仍保留在编辑器中，请确认 3000 服务已启动后重试。');
    } finally {
      if (sendButton) {
        sendButton.disabled = false;
        sendButton.textContent = '✉ 发送';
      }
    }
  },

  // === 对齐操作 ===
  alignElements(type) {
    if (!this.selectedId) return;
    const elem = this.elements.find(e => e.id === this.selectedId);
    if (!elem) return;
    const canvas = document.getElementById('paper-canvas');
    const canvasW = canvas.offsetWidth;

    this.saveUndoState();
    if (type === 'left') {
      elem.x = 20;
    } else if (type === 'center') {
      const el = canvas.querySelector(`[data-id="${elem.id}"]`);
      const w = el ? el.offsetWidth : (elem.width || 200);
      elem.x = Math.max(0, (canvasW - w) / 2);
    } else if (type === 'right') {
      const el = canvas.querySelector(`[data-id="${elem.id}"]`);
      const w = el ? el.offsetWidth : (elem.width || 200);
      elem.x = Math.max(0, canvasW - w - 20);
    }
    const el = canvas.querySelector(`[data-id="${elem.id}"]`);
    if (el) el.style.left = elem.x + 'px';
  },

  // === 自动草稿保存 ===
  autoSaveDraft() {
    if (!this.letter || App.currentView !== 'editor') return;
    const status = document.getElementById('draft-status');
    if (status) status.textContent = '自动保存：保存中…';

    const isShared = MailboxManager.isSharedMailbox(this.letter.mailboxId);
    const draftData = JSON.parse(JSON.stringify({
      ...this.letter,
      pages: this.pages,
      content: this.elements,
      updatedAt: Date.now()
    }));

    if (isShared) {
      const letters = STORAGE.loadSharedLetters(this.letter.mailboxId);
      const idx = letters.findIndex(l => l.id === this.letter.id);
      if (idx >= 0) {
        letters[idx] = draftData;
      } else {
        letters.push(draftData);
      }
      STORAGE.saveSharedLetters(this.letter.mailboxId, letters);
    } else {
      const letters = STORAGE.loadLetters();
      const idx = letters.findIndex(l => l.id === this.letter.id);
      if (idx >= 0) {
        letters[idx] = draftData;
      } else {
        letters.push(draftData);
      }
      STORAGE.saveLetters(letters);
    }

    if (AuthManager.getCurrentUser() && typeof MailService !== 'undefined') {
      MailService.saveDraft(draftData, draftData.recipientAccountKey || '')
        .catch(error => console.warn('[Editor] Auto-save to server failed:', error));
    }

    // 保留最近5个草稿版本
    const draftsKey = 'xinjian_drafts_' + this.letter.id;
    const drafts = JSON.parse(localStorage.getItem(draftsKey) || '[]');
    drafts.unshift({ time: Date.now(), snapshot: JSON.stringify(draftData) });
    if (drafts.length > 5) drafts.length = 5;
    localStorage.setItem(draftsKey, JSON.stringify(drafts));

    if (status) {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      status.textContent = `自动保存：${hh}:${mm} 已保存`;
    }
  },

  // === 导出备份 ===
  exportBackup() {
    if (!this.letter) return;
    const backup = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      letter: JSON.parse(JSON.stringify({
        ...this.letter,
        pages: this.pages,
        content: this.elements
      }))
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `letter-backup-${this.letter.id}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  // === 导入备份 ===
  importBackup() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const backup = JSON.parse(ev.target.result);
          if (!backup.letter) throw new Error('无效的备份文件');
          const imported = backup.letter;
          const isShared = MailboxManager.isSharedMailbox(imported.mailboxId);
          if (isShared) {
            const letters = STORAGE.loadSharedLetters(imported.mailboxId);
            const idx = letters.findIndex(l => l.id === imported.id);
            if (idx >= 0) {
              if (!confirm('已存在同ID信件，是否覆盖？')) return;
              letters[idx] = imported;
            } else {
              letters.push(imported);
            }
            STORAGE.saveSharedLetters(imported.mailboxId, letters);
          } else {
            const letters = STORAGE.loadLetters();
            const idx = letters.findIndex(l => l.id === imported.id);
            if (idx >= 0) {
              if (!confirm('已存在同ID信件，是否覆盖？')) return;
              letters[idx] = imported;
            } else {
              letters.push(imported);
            }
            STORAGE.saveLetters(letters);
          }
          alert('备份导入成功，正在重新加载编辑器');
          this.init(imported.id);
        } catch (err) {
          alert('导入失败：' + err.message);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }
});
