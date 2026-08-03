---
name: 信笺
description: 连接数字书信与多人江湖世界的会馆式社区界面
colors:
  ink: "#132429"
  ink-raised: "#20383d"
  jade: "#2f6f68"
  jade-soft: "#dce8e3"
  seal: "#b7473e"
  brass: "#c7a66a"
  stone: "#edf1ef"
  paper: "#f8faf8"
  muted: "#607174"
  map-night: "#081519"
  pure-white: "#ffffff"
typography:
  title:
    fontFamily: "Noto Serif SC, Songti SC, Georgia, serif"
    fontSize: "18px"
    fontWeight: 600
    lineHeight: 1.35
  body:
    fontFamily: "Noto Sans SC, Microsoft YaHei, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Noto Sans SC, Microsoft YaHei, sans-serif"
    fontSize: "13px"
    fontWeight: 600
    lineHeight: 1.4
  handwriting:
    fontFamily: "Ma Shan Zheng, ZCOOL XiaoWei, STKaiti, cursive"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.6
  mono:
    fontFamily: "Courier New, Consolas, Menlo, monospace"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  sm: "8px"
  control: "9px"
  button: "10px"
  md: "12px"
  panel: "14px"
  lg: "16px"
  sheet: "18px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
components:
  button-primary:
    backgroundColor: "{colors.seal}"
    textColor: "{colors.paper}"
    rounded: "{rounded.sm}"
    height: "44px"
    padding: "8px 16px"
  button-map:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.sm}"
    height: "44px"
    width: "44px"
  surface-card:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "16px"
---

# Design System: 信笺

## Overview

**Creative North Star: “江湖会馆名帖”**

界面像一座兼具信局与江湖会馆功能的公共空间：浅石与纸张承载阅读，深墨与矿物玉色承载地图操作，朱砂只用于真正需要行动或警示的地方。地图、人物和信件始终是内容主角，界面外壳应主动退后。

系统保持克制、清楚和可操作，不复刻古籍装饰，也不使用廉价的木纹、卷轴和满屏书法制造“古风”。传统气质来自宋体标题、名牌结构、玉石与朱砂配色，以及内容本身。

**Key Characteristics:**

- 浅色阅读空间与深色世界操作层形成明确分区。
- 地图占满可用画布，控制组以紧凑悬浮坞呈现。
- 人物身份用名牌表达，角色选择只属于首次入场流程。
- 关键触控目标不小于 44px，并提供可见键盘焦点。

## Colors

色彩取自墨、玉、朱砂与旧黄铜，以低饱和中性色保证长时间阅读和地图辨识。

### Primary

- **深墨青**：承担导航选中态、地图控制坞和高对比文字。
- **矿物玉**：承担世界类操作的激活态、悬停态与信息确认。

### Secondary

- **朱砂印**：只用于主操作、危险操作和需立即注意的状态。
- **旧黄铜**：用于地图名牌、身份边缘和少量等级提示。

### Neutral

- **青灰石面**：页面底色，降低纯白造成的刺眼感。
- **暖白信纸**：卡片、编辑器与阅读区域的内容表面。
- **雾灰文字**：次级说明，不用于关键操作。

**The One Seal Rule.** 同一局部区域只保留一个朱砂主操作；其余操作使用墨色、玉色或中性按钮。

## Typography

**Display Font:** Noto Serif SC（回退 Songti SC、Georgia）  
**Body Font:** Noto Sans SC（回退 Microsoft YaHei、sans-serif）  
**Letter Styles:** Ma Shan Zheng、ZCOOL XiaoWei 等只供用户选择的信纸字迹  
**Mono Font:** Courier New（回退 Consolas、Menlo）仅用于代码式或机器信息

**Character:** 宋体负责世界名、人物名和信件标题的叙事感；黑体负责高密度操作、状态和正文可读性。

### Hierarchy

- **Title**（600，18px，1.35）：人物名、面板标题和信件标题。
- **Body**（400，16px，1.6）：正文、说明与表单内容。
- **Label**（600，13px，1.4）：动作按钮、状态和紧凑控制。
- **Handwriting**（400，16px，1.6）：仅用于用户主动选择的信件字迹，不用于应用导航。
- **Mono**（400，12px，1.5）：编号或机器信息，不承担正文。

**The Two Voices Rule.** 宋体只负责身份与叙事层级；所有持续交互和长文本使用黑体。

## Layout

桌面端保留 264px 左侧信箱导航，主内容占据其余空间。世界模式让地图覆盖整个主内容区，人物名牌位于左上，地图切换位于右上，动作与视图控制位于下缘。阅读和首页使用最大 1320px 的内容容器及 16px 卡片间距。

在 1000px 以下地图取消左侧偏移；在 768px 以下，侧栏改为抽屉，人物名牌下移避开菜单，动作栏横向滚动，背包改为全宽底部面板。禁止通过缩小按钮解决空间问题，优先重排与渐进展示。

## Elevation & Depth

阅读界面以边框和色块分层，地图界面使用半透明深墨悬浮面板。高阴影只用于地图控制坞、抽屉和当前上下文，不用于普通列表卡片。

### Shadow Vocabulary

- **会馆浮层**（`0 16px 42px rgba(10, 24, 27, .16), 0 3px 10px rgba(10, 24, 27, .1)`）：人物名牌与地图控制。
- **深层抽屉**（`0 24px 68px rgba(3, 16, 19, .38)`）：背包等阻断式侧面板。

**The Content First Rule.** 静态内容卡片保持平坦；阴影只表达浮动层级或当前交互上下文。

## Shapes

小控件使用 8px 圆角，常规卡片和控制坞使用 12px，抽屉与大面板使用 16px。人物头像采用轻微方形名牌轮廓，不使用大量圆形胶囊。边框保持细而低对比，黄铜描边只用于世界身份和地图语境。

## Components

### Buttons

- **Shape:** 紧凑圆角（8–10px），关键目标至少 44px 高。
- **Primary:** 朱砂底、暖白字，仅用于页面唯一主操作。
- **Hover / Focus:** 悬停加深；键盘焦点使用 3px 半透明玉色外圈。
- **Map:** 透明深墨坞内的方形图标按钮，激活时使用矿物玉底色。

### Cards / Containers

- **Corner Style:** 常规 12–14px，大抽屉 16px。
- **Background:** 阅读区使用暖白，地图控制使用近不透明深墨。
- **Shadow Strategy:** 普通卡片无阴影；只给浮层使用会馆阴影。
- **Border:** 1px 半透明深墨线或半透明白线。

### Inputs / Fields

- **Style:** 暖白或透明纸面、细边框、8–10px 圆角。
- **Focus:** 玉色焦点环必须在深色与浅色背景上都清晰。
- **Error / Disabled:** 错误使用朱砂文字加明确文案；禁用态降低对比并说明原因。

### Navigation

侧栏选中项使用深墨底和白字。移动端侧栏为明确可关闭的抽屉。地图内导航与站点导航分离，避免在世界画面上堆叠第二套侧栏。

### Character Plaque

绑定后只显示头像字、人物名和门派三项；完整角色卡只出现在首次选择流程。名牌使用深墨表面与黄铜边缘，在地图上保持紧凑稳定。

## Do's and Don'ts

### Do:

- **Do** 让地图、信纸和人物资源占据第一视觉层级。
- **Do** 在移动端重排控制组，并保持 44px 触控目标。
- **Do** 用文字、图标和颜色共同表达状态。
- **Do** 为加载、空状态、失败和已接管会话提供明确反馈。

### Don't:

- **Don't** 把角色选择列表长期固定在地图上。
- **Don't** 用多个朱砂按钮争夺同一屏的注意力。
- **Don't** 使用满屏卷轴、木纹、装饰边框或书法字模拟古风。
- **Don't** 让控制层遮挡人物、地图目标或信件正文。
