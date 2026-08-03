import { ASSET_CATEGORIES, getDynamicItems, getCategoryPageCount } from './assetManifest.js';

const ASSET_BASE = './assets/';

class AssetManagerClass {
  constructor() {
    this.cache = new Map();
    this.loading = new Map();
    this.failedPaths = new Set();
    this.tilesetItemsCache = new Map();
  }

  getAssetUrl(relativePath) {
    return ASSET_BASE + relativePath;
  }

  getAssetUrls(relativePath) {
    return [this.getAssetUrl(relativePath)];
  }

  loadImage(path) {
    if (this.cache.has(path)) {
      const cached = this.cache.get(path);
      if (cached instanceof HTMLImageElement) {
        return Promise.resolve(cached);
      }
      return Promise.resolve(null);
    }
    if (this.failedPaths.has(path)) {
      return Promise.resolve(null);
    }
    if (this.loading.has(path)) {
      return this.loading.get(path);
    }

    const promise = new Promise((resolve) => {
      const candidates = this.getAssetUrls(path);
      let index = 0;
      const tryNext = () => {
        if (index >= candidates.length) {
          this.failedPaths.add(path);
          this.loading.delete(path);
          resolve(null);
          return;
        }
        const img = new Image();
        img.crossOrigin = 'anonymous';
        const onLoaded = () => {
          this.cache.set(path, img);
          this.loading.delete(path);
          resolve(img);
        };
        img.onload = onLoaded;
        img.onerror = tryNext;
        img.src = candidates[index++];
        // 防御：浏览器在图片已缓存（Cache-Control命中）时，部分版本会同步完成解码但不再触发 onload，
        // 导致 Promise 永远 pending。用 img.complete 在 src 赋值后兜底。
        if (img.complete && img.naturalWidth > 0) {
          onLoaded();
        }
      };
      tryNext();
    });

    this.loading.set(path, promise);
    return promise;
  }

  async loadMultiple(paths) {
    return Promise.all(paths.map(p => this.loadImage(p)));
  }

  isLoaded(path) {
    return this.cache.has(path);
  }

  getImage(path) {
    return this.cache.get(path) || null;
  }

  clearCache() {
    this.cache.clear();
    this.loading.clear();
    this.failedPaths.clear();
    this.tilesetItemsCache.clear();
  }

  getCategoryList() {
    return Object.keys(ASSET_CATEGORIES).map(key => ({
      key,
      name: ASSET_CATEGORIES[key].name,
      icon: ASSET_CATEGORIES[key].icon,
      description: ASSET_CATEGORIES[key].description,
      count: ASSET_CATEGORIES[key].dynamic
        ? ASSET_CATEGORIES[key].count
        : (ASSET_CATEGORIES[key].items ? ASSET_CATEGORIES[key].items.length : 0),
      dynamic: !!ASSET_CATEGORIES[key].dynamic
    }));
  }

  async getCategoryItems(categoryKey, page = 0, pageSize = 24) {
    const category = ASSET_CATEGORIES[categoryKey];
    if (!category) return { items: [], totalPages: 0 };

    if (category.dynamic) {
      if (category.tileset || category.tilesets) {
        const allItems = await this.getTilesetItems(category);
        const totalPages = Math.max(1, Math.ceil(allItems.length / pageSize));
        const start = page * pageSize;
        const items = allItems.slice(start, start + pageSize);
        return { items, totalPages };
      }
      const totalPages = getCategoryPageCount(category, pageSize);
      const items = getDynamicItems(category, page, pageSize);
      return { items, totalPages };
    }

    const allItems = category.items || [];
    const totalPages = Math.max(1, Math.ceil(allItems.length / pageSize));
    const start = page * pageSize;
    const items = allItems.slice(start, start + pageSize);
    return { items, totalPages };
  }

  async getCategoryInfo(categoryKey) {
    const category = ASSET_CATEGORIES[categoryKey];
    if (!category) return null;

    let count = category.count || 0;
    if (category.dynamic && (category.tileset || category.tilesets)) {
      const items = await this.getTilesetItems(category);
      count = items.length;
    } else if (!category.dynamic && category.items) {
      count = category.items.length;
    }

    return {
      key: categoryKey,
      name: category.name,
      icon: category.icon,
      description: category.description,
      dynamic: !!category.dynamic,
      count: count,
    };
  }

  async getAllCategoryItems(categoryKey) {
    const category = ASSET_CATEGORIES[categoryKey];
    if (!category) return [];

    if (category.dynamic) {
      if (category.tileset || category.tilesets) {
        return await this.getTilesetItems(category);
      }
      return getDynamicItems(category, 0, category.count);
    }

    return category.items || [];
  }

  async getTilesetItems(category) {
    const cacheKey = category.name;
    if (this.tilesetItemsCache.has(cacheKey)) {
      return this.tilesetItemsCache.get(cacheKey);
    }

    const items = [];

    if (category.tileset) {
      const ts = category.tileset;
      const img = await this.loadImage(ts.path);
      if (img) {
        const objects = this.findObjectsInImage(img);
        objects.forEach((obj, i) => {
          items.push({
            name: `${category.name}_${i}`,
            path: ts.path,
            type: 'object',
            srcX: obj.x,
            srcY: obj.y,
            srcW: obj.width,
            srcH: obj.height,
          });
        });
      }
    } else if (category.tilesets) {
      let globalIndex = 0;
      for (const ts of category.tilesets) {
        const img = await this.loadImage(ts.path);
        if (img) {
          const objects = this.findObjectsInImage(img);
          objects.forEach((obj) => {
            items.push({
              name: `${category.name}_${globalIndex}`,
              path: ts.path,
              type: 'object',
              srcX: obj.x,
              srcY: obj.y,
              srcW: obj.width,
              srcH: obj.height,
            });
            globalIndex++;
          });
        }
      }
    }

    this.tilesetItemsCache.set(cacheKey, items);
    return items;
  }

  // 加载静远七人某角色的全部 5 动作 × 4 帧 = 20 张图片
  // 返回 { personality:[img,img,img,img], run:[...], etiquette:[...], martial:[...], signature:[...] }
  async loadJingyuanCharacterFrames(characterDir) {
    const actions = ['personality', 'run', 'etiquette', 'martial', 'signature'];
    const result = {};
    for (const action of actions) {
      const frames = [];
      for (let i = 0; i < 4; i++) {
        const frameNum = String(i).padStart(2, '0');
        const path = `characters/jingyuan/${characterDir}/frames/${action}/${frameNum}.png`;
        const img = await this.loadImage(path);
        frames.push(img);
      }
      result[action] = frames;
    }
    return result;
  }

  findObjectsInImage(img) {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    const width = canvas.width;
    const height = canvas.height;
    const visited = new Uint8Array(width * height);
    const objects = [];

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        if (pixels[idx + 3] > 10 && !visited[y * width + x]) {
          let minX = x, minY = y, maxX = x, maxY = y;
          const queue = [{ x, y }];
          visited[y * width + x] = 1;

          while (queue.length > 0) {
            const { x: cx, y: cy } = queue.shift();
            minX = Math.min(minX, cx);
            minY = Math.min(minY, cy);
            maxX = Math.max(maxX, cx);
            maxY = Math.max(maxY, cy);

            const neighbors = [
              { x: cx - 1, y: cy },
              { x: cx + 1, y: cy },
              { x: cx, y: cy - 1 },
              { x: cx, y: cy + 1 },
              { x: cx - 1, y: cy - 1 },
              { x: cx + 1, y: cy - 1 },
              { x: cx - 1, y: cy + 1 },
              { x: cx + 1, y: cy + 1 },
            ];

            for (const n of neighbors) {
              if (n.x >= 0 && n.x < width && n.y >= 0 && n.y < height) {
                const nIdx = (n.y * width + n.x) * 4;
                if (pixels[nIdx + 3] > 10 && !visited[n.y * width + n.x]) {
                  visited[n.y * width + n.x] = 1;
                  queue.push(n);
                }
              }
            }
          }

          const objWidth = maxX - minX + 1;
          const objHeight = maxY - minY + 1;

          if (objWidth >= 8 && objHeight >= 8) {
            objects.push({
              x: minX,
              y: minY,
              width: objWidth,
              height: objHeight,
            });
          }
        }
      }
    }

    return objects.sort((a, b) => {
      if (a.y !== b.y) return a.y - b.y;
      return a.x - b.x;
    });
  }
}

export const AssetManager = new AssetManagerClass();
