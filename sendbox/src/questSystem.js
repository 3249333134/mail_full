export const QUEST_TYPES = {
  plantCrops: '种植作物',
  harvestCrops: '收获作物',
  catchFish: '钓鱼',
  reachMineFloor: '到达矿洞层数',
  defeatMonster: '击败怪物',
  completeCommission: '完成委托',
  cookDish: '烹饪料理',
  collectItem: '收集物品',
  craftItem: '制作物品',
  talkToNpc: '与NPC对话',
  buildFarm: '建设农场',
  raiseAnimal: '养殖动物',
  sellItem: '出售物品',
};

export const STORY_QUESTS = [
  { id: 'ch1_q1', chapter: 1, order: 1, title: '初入田园', description: '这是你来到这片土地的第一天，先从种植开始吧。', npc: '村长', 
    objectives: [{ type: 'plantCrops', target: 5 }], 
    rewards: { money: 500, exp: 50, items: ['seed_radish', 'seed_potato'] } },
  
  { id: 'ch1_q2', chapter: 1, order: 2, title: '辛勤劳作', description: '种植是开始，收获才是成果。', npc: '村长', 
    objectives: [{ type: 'harvestCrops', target: 3 }], 
    rewards: { money: 800, exp: 80 } },
  
  { id: 'ch1_q3', chapter: 1, order: 3, title: '集市初探', description: '把你的收获拿到集市去卖吧。', npc: '商人', 
    objectives: [{ type: 'sellItem', target: 100 }], 
    rewards: { money: 1000, exp: 100 } },
  
  { id: 'ch1_q4', chapter: 1, order: 4, title: '挖矿之路', description: '矿洞深处藏着珍贵的矿石，去探索吧。', npc: '矿工', 
    objectives: [{ type: 'reachMineFloor', target: 10 }], 
    rewards: { money: 1500, exp: 150 } },
  
  { id: 'ch1_q5', chapter: 1, order: 5, title: '初试锋芒', description: '矿洞里有怪物出没，击败它们证明你的实力。', npc: '矿工', 
    objectives: [{ type: 'defeatMonster', target: 5 }], 
    rewards: { money: 2000, exp: 200, items: ['copper_ore'] } },
  
  { id: 'ch2_q1', chapter: 2, order: 6, title: '四季耕耘', description: '了解四季作物，每种季节都要有所收获。', npc: '老农夫', 
    objectives: [{ type: 'harvestCrops', target: 10 }], 
    rewards: { money: 3000, exp: 300 } },
  
  { id: 'ch2_q2', chapter: 2, order: 7, title: '养殖起步', description: '建造鸡舍，开始养殖生涯。', npc: '畜牧师', 
    objectives: [{ type: 'buildFarm', target: 1 }], 
    rewards: { money: 2000, exp: 250 } },
  
  { id: 'ch2_q3', chapter: 2, order: 8, title: '鸡鸭成群', description: '购买你的第一只动物。', npc: '畜牧师', 
    objectives: [{ type: 'raiseAnimal', target: 1 }], 
    rewards: { money: 1500, exp: 200 } },
  
  { id: 'ch2_q4', chapter: 2, order: 9, title: '深入矿洞', description: '矿洞深处有更珍贵的矿藏。', npc: '矿工', 
    objectives: [{ type: 'reachMineFloor', target: 30 }], 
    rewards: { money: 5000, exp: 400, items: ['iron_ore'] } },
  
  { id: 'ch2_q5', chapter: 2, order: 10, title: '冰霜挑战', description: '冰窟区域的怪物更加强大，击败它们。', npc: '矿工', 
    objectives: [{ type: 'defeatMonster', target: 10 }], 
    rewards: { money: 6000, exp: 500 } },
  
  { id: 'ch3_q1', chapter: 3, order: 11, title: '农庄扩建', description: '建造牲口棚，养殖更大的动物。', npc: '畜牧师', 
    objectives: [{ type: 'buildFarm', target: 2 }], 
    rewards: { money: 8000, exp: 600 } },
  
  { id: 'ch3_q2', chapter: 3, order: 12, title: '牛养成群', description: '购买一头牛，开始乳制品生产。', npc: '畜牧师', 
    objectives: [{ type: 'raiseAnimal', target: 3 }], 
    rewards: { money: 5000, exp: 400 } },
  
  { id: 'ch3_q3', chapter: 3, order: 13, title: '熔岩深处', description: '探索熔岩层，挑战更强大的怪物。', npc: '矿工', 
    objectives: [{ type: 'reachMineFloor', target: 60 }], 
    rewards: { money: 10000, exp: 800, items: ['gold_ore'] } },
  
  { id: 'ch3_q4', chapter: 3, order: 14, title: 'BOSS战', description: '挑战熔岩君主，证明你的实力。', npc: '矿工', 
    objectives: [{ type: 'defeatMonster', target: 1 }], 
    isBossQuest: true,
    rewards: { money: 20000, exp: 1500, items: ['ruby'] } },
  
  { id: 'ch3_q5', chapter: 3, order: 15, title: '丰收季节', description: '秋季是收获的季节，收获大量作物。', npc: '老农夫', 
    objectives: [{ type: 'harvestCrops', target: 20 }], 
    rewards: { money: 15000, exp: 1000 } },
  
  { id: 'ch4_q1', chapter: 4, order: 16, title: '水晶秘境', description: '探索神秘的水晶迷宫。', npc: '矿工', 
    objectives: [{ type: 'reachMineFloor', target: 80 }], 
    rewards: { money: 15000, exp: 1200, items: ['crystal_ore'] } },
  
  { id: 'ch4_q2', chapter: 4, order: 17, title: '水晶之王', description: '击败水晶之王，获取珍贵水晶。', npc: '矿工', 
    objectives: [{ type: 'defeatMonster', target: 1 }], 
    isBossQuest: true,
    rewards: { money: 30000, exp: 2000, items: ['moonstone'] } },
  
  { id: 'ch4_q3', chapter: 4, order: 18, title: '畜牧大师', description: '养殖更多种类的动物。', npc: '畜牧师', 
    objectives: [{ type: 'raiseAnimal', target: 5 }], 
    rewards: { money: 20000, exp: 1500 } },
  
  { id: 'ch4_q4', chapter: 4, order: 19, title: '冬日暖阳', description: '在寒冷的冬季也能收获作物。', npc: '老农夫', 
    objectives: [{ type: 'harvestCrops', target: 15 }], 
    rewards: { money: 12000, exp: 900 } },
  
  { id: 'ch4_q5', chapter: 4, order: 20, title: '暗影裂隙', description: '进入幽境，面对暗影生物。', npc: '矿工', 
    objectives: [{ type: 'reachMineFloor', target: 100 }], 
    rewards: { money: 25000, exp: 2000, items: ['shadow_ore'] } },
  
  { id: 'ch5_q1', chapter: 5, order: 21, title: '暗影君主', description: '挑战暗影君主，这是巨大的挑战。', npc: '矿工', 
    objectives: [{ type: 'defeatMonster', target: 1 }], 
    isBossQuest: true,
    rewards: { money: 50000, exp: 3000, items: ['obsidian'] } },
  
  { id: 'ch5_q2', chapter: 5, order: 22, title: '深渊探索', description: '进入无底深渊，探索最深处。', npc: '矿工', 
    objectives: [{ type: 'reachMineFloor', target: 120 }], 
    rewards: { money: 40000, exp: 3000, items: ['void_ore'] } },
  
  { id: 'ch5_q3', chapter: 5, order: 23, title: '深渊龙王', description: '最终挑战，击败深渊龙王！', npc: '村长', 
    objectives: [{ type: 'defeatMonster', target: 1 }], 
    isBossQuest: true,
    rewards: { money: 100000, exp: 5000, items: ['dragon_jade'] } },
  
  { id: 'ch5_q4', chapter: 5, order: 24, title: '田园大师', description: '你已经成为了真正的田园大师！', npc: '村长', 
    objectives: [{ type: 'harvestCrops', target: 50 }, { type: 'raiseAnimal', target: 10 }], 
    rewards: { money: 150000, exp: 8000 } },
  
  { id: 'ch5_q5', chapter: 5, order: 25, title: '传奇之旅', description: '回顾你的旅程，开启新的篇章。', npc: '村长', 
    objectives: [{ type: 'sellItem', target: 1000 }], 
    rewards: { money: 200000, exp: 10000 } },
];

const QUEST_NPC_IDS = {
  '村长': 'elder',
  '村长爷爷': 'elder',
  '商人': 'merchant',
  '旅行商人': 'merchant',
  '矿工': 'miner',
  '矿工阿铁': 'miner',
  '老农夫': 'farmer',
  '农场主老王': 'farmer',
  '畜牧师': 'shepherd',
  '牧羊女小月': 'shepherd',
};

STORY_QUESTS.forEach(quest => {
  quest.npcId = QUEST_NPC_IDS[quest.npc] || 'elder';
});

export const CHAPTER_NAMES = {
  1: '第一章·田园初启',
  2: '第二章·四季耕耘',
  3: '第三章·农庄发展',
  4: '第四章·秘境探险',
  5: '第五章·传奇之路',
};

export class QuestSystem {
  constructor() {
    this.activeQuests = [];
    this.completedQuests = new Set();
    this.readyToClaim = new Set();
    this.questProgress = new Map();
    this.currentChapter = 1;
    this.currentQuestOrder = 0;
    this.totalExp = 0;
    this.level = 1;
  }

  getStoryQuestById(questId) {
    return STORY_QUESTS.find(q => q.id === questId);
  }

  getStoryQuestByOrder(order) {
    return STORY_QUESTS.find(q => q.order === order);
  }

  getNextStoryQuest() {
    const nextOrder = this.currentQuestOrder + 1;
    return STORY_QUESTS.find(q => q.order === nextOrder);
  }

  getChapterQuests(chapter) {
    return STORY_QUESTS.filter(q => q.chapter === chapter);
  }

  getFirstStoryQuest() {
    return STORY_QUESTS.find(q => q.order === 1);
  }

  acceptQuest(questId) {
    const quest = this.getStoryQuestById(questId);
    if (!quest) return false;
    if (this.activeQuests.find(q => q.id === questId)) return false;
    if (this.completedQuests.has(questId)) return false;

    this.activeQuests.push(quest);
    this.questProgress.set(questId, {});
    
    quest.objectives.forEach(obj => {
      this.questProgress.get(questId)[obj.type] = 0;
    });

    return true;
  }

  updateProgress(questId, objectiveType, amount) {
    const quest = this.getStoryQuestById(questId);
    if (!quest) return false;
    if (!this.activeQuests.find(q => q.id === questId)) return false;

    const progress = this.questProgress.get(questId);
    if (!progress) return false;

    progress[objectiveType] = objectiveType === 'reachMineFloor'
      ? Math.max(progress[objectiveType] || 0, amount)
      : (progress[objectiveType] || 0) + amount;
    
    return this.checkQuestComplete(questId);
  }

  checkQuestComplete(questId) {
    const quest = this.getStoryQuestById(questId);
    if (!quest) return false;

    const progress = this.questProgress.get(questId);
    if (!progress) return false;

    const allComplete = quest.objectives.every(obj => {
      return (progress[obj.type] || 0) >= obj.target;
    });

    if (allComplete) {
      this.readyToClaim.add(questId);
      return true;
    }
    return false;
  }

  completeQuest(questId) {
    return this.claimQuest(questId);
  }

  claimQuest(questId) {
    const quest = this.getStoryQuestById(questId);
    if (!quest || !this.readyToClaim.has(questId) || this.completedQuests.has(questId)) return null;

    this.activeQuests = this.activeQuests.filter(q => q.id !== questId);
    this.completedQuests.add(questId);
    this.readyToClaim.delete(questId);
    
    if (quest.order > this.currentQuestOrder) {
      this.currentQuestOrder = quest.order;
      this.currentChapter = quest.chapter;
    }

    return quest.rewards;
  }

  getQuestProgress(questId) {
    const quest = this.getStoryQuestById(questId);
    if (!quest) return null;

    const progress = this.questProgress.get(questId);
    if (!progress) return null;

    return quest.objectives.map(obj => ({
      type: obj.type,
      name: QUEST_TYPES[obj.type] || obj.type,
      current: progress[obj.type] || 0,
      target: obj.target,
      complete: (progress[obj.type] || 0) >= obj.target
    }));
  }

  getActiveQuests() {
    return this.activeQuests.map(quest => ({
      ...quest,
      progress: this.getQuestProgress(quest.id),
      status: this.readyToClaim.has(quest.id) ? 'readyToClaim' : 'active',
    }));
  }

  getCompletedQuests() {
    return Array.from(this.completedQuests).map(id => this.getStoryQuestById(id)).filter(Boolean);
  }

  canAcceptNextQuest() {
    const nextQuest = this.getNextStoryQuest();
    if (!nextQuest) return false;
    
    const prevQuest = this.getStoryQuestByOrder(this.currentQuestOrder);
    if (!prevQuest) return true;
    
    return this.completedQuests.has(prevQuest.id);
  }

  addExp(amount) {
    this.totalExp += amount;
    const expNeeded = this.level * 100;
    while (this.totalExp >= expNeeded) {
      this.totalExp -= expNeeded;
      this.level++;
    }
    return this.level;
  }

  getLevel() {
    return this.level;
  }

  getExp() {
    return this.totalExp;
  }

  getExpNeeded() {
    return this.level * 100;
  }

  reset() {
    this.activeQuests = [];
    this.completedQuests = new Set();
    this.readyToClaim = new Set();
    this.questProgress = new Map();
    this.currentChapter = 1;
    this.currentQuestOrder = 0;
    this.totalExp = 0;
    this.level = 1;
  }

  autoAcceptNextQuest() {
    if (this.canAcceptNextQuest()) {
      const nextQuest = this.getNextStoryQuest();
      if (nextQuest) {
        this.acceptQuest(nextQuest.id);
        return nextQuest;
      }
    }
    return null;
  }

  recordEvent(objectiveType, value = 1, metadata = {}) {
    const completedNow = [];
    for (const quest of this.activeQuests) {
      if (this.readyToClaim.has(quest.id)) continue;
      const objective = quest.objectives.find(item => item.type === objectiveType);
      if (!objective) continue;
      if (quest.isBossQuest && objectiveType === 'defeatMonster' && !metadata.isBoss) continue;
      if (!quest.isBossQuest && metadata.onlyBoss === true) continue;
      if (this.updateProgress(quest.id, objectiveType, value)) completedNow.push(quest.id);
    }
    return completedNow;
  }

  getQuestForNpc(npcId) {
    const ready = this.activeQuests.find(quest => quest.npcId === npcId && this.readyToClaim.has(quest.id));
    if (ready) return { action: 'claim', quest: ready };
    const next = this.getNextStoryQuest();
    if (next && next.npcId === npcId && this.canAcceptNextQuest()) return { action: 'accept', quest: next };
    return null;
  }

  serialize() {
    return {
      activeQuestIds: this.activeQuests.map(quest => quest.id),
      completedQuests: Array.from(this.completedQuests),
      readyToClaim: Array.from(this.readyToClaim),
      questProgress: Array.from(this.questProgress.entries()),
      currentChapter: this.currentChapter,
      currentQuestOrder: this.currentQuestOrder,
      totalExp: this.totalExp,
      level: this.level,
    };
  }

  restore(data = {}) {
    this.reset();
    if (!data || typeof data !== 'object') return false;
    this.activeQuests = (Array.isArray(data.activeQuestIds) ? data.activeQuestIds : [])
      .map(id => this.getStoryQuestById(id)).filter(Boolean);
    this.completedQuests = new Set(Array.isArray(data.completedQuests) ? data.completedQuests : []);
    this.readyToClaim = new Set(Array.isArray(data.readyToClaim) ? data.readyToClaim : []);
    this.questProgress = new Map(Array.isArray(data.questProgress) ? data.questProgress : []);
    this.currentChapter = Number.isInteger(data.currentChapter) ? data.currentChapter : 1;
    this.currentQuestOrder = Number.isInteger(data.currentQuestOrder) ? data.currentQuestOrder : 0;
    this.totalExp = Number.isFinite(data.totalExp) ? data.totalExp : 0;
    this.level = Number.isInteger(data.level) ? data.level : 1;
    return true;
  }
}
