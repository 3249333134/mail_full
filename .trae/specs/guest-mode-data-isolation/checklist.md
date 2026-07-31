# 信笺应用访客模式与数据隔离完善 - Verification Checklist

## 数据隔离验证
- [ ] 检查 mailbox.js 的 renderSidebarNav 函数是否使用 MailboxManager.loadMailboxLetters() 获取信件
- [ ] 检查 mailbox.js 的 renderGalleryTrack 函数是否使用 MailboxManager.loadMailboxLetters() 获取信件
- [ ] 检查 mailbox.js 的 renderLetterList 函数是否使用 MailboxManager.loadMailboxLetters() 获取信件
- [ ] 检查 mailbox.js 的 renderMailboxList 函数是否使用 MailboxManager.loadMailboxLetters() 获取信件
- [ ] 检查 editor.js 中元数据编辑后保存是否判断共享信箱
- [ ] 检查 editor.js 中文字元素编辑后保存是否判断共享信箱
- [ ] 验证访客模式下新建的信件保存在普通信件存储（STORAGE.loadLetters）
- [ ] 验证登录用户共享信箱的信件保存在共享信箱存储（STORAGE.loadSharedLetters）

## 访客模式功能验证
- [ ] 登录页面"访客模式·随便看看"按钮可以正常点击
- [ ] 点击访客模式按钮后正确进入首页
- [ ] 访客模式下侧边栏显示"访客"和"访客模式"
- [ ] 访客模式下不显示切换账号按钮
- [ ] 访客模式下显示"切换到登录"入口按钮
- [ ] 点击"切换到登录"按钮后跳转到登录页面
- [ ] 访客模式下所有默认信箱正确显示
- [ ] 访客模式下所有示例信件正确加载
- [ ] 访客模式下可以正常阅读信件
- [ ] 访客模式下可以正常新建信件
- [ ] 访客模式下地图模式正常工作

## 模式切换验证
- [ ] 从访客模式登录后，数据正确切换为登录用户数据
- [ ] 登录后侧边栏用户信息正确更新
- [ ] 登录后信箱列表正确更新
- [ ] 切换账号（修璟↔萱宣）后数据正确刷新
- [ ] 退出登录后正确回到登录页面

## 代码质量验证
- [ ] 修改的代码风格与现有代码一致
- [ ] 没有引入新的全局变量或副作用
- [ ] 没有破坏现有功能
- [ ] 所有修改都有明确的逻辑依据

## 同步验证
- [ ] dist/js/app.js 已同步更新
- [ ] dist/js/mailbox.js 已同步更新
- [ ] dist/js/editor.js 已同步更新
- [ ] dist/js/storage.js 已同步更新（如有修改）
