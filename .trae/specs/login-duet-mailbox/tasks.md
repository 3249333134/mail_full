# 登录系统与双人信箱 - The Implementation Plan (Decomposed and Prioritized Task List)

## [x] Task 1: 用户认证模块（AuthManager）
- **Priority**: high
- **Depends On**: None
- **Description**: 
  - 创建 `js/auth.js` 模块，实现用户注册、登录、登出功能
  - 使用 localStorage 存储用户数据
  - 密码使用简单哈希存储（SHA-256 或自定义哈希）
  - 支持登录状态持久化
  - 预置两个账号：修璟（xiu-jing）和萱宣（xuan-xuan），密码 123456
- **Acceptance Criteria Addressed**: AC-2, AC-3, AC-4, AC-5, AC-6, AC-9
- **Test Requirements**:
  - `programmatic` TR-1.1: 注册新账号后，用户数据保存在 localStorage ✓
  - `programmatic` TR-1.2: 使用正确账号密码登录返回成功 ✓
  - `programmatic` TR-1.3: 使用错误账号密码登录返回失败 ✓
  - `programmatic` TR-1.4: 刷新页面后登录状态保持 ✓
  - `programmatic` TR-1.5: 预设账号（修璟、萱宣）可以正常登录 ✓
  - `programmatic` TR-1.6: 登出后登录状态清除 ✓
  - `human-judgement` TR-1.7: 代码结构清晰，易于扩展 ✓
- **Notes**: 纯前端实现，不依赖后端；密码哈希使用 Web Crypto API 或简单自定义哈希

## [x] Task 2: 登录页面 UI
- **Priority**: high
- **Depends On**: Task 1
- **Description**: 
  - 在 `index.html` 中添加登录页面视图
  - 创建登录页面样式（古风/书信主题，与现有应用风格一致）
  - 登录表单：用户名、密码、登录按钮
  - 注册入口和表单切换
  - 预设账号快速登录按钮
  - 访客模式入口
  - 错误提示展示
- **Acceptance Criteria Addressed**: AC-1, AC-2, AC-4, AC-10
- **Test Requirements**:
  - `human-judgement` TR-2.1: 登录页面 UI 风格与信笺应用整体一致 ✓
  - `human-judgement` TR-2.2: 移动端适配良好 ✓
  - `programmatic` TR-2.3: 点击登录按钮触发登录逻辑 ✓
  - `programmatic` TR-2.4: 点击注册切换到注册表单 ✓
  - `programmatic` TR-2.5: 登录错误时显示提示信息 ✓
  - `programmatic` TR-2.6: 点击访客模式直接进入应用 ✓

## [x] Task 3: 双人共享信箱数据结构
- **Priority**: high
- **Depends On**: Task 1
- **Description**: 
  - 扩展 storage.js，支持共享信箱数据存储
  - 信件增加 author 字段（发送者用户ID）
  - 共享信箱数据与用户数据关联
  - 初始化时为预设账号创建共享信箱
  - 共享信箱 ID: `mailbox-hanmen-duet`（寒门双人信箱）
- **Acceptance Criteria Addressed**: AC-7, AC-8
- **Test Requirements**:
  - `programmatic` TR-3.1: 信件数据包含 author 字段 ✓
  - `programmatic` TR-3.2: 两个预设账号关联到同一个共享信箱 ✓
  - `programmatic` TR-3.3: 共享信箱数据独立于单用户数据 ✓
  - `programmatic` TR-3.4: A 账号写入的信件，B 账号可以读取 ✓

## [x] Task 4: 应用初始化与登录状态整合
- **Priority**: high
- **Depends On**: Task 1, Task 2, Task 3
- **Description**: 
  - 修改 app.js 初始化逻辑，检查登录状态
  - 未登录时显示登录页面，已登录时直接进入应用
  - 登录成功后跳转到应用主页
  - 登录用户进入共享信箱模式
  - 侧边栏显示当前登录用户信息
  - 添加退出登录按钮
- **Acceptance Criteria Addressed**: AC-1, AC-3, AC-5, AC-6, AC-9
- **Test Requirements**:
  - `programmatic` TR-4.1: 未登录时显示登录页面 ✓
  - `programmatic` TR-4.2: 已登录时直接进入应用 ✓
  - `programmatic` TR-4.3: 登录成功后显示用户信息 ✓
  - `programmatic` TR-4.4: 点击退出登录返回登录页 ✓

## [x] Task 5: 共享信件展示与写信人标识
- **Priority**: medium
- **Depends On**: Task 3, Task 4
- **Description**: 
  - 信件列表中显示写信人标识（头像/名字）
  - 阅读信件时显示发件人信息
  - 新建信件时自动设置当前用户为作者
  - 区分"我写的"和"对方写的"信件
- **Acceptance Criteria Addressed**: AC-7, AC-8
- **Test Requirements**:
  - `human-judgement` TR-5.1: 信件列表中可以区分是谁写的 ✓
  - `human-judgement` TR-5.2: 阅读信件时显示发件人信息 ✓
  - `programmatic` TR-5.3: 新建信件的 author 字段自动设为当前用户 ✓
  - `human-judgement` TR-5.4: 视觉风格与整体一致 ✓

## [x] Task 6: 账号切换功能
- **Priority**: medium
- **Depends On**: Task 4
- **Description**: 
  - 在侧边栏或设置中添加账号切换功能
  - 支持快速切换到另一个预设账号
  - 切换后刷新信箱数据
  - 地图模式角色同步切换
- **Acceptance Criteria Addressed**: AC-7
- **Test Requirements**:
  - `programmatic` TR-6.1: 点击切换账号可以切换到另一个用户 ✓
  - `programmatic` TR-6.2: 切换后信件数据正确更新 ✓
  - `human-judgement` TR-6.3: 切换操作流畅，无明显卡顿 ✓

## [x] Task 7: 地图模式与用户角色同步
- **Priority**: medium
- **Depends On**: Task 4, Task 6
- **Description**: 
  - 登录修璟时，地图默认角色为修璟
  - 登录萱宣时，地图默认角色为萱宣
  - 双人模式下搭档自动切换为另一个角色
  - 保持地图模式的双人动作功能
- **Acceptance Criteria Addressed**: AC-7
- **Test Requirements**:
  - `programmatic` TR-7.1: 登录修璟时地图主角为修璟 ✓
  - `programmatic` TR-7.2: 登录萱宣时地图主角为萱宣 ✓
  - `programmatic` TR-7.3: 双人模式搭档为另一个角色 ✓

## [x] Task 8: 访客模式与数据隔离
- **Priority**: low
- **Depends On**: Task 4
- **Description**: 
  - 访客模式使用原有单用户数据
  - 登录用户使用共享信箱数据
  - 两套数据完全隔离，互不影响
  - 支持从访客模式切换到登录模式
- **Acceptance Criteria Addressed**: AC-10
- **Test Requirements**:
  - `programmatic` TR-8.1: 访客模式数据与登录用户数据隔离 ✓
  - `programmatic` TR-8.2: 访客可以正常使用所有原有功能 ✓
  - `human-judgement` TR-8.3: 数据切换流畅自然 ✓
