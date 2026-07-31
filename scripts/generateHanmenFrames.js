const fs = require('fs');
const path = require('path');

const CANVAS_SIZE = 32;

function createCanvas() {
  const { createCanvas } = require('canvas');
  return createCanvas(CANVAS_SIZE, CANVAS_SIZE);
}

function drawCharacter(ctx, charType, action, frame) {
  ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  
  const colors = charType === 'xuan-xuan' ? {
    skin: '#ffd4b8',
    hair: '#1a1a2e',
    dress: '#e63946',
    dressLight: '#f77f00',
    eyes: '#1a1a2e'
  } : {
    skin: '#ffd4b8',
    hair: '#2d3436',
    robe: '#00cec9',
    robeDark: '#0984e3',
    belt: '#d63031',
    eyes: '#1a1a2e'
  };

  const frameOffset = (frame * 2) % 4;

  switch(action) {
    case 'personality':
      drawPersonality(ctx, colors, frame);
      break;
    case 'run':
      drawRun(ctx, colors, frame);
      break;
    case 'etiquette':
      drawEtiquette(ctx, colors, frame);
      break;
    case 'martial':
      drawMartial(ctx, colors, frame);
      break;
    case 'signature':
      drawSignature(ctx, colors, frame);
      break;
  }
}

function drawPersonality(ctx, colors, frame) {
  const bob = Math.sin(frame * 0.8) * 1;
  
  ctx.fillStyle = colors.hair;
  if (colors.dress) {
    ctx.beginPath();
    ctx.arc(16, 8 + bob, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(12, 14 + bob, 8, 10);
    ctx.fillStyle = colors.skin;
    ctx.beginPath();
    ctx.arc(16, 10 + bob, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = colors.eyes;
    ctx.beginPath();
    ctx.arc(14, 9 + bob, 1, 0, Math.PI * 2);
    ctx.arc(18, 9 + bob, 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = colors.dress;
    ctx.fillRect(11, 20 + bob, 10, 12);
    ctx.fillStyle = colors.dressLight;
    ctx.fillRect(12, 20 + bob, 8, 4);
    ctx.fillStyle = '#fff';
    ctx.fillRect(10, 20 + bob, 2, 8);
    ctx.fillRect(20, 20 + bob, 2, 8);
  } else {
    ctx.beginPath();
    ctx.arc(16, 8 + bob, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(11, 13 + bob, 10, 12);
    ctx.fillStyle = colors.skin;
    ctx.beginPath();
    ctx.arc(16, 10 + bob, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = colors.eyes;
    ctx.beginPath();
    ctx.arc(14, 9 + bob, 1, 0, Math.PI * 2);
    ctx.arc(18, 9 + bob, 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = colors.robe;
    ctx.fillRect(10, 18 + bob, 12, 14);
    ctx.fillStyle = colors.robeDark;
    ctx.fillRect(12, 22 + bob, 8, 6);
    ctx.fillStyle = colors.belt;
    ctx.fillRect(11, 21 + bob, 10, 2);
  }
}

function drawRun(ctx, colors, frame) {
  const legOffset = frame % 2 === 0 ? -1 : 1;
  const armOffset = frame % 2 === 0 ? 1 : -1;
  
  ctx.fillStyle = colors.hair;
  if (colors.dress) {
    ctx.beginPath();
    ctx.arc(16, 8, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = colors.skin;
    ctx.beginPath();
    ctx.arc(16, 10, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = colors.eyes;
    ctx.beginPath();
    ctx.arc(14, 9, 1, 0, Math.PI * 2);
    ctx.arc(18, 9, 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = colors.dress;
    ctx.fillRect(11, 20, 10, 10);
    ctx.fillStyle = '#fff';
    ctx.fillRect(8 + armOffset, 18, 3, 6);
    ctx.fillRect(21 - armOffset, 18, 3, 6);
    ctx.fillStyle = colors.dress;
    ctx.fillRect(12, 28 + legOffset, 3, 4);
    ctx.fillRect(17, 28 - legOffset, 3, 4);
  } else {
    ctx.beginPath();
    ctx.arc(16, 8, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = colors.skin;
    ctx.beginPath();
    ctx.arc(16, 10, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = colors.eyes;
    ctx.beginPath();
    ctx.arc(14, 9, 1, 0, Math.PI * 2);
    ctx.arc(18, 9, 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = colors.robe;
    ctx.fillRect(10, 18, 12, 10);
    ctx.fillStyle = colors.belt;
    ctx.fillRect(11, 20, 10, 2);
    ctx.fillStyle = colors.robe;
    ctx.fillRect(9 + armOffset, 17, 3, 5);
    ctx.fillRect(20 - armOffset, 17, 3, 5);
    ctx.fillRect(12, 28 + legOffset, 3, 4);
    ctx.fillRect(17, 28 - legOffset, 3, 4);
  }
}

function drawEtiquette(ctx, colors, frame) {
  const bow = frame < 2 ? 0 : frame === 2 ? -2 : -4;
  
  ctx.fillStyle = colors.hair;
  if (colors.dress) {
    ctx.beginPath();
    ctx.arc(16, 10 + bow, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = colors.skin;
    ctx.beginPath();
    ctx.arc(16, 12 + bow, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = colors.eyes;
    ctx.beginPath();
    ctx.arc(14, 11 + bow, 1, 0, Math.PI * 2);
    ctx.arc(18, 11 + bow, 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = colors.dress;
    ctx.fillRect(10, 20 + bow, 12, 12);
    ctx.fillStyle = '#fff';
    ctx.fillRect(12, 22 + bow, 2, 4);
    ctx.fillRect(18, 22 + bow, 2, 4);
    ctx.fillRect(14, 28 + bow, 4, 4);
  } else {
    ctx.beginPath();
    ctx.arc(16, 10 + bow, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = colors.skin;
    ctx.beginPath();
    ctx.arc(16, 12 + bow, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = colors.eyes;
    ctx.beginPath();
    ctx.arc(14, 11 + bow, 1, 0, Math.PI * 2);
    ctx.arc(18, 11 + bow, 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = colors.robe;
    ctx.fillRect(10, 20 + bow, 12, 12);
    ctx.fillStyle = colors.belt;
    ctx.fillRect(11, 22 + bow, 10, 2);
    ctx.fillStyle = colors.robe;
    ctx.fillRect(14, 28 + bow, 4, 4);
  }
}

function drawMartial(ctx, colors, frame) {
  const swordPos = frame % 4;
  
  ctx.fillStyle = colors.hair;
  if (colors.dress) {
    ctx.beginPath();
    ctx.arc(16, 8, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = colors.skin;
    ctx.beginPath();
    ctx.arc(16, 10, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = colors.eyes;
    ctx.beginPath();
    ctx.arc(14, 9, 1, 0, Math.PI * 2);
    ctx.arc(18, 9, 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = colors.dress;
    ctx.fillRect(11, 20, 10, 10);
    ctx.fillStyle = '#fff';
    ctx.fillRect(8, 18, 4, 6);
    ctx.fillRect(20, 18, 4, 6);
    ctx.fillStyle = '#c0c0c0';
    if (swordPos === 0) ctx.fillRect(6, 14, 8, 2);
    else if (swordPos === 1) ctx.fillRect(4, 16, 10, 2);
    else if (swordPos === 2) ctx.fillRect(6, 18, 8, 2);
    else ctx.fillRect(8, 16, 6, 2);
  } else {
    ctx.beginPath();
    ctx.arc(16, 8, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = colors.skin;
    ctx.beginPath();
    ctx.arc(16, 10, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = colors.eyes;
    ctx.beginPath();
    ctx.arc(14, 9, 1, 0, Math.PI * 2);
    ctx.arc(18, 9, 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = colors.robe;
    ctx.fillRect(10, 18, 12, 10);
    ctx.fillStyle = colors.belt;
    ctx.fillRect(11, 20, 10, 2);
    ctx.fillStyle = colors.robe;
    ctx.fillRect(9, 17, 3, 5);
    ctx.fillRect(20, 17, 3, 5);
    ctx.fillStyle = '#c0c0c0';
    if (swordPos === 0) ctx.fillRect(6, 14, 8, 2);
    else if (swordPos === 1) ctx.fillRect(4, 16, 10, 2);
    else if (swordPos === 2) ctx.fillRect(6, 18, 8, 2);
    else ctx.fillRect(8, 16, 6, 2);
  }
}

function drawSignature(ctx, colors, frame) {
  const effect = frame;
  
  ctx.fillStyle = colors.hair;
  if (colors.dress) {
    ctx.beginPath();
    ctx.arc(16, 8, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = colors.skin;
    ctx.beginPath();
    ctx.arc(16, 10, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = colors.eyes;
    ctx.beginPath();
    ctx.arc(14, 9, 1, 0, Math.PI * 2);
    ctx.arc(18, 9, 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = colors.dress;
    ctx.fillRect(11, 20, 10, 12);
    ctx.fillStyle = colors.dressLight;
    ctx.beginPath();
    ctx.arc(16, 24, 4 + effect, 0, Math.PI * 2);
    ctx.globalAlpha = 0.5;
    ctx.fill();
    ctx.globalAlpha = 1;
  } else {
    ctx.beginPath();
    ctx.arc(16, 8, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = colors.skin;
    ctx.beginPath();
    ctx.arc(16, 10, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = colors.eyes;
    ctx.beginPath();
    ctx.arc(14, 9, 1, 0, Math.PI * 2);
    ctx.arc(18, 9, 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = colors.robe;
    ctx.fillRect(10, 18, 12, 12);
    ctx.fillStyle = colors.belt;
    ctx.fillRect(11, 20, 10, 2);
    ctx.fillStyle = colors.robeDark;
    ctx.beginPath();
    ctx.arc(16, 24, 4 + effect, 0, Math.PI * 2);
    ctx.globalAlpha = 0.5;
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

function generateFrames() {
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
        const canvas = createCanvas();
        const ctx = canvas.getContext('2d');
        drawCharacter(ctx, charId, action, i);
        const buffer = canvas.toBuffer('image/png');
        fs.writeFileSync(path.join(dir, `${String(i).padStart(2, '0')}.png`), buffer);
      }
    });
    console.log(`Generated frames for ${charDir}`);
  });
}

try {
  generateFrames();
  console.log('All frames generated successfully!');
} catch (err) {
  console.error('Error generating frames:', err);
  console.log('Trying fallback method...');
  generateFramesFallback();
}

function generateFramesFallback() {
  const { createCanvas } = require('canvas');
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
        const canvas = createCanvas(CANVAS_SIZE, CANVAS_SIZE);
        const ctx = canvas.getContext('2d');
        
        const colors = charId === 'xuan-xuan' ? {
          skin: '#ffd4b8', hair: '#1a1a2e', dress: '#e63946', light: '#f77f00',
        } : {
          skin: '#ffd4b8', hair: '#2d3436', robe: '#00cec9', dark: '#0984e3', belt: '#d63031',
        };
        
        ctx.fillStyle = '#ffffff00';
        ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
        
        ctx.fillStyle = colors.hair;
        ctx.beginPath();
        ctx.arc(16, 10, 8, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = colors.skin;
        ctx.beginPath();
        ctx.arc(16, 12, 5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(14, 11, 1, 0, Math.PI * 2);
        ctx.arc(18, 11, 1, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = colors.dress || colors.robe;
        ctx.fillRect(10, 20, 12, 12);
        
        if (colors.light) {
          ctx.fillStyle = colors.light;
          ctx.fillRect(12, 20, 8, 4);
        } else if (colors.belt) {
          ctx.fillStyle = colors.belt;
          ctx.fillRect(11, 22, 10, 2);
        }
        
        const buffer = canvas.toBuffer('image/png');
        fs.writeFileSync(path.join(dir, `${String(i).padStart(2, '0')}.png`), buffer);
      }
    });
    console.log(`Generated fallback frames for ${charDir}`);
  });
}