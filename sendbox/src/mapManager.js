import { MAP_W, MAP_H, TILE_TYPE, TILE, TILE_SOLID, TILE_COLORS } from './gameConfig.js';
import { PixelMapGenerator } from './pixelMapGenerator.js';

function generateMapVillage() {
  const m = [];
  for (let y = 0; y < MAP_H; y++) {
    m[y] = [];
    for (let x = 0; x < MAP_W; x++) {
      m[y][x] = TILE_TYPE.GRASS;
    }
  }
  for (let x = 0; x < MAP_W; x++) { m[0][x] = TILE_TYPE.STONE; m[MAP_H-1][x] = TILE_TYPE.STONE; }
  for (let y = 0; y < MAP_H; y++) { m[y][0] = TILE_TYPE.STONE; m[y][MAP_W-1] = TILE_TYPE.STONE; }

  for (let x = 5; x < 20; x++) { m[28][x] = TILE_TYPE.WATER; m[29][x] = TILE_TYPE.WATER; }
  for (let x = 18; x < 25; x++) { m[27][x] = TILE_TYPE.WATER; }

  for (let x = 4; x < 26; x++) {
    if (m[26][x] === TILE_TYPE.GRASS) m[26][x] = TILE_TYPE.SAND;
    if (m[30][x] === TILE_TYPE.GRASS) m[30][x] = TILE_TYPE.SAND;
  }

  for (let y = 10; y < 26; y++) { m[y][30] = TILE_TYPE.ROAD; }
  for (let x = 25; x < 45; x++) { m[18][x] = TILE_TYPE.ROAD; }
  for (let y = 18; y < 24; y++) { m[y][40] = TILE_TYPE.ROAD; }

  m[12][33] = TILE_TYPE.HOUSE; m[12][34] = TILE_TYPE.HOUSE;
  m[13][33] = TILE_TYPE.HOUSE; m[13][34] = TILE_TYPE.HOUSE;
  m[20][45] = TILE_TYPE.HOUSE; m[20][46] = TILE_TYPE.HOUSE;
  m[21][45] = TILE_TYPE.HOUSE; m[21][46] = TILE_TYPE.HOUSE;
  m[22][26] = TILE_TYPE.HOUSE; m[22][27] = TILE_TYPE.HOUSE;
  m[23][26] = TILE_TYPE.HOUSE; m[23][27] = TILE_TYPE.HOUSE;

  for (let i = 0; i < 40; i++) {
    const tx = 2 + Math.floor(Math.random() * 18);
    const ty = 2 + Math.floor(Math.random() * 20);
    if (m[ty][tx] === TILE_TYPE.GRASS) m[ty][tx] = TILE_TYPE.TREE;
  }
  for (let i = 0; i < 25; i++) {
    const tx = 48 + Math.floor(Math.random() * 10);
    const ty = 30 + Math.floor(Math.random() * 8);
    if (m[ty][tx] === TILE_TYPE.GRASS) m[ty][tx] = TILE_TYPE.TREE;
  }

  for (let i = 0; i < 30; i++) {
    const tx = 2 + Math.floor(Math.random() * (MAP_W - 4));
    const ty = 2 + Math.floor(Math.random() * (MAP_H - 4));
    if (m[ty][tx] === TILE_TYPE.GRASS) m[ty][tx] = Math.random() < 0.5 ? TILE_TYPE.FLOWER : TILE_TYPE.FLOWER2;
  }

  for (let i = 0; i < 15; i++) {
    const tx = 2 + Math.floor(Math.random() * (MAP_W - 4));
    const ty = 2 + Math.floor(Math.random() * (MAP_H - 4));
    if (m[ty][tx] === TILE_TYPE.GRASS) m[ty][tx] = TILE_TYPE.BUSH;
  }

  return m;
}

function generateMapDesert() {
  const m = [];
  for (let y = 0; y < MAP_H; y++) {
    m[y] = [];
    for (let x = 0; x < MAP_W; x++) {
      m[y][x] = TILE_TYPE.SAND;
    }
  }
  for (let x = 0; x < MAP_W; x++) { m[0][x] = TILE_TYPE.STONE; m[MAP_H-1][x] = TILE_TYPE.STONE; }
  for (let y = 0; y < MAP_H; y++) { m[y][0] = TILE_TYPE.STONE; m[y][MAP_W-1] = TILE_TYPE.STONE; }

  for (let y = 15; y < 22; y++) {
    for (let x = 25; x < 35; x++) {
      const dx = x - 30, dy = y - 18;
      if (dx*dx + dy*dy < 12) m[y][x] = TILE_TYPE.GRASS;
      if (dx*dx + dy*dy < 5) m[y][x] = TILE_TYPE.WATER;
    }
  }

  for (let i = 0; i < 50; i++) {
    const tx = 2 + Math.floor(Math.random() * (MAP_W - 4));
    const ty = 2 + Math.floor(Math.random() * (MAP_H - 4));
    if (m[ty][tx] === TILE_TYPE.SAND && Math.random() < 0.3) m[ty][tx] = TILE_TYPE.STONE;
  }

  for (let i = 0; i < 20; i++) {
    const tx = 2 + Math.floor(Math.random() * (MAP_W - 4));
    const ty = 2 + Math.floor(Math.random() * (MAP_H - 4));
    if (m[ty][tx] === TILE_TYPE.SAND) m[ty][tx] = TILE_TYPE.TREE;
  }

  m[10][10] = TILE_TYPE.HOUSE; m[10][11] = TILE_TYPE.HOUSE;
  m[11][10] = TILE_TYPE.HOUSE; m[11][11] = TILE_TYPE.HOUSE;
  m[30][50] = TILE_TYPE.HOUSE; m[30][51] = TILE_TYPE.HOUSE;
  m[31][50] = TILE_TYPE.HOUSE; m[31][51] = TILE_TYPE.HOUSE;

  for (let x = 10; x < 50; x++) { m[20][x] = TILE_TYPE.ROAD; }

  for (let y = 15; y < 22; y++) {
    for (let x = 25; x < 35; x++) {
      if (m[y][x] === TILE_TYPE.GRASS && Math.random() < 0.2) m[y][x] = TILE_TYPE.FLOWER;
    }
  }

  return m;
}

function generateMapForest() {
  const m = [];
  for (let y = 0; y < MAP_H; y++) {
    m[y] = [];
    for (let x = 0; x < MAP_W; x++) {
      m[y][x] = TILE_TYPE.GRASS;
    }
  }
  for (let x = 0; x < MAP_W; x++) { m[0][x] = TILE_TYPE.STONE; m[MAP_H-1][x] = TILE_TYPE.STONE; }
  for (let y = 0; y < MAP_H; y++) { m[y][0] = TILE_TYPE.STONE; m[y][MAP_W-1] = TILE_TYPE.STONE; }

  for (let i = 0; i < 300; i++) {
    const tx = 2 + Math.floor(Math.random() * (MAP_W - 4));
    const ty = 2 + Math.floor(Math.random() * (MAP_H - 4));
    if (m[ty][tx] === TILE_TYPE.GRASS) m[ty][tx] = TILE_TYPE.TREE;
  }

  for (let y = 15; y < 25; y++) {
    for (let x = 25; x < 35; x++) {
      m[y][x] = TILE_TYPE.GRASS;
    }
  }

  for (let i = 0; i < 15; i++) {
    const tx = 26 + Math.floor(Math.random() * 8);
    const ty = 16 + Math.floor(Math.random() * 7);
    m[ty][tx] = Math.random() < 0.5 ? TILE_TYPE.FLOWER : TILE_TYPE.FLOWER2;
  }
  for (let i = 0; i < 8; i++) {
    const tx = 26 + Math.floor(Math.random() * 8);
    const ty = 16 + Math.floor(Math.random() * 7);
    if (m[ty][tx] === TILE_TYPE.GRASS) m[ty][tx] = TILE_TYPE.BUSH;
  }

  for (let y = 5; y < 10; y++) {
    for (let x = 45; x < 52; x++) {
      const dx = x - 48, dy = y - 7;
      if (dx*dx/9 + dy*dy/4 < 1) m[y][x] = TILE_TYPE.WATER;
    }
  }
  for (let y = 4; y < 11; y++) {
    for (let x = 44; x < 53; x++) {
      if (m[y][x] === TILE_TYPE.GRASS) {
        let near = false;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          if (m[y+dy] && m[y+dy][x+dx] === TILE_TYPE.WATER) near = true;
        }
        if (near) m[y][x] = TILE_TYPE.SAND;
      }
    }
  }

  m[18][30] = TILE_TYPE.HOUSE; m[18][31] = TILE_TYPE.HOUSE;
  m[19][30] = TILE_TYPE.HOUSE; m[19][31] = TILE_TYPE.HOUSE;

  for (let x = 31; x < 45; x++) { m[20][x] = TILE_TYPE.ROAD; }
  for (let y = 10; y < 20; y++) { m[y][45] = TILE_TYPE.ROAD; }

  return m;
}

function generateMapFarm() {
  const m = [];
  for (let y = 0; y < MAP_H; y++) {
    m[y] = [];
    for (let x = 0; x < MAP_W; x++) {
      m[y][x] = TILE_TYPE.GRASS;
    }
  }
  for (let x = 0; x < MAP_W; x++) { m[0][x] = TILE_TYPE.STONE; m[MAP_H-1][x] = TILE_TYPE.STONE; }
  for (let y = 0; y < MAP_H; y++) { m[y][0] = TILE_TYPE.STONE; m[y][MAP_W-1] = TILE_TYPE.STONE; }

  // 主耕地区域
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 8; col++) {
      const startX = 5 + col * 6;
      const startY = 10 + row * 6;
      for (let y = startY; y < Math.min(startY + 4, MAP_H - 2); y++) {
        for (let x = startX; x < Math.min(startX + 4, MAP_W - 2); x++) {
          m[y][x] = TILE_TYPE.DIRT;
        }
      }
      // 田埂
      for (let x = startX - 1; x < startX + 5 && x < MAP_W - 1; x++) {
        if (m[startY - 1] && m[startY - 1][x] === TILE_TYPE.GRASS) m[startY - 1][x] = TILE_TYPE.ROAD;
        if (m[startY + 4] && m[startY + 4][x] === TILE_TYPE.GRASS) m[startY + 4][x] = TILE_TYPE.ROAD;
      }
      for (let y = startY - 1; y < startY + 5 && y < MAP_H - 1; y++) {
        if (m[y] && m[y][startX - 1] === TILE_TYPE.GRASS) m[y][startX - 1] = TILE_TYPE.ROAD;
        if (m[y] && m[y][startX + 4] === TILE_TYPE.GRASS) m[y][startX + 4] = TILE_TYPE.ROAD;
      }
    }
  }

  // 主屋 (农场主住宅)
  m[5][45] = TILE_TYPE.HOUSE; m[5][46] = TILE_TYPE.HOUSE; m[5][47] = TILE_TYPE.HOUSE;
  m[6][45] = TILE_TYPE.HOUSE; m[6][46] = TILE_TYPE.DOOR; m[6][47] = TILE_TYPE.HOUSE;
  m[7][45] = TILE_TYPE.HOUSE; m[7][46] = TILE_TYPE.HOUSE; m[7][47] = TILE_TYPE.HOUSE;

  // 谷仓
  m[5][35] = TILE_TYPE.SILO; m[5][36] = TILE_TYPE.SILO;
  m[6][35] = TILE_TYPE.SILO; m[6][36] = TILE_TYPE.DOOR;
  m[7][35] = TILE_TYPE.SILO; m[7][36] = TILE_TYPE.SILO;

  // 鸡舍
  m[28][35] = TILE_TYPE.COOP; m[28][36] = TILE_TYPE.COOP;
  m[29][35] = TILE_TYPE.COOP; m[29][36] = TILE_TYPE.DOOR;

  // 牲口棚
  m[28][45] = TILE_TYPE.STABLE; m[28][46] = TILE_TYPE.STABLE; m[28][47] = TILE_TYPE.STABLE;
  m[29][45] = TILE_TYPE.STABLE; m[29][46] = TILE_TYPE.DOOR; m[29][47] = TILE_TYPE.STABLE;

  // 水井
  m[15][50] = TILE_TYPE.WELL;
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (m[15+dy] && m[15+dy][50+dx] === TILE_TYPE.GRASS) {
        m[15+dy][50+dx] = TILE_TYPE.ROAD;
      }
    }
  }

  // 池塘
  for (let y = 32; y < 38; y++) {
    for (let x = 10; x < 18; x++) {
      const dx = x - 14, dy = y - 35;
      if (dx*dx + dy*dy < 16) m[y][x] = TILE_TYPE.WATER;
    }
  }
  for (let y = 31; y < 39; y++) {
    for (let x = 9; x < 19; x++) {
      if (m[y][x] === TILE_TYPE.GRASS) m[y][x] = TILE_TYPE.SAND;
    }
  }

  // 围栏
  for (let x = 3; x < 55; x++) { m[8][x] = TILE_TYPE.FENCE; }
  for (let x = 3; x < 55; x++) { m[32][x] = TILE_TYPE.FENCE; }
  for (let y = 8; y < 33; y++) { m[y][3] = TILE_TYPE.FENCE; }
  for (let y = 8; y < 33; y++) { m[y][54] = TILE_TYPE.FENCE; }
  // 大门
  m[20][3] = TILE_TYPE.DOOR;
  m[20][54] = TILE_TYPE.DOOR;

  // 道路
  for (let x = 3; x < 55; x++) { m[9][x] = TILE_TYPE.ROAD; }
  for (let x = 3; x < 55; x++) { m[31][x] = TILE_TYPE.ROAD; }
  for (let y = 9; y < 31; y++) { m[y][3] = TILE_TYPE.ROAD; }
  for (let y = 9; y < 31; y++) { m[y][54] = TILE_TYPE.ROAD; }
  for (let y = 9; y < 31; y++) { m[y][35] = TILE_TYPE.ROAD; }
  for (let y = 9; y < 31; y++) { m[y][45] = TILE_TYPE.ROAD; }

  // 路标
  m[4][20] = TILE_TYPE.SIGN;
  m[4][40] = TILE_TYPE.SIGN;

  // 树木
  for (let i = 0; i < 20; i++) {
    const tx = 2 + Math.floor(Math.random() * 56);
    const ty = 2 + Math.floor(Math.random() * 6);
    if (m[ty][tx] === TILE_TYPE.GRASS) m[ty][tx] = TILE_TYPE.TREE;
  }
  for (let i = 0; i < 15; i++) {
    const tx = 2 + Math.floor(Math.random() * 56);
    const ty = 34 + Math.floor(Math.random() * 4);
    if (m[ty][tx] === TILE_TYPE.GRASS) m[ty][tx] = TILE_TYPE.TREE;
  }

  // 花草装饰
  for (let i = 0; i < 30; i++) {
    const tx = 2 + Math.floor(Math.random() * 56);
    const ty = 2 + Math.floor(Math.random() * 6);
    if (m[ty][tx] === TILE_TYPE.GRASS) {
      m[ty][tx] = Math.random() < 0.4 ? TILE_TYPE.FLOWER : Math.random() < 0.5 ? TILE_TYPE.FLOWER2 : TILE_TYPE.FLOWER3;
    }
  }
  for (let i = 0; i < 20; i++) {
    const tx = 2 + Math.floor(Math.random() * 56);
    const ty = 34 + Math.floor(Math.random() * 4);
    if (m[ty][tx] === TILE_TYPE.GRASS) {
      m[ty][tx] = Math.random() < 0.4 ? TILE_TYPE.FLOWER : Math.random() < 0.5 ? TILE_TYPE.FLOWER2 : TILE_TYPE.FLOWER3;
    }
  }

  // 灌木
  for (let i = 0; i < 8; i++) {
    const tx = 2 + Math.floor(Math.random() * 56);
    const ty = 2 + Math.floor(Math.random() * 56);
    if (m[ty] && m[ty][tx] === TILE_TYPE.GRASS) m[ty][tx] = TILE_TYPE.BUSH;
  }

  return m;
}

function generateMapMine() {
  const m = [];
  for (let y = 0; y < MAP_H; y++) {
    m[y] = [];
    for (let x = 0; x < MAP_W; x++) {
      m[y][x] = TILE_TYPE.DARK_STONE;
    }
  }

  const carveRoom = (x1, y1, x2, y2) => {
    for (let y = y1; y <= y2; y++) for (let x = x1; x <= x2; x++) m[y][x] = TILE_TYPE.DARK_DIRT;
  };
  const carveHorizontal = (y, x1, x2) => {
    for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) m[y][x] = TILE_TYPE.DARK_DIRT;
  };
  const carveVertical = (x, y1, y2) => {
    for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) m[y][x] = TILE_TYPE.DARK_DIRT;
  };

  carveRoom(25, 15, 35, 25);
  carveRoom(15, 8, 22, 13);
  carveRoom(38, 8, 45, 13);
  carveRoom(15, 27, 22, 32);
  carveRoom(38, 27, 45, 32);
  carveVertical(30, 8, 32);
  carveVertical(29, 8, 32);
  carveHorizontal(20, 9, 48);
  carveHorizontal(19, 9, 48);
  carveHorizontal(10, 11, 49);
  carveHorizontal(11, 11, 49);
  carveHorizontal(29, 9, 49);
  carveHorizontal(30, 9, 49);
  carveVertical(11, 5, 20);
  carveVertical(12, 5, 20);
  carveVertical(47, 10, 22);
  carveVertical(46, 10, 22);
  carveVertical(9, 20, 33);
  carveVertical(10, 20, 33);

  // 矿脉
  for (let i = 0; i < 8; i++) { m[5 + i][10] = TILE_TYPE.ORE_COPPER; }
  for (let i = 0; i < 8; i++) { m[15 + i][48] = TILE_TYPE.ORE_IRON; }
  for (let i = 0; i < 5; i++) { m[28 + i][8] = TILE_TYPE.ORE_GOLD; }

  // 火把
  m[20][15] = TILE_TYPE.TORCH;
  m[20][44] = TILE_TYPE.TORCH;
  m[10][30] = TILE_TYPE.TORCH;
  m[29][30] = TILE_TYPE.TORCH;
  m[10][20] = TILE_TYPE.TORCH;
  m[10][40] = TILE_TYPE.TORCH;

  // 宝箱
  m[10][18] = TILE_TYPE.CHEST;
  m[10][42] = TILE_TYPE.CHEST;
  m[29][18] = TILE_TYPE.CHEST;
  m[29][42] = TILE_TYPE.CHEST;

  // 可从上下两侧接近的下层矿门
  m[18][28] = TILE_TYPE.HOUSE; m[18][29] = TILE_TYPE.HOUSE; m[18][30] = TILE_TYPE.DOOR; m[18][31] = TILE_TYPE.HOUSE; m[18][32] = TILE_TYPE.HOUSE;

  // 边界
  for (let x = 0; x < MAP_W; x++) { m[0][x] = TILE_TYPE.STONE; m[MAP_H-1][x] = TILE_TYPE.STONE; }
  for (let y = 0; y < MAP_H; y++) { m[y][0] = TILE_TYPE.STONE; m[y][MAP_W-1] = TILE_TYPE.STONE; }

  return m;
}

function generateMapHanmen() {
  const m = [];
  for (let y = 0; y < MAP_H; y++) {
    m[y] = [];
    for (let x = 0; x < MAP_W; x++) {
      m[y][x] = TILE_TYPE.GRASS;
    }
  }
  for (let x = 0; x < MAP_W; x++) { m[0][x] = TILE_TYPE.STONE; m[MAP_H-1][x] = TILE_TYPE.STONE; }
  for (let y = 0; y < MAP_H; y++) { m[y][0] = TILE_TYPE.STONE; m[y][MAP_W-1] = TILE_TYPE.STONE; }

  for (let y = 5; y < 15; y++) {
    for (let x = 5; x < 15; x++) {
      const dx = x - 10, dy = y - 10;
      if (dx*dx + dy*dy < 25) m[y][x] = TILE_TYPE.STONE;
    }
  }
  for (let y = 25; y < 35; y++) {
    for (let x = 40; x < 50; x++) {
      const dx = x - 45, dy = y - 30;
      if (dx*dx + dy*dy < 20) m[y][x] = TILE_TYPE.STONE;
    }
  }

  for (let y = 20; y < 26; y++) { m[y][30] = TILE_TYPE.ROAD; }
  for (let x = 15; x < 45; x++) { m[20][x] = TILE_TYPE.ROAD; }
  for (let y = 5; y < 20; y++) { m[y][15] = TILE_TYPE.ROAD; }
  for (let y = 26; y < 35; y++) { m[y][45] = TILE_TYPE.ROAD; }

  m[12][18] = TILE_TYPE.HOUSE; m[12][19] = TILE_TYPE.HOUSE; m[12][20] = TILE_TYPE.HOUSE;
  m[13][18] = TILE_TYPE.HOUSE; m[13][19] = TILE_TYPE.DOOR; m[13][20] = TILE_TYPE.HOUSE;
  m[14][18] = TILE_TYPE.HOUSE; m[14][19] = TILE_TYPE.HOUSE; m[14][20] = TILE_TYPE.HOUSE;

  m[10][25] = TILE_TYPE.HOUSE; m[10][26] = TILE_TYPE.HOUSE;
  m[11][25] = TILE_TYPE.HOUSE; m[11][26] = TILE_TYPE.DOOR;

  m[8][28] = TILE_TYPE.HOUSE; m[8][29] = TILE_TYPE.HOUSE; m[8][30] = TILE_TYPE.HOUSE;
  m[9][28] = TILE_TYPE.HOUSE; m[9][29] = TILE_TYPE.DOOR; m[9][30] = TILE_TYPE.HOUSE;

  m[22][35] = TILE_TYPE.HOUSE; m[22][36] = TILE_TYPE.HOUSE; m[22][37] = TILE_TYPE.HOUSE;
  m[23][35] = TILE_TYPE.HOUSE; m[23][36] = TILE_TYPE.DOOR; m[23][37] = TILE_TYPE.HOUSE;
  m[24][35] = TILE_TYPE.HOUSE; m[24][36] = TILE_TYPE.HOUSE; m[24][37] = TILE_TYPE.HOUSE;

  m[20][25] = TILE_TYPE.HOUSE; m[20][26] = TILE_TYPE.HOUSE;
  m[21][25] = TILE_TYPE.HOUSE; m[21][26] = TILE_TYPE.DOOR;

  m[18][32] = TILE_TYPE.HOUSE; m[18][33] = TILE_TYPE.HOUSE;
  m[19][32] = TILE_TYPE.HOUSE; m[19][33] = TILE_TYPE.DOOR;

  m[25][40] = TILE_TYPE.HOUSE; m[25][41] = TILE_TYPE.HOUSE;
  m[26][40] = TILE_TYPE.HOUSE; m[26][41] = TILE_TYPE.DOOR;

  m[28][42] = TILE_TYPE.HOUSE; m[28][43] = TILE_TYPE.HOUSE; m[28][44] = TILE_TYPE.HOUSE;
  m[29][42] = TILE_TYPE.HOUSE; m[29][43] = TILE_TYPE.DOOR; m[29][44] = TILE_TYPE.HOUSE;

  m[6][12] = TILE_TYPE.TORCH;
  m[6][18] = TILE_TYPE.TORCH;
  m[14][12] = TILE_TYPE.TORCH;
  m[14][24] = TILE_TYPE.TORCH;
  m[20][22] = TILE_TYPE.TORCH;
  m[20][38] = TILE_TYPE.TORCH;
  m[26][40] = TILE_TYPE.TORCH;
  m[26][48] = TILE_TYPE.TORCH;

  m[10][15] = TILE_TYPE.SIGN;
  m[20][15] = TILE_TYPE.SIGN;
  m[20][45] = TILE_TYPE.SIGN;
  m[30][45] = TILE_TYPE.SIGN;

  for (let y = 8; y < 18; y++) {
    for (let x = 2; x < 8; x++) {
      if (m[y][x] === TILE_TYPE.GRASS && Math.random() < 0.15) m[y][x] = TILE_TYPE.TREE;
    }
    for (let x = 50; x < 56; x++) {
      if (m[y][x] === TILE_TYPE.GRASS && Math.random() < 0.15) m[y][x] = TILE_TYPE.TREE;
    }
  }

  for (let i = 0; i < 20; i++) {
    const tx = 2 + Math.floor(Math.random() * (MAP_W - 4));
    const ty = 2 + Math.floor(Math.random() * (MAP_H - 4));
    if (m[ty][tx] === TILE_TYPE.GRASS) m[ty][tx] = Math.random() < 0.3 ? TILE_TYPE.FLOWER : Math.random() < 0.5 ? TILE_TYPE.FLOWER2 : TILE_TYPE.BUSH;
  }

  return m;
}

export const PRESET_MAPS = [
  { name: '村庄', generator: generateMapVillage },
  { name: '沙漠', generator: generateMapDesert },
  { name: '森林', generator: generateMapForest },
  { name: '农场', generator: generateMapFarm },
  { name: '矿洞', generator: generateMapMine },
  { name: '寒门', generator: generateMapHanmen },
];

export class MapManager {
  constructor() {
    this.map = null;
    this.mapName = '村庄';
    this.selectedMapIndex = 0;
    this.generator = new PixelMapGenerator();
    this.customMaps = [];
    this.loadCustomMaps();
  }

  loadCustomMaps() {
    try {
      const stored = localStorage.getItem('pixelSandbox_customMaps');
      if (stored) {
        this.customMaps = JSON.parse(stored);
      }
    } catch (e) {
      this.customMaps = [];
    }
  }

  saveCustomMaps() {
    localStorage.setItem('pixelSandbox_customMaps', JSON.stringify(this.customMaps));
  }

  addCustomMap(mapData, name) {
    this.customMaps.push({
      name: name || '自定义地图',
      data: mapData,
      timestamp: Date.now()
    });
    this.saveCustomMaps();
    return this.customMaps.length - 1;
  }

  removeCustomMap(index) {
    if (index >= PRESET_MAPS.length && index < PRESET_MAPS.length + this.customMaps.length) {
      const customIndex = index - PRESET_MAPS.length;
      this.customMaps.splice(customIndex, 1);
      this.saveCustomMaps();
    }
  }

  getAllMaps() {
    return [
      ...PRESET_MAPS.map(m => ({ ...m, isCustom: false })),
      ...this.customMaps.map(m => ({ name: m.name, data: m.data, isCustom: true }))
    ];
  }

  getMapCount() {
    return PRESET_MAPS.length + this.customMaps.length;
  }

  loadMap(index) {
    if (index < PRESET_MAPS.length) {
      const preset = PRESET_MAPS[index];
      this.map = preset.generator();
      this.mapName = preset.name;
    } else {
      const customIndex = index - PRESET_MAPS.length;
      if (customIndex >= 0 && customIndex < this.customMaps.length) {
        const custom = this.customMaps[customIndex];
        this.map = JSON.parse(JSON.stringify(custom.data));
        this.mapName = custom.name;
      } else {
        const preset = PRESET_MAPS[0];
        this.map = preset.generator();
        this.mapName = preset.name;
        index = 0;
      }
    }
    this.selectedMapIndex = index;
    return this.map;
  }

  getSafeSpawnPosition() {
    const centerX = Math.floor(MAP_W / 2);
    const centerY = Math.floor(MAP_H / 2);

    for (let r = 0; r < 20; r++) {
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          const tx = centerX + dx;
          const ty = centerY + dy;
          if (tx >= 0 && tx < MAP_W && ty >= 0 && ty < MAP_H) {
            if (!TILE_SOLID[this.map[ty][tx]]) {
              return {
                x: tx * TILE + TILE / 2,
                y: ty * TILE + TILE / 2
              };
            }
          }
        }
      }
    }

    return {
      x: centerX * TILE + TILE / 2,
      y: centerY * TILE + TILE / 2
    };
  }

  getTileAt(px, py) {
    const tx = Math.floor(px / TILE);
    const ty = Math.floor(py / TILE);
    if (tx < 0 || tx >= MAP_W || ty < 0 || ty >= MAP_H) return null;
    return this.map[ty][tx];
  }

  isSolid(px, py) {
    const tile = this.getTileAt(px, py);
    if (tile === null) return true;
    return TILE_SOLID[tile];
  }

  setTile(tx, ty, type) {
    if (tx < 1 || tx >= MAP_W - 1 || ty < 1 || ty >= MAP_H - 1) return;
    this.map[ty][tx] = type;
  }

  _rgbToLab(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
    g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
    b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;
    const x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
    const y = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 1.00000;
    const z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;
    const fx = x > 0.008856 ? Math.pow(x, 1/3) : (7.787 * x) + 16/116;
    const fy = y > 0.008856 ? Math.pow(y, 1/3) : (7.787 * y) + 16/116;
    const fz = z > 0.008856 ? Math.pow(z, 1/3) : (7.787 * z) + 16/116;
    return {
      l: (116 * fy) - 16,
      a: 500 * (fx - fy),
      b: 200 * (fy - fz)
    };
  }

  _labDistance(lab1, lab2) {
    const dl = lab1.l - lab2.l;
    const da = lab1.a - lab2.a;
    const db = lab1.b - lab2.b;
    return dl * dl + da * da + db * db;
  }

  _findClosestTile(r, g, b) {
    let minDist = Infinity;
    let bestTile = TILE_TYPE.GRASS;

    const targetLab = this._rgbToLab(r, g, b);

    for (const tileType of Object.values(TILE_TYPE)) {
      if (!TILE_COLORS[tileType]) continue;

      for (const color of TILE_COLORS[tileType]) {
        const colorLab = this._rgbToLab(color.r, color.g, color.b);
        const dist = this._labDistance(targetLab, colorLab);
        if (dist < minDist) {
          minDist = dist;
          bestTile = tileType;
        }
      }
    }

    return bestTile;
  }

  _getTileAverageColor(tileType) {
    const colors = TILE_COLORS[tileType];
    if (!colors || colors.length === 0) {
      return { r: 126, g: 200, b: 80 };
    }
    let sumR = 0, sumG = 0, sumB = 0;
    for (const c of colors) {
      sumR += c.r;
      sumG += c.g;
      sumB += c.b;
    }
    return {
      r: Math.round(sumR / colors.length),
      g: Math.round(sumG / colors.length),
      b: Math.round(sumB / colors.length)
    };
  }

  imageToMap(image) {
    this.map = this.generator.generateMap(image);
    this.mapName = '自定义地图';
    return this.map;
  }

  generatePreview(image, maxWidth = 300, maxHeight = 300) {
    return this.generator.generatePreview(image, maxWidth, maxHeight);
  }

  setGeneratorOptions(options) {
    if (options.algorithm) this.generator.setAlgorithm(options.algorithm);
    if (options.ditherStrength !== undefined) this.generator.setDitherStrength(options.ditherStrength);
    if (options.ditherScale !== undefined) this.generator.setDitherScale(options.ditherScale);
    if (options.filters) this.generator.setFilters(options.filters);
    if (options.lockedTiles) this.generator.setLockedTiles(options.lockedTiles);
  }

  addColorReplacement(sourceColor, targetTile) {
    this.generator.addColorReplacement(sourceColor, targetTile);
  }

  clearColorReplacements() {
    this.generator.clearColorReplacements();
  }
}
