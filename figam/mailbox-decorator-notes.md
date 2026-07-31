# 信箱装饰设置 UI 说明

## 核心概念

新增 `Mailbox Unit`：一个信箱不是散落的图标、主题色和背景，而是一个完整可保存的装饰单元。

这个单元包含：

- 信箱主体：邮箱、信封、木盒、邮袋、卷轴盒等外形。
- 标题牌：纸签、铜牌、胶带、标签贴、手写签。
- 角标计数：未读数、待寄数、双人视角、日记入口。
- 装饰插槽：邮戳、蜡封、贴纸、照片角、挂件、胶带。
- 整体材质：旧纸、木纹、布纹、磨砂玻璃、夜色、像素光栅。

## 页面结构

- 一级入口：我的信箱首页。
- 二级对象：选中某个信箱。
- 三级编辑：信箱设置与装饰工作台。
- 四级属性：基础、外观、装饰、行为四个设置 Tab。

## 操作逻辑

1. 用户在信箱卡片或信箱详情页点击“设置/装饰”。
2. 打开信箱装饰工作台，默认选中整个信箱单元。
3. 用户可切换到装饰插槽，分别调整信箱主体、标题牌、角标、贴纸挂件。
4. 右侧属性面板修改名称、描述、材质、主题色、装饰元素和同步行为。
5. 保存后写入 `mailbox.theme`，并同步刷新侧栏、首页网格、信箱详情页和新建信件默认样式。

## 建议数据结构

```js
{
  id: "mailbox-brenuo",
  name: "布雷诺来信",
  desc: "以撒致缪宏谟的二十五封信",
  theme: {
    unitStyle: "old-paper",
    shell: "mailbox-object",
    accent: "#c95f7a",
    texture: "paper-fiber",
    decorations: [
      { slot: "seal", type: "wax", x: 78, y: 22, visible: true },
      { slot: "stamp", type: "postal", x: 12, y: 18, visible: true },
      { slot: "charm", type: "star", x: 92, y: -8, visible: true }
    ],
    sync: {
      sidebar: true,
      homeCard: true,
      mailboxHeader: true,
      newLetterDefault: true
    }
  }
}
```

## 落地建议

- 现有新增/编辑信箱弹窗保留基础表单，但增加“进入装饰工作台”按钮。
- `MailboxManager._getMailboxIconSVG` 后续可拆为 `renderMailboxUnit(mailbox, variant)`，支持 `sidebar`、`grid`、`hero` 三种尺寸。
- 初期不需要自由画布级复杂度，先采用插槽系统，避免装饰元素失控。
- 自动保存草稿到 `localStorage`，保存后再写入正式信箱数据。
