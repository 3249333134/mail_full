# 信箱地图背景与邀请成员 - The Implementation Plan (Decomposed and Prioritized Task List)

## [ ] Task 1: 准备地图背景图片资源
- **Priority**: high
- **Depends On**: None
- **Description**: 
  - 准备6种地图背景图：寒门雪景、村庄、沙漠、森林、农场、矿洞
  - 将背景图放到 sendbox/src/assets/maps/ 目录下
  - 命名规范：bg-hanmen.png, bg-village.png, bg-desert.png, bg-forest.png, bg-farm.png, bg-mine.png
  - 如果没有图片资源，使用 Canvas 生成风格化背景
- **Acceptance Criteria Addressed**: AC-1, AC-2
- **Test Requirements**:
  - `programmatic` TR-1.1: 背景图片文件存在于正确路径
  - `programmatic` TR-1.2: AssetManager 能正确加载所有背景图片
  - `human-judgement` TR-1.3: 背景图片风格与对应地图主题匹配
- **Notes**: 如果缺少素材，优先使用 Canvas 生成渐变+装饰元素的风格化背景

## [ ] Task 2: 信箱模态框增加地图背景选择UI
- **Priority**: high
- **Depends On**: Task 1
- **Description**: 
  - 在 index.html 的信箱模态框中增加"地图背景"设置区域
  - 提供6种预设背景选项，带预览缩略图
  - 增加"无背景（像素地图）"选项
  - 添加对应 CSS 样式
- **Acceptance Criteria Addressed**: AC-1
- **Test Requirements**:
  - `human-judgement` TR-2.1: 模态框中显示地图背景选择区域
  - `human-judgement` TR-2.2: 每个背景选项有预览图和名称
  - `programmatic` TR-2.3: 点击背景选项能正确选中/取消选中

## [ ] Task 3: 信箱数据结构增加 mapBackground 字段
- **Priority**: high
- **Depends On**: Task 2
- **Description**: 
  - 修改 app-mailbox-modal.js，将地图背景选择保存到 _mailboxFormData
  - 保存信箱时将 mapBackground 字段写入信箱数据
  - 编辑信箱时正确回显已选的地图背景
  - 共享信箱也支持 mapBackground 字段
- **Acceptance Criteria Addressed**: AC-2, AC-3
- **Test Requirements**:
  - `programmatic` TR-3.1: 新建信箱时 mapBackground 字段被正确保存
  - `programmatic` TR-3.2: 编辑信箱时 mapBackground 字段被正确回显
  - `programmatic` TR-3.3: localStorage 中存储的信箱数据包含 mapBackground 字段

## [ ] Task 4: 地图渲染器支持自定义背景
- **Priority**: high
- **Depends On**: Task 3
- **Description**: 
  - 修改 gameMapRenderer.js，增加 setMapBackground 方法
  - 支持通过信箱配置设置背景图
  - 背景图加载失败时降级为像素地图
  - 移除原有的硬编码寒门背景逻辑
- **Acceptance Criteria Addressed**: AC-2, AC-7, AC-8
- **Test Requirements**:
  - `programmatic` TR-4.1: 调用 setMapBackground 后 render 使用背景图
  - `programmatic` TR-4.2: 背景图为 null 时使用像素地图
  - `programmatic` TR-4.3: 背景图加载失败时降级为像素地图

## [ ] Task 5: 进入地图模式时同步信箱背景
- **Priority**: high
- **Depends On**: Task 4
- **Description**: 
  - 修改 app.js 中进入地图模式的逻辑
  - 读取当前信箱的 mapBackground 设置
  - 调用 gameMapRenderer 设置背景
  - 切换信箱后重新进入地图时背景同步更新
- **Acceptance Criteria Addressed**: AC-2, AC-3, AC-7
- **Test Requirements**:
  - `programmatic` TR-5.1: 进入地图模式时背景与信箱设置一致
  - `programmatic` TR-5.2: 切换信箱后背景正确切换
  - `programmatic` TR-5.3: 刷新页面后背景设置依然有效

## [ ] Task 6: 信箱模态框增加成员管理UI
- **Priority**: high
- **Depends On**: None
- **Description**: 
  - 在 index.html 的信箱模态框中增加"成员管理"区域
  - 显示已加入成员列表（头像+用户名）
  - 提供输入框和邀请按钮
  - 每个成员项有删除按钮
  - 添加对应 CSS 样式
- **Acceptance Criteria Addressed**: AC-4
- **Test Requirements**:
  - `human-judgement` TR-6.1: 模态框中显示成员管理区域
  - `human-judgement` TR-6.2: 成员列表显示正确
  - `programmatic` TR-6.3: 输入框和邀请按钮存在且可交互

## [ ] Task 7: 实现成员邀请逻辑
- **Priority**: high
- **Depends On**: Task 6
- **Description**: 
  - 修改 app-mailbox-modal.js，实现成员邀请功能
  - 输入用户名后验证用户是否存在
  - 将用户添加到成员列表
  - 支持删除成员（创建者不能删除自己）
  - 保存信箱时同步保存成员列表
  - 编辑信箱时正确回显成员列表
- **Acceptance Criteria Addressed**: AC-5
- **Test Requirements**:
  - `programmatic` TR-7.1: 邀请存在的用户成功添加到成员列表
  - `programmatic` TR-7.2: 邀请不存在的用户提示错误
  - `programmatic` TR-7.3: 创建者无法被删除
  - `programmatic` TR-7.4: 保存后成员数据持久化

## [ ] Task 8: 共享信箱列表整合
- **Priority**: high
- **Depends On**: Task 7
- **Description**: 
  - 修改信箱列表加载逻辑，登录用户显示所有自己是成员的共享信箱
  - 共享信箱与个人信箱合并显示
  - 共享信箱有特殊标识（如"共享"标签）
  - 切换到共享信箱时使用共享信件数据
- **Acceptance Criteria Addressed**: AC-6
- **Test Requirements**:
  - `programmatic` TR-8.1: 登录用户能看到自己被邀请的共享信箱
  - `programmatic` TR-8.2: 共享信箱显示共享标识
  - `programmatic` TR-8.3: 共享信箱的信件数据正确加载

## [ ] Task 9: 整体联调与样式优化
- **Priority**: medium
- **Depends On**: Task 5, Task 8
- **Description**: 
  - 整体测试两个功能的联动
  - 优化 UI 样式，确保与现有风格一致
  - 修复边缘 case（空成员、空背景等）
  - 同步更新 dist 目录
- **Acceptance Criteria Addressed**: AC-1 ~ AC-8
- **Test Requirements**:
  - `human-judgement` TR-9.1: 整体UI风格统一，交互流畅
  - `programmatic` TR-9.2: 所有功能正常无报错
  - `programmatic` TR-9.3: dist 目录文件同步更新
