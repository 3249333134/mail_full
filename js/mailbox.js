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
    }
  ],

};

/* ========================================
   Mailbox Manager - Core (Init/Management/Rendering)
   ======================================== */

Object.assign(MailboxManager, {
  // 初始化示例数据
  initSampleData() {
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
      // 加载测试音频文件
      const audioUrl = 'mailfile/mail_re/6月27日.m4a';
      console.log('[测试录音] 开始加载:', audioUrl);
      const response = await fetch(audioUrl);
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
    let mailboxes = STORAGE.loadMailboxes();
    if (!mailboxes || mailboxes.length === 0) {
      mailboxes = JSON.parse(JSON.stringify(this.defaultMailboxes));
      STORAGE.saveMailboxes(mailboxes);
    } else {
      const defaultIds = new Set(this.defaultMailboxes.map(m => m.id));
      const customMailboxes = mailboxes.filter(m => !defaultIds.has(m.id) && m.isCustom);
      
      // 按 defaultMailboxes 的顺序排列默认信箱
      const orderedDefault = [];
      for (const def of this.defaultMailboxes) {
        const idx = mailboxes.findIndex(m => m.id === def.id);
        if (idx === -1) {
          orderedDefault.push(JSON.parse(JSON.stringify(def)));
        } else {
          // 默认信箱：名称、描述、图标、颜色、背景使用默认配置，其他字段保留用户数据
          orderedDefault.push({ 
            ...JSON.parse(JSON.stringify(def)), 
            ...mailboxes[idx],
            name: def.name,
            desc: def.desc,
            icon: def.icon,
            accent: def.accent,
            bgGradient: def.bgGradient,
            cardAccent: def.cardAccent
          });
        }
      }
      
      // 默认信箱在前，自定义信箱在后
      mailboxes = [...orderedDefault, ...customMailboxes];
      STORAGE.saveMailboxes(mailboxes);
    }

    // 合并当前用户是成员的共享信箱
    const currentUser = AuthManager.getCurrentUser();
    if (currentUser) {
      const sharedMailboxes = STORAGE.loadSharedMailboxes();
      const userSharedBoxes = sharedMailboxes.filter(sm => 
        sm.members && sm.members.includes(currentUser.id)
      );

      userSharedBoxes.forEach(sharedBox => {
        const existingIdx = mailboxes.findIndex(m => m.id === sharedBox.id);
        if (existingIdx === -1) {
          // 新增共享信箱到列表
          mailboxes.push({
            ...sharedBox,
            isShared: true,
            isCustom: true
          });
        } else {
          // 更新已存在的信箱，标记为共享
          mailboxes[existingIdx] = {
            ...mailboxes[existingIdx],
            ...sharedBox,
            isShared: true
          };
        }
      });
    }

    // 根据用户角色过滤信箱：修璟和萱宣显示寒门与挟剑信箱
    if (currentUser) {
      const userRole = currentUser.role;
      if (userRole === 'xiu-jing' || userRole === 'xuan-xuan') {
        mailboxes = mailboxes.filter(m =>
          m.id === 'mailbox-hanmen-duet' || m.id === 'mailbox-xiejian'
        );
      }
    }

    return mailboxes;
  },

  updateMailbox(mailboxId, updates) {
    const mailboxes = this.getMailboxes();
    const index = mailboxes.findIndex(m => m.id === mailboxId);
    if (index !== -1) {
      mailboxes[index] = { ...mailboxes[index], ...updates };
      STORAGE.saveMailboxes(mailboxes);
      return mailboxes[index];
    }
    return null;
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
          ${count > 0 ? `<span class="sidebar-nav-count" style="background:${mb.cardAccent || mb.accent}">${count}</span>` : ''}
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

      const initial = (letter.recipient || '?').charAt(0);

      card.innerHTML = `
        <div class="letter-card-seal">${initial}</div>
        <div class="letter-card-content">
          <div class="letter-recipient">致 ${letter.recipient || '未知的人'}</div>
          <div class="letter-date">${letter.date || (letter.createdAt ? new Date(letter.createdAt).toLocaleDateString('zh-CN') : '')}</div>
          <div class="letter-preview">${previewText || '（空白的信）'}</div>
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
    for (const letter of [...localLetters, ...serverLetters]) byId.set(letter.id, letter);
    return Array.from(byId.values());
  },

  saveMailboxLetters(mailboxId, letters) {
    if (this.isSharedMailbox(mailboxId)) {
      STORAGE.saveSharedLetters(mailboxId, letters);
    } else {
      const allLetters = STORAGE.loadLetters().filter(l => l.mailboxId !== mailboxId);
      STORAGE.saveLetters([...allLetters, ...letters]);
    }
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
  }
});
