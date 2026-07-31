/* ========================================
   Week Planner Widget
   ======================================== */

Object.assign(Editor, {
  // ==================== 周计划组件 ====================
  renderWeeklyPlanner(elem, container) {
    const inner = container.querySelector('.weekly-planner-inner');
    if (!inner) return;
    const data = elem.weeklyData;
    if (!data) return;

    const weekDayNames = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
    const weekDayColors = [
      '#d4a574',
      '#a5b89a',
      '#b8956a',
      '#d4a5a5',
      '#7a93b5',
      '#b87070',
      '#a85a5a'
    ];
    const monthNames = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
    const colorList = ['#d4a574', '#a5b89a', '#b8956a', '#d4a5a5', '#7a93b5'];

    const weekStart = new Date(data.weekStart);
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      days.push(d);
    }

    const monthNums = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => {
      const isActive = m - 1 === data.month;
      const colorIdx = (m - 1) % 5;
      const activeColor = colorList[colorIdx];
      return `
        <div class="wp-month-num ${isActive ? 'active' : ''}"
          style="${isActive ? 'background-color:' + activeColor + ';border-color:' + activeColor + ';color:white;' : ''}"
          onclick="Editor.weeklyGotoMonth('${elem.id}', ${m - 1})">
          ${m}
        </div>
      `;
    }).join('');

    const isSimple = data.activeLayout === 'simple';
    const isTimeline = data.activeLayout === 'timeline';

    const monthName = monthNames[data.month];
    const weekOfMonth = data.weekOfMonth;

    let dailyRows = '';
    for (let i = 0; i < 7; i++) {
      const d = days[i];
      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const dailyData = (data.dailyData && data.dailyData[dateKey]) || {};
      const lunarText = data.showLunar ? this._getLunarDay(d.getFullYear(), d.getMonth(), d.getDate()) : '';
      const dayColor = weekDayColors[i];

      let rightContent = '';
      if (isSimple) {
        rightContent = `
          <div class="wp-day-content" contenteditable="true"
            onblur="Editor.weeklyEditDayContent('${elem.id}', '${dateKey}', this.textContent)"
            onclick="event.stopPropagation();"
            onmousedown="event.stopPropagation();">${dailyData.content || ''}</div>
        `;
      } else {
        const dots = [];
        const timeline = dailyData.timeline || [];
        for (let h = 0; h < 24; h++) {
          const isMarked = timeline.includes(h);
          dots.push(`
            <span class="wp-tl-dot ${isMarked ? 'marked' : ''}"
              style="${isMarked ? 'background-color:' + dayColor + ';border-color:' + dayColor + ';' : ''}"
              data-hour="${h}"
              onclick="Editor.weeklyToggleTimelineHour('${elem.id}', '${dateKey}', ${h})">
            </span>
          `);
        }
        rightContent = `
          <div class="wp-timeline-row">${dots.join('')}</div>
        `;
      }

      dailyRows += `
        <div class="wp-day-row">
          <div class="wp-day-info">
            <div class="wp-day-name" style="color: ${dayColor};">${weekDayNames[i]}</div>
            <div class="wp-day-date">${d.getDate()}</div>
            ${data.showLunar ? `<div class="wp-day-lunar">${lunarText}</div>` : ''}
          </div>
          <div class="wp-day-right">${rightContent}</div>
        </div>
      `;
    }

    const renderMiniMonth = (year, month) => {
      const firstDay = new Date(year, month, 1);
      const firstDayIdx = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const weekStartTs = data.weekStart;
      const weekEndTs = weekStartTs + 6 * 24 * 60 * 60 * 1000;

      let cells = '';
      let dayNum = 1;
      for (let row = 0; row < 6; row++) {
        for (let col = 0; col < 7; col++) {
          const idx = row * 7 + col;
          if (idx < firstDayIdx || dayNum > daysInMonth) {
            cells += `<div class="wp-mini-cell empty"></div>`;
          } else {
            const cellDate = new Date(year, month, dayNum);
            const cellTs = cellDate.getTime();
            const isInWeek = cellTs >= weekStartTs && cellTs <= weekEndTs;
            const isToday = cellDate.toDateString() === new Date().toDateString();
            cells += `
              <div class="wp-mini-cell ${isInWeek ? 'in-week' : ''} ${isToday ? 'today' : ''}"
                style="${isInWeek ? 'background-color:' + weekDayColors[col] + '30' + ';' : ''}"
                onclick="Editor.weeklyGotoDate('${elem.id}', ${year}, ${month}, ${dayNum})">
                ${dayNum}
              </div>
            `;
            dayNum++;
          }
        }
      }

      const miniWeekLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
      const weekLabelsHtml = miniWeekLabels.map((l, i) => `
        <div class="wp-mini-week-label" style="color:${weekDayColors[i]};">${l}</div>
      `).join('');

      return `
        <div class="wp-mini-cal">
          <div class="wp-mini-title">${monthNames[month].slice(0, 3)} ${year}</div>
          <div class="wp-mini-week-row">${weekLabelsHtml}</div>
          <div class="wp-mini-grid">${cells}</div>
        </div>
      `;
    };

    const prevMonth = data.month === 0 ? 11 : data.month - 1;
    const prevYear = data.month === 0 ? data.year - 1 : data.year;
    const nextMonth = data.month === 11 ? 0 : data.month + 1;
    const nextYear = data.month === 11 ? data.year + 1 : data.year;

    const miniCalLeft = renderMiniMonth(prevYear, prevMonth);
    const miniCalRight = renderMiniMonth(data.year, data.month);

    const innerHtml = `
      <div class="wp-top-tabs">
        <span class="wp-top-tab" data-tab="year" onclick="Editor.weeklySwitchTopTab('${elem.id}', 'year')">YEAR</span>
        <span class="wp-top-tab" data-tab="note" onclick="Editor.weeklySwitchTopTab('${elem.id}', 'note')">NOTE</span>
        <span class="wp-top-tab active" data-tab="list" onclick="Editor.weeklySwitchTopTab('${elem.id}', 'list')">LIST</span>
      </div>
      <div class="wp-month-nums-row">${monthNums}</div>
      <div class="wp-week-header">
        <button class="wp-nav-btn" onclick="Editor.weeklyPrevWeek('${elem.id}')">&#10094;</button>
        <div class="wp-week-title">
          <div class="wp-month-name">${monthName}</div>
          <div class="wp-week-sub">第 ${weekOfMonth} 周 / 月第 ${weekOfMonth} 周</div>
        </div>
        <button class="wp-nav-btn" onclick="Editor.weeklyNextWeek('${elem.id}')">&#10095;</button>
      </div>
      <div class="wp-days-container">
        ${dailyRows}
      </div>
      <div class="wp-mini-cals">
        ${miniCalLeft}
        ${miniCalRight}
      </div>
      <div class="wp-bottom-bar">
        <button class="wp-layout-switch" onclick="Editor.weeklySwitchLayout('${elem.id}')">
          ${isSimple ? '时间轴版' : '简约版'}
        </button>
      </div>
    `;

    inner.innerHTML = innerHtml;
  },

  _bindWeeklyPlannerInnerEvents(container) {
    const inner = container.querySelector('.weekly-planner-inner');
    if (!inner || inner._wpDelegateBound) return;
    inner._wpDelegateBound = true;

    const stopIfInside = (e) => {
      if (e.target.closest('button, [contenteditable="true"], ' +
        '.wp-month-num, .wp-nav-btn, .wp-week-title, .wp-day-content, ' +
        '.wp-tl-dot, .wp-mini-cell, .wp-top-tab, .wp-layout-switch')) {
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

  _findWeeklyElem(elemId) {
    return this.elements.find(el => el.id === elemId && el.type === 'widget-weekly');
  },

  _rerenderWeekly(elemId) {
    const elem = this._findWeeklyElem(elemId);
    if (!elem) return;
    const domEl = document.querySelector(`.paper-element[data-id="${elemId}"]`);
    if (domEl) {
      this.renderWeeklyPlanner(elem, domEl);
      this._bindWeeklyPlannerInnerEvents(domEl);
    }
  },

  weeklyPrevWeek(elemId) {
    this.saveUndoState();
    const elem = this._findWeeklyElem(elemId);
    if (!elem || !elem.weeklyData) return;
    const newStart = new Date(elem.weeklyData.weekStart);
    newStart.setDate(newStart.getDate() - 7);
    elem.weeklyData.weekStart = newStart.getTime();
    elem.weeklyData.year = newStart.getFullYear();
    elem.weeklyData.month = newStart.getMonth();
    const firstDay = new Date(newStart.getFullYear(), newStart.getMonth(), 1);
    const firstDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    elem.weeklyData.weekOfMonth = Math.ceil((newStart.getDate() + firstDayOfWeek) / 7);
    this._rerenderWeekly(elemId);
  },

  weeklyNextWeek(elemId) {
    this.saveUndoState();
    const elem = this._findWeeklyElem(elemId);
    if (!elem || !elem.weeklyData) return;
    const newStart = new Date(elem.weeklyData.weekStart);
    newStart.setDate(newStart.getDate() + 7);
    elem.weeklyData.weekStart = newStart.getTime();
    elem.weeklyData.year = newStart.getFullYear();
    elem.weeklyData.month = newStart.getMonth();
    const firstDay = new Date(newStart.getFullYear(), newStart.getMonth(), 1);
    const firstDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    elem.weeklyData.weekOfMonth = Math.ceil((newStart.getDate() + firstDayOfWeek) / 7);
    this._rerenderWeekly(elemId);
  },

  weeklyGotoMonth(elemId, monthIdx) {
    this.saveUndoState();
    const elem = this._findWeeklyElem(elemId);
    if (!elem || !elem.weeklyData) return;
    const year = elem.weeklyData.year;
    const firstDay = new Date(year, monthIdx, 1);
    const firstDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    const monday = new Date(year, monthIdx, 1 - firstDayOfWeek);
    elem.weeklyData.weekStart = monday.getTime();
    elem.weeklyData.year = monday.getFullYear();
    elem.weeklyData.month = monthIdx;
    elem.weeklyData.weekOfMonth = 1;
    this._rerenderWeekly(elemId);
  },

  weeklyGotoDate(elemId, year, month, day) {
    this.saveUndoState();
    const elem = this._findWeeklyElem(elemId);
    if (!elem || !elem.weeklyData) return;
    const targetDate = new Date(year, month, day);
    const dayOfWeek = targetDate.getDay() === 0 ? 6 : targetDate.getDay() - 1;
    const monday = new Date(year, month, day - dayOfWeek);
    elem.weeklyData.weekStart = monday.getTime();
    elem.weeklyData.year = monday.getFullYear();
    elem.weeklyData.month = monday.getMonth();
    const firstDayOfMonth = new Date(monday.getFullYear(), monday.getMonth(), 1);
    const firstDayOfWeek = firstDayOfMonth.getDay() === 0 ? 6 : firstDayOfMonth.getDay() - 1;
    elem.weeklyData.weekOfMonth = Math.ceil((monday.getDate() + firstDayOfWeek) / 7);
    this._rerenderWeekly(elemId);
  },

  weeklySwitchLayout(elemId) {
    this.saveUndoState();
    const elem = this._findWeeklyElem(elemId);
    if (!elem || !elem.weeklyData) return;
    elem.weeklyData.activeLayout = elem.weeklyData.activeLayout === 'simple' ? 'timeline' : 'simple';
    this._rerenderWeekly(elemId);
  },

  weeklySwitchTopTab(elemId, tab) {
  },

  weeklyEditDayContent(elemId, dateKey, text) {
    const elem = this._findWeeklyElem(elemId);
    if (!elem || !elem.weeklyData) return;
    if (!elem.weeklyData.dailyData) {
      elem.weeklyData.dailyData = {};
    }
    const old = (elem.weeklyData.dailyData[dateKey] && elem.weeklyData.dailyData[dateKey].content) || '';
    if (old !== text) {
      this.saveUndoState();
      if (elem.weeklyData.dailyData[dateKey]) {
        elem.weeklyData.dailyData[dateKey].content = text;
      } else {
        elem.weeklyData.dailyData[dateKey] = { content: text, timeline: [] };
      }
    }
  },

  weeklyToggleTimelineHour(elemId, dateKey, hour) {
    this.saveUndoState();
    const elem = this._findWeeklyElem(elemId);
    if (!elem || !elem.weeklyData) return;
    if (!elem.weeklyData.dailyData) {
      elem.weeklyData.dailyData = {};
    }
    if (!elem.weeklyData.dailyData[dateKey]) {
      elem.weeklyData.dailyData[dateKey] = { content: '', timeline: [] };
    }
    const timeline = elem.weeklyData.dailyData[dateKey].timeline;
    const idx = timeline.indexOf(hour);
    if (idx >= 0) {
      timeline.splice(idx, 1);
    } else {
      timeline.push(hour);
      timeline.sort((a, b) => a - b);
    }
    this._rerenderWeekly(elemId);
  },
});
