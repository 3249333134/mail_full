# 静远七人动作按钮与 NPC 支持实施计划

## 摘要

基于用户反馈"你应该根据状态确定动作，现在是循环，应该设计到打斗接任务静息那些，然后旁边可以增加打斗那些按钮"，在已完成的静远七人角色集成基础上：

1. **修复 NPC 渲染不支持静远角色的关键 bug**：当前 `applySelectedAsset` 允许将静远角色应用到 NPC（target='npc:<id>'），但 [npcManager.js](file:///d:/prj/sendbox/src/npcManager.js) 的 NPC 类没有 `characterFrames` 字段，[game.js:881-904](file:///d:/prj/sendbox/src/game.js#L881-L904) NPC 渲染没有 `drawJingyuanSprite` 分支，导致应用后 NPC 沉默回退到默认颜色块。

2. **增加 UI 动作按钮栏**：在游戏界面右侧增加"打斗/礼仪/招牌"3 个动作按钮（仅在玩家使用静远角色时显示），替代纯键盘交互，让用户通过点击触发 martial/etiquette/signature 动作。

3. **状态徽章**：在 HUD 顶部显示当前动作状态（待机/移动/打斗/行礼/招牌），让用户清楚当前角色状态。

4. **浏览器自动化测试验证**。

---

## 当前状态分析

### 已完成（前期工作）
- 7 个角色资源已拷贝到 `src/assets/characters/jingyuan/{01-周然..07-唐挽初}/frames/{personality,run,etiquette,martial,signature}/{00-03}.png`
- [assetManifest.js](file:///d:/prj/sendbox/src/assetManifest.js) 新增 jingyuan 分类（140 项）
- [assetManager.js](file:///d:/prj/sendbox/src/assetManager.js) 新增 `loadJingyuanCharacterFrames` 方法
- [player.js](file:///d:/prj/sendbox/src/player.js) 完整实现多动作动画状态机（`characterFrames`、`playActionOnce`、`updateJingyuanAnimation`、`getCurrentActionFrame`）
- [pixelArt.js](file:///d:/prj/sendbox/src/pixelArt.js) 新增 `drawJingyuanSprite` 函数
- [game.js](file:///d:/prj/sendbox/src/game.js) 玩家渲染、预览、slot UI、键盘交互（空格/Q/R）、actionOnceDone 自动清除
- [index.html](file:///d:/prj/sendbox/src/index.html) help-overlay 新增按键说明

### 关键问题
**问题 1：NPC 不支持静远角色（沉默失败）**
- [npcManager.js:80](file:///d:/prj/sendbox/src/npcManager.js#L80) NPC 的 `sprite` 字段只兼容传统精灵图（`{path, frameSize, frameHeight, image}`），没有 `characterFrames`、`currentAction`、`actionFrame` 等动画状态字段
- [npcManager.js:105-107](file:///d:/prj/sendbox/src/npcManager.js#L105-L107) `hasNpcSprite()` 只检查 `npc.sprite && npc.sprite.image`，对静远 spriteConfig（无 image，有 characterFrames）返回 false
- [npcManager.js:113-154](file:///d:/prj/sendbox/src/npcManager.js#L113-L154) `update()` 方法只更新 `frame`/`frameTimer`（2 帧步行动画），没有静远动画更新逻辑
- [game.js:881-904](file:///d:/prj/sendbox/src/game.js#L881-L904) NPC 渲染分支只有 `drawSprite`（传统精灵图）和 `drawCharacter`（默认颜色块），没有 `drawJingyuanSprite` 分支

**问题 2：动作触发仅靠键盘，不直观**
- 当前只能通过空格/Q/R 键触发 martial/etiquette/signature
- [index.html:690-694](file:///d:/prj/sendbox/src/index.html#L690-L694) 现有 `.action-btns` 容器只在移动端显示（`@media (max-width: 768px)`），桌面端 `display: none`
- 现有 `.action-btns` 只有 E/M/C 三个按钮（交互/编辑/自定义），没有静远动作按钮

**问题 3：无状态指示**
- [index.html:675-678](file:///d:/prj/sendbox/src/index.html#L675-L678) `hud-top` 只有 `mode-badge`（游玩模式）和 `map-badge`（地图名），没有显示玩家当前动作状态

---

## 提议的修改

### 修改 1：NPC 支持静远角色（关键 bug 修复）

**文件**：[d:\prj\sendbox\src\npcManager.js](file:///d:/prj/sendbox/src/npcManager.js)

**改动内容**：

1. **NPC 类字段扩展**（`loadNpcsForMap` 方法中第 70-81 行的 map 回调）：
   - 新增字段：`characterFrames`（null）、`currentAction`（'personality'）、`actionFrame`（0）、`actionFrameTimer`（0）
   - 保留现有 `sprite` 字段兼容传统精灵图

2. **`setNpcSprite` 方法增强**（第 85-93 行）：
   ```javascript
   setNpcSprite(npcId, spriteConfig) {
     for (const npc of this.npcs) {
       if (npc.id === npcId) {
         // 清理静远状态
         npc.characterFrames = null;
         npc.currentAction = 'personality';
         npc.actionFrame = 0;
         npc.actionFrameTimer = 0;
         
         if (spriteConfig && spriteConfig.type === 'jingyuan') {
           npc.characterFrames = spriteConfig.characterFrames;
           npc.sprite = spriteConfig; // 保留引用以便类型判断
         } else {
           npc.sprite = spriteConfig;
         }
         return true;
       }
     }
     return false;
   }
   ```

3. **`hasNpcSprite` 方法增强**（第 105-107 行）：
   ```javascript
   hasNpcSprite(npc) {
     if (npc && npc.characterFrames) return true; // 静远角色
     return !!(npc && npc.sprite && npc.sprite.image); // 传统精灵图
   }
   ```

4. **`update` 方法新增静远动画更新逻辑**（第 113-154 行）：
   - 在每个 NPC 更新循环中，若 `npc.characterFrames` 存在，根据 `npc.wander` 状态切换 action（wander=true → 'run'，wander=false → 'personality'）
   - 复用 player.js 中的 `JINGYUAN_ACTION_CONFIG` 速度配置（导入或复制常量）
   - 更新 `actionFrame`/`actionFrameTimer`
   - NPC 不需要 martial/etiquette/signature 触发（仅玩家触发）

5. **新增 `getNpcActionFrame(npc)` 方法**：
   ```javascript
   getNpcActionFrame(npc) {
     if (!npc.characterFrames) return null;
     const frames = npc.characterFrames[npc.currentAction];
     if (!frames || frames.length === 0) return null;
     return frames[npc.actionFrame] || frames[0];
   }
   ```

**文件**：[d:\prj\sendbox\src\game.js](file:///d:/prj/sendbox/src/game.js)（NPC 渲染部分，第 881-904 行）

**改动内容**：在 NPC 渲染分支中新增静远角色分支：
```javascript
} else if (e.type === 'npc') {
  const n = e.npc;
  if (n.characterFrames) {
    // 静远七人 NPC 渲染
    const img = this.npcManager.getNpcActionFrame(n);
    if (img) {
      PixelArt.drawJingyuanSprite(ctx, img, n.x, n.y, { scale: 1.0, targetH: 64 });
    }
  } else if (this.npcManager.hasNpcSprite(n)) {
    // 传统精灵图渲染（保持原逻辑）
    ...
  } else {
    // 默认颜色块（保持原逻辑）
    ...
  }
  // 名称标签（保持原逻辑）
}
```

---

### 修改 2：增加 UI 动作按钮栏

**文件**：[d:\prj\sendbox\src\index.html](file:///d:/prj/sendbox/src/index.html)

**改动内容**：在 `.action-btns` 容器之后（或之前）新增静远动作按钮栏：

```html
<!-- 静远七人动作栏（仅玩家使用静远角色时显示） -->
<div class="jingyuan-action-bar hidden" id="jingyuan-action-bar">
  <button class="jingyuan-action-btn martial" id="jy-btn-martial" title="武艺攻击（空格）">
    <span class="icon">⚔</span>
    <span class="label">打斗</span>
  </button>
  <button class="jingyuan-action-btn etiquette" id="jy-btn-etiquette" title="拱手行礼（Q）">
    <span class="icon">🙏</span>
    <span class="label">行礼</span>
  </button>
  <button class="jingyuan-action-btn signature" id="jy-btn-signature" title="招牌大招（R）">
    <span class="icon">✨</span>
    <span class="label">招牌</span>
  </button>
</div>
```

**新增 CSS 样式**（在 `<style>` 块中，约第 273 行 `.action-btn.green` 之后）：

```css
.jingyuan-action-bar {
  position: absolute;
  bottom: 80px;
  right: 12px;
  z-index: 5;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.jingyuan-action-bar.hidden { display: none; }
.jingyuan-action-btn {
  width: 64px;
  height: 64px;
  border: 3px solid #1a1c2c;
  background: #f9a03f;
  color: #1a1c2c;
  font-family: 'Courier New', monospace;
  font-weight: bold;
  cursor: pointer;
  box-shadow: 0 4px 0 #1a1c2c;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  transition: transform 0.05s, box-shadow 0.05s;
}
.jingyuan-action-btn:active {
  transform: translateY(4px);
  box-shadow: 0 0 0 #1a1c2c;
}
.jingyuan-action-btn:disabled {
  background: #c0c0c0;
  cursor: not-allowed;
  opacity: 0.6;
}
.jingyuan-action-btn .icon { font-size: 22px; line-height: 1; }
.jingyuan-action-btn .label { font-size: 11px; letter-spacing: 1px; }
.jingyuan-action-btn.martial { background: #e74c3c; color: #fff; }
.jingyuan-action-btn.etiquette { background: #5fcde4; }
.jingyuan-action-btn.signature { background: #9b59b6; color: #fff; }
```

**设计考虑**：
- 桌面端和移动端都显示（不使用 `@media`）
- 按钮在玩家使用静远角色时通过 JS 移除 `.hidden` 类显示
- 按钮在动作播放期间禁用（避免重复触发）
- 与现有 `.action-btns`（移动端的 E/M/C 按钮）位置相同但独立容器，避免冲突（`.action-btns` 仅移动端显示，`.jingyuan-action-bar` 全端显示）

---

### 修改 3：game.js 绑定动作按钮事件 + 显示/隐藏逻辑

**文件**：[d:\prj\sendbox\src\game.js](file:///d:/prj/sendbox/src/game.js)

**改动内容**：

1. **在 `setupInput` 方法末尾新增按钮事件绑定**（约第 298 行之后）：
   ```javascript
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
   ```

2. **新增 `triggerJingyuanAction(action)` 方法**：
   ```javascript
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
   ```

3. **新增 `updateJingyuanActionButtons()` 方法**（控制按钮显示/禁用状态）：
   ```javascript
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
   ```

4. **在 `applySelectedAsset` 静远分支末尾调用 `updateJingyuanActionButtons`**（约第 1268 行玩家分支内）：
   ```javascript
   if (this.assetState.target === 'player') {
     this.player.setSprite(spriteConfig);
     this.updateSpriteSlotUI();
     this.updateJingyuanActionButtons(); // 新增
     this.assetState.returnToCustomize = true;
     this.closeAssetLibrary();
   }
   ```

5. **在 `clearPlayerSprite` 方法中调用 `updateJingyuanActionButtons`**（约第 1326 行）：
   ```javascript
   clearPlayerSprite() {
     this.player.clearSprite();
     this.updateSpriteSlotUI();
     this.updateJingyuanActionButtons(); // 新增
   }
   ```

6. **在 `update` 方法中定期更新按钮状态**（约第 789 行 `if (this.state === 'playing')` 块内）：
   ```javascript
   // 动作播放完成后更新按钮状态
   if (this.player.actionOverride && this.player.actionOnceDone) {
     // 现有清除逻辑保持不变
     if (!this.actionClearTimer) {
       this.actionClearTimer = setTimeout(() => {
         this.player.clearActionOverride();
         this.updateJingyuanActionButtons(); // 新增
         this.actionClearTimer = null;
       }, 250);
     }
   }
   ```

7. **在状态切换时更新按钮可见性**（`backToMenu`、`startGame`、`showCustomize`、`closeAssetLibrary` 等方法中调用 `updateJingyuanActionButtons`）：
   - 离开 playing 状态时隐藏按钮
   - 返回 playing 状态时根据角色类型显示按钮

---

### 修改 4：状态徽章显示当前动作

**文件**：[d:\prj\sendbox\src\index.html](file:///d:/prj/sendbox/src/index.html)

**改动内容**：在 `hud-top` 中新增动作状态徽章（约第 675-678 行）：
```html
<div class="hud-top" id="hud-top">
  <div class="hud-badge" id="mode-badge">游玩模式</div>
  <div class="hud-badge" id="map-badge">地图: 村庄</div>
  <div class="hud-badge hidden" id="action-badge" style="background:#9b59b6;">待机</div>
</div>
```

**文件**：[d:\prj\sendbox\src\game.js](file:///d:/prj/sendbox/src/game.js)

**改动内容**：新增 `updateActionBadge()` 方法，根据玩家当前状态更新徽章：
```javascript
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
    const map = { martial: ['打斗', '#e74c3c'], etiquette: ['行礼', '#5fcde4'], signature: ['招牌', '#9b59b6'] };
    const m = map[this.player.actionOverride];
    if (m) { text = m[0]; color = m[1]; }
  } else if (this.player.moving) {
    text = '移动'; color = '#a3d26a';
  } else {
    text = '待机'; color = '#9b59b6';
  }
  badge.textContent = text;
  badge.style.background = color;
}
```

在 `update` 方法的 `if (this.state === 'playing')` 块末尾调用 `this.updateActionBadge()`。

---

### 修改 5：help-overlay 操作说明更新

**文件**：[d:\prj\sendbox\src\index.html](file:///d:/prj/sendbox/src/index.html)

**改动内容**：更新 help-overlay 中的静远动作说明（约第 776-778 行），增加按钮提示：
```html
<div><kbd>空格</kbd> / <kbd>打斗按钮</kbd> &nbsp;武艺攻击（静远七人角色）</div>
<div><kbd>Q</kbd> / <kbd>行礼按钮</kbd> &nbsp;拱手行礼（静远七人，可触发 NPC 对话）</div>
<div><kbd>R</kbd> / <kbd>招牌按钮</kbd> &nbsp;招牌大招（静远七人角色）</div>
```

---

## 假设与决策

### 决策
1. **NPC 动作范围**：NPC 仅使用 personality（待机）和 run（wander 移动）两个循环动作，不触发 martial/etiquette/signature（这些是玩家主动触发的单次动作）。原因：NPC 没有 AI 主动行为，简单循环即可。
2. **按钮位置**：选择右侧垂直排列（bottom: 80px, right: 12px），与现有 `.action-btns` 位置一致但独立容器。考虑过底部水平排列，但会与 `.tile-bar`（编辑模式瓦片栏）冲突。
3. **按钮显示条件**：仅当 `this.player.characterFrames` 存在且 `this.state === 'playing'` 时显示。其他状态（菜单/对话/编辑/自定义）隐藏。
4. **按钮禁用逻辑**：单次动作播放期间禁用所有按钮，避免重复触发导致动画混乱。动作完成（actionOnceDone）后 250ms 自动清除时重新启用。
5. **状态徽章**：显示"待机/移动/打斗/行礼/招牌"5 种状态，用不同颜色区分。仅在玩家使用静远角色时显示。
6. **保留键盘交互**：不删除现有的空格/Q/R 键盘交互，UI 按钮是补充而非替代。键盘用户和鼠标用户都能使用。

### 假设
1. 假设开发服务器仍在 http://localhost:8001/ 运行（如未运行，测试前需启动 `npm run dev`）。
2. 假设 `JINGYUAN_ACTION_CONFIG` 常量在 npcManager.js 中可直接复制（不导入 player.js，避免循环依赖）。
3. 假设 `PixelArt.drawJingyuanSprite` 的 `targetH: 64` 对 NPC 渲染合适（与玩家一致）。

---

## 验证步骤

### 浏览器自动化测试流程

使用 `browser_use` skill 执行以下测试：

1. **导航到游戏页面**
   - `browser_navigate` 到 http://localhost:8001/
   - 截图确认页面加载

2. **验证素材库新增「🎭 静远七人」分类**
   - 点击"素材库"按钮
   - 检查分类导航中是否有「🎭 静远七人」，计数为 140
   - 点击分类，验证 7 个角色分组标签显示

3. **验证角色自定义→应用静远角色**
   - 关闭素材库，点击"角色自定义"
   - 点击外观槽位的"＋"打开素材库（target=player）
   - 选择静远七人分类，点击任一角色素材
   - 点击"应用"按钮
   - 验证预览图显示静远角色 personality 第0帧

4. **验证游戏中玩家显示与动作按钮**
   - 确认自定义，进入游戏
   - 验证玩家显示为静远角色
   - 验证右侧出现"打斗/行礼/招牌"3 个按钮
   - 验证 HUD 顶部出现"待机"徽章

5. **验证循环动作切换**
   - 点击地图某点移动玩家
   - 验证玩家动作切换为 run（移动）
   - 验证徽章变为"移动"
   - 停止移动后验证动作切回 personality（待机）

6. **验证动作按钮触发**
   - 点击"打斗"按钮
   - 验证玩家播放 martial 动作（4 帧序列）
   - 验证按钮在播放期间禁用
   - 验证播放完成后 250ms 按钮恢复可用
   - 验证徽章在播放期间显示"打斗"

7. **验证行礼触发 NPC 对话**
   - 将玩家移近一个 NPC（如村长）
   - 点击"行礼"按钮
   - 验证玩家播放 etiquette 动作
   - 验证 900ms 后触发 NPC 对话

8. **验证 NPC 支持静远角色**
   - 进入素材库（target=npc:<id>）
   - 选择静远角色应用到 NPC
   - 验证 NPC 显示为静远角色（personality 动作循环）
   - 验证 NPC wander 移动时切换为 run 动作

9. **验证键盘交互仍可用**
   - 按空格键验证 martial 触发
   - 按 Q 键验证 etiquette 触发
   - 按 R 键验证 signature 触发

### 测试通过标准
- 所有 9 项验证步骤均通过
- 无控制台错误
- 动画帧率流畅（无明显卡顿）
- 按钮响应及时

---

## 文件改动清单

| 文件 | 改动类型 | 改动内容 |
|------|---------|---------|
| [npcManager.js](file:///d:/prj/sendbox/src/npcManager.js) | 修改 | NPC 类新增 characterFrames 等字段；setNpcSprite/hasNpcSprite/update 增强；新增 getNpcActionFrame |
| [game.js](file:///d:/prj/sendbox/src/game.js) | 修改 | NPC 渲染新增静远分支；新增 triggerJingyuanAction/updateJingyuanActionButtons/updateActionBadge 方法；setupInput 绑定按钮事件；applySelectedAsset/clearPlayerSprite/update 调用更新方法 |
| [index.html](file:///d:/prj/sendbox/src/index.html) | 修改 | 新增 .jingyuan-action-bar HTML 和 CSS；新增 #action-badge 徽章；更新 help-overlay 说明 |

总改动：3 个文件，预计新增约 150 行代码，