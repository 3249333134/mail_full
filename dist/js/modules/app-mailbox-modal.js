/* ========================================
   App - Mailbox Modal
   ======================================== */

Object.assign(App, {
  initMailboxModal() {
    const modal = document.getElementById('mailbox-modal');
    const overlay = modal?.querySelector('.mailbox-modal-overlay');
    const closeBtn = document.getElementById('mailbox-modal-close');
    const cancelBtn = document.getElementById('mailbox-form-cancel');
    const saveBtn = document.getElementById('mailbox-form-save');

    // 关闭弹窗（两个面板都用同一关闭逻辑）
    const closeModal = () => modal?.classList.remove('active');
    if (overlay) overlay.addEventListener('click', closeModal);
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

    // ===== Tab 切换 =====
    const tabContainer = document.getElementById('mailbox-modal-tabs');
    if (tabContainer) {
      tabContainer.querySelectorAll('.mailbox-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const tab = btn.dataset.tab;
          tabContainer.querySelectorAll('.mailbox-tab-btn').forEach(b => b.classList.toggle('active', b === btn));
          document.getElementById('mailbox-create-panel').style.display = tab === 'create' ? 'block' : 'none';
          document.getElementById('mailbox-join-panel').style.display = tab === 'join' ? 'block' : 'none';
          if (tab === 'create') {
            document.getElementById('mailbox-modal-title').textContent =
              (this._mailboxFormData && this._mailboxFormData.id) ? '编辑信箱' : '新增信箱';
          } else {
            document.getElementById('mailbox-modal-title').textContent = '加入信箱';
          }
        });
      });
    }

    // 信箱号复制按钮：优先复制「XJ:// 跨用户分享包」，build 失败时回退到 6 位纯码
    const codeCopyBtn = document.getElementById('mailbox-code-copy-btn');
    if (codeCopyBtn) {
      codeCopyBtn.title = '点击复制：跨用户分享包 XJ://...（跨设备/跨浏览器都能通过粘贴导入加入）';
      codeCopyBtn.addEventListener('click', () => {
        const code = document.getElementById('mailbox-code-display')?.textContent.trim();
        if (!code || code === '—') return;
        // 若表单中已经有具体信箱 id（编辑状态），尝试打包成分享包
        let sharePkg = null;
        const mbId = this._mailboxFormData && this._mailboxFormData.id;
        if (mbId && typeof MailboxManager.buildSharePackage === 'function') {
          sharePkg = MailboxManager.buildSharePackage(mbId, 10);
        }
        const toWrite = sharePkg || code;
        this._copyToClipboard(toWrite, () => {
          const oldText = codeCopyBtn.textContent;
          codeCopyBtn.textContent = sharePkg ? '📋 已复制分享包' : '✅ 已复制信箱号';
          setTimeout(() => (codeCopyBtn.textContent = oldText), 1500);
        });
      });
    }

    // 图标选择
    const iconGrid = document.getElementById('mailbox-icon-grid');
    if (iconGrid) {
      iconGrid.querySelectorAll('span').forEach(span => {
        span.addEventListener('click', () => {
          iconGrid.querySelectorAll('span').forEach(s => s.classList.remove('active'));
          span.classList.add('active');
          this._mailboxFormData.icon = span.dataset.icon;
        });
      });
    }

    // 颜色选择
    const colorGrid = document.getElementById('mailbox-color-grid');
    if (colorGrid) {
      colorGrid.querySelectorAll('span').forEach(span => {
        span.addEventListener('click', () => {
          colorGrid.querySelectorAll('span').forEach(s => s.classList.remove('active'));
          span.classList.add('active');
          this._mailboxFormData.accent = span.dataset.color;
        });
      });
    }

    // 背景选择
    const bgGrid = document.getElementById('mailbox-bg-grid');
    if (bgGrid) {
      bgGrid.querySelectorAll('.bg-option').forEach(opt => {
        opt.addEventListener('click', () => {
          bgGrid.querySelectorAll('.bg-option').forEach(o => o.classList.remove('active'));
          opt.classList.add('active');
          this._mailboxFormData.bgGradient = opt.dataset.gradient;
        });
      });
    }

    // 地图背景选择
    const mapBgGrid = document.getElementById('mailbox-map-bg-grid');
    if (mapBgGrid) {
      mapBgGrid.querySelectorAll('.map-bg-option').forEach(opt => {
        opt.addEventListener('click', () => {
          mapBgGrid.querySelectorAll('.map-bg-option').forEach(o => o.classList.remove('active'));
          opt.classList.add('active');
          const bgVal = opt.dataset.mapBg;
          this._mailboxFormData.mapBackground = bgVal === 'null' ? null : bgVal;
        });
      });
    }

    // 成员邀请
    const inviteBtn = document.getElementById('member-invite-btn');
    const inviteInput = document.getElementById('member-invite-input');
    if (inviteBtn && inviteInput) {
      inviteBtn.addEventListener('click', () => this._handleInviteMember());
      inviteInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this._handleInviteMember();
        }
      });
    }

    // 检查登录状态，未登录隐藏成员管理
    this._updateMembersVisibility();

    // 信箱类型选择
    const typeOptions = document.querySelectorAll('.type-option');
    typeOptions.forEach(opt => {
      opt.addEventListener('click', () => {
        typeOptions.forEach(o => o.classList.remove('active'));
        opt.classList.add('active');
        this._mailboxFormData.type = opt.dataset.type;

        const dualSettings = document.getElementById('dual-mailbox-settings');
        if (dualSettings) {
          dualSettings.style.display = opt.dataset.type === 'dual' ? 'block' : 'none';
        }
      });
    });

    // 双人设置 - A方图标选择
    const personAIcons = document.querySelectorAll('.dual-person:first-child .dual-icon-option');
    personAIcons.forEach(icon => {
      icon.addEventListener('click', () => {
        personAIcons.forEach(i => i.classList.remove('active'));
        icon.classList.add('active');
        if (!this._mailboxFormData.personA) this._mailboxFormData.personA = {};
        this._mailboxFormData.personA.icon = icon.dataset.icon;
      });
    });

    // 双人设置 - B方图标选择
    const personBIcons = document.querySelectorAll('.dual-person:last-child .dual-icon-option');
    personBIcons.forEach(icon => {
      icon.addEventListener('click', () => {
        personBIcons.forEach(i => i.classList.remove('active'));
        icon.classList.add('active');
        if (!this._mailboxFormData.personB) this._mailboxFormData.personB = {};
        this._mailboxFormData.personB.icon = icon.dataset.icon;
      });
    });

    // ============ 加入信箱面板逻辑 ============
    const joinCodeInput = document.getElementById('join-mailbox-code-input');
    const joinCheckBtn = document.getElementById('join-mailbox-check-btn');
    const joinConfirmBtn = document.getElementById('join-mailbox-confirm-btn');
    const joinMsgBox = document.getElementById('join-mailbox-msg-box') || document.getElementById('join-mailbox-msg');

    // 查询按钮
    if (joinCheckBtn) {
      joinCheckBtn.addEventListener('click', () => this._handleJoinCheckMailbox());
    }
    if (joinCodeInput) {
      joinCodeInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') { e.preventDefault(); this._handleJoinCheckMailbox(); }
      });
      // 输入时自动规范化：去除所有空格/分隔符，转大写，字母数字保留
      joinCodeInput.addEventListener('input', () => {
        // 重置预览和确认按钮
        document.getElementById('join-mailbox-preview').style.display = 'none';
        if (joinConfirmBtn) joinConfirmBtn.disabled = true;
        const normalized = joinCodeInput.value
          .replace(/[\s\-_·.•,，。、;；]/g, '')   // 去除常见分隔符：空格/-/_/·/标点
          .toUpperCase();
        if (normalized !== joinCodeInput.value) {
          joinCodeInput.value = normalized;
        }
      });
      // 失焦时再做一次规范化兜底
      joinCodeInput.addEventListener('blur', () => {
        const normalized = joinCodeInput.value
          .replace(/[\s\-_·.•,，。、;；]/g, '')
          .toUpperCase();
        if (normalized !== joinCodeInput.value) {
          joinCodeInput.value = normalized;
        }
      });
    }
    if (joinConfirmBtn) {
      joinConfirmBtn.addEventListener('click', () => this._handleJoinConfirmMailbox());
    }

    // ============ 跨用户：分享内容粘贴导入 ============
    const pasteBtn = document.getElementById('join-paste-share-btn');
    const importBtn = document.getElementById('join-import-share-btn');
    const clearBtn = document.getElementById('join-clear-share-btn');
    const shareTextarea = document.getElementById('join-share-textarea');

    // 粘贴剪贴板内容：若用户给了剪贴板读权限直接读；否则光标 focus 到 textarea 让用户手动 Ctrl+V
    if (pasteBtn) {
      pasteBtn.addEventListener('click', async () => {
        if (navigator.clipboard && navigator.clipboard.readText) {
          try {
            const txt = await navigator.clipboard.readText();
            if (txt && shareTextarea) {
              shareTextarea.value = txt;
              shareTextarea.focus();
              this._showJoinMsg('已读取剪贴板，若正确请点击「导入分享内容并加入」', 'info');
            } else if (!txt) {
              this._showJoinMsg('剪贴板为空，请先复制朋友发来的 XJ:// 分享内容', 'error');
              shareTextarea?.focus();
            }
          } catch (e) {
            this._showJoinMsg('浏览器拒绝读取剪贴板，请手动粘贴到下方文本框（Ctrl+V）', 'error');
            shareTextarea?.focus();
          }
        } else {
          this._showJoinMsg('当前浏览器不支持剪贴板读取，请手动粘贴到下方文本框（Ctrl+V）', 'info');
          shareTextarea?.focus();
        }
      });
    }
    if (clearBtn && shareTextarea) {
      clearBtn.addEventListener('click', () => {
        shareTextarea.value = '';
        this._hideJoinMsg();
        const preview = document.getElementById('join-mailbox-preview');
        if (preview) preview.style.display = 'none';
        if (joinConfirmBtn) joinConfirmBtn.disabled = true;
      });
    }
    // 文本框输入时：实时规范化 & 若识别出分享包自动尝试解析预览
    if (shareTextarea && joinCodeInput) {
      shareTextarea.addEventListener('input', () => {
        const raw = shareTextarea.value || '';
        if (!raw.trim()) return;
        // 尝试从分享文本中识别纯 6 位码，写到上面的输入框
        if (/[A-HJ-NP-Z2-9]{4,10}/.test(raw)) {
          const m1 = raw.match(/[A-HJ-NP-Z2-9]{6,10}/);
          if (m1 && joinCodeInput.value !== m1[0]) {
            joinCodeInput.value = m1[0];
          }
        } else {
          const clean = raw.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
          if (/^[A-HJ-NP-Z2-9]{4,10}$/.test(clean) && joinCodeInput.value !== clean) {
            joinCodeInput.value = clean;
          }
        }
      });
    }
    if (importBtn) {
      importBtn.addEventListener('click', () => this._handleImportShare());
    }

    // ============ 保存按钮 ============
    if (saveBtn) {
      saveBtn.addEventListener('click', async () => {
        const nameInput = document.getElementById('mailbox-form-name');
        const descInput = document.getElementById('mailbox-form-desc');
        const name = nameInput?.value.trim();
        if (!name) {
          this._showCreateMsg('请输入信箱名称', 'error');
          nameInput?.focus();
          return;
        }

        // 🗺️ 地图必填校验：新建信箱必须选一张地图
        const mapBgGrid = document.getElementById('mailbox-map-bg-grid');
        const mapGroup = mapBgGrid?.closest('.map-bg-required-group') || mapBgGrid?.parentElement;
        const hasSelected = mapBgGrid?.querySelector('.map-bg-option.active');
        if (!hasSelected &&
            (this._mailboxFormData.mapBackground === undefined ||
             this._mailboxFormData.mapBackground === null ||
             this._mailboxFormData.mapBackground === '')) {
          // 视觉提示 + 滚动到 modal 顶部
          if (mapGroup) {
            mapGroup.classList.add('error');
            setTimeout(() => mapGroup.classList.remove('error'), 900);
          }
          const modal = document.getElementById('mailbox-modal');
          const scrollContainer = modal?.querySelector('.mailbox-modal-content, .modal-content, .modal-body') || modal;
          if (scrollContainer) scrollContainer.scrollTop = 0;
          mapBgGrid?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          this._showCreateMsg('请先选择一张地图（置顶位置）！', 'error');
          return;
        }

        // 校验通过，清除之前的错误
        this._hideCreateMsg();

        this._mailboxFormData.name = name;
        this._mailboxFormData.desc = descInput?.value.trim() || '';

        const personAInput = document.getElementById('dual-person-a');
        const personBInput = document.getElementById('dual-person-b');
        if (personAInput) {
          if (!this._mailboxFormData.personA) this._mailboxFormData.personA = {};
          this._mailboxFormData.personA.name = personAInput.value.trim();
        }
        if (personBInput) {
          if (!this._mailboxFormData.personB) this._mailboxFormData.personB = {};
          this._mailboxFormData.personB.name = personBInput.value.trim();
        }

        // ---------- 远端优先：先尝试 upsert 到云端（有 id 走 upsert，否则 create） ----------
        let remoteResult = null;
        let remoteOk = false;
        let remoteAvailable = false;
        try {
          if (window.MailService &&
              typeof MailService.isRemoteAvailable === 'function' &&
              typeof MailService.createRemoteMailbox === 'function') {
            remoteAvailable = await MailService.isRemoteAvailable();
            if (remoteAvailable) {
              const u = AuthManager.getCurrentUser() || null;
              const ak = (typeof MailService.getAccountKey === 'function')
                ? MailService.getAccountKey(u)
                : String(u?.username || u?.id || '').toLowerCase();
              const members = Array.isArray(this._mailboxFormData.members)
                ? this._mailboxFormData.members.map(String)
                : (ak ? [ak] : []);
              // 如果是编辑模式（有 id），并且本地有 mailboxCode，一起上传给后端判重 upsert
              const existingCode = this._mailboxFormData.mailboxCode || this._mailboxFormData.code;
              const payload = {
                name: this._mailboxFormData.name,
                desc: this._mailboxFormData.desc,
                icon: this._mailboxFormData.icon,
                themeColor: this._mailboxFormData.accent,
                mapBackground: this._mailboxFormData.mapBackground,
                bgGradient: this._mailboxFormData.bgGradient,
                type: this._mailboxFormData.type || 'normal',
                personA: this._mailboxFormData.personA || null,
                personB: this._mailboxFormData.personB || null,
                isCustom: true,
                ownerAccountKey: ak,
                memberAccountKeys: members
              };
              if (this._mailboxFormData.id) payload.id = this._mailboxFormData.id;
              if (existingCode) { payload.mailboxCode = existingCode; payload.code = existingCode; }
              try {
                const r = await Promise.race([
                  MailService.createRemoteMailbox(payload),
                  new Promise((_, rej) => setTimeout(() => rej(new Error('timeout_4s')), 4000))
                ]);
                if (r && r.success && r.mailbox) {
                  remoteResult = r.mailbox;
                  remoteOk = true;
                } else if (r && !r.success && r.message) {
                  console.warn('[save] 云端返回失败：', r.message);
                }
              } catch (e) {
                console.warn('[save] 远端创建/更新超时或失败，回退本地：', e?.message || e);
              }
            }
          }
        } catch (_) { remoteOk = false; }

        const mailboxes = MailboxManager.getMailboxes();
        if (this._mailboxFormData.id) {
          // ==== 编辑模式 ====
          const idx = mailboxes.findIndex(m => m.id === this._mailboxFormData.id);
          if (idx !== -1) {
            mailboxes[idx] = { ...mailboxes[idx], ...this._mailboxFormData };
            // 若云端返回了新 mailboxId/code，覆盖本地
            if (remoteOk && remoteResult) {
              if (remoteResult.mailboxCode || remoteResult.code) {
                mailboxes[idx].mailboxCode = remoteResult.mailboxCode || remoteResult.code;
                mailboxes[idx].code = remoteResult.code || remoteResult.mailboxCode;
              }
              if (remoteResult.id) mailboxes[idx].id = remoteResult.id;
              mailboxes[idx]._remoteUpsertNeeded = false;
            } else if (remoteAvailable && !remoteOk) {
              // 云端可用但失败了：标记待补同步
              mailboxes[idx]._remoteUpsertNeeded = true;
            }
            // 若信箱号仍不存在就补一个（老信箱升级 / 极端情况远端没返回）
            if (!mailboxes[idx].mailboxCode) {
              mailboxes[idx].mailboxCode = MailboxManager._generateMailboxCode(mailboxes[idx].name);
              mailboxes[idx].code = mailboxes[idx].mailboxCode;
              if (typeof STORAGE.saveMailboxCodeIndex === 'function') {
                STORAGE.saveMailboxCodeIndex(mailboxes[idx].mailboxCode, mailboxes[idx].id);
              }
            }
          }
          // 如果是共享信箱，同步保存到共享列表
          if (this._mailboxFormData.members && this._mailboxFormData.members.length > 1) {
            const sharedData = { ...mailboxes[idx], members: this._mailboxFormData.members };
            STORAGE.saveSharedMailbox(sharedData);
            if (typeof STORAGE.saveMailboxCodeIndex === 'function' && mailboxes[idx].mailboxCode) {
              STORAGE.saveMailboxCodeIndex(mailboxes[idx].mailboxCode, mailboxes[idx].id);
            }
          }
          // 展示信箱号
          this._showMailboxCodeInForm(mailboxes[idx].mailboxCode);
        } else {
          // ==== 新增模式 ====
          const newId = (remoteOk && remoteResult && remoteResult.id)
            ? remoteResult.id
            : ('mailbox-' + Date.now());
          const newCode = (remoteOk && remoteResult && (remoteResult.mailboxCode || remoteResult.code))
            ? (remoteResult.mailboxCode || remoteResult.code)
            : MailboxManager._generateMailboxCode(this._mailboxFormData.name);
          const newMailbox = {
            ...this._mailboxFormData,
            id: newId,
            mailboxCode: newCode,
            code: newCode,
            cardAccent: this._mailboxFormData.accent,
            isCustom: true,
            _remoteUpsertNeeded: (remoteAvailable && !remoteOk) ? true : false
          };
          mailboxes.push(newMailbox);
          this._mailboxFormData.id = newId;
          this._mailboxFormData.mailboxCode = newCode;

          // 写入信箱号 → 信箱ID 索引（直接写入，不依赖 saveMailboxes 内部循环）
          if (typeof STORAGE.saveMailboxCodeIndex === 'function') {
            STORAGE.saveMailboxCodeIndex(newCode, newId);
          }

          // 如果成员超过1人，保存为共享信箱
          if (this._mailboxFormData.members && this._mailboxFormData.members.length > 1) {
            STORAGE.saveSharedMailbox({
              ...newMailbox,
              members: this._mailboxFormData.members
            });
          }

          // 展示信箱号（新建成功后高亮）
          this._showMailboxCodeInForm(newCode);
        }

        STORAGE.saveMailboxes(mailboxes);

        // 清一次远端缓存（确保下一次 getMailboxesAsync 会重新拉云端合并结果）
        if (typeof STORAGE.clearRemoteMailboxCache === 'function') {
          try { STORAGE.clearRemoteMailboxCache(); } catch (_) {}
        }

        // 创建/编辑成功：先显示信箱号提示，让用户复制后再关闭
        // 若云端没同步成功，展示一个提示
        if (remoteAvailable && !remoteOk) {
          this._showCreateMsg('信箱已保存到本地，云端同步中…刷新后会自动重试', 'info');
        } else if (remoteOk) {
          this._showCreateMsg('✅ 已同步到云端，跨设备可搜索加入', 'success');
        }

        setTimeout(() => {
          closeModal();
          // 刷新并跳转
          const sidebarNav = document.getElementById('mailbox-sidebar-nav') || document.getElementById('sidebar-nav');
          if (sidebarNav) MailboxManager.renderSidebarNav(sidebarNav, this._mailboxFormData.id);
          this.navigate('mailbox', { mailboxId: this._mailboxFormData.id });
        }, 1200);
      });
    }
  },

  // ===== 复制到剪贴板辅助 =====
  _copyToClipboard(text, onSuccess) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => onSuccess && onSuccess()).catch(() => this._legacyCopy(text, onSuccess));
    } else {
      this._legacyCopy(text, onSuccess);
    }
  },
  _legacyCopy(text, onSuccess) {
    try {
      const ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.left = '-9999px';
      document.body.appendChild(ta); ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      onSuccess && onSuccess();
    } catch (e) { console.warn('[Copy] fail', e); }
  },

  // ===== 在表单面板中显示信箱号 =====
  _showMailboxCodeInForm(code) {
    const codeGroup = document.getElementById('mailbox-code-group');
    const codeDisplay = document.getElementById('mailbox-code-display');
    if (codeGroup && codeDisplay) {
      codeGroup.style.display = 'block';
      codeDisplay.textContent = code || '—';
      codeDisplay.classList.add('pulse');
      setTimeout(() => codeDisplay.classList.remove('pulse'), 1000);
    }
  },

  // ===== 加入信箱：跨用户分享内容导入 =====
  _handleImportShare() {
    const shareTextarea = document.getElementById('join-share-textarea');
    const codeInput = document.getElementById('join-mailbox-code-input');
    const preview = document.getElementById('join-mailbox-preview');
    const confirmBtn = document.getElementById('join-mailbox-confirm-btn');
    const textareaVal = (shareTextarea?.value || '').trim();
    // 1. 若 textarea 为空，尝试从上面的 code input 读（可能用户是把 XJ:// 粘到了上面的框里）
    let content = textareaVal;
    if (!content && codeInput) {
      const upVal = String(codeInput.value || '').trim();
      if (upVal.indexOf('XJ') !== -1 || upVal.indexOf('{') !== -1) {
        content = upVal;
      }
    }
    if (!content) {
      this._showJoinMsg('请先把朋友发来的 XJ://... 分享内容粘到下方文本框', 'error');
      shareTextarea?.focus();
      return;
    }
    // 2. 解析
    const parsed = typeof MailboxManager.parseSharePackage === 'function'
      ? MailboxManager.parseSharePackage(content)
      : { success: false, message: 'MailboxManager.parseSharePackage 缺失' };
    if (!parsed || !parsed.success) {
      // 如果是纯 6 位码，提示用户用上面的「查询信箱」按钮
      if (parsed && parsed.codeOnly) {
        if (codeInput && codeInput.value !== parsed.codeOnly) codeInput.value = parsed.codeOnly;
        this._showJoinMsg((parsed.message || '纯 6 位码不支持跨用户') + '。点击「🔍 查询信箱」即可（同设备同浏览器）', 'info');
        if (codeInput) codeInput.focus();
        this._handleJoinCheckMailbox();
        return;
      }
      this._showJoinMsg(parsed?.message || '分享内容解析失败', 'error');
      shareTextarea?.focus();
      return;
    }
    // 3. 导入到本地 storage
    const imported = typeof MailboxManager.importSharePackage === 'function'
      ? MailboxManager.importSharePackage(parsed)
      : { success: false, message: 'MailboxManager.importSharePackage 缺失' };
    if (!imported || !imported.success) {
      this._showJoinMsg(imported?.message || '导入失败', 'error');
      return;
    }
    // 4. 填充 codeInput + 自动触发查询 → 显示预览 + 启用确认加入按钮
    if (imported.mailboxCode) {
      if (codeInput) codeInput.value = imported.mailboxCode;
      this._joinPendingMailboxId = imported.mailboxId;
      this._showJoinMsg('✅ ' + (imported.message || '导入成功') + '。点击「确认加入」即可开始使用', 'success');
      if (preview && parsed.mailbox) {
        preview.style.display = 'flex';
        const iconEl = document.getElementById('join-preview-icon');
        const nameEl = document.getElementById('join-preview-name');
        const descEl = document.getElementById('join-preview-desc');
        const metaEl = document.getElementById('join-preview-meta');
        if (iconEl) iconEl.textContent = parsed.mailbox.icon || '📫';
        if (nameEl) nameEl.textContent = parsed.mailbox.name || '未命名信箱';
        if (descEl) descEl.textContent = parsed.mailbox.desc || '这个人很懒，还没有填写描述';
        const memberCount = (parsed.mailbox.members && parsed.mailbox.members.length) || 1;
        if (metaEl) metaEl.textContent = `📮 信箱号：${imported.mailboxCode} · 👥 ${memberCount} 位成员${imported.importedLetters ? ` · 📜 ${imported.importedLetters} 封信摘要已导入` : ''}`;
      }
      if (confirmBtn) { confirmBtn.disabled = false; confirmBtn.textContent = '✅ 确认加入'; }
    }
  },

  // ===== 加入信箱：校验 & 查询 =====
  _joinPendingMailboxId: null,

  async _handleJoinCheckMailbox() {
    const codeInput = document.getElementById('join-mailbox-code-input');
    const preview = document.getElementById('join-mailbox-preview');
    const confirmBtn = document.getElementById('join-mailbox-confirm-btn');
    const msgBox = document.getElementById('join-mailbox-msg-box') || document.getElementById('join-mailbox-msg');
    // 严格规范化：去除所有非字母数字字符，只保留 A-Z 2-9（我们生成的码范围），再 upperCase
    const raw = String(codeInput?.value || '');
    const code = raw
      .replace(/[^A-Za-z0-9]/g, '')
      .toUpperCase();
    // 同步回 input（规范化后的值），保证用户看到的是纯码
    if (codeInput && codeInput.value !== code) codeInput.value = code;

    this._joinPendingMailboxId = null;
    this._joinPendingMailboxCode = code || null;
    if (preview) preview.style.display = 'none';
    if (confirmBtn) confirmBtn.disabled = true;
    if (!code) { this._showJoinMsg('请先输入信箱号', 'error'); return; }
    if (code.length < 4) { this._showJoinMsg('信箱号太短，请输入完整', 'error'); return; }

    // 1) 远端优先 + 本地兜底
    let mb = null;
    let mailboxId = null;
    let source = 'local';
    let remoteLookupFailed = false; // 明确是远端查不到（MongoDB 没有），不是网络错误
    if (typeof STORAGE.getMailboxByCodeAsync === 'function') {
      const r = await STORAGE.getMailboxByCodeAsync(code);
      if (r && r.mailbox) {
        mb = r.mailbox;
        source = r.source || 'local';
        mailboxId = mb.id || mb._id;
      } else if (r && r.source === 'remote' && r.notFound) {
        remoteLookupFailed = true;
        source = 'remote';
      }
    }
    // 2) 本地兜底查询（保证 getMailboxByCodeAsync 失败时也不丢失老能力）
    if (!mailboxId && !remoteLookupFailed) {
      if (typeof STORAGE.getMailboxIdByCode === 'function') mailboxId = STORAGE.getMailboxIdByCode(code);
      if (!mailboxId) {
        const shared = STORAGE.loadSharedMailboxes() || [];
        const personal = STORAGE.loadMailboxes() || [];
        const all = [...shared, ...personal];
        const found = all.find(m =>
          (m.mailboxCode && String(m.mailboxCode).toUpperCase() === code) ||
          (m.code && String(m.code).toUpperCase() === code)
        );
        if (found) mailboxId = found.id;
      }
      if (mailboxId) {
        const sharedMb = STORAGE.loadSharedMailbox(mailboxId);
        const personalAll = STORAGE.loadMailboxes() || [];
        const personalMb = personalAll.find(m => m.id === mailboxId);
        mb = sharedMb || personalMb;
      }
    }
    if (!mb || !mailboxId) {
      let errMsg;
      if (remoteLookupFailed) {
        errMsg = `云端未找到信箱号 ${code}：请检查输入是否正确；若该信箱是在另一台设备新建的，请让创建者先刷新一次页面（会自动同步历史信箱到云端）；如果创建者在不同浏览器/端口，建议使用「📋 复制分享包」功能生成 XJ://... 字符串，粘贴到下方文本框导入。`;
      } else if (source === 'remote') {
        errMsg = '云端未找到此信箱号，请检查是否输入正确';
      } else {
        errMsg = '未找到此信箱号，请检查是否输入正确。注意：不同浏览器/端口间数据默认隔离，可让创建者复制「XJ://...分享包」发送给你粘贴导入加入。';
      }
      this._showJoinMsg(errMsg, 'error');
      return;
    }

    // 是否已在成员中
    let currentUser = AuthManager.getCurrentUser();
    // 访客模式下自动创建匿名身份，避免必须登录才能加入
    if (!currentUser || !currentUser.id) {
      const guestId = 'guest-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
      currentUser = {
        id: guestId,
        username: guestId,
        displayName: '访客',
        role: 'guest',
        createdAt: Date.now()
      };
      try {
        // 直接保存到 localStorage，兼容没有 saveCurrentUser 方法的场景
        localStorage.setItem('xinjian_current_user', JSON.stringify(currentUser));
      } catch (e) { /* ignore */ }
    }
    const userId = currentUser.id;

    // 展示预览
    if (preview) {
      preview.style.display = 'flex';
      const iconEl = document.getElementById('join-preview-icon');
      const nameEl = document.getElementById('join-preview-name');
      const descEl = document.getElementById('join-preview-desc');
      const metaEl = document.getElementById('join-preview-meta');
      if (iconEl) iconEl.textContent = mb.icon || '📫';
      if (nameEl) nameEl.textContent = mb.name || '未命名信箱';
      if (descEl) descEl.textContent = mb.desc || '这个人很懒，还没有填写描述';
      const memberCount = (mb.members && mb.members.length) || 1;
      if (metaEl) metaEl.textContent = `📮 信箱号：${mb.mailboxCode || code} · 👥 ${memberCount} 位成员`;
    }
    if (mb.members && mb.members.includes(userId)) {
      this._showJoinMsg('你已经是该信箱的成员，可直接使用' + (source === 'remote' ? '（云端同步）' : ''), 'info');
      this._joinPendingMailboxId = mailboxId;
      if (confirmBtn) { confirmBtn.disabled = false; confirmBtn.textContent = '📬 打开信箱'; }
    } else {
      const msg = source === 'remote'
        ? '🎯 已从云端找到信箱，点击「确认加入」即可加入（跨设备/浏览器均可见）'
        : '已找到信箱，点击「确认加入」即可加入共享';
      this._showJoinMsg(msg, 'success');
      this._joinPendingMailboxId = mailboxId;
      if (confirmBtn) { confirmBtn.disabled = false; confirmBtn.textContent = '✅ 确认加入'; }
    }
  },

  async _handleJoinConfirmMailbox() {
    const mailboxId = this._joinPendingMailboxId;
    const codeKey = (this._joinPendingMailboxCode || '').trim().toUpperCase() || null;
    if (!mailboxId && !codeKey) return;
    let currentUser = AuthManager.getCurrentUser();
    // 访客模式兜底创建身份
    if (!currentUser || !currentUser.id) {
      const guestId = 'guest-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
      currentUser = {
        id: guestId, username: guestId, displayName: '访客', role: 'guest', createdAt: Date.now()
      };
      try { localStorage.setItem('xinjian_current_user', JSON.stringify(currentUser)); } catch (e) { /* ignore */ }
    }
    if (!currentUser || !currentUser.id) { this._showJoinMsg('身份初始化失败，请刷新后重试', 'error'); return; }

    // 先取信箱详情（避免 joinMailboxByCode 里重复查），这里只用来找 mailboxCode（兜底）
    let localCodeKey = null;
    try {
      if (mailboxId) {
        const sh = STORAGE.loadSharedMailbox(mailboxId);
        const p = (STORAGE.loadMailboxes() || []).find(m => m.id === mailboxId);
        const used = sh || p;
        if (used) localCodeKey = used.mailboxCode || used.code || null;
      }
    } catch (_) {}
    const finalCodeKey = codeKey || localCodeKey || null;

    // 远端优先异步 join（如果有 mailboxCode 则通过 code 走）
    let joinResult = null;
    const joinFn = typeof MailboxManager.joinMailboxByCodeAsync === 'function'
      ? MailboxManager.joinMailboxByCodeAsync.bind(MailboxManager)
      : (function(c, u) { return Promise.resolve(MailboxManager.joinMailboxByCode(c, u)); });
    if (finalCodeKey) {
      try {
        // 第二个参数兼容 userId/accountKey，joinMailboxByCodeAsync 内部会自动规范化
        joinResult = await joinFn(finalCodeKey, currentUser.id);
      } catch (_) { joinResult = null; }
    }
    if (!joinResult || !joinResult.success) {
      // 降级为直接更新本地 sharedMailbox（兼容“查得到但是 code 对不上”的边界情况）
      if (!mailboxId) {
        this._showJoinMsg(joinResult?.message || '缺少 mailboxId，无法加入', 'error');
        return;
      }
      let shared = STORAGE.loadSharedMailbox(mailboxId);
      if (!shared) {
        const personalAll = STORAGE.loadMailboxes() || [];
        const mb = personalAll.find(m => m.id === mailboxId);
        if (mb) shared = { ...mb, members: mb.members || [currentUser.id] };
      }
      if (shared) {
        if (!Array.isArray(shared.members)) shared.members = [];
        if (!shared.members.includes(currentUser.id)) shared.members.push(currentUser.id);
        if (!shared.mailboxCode) {
          shared.mailboxCode = MailboxManager._generateMailboxCode(shared.name);
          if (typeof STORAGE.saveMailboxCodeIndex === 'function') {
            STORAGE.saveMailboxCodeIndex(shared.mailboxCode, shared.id);
          }
        }
        STORAGE.saveSharedMailbox(shared);
        if (typeof STORAGE.saveMailboxCodeIndex === 'function' && shared.mailboxCode) {
          STORAGE.saveMailboxCodeIndex(shared.mailboxCode, shared.id);
        }
        const personalAll = STORAGE.loadMailboxes() || [];
        const pIdx = personalAll.findIndex(m => m.id === mailboxId);
        if (pIdx !== -1) {
          personalAll[pIdx] = { ...personalAll[pIdx], members: shared.members, mailboxCode: shared.mailboxCode };
          STORAGE.saveMailboxes(personalAll);
        }
        joinResult = { success: true, message: '加入成功', mailbox: shared };
      }
    }

    if (!joinResult || !joinResult.success) {
      this._showJoinMsg(joinResult?.message || '加入失败，请稍后再试', 'error');
      return;
    }
    // 刷新远端信箱列表缓存（下次 render 立刻出现）
    if (typeof STORAGE.clearRemoteMailboxCache === 'function') STORAGE.clearRemoteMailboxCache();

    const finalMailboxId = joinResult.mailbox?.id || mailboxId;
    const confirmBtn = document.getElementById('join-mailbox-confirm-btn');
    if (confirmBtn) { confirmBtn.textContent = '🎉 加入成功！'; }
    this._showJoinMsg(joinResult.message || '加入成功！正在同步远端信件…', 'success');

    // ========== 关键：加入成功后立即拉取该信箱的远端信件合并到本地 ==========
    const self = this;
    const lettersPullPromise = (async () => {
      try {
        if (window.MailboxManager && typeof MailboxManager.loadRemoteLettersAndMergeLocal === 'function') {
          await MailboxManager.loadRemoteLettersAndMergeLocal(finalMailboxId);
        }
      } catch (_) {}
      try {
        if (window.MailService && typeof MailService.refreshMailboxCache === 'function') {
          await MailService.refreshMailboxCache(finalMailboxId);
        }
      } catch (_) {}
      try {
        window.dispatchEvent(new CustomEvent('mailboxes:synced', { detail: { source: 'joinConfirm' } }));
      } catch (_) {}
    })();

    setTimeout(() => {
      document.getElementById('mailbox-modal')?.classList.remove('active');
      const codeInput = document.getElementById('join-mailbox-code-input');
      if (codeInput) codeInput.value = '';
      const preview = document.getElementById('join-mailbox-preview');
      if (preview) preview.style.display = 'none';
      const msgBox1 = document.getElementById('join-mailbox-msg-box');
      if (msgBox1) msgBox1.style.display = 'none';
      const msgBox2 = document.getElementById('join-mailbox-msg');
      if (msgBox2) msgBox2.style.display = 'none';
      if (confirmBtn) confirmBtn.disabled = true;
      this._joinPendingMailboxId = null;

      // 等待信件拉取完成后再跳转，保证进入信箱页立刻能看到历史信件
      Promise.resolve(lettersPullPromise).finally(() => {
        const sidebarNav = document.getElementById('mailbox-sidebar-nav') || document.getElementById('sidebar-nav');
        if (sidebarNav) MailboxManager.renderSidebarNav(sidebarNav, finalMailboxId);
        if (typeof App === 'object' && App && typeof App.renderMailboxList === 'function') {
          try { App.renderMailboxList(); } catch (_) {}
        }
        this.navigate('mailbox', { mailboxId: finalMailboxId });
      });
    }, 1000);
  },

  _showJoinMsg(text, type = 'info') {
    const el = document.getElementById('join-mailbox-msg-box') || document.getElementById('join-mailbox-msg');
    if (!el) return;
    el.style.display = 'block';
    el.className = 'join-msg-box ' + (type || 'info');
    el.textContent = text;
  },

  _showCreateMsg(text, type = 'error') {
    const el = document.getElementById('create-mailbox-msg');
    if (!el) return;
    el.style.display = 'block';
    el.className = 'join-msg-box ' + (type || 'error');
    el.textContent = text;
    // 4 秒后自动隐藏 success/info，error 保留到下次输入
    if (type === 'success' || type === 'info') {
      setTimeout(() => { if (el.textContent === text) { el.style.display = 'none'; el.textContent = ''; } }, 4000);
    }
  },

  _hideCreateMsg() {
    const el = document.getElementById('create-mailbox-msg');
    if (el) { el.style.display = 'none'; el.textContent = ''; }
  },

  showCreateMailboxModal() {
    this._resetMailboxForm();
    this._hideCreateMsg();
    document.getElementById('mailbox-modal-title').textContent = '新增信箱';
    document.getElementById('mailbox-letters-group').style.display = 'none';
    // 切到 create Tab
    this._switchModalTab('create');
    // 隐藏信箱号（创建完成后才显示）
    const codeGroup = document.getElementById('mailbox-code-group');
    if (codeGroup) codeGroup.style.display = 'none';
    // 隐藏 Tab（创建/加入可切换）
    document.getElementById('mailbox-modal-tabs').style.display = 'flex';

    this._renderMembersList();
    this._updateMembersVisibility();
    document.getElementById('mailbox-modal')?.classList.add('active');
  },

  showJoinMailboxModal() {
    this._resetMailboxForm();
    // 切到 join Tab
    this._switchModalTab('join');
    document.getElementById('mailbox-modal-tabs').style.display = 'flex';
    document.getElementById('mailbox-modal-title').textContent = '加入信箱';
    // 清空 join 面板状态
    const codeInput = document.getElementById('join-mailbox-code-input');
    if (codeInput) codeInput.value = '';
    document.getElementById('join-mailbox-preview').style.display = 'none';
    const confirmBtn = document.getElementById('join-mailbox-confirm-btn');
    if (confirmBtn) { confirmBtn.disabled = true; confirmBtn.textContent = '✅ 确认加入'; }
    const msgBox = document.getElementById('join-mailbox-msg-box') || document.getElementById('join-mailbox-msg');
    if (msgBox) msgBox.style.display = 'none';
    document.getElementById('mailbox-modal')?.classList.add('active');
    setTimeout(() => codeInput?.focus(), 150);
  },

  _switchModalTab(tab) {
    const tabContainer = document.getElementById('mailbox-modal-tabs');
    if (!tabContainer) return;
    tabContainer.querySelectorAll('.mailbox-tab-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.tab === tab);
    });
    document.getElementById('mailbox-create-panel').style.display = tab === 'create' ? 'block' : 'none';
    document.getElementById('mailbox-join-panel').style.display = tab === 'join' ? 'block' : 'none';
  },

  _renderMailboxLettersList(mailboxId) {
    const listEl = document.getElementById('mailbox-letters-list');
    if (!listEl) return;

    const letters = STORAGE.loadLetters().filter(l => l.mailboxId === mailboxId);

    if (letters.length === 0) {
      listEl.innerHTML = '<div class="mailbox-letters-empty">暂无信件</div>';
      return;
    }

    listEl.innerHTML = '';
    letters.forEach(letter => {
      const item = document.createElement('div');
      item.className = 'mailbox-letter-item';
      item.dataset.id = letter.id;

      const dateInfo = MailboxManager._parseDate(letter.date);
      const dateStr = letter.date ? `${dateInfo.year}-${dateInfo.month}-${dateInfo.day}` : '';

      item.innerHTML = `
        <div class="mailbox-letter-info">
          <div class="mailbox-letter-title">${letter.title || '无标题信件'}</div>
          <div class="mailbox-letter-date">${dateStr}</div>
        </div>
        <button class="mailbox-letter-delete" title="删除信件">🗑</button>
      `;

      const deleteBtn = item.querySelector('.mailbox-letter-delete');
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!confirm(`确定要删除信件"${letter.title || '无标题信件'}"吗？`)) return;

        const allLetters = STORAGE.loadLetters();
        const remainingLetters = allLetters.filter(l => l.id !== letter.id);
        STORAGE.saveLetters(remainingLetters);

        this._renderMailboxLettersList(mailboxId);
      });

      listEl.appendChild(item);
    });
  },

  showEditMailboxModal(mailboxId) {
    const mailboxes = MailboxManager.getMailboxes();
    const mailbox = mailboxes.find(m => m.id === mailboxId);
    if (!mailbox) return;

    // 尝试从共享信箱加载成员信息
    const sharedMailbox = STORAGE.loadSharedMailbox(mailboxId);
    const currentUser = AuthManager.getCurrentUser();

    this._mailboxFormData = {
      id: mailbox.id,
      name: mailbox.name || '',
      desc: mailbox.desc || '',
      icon: mailbox.icon || '📫',
      accent: mailbox.accent || '#8b4513',
      bgGradient: mailbox.bgGradient || 'linear-gradient(135deg, #faf5f0, #f5efe5)',
      mapBackground: mailbox.mapBackground !== undefined ? mailbox.mapBackground : null,
      type: mailbox.type || 'normal',
      personA: mailbox.personA || { name: '', icon: '🌸' },
      personB: mailbox.personB || { name: '', icon: '🍃' },
      members: sharedMailbox?.members || mailbox.members || (currentUser ? [currentUser.id] : []),
      mailboxCode: mailbox.mailboxCode || sharedMailbox?.mailboxCode || null
    };

    // 填充表单
    const nameInput = document.getElementById('mailbox-form-name');
    const descInput = document.getElementById('mailbox-form-desc');
    if (nameInput) nameInput.value = this._mailboxFormData.name;
    if (descInput) descInput.value = this._mailboxFormData.desc;

    // 填充双人设置
    const personAInput = document.getElementById('dual-person-a');
    const personBInput = document.getElementById('dual-person-b');
    if (personAInput) personAInput.value = this._mailboxFormData.personA?.name || '';
    if (personBInput) personBInput.value = this._mailboxFormData.personB?.name || '';

    // 选中信箱类型
    const typeOptions = document.querySelectorAll('.type-option');
    typeOptions.forEach(opt => {
      opt.classList.toggle('active', opt.dataset.type === this._mailboxFormData.type);
    });
    const dualSettings = document.getElementById('dual-mailbox-settings');
    if (dualSettings) {
      dualSettings.style.display = this._mailboxFormData.type === 'dual' ? 'block' : 'none';
    }

    // 选中双人图标
    const personAIcons = document.querySelectorAll('.dual-person:first-child .dual-icon-option');
    personAIcons.forEach(icon => {
      icon.classList.toggle('active', icon.dataset.icon === this._mailboxFormData.personA?.icon);
    });
    const personBIcons = document.querySelectorAll('.dual-person:last-child .dual-icon-option');
    personBIcons.forEach(icon => {
      icon.classList.toggle('active', icon.dataset.icon === this._mailboxFormData.personB?.icon);
    });

    // 选中图标
    const iconGrid = document.getElementById('mailbox-icon-grid');
    if (iconGrid) {
      iconGrid.querySelectorAll('span').forEach(s => {
        s.classList.toggle('active', s.dataset.icon === this._mailboxFormData.icon);
      });
    }

    // 选中颜色
    const colorGrid = document.getElementById('mailbox-color-grid');
    if (colorGrid) {
      colorGrid.querySelectorAll('span').forEach(s => {
        s.classList.toggle('active', s.dataset.color === this._mailboxFormData.accent);
      });
    }

    // 选中背景
    const bgGrid = document.getElementById('mailbox-bg-grid');
    if (bgGrid) {
      bgGrid.querySelectorAll('.bg-option').forEach(o => {
        o.classList.toggle('active', o.dataset.gradient === this._mailboxFormData.bgGradient);
      });
    }

    // 选中地图背景
    const mapBgGrid = document.getElementById('mailbox-map-bg-grid');
    if (mapBgGrid) {
      mapBgGrid.querySelectorAll('.map-bg-option').forEach(o => {
        const bgVal = o.dataset.mapBg;
        const isActive = (this._mailboxFormData.mapBackground === null && bgVal === 'null') ||
                         (this._mailboxFormData.mapBackground === bgVal);
        o.classList.toggle('active', isActive);
      });
    }

    // 显示信件管理
    document.getElementById('mailbox-letters-group').style.display = 'block';
    this._renderMailboxLettersList(mailboxId);

    // 渲染成员列表
    this._renderMembersList();
    this._updateMembersVisibility();

    // 编辑模式：展示信箱号，隐藏 Tab
    this._switchModalTab('create');
    document.getElementById('mailbox-modal-tabs').style.display = 'none';
    if (this._mailboxFormData.mailboxCode) {
      this._showMailboxCodeInForm(this._mailboxFormData.mailboxCode);
    } else {
      document.getElementById('mailbox-code-group').style.display = 'none';
    }

    this._hideCreateMsg();
    document.getElementById('mailbox-modal-title').textContent = '编辑信箱';
    document.getElementById('mailbox-modal')?.classList.add('active');
  },

  _resetMailboxForm() {
    const currentUser = AuthManager.getCurrentUser();
    this._mailboxFormData = {
      id: null,
      name: '',
      desc: '',
      icon: '📫',
      accent: '#8b4513',
      bgGradient: 'linear-gradient(135deg, #faf5f0, #f5efe5)',
      mapBackground: null,
      type: 'normal',
      personA: { name: '', icon: '🌸' },
      personB: { name: '', icon: '🍃' },
      members: currentUser ? [currentUser.id] : [],
      mailboxCode: null
    };

    const nameInput = document.getElementById('mailbox-form-name');
    const descInput = document.getElementById('mailbox-form-desc');
    if (nameInput) nameInput.value = '';
    if (descInput) descInput.value = '';

    // 重置信箱类型
    const typeOptions = document.querySelectorAll('.type-option');
    typeOptions.forEach(opt => {
      opt.classList.toggle('active', opt.dataset.type === 'normal');
    });
    const dualSettings = document.getElementById('dual-mailbox-settings');
    if (dualSettings) dualSettings.style.display = 'none';

    // 重置双人设置
    const personAInput = document.getElementById('dual-person-a');
    const personBInput = document.getElementById('dual-person-b');
    if (personAInput) personAInput.value = '';
    if (personBInput) personBInput.value = '';

    const personAIcons = document.querySelectorAll('.dual-person:first-child .dual-icon-option');
    personAIcons.forEach((icon, idx) => {
      icon.classList.toggle('active', idx === 0);
    });
    const personBIcons = document.querySelectorAll('.dual-person:last-child .dual-icon-option');
    personBIcons.forEach((icon, idx) => {
      icon.classList.toggle('active', idx === 0);
    });

    const iconGrid = document.getElementById('mailbox-icon-grid');
    if (iconGrid) {
      iconGrid.querySelectorAll('span').forEach(s => s.classList.remove('active'));
      iconGrid.querySelector('span[data-icon="📜"]')?.classList.add('active');
      this._mailboxFormData.icon = '📜';
    }

    const colorGrid = document.getElementById('mailbox-color-grid');
    if (colorGrid) {
      colorGrid.querySelectorAll('span').forEach(s => s.classList.remove('active'));
      colorGrid.querySelector('span[data-color="#8b4513"]')?.classList.add('active');
    }

    const bgGrid = document.getElementById('mailbox-bg-grid');
    if (bgGrid) {
      bgGrid.querySelectorAll('.bg-option').forEach(o => o.classList.remove('active'));
      bgGrid.querySelector('.bg-option[data-bg="warm"]')?.classList.add('active');
    }

    const mapBgGrid = document.getElementById('mailbox-map-bg-grid');
    if (mapBgGrid) {
      mapBgGrid.querySelectorAll('.map-bg-option').forEach(o => o.classList.remove('active'));
      // 新建信箱：地图默认不选中，强制用户在置顶位置选择一张地图
    }

    // 重置成员列表
    this._renderMembersList();
    this._updateMembersVisibility();
    const inviteInput = document.getElementById('member-invite-input');
    if (inviteInput) inviteInput.value = '';
  },

  /* ========================================
     以撒的日记
     ======================================== */

  _renderMembersList() {
    const listEl = document.getElementById('members-list');
    if (!listEl) return;

    const members = this._mailboxFormData.members || [];
    const currentUser = AuthManager.getCurrentUser();

    if (members.length === 0) {
      listEl.innerHTML = '<div style="text-align:center;color:var(--color-muted);font-size:0.85rem;padding:10px 0;">暂无成员</div>';
      return;
    }

    listEl.innerHTML = '';
    members.forEach(userId => {
      const user = AuthManager.getUserById(userId);
      if (!user) return;

      const item = document.createElement('div');
      item.className = 'member-item';

      const isCreator = userId === (currentUser?.id);
      const isLastMember = members.length <= 1;
      const canDelete = !isLastMember;

      let roleLabel = '';
      if (user.role === 'xiu-jing') {
        roleLabel = '修璟';
      } else if (user.role === 'xuan-xuan') {
        roleLabel = '萱宣';
      }

      let avatarText = user.displayName?.charAt(0) || user.username?.charAt(0) || '?';
      if (user.role === 'xiu-jing') avatarText = '🌸';
      else if (user.role === 'xuan-xuan') avatarText = '🍃';

      item.innerHTML = `
        <div class="member-info">
          <div class="member-avatar">${avatarText}</div>
          <div>
            <span class="member-name">${user.displayName || user.username}</span>
            ${roleLabel ? `<span class="member-role">${roleLabel}</span>` : ''}
          </div>
        </div>
        <button class="member-delete-btn" data-user-id="${userId}" title="${canDelete ? '移除成员' : '不能移除最后一个成员'}" ${canDelete ? '' : 'disabled style="opacity:0.3;cursor:not-allowed;"'}>✕</button>
      `;

      const deleteBtn = item.querySelector('.member-delete-btn');
      if (deleteBtn && canDelete) {
        deleteBtn.addEventListener('click', () => {
          this._handleRemoveMember(userId);
        });
      }

      listEl.appendChild(item);
    });
  },

  _handleInviteMember() {
    const input = document.getElementById('member-invite-input');
    const username = input?.value.trim();
    if (!username) {
      alert('请输入用户名');
      return;
    }

    const user = AuthManager.getUserByUsername(username);
    if (!user) {
      alert('用户不存在');
      return;
    }

    const members = this._mailboxFormData.members || [];
    if (members.includes(user.id)) {
      alert('该用户已是成员');
      return;
    }

    this._mailboxFormData.members = [...members, user.id];
    this._renderMembersList();

    if (input) input.value = '';
  },

  _handleRemoveMember(userId) {
    const members = this._mailboxFormData.members || [];
    if (members.length <= 1) {
      alert('至少保留一个成员');
      return;
    }

    const user = AuthManager.getUserById(userId);
    if (!confirm(`确定要移除成员"${user?.displayName || user?.username}"吗？`)) return;

    this._mailboxFormData.members = members.filter(id => id !== userId);
    this._renderMembersList();
  },

  _updateMembersVisibility() {
    const membersGroup = document.getElementById('mailbox-members-group');
    if (!membersGroup) return;

    const isLoggedIn = AuthManager.isLoggedIn();
    membersGroup.style.display = isLoggedIn ? 'block' : 'none';
  },

});
