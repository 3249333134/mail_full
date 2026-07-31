import { PLAYER_SPEED, MAP_W, MAP_H, TILE } from './gameConfig.js';

// 静远七人动作配置：speed 为 ms/帧
const JINGYUAN_ACTION_CONFIG = {
  personality: { speed: 240, once: false },
  run: { speed: 105, once: false },
  etiquette: { speed: 220, once: true },
  martial: { speed: 110, once: true },
  signature: { speed: 180, once: true },
};

export class Player {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.direction = 'down';
    this.frame = 0;
    this.frameTimer = 0;
    this.moving = false;
    this.path = [];
    this.pathIndex = 0;
    this.color = {
      shirt: '#5fcde4',
      skin: '#f5c89a',
      hair: '#8b4513',
      hairStyle: 0,
    };
    // 精灵图支持
    this.sprite = null; // { path, frameSize, frameHeight, image }

    // 静远七人多动作支持
    this.characterFrames = null; // { personality:[img,img,img,img], run:[...], ... }
    this.currentAction = 'personality';
    this.actionFrame = 0;
    this.actionFrameTimer = 0;
    this.actionOnceDone = false;
    this.actionOverride = null; // 临时触发的单次动作（如 martial）
  }

  setSprite(spriteConfig) {
    // 清理旧状态
    this.characterFrames = null;
    this.currentAction = 'personality';
    this.actionFrame = 0;
    this.actionFrameTimer = 0;
    this.actionOnceDone = false;
    this.actionOverride = null;

    if (spriteConfig && spriteConfig.type === 'jingyuan') {
      // 静远七人：保存角色所有动作帧
      this.characterFrames = spriteConfig.characterFrames;
      this.sprite = spriteConfig;
    } else {
      this.sprite = spriteConfig;
    }
  }

  clearSprite() {
    this.sprite = null;
    this.characterFrames = null;
    this.currentAction = 'personality';
    this.actionFrame = 0;
    this.actionFrameTimer = 0;
    this.actionOnceDone = false;
    this.actionOverride = null;
  }

  hasSprite() {
    if (this.characterFrames) return true;
    return this.sprite && this.sprite.image;
  }

  // 触发一次单次播放的动作（martial/etiquette/signature）
  playActionOnce(action) {
    if (!this.characterFrames || !JINGYUAN_ACTION_CONFIG[action]) return;
    const cfg = JINGYUAN_ACTION_CONFIG[action];
    if (!cfg.once) return; // 只允许单次动作
    this.actionOverride = action;
    this.actionFrame = 0;
    this.actionFrameTimer = 0;
    this.actionOnceDone = false;
  }

  clearActionOverride() {
    this.actionOverride = null;
    this.actionFrame = 0;
    this.actionFrameTimer = 0;
    this.actionOnceDone = false;
  }

  // 获取当前帧对应的 HTMLImageElement
  getCurrentActionFrame() {
    if (!this.characterFrames) return null;
    const action = this.actionOverride || this.currentAction;
    const frames = this.characterFrames[action];
    if (!frames || frames.length === 0) return null;
    return frames[this.actionFrame] || frames[0];
  }

  setPosition(x, y) {
    this.x = x;
    this.y = y;
  }

  setPath(path) {
    this.path = path;
    this.pathIndex = 0;
  }

  update(dt, mapManager, keys = {}) {
    let dx = 0, dy = 0;

    const manualX = (keys.d || keys.arrowright ? 1 : 0) - (keys.a || keys.arrowleft ? 1 : 0);
    const manualY = (keys.s || keys.arrowdown ? 1 : 0) - (keys.w || keys.arrowup ? 1 : 0);

    if (manualX !== 0 || manualY !== 0) {
      const length = Math.hypot(manualX, manualY);
      dx = manualX / length;
      dy = manualY / length;
      this.path = [];
      this.pathIndex = 0;
    }

    if (dx === 0 && dy === 0 && this.path.length > 0 && this.pathIndex < this.path.length) {
      const target = this.path[this.pathIndex];
      const distX = target.x - this.x;
      const distY = target.y - this.y;
      const dist = Math.sqrt(distX * distX + distY * distY);

      if (dist < 4) {
        this.pathIndex++;
        if (this.pathIndex >= this.path.length) {
          this.path = [];
          this.pathIndex = 0;
        }
      } else {
        dx = distX / dist;
        dy = distY / dist;
      }
    }

    const speed = PLAYER_SPEED;
    const nx = this.x + dx * speed;
    const ny = this.y + dy * speed;

    let actuallyMoved = false;

    if (dx !== 0 || dy !== 0) {
      if (this.canMoveTo(nx, this.y, mapManager)) {
        this.x = nx;
        actuallyMoved = true;
      }
      if (this.canMoveTo(this.x, ny, mapManager)) {
        this.y = ny;
        actuallyMoved = true;
      }
    }

    if (actuallyMoved) {
      this.moving = true;
      if (Math.abs(dx) > Math.abs(dy)) {
        this.direction = dx > 0 ? 'right' : 'left';
      } else {
        this.direction = dy > 0 ? 'down' : 'up';
      }
      this.frameTimer += dt;
      if (this.frameTimer > 180) {
        this.frameTimer = 0;
        this.frame = (this.frame + 1) % 2;
      }
    } else {
      this.moving = false;
      this.frame = 0;
      this.frameTimer = 0;
    }

    // 静远七人动画帧更新
    if (this.characterFrames) {
      this.updateJingyuanAnimation(dt, actuallyMoved);
    }

    this.x = Math.max(8, Math.min(MAP_W * TILE - 8, this.x));
    this.y = Math.max(12, Math.min(MAP_H * TILE - 4, this.y));
  }

  // 静远七人专用动画更新
  updateJingyuanAnimation(dt, isMoving) {
    // 如果有临时触发的单次动作，优先播放
    if (this.actionOverride) {
      const cfg = JINGYUAN_ACTION_CONFIG[this.actionOverride];
      this.actionFrameTimer += dt;
      if (this.actionFrameTimer >= cfg.speed) {
        this.actionFrameTimer = 0;
        if (this.actionFrame < 3) {
          this.actionFrame++;
        } else {
          // 末帧保持，标记完成
          this.actionOnceDone = true;
        }
      }
      return;
    }

    // 否则根据移动状态自动选择循环动作
    const targetAction = isMoving ? 'run' : 'personality';
    if (this.currentAction !== targetAction) {
      this.currentAction = targetAction;
      this.actionFrame = 0;
      this.actionFrameTimer = 0;
    }

    const cfg = JINGYUAN_ACTION_CONFIG[this.currentAction];
    this.actionFrameTimer += dt;
    if (this.actionFrameTimer >= cfg.speed) {
      this.actionFrameTimer = 0;
      this.actionFrame = (this.actionFrame + 1) % 4;
    }
  }

  canMoveTo(nx, ny, mapManager) {
    const hw = 6, hh = 8;
    const corners = [
      [nx - hw, ny - hh],
      [nx + hw - 1, ny - hh],
      [nx - hw, ny + hh - 1],
      [nx + hw - 1, ny + hh - 1],
    ];
    for (const [cx, cy] of corners) {
      if (mapManager.isSolid(cx, cy)) return false;
    }
    return true;
  }

  isMoving() {
    return this.moving;
  }

  getPosition() {
    return { x: this.x, y: this.y };
  }

  getDirection() {
    return this.direction;
  }

  getFrame() {
    return this.frame;
  }

  getColor() {
    return { ...this.color };
  }

  setColor(color) {
    this.color = { ...color };
  }

  stopMoving() {
    this.path = [];
    this.pathIndex = 0;
    this.moving = false;
    this.frame = 0;
    this.frameTimer = 0;
  }
}
