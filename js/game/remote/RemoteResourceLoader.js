function cleanBase(value) {
  const base = String(value || '').trim();
  return base ? `${base.replace(/\/+$/, '')}/` : '';
}

function unique(values) { return [...new Set(values.filter(Boolean))]; }

/** 规范化相对路径：解析 ./ 与 ../ 段（如 ../../fill/... → fill/...） */
function normalizeRelPath(raw) {
  const segs = String(raw || '').split('/');
  const out = [];
  for (const seg of segs) {
    if (!seg || seg === '.') continue;
    if (seg === '..') { out.pop(); continue; }
    out.push(seg);
  }
  return out.join('/');
}

export const RemoteResourceLoader = {
  manifestBaseUrls: [], assetBaseUrls: [], assetApiBaseUrl: '', localManifestBaseUrl: '/assets/game/',
  localAssetBaseUrl: './sendbox/src/assets/', version: 'local', _cache: new Map(), _configured: false,

  configure(config = {}) {
    this.manifestBaseUrls = unique((config.manifestBaseUrls || []).map(cleanBase));
    this.assetBaseUrls = unique((config.assetBaseUrls || []).map(cleanBase));
    // 双端互通：资产 API 代理源（MySQL 主存 + 磁盘缓存），优先于 CDN 与本地
    this.assetApiBaseUrl = cleanBase(config.assetApiBaseUrl || '');
    this.localManifestBaseUrl = cleanBase(config.localManifestBaseUrl || this.localManifestBaseUrl);
    this.localAssetBaseUrl = cleanBase(config.localAssetBaseUrl || this.localAssetBaseUrl);
    this.version = String(config.resourceVersion || config.version || this.version);
    this._configured = true;
    return this.getConfig();
  },

  getConfig() { return { manifestBaseUrls: [...this.manifestBaseUrls], assetBaseUrls: [...this.assetBaseUrls], assetApiBaseUrl: this.assetApiBaseUrl, localManifestBaseUrl: this.localManifestBaseUrl, localAssetBaseUrl: this.localAssetBaseUrl, resourceVersion: this.version }; },

  _apiBaseUrl() {
    // 从 MailService 拿后端绝对地址（兼容 3005/3006 及跨机器），失败时回退相对路径
    try {
      if (typeof window !== 'undefined' && window.MailService && typeof window.MailService.getBaseUrl === 'function') {
        const base = String(window.MailService.getBaseUrl() || '').replace(/\/+$/, '');
        if (base) return `${base}/api/game/bootstrap`;
      }
    } catch (_) {}
    return '/api/game/bootstrap';
  },

  async bootstrapConfig() {
    try {
      const response = await fetch(this._apiBaseUrl(), { cache: 'no-cache', mode: 'cors' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = await response.json();
      this.configure(payload.resources || payload);
      this._bootstrapPayload = payload;
      return payload;
    } catch (_) {
      this.configure({});
      return null;
    }
  },

  async _loadManifest(filename, { bypassCache = false } = {}) {
    const key = `${this.version}:${filename}`;
    if (!bypassCache && this._cache.has(key)) return this._cache.get(key);
    const bases = unique([...this.manifestBaseUrls, this.localManifestBaseUrl]);
    for (const base of bases) {
      try {
        const join = `${base}${filename}${filename.includes('?') ? '&' : '?'}v=${encodeURIComponent(this.version)}`;
        const response = await fetch(join, { cache: 'no-cache', mode: 'cors' });
        if (!response.ok) continue;
        const data = await response.json();
        if (!data || typeof data !== 'object' || Array.isArray(data)) continue;
        this._cache.set(key, data);
        return data;
      } catch (_) {}
    }
    return null;
  },

  resolveAssetCandidates(relativePath, localBase = this.localAssetBaseUrl) {
    const path = String(relativePath || '');
    if (/^(data:|blob:|https?:\/\/)/i.test(path)) return [path];
    // 规范化相对路径：解析 ./ 与 ../ 段，避免生成含 .. 的 API URL（服务器会拒绝穿越路径）
    const norm = normalizeRelPath(path.replace(/^\.\//, ''));
    // 映射到 MySQL 存储前缀：assets 资源存 sendbox/src/assets/...，角色帧存 sendbox/fill/...
    let apiRel = norm;
    if (!apiRel.startsWith('sendbox/')) {
      if (apiRel.startsWith('fill/')) {
        apiRel = `sendbox/fill/${apiRel.slice(5)}`;
      } else {
        apiRel = `sendbox/src/assets/${apiRel}`;
      }
    }
    // 本地静态兜底：fill 帧在 sendbox/fill/，其余在 sendbox/src/assets/
    const localCandidates = [cleanBase(localBase) + norm];
    if (norm.startsWith('fill/')) {
      localCandidates.push(`./sendbox/fill/${norm.slice(5)}`);
    } else if (!norm.startsWith('sendbox/')) {
      localCandidates.push(`./sendbox/${norm}`);
    }
    // 优先级：资产 API（MySQL 主存，双端互通）→ CDN/备用 → 本地静态
    return unique([
      ...(this.assetApiBaseUrl ? [this.assetApiBaseUrl + apiRel] : []),
      ...this.assetBaseUrls.map(base => `${base}${norm}`),
      ...localCandidates
    ]);
  },

  loadCharacters(options) { return this._loadManifest('characters.json', options); },
  loadMaps(options) { return this._loadManifest('maps.json', options); },
  loadItems(options) { return this._loadManifest('items.json', options); },
  loadQuests(options) { return this._loadManifest('quests.json', options); },
  resetCache() { this._cache.clear(); },

  /** 获取 bootstrap 响应中服务端返回的角色/地图定义（含自定义上传的） */
  getBootstrapCharacters() {
    return (this._bootstrapPayload && this._bootstrapPayload.characterDefinitions) || {};
  },
  getBootstrapMaps() {
    return (this._bootstrapPayload && this._bootstrapPayload.mapDefinitions) || {};
  },
  getCustomCharacterIds() {
    return (this._bootstrapPayload && this._bootstrapPayload.customCharacters) || [];
  },
  getCustomMapKeys() {
    return (this._bootstrapPayload && this._bootstrapPayload.customMaps) || [];
  },
};

export function deepMerge(local, remote) {
  if (remote === null || remote === undefined) return local;
  if (local === null || local === undefined) return remote;
  if (Array.isArray(remote) || Array.isArray(local)) return remote ?? local;
  if (typeof remote !== 'object' || typeof local !== 'object') return remote;
  const out = { ...local };
  Object.keys(remote).forEach(key => { out[key] = deepMerge(local[key], remote[key]); });
  return out;
}

export default RemoteResourceLoader;
