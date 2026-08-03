// 主角（Mask Dude / 忍者蛙 / 粉衣 / 虚拟人）角色定义（本地兜底）
// Phase 0: 1:1 从 gameMapRenderer.js MAIN_CHARACTERS 搬家

export const MAIN_CHARACTER_IDS = ['mask-dude', 'ninja-frog', 'pink-man', 'virtual-guy'];

export const MAIN_CHARACTER_DEFS = {
  'mask-dude': {
    id: 'mask-dude',
    name: 'Mask Dude',
    category: 'main',
    group: 'Mask Dude',
    frameRoot: 'ui/icons/IconsPropsMonsters/Main Characters/Mask Dude',
    baseStats: { maxHp: 100, martial: 0, attack: 4, defense: 4, speed: 1 },
    defaultItems: [],
    actions: {},
  },
  'ninja-frog': {
    id: 'ninja-frog',
    name: '忍者蛙',
    category: 'main',
    group: 'Ninja Frog',
    frameRoot: 'ui/icons/IconsPropsMonsters/Main Characters/Ninja Frog',
    baseStats: { maxHp: 100, martial: 0, attack: 4, defense: 4, speed: 1 },
    defaultItems: [],
    actions: {},
  },
  'pink-man': {
    id: 'pink-man',
    name: '粉衣人',
    category: 'main',
    group: 'Pink Man',
    frameRoot: 'ui/icons/IconsPropsMonsters/Main Characters/Pink Man',
    baseStats: { maxHp: 100, martial: 0, attack: 4, defense: 4, speed: 1 },
    defaultItems: [],
    actions: {},
  },
  'virtual-guy': {
    id: 'virtual-guy',
    name: '虚拟人',
    category: 'main',
    group: 'Virtual Guy',
    frameRoot: 'ui/icons/IconsPropsMonsters/Main Characters/Virtual Guy',
    baseStats: { maxHp: 100, martial: 0, attack: 4, defense: 4, speed: 1 },
    defaultItems: [],
    actions: {},
  },
};

export default MAIN_CHARACTER_DEFS;
