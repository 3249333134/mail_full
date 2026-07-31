/* ========================================
   世界地图邮递系统 - 核心逻辑
   ======================================== */

const MapSystem = {
  // 邮递方式配置
  deliveryMethods: {
    walk: {
      id: 'walk',
      name: '步行投递',
      icon: '🚶',
      speed: 5,
      description: '最朴素的方式，慢但有温度',
      color: '#8b7355'
    },
    bike: {
      id: 'bike',
      name: '自行车邮差',
      icon: '🚲',
      speed: 15,
      description: '小镇之间的日常邮递',
      color: '#6b8e6b'
    },
    horse: {
      id: 'horse',
      name: '驿马快信',
      icon: '🐎',
      speed: 40,
      description: '复古驿站体系，日夜兼程',
      color: '#a0522d'
    },
    train: {
      id: 'train',
      name: '蒸汽火车',
      icon: '🚂',
      speed: 80,
      description: '工业时代感，跨城送达',
      color: '#696969'
    },
    plane: {
      id: 'plane',
      name: '航空邮件',
      icon: '✈️',
      speed: 500,
      description: '最快但缺少等待的浪漫',
      color: '#4682b4'
    },
    pigeon: {
      id: 'pigeon',
      name: '信鸽传书',
      icon: '🕊️',
      speed: 60,
      description: '诗意方式，只送简短信件',
      color: '#b8b8b8'
    }
  },

  // 地图状态
  state: {
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    isDragging: false,
    dragStartX: 0,
    dragStartY: 0,
    dragStartOffsetX: 0,
    dragStartOffsetY: 0
  },

  // 简易世界地图大陆轮廓（简化版，用于手绘风格）
  continents: [
    {
      name: '欧亚大陆',
      points: [
        [-10, 36], [0, 40], [10, 35], [20, 36], [30, 32], [40, 30], [50, 28], [60, 30],
        [70, 35], [80, 38], [90, 40], [100, 42], [110, 40], [120, 38], [130, 35], [140, 38],
        [150, 45], [160, 55], [170, 60], [180, 65], [-170, 68], [-160, 65], [-150, 60],
        [-140, 55], [-130, 52], [-120, 50], [-110, 48], [-100, 45], [-90, 42], [-80, 40],
        [-70, 42], [-60, 45], [-50, 48], [-40, 45], [-30, 42], [-20, 40], [-10, 36]
      ]
    },
    {
      name: '非洲',
      points: [
        [-15, 35], [-5, 32], [5, 30], [10, 25], [15, 20], [20, 15], [25, 10], [30, 5],
        [35, 0], [40, -5], [45, -10], [50, -15], [48, -20], [45, -25], [40, -30], [35, -32],
        [30, -30], [25, -28], [20, -25], [18, -20], [15, -15], [12, -10], [10, -5],
        [8, 0], [5, 5], [0, 10], [-5, 15], [-10, 20], [-15, 25], [-18, 30], [-15, 35]
      ]
    },
    {
      name: '北美洲',
      points: [
        [-168, 66], [-160, 70], [-150, 72], [-140, 70], [-130, 68], [-125, 65], [-120, 60],
        [-115, 55], [-110, 50], [-105, 45], [-100, 40], [-95, 35], [-90, 30], [-85, 28],
        [-80, 25], [-75, 28], [-70, 30], [-65, 28], [-60, 25], [-55, 20], [-60, 15],
        [-70, 12], [-80, 15], [-90, 18], [-100, 20], [-110, 22], [-120, 25], [-130, 28],
        [-140, 32], [-150, 40], [-155, 48], [-160, 55], [-165, 60], [-168, 66]
      ]
    },
    {
      name: '南美洲',
      points: [
        [-80, 12], [-75, 10], [-70, 8], [-65, 5], [-60, 2], [-55, 0], [-52, -5], [-50, -10],
        [-48, -15], [-50, -20], [-55, -25], [-60, -30], [-65, -35], [-70, -40], [-72, -45],
        [-75, -50], [-72, -55], [-68, -52], [-65, -48], [-62, -42], [-60, -35], [-58, -30],
        [-55, -25], [-52, -20], [-50, -15], [-48, -10], [-50, -5], [-55, 0], [-60, 3],
        [-65, 5], [-70, 8], [-75, 10], [-80, 12]
      ]
    },
    {
      name: '澳洲',
      points: [
        [113, -22], [118, -20], [125, -18], [132, -20], [138, -25], [142, -30], [145, -35],
        [148, -38], [146, -40], [142, -42], [138, -40], [132, -38], [125, -35],
        [118, -33], [115, -30], [113, -27], [113, -22]
      ]
    }
  ],

  // Haversine公式计算两点间球面距离（km）
  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = this._toRad(lat2 - lat1);
    const dLng = this._toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this._toRad(lat1)) * Math.cos(this._toRad(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  },

  _toRad(deg) {
    return deg * (Math.PI / 180);
  },

  // 计算邮递时间（小时）
  calculateDeliveryTime(distance, methodId) {
    const method = this.deliveryMethods[methodId];
    if (!method) return 0;

    let hours = distance / method.speed;
    const dailyHours = 12;
    const days = Math.floor(hours / dailyHours);
    const remainingHours = Math.round(hours % dailyHours);
    const totalHours = days * 24 + remainingHours;

    const fluctuation = 0.9 + Math.random() * 0.2;
    return Math.round(totalHours * fluctuation);
  },

  // 格式化时间显示
  formatDeliveryTime(hours) {
    if (hours < 24) {
      return `${hours} 小时后送达`;
    }
    const days = Math.floor(hours / 24);
    const remainHours = hours % 24;
    if (days < 7) {
      return `${days} 天 ${remainHours} 小时`;
    }
    const weeks = Math.floor(days / 7);
    const remainDays = days % 7;
    if (remainDays === 0) {
      return `约 ${weeks} 周`;
    }
    return `约 ${weeks} 周 ${remainDays} 天`;
  },

  // 经纬度转SVG坐标（墨卡托投影简化版）
  latLngToXY(lat, lng, width, height) {
    const x = ((lng + 180) / 360) * width;
    const latRad = lat * Math.PI / 180;
    const mercatorN = Math.log(Math.tan((Math.PI / 4) + (latRad / 2)));
    const y = (height / 2) - (width * mercatorN / (2 * Math.PI));
    return { x, y };
  },

  // 生成贝塞尔曲线路径
  generateCurvePath(x1, y1, x2, y2, offset = 50) {
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist === 0) return `M ${x1} ${y1} L ${x2} ${y2}`;
    const perpX = -dy / dist * offset;
    const perpY = dx / dist * offset;
    const cpX = midX + perpX;
    const cpY = midY + perpY;
    return `M ${x1} ${y1} Q ${cpX} ${cpY} ${x2} ${y2}`;
  },

  // 计算曲线上某点的位置（进度 0~1）
  getPointOnCurve(x1, y1, x2, y2, progress, offset = 50) {
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist === 0) return { x: x1, y: y1 };
    const perpX = -dy / dist * offset;
    const perpY = dx / dist * offset;
    const cpX = midX + perpX;
    const cpY = midY + perpY;

    const t = progress;
    const x = (1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * cpX + t * t * x2;
    const y = (1 - t) * (1 - t) * y1 + 2 * (1 - t) * t * cpY + t * t * y2;
    return { x, y };
  },

  // 生成SVG大陆路径
  generateContinentPath(continent, width, height) {
    const points = continent.points.map(([lng, lat]) => {
      const { x, y } = this.latLngToXY(lat, lng, width, height);
      return `${x.toFixed(1)} ${y.toFixed(1)}`;
    });
    return `M ${points.join(' L ')} Z`;
  },

  // 生成山脉等高线路径
  generateMountainPaths(width, height) {
    const ranges = [
      { lat: 45, lng: 5, count: 5, spread: 8 },
      { lat: 47, lng: 10, count: 4, spread: 6 },
      { lat: 28, lng: 85, count: 6, spread: 10 },
      { lat: 40, lng: -110, count: 5, spread: 8 },
      { lat: -30, lng: -70, count: 4, spread: 6 }
    ];

    let paths = [];
    ranges.forEach(range => {
      for (let i = 0; i < range.count; i++) {
        const offset = (i - range.count / 2) * range.spread;
        const lat = range.lat + offset * 0.3;
        const lng = range.lng + offset;
        const { x, y } = this.latLngToXY(lat, lng, width, height);
        const size = (1 - Math.abs(i - range.count / 2) / range.count) * 20;
        paths.push(`M ${x - size} ${y} Q ${x} ${y - size * 0.6} ${x + size} ${y}`);
      }
    });
    return paths.join(' ');
  },

  // 生成沙漠点阵
  generateDesertDots(width, height) {
    const deserts = [
      { lat: 25, lng: 0, count: 30 },
      { lat: 35, lng: -115, count: 20 },
      { lat: -25, lng: 130, count: 25 }
    ];

    let dots = [];
    deserts.forEach(desert => {
      for (let i = 0; i < desert.count; i++) {
        const lat = desert.lat + (Math.random() - 0.5) * 10;
        const lng = desert.lng + (Math.random() - 0.5) * 15;
        const { x, y } = this.latLngToXY(lat, lng, width, height);
        dots.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="1.5" class="map-desert-dots"/>`);
      }
    });
    return dots.join('');
  }
};
