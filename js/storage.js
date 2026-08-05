/* ========================================
   信笺 — 存储层 (IndexedDB + localStorage)
   ======================================== */

const STORAGE = {
  DB_NAME: 'XinjianDB',
  DB_VERSION: 1,
  MEDIA_STORE: 'media',
  LETTERS_KEY: 'xinjian_letters',
  MAILBOXES_KEY: 'xinjian_mailboxes',
  JOURNALS_KEY: 'xinjian_journals',
  SHARED_MAILBOXES_KEY: 'xinjian_shared_mailboxes',
  SHARED_LETTERS_KEY_PREFIX: 'xinjian_shared_letters_',
  MAILBOX_CODES_INDEX_KEY: 'xinjian_mailbox_codes_index',

  // 远端优先 + 本地缓存
  _remoteMailboxCache: [],
  _remoteMailboxCacheAt: 0,
  REMOTE_MAILBOX_TTL_MS: 30 * 1000,

  db: null,

  async initDB() {
    if (this.db) return this.db;
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(this.MEDIA_STORE)) {
          const store = db.createObjectStore(this.MEDIA_STORE, { keyPath: 'id' });
          store.createIndex('type', 'type', { unique: false });
        }
      };
      request.onsuccess = (e) => {
        this.db = e.target.result;
        resolve(this.db);
      };
      request.onerror = (e) => reject(e.target.error);
    });
  },

  async saveMedia(id, type, blob) {
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.MEDIA_STORE, 'readwrite');
      const store = tx.objectStore(this.MEDIA_STORE);
      store.put({ id, type, data: blob, createdAt: Date.now() });
      tx.oncomplete = () => resolve(id);
      tx.onerror = (e) => reject(e.target.error);
    });
  },

  async getMedia(id) {
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.MEDIA_STORE, 'readonly');
      const store = tx.objectStore(this.MEDIA_STORE);
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result?.data || null);
      request.onerror = (e) => reject(e.target.error);
    });
  },

  async deleteMedia(id) {
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.MEDIA_STORE, 'readwrite');
      const store = tx.objectStore(this.MEDIA_STORE);
      store.delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = (e) => reject(e.target.error);
    });
  },

  async getAllMediaIds() {
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.MEDIA_STORE, 'readonly');
      const store = tx.objectStore(this.MEDIA_STORE);
      const request = store.getAllKeys();
      request.onsuccess = () => resolve(request.result);
      request.onerror = (e) => reject(e.target.error);
    });
  },

  // --- 信件 JSON 存储 (localStorage) ---
  saveLetters(letters) {
    localStorage.setItem(this.LETTERS_KEY, JSON.stringify(letters));
  },

  loadLetters() {
    const data = localStorage.getItem(this.LETTERS_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveMailboxes(mailboxes) {
    localStorage.setItem(this.MAILBOXES_KEY, JSON.stringify(mailboxes));
    // 同步私有信箱的 code 到全局索引（同时兼容 mailboxCode 与 code 两个字段名）
    for (const mb of mailboxes || []) {
      const code = mb.mailboxCode || mb.code;
      if (code) this.saveMailboxCodeIndex(code, mb.id);
    }
    // 若 MailService 可用 & 远端开启：把本地新增/更新的信箱尝试同步到远端
    if (Array.isArray(mailboxes) && window.MailService &&
        typeof MailService.isRemoteAvailable === 'function' &&
        typeof MailService.createRemoteMailbox === 'function' &&
        typeof MailService.getAccountKey === 'function') {
      (async () => {
        try {
          const ok = await MailService.isRemoteAvailable();
          if (!ok) return;
          const ak = MailService.getAccountKey();
          if (!ak) return;
          // 同步规则：
          // 1) 未同步过的信箱（_remoteSynced != true）→ 全量同步
          // 2) _memberDataDirty 的信箱 → 重新同步成员数据
          // 3) 共享信箱（用户是成员之一）→ 同步成员数据
          for (const mb of mailboxes) {
            if (!mb) continue;
            const isDirty = mb._memberDataDirty === true;
            const owner = String(mb.ownerAccountKey || mb.owner || mb.createdBy || '').toLowerCase();
            const isOwner = owner && owner === ak.toLowerCase();
            const isMember = Array.isArray(mb.members) && (mb.members.includes(ak) || mb.members.includes(ak.toLowerCase()));
            const isMemberByKey = Array.isArray(mb.memberAccountKeys) && (mb.memberAccountKeys.includes(ak) || mb.memberAccountKeys.includes(ak.toLowerCase()));
            
            // 跳过条件：已同步且不脏，且用户既不是 owner 也不是成员
            if (mb._remoteSynced && !isDirty) continue;
            if (!isOwner && !isMember && !isMemberByKey) continue;
            if (!mb.name) continue;
            try {
              // 如果本地已有 id 或 mailboxCode：后端会自动走 upsert（幂等），不会重复创建
              const hasId = !!mb.id;
              const hasCode = !!(mb.mailboxCode || mb.code);
              const payload = {
                name: mb.name,
                desc: mb.desc || mb.description || '',
                icon: mb.icon || '',
                themeColor: mb.themeColor || '',
                mapBackground: mb.mapBackground || mb.background || '',
                isCustom: mb.isCustom !== false,
                ownerAccountKey: ak,
                preferCode: mb.mailboxCode || mb.code || null,
                createdAt: mb.createdAt || Date.now(),
                updatedAt: mb.updatedAt || Date.now(),
                description: mb.description || mb.desc || '',
                background: mb.background || mb.mapBackground || '',
                owner: ak,
                // 关键：已有 id/code 时明确带上，让后端走 upsert 而非 create
                ...(hasId ? { id: mb.id } : {}),
                ...(hasCode ? { mailboxCode: mb.mailboxCode || mb.code } : {}),
                memberAccountKeys: Array.isArray(mb.memberAccountKeys)
                  ? mb.memberAccountKeys
                  : (Array.isArray(mb.members) ? mb.members : (ak ? [ak] : [])),
                members: Array.isArray(mb.members)
                  ? mb.members
                  : (Array.isArray(mb.memberAccountKeys) ? mb.memberAccountKeys : (ak ? [ak] : [])),
                memberCharacters: mb.memberCharacters || {},
                memberNames: mb.memberNames || {}
              };
              const r = await MailService.createRemoteMailbox(payload);
              if (r && r.success && r.mailbox) {
                mb._remoteSynced = true;
                mb._memberDataDirty = false;
                mb.id = r.mailbox.id || mb.id;
                if (r.mailbox.mailboxCode && !mb.mailboxCode) {
                  mb.mailboxCode = r.mailbox.mailboxCode;
                  mb.code = mb.mailboxCode;
                  this.saveMailboxCodeIndex(mb.mailboxCode, mb.id);
                } else if (r.mailbox.code && !mb.code) {
                  mb.code = r.mailbox.code;
                  mb.mailboxCode = mb.code;
                  this.saveMailboxCodeIndex(mb.code, mb.id);
                }
                // 后端 upsert 成功后如果返回的成员信息更全，合并回来
                if (Array.isArray(r.mailbox.memberAccountKeys) && r.mailbox.memberAccountKeys.length > 0) {
                  const mergedSet = new Set([
                    ...(Array.isArray(mb.memberAccountKeys) ? mb.memberAccountKeys : []),
                    ...(Array.isArray(mb.members) ? mb.members : []),
                    ...r.mailbox.memberAccountKeys
                  ]);
                  mb.memberAccountKeys = Array.from(mergedSet);
                  mb.members = mb.memberAccountKeys;
                }
                // 合并远端返回的 memberCharacters 和 memberNames
                if (r.mailbox.memberCharacters && typeof r.mailbox.memberCharacters === 'object') {
                  mb.memberCharacters = { ...(mb.memberCharacters || {}), ...r.mailbox.memberCharacters };
                }
                if (r.mailbox.memberNames && typeof r.mailbox.memberNames === 'object') {
                  mb.memberNames = { ...(mb.memberNames || {}), ...r.mailbox.memberNames };
                }
              }
            } catch (_) { /* 单条失败不影响其他 */ }
          }
          // 保存写回（可能增加了 mailboxCode / id / _remoteSynced）
          localStorage.setItem(this.MAILBOXES_KEY, JSON.stringify(mailboxes));
        } catch (_) {}
      })();
    }
  },

  loadMailboxes() {
    const data = localStorage.getItem(this.MAILBOXES_KEY);
    return data ? JSON.parse(data) : [];
  },

  /**
   * 异步版：远端优先 + 30s 本地缓存。
   * 返回 [{...mailbox}]，其中 _source = 'remote' | 'local'。
   */
  async loadMailboxesAsync(options = {}) {
    const force = !!options.force;
    const accountKey = options.accountKey ||
      (window.MailService && typeof MailService.getAccountKey === 'function'
        ? MailService.getAccountKey() : '');

    // 优先用缓存
    const now = Date.now();
    if (!force && this._remoteMailboxCacheAt &&
        (now - this._remoteMailboxCacheAt) < this.REMOTE_MAILBOX_TTL_MS &&
        Array.isArray(this._remoteMailboxCache)) {
      return this._remoteMailboxCache.map(m => ({ ...m }));
    }

    let remotes = [];
    if (window.MailService && typeof MailService.isRemoteAvailable === 'function' &&
        typeof MailService.listRemoteMailboxes === 'function') {
      try {
        const ok = await MailService.isRemoteAvailable();
        if (ok) remotes = await MailService.listRemoteMailboxes(accountKey) || [];
      } catch (_) { remotes = []; }
    }

    const locals = this.loadMailboxes() || [];
    const combined = [];
    const seen = new Set();
    for (const r of remotes || []) {
      if (r && r.id) {
        seen.add(String(r.id));
        
        // Ensure memberNames and memberCharacters are parsed objects
        const ensureObj = (val) => {
          if (!val) return {};
          if (typeof val === 'object') return val;
          if (typeof val === 'string') {
            try { const parsed = JSON.parse(val); return typeof parsed === 'object' && parsed !== null ? parsed : {}; } catch (_) { return {}; }
          }
          return {};
        };
        const ensureArray = (val) => {
          if (!val) return [];
          if (Array.isArray(val)) return val;
          if (typeof val === 'string') {
            try { const parsed = JSON.parse(val); return Array.isArray(parsed) ? parsed : []; } catch (_) { return []; }
          }
          return [];
        };
        r.memberNames = ensureObj(r.memberNames);
        r.memberCharacters = ensureObj(r.memberCharacters);
        r.memberAccountKeys = ensureArray(r.memberAccountKeys);
        r.members = ensureArray(r.members);
        
        // 合并本地已有的 memberCharacters 和 memberNames
        const localMatch = locals.find(l => l && l.id && String(l.id) === String(r.id));
        if (localMatch) {
          r.memberCharacters = { ...(r.memberCharacters || {}), ...(localMatch.memberCharacters || {}) };
          r.memberNames = { ...(r.memberNames || {}), ...(localMatch.memberNames || {}) };
          
          // Merge memberAccountKeys: combine remote and local to ensure no members are lost
          const remoteKeys = Array.isArray(r.memberAccountKeys) ? r.memberAccountKeys : [];
          const localKeys = Array.isArray(localMatch.memberAccountKeys) ? localMatch.memberAccountKeys : [];
          const localMembers = Array.isArray(localMatch.members) ? localMatch.members : [];
          const mergedKeys = Array.from(new Set([...remoteKeys, ...localKeys, ...localMembers]));
          // Filter out invalid auto-generated "user-*" keys that don't have matching data
          const validKeys = mergedKeys.filter(k => {
            if (!k || typeof k !== 'string') return false;
            const key = k.toLowerCase().trim();
            // If the key has matching memberName or memberCharacter, it's valid
            if (r.memberNames && r.memberNames[key]) return true;
            if (r.memberCharacters && r.memberCharacters[key]) return true;
            // If the key is not auto-generated, keep it
            if (!key.startsWith('user-')) return true;
            // Auto-generated key with no matching data - filter it out
            return false;
          });
          r.memberAccountKeys = validKeys;
          
          // Also merge members array
          const remoteMembers = Array.isArray(r.members) ? r.members : [];
          const mergedMembers = Array.from(new Set([...remoteMembers, ...localKeys, ...localMembers, ...remoteKeys]));
          r.members = mergedMembers.filter(k => {
            if (!k || typeof k !== 'string') return false;
            const key = k.toLowerCase().trim();
            if (r.memberNames && r.memberNames[key]) return true;
            if (r.memberCharacters && r.memberCharacters[key]) return true;
            if (!key.startsWith('user-')) return true;
            return false;
          });
        }
        combined.push({ ...r, _source: 'remote' });
      }
    }
    for (const l of locals || []) {
      if (!l || !l.id) continue;
      if (seen.has(String(l.id))) continue;
      // 本地没同步过的也放进来（如果远端可用，下次 saveMailboxes 会再推）
      combined.push({ ...l, _source: 'local' });
      seen.add(String(l.id));
    }

    // 同时把 sharedMailboxes 里自己 join 的也加入列表
    try {
      const shared = this.loadSharedMailboxes() || [];
      for (const s of shared) {
        if (!s || !s.id) continue;
        if (seen.has(String(s.id))) continue;
        combined.push({ ...s, _source: 'shared' });
        seen.add(String(s.id));
      }
    } catch (_) {}

    this._remoteMailboxCache = combined.map(m => ({ ...m }));
    this._remoteMailboxCacheAt = Date.now();
    return combined;
  },

  /** 主动清空远端信箱缓存（例如新建/加入信箱后） */
  clearRemoteMailboxCache() {
    this._remoteMailboxCache = [];
    this._remoteMailboxCacheAt = 0;
  },

  /**
   * 主动把本地未同步 / 脏的信箱推送到远端。
   * 用于「新建信箱」「编辑信箱」「成员变更」后确保远端落地。
   * 成功后清脏标记、合并远端返回的 id/code/成员字段。
   */
  async flushRemoteMailboxes(accountKey) {
    if (!window.MailService ||
        typeof MailService.isRemoteAvailable !== 'function' ||
        typeof MailService.createRemoteMailbox !== 'function') return false;
    // 探测失败/慢也继续尝试推送（每个请求带超时保护）；真正不可达时各请求超时失败并保留脏标记，下次重试。
    // 注：若此处直接 return false，本地新建但云端失败的信箱将永远不同步 → 跨端口/跨设备搜不到。
    let available = false;
    try { available = await MailService.isRemoteAvailable({ force: true }); } catch (_) { available = false; }

    const ak = String(accountKey || MailService.getAccountKey() || '').trim().toLowerCase();
    if (!ak) return false;

    // 带超时的云端创建（远程 MySQL 较慢，放宽到 8s）
    const createWithTimeout = (payload) => Promise.race([
      MailService.createRemoteMailbox(payload),
      new Promise((_, rej) => setTimeout(() => rej(new Error('flush_timeout_8s')), 8000))
    ]);

    const personalBoxes = this.loadMailboxes() || [];
    const sharedBoxes = (typeof this.loadSharedMailboxes === 'function') ? (this.loadSharedMailboxes() || []) : [];
    // 合并去重：个人 + 共享（分享包导入的信箱也要推云端，否则跨端口/跨设备搜不到）
    const byIdMap = new Map();
    personalBoxes.forEach(m => m && m.id && byIdMap.set(String(m.id), m));
    sharedBoxes.forEach(m => m && m.id && !byIdMap.has(String(m.id)) && byIdMap.set(String(m.id), m));
    const mailboxes = Array.from(byIdMap.values());
    let dirty = false;
    let ok = false;
    for (const mb of mailboxes) {
      if (!mb || !mb.name) continue;
      const isDirty = mb._memberDataDirty === true || mb._remoteUpsertNeeded === true || mb._remoteSynced !== true;
      const owner = String(mb.ownerAccountKey || mb.owner || mb.createdBy || '').toLowerCase();
      const isOwner = owner && owner === ak;
      const isMember = (Array.isArray(mb.members) && (mb.members.includes(ak) || mb.members.map(String).map(s=>s.toLowerCase()).includes(ak)))
        || (Array.isArray(mb.memberAccountKeys) && (mb.memberAccountKeys.includes(ak) || mb.memberAccountKeys.map(String).map(s=>s.toLowerCase()).includes(ak)));
      // 已同步且不脏，跳过
      if (mb._remoteSynced && !isDirty) continue;
      // 既不是 owner 也不是成员，跳过（无权写）
      if (!isOwner && !isMember) continue;

      const payload = {
        name: mb.name,
        desc: mb.desc || mb.description || '',
        icon: mb.icon || '',
        themeColor: mb.themeColor || '',
        mapBackground: mb.mapBackground || mb.background || '',
        isCustom: mb.isCustom !== false,
        ownerAccountKey: ak,
        preferCode: mb.mailboxCode || mb.code || null,
        createdAt: mb.createdAt || Date.now(),
        updatedAt: mb.updatedAt || Date.now(),
        description: mb.description || mb.desc || '',
        background: mb.background || mb.mapBackground || '',
        owner: ak,
        ...(mb.id ? { id: mb.id } : {}),
        ...((mb.mailboxCode || mb.code) ? { mailboxCode: mb.mailboxCode || mb.code } : {}),
        memberAccountKeys: Array.isArray(mb.memberAccountKeys)
          ? mb.memberAccountKeys
          : (Array.isArray(mb.members) ? mb.members : (ak ? [ak] : [])),
        members: Array.isArray(mb.members)
          ? mb.members
          : (Array.isArray(mb.memberAccountKeys) ? mb.memberAccountKeys : (ak ? [ak] : [])),
        memberCharacters: mb.memberCharacters || {},
        memberNames: mb.memberNames || {}
      };

      try {
        const r = await createWithTimeout(payload);
        if (r && r.success && r.mailbox) {
          mb._remoteSynced = true;
          mb._memberDataDirty = false;
          mb.id = r.mailbox.id || mb.id;
          if (r.mailbox.mailboxCode && !mb.mailboxCode) {
            mb.mailboxCode = r.mailbox.mailboxCode;
            mb.code = mb.mailboxCode;
            this.saveMailboxCodeIndex(mb.mailboxCode, mb.id);
          } else if (r.mailbox.code && !mb.code) {
            mb.code = r.mailbox.code;
            mb.mailboxCode = mb.code;
            this.saveMailboxCodeIndex(mb.code, mb.id);
          }
          // 合并远端返回的成员字段（远端可能更全）
          if (Array.isArray(r.mailbox.memberAccountKeys) && r.mailbox.memberAccountKeys.length > 0) {
            const merged = new Set([
              ...(Array.isArray(mb.memberAccountKeys) ? mb.memberAccountKeys : []),
              ...(Array.isArray(mb.members) ? mb.members : []),
              ...r.mailbox.memberAccountKeys
            ]);
            mb.memberAccountKeys = Array.from(merged);
            mb.members = mb.memberAccountKeys;
          }
          if (r.mailbox.memberCharacters && typeof r.mailbox.memberCharacters === 'object') {
            mb.memberCharacters = { ...(mb.memberCharacters || {}), ...r.mailbox.memberCharacters };
          }
          if (r.mailbox.memberNames && typeof r.mailbox.memberNames === 'object') {
            mb.memberNames = { ...(mb.memberNames || {}), ...r.mailbox.memberNames };
          }
          ok = true;
          dirty = true;
        }
      } catch (_) {
        // 单条失败：保留脏标记，下次 save 重试
        mb._remoteSynced = false;
        mb._memberDataDirty = true;
        dirty = true;
      }
    }
    if (dirty) {
      localStorage.setItem(this.MAILBOXES_KEY, JSON.stringify(mailboxes));
      this.clearRemoteMailboxCache();
    }
    return ok;
  },

  /**
   * 强制从远端拉取账号信箱列表，合并回本地并刷新缓存。
   * 用于登录、新建、加入、切换账号后，确保跨设备数据一致。
   */
  async forceReloadMailboxesFromRemote(accountKey) {
    this.clearRemoteMailboxCache();
    let combined = [];
    try {
      combined = await this.loadMailboxesAsync({ force: true, accountKey });
    } catch (_) { combined = []; }

    // 把远端拉到的信箱合并回本地（保留本地未同步的脏数据）
    const locals = this.loadMailboxes() || [];
    const localById = new Map(locals.filter(l => l && l.id).map(l => [String(l.id), l]));
    const merged = [];
    const seen = new Set();
    for (const r of combined) {
      if (!r || !r.id) continue;
      const id = String(r.id);
      seen.add(id);
      const local = localById.get(id);
      if (local && (local._remoteSynced === false || local._memberDataDirty === true)) {
        // 本地有未推送的脏数据：保留本地版本，但合并远端成员字段
        merged.push({
          ...r,
          ...local,
          memberCharacters: { ...(r.memberCharacters || {}), ...(local.memberCharacters || {}) },
          memberNames: { ...(r.memberNames || {}), ...(local.memberNames || {}) },
          memberAccountKeys: Array.from(new Set([
            ...(r.memberAccountKeys || []),
            ...(local.memberAccountKeys || [])
          ]))
        });
      } else {
        merged.push({ ...r });
      }
    }
    // 本地存在但远端没有的（未同步的新建），保留
    for (const l of locals) {
      if (!l || !l.id) continue;
      if (seen.has(String(l.id))) continue;
      merged.push({ ...l });
    }
    localStorage.setItem(this.MAILBOXES_KEY, JSON.stringify(merged));
    this.clearRemoteMailboxCache();
    // 重新填充缓存，避免下次 load 又打远端
    this._remoteMailboxCache = merged.map(m => ({ ...m }));
    this._remoteMailboxCacheAt = Date.now();
    return merged;
  },

  // --- 上次访问记录 ---
  saveLastMailboxId(mailboxId) {
    localStorage.setItem('xinjian_last_mailbox', mailboxId);
  },

  loadLastMailboxId() {
    return localStorage.getItem('xinjian_last_mailbox');
  },

  saveLastLetter(letter) {
    if (!letter) return;
    localStorage.setItem('xinjian_last_letter', JSON.stringify({
      id: letter.id,
      mailboxId: letter.mailboxId,
      letterTitle: letter.letterTitle || '',
      recipient: letter.recipient || ''
    }));
  },

  loadLastLetter() {
    const data = localStorage.getItem('xinjian_last_letter');
    return data ? JSON.parse(data) : null;
  },

  // --- 辅助方法 ---
  async saveLetterWithMedia(letter) {
    // 将 content 中的 blob URL 转换为 IndexedDB id
    const processed = JSON.parse(JSON.stringify(letter));
    for (const item of processed.content || []) {
      if ((item.type === 'image' || item.type === 'voice' || item.type === 'video') && item.src && item.src.startsWith('blob:')) {
        const id = item.id || `media-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        item.id = id;
        // blob URL 需要实际解析，这里假设 src 已经是 data URL 或路径
        // 对于 blob URL，需要从元素中提取
        if (item._blob) {
          await this.saveMedia(id, item.type, item._blob);
          item.src = id; // 替换为 id 引用
          delete item._blob;
        }
      }
    }
    const letters = this.loadLetters();
    const idx = letters.findIndex(l => l.id === letter.id);
    if (idx >= 0) {
      letters[idx] = processed;
    } else {
      letters.push(processed);
    }
    this.saveLetters(letters);
    return processed;
  },

  async loadLetter(id) {
    const letters = this.loadLetters();
    const letter = letters.find(l => l.id === id);
    if (!letter) return null;

    // 恢复媒体 URL
    const restored = JSON.parse(JSON.stringify(letter));
    for (const item of restored.content || []) {
      if ((item.type === 'image' || item.type === 'voice' || item.type === 'video') && item.id && !item.src.startsWith('blob:')) {
        try {
          const blob = await this.getMedia(item.id);
          if (blob) {
            item.src = URL.createObjectURL(blob);
          }
        } catch (e) {
          console.warn('Failed to load media:', item.id, e);
        }
      }
    }
    return restored;
  },

  async deleteLetter(id) {
    const letters = this.loadLetters().filter(l => l.id !== id);
    this.saveLetters(letters);
    // 远端同步：删除云端对应记录（异步 fire-and-forget）
    try {
      if (window.MailService && typeof MailService.isRemoteAvailable === 'function' &&
          typeof MailService.deleteRemoteLetter === 'function') {
        (async () => {
          try {
            const ok = await MailService.isRemoteAvailable();
            if (ok) await MailService.deleteRemoteLetter(id);
          } catch (_) {}
        })();
      }
    } catch (_) {}
  },

  async exportLetterAsImage(letterId) {
    const letter = await this.loadLetter(letterId);
    if (!letter) return null;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const width = 700;
    const height = 1200;
    canvas.width = width;
    canvas.height = height;

    // 背景
    const paperStyles = {
      'vintage-literary': '#faf6ee',
      'modern-minimal': '#ffffff',
      'cute-doodle': '#fff9f0',
      'japanese-vertical': '#f8f4ec'
    };
    ctx.fillStyle = paperStyles[letter.paperStyle] || '#faf6ee';
    ctx.fillRect(0, 0, width, height);

    // 绘制内容
    for (const item of (letter.content || [])) {
      try {
        if (item.type === 'text') {
          ctx.font = `${item.fontSize || 16}px KaiTi, STKaiti, serif`;
          ctx.fillStyle = '#2c2c2c';
          const lines = (item.text || '').split('\n');
          lines.forEach((line, i) => {
            ctx.fillText(line, item.x || 0, (item.y || 0) + i * (item.fontSize || 16) * 1.8);
          });
        } else if (item.type === 'image' && item.src) {
          const img = await this._loadImage(item.src);
          const w = item.width || img.naturalWidth;
          const h = item.height || img.naturalHeight;
          ctx.drawImage(img, item.x || 0, item.y || 0, w, h);
        }
      } catch (e) {
        console.warn('Export skip:', item.type, e);
      }
    }

    return canvas.toDataURL('image/png');
  },

  _loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  },

  // --- 手账数据存储 ---
  JOURNAL_DAYS_KEY: 'xinjian_journal_days',

  saveJournals(journals) {
    localStorage.setItem(this.JOURNALS_KEY, JSON.stringify(journals));
  },

  loadJournals() {
    const data = localStorage.getItem(this.JOURNALS_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveJournal(journal) {
    const journals = this.loadJournals();
    const idx = journals.findIndex(j => j.id === journal.id);
    if (idx >= 0) {
      journals[idx] = { ...journal, updatedAt: Date.now() };
    } else {
      journals.push({ ...journal, createdAt: Date.now(), updatedAt: Date.now() });
    }
    this.saveJournals(journals);
    // 异步远端保存（可选）
    if (window.MailService && typeof MailService.saveRemoteJournal === 'function') {
      (async () => {
        try {
          const ok = await MailService.isRemoteAvailable();
          if (!ok) return;
          await MailService.saveRemoteJournal(journal);
        } catch (_) {}
      })();
    }
    return journal;
  },

  /** 异步：从远端拉手账 + 合并到本地（init 预热调用） */
  async mergeRemoteJournalsToLocal() {
    if (!(window.MailService && typeof MailService.isRemoteAvailable === 'function' &&
        typeof MailService.loadRemoteJournals === 'function')) return;
    try {
      const ok = await MailService.isRemoteAvailable();
      if (!ok) return;
      const list = await MailService.loadRemoteJournals();
      if (!Array.isArray(list) || !list.length) return;
      const locals = this.loadJournals();
      const byId = new Map(locals.map(j => [j.id, j]));
      let changed = false;
      for (const r of list || []) {
        if (!r || !r.id) continue;
        const existing = byId.get(r.id);
        if (!existing) { locals.push(r); changed = true; }
        else if ((r.updatedAt || 0) > (existing.updatedAt || 0)) {
          byId.set(r.id, { ...existing, ...r });
          changed = true;
        }
      }
      if (changed) this.saveJournals(byId.size === locals.length ? locals : Array.from(byId.values()));
    } catch (_) {}
  },

  loadJournal(id) {
    const journals = this.loadJournals();
    return journals.find(j => j.id === id) || null;
  },

  deleteJournal(id) {
    const journals = this.loadJournals().filter(j => j.id !== id);
    this.saveJournals(journals);
  },

  saveJournalDay(dayData) {
    const days = this.loadJournalDays();
    days[dayData.date] = { ...dayData, updatedAt: Date.now() };
    localStorage.setItem(this.JOURNAL_DAYS_KEY, JSON.stringify(days));
    return dayData;
  },

  loadJournalDay(dateStr) {
    const days = this.loadJournalDays();
    return days[dateStr] || null;
  },

  loadJournalDays() {
    const data = localStorage.getItem(this.JOURNAL_DAYS_KEY);
    return data ? JSON.parse(data) : {};
  },

  // --- 信件扩展：回信、定时发送、方向 ---
  updateLetterFields(letterId, fields) {
    const letters = this.loadLetters();
    const idx = letters.findIndex(l => l.id === letterId);
    if (idx >= 0) {
      letters[idx] = { ...letters[idx], ...fields, updatedAt: Date.now(), _remoteSynced: false };
      this.saveLetters(letters);
      return letters[idx];
    }
    return null;
  },

  getPendingScheduledLetters() {
    const letters = this.loadLetters();
    const now = Date.now();
    return letters.filter(l => l.scheduledAt && l.scheduledAt > now && l.status === 'scheduled');
  },

  getDueScheduledLetters() {
    const letters = this.loadLetters();
    const now = Date.now();
    return letters.filter(l => l.scheduledAt && l.scheduledAt <= now && l.status === 'scheduled');
  },

  // --- 共享信箱 ---
  saveSharedLetters(mailboxId, letters) {
    const key = this.SHARED_LETTERS_KEY_PREFIX + mailboxId;
    localStorage.setItem(key, JSON.stringify(letters));
  },

  loadSharedLetters(mailboxId) {
    const key = this.SHARED_LETTERS_KEY_PREFIX + mailboxId;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  },

  async saveSharedLetterWithMedia(mailboxId, letter) {
    const processed = JSON.parse(JSON.stringify(letter));
    for (const item of processed.content || []) {
      if ((item.type === 'image' || item.type === 'voice' || item.type === 'video') && item.src && item.src.startsWith('blob:')) {
        const id = item.id || `media-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        item.id = id;
        if (item._blob) {
          await this.saveMedia(id, item.type, item._blob);
          item.src = id;
          delete item._blob;
        }
      }
    }
    const letters = this.loadSharedLetters(mailboxId);
    const idx = letters.findIndex(l => l.id === letter.id);
    if (idx >= 0) {
      letters[idx] = processed;
    } else {
      letters.push(processed);
    }
    this.saveSharedLetters(mailboxId, letters);
    return processed;
  },

  saveSharedMailbox(mailboxData) {
    const mailboxes = this.loadSharedMailboxes();
    const idx = mailboxes.findIndex(m => m.id === mailboxData.id);
    if (idx >= 0) {
      mailboxes[idx] = { ...mailboxData, updatedAt: Date.now() };
    } else {
      mailboxes.push({ ...mailboxData, createdAt: Date.now(), updatedAt: Date.now() });
    }
    localStorage.setItem(this.SHARED_MAILBOXES_KEY, JSON.stringify(mailboxes));

    // 同步信箱号索引
    if (mailboxData.code) {
      this.saveMailboxCodeIndex(mailboxData.code, mailboxData.id);
    }

    return mailboxData;
  },

  loadSharedMailbox(mailboxId) {
    const mailboxes = this.loadSharedMailboxes();
    return mailboxes.find(m => m.id === mailboxId) || null;
  },

  deleteSharedMailbox(mailboxId) {
    const mailboxes = this.loadSharedMailboxes();
    const idx = mailboxes.findIndex(m => m.id === mailboxId);
    if (idx >= 0) {
      mailboxes.splice(idx, 1);
      localStorage.setItem(this.SHARED_MAILBOXES_KEY, JSON.stringify(mailboxes));
      return true;
    }
    return false;
  },

  // --- 信箱号索引（全局唯一 6 位 code -> mailboxId） ---
  loadMailboxCodesIndex() {
    const data = localStorage.getItem(this.MAILBOX_CODES_INDEX_KEY);
    return data ? JSON.parse(data) : {};
  },

  saveMailboxCodesIndex(index) {
    localStorage.setItem(this.MAILBOX_CODES_INDEX_KEY, JSON.stringify(index));
  },

  saveMailboxCodeIndex(code, mailboxId) {
    if (!code || !mailboxId) return;
    const index = this.loadMailboxCodesIndex();
    index[String(code).toUpperCase()] = mailboxId;
    this.saveMailboxCodesIndex(index);
  },

  deleteMailboxCodeIndexByMailboxId(mailboxId) {
    if (!mailboxId) return false;
    const index = this.loadMailboxCodesIndex();
    let changed = false;
    for (const [code, id] of Object.entries(index)) {
      if (id === mailboxId) {
        delete index[code];
        changed = true;
      }
    }
    if (changed) this.saveMailboxCodesIndex(index);
    return changed;
  },

  getMailboxIdByCode(code) {
    if (!code) return null;
    const norm = String(code).replace(/[\s\-_·.•,，。、;；]/g, '').toUpperCase();
    const index = this.loadMailboxCodesIndex();
    // 异步后台尝试远端 lookup，命中则补写到本地索引
    if (window.MailService && typeof MailService.lookupMailboxCode === 'function' && norm) {
      (async () => {
        try {
          const r = await MailService.lookupMailboxCode(norm);
          if (r && r.mailbox && r.mailbox.id) {
            this.saveMailboxCodeIndex(norm, r.mailbox.id);
            // 如果本地 /shared 里还没存，则也保存一份到 sharedMailboxes 方便离线可用
            this.saveSharedMailbox(r.mailbox).catch ? null : null;
          }
        } catch (_) {}
      })();
    }
    return index[norm] || null;
  },

  /**
   * 异步版信箱号 lookup（核心跨用户）：
   * 1) 先查远端 /api/mailbox_codes/lookup
   * 2) 命中则写入本地缓存 & sharedMailboxes & codes_index，返回 { mailbox, source: 'remote' }
   * 3) 否则回退本地索引 -> sharedMailboxes -> mailboxes，返回 { mailbox, source: 'local' } 或 null
   */
  async getMailboxByCodeAsync(code) {
    if (!code) return null;
    const norm = String(code).replace(/[\s\-_·.•,，。、;；]/g, '').toUpperCase();
    let mailbox = null;

    if (window.MailService && typeof MailService.isRemoteAvailable === 'function' &&
        typeof MailService.lookupMailboxCode === 'function') {
      try {
        const ok = await MailService.isRemoteAvailable();
        if (ok) {
          const r = await MailService.lookupMailboxCode(norm);
          if (r && r.mailbox && (r.mailbox.id || r.mailbox._id)) {
            mailbox = r.mailbox;
            const mid = mailbox.id || mailbox._id;
            this.saveMailboxCodeIndex(norm, mid);
            try { this.saveSharedMailbox(mailbox); } catch (_) {}
            return { mailbox, source: 'remote' };
          }
        }
      } catch (_) {}
    }

    // 本地回退
    const localId = (this.loadMailboxCodesIndex() || {})[norm];
    if (localId) {
      const locals = this.loadMailboxes() || [];
      mailbox = locals.find(m => String(m.id) === String(localId)) || null;
      if (!mailbox) mailbox = this.loadSharedMailbox(localId);
    }
    if (!mailbox) return null;
    return { mailbox, source: 'local' };
  },

  loadSharedMailboxes() {
    const data = localStorage.getItem(this.SHARED_MAILBOXES_KEY);
    return data ? JSON.parse(data) : [];
  },

  initSharedMailbox() {
    const mailboxId = 'mailbox-hanmen-duet';
    const existing = this.loadSharedMailbox(mailboxId);
    if (existing) {
      // 确保寒门信笺有稳定信箱号（固定：HM2024）
      if (!existing.code) {
        existing.code = 'HM2024';
        this.saveSharedMailbox(existing);
      }
      return existing;
    }

    const xiuJingUser = AuthManager.getUserByUsername('xiujing');
    const xuanXuanUser = AuthManager.getUserByUsername('xuanxuan');

    const xiuJingId = xiuJingUser?.id || 'user-xiu-jing-id';
    const xuanXuanId = xuanXuanUser?.id || 'user-xuan-xuan-id';

    const mailboxData = {
      id: mailboxId,
      code: 'HM2024',
      name: '寒门信笺',
      icon: '🏮',
      desc: '修璟与萱宣的双人信箱',
      accent: '#8b4513',
      bgGradient: 'linear-gradient(135deg, #faf5f0, #f5efe5)',
      cardAccent: '#a0522d',
      mapBackground: 'hanmen',
      members: [xiuJingId, xuanXuanId]
    };

    this.saveSharedMailbox(mailboxData);

    const sampleLetters = [
      {
        id: 'letter-hanmen-001',
        mailboxId: mailboxId,
        letterTitle: '寒门初雪',
        recipient: '萱宣',
        paperStyle: 'vintage-literary',
        createdAt: Date.now() - 86400000 * 3,
        updatedAt: Date.now() - 86400000 * 3,
        status: 'sent',
        author: {
          userId: xiuJingId,
          username: 'xiujing',
          displayName: '修璟',
          role: 'xiu-jing'
        },
        content: [
          {
            type: 'text',
            text: '萱宣亲启：\n\n今晨推窗，见漫天飞雪，寒门之内，炉火正暖。\n\n忆往昔，你我初遇于桃林之下，你着素衣，手捧书卷，恍若隔世之人。如今岁月流转，你我相守于这寒门小屋，粗茶淡饭，却也心安。\n\n雪落无声，思念有声。愿与君共度此寒冬，待来年春暖花开，再共赏桃林美景。\n\n修璟 手书\n腊月初三',
            x: 60,
            y: 100,
            fontSize: 18
          }
        ]
      },
      {
        id: 'letter-hanmen-002',
        mailboxId: mailboxId,
        letterTitle: '锦书相寄',
        recipient: '修璟',
        paperStyle: 'vintage-literary',
        createdAt: Date.now() - 86400000 * 2,
        updatedAt: Date.now() - 86400000 * 2,
        status: 'sent',
        author: {
          userId: xuanXuanId,
          username: 'xuanxuan',
          displayName: '萱宣',
          role: 'xuan-xuan'
        },
        content: [
          {
            type: 'text',
            text: '修璟吾兄：\n\n见字如晤。\n\n昨夜西风凋碧树，独上高楼，望尽天涯路。欲寄彩笺兼尺素，山长水阔知何处。\n\n幸而你我咫尺之遥，不必叹山高水远。寒门虽陋，有你在侧，便是人间好时节。\n\n窗外雪正浓，屋内灯如豆。愿执子之手，与子偕老，共赴这漫漫人生路。\n\n萱宣 谨上\n腊月初四',
            x: 60,
            y: 100,
            fontSize: 18
          }
        ]
      }
    ];

    this.saveSharedLetters(mailboxId, sampleLetters);

    return mailboxData;
  },

  // --- 背包数据存储（按 accountKey 存储，支持跨地图和信箱）---
  INVENTORY_KEY: 'xinjian_inventory',

  saveInventory(accountKey, inventory) {
    if (!accountKey) return;
    const all = this.loadAllInventories();
    all[accountKey] = { ...inventory, updatedAt: Date.now() };
    localStorage.setItem(this.INVENTORY_KEY, JSON.stringify(all));
  },

  loadInventory(accountKey) {
    if (!accountKey) return null;
    const all = this.loadAllInventories();
    return all[accountKey] || null;
  },

  loadAllInventories() {
    const data = localStorage.getItem(this.INVENTORY_KEY);
    return data ? JSON.parse(data) : {};
  },

  // --- 角色绑定存储 ---
  CHARACTER_BINDINGS_KEY: 'xinjian_character_bindings',

  saveCharacterBinding(mailboxId, characterId) {
    const bindings = this.loadCharacterBindings();
    bindings[mailboxId] = characterId;
    localStorage.setItem(this.CHARACTER_BINDINGS_KEY, JSON.stringify(bindings));
  },

  loadCharacterBinding(mailboxId) {
    const bindings = this.loadCharacterBindings();
    return bindings[mailboxId] || null;
  },

  loadCharacterBindings() {
    const data = localStorage.getItem(this.CHARACTER_BINDINGS_KEY);
    return data ? JSON.parse(data) : {};
  },

  deleteCharacterBinding(mailboxId) {
    const bindings = this.loadCharacterBindings();
    delete bindings[mailboxId];
    localStorage.setItem(this.CHARACTER_BINDINGS_KEY, JSON.stringify(bindings));
  },

  // --- 每用户信箱角色绑定 ---
  USER_CHARACTER_BINDINGS_KEY: 'xinjian_user_character_bindings',

  saveUserCharacterBinding(mailboxId, userId, characterId) {
    const bindings = this.loadUserCharacterBindings();
    if (!bindings[mailboxId]) bindings[mailboxId] = {};
    bindings[mailboxId][userId] = characterId;
    localStorage.setItem(this.USER_CHARACTER_BINDINGS_KEY, JSON.stringify(bindings));
  },

  loadUserCharacterBinding(mailboxId, userId) {
    const bindings = this.loadUserCharacterBindings();
    return bindings[mailboxId]?.[userId] || null;
  },

  loadUserCharacterBindings() {
    const data = localStorage.getItem(this.USER_CHARACTER_BINDINGS_KEY);
    return data ? JSON.parse(data) : {};
  }
};