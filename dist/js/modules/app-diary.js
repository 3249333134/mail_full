/* ========================================
   App - Diary
   ======================================== */

Object.assign(App, {
  initDiary() {
    const entry = document.getElementById('diary-entry');
    const modal = document.getElementById('diary-modal');
    const closeBtn = document.getElementById('diary-close');
    const prevBtn = document.getElementById('diary-prev');
    const nextBtn = document.getElementById('diary-next');
    const overlay = modal?.querySelector('.diary-modal-overlay');

    if (entry) {
      entry.addEventListener('click', () => this.openDiary());
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeDiary());
    }

    if (overlay) {
      overlay.addEventListener('click', () => this.closeDiary());
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', () => this.prevDiaryPage());
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => this.nextDiaryPage());
    }

    document.addEventListener('keydown', (e) => {
      if (!modal || !modal.classList.contains('active')) return;
      if (e.key === 'ArrowLeft') this.prevDiaryPage();
      if (e.key === 'ArrowRight') this.nextDiaryPage();
      if (e.key === 'Escape') this.closeDiary();
    });
  },

  openDiary() {
    const modal = document.getElementById('diary-modal');
    if (!modal) return;

    // 先使用原始数据渲染并显示弹窗
    this.diaryPhysicalData = (typeof DiaryData !== 'undefined') ? [...DiaryData] : [];
    this.diaryTotalPages = this.diaryPhysicalData.length;
    this.diarySpreadIndex = 0;
    this.renderDiaryPages();
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // 弹窗显示后，根据实际容器高度重新分页
    // 使用 setTimeout 确保 flex 布局完全稳定后再测量
    setTimeout(() => {
      const newData = this.paginateDiaryData();
      if (newData.length !== this.diaryPhysicalData.length) {
        this.diaryPhysicalData = newData;
        this.diaryTotalPages = newData.length;
        this.diarySpreadIndex = 0;
        this.renderDiaryPages();
      }
    }, 100);
  },

  paginateDiaryData() {
    if (typeof DiaryData === 'undefined') return [];

    const refSelector = this.isMobile() ? '#diary-right-page' : '#diary-left-page';
    const refContent = document.querySelector(refSelector);
    if (!refContent) return [...DiaryData];

    const pageWidth = refContent.clientWidth;
    const pageHeight = refContent.clientHeight;

    if (pageWidth <= 0 || pageHeight <= 0) return [...DiaryData];

    const measure = document.createElement('div');
    measure.className = 'diary-page-content';
    measure.style.cssText = `position:fixed;left:0;top:0;width:${pageWidth}px;height:auto;box-sizing:border-box;visibility:hidden;pointer-events:none;z-index:-1;display:flex;flex-direction:column;`;
    document.body.appendChild(measure);

    const measureDate = document.createElement('div');
    measureDate.className = 'diary-date';
    const measureTitle = document.createElement('div');
    measureTitle.className = 'diary-title';
    const measureBody = document.createElement('div');
    measureBody.className = 'diary-body';
    measureBody.style.cssText = 'flex: none; white-space: pre-wrap;';
    const measureFooter = document.createElement('div');
    measureFooter.className = 'diary-footer';
    measureFooter.textContent = '第 0 页';
    measure.appendChild(measureDate);
    measure.appendChild(measureTitle);
    measure.appendChild(measureBody);
    measure.appendChild(measureFooter);

    const pages = [];
    const safetyMargin = 4;

    DiaryData.forEach((entry) => {
      const blocks = entry.body.split('\n\n');
      let currentBody = '';
      let pageIdx = 0;
      let hasDateTitle = pageIdx === 0;

      const tryRender = (bodyText, withDateTitle) => {
        measureDate.textContent = withDateTitle ? entry.date : '';
        measureTitle.textContent = withDateTitle ? entry.title : '';
        measureBody.textContent = bodyText;
        return measure.offsetHeight <= pageHeight - safetyMargin;
      };

      blocks.forEach((para) => {
        const testBody = currentBody ? currentBody + '\n\n' + para : para;
        if (tryRender(testBody, hasDateTitle)) {
          currentBody = testBody;
        } else {
          if (currentBody) {
            pages.push({
              date: hasDateTitle ? entry.date : '',
              title: hasDateTitle ? entry.title : '',
              body: currentBody
            });
            pageIdx++;
            hasDateTitle = false;
          }
          const lines = para.split('\n');
          let curLines = '';
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const testLines = curLines ? curLines + '\n' + line : line;
            if (tryRender(testLines, hasDateTitle)) {
              curLines = testLines;
            } else {
              if (curLines) {
                pages.push({
                  date: hasDateTitle ? entry.date : '',
                  title: hasDateTitle ? entry.title : '',
                  body: curLines
                });
                pageIdx++;
                hasDateTitle = false;
              }
              curLines = line;
            }
          }
          currentBody = curLines;
        }
      });

      if (currentBody) {
        pages.push({
          date: hasDateTitle ? entry.date : '',
          title: hasDateTitle ? entry.title : '',
          body: currentBody
        });
      }
    });

    document.body.removeChild(measure);
    return pages;
  },

  _renderDiaryMeasurePage(data) {
    return `
      <div class="diary-date">${data.date}</div>
      <div class="diary-title">${data.title}</div>
      <div class="diary-body">${data.body}</div>
      <div class="diary-footer">第 0 页</div>
    `;
  },

  closeDiary() {
    const modal = document.getElementById('diary-modal');
    if (!modal) return;
    modal.classList.remove('active');
    document.body.style.overflow = '';

    const mainContainer = document.querySelector('.gallery-main');
    if (mainContainer && mainContainer.classList.contains('diary-mode')) {
      mainContainer.classList.remove('diary-mode');
      mainContainer.classList.add('letters-mode');
      const viewSwitch = document.getElementById('view-switch');
      if (viewSwitch) {
        viewSwitch.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
        const lettersBtn = viewSwitch.querySelector('.view-btn[data-view="letters"]');
        if (lettersBtn) lettersBtn.classList.add('active');
      }
    }
  },

  isMobile() {
    return window.innerWidth <= 768;
  },

  getTotalSpreads() {
    if (this.isMobile()) {
      return this.diaryTotalPages;
    }
    return Math.ceil(this.diaryTotalPages / 2);
  },

  getLeftPageNum() {
    if (this.isMobile()) {
      return this.diarySpreadIndex + 1;
    }
    return this.diarySpreadIndex * 2 + 1;
  },

  getRightPageNum() {
    if (this.isMobile()) {
      return this.diarySpreadIndex + 1;
    }
    return Math.min(this.diarySpreadIndex * 2 + 2, this.diaryTotalPages);
  },

  renderDiaryPages() {
    const leftEl = document.getElementById('diary-left-page');
    const rightEl = document.getElementById('diary-right-page');
    const flipperFront = document.getElementById('diary-flipper-front');
    const flipperBack = document.getElementById('diary-flipper-back');
    const pageNum = document.getElementById('diary-page-num');
    const prevBtn = document.getElementById('diary-prev');
    const nextBtn = document.getElementById('diary-next');
    const flipper = document.getElementById('diary-flipper');

    if (flipper) {
      flipper.classList.remove('flipping-next', 'flipping-prev');
      flipper.style.opacity = '';
      flipper.style.visibility = '';
      flipper.style.transform = '';
      flipper.style.transition = '';
    }

    const leftPageNum = this.getLeftPageNum();
    const rightPageNum = this.getRightPageNum();

    if (this.isMobile()) {
      if (rightEl) {
        rightEl.innerHTML = this.generateDiaryPageContent(leftPageNum);
      }
    } else {
      if (leftEl) {
        leftEl.innerHTML = this.generateDiaryPageContent(leftPageNum);
      }

      if (rightEl) {
        rightEl.innerHTML = this.generateDiaryPageContent(rightPageNum);
      }

      if (flipperFront) {
        flipperFront.innerHTML = this.generateDiaryPageContent(rightPageNum);
      }

      if (flipperBack) {
        const nextLeft = Math.min((this.diarySpreadIndex + 1) * 2 + 1, this.diaryTotalPages);
        flipperBack.innerHTML = this.generateDiaryPageContent(nextLeft);
      }
    }

    if (pageNum) {
      if (this.isMobile()) {
        pageNum.textContent = `${leftPageNum} / ${this.diaryTotalPages}`;
      } else {
        pageNum.textContent = `${leftPageNum} - ${rightPageNum} / ${this.diaryTotalPages}`;
      }
    }

    if (prevBtn) {
      prevBtn.disabled = this.diarySpreadIndex <= 0;
    }

    if (nextBtn) {
      nextBtn.disabled = this.diarySpreadIndex >= this.getTotalSpreads() - 1;
    }
  },

  generateDiaryPageContent(pageNum) {
    const source = this.diaryPhysicalData || (typeof DiaryData !== 'undefined' ? DiaryData : []);
    if (!source[pageNum - 1]) {
      return `<div class="diary-body"></div>`;
    }

    const data = source[pageNum - 1];
    const doodle = (typeof DiaryDoodles !== 'undefined' && DiaryDoodles[data.doodle]) || '';

    return `
      <div class="diary-date">${data.date}</div>
      <div class="diary-title">${data.title}</div>
      <div class="diary-body">${data.body}</div>
      ${doodle ? `<div class="diary-doodle">${doodle}</div>` : ''}
      <div class="diary-footer">第 ${pageNum} 页</div>
    `;
  },

  prevDiaryPage() {
    if (this.diarySpreadIndex <= 0) return;
    if (this.diaryFlipping) return;
    this.diaryFlipping = true;

    if (this.isMobile()) {
      this.diarySpreadIndex--;
      this.renderDiaryPages();
      this.diaryFlipping = false;
      return;
    }

    const flipper = document.getElementById('diary-flipper');
    const flipperFront = document.getElementById('diary-flipper-front');
    const flipperBack = document.getElementById('diary-flipper-back');
    const leftEl = document.getElementById('diary-left-page');
    const rightEl = document.getElementById('diary-right-page');

    if (!flipper || !flipperFront || !flipperBack) {
      this.diarySpreadIndex--;
      this.renderDiaryPages();
      this.diaryFlipping = false;
      return;
    }

    const prevLeft = (this.diarySpreadIndex - 1) * 2 + 1;
    const prevRight = (this.diarySpreadIndex - 1) * 2 + 2;

    // 1. 设置 flipper 内容
    flipperFront.innerHTML = this.generateDiaryPageContent(prevRight);
    flipperBack.innerHTML = this.generateDiaryPageContent(prevLeft);

    // 2. 先将 flipper 放到左页位置并显示（避免从右页闪跳到左页）
    flipper.style.transition = 'none';
    flipper.style.transform = 'rotateY(-180deg)';
    flipper.style.opacity = '1';
    flipper.style.visibility = 'visible';
    flipper.offsetHeight; // force reflow

    // 3. 更新底层左页（被 flipper 遮挡，用户无感知）
    if (leftEl) leftEl.innerHTML = this.generateDiaryPageContent(prevLeft);

    // 4. 动画中间点更新底层右页
    const midTimeout = setTimeout(() => {
      if (rightEl) rightEl.innerHTML = this.generateDiaryPageContent(prevRight);
    }, 450);

    const finishFlip = () => {
      clearTimeout(midTimeout);
      clearTimeout(fallbackTimeout);
      flipper.removeEventListener('animationend', onAnimEnd);
      this.diarySpreadIndex--;

      // 先隐藏 flipper，再移除动画类，避免 transform 跳变被看见
      flipper.style.opacity = '0';
      flipper.style.visibility = 'hidden';
      requestAnimationFrame(() => {
        flipper.classList.remove('flipping-prev');
        flipper.style.transform = '';
        flipper.style.transition = '';
      });

      const pageNum = document.getElementById('diary-page-num');
      const prevBtn = document.getElementById('diary-prev');
      const nextBtn = document.getElementById('diary-next');
      const newLeft = this.getLeftPageNum();
      const newRight = this.getRightPageNum();
      if (pageNum) pageNum.textContent = `${newLeft} - ${newRight} / ${this.diaryTotalPages}`;
      if (prevBtn) prevBtn.disabled = this.diarySpreadIndex <= 0;
      if (nextBtn) nextBtn.disabled = this.diarySpreadIndex >= this.getTotalSpreads() - 1;
      if (flipperFront) flipperFront.innerHTML = this.generateDiaryPageContent(newRight);
      if (flipperBack) {
        const nextLeft = Math.min((this.diarySpreadIndex + 1) * 2 + 1, this.diaryTotalPages);
        flipperBack.innerHTML = this.generateDiaryPageContent(nextLeft);
      }
      this.diaryFlipping = false;
    };

    const onAnimEnd = () => finishFlip();
    const fallbackTimeout = setTimeout(() => finishFlip(), 1100);

    flipper.addEventListener('animationend', onAnimEnd);
    flipper.classList.add('flipping-prev');
  },

  nextDiaryPage() {
    if (this.diarySpreadIndex >= this.getTotalSpreads() - 1) return;
    if (this.diaryFlipping) return;
    this.diaryFlipping = true;

    if (this.isMobile()) {
      this.diarySpreadIndex++;
      this.renderDiaryPages();
      this.diaryFlipping = false;
      return;
    }

    const flipper = document.getElementById('diary-flipper');
    const flipperFront = document.getElementById('diary-flipper-front');
    const flipperBack = document.getElementById('diary-flipper-back');
    const leftEl = document.getElementById('diary-left-page');
    const rightEl = document.getElementById('diary-right-page');

    if (!flipper || !flipperFront || !flipperBack) {
      this.diarySpreadIndex++;
      this.renderDiaryPages();
      this.diaryFlipping = false;
      return;
    }

    const currentRight = this.getRightPageNum();
    const nextLeft = (this.diarySpreadIndex + 1) * 2 + 1;
    const nextRight = Math.min((this.diarySpreadIndex + 1) * 2 + 2, this.diaryTotalPages);

    // 1. 设置 flipper 内容（front = 当前右页，back = 下一左页）
    flipperFront.innerHTML = this.generateDiaryPageContent(currentRight);
    flipperBack.innerHTML = this.generateDiaryPageContent(nextLeft);

    // 2. 让 flipper 可见并覆盖当前右页（内容与底层右页相同，用户无感知）
    flipper.style.transition = 'none';
    flipper.style.transform = 'rotateY(0deg)';
    flipper.style.opacity = '1';
    flipper.style.visibility = 'visible';
    flipper.offsetHeight; // force reflow

    // 3. 更新底层右页为 nextRight（此时被 flipper-front 完全遮挡）
    if (rightEl) rightEl.innerHTML = this.generateDiaryPageContent(nextRight);

    // 4. 动画中间点更新底层左页
    const midTimeout = setTimeout(() => {
      if (leftEl) leftEl.innerHTML = this.generateDiaryPageContent(nextLeft);
    }, 450);

    const finishFlip = () => {
      clearTimeout(midTimeout);
      clearTimeout(fallbackTimeout);
      flipper.removeEventListener('animationend', onAnimEnd);
      this.diarySpreadIndex++;

      // 先隐藏 flipper，再移除动画类，避免 transform 跳变被看见
      flipper.style.opacity = '0';
      flipper.style.visibility = 'hidden';
      requestAnimationFrame(() => {
        flipper.classList.remove('flipping-next');
        flipper.style.transform = '';
        flipper.style.transition = '';
      });

      const pageNum = document.getElementById('diary-page-num');
      const prevBtn = document.getElementById('diary-prev');
      const nextBtn = document.getElementById('diary-next');
      const newLeft = this.getLeftPageNum();
      const newRight = this.getRightPageNum();
      if (pageNum) pageNum.textContent = `${newLeft} - ${newRight} / ${this.diaryTotalPages}`;
      if (prevBtn) prevBtn.disabled = this.diarySpreadIndex <= 0;
      if (nextBtn) nextBtn.disabled = this.diarySpreadIndex >= this.getTotalSpreads() - 1;
      if (flipperFront) flipperFront.innerHTML = this.generateDiaryPageContent(newRight);
      if (flipperBack) {
        const nextNextLeft = Math.min((this.diarySpreadIndex + 1) * 2 + 1, this.diaryTotalPages);
        flipperBack.innerHTML = this.generateDiaryPageContent(nextNextLeft);
      }
      this.diaryFlipping = false;
    };

    const onAnimEnd = () => finishFlip();
    const fallbackTimeout = setTimeout(() => finishFlip(), 1100);

    flipper.addEventListener('animationend', onAnimEnd);
    flipper.classList.add('flipping-next');
  },

  /* ========================================
     手账功能
     ======================================== */

});
