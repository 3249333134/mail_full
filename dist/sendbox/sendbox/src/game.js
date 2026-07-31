import { TILE, TILE_TYPE, TILE_NAMES, TILE_LIST } from './gameConfig.js';
import { MapManager, PRESET_MAPS } from './mapManager.js';
import { NPCManager } from './npcManager.js';
import { DialogSystem } from './dialogSystem.js';
import { PixelArt } from './pixelArt.js';
import { Pathfinder } from './pathfinder.js';
import { Player } from './player.js';
import { ALGORITHMS, PRESET_FILTERS } from './pixelMapGenerator.js';
import { AssetManager } from './assetManager.js';
import { ASSET_CATEGORIES } from './assetManifest.js';
import { FarmSystem, CROPS, ANIMALS, ANIMAL_BUILDINGS, SEASONS, SEASON_NAMES } from './farmSystem.js';
import { BattleSystem, MONSTERS, BOSS_MONSTERS, MAX_MINE_FLOOR } from './battleSystem.js';
import { QuestSystem, STORY_QUESTS, QUEST_TYPES, CHAPTER_NAMES } from './questSystem.js';
import { SaveSystem } from './saveSystem.js';

export class Game {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.viewW = 0;
    this.viewH = 0;

    this.state = 'menu';
    this.editMode = false;

    this.mapManager = new MapManager();
    this.npcManager = new NPCManager();
    this.dialogSystem = new DialogSystem();
    this.player = new Player();
    this.pathfinder = null;

    this.farmSystem = new FarmSystem();
    this.battleSystem = new BattleSystem();
    this.questSystem = new QuestSystem();
    this.saveSystem = new SaveSystem();

    this.camera = { x: 0, y: 0 };
    this.keys = {};
    this.mouse = { x: 0, y: 0, down: false, rightDown: false };
    this.selectedTile = TILE_TYPE.GRASS;

    this.time = 0;
    this.lastTime = 0;
    this.rafId = null;

    this.generatorImage = null;
    this.generatorPreviewCtx = null;

    this.assetState = {
      category: 'characters',
      page: 0,
      pageSize: 24,
      selectedItem: null,
      target: 'browse',
      returnToCustomize: false,
      filterText: '',
      selectedGroup: null,
    };
    this.assetCatList = [];
    this.customizeReturnState = 'menu';

    this.selectedSeed = null;
    this.showFarmPanel = false;
    this.showBattlePanel = false;
    this.showQuestPanel = false;
    this.farmPanelMode = 'status';
    this.pendingInteraction = null;
    this.restoredPlayerPosition = null;
  }

  init() {
    this.canvas = document.getElementById('game');
    this.ctx = this.canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;

    this.resize();
    window.addEventListener('resize', () => this.resize());

    this.setupInput();
    this.buildTileBar();
    this.buildCustomizePanel();
    this.buildMapSelect();
    this.initAssetLibrary();
    this.updateSpriteSlotUI();

    this.mapManager.loadMap(0);
    this.pathfinder = new Pathfinder(this.mapManager);
    const spawnPos = this.mapManager.getSafeSpawnPosition();
    this.player.setPosition(spawnPos.x, spawnPos.y);
    this.restoreGame();

    this.lastTime = performance.now();
    this.loop();

    this.initMapGenerator();
  }

  initMapGenerator() {
    const previewCanvas = document.getElementById('generator-preview');
    this.generatorPreviewCtx = previewCanvas.getContext('2d');
    this.generatorPreviewCtx.imageSmoothingEnabled = false;

    const fileInput = document.getElementById('generator-file-input');
    const fileWrapper = document.querySelector('#map-generator-overlay .file-input-wrapper');
    
    fileInput.addEventListener('change', (e) => this.handleGeneratorImageUpload(e));
    fileWrapper.addEventListener('click', () => fileInput.click());
    fileWrapper.setAttribute('role', 'button');
    fileWrapper.setAttribute('tabindex', '0');
    fileWrapper.setAttribute('aria-label', '选择或拖拽图片生成地图');
    fileWrapper.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        fileInput.click();
      }
    });
    fileWrapper.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    });
    fileWrapper.addEventListener('drop', (e) => {
      e.preventDefault();
      const file = Array.from(e.dataTransfer.files || []).find(item => item.type.startsWith('image/'));
      if (file) this.loadGeneratorImage(file);
    });

    document.getElementById('generator-algorithm').addEventListener('change', () => this.updateGeneratorPreview());
    document.getElementById('generator-strength').addEventListener('input', (e) => {
      document.getElementById('generator-strength-value').textContent = e.target.value;
      this.updateGeneratorPreview();
    });
    document.getElementById('generator-scale').addEventListener('change', () => this.updateGeneratorPreview());
    document.getElementById('generator-filter-preset').addEventListener('change', (e) => {
      const preset = PRESET_FILTERS[e.target.value];
      if (preset) {
        document.getElementById('generator-brightness').value = preset.brightness;
        document.getElementById('generator-brightness-value').textContent = preset.brightness;
        document.getElementById('generator-contrast').value = preset.contrast;
        document.getElementById('generator-contrast-value').textContent = preset.contrast;
        document.getElementById('generator-saturation').value = preset.saturation;
        document.getElementById('generator-saturation-value').textContent = preset.saturation;
        document.getElementById('generator-sharpness').value = preset.sharpness;
        document.getElementById('generator-sharpness-value').textContent = preset.sharpness;
        document.getElementById('generator-hue').value = preset.hue;
        document.getElementById('generator-hue-value').textContent = preset.hue;
        document.getElementById('generator-temperature').value = preset.temperature;
        document.getElementById('generator-temperature-value').textContent = preset.temperature;
        this.updateGeneratorPreview();
      }
    });

    const bindSlider = (id) => {
      const slider = document.getElementById(id);
      const value = document.getElementById(id + '-value');
      slider.addEventListener('input', (e) => {
        value.textContent = e.target.value;
        this.updateGeneratorPreview();
      });
    };
    bindSlider('generator-brightness');
    bindSlider('generator-contrast');
    bindSlider('generator-saturation');
    bindSlider('generator-sharpness');
    bindSlider('generator-hue');
    bindSlider('generator-temperature');
  }

  resize() {
    this.viewW = window.innerWidth;
    this.viewH = window.innerHeight;
    this.canvas.width = this.viewW;
    this.canvas.height = this.viewH;
    this.ctx.imageSmoothingEnabled = false;
  }

  setupInput() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;

      if (e.key === 'Escape') {
        if (this.state === 'asset-library') {
          this.closeAssetLibrary();
        } else if (this.state === 'playing' || this.state === 'dialog') {
          this.backToMenu();
        } else if (this.state !== 'menu') {
          this.backToMenu();
        }
        return;
      }

      if (this.state === 'playing') {
        if (e.key.toLowerCase() === 'e') {
          this.tryInteract();
        }
        if (e.key.toLowerCase() === 'm') {
          this.toggleEditMode();
        }
        if (e.key.toLowerCase() === 'c') {
          this.showCustomize();
        }
        if (e.key === ',') {
          this.previousMap();
        }
        if (e.key === '.') {
          this.nextMap();
        }
        // 静远七人角色专属动作触发
        if (this.player.characterFrames) {
          if (e.key === ' ') {
            // 空格：武艺攻击
            this.player.playActionOnce('martial');
            e.preventDefault();
          } else if (e.key.toLowerCase() === 'q') {
            // Q：拱手礼，0.9 秒后尝试与 NPC 交互
            this.player.playActionOnce('etiquette');
            if (this.etiquetteTimer) clearTimeout(this.etiquetteTimer);
            this.etiquetteTimer = setTimeout(() => {
              this.tryInteract();
              this.etiquetteTimer = null;
            }, 900);
          } else if (e.key.toLowerCase() === 'r') {
            // R：招牌大招
            this.player.playActionOnce('signature');
          }
        }
        if (this.editMode) {
          const num = parseInt(e.key);
          if (num >= 1 && num <= TILE_LIST.length) {
            this.selectTile(TILE_LIST[num - 1]);
          }
        }
      }

      if (this.state === 'dialog') {
        if (e.key === ' ' || e.key === 'Enter') {
          this.dialogSystem.advanceDialog();
          e.preventDefault();
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
    });

    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top;
    });

    this.canvas.addEventListener('mousedown', (e) => {
      if (e.button === 0) this.mouse.down = true;
      if (e.button === 2) this.mouse.rightDown = true;
      if (this.editMode && this.state === 'playing') {
        this.paintTile(e.button === 2);
      } else if (e.button === 0 && this.state === 'playing') {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const worldX = mouseX + this.camera.x;
        const worldY = mouseY + this.camera.y;
        this.handleWorldClick(worldX, worldY);
      }
    });

    this.canvas.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.mouse.down = false;
      if (e.button === 2) this.mouse.rightDown = false;
    });

    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    this.canvas.addEventListener('mousemove', (e) => {
      if (this.editMode && this.state === 'playing' && (this.mouse.down || this.mouse.rightDown)) {
        this.paintTile(this.mouse.rightDown);
      }
    });

    this.canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1 && this.state === 'playing' && !this.editMode) {
        const rect = this.canvas.getBoundingClientRect();
        const touch = e.touches[0];
        const mouseX = touch.clientX - rect.left;
        const mouseY = touch.clientY - rect.top;
        const worldX = mouseX + this.camera.x;
        const worldY = mouseY + this.camera.y;
        this.handleWorldClick(worldX, worldY);
      }
    }, { passive: true });

    document.getElementById('btn-interact').addEventListener('click', () => {
      if (this.state === 'dialog') {
        this.dialogSystem.advanceDialog();
      } else if (this.state === 'playing') {
        this.tryInteract();
      }
    });
    document.getElementById('btn-edit').addEventListener('click', () => {
      if (this.state === 'playing') this.toggleEditMode();
    });
    document.getElementById('btn-customize').addEventListener('click', () => {
      if (this.state === 'playing' || this.state === 'menu') this.showCustomize();
    });

    document.getElementById('dialog-box').addEventListener('click', () => {
      if (this.state === 'dialog') {
        this.dialogSystem.advanceDialog();
      }
    });

    // 精灵图槽事件（显式绑定，避免 inline onclick 失效）
    const slotEmpty = document.getElementById('sprite-slot-empty');
    if (slotEmpty) {
      slotEmpty.addEventListener('click', () => this.clearPlayerSprite());
    }
    const slotPick = document.getElementById('sprite-slot-pick');
    if (slotPick) {
      slotPick.addEventListener('click', () => this.pickPlayerSprite());
    }

    // 素材库分页/应用按钮事件（显式绑定）
    const applyBtn = document.getElementById('asset-apply-btn');
    if (applyBtn) {
      applyBtn.addEventListener('click', () => this.applySelectedAsset());
    }
    const prevPageBtn = document.getElementById('asset-prev-page');
    if (prevPageBtn) {
      prevPageBtn.addEventListener('click', () => this.assetPrevPage());
    }
    const nextPageBtn = document.getElementById('asset-next-page');
    if (nextPageBtn) {
      nextPageBtn.addEventListener('click', () => this.assetNextPage());
    }

    // 静远七人动作按钮事件
    const btnMartial = document.getElementById('jy-btn-martial');
    const btnEtiquette = document.getElementById('jy-btn-etiquette');
    const btnSignature = document.getElementById('jy-btn-signature');
    if (btnMartial) {
      btnMartial.addEventListener('click', () => this.triggerJingyuanAction('martial'));
    }
    if (btnEtiquette) {
      btnEtiquette.addEventListener('click', () => this.triggerJingyuanAction('etiquette'));
    }
    if (btnSignature) {
      btnSignature.addEventListener('click', () => this.triggerJingyuanAction('signature'));
    }
  }

  // 触发静远七人单次动作（martial/etiquette/signature）
  triggerJingyuanAction(action) {
    if (this.state !== 'playing') return;
    if (!this.player.characterFrames) return;
    // 单次动作播放中，禁止重复触发
    if (this.player.actionOverride && !this.player.actionOnceDone) return;

    this.player.playActionOnce(action);
    this.updateJingyuanActionButtons();

    // etiquette 动作播放 900ms 后尝试与 NPC 交互
    if (action === 'etiquette') {
      if (this.etiquetteTimer) clearTimeout(this.etiquetteTimer);
      this.etiquetteTimer = setTimeout(() => {
        this.tryInteract();
        this.etiquetteTimer = null;
      }, 900);
    }
  }

  // 更新静远七人动作按钮的显示/禁用状态
  updateJingyuanActionButtons() {
    const bar = document.getElementById('jingyuan-action-bar');
    if (!bar) return;

    // 仅在玩家使用静远角色且处于 playing 状态时显示
    const shouldShow = this.player.characterFrames && this.state === 'playing';
    bar.classList.toggle('hidden', !shouldShow);

    // 动作播放中禁用所有按钮
    const isPlaying = this.player.actionOverride && !this.player.actionOnceDone;
    ['jy-btn-martial', 'jy-btn-etiquette', 'jy-btn-signature'].forEach(id => {
      const btn = document.getElementById(id);
      if (btn) btn.disabled = isPlaying;
    });
  }

  // 更新 HUD 中的动作状态徽章
  updateActionBadge() {
    const badge = document.getElementById('action-badge');
    if (!badge) return;

    if (!this.player.characterFrames) {
      badge.classList.add('hidden');
      return;
    }
    badge.classList.remove('hidden');

    let text = '待机';
    let color = '#9b59b6';
    if (this.player.actionOverride) {
      const map = {
        martial: ['打斗', '#e74c3c'],
        etiquette: ['行礼', '#5fcde4'],
        signature: ['招牌', '#9b59b6'],
      };
      const m = map[this.player.actionOverride];
      if (m) { text = m[0]; color = m[1]; }
    } else if (this.player.moving) {
      text = '移动';
      color = '#a3d26a';
    } else {
      text = '待机';
      color = '#9b59b6';
    }
    badge.textContent = text;
    badge.style.background = color;
  }

  buildTileBar() {
    const bar = document.getElementById('tile-bar');
    bar.innerHTML = '';
    TILE_LIST.forEach((tile, i) => {
      const slot = document.createElement('button');
      slot.type = 'button';
      slot.className = 'tile-slot' + (tile === this.selectedTile ? ' active' : '');
      slot.dataset.tile = tile;

      const num = document.createElement('span');
      num.className = 'num';
      num.textContent = i + 1;
      slot.appendChild(num);

      const cv = document.createElement('canvas');
      cv.width = 32;
      cv.height = 32;
      cv.style.imageRendering = 'pixelated';
      const c = cv.getContext('2d');
      c.imageSmoothingEnabled = false;
      PixelArt.drawTile(c, tile, 0, 0, 0);
      slot.appendChild(cv);

      slot.title = TILE_NAMES[tile] + ' (' + (i+1) + ')';
      slot.setAttribute('aria-label', '选择瓦片：' + TILE_NAMES[tile]);
      slot.addEventListener('click', () => this.selectTile(tile));
      bar.appendChild(slot);
    });

    const uploadBtn = document.createElement('button');
    uploadBtn.type = 'button';
    uploadBtn.className = 'tile-slot upload-btn';
    uploadBtn.title = '上传图片转像素地图';
    uploadBtn.setAttribute('aria-label', '上传图片转像素地图');
    uploadBtn.innerHTML = '<span class="upload-icon">📷</span>';

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';
    fileInput.addEventListener('change', (e) => this.handleImageUpload(e));
    bar.appendChild(fileInput);
    uploadBtn.addEventListener('click', () => fileInput.click());
    bar.appendChild(uploadBtn);
  }

  buildCustomizePanel() {
    const skinColors = ['#f5c89a', '#e8b896', '#d4a574', '#c68642', '#8d5524'];
    const shirtColors = ['#5fcde4', '#ff6b6b', '#a3d26a', '#f9a03f', '#9b59b6', '#f1c40f', '#e74c3c', '#1abc9c'];
    const hairColors = ['#8b4513', '#2c2c2c', '#ffd700', '#c8c8c8', '#ff6b9d', '#8b0000', '#4a4a4a'];

    const skinDiv = document.getElementById('skin-colors');
    const shirtDiv = document.getElementById('shirt-colors');
    const hairStyleDiv = document.getElementById('hair-styles');
    const hairColorDiv = document.getElementById('hair-colors');

    const makeSwatches = (container, colors, key) => {
      container.innerHTML = '';
      colors.forEach(c => {
        const sw = document.createElement('button');
        sw.type = 'button';
        sw.className = 'color-swatch';
        sw.style.background = c;
        sw.setAttribute('aria-label', `选择${key === 'skin' ? '肤色' : key === 'shirt' ? '衣服颜色' : '发色'} ${c}`);
        if (this.player.color[key] === c) sw.classList.add('active');
        sw.addEventListener('click', () => {
          this.player.color[key] = c;
          container.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
          sw.classList.add('active');
          this.updatePreview();
        });
        container.appendChild(sw);
      });
    };

    makeSwatches(skinDiv, skinColors, 'skin');
    makeSwatches(shirtDiv, shirtColors, 'shirt');
    makeSwatches(hairColorDiv, hairColors, 'hair');

    hairStyleDiv.innerHTML = '';
    const hairNames = ['短发', '长发', '老年'];
    for (let i = 0; i < 3; i++) {
      const opt = document.createElement('button');
      opt.type = 'button';
      opt.className = 'hair-option' + (this.player.color.hairStyle === i ? ' active' : '');
      const cv = document.createElement('canvas');
      cv.width = 24;
      cv.height = 32;
      cv.style.imageRendering = 'pixelated';
      const c = cv.getContext('2d');
      c.imageSmoothingEnabled = false;
      PixelArt.drawCharacter(c, 12, 30, {
        shirt: this.player.color.shirt,
        skin: this.player.color.skin,
        hair: this.player.color.hair,
        hairStyle: i,
        direction: 'down',
        frame: 0,
        scale: 1,
      }, 0);
      opt.appendChild(cv);
      opt.title = hairNames[i];
      opt.setAttribute('aria-label', '选择发型：' + hairNames[i]);
      opt.addEventListener('click', () => {
        this.player.color.hairStyle = i;
        hairStyleDiv.querySelectorAll('.hair-option').forEach(s => s.classList.remove('active'));
        opt.classList.add('active');
        this.updatePreview();
      });
      hairStyleDiv.appendChild(opt);
    }

    this.updateSpriteSlotUI();
    this.updatePreview();
  }

  updatePreview() {
    const cv = document.getElementById('preview-canvas');
    if (!cv) return;
    const c = cv.getContext('2d');
    c.imageSmoothingEnabled = false;
    c.clearRect(0, 0, cv.width, cv.height);
    if (this.player.characterFrames) {
      // 静远七人预览：显示当前动作的当前帧
      const img = this.player.getCurrentActionFrame();
      if (img) {
        PixelArt.drawJingyuanSprite(c, img, 48, 110, { scale: 1.0, targetH: 96 });
      }
    } else if (this.player.hasSprite()) {
      const sp = this.player.sprite;
      PixelArt.drawSprite(c, sp.image, 48, 110, {
        frameSize: sp.frameSize,
        frameHeight: sp.frameHeight,
        frame: Math.floor(this.time / 300) % Math.max(1, Math.floor(sp.image.width / sp.frameSize)),
        direction: 'down',
        scale: 3,
        srcX: sp.srcX,
        srcY: sp.srcY,
      });
    } else {
      PixelArt.drawCharacter(c, 48, 100, {
        ...this.player.color,
        direction: 'down',
        frame: Math.floor(this.time / 300) % 2,
        scale: 3,
      }, this.time);
    }
  }

  buildMapSelect() {
    const grid = document.getElementById('map-select-grid');
    grid.innerHTML = '';
    const allMaps = this.mapManager.getAllMaps();

    allMaps.forEach((m, i) => {
      const card = document.createElement('div');
      card.className = 'map-card' + (i === this.mapManager.selectedMapIndex ? ' active' : '');
      card.dataset.index = i;

      const cv = document.createElement('canvas');
      cv.width = 60;
      cv.height = 40;
      const ctx = cv.getContext('2d');
      ctx.imageSmoothingEnabled = false;

      let mapData;
      if (m.generator) {
        mapData = m.generator();
      } else if (m.data) {
        mapData = m.data;
      }

      for (let y = 0; y < 40; y++) {
        for (let x = 0; x < 60; x++) {
          const colors = {
            [TILE_TYPE.GRASS]: '#7ec850',
            [TILE_TYPE.SAND]: '#f4d58d',
            [TILE_TYPE.STONE]: '#8b8b8b',
            [TILE_TYPE.WATER]: '#4a90d9',
            [TILE_TYPE.TREE]: '#4a8c3a',
            [TILE_TYPE.FLOWER]: '#ff6b6b',
            [TILE_TYPE.FLOWER2]: '#5fcde4',
            [TILE_TYPE.HOUSE]: '#e8d4b8',
            [TILE_TYPE.ROAD]: '#c9a86c',
            [TILE_TYPE.BUSH]: '#4a8c3a',
            [TILE_TYPE.DIRT]: '#a0522d',
            [TILE_TYPE.ROCK]: '#696969',
            [TILE_TYPE.ICE]: '#b0e0e6',
            [TILE_TYPE.LAVA]: '#ff4500',
            [TILE_TYPE.BRICK]: '#cd5c5c',
            [TILE_TYPE.WOOD]: '#deb887',
            [TILE_TYPE.MUSHROOM]: '#ff69b4',
            [TILE_TYPE.CACTUS]: '#228b22',
            [TILE_TYPE.SNOW]: '#ffffff',
            [TILE_TYPE.BRIDGE]: '#8b4513',
            [TILE_TYPE.DARK_DIRT]: '#50320f',
            [TILE_TYPE.DARK_STONE]: '#4a4a4a',
            [TILE_TYPE.FLOWER3]: '#ffd700',
            [TILE_TYPE.FLOWER4]: '#9370db',
            [TILE_TYPE.PINE_TREE]: '#1a4a1a',
            [TILE_TYPE.CLOUD]: '#f0f8ff',
            [TILE_TYPE.FENCE]: '#8b7355',
            [TILE_TYPE.SIGN]: '#daa520',
            [TILE_TYPE.CAMPFIRE]: '#ff6347',
            [TILE_TYPE.CHEST]: '#d2691e',
            [TILE_TYPE.WELL]: '#2f4f4f',
            [TILE_TYPE.TORCH]: '#ff8c00',
            [TILE_TYPE.ORE_COPPER]: '#b87333',
            [TILE_TYPE.ORE_IRON]: '#a9a9a9',
            [TILE_TYPE.ORE_GOLD]: '#ffd700',
            [TILE_TYPE.DOOR]: '#8b4513',
            [TILE_TYPE.SILO]: '#d2b48c',
            [TILE_TYPE.COOP]: '#cd853f',
            [TILE_TYPE.STABLE]: '#a0522d',
          };
          ctx.fillStyle = colors[mapData[y][x]] || '#7ec850';
          ctx.fillRect(x, y, 1, 1);
        }
      }
      card.appendChild(cv);

      const name = document.createElement('div');
      name.className = 'name';
      name.textContent = m.name;
      card.appendChild(name);

      if (m.isCustom) {
        const delBtn = document.createElement('button');
        delBtn.type = 'button';
        delBtn.className = 'delete-btn';
        delBtn.textContent = '×';
        delBtn.setAttribute('aria-label', '删除地图：' + m.name);
        delBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (confirm('确定删除这个自定义地图吗？')) {
            this.mapManager.removeCustomMap(i);
            if (this.mapManager.selectedMapIndex >= i) {
              this.mapManager.selectedMapIndex = Math.max(0, this.mapManager.selectedMapIndex - 1);
            }
            this.buildMapSelect();
          }
        });
        card.appendChild(delBtn);
      }

      card.addEventListener('click', () => {
        this.mapManager.selectedMapIndex = i;
        grid.querySelectorAll('.map-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
      });

      grid.appendChild(card);
    });
  }

  startGame() {
    this.mapManager.loadMap(this.mapManager.selectedMapIndex);
    this.pathfinder = new Pathfinder(this.mapManager);
    const spawnPos = this.restoredPlayerPosition || this.mapManager.getSafeSpawnPosition();
    this.player.setPosition(spawnPos.x, spawnPos.y);
    this.restoredPlayerPosition = null;
    this.player.stopMoving();
    this.npcManager.loadNpcsForMap(this.mapManager.mapName);

    this.state = 'playing';
    this.editMode = false;
    this.hideAllOverlays();
    this.updateHUD();
    this.updateJingyuanActionButtons();
  }

  showMapSelect() {
    this.state = 'mapselect';
    this.buildMapSelect();
    this.hideAllOverlays();
    document.getElementById('mapselect-overlay').classList.remove('hidden');
    this.updateJingyuanActionButtons();
  }

  showCustomize() {
    if (this.state !== 'asset-library') {
      this.customizeReturnState = (this.state === 'playing' || this.state === 'dialog') ? 'playing' : 'menu';
    }
    this.state = 'customize';
    this.buildCustomizePanel();
    this.hideAllOverlays();
    document.getElementById('customize-overlay').classList.remove('hidden');
    this.updateJingyuanActionButtons();
  }

  showHelp() {
    this.state = 'help';
    this.hideAllOverlays();
    document.getElementById('help-overlay').classList.remove('hidden');
    this.updateJingyuanActionButtons();
  }

  backToMenu() {
    this.state = 'menu';
    this.editMode = false;
    this.hideAllOverlays();
    document.getElementById('menu-overlay').classList.remove('hidden');
    this.updateHUD();
    this.updateJingyuanActionButtons();
  }

  showMapGenerator() {
    this.state = 'map-generator';
    this.hideAllOverlays();
    document.getElementById('map-generator-overlay').classList.remove('hidden');
    this.updateJingyuanActionButtons();
  }

  closeMapGenerator() {
    this.state = 'menu';
    document.getElementById('map-generator-overlay').classList.add('hidden');
    this.updateJingyuanActionButtons();
    document.getElementById('menu-overlay').classList.remove('hidden');
    this.generatorImage = null;
  }

  handleGeneratorImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    this.loadGeneratorImage(file);
  }

  loadGeneratorImage(file) {
    if (!file || !file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        this.generatorImage = img;
        document.getElementById('generator-file-text').textContent = file.name;
        this.updateGeneratorPreview();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  updateGeneratorPreview() {
    if (!this.generatorImage) return;

    const filters = {
      brightness: parseInt(document.getElementById('generator-brightness').value),
      contrast: parseInt(document.getElementById('generator-contrast').value),
      saturation: parseInt(document.getElementById('generator-saturation').value),
      sharpness: parseInt(document.getElementById('generator-sharpness').value),
      hue: parseInt(document.getElementById('generator-hue').value),
      temperature: parseInt(document.getElementById('generator-temperature').value)
    };

    this.mapManager.setGeneratorOptions({
      algorithm: document.getElementById('generator-algorithm').value,
      ditherStrength: parseInt(document.getElementById('generator-strength').value),
      ditherScale: parseInt(document.getElementById('generator-scale').value),
      filters: filters
    });

    const preview = this.mapManager.generatePreview(this.generatorImage, 300, 200);
    this.generatorPreviewCtx.clearRect(0, 0, 300, 200);
    this.generatorPreviewCtx.drawImage(preview, 0, 0, 300, 200);
  }

  generateMapFromImage() {
    if (!this.generatorImage) {
      alert('请先上传图片');
      return;
    }

    try {
      const filters = {
        brightness: parseInt(document.getElementById('generator-brightness').value),
        contrast: parseInt(document.getElementById('generator-contrast').value),
        saturation: parseInt(document.getElementById('generator-saturation').value),
        sharpness: parseInt(document.getElementById('generator-sharpness').value),
        hue: parseInt(document.getElementById('generator-hue').value),
        temperature: parseInt(document.getElementById('generator-temperature').value)
      };

      this.mapManager.setGeneratorOptions({
        algorithm: document.getElementById('generator-algorithm').value,
        ditherStrength: parseInt(document.getElementById('generator-strength').value),
        ditherScale: parseInt(document.getElementById('generator-scale').value),
        filters: filters
      });

      const generatedMap = this.mapManager.generator.generateMap(this.generatorImage);
      
      const mapCount = this.mapManager.customMaps.length;
      const mapName = '自定义地图' + (mapCount > 0 ? ' ' + (mapCount + 1) : '');
      this.mapManager.addCustomMap(generatedMap, mapName);

      this.generatorImage = null;
      document.getElementById('generator-file-text').textContent = '点击或拖拽图片';

      this.closeMapGenerator();
      this.showMapSelect();
    } catch (e) {
      console.error('generateMapFromImage error:', e);
      alert('生成地图失败: ' + e.message);
    }
  }

  confirmMap() {
    this.mapManager.loadMap(this.mapManager.selectedMapIndex);
    this.backToMenu();
  }

  nextMap() {
    const totalMaps = this.mapManager.getMapCount();
    const nextIndex = (this.mapManager.selectedMapIndex + 1) % totalMaps;
    this.mapManager.loadMap(nextIndex);
    this.pathfinder = new Pathfinder(this.mapManager);
    this.npcManager.loadNpcsForMap(this.mapManager.mapName);
    const spawnPos = this.mapManager.getSafeSpawnPosition();
    this.player.setPosition(spawnPos.x, spawnPos.y);
    this.player.stopMoving();
    this.pendingInteraction = null;
    this.camera.x = spawnPos.x - this.viewW / 2;
    this.camera.y = spawnPos.y - this.viewH / 2;
    this.updateHUD();
    this.showNotification(`切换到：${this.mapManager.mapName}`);
    this.saveGame();
  }

  previousMap() {
    const totalMaps = this.mapManager.getMapCount();
    const prevIndex = (this.mapManager.selectedMapIndex - 1 + totalMaps) % totalMaps;
    this.mapManager.loadMap(prevIndex);
    this.pathfinder = new Pathfinder(this.mapManager);
    this.npcManager.loadNpcsForMap(this.mapManager.mapName);
    const spawnPos = this.mapManager.getSafeSpawnPosition();
    this.player.setPosition(spawnPos.x, spawnPos.y);
    this.player.stopMoving();
    this.pendingInteraction = null;
    this.camera.x = spawnPos.x - this.viewW / 2;
    this.camera.y = spawnPos.y - this.viewH / 2;
    this.updateHUD();
    this.showNotification(`切换到：${this.mapManager.mapName}`);
    this.saveGame();
  }

  confirmCustomize() {
    if (this.customizeReturnState === 'menu') {
      this.backToMenu();
    } else {
      this.state = 'playing';
      this.hideAllOverlays();
    }
    this.updateHUD();
    this.updateJingyuanActionButtons();
  }

  hideAllOverlays() {
    ['menu-overlay', 'mapselect-overlay', 'customize-overlay', 'help-overlay', 'map-generator-overlay', 'asset-library-overlay'].forEach(id => {
      document.getElementById(id).classList.add('hidden');
    });
  }

  toggleEditMode() {
    this.editMode = !this.editMode;
    this.updateHUD();
    const bar = document.getElementById('tile-bar');
    if (this.editMode) {
      bar.classList.remove('hidden');
    } else {
      bar.classList.add('hidden');
    }
  }

  handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        this.mapManager.imageToMap(img);
        const spawn = this.mapManager.getSafeSpawnPosition();
        this.player.setPosition(spawn.x, spawn.y);
        this.player.stopMoving();
        this.camera.x = spawn.x - this.viewW / 2;
        this.camera.y = spawn.y - this.viewH / 2;
        this.updateHUD();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  selectTile(tile) {
    this.selectedTile = tile;
    document.querySelectorAll('.tile-slot').forEach(s => {
      s.classList.toggle('active', parseInt(s.dataset.tile) === tile);
    });
  }

  updateHUD() {
    const badge = document.getElementById('mode-badge');
    if (this.editMode) {
      badge.textContent = '编辑模式';
      badge.classList.add('edit');
    } else {
      badge.textContent = '游玩模式';
      badge.classList.remove('edit');
    }
    document.getElementById('map-badge').textContent = '地图: ' + this.mapManager.mapName;

    const hudBottom = document.getElementById('hud-bottom');
    if (hudBottom) {
      hudBottom.style.display = this.state === 'playing' && !this.editMode ? 'flex' : 'none';
    }

    this.updateFarmPanel();
    this.updateBattlePanel();
    this.updateQuestPanel();
  }

  updateFarmPanel() {
    const panel = document.getElementById('farm-panel');
    if (!panel) return;

    if (this.showFarmPanel) {
      panel.classList.remove('hidden');

      document.getElementById('farm-money').textContent = this.farmSystem.money;
      document.getElementById('farm-season').textContent = this.farmSystem.getSeasonName();
      document.getElementById('farm-day').textContent = this.farmSystem.day;
      const modeHint = document.getElementById('farm-mode-hint');
      if (modeHint) {
        const hints = {
          status: '状态模式：可选择背包中的种子；商店和出售需与地图实体互动。',
          shop: '农场主商店：可以购买当前季节种子。',
          animals: '牧场设施：可以购买建筑和动物。',
          inventory: '谷仓：可以出售背包物品。',
        };
        modeHint.textContent = hints[this.farmPanelMode] || hints.status;
      }

      const seedShop = document.getElementById('farm-seed-shop');
      seedShop.innerHTML = '';
      Object.values(CROPS).forEach(crop => {
        const canPlant = this.farmSystem.canPlant(crop.id);
        const btn = document.createElement('button');
        btn.className = 'pixel-btn';
        btn.style.fontSize = '12px';
        btn.style.padding = '4px 8px';
        btn.style.textAlign = 'left';
        btn.style.display = 'flex';
        btn.style.justifyContent = 'space-between';
        btn.style.alignItems = 'center';
        btn.disabled = !canPlant || this.farmPanelMode !== 'shop';
        btn.innerHTML = `<span>${crop.name} ${canPlant ? '' : '(当前季节不可种)'}</span><span>💰 ${crop.seedPrice}</span>`;
        btn.onclick = () => this.buySeed(crop.id);
        seedShop.appendChild(btn);
      });

      const buildingShop = document.getElementById('farm-building-shop');
      buildingShop.innerHTML = '';
      Object.entries(ANIMAL_BUILDINGS).forEach(([type, building]) => {
        const hasBuilding = this.farmSystem.buildings.find(b => b.type === type);
        const btn = document.createElement('button');
        btn.className = 'pixel-btn';
        btn.style.fontSize = '12px';
        btn.style.padding = '4px 8px';
        btn.style.textAlign = 'left';
        btn.style.display = 'flex';
        btn.style.justifyContent = 'space-between';
        btn.style.alignItems = 'center';
        btn.disabled = hasBuilding || this.farmSystem.money < building.cost || this.farmPanelMode !== 'animals';
        btn.innerHTML = `<span>${building.name} ${hasBuilding ? '(已拥有)' : ''}</span><span>💰 ${building.cost}</span>`;
        btn.onclick = () => this.buyBuilding(type);
        buildingShop.appendChild(btn);
      });

      const inventory = document.getElementById('farm-inventory');
      inventory.innerHTML = '';
      this.farmSystem.inventory.forEach((count, itemId) => {
        if (count <= 0) return;
        const itemEl = document.createElement('div');
        itemEl.style.background = '#e8e8e8';
        itemEl.style.border = '2px solid #1a1c2c';
        itemEl.style.padding = '6px';
        itemEl.style.textAlign = 'center';
        itemEl.style.fontSize = '12px';
        itemEl.innerHTML = `<div>${this.getItemDisplayName(itemId)}</div><div style="font-weight:bold;">×${count}</div>`;
        const sellBtn = document.createElement('button');
        sellBtn.className = 'pixel-btn';
        sellBtn.style.fontSize = '10px';
        sellBtn.style.marginTop = '4px';
        sellBtn.style.width = '100%';
        const isSeed = itemId.startsWith('seed_');
        sellBtn.textContent = isSeed ? (this.selectedSeed === itemId.substring(5) ? '已选择' : '选择种子') : '出售';
        sellBtn.disabled = isSeed ? this.selectedSeed === itemId.substring(5) : this.farmPanelMode !== 'inventory';
        sellBtn.onclick = () => isSeed ? this.selectSeed(itemId.substring(5)) : this.sellItem(itemId);
        itemEl.appendChild(sellBtn);
        inventory.appendChild(itemEl);
      });

      const animals = document.getElementById('farm-animals');
      animals.innerHTML = '';
      if (this.farmSystem.animals.length === 0) {
        animals.innerHTML = '<div style="color:#6b6b7b; font-size:12px;">暂无动物，建造鸡舍/牲口棚后购买</div>';
      } else {
        this.farmSystem.animals.forEach((animal, index) => {
          const animalEl = document.createElement('div');
          animalEl.style.background = '#e8f5e9';
          animalEl.style.border = '2px solid #1a1c2c';
          animalEl.style.padding = '6px';
          animalEl.style.fontSize = '12px';
          animalEl.innerHTML = `<div style="font-weight:bold;">${animal.name}</div><div>产物: ${animal.productName}</div>`;
          animals.appendChild(animalEl);
        });
      }

      const animalShop = document.createElement('div');
      animalShop.innerHTML = '<h3 class="pixel-font" style="color:#1a1c2c; margin:8px 0 4px;">购买动物</h3>';
      Object.entries(ANIMALS).forEach(([type, animal]) => {
        const buildingType = animal.productId === 'egg' || animal.productId === 'duck_egg' ? 'coop' : 'barn';
        const hasBuilding = this.farmSystem.buildings.find(b => b.type === buildingType);
        const count = this.farmSystem.animals.filter(a => a.building === buildingType).length;
        const capacity = ANIMAL_BUILDINGS[buildingType]?.capacity || 0;
        const btn = document.createElement('button');
        btn.className = 'pixel-btn';
        btn.style.fontSize = '12px';
        btn.style.padding = '4px 8px';
        btn.style.textAlign = 'left';
        btn.style.display = 'flex';
        btn.style.justifyContent = 'space-between';
        btn.style.alignItems = 'center';
        btn.style.marginBottom = '4px';
        btn.disabled = !hasBuilding || count >= capacity || this.farmSystem.money < animal.cost || this.farmPanelMode !== 'animals';
        btn.innerHTML = `<span>${animal.name}</span><span>💰 ${animal.cost}</span>`;
        btn.onclick = () => this.buyAnimal(type);
        animalShop.appendChild(btn);
      });
      animals.appendChild(animalShop);
    } else {
      panel.classList.add('hidden');
    }
  }

  updateBattlePanel() {
    const panel = document.getElementById('battle-panel');
    if (!panel) return;

    if (this.showBattlePanel) {
      panel.classList.remove('hidden');

      document.getElementById('battle-floor').textContent = this.battleSystem.currentFloor;
      document.getElementById('battle-zone').textContent = this.battleSystem.getZoneName(this.battleSystem.currentFloor);

      document.getElementById('battle-player-hp').textContent = this.battleSystem.playerHp;
      document.getElementById('battle-player-maxhp').textContent = this.battleSystem.playerMaxHp;
      document.getElementById('battle-player-attack').textContent = this.battleSystem.playerAttackPower;
      document.getElementById('battle-player-defense').textContent = this.battleSystem.playerDefense;
      document.getElementById('battle-player-level').textContent = this.battleSystem.playerLevel;

      const monsterDiv = document.getElementById('battle-monster');
      const attackBtn = document.getElementById('battle-attack-btn');

      if (this.battleSystem.isInBattle && this.battleSystem.currentMonster) {
        monsterDiv.style.display = 'block';
        attackBtn.style.display = 'block';
        document.getElementById('battle-monster-name').textContent = (this.battleSystem.currentMonster.isBoss ? '👹 BOSS ' : '') + this.battleSystem.currentMonster.name;
        document.getElementById('battle-monster-hp').textContent = this.battleSystem.monsterHp;
        document.getElementById('battle-monster-maxhp').textContent = this.battleSystem.monsterMaxHp;
        document.getElementById('battle-monster-attack').textContent = this.battleSystem.currentMonster.attack;
        document.getElementById('battle-monster-defense').textContent = this.battleSystem.currentMonster.defense;
      } else {
        monsterDiv.style.display = 'none';
        attackBtn.style.display = 'none';
      }

      const inv = document.getElementById('battle-inventory');
      inv.innerHTML = '';
      this.farmSystem.inventory.forEach((count, itemId) => {
        const mineLoot = itemId.includes('ore') || ['jade', 'quartz', 'ruby', 'moonstone', 'obsidian', 'dragon_jade'].includes(itemId);
        if (count <= 0 || !mineLoot) return;
        const itemEl = document.createElement('div');
        itemEl.style.background = '#e8e8e8';
        itemEl.style.border = '2px solid #1a1c2c';
        itemEl.style.padding = '6px';
        itemEl.style.textAlign = 'center';
        itemEl.style.fontSize = '12px';
        itemEl.innerHTML = `<div>${this.getItemDisplayName(itemId)}</div><div style="font-weight:bold;">×${count}</div>`;
        inv.appendChild(itemEl);
      });

      const log = document.getElementById('battle-log');
      log.innerHTML = this.battleSystem.getBattleLog().map(entry => `<div>${entry.message}</div>`).join('');
      log.scrollTop = log.scrollHeight;
    } else {
      panel.classList.add('hidden');
    }
  }

  updateQuestPanel() {
    const panel = document.getElementById('quest-panel');
    if (!panel) return;

    if (this.showQuestPanel) {
      panel.classList.remove('hidden');

      document.getElementById('quest-level').textContent = this.questSystem.getLevel();
      document.getElementById('quest-exp').textContent = this.questSystem.getExp();
      document.getElementById('quest-exp-needed').textContent = this.questSystem.getExpNeeded();

      const activeDiv = document.getElementById('quest-active');
      activeDiv.innerHTML = '';
      const activeQuests = this.questSystem.getActiveQuests();
      if (activeQuests.length === 0) {
        activeDiv.innerHTML = '<div style="color:#6b6b7b; font-size:12px;">暂无进行中的任务</div>';
      } else {
        activeQuests.forEach(quest => {
          const npc = this.npcManager.getAllNpcData().find(item => item.id === quest.npcId);
          const questEl = document.createElement('div');
          questEl.style.background = '#fff3e0';
          questEl.style.border = '2px solid #1a1c2c';
          questEl.style.padding = '10px';
          questEl.style.marginBottom = '8px';
          questEl.innerHTML = `
            <div style="font-weight:bold;">${quest.title}</div>
            <div style="font-size:12px; color:#6b6b7b; margin-top:4px;">${quest.description}</div>
            <div style="font-size:12px; margin-top:4px; color:${quest.status === 'readyToClaim' ? '#2e7d32' : '#6b6b7b'};">
              ${quest.status === 'readyToClaim' ? '可提交' : '进行中'} · ${npc ? `${npc.map} / ${npc.name}` : '任务 NPC'}
            </div>
            <div style="margin-top:8px;">
              ${quest.progress.map(p => `
                <div style="font-size:12px; margin-bottom:2px;">
                  ${p.name}: ${p.current}/${p.target} ${p.complete ? '✓' : ''}
                </div>
              `).join('')}
            </div>
          `;
          activeDiv.appendChild(questEl);
        });
      }

      const listDiv = document.getElementById('quest-list');
      listDiv.innerHTML = '';
      STORY_QUESTS.forEach(quest => {
        const isCompleted = this.questSystem.completedQuests.has(quest.id);
        const isActive = this.questSystem.activeQuests.find(q => q.id === quest.id);
        const canAccept = this.questSystem.canAcceptNextQuest() && this.questSystem.getNextStoryQuest()?.id === quest.id;
        const npc = this.npcManager.getAllNpcData().find(item => item.id === quest.npcId);

        const questEl = document.createElement('div');
        questEl.style.background = isCompleted ? '#e8f5e9' : isActive ? '#fff3e0' : '#f0f0f0';
        questEl.style.border = '2px solid #1a1c2c';
        questEl.style.padding = '8px';
        questEl.style.marginBottom = '4px';
        questEl.style.fontSize = '12px';

        let content = `<div style="font-weight:bold;">${isCompleted ? '✓ ' : ''}${quest.title}</div>`;
        if (canAccept && !isCompleted && !isActive) {
          content += `<div style="color:#2563eb; margin-top:4px;">前往 ${npc?.map || '对应地图'} 与 ${npc?.name || '任务 NPC'} 互动接受</div>`;
        } else if (isCompleted) {
          content += '<div style="color:#6b6b7b;">已完成</div>';
        } else if (isActive) {
          content += `<div style="color:#f9a03f;">${this.questSystem.readyToClaim.has(quest.id) ? '等待提交' : '进行中'}</div>`;
        }
        questEl.innerHTML = content;
        listDiv.appendChild(questEl);
      });
    } else {
      panel.classList.add('hidden');
    }
  }

  getItemDisplayName(itemId) {
    if (itemId.startsWith('seed_')) {
      const cropId = itemId.substring(5);
      return '🌱 ' + (CROPS[cropId]?.name || cropId) + '种子';
    }
    const names = {
      egg: '🥚 鸡蛋', duck_egg: '🥚 鸭蛋', milk: '🥛 牛奶', wool: '🐑 羊毛',
      copper_ore: '🟤 铜矿', iron_ore: '⬜ 铁矿', gold_ore: '🟡 金矿',
      crystal_ore: '💎 水晶矿', shadow_ore: '⚫ 暗影矿', void_ore: '🌀 虚空矿',
      jade: '💚 玉', quartz: '🔮 石英', ruby: '🔴 红宝石', moonstone: '🌙 月光石',
      obsidian: '⚫ 黑曜石', dragon_jade: '🐉 龙玉',
    };
    return names[itemId] || itemId;
  }

  showNotification(message) {
    const notif = document.createElement('div');
    notif.style.position = 'absolute';
    notif.style.top = '50%';
    notif.style.left = '50%';
    notif.style.transform = 'translate(-50%, -50%)';
    notif.style.background = '#1a1c2c';
    notif.style.color = '#f4f4f4';
    notif.style.padding = '12px 24px';
    notif.style.border = '3px solid #f9a03f';
    notif.style.fontFamily = 'Courier New, monospace';
    notif.style.fontWeight = 'bold';
    notif.style.fontSize = '16px';
    notif.style.zIndex = '100';
    notif.style.animation = 'bob 0.8s ease-out';
    notif.textContent = message;
    document.getElementById('game-wrapper').appendChild(notif);
    setTimeout(() => notif.remove(), 2000);
  }

  paintTile(erase) {
    const wx = this.mouse.x + this.camera.x;
    const wy = this.mouse.y + this.camera.y;
    const tx = Math.floor(wx / TILE);
    const ty = Math.floor(wy / TILE);
    this.mapManager.setTile(tx, ty, erase ? TILE_TYPE.GRASS : this.selectedTile);
  }

  getInteractionTargetAt(tx, ty) {
    const mapId = this.getCurrentMapId();
    const tile = this.mapManager.getTileAt(tx * TILE + TILE / 2, ty * TILE + TILE / 2);
    if (mapId === 'farm') {
      const field = this.farmSystem.getFieldAt(tx, ty, mapId);
      if (field) return { kind: 'crop', mapId, tileX: tx, tileY: ty, label: this.farmSystem.isCropReady(this.farmSystem.getFieldKey(mapId, tx, ty)) ? '收获作物' : '查看作物' };
      if (tile === TILE_TYPE.DIRT && this.selectedSeed) return { kind: 'plant', mapId, tileX: tx, tileY: ty, label: '种植作物' };
      if (tile === TILE_TYPE.SILO || (tile === TILE_TYPE.DOOR && tx === 36 && ty === 6)) return { kind: 'farmPanel', section: 'inventory', mapId, tileX: tx, tileY: ty, label: '打开谷仓' };
      if (tile === TILE_TYPE.COOP || (tile === TILE_TYPE.DOOR && tx === 36 && ty === 29)) return { kind: 'farmPanel', section: 'animals', buildingType: 'coop', mapId, tileX: tx, tileY: ty, label: '查看鸡舍并收取产物' };
      if (tile === TILE_TYPE.STABLE || (tile === TILE_TYPE.DOOR && tx === 46 && ty === 29)) return { kind: 'farmPanel', section: 'animals', buildingType: 'barn', mapId, tileX: tx, tileY: ty, label: '查看牲口棚并收取产物' };
      if (tile === TILE_TYPE.DOOR && tx === 46 && ty === 6) return { kind: 'advanceDay', mapId, tileX: tx, tileY: ty, label: '回家休息' };
      if (tile === TILE_TYPE.WELL) return { kind: 'well', mapId, tileX: tx, tileY: ty, label: '查看水井' };
    }
    if (mapId === 'mine') {
      const ores = {
        [TILE_TYPE.ORE_COPPER]: 'copper_ore',
        [TILE_TYPE.ORE_IRON]: 'iron_ore',
        [TILE_TYPE.ORE_GOLD]: 'gold_ore',
      };
      if (ores[tile]) return { kind: 'ore', itemId: ores[tile], mapId, tileX: tx, tileY: ty, label: `开采${this.getItemDisplayName(ores[tile])}` };
      if (tile === TILE_TYPE.CHEST) return { kind: 'chest', mapId, tileX: tx, tileY: ty, label: '打开宝箱' };
      if (tile === TILE_TYPE.DOOR) return { kind: 'mineDoor', mapId, tileX: tx, tileY: ty, label: this.battleSystem.floorCleared ? '进入下一层' : '挑战本层怪物' };
    }
    return null;
  }

  handleWorldClick(worldX, worldY) {
    const tx = Math.floor(worldX / TILE);
    const ty = Math.floor(worldY / TILE);
    const clickedNpc = this.npcManager.getNpcs().find(npc => Math.hypot(npc.x - worldX, npc.y - worldY) <= TILE);
    const target = clickedNpc
      ? { kind: 'npc', npc: clickedNpc, mapId: this.getCurrentMapId(), tileX: Math.floor(clickedNpc.x / TILE), tileY: Math.floor(clickedNpc.y / TILE), label: `与${clickedNpc.name}互动` }
      : this.getInteractionTargetAt(tx, ty);
    if (target) return this.queueInteraction(target);
    this.pendingInteraction = null;
    const path = this.pathfinder.findPath(this.player.x, this.player.y, worldX, worldY);
    if (path.length > 0) this.player.setPath(path);
    return path.length > 0;
  }

  queueInteraction(target) {
    const centerX = target.npc?.x ?? (target.tileX * TILE + TILE / 2);
    const centerY = target.npc?.y ?? (target.tileY * TILE + TILE / 2);
    if (Math.hypot(this.player.x - centerX, this.player.y - centerY) <= TILE * 1.6) {
      this.executeInteraction(target);
      return true;
    }
    const candidates = [[0, -1], [1, 0], [0, 1], [-1, 0]]
      .map(([dx, dy]) => ({ x: (target.tileX + dx) * TILE + TILE / 2, y: (target.tileY + dy) * TILE + TILE / 2 }))
      .filter(point => !this.mapManager.isSolid(point.x, point.y))
      .map(point => ({ point, path: this.pathfinder.findPath(this.player.x, this.player.y, point.x, point.y) }))
      .filter(candidate => candidate.path.length > 0)
      .sort((a, b) => a.path.length - b.path.length);
    if (candidates.length === 0) {
      this.showNotification('无法到达该目标，请换个方向再试');
      return false;
    }
    this.pendingInteraction = target;
    this.player.setPath(candidates[0].path);
    this.showNotification(`正在前往：${target.label}`);
    return true;
  }

  executeInteraction(target) {
    this.pendingInteraction = null;
    if (!target || target.mapId !== this.getCurrentMapId()) return false;
    if (target.kind === 'npc') {
      const questAction = this.questSystem.getQuestForNpc(target.npc.id);
      if (questAction?.action === 'accept') {
        this.acceptQuest(questAction.quest.id);
        this.showNotification(`已接受任务：${questAction.quest.title}`);
      } else if (questAction?.action === 'claim') {
        this.collectQuestReward(questAction.quest.id);
        this.showNotification(`已提交任务：${questAction.quest.title}`);
      }
      if (!questAction && (target.npc.id === 'farmer' || target.npc.id === 'shepherd')) {
        this.farmPanelMode = target.npc.id === 'farmer' ? 'shop' : 'animals';
        this.showFarmPanel = true;
        this.updateHUD();
        return true;
      }
      this.dialogSystem.startDialog(target.npc);
      this.state = 'dialog';
      this.player.stopMoving();
      this.updateJingyuanActionButtons();
      return true;
    }
    if (target.kind === 'plant') return this.plantCropAt(target.tileX, target.tileY);
    if (target.kind === 'crop') {
      const key = this.farmSystem.getFieldKey(target.mapId, target.tileX, target.tileY);
      if (!this.farmSystem.isCropReady(key)) {
        this.showNotification('作物还没有成熟，推进日期后再来看看');
        return false;
      }
      const crop = this.harvestCropAt(target.tileX, target.tileY);
      if (crop) this.showNotification(`收获了 ${crop.name}！`);
      return !!crop;
    }
    if (target.kind === 'advanceDay') {
      this.advanceDay();
      this.showNotification(`休息完成，现在是${this.farmSystem.getSeasonName()}第 ${this.farmSystem.day} 天`);
      return true;
    }
    if (target.kind === 'farmPanel') {
      if (target.buildingType) {
        const products = this.farmSystem.collectProductsForBuilding(target.buildingType);
        if (products.length > 0) {
          this.showNotification(`收取了 ${products.map(item => item.name).join('、')}`);
          this.saveGame();
        }
      }
      this.farmPanelMode = target.section || 'status';
      this.showFarmPanel = true;
      this.updateHUD();
      return true;
    }
    if (target.kind === 'well') {
      this.showNotification('井水清澈，可用于农场日常灌溉');
      return true;
    }
    if (target.kind === 'ore') {
      const nodeKey = `${target.tileX},${target.tileY}`;
      if (!this.battleSystem.collectNode(nodeKey)) {
        this.showNotification('这处矿脉本层已经开采过了');
        return false;
      }
      const amount = 1 + Math.floor(Math.random() * 2);
      this.farmSystem.addItem(target.itemId, amount);
      this.questSystem.recordEvent('collectItem', amount, { itemId: target.itemId });
      this.showNotification(`获得 ${this.getItemDisplayName(target.itemId)} ×${amount}`);
      this.saveGame();
      this.updateHUD();
      return true;
    }
    if (target.kind === 'chest') {
      const nodeKey = `chest:${target.tileX},${target.tileY}`;
      if (!this.battleSystem.collectNode(nodeKey)) {
        this.showNotification('这个宝箱本层已经打开过了');
        return false;
      }
      const gold = 50 + this.battleSystem.currentFloor * 5;
      this.farmSystem.money += gold;
      this.showNotification(`打开宝箱，获得 ${gold} 金币`);
      this.saveGame();
      this.updateHUD();
      return true;
    }
    if (target.kind === 'mineDoor') {
      if (this.battleSystem.isInBattle) {
        this.showBattlePanel = true;
      } else if (this.battleSystem.floorCleared) {
        this.goDownMine();
      } else {
        this.startBattle();
      }
      this.updateHUD();
      return true;
    }
    return false;
  }

  tryInteract() {
    const tx = Math.floor(this.player.x / TILE);
    const ty = Math.floor(this.player.y / TILE);
    for (const [dx, dy] of [[0, 0], [0, -1], [1, 0], [0, 1], [-1, 0]]) {
      const target = this.getInteractionTargetAt(tx + dx, ty + dy);
      if (target) return this.executeInteraction(target);
    }
    const nearbyNpc = this.npcManager.getNearbyNpc();
    if (nearbyNpc) return this.executeInteraction({ kind: 'npc', npc: nearbyNpc, mapId: this.getCurrentMapId() });
    this.showNotification('附近没有可交互目标');
    return false;
  }

  checkNearbyNpc() {
    const pos = this.player.getPosition();
    const nearest = this.npcManager.findNearbyNpc(pos.x, pos.y, 48);

    const prompt = document.getElementById('interact-prompt');
    let label = '';
    const tx = Math.floor(pos.x / TILE);
    const ty = Math.floor(pos.y / TILE);
    for (const [dx, dy] of [[0, 0], [0, -1], [1, 0], [0, 1], [-1, 0]]) {
      const target = this.getInteractionTargetAt(tx + dx, ty + dy);
      if (target) { label = `按 E ${target.label}`; break; }
    }
    if (!label && nearest) label = `按 E 与 ${nearest.name} 互动`;
    if (label && this.state === 'playing' && !this.editMode) {
      prompt.classList.remove('hidden');
      prompt.textContent = label;
    } else {
      prompt.classList.add('hidden');
    }
  }

  updateCamera() {
    const pos = this.player.getPosition();
    const targetX = pos.x - this.viewW / 2;
    const targetY = pos.y - this.viewH / 2;
    this.camera.x += (targetX - this.camera.x) * 0.1;
    this.camera.y += (targetY - this.camera.y) * 0.1;
    this.camera.x = Math.max(0, Math.min(60 * TILE - this.viewW, this.camera.x));
    this.camera.y = Math.max(0, Math.min(40 * TILE - this.viewH, this.camera.y));
  }

  update(dt) {
    this.time += dt;

    if (this.state === 'playing') {
      if (this.pendingInteraction && (this.keys.w || this.keys.a || this.keys.s || this.keys.d || this.keys.arrowup || this.keys.arrowdown || this.keys.arrowleft || this.keys.arrowright)) {
        this.pendingInteraction = null;
      }
      this.player.update(dt, this.mapManager, this.keys);
      if (this.pendingInteraction && this.player.path.length === 0) {
        const target = this.pendingInteraction;
        const centerX = target.npc?.x ?? (target.tileX * TILE + TILE / 2);
        const centerY = target.npc?.y ?? (target.tileY * TILE + TILE / 2);
        if (Math.hypot(this.player.x - centerX, this.player.y - centerY) <= TILE * 1.7) this.executeInteraction(target);
        else this.pendingInteraction = null;
      }
      this.npcManager.update(dt, this.mapManager);
      this.checkNearbyNpc();
      this.updateCamera();
      // 静远七人：单次动作播放完成后 250ms 自动清除，回到待机/移动
      if (this.player.actionOverride && this.player.actionOnceDone) {
        if (!this.actionClearTimer) {
          this.actionClearTimer = setTimeout(() => {
            this.player.clearActionOverride();
            this.updateJingyuanActionButtons();
            this.actionClearTimer = null;
          }, 250);
        }
      }
      this.updateActionBadge();
    } else if (this.state === 'dialog') {
      this.dialogSystem.update(dt);
      this.updateCamera();
      if (!this.dialogSystem.isDialogActive()) {
        this.state = 'playing';
        this.updateJingyuanActionButtons();
      }
    } else if (this.state === 'menu' || this.state === 'mapselect' || this.state === 'customize' || this.state === 'help' || this.state === 'asset-library' || this.state === 'map-generator') {
      this.updateCamera();
    }

    if (this.state === 'customize') {
      this.updatePreview();
    }
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.viewW, this.viewH);

    ctx.fillStyle = '#5fcde4';
    ctx.fillRect(0, 0, this.viewW, this.viewH);

    if (!this.mapManager.map) return;

    ctx.save();
    ctx.translate(-Math.floor(this.camera.x), -Math.floor(this.camera.y));

    const startX = Math.max(0, Math.floor(this.camera.x / TILE));
    const startY = Math.max(0, Math.floor(this.camera.y / TILE));
    const endX = Math.min(60, Math.ceil((this.camera.x + this.viewW) / TILE) + 1);
    const endY = Math.min(40, Math.ceil((this.camera.y + this.viewH) / TILE) + 1);

    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const t = this.mapManager.map[y][x];
        PixelArt.drawTile(ctx, t, x * TILE, y * TILE, this.time);
      }
    }

    this.renderCrops(ctx, startX, startY, endX, endY);

    const entities = [];

    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const t = this.mapManager.map[y][x];
        if (t === TILE_TYPE.TREE || t === TILE_TYPE.HOUSE || t === TILE_TYPE.BUSH) {
          entities.push({
            type: 'tile',
            tile: t,
            x: x * TILE,
            y: y * TILE + TILE,
            tx: x * TILE,
            ty: y * TILE,
          });
        }
      }
    }

    for (const npc of this.npcManager.getNpcs()) {
      entities.push({
        type: 'npc',
        npc: npc,
        x: npc.x,
        y: npc.y,
      });
    }

    const pos = this.player.getPosition();
    entities.push({
      type: 'player',
      x: pos.x,
      y: pos.y,
    });

    entities.sort((a, b) => a.y - b.y);

    for (const e of entities) {
      if (e.type === 'tile') {
        PixelArt.drawTile(ctx, e.tile, e.tx, e.ty, this.time);
      } else if (e.type === 'npc') {
        const n = e.npc;
        if (n.characterFrames) {
          // 静远七人 NPC 渲染
          const img = this.npcManager.getNpcActionFrame(n);
          if (img) {
            PixelArt.drawJingyuanSprite(ctx, img, n.x, n.y, { scale: 1.0, targetH: 64 });
          }
        } else if (this.npcManager.hasNpcSprite(n)) {
          const sp = n.sprite;
          PixelArt.drawSprite(ctx, sp.image, n.x, n.y, {
            frameSize: sp.frameSize,
            frameHeight: sp.frameHeight,
            frame: n.frame,
            direction: n.direction,
            scale: 1.5,
            srcX: sp.srcX,
            srcY: sp.srcY,
          });
        } else {
          PixelArt.drawCharacter(ctx, n.x, n.y, {
            shirt: n.color.shirt,
            skin: n.color.skin,
            hair: n.color.hair,
            hairStyle: n.color.hairStyle,
            direction: n.direction,
            frame: n.frame,
            scale: 1.5,
          }, this.time);
        }

        ctx.font = 'bold 11px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(n.x - ctx.measureText(n.name).width/2 - 4, n.y - 42, ctx.measureText(n.name).width + 8, 14);
        ctx.fillStyle = '#fff';
        ctx.fillText(n.name, n.x, n.y - 32);
      } else if (e.type === 'player') {
        if (this.player.characterFrames) {
          // 静远七人渲染
          const img = this.player.getCurrentActionFrame();
          if (img) {
            PixelArt.drawJingyuanSprite(ctx, img, pos.x, pos.y, { scale: 1.0, targetH: 64 });
          }
        } else if (this.player.hasSprite()) {
          const sp = this.player.sprite;
          PixelArt.drawSprite(ctx, sp.image, pos.x, pos.y, {
            frameSize: sp.frameSize,
            frameHeight: sp.frameHeight,
            frame: this.player.frame,
            direction: this.player.direction,
            scale: 1.5,
            srcX: sp.srcX,
            srcY: sp.srcY,
          });
        } else {
          PixelArt.drawCharacter(ctx, pos.x, pos.y, {
            ...this.player.color,
            direction: this.player.direction,
            frame: this.player.frame,
            scale: 1.5,
          }, this.time);
        }
      }
    }

    ctx.restore();

    if (this.editMode && this.state === 'playing') {
      const wx = this.mouse.x + this.camera.x;
      const wy = this.mouse.y + this.camera.y;
      const tx = Math.floor(wx / TILE);
      const ty = Math.floor(wy / TILE);
      if (tx >= 0 && tx < 60 && ty >= 0 && ty < 40) {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(
          tx * TILE - this.camera.x + 1,
          ty * TILE - this.camera.y + 1,
          TILE - 2,
          TILE - 2
        );
      }
    }
  }

  renderCrops(ctx, startX, startY, endX, endY) {
    this.farmSystem.fields.forEach((field, key) => {
      if (field.mapId !== this.getCurrentMapId()) return;
      const tx = field.tileX;
      const ty = field.tileY;
      if (tx < startX || tx >= endX || ty < startY || ty >= endY) return;

      const progress = this.farmSystem.getCropGrowthProgress(tx, ty, field.mapId);
      const isReady = this.farmSystem.isCropReady(key);
      const crop = CROPS[field.cropId];

      const px = tx * TILE + TILE / 2;
      const py = ty * TILE + TILE / 2;

      ctx.save();
      ctx.translate(px, py);

      const cropColors = {
        cabbage: ['#90EE90', '#32CD32', '#228B22'],
        radish: ['#FFB6C1', '#FF69B4', '#DC143C'],
        potato: ['#DEB887', '#D2691E', '#8B4513'],
        tea: ['#98FB98', '#20B2AA', '#008B8B'],
        watermelon: ['#98FB98', '#32CD32', '#006400'],
        rice: ['#F5DEB3', '#DAA520', '#CD853F'],
        lotus_root: ['#E0FFFF', '#AFEEEE', '#20B2AA'],
        sesame: ['#FFFACD', '#FFD700', '#DAA520'],
        pumpkin: ['#FFD700', '#FFA500', '#FF8C00'],
        sweet_potato: ['#CD5C5C', '#DC143C', '#8B0000'],
        chrysanthemum: ['#FFDAB9', '#FFB347', '#FF6347'],
        osmanthus: ['#FFE4B5', '#FFD700', '#DAA520'],
        napa_cabbage: ['#E0FFFF', '#B0E0E6', '#87CEEB'],
        spinach: ['#32CD32', '#228B22', '#006400'],
        garlic: ['#F5F5DC', '#DAA520', '#CD853F'],
        winter_wheat: ['#F5DEB3', '#DEB887', '#D2691E'],
      };

      const colors = cropColors[field.cropId] || ['#90EE90', '#32CD32', '#228B22'];

      if (progress < 0.33) {
        ctx.fillStyle = colors[0];
        ctx.fillRect(-6, -8, 12, 16);
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(-2, 8, 4, 4);
      } else if (progress < 0.66) {
        ctx.fillStyle = colors[1];
        ctx.beginPath();
        ctx.moveTo(0, -12);
        ctx.lineTo(-8, 0);
        ctx.lineTo(8, 0);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(-3, 0, 6, 6);
      } else if (progress < 1) {
        ctx.fillStyle = colors[2];
        ctx.beginPath();
        ctx.moveTo(0, -14);
        ctx.lineTo(-10, -4);
        ctx.lineTo(-8, 4);
        ctx.lineTo(0, 2);
        ctx.lineTo(8, 4);
        ctx.lineTo(10, -4);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(-3, 2, 6, 6);
      } else {
        ctx.fillStyle = colors[2];
        ctx.beginPath();
        ctx.arc(0, -6, 10, 0, Math.PI * 2);
        ctx.fill();

        if (isReady) {
          ctx.fillStyle = '#FFD700';
          ctx.font = 'bold 10px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('★', 0, -2);
        }

        ctx.fillStyle = '#8B4513';
        ctx.fillRect(-4, 4, 8, 8);
      }

      ctx.restore();
    });
  }

  // ===== 素材库相关方法 =====

  async initAssetLibrary() {
    const catList = AssetManager.getCategoryList();
    this.assetCatList = await Promise.all(
      catList.map(async cat => {
        if (cat.key === 'terrain' || cat.key === 'interior') {
          const allItems = await AssetManager.getAllCategoryItems(cat.key);
          return { ...cat, count: allItems.length };
        }
        return cat;
      })
    );

    const nav = document.getElementById('asset-cat-nav');
    if (!nav) return;
    nav.innerHTML = '';
    this.assetCatList.forEach(cat => {
      const btn = document.createElement('button');
      btn.className = 'asset-cat-btn' + (cat.key === this.assetState.category ? ' active' : '');
      btn.dataset.catKey = cat.key;
      btn.innerHTML = `<span>${cat.icon}</span><span>${cat.name}</span><span class="cat-count">${cat.count}</span>`;
      btn.addEventListener('click', () => this.selectAssetCategory(cat.key));
      nav.appendChild(btn);
    });
    this.renderAssetGrid();
    this.renderGroupNav();
  }

  selectAssetCategory(key) {
    if (this.assetState.category === key) return;
    this.assetState.category = key;
    this.assetState.page = 0;
    this.assetState.selectedItem = null;
    this.assetState.filterText = '';
    this.assetState.selectedGroup = null;
    document.querySelectorAll('.asset-cat-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.catKey === key);
    });
    const searchInput = document.getElementById('asset-search-input');
    if (searchInput) searchInput.value = '';
    this.renderGroupNav();
    this.renderAssetGrid();
    this.updateAssetFooter();
  }

  async renderAssetGrid() {
    const grid = document.getElementById('asset-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const rawItems = await AssetManager.getAllCategoryItems(this.assetState.category);
    let items = rawItems || [];

    if (this.assetState.filterText) {
      const filter = this.assetState.filterText.toLowerCase();
      items = items.filter(item => item.name.toLowerCase().includes(filter));
    }

    if (this.assetState.selectedGroup) {
      items = items.filter(item => item.group === this.assetState.selectedGroup);
    }

    const totalItems = items.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / this.assetState.pageSize));
    const start = this.assetState.page * this.assetState.pageSize;
    const end = Math.min(start + this.assetState.pageSize, totalItems);
    const pageItems = items.slice(start, end);

    pageItems.forEach(item => {
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'asset-cell';
      cell.setAttribute('aria-label', '选择素材：' + item.name);
      if (this.assetState.selectedItem && this.assetState.selectedItem.path === item.path) {
        cell.classList.add('selected');
      }

      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      canvas.style.imageRendering = 'pixelated';
      const c = canvas.getContext('2d');
      c.imageSmoothingEnabled = false;
      c.fillStyle = '#5fcde4';
      c.fillRect(0, 0, 64, 64);

      const loadingTag = document.createElement('div');
      loadingTag.className = 'loading-tag';
      loadingTag.textContent = '...';
      cell.appendChild(loadingTag);

      cell.appendChild(canvas);

      const nameEl = document.createElement('div');
      nameEl.className = 'asset-name';
      nameEl.textContent = item.name;
      cell.appendChild(nameEl);

      AssetManager.loadImage(item.path).then(img => {
        if (!cell.isConnected) return;
        loadingTag.remove();
        if (img) {
          let srcW = img.width, srcH = img.height, srcX = 0, srcY = 0;

          if (item.type === 'object' || (item.type === 'tile' && item.srcW && item.srcH)) {
            srcW = item.srcW;
            srcH = item.srcH;
            srcX = item.srcX;
            srcY = item.srcY;
          } else if (item.type === 'tile' && item.tileSize) {
            srcW = item.tileSize;
            srcH = item.tileSize;
            srcX = item.tileCol * item.tileSize;
            srcY = item.tileRow * item.tileSize;
          } else if (item.frameSize) {
            srcW = item.frameSize;
            srcH = item.frameHeight || item.frameSize;
            const frameIndex = item.frame || 0;
            srcX = frameIndex * srcW;
          }

          const ratio = Math.min(64 / srcW, 64 / srcH);
          const dw = srcW * ratio;
          const dh = srcH * ratio;
          c.drawImage(img, srcX, srcY, srcW, srcH, (64 - dw) / 2, (64 - dh) / 2, dw, dh);
        } else {
          c.fillStyle = '#e74c3c';
          c.fillRect(0, 0, 64, 64);
          c.fillStyle = '#fff';
          c.font = 'bold 10px "Courier New", monospace';
          c.textAlign = 'center';
          c.fillText('加载失败', 32, 36);
        }
      });

      cell.addEventListener('click', () => {
        this.assetState.selectedItem = item;
        grid.querySelectorAll('.asset-cell').forEach(c => c.classList.remove('selected'));
        cell.classList.add('selected');
        this.updateAssetFooter();
      });

      cell.title = item.name + '\n' + item.path;
      grid.appendChild(cell);
    });

    const info = document.getElementById('asset-page-info');
    if (info) info.textContent = `${this.assetState.page + 1} / ${Math.max(1, totalPages)}`;
    const prev = document.getElementById('asset-prev-page');
    const next = document.getElementById('asset-next-page');
    if (prev) prev.disabled = this.assetState.page <= 0;
    if (next) next.disabled = this.assetState.page >= totalPages - 1;
  }

  async assetPrevPage() {
    if (this.assetState.page > 0) {
      this.assetState.page--;
      await this.renderAssetGrid();
    }
  }

  async assetNextPage() {
    const rawItems = await AssetManager.getAllCategoryItems(this.assetState.category);
    let items = rawItems || [];
    if (this.assetState.filterText) {
      const filter = this.assetState.filterText.toLowerCase();
      items = items.filter(item => item.name.toLowerCase().includes(filter));
    }
    if (this.assetState.selectedGroup) {
      items = items.filter(item => item.group === this.assetState.selectedGroup);
    }
    const totalPages = Math.max(1, Math.ceil(items.length / this.assetState.pageSize));
    if (this.assetState.page < totalPages - 1) {
      this.assetState.page++;
      await this.renderAssetGrid();
    }
  }

  renderGroupNav() {
    const nav = document.getElementById('asset-group-nav');
    const search = document.getElementById('asset-lib-search');
    if (!nav || !search) return;

    const cat = ASSET_CATEGORIES[this.assetState.category];
    if (!cat || !cat.items) {
      nav.style.display = 'none';
      search.style.display = cat && cat.dynamic ? '' : 'none';
      return;
    }

    const groups = [...new Set(cat.items.map(item => item.group)).values()].filter(g => g);
    if (groups.length > 0) {
      nav.style.display = '';
      nav.innerHTML = '';
      const allBtn = document.createElement('button');
      allBtn.className = 'asset-group-tag' + (this.assetState.selectedGroup === null ? ' active' : '');
      allBtn.textContent = '全部';
      allBtn.addEventListener('click', () => {
        this.assetState.selectedGroup = null;
        this.assetState.page = 0;
        this.renderGroupNav();
        this.renderAssetGrid();
      });
      nav.appendChild(allBtn);

      groups.sort().forEach(group => {
        const btn = document.createElement('button');
        btn.className = 'asset-group-tag' + (this.assetState.selectedGroup === group ? ' active' : '');
        btn.textContent = group;
        btn.addEventListener('click', () => {
          this.assetState.selectedGroup = this.assetState.selectedGroup === group ? null : group;
          this.assetState.page = 0;
          this.renderGroupNav();
          this.renderAssetGrid();
        });
        nav.appendChild(btn);
      });
    } else {
      nav.style.display = 'none';
    }

    search.style.display = '';
  }

  filterAssets() {
    const input = document.getElementById('asset-search-input');
    if (!input) return;
    this.assetState.filterText = input.value.trim();
    this.assetState.page = 0;
    this.renderAssetGrid();
  }

  clearAssetFilter() {
    this.assetState.filterText = '';
    this.assetState.page = 0;
    const searchInput = document.getElementById('asset-search-input');
    if (searchInput) searchInput.value = '';
    this.renderAssetGrid();
  }

  updateAssetFooter() {
    const target = document.getElementById('asset-lib-target');
    const applyBtn = document.getElementById('asset-apply-btn');
    const info = document.getElementById('asset-footer-info');
    if (!target || !applyBtn || !info) return;

    if (this.assetState.target === 'player') {
      target.textContent = '应用目标: 主角';
      applyBtn.style.display = this.assetState.selectedItem ? '' : 'none';
      info.textContent = this.assetState.selectedItem
        ? `已选: ${this.assetState.selectedItem.name}`
        : '选择一个素材作为主角外观';
    } else if (this.assetState.target.startsWith('npc:')) {
      const npcId = this.assetState.target.substring(4);
      const npcData = this.npcManager.getAllNpcData().find(n => n.id === npcId);
      target.textContent = '应用目标: ' + (npcData ? npcData.name : 'NPC');
      applyBtn.style.display = this.assetState.selectedItem ? '' : 'none';
      info.textContent = this.assetState.selectedItem
        ? `已选: ${this.assetState.selectedItem.name}`
        : '选择一个素材作为该 NPC 的外观';
    } else {
      target.textContent = '浏览模式';
      applyBtn.style.display = 'none';
      info.textContent = '点击素材预览。从角色自定义进入可应用为主角外观。';
    }
  }

  showAssetLibrary(target = 'browse') {
    this.state = 'asset-library';
    this.assetState.target = target;
    this.assetState.page = 0;
    this.assetState.selectedItem = null;
    this.hideAllOverlays();
    this.initAssetLibrary();
    this.updateAssetFooter();
    document.getElementById('asset-library-overlay').classList.remove('hidden');
    this.updateJingyuanActionButtons();
  }

  closeAssetLibrary() {
    if (this.assetState.returnToCustomize) {
      this.assetState.returnToCustomize = false;
      this.showCustomize();
    } else {
      this.backToMenu();
    }
  }

  async applySelectedAsset() {
    if (!this.assetState.selectedItem) return;
    const item = this.assetState.selectedItem;
    const catConfig = ASSET_CATEGORIES[this.assetState.category];

    // 静远七人：加载该角色全部 5 动作 × 4 帧 = 20 张图片
    if (item.type === 'jingyuan') {
      const characterFrames = await AssetManager.loadJingyuanCharacterFrames(item.characterDir);
      const spriteConfig = {
        type: 'jingyuan',
        name: item.character,
        character: item.character,
        characterDir: item.characterDir,
        characterFrames: characterFrames,
        defaultAction: 'personality',
      };

      if (this.assetState.target === 'player') {
        this.player.setSprite(spriteConfig);
        this.updateSpriteSlotUI();
        this.updateJingyuanActionButtons();
        this.assetState.returnToCustomize = true;
        this.closeAssetLibrary();
      } else if (this.assetState.target.startsWith('npc:')) {
        const npcId = this.assetState.target.substring(4);
        this.npcManager.setNpcSprite(npcId, spriteConfig);
        this.assetState.returnToCustomize = false;
        this.closeAssetLibrary();
      }
      return;
    }

    let frameSize = item.frameSize;
    let frameHeight = item.frameHeight;
    if (!frameSize && catConfig && catConfig.items && catConfig.items.length > 0) {
      frameSize = catConfig.items[0].frameSize;
      frameHeight = catConfig.items[0].frameHeight;
    }

    const img = await AssetManager.loadImage(item.path);
    if (!img) {
      alert('素材加载失败: ' + item.name);
      return;
    }

    const isSpriteCategory = this.assetState.category === 'characters' || this.assetState.category === 'monsters';
    const isObjectItem = item.type === 'object' || (item.type === 'tile' && item.srcW && item.srcH);
    
    const spriteConfig = {
      path: item.path,
      name: item.name,
      type: item.type,
      frameSize: isObjectItem ? item.srcW : (isSpriteCategory ? (frameSize || 32) : img.width),
      frameHeight: isObjectItem ? item.srcH : (isSpriteCategory ? (frameHeight || frameSize || 32) : img.height),
      srcX: item.srcX || 0,
      srcY: item.srcY || 0,
      image: img,
      category: this.assetState.category,
    };

    if (this.assetState.target === 'player') {
      this.player.setSprite(spriteConfig);
      this.updateSpriteSlotUI();
      this.assetState.returnToCustomize = true;
      this.closeAssetLibrary();
    } else if (this.assetState.target.startsWith('npc:')) {
      const npcId = this.assetState.target.substring(4);
      this.npcManager.setNpcSprite(npcId, spriteConfig);
      this.assetState.returnToCustomize = false;
      this.closeAssetLibrary();
    }
  }

  pickPlayerSprite() {
    this.assetState.returnToCustomize = true;
    this.showAssetLibrary('player');
  }

  clearPlayerSprite() {
    this.player.clearSprite();
    this.updateSpriteSlotUI();
    this.updateJingyuanActionButtons();
  }

  updateSpriteSlotUI() {
    const slotEmpty = document.getElementById('sprite-slot-empty');
    const slotPick = document.getElementById('sprite-slot-pick');
    if (!slotEmpty || !slotPick) return;
    const existing = document.getElementById('sprite-slot-current');
    if (existing) existing.remove();

    if (this.player.hasSprite()) {
      slotEmpty.classList.remove('active');
      slotPick.classList.remove('active');

      const slot = document.createElement('button');
      slot.type = 'button';
      slot.className = 'sprite-slot has-sprite active';
      slot.id = 'sprite-slot-current';
      const displayName = this.player.characterFrames
        ? (this.player.sprite.name || this.player.sprite.character || '当前外观')
        : (this.player.sprite.name || '当前外观');
      slot.title = displayName;
      slot.setAttribute('aria-label', '当前外观：' + displayName + '，点击重新选择');

      const cv = document.createElement('canvas');
      cv.width = 48;
      cv.height = 48;
      cv.style.imageRendering = 'pixelated';
      const c = cv.getContext('2d');
      c.imageSmoothingEnabled = false;

      if (this.player.characterFrames) {
        // 静远七人：显示 personality 第 0 帧
        const img = this.player.characterFrames.personality
          ? this.player.characterFrames.personality[0]
          : null;
        if (img) {
          PixelArt.drawJingyuanSprite(c, img, 24, 44, { scale: 1.0, targetH: 40 });
        }
      } else {
        const sp = this.player.sprite;
        const fw = sp.frameSize || sp.image.width;
        const fh = sp.frameHeight || sp.image.height;
        const sx = sp.srcX || 0;
        const sy = sp.srcY || 0;
        const ratio = Math.min(48 / fw, 48 / fh);
        c.drawImage(sp.image, sx, sy, fw, fh, (48 - fw * ratio) / 2, (48 - fh * ratio) / 2, fw * ratio, fh * ratio);
      }
      slot.appendChild(cv);

      const clearX = document.createElement('span');
      clearX.className = 'clear-x';
      clearX.textContent = '×';
      clearX.title = '清除外观';
      clearX.addEventListener('click', (e) => {
        e.stopPropagation();
        this.clearPlayerSprite();
      });
      slot.appendChild(clearX);

      slot.addEventListener('click', () => {
        this.pickPlayerSprite();
      });

      document.getElementById('sprite-slot-row').insertBefore(slot, slotPick);
    } else {
      slotEmpty.classList.add('active');
      slotPick.classList.remove('active');
    }
  }

  toggleFarmPanel() {
    this.showFarmPanel = !this.showFarmPanel;
    if (this.showFarmPanel) this.farmPanelMode = 'status';
    this.updateHUD();
  }

  toggleBattlePanel() {
    this.showBattlePanel = !this.showBattlePanel;
    this.updateHUD();
  }

  toggleQuestPanel() {
    this.showQuestPanel = !this.showQuestPanel;
    this.updateHUD();
  }

  selectSeed(seedId) {
    this.selectedSeed = this.selectedSeed === seedId ? null : seedId;
    if (this.selectedSeed) {
      this.showFarmPanel = false;
      this.showNotification('种子已选择，请点击农场耕地；角色会自动走近种植');
    }
    this.updateHUD();
  }

  plantCropAt(tx, ty) {
    if (this.getCurrentMapId() !== 'farm') {
      this.showNotification('只能在农场耕地种植');
      return false;
    }
    if (!this.selectedSeed) return false;
    const seed = this.selectedSeed;
    const result = this.farmSystem.plantCrop(tx, ty, seed, 'farm');
    if (result) {
      this.selectedSeed = null;
      this.questSystem.recordEvent('plantCrops', 1, { cropId: seed });
      this.saveGame();
      this.updateHUD();
      this.showNotification('种植成功');
      return true;
    }
    this.showNotification(this.farmSystem.getSeedCount(seed) <= 0 ? '种子不足，请到农场面板购买' : '当前季节不能种植该作物');
    return false;
  }

  harvestCropAt(tx, ty) {
    const result = this.farmSystem.harvestCrop(tx, ty, 'farm');
    if (result) {
      this.questSystem.recordEvent('harvestCrops', 1, { cropId: result.cropId });
      this.saveGame();
      this.updateHUD();
      return result;
    }
    return null;
  }

  buySeed(cropId) {
    const result = this.farmSystem.buySeed(cropId);
    if (result) {
      this.saveGame();
      this.updateHUD();
    }
    return result;
  }

  buyBuilding(buildingType) {
    const result = this.farmSystem.buyBuilding(buildingType);
    if (result) {
      this.questSystem.recordEvent('buildFarm', 1, { buildingType });
      this.saveGame();
      this.updateHUD();
    }
    return result;
  }

  buyAnimal(animalId) {
    const result = this.farmSystem.buyAnimal(animalId);
    if (result) {
      this.questSystem.recordEvent('raiseAnimal', 1, { animalId });
      this.saveGame();
      this.updateHUD();
    }
    return result;
  }

  sellItem(itemId) {
    const result = this.farmSystem.sellItem(itemId);
    if (result) {
      this.questSystem.recordEvent('sellItem', result, { itemId });
      this.saveGame();
      this.updateHUD();
    }
    return result;
  }

  advanceDay() {
    this.farmSystem.advanceDay();
    this.saveGame();
    this.updateHUD();
  }

  startBattle() {
    if (this.mapManager.mapName === '矿洞') {
      const monster = this.battleSystem.startBattle();
      this.showBattlePanel = true;
      this.saveGame();
      this.updateHUD();
      return monster;
    }
    this.showNotification('请先前往矿洞并与矿门互动');
    return null;
  }

  playerAttack() {
    const result = this.battleSystem.playerAttack();
    if (result) {
      if (result.result === 'victory') {
        this.questSystem.recordEvent('defeatMonster', 1, { isBoss: result.isBoss });
        this.farmSystem.money += result.gold || 0;
        (result.drops || []).forEach(itemId => this.farmSystem.addItem(itemId, 1));
        this.showNotification(`战斗胜利，矿门已开启！获得 ${result.gold || 0} 金币`);
      }
      this.saveGame();
      this.updateHUD();
    }
    return result;
  }

  goDownMine() {
    const result = this.battleSystem.goDown();
    if (result) {
      this.questSystem.recordEvent('reachMineFloor', this.battleSystem.maxFloorReached);
      this.saveGame();
      this.showNotification(`进入矿洞第 ${this.battleSystem.currentFloor} 层`);
      this.updateHUD();
    } else {
      this.showNotification(this.battleSystem.isInBattle ? '请先完成当前战斗' : '击败本层怪物后才能进入下一层');
    }
    return result;
  }

  acceptQuest(questId) {
    const result = this.questSystem.acceptQuest(questId);
    if (result) {
      this.updateHUD();
      this.saveGame();
    }
    return result;
  }

  collectQuestReward(questId) {
    const rewards = this.questSystem.completeQuest(questId);
    if (rewards) {
      if (rewards.money) this.farmSystem.money += rewards.money;
      if (rewards.exp) this.questSystem.addExp(rewards.exp);
      if (rewards.items) {
        rewards.items.forEach(itemId => {
          if (itemId.startsWith('seed_')) {
            this.farmSystem.addItem(itemId, 1);
          } else {
            this.farmSystem.addItem(itemId, 1);
          }
        });
      }
      this.updateHUD();
      this.saveGame();
    }
    return rewards;
  }

  getCurrentMapId() {
    if (this.mapManager.mapName === '农场') return 'farm';
    if (this.mapManager.mapName === '矿洞') return 'mine';
    return `map-${this.mapManager.selectedMapIndex}`;
  }

  saveGame() {
    const pos = this.player.getPosition();
    return this.saveSystem.save({
      mapIndex: this.mapManager.selectedMapIndex,
      player: { x: pos.x, y: pos.y },
      farm: this.farmSystem.serialize(),
      battle: this.battleSystem.serialize(),
      quest: this.questSystem.serialize(),
    });
  }

  restoreGame() {
    const data = this.saveSystem.load();
    if (!data) return false;
    this.farmSystem.restore(data.farm);
    this.battleSystem.restore(data.battle);
    this.questSystem.restore(data.quest);
    if (Number.isInteger(data.mapIndex) && data.mapIndex >= 0 && data.mapIndex < this.mapManager.getMapCount()) {
      this.mapManager.loadMap(data.mapIndex);
      this.pathfinder = new Pathfinder(this.mapManager);
    }
    if (Number.isFinite(data.player?.x) && Number.isFinite(data.player?.y) && !this.mapManager.isSolid(data.player.x, data.player.y)) {
      this.player.setPosition(data.player.x, data.player.y);
      this.restoredPlayerPosition = { x: data.player.x, y: data.player.y };
    }
    return true;
  }

  resetProgress() {
    if (!confirm('确定清除农场、战斗、任务和角色位置进度吗？此操作无法撤销。')) return false;
    this.saveSystem.clear();
    this.farmSystem.reset();
    this.battleSystem.reset();
    this.questSystem.reset();
    this.mapManager.loadMap(0);
    const spawn = this.mapManager.getSafeSpawnPosition();
    this.player.setPosition(spawn.x, spawn.y);
    this.npcManager.loadNpcsForMap(this.mapManager.mapName);
    this.pendingInteraction = null;
    this.updateHUD();
    this.showNotification('游戏进度已重置');
    return true;
  }

  loop() {
    const now = performance.now();
    const dt = Math.min(100, now - this.lastTime);
    this.lastTime = now;

    this.update(dt);
    this.render();

    this.rafId = requestAnimationFrame(() => this.loop());
  }
}
