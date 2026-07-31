# 游戏内对话气泡与信件系统 - 验证清单

## 多人同步系统
- [ ] MultiplayerSync 新增 broadcastChat(content) 方法
- [ ] MultiplayerSync 新增 chat 事件类型，支持 on('chat', callback)
- [ ] chat 消息包含 userId、content、timestamp 字段
- [ ] 支持 WebSocket、BroadcastChannel、localStorage 三级降级
- [ ] 服务器端（server.js）正确转发 chat 消息到房间内所有玩家

## 对话气泡渲染
- [ ] GameMapRenderer 新增 showChatBubble(userId, content, isLocal) 方法
- [ ] 气泡显示在角色头顶上方
- [ ] 气泡样式为白色圆角背景，带小尾巴指向角色
- [ ] 气泡 5 秒后自动淡出，淡出动画 0.5 秒
- [ ] 每个玩家最多同时显示 1 条气泡
- [ ] 角色移动时气泡同步跟随
- [ ] 本地玩家和远程玩家气泡都能正确显示
- [ ] 气泡在 update 方法中每帧更新位置

## 聊天输入框
- [ ] 地图底部显示聊天输入框（仅多人模式）
- [ ] 输入框 id 为 chat-input
- [ ] Enter 键发送消息
- [ ] 字数限制为 50 字
- [ ] 输入框样式与整体 UI 风格一致
- [ ] 单人模式下不显示输入框

## 对话生成信件
- [ ] 发送聊天后自动在共享信箱生成对话信
- [ ] 信件类型为 chat-letter
- [ ] 信件标题为内容前 10 字 + "..."
- [ ] 信件内容为完整对话内容
- [ ] 发件人标识正确（当前用户角色名）
- [ ] 使用 STORAGE.saveSharedLetterWithMedia 保存

## 远程消息接收
- [ ] 收到远程 chat 事件时显示对方气泡
- [ ] 收到远程消息时共享信箱新增对方的对话信
- [ ] 远程玩家气泡显示在正确的远程玩家头顶
- [ ] 新信件到达时有提示（闪烁/红点）

## dist 目录同步
- [ ] dist/js/multiplayerSync.js 已同步修改
- [ ] dist/js/gameMapRenderer.js 已同步修改
- [ ] dist/js/app.js 已同步修改
- [ ] dist/css/main.css 已同步修改
- [ ] dist/index.html 已同步修改
- [ ] 所有修改文件的版本号已更新

## 集成测试
- [ ] 打开两人同时进入同一房间，可以互相看到对方角色
- [ ] A 发送消息，A 自己头顶显示气泡
- [ ] A 发送消息，B 屏幕上 A 的角色头顶显示气泡
- [ ] A 发送消息后，A 的共享信箱中有对话信
- [ ] A 发送消息后，B 的共享信箱中有对话信
- [ ] 气泡 5 秒后自动消失
- [ ] 角色移动时气泡跟随移动
- [ ] 单人模式下不显示聊天输入框
