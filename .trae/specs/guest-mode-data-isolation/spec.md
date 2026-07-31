# 信笺应用访客模式与数据隔离完善 - Product Requirement Document

## Overview
- **Summary**: 完善信笺应用的访客模式功能，确保访客数据与登录用户共享信箱数据完全隔离，添加访客模式到登录模式的切换入口，并修复模式切换时的数据刷新问题。
- **Purpose**: 解决当前应用中存在的数据隔离不彻底、访客模式功能不完善等问题，确保用户数据安全和功能完整性。
- **Target Users**: 访客用户、登录用户（修璟、萱宣等预设账号）

## Goals
- 访客模式功能完整可用，用户可以通过"访客模式·随便看看"按钮正常进入应用
- 访客数据与登录用户共享信箱数据完全隔离，互不影响
- 访客模式下提供切换到登录模式的入口
- 模式切换时界面数据正确刷新
- 不破坏现有功能，保持代码风格一致

## Non-Goals (Out of Scope)
- 不新增用户注册/登录的业务逻辑
- 不修改数据库结构（IndexedDB + localStorage 保持不变）
- 不涉及手账（日记）系统的数据隔离改造
- 不修改地图视图和游戏地图的核心逻辑

## Background & Context
当前应用已实现基础的访客模式和共享信箱功能，但存在以下问题：
1. mailbox.js 中多个渲染函数（renderSidebarNav、renderGalleryTrack、renderLetterList、renderMailboxList）直接使用 STORAGE.loadLetters() 获取所有信件，未通过 MailboxManager.loadMailboxLetters() 正确区分共享信箱和普通信箱
2. editor.js 中部分保存逻辑（如元数据编辑、文字元素编辑后保存）直接使用 STORAGE.saveLetters()，未判断是否为共享信箱
3. 访客模式下侧边栏缺少切换到登录模式的入口
4. 模式切换时的数据刷新逻辑可能不完整

## Functional Requirements
- **FR-1**: 修复 mailbox.js 中的数据加载，所有渲染函数统一使用 MailboxManager.loadMailboxLetters() 获取信箱信件
- **FR-2**: 修复 editor.js 中的保存逻辑，所有保存操作统一判断是否为共享信箱并使用对应存储方法
- **FR-3**: 在访客模式的侧边栏用户信息区域添加"切换到登录"入口
- **FR-4**: 完善登录/切换账号后的数据刷新逻辑，确保界面正确更新
- **FR-5**: 确保访客模式下 MailboxManager.initSampleData() 正常工作，示例数据正确加载
- **FR-6**: 确保访客模式下新建信件保存到正确的位置（普通信件存储）
- **FR-7**: 确保访客模式下地图模式正常工作

## Non-Functional Requirements
- **NFR-1**: 代码风格与现有代码保持一致
- **NFR-2**: 不影响现有功能的正常使用
- **NFR-3**: 修改完成后同步到 dist 目录

## Constraints
- **Technical**: Vue2 风格的原生 JS 实现，使用 localStorage + IndexedDB 存储
- **Business**: 访客使用原有的单用户数据（原有的信箱和信件），登录用户的共享信箱使用独立存储
- **Dependencies**: 依赖现有 auth.js、storage.js、mailbox.js、editor.js、app.js 模块

## Assumptions
- 访客模式等同于未登录状态，使用 STORAGE.loadLetters/saveLetters 存储数据
- 登录用户（修璟、萱宣）使用共享信箱（mailbox-hanmen-duet），数据存储在 STORAGE.loadSharedLetters/saveSharedLetters
- 现有 MailboxManager.loadMailboxLetters() 和 saveMailboxLetters() 方法的实现是正确的
- 侧边栏用户信息区域有足够空间添加切换登录的入口

## Acceptance Criteria

### AC-1: 访客模式入口功能正常
- **Given**: 用户在登录页面
- **When**: 用户点击"访客模式·随便看看"按钮
- **Then**: 应用进入首页，显示所有默认信箱和信件，侧边栏显示"访客"和"访客模式"，不显示切换账号按钮
- **Verification**: `human-judgment`

### AC-2: 数据隔离 - 访客数据独立
- **Given**: 用户处于访客模式
- **When**: 用户在任意信箱中新建、编辑或删除信件
- **Then**: 这些操作只影响 STORAGE.loadLetters/saveLetters 中的数据，不影响共享信箱数据
- **Verification**: `programmatic`

### AC-3: 数据隔离 - 共享信箱数据独立
- **Given**: 用户已登录（修璟或萱宣账号）
- **When**: 用户在共享信箱中新建、编辑或删除信件
- **Then**: 这些操作只影响 STORAGE.loadSharedLetters/saveSharedLetters 中的数据，不影响普通信件数据
- **Verification**: `programmatic`

### AC-4: 访客模式切换到登录入口
- **Given**: 用户处于访客模式
- **When**: 用户查看侧边栏用户信息区域
- **Then**: 可以看到"切换到登录"的入口按钮
- **Verification**: `human-judgment`

### AC-5: 访客切换到登录后数据正确切换
- **Given**: 用户处于访客模式
- **When**: 用户点击切换到登录入口并成功登录
- **Then**: 界面数据切换为登录用户的数据（共享信箱），侧边栏用户信息更新为登录用户信息
- **Verification**: `human-judgment`

### AC-6: 访客模式下地图模式正常
- **Given**: 用户处于访客模式
- **When**: 用户进入地图视图
- **Then**: 地图正常显示所有信箱标记，功能正常可用
- **Verification**: `human-judgment`

### AC-7: 示例数据正常初始化
- **Given**: 首次访问应用或清除数据后
- **When**: 进入访客模式
- **Then**: MailboxManager.initSampleData() 正常执行，所有默认信箱的示例信件正确加载
- **Verification**: `programmatic`

## Open Questions
- 访客模式下是否需要显示"退出"按钮？还是只显示"切换到登录"？
  - 决策：显示"切换到登录"按钮，点击后跳转到登录页
