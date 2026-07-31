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
  },

  loadMailboxes() {
    const data = localStorage.getItem(this.MAILBOXES_KEY);
    return data ? JSON.parse(data) : [];
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
    return journal;
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
      letters[idx] = { ...letters[idx], ...fields, updatedAt: Date.now() };
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
    return mailboxData;
  },

  loadSharedMailbox(mailboxId) {
    const mailboxes = this.loadSharedMailboxes();
    return mailboxes.find(m => m.id === mailboxId) || null;
  },

  loadSharedMailboxes() {
    const data = localStorage.getItem(this.SHARED_MAILBOXES_KEY);
    return data ? JSON.parse(data) : [];
  },

  initSharedMailbox() {
    const mailboxId = 'mailbox-hanmen-duet';
    const existing = this.loadSharedMailbox(mailboxId);
    if (existing) {
      return existing;
    }

    const xiuJingUser = AuthManager.getUserByUsername('xiujing');
    const xuanXuanUser = AuthManager.getUserByUsername('xuanxuan');

    const xiuJingId = xiuJingUser?.id || 'user-xiu-jing-id';
    const xuanXuanId = xuanXuanUser?.id || 'user-xuan-xuan-id';

    const mailboxData = {
      id: mailboxId,
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
  }
};