export const SEASONS = ['spring', 'summer', 'autumn', 'winter'];
export const SEASON_NAMES = {
  spring: '春季',
  summer: '夏季',
  autumn: '秋季',
  winter: '冬季'
};

export const CROPS = {
  cabbage: { id: 'cabbage', name: '青菜', season: ['spring'], growthDays: 3, sellPrice: 35, seedPrice: 10, regrowth: false },
  radish: { id: 'radish', name: '萝卜', season: ['spring'], growthDays: 4, sellPrice: 55, seedPrice: 15, regrowth: false },
  potato: { id: 'potato', name: '土豆', season: ['spring'], growthDays: 5, sellPrice: 80, seedPrice: 25, regrowth: false },
  tea: { id: 'tea', name: '茶苗', season: ['spring'], growthDays: 8, sellPrice: 160, seedPrice: 80, regrowth: true, regrowthDays: 4, maxHarvests: 3 },
  watermelon: { id: 'watermelon', name: '西瓜', season: ['summer'], growthDays: 6, sellPrice: 130, seedPrice: 40, regrowth: false },
  rice: { id: 'rice', name: '稻谷', season: ['summer'], growthDays: 7, sellPrice: 75, seedPrice: 20, regrowth: false },
  lotus_root: { id: 'lotus_root', name: '莲藕', season: ['summer'], growthDays: 8, sellPrice: 170, seedPrice: 50, regrowth: false },
  sesame: { id: 'sesame', name: '芝麻', season: ['summer'], growthDays: 4, sellPrice: 45, seedPrice: 15, regrowth: false },
  pumpkin: { id: 'pumpkin', name: '南瓜', season: ['autumn'], growthDays: 7, sellPrice: 180, seedPrice: 50, regrowth: false },
  sweet_potato: { id: 'sweet_potato', name: '红薯', season: ['autumn'], growthDays: 5, sellPrice: 65, seedPrice: 20, regrowth: false },
  chrysanthemum: { id: 'chrysanthemum', name: '菊花', season: ['autumn'], growthDays: 6, sellPrice: 120, seedPrice: 35, regrowth: false },
  osmanthus: { id: 'osmanthus', name: '桂花', season: ['autumn'], growthDays: 8, sellPrice: 200, seedPrice: 60, regrowth: false },
  napa_cabbage: { id: 'napa_cabbage', name: '白菜', season: ['winter'], growthDays: 7, sellPrice: 50, seedPrice: 12, regrowth: false },
  spinach: { id: 'spinach', name: '菠菜', season: ['winter'], growthDays: 5, sellPrice: 40, seedPrice: 10, regrowth: false },
  garlic: { id: 'garlic', name: '大蒜', season: ['winter'], growthDays: 6, sellPrice: 55, seedPrice: 15, regrowth: false },
  winter_wheat: { id: 'winter_wheat', name: '冬小麦', season: ['winter'], growthDays: 10, sellPrice: 60, seedPrice: 15, regrowth: false },
};

export const ANIMALS = {
  chicken: { id: 'chicken', name: '鸡', cost: 800, productId: 'egg', productName: '鸡蛋', produceDays: 1 },
  duck: { id: 'duck', name: '鸭', cost: 1200, productId: 'duck_egg', productName: '鸭蛋', produceDays: 2 },
  cow: { id: 'cow', name: '牛', cost: 1500, productId: 'milk', productName: '牛奶', produceDays: 1 },
  sheep: { id: 'sheep', name: '羊', cost: 8000, productId: 'wool', productName: '羊毛', produceDays: 3 },
};

export const ANIMAL_BUILDINGS = {
  coop: { name: '鸡舍', capacity: 4, cost: 4000 },
  barn: { name: '牲口棚', capacity: 4, cost: 6000 },
};

export class FarmSystem {
  constructor() {
    this.reset();
  }

  getFieldKey(mapId, tileX, tileY) {
    return `${mapId}:${tileX},${tileY}`;
  }

  getSeasonName() {
    return SEASON_NAMES[SEASONS[this.currentSeason]];
  }

  advanceDay() {
    this.day++;
    if (this.day > 30) {
      this.day = 1;
      this.currentSeason = (this.currentSeason + 1) % 4;
    }
    this.updateCropGrowth();
    this.updateAnimalProduction();
  }

  canPlant(cropId) {
    const crop = CROPS[cropId];
    if (!crop) return false;
    return crop.season.includes(SEASONS[this.currentSeason]);
  }

  plantCrop(tileX, tileY, cropId, mapId = 'farm') {
    if (!this.canPlant(cropId)) return false;
    const crop = CROPS[cropId];
    if (!crop) return false;
    if (this.getSeedCount(cropId) <= 0) return false;

    const key = this.getFieldKey(mapId, tileX, tileY);
    if (this.fields.has(key)) return false;
    this.fields.set(key, {
      mapId,
      tileX,
      tileY,
      cropId,
      plantedDay: this.day,
      growthDays: crop.growthDays,
      harvestCount: 0,
      maxHarvests: crop.maxHarvests || 1,
      regrowthDays: crop.regrowthDays || 0,
    });

    this.removeItem(`seed_${cropId}`, 1);
    this.cropGrowthStates.set(key, 0);
    return true;
  }

  updateCropGrowth() {
    this.fields.forEach((field, key) => {
      const crop = CROPS[field.cropId];
      if (!crop) return;

      let growthDays = crop.growthDays;
      if (field.harvestCount > 0 && crop.regrowth) {
        growthDays = crop.regrowthDays;
      }

      const elapsedDays = this.day - field.plantedDay;
      const progress = Math.min(elapsedDays / growthDays, 1);
      this.cropGrowthStates.set(key, progress);
    });
  }

  isCropReady(key) {
    const field = this.fields.get(key);
    if (!field) return false;
    const crop = CROPS[field.cropId];
    if (!crop) return false;

    let growthDays = crop.growthDays;
    if (field.harvestCount > 0 && crop.regrowth) {
      growthDays = crop.regrowthDays;
    }

    return (this.day - field.plantedDay) >= growthDays;
  }

  harvestCrop(tileX, tileY, mapId = 'farm') {
    const key = this.getFieldKey(mapId, tileX, tileY);
    if (!this.isCropReady(key)) return null;

    const field = this.fields.get(key);
    const crop = CROPS[field.cropId];
    
    field.harvestCount++;
    
    if (crop.regrowth && field.harvestCount < field.maxHarvests) {
      field.plantedDay = this.day;
    } else {
      this.fields.delete(key);
      this.cropGrowthStates.delete(key);
    }

    this.addItem(crop.id, 1);
    return {
      name: crop.name,
      price: crop.sellPrice,
      cropId: crop.id
    };
  }

  getFieldAt(tileX, tileY, mapId = 'farm') {
    const key = this.getFieldKey(mapId, tileX, tileY);
    return this.fields.get(key);
  }

  getCropGrowthProgress(tileX, tileY, mapId = 'farm') {
    const key = this.getFieldKey(mapId, tileX, tileY);
    return this.cropGrowthStates.get(key) || 0;
  }

  buySeed(cropId, quantity = 1) {
    const crop = CROPS[cropId];
    if (!crop) return false;
    const cost = crop.seedPrice * quantity;
    if (this.money < cost) return false;

    this.money -= cost;
    this.addItem(`seed_${cropId}`, quantity);
    return true;
  }

  buyAnimal(animalId) {
    const animal = ANIMALS[animalId];
    if (!animal) return false;
    if (this.money < animal.cost) return false;

    const buildingType = animal.productId === 'egg' || animal.productId === 'duck_egg' ? 'coop' : 'barn';
    const building = this.buildings.find(b => b.type === buildingType);
    if (!building) return false;

    if (this.animals.filter(a => a.building === buildingType).length >= building.capacity) return false;

    this.money -= animal.cost;
    this.animals.push({
      id: animal.id,
      name: animal.name,
      productId: animal.productId,
      productName: animal.productName,
      produceDays: animal.produceDays,
      building: buildingType,
      lastProduce: this.day,
      health: 100,
      friendship: 0
    });

    return true;
  }

  buyBuilding(buildingType) {
    const building = ANIMAL_BUILDINGS[buildingType];
    if (!building) return false;
    if (this.money < building.cost) return false;
    if (this.buildings.find(b => b.type === buildingType)) return false;

    this.money -= building.cost;
    this.buildings.push({
      type: buildingType,
      name: building.name,
      capacity: building.capacity
    });
    return true;
  }

  updateAnimalProduction() {
    return this.animals.filter(animal => this.day - animal.lastProduce >= animal.produceDays).length;
  }

  collectAnimalProduct(animalIndex) {
    const animal = this.animals[animalIndex];
    if (!animal) return null;

    if (this.day - animal.lastProduce >= animal.produceDays) {
      this.addItem(animal.productId, 1);
      animal.lastProduce = this.day;
      return { name: animal.productName, productId: animal.productId };
    }
    return null;
  }

  collectProductsForBuilding(buildingType) {
    const products = [];
    this.animals.forEach((animal, index) => {
      if (animal.building !== buildingType) return;
      const product = this.collectAnimalProduct(index);
      if (product) products.push(product);
    });
    return products;
  }

  addItem(itemId, quantity) {
    const current = this.inventory.get(itemId) || 0;
    this.inventory.set(itemId, current + quantity);
  }

  removeItem(itemId, quantity) {
    const current = this.inventory.get(itemId) || 0;
    if (current < quantity) return false;
    this.inventory.set(itemId, current - quantity);
    return true;
  }

  getItemCount(itemId) {
    return this.inventory.get(itemId) || 0;
  }

  getSeedCount(cropId) {
    return this.getItemCount(`seed_${cropId}`);
  }

  sellItem(itemId, quantity = 1) {
    const count = this.getItemCount(itemId);
    if (count < quantity) return false;

    let price = 0;
    const crop = Object.values(CROPS).find(c => c.id === itemId);
    if (crop) {
      price = crop.sellPrice;
    } else {
      const prices = {
        egg: 30, duck_egg: 45, milk: 60, wool: 120,
        copper_ore: 40, iron_ore: 80, gold_ore: 200
      };
      price = prices[itemId] || 10;
    }

    this.removeItem(itemId, quantity);
    this.money += price * quantity;
    return price * quantity;
  }

  getAvailableSeeds() {
    return Object.entries(CROPS)
      .filter(([id]) => this.canPlant(id))
      .map(([id, crop]) => ({
        ...crop,
        count: this.getSeedCount(id)
      }));
  }

  reset() {
    this.fields = new Map();
    this.animals = [];
    this.buildings = [];
    this.currentSeason = 0;
    this.day = 1;
    this.money = 1000;
    this.inventory = new Map();
    this.cropGrowthStates = new Map();
    this.animalLastProduce = new Map();
    
    this.addItem('seed_cabbage', 5);
    this.addItem('seed_radish', 5);
    this.addItem('seed_potato', 3);
  }

  serialize() {
    return {
      fields: Array.from(this.fields.entries()),
      animals: this.animals,
      buildings: this.buildings,
      currentSeason: this.currentSeason,
      day: this.day,
      money: this.money,
      inventory: Array.from(this.inventory.entries()),
      cropGrowthStates: Array.from(this.cropGrowthStates.entries()),
      animalLastProduce: Array.from(this.animalLastProduce.entries()),
    };
  }

  restore(data = {}) {
    this.reset();
    if (!data || typeof data !== 'object') return false;
    this.fields = new Map(Array.isArray(data.fields) ? data.fields : []);
    this.animals = Array.isArray(data.animals) ? data.animals : [];
    this.buildings = Array.isArray(data.buildings) ? data.buildings : [];
    this.currentSeason = Number.isInteger(data.currentSeason) ? data.currentSeason : 0;
    this.day = Number.isInteger(data.day) ? data.day : 1;
    this.money = Number.isFinite(data.money) ? data.money : 1000;
    this.inventory = new Map(Array.isArray(data.inventory) ? data.inventory : []);
    this.cropGrowthStates = new Map(Array.isArray(data.cropGrowthStates) ? data.cropGrowthStates : []);
    this.animalLastProduce = new Map(Array.isArray(data.animalLastProduce) ? data.animalLastProduce : []);
    return true;
  }
}
