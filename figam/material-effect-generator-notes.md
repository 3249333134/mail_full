# 真实书信材质效果生成说明

本地样板页：`figam/material-effect-generator.html`

当前 Figma 文件：<https://www.figma.com/design/5O05AZHQOEO8jr1YqNg3zm>

> 说明：本次尝试写入 Figma 时触发了 Figma Starter 计划的 MCP 调用次数上限，因此先把完整材质效果生成到本地 `figam` 页面。等 Figma 调用额度恢复后，可把该页面同步为新的 Figma 画板。

## 对应参考图

1. 暖光桌面钢笔墨水瓶：模拟台灯暖光、墨水瓶玻璃高光、钢笔投影、叠放信纸。
2. 横线扫描稿纸：模拟装订线、浅灰横线、密集手写、折痕、水渍和扫描颗粒。
3. 博物馆旧式竖排信纸：模拟粗布展陈背景、牛皮信封、红框竖排信纸、大折痕和展签。
4. 红栏毛笔信纸近景：模拟泛黄纸面、红色竖栏、毛笔飞白、墨迹颗粒和局部反光。

## 建议拆分图层

后续落地到真实信件生成器时，不建议只使用一张背景图。推荐把材质拆为六层：

```js
{
  lightLayer: {
    type: "warm-desk",
    glow: 0.45,
    vignette: 0.2
  },
  paperBase: {
    color: "#f1dfbd",
    fiber: 0.68,
    stain: 0.42
  },
  agingLayer: {
    folds: 0.55,
    tornEdges: 0.25,
    scanNoise: 0.35
  },
  ruleLayer: {
    type: "horizontal-gray", // horizontal-gray | vertical-red | blank
    opacity: 0.32,
    jitter: 0.08
  },
  handwritingLayer: {
    font: "brush",
    ink: "#231b16",
    density: 0.85,
    bleed: 0.18,
    direction: "horizontal" // horizontal | vertical-rl
  },
  propsLayer: {
    inkBottle: true,
    fountainPen: true,
    envelope: true,
    museumLabel: true
  }
}
```

## UI 参数建议

- 旧化强度：控制黄斑、污渍、破边和纸纤维数量。
- 折痕强度：控制中线、横折、随机压痕的透明度。
- 墨迹浓度：控制手写颜色、晕染、飞白和颗粒。
- 灯光角度：控制暖光、暗角和投影方向。
- 道具开关：控制墨水瓶、钢笔、信封、展签、旧照片等实物元素。

