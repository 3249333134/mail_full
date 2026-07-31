/* ========================================
   Month Planner Widget
   ======================================== */

Object.assign(Editor, {
  renderMonthlyPlanner(elem, container) {
    const data = elem.monthlyData;
    if (!data) return;

    const monthNames = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
      'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
    const weekDays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
    const weekColors = ['#e6c88a', '#a5b89a', '#b8956a', '#d4a5a5', '#a5b89a', '#e6c88a', '#b8956a'];
    const colorList = ['#e6c88a', '#a5b89a', '#b8956a', '#d4a5a5', '#7a93b5'];

    const year = data.year;
    const month = data.month;
    const firstDay = new Date(year, month, 1).getDay();
    const firstDayIdx = firstDay === 0 ? 6 : firstDay - 1;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    let calendarCells = '';
    let dayNum = 1;
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 7; col++) {
        const idx = row * 7 + col;
        if (idx < firstDayIdx || dayNum > daysInMonth) {
          calendarCells += `<div class="mp-cal-cell empty"></div>`;
        } else {
          const lunarText = data.showLunar ? this._getLunarDay(year, month, dayNum) : '';
          const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
          const noteText = (data.dateNotes && data.dateNotes[dateKey]) || '';
          calendarCells += `
            <div class="mp-cal-cell">
              <div class="mp-cal-date">${dayNum}</div>
              ${data.showLunar ? `<div class="mp-cal-lunar">${lunarText}</div>` : ''}
              <div class="mp-cal-note" contenteditable="true"
                onblur="Editor.monthlyEditDateNote('${elem.id}', '${dateKey}', this.textContent)"
                onclick="event.stopPropagation();"
                onmousedown="event.stopPropagation();">${noteText || ''}</div>
            </div>
          `;
          dayNum++;
        }
      }
    }

    const weekHeaders = weekDays.map((d, i) => `
      <div class="mp-week-header" style="color: ${weekColors[i]};">${d}</div>
    `).join('');

    const monthNums = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => {
      const isActive = m - 1 === month;
      const colorIdx = (m - 1) % 5;
      const activeColor = colorList[colorIdx];
      return `
        <div class="mp-month-num ${isActive ? 'active' : ''}"
          style="${isActive ? 'background-color:' + activeColor + ';border-color:' + activeColor + ';color:white;' : ''}"
          onclick="Editor.monthlyGotoMonth('${elem.id}', ${m - 1})">
          ${m}
        </div>
      `;
    }).join('');

    const colorBar = colorList.map(c => `
      <div class="mp-color-bar-item" style="background-color: ${c};"></div>
    `).join('');

    let pageContent = '';
    if (data.activePage === 'calendar') {
      pageContent = `
        <div class="mp-calendar-header">
          <button class="mp-nav-btn" onclick="Editor.monthlyPrevMonth('${elem.id}')">&#10094;</button>
          <div class="mp-month-title" onclick="Editor.monthlySwitchPage('${elem.id}', 'summary')">
            ${monthNames[month]}
          </div>
          <button class="mp-nav-btn" onclick="Editor.monthlyNextMonth('${elem.id}')">&#10095;</button>
        </div>
        <div class="mp-calendar-wrapper">
          <div class="mp-calendar-grid">
            <div class="mp-week-row">${weekHeaders}</div>
            <div class="mp-cal-body">${calendarCells}</div>
            <div class="mp-color-bar">${colorBar}</div>
          </div>
        </div>
        <div class="mp-grid-area"></div>
      `;
    } else {
      const todoRows = data.todos.map((todo, idx) => `
        <div class="mp-todo-row">
          <div class="mp-todo-checkbox ${todo.completed ? 'checked' : ''}"
            style="border-color: ${colorList[(todo.color - 1) % 5]};"
            onclick="Editor.monthlyToggleTodo('${elem.id}', '${todo.id}')">
            ${todo.completed ? '✓' : ''}
          </div>
          <div class="mp-todo-text ${todo.completed ? 'completed' : ''}"
            contenteditable="true"
            onblur="Editor.monthlyEditTodo('${elem.id}', '${todo.id}', this.textContent)"
            onclick="event.stopPropagation();">${todo.text || ''}</div>
        </div>
      `).join('');

      const goalRows = data.goals.map((g, i) => `
        <div class="mp-goal-row">
          <span class="mp-goal-num" style="color: ${colorList[i % 5]};">${i + 1}</span>
          <div class="mp-goal-input" contenteditable="true"
            onblur="Editor.monthlyEditGoal('${elem.id}', ${i}, this.textContent)"
            onclick="event.stopPropagation();">${g || ''}</div>
        </div>
      `).join('');

      if (data.summaryMode === 'list') {
        pageContent = `
          <div class="mp-summary-header">
            <button class="mp-nav-btn" onclick="Editor.monthlyPrevMonth('${elem.id}')">&#10094;</button>
            <div class="mp-month-title" onclick="Editor.monthlySwitchPage('${elem.id}', 'calendar')">
              MONTHLY / GOAL
            </div>
            <button class="mp-nav-btn" onclick="Editor.monthlyNextMonth('${elem.id}')">&#10095;</button>
          </div>
          <div class="mp-goals-section">
            ${goalRows}
          </div>
          <div class="mp-todo-grid-wrapper">
            <div class="mp-todo-list">
              ${todoRows}
              <button class="mp-add-todo-btn" onclick="Editor.monthlyAddTodo('${elem.id}')">+ 新增</button>
            </div>
            <div class="mp-grid-side"></div>
          </div>
        `;
      } else {
        const stars = [1, 2, 3, 4, 5].map(s => `
          <span class="mp-star ${s <= data.review.rating ? 'filled' : ''}"
            onclick="Editor.monthlySetRating('${elem.id}', ${s})">★</span>
        `).join('');

        pageContent = `
          <div class="mp-summary-header">
            <button class="mp-nav-btn" onclick="Editor.monthlyPrevMonth('${elem.id}')">&#10094;</button>
            <div class="mp-month-title" onclick="Editor.monthlySwitchPage('${elem.id}', 'calendar')">
              MONTHLY / GOAL
            </div>
            <button class="mp-nav-btn" onclick="Editor.monthlyNextMonth('${elem.id}')">&#10095;</button>
          </div>
          <div class="mp-goals-section">
            ${goalRows}
          </div>
          <div class="mp-review-wrapper">
            <div class="mp-todo-list-review">
              ${todoRows}
              <button class="mp-add-todo-btn" onclick="Editor.monthlyAddTodo('${elem.id}')">+ 新增</button>
            </div>
            <div class="mp-review-side">
              <div class="mp-review-section">
                <div class="mp-review-title">EVALUATION</div>
                <div class="mp-stars">${stars}</div>
              </div>
              <div class="mp-review-block">
                <div class="mp-review-subtitle">My Goal</div>
                <div class="mp-review-text" contenteditable="true"
                  onblur="Editor.monthlyEditReview('${elem.id}', 'myGoal', this.textContent)"
                  onclick="event.stopPropagation();">${data.review.myGoal || ''}</div>
              </div>
              <div class="mp-review-block">
                <div class="mp-review-subtitle">Achievement & Progress</div>
                <div class="mp-review-text" contenteditable="true"
                  onblur="Editor.monthlyEditReview('${elem.id}', 'achievement', this.textContent)"
                  onclick="event.stopPropagation();">${data.review.achievement || ''}</div>
              </div>
              <div class="mp-review-block">
                <div class="mp-review-subtitle">Need To Improve</div>
                <div class="mp-review-text" contenteditable="true"
                  onblur="Editor.monthlyEditReview('${elem.id}', 'needImprove', this.textContent)"
                  onclick="event.stopPropagation();">${data.review.needImprove || ''}</div>
              </div>
              <div class="mp-review-bottom">
                <div class="mp-review-block-half">
                  <div class="mp-review-subtitle">This Month</div>
                  <div class="mp-review-text" contenteditable="true"
                    onblur="Editor.monthlyEditReview('${elem.id}', 'thisMonth', this.textContent)"
                    onclick="event.stopPropagation();">${data.review.thisMonth || ''}</div>
                </div>
                <div class="mp-review-block-half">
                  <div class="mp-review-subtitle">Next Month</div>
                  <div class="mp-review-text" contenteditable="true"
                    onblur="Editor.monthlyEditReview('${elem.id}', 'nextMonth', this.textContent)"
                    onclick="event.stopPropagation();">${data.review.nextMonth || ''}</div>
                </div>
              </div>
            </div>
          </div>
        `;
      }
    }

    const pageSwitchBtn = data.activePage === 'calendar'
      ? `<button class="mp-page-switch" onclick="Editor.monthlySwitchSummaryMode('${elem.id}')">
           ${data.showLunar ? '无农历版' : '农历版'}
         </button>`
      : `<button class="mp-page-switch" onclick="Editor.monthlySwitchSummaryMode('${elem.id}')">
           ${data.summaryMode === 'list' ? '目标回顾版' : '清单版'}
         </button>`;

    const isYearTab = data.activePage === 'calendar';
    const isNoteTab = data.activePage === 'summary' && data.summaryMode === 'list';
    const isListTab = data.activePage === 'summary' && data.summaryMode === 'review';

    const tabColors = { year: '#b87070', note: '#7a93b5', list: '#a5b89a' };
    const activeTabColor = isYearTab ? tabColors.year : (isNoteTab ? tabColors.note : tabColors.list);

    const innerHtml = `
      <div class="mp-top-tabs">
        <span class="mp-top-tab ${isYearTab ? 'active' : ''}" data-tab="year"
          style="${isYearTab ? 'color:' + tabColors.year + ';' : ''}"
          onclick="Editor.monthlySwitchTopTab('${elem.id}', 'year')">YEAR</span>
        <span class="mp-top-tab ${isNoteTab ? 'active' : ''}" data-tab="note"
          style="${isNoteTab ? 'color:' + tabColors.note + ';' : ''}"
          onclick="Editor.monthlySwitchTopTab('${elem.id}', 'note')">NOTE</span>
        <span class="mp-top-tab ${isListTab ? 'active' : ''}" data-tab="list"
          style="${isListTab ? 'color:' + tabColors.list + ';' : ''}"
          onclick="Editor.monthlySwitchTopTab('${elem.id}', 'list')">LIST</span>
      </div>
      <div class="mp-month-nums-row">${monthNums}</div>
      <div class="mp-page-content">${pageContent}</div>
      <div class="mp-bottom-bar">
        ${pageSwitchBtn}
      </div>
    `;

    const inner = container.querySelector('.monthly-planner-inner');
    if (inner) {
      inner.innerHTML = innerHtml;
    } else {
      const wrapper = document.createElement('div');
      wrapper.className = 'monthly-planner-inner';
      wrapper.innerHTML = innerHtml;
      container.insertBefore(wrapper, container.firstChild);
    }
  },

  _getLunarDay(year, month, day) {
    const lunarMonths = ['正月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '冬月', '腊月'];
    const lunarDays = ['初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
      '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
      '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十'];

    const baseDate = new Date(2026, 1, 17);
    const targetDate = new Date(year, month, day);
    const diffDays = Math.floor((targetDate - baseDate) / (1000 * 60 * 60 * 24));

    const lunarMonthLengths = [30, 29, 30, 30, 29, 30, 29, 30, 29, 30, 29, 30];
    let lunarMonth = 0;
    let lunarDay = 0;
    let remaining = diffDays;

    if (remaining < 0) {
      return '';
    }

    while (remaining >= lunarMonthLengths[lunarMonth % 12] && lunarMonth < 24) {
      remaining -= lunarMonthLengths[lunarMonth % 12];
      lunarMonth++;
    }
    lunarDay = remaining;

    if (lunarMonth >= 12) {
      return '';
    }

    if (lunarDay === 0) {
      return lunarMonths[(lunarMonth + 11) % 12].replace('月', '');
    }
    return lunarDays[lunarDay];
  },

  _bindMonthlyPlannerInnerEvents(container) {
    const inner = container.querySelector('.monthly-planner-inner');
    if (!inner || inner._mpDelegateBound) return;
    inner._mpDelegateBound = true;

    const stopIfInside = (e) => {
      if (e.target.closest('button, [contenteditable="true"], ' +
        '.mp-month-num, .mp-nav-btn, .mp-month-title, .mp-todo-checkbox, ' +
        '.mp-todo-text, .mp-star, .mp-add-todo-btn, .mp-page-switch, ' +
        '.mp-goal-input, .mp-review-text, .mp-top-tab, .mp-cal-note')) {
        e.stopPropagation();
      }
    };

    inner.addEventListener('mousedown', (e) => {
      stopIfInside(e);
      const editable = e.target.closest('[contenteditable="true"]');
      if (editable) {
        setTimeout(() => {
          if (document.activeElement !== editable) {
            editable.focus();
          }
        }, 0);
      }
    });
    inner.addEventListener('touchstart', (e) => stopIfInside(e), { passive: false });
    inner.addEventListener('click', (e) => stopIfInside(e));
  },

  _findMonthlyElem(elemId) {
    return this.elements.find(el => el.id === elemId && el.type === 'widget-monthly');
  },

  _rerenderMonthly(elemId) {
    const elem = this._findMonthlyElem(elemId);
    if (!elem) return;
    const domEl = document.querySelector(`.paper-element[data-id="${elemId}"]`);
    if (domEl) {
      this.renderMonthlyPlanner(elem, domEl);
      this._bindMonthlyPlannerInnerEvents(domEl);
    }
  },

  monthlyPrevMonth(elemId) {
    this.saveUndoState();
    const elem = this._findMonthlyElem(elemId);
    if (!elem || !elem.monthlyData) return;
    let { year, month } = elem.monthlyData;
    month--;
    if (month < 0) { month = 11; year--; }
    elem.monthlyData.year = year;
    elem.monthlyData.month = month;
    this._rerenderMonthly(elemId);
  },

  monthlyNextMonth(elemId) {
    this.saveUndoState();
    const elem = this._findMonthlyElem(elemId);
    if (!elem || !elem.monthlyData) return;
    let { year, month } = elem.monthlyData;
    month++;
    if (month > 11) { month = 0; year++; }
    elem.monthlyData.year = year;
    elem.monthlyData.month = month;
    this._rerenderMonthly(elemId);
  },

  monthlyGotoMonth(elemId, monthIdx) {
    this.saveUndoState();
    const elem = this._findMonthlyElem(elemId);
    if (!elem || !elem.monthlyData) return;
    elem.monthlyData.month = monthIdx;
    this._rerenderMonthly(elemId);
  },

  monthlySwitchTopTab(elemId, tab) {
    this.saveUndoState();
    const elem = this._findMonthlyElem(elemId);
    if (!elem || !elem.monthlyData) return;
    const data = elem.monthlyData;
    if (tab === 'year') {
      data.activePage = 'calendar';
    } else if (tab === 'note') {
      data.activePage = 'summary';
      data.summaryMode = 'list';
    } else if (tab === 'list') {
      data.activePage = 'summary';
      data.summaryMode = 'review';
    }
    this._rerenderMonthly(elemId);
  },

  monthlySwitchPage(elemId, page) {
    this.saveUndoState();
    const elem = this._findMonthlyElem(elemId);
    if (!elem || !elem.monthlyData) return;
    elem.monthlyData.activePage = page;
    this._rerenderMonthly(elemId);
  },

  monthlySwitchSummaryMode(elemId) {
    this.saveUndoState();
    const elem = this._findMonthlyElem(elemId);
    if (!elem || !elem.monthlyData) return;
    const data = elem.monthlyData;
    if (data.activePage === 'calendar') {
      data.showLunar = !data.showLunar;
    } else {
      data.summaryMode = data.summaryMode === 'list' ? 'review' : 'list';
    }
    this._rerenderMonthly(elemId);
  },

  monthlyToggleTodo(elemId, todoId) {
    this.saveUndoState();
    const elem = this._findMonthlyElem(elemId);
    if (!elem || !elem.monthlyData) return;
    const todo = elem.monthlyData.todos.find(t => t.id === todoId);
    if (todo) {
      todo.completed = !todo.completed;
      this._rerenderMonthly(elemId);
    }
  },

  monthlyEditTodo(elemId, todoId, text) {
    const elem = this._findMonthlyElem(elemId);
    if (!elem || !elem.monthlyData) return;
    const todo = elem.monthlyData.todos.find(t => t.id === todoId);
    if (todo && todo.text !== text) {
      this.saveUndoState();
      todo.text = text;
    }
  },

  monthlyAddTodo(elemId) {
    this.saveUndoState();
    const elem = this._findMonthlyElem(elemId);
    if (!elem || !elem.monthlyData) return;
    const colorCount = 5;
    const nextColor = (elem.monthlyData.todos.length % colorCount) + 1;
    elem.monthlyData.todos.push({
      id: 'todo-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      text: '',
      color: nextColor,
      completed: false
    });
    this._rerenderMonthly(elemId);
  },

  monthlyEditGoal(elemId, idx, text) {
    const elem = this._findMonthlyElem(elemId);
    if (!elem || !elem.monthlyData) return;
    if (elem.monthlyData.goals[idx] !== text) {
      this.saveUndoState();
      elem.monthlyData.goals[idx] = text;
    }
  },

  monthlySetRating(elemId, rating) {
    this.saveUndoState();
    const elem = this._findMonthlyElem(elemId);
    if (!elem || !elem.monthlyData) return;
    elem.monthlyData.review.rating = rating;
    this._rerenderMonthly(elemId);
  },

  monthlyEditReview(elemId, field, text) {
    const elem = this._findMonthlyElem(elemId);
    if (!elem || !elem.monthlyData) return;
    if (elem.monthlyData.review[field] !== text) {
      this.saveUndoState();
      elem.monthlyData.review[field] = text;
    }
  },

  monthlyEditDateNote(elemId, dateKey, text) {
    const elem = this._findMonthlyElem(elemId);
    if (!elem || !elem.monthlyData) return;
    if (!elem.monthlyData.dateNotes) {
      elem.monthlyData.dateNotes = {};
    }
    const oldText = elem.monthlyData.dateNotes[dateKey] || '';
    if (oldText !== text) {
      this.saveUndoState();
      if (text.trim()) {
        elem.monthlyData.dateNotes[dateKey] = text;
      } else {
        delete elem.monthlyData.dateNotes[dateKey];
      }
    }
  },
});
