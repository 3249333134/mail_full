/* ========================================
   Daily Planner Widget
   ======================================== */

Object.assign(Editor, {
  renderDailyPlanner(elem, container) {
    const inner = container.querySelector('.daily-planner-inner');
    if (!inner) return;
    const data = elem.dailyData;
    if (!data) return;

    const monthNames = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
    const colorList = ['#d4a574', '#a5b89a', '#b8956a', '#d4a5a5', '#7a93b5'];
    const catColors = { life: '#d4a5a5', study: '#a5b89a', work: '#7a93b5', growth: '#d4a574' };
    const weatherIcons = ['☀️', '⛅', '☁️', '🌧️'];
    const moodIcons = ['😊', '😌', '😢', '😡', '🥰'];

    const currentDate = new Date(data.currentDate);
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const day = currentDate.getDate();
    const dateKey = data.currentDate;

    const record = (data.dailyRecords && data.dailyRecords[dateKey]) || {
      weather: '', mood: '', timeCells: [], timelineBlocks: [],
      gratitude: { goal: '', topMoment: '', grateful: '' }, todos: []
    };

    const monthNums = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => {
      const isActive = m - 1 === month;
      const colorIdx = (m - 1) % 5;
      const activeColor = colorList[colorIdx];
      return `
        <div class="dp-month-num ${isActive ? 'active' : ''}"
          style="${isActive ? 'background-color:' + activeColor + ';border-color:' + activeColor + ';color:white;' : ''}"
          onclick="Editor.dailyGotoMonth('${elem.id}', ${m - 1})">
          ${m}
        </div>
      `;
    }).join('');

    const topTabs = `
      <div class="dp-top-tabs">
        <span class="dp-top-tab ${data.activeTab === 'year' ? 'active' : ''}" data-tab="year" style="color:${data.activeTab === 'year' ? '#b8956a' : ''}" onclick="Editor.dailySwitchTopTab('${elem.id}', 'year')">YEAR</span>
        <span class="dp-top-tab ${data.activeTab === 'note' ? 'active' : ''}" data-tab="note" style="color:${data.activeTab === 'note' ? '#7a93b5' : ''}" onclick="Editor.dailySwitchTopTab('${elem.id}', 'note')">NOTE</span>
        <span class="dp-top-tab ${data.activeTab === 'list' ? 'active' : ''}" data-tab="list" style="color:${data.activeTab === 'list' ? '#d4a5a5' : ''}" onclick="Editor.dailySwitchTopTab('${elem.id}', 'list')">LIST</span>
      </div>
      <div class="dp-month-nums-row">${monthNums}</div>
    `;

    let mainContent = '';

    if (data.activeTab === 'year') {
      mainContent = this._renderDailyYearTab(elem, data, record, year, month, day, dateKey, monthNames, colorList, weatherIcons, moodIcons);
    } else if (data.activeTab === 'note') {
      mainContent = this._renderDailyNoteTab(elem, data, colorList);
    } else if (data.activeTab === 'list') {
      mainContent = this._renderDailyListTab(elem, data, colorList);
    }

    inner.innerHTML = topTabs + mainContent;
  },

  _renderDailyYearTab(elem, data, record, year, month, day, dateKey, monthNames, colorList, weatherIcons, moodIcons) {
    const layout = data.activeLayout;
    const dateHeader = `
      <div class="dp-date-header">
        <button class="dp-nav-btn" onclick="Editor.dailyPrevDay('${elem.id}')">&#10094;</button>
        <div class="dp-date-info" onclick="Editor.dailyGotoMonthPage('${elem.id}')">
          <span class="dp-date-day">${day}</span>
          <span class="dp-date-sep">/</span>
          <span class="dp-date-month">${monthNames[month]}</span>
        </div>
        <button class="dp-nav-btn" onclick="Editor.dailyNextDay('${elem.id}')">&#10095;</button>
        <div class="dp-weather-mood">
          ${weatherIcons.map((w, i) => `
            <span class="dp-wm-icon ${record.weather === 'w' + i ? 'active' : ''}" data-type="weather" data-val="w${i}"
              onclick="Editor.dailySetWeatherMood('${elem.id}', 'weather', 'w${i}')">${w}</span>
          `).join('')}
          ${moodIcons.map((m, i) => `
            <span class="dp-wm-icon ${record.mood === 'm' + i ? 'active' : ''}" data-type="mood" data-val="m${i}"
              onclick="Editor.dailySetWeatherMood('${elem.id}', 'mood', 'm${i}')">${m}</span>
          `).join('')}
        </div>
      </div>
    `;

    let layoutContent = '';

    if (layout === 'timegrid') {
      layoutContent = this._renderDailyTimeGrid(elem, record, dateKey, colorList);
    } else if (layout === 'timeline') {
      layoutContent = this._renderDailyTimeline(elem, record, dateKey, colorList);
    } else if (layout === 'gratitude') {
      layoutContent = this._renderDailyGratitude(elem, record, dateKey);
    }

    const layoutSwitch = `
      <div class="dp-layout-switch-bar">
        <button class="dp-layout-btn ${layout === 'timegrid' ? 'active' : ''}" onclick="Editor.dailySwitchLayout('${elem.id}', 'timegrid')">时间格子</button>
        <button class="dp-layout-btn ${layout === 'timeline' ? 'active' : ''}" onclick="Editor.dailySwitchLayout('${elem.id}', 'timeline')">时间轴</button>
        <button class="dp-layout-btn ${layout === 'gratitude' ? 'active' : ''}" onclick="Editor.dailySwitchLayout('${elem.id}', 'gratitude')">感恩日记</button>
      </div>
    `;

    return dateHeader + layoutContent + layoutSwitch;
  },

  _renderDailyTimeGrid(elem, record, dateKey, colorList) {
    const hours = [];
    for (let h = 6; h <= 26; h++) {
      const displayH = h > 24 ? h - 24 : h;
      hours.push(h);
    }

    const catColors2 = colorList;
    const todos = record.todos || [];
    const defaultTodos = [
      { text: '', color: catColors2[0], completed: false },
      { text: '', color: catColors2[1], completed: false },
      { text: '', color: catColors2[2], completed: false },
      { text: '', color: catColors2[3], completed: false },
      { text: '', color: catColors2[4], completed: false },
      { text: '', color: catColors2[0], completed: false },
      { text: '', color: catColors2[1], completed: false },
      { text: '', color: catColors2[2], completed: false }
    ];
    const displayTodos = todos.length > 0 ? todos : defaultTodos;

    const timeCells = record.timeCells || [];
    const markedCells = {};
    timeCells.forEach(c => { markedCells[`${c.h}-${c.q}`] = c.color; });

    let timeGridHtml = '';
    hours.forEach(h => {
      const displayH = h > 24 ? h - 24 : h;
      let quarterCells = '';
      for (let q = 0; q < 4; q++) {
        const cellKey = `${h}-${q}`;
        const cellColor = markedCells[cellKey] || '';
        quarterCells += `
          <div class="dp-tg-cell ${cellColor ? 'marked' : ''}"
            style="${cellColor ? 'background-color:' + cellColor + ';' : ''}"
            data-hour="${h}" data-quarter="${q}"
            onclick="Editor.dailyToggleTimeCell('${elem.id}', '${dateKey}', ${h}, ${q})">
          </div>
        `;
      }
      timeGridHtml += `
        <div class="dp-tg-row">
          <div class="dp-tg-hour">${displayH}</div>
          <div class="dp-tg-quarters">${quarterCells}</div>
        </div>
      `;
    });

    const todosHtml = displayTodos.map((t, i) => `
      <div class="dp-todo-item">
        <span class="dp-todo-checkbox ${t.completed ? 'checked' : ''}"
          style="border-color:${t.color};background:${t.completed ? t.color : 'transparent'};"
          onclick="Editor.dailyToggleTodo('${elem.id}', '${dateKey}', ${i})"></span>
        <span class="dp-todo-text ${t.completed ? 'done' : ''}" contenteditable="true"
          onblur="Editor.dailyEditTodo('${elem.id}', '${dateKey}', ${i}, this.textContent)"
          onclick="event.stopPropagation();" onmousedown="event.stopPropagation();">${t.text || ''}</span>
      </div>
    `).join('');

    const totalMinutes = timeCells.length * 15;
    const totalHours = Math.floor(totalMinutes / 60);
    const remainMins = totalMinutes % 60;
    const progressPct = Math.min(100, (totalMinutes / (16 * 60)) * 100);

    return `
      <div class="dp-timegrid-layout">
        <div class="dp-tg-left">
          <div class="dp-tg-mini-head">
            <span></span>
            <span class="dp-tg-q-label">15</span>
            <span class="dp-tg-q-label">30</span>
            <span class="dp-tg-q-label">45</span>
            <span class="dp-tg-q-label">60</span>
          </div>
          <div class="dp-tg-grid">${timeGridHtml}</div>
        </div>
        <div class="dp-tg-right">
          <div class="dp-todos-section">
            ${todosHtml}
          </div>
          <div class="dp-notes-section">
            <div class="dp-notes-area" contenteditable="true"
              onblur="Editor.dailyEditNotes('${elem.id}', '${dateKey}', this.textContent)"
              onclick="event.stopPropagation();" onmousedown="event.stopPropagation();"
              data-placeholder="自由记录..."></div>
          </div>
          <div class="dp-stats-bar">
            <div class="dp-stats-progress">
              <div class="dp-stats-fill" style="width:${progressPct}%;"></div>
            </div>
            <div class="dp-stats-text">
              <span>hrs</span>
              <span class="dp-hrs-num">${totalHours}</span>
              <span>mins</span>
              <span class="dp-mins-num">${remainMins}</span>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  _renderDailyTimeline(elem, record, dateKey, colorList) {
    const timelineBlocks = record.timelineBlocks || [];
    const blocksMap = {};
    timelineBlocks.forEach(b => { blocksMap[b.hour] = b.color; });

    let tlHtml = '';
    for (let h = 1; h <= 24; h++) {
      const color = blocksMap[h] || '';
      tlHtml += `
        <div class="dp-tl-row">
          <div class="dp-tl-hour-bar" style="${color ? 'background-color:' + color + ';' : ''}">
            <span class="dp-tl-hour-num">${h}</span>
          </div>
        </div>
      `;
    }

    return `
      <div class="dp-timeline-layout">
        <div class="dp-tl-left">
          ${tlHtml}
        </div>
        <div class="dp-tl-grid-bg"></div>
      </div>
    `;
  },

  _renderDailyGratitude(elem, record, dateKey) {
    const gratitude = record.gratitude || { goal: '', topMoment: '', grateful: '' };
    return `
      <div class="dp-gratitude-layout">
        <div class="dp-grat-section">
          <div class="dp-grat-title">
            <span class="dp-grat-icon" style="color:#b8956a;">◆</span>
            <span>Goal for Today</span>
          </div>
          <div class="dp-grat-dot-area" contenteditable="true"
            onblur="Editor.dailyEditGratitude('${elem.id}', '${dateKey}', 'goal', this.textContent)"
            onclick="event.stopPropagation();" onmousedown="event.stopPropagation();">${gratitude.goal || ''}</div>
        </div>
        <div class="dp-grat-section">
          <div class="dp-grat-title">
            <span class="dp-grat-icon" style="color:#d4a5a5;">♥</span>
            <span>Top of Today</span>
          </div>
          <div class="dp-grat-dot-area" contenteditable="true"
            onblur="Editor.dailyEditGratitude('${elem.id}', '${dateKey}', 'topMoment', this.textContent)"
            onclick="event.stopPropagation();" onmousedown="event.stopPropagation();">${gratitude.topMoment || ''}</div>
        </div>
        <div class="dp-grat-section">
          <div class="dp-grat-title">
            <span>I'm Grateful...</span>
          </div>
          <div class="dp-grat-bubble" contenteditable="true"
            onblur="Editor.dailyEditGratitude('${elem.id}', '${dateKey}', 'grateful', this.textContent)"
            onclick="event.stopPropagation();" onmousedown="event.stopPropagation();">${gratitude.grateful || ''}</div>
        </div>
      </div>
    `;
  },

  _renderDailyNoteTab(elem, data, colorList) {
    const notes = data.notes || { pages: [], activeNotePage: 0 };
    const activeIdx = notes.activeNotePage || 0;
    const pages = notes.pages || [];
    const currentPage = pages[activeIdx] || { type: 'grid', content: '' };

    const catDots = colorList.slice(0, 4).map((c, i) => `
      <span class="dp-note-cat-dot" style="background:${c};"
        onclick="Editor.dailySwitchNotePage('${elem.id}', ${i})"></span>
    `).join('');

    let noteContent = '';
    const pageType = currentPage.type;

    if (pageType === 'catalog') {
      noteContent = this._renderDailyNoteCatalog(colorList);
    } else {
      let bgClass = '';
      if (pageType === 'grid') bgClass = 'dp-note-bg-grid';
      else if (pageType === 'line') bgClass = 'dp-note-bg-line';
      else if (pageType === 'dot') bgClass = 'dp-note-bg-dot';
      else if (pageType === 'cornell') bgClass = 'dp-note-bg-cornell';

      noteContent = `
        <div class="dp-note-page ${bgClass}">
          <div class="dp-note-content" contenteditable="true"
            onblur="Editor.dailyEditNoteContent('${elem.id}', this.textContent)"
            onclick="event.stopPropagation();" onmousedown="event.stopPropagation();">${currentPage.content || ''}</div>
        </div>
      `;
    }

    return `
      <div class="dp-note-layout">
        <div class="dp-note-header">
          <span class="dp-note-label">NOTE</span>
          <div class="dp-note-dots">${catDots}</div>
        </div>
        ${noteContent}
        <div class="dp-note-page-switch">
          <button onclick="Editor.dailyPrevNotePage('${elem.id}')">◀</button>
          <span>${activeIdx + 1} / ${pages.length}</span>
          <button onclick="Editor.dailyNextNotePage('${elem.id}')">▶</button>
        </div>
      </div>
    `;
  },

  _renderDailyNoteCatalog(colorList) {
    const bulletItems = [
      { symbol: '□', label: '任务' },
      { symbol: '○', label: '事项' },
      { symbol: '△', label: '预约' },
      { symbol: '☆', label: '重点' },
      { symbol: '♡', label: '灵感' },
      { symbol: '☑', label: '完成' },
      { symbol: '☒', label: '取消' },
      { symbol: '→', label: '推迟' },
      { symbol: '∥', label: '暂停' }
    ];
    const colorItems = [
      { color: colorList[0], label: '生活' },
      { color: colorList[1], label: '学习' },
      { color: colorList[2], label: '工作' },
      { color: colorList[3], label: '成长' }
    ];

    return `
      <div class="dp-note-catalog">
        <div class="dp-catalog-title">
          <span class="dp-catalog-k">K</span>
          <span class="dp-catalog-e">E</span>
          <span class="dp-catalog-y">Y</span>
        </div>
        <div class="dp-catalog-key-icon">🔑</div>
        <div class="dp-catalog-table">
          <div class="dp-catalog-col">
            <div class="dp-catalog-col-title">Bullet Code</div>
            ${bulletItems.map(b => `
              <div class="dp-catalog-row">
                <span class="dp-catalog-symbol">${b.symbol}</span>
                <span class="dp-catalog-label">${b.label}</span>
              </div>
            `).join('')}
          </div>
          <div class="dp-catalog-col">
            <div class="dp-catalog-col-title">Color Code</div>
            ${colorItems.map(c => `
              <div class="dp-catalog-row">
                <span class="dp-catalog-checkbox" style="border-color:${c.color};"></span>
                <span class="dp-catalog-label">${c.label}</span>
              </div>
            `).join('')}
            ${bulletItems.slice(0, 5).map(() => '<div class="dp-catalog-row dp-empty-row"></div>').join('')}
          </div>
        </div>
      </div>
    `;
  },

  _renderDailyListTab(elem, data, colorList) {
    const lists = data.lists || { activeList: 'todo', todo: { items: [] }, shopping: { items: [] }, wish: { items: [] }, custom: [] };
    const activeList = lists.activeList || 'todo';
    const catDots = colorList.slice(0, 4).map((c, i) => {
      const listTypes = ['todo', 'shopping', 'wish', 'custom'];
      const lt = listTypes[i] || 'custom';
      return `<span class="dp-list-cat-dot ${activeList === lt ? 'active' : ''}" style="background:${c};"
        onclick="Editor.dailySwitchList('${elem.id}', '${lt}')"></span>`;
    }).join('');

    const listTitles = { todo: 'TO DO LIST', shopping: 'SHOPPING LIST', wish: 'WISH LIST', custom: 'CUSTOM LIST' };
    const listData = lists[activeList] || { items: [] };
    const items = listData.items || [];
    const defaultItems = Array(12).fill(null).map((_, i) => ({
      text: '',
      color: colorList[i % colorList.length],
      completed: false
    }));
    const displayItems = items.length > 0 ? items : defaultItems;

    const itemsHtml = displayItems.map((item, i) => `
      <div class="dp-list-item">
        <span class="dp-list-checkbox ${item.completed ? 'checked' : ''}"
          style="border-color:${item.color};background:${item.completed ? item.color : 'transparent'};"
          onclick="Editor.dailyToggleListItem('${elem.id}', '${activeList}', ${i})"></span>
        <span class="dp-list-text ${item.completed ? 'done' : ''}" contenteditable="true"
          onblur="Editor.dailyEditListItem('${elem.id}', '${activeList}', ${i}, this.textContent)"
          onclick="event.stopPropagation();" onmousedown="event.stopPropagation();">${item.text || ''}</span>
      </div>
    `).join('');

    return `
      <div class="dp-list-layout">
        <div class="dp-list-header">
          <span class="dp-list-label">LIST</span>
          <div class="dp-list-dots">${catDots}</div>
        </div>
        <div class="dp-list-title">${listTitles[activeList] || 'LIST'}</div>
        <div class="dp-list-items">${itemsHtml}</div>
      </div>
    `;
  },

  _bindDailyPlannerInnerEvents(container) {
    const inner = container.querySelector('.daily-planner-inner');
    if (!inner || inner._dpDelegateBound) return;
    inner._dpDelegateBound = true;

    const stopIfInside = (e) => {
      if (e.target.closest('button, [contenteditable="true"], ' +
        '.dp-month-num, .dp-nav-btn, .dp-date-info, .dp-wm-icon, ' +
        '.dp-tg-cell, .dp-todo-checkbox, .dp-todo-text, ' +
        '.dp-layout-btn, .dp-top-tab, .dp-note-cat-dot, ' +
        '.dp-list-cat-dot, .dp-list-checkbox, .dp-list-text, ' +
        '.dp-grat-dot-area, .dp-grat-bubble')) {
        e.stopPropagation();
      }
    };

    inner.addEventListener('mousedown', (e) => {
      stopIfInside(e);
      const editable = e.target.closest('[contenteditable="true"]');
      if (editable) {
        setTimeout(() => {
          if (document.activeElement !== editable) editable.focus();
        }, 0);
      }
    });
    inner.addEventListener('touchstart', (e) => stopIfInside(e), { passive: false });
    inner.addEventListener('click', (e) => stopIfInside(e));
  },

  _findDailyElem(elemId) {
    return this.elements.find(el => el.id === elemId && el.type === 'widget-daily');
  },

  _rerenderDaily(elemId) {
    const elem = this._findDailyElem(elemId);
    if (!elem) return;
    const domEl = document.querySelector(`.paper-element[data-id="${elemId}"]`);
    if (domEl) {
      this.renderDailyPlanner(elem, domEl);
      this._bindDailyPlannerInnerEvents(domEl);
    }
  },

  _ensureDailyRecord(data, dateKey) {
    if (!data.dailyRecords) data.dailyRecords = {};
    if (!data.dailyRecords[dateKey]) {
      data.dailyRecords[dateKey] = {
        weather: '', mood: '', timeCells: [], timelineBlocks: [],
        gratitude: { goal: '', topMoment: '', grateful: '' }, todos: []
      };
    }
    return data.dailyRecords[dateKey];
  },

  dailySwitchTopTab(elemId, tab) {
    this.saveUndoState();
    const elem = this._findDailyElem(elemId);
    if (elem && elem.dailyData) {
      elem.dailyData.activeTab = tab;
      this._rerenderDaily(elemId);
    }
  },

  dailyPrevDay(elemId) {
    this.saveUndoState();
    const elem = this._findDailyElem(elemId);
    if (!elem || !elem.dailyData) return;
    const d = new Date(elem.dailyData.currentDate);
    d.setDate(d.getDate() - 1);
    elem.dailyData.currentDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    this._rerenderDaily(elemId);
  },

  dailyNextDay(elemId) {
    this.saveUndoState();
    const elem = this._findDailyElem(elemId);
    if (!elem || !elem.dailyData) return;
    const d = new Date(elem.dailyData.currentDate);
    d.setDate(d.getDate() + 1);
    elem.dailyData.currentDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    this._rerenderDaily(elemId);
  },

  dailyGotoMonth(elemId, monthIdx) {
    this.saveUndoState();
    const elem = this._findDailyElem(elemId);
    if (!elem || !elem.dailyData) return;
    const d = new Date(elem.dailyData.currentDate);
    d.setMonth(monthIdx);
    if (d.getMonth() !== monthIdx) d.setDate(0);
    elem.dailyData.currentDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    this._rerenderDaily(elemId);
  },

  dailySwitchLayout(elemId, layout) {
    this.saveUndoState();
    const elem = this._findDailyElem(elemId);
    if (elem && elem.dailyData) {
      elem.dailyData.activeLayout = layout;
      this._rerenderDaily(elemId);
    }
  },

  dailySetWeatherMood(elemId, type, val) {
    this.saveUndoState();
    const elem = this._findDailyElem(elemId);
    if (!elem || !elem.dailyData) return;
    const dateKey = elem.dailyData.currentDate;
    const record = this._ensureDailyRecord(elem.dailyData, dateKey);
    record[type] = record[type] === val ? '' : val;
    this._rerenderDaily(elemId);
  },

  dailyToggleTimeCell(elemId, dateKey, hour, quarter) {
    this.saveUndoState();
    const elem = this._findDailyElem(elemId);
    if (!elem || !elem.dailyData) return;
    const record = this._ensureDailyRecord(elem.dailyData, dateKey);
    if (!record.timeCells) record.timeCells = [];
    const idx = record.timeCells.findIndex(c => c.h === hour && c.q === quarter);
    if (idx >= 0) {
      record.timeCells.splice(idx, 1);
    } else {
      const colorList = ['#d4a574', '#a5b89a', '#b8956a', '#d4a5a5', '#7a93b5'];
      const colorIdx = Math.floor(Math.random() * colorList.length);
      record.timeCells.push({ h: hour, q: quarter, color: colorList[0] });
    }
    this._rerenderDaily(elemId);
  },

  dailyToggleTodo(elemId, dateKey, idx) {
    this.saveUndoState();
    const elem = this._findDailyElem(elemId);
    if (!elem || !elem.dailyData) return;
    const record = this._ensureDailyRecord(elem.dailyData, dateKey);
    if (!record.todos) record.todos = [];
    if (record.todos.length <= idx) {
      const colorList = ['#d4a574', '#a5b89a', '#b8956a', '#d4a5a5', '#7a93b5'];
      for (let i = record.todos.length; i <= idx; i++) {
        record.todos.push({ text: '', color: colorList[i % colorList.length], completed: false });
      }
    }
    record.todos[idx].completed = !record.todos[idx].completed;
    this._rerenderDaily(elemId);
  },

  dailyEditTodo(elemId, dateKey, idx, text) {
    const elem = this._findDailyElem(elemId);
    if (!elem || !elem.dailyData) return;
    const record = this._ensureDailyRecord(elem.dailyData, dateKey);
    if (!record.todos) record.todos = [];
    if (record.todos.length <= idx) {
      const colorList = ['#d4a574', '#a5b89a', '#b8956a', '#d4a5a5', '#7a93b5'];
      for (let i = record.todos.length; i <= idx; i++) {
        record.todos.push({ text: '', color: colorList[i % colorList.length], completed: false });
      }
    }
    const old = record.todos[idx].text;
    if (old !== text) {
      this.saveUndoState();
      record.todos[idx].text = text;
    }
  },

  dailyEditNotes(elemId, dateKey, text) {
    const elem = this._findDailyElem(elemId);
    if (!elem || !elem.dailyData) return;
    const record = this._ensureDailyRecord(elem.dailyData, dateKey);
    const old = record.notes || '';
    if (old !== text) {
      this.saveUndoState();
      record.notes = text;
    }
  },

  dailyEditGratitude(elemId, dateKey, field, text) {
    const elem = this._findDailyElem(elemId);
    if (!elem || !elem.dailyData) return;
    const record = this._ensureDailyRecord(elem.dailyData, dateKey);
    if (!record.gratitude) record.gratitude = { goal: '', topMoment: '', grateful: '' };
    const old = record.gratitude[field] || '';
    if (old !== text) {
      this.saveUndoState();
      record.gratitude[field] = text;
    }
  },

  dailySwitchNotePage(elemId, idx) {
    this.saveUndoState();
    const elem = this._findDailyElem(elemId);
    if (elem && elem.dailyData && elem.dailyData.notes) {
      elem.dailyData.notes.activeNotePage = idx;
      this._rerenderDaily(elemId);
    }
  },

  dailyPrevNotePage(elemId) {
    const elem = this._findDailyElem(elemId);
    if (!elem || !elem.dailyData || !elem.dailyData.notes) return;
    const pages = elem.dailyData.notes.pages || [];
    const current = elem.dailyData.notes.activeNotePage || 0;
    const newIdx = current > 0 ? current - 1 : pages.length - 1;
    this.dailySwitchNotePage(elemId, newIdx);
  },

  dailyNextNotePage(elemId) {
    const elem = this._findDailyElem(elemId);
    if (!elem || !elem.dailyData || !elem.dailyData.notes) return;
    const pages = elem.dailyData.notes.pages || [];
    const current = elem.dailyData.notes.activeNotePage || 0;
    const newIdx = current < pages.length - 1 ? current + 1 : 0;
    this.dailySwitchNotePage(elemId, newIdx);
  },

  dailyEditNoteContent(elemId, text) {
    const elem = this._findDailyElem(elemId);
    if (!elem || !elem.dailyData || !elem.dailyData.notes) return;
    const pages = elem.dailyData.notes.pages || [];
    const idx = elem.dailyData.notes.activeNotePage || 0;
    if (pages[idx]) {
      const old = pages[idx].content || '';
      if (old !== text) {
        this.saveUndoState();
        pages[idx].content = text;
      }
    }
  },

  dailySwitchList(elemId, listType) {
    this.saveUndoState();
    const elem = this._findDailyElem(elemId);
    if (elem && elem.dailyData && elem.dailyData.lists) {
      elem.dailyData.lists.activeList = listType;
      this._rerenderDaily(elemId);
    }
  },

  dailyToggleListItem(elemId, listType, idx) {
    this.saveUndoState();
    const elem = this._findDailyElem(elemId);
    if (!elem || !elem.dailyData || !elem.dailyData.lists) return;
    const list = elem.dailyData.lists[listType];
    if (!list) return;
    if (!list.items) list.items = [];
    if (list.items.length <= idx) {
      const colorList = ['#d4a574', '#a5b89a', '#b8956a', '#d4a5a5', '#7a93b5'];
      for (let i = list.items.length; i <= idx; i++) {
        list.items.push({ text: '', color: colorList[i % colorList.length], completed: false });
      }
    }
    list.items[idx].completed = !list.items[idx].completed;
    this._rerenderDaily(elemId);
  },

  dailyEditListItem(elemId, listType, idx, text) {
    const elem = this._findDailyElem(elemId);
    if (!elem || !elem.dailyData || !elem.dailyData.lists) return;
    const list = elem.dailyData.lists[listType];
    if (!list) return;
    if (!list.items) list.items = [];
    if (list.items.length <= idx) {
      const colorList = ['#d4a574', '#a5b89a', '#b8956a', '#d4a5a5', '#7a93b5'];
      for (let i = list.items.length; i <= idx; i++) {
        list.items.push({ text: '', color: colorList[i % colorList.length], completed: false });
      }
    }
    const old = list.items[idx].text;
    if (old !== text) {
      this.saveUndoState();
      list.items[idx].text = text;
    }
  },

  dailyGotoMonthPage(elemId) {
  },
});
