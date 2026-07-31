import { TILE } from './gameConfig.js';

// 静远七人动作配置：speed 为 ms/帧（与 player.js 保持一致，复制以避免循环依赖）
const JINGYUAN_ACTION_CONFIG = {
  personality: { speed: 240, once: false },
  run: { speed: 105, once: false },
  etiquette: { speed: 220, once: true },
  martial: { speed: 110, once: true },
  signature: { speed: 180, once: true },
};

export const NPC_DATA = [
  {
    id: 'elder',
    name: '村长爷爷',
    color: { shirt: '#8b4513', skin: '#f5c89a', hair: '#c8c8c8', hairStyle: 2 },
    map: '村庄',
    x: 35, y: 14,
    dialogs: [
      '欢迎来到像素村，年轻的旅人！',
      '我是这个村子的村长，已经在这里生活了七十年了。',
      '村子东边有一片茂密的森林，西边是潺潺的小溪。',
      '听说沙漠那边有神秘的遗迹，不过我这把老骨头是去不了喽。',
      '你可以按 M 键打开地图编辑器，亲手改造这个世界！',
    ],
  },
  {
    id: 'girl',
    name: '小花',
    color: { shirt: '#ff6b9d', skin: '#f5c89a', hair: '#8b4513', hairStyle: 1 },
    map: '村庄',
    x: 28, y: 20,
    dialogs: [
      '嗨！你是新来的吗？我叫小花！',
      '我最喜欢在路边采花了，红色和蓝色的花都好漂亮！',
      '你知道吗？森林里有一只会说话的兔子，不过只有善良的人才能见到它。',
      '对了，按 C 键可以换衣服哦！我也好想有好多漂亮衣服…',
    ],
  },
  {
    id: 'merchant',
    name: '旅行商人',
    color: { shirt: '#9b59b6', skin: '#e8b896', hair: '#2c2c2c', hairStyle: 0 },
    map: '沙漠',
    x: 12, y: 11,
    dialogs: [
      '哦？沙漠里居然能遇到人，真是难得。',
      '我是一个旅行商人，走遍了这片大陆的每个角落。',
      '这片沙漠下面据说埋着古老文明的遗迹…可惜沙子太多，挖不动。',
      '绿洲的水很甜，你可以去那边休息一下。',
      '做生意嘛，讲究的就是诚信。下次见面我给你打折！',
    ],
  },
  {
    id: 'hermit',
    name: '森林隐士',
    color: { shirt: '#27ae60', skin: '#d4a574', hair: '#6b6b6b', hairStyle: 2 },
    map: '森林',
    x: 31, y: 19,
    dialogs: [
      '…有人来了？真是稀客。',
      '我住在这片森林里已经很多年了，远离尘世的喧嚣。',
      '树木有它们的语言，风儿会传递消息。只要你静下心来，就能听见。',
      '不要随意砍伐树木哦，它们都是有生命的。',
      '…好了，我要去冥想了。愿森林保佑你。',
    ],
  },
  {
    id: 'farmer',
    name: '农场主老王',
    color: { shirt: '#654321', skin: '#d4a574', hair: '#8b4513', hairStyle: 0 },
    map: '农场',
    x: 46, y: 6,
    dialogs: [
      '欢迎来到我的农场！这里种植着各种季节的作物。',
      '春天种青菜萝卜，夏天种西瓜稻谷，秋天种南瓜红薯，冬天种白菜大蒜。',
      '鸡舍那边养着鸡和鸭，每天都能捡到新鲜的蛋。',
      '牲口棚里有牛和羊，牛奶和羊毛也是不错的收入来源。',
      '好好照料这些作物，它们会给你丰厚的回报！',
      '对了，水井就在东边，可以用来灌溉农田。',
    ],
  },
  {
    id: 'shepherd',
    name: '牧羊女小月',
    color: { shirt: '#ffb6c1', skin: '#f5c89a', hair: '#cd853f', hairStyle: 1 },
    map: '农场',
    x: 46, y: 30,
    dialogs: [
      '咩~ 小羊们今天也很有精神呢！',
      '我负责照顾这些可爱的动物，它们就像我的家人一样。',
      '母鸡每天早上都会下蛋，记得去鸡舍捡哦。',
      '奶牛需要每天挤奶，新鲜的牛奶可好喝了！',
      '这些羊毛可是上好的材料，可以用来做衣服呢。',
      '如果你需要帮忙照顾动物，随时来找我！',
    ],
  },
  {
    id: 'miner',
    name: '矿工阿铁',
    color: { shirt: '#4a4a4a', skin: '#d4a574', hair: '#2c2c2c', hairStyle: 0 },
    map: '矿洞',
    x: 30, y: 8,
    dialogs: [
      '欢迎来到骷髅矿穴！这里深处藏着各种珍贵的矿石。',
      '浅层主要是铜矿，中层有铁矿，深层才能找到金矿。',
      '矿洞里很危险，深处有怪物出没，一定要小心！',
      '火把可以照亮道路，记得多带一些。',
      '有些房间里藏着宝箱，里面可能有稀有物品哦。',
      '如果你挖到了珍贵的矿石，可以拿到村里去卖个好价钱！',
    ],
  },
  {
    id: 'blacksmith',
    name: '铁匠老赵',
    color: { shirt: '#8b0000', skin: '#c8a56a', hair: '#c8c8c8', hairStyle: 2 },
    map: '矿洞',
    x: 11, y: 11,
    dialogs: [
      '叮！叮！欢迎来到我的铁匠铺！',
      '我可以帮你把矿石打造成各种工具和武器。',
      '铜矿可以做成铜镐，铁矿做成铁剑，金矿做成金盔甲。',
      '挖矿需要好工具，没有好镐子可挖不动坚硬的岩石。',
      '如果你有多余的矿石，也可以卖给我换些金币。',
      '记得定期来升级你的装备，矿洞深处需要更强的武器！',
    ],
  },
];

export class NPCManager {
  constructor() {
    this.npcs = [];
    this.nearbyNpc = null;
  }

  loadNpcsForMap(mapName) {
    this.npcs = NPC_DATA
      .filter(n => n.map === mapName)
      .map(n => ({
        ...n,
        x: n.x * TILE + TILE / 2,
        y: n.y * TILE + TILE / 2,
        direction: 'down',
        frame: 0,
        frameTimer: 0,
        wanderTimer: Math.random() * 3000,
        wander: false,
        wanderDir: 'down',
        sprite: n.sprite || null, // { path, frameSize, frameHeight, image }
        // 静远七人多动作支持
        characterFrames: null, // { personality:[img,...], run:[img,...], ... }
        currentAction: 'personality',
        actionFrame: 0,
        actionFrameTimer: 0,
      }));
    return this.npcs;
  }

  setNpcSprite(npcId, spriteConfig) {
    for (const npc of this.npcs) {
      if (npc.id === npcId) {
        // 清理静远状态
        npc.characterFrames = null;
        npc.currentAction = 'personality';
        npc.actionFrame = 0;
        npc.actionFrameTimer = 0;

        if (spriteConfig && spriteConfig.type === 'jingyuan') {
          // 静远七人：保存角色所有动作帧
          npc.characterFrames = spriteConfig.characterFrames;
          npc.sprite = spriteConfig; // 保留引用以便类型判断
        } else {
          npc.sprite = spriteConfig;
        }
        return true;
      }
    }
    return false;
  }

  clearNpcSprite(npcId) {
    for (const npc of this.npcs) {
      if (npc.id === npcId) {
        npc.sprite = null;
        npc.characterFrames = null;
        npc.currentAction = 'personality';
        npc.actionFrame = 0;
        npc.actionFrameTimer = 0;
        return true;
      }
    }
    return false;
  }

  hasNpcSprite(npc) {
    if (npc && npc.characterFrames) return true; // 静远角色
    return !!(npc && npc.sprite && npc.sprite.image); // 传统精灵图
  }

  // 获取 NPC 当前应显示的静远动画帧
  getNpcActionFrame(npc) {
    if (!npc || !npc.characterFrames) return null;
    const frames = npc.characterFrames[npc.currentAction];
    if (!frames || frames.length === 0) return null;
    return frames[npc.actionFrame] || frames[0];
  }

  // 更新 NPC 的静远动画帧（根据 wander 状态切换 personality/run）
  updateJingyuanAnimation(npc, dt) {
    if (!npc.characterFrames) return;
    const targetAction = npc.wander ? 'run' : 'personality';
    if (npc.currentAction !== targetAction) {
      npc.currentAction = targetAction;
      npc.actionFrame = 0;
      npc.actionFrameTimer = 0;
    }
    const cfg = JINGYUAN_ACTION_CONFIG[npc.currentAction];
    if (!cfg) return;
    npc.actionFrameTimer += dt;
    if (npc.actionFrameTimer >= cfg.speed) {
      npc.actionFrameTimer = 0;
      npc.actionFrame = (npc.actionFrame + 1) % 4;
    }
  }

  getAllNpcData() {
    return NPC_DATA;
  }

  update(dt, mapManager) {
    for (const npc of this.npcs) {
      npc.wanderTimer -= dt;
      if (npc.wanderTimer <= 0) {
        npc.wanderTimer = 2000 + Math.random() * 4000;
        const r = Math.random();
        if (r < 0.25) { npc.wanderDir = 'up'; npc.wander = true; }
        else if (r < 0.5) { npc.wanderDir = 'down'; npc.wander = true; }
        else if (r < 0.75) { npc.wanderDir = 'left'; npc.wander = true; }
        else if (r < 0.9) { npc.wanderDir = 'right'; npc.wander = true; }
        else { npc.wander = false; }
      }

      if (npc.wander) {
        const speed = 0.8;
        let dx = 0, dy = 0;
        if (npc.wanderDir === 'up') dy = -speed;
        if (npc.wanderDir === 'down') dy = speed;
        if (npc.wanderDir === 'left') dx = -speed;
        if (npc.wanderDir === 'right') dx = speed;

        const nx = npc.x + dx;
        const ny = npc.y + dy;

        if (mapManager.isSolid(nx, ny)) {
          npc.wander = false;
          npc.frame = 0;
        } else {
          npc.x = nx;
          npc.y = ny;
          npc.direction = npc.wanderDir;
          npc.frameTimer += dt;
          if (npc.frameTimer > 250) {
            npc.frameTimer = 0;
            npc.frame = (npc.frame + 1) % 2;
          }
        }
      } else {
        npc.frame = 0;
      }

      // 静远七人 NPC 动画帧更新（与 wander 状态联动）
      this.updateJingyuanAnimation(npc, dt);
    }
  }

  findNearbyNpc(playerX, playerY, range = 48) {
    let nearest = null;
    let minDist = range;

    for (const npc of this.npcs) {
      const dx = npc.x - playerX;
      const dy = npc.y - playerY;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < minDist) {
        minDist = d;
        nearest = npc;
      }
    }

    this.nearbyNpc = nearest;
    return nearest;
  }

  getNpcs() {
    return this.npcs;
  }

  getNearbyNpc() {
    return this.nearbyNpc;
  }
}
