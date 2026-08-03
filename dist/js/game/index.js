import { RemoteResourceLoader, deepMerge } from './remote/RemoteResourceLoader.js';
import { InventorySystem } from './inventory/InventorySystem.js';
import { CharacterSystem } from './character/CharacterSystem.js';
import { MapSystem } from './map/MapSystem.js';
import { QuestSystem } from './quest/QuestSystem.js';
import { LetterSystem } from './letter/LetterSystem.js';
import { MailboxSystem } from './mailbox/MailboxSystem.js';

export { RemoteResourceLoader, deepMerge, InventorySystem, CharacterSystem, MapSystem, QuestSystem, LetterSystem, MailboxSystem };

export const GameSystems = {
  _bootstrapped: false, _promise: null, status: 'idle', source: 'local',
  async bootstrap({ skipRemote = false } = {}) {
    if (this._promise) return this._promise;
    this.status = 'loading';
    this._promise = (async () => {
      const bootstrap = skipRemote ? null : await RemoteResourceLoader.bootstrapConfig();
      if (bootstrap?.itemDefinitions) InventorySystem.applyDefinitions(bootstrap.itemDefinitions);
      const itemDefs = await InventorySystem.bootstrap({ useRemote: !skipRemote });
      CharacterSystem.ensureLocal(itemDefs);
      MapSystem.ensureLocal(itemDefs);
      if (bootstrap?.characterDefinitions) CharacterSystem.applyDefinitions(bootstrap.characterDefinitions);
      if (bootstrap?.mapDefinitions) MapSystem.applyDefinitions(bootstrap.mapDefinitions);
      if (!skipRemote) {
        await Promise.all([CharacterSystem.bootstrap(itemDefs), MapSystem.bootstrap(itemDefs), QuestSystem.bootstrap?.({ useRemote: true })]);
      }
      this.source = bootstrap ? (RemoteResourceLoader.assetBaseUrls.length ? 'remote' : 'server-local') : 'local';
      this.status = 'ready'; this._bootstrapped = true;
      if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('game-systems:ready', { detail: this.getStatus() }));
      return this;
    })().catch(error => { this.status = 'fallback'; this.source = 'local'; this._bootstrapped = true; console.warn('[GameSystems] 使用本地资源：', error?.message || error); return this; });
    return this._promise;
  },
  getStatus() { return { ready: this._bootstrapped, status: this.status, source: this.source, resourceVersion: RemoteResourceLoader.version }; },
  resolveAssetUrl(path) { return RemoteResourceLoader.resolveAssetCandidates(path)[0] || path; },
};

if (typeof window !== 'undefined') window.GameSystems = GameSystems;
export default GameSystems;
