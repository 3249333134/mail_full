# 万物送信系统 - Product Requirement Document

## Overview
- **Summary**: 用户可选择"万物"作为信使送信——蚂蚁、候鸟、洄游鱼、风、漂流瓶，乃至时间胶囊、星际信使、梦境使者。信件出发后，在真实与科幻交织的世界观中经历一条随机事件链：被吃而传递、繁衍而更迭代际、遇风雨而改路、被路人捡起又放下。最终信必送达，并附一份"旅程志"记录所有经手者与事件。地图实时追踪信件此刻在哪儿、经历了什么。
- **Purpose**: 把"等一封信"从瞬时收件，变成一段可旁观、可回望的漫长旅程，让信件本身成为有传记的"信物"，强化情感重量与沉浸感。
- **Target Users**: 使用信笺应用、愿意为情感表达付出"等待"成本的用户；尤其适合写给远方的人、未来的自己、逝去之人的场景。

## Goals
- 用户寄信时可从"万物信使库"中选择信使（含真实类与科幻/奇幻类）
- 信件出发后，由旅程事件引擎生成一条随机的、符合该信使属性的事件链
- 信件可在不同载体间传递（食物链传递）与同物种内代际更迭
- 时间默认模糊（"春暖花开时""数载之后"），允许用户设定到达时间，但中途事件依然随机
- 信送达时附带"旅程志"：经手者传递链/族谱、事件年表、路径地图、信物状态、耗时
- 地图模式可实时追踪在途信件的当前位置、轨迹、事件标记、当前经手者
- 信物随旅程累积物理状态（磨损、水渍、烧焦、脚印等），复用现有信纸材质系统呈现

## Non-Goals (Out of Scope)
- 不实现真实网络送信（信件旅程为本地模拟，非真实物理投递）
- 不做信使的完全物理仿真（基于事件概率驱动，非连续物理引擎）
- 不支持用户自定义上传信使素材（仅使用预设信使库，后续可扩展）
- 不实现 PvP 式的"截胡他人信件"（旅程是单人叙事，不与他人竞争）
- 本期不做信使养成/升级/经验值（信使为一次性旅程载体，非养成对象）
- 本期不做跨用户实时送信的网络同步（仅本地模拟，多人共享信箱内可见）

## Background & Context
- 当前已有信件数据结构（`mailbox-letters.js` 的 letter 对象，含 id/mailboxId/title/sender/recipient/content/date/time 等）
- 当前已有像素地图渲染（`gameMapRenderer.js`），支持角色在地图上移动、动作精灵图
- 当前已有角色系统：MAIN_CHARACTERS（通用像素角色）、HANMEN_CHARACTERS（寒门角色）、JINGYUAN_CHARACTERS（境元角色）
- 当前已有信纸材质系统（`realistic-paper-system.css`、`realistic-letter-css-only`），可呈现纸张质感
- 当前已有共享信箱与多人同步（`multiplayerSync.js`、BroadcastChannel）
- 当前已有地图背景选择（寒门雪景、村庄、沙漠、森林、农场、矿洞等预设）
- 技术限制：纯前端应用，localStorage 存储，BroadcastChannel 本地多标签同步

## 核心概念与世界观

### 世界观基调
真实与科幻并行：一只蚂蚁的跋涉与一艘星际信使的跃迁同样"真实"。所有信使共享同一套旅程规则，但各自的"时间感"与"空间感"不同。蚂蚁的几日即其一生；星际信使的几光年是它的一瞬。世界观不解释"为何万物皆可送信"，而是默认它如此——这是一种童话/神话式的设定。

### 信物观
信件不是被动货物，而是有"命数"的信物。它会沾上旅途的痕迹：被雨水洇湿的字迹、被蚂蚁啃掉的边角、被火焰燎过的焦痕、被鱼腹胃液泡软的纸张。这些痕迹最终成为信的一部分，甚至比正文更动人。

---

## Functional Requirements

### FR-1: 信使库（Carrier Roster）

#### FR-1.1 信使属性模型
每个信使拥有以下属性，旅程引擎据此驱动事件：

| 属性 | 类型 | 说明 |
|---|---|---|
| `id` | string | 唯一标识，如 `ant`、`migratory-bird`、`wind`、`time-capsule` |
| `name` | string | 显示名，如"工蚁""南迁的候鸟""一阵风""时间胶囊" |
| `category` | enum | `real`（真实）/ `scifi`（科幻奇幻） |
| `baseSpeed` | number | 基础速度（地图格/单位时间），决定路程耗时基数 |
| `lifespan` | number | 寿命（单位时间），到期触发代际更迭或传递 |
| `reproductionRate` | number | 繁衍概率（0~1），命中则信件交给后代 |
| `predationRate` | number | 被捕食概率（0~1），命中则信件转移到捕食者 |
| `predators` | string[] | 天敌信使 id 列表，决定传递给谁 |
| `envPreference` | string[] | 环境偏好（`water`/`sky`/`land`/`underground`/`dream`/`space`），影响路径与可用地图 |
| `specialAbilities` | string[] | 特殊能力 id，如 `cross-ocean`、`phase-through`、`time-skip`、`dream-walk` |
| `timeSense` | enum | 时间感：`instant`（瞬时）/ `normal`（常人）/ `dilated`（漫长）/ `compressed`（压缩） |
| `lineageNaming` | object | 代际命名规则，如 `{base:"小黑", pattern:"{base}的{N}世曾孙"}` |
| `sprite` | string | 精灵图资源路径 |
| `lore` | string | 世界观简介（选择时展示） |

#### FR-1.2 真实类信使（首期）
| 信使 | 速度 | 寿命 | 繁衍 | 被捕食 | 特性 |
|---|---|---|---|---|---|
| 工蚁 ant | 极慢 | 极短 | 高 | 极高 | 群体代际传递、陆路 |
| 信鸽 homing-pigeon | 中 | 中 | 低 | 中 | 认路、空路 |
| 候鸟 migratory-bird | 中快 | 长 | 中 | 中 | 季节性南迁、空路 |
| 洄游鱼 migratory-fish | 中 | 中 | 中 | 中 | 水路、逆流而上 |
| 流浪猫 stray-cat | 中快 | 中 | 中 | 低 | 陆路、会搭便车 |
| 萤火虫 firefly | 慢 | 极短 | 高 | 高 | 夜行、发光标记路径 |
| 蜘蛛 spider | 慢 | 中 | 中 | 中 | 吐丝可跨隙、结网可暂存信件 |
| 河流 river | 中 | 永生 | 无 | 无 | 水路、不可控方向、可分岔 |
| 一阵风 wind | 快 | 短 | 无 | 无 | 可穿墙、可越海、方向随机 |
| 漂流瓶 drift-bottle | 极慢 | 永生 | 无 | 无 | 水路、被动随波、可被冲上岸被人捡到 |

#### FR-1.3 科幻/奇幻类信使（首期）
| 信使 | 速度 | 寿命 | 特性 |
|---|---|---|---|
| 时间胶囊 time-capsule | 0（定时开启） | 永生 | 埋藏至设定时间开启，无中途事件或仅"被发掘"事件 |
| 传送门精灵 portal-sprite | 极快 | 长 | 可瞬移，但会"迷路"到错误时代/地点 |
| 星际信使 stellar-courier | 极快 | 长 | 跃迁、可被黑洞捕获重定向、时间膨胀 |
| 梦境使者 dream-walker | 瞬时 | 一夜 | 走梦境路径、只在睡眠者梦中送达、醒后信在枕边 |
| 幽灵邮差 ghost-postman | 中 | 永生 | 穿墙、可跨越生死送达逝者、风雨夜现身 |
| 纸鹤 paper-crane | 慢 | 短 | 折纸术赋予短暂生命、飞向思念之人、遇雨即毁 |
| 时光回溯信使 rewind-courier | — | — | 信在"过去"送达，收信人先于寄信收到（因果倒置叙事） |

#### FR-1.4 信使选择交互
- 寄信界面新增"选择信使"步骤（信封/信纸/信使三步之一）
- 信使以卡片展示，含精灵图预览、名字、世界观简介、属性雷达图（速度/寿命/风险/奇遇度）
- 选择后显示"预期"提示（模糊语）："此信或将于春暖花开时抵达""此信将跨越数代蚂蚁的毕生"
- 支持随机信使（"听天由命"按钮，由系统随机指派）

### FR-2: 旅程事件引擎（Journey Engine）

#### FR-2.1 事件链模型
旅程由一条**事件链**构成，从出发到送达，按时间步推进：

```
journey = {
  carrierId: "ant",
  events: [event, event, ...],   // 按时序
  currentCarrierChain: ["小黑", "小黑二世", ...],  // 当前经手者链
  status: "in-transit" | "delivered",
  startTime, deliverTime,
  path: [{x, y, t, eventId}],    // 轨迹点
}
```

每个 event 结构：
```
event = {
  id, type, time, location:{x,y},
  actor: { name, species, generation? },  // 参与者
  description: "蚂蚁小黑三世在渡口被一只麻雀叼走",
  effects: { carrierChange?, stateChange?, pathChange? },
}
```

#### FR-2.2 事件类型库

**A. 传递事件（transfer）—— 食物链易主**
- 触发：信使 `predationRate` 命中
- 逻辑：从该信使 `predators` 中随机选一个作为新载体，信件转移到捕食者身上继续旅程
- 新载体继承旅程，但速度/路径按新载体属性改变
- 链式可多次发生：蚂蚁→麻雀→鲈鱼→渔夫→路人→收信人
- 当传递链中出现"人"且该人"恰好"在收信人附近时，触发送达

**B. 代际更迭事件（lineage）—— 同物种繁衍**
- 触发：信使 `reproductionRate` 命中，且 `lifespan` 到期
- 逻辑：当前信使死亡/老去，信件交给其后代
- 命名：按 `lineageNaming` 生成，如"小黑→小黑二世→……→小黑三十七世曾孙"
- 代际计数累加，最终旅程志显示"历经 N 代"
- 蚂蚁案例：可能跨越数十代，耗时数月乃至数年

**C. 环境事件（environment）—— 改路**
- 类型：暴雨（冲偏路径/洇湿信件）、风暴（吹散/吹偏）、地震（塌方绕路）、大雾（迷失停滞）、洪水（走水路捷径）、雪封（冬眠暂停）
- 影响：路径偏移、时间延误、信物状态变化
- 部分环境事件对特定信使是"加速"：风遇暴雨更强、鱼遇洪水更快

**D. 相遇事件（encounter）—— 途中邂逅**
- 遇旅人：可能搭便车（加速）、可能被好心收留暂存（暂停）、可能被误投（绕远）
- 遇其他信使：可能结伴、可能交换信件（极小概率串信）、可能被对方信使捕食
- 遇收信人的"影子"：提前感应，生成伏笔事件（不剧透是否即将送达）

**E. 奇遇事件（serendipity）—— 戏剧性转折**
- 被孩童捡去玩耍又放下
- 被收藏家收藏，多年后流入旧货市场被人买下转交
- 被风吹进收信人院子（戏剧性送达）
- 被鱼吞，鱼被晒成鱼干，鱼干被买走剖开发现信（送达）
- 被埋入土中多年，施工挖出（时间胶囊式送达）
- 信使临终前将信托付给路过的另一物种（跨物种交接）

**F. 送达事件（delivery）—— 终点**
- 触发条件（满足其一）：
  - 传递链中出现"人"且位于收信人附近
  - 信使本身到达收信人位置（信鸽/候鸟认路）
  - 漂流瓶被冲上收信人常去的岸
  - 梦境使者：收信人入睡
  - 时间胶囊：到达设定时间
- 送达后旅程冻结，生成旅程志

#### FR-2.3 概率与节奏控制
- 每个"时间步"按概率判定是否触发事件，避免事件过密或过疏
- 引入"叙事节奏权重"：长途旅程必含至少 1 次传递或代际事件 + 至少 1 次环境/奇遇事件
- 设定到达时间时，引擎反推事件链密度，保证在时限内完成（见 FR-3）
- 事件描述文本由模板 + 随机变量生成，避免重复感

#### FR-2.4 信物状态累积
- 每个事件可附带 `stateChange`，累加到信物的 `letterState`
- 状态维度：`wear`（磨损）、`wet`（洇湿）、`burn`（焦痕）、`bite`（啃痕）、`stain`（污渍）、`fold`（折痕）、`footprint`（脚印）
- 状态值 0~1，叠加影响信纸最终呈现（复用 realistic-paper-system 叠加材质层）

### FR-3: 时间系统（Time System）

#### FR-3.1 模糊时间描述（默认）
- 不设定到达时间时，引擎根据信使属性 + 旅程复杂度生成一个**模糊预期**，仅显示自然语言：
  - "春暖花开时"
  - "某个雨夜"
  - "数载之后"
  - "待候鸟南归"
  - "蚂蚁的一生，或许多生"
  - "风停之前"
  - "星辰对齐之夜"（科幻类）
- 模糊时间不显示具体日期，制造等待感

#### FR-3.2 时间感差异（timeSense）
- `instant`：旅程对收信人而言瞬时，但旅程志仍记录"内部时间"的漫长（如梦境使者）
- `normal`：旅程耗时与人类感知一致
- `dilated`：信使时间漫长，收信人觉得等了很久（蚂蚁、漂流瓶）
- `compressed`：信使跨越漫长时空，收信人却觉得很快（星际信使的时间膨胀）

#### FR-3.3 设定到达时间（定时到 + 随机过程）
- 用户可指定"希望何时收到"（具体日期或模糊节点如"明年生日"）
- 引擎保证在该时间送达，但**中途事件照常随机生成**
- 反推算法：
  1. 计算可用总时间预算 T
  2. 根据 T 与信使 baseSpeed 估算可走距离/可发生事件数
  3. 在预算内按节奏权重填充事件链
  4. 若信使无法在 T 内自然送达，插入"奇遇加速"事件（搭便车、传送门、风助）补足
- 即使定时，过程依然"随机"——只是终点确定，路径未知

#### FR-3.4 时间流速模拟
- 地图追踪模式下，时间可加速呈现（不实时等待数月）
- 用户可切换：实时（每秒=旅程一分钟）、加速（每秒=一天）、跳过（直接到下一事件）
- 信件真正送达仍按设定时间，加速仅影响"旁观"体验

### FR-4: 旅程志（Journey Report）

#### FR-4.1 旅程志结构
信送达时生成 `journeyReport`，作为信件的"传记"附在信件旁：

```
journeyReport = {
  carrierId: "ant",
  deliveryChain: [          // 经手者传递链/族谱
    { name:"小黑", species:"工蚁", generation:1, role:"启程" },
    { name:"小黑七世", species:"工蚁", generation:7, role:"代际传承" },
    { name:"麻雀", species:"鸟", role:"捕食传递" },
    { name:"鲈鱼", species:"鱼", role:"捕食传递" },
    { name:"渔夫老李", species:"人", role:"钓获" },
    { name:"你", species:"人", role:"收信" },
  ],
  eventTimeline: [event, ...],   // 完整事件年表
  pathMap: { ... },              // 路径数据（复用地图）
  letterState: { wear, wet, burn, ... },  // 信物最终状态
  stats: {
    duration: "3年7个月",        // 模糊+精确混合
    generations: 7,
    speciesCount: 4,
    distance: "约 230 公里",
    eventCount: 23,
  },
  epilogue: "这封信历经七代蚂蚁的毕生，被麻雀带上云端，又被鲈鱼吞入深渊，最终在渔夫的网中重见天日，递到你手上。",  // 引擎生成的结语
}
```

#### FR-4.2 旅程志呈现
- 收信瞬间：信件从地图飞入信箱，附带"拆开旅程志"按钮
- 旅程志以"信物传记"长卷形式呈现（竖向卷轴/手账风格，契合现有手账素材）
- 顶部：结语 epilogue + 关键统计
- 中部：传递链族谱图（树状/链状，显示代际与物种交接）
- 下部：事件年表（时间轴，每个事件可展开看详情）
- 底部：信物状态特写（磨损/水渍的纸张呈现）+ 路径小地图
- 风格复用现有手账/信纸设计系统（`figam/`、`realistic-paper-system.css`）

#### FR-4.3 旅程志可分享
- 旅程志可导出为图片/长图（便于分享到社交平台）
- 多人共享信箱中，所有成员可见旅程志

### FR-5: 实时地图追踪（Living Map）

#### FR-5.1 在途信件列表
- 地图模式侧栏显示"在途信件"列表
- 每条显示：信件标题、信使精灵图、当前经手者、模糊预计到达、当前状态
- 点击切换追踪某封信

#### FR-5.2 信件实时定位
- 复用 `gameMapRenderer.js`，在地图上渲染一个"信件信使"角色（当前经手者的精灵图）
- 角色按路径 path 自动移动
- 角色头顶标签："小黑七世正在赶路""麻雀叼着信向南飞"

#### FR-5.3 轨迹与事件标记
- 已走路径以虚线/脚印/水迹呈现（随信使类型变样式：蚂蚁=脚印点、鸟=羽迹线、鱼=水纹、风=流线）
- 事件发生点在地图上标记为图标（传递=爪印、代际=花、环境=云雨、奇遇=星）
- 点击事件标记可查看该事件详情
- 未走路径不显示（保留未知感）

#### FR-5.4 时间控制
- 加速/暂停/跳至下一事件按钮（见 FR-3.4）
- "静候佳音"模式：关闭主动追踪，仅送达时通知（适合长周期信件）

#### FR-5.5 多信使同屏
- 多封在途信件可同屏显示，各走各路
- 信件之间可能触发"相遇事件"（极小概率，叙事彩蛋）

### FR-6: 信件状态变化（信物状态）

#### FR-6.1 状态来源
- 由事件引擎的 `stateChange` 累积（见 FR-2.4）

#### FR-6.2 状态呈现
- 复用现有信纸材质系统，叠加多层效果：
  - `wear` → 边缘磨损纹理层
  - `wet` → 水渍/字迹洇开层
  - `burn` → 焦黑边角层
  - `bite` → 缺角/齿痕层
  - `stain` → 污渍层
  - `footprint` → 蚂蚁脚印小图叠在信面
- 状态在收信后呈现于信纸，旅程志中特写展示

#### FR-6.3 状态对阅读的影响（可选，默认轻微）
- 极重度 `wet` 可让个别字迹模糊（但仍可辨，不影响阅读）
- 极重度 `bite` 可让个别字缺失（用"□"占位，制造残缺美）
- 默认设为"轻微"，用户可在设置中关闭"残缺效果"

---

## 数据结构设计

### 信件对象扩展（在现有 letter 基础上新增）
```js
letter = {
  ...现有字段,
  journey: {
    carrierId: "ant",
    status: "in-transit" | "delivered",
    expectedDelivery: "模糊描述" | ISODateString,  // 用户设定或引擎生成
    startTime: timestamp,
    deliverTime: timestamp | null,
    events: [event],
    carrierChain: [ { name, species, generation, role } ],
    path: [ { x, y, t, eventId } ],
    letterState: { wear:0.2, wet:0.5, burn:0, bite:0.1, stain:0, fold:0, footprint:0.3 },
  },
  journeyReport: null | { ... },  // 送达后填充
}
```

### 信使库数据（新模块 `js/modules/carrier-roster.js`）
```js
CARRIERS = [
  { id:"ant", name:"工蚁", category:"real", baseSpeed:0.2, lifespan:5,
    reproductionRate:0.6, predationRate:0.7, predators:["sparrow","lizard","fish"],
    envPreference:["land"], specialAbilities:[],
    timeSense:"dilated",
    lineageNaming:{ base:"小黑", pattern:"{base}的{N}世曾孙" },
    sprite:"...", lore:"一只普通的工蚁，背着一封信，用一生去走一段路。" },
  ...
]
```

### 旅程引擎（新模块 `js/modules/journey-engine.js`）
- `startJourney(letter, carrierId, expectedDelivery?)` → 初始化 journey
- `tick(journey, steps)` → 推进 N 个时间步，按概率生成事件、更新路径与状态
- `generateEvent(journey, carrier)` → 依据当前经手者属性判定并生成单个事件
- `applyTransfer(journey, newCarrierId)` → 处理食物链传递，切换经手者
- `applyLineage(journey)` → 处理代际更迭，生成下一代命名
- `applyStateChange(letterState, stateChange)` → 累积信物状态
- `attemptDelivery(journey)` → 判定是否满足送达条件
- `buildReport(journey)` → 送达后生成旅程志
- `fuzzyTimeDescription(carrier, complexity)` → 生成模糊预期时间文案
- `reversePlan(carrier, deadline)` → 设定到达时间时的反推事件链规划

### 地图追踪模块（新模块 `js/modules/journey-tracker.js`）
- 渲染在途信件信使角色（复用 gameMapRenderer 的角色绘制）
- 渲染轨迹层（脚印/羽迹/水纹/流线，随信使类型）
- 渲染事件标记图层（可点击查看详情）
- 时间流速控制（实时/加速/跳过/静候）

### 信物状态呈现（扩展 `realistic-paper-system.css`）
- 新增状态叠加层 class：`.letter-wear`、`.letter-wet`、`.letter-burn`、`.letter-bite`、`.letter-stain`、`.letter-footprint`
- 每层按状态值 0~1 调整 opacity / 纹理强度

---

## 与现有架构结合

| 新功能 | 复用现有 | 改造/新增 |
|---|---|---|
| 信使库 | — | 新增 `carrier-roster.js` 数据 + 选择 UI |
| 旅程事件引擎 | — | 新增 `journey-engine.js` |
| 信件旅程数据 | `mailbox-letters.js` letter 对象 | 扩展 `journey` / `journeyReport` 字段 |
| 地图追踪 | `gameMapRenderer.js` 角色渲染、`map.js` | 新增 `journey-tracker.js` 轨迹/标记层 |
| 信物状态 | `realistic-paper-system.css` | 新增状态叠加层 |
| 寄信流程 | 现有信封/信纸选择步骤 | 插入"选择信使"步骤 |
| 多人可见 | `multiplayerSync.js`、共享信箱 | 在途信件与旅程志同步到共享信箱 |
| 地图背景 | 现有地图背景选择 | 信使 envPreference 与地图背景联动（水路信使需水域背景） |
| 时间字段 | letter 现有 date/time | 新增 expectedDelivery、startTime、deliverTime |
| 素材复用 | `figam/` 手账设计、`assets/letters/` | 旅程志长卷复用手账风格 |

---

## Non-Functional Requirements
- **NFR-1**: 旅程事件生成在本地完成，单次 tick < 50ms，不阻塞 UI
- **NFR-2**: 地图追踪模式下，信使角色移动流畅（≥30fps），轨迹与标记渲染不卡顿
- **NFR-3**: 信件旅程数据持久化到 localStorage，刷新页面后旅程状态不丢失
- **NFR-4**: 事件描述文本去重，同一旅程内事件描述尽量不重复
- **NFR-5**: 长周期信件（数月/数年）不实时占用资源，采用"惰性推进"——仅用户打开追踪时按需推进时间步
- **NFR-6**: 信物状态叠加层不影响信件正文可读性（残缺效果默认轻微且可关闭）
- **NFR-7**: 多人共享信箱中，在途信件状态通过 BroadcastChannel 同步，多端可见一致

## Constraints
- **技术**: 纯前端实现，localStorage 存储，BroadcastChannel 本地多标签同步
- **依赖**: 现有信件系统（`mailbox.js`、`mailbox-letters.js`）、地图渲染（`gameMapRenderer.js`、`map.js`）、信纸材质（`realistic-paper-system.css`）、多人同步（`multiplayerSync.js`）
- **资源**: 信使精灵图需新制作或复用现有像素角色素材；事件图标需设计
- **性能**: localStorage 单信箱数据量需控制，旅程事件链过长时需压缩存储（仅存关键事件 + 统计）

## Assumptions
- 用户愿意为情感表达接受"等待"，旅程周期可长达数月（由加速/静候模式缓解）
- 信使库首期预设 10 个真实类 + 7 个科幻奇幻类即可覆盖主要体验
- 事件模板库首期 30~50 条模板 + 随机变量即可生成足够多样的旅程
- 地图坐标系复用现有像素地图坐标系，无需另建
- 多人共享信箱内，在途信件由寄信人端模拟，其他成员端只读观看

## Acceptance Criteria

### AC-1: 寄信时可选择信使
- **Given**: 用户进入寄信流程，已选好信封与信纸
- **When**: 进入"选择信使"步骤
- **Then**: 展示信使卡片列表（真实类 + 科幻奇幻类），每张含精灵图、名字、属性雷达图、世界观简介
- **Verification**: `human-judgment`

### AC-2: 信件出发后生成模糊预期时间
- **Given**: 用户选了"工蚁"作为信使且未设定到达时间
- **When**: 信件寄出
- **Then**: 显示模糊预期如"蚂蚁的一生，或许多生"，不显示具体日期
- **Verification**: `human-judgment`

### AC-3: 旅程事件链随机生成且符合信使属性
- **Given**: 一封以"工蚁"为信使的信件在途
- **When**: 引擎推进若干时间步
- **Then**: 事件链中出现代际更迭（如"小黑→小黑N世"）与/或传递事件（被天敌捕食后易主），事件描述不重复
- **Verification**: `programmatic`

### AC-4: 食物链传递链可多次易主
- **Given**: 工蚁信件触发被捕食
- **When**: 传递事件链式发生
- **Then**: 经手者链呈现如"工蚁→麻雀→鲈鱼→渔夫"，每次易主后速度/路径按新载体改变
- **Verification**: `programmatic`

### AC-5: 设定到达时间仍保留随机过程
- **Given**: 用户设定信件于"明年生日"送达
- **When**: 引擎反推并执行旅程
- **Then**: 信件在设定时间送达，但中途事件链依然随机生成（路径与经手者不固定）
- **Verification**: `programmatic`

### AC-6: 信送达后生成旅程志
- **Given**: 信件触发送达事件
- **When**: 旅程冻结
- **Then**: 生成 journeyReport，含传递链/族谱、事件年表、路径、信物状态、统计、结语
- **Verification**: `programmatic`

### AC-7: 旅程志长卷呈现
- **Given**: 用户收到一封已送达的信件
- **When**: 点击"拆开旅程志"
- **Then**: 以手账风格长卷展示结语、族谱图、事件年表、信物状态特写、路径小地图
- **Verification**: `human-judgment`

### AC-8: 地图实时追踪在途信件
- **Given**: 存在在途信件且用户进入地图模式
- **When**: 用户选择追踪某封信
- **Then**: 地图上显示当前经手者信使角色按路径移动，头顶有状态标签，已走轨迹与事件标记可见
- **Verification**: `human-judgment`

### AC-9: 信物状态在信纸上呈现
- **Given**: 信件旅程中累积了 wet=0.6、bite=0.3 等状态
- **When**: 信送达后查看信纸
- **Then**: 信纸呈现水渍与缺角效果，且不影响正文阅读
- **Verification**: `human-judgment`

### AC-10: 旅程状态持久化
- **Given**: 一封信件在途
- **When**: 用户刷新页面
- **Then**: 在途信件及其旅程状态（事件链、经手者、路径、状态）完整保留
- **Verification**: `programmatic`

### AC-11: 多人共享信箱可见在途信件
- **Given**: 共享信箱中一成员寄出在途信件
- **When**: 另一成员打开同一信箱的地图模式
- **Then**: 可见该在途信件的追踪信息（只读），送达后双方均可见旅程志
- **Verification**: `programmatic`

---

## 未来扩展（Out of Scope，仅备忘）
- 信使养成：信使可积累"送达经验"，解锁特殊能力
- 跨用户真实送信：通过服务器实现 A 用户寄给 B 用户的真实在途旅程
- 信使市场：用户解锁/收集更多稀有信使
- 旅程志社交：旅程志可公开分享，他人可"见证"这段旅程
- 信物修复：收信后可选择"修复"或"保留残缺"
- 季节联动：旅程事件与现实季节联动（冬日雪封、春日融通）
- 声音旅程：旅程志附带环境音/BGM（复用现有 `app-bgm.js`）

## 实施里程碑建议
1. **M1 - 信使库 + 寄信流程**：信使数据、选择 UI、letter 扩展字段
2. **M2 - 旅程事件引擎**：事件链生成、传递/代际/环境/奇遇/送达逻辑、模糊时间
3. **M3 - 地图追踪**：在途信件列表、信使角色移动、轨迹与事件标记
4. **M4 - 旅程志**：送达后报告生成、长卷呈现、信物状态特写
5. **M5 - 信物状态呈现**：信纸叠加层、残缺效果
6. **M6 - 设定到达时间**：反推算法、时间流速控制
7. **M7 - 多人同步**：在途信件与旅程志的共享信箱同步