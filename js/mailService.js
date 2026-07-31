/* Server-backed account identity and mail delivery. */
const MailService = {
  _cache: new Map(),
  profile: null,
  account: null,
  XIEJIAN_NAMES: {
    'zhou-ran': '周然',
    'he-qingfeng': '贺清风',
    'ren-chaoye': '任朝野',
    'shen-chiyi': '沈池懿',
    'qi-pingchuan': '戚凭川',
    'jiang-huaian': '江淮安',
    'tang-wanchu': '唐挽初'
  },

  getBaseUrl() {
    const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
    return `${protocol}//${window.location.hostname}:3000`;
  },

  getAccountKey(user = AuthManager.getCurrentUser()) {
    return String(user?.username || user?.id || '').trim().toLocaleLowerCase('en-US');
  },

  async _request(path, options = {}) {
    const response = await fetch(`${this.getBaseUrl()}${path}`, {
      ...options,
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
    if (mailboxId === 'mailbox-xiejian' && this.profile?.xiejianCharacterId) {
      return this.XIEJIAN_NAMES[this.profile.xiejianCharacterId] || this.profile.xiejianCharacterId;
    }
    if (mailboxId === 'mailbox-hanmen-duet') {
      if (user?.role === 'xiu-jing') return '修璟';
      if (user?.role === 'xuan-xuan') return '萱宣';
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
  }
};
