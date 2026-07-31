/* ========================================
   信笺 — 全年本手账功能模块
   ======================================== */

const FONT_HAND = 'Ma Shan Zheng, cursive';
const FONT_XIAOWEI = 'ZCOOL XiaoWei, serif';
const FONT_SERIF = 'Noto Serif SC, serif';
const FONT_DEFAULT = 'system-ui, sans-serif';

const WEEKDAYS = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
const MONTHS = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];

const JournalStickers = {
  categories: {
    cute: [
      { id: 'rabbit', name: '兔子', emoji: '🐰' },
      { id: 'bear', name: '小熊', emoji: '🐻' },
      { id: 'cat', name: '猫咪', emoji: '🐱' },
      { id: 'fox', name: '小狐狸', emoji: '🦊' },
      { id: 'dog', name: '小狗', emoji: '🐶' },
      { id: 'panda', name: '熊猫', emoji: '🐼' },
      { id: 'heart', name: '爱心', emoji: '❤️' },
      { id: 'star', name: '星星', emoji: '⭐' },
      { id: 'sparkle', name: '闪亮', emoji: '✨' },
      { id: 'rainbow', name: '彩虹', emoji: '🌈' },
      { id: 'cloud', name: '云朵', emoji: '☁️' },
      { id: 'sun', name: '太阳', emoji: '☀️' },
    ],
    nature: [
      { id: 'flower', name: '花朵', emoji: '🌸' },
      { id: 'sunflower', name: '向日葵', emoji: '🌻' },
      { id: 'leaf', name: '叶子', emoji: '🍃' },
      { id: 'tree', name: '树', emoji: '🌳' },
      { id: 'butterfly', name: '蝴蝶', emoji: '🦋' },
      { id: 'moon', name: '月亮', emoji: '🌙' },
      { id: 'rainbow2', name: '彩虹', emoji: '🌈' },
      { id: 'cherry', name: '樱花', emoji: '🌸' },
      { id: 'tulip', name: '郁金香', emoji: '🌷' },
      { id: 'rose', name: '玫瑰', emoji: '🌹' },
      { id: 'cactus', name: '仙人掌', emoji: '🌵' },
      { id: 'herb', name: '四叶草', emoji: '🍀' },
    ],
    life: [
      { id: 'coffee', name: '咖啡', emoji: '☕' },
      { id: 'book', name: '书', emoji: '📖' },
      { id: 'music', name: '音乐', emoji: '🎵' },
      { id: 'camera', name: '相机', emoji: '📷' },
      { id: 'airplane', name: '飞机', emoji: '✈️' },
      { id: 'gift', name: '礼物', emoji: '🎁' },
      { id: 'cake', name: '蛋糕', emoji: '🎂' },
      { id: 'pizza', name: '披萨', emoji: '🍕' },
      { id: 'icecream', name: '冰淇淋', emoji: '🍦' },
      { id: 'movie', name: '电影', emoji: '🎬' },
      { id: 'headphone', name: '耳机', emoji: '🎧' },
      { id: 'pencil', name: '铅笔', emoji: '✏️' },
    ],
    deco: [
      { id: 'check', name: '对勾', emoji: '✅' },
      { id: 'arrow', name: '箭头', emoji: '➡️' },
      { id: 'pin', name: '图钉', emoji: '📌' },
      { id: 'clip', name: '回形针', emoji: '📎' },
      { id: 'tag', name: '标签', emoji: '🏷️' },
      { id: 'frame', name: '相框', emoji: '🖼️' },
      { id: 'diamond', name: '钻石', emoji: '💎' },
      { id: 'crown', name: '皇冠', emoji: '👑' },
      { id: 'bridge', name: '彩虹桥', emoji: '🌉' },
      { id: 'balloon', name: '气球', emoji: '🎈' },
      { id: 'confetti', name: '彩带', emoji: '🎊' },
      { id: 'ribbon', name: '蝴蝶结', emoji: '🎀' },
    ],
    tape: [
      { id: 'tape-washi', name: '粉色胶带', emoji: '📏', isTape: true, color: '#f4a4a4' },
      { id: 'tape-blue', name: '蓝色胶带', emoji: '📐', isTape: true, color: '#a4c8e8' },
      { id: 'tape-green', name: '绿色胶带', emoji: '📏', isTape: true, color: '#a8d4a8' },
      { id: 'tape-yellow', name: '黄色胶带', emoji: '📐', isTape: true, color: '#f4e4a4' },
      { id: 'tape-purple', name: '紫色胶带', emoji: '📏', isTape: true, color: '#d4a4e4' },
      { id: 'tape-pink', name: '浅粉胶带', emoji: '📐', isTape: true, color: '#f4c8d8' },
    ]
  },

  getAllStickers() {
    const all = [];
    Object.keys(this.categories).forEach(cat => {
      this.categories[cat].forEach(s => {
        all.push({ ...s, category: cat });
      });
    });
    return all;
  },

  getStickerById(id) {
    return this.getAllStickers().find(s => s.id === id);
  }
};

const JournalTemplates = {
  list: [
    {
      id: 'wishlist',
      name: '愿望清单',
      icon: '🌟',
      desc: '记录你的小小心愿，一个个去实现',
      bgColor: '#fff9e6',
      bgImage: '',
      elements: [
        { type: 'text', x: 50, y: 40, width: 400, fontSize: 42, text: '✨ 愿望清单 ✨', color: '#e6a23c', fontFamily: FONT_HAND, rotation: 0 },
        { type: 'sticker', stickerId: 'star', x: 420, y: 35, scale: 1.8, rotation: -10 },
        { type: 'sticker', stickerId: 'rabbit', x: 30, y: 120, scale: 1.5, rotation: -5 },
        { type: 'text', x: 90, y: 140, width: 350, fontSize: 18, text: '• 趴在窗边听听雨落的声音', color: '#5c4033', fontFamily: FONT_HAND },
        { type: 'text', x: 90, y: 180, width: 350, fontSize: 18, text: '• 看一部高评分的喜剧电影', color: '#5c4033', fontFamily: FONT_HAND },
        { type: 'text', x: 90, y: 220, width: 350, fontSize: 18, text: '• 自己做一顿丰富美味的早餐', color: '#5c4033', fontFamily: FONT_HAND },
        { type: 'text', x: 90, y: 260, width: 350, fontSize: 18, text: '• 到一个慢节奏的城市旅行', color: '#5c4033', fontFamily: FONT_HAND },
        { type: 'sticker', stickerId: 'bear', x: 30, y: 340, scale: 1.5, rotation: 5 },
        { type: 'text', x: 90, y: 350, width: 350, fontSize: 18, text: '• 送给自己一束喜欢的鲜花', color: '#5c4033', fontFamily: FONT_HAND },
        { type: 'text', x: 90, y: 390, width: 350, fontSize: 18, text: '• 躺在草坪上安静地晒太阳', color: '#5c4033', fontFamily: FONT_HAND },
        { type: 'text', x: 90, y: 430, width: 350, fontSize: 18, text: '• 听着音乐在画纸上随手涂鸦', color: '#5c4033', fontFamily: FONT_HAND },
        { type: 'sticker', stickerId: 'heart', x: 420, y: 480, scale: 1.5, rotation: 10 },
        { type: 'sticker', stickerId: 'sparkle', x: 380, y: 450, scale: 1.2, rotation: 15 },
      ]
    },
    {
      id: 'reading',
      name: '读书笔记',
      icon: '📚',
      desc: '记录阅读感悟，摘抄金句',
      bgColor: '#f5f0e6',
      elements: [
        { type: 'text', x: 50, y: 35, width: 400, fontSize: 42, text: '读书笔记', color: '#5c4033', fontFamily: FONT_HAND },
        { type: 'text', x: 50, y: 100, width: 400, fontSize: 24, text: '《书名》', color: '#8b4513', fontFamily: FONT_XIAOWEI },
        { type: 'sticker', stickerId: 'butterfly', x: 400, y: 90, scale: 1.5, rotation: -15 },
        { type: 'text', x: 50, y: 155, width: 400, fontSize: 20, text: '【简介】', color: '#8b4513', fontFamily: FONT_HAND },
        { type: 'text', x: 50, y: 190, width: 400, fontSize: 16, text: '在这里写下这本书的简介...', color: '#666', fontFamily: FONT_HAND },
        { type: 'sticker', stickerId: 'leaf', x: 30, y: 320, scale: 1.2, rotation: -20 },
        { type: 'sticker', stickerId: 'flower', x: 420, y: 450, scale: 1.5, rotation: 10 },
        { type: 'text', x: 50, y: 270, width: 400, fontSize: 20, text: '【金句摘抄】', color: '#8b4513', fontFamily: FONT_HAND },
        { type: 'text', x: 50, y: 305, width: 400, fontSize: 16, text: '「每一个选择的背后似乎都串联着失去。', color: '#5c4033', fontFamily: FONT_HAND },
        { type: 'text', x: 50, y: 360, width: 400, fontSize: 20, text: '【读后感想】', color: '#8b4513', fontFamily: FONT_HAND },
        { type: 'text', x: 50, y: 395, width: 400, fontSize: 16, text: '写下你的读书感悟...', color: '#666', fontFamily: FONT_HAND },
        { type: 'sticker', stickerId: 'book', x: 380, y: 400, scale: 1.8, rotation: -5 },
      ]
    },
    {
      id: 'gratitude',
      name: '感恩日记',
      icon: '💝',
      desc: '记录每一天的小确幸',
      bgColor: '#fdf0f0',
      elements: [
        { type: 'text', x: 50, y: 35, width: 400, fontSize: 36, text: '感恩日记', color: '#c97b7b', fontFamily: FONT_HAND },
        { type: 'sticker', stickerId: 'heart', x: 380, y: 25, scale: 1.8, rotation: 10 },
        { type: 'text', x: 50, y: 95, width: 300, fontSize: 20, text: '2026.01.30', color: '#8b4513', fontFamily: FONT_XIAOWEI },
        { type: 'text', x: 50, y: 145, width: 400, fontSize: 22, text: '今日感恩', color: '#c97b7b', fontFamily: FONT_HAND },
        { type: 'text', x: 50, y: 185, width: 400, fontSize: 16, text: '1. 今天阳光很好，心情也很好', color: '#5c4033', fontFamily: FONT_HAND },
        { type: 'text', x: 50, y: 220, width: 400, fontSize: 16, text: '2. 收到了朋友的暖心消息', color: '#5c4033', fontFamily: FONT_HAND },
        { type: 'text', x: 50, y: 255, width: 400, fontSize: 16, text: '3. 喝到了好喝的咖啡', color: '#5c4033', fontFamily: FONT_HAND },
        { type: 'sticker', stickerId: 'flower', x: 30, y: 340, scale: 1.5, rotation: -10 },
        { type: 'text', x: 50, y: 320, width: 400, fontSize: 22, text: '今日成就', color: '#c97b7b', fontFamily: FONT_HAND },
        { type: 'text', x: 50, y: 360, width: 400, fontSize: 16, text: '✓ 完成了手账的设计', color: '#5c4033', fontFamily: FONT_HAND },
        { type: 'text', x: 50, y: 395, width: 400, fontSize: 16, text: '✓ 读了20页书', color: '#5c4033', fontFamily: FONT_HAND },
        { type: 'text', x: 50, y: 430, width: 400, fontSize: 16, text: '✓ 运动了半小时', color: '#5c4033', fontFamily: FONT_HAND },
        { type: 'sticker', stickerId: 'coffee', x: 350, y: 330, scale: 1.8, rotation: 5 },
        { type: 'sticker', stickerId: 'sun', x: 400, y: 480, scale: 1.5, rotation: -5 },
      ]
    },
    {
      id: 'movie',
      name: '观影手账',
      icon: '🎬',
      desc: '记录看过的电影和感想',
      bgColor: '#f0eef5',
      elements: [
        { type: 'text', x: 50, y: 35, width: 400, fontSize: 36, text: '假期观影', color: '#5c4033', fontFamily: FONT_HAND },
        { type: 'sticker', stickerId: 'music', x: 400, y: 40, scale: 1.8, rotation: 10 },
        { type: 'text', x: 50, y: 100, width: 400, fontSize: 24, text: '《电影名称》', color: '#8b4513', fontFamily: FONT_XIAOWEI },
        { type: 'text', x: 50, y: 145, width: 400, fontSize: 16, text: '导演：xxx', color: '#666', fontFamily: FONT_HAND },
        { type: 'text', x: 50, y: 175, width: 400, fontSize: 16, text: '类型：剧情/爱情', color: '#666', fontFamily: FONT_HAND },
        { type: 'text', x: 50, y: 220, width: 400, fontSize: 20, text: '观后感', color: '#8b4513', fontFamily: FONT_HAND },
        { type: 'text', x: 50, y: 255, width: 400, fontSize: 16, text: '写下你的观影感受...', color: '#666', fontFamily: FONT_HAND },
        { type: 'text', x: 50, y: 330, width: 400, fontSize: 20, text: '印象最深的台词', color: '#8b4513', fontFamily: FONT_HAND },
        { type: 'text', x: 50, y: 370, width: 400, fontSize: 16, text: '「生活就像一盒巧克力，', color: '#5c4033', fontFamily: FONT_HAND },
        { type: 'text', x: 50, y: 400, width: 400, fontSize: 16, text: '你永远不知道下一颗是什么味道。」', color: '#5c4033', fontFamily: FONT_HAND },
        { type: 'text', x: 50, y: 460, width: 400, fontSize: 18, text: '推荐指数：⭐⭐⭐⭐⭐', color: '#e6a23c', fontFamily: FONT_HAND },
        { type: 'sticker', stickerId: 'camera', x: 380, y: 440, scale: 1.8, rotation: 8 },
      ]
    },
    {
      id: 'travel',
      name: '旅行手账',
      icon: '✈️',
      desc: '记录旅途中的美好',
      bgColor: '#e8f4f8',
      elements: [
        { type: 'text', x: 50, y: 35, width: 400, fontSize: 36, text: '旅行日记', color: '#4a7c9b', fontFamily: FONT_HAND },
        { type: 'sticker', stickerId: 'airplane', x: 380, y: 25, scale: 1.8, rotation: 10 },
        { type: 'text', x: 50, y: 100, width: 300, fontSize: 22, text: '📍 目的地', color: '#8b4513', fontFamily: FONT_HAND },
        { type: 'text', x: 50, y: 135, width: 400, fontSize: 16, text: '写下你去的地方...', color: '#666', fontFamily: FONT_HAND },
        { type: 'text', x: 50, y: 190, width: 300, fontSize: 22, text: '📅 日期', color: '#8b4513', fontFamily: FONT_HAND },
        { type: 'text', x: 50, y: 225, width: 400, fontSize: 16, text: '2026.xx.xx - 2026.xx.xx', color: '#666', fontFamily: FONT_HAND },
        { type: 'sticker', stickerId: 'camera', x: 30, y: 320, scale: 1.8, rotation: -8 },
        { type: 'sticker', stickerId: 'sun', x: 400, y: 280, scale: 1.5, rotation: 5 },
        { type: 'text', x: 50, y: 300, width: 400, fontSize: 22, text: '旅行心情', color: '#4a7c9b', fontFamily: FONT_HAND },
        { type: 'text', x: 50, y: 340, width: 400, fontSize: 16, text: '记录旅途中的点点滴滴...', color: '#666', fontFamily: FONT_HAND },
        { type: 'text', x: 50, y: 400, width: 400, fontSize: 22, text: '美食打卡', color: '#4a7c9b', fontFamily: FONT_HAND },
        { type: 'text', x: 50, y: 440, width: 400, fontSize: 16, text: '🍜 好吃的面馆', color: '#5c4033', fontFamily: FONT_HAND },
        { type: 'text', x: 50, y: 475, width: 400, fontSize: 16, text: '☕ 特色咖啡店', color: '#5c4033', fontFamily: FONT_HAND },
        { type: 'sticker', stickerId: 'pizza', x: 350, y: 420, scale: 1.8, rotation: -5 },
      ]
    },
    {
      id: 'daily',
      name: '日常记录',
      icon: '📝',
      desc: '记录平凡又美好的每一天',
      bgColor: '#faf6ee',
      elements: [
        { type: 'text', x: 50, y: 40, width: 400, fontSize: 32, text: '今日小记', color: '#5c4033', fontFamily: FONT_HAND },
        { type: 'sticker', stickerId: 'sun', x: 400, y: 35, scale: 1.5, rotation: 5 },
        { type: 'text', x: 50, y: 100, width: 400, fontSize: 18, text: '天气：晴  心情：😊', color: '#8b4513', fontFamily: FONT_XIAOWEI },
        { type: 'text', x: 50, y: 150, width: 400, fontSize: 16, text: '今天发生了什么有趣的事呢？', color: '#666', fontFamily: FONT_HAND },
        { type: 'text', x: 50, y: 185, width: 400, fontSize: 16, text: '写下你的一天吧...', color: '#666', fontFamily: FONT_HAND },
        { type: 'sticker', stickerId: 'flower', x: 30, y: 280, scale: 1.3, rotation: -10 },
        { type: 'sticker', stickerId: 'coffee', x: 380, y: 250, scale: 1.5, rotation: 8 },
        { type: 'text', x: 50, y: 350, width: 400, fontSize: 20, text: '今日清单', color: '#8b4513', fontFamily: FONT_HAND },
        { type: 'text', x: 50, y: 390, width: 400, fontSize: 16, text: '☐ 早起运动', color: '#5c4033', fontFamily: FONT_HAND },
        { type: 'text', x: 50, y: 425, width: 400, fontSize: 16, text: '☐ 读半小时书', color: '#5c4033', fontFamily: FONT_HAND },
        { type: 'text', x: 50, y: 460, width: 400, fontSize: 16, text: '☐ 早点睡觉', color: '#5c4033', fontFamily: FONT_HAND },
        { type: 'sticker', stickerId: 'star', x: 420, y: 480, scale: 1.3, rotation: -5 },
      ]
    },
    {
      id: 'blank',
      name: '空白手账',
      icon: '📔',
      desc: '自由发挥你的创意',
      bgColor: '#faf6ee',
      elements: [
        { type: 'text', x: 50, y: 50, width: 400, fontSize: 28, text: '新的一天', color: '#5c4033', fontFamily: FONT_HAND },
      ]
    }
  ],

  getTemplate(id) {
    return this.list.find(t => t.id === id);
  }
};

const Journal = {
  currentYear: 2026,
  currentMonth: 0,
  currentDate: new Date(),
  currentView: 'year',
  isEditing: false,
  selectedElementId: null,
  dragState: null,
  resizeState: null,
  rotateState: null,
  currentStickerCategory: 'cute',
  currentDayData: null,

  init() {
    this.bindEvents();
    const now = new Date();
    this.currentYear = now.getFullYear();
    this.currentMonth = now.getMonth();
    this.currentDate = now;
  },

  bindEvents() {
    const self = this;

    document.querySelectorAll('.journal-view-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const view = tab.dataset.view;
        self.switchView(view);
        document.querySelectorAll('.journal-view-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === view));
      });
    });

    const prevMonthBtn = document.getElementById('prev-month-btn');
    if (prevMonthBtn) prevMonthBtn.addEventListener('click', () => self.prevMonth());

    const nextMonthBtn = document.getElementById('next-month-btn');
    if (nextMonthBtn) nextMonthBtn.addEventListener('click', () => self.nextMonth());

    const prevDayBtn = document.getElementById('prev-day-btn');
    if (prevDayBtn) prevDayBtn.addEventListener('click', () => self.prevDay());

    const nextDayBtn = document.getElementById('next-day-btn');
    if (nextDayBtn) nextDayBtn.addEventListener('click', () => self.nextDay());

    const todayBtn = document.getElementById('journal-today-btn');
    if (todayBtn) todayBtn.addEventListener('click', () => self.goToToday());

    const editToggle = document.getElementById('day-edit-toggle');
    if (editToggle) editToggle.addEventListener('click', () => self.toggleEdit());

    const saveBtn = document.getElementById('day-save-btn');
    if (saveBtn) saveBtn.addEventListener('click', () => self.saveDay());

    document.querySelectorAll('.day-tool-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tool = btn.dataset.tool;
        self.activateTool(tool);
      });
    });

    document.querySelectorAll('.sticker-cat-btn').forEach(cat => {
      cat.addEventListener('click', () => {
        self.currentStickerCategory = cat.dataset.cat;
        document.querySelectorAll('.sticker-cat-btn').forEach(c => {
          c.classList.toggle('active', c.dataset.cat === cat.dataset.cat);
        });
        self.renderStickerPicker();
      });
    });

    const deleteBtn = document.getElementById('delete-element-btn');
    if (deleteBtn) deleteBtn.addEventListener('click', () => {
      if (self.selectedElementId) {
        self.deleteElement(self.selectedElementId);
      }
    });

    const fontSizeInput = document.getElementById('day-font-size');
    const fontColorInput = document.getElementById('day-font-color');
    const fontFamilySelect = document.getElementById('day-font-family');

    if (fontSizeInput) fontSizeInput.addEventListener('input', () => self.updateTextStyle());
    if (fontColorInput) fontColorInput.addEventListener('input', () => self.updateTextStyle());
    if (fontFamilySelect) fontFamilySelect.addEventListener('change', () => self.updateTextStyle());

    document.addEventListener('mousemove', (e) => self.onMouseMove(e));
    document.addEventListener('mouseup', (e) => self.onMouseUp(e));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Delete' && self.selectedElementId && self.isEditing) {
        self.deleteElement(self.selectedElementId);
      }
    });
  },

  switchView(view) {
    this.currentView = view;
    document.querySelectorAll('.journal-subview').forEach(v => v.classList.remove('active'));
    const targetView = document.getElementById('journal-' + view + '-view');
    if (targetView) targetView.classList.add('active');

    document.querySelectorAll('.journal-view-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.view === view);
    });

    if (view === 'year') {
      this.renderYearView();
    } else if (view === 'month') {
      this.renderMonthView();
    } else if (view === 'day') {
      this.renderDayView();
    } else if (view === 'templates') {
      this.renderTemplatesView();
    }
  },

  renderYearView() {
    const calendar = document.getElementById('year-calendar');
    if (!calendar) return;

    let html = '';
    for (let m = 0; m < 12; m++) {
      html += '<div class="year-month-card" onclick="Journal.goToMonth(' + m + ')">';
      html += '<div class="year-month-title">' + MONTHS[m] + '</div>';
      html += '<div class="year-month-mini">';
      html += this.renderMiniMonth(this.currentYear, m);
      html += '</div></div>';
    }
    calendar.innerHTML = html;
  },

  renderMiniMonth(year, month) {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    let html = '<div class="mini-weekdays">';
    const weekDaysShort = ['日', '一', '二', '三', '四', '五', '六'];
    weekDaysShort.forEach(d => {
      html += '<span>' + d + '</span>';
    });
    html += '</div><div class="mini-days">';

    for (let i = 0; i < firstDay; i++) {
      html += '<span class="mini-day empty"></span>';
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = this.formatDateKey(new Date(year, month, d));
      const hasEntry = this.dayHasEntry(dateStr);
      const isToday = this.isSameDay(new Date(year, month, d), new Date());
      let cls = 'mini-day';
      if (hasEntry) cls += ' has-entry';
      if (isToday) cls += ' today';
      html += '<span class="' + cls + '">' + d + '</span>';
    }

    html += '</div>';
    return html;
  },

  goToMonth(month) {
    this.currentMonth = month;
    this.switchView('month');
  },

  renderMonthView() {
    const title = document.getElementById('month-title');
    if (title) title.textContent = this.currentYear + '年' + (this.currentMonth + 1) + '月';

    const calendar = document.getElementById('month-calendar');
    if (!calendar) return;

    const firstDay = new Date(this.currentYear, this.currentMonth, 1).getDay();
    const daysInMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();

    let html = '<div class="month-weekdays">';
    WEEKDAYS.forEach(d => {
      html += '<div class="month-weekday">' + d + '</div>';
    });
    html += '</div><div class="month-days">';

    const prevMonthDays = new Date(this.currentYear, this.currentMonth, 0).getDate();
    for (let i = firstDay - 1; i >= 0; i--) {
      html += '<div class="month-day other-month">' + (prevMonthDays - i) + '</div>';
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(this.currentYear, this.currentMonth, d);
      const dateStr = this.formatDateKey(date);
      const hasEntry = this.dayHasEntry(dateStr);
      const isToday = this.isSameDay(date, new Date());
      const preview = this.getDayPreview(dateStr);

      let cls = 'month-day';
      if (isToday) cls += ' today';
      if (hasEntry) cls += ' has-entry';

      html += '<div class="' + cls + '" onclick="Journal.goToDate(' + this.currentYear + ',' + this.currentMonth + ',' + d + ')">';
      html += '<div class="month-day-num">' + d + '</div>';
      if (preview) {
        html += '<div class="month-day-preview">' + preview + '</div>';
      }
      html += '</div>';
    }

    const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
    const remaining = totalCells - firstDay - daysInMonth;
    for (let i = 1; i <= remaining; i++) {
      html += '<div class="month-day other-month">' + i + '</div>';
    }

    html += '</div>';
    calendar.innerHTML = html;
  },

  prevMonth() {
    this.currentMonth--;
    if (this.currentMonth < 0) {
      this.currentMonth = 11;
      this.currentYear--;
    }
    this.renderMonthView();
  },

  nextMonth() {
    this.currentMonth++;
    if (this.currentMonth > 11) {
      this.currentMonth = 0;
      this.currentYear++;
    }
    this.renderMonthView();
  },

  goToDate(year, month, day) {
    this.currentDate = new Date(year, month, day);
    this.currentYear = year;
    this.currentMonth = month;
    this.switchView('day');
  },

  goToToday() {
    const now = new Date();
    this.currentDate = now;
    this.currentYear = now.getFullYear();
    this.currentMonth = now.getMonth();
    this.switchView('day');
  },

  renderDayView() {
    const date = this.currentDate;
    const dateEl = document.getElementById('day-date');
    const weekdayEl = document.getElementById('day-weekday');

    if (dateEl) dateEl.textContent = (date.getMonth() + 1) + '月' + date.getDate() + '日';
    if (weekdayEl) weekdayEl.textContent = WEEKDAYS[date.getDay()];

    this.loadDayData();
    this.renderStickerPicker();
    this.renderDayCanvas();
  },

  prevDay() {
    const d = new Date(this.currentDate);
    d.setDate(d.getDate() - 1);
    this.currentDate = d;
    this.currentYear = d.getFullYear();
    this.currentMonth = d.getMonth();
    this.renderDayView();
  },

  nextDay() {
    const d = new Date(this.currentDate);
    d.setDate(d.getDate() + 1);
    this.currentDate = d;
    this.currentYear = d.getFullYear();
    this.currentMonth = d.getMonth();
    this.renderDayView();
  },

  formatDateKey(date) {
    return date.getFullYear() + '-' +
      String(date.getMonth() + 1).padStart(2, '0') + '-' +
      String(date.getDate()).padStart(2, '0');
  },

  isSameDay(d1, d2) {
    return d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate();
  },

  dayHasEntry(dateStr) {
    const data = STORAGE.loadJournalDay(dateStr);
    return data && data.elements && data.elements.length > 0;
  },

  getDayPreview(dateStr) {
    const data = STORAGE.loadJournalDay(dateStr);
    if (!data || !data.elements || data.elements.length === 0) return '';
    const textElements = data.elements.filter(e => e.type === 'text');
    if (textElements.length > 0) {
      return textElements[0].text.substring(0, 15);
    }
    return '📝 有记录';
  },

  loadDayData() {
    const dateStr = this.formatDateKey(this.currentDate);
    let data = STORAGE.loadJournalDay(dateStr);
    if (!data) {
      data = {
        date: dateStr,
        bgColor: '#faf6ee',
        elements: []
      };
    }
    this.currentDayData = data;
  },

  saveDay() {
    if (!this.currentDayData) return;

    const dateStr = this.formatDateKey(this.currentDate);
    this.currentDayData.date = dateStr;
    STORAGE.saveJournalDay(this.currentDayData);

    this.isEditing = false;
    this.updateEditUI();
    this.renderDayCanvas();

    alert('保存成功！');
  },

  renderStickerPicker() {
    const picker = document.getElementById('sticker-picker');
    if (!picker) return;

    const stickers = JournalStickers.categories[this.currentStickerCategory] || [];
    let html = '';
    stickers.forEach(s => {
      html += '<div class="sticker-picker-item" data-sticker-id="' + s.id + '" title="' + s.name + '">';
      html += s.emoji;
      html += '</div>';
    });
    picker.innerHTML = html;

    const self = this;
    picker.querySelectorAll('.sticker-picker-item').forEach(item => {
      item.addEventListener('click', () => {
        const stickerId = item.dataset.stickerId;
        self.addSticker(stickerId);
      });
    });
  },

  renderTemplatesView() {
    const grid = document.getElementById('templates-grid');
    if (!grid) return;

    let html = '';
    JournalTemplates.list.forEach(t => {
      html += '<div class="template-card" onclick="Journal.applyTemplate(\'' + t.id + '\')">';
      html += '<div class="template-card-icon">' + t.icon + '</div>';
      html += '<div class="template-card-name">' + t.name + '</div>';
      html += '<div class="template-card-desc">' + t.desc + '</div>';
      html += '</div>';
    });
    grid.innerHTML = html;
  },

  applyTemplate(templateId) {
    const template = JournalTemplates.getTemplate(templateId);
    if (!template) return;

    if (this.currentDayData && this.currentDayData.elements && this.currentDayData.elements.length > 0) {
      if (!confirm('应用模板会替换当前内容，确定吗？')) return;
    }

    const elements = JSON.parse(JSON.stringify(template.elements)).map((el, idx) => {
      return { ...el, id: 'el-' + Date.now() + '-' + idx };
    });

    this.currentDayData = {
      ...this.currentDayData,
      bgColor: template.bgColor,
      elements: elements
    };

    this.switchView('day');
    this.renderDayCanvas();
  },

  renderDayCanvas() {
    const paper = document.getElementById('day-canvas-paper');
    if (!paper || !this.currentDayData) return;

    if (this.currentDayData.bgColor) {
      paper.style.background = this.currentDayData.bgColor;
    } else {
      paper.style.background = '#faf6ee';
    }

    paper.innerHTML = '';
    const elements = this.currentDayData.elements || [];
    elements.forEach(el => {
      const domEl = this.createElementDOM(el);
      paper.appendChild(domEl);
    });

    this.selectedElementId = null;
    this.hideTextStylePanel();
  },

  createElementDOM(elem) {
    const el = document.createElement('div');
    el.className = 'journal-element';
    el.dataset.id = elem.id;
    el.style.left = elem.x + 'px';
    el.style.top = elem.y + 'px';

    if (elem.rotation) {
      el.style.transform = 'rotate(' + elem.rotation + 'deg)';
    }

    if (elem.id === this.selectedElementId) {
      el.classList.add('selected');
    }

    if (elem.type === 'sticker') {
      const sticker = JournalStickers.getStickerById(elem.stickerId);
      el.classList.add('journal-sticker');
      if (sticker) {
        el.textContent = sticker.emoji;
        const scale = elem.scale || 1;
        el.style.fontSize = (48 * scale) + 'px';
      }
    } else if (elem.type === 'text') {
      el.classList.add('journal-text');
      el.textContent = elem.text || '点击编辑文字';
      if (elem.fontSize) el.style.fontSize = elem.fontSize + 'px';
      if (elem.color) el.style.color = elem.color;
      if (elem.fontFamily) el.style.fontFamily = elem.fontFamily;
      if (elem.width) el.style.width = elem.width + 'px';

      if (this.isEditing) {
        el.contentEditable = 'true';
        const self = this;
        el.addEventListener('input', () => {
          elem.text = el.textContent;
        });
        el.addEventListener('focus', () => {
          self.selectElement(elem.id);
          self.showTextStylePanel(elem);
        });
      }
    } else if (elem.type === 'image') {
      el.classList.add('journal-image');
      const img = document.createElement('img');
      img.src = elem.src;
      img.style.width = (elem.width || 200) + 'px';
      img.style.display = 'block';
      el.appendChild(img);
    }

    if (this.isEditing) {
      const deleteBtn = document.createElement('div');
      deleteBtn.className = 'element-delete-btn';
      deleteBtn.textContent = '×';
      const self = this;
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        self.deleteElement(elem.id);
      });
      el.appendChild(deleteBtn);

      const resizeHandle = document.createElement('div');
      resizeHandle.className = 'element-resize-handle';
      el.appendChild(resizeHandle);

      const rotateHandle = document.createElement('div');
      rotateHandle.className = 'element-rotate-handle';
      rotateHandle.textContent = '↻';
      el.appendChild(rotateHandle);

      el.addEventListener('mousedown', (e) => this.onElementMouseDown(e, elem.id));
    }

    return el;
  },

  onElementMouseDown(e, elemId) {
    if (!this.isEditing) return;

    if (e.target.classList.contains('element-resize-handle')) {
      this.startResize(e, elemId);
      return;
    }
    if (e.target.classList.contains('element-rotate-handle')) {
      this.startRotate(e, elemId);
      return;
    }
    if (e.target.getAttribute('contenteditable') === 'true') {
      this.selectElement(elemId);
      return;
    }

    this.selectElement(elemId);

    const elem = this.findElement(elemId);
    if (!elem) return;

    this.dragState = {
      elemId: elemId,
      startX: e.clientX,
      startY: e.clientY,
      origX: elem.x,
      origY: elem.y
    };

    e.preventDefault();
  },

  startResize(e, elemId) {
    const elem = this.findElement(elemId);
    if (!elem) return;

    this.selectElement(elemId);
    this.resizeState = {
      elemId: elemId,
      startX: e.clientX,
      startY: e.clientY,
      origScale: elem.scale || 1,
      origWidth: elem.width || 200
    };
    e.preventDefault();
    e.stopPropagation();
  },

  startRotate(e, elemId) {
    const elem = this.findElement(elemId);
    if (!elem) return;

    this.selectElement(elemId);

    const el = document.querySelector('.journal-element[data-id="' + elemId + '"]');
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    this.rotateState = {
      elemId: elemId,
      centerX: centerX,
      centerY: centerY,
      startAngle: Math.atan2(e.clientY - centerY, e.clientX - centerX) * 180 / Math.PI,
      origRotation: elem.rotation || 0
    };
    e.preventDefault();
    e.stopPropagation();
  },

  onMouseMove(e) {
    if (this.dragState) {
      const dx = e.clientX - this.dragState.startX;
      const dy = e.clientY - this.dragState.startY;
      const elem = this.findElement(this.dragState.elemId);
      if (elem) {
        elem.x = this.dragState.origX + dx;
        elem.y = this.dragState.origY + dy;
        const el = document.querySelector('.journal-element[data-id="' + this.dragState.elemId + '"]');
        if (el) {
          el.style.left = elem.x + 'px';
          el.style.top = elem.y + 'px';
        }
      }
    }

    if (this.resizeState) {
      const dx = e.clientX - this.resizeState.startX;
      const elem = this.findElement(this.resizeState.elemId);
      if (elem) {
        const newScale = Math.max(0.3, this.resizeState.origScale + dx / 100);
        elem.scale = newScale;
        const el = document.querySelector('.journal-element[data-id="' + this.resizeState.elemId + '"]');
        if (el && elem.type === 'sticker') {
          el.style.fontSize = (48 * newScale) + 'px';
        }
        if (el && elem.type === 'image') {
          const img = el.querySelector('img');
          if (img) img.style.width = (this.resizeState.origWidth * newScale) + 'px';
        }
      }
    }

    if (this.rotateState) {
      const currentAngle = Math.atan2(
        e.clientY - this.rotateState.centerY,
        e.clientX - this.rotateState.centerX
      ) * 180 / Math.PI;
      const delta = currentAngle - this.rotateState.startAngle;
      const elem = this.findElement(this.rotateState.elemId);
      if (elem) {
        elem.rotation = this.rotateState.origRotation + delta;
        const el = document.querySelector('.journal-element[data-id="' + this.rotateState.elemId + '"]');
        if (el) {
          el.style.transform = 'rotate(' + elem.rotation + 'deg)';
        }
      }
    }
  },

  onMouseUp() {
    this.dragState = null;
    this.resizeState = null;
    this.rotateState = null;
  },

  selectElement(elemId) {
    this.selectedElementId = elemId;
    document.querySelectorAll('.journal-element').forEach(el => {
      el.classList.toggle('selected', el.dataset.id === elemId);
    });

    const elem = this.findElement(elemId);
    if (elem && elem.type === 'text') {
      this.showTextStylePanel(elem);
    } else {
      this.hideTextStylePanel();
    }
  },

  showTextStylePanel(elem) {
    const panel = document.getElementById('text-style-section');
    if (!panel) return;
    panel.style.display = 'block';

    const fontSizeInput = document.getElementById('day-font-size');
    const fontColorInput = document.getElementById('day-font-color');
    const fontFamilySelect = document.getElementById('day-font-family');

    if (fontSizeInput) fontSizeInput.value = elem.fontSize || 16;
    if (fontColorInput) fontColorInput.value = elem.color || '#5c4033';
    if (fontFamilySelect) fontFamilySelect.value = elem.fontFamily || FONT_HAND;
  },

  hideTextStylePanel() {
    const panel = document.getElementById('text-style-section');
    if (panel) panel.style.display = 'none';
  },

  updateTextStyle() {
    if (!this.selectedElementId) return;
    const elem = this.findElement(this.selectedElementId);
    if (!elem || elem.type !== 'text') return;

    const fontSizeInput = document.getElementById('day-font-size');
    const fontColorInput = document.getElementById('day-font-color');
    const fontFamilySelect = document.getElementById('day-font-family');

    if (fontSizeInput) elem.fontSize = parseInt(fontSizeInput.value);
    if (fontColorInput) elem.color = fontColorInput.value;
    if (fontFamilySelect) elem.fontFamily = fontFamilySelect.value;

    const el = document.querySelector('.journal-element[data-id="' + this.selectedElementId + '"]');
    if (el) {
      if (elem.fontSize) el.style.fontSize = elem.fontSize + 'px';
      if (elem.color) el.style.color = elem.color;
      if (elem.fontFamily) el.style.fontFamily = elem.fontFamily;
    }
  },

  findElement(elemId) {
    if (!this.currentDayData || !this.currentDayData.elements) return null;
    return this.currentDayData.elements.find(el => el.id === elemId);
  },

  deleteElement(elemId) {
    if (!this.currentDayData || !this.currentDayData.elements) return;

    const idx = this.currentDayData.elements.findIndex(el => el.id === elemId);
    if (idx >= 0) {
      this.currentDayData.elements.splice(idx, 1);
    }

    this.selectedElementId = null;
    this.renderDayCanvas();
  },

  addSticker(stickerId) {
    if (!this.isEditing) {
      alert('请先点击「编辑模式」按钮');
      return;
    }

    const sticker = JournalStickers.getStickerById(stickerId);
    if (!sticker) return;

    const elem = {
      id: 'el-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      type: 'sticker',
      stickerId: stickerId,
      x: 100 + Math.random() * 100,
      y: 100 + Math.random() * 100,
      rotation: (Math.random() - 0.5) * 20,
      scale: 1
    };

    if (!this.currentDayData.elements) {
      this.currentDayData.elements = [];
    }
    this.currentDayData.elements.push(elem);
    this.renderDayCanvas();
    this.selectElement(elem.id);
  },

  addText() {
    if (!this.isEditing) {
      alert('请先点击「编辑模式」按钮');
      return;
    }

    const elem = {
      id: 'el-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      type: 'text',
      text: '点击编辑文字',
      x: 100 + Math.random() * 50,
      y: 100 + Math.random() * 100,
      fontSize: 16,
      color: '#5c4033',
      fontFamily: FONT_HAND,
      rotation: 0,
      width: 200
    };

    if (!this.currentDayData.elements) {
      this.currentDayData.elements = [];
    }
    this.currentDayData.elements.push(elem);
    this.renderDayCanvas();
    this.selectElement(elem.id);
  },

  activateTool(tool) {
    if (tool === 'text') {
      this.addText();
      this.hideAllToolPanels();
    } else if (tool === 'sticker') {
      this.togglePanel('sticker-section');
    } else if (tool === 'template') {
      this.switchView('templates');
    } else if (tool === 'image') {
      alert('图片上传功能开发中...');
    }
  },

  hideAllToolPanels() {
    document.getElementById('sticker-section').style.display = 'none';
    this.hideTextStylePanel();
  },

  togglePanel(panelId) {
    const panel = document.getElementById(panelId);
    if (!panel) return;
    const isHidden = panel.style.display === 'none';
    this.hideAllToolPanels();
    if (isHidden) panel.style.display = 'block';
  },

  toggleEdit() {
    this.isEditing = !this.isEditing;
    this.updateEditUI();
    this.renderDayCanvas();
  },

  updateEditUI() {
    const toggleBtn = document.getElementById('day-edit-toggle');
    if (toggleBtn) {
      toggleBtn.textContent = this.isEditing ? '👁 预览模式' : '✎ 编辑模式';
      toggleBtn.classList.toggle('active', this.isEditing);
    }

    const paper = document.getElementById('day-canvas-paper');
    if (paper) {
      paper.classList.toggle('editing', this.isEditing);
    }
  },

  openTemplateModal() {
    const modal = document.getElementById('journal-template-modal');
    const grid = document.getElementById('template-modal-grid');
    if (!modal || !grid) return;

    let html = '';
    JournalTemplates.list.forEach(t => {
      html += '<div class="template-card" onclick="Journal.createFromTemplate(\'' + t.id + '\')">';
      html += '<div class="template-card-icon">' + t.icon + '</div>';
      html += '<div class="template-card-name">' + t.name + '</div>';
      html += '<div class="template-card-desc">' + t.desc + '</div>';
      html += '</div>';
    });
    grid.innerHTML = html;

    modal.classList.add('active');
  },

  closeTemplateModal() {
    const modal = document.getElementById('journal-template-modal');
    if (modal) modal.classList.remove('active');
  },

  createFromTemplate(templateId) {
    this.applyTemplate(templateId);
    this.closeTemplateModal();
  },

  renderList() {
    this.switchView('year');
  },

  openJournal(id) {
    this.switchView('day');
  },

  close() {
    this.currentDayData = null;
    this.selectedElementId = null;
    this.isEditing = false;
  }
};
