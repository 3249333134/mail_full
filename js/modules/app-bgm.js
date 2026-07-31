/* ========================================
   App - BGM Management
   ======================================== */

Object.assign(App, {
  initBGM() {
    const homeToggle = document.getElementById('home-bgm-toggle');
    const homeDropdown = document.getElementById('home-bgm-dropdown');
    const homeDropdownToggle = document.getElementById('home-bgm-dropdown-toggle');
    const homeDropdownMenu = document.getElementById('home-bgm-dropdown-menu');
    
    const mailboxToggle = document.getElementById('mailbox-bgm-toggle');
    const mailboxDropdown = document.getElementById('mailbox-bgm-dropdown');
    const mailboxDropdownToggle = document.getElementById('mailbox-bgm-dropdown-toggle');
    const mailboxDropdownMenu = document.getElementById('mailbox-bgm-dropdown-menu');

    if (homeToggle) {
      homeToggle.addEventListener('click', () => this.toggleMailboxBGM('home'));
    }
    if (homeDropdownToggle) {
      homeDropdownToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        homeDropdown.classList.toggle('open');
        mailboxDropdown?.classList.remove('open');
      });
    }
    if (homeDropdownMenu) {
      this._renderBgmDropdown('home', homeDropdownMenu);
    }

    if (mailboxToggle) {
      mailboxToggle.addEventListener('click', () => this.toggleMailboxBGM('mailbox'));
    }
    if (mailboxDropdownToggle) {
      mailboxDropdownToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        mailboxDropdown.classList.toggle('open');
        homeDropdown?.classList.remove('open');
      });
    }
    if (mailboxDropdownMenu) {
      this._renderBgmDropdown('mailbox', mailboxDropdownMenu);
    }

    document.addEventListener('click', () => {
      homeDropdown?.classList.remove('open');
      mailboxDropdown?.classList.remove('open');
    });
  },

  _renderBgmDropdown(context, menuEl) {
    const currentBgm = this._getBgmForContext(context);
    menuEl.innerHTML = this._bgmList.map(bgm => `
      <div class="bgm-dropdown-item ${bgm.id === currentBgm.id ? 'active' : ''}" 
           data-bgm-id="${bgm.id}" data-context="${context}">
        <span>🎵</span>
        <span>${bgm.name}</span>
      </div>
    `).join('');

    menuEl.querySelectorAll('.bgm-dropdown-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        const bgmId = item.dataset.bgmId;
        const ctx = item.dataset.context;
        this._saveBgmForContext(ctx, bgmId);
        
        const dropdown = menuEl.closest('.bgm-dropdown');
        if (dropdown) dropdown.classList.remove('open');
        
        menuEl.querySelectorAll('.bgm-dropdown-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        
        if (this._isBgmEnabled()) {
          this.playMailboxBGM(ctx);
        }
      });
    });
  },

  _updateBgmDropdown(context) {
    const menuId = context === 'home' ? 'home-bgm-dropdown-menu' : 'mailbox-bgm-dropdown-menu';
    const menuEl = document.getElementById(menuId);
    if (menuEl) {
      this._renderBgmDropdown(context, menuEl);
    }
  },

  _getBgmForContext(context) {
    let bgmId;
    if (context === 'home') {
      bgmId = localStorage.getItem('bgm_home') || 'qingqing';
    } else {
      bgmId = localStorage.getItem(`bgm_${this.currentMailboxId}`) || this._mailboxDefaultBgm[this.currentMailboxId] || 'default';
    }
    return this._bgmList.find(b => b.id === bgmId) || this._bgmList[0];
  },

  _saveBgmForContext(context, bgmId) {
    if (context === 'home') {
      localStorage.setItem('bgm_home', bgmId);
    } else {
      localStorage.setItem(`bgm_${this.currentMailboxId}`, bgmId);
    }
  },

  _isBgmEnabled() {
    return localStorage.getItem('bgm_enabled') !== 'false';
  },

  _setBgmEnabled(enabled) {
    localStorage.setItem('bgm_enabled', enabled ? 'true' : 'false');
  },

  _stopMailboxBGM() {
    if (this._mailboxBgmAudio) {
      this._mailboxBgmAudio.pause();
      try {
        this._mailboxBgmAudio.src = '';
        this._mailboxBgmAudio.load();
      } catch (e) {}
    }
    this._mailboxBgmPlaying = false;
  },

  playMailboxBGM(context) {
    const bgm = this._getBgmForContext(context);
    if (!bgm || !bgm.src) return;

    if (this._mailboxBgmCurrentSrc === bgm.src && this._mailboxBgmPlaying) {
      this._updateBgmButtons(context, true);
      this._updateBgmDropdown(context);
      return;
    }

    this._stopReaderBGM();

    if (!this._mailboxBgmAudio) {
      this._mailboxBgmAudio = new Audio();
      this._mailboxBgmAudio.loop = true;
      this._mailboxBgmAudio.volume = 0.4;
    }

    if (this._mailboxBgmCurrentSrc === bgm.src) {
      const playPromise = this._mailboxBgmAudio.play();
      if (playPromise) {
        playPromise.then(() => {
          this._mailboxBgmPlaying = true;
          this._updateBgmButtons(context, true);
          this._updateBgmDropdown(context);
        }).catch(() => {
          this._mailboxBgmPlaying = false;
          this._updateBgmButtons(context, false);
        });
      }
      return;
    }

    const audio = this._mailboxBgmAudio;
    const currentSrc = bgm.src;
    const bgmName = bgm.name;
    audio.pause();
    this._mailboxBgmPlaying = false;
    this._mailboxBgmCurrentSrc = currentSrc;

    try {
      audio.src = currentSrc;
      audio.load();
    } catch (e) {
      return;
    }

    const playPromise = audio.play();
    if (playPromise) {
      playPromise.then(() => {
        if (this._mailboxBgmCurrentSrc === currentSrc) {
          this._mailboxBgmPlaying = true;
          this._updateBgmButtons(context, true);
          this._updateBgmDropdown(context);
          console.log(`[BGM] 正在播放: ${bgmName}`);
        }
      }).catch(() => {
        if (this._mailboxBgmCurrentSrc === currentSrc) {
          this._mailboxBgmPlaying = false;
          this._updateBgmButtons(context, false);
        }
        const playOnInteract = () => {
          if (this._mailboxBgmCurrentSrc === currentSrc && this._mailboxBgmAudio === audio) {
            audio.play().then(() => {
              if (this._mailboxBgmCurrentSrc === currentSrc) {
                this._mailboxBgmPlaying = true;
                this._updateBgmButtons(context, true);
                this._updateBgmDropdown(context);
              }
            }).catch(() => {});
          }
          document.removeEventListener('click', playOnInteract);
          document.removeEventListener('touchstart', playOnInteract);
        };
        document.addEventListener('click', playOnInteract, { once: true });
        document.addEventListener('touchstart', playOnInteract, { once: true });
      });
    }
  },

  _stopReaderBGM() {
    if (this._recordAudio) {
      this._recordAudio.pause();
      this._recordAudio = null;
      const playBtn = document.getElementById('record-play-btn');
      const waveform = document.getElementById('record-waveform');
      if (playBtn) {
        playBtn.textContent = '▶';
        playBtn.classList.remove('playing');
      }
      if (waveform) waveform.classList.remove('playing');
    }
  },

  pauseMailboxBGM(context) {
    if (this._mailboxBgmAudio) {
      this._mailboxBgmAudio.pause();
    }
    this._mailboxBgmPlaying = false;
    this._updateBgmButtons(context, false);
    this._updateBgmDropdown(context);
  },

  toggleMailboxBGM(context) {
    if (this._mailboxBgmPlaying) {
      this.pauseMailboxBGM(context);
      this._setBgmEnabled(false);
    } else {
      this._setBgmEnabled(true);
      this.playMailboxBGM(context);
    }
  },

  switchMailboxBGM(context) {
    const currentBgm = this._getBgmForContext(context);
    const currentIndex = this._bgmList.findIndex(b => b.id === currentBgm.id);
    const nextIndex = (currentIndex + 1) % this._bgmList.length;
    const nextBgm = this._bgmList[nextIndex];

    this._saveBgmForContext(context, nextBgm.id);

    if (this._mailboxBgmPlaying) {
      this.playMailboxBGM(context);
    } else {
      this._updateBgmButtons(context, false);
    }
  },

  _updateBgmButtons(context, playing) {
    const toggleBtn = context === 'home'
      ? document.getElementById('home-bgm-toggle')
      : document.getElementById('mailbox-bgm-toggle');

    if (toggleBtn) {
      if (playing) {
        toggleBtn.textContent = '⏸';
        toggleBtn.classList.add('playing');
        toggleBtn.title = '暂停 BGM';
      } else {
        toggleBtn.textContent = '🎵';
        toggleBtn.classList.remove('playing');
        toggleBtn.title = '播放 BGM';
      }
    }
  },

  switchViewBGM(context) {
    this._updateBgmDropdown(context);
    if (!this._isBgmEnabled()) {
      this._updateBgmButtons(context, false);
      return;
    }
    this.playMailboxBGM(context);
  },

});
