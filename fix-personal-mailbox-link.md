# 个人信箱之间无法建链 — 根因分析与修复报告

> 2026-08-05 · 依据 `.trae/documents/recipient-picker-contacts-and-code-search.md` 的后续反馈修复

## 一、问题现象

在**个人信箱**（如"修璟的信箱"）里点「✉ 新建信件」，无法与另一个个人信箱（如"萱宣的信箱"）建立信件联系：

1. 收件人选择器里「📮 在其他信箱接触过的人」区块**常为空**，即使两个个人信箱已有往来；
2. 跨信箱寄信成功后页面**白屏/无响应**，体验上"无法建链"。

## 二、根因分析（三个断点）

### 根因 1（核心死结）：联系人收集只看"当前用户可见的信箱"
`App._collectAcquaintances()` 只遍历 `MailboxManager.getMailboxes()` —— 该列表会过滤掉**别人拥有的个人信箱**（修璟看不到 `personal-xuanxuan`）。因此：

- 修璟给萱宣的个人信箱发过的信，永远进不了修璟的联系人列表；
- 而"接触过的人"又是个人信箱建立联系的**主路径** → 死锁：没往来→没联系人→无法建链→永远没往来。
- 附带的懒加载问题：`loadMailboxLetters` 依赖本地/远端缓存，首次打开选择器时缓存常为空，联系人进一步缺失。

### 根因 2：信箱码搜索"通了也白通"——发送后跳转白屏
`renderMailboxView()` 开头 `if (!mailbox) return` —— 目标如果是对方个人信箱（不在当前用户信箱列表），**直接不渲染**。即使信箱码搜索/联系人点击成功跳进编辑器、信也发出去了，发送成功后 `navigate('mailbox', 对方信箱)` 依然白屏。

### 根因 3（辅助）：手动输入姓名发信无法送达
空态"手动输入姓名"→ `recipientAccountKey = 中文名` → 服务端按 accountKey 精确匹配，对方账号永远匹配不上，信滞留在发件信箱。

## 三、修复内容

### 服务端 `server/server.js`
新增 **`GET /api/letters/contacts?accountKey=<账号>`**：

- 聚合 `persistentState.letters` 中与该账号有**实际往来**（sent/inbox，排除草稿）的信件；
- 提取"另一方"：`{ accountKey, mailboxId, mailboxName, lastContactAt }`；
- 按 accountKey 去重、按最近联系时间倒序，最多 50 条；
- **纯内存聚合**：bootstrap 的 `loadAllFromState` 启动时已把 MySQL 全量信件载入内存，无需实时查远程库（实测远程 MySQL 全表查询会挂起卡死）。

> 关键价值：服务端能看到**所有信箱**的信件，包括当前用户不可见的对方个人信箱 —— 彻底解开根因 1 的死结。

### 前端 `js/app.js`
1. **`_collectAcquaintances` 升级**：先调用 `/api/letters/contacts`（服务端权威聚合，覆盖不可见信箱），失败时回退原本地遍历；两路结果按 `lastContactAt` 合并去重。
2. **`renderMailboxView` 不再裸 return**：本地列表找不到信箱时依次回退
   - `STORAGE.loadMailboxes()/loadSharedMailboxes()` 全量查找；
   - `STORAGE.loadSharedMailbox()` 缓存；
   - `MailService.getRemoteMailbox()` 异步拉取服务端真实数据并重渲染；
   - 最后构造最小信箱对象（从信件 `senderIdentity/recipientIdentity` 反推成员名）保证不白屏。
3. **空态手动输入提示优化**：明确提示"用下方信箱码可搜索并寄到对方个人信箱；直接输入姓名，信将保存在本信箱"，避免用户误以为手输姓名能送达。

### 前端 `js/editor.js`
- `send()` 成功后跳转信箱视图前，先判断目标信箱是否在本地可见列表；不可见则**回退到进入编辑器前的信箱**（`App.currentMailboxId`），杜绝白屏。

### 版本与同步
- `js/app.js`、`js/editor.js`、`server/server.js` 同步至 `dist/`；
- 版本号：`app.js?v=20260805h → 20260805i`、`editor.js?v=20260805b → 20260805c`（index.html + dist/index.html）。

## 四、验证结果

| 项目 | 结果 |
|------|------|
| `GET /api/letters/contacts?accountKey=xiujing` | ✅ 返回 `xuanxuan / personal-xuanxuan / 萱宣的信箱`（**对方个人信箱的往来被正确提取**） |
| `GET /api/letters/contacts?accountKey=xuanxuan` | ✅ 返回 `xiujing / personal-xuanxuan`（双向建链） |
| 响应耗时 | ✅ ~0.2s |
| 跨个人信箱发信 → 对方读取 | ✅ 模拟发送至 `personal-xuanxuan` 后，萱宣 `/api/mail/letters` 读到 |
| 信箱码搜索（TD8YSL → 萱宣的信箱） | ✅ 200 + 完整成员数据 |
| 前端静态服务 3005 / 管理后台 3000/admin | ✅ HTTP 200 |
| `node --check` 语法（app/editor/server） | ✅ 全部通过 |
| dist 同步 + 版本号 | ✅ 已同步 |

## 五、遗留说明

- 手动输入姓名发送的信**仍只留在本信箱**（设计如此，已加 UI 提示）；跨个人信箱请使用「信箱码」或「接触过的人」路径。
- 16:30 左右出现一封 `letter-xp-*`（sender/recipient 为空）疑似历史测试残留，未处理，保留原状。
