function cleanBase(value) {
  const base = String(value || '').trim();
  return base ? `${base.replace(/\/+$/, '')}/` : '';
}

function unique(values) { return [...new Set(values.filter(Boolean))]; }

export const RemoteResourceLoader = {
  manifestBaseUrls: [], assetBaseUrls: [], localManifestBaseUrl: '/assets/game/',
  localAssetBaseUrl: './sendbox/src/assets/', version: 'local', _cache: new Map(), _configured: false,

  configure(config = {}) {
    this.manifestBaseUrls = unique((config.manifestBaseUrls || []).map(cleanBase));
    this.assetBaseUrls = unique((config.assetBaseUrls || []).map(cleanBase));
    this.localManifestBaseUrl = cleanBase(config.localManifestBaseUrl || this.localManifestBaseUrl);
    this.localAssetBaseUrl = cleanBase(config.localAssetBaseUrl || this.localAssetBaseUrl);
    this.version = String(config.resourceVersion || config.version || this.version);
    this._configured = true;
    return this.getConfig();
  },

  getConfig() { return { manifestBaseUrls: [...this.manifestBaseUrls], assetBaseUrls: [...this.assetBaseUrls], localManifestBaseUrl: this.localManifestBaseUrl, localAssetBaseUrl: this.localAssetBaseUrl, resourceVersion: this.version }; },

  async bootstrapConfig() {
    try {
      const response = await fetch('/api/game/bootstrap', { cache: 'no-cache' });
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
    const clean = path.replace(/^\.\//, '').replace(/^\//, '');
    return unique([...this.assetBaseUrls.map(base => `${base}${clean}`), `${cleanBase(localBase)}${clean}`]);
  },

  loadCharacters(options) { return this._loadManifest('characters.json', options); },
  loadMaps(options) { return this._loadManifest('maps.json', options); },
  loadItems(options) { return this._loadManifest('items.json', options); },
  loadQuests(options) { return this._loadManifest('quests.json', options); },
  resetCache() { this._cache.clear(); },
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
