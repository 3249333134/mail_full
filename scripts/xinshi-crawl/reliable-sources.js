/**
 * 阶段6：可靠素材清单（基于文件名+网格精确分析，杜绝猜测映射）
 * 每个条目: 包slug / 源文件 / 网格切法 / 对应信使 id
 */
module.exports = [
  // ========== A. 单文件单角色（整图 1 片，绝对可靠） ==========
  { pkg: 'fox-1', src: 'fox-1.png', type: 'whole', carrierId: 'fox', name: '狐狸', category: 'real', trace: 'paw' },
  { pkg: 'turkey-0', src: 'turkey-0.png', type: 'whole', carrierId: 'turkey', name: '火鸡', category: 'real', trace: 'feather' },
  { pkg: 'werewolf', src: 'werewolf.png', type: 'whole', carrierId: 'werewolf', name: '狼人', category: 'scifi', trace: 'paw' },
  { pkg: 'cat-demon', src: 'cat-demon.png', type: 'whole', carrierId: 'cat-demon', name: '猫妖', category: 'scifi', trace: 'sparkle' },
  { pkg: 'hot-air-balloon', src: 'hot-air-balloon.png', type: 'whole', carrierId: 'hot-air-balloon', name: '热气球', category: 'scifi', trace: 'smoke' },
  { pkg: 'airship-and-hot-air-balloon', src: 'airship-and-hot-air-balloon.png', type: 'whole', carrierId: 'airship', name: '飞艇', category: 'scifi', trace: 'smoke' },
  { pkg: 'pixel-lightning', src: 'pixel-lightning.png', type: 'whole', carrierId: 'lightning', name: '闪电', category: 'real', trace: 'bolt' },
  { pkg: '8-bit-space-shuttle', src: '8-bit-space-shuttle.png', type: 'whole', carrierId: 'space-shuttle', name: '太空梭', category: 'scifi', trace: 'flame' },
  { pkg: 'saturn-v-pixel-rocket', src: 'saturn-v-pixel-rocket.PNG', type: 'whole', carrierId: 'saturn-rocket', name: '土星五号', category: 'scifi', trace: 'flame' },
  { pkg: '64x64-pixel-art-pixel-bird', src: '64x64-pixel-art-pixel-bird.png', type: 'whole', carrierId: 'homing-pigeon', name: '信鸽', category: 'real', trace: 'feather' },
  { pkg: 'pixel-art-duck-20x20', src: 'pixel-art-duck-20x20.png', type: 'whole', carrierId: 'duck', name: '鸭子', category: 'real', trace: 'feather' },
  { pkg: 'pixel-art-dog-and-cat', src: 'pixel-art-dog-and-cat.png', type: 'whole', carrierId: 'dog', name: '小狗', category: 'real', trace: 'paw' },
  { pkg: 'pixel-vehicle-pack-0', src: 'pixel-vehicle-pack-0.png', type: 'whole', carrierId: 'hover-car', name: '悬浮车', category: 'scifi', trace: 'trail' },
  { pkg: 'pixel-dragon', src: 'pixel-dragon.png', type: 'whole', carrierId: 'dragon', name: '巨龙', category: 'scifi', trace: 'flame' },
  { pkg: 'chinese-dragon', src: 'chinese-dragon.png', type: 'whole', carrierId: 'chinese-dragon', name: '中国龙', category: 'scifi', trace: 'smoke' },
  { pkg: 'dragon-idle-animation', src: 'dragon-idle-animation.gif', type: 'whole', carrierId: 'dragon-baby', name: '幼龙', category: 'scifi', trace: 'flame' },
  { pkg: 'animated-pixel-art-raft-sprite', src: 'animated-pixel-art-raft-sprite.gif', type: 'whole', carrierId: 'raft', name: '竹筏', category: 'real', trace: 'ripple' },
  { pkg: 'fx-smoke-trail-pixel', src: 'fx-smoke-trail-pixel.gif', type: 'whole', carrierId: 'wind', name: '一阵风', category: 'real', trace: 'smoke' },
  { pkg: 'pixel-squirrel', src: 'pixel-squirrel.gif', type: 'whole', carrierId: 'squirrel', name: '松鼠', category: 'real', trace: 'paw' },
  { pkg: 'blue-bird-48x48', src: 'blue-bird-48x48.gif', type: 'whole', carrierId: 'blue-bird', name: '蓝鸟', category: 'real', trace: 'feather' },
  { pkg: 'bunny-sprite', src: 'bunny-sprite.gif', type: 'whole', carrierId: 'rabbit', name: '兔子', category: 'real', trace: 'paw' },
  { pkg: 'wooden-boat', src: 'wooden-boat.jpg', type: 'whole', carrierId: 'wooden-boat', name: '木舟', category: 'real', trace: 'ripple' },
  { pkg: 'wolf-pack-32x32-walking-wolf-animation', src: 'wolf-pack-32x32-walking-wolf-animation.png', type: 'whole', carrierId: 'wolf', name: '狼', category: 'real', trace: 'paw' },

  // ========== B. 多文件包（每文件=单角色，按文件名明确） ==========
  // gb-funky-fauna：8 个动物文件
  { pkg: 'gb-funky-fauna', src: 'cat.png', type: 'whole', carrierId: 'stray-cat', name: '流浪猫', category: 'real', trace: 'paw' },
  { pkg: 'gb-funky-fauna', src: 'dog.png', type: 'whole', carrierId: 'dog-pixel', name: '像素狗', category: 'real', trace: 'paw' },
  { pkg: 'gb-funky-fauna', src: 'fox.png', type: 'whole', carrierId: 'fox-pixel', name: '像素狐', category: 'real', trace: 'paw' },
  { pkg: 'gb-funky-fauna', src: 'frog.png', type: 'whole', carrierId: 'frog', name: '青蛙', category: 'real', trace: 'ripple' },
  { pkg: 'gb-funky-fauna', src: 'mouse.png', type: 'whole', carrierId: 'mouse', name: '田鼠', category: 'real', trace: 'paw' },
  { pkg: 'gb-funky-fauna', src: 'bird.png', type: 'whole', carrierId: 'sparrow', name: '麻雀', category: 'real', trace: 'feather' },
  { pkg: 'gb-funky-fauna', src: 'beetle.png', type: 'whole', carrierId: 'beetle', name: '甲虫', category: 'real', trace: 'paw' },
  // random-animals：6 个文件
  { pkg: 'random-animals', src: 'bee.png', type: 'whole', carrierId: 'bee', name: '蜜蜂', category: 'real', trace: 'sparkle' },
  { pkg: 'random-animals', src: 'fox.png', type: 'whole', carrierId: 'fox2', name: '灵狐', category: 'real', trace: 'paw' },
  { pkg: 'random-animals', src: 'jellyfish.png', type: 'whole', carrierId: 'jellyfish', name: '水母', category: 'real', trace: 'ripple' },
  { pkg: 'random-animals', src: 'ladybug.png', type: 'whole', carrierId: 'ladybug', name: '瓢虫', category: 'real', trace: 'sparkle' },
  { pkg: 'random-animals', src: 'parrot.png', type: 'whole', carrierId: 'parrot', name: '鹦鹉', category: 'real', trace: 'feather' },
  { pkg: 'random-animals', src: 'tiger-pig.png', type: 'whole', carrierId: 'tiger-pig', name: '虎猪', category: 'real', trace: 'paw' },
  // tiny-horses：4 个文件
  { pkg: 'tiny-horses', src: 'deer.png', type: 'whole', carrierId: 'deer', name: '鹿', category: 'real', trace: 'footprint' },
  { pkg: 'tiny-horses', src: 'horse.png', type: 'whole', carrierId: 'horse', name: '骏马', category: 'real', trace: 'footprint' },
  { pkg: 'tiny-horses', src: 'pony.png', type: 'whole', carrierId: 'pony', name: '小马', category: 'real', trace: 'footprint' },
  { pkg: 'tiny-horses', src: 'warhorse.png', type: 'whole', carrierId: 'warhorse', name: '战马', category: 'real', trace: 'footprint' },
  // open-ocean：3 种鱼
  { pkg: 'open-ocean-game-art-mostly-2d-fish-animations', src: 'Clownfish.png', type: 'whole', carrierId: 'clownfish', name: '小丑鱼', category: 'real', trace: 'ripple' },
  { pkg: 'open-ocean-game-art-mostly-2d-fish-animations', src: 'Mackerel.png', type: 'whole', carrierId: 'migratory-fish', name: '洄游鱼', category: 'real', trace: 'ripple' },
  { pkg: 'open-ocean-game-art-mostly-2d-fish-animations', src: 'Tuna.png', type: 'whole', carrierId: 'tuna', name: '金枪鱼', category: 'real', trace: 'ripple' },
  // 16x16-echinoderms：海星海胆
  { pkg: '16x16-echinoderms', src: 'Acanthaster_planci.png', type: 'whole', carrierId: 'starfish', name: '海星', category: 'real', trace: 'ripple' },
  { pkg: '16x16-echinoderms', src: 'Strongylocentrotus_purpuratus.png', type: 'whole', carrierId: 'sea-urchin', name: '海胆', category: 'real', trace: 'ripple' },
  // admurins-flora-and-fauna：20+ 生物文件
  { pkg: 'admurins-flora-and-fauna', src: '01_Bird.png', type: 'whole', carrierId: 'bird', name: '小鸟', category: 'real', trace: 'feather' },
  { pkg: 'admurins-flora-and-fauna', src: '02_Frog.png', type: 'whole', carrierId: 'frog-admurin', name: '池蛙', category: 'real', trace: 'ripple' },
  { pkg: 'admurins-flora-and-fauna', src: '03_Turtle.png', type: 'whole', carrierId: 'turtle', name: '乌龟', category: 'real', trace: 'ripple' },
  { pkg: 'admurins-flora-and-fauna', src: '04_Mouse.png', type: 'whole', carrierId: 'mouse2', name: '小鼠', category: 'real', trace: 'paw' },
  { pkg: 'admurins-flora-and-fauna', src: '05_Fish.png', type: 'whole', carrierId: 'fish', name: '游鱼', category: 'real', trace: 'ripple' },
  { pkg: 'admurins-flora-and-fauna', src: '06_Snail.png', type: 'whole', carrierId: 'snail', name: '蜗牛', category: 'real', trace: 'ripple' },
  { pkg: 'admurins-flora-and-fauna', src: '07_Spider.png', type: 'whole', carrierId: 'spider', name: '蜘蛛', category: 'real', trace: 'paw' },
  { pkg: 'admurins-flora-and-fauna', src: '08_Bee.png', type: 'whole', carrierId: 'bee2', name: '采蜜蜂', category: 'real', trace: 'sparkle' },
  { pkg: 'admurins-flora-and-fauna', src: '17_Insect_Ant.png', type: 'whole', carrierId: 'ant', name: '工蚁', category: 'real', trace: 'paw' },
  { pkg: 'admurins-flora-and-fauna', src: '18_Insect_Moth.png', type: 'whole', carrierId: 'moth', name: '飞蛾', category: 'real', trace: 'sparkle' },
  { pkg: 'admurins-flora-and-fauna', src: '19_Insect_Mantis.png', type: 'whole', carrierId: 'mantis', name: '螳螂', category: 'real', trace: 'paw' },
  { pkg: 'admurins-flora-and-fauna', src: '20_Insect_Dragonfly.png', type: 'whole', carrierId: 'dragonfly', name: '蜻蜓', category: 'real', trace: 'ripple' },
  // animated-wild-animals：6 种动物（取 Idle 帧）
  { pkg: 'animated-wild-animals', src: 'Bear_Idle.png', type: 'whole', carrierId: 'bear', name: '棕熊', category: 'real', trace: 'paw' },
  { pkg: 'animated-wild-animals', src: 'Boar_Idle.png', type: 'whole', carrierId: 'boar', name: '野猪', category: 'real', trace: 'paw' },
  { pkg: 'animated-wild-animals', src: 'Deer_Idle.png', type: 'whole', carrierId: 'deer-wild', name: '野鹿', category: 'real', trace: 'footprint' },
  { pkg: 'animated-wild-animals', src: 'Fox_Idle.png', type: 'whole', carrierId: 'fox-wild', name: '野狐', category: 'real', trace: 'paw' },
  { pkg: 'animated-wild-animals', src: 'Rabbit_Idle.png', type: 'whole', carrierId: 'rabbit-wild', name: '野兔', category: 'real', trace: 'paw' },
  { pkg: 'animated-wild-animals', src: 'Wolf_Walk.png', type: 'whole', carrierId: 'wolf-wild', name: '野狼', category: 'real', trace: 'paw' },

  // ========== C. magic-pixel-art（道具/魔法） ==========
  { pkg: 'magic-pixel-art', src: 'Blue Fairy.png', type: 'whole', carrierId: 'fairy', name: '小仙子', category: 'scifi', trace: 'sparkle' },
  { pkg: 'magic-pixel-art', src: 'Crystal Ball.png', type: 'whole', carrierId: 'time-capsule', name: '时间胶囊', category: 'scifi', trace: 'sparkle' },
  { pkg: 'magic-pixel-art', src: 'Blue Crystal.png', type: 'whole', carrierId: 'rewind-courier', name: '时光信使', category: 'scifi', trace: 'arc' },
  { pkg: 'magic-pixel-art', src: 'Blue Glass.png', type: 'whole', carrierId: 'drift-bottle', name: '漂流瓶', category: 'real', trace: 'ripple' },
  { pkg: 'magic-pixel-art', src: 'Wizard Hat.png', type: 'whole', carrierId: 'wizard', name: '大法师', category: 'scifi', trace: 'sparkle' },
  { pkg: 'magic-pixel-art', src: 'White Sparkle1.png', type: 'whole', carrierId: 'firefly', name: '萤火虫', category: 'real', trace: 'sparkle' },
  { pkg: 'magic-pixel-art', src: 'Star.png', type: 'whole', carrierId: 'star', name: '星星', category: 'scifi', trace: 'sparkle' },
  { pkg: 'magic-pixel-art', src: 'Fire.png', type: 'whole', carrierId: 'fire', name: '火焰使者', category: 'scifi', trace: 'flame' },
  { pkg: 'magic-pixel-art', src: 'Water.png', type: 'whole', carrierId: 'river', name: '河流', category: 'real', trace: 'ripple' },
  { pkg: 'magic-pixel-art', src: 'Red Fairy.png', type: 'whole', carrierId: 'fairy-red', name: '赤仙子', category: 'scifi', trace: 'sparkle' },

  // ========== D. space-pixel-art（太空元素） ==========
  { pkg: 'space-pixel-art', src: 'Astronaut.png', type: 'whole', carrierId: 'astronaut', name: '宇航员', category: 'scifi', trace: 'trail' },
  { pkg: 'space-pixel-art', src: 'RocketWhite.png', type: 'whole', carrierId: 'rocket', name: '火箭', category: 'scifi', trace: 'flame' },
  { pkg: 'space-pixel-art', src: 'UfoBlue.png', type: 'whole', carrierId: 'ufo', name: '飞碟', category: 'scifi', trace: 'trail' },
  { pkg: 'space-pixel-art', src: 'Satellite.png', type: 'whole', carrierId: 'satellite', name: '卫星', category: 'scifi', trace: 'trail' },
  { pkg: 'space-pixel-art', src: 'WhiteStar.png', type: 'whole', carrierId: 'star-space', name: '恒星', category: 'scifi', trace: 'sparkle' },
  { pkg: 'space-pixel-art', src: 'WhiteShootingStar.png', type: 'whole', carrierId: 'shooting-star', name: '流星', category: 'scifi', trace: 'trail' },
  { pkg: 'space-pixel-art', src: 'FullMoon.png', type: 'whole', carrierId: 'dream-walker', name: '梦境使者', category: 'scifi', trace: 'sparkle' },
  { pkg: 'space-pixel-art', src: 'Sun.png', type: 'whole', carrierId: 'sun', name: '太阳', category: 'real', trace: 'sparkle' },
  { pkg: 'space-pixel-art', src: 'Earth.png', type: 'whole', carrierId: 'earth', name: '地球', category: 'real', trace: 'ripple' },
  { pkg: 'space-pixel-art', src: 'BluePlanet.png', type: 'whole', carrierId: 'blue-planet', name: '蓝色行星', category: 'scifi', trace: 'ripple' },

  // ========== E. pixel-vehicle-pack（车辆） ==========
  { pkg: 'pixel-vehicle-pack', src: 'ambulance.png', type: 'whole', carrierId: 'ambulance', name: '救护车', category: 'scifi', trace: 'trail' },
  { pkg: 'pixel-vehicle-pack', src: 'bus.png', type: 'whole', carrierId: 'bus', name: '公交车', category: 'scifi', trace: 'trail' },
  { pkg: 'pixel-vehicle-pack', src: 'police.png', type: 'whole', carrierId: 'police-car', name: '警车', category: 'scifi', trace: 'trail' },
  { pkg: 'pixel-vehicle-pack', src: 'firetruck.png', type: 'whole', carrierId: 'firetruck', name: '消防车', category: 'scifi', trace: 'trail' },
  { pkg: 'pixel-vehicle-pack', src: 'scooter.png', type: 'whole', carrierId: 'scooter', name: '摩托信使', category: 'scifi', trace: 'trail' },
  { pkg: 'pixel-vehicle-pack', src: 'cycle.png', type: 'whole', carrierId: 'bicycle', name: '自行车信使', category: 'scifi', trace: 'trail' },
  { pkg: 'pixel-vehicle-pack', src: 'sedan.png', type: 'whole', carrierId: 'sedan', name: '轿车', category: 'scifi', trace: 'trail' },
  { pkg: 'pixel-vehicle-pack', src: 'sports_red.png', type: 'whole', carrierId: 'sports-car', name: '跑车', category: 'scifi', trace: 'trail' },
  { pkg: 'pixel-vehicle-pack', src: 'convertible.png', type: 'whole', carrierId: 'convertible', name: '敞篷车', category: 'scifi', trace: 'trail' },
  { pkg: 'pixel-vehicle-pack', src: 'buggy.png', type: 'whole', carrierId: 'buggy', name: '越野车', category: 'scifi', trace: 'trail' },
  { pkg: 'pixel-vehicle-pack', src: 'kart.png', type: 'whole', carrierId: 'kart', name: '卡丁车', category: 'scifi', trace: 'trail' },

  // ========== F. wintery（冬季） ==========
  { pkg: 'wintery-pixel-art-pack', src: 'Reindeer-Standing-Sheet.png', type: 'whole', carrierId: 'reindeer', name: '驯鹿', category: 'real', trace: 'footprint' },
  { pkg: 'wintery-pixel-art-pack', src: 'Snowman-Standing-Sheet.png', type: 'whole', carrierId: 'snowman', name: '雪人', category: 'real', trace: 'snow' },
  { pkg: 'wintery-pixel-art-pack', src: 'PersonInCoat00-Standing-Sheet.png', type: 'whole', carrierId: 'snow-courier', name: '风雪信使', category: 'real', trace: 'snow' },
  { pkg: 'wintery-pixel-art-pack', src: 'Snowball-Sheet.png', type: 'whole', carrierId: 'snowball', name: '雪球使者', category: 'real', trace: 'snow' },

  // ========== G. lpc-ship（帆船） ==========
  { pkg: 'lpc-ship', src: 'lpc-ship.png', type: 'whole', carrierId: 'ship', name: '帆船', category: 'real', trace: 'ripple' },

  // ========== H. 16x16 网格包（按 16px 精确切格） ==========
  // 16x16-fantasy-pixel-art-vehicles：288x64 = 18x4 格
  { pkg: '16x16-fantasy-pixel-art-vehicles', src: '16x16-fantasy-pixel-art-vehicles.jpg', type: 'grid', cell: 16, at: [0, 0], carrierId: 'cart', name: '小推车', category: 'scifi', trace: 'trail' },
  { pkg: '16x16-fantasy-pixel-art-vehicles', src: '16x16-fantasy-pixel-art-vehicles.jpg', type: 'grid', cell: 16, at: [1, 0], carrierId: 'carriage', name: '马车', category: 'scifi', trace: 'trail' },
  { pkg: '16x16-fantasy-pixel-art-vehicles', src: '16x16-fantasy-pixel-art-vehicles.jpg', type: 'grid', cell: 16, at: [2, 0], carrierId: 'wagon', name: '货运车', category: 'scifi', trace: 'trail' },
  { pkg: '16x16-fantasy-pixel-art-vehicles', src: '16x16-fantasy-pixel-art-vehicles.jpg', type: 'grid', cell: 16, at: [3, 0], carrierId: 'boat-mini', name: '小舟', category: 'scifi', trace: 'ripple' },

  // ========== I. 补全 CARRIER_ROSTER 内置 17 个信使（缺 5 个） ==========
  { pkg: 'gb-funky-fauna', src: 'bird4x.png', type: 'whole', carrierId: 'migratory-bird', name: '南迁的候鸟', category: 'real', trace: 'feather' },
  { pkg: 'space-pixel-art', src: 'Hurricane.png', type: 'whole', carrierId: 'portal-sprite', name: '传送门精灵', category: 'scifi', trace: 'vortex' },
  { pkg: 'space-pixel-art', src: 'Astronaut1.png', type: 'whole', carrierId: 'stellar-courier', name: '星际信使', category: 'scifi', trace: 'trail' },
  { pkg: 'space-pixel-art', src: 'WhiteMoon.png', type: 'whole', carrierId: 'ghost-postman', name: '幽灵邮差', category: 'scifi', trace: 'smoke' },
  { pkg: 'blue-bird-48x48', src: 'blue-bird-48x48.gif', type: 'whole', frame: 1, carrierId: 'paper-crane', name: '纸鹤', category: 'scifi', trace: 'feather' }
];
