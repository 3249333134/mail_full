// 素材清单配置 - 列出所有可用的素材资源
// 所有路径相对于 src/assets 目录

// 静远七人角色清单（角色名、目录名）
const JINGYUAN_CHARACTERS = [
  { name: '周然', dir: '01-周然' },
  { name: '贺清风', dir: '02-贺清风' },
  { name: '任朝野', dir: '03-任朝野' },
  { name: '沈池懿', dir: '04-沈池懿' },
  { name: '戚凭川', dir: '05-戚凭川' },
  { name: '江淮安', dir: '06-江淮安' },
  { name: '唐挽初', dir: '07-唐挽初' },
];

// 静远七人动作清单（动作key、中文名、speed ms/帧、是否只播放一次）
const JINGYUAN_ACTIONS = [
  { key: 'personality', name: '性格', speed: 240, once: false },
  { key: 'run', name: '跑动', speed: 105, once: false },
  { key: 'etiquette', name: '礼仪', speed: 220, once: true },
  { key: 'martial', name: '武艺', speed: 110, once: true },
  { key: 'signature', name: '招牌', speed: 180, once: true },
];

// 构建静远七人素材项：7 角色 × 5 动作 × 4 帧 = 140 项
function buildJingyuanItems() {
  const items = [];
  for (const char of JINGYUAN_CHARACTERS) {
    for (const act of JINGYUAN_ACTIONS) {
      for (let i = 0; i < 4; i++) {
        const frameNum = String(i).padStart(2, '0');
        items.push({
          name: `${char.name} - ${act.name} ${i + 1}`,
          path: `characters/jingyuan/${char.dir}/frames/${act.key}/${frameNum}.png`,
          type: 'jingyuan',
          group: char.name,
          character: char.name,
          characterDir: char.dir,
          action: act.key,
          actionName: act.name,
          frameIndex: i,
          actionSpeed: act.speed,
          actionOnce: act.once,
        });
      }
    }
  }
  return items;
}

export const ASSET_CATEGORIES = {
  characters: {
    name: '主角',
    icon: '🦸',
    description: '可控制角色，含各种动作动画',
    items: [
      { name: 'Mask Dude - Idle', path: 'ui/icons/IconsPropsMonsters/Main Characters/Mask Dude/Idle (32x32).png', type: 'character', group: 'Mask Dude', spriteDir: 'ui/icons/IconsPropsMonsters/Main Characters/Mask Dude', frameSize: 32 },
      { name: 'Mask Dude - Run', path: 'ui/icons/IconsPropsMonsters/Main Characters/Mask Dude/Run (32x32).png', type: 'character', group: 'Mask Dude', spriteDir: 'ui/icons/IconsPropsMonsters/Main Characters/Mask Dude', frameSize: 32 },
      { name: 'Mask Dude - Jump', path: 'ui/icons/IconsPropsMonsters/Main Characters/Mask Dude/Jump (32x32).png', type: 'character', group: 'Mask Dude', spriteDir: 'ui/icons/IconsPropsMonsters/Main Characters/Mask Dude', frameSize: 32 },
      { name: 'Mask Dude - Fall', path: 'ui/icons/IconsPropsMonsters/Main Characters/Mask Dude/Fall (32x32).png', type: 'character', group: 'Mask Dude', spriteDir: 'ui/icons/IconsPropsMonsters/Main Characters/Mask Dude', frameSize: 32 },
      { name: 'Mask Dude - Hit', path: 'ui/icons/IconsPropsMonsters/Main Characters/Mask Dude/Hit (32x32).png', type: 'character', group: 'Mask Dude', spriteDir: 'ui/icons/IconsPropsMonsters/Main Characters/Mask Dude', frameSize: 32 },
      { name: 'Mask Dude - Double Jump', path: 'ui/icons/IconsPropsMonsters/Main Characters/Mask Dude/Double Jump (32x32).png', type: 'character', group: 'Mask Dude', spriteDir: 'ui/icons/IconsPropsMonsters/Main Characters/Mask Dude', frameSize: 32 },
      { name: 'Mask Dude - Wall Jump', path: 'ui/icons/IconsPropsMonsters/Main Characters/Mask Dude/Wall Jump (32x32).png', type: 'character', group: 'Mask Dude', spriteDir: 'ui/icons/IconsPropsMonsters/Main Characters/Mask Dude', frameSize: 32 },
      { name: 'Ninja Frog - Idle', path: 'ui/icons/IconsPropsMonsters/Main Characters/Ninja Frog/Idle (32x32).png', type: 'character', group: 'Ninja Frog', spriteDir: 'ui/icons/IconsPropsMonsters/Main Characters/Ninja Frog', frameSize: 32 },
      { name: 'Ninja Frog - Run', path: 'ui/icons/IconsPropsMonsters/Main Characters/Ninja Frog/Run (32x32).png', type: 'character', group: 'Ninja Frog', spriteDir: 'ui/icons/IconsPropsMonsters/Main Characters/Ninja Frog', frameSize: 32 },
      { name: 'Ninja Frog - Jump', path: 'ui/icons/IconsPropsMonsters/Main Characters/Ninja Frog/Jump (32x32).png', type: 'character', group: 'Ninja Frog', spriteDir: 'ui/icons/IconsPropsMonsters/Main Characters/Ninja Frog', frameSize: 32 },
      { name: 'Ninja Frog - Fall', path: 'ui/icons/IconsPropsMonsters/Main Characters/Ninja Frog/Fall (32x32).png', type: 'character', group: 'Ninja Frog', spriteDir: 'ui/icons/IconsPropsMonsters/Main Characters/Ninja Frog', frameSize: 32 },
      { name: 'Ninja Frog - Hit', path: 'ui/icons/IconsPropsMonsters/Main Characters/Ninja Frog/Hit (32x32).png', type: 'character', group: 'Ninja Frog', spriteDir: 'ui/icons/IconsPropsMonsters/Main Characters/Ninja Frog', frameSize: 32 },
      { name: 'Ninja Frog - Double Jump', path: 'ui/icons/IconsPropsMonsters/Main Characters/Ninja Frog/Double Jump (32x32).png', type: 'character', group: 'Ninja Frog', spriteDir: 'ui/icons/IconsPropsMonsters/Main Characters/Ninja Frog', frameSize: 32 },
      { name: 'Ninja Frog - Wall Jump', path: 'ui/icons/IconsPropsMonsters/Main Characters/Ninja Frog/Wall Jump (32x32).png', type: 'character', group: 'Ninja Frog', spriteDir: 'ui/icons/IconsPropsMonsters/Main Characters/Ninja Frog', frameSize: 32 },
      { name: 'Pink Man - Idle', path: 'ui/icons/IconsPropsMonsters/Main Characters/Pink Man/Idle (32x32).png', type: 'character', group: 'Pink Man', spriteDir: 'ui/icons/IconsPropsMonsters/Main Characters/Pink Man', frameSize: 32 },
      { name: 'Pink Man - Run', path: 'ui/icons/IconsPropsMonsters/Main Characters/Pink Man/Run (32x32).png', type: 'character', group: 'Pink Man', spriteDir: 'ui/icons/IconsPropsMonsters/Main Characters/Pink Man', frameSize: 32 },
      { name: 'Pink Man - Jump', path: 'ui/icons/IconsPropsMonsters/Main Characters/Pink Man/Jump (32x32).png', type: 'character', group: 'Pink Man', spriteDir: 'ui/icons/IconsPropsMonsters/Main Characters/Pink Man', frameSize: 32 },
      { name: 'Pink Man - Fall', path: 'ui/icons/IconsPropsMonsters/Main Characters/Pink Man/Fall (32x32).png', type: 'character', group: 'Pink Man', spriteDir: 'ui/icons/IconsPropsMonsters/Main Characters/Pink Man', frameSize: 32 },
      { name: 'Pink Man - Hit', path: 'ui/icons/IconsPropsMonsters/Main Characters/Pink Man/Hit (32x32).png', type: 'character', group: 'Pink Man', spriteDir: 'ui/icons/IconsPropsMonsters/Main Characters/Pink Man', frameSize: 32 },
      { name: 'Pink Man - Double Jump', path: 'ui/icons/IconsPropsMonsters/Main Characters/Pink Man/Double Jump (32x32).png', type: 'character', group: 'Pink Man', spriteDir: 'ui/icons/IconsPropsMonsters/Main Characters/Pink Man', frameSize: 32 },
      { name: 'Pink Man - Wall Jump', path: 'ui/icons/IconsPropsMonsters/Main Characters/Pink Man/Wall Jump (32x32).png', type: 'character', group: 'Pink Man', spriteDir: 'ui/icons/IconsPropsMonsters/Main Characters/Pink Man', frameSize: 32 },
      { name: 'Virtual Guy - Idle', path: 'ui/icons/IconsPropsMonsters/Main Characters/Virtual Guy/Idle (32x32).png', type: 'character', group: 'Virtual Guy', spriteDir: 'ui/icons/IconsPropsMonsters/Main Characters/Virtual Guy', frameSize: 32 },
      { name: 'Virtual Guy - Run', path: 'ui/icons/IconsPropsMonsters/Main Characters/Virtual Guy/Run (32x32).png', type: 'character', group: 'Virtual Guy', spriteDir: 'ui/icons/IconsPropsMonsters/Main Characters/Virtual Guy', frameSize: 32 },
      { name: 'Virtual Guy - Jump', path: 'ui/icons/IconsPropsMonsters/Main Characters/Virtual Guy/Jump (32x32).png', type: 'character', group: 'Virtual Guy', spriteDir: 'ui/icons/IconsPropsMonsters/Main Characters/Virtual Guy', frameSize: 32 },
      { name: 'Virtual Guy - Fall', path: 'ui/icons/IconsPropsMonsters/Main Characters/Virtual Guy/Fall (32x32).png', type: 'character', group: 'Virtual Guy', spriteDir: 'ui/icons/IconsPropsMonsters/Main Characters/Virtual Guy', frameSize: 32 },
      { name: 'Virtual Guy - Hit', path: 'ui/icons/IconsPropsMonsters/Main Characters/Virtual Guy/Hit (32x32).png', type: 'character', group: 'Virtual Guy', spriteDir: 'ui/icons/IconsPropsMonsters/Main Characters/Virtual Guy', frameSize: 32 },
      { name: 'Virtual Guy - Double Jump', path: 'ui/icons/IconsPropsMonsters/Main Characters/Virtual Guy/Double Jump (32x32).png', type: 'character', group: 'Virtual Guy', spriteDir: 'ui/icons/IconsPropsMonsters/Main Characters/Virtual Guy', frameSize: 32 },
      { name: 'Virtual Guy - Wall Jump', path: 'ui/icons/IconsPropsMonsters/Main Characters/Virtual Guy/Wall Jump (32x32).png', type: 'character', group: 'Virtual Guy', spriteDir: 'ui/icons/IconsPropsMonsters/Main Characters/Virtual Guy', frameSize: 32 },
    ]
  },
  jingyuan: {
    name: '静远七人',
    icon: '🎭',
    description: '静远七人 Q 版像素角色，每人 5 类动作 × 4 帧 = 20 帧',
    items: buildJingyuanItems(),
  },
  monsters: {
    name: '怪物',
    icon: '👾',
    description: '怪物角色，可作为NPC或敌人',
    items: [
      { name: 'AngryPig - Idle', path: 'characters/monster/monster/AngryPig/Idle (36x30).png', type: 'monster', group: 'AngryPig', spriteDir: 'characters/monster/monster/AngryPig', frameSize: 36, frameHeight: 30 },
      { name: 'AngryPig - Run', path: 'characters/monster/monster/AngryPig/Run (36x30).png', type: 'monster', group: 'AngryPig', spriteDir: 'characters/monster/monster/AngryPig', frameSize: 36, frameHeight: 30 },
      { name: 'AngryPig - Walk', path: 'characters/monster/monster/AngryPig/Walk (36x30).png', type: 'monster', group: 'AngryPig', spriteDir: 'characters/monster/monster/AngryPig', frameSize: 36, frameHeight: 30 },
      { name: 'AngryPig - Hit 1', path: 'characters/monster/monster/AngryPig/Hit 1 (36x30).png', type: 'monster', group: 'AngryPig', spriteDir: 'characters/monster/monster/AngryPig', frameSize: 36, frameHeight: 30 },
      { name: 'AngryPig - Hit 2', path: 'characters/monster/monster/AngryPig/Hit 2 (36x30).png', type: 'monster', group: 'AngryPig', spriteDir: 'characters/monster/monster/AngryPig', frameSize: 36, frameHeight: 30 },
      { name: 'Bat - Idle', path: 'characters/monster/monster/Bat/Idle (46x30).png', type: 'monster', group: 'Bat', spriteDir: 'characters/monster/monster/Bat', frameSize: 46, frameHeight: 30 },
      { name: 'Bat - Flying', path: 'characters/monster/monster/Bat/Flying (46x30).png', type: 'monster', group: 'Bat', spriteDir: 'characters/monster/monster/Bat', frameSize: 46, frameHeight: 30 },
      { name: 'Bat - Hit', path: 'characters/monster/monster/Bat/Hit (46x30).png', type: 'monster', group: 'Bat', spriteDir: 'characters/monster/monster/Bat', frameSize: 46, frameHeight: 30 },
      { name: 'Bat - Ceiling In', path: 'characters/monster/monster/Bat/Ceiling In (46x30).png', type: 'monster', group: 'Bat', spriteDir: 'characters/monster/monster/Bat', frameSize: 46, frameHeight: 30 },
      { name: 'Bat - Ceiling Out', path: 'characters/monster/monster/Bat/Ceiling Out (46x30).png', type: 'monster', group: 'Bat', spriteDir: 'characters/monster/monster/Bat', frameSize: 46, frameHeight: 30 },
      { name: 'Bee - Idle', path: 'characters/monster/monster/Bee/Idle (36x34).png', type: 'monster', group: 'Bee', spriteDir: 'characters/monster/monster/Bee', frameSize: 36, frameHeight: 34 },
      { name: 'Bee - Attack', path: 'characters/monster/monster/Bee/Attack (36x34).png', type: 'monster', group: 'Bee', spriteDir: 'characters/monster/monster/Bee', frameSize: 36, frameHeight: 34 },
      { name: 'Bee - Hit', path: 'characters/monster/monster/Bee/Hit (36x34).png', type: 'monster', group: 'Bee', spriteDir: 'characters/monster/monster/Bee', frameSize: 36, frameHeight: 34 },
      { name: 'BlueBird - Flying', path: 'characters/monster/monster/BlueBird/Flying (32x32).png', type: 'monster', group: 'BlueBird', spriteDir: 'characters/monster/monster/BlueBird', frameSize: 32, frameHeight: 32 },
      { name: 'BlueBird - Hit', path: 'characters/monster/monster/BlueBird/Hit (32x32).png', type: 'monster', group: 'BlueBird', spriteDir: 'characters/monster/monster/BlueBird', frameSize: 32, frameHeight: 32 },
      { name: 'Bunny - Idle', path: 'characters/monster/monster/Bunny/Idle (34x44).png', type: 'monster', group: 'Bunny', spriteDir: 'characters/monster/monster/Bunny', frameSize: 34, frameHeight: 44 },
      { name: 'Bunny - Run', path: 'characters/monster/monster/Bunny/Run (34x44).png', type: 'monster', group: 'Bunny', spriteDir: 'characters/monster/monster/Bunny', frameSize: 34, frameHeight: 44 },
      { name: 'Bunny - Hit', path: 'characters/monster/monster/Bunny/Hit (34x44).png', type: 'monster', group: 'Bunny', spriteDir: 'characters/monster/monster/Bunny', frameSize: 34, frameHeight: 44 },
      { name: 'Chameleon - Idle', path: 'characters/monster/monster/Chameleon/Idle (84x38).png', type: 'monster', group: 'Chameleon', spriteDir: 'characters/monster/monster/Chameleon', frameSize: 84, frameHeight: 38 },
      { name: 'Chameleon - Run', path: 'characters/monster/monster/Chameleon/Run (84x38).png', type: 'monster', group: 'Chameleon', spriteDir: 'characters/monster/monster/Chameleon', frameSize: 84, frameHeight: 38 },
      { name: 'Chameleon - Attack', path: 'characters/monster/monster/Chameleon/Attack (84x38).png', type: 'monster', group: 'Chameleon', spriteDir: 'characters/monster/monster/Chameleon', frameSize: 84, frameHeight: 38 },
      { name: 'Chameleon - Hit', path: 'characters/monster/monster/Chameleon/Hit (84x38).png', type: 'monster', group: 'Chameleon', spriteDir: 'characters/monster/monster/Chameleon', frameSize: 84, frameHeight: 38 },
      { name: 'Chicken - Idle', path: 'characters/monster/monster/Chicken/Idle (32x34).png', type: 'monster', group: 'Chicken', spriteDir: 'characters/monster/monster/Chicken', frameSize: 32, frameHeight: 34 },
      { name: 'Chicken - Run', path: 'characters/monster/monster/Chicken/Run (32x34).png', type: 'monster', group: 'Chicken', spriteDir: 'characters/monster/monster/Chicken', frameSize: 32, frameHeight: 34 },
      { name: 'Chicken - Hit', path: 'characters/monster/monster/Chicken/Hit (32x34).png', type: 'monster', group: 'Chicken', spriteDir: 'characters/monster/monster/Chicken', frameSize: 32, frameHeight: 34 },
      { name: 'Duck - Idle', path: 'characters/monster/monster/Duck/Idle (36x36).png', type: 'monster', group: 'Duck', spriteDir: 'characters/monster/monster/Duck', frameSize: 36, frameHeight: 36 },
      { name: 'Duck - Run', path: 'characters/monster/monster/Duck/Jump (36x36).png', type: 'monster', group: 'Duck', spriteDir: 'characters/monster/monster/Duck', frameSize: 36, frameHeight: 36 },
      { name: 'Duck - Fall', path: 'characters/monster/monster/Duck/Fall (36x36).png', type: 'monster', group: 'Duck', spriteDir: 'characters/monster/monster/Duck', frameSize: 36, frameHeight: 36 },
      { name: 'Duck - Hit', path: 'characters/monster/monster/Duck/Hit (36x36).png', type: 'monster', group: 'Duck', spriteDir: 'characters/monster/monster/Duck', frameSize: 36, frameHeight: 36 },
      { name: 'Duck - Jump Anticipation', path: 'characters/monster/monster/Duck/Jump Anticipation (36x36).png', type: 'monster', group: 'Duck', spriteDir: 'characters/monster/monster/Duck', frameSize: 36, frameHeight: 36 },
      { name: 'FatBird - Idle', path: 'characters/monster/monster/FatBird/Idle (40x48).png', type: 'monster', group: 'FatBird', spriteDir: 'characters/monster/monster/FatBird', frameSize: 40, frameHeight: 48 },
      { name: 'FatBird - Ground', path: 'characters/monster/monster/FatBird/Ground (40x48).png', type: 'monster', group: 'FatBird', spriteDir: 'characters/monster/monster/FatBird', frameSize: 40, frameHeight: 48 },
      { name: 'FatBird - Fall', path: 'characters/monster/monster/FatBird/Fall (40x48).png', type: 'monster', group: 'FatBird', spriteDir: 'characters/monster/monster/FatBird', frameSize: 40, frameHeight: 48 },
      { name: 'FatBird - Hit', path: 'characters/monster/monster/FatBird/Hit (40x48).png', type: 'monster', group: 'FatBird', spriteDir: 'characters/monster/monster/FatBird', frameSize: 40, frameHeight: 48 },
      { name: 'Ghost - Idle', path: 'characters/monster/monster/Ghost/Idle (44x30).png', type: 'monster', group: 'Ghost', spriteDir: 'characters/monster/monster/Ghost', frameSize: 44, frameHeight: 30 },
      { name: 'Ghost - Hit', path: 'characters/monster/monster/Ghost/Hit (44x30).png', type: 'monster', group: 'Ghost', spriteDir: 'characters/monster/monster/Ghost', frameSize: 44, frameHeight: 30 },
      { name: 'Ghost - Appear', path: 'characters/monster/monster/Ghost/Appear (44x30).png', type: 'monster', group: 'Ghost', spriteDir: 'characters/monster/monster/Ghost', frameSize: 44, frameHeight: 30 },
      { name: 'Ghost - Desappear', path: 'characters/monster/monster/Ghost/Desappear (44x30).png', type: 'monster', group: 'Ghost', spriteDir: 'characters/monster/monster/Ghost', frameSize: 44, frameHeight: 30 },
      { name: 'Mushroom - Idle', path: 'characters/monster/monster/Mushroom/Idle (32x32).png', type: 'monster', group: 'Mushroom', spriteDir: 'characters/monster/monster/Mushroom', frameSize: 32, frameHeight: 32 },
      { name: 'Mushroom - Run', path: 'characters/monster/monster/Mushroom/Run (32x32).png', type: 'monster', group: 'Mushroom', spriteDir: 'characters/monster/monster/Mushroom', frameSize: 32, frameHeight: 32 },
      { name: 'Mushroom - Hit', path: 'characters/monster/monster/Mushroom/Hit.png', type: 'monster', group: 'Mushroom', spriteDir: 'characters/monster/monster/Mushroom', frameSize: 32, frameHeight: 32 },
      { name: 'Plant - Idle', path: 'characters/monster/monster/Plant/Idle (44x42).png', type: 'monster', group: 'Plant', spriteDir: 'characters/monster/monster/Plant', frameSize: 44, frameHeight: 42 },
      { name: 'Plant - Attack', path: 'characters/monster/monster/Plant/Attack (44x42).png', type: 'monster', group: 'Plant', spriteDir: 'characters/monster/monster/Plant', frameSize: 44, frameHeight: 42 },
      { name: 'Plant - Hit', path: 'characters/monster/monster/Plant/Hit (44x42).png', type: 'monster', group: 'Plant', spriteDir: 'characters/monster/monster/Plant', frameSize: 44, frameHeight: 42 },
      { name: 'Radish - Idle 1', path: 'characters/monster/monster/Radish/Idle 1 (30x38).png', type: 'monster', group: 'Radish', spriteDir: 'characters/monster/monster/Radish', frameSize: 30, frameHeight: 38 },
      { name: 'Radish - Idle 2', path: 'characters/monster/monster/Radish/Idle 2 (30x38).png', type: 'monster', group: 'Radish', spriteDir: 'characters/monster/monster/Radish', frameSize: 30, frameHeight: 38 },
      { name: 'Radish - Run', path: 'characters/monster/monster/Radish/Run (30x38).png', type: 'monster', group: 'Radish', spriteDir: 'characters/monster/monster/Radish', frameSize: 30, frameHeight: 38 },
      { name: 'Radish - Hit', path: 'characters/monster/monster/Radish/Hit (30x38).png', type: 'monster', group: 'Radish', spriteDir: 'characters/monster/monster/Radish', frameSize: 30, frameHeight: 38 },
      { name: 'Rino - Idle', path: 'characters/monster/monster/Rino/Idle (52x34).png', type: 'monster', group: 'Rino', spriteDir: 'characters/monster/monster/Rino', frameSize: 52, frameHeight: 34 },
      { name: 'Rino - Run', path: 'characters/monster/monster/Rino/Run (52x34).png', type: 'monster', group: 'Rino', spriteDir: 'characters/monster/monster/Rino', frameSize: 52, frameHeight: 34 },
      { name: 'Rino - Hit', path: 'characters/monster/monster/Rino/Hit (52x34).png', type: 'monster', group: 'Rino', spriteDir: 'characters/monster/monster/Rino', frameSize: 52, frameHeight: 34 },
      { name: 'Rino - Hit Wall', path: 'characters/monster/monster/Rino/Hit Wall (52x34).png', type: 'monster', group: 'Rino', spriteDir: 'characters/monster/monster/Rino', frameSize: 52, frameHeight: 34 },
      { name: 'Rocks - Rock1 Idle', path: 'characters/monster/monster/Rocks/Rock1_Idle (38x34).png', type: 'monster', group: 'Rocks', spriteDir: 'characters/monster/monster/Rocks', frameSize: 38, frameHeight: 34 },
      { name: 'Rocks - Rock1 Run', path: 'characters/monster/monster/Rocks/Rock1_Run (38x34).png', type: 'monster', group: 'Rocks', spriteDir: 'characters/monster/monster/Rocks', frameSize: 38, frameHeight: 34 },
      { name: 'Rocks - Rock1 Hit', path: 'characters/monster/monster/Rocks/Rock1_Hit.png', type: 'monster', group: 'Rocks', spriteDir: 'characters/monster/monster/Rocks', frameSize: 38, frameHeight: 34 },
      { name: 'Rocks - Rock2 Idle', path: 'characters/monster/monster/Rocks/Rock2_Idle (32x28).png', type: 'monster', group: 'Rocks', spriteDir: 'characters/monster/monster/Rocks', frameSize: 32, frameHeight: 28 },
      { name: 'Rocks - Rock2 Run', path: 'characters/monster/monster/Rocks/Rock2_Run (32x28).png', type: 'monster', group: 'Rocks', spriteDir: 'characters/monster/monster/Rocks', frameSize: 32, frameHeight: 28 },
      { name: 'Rocks - Rock2 Hit', path: 'characters/monster/monster/Rocks/Rock2_Hit (32x28).png', type: 'monster', group: 'Rocks', spriteDir: 'characters/monster/monster/Rocks', frameSize: 32, frameHeight: 28 },
      { name: 'Rocks - Rock3 Idle', path: 'characters/monster/monster/Rocks/Rock3_Idle (22x18).png', type: 'monster', group: 'Rocks', spriteDir: 'characters/monster/monster/Rocks', frameSize: 22, frameHeight: 18 },
      { name: 'Rocks - Rock3 Run', path: 'characters/monster/monster/Rocks/Rock3_Run (22x18).png', type: 'monster', group: 'Rocks', spriteDir: 'characters/monster/monster/Rocks', frameSize: 22, frameHeight: 18 },
      { name: 'Rocks - Rock3 Hit', path: 'characters/monster/monster/Rocks/Rock3_Hit (22x18).png', type: 'monster', group: 'Rocks', spriteDir: 'characters/monster/monster/Rocks', frameSize: 22, frameHeight: 18 },
      { name: 'Skull - Idle 1', path: 'characters/monster/monster/Skull/Idle 1 (52x54).png', type: 'monster', group: 'Skull', spriteDir: 'characters/monster/monster/Skull', frameSize: 52, frameHeight: 54 },
      { name: 'Skull - Idle 2', path: 'characters/monster/monster/Skull/Idle 2 (52x54).png', type: 'monster', group: 'Skull', spriteDir: 'characters/monster/monster/Skull', frameSize: 52, frameHeight: 54 },
      { name: 'Skull - Hit', path: 'characters/monster/monster/Skull/Hit (52x54).png', type: 'monster', group: 'Skull', spriteDir: 'characters/monster/monster/Skull', frameSize: 52, frameHeight: 54 },
      { name: 'Skull - Hit Wall 1', path: 'characters/monster/monster/Skull/Hit Wall 1 (52x54).png', type: 'monster', group: 'Skull', spriteDir: 'characters/monster/monster/Skull', frameSize: 52, frameHeight: 54 },
      { name: 'Skull - Hit Wall 2', path: 'characters/monster/monster/Skull/Hit Wall 2 (52x54).png', type: 'monster', group: 'Skull', spriteDir: 'characters/monster/monster/Skull', frameSize: 52, frameHeight: 54 },
      { name: 'Slime - Idle-Run', path: 'characters/monster/monster/Slime/Idle-Run (44x30).png', type: 'monster', group: 'Slime', spriteDir: 'characters/monster/monster/Slime', frameSize: 44, frameHeight: 30 },
      { name: 'Slime - Hit', path: 'characters/monster/monster/Slime/Hit (44x30).png', type: 'monster', group: 'Slime', spriteDir: 'characters/monster/monster/Slime', frameSize: 44, frameHeight: 30 },
      { name: 'Snail - Idle', path: 'characters/monster/monster/Snail/Idle (38x24).png', type: 'monster', group: 'Snail', spriteDir: 'characters/monster/monster/Snail', frameSize: 38, frameHeight: 24 },
      { name: 'Snail - Walk', path: 'characters/monster/monster/Snail/Walk (38x24).png', type: 'monster', group: 'Snail', spriteDir: 'characters/monster/monster/Snail', frameSize: 38, frameHeight: 24 },
      { name: 'Snail - Hit', path: 'characters/monster/monster/Snail/Hit (38x24).png', type: 'monster', group: 'Snail', spriteDir: 'characters/monster/monster/Snail', frameSize: 38, frameHeight: 24 },
      { name: 'Snail - Shell Idle', path: 'characters/monster/monster/Snail/Shell Idle (38x24).png', type: 'monster', group: 'Snail', spriteDir: 'characters/monster/monster/Snail', frameSize: 38, frameHeight: 24 },
      { name: 'Snail - Shell Top Hit', path: 'characters/monster/monster/Snail/Shell Top Hit (38x24).png', type: 'monster', group: 'Snail', spriteDir: 'characters/monster/monster/Snail', frameSize: 38, frameHeight: 24 },
      { name: 'Snail - Shell Wall Hit', path: 'characters/monster/monster/Snail/Shell Wall Hit (38x24).png', type: 'monster', group: 'Snail', spriteDir: 'characters/monster/monster/Snail', frameSize: 38, frameHeight: 24 },
      { name: 'Trunk - Idle', path: 'characters/monster/monster/Trunk/Idle (64x32).png', type: 'monster', group: 'Trunk', spriteDir: 'characters/monster/monster/Trunk', frameSize: 64, frameHeight: 32 },
      { name: 'Trunk - Run', path: 'characters/monster/monster/Trunk/Run (64x32).png', type: 'monster', group: 'Trunk', spriteDir: 'characters/monster/monster/Trunk', frameSize: 64, frameHeight: 32 },
      { name: 'Trunk - Attack', path: 'characters/monster/monster/Trunk/Attack (64x32).png', type: 'monster', group: 'Trunk', spriteDir: 'characters/monster/monster/Trunk', frameSize: 64, frameHeight: 32 },
      { name: 'Trunk - Hit', path: 'characters/monster/monster/Trunk/Hit (64x32).png', type: 'monster', group: 'Trunk', spriteDir: 'characters/monster/monster/Trunk', frameSize: 64, frameHeight: 32 },
      { name: 'Turtle - Idle 1', path: 'characters/monster/monster/Turtle/Idle 1 (44x26).png', type: 'monster', group: 'Turtle', spriteDir: 'characters/monster/monster/Turtle', frameSize: 44, frameHeight: 26 },
      { name: 'Turtle - Idle 2', path: 'characters/monster/monster/Turtle/Idle 2 (44x26).png', type: 'monster', group: 'Turtle', spriteDir: 'characters/monster/monster/Turtle', frameSize: 44, frameHeight: 26 },
      { name: 'Turtle - Hit', path: 'characters/monster/monster/Turtle/Hit (44x26).png', type: 'monster', group: 'Turtle', spriteDir: 'characters/monster/monster/Turtle', frameSize: 44, frameHeight: 26 },
      { name: 'Turtle - Spikes in', path: 'characters/monster/monster/Turtle/Spikes in (44x26).png', type: 'monster', group: 'Turtle', spriteDir: 'characters/monster/monster/Turtle', frameSize: 44, frameHeight: 26 },
      { name: 'Turtle - Spikes out', path: 'characters/monster/monster/Turtle/Spikes out (44x26).png', type: 'monster', group: 'Turtle', spriteDir: 'characters/monster/monster/Turtle', frameSize: 44, frameHeight: 26 },
    ]
  },
  fruits: {
    name: '水果物品',
    icon: '🍎',
    description: '水果物品，可放置到地图作为装饰或收集品',
    items: [
      { name: 'Apple - Idle', path: 'ui/icons/IconsPropsMonsters/Items/Fruits/Apple.png', type: 'item', group: 'Apple', frameSize: 32, frameHeight: 32 },
      { name: 'Apple - Bounce', path: 'ui/icons/IconsPropsMonsters/Items/Fruits/Apple.png', type: 'item', group: 'Apple', frameSize: 32, frameHeight: 32, frame: 8 },
      { name: 'Apple - Collect', path: 'ui/icons/IconsPropsMonsters/Items/Fruits/Apple.png', type: 'item', group: 'Apple', frameSize: 32, frameHeight: 32, frame: 16 },
      { name: 'Bananas - Idle', path: 'ui/icons/IconsPropsMonsters/Items/Fruits/Bananas.png', type: 'item', group: 'Bananas', frameSize: 32, frameHeight: 32 },
      { name: 'Bananas - Bounce', path: 'ui/icons/IconsPropsMonsters/Items/Fruits/Bananas.png', type: 'item', group: 'Bananas', frameSize: 32, frameHeight: 32, frame: 8 },
      { name: 'Bananas - Collect', path: 'ui/icons/IconsPropsMonsters/Items/Fruits/Bananas.png', type: 'item', group: 'Bananas', frameSize: 32, frameHeight: 32, frame: 16 },
      { name: 'Cherries - Idle', path: 'ui/icons/IconsPropsMonsters/Items/Fruits/Cherries.png', type: 'item', group: 'Cherries', frameSize: 32, frameHeight: 32 },
      { name: 'Cherries - Bounce', path: 'ui/icons/IconsPropsMonsters/Items/Fruits/Cherries.png', type: 'item', group: 'Cherries', frameSize: 32, frameHeight: 32, frame: 8 },
      { name: 'Cherries - Collect', path: 'ui/icons/IconsPropsMonsters/Items/Fruits/Cherries.png', type: 'item', group: 'Cherries', frameSize: 32, frameHeight: 32, frame: 16 },
      { name: 'Kiwi - Idle', path: 'ui/icons/IconsPropsMonsters/Items/Fruits/Kiwi.png', type: 'item', group: 'Kiwi', frameSize: 32, frameHeight: 32 },
      { name: 'Kiwi - Bounce', path: 'ui/icons/IconsPropsMonsters/Items/Fruits/Kiwi.png', type: 'item', group: 'Kiwi', frameSize: 32, frameHeight: 32, frame: 8 },
      { name: 'Kiwi - Collect', path: 'ui/icons/IconsPropsMonsters/Items/Fruits/Kiwi.png', type: 'item', group: 'Kiwi', frameSize: 32, frameHeight: 32, frame: 16 },
      { name: 'Melon - Idle', path: 'ui/icons/IconsPropsMonsters/Items/Fruits/Melon.png', type: 'item', group: 'Melon', frameSize: 32, frameHeight: 32 },
      { name: 'Melon - Bounce', path: 'ui/icons/IconsPropsMonsters/Items/Fruits/Melon.png', type: 'item', group: 'Melon', frameSize: 32, frameHeight: 32, frame: 8 },
      { name: 'Melon - Collect', path: 'ui/icons/IconsPropsMonsters/Items/Fruits/Melon.png', type: 'item', group: 'Melon', frameSize: 32, frameHeight: 32, frame: 16 },
      { name: 'Orange - Idle', path: 'ui/icons/IconsPropsMonsters/Items/Fruits/Orange.png', type: 'item', group: 'Orange', frameSize: 32, frameHeight: 32 },
      { name: 'Orange - Bounce', path: 'ui/icons/IconsPropsMonsters/Items/Fruits/Orange.png', type: 'item', group: 'Orange', frameSize: 32, frameHeight: 32, frame: 8 },
      { name: 'Orange - Collect', path: 'ui/icons/IconsPropsMonsters/Items/Fruits/Orange.png', type: 'item', group: 'Orange', frameSize: 32, frameHeight: 32, frame: 16 },
      { name: 'Pineapple - Idle', path: 'ui/icons/IconsPropsMonsters/Items/Fruits/Pineapple.png', type: 'item', group: 'Pineapple', frameSize: 32, frameHeight: 32 },
      { name: 'Pineapple - Bounce', path: 'ui/icons/IconsPropsMonsters/Items/Fruits/Pineapple.png', type: 'item', group: 'Pineapple', frameSize: 32, frameHeight: 32, frame: 8 },
      { name: 'Pineapple - Collect', path: 'ui/icons/IconsPropsMonsters/Items/Fruits/Pineapple.png', type: 'item', group: 'Pineapple', frameSize: 32, frameHeight: 32, frame: 16 },
      { name: 'Strawberry - Idle', path: 'ui/icons/IconsPropsMonsters/Items/Fruits/Strawberry.png', type: 'item', group: 'Strawberry', frameSize: 32, frameHeight: 32 },
      { name: 'Strawberry - Bounce', path: 'ui/icons/IconsPropsMonsters/Items/Fruits/Strawberry.png', type: 'item', group: 'Strawberry', frameSize: 32, frameHeight: 32, frame: 8 },
      { name: 'Strawberry - Collect', path: 'ui/icons/IconsPropsMonsters/Items/Fruits/Strawberry.png', type: 'item', group: 'Strawberry', frameSize: 32, frameHeight: 32, frame: 16 },
      { name: 'Collected - Sparkle', path: 'ui/icons/IconsPropsMonsters/Items/Fruits/Collected.png', type: 'item', group: 'Collected', frameSize: 32, frameHeight: 32 },
      { name: 'Collected - Star', path: 'ui/icons/IconsPropsMonsters/Items/Fruits/Collected.png', type: 'item', group: 'Collected', frameSize: 32, frameHeight: 32, frame: 3 },
      { name: 'Collected - Burst', path: 'ui/icons/IconsPropsMonsters/Items/Fruits/Collected.png', type: 'item', group: 'Collected', frameSize: 32, frameHeight: 32, frame: 5 },
    ]
  },
  buttons: {
    name: 'UI按钮',
    icon: '🔘',
    description: '像素风格UI按钮图标',
    items: [
      { name: 'Achievements', path: 'ui/icons/IconsPropsMonsters/Menu/Buttons/Achievements.png', type: 'ui' },
      { name: 'Back', path: 'ui/icons/IconsPropsMonsters/Menu/Buttons/Back.png', type: 'ui' },
      { name: 'Close', path: 'ui/icons/IconsPropsMonsters/Menu/Buttons/Close.png', type: 'ui' },
      { name: 'Leaderboard', path: 'ui/icons/IconsPropsMonsters/Menu/Buttons/Leaderboard.png', type: 'ui' },
      { name: 'Levels', path: 'ui/icons/IconsPropsMonsters/Menu/Buttons/Levels.png', type: 'ui' },
      { name: 'Next', path: 'ui/icons/IconsPropsMonsters/Menu/Buttons/Next.png', type: 'ui' },
      { name: 'Play', path: 'ui/icons/IconsPropsMonsters/Menu/Buttons/Play.png', type: 'ui' },
      { name: 'Previous', path: 'ui/icons/IconsPropsMonsters/Menu/Buttons/Previous.png', type: 'ui' },
      { name: 'Restart', path: 'ui/icons/IconsPropsMonsters/Menu/Buttons/Restart.png', type: 'ui' },
      { name: 'Settings', path: 'ui/icons/IconsPropsMonsters/Menu/Buttons/Settings.png', type: 'ui' },
      { name: 'Volume', path: 'ui/icons/IconsPropsMonsters/Menu/Buttons/Volume.png', type: 'ui' },
    ]
  },
  levels: {
    name: '关卡图标',
    icon: '🎮',
    description: '关卡选择图标，1-50关',
    items: Array.from({ length: 50 }, (_, i) => {
      const num = String(i + 1).padStart(2, '0');
      return { name: '关卡' + (i + 1), path: `ui/icons/IconsPropsMonsters/Menu/Levels/${num}.png`, type: 'ui' };
    })
  },
  skills: {
    name: '技能图标',
    icon: '✨',
    description: '冒险岛风格技能图标（共1670张）',
    items: [],
    dynamic: true,
    basePath: 'skills/maplestory/技能图标',
    filePattern: '{num}.png',
    count: 1670,
    startNum: 1
  },
  weapons: {
    name: '武器装备',
    icon: '⚔️',
    description: '冒险岛风格武器装备图标（共727张）',
    items: [],
    dynamic: true,
    basePath: 'weapons/maplestory/武器装备-冒险岛',
    filePattern: '{num}.png',
    count: 727,
    startNum: 1,
    padLength: 3
  },
  terrain: {
    name: '地形',
    icon: '🗺️',
    description: '地形瓦片（共374个）',
    dynamic: true,
    tileset: {
      path: 'terrain/cave.png',
      tileSize: 32,
      cols: 22,
      rows: 17,
      total: 374,
    },
    count: 374,
  },
  interior: {
    name: '室内装饰',
    icon: '🏠',
    description: '室内装饰瓦片（共466个）',
    dynamic: true,
    tilesets: [
      { path: 'interior/Interior_1.png', tileSize: 32, cols: 21, rows: 21, total: 441 },
      { path: 'interior/Interior_2.png', tileSize: 32, cols: 5, rows: 5, total: 25 },
    ],
    count: 466,
  },
};

// 获取动态分类的分页素材
export function getDynamicItems(category, page = 0, pageSize = 24) {
  if (!category.dynamic) return category.items || [];

  const start = page * pageSize;
  const end = Math.min(start + pageSize, category.count);
  const items = [];

  if (category.tileset) {
    const ts = category.tileset;
    for (let i = start; i < end; i++) {
      const row = Math.floor(i / ts.cols);
      const col = i % ts.cols;
      items.push({
        name: `${category.name}_${i}`,
        path: ts.path,
        type: 'tile',
        tilesetIndex: i,
        tileSize: ts.tileSize,
        tileCol: col,
        tileRow: row,
      });
    }
  } else if (category.tilesets) {
    for (let i = start; i < end; i++) {
      let offset = 0;
      let targetTileset = null;
      let localIndex = 0;

      for (const ts of category.tilesets) {
        if (i < offset + ts.total) {
          targetTileset = ts;
          localIndex = i - offset;
          break;
        }
        offset += ts.total;
      }

      if (targetTileset) {
        const row = Math.floor(localIndex / targetTileset.cols);
        const col = localIndex % targetTileset.cols;
        items.push({
          name: `${category.name}_${i}`,
          path: targetTileset.path,
          type: 'tile',
          tilesetIndex: localIndex,
          tileSize: targetTileset.tileSize,
          tileCol: col,
          tileRow: row,
        });
      }
    }
  } else {
    const padLength = category.padLength || 4;
    for (let i = start; i < end; i++) {
      const num = i + (category.startNum || 1);
      const fileName = category.filePattern.replace('{num}', String(num).padStart(padLength, '0'));
      items.push({
        name: `${category.name} ${num}`,
        path: `${category.basePath}/${fileName}`,
        type: 'icon'
      });
    }
  }

  return items;
}

// 获取分类的总页数
export function getCategoryPageCount(category, pageSize = 24) {
  if (!category.dynamic) return Math.max(1, Math.ceil((category.items || []).length / pageSize));
  return Math.ceil(category.count / pageSize);
}

// 获取分类中所有角色/怪物分组
export function getCategoryGroups(categoryKey) {
  const category = ASSET_CATEGORIES[categoryKey];
  if (!category || !category.items) return [];
  const groups = new Set();
  category.items.forEach(item => {
    if (item.group) groups.add(item.group);
  });
  return Array.from(groups).sort();
}

// 按分组筛选素材
export function filterItemsByGroup(categoryKey, groupName) {
  const category = ASSET_CATEGORIES[categoryKey];
  if (!category || !category.items) return [];
  return category.items.filter(item => item.group === groupName);
}
