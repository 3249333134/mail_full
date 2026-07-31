import { TILE, TILE_TYPE } from './gameConfig.js';

function px(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.floor(x), Math.floor(y), w, h);
}

function drawGrass(ctx, x, y) {
  px(ctx, x, y, TILE, TILE, '#7ec850');
  px(ctx, x+4, y+6, 3, 3, '#6ab04c');
  px(ctx, x+20, y+12, 2, 2, '#6ab04c');
  px(ctx, x+12, y+24, 3, 2, '#6ab04c');
  px(ctx, x+26, y+28, 2, 2, '#6ab04c');
  px(ctx, x+8, y+4, 1, 2, '#98d868');
  px(ctx, x+16, y+18, 1, 2, '#98d868');
  px(ctx, x+24, y+8, 1, 2, '#98d868');
}

function drawSand(ctx, x, y) {
  px(ctx, x, y, TILE, TILE, '#f4d58d');
  px(ctx, x+5, y+8, 2, 2, '#e8c470');
  px(ctx, x+18, y+14, 3, 2, '#e8c470');
  px(ctx, x+10, y+22, 2, 2, '#e8c470');
  px(ctx, x+25, y+26, 2, 2, '#e8c470');
  px(ctx, x+2, y+18, 1, 1, '#fff3c4');
  px(ctx, x+14, y+6, 1, 1, '#fff3c4');
}

function drawStone(ctx, x, y) {
  px(ctx, x, y, TILE, TILE, '#8b8b8b');
  px(ctx, x+2, y+2, TILE-4, TILE-4, '#9a9a9a');
  px(ctx, x+8, y+4, 2, 10, '#7a7a7a');
  px(ctx, x+20, y+14, 2, 12, '#7a7a7a');
  px(ctx, x+4, y+20, 10, 2, '#7a7a7a');
  px(ctx, x+4, y+4, 4, 2, '#b0b0b0');
  px(ctx, x+16, y+8, 3, 2, '#b0b0b0');
}

function drawWater(ctx, x, y, time) {
  px(ctx, x, y, TILE, TILE, '#4a90d9');
  const wave = Math.floor(time / 400) % 2;
  const offset = wave * 4;
  px(ctx, x+4+offset, y+8, 8, 2, '#6ab0e8');
  px(ctx, x+18-offset, y+20, 8, 2, '#6ab0e8');
  px(ctx, x+8-offset, y+26, 6, 2, '#6ab0e8');
  px(ctx, x+2, y+2, 3, 1, '#8cc4f0');
  px(ctx, x+22, y+14, 2, 1, '#8cc4f0');
}

function drawTree(ctx, x, y) {
  px(ctx, x+13, y+18, 6, 14, '#8b5a2b');
  px(ctx, x+14, y+20, 2, 10, '#6b4423');
  px(ctx, x+6, y+4, 20, 18, '#4a8c3a');
  px(ctx, x+4, y+8, 24, 12, '#4a8c3a');
  px(ctx, x+8, y+2, 16, 4, '#4a8c3a');
  px(ctx, x+8, y+4, 6, 4, '#5fa84a');
  px(ctx, x+14, y+8, 4, 3, '#5fa84a');
  px(ctx, x+20, y+6, 4, 3, '#5fa84a');
  px(ctx, x+6, y+16, 5, 3, '#3a7028');
  px(ctx, x+18, y+14, 6, 4, '#3a7028');
}

function drawFlower(ctx, x, y, color) {
  drawGrass(ctx, x, y);
  px(ctx, x+15, y+18, 2, 10, '#4a8c3a');
  px(ctx, x+13, y+12, 6, 2, color);
  px(ctx, x+11, y+14, 2, 4, color);
  px(ctx, x+19, y+14, 2, 4, color);
  px(ctx, x+13, y+18, 6, 2, color);
  px(ctx, x+14, y+14, 4, 4, '#ffd93d');
}

function drawHouse(ctx, x, y) {
  px(ctx, x, y, TILE, TILE, '#e8d4b8');
  for (let row = 0; row < 4; row++) {
    const offset = (row % 2) * 4;
    for (let col = 0; col < 4; col++) {
      const bx = x + offset + col * 8;
      const by = y + row * 8;
      px(ctx, bx, by+7, 8, 1, '#c8b090');
    }
    px(ctx, x, y+row*8, 1, 8, '#c8b090');
  }
  px(ctx, x, y, TILE, 6, '#c0392b');
  px(ctx, x+2, y+1, TILE-4, 3, '#e74c3c');
  px(ctx, x, y+5, TILE, 2, '#922b21');
  px(ctx, x+10, y+12, 6, 6, '#5fcde4');
  px(ctx, x+10, y+12, 6, 1, '#3a7ca5');
  px(ctx, x+10, y+17, 6, 1, '#3a7ca5');
  px(ctx, x+12, y+12, 1, 6, '#3a7ca5');
  px(ctx, x+15, y+12, 1, 6, '#3a7ca5');
  px(ctx, x+20, y+20, 6, 12, '#8b5a2b');
  px(ctx, x+24, y+26, 1, 2, '#ffd700');
}

function drawRoad(ctx, x, y) {
  px(ctx, x, y, TILE, TILE, '#c9a86c');
  px(ctx, x+3, y+5, 2, 2, '#b8956a');
  px(ctx, x+16, y+10, 3, 2, '#b8956a');
  px(ctx, x+8, y+20, 2, 2, '#b8956a');
  px(ctx, x+22, y+25, 3, 2, '#b8956a');
  px(ctx, x+12, y+8, 1, 1, '#dbb87a');
  px(ctx, x+26, y+14, 1, 1, '#dbb87a');
}

function drawBush(ctx, x, y) {
  drawGrass(ctx, x, y);
  px(ctx, x+4, y+14, 24, 14, '#4a8c3a');
  px(ctx, x+6, y+10, 20, 6, '#4a8c3a');
  px(ctx, x+10, y+8, 12, 4, '#4a8c3a');
  px(ctx, x+8, y+12, 5, 3, '#5fa84a');
  px(ctx, x+18, y+10, 5, 3, '#5fa84a');
  px(ctx, x+14, y+16, 4, 2, '#5fa84a');
  px(ctx, x+4, y+22, 6, 4, '#3a7028');
  px(ctx, x+22, y+20, 5, 6, '#3a7028');
}

function drawDirt(ctx, x, y) {
  px(ctx, x, y, TILE, TILE, '#8b6914');
  px(ctx, x+5, y+8, 3, 2, '#6b4f10');
  px(ctx, x+18, y+14, 2, 3, '#6b4f10');
  px(ctx, x+10, y+22, 3, 2, '#6b4f10');
  px(ctx, x+25, y+26, 2, 2, '#6b4f10');
  px(ctx, x+8, y+4, 2, 2, '#a0781a');
  px(ctx, x+22, y+18, 2, 2, '#a0781a');
}

function drawRock(ctx, x, y) {
  px(ctx, x, y, TILE, TILE, '#4a4a4a');
  px(ctx, x+4, y+4, 24, 24, '#5a5a5a');
  px(ctx, x+6, y+6, 8, 6, '#707070');
  px(ctx, x+18, y+8, 6, 4, '#707070');
  px(ctx, x+8, y+20, 6, 4, '#404040');
  px(ctx, x+20, y+18, 4, 6, '#404040');
  px(ctx, x+12, y+12, 8, 6, '#606060');
}

function drawIce(ctx, x, y, time) {
  px(ctx, x, y, TILE, TILE, '#87ceeb');
  px(ctx, x+2, y+2, TILE-4, TILE-4, '#b0e0e6');
  const sparkle = Math.floor(time / 300) % 3;
  if (sparkle === 0) {
    px(ctx, x+8, y+8, 2, 2, '#ffffff');
    px(ctx, x+22, y+20, 2, 2, '#ffffff');
  } else if (sparkle === 1) {
    px(ctx, x+16, y+6, 2, 2, '#ffffff');
    px(ctx, x+10, y+24, 2, 2, '#ffffff');
  } else {
    px(ctx, x+24, y+12, 2, 2, '#ffffff');
    px(ctx, x+6, y+18, 2, 2, '#ffffff');
  }
  px(ctx, x+4, y+4, 3, 3, '#e0ffff');
  px(ctx, x+22, y+10, 2, 2, '#e0ffff');
}

function drawLava(ctx, x, y, time) {
  px(ctx, x, y, TILE, TILE, '#8b0000');
  px(ctx, x+2, y+2, TILE-4, TILE-4, '#ff4500');
  const bub = Math.floor(time / 150) % 4;
  if (bub === 0) {
    px(ctx, x+8, y+10, 6, 4, '#ff6347');
    px(ctx, x+20, y+18, 4, 4, '#ffa500');
  } else if (bub === 1) {
    px(ctx, x+12, y+8, 4, 6, '#ff6347');
    px(ctx, x+16, y+22, 6, 4, '#ffa500');
  } else if (bub === 2) {
    px(ctx, x+6, y+16, 4, 4, '#ff6347');
    px(ctx, x+22, y+12, 6, 4, '#ffa500');
  } else {
    px(ctx, x+20, y+8, 4, 4, '#ff6347');
    px(ctx, x+8, y+20, 6, 4, '#ffa500');
  }
  px(ctx, x+14, y+14, 4, 4, '#ffd700');
}

function drawBrick(ctx, x, y) {
  px(ctx, x, y, TILE, TILE, '#8b4513');
  for (let row = 0; row < 4; row++) {
    const offset = (row % 2) * 8;
    for (let col = 0; col < 4; col++) {
      const bx = x + offset + col * 16;
      const by = y + row * 8;
      px(ctx, bx, by, 14, 6, '#b22222');
      px(ctx, bx, by+6, 14, 2, '#8b4513');
    }
  }
  px(ctx, x, y, 2, TILE, '#5a2e12');
  px(ctx, x+TILE-2, y, 2, TILE, '#5a2e12');
}

function drawWood(ctx, x, y) {
  px(ctx, x, y, TILE, TILE, '#a0522d');
  px(ctx, x, y+4, TILE, 4, '#8b4513');
  px(ctx, x, y+12, TILE, 4, '#8b4513');
  px(ctx, x, y+20, TILE, 4, '#8b4513');
  px(ctx, x+4, y+8, 4, 4, '#cd853f');
  px(ctx, x+18, y+16, 4, 4, '#cd853f');
  px(ctx, x+10, y+24, 4, 4, '#cd853f');
  px(ctx, x+24, y+8, 2, TILE, '#654321');
}

function drawMushroom(ctx, x, y) {
  drawGrass(ctx, x, y);
  px(ctx, x+14, y+16, 4, 10, '#6b4423');
  px(ctx, x+15, y+18, 2, 6, '#8b5a2b');
  px(ctx, x+8, y+8, 16, 12, '#ff69b4');
  px(ctx, x+6, y+12, 20, 8, '#ff69b4');
  px(ctx, x+10, y+6, 12, 4, '#ff69b4');
  px(ctx, x+10, y+8, 4, 3, '#ffb6c1');
  px(ctx, x+18, y+10, 4, 3, '#ffb6c1');
  px(ctx, x+14, y+12, 4, 3, '#ffb6c1');
  px(ctx, x+12, y+14, 2, 2, '#8b0000');
  px(ctx, x+18, y+14, 2, 2, '#8b0000');
  px(ctx, x+15, y+18, 2, 2, '#8b0000');
}

function drawCactus(ctx, x, y) {
  drawSand(ctx, x, y);
  px(ctx, x+14, y+12, 4, 20, '#228b22');
  px(ctx, x+15, y+14, 2, 16, '#32cd32');
  px(ctx, x+8, y+16, 6, 8, '#228b22');
  px(ctx, x+10, y+18, 2, 4, '#32cd32');
  px(ctx, x+20, y+18, 4, 6, '#228b22');
  px(ctx, x+21, y+20, 2, 2, '#32cd32');
  px(ctx, x+6, y+22, 2, 2, '#006400');
  px(ctx, x+24, y+20, 2, 2, '#006400');
}

function drawSnow(ctx, x, y) {
  px(ctx, x, y, TILE, TILE, '#f0f8ff');
  px(ctx, x+4, y+4, 3, 3, '#ffffff');
  px(ctx, x+18, y+10, 4, 3, '#ffffff');
  px(ctx, x+10, y+20, 3, 3, '#ffffff');
  px(ctx, x+26, y+24, 2, 2, '#ffffff');
  px(ctx, x+8, y+26, 2, 2, '#e0e0e0');
  px(ctx, x+20, y+6, 2, 2, '#e0e0e0');
  px(ctx, x+14, y+14, 4, 4, '#e8e8e8');
}

function drawBridge(ctx, x, y) {
  drawWater(ctx, x, y, 0);
  px(ctx, x+4, y+12, 24, 8, '#8b5a2b');
  px(ctx, x+2, y+14, 4, 4, '#8b5a2b');
  px(ctx, x+26, y+14, 4, 4, '#8b5a2b');
  px(ctx, x+4, y+10, 24, 2, '#6b4423');
  px(ctx, x+4, y+20, 24, 2, '#6b4423');
  for (let i = 0; i < 4; i++) {
    px(ctx, x+8+i*6, y+14, 2, 4, '#5a3a1a');
  }
  px(ctx, x+8, y+16, 2, 2, '#a0682a');
  px(ctx, x+22, y+16, 2, 2, '#a0682a');
}

function drawDarkDirt(ctx, x, y) {
  px(ctx, x, y, TILE, TILE, '#50320f');
  px(ctx, x+4, y+6, 3, 3, '#3d250b');
  px(ctx, x+18, y+12, 2, 2, '#3d250b');
  px(ctx, x+10, y+22, 3, 2, '#3d250b');
  px(ctx, x+26, y+26, 2, 2, '#3d250b');
  px(ctx, x+8, y+4, 2, 2, '#6b4415');
  px(ctx, x+22, y+18, 2, 2, '#6b4415');
}

function drawDarkStone(ctx, x, y) {
  px(ctx, x, y, TILE, TILE, '#404040');
  px(ctx, x+2, y+2, TILE-4, TILE-4, '#505050');
  px(ctx, x+8, y+4, 2, 10, '#353535');
  px(ctx, x+20, y+14, 2, 12, '#353535');
  px(ctx, x+4, y+20, 10, 2, '#353535');
  px(ctx, x+4, y+4, 4, 2, '#606060');
  px(ctx, x+16, y+8, 3, 2, '#606060');
}

function drawPineTree(ctx, x, y) {
  px(ctx, x+14, y+20, 4, 12, '#8b5a2b');
  px(ctx, x+6, y+8, 20, 14, '#1a4a1a');
  px(ctx, x+4, y+12, 24, 10, '#1a4a1a');
  px(ctx, x+8, y+4, 16, 6, '#1a4a1a');
  px(ctx, x+2, y+16, 28, 8, '#1a4a1a');
  px(ctx, x+10, y+6, 4, 4, '#2a6a2a');
  px(ctx, x+18, y+8, 4, 4, '#2a6a2a');
  px(ctx, x+6, y+14, 4, 4, '#2a6a2a');
  px(ctx, x+22, y+14, 4, 4, '#2a6a2a');
}

function drawCloud(ctx, x, y) {
  px(ctx, x+8, y+10, 16, 8, '#ffffff');
  px(ctx, x+4, y+12, 8, 6, '#f5f5f5');
  px(ctx, x+20, y+12, 8, 6, '#f5f5f5');
  px(ctx, x+6, y+8, 6, 4, '#fafafa');
  px(ctx, x+20, y+8, 6, 4, '#fafafa');
}

function drawFence(ctx, x, y) {
  px(ctx, x, y, TILE, TILE, '#8b4513');
  px(ctx, x+4, y+4, 2, 20, '#a0522d');
  px(ctx, x+12, y+4, 2, 20, '#a0522d');
  px(ctx, x+20, y+4, 2, 20, '#a0522d');
  px(ctx, x+4, y+8, 20, 2, '#8b4513');
  px(ctx, x+4, y+16, 20, 2, '#8b4513');
  px(ctx, x+26, y+4, 2, 20, '#a0522d');
}

function drawSign(ctx, x, y) {
  px(ctx, x+14, y+14, 4, 14, '#8b4513');
  px(ctx, x+6, y+4, 20, 12, '#fffacd');
  px(ctx, x+8, y+6, 16, 8, '#fffaf0');
  px(ctx, x+10, y+8, 12, 4, '#fffacd');
  px(ctx, x+13, y+9, 2, 2, '#8b4513');
  px(ctx, x+17, y+9, 2, 2, '#8b4513');
}

function drawCampfire(ctx, x, y, time) {
  px(ctx, x+8, y+20, 16, 4, '#3d2817');
  px(ctx, x+10, y+20, 2, 4, '#5c4033');
  px(ctx, x+18, y+20, 2, 4, '#5c4033');
  px(ctx, x+12, y+16, 8, 4, '#ff6347');
  px(ctx, x+14, y+12, 4, 4, '#ffa500');
  const flicker = Math.floor(time / 100) % 2;
  if (flicker === 0) {
    px(ctx, x+13, y+8, 6, 4, '#fffacd');
    px(ctx, x+12, y+6, 8, 2, '#fff8dc');
  } else {
    px(ctx, x+14, y+8, 4, 4, '#fffacd');
    px(ctx, x+13, y+6, 6, 2, '#fff8dc');
  }
}

function drawChest(ctx, x, y) {
  px(ctx, x+4, y+10, 24, 14, '#8b4513');
  px(ctx, x+4, y+8, 24, 4, '#a0522d');
  px(ctx, x+2, y+12, 2, 10, '#5c3317');
  px(ctx, x+26, y+12, 2, 10, '#5c3317');
  px(ctx, x+12, y+14, 8, 2, '#ffd700');
  px(ctx, x+15, y+16, 2, 2, '#ffd700');
  px(ctx, x+6, y+16, 4, 2, '#6b3410');
  px(ctx, x+22, y+16, 4, 2, '#6b3410');
}

function drawWell(ctx, x, y) {
  drawGrass(ctx, x, y);
  px(ctx, x+6, y+10, 20, 16, '#2f4f4f');
  px(ctx, x+8, y+12, 16, 12, '#1a3a3a');
  px(ctx, x+10, y+14, 12, 8, '#0d2424');
  px(ctx, x+4, y+8, 24, 4, '#5a5a5a');
  px(ctx, x+28, y+8, 2, 2, '#5a5a5a');
  px(ctx, x+14, y+4, 4, 6, '#5a5a5a');
  px(ctx, x+13, y+2, 6, 2, '#808080');
}

function drawTorch(ctx, x, y, time) {
  drawDarkStone(ctx, x, y);
  px(ctx, x+14, y+12, 4, 16, '#8b4513');
  px(ctx, x+15, y+14, 2, 12, '#a0522d');
  px(ctx, x+12, y+8, 8, 6, '#ff6347');
  px(ctx, x+14, y+4, 4, 4, '#ffa500');
  const flicker = Math.floor(time / 100) % 2;
  if (flicker === 0) {
    px(ctx, x+10, y+2, 12, 4, '#fffacd');
    px(ctx, x+8, y+1, 16, 2, '#fff8dc');
  } else {
    px(ctx, x+12, y+2, 8, 4, '#fffacd');
    px(ctx, x+10, y+1, 12, 2, '#fff8dc');
  }
}

function drawOreCopper(ctx, x, y) {
  drawDarkStone(ctx, x, y);
  px(ctx, x+6, y+8, 8, 8, '#b87333');
  px(ctx, x+20, y+16, 6, 6, '#b87333');
  px(ctx, x+12, y+18, 6, 6, '#b87333');
  px(ctx, x+8, y+10, 4, 4, '#cd853f');
  px(ctx, x+22, y+18, 3, 3, '#cd853f');
  px(ctx, x+6, y+8, 2, 2, '#daa520');
}

function drawOreIron(ctx, x, y) {
  drawDarkStone(ctx, x, y);
  px(ctx, x+8, y+10, 8, 8, '#a9a9a9');
  px(ctx, x+18, y+14, 6, 6, '#a9a9a9');
  px(ctx, x+10, y+20, 6, 6, '#a9a9a9');
  px(ctx, x+10, y+12, 4, 4, '#c0c0c0');
  px(ctx, x+20, y+16, 3, 3, '#c0c0c0');
  px(ctx, x+8, y+10, 2, 2, '#ffffff');
}

function drawOreGold(ctx, x, y) {
  drawDarkStone(ctx, x, y);
  px(ctx, x+6, y+6, 10, 10, '#ffd700');
  px(ctx, x+20, y+12, 6, 6, '#ffd700');
  px(ctx, x+12, y+20, 8, 6, '#ffd700');
  px(ctx, x+8, y+8, 4, 4, '#ffea00');
  px(ctx, x+22, y+14, 3, 3, '#ffea00');
  px(ctx, x+6, y+6, 2, 2, '#ffffff');
  px(ctx, x+20, y+12, 1, 1, '#ffffff');
}

function drawDoor(ctx, x, y) {
  drawRoad(ctx, x, y);
  px(ctx, x+10, y+8, 12, 18, '#8b4513');
  px(ctx, x+11, y+10, 10, 14, '#a0522d');
  px(ctx, x+14, y+12, 4, 8, '#6b4423');
  px(ctx, x+15, y+20, 2, 2, '#ffd700');
}

function drawSilo(ctx, x, y) {
  px(ctx, x, y, TILE, TILE, '#d2b48c');
  px(ctx, x+4, y+4, TILE-8, TILE-8, '#c4a87c');
  px(ctx, x+6, y+6, TILE-12, 8, '#a08060');
  px(ctx, x+6, y+18, TILE-12, TILE-24, '#c4a87c');
  px(ctx, x+2, y+2, 2, 2, '#a08060');
  px(ctx, x+26, y+2, 2, 2, '#a08060');
  px(ctx, x+2, y+26, 2, 2, '#a08060');
  px(ctx, x+26, y+26, 2, 2, '#a08060');
  for (let i = 0; i < 3; i++) {
    px(ctx, x+4, y+20+i*4, TILE-8, 1, '#a08060');
  }
}

function drawCoop(ctx, x, y) {
  px(ctx, x, y, TILE, TILE, '#cd853f');
  px(ctx, x+2, y+2, TILE-4, TILE-4, '#daa520');
  px(ctx, x+4, y+4, TILE-8, TILE-8, '#cd853f');
  px(ctx, x+8, y+8, 4, 4, '#f4d58d');
  px(ctx, x+18, y+8, 4, 4, '#f4d58d');
  px(ctx, x+6, y+16, 8, 2, '#8b4513');
  px(ctx, x+18, y+16, 6, 2, '#8b4513');
  px(ctx, x+12, y+18, 8, 6, '#a0522d');
  px(ctx, x+14, y+22, 2, 2, '#ffd700');
}

function drawStable(ctx, x, y) {
  px(ctx, x, y, TILE, TILE, '#a0522d');
  px(ctx, x+2, y+2, TILE-4, TILE-4, '#8b4513');
  px(ctx, x+4, y+4, TILE-8, TILE-8, '#a0522d');
  px(ctx, x+8, y+10, 6, 6, '#deb887');
  px(ctx, x+18, y+10, 6, 6, '#deb887');
  px(ctx, x+12, y+20, 8, 6, '#6b4423');
  px(ctx, x+14, y+24, 2, 2, '#ffd700');
  px(ctx, x+6, y+6, 4, 4, '#654321');
  px(ctx, x+22, y+6, 4, 4, '#654321');
}

function _darken(hex, factor) {
  const c = _hexToRgb(hex);
  return `rgb(${Math.floor(c.r*factor)}, ${Math.floor(c.g*factor)}, ${Math.floor(c.b*factor)})`;
}

function _lighten(hex, factor) {
  const c = _hexToRgb(hex);
  return `rgb(${Math.min(255, Math.floor(c.r*factor))}, ${Math.min(255, Math.floor(c.g*factor))}, ${Math.min(255, Math.floor(c.b*factor))})`;
}

function _hexToRgb(hex) {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  };
}

function _drawCharFront(ctx, s, shirt, skin, hair, hairStyle, isBack, legOffset) {
  const p = (x, y, w, h, c) => px(ctx, x*s, y*s, w*s, h*s, c);

  p(5, 20, 2, 4, '#2c3e50');
  p(9, 20, 2, 4, '#2c3e50');
  if (legOffset > 0) {
    p(5, 23, 2, 1, 'rgba(0,0,0,0)');
    p(9, 19, 2, 1, '#2c3e50');
  }

  p(4, 12, 8, 8, shirt);
  p(4, 18, 8, 2, _darken(shirt, 0.7));
  p(5, 13, 2, 2, _lighten(shirt, 1.2));

  p(3, 13, 2, 6, skin);
  p(11, 13, 2, 6, skin);
  p(3, 18, 2, 1, skin);
  p(11, 18, 2, 1, skin);

  p(4, 4, 8, 8, skin);
  p(3, 6, 1, 3, skin);
  p(12, 6, 1, 3, skin);

  if (isBack) {
    _drawHairBack(ctx, s, hair, hairStyle);
  } else {
    _drawHairFront(ctx, s, hair, hairStyle);
    p(6, 7, 1, 2, '#1a1c2c');
    p(9, 7, 1, 2, '#1a1c2c');
    p(6, 7, 1, 1, '#fff');
    p(9, 7, 1, 1, '#fff');
    p(7, 10, 2, 1, '#c0392b');
    p(5, 9, 1, 1, 'rgba(255,150,150,0.5)');
    p(10, 9, 1, 1, 'rgba(255,150,150,0.5)');
  }
}

function _drawCharSide(ctx, s, shirt, skin, hair, hairStyle, isLeft, legOffset) {
  const p = (x, y, w, h, c) => px(ctx, x*s, y*s, w*s, h*s, c);

  if (isLeft) {
    ctx.save();
    ctx.translate(16*s, 0);
    ctx.scale(-1, 1);
    _drawCharSide(ctx, s, shirt, skin, hair, hairStyle, false, legOffset);
    ctx.restore();
    return;
  }

  p(6, 20, 3, 4, '#2c3e50');
  p(9, 20, 2, 3, '#2c3e50');
  if (legOffset > 0) {
    p(6, 23, 3, 1, 'rgba(0,0,0,0)');
    p(9, 19, 2, 1, '#2c3e50');
  }

  p(5, 12, 7, 8, shirt);
  p(5, 18, 7, 2, _darken(shirt, 0.7));
  p(6, 13, 2, 2, _lighten(shirt, 1.2));

  p(10, 13, 2, 6, skin);
  p(10, 18, 2, 1, skin);

  p(5, 4, 7, 8, skin);
  p(5, 6, 1, 3, skin);

  _drawHairSide(ctx, s, hair, hairStyle);

  p(9, 7, 1, 2, '#1a1c2c');
  p(9, 7, 1, 1, '#fff');
  p(11, 8, 1, 1, _darken(skin, 0.8));
  p(10, 10, 1, 1, '#c0392b');
}

function _drawHairFront(ctx, s, hair, style) {
  const p = (x, y, w, h, c) => px(ctx, x*s, y*s, w*s, h*s, c);
  if (style === 0) {
    p(4, 2, 8, 4, hair);
    p(3, 4, 1, 2, hair);
    p(12, 4, 1, 2, hair);
    p(5, 1, 6, 1, hair);
    p(5, 5, 2, 1, hair);
    p(9, 5, 2, 1, hair);
  } else if (style === 1) {
    p(4, 2, 8, 4, hair);
    p(3, 4, 1, 8, hair);
    p(12, 4, 1, 8, hair);
    p(5, 1, 6, 1, hair);
    p(5, 5, 2, 1, hair);
    p(9, 5, 2, 1, hair);
  } else {
    p(5, 3, 6, 2, hair);
    p(4, 4, 8, 1, hair);
    p(3, 5, 1, 2, hair);
    p(12, 5, 1, 2, hair);
  }
}

function _drawHairBack(ctx, s, hair, style) {
  const p = (x, y, w, h, c) => px(ctx, x*s, y*s, w*s, h*s, c);
  if (style === 0) {
    p(4, 2, 8, 4, hair);
    p(3, 4, 1, 2, hair);
    p(12, 4, 1, 2, hair);
    p(5, 1, 6, 1, hair);
  } else if (style === 1) {
    p(4, 2, 8, 4, hair);
    p(3, 4, 1, 10, hair);
    p(12, 4, 1, 10, hair);
    p(5, 1, 6, 1, hair);
    p(4, 14, 8, 1, hair);
  } else {
    p(5, 3, 6, 2, hair);
    p(4, 4, 8, 1, hair);
  }
}

function _drawHairSide(ctx, s, hair, style) {
  const p = (x, y, w, h, c) => px(ctx, x*s, y*s, w*s, h*s, c);
  if (style === 0) {
    p(5, 2, 6, 4, hair);
    p(4, 4, 1, 2, hair);
    p(10, 3, 2, 3, hair);
  } else if (style === 1) {
    p(5, 2, 6, 4, hair);
    p(4, 4, 1, 10, hair);
    p(10, 3, 2, 3, hair);
    p(5, 14, 6, 1, hair);
  } else {
    p(5, 3, 6, 2, hair);
    p(4, 4, 7, 1, hair);
  }
}

function drawCharacter(ctx, x, y, opts, time) {
  const {
    shirt = '#5fcde4',
    skin = '#f5c89a',
    hair = '#8b4513',
    hairStyle = 0,
    direction = 'down',
    frame = 0,
    scale = 1,
  } = opts;

  const s = scale;
  const w = 16 * s;
  const h = 24 * s;
  const px2 = x - w / 2;
  const py = y - h;

  const bob = (frame === 1) ? 1 * s : 0;
  const legOffset = (frame === 1) ? 1 * s : 0;

  ctx.save();
  ctx.translate(px2, py + bob);

  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(w/2, h - 1*s, 7*s, 2.5*s, 0, 0, Math.PI*2);
  ctx.fill();

  if (direction === 'down' || direction === 'up') {
    _drawCharFront(ctx, s, shirt, skin, hair, hairStyle, direction === 'up', legOffset);
  } else {
    _drawCharSide(ctx, s, shirt, skin, hair, hairStyle, direction === 'left', legOffset);
  }

  ctx.restore();
}

function drawTile(ctx, type, x, y, time) {
  switch (type) {
    case TILE_TYPE.GRASS: drawGrass(ctx, x, y); break;
    case TILE_TYPE.SAND: drawSand(ctx, x, y); break;
    case TILE_TYPE.STONE: drawStone(ctx, x, y); break;
    case TILE_TYPE.WATER: drawWater(ctx, x, y, time); break;
    case TILE_TYPE.TREE: drawTree(ctx, x, y); break;
    case TILE_TYPE.FLOWER: drawFlower(ctx, x, y, '#ff6b6b'); break;
    case TILE_TYPE.FLOWER2: drawFlower(ctx, x, y, '#5fcde4'); break;
    case TILE_TYPE.HOUSE: drawHouse(ctx, x, y); break;
    case TILE_TYPE.ROAD: drawRoad(ctx, x, y); break;
    case TILE_TYPE.BUSH: drawBush(ctx, x, y); break;
    case TILE_TYPE.DIRT: drawDirt(ctx, x, y); break;
    case TILE_TYPE.ROCK: drawRock(ctx, x, y); break;
    case TILE_TYPE.ICE: drawIce(ctx, x, y, time); break;
    case TILE_TYPE.LAVA: drawLava(ctx, x, y, time); break;
    case TILE_TYPE.BRICK: drawBrick(ctx, x, y); break;
    case TILE_TYPE.WOOD: drawWood(ctx, x, y); break;
    case TILE_TYPE.MUSHROOM: drawMushroom(ctx, x, y); break;
    case TILE_TYPE.CACTUS: drawCactus(ctx, x, y); break;
    case TILE_TYPE.SNOW: drawSnow(ctx, x, y); break;
    case TILE_TYPE.BRIDGE: drawBridge(ctx, x, y); break;
    case TILE_TYPE.DARK_DIRT: drawDarkDirt(ctx, x, y); break;
    case TILE_TYPE.DARK_STONE: drawDarkStone(ctx, x, y); break;
    case TILE_TYPE.FLOWER3: drawFlower(ctx, x, y, '#ffd700'); break;
    case TILE_TYPE.FLOWER4: drawFlower(ctx, x, y, '#9400d3'); break;
    case TILE_TYPE.PINE_TREE: drawPineTree(ctx, x, y); break;
    case TILE_TYPE.CLOUD: drawCloud(ctx, x, y); break;
    case TILE_TYPE.FENCE: drawFence(ctx, x, y); break;
    case TILE_TYPE.SIGN: drawSign(ctx, x, y); break;
    case TILE_TYPE.CAMPFIRE: drawCampfire(ctx, x, y, time); break;
    case TILE_TYPE.CHEST: drawChest(ctx, x, y); break;
    case TILE_TYPE.WELL: drawWell(ctx, x, y); break;
    case TILE_TYPE.TORCH: drawTorch(ctx, x, y, time); break;
    case TILE_TYPE.ORE_COPPER: drawOreCopper(ctx, x, y); break;
    case TILE_TYPE.ORE_IRON: drawOreIron(ctx, x, y); break;
    case TILE_TYPE.ORE_GOLD: drawOreGold(ctx, x, y); break;
    case TILE_TYPE.DOOR: drawDoor(ctx, x, y); break;
    case TILE_TYPE.SILO: drawSilo(ctx, x, y); break;
    case TILE_TYPE.COOP: drawCoop(ctx, x, y); break;
    case TILE_TYPE.STABLE: drawStable(ctx, x, y); break;
    default: drawGrass(ctx, x, y);
  }
}

// 绘制精灵图（外部图片）
// image: HTMLImageElement, x/y: 屏幕坐标（角色脚底中心点）
// opts: { frameSize, frameHeight, frame, direction, scale, isMoving }
function drawSprite(ctx, image, x, y, opts = {}) {
  if (!image || !image.width || !image.height) return;

  const {
    frameSize = 32,
    frameHeight = null,
    frame = 0,
    direction = 'down',
    scale = 1,
    isMoving = false,
    srcX: customSrcX = null,
    srcY: customSrcY = null,
  } = opts;

  const fw = frameSize;
  const fh = frameHeight || frameSize;

  let srcX, srcY;
  if (customSrcX !== null && customSrcY !== null) {
    srcX = customSrcX;
    srcY = customSrcY;
  } else {
    const totalFrames = Math.max(1, Math.floor(image.width / fw));
    const actualFrame = frame % totalFrames;
    srcX = actualFrame * fw;
    srcY = 0;
  }

  const dw = fw * scale;
  const dh = fh * scale;

  const dx = Math.floor(x - dw / 2);
  const dy = Math.floor(y - dh);

  ctx.save();
  if (direction === 'left') {
    ctx.translate(dx + dw, dy);
    ctx.scale(-1, 1);
    ctx.drawImage(image, srcX, srcY, fw, fh, 0, 0, dw, dh);
  } else {
    ctx.drawImage(image, srcX, srcY, fw, fh, dx, dy, dw, dh);
  }
  ctx.restore();
}

// 绘制静远七人独立帧（每帧是一张独立 PNG，尺寸较大约 139x249）
// x/y 是角色脚底中心点；targetH 为目标视觉高度（与游戏其他角色匹配）
function drawJingyuanSprite(ctx, image, x, y, opts = {}) {
  if (!image || !image.width || !image.height) return;

  const {
    scale = 1.0,
    targetH = 64,
  } = opts;

  const ratio = targetH / image.height;
  const dw = Math.floor(image.width * ratio * scale);
  const dh = Math.floor(image.height * ratio * scale);
  // 脚底居中对齐
  const dx = Math.floor(x - dw / 2);
  const dy = Math.floor(y - dh);

  const prevSmoothing = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(image, dx, dy, dw, dh);
  ctx.imageSmoothingEnabled = prevSmoothing;
}

// 绘制简单的物品图标（如水果、宝箱等）
// image: HTMLImageElement, x/y: 屏幕坐标（瓦片左上角）
// opts: { scale, offsetX, offsetY }
function drawItem(ctx, image, x, y, opts = {}) {
  if (!image || !image.width || !image.height) return;

  const {
    scale = 1,
    offsetX = 0,
    offsetY = 0,
  } = opts;

  const dw = image.width * scale;
  const dh = image.height * scale;

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(image, 0, 0, image.width, image.height, x + offsetX, y + offsetY, dw, dh);
  ctx.restore();
}

export const PixelArt = {
  drawTile,
  px,
  drawGrass,
  drawSand,
  drawStone,
  drawWater,
  drawTree,
  drawFlower,
  drawHouse,
  drawRoad,
  drawBush,
  drawDirt,
  drawRock,
  drawIce,
  drawLava,
  drawBrick,
  drawWood,
  drawMushroom,
  drawCactus,
  drawSnow,
  drawBridge,
  drawDarkDirt,
  drawDarkStone,
  drawPineTree,
  drawCloud,
  drawFence,
  drawSign,
  drawCampfire,
  drawChest,
  drawWell,
  drawTorch,
  drawOreCopper,
  drawOreIron,
  drawOreGold,
  drawDoor,
  drawSilo,
  drawCoop,
  drawStable,
  drawCharacter,
  drawSprite,
  drawJingyuanSprite,
  drawItem,
};