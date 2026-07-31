/* ========================================
   App - Features (Journal/Perspective/Reply/Schedule)
   ======================================== */

Object.assign(App, {
  initJournal() {
    if (typeof Journal !== 'undefined') {
      Journal.init();
    }
  },

  /* ========================================
     双人邮箱视角切换
     ======================================== */

  currentPerspective: 'a',
  currentDualMailbox: null,

  initPerspectiveSwitch() {
    this._updatePerspectiveUI();
  },

  switchPerspective(perspective) {
    this.currentPerspective = perspective;
    this._updatePerspectiveUI();
    this.renderMailboxView(this.currentMailboxId);
  },

  _updatePerspectiveUI() {
    const btnA = document.getElementById('perspective-a-btn');
    const btnB = document.getElementById('perspective-b-btn');
    if (btnA) btnA.classList.toggle('active', this.currentPerspective === 'a');
    if (btnB) btnB.classList.toggle('active', this.currentPerspective === 'b');
  },

  _setupDualMailbox(mailbox) {
    const perspectiveSwitch = document.getElementById('perspective-switch');
    const scheduledEntry = document.getElementById('scheduled-entry');

    if (mailbox.type === 'dual') {
      this.currentDualMailbox = mailbox;
      
      if (perspectiveSwitch) {
        perspectiveSwitch.style.display = 'flex';
        const btnA = document.getElementById('perspective-a-btn');
        const btnB = document.getElementById('perspective-b-btn');
        if (btnA && mailbox.personA) {
          btnA.querySelector('.perspective-avatar').textContent = mailbox.personA.icon || '🌸';
          btnA.querySelector('.perspective-name').textContent = mailbox.personA.name || 'A';
        }
        if (btnB && mailbox.personB) {
          btnB.querySelector('.perspective-avatar').textContent = mailbox.personB.icon || '🍃';
          btnB.querySelector('.perspective-name').textContent = mailbox.personB.name || 'B';
        }
      }

      if (scheduledEntry) {
        scheduledEntry.style.display = 'flex';
        this._updateScheduledCount();
      }
    } else {
      this.currentDualMailbox = null;
      if (perspectiveSwitch) perspectiveSwitch.style.display = 'none';
      if (scheduledEntry) scheduledEntry.style.display = 'none';
    }
  },

  /* ========================================
     回信功能
     ======================================== */

  replyToLetter() {
    if (!this.currentLetterId) return;

    const letter = STORAGE.loadLetters().find(l => l.id === this.currentLetterId);
    if (!letter) return;

    const now = new Date();
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');

    const mailbox = MailboxManager.getMailboxes().find(m => m.id === letter.mailboxId);
    let senderName = letter.recipient || '';
    let recipientName = letter.sender || '';

    if (mailbox && mailbox.type === 'dual') {
      if (this.currentPerspective === 'a') {
        senderName = mailbox.personA?.name || '';
        recipientName = mailbox.personB?.name || '';
      } else {
        senderName = mailbox.personB?.name || '';
        recipientName = mailbox.personA?.name || '';
      }
    }

    const replyLetter = {
      id: 'letter-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
      mailboxId: letter.mailboxId,
      paperStyle: letter.paperStyle || 'vintage-literary',
      envelopeStyle: letter.envelopeStyle || 'kraft-brown',
      recipient: recipientName,
      sender: senderName,
      date: now.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }),
      time: `${hours}:${minutes}`,
      weekday: weekdays[now.getDay()],
      location: letter.location || '',
      letterTitle: letter.letterTitle ? `回：${letter.letterTitle}` : '回信',
      bgm: letter.bgm || null,
      content: [],
      replyTo: letter.id,
      direction: this.currentDualMailbox ? 'out' : 'reply',
      status: 'draft',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const allLetters = STORAGE.loadLetters();
    allLetters.push(replyLetter);
    STORAGE.saveLetters(allLetters);

    STORAGE.updateLetterFields(letter.id, { replied: true, replyId: replyLetter.id });

    this.navigate('editor', { letterId: replyLetter.id });
  },

  /* ========================================
     定时发送功能
     ======================================== */

  _scheduledLetterId: null,

  initScheduleModal() {
    const modal = document.getElementById('schedule-modal');
    const overlay = modal?.querySelector('.schedule-modal-overlay');
    const closeBtn = document.getElementById('schedule-modal-close');
    const cancelBtn = document.getElementById('schedule-cancel-btn');
    const confirmBtn = document.getElementById('schedule-confirm-btn');
    const presets = document.querySelectorAll('.preset-btn');

    const closeModal = () => modal?.classList.remove('active');

    if (overlay) overlay.addEventListener('click', closeModal);
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

    presets.forEach(btn => {
      btn.addEventListener('click', () => {
        const preset = btn.dataset.preset;
        const datetimeInput = document.getElementById('schedule-datetime');
        if (!datetimeInput) return;

        const now = new Date();
        let target = new Date();

        switch (preset) {
          case 'tomorrow':
            target.setDate(now.getDate() + 1);
            target.setHours(9, 0, 0, 0);
            break;
          case 'week':
            target.setDate(now.getDate() + 7);
            target.setHours(9, 0, 0, 0);
            break;
          case 'month':
            target.setMonth(now.getMonth() + 1);
            target.setHours(9, 0, 0, 0);
            break;
          case 'year':
            target.setFullYear(now.getFullYear() + 1);
            target.setHours(9, 0, 0, 0);
            break;
        }

        const year = target.getFullYear();
        const month = String(target.getMonth() + 1).padStart(2, '0');
        const day = String(target.getDate()).padStart(2, '0');
        const hours = String(target.getHours()).padStart(2, '0');
        const minutes = String(target.getMinutes()).padStart(2, '0');
        datetimeInput.value = `${year}-${month}-${day}T${hours}:${minutes}`;
      });
    });

    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => {
        const datetimeInput = document.getElementById('schedule-datetime');
        const value = datetimeInput?.value;
        if (!value) {
          alert('请选择发送时间');
          return;
        }

        const scheduledAt = new Date(value).getTime();
        if (scheduledAt <= Date.now()) {
          alert('发送时间必须在未来');
          return;
        }

        if (this._scheduledLetterId) {
          STORAGE.updateLetterFields(this._scheduledLetterId, {
            scheduledAt: scheduledAt,
            status: 'scheduled'
          });
        }

        closeModal();
        this._updateScheduledCount();
        this.navigate('mailbox', { mailboxId: this.currentMailboxId });
      });
    }
  },

  openScheduleModal(letterId) {
    const modal = document.getElementById('schedule-modal');
    const datetimeInput = document.getElementById('schedule-datetime');
    if (!modal) return;

    this._scheduledLetterId = letterId;

    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);

    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const day = String(tomorrow.getDate()).padStart(2, '0');
    const hours = String(tomorrow.getHours()).padStart(2, '0');
    const minutes = String(tomorrow.getMinutes()).padStart(2, '0');
    if (datetimeInput) datetimeInput.value = `${year}-${month}-${day}T${hours}:${minutes}`;

    modal.classList.add('active');
  },

  initScheduledLetters() {
    setInterval(() => this._checkScheduledLetters(), 60000);
  },

  _checkScheduledLetters() {
    const dueLetters = STORAGE.getDueScheduledLetters();
    dueLetters.forEach(letter => {
      STORAGE.updateLetterFields(letter.id, { status: 'sent' });
    });
  },

  renderScheduledList() {
    const listEl = document.getElementById('scheduled-list');
    if (!listEl) return;

    const letters = STORAGE.getPendingScheduledLetters();
    const mailboxLetters = letters.filter(l => l.mailboxId === this.currentMailboxId);

    if (mailboxLetters.length === 0) {
      listEl.innerHTML = `
        <div class="scheduled-empty">
          <div class="scheduled-empty-icon">🕰️</div>
          <p>暂无待寄信件</p>
          <p class="scheduled-empty-hint">写信时可以选择定时发送哦</p>
        </div>
      `;
      return;
    }

    let html = '';
    mailboxLetters.sort((a, b) => (a.scheduledAt || 0) - (b.scheduledAt || 0)).forEach(letter => {
      const scheduledDate = new Date(letter.scheduledAt);
      const dateStr = `${scheduledDate.getFullYear()}.${String(scheduledDate.getMonth() + 1).padStart(2, '0')}.${String(scheduledDate.getDate()).padStart(2, '0')} ${String(scheduledDate.getHours()).padStart(2, '0')}:${String(scheduledDate.getMinutes()).padStart(2, '0')}`;
      const countdown = this._formatCountdown(letter.scheduledAt - Date.now());

      html += `
        <div class="scheduled-item" data-id="${letter.id}">
          <div class="scheduled-item-icon">✉️</div>
          <div class="scheduled-item-info">
            <div class="scheduled-item-title">${letter.letterTitle || letter.title || '无标题信件'}</div>
            <div class="scheduled-item-time">发送时间：${dateStr}</div>
            <div class="scheduled-item-countdown">${countdown}</div>
          </div>
          <div class="scheduled-item-actions">
            <button class="scheduled-action-btn" onclick="App.sendLetterNow('${letter.id}')">立即发送</button>
            <button class="scheduled-action-btn" onclick="App.cancelScheduled('${letter.id}')">取消</button>
          </div>
        </div>
      `;
    });

    listEl.innerHTML = html;
  },

  _formatCountdown(ms) {
    if (ms <= 0) return '即将发送';
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `还有 ${days} 天 ${hours} 小时`;
    if (hours > 0) return `还有 ${hours} 小时 ${minutes} 分钟`;
    return `还有 ${minutes} 分钟`;
  },

  sendLetterNow(letterId) {
    STORAGE.updateLetterFields(letterId, { status: 'sent', scheduledAt: null });
    this.renderScheduledList();
    this._updateScheduledCount();
  },

  cancelScheduled(letterId) {
    if (!confirm('确定要取消定时发送吗？信件将转为草稿。')) return;
    STORAGE.updateLetterFields(letterId, { status: 'draft', scheduledAt: null });
    this.renderScheduledList();
    this._updateScheduledCount();
  },

  _updateScheduledCount() {
    const countEl = document.getElementById('scheduled-count');
    if (!countEl) return;

    const letters = STORAGE.getPendingScheduledLetters();
    const mailboxLetters = letters.filter(l => l.mailboxId === this.currentMailboxId);
    countEl.textContent = mailboxLetters.length;
    countEl.style.display = mailboxLetters.length > 0 ? 'inline-block' : 'none';
  },

  /* ========================================
     信箱视图扩展 - 双人邮箱/回信标记
     ======================================== */

  _enhanceMailboxView(mailboxId, letters) {
    const mailbox = MailboxManager.getMailboxes().find(m => m.id === mailboxId);
    if (!mailbox) return letters;

    this._setupDualMailbox(mailbox);

    if (mailbox.type === 'dual') {
      const perspective = this.currentPerspective;
      return letters.filter(l => {
        if (l.direction === 'in') {
          return true;
        } else if (l.direction === 'out') {
          return true;
        }
        return true;
      });
    }

    return letters;
  },
});
