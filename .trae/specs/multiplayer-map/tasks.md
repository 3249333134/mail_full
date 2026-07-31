# 多人同屏互动 - The Implementation Plan (Decomposed and Prioritized Task List)

## [ ] Task 1: 创建多人同步管理器 (MultiplayerSync)
- **Priority**: high
- **Depends On**: None
- **Description**: 
  - 创建 js/multiplayerSync.js 模块
  - 实现基于 BroadcastChannel + localStorage 的同步机制
  - 管理玩家状态：位置、动作、在线状态、角色ID
  - 心跳机制：定期发送状态更新，检测离线玩家
  - 事件回调：玩家加入、玩家离开、玩家移动、玩家动作
- **Acceptance Criteria Addressed**: AC-1, AC-2, AC-3, AC-4
- **Test Requirements**:
  - `programmatic` TR-1.1: BroadcastChannel 能正常发送和接收消息
  - `programmatic` TR-1.2: 玩家状态正确存储到 localStorage
  - `programmatic` TR-1.3: 心跳检测能正确识别离线玩家
  - `programmatic` TR-1.4: 玩家加入/离开事件正确触发
- **Notes**: 频道名基于共享信箱ID，不同信箱不同频道

## [ ] Task 2: 改造地图渲染器支持多人
- **Priority**: high
- **Depends On**: Task 1
- **Description**: 
  - 修改 gameMapRenderer.js，将单一 partner 改为 players 数组（多个远程玩家）
  - 每个远程玩家对象：{ userId, characterId, x, y, direction, action, frame, visible, lastUpdate, isOnline }
  - 实现 addPlayer/removePlayer/updatePlayer 方法
  - render 方法中渲染所有在线玩家
  - 玩家名字标签渲染
  - 本地玩家（自己）有特殊标识（光环或高亮）
  - 移除旧的 duetMode 和双人动作相关逻辑（或保留但不显示UI）
- **Acceptance Criteria Addressed**: AC-1, AC-6
- **Test Requirements**:
  - `programmatic` TR-2.1: 多个玩家角色能同时渲染在地图上
  - `programmatic` TR-2.2: 每个玩家都有名字标签
  - `programmatic` TR-2.3: 本地玩家有特殊标识
  - `human-judgement` TR-2.4: 角色渲染效果正常，无闪烁或错位

## [ ] Task 3: 位置与动作实时同步
- **Priority**: high
- **Depends On**: Task 2
- **Description**: 
  - 本地玩家移动/动作变化时，通过 MultiplayerSync 广播状态
  - 收到远程玩家状态更新时，平滑过渡到新位置/动作
  - 位置插值：远程玩家位置不是直接设置，而是逐帧插值移动
  - 动作同步：远程玩家动作状态与本地同步
  - 同步频率控制：移动状态约10次/秒，动作状态即时同步
- **Acceptance Criteria Addressed**: AC-2, AC-3
- **Test Requirements**:
  - `programmatic` TR-3.1: 本地移动正确广播状态
  - `programmatic` TR-3.2: 远程玩家位置平滑移动（无跳变）
  - `programmatic` TR-3.3: 动作同步正确播放
  - `human-judgement` TR-3.4: 整体同步流畅，延迟可接受

## [ ] Task 4: 在线状态与离线处理
- **Priority**: high
- **Depends On**: Task 3
- **Description**: 
  - 进入地图时发送"加入"消息
  - 离开地图/关闭页面时发送"离开"消息（beforeunload）
  - 心跳检测：超过5秒未更新的玩家标记为离线
  - 离线玩家逐渐淡出然后移除
  - 页面可见性变化时处理（隐藏时暂停同步，显示时恢复）
- **Acceptance Criteria Addressed**: AC-4
- **Test Requirements**:
  - `programmatic` TR-4.1: 进入地图正确广播加入事件
  - `programmatic` TR-4.2: 关闭页面正确触发离开事件
  - `programmatic` TR-4.3: 超时玩家被标记为离线并淡出
  - `programmatic` TR-4.4: 页面可见性切换正常处理

## [ ] Task 5: 角色互动系统
- **Priority**: medium
- **Depends On**: Task 4
- **Description**: 
  - 靠近其他玩家时显示互动提示（如"按 E 互动"）
  - 互动检测：两个角色距离小于阈值时可互动
  - 互动类型：
    1. 打招呼：双方播放礼仪动作
    2. 双人动作：选择一个双人动作共同播放（使用现有双人动作精灵图）
  - 互动请求：一方发起，另一方自动接受（简化版）
  - 互动时两个角色定位到合适位置和朝向
- **Acceptance Criteria Addressed**: AC-5
- **Test Requirements**:
  - `programmatic` TR-5.1: 靠近时显示互动提示
  - `programmatic` TR-5.2: 按互动键触发互动动作
  - `human-judgement` TR-5.3: 互动动作播放正常
  - `human-judgement` TR-5.4: 两个角色位置和朝向正确

## [ ] Task 6: UI改造与简化
- **Priority**: high
- **Depends On**: Task 2
- **Description**: 
  - 登录用户：移除"搭档角色"和"双人模式"区域
  - 登录用户：角色选择器显示当前角色信息，不可切换
  - 登录用户：保留单人动作按钮（礼仪/武艺/招牌）
  - 访客模式：保持原有完整功能（可切换角色、可选择搭档）
  - 添加在线玩家列表显示（小浮窗，显示当前在线的成员）
  - 添加互动按钮（移动端）
  - 调整 CSS 样式
- **Acceptance Criteria Addressed**: AC-6, AC-7
- **Test Requirements**:
  - `human-judgement` TR-6.1: 登录用户UI正确简化
  - `human-judgement` TR-6.2: 访客模式UI保持不变
  - `human-judgement` TR-6.3: 在线玩家列表显示正确
  - `programmatic` TR-6.4: 角色信息与当前登录用户一致

## [ ] Task 7: 整体联调与优化
- **Priority**: medium
- **Depends On**: Task 5, Task 6
- **Description**: 
  - 整体测试多人同屏功能
  - 优化性能（减少不必要的同步、优化渲染）
  - 修复边缘 case
  - 同步所有文件到 dist 目录
- **Acceptance Criteria Addressed**: AC-1 ~ AC-7
- **Test Requirements**:
  - `programmatic` TR-7.1: 所有功能正常无报错
  - `human-judgement` TR-7.2: 整体体验流畅
  - `programmatic` TR-7.3: dist 目录文件同步更新
  - `programmatic` TR-7.4: 访客模式兼容正常

## [ ] Task 8: 共享信箱与多人模式绑定
- **Priority**: high
- **Depends On**: Task 1
- **Description**: 
  - 只有共享信箱（成员>1）才启用多人模式
  - 单人信箱保持原有单人模式
  - 多人同步频道基于信箱ID
  - 进入地图时根据当前信箱类型决定是否启用多人同步
  - 切换信箱时重新初始化多人同步
- **Acceptance Criteria Addressed**: AC-1, AC-7
- **Test Requirements**:
  - `programmatic` TR-8.1: 共享信箱启用多人模式
  - `programmatic` TR-8.2: 单人信箱保持单人模式
  - `programmatic` TR-8.3: 切换信箱时多人模式正确切换
  - `programmatic` TR-8.4: 不同信箱的多人频道隔离
