export class Mailbox {
  constructor(raw = {}) {
    if (!raw.id) throw new Error('Mailbox: id is required');
    this.id = String(raw.id);
    this.name = String(raw.name || '未命名信箱');
    this.description = String(raw.desc || raw.description || '');
    this.mailboxCode = String(raw.mailboxCode || raw.joinCode || raw.code || '').toUpperCase();
    this.joinCode = this.mailboxCode;
    this.ownerAccountKey = String(raw.ownerAccountKey || '').toLowerCase();
    this.memberAccountKeys = [...new Set((raw.memberAccountKeys || []).map(key => String(key).toLowerCase()).filter(Boolean))];
    this.visibility = raw.visibility === 'private' ? 'private' : 'public';
    this.isCustom = raw.isCustom !== false;
    this.icon = raw.icon || '📫';
    this.mapBackground = raw.mapBackground || null;
    this.createdAt = raw.createdAt || Date.now();
    this.updatedAt = raw.updatedAt || this.createdAt;
  }

  hasMember(accountKey) { return this.memberAccountKeys.includes(String(accountKey || '').toLowerCase()); }
  canView(accountKey) { return this.visibility === 'public' || this.ownerAccountKey === String(accountKey || '').toLowerCase() || this.hasMember(accountKey); }
  join(accountKey) {
    const key = String(accountKey || '').trim().toLowerCase();
    if (!key) return false;
    if (!this.memberAccountKeys.includes(key)) this.memberAccountKeys.push(key);
    this.updatedAt = Date.now();
    return true;
  }
  toJSON() { return { id: this.id, name: this.name, desc: this.description, mailboxCode: this.mailboxCode, joinCode: this.joinCode, code: this.mailboxCode, ownerAccountKey: this.ownerAccountKey, memberAccountKeys: [...this.memberAccountKeys], visibility: this.visibility, isCustom: this.isCustom, icon: this.icon, mapBackground: this.mapBackground, createdAt: this.createdAt, updatedAt: this.updatedAt }; }
}

export default Mailbox;
