// 战斗属性纯函数计算器（可单测）
export function computeCombatStats(baseStats = {}, equippedItems = [], itemDefs = {}) {
  const stats = {
    maxHp: baseStats.maxHp ?? 100,
    hp:    baseStats.hp ?? (baseStats.maxHp ?? 100),
    martial: baseStats.martial ?? 0,
    attack:  baseStats.attack  ?? 0,
    defense: baseStats.defense ?? 0,
    speed:   baseStats.speed   ?? 1,
  };
  equippedItems.forEach(it => {
    if (!it?.equippedSlot) return;
    const def = itemDefs[it.defId] || {};
    stats.maxHp   += def.hpBonus      || 0;
    stats.attack  += def.attackBonus  || 0;
    stats.defense += def.defenseBonus || 0;
    stats.martial += def.martialBonus || 0;
    stats.speed   += def.speedBonus   || 0;
  });
  stats.hp = Math.min(stats.hp, stats.maxHp);
  return stats;
}
export default computeCombatStats;
