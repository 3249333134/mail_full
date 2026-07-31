# 静远七人角色与 20 动作交互 — 最终验证与补全计划

## 摘要

用户原始请求：将 `d:\prj\sendbox\fill\jingyuan-chibi20-delivery-20260719` 中的 7 个角色加入游戏，并根据 20 个动作设计交互。

**当前状态**：所有代码实现已在前期会话中完成（已通过文件审查验证），开发服务器在 http://localhost:8001/ 运行中。剩余工作仅为**端到端浏览器验证**以及**修复验证中发现的问题**（如有）。

**20 个动作的含义**：每角色 5 类动作 × 4 帧 = 20 帧。5 类动作为：
- `personality`（性格待机，循环，240ms/帧）
- `run`（跑动，循环，105ms/帧）
- `etiquette`（拱手礼，单次，220ms/帧）
- `martial`（武艺攻击，单次，110ms/帧）
- `signature`（招牌大招，单次，180ms/帧）

---

## 当前状态分析（实现已就绪）

### 资源层
- ✅ 7 个角色资源已就位：[src/assets/characters/jingyuan/](file:///d:/prj/sendbox/src/assets/characters/jingyuan)
  - 每角色 `frames/{personality,run,etiquette,martial,signature}/{00-03}.png` 共 20 帧
  - 加上 `manifest.json`、`contact-sheet.png`、`spritesheet-*.png`
  - 总计 140 张独立帧 PNG

### 代码层（已全部修改完成）

| 文件 | 改动状态 | 关键内容 |
|------|---------|---------|
| [assetManifest.js](file:///d:/prj/sendbox/src/assetManifest.js) | ✅ | `JINGYUAN_CHARACTERS`、`JINGYUAN_ACTIONS`、`buildJingyuanItems()`、`jingyuan` 分类（140 项） |
| [assetManager.js](file:///d:/prj/sendbox/src/assetManager.js) | ✅ | `loadJingyuanCharacterFrames(characterDir)` 方法（L197） |
| [pixelArt.js](file:///d:/prj/sendbox/src/pixelArt.js) | ✅ | `drawJingyuanSprite(ctx, image, x, y, opts)` 函数（L616） |
| [player.js](file:///d:/prj/sendbox/src/player.js) | ✅ | 完整动作状态机：`characterFrames`、`playActionOnce`、`clearActionOverride`、`getCurrentActionFrame`、`updateJingyuanAnimation` |
| [npcManager.js](file:///d:/prj/sendbox/src/npcManager.js) | ✅ | NPC 支持：`characterFrames` 字段、`setNpcSprite` 增强、`hasNpcSprite` 增强、`getNpcActionFrame`、`updateJingyuanAnimation` |
| [game.js](file:///d:/prj/sendbox/src/game.js) | ✅ | 玩家渲染分支（L1014）、NPC 渲染分支（L978）、3 个按钮事件（L305-312）、`triggerJingyuanAction`（L316）、`updateJingyuanActionButtons`（L336）、`updateActionBadge`（L353） |
| [index.html](file:///d:/prj/sendbox/src/index.html) | ✅ | `.jingyuan-action-bar` CSS（L275）、3 个按钮 HTML（L746）、`#action-badge` 徽章（L726）、help-overlay 更新 |

### 交互设计（已完成）

1. **循环动作自动切换**：
   - 玩家静止 → `personality` 4 帧循环（待机）
   - 玩家移动 → `run` 4 帧循环（跑动）
   - NPC `wander=true` → `run`，`wander=false` → `personality`

2. **单次动作触发**（三种方式）：
   - **键盘**：空格→martial，Q→etiquette，R→signature
   - **UI 按钮**：右侧底部 3 个彩色按钮（红:打斗/蓝:行礼/紫:招牌）
   - 播放完毕后 250ms 自动清除，回到循环动作

3. **etiquette 行礼联动 NPC 对话**：
   - 触发 etiquette 后 900ms 自动调用 `tryInteract()`
   - 若附近有 NPC，进入对话状态

4. **HUD 状态徽章**：
   - 显示"待机/移动/打斗/行礼/招牌"5 种状态
   - 不同颜色区分（紫/绿/红/蓝/紫）

5. **按钮可见性**：
   - 仅当玩家使用静远角色且 `state === 'playing'` 时显示
   - 单次动作播放期间禁用所有按钮

---

## 提议的修改（仅验证与修复）

### 阶段 1：浏览器端到端验证

使用 `browser_use` skill 在 http://localhost:8001/ 上执行 9 步验证流程。验证目标：确认前期实现的代码在运行时按预期工作。

#### 验证步骤

**步骤 1：页面加载与素材库分类检查**
- 导航到 http://localhost:8001/
- 强制刷新（`location.reload()`）确保加载最新代码（无 [JINGYUAN] 旧调试日志）
- 打开素材库，验证「🎭 静远七人」分类存在，计数 140
- 验证 7 个角色分组按钮（全部/周然/贺清风/任朝野/沈池懿/戚凭川/江淮安/唐挽初）

**步骤 2：应用静远角色到玩家**
- 进入"角色自定义"→ 点击外观槽位的"＋"打开素材库（target=player）
- 选择静远七人分类 → 选择任一角色素材 → 点击"应用"
- 验证预览图显示静远角色 personality 第 0 帧

**步骤 3：进入游戏验证玩家显示与 UI**
- 确认自定义，进入游戏（state=playing）
- 验证玩家显示为静远角色
- 验证右侧出现 3 个动作按钮（打斗/行礼/招牌）
- 验证 HUD 顶部出现"待机"徽章

**步骤 4：验证循环动作切换**
- 通过 `browser_evaluate` 设置玩家路径触发移动
- 验证玩家动作切换为 run，徽章变为"移动"
- 等待移动结束后验证动作切回 personality，徽章变"待机"

**步骤 5：验证 martial 动作按钮**
- 点击"打斗"按钮
- 在单个 `browser_evaluate` 内用 `await new Promise(r => setTimeout(r, 50))` 循环检查 `actionOverride` 从 'martial' 变为 null
- 验证播放期间按钮禁用、徽章显示"打斗"
- 验证播放完成后 250ms 按钮恢复可用、徽章回到"待机"

**步骤 6：验证 signature 动作按钮**
- 点击"招牌"按钮
- 验证 actionOverride='signature'，徽章显示"招牌"
- 验证播放完成后自动清除

**步骤 7：验证 NPC 支持静远角色**（前期被截断，需重新验证）
- 调用 `window.Game.startGame()` 加载 NPC（村庄地图有 2 个 NPC：村长爷爷、小花）
- 通过 `browser_evaluate` 调用 `window.Game.showAssetLibrary('npc:elder')` 打开 NPC 素材库
- 选择静远七人角色应用到 NPC
- 验证 `npcHasFrames=true`、`npcSpriteType='jingyuan'`
- 验证 NPC 渲染显示静远角色 personality 动画

**步骤 8：验证 etiquette 行礼触发 NPC 对话**（前期被截断，需重新验证）
- 将玩家移动到 NPC 附近（通过设置 path）
- 点击"行礼"按钮
- 验证 actionOverride='etiquette'，徽章显示"行礼"
- 等待 900ms 后验证 `dialogActive=true` 且 `state='dialog'`

**步骤 9：验证键盘交互**
- 按空格键验证 martial 触发
- 按 Q 键验证 etiquette 触发
- 按 R 键验证 signature 触发
- 检查浏览器控制台无 error 日志

### 阶段 2：修复发现的问题（如有）

若上述验证发现 bug，按以下原则修复：

**可能的已知风险点**：
1. **浏览器缓存旧代码**：若控制台出现 `[JINGYUAN] playActionOnce` 调试日志，说明加载了旧代码。修复：`location.reload(true)` 强制刷新。
2. **NPC 应用静远角色后渲染异常**：检查 `getNpcActionFrame` 返回的图片是否加载完成。
3. **etiquette 触发对话时机**：900ms 计时器在 state 切换时可能失效。检查 `tryInteract` 是否正确找到附近 NPC。
4. **按钮事件绑定时机**：若按钮无响应，检查 `setupInput` 是否在 DOM 元素存在后调用。

**修复约束**：
- 仅修复验证中实际发现的问题，不做超出本计划范围的改动
- 修复后需重新执行对应的验证步骤确认通过
- 每次修复后需 `location.reload()` 强制刷新浏览器

### 阶段 3：最终确认

所有 9 步验证通过后：
1. 截图最终游戏画面（玩家静远角色 + 按钮栏 + 徽章）
2. 截图 NPC 静远角色画面
3. 向用户报告完整验证结果

---

## 假设与决策

### 决策
1. **不重新实现已完成的代码**：经文件审查确认所有代码修改已就位，本计划仅做验证与必要修复。
2. **使用浏览器自动化测试**：用户在前期会话中已选择此验证方式（推荐）。
3. **保留已有计划文件**：`jingyuan-seven-characters-integration.md` 和 `jingyuan-action-buttons-and-npc-support.md` 作为历史记录不删除，本计划为最终验证阶段的总览。
4. **NPC 测试通过 `window.Game.showAssetLibrary('npc:<id>')` 调用**：因 `sprite-slot-pick` div 不被 `browser_click` 识别为可交互元素（前期会话已确认此限制）。
5. **动作时序验证使用单次 `browser_evaluate` 内循环**：避免多次 `browser_evaluate` 调用之间的 agent 处理延迟导致动作已播放完毕的误报。

### 假设
1. 开发服务器持续运行在 http://localhost:8001/（已确认 PID 24740）
2. 前期实现的代码逻辑正确，仅可能存在浏览器缓存或测试时序问题
3. 7 个角色资源完整无缺（已通过 ls 验证 01-周然 目录结构）

---

## 验证通过标准

- ✅ 所有 9 项验证步骤均通过
- ✅ 浏览器控制台无 error 日志
- ✅ 动画帧率流畅（无明显卡顿）
- ✅ 按钮响应及时（点击后立即触发动作）
- ✅ 状态徽章准确反映当前动作
- ✅ NPC 能正确应用并显示静远角色
- ✅ etiquette 行礼能触发 NPC 对话

---

## 文件改动清单

本计划**不预期修改任何文件**。仅在验证发现 bug 时才进行针对性修复，修复文件将限于：
- `d:\prj\sendbox\src\game.js`（若按钮事件/触发逻辑有问题）
- `d:\prj\sendbox\src\npcManager.js`（若 NPC 应用/渲染有问题）
- `d:\prj\sendbox\src\player.js`（若动作状态机有问题）
- `d:\prj\sendbox\src\index.html`（若 UI 元素/CSS 有问题）

若所有验证通过，则不修改任何文件，直接向用户报告任务完成。