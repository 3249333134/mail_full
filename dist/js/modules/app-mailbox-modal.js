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

    // 关闭弹窗
    const closeModal = () => modal?.classList.remove('active');
    if (overlay) overlay.addEventListener('click', closeModal);
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

    // 保存
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        const nameInput = document.getElementById('mailbox-form-name');
        const descInput = document.getElementById('mailbox-form-desc');
        const name = nameInput?.value.trim();
        if (!name) {
          alert('请输入信箱名称');
          return;
        }

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

        const mailboxes = MailboxManager.getMailboxes();
        if (this._mailboxFormData.id) {
          // 编辑模式
          const idx = mailboxes.findIndex(m => m.id === this._mailboxFormData.id);
          if (idx !== -1) {
            mailboxes[idx] = { ...mailboxes[idx], ...this._mailboxFormData };
          }
          // 如果是共享信箱，同步保存到共享列表
          if (this._mailboxFormData.members && this._mailboxFormData.members.length > 1) {
            STORAGE.saveSharedMailbox({
              ...mailboxes[idx],
              members: this._mailboxFormData.members
            });
          }
        } else {
          // 新增模式
          const newMailbox = {
            id: 'mailbox-' + Date.now(),
            ...this._mailboxFormData,
            cardAccent: this._mailboxFormData.accent,
            isCustom: true
          };
          mailboxes.push(newMailbox);
          this._mailboxFormData.id = newMailbox.id;

          // 如果成员超过1人，保存为共享信箱
          if (this._mailboxFormData.members && this._mailboxFormData.members.length > 1) {
            STORAGE.saveSharedMailbox({
              ...newMailbox,
              members: this._mailboxFormData.members
            });
          }
        }

        STORAGE.saveMailboxes(mailboxes);
        closeModal();

        // 刷新并跳转
        const sidebarNav = document.getElementById('mailbox-sidebar-nav');
        if (sidebarNav) MailboxManager.renderSidebarNav(sidebarNav, this._mailboxFormData.id);
        this.navigate('mailbox', { mailboxId: this._mailboxFormData.id });
      });
    }
  },

  showCreateMailboxModal() {
    this._resetMailboxForm();
    document.getElementById('mailbox-modal-title').textContent = '新增信箱';
    document.getElementById('mailbox-letters-group').style.display = 'none';
    this._renderMembersList();
    this._updateMembersVisibility();
    document.getElementById('mailbox-modal')?.classList.add('active');
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
      members: sharedMailbox?.members || (currentUser ? [currentUser.id] : [])
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
      members: currentUser ? [currentUser.id] : []
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
      mapBgGrid.querySelector('.map-bg-option[data-map-bg="null"]')?.classList.add('active');
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
