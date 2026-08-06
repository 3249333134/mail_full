/* Server-backed account identity and mail delivery. */
window.MailService = MailService = {
  _cache: new Map(),
  profile: null,
  account: null,
  _remoteEnabled: null,      // null=未探测, true=云端可用, false=降级本地
  _remoteEnabledAt: 0,       // 最近探测时间戳
  REMOTE_PROBE_TTL_MS: 60 * 1000, // health 探测 60 秒缓存
  // 全局角色名映射（所有信箱的角色）
  CHARACTER_NAMES: {
    'zhou-ran': '周然',
    'he-qingfeng': '贺清风',
    'ren-chaoye': '任朝野',
    'shen-chiyi': '沈池懿',
    'qi-pingchuan': '戚凭川',
    'jiang-huaian': '江淮安',
    'tang-wanchu': '唐挽初',
    'xiu-jing': '修璟',
    'xuan-xuan': '萱宣',
  },
  // 兼容旧属性
  get XIEJIAN_NAMES() { return this.CHARACTER_NAMES; },

  getBaseUrl() {
    // 允许通过 window.MAIL_API_BASE_URL 覆盖，也支持 ?apiBase=... 查询参数
    try {
      const fromQs = new URL(window.location.href).searchParams.get('apiBase');
      if (fromQs) return fromQs.replace(/\/$/, '');
    } catch (_) {}
    if (typeof window.MAIL_API_BASE_URL === 'string' && window.MAIL_API_BASE_URL) {
      return window.MAIL_API_BASE_URL.replace(/\/$/, '');
    }
    const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
    return `${protocol}//${window.location.hostname}:3000`;
  },

  getAccountKey(user = AuthManager.getCurrentUser()) {
    return String(user?.username || user?.id || '').trim().toLocaleLowerCase('en-US');
  },

  async _request(path, options = {}) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 10000);
    try {
      const response = await fetch(`${this.getBaseUrl()}${path}`, {
        ...options,
        signal: options.signal || ctrl.signal,
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {})
        }
      });
      let data = {};
      try {
        data = await response.json();
      } catch (_) {}
      if (!response.ok) {
        const error = new Error(data.error || `http_${response.status}`);
        error.code = data.error || `http_${response.status}`;
        throw error;
      }
      return data;
    } catch (e) {
      if (e.name === 'AbortError') {
        const error = new Error('timeout');
        error.code = 'timeout';
        throw error;
      }
      throw e;
    } finally {
      clearTimeout(t);
    }
  },

  async syncAccount(user = AuthManager.getCurrentUser()) {
    if (!user) return null;
    const data = await this._request('/api/accounts/sync', {
      method: 'POST',
      body: JSON.stringify({
        accountKey: this.getAccountKey(user),
        username: user.username,
        displayName: user.displayName || user.username,
        role: user.role || 'user'
      })
    });
    this.profile = data.profile || null;
    this.account = data.account || null;
    return data;
  },

  getIdentityName(mailboxId, user = AuthManager.getCurrentUser()) {
    const accountKey = this.getAccountKey(user);
    
    // 1. 优先从 mailbox 的 memberCharacters 获取角色
    if (mailboxId) {
      try {
        const mailboxes = JSON.parse(localStorage.getItem('xinjian_mailboxes') || '[]');
        const mailbox = mailboxes.find(mb => mb.id === mailboxId);
        if (mailbox?.memberCharacters && mailbox.memberCharacters[accountKey]) {
          const raw = mailbox.memberCharacters[accountKey];
          const characterId = typeof raw === 'string' ? raw : (raw.characterId || raw.id || '');
          if (characterId && this.CHARACTER_NAMES[characterId]) {
            return this.CHARACTER_NAMES[characterId];
          }
        }
      } catch (_) {}
    }
    
    // 2. 没有指定信箱时，搜索所有信箱的 memberCharacters
    if (!mailboxId) {
      try {
        const mailboxes = JSON.parse(localStorage.getItem('xinjian_mailboxes') || '[]');
        for (const mb of mailboxes) {
          if (mb.memberCharacters && mb.memberCharacters[accountKey]) {
            const raw = mb.memberCharacters[accountKey];
            const characterId = typeof raw === 'string' ? raw : (raw.characterId || raw.id || '');
            if (characterId && this.CHARACTER_NAMES[characterId]) {
              return this.CHARACTER_NAMES[characterId];
            }
          }
        }
      } catch (_) {}
    }
    
    // 3. 从 localStorage 的用户角色绑定中查找
    try {
      const userBindings = JSON.parse(localStorage.getItem('xinjian_user_character_bindings') || '{}');
      if (mailboxId && userBindings[mailboxId]?.[accountKey]) {
        const charId = userBindings[mailboxId][accountKey];
        if (this.CHARACTER_NAMES[charId]) return this.CHARACTER_NAMES[charId];
      } else if (!mailboxId) {
        for (const [mbId, users] of Object.entries(userBindings)) {
          if (users[accountKey] && this.CHARACTER_NAMES[users[accountKey]]) {
            return this.CHARACTER_NAMES[users[accountKey]];
          }
        }
      }
    } catch (_) {}
    
    // 4. 从角色绑定中查找（当前信箱的绑定）
    try {
      const charBindings = JSON.parse(localStorage.getItem('xinjian_character_bindings') || '{}');
      if (charBindings[mailboxId] && this.CHARACTER_NAMES[charBindings[mailboxId]]) {
        return this.CHARACTER_NAMES[charBindings[mailboxId]];
      }
    } catch (_) {}
    
    // 5. 从当前用户 profile 获取
    if (this.profile?.xiejianCharacterId && this.CHARACTER_NAMES[this.profile.xiejianCharacterId]) {
      return this.CHARACTER_NAMES[this.profile.xiejianCharacterId];
    }
    if (user?.role && this.CHARACTER_NAMES[user.role]) {
      return this.CHARACTER_NAMES[user.role];
    }
    
    return user?.displayName || user?.username || '';
  },

  async getRecipients(mailboxId) {
    const accountKey = this.getAccountKey();
    if (!accountKey || !mailboxId) return [];
    const query = new URLSearchParams({ accountKey, mailboxId });
    const data = await this._request(`/api/mail/recipients?${query}`);
    return data.recipients || [];
  },

  async getMailbox(mailboxId) {
    const accountKey = this.getAccountKey();
    if (!accountKey || !mailboxId) return { letters: [], unreadCount: 0 };
    const query = new URLSearchParams({ accountKey, mailboxId });
    const data = await this._request(`/api/mail/letters?${query}`);
    this._cache.set(mailboxId, data);
    return data;
  },

  getCachedMailbox(mailboxId) {
    return this._cache.get(mailboxId) || { letters: [], unreadCount: 0 };
  },

  async getInventory() {
    const accountKey = this.getAccountKey();
    if (!accountKey) return { items: [], equipment: {}, quickSlots: [] };
    const query = new URLSearchParams({ accountKey });
    const data = await this._request(`/api/game/inventory?${query}`);
    return data.inventory || { items: [], equipment: {}, quickSlots: [] };
  },

  async getWorldItems(mapKey) {
    const accountKey = this.getAccountKey();
    console.log('[MailService] getWorldItems:', { mapKey, accountKey, baseUrl: this.getBaseUrl() });
    // 注意：服务端 world-items 接口现在已放宽，即使没有 accountKey 也能返回（world 道具是公共的）
    if (!mapKey) return [];
    const query = new URLSearchParams({ mapKey });
    if (accountKey) query.set('accountKey', accountKey);
    const data = await this._request(`/api/game/world-items?${query}`);
    console.log('[MailService] getWorldItems returned:', data?.items?.length, 'items');
    return Array.isArray(data.items) ? data.items : [];
  },

  async saveDraft(letter, recipientAccountKey = '') {
    const user = AuthManager.getCurrentUser();
    const accountKey = this.getAccountKey(user);
    const prepared = await this._prepareLetterMedia(letter);
    return this._request('/api/mail/draft', {
      method: 'POST',
      body: JSON.stringify({
        accountKey,
        account: {
          accountKey,
          username: user?.username,
          displayName: user?.displayName,
          role: user?.role
        },
        mailboxId: letter.mailboxId,
        recipientAccountKey,
        letter: prepared
      })
    });
  },

  async deleteDraft(letterId) {
    const accountKey = this.getAccountKey();
    return this._request(
      `/api/mail/draft/${encodeURIComponent(letterId)}?accountKey=${encodeURIComponent(accountKey)}`,
      { method: 'DELETE' }
    );
  },

  async sendLetter(letter, recipientAccountKey) {
    const accountKey = this.getAccountKey();
    const prepared = await this._prepareLetterMedia(letter);
    const clientMessageId = letter.clientMessageId ||
      `${accountKey}:${letter.id}:${letter.updatedAt || letter.createdAt || Date.now()}`;
    return this._request('/api/mail/send', {
      method: 'POST',
      body: JSON.stringify({
        accountKey,
        mailboxId: letter.mailboxId,
        recipientAccountKey,
        clientMessageId,
        letter: { ...prepared, clientMessageId }
      })
    });
  },

  async markRead(letterId) {
    return this._request(`/api/mail/read/${encodeURIComponent(letterId)}`, {
      method: 'POST',
      body: JSON.stringify({ accountKey: this.getAccountKey() })
    });
  },

  async _prepareLetterMedia(letter) {
    const cloned = JSON.parse(JSON.stringify(letter));
    const uploaded = new Map();
    const walk = async value => {
      if (!value || typeof value !== 'object') return;
      for (const [key, child] of Object.entries(value)) {
        if (key === 'src' && typeof child === 'string' && child.startsWith('blob:')) {
          if (!uploaded.has(child)) uploaded.set(child, this._uploadBlobUrl(child));
          value[key] = await uploaded.get(child);
        } else if (child && typeof child === 'object') {
          await walk(child);
        }
      }
    };
    await walk(cloned);
    return cloned;
  },

  async _uploadBlobUrl(blobUrl) {
    const blob = await fetch(blobUrl).then(response => response.blob());
    const base64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || '').split(',')[1] || '');
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    const id = `media-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const data = await this._request('/api/media', {
      method: 'POST',
      body: JSON.stringify({
        accountKey: this.getAccountKey(),
        id,
        mimeType: blob.type || 'application/octet-stream',
        base64
      })
    });
    return `${this.getBaseUrl()}${data.url}`;
  },

  // ---------- 远端可用性探测（/api/health） ----------
  async isRemoteAvailable(options = {}) {
    const force = !!options.force;
    const now = Date.now();
    if (!force && this._remoteEnabled !== null && (now - this._remoteEnabledAt) < this.REMOTE_PROBE_TTL_MS) {
      return !!this._remoteEnabled;
    }
    // 复用进行中的探测请求，避免并发重复探测
    if (this._probePromise) return this._probePromise;
    this._probePromise = this._doProbeRemote(force);
    try {
      return await this._probePromise;
    } finally {
      this._probePromise = null;
    }
  },

  async _doProbeRemote(force) {
    const now = Date.now();
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 4000);
      const r = await fetch(`${this.getBaseUrl()}/api/health`, { signal: ctrl.signal });
      clearTimeout(t);
      if (!r.ok) { this._remoteEnabled = false; this._remoteEnabledAt = now; return false; }
      const json = await r.json();
      this._remoteEnabled = !!json.ok;
      this._remoteEnabledAt = now;
      return !!this._remoteEnabled;
    } catch (e) {
      this._remoteEnabled = false;
      this._remoteEnabledAt = now;
      return false;
    }
  },

  // ---------- 认证：注册 / 登录 ----------
  async registerRemote(username, password, displayName, role = 'user') {
    return this._request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password, displayName: displayName || username, role })
    });
  },

  async loginRemote(username, password) {
    return this._request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
  },

  async logoutRemote(userId) {
    try {
      return await this._request('/api/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ userId: userId || AuthManager.getCurrentUser()?.id })
      });
    } catch (_) { return { success: true }; }
  },

  // ---------- 信箱 CRUD + 信箱号 ----------
  async listRemoteMailboxes(accountKey) {
    const ak = String(accountKey || this.getAccountKey() || '').trim();
    if (!ak) return [];
    const r = await this._request(`/api/mailboxes?accountKey=${encodeURIComponent(ak)}`);
    return Array.isArray(r.mailboxes) ? r.mailboxes : [];
  },

  async searchMailboxDirectory(query = '') {
    const r = await this._request(`/api/mailboxes/directory?q=${encodeURIComponent(String(query || '').trim())}`);
    return Array.isArray(r.mailboxes) ? r.mailboxes : [];
  },

  async createRemoteMailbox(payload) {
    return this._request('/api/mailboxes', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async getRemoteMailbox(mailboxId) {
    if (!mailboxId) return null;
    const r = await this._request(`/api/mailboxes/${encodeURIComponent(mailboxId)}`);
    return r.mailbox || null;
  },

  async lookupMailboxCode(code) {
    const c = String(code || '').replace(/[\s\-_·.•,，。、;；]/g, '').toUpperCase();
    if (!c) return null;
    try {
      const r = await this._request(`/api/mailbox_codes/lookup?code=${encodeURIComponent(c)}`);
      return (r && r.success) ? r : null;
    } catch (e) {
      return null;
    }
  },

  async joinMailboxByCode(code, accountKey) {
    const c = String(code || '').replace(/[\s\-_·.•,，。、;；]/g, '').toUpperCase();
    if (!c) return { success: false, message: 'code 为空' };
    return this._request('/api/mailbox_codes/join', {
      method: 'POST',
      body: JSON.stringify({ code: c, accountKey: accountKey || this.getAccountKey() })
    });
  },

  // ---------- 背包 / 手账（新增） ----------
  async saveRemoteInventory(inventory) {
    const accountKey = this.getAccountKey();
    if (!accountKey) return { success: false };
    return this._request('/api/inventories/save', {
      method: 'POST',
      body: JSON.stringify({ accountKey, inventory })
    });
  },

  async loadRemoteJournals(query = {}) {
    const accountKey = this.getAccountKey();
    if (!accountKey) return [];
    const qs = new URLSearchParams({ accountKey, ...query });
    const r = await this._request(`/api/journals?${qs.toString()}`);
    return Array.isArray(r.entries) ? r.entries : [];
  },

  async saveRemoteJournal(entry) {
    const accountKey = this.getAccountKey();
    if (!accountKey) return { success: false };
    return this._request('/api/journals/save', {
      method: 'POST',
      body: JSON.stringify({ accountKey, ...entry })
    });
  },

  // ---------- 信件通用 CRUD（云端优先） ----------
  /**
   * 单封信件 upsert 到云端（含完整 record 结构：id, mailboxId, letter, deliveryStatus, senderAccountKey, recipientAccountKey 等）
   */
  async upsertRemoteLetter(record) {
    if (!record || !record.id) return { success: false, message: 'record.id 必填' };
    const accountKey = this.getAccountKey();
    return this._request('/api/letters/upsert', {
      method: 'POST',
      body: JSON.stringify({ record, accountKey })
    });
  },

  /** 批量 upsert 信件到云端（登录后本地 → 云端迁移用） */
  async batchUpsertRemoteLetters(records) {
    if (!Array.isArray(records) || !records.length) return { success: true, results: [] };
    const accountKey = this.getAccountKey();
    return this._request('/api/letters/batch_upsert', {
      method: 'POST',
      body: JSON.stringify({ records, accountKey })
    });
  },

  /** 拉取指定 mailbox 的所有原始信件 record（含 letter 子对象，返回完整结构用于本地合并） */
  async listRemoteLetters(mailboxId) {
    if (!mailboxId) return [];
    const accountKey = this.getAccountKey();
    const qs = new URLSearchParams({ accountKey, mailboxId });
    const r = await this._request(`/api/letters/list?${qs.toString()}`);
    return Array.isArray(r.letters) ? r.letters : [];
  },

  async deleteRemoteLetter(id) {
    if (!id) return { success: false };
    const accountKey = this.getAccountKey();
    return this._request('/api/letters/delete', {
      method: 'POST',
      body: JSON.stringify({ id, accountKey })
    });
  },

  /** 主动刷新 MailService._cache（getCachedMailbox 使用的缓存） */
  async refreshMailboxCache(mailboxId) {
    if (!mailboxId) return null;
    try {
      const fresh = await this.getMailbox(mailboxId);
      this._cache.set(mailboxId, fresh);
      return fresh;
    } catch (_) { return null; }
  }
};
