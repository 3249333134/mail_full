export const MONSTERS = {
  mud_worm: { id: 'mud_worm', name: '泥虫', hp: 15, attack: 5, defense: 1, expReward: 5, drops: [{ itemId: 'copper_ore', chance: 0.5 }] },
  stone_crab: { id: 'stone_crab', name: '石蟹', hp: 25, attack: 6, defense: 3, expReward: 8, drops: [{ itemId: 'copper_ore', chance: 0.6 }, { itemId: 'iron_ore', chance: 0.15 }] },
  ice_bat: { id: 'ice_bat', name: '冰蝠', hp: 30, attack: 8, defense: 2, expReward: 12, drops: [{ itemId: 'iron_ore', chance: 0.5 }, { itemId: 'jade', chance: 0.1 }] },
  ghost: { id: 'ghost', name: '幽灵', hp: 20, attack: 10, defense: 0, expReward: 15, drops: [{ itemId: 'jade', chance: 0.2 }, { itemId: 'quartz', chance: 0.3 }] },
  fire_bat: { id: 'fire_bat', name: '火蝠', hp: 35, attack: 9, defense: 3, expReward: 18, drops: [{ itemId: 'gold_ore', chance: 0.55 }, { itemId: 'ruby', chance: 0.15 }] },
  shadow_warrior: { id: 'shadow_warrior', name: '暗影武士', hp: 50, attack: 10, defense: 4, expReward: 28, drops: [{ itemId: 'gold_ore', chance: 0.65 }, { itemId: 'ruby', chance: 0.25 }] },
  crystal_golem: { id: 'crystal_golem', name: '水晶魔像', hp: 110, attack: 18, defense: 10, expReward: 45, drops: [{ itemId: 'crystal_ore', chance: 0.55 }, { itemId: 'moonstone', chance: 0.15 }] },
  prism_spider: { id: 'prism_spider', name: '棱镜蛛', hp: 75, attack: 22, defense: 5, expReward: 50, drops: [{ itemId: 'crystal_ore', chance: 0.5 }, { itemId: 'moonstone', chance: 0.2 }] },
  shadow_lurker: { id: 'shadow_lurker', name: '暗影潜伏者', hp: 150, attack: 28, defense: 10, expReward: 65, drops: [{ itemId: 'shadow_ore', chance: 0.55 }, { itemId: 'obsidian', chance: 0.15 }] },
  void_wraith: { id: 'void_wraith', name: '虚空幽魂', hp: 100, attack: 35, defense: 4, expReward: 70, drops: [{ itemId: 'shadow_ore', chance: 0.5 }, { itemId: 'obsidian', chance: 0.2 }] },
  abyss_serpent: { id: 'abyss_serpent', name: '深渊巨蟒', hp: 200, attack: 35, defense: 14, expReward: 85, drops: [{ itemId: 'void_ore', chance: 0.55 }, { itemId: 'dragon_jade', chance: 0.15 }] },
  bone_dragon: { id: 'bone_dragon', name: '骨龙', hp: 250, attack: 40, defense: 16, expReward: 100, drops: [{ itemId: 'void_ore', chance: 0.6 }, { itemId: 'dragon_jade', chance: 0.25 }] },
};

export const BOSS_MONSTERS = {
  20: { id: 'mud_golem', name: '泥岩巨兽', hp: 80, attack: 8, defense: 5, expReward: 50, drops: [{ itemId: 'copper_ore', chance: 1.0 }, { itemId: 'quartz', chance: 1.0 }] },
  40: { id: 'frost_queen', name: '冰霜女王', hp: 120, attack: 12, defense: 6, expReward: 80, drops: [{ itemId: 'iron_ore', chance: 1.0 }, { itemId: 'jade', chance: 1.0 }] },
  60: { id: 'lava_lord', name: '熔岩君主', hp: 180, attack: 16, defense: 8, expReward: 120, drops: [{ itemId: 'gold_ore', chance: 1.0 }, { itemId: 'ruby', chance: 1.0 }] },
  80: { id: 'crystal_king', name: '水晶之王', hp: 400, attack: 32, defense: 16, expReward: 220, drops: [{ itemId: 'crystal_ore', chance: 1.0 }, { itemId: 'moonstone', chance: 1.0 }] },
  100: { id: 'shadow_sovereign', name: '暗影君主', hp: 600, attack: 42, defense: 20, expReward: 350, drops: [{ itemId: 'shadow_ore', chance: 1.0 }, { itemId: 'obsidian', chance: 1.0 }] },
  120: { id: 'abyss_dragon', name: '深渊龙王', hp: 900, attack: 55, defense: 25, expReward: 500, drops: [{ itemId: 'void_ore', chance: 1.0 }, { itemId: 'dragon_jade', chance: 1.0 }] },
};

export const ZONE_MONSTERS = {
  shallow: ['mud_worm', 'stone_crab'],
  frost: ['ice_bat', 'ghost'],
  lava: ['fire_bat', 'shadow_warrior'],
  crystal: ['crystal_golem', 'prism_spider'],
  shadow: ['shadow_lurker', 'void_wraith'],
  abyss: ['abyss_serpent', 'bone_dragon'],
};

export const MAX_MINE_FLOOR = 120;

export class BattleSystem {
  constructor() {
    this.currentFloor = 1;
    this.playerHp = 100;
    this.playerMaxHp = 100;
    this.playerAttackPower = 10;
    this.playerDefense = 5;
    this.playerLevel = 1;
    this.playerExp = 0;
    this.playerGold = 0;
    
    this.currentMonster = null;
    this.monsterHp = 0;
    this.monsterMaxHp = 0;
    
    this.isInBattle = false;
    this.battleLog = [];
    
    this.mineInventory = new Map();
    this.maxFloorReached = 1;
    this.floorCleared = false;
    this.collectedNodes = new Set();
  }

  getZone(floor) {
    const zoneIndex = Math.floor((floor - 1) / 20);
    const zones = ['shallow', 'frost', 'lava', 'crystal', 'shadow', 'abyss'];
    return zones[zoneIndex] || 'shallow';
  }

  getZoneName(floor) {
    const names = {
      shallow: '浅矿·土石洞穴',
      frost: '冰窟·冰霜暗河',
      lava: '熔岩层·地火暗涌',
      crystal: '晶窟·水晶迷宫',
      shadow: '幽境·暗影裂隙',
      abyss: '深渊·无底深渊'
    };
    return names[this.getZone(floor)] || '浅矿';
  }

  generateMonster() {
    if (BOSS_MONSTERS[this.currentFloor]) {
      return { ...BOSS_MONSTERS[this.currentFloor], isBoss: true };
    }
    
    const zone = this.getZone(this.currentFloor);
    const monsterIds = ZONE_MONSTERS[zone];
    const monsterId = monsterIds[Math.floor(Math.random() * monsterIds.length)];
    
    const scaleFactor = 1 + (this.currentFloor - 1) * 0.02;
    const base = MONSTERS[monsterId];
    
    return {
      ...base,
      hp: Math.floor(base.hp * scaleFactor),
      attack: Math.floor(base.attack * scaleFactor),
      defense: Math.floor(base.defense * scaleFactor),
      expReward: Math.floor(base.expReward * scaleFactor),
      isBoss: false
    };
  }

  startBattle() {
    if (this.isInBattle) return this.currentMonster;
    this.currentMonster = this.generateMonster();
    this.monsterHp = this.currentMonster.hp;
    this.monsterMaxHp = this.currentMonster.hp;
    this.isInBattle = true;
    
    this.addBattleLog(`遭遇${this.currentMonster.isBoss ? 'BOSS' : ''} ${this.currentMonster.name}！`);
    return this.currentMonster;
  }

  playerAttack() {
    if (!this.isInBattle || !this.currentMonster) return null;
    
    const damage = Math.max(1, this.playerAttackPower - this.currentMonster.defense + Math.floor(Math.random() * 5));
    this.monsterHp -= damage;
    
    this.addBattleLog(`你对 ${this.currentMonster.name} 造成了 ${damage} 点伤害！`);
    
    if (this.monsterHp <= 0) {
      return this.defeatMonster();
    }
    
    return this.monsterAttack();
  }

  monsterAttack() {
    if (!this.isInBattle || !this.currentMonster) return null;
    
    const damage = Math.max(1, this.currentMonster.attack - this.playerDefense + Math.floor(Math.random() * 3));
    this.playerHp -= damage;
    
    this.addBattleLog(`${this.currentMonster.name} 对你造成了 ${damage} 点伤害！`);
    
    if (this.playerHp <= 0) {
      return this.playerDefeat();
    }
    
    return {
      playerHp: this.playerHp,
      monsterHp: this.monsterHp,
      playerMaxHp: this.playerMaxHp,
      monsterMaxHp: this.monsterMaxHp
    };
  }

  defeatMonster() {
    const monster = this.currentMonster;
    const awardedDrops = [];
    this.isInBattle = false;
    
    this.playerExp += monster.expReward;
    const goldReward = Math.floor(monster.expReward * 2);
    this.playerGold += goldReward;
    
    this.addBattleLog(`击败了 ${monster.name}！获得 ${monster.expReward} 经验，${goldReward} 金币！`);
    
    monster.drops.forEach(drop => {
      if (Math.random() < drop.chance) {
        const current = this.mineInventory.get(drop.itemId) || 0;
        this.mineInventory.set(drop.itemId, current + 1);
        awardedDrops.push(drop.itemId);
        this.addBattleLog(`获得物品：${drop.itemId}`);
      }
    });
    
    if (monster.isBoss) {
      this.addBattleLog(`🎉 BOSS战胜利！`);
    }
    
    this.checkLevelUp();
    this.floorCleared = true;
    this.currentMonster = null;
    
    return {
      result: 'victory',
      exp: monster.expReward,
      gold: goldReward,
      monsterName: monster.name,
      isBoss: monster.isBoss,
      drops: awardedDrops,
    };
  }

  playerDefeat() {
    this.isInBattle = false;
    this.playerHp = Math.floor(this.playerMaxHp * 0.3);
    this.currentFloor = Math.max(1, this.currentFloor - 5);
    
    this.addBattleLog(`你被击败了！回到第 ${this.currentFloor} 层，生命值恢复30%。`);
    this.currentMonster = null;
    
    return { result: 'defeat', floor: this.currentFloor };
  }

  checkLevelUp() {
    const expNeeded = this.playerLevel * 100;
    while (this.playerExp >= expNeeded) {
      this.playerExp -= expNeeded;
      this.playerLevel++;
      this.playerMaxHp += 20;
      this.playerHp = this.playerMaxHp;
      this.playerAttackPower += 3;
      this.playerDefense += 2;
      
      this.addBattleLog(`🎊 升级！当前等级：${this.playerLevel}`);
    }
  }

  moveToFloor(floor) {
    if (floor < 1 || floor > MAX_MINE_FLOOR) return false;
    this.currentFloor = floor;
    if (floor > this.maxFloorReached) {
      this.maxFloorReached = floor;
    }
    return true;
  }

  goDown() {
    if (this.floorCleared && !this.isInBattle && this.currentFloor < MAX_MINE_FLOOR) {
      this.currentFloor++;
      if (this.currentFloor > this.maxFloorReached) {
        this.maxFloorReached = this.currentFloor;
      }
      this.floorCleared = false;
      this.collectedNodes.clear();
      return true;
    }
    return false;
  }

  goUp() {
    if (this.currentFloor > 1) {
      this.currentFloor--;
      return true;
    }
    return false;
  }

  addBattleLog(message) {
    this.battleLog.push({
      time: Date.now(),
      message
    });
    if (this.battleLog.length > 50) {
      this.battleLog.shift();
    }
  }

  getBattleLog() {
    return this.battleLog;
  }

  heal(amount) {
    this.playerHp = Math.min(this.playerMaxHp, this.playerHp + amount);
    return this.playerHp;
  }

  leaveMine() {
    this.isInBattle = false;
    this.currentMonster = null;
    this.currentFloor = 1;
    this.battleLog = [];
  }

  getMineInventory() {
    return this.mineInventory;
  }

  collectOre(oreId) {
    const count = this.mineInventory.get(oreId) || 0;
    if (count > 0) {
      this.mineInventory.set(oreId, count - 1);
      return 1;
    }
    return 0;
  }

  reset() {
    this.currentFloor = 1;
    this.playerHp = 100;
    this.playerMaxHp = 100;
    this.playerAttackPower = 10;
    this.playerDefense = 5;
    this.playerLevel = 1;
    this.playerExp = 0;
    this.playerGold = 0;
    
    this.currentMonster = null;
    this.monsterHp = 0;
    this.monsterMaxHp = 0;
    
    this.isInBattle = false;
    this.battleLog = [];
    
    this.mineInventory = new Map();
    this.maxFloorReached = 1;
    this.floorCleared = false;
    this.collectedNodes = new Set();
  }

  isNodeCollected(nodeKey) {
    return this.collectedNodes.has(`${this.currentFloor}:${nodeKey}`);
  }

  collectNode(nodeKey) {
    const key = `${this.currentFloor}:${nodeKey}`;
    if (this.collectedNodes.has(key)) return false;
    this.collectedNodes.add(key);
    return true;
  }

  serialize() {
    return {
      currentFloor: this.currentFloor,
      playerHp: this.playerHp,
      playerMaxHp: this.playerMaxHp,
      playerAttackPower: this.playerAttackPower,
      playerDefense: this.playerDefense,
      playerLevel: this.playerLevel,
      playerExp: this.playerExp,
      playerGold: this.playerGold,
      mineInventory: Array.from(this.mineInventory.entries()),
      maxFloorReached: this.maxFloorReached,
      floorCleared: this.floorCleared,
      collectedNodes: Array.from(this.collectedNodes),
    };
  }

  restore(data = {}) {
    this.reset();
    if (!data || typeof data !== 'object') return false;
    const numbers = ['currentFloor', 'playerHp', 'playerMaxHp', 'playerAttackPower', 'playerDefense', 'playerLevel', 'playerExp', 'playerGold', 'maxFloorReached'];
    for (const key of numbers) {
      if (Number.isFinite(data[key])) this[key] = data[key];
    }
    this.floorCleared = data.floorCleared === true;
    this.mineInventory = new Map(Array.isArray(data.mineInventory) ? data.mineInventory : []);
    this.collectedNodes = new Set(Array.isArray(data.collectedNodes) ? data.collectedNodes : []);
    return true;
  }
}
