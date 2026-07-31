# 信笺 - 多人同屏角色控制实现计划

## [ ] Task 1: 修改 checkAndInitGameMap，登录用户不自动开启双人模式
- **Priority**: high
- **Depends On**: None
- **Description**: 
  - 修改第2316-2324行的自动开启双人模式逻辑
  - 登录用户进入共享信箱时不开启双人模式
  - 访客模式保持原有双人模式功能
- **Acceptance Criteria Addressed**: AC-1, AC-2, AC-3
- **Test Requirements**:
  - `human-judgment` TR-1.1: 修璟登录后地图不显示双人模式UI
  - `human-judgment` TR-1.2: 访客模式仍可使用双人模式

## [ ] Task 2: 登录用户只加载自己的角色
- **Priority**: high
- **Depends On**: Task 1
- **Description**: 
  - 确保登录用户进入共享信箱时只加载与用户角色匹配的角色
  - 修璟用户加载修璟角色，萱宣用户加载萱宣角色
  - 不调用 setPartner 设置搭档
- **Acceptance Criteria Addressed**: AC-1, AC-2
- **Test Requirements**:
  - `human-judgment` TR-2.1: 修璟登录后控制修璟角色
  - `human-judgment` TR-2.2: 萱宣登录后控制萱宣角色

## [ ] Task 3: 隐藏双人模式相关UI
- **Priority**: high
- **Depends On**: Task 1
- **Description**: 
  - 登录用户进入共享信箱时隐藏双人动作按钮
  - 隐藏搭档选择区域
  - 隐藏双人模式开关
- **Acceptance Criteria Addressed**: AC-3
- **Test Requirements**:
  - `human-judgment` TR-3.1: 登录用户界面不显示双人模式相关UI

## [ ] Task 4: 确保多人同步正常工作
- **Priority**: high
- **Depends On**: Task 2
- **Description**: 
  - 验证多人同步系统正确初始化
  - 验证远程角色正确显示
  - 验证位置和动作实时同步
- **Acceptance Criteria Addressed**: AC-4
- **Test Requirements**:
  - `human-judgment` TR-4.1: 两个窗口打开时能看到对方角色
  - `human-judgment` TR-4.2: 移动角色时对方窗口实时更新
