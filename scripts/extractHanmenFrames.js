const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

const hanmenDir = path.join(__dirname, '../mailfile/寒门');
const outputBase = path.join(__dirname, '../sendbox/src/assets/characters/hanmen');

const characters = [
  { name: '01-萱宣', file: 'call_O4IqMGUK967wlwV8eIbxJgGc.png' },
  { name: '02-修璟', file: 'call_M4EwPDLSQwMP3oqGqN9Jo5yO.png' },
];

const actions = ['personality', 'etiquette', 'run', 'martial', 'signature'];
const framesPerAction = 4;

function removeMagentaBackground(img) {
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  
  const imageData = ctx.getImageData(0, 0, img.width, img.height);
  const data = imageData.data;
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    if (r > 240 && g < 20 && b > 240) {
      data[i + 3] = 0;
    }
  }
  
  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

function getCellBounds(ctx, img, startX, startY, cellW, cellH) {
  const imageData = ctx.getImageData(startX, startY, cellW, cellH);
  const data = imageData.data;
  
  let minX = cellW, minY = cellH, maxX = 0, maxY = 0;
  let hasPixel = false;
  
  for (let y = 0; y < cellH; y++) {
    for (let x = 0; x < cellW; x++) {
      const idx = (y * cellW + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const a = data[idx + 3];
      
      if (!(r > 240 && g < 20 && b > 240) && a > 10) {
        hasPixel = true;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  
  if (!hasPixel) return null;
  
  const padding = 2;
  return {
    x: Math.max(0, startX + minX - padding),
    y: Math.max(0, startY + minY - padding),
    w: Math.min(cellW, maxX - minX + 1 + padding * 2),
    h: Math.min(cellH, maxY - minY + 1 + padding * 2)
  };
}

async function extractCharacter(charInfo) {
  const imgPath = path.join(hanmenDir, charInfo.file);
  const img = await loadImage(imgPath);
  
  console.log(`Processing ${charInfo.name}: ${img.width}x${img.height}`);
  
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  
  const cellW = Math.floor(img.width / framesPerAction);
  const cellH = Math.floor(img.height / actions.length);
  
  console.log(`Cell size: ${cellW}x${cellH}`);
  
  const charDir = path.join(outputBase, charInfo.name, 'frames');
  for (const action of actions) {
    const actionDir = path.join(charDir, action);
    if (!fs.existsSync(actionDir)) {
      fs.mkdirSync(actionDir, { recursive: true });
    }
  }
  
  for (let row = 0; row < actions.length; row++) {
    const action = actions[row];
    const actionDir = path.join(charDir, action);
    
    for (let col = 0; col < framesPerAction; col++) {
      const startX = col * cellW;
      const startY = row * cellH;
      
      const bounds = getCellBounds(ctx, img, startX, startY, cellW, cellH);
      
      if (bounds) {
        const frameCanvas = createCanvas(bounds.w, bounds.h);
        const frameCtx = frameCanvas.getContext('2d');
        frameCtx.drawImage(
          img,
          bounds.x, bounds.y, bounds.w, bounds.h,
          0, 0, bounds.w, bounds.h
        );
        
        const frameImageData = frameCtx.getImageData(0, 0, bounds.w, bounds.h);
        const frameData = frameImageData.data;
        for (let i = 0; i < frameData.length; i += 4) {
          const r = frameData[i];
          const g = frameData[i + 1];
          const b = frameData[i + 2];
          if (r > 240 && g < 20 && b > 240) {
            frameData[i + 3] = 0;
          }
        }
        frameCtx.putImageData(frameImageData, 0, 0);
        
        const frameNum = String(col).padStart(2, '0');
        const outPath = path.join(actionDir, `${frameNum}.png`);
        const buffer = frameCanvas.toBuffer('image/png');
        fs.writeFileSync(outPath, buffer);
        console.log(`  Saved ${action}/${frameNum}.png (${bounds.w}x${bounds.h})`);
      }
    }
  }
  
  console.log(`Done with ${charInfo.name}\n`);
}

async function main() {
  for (const char of characters) {
    await extractCharacter(char);
  }
  console.log('All done!');
}

main().catch(console.error);
