# 真实信纸质感升级说明

Figma 文件：<https://www.figma.com/design/5O05AZHQOEO8jr1YqNg3zm>

新增画板：`09 / Realistic Letter Paper Texture Upgrade`

## 本次优化重点

这次只强化「信纸本体」，不是信封或外包装。参考真实书信图片后，信纸需要从一张平面背景变成可触摸的纸张实物：

- 纸面要有纤维、黄斑、水渍、折痕和压痕。
- 边缘不能太整齐，需要轻微撕裂、破洞、卷边或阴影。
- 横线、红色竖栏不能太新，要有褪色、错位和纸张透色。
- 手写内容不能太少，真实书信往往有较高文字密度、签名和日期。
- 可以加入生活道具，例如信封、钢尺、手指、旧照片、邮戳或修订红圈。

## 新增 8 种信纸方向

1. 80 年代横线家书：白纸横线、普通信封、钢尺压住、黑墨手写。
2. 红色竖栏信纸：红色竖线、页号、轻微褶皱、空白可书写。
3. 破损竖排情书：泛黄、破洞、撕边、密集竖排毛笔字。
4. 撕边横线短笺：手持感、撕裂上边、蓝色横线、日期签名。
5. 修改痕迹稿纸：草稿、圈改、划线、社章、正文密度极高。
6. 钢笔蓝墨横线纸：蓝黑钢笔、压痕、墨水扩散、信纸页眉。
7. 航空薄信纸：半透明薄纸、红蓝边、折叠痕、跨页地址线。
8. 生成器真实信纸母版：纤维、折痕、破边、红线/横线/空白三模式。

## 建议的数据结构

后续在编辑器或生成器里，不建议把信纸只存成单张背景图。建议拆成以下图层：

```js
{
  paperBase: {
    color: "#ead7b8",
    fiberDensity: 0.62,
    stainDensity: 0.48
  },
  ruleLayer: {
    type: "vertical-red", // vertical-red | horizontal-blue | blank | grid
    opacity: 0.42,
    jitter: 0.16
  },
  agingLayer: {
    folds: true,
    tornEdges: true,
    holes: true,
    yellowing: 0.7
  },
  handwritingLayer: {
    direction: "vertical-rl",
    ink: "black-brush",
    density: 0.85,
    bleed: 0.18
  },
  propsLayer: {
    envelope: true,
    ruler: true,
    postmark: true,
    photo: false
  }
}
```

这样可以让同一封信在不同模板中复用文字内容，同时生成完全不同的真实纸张效果。

