/* ============================================================
 * 信笺 — 写信内容 AI 优化（editor-ai-polish.js）
 * 顶部操作栏「✨ AI 优化」：选中一段文字 → 对比预览弹窗
 * （原文 | Agnes AI 优化版）→ 可重新生成 / 采用 / 取消
 * 采用后计入撤销栈（Ctrl+Z 可回退），AI 失败静默展示可重试
 * ============================================================ */

(function () {
  'use strict';

  const POLISH_API_PATH = '/api/ai/polish-text';
  const TIMEOUT_MS = 45000;

  function escHtml(str) {
    return String(str ?? '').replace(/[&<>"']/g, (ch) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[ch]);
  }

  function findElemAcrossPages(editor, id) {
    if (!id) return null;
    for (const page of (editor.pages || [])) {
      const found = (page.elements || []).find((e) => e && e.id === id);
      if (found) return found;
    }
    return null;
  }

  Object.assign(Editor, {
    _aiPolishElemId: null,
    _aiPolishPageIndex: null,
    _aiPolishResult: null,
    _aiPolishSeq: 0,
    _aiPolishHintTimer: null,

    // ---------- 打开弹窗 ----------

    openAiPolish() {
      const selectedElem = this.selectedId ? findElemAcrossPages(this, this.selectedId) : null;
      if (selectedElem && selectedElem.type === 'text') {
        this._aiPolishElemId = selectedElem.id;
        this._aiPolishPageIndex = this.currentPageIndex;
        this._aiPolishResult = null;
        this._openAiPolishModal(selectedElem);
        return;
      }
      const hasAnyText = (this.pages || []).some((p) =>
        (p.elements || []).some((e) => e && e.type === 'text')
      );
      if (!hasAnyText) {
        this._showHint('请先在信纸上添加一段文字，再使用 AI 优化');
        return;
      }
      this._showHint('请先在信纸上点击选中一段文字，再使用 AI 优化');
    },

    _openAiPolishModal(elem) {
      const overlay = document.getElementById('ai-polish-overlay');
      if (!overlay) return;
      this._aiPolishSeq = 0;
      const original = document.getElementById('ai-polish-original');
      const target = document.getElementById('ai-polish-target');
      const applyBtn = document.getElementById('ai-polish-apply');
      if (target) {
        const snippet = String(elem.text || '').trim().slice(0, 18);
        target.textContent = `正在润色：${snippet || '（空白段落）'}`;
      }
      if (original) original.textContent = elem.text || '（空白）';
      if (applyBtn) applyBtn.disabled = true;
      overlay.classList.add('active');
      overlay.setAttribute('aria-hidden', 'false');
      this._aiPolishGenerate();
    },

    closeAiPolish() {
      this._aiPolishSeq++; // 使进行中的请求响应失效
      const overlay = document.getElementById('ai-polish-overlay');
      if (overlay) {
        overlay.classList.remove('active');
        overlay.setAttribute('aria-hidden', 'true');
      }
    },

    // ---------- AI 生成 ----------

    async _aiPolishGenerate() {
      const seq = ++this._aiPolishSeq;
      const optimized = document.getElementById('ai-polish-optimized');
      const status = document.getElementById('ai-polish-status');
      const applyBtn = document.getElementById('ai-polish-apply');
      const elem = findElemAcrossPages(this, this._aiPolishElemId);
      const text = elem && typeof elem.text === 'string' ? elem.text.trim() : '';

      if (applyBtn) applyBtn.disabled = true;
      if (optimized) {
        optimized.innerHTML = '<div class="ai-polish-loading"><span class="ai-polish-spinner"></span>正在生成…</div>';
      }
      if (status) status.textContent = 'AI 正在润色，请稍候…';

      let aiText = null;
      let aiError = '';
      if (text) {
        try {
          const apiBase = (typeof MailService !== 'undefined' && typeof MailService.getBaseUrl === 'function')
            ? MailService.getBaseUrl()
            : '';
          const ctrl = new AbortController();
          const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
          let res;
          try {
            res = await fetch(`${apiBase}${POLISH_API_PATH}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                text,
                letter: {
                  sender: this.letter.sender || '',
                  recipient: this.letter.recipient || '',
                  title: this.letter.letterTitle || ''
                }
              }),
              signal: ctrl.signal
            });
          } finally {
            clearTimeout(timer);
          }
          if (res && res.ok) {
            const data = await res.json();
            if (data && typeof data.text === 'string' && data.text.trim()) {
              aiText = data.text.trim();
            } else {
              aiError = 'ai_empty';
            }
          } else if (res) {
            // 服务端返回非 2xx：尝试解析 error 字段，映射为可读提示
            let errCode = '';
            try {
              const data = await res.json();
              errCode = data && data.error;
            } catch (_) {}
            aiError = errCode || ('http_' + res.status);
          }
        } catch (e) {
          if (e && e.name === 'AbortError') {
            aiError = 'timeout';
          } else {
            aiError = 'network';
          }
        }
      }

      if (seq !== this._aiPolishSeq) return; // 过期响应丢弃

      if (aiText) {
        this._aiPolishResult = aiText;
        if (optimized) {
          const paragraphs = aiText.split('\n').filter((p) => p.trim() !== '');
          optimized.innerHTML = paragraphs.length
            ? paragraphs.map((p) => `<p>${escHtml(p)}</p>`).join('')
            : escHtml(aiText);
        }
        if (status) status.textContent = '';
        if (applyBtn) applyBtn.disabled = false;
      } else {
        this._aiPolishResult = null;
        const msg = this._aiPolishErrorMessage(aiError);
        if (optimized) {
          optimized.innerHTML = `<div class="ai-polish-error">${escHtml(msg)}</div>`;
        }
        if (status) status.textContent = '生成失败';
      }
    },

    /** 将 AI 请求错误码映射为可读的中文提示 */
    _aiPolishErrorMessage(code) {
      switch (code) {
        case 'timeout':
          return 'AI 响应超时（45秒），请点击「重新生成」重试';
        case 'network':
          return '无法连接 AI 服务，请确认服务端已启动（3000 端口）';
        case 'ai_not_configured':
          return 'AI 服务未配置 API Key，请联系管理员';
        case 'ai_failed':
          return 'AI 生成失败，请点击「重新生成」重试';
        case 'ai_empty':
          return 'AI 返回内容为空，请点击「重新生成」重试';
        case 'empty_text':
          return '请先在信纸上添加一段文字，再使用 AI 优化';
        default:
          return code
            ? `AI 优化失败（${code}），请稍后重试`
            : 'AI 优化失败，请点击「重新生成」重试';
      }
    },

    // ---------- 采用结果 ----------

    _aiPolishApply() {
      if (!this._aiPolishResult) return;
      const target = findElemAcrossPages(this, this._aiPolishElemId);
      if (!target) {
        this.closeAiPolish();
        return;
      }
      if (this._aiPolishPageIndex !== undefined &&
          this._aiPolishPageIndex !== this.currentPageIndex &&
          this._aiPolishPageIndex < (this.pages || []).length) {
        this.currentPageIndex = this._aiPolishPageIndex;
        this.renderPagesList();
      }

      this.saveUndoState();
      target.text = this._aiPolishResult;
      delete target.height; // 由 adjustPaperSize 依据 DOM 重算
      this.renderPaperElements();
      this.adjustPaperSize();

      // 持久化草稿（共享信箱 / 个人分支持）
      try {
        const isShared = typeof MailboxManager !== 'undefined' &&
          MailboxManager.isSharedMailbox(this.letter.mailboxId);
        this._serializeLetter();
        if (isShared) {
          const letters = STORAGE.loadSharedLetters(this.letter.mailboxId);
          const idx = letters.findIndex((l) => l.id === this.letter.id);
          if (idx >= 0) letters[idx] = this.letter;
          else letters.push(this.letter);
          STORAGE.saveSharedLetters(this.letter.mailboxId, letters);
        } else {
          STORAGE.saveLetters(STORAGE.loadLetters().map((l) =>
            l.id === this.letter.id ? this.letter : l
          ));
        }
      } catch (e) {
        console.error('[AiPolish] save draft failed:', e);
      }

      this.closeAiPolish();
      this._showHint('已采用 AI 优化结果（Ctrl+Z 可撤销）');
    },

    // ---------- 浮动提示 ----------

    _showHint(message) {
      let hint = document.getElementById('ai-polish-hint');
      if (!hint) {
        hint = document.createElement('div');
        hint.id = 'ai-polish-hint';
        hint.className = 'ai-polish-hint';
        hint.setAttribute('role', 'status');
        document.body.appendChild(hint);
      }
      hint.textContent = message;
      hint.classList.add('show');
      clearTimeout(this._aiPolishHintTimer);
      this._aiPolishHintTimer = setTimeout(() => hint.classList.remove('show'), 2500);
    }
  });

  // ---------- 一次性绑定（DOMContentLoaded 常驻，Editor.init 多次打开不重复） ----------
  function bindAiPolishControls() {
    if (window.__aiPolishBound) return;
    window.__aiPolishBound = true;

    const btn = document.getElementById('ai-polish-btn');
    if (btn) btn.addEventListener('click', () => Editor.openAiPolish());

    const close = document.getElementById('ai-polish-close');
    if (close) close.addEventListener('click', () => Editor.closeAiPolish());

    const cancel = document.getElementById('ai-polish-cancel');
    if (cancel) cancel.addEventListener('click', () => Editor.closeAiPolish());

    const overlay = document.getElementById('ai-polish-overlay');
    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) Editor.closeAiPolish();
      });
    }

    const regen = document.getElementById('ai-polish-regenerate');
    if (regen) regen.addEventListener('click', () => Editor._aiPolishGenerate());

    const apply = document.getElementById('ai-polish-apply');
    if (apply) apply.addEventListener('click', () => Editor._aiPolishApply());

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') Editor.closeAiPolish();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindAiPolishControls);
  } else {
    bindAiPolishControls();
  }
})();
