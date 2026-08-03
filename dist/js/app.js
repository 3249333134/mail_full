/* ========================================
   信笺 — 应用主入口 / 路由
   ======================================== */

const App = {
  currentView: 'home',
  currentMailboxId: null,
  currentLetterId: null,
  mailboxActiveIndex: {},
  diaryTotalPages: 47,
  diaryCurrentPage: 1,
  _xiejianCharacterId: '',
  _xiejianMapKey: '',
  _xiejianPendingMapKey: '',
  _xiejianMapPositions: {},
  _xiejianEntryBound: false,
  _mailFolder: 'timeline',
  _mailPollTimer: null,
  _pendingRecipient: null,
  _recipientPickerBound: false,
  _xiejianUiBound: false,
  _xiejianPromptTimer: null,
  _inventoryFilter: 'all',
  _selectedInventoryItemId: '',

  _bgmList: [
    { id: 'qingqing', name: '轻轻', src: 'mailfile/bgm/轻轻（Cover 张靓颖）_爱给网_aigei_com.mp3' }
  ],

  _mailboxDefaultBgm: {
    'mailbox-brenuo': 'qingqing',
    'mailbox-daliang': 'qingqing',
    'mailbox-tianzhu': 'qingqing',
    'mailbox-rugu': 'qingqing',
    'mailbox-taozhi': 'qingqing',
    'mailbox-zhaixing': 'qingqing',
    'mailbox-xiaowangzi': 'qingqing'
  },

  init() {
    AuthManager.init();

    this.bindAuthEvents();

    const currentUser = AuthManager.getCurrentUser();
    if (currentUser) {
      MailService.syncAccount(currentUser).catch(error => {
        console.warn('[MailService] Account sync failed:', error);
      });
      const sharedMailboxId = AuthManager.getSharedMailboxId(currentUser.id);
      if (sharedMailboxId) {
        this._enterSharedMailboxMode(sharedMailboxId);
      } else {
        this.showAppView();
      }
      // 预热：拉取远端信箱列表（异步，不阻塞首屏）
      if (typeof MailboxManager.getMailboxesAsync === 'function') {
        Promise.resolve().then(async () => {
          try {
            await MailboxManager.getMailboxesAsync({ force: true });
            // 拉完之后重刷一次侧边栏和空状态，保证远端建的信箱在当前页面可见
            const sidebarNav = document.getElementById('mailbox-sidebar-nav') || document.getElementById('sidebar-nav');
            if (sidebarNav && typeof MailboxManager.renderSidebarNav === 'function') {
              const lastId = STORAGE.loadLastMailboxId && STORAGE.loadLastMailboxId();
              MailboxManager.renderSidebarNav(sidebarNav, lastId);
            }
            if (typeof this._renderEmptyState === 'function') {
              try { this._renderEmptyState(); } catch (_) {}
            }
          } catch (e) {
            console.warn('[app] 预热远端信箱失败：', e?.message || e);
          }
        });
      }
      // 预热：拉手账（远端 -> 本地合并）
      if (typeof STORAGE.mergeRemoteJournalsToLocal === 'function') {
        Promise.resolve().then(() => STORAGE.mergeRemoteJournalsToLocal()).catch(() => {});
      }
    } else {
      this.showLoginView();
    }

    STORAGE.initDB().then(() => {
      MailboxManager.initSampleData();
      this.bindGlobalEvents();
      this.initDiary();
      this.initBGM();
      this.initMailboxModal();
      this.initJournal();
      this.initScheduledLetters();
      this.initScheduleModal();
      this.initPerspectiveSwitch();
      this._bindRecipientPicker();
      this._bindXiejianGameUI();
      this._startMailPolling();

      console.log('信笺已启动 ✉');

      // 游戏领域模块非阻塞启动：远端优先，任何失败都回落本地定义。
      Promise.resolve().then(async () => {
        try {
          const mod = await import('./game/index.js');
          const GS = mod.GameSystems || mod.default;
          if (!GS) return;
          await GS.bootstrap({ skipRemote: false });
        } catch (e) {
          console.warn('[GameSystems] 已回退现有本地逻辑：', (e && e.message) || e);
        }
      });

    }).catch(err => {
      console.warn('IndexedDB 初始化失败，将使用 localStorage 模式:', err);
      this.bindGlobalEvents();
      this.initMailboxModal();
      this.initJournal();
      // 同样尝试启动模块化系统（localStorage 模式也一样可以用）
      Promise.resolve().then(async () => {
        try {
          const mod = await import('./game/index.js');
          const GS = mod.GameSystems || mod.default;
          if (GS) await GS.bootstrap({ skipRemote: false });
        } catch (_) { /* 静默失败 */ }
      });
    });

  },

  showLoginView() {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('login-view').classList.add('active');
    this.currentView = 'login';
    history.replaceState({ view: 'login', params: {} }, '', '#login');
    this._updateSidebarUserInfo();
  },

  showAppView() {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('home-view').classList.add('active');
    this.currentView = 'home';
    history.replaceState({ view: 'home', params: {} }, '', '#home');
    this.renderHome();
    this._updateSidebarUserInfo();
  },

  bindAuthEvents() {
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
      loginBtn.addEventListener('click', () => this._handleLogin());
    }

    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this._handleLogin();
      });
    }

    const registerBtn = document.getElementById('register-btn');
    if (registerBtn) {
      registerBtn.addEventListener('click', () => this._handleRegister());
    }

    const registerForm = document.getElementById('register-form');
    if (registerForm) {
      registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this._handleRegister();
      });
    }

    const switchToRegister = document.getElementById('switch-to-register');
    if (switchToRegister) {
      switchToRegister.addEventListener('click', () => this._showRegisterForm());
    }

    const switchToLogin = document.getElementById('switch-to-login');
    if (switchToLogin) {
      switchToLogin.addEventListener('click', () => this._showLoginForm());
    }

    const presetBtns = document.querySelectorAll('.preset-btn');
    presetBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const username = btn.dataset.username;
        this._handlePresetLogin(username);
      });
    });

    const guestBtn = document.getElementById('guest-mode-btn');
    if (guestBtn) {
      guestBtn.addEventListener('click', () => this._handleGuestMode());
    }

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => this._handleLogout());
    }

    const mailboxLogoutBtn = document.getElementById('mailbox-logout-btn');
    if (mailboxLogoutBtn) {
      mailboxLogoutBtn.addEventListener('click', () => this._handleLogout());
    }

    const switchAccountBtn = document.getElementById('switch-account-btn');
    if (switchAccountBtn) {
      switchAccountBtn.addEventListener('click', () => this._handleSwitchAccount());
    }

    const mailboxSwitchBtn = document.getElementById('mailbox-switch-account-btn');
    if (mailboxSwitchBtn) {
      mailboxSwitchBtn.addEventListener('click', () => this._handleSwitchAccount());
    }

    const guestLoginBtn = document.getElementById('guest-login-btn');
    if (guestLoginBtn) {
      guestLoginBtn.addEventListener('click', () => this._handleGuestToLogin());
    }

    const mailboxGuestLoginBtn = document.getElementById('mailbox-guest-login-btn');
    if (mailboxGuestLoginBtn) {
      mailboxGuestLoginBtn.addEventListener('click', () => this._handleGuestToLogin());
    }
  },

  _handleLogin() {
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    const errorEl = document.getElementById('login-error');

    const result = AuthManager.login(username, password);
    if (result.success) {
      this._hideError(errorEl);
      this._onLoginSuccess(result.user);
    } else {
      this._showError(errorEl, result.message);
    }
  },

  _handleRegister() {
    const username = document.getElementById('register-username').value.trim();
    const password = document.getElementById('register-password').value;
    const password2 = document.getElementById('register-password2').value;
    const errorEl = document.getElementById('register-error');

    if (password !== password2) {
      this._showError(errorEl, '两次输入的密码不一致');
      return;
    }

    const result = AuthManager.register(username, password);
    if (result.success) {
      this._hideError(errorEl);
      const loginResult = AuthManager.login(username, password);
      if (loginResult.success) {
        this._onLoginSuccess(loginResult.user);
      }
    } else {
      this._showError(errorEl, result.message);
    }
  },

  _handlePresetLogin(displayName) {
    let username = '';
    let password = '123456';

    if (displayName === '修璟') {
      username = 'xiujing';
    } else if (displayName === '萱宣') {
      username = 'xuanxuan';
    }

    if (username) {
      const result = AuthManager.login(username, password);
      if (result.success) {
        this._hideError(document.getElementById('login-error'));
        this._onLoginSuccess(result.user);
      } else {
        this._showError(document.getElementById('login-error'), result.message || '登录失败，请重试');
      }
    }
  },

  _handleGuestMode() {
    AuthManager.logout();
    this.showAppView();
  },

  _handleGuestToLogin() {
    this.showLoginView();
  },

  _handleLogout() {
    if (!confirm('确定要退出登录吗？')) return;
    AuthManager.logout();
    this.showLoginView();
  },

  _handleSwitchAccount() {
    const currentUser = AuthManager.getCurrentUser();
    if (!currentUser) return;

    let targetUsername = '';
    let targetDisplayName = '';

    if (currentUser.role === 'xiu-jing') {
      targetUsername = 'xuanxuan';
      targetDisplayName = '萱宣';
    } else if (currentUser.role === 'xuan-xuan') {
      targetUsername = 'xiujing';
      targetDisplayName = '修璟';
    } else {
      return;
    }

    this._showSwitchToast(`正在切换到 ${targetDisplayName}...`);

    setTimeout(() => {
      AuthManager.logout();
      const result = AuthManager.login(targetUsername, '123456');
      if (result.success) {
        this._onAccountSwitched(result.user);
      }
    }, 600);
  },

  _onAccountSwitched(user) {
    MailService.syncAccount(user).catch(error => {
      console.warn('[MailService] Account sync failed:', error);
    });
    this._updateSidebarUserInfo();

    const sharedMailboxId = AuthManager.getSharedMailboxId(user.id);
    if (sharedMailboxId) {
      STORAGE.initSharedMailbox();
    }

    if (this.currentView === 'home') {
      this.renderHome();
    } else if (this.currentView === 'mailbox' && this.currentMailboxId) {
      this.renderMailboxView(this.currentMailboxId);
    } else {
      this._syncMapCharacter(user.role);
    }

    this._showSwitchToast(`已切换到 ${user.displayName}`, 1500);
  },

  _showSwitchToast(message, duration = 2000) {
    const toast = document.getElementById('account-switch-toast');
    const toastText = document.getElementById('switch-toast-text');
    if (!toast || !toastText) return;

    toastText.textContent = message;
    toast.classList.add('show');

    if (this._switchToastTimer) {
      clearTimeout(this._switchToastTimer);
    }

    if (duration > 0) {
      this._switchToastTimer = setTimeout(() => {
        toast.classList.remove('show');
        this._switchToastTimer = null;
      }, duration);
    }
  },

  /**
   * 获取指定信箱的游戏分类：xiejian / hanmen / null
   * 优先依据 mailbox.category 字段，其次按名称关键字匹配，最后回退到硬编码ID
   */
  _resolveMailboxGameCategory(mailboxId) {
    const id = mailboxId || this.currentMailboxId;
    if (!id) return null;
    const mailboxes = MailboxManager.getMailboxes();
    let mbox = mailboxes.find(m => m.id === id);
    // 若个人信箱列表里找不到，可能是共享信箱（存在 STORAGE.loadSharedMailbox 中）
    // 共享信箱默认不加入 MailboxManager.getMailboxes()，导致 name.includes('挟剑') 检查被跳过
    if (!mbox && typeof STORAGE !== 'undefined' && STORAGE.loadSharedMailbox) {
      try {
        mbox = STORAGE.loadSharedMailbox(id) || null;
      } catch (_) { mbox = null; }
    }
    if (mbox) {
      if (mbox.category === 'xiejian' || mbox.category === 'hanmen') return mbox.category;
      const name = (mbox.name || '').toString();
      if (name.includes('挟剑')) return 'xiejian';
      if (name.includes('寒门')) return 'hanmen';
    }
    if (id === 'mailbox-xiejian') return 'xiejian';
    if (id === 'mailbox-hanmen-duet' || id === 'mailbox-hanmen') return 'hanmen';
    return null;
  },

  _isXiejianMailbox(mailboxId) {
    return this._resolveMailboxGameCategory(mailboxId) === 'xiejian';
  },

  _isHanmenMailbox(mailboxId) {
    return this._resolveMailboxGameCategory(mailboxId) === 'hanmen';
  },

  _syncMapCharacter(userRole) {
    if (typeof window.gameMapRenderer === 'undefined' || !window.gameMapRenderer) return;

    if (this._isXiejianMailbox()) return;

    // 单人模式：直接加载角色，不再设置搭档
    let playerChar = '';
    if (userRole === 'xiu-jing') {
      playerChar = 'xiu-jing';
    } else if (userRole === 'xuan-xuan') {
      playerChar = 'xuan-xuan';
    } else {
      return;
    }

    if (window.gameMapRenderer.setCharacter) {
      window.gameMapRenderer.setCharacter(playerChar);
    }

    if (window.gameMapRenderer.switchMap) {
      const hmIdx = window.gameMapRenderer.getMapIndexByName
        ? window.gameMapRenderer.getMapIndexByName('寒门', 5)
        : 5;
      window.gameMapRenderer.switchMap(hmIdx);
      // 注意：hmIdx 是标准 maps 数组（this.maps，6个元素）的索引，而非 getMaps() 合并数组索引
      // getMaps() 会把 10 个挟剑子地图前置到标准地图前面，索引会偏移，因此读名用 this.maps
      const stdMaps = window.gameMapRenderer.maps || [];
      const mapNameEl = document.getElementById('map-name');
      if (mapNameEl && stdMaps[hmIdx]) {
        mapNameEl.textContent = stdMaps[hmIdx].name;
      }
    }
    if (window.gameMapRenderer.setCategory) {
      window.gameMapRenderer.setCategory('hanmen');
      const charTabs = document.querySelectorAll('.char-tab');
      charTabs.forEach(t => {
        t.classList.remove('active');
        if (t.dataset.category === 'hanmen') t.classList.add('active');
      });
      const characterGrid = document.getElementById('character-grid');
      if (characterGrid && window.gameMapRenderer.getCharactersForCategory) {
        const characters = window.gameMapRenderer.getCharactersForCategory('hanmen');
        characterGrid.innerHTML = '';
        characters.forEach(char => {
          const btn = document.createElement('button');
          btn.className = 'character-card';
          btn.dataset.char = char.id;
          if (char.id === window.gameMapRenderer.selectedCharacter) {
            btn.classList.add('active');
          }
          let subtitle = char.sect || '';
          btn.innerHTML = `
            <div class="char-avatar" data-char-id="${char.id}">${char.name.charAt(0)}</div>
            <div class="char-info">
              <span class="char-name">${char.name}</span>
              ${subtitle ? `<span class="char-subtitle">${subtitle}</span>` : ''}
            </div>
          `;
          btn.addEventListener('click', () => {
            document.querySelectorAll('.character-card').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            window.gameMapRenderer.setCharacter(char.id);
          });
          characterGrid.appendChild(btn);
        });
      }
    }
  },

  _onLoginSuccess(user) {
    // 清理老用户残留数据：对新注册的普通用户，从 localStorage 中彻底移除老默认信箱 & 脏数据（无 id）
    // —— 避免 localStorage 跨用户残留把"布雷诺来信/大梁来信"等带入新用户画面
    try {
      const role = user?.role || '';
      const username = String(user?.username || '').toLowerCase();
      const isPreset = (
        role === 'xiu-jing' || role === 'xuan-xuan' ||
        username === 'xiujing' || username === 'xuanxuan' ||
        username === 'qingqing' || username === 'admin'
      );
      if (!isPreset) {
        const presetIds = new Set([
          'mailbox-brenuo','mailbox-daliang','mailbox-tianzhu',
          'mailbox-rugu','mailbox-taozhi','mailbox-zhaixing',
          'mailbox-xiaowangzi','mailbox-xiejian','mailbox-hanmen-duet'
        ]);
        const MK = (STORAGE && STORAGE.MAILBOXES_KEY) ? STORAGE.MAILBOXES_KEY : 'xinjian_mailboxes';
        const LK = (STORAGE && STORAGE.LETTERS_KEY) ? STORAGE.LETTERS_KEY : 'xinjian_letters';
        const raw = JSON.parse(localStorage.getItem(MK) || '[]');
        // ⚠️ 信箱号索引登记过的 mailboxId 保留（可能是本机其他账号创建用来邀请加入的），否则"加入信箱"会查不到
        const codesIndex = (typeof STORAGE.loadMailboxCodesIndex === 'function')
          ? (STORAGE.loadMailboxCodesIndex() || {})
          : {};
        const codeIndexedIds = new Set(Object.values(codesIndex).map(x => String(x)));
        if (Array.isArray(raw) && raw.length) {
          const cleaned = raw.filter(m => {
            if (!m || !m.id) return false;          // 脏数据（id=null 等）直接丢
            const mid = String(m.id);
            if (presetIds.has(mid)) return false;   // 默认信箱丢
            if (codeIndexedIds.has(mid)) return true; // 信箱号索引中的保留
            // 非当前 owner/成员的老信箱也移除，避免切换账号时串号
            const owner = String(m.ownerAccountKey || m.owner || m.createdBy || '').toLowerCase();
            const members = Array.isArray(m.memberAccountKeys) ? m.memberAccountKeys : (Array.isArray(m.members) ? m.members : []);
            const userId = String(user?.id || '').toLowerCase();
            const isMember = members.some(x => {
              const s = String(x || '').toLowerCase();
              return s && (s === username || s === userId || (role && s === role));
            });
            const isOwner = owner && (owner === username || owner === userId);
            if (!isOwner && !isMember) return false;
            return true;
          });
          if (cleaned.length !== raw.length) {
            localStorage.setItem(MK, JSON.stringify(cleaned));
            // 同步清理 letters 中默认信箱的信件
            const letters = JSON.parse(localStorage.getItem(LK) || '[]');
            if (Array.isArray(letters) && letters.length) {
              localStorage.setItem(LK, JSON.stringify(letters.filter(l => l && !presetIds.has(String(l.mailboxId)))));
            }
            // 清掉远端缓存，保证下次渲染重新合并
            if (STORAGE && typeof STORAGE.clearRemoteMailboxCache === 'function') {
              try { STORAGE.clearRemoteMailboxCache(); } catch (_) {}
            }
          }
        }
      }
    } catch (_) {}

    if (window.MailService && typeof MailService.syncAccount === 'function') {
      MailService.syncAccount(user).catch(error => {
        console.warn('[MailService] Account sync failed:', error);
      });
    }

    // ========== 远端上云：登录后立即全量同步（本地 → 云端 + 云端 → 本地） ==========
    const self = this;
    (async () => {
      try {
        const remoteOk = window.MailService && typeof MailService.isRemoteAvailable === 'function'
          ? await MailService.isRemoteAvailable()
          : false;
        if (remoteOk && window.MailboxManager) {
          // Step 1: 先把本地尚未上云的信箱/信件推到云端（老用户首次上云尤其重要）
          if (typeof MailboxManager.upsertAllLocalMailboxesToRemote === 'function') {
            try { await MailboxManager.upsertAllLocalMailboxesToRemote({ silent: true }); }
            catch (e) { console.warn('[sync] 本地信箱上云失败:', e?.message || e); }
          }
          if (typeof MailboxManager.upsertAllLocalLettersToRemote === 'function') {
            try { await MailboxManager.upsertAllLocalLettersToRemote({ silent: true }); }
            catch (e) { console.warn('[sync] 本地信件上云失败:', e?.message || e); }
          }
          // Step 2: 把云端信箱和信件下拉合并到本地（另一台设备创建的内容需要拉回来）
          if (typeof MailboxManager.loadRemoteMailboxesAndMergeLocal === 'function') {
            try { await MailboxManager.loadRemoteMailboxesAndMergeLocal(user); }
            catch (e) { console.warn('[sync] 下拉远端信箱失败:', e?.message || e); }
          }
          // Step 3: 对每个已有信箱，拉取远端信件合并（保证另一台设备写的信能看到）
          try {
            const boxes = MailboxManager.getMailboxes ? MailboxManager.getMailboxes() : [];
            if (Array.isArray(boxes) && typeof MailboxManager.loadRemoteLettersAndMergeLocal === 'function') {
              for (const mb of boxes) {
                if (!mb || !mb.id) continue;
                try { await MailboxManager.loadRemoteLettersAndMergeLocal(mb.id); } catch (_) {}
              }
            }
          } catch (_) {}
          // Step 4: 清除远端缓存 + 触发 UI 重渲染，保证当前页面立刻显示云端内容
          if (typeof STORAGE.clearRemoteMailboxCache === 'function') {
            try { STORAGE.clearRemoteMailboxCache(); } catch (_) {}
          }
          // 刷新侧边栏和信箱列表 UI
          if (typeof MailboxManager.renderSidebarNav === 'function') {
            const sidebarNav = document.getElementById('mailbox-sidebar-nav') || document.getElementById('sidebar-nav');
            if (sidebarNav) {
              const lastId = STORAGE.loadLastMailboxId && STORAGE.loadLastMailboxId();
              try { MailboxManager.renderSidebarNav(sidebarNav, lastId); } catch (_) {}
            }
          }
          if (typeof self.renderMailboxList === 'function') {
            try { self.renderMailboxList(); } catch (_) {}
          }
          if (typeof self._renderEmptyState === 'function') {
            try { self._renderEmptyState(); } catch (_) {}
          }
          if (typeof self._renderHeroGrid === 'function') {
            try { self._renderHeroGrid(); } catch (_) {}
          }
        }
      } catch (e) {
        console.warn('[sync] 登录后远端全量同步异常（已降级本地）:', e?.message || e);
      }
    })();

    this._startMailPolling();
    const sharedMailboxId = AuthManager.getSharedMailboxId(user.id);
    if (sharedMailboxId) {
      this._enterSharedMailboxMode(sharedMailboxId);
    } else {
      this.showAppView();
    }
  },

  _enterSharedMailboxMode(mailboxId) {
    STORAGE.initSharedMailbox();
    const sharedMailbox = STORAGE.loadSharedMailbox(mailboxId);
    if (sharedMailbox) {
      const existingMailboxes = STORAGE.loadMailboxes();
      const exists = existingMailboxes.find(m => m.id === mailboxId);
      if (!exists) {
        existingMailboxes.push(sharedMailbox);
        STORAGE.saveMailboxes(existingMailboxes);
      }
    }
    this.showAppView();
  },

  _showLoginForm() {
    document.getElementById('login-form').style.display = '';
    document.getElementById('register-form').style.display = 'none';
    document.querySelector('.auth-switch').style.display = '';
    document.getElementById('register-switch').style.display = 'none';
    document.querySelector('.preset-accounts').style.display = '';
    document.querySelector('.guest-mode').style.display = '';
  },

  _showRegisterForm() {
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('register-form').style.display = '';
    document.querySelector('.auth-switch').style.display = 'none';
    document.getElementById('register-switch').style.display = '';
    document.querySelector('.preset-accounts').style.display = 'none';
    document.querySelector('.guest-mode').style.display = 'none';
  },

  _showError(element, message) {
    if (element) {
      element.textContent = message;
      element.style.display = 'block';
    }
  },

  _hideError(element) {
    if (element) {
      element.style.display = 'none';
    }
  },

  _updateSidebarUserInfo() {
    const user = AuthManager.getCurrentUser();
    const isLoggedIn = AuthManager.isLoggedIn();

    const userNameEl = document.getElementById('user-name');
    const userRoleEl = document.getElementById('user-role');
    const userAvatarEl = document.getElementById('user-avatar');
    const logoutBtn = document.getElementById('logout-btn');

    if (userNameEl) userNameEl.textContent = user ? user.displayName : '访客';
    if (userRoleEl) {
      if (user) {
        if (user.role === 'xiu-jing') {
          userRoleEl.textContent = '修璟';
        } else if (user.role === 'xuan-xuan') {
          userRoleEl.textContent = '萱宣';
        } else {
          userRoleEl.textContent = '用户';
        }
      } else {
        userRoleEl.textContent = '访客模式';
      }
    }
    if (userAvatarEl) {
      if (user) {
        if (user.role === 'xiu-jing') {
          userAvatarEl.textContent = '🌸';
        } else if (user.role === 'xuan-xuan') {
          userAvatarEl.textContent = '🍃';
        } else {
          userAvatarEl.textContent = '👤';
        }
      } else {
        userAvatarEl.textContent = '👤';
      }
    }
    if (logoutBtn) logoutBtn.style.display = isLoggedIn ? '' : 'none';

    const switchAccountBtn = document.getElementById('switch-account-btn');
    const isPresetUser = user && (user.role === 'xiu-jing' || user.role === 'xuan-xuan');
    if (switchAccountBtn) switchAccountBtn.style.display = isPresetUser ? '' : 'none';

    const guestLoginBtn = document.getElementById('guest-login-btn');
    if (guestLoginBtn) guestLoginBtn.style.display = isLoggedIn ? 'none' : '';

    const mailboxUserNameEl = document.getElementById('mailbox-user-name');
    const mailboxUserRoleEl = document.getElementById('mailbox-user-role');
    const mailboxUserAvatarEl = document.getElementById('mailbox-user-avatar');
    const mailboxLogoutBtn = document.getElementById('mailbox-logout-btn');

    if (mailboxUserNameEl) mailboxUserNameEl.textContent = user ? user.displayName : '访客';
    if (mailboxUserRoleEl) {
      if (user) {
        if (user.role === 'xiu-jing') {
          mailboxUserRoleEl.textContent = '修璟';
        } else if (user.role === 'xuan-xuan') {
          mailboxUserRoleEl.textContent = '萱宣';
        } else {
          mailboxUserRoleEl.textContent = '用户';
        }
      } else {
        mailboxUserRoleEl.textContent = '访客模式';
      }
    }
    if (mailboxUserAvatarEl) {
      if (user) {
        if (user.role === 'xiu-jing') {
          mailboxUserAvatarEl.textContent = '🌸';
        } else if (user.role === 'xuan-xuan') {
          mailboxUserAvatarEl.textContent = '🍃';
        } else {
          mailboxUserAvatarEl.textContent = '👤';
        }
      } else {
        mailboxUserAvatarEl.textContent = '👤';
      }
    }
    if (mailboxLogoutBtn) mailboxLogoutBtn.style.display = isLoggedIn ? '' : 'none';

    const mailboxSwitchBtn = document.getElementById('mailbox-switch-account-btn');
    if (mailboxSwitchBtn) mailboxSwitchBtn.style.display = isPresetUser ? '' : 'none';

    const mailboxGuestLoginBtn = document.getElementById('mailbox-guest-login-btn');
    if (mailboxGuestLoginBtn) mailboxGuestLoginBtn.style.display = isLoggedIn ? 'none' : '';
  },

  initMobileSidebar() {
    const homeToggle = document.getElementById('home-menu-toggle');
    const homeSidebar = document.getElementById('sidebar');
    const homeOverlay = document.getElementById('home-sidebar-overlay');
    const homeCloseBtn = document.getElementById('home-close-sidebar');
    
    const mailboxToggle = document.getElementById('mailbox-menu-toggle');
    const mailboxSidebar = document.getElementById('mailbox-sidebar');
    const mailboxOverlay = document.getElementById('mailbox-sidebar-overlay');
    const mailboxCloseBtn = document.getElementById('mailbox-close-sidebar');
    
    const openSidebar = (sidebar, overlay) => {
      if (sidebar && overlay) {
        sidebar.classList.add('open');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
    };
    
    const closeSidebar = (sidebar, overlay) => {
      if (sidebar && overlay) {
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
      }
    };
    
    if (homeToggle && homeSidebar && homeOverlay) {
      homeToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        openSidebar(homeSidebar, homeOverlay);
      });
    }
    
    if (homeCloseBtn && homeSidebar && homeOverlay) {
      homeCloseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeSidebar(homeSidebar, homeOverlay);
      });
    }
    
    if (homeOverlay && homeSidebar) {
      homeOverlay.addEventListener('click', () => {
        closeSidebar(homeSidebar, homeOverlay);
      });
    }
    
    if (mailboxToggle && mailboxSidebar && mailboxOverlay) {
      mailboxToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        openSidebar(mailboxSidebar, mailboxOverlay);
      });
    }
    
    if (mailboxCloseBtn && mailboxSidebar && mailboxOverlay) {
      mailboxCloseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeSidebar(mailboxSidebar, mailboxOverlay);
      });
    }
    
    if (mailboxOverlay && mailboxSidebar) {
      mailboxOverlay.addEventListener('click', () => {
        closeSidebar(mailboxSidebar, mailboxOverlay);
      });
    }
    
    const sidebarNavItems = document.querySelectorAll('.sidebar-nav-item');
    sidebarNavItems.forEach(item => {
      item.addEventListener('click', () => {
        closeSidebar(homeSidebar, homeOverlay);
        closeSidebar(mailboxSidebar, mailboxOverlay);
      });
    });
  },

  bindGlobalEvents() {
    // ========== 监听 mailboxes:synced 自定义事件：远端同步完成后自动刷新 UI ==========
    const self = this;
    try {
      let _refreshTimer = null;
      window.addEventListener('mailboxes:synced', (evt) => {
        // 防抖：200ms 内多次触发只刷新一次
        if (_refreshTimer) clearTimeout(_refreshTimer);
        _refreshTimer = setTimeout(() => {
          try {
            // 刷新侧边栏
            const sidebarNav = document.getElementById('mailbox-sidebar-nav') || document.getElementById('sidebar-nav');
            if (sidebarNav && typeof MailboxManager.renderSidebarNav === 'function') {
              const lastId = STORAGE.loadLastMailboxId && STORAGE.loadLastMailboxId();
              MailboxManager.renderSidebarNav(sidebarNav, lastId);
            }
            // 刷新首页信箱列表、空状态、hero grid
            if (typeof self.renderMailboxList === 'function') self.renderMailboxList();
            if (typeof self._renderEmptyState === 'function') self._renderEmptyState();
            if (typeof self._renderHeroGrid === 'function') self._renderHeroGrid();
            if (typeof self.renderHome === 'function' && self.currentView === 'home') self.renderHome();
            // 刷新当前打开的信箱详情页信件列表
            if (self.currentMailboxId && typeof self.renderCurrentMailbox === 'function') {
              self.renderCurrentMailbox();
            }
          } catch (_) {}
        }, 200);
      });
    } catch (_) {}

    // 移动端侧边栏控制
    this.initMobileSidebar();
    
    // 信封点击打开
    const envelope = document.getElementById('envelope');
    if (envelope) {
      envelope.addEventListener('click', () => this.openEnvelope());
    }

    // 首页新增信箱按钮
    const homeNewMailboxBtn = document.getElementById('home-new-mailbox-btn');
    if (homeNewMailboxBtn) {
      homeNewMailboxBtn.addEventListener('click', () => {
        this.showCreateMailboxModal();
      });
    }

    // 侧边栏加入信箱按钮
    const homeJoinMailboxBtn = document.getElementById('home-join-mailbox-btn');
    if (homeJoinMailboxBtn) {
      homeJoinMailboxBtn.addEventListener('click', () => {
        this.showJoinMailboxModal();
      });
    }

    // 首页新手账按钮
    const newDiaryBtn = document.getElementById('new-diary-btn');
    if (newDiaryBtn) {
      newDiaryBtn.addEventListener('click', () => {
        this._createNewDiary();
      });
    }

    // 信箱详情页新建信件按钮
    const newLetterBtn = document.getElementById('new-letter-btn');
    if (newLetterBtn) {
      newLetterBtn.addEventListener('click', () => {
        this._openRecipientPicker(this.currentMailboxId);
      });
    }

    // 阅读页编辑信件按钮
    const editLetterBtn = document.getElementById('edit-letter-btn');
    if (editLetterBtn) {
      editLetterBtn.addEventListener('click', () => {
        if (this.currentLetterId) {
          this.navigate('editor', { letterId: this.currentLetterId });
        }
      });
    }

    // 返回按钮 - 统一点击信笺logo回到首页
    document.getElementById('back-to-home').addEventListener('click', () => {
      this.navigate('home');
    });
    document.getElementById('back-to-mailbox').addEventListener('click', () => {
      this.navigate('home');
    });
    document.getElementById('back-from-style').addEventListener('click', () => {
      this.navigate('home');
    });
    document.getElementById('back-from-reader').addEventListener('click', () => {
      this.navigate('home');
    });

    // 阅读器导出
    document.getElementById('export-btn').addEventListener('click', async () => {
      if (this.currentLetterId) {
        const dataUrl = await STORAGE.exportLetterAsImage(this.currentLetterId);
        if (dataUrl) {
          const a = document.createElement('a');
          a.href = dataUrl;
          a.download = `信笺-${this.currentLetterId.slice(0, 8)}.png`;
          a.click();
        }
      }
    });

    // 录音按钮
    document.getElementById('record-btn').addEventListener('click', () => {
      this.toggleRecord();
    });
    document.getElementById('record-play-btn').addEventListener('click', () => {
      this.playRecord();
    });
    document.getElementById('record-rerecord-btn').addEventListener('click', () => {
      this.rerecord();
    });

    // 点击信纸空白区域取消选择
    document.getElementById('paper-canvas').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) {
        Editor.selectElement(null);
      }
    });

    // 监听浏览器后退/前进按钮
    window.addEventListener('popstate', (e) => this.handlePopState(e));

    // 回信按钮
    const replyBtn = document.getElementById('reply-btn');
    if (replyBtn) {
      replyBtn.addEventListener('click', () => this.replyToLetter());
    }

    // 手账入口
    const journalEntry = document.getElementById('journal-entry');
    if (journalEntry) {
      journalEntry.addEventListener('click', () => this.navigate('journal'));
    }

    // 手账返回按钮
    const backFromJournal = document.getElementById('back-from-journal');
    if (backFromJournal) {
      backFromJournal.addEventListener('click', () => this.navigate('home'));
    }

    // 手账阅读页返回
    const backFromJournalReader = document.getElementById('back-from-journal-reader');
    if (backFromJournalReader) {
      backFromJournalReader.addEventListener('click', () => {
        Journal.close();
        this.navigate('home');
      });
    }

    // 待寄信件入口
    const scheduledEntry = document.getElementById('scheduled-entry');
    if (scheduledEntry) {
      scheduledEntry.addEventListener('click', () => this.navigate('scheduled'));
    }

    // 待寄信件返回
    const backFromScheduled = document.getElementById('back-from-scheduled');
    if (backFromScheduled) {
      backFromScheduled.addEventListener('click', () => this.navigate('home'));
    }

    // 双人视角切换
    const perspectiveBtns = document.querySelectorAll('.perspective-btn');
    perspectiveBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const perspective = btn.dataset.perspective;
        this.switchPerspective(perspective);
      });
    });
  },

  navigate(view, params = {}, addToHistory = true) {
    // 隐藏所有视图
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    // 隐藏信封层
    this.hideEnvelopeOverlay();

    // 停止之前的录音播放（无论进入还是离开阅读器）
    this.stopAudioPlayback();

    const previousView = this.currentView;
    this.currentView = view;

    switch (view) {
      case 'home':
        document.getElementById('home-view').classList.add('active');
        this.renderHome();
        this.switchViewBGM('home');
        break;

      case 'mailbox':
        this.currentMailboxId = params.mailboxId;
        if (params.mailboxId) STORAGE.saveLastMailboxId(params.mailboxId);
        document.getElementById('mailbox-view').classList.add('active');
        this.renderMailboxView(this.currentMailboxId);
        this.switchViewBGM('mailbox');
        break;

      case 'editor':
        document.getElementById('editor-view').classList.add('active');
        if (params.mailboxId) {
          Editor.mailboxId = params.mailboxId;
        }
        Editor.pendingRecipient = params.recipient || null;
        if (!params.letterId) Editor.letter = null;
        Editor.init(params.letterId);
        break;

      case 'style-select':
        this.currentMailboxId = params.mailboxId;
        document.getElementById('style-select-view').classList.add('active');
        this.renderStyleSelect();
        break;

      case 'reader':
        this.currentLetterId = params.letterId;
        { 
          let letter = null;
          const allMailboxes = MailboxManager.getMailboxes();
          for (const mb of allMailboxes) {
            const letters = MailboxManager.loadMailboxLetters(mb.id);
            const found = letters.find(x => x.id === params.letterId);
            if (found) {
              letter = found;
              this.currentMailboxId = mb.id;
              break;
            }
          }
          if (letter) STORAGE.saveLastLetter(letter); 
          if (letter?.serverLetter && letter.direction === 'inbox' && letter.isUnread) {
            MailService.markRead(letter.id)
              .then(result => {
                if (result?.inventory && typeof MultiplayerSync !== 'undefined') {
                  MultiplayerSync.inventory = result.inventory;
                  this._renderXiejianInventory(result.inventory);
                }
                if (result?.letter) this.renderReader(letter.id, result.letter);
                return this._refreshMailboxMail(letter.mailboxId);
              })
              .catch(error => console.warn('[MailService] Mark read failed:', error));
          }
          const editLetterBtn = document.getElementById('edit-letter-btn');
          if (editLetterBtn) {
            editLetterBtn.hidden = Boolean(letter?.serverLetter && letter.direction !== 'draft');
          }
        }
        document.getElementById('reader-view').classList.add('active');
        this.renderReader(params.letterId);
        // 显示信封动画并自动打开
        if (params.showEnvelope !== false) {
          this.showEnvelopeOverlay(params.letterId, true);
        }
        break;

      case 'journal':
        document.getElementById('journal-view').classList.add('active');
        Journal.renderList();
        break;

      case 'journal-reader':
        document.getElementById('journal-reader-view').classList.add('active');
        break;

      case 'scheduled':
        document.getElementById('scheduled-view').classList.add('active');
        this.renderScheduledList();
        break;
    }

    window.scrollTo(0, 0);

    // 将导航操作推入浏览器历史记录
    if (addToHistory && previousView) {
      const state = { view, params };
      const url = '#' + view;
      history.pushState(state, '', url);
    }
  },

  // 停止阅读器相关的音频播放（不停止BGM）
  stopAudioPlayback() {
    // 停止录音播放
    if (this._recordAudio) {
      this._recordAudio.pause();
      this._recordAudio.currentTime = 0;
      this._recordAudio = null;
    }
    // 停止媒体录制
    if (this._mediaRecorder && this._mediaRecorder.state !== 'inactive') {
      this._mediaRecorder.stop();
    }
    // 清除录音定时器
    if (this._recordTimer) {
      clearInterval(this._recordTimer);
      this._recordTimer = null;
    }
  },

  // 浏览器返回按钮触发
  handlePopState(event) {
    if (this._handlingPopState) return;
    this._handlingPopState = true;

    const state = event.state;
    if (state && state.view) {
      // 传入 addToHistory=false 避免循环入栈
      this.navigate(state.view, state.params || {}, false);
    } else {
      // 没有状态时回到首页
      this.navigate('home', {}, false);
    }

    setTimeout(() => {
      this._handlingPopState = false;
    }, 100);
  },

  showEnvelopeOverlay(letterId, autoOpen = false) {
    const overlay = document.getElementById('envelope-overlay');
    const envelope = document.getElementById('envelope');
    if (!overlay || !envelope) return;

    // 重置信封状态
    envelope.classList.remove('opening');
    overlay.classList.remove('closing');
    overlay.classList.add('active');

    this._pendingLetterId = letterId;

    // 自动打开信封
    if (autoOpen) {
      setTimeout(() => {
        this.openEnvelope();
      }, 300);
    }
  },

  hideEnvelopeOverlay() {
    const overlay = document.getElementById('envelope-overlay');
    if (!overlay) return;
    overlay.classList.remove('active');
    overlay.classList.remove('closing');
  },

  openEnvelope() {
    const envelope = document.getElementById('envelope');
    const overlay = document.getElementById('envelope-overlay');
    if (!envelope || !overlay) return;

    if (envelope.classList.contains('opening')) return;

    envelope.classList.add('opening');

    // 动画结束后隐藏信封层并显示信件
    setTimeout(() => {
      overlay.classList.add('closing');
      setTimeout(() => {
        this.hideEnvelopeOverlay();
        // 信封动画结束后1.5s自动播放录音
        if (this._recordBlob && this._currentRecordLetterId) {
          setTimeout(() => {
            this.playRecord();
          }, 1500);
        }
      }, 500);
    }, 1200);
  },

  renderHome() {
    const sidebarNav = document.getElementById('sidebar-nav');
    const galleryTrack = document.getElementById('gallery-track');
    const galleryIndicators = document.getElementById('gallery-indicators');

    if (sidebarNav) {
      MailboxManager.renderSidebarNav(sidebarNav);
    }

    // 兼容旧版画廊渲染（隐藏状态下仍渲染，保持引用有效）
    if (galleryTrack) {
      MailboxManager.renderGalleryTrack(galleryTrack, galleryIndicators, (mailboxId) => {
        this.navigate('mailbox', { mailboxId });
      });
    }

    // === 新增：正在阅读 / 快速继续 / 信箱网格 ===
    this._renderHeroGrid();
    this._renderDiaryGrid();
    this._renderMailboxGrid();
    this._initMapView();
  },

  _renderHeroGrid() {
    const mailboxes = MailboxManager.getMailboxes();

    const heroGrid = document.getElementById('hero-grid');
    const featureCard = document.getElementById('feature-mailbox');
    const continueCard = document.getElementById('continue-card');
    const continueTitle = document.getElementById('continue-letter-title');
    const continueMailbox = document.getElementById('continue-mailbox-name');
    const continueHint = document.getElementById('continue-hint');
    const miniStats = document.getElementById('mini-stats');

    // === 空信箱 → 整个 hero-grid 整体隐藏（把空间让给 mailbox-grid 的空状态大卡片）
    if (!mailboxes || mailboxes.length === 0) {
      if (heroGrid) heroGrid.style.display = 'none';
      if (featureCard) featureCard.style.visibility = 'hidden';
      if (continueCard) {
        if (continueTitle) continueTitle.textContent = '';
        if (continueMailbox) continueMailbox.textContent = '';
        if (continueHint) {
          continueHint.innerHTML = `
          <div style="display:flex;flex-direction:column;gap:8px;align-items:flex-start;">
            <span style="font-size:14px;color:var(--color-text-muted);">暂无阅读记录</span>
            <button id="hero-empty-create" style="background:var(--color-accent);color:#fff;border:none;padding:6px 14px;border-radius:8px;cursor:pointer;font-size:13px;">📫 新建信箱</button>
            <button id="hero-empty-join" style="background:var(--color-paper-2);color:var(--color-text);border:1px solid var(--color-border);padding:6px 14px;border-radius:8px;cursor:pointer;font-size:13px;">🔗 通过信箱号加入</button>
          </div>`;
        }
      }
      if (miniStats) miniStats.innerHTML = `<span><strong>0</strong> 信箱</span><span><strong>0</strong> 信件</span><span><strong>0</strong> 待寄</span>`;
      const heroCreate = document.getElementById('hero-empty-create');
      const heroJoin = document.getElementById('hero-empty-join');
      if (heroCreate) heroCreate.addEventListener('click', () => this.showCreateMailboxModal());
      if (heroJoin) heroJoin.addEventListener('click', () => this.showJoinMailboxModal());
      return;
    }

    if (heroGrid) heroGrid.style.display = '';
    if (featureCard) featureCard.style.visibility = '';

    // "正在阅读"：取上次访问的信箱，或第一个信箱
    const lastMailboxId = STORAGE.loadLastMailboxId ? STORAGE.loadLastMailboxId() : null;
    const featureMb = mailboxes.find(m => m.id === lastMailboxId) || mailboxes[0];
    const letters = MailboxManager.loadMailboxLetters(featureMb.id);

    const nameEl = document.getElementById('feature-mailbox-name');
    const descEl = document.getElementById('feature-mailbox-desc');
    const metaEl = document.getElementById('feature-mailbox-meta');
    const previewEl = document.getElementById('feature-mailbox-preview');

    if (nameEl) nameEl.textContent = featureMb.name;
    if (descEl) descEl.textContent = featureMb.description || '';
    if (metaEl) {
      const diaryCount = featureMb.hasDiary ? '47 页日记' : '';
      const bgmLabel = featureMb.bgm ? 'BGM' : '';
      metaEl.innerHTML = [
        `${letters.length} 封信`,
        diaryCount,
        bgmLabel
      ].filter(Boolean).map(t => `<span>${t}</span>`).join('');
    }
    if (previewEl) {
      const iconSvg = MailboxManager._getMailboxIconSVG ? MailboxManager._getMailboxIconSVG(featureMb) : '';
      previewEl.innerHTML = iconSvg || `<span class="feature-icon-fallback">✉</span>`;
    }
    if (featureCard) {
      featureCard.onclick = () => this.navigate('mailbox', { mailboxId: featureMb.id });
      featureCard.style.cursor = 'pointer';
    }

    // "快速继续"：取上次访问的信件
    const lastLetter = STORAGE.loadLastLetter ? STORAGE.loadLastLetter() : null;

    if (lastLetter && lastLetter.id) {
      const lastMb = mailboxes.find(m => m.id === lastLetter.mailboxId);
      if (continueTitle) continueTitle.textContent = lastLetter.letterTitle || lastLetter.recipient || '一封信';
      if (continueMailbox) continueMailbox.textContent = lastMb ? lastMb.name : '';
      if (continueHint) continueHint.textContent = '点击继续阅读';
      if (continueCard) {
        continueCard.onclick = () => {
          this.navigate('mailbox', { mailboxId: lastLetter.mailboxId });
        };
        continueCard.style.cursor = 'pointer';
      }
    }

    // mini-stats
    if (miniStats) {
      let totalLetters = 0;
      const allMailboxes = MailboxManager.getMailboxes();
      for (const mb of allMailboxes) {
        totalLetters += MailboxManager.loadMailboxLetters(mb.id).length;
      }
      const scheduled = 0;
      miniStats.innerHTML = `
        <span><strong>${mailboxes.length}</strong> 信箱</span>
        <span><strong>${totalLetters}</strong> 信件</span>
        <span><strong>${scheduled}</strong> 待寄</span>
      `;
    }
  },

  _renderDiaryGrid() {
    const grid = document.getElementById('diary-grid');
    const emptyEl = document.getElementById('diary-empty');
    if (!grid) return;

    const journals = STORAGE.loadJournals ? STORAGE.loadJournals() : [];

    if (journals.length === 0) {
      if (emptyEl) {
        emptyEl.style.display = 'flex';
      }
      return;
    }

    if (emptyEl) {
      emptyEl.style.display = 'none';
    }

    grid.innerHTML = journals.map(j => {
      const dayCount = j.pages ? j.pages.length : 0;
      const updatedAt = j.updatedAt ? new Date(j.updatedAt).toLocaleDateString('zh-CN') : '';
      const icon = j.icon || '📓';
      return `
        <article class="diary-card" data-journal-id="${j.id}">
          <div class="diary-card-icon">${icon}</div>
          <h4>${j.name || '未命名手账'}</h4>
          <p>${j.description || '记录生活点滴'}</p>
          <div class="diary-card-meta">
            <span>${dayCount} 页</span>
            ${updatedAt ? `<span>${updatedAt}</span>` : ''}
          </div>
        </article>
      `;
    }).join('');

    grid.querySelectorAll('.diary-card').forEach(card => {
      card.addEventListener('click', () => {
        const journalId = card.dataset.journalId;
        this._openDiary(journalId);
      });
    });
  },

  _openDiary(journalId) {
    const journal = STORAGE.loadJournal ? STORAGE.loadJournal(journalId) : null;
    if (!journal) return;
    if (this.openDiary) {
      this.openDiary(journal);
    }
  },

  _createNewDiary() {
    const name = prompt('请输入手账名称：', '我的手账');
    if (!name) return;

    const newJournal = {
      id: 'journal_' + Date.now(),
      name: name,
      description: '记录生活点滴',
      icon: '📓',
      pages: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    if (STORAGE.saveJournal) {
      STORAGE.saveJournal(newJournal);
      this._renderDiaryGrid();
    }
  },

  // === 地图视图 ===
  _initMapView() {
    const toggleBtns = document.querySelectorAll('.view-toggle-btn');
    const gridEl = document.getElementById('mailbox-grid');
    const mapEl = document.getElementById('map-view-container');

    toggleBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const view = btn.dataset.view;
        toggleBtns.forEach(b => b.classList.toggle('active', b === btn));
        if (view === 'map') {
          gridEl.style.display = 'none';
          mapEl.style.display = 'block';
          this._renderMap();
          this._setupMapInteractions();
        } else {
          gridEl.style.display = 'grid';
          mapEl.style.display = 'none';
        }
      });
    });

    const resetBtn = document.getElementById('map-reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this._resetMapView());
    }
  },

  _renderMap() {
    const svg = document.getElementById('map-svg');
    if (!svg) return;

    const width = 1000;
    const height = 500;

    const continentsG = document.getElementById('map-continents');
    if (continentsG && typeof MapSystem !== 'undefined') {
      continentsG.innerHTML = MapSystem.continents.map(cont => {
        const path = MapSystem.generateContinentPath(cont, width, height);
        return `<path d="${path}" class="map-continent"/>`;
      }).join('');
    }

    const mountainsG = document.getElementById('map-mountains');
    if (mountainsG && typeof MapSystem !== 'undefined') {
      const mountainPaths = MapSystem.generateMountainPaths(width, height);
      mountainsG.innerHTML = `<path d="${mountainPaths}" class="map-mountain"/>`;
    }

    const desertsG = document.getElementById('map-deserts');
    if (desertsG && typeof MapSystem !== 'undefined') {
      desertsG.innerHTML = MapSystem.generateDesertDots(width, height);
    }

    this._renderMapMailboxMarkers();
    this._renderMapDeliveryPaths();
  },

  _renderMapMailboxMarkers() {
    const markersG = document.getElementById('map-mailbox-markers');
    if (!markersG || typeof MapSystem === 'undefined') return;

    const mailboxes = MailboxManager.getMailboxes();
    const width = 1000;
    const height = 500;

    markersG.innerHTML = mailboxes.filter(mb => mb.location).map(mb => {
      const { x, y } = MapSystem.latLngToXY(mb.location.lat, mb.location.lng, width, height);
      const letters = MailboxManager.loadMailboxLetters(mb.id);
      const unreadCount = letters.length;
      const yOffset = 0;
      const postboxY = y + yOffset;

      return `
        <g class="map-mailbox-marker" data-mailbox-id="${mb.id}" transform="translate(${x}, ${postboxY})">
          <circle class="hit-area" cx="0" cy="-16" r="28" fill="transparent" stroke="none"/>
          <g class="mailbox-postbox">
            <rect x="-12" y="-32" width="24" height="30" rx="3" fill="${mb.cardAccent || mb.accent}" stroke="#5c4a35" stroke-width="1.5"/>
            <rect x="-3" y="-38" width="6" height="8" fill="${mb.cardAccent || mb.accent}" stroke="#5c4a35" stroke-width="0.8"/>
            <rect x="-9" y="-25" width="18" height="2" fill="#5c4a35" opacity="0.3"/>
            <circle cx="0" cy="-14" r="3" fill="#5c4a35" opacity="0.5"/>
          </g>
          ${unreadCount > 0 ? `
            <circle cx="12" cy="-32" r="10" class="mailbox-unread-badge"/>
            <text x="12" y="-29" class="mailbox-unread-text">${unreadCount > 9 ? '9+' : unreadCount}</text>
          ` : ''}
          <text x="0" y="16" class="mailbox-label">${mb.location.placeName || mb.name}</text>
        </g>
      `;
    }).join('');

    markersG.querySelectorAll('.map-mailbox-marker').forEach(marker => {
      const mailboxId = marker.dataset.mailboxId;
      const tooltip = document.getElementById('map-tooltip');
      const mapContainer = document.getElementById('map-view-container');

      marker.addEventListener('mouseenter', (e) => {
        if (this._mapEditMode) return;
        const mb = mailboxes.find(m => m.id === mailboxId);
        if (!mb || !tooltip) return;
        const letters = allLetters.filter(l => l.mailboxId === mb.id);
        tooltip.innerHTML = `
          <h4>${mb.name}</h4>
          <p>${mb.description || ''}</p>
          <div class="tooltip-meta">
            <span>📍 ${mb.location?.region || ''}</span>
            <span>✉️ ${letters.length} 封</span>
          </div>
        `;
        tooltip.classList.add('visible');
      });

      marker.addEventListener('mousemove', (e) => {
        if (this._mapEditMode || !tooltip || !mapContainer) return;
        const rect = mapContainer.getBoundingClientRect();
        tooltip.style.left = (e.clientX - rect.left + 15) + 'px';
        tooltip.style.top = (e.clientY - rect.top + 15) + 'px';
      });

      marker.addEventListener('mouseleave', () => {
        if (tooltip) tooltip.classList.remove('visible');
      });

      marker.addEventListener('click', () => {
        if (this._mapEditMode) return;
        this.navigate('mailbox', { mailboxId });
      });
    });
  },

  _renderMapDeliveryPaths() {
    const pathsG = document.getElementById('map-delivery-paths');
    if (!pathsG || typeof MapSystem === 'undefined') return;

    let deliveringLetters = [];
    const allMailboxes = MailboxManager.getMailboxes();
    for (const mb of allMailboxes) {
      const letters = MailboxManager.loadMailboxLetters(mb.id);
      deliveringLetters = deliveringLetters.concat(
        letters.filter(l => l.delivery && l.delivery.status === 'delivering')
      );
    }

    if (deliveringLetters.length === 0) {
      pathsG.innerHTML = '';
      return;
    }

    const mailboxes = MailboxManager.getMailboxes();
    const width = 1000;
    const height = 500;

    pathsG.innerHTML = deliveringLetters.map((letter, idx) => {
      const fromMb = mailboxes.find(m => m.id === letter.delivery.fromMailboxId);
      const toMb = mailboxes.find(m => m.id === letter.delivery.toMailboxId);
      if (!fromMb?.location || !toMb?.location) return '';

      const start = MapSystem.latLngToXY(fromMb.location.lat, fromMb.location.lng, width, height);
      const end = MapSystem.latLngToXY(toMb.location.lat, toMb.location.lng, width, height);
      const offset = (idx - deliveringLetters.length / 2) * 20;
      const path = MapSystem.generateCurvePath(start.x, start.y, end.x, end.y, 60 + offset);
      const method = MapSystem.deliveryMethods[letter.delivery.method];
      const color = method?.color || '#c77';
      const progress = letter.delivery.currentProgress || 0;
      const currentPos = MapSystem.getPointOnCurve(start.x, start.y, end.x, end.y, progress, 60 + offset);

      const traveledPath = MapSystem.generateCurvePath(start.x, start.y, end.x, end.y, 60 + offset);
      const pathLength = this._estimatePathLength(start.x, start.y, end.x, end.y, 60 + offset);
      const dashOffset = pathLength * (1 - progress);

      return `
        <path d="${path}" class="delivery-path" stroke="${color}" stroke-width="1.5"/>
        <path d="${traveledPath}" class="delivery-path-traveled" stroke="${color}" stroke-width="2"
              stroke-dasharray="${pathLength}" stroke-dashoffset="${dashOffset}"/>
        <g class="delivery-envelope" transform="translate(${currentPos.x}, ${currentPos.y})">
          <rect x="-10" y="-6" width="20" height="12" rx="1" fill="#faf5f0" stroke="${color}" stroke-width="1"/>
          <path d="M -10 -6 L 0 2 L 10 -6" fill="none" stroke="${color}" stroke-width="0.8"/>
        </g>
      `;
    }).join('');
  },

  _estimatePathLength(x1, y1, x2, y2, offset) {
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist === 0) return 0;
    const perpX = -dy / dist * offset;
    const perpY = dx / dist * offset;
    const cpX = midX + perpX;
    const cpY = midY + perpY;
    const chord = dist;
    const controlDist = Math.sqrt((cpX - midX) ** 2 + (cpY - midY) ** 2);
    return chord * (1 + controlDist / dist * 0.4);
  },

  _setupMapInteractions() {
    const svg = document.getElementById('map-svg');
    const mapContainer = document.getElementById('map-view-container');
    if (!svg || !mapContainer || this._mapInteractionsSetup) return;
    this._mapInteractionsSetup = true;

    const state = {
      scale: 1.8,
      offsetX: 0,
      offsetY: 0,
      isDragging: false,
      isEditMode: false,
      draggingMarker: null,
      markerStartX: 0,
      markerStartY: 0,
      dragClientStartX: 0,
      dragClientStartY: 0,
      startOffsetX: 0,
      startOffsetY: 0
    };

    const mapGroups = svg.querySelectorAll('#map-continents, #map-mountains, #map-deserts, #map-delivery-paths, #map-mailbox-markers');

    const updateTransform = () => {
      mapGroups.forEach(el => {
        el.setAttribute('transform', `translate(${state.offsetX}, ${state.offsetY}) scale(${state.scale})`);
      });
    };

    const getMarkerTranslate = (marker) => {
      const transform = marker.getAttribute('transform');
      const match = transform.match(/translate\(([^,]+),\s*([^)]+)\)/);
      if (match) {
        return { x: parseFloat(match[1]), y: parseFloat(match[2]) };
      }
      return { x: 0, y: 0 };
    };

    const clientDeltaToSvgDelta = (dx, dy) => {
      const rect = svg.getBoundingClientRect();
      const svgDx = dx * (1000 / rect.width) / state.scale;
      const svgDy = dy * (500 / rect.height) / state.scale;
      return { dx: svgDx, dy: svgDy };
    };

    const xyToLatLng = (x, y) => {
      const width = 1000;
      const height = 500;
      const lng = (x / width) * 360 - 180;
      const yRatio = (height / 2 - y) / (width / (2 * Math.PI));
      const lat = (2 * Math.atan(Math.exp(yRatio)) - Math.PI / 2) * (180 / Math.PI);
      return { lat: Math.max(-85, Math.min(85, lat)), lng };
    };

    svg.addEventListener('mousedown', (e) => {
      if (e.target.closest('.map-mailbox-marker')) return;
      state.isDragging = true;
      state.dragClientStartX = e.clientX;
      state.dragClientStartY = e.clientY;
      state.startOffsetX = state.offsetX;
      state.startOffsetY = state.offsetY;
      svg.style.cursor = 'grabbing';
    });

    window.addEventListener('mousemove', (e) => {
      if (state.isDragging) {
        const dx = e.clientX - state.dragClientStartX;
        const dy = e.clientY - state.dragClientStartY;
        state.offsetX = state.startOffsetX + dx;
        state.offsetY = state.startOffsetY + dy;
        updateTransform();
      }
      if (state.draggingMarker) {
        const dx = e.clientX - state.dragClientStartX;
        const dy = e.clientY - state.dragClientStartY;
        const { dx: svgDx, dy: svgDy } = clientDeltaToSvgDelta(dx, dy);
        const newX = state.markerStartX + svgDx;
        const newY = state.markerStartY + svgDy;
        state.draggingMarker.setAttribute('transform', `translate(${newX}, ${newY})`);
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (state.draggingMarker) {
        const marker = state.draggingMarker;
        const mailboxId = marker.dataset.mailboxId;
        const { x, y } = getMarkerTranslate(marker);
        const { lat, lng } = xyToLatLng(x, y);
        this._updateMailboxLocation(mailboxId, lat, lng);
        state.draggingMarker = null;
      }
      state.isDragging = false;
      svg.style.cursor = state.isEditMode ? 'default' : 'grab';
    });

    svg.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.92 : 1.08;
      const newScale = Math.max(0.4, Math.min(4, state.scale * delta));
      const rect = svg.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const svgX = (mouseX / rect.width) * 1000;
      const svgY = (mouseY / rect.height) * 500;
      state.offsetX = mouseX - svgX * newScale * (rect.width / 1000);
      state.offsetY = mouseY - svgY * newScale * (rect.height / 500);
      state.scale = newScale;
      updateTransform();
    });

    const editBtn = document.getElementById('map-edit-btn');
    const editHint = document.getElementById('map-edit-hint');
    if (editBtn) {
      editBtn.addEventListener('click', () => {
        state.isEditMode = !state.isEditMode;
        this._mapEditMode = state.isEditMode;
        mapContainer.classList.toggle('editing', state.isEditMode);
        editBtn.classList.toggle('active', state.isEditMode);
        editBtn.textContent = state.isEditMode ? '✅ 完成编辑' : '✏️ 编辑位置';
        if (editHint) editHint.classList.toggle('visible', state.isEditMode);
        svg.style.cursor = state.isEditMode ? 'default' : 'grab';

        const markers = svg.querySelectorAll('.map-mailbox-marker');
        markers.forEach(marker => {
          marker.classList.toggle('editing', state.isEditMode);
        });
      });
    }

    const onMarkerMouseDown = (e) => {
      if (!state.isEditMode) return;
      e.stopPropagation();
      e.preventDefault();
      const marker = e.currentTarget;
      state.draggingMarker = marker;
      const { x, y } = getMarkerTranslate(marker);
      state.markerStartX = x;
      state.markerStartY = y;
      state.dragClientStartX = e.clientX;
      state.dragClientStartY = e.clientY;
    };

    const setupMarkerEvents = () => {
      const markers = svg.querySelectorAll('.map-mailbox-marker');
      markers.forEach(marker => {
        marker.addEventListener('mousedown', onMarkerMouseDown);
      });
    };

    const origRender = this._renderMapMailboxMarkers.bind(this);
    this._renderMapMailboxMarkers = () => {
      origRender();
      setupMarkerEvents();
    };

    setTimeout(() => {
      setupMarkerEvents();
    }, 200);

    this._mapReset = () => {
      state.scale = 1.8;
      const rect = svg.getBoundingClientRect();
      if (rect.width > 0) {
        state.offsetX = (rect.width - 1000 * state.scale) / 2;
        state.offsetY = (rect.height - 500 * state.scale) / 2;
      }
      updateTransform();
    };

    setTimeout(() => {
      const rect = svg.getBoundingClientRect();
      if (rect.width > 0) {
        state.offsetX = (rect.width - 1000 * state.scale) / 2;
        state.offsetY = (rect.height - 500 * state.scale) / 2;
        updateTransform();
      }
    }, 50);
  },

  _resetMapView() {
    if (this._mapReset) {
      this._mapReset();
    }
  },

  _updateMailboxLocation(mailboxId, lat, lng) {
    const mailboxes = MailboxManager.getMailboxes();
    const mb = mailboxes.find(m => m.id === mailboxId);
    if (!mb) return;

    const location = mb.location || {};
    MailboxManager.updateMailbox(mailboxId, {
      location: {
        ...location,
        lat: parseFloat(lat.toFixed(2)),
        lng: parseFloat(lng.toFixed(2))
      }
    });

    if (this.currentView === 'home' && this._mapViewVisible) {
      this._renderMapMailboxMarkers();
    }
  },

  _renderMailboxGrid() {
    const grid = document.getElementById('mailbox-grid');
    if (!grid) return;
    const mailboxes = MailboxManager.getMailboxes();

    // ==== 空信箱：显示引导 UI ====
    if (!mailboxes || mailboxes.length === 0) {
      grid.innerHTML = `
        <div class="mailbox-empty-state">
          <div class="mailbox-empty-icon">📭</div>
          <h3 class="mailbox-empty-title">你还没有信箱</h3>
          <p class="mailbox-empty-desc">创建一个属于你自己的信箱，或者通过信箱号加入朋友的共享信箱</p>
          <div class="mailbox-empty-actions">
            <button class="mailbox-empty-btn mailbox-empty-btn-primary" id="empty-create-mailbox-btn">
              <span class="empty-btn-icon">📫</span>
              <span>新建信箱</span>
            </button>
            <button class="mailbox-empty-btn mailbox-empty-btn-secondary" id="empty-join-mailbox-btn">
              <span class="empty-btn-icon">🔗</span>
              <span>通过信箱号加入</span>
            </button>
          </div>
        </div>
      `;
      const createBtn = document.getElementById('empty-create-mailbox-btn');
      const joinBtn = document.getElementById('empty-join-mailbox-btn');
      if (createBtn) createBtn.addEventListener('click', () => this.showCreateMailboxModal());
      if (joinBtn) joinBtn.addEventListener('click', () => this.showJoinMailboxModal());
      return;
    }

    grid.innerHTML = mailboxes.map(mb => {
      const letters = MailboxManager.loadMailboxLetters(mb.id);
      const iconSvg = MailboxManager._getMailboxIconSVG ? MailboxManager._getMailboxIconSVG(mb) : '';
      const codeBadge = mb.mailboxCode ? `
        <div class="mailbox-card-code" data-code="${mb.mailboxCode}" title="点击复制信箱号">
          <span class="code-icon">📮</span>
          <span class="code-text">${mb.mailboxCode}</span>
          <span class="code-copy">📋</span>
        </div>
      ` : '';
      return `
        <article class="mailbox-card" data-mailbox-id="${mb.id}">
          <span class="mailbox-symbol">${iconSvg || '✉'}</span>
          <h4>${mb.name} ${mb.isShared ? '<span class="shared-badge-card">共享</span>' : ''}</h4>
          <p>${mb.description || mb.desc || ''}</p>
          <div class="mailbox-card-meta">
            <span>${letters.length} 封</span>
          </div>
          ${codeBadge}
        </article>
      `;
    }).join('');

    grid.querySelectorAll('.mailbox-card').forEach(card => {
      card.addEventListener('click', () => {
        this.navigate('mailbox', { mailboxId: card.dataset.mailboxId });
      });
    });

    // 信箱号卡片点击复制
    grid.querySelectorAll('.mailbox-card-code').forEach(badge => {
      badge.addEventListener('click', e => {
        e.stopPropagation();
        const code = badge.dataset.code;
        if (!code) return;
        const copyIcon = badge.querySelector('.code-copy');
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(code);
        } else {
          try {
            const ta = document.createElement('textarea');
            ta.value = code; ta.style.position = 'fixed'; ta.style.left = '-9999px';
            document.body.appendChild(ta); ta.select();
            document.execCommand('copy'); document.body.removeChild(ta);
          } catch (_) {}
        }
        if (copyIcon) {
          const old = copyIcon.textContent;
          copyIcon.textContent = '✅';
          setTimeout(() => (copyIcon.textContent = old), 1200);
        }
      });
    });
  },

  _getActiveCardIndex(cards, wrapper) {
    let activeIndex = 0;
    const viewCenter = wrapper.scrollLeft + wrapper.clientWidth / 2;
    cards.forEach((card, idx) => {
      const cardCenter = card.offsetLeft + card.offsetWidth / 2;
      if (Math.abs(cardCenter - viewCenter) < card.offsetWidth / 2) {
        activeIndex = idx;
      }
    });
    return activeIndex;
  },

  renderMailboxView(mailboxId, skipServerRefresh = false) {
    const mailboxes = MailboxManager.getMailboxes();
    const mailbox = mailboxes.find(m => m.id === mailboxId);
    if (!mailbox) return;

    this.currentMailboxId = mailboxId;
    if (!skipServerRefresh && AuthManager.getCurrentUser()) {
      this._refreshMailboxMail(mailboxId);
    }

    const isXiejian = this._isXiejianMailbox();
    const isHanmen = this._isHanmenMailbox();

    // 初始化双人邮箱UI
    this._setupDualMailbox(mailbox);

    // 应用信箱背景
    const mailboxView = document.getElementById('mailbox-view');
    const galleryMain = mailboxView?.querySelector('.gallery-main');
    if (galleryMain && mailbox.bgGradient) {
      galleryMain.style.background = mailbox.bgGradient;
    }

    // 更新标题
    const titleEl = document.getElementById('mailbox-title');
    const descEl = document.getElementById('mailbox-desc');
    if (titleEl) {
      titleEl.textContent = mailbox.name;
    }
    if (descEl) descEl.textContent = mailbox.desc;

    // 显示信箱号（若有）
    const codeHeader = document.getElementById('mailbox-code-header');
    const codeValue = document.getElementById('mch-code-value');
    const codeCopyBtn = document.getElementById('mch-copy-btn');
    // 若当前信箱没有信箱号，尝试从共享信箱加载，或者补生成一个
    let effectiveCode = mailbox.mailboxCode;
    if (!effectiveCode) {
      const sharedMb = STORAGE.loadSharedMailbox(mailboxId);
      if (sharedMb && sharedMb.mailboxCode) effectiveCode = sharedMb.mailboxCode;
    }
    if (!effectiveCode) {
      // 所有信箱都有可加入编号；旧数据在首次打开时幂等补齐。
      effectiveCode = MailboxManager._generateMailboxCode(mailbox.name);
      const personal = STORAGE.loadMailboxes() || [];
      const pIdx = personal.findIndex(m => m.id === mailboxId);
      if (pIdx !== -1) {
        personal[pIdx].mailboxCode = effectiveCode;
        STORAGE.saveMailboxes(personal);
      }
      if (typeof STORAGE.saveMailboxCodeIndex === 'function') {
        STORAGE.saveMailboxCodeIndex(effectiveCode, mailboxId);
      }
      // 若已存在共享信箱，同步
      const shared2 = STORAGE.loadSharedMailbox(mailboxId);
      if (shared2) {
        shared2.mailboxCode = effectiveCode;
        STORAGE.saveSharedMailbox(shared2);
      }
    }
    if (codeHeader) {
      if (effectiveCode) {
        codeHeader.style.display = 'flex';
        if (codeValue) codeValue.textContent = effectiveCode;
        if (codeCopyBtn && !codeCopyBtn._boundCopy) {
          codeCopyBtn._boundCopy = true;
          codeCopyBtn.title = '点击复制：6 位信箱号 + 跨用户分享包（发给不在同一设备的朋友，粘贴到「加入信箱 → 导入分享内容」即可加入）';
          codeCopyBtn.addEventListener('click', () => {
            const c = codeValue?.textContent?.trim();
            if (!c) return;
            // 跨用户分享：优先写分享包（XJ://...），否则回退写 6 位纯码
            const sharePkg = typeof MailboxManager.buildSharePackage === 'function'
              ? MailboxManager.buildSharePackage(mailboxId, 10)
              : null;
            // 如果是同一浏览器/设备朋友，6 位码足够；跨设备/浏览器需要分享包
            // 所以剪贴板同时写入：text/plain = 分享包（含 6 位码），若分享包 build 失败则回退到纯 6 位码
            const textToWrite = sharePkg || c;
            let ok = false;
            if (navigator.clipboard && navigator.clipboard.writeText) {
              navigator.clipboard.writeText(textToWrite).then(() => { ok = true; }).catch(() => {});
            }
            // 兜底（writeClipboard 拒绝或不支持）
            setTimeout(() => {
              if (!ok) {
                try {
                  const ta = document.createElement('textarea');
                  ta.value = textToWrite; ta.style.position = 'fixed'; ta.style.left = '-9999px';
                  document.body.appendChild(ta); ta.select();
                  document.execCommand('copy'); document.body.removeChild(ta);
                } catch (_) {}
              }
              const old = codeCopyBtn.textContent;
              codeCopyBtn.textContent = sharePkg ? '📋✅' : '✅';
              codeCopyBtn.title = sharePkg ? '已复制：XJ:// 分享包（发给朋友后，在加入信箱里粘贴导入）' : '已复制：6 位信箱号';
              setTimeout(() => {
                codeCopyBtn.textContent = old;
                codeCopyBtn.title = '点击复制：6 位信箱号 + 跨用户分享包';
              }, 1500);
            }, 80);
          });
        }
      } else {
        codeHeader.style.display = 'none';
      }
    }

    // 绑定编辑按钮
    const editBtn = document.getElementById('mailbox-edit-btn');
    if (editBtn) {
      editBtn.onclick = (e) => {
        e.stopPropagation();
        this.showEditMailboxModal(mailboxId);
      };
    }

    // 绑定删除按钮
    const deleteBtn = document.getElementById('mailbox-delete-btn');
    if (deleteBtn) {
      deleteBtn.onclick = (e) => {
        e.stopPropagation();
        if (!confirm(`确定要删除信箱"${mailbox.name}"吗？\n该信箱中的所有信件也将被删除。`)) return;

        // 删除该信箱的所有信件
        if (MailboxManager.isSharedMailbox(mailboxId)) {
          STORAGE.saveSharedLetters(mailboxId, []);
        } else {
          const allLetters = STORAGE.loadLetters();
          const remainingLetters = allLetters.filter(l => l.mailboxId !== mailboxId);
          STORAGE.saveLetters(remainingLetters);
        }

        // 删除信箱
        const remainingMailboxes = mailboxes.filter(m => m.id !== mailboxId);
        STORAGE.saveMailboxes(remainingMailboxes);

        // 返回主页
        this.navigate('home');
      };
    }

    // 视角切换逻辑
    const viewSwitch = document.getElementById('view-switch');
    if (viewSwitch) {
      const mailboxView = document.getElementById('mailbox-view');
      const mainContainer = mailboxView?.querySelector('.gallery-main');
      
      if (mainContainer && !viewSwitch.dataset.bound) {
        viewSwitch.dataset.bound = 'true';
        const viewBtns = viewSwitch.querySelectorAll('.view-btn[data-view]');
        
        viewBtns.forEach(btn => {
          btn.addEventListener('click', () => {
            const view = btn.dataset.view;
            
            viewBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            mainContainer.classList.remove('letters-mode', 'diary-mode', 'map-mode');
            mainContainer.classList.add(`${view}-mode`);
            
            if (view === 'diary') {
              if (typeof App.openDiary === 'function') {
                App.openDiary();
              }
            }
            
            if (view === 'map') {
              App.checkAndInitGameMap();
            }
          });
        });
      }
      
      if (mainContainer) {
        // 信件始终是默认模式。只有用户主动点击“地图”时，才初始化地图并进入角色绑定流程。
        mainContainer.classList.remove('diary-mode', 'map-mode');
        mainContainer.classList.add('letters-mode');
        const activeBtn = viewSwitch.querySelector('.view-btn[data-view="letters"]');
        if (activeBtn) {
          viewSwitch.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
          activeBtn.classList.add('active');
        }
      }
    }

    // 渲染左侧信箱列表
    const sidebarNav = document.getElementById('mailbox-sidebar-nav');
    if (sidebarNav) {
      MailboxManager.renderSidebarNav(sidebarNav, mailboxId);
    }

    // 渲染右侧信件画廊
    const letterTrack = document.getElementById('letter-list');
    const indicators = document.getElementById('letters-indicators');

    if (letterTrack) {
      const allLetters = MailboxManager.loadMailboxLetters(mailboxId);
      const letters = allLetters
        .filter(letter => {
          if (this._mailFolder === 'inbox') return letter.serverLetter && letter.direction === 'inbox';
          if (this._mailFolder === 'sent') return letter.serverLetter && letter.direction === 'sent';
          if (this._mailFolder === 'draft') return letter.serverLetter && letter.direction === 'draft';
          return !letter.serverLetter || letter.direction !== 'draft';
        })
        .sort((a, b) =>
          (b.sentAt || b.updatedAt || b.createdAt || 0) -
          (a.sentAt || a.updatedAt || a.createdAt || 0)
        );
      letterTrack.innerHTML = '';

      if (letters.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'letters-empty';
        const emptyMessages = {
          timeline: '时间线还没有信件，写下第一封信吧。',
          inbox: '还没有收到信件。',
          sent: '还没有发出信件。',
          draft: '还没有保存的草稿。'
        };
        empty.innerHTML = `
          <div class="letters-empty-icon">✉️</div>
          <p>${emptyMessages[this._mailFolder] || emptyMessages.timeline}</p>
        `;
        letterTrack.appendChild(empty);
        if (indicators) indicators.innerHTML = '';
      } else {
        const activeKey = `${mailboxId}:${this._mailFolder}`;
        let activeIndex = this.mailboxActiveIndex[activeKey] || 0;
        if (activeIndex >= letters.length) activeIndex = 0;
        const cardElements = [];
        
        letters.forEach((letter, index) => {
          const cardWrap = document.createElement('div');
          cardWrap.className = 'letter-gallery-card';
          cardWrap.dataset.index = index;
          cardWrap.dataset.id = letter.id;

          const card = document.createElement('div');
          card.className = 'letter-card';
          card.dataset.id = letter.id;
          card.style.setProperty('--card-accent', mailbox.cardAccent || mailbox.accent);
          card.style.setProperty('--card-accent-dark', MailboxManager._darkenColor(mailbox.cardAccent || mailbox.accent, 0.2));

          const dateInfo = MailboxManager._parseDate(letter.date);
          const preview = letter.subtitle || letter.letterTitle || letter.elements?.find(e => e.type === 'text')?.content?.substring(0, 50) || '';
          const authorDisplay = letter.serverLetter
            ? (letter.senderIdentity?.identityName || letter.sender || '未知写信人')
            : MailboxManager.getLetterAuthorDisplay(letter);
          const isMyLetter = letter.serverLetter
            ? letter.direction === 'sent' || letter.direction === 'draft'
            : MailboxManager.isMyLetter(letter);
          const authorClass = isMyLetter ? 'letter-author-mine' : 'letter-author-other';
          const badge = !letter.serverLetter
            ? '<span class="letter-direction-badge">历史信件</span>'
            : letter.direction === 'draft'
              ? '<span class="letter-direction-badge draft">草稿</span>'
              : letter.direction === 'sent'
                ? '<span class="letter-direction-badge">已发送</span>'
                : `<span class="letter-direction-badge${letter.isUnread ? ' unread' : ''}">${letter.isUnread ? '新收信' : '已收取'}</span>`;

          card.innerHTML = `
            <div class="letter-card-body">
              ${badge}
              <div class="letter-card-seal">
                ${(letter.recipient || '收').charAt(0).toUpperCase()}
              </div>
              <h3 class="letter-card-title">${letter.title || letter.letterTitle || '无标题信件'}</h3>
              <p class="letter-card-preview">${preview ? preview + '...' : '暂无预览'}</p>
              <div class="letter-card-meta">
                <span class="letter-date">${dateInfo.month} ${dateInfo.day}, ${dateInfo.year}</span>
              </div>
              <div class="letter-card-author ${authorClass}">
                ${authorDisplay}
              </div>
            </div>
          `;

          cardWrap.addEventListener('click', (e) => {
            e.stopPropagation();
            const clickedIndex = parseInt(cardWrap.dataset.index);
            
            if (clickedIndex === activeIndex) {
              this.mailboxActiveIndex[activeKey] = activeIndex;
              if (letter.serverLetter && letter.direction === 'draft') {
                Editor.letter = null;
                this.navigate('editor', { letterId: letter.id, mailboxId });
              } else {
                this.navigate('reader', { letterId: letter.id, showEnvelope: true });
              }
            } else {
              activeIndex = clickedIndex;
              this.mailboxActiveIndex[activeKey] = activeIndex;
              _updateLayout();
            }
          });

          cardWrap.appendChild(card);
          letterTrack.appendChild(cardWrap);
          cardElements.push(cardWrap);
        });

        const _updateLayout = () => {
          this._updateStackLayout(cardElements, activeIndex, indicators);
        };

        _updateLayout();

        // 左右箭头按钮
        const prevBtn = document.getElementById('letters-prev');
        const nextBtn = document.getElementById('letters-next');

        if (prevBtn) {
          prevBtn.onclick = (e) => {
            e.stopPropagation();
            if (activeIndex > 0) {
              activeIndex--;
              this.mailboxActiveIndex[activeKey] = activeIndex;
              _updateLayout();
            }
          };
        }

        if (nextBtn) {
          nextBtn.onclick = (e) => {
            e.stopPropagation();
            if (activeIndex < cardElements.length - 1) {
              activeIndex++;
              this.mailboxActiveIndex[activeKey] = activeIndex;
              _updateLayout();
            }
          };
        }

        // 圆点指示器点击
        if (indicators) {
          indicators.addEventListener('click', (e) => {
            const dot = e.target.closest('.gallery-dot');
            if (dot) {
              const idx = parseInt(dot.dataset.index);
              activeIndex = idx;
              this.mailboxActiveIndex[activeKey] = activeIndex;
              _updateLayout();
            }
          });
        }
      }
    }
  },

  _updateStackLayout(cards, activeIndex, indicators) {
    cards.forEach((card, index) => {
      card.classList.remove('active', 'prev', 'next', 'far-prev', 'far-next', 'hidden-left', 'hidden-right');
      
      const diff = index - activeIndex;
      
      if (diff === 0) {
        card.classList.add('active');
      } else if (diff === -1) {
        card.classList.add('prev');
      } else if (diff === 1) {
        card.classList.add('next');
      } else if (diff === -2) {
        card.classList.add('far-prev');
      } else if (diff === 2) {
        card.classList.add('far-next');
      } else if (diff < -2) {
        card.classList.add('hidden-left');
      } else if (diff > 2) {
        card.classList.add('hidden-right');
      }
    });

    if (indicators) {
      indicators.innerHTML = '';
      cards.forEach((_, index) => {
        const dot = document.createElement('div');
        dot.className = 'gallery-dot' + (index === activeIndex ? ' active' : '');
        dot.dataset.index = index;
        indicators.appendChild(dot);
      });
    }
  },

  renderStyleSelect() {
    const grid = document.getElementById('style-grid');
    const styles = [
      { id: 'vintage-literary', icon: '📖', name: '文艺复古', desc: '日期、时间、星期，书籍式排版' },
      { id: 'modern-minimal', icon: '📄', name: '现代简约', desc: '干净留白，现代排版' },
      { id: 'cute-doodle', icon: '🎨', name: '可爱手绘', desc: '圆角边框，手绘装饰' },
      { id: 'japanese-vertical', icon: '🎋', name: '日式和风', desc: '竖排文字，和纸纹理' },
      { id: 'floral', icon: '🌸', name: '花语信纸', desc: '粉色花边框，浪漫温柔' },
      { id: 'night-letter', icon: '🌙', name: '夜书信纸', desc: '星空闪烁，静谧夜色' },
      { id: 'kraft', icon: '📦', name: '牛皮纸复古', desc: '做旧质感，怀旧温度' },
      { id: 'ocean', icon: '🌊', name: '海洋风', desc: '海浪波光，清新自由' }
    ];

    grid.innerHTML = styles.map(s => `
      <div class="style-card" data-style="${s.id}">
        <div class="style-card-icon">${s.icon}</div>
        <div class="style-card-name">${s.name}</div>
        <div class="style-card-desc">${s.desc}</div>
      </div>
    `).join('');

    grid.querySelectorAll('.style-card').forEach(card => {
      card.addEventListener('click', () => {
        const style = card.dataset.style;
        Editor.paperStyle = style;
        Editor.mailboxId = this.currentMailboxId;
        this.navigate('editor', {});
      });
    });
  },

  _getXiejianMaps() {
    return [
      { key: 'xj-jingyuan', name: '静远书院' },
      { key: 'xj-daohua', name: '道华观' },
      { key: 'xj-tianxing', name: '天行教' },
      { key: 'xj-danxi', name: '丹溪谷' },
      { key: 'xj-buhuan', name: '不还门' },
      { key: 'xj-taozhi', name: '桃止门' },
      { key: 'xj-dongjia', name: '东嘉沈府' },
      { key: 'xj-ren', name: '任府' },
      { key: 'xj-capital', name: '京城翰林院' },
      { key: 'xj-forgetfulness', name: '忘川' },
      { key: 'xj-border', name: '边陲小镇' }
    ];
  },

  _syncMapSelect() {
    const select = document.getElementById('map-select');
    if (!select || !window.gameMapRenderer) return;
    const category = this._resolveMailboxGameCategory();
    let options = [];
    let value = '';

    if (category === 'xiejian') {
      options = this._getXiejianMaps().map(map => ({ value: map.key, label: map.name }));
      value = this._xiejianMapKey || window.gameMapRenderer.currentMapBgKey || 'xj-jingyuan';
    } else if (category === 'hanmen') {
      options = [{ value: 'hanmen', label: document.getElementById('map-name')?.textContent || '寒门' }];
      value = 'hanmen';
    } else {
      options = (window.gameMapRenderer.getMaps?.() || []).map((map, index) => ({
        value: `legacy:${index}`,
        label: map.name || `地图 ${index + 1}`
      }));
      value = `legacy:${window.gameMapRenderer.currentMapIndex || 0}`;
    }

    const signature = options.map(option => `${option.value}:${option.label}`).join('|');
    if (select.dataset.signature !== signature) {
      select.innerHTML = options.map(option =>
        `<option value="${this._escapeHtml(option.value)}">${this._escapeHtml(option.label)}</option>`
      ).join('');
      select.dataset.signature = signature;
    }
    select.value = options.some(option => option.value === value) ? value : (options[0]?.value || '');
    select.disabled = options.length < 2;
  },

  _switchMapFromSelect(value) {
    if (!value || !window.gameMapRenderer) return;
    const category = this._resolveMailboxGameCategory();
    if (category === 'xiejian') {
      this._enterXiejianMap(value);
      return;
    }
    if (!value.startsWith('legacy:')) return;
    const index = Number(value.slice(7));
    const maps = window.gameMapRenderer.getMaps?.() || [];
    if (!Number.isInteger(index) || !maps[index]) return;
    window.gameMapRenderer.switchMap(index);
    const mapName = document.getElementById('map-name');
    if (mapName) mapName.textContent = maps[index].name;
  },

  _bindRecipientPicker() {
    if (this._recipientPickerBound) return;
    this._recipientPickerBound = true;
    const overlay = document.getElementById('recipient-picker-overlay');
    document.getElementById('recipient-picker-close')?.addEventListener('click', () => {
      overlay?.classList.remove('active');
      overlay?.setAttribute('aria-hidden', 'true');
    });
    overlay?.addEventListener('click', event => {
      if (event.target === overlay) {
        overlay.classList.remove('active');
        overlay.setAttribute('aria-hidden', 'true');
      }
    });
    document.querySelectorAll('.mail-folder-tab').forEach(button => {
      button.addEventListener('click', () => {
        this._mailFolder = button.dataset.folder || 'timeline';
        document.querySelectorAll('.mail-folder-tab').forEach(tab => {
          const active = tab === button;
          tab.classList.toggle('active', active);
          tab.setAttribute('aria-selected', active ? 'true' : 'false');
        });
        if (this.currentView === 'mailbox' && this.currentMailboxId) {
          this.renderMailboxView(this.currentMailboxId, true);
        }
      });
    });
  },

  async _openRecipientPicker(mailboxId, onSelect = null) {
    const user = AuthManager.getCurrentUser();
    if (!user) {
      alert('请先登录账号再写信。');
      return;
    }
    if (!mailboxId) return;
    this._bindRecipientPicker();
    const overlay = document.getElementById('recipient-picker-overlay');
    const list = document.getElementById('recipient-picker-list');
    const status = document.getElementById('recipient-picker-status');
    if (!overlay || !list || !status) return;
    overlay.classList.add('active');
    overlay.setAttribute('aria-hidden', 'false');
    status.textContent = '正在读取可收信的账号…';
    list.innerHTML = '';
    try {
      await MailService.syncAccount(user);
      const recipients = await MailService.getRecipients(mailboxId);
      status.textContent = recipients.length ? '' : '当前信箱还没有其他可收信的账号。';
      for (const recipient of recipients) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'recipient-choice';
        const name = recipient.identityName || recipient.displayName || recipient.username;
        const detail = mailboxId === 'mailbox-xiejian'
          ? '挟剑角色 · 已绑定'
          : mailboxId === 'mailbox-hanmen-duet'
            ? '寒门角色'
            : '账号收信人';
        button.innerHTML = `
          <span class="recipient-choice-avatar">${(name || '?').charAt(0)}</span>
          <span class="recipient-choice-copy">
            <strong class="recipient-choice-name">${name}</strong>
            <span class="recipient-choice-detail">${detail}</span>
          </span>
          <span class="recipient-choice-action">写信</span>
        `;
        button.addEventListener('click', () => {
          this._pendingRecipient = recipient;
          overlay.classList.remove('active');
          overlay.setAttribute('aria-hidden', 'true');
          if (onSelect) {
            onSelect(recipient);
            return;
          }
          Editor.pendingRecipient = recipient;
          Editor.letter = null;
          this.navigate('editor', { mailboxId, recipient });
        });
        list.appendChild(button);
      }
    } catch (error) {
      status.textContent = '无法读取收信人，请确认 3000 服务已启动后重试。';
      console.warn('[MailService] Recipient load failed:', error);
    }
  },

  _startMailPolling() {
    if (this._mailPollTimer) clearInterval(this._mailPollTimer);
    if (!AuthManager.getCurrentUser()) return;
    this._mailPollTimer = setInterval(() => {
      if (document.hidden || this.currentView !== 'mailbox' || !this.currentMailboxId) return;
      this._refreshMailboxMail(this.currentMailboxId);
    }, 3000);
    if (!this._mailFocusBound) {
      this._mailFocusBound = true;
      window.addEventListener('focus', () => {
        if (this.currentView === 'mailbox' && this.currentMailboxId) {
          this._refreshMailboxMail(this.currentMailboxId);
        }
      });
    }
  },

  async _refreshMailboxMail(mailboxId) {
    if (!AuthManager.getCurrentUser() || !mailboxId) return;
    try {
      await MailService.getMailbox(mailboxId);
      if (this.currentView === 'mailbox' && this.currentMailboxId === mailboxId) {
        const main = document.querySelector('#mailbox-view .gallery-main');
        if (!main?.classList.contains('map-mode') && !main?.classList.contains('diary-mode')) {
          this.renderMailboxView(mailboxId, true);
        }
      }
    } catch (error) {
      console.warn('[MailService] Mail refresh failed:', error);
    }
  },

  _bindXiejianEntryUI() {
    if (this._xiejianEntryBound) return;
    this._xiejianEntryBound = true;

    const enterButton = document.getElementById('xiejian-enter-map');
    const backButton = document.getElementById('xiejian-back-to-character');
    const mapSettingsButton = document.getElementById('xiejian-map-settings-btn');

    enterButton?.addEventListener('click', () => {
      if (this._xiejianPendingMapKey) {
        this._enterXiejianMap(this._xiejianPendingMapKey);
      }
    });

    mapSettingsButton?.addEventListener('click', () => {
      this._closeXiejianEntry();
      document.getElementById('multiplayer-settings-btn')?.click();
    });
  },

  _openXiejianEntry() {
    const overlay = document.getElementById('xiejian-entry-overlay');
    if (!overlay) return;
    overlay.classList.add('active');
    overlay.setAttribute('aria-hidden', 'false');
  },

  _closeXiejianEntry() {
    const overlay = document.getElementById('xiejian-entry-overlay');
    if (!overlay) return;
    overlay.classList.remove('active');
    overlay.setAttribute('aria-hidden', 'true');
  },

  _setXiejianEntryStatus(message, isError = false) {
    const status = document.getElementById('xiejian-entry-status');
    if (!status) return;
    status.textContent = message || '';
    status.style.color = isError ? '#a03d38' : '#5d7655';
  },

  _updateXiejianCapacity() {
    const capacity = document.getElementById('xiejian-entry-capacity');
    if (!capacity || typeof MultiplayerSync === 'undefined') return;
    const online = Object.keys(MultiplayerSync.getOnlinePlayers()).length + 1;
    capacity.textContent = `${online} / ${MultiplayerSync.maxConnections || 11} 在线`;
  },

  _renderXiejianCharacterChoices() {
    const grid = document.getElementById('xiejian-character-grid');
    if (!grid || !window.gameMapRenderer) return;

    const occupied = new Set(
      typeof MultiplayerSync !== 'undefined' ? MultiplayerSync.getOccupiedCharacters() : []
    );
    const characters = window.gameMapRenderer.getCharactersForCategory('xiejian');
    grid.innerHTML = '';

    const systemsStatus = window.GameSystems?.getStatus?.();
    if (systemsStatus?.source === 'local' || systemsStatus?.status === 'fallback') {
      this._setXiejianEntryStatus('远端资源不可用，已安全使用本地人物资源');
    }

    for (const character of characters) {
      const isSelf = character.id === this._xiejianCharacterId;
      const isOccupied = occupied.has(character.id) && !isSelf;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `xiejian-entry-choice${isSelf ? ' selected' : ''}`;
      button.disabled = isOccupied;
      button.dataset.characterId = character.id;
      const localPortrait = `../../fill/jingyuan-chibi20-delivery-20260719/${character.dir}/frames/personality/00.png`;
      const portrait = window.GameSystems?.resolveAssetUrl?.(character.portraitPath || localPortrait)
        || `sendbox/fill/jingyuan-chibi20-delivery-20260719/${character.dir}/frames/personality/00.png`;
      button.setAttribute('aria-label', `${character.name}，${character.sect || '未知门派'}，武力 ${character.martial || 0}`);
      button.innerHTML = `
        <img class="xiejian-entry-character" src="${portrait}" alt="${character.name}角色立绘">
        <strong>${character.name}</strong>
        <small>${isOccupied ? '已被绑定' : (character.sect || '可绑定')} · 武力 ${character.martial || 0}</small>
        <span class="xiejian-entry-meta">${character.actions?.length || 0} 个动作 · ${character.defaultItems?.length || 0} 件初始物品</span>
      `;
      button.addEventListener('click', () => {
        const confirmed = window.confirm(
          `确认绑定“${character.name}”吗？\n\n角色与账号永久绑定，确认后不能更换。`
        );
        if (!confirmed) return;
        for (const choice of grid.querySelectorAll('button')) choice.disabled = true;
        this._setXiejianEntryStatus('正在确认角色…');
        MultiplayerSync.requestCharacter(character.id);
      });
      grid.appendChild(button);
    }
    this._updateXiejianCapacity();
  },

  _renderXiejianMapChoices() {
    const grid = document.getElementById('xiejian-map-grid');
    if (!grid) return;
    grid.innerHTML = '';

    for (const map of this._getXiejianMaps()) {
      const selected = map.key === this._xiejianPendingMapKey;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `xiejian-entry-choice${selected ? ' selected' : ''}`;
      button.dataset.mapKey = map.key;
      button.innerHTML = `<strong>${map.name}</strong>`;
      button.addEventListener('click', () => {
        this._xiejianPendingMapKey = map.key;
        this._enterXiejianMap(map.key);
      });
      grid.appendChild(button);
    }
  },

  _showXiejianCharacterStep() {
    this._openXiejianEntry();
    document.getElementById('xiejian-character-step')?.classList.add('active');
    document.getElementById('xiejian-map-step')?.classList.remove('active');
    const title = document.getElementById('xiejian-entry-title');
    const subtitle = document.getElementById('xiejian-entry-subtitle');
    if (title) title.textContent = '首次绑定角色';
    if (subtitle) subtitle.textContent = '角色一经绑定不可更换，请谨慎选择';
    const backButton = document.getElementById('xiejian-back-to-character');
    const settingsButton = document.getElementById('xiejian-map-settings-btn');
    const enterButton = document.getElementById('xiejian-enter-map');
    if (backButton) backButton.hidden = true;
    if (settingsButton) settingsButton.hidden = true;
    if (enterButton) enterButton.hidden = true;
    this._setXiejianEntryStatus('');
    this._renderXiejianCharacterChoices();
  },

  _showXiejianMapStep() {
    this._openXiejianEntry();
    this._xiejianPendingMapKey = this._xiejianMapKey || 'xj-jingyuan';
    document.getElementById('xiejian-character-step')?.classList.remove('active');
    document.getElementById('xiejian-map-step')?.classList.add('active');
    const title = document.getElementById('xiejian-entry-title');
    const subtitle = document.getElementById('xiejian-entry-subtitle');
    if (title) title.textContent = '切换地图';
    if (subtitle) subtitle.textContent = '点击地图后立即前往，并记住本账号最后访问的位置';
    const backButton = document.getElementById('xiejian-back-to-character');
    const settingsButton = document.getElementById('xiejian-map-settings-btn');
    const enterButton = document.getElementById('xiejian-enter-map');
    if (backButton) backButton.hidden = true;
    if (settingsButton) settingsButton.hidden = false;
    if (enterButton) enterButton.hidden = true;
    this._setXiejianEntryStatus('');
    this._renderXiejianMapChoices();
  },

  async _enterXiejianMap(mapKey) {
    if (!mapKey || !window.gameMapRenderer) return;

    if (!this._xiejianCharacterId) {
      const boundCharacterId = MultiplayerSync.accountProfile?.xiejianCharacterId
        || MailService.profile?.xiejianCharacterId
        || (!AuthManager.getCurrentUser() ? STORAGE.loadCharacterBinding(this.currentMailboxId) : '');
      if (boundCharacterId) {
        this._xiejianCharacterId = boundCharacterId;
        await window.gameMapRenderer.loadCharacter(boundCharacterId);
      } else {
        return;
      }
    }

    if (this._xiejianMapKey) {
      this._xiejianMapPositions[this._xiejianMapKey] = {
        x: window.gameMapRenderer.player.x,
        y: window.gameMapRenderer.player.y
      };
    }

    this._xiejianMapKey = mapKey;
    this._xiejianPendingMapKey = mapKey;
    await window.gameMapRenderer.setMapBackground(mapKey);
    this._syncMapSelect();
    const position = this._xiejianMapPositions[mapKey]
      || window.gameMapRenderer.getDefaultSpawnPoint();
    window.gameMapRenderer.player.x = position.x;
    window.gameMapRenderer.player.y = position.y;
    window.gameMapRenderer.player.moving = false;
    window.gameMapRenderer.player.action = 'personality';
    window.gameMapRenderer.player.frame = 0;
    window.gameMapRenderer.centerCamera();
    MultiplayerSync.changeMap(mapKey, position);
    if (AuthManager.getCurrentUser() && typeof MailService.getWorldItems === 'function') {
      MailService.getWorldItems(mapKey).then(items => {
        if (this._xiejianMapKey !== mapKey) return;
        MultiplayerSync.worldItems = items;
        window.gameMapRenderer?.setWorldItems(items);
        this._updateXiejianWorldItemStatus(items);
      }).catch(error => console.warn('[WorldItems] 无法刷新地图物品:', error));
    }
    this._refreshXiejianRemotePlayers();
    this._closeXiejianEntry();
  },

  _refreshXiejianRemotePlayers() {
    if (!window.gameMapRenderer || typeof MultiplayerSync === 'undefined') return;
    const players = MultiplayerSync.getOnlinePlayers();

    for (const userId of Object.keys(window.gameMapRenderer.remotePlayers || {})) {
      const player = players[userId];
      if (!player || !player.characterId || player.mapKey !== this._xiejianMapKey) {
        window.gameMapRenderer.removeRemotePlayer(userId);
      }
    }

    for (const [userId, player] of Object.entries(players)) {
      if (!player.characterId || player.mapKey !== this._xiejianMapKey) continue;
      window.gameMapRenderer.addRemotePlayer(userId, player.characterId, player.x, player.y);
      window.gameMapRenderer.updateRemotePlayer(userId, player);
    }
    this._updateOnlinePlayersList();
  },

  _updateXiejianWorldItemStatus(items) {
    const status = document.getElementById('xiejian-world-item-status');
    if (!status) return;
    const visibleItems = Array.isArray(items) ? items : [];
    const portableCount = visibleItems.filter(item => item.definition?.portable !== false).length;
    const fixedCount = visibleItems.length - portableCount;
    status.textContent = `${portableCount} 件可拾取${fixedCount ? ` · ${fixedCount} 处可互动` : ''}`;
    status.hidden = !this._isXiejianMailbox() || visibleItems.length === 0;
  },

  _initMultiplayer(mailboxId) {
    if (!mailboxId || !window.gameMapRenderer) return;

    const currentUser = AuthManager.getCurrentUser();
    if (!currentUser) return;

    const isXiejian = mailboxId === 'mailbox-xiejian';
    const sharedMailbox = STORAGE.loadSharedMailbox(mailboxId);
    const isShared = sharedMailbox && sharedMailbox.members && sharedMailbox.members.length > 1;

    if (!isXiejian && !isShared) return;
    if (typeof MultiplayerSync === 'undefined') return;

    window.gameMapRenderer.setMultiplayerMode(true);
    this._bindXiejianEntryUI();

    const setupMultiplayer = () => {
      this._updateMultiplayerUI(true);

      MultiplayerSync.on('join', (player) => {
        if (!window.gameMapRenderer) return;
        if (isXiejian) {
          this._refreshXiejianRemotePlayers();
        } else if (player.characterId) {
          window.gameMapRenderer.addRemotePlayer(player.userId, player.characterId, player.x, player.y);
        }
        this._updateOnlinePlayersList();
        this._updateXiejianCapacity();
      });

      MultiplayerSync.on('leave', (data) => {
        if (!window.gameMapRenderer) return;
        window.gameMapRenderer.removeRemotePlayer(data.userId);
        this._updateOnlinePlayersList();
        this._updateXiejianCapacity();
      });

      MultiplayerSync.on('update', (player) => {
        if (!window.gameMapRenderer) return;
        if (isXiejian) {
          if (player.characterId && player.mapKey === this._xiejianMapKey) {
            window.gameMapRenderer.addRemotePlayer(player.userId, player.characterId, player.x, player.y);
            window.gameMapRenderer.updateRemotePlayer(player.userId, player);
          } else {
            window.gameMapRenderer.removeRemotePlayer(player.userId);
          }
        } else {
          window.gameMapRenderer.updateRemotePlayer(player.userId, player);
        }
      });

      MultiplayerSync.on('action', (data) => {
        if (!window.gameMapRenderer) return;
        if (isXiejian && data.mapKey !== this._xiejianMapKey) return;
        window.gameMapRenderer.playRemoteAction(data.userId, data.action);
      });

      MultiplayerSync.on('interact', (data) => {
        if (!window.gameMapRenderer) return;
        if (data.toUserId === MultiplayerSync.accountKey) {
          window.gameMapRenderer.handleRemoteInteract(data.fromUserId, data.actionType);
        }
      });

      MultiplayerSync.on('chat', (data) => {
        this._handleRemoteChat(data, currentUser);
      });

      MultiplayerSync.on('mapChange', () => {
        if (isXiejian) this._refreshXiejianRemotePlayers();
      });

      if (isXiejian) {
        MultiplayerSync.on('inventory', (inventory) => {
          this._renderXiejianInventory(inventory);
          this._updateXiejianTargetHud();
        });

        MultiplayerSync.on('worldItems', (data) => {
          if (data.mapKey && data.mapKey !== this._xiejianMapKey) return;
          window.gameMapRenderer?.setWorldItems(data.items || []);
          this._updateXiejianWorldItemStatus(data.items || []);
        });

        MultiplayerSync.on('worldItemSpawned', (data) => {
          if (data.instance?.mapKey !== this._xiejianMapKey) return;
          window.gameMapRenderer?.addWorldItem(data.instance);
          this._showXiejianFeedback(`${data.instance.definition?.name || '物品'}已重新出现`);
        });

        MultiplayerSync.on('worldItemRemoved', (data) => {
          window.gameMapRenderer?.removeWorldItem(data.instanceId);
        });

        MultiplayerSync.on('worldItemInspected', (data) => {
          const definition = data.instance?.definition;
          const damagePreview = definition?.id === 'training_sword_target'
            ? ` 当前攻击为 ${MultiplayerSync.combatProfile?.attack || 0}，对基础防御目标可造成 ${Math.max(1, (MultiplayerSync.combatProfile?.attack || 0) - 4)} 点伤害。`
            : '';
          this._showXiejianFeedback(definition ? `${definition.name}：${definition.description}${damagePreview}` : '这是不可拾取的固定物件');
        });

        MultiplayerSync.on('itemRejected', (data) => {
          const messages = {
            already_taken: '物品已被别人取走。',
            too_far: '距离太远，请靠近后再试。',
            different_map: '对方不在当前地图。',
            not_owned: '这件物品不在你的背包中。',
            cooldown: '招式尚未恢复，请稍候。',
            target_invulnerable: '目标正处于保护状态。',
            immobilized: '当前无法行动。'
          };
          this._showXiejianFeedback(messages[data.reason] || '操作未完成，请稍后再试。', true);
        });

        MultiplayerSync.on('itemSuccess', (data) => {
          if (data.action === 'gift') this._showXiejianFeedback('物品已赠出。');
          if (data.action === 'received') this._showXiejianFeedback('你收到了一件物品。');
        });

        MultiplayerSync.on('combatState', (data) => {
          const remote = window.gameMapRenderer?.remotePlayers?.[data.userId];
          if (remote) remote.combat = data.combat;
          this._renderXiejianInventory(MultiplayerSync.inventory);
          this._updateXiejianTargetHud();
        });

        MultiplayerSync.on('combatHit', (data) => {
          window.gameMapRenderer?.showCombatHit(data);
          if (data.attackerAccountKey === MultiplayerSync.accountKey) {
            window.gameMapRenderer?.playAction('martial');
          } else if (data.targetAccountKey === MultiplayerSync.accountKey) {
            this._showXiejianFeedback(`受到 ${data.damage} 点伤害`, true);
          }
          this._renderXiejianInventory(MultiplayerSync.inventory);
          this._updateXiejianTargetHud();
        });

        MultiplayerSync.on('playerDefeated', async (data) => {
          if (data.userId !== MultiplayerSync.accountKey) {
            this._refreshXiejianRemotePlayers();
            return;
          }
          this._showXiejianFeedback('体力耗尽，已返回静远书院并获得短暂无敌。', true);
          await this._enterXiejianMap(data.returnMapKey || 'xj-jingyuan');
          window.gameMapRenderer.player.x = Number(data.x) || window.gameMapRenderer.player.x;
          window.gameMapRenderer.player.y = Number(data.y) || window.gameMapRenderer.player.y;
          window.gameMapRenderer.centerCamera();
        });

        MultiplayerSync.on('roomState', async (data) => {
          this._renderXiejianCharacterChoices();
          const profile = data.accountProfile || {};
          if (!profile.xiejianCharacterId) {
            this._showXiejianCharacterStep();
            this._updateOnlinePlayersList();
            return;
          }
          this._xiejianCharacterId = profile.xiejianCharacterId;
          MailService.profile = { ...(MailService.profile || {}), ...profile };
          STORAGE.saveCharacterBinding(this.currentMailboxId, profile.xiejianCharacterId);
          await window.gameMapRenderer.loadCharacter(profile.xiejianCharacterId);
          const currentSection = document.getElementById('current-character-section');
          const guestSection = document.getElementById('guest-character-section');
          if (currentSection) currentSection.style.display = 'block';
          if (guestSection) guestSection.style.display = 'none';
          this._updateCurrentCharacterInfo();
          this._updateOnlinePlayersList();
          await this._enterXiejianMap(profile.lastXiejianMapKey || 'xj-jingyuan');
          window.gameMapRenderer.setWorldItems(data.worldItems || []);
          this._updateXiejianWorldItemStatus(data.worldItems || []);
          this._renderXiejianInventory(data.inventory);
          this._startXiejianPromptLoop();
        });

        MultiplayerSync.on('occupancy', () => {
          this._renderXiejianCharacterChoices();
        });

        MultiplayerSync.on('characterSelected', async (data) => {
          this._xiejianCharacterId = data.characterId;
          MailService.profile = {
            ...(MailService.profile || {}),
            xiejianCharacterId: data.characterId,
            lastXiejianMapKey: data.mapKey || 'xj-jingyuan'
          };
          STORAGE.saveCharacterBinding(this.currentMailboxId, data.characterId);
          await window.gameMapRenderer.loadCharacter(data.characterId);
          const currentSection = document.getElementById('current-character-section');
          const guestSection = document.getElementById('guest-character-section');
          if (currentSection) currentSection.style.display = 'block';
          if (guestSection) guestSection.style.display = 'none';
          this._updateCurrentCharacterInfo();
          this._updateOnlinePlayersList();
          this._renderXiejianCharacterChoices();
          await this._enterXiejianMap(data.mapKey || 'xj-jingyuan');
          this._startXiejianPromptLoop();
        });

        MultiplayerSync.on('characterRejected', (data) => {
          if (data.reason === 'binding_locked' && data.boundCharacterId) {
            this._setXiejianEntryStatus('此账号已经永久绑定角色，正在恢复…');
            return;
          }
          this._showXiejianCharacterStep();
          this._setXiejianEntryStatus(
            data.reason === 'occupied'
              ? '这个角色已经永久绑定给其他账号，请换一位。'
              : '该角色暂不可用，请刷新后重试。',
            true
          );
        });

        MultiplayerSync.on('joinRejected', (data) => {
          this._openXiejianEntry();
          const messages = {
            room_full: '房间已满，当前最多支持 11 个不同账号。',
            invalid_join: '连接信息无效，请刷新后重试。'
          };
          this._setXiejianEntryStatus(messages[data.reason] || '无法加入房间。', true);
        });

        MultiplayerSync.on('sessionReplaced', () => {
          this._stopStateSync();
          this._openXiejianEntry();
          document.getElementById('xiejian-character-step')?.classList.remove('active');
          document.getElementById('xiejian-map-step')?.classList.remove('active');
          const title = document.getElementById('xiejian-entry-title');
          const subtitle = document.getElementById('xiejian-entry-subtitle');
          if (title) title.textContent = '账号已在另一页面接管';
          if (subtitle) subtitle.textContent = '同一账号只保留一个实时人物';
          this._setXiejianEntryStatus('此页面已停止移动和同步，请使用后来打开的页面。', true);
          this._updateOnlinePlayersList();
        });
      }

      MultiplayerSync.init(mailboxId, currentUser, {
        mode: isXiejian ? 'xiejian' : 'default',
        characterId: isXiejian ? '' : (currentUser.role || 'xiu-jing'),
        mapKey: isXiejian ? '' : (window.gameMapRenderer.currentMapBgKey || '')
      });

      if (!isXiejian) {
        const player = window.gameMapRenderer.player;
        MultiplayerSync.broadcastState({
          x: player.x,
          y: player.y,
          direction: player.direction,
          action: player.action,
          frame: player.frame,
          moving: player.moving
        });
      }

      this._updateOnlinePlayersList();

      window.multiplayerInteractCallback = (toUserId, actionType) => {
        if (typeof MultiplayerSync !== 'undefined') {
          MultiplayerSync.broadcastInteract(toUserId, actionType);
        }
      };

      this._wrapPlayAction();
      this._bindVisibilityChange();
      this._bindBeforeUnload();
      this._startStateSync();
      this._bindChatInput();
      if (!isXiejian) this._startDuetActionPanel();
    };

    if (isXiejian) {
      this._xiejianCharacterId = '';
      this._xiejianMapKey = '';
      this._xiejianPendingMapKey = '';
      this._openXiejianEntry();
      document.getElementById('xiejian-character-step')?.classList.remove('active');
      document.getElementById('xiejian-map-step')?.classList.remove('active');
      const title = document.getElementById('xiejian-entry-title');
      const subtitle = document.getElementById('xiejian-entry-subtitle');
      if (title) title.textContent = '正在进入挟剑';
      if (subtitle) subtitle.textContent = '正在读取账号绑定的角色与最后地图…';
      this._setXiejianEntryStatus('');
      setupMultiplayer();
    } else {
      const characterId = currentUser.role || 'xiu-jing';
      window.gameMapRenderer.loadCharacter(characterId).then(setupMultiplayer);
    }
  },

  _initGuestXiejianSystems() {
    if (!window.gameMapRenderer) return;

    const boundCharacterId = STORAGE.loadCharacterBinding(this.currentMailboxId);
    this._xiejianCharacterId = boundCharacterId || 'zhou-ran';
    this._xiejianMapKey = 'xj-jingyuan';
    this._xiejianPendingMapKey = 'xj-jingyuan';

    window.gameMapRenderer.loadCharacter(this._xiejianCharacterId).then(() => {
      const backpackButton = document.getElementById('xiejian-backpack-btn');
      if (backpackButton) {
        backpackButton.hidden = false;
        backpackButton.classList.add('xiejian-active');
      }

      // 优先从本地存储加载背包，如果没有则创建默认
      const savedInventory = STORAGE.loadInventory(this.currentMailboxId);
      const guestInventory = savedInventory || {
        combat: {
          hp: 100,
          maxHp: 100,
          martial: 0,
          attack: 4,
          defense: 4,
          poisonedUntil: 0
        },
        items: [],
        quickSlots: []
      };

      if (typeof MultiplayerSync !== 'undefined') {
        MultiplayerSync.inventory = guestInventory;
      }

      this._renderXiejianInventory(guestInventory);

      const mapNameEl = document.getElementById('map-name');
      if (mapNameEl) mapNameEl.textContent = '静远书院';

      this._bindXiejianGameUI();
    });
  },

  _bindXiejianGameUI() {
    if (this._xiejianUiBound) return;
    this._xiejianUiBound = true;

    const backpackButton = document.getElementById('xiejian-backpack-btn');
    const closeButton = document.getElementById('xiejian-inventory-close');
    const prompt = document.getElementById('xiejian-interact-prompt');
    const attackButton = document.getElementById('xiejian-attack-btn');
    const interactButton = document.getElementById('mobile-interact-btn');
    backpackButton?.addEventListener('click', () => this._toggleXiejianInventory());
    closeButton?.addEventListener('click', () => this._toggleXiejianInventory(false));
    prompt?.addEventListener('click', () => this._triggerXiejianInteraction());
    interactButton?.addEventListener('click', () => this._triggerXiejianInteraction());
    attackButton?.addEventListener('click', () => this._attackXiejianTarget());

    document.querySelectorAll('[data-inventory-filter]').forEach(button => {
      button.addEventListener('click', () => {
        document.querySelectorAll('[data-inventory-filter]').forEach(item => item.classList.remove('active'));
        button.classList.add('active');
        this._inventoryFilter = button.dataset.inventoryFilter || 'all';
        this._renderXiejianInventory(MultiplayerSync.inventory);
      });
    });

    document.querySelectorAll('[data-quick-slot]').forEach(button => {
      button.addEventListener('click', () => {
        const index = Number(button.dataset.quickSlot);
        const instanceId = MultiplayerSync.inventory?.quickSlots?.[index];
        if (instanceId) MultiplayerSync.useItem(instanceId);
      });
    });

    window.addEventListener('keydown', event => {
      if (this.currentMailboxId !== 'mailbox-xiejian' || this.currentView !== 'mailbox') return;
      const target = event.target;
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target?.isContentEditable) return;
      if (event.key === 'b' || event.key === 'B') {
        event.preventDefault();
        this._toggleXiejianInventory();
      }
      if (/^[1-4]$/.test(event.key)) {
        const instanceId = MultiplayerSync.inventory?.quickSlots?.[Number(event.key) - 1];
        if (instanceId) MultiplayerSync.useItem(instanceId);
      }
    });

    window.xiejianWorldItemCallback = item => this._handleXiejianWorldItem(item);
    window.xiejianTargetCallback = (userId, player) => {
      window.gameMapRenderer?.setSelectedTarget(userId);
      this._updateXiejianTargetHud(userId, player);
    };
    window.xiejianAttackCallback = targetId => this._attackXiejianTarget(targetId);
    this._bindMobileMapChrome();
  },

  _bindMobileMapChrome() {
    const mobileQuery = window.matchMedia('(max-width: 768px)');
    const mapControls = document.querySelector('.map-controls');
    const mapToggle = document.getElementById('mobile-map-controls-toggle');
    const viewSwitch = document.getElementById('view-switch');
    const chatContainer = document.getElementById('chat-input-container');
    const charSelector = document.getElementById('character-selector');
    const charToggle = document.getElementById('char-toggle-btn');
    const mobileActions = document.getElementById('mobile-actions');
    const mobileActionsToggle = document.getElementById('mobile-actions-toggle');
    const onlineToggle = document.getElementById('xiejian-online-toggle');
    const onlinePanel = document.getElementById('online-players-panel');
    const mapSelect = document.getElementById('map-select');

    const setExpanded = (element, toggle, expanded, expandedClass) => {
      element?.classList.toggle(expandedClass, expanded);
      toggle?.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    };

    if (charToggle && charSelector && !charToggle.dataset.bound) {
      charToggle.dataset.bound = 'true';
      charToggle.setAttribute('aria-expanded', charSelector.classList.contains('open') ? 'true' : 'false');
      charToggle.addEventListener('click', event => {
        event.stopPropagation();
        setExpanded(charSelector, charToggle, !charSelector.classList.contains('open'), 'open');
      });
    }

    if (mobileActionsToggle && mobileActions && !mobileActionsToggle.dataset.bound) {
      mobileActionsToggle.dataset.bound = 'true';
      mobileActionsToggle.setAttribute('aria-expanded', mobileActions.classList.contains('open') ? 'true' : 'false');
      mobileActionsToggle.addEventListener('click', event => {
        event.stopPropagation();
        const expanded = !mobileActions.classList.contains('open');
        setExpanded(mobileActions, mobileActionsToggle, expanded, 'open');
        mobileActionsToggle.classList.toggle('active', expanded);
      });
    }

    if (mapToggle && !mapToggle.dataset.bound) {
      mapToggle.dataset.bound = 'true';
      mapToggle.addEventListener('click', event => {
        event.stopPropagation();
        setExpanded(mapControls, mapToggle, !mapControls?.classList.contains('mobile-expanded'), 'mobile-expanded');
      });
    }

    if (onlineToggle && onlinePanel && !onlineToggle.dataset.bound) {
      onlineToggle.dataset.bound = 'true';
      onlineToggle.addEventListener('click', event => {
        event.stopPropagation();
        const expanded = !onlinePanel.classList.contains('open');
        onlinePanel.classList.toggle('open', expanded);
        onlinePanel.style.display = expanded ? 'block' : 'none';
        onlineToggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
        if (expanded) this._updateOnlinePlayersList();
      });
    }

    if (mapSelect && !mapSelect.dataset.bound) {
      mapSelect.dataset.bound = 'true';
      mapSelect.addEventListener('change', event => this._switchMapFromSelect(event.currentTarget.value));
    }
    this._syncMapSelect();

    if (mobileQuery.matches) {
      mapControls?.classList.remove('mobile-expanded');
      viewSwitch?.classList.remove('mobile-collapsed');
      viewSwitch?.classList.remove('mobile-expanded');
      chatContainer?.classList.add('mobile-open');
    }
  },

  _toggleXiejianInventory(forceOpen) {
    const drawer = document.getElementById('xiejian-inventory-drawer');
    if (!drawer) return;
    const shouldOpen = forceOpen === undefined ? !drawer.classList.contains('open') : Boolean(forceOpen);
    drawer.classList.toggle('open', shouldOpen);
    drawer.setAttribute('aria-hidden', shouldOpen ? 'false' : 'true');
    if (shouldOpen) {
      // 优先从本地存储加载，如果没有再用内存中的
      let inventory = typeof MultiplayerSync !== 'undefined' ? MultiplayerSync.inventory : null;
      if (!inventory) inventory = STORAGE.loadInventory(this.currentMailboxId);
      this._renderXiejianInventory(inventory);

      if (AuthManager.getCurrentUser() && typeof MailService !== 'undefined' && typeof MailService.getInventory === 'function') {
        MailService.getInventory().then(serverInventory => {
          if (!serverInventory) return;
          MultiplayerSync.inventory = serverInventory;
          MultiplayerSync.combatProfile = serverInventory.combat || MultiplayerSync.combatProfile;
          STORAGE.saveInventory(this.currentMailboxId, serverInventory);
          if (drawer.classList.contains('open')) this._renderXiejianInventory(serverInventory);
        }).catch(error => console.warn('[Inventory] 无法刷新服务器背包:', error));
      }
    }
  },

  _syncInventoryPortrait(charId) {
    const portraitEl = document.getElementById('xiejian-inventory-portrait');
    const ownerEl = document.getElementById('xiejian-inventory-owner');
    
    // 确定当前角色ID
    if (!charId) {
      const boundCharId = STORAGE.loadCharacterBinding(this.currentMailboxId);
      const currentUser = AuthManager.getCurrentUser();
      if (this._isXiejianMailbox()) {
        charId = this._xiejianCharacterId
          || MultiplayerSync.accountProfile?.xiejianCharacterId
          || MailService.profile?.xiejianCharacterId
          || (!currentUser ? boundCharId : '')
          || 'zhou-ran';
      } else {
        charId = (currentUser && currentUser.role) || boundCharId || 'xiu-jing';
      }
    }
    
    // 获取角色信息
    let charInfo = null;
    if (window.gameMapRenderer && typeof window.gameMapRenderer.getCharacterInfo === 'function') {
      charInfo = window.gameMapRenderer.getCharacterInfo(charId);
    }
    
    // 角色ID与文件夹名/中文名映射
    const xiejianCharDirMap = {
      'zhou-ran': '01-周然',
      'he-qingfeng': '02-贺清风',
      'ren-chaoye': '03-任朝野',
      'shen-chiyi': '04-沈池懿',
      'qi-pingchuan': '05-戚凭川',
      'jiang-haoan': '06-江淮安',
      'tang-wanchu': '07-唐挽初'
    };
    const charNames = {
      'zhou-ran': '周然',
      'he-qingfeng': '贺清风',
      'ren-chaoye': '任朝野',
      'shen-chiyi': '沈池懿',
      'qi-pingchuan': '戚凭川',
      'jiang-haoan': '江淮安',
      'tang-wanchu': '唐挽初',
      'xiu-jing': '修璟',
      'xuan-xuan': '萱宣'
    };
    // 服务端规范 ID；保留旧 ID 仅用于历史数据兼容。
    xiejianCharDirMap['jiang-huaian'] = xiejianCharDirMap['jiang-haoan'];
    charNames['jiang-huaian'] = charNames['jiang-haoan'];
    
    // 更新标题
    if (ownerEl) {
      const name = (charInfo && charInfo.name) || charNames[charId] || '角色';
      ownerEl.textContent = `${name}的行囊`;
    }
    
    // 更新头像（挟剑角色使用素材路径）
    if (portraitEl) {
      const charDir = (charInfo && charInfo.dir) || xiejianCharDirMap[charId];
      if (charDir && xiejianCharDirMap[charId]) {
        portraitEl.src = `sendbox/fill/jingyuan-chibi20-delivery-20260719/${charDir}/frames/personality/00.png`;
        portraitEl.alt = charNames[charId] || '角色头像';
        portraitEl.style.display = '';
      } else {
        // 寒门角色使用头像字
        portraitEl.style.display = 'none';
      }
    }
  },

  _renderXiejianInventory(inventory) {
    if (!inventory) {
      inventory = typeof MultiplayerSync !== 'undefined' ? MultiplayerSync.inventory : null;
      if (!inventory) inventory = STORAGE.loadInventory(this.currentMailboxId);
      if (!inventory) {
        inventory = this._createDefaultInventory();
      }
      if (typeof MultiplayerSync !== 'undefined') {
        MultiplayerSync.inventory = inventory;
      }
    }
    
    // 新增：更新背包标题和角色头像
    this._syncInventoryPortrait();
    
    const combat = {
      ...(inventory.combat || {}),
      ...(MultiplayerSync.combatProfile || {})
    };
    const hpRatio = Math.max(0, Math.min(1, (combat.hp || 0) / (combat.maxHp || 100)));
    const setText = (id, value) => {
      const element = document.getElementById(id);
      if (element) element.textContent = value;
    };
    setText('xiejian-hp-text', `${combat.hp ?? 100} / ${combat.maxHp || 100}`);
    setText('xiejian-martial-stat', combat.martial ?? 0);
    setText('xiejian-attack-stat', combat.attack ?? 0);
    setText('xiejian-defense-stat', combat.defense ?? 4);
    const hpBar = document.getElementById('xiejian-hp-bar');
    if (hpBar) hpBar.style.width = `${hpRatio * 100}%`;
    const statuses = [];
    if (Date.now() < (combat.poisonedUntil || 0)) statuses.push('中毒');
    if (Date.now() < (combat.immobilizedUntil || 0)) statuses.push('无法移动');
    if (Date.now() < (combat.invulnerableUntil || 0)) statuses.push('无敌保护');
    if (combat.pendingCoating) statuses.push(combat.pendingCoating === 'poison' ? '武器淬毒' : '迷香已备');
    setText('xiejian-status-line', statuses.length ? statuses.join(' · ') : '状态安定');

    const char = window.gameMapRenderer?.getCharacterInfo?.(this._xiejianCharacterId);
    setText('xiejian-inventory-owner', char ? `${char.name}的随身行囊` : '挟剑角色背包');
    const portrait = document.getElementById('xiejian-inventory-portrait');
    if (portrait && char) {
      portrait.src = `sendbox/fill/jingyuan-chibi20-delivery-20260719/${char.dir}/frames/personality/00.png`;
      portrait.alt = char.name;
    }

    const inventoryItemsById = Object.fromEntries((inventory.items || []).map(item => [item.instanceId, item]));
    document.querySelectorAll('#xiejian-equipment-slots [data-slot]').forEach(button => {
      const slot = button.dataset.slot;
      const equippedId = inventory.equipment?.[slot];
      const equippedItem = equippedId ? inventoryItemsById[equippedId] : null;
      const equipped = combat.equipment?.[slot] || (equippedItem ? {
        instanceId: equippedItem.instanceId,
        name: equippedItem.definition?.name,
        icon: equippedItem.definition?.icon
      } : null);
      const label = button.querySelector('span')?.textContent || '';
      button.innerHTML = equipped
        ? `${equipped.icon ? `<img src="${equipped.icon}" alt="">` : ''}<span>${label}</span><strong>${equipped.name}</strong>`
        : `<span>${label}</span><strong>未装备</strong>`;
      button.onclick = equipped ? () => MultiplayerSync.equipItem(equipped.instanceId) : null;
    });

    const groups = new Map();
    for (const item of inventory.items || []) {
      const key = item.definitionId;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(item);
    }
    const matches = ([, items]) => {
      const definition = items[0].definition;
      if (this._inventoryFilter === 'all') return true;
      if (this._inventoryFilter === 'equipment') return Boolean(definition.equipmentSlot);
      if (this._inventoryFilter === 'medicine') return definition.category === 'medicine';
      return definition.category === this._inventoryFilter;
    };
    const grid = document.getElementById('xiejian-item-grid');
    if (grid) {
      grid.innerHTML = '';
      for (const [, items] of [...groups.entries()].filter(matches)) {
        const item = items[0];
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `xiejian-item-card${item.instanceId === this._selectedInventoryItemId ? ' selected' : ''}`;
        button.innerHTML = `<img src="${item.definition.icon}" alt=""><span>${item.definition.name}</span>${items.length > 1 ? `<em>×${items.length}</em>` : ''}`;
        button.addEventListener('click', () => {
          this._selectedInventoryItemId = item.instanceId;
          this._renderXiejianInventory(inventory);
          this._renderXiejianItemDetail(item);
        });
        grid.appendChild(button);
      }
      if (!grid.children.length) {
        grid.innerHTML = '<p class="xiejian-inventory-empty">这一类暂时没有物品。</p>';
      }
    }

    const selected = (inventory.items || []).find(item => item.instanceId === this._selectedInventoryItemId);
    if (selected) this._renderXiejianItemDetail(selected);

    const byId = Object.fromEntries((inventory.items || []).map(item => [item.instanceId, item]));
    document.querySelectorAll('[data-quick-slot]').forEach(button => {
      const index = Number(button.dataset.quickSlot);
      const item = byId[inventory.quickSlots?.[index]];
      button.innerHTML = item
        ? `<img src="${item.definition.icon}" alt="${item.definition.name}" title="${item.definition.name}">`
        : String(index + 1);
    });

    STORAGE.saveInventory(this.currentMailboxId, inventory);
  },

  _createDefaultInventory() {
    return {
      combat: {
        hp: 100,
        maxHp: 100,
        martial: 0,
        attack: 4,
        defense: 4,
        poisonedUntil: 0,
        immobilizedUntil: 0,
        invulnerableUntil: 0,
        equipment: {}
      },
      items: [],
      quickSlots: []
    };
  },

  _renderXiejianItemDetail(item) {
    const detail = document.getElementById('xiejian-item-detail');
    if (!detail || !item) return;
    const definition = item.definition;
    const equipped = Boolean(item.equippedSlot);
    const nearbyPlayers = Object.values(MultiplayerSync.getOnlinePlayers())
      .filter(player => player.mapKey === this._xiejianMapKey)
      .filter(player => Math.hypot(
        player.x - window.gameMapRenderer.player.x,
        player.y - window.gameMapRenderer.player.y
      ) <= 96);
    detail.innerHTML = `
      <h3>${definition.name}</h3>
      <small>${definition.categoryName}${equipped ? ` · 已装备于${item.equippedSlot}` : ''}</small>
      <p>${definition.description}</p>
      <p class="xiejian-item-origin">${item.originLabel || '来自 既有物品'}</p>
      <p class="xiejian-item-acquisition">${item.acquisitionLabel || '既有物品'}</p>
      <div class="xiejian-item-actions"></div>
    `;
    const actions = detail.querySelector('.xiejian-item-actions');
    const addAction = (label, handler, secondary = false) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = label;
      if (secondary) button.className = 'secondary';
      button.addEventListener('click', handler);
      actions.appendChild(button);
    };
    if (definition.equipmentSlot) {
      addAction(equipped ? '卸下装备' : '装备', () => MultiplayerSync.equipItem(item.instanceId));
    }
    if (definition.effect) addAction('使用', () => MultiplayerSync.useItem(item.instanceId));
    for (let index = 0; index < 4; index += 1) {
      if (definition.effect) {
        addAction(`放入快捷栏 ${index + 1}`, () => MultiplayerSync.assignQuickSlot(item.instanceId, index), true);
      }
    }
    for (const player of nearbyPlayers) {
      const name = window.gameMapRenderer?.getCharacterInfo?.(player.characterId)?.name || player.displayName;
      addAction(`赠给 ${name}`, () => MultiplayerSync.giftItem(item.instanceId, player.userId), true);
    }
    addAction('丢在脚边', () => MultiplayerSync.dropItem(item.instanceId), true);
  },

  _handleXiejianWorldItem(item) {
    if (!item) return;
    MultiplayerSync.pickupItem(item.instanceId);
  },

  _triggerXiejianInteraction() {
    const renderer = window.gameMapRenderer;
    if (!renderer) return;
    const item = renderer.getNearbyWorldItem?.(80);
    if (item) {
      this._handleXiejianWorldItem(item);
      return;
    }
    if (renderer.nearbyPlayer) {
      renderer.tryInteract?.();
      return;
    }
    this._showXiejianFeedback('请靠近物品、场景物件或其他玩家后再交互。', true);
  },

  _attackXiejianTarget(targetId) {
    const id = targetId || window.gameMapRenderer?.selectedTargetId;
    if (!id) {
      this._showXiejianFeedback('请先点击同地图玩家锁定目标。', true);
      return;
    }
    MultiplayerSync.attack(id);
  },

  _updateXiejianTargetHud(userId, player) {
    const targetId = userId || window.gameMapRenderer?.selectedTargetId;
    const target = player || window.gameMapRenderer?.remotePlayers?.[targetId];
    const panel = document.getElementById('xiejian-target-hud');
    if (!panel) return;
    if (!target || !target.visible) {
      panel.hidden = true;
      return;
    }
    const charName = window.gameMapRenderer?.getCharacterInfo?.(target.characterId)?.name || target.displayName || targetId;
    const hp = target.combat?.hp ?? 100;
    const maxHp = target.combat?.maxHp || 100;
    setTimeout(() => {
      const name = document.getElementById('xiejian-target-name');
      const bar = document.getElementById('xiejian-target-health-bar');
      if (name) name.textContent = `${charName} · ${hp}/${maxHp}`;
      if (bar) bar.style.width = `${Math.max(0, Math.min(100, hp / maxHp * 100))}%`;
      panel.hidden = false;
    }, 0);
  },

  _startXiejianPromptLoop() {
    if (this._xiejianPromptTimer) clearInterval(this._xiejianPromptTimer);
    this._xiejianPromptTimer = setInterval(() => {
      if (this.currentMailboxId !== 'mailbox-xiejian') return;
      const item = window.gameMapRenderer?.getNearbyWorldItem(80);
      const prompt = document.getElementById('xiejian-interact-prompt');
      const interactButton = document.getElementById('mobile-interact-btn');
      const hasNearbyPlayer = Boolean(window.gameMapRenderer?.nearbyPlayer);
      const canInteract = Boolean(item || hasNearbyPlayer);
      if (interactButton) {
        interactButton.disabled = !canInteract;
        interactButton.classList.toggle('ready', canInteract);
        interactButton.title = item
          ? `${item.definition?.portable === false ? '查看' : '拾取'}${item.definition?.name ? `：${item.definition.name}` : ''}`
          : (hasNearbyPlayer ? '与附近玩家互动' : '请靠近物品或互动对象');
      }
      if (!prompt) return;
      prompt.hidden = !item;
      if (!item) return;
      const icon = document.getElementById('xiejian-interact-icon');
      const text = document.getElementById('xiejian-interact-text');
      if (icon) icon.src = item.definition.icon;
      if (text) text.textContent = `${item.definition.portable ? '拾取' : '查看'} ${item.definition.name}`;
    }, 120);
  },

  _showXiejianFeedback(message, isError = false) {
    const prompt = document.getElementById('xiejian-interact-prompt');
    const text = document.getElementById('xiejian-interact-text');
    if (!prompt || !text) return;
    text.textContent = message;
    prompt.classList.toggle('error', isError);
    prompt.hidden = false;
    clearTimeout(this._xiejianFeedbackTimer);
    this._xiejianFeedbackTimer = setTimeout(() => {
      prompt.classList.remove('error');
      if (!window.gameMapRenderer?.getNearbyWorldItem(80)) prompt.hidden = true;
    }, 2600);
  },

  _destroyMultiplayer() {
    this._stopStateSync();
    this._unbindVisibilityChange();
    this._unbindBeforeUnload();

    if (typeof MultiplayerSync !== 'undefined') {
      MultiplayerSync.destroy();
    }
    if (window.gameMapRenderer) {
      window.gameMapRenderer.setMultiplayerMode(false);
      for (const userId of Object.keys(window.gameMapRenderer.remotePlayers || {})) {
        window.gameMapRenderer.removeRemotePlayer(userId);
      }
    }

    window.multiplayerInteractCallback = null;
    window.gameMapRenderer?.setWorldItems([]);
    window.gameMapRenderer?.setSelectedTarget('');
    if (this._xiejianPromptTimer) {
      clearInterval(this._xiejianPromptTimer);
      this._xiejianPromptTimer = null;
    }
    document.getElementById('xiejian-inventory-drawer')?.classList.remove('open');
    const targetHud = document.getElementById('xiejian-target-hud');
    if (targetHud) targetHud.hidden = true;
    const prompt = document.getElementById('xiejian-interact-prompt');
    if (prompt) prompt.hidden = true;
    this._closeXiejianEntry();
    const onlinePanel = document.getElementById('online-players-panel');
    const onlineToggle = document.getElementById('xiejian-online-toggle');
    if (onlinePanel) {
      onlinePanel.classList.remove('open');
      onlinePanel.style.display = 'none';
    }
    onlineToggle?.setAttribute('aria-expanded', 'false');
    this._xiejianCharacterId = '';
    this._xiejianMapKey = '';
    this._xiejianPendingMapKey = '';

    this._updateMultiplayerUI(false);
  },

  _updateMultiplayerUI(isMultiplayer) {
    const currentCharSection = document.getElementById('current-character-section');
    const guestCharSection = document.getElementById('guest-character-section');
    const onlinePlayersPanel = document.getElementById('online-players-panel');
    const chatInputContainer = document.getElementById('chat-input-container');
    const currentUser = AuthManager.getCurrentUser();
    const isLoggedIn = !!currentUser;

    if (isMultiplayer && isLoggedIn) {
      if (currentCharSection) currentCharSection.style.display = 'block';
      if (guestCharSection) guestCharSection.style.display = 'none';
      if (onlinePlayersPanel) {
        onlinePlayersPanel.classList.remove('open');
        onlinePlayersPanel.style.display = 'none';
      }
      if (chatInputContainer) chatInputContainer.style.display = 'flex';
      this._updateCurrentCharacterInfo();
    } else {
      if (currentCharSection) currentCharSection.style.display = 'none';
      if (guestCharSection) guestCharSection.style.display = 'block';
      if (onlinePlayersPanel) onlinePlayersPanel.style.display = 'none';
      // 修复：地图模式下始终显示聊天框，无论是否登录
      if (chatInputContainer) chatInputContainer.style.display = 'flex';
    }
  },

  _bindMultiplayerSettings() {
    const settingsBtn = document.getElementById('multiplayer-settings-btn');
    const settingsPanel = document.getElementById('multiplayer-settings-panel');
    const closeBtn = document.getElementById('mp-close-btn');
    const connectBtn = document.getElementById('mp-connect-btn');
    const disconnectBtn = document.getElementById('mp-disconnect-btn');
    const serverUrlInput = document.getElementById('mp-server-url');
    const roomIdInput = document.getElementById('mp-room-id');
    const statusEl = document.getElementById('mp-status');

    if (!settingsBtn) return;

    // 打开/关闭设置面板
    settingsBtn.addEventListener('click', () => {
      if (settingsPanel.style.display === 'none') {
        settingsPanel.style.display = 'block';
        this._updateMultiplayerStatus();
        // 加载已保存的设置
        if (typeof MultiplayerSync !== 'undefined') {
          const savedUrl = MultiplayerSync.getServerUrl();
          if (savedUrl) serverUrlInput.value = savedUrl;
          const savedRoom = MultiplayerSync.getRoomId();
          if (savedRoom) roomIdInput.value = savedRoom;
        }
      } else {
        settingsPanel.style.display = 'none';
      }
    });

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        settingsPanel.style.display = 'none';
      });
    }

    // 连接按钮
    if (connectBtn) {
      connectBtn.addEventListener('click', () => {
        const serverUrl = serverUrlInput.value.trim();
        const roomId = roomIdInput.value.trim();

        if (!serverUrl) {
          if (statusEl) {
            statusEl.textContent = '请输入服务器地址';
            statusEl.className = 'mp-status';
          }
          return;
        }

        if (!roomId) {
          if (statusEl) {
            statusEl.textContent = '请输入房间号';
            statusEl.className = 'mp-status';
          }
          return;
        }

        if (typeof MultiplayerSync === 'undefined') {
          if (statusEl) {
            statusEl.textContent = '同步模块未加载';
            statusEl.className = 'mp-status';
          }
          return;
        }

        if (statusEl) {
          statusEl.textContent = '连接中...';
          statusEl.className = 'mp-status connecting';
        }

        // 设置服务器地址和房间号
        MultiplayerSync.setServerUrl(serverUrl);
        MultiplayerSync.setRoomId(roomId);

        // 重新初始化多人连接
        const currentUser = AuthManager.getCurrentUser();
        if (currentUser && this.currentMailboxId) {
          this._destroyMultiplayer();
          setTimeout(() => {
            this._initMultiplayer(this.currentMailboxId);

            // 等待连接结果
            setTimeout(() => {
              this._updateMultiplayerStatus();
            }, 2000);
          }, 100);
        }
      });
    }

    // 断开按钮
    if (disconnectBtn) {
      disconnectBtn.addEventListener('click', () => {
        this._destroyMultiplayer();
        this._updateMultiplayerStatus();
      });
    }
  },

  _updateMultiplayerStatus() {
    const statusEl = document.getElementById('mp-status');
    const connectBtn = document.getElementById('mp-connect-btn');
    const disconnectBtn = document.getElementById('mp-disconnect-btn');
    const settingsBtn = document.getElementById('multiplayer-settings-btn');

    if (!statusEl) return;

    if (typeof MultiplayerSync === 'undefined') {
      statusEl.textContent = '同步模块未加载';
      statusEl.className = 'mp-status';
      return;
    }

    if (MultiplayerSync.isConnected()) {
      const room = MultiplayerSync.getRoomId();
      const players = Object.keys(MultiplayerSync.getOnlinePlayers()).length;
      statusEl.textContent = `已连接 | 房间: ${room} | 在线: ${players + 1}人`;
      statusEl.className = 'mp-status connected';
      if (connectBtn) connectBtn.style.display = 'none';
      if (disconnectBtn) disconnectBtn.style.display = 'block';
      if (settingsBtn) settingsBtn.classList.add('connected');
    } else {
      statusEl.textContent = '未连接';
      statusEl.className = 'mp-status';
      if (connectBtn) connectBtn.style.display = 'block';
      if (disconnectBtn) disconnectBtn.style.display = 'none';
      if (settingsBtn) settingsBtn.classList.remove('connected');
    }
  },

  _updateOnlinePlayersList() {
    const listEl = document.getElementById('online-players-list');
    if (!listEl) return;

    const currentUser = AuthManager.getCurrentUser();
    if (!currentUser) return;

    let allPlayers = [];
    const isXiejian = this._isXiejianMailbox();
    const getCharacterName = (characterId) => {
      if (!characterId || !window.gameMapRenderer?.getCharacterInfo) return '';
      return window.gameMapRenderer.getCharacterInfo(characterId)?.name || '';
    };

    const accountKey = typeof MailService !== 'undefined'
      ? MailService.getAccountKey(currentUser)
      : String(currentUser.username || '').trim().toLocaleLowerCase('en-US');
    const selfCharacterId = this._xiejianCharacterId
      || (typeof MultiplayerSync !== 'undefined' ? MultiplayerSync.accountProfile?.xiejianCharacterId : '')
      || (typeof MailService !== 'undefined' ? MailService.profile?.xiejianCharacterId : '')
      || STORAGE.loadCharacterBinding(this.currentMailboxId)
      || '';

    if (!isXiejian || selfCharacterId) {
      allPlayers.push({
        userId: accountKey,
        username: currentUser.username || currentUser.displayName || currentUser.name || accountKey,
        characterName: isXiejian ? getCharacterName(selfCharacterId) : '',
        name: currentUser.displayName || currentUser.username || currentUser.name || '我',
        isSelf: true,
        isOnline: true,
        role: isXiejian ? selfCharacterId : currentUser.role
      });
    }

    if (typeof MultiplayerSync !== 'undefined') {
      const onlinePlayers = MultiplayerSync.getOnlinePlayers();
      for (const [userId, player] of Object.entries(onlinePlayers)) {
        if (userId === accountKey || (isXiejian && (!player.characterId || player.ready === false))) continue;
        allPlayers.push({
          userId: userId,
          username: player.username || player.displayName || player.name || userId,
          characterName: isXiejian ? getCharacterName(player.characterId) : '',
          name: player.displayName || player.username || player.name || userId,
          isSelf: false,
          isOnline: true,
          role: player.characterId
        });
      }
    }

    const count = allPlayers.length;
    const countLabel = document.getElementById('online-players-count');
    const countBadge = document.getElementById('xiejian-online-count');
    if (countLabel) countLabel.textContent = `${count} 人`;
    if (countBadge) countBadge.textContent = String(count);

    listEl.innerHTML = allPlayers.map(player => {
      const username = this._escapeHtml(player.username || player.name || player.userId || '?');
      const characterName = this._escapeHtml(player.characterName || player.name || '未绑定角色');
      const initial = characterName.charAt(0) || '?';
      return `
        <div class="online-player-item" data-user-id="${this._escapeHtml(player.userId)}">
          <div class="online-player-avatar">${initial}</div>
          <span class="online-player-identity">
            <strong class="online-player-name">${username}${player.isSelf ? '（我）' : ''}</strong>
            <small class="online-player-character">${characterName}</small>
          </span>
          <span class="online-status" title="${player.isOnline ? '在线' : '离线'}"></span>
        </div>
      `;
    }).join('');
  },

  _bindChatInput() {
    const chatInput = document.getElementById('chat-input');
    const chatSendBtn = document.getElementById('chat-send-btn');
    const chatHistoryBtn = document.getElementById('chat-history-btn');
    const chatHistoryClose = document.getElementById('chat-history-close');
    const chatHistoryPanel = document.getElementById('chat-history-panel');
    if (!chatInput || !chatSendBtn) return;

    // 获取或创建访客ID
    const getGuestKey = () => {
      let guestKey = localStorage.getItem('guest_chat_key');
      if (!guestKey) {
        guestKey = 'guest_' + Math.random().toString(36).substring(2, 8);
        localStorage.setItem('guest_chat_key', guestKey);
      }
      return guestKey;
    };

    const sendChat = () => {
      const content = chatInput.value.trim();
      if (!content) return;
      if (content.length > 50) {
        content = content.substring(0, 50);
      }

      if (!window.gameMapRenderer) {
        chatInput.value = '';
        return;
      }

      const currentUser = AuthManager.getCurrentUser();
      const accountKey = currentUser
        ? (typeof MailService !== 'undefined'
            ? MailService.getAccountKey(currentUser)
            : String(currentUser.username || '').trim().toLocaleLowerCase('en-US'))
        : getGuestKey();
      const displayName = currentUser
        ? (currentUser.displayName || currentUser.username || '我')
        : '访客';

      if (typeof MultiplayerSync !== 'undefined' && MultiplayerSync.broadcastChat) {
        MultiplayerSync.broadcastChat(content);
      }

      window.gameMapRenderer.showChatBubble(accountKey, content);

      this._addChatMessage(accountKey, displayName, content, true);

      chatInput.value = '';
    };

    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        sendChat();
      }
    });

    chatSendBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      sendChat();
    });

    if (chatHistoryBtn) {
      chatHistoryBtn.addEventListener('click', () => {
        if (chatHistoryPanel) {
          const isVisible = chatHistoryPanel.style.display !== 'none';
          chatHistoryPanel.style.display = isVisible ? 'none' : 'flex';
          if (!isVisible) {
            this._renderChatHistory();
          }
        }
      });
    }

    if (chatHistoryClose && chatHistoryPanel) {
      chatHistoryClose.addEventListener('click', () => {
        chatHistoryPanel.style.display = 'none';
      });
    }
  },

  _getChatHistoryKey() {
    const currentUser = AuthManager.getCurrentUser();
    if (currentUser) {
      const sharedMailboxId = AuthManager.getSharedMailboxId(currentUser.id);
      if (sharedMailboxId) return 'chat_history_' + sharedMailboxId;
    }
    // 访客模式：使用当前信箱ID
    if (this.currentMailboxId) {
      return 'chat_history_guest_' + this.currentMailboxId;
    }
    return null;
  },

  _loadChatHistory() {
    const key = this._getChatHistoryKey();
    if (!key) return [];
    try {
      return JSON.parse(localStorage.getItem(key) || '[]');
    } catch (e) {
      return [];
    }
  },

  _saveChatHistory(messages) {
    const key = this._getChatHistoryKey();
    if (!key) return;
    try {
      localStorage.setItem(key, JSON.stringify(messages));
    } catch (e) {}
  },

  _addChatMessage(userId, userName, content, isSelf) {
    const messages = this._loadChatHistory();
    messages.push({
      id: Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      userId: userId,
      userName: userName,
      content: content,
      isSelf: isSelf,
      timestamp: Date.now()
    });
    if (messages.length > 200) {
      messages.splice(0, messages.length - 200);
    }
    this._saveChatHistory(messages);

    const panel = document.getElementById('chat-history-panel');
    if (panel && panel.style.display !== 'none') {
      this._renderChatHistory();
    }
  },

  _renderChatHistory() {
    const listEl = document.getElementById('chat-history-list');
    if (!listEl) return;

    const messages = this._loadChatHistory();

    if (messages.length === 0) {
      listEl.innerHTML = '<div class="chat-history-empty">暂无聊天记录</div>';
      return;
    }

    listEl.innerHTML = messages.map(msg => {
      const initial = (msg.userName || '?').charAt(0);
      return `
        <div class="chat-history-item ${msg.isSelf ? 'self' : ''}">
          <div class="chat-history-avatar">${initial}</div>
          <div>
            <div class="chat-history-bubble">${this._escapeHtml(msg.content)}</div>
          </div>
        </div>
      `;
    }).join('');

    listEl.scrollTop = listEl.scrollHeight;
  },

  _escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  _startDuetActionPanel() {
    // 单人模式：不再启动双人动作面板
    return;
  },

  _stopDuetActionPanel() {
    // 单人模式：no-op
  },

  _updateDuetActionPanel() {
    if (!window.gameMapRenderer || !window.gameMapRenderer.multiplayerMode) return;

    const panel = document.getElementById('duet-action-panel');
    const mapContainer = document.getElementById('game-map-container');
    if (!panel || !mapContainer) return;

    const nearby = window.gameMapRenderer.getNearbyPlayer(3);
    if (!nearby) {
      if (panel.style.display !== 'none') {
        panel.style.display = 'none';
      }
      return;
    }

    if (panel.style.display === 'none') {
      panel.style.display = 'block';
    }

    const player = nearby.player;
    const screenX = player.x - window.gameMapRenderer.camera.x;
    const screenY = player.y - window.gameMapRenderer.camera.y - 100;

    panel.style.left = (screenX - panel.offsetWidth / 2) + 'px';
    panel.style.top = screenY + 'px';
  },

  _playDuetAction(actionName) {
    if (!window.gameMapRenderer) return;

    const nearby = window.gameMapRenderer.getNearbyPlayer(3);
    if (!nearby) return;

    if (window.gameMapRenderer.playAction) {
      window.gameMapRenderer.playAction(actionName);
    }
  },

  _saveChatAsLetter(content, currentUser) {
    if (!this.currentMailboxId) return;

    const sharedMailboxId = AuthManager.getSharedMailboxId(currentUser.id);
    if (!sharedMailboxId) return;

    const title = content.length > 10 ? content.substring(0, 10) + '...' : content;

    const letter = {
      id: 'chat-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
      mailboxId: sharedMailboxId,
      letterTitle: title,
      recipient: '',
      sender: currentUser.displayName || currentUser.username,
      senderId: typeof MailService !== 'undefined'
        ? MailService.getAccountKey(currentUser)
        : String(currentUser.username || '').trim().toLocaleLowerCase('en-US'),
      senderRole: currentUser.role || '',
      content: [
        {
          type: 'text',
          text: content
        }
      ],
      letterType: 'chat-letter',
      envelopeStyle: 'env-chinese-kraft',
      status: 'delivered',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      read: false,
      hasRecording: false,
      scheduledAt: null,
      delivery: null
    };

    STORAGE.saveSharedLetterWithMedia(sharedMailboxId, letter).then(() => {
      if (this.currentView === 'mailbox' && this.currentMailboxId === sharedMailboxId) {
        this.renderMailboxView(sharedMailboxId);
      }
    }).catch(() => {});
  },

  _handleRemoteChat(data, currentUser) {
    if (!data || !data.userId || !data.content) return;
    const accountKey = typeof MailService !== 'undefined'
      ? MailService.getAccountKey(currentUser)
      : String(currentUser.username || '').trim().toLocaleLowerCase('en-US');
    if (data.userId === accountKey) return;

    const userInfo = this._getUserInfoById(data.userId);
    const remotePlayer = typeof MultiplayerSync !== 'undefined'
      ? MultiplayerSync.getPlayers()[data.userId]
      : null;
    const characterName = this.currentMailboxId === 'mailbox-xiejian'
      && remotePlayer?.characterId
      && window.gameMapRenderer?.getCharacterInfo
      ? window.gameMapRenderer.getCharacterInfo(remotePlayer.characterId)?.name
      : '';
    const senderName = characterName || userInfo?.displayName || userInfo?.username || '对方';

    this._addChatMessage(data.userId, senderName, data.content, false);

    const canShowBubble = this.currentMailboxId !== 'mailbox-xiejian'
      || !data.mapKey
      || data.mapKey === this._xiejianMapKey;
    if (canShowBubble && window.gameMapRenderer && window.gameMapRenderer.showChatBubble) {
      window.gameMapRenderer.showChatBubble(data.userId, data.content);
    }
  },

  _getUserInfoById(userId) {
    try {
      const users = JSON.parse(localStorage.getItem('xinjian_users') || '[]');
      return users.find(u => u.id === userId) || null;
    } catch (e) {
      return null;
    }
  },

  _updateCurrentCharacterInfo() {
    const currentUser = AuthManager.getCurrentUser();
    const boundCharId = STORAGE.loadCharacterBinding(this.currentMailboxId);

    // 只要有绑定角色或者已登录，就更新信息
    const charNameEl = document.getElementById('current-char-name');
    const charSectEl = document.getElementById('current-char-sect');
    const charAvatarEl = document.getElementById('current-char-avatar');

    const isXiejian = this._isXiejianMailbox();
    const charId = isXiejian
      ? (this._xiejianCharacterId
        || MultiplayerSync.accountProfile?.xiejianCharacterId
        || MailService.profile?.xiejianCharacterId
        || (!currentUser ? boundCharId : '')
        || 'zhou-ran')
      : ((currentUser && currentUser.role) || boundCharId || 'xiu-jing');
    let charName = '角色';
    let charSect = '门派';
    let charInitial = '?';

    if (window.gameMapRenderer && typeof window.gameMapRenderer.getCharacterInfo === 'function') {
      const charInfo = window.gameMapRenderer.getCharacterInfo(charId);
      if (charInfo) {
        charName = charInfo.name || charName;
        charSect = charInfo.sect || charSect;
        charInitial = charInfo.name ? charInfo.name.charAt(0) : charInitial;
      }
    } else {
      const charNames = {
        'xiu-jing': { name: '修璟', sect: '寒门' },
        'xuan-xuan': { name: '萱宣', sect: '寒门' },
        'zhou-ran': { name: '周然', sect: '道华观' },
        'he-qingfeng': { name: '贺清风', sect: '天行教' },
        'ren-chaoye': { name: '任朝野', sect: '天行教' },
        'shen-chiyi': { name: '沈池懿', sect: '静远书院' },
        'qi-pingchuan': { name: '戚凭川', sect: '镇沅侯府' },
        'jiang-haoan': { name: '江淮安', sect: '妙手回春' },
        'tang-wanchu': { name: '唐挽初', sect: '竹报平安' }
      };
      if (charNames[charId]) {
        charName = charNames[charId].name;
        charSect = charNames[charId].sect;
        charInitial = charName.charAt(0);
      }
    }

    if (charNameEl) charNameEl.textContent = charName;
    if (charSectEl) charSectEl.textContent = charSect;
    if (charAvatarEl) charAvatarEl.textContent = charInitial;
  },

  _startStateSync() {
    this._stopStateSync();
    this._stateSyncPaused = false;
    this._stateSyncInterval = setInterval(() => {
      if (this._stateSyncPaused) return;
      if (!window.gameMapRenderer || !this.currentMailboxId) return;
      if (typeof MultiplayerSync === 'undefined') return;

      const player = window.gameMapRenderer.player;
      const currentUser = AuthManager.getCurrentUser();
      if (!currentUser) return;

      MultiplayerSync.broadcastState({
        characterId: currentUser.role || window.gameMapRenderer.selectedCharacter,
        x: player.x,
        y: player.y,
        direction: player.direction,
        action: player.action,
        frame: player.frame,
        moving: player.moving
      });
    }, 100);
  },

  _stopStateSync() {
    if (this._stateSyncInterval) {
      clearInterval(this._stateSyncInterval);
      this._stateSyncInterval = null;
    }
    this._stateSyncPaused = false;
  },

  _wrapPlayAction() {
    if (!window.gameMapRenderer || this._originalPlayAction) return;

    this._originalPlayAction = window.gameMapRenderer.playAction.bind(window.gameMapRenderer);

    window.gameMapRenderer.playAction = (actionName) => {
      this._originalPlayAction(actionName);

      if (typeof MultiplayerSync !== 'undefined' && this.currentMailboxId) {
        MultiplayerSync.broadcastAction(actionName);
      }
    };
  },

  _bindVisibilityChange() {
    if (this._visibilityHandler) return;

    this._visibilityHandler = () => {
      if (document.hidden) {
        this._stateSyncPaused = true;
      } else {
        this._stateSyncPaused = false;
        if (typeof MultiplayerSync !== 'undefined' && this.currentMailboxId) {
          const currentUser = AuthManager.getCurrentUser();
          if (currentUser && window.gameMapRenderer) {
            const player = window.gameMapRenderer.player;
            MultiplayerSync.broadcastState({
              characterId: currentUser.role || window.gameMapRenderer.selectedCharacter,
              x: player.x,
              y: player.y,
              direction: player.direction,
              action: player.action,
              frame: player.frame,
              moving: player.moving
            });
          }
        }
      }
    };

    document.addEventListener('visibilitychange', this._visibilityHandler);
  },

  _unbindVisibilityChange() {
    if (this._visibilityHandler) {
      document.removeEventListener('visibilitychange', this._visibilityHandler);
      this._visibilityHandler = null;
    }
  },

  _bindBeforeUnload() {
    if (this._beforeUnloadHandler) return;

    this._beforeUnloadHandler = () => {
      if (typeof MultiplayerSync !== 'undefined') {
        MultiplayerSync.destroy();
      }
    };

    window.addEventListener('beforeunload', this._beforeUnloadHandler);
  },

  _unbindBeforeUnload() {
    if (this._beforeUnloadHandler) {
      window.removeEventListener('beforeunload', this._beforeUnloadHandler);
      this._beforeUnloadHandler = null;
    }
  },

  checkAndInitGameMap() {
    const mapContainer = document.getElementById('mailbox-map-view');
    if (!mapContainer) return;

    const mailboxes = MailboxManager.getMailboxes();
    const currentMailbox = mailboxes.find(m => m.id === this.currentMailboxId);
    const isXiejianMailbox = this._isXiejianMailbox();
    const isHanmenMailbox = this._isHanmenMailbox();
    const mailboxCategory = isXiejianMailbox ? 'xiejian' : (isHanmenMailbox ? 'hanmen' : null);
    let mapBg = currentMailbox ? currentMailbox.mapBackground : null;

    if (isHanmenMailbox) {
      mapBg = 'hanmen';
    } else if (isXiejianMailbox && (!mapBg || !mapBg.startsWith('xj-'))) {
      mapBg = 'xj-jingyuan';
    }

    const applyMailboxGameScope = () => {
      if (!window.gameMapRenderer) return;

      // 每个信箱只展示属于自己的角色集合，避免跨作品误选。
      let activeCategory = mailboxCategory;
      if (!mailboxCategory) {
        activeCategory = 'hanmen';
      }
      mapContainer.classList.toggle('xiejian-mode', isXiejianMailbox);
      window.gameMapRenderer.setCategory(activeCategory);
      // 所有有地图背景的信箱都显示背包
      const backpackButton = document.getElementById('xiejian-backpack-btn');
      if (backpackButton) {
        const hasGameMap = !!mapBg;
        backpackButton.hidden = !hasGameMap;
        backpackButton.classList.toggle('xiejian-active', hasGameMap);
      }

      document.querySelectorAll('.char-tab').forEach(tab => {
        const cat = tab.dataset.category;
        let isAllowed = false;
        if (!mailboxCategory) {
          isAllowed = true;
        } else if (mailboxCategory === 'xiejian') {
          isAllowed = cat === 'xiejian';
        } else if (mailboxCategory === 'hanmen') {
          isAllowed = (cat === 'hanmen');
        }
        tab.hidden = !isAllowed;
        tab.style.display = isAllowed ? '' : 'none';
        if (isAllowed) {
          tab.classList.toggle('active', cat === activeCategory);
        } else {
          tab.classList.remove('active');
        }
      });

      this._syncMapSelect();

      // 单人模式：始终隐藏搭档和双人区域
      const partnerSection = document.querySelector('#guest-character-section .partner-section');
      const duetSection = document.getElementById('duet-section');
      if (partnerSection) partnerSection.style.setProperty('display', 'none', 'important');
      if (duetSection) duetSection.style.setProperty('display', 'none', 'important');
      window.gameMapRenderer.setPartner(null);
      if (window.gameMapRenderer.duetMode) {
        window.gameMapRenderer.toggleDuetMode();
      }

      const xiejianSingleActions = new Set(['personality', 'etiquette', 'martial', 'signature', 'run']);
      document.querySelectorAll('.action-btn').forEach(button => {
        const isAllowed = !isXiejianMailbox || xiejianSingleActions.has(button.dataset.action);
        button.hidden = !isAllowed;
        if (isAllowed) {
          button.style.removeProperty('display');
        } else {
          button.style.setProperty('display', 'none', 'important');
        }
      });

      if (this._renderMapCharacterGrid) {
        this._renderMapCharacterGrid(activeCategory);
      }
      if (this._renderMapPartnerSelector) {
        this._renderMapPartnerSelector();
      }
    };

    const currentUser = AuthManager.getCurrentUser();
    const isSharedMailbox = currentMailbox && 
      currentMailbox.isShared && 
      currentMailbox.members && 
      currentMailbox.members.length > 1;
    const isLoggedIn = !!currentUser;

    if (!window.gameMapRenderer) {
      import('./gameMapRenderer.js?v=20260803f').then(module => {
        window.gameMapRenderer = new module.GameMapRenderer(mapContainer);
        window.gameMapRenderer.init();

        // 单人模式：不再设置搭档，始终单人
        const boundCharacterId = STORAGE.loadCharacterBinding(this.currentMailboxId);
        const serverCharacterId = MultiplayerSync.accountProfile?.xiejianCharacterId || MailService.profile?.xiejianCharacterId;
        const defaultCharacterId = isXiejianMailbox && isLoggedIn
          ? (serverCharacterId || 'zhou-ran')
          : (boundCharacterId || 'xiu-jing');
        window.gameMapRenderer.loadCharacter(defaultCharacterId);
        window.gameMapRenderer.setPartner(null);
        
        window.gameMapRenderer.setMapBackground(mapBg);

        // 进入地图时加载本地背包数据
        const savedInventory = !AuthManager.getCurrentUser() ? STORAGE.loadInventory(this.currentMailboxId) : null;
        if (savedInventory && typeof MultiplayerSync !== 'undefined' && !MultiplayerSync.inventory) {
          MultiplayerSync.inventory = savedInventory;
        }

        // 单人模式：不再初始化多人游戏
        if (isXiejianMailbox && !isLoggedIn) {
          this._initGuestXiejianSystems();
        } else if (currentUser && (currentUser.role === 'xiu-jing' || currentUser.role === 'xuan-xuan')) {
          setTimeout(() => {
            this._syncMapCharacter(currentUser.role);
          }, 200);
        }

        const renderCharacterGrid = (category) => {
          const grid = document.getElementById('character-grid');
          const characters = window.gameMapRenderer.getCharactersForCategory(category);
          grid.innerHTML = '';
          characters.forEach(char => {
            const btn = document.createElement('button');
            btn.className = 'character-card';
            btn.dataset.char = char.id;
            if (char.id === window.gameMapRenderer.selectedCharacter) {
              btn.classList.add('active');
            }
            let subtitle = char.sect || '';
            const avatarContent = category === 'xiejian'
              ? `<img src="sendbox/fill/jingyuan-chibi20-delivery-20260719/${char.dir}/frames/personality/00.png" alt="${char.name}" draggable="false">`
              : char.name.charAt(0);
            btn.innerHTML = `
              <div class="char-avatar" data-char-id="${char.id}">${avatarContent}</div>
              <div class="char-info">
                <span class="char-name">${char.name}</span>
                ${subtitle ? `<span class="char-subtitle">${subtitle}</span>` : ''}
              </div>
            `;
            const boundCharId = STORAGE.loadCharacterBinding(this.currentMailboxId);
            if (char.id === boundCharId) {
              btn.classList.add('bound');
              btn.title = '已绑定此角色';
            }
            btn.addEventListener('click', () => {
              document.querySelectorAll('.character-card').forEach(b => {
                b.classList.remove('active');
                b.classList.remove('bound');
              });
              btn.classList.add('active');
              btn.classList.add('bound');
              btn.title = '已绑定此角色';
              window.gameMapRenderer.setCharacter(char.id);
              STORAGE.saveCharacterBinding(this.currentMailboxId, char.id);
              // 立即更新当前角色信息显示
              this._updateCurrentCharacterInfo();
              // 同步更新背包头像
              this._syncInventoryPortrait(char.id);
            });
            grid.appendChild(btn);
          });
        };
        this._renderMapCharacterGrid = renderCharacterGrid;

        document.querySelectorAll('.char-tab').forEach(tab => {
          tab.addEventListener('click', () => {
            document.querySelectorAll('.char-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            window.gameMapRenderer.setCategory(tab.dataset.category);
            renderCharacterGrid(tab.dataset.category);
          });
        });

        const defaultCategory = mailboxCategory || 'hanmen';
        renderCharacterGrid(defaultCategory);
        document.querySelectorAll('.char-tab').forEach(t => {
          t.classList.remove('active');
          if (t.dataset.category === defaultCategory) t.classList.add('active');
        });

        setTimeout(() => {
          if (this._isXiejianMailbox()) return;
          // currentMapIndex 是标准地图索引（0-5，对应 this.maps），不是 getMaps() 合并数组索引
          // getMaps() 合并数组有 10 个挟剑子地图前置，因此索引偏移，用 renderer.maps 才能读到正确名
          const stdMaps = window.gameMapRenderer.maps || [];
          const curIdx = window.gameMapRenderer.currentMapIndex;
          const mapNameEl = document.getElementById('map-name');
          if (mapNameEl && stdMaps[curIdx]) {
            mapNameEl.textContent = stdMaps[curIdx].name;
          }
        }, 200);

        const renderPartnerSelector = () => {
          // 单人模式：不再渲染搭档选择器
          const partnerSelect = document.getElementById('partner-select');
          if (partnerSelect) partnerSelect.innerHTML = '';
          return;
        };
        this._renderMapPartnerSelector = renderPartnerSelector;

        renderPartnerSelector();
        applyMailboxGameScope();

        document.querySelectorAll('.character-card').forEach(card => {
          card.addEventListener('click', () => {
            setTimeout(() => {
              renderPartnerSelector();
            }, 100);
          });
        });

        let partnerCharForDuet = null;
        const originalSetPartner = window.gameMapRenderer.setPartner.bind(window.gameMapRenderer);
        window.gameMapRenderer.setPartner = (charId) => {
          originalSetPartner(charId);
          if (charId && charId !== 'none') {
            partnerCharForDuet = charId;
          }
        };

        const duetSection = document.getElementById('duet-section');
        const duetToggleBtn = document.getElementById('duet-toggle-btn');
        
        document.querySelectorAll('.partner-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const partnerId = btn.dataset.partner;
            if (partnerId !== 'none') {
              setTimeout(() => {
                if (duetSection) {
                  duetSection.style.display = 'block';
                }
              }, 200);
            } else {
              if (duetSection) {
                duetSection.style.display = 'none';
              }
              if (window.gameMapRenderer.duetMode) {
                window.gameMapRenderer.toggleDuetMode();
              }
            }
          });
        });

        document.querySelectorAll('.duet-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            document.querySelectorAll('.duet-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const duetIndex = parseInt(btn.dataset.duet);
            if (!window.gameMapRenderer.duetMode) {
              window.gameMapRenderer.toggleDuetMode();
            }
            window.gameMapRenderer.setDuetAction(duetIndex);
          });
        });

        if (duetToggleBtn) {
          duetToggleBtn.addEventListener('click', () => {
            window.gameMapRenderer.toggleDuetMode();
            duetToggleBtn.textContent = window.gameMapRenderer.duetMode ? '退出双人模式' : '进入双人模式';
          });
        }

        if (!isXiejianMailbox && (!isSharedMailbox || !isLoggedIn)) {
          setTimeout(() => {
            if (duetSection) {
              duetSection.style.display = 'block';
            }
            window.gameMapRenderer.toggleDuetMode();
            if (duetToggleBtn) {
              duetToggleBtn.textContent = '退出双人模式';
            }
          }, 1000);
        }

        // 根据登录状态和信箱类型切换UI：只要有角色绑定就显示当前角色信息
        const currentCharSection = document.getElementById('current-character-section');
        const guestCharSection = document.getElementById('guest-character-section');
        const onlinePlayersPanel = document.getElementById('online-players-panel');
        const partnerSection = document.querySelector('.partner-section');

        const hasBoundCharacter = !!STORAGE.loadCharacterBinding(this.currentMailboxId);
        const showCurrentCharInfo = isXiejianMailbox
          ? Boolean(hasBoundCharacter || this._xiejianCharacterId)
          : Boolean(isLoggedIn || hasBoundCharacter);

        if (currentCharSection) {
          currentCharSection.style.display = showCurrentCharInfo ? 'block' : 'none';
        }
        if (guestCharSection) {
          guestCharSection.style.display = showCurrentCharInfo ? 'none' : 'block';
        }
        if (onlinePlayersPanel) {
          onlinePlayersPanel.style.display = (isLoggedIn && isSharedMailbox) ? 'block' : 'none';
        }
        if (partnerSection) {
          partnerSection.style.display = 'none';
        }
        if (duetSection) {
          duetSection.style.display = 'none';
        }

        if (showCurrentCharInfo) {
          this._updateCurrentCharacterInfo();
        }

        // 添加切换角色按钮点击事件
        const switchCharBtn = document.getElementById('switch-char-btn');
        if (switchCharBtn) {
          switchCharBtn.hidden = isXiejianMailbox;
          switchCharBtn.addEventListener('click', () => {
            if (isXiejianMailbox) return;
            if (currentCharSection) currentCharSection.style.display = 'none';
            if (guestCharSection) guestCharSection.style.display = 'block';
          });
        }

        // 单人动作按钮事件
        document.querySelectorAll('.action-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const action = btn.dataset.action;
            window.gameMapRenderer.playAction(action);
          });
        });

        const charToggleBtn = document.getElementById('char-toggle-btn');
        const charSelector = document.getElementById('character-selector');
        if (charToggleBtn && charSelector && !charToggleBtn.dataset.bound) {
          charToggleBtn.dataset.bound = 'true';
          charToggleBtn.setAttribute('aria-expanded', charSelector.classList.contains('open') ? 'true' : 'false');
          charToggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const expanded = charSelector.classList.toggle('open');
            charToggleBtn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
          });
        }

        // 移动端动作按钮开关
        const mobileActionsToggle = document.getElementById('mobile-actions-toggle');
        const mobileActions = document.getElementById('mobile-actions');
        if (mobileActionsToggle && mobileActions && !mobileActionsToggle.dataset.bound) {
          mobileActionsToggle.dataset.bound = 'true';
          mobileActionsToggle.setAttribute('aria-expanded', mobileActions.classList.contains('open') ? 'true' : 'false');
          mobileActionsToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            const expanded = mobileActions.classList.toggle('open');
            mobileActionsToggle.classList.toggle('active', expanded);
            mobileActionsToggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
          });
        }

        this._bindMultiplayerSettings();

        const setupJoystick = () => {
          const joystick = document.getElementById('joystick');
          const handle = document.getElementById('joystick-handle');
          if (!joystick || !handle) return;

          let isDragging = false;
          let startX = 0, startY = 0;
          const maxRadius = 35;

          const updateMovement = (dx, dy) => {
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > maxRadius) {
              dx = (dx / dist) * maxRadius;
              dy = (dy / dist) * maxRadius;
            }
            handle.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
            
            if (window.gameMapRenderer) {
              const normX = dx / maxRadius;
              const normY = dy / maxRadius;
              window.gameMapRenderer.setJoystickInput(normX, normY);
            }
          };

          const resetJoystick = () => {
            isDragging = false;
            handle.style.transform = 'translate(-50%, -50%)';
            if (window.gameMapRenderer) {
              window.gameMapRenderer.setJoystickInput(0, 0);
            }
          };

          joystick.addEventListener('touchstart', (e) => {
            e.preventDefault();
            isDragging = true;
            const touch = e.touches[0];
            const rect = joystick.getBoundingClientRect();
            startX = rect.left + rect.width / 2;
            startY = rect.top + rect.height / 2;
            updateMovement(touch.clientX - startX, touch.clientY - startY);
          }, { passive: false });

          joystick.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (!isDragging) return;
            const touch = e.touches[0];
            updateMovement(touch.clientX - startX, touch.clientY - startY);
          }, { passive: false });

          joystick.addEventListener('touchend', (e) => {
            e.preventDefault();
            resetJoystick();
          }, { passive: false });

          joystick.addEventListener('mousedown', (e) => {
            isDragging = true;
            const rect = joystick.getBoundingClientRect();
            startX = rect.left + rect.width / 2;
            startY = rect.top + rect.height / 2;
            updateMovement(e.clientX - startX, e.clientY - startY);
          });

          document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            updateMovement(e.clientX - startX, e.clientY - startY);
          });

          document.addEventListener('mouseup', () => {
            if (isDragging) resetJoystick();
          });
        };

        setupJoystick();

        document.querySelectorAll('.action-btn').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.preventDefault();
            const action = btn.dataset.action;
            if (window.gameMapRenderer && action) {
              window.gameMapRenderer.playAction(action);
            }
          });
          btn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const action = btn.dataset.action;
            if (window.gameMapRenderer && action) {
              window.gameMapRenderer.playAction(action);
            }
          }, { passive: false });
        });

        if (window.gameMapRenderer.canvas.width === 0 || window.gameMapRenderer.canvas.height === 0) {
          setTimeout(() => {
            window.gameMapRenderer.resize();
          }, 50);
        }

        // 首次创建渲染器也必须立即连接账号房间并加载服务器地图物品。
        if (isXiejianMailbox && currentUser) {
          this._initMultiplayer(this.currentMailboxId);
          if (typeof MailService.getWorldItems === 'function') {
            const currentMapKey = window.gameMapRenderer.currentMapBgKey || mapBg || 'xj-jingyuan';
            MailService.getWorldItems(currentMapKey).then(items => {
              if (window.gameMapRenderer.currentMapBgKey !== currentMapKey) return;
              MultiplayerSync.worldItems = items;
              window.gameMapRenderer.setWorldItems(items);
              this._updateXiejianWorldItemStatus(items);
            }).catch(error => console.warn('[WorldItems] 首次加载地图物品失败:', error));
          }
        } else if (isSharedMailbox && isLoggedIn) {
          this._initMultiplayer(this.currentMailboxId);
        }
      });
    } else {
      // 防御性修复：切信箱/切视图时 mailbox-view 可能被重新渲染，
      // 导致 canvas 仍挂在「已从 DOM 删除的旧 #mailbox-map-view 节点」上，
      // 新的当前 mapContainer 为空 → 地图渲染了但用户看不到。
      // 故重新挂载 canvas + 更新 renderer.container 引用以保证 resize 能读到正确尺寸。
      if (window.gameMapRenderer && window.gameMapRenderer.canvas) {
        if (!mapContainer.contains(window.gameMapRenderer.canvas)) {
          mapContainer.appendChild(window.gameMapRenderer.canvas);
        }
        if (window.gameMapRenderer.container !== mapContainer) {
          window.gameMapRenderer.container = mapContainer;
        }
      }
      if (window.gameMapRenderer.canvas.width === 0 || window.gameMapRenderer.canvas.height === 0) {
        setTimeout(() => {
          window.gameMapRenderer.resize();
        }, 50);
      }

      // === 关键修复：每次进入地图模式都重新加载 tile map，确保和当前信箱类型一致 ===
      // 挟剑信箱：加载 index 5（寒门 tile map 作为占位，实际显示的是 setMapBackground 的背景图）
      // 这样即使背景图加载失败，tile map 也不会是错误的「村庄」
      const targetTileIdx = isXiejianMailbox ? 5 : (isHanmenMailbox ? 5 : 0);
      window.gameMapRenderer.loadMap(targetTileIdx);

      window.gameMapRenderer.setMapBackground(mapBg);
      // 修复：切信箱/回到地图模式后地图名不更新（挟剑还显示寒门）
      {
        const _mapNameEl = document.getElementById('map-name');
        if (_mapNameEl) {
          if (isXiejianMailbox) {
            _mapNameEl.textContent = mapBg === 'xj-sanshi' ? '挟剑·三世' : mapBg === 'xj-huajian' ? '挟剑·花间' : mapBg === 'xj-jiangcheng' ? '挟剑·江城' : '挟剑·静远书院';
          } else if (isHanmenMailbox) {
            _mapNameEl.textContent = '寒门';
          }
        }
      }
      this._destroyMultiplayer();

      setTimeout(() => {
        const currentUser = AuthManager.getCurrentUser();
        if (isXiejianMailbox) {
          window.gameMapRenderer.setPartner(null);
          document.querySelectorAll('.char-tab').forEach(t => {
            t.classList.remove('active');
            if (t.dataset.category === 'xiejian') t.classList.add('active');
          });
          if (currentUser) {
            this._initMultiplayer(this.currentMailboxId);
          }
          // 初始化聊天系统
          this._bindChatInput();
          if (currentUser) {
            this._loadChatHistory();
            this._updateMultiplayerUI(true);
          }
          if (currentUser && typeof MailService.getWorldItems === 'function') {
            const currentMapKey = window.gameMapRenderer.currentMapBgKey || mapBg || 'xj-jingyuan';
            MailService.getWorldItems(currentMapKey).then(items => {
              if (window.gameMapRenderer.currentMapBgKey !== currentMapKey) return;
              MultiplayerSync.worldItems = items;
              window.gameMapRenderer.setWorldItems(items);
              this._updateXiejianWorldItemStatus(items);
            }).catch(error => console.warn('[WorldItems] 初始化地图物品失败:', error));
          }
        } else if (isSharedMailbox && isLoggedIn) {
          const characterId = currentUser.role || 'xiu-jing';
          window.gameMapRenderer.loadCharacter(characterId);
          this._initMultiplayer(this.currentMailboxId);
          this._bindChatInput();
          this._loadChatHistory();
          this._updateMultiplayerUI(true);
        } else if (currentUser && (currentUser.role === 'xiu-jing' || currentUser.role === 'xuan-xuan')) {
          this._syncMapCharacter(currentUser.role);
          this._bindChatInput();
          this._updateMultiplayerUI(false);
        } else {
          // 按名称查找寒门地图，避免 GameSystems.bootstrap 重排 maps 数组后索引偏移
          const hmIdx = window.gameMapRenderer.getMapIndexByName
            ? window.gameMapRenderer.getMapIndexByName('寒门', 5)
            : 5;
          window.gameMapRenderer.loadMap(hmIdx);
          window.gameMapRenderer.loadCharacter('xiu-jing');
          window.gameMapRenderer.setPartner('xuan-xuan');
          // hmIdx 是标准 maps 数组索引（this.maps，6元素），不是 getMaps() 合并数组索引
          // getMaps() 合并数组有 10 个挟剑子地图前置，索引错位，读名要用 renderer.maps
          const stdMaps = window.gameMapRenderer.maps || [];
          const mapNameEl = document.getElementById('map-name');
          if (mapNameEl && stdMaps[hmIdx]) {
            mapNameEl.textContent = stdMaps[hmIdx].name;
          }
          this._bindChatInput();
          this._updateMultiplayerUI(false);
        }
        applyMailboxGameScope();
      }, 100);
    }
  },

  // 发送信件到对方信箱
  _sendLetterToPartner() {
    const currentUser = AuthManager.getCurrentUser();
    if (!currentUser) {
      alert('请先登录账号');
      return;
    }

    const mailboxId = this.currentMailboxId;
    if (!mailboxId) {
      alert('请先选择一个信箱');
      return;
    }

    const isShared = MailboxManager.isSharedMailbox(mailboxId);
    if (!isShared) {
      alert('只有共享信箱才能发送信件');
      return;
    }

    // 获取发送者和接收者信息
    const senderRole = currentUser.role;
    let senderName = currentUser.displayName || currentUser.username || '我';
    let recipientName = '';

    if (senderRole === 'xiu-jing') {
      recipientName = '萱宣';
    } else if (senderRole === 'xuan-xuan') {
      recipientName = '修璟';
    } else {
      recipientName = '对方';
    }

    // 创建新信件（共享信箱格式）
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    const newLetter = {
      id: 'letter-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
      mailboxId: mailboxId,
      letterTitle: '无标题信件',
      recipient: recipientName,
      sender: senderName,
      date: now.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }),
      time: `${hours}:${minutes}`,
      author: {
        userId: typeof MailService !== 'undefined'
          ? MailService.getAccountKey(currentUser)
          : String(currentUser.username || '').trim().toLocaleLowerCase('en-US'),
        username: currentUser.username,
        displayName: currentUser.displayName,
        role: currentUser.role
      },
      content: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      status: 'sent',
      paperStyle: 'vintage-literary'
    };

    // 保存到共享信箱
    const letters = STORAGE.loadSharedLetters(mailboxId);
    letters.push(newLetter);
    STORAGE.saveSharedLetters(mailboxId, letters);

    // 刷新信箱视图
    this.renderMailboxView(mailboxId);

    alert(`信件已发送给 ${recipientName}！`);
  },

};

document.addEventListener('DOMContentLoaded', () => App.init());
