const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

const HANMEN_DIR = path.join(__dirname, 'sendbox', 'src', 'assets', 'characters', 'hanmen');
const ACTIONS = ['personality', 'etiquette', 'run', 'martial', 'signature'];

// 更严格的紫色检测
function isPurple(r, g, b) {
  // 检测紫色：红色和蓝色很高，绿色很低
  return r > 220 && b > 220 && g < 60;
}

async function extractFrames(charDir) {
  const spritesheetPath = path.join(HANMEN_DIR, charDir, 'spritesheet-chroma.png');
  
  if (!fs.existsSync(spritesheetPath)) {
    console.log(`❌ 找不到 spritesheet: ${spritesheetPath}`);
    return;
  }
  
  const img = await loadImage(spritesheetPath);
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  
  const cols = 4;
  const rows = 5;
  const cellW = Math.floor(img.width / cols);
  const cellH = Math.floor(img.height / rows);
  
  console.log(`📦 处理 ${charDir}: ${img.width}x${img.height}, 单元格: ${cellW}x${cellH}`);
  
  for (let row = 0; row < rows; row++) {
    const action = ACTIONS[row];
    const actionDir = path.join(HANMEN_DIR, charDir, 'frames', action);
    
    if (!fs.existsSync(actionDir)) {
      fs.mkdirSync(actionDir, { recursive: true });
    }
    
    for (let col = 0; col < cols; col++) {
      const frameNum = String(col).padStart(2, '0');
      const outputPath = path.join(actionDir, `${frameNum}.png`);
      
      // 创建帧画布
      const frameCanvas = createCanvas(cellW, cellH);
      const frameCtx = frameCanvas.getContext('2d');
      frameCtx.drawImage(img, col * cellW, row * cellH, cellW, cellH, 0, 0, cellW, cellH);
      
      // 获取图像数据并处理紫色背景
      const imageData = frameCtx.getImageData(0, 0, cellW, cellH);
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
          
          // 如果是紫色背景，设置透明度为0
          if (isPurple(r, g, b)) {
            data[idx + 3] = 0;
          } else if (a > 10) {
            hasPixel = true;
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }
      
      if (hasPixel) {
        // 添加padding并裁剪
        const padding = 4;
        const cropX = Math.max(0, minX - padding);
        const cropY = Math.max(0, minY - padding);
        const cropW = Math.min(cellW - cropX, maxX - minX + 1 + padding * 2);
        const cropH = Math.min(cellH - cropY, maxY - minY + 1 + padding * 2);
        
        const croppedCanvas = createCanvas(cropW, cropH);
        const croppedCtx = croppedCanvas.getContext('2d');
        croppedCtx.drawImage(frameCanvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
        
        // 再次检查裁剪后的图像，确保紫色完全去除
        const croppedData = croppedCtx.getImageData(0, 0, cropW, cropH);
        const cdata = croppedData.data;
        for (let i = 0; i < cdata.length; i += 4) {
          const r = cdata[i];
          const g = cdata[i + 1];
          const b = cdata[i + 2];
          if (isPurple(r, g, b)) {
            cdata[i + 3] = 0;
          }
        }
        croppedCtx.putImageData(croppedData, 0, 0);
        
        const buffer = croppedCanvas.toBuffer('image/png');
        fs.writeFileSync(outputPath, buffer);
        console.log(`  ✓ ${action}/${frameNum}.png (${cropW}x${cropH})`);
      }
    }
  }
}

async function main() {
  console.log('=== 开始提取寒门角色帧 ===\n');
  
  await extractFrames('01-萱宣');
  await extractFrames('02-修璟');
  
  console.log('\n=== 提取完成 ===');
}

main().catch(err => {
  console.error('提取失败:', err);
  process.exit(1);
});