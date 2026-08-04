/* ============================================================
 *  resourceManager.js — 通用资源持久化管理器
 *  功能：
 *    1. 多源回退加载：远端 CDN → 备用服务器 → 本地路径
 *    2. IndexedDB 持久化缓存：加载成功后自动保存到本地
 *    3. 自动重试 + 指数退避
 *    4. 资源清单（manifest）版本管理
 * ============================================================ */

(function (global) {
  'use strict';

  const DB_NAME = 'xinjian_resources';
  const DB_VERSION = 1;
  const STORE_NAME = 'assets';
  const CACHE_VERSION_KEY = '__cache_version__';
  const DEFAULT_CACHE_VERSION = String(Date.now());

  function cleanBase(base) {
    const s = String(base || '').trim();
    return s ? s.replace(/\/+$/, '') + '/' : '';
  }

  function unique(arr) {
    return [...new Set(arr.filter(Boolean))];
  }

  function toArrayBuffer(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(blob);
    });
  }

  const ResourceManager = {
    _db: null,
    _dbReady: null,
    _configured: false,
    config: {
      // 优先使用的远端资源服务器（CDN）地址，按优先级排列
      remoteBaseUrls: [],
      // 本地相对路径基础（兜底）
      localBaseUrl: './',
      // 缓存版本，变动则失效所有旧缓存
      cacheVersion: DEFAULT_CACHE_VERSION,
      // 最大重试次数
      maxRetries: 3,
      // 是否启用持久化缓存
      enableCache: true,
      // 缓存大小上限（字节），默认 100MB
      cacheMaxBytes: 100 * 1024 * 1024,
    },
    _pendingRequests: new Map(), // url -> Promise，避免并发重复加载
    _stats: { cacheHits: 0, cacheMisses: 0, remoteLoads: 0, localLoads: 0, failures: 0 },

    /**
     * 配置资源管理器
     */
    configure(cfg = {}) {
      this.config = { ...this.config, ...cfg };
      if (Array.isArray(cfg.remoteBaseUrls)) {
        this.config.remoteBaseUrls = unique(cfg.remoteBaseUrls.map(cleanBase));
      }
      if (cfg.localBaseUrl) {
        this.config.localBaseUrl = cleanBase(cfg.localBaseUrl);
      }
      this._configured = true;
      console.log('[ResourceManager] Configured:', this._getPublicConfig());
      return this._getPublicConfig();
    },

    /**
     * 获取加载统计（用于测试和监控）
     */
    getStats() {
      return { ...this._stats };
    },

    /**
     * 重置统计计数器
     */
    resetStats() {
      this._stats = { cacheHits: 0, cacheMisses: 0, remoteLoads: 0, localLoads: 0, failures: 0 };
    },

    _getPublicConfig() {
      return {
        remoteBaseUrls: [...this.config.remoteBaseUrls],
        localBaseUrl: this.config.localBaseUrl,
        cacheVersion: this.config.cacheVersion,
        maxRetries: this.config.maxRetries,
        enableCache: this.config.enableCache,
      };
    },

    /**
     * 从服务器 bootstrap 拉取资源配置（远端 CDN 地址、版本号等）
     */
    async bootstrap() {
      try {
        const res = await fetch('/api/resources/bootstrap', { cache: 'no-cache' });
        if (res.ok) {
          const data = await res.json().catch(() => ({}));
          if (data && typeof data === 'object') {
            this.configure({
              remoteBaseUrls: data.remoteBaseUrls || data.assetBaseUrls || [],
              cacheVersion: data.cacheVersion || data.resourceVersion || DEFAULT_CACHE_VERSION,
            });
          }
        }
      } catch (_) {
        // 失败则使用默认配置
      }
      if (this.config.enableCache) {
        await this._ensureDB();
      }
      return this._getPublicConfig();
    },

    /* -------- IndexedDB -------- */
    _ensureDB() {
      if (this._dbReady) return this._dbReady;
      this._dbReady = this._openDB();
      return this._dbReady;
    },

    _openDB() {
      return new Promise((resolve, reject) => {
        try {
          const req = indexedDB.open(DB_NAME, DB_VERSION);
          req.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
              const store = db.createObjectStore(STORE_NAME, { keyPath: 'url' });
              store.createIndex('ts', 'ts', { unique: false });
              store.createIndex('size', 'size', { unique: false });
            }
          };
          req.onsuccess = (e) => {
            this._db = e.target.result;
            resolve();
          };
          req.onerror = () => reject(req.error);
        } catch (e) {
          reject(e);
        }
      });
    },

    async _cacheGet(url) {
      if (!this.config.enableCache) return null;
      await this._ensureDB().catch(() => null);
      if (!this._db) return null;
      return new Promise((resolve) => {
        try {
          const tx = this._db.transaction(STORE_NAME, 'readonly');
          const store = tx.objectStore(STORE_NAME);
          const req = store.get(url);
          req.onsuccess = () => {
            const row = req.result;
            if (!row) return resolve(null);
            // 版本不匹配则失效
            if (row.cacheVersion !== this.config.cacheVersion) {
              return resolve(null);
            }
            resolve(row);
          };
          req.onerror = () => resolve(null);
        } catch (_) {
          resolve(null);
        }
      });
    },

    async _cacheSet(url, buffer, mimeType) {
      if (!this.config.enableCache) return;
      await this._ensureDB().catch(() => null);
      if (!this._db) return;
      return new Promise((resolve) => {
        try {
          const tx = this._db.transaction(STORE_NAME, 'readwrite');
          const store = tx.objectStore(STORE_NAME);
          store.put({
            url,
            buffer,
            mimeType: mimeType || 'application/octet-stream',
            ts: Date.now(),
            size: buffer.byteLength,
            cacheVersion: this.config.cacheVersion,
          });
          tx.oncomplete = () => resolve();
          tx.onerror = () => resolve();
        } catch (_) {
          resolve();
        }
      });
    },

    /* -------- URL 解析 -------- */
    /**
     * 根据相对路径生成候选 URL 列表（远端优先 → 本地兜底）
     * @param {string} relativePath - 资源相对路径，如 "mailfile/bgm/qingqing.mp3"
     * @returns {string[]} 候选完整 URL 数组
     */
    resolveCandidates(relativePath) {
      const p = String(relativePath || '');
      if (/^(data:|blob:|https?:\/\/)/i.test(p)) return [p];
      const clean = p.replace(/^\.\//, '').replace(/^\//, '');
      const remotes = this.config.remoteBaseUrls.map((b) => b + clean);
      const local = cleanBase(this.config.localBaseUrl) + clean;
      return unique([...remotes, local]);
    },

    /* -------- 核心加载 -------- */
    /**
     * 以 ArrayBuffer 形式加载资源（带缓存 + 多源回退 + 自动重试）
     * @returns {Promise<{buffer: ArrayBuffer, mimeType: string, from: 'cache'|'remote'|'local'}>}
     */
    async loadBuffer(relativePath, opts = {}) {
      const candidates = this.resolveCandidates(relativePath);
      const cacheKey = candidates[candidates.length - 1] || relativePath;

      // 1) 先查缓存
      if (!opts.bypassCache) {
        const hit = await this._cacheGet(cacheKey);
        if (hit && hit.buffer) {
          this._stats.cacheHits++;
          return {
            buffer: hit.buffer,
            mimeType: hit.mimeType,
            from: 'cache',
            url: cacheKey,
          };
        }
      }
      this._stats.cacheMisses++;

      // 去重请求
      if (this._pendingRequests.has(cacheKey)) {
        return this._pendingRequests.get(cacheKey);
      }

      const task = (async () => {
        let lastErr = null;
        // 2) 依次尝试所有候选源（支持每个源重试）
        for (let i = 0; i < candidates.length; i++) {
          const url = candidates[i];
          for (let attempt = 0; attempt < this.config.maxRetries; attempt++) {
            try {
              const res = await fetch(url, {
                cache: opts.bypassCache ? 'no-cache' : 'default',
                mode: /^https?:\/\//i.test(url) ? 'cors' : 'same-origin',
              });
              if (!res.ok) {
                throw new Error(`HTTP ${res.status}`);
              }
              const mimeType = res.headers.get('Content-Type') || 'application/octet-stream';
              const blob = await res.blob();
              const buffer = await toArrayBuffer(blob);
              const source = i < this.config.remoteBaseUrls.length ? 'remote' : 'local';
              if (source === 'remote') this._stats.remoteLoads++;
              else this._stats.localLoads++;
              // 3) 写入缓存
              await this._cacheSet(cacheKey, buffer, mimeType);
              return { buffer, mimeType, from: source, url: cacheKey };
            } catch (err) {
              lastErr = err;
              // 指数退避
              const delay = 200 * Math.pow(2, attempt);
              await new Promise((r) => setTimeout(r, delay));
            }
          }
        }
        this._stats.failures++;
        throw new Error(`[ResourceManager] Failed to load ${relativePath}: ${lastErr?.message || 'all sources failed'}`);
      })();

      this._pendingRequests.set(cacheKey, task);
      task.finally(() => this._pendingRequests.delete(cacheKey));
      return task;
    },

    /**
     * 加载为 Blob URL（可用于 <audio src> / <img src> / CSS url 等）
     * 注意：用完需要调用 revokeBlobUrl 释放
     */
    async loadBlobUrl(relativePath, opts = {}) {
      const { buffer, mimeType } = await this.loadBuffer(relativePath, opts);
      const blob = new Blob([buffer], { type: mimeType });
      return URL.createObjectURL(blob);
    },

    revokeBlobUrl(url) {
      if (url && /^blob:/i.test(url)) {
        try { URL.revokeObjectURL(url); } catch (_) {}
      }
    },

    /**
     * 加载为 Image 元素
     */
    async loadImage(relativePath, opts = {}) {
      const blobUrl = await this.loadBlobUrl(relativePath, opts);
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => {
          this.revokeBlobUrl(blobUrl);
          reject(new Error(`Failed to decode image: ${relativePath}`));
        };
        img.src = blobUrl;
      });
    },

    /**
     * 加载为 Audio 元素
     */
    async loadAudio(relativePath, opts = {}) {
      const blobUrl = await this.loadBlobUrl(relativePath, opts);
      const audio = new Audio();
      audio.preload = opts.preload || 'auto';
      return new Promise((resolve, reject) => {
        audio.addEventListener('canplaythrough', () => resolve(audio), { once: true });
        audio.addEventListener('error', () => {
          this.revokeBlobUrl(blobUrl);
          reject(new Error(`Failed to load audio: ${relativePath}`));
        }, { once: true });
        audio.src = blobUrl;
      });
    },

    /**
     * 清除缓存（可指定版本变动时调用）
     */
    async clearCache() {
      if (!this._db) await this._ensureDB().catch(() => null);
      if (!this._db) return;
      return new Promise((resolve) => {
        try {
          const tx = this._db.transaction(STORE_NAME, 'readwrite');
          tx.objectStore(STORE_NAME).clear();
          tx.oncomplete = () => resolve();
          tx.onerror = () => resolve();
        } catch (_) { resolve(); }
      });
    },

    /**
     * 获取缓存统计
     */
    async getCacheStats() {
      if (!this._db) await this._ensureDB().catch(() => null);
      if (!this._db) return { count: 0, size: 0 };
      return new Promise((resolve) => {
        try {
          const tx = this._db.transaction(STORE_NAME, 'readonly');
          const store = tx.objectStore(STORE_NAME);
          let count = 0;
          let size = 0;
          store.openCursor().onsuccess = (e) => {
            const cur = e.target.result;
            if (cur) {
              count++;
              size += cur.value.size || 0;
              cur.continue();
            } else {
              resolve({ count, size });
            }
          };
        } catch (_) { resolve({ count: 0, size: 0 }); }
      });
    },
  };

  // 导出
  global.ResourceManager = ResourceManager;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = ResourceManager;
  }
})(typeof window !== 'undefined' ? window : globalThis);
