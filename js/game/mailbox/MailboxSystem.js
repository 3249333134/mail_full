import { Mailbox } from './Mailbox.js';

export const MailboxSystem = {
  _cache: new Map(),
  register(raw) { const mailbox = raw instanceof Mailbox ? raw : new Mailbox(raw); this._cache.set(mailbox.id, mailbox); return mailbox; },
  registerMany(rows = []) { return rows.map(row => this.register(row)); },
  get(id) { return this._cache.get(id) || null; },
  list({ accountKey = '', includeDirectory = false } = {}) { return [...this._cache.values()].filter(mailbox => includeDirectory || mailbox.canView(accountKey)); },
  findByCode(code) { const normalized = String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, ''); return [...this._cache.values()].find(mailbox => mailbox.mailboxCode === normalized) || null; },
  clear() { this._cache.clear(); },
};

export default MailboxSystem;
