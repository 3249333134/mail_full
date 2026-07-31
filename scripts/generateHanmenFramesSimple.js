const fs = require('fs');
const path = require('path');

function createPNG(width, height, pixels) {
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  
  function crc32(data) {
    let crc = 0xFFFFFFFF;
    const table = [];
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let j = 0; j < 8; j++) {
        c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      }
      table[i] = c;
    }
    for (let i = 0; i < data.length; i++) {
      crc = table[(crc ^ data[i]) & 0xFF] ^ (crc >>> 8);
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }
  
  function createChunk(type, data) {
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length);
    const typeBuffer = Buffer.from(type);
    const crcData = Buffer.concat([typeBuffer, data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(crcData));
    return Buffer.concat([length, typeBuffer, data, crc]);
  }
  
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  
  const rawData = [];
  for (let y = 0; y < height; y++) {
    rawData.push(0);
    for (let x = 0; x < width; x++) {
      const pixel = pixels[y * width + x];
      rawData.push((pixel >> 24) & 0xFF);
      rawData.push((pixel >> 16) & 0xFF);
      rawData.push((pixel >> 8) & 0xFF);
      rawData.push(pixel & 0xFF);
    }
  }
  
  const zlib = require('zlib');
  const compressed = zlib.deflateSync(Buffer.from(rawData));
  
  const ihdrChunk = createChunk('IHDR', ihdr);
  const idatChunk = createChunk('IDAT', compressed);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));
  
  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function drawCharacter(charType, action, frame) {
  const w = 32, h = 32;
  const pixels = new Array(w * h).fill(0x00000000);
  
  const colors = charType === 'xuan-xuan' ? {
    skin: 0xFFFFD4B8, hair: 0xFF1A1A2E, dress: 0xFFE63946, light: 0xFFF77F00,
  } : {
    skin: 0xFFFFD4B8, hair: 0xFF2D3436, robe: 0xFF00CEC9, dark: 0xFF0984E3, belt: 0xFFD63031,
  };
  
  function fillRect(x, y, w, h, color) {
    for (let dy = 0; dy < h; dy++) {
      for (let dx = 0; dx < w; dx++) {
        const px = x + dx;
        const py = y + dy;
        if (px >= 0 && px < 32 && py >= 0 && py < 32) {
          pixels[py * 32 + px] = color;
        }
      }
    }
  }
  
  function drawCircle(cx, cy, r, color) {
    for (let y = -r; y <= r; y++) {
      for (let x = -r; x <= r; x++) {
        if (x * x + y * y <= r * r) {
          const px = cx + x;
          const py = cy + y;
          if (px >= 0 && px < 32 && py >= 0 && py < 32) {
            pixels[py * 32 + px] = color;
          }
        }
      }
    }
  }
  
  const offset = frame % 4;
  
  switch(action) {
    case 'personality': {
      const bob = Math.sin(frame * 0.8) * 1;
      fillRect(12, 14 + bob, 8, 10, colors.hair);
      drawCircle(16, 8 + bob, 8, colors.hair);
      drawCircle(16, 10 + bob, 5, colors.skin);
      drawCircle(14, 9 + bob, 1, 0xFF000000);
      drawCircle(18, 9 + bob, 1, 0xFF000000);
      fillRect(10, 20 + bob, 12, 12, colors.dress || colors.robe);
      if (colors.light) fillRect(12, 20 + bob, 8, 4, colors.light);
      if (colors.belt) fillRect(11, 21 + bob, 10, 2, colors.belt);
      break;
    }
    case 'run': {
      const leg = offset % 2 === 0 ? -1 : 1;
      drawCircle(16, 8, 8, colors.hair);
      drawCircle(16, 10, 5, colors.skin);
      drawCircle(14, 9, 1, 0xFF000000);
      drawCircle(18, 9, 1, 0xFF000000);
      fillRect(10, 20, 12, 10, colors.dress || colors.robe);
      if (colors.belt) fillRect(11, 20, 10, 2, colors.belt);
      fillRect(12, 28 + leg, 3, 4, colors.dress || colors.robe);
      fillRect(17, 28 - leg, 3, 4, colors.dress || colors.robe);
      fillRect(8 + leg, 18, 3, 6, 0xFFFFFFFF);
      fillRect(21 - leg, 18, 3, 6, 0xFFFFFFFF);
      break;
    }
    case 'etiquette': {
      const bow = offset < 2 ? 0 : offset === 2 ? -2 : -4;
      drawCircle(16, 10 + bow, 8, colors.hair);
      drawCircle(16, 12 + bow, 5, colors.skin);
      drawCircle(14, 11 + bow, 1, 0xFF000000);
      drawCircle(18, 11 + bow, 1, 0xFF000000);
      fillRect(10, 20 + bow, 12, 12, colors.dress || colors.robe);
      if (colors.belt) fillRect(11, 22 + bow, 10, 2, colors.belt);
      fillRect(14, 28 + bow, 4, 4, colors.dress || colors.robe);
      break;
    }
    case 'martial': {
      drawCircle(16, 8, 8, colors.hair);
      drawCircle(16, 10, 5, colors.skin);
      drawCircle(14, 9, 1, 0xFF000000);
      drawCircle(18, 9, 1, 0xFF000000);
      fillRect(10, 20, 12, 10, colors.dress || colors.robe);
      if (colors.belt) fillRect(11, 20, 10, 2, colors.belt);
      fillRect(6 + offset, 14, 8, 2, 0xFFC0C0C0);
      break;
    }
    case 'signature': {
      drawCircle(16, 8, 8, colors.hair);
      drawCircle(16, 10, 5, colors.skin);
      drawCircle(14, 9, 1, 0xFF000000);
      drawCircle(18, 9, 1, 0xFF000000);
      fillRect(10, 20, 12, 12, colors.dress || colors.robe);
      if (colors.light) fillRect(12, 20, 8, 4, colors.light);
      if (colors.belt) fillRect(11, 22, 10, 2, colors.belt);
      const glowColor = colors.light || colors.dark;
      for (let r = 2; r <= 6 + offset; r++) {
        drawCircle(16, 24, r, (glowColor & 0xFFFFFF) | 0x60000000);
      }
      break;
    }
  }
  
  return createPNG(32, 32, pixels);
}

const actions = ['personality', 'run', 'etiquette', 'martial', 'signature'];
const characters = ['01-萱宣', '02-修璟'];
const characterIds = ['xuan-xuan', 'xiu-jing'];

characters.forEach((charDir, charIndex) => {
  const charId = characterIds[charIndex];
  actions.forEach(action => {
    const dir = path.join(__dirname, '../sendbox/src/assets/characters/hanmen', charDir, 'frames', action);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    for (let i = 0; i < 4; i++) {
      const png = drawCharacter(charId, action, i);
      fs.writeFileSync(path.join(dir, `${String(i).padStart(2, '0')}.png`), png);
    }
  });
  console.log(`Generated frames for ${charDir}`);
});

console.log('All frames generated successfully!');