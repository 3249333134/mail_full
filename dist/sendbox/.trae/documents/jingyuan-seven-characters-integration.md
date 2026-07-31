# 静远七人角色集成与动作交互设计

## Context（背景）

用户提供了一个外部资源包 `d:\prj\sendbox\fill\jingyuan-chibi20-delivery-20260719\`，包含 7 名角色（周然、贺清风、任朝野、沈池懿、戚凭川、江淮安、唐挽初），每人 20 个动作帧（5 类动作 × 4 帧），共 140 张透明 PNG 独立帧。

每角色的 5 类动作（来自 `frames/manifest.json`）：
- `personality`（性格，循环，240ms/帧）：常态待机
- `run`（跑动，循环，105ms/帧）：移动时
- `etiquette`（拱手礼，播放一次，220ms/帧）：交互行礼
- `martial`（武艺，播放一次，110ms/帧）：攻击
- `signature`（招牌，播放一次，180ms/帧）：专属大招

目标：把这 7 个角色加入游戏素材库，并根据动作类型设计游戏内交互（待机/移动/攻击/行礼/大招）。

## 现状分析

- [player.js](file:///d:/prj/sendbox/src/player.js) 的 `frame` 只在 0/1 间切换（第 93 行 `% 2`），适合 32x32 双帧精灵图，不适合 4 帧动画
- 移动方式是点击寻路（[game.js:202](file:///d:/prj/sendbox/src/game.js#L202) 的 `pathfinder.findPath`），非键盘控制
- 已有键盘交互：`E` 对话、`M` 编辑、`C` 自定义（[game.js:155-164](file:///d:/prj/sendbox/src/game.js#L155-L164)）
- [assetManifest.js](file:///d:/prj/sendbox/src/assetManifest.js) 现有分类：characters/monsters/fruits/buttons/levels/skills/weapons/terrain/interior
- [pixelArt.js 的 drawSprite](file:///d:/prj/sendbox/src/pixelArt.js#L569) 已支持 `srcX/srcY` 切片，但静远七人的每帧是独立 PNG，需用 images 数组而非切片
- [applySelectedAsset](file:///d:/prj/sendbox/src/game.js#L1207) 当前只把单张图作为 sprite，无多动作支持

## 实施方案

### 步骤 1：拷贝资源到游戏 assets 目录

把整个 `jingyuan-chibi20-delivery-20260719` 文件夹拷贝到 `src/assets/characters/jingyuan/`，保留 7 个角色子目录结构。

最终路径形如：
- `src/assets/characters/jingyuan/01-周然/frames/personality/00.png`
- `src/assets/characters/jingyuan/01-周然/frames/run/00.png`
- ...（共 140 张帧 + 7 个 manifest.json + spritesheet 等）

### 步骤 2：在 assetManifest.js 新增 `jingyuan` 分类

在 `ASSET_CATEGORIES` 中新增 `jingyuan` 分类，放在 `characters` 之后：

```javascript
jingyuan: {
  name: '静远七人',
  icon: '🎭',
  description: '静远七人 Q 版像素角色，每人 20 帧动作',
  items: buildJingyuanItems(),
}
```

新增辅助函数 `buildJingyuanItems()`，遍历 7 角色 × 5 动作 × 4 帧，生成 140 个素材项。每个 item 字段：
- `name`: "周然 - 性格 01"
- `path`: "characters/jingyuan/01-周然/frames/personality/00.png"
- `type`: "jingyuan"
- `group`: "周然"（角色名，用于分组筛选）
- `character`: "周然"
- `characterDir`: "01-周然"
- `action`: "personality"
- `frameIndex`: 0
- `actionSpeed`: 240
- `actionOnce`: false

角色与动作清单硬编码在函数内（7 项 + 5 项），动作 speed/once 从 manifest.json 同步。

### 步骤 3：扩展 player.js 支持多动作动画

在 `Player` 类中新增字段：

```javascript
// 静远七人多动作支持
this.characterFrames = null; // { personality:[img,img,img,img], run:[...], ... }
this.currentAction = 'personality';
this.actionFrame = 0;
this.actionFrameTimer = 0;
this.actionOnceDone = false;
this.actionOverride = null; // 临时触发的单次动作
```

修改 `setSprite(spriteConfig)`：
- 若 `spriteConfig.type === 'jingyuan'`，保存 `characterFrames`（由 game.js 预加载好传入），重置动作状态为 `personality`
- 否则按原逻辑保存单图 sprite

修改 `update(dt, mapManager)`：
- 位置/移动逻辑保持不变
- 动画帧逻辑改为：
  - 若有 `actionOverride`：按其 `actionSpeed` 推进 `actionFrame`，到达末帧后保持（`actionOnceDone=true`），由外部清除
  - 否则根据 `moving` 自动选择 `run`（移动）或 `personality`（静止），按 `actionSpeed` 循环
  - 仅当 `characterFrames` 存在时走新逻辑，否则保持原 `frame` 0/1 切换

新增方法：
- `playActionOnce(action)`: 设置 `actionOverride`，重置 `actionFrame=0`, `actionOnceDone=false`
- `clearActionOverride()`: 清除临时动作，回到 `personality`/`run`
- `getCurrentActionFrame()`: 返回当前帧对应的 HTMLImageElement（`characterFrames[currentAction][actionFrame]`）

### 步骤 4：修改 game.js 的 applySelectedAsset 与渲染

修改 [applySelectedAsset](file:///d:/prj/sendbox/src/game.js#L1207)：

```javascript
if (item.type === 'jingyuan') {
  // 加载该角色所有 5 动作 × 4 帧 = 20 张图片
  const characterFrames = await AssetManager.loadJingyuanCharacterFrames(item.characterDir);
  const spriteConfig = {
    type: 'jingyuan',
    name: item.character,
    character: item.character,
    characterDir: item.characterDir,
    characterFrames: characterFrames,
    defaultAction: 'personality',
  };
  this.player.setSprite(spriteConfig);
  // NPC 同理
}
```

修改玩家渲染（[game.js:878-889](file:///d:/prj/sendbox/src/game.js#L878-L889)）：

```javascript
if (this.player.hasSprite()) {
  if (this.player.characterFrames) {
    const img = this.player.getCurrentActionFrame();
    PixelArt.drawJingyuanSprite(ctx, img, pos.x, pos.y, { scale: 1.0 });
  } else {
    // 原 drawSprite 逻辑
  }
}
```

修改 [updatePreview](file:///d:/prj/sendbox/src/game.js#L391) 和 `updateSpriteSlotUI` 同样支持 jingyuan 类型。

### 步骤 5：在 assetManager.js 新增 loadJingyuanCharacterFrames

```javascript
async loadJingyuanCharacterFrames(characterDir) {
  const actions = ['personality', 'run', 'etiquette', 'martial', 'signature'];
  const result = {};
  for (const action of actions) {
    const frames = [];
    for (let i = 0; i < 4; i++) {
      const path = `characters/jingyuan/${characterDir}/frames/${action}/${String(i).padStart(2, '0')}.png`;
      const img = await this.loadImage(path);
      frames.push(img);
    }
    result[action] = frames;
  }
  return result;
}
```

### 步骤 6：在 pixelArt.js 新增 drawJingyuanSprite

```javascript
function drawJingyuanSprite(ctx, image, x, y, opts = {}) {
  if (!image || !image.width || !image.height) return;
  const { scale = 1.0 } = opts;
  // 静远七人帧尺寸较大（约 139×249），缩小到合理显示尺寸
  const targetH = 64; // 与其他角色视觉高度接近
  const ratio = targetH / image.height;
  const dw = image.width * ratio * scale;
  const dh = image.height * ratio * scale;
  const dx = Math.floor(x - dw / 2);
  const dy = Math.floor(y - dh);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(image, dx, dy, dw, dh);
}
```

### 步骤 7：设计键盘交互触发动作

在 [game.js setupInput](file:///d:/prj/sendbox/src/game.js#L140) 的 `state === 'playing'` 分支中新增：

- **空格键** → 触发 `martial`（武艺攻击），播放一次后回到 `personality`
- **Q 键** → 触发 `etiquette`（拱手礼），播放一次；若附近有 NPC，自动触发对话
- **R 键** → 触发 `signature`（招牌大招），播放一次

实现：
```javascript
if (e.key === ' ') {
  if (this.player.characterFrames) {
    this.player.playActionOnce('martial');
    e.preventDefault();
  }
}
if (e.key.toLowerCase() === 'q') {
  if (this.player.characterFrames) {
    this.player.playActionOnce('etiquette');
    // 行礼动作播放 0.9 秒后尝试交互
    setTimeout(() => this.tryInteract(), 900);
  }
}
if (e.key.toLowerCase() === 'r') {
  if (this.player.characterFrames) {
    this.player.playActionOnce('signature');
  }
}
```

在 [update()](file:///d:/prj/sendbox/src/game.js#L761) 中检测单次动作播放完成：
```javascript
if (this.player.actionOverride && this.player.actionOnceDone) {
  // 播放完成后 200ms 清除，让玩家看到末帧
  setTimeout(() => this.player.clearActionOverride(), 200);
}
```

### 步骤 8：在操作说明中补充新按键

修改 [index.html 操作说明区块](file:///d:/prj/sendbox/src/index.html#L771) 新增：
- 空格：武艺攻击（仅静远七人角色）
- Q：拱手行礼（可触发 NPC 对话）
- R：招牌大招

## 关键文件清单

- `d:\prj\sendbox\src\assets\characters\jingyuan\` （新增目录，拷贝资源）
- [d:\prj\sendbox\src\assetManifest.js](file:///d:/prj/sendbox/src/assetManifest.js)（新增 jingyuan 分类 + buildJingyuanItems 函数）
- [d:\prj\sendbox\src\assetManager.js](file:///d:/prj/sendbox/src/assetManager.js)（新增 loadJingyuanCharacterFrames 方法）
- [d:\prj\sendbox\src\player.js](file:///d:/prj/sendbox/src/player.js)（新增 characterFrames/动作状态机/playActionOnce）
- [d:\prj\sendbox\src\pixelArt.js](file:///d:/prj/sendbox/src/pixelArt.js)（新增 drawJingyuanSprite）
- [d:\prj\sendbox\src\game.js](file:///d:/prj/sendbox/src/game.js)（修改 applySelectedAsset/渲染/键盘交互）
- [d:\prj\sendbox\src\index.html](file:///d:/prj/sendbox/src/index.html)（操作说明补充）

## 验证方案

1. 启动开发服务器：`cd d:\prj\sendbox && npm run dev`（或 vite）
2. 浏览器打开游戏，进入「素材库」
3. 应看到新增「🎭 静远七人」分类，计数 140
4. 点击分类，看到 7 个角色分组按钮（全部/周然/贺清风/...）
5. 切换到「周然」分组，看到 20 个素材项（性格 01-04、跑动 01-04、礼仪 01-04、武艺 01-04、招牌 01-04），预览图正确居中
6. 进入「角色自定义」→ 点击外观插槽 → 在素材库选「周然-性格 01」→ 应用
7. 角色自定义预览图中显示周然 personality 第 0 帧
8. 点击「确认」回到菜单 → 「开始游戏」
9. 游戏中玩家显示为周然，静止时循环播放 personality 4 帧动画
10. 点击地图移动，玩家切换到 run 动画（4 帧循环）
11. 按空格键，播放一次 martial 武艺动作后回到待机
12. 走到 NPC 附近按 Q 键，玩家行拱手礼，动作末段自动触发 NPC 对话
13. 按 R 键，播放 signature 招牌大招
14.