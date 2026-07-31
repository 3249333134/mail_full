# 信笺 - 多人同屏角色控制规格文档

## Overview
- **Summary**: 修复多人同屏模式下的角色控制逻辑，确保每个用户只能控制自己的角色，对方角色通过多人同步系统实时显示
- **Purpose**: 解决当前登录用户进入共享信箱后仍然开启双人模式的问题，实现真正的多人同屏互动
- **Target Users**: 修璟（xiujing）和萱宣（xuanxuan）两个账号用户

## Goals
- [ ] 登录用户进入共享信箱时，只加载并控制自己的角色（修璟→修璟，萱宣→萱宣）
- [ ] 对方角色通过多人同步系统自动实时显示在地图上
- [ ] 移除登录用户的双人模式相关UI（双人动作、搭档选择等）
- [ ] 访客模式保持原有双人模式功能

## Non-Goals (Out of Scope)
- [ ] 不修改角色动作系统
- [ ] 不修改地图渲染系统

## Background & Context
- 当前代码在 `checkAndInitGameMap()` 中，无论是否是共享信箱，都会在第2316-2324行自动开启双人模式
- 多人同步系统（`multiplayerSync.js`）已经实现，但没有正确集成到角色控制逻辑中
- 登录用户应该使用 `multiplayerMode` 而非 `duetMode`

## Functional Requirements
- **FR-1**: 登录用户进入共享信箱时，自动加载与用户角色匹配的角色（修璟用户→修璟角色，萱宣用户→萱宣角色）
- **FR-2**: 登录用户进入共享信箱时，启用多人模式（`multiplayerMode`），禁用双人模式（`duetMode`）
- **FR-3**: 登录用户的角色选择器只显示当前用户角色，隐藏搭档选择和双人动作
- **FR-4**: 对方角色通过多人同步系统实时显示位置和动作

## Non-Functional Requirements
- **NFR-1**: 角色位置同步延迟 < 200ms
- **NFR-2**: 远程角色移动平滑（使用插值）

## Constraints
- **Technical**: 基于 BroadcastChannel + localStorage 的多人同步机制
- **Dependencies**: AuthManager、MultiplayerSync、GameMapRenderer

## Assumptions
- [ ] 修璟用户的 role 为 'xiu-jing'，萱宣用户的 role 为 'xuan-xuan'
- [ ] 共享信箱已正确配置成员信息

## Acceptance Criteria

### AC-1: 修璟登录后只控制修璟角色
- **Given**: 用户以修璟账号登录进入共享信箱
- **When**: 进入地图界面
- **Then**: 地图上只显示修璟角色（由当前用户控制），萱宣角色通过多人同步显示（如果萱宣在线）
- **Verification**: `human-judgment`

### AC-2: 萱宣登录后只控制萱宣角色
- **Given**: 用户以萱宣账号登录进入共享信箱
- **When**: 进入地图界面
- **Then**: 地图上只显示萱宣角色（由当前用户控制），修璟角色通过多人同步显示（如果修璟在线）
- **Verification**: `human-judgment`

### AC-3: 双人模式UI隐藏
- **Given**: 登录用户进入共享信箱
- **When**: 查看角色选择器
- **Then**: 双人动作按钮、搭档选择、双人模式开关不显示
- **Verification**: `human-judgment`

### AC-4: 实时同步生效
- **Given**: 两个账号分别在不同浏览器窗口登录
- **When**: 一个用户移动角色
- **Then**: 另一个窗口中对方角色实时移动
- **Verification**: `human-judgment`

## Open Questions
- [ ] 无

## Implementation Plan

### 关键修改点
1. **app.js**: 修改 `checkAndInitGameMap()`，登录用户不自动开启双人模式
2. **app.js**: 登录用户只加载自己的角色
3. **app.js**: 隐藏双人模式相关UI
4. **gameMapRenderer.js**: 确保多人模式正确工作
