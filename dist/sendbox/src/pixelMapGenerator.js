import { TILE_TYPE, TILE_COLORS, MAP_W, MAP_H } from './gameConfig.js';

const ERROR_DIFFUSION_KERNELS = {
  FloydSteinberg: [
    [[1, 0], 7/16],
    [[-1, 1], 3/16],
    [[0, 1], 5/16],
    [[1, 1], 1/16]
  ],
  JarvisJudiceNinke: [
    [[1, 0], 7/48], [[2, 0], 5/48],
    [[-2, 1], 3/48], [[-1, 1], 5/48], [[0, 1], 7/48], [[1, 1], 5/48], [[2, 1], 3/48],
    [[-2, 2], 1/48], [[-1, 2], 3/48], [[0, 2], 5/48], [[1, 2], 3/48], [[2, 2], 1/48]
  ],
  Stucki: [
    [[1, 0], 8/42], [[2, 0], 4/42],
    [[-2, 1], 2/42], [[-1, 1], 4/42], [[0, 1], 8/42], [[1, 1], 4/42], [[2, 1], 2/42],
    [[-2, 2], 1/42], [[-1, 2], 2/42], [[0, 2], 4/42], [[1, 2], 2/42], [[2, 2], 1/42]
  ],
  Atkinson: [
    [[1, 0], 1/8], [[2, 0], 1/8],
    [[-1, 1], 1/8], [[0, 1], 1/8], [[1, 1], 1/8],
    [[0, 2], 1/8]
  ],
  Burkes: [
    [[1, 0], 8/32], [[2, 0], 4/32],
    [[-2, 1], 2/32], [[-1, 1], 4/32], [[0, 1], 8/32], [[1, 1], 4/32], [[2, 1], 2/32]
  ],
  Sierra3: [
    [[1, 0], 5/32], [[2, 0], 3/32],
    [[-2, 1], 2/32], [[-1, 1], 4/32], [[0, 1], 5/32], [[1, 1], 4/32], [[2, 1], 2/32]
  ],
  Sierra2: [
    [[1, 0], 4/16], [[2, 0], 3/16],
    [[-1, 1], 2/16], [[0, 1], 3/16], [[1, 1], 2/16],
    [[-1, 2], 1/16], [[0, 2], 1/16]
  ],
  SierraLite: [
    [[1, 0], 2/4],
    [[-1, 1], 1/4],
    [[0, 1], 1/4]
  ]
};

const BAYER_MATRICES = {
  Bayer2x2: [[0, 2], [3, 1]],
  Bayer4x4: [
    [0, 8, 2, 10],
    [12, 4, 14, 6],
    [3, 11, 1, 9],
    [15, 7, 13, 5]
  ],
  Bayer8x8: [
    [0, 32, 8, 40, 2, 34, 10, 42],
    [48, 16, 56, 24, 50, 18, 58, 26],
    [12, 44, 4, 36, 14, 46, 6, 38],
    [60, 28, 52, 20, 62, 30, 54, 22],
    [3, 35, 11, 43, 1, 33, 9, 41],
    [51, 19, 59, 27, 49, 17, 57, 25],
    [15, 47, 7, 39, 13, 45, 5, 37],
    [63, 31, 55, 23, 61, 29, 53, 21]
  ],
  Ordered3x3: [[0, 7, 3], [6, 5, 2], [4, 1, 8]]
};

export const ALGORITHMS = {
  '无抖动': { type: 'none' },
  'Floyd Steinberg': { type: 'error', kernel: ERROR_DIFFUSION_KERNELS.FloydSteinberg },
  'Jarvis Judice Ninke': { type: 'error', kernel: ERROR_DIFFUSION_KERNELS.JarvisJudiceNinke },
  'Stucki': { type: 'error', kernel: ERROR_DIFFUSION_KERNELS.Stucki },
  'Burkes': { type: 'error', kernel: ERROR_DIFFUSION_KERNELS.Burkes },
  'Atkinson': { type: 'error', kernel: ERROR_DIFFUSION_KERNELS.Atkinson },
  'Sierra3': { type: 'error', kernel: ERROR_DIFFUSION_KERNELS.Sierra3 },
  'Sierra2': { type: 'error', kernel: ERROR_DIFFUSION_KERNELS.Sierra2 },
  'SierraLite': { type: 'error', kernel: ERROR_DIFFUSION_KERNELS.SierraLite },
  'Bayer2x2': { type: 'ordered', matrix: BAYER_MATRICES.Bayer2x2 },
  'Bayer4x4': { type: 'ordered', matrix: BAYER_MATRICES.Bayer4x4 },
  'Bayer8x8': { type: 'ordered', matrix: BAYER_MATRICES.Bayer8x8 },
  'Ordered3x3': { type: 'ordered', matrix: BAYER_MATRICES.Ordered3x3 }
};

export const PRESET_FILTERS = {
  '正常': { brightness: 100, contrast: 100, saturation: 100, sharpness: 0, hue: 0, temperature: 0 },
  '鲜艳': { brightness: 100, contrast: 120, saturation: 130, sharpness: 20, hue: 0, temperature: 0 },
  '复古': { brightness: 105, contrast: 90, saturation: 70, sharpness: 0, hue: 0, temperature: 30 },
  '冷色调': { brightness: 100, contrast: 105, saturation: 90, sharpness: 10, hue: 0, temperature: -20 },
  '暖色调': { brightness: 100, contrast: 105, saturation: 110, sharpness: 10, hue: 0, temperature: 25 },
  '黑白': { brightness: 100, contrast: 110, saturation: 0, sharpness: 30, hue: 0, temperature: 0 }
};

function rgbToLab(r, g, b) {
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

function labDistance(lab1, lab2) {
  const dl = lab1.l - lab2.l;
  const da = lab1.a - lab2.a;
  const db = lab1.b - lab2.b;
  return dl * dl + da * da + db * db;
}

function adjustBrightness(imageData, brightness) {
  if (brightness === 100) return;
  const data = imageData.data;
  const factor = brightness / 100;
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.min(255, Math.max(0, data[i] * factor));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] * factor));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] * factor));
  }
}

function adjustContrast(imageData, contrast) {
  if (contrast === 100) return;
  const data = imageData.data;
  const factor = contrast / 100;
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.min(255, Math.max(0, 128 + (data[i] - 128) * factor));
    data[i + 1] = Math.min(255, Math.max(0, 128 + (data[i + 1] - 128) * factor));
    data[i + 2] = Math.min(255, Math.max(0, 128 + (data[i + 2] - 128) * factor));
  }
}

function adjustSaturation(imageData, saturation) {
  if (saturation === 100) return;
  const data = imageData.data;
  const factor = saturation / 100;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const gray = 0.2989 * r + 0.5870 * g + 0.1140 * b;
    data[i] = Math.min(255, Math.max(0, gray + (r - gray) * factor));
    data[i + 1] = Math.min(255, Math.max(0, gray + (g - gray) * factor));
    data[i + 2] = Math.min(255, Math.max(0, gray + (b - gray) * factor));
  }
}

function adjustSharpness(imageData, sharpness) {
  if (sharpness === 0) return;
  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;
  const originalData = new Uint8ClampedArray(data);
  const strength = sharpness / 100;
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      for (let c = 0; c < 3; c++) {
        const center = originalData[idx + c];
        const sum = 
          -originalData[((y - 1) * width + (x - 1)) * 4 + c] -
          originalData[((y - 1) * width + x) * 4 + c] -
          originalData[((y - 1) * width + (x + 1)) * 4 + c] -
          originalData[(y * width + (x - 1)) * 4 + c] +
          8 * center -
          originalData[(y * width + (x + 1)) * 4 + c] -
          originalData[((y + 1) * width + (x - 1)) * 4 + c] -
          originalData[((y + 1) * width + x) * 4 + c] -
          originalData[((y + 1) * width + (x + 1)) * 4 + c];
        data[idx + c] = Math.min(255, Math.max(0, center + sum * strength));
      }
    }
  }
}

function adjustHue(imageData, hue) {
  if (hue === 0) return;
  const data = imageData.data;
  const angle = hue * Math.PI / 180;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i] / 255;
    const g = data[i + 1] / 255;
    const b = data[i + 2] / 255;
    
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
    const a00 = cos + (1 - cos) / 3;
    const a01 = -(1 / 3) * (1 - cos) - sin / Math.sqrt(3);
    const a02 = -(1 / 3) * (1 - cos) + sin / Math.sqrt(3);
    const a10 = -(1 / 3) * (1 - cos) + sin / Math.sqrt(3);
    const a11 = cos + (1 - cos) / 3;
    const a12 = -(1 / 3) * (1 - cos) - sin / Math.sqrt(3);
    const a20 = -(1 / 3) * (1 - cos) - sin / Math.sqrt(3);
    const a21 = -(1 / 3) * (1 - cos) + sin / Math.sqrt(3);
    const a22 = cos + (1 - cos) / 3;
    
    const nr = a00 * r + a01 * g + a02 * b;
    const ng = a10 * r + a11 * g + a12 * b;
    const nb = a20 * r + a21 * g + a22 * b;
    
    data[i] = Math.min(255, Math.max(0, nr * 255));
    data[i + 1] = Math.min(255, Math.max(0, ng * 255));
    data[i + 2] = Math.min(255, Math.max(0, nb * 255));
  }
}

function adjustTemperature(imageData, temperature) {
  if (temperature === 0) return;
  const data = imageData.data;
  const factor = temperature / 100;
  
  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];
    
    if (factor > 0) {
      r = Math.min(255, r + factor * 30);
      g = Math.min(255, g + factor * 15);
      b = Math.max(0, b - factor * 10);
    } else {
      r = Math.max(0, r + factor * 10);
      g = Math.max(0, g + factor * 5);
      b = Math.min(255, b - factor * 30);
    }
    
    data[i] = Math.round(r);
    data[i + 1] = Math.round(g);
    data[i + 2] = Math.round(b);
  }
}

function applyImageFilters(imageData, filters) {
  adjustBrightness(imageData, filters.brightness);
  adjustContrast(imageData, filters.contrast);
  adjustSaturation(imageData, filters.saturation);
  adjustHue(imageData, filters.hue);
  adjustTemperature(imageData, filters.temperature);
  adjustSharpness(imageData, filters.sharpness);
}

function getTileAverageColor(tileType) {
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

function findClosestTile(r, g, b, lockedTiles = null) {
  let minDist = Infinity;
  let bestTile = TILE_TYPE.GRASS;
  
  const targetLab = rgbToLab(r, g, b);
  const tileList = lockedTiles && lockedTiles.length > 0 
    ? lockedTiles 
    : Object.values(TILE_TYPE);
  
  for (const tileType of tileList) {
    if (!TILE_COLORS[tileType]) continue;
    
    for (const color of TILE_COLORS[tileType]) {
      const colorLab = rgbToLab(color.r, color.g, color.b);
      const dist = labDistance(targetLab, colorLab);
      if (dist < minDist) {
        minDist = dist;
        bestTile = tileType;
      }
    }
  }
  
  return bestTile;
}

function applyErrorDither(imageData, width, height, ditherStrength, kernel) {
  const data = imageData.data;
  const errorR = [];
  const errorG = [];
  const errorB = [];
  
  for (let y = 0; y < height; y++) {
    errorR[y] = new Array(width).fill(0);
    errorG[y] = new Array(width).fill(0);
    errorB[y] = new Array(width).fill(0);
  }
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      let r = data[i] + errorR[y][x];
      let g = data[i + 1] + errorG[y][x];
      let b = data[i + 2] + errorB[y][x];
      
      r = Math.max(0, Math.min(255, r));
      g = Math.max(0, Math.min(255, g));
      b = Math.max(0, Math.min(255, b));
      
      const tileType = findClosestTile(r, g, b);
      const targetColor = getTileAverageColor(tileType);
      
      data[i] = targetColor.r;
      data[i + 1] = targetColor.g;
      data[i + 2] = targetColor.b;
      
      if (ditherStrength > 0 && kernel) {
        const errR = (r - targetColor.r) * ditherStrength;
        const errG = (g - targetColor.g) * ditherStrength;
        const errB = (b - targetColor.b) * ditherStrength;
        
        for (const entry of kernel) {
          const [pos, factor] = entry;
          const nx = x + pos[0];
          const ny = y + pos[1];
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            errorR[ny][nx] += errR * factor;
            errorG[ny][nx] += errG * factor;
            errorB[ny][nx] += errB * factor;
          }
        }
      }
    }
  }
}

function applyOrderedDither(imageData, width, height, ditherStrength, matrix) {
  const data = imageData.data;
  const n = matrix.length;
  const bayerFactor = 255 / (n * n);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const threshold = (matrix[y % n][x % n] - n * n / 2) * bayerFactor * ditherStrength * 0.2;
      
      let r = data[i] + threshold;
      let g = data[i + 1] + threshold;
      let b = data[i + 2] + threshold;
      
      r = Math.max(0, Math.min(255, r));
      g = Math.max(0, Math.min(255, g));
      b = Math.max(0, Math.min(255, b));
      
      const tileType = findClosestTile(r, g, b);
      const targetColor = getTileAverageColor(tileType);
      
      data[i] = targetColor.r;
      data[i + 1] = targetColor.g;
      data[i + 2] = targetColor.b;
    }
  }
}

export class PixelMapGenerator {
  constructor() {
    this.algorithm = 'Floyd Steinberg';
    this.ditherStrength = 100;
    this.ditherScale = 1;
    this.lockedTiles = [];
    this.colorReplacements = new Map();
    this.filters = {
      brightness: 100,
      contrast: 100,
      saturation: 100,
      sharpness: 0,
      hue: 0,
      temperature: 0
    };
    this.onProgress = null;
  }

  setAlgorithm(name) {
    if (ALGORITHMS[name]) {
      this.algorithm = name;
    }
  }

  setDitherStrength(value) {
    this.ditherStrength = Math.max(0, Math.min(100, value));
  }

  setDitherScale(value) {
    this.ditherScale = Math.max(1, Math.min(4, value));
  }

  setFilters(newFilters) {
    this.filters = { ...this.filters, ...newFilters };
  }

  setLockedTiles(tiles) {
    this.lockedTiles = tiles;
  }

  addColorReplacement(sourceColor, targetTile) {
    const key = `${sourceColor.r},${sourceColor.g},${sourceColor.b}`;
    this.colorReplacements.set(key, targetTile);
  }

  removeColorReplacement(sourceColor) {
    const key = `${sourceColor.r},${sourceColor.g},${sourceColor.b}`;
    this.colorReplacements.delete(key);
  }

  clearColorReplacements() {
    this.colorReplacements.clear();
  }

  generateMap(image) {
    const canvas = document.createElement('canvas');
    const targetWidth = Math.max(1, Math.floor(MAP_W / this.ditherScale));
    const targetHeight = Math.max(1, Math.floor(MAP_H / this.ditherScale));
    
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(image, 0, 0, targetWidth, targetHeight);
    
    let imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
    
    applyImageFilters(imageData, this.filters);
    
    const algo = ALGORITHMS[this.algorithm];
    const strength = this.ditherStrength / 100;
    
    if (algo.type === 'error' && algo.kernel) {
      applyErrorDither(imageData, targetWidth, targetHeight, strength, algo.kernel);
    } else if (algo.type === 'ordered' && algo.matrix) {
      applyOrderedDither(imageData, targetWidth, targetHeight, strength, algo.matrix);
    }
    
    const data = imageData.data;
    const newMap = [];
    
    for (let y = 0; y < MAP_H; y++) {
      newMap[y] = [];
      for (let x = 0; x < MAP_W; x++) {
        const dx = Math.floor(x / this.ditherScale);
        const dy = Math.floor(y / this.ditherScale);
        
        if (dx < targetWidth && dy < targetHeight) {
          const i = (dy * targetWidth + dx) * 4;
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];
          
          if (a < 128) {
            newMap[y][x] = TILE_TYPE.GRASS;
            continue;
          }
          
          const colorKey = `${r},${g},${b}`;
          if (this.colorReplacements.has(colorKey)) {
            newMap[y][x] = this.colorReplacements.get(colorKey);
          } else {
            newMap[y][x] = findClosestTile(r, g, b, this.lockedTiles);
          }
        } else {
          newMap[y][x] = TILE_TYPE.GRASS;
        }
      }
    }
    
    for (let x = 0; x < MAP_W; x++) {
      newMap[0][x] = TILE_TYPE.STONE;
      newMap[MAP_H - 1][x] = TILE_TYPE.STONE;
    }
    for (let y = 0; y < MAP_H; y++) {
      newMap[y][0] = TILE_TYPE.STONE;
      newMap[y][MAP_W - 1] = TILE_TYPE.STONE;
    }
    
    for (let y = 1; y < MAP_H - 1; y++) {
      for (let x = 1; x < MAP_W - 1; x++) {
        if (newMap[y][x] === TILE_TYPE.WOOD || newMap[y][x] === TILE_TYPE.BRIDGE) {
          let hasWater = false;
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              if (newMap[y + dy][x + dx] === TILE_TYPE.WATER) {
                hasWater = true;
                break;
              }
            }
            if (hasWater) break;
          }
          if (hasWater) {
            newMap[y][x] = TILE_TYPE.BRIDGE;
          }
        }
      }
    }
    
    return newMap;
  }

  generatePreview(image, maxWidth = 300, maxHeight = 300) {
    const canvas = document.createElement('canvas');
    const scale = Math.min(maxWidth / image.width, maxHeight / image.height);
    const width = Math.round(image.width * scale);
    const height = Math.round(image.height * scale);
    
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(image, 0, 0, width, height);
    
    let imageData = ctx.getImageData(0, 0, width, height);
    applyImageFilters(imageData, this.filters);
    
    const algo = ALGORITHMS[this.algorithm];
    const strength = this.ditherStrength / 100;
    
    if (algo.type === 'error' && algo.kernel) {
      applyErrorDither(imageData, width, height, strength, algo.kernel);
    } else if (algo.type === 'ordered' && algo.matrix) {
      applyOrderedDither(imageData, width, height, strength, algo.matrix);
    }
    
    ctx.putImageData(imageData, 0, 0);
    return canvas;
  }
}