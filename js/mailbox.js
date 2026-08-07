/* ========================================
   信笺 — 信箱管理模块
   ======================================== */

const MailboxManager = {
  // 信封/邮筒SVG图标生成器
  _getMailboxIconSVG(mailbox) {
    const icons = {
      'mailbox-may': `<svg viewBox="0 0 80 80" width="100%" height="100%"><defs><linearGradient id="env1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#fcd5e5"/><stop offset="100%" style="stop-color:#f8bbd9"/></linearGradient></defs><rect x="10" y="25" width="60" height="40" rx="3" fill="url(#env1)" stroke="${mailbox.cardAccent || mailbox.accent}" stroke-width="1.5"/><path d="M10 28 L40 48 L70 28" fill="none" stroke="${mailbox.cardAccent || mailbox.accent}" stroke-width="1.5"/><path d="M10 25 L40 45 L70 25" fill="${mailbox.cardAccent || mailbox.accent}" opacity="0.3"/><circle cx="40" cy="60" r="6" fill="${mailbox.cardAccent || mailbox.accent}"/><path d="M37 58 L40 62 L45 56" stroke="white" stroke-width="1.5" fill="none"/><text x="40" y="18" text-anchor="middle" font-size="12" fill="${mailbox.cardAccent || mailbox.accent}">🌸</text></svg>`,

      'mailbox-winter': `<svg viewBox="0 0 80 80" width="100%" height="100%"><defs><linearGradient id="env2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#e3f2fd"/><stop offset="100%" style="stop-color:#bbdefb"/></linearGradient></defs><rect x="15" y="30" width="50" height="35" rx="2" fill="url(#env2)" stroke="${mailbox.cardAccent || mailbox.accent}" stroke-width="1.5"/><rect x="30" y="20" width="20" height="15" rx="2" fill="${mailbox.cardAccent || mailbox.accent}"/><path d="M15 32 L40 50 L65 32" fill="none" stroke="${mailbox.cardAccent || mailbox.accent}" stroke-width="1.5"/><circle cx="40" cy="47" r="5" fill="${mailbox.cardAccent || mailbox.accent}"/><text x="40" y="17" text-anchor="middle" font-size="10" fill="${mailbox.cardAccent || mailbox.accent}">❄️</text></svg>`,

      'mailbox-time': `<svg viewBox="0 0 80 80" width="100%" height="100%"><defs><linearGradient id="env3" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#fff8e1"/><stop offset="100%" style="stop-color:#ffecb3"/></linearGradient></defs><rect x="12" y="35" width="56" height="32" rx="3" fill="url(#env3)" stroke="${mailbox.cardAccent || mailbox.accent}" stroke-width="1.5"/><rect x="28" y="25" width="24" height="14" rx="2" fill="${mailbox.cardAccent || mailbox.accent}"/><rect x="25" y="22" width="30" height="6" rx="1" fill="${mailbox.cardAccent || mailbox.accent}" opacity="0.7"/><line x1="12" y1="45" x2="68" y2="45" stroke="${mailbox.cardAccent || mailbox.accent}" stroke-width="1" opacity="0.5"/><circle cx="40" cy="55" r="4" fill="${mailbox.cardAccent || mailbox.accent}"/><text x="40" y="20" text-anchor="middle" font-size="10" fill="${mailbox.cardAccent || mailbox.accent}">🕰️</text></svg>`,

      'mailbox-moon': `<svg viewBox="0 0 80 80" width="100%" height="100%"><defs><linearGradient id="env4" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#f3e5f5"/><stop offset="100%" style="stop-color:#e1bee7"/></linearGradient></defs><ellipse cx="40" cy="50" rx="28" ry="20" fill="url(#env4)" stroke="${mailbox.cardAccent || mailbox.accent}" stroke-width="1.5"/><path d="M40 32 A18 18 0 0 1 58 50" fill="none" stroke="${mailbox.cardAccent || mailbox.accent}" stroke-width="1.5"/><path d="M40 32 A18 18 0 0 0 22 50" fill="${mailbox.cardAccent || mailbox.accent}" opacity="0.2"/><circle cx="40" cy="52" r="5" fill="${mailbox.cardAccent || mailbox.accent}"/><text x="40" y="22" text-anchor="middle" font-size="14" fill="${mailbox.cardAccent || mailbox.accent}">🌙</text></svg>`,

      'mailbox-forest': `<svg viewBox="0 0 80 80" width="100%" height="100%"><defs><linearGradient id="env5" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#e8f5e9"/><stop offset="100%" style="stop-color:#c8e6c9"/></linearGradient></defs><rect x="20" y="30" width="40" height="38" rx="4" fill="url(#env5)" stroke="${mailbox.cardAccent || mailbox.accent}" stroke-width="1.5"/><rect x="32" y="20" width="16" height="14" rx="2" fill="${mailbox.cardAccent || mailbox.accent}"/><circle cx="40" cy="52" r="8" fill="${mailbox.cardAccent || mailbox.accent}" opacity="0.3"/><rect x="36" y="48" width="8" height="10" rx="1" fill="${mailbox.cardAccent || mailbox.accent}"/><text x="40" y="18" text-anchor="middle" font-size="10" fill="${mailbox.cardAccent || mailbox.accent}">🌲</text></svg>`,

      'mailbox-autumn': `<svg viewBox="0 0 80 80" width="100%" height="100%"><defs><linearGradient id="env6" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#fff3e0"/><stop offset="100%" style="stop-color:#ffe0b2"/></linearGradient></defs><path d="M15 35 Q15 25 25 25 L55 25 Q65 25 65 35 L65 55 Q65 65 55 65 L25 65 Q15 65 15 55 Z" fill="url(#env6)" stroke="${mailbox.cardAccent || mailbox.accent}" stroke-width="1.5"/><rect x="30" y="18" width="20" height="10" rx="2" fill="${mailbox.cardAccent || mailbox.accent}"/><ellipse cx="40" cy="48" rx="12" ry="8" fill="${mailbox.cardAccent || mailbox.accent}" opacity="0.2"/><path d="M32 48 Q40 42 48 48 Q40 54 32 48" fill="${mailbox.cardAccent || mailbox.accent}" opacity="0.4"/><text x="40" y="15" text-anchor="middle" font-size="10" fill="${mailbox.cardAccent || mailbox.accent}">🍂</text></svg>`,

      'mailbox-brenuo': `<svg viewBox="0 0 80 80" width="100%" height="100%"><defs><linearGradient id="env7" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#faf5f0"/><stop offset="100%" style="stop-color:#f5efe5"/></linearGradient></defs><rect x="12" y="28" width="56" height="40" rx="3" fill="url(#env7)" stroke="${mailbox.cardAccent || mailbox.accent}" stroke-width="1.5"/><path d="M12 30 L40 52 L68 30" fill="none" stroke="${mailbox.cardAccent || mailbox.accent}" stroke-width="1.5"/><circle cx="40" cy="55" r="6" fill="${mailbox.cardAccent || mailbox.accent}"/><path d="M35 55 L40 60 L45 55" fill="none" stroke="#fff" stroke-width="1.5"/><text x="40" y="22" text-anchor="middle" font-size="12" fill="${mailbox.cardAccent || mailbox.accent}">📜</text></svg>`,

      'mailbox-rugu': `<svg viewBox="0 0 80 80" width="100%" height="100%"><defs><linearGradient id="env8" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#f7fafc"/><stop offset="100%" style="stop-color:#edf2f7"/></linearGradient></defs><rect x="12" y="28" width="56" height="40" rx="2" fill="url(#env8)" stroke="${mailbox.cardAccent || mailbox.accent}" stroke-width="1.5"/><path d="M12 30 L40 52 L68 30" fill="none" stroke="${mailbox.cardAccent || mailbox.accent}" stroke-width="1.5"/><circle cx="40" cy="55" r="6" fill="${mailbox.cardAccent || mailbox.accent}"/><path d="M36 55 L40 59 L44 55 L40 51 Z" fill="#fff"/><text x="40" y="22" text-anchor="middle" font-size="12" fill="${mailbox.cardAccent || mailbox.accent}">⚔️</text></svg>`,

      'mailbox-taozhi': `<svg viewBox="0 0 80 80" width="100%" height="100%"><defs><linearGradient id="env9" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#f0fff4"/><stop offset="100%" style="stop-color:#c6f6d5"/></linearGradient></defs><rect x="12" y="28" width="56" height="40" rx="2" fill="url(#env9)" stroke="${mailbox.cardAccent || mailbox.accent}" stroke-width="1.5"/><path d="M12 30 L40 52 L68 30" fill="none" stroke="${mailbox.cardAccent || mailbox.accent}" stroke-width="1.5"/><circle cx="40" cy="55" r="6" fill="${mailbox.cardAccent || mailbox.accent}"/><path d="M37 53 L40 58 L43 53 L40 50 Z" fill="#fff"/><text x="40" y="22" text-anchor="middle" font-size="12" fill="${mailbox.cardAccent || mailbox.accent}">🍃</text></svg>`,

      'mailbox-zhaixing': `<svg viewBox="0 0 80 80" width="100%" height="100%"><defs><linearGradient id="env10" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#1a202c"/><stop offset="100%" style="stop-color:#2d3748"/></linearGradient></defs><rect x="12" y="28" width="56" height="40" rx="2" fill="url(#env10)" stroke="${mailbox.cardAccent || mailbox.accent}" stroke-width="1.5"/><path d="M12 30 L40 52 L68 30" fill="none" stroke="${mailbox.cardAccent || mailbox.accent}" stroke-width="1.5"/><circle cx="40" cy="55" r="6" fill="${mailbox.cardAccent || mailbox.accent}"/><polygon points="40,50 41.5,54 45.5,54.5 42.5,57.2 43.5,61.2 40,59 36.5,61.2 37.5,57.2 34.5,54.5 38.5,54" fill="#fff"/><text x="40" y="22" text-anchor="middle" font-size="12" fill="${mailbox.cardAccent || mailbox.accent}">⭐</text></svg>`,

      'mailbox-xiaowangzi': `<svg viewBox="0 0 80 80" width="100%" height="100%"><defs><linearGradient id="env11" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#fff5f5"/><stop offset="100%" style="stop-color:#fed7d7"/></linearGradient></defs><rect x="12" y="28" width="56" height="40" rx="2" fill="url(#env11)" stroke="${mailbox.cardAccent || mailbox.accent}" stroke-width="1.5"/><path d="M12 30 L40 52 L68 30" fill="none" stroke="${mailbox.cardAccent || mailbox.accent}" stroke-width="1.5"/><circle cx="40" cy="55" r="6" fill="${mailbox.cardAccent || mailbox.accent}"/><path d="M40 51 C40 51 38 54 36 54 C34 54 34 52 36 52 C36 52 37 51 40 51 C43 51 44 52 44 52 C46 52 46 54 44 54 C42 54 40 51 40 51 Z" fill="#fff"/><path d="M40 53 C40 53 38 55 38 56 C38 57 39 57.5 40 58 C41 57.5 42 57 42 56 C42 55 40 53 40 53 Z" fill="#fff"/><text x="40" y="22" text-anchor="middle" font-size="12" fill="${mailbox.cardAccent || mailbox.accent}">🌹</text></svg>`,

      'mailbox-tianzhu': `<svg viewBox="0 0 80 80" width="100%" height="100%"><defs><linearGradient id="env12" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#1a1a2e"/><stop offset="100%" style="stop-color:#16213e"/></linearGradient></defs><rect x="12" y="28" width="56" height="40" rx="2" fill="url(#env12)" stroke="${mailbox.cardAccent || mailbox.accent}" stroke-width="1.5"/><path d="M12 30 L40 52 L68 30" fill="none" stroke="${mailbox.cardAccent || mailbox.accent}" stroke-width="1.5"/><circle cx="40" cy="55" r="6" fill="${mailbox.cardAccent || mailbox.accent}"/><circle cx="40" cy="55" r="3" fill="#0f3460"/><path d="M40 48 L40 52 M40 58 L40 62 M33 55 L37 55 M43 55 L47 55" stroke="#1a1a2e" stroke-width="1"/><text x="40" y="22" text-anchor="middle" font-size="12" fill="${mailbox.cardAccent || mailbox.accent}">🕸️</text></svg>`,

      'mailbox-xiejian': `<svg viewBox="0 0 80 80" width="100%" height="100%"><defs><linearGradient id="env-xj" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#fff5f5"/><stop offset="100%" style="stop-color:#fed7d7"/></linearGradient></defs><rect x="12" y="28" width="56" height="40" rx="3" fill="url(#env-xj)" stroke="${mailbox.cardAccent || mailbox.accent}" stroke-width="1.5"/><path d="M12 30 L40 52 L68 30" fill="none" stroke="${mailbox.cardAccent || mailbox.accent}" stroke-width="1.5"/><circle cx="40" cy="55" r="6" fill="${mailbox.cardAccent || mailbox.accent}"/><circle cx="40" cy="55" r="2" fill="#fff"/><path d="M40 22 L36 18 L40 14 L44 18 Z" fill="${mailbox.cardAccent || mailbox.accent}"/><path d="M38 16 L40 12 L42 16" stroke="${mailbox.cardAccent || mailbox.accent}" stroke-width="1" fill="none"/><line x1="28" y1="22" x2="52" y2="22" stroke="${mailbox.cardAccent || mailbox.accent}" stroke-width="0.8" stroke-dasharray="2 2"/></svg>`,

      'mailbox-default': `<svg viewBox="0 0 80 80" width="100%" height="100%"><defs><linearGradient id="env0" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#fafafa"/><stop offset="100%" style="stop-color:#f5f5f5"/></linearGradient></defs><rect x="12" y="28" width="56" height="38" rx="3" fill="url(#env0)" stroke="${mailbox.cardAccent || mailbox.accent}" stroke-width="1.5"/><path d="M12 30 L40 50 L68 30" fill="none" stroke="${mailbox.cardAccent || mailbox.accent}" stroke-width="1.5"/><circle cx="40" cy="55" r="5" fill="${mailbox.cardAccent || mailbox.accent}"/></svg>`
    };
    return icons[mailbox.id] || icons['mailbox-default'];
  },

  defaultMailboxes: [
    {
      id: 'mailbox-brenuo',
      mailboxCode: 'BRN2A7', code: 'BRN2A7',
      name: '布雷诺来信',
      icon: '📜',
      desc: '以撒致缪宏谟的二十五封信',
      accent: '#8b4513',
      bgGradient: 'linear-gradient(135deg, #faf5f0, #f5efe5)',
      cardAccent: '#a0522d',
      attachment: {
        type: 'diary',
        name: '以撒的日记',
        icon: '📓'
      },
      location: {
        lat: 48.85,
        lng: 2.35,
        placeName: '布雷诺镇',
        region: '西欧'
      }
    },
    {
      id: 'mailbox-daliang',
      mailboxCode: 'DLG3B8', code: 'DLG3B8',
      name: '大梁来信',
      icon: '🏮',
      desc: '方慕风致锦荷的四封信',
      accent: '#8b4513',
      bgGradient: 'linear-gradient(135deg, #faf5f0, #f5efe5)',
      cardAccent: '#a0522d',
      location: {
        lat: 34.26,
        lng: 108.94,
        placeName: '大梁城',
        region: '中原'
      }
    },
    {
      id: 'mailbox-tianzhu',
      mailboxCode: 'TZH4C9', code: 'TZH4C9',
      name: '蟪蛄来信',
      icon: '🕸️',
      desc: '上官天诛致雪衣的四封信',
      accent: '#0f3460',
      bgGradient: 'linear-gradient(135deg, #1a1a2e, #16213e)',
      cardAccent: '#4a9eff',
      textColor: '#e2e8f0',
      subtitleColor: '#a0aec0',
      location: {
        lat: 55.75,
        lng: 37.62,
        placeName: '北冥雪原',
        region: '北方雪原'
      }
    },
    {
      id: 'mailbox-rugu',
      mailboxCode: 'RUG5D2', code: 'RUG5D2',
      name: '陇平来信',
      icon: '⚔️',
      desc: '李文瑙致卫子谣的十五封信',
      accent: '#4a5568',
      bgGradient: 'linear-gradient(135deg, #f7fafc, #edf2f7)',
      cardAccent: '#718096',
      location: {
        lat: 36.06,
        lng: 103.83,
        placeName: '陇平关',
        region: '西北边塞'
      }
    },
    {
      id: 'mailbox-taozhi',
      mailboxCode: 'TAZ6E3', code: 'TAZ6E3',
      name: '桃止来信',
      icon: '🍃',
      desc: '戚凭川致江淮安的十封信',
      accent: '#276749',
      bgGradient: 'linear-gradient(135deg, #f0fff4, #c6f6d5)',
      cardAccent: '#38a169',
      location: {
        lat: 30.27,
        lng: 120.15,
        placeName: '桃止山',
        region: '江南'
      }
    },
    {
      id: 'mailbox-zhaixing',
      mailboxCode: 'ZHX7F4', code: 'ZHX7F4',
      name: '摘星人来信',
      icon: '⭐',
      desc: '李平川致江宴的十五封信',
      accent: '#1a202c',
      bgGradient: 'linear-gradient(135deg, #1a202c, #2d3748)',
      cardAccent: '#ecc94b',
      textColor: '#e2e8f0',
      subtitleColor: '#a0aec0',
      location: {
        lat: 64.15,
        lng: -51.72,
        placeName: '摘星台',
        region: '极北星空'
      }
    },
    {
      id: 'mailbox-xiaowangzi',
      mailboxCode: 'XWZ8G5', code: 'XWZ8G5',
      name: '小王子来信',
      icon: '🌹',
      desc: '李云意致江雪的十一封信',
      accent: '#c53030',
      bgGradient: 'linear-gradient(135deg, #fff5f5, #fed7d7)',
      cardAccent: '#e53e3e',
      location: {
        lat: 23.42,
        lng: 5.32,
        placeName: '沙漠星球',
        region: '撒哈拉沙漠'
      }
    },
    {
      id: 'mailbox-xiejian',
      mailboxCode: 'XJJ9H6', code: 'XJJ9H6',
      name: '挟剑惊风',
      icon: '⚔️',
      desc: '江湖六大门派与七人羁绊',
      accent: '#742a2a',
      bgGradient: 'linear-gradient(135deg, #fff5f5, #fed7d7)',
      cardAccent: '#c53030',
      location: {
        lat: 30.27,
        lng: 120.15,
        placeName: '中原武林',
        region: '江湖'
      }
    },
    {
      id: 'mailbox-poxiao',
      mailboxCode: 'PX2026', code: 'PX2026',
      name: '破晓世界',
      icon: '🌅',
      desc: 'D市缉毒风云与七人命运',
      accent: '#1a365d',
      bgGradient: 'linear-gradient(135deg, #ebf8ff, #bee3f8)',
      cardAccent: '#2c5282',
      category: 'poxiao',
      mapBackground: 'poxiao',
      location: {
        lat: 31.23,
        lng: 121.47,
        placeName: 'D市',
        region: '现代都市'
      }
    }
  ],

};

/* ========================================
   Mailbox Manager - Core (Init/Management/Rendering)
   ======================================== */

Object.assign(MailboxManager, {
  /**
   * ⚠️ 关键过滤：把「老默认信箱」对"当前非拥有者"完全隐藏。
   *  - 老用户（qingqing / xiu-jing / xuan-xuan 等 preset）才允许继续看默认信箱
   *  - 新注册的普通用户（xumin、testa、testb …）即便 localStorage 有残留，也完全看不到布雷诺等默认信箱
   *  - 寒门信笺（mailbox-hanmen-duet）只有修璟/萱宣能看到
   *  - 挟剑惊风（mailbox-xiejian）只有对应 game-character 才能看到
   */
  _filterVisibleMailboxes(mailboxes, currentUser = null) {
    if (!Array.isArray(mailboxes)) return [];
    const u = currentUser || AuthManager.getCurrentUser() || null;
    const role = u?.role || '';
    const userId = String(u?.id || '').toLowerCase();
    const username = String(u?.username || '').toLowerCase();
    // 预置名单：只有这些用户/角色才允许看到"老默认信箱 7 + 挟剑惊风 + 寒门信笺"
    // —— 新增用户一律不在此白名单 → 空信箱状态 ✅
    const allowLegacy = (
      role === 'xiu-jing' || role === 'xuan-xuan' ||
      username === 'xiujing' || username === 'xuanxuan' ||
      username === 'qingqing' || username === 'admin' ||
      userId.includes('xiujing') || userId.includes('xuanxuan') || userId.includes('qingqing')
    );
    const defaultIds = new Set((MailboxManager.defaultMailboxes || []).map(m => String(m.id)));
    defaultIds.add('mailbox-hanmen-duet');
    return mailboxes.filter(mb => {
      const id = String(mb?.id || '');
      if (!defaultIds.has(id)) return true; // 非默认信箱 → 全部放行（用户自己建的 / 通过码加入的）
      // 是默认信箱 → 只有白名单 + 真的是成员/创建者 才显示
      if (!allowLegacy) return false;
      const owner = String(mb.ownerAccountKey || mb.owner || mb.createdBy || '').toLowerCase();
      const members = Array.isArray(mb.memberAccountKeys) ? mb.memberAccountKeys : (Array.isArray(mb.members) ? mb.members : []);
      const memberMatch = members.some(x => {
        const s = String(x || '').toLowerCase();
        return s && (s === userId || s === username || (role && s === role));
      });
      const ownerMatch = owner && (owner === userId || owner === username);
      return ownerMatch || memberMatch || (id === 'mailbox-hanmen-duet' && (role === 'xiu-jing' || role === 'xuan-xuan'));
    });
  },

  // 初始化示例数据
  // 守卫：只有当"本地已经存在默认信箱记录"或"用户是老账号且信箱非空"才会注入示例信件
  // 新用户（信箱完全为空）不执行此逻辑，避免凭空出现默认信件
  initSampleData() {
    const storedMailboxes = STORAGE.loadMailboxes();
    const storedLetters = STORAGE.loadLetters();

    // 如果本地没有任何信箱记录 且 也没有任何信件 -> 视为新用户，直接跳过
    if ((!storedMailboxes || storedMailboxes.length === 0) &&
        (!storedLetters || storedLetters.length === 0)) {
      console.log('[initSampleData] 新用户，跳过默认信箱/信件注入');
      return;
    }

    const existingLetters = STORAGE.loadLetters();

    // 只保留默认信箱的信件
    const defaultIds = new Set(this.defaultMailboxes.map(m => m.id));
    let allLetters = existingLetters.filter(l => defaultIds.has(l.mailboxId));

    const brenuoLetters = allLetters.filter(l => l.mailboxId === 'mailbox-brenuo');
    if (brenuoLetters.length !== 25) {
      allLetters = allLetters.filter(l => l.mailboxId !== 'mailbox-brenuo');
      const newBrenuoLetters = this.generateBrenuoLetters();
      allLetters = [...allLetters, ...newBrenuoLetters];
    }

    const daliangLetters = allLetters.filter(l => l.mailboxId === 'mailbox-daliang');
    if (daliangLetters.length !== 4) {
      allLetters = allLetters.filter(l => l.mailboxId !== 'mailbox-daliang');
      const newDaliangLetters = this.generateDaliangLetters();
      allLetters = [...allLetters, ...newDaliangLetters];
    }

    const tianzhuLetters = allLetters.filter(l => l.mailboxId === 'mailbox-tianzhu');
    if (tianzhuLetters.length !== 4) {
      allLetters = allLetters.filter(l => l.mailboxId !== 'mailbox-tianzhu');
      const newTianzhuLetters = this.generateTianzhuLetters();
      allLetters = [...allLetters, ...newTianzhuLetters];
    }

    const ruguLetters = allLetters.filter(l => l.mailboxId === 'mailbox-rugu');
    if (ruguLetters.length !== 15) {
      allLetters = allLetters.filter(l => l.mailboxId !== 'mailbox-rugu');
      const newRuguLetters = this.generateRuguLetters();
      allLetters = [...allLetters, ...newRuguLetters];
    }

    const taozhiLetters = allLetters.filter(l => l.mailboxId === 'mailbox-taozhi');
    if (taozhiLetters.length !== 11) {
      allLetters = allLetters.filter(l => l.mailboxId !== 'mailbox-taozhi');
      const newTaozhiLetters = this.generateTaozhiLetters();
      allLetters = [...allLetters, ...newTaozhiLetters];
    }

    const zhaixingLetters = allLetters.filter(l => l.mailboxId === 'mailbox-zhaixing');
    if (zhaixingLetters.length !== 15) {
      allLetters = allLetters.filter(l => l.mailboxId !== 'mailbox-zhaixing');
      const newZhaixingLetters = this.generateZhaixingLetters();
      allLetters = [...allLetters, ...newZhaixingLetters];
    }

    const xiaowangziLetters = allLetters.filter(l => l.mailboxId === 'mailbox-xiaowangzi');
    if (xiaowangziLetters.length !== 11) {
      allLetters = allLetters.filter(l => l.mailboxId !== 'mailbox-xiaowangzi');
      const newXiaowangziLetters = this.generateXiaowangziLetters();
      allLetters = [...allLetters, ...newXiaowangziLetters];
    }

    if (allLetters.length !== existingLetters.length) {
      STORAGE.saveLetters(allLetters);
    }

    // 加载测试录音到布雷诺来信第一封
    this._loadTestRecord(allLetters);
  },

  async _loadTestRecord(allLetters) {
    const brenuoFirstLetter = allLetters.find(l => l.mailboxId === 'mailbox-brenuo');
    if (!brenuoFirstLetter) return;

    // 检查是否已有录音
    const existingRecord = await STORAGE.getMedia(`record_${brenuoFirstLetter.id}`);
    if (existingRecord) {
      console.log('[测试录音] 已存在，跳过加载');
      return;
    }

    try {
      // 加载测试音频文件（资源统一从 MySQL 经 /api/assets 获取）
      const audioUrl = 'mailfile/mail_re/6月27日.m4a';
      const apiBase = (window.MailService && typeof window.MailService.getBaseUrl === 'function')
        ? String(window.MailService.getBaseUrl() || '').replace(/\/+$/, '')
        : '';
      const fetchUrl = apiBase ? `${apiBase}/api/assets/${audioUrl}` : audioUrl;
      console.log('[测试录音] 开始加载:', fetchUrl);
      const response = await fetch(fetchUrl);
      console.log('[测试录音] 响应状态:', response.status, response.ok);
      if (!response.ok) {
        console.error('[测试录音] fetch 失败:', response.statusText);
        return;
      }

      let blob = await response.blob();
      console.log('[测试录音] blob 大小:', blob.size, '类型:', blob.type);

      if (blob.size === 0) {
        console.error('[测试录音] 文件为空');
        return;
      }

      // 确保 blob 有正确的 MIME 类型
      if (!blob.type || blob.type === '') {
        blob = new Blob([blob], { type: 'audio/mp4' });
        console.log('[测试录音] 已设置 MIME 类型:', blob.type);
      }

      // 保存录音
      await STORAGE.saveMedia(`record_${brenuoFirstLetter.id}`, 'audio', blob);
      console.log('[测试录音] 已保存到 IndexedDB');

      // 获取音频时长
      const audio = new Audio(URL.createObjectURL(blob));
      audio.onloadedmetadata = async () => {
        const duration = Math.floor(audio.duration);
        console.log('[测试录音] 音频时长:', duration, '秒');
        brenuoFirstLetter.recordDuration = duration;

        // 更新信件记录
        const letters = STORAGE.loadLetters();
        const idx = letters.findIndex(l => l.id === brenuoFirstLetter.id);
        if (idx !== -1) {
          letters[idx] = brenuoFirstLetter;
          STORAGE.saveLetters(letters);
          console.log('[测试录音] 已更新信件时长');
        }
      };
      audio.onerror = (e) => {
        console.error('[测试录音] 音频加载错误:', audio.error);
      };
    } catch (e) {
      console.error('[测试录音] 加载失败:', e);
    }
  },

  getMailboxes() {
    // ── 新用户本地数据清理（入口即保证，避免首次 purge 时机晚于渲染） ──
    try {
      const u = AuthManager.getCurrentUser() || null;
      const role = u?.role || '';
      const username = String(u?.username || '').toLowerCase();
      const isPreset = (
        role === 'xiu-jing' || role === 'xuan-xuan' ||
        username === 'xiujing' || username === 'xuanxuan' ||
        username === 'qingqing' || username === 'admin'
      );
      if (!isPreset) {
        const presetIds = new Set([
          'mailbox-brenuo','mailbox-daliang','mailbox-tianzhu',
          'mailbox-rugu','mailbox-taozhi','mailbox-zhaixing',
          'mailbox-xiaowangzi','mailbox-xiejian','mailbox-poxiao','mailbox-hanmen-duet'
        ]);
        const MK = (STORAGE && STORAGE.MAILBOXES_KEY) ? STORAGE.MAILBOXES_KEY : 'xinjian_mailboxes';
        const LK = (STORAGE && STORAGE.LETTERS_KEY) ? STORAGE.LETTERS_KEY : 'xinjian_letters';
        const raw = JSON.parse(localStorage.getItem(MK) || '[]');
        // 取"信箱号索引"中登记的所有 mailboxId —— 这些即使当前不是 owner/member 也不能删（否则"加入信箱"流程查不到）
        const codesIndex = (typeof STORAGE.loadMailboxCodesIndex === 'function')
          ? (STORAGE.loadMailboxCodesIndex() || {})
          : {};
        const codeIndexedIds = new Set(Object.values(codesIndex).map(x => String(x)));
        if (Array.isArray(raw) && raw.length) {
          const userId = String(u?.id || '').toLowerCase();
          const cleaned = raw.filter(m => {
            if (!m || !m.id) return false;
            const mid = String(m.id);
            if (presetIds.has(mid)) return false;
            // ⚠️ 信箱号索引里登记过的信箱（可能是别人在本机创建用来"邀请加入"的）保留，不要 purge 掉
            if (codeIndexedIds.has(mid)) return true;
            // ⚠️ 标记为 _remoteUpsertNeeded 的（本地写过但还没同步到云端），保留避免同步丢失
            if (m._remoteUpsertNeeded === true) return true;
            const owner = String(m.ownerAccountKey || m.owner || m.createdBy || '').toLowerCase();
            const members = Array.isArray(m.memberAccountKeys) ? m.memberAccountKeys : (Array.isArray(m.members) ? m.members : []);
            const isMember = members.some(x => {
              const s = String(x || '').toLowerCase();
              return s && (s === username || s === userId);
            });
            const isOwner = owner && (owner === username || owner === userId);
            if (!isOwner && !isMember) return false;
            return true;
          });
          if (cleaned.length !== raw.length) {
            localStorage.setItem(MK, JSON.stringify(cleaned));
            const letters = JSON.parse(localStorage.getItem(LK) || '[]');
            if (Array.isArray(letters) && letters.length) {
              localStorage.setItem(LK, JSON.stringify(letters.filter(l => l && !presetIds.has(String(l.mailboxId)))));
            }
            if (STORAGE && typeof STORAGE.clearRemoteMailboxCache === 'function') {
              try { STORAGE.clearRemoteMailboxCache(); } catch (_) {}
            }
          }
        }
      }
    } catch (_) {}

    // ── 小加速：若 30s 内已有 loadMailboxesAsync 的远端缓存，先直接返回它
    //    这样绝大多数同步调用点（侧边栏、空状态、信件列表）不用大改就能吃到远端数据。
    const now = Date.now();
    if (Array.isArray(STORAGE._remoteMailboxCache) && STORAGE._remoteMailboxCache.length > 0 &&
        STORAGE._remoteMailboxCacheAt > 0 && (now - STORAGE._remoteMailboxCacheAt) < (STORAGE.REMOTE_MAILBOX_TTL_MS || 30000)) {
      // 缓存里的对象已经合并 shared/local/remote，直接 clone 一份返回
      let cached = STORAGE._remoteMailboxCache.map(m => ({ ...m }));
      const currentUser = AuthManager.getCurrentUser();
      const effectiveUserId = currentUser?.id || (typeof this.getCurrentUserId === 'function' ? this.getCurrentUserId() : null);
      if (effectiveUserId) {
        cached.forEach(m => { if (!Array.isArray(m.members)) m.members = []; });
      }
      if (currentUser && (currentUser.role === 'xiu-jing' || currentUser.role === 'xuan-xuan')) {
        if (typeof STORAGE.initSharedMailbox === 'function') {
          try { STORAGE.initSharedMailbox(); } catch (_) {}
        }
        const cuId = String(currentUser.id || '').toLowerCase();
        const cuName = String(currentUser.username || '').toLowerCase();
        const extras = (STORAGE.loadSharedMailboxes ? STORAGE.loadSharedMailboxes() : []).filter(sm => {
          const arr = Array.isArray(sm.members) ? sm.members : (Array.isArray(sm.memberAccountKeys) ? sm.memberAccountKeys : []);
          return arr.some(x => {
            const s = String(x || '').toLowerCase();
            return s === cuId || s === cuName;
          });
        });
        for (const sb of extras) {
          if (!cached.some(m => String(m.id) === String(sb.id))) {
            cached.push({ ...sb, isShared: true, isCustom: true });
          }
        }
      }
      return this._filterVisibleMailboxes(cached, currentUser);
    }

    // ── 老数据升级：为所有缺失 mailboxCode 的信箱自动补齐 & 写回索引 ──
    try {
      this._ensureAllMailboxesHaveCode();
    } catch (e) { console.warn('[mailbox] 补全信箱号失败:', e); }
    // 同步版（兼容老调用方）：只返回本地 localStorage / sharedMailboxes
    let mailboxes = (STORAGE.loadMailboxes() || []).filter(m => m && m.id);
    const currentUser = AuthManager.getCurrentUser();
    // 注意：上方 purge 逻辑把"code 索引里的信箱"都保留在 raw 里，但它们不一定是当前用户的成员/拥有者
    // —— 这里先过滤一遍：只有当前用户是 owner/member 的 mailboxes 才有资格参加后续 visible 判断和返回
    //    （否则 xiujing 刚在本机创建的共享邀请信箱，newb 即便还没加入，也会直接出现在信箱列表里）
    (function () {
      const u = currentUser || null;
      const username = String(u?.username || '').toLowerCase();
      const userId = String(u?.id || '').toLowerCase();
      const isPreset = (u?.role === 'xiu-jing' || u?.role === 'xuan-xuan' ||
        username === 'xiujing' || username === 'xuanxuan' ||
        username === 'qingqing' || username === 'admin');
      const defaultIds = new Set(((MailboxManager && MailboxManager.defaultMailboxes) || []).map(m => String(m.id)));
      defaultIds.add('mailbox-hanmen-duet');
      mailboxes = mailboxes.filter(mb => {
        const mid = String(mb?.id || '');
        if (defaultIds.has(mid)) {
          // 默认信箱让 _filterVisibleMailboxes 统一处理（preset 用户保留）
          return isPreset ? true : false;
        }
        const owner = String(mb.ownerAccountKey || mb.owner || mb.createdBy || '').toLowerCase();
        const members = Array.isArray(mb.memberAccountKeys) ? mb.memberAccountKeys : (Array.isArray(mb.members) ? mb.members : []);
        const isMember = members.some(x => {
          const s = String(x || '').toLowerCase();
          return s && (s === username || s === userId || (u?.role && s === u.role));
        });
        const isOwner = owner && (owner === username || owner === userId);
        // 非默认信箱：只有真 owner/member 才进入 visible 范围；否则即使在 code 索引里也不显示
        return isOwner || isMember;
      });
    })();
    const effectiveUserId = currentUser?.id || (typeof this.getCurrentUserId === 'function' ? this.getCurrentUserId() : null);
    const accountKey = String(currentUser?.username || currentUser?.id || '').toLowerCase();
    if (effectiveUserId || accountKey) {
      const sharedMailboxes = (STORAGE.loadSharedMailboxes() || []).filter(m => m && m.id);
      const userSharedBoxes = sharedMailboxes.filter(sm => {
        const arr = Array.isArray(sm.members) ? sm.members : (Array.isArray(sm.memberAccountKeys) ? sm.memberAccountKeys : []);
        return arr.some(x => {
          const s = String(x || '').toLowerCase();
          return s === String(effectiveUserId || '').toLowerCase() || s === accountKey;
        });
      });
      userSharedBoxes.forEach(sharedBox => {
        const existingIdx = mailboxes.findIndex(m => m.id === sharedBox.id);
        if (existingIdx === -1) {
          mailboxes.push({ ...sharedBox, isShared: true, isCustom: true });
        } else {
          mailboxes[existingIdx] = { ...mailboxes[existingIdx], ...sharedBox, isShared: true };
        }
      });
    }
    if (currentUser && (currentUser.role === 'xiu-jing' || currentUser.role === 'xuan-xuan')) {
      if (typeof STORAGE.initSharedMailbox === 'function') STORAGE.initSharedMailbox();
      const cuId = String(currentUser.id || '').toLowerCase();
      const cuName = String(currentUser.username || '').toLowerCase();
      const sharedBoxes = (STORAGE.loadSharedMailboxes() || []).filter(m => m && m.id).filter(sm => {
        const arr = Array.isArray(sm.members) ? sm.members : (Array.isArray(sm.memberAccountKeys) ? sm.memberAccountKeys : []);
        return arr.some(x => {
          const s = String(x || '').toLowerCase();
          return s === cuId || s === cuName;
        });
      });
      sharedBoxes.forEach(sb => {
        const existingIdx = mailboxes.findIndex(m => m.id === sb.id);
        if (existingIdx === -1) {
          mailboxes.push({ ...sb, isShared: true, isCustom: true });
        } else {
          mailboxes[existingIdx] = { ...mailboxes[existingIdx], ...sb, isShared: true };
        }
      });
    }

    // ── 远端优先：后台 fire-and-forget 拉一次，合并后清缓存，派发事件触发 UI 重绘 ──
    try {
      if (window.MailService && typeof MailService.isRemoteAvailable === 'function') {
        const self = this;
        // 不阻塞同步返回
        (async () => {
          // getMailboxesAsync 已在主动拉取时，跳过本次重复的 fire-and-forget
          if (self._bgSyncing) return;
          try {
            const ok = await MailService.isRemoteAvailable();
            if (ok) {
              const merged = await self.loadRemoteMailboxesAndMergeLocal(currentUser);
              // 只有真正合并到数据时才派发事件（避免每次都刷新）
              if (Array.isArray(merged) && merged.length > 0) {
                try {
                  window.dispatchEvent(new CustomEvent('mailboxes:synced', { detail: { source: 'getMailboxes_bg' } }));
                } catch (_) {}
              }
            }
          } catch (_) { /* ignore */ }
        })();
      }
    } catch (_) { /* ignore */ }

    return this._filterVisibleMailboxes(mailboxes, currentUser);
  },

  /**
   * 异步版信箱列表：远端 Mongo 优先 + 本地合并 + 30s 缓存
   * 返回结构和 getMailboxes() 保持一致，调用方 await 即可。
   */
  async getMailboxesAsync(options = {}) {
    const force = !!options.force;
    // 本地先补齐老数据 mailboxCode
    try { this._ensureAllMailboxesHaveCode(); } catch (e) {}

    // 1) 先主动从远端拉并合并本地（云端回来的 mailbox + 成员信息是权威）
    const currentUser = AuthManager.getCurrentUser();
    // 主动拉取期间置位 _bgSyncing，避免步骤 2) 里 getMailboxes() 的 fire-and-forget 重复请求
    this._bgSyncing = true;
    let list;
    try {
      if (window.MailService && typeof MailService.isRemoteAvailable === 'function') {
        const ok = await MailService.isRemoteAvailable();
        if (ok) {
          const merged = await this.loadRemoteMailboxesAndMergeLocal(currentUser);
          if (Array.isArray(merged)) { /* 合并已落 localStorage，下面 sync 版就能读到 */ }
        }
      }

      // 2) 走 sync 版（本地 + 共享信箱 + 过滤）
      list = this.getMailboxes();
    } catch (_) { /* ignore, fallback */ } finally {
      this._bgSyncing = false;
    }
    // 若 force 则不走 STORAGE.loadMailboxesAsync 的缓存，直接用 getMailboxes 结果
    if (!force && typeof STORAGE.loadMailboxesAsync === 'function') {
      try {
        const sList = await STORAGE.loadMailboxesAsync({ force });
        if (Array.isArray(sList) && sList.length > 0) list = sList;
      } catch (_) { /* ignore */ }
    }

    // 兼容字段（members 字段确保数组）
    list.forEach(m => { if (!Array.isArray(m.members)) m.members = []; });

    const effectiveUserId = currentUser?.id ||
      (typeof this.getCurrentUserId === 'function' ? this.getCurrentUserId() : null);

    // 修璟 / 萱宣：确保默认共享信箱有
    if (currentUser && (currentUser.role === 'xiu-jing' || currentUser.role === 'xuan-xuan')) {
      if (typeof STORAGE.initSharedMailbox === 'function') {
        try { STORAGE.initSharedMailbox(); } catch (_) {}
      }
      const cuId = String(currentUser.id || '').toLowerCase();
      const cuName = String(currentUser.username || '').toLowerCase();
      const extras = (STORAGE.loadSharedMailboxes ? STORAGE.loadSharedMailboxes() : []).filter(sm => {
        const arr = Array.isArray(sm.members) ? sm.members : (Array.isArray(sm.memberAccountKeys) ? sm.memberAccountKeys : []);
        return arr.some(x => {
          const s = String(x || '').toLowerCase();
          return s === cuId || s === cuName;
        });
      });
      for (const sb of extras) {
        if (!list.some(m => String(m.id) === String(sb.id))) {
          list.push({ ...sb, isShared: true, isCustom: true });
        }
      }
    }
    // 去重 + 保证 id 存在
    const seen = new Set();
    const out = [];
    for (const m of list) {
      if (!m || !m.id) continue;
      const key = String(m.id);
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(m);
    }
    return this._filterVisibleMailboxes(out, currentUser);
  },

  updateMailbox(mailboxId, updates) {
    const mailboxes = STORAGE.loadMailboxes() || [];
    const index = mailboxes.findIndex(m => m.id === mailboxId);
    if (index !== -1) {
      mailboxes[index] = { ...mailboxes[index], ...updates };
      STORAGE.saveMailboxes(mailboxes);
      // 同步信箱号索引（若更新涉及 mailboxCode）
      const code = mailboxes[index].mailboxCode || mailboxes[index].code;
      if (code && typeof STORAGE.saveMailboxCodeIndex === 'function') {
        STORAGE.saveMailboxCodeIndex(code, mailboxId);
      }
      return mailboxes[index];
    }
    return null;
  },

  /**
   * 统一删除信箱：清理本地所有存储 + 远程同步 + 角色绑定
   */
  deleteMailbox(mailboxId) {
    if (!mailboxId) return false;
    const isShared = this.isSharedMailbox(mailboxId);

    // 1. 删除该信箱的所有信件
    if (isShared) {
      STORAGE.saveSharedLetters(mailboxId, []);
      STORAGE.deleteSharedMailbox(mailboxId);
    } else {
      const allLetters = STORAGE.loadLetters();
      const remainingLetters = allLetters.filter(l => l.mailboxId !== mailboxId);
      STORAGE.saveLetters(remainingLetters);
      // 从私有信箱列表中删除
      const privates = STORAGE.loadMailboxes() || [];
      const remainingPrivates = privates.filter(m => m.id !== mailboxId);
      STORAGE.saveMailboxes(remainingPrivates);
    }

    // 2. 清理信箱码索引
    if (typeof STORAGE.deleteMailboxCodeIndexByMailboxId === 'function') {
      STORAGE.deleteMailboxCodeIndexByMailboxId(mailboxId);
    }

    // 3. 清理角色绑定
    if (typeof STORAGE.deleteCharacterBinding === 'function') {
      STORAGE.deleteCharacterBinding(mailboxId);
    }

    // 4. 尝试从远程删除（若当前用户是 owner）
    if (window.MailService && typeof MailService.isRemoteAvailable === 'function') {
      (async () => {
        try {
          const ok = await MailService.isRemoteAvailable();
          if (ok && typeof MailService.deleteRemoteMailbox === 'function') {
            await MailService.deleteRemoteMailbox(mailboxId);
          }
        } catch (_) {}
      })();
    }

    // 5. 清空本地缓存（含信件缓存）
    if (typeof MailService !== 'undefined' && MailService._mailboxCache) {
      delete MailService._mailboxCache[mailboxId];
    }

    return true;
  },

  renderMailboxList(container) {
    const mailboxes = this.getMailboxes();
    container.innerHTML = '';

    mailboxes.forEach(mb => {
      const count = this.loadMailboxLetters(mb.id).length;
      const card = document.createElement('div');
      card.className = 'mailbox-card';
      card.dataset.id = mb.id;
      card.style.setProperty('--card-accent', mb.cardAccent || mb.accent);
      card.style.background = mb.bgGradient ? `var(--color-paper)` : 'var(--color-paper)';
      card.innerHTML = `
        <span class="mailbox-count">${count}</span>
        <div class="mailbox-icon">${mb.icon}</div>
        <h3 class="mailbox-name">${mb.name}</h3>
        <p class="mailbox-desc">${mb.desc}</p>
      `;
      card.addEventListener('click', () => {
        App.navigate('mailbox', { mailboxId: mb.id });
      });
      container.appendChild(card);
    });
  },

  // 渲染左侧侧边栏信箱列表 - 使用信封SVG图标
  renderSidebarNav(navContainer, activeId = null) {
    const mailboxes = this.getMailboxes();
    navContainer.innerHTML = '';

    mailboxes.forEach(mb => {
      const count = typeof MailService !== 'undefined'
        ? Number(MailService.getCachedMailbox(mb.id).unreadCount || 0)
        : 0;
      const item = document.createElement('div');
      item.className = 'sidebar-nav-item';
      if (mb.id === activeId) item.classList.add('active');
      item.dataset.id = mb.id;
      item.style.setProperty('--card-accent', mb.cardAccent || mb.accent);

      item.innerHTML = `
        <div class="sidebar-nav-icon-wrapper">
          ${this._getMailboxIconSVG(mb)}
        </div>
        <div class="sidebar-nav-info">
          <span class="sidebar-nav-name">
            ${mb.name}
            ${mb.isShared ? '<span class="shared-badge">共享</span>' : ''}
          </span>
          ${count > 0 ? `<span class="sidebar-nav-count">${count}</span>` : ''}
        </div>
      `;

      item.addEventListener('click', () => {
        App.navigate('mailbox', { mailboxId: mb.id });
      });

      navContainer.appendChild(item);
    });
  },

  // 渲染右侧画廊信箱卡片
  renderGalleryTrack(trackContainer, indicatorsContainer, onCardClick) {
    const mailboxes = this.getMailboxes();
    trackContainer.innerHTML = '';

    mailboxes.forEach((mb, index) => {
      const count = this.loadMailboxLetters(mb.id).length;
      const card = document.createElement('div');
      card.className = 'gallery-card';
      card.dataset.id = mb.id;
      card.dataset.index = index;
      card.style.setProperty('--card-accent', mb.cardAccent || mb.accent);

      card.innerHTML = `
        <span class="gallery-card-count">${count}</span>
        <div class="gallery-card-icon">${mb.icon}</div>
        <h3 class="gallery-card-name">${mb.name}</h3>
        <p class="gallery-card-desc">${mb.desc}</p>
      `;

      card.addEventListener('click', () => {
        if (onCardClick) onCardClick(mb.id);
      });

      trackContainer.appendChild(card);
    });

    // 渲染指示器
    if (indicatorsContainer) {
      indicatorsContainer.innerHTML = '';
      mailboxes.forEach((mb, index) => {
        const dot = document.createElement('div');
        dot.className = 'gallery-dot' + (index === 0 ? ' active' : '');
        dot.dataset.index = index;
        dot.addEventListener('click', () => {
          const wrapper = trackContainer.parentElement;
          const cards = trackContainer.querySelectorAll('.gallery-card');
          if (cards[index]) {
            cards[index].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
          }
        });
        indicatorsContainer.appendChild(dot);
      });

      // 监听滚动更新指示器
      const wrapper = trackContainer.parentElement;
      wrapper.addEventListener('scroll', () => {
        const cards = trackContainer.querySelectorAll('.gallery-card');
        let activeIndex = 0;
        const viewCenter = wrapper.scrollLeft + wrapper.clientWidth / 2;

        cards.forEach((card, idx) => {
          const cardCenter = card.offsetLeft + card.offsetWidth / 2;
          if (Math.abs(cardCenter - viewCenter) < card.offsetWidth / 2) {
            activeIndex = idx;
          }
        });

        indicatorsContainer.querySelectorAll('.gallery-dot').forEach((dot, idx) => {
          dot.classList.toggle('active', idx === activeIndex);
        });
      });
    }
  },

  renderLetterList(container, mailboxId) {
    const mailboxes = this.getMailboxes();
    const mailbox = mailboxes.find(m => m.id === mailboxId);
    if (!mailbox) return;

    document.getElementById('mailbox-title').textContent = `${mailbox.icon} ${mailbox.name}`;

    const letters = this.loadMailboxLetters(mailboxId);
    container.innerHTML = '';

    if (letters.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">${mailbox.icon}</div>
          <p>这个信箱还是空的</p>
          <p style="font-size:0.8rem;margin-top:8px;">写下第一封温暖的信吧</p>
        </div>
      `;
      return;
    }

    letters.sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0));

    letters.forEach(letter => {
      const card = document.createElement('div');
      card.className = 'letter-card';
      const previewText = this._extractPreview(letter);

      // 万物送信：在途旅程惰性推进 + 徽章
      let journeyBadge = '';
      if (letter.journey && window.JourneyEngine) {
        const j = letter.journey;
        if (j.mode === 'transit' && j.status === 'in-transit') {
          window.JourneyEngine.tick(letter, Date.now());
        }
        if (j.status === 'in-transit') {
          const carrier = (window.CARRIER_ROSTER || []).find(c => c.id === j.carrierId);
          journeyBadge = `<div class="letter-journey-badge in-transit" title="${j.expectedDelivery || ''}">${carrier?.emoji || '✉'} 在途 · ${j.expectedDelivery || '旅途中'}</div>`;
        } else if (j.report) {
          const carrier = (window.CARRIER_ROSTER || []).find(c => c.id === j.carrierId);
          journeyBadge = `<div class="letter-journey-badge delivered" title="查看旅程志">✅ ${carrier?.emoji || ''} 已送达 · 📜 旅程志</div>`;
        }
      }

      const initial = (letter.recipient || '?').charAt(0);

      card.innerHTML = `
        <div class="letter-card-seal">${initial}</div>
        <div class="letter-card-content">
          <div class="letter-recipient">致 ${letter.recipient || '未知的人'}</div>
          <div class="letter-date">${letter.date || (letter.createdAt ? new Date(letter.createdAt).toLocaleDateString('zh-CN') : '')}</div>
          <div class="letter-preview">${previewText || '（空白的信）'}</div>
          ${journeyBadge}
        </div>
      `;

      const accentColor = mailbox.cardAccent || mailbox.accent;
      card.querySelector('.letter-recipient').style.color = accentColor;
      card.querySelector('.letter-card-seal').style.background = `radial-gradient(circle, ${accentColor} 0%, ${this._darkenColor(accentColor, 0.2)} 70%, ${this._darkenColor(accentColor, 0.35)} 100%)`;

      card.addEventListener('click', () => {
        App.navigate('reader', { letterId: letter.id });
      });
      container.appendChild(card);
    });
  },

  _extractPreview(letter) {
    const textItems = (letter.content || []).filter(c => c.type === 'text');
    if (textItems.length > 0) {
      return textItems[0].text || '';
    }
    return '';
  },

  _darkenColor(hex, amount) {
    // 防御：缺失/非法颜色时兜底默认棕金色
    if (!hex || typeof hex !== 'string') hex = '#8a6d3b';
    const clean = hex.replace('#', '');
    if (!/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(clean)) hex = '#8a6d3b';
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.max(0, (num >> 16) - Math.floor(255 * amount));
    const g = Math.max(0, ((num >> 8) & 0x00FF) - Math.floor(255 * amount));
    const b = Math.max(0, (num & 0x0000FF) - Math.floor(255 * amount));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  },

  _parseDate(dateStr) {
    const result = { day: '', month: '', year: '' };
    if (!dateStr) return result;

    const cnMonthMatch = dateStr.match(/([一二三四五六七八九十]+)月/);
    const cnDayMatch = dateStr.match(/(\d+|[一二三四五六七八九十]+)日/);
    const cnYearMatch = dateStr.match(/([一二三四五六七八九零〇]+年)/);

    if (cnYearMatch) {
      result.year = cnYearMatch[1];
    } else {
      const numYearMatch = dateStr.match(/(\d{4})/);
      if (numYearMatch) result.year = numYearMatch[1] + '年';
    }

    if (cnMonthMatch) {
      result.month = cnMonthMatch[1] + '月';
    } else {
      const numMonthMatch = dateStr.match(/(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/);
      if (numMonthMatch) {
        const monthNum = parseInt(numMonthMatch[2], 10);
        const cnMonths = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'];
        result.month = cnMonths[monthNum - 1] + '月';
      } else {
        result.month = dateStr;
      }
    }

    if (cnDayMatch) {
      result.day = cnDayMatch[1];
    } else {
      const numDayMatch = dateStr.match(/(\d{1,2})[日号]/);
      if (numDayMatch) {
        result.day = numDayMatch[1];
      } else {
        const dayNum = dateStr.match(/\/(\d{1,2})/) || dateStr.match(/-(\d{1,2})$/);
        if (dayNum) result.day = dayNum[1];
      }
    }

    if (!result.day && !result.month && !result.year) {
      result.day = dateStr;
    }

    return result;
  },

  getLetterCount(mailboxId) {
    return this.loadMailboxLetters(mailboxId).length;
  },

  isSharedMailbox(mailboxId) {
    const sharedMailboxes = STORAGE.loadSharedMailboxes();
    const sharedBox = sharedMailboxes.find(m => m.id === mailboxId);
    return !!sharedBox;
  },

  loadMailboxLetters(mailboxId) {
    const serverLetters = typeof MailService !== 'undefined'
      ? MailService.getCachedMailbox(mailboxId).letters || []
      : [];
    let localLetters = [];
    if (this.isSharedMailbox(mailboxId)) {
      localLetters = STORAGE.loadSharedLetters(mailboxId);
    } else {
      localLetters = STORAGE.loadLetters().filter(l => l.mailboxId === mailboxId);
    }
    const byId = new Map();
    for (const letter of [...localLetters, ...serverLetters]) {
      if (!letter || !letter.id) continue;
      const key = String(letter.id);
      const old = byId.get(key);
      if (!old || ((letter.updatedAt || letter.createdAt || 0) >= (old.updatedAt || old.createdAt || 0))) {
        byId.set(key, letter);
      }
    }

    // ── 远端优先：后台异步拉 MongoDB 的原始信件并 merge（下次 render 即可见） ──
    //    节流：同一信箱 10s 内不重复拉取，避免频繁渲染触发重复请求
    try {
      if (window.MailService && typeof MailService.isRemoteAvailable === 'function' &&
          typeof MailService.listRemoteLetters === 'function') {
        const now = Date.now();
        if (!this._letterFetchAt) this._letterFetchAt = {};
        if (!this._letterFetchAt[mailboxId] || now - this._letterFetchAt[mailboxId] > 10000) {
          this._letterFetchAt[mailboxId] = now;
          const self = this;
          (async () => {
            try {
              const ok = await MailService.isRemoteAvailable();
              if (!ok) return;
              const merged = await self.loadRemoteLettersAndMergeLocal(mailboxId);
              // 合并成功 → 把 merge 后的全量信件也刷新到 MailService._cache（侧边栏未读计数）
              if (Array.isArray(merged) && typeof MailService.refreshMailboxCache === 'function') {
                try { await MailService.refreshMailboxCache(mailboxId); } catch (_) {}
              }
            } catch (_) { /* ignore */ }
          })();
        }
      }
    } catch (_) { /* ignore */ }

    return Array.from(byId.values());
  },

  saveMailboxLetters(mailboxId, letters) {
    if (this.isSharedMailbox(mailboxId)) {
      STORAGE.saveSharedLetters(mailboxId, letters);
    } else {
      const allLetters = STORAGE.loadLetters().filter(l => l.mailboxId !== mailboxId);
      STORAGE.saveLetters([...allLetters, ...letters]);
    }
    // ── 远端同步：把本 batch 的每封信（若无 _remoteSynced 标记）异步 upsert 到云端 ──
    try {
      if (window.MailService && typeof MailService.isRemoteAvailable === 'function' &&
          typeof MailService.upsertRemoteLetter === 'function') {
        const self = this;
        (async () => {
          try {
            const ok = await MailService.isRemoteAvailable();
            if (!ok) return;
            const u = AuthManager.getCurrentUser() || null;
            const accountKey = (typeof MailService.getAccountKey === 'function')
              ? MailService.getAccountKey(u)
              : String(u?.username || u?.id || '').toLowerCase();
            // 把前端「扁平 letter」格式转换为后端「record + letter」格式
            const toUpsert = [];
            for (const flat of letters || []) {
              if (!flat || !flat.id) continue;
              if (flat._remoteSynced === true) continue;
              const record = {
                id: flat.id,
                mailboxId: mailboxId,
                senderAccountKey: flat.senderAccountKey || flat.author?.username || flat.author?.id || accountKey || '',
                recipientAccountKey: flat.recipientAccountKey || '',
                senderIdentity: flat.senderIdentity || null,
                recipientIdentity: flat.recipientIdentity || null,
                deliveryStatus: flat.deliveryStatus || flat.status || 'sent',
                sentAt: flat.sentAt || flat.createdAt || Date.now(),
                readAt: flat.readAt || null,
                clientMessageId: flat.clientMessageId || `local-${flat.id}`,
                itemAttachments: flat.itemAttachments || [],
                letter: {
                  ...flat,
                  id: flat.id,
                  mailboxId,
                  status: flat.status || flat.deliveryStatus || 'sent',
                  sender: flat.sender || flat.author?.displayName || flat.senderAccountKey || '',
                  recipient: flat.recipient || flat.to || '',
                  createdAt: flat.createdAt || Date.now(),
                  updatedAt: flat.updatedAt || Date.now()
                },
                updatedAt: flat.updatedAt || Date.now()
              };
              // 规范化 author/sender 字段
              if (flat.author && !record.senderIdentity) {
                record.senderIdentity = {
                  accountKey: String(flat.author.username || flat.author.id || '').toLowerCase(),
                  username: flat.author.username || '',
                  displayName: flat.author.displayName || '',
                  role: flat.author.role || '',
                  identityName: flat.author.displayName || flat.author.username || ''
                };
              }
              toUpsert.push(record);
            }
            // 优先 batchUpsert，失败再降级单条
            if (toUpsert.length > 0 && typeof MailService.batchUpsertRemoteLetters === 'function') {
              try {
                const r = await MailService.batchUpsertRemoteLetters(toUpsert);
                if (r && r.success) {
                  // 标记成功的为已同步（更新 localStorage）
                  const successIds = new Set((r.results || []).filter(x => x && x.ok).map(x => String(x.id)));
                  if (successIds.size > 0) {
                    self._markLettersRemoteSynced(mailboxId, successIds);
                  }
                  return;
                }
              } catch (_) { /* batch 失败，降级单条 */ }
            }
            for (const record of toUpsert) {
              try {
                const r = await MailService.upsertRemoteLetter(record);
                if (r && r.success) self._markLettersRemoteSynced(mailboxId, new Set([String(record.id)]));
              } catch (_) { /* 单条忽略，下次调用会继续尝试 */ }
            }
          } catch (_) { /* ignore */ }
        })();
      }
    } catch (_) { /* ignore */ }
  },

  /** 工具：把指定 id 的信件标记为 _remoteSynced=true（写回 localStorage / sharedLetters），避免下次重复 upsert */
  _markLettersRemoteSynced(mailboxId, successIdSet) {
    try {
      if (!successIdSet || successIdSet.size === 0) return;
      if (this.isSharedMailbox(mailboxId)) {
        const arr = STORAGE.loadSharedLetters(mailboxId) || [];
        let changed = false;
        for (let i = 0; i < arr.length; i++) {
          if (arr[i] && arr[i].id && successIdSet.has(String(arr[i].id)) && arr[i]._remoteSynced !== true) {
            arr[i] = { ...arr[i], _remoteSynced: true };
            changed = true;
          }
        }
        if (changed) STORAGE.saveSharedLetters(mailboxId, arr);
      } else {
        const all = STORAGE.loadLetters() || [];
        let changed = false;
        for (let i = 0; i < all.length; i++) {
          if (all[i] && all[i].id && successIdSet.has(String(all[i].id)) && all[i]._remoteSynced !== true) {
            all[i] = { ...all[i], _remoteSynced: true };
            changed = true;
          }
        }
        if (changed) STORAGE.saveLetters(all);
      }
    } catch (_) {}
  },

  /**
   * 拉取云端指定 mailbox 的全部原始信件 record，
   * 转换成前端扁平 letter 格式，merge 到本地 localStorage / sharedLetters，
   * 返回合并后的信件数组（下次 loadMailboxLetters 就能直接用）。
   */
  async loadRemoteLettersAndMergeLocal(mailboxId) {
    if (!mailboxId) return null;
    if (!window.MailService || typeof MailService.listRemoteLetters !== 'function') return null;
    let raw = [];
    try { raw = await MailService.listRemoteLetters(mailboxId); } catch (_) { raw = []; }
    if (!Array.isArray(raw) || raw.length === 0) return null;
    // record -> 扁平 letter（向后兼容 editor.js 的信件格式）
    const flats = raw.map(record => {
      const inner = record.letter || {};
      return {
        // 外层 record 元信息 + 内层 letter 的正文/内容，用 updatedAt 更大的覆盖
        ...inner,
        ...(record.letter || {}),
        id: record.id || inner.id,
        mailboxId: mailboxId,
        senderAccountKey: record.senderAccountKey || inner.senderAccountKey || '',
        recipientAccountKey: record.recipientAccountKey || inner.recipientAccountKey || '',
        senderIdentity: record.senderIdentity || inner.senderIdentity || null,
        recipientIdentity: record.recipientIdentity || inner.recipientIdentity || null,
        deliveryStatus: record.deliveryStatus || inner.deliveryStatus || inner.status || 'sent',
        status: inner.status || record.deliveryStatus || 'sent',
        sentAt: record.sentAt || inner.sentAt || inner.createdAt || 0,
        readAt: record.readAt || inner.readAt || null,
        clientMessageId: record.clientMessageId || inner.clientMessageId || '',
        itemAttachments: record.itemAttachments || inner.itemAttachments || [],
        author: inner.author || (record.senderIdentity ? {
          userId: record.senderIdentity.accountKey || record.senderAccountKey,
          username: record.senderIdentity.username || record.senderAccountKey,
          displayName: record.senderIdentity.identityName || record.senderIdentity.displayName,
          role: record.senderIdentity.role || ''
        } : null),
        updatedAt: inner.updatedAt || record.updatedAt || record.sentAt || 0,
        createdAt: inner.createdAt || record.sentAt || 0,
        _remoteSynced: true,
        _fromRemote: true
      };
    }).filter(f => f && f.id);

    if (!flats.length) return null;

    // 合并到本地
    let localArr = [];
    let saveFn = null;
    if (this.isSharedMailbox(mailboxId)) {
      localArr = STORAGE.loadSharedLetters(mailboxId) || [];
      saveFn = (newArr) => STORAGE.saveSharedLetters(mailboxId, newArr);
    } else {
      const all = STORAGE.loadLetters() || [];
      localArr = all.filter(l => l.mailboxId === mailboxId);
      const others = all.filter(l => l.mailboxId !== mailboxId);
      saveFn = (newArrForBox) => STORAGE.saveLetters([...others, ...newArrForBox]);
    }
    const byId = new Map();
    for (const l of localArr) byId.set(String(l.id), l);
    for (const f of flats) {
      const key = String(f.id);
      const old = byId.get(key);
      if (!old || ((f.updatedAt || f.createdAt || 0) >= (old.updatedAt || old.createdAt || 0))) {
        // 若 old 有一些本地独有字段（例如 _blob / _mediaId 等临时），从 old 保留
        const merged = old ? { ...old, ...f } : f;
        byId.set(key, merged);
      }
    }
    const finalArr = Array.from(byId.values());
    try { saveFn(finalArr); } catch (_) {}
    return finalArr;
  },

  /**
   * 遍历当前用户"能看到的所有 mailbox"，把本地全部信件批量 upsert 到云端（迁移用）。
   * 调用时机：登录成功后。
   */
  async upsertAllLocalLettersToRemote(options = {}) {
    const stats = { total: 0, succeeded: 0, failed: 0, skipped: 0 };
    if (!window.MailService || typeof MailService.isRemoteAvailable !== 'function' ||
        typeof MailService.batchUpsertRemoteLetters !== 'function') return stats;
    let ok = false;
    try { ok = await MailService.isRemoteAvailable(); } catch (_) { ok = false; }
    if (!ok) { stats.skipped = -1; return stats; }

    const u = AuthManager.getCurrentUser() || null;
    const accountKey = (typeof MailService.getAccountKey === 'function')
      ? MailService.getAccountKey(u)
      : String(u?.username || u?.id || '').toLowerCase();

    // 收集：1) 个人信箱所有信  2) 共享信箱所有信（当前用户在 members 中的）
    const allBoxes = (this.getMailboxes ? this.getMailboxes() : [])
      .filter(m => m && m.id).map(m => String(m.id));
    const toUpsert = [];
    for (const mailboxId of allBoxes) {
      const letters = this.isSharedMailbox(mailboxId)
        ? (STORAGE.loadSharedLetters ? STORAGE.loadSharedLetters(mailboxId) || [] : [])
        : ((STORAGE.loadLetters ? STORAGE.loadLetters() : []).filter(l => l.mailboxId === mailboxId));
      for (const flat of letters) {
        if (!flat || !flat.id) continue;
        // 跳过已同步且 updatedAt 没变的
        if (!options.forceAll && flat._remoteSynced === true) continue;
        stats.total++;
        const record = {
          id: flat.id,
          mailboxId,
          senderAccountKey: flat.senderAccountKey || flat.author?.username || flat.author?.id || accountKey || '',
          recipientAccountKey: flat.recipientAccountKey || '',
          senderIdentity: flat.senderIdentity || null,
          recipientIdentity: flat.recipientIdentity || null,
          deliveryStatus: flat.deliveryStatus || flat.status || 'sent',
          sentAt: flat.sentAt || flat.createdAt || Date.now(),
          readAt: flat.readAt || null,
          clientMessageId: flat.clientMessageId || `local-${flat.id}`,
          itemAttachments: flat.itemAttachments || [],
          letter: {
            ...flat,
            id: flat.id,
            mailboxId,
            status: flat.status || flat.deliveryStatus || 'sent',
            sender: flat.sender || flat.author?.displayName || flat.senderAccountKey || '',
            recipient: flat.recipient || flat.to || '',
            createdAt: flat.createdAt || Date.now(),
            updatedAt: flat.updatedAt || Date.now()
          },
          updatedAt: flat.updatedAt || Date.now()
        };
        if (flat.author && !record.senderIdentity) {
          record.senderIdentity = {
            accountKey: String(flat.author.username || flat.author.id || '').toLowerCase(),
            username: flat.author.username || '',
            displayName: flat.author.displayName || '',
            role: flat.author.role || '',
            identityName: flat.author.displayName || flat.author.username || ''
          };
        }
        toUpsert.push(record);
      }
    }
    if (!toUpsert.length) return stats;
    // 分批（50 条一批）
    const batch = options.batchSize || 50;
    for (let i = 0; i < toUpsert.length; i += batch) {
      const chunk = toUpsert.slice(i, i + batch);
      try {
        const r = await MailService.batchUpsertRemoteLetters(chunk);
        if (r && Array.isArray(r.results)) {
          for (const x of r.results) {
            if (x && x.ok) { stats.succeeded++; this._markLettersRemoteSynced(x.id.split('|')[0] || chunk[0]?.mailboxId, new Set([String(x.id)])); }
            else stats.failed++;
          }
        } else { stats.failed += chunk.length; }
      } catch (_) { stats.failed += chunk.length; }
      if (options.gapMs && i + batch < toUpsert.length) await new Promise(res => setTimeout(res, options.gapMs));
    }
    return stats;
  },

  getLetterAuthorDisplay(letter) {
    const currentUser = AuthManager.getCurrentUser();
    const author = letter.author;

    if (!author) {
      return letter.sender || '佚名';
    }

    if (currentUser && author.userId === currentUser.id) {
      return `我 · ${author.displayName}`;
    }

    return author.displayName;
  },

  isMyLetter(letter) {
    const currentUser = AuthManager.getCurrentUser();
    if (!currentUser || !letter.author) return false;
    return letter.author.userId === currentUser.id;
  },

  /* ========================================
     信箱号系统 & 加入信箱
     ======================================== */

  // 生成 6 位唯一信箱号（排除易混字符: 0/O/1/I）
  _generateMailboxCode() {
    const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const tryCount = 50;
    for (let i = 0; i < tryCount; i++) {
      let code = '';
      for (let j = 0; j < 6; j++) {
        code += CHARS[Math.floor(Math.random() * CHARS.length)];
      }
      // 唯一性校验：索引快查 + 私有/共享全量慢查（兼容 mailboxCode & code 两个字段）
      const existing = STORAGE.getMailboxIdByCode(code);
      if (existing) continue;
      const inShared = STORAGE.loadSharedMailboxes().some(m =>
        (m.mailboxCode && m.mailboxCode === code) || (m.code && m.code === code)
      );
      if (inShared) continue;
      const inPrivate = STORAGE.loadMailboxes().some(m =>
        (m.mailboxCode && m.mailboxCode === code) || (m.code && m.code === code)
      );
      if (inPrivate) continue;
      return code;
    }
    // 极少见的冲突回退（10位避免碰撞）
    return 'MB' + Date.now().toString(36).toUpperCase().slice(-4);
  },

  // 为所有已有信箱补全 mailboxCode（老数据升级）
  // 返回 true 表示有任何改动（回写了 storage）
  _ensureAllMailboxesHaveCode() {
    let changed = false;
    const saveIndexFn = (typeof STORAGE.saveMailboxCodeIndex === 'function')
      ? STORAGE.saveMailboxCodeIndex.bind(STORAGE) : null;

    // 1) 个人信箱
    const privates = STORAGE.loadMailboxes() || [];
    for (let i = 0; i < privates.length; i++) {
      const m = privates[i];
      if (!m.mailboxCode && !m.code) {
        const newCode = this._generateMailboxCode();
        m.mailboxCode = newCode;
        m.code = newCode; // 兼容老代码读 code 字段
        privates[i] = m;
        changed = true;
      } else if (!m.mailboxCode && m.code) {
        m.mailboxCode = m.code; // 向上兼容：code -> mailboxCode
        privates[i] = m;
        changed = true;
      } else if (m.mailboxCode && m.code && m.mailboxCode !== m.code) {
        // 两者不一致：统一为 mailboxCode（优先），并写回
        m.code = m.mailboxCode;
        privates[i] = m;
        changed = true;
      }
      const finalCode = m.mailboxCode || m.code;
      if (finalCode && saveIndexFn) saveIndexFn(finalCode, m.id);
    }
    if (changed) STORAGE.saveMailboxes(privates);

    // 2) 共享信箱
    const shareds = STORAGE.loadSharedMailboxes() || [];
    let sharedChanged = false;
    for (let i = 0; i < shareds.length; i++) {
      const m = shareds[i];
      if (!m.mailboxCode && !m.code) {
        const newCode = this._generateMailboxCode();
        m.mailboxCode = newCode;
        m.code = newCode;
        shareds[i] = m;
        sharedChanged = true;
      } else if (!m.mailboxCode && m.code) {
        m.mailboxCode = m.code;
        shareds[i] = m;
        sharedChanged = true;
      } else if (m.mailboxCode && m.code && m.mailboxCode !== m.code) {
        m.code = m.mailboxCode;
        shareds[i] = m;
        sharedChanged = true;
      }
      const finalCode = m.mailboxCode || m.code;
      if (finalCode && saveIndexFn) saveIndexFn(finalCode, m.id);
    }
    if (sharedChanged) {
      // 逐个保存共享信箱（saveSharedMailbox 单条写入）
      shareds.forEach(sb => STORAGE.saveSharedMailbox(sb));
    }
    return changed || sharedChanged;
  },

  // 根据信箱号查询信箱（私有+共享都查，返回完整对象
  getMailboxByCode(code) {
    if (!code) return null;
    const upCode = String(code).toUpperCase();
    // 1. 先走索引快查
    const mbId = STORAGE.getMailboxIdByCode(upCode);
    if (mbId) {
      const shared = STORAGE.loadSharedMailboxes().find(m => m.id === mbId);
      if (shared) return { ...shared, isShared: true };
      const priv = STORAGE.loadMailboxes().find(m => m.id === mbId);
      if (priv) return priv;
    }
    // 2. 降级：全量慢查（处理老数据或索引缺失情况）
    const shared = STORAGE.loadSharedMailboxes().find(m => m.code && m.code.toUpperCase() === upCode);
    if (shared) {
      STORAGE.saveMailboxCodeIndex(upCode, shared.id);
      return { ...shared, isShared: true };
    }
    const priv = STORAGE.loadMailboxes().find(m => m.code && m.code.toUpperCase() === upCode);
    if (priv) {
      STORAGE.saveMailboxCodeIndex(upCode, priv.id);
      return priv;
    }
    return null;
  },

  // 保证某个信箱有 code：没有则生成并保存
  ensureMailboxHasCode(mailboxId) {
    const mailboxes = STORAGE.loadMailboxes();
    let idx = mailboxes.findIndex(m => m.id === mailboxId);
    let target = mailboxes[idx];
    let where = 'private';

    if (!target) {
      const shared = STORAGE.loadSharedMailboxes();
      idx = shared.findIndex(m => m.id === mailboxId);
      if (idx === -1) return null;
      target = shared[idx];
      where = 'shared';
    }

    if (!target.code) {
      target.code = this._generateMailboxCode();
      if (where === 'private') {
        mailboxes[idx] = target;
        STORAGE.saveMailboxes(mailboxes);
      } else {
        STORAGE.saveSharedMailbox(target);
      }
    }
    return target.code;
  },

  // 通过信箱号加入信箱（本地同步版，兼容老调用方）
  // 返回 { success, message, mailbox }
  joinMailboxByCode(code, userId) {
    if (!code || !userId) {
      return { success: false, message: '信箱号和用户不能为空', mailbox: null };
    }
    const mb = this.getMailboxByCode(code);
    if (!mb) {
      return { success: false, message: '信箱号无效，请检查后重试', mailbox: null };
    }

    const members = Array.isArray(mb.members) ? [...mb.members] : [];
    if (members.includes(userId)) {
      return { success: false, message: '你已在此信箱中，无需重复加入', mailbox: mb };
    }
    members.push(userId);

    // Save member info
    const currentUser = AuthManager.getCurrentUser();
    const displayName = currentUser
      ? (currentUser.displayName || currentUser.username || userId)
      : userId;
    const charId = currentUser?.role || '';

    // Update memberNames and memberCharacters
    const memberNames = { ...(mb.memberNames || {}), [userId]: displayName };
    const memberCharacters = { ...(mb.memberCharacters || {}) };
    if (charId && !memberCharacters[userId]) {
      memberCharacters[userId] = { characterId: charId, boundAt: Date.now() };
    }

    let finalMailbox;

    if (mb.isShared) {
      // 共享信箱：直接追加成员
      const allShared = STORAGE.loadSharedMailboxes();
      const idx = allShared.findIndex(m => m.id === mb.id);
      if (idx >= 0) {
        allShared[idx] = { ...allShared[idx], members, memberNames, memberCharacters, updatedAt: Date.now(), _memberDataDirty: true };
        finalMailbox = allShared[idx];
        STORAGE.saveSharedMailbox(finalMailbox);
      } else {
        finalMailbox = { ...mb, members, memberNames, memberCharacters, updatedAt: Date.now(), isShared: true, isCustom: true, _memberDataDirty: true };
        STORAGE.saveSharedMailbox(finalMailbox);
      }
    } else {
      // 私有信箱升级为共享
      const privateList = STORAGE.loadMailboxes();
      const idx = privateList.findIndex(m => m.id === mb.id);
      const upgraded = { ...mb, members, memberNames, memberCharacters, isShared: true, isCustom: true, updatedAt: Date.now(), _memberDataDirty: true };
      if (idx >= 0) {
        privateList[idx] = upgraded;
        STORAGE.saveMailboxes(privateList);
      }
      STORAGE.saveSharedMailbox(upgraded);
      finalMailbox = upgraded;
    }

    return { success: true, message: '加入成功', mailbox: finalMailbox };
  },

  /**
   * 异步版（核心！跨浏览器加入）：
   *  1) 先远端 POST /api/mailbox_codes/join （成功则写入本地 sharedMailboxes + codesIndex）
   *  2) 失败则回退本地 joinMailboxByCode()
   * 第二个参数兼容 userId 或 accountKey；若无则自动用当前登录用户的 accountKey
   * 返回 { success, message, mailbox }
   */
  async joinMailboxByCodeAsync(code, userIdOrAccountKey) {
    if (!code) return { success: false, message: '信箱号为空', mailbox: null };
    // 规范化 accountKey
    let accountKey = '';
    try {
      const u = AuthManager.getCurrentUser() || null;
      if (userIdOrAccountKey && typeof userIdOrAccountKey === 'string') {
        // 优先按 username/accountKey 语义解析
        const direct = String(userIdOrAccountKey).toLowerCase();
        const byUsername = AuthManager.getUserByUsername
          ? AuthManager.getUserByUsername(direct.replace(/^user-/i, ''))
          : null;
        const byId = AuthManager.getUserById ? AuthManager.getUserById(userIdOrAccountKey) : null;
        const matched = byUsername || byId;
        if (matched && (matched.username || matched.id)) {
          accountKey = String(matched.username || matched.id).toLowerCase();
        } else {
          accountKey = direct;
        }
      }
      if (!accountKey) {
        if (typeof MailService.getAccountKey === 'function') {
          accountKey = MailService.getAccountKey();
        } else if (u) {
          accountKey = String(u?.username || u?.id || '').toLowerCase();
        }
      }
    } catch (_) { accountKey = ''; }
    // 兜底：解析结果若是本地临时 id（user-xxx/guest-xxx），且存在已登录用户，则强制用其 username（accountKey）
    // —— 本地临时 id 跨设备不可靠，混入 memberAccountKeys 会导致刷新/换设备后信箱匹配不上
    const cur = AuthManager.getCurrentUser ? AuthManager.getCurrentUser() : null;
    if (cur && cur.username && (accountKey.startsWith('user-') || accountKey.startsWith('guest-'))) {
      accountKey = String(cur.username).trim().toLowerCase();
    }
    if (!accountKey) return { success: false, message: '未能识别当前用户身份', mailbox: null };

    if (window.MailService &&
        typeof MailService.isRemoteAvailable === 'function' &&
        typeof MailService.joinMailboxByCode === 'function') {
      try {
        const ok = await MailService.isRemoteAvailable();
        if (ok) {
          const r = await MailService.joinMailboxByCode(code, accountKey);
          if (r && r.success && r.mailbox) {
            const mb = r.mailbox;
            try {
              STORAGE.saveSharedMailbox(mb);
              const c = mb.mailboxCode || mb.code;
              if (c) STORAGE.saveMailboxCodeIndex(c, mb.id);
              if (typeof STORAGE.clearRemoteMailboxCache === 'function') {
                try { STORAGE.clearRemoteMailboxCache(); } catch (_) {}
              }
            } catch (_) {}
            // 同时把当前用户同步到本地 personal 的 members，避免下一次 getMailboxes 过滤掉
            try {
              const locals = STORAGE.loadMailboxes() || [];
              const idx = locals.findIndex(m => String(m.id) === String(mb.id));
              
              // Get current user's info for memberNames
              const currentUser = AuthManager.getCurrentUser();
              const displayName = currentUser
                ? (currentUser.displayName || currentUser.username || accountKey)
                : accountKey;
              const charId = currentUser?.role || '';

              if (idx >= 0) {
                const members = Array.isArray(locals[idx].members) ? locals[idx].members.slice() : [];
                if (!members.includes(accountKey)) members.push(accountKey);
                const memberAccountKeys = Array.isArray(locals[idx].memberAccountKeys) ? locals[idx].memberAccountKeys.slice() : [];
                if (!memberAccountKeys.includes(accountKey)) memberAccountKeys.push(accountKey);
                
                // Save memberNames and memberCharacters
                const memberNames = { ...(locals[idx].memberNames || {}), [accountKey]: displayName };
                const memberCharacters = { ...(locals[idx].memberCharacters || {}) };
                if (charId && !memberCharacters[accountKey]) {
                  memberCharacters[accountKey] = { characterId: charId, boundAt: Date.now() };
                }
                
                locals[idx] = { ...locals[idx], ...mb, members, memberAccountKeys, memberNames, memberCharacters, _remoteUpsertNeeded: false, _memberDataDirty: true };
              } else {
                const base = { ...mb, _remoteUpsertNeeded: false, _memberDataDirty: true };
                if (!Array.isArray(base.members)) base.members = [accountKey];
                if (!Array.isArray(base.memberAccountKeys)) base.memberAccountKeys = [accountKey];
                base.memberNames = { ...(base.memberNames || {}), [accountKey]: displayName };
                if (charId) {
                  base.memberCharacters = { ...(base.memberCharacters || {}), [accountKey]: { characterId: charId, boundAt: Date.now() } };
                }
                locals.push(base);
              }
              STORAGE.saveMailboxes(locals);
            } catch (_) {}
            // 补同步：把刚加入的成员数据推到远端，并强制拉回本账号信箱列表，
            // 确保另一台设备/端口立即可见
            (async () => {
              try {
                if (typeof STORAGE.flushRemoteMailboxes === 'function') {
                  await STORAGE.flushRemoteMailboxes(accountKey);
                }
                if (typeof STORAGE.forceReloadMailboxesFromRemote === 'function') {
                  await STORAGE.forceReloadMailboxesFromRemote(accountKey);
                }
              } catch (_) {}
            })();
            return { success: true, message: r.message || '加入成功（云端）', mailbox: mb };
          }
          if (r && !r.success) return { success: false, message: r.message || '加入失败', mailbox: null };
        }
      } catch (e) {
        console.warn('[join] 远端加入失败，回退本地：', e?.message || e);
      }
    }
    // 本地降级：用 userId（accountKey 也能当匹配用，因为本地 members 存的是用户 id）
    return this.joinMailboxByCode(code, userIdOrAccountKey || accountKey);
  },

  // 获取或创建访客用户 ID（用于未登录状态下仍然可以临时拥有身份）
  getOrCreateGuestUserId() {
    const GUEST_KEY = 'xinjian_guest_user_id';
    let id = localStorage.getItem(GUEST_KEY);
    if (!id) {
      id = 'guest-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
      localStorage.setItem(GUEST_KEY, id);
    }
    return id;
  },

  // 返回当前有效的 userId：登录用户优先，否则用访客 ID
  getCurrentUserId() {
    const u = AuthManager.getCurrentUser();
    if (u && u.id) return u.id;
    return this.getOrCreateGuestUserId();
  },

  /* ========================================
     远端 MongoDB 同步：把本地信箱 upsert 到云端（迁移 + 编辑补同步用）
     ======================================== */

  /**
   * 把单个本地 mailbox upsert 到 MongoDB（幂等，按 id 判重）。
   * 成功后清除 _remoteUpsertNeeded 标记并写回 localStorage。
   * 返回 {success, mailbox, message}
   */
  async upsertLocalMailboxToRemote(mailboxId) {
    const out = { success: false, mailbox: null, message: '' };
    if (!mailboxId) { out.message = 'mailboxId 为空'; return out; }
    if (!window.MailService || typeof MailService.isRemoteAvailable !== 'function' ||
        typeof MailService.createRemoteMailbox !== 'function') {
      out.message = 'MailService 不可用'; return out;
    }
    try {
      const ok = await MailService.isRemoteAvailable();
      if (!ok) { out.message = '云端不可用（离线模式）'; return out; }
    } catch (_) { out.message = '云端探测失败'; return out; }

    // 组装 mailbox 对象（个人 > shared 优先）
    const privates = STORAGE.loadMailboxes() || [];
    let mb = privates.find(m => String(m.id) === String(mailboxId));
    if (!mb) mb = STORAGE.loadSharedMailbox(mailboxId);
    if (!mb) { out.message = '本地找不到该信箱'; return out; }
    const u = AuthManager.getCurrentUser() || null;
    const accountKey = (typeof MailService.getAccountKey === 'function')
      ? MailService.getAccountKey(u)
      : String(u?.username || u?.id || '').toLowerCase();

    // 规范化成员：把 members / memberAccountKeys 统一成 memberAccountKeys 给后端
    const membersRaw = Array.isArray(mb.memberAccountKeys) ? mb.memberAccountKeys
      : (Array.isArray(mb.members) ? mb.members : (accountKey ? [accountKey] : []));
    const patch = {
      id: mb.id,
      name: mb.name || '',
      desc: mb.desc || '',
      icon: mb.icon || mb.cardIcon || '📫',
      themeColor: mb.themeColor || mb.accent || mb.cardAccent || '#8a6d3b',
      mapBackground: mb.mapBackground || mb.mapBg || null,
      bgGradient: mb.bgGradient || null,
      type: mb.type || 'normal',
      personA: mb.personA || null,
      personB: mb.personB || null,
      isCustom: mb.isCustom !== false,
      mailboxCode: mb.mailboxCode || mb.code || null,
      code: mb.code || mb.mailboxCode || null,
      ownerAccountKey: mb.ownerAccountKey || mb.owner || accountKey || null,
      memberAccountKeys: membersRaw.map(x => String(x || '').toLowerCase()).filter(Boolean),
      isShared: mb.isShared || false
    };

    try {
      const r = await MailService.createRemoteMailbox(patch); // POST /api/mailboxes 有 id 时走 upsert
      if (r && r.success && r.mailbox) {
        // 成功：写回本地，清 upsert 标记
        const remoteMb = r.mailbox;
        // 1) 更新个人信箱列表
        const ps = STORAGE.loadMailboxes() || [];
        const pIdx = ps.findIndex(m => String(m.id) === String(mailboxId));
        if (pIdx !== -1) {
          ps[pIdx] = { ...ps[pIdx], ...remoteMb, _remoteUpsertNeeded: false };
        } else {
          ps.push({ ...remoteMb, _remoteUpsertNeeded: false });
        }
        STORAGE.saveMailboxes(ps);
        // 2) 更新 sharedMailbox
        try { STORAGE.saveSharedMailbox({ ...remoteMb, _remoteUpsertNeeded: false }); } catch (_) {}
        // 3) 更新信箱号索引
        const code = remoteMb.mailboxCode || remoteMb.code;
        if (code && typeof STORAGE.saveMailboxCodeIndex === 'function') {
          STORAGE.saveMailboxCodeIndex(code, remoteMb.id);
        }
        if (typeof STORAGE.clearRemoteMailboxCache === 'function') {
          try { STORAGE.clearRemoteMailboxCache(); } catch (_) {}
        }
        out.success = true;
        out.mailbox = remoteMb;
        out.message = '已同步到云端';
      } else {
        out.message = (r && r.message) || '云端返回失败';
      }
    } catch (e) {
      out.message = '同步异常：' + (e?.message || String(e));
    }
    return out;
  },

  /**
   * 批量把所有本地"待同步"信箱 upsert 到远端。
   * 调用时机：登录成功后 / 服务恢复后 / 刷新页面。
   * @param options {object}  { forceAll: boolean, batchSize: number, gapMs: number }
   */
  async upsertAllLocalMailboxesToRemote(options = {}) {
    const stats = { total: 0, succeeded: 0, failed: 0, skipped: 0, messages: [] };
    if (!window.MailService || typeof MailService.isRemoteAvailable !== 'function') return stats;
    let remoteOk = false;
    try { remoteOk = await MailService.isRemoteAvailable(); } catch (_) { remoteOk = false; }
    if (!remoteOk) { stats.skipped = -1; return stats; }

    const forceAll = !!options.forceAll;
    const batchSize = options.batchSize || 5;
    const gapMs = options.gapMs || 50;
    const all = (STORAGE.loadMailboxes() || []).filter(m => m && m.id);
    const sharedAll = (STORAGE.loadSharedMailboxes && STORAGE.loadSharedMailboxes() || []).filter(m => m && m.id);
    // 合并 personal 和 shared
    const merged = new Map();
    all.forEach(m => merged.set(String(m.id), m));
    sharedAll.forEach(m => { if (!merged.has(String(m.id))) merged.set(String(m.id), m); });

    const presetIds = new Set([
      'mailbox-brenuo','mailbox-daliang','mailbox-tianzhu',
      'mailbox-rugu','mailbox-taozhi','mailbox-zhaixing',
      'mailbox-xiaowangzi','mailbox-xiejian','mailbox-hanmen-duet'
    ]);

    const queue = [];
    for (const mb of merged.values()) {
      const id = String(mb.id);
      if (presetIds.has(id)) continue; // 默认信箱不迁移（它们在老用户端保留本地即可）
      if (!forceAll && mb._remoteUpsertNeeded !== true && mb._remoteSynced === true) {
        // 已确认云端同步过且没标记为待同步：轻量跳过（避免无谓 upsert）。
        // 注意：不能再用 mailboxCode 判断 —— 本地新建但云端失败的信箱（_remoteSynced 缺失/false）
        // 必须推送，否则跨端口/跨设备永远搜不到。
        continue;
      }
      queue.push(id);
    }
    stats.total = queue.length;

    for (let i = 0; i < queue.length; i++) {
      const id = queue[i];
      const r = await this.upsertLocalMailboxToRemote(id);
      if (r.success) stats.succeeded++;
      else { stats.failed++; if (r.message) stats.messages.push(`[${id}] ${r.message}`); }
      // 分批控制
      if ((i + 1) % batchSize === 0 && i !== queue.length - 1) {
        await new Promise(res => setTimeout(res, gapMs));
      }
    }
    return stats;
  },

  /**
   * 工具：立即把远端信箱列表拉下来合并到本地（远端优先覆盖，本地 id 缺失的追加），
   * 成功后更新 _remoteMailboxCache 和 localStorage。返回合并后的列表（已做 visible 过滤前的原始列表）。
   */
  async loadRemoteMailboxesAndMergeLocal(currentUser = null) {
    if (!window.MailService || typeof MailService.isRemoteAvailable !== 'function' ||
        typeof MailService.listRemoteMailboxes !== 'function') return null;
    let ok = false;
    try { ok = await MailService.isRemoteAvailable(); } catch (_) { ok = false; }
    if (!ok) return null;
    const u = currentUser || AuthManager.getCurrentUser() || null;
    const ak = (typeof MailService.getAccountKey === 'function') ? MailService.getAccountKey(u) : null;
    if (!ak) return null;
    let remoteList = [];
    try { remoteList = await MailService.listRemoteMailboxes(ak); } catch (_) { remoteList = []; }
    if (!Array.isArray(remoteList) || remoteList.length === 0) return null;
    // 合并到本地：远端 id -> 远端覆盖，本地没有则追加
    const locals = STORAGE.loadMailboxes() || [];
    const localById = new Map(locals.map(m => [String(m.id), m]));
    let changed = false;
    remoteList.forEach(rmb => {
      const id = String(rmb.id);
      const base = localById.get(id) || {};
      // 合并 memberAccountKeys：远端成员 ∪ 本地成员（确保新加入的成员在本地也生效）
      const localMembers = Array.isArray(base.memberAccountKeys) ? base.memberAccountKeys : (Array.isArray(base.members) ? base.members : []);
      const remoteMembers = Array.isArray(rmb.memberAccountKeys) ? rmb.memberAccountKeys : (Array.isArray(rmb.members) ? rmb.members : []);
      const mergedMemberSet = new Set();
      [...localMembers, ...remoteMembers].forEach(x => {
        const s = String(x || '').toLowerCase();
        if (s) mergedMemberSet.add(s);
      });
      const mergedMembers = Array.from(mergedMemberSet);
      const mergedRmb = { ...rmb };
      if (mergedMembers.length > 0) {
        mergedRmb.memberAccountKeys = mergedMembers;
        mergedRmb.members = mergedMembers; // 同时保留老字段名兼容
      }
      const newValue = { ...base, ...mergedRmb, _remoteUpsertNeeded: false, _remoteSynced: true };
      // 检测是否有实质性变化，避免无谓写回
      if (!localById.has(id) || JSON.stringify(base) !== JSON.stringify(newValue)) changed = true;
      localById.set(id, newValue);
      if (rmb.mailboxCode && typeof STORAGE.saveMailboxCodeIndex === 'function') {
        STORAGE.saveMailboxCodeIndex(rmb.mailboxCode, id);
      }
      try { STORAGE.saveSharedMailbox({ ...mergedRmb, _remoteUpsertNeeded: false, _remoteSynced: true }); } catch (_) {}
    });
    const merged = Array.from(localById.values());
    STORAGE.saveMailboxes(merged);
    if (typeof STORAGE.clearRemoteMailboxCache === 'function') {
      try { STORAGE.clearRemoteMailboxCache(); } catch (_) {}
    }
    // 合并成功后派发事件，调用方可以监听刷新 UI
    if (changed) {
      try {
        window.dispatchEvent(new CustomEvent('mailboxes:synced', { detail: { source: 'loadRemoteMailboxesAndMergeLocal', count: remoteList.length } }));
      } catch (_) {}
    }
    return merged;
  },

  /* ========================================
     跨用户：信箱分享包 导入/导出（纯前端纯文字分享，配合 6 位信箱号使用）
     ======================================== */

  // 打包：mailbox 对象 + 前 maxLetters 封信 → JSON → UTF-8 safe base64 → XJ:// 前缀
  buildSharePackage(mailboxId, maxLetters = 10) {
    if (!mailboxId) return null;
    // 1. 收集信箱对象（个人信箱 > 共享信箱 > getMailboxes 合并列表兜底）
    const privates = STORAGE.loadMailboxes() || [];
    let mb = privates.find(m => m.id === mailboxId);
    if (!mb) mb = STORAGE.loadSharedMailbox(mailboxId);
    // 兜底：getMailboxes 包含了 remote 缓存数据（默认信箱可能只存在于远端缓存中）
    if (!mb && typeof this.getMailboxes === 'function') {
      try {
        const all = this.getMailboxes();
        mb = all.find(m => String(m.id) === String(mailboxId)) || null;
      } catch (_) {}
    }
    if (!mb) return null;
    // 2. 确保 mailboxCode / code 一致，且使用所有数据源中最新的 code
    // 先尝试从 getMailboxes() 获取同 id 信箱（它合并了 remote 缓存，通常最新）
    let canonicalMb = mb;
    if (typeof this.getMailboxes === 'function') {
      try {
        const all = this.getMailboxes();
        const merged = all.find(m => String(m.id) === String(mailboxId)) || null;
        if (merged && merged.mailboxCode) canonicalMb = merged;
      } catch (_) {}
    }
    // 如果 getMailboxes 没拿到，再试共享信箱
    if (!canonicalMb.mailboxCode) {
      const sh = STORAGE.loadSharedMailbox(mailboxId);
      if (sh && sh.mailboxCode) canonicalMb = sh;
    }
    // 用索引做最终仲裁
    let effectiveCode = canonicalMb.mailboxCode || canonicalMb.code || mb.mailboxCode || mb.code || null;
    if (typeof STORAGE.loadMailboxCodesIndex === 'function') {
      try {
        const idx = STORAGE.loadMailboxCodesIndex();
        const idxCode = idx ? Object.entries(idx).find(([c, id]) => id === mailboxId)?.[0] : null;
        if (idxCode) effectiveCode = idxCode;
      } catch (_) {}
    }
    if (!effectiveCode) {
      effectiveCode = this._generateMailboxCode(mb.name || canonicalMb.name);
    }
    // 强制统一到 mb 对象（深拷贝前）
    mb.mailboxCode = effectiveCode;
    mb.code = effectiveCode;
    // 3. 收集前 maxLetters 封信（只保留元信息：id/title/from/to/date，不要正文/附件 blob，避免包太大）
    const letters = this.loadMailboxLetters(mailboxId).slice(0, maxLetters).map(l => ({
      id: l.id, title: l.title || '', from: l.from || '', to: l.to || '',
      date: l.date || l.createdAt || '', preview: (l.preview || '').slice(0, 40),
      mailboxId: l.mailboxId || mailboxId, readAt: l.readAt || null
    }));
    const pack = { v: 1, mb: JSON.parse(JSON.stringify(mb)), lts: letters };
    try {
      const json = JSON.stringify(pack);
      const b64 = btoa(unescape(encodeURIComponent(json)));
      return 'XJ://' + b64;
    } catch (e) {
      console.warn('[share] build fail:', e);
      return null;
    }
  },

  // 解析用户粘贴的分享字符串，返回 {success, mailbox, letters, message}
  // 兼容格式：XJ://base64 / XJMBX://base64 / 纯JSON / 纯6位码
  parseSharePackage(str) {
    const out = { success: false, mailbox: null, letters: [], message: '' };
    if (!str || typeof str !== 'string') { out.message = '空内容'; return out; }
    const s = str.trim();
    // 情形 1：只是 6 位码，不能做跨用户分享
    if (/^[A-HJ-NP-Z0-9]{4,10}$/.test(s)) {
      out.message = '输入是纯信箱号。跨用户分享需要复制「分享内容」字符串（格式 XJ://...），请找朋友发完整分享内容再粘贴到此处';
      out.codeOnly = s.toUpperCase();
      return out;
    }
    // 情形 2：XJ:// 或 XJMBX:// 前缀的 base64 包
    const m = s.match(/XJ(?:MBX)?:\/\/([A-Za-z0-9+/=]+)/);
    let jsonStr = null;
    if (m) {
      try {
        jsonStr = decodeURIComponent(escape(atob(m[1])));
      } catch (e) {
        out.message = '分享内容解析失败（Base64 解码错误）';
        return out;
      }
    } else if (s.charAt(0) === '{' || s.charAt(0) === '[') {
      // 情形 3：裸 JSON
      jsonStr = s;
    }
    if (!jsonStr) { out.message = '无法识别的分享格式。应为 XJ://... 格式或 JSON'; return out; }
    let pack;
    try { pack = JSON.parse(jsonStr); } catch (e) { out.message = '分享内容解析失败（JSON 格式错误）'; return out; }
    if (!pack || typeof pack !== 'object') { out.message = '分享包结构错误'; return out; }
    if (!pack.mb || !pack.mb.id) { out.message = '分享包缺少信箱信息'; return out; }
    out.mailbox = pack.mb;
    out.letters = Array.isArray(pack.lts) ? pack.lts : [];
    out.success = true;
    return out;
  },

  // 把 parseSharePackage 成功的结果导入本地 storage：信箱 / 共享信箱 / 信件 / 索引
  importSharePackage(parsed) {
    const r = { success: false, message: '', mailboxId: null, mailboxCode: null, importedLetters: 0 };
    if (!parsed || !parsed.success || !parsed.mailbox) { r.message = '解析失败'; return r; }
    const mb = JSON.parse(JSON.stringify(parsed.mailbox));
    const letters = parsed.letters || [];
    // 确保字段齐全，且 mailboxCode / code 必须一致（避免分享者两端数据不一致导致解析偏差）
    if (!mb.mailboxCode && mb.code) mb.mailboxCode = mb.code;
    if (mb.mailboxCode && !mb.code) mb.code = mb.mailboxCode;
    if (!mb.mailboxCode) {
      mb.mailboxCode = this._generateMailboxCode(mb.name);
      mb.code = mb.mailboxCode;
    }
    // 强制统一：如果两者都存在但不同，取 mailboxCode 为准（打包时也是这么处理的）
    if (mb.mailboxCode && mb.code && mb.mailboxCode !== mb.code) {
      mb.code = mb.mailboxCode;
    }
    const code = mb.mailboxCode;
    r.mailboxId = mb.id;
    r.mailboxCode = code;

    // 1. 写入索引
    if (typeof STORAGE.saveMailboxCodeIndex === 'function') {
      STORAGE.saveMailboxCodeIndex(code, mb.id);
    }

    // 2. 写入个人信箱列表（若不存在），若存在就合并 code 字段
    const privates = STORAGE.loadMailboxes() || [];
    const pIdx = privates.findIndex(x => x.id === mb.id);
    if (pIdx === -1) {
      privates.push(mb);
    } else {
      privates[pIdx] = { ...mb, ...privates[pIdx], mailboxCode: code, code };
    }
    STORAGE.saveMailboxes(privates);

    // 3. 同步写入共享信箱（等成员真正确认加入时会覆盖 members；此处 members 以原分享者传来的保留，若为空就不写）
    try {
      const existingShared = STORAGE.loadSharedMailbox(mb.id);
      if (!existingShared) {
        STORAGE.saveSharedMailbox(mb);
      } else {
        STORAGE.saveSharedMailbox({ ...mb, ...existingShared, mailboxCode: code, code });
      }
    } catch (e) { /* ignore */ }

    // 4. 写入信件（若不存在，就追加）
    if (letters.length > 0) {
      const all = STORAGE.loadLetters() || [];
      const existIds = new Set(all.map(l => l.id));
      let added = 0;
      letters.forEach(l => {
        if (!l || !l.id) return;
        if (existIds.has(l.id)) return;
        all.push({ ...l, mailboxId: mb.id, _importedAt: Date.now() });
        added++;
      });
      if (added > 0) { STORAGE.saveLetters(all); r.importedLetters = added; }
    }

    r.success = true;
    r.message = `已导入信箱「${mb.name}」（信箱号 ${code}）${r.importedLetters ? `，附 ${r.importedLetters} 封信摘要` : ''}`;
    return r;
  }
});
