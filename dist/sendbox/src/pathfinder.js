import { MAP_W, MAP_H, TILE } from './gameConfig.js';

export class Pathfinder {
  constructor(mapManager) {
    this.mapManager = mapManager;
  }

  findPath(startX, startY, endX, endY) {
    const startTileX = Math.floor(startX / TILE);
    const startTileY = Math.floor(startY / TILE);
    const endTileX = Math.floor(endX / TILE);
    const endTileY = Math.floor(endY / TILE);

    if (startTileX < 0 || startTileX >= MAP_W || startTileY < 0 || startTileY >= MAP_H) return [];
    if (endTileX < 0 || endTileX >= MAP_W || endTileY < 0 || endTileY >= MAP_H) return [];
    if (this.mapManager.isSolid(endTileX * TILE + TILE/2, endTileY * TILE + TILE/2)) return [];

    const openList = [];
    const closedList = [];
    const cameFrom = {};
    const gScore = {};
    const fScore = {};

    const getKey = (x, y) => `${x},${y}`;
    const heuristic = (x, y) => Math.abs(x - endTileX) + Math.abs(y - endTileY);

    openList.push({ x: startTileX, y: startTileY });
    gScore[getKey(startTileX, startTileY)] = 0;
    fScore[getKey(startTileX, startTileY)] = heuristic(startTileX, startTileY);

    const directions = [
      { dx: 0, dy: -1, cost: 1 },
      { dx: 0, dy: 1, cost: 1 },
      { dx: -1, dy: 0, cost: 1 },
      { dx: 1, dy: 0, cost: 1 },
      { dx: -1, dy: -1, cost: 1.4 },
      { dx: -1, dy: 1, cost: 1.4 },
      { dx: 1, dy: -1, cost: 1.4 },
      { dx: 1, dy: 1, cost: 1.4 },
    ];

    while (openList.length > 0) {
      openList.sort((a, b) => fScore[getKey(a.x, a.y)] - fScore[getKey(b.x, b.y)]);
      const current = openList.shift();
      const currentKey = getKey(current.x, current.y);

      if (current.x === endTileX && current.y === endTileY) {
        const path = [];
        let c = current;
        while (c) {
          path.unshift({
            x: c.x * TILE + TILE / 2,
            y: c.y * TILE + TILE / 2
          });
          c = cameFrom[getKey(c.x, c.y)];
        }
        return path;
      }

      closedList.push(currentKey);

      for (const dir of directions) {
        const nx = current.x + dir.dx;
        const ny = current.y + dir.dy;
        const neighborKey = getKey(nx, ny);

        if (nx < 0 || nx >= MAP_W || ny < 0 || ny >= MAP_H) continue;
        if (closedList.includes(neighborKey)) continue;

        const isWalkable = !this.mapManager.isSolid(nx * TILE + TILE/2, ny * TILE + TILE/2);
        if (!isWalkable) continue;

        if (dir.dx !== 0 && dir.dy !== 0) {
          const horizontalBlocked = this.mapManager.isSolid((current.x + dir.dx) * TILE + TILE/2, current.y * TILE + TILE/2);
          const verticalBlocked = this.mapManager.isSolid(current.x * TILE + TILE/2, (current.y + dir.dy) * TILE + TILE/2);
          if (horizontalBlocked || verticalBlocked) continue;
        }

        const tentativeG = gScore[currentKey] + dir.cost;

        if (!openList.some(n => n.x === nx && n.y === ny)) {
          openList.push({ x: nx, y: ny });
        } else if (tentativeG >= gScore[neighborKey]) {
          continue;
        }

        cameFrom[neighborKey] = current;
        gScore[neighborKey] = tentativeG;
        fScore[neighborKey] = tentativeG + heuristic(nx, ny);
      }
    }

    return [];
  }
}
