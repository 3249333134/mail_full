// QuestSystem 管理器（Phase 0：空壳最小实现，Phase 6 完整接入）
import { Quest, QuestState } from './Quest.js';
import { deepMerge, RemoteResourceLoader } from '../remote/RemoteResourceLoader.js';
import { SAMPLE_QUEST_DEFS } from '../data/quests.sample.js';

export const QuestSystem = {
  _defs: new Map(),
  _instances: new Map(),
  _bootstrapped: false,

  async bootstrap({ useRemote = true } = {}) {
    if (this._bootstrapped) return;
    let remote = null;
    if (useRemote) { try { remote = await RemoteResourceLoader.loadQuests(); } catch(_){} }
    const remoteData = remote || {};
    Object.entries({ ...SAMPLE_QUEST_DEFS }).forEach(([id, def]) => {
      const merged = deepMerge(def, remoteData[id] || {});
      this._defs.set(id, merged);
    });
    this._bootstrapped = true;
  },

  getQuestDef(id) { return this._defs.get(id) || null; },

  accept(charId, questId) {
    const def = this._defs.get(questId);
    if (!def) return { ok: false, reason: 'not_found' };
    const key = `${charId}:${questId}`;
    let inst = this._instances.get(key);
    if (!inst) {
      inst = new Quest(def);
      this._instances.set(key, inst);
    }
    inst.accept();
    return { ok: true, quest: inst };
  },

  broadcastEvent(evt, charIds = []) {
    this._instances.forEach((inst, key) => {
      const [cid] = key.split(':');
      if (charIds.length === 0 || charIds.includes(cid)) inst.onEvent(evt);
    });
  },

  claim(charId, questId, inventory) {
    const inst = this._instances.get(`${charId}:${questId}`);
    if (!inst) return { ok: false, reason: 'not_accepted' };
    return inst.claim(inventory);
  },

  getAcceptedQuests(charId) {
    const out = [];
    this._instances.forEach((inst, key) => {
      const [cid] = key.split(':');
      if (cid === charId && inst.state !== QuestState.UNACCEPTED) out.push(inst);
    });
    return out;
  },
};

export default QuestSystem;
