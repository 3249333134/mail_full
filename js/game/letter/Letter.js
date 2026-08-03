// Letter 实例类（Phase 0：最小实现，Phase 5 完整接入）
function rnd6() { return Math.random().toString(36).slice(2, 8); }
function pad(n, w=2){ return String(n).padStart(w,'0'); }
function weekdayCN(d){ return ['周日','周一','周二','周三','周四','周五','周六'][d.getDay()]; }

export class Letter {
  constructor(raw = {}) {
    const now = Date.now();
    const d = new Date();

    this.id = raw.id || ('letter-' + now + '-' + rnd6());
    this.mailboxId = raw.mailboxId || null;
    this.status = raw.status || 'draft'; // draft/pending/delivering/delivered/read

    this.from = raw.from || null;
    this.to = Array.isArray(raw.to) ? raw.to.map(t => ({ claimedAttachments: false, ...t })) : [];

    this.title = raw.title || '';
    this.body = raw.body || '';
    this.pages = raw.pages || null;
    this.paperStyle = raw.paperStyle || 'vintage-literary';
    this.envelopeStyle = raw.envelopeStyle || 'kraft-brown';

    this.attachments = raw.attachments || [];
    this.itemAttachmentIds = Array.isArray(raw.itemAttachmentIds) ? raw.itemAttachmentIds.slice(0, 8) : [];
    this.frameStyles = raw.frameStyles || null;
    this.attachmentSenderSnapshot = raw.attachmentSenderSnapshot || null;

    this.delivery = raw.delivery || null;

    this.createdAt = raw.createdAt || now;
    this.updatedAt = raw.updatedAt || now;
    this.deliveredAt = raw.deliveredAt || null;
    this.readAt = raw.readAt || null;

    // 元信息（保持与 editor.js 兼容）
    this.date = raw.date || `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日`;
    this.time = raw.time || `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    this.weekday = raw.weekday || weekdayCN(d);
    this.location = raw.location || '';
    this.bgm = raw.bgm || null;
    this.recording = raw.recording || null;

    // 兼容 editor.js letter 老结构字段
    this.letterTitle = raw.letterTitle || this.title;
    this.recipient = raw.recipient || (this.to[0]?.displayName || '');
    this.sender = raw.sender || (this.from?.displayName || '');
    this.author = raw.author || this.from || null;
    this.content = raw.content || (Array.isArray(this.body) ? this.body : []);
  }

  areAttachmentsClaimedBy(userId) {
    const t = this.to.find(x => x.userId === userId);
    return !!t?.claimedAttachments;
  }

  markAttachmentsClaimed(userId) {
    const t = this.to.find(x => x.userId === userId);
    if (t) t.claimedAttachments = true;
    this.updatedAt = Date.now();
  }

  toJSON() {
    return {
      id: this.id, mailboxId: this.mailboxId, status: this.status,
      from: this.from, to: this.to,
      title: this.title, body: this.body, pages: this.pages,
      paperStyle: this.paperStyle, envelopeStyle: this.envelopeStyle,
      attachments: this.attachments,
      itemAttachmentIds: [...this.itemAttachmentIds],
      frameStyles: this.frameStyles,
      attachmentSenderSnapshot: this.attachmentSenderSnapshot,
      delivery: this.delivery,
      createdAt: this.createdAt, updatedAt: this.updatedAt,
      deliveredAt: this.deliveredAt, readAt: this.readAt,
      date: this.date, time: this.time, weekday: this.weekday,
      location: this.location, bgm: this.bgm, recording: this.recording,
      // 兼容旧字段
      letterTitle: this.letterTitle || this.title,
      recipient: this.recipient || (this.to[0]?.displayName || ''),
      sender: this.sender || (this.from?.displayName || ''),
      author: this.author || this.from,
      content: this.content || (Array.isArray(this.body) ? this.body : []),
    };
  }

  static fromJSON(j) { return new Letter(j || {}); }
}
export default Letter;
