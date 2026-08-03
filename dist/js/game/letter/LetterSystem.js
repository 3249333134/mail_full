// LetterSystem 门面（Phase 0：空壳 API，Phase 5 完整实现对接 editor/mailbox/app）
import { Letter } from './Letter.js';
import { InventorySystem } from '../inventory/InventorySystem.js';

function noop() { return Promise.resolve(); }
// 真实存储：Phase 5 对接 STORAGE / MongoDAO / MailService
let STORAGE_ADAPTER = {
  saveLetter: (l) => noop(l),
  queryLetters: (q) => Promise.resolve([]),
};

export const LetterSystem = {
  setStorageAdapter(adapter) { STORAGE_ADAPTER = { ...STORAGE_ADAPTER, ...adapter }; },

  createDraft(mailboxId, { sender } = {}) {
    return new Letter({ mailboxId, from: sender || null, status: 'draft' });
  },

  async saveDraft(letter) {
    if (!(letter instanceof Letter)) letter = new Letter(letter);
    letter.status = 'draft';
    letter.updatedAt = Date.now();
    await STORAGE_ADAPTER.saveLetter(letter);
    return letter;
  },

  attachItem(letter, senderInventory, itemInstanceId, qty = 1) {
    if (!(letter instanceof Letter)) letter = new Letter(letter);
    const item = senderInventory?.items?.find(i => i.instanceId === itemInstanceId);
    if (!item) return { ok: false, reason: 'item_not_in_backpack' };
    const defId = item.defId;
    if (!InventorySystem.isPortable(defId)) return { ok: false, reason: 'not_portable' };
    if ((item.qty || 1) < qty) return { ok: false, reason: 'qty_insufficient' };
    senderInventory.removeByInstanceId(itemInstanceId, qty);
    const existing = letter.attachments.find(a => a.defId === defId);
    if (existing) existing.qty = (existing.qty || 0) + qty;
    else letter.attachments.push({ defId, qty });
    letter.attachmentSenderSnapshot = senderInventory.toJSON?.() || null;
    letter.updatedAt = Date.now();
    return { ok: true };
  },

  detachItem(letter, senderInventory, attachmentIdx, qty = null) {
    if (!(letter instanceof Letter)) letter = new Letter(letter);
    const att = letter.attachments[attachmentIdx];
    if (!att) return { ok: false, reason: 'attachment_not_found' };
    const realQty = qty ?? att.qty;
    senderInventory.add?.(att.defId, realQty);
    att.qty -= realQty;
    if (att.qty <= 0) letter.attachments.splice(attachmentIdx, 1);
    letter.updatedAt = Date.now();
    return { ok: true };
  },

  async send(letter, { /*deliveryConfig,*/ persistImmediately = true } = {}) {
    if (!(letter instanceof Letter)) letter = new Letter(letter);
    if (letter.status !== 'draft') return { ok: false, reason: 'status_not_draft' };
    if (!letter.to.length) return { ok: false, reason: 'no_recipient' };
    letter.status = 'pending';
    letter.updatedAt = Date.now();
    if (persistImmediately) await STORAGE_ADAPTER.saveLetter(letter);
    return { ok: true, letter };
  },

  receiveOpen(letter, { readerUserId, readerInventory } = {}) {
    if (!(letter instanceof Letter)) letter = new Letter(letter);
    if (letter.status === 'delivered') { letter.status = 'read'; letter.readAt = Date.now(); }
    letter.updatedAt = Date.now();
    let addedAttachments = [];
    if (letter.attachments.length && readerUserId != null && !letter.areAttachmentsClaimedBy(readerUserId)) {
      letter.attachments.forEach(a => {
        const r = readerInventory.add?.(a.defId, a.qty) || { added: [] };
        addedAttachments.push({ defId: a.defId, qty: a.qty, instanceIds: r.added });
      });
      letter.markAttachmentsClaimed(readerUserId);
    }
    STORAGE_ADAPTER.saveLetter(letter).catch(()=>{});
    return { letter, addedAttachments };
  },

  async getInbox(mailboxId, userId) {
    return STORAGE_ADAPTER.queryLetters({ mailboxId, toUserId: userId });
  },
  async getOutbox(mailboxId, userId) {
    return STORAGE_ADAPTER.queryLetters({ mailboxId, fromUserId: userId });
  },
};

export default LetterSystem;
