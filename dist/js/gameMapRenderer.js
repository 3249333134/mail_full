import { TILE, MAP_W, MAP_H, PLAYER_SPEED, TILE_TYPE, TILE_SOLID } from '../sendbox/src/gameConfig.js';
import { PixelArt } from '../sendbox/src/pixelArt.js';
import { MapManager, PRESET_MAPS } from '../sendbox/src/mapManager.js';
import { AssetManager } from '../sendbox/src/assetManager.js?v=20260804r';
import { ASSET_CATEGORIES } from '../sendbox/src/assetManifest.js';

// ===== 模块化数据接入（替换点A：优先用 CharacterSystem / MapSystem，缺失再兜底）=====
import { CharacterSystem } from './game/character/CharacterSystem.js';
import { MapSystem } from './game/map/MapSystem.js';
import { RemoteResourceLoader } from './game/remote/RemoteResourceLoader.js';

const ASSET_BASE = './sendbox/src/assets/';
const XIEJIAN_CHARACTER_ROOT = '../../fill/jingyuan-chibi20-delivery-20260719';

// 避免重复前缀：部分资源路径（如道具 icon）已含 "sendbox/src/assets/" 前缀，
// 再拼接 ASSET_BASE 会导致 "./sendbox/src/assets/sendbox/src/assets/..." 双重前缀 404。
// 此处统一去重：若 relativePath 已含 ASSET_BASE 去掉 "./" 后的前缀，则只拼接一次。
const ASSET_BASE_CLEAN = ASSET_BASE.replace(/^\.\//, '');
AssetManager.getAssetUrl = (relativePath) => {
  if (typeof relativePath === 'string' && relativePath.startsWith(ASSET_BASE_CLEAN)) {
    return ASSET_BASE + relativePath.slice(ASSET_BASE_CLEAN.length);
  }
  return ASSET_BASE + relativePath;
};
AssetManager.getAssetUrls = (relativePath) => RemoteResourceLoader.resolveAssetCandidates(relativePath, ASSET_BASE);

const _JINGYUAN_CHARACTERS_FALLBACK = [
  { id: 'zhou-ran', name: '周然', dir: '01-周然', sect: '道华观' },
  { id: 'he-qingfeng', name: '贺清风', dir: '02-贺清风', sect: '天行教' },
  { id: 'ren-chaoye', name: '任朝野', dir: '03-任朝野', sect: '天行教' },
  { id: 'shen-chiyi', name: '沈池懿', dir: '04-沈池懿', sect: '静远书院' },
  { id: 'qi-pingchuan', name: '戚凭川', dir: '05-戚凭川', sect: '桃止门' },
  { id: 'jiang-huaian', name: '江淮安', dir: '06-江淮安', sect: '丹溪谷' },
  { id: 'tang-wanchu', name: '唐挽初', dir: '07-唐挽初', sect: '不还门' },
];

const _MAIN_CHARACTERS_FALLBACK = [
  { id: 'mask-dude', name: 'Mask Dude', group: 'Mask Dude' },
  { id: 'ninja-frog', name: '忍者蛙', group: 'Ninja Frog' },
  { id: 'pink-man', name: '粉衣人', group: 'Pink Man' },
  { id: 'virtual-guy', name: '虚拟人', group: 'Virtual Guy' },
];

const _HANMEN_CHARACTERS_FALLBACK = [
  { id: 'xuan-xuan', name: '萱宣', dir: 'xiujing-xuanxuan/xuanxuan', sect: '寒门', gender: 'female' },
  { id: 'xiu-jing', name: '修璟', dir: 'xiujing-xuanxuan/xiujing', sect: '寒门', gender: 'male' },
];

/** 以 CharacterSystem 优先，若尚未 bootstrap 则用 fallback 兜底（保证不破坏启动）*/
function _getJINGYUAN() {
  const sysList = (CharacterSystem._bootstrapped && CharacterSystem.getCharacterListForCategory('jingyuan')) || [];
  return sysList.length ? sysList : _JINGYUAN_CHARACTERS_FALLBACK;
}
function _getHANMEN() {
  const sysList = (CharacterSystem._bootstrapped && CharacterSystem.getCharacterListForCategory('hanmen')) || [];
  return sysList.length ? sysList : _HANMEN_CHARACTERS_FALLBACK;
}
function _getMAIN() {
  const sysList = (CharacterSystem._bootstrapped && CharacterSystem.getCharacterListForCategory('main')) || [];
  return sysList.length ? sysList : _MAIN_CHARACTERS_FALLBACK;
}

const JINGYUAN_CHARACTERS_PROXY = new Proxy([], {
  get(_, p) {
    const arr = _getJINGYUAN();
    if (p === 'length') return arr.length;
    if (p === Symbol.iterator) return arr[Symbol.iterator].bind(arr);
    return arr[p];
  },
  has(_, p) { return p in _getJINGYUAN(); },
});
const HANMEN_CHARACTERS_PROXY = new Proxy([], {
  get(_, p) {
    const arr = _getHANMEN();
    if (p === 'length') return arr.length;
    if (p === Symbol.iterator) return arr[Symbol.iterator].bind(arr);
    return arr[p];
  },
  has(_, p) { return p in _getHANMEN(); },
});
const MAIN_CHARACTERS_PROXY = new Proxy([], {
  get(_, p) {
    const arr = _getMAIN();
    if (p === 'length') return arr.length;
    if (p === Symbol.iterator) return arr[Symbol.iterator].bind(arr);
    return arr[p];
  },
  has(_, p) { return p in _getMAIN(); },
});

// 兼容老代码：JINGYUAN_CHARACTERS / HANMEN_CHARACTERS / MAIN_CHARACTERS 这些变量名要照旧存在
const JINGYUAN_CHARACTERS = JINGYUAN_CHARACTERS_PROXY;
const HANMEN_CHARACTERS = HANMEN_CHARACTERS_PROXY;
const MAIN_CHARACTERS = MAIN_CHARACTERS_PROXY;

const _POXIAO_CHARACTERS_FALLBACK = [
  { id: 'px-tangqi', name: '唐岐', dir: 'tang_qi', sect: '缉毒警', portraitPath: 'poxiao/characters/portraits/07_tang_qi.png', martial: 7, defaultItems: ['handcuffs', 'evidence_syringe'], actions: ['personality', 'run', 'etiquette', 'martial', 'signature'] },
  { id: 'px-lipingchuan', name: '李平川', dir: 'li_pingchuan', sect: '奶茶店老板', portraitPath: 'poxiao/characters/portraits/05_li_pingchuan.png', martial: 5, defaultItems: ['red_scarf', 'star_flower'], actions: ['personality', 'run', 'etiquette', 'martial', 'signature'] },
  { id: 'px-jiangyan', name: '江宴', dir: 'jiang_yan', sect: '法医', portraitPath: 'poxiao/characters/portraits/03_jiang_yan.png', martial: 3, defaultItems: ['olive_sapling', 'casablanca_lilies'], actions: ['personality', 'run', 'etiquette', 'martial', 'signature'] },
  { id: 'px-xinghe', name: '沈星何', dir: 'shen_xinghe', sect: '情报科', portraitPath: 'poxiao/characters/portraits/06_shen_xinghe.png', martial: 4, defaultItems: ['half_jade_pendant', 'goldfish_bowl'], actions: ['personality', 'run', 'etiquette', 'martial', 'signature'] },
  { id: 'px-heyinsheng', name: '贺引生', dir: 'he_yinsheng', sect: '缉毒警', portraitPath: 'poxiao/characters/portraits/02_he_yinsheng.png', martial: 6, defaultItems: ['super_s_necklace', 'protection_talisman', 'crystal_pendant'], actions: ['personality', 'run', 'etiquette', 'martial', 'signature'] },
  { id: 'px-chenzhou', name: '陈昼', dir: 'chen_zhou', sect: '卧底', portraitPath: 'poxiao/characters/portraits/04_chen_zhou.png', martial: 8, defaultItems: ['rainflower_stone', 'divination_pendant'], actions: ['personality', 'run', 'etiquette', 'martial', 'signature'] },
  { id: 'px-zhouran', name: '周然', dir: 'zhou_ran', sect: '画家', portraitPath: 'poxiao/characters/portraits/01_zhou_ran.png', martial: 5, defaultItems: ['painter_apron', 'divorce_agreement', 'legless_bird_board'], actions: ['personality', 'run', 'etiquette', 'martial', 'signature'] },
];
function _getPOXIAO() {
  try {
    if (typeof CharacterSystem !== 'undefined' && CharacterSystem.getCharacterListForCategory) {
      return CharacterSystem.getCharacterListForCategory('poxiao');
    }
  } catch (_) {}
  return _POXIAO_CHARACTERS_FALLBACK;
}
const POXIAO_CHARACTERS_PROXY = new Proxy(_POXIAO_CHARACTERS_FALLBACK, {
  get(target, prop, receiver) {
    const list = _getPOXIAO();
    if (prop === 'length') return list.length;
    if (typeof prop === 'string' && /^\d+$/.test(prop)) return list[Number(prop)];
    const value = list[prop];
    return typeof value === 'function' ? value.bind(list) : value;
  }
});
const POXIAO_CHARACTERS = POXIAO_CHARACTERS_PROXY;

const CHARACTER_CATEGORIES = [
  { key: 'jingyuan', name: '静远七人', icon: '🎭' },
  { key: 'hanmen', name: '寒门', icon: '🏮' },
  { key: 'main', name: '主角', icon: '🦸' },
  { key: 'poxiao', name: '破晓', icon: '🌅' },
];

export class GameMapRenderer {
  constructor(container) {
    this.container = container;
    this.canvas = null;
    this.ctx = null;
    this.mapManager = new MapManager();
    this.player = {
      x: 0, y: 0,
      direction: 'down',
      frame: 0,
      frameTimer: 0,
      moving: false,
      path: [],
      pathIndex: 0,
      action: 'personality',
      actionTimer: 0,
      actionPlaying: false,
      actionOnce: false,
    };
    // 单人模式保留 dummy partner 对象以兼容旧代码引用，但始终不可见
    this.partner = {
      x: 0, y: 0,
      direction: 'down',
      frame: 0,
      frameTimer: 0,
      moving: false,
      action: 'personality',
      actionPlaying: false,
      actionOnce: false,
      characterId: null,
      characterFrames: {},
      characterType: 'jingyuan',
      visible: false,
    };
    this.camera = { x: 0, y: 0 };
    this.keys = {};
    this.time = 0;
    this.lastTime = 0;
    this._lastRenderedAction = null;
    this._actionChangeTime = 0;
    this.rafId = null;
    this.currentMapIndex = 5; // 默认：寒门；初始化时会通过名称再次校正
    this.selectedCharacter = 'xiu-jing';
    this.selectedCategory = 'hanmen';
    this.characterFrames = {};
    this.loadingCharacter = null;
    this.partnerLoading = null;
    this.duetMode = false;
    this.duetAction = 0;
    this.duetFrame = 0;
    this.duetFrameTimer = 0;
    this.duetFrames = null;
    this.duetActions = ['行礼', '书画', '赏画', '撑伞', '簪花', '赠礼', '共读', '奔跑', '品茶', '舞剑'];
    this.assetManager = AssetManager;
    this.assetManager.getAssetUrl = (relativePath) => {
      if (typeof relativePath === 'string' && relativePath.startsWith(ASSET_BASE_CLEAN)) {
        return ASSET_BASE + relativePath.slice(ASSET_BASE_CLEAN.length);
      }
      return ASSET_BASE + relativePath;
    };
    this.assetManager.getAssetUrls = (relativePath) => RemoteResourceLoader.resolveAssetCandidates(relativePath, ASSET_BASE);
    this.joystick = { x: 0, y: 0 };
    this.mapBackground = null;
    this.mapBackgroundLoaded = false;
    this.backgroundWorldWidth = MAP_W * TILE;
    this.backgroundWorldHeight = MAP_H * TILE;

    this.remotePlayers = {};
    this.multiplayerMode = false;

    this.interactDistance = 50;
    this.nearbyPlayer = null;
    this.interactHintElement = null;
    this.interacting = false;
    this.interactPartnerId = null;
    this.interactType = null;
    this.interactState = 'idle';
    this.interactSavedState = null;

    this.chatBubbles = {};
    this.chatBubbleDuration = 5000;
    this.chatBubbleFadeDuration = 500;
    this._chatBubbleElements = {};
    this.worldItems = [];
    this.worldItemImages = {};
    this.nearbyWorldItem = null;
    this.selectedTargetId = '';
    this.damageNumbers = [];
    this.hitFlashUntil = {};

    this.maps = PRESET_MAPS.map((m, i) => ({ index: i, name: m.name }));
  }

  async init() {
    // ===== 关键：先 bootstrap 远端资源加载器，再渲染地图 =====
    // 否则 RemoteResourceLoader.assetApiBaseUrl 为空 → resolveAssetCandidates 跳过 MySQL 资产 API
    // → 只剩下 CDN（空）+ 本地静态（静态服务器不一定挂载 sendbox/src/assets）→ 地图全黑
    try {
      const rrlPromise = RemoteResourceLoader.bootstrapConfig ? RemoteResourceLoader.bootstrapConfig() : Promise.resolve(null);
      const rmPromise = (typeof window !== 'undefined' && window.ResourceManager && typeof window.ResourceManager.bootstrap === 'function')
        ? window.ResourceManager.bootstrap().catch(() => null)
        : Promise.resolve(null);
      await Promise.all([rrlPromise, rmPromise]);
      const rrlCfg = RemoteResourceLoader.getConfig ? RemoteResourceLoader.getConfig() : null;
      console.log('[GameMapRenderer] bootstrap done:', JSON.stringify(rrlCfg));
    } catch (e) {
      console.warn('[GameMapRenderer] bootstrap failed (will use dynamic fallback in resolveAssetCandidates):', e?.message || e);
    }

    const existingCanvas = this.container.querySelector('.game-map-canvas');
    if (existingCanvas) {
      existingCanvas.remove();
    }

    this.canvas = document.createElement('canvas');
    this.canvas.className = 'game-map-canvas';
    this.container.appendChild(this.canvas);

    this.ctx = this.canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;

    this._resizeHandler = () => this.resize();
    window.addEventListener('resize', this._resizeHandler);

    this.setupInput();
    // 按名称「寒门」加载地图，避免 maps 数组被 bootstrap 扩展后索引偏移
    const hanmenIndex = this.getMapIndexByName('寒门', 5);
    this.loadMap(hanmenIndex);
    this.loadCharacter(this.selectedCharacter);

    this.lastTime = performance.now();
    this.loop();

    // 初始化后多次尝试 resize（应对容器从 display:none -> visible 的情况）
    const tryResize = (times, delay) => {
      if (times <= 0) return;
      setTimeout(() => {
        this.resize();
        if (this.canvas.width === 0 || this.canvas.height === 0) {
          tryResize(times - 1, Math.min(delay * 2, 1000));
        }
      }, delay);
    };
    tryResize(5, 80);
  }

  resize() {
    const rect = this.container.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
    this.centerCamera();
  }

  centerCamera() {
    this.camera.x = this.player.x - this.canvas.width / 2;
    this.camera.y = this.player.y - this.canvas.height / 2;
    this.clampCamera();
  }

  clampCamera() {
    const world = this.getWorldSize();
    const maxX = Math.max(0, world.width - this.canvas.width);
    const maxY = Math.max(0, world.height - this.canvas.height);
    this.camera.x = Math.max(0, Math.min(maxX, this.camera.x));
    this.camera.y = Math.max(0, Math.min(maxY, this.camera.y));
  }

  getWorldSize() {
    if ((this.selectedCategory === 'xiejian' || this.selectedCategory === 'poxiao') && this.mapBackgroundLoaded) {
      return {
        width: this.backgroundWorldWidth,
        height: this.backgroundWorldHeight
      };
    }
    return { width: MAP_W * TILE, height: MAP_H * TILE };
  }

  getDefaultSpawnPoint() {
    const world = this.getWorldSize();
    const map = MapSystem.getMap(this.currentMapBgKey);
    return map ? map.getSpawnPixelCoords(world.width, world.height) : { x: world.width * 0.5, y: world.height * 0.72 };
  }

  setupInput() {
    const handleKeyDown = (e) => {
      this.keys[e.key.toLowerCase()] = true;
      if (e.key === 'e' || e.key === 'E') {
        this.playAction('etiquette');
      } else if (e.key === 'q' || e.key === 'Q') {
        this.playAction('martial');
      } else if (e.key === 'f' || e.key === 'F') {
        this.playAction('signature');
      } else if (e.key === 'r' || e.key === 'R') {
        if (typeof window.xiejianAttackCallback === 'function') {
          window.xiejianAttackCallback(this.selectedTargetId);
        }
      } else if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        const nearbyItem = this.getNearbyWorldItem(80);
        if (nearbyItem && typeof window.xiejianWorldItemCallback === 'function') {
          window.xiejianWorldItemCallback(nearbyItem);
        } else {
          this.tryInteract();
        }
      }
    };

    const handleKeyUp = (e) => {
      this.keys[e.key.toLowerCase()] = false;
    };

    const handleClick = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const worldX = mouseX + this.camera.x;
      const worldY = mouseY + this.camera.y;

      if (this.multiplayerMode) {
        const clickedPlayer = this._findRemotePlayerAtPosition(worldX, worldY);
        if (clickedPlayer) {
          this.selectedTargetId = clickedPlayer.userId;
          if (typeof window.xiejianTargetCallback === 'function') {
            window.xiejianTargetCallback(clickedPlayer.userId, clickedPlayer);
          }
          return;
        }
        const clickedItem = this._findWorldItemAtPosition(worldX, worldY);
        if (clickedItem && typeof window.xiejianWorldItemCallback === 'function') {
          window.xiejianWorldItemCallback(clickedItem);
          return;
        }
      }

      this.moveTo(worldX, worldY);
    };

    this.keyDownHandler = handleKeyDown;
    this.keyUpHandler = handleKeyUp;
    this.clickHandler = handleClick;

    window.addEventListener('keydown', this.keyDownHandler);
    window.addEventListener('keyup', this.keyUpHandler);
    this.canvas.addEventListener('click', this.clickHandler);
  }

  async loadCharacter(charId) {
    if (this.loadingCharacter === charId) return;
    const loadToken = Date.now();
    this.loadingCharacter = charId;
    this.currentLoadToken = loadToken;
    this.selectedCharacter = charId;

    const char = this.getCharacterInfo(charId);
    if (!char) return;
    this.currentCharacterModel = CharacterSystem.getCharacter(charId);

    if (JINGYUAN_CHARACTERS.some(c => c.id === charId)) {
      await this.loadJingyuanCharacter(char.dir, 'xiejian');
    } else if (HANMEN_CHARACTERS.some(c => c.id === charId)) {
      await this.loadJingyuanCharacter(char.dir, 'hanmen');
    } else if (POXIAO_CHARACTERS.some(c => c.id === charId)) {
      await this.loadJingyuanCharacter(char.dir, 'poxiao');
    } else {
      await this.loadMainCharacter(char.group);
    }

    // Only apply the loaded character if it's still the latest request
    if (this.currentLoadToken === loadToken) {
      this.loadingCharacter = null;
    }
  }

  isJingyuanCharacter(charId) {
    return JINGYUAN_CHARACTERS.some(c => c.id === charId) || HANMEN_CHARACTERS.some(c => c.id === charId) || POXIAO_CHARACTERS.some(c => c.id === charId);
  }

  getCharacterInfo(charId) {
    const jingyuan = JINGYUAN_CHARACTERS.find(c => c.id === charId);
    if (jingyuan) return jingyuan;
    const hanmen = HANMEN_CHARACTERS.find(c => c.id === charId);
    if (hanmen) return hanmen;
    const poxiao = POXIAO_CHARACTERS.find(c => c.id === charId);
    if (poxiao) return poxiao;
    const main = MAIN_CHARACTERS.find(c => c.id === charId);
    if (main) return main;
    return null;
  }

  async loadSpritesheetFrames(charDir, category) {
    const frames = {};
    const model = [...CharacterSystem.getAllIds().jingyuan, ...CharacterSystem.getAllIds().hanmen, ...CharacterSystem.getAllIds().poxiao]
      .map(id => CharacterSystem.getCharacter(id))
      .find(character => character?.dir === charDir);
    if (model) {
      for (const action of model.listAvailableActions()) {
        const loaded = (await Promise.all(model.getActionFramePaths(action).map(path => this.assetManager.loadImage(path)))).filter(Boolean);
        if (loaded.length) frames[action] = loaded;
      }
      if (Object.keys(frames).length) return frames;
    }
    
    if (!charDir.startsWith('xiujing-xuanxuan/')) {
      // 旧的静远七人结构
      const actions = ['personality', 'run', 'etiquette', 'martial', 'signature'];
      const characterBase = (category === 'xiejian' || category === 'poxiao')
        ? `${XIEJIAN_CHARACTER_ROOT}/${charDir}`
        : `characters/${category}/${charDir}`;

      for (const action of actions) {
        const actionFrames = [];
        for (let i = 0; i < 4; i++) {
          const frameNum = String(i).padStart(2, '0');
          const path = `${characterBase}/frames/${action}/${frameNum}.png`;
          const img = await this.assetManager.loadImage(path);
          if (img) {
            actionFrames.push(img);
          }
        }
        if (actionFrames.length > 0) {
          frames[action] = actionFrames;
        }
      }

      if (Object.keys(frames).length === 0) {
        const spritesheetPath = `${characterBase}/spritesheet-chroma.png`;
        const spritesheet = await this.assetManager.loadImage(spritesheetPath);
        if (spritesheet) {
          const actionOrder = ['personality', 'etiquette', 'run', 'martial', 'signature'];
          const cols = 4;
          const rows = 5;
          const cellW = Math.floor(spritesheet.width / cols);
          const cellH = Math.floor(spritesheet.height / rows);

          for (let row = 0; row < rows; row++) {
            const action = actionOrder[row];
            const actionFrames = [];
            for (let col = 0; col < cols; col++) {
              const canvas = document.createElement('canvas');
              canvas.width = cellW;
              canvas.height = cellH;
              const ctx = canvas.getContext('2d');
              ctx.drawImage(spritesheet, col * cellW, row * cellH, cellW, cellH, 0, 0, cellW, cellH);
              
              const imageData = ctx.getImageData(0, 0, cellW, cellH);
              const data = imageData.data;
              let minX = cellW, minY = cellH, maxX = 0, maxY = 0;
              let hasPixel = false;
              
              for (let y = 0; y < cellH; y++) {
                for (let x = 0; x < cellW; x++) {
                  const idx = (y * cellW + x) * 4;
                  const r = data[idx];
                  const g = data[idx + 1];
                  const b = data[idx + 2];
                  const a = data[idx + 3];
                  if (!(r > 240 && g < 20 && b > 240) && a > 10) {
                    hasPixel = true;
                    if (x < minX) minX = x;
                    if (x > maxX) maxX = x;
                    if (y < minY) minY = y;
                    if (y > maxY) maxY = y;
                  }
                }
              }
              
              if (hasPixel) {
                const padding = 2;
                const cropX = Math.max(0, minX - padding);
                const cropY = Math.max(0, minY - padding);
                const cropW = Math.min(cellW - cropX, maxX - minX + 1 + padding * 2);
                const cropH = Math.min(cellH - cropY, maxY - minY + 1 + padding * 2);
                
                const croppedCanvas = document.createElement('canvas');
                croppedCanvas.width = cropW;
                croppedCanvas.height = cropH;
                const croppedCtx = croppedCanvas.getContext('2d');
                croppedCtx.drawImage(canvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
                
                const croppedData = croppedCtx.getImageData(0, 0, cropW, cropH);
                const cdata = croppedData.data;
                for (let i = 0; i < cdata.length; i += 4) {
                  const r = cdata[i];
                  const g = cdata[i + 1];
                  const b = cdata[i + 2];
                  if (r > 240 && g < 20 && b > 240) {
                    cdata[i + 3] = 0;
                  }
                }
                croppedCtx.putImageData(croppedData, 0, 0);
                actionFrames.push(croppedCanvas);
              }
            }
            if (actionFrames.length > 0) {
              frames[action] = actionFrames;
            }
          }
        }
      }
    } else {
      // 寒门 xiujing-xuanxuan 角色：映射到 01-萱宣/02-修璟 目录（包含标准5动作帧结构）
      let fallbackDir = charDir;
      if (charDir === 'xiujing-xuanxuan/xuanxuan') fallbackDir = '01-萱宣';
      else if (charDir === 'xiujing-xuanxuan/xiujing') fallbackDir = '02-修璟';

      const actions = ['personality', 'run', 'etiquette', 'martial', 'signature'];
      const characterBase = `characters/hanmen/${fallbackDir}`;

      for (const action of actions) {
        const actionFrames = [];
        for (let i = 0; i < 4; i++) {
          const frameNum = String(i).padStart(2, '0');
          const path = `${characterBase}/frames/${action}/${frameNum}.png`;
          const img = await this.assetManager.loadImage(path);
          if (img) {
            actionFrames.push(img);
          }
        }
        if (actionFrames.length > 0) {
          frames[action] = actionFrames;
        }
      }
    }

    return frames;
  }

  async loadJingyuanCharacter(charDir, category = 'jingyuan') {
    const frames = await this.loadSpritesheetFrames(charDir, category);

    this.characterFrames = frames;
    this.characterType = 'jingyuan';
    this.player.action = 'personality';
    this.player.frame = 0;
  }

  async loadMainCharacter(groupName) {
    const actions = ['Idle', 'Run'];
    const frames = {};

    for (const action of actions) {
      const path = `ui/icons/IconsPropsMonsters/Main Characters/${groupName}/${action} (32x32).png`;
      const img = await this.assetManager.loadImage(path);
      if (img) {
        const frameCount = Math.floor(img.width / 32);
        const actionFrames = [];
        for (let i = 0; i < frameCount; i++) {
          const canvas = document.createElement('canvas');
          canvas.width = 32;
          canvas.height = 32;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, i * 32, 0, 32, 32, 0, 0, 32, 32);
          actionFrames.push(canvas);
        }
        const actionKey = action.toLowerCase();
        frames[actionKey] = actionFrames;
      }
    }

    this.characterFrames = frames;
    this.characterType = 'main';
    this.player.action = 'idle';
    this.player.frame = 0;
  }

  playAction(actionName) {
    if (this.characterType !== 'jingyuan') return;
    if (this.currentCharacterModel && !this.currentCharacterModel.canDoAction(actionName)) return;
    if (!this.characterFrames[actionName]) return;

    this.player.action = actionName;
    this.player.frame = 0;
    this.player.frameTimer = 0;
    this.player.actionPlaying = true;
    this.player.actionOnce = true;

    // 根据动作配置动态计算持续时间（支持破晓 act_01~act_20 等各角色自定义动作）
    const actionCfg = this.currentCharacterModel?.getAction(actionName);
    if (actionCfg) {
      const frameCount = Math.max(actionCfg.frameCount || 1, 1);
      const frameInterval = actionCfg.frameInterval || 200;
      // 非循环动作：播完所有帧；循环动作：至少展示一轮
      this.player.actionDuration = frameCount * frameInterval;
    } else {
      this.player.actionDuration = 3000;
    }

    this.player.actionStartTime = Date.now();
    this.player.actionHold = true;

    if (this.multiplayerMode && typeof MultiplayerSync !== 'undefined' && MultiplayerSync.broadcastAction) {
      MultiplayerSync.broadcastAction(actionName);
    }
  }

  setJoystickInput(x, y) {
    this.joystick.x = x;
    this.joystick.y = y;
  }

  /**
   * 通过地图名称查找索引，避免 GameSystems.bootstrap 注入挟剑子地图后
   * maps 数组被扩展导致硬编码索引（如 5）指向错误的地图条目。
   * 找不到时返回 fallbackIndex（默认 0，即村庄）。
   */
  getMapIndexByName(name, fallbackIndex = 0) {
    if (!name) return fallbackIndex;
    const idx = this.maps.findIndex(m => m && m.name === name);
    return idx >= 0 ? idx : fallbackIndex;
  }

  loadMap(index) {
    if (index < 0 || index >= this.maps.length) {
      index = 0;
    }
    this.currentMapIndex = index;
    this.mapManager.loadMap(index);
    const spawn = this.mapManager.getSafeSpawnPosition();
    this.player.x = spawn.x;
    this.player.y = spawn.y;
    this.player.direction = 'down';
    this.player.frame = 0;
    this.player.moving = false;
    this.player.path = [];
    this.player.pathIndex = 0;
    this.player.action = 'personality';
    this.player.actionPlaying = false;
    this.centerCamera();

    setTimeout(() => {
      if (this.currentMapBgKey && (this.currentMapBgKey.startsWith('xj-') || this.currentMapBgKey.startsWith('px-'))) return;
      const mapNameEl = document.getElementById('map-name');
      if (mapNameEl) {
        mapNameEl.textContent = this.maps[this.currentMapIndex]?.name || '未知地图';
      }
    }, 50);
  }

  setMapBackground(bgKey) {
    this.mapBackgroundLoaded = false;
    this.mapBackground = null;
    this.currentMapBgKey = bgKey;
    const requestedBgKey = bgKey;

    if (bgKey === null || bgKey === undefined) {
      return Promise.resolve(null);
    }

    // 挟剑地图：bgKey='xiejian' 时默认进入静远书院子地图
    if (bgKey === 'xiejian') {
      bgKey = 'xj-jingyuan';
      this.currentMapBgKey = bgKey;
    }

    // 破晓地图：bgKey='poxiao' 时默认进入 D市总览 子地图
    if (bgKey === 'poxiao') {
      bgKey = 'px-d-city';
      this.currentMapBgKey = bgKey;
    }

    // 挟剑子地图数据：模块化优先（MapSystem.legacy），缺失时 fallback 原本地数组
    const legacy = (MapSystem._bootstrapped && MapSystem.getLegacyXiejianMaps()) || null;
    const xjMapMap = legacy ? legacy.xjMapMap : {
      'xj-jingyuan': 'jingyuan-academy-map.png',
      'xj-daohua': 'daohua-temple-map.png',
      'xj-tianxing': 'tianxing-cult-map.png',
      'xj-danxi': 'danxi-valley-map.png',
      'xj-buhuan': 'buhuan-sect-map.png',
      'xj-taozhi': 'taozhi-sect-map.png',
      'xj-dongjia': 'dongjia-shen-manor-map.png',
      'xj-ren': 'ren-manor-map.png',
      'xj-capital': 'capital-hanlin-map.png',
      'xj-forgetfulness': 'forgetfulness-river-map.png',
      'xj-border': 'border-town-map.png',
    };
    const xjMapNames = legacy ? legacy.xjMapNames : {
      'xj-jingyuan': '静远书院',
      'xj-daohua': '道华观',
      'xj-tianxing': '天行教',
      'xj-danxi': '丹溪谷',
      'xj-buhuan': '不还门',
      'xj-taozhi': '桃止门',
      'xj-dongjia': '东嘉沈府',
      'xj-ren': '任府',
      'xj-capital': '京城翰林院',
      'xj-forgetfulness': '忘川',
      'xj-border': '边陲小镇',
    };

    // 破晓子地图数据：模块化优先（MapSystem.legacy），缺失时 fallback 原本地数组
    const pxLegacy = (MapSystem._bootstrapped && MapSystem.getLegacyPoxiaoMaps()) || null;
    const pxMapMap = pxLegacy ? pxLegacy.pxMapMap : {
      'px-d-city': '01-d-city-overview.png',
      'px-stella': '02-stella-gallery.png',
      'px-seafood': '03-seafood-lime-compound.png',
      'px-police': '04-police-university.png',
      'px-village': '05-southwest-village.png',
      'px-docks': '06-industrial-docks-region.png',
    };
    const pxMapNames = pxLegacy ? pxLegacy.pxMapNames : {
      'px-d-city': 'D市总览',
      'px-stella': 'STELLA画廊',
      'px-seafood': '海鲜市场-冷库-生石灰厂',
      'px-police': '公安大学',
      'px-village': '西南边陲小村',
      'px-docks': '郊区厂房-码头',
    };

    if (bgKey.startsWith('xj-') && xjMapMap[bgKey]) {
      const mapModel = MapSystem.getMap(bgKey);
      this.currentMapModel = mapModel;
      const bgPath = mapModel?.bgPath || ('xiejian/sanshi-pixel-assets/location-maps/full-maps/' + xjMapMap[bgKey]);
      return this.assetManager.loadImage(bgPath).then(img => {
        if (this.currentMapBgKey !== bgKey && this.currentMapBgKey !== requestedBgKey) return;
        if (img) {
          this.mapBackground = img;
          this.mapBackgroundLoaded = true;
          const worldScale = mapModel?.worldScale || 2;
          this.backgroundWorldWidth = img.width * worldScale;
          this.backgroundWorldHeight = img.height * worldScale;
          this.clampCamera();

          const mapNameEl = document.getElementById('map-name');
          if (mapNameEl) {
            mapNameEl.textContent = mapModel?.name || xjMapNames[bgKey] || bgKey;
          }
          
          // 加载该地图的世界道具
          this._loadWorldItemsForMap(bgKey);
        }
        return img;
      }).catch(() => {
        if (this.currentMapBgKey !== bgKey && this.currentMapBgKey !== requestedBgKey) return;
        this.mapBackground = null;
        this.mapBackgroundLoaded = false;
        return null;
      });
    }

    if (bgKey.startsWith('px-') && pxMapMap[bgKey]) {
      const pxMapModel = MapSystem.getMap(bgKey);
      this.currentMapModel = pxMapModel;
      const pxBgPath = pxMapModel?.bgPath || ('poxiao/maps/' + pxMapMap[bgKey]);
      return this.assetManager.loadImage(pxBgPath).then(img => {
        if (this.currentMapBgKey !== bgKey && this.currentMapBgKey !== requestedBgKey) return;
        if (img) {
          this.mapBackground = img;
          this.mapBackgroundLoaded = true;
          const worldScale = pxMapModel?.worldScale || 2;
          this.backgroundWorldWidth = img.width * worldScale;
          this.backgroundWorldHeight = img.height * worldScale;
          this.clampCamera();

          const mapNameEl = document.getElementById('map-name');
          if (mapNameEl) {
            mapNameEl.textContent = pxMapModel?.name || pxMapNames[bgKey] || bgKey;
          }
          
          // 加载该地图的世界道具
          this._loadWorldItemsForMap(bgKey);
        }
        return img;
      }).catch(() => {
        if (this.currentMapBgKey !== bgKey && this.currentMapBgKey !== requestedBgKey) return;
        this.mapBackground = null;
        this.mapBackgroundLoaded = false;
        return null;
      });
    }

    let bgPath;
    if (bgKey === 'hanmen') {
      bgPath = 'maps/hanmen-bg.png';
    } else {
      bgPath = 'maps/bg-' + bgKey + '.png';
    }

    return this.assetManager.loadImage(bgPath).then(img => {
      if (this.currentMapBgKey !== requestedBgKey) return;
      if (img) {
        this.mapBackground = img;
        this.mapBackgroundLoaded = true;
        this.backgroundWorldWidth = MAP_W * TILE;
        this.backgroundWorldHeight = MAP_H * TILE;
        this.clampCamera();

        const mapNameEl = document.getElementById('map-name');
        if (mapNameEl) {
          const bgNames = {
            hanmen: '寒门',
            village: '村庄',
            desert: '沙漠',
            snow: '雪山',
          };
          mapNameEl.textContent = bgNames[bgKey] || bgKey;
        }
        
        // 加载该地图的世界道具
        this._loadWorldItemsForMap(bgKey);
      }
      return img;
    }).catch(() => {
      if (this.currentMapBgKey !== requestedBgKey) return;
      this.mapBackground = null;
      this.mapBackgroundLoaded = false;
      return null;
    });
  }

  getXiejianMapKeys() {
    return [
      'xj-jingyuan', 'xj-daohua', 'xj-tianxing', 'xj-danxi',
      'xj-buhuan', 'xj-taozhi', 'xj-dongjia', 'xj-ren',
      'xj-capital', 'xj-forgetfulness', 'xj-border',
    ];
  }

  getPoxiaoMapKeys() {
    return ['px-d-city', 'px-stella', 'px-seafood', 'px-police', 'px-village', 'px-docks'];
  }

  moveTo(targetX, targetY) {
    if (this.selectedCategory === 'xiejian' || this.selectedCategory === 'poxiao') {
      const world = this.getWorldSize();
      this.player.path = [{
        x: Math.max(8, Math.min(world.width - 8, targetX)),
        y: Math.max(12, Math.min(world.height - 4, targetY))
      }];
      this.player.pathIndex = 0;
      this.player.actionPlaying = false;
      return;
    }
    const path = this.findPath(this.player.x, this.player.y, targetX, targetY);
    if (path.length > 0) {
      this.player.path = path;
      this.player.pathIndex = 0;
      this.player.actionPlaying = false;
    }
  }

  findPath(startX, startY, targetX, targetY) {
    const startTileX = Math.floor(startX / TILE);
    const startTileY = Math.floor(startY / TILE);
    const targetTileX = Math.floor(targetX / TILE);
    const targetTileY = Math.floor(targetY / TILE);

    if (startTileX === targetTileX && startTileY === targetTileY) return [];

    const queue = [{ x: startTileX, y: startTileY, path: [] }];
    const visited = new Set();
    visited.add(`${startTileX},${startTileY}`);

    const directions = [[0, -1], [0, 1], [-1, 0], [1, 0]];

    while (queue.length > 0) {
      const current = queue.shift();

      for (const [dx, dy] of directions) {
        const nx = current.x + dx;
        const ny = current.y + dy;

        if (nx === targetTileX && ny === targetTileY) {
          const path = [];
          let px = nx * TILE + TILE / 2;
          let py = ny * TILE + TILE / 2;
          path.push({ x: px, y: py });
          for (const step of [...current.path].reverse()) {
            px = step.x * TILE + TILE / 2;
            py = step.y * TILE + TILE / 2;
            path.unshift({ x: px, y: py });
          }
          return path;
        }

        if (nx >= 0 && nx < MAP_W && ny >= 0 && ny < MAP_H) {
          const key = `${nx},${ny}`;
          if (!visited.has(key) && !TILE_SOLID[this.mapManager.map[ny][nx]]) {
            visited.add(key);
            queue.push({ x: nx, y: ny, path: [...current.path, { x: nx, y: ny }] });
          }
        }
      }
    }

    return [];
  }

  update(dt) {
    // 单人模式：始终禁用搭档/双人模式
    if (this.partner) this.partner.visible = false;
    this.duetMode = false;

    let dx = 0, dy = 0;
    const combatState = typeof MultiplayerSync !== 'undefined' ? MultiplayerSync.combatProfile : null;
    const movementLocked = Date.now() < (combatState?.immobilizedUntil || 0);

    const manualX = (this.keys.d || this.keys.arrowright ? 1 : 0) - (this.keys.a || this.keys.arrowleft ? 1 : 0);
    const manualY = (this.keys.s || this.keys.arrowdown ? 1 : 0) - (this.keys.w || this.keys.arrowup ? 1 : 0);

    let joyX = 0, joyY = 0;
    if (Math.abs(this.joystick.x) > 0.15 || Math.abs(this.joystick.y) > 0.15) {
      joyX = this.joystick.x;
      joyY = this.joystick.y;
    }

    if (!movementLocked && (manualX !== 0 || manualY !== 0)) {
      const length = Math.hypot(manualX, manualY);
      dx = manualX / length;
      dy = manualY / length;
      this.player.path = [];
      this.player.pathIndex = 0;
      this.player.actionPlaying = false;
    } else if (!movementLocked && (joyX !== 0 || joyY !== 0)) {
      const length = Math.hypot(joyX, joyY);
      dx = joyX / length;
      dy = joyY / length;
      this.player.path = [];
      this.player.pathIndex = 0;
      this.player.actionPlaying = false;
    }

    if (dx === 0 && dy === 0 && this.player.path && this.player.path.length > 0 && this.player.pathIndex < this.player.path.length) {
      const target = this.player.path[this.player.pathIndex];
      const distX = target.x - this.player.x;
      const distY = target.y - this.player.y;
      const dist = Math.sqrt(distX * distX + distY * distY);

      if (dist < 4) {
        this.player.pathIndex++;
        if (this.player.pathIndex >= this.player.path.length) {
          this.player.path = [];
          this.player.pathIndex = 0;
        }
      } else {
        dx = distX / dist;
        dy = distY / dist;
      }
    }

    const speed = PLAYER_SPEED;
    const nx = this.player.x + dx * speed;
    const ny = this.player.y + dy * speed;

    let actuallyMoved = false;

    if (dx !== 0 || dy !== 0) {
      const oldX = this.player.x;
      const oldY = this.player.y;
      if (this.canMoveTo(nx, this.player.y)) {
        this.player.x = nx;
      }
      if (this.canMoveTo(this.player.x, ny)) {
        this.player.y = ny;
      }
      // 只有位置实际发生变化才标记为已移动，避免被墙挡住时误判为移动
      actuallyMoved = (this.player.x !== oldX) || (this.player.y !== oldY);
    }

    if (actuallyMoved) {
      this.player.moving = true;
      if (Math.abs(dx) > Math.abs(dy)) {
        this.player.direction = dx > 0 ? 'right' : 'left';
      } else {
        this.player.direction = dy > 0 ? 'down' : 'up';
      }

      if (this.characterType === 'jingyuan') {
        if (!this.player.actionPlaying) {
          this.player.action = 'run';
        }
      } else {
        this.player.action = 'run';
      }
    } else {
      this.player.moving = false;
      if (this.characterType === 'jingyuan') {
        if (!this.player.actionPlaying) {
          this.player.action = 'personality';
        }
      } else {
        this.player.action = 'idle';
      }
    }

    this.updateAnimation(dt);

    const world = this.getWorldSize();
    this.player.x = Math.max(8, Math.min(world.width - 8, this.player.x));
    this.player.y = Math.max(12, Math.min(world.height - 4, this.player.y));

    if (this.partner.visible) {
      const targetOffsetX = this.player.direction === 'left' ? 30 : -30;
      const targetX = this.player.x + targetOffsetX;
      const targetY = this.player.y;
      
      const distX = targetX - this.partner.x;
      const distY = targetY - this.partner.y;
      const dist = Math.sqrt(distX * distX + distY * distY);
      
      if (dist > 5) {
        const followSpeed = PLAYER_SPEED * 0.8;
        this.partner.x += (distX / dist) * followSpeed;
        this.partner.y += (distY / dist) * followSpeed;
        this.partner.moving = true;
        if (!this.partner.actionPlaying) {
          this.partner.action = this.partner.characterType === 'jingyuan' ? 'run' : 'run';
        }
      } else {
        this.partner.moving = false;
        if (!this.partner.actionPlaying) {
          this.partner.action = this.partner.characterType === 'jingyuan' ? 'personality' : 'idle';
        }
      }
      
      this.partner.direction = this.player.direction;
      this.partner.x = Math.max(8, Math.min(MAP_W * TILE - 8, this.partner.x));
      this.partner.y = Math.max(12, Math.min(MAP_H * TILE - 4, this.partner.y));
    }

    this.camera.x = this.player.x - this.canvas.width / 2;
    this.camera.y = this.player.y - this.canvas.height / 2;
    this.clampCamera();

    if (this.multiplayerMode) {
      this._updateRemotePlayers(dt);
      this._updateInteractionDetection();
      this.nearbyWorldItem = this.getNearbyWorldItem(80);
      this._broadcastPlayerState();
    }

    this._updateChatBubbles(dt);

    this.time += dt;
  }

  _broadcastPlayerState() {
    if (typeof MultiplayerSync === 'undefined' || !MultiplayerSync.broadcastState) return;

    const currentUser = this._getCurrentUser();
    const characterId = currentUser?.role || this.selectedCharacter || '';

    MultiplayerSync.broadcastState({
      x: this.player.x,
      y: this.player.y,
      direction: this.player.direction,
      action: this.player.action,
      frame: this.player.frame,
      moving: this.player.moving,
      characterId: characterId
    });
  }

  updateAnimation(dt) {
    const frames = this.characterFrames[this.player.action];
    if (!frames || frames.length === 0) return;

    let frameSpeed = 180;
    if (this.characterType === 'jingyuan') {
      const configured = this.currentCharacterModel?.getAction(this.player.action)?.frameInterval;
      const actionSpeeds = {
        personality: (this.selectedCategory === 'xiejian' || this.selectedCategory === 'poxiao') ? 3000 : 240,
        run: 105,
        etiquette: 220,
        martial: 110,
        signature: 180,
      };
      frameSpeed = configured || actionSpeeds[this.player.action] || 180;
    } else {
      frameSpeed = this.player.moving ? 100 : 200;
    }

    this.player.frameTimer += dt;
    if (this.player.frameTimer >= frameSpeed) {
      this.player.frameTimer = 0;
      this.player.frame++;

      if (this.player.frame >= frames.length) {
        if (this.player.actionOnce && this.player.actionPlaying && !this.player.actionHold) {
          this.player.actionPlaying = false;
          this.player.action = this.player.moving ? (this.characterType === 'jingyuan' ? 'run' : 'run') : (this.characterType === 'jingyuan' ? 'personality' : 'idle');
          this.player.frame = 0;
        } else {
          this.player.frame = 0;
        }
      }
    }

    if (this.player.actionHold && this.player.actionStartTime) {
      const elapsed = Date.now() - this.player.actionStartTime;
      if (elapsed >= this.player.actionDuration) {
        this.player.actionHold = false;
        this.player.actionPlaying = false;
        this.player.actionOnce = false;
        this.player.action = this.characterType === 'jingyuan' ? 'personality' : 'idle';
        this.player.frame = 0;
        this.player.actionStartTime = null;
      }
    }

    if (this.partner.visible && this.partner.characterFrames) {
      const partnerFrames = this.partner.characterFrames[this.partner.action];
      if (partnerFrames && partnerFrames.length > 0) {
        let partnerFrameSpeed = 180;
        if (this.partner.characterType === 'jingyuan') {
          const actionSpeeds = {
            personality: 240,
            run: 105,
            etiquette: 220,
            martial: 110,
            signature: 180,
          };
          partnerFrameSpeed = actionSpeeds[this.partner.action] || 180;
        } else {
          partnerFrameSpeed = this.partner.moving ? 100 : 200;
        }

        this.partner.frameTimer += dt;
        if (this.partner.frameTimer >= partnerFrameSpeed) {
          this.partner.frameTimer = 0;
          this.partner.frame++;

          if (this.partner.frame >= partnerFrames.length) {
            if (this.partner.actionOnce && this.partner.actionPlaying) {
              this.partner.actionPlaying = false;
              this.partner.action = this.partner.moving ? (this.partner.characterType === 'jingyuan' ? 'run' : 'run') : (this.partner.characterType === 'jingyuan' ? 'personality' : 'idle');
              this.partner.frame = 0;
            } else {
              this.partner.frame = 0;
            }
          }
        }
      }
    }
  }

  canMoveTo(nx, ny) {
    const hw = 6, hh = 8;
    if (this.selectedCategory === 'xiejian' || this.selectedCategory === 'poxiao') {
      const world = this.getWorldSize();
      return nx - hw >= 0
        && nx + hw < world.width
        && ny - hh >= 0
        && ny + hh < world.height;
    }
    const corners = [
      [nx - hw, ny - hh],
      [nx + hw - 1, ny - hh],
      [nx - hw, ny + hh - 1],
      [nx + hw - 1, ny + hh - 1],
    ];
    for (const [cx, cy] of corners) {
      const tx = Math.floor(cx / TILE);
      const ty = Math.floor(cy / TILE);
      if (tx < 0 || tx >= MAP_W || ty < 0 || ty >= MAP_H) return false;
      if (TILE_SOLID[this.mapManager.map[ty][tx]]) return false;
    }
    return true;
  }

  loop() {
    const now = performance.now();
    const dt = now - this.lastTime;
    this.lastTime = now;

    this.update(dt);
    this.render();

    this.rafId = requestAnimationFrame(() => this.loop());
  }

  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    let bgX = 0, bgY = 0, bgW = 0, bgH = 0;
    let usingBackground = false;

    if (this.mapBackgroundLoaded && this.mapBackground) {
      usingBackground = true;
      const img = this.mapBackground;
      if (this.selectedCategory === 'xiejian' || this.selectedCategory === 'poxiao') {
        bgW = this.backgroundWorldWidth;
        bgH = this.backgroundWorldHeight;
        bgX = -this.camera.x;
        bgY = -this.camera.y;
      } else {
        const scale = Math.max(this.canvas.width / img.width, this.canvas.height / img.height);
        bgW = img.width * scale;
        bgH = img.height * scale;
        bgX = (this.canvas.width - bgW) / 2;
        bgY = (this.canvas.height - bgH) / 2;
      }
      this.ctx.drawImage(img, bgX, bgY, bgW, bgH);
    } else {
      const startTileX = Math.max(0, Math.floor(this.camera.x / TILE));
      const endTileX = Math.min(MAP_W, startTileX + Math.ceil(this.canvas.width / TILE) + 1);
      const startTileY = Math.max(0, Math.floor(this.camera.y / TILE));
      const endTileY = Math.min(MAP_H, startTileY + Math.ceil(this.canvas.height / TILE) + 1);

      for (let ty = startTileY; ty < endTileY; ty++) {
        for (let tx = startTileX; tx < endTileX; tx++) {
          const tileType = this.mapManager.map[ty][tx];
          const x = tx * TILE - this.camera.x;
          const y = ty * TILE - this.camera.y;
          PixelArt.drawTile(this.ctx, tileType, x, y, this.time);
        }
      }
    }

    let px, py;
    if (usingBackground && this.selectedCategory !== 'xiejian' && this.selectedCategory !== 'poxiao') {
      px = bgX + bgW * 0.5;
      py = bgY + bgH * 0.7;
    } else {
      px = this.player.x - this.camera.x;
      py = this.player.y - this.camera.y;
    }

    if (this.duetMode && this.duetFrames && !this.multiplayerMode) {
      this.drawDuet(px, py);
    } else {
      if (!this.multiplayerMode && this.partner.visible) {
        let ppX, ppY;
        if (usingBackground) {
          ppX = bgX + bgW * 0.42;
          ppY = bgY + bgH * 0.7;
        } else {
          ppX = this.partner.x - this.camera.x;
          ppY = this.partner.y - this.camera.y;
        }
        this.drawPartner(ppX, ppY);
      }

      if (this.selectedCategory === 'xiejian' || this.selectedCategory === 'poxiao') {
        const remotePlayerList = (this.multiplayerMode ? Object.values(this.remotePlayers) : [])
          .filter(p => p.visible)
          .map(player => ({ kind: 'remote', y: player.y, player }));
        const scene = [
          ...this.worldItems.map(item => ({ kind: 'item', y: item.y, item })),
          { kind: 'local', y: this.player.y },
          ...remotePlayerList
        ].sort((a, b) => a.y - b.y);
        for (const entity of scene) {
          if (entity.kind === 'item') this._drawWorldItem(entity.item);
          if (entity.kind === 'local') {
            this._drawPlayerAura(this.player.x, this.player.y);
            this.drawCharacter(px, py);
          }
          if (entity.kind === 'remote') {
            const remote = entity.player;
            this._drawRemotePlayer(remote.x - this.camera.x, remote.y - this.camera.y, remote);
          }
        }
        this.renderPlayerNameTags();
        this._drawCombatEffects();
        // 万物送信：在途信使标记（地图追踪）
        this._drawJourneyMarkers();
      } else {
        if (this.multiplayerMode) this._drawPlayerAura(this.player.x, this.player.y);
        this.drawCharacter(px, py);
        if (this.multiplayerMode) {
          for (const player of Object.values(this.remotePlayers).filter(p => p.visible).sort((a, b) => a.y - b.y)) {
            this._drawRemotePlayer(player.x - this.camera.x, player.y - this.camera.y, player);
          }
          this.renderPlayerNameTags();
        }
      }
    }
  }

  async loadDuetFrames() {
    if (this.duetFrames) return;
    
    const basePath = 'characters/hanmen/xiujing-xuanxuan/duo/frames';
    this.duetFrames = [];
    
    for (const action of DUO_ACTIONS) {
      // 每个动作只有1帧 (从 manifest.json 确认)
      const frameNum = '00';
      const path = `${basePath}/${action}/${frameNum}.png`;
      const img = await this.assetManager.loadImage(path);
      if (img) {
        this.duetFrames.push(img);
      }
    }
  }

  drawDuet(x, y) {
    if (!this.duetFrames || this.duetFrames.length === 0) return;
    
    // 每个动作只有1帧，duetAction 直接是帧索引
    const frame = this.duetFrames[this.duetAction];
    
    if (!frame) return;
    
    const scale = 1; // 和青蛙差不多大小
    const w = frame.width * scale;
    const h = frame.height * scale;
    
    // 浮动动画效果
    const floatY = Math.sin(this.time * 0.003) * 2;
    
    this.ctx.save();
    this.ctx.imageSmoothingEnabled = false;
    
    this.ctx.fillStyle = 'rgba(0,0,0,0.25)';
    this.ctx.beginPath();
    this.ctx.ellipse(x, y + 2, w * 0.25, h * 0.08, 0, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.drawImage(frame, x - w / 2, y - h + floatY, w, h);
    this.ctx.restore();
  }

  toggleDuetMode() {
    // 单人模式：始终禁用双人模式
    return false;
  }

  setDuetAction(index) {
    // 单人模式：no-op
  }

  setPartner(charId) {
    // 单人模式：no-op，不再设置搭档
  }

  loadPartner(charId) {
    // 单人模式：no-op
  }

  drawPartner(x, y) {
    const frames = this.partner.characterFrames[this.partner.action];
    if (!frames || frames.length === 0) return;

    const frame = frames[this.partner.frame % frames.length];
    if (!frame) return;

    // 寒门和静远的角色缩小到 0.5，主角保持原始大小
    const scale = this.partner.characterType === 'jingyuan' ? 0.5 : 1;
    const w = frame.width * scale;
    const h = frame.height * scale;
    
    // 浮动动画效果（与玩家不同步，错开相位）；破晓增强呼吸幅度
    const floatY = (this.selectedCategory === 'poxiao' && !this.partner.moving)
      ? Math.sin(this.time * 0.0018 + Math.PI * 0.7) * 3
      : Math.sin(this.time * 0.003 + Math.PI) * 2;

    this.ctx.save();
    this.ctx.imageSmoothingEnabled = false;

    this.ctx.fillStyle = 'rgba(0,0,0,0.25)';
    this.ctx.beginPath();
    this.ctx.ellipse(x, y + 2, w * 0.35, h * 0.12, 0, 0, Math.PI * 2);
    this.ctx.fill();

    if (this.partner.direction === 'left') {
      this.ctx.translate(x + w / 2, y - h + floatY);
      this.ctx.scale(-1, 1);
      this.ctx.drawImage(frame, -w / 2, 0, w, h);
    } else {
      this.ctx.drawImage(frame, x - w / 2, y - h + floatY, w, h);
    }

    this.ctx.restore();
  }

  drawCharacter(x, y) {
    const frames = this.characterFrames[this.player.action];
    if (!frames || frames.length === 0) return;

    const frame = frames[this.player.frame % frames.length];
    if (!frame) return;

    // 寒门和静远的角色缩小到 0.5，主角保持原始大小
    const scale = this.characterType === 'jingyuan' ? 0.5 : 1;

    // === 破晓角色动画增强 ===
    let floatY = 0, breathScale = 1.0, runTilt = 0, runSway = 0;
    if (this.selectedCategory === 'poxiao') {
      if (this.player.moving) {
        // 跑步弹跳：模拟步频节奏（垂直上下弹跳 + 身体倾斜 + 左右摇摆）
        const runCycle = this.time * 0.011;
        floatY = -Math.abs(Math.sin(runCycle)) * 8;      // 加大弹跳 8px
        runTilt = Math.sin(runCycle * 2) * 0.055;          // 跑步身体摆动 ±3°
        runSway = Math.sin(runCycle) * 2;                // 左右微摆 2px
      } else {
        // 空闲呼吸：缓慢的缩放振荡 + 浮动
        floatY = Math.sin(this.time * 0.0018) * 3;
        breathScale = 1.0 + Math.sin(this.time * 0.0012) * 0.022;
      }
    } else {
      floatY = this.player.moving ? 0 : Math.sin(this.time * 0.003) * 2;
    }

    // === 动作切换过渡脉冲 ===
    let transitionScale = 1.0;
    if (this.selectedCategory === 'poxiao') {
      if (this._lastRenderedAction !== this.player.action) {
        this._lastRenderedAction = this.player.action;
        this._actionChangeTime = this.time;
      }
      if (this._actionChangeTime) {
        const elapsed = this.time - this._actionChangeTime;
        if (elapsed < 180) {
          // 短暂脉冲：先膨胀再收缩，产生 "pop" 感
          transitionScale = 1.0 + Math.sin((elapsed / 180) * Math.PI) * 0.05;
        }
      }
    }

    const finalScale = scale * breathScale * transitionScale;
    const w = frame.width * finalScale;
    const h = frame.height * finalScale;

    this.ctx.save();
    this.ctx.imageSmoothingEnabled = false;

    this.ctx.fillStyle = 'rgba(0,0,0,0.25)';
    this.ctx.beginPath();
    this.ctx.ellipse(x, y + 2, w * 0.35, h * 0.12, 0, 0, Math.PI * 2);
    this.ctx.fill();

    if (this.player.direction === 'left') {
      this.ctx.translate(x + w / 2 + runSway, y - h / 2 + floatY);
      this.ctx.scale(-1, 1);
      this.ctx.rotate(runTilt);
      this.ctx.drawImage(frame, -w / 2, -h / 2, w, h);
    } else {
      this.ctx.save();
      this.ctx.translate(x + runSway, y - h / 2 + floatY);
      this.ctx.rotate(-runTilt);
      this.ctx.drawImage(frame, -w / 2, -h / 2, w, h);
      this.ctx.restore();
    }

    this.ctx.restore();
  }

  setCharacter(charId) {
    if (this.multiplayerMode && this.selectedCategory !== 'xiejian' && this.selectedCategory !== 'poxiao') {
      const currentUser = this._getCurrentUser();
      if (currentUser && currentUser.role) {
        charId = currentUser.role;
      }
    }
    this.loadCharacter(charId);
  }

  setCategory(categoryKey) {
    this.selectedCategory = categoryKey;
  }

  getCharactersForCategory(categoryKey) {
    if (categoryKey === 'jingyuan') {
      return JINGYUAN_CHARACTERS;
    } else if (categoryKey === 'hanmen') {
      return HANMEN_CHARACTERS;
    } else if (categoryKey === 'xiejian') {
      return JINGYUAN_CHARACTERS;
    } else if (categoryKey === 'poxiao') {
      return POXIAO_CHARACTERS;
    } else if (categoryKey === 'main') {
      return MAIN_CHARACTERS;
    }
    return [];
  }

  getMaps() {
    return this.maps;
  }

  switchMap(index) {
    if (index >= 0 && index < this.maps.length) {
      this.loadMap(index);
    }
  }

  addRemotePlayer(userId, characterId, x, y) {
    if (!userId || this.remotePlayers[userId]) return;

    const remotePlayer = {
      userId: userId,
      characterId: characterId || '',
      x: x || 0,
      y: y || 0,
      targetX: x || 0,
      targetY: y || 0,
      direction: 'down',
      frame: 0,
      frameTimer: 0,
      moving: false,
      action: 'personality',
      actionPlaying: false,
      actionOnce: false,
      characterFrames: {},
      characterType: 'jingyuan',
      loading: false,
      visible: false,
      displayName: '',
      isOnline: true,
      opacity: 1,
      fadeOutStartTime: 0
    };

    this.remotePlayers[userId] = remotePlayer;

    if (characterId) {
      this._loadRemotePlayerCharacter(userId, characterId);
    }

    const userInfo = this._getUserInfo(userId);
    if (userInfo) {
      remotePlayer.displayName = userInfo.displayName || userInfo.username || '';
    }
  }

  removeRemotePlayer(userId) {
    if (this.remotePlayers[userId]) {
      delete this.remotePlayers[userId];
    }
    if (this.selectedTargetId === userId) {
      this.selectedTargetId = '';
      if (typeof window.xiejianTargetCallback === 'function') {
        window.xiejianTargetCallback('', null);
      }
    }
  }

  updateRemotePlayer(userId, state) {
    const player = this.remotePlayers[userId];
    if (!player) return;

    if (state.characterId && state.characterId !== player.characterId) {
      this._loadRemotePlayerCharacter(userId, state.characterId);
    }

    if (state.x !== undefined) player.targetX = state.x;
    if (state.y !== undefined) player.targetY = state.y;
    if (state.direction !== undefined) player.direction = state.direction;
    if (state.frame !== undefined) player.frame = state.frame;
    if (state.moving !== undefined) {
      player.moving = state.moving;
    }
    if (state.action !== undefined) {
      if (!player.actionPlaying) {
        player.action = state.action;
      }
    }
    if (state.combat !== undefined) player.combat = state.combat;
    if (state.isOnline !== undefined) {
      const wasOnline = player.isOnline;
      player.isOnline = state.isOnline;
      if (wasOnline && !state.isOnline) {
        player.fadeOutStartTime = Date.now();
      } else if (!wasOnline && state.isOnline) {
        player.opacity = 1;
        player.fadeOutStartTime = 0;
      }
    }
  }

  playRemoteAction(userId, action) {
    const player = this.remotePlayers[userId];
    if (!player || !player.characterFrames[action]) return;

    player.action = action;
    player.frame = 0;
    player.frameTimer = 0;
    player.actionPlaying = true;
    player.actionOnce = true;
    player.actionHold = true;
    player.actionDuration = 3000;
    player.actionStartTime = Date.now();
  }

  getNearbyPlayer(distance) {
    if (!this.multiplayerMode) return null;
    const checkDist = distance || 3;
    const pixelDist = checkDist * 32;

    for (const userId of Object.keys(this.remotePlayers)) {
      const player = this.remotePlayers[userId];
      if (!player.visible || !player.isOnline) continue;

      const dx = player.x - this.player.x;
      const dy = player.y - this.player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= pixelDist) {
        return { userId: userId, player: player, distance: dist };
      }
    }
    return null;
  }

  setWorldItems(items) {
    this.worldItems = Array.isArray(items) ? items.slice() : [];
    console.log('[GameMapRenderer] setWorldItems count:', this.worldItems.length);
    if (this.worldItems.length > 0) {
      const firstItem = this.worldItems[0];
      console.log('[GameMapRenderer] first worldItem:', {
        instanceId: firstItem?.instanceId,
        defId: firstItem?.defId,
        x: firstItem?.x,
        y: firstItem?.y,
        hasDefinition: !!firstItem?.definition,
        definitionIcon: firstItem?.definition?.icon,
        portable: firstItem?.portable ?? firstItem?.definition?.portable
      });
    }
    for (const item of this.worldItems) this._loadWorldItemImage(item);
  }

  addWorldItem(item) {
    if (!item || this.worldItems.some(existing => existing.instanceId === item.instanceId)) return;
    this.worldItems.push(item);
    this._loadWorldItemImage(item);
  }

  removeWorldItem(instanceId) {
    this.worldItems = this.worldItems.filter(item => item.instanceId !== instanceId);
  }

  getNearbyWorldItem(maxDistance = 80) {
    let nearest = null;
    let nearestDistance = Infinity;
    for (const item of this.worldItems) {
      const distance = Math.hypot(item.x - this.player.x, item.y - this.player.y);
      if (distance <= maxDistance && distance < nearestDistance) {
        nearest = item;
        nearestDistance = distance;
      }
    }
    return nearest;
  }

  _findWorldItemAtPosition(x, y) {
    return this.worldItems.find(item => Math.hypot(item.x - x, item.y - y) <= 30) || null;
  }

  async _loadWorldItemsForMap(mapKey, opts = {}) {
    if (!mapKey) return;
    const { forceReload = false } = opts;
    try {
      console.log('[GameMapRenderer] _loadWorldItemsForMap called with mapKey:', mapKey, 'forceReload:', forceReload, 'existingWorldItems:', this.worldItems?.length || 0);
      // 从服务端加载世界道具
      if (typeof MailService !== 'undefined' && MailService.getWorldItems) {
        const accountKey = typeof AuthManager !== 'undefined'
          ? (MailService.getAccountKey?.(AuthManager.getCurrentUser()) || '')
          : '';
        console.log('[GameMapRenderer] accountKey:', accountKey, 'AuthManager exists:', typeof AuthManager !== 'undefined');
        // 只要有 MailService 就尝试调用服务端 API（MailService.getWorldItems 自己会处理无 accountKey 的情况）
        if (typeof MailService.getWorldItems === 'function') {
          console.log('[GameMapRenderer] calling MailService.getWorldItems...');
          const items = await MailService.getWorldItems(mapKey);
          console.log('[GameMapRenderer] getWorldItems returned:', items?.length, 'items');
          if (Array.isArray(items)) {
            // 服务端返回了数组就采用：长度>0 时更新，长度=0 时如果已有内容也不要强行清空（保持现有更安全）
            if (items.length > 0) {
              this.setWorldItems(items);
              return;
            }
            // 服务端返回空数组：若当前已有 worldItems 则保留，否则继续走 fallback
            if (this.worldItems && this.worldItems.length > 0 && !forceReload) {
              console.log('[GameMapRenderer] server returned empty but keep existing worldItems count:', this.worldItems.length);
              return;
            }
          }
        }
      }

      // 兜底：使用本地地图数据初始化道具
      console.log('[GameMapRenderer] falling back to local map data');
      this._initWorldItemsFromMapData(mapKey, { forceReload });
    } catch (e) {
      console.warn('[GameMapRenderer] 加载世界道具失败:', e?.message || e, e);
      // 兜底：使用本地地图数据初始化道具
      this._initWorldItemsFromMapData(mapKey, { forceReload });
    }
  }

  _initWorldItemsFromMapData(mapKey, opts = {}) {
    const { forceReload = false } = opts;
    const mapModel = MapSystem.getMap(mapKey);
    const defCount = mapModel?.initialWorldItemDefs?.length || 0;
    console.log('[GameMapRenderer] _initWorldItemsFromMapData:', {
      mapKey,
      hasMapModel: !!mapModel,
      hasInitialWorldItemDefs: !!mapModel?.initialWorldItemDefs,
      initialWorldItemDefsCount: defCount,
      existingWorldItems: this.worldItems?.length || 0
    });
    if (!mapModel || !mapModel.initialWorldItemDefs || defCount === 0) {
      // 本地没有配置初始道具时：如果当前已有 worldItems 就不清空（避免覆盖 app.js 已经从服务端加载到的道具）
      if (this.worldItems && this.worldItems.length > 0 && !forceReload) {
        console.log('[GameMapRenderer] no local initialWorldItemDefs, keep existing worldItems count:', this.worldItems.length);
        return;
      }
      console.log('[GameMapRenderer] no map model or initialWorldItemDefs, setting empty worldItems');
      this.setWorldItems([]);
      return;
    }
    
    const worldSize = this.getWorldSize();
    const items = mapModel.instantiateWorldItems({
      seed: Date.now(),
      worldW: worldSize.width,
      worldH: worldSize.height
    });
    console.log('[GameMapRenderer] instantiated', items.length, 'world items');
    
    this.setWorldItems(items);
  }

  _loadWorldItemImage(item) {
    const iconPath = item?.definition?.icon;
    console.log('[GameMapRenderer] _loadWorldItemImage:', {
      instanceId: item?.instanceId,
      defId: item?.defId,
      iconPath: iconPath,
      hasDefinition: !!item?.definition,
      definitionKeys: item?.definition ? Object.keys(item.definition) : 'no definition'
    });
    if (!iconPath) {
      // 如果没有 definition.icon，尝试使用 defId 作为 key 查找
      const defId = item?.defId;
      if (defId && typeof InventorySystem !== 'undefined') {
        const def = InventorySystem.getDefinition(defId);
        if (def?.icon) {
          console.log('[GameMapRenderer] using InventorySystem fallback icon:', def.icon);
          item.definition = item.definition || {};
          item.definition.icon = def.icon;
          return this._loadWorldItemImage(item);
        }
      }
      console.warn('[GameMapRenderer] No icon path for worldItem:', item?.instanceId, item?.defId);
      return;
    }
    
    // 使用 AssetManager 解析路径，获取完整的可访问 URL
    const url = this.assetManager.getAssetUrl(iconPath);
    console.log('[GameMapRenderer] loading image url:', url);
    if (!url || this.worldItemImages[url]) return;
    
    const image = new Image();
    image.onload = () => {
      console.log('[GameMapRenderer] image loaded:', url, 'size:', image.naturalWidth, 'x', image.naturalHeight);
      // 强制重绘，确保道具显示
      if (this.canvas && this.mapBackgroundLoaded) {
        this._needsRedraw = true;
      }
    };
    image.onerror = () => {
      console.warn('[GameMapRenderer] image load failed:', url);
      // 加载失败时尝试直接使用路径
      if (url !== iconPath) {
        const fallbackImage = new Image();
        fallbackImage.src = iconPath;
        this.worldItemImages[url] = fallbackImage;
      }
    };
    image.src = url;
    this.worldItemImages[url] = image;
  }

  _drawWorldItem(item) {
    const iconPath = item?.definition?.icon;
    const imageKey = iconPath ? this.assetManager.getAssetUrl(iconPath) : null;
    const image = imageKey ? this.worldItemImages[imageKey] : null;
    const fixed = item.definition?.portable === false;
    const size = fixed ? 50 : 38;
    const x = item.x - this.camera.x;
    const y = item.y - this.camera.y;
    if (x < -50 || y < -60 || x > this.canvas.width + 50 || y > this.canvas.height + 50) return;
    const floatY = Math.sin(this.time * 0.003 + item.x * 0.01) * (fixed ? 1 : 3);
    this.ctx.save();
    const glow = this.ctx.createRadialGradient(x, y - size * .45, 2, x, y - size * .45, size * .72);
    glow.addColorStop(0, 'rgba(255, 236, 166, .55)');
    glow.addColorStop(1, 'rgba(255, 236, 166, 0)');
    this.ctx.fillStyle = glow;
    this.ctx.fillRect(x - size, y - size * 1.4, size * 2, size * 1.7);
    this.ctx.fillStyle = 'rgba(0,0,0,.28)';
    this.ctx.beginPath();
    this.ctx.ellipse(x, y + 3, size * 0.32, 5, 0, 0, Math.PI * 2);
    this.ctx.fill();
    if (image && image.complete && image.naturalWidth > 0) {
      this.ctx.imageSmoothingEnabled = false;
      this.ctx.drawImage(image, x - size / 2, y - size + floatY, size, size);
    } else {
      this.ctx.translate(x, y - size * .52 + floatY);
      this.ctx.rotate(Math.PI / 4);
      this.ctx.fillStyle = '#f2d38a';
      this.ctx.fillRect(-8, -8, 16, 16);
      this.ctx.rotate(-Math.PI / 4);
      this.ctx.translate(-x, -(y - size * .52 + floatY));
    }
    if (this.nearbyWorldItem?.instanceId === item.instanceId) {
      this.ctx.strokeStyle = '#f4d58d';
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(x - size / 2 - 3, y - size - 3 + floatY, size + 6, size + 6);
    }
    this.ctx.restore();
  }

  setSelectedTarget(userId) {
    this.selectedTargetId = userId || '';
  }

  // ===== 万物送信：在途信使地图追踪 =====
  setJourneyMarkers(list) {
    this.journeyMarkers = (list || []).filter(l => l && l.journey && l.journey.status === 'in-transit');
  }

  _drawJourneyMarkers() {
    let list = this.journeyMarkers || [];
    // 兜底：标记为空但 JourneyTracker 有在途数据时（本地缓存刚到达）直接用实时数据
    if (!list.length && window.JourneyTracker && window.JourneyTracker.letters && window.JourneyTracker.letters.length) {
      list = window.JourneyTracker.letters;
    }
    if (!list.length) return;
    const tracker = window.JourneyTracker;
    if (!tracker) return;
    const ctx = this.ctx;
    ctx.save();
    // 在途信件按收信人 y 排序绘制（与角色同深度概念简化）
    for (const letter of list) {
      const j = letter.journey;
      const carrier = (window.CARRIER_ROSTER || []).find(c => c.id === j.carrierId);
      const pts = tracker._eventPositions(letter);
      const done = Math.max(1, (j.events || []).length);
      const sx = this.camera.x, sy = this.camera.y;
      const w = this.canvas.width, h = this.canvas.height;

      // 轨迹虚线（已走）
      ctx.beginPath();
      pts.slice(0, done).forEach((p, i) => {
        const x = p.x - sx, y = p.y - sy;
        if (x < -60 || y < -60 || x > w + 60 || y > h + 60) return;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = 'rgba(176,149,106,0.5)';
      ctx.lineWidth = 1.6;
      ctx.setLineDash([6, 5]);
      ctx.lineDashOffset = -(this.time / 22) % 11;
      ctx.stroke();
      ctx.setLineDash([]);

      // 事件点：已过实心 / 未过空心
      pts.forEach((p, i) => {
        const x = p.x - sx, y = p.y - sy;
        if (x < -30 || y < -30 || x > w + 30 || y > h + 30) return;
        ctx.beginPath();
        ctx.arc(x, y, i < done ? 4 : 3, 0, Math.PI * 2);
        if (i < done) { ctx.fillStyle = '#8a6d3b'; ctx.fill(); }
        else { ctx.strokeStyle = 'rgba(138,109,59,0.5)'; ctx.stroke(); }
      });

      // 当前信使（emoji + 收信人小字）
      const cur = tracker.currentPos(letter);
      const cx = cur.x - sx, cy = cur.y - sy;
      if (cx > -40 && cy > -40 && cx < w + 40 && cy < h + 40) {
        const floatY = Math.sin(this.time * 0.004) * 4;
        ctx.font = '30px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.beginPath();
        ctx.ellipse(cx, cy + 16, 9, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillText(carrier ? carrier.emoji : '✉', cx, cy - 14 + floatY);
        ctx.font = '11px sans-serif';
        ctx.fillStyle = 'rgba(90,70,40,0.85)';
        ctx.fillText(letter.recipient || '', cx, cy + 28);
      }
    }
    ctx.restore();
  }

  showCombatHit(data) {
    const targetId = data.targetAccountKey;
    const position = targetId === MultiplayerSync.accountKey
      ? this.player
      : this.remotePlayers[targetId];
    if (!position) return;
    this.hitFlashUntil[targetId] = Date.now() + 220;
    this.damageNumbers.push({
      x: position.x,
      y: position.y - 58,
      value: data.damage,
      createdAt: Date.now()
    });
  }

  _drawCombatEffects() {
    const now = Date.now();
    if (this.selectedTargetId && this.remotePlayers[this.selectedTargetId]?.visible) {
      const target = this.remotePlayers[this.selectedTargetId];
      const x = target.x - this.camera.x;
      const y = target.y - this.camera.y;
      this.ctx.save();
      this.ctx.strokeStyle = '#d9485f';
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(x - 32, y - 88, 64, 92);
      this.ctx.restore();
    }
    this.damageNumbers = this.damageNumbers.filter(number => now - number.createdAt < 900);
    for (const number of this.damageNumbers) {
      const elapsed = now - number.createdAt;
      this.ctx.save();
      this.ctx.globalAlpha = 1 - elapsed / 900;
      this.ctx.fillStyle = '#ffdf62';
      this.ctx.strokeStyle = '#6b1d25';
      this.ctx.lineWidth = 3;
      this.ctx.font = 'bold 18px sans-serif';
      this.ctx.textAlign = 'center';
      const x = number.x - this.camera.x;
      const y = number.y - this.camera.y - elapsed * 0.035;
      this.ctx.strokeText(`-${number.value}`, x, y);
      this.ctx.fillText(`-${number.value}`, x, y);
      this.ctx.restore();
    }
  }

  setMultiplayerMode(enabled) {
    this.multiplayerMode = enabled;
    if (enabled) {
      this.partner.visible = false;
      this.partner.moving = false;
      this.partner.actionPlaying = false;
      this.duetMode = false;
    }
  }

  async _loadRemotePlayerCharacter(userId, charId) {
    const player = this.remotePlayers[userId];
    if (!player || player.loading) return;
    player.loading = true;
    player.characterId = charId;

    const char = this.getCharacterInfo(charId);
    if (!char) {
      console.warn(`[GameMapRenderer] Character not found for: ${charId}`);
      player.loading = false;
      return;
    }
    player.displayName = char.name || player.displayName;
    player.characterModel = CharacterSystem.getCharacter(charId);

    let frames = {};
    let charType = 'main';

    if (JINGYUAN_CHARACTERS.some(c => c.id === charId) || HANMEN_CHARACTERS.some(c => c.id === charId) || POXIAO_CHARACTERS.some(c => c.id === charId)) {
      const category = JINGYUAN_CHARACTERS.some(c => c.id === charId) ? 'xiejian' : (POXIAO_CHARACTERS.some(c => c.id === charId) ? 'poxiao' : 'hanmen');
      frames = await this.loadSpritesheetFrames(char.dir, category);
      charType = 'jingyuan';
    } else {
      const idlePath = `ui/icons/IconsPropsMonsters/Main Characters/${char.group}/Idle (32x32).png`;
      const runPath = `ui/icons/IconsPropsMonsters/Main Characters/${char.group}/Run (32x32).png`;
      try {
        const idleImg = await this.assetManager.loadImage(idlePath);
        const runImg = await this.assetManager.loadImage(runPath);
        frames['idle'] = [idleImg];
        frames['run'] = [runImg];
      } catch (e) {}
    }

    if (Object.keys(frames).length === 0) {
      console.warn(`[GameMapRenderer] No frames loaded for character: ${charId}`);
      player.loading = false;
      return;
    }

    player.characterFrames = frames;
    player.characterType = charType;
    player.visible = true;
    player.loading = false;
    console.log(`[GameMapRenderer] Remote player loaded: ${userId} -> ${charId}`);
  }

  _getUserInfo(userId) {
    if (typeof AuthManager !== 'undefined' && AuthManager.getUserById) {
      return AuthManager.getUserById(userId);
    }
    return null;
  }

  _updateRemotePlayers(dt) {
    for (const userId of Object.keys(this.remotePlayers)) {
      const player = this.remotePlayers[userId];
      if (!player.visible) continue;

      const dx = player.targetX - player.x;
      const dy = player.targetY - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      const lerpFactor = 0.35;

      if (dist > 0.5) {
        player.x += dx * lerpFactor;
        player.y += dy * lerpFactor;
      } else {
        player.x = player.targetX;
        player.y = player.targetY;
      }

      if (!player.isOnline) {
        if (player.fadeOutStartTime > 0) {
          const elapsed = Date.now() - player.fadeOutStartTime;
          const fadeDuration = 3000;
          player.opacity = Math.max(0, 1 - elapsed / fadeDuration);
        } else {
          player.opacity = Math.max(0, player.opacity - 0.01);
        }
      } else {
        player.opacity = Math.min(1, player.opacity + 0.05);
      }

      this._updateRemotePlayerAnimation(player, dt);

      const world = this.getWorldSize();
      player.x = Math.max(8, Math.min(world.width - 8, player.x));
      player.y = Math.max(12, Math.min(world.height - 4, player.y));
    }
  }

  _updateRemotePlayerAnimation(player, dt) {
    const frames = player.characterFrames[player.action];
    if (!frames || frames.length === 0) return;

    let frameSpeed = 180;
    if (player.characterType === 'jingyuan') {
      const configured = player.characterModel?.getAction(player.action)?.frameInterval;
      const isXiejianCharacter = JINGYUAN_CHARACTERS.some(character => character.id === player.characterId) || POXIAO_CHARACTERS.some(character => character.id === player.characterId);
      const actionSpeeds = {
        personality: isXiejianCharacter ? 3000 : 240,
        run: 105,
        etiquette: 220,
        martial: 110,
        signature: 180,
      };
      frameSpeed = configured || actionSpeeds[player.action] || 180;
    } else {
      frameSpeed = player.moving ? 100 : 200;
    }

    player.frameTimer += dt;
    if (player.frameTimer >= frameSpeed) {
      player.frameTimer = 0;
      player.frame++;

      if (player.frame >= frames.length) {
        if (player.actionOnce && player.actionPlaying && !player.actionHold) {
          player.actionPlaying = false;
          player.action = player.moving ? (player.characterType === 'jingyuan' ? 'run' : 'run') : (player.characterType === 'jingyuan' ? 'personality' : 'idle');
          player.frame = 0;
        } else {
          player.frame = 0;
        }
      }
    }

    if (player.actionHold && player.actionStartTime) {
      const elapsed = Date.now() - player.actionStartTime;
      if (elapsed >= player.actionDuration) {
        player.actionHold = false;
        player.actionPlaying = false;
        player.actionOnce = false;
        player.action = player.characterType === 'jingyuan' ? 'personality' : 'idle';
        player.frame = 0;
        player.actionStartTime = null;
      }
    }
  }

  renderPlayerNameTags() {
    const drawNameTag = (x, y, name, isLocal = false, opacity = 1, combat = null) => {
      if (!name) return;
      const screenX = x - this.camera.x;
      const screenY = y - this.camera.y - 30;

      this.ctx.save();
      this.ctx.globalAlpha = opacity;
      this.ctx.font = 'bold 12px "Noto Sans SC", sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';

      this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
      this.ctx.lineWidth = 3;
      this.ctx.strokeText(name, screenX, screenY);

      this.ctx.fillStyle = isLocal ? '#ffd700' : '#ffffff';
      this.ctx.fillText(name, screenX, screenY);
      if (combat) {
        const ratio = Math.max(0, Math.min(1, combat.hp / (combat.maxHp || 100)));
        this.ctx.fillStyle = 'rgba(24, 20, 18, .8)';
        this.ctx.fillRect(screenX - 24, screenY + 10, 48, 5);
        this.ctx.fillStyle = ratio > 0.35 ? '#5fb878' : '#d9485f';
        this.ctx.fillRect(screenX - 24, screenY + 10, 48 * ratio, 5);
        const icons = Object.values(combat.equipment || {}).slice(0, 3);
        if (icons.length) {
          const startX = screenX - ((icons.length - 1) * 7);
          icons.forEach((equipment, index) => {
            if (!this.worldItemImages[equipment.icon]) {
              const image = new Image();
              image.src = equipment.icon;
              this.worldItemImages[equipment.icon] = image;
            }
            const image = this.worldItemImages[equipment.icon];
            if (image?.complete) {
              this.ctx.drawImage(image, startX + index * 14 - 6, screenY + 17, 12, 12);
            }
          });
        }
      }

      this.ctx.restore();
    };

    for (const userId of Object.keys(this.remotePlayers)) {
      const player = this.remotePlayers[userId];
      if (!player.visible) continue;
      const displayName = player.displayName || userId;
      const opacity = player.opacity !== undefined ? player.opacity : 1;
      drawNameTag(player.x, player.y, displayName, false, opacity, player.combat || null);
    }

    const currentUser = this._getCurrentUser();
    if (currentUser) {
      const selectedCharacter = this.getCharacterInfo(this.selectedCharacter);
      const localName = (this.selectedCategory === 'xiejian' || this.selectedCategory === 'poxiao') && selectedCharacter
        ? selectedCharacter.name
        : (currentUser.displayName || currentUser.username);
      drawNameTag(this.player.x, this.player.y, localName, true, 1, MultiplayerSync.combatProfile || null);
    }
  }

  _getCurrentUser() {
    if (typeof AuthManager !== 'undefined' && AuthManager.getCurrentUser) {
      return AuthManager.getCurrentUser();
    }
    return null;
  }

  _drawPlayerAura(x, y) {
    const screenX = x - this.camera.x;
    const screenY = y - this.camera.y;

    const radius = 25 + Math.sin(this.time * 0.003) * 3;

    const gradient = this.ctx.createRadialGradient(screenX, screenY + 2, 0, screenX, screenY + 2, radius);
    gradient.addColorStop(0, 'rgba(255, 215, 0, 0.3)');
    gradient.addColorStop(0.5, 'rgba(255, 215, 0, 0.15)');
    gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');

    this.ctx.save();
    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.ellipse(screenX, screenY + 2, radius, radius * 0.4, 0, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.restore();
  }

  _drawRemotePlayer(x, y, player) {
    const frames = player.characterFrames[player.action];
    if (!frames || frames.length === 0) return;

    const frame = frames[player.frame % frames.length];
    if (!frame) return;

    const scale = player.characterType === 'jingyuan' ? 0.5 : 1;
    const w = frame.width * scale;
    const h = frame.height * scale;
    
    const floatY = player.moving ? 0 : Math.sin(this.time * 0.003 + Math.PI) * 2;

    this.ctx.save();
    this.ctx.globalAlpha = player.opacity !== undefined ? player.opacity : 1;
    if (Date.now() < (this.hitFlashUntil[player.userId] || 0)) {
      this.ctx.globalAlpha *= 0.45 + (Math.floor(Date.now() / 50) % 2) * 0.45;
    }
    this.ctx.imageSmoothingEnabled = false;

    this.ctx.fillStyle = 'rgba(0,0,0,0.25)';
    this.ctx.beginPath();
    this.ctx.ellipse(x, y + 2, w * 0.35, h * 0.12, 0, 0, Math.PI * 2);
    this.ctx.fill();

    if (player.direction === 'left') {
      this.ctx.translate(x + w / 2, y - h + floatY);
      this.ctx.scale(-1, 1);
      this.ctx.drawImage(frame, -w / 2, 0, w, h);
    } else {
      this.ctx.drawImage(frame, x - w / 2, y - h + floatY, w, h);
    }

    this.ctx.restore();
  }

  showChatBubble(userId, content) {
    if (!content || !content.trim()) return;

    const now = Date.now();
    this.chatBubbles[userId] = {
      content: content,
      createdAt: now,
      opacity: 1,
      fading: false
    };

    let el = this._chatBubbleElements[userId];
    if (!el) {
      el = document.createElement('div');
      el.className = 'chat-bubble';
      this.container.appendChild(el);
      this._chatBubbleElements[userId] = el;
    }

    el.textContent = content;
    el.style.opacity = '1';
    el.style.display = 'block';

    const playerPos = this._getPlayerWorldPosition(userId);
    if (playerPos) {
      const screenX = playerPos.x - this.camera.x;
      const screenY = playerPos.y - this.camera.y - 48;
      el.style.left = screenX + 'px';
      el.style.top = screenY + 'px';
    }
  }

  _updateChatBubbles(dt) {
    const now = Date.now();

    for (const userId of Object.keys(this.chatBubbles)) {
      const bubble = this.chatBubbles[userId];
      const elapsed = now - bubble.createdAt;

      if (elapsed > this.chatBubbleDuration) {
        if (!bubble.fading) {
          bubble.fading = true;
          bubble.fadeStart = now;
        }
        const fadeElapsed = now - bubble.fadeStart;
        if (fadeElapsed >= this.chatBubbleFadeDuration) {
          delete this.chatBubbles[userId];
          const el = this._chatBubbleElements[userId];
          if (el) {
            el.style.display = 'none';
          }
          continue;
        } else {
          bubble.opacity = 1 - fadeElapsed / this.chatBubbleFadeDuration;
        }
      }

      const el = this._chatBubbleElements[userId];
      if (el) {
        const playerPos = this._getPlayerWorldPosition(userId);
        if (playerPos) {
          const screenX = playerPos.x - this.camera.x;
          const screenY = playerPos.y - this.camera.y - 48;
          el.style.left = screenX + 'px';
          el.style.top = screenY + 'px';
          el.style.opacity = bubble.opacity;
        }
      }
    }
  }

  _getPlayerWorldPosition(userId) {
    const currentUser = this._getCurrentUser();
    const accountKey = (typeof MultiplayerSync !== 'undefined') ? MultiplayerSync.accountKey : '';
    if (currentUser && (userId === currentUser.id || userId === accountKey)) {
      return { x: this.player.x, y: this.player.y };
    }
    const remote = this.remotePlayers[userId];
    if (remote && remote.visible) {
      return { x: remote.x, y: remote.y };
    }
    return null;
  }

  _updateInteractionDetection() {
    if (this.interacting) return;

    let nearestPlayer = null;
    let nearestDist = Infinity;

    for (const userId of Object.keys(this.remotePlayers)) {
      const player = this.remotePlayers[userId];
      if (!player.visible || !player.isOnline) continue;

      const dx = player.x - this.player.x;
      const dy = player.y - this.player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < this.interactDistance && dist < nearestDist) {
        nearestDist = dist;
        nearestPlayer = player;
      }
    }

    this.nearbyPlayer = nearestPlayer;
    this._updateInteractHint();
  }

  _updateInteractHint() {
    if (!this.nearbyPlayer) {
      if (this.interactHintElement && this.interactHintElement.style.display !== 'none') {
        this.interactHintElement.style.display = 'none';
      }
      return;
    }

    if (!this.interactHintElement) {
      this.interactHintElement = document.createElement('div');
      this.interactHintElement.className = 'interact-hint';
      this.interactHintElement.textContent = '按空格互动';
      this.container.appendChild(this.interactHintElement);
    }

    const player = this.nearbyPlayer;
    const screenX = player.x - this.camera.x;
    const screenY = player.y - this.camera.y - 50;

    if (this.interactHintElement.style.display !== 'block') {
      this.interactHintElement.style.display = 'block';
    }
    if (this._lastHintX !== screenX || this._lastHintY !== screenY) {
      this.interactHintElement.style.left = screenX + 'px';
      this.interactHintElement.style.top = screenY + 'px';
      this._lastHintX = screenX;
      this._lastHintY = screenY;
    }
  }

  _findRemotePlayerAtPosition(worldX, worldY) {
    for (const userId of Object.keys(this.remotePlayers)) {
      const player = this.remotePlayers[userId];
      if (!player.visible || !player.isOnline) continue;

      const withinX = Math.abs(worldX - player.x) <= 42;
      const withinY = worldY >= player.y - 105 && worldY <= player.y + 18;
      if (withinX && withinY) {
        return player;
      }
    }
    return null;
  }

  tryInteract() {
    if (!this.multiplayerMode || this.interacting) return;
    if (!this.nearbyPlayer) return;

    this._initiateInteract(this.nearbyPlayer.userId, 'greet');
  }

  _initiateInteract(targetUserId, actionType) {
    if (this.interacting) return;

    const targetPlayer = this.remotePlayers[targetUserId];
    if (!targetPlayer || !targetPlayer.visible || !targetPlayer.isOnline) return;

    this.interacting = true;
    this.interactPartnerId = targetUserId;
    this.interactType = actionType;
    this.interactState = 'moving';

    this.interactSavedState = {
      playerX: this.player.x,
      playerY: this.player.y,
      playerAction: this.player.action,
      playerMoving: this.player.moving,
      playerPath: [...this.player.path],
      playerPathIndex: this.player.pathIndex,
    };

    this.player.path = [];
    this.player.pathIndex = 0;
    this.player.moving = false;

    this._moveToInteractPosition(targetUserId);

    if (typeof window !== 'undefined' && window.multiplayerInteractCallback) {
      window.multiplayerInteractCallback(targetUserId, actionType);
    }
  }

  _moveToInteractPosition(targetUserId) {
    const target = this.remotePlayers[targetUserId];
    if (!target) return;

    const dx = this.player.x - target.x;
    const dy = this.player.y - target.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    const interactDist = 30;

    if (dist > interactDist) {
      const ratio = interactDist / dist;
      const targetX = target.x + dx * ratio;
      const targetY = target.y + dy * ratio;
      this.player.x = targetX;
      this.player.y = targetY;
    }

    if (dx >= 0) {
      this.player.direction = 'left';
    } else {
      this.player.direction = 'right';
    }

    setTimeout(() => {
      this._startInteractAction();
    }, 200);
  }

  _startInteractAction() {
    if (this.interactType === 'greet') {
      this.playAction('etiquette');
      this.interactState = 'playing';

      const checkActionEnd = () => {
        if (!this.player.actionPlaying) {
          this._endInteract();
        } else {
          requestAnimationFrame(checkActionEnd);
        }
      };
      setTimeout(() => checkActionEnd(), 100);
    }
  }

  _endInteract() {
    if (this.interactSavedState) {
      this.player.x = this.interactSavedState.playerX;
      this.player.y = this.interactSavedState.playerY;
      this.player.action = this.interactSavedState.playerAction;
      this.player.moving = this.interactSavedState.playerMoving;
      this.player.path = this.interactSavedState.playerPath;
      this.player.pathIndex = this.interactSavedState.playerPathIndex;
      this.interactSavedState = null;
    }

    this.interacting = false;
    this.interactPartnerId = null;
    this.interactType = null;
    this.interactState = 'idle';
  }

  handleRemoteInteract(fromUserId, actionType) {
    if (this.interacting) return;

    const fromPlayer = this.remotePlayers[fromUserId];
    if (!fromPlayer || !fromPlayer.visible || !fromPlayer.isOnline) return;

    const dx = fromPlayer.x - this.player.x;
    const dy = fromPlayer.y - this.player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > this.interactDistance * 2) return;

    this.interacting = true;
    this.interactPartnerId = fromUserId;
    this.interactType = actionType;
    this.interactState = 'moving';

    this.interactSavedState = {
      playerX: this.player.x,
      playerY: this.player.y,
      playerAction: this.player.action,
      playerMoving: this.player.moving,
      playerPath: [...this.player.path],
      playerPathIndex: this.player.pathIndex,
    };

    this.player.path = [];
    this.player.pathIndex = 0;
    this.player.moving = false;

    const interactDist = 30;
    if (dist > interactDist) {
      const ratio = interactDist / dist;
      this.player.x = fromPlayer.x - dx * ratio;
      this.player.y = fromPlayer.y - dy * ratio;
    }

    if (dx >= 0) {
      this.player.direction = 'right';
    } else {
      this.player.direction = 'left';
    }

    setTimeout(() => {
      if (actionType === 'greet') {
        this.playAction('etiquette');
        this.interactState = 'playing';

        const checkActionEnd = () => {
          if (!this.player.actionPlaying) {
            this._endInteract();
          } else {
            requestAnimationFrame(checkActionEnd);
          }
        };
        setTimeout(() => checkActionEnd(), 100);
      }
    }, 300);
  }

  destroy() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }
    if (this._resizeHandler) {
      window.removeEventListener('resize', this._resizeHandler);
      this._resizeHandler = null;
    }
    window.removeEventListener('keydown', this.keyDownHandler);
    window.removeEventListener('keyup', this.keyUpHandler);
    if (this.canvas) {
      this.canvas.removeEventListener('click', this.clickHandler);
      if (this.canvas.parentNode) {
        this.canvas.parentNode.removeChild(this.canvas);
      }
    }

    if (this.interactHintElement && this.interactHintElement.parentNode) {
      this.interactHintElement.parentNode.removeChild(this.interactHintElement);
      this.interactHintElement = null;
    }

    for (const userId of Object.keys(this._chatBubbleElements)) {
      const el = this._chatBubbleElements[userId];
      if (el && el.parentNode) {
        el.parentNode.removeChild(el);
      }
    }
    this._chatBubbleElements = {};
    this.chatBubbles = {};
  }
}

export { JINGYUAN_CHARACTERS, HANMEN_CHARACTERS, POXIAO_CHARACTERS, MAIN_CHARACTERS, CHARACTER_CATEGORIES };
