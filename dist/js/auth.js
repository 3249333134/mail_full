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

    return { success: true, message: '注册成功', user: this._sanitizeUser(user) };
  },

  login(username, password) {
    if (!username || !password) {
      return { success: false, message: '用户名和密码不能为空', user: null };
    }

    const user = this._users.find(u => u.username === username);
    if (!user) {
      return { success: false, message: '用户不存在', user: null };
    }

    const inputHash = this._hashPassword(password);
    if (user.passwordHash !== inputHash) {
      return { success: false, message: '密码错误', user: null };
    }

    this._currentUser = user;
    this._saveCurrentUser();

    return { success: true, message: '登录成功', user: this._sanitizeUser(user) };
  },

  logout() {
    this._currentUser = null;
    this._saveCurrentUser();
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
