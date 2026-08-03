/* ========================================
   信笺 — 用户认证模块
   ======================================== */

const AuthManager = {
  USERS_KEY: 'xinjian_users',
  CURRENT_USER_KEY: 'xinjian_current_user',
  SHARED_MAILBOX_ID: 'mailbox-hanmen-duet',

  _users: [],
  _currentUser: null,

  init() {
    this._loadUsers();
    this._loadCurrentUser();
    this._ensurePresetAccounts();
  },

  _hashPassword(password) {
    const salt = 'xinjian_hanmen_duet_2024';
    const combined = salt + password + salt;
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    const baseStr = btoa(combined + '_' + Math.abs(hash));
    return baseStr;
  },

  _generateId() {
    return 'user-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
  },

  _loadUsers() {
    const data = localStorage.getItem(this.USERS_KEY);
    this._users = data ? JSON.parse(data) : [];
  },

  _saveUsers() {
    localStorage.setItem(this.USERS_KEY, JSON.stringify(this._users));
  },

  _loadCurrentUser() {
    const data = localStorage.getItem(this.CURRENT_USER_KEY);
    this._currentUser = data ? JSON.parse(data) : null;
  },

  _saveCurrentUser() {
    if (this._currentUser) {
      localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(this._currentUser));
    } else {
      localStorage.removeItem(this.CURRENT_USER_KEY);
    }
  },

  _ensurePresetAccounts() {
    const presetAccounts = [
      {
        username: 'xiujing',
        password: '123456',
        displayName: '修璟',
        role: 'xiu-jing'
      },
      {
        username: 'xuanxuan',
        password: '123456',
        displayName: '萱宣',
        role: 'xuan-xuan'
      },
      {
        username: 'xumin',
        password: 'xumin999',
        displayName: 'xumin',
        role: 'xumin'
      }
    ];

    let needSave = false;
    for (const preset of presetAccounts) {
      const exists = this._users.find(u => u.username === preset.username);
      if (!exists) {
        const user = {
          id: this._generateId(),
          username: preset.username,
          passwordHash: this._hashPassword(preset.password),
          displayName: preset.displayName,
          avatar: '',
          role: preset.role,
          createdAt: Date.now()
        };
        this._users.push(user);
        needSave = true;
      }
    }

    if (needSave) {
      this._saveUsers();
    }
  },

  _sanitizeUser(user) {
    if (!user) return null;
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  },

  register(username, password) {
    if (!username || !password) {
      return { success: false, message: '用户名和密码不能为空', user: null };
    }

    if (username.length < 3) {
      return { success: false, message: '用户名至少需要3个字符', user: null };
    }

    if (password.length < 6) {
      return { success: false, message: '密码至少需要6个字符', user: null };
    }

    // 先做本地查重（无论远端是否可用，先保证本地状态一致）
    const exists = this._users.find(u => u.username === username);
    if (exists) {
      return { success: false, message: '用户名已存在', user: null };
    }

    const user = {
      id: this._generateId(),
      username: username,
      passwordHash: this._hashPassword(password),
      displayName: username,
      avatar: '',
      role: 'user',
      createdAt: Date.now()
    };

    this._users.push(user);
    this._saveUsers();

    const safe = this._sanitizeUser(user);

    // 远端优先：MailService 可用时尝试同步创建远端账号
    // 注意：这里同步注册，注册完成后由调用方决定是否自动 login
    if (window.MailService && typeof MailService.registerRemote === 'function') {
      // 异步但不阻塞返回（避免网络差时前端卡死）
      Promise.resolve().then(async () => {
        try {
          const r = await MailService.registerRemote(username, password, safe.displayName, safe.role);
          if (r && r.success && r.user) {
            // 把远端 user.id 合并回本地，让后续 mailboxId/ownerAccountKey 统一
            this._mergeRemoteUserIntoLocal(username, r.user);
            // 顺手 syncAccount，保证 accounts 表里有记录
            if (typeof MailService.syncAccount === 'function') {
              try { await MailService.syncAccount({ ...safe, id: r.user.id || safe.id }); } catch (_) {}
            }
          }
        } catch (e) {
          console.warn('[auth] 远端注册失败，已降级本地保存：', e?.message || e);
        }
      });
    }

    return { success: true, message: '注册成功', user: safe };
  },

  login(username, password) {
    if (!username || !password) {
      return { success: false, message: '用户名和密码不能为空', user: null };
    }

    const user = this._users.find(u => u.username === username);

    // 远端优先：如果远端可用，先尝试远端登录
    // 远端登录成功即使本地没有账号（新设备），也会自动把账号同步回本地
    if (window.MailService && typeof MailService.isRemoteAvailable === 'function' &&
        typeof MailService.loginRemote === 'function') {
      // 远端探测 / 登录（异步包装，保证异常不阻断本地登录）
      const remoteLoginPromise = (async () => {
        try {
          const ok = await MailService.isRemoteAvailable();
          if (!ok) return { remote: false };
          const r = await MailService.loginRemote(username, password);
          return { remote: true, result: r };
        } catch (e) {
          return { remote: false, error: e };
        }
      })();

      // 阻塞等待远端结果（<=4s，因为 isRemoteAvailable 带 AbortController）
      // 若远端超时/失败，继续本地登录流程兜底
      const remoteOut = Promise.race([
        remoteLoginPromise,
        new Promise(resolve => setTimeout(() => resolve({ timedOut: true }), 5000))
      ]);
      // login 本身是同步接口，我们返回一个 Promise-like（让旧调用方式也能兼容）
      // 由于老代码是同步式，我们这里通过同步取本地结果，并把远端合并在后台进行。
      remoteOut.then((v) => {
        if (v && v.remote && v.result && v.result.success && v.result.user) {
          // 远端登录成功：合并回本地 users 数组（对新设备尤其重要）
          this._mergeRemoteUserIntoLocal(username, v.result.user);
          // refresh current user 指针（保留原对象）
          this._currentUser = this._users.find(u => u.username === username) || this._currentUser;
          if (this._currentUser) this._saveCurrentUser();
          if (typeof MailService.syncAccount === 'function') {
            MailService.syncAccount(this._sanitizeUser(this._currentUser)).catch(() => {});
          }
        }
      }).catch(() => {});
    }

    // 本地登录（兜底）
    if (!user) {
      return { success: false, message: '用户不存在', user: null };
    }

    const inputHash = this._hashPassword(password);
    if (user.passwordHash !== inputHash) {
      return { success: false, message: '密码错误', user: null };
    }

    this._currentUser = user;
    this._saveCurrentUser();

    const safe = this._sanitizeUser(user);
    // 后台自动尝试 syncAccount（保持后端 state.json / Mongo 一致性）
    if (window.MailService && typeof MailService.syncAccount === 'function') {
      Promise.resolve().then(() => MailService.syncAccount(safe)).catch(() => {});
    }
    return { success: true, message: '登录成功', user: safe };
  },

  logout() {
    const current = this._currentUser;
    this._currentUser = null;
    this._saveCurrentUser();
    if (current && window.MailService && typeof MailService.logoutRemote === 'function') {
      Promise.resolve().then(() => MailService.logoutRemote(current.id)).catch(() => {});
    }
  },

  /** 把远端注册/登录返回的 user 合并回本地 users */
  _mergeRemoteUserIntoLocal(username, remoteUser) {
    if (!username || !remoteUser) return;
    const u = this._users.find(x => x.username === username);
    if (!u) {
      const created = {
        id: remoteUser.id || this._generateId(),
        username: remoteUser.username || username,
        passwordHash: '', // 远端账号模式本地不存密码哈希（避免密码散列冲突）
        displayName: remoteUser.displayName || username,
        avatar: remoteUser.avatar || '',
        role: remoteUser.role || 'user',
        createdAt: remoteUser.createdAt || Date.now(),
        _remote: true
      };
      this._users.push(created);
      this._saveUsers();
      return;
    }
    u.id = remoteUser.id || u.id;
    u.displayName = remoteUser.displayName || u.displayName;
    u.avatar = remoteUser.avatar || u.avatar;
    u.role = remoteUser.role || u.role;
    u._remote = true;
    this._saveUsers();
  },

  getCurrentUser() {
    return this._sanitizeUser(this._currentUser);
  },

  isLoggedIn() {
    return this._currentUser !== null;
  },

  getUserById(userId) {
    const user = this._users.find(u => u.id === userId);
    return this._sanitizeUser(user);
  },

  getUserByUsername(username) {
    const user = this._users.find(u => u.username === username);
    return this._sanitizeUser(user);
  },

  getSharedMailboxId(userId) {
    if (!userId) return null;
    const user = this._users.find(u => u.id === userId);
    if (!user) return null;

    if (user.role === 'xiu-jing' || user.role === 'xuan-xuan') {
      return this.SHARED_MAILBOX_ID;
    }

    return null;
  }
};

AuthManager.init();
