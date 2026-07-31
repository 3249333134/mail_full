# 信笺应用访客模式与数据隔离完善 - The Implementation Plan (Decomposed and Prioritized Task List)

## [ ] Task 1: 修复 mailbox.js 渲染函数的数据加载问题
- **Priority**: high
- **Depends On**: None
- **Description**: 
  - 修复 renderSidebarNav() 函数：将 STORAGE.loadLetters() 替换为 MailboxManager.loadMailboxLetters(mb.id)
  - 修复 renderGalleryTrack() 函数：将 STORAGE.loadLetters() 替换为 MailboxManager.loadMailboxLetters(mb.id)
  - 修复 renderLetterList() 函数：将 STORAGE.loadLetters().filter(...) 替换为 MailboxManager.loadMailboxLetters(mailboxId)
  - 修复 renderMailboxList() 函数：将 STORAGE.loadLetters() 替换为 MailboxManager.loadMailboxLetters(mb.id)
  - 确保所有获取信箱信件数量的地方都使用统一的方法
- **Acceptance Criteria Addressed**: AC-2, AC-3, AC-7
- **Test Requirements**:
  - `programmatic` TR-1.1: 验证 renderSidebarNav 中每个信箱的信件数量通过 loadMailboxLetters 获取
  - `programmatic` TR-1.2: 验证 renderGalleryTrack 中每个信箱的信件数量通过 loadMailboxLetters 获取
  - `programmatic` TR-1.3: 验证 renderLetterList 通过 loadMailboxLetters 获取信件列表
  - `programmatic` TR-1.4: 验证 renderMailboxList 中每个信箱的信件数量通过 loadMailboxLetters 获取
  - `human-judgement` TR-1.5: 访客模式下信箱列表和信件列表显示正常
  - `human-judgement` TR-1.6: 登录模式下共享信箱的信件列表显示正常

## [ ] Task 2: 修复 editor.js 中直接使用 STORAGE.saveLetters() 的问题
- **Priority**: high
- **Depends On**: None
- **Description**: 
  - 修复元数据编辑后保存的逻辑（约 L2867）：判断是否为共享信箱，使用对应保存方法
  - 修复文字元素编辑后保存的逻辑（约 L3291）：判断是否为共享信箱，使用对应保存方法
  - 检查 editor.js 中其他直接使用 STORAGE.saveLetters() 的地方，确保都正确判断了共享信箱
- **Acceptance Criteria Addressed**: AC-2, AC-3
- **Test Requirements**:
  - `programmatic` TR-2.1: 验证元数据编辑后，共享信箱的信件保存到 STORAGE.saveSharedLetters
  - `programmatic` TR-2.2: 验证元数据编辑后，普通信箱的信件保存到 STORAGE.saveLetters
  - `programmatic` TR-2.3: 验证文字元素编辑后，共享信箱的信件保存到 STORAGE.saveSharedLetters
  - `programmatic` TR-2.4: 验证文字元素编辑后，普通信箱的信件保存到 STORAGE.saveLetters
  - `human-judgement` TR-2.5: 编辑器中编辑信件元数据和文字内容后保存正常

## [ ] Task 3: 添加访客模式下切换到登录模式的入口
- **Priority**: high
- **Depends On**: None
- **Description**: 
  - 在侧边栏用户信息区域（首页和信箱详情页），当用户处于访客模式时，添加"切换到登录"按钮
  - 点击该按钮后跳转到登录页面
  - 保持与现有 UI 风格一致
  - 修改 _updateSidebarUserInfo() 函数，添加对访客模式下登录入口按钮的显示控制
- **Acceptance Criteria Addressed**: AC-1, AC-4
- **Test Requirements**:
  - `human-judgement` TR-3.1: 访客模式下侧边栏显示"切换到登录"按钮
  - `human-judgement` TR-3.2: 登录模式下不显示"切换到登录"按钮
  - `human-judgement` TR-3.3: 点击"切换到登录"按钮后跳转到登录页面
  - `human-judgement` TR-3.4: 首页和信箱详情页的侧边栏都正确显示该按钮

## [ ] Task 4: 完善登录/切换账号后的数据刷新逻辑
- **Priority**: high
- **Depends On**: Task 1
- **Description**: 
  - 检查 _onLoginSuccess() 函数，确保登录成功后正确刷新首页数据
  - 检查 _onAccountSwitched() 函数，确保切换账号后正确刷新当前视图数据
  - 确保从访客模式切换到登录模式后，信箱列表、信件列表等都正确更新
  - 验证 renderHome()、renderMailboxView() 等渲染函数在模式切换后能正确加载对应数据
- **Acceptance Criteria Addressed**: AC-5
- **Test Requirements**:
  - `human-judgement` TR-4.1: 从访客模式登录后，首页显示正确的信箱列表
  - `human-judgement` TR-4.2: 从访客模式登录后，进入共享信箱显示正确的信件列表
  - `human-judgement` TR-4.3: 切换账号（修璟→萱宣）后，共享信箱数据保持一致
  - `human-judgement` TR-4.4: 退出登录后回到登录页面，数据状态正确

## [ ] Task 5: 验证访客模式下各项功能正常
- **Priority**: medium
- **Depends On**: Task 1, Task 2, Task 3, Task 4
- **Description**: 
  - 验证访客模式下 MailboxManager.initSampleData() 正常工作
  - 验证访客模式下新建信件保存到正确位置
  - 验证访客模式下地图模式正常
  - 验证访客模式下写信、读信等核心功能正常
- **Acceptance Criteria Addressed**: AC-1, AC-6, AC-7
- **Test Requirements**:
  - `human-judgement` TR-5.1: 访客模式下所有默认信箱的示例信件数量正确
  - `human-judgement` TR-5.2: 访客模式下新建信件后，在对应信箱中可以看到
  - `human-judgement` TR-5.3: 访客模式下地图视图正常显示所有信箱标记
  - `human-judgement` TR-5.4: 访客模式下可以正常阅读信件、编辑信件

## [ ] Task 6: 同步修改到 dist 目录
- **Priority**: high
- **Depends On**: Task 1, Task 2, Task 3, Task 4
- **Description**: 
  - 将修改后的 app.js、mailbox.js、editor.js、storage.js 同步到 dist 目录
  - 确保 dist 目录下的文件与源文件保持一致
- **Acceptance Criteria Addressed**: NFR-3
- **Test Requirements**:
  - `programmatic` TR-6.1: dist/js/app.js 与 js/app.js 内容一致
  - `programmatic` TR-6.2: dist/js/mailbox.js 与 js/mailbox.js 内容一致
  - `programmatic` TR-6.3: dist/js/editor.js 与 js/editor.js 内容一致
  - `programmatic` TR-6.4: dist/js/storage.js 与 js/storage.js 内容一致
