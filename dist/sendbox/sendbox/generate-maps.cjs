const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const WIDTH = 1920;
const HEIGHT = 1080;
const OUTPUT_DIR = path.join(__dirname, 'src', 'assets', 'maps');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function drawCloud(ctx, x, y, scale) {
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.beginPath();
  ctx.arc(x, y, 25 * scale, 0, Math.PI * 2);
  ctx.arc(x + 30 * scale, y - 10 * scale, 30 * scale, 0, Math.PI * 2);
  ctx.arc(x + 60 * scale, y, 25 * scale, 0, Math.PI * 2);
  ctx.arc(x + 30 * scale, y + 10 * scale, 20 * scale, 0, Math.PI * 2);
  ctx.fill();
}

function drawTree(ctx, x, y, scale, type = 'normal') {
  ctx.fillStyle = '#5D4037';
  ctx.fillRect(x - 8 * scale, y, 16 * scale, 40 * scale);
  
  if (type === 'normal') {
    ctx.fillStyle = '#388E3C';
    ctx.beginPath();
    ctx.moveTo(x, y - 60 * scale);
    ctx.lineTo(x - 35 * scale, y + 5 * scale);
    ctx.lineTo(x + 35 * scale, y + 5 * scale);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#43A047';
    ctx.beginPath();
    ctx.moveTo(x, y - 90 * scale);
    ctx.lineTo(x - 28 * scale, y - 30 * scale);
    ctx.lineTo(x + 28 * scale, y - 30 * scale);
    ctx.closePath();
    ctx.fill();
  } else if (type === 'round') {
    ctx.fillStyle = '#2E7D32';
    ctx.beginPath();
    ctx.arc(x, y - 20 * scale, 35 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#388E3C';
    ctx.beginPath();
    ctx.arc(x - 15 * scale, y - 35 * scale, 25 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + 15 * scale, y - 30 * scale, 28 * scale, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawHouse(ctx, x, y, scale, color = '#8D6E63') {
  ctx.fillStyle = color;
  ctx.fillRect(x - 50 * scale, y - 40 * scale, 100 * scale, 60 * scale);
  
  ctx.fillStyle = '#D84315';
  ctx.beginPath();
  ctx.moveTo(x - 60 * scale, y - 40 * scale);
  ctx.lineTo(x, y - 90 * scale);
  ctx.lineTo(x + 60 * scale, y - 40 * scale);
  ctx.closePath();
  ctx.fill();
  
  ctx.fillStyle = '#5D4037';
  ctx.fillRect(x - 12 * scale, y - 10 * scale, 24 * scale, 30 * scale);
  
  ctx.fillStyle = '#81D4FA';
  ctx.fillRect(x - 40 * scale, y - 25 * scale, 20 * scale, 18 * scale);
  ctx.fillRect(x + 20 * scale, y - 25 * scale, 20 * scale, 18 * scale);
  
  ctx.strokeStyle = '#5D4037';
  ctx.lineWidth = 2;
  ctx.strokeRect(x - 40 * scale, y - 25 * scale, 20 * scale, 18 * scale);
  ctx.strokeRect(x + 20 * scale, y - 25 * scale, 20 * scale, 18 * scale);
}

function generateVillage() {
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');
  
  const skyGrad = ctx.createLinearGradient(0, 0, 0, HEIGHT * 0.6);
  skyGrad.addColorStop(0, '#87CEEB');
  skyGrad.addColorStop(0.5, '#B0E0E6');
  skyGrad.addColorStop(1, '#E0F7FA');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, WIDTH, HEIGHT * 0.6);
  
  ctx.fillStyle = '#FFD54F';
  ctx.beginPath();
  ctx.arc(1600, 150, 60, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 213, 79, 0.3)';
  ctx.beginPath();
  ctx.arc(1600, 150, 90, 0, Math.PI * 2);
  ctx.fill();
  
  drawCloud(ctx, 200, 100, 1.2);
  drawCloud(ctx, 500, 80, 0.8);
  drawCloud(ctx, 900, 120, 1);
  drawCloud(ctx, 1300, 90, 0.9);
  
  ctx.fillStyle = '#9CCC65';
  ctx.beginPath();
  ctx.moveTo(0, HEIGHT * 0.55);
  ctx.quadraticCurveTo(300, HEIGHT * 0.4, 600, HEIGHT * 0.5);
  ctx.quadraticCurveTo(900, HEIGHT * 0.45, 1200, HEIGHT * 0.52);
  ctx.quadraticCurveTo(1500, HEIGHT * 0.42, 1920, HEIGHT * 0.55);
  ctx.lineTo(1920, HEIGHT * 0.6);
  ctx.lineTo(0, HEIGHT * 0.6);
  ctx.closePath();
  ctx.fill();
  
  const grassGrad = ctx.createLinearGradient(0, HEIGHT * 0.6, 0, HEIGHT);
  grassGrad.addColorStop(0, '#7CB342');
  grassGrad.addColorStop(0.3, '#8BC34A');
  grassGrad.addColorStop(1, '#689F38');
  ctx.fillStyle = grassGrad;
  ctx.fillRect(0, HEIGHT * 0.6, WIDTH, HEIGHT * 0.4);
  
  ctx.fillStyle = '#689F38';
  for (let i = 0; i < 50; i++) {
    const gx = Math.random() * WIDTH;
    const gy = HEIGHT * 0.65 + Math.random() * HEIGHT * 0.3;
    ctx.fillRect(gx, gy, 3, 12);
    ctx.fillRect(gx + 4, gy + 2, 2, 10);
  }
  
  drawTree(ctx, 150, HEIGHT * 0.68, 1.2, 'normal');
  drawTree(ctx, 280, HEIGHT * 0.65, 0.9, 'round');
  drawTree(ctx, 1600, HEIGHT * 0.66, 1.1, 'normal');
  drawTree(ctx, 1750, HEIGHT * 0.7, 0.8, 'round');
  
  drawHouse(ctx, 600, HEIGHT * 0.62, 1.3, '#A1887F');
  drawHouse(ctx, 900, HEIGHT * 0.58, 1, '#BCAAA4');
  drawHouse(ctx, 1200, HEIGHT * 0.6, 1.1, '#8D6E63');
  
  ctx.fillStyle = '#8D6E63';
  ctx.beginPath();
  ctx.moveTo(400, HEIGHT * 0.7);
  ctx.lineTo(500, HEIGHT * 0.58);
  ctx.lineTo(520, HEIGHT * 0.58);
  ctx.lineTo(420, HEIGHT * 0.7);
  ctx.closePath();
  ctx.fill();
  
  ctx.fillStyle = '#795548';
  ctx.fillRect(440, HEIGHT * 0.63, 10, 25);
  ctx.fillStyle = '#D84315';
  ctx.beginPath();
  ctx.moveTo(445, HEIGHT * 0.63);
  ctx.lineTo(430, HEIGHT * 0.52);
  ctx.lineTo(460, HEIGHT * 0.52);
  ctx.closePath();
  ctx.fill();
  
  return canvas;
}

function generateDesert() {
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');
  
  const skyGrad = ctx.createLinearGradient(0, 0, 0, HEIGHT * 0.5);
  skyGrad.addColorStop(0, '#FF8A65');
  skyGrad.addColorStop(0.3, '#FFAB91');
  skyGrad.addColorStop(1, '#FFE0B2');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, WIDTH, HEIGHT * 0.5);
  
  ctx.fillStyle = '#FFB74D';
  ctx.beginPath();
  ctx.arc(1700, 180, 70, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 183, 77, 0.25)';
  ctx.beginPath();
  ctx.arc(1700, 180, 100, 0, Math.PI * 2);
  ctx.fill();
  
  drawCloud(ctx, 300, 120, 0.6);
  drawCloud(ctx, 800, 100, 0.5);
  drawCloud(ctx, 1400, 150, 0.7);
  
  ctx.fillStyle = '#DEB887';
  ctx.beginPath();
  ctx.moveTo(0, HEIGHT * 0.5);
  ctx.quadraticCurveTo(200, HEIGHT * 0.42, 400, HEIGHT * 0.48);
  ctx.quadraticCurveTo(600, HEIGHT * 0.38, 800, HEIGHT * 0.45);
  ctx.quadraticCurveTo(1000, HEIGHT * 0.4, 1200, HEIGHT * 0.46);
  ctx.quadraticCurveTo(1400, HEIGHT * 0.35, 1600, HEIGHT * 0.43);
  ctx.quadraticCurveTo(1800, HEIGHT * 0.38, 1920, HEIGHT * 0.48);
  ctx.lineTo(1920, HEIGHT * 0.55);
  ctx.lineTo(0, HEIGHT * 0.55);
  ctx.closePath();
  ctx.fill();
  
  const sandGrad = ctx.createLinearGradient(0, HEIGHT * 0.5, 0, HEIGHT);
  sandGrad.addColorStop(0, '#D2B48C');
  sandGrad.addColorStop(0.4, '#DEB887');
  sandGrad.addColorStop(1, '#C4A574');
  ctx.fillStyle = sandGrad;
  ctx.fillRect(0, HEIGHT * 0.5, WIDTH, HEIGHT * 0.5);
  
  ctx.fillStyle = '#C4A574';
  ctx.beginPath();
  ctx.moveTo(0, HEIGHT * 0.7);
  ctx.quadraticCurveTo(150, HEIGHT * 0.62, 350, HEIGHT * 0.68);
  ctx.quadraticCurveTo(550, HEIGHT * 0.6, 750, HEIGHT * 0.66);
  ctx.quadraticCurveTo(950, HEIGHT * 0.58, 1150, HEIGHT * 0.64);
  ctx.quadraticCurveTo(1350, HEIGHT * 0.56, 1550, HEIGHT * 0.62);
  ctx.quadraticCurveTo(1750, HEIGHT * 0.54, 1920, HEIGHT * 0.6);
  ctx.lineTo(1920, HEIGHT);
  ctx.lineTo(0, HEIGHT);
  ctx.closePath();
  ctx.fill();
  
  ctx.fillStyle = '#558B2F';
  function drawCactus(x, y, scale) {
    ctx.fillRect(x - 10 * scale, y - 80 * scale, 20 * scale, 80 * scale);
    ctx.fillRect(x - 30 * scale, y - 50 * scale, 15 * scale, 40 * scale);
    ctx.fillRect(x - 30 * scale, y - 70 * scale, 20 * scale, 15 * scale);
    ctx.fillRect(x + 15 * scale, y - 60 * scale, 15 * scale, 35 * scale);
    ctx.fillRect(x + 10 * scale, y - 80 * scale, 20 * scale, 15 * scale);
    
    ctx.strokeStyle = '#33691E';
    ctx.lineWidth = 1;
    for (let i = 0; i < 8; i++) {
      const sy = y - 10 * scale - i * 10 * scale;
      ctx.beginPath();
      ctx.moveTo(x - 10 * scale, sy);
      ctx.lineTo(x - 14 * scale, sy - 3);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + 10 * scale, sy);
      ctx.lineTo(x + 14 * scale, sy - 3);
      ctx.stroke();
    }
  }
  
  drawCactus(200, HEIGHT * 0.72, 1.2);
  drawCactus(500, HEIGHT * 0.68, 0.8);
  drawCactus(1400, HEIGHT * 0.7, 1);
  drawCactus(1700, HEIGHT * 0.75, 0.9);
  
  ctx.fillStyle = '#4FC3F7';
  ctx.beginPath();
  ctx.ellipse(1000, HEIGHT * 0.58, 120, 25, 0, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.fillStyle = '#2E7D32';
  for (let i = 0; i < 6; i++) {
    const tx = 880 + i * 45;
    const ty = HEIGHT * 0.56;
    ctx.beginPath();
    ctx.moveTo(tx, ty - 50);
    ctx.lineTo(tx - 18, ty + 5);
    ctx.lineTo(tx + 18, ty + 5);
    ctx.closePath();
    ctx.fill();
  }
  
  ctx.fillStyle = '#5D4037';
  ctx.fillRect(990, HEIGHT * 0.55, 8, 25);
  
  ctx.fillStyle = '#B8860B';
  for (let i = 0; i < 30; i++) {
    const rx = Math.random() * WIDTH;
    const ry = HEIGHT * 0.75 + Math.random() * HEIGHT * 0.2;
    ctx.beginPath();
    ctx.arc(rx, ry, 2 + Math.random() * 3, 0, Math.PI * 2);
    ctx.fill();
  }
  
  return canvas;
}

function generateForest() {
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');
  
  const skyGrad = ctx.createLinearGradient(0, 0, 0, HEIGHT * 0.4);
  skyGrad.addColorStop(0, '#1B5E20');
  skyGrad.addColorStop(0.5, '#2E7D32');
  skyGrad.addColorStop(1, '#388E3C');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, WIDTH, HEIGHT * 0.4);
  
  ctx.fillStyle = 'rgba(255, 235, 59, 0.15)';
  for (let i = 0; i < 8; i++) {
    const lx = 200 + i * 250;
    ctx.beginPath();
    ctx.moveTo(lx, 0);
    ctx.lineTo(lx - 80, HEIGHT * 0.6);
    ctx.lineTo(lx + 80, HEIGHT * 0.6);
    ctx.closePath();
    ctx.fill();
  }
  
  ctx.fillStyle = '#1B5E20';
  for (let i = 0; i < 15; i++) {
    const tx = i * 140 - 20;
    const th = 150 + Math.random() * 80;
    ctx.beginPath();
    ctx.moveTo(tx, HEIGHT * 0.45 - th);
    ctx.lineTo(tx - 50, HEIGHT * 0.45);
    ctx.lineTo(tx + 50, HEIGHT * 0.45);
    ctx.closePath();
    ctx.fill();
  }
  
  ctx.fillStyle = '#2E7D32';
  for (let i = 0; i < 12; i++) {
    const tx = i * 180 + 50;
    const th = 200 + Math.random() * 100;
    ctx.fillStyle = '#4E342E';
    ctx.fillRect(tx - 10, HEIGHT * 0.5, 20, 80);
    
    ctx.fillStyle = '#2E7D32';
    ctx.beginPath();
    ctx.moveTo(tx, HEIGHT * 0.5 - th);
    ctx.lineTo(tx - 60, HEIGHT * 0.5);
    ctx.lineTo(tx + 60, HEIGHT * 0.5);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = '#388E3C';
    ctx.beginPath();
    ctx.moveTo(tx, HEIGHT * 0.5 - th + 60);
    ctx.lineTo(tx - 45, HEIGHT * 0.5 - 30);
    ctx.lineTo(tx + 45, HEIGHT * 0.5 - 30);
    ctx.closePath();
    ctx.fill();
  }
  
  const groundGrad = ctx.createLinearGradient(0, HEIGHT * 0.5, 0, HEIGHT);
  groundGrad.addColorStop(0, '#33691E');
  groundGrad.addColorStop(0.3, '#558B2F');
  groundGrad.addColorStop(1, '#1B5E20');
  ctx.fillStyle = groundGrad;
  ctx.fillRect(0, HEIGHT * 0.5, WIDTH, HEIGHT * 0.5);
  
  ctx.fillStyle = '#6D4C41';
  ctx.beginPath();
  ctx.moveTo(WIDTH * 0.4, HEIGHT);
  ctx.quadraticCurveTo(WIDTH * 0.45, HEIGHT * 0.7, WIDTH * 0.5, HEIGHT * 0.55);
  ctx.quadraticCurveTo(WIDTH * 0.55, HEIGHT * 0.7, WIDTH * 0.6, HEIGHT);
  ctx.closePath();
  ctx.fill();
  
  ctx.fillStyle = '#8D6E63';
  ctx.beginPath();
  ctx.moveTo(WIDTH * 0.42, HEIGHT);
  ctx.quadraticCurveTo(WIDTH * 0.46, HEIGHT * 0.72, WIDTH * 0.5, HEIGHT * 0.58);
  ctx.quadraticCurveTo(WIDTH * 0.54, HEIGHT * 0.72, WIDTH * 0.58, HEIGHT);
  ctx.closePath();
  ctx.fill();
  
  function drawMushroom(x, y, scale) {
    ctx.fillStyle = '#EFEBE9';
    ctx.fillRect(x - 6 * scale, y - 15 * scale, 12 * scale, 20 * scale);
    
    ctx.fillStyle = '#D32F2F';
    ctx.beginPath();
    ctx.arc(x, y - 15 * scale, 15 * scale, Math.PI, 0);
    ctx.fill();
    
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(x - 5 * scale, y - 18 * scale, 3 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + 4 * scale, y - 22 * scale, 2 * scale, 0, Math.PI * 2);
    ctx.fill();
  }
  
  drawMushroom(200, HEIGHT * 0.8, 1.2);
  drawMushroom(350, HEIGHT * 0.85, 0.8);
  drawMushroom(1500, HEIGHT * 0.82, 1);
  drawMushroom(1700, HEIGHT * 0.88, 0.9);
  
  ctx.fillStyle = '#5D4037';
  ctx.beginPath();
  ctx.ellipse(800, HEIGHT * 0.9, 80, 15, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#795548';
  ctx.beginPath();
  ctx.ellipse(800, HEIGHT * 0.89, 70, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  
  return canvas;
}

function generateFarm() {
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');
  
  const skyGrad = ctx.createLinearGradient(0, 0, 0, HEIGHT * 0.55);
  skyGrad.addColorStop(0, '#64B5F6');
  skyGrad.addColorStop(0.5, '#90CAF9');
  skyGrad.addColorStop(1, '#BBDEFB');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, WIDTH, HEIGHT * 0.55);
  
  ctx.fillStyle = '#FFD54F';
  ctx.beginPath();
  ctx.arc(300, 150, 55, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 213, 79, 0.3)';
  ctx.beginPath();
  ctx.arc(300, 150, 85, 0, Math.PI * 2);
  ctx.fill();
  
  drawCloud(ctx, 600, 100, 1);
  drawCloud(ctx, 1000, 80, 1.1);
  drawCloud(ctx, 1400, 120, 0.9);
  drawCloud(ctx, 1700, 90, 0.8);
  
  ctx.fillStyle = '#81C784';
  ctx.beginPath();
  ctx.moveTo(0, HEIGHT * 0.5);
  ctx.quadraticCurveTo(400, HEIGHT * 0.4, 800, HEIGHT * 0.48);
  ctx.quadraticCurveTo(1200, HEIGHT * 0.42, 1600, HEIGHT * 0.5);
  ctx.quadraticCurveTo(1800, HEIGHT * 0.45, 1920, HEIGHT * 0.52);
  ctx.lineTo(1920, HEIGHT * 0.55);
  ctx.lineTo(0, HEIGHT * 0.55);
  ctx.closePath();
  ctx.fill();
  
  const wheatGrad = ctx.createLinearGradient(0, HEIGHT * 0.55, 0, HEIGHT);
  wheatGrad.addColorStop(0, '#FFB74D');
  wheatGrad.addColorStop(0.3, '#FFA726');
  wheatGrad.addColorStop(1, '#F57C00');
  ctx.fillStyle = wheatGrad;
  ctx.fillRect(0, HEIGHT * 0.55, WIDTH, HEIGHT * 0.45);
  
  ctx.strokeStyle = '#E65100';
  ctx.lineWidth = 2;
  for (let row = 0; row < 12; row++) {
    const y = HEIGHT * 0.58 + row * 35;
    for (let i = 0; i < 60; i++) {
      const x = i * 35 + (row % 2) * 17;
      ctx.beginPath();
      ctx.moveTo(x, y + 30);
      ctx.lineTo(x, y);
      ctx.stroke();
      
      ctx.fillStyle = '#FFE082';
      ctx.beginPath();
      ctx.ellipse(x, y - 5, 5, 12, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  ctx.fillStyle = '#795548';
  ctx.fillRect(100, HEIGHT * 0.55, 12, 200);
  ctx.fillRect(60, HEIGHT * 0.6, 12, 150);
  ctx.fillRect(140, HEIGHT * 0.62, 12, 130);
  
  ctx.fillStyle = '#FFCC80';
  ctx.fillRect(55, HEIGHT * 0.6, 100, 80);
  
  ctx.fillStyle = '#D84315';
  ctx.fillRect(50, HEIGHT * 0.55, 110, 15);
  
  ctx.fillStyle = '#5D4037';
  ctx.beginPath();
  ctx.arc(106, HEIGHT * 0.52, 20, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.fillStyle = '#FFCCBC';
  ctx.beginPath();
  ctx.arc(106, HEIGHT * 0.52, 15, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.fillStyle = '#212121';
  ctx.beginPath();
  ctx.arc(101, HEIGHT * 0.5, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(111, HEIGHT * 0.5, 2, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.strokeStyle = '#212121';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(106, HEIGHT * 0.55, 5, 0, Math.PI);
  ctx.stroke();
  
  ctx.fillStyle = '#FFD54F';
  ctx.fillRect(90, HEIGHT * 0.4, 30, 25);
  ctx.fillStyle = '#FF6F00';
  ctx.fillRect(90, HEIGHT * 0.35, 30, 10);
  
  drawHouse(ctx, 1500, HEIGHT * 0.52, 1.5, '#D7CCC8');
  
  ctx.fillStyle = '#8D6E63';
  ctx.fillRect(1430, HEIGHT * 0.48, 25, 10);
  ctx.fillRect(1570, HEIGHT * 0.48, 25, 10);
  
  ctx.fillStyle = '#5D4037';
  ctx.fillRect(1440, HEIGHT * 0.42, 8, 70);
  ctx.fillRect(1575, HEIGHT * 0.42, 8, 70);
  
  ctx.fillStyle = '#D84315';
  ctx.beginPath();
  ctx.moveTo(1420, HEIGHT * 0.42);
  ctx.lineTo(1490, HEIGHT * 0.32);
  ctx.lineTo(1600, HEIGHT * 0.42);
  ctx.closePath();
  ctx.fill();
  
  ctx.fillStyle = '#8D6E63';
  ctx.fillRect(1720, HEIGHT * 0.6, 120, 80);
  ctx.fillStyle = '#5D4037';
  ctx.fillRect(1700, HEIGHT * 0.55, 160, 20);
  
  ctx.fillStyle = '#FFF8E1';
  for (let i = 0; i < 4; i++) {
    ctx.fillRect(1730 + i * 25, HEIGHT * 0.62, 20, 55);
  }
  
  return canvas;
}

function generateMine() {
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');
  
  const rockGrad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  rockGrad.addColorStop(0, '#37474F');
  rockGrad.addColorStop(0.3, '#455A64');
  rockGrad.addColorStop(0.6, '#546E7A');
  rockGrad.addColorStop(1, '#37474F');
  ctx.fillStyle = rockGrad;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  
  ctx.fillStyle = '#263238';
  for (let i = 0; i < 50; i++) {
    const rx = Math.random() * WIDTH;
    const ry = Math.random() * HEIGHT;
    const rw = 30 + Math.random() * 80;
    const rh = 20 + Math.random() * 50;
    ctx.beginPath();
    ctx.ellipse(rx, ry, rw, rh, Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  
  ctx.fillStyle = '#607D8B';
  for (let i = 0; i < 40; i++) {
    const rx = Math.random() * WIDTH;
    const ry = Math.random() * HEIGHT;
    const rw = 10 + Math.random() * 40;
    const rh = 8 + Math.random() * 25;
    ctx.beginPath();
    ctx.ellipse(rx, ry, rw, rh, Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  
  ctx.fillStyle = '#FFD700';
  for (let i = 0; i < 15; i++) {
    const gx = Math.random() * WIDTH;
    const gy = Math.random() * HEIGHT;
    ctx.beginPath();
    ctx.arc(gx, gy, 3 + Math.random() * 5, 0, Math.PI * 2);
    ctx.fill();
  }
  
  ctx.fillStyle = '#00BCD4';
  for (let i = 0; i < 8; i++) {
    const gx = Math.random() * WIDTH;
    const gy = Math.random() * HEIGHT;
    ctx.beginPath();
    ctx.arc(gx, gy, 2 + Math.random() * 4, 0, Math.PI * 2);
    ctx.fill();
  }
  
  ctx.fillStyle = '#1A1A1A';
  ctx.beginPath();
  ctx.moveTo(WIDTH * 0.35, HEIGHT);
  ctx.lineTo(WIDTH * 0.3, HEIGHT * 0.45);
  ctx.quadraticCurveTo(WIDTH * 0.5, HEIGHT * 0.25, WIDTH * 0.7, HEIGHT * 0.45);
  ctx.lineTo(WIDTH * 0.65, HEIGHT);
  ctx.closePath();
  ctx.fill();
  
  const caveGrad = ctx.createRadialGradient(
    WIDTH * 0.5, HEIGHT * 0.6, 50,
    WIDTH * 0.5, HEIGHT * 0.6, 400
  );
  caveGrad.addColorStop(0, 'rgba(0, 0, 0, 0.95)');
  caveGrad.addColorStop(0.5, 'rgba(20, 20, 20, 0.9)');
  caveGrad.addColorStop(1, 'rgba(50, 50, 50, 0.7)');
  ctx.fillStyle = caveGrad;
  ctx.beginPath();
  ctx.moveTo(WIDTH * 0.35, HEIGHT);
  ctx.lineTo(WIDTH * 0.3, HEIGHT * 0.45);
  ctx.quadraticCurveTo(WIDTH * 0.5, HEIGHT * 0.25, WIDTH * 0.7, HEIGHT * 0.45);
  ctx.lineTo(WIDTH * 0.65, HEIGHT);
  ctx.closePath();
  ctx.fill();
  
  function drawTorch(x, y, scale) {
    ctx.fillStyle = '#5D4037';
    ctx.fillRect(x - 5 * scale, y, 10 * scale, 60 * scale);
    
    ctx.fillStyle = '#8D6E63';
    ctx.fillRect(x - 8 * scale, y - 5 * scale, 16 * scale, 15 * scale);
    
    ctx.fillStyle = '#FF6D00';
    ctx.beginPath();
    ctx.moveTo(x, y - 45 * scale);
    ctx.quadraticCurveTo(x - 18 * scale, y - 20 * scale, x - 12 * scale, y - 5 * scale);
    ctx.quadraticCurveTo(x, y - 15 * scale, x + 12 * scale, y - 5 * scale);
    ctx.quadraticCurveTo(x + 18 * scale, y - 20 * scale, x, y - 45 * scale);
    ctx.fill();
    
    ctx.fillStyle = '#FFAB00';
    ctx.beginPath();
    ctx.moveTo(x, y - 35 * scale);
    ctx.quadraticCurveTo(x - 10 * scale, y - 18 * scale, x - 6 * scale, y - 8 * scale);
    ctx.quadraticCurveTo(x, y - 12 * scale, x + 6 * scale, y - 8 * scale);
    ctx.quadraticCurveTo(x + 10 * scale, y - 18 * scale, x, y - 35 * scale);
    ctx.fill();
    
    ctx.fillStyle = '#FFEB3B';
    ctx.beginPath();
    ctx.moveTo(x, y - 25 * scale);
    ctx.quadraticCurveTo(x - 5 * scale, y - 12 * scale, x - 3 * scale, y - 6 * scale);
    ctx.quadraticCurveTo(x, y - 8 * scale, x + 3 * scale, y - 6 * scale);
    ctx.quadraticCurveTo(x + 5 * scale, y - 12 * scale, x, y - 25 * scale);
    ctx.fill();
    
    const glowGrad = ctx.createRadialGradient(x, y - 15 * scale, 10, x, y - 15 * scale, 150 * scale);
    glowGrad.addColorStop(0, 'rgba(255, 171, 0, 0.4)');
    glowGrad.addColorStop(0.5, 'rgba(255, 109, 0, 0.2)');
    glowGrad.addColorStop(1, 'rgba(255, 87, 34, 0)');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(x, y - 15 * scale, 150 * scale, 0, Math.PI * 2);
    ctx.fill();
  }
  
  drawTorch(WIDTH * 0.25, HEIGHT * 0.55, 1.3);
  drawTorch(WIDTH * 0.75, HEIGHT * 0.55, 1.3);
  drawTorch(WIDTH * 0.1, HEIGHT * 0.7, 1);
  drawTorch(WIDTH * 0.9, HEIGHT * 0.7, 1);
  
  const fireGlow = ctx.createRadialGradient(
    WIDTH * 0.5, HEIGHT * 0.5, 100,
    WIDTH * 0.5, HEIGHT * 0.5, 600
  );
  fireGlow.addColorStop(0, 'rgba(255, 109, 0, 0.15)');
  fireGlow.addColorStop(0.5, 'rgba(255, 87, 34, 0.08)');
  fireGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = fireGlow;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  
  ctx.fillStyle = '#78909C';
  ctx.beginPath();
  ctx.moveTo(0, HEIGHT * 0.85);
  ctx.lineTo(100, HEIGHT * 0.82);
  ctx.lineTo(200, HEIGHT * 0.88);
  ctx.lineTo(0, HEIGHT * 0.92);
  ctx.closePath();
  ctx.fill();
  
  ctx.beginPath();
  ctx.moveTo(WIDTH, HEIGHT * 0.82);
  ctx.lineTo(WIDTH - 120, HEIGHT * 0.78);
  ctx.lineTo(WIDTH - 200, HEIGHT * 0.86);
  ctx.lineTo(WIDTH, HEIGHT * 0.9);
  ctx.closePath();
  ctx.fill();
  
  return canvas;
}

const maps = [
  { name: 'bg-village.png', generator: generateVillage },
  { name: 'bg-desert.png', generator: generateDesert },
  { name: 'bg-forest.png', generator: generateForest },
  { name: 'bg-farm.png', generator: generateFarm },
  { name: 'bg-mine.png', generator: generateMine },
];

console.log('开始生成地图背景图片...\n');

maps.forEach(({ name, generator }) => {
  const canvas = generator();
  const buffer = canvas.toBuffer('image/png');
  const filePath = path.join(OUTPUT_DIR, name);
  fs.writeFileSync(filePath, buffer);
  const stats = fs.statSync(filePath);
  const sizeKB = (stats.size / 1024).toFixed(2);
  console.log(`✓ ${name} - ${sizeKB} KB`);
});

console.log('\n所有图片生成完成！');
console.log(`输出目录: ${OUTPUT_DIR}`);
