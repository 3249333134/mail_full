/* ========================================
   Year Planner Widget
   ======================================== */

Object.assign(Editor, {
  yearPlannerCategoryColors: {
    1: '#d4a5a5',
    2: '#e6c88a',
    3: '#a5b89a',
    4: '#b8956a'
  },

  yearPlannerMonthNames: ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'],

  renderYearPlanner(elem, container) {
    const data = elem.plannerData;
    const colors = this.yearPlannerCategoryColors;
    const cat = data.activeCategory;
    const catData = data.categories[cat];
    const monthNames = this.yearPlannerMonthNames;

    const categoryDots = [1, 2, 3, 4].map(c => `
      <div class="yp-cat-dot ${c === cat ? 'active' : ''}" 
        style="background-color: ${colors[c]};"
        onclick="Editor.yearPlannerSwitchCategory('${elem.id}', ${c})"></div>
    `).join('');

    let yearContent = '';
    
    if (data.yearLayout === 'plan') {
      const quarters = [0, 1, 2, 3].map(q => {
        const monthsInQ = [q * 3, q * 3 + 1, q * 3 + 2].map(mIdx => {
          const monthData = catData.plan[mIdx] || { content: '' };
          const isActive = data.activeMonth === mIdx;
          return `
            <div class="yp-plan-month-card ${isActive ? 'active' : ''}" data-month="${mIdx}"
              ondblclick="Editor.yearPlannerEditMonth('${elem.id}', ${mIdx})"
              onclick="Editor.yearPlannerSelectMonth('${elem.id}', ${mIdx})">
              <div class="yp-plan-month-name" style="color: ${colors[cat]};">${monthNames[mIdx]}</div>
              <div class="yp-plan-month-content" contenteditable="true"
                onblur="Editor.yearPlannerEditMonthContent('${elem.id}', ${mIdx}, this.innerHTML)"
                onclick="event.stopPropagation();">${monthData.content || ''}</div>
            </div>
          `;
        }).join('');
        return `<div class="yp-plan-quarter-row">${monthsInQ}</div>`;
      }).join('');
      
      const layoutSwitchBtns = `
        <div class="yp-layout-switch">
          <button class="yp-layout-btn ${data.yearLayout === 'plan' ? 'active' : ''}" 
            onclick="Editor.yearPlannerSwitchLayout('${elem.id}', 'plan')">PLAN</button>
          <button class="yp-layout-btn ${data.yearLayout === 'task' ? 'active' : ''}"
            onclick="Editor.yearPlannerSwitchLayout('${elem.id}', 'task')">TASK</button>
          <button class="yp-layout-btn ${data.yearLayout === 'goal' ? 'active' : ''}"
            onclick="Editor.yearPlannerSwitchLayout('${elem.id}', 'goal')">GOAL</button>
        </div>
      `;
      
      yearContent = `
        ${layoutSwitchBtns}
        <div class="yp-layout-title-row">
          <span class="yp-layout-title">PLAN /</span>
          <div class="yp-cat-dots-row">${categoryDots}</div>
        </div>
        <div class="yp-plan-layout">
          ${quarters}
        </div>
      `;
    } else if (data.yearLayout === 'task') {
      const filteredTasks = catData.tasks;
      
      const taskRows = filteredTasks.map((task) => {
        const completedCount = task.marks.filter(m => m).length;
        const marksHtml = task.marks.map((marked, monthIdx) => `
          <div class="yp-task-mark-cell ${marked ? 'marked' : ''} ${data.activeMonth === monthIdx ? 'active-col' : ''}"
            style="background-color: ${marked ? colors[task.category] : 'transparent'};
                   border: 1px solid ${marked ? colors[task.category] : (data.activeMonth === monthIdx ? colors[cat] : 'rgba(92,80,69,0.15)')};"
            onclick="Editor.yearPlannerToggleTaskMark('${elem.id}', '${task.id}', ${monthIdx})"></div>
        `).join('');
        
        return `
          <div class="yp-task-row-item">
            <div class="yp-task-checkbox ${task.completed ? 'checked' : ''}"
              style="border-color: ${colors[task.category]};"
              onclick="Editor.yearPlannerToggleTaskComplete('${elem.id}', '${task.id}')">
              ${task.completed ? '✓' : ''}
            </div>
            <div class="yp-task-name ${task.completed ? 'completed' : ''}"
              contenteditable="true"
              onblur="Editor.yearPlannerEditTaskName('${elem.id}', '${task.id}', this.textContent)"
              onclick="event.stopPropagation();">${task.text || ''}</div>
            <div class="yp-task-marks-row">
              ${marksHtml}
            </div>
            <div class="yp-task-count">${completedCount}/12</div>
          </div>
        `;
      }).join('');
      
      const monthHeader = monthNames.map(m => `
        <div class="yp-task-month-header">${m.charAt(0)}</div>
      `).join('');
      
      const layoutSwitchBtns = `
        <div class="yp-layout-switch">
          <button class="yp-layout-btn ${data.yearLayout === 'plan' ? 'active' : ''}" 
            onclick="Editor.yearPlannerSwitchLayout('${elem.id}', 'plan')">PLAN</button>
          <button class="yp-layout-btn ${data.yearLayout === 'task' ? 'active' : ''}"
            onclick="Editor.yearPlannerSwitchLayout('${elem.id}', 'task')">TASK</button>
          <button class="yp-layout-btn ${data.yearLayout === 'goal' ? 'active' : ''}"
            onclick="Editor.yearPlannerSwitchLayout('${elem.id}', 'goal')">GOAL</button>
        </div>
      `;
      
      yearContent = `
        ${layoutSwitchBtns}
        <div class="yp-layout-title-row">
          <span class="yp-layout-title">TASK /</span>
          <div class="yp-cat-dots-row">${categoryDots}</div>
        </div>
        <div class="yp-task-layout-v2">
          <div class="yp-task-header-row">
            <div class="yp-task-checkbox-col"></div>
            <div class="yp-task-name-col">任务</div>
            <div class="yp-task-marks-col">
              ${monthHeader}
            </div>
            <div class="yp-task-count-col"></div>
          </div>
          <div class="yp-task-rows-container">
            ${taskRows || '<div class="yp-task-empty">暂无任务，点击下方按钮添加</div>'}
          </div>
          <div class="yp-task-add-row">
            <button class="yp-add-task-btn" onclick="Editor.yearPlannerAddTask('${elem.id}')">+ 新增任务</button>
          </div>
          <div class="yp-dot-notes-area"></div>
        </div>
      `;
    } else {
      const goalData = catData.goal;
      const goalColors = ['#e6c88a', '#a5b89a', '#b8956a'];
      
      const goalsHtml = goalData.goals.map((goal, idx) => `
        <div class="yp-goal-card-v2">
          <div class="yp-goal-num-dot" style="background-color: ${goalColors[idx]};">
            <span style="color: white;">${idx + 1}</span>
          </div>
          <div class="yp-goal-text" contenteditable="true"
            onblur="Editor.yearPlannerEditGoal('${elem.id}', ${idx}, this.textContent)"
            onclick="event.stopPropagation();"
            placeholder="目标${idx + 1}...">${goal.title || ''}</div>
        </div>
      `).join('');
      
      const layoutSwitchBtns = `
        <div class="yp-layout-switch">
          <button class="yp-layout-btn ${data.yearLayout === 'plan' ? 'active' : ''}" 
            onclick="Editor.yearPlannerSwitchLayout('${elem.id}', 'plan')">PLAN</button>
          <button class="yp-layout-btn ${data.yearLayout === 'task' ? 'active' : ''}"
            onclick="Editor.yearPlannerSwitchLayout('${elem.id}', 'task')">TASK</button>
          <button class="yp-layout-btn ${data.yearLayout === 'goal' ? 'active' : ''}"
            onclick="Editor.yearPlannerSwitchLayout('${elem.id}', 'goal')">GOAL</button>
        </div>
      `;
      
      yearContent = `
        ${layoutSwitchBtns}
        <div class="yp-layout-title-row">
          <span class="yp-layout-title">GOAL /</span>
          <div class="yp-cat-dots-row">${categoryDots}</div>
        </div>
        <div class="yp-goal-layout-v2">
          <div class="yp-goals-top-row">
            ${goalsHtml}
          </div>
          <div class="yp-goal-section yp-section-full">
            <div class="yp-goal-section-title" style="color: ${colors[1]};">Motivation/Reward</div>
            <div class="yp-goal-section-content" contenteditable="true"
              onblur="Editor.yearPlannerEditGoalSection('${elem.id}', 'motivation', this.textContent)"
              onclick="event.stopPropagation();">${goalData.motivation || ''}</div>
          </div>
          <div class="yp-goal-section-row">
            <div class="yp-goal-section">
              <div class="yp-goal-section-title" style="color: ${colors[3]};">Challenges</div>
              <div class="yp-goal-section-content" contenteditable="true"
                onblur="Editor.yearPlannerEditGoalSection('${elem.id}', 'challenges', this.textContent)"
                onclick="event.stopPropagation();">${goalData.challenges || ''}</div>
            </div>
            <div class="yp-goal-section">
              <div class="yp-goal-section-title" style="color: ${colors[4]};">Achievements</div>
              <div class="yp-goal-section-content" contenteditable="true"
                onblur="Editor.yearPlannerEditGoalSection('${elem.id}', 'achievements', this.textContent)"
                onclick="event.stopPropagation();">${goalData.achievements || ''}</div>
            </div>
          </div>
          <div class="yp-goal-section-row">
            <div class="yp-goal-section">
              <div class="yp-goal-section-title" style="color: ${colors[1]};">Progress</div>
              <div class="yp-goal-section-content" contenteditable="true"
                onblur="Editor.yearPlannerEditGoalSection('${elem.id}', 'progress', this.textContent)"
                onclick="event.stopPropagation();">${goalData.progress || ''}</div>
            </div>
            <div class="yp-goal-section">
              <div class="yp-goal-section-title" style="color: #7a8a9a;">Need To Improve</div>
              <div class="yp-goal-section-content" contenteditable="true"
                onblur="Editor.yearPlannerEditGoalSection('${elem.id}', 'needImprove', this.textContent)"
                onclick="event.stopPropagation();">${goalData.needImprove || ''}</div>
            </div>
          </div>
        </div>
      `;
    }

    const listTabs = data.lists.map((list, idx) => `
      <button class="yp-list-tab ${data.activeListId === list.id ? 'active' : ''}"
        onclick="Editor.yearPlannerSwitchList('${elem.id}', '${list.id}')">${list.name}</button>
    `).join('');
    
    const currentList = data.lists.find(l => l.id === data.activeListId) || data.lists[0];
    const listItemsHtml = (currentList?.items || []).map(item => `
      <div class="yp-list-item ${item.completed ? 'completed' : ''}">
        <button class="yp-list-checkbox"
          onclick="Editor.yearPlannerToggleListItem('${elem.id}', '${currentList.id}', '${item.id}')">
          ${item.completed ? '✓' : ''}
        </button>
        <div class="yp-list-item-text" contenteditable="true"
          onblur="Editor.yearPlannerEditListItem('${elem.id}', '${currentList.id}', '${item.id}', this.textContent)"
          onclick="event.stopPropagation();">${item.text || ''}</div>
        <button class="yp-list-delete"
          onclick="Editor.yearPlannerDeleteListItem('${elem.id}', '${currentList.id}', '${item.id}')">×</button>
      </div>
    `).join('');

    const monthDotsRow = monthNames.map((m, i) => `
      <div class="yp-month-num ${data.activeMonth === i ? 'active' : ''}"
        style="${data.activeMonth === i ? 'color:' + colors[cat] + ';' : ''}"
        onclick="Editor.yearPlannerSelectMonth('${elem.id}', ${i})">${i + 1}</div>
    `).join('');

    const innerHtml = `
      <div class="yp-tabs">
        <button class="yp-tab ${data.activeTab === 'year' ? 'active' : ''}"
          onclick="Editor.yearPlannerSwitchTab('${elem.id}', 'year')">YEAR</button>
        <button class="yp-tab ${data.activeTab === 'note' ? 'active' : ''}"
          onclick="Editor.yearPlannerSwitchTab('${elem.id}', 'note')">NOTE</button>
        <button class="yp-tab ${data.activeTab === 'list' ? 'active' : ''}"
          onclick="Editor.yearPlannerSwitchTab('${elem.id}', 'list')">LIST</button>
      </div>
      
      <div class="yp-months-bar">
        ${monthDotsRow}
      </div>
      
      <div class="yp-cat-dots-deco">
        ${[1, 2, 3, 4].map(c => `
          <div class="yp-cat-dot ${c === cat ? 'active' : ''}" 
            style="background-color: ${colors[c]};"
            onclick="Editor.yearPlannerSwitchCategory('${elem.id}', ${c})"></div>
        `).join('')}
      </div>
      
      <div class="yp-content">
        <div class="yp-tab-content ${data.activeTab === 'year' ? 'active' : ''}">
          ${yearContent}
        </div>
        <div class="yp-tab-content ${data.activeTab === 'note' ? 'active' : ''}">
          <div class="yp-note-container">
            <div class="yp-note-area" contenteditable="true"
              onblur="Editor.yearPlannerEditNote('${elem.id}', this.innerHTML)"
              onclick="event.stopPropagation();">
              ${data.noteContent || ''}
            </div>
          </div>
        </div>
        <div class="yp-tab-content ${data.activeTab === 'list' ? 'active' : ''}">
          <div class="yp-list-container">
            <div class="yp-list-tabs">${listTabs}</div>
            <div class="yp-list-content">
              <div class="yp-list-header">
                <button class="yp-add-btn" onclick="Editor.yearPlannerAddListItem('${elem.id}', '${currentList.id}')">+ 添加</button>
              </div>
              <div class="yp-list-items">${listItemsHtml}</div>
            </div>
          </div>
        </div>
      </div>
    `;

    const inner = container.querySelector('.year-planner-inner');
    if (inner) {
      inner.innerHTML = innerHtml;
    } else {
      const wrapper = document.createElement('div');
      wrapper.className = 'year-planner-inner';
      wrapper.innerHTML = innerHtml;
      container.insertBefore(wrapper, container.firstChild);
    }
  },

  _findYearPlannerElem(elemId) {
    return this.elements.find(e => e.id === elemId);
  },

  _rerenderYearPlanner(elemId) {
    const elem = this._findYearPlannerElem(elemId);
    if (!elem) return;
    const domEl = document.querySelector(`.paper-element[data-id="${elemId}"]`);
    if (domEl) {
      this.renderYearPlanner(elem, domEl);
      this._bindYearPlannerInnerEvents(domEl);
      elem.height = domEl.offsetHeight;
      elem.width = domEl.offsetWidth;
    }
  },

  _bindYearPlannerInnerEvents(container) {
    const inner = container.querySelector('.year-planner-inner');
    if (!inner || inner._ypDelegateBound) return;
    inner._ypDelegateBound = true;

    const stopIfInside = (e) => {
      if (e.target.closest('button, input, select, textarea, [contenteditable="true"], ' +
        '.yp-plan-month-card, .yp-task-mark-cell, .yp-task-checkbox, ' +
        '.yp-task-name, .yp-list-checkbox, .yp-list-delete, ' +
        '.yp-cat-dot, .yp-layout-btn, .yp-add-btn, .yp-tab, ' +
        '.yp-goal-text, .yp-goal-section-content, .yp-note-area, .yp-plan-month-content')) {
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

  yearPlannerSwitchTab(elemId, tab) {
    this.saveUndoState();
    const elem = this._findYearPlannerElem(elemId);
    if (elem && elem.plannerData) {
      elem.plannerData.activeTab = tab;
      this._rerenderYearPlanner(elemId);
    }
  },

  yearPlannerSwitchCategory(elemId, category) {
    this.saveUndoState();
    const elem = this._findYearPlannerElem(elemId);
    if (elem && elem.plannerData) {
      elem.plannerData.activeCategory = category;
      this._rerenderYearPlanner(elemId);
    }
  },

  yearPlannerSelectMonth(elemId, monthIndex) {
    this.saveUndoState();
    const elem = this._findYearPlannerElem(elemId);
    if (elem && elem.plannerData) {
      elem.plannerData.activeMonth = elem.plannerData.activeMonth === monthIndex ? null : monthIndex;
      this._rerenderYearPlanner(elemId);
    }
  },

  yearPlannerSwitchLayout(elemId, layout) {
    this.saveUndoState();
    const elem = this._findYearPlannerElem(elemId);
    if (elem && elem.plannerData) {
      elem.plannerData.yearLayout = layout;
      this._rerenderYearPlanner(elemId);
    }
  },

  yearPlannerEditMonth(elemId, monthIdx) {
    this.saveUndoState();
    const elem = this._findYearPlannerElem(elemId);
    if (!elem || !elem.plannerData) return;
    const cat = elem.plannerData.activeCategory;
    const catData = elem.plannerData.categories[cat];
    if (!catData.plan[monthIdx]) {
      catData.plan[monthIdx] = { content: '' };
    }
    this._rerenderYearPlanner(elemId);
  },

  yearPlannerEditMonthContent(elemId, monthIdx, html) {
    this.saveUndoState();
    const elem = this._findYearPlannerElem(elemId);
    if (!elem || !elem.plannerData) return;
    const cat = elem.plannerData.activeCategory;
    const catData = elem.plannerData.categories[cat];
    if (!catData.plan[monthIdx]) {
      catData.plan[monthIdx] = { content: '' };
    }
    catData.plan[monthIdx].content = html;
  },

  yearPlannerJumpToMonth(elemId, monthIdx) {
    const elem = this._findYearPlannerElem(elemId);
    if (!elem || !elem.plannerData) return;
    elem.plannerData.yearLayout = 'task';
    this._rerenderYearPlanner(elemId);
  },

  yearPlannerAddTask(elemId) {
    this.saveUndoState();
    const elem = this._findYearPlannerElem(elemId);
    if (!elem || !elem.plannerData) return;
    const cat = elem.plannerData.activeCategory;
    const catData = elem.plannerData.categories[cat];
    const newTask = {
      id: 'task-' + Date.now(),
      text: '',
      category: cat,
      completed: false,
      marks: new Array(12).fill(false)
    };
    catData.tasks.push(newTask);
    this._rerenderYearPlanner(elemId);
  },

  yearPlannerToggleTaskComplete(elemId, taskId) {
    this.saveUndoState();
    const elem = this._findYearPlannerElem(elemId);
    if (!elem || !elem.plannerData) return;
    const cat = elem.plannerData.activeCategory;
    const catData = elem.plannerData.categories[cat];
    const task = catData.tasks.find(t => t.id === taskId);
    if (task) {
      task.completed = !task.completed;
      this._rerenderYearPlanner(elemId);
    }
  },

  yearPlannerEditTaskName(elemId, taskId, text) {
    this.saveUndoState();
    const elem = this._findYearPlannerElem(elemId);
    if (!elem || !elem.plannerData) return;
    const cat = elem.plannerData.activeCategory;
    const catData = elem.plannerData.categories[cat];
    const task = catData.tasks.find(t => t.id === taskId);
    if (task) {
      task.text = text;
    }
  },

  yearPlannerToggleTaskMark(elemId, taskId, monthIdx) {
    this.saveUndoState();
    const elem = this._findYearPlannerElem(elemId);
    if (!elem || !elem.plannerData) return;
    const cat = elem.plannerData.activeCategory;
    const catData = elem.plannerData.categories[cat];
    const task = catData.tasks.find(t => t.id === taskId);
    if (task && task.marks) {
      task.marks[monthIdx] = !task.marks[monthIdx];
      this._rerenderYearPlanner(elemId);
    }
  },

  yearPlannerEditGoal(elemId, goalIdx, text) {
    this.saveUndoState();
    const elem = this._findYearPlannerElem(elemId);
    if (!elem || !elem.plannerData) return;
    const cat = elem.plannerData.activeCategory;
    const catData = elem.plannerData.categories[cat];
    if (catData.goal.goals[goalIdx]) {
      catData.goal.goals[goalIdx].title = text;
    }
  },

  yearPlannerEditGoalSection(elemId, section, text) {
    this.saveUndoState();
    const elem = this._findYearPlannerElem(elemId);
    if (!elem || !elem.plannerData) return;
    const cat = elem.plannerData.activeCategory;
    const catData = elem.plannerData.categories[cat];
    catData.goal[section] = text;
  },

  yearPlannerEditNote(elemId, html) {
    this.saveUndoState();
    const elem = this._findYearPlannerElem(elemId);
    if (elem && elem.plannerData) {
      elem.plannerData.noteContent = html;
    }
  },

  yearPlannerSwitchList(elemId, listId) {
    this.saveUndoState();
    const elem = this._findYearPlannerElem(elemId);
    if (elem && elem.plannerData) {
      elem.plannerData.activeListId = listId;
      this._rerenderYearPlanner(elemId);
    }
  },

  yearPlannerAddListItem(elemId, listId) {
    this.saveUndoState();
    const elem = this._findYearPlannerElem(elemId);
    if (!elem || !elem.plannerData) return;
    const list = elem.plannerData.lists.find(l => l.id === listId);
    if (list) {
      list.items.push({
        id: 'item-' + Date.now(),
        text: '',
        completed: false
      });
      this._rerenderYearPlanner(elemId);
    }
  },

  yearPlannerToggleListItem(elemId, listId, itemId) {
    this.saveUndoState();
    const elem = this._findYearPlannerElem(elemId);
    if (!elem || !elem.plannerData) return;
    const list = elem.plannerData.lists.find(l => l.id === listId);
    if (list) {
      const item = list.items.find(i => i.id === itemId);
      if (item) {
        item.completed = !item.completed;
        this._rerenderYearPlanner(elemId);
      }
    }
  },

  yearPlannerEditListItem(elemId, listId, itemId, text) {
    this.saveUndoState();
    const elem = this._findYearPlannerElem(elemId);
    if (!elem || !elem.plannerData) return;
    const list = elem.plannerData.lists.find(l => l.id === listId);
    if (list) {
      const item = list.items.find(i => i.id === itemId);
      if (item) {
        item.text = text;
      }
    }
  },

  yearPlannerDeleteListItem(elemId, listId, itemId) {
    this.saveUndoState();
    const elem = this._findYearPlannerElem(elemId);
    if (!elem || !elem.plannerData) return;
    const list = elem.plannerData.lists.find(l => l.id === listId);
    if (list) {
      list.items = list.items.filter(i => i.id !== itemId);
      this._rerenderYearPlanner(elemId);
    }
  },
});
