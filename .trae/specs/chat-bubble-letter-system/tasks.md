# 游戏内对话气泡与信件系统 - 实施计划

## [ ] Task 1: 扩展多人同步系统 - 新增 chat 消息类型
- **Priority**: high
- **Depends On**: None
- **Description**: 
  - 在 MultiplayerSync 中新增 broadcastChat 方法和 chat 消息类型
  - 新增 _handleChat 方法处理收到的聊天消息
  - 新增 chat 事件回调（on('chat', callback)）
  - 消息包含: type, userId, content, timestamp
  - 支持 WebSocket、BroadcastChannel、localStorage 三级降级
- **Acceptance Criteria Addressed**: FR-7
- **Test Requirements**:
  - `programmatic` TR-1.1: MultiplayerSync.broadcastChat(content) 方法存在且能发送 chat 类型消息
  - `programmatic` TR-1.2: MultiplayerSync.on('chat', callback) 能正确注册并触发回调
  - `programmatic` TR-1.3: 收到的 chat 消息包含 userId、content、timestamp 字段
- **Notes**: 参考现有 interact 消息的实现模式

## [ ] Task 2: 游戏地图渲染器 - 对话气泡渲染系统
- **Priority**: high
- **Depends On**: Task 1
- **Description**: 
  - 在 GameMapRenderer 中新增 chatBubbles 数据结构（本地 + 远程玩家）
  - 新增 showChatBubble(userId, content, isLocal) 方法显示气泡
  - 新增 _updateChatBubbles() 方法在 update 中更新气泡位置和淡出
  - 新增 _drawChatBubbles() 方法在 render 中渲染气泡（DOM 方式，与 interactHint 一致）
  - 气泡 5 秒后自动淡出（淡出时长 0.5 秒）
  - 气泡位置跟随角色头顶
  - 每个玩家最多同时显示 1 条气泡，新消息覆盖旧消息
- **Acceptance Criteria Addressed**: FR-2, FR-3, FR-4, FR-7
- **Test Requirements**:
  - `programmatic` TR-2.1: showChatBubble 方法能在角色上方创建气泡 DOM 元素
  - `programmatic` TR-2.2: 气泡在 5 秒后开始淡出，0.5 秒完成后移除
  - `human-judgement` TR-2.3: 气泡样式为白色圆角背景带小尾巴，文字清晰可读
  - `human-judgement` TR-2.4: 角色移动时气泡同步跟随移动
- **Notes**: 参考 _updateInteractHint 的 DOM 定位方式

## [ ] Task 3: 底部聊天输入框 UI
- **Priority**: high
- **Depends On**: Task 2
- **Description**: 
  - 在 index.html 中添加聊天输入框 HTML 结构（位于地图容器内底部）
  - 在 main.css 中添加输入框样式（白色边框，与截图风格一致）
  - 在 app.js 中绑定输入框事件（Enter 发送、字数限制 50 字）
  - 仅在多人模式下显示输入框
  - 发送后调用 GameMapRenderer.showChatBubble 和 MultiplayerSync.broadcastChat
- **Acceptance Criteria Addressed**: FR-1, FR-9
- **Test Requirements**:
  - `programmatic` TR-3.1: 聊天输入框 id 为 chat-input，位于地图底部
  - `programmatic` TR-3.2: Enter 键触发消息发送
  - `programmatic` TR-3.3: 超过 50 字无法继续输入
  - `human-judgement` TR-3.4: 输入框样式与整体 UI 风格一致
- **Notes**: 位置参考 mobile-actions 区域附近

## [ ] Task 4: 对话自动生成信件
- **Priority**: high
- **Depends On**: Task 3
- **Description**: 
  - 在 app.js 中新增 _handleChatMessage 处理聊天消息
  - 发送消息时自动在共享信箱中生成一封对话信
  - 信件类型标记为 chat-letter
  - 信件标题：内容前 10 字 + "..."
  - 信件内容：完整对话内容
  - 发件人：当前用户角色名
  - 使用 STORAGE.saveSharedLetterWithMedia 保存
- **Acceptance Criteria Addressed**: FR-5, FR-6
- **Test Requirements**:
  - `programmatic` TR-4.1: 发送聊天后共享信箱中新增 chat-letter 类型信件
  - `programmatic` TR-4.2: 信件内容与聊天内容一致
  - `programmatic` TR-4.3: 发件人标识正确
- **Notes**: 基于现有的共享信箱机制，对方登录后即可看到

## [ ] Task 5: 远程消息接收与气泡显示
- **Priority**: high
- **Depends On**: Task 4
- **Description**: 
  - 在 app.js 的多人初始化中注册 chat 事件监听
  - 收到远程聊天消息时调用 GameMapRenderer.showChatBubble 显示对方气泡
  - 收到远程消息时也在共享信箱中生成对方的对话信
  - 新信件到达时触发信箱提示（闪烁/红点）
- **Acceptance Criteria Addressed**: FR-3, FR-6
- **Test Requirements**:
  - `programmatic` TR-5.1: 收到远程 chat 事件时正确显示气泡
  - `programmatic` TR-5.2: 收到远程消息时共享信箱新增对方的对话信
  - `human-judgement` TR-5.3: 远程玩家气泡显示在正确的远程玩家头顶
- **Notes**: 需区分本地和远程消息的发件人

## [ ] Task 6: 同步 dist 目录与版本号更新
- **Priority**: high
- **Depends On**: Task 5
- **Description**: 
  - 将所有修改同步到 dist 目录对应文件
  - 更新 index.html 和 dist/index.html 中的版本号
  - 确保所有修改的 JS/CSS 文件版本号递增
- **Acceptance Criteria Addressed**: 所有 FR
- **Test Requirements**:
  - `programmatic` TR-6.1: dist 目录文件与 src 目录代码一致
  - `programmatic` TR-6.2: 版本号已更新，浏览器可加载最新代码
- **Notes**: 按项目惯例，版本号格式为日期+字母后缀
