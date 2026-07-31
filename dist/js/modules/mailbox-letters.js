/* ========================================
   Mailbox Letters Data
   ======================================== */

Object.assign(MailboxManager, {
  // 生成示例信件
  generateSampleLetters() {
    const sampleTexts = [
      { title: '春日的第一封信', content: '亲爱的，今天窗外的樱花开了，粉色的花瓣随风飘落，像一场温柔的雨。我站在窗前，想起了你。你那边的春天，是不是也一样美？', sender: '小五月', recipient: '收信人' },
      { title: '雨夜的思念', content: '窗外下着小雨，滴滴答答的声音像一首摇篮曲。我坐在灯下，给你写这封信。雨水打湿了玻璃，也打湿了我的思念。', sender: '小五月', recipient: '远方的你' },
      { title: '关于昨天的梦', content: '昨晚做了一个梦，梦里我们回到了初见的那个夏天。蝉鸣、西瓜、还有你清澈的眼睛。醒来的时候，枕头湿了一片。', sender: '小五月', recipient: '旧时光' },
      { title: '桂花飘香的午后', content: '巷口的桂花开了，甜香飘满整条街。每次经过，都会想起你说过的话。你说桂花是秋天的信使，带着远方的问候。', sender: '小五月', recipient: '秋天' },
      { title: '冬日的第一杯热可可', content: '今天好冷啊，手指都冻僵了。泡了一杯热可可，捧着杯子的时候，忽然很想你。要是你在就好了，可以一起取暖。', sender: '小五月', recipient: '温暖' },
      { title: '写给未来的自己', content: '你好吗？十年后的自己。我现在正在给你写信，窗外的阳光很好。希望那个时候的你，已经实现了所有的梦想，身边有爱的人。', sender: '现在的我', recipient: '未来的我' },
      { title: '森林里的秘密', content: '今天去了森林，阳光透过树叶洒下来，像金色的碎片。我在一棵老树下坐了很久，听风穿过树叶的声音。那是大自然的信。', sender: '森林精灵', recipient: '你' },
      { title: '月光下的独白', content: '今晚的月亮好圆，像一枚银币挂在天上。我坐在屋顶上，给月亮写信。它静静听着，不说话，只是把月光洒在我身上。', sender: '月下客', recipient: '月亮' },
    ];

    const paperStyles = ['vintage-literary', 'floral', 'night-letter', 'kraft', 'ocean'];
    const mailboxIds = ['mailbox-may', 'mailbox-winter', 'mailbox-time', 'mailbox-moon', 'mailbox-forest', 'mailbox-autumn'];

    const letters = [];
    let idCounter = 1;

    mailboxIds.forEach((mbId, mbIndex) => {
      const count = mbIndex < 3 ? 3 : 2;
      for (let i = 0; i < count; i++) {
        const sample = sampleTexts[(mbIndex * 3 + i) % sampleTexts.length];
        const now = new Date();
        now.setDate(now.getDate() - (mbIndex * 5 + i * 3));

        const letter = {
          id: `sample-${idCounter++}`,
          mailboxId: mbId,
          title: sample.title,
          sender: sample.sender,
          recipient: sample.recipient,
          paperStyle: paperStyles[(mbIndex + i) % paperStyles.length],
          bgmUrl: '',
          date: now.toISOString().split('T')[0],
          time: `${String(10 + i).padStart(2, '0')}:${String((i * 13) % 60).padStart(2, '0')}`,
          weekday: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][now.getDay()],
          location: '',
          letterTitle: '',
          content: [
            {
              id: `text-${idCounter}`,
              type: 'text',
              text: sample.content,
              x: 50,
              y: 120,
              width: 500,
              fontSize: 16,
              color: '#2c2c2c',
              fontFamily: 'KaiTi, STKaiti, serif'
            }
          ],
          createdAt: now.getTime(),
          updatedAt: now.getTime()
        };
        letters.push(letter);
      }
    });

    return letters;
  },

  generateBrenuoLetters() {
    const letterData = [
      {
        num: 1,
        title: '第一封',
        subtitle: '医院初遇后，她刚离开布雷诺，未寄出',
        date: '1995-05-20',
        time: '05:20',
        weekday: '周六',
        recipient: '缪医生',
        sender: '以撒',
        location: '布雷诺老屋',
        body: `今天换药时，新来的护士手很重。但我没出声。我记得你说，疼可以说出来，但我更怕别的声音会吓跑你。

你留下的药很好用，伤口愈合得很快，像你说的，成了一道记号。
关于你的事，我忍不住跟祖母说了，她同意你的说法，有记号的人不容易丢，因为在乎的人一眼就能认出。花再开的两年后，你会认出吗？你、会在乎我吗？

布雷诺的太阳还是那么毒，但我开始去看你留下的书。字认不全，很吃力。世界真的像你说的那么大吗？大到……可以忘记这里的贫穷和仇恨？

你说等你两年，花开的时候就会回来。我在屋后种了一片花，不知道你回来时，能不能看到。

算了，你大概很忙，忘了也没关系。`
      },
      {
        num: 2,
        title: '第二封',
        subtitle: '加入狂草帮后，字迹歪歪扭扭，未寄出',
        date: '1995-09-20',
        time: '05:20',
        weekday: '周三',
        recipient: '缪',
        sender: '以撒',
        location: '',
        body: `今天我又跑赢了所有人。奥丁说我有种"一往无前的勇气"。他送我了一双鞋，叫阿甘鞋。跑步时，我不再是为了躲开身后的石头和咒骂，是为了跑到最前面。

狂草帮里很吵，但很好。这里诺族和布雷族的人可以勾肩搭背，像一家人。奥丁是个疯子，喜欢穿橘色衣服，讲很难笑的笑话。但他会让我想笑就笑。他说，笑不是诅咒，是能给别人幸福的东西。

我好像……有点接受自己了。接受这条伤疤，接受偶尔控制不住的笑声。

你说的那个世界，我还在找。通过奥丁，通过狂草帮，通过我自己的眼睛。你还会回来吗？回来看看我种的花房，你应该会喜欢。

我变得强大了，缪。或许下次见面，我可以保护你。`
      },
      {
        num: 3,
        title: '第三封',
        subtitle: '失约的花期，等待的第二个春天，未寄出，与干枯的花瓣一同被夹在书页中',
        date: '1997-05-20',
        time: '05:20',
        weekday: '周二',
        recipient: '缪宏谟',
        sender: '以撒',
        location: '空等的第二年',
        body: `花又开了。蝴蝶也回来了。它们成群地飞，很吵。

你说的"两年"，是哪个地方的两年？是布雷诺的吗，还是说，东国的花期和布雷诺的不一样？

我每天都会去路口看看。奥丁说我像块望夫石。我把他揍了一顿。他不明白，我不是在等一个不会回来的人，我是在等一个承诺。

承诺也会过期吗？像牛奶一样，慢慢变质，发出酸味。

如果你不回来了，至少该给我一封信，告诉我"别等了"。你连这点残忍都不肯给我。

你当时，是不是在骗我？`
      },
      {
        num: 4,
        title: '第四封',
        subtitle: '未寄出，写于标本制作台前，纸上有轻微毒液痕迹',
        date: '1998-05-20',
        time: '05:20',
        weekday: '周三',
        recipient: '缪',
        sender: '以撒',
        location: '',
        body: `我又做完了一只标本。很完美，翅膀舒展，不会再飞走。

你说让我做蝴蝶，飞去更大的世界。可我飞不了，我只能站在原地，做一朵等蝴蝶来的花。

可蝴蝶来了又走，只留下战栗的空欢喜。

那我只好把它们都留下来。用针，用毒气，用温水。它们会永远美丽，永远停留，永远只看着我。

你呢？你是不是也像这些蝴蝶一样，觉得我只是你途经的一朵无聊的花？

我多想也把你做成标本。把你的笑容、你的声音、你碰触我伤口时冰凉的指尖，都定格在最美的时刻。这样你就永远不会离开，永远不会忘记我，永远不会对别人说"等花开了我就回来"。

我知道这想法或许会让你觉得很可怕。但我就是这样的人，想你想到发疯的时候，这是唯一能让我平静的事。

我恨你给了我希望，又把我留在无尽的等待里。

你快回来吧。在我彻底变成怪物之前。`
      },
      {
        num: 5,
        title: '第五封',
        subtitle: '雨夜，从半山腰分离后，未寄出，纸张被雨水浸染，字迹潦草',
        date: '2000-04-20',
        time: '05:20',
        weekday: '周四',
        recipient: '缪宏谟',
        sender: '以撒',
        location: '一个心比身体更冷的雨夜',
        body: `五年。我等了整整五年，想象过无数次重逢的画面。或许在花房，或许在医院，你会笑着对我说："以撒，我回来了。"

我从没想过，会是在泥石流里，差点亲手看着你被冲走。
更没想过，你抬头看我的眼神，和看一个陌生人没有任何区别。那么疏离，那么礼貌的一句"谢谢"。

你告诉我伤疤是记号，在乎的人一眼就能认出。原来，你从来都不在乎。

写到此处，我失控地笑了。多可笑啊，缪宏谟。我人生中最重的两次伤疤，一次因为你愈合，一次因你裂开。

我让"想笑就笑"缠住你，告诉你它在丈量能不能吞下你。我吓唬你，给你出该死的选择题。我只是想从你脸上看到一点除了"感激"之外的情绪，哪怕是一点恐惧也好！

可你选了第二句。你以为我真的不想救你。

在你眼里，我就是这样一个会在危难时丢下你、甚至可能害你的陌生人？

那一刻，我的心比被滚蜡烫过、被石刀刺穿更疼。

我最后还是没有告诉你答案。我背你下山，像背着我死去的过去。

你回来了。但好像，又根本没回来。`
      },
      {
        num: 6,
        title: '第六封',
        subtitle: '金狮医院冲突后，从出租屋回来当晚，未寄出，字迹相对平稳',
        date: '2000-04-21',
        time: '05:20',
        weekday: '周五',
        recipient: '缪',
        sender: '以撒',
        location: '',
        body: `今天，你又一次把我从那些人的唾沫里拉了出来。你挡在我身前，质问他们"东非大裂谷是地球的伤疤，你们怎么不去遮盖它？"。

你的头发跑散了，样子有点狼狈，但眼睛亮得惊人。

你带我回了你的地方，给我上药，告诉我"坏掉的是他们的眼睛和嘴巴"。你问我，会不会把真实的自己和他们口中的我混为一谈。

我差点就脱口而出：我真实的自己，就是他们口中那个阴狠、恶毒、会报复的人！

我试探了你，把最不堪的自己撕开给你看。我等着你退缩，等着你害怕，这样我就能告诉自己：看吧，她和他们没什么不同。

但你却说："那真是……太好了。"你说："因为我也是这样的，以撒。"你说："我们，都不用装了。"

你甚至和我一起，给他们下了泻药。

那一刻，好像有什么坚硬的东西在我心里"咔嚓"一声碎了。大片大片的空气涌进来，我终于能喘口气了。

原来世界上真的有一个地方，可以同时容纳你的光辉和我的阴暗。
原来真的有人，能接住全部的我。

今天之前，我以为是我又一次抓住了你。现在才明白，是你终于……真正地看见了我。`
      },
      {
        num: 7,
        title: '第七封',
        subtitle: '金狮医院事件后，未寄出',
        date: '2000-04-22',
        time: '05:20',
        weekday: '周六',
        recipient: '缪宏谟',
        sender: '以撒',
        location: '',
        body: `那天你吻了我。那是我第一个吻。你看起来却……有点后悔？或者惭愧？我不明白。我一直在想，那个吻对你来说，算什么？是冲动？是怜悯？还是……一丝别的什么？我想了一夜，想到唇钉的伤口都在发烫。

后来，我看到你为了摘掉伯纳德的戒指，手指都快磨破了。那一刻，我心里那点因为初吻而产生的别扭和怨恨，突然就碎了。

我竟然在想，那个戒指弄疼你了吗？

我给你缠了一个野花戒指，告诉你"你不认，它就什么都不是"。我说"缪宏谟，你是自由的"。

当你把唇钉戴在我伤痕上的时候，你说"一个人的魅力来自于他的与众不同"。你说我的伤疤是"比恒星还闪耀的求生欲"。

那一刻，我突然发现我或许错了。
我之前想把你变成标本，留在身边。但那不是爱，是囚禁。

最配你的，从来不是被刺穿的永恒，而是无拘无束的自由。
你送我唇钉，不是要固定我，而是为我的伤痕加冕。

那我爱你，也不该是束缚你，而是该放手让你飞。
当然，如果你愿意为我停留……

……算了，先这样吧。`
      },
      {
        num: 8,
        title: '第八封',
        subtitle: '祖母与撒该葬礼后，未寄出，字迹缭乱，落笔笔痕几乎穿透纸张',
        date: '2000-06-20',
        time: '05:20',
        weekday: '周二',
        recipient: '缪宏谟',
        sender: '以撒',
        location: '',
        body: `你又走了。像五年前一样。不，比那时更彻底。

你摘走了撒该的眼睛，然后就像从未出现过一样，消失了。

我抱着撒该渐渐冰冷的身体时，还在想，你会不会突然出现，像当年在医院里一样，告诉我"别怕，我会处理得很好"。

但你没有。

你给我的承诺，到底哪一句是真的？说花开了会回来是假的，说伤疤是记号是假的，说我们都不用装了也是假的。

你救了我，又亲手杀了我。用最疼的方式。

骗子。`
      },
      {
        num: 9,
        title: '第九封',
        subtitle: '于某份报纸的角落，未寄出，写在报纸边缘',
        date: '2000-12-20',
        time: '05:20',
        weekday: '周三',
        recipient: '伯纳德·莱诺夫人',
        sender: '你曾经的标本',
        location: '',
        body: `报纸上说，你的头纱是艺术品，长达十米，缀满蕾丝花朵。

恭喜。世纪婚礼。真是般配。

原来你口中的"想办法解除联姻"，就是回去完成它。

那我是什么，缪宏谟？你在贫瘠之地的一场风流？一个供你消遣的、脸上有疤的怪物？

你我的那段过往，在你十米的头纱面前，轻得像一个屁。

祝你幸福。祝你们莱诺家族，永远活在谎言砌成的宫殿里。

总有一天，我会亲手把它烧成灰。`
      },
      {
        num: 10,
        title: '第十封',
        subtitle: '刚加入怒河，训练期间，未寄出',
        date: '2001-05-20',
        time: '05:20',
        weekday: '周日',
        recipient: '缪宏谟',
        sender: '以撒',
        location: '',
        body: `奥丁问我，为什么我的杀意里总带着一股同归于尽的狠劲。我没告诉他，那是因为我想着你。

恨你，是我现在能活下去的唯一动力。我必须恨你，才能不去想你温柔擦药的手指，想你车里桉树燃烧的味道，想你告诉我"世界很大"时的眼睛。

我把你的书都烧了。灰烬飘起来的时候，我觉得我把自己的某一部分也烧掉了。

我发誓，等我杀完名单上所有的人，下一个就是程走柳，然后是你。

可为什么……在想着杀你的时候，心脏会比伤口更疼？`
      },
      {
        num: 11,
        title: '第十一封',
        subtitle: '某月制作戒指时，未寄出，与戒指一同存放',
        date: '2001-05-21',
        time: '05:20',
        weekday: '周一',
        recipient: '',
        sender: '以撒',
        location: '',
        body: `又一枚。

不知道你的手指尺寸有没有变。胖了，还是瘦了。

你说野花戒指代表自由。那我就做永不凋零的自由给你。

我知道它们永远也送不出去。就像我知道，我永远也无法真正恨你。

制作它们的时候，我的心很静。好像又回到了那个沙漠的夜晚，月光很亮，你问我能不能把自由送给你。

缪宏谟，我做的不是戒指，是我无处安放的爱和恨拧成的结。`
      },
      {
        num: 12,
        title: '第十二封',
        subtitle: '得知她失明后，未完成，写于情报笔记的扉页',
        date: '2001-05-21',
        time: '05:20',
        weekday: '周一',
        recipient: '缪',
        sender: '以撒',
        location: '',
        body: `听说你失明了。

报应吗？如果是，为什么我一点也高兴不起来？

我的情报网越铺越大，触角伸得越来越远。奥丁说我已经能独立了。

但我只想有一个能穿透东国高墙的耳朵，能听听你过得好不好。听听没有眼睛的你，会不会害怕。

你看，我还是这么没出息。

你毁了我在这个世界上最重要的东西，我却还在担心你过得好不好。`
      },
      {
        num: 13,
        title: '第十三封',
        subtitle: '伯纳德死后，清理残渣归来，未寄出，字迹潦草',
        date: '2002-05-20',
        time: '05:20',
        weekday: '周一',
        recipient: '缪宏谟',
        sender: '以撒',
        location: '',
        body: `你丈夫死了。恭喜你，又成了自由的寡妇。

然后呢？等着那些闻着钱味来的鬣狗，把你连人带骨地吞下去？

他们给你送车、送表、送香水，邀请你去吃饭。他们想的什么，我一清二楚。

没关系。他们送什么，我就让他们吃什么。吞不下去的，我帮他们。

你的命是我的，只有我能杀。在我收回之前，谁碰，谁就得死。

这条规矩，我来立。`
      },
      {
        num: 14,
        title: '第十四封',
        subtitle: '杀手生涯中期，未寄出',
        date: '2003-05-20',
        time: '05:20',
        weekday: '周二',
        recipient: '缪医生',
        sender: '以撒',
        location: '',
        body: `我最近租了一个祖母和一个妹妹。她们给我做早餐，跟我聊天，给我买新衣服。毛衣套上头的时候，有静电的声音，那一下，我以为我真的有个家了。

但我今天受了伤回来。她们看到血，就吓得跪下求我，说会守口如瓶，求我放过她们。

缪医生，你告诉我，家人为什么会害怕我？

我只是……想有人为我心疼一下，就像你当年那样。

我好想撒该，想祖母。想到骨头都在疼。

我是不是真的不配拥有家人？`
      },
      {
        num: 15,
        title: '第十五封',
        subtitle: '接到最终名单当晚，未寄出，字迹冰冷而决绝',
        date: '2004-09-21',
        time: '05:20',
        weekday: '周二',
        recipient: '缪宏谟',
        sender: '以撒',
        location: '',
        body: `名单下来了。最后一个。

真是命运般的讽刺，不是吗？我们之间，终究要由我亲手画上句号。

黛利拉想跟我交换。我拒绝了。

你的命，只能由我来取。只能是我。
这是我最后的占有。也是我最后的责任。

我会去的。以"廖景恢"的身份接近你，获取你的信任，就像你当年对我做的那样。然后，在某个你意想不到的时刻，完成我的任务。

别怪我。缪宏谟。我们之间，从一开始就充满了谎言和背叛。用死亡来结束，再合适不过。

等着我。我来赴最后的约了。`
      },
      {
        num: 16,
        title: '第十六封',
        subtitle: '第一次作为"廖景恢"接近失明的她时，字迹工整',
        date: '2005-04-21',
        time: '05:20',
        weekday: '周四',
        recipient: '缪宏谟（或许该称您缪女士）',
        sender: '廖景恢',
        location: '',
        body: `那日广府有雨，伞您过马路时，您说多谢。您的手很凉，像广府秋天早晨的露水。

您问我名字怎么写。我在您手心写了一个"廖"字。您说，和您的"缪"有同样的部分。是，都有"羽"。新羽高飞，风声袭远。很好的寓意，适合您。

您似乎很依赖您的那条导盲犬。它很乖，但那天"不小心"走丢了，希望它没事。您一个人生活，很不方便。测量尺寸时，您问我可否碰到您的腿，您说"麻烦我了"。

不麻烦。这是我的工作。

只是有时会出神。您看不见，所以不知道我在看您。看您和五年前有什么不同。看您为什么能那么平静，好像从未亏欠过任何人。

您翻译电影，只译布雷诺语。为什么？是赎罪吗？为了谁？为了那个叫撒该的小女孩，还是为了……我？

算了，您听不懂。我只是您的助手，廖景恢。`
      },
      {
        num: 17,
        title: '第十七封',
        subtitle: '从废弃仓库回到广府住处当夜，未寄出，纸张有被揉皱又展平的痕迹',
        date: '2005-04-22',
        time: '05:20',
        weekday: '周五',
        recipient: '缪宏谟',
        sender: '以撒',
        location: '',
        body: `……疯子。你这个彻头彻尾的疯子！

怒河的首领？我的暗杀目标？把我耍得团团转，很有趣吗？！

看着我痛苦，看着我挣扎，看着我恨你又被你吸引，你是不是很有成就感？

我用枪抵着你的心脏！那里！我索取了多少次触碰许可的地方！我问你"这里也可以吗？"！

你居然他妈的跟我说"可以"？！

你怎么敢？！你怎么敢如此轻视自己的生命？！你的命是我的！我有没有告诉过你，只有我能杀你？！在我收回之前，你不准放弃！不准不在乎！

我要你发誓。发誓你的命只属于我，发誓你再也不会轻易把它交给任何人，包括你自己！发誓你会活下去，直到我亲自来取的那一天！

还有……你还欠我一场爱情。一场完整的、没有欺骗的、只属于我和你的爱情。在你还清之前，你不许死。

听见没有！记住没有？！`
      },
      {
        num: 18,
        title: '第十八封',
        subtitle: '从受害者村庄山顶回来后，未寄出',
        date: '2005-04-30',
        time: '05:20',
        weekday: '周六',
        recipient: '缪',
        sender: '以撒',
        location: '你视线之外',
        body: `你又问我是从哪里突然出现的。

还是那个答案：你的视线之外。

无论你是在光芒万丈的演讲台，还是深陷于仇恨的泥沼，我都在你看不到的阴影里。

以前是看着你，现在是守着你。

我不允许你再这样作践自己去赎罪。那些痛苦和骂名，不是你一个人该扛的。我们要一起把莱诺家族拉下来，那之后，你的罪与罚，由我来裁定。

在那之前，你的命是我的。你要好好活着，把它养得好好的，然后等我来取。

别忘了，你还欠我一场爱情。我要你好好活着，才能还得起。`
      },
      {
        num: 19,
        title: '第十九封',
        subtitle: '复仇战了木屐，未写完，也未寄出，可能被撕去塞进领口，或留在木屋的桌上',
        date: '2005-05-01',
        time: '05:20',
        weekday: '周日',
        recipient: '缪宏谟',
        sender: '以撒',
        location: '',
        body: `今晚的火很亮，照得每个人脸上都毛茸茸的。奥丁还在嘴硬，说那些烂俗情话根本不好笑，但保罗学他说话时，他耳朵尖都红了。黛利拉擦着她的枪，程走柳和程怀济看着地图，蒋伯笃靠在阴影里，像一把收在鞘里的刀。

我们看起来……真像一群只是出来野营的疯子或朋友。

我拿出了那枚戒指。花采的，羽毛的，铜的。我把我积攒的所有"自由"都给了你。你戴上的时候，手指微微发抖。我以为你会拒绝，但你没有。你只是轻轻地说："以撒，太沉重了。"

当然沉重。那里面不止是镣和石头，那是我过去五年里每一个想起你有诚和最终学会的放手。是我全部的自己。

奥丁看我给你戴戒指，眼神复杂。他后来搂住我的脖子，把我勒得快要窒息，在我耳边只能听到声音："小骗子，长大了，长大了。你给我跑快点，别回头。"

我知道他什么意思。这条命，是他们一个个用命铺路，才活到今天。

明天，不是结束，是偿还。

我忽然想起很多事。想起他第一次拉着我在白桦林里疯跑，耳机里少得要死，他喊着"生笨呢！"。想起祖母把小方块纸币塞进我口袋。想起魏巍把"想笑就笑"放进我手里。想起你第一次给我的路灯。

这条被诅咒的路上，原来也堆满了别人给我的爱。

缪宏谟，如果明天之后，我还有机会问你，我会问：等一切结束，我们能不能真的去荒原上散一次？就我们两个，没有仇恨，没有追杀，跑到日出，跑到力竭，然后一起倒下大笑。

但如果……没有如果。

这封信大概永远也写不完，也永远不会给你看到。

……保重。`
      },
      {
        num: 20,
        title: '第二十封',
        subtitle: '纪念日闹剧结束，从医院醒来后，未寄出',
        date: '2005-05-20',
        time: '05:20',
        weekday: '周五',
        recipient: '缪宏谟',
        sender: '以撒',
        location: '',
        body: `"想笑就笑"死了。它用身体裹住我，替我挡了爆炸和火。

它那么傻，傻到听不懂人话，傻到只知道用命来报恩。

你说，道别是为了下次更好的相遇。
可我不想和它相遇，我只想它活过来。我只想它还是那条傻傻的、在我大笑时会好奇地探头探脑的小蛇。

你让我在你面前哭，在你面前笑。

那我就哭了，也笑了。
样子很难看，很扭曲。

谢谢你。谢谢你还肯抱住这样的我。

我最后的一个伙伴，也没有了。`
      },
      {
        num: 21,
        title: '第二十一封',
        subtitle: '沙漠开车之后，日出之前，未寄出',
        date: '2005-06-20',
        time: '05:20',
        weekday: '周一',
        recipient: '缪宏谟',
        sender: '以撒',
        location: '',
        body: `对不起。

对不起，我不知道失去眼睛，是这么难的一件事，连我这样的人，也会摔好几跤。

我不知道黑暗是这么具体的东西，它会吞掉方向，吞掉安全感，吞掉一个人所有的从容。我不知道平常走路需要那么大的勇气，会被一块小小的石头绊倒，会因为找不到杯子的位置而焦虑。

但你却能在沙漠里开车。

你握着方向盘，风吹乱你的头发，你笑得那么开心，好像不是失去了眼睛，而是拥有了整个夜空。

那一刻，我才真正明白你曾经对我说的话——"蝴蝶可以飞翔"。
你不是蝴蝶，缪宏谟，你是风本身。

我曾经恨命运待我不公，让我患上狂笑症，受尽屈辱。但现在我才知道，它把最大的艰难给了你，而你却把最大的自由教给了我。

对不起，我以前不知道。以后，我会做你的眼睛，你的拐杖，你的路。

以后你想去哪里，我都带你去。`
      },
      {
        num: 22,
        title: '第二十二封',
        subtitle: '北上逃亡途中，一个寒冷的夜晚，未寄出',
        date: '2005-12-20',
        time: '05:20',
        weekday: '周二',
        recipient: '缪宏谟',
        sender: '以撒',
        location: '一个看不见尽头的寒夜',
        body: `你说我们把逃亡当作一场不知终点的旅行。

但你的咳嗽声越来越密，像碎玻璃一样扎在我心里。你的手总是冰的，脸色苍白得像雪。你在睡梦里发抖，却在我抱紧你时，笑着说"没事"。

骗人。缪宏谟，你又在骗我。

我看着你，就像看着一盏油灯快要耗尽的灯。光还在努力亮着，但我知道，风再大一点，它就要熄灭了。

我去给你买药，去威胁医生，但我比谁都清楚，我们需要的是停下来，是休息，是一个温暖安全的家，而不是永无止境的奔逃和躲藏。

这个世界那么大，却没有能让我们容身的地方。

我甚至开始想，是不是我错了？是不是我所谓的"给你自由"，其实正在加速你的死亡？

如果你不在了，这场"旅行"对我来说，还有什么意义？

缪宏谟，再撑一撑。就快到蝴蝶谷了。你说过想看的。`
      },
      {
        num: 23,
        title: '第二十三封',
        subtitle: '北国小镇旅馆，与举报信一同封存，未寄出',
        date: '2005-12-30',
        time: '05:20',
        weekday: '周五',
        recipient: '缪宏谟',
        sender: '以撒',
        location: '',
        body: `今晚我给你买了盲人作画的颜料。付钱时，用的是祖母留下的、被她叠成小方块的钱。她到最后，都在帮我。

我答应陪你吃安眠药，一起长眠在蝴蝶谷。我骗了你。

我刚刚打给了那个追捕我们的警察，学会了怎么写举报信。我会把你塑造成被我胁迫的受害者，用我的死，换你的自由和清白。

这是我最后能给你的、也是唯一配得上你的东西——真正的自由。

你不是飞蛾，你本该是蝴蝶。你走吧，缪宏谟，飞过青山，飞到我再也不能拖累你的地方去。

这是我自己的选择。不是报复，不是赎罪。

是我爱你最后的方式。`
      },
      {
        num: 24,
        title: '第二十四封',
        subtitle: '举报日前夜，蝴蝶谷下',
        date: '2006-01-01',
        time: '05:20',
        weekday: '周日',
        recipient: '缪宏谟',
        sender: '至始至终爱你的 以撒',
        location: '',
        body: `这大概是我写给你的最后一封信。也不知道你会不会读到，这个时候，我肯定已经成了通缉令上那个"胁迫你、死有余辜的罪犯"。

我曾恨过你。恨到日夜想着如何掐死你，再杀了我自己，把我们埋在青山里。我唇钉是你给的，护腕是你缠的，看世界的窗户是你推开的。我要恨你，得先把自己剐一遍。

可直到现在，我才真正看懂你。你即是蝴蝶，也是飞蛾。我们都是扑火的那只。你用自己的光明前程和一双眼睛去赎罪，我用自己的命去换你的自由。我们俩，到底谁更疯？

你说你也是阴冷、记仇、手段肮脏的人。那我们扯平了。我不恨你了，缪宏谟。

我选择死，不是原谅你，而是成全我自己。我一生都在逃跑，但这一次，我选择冲向终点。这是我选择的、最自由的死法。

好好活着，活得光明正大，替我看看那个你承诺过的、更大的世界。

别来找我。我的视线之外，你终于自由了。`
      },
      {
        num: 25,
        title: '第二十五封',
        subtitle: '遗物中发现的一张字条',
        date: '2025-05-20',
        time: '05:20',
        weekday: '周二',
        recipient: '缪',
        sender: '以撒',
        location: '',
        body: `如果真有神明，真有另一个世界。等我到时，我会先找到奥丁和撒该，还有祖母和"想笑就笑"。然后，我会找个向阳的山坡，给你种一片花。这次，我不做标本了。你就做一只真正的蝴蝶，想来就来，想走就走。如果我看到你，我会对你笑。是真正的那种笑。`
      }
    ];

    const letters = [];

    const doodles = {
      flower_round: `<svg viewBox="0 0 60 60" width="45" height="45"><circle cx="30" cy="30" r="8" fill="#e8a8c5"/><circle cx="18" cy="22" r="7" fill="#f3c5d9"/><circle cx="42" cy="22" r="7" fill="#f3c5d9"/><circle cx="16" cy="38" r="7" fill="#f3c5d9"/><circle cx="44" cy="38" r="7" fill="#f3c5d9"/><circle cx="30" cy="48" r="7" fill="#f3c5d9"/></svg>`,
      butterfly_simple: `<svg viewBox="0 0 60 45" width="50" height="40"><path d="M30 25 Q15 10 8 15 Q20 22 30 25" fill="#f3c5d9"/><path d="M30 25 Q15 40 8 35 Q20 28 30 25" fill="#f3c5d9"/><path d="M30 25 Q45 10 52 15 Q40 22 30 25" fill="#f3c5d9"/><path d="M30 25 Q45 40 52 35 Q40 28 30 25" fill="#f3c5d9"/><path d="M30 20 L30 35" stroke="#c44" stroke-width="1.5"/><path d="M30 20 Q38 15 42 12" stroke="#c44" stroke-width="1"/><path d="M30 20 Q22 15 18 12" stroke="#c44" stroke-width="1"/></svg>`,
      raindrop_simple: `<svg viewBox="0 0 30 50" width="30" height="45"><path d="M15 5 Q25 5 25 20 Q25 40 15 48 Q5 40 5 20 Q5 5 15 5" fill="#a8c5e8"/><path d="M12 12 L18 20" stroke="#7ab8d4" stroke-width="1"/></svg>`,
      ring_simple: `<svg viewBox="0 0 50 40" width="45" height="35"><path d="M25 35 Q25 40 15 40 Q5 40 5 30 Q5 20 25 20 Q45 20 45 30 Q45 40 35 40 Q25 40 25 35" fill="#d4c4a8"/><circle cx="25" cy="18" r="6" fill="#e8d8b8"/></svg>`,
      snake_simple: `<svg viewBox="0 0 80 35" width="70" height="30"><path d="M10 20 Q25 10 40 18 Q55 26 70 15" fill="#b8c4a8" stroke="#8b9a7a" stroke-width="1.5"/><circle cx="12" cy="18" r="5" fill="#b8c4a8" stroke="#8b9a7a" stroke-width="1"/><circle cx="11" cy="17" r="1.5" fill="#fff"/><circle cx="14" cy="17" r="1.5" fill="#fff"/></svg>`,
      eye_simple: `<svg viewBox="0 0 45 30" width="45" height="30"><path d="M22 5 Q40 5 40 15 Q40 25 22 25 Q4 25 4 15 Q4 5 22 5" fill="#f3e8d9"/><circle cx="22" cy="15" r="8" fill="#d4c4a8"/><circle cx="22" cy="15" r="4" fill="#8b7a5a"/><circle cx="20" cy="13" r="1.5" fill="#fff"/></svg>`,
      flame_simple: `<svg viewBox="0 0 35 45" width="35" height="40"><path d="M17 40 L12 25 Q7 15 12 10 Q17 5 22 10 Q27 15 22 25 L17 40" fill="#f8d4b8"/><path d="M17 40 L15 28 Q14 20 17 12 Q20 20 19 28 L17 40" fill="#f8b898"/></svg>`,
      snowflake_simple: `<svg viewBox="0 0 40 40" width="40" height="40"><circle cx="20" cy="20" r="4" fill="#c8d8e8"/><path d="M20 5 L20 35" stroke="#a8c8e8" stroke-width="2"/><path d="M5 20 L35 20" stroke="#a8c8e8" stroke-width="2"/><path d="M10 10 L30 30" stroke="#a8c8e8" stroke-width="2"/><path d="M30 10 L10 30" stroke="#a8c8e8" stroke-width="2"/></svg>`,
      star_simple: `<svg viewBox="0 0 50 50" width="45" height="45"><path d="M25 5 L28 20 L45 20 L32 30 L38 45 L25 35 L12 45 L18 30 L5 20 L22 20 Z" fill="#f8e4a8"/></svg>`,
      moon_simple: `<svg viewBox="0 0 50 50" width="45" height="45"><path d="M25 45 Q10 45 10 25 Q10 5 25 5 Q40 5 40 25 Q40 18 35 15 Q30 18 30 25 Q30 38 35 35 Q40 38 40 45 Q40 45 25 45" fill="#d8c8e8"/></svg>`,
      dog_simple: `<svg viewBox="0 0 55 40" width="50" height="35"><ellipse cx="38" cy="18" rx="14" ry="12" fill="#d4c4a8"/><circle cx="34" cy="14" r="3" fill="#444"/><circle cx="44" cy="14" r="3" fill="#444"/><path d="M38 22 Q44 25 50 22" stroke="#8b7a5a" stroke-width="1"/><path d="M30 28 L30 38" stroke="#8b7a5a" stroke-width="1.5"/><path d="M48 28 L48 38" stroke="#8b7a5a" stroke-width="1.5"/><path d="M28 30 Q18 25 10 28" fill="#d4c4a8"/></svg>`,
      heart_simple: `<svg viewBox="0 0 50 50" width="45" height="45"><path d="M25 45 Q25 35 15 25 Q5 15 5 5 Q5 5 25 20 Q45 5 45 5 Q45 15 35 25 Q25 35 25 45" fill="#f8a8c8"/></svg>`,
      flower_wild_simple: `<svg viewBox="0 0 50 50" width="45" height="45"><circle cx="25" cy="15" r="6" fill="#f3c5d9"/><path d="M25 15 L25 45" stroke="#c97a4d" stroke-width="1.5"/><path d="M25 30 Q18 25 12 28" stroke="#c97a4d" stroke-width="1.2"/><path d="M25 35 Q32 30 38 33" stroke="#c97a4d" stroke-width="1.2"/></svg>`,
      car_simple: `<svg viewBox="0 0 65 35" width="60" height="30"><path d="M8 28 Q8 18 18 18 L48 18 Q58 18 58 28 L62 28 L62 32 L3 32 L3 28 Z" fill="#d4c4a8"/><circle cx="16" cy="32" r="5" fill="#fff" stroke="#8b7a5a" stroke-width="1.5"/><circle cx="48" cy="32" r="5" fill="#fff" stroke="#8b7a5a" stroke-width="1.5"/></svg>`,
      footprints_simple: `<svg viewBox="0 0 60 25" width="60" height="25"><path d="M15 20 Q10 10 15 5 Q20 10 25 20" fill="#d4c4a8"/><path d="M35 20 Q30 10 35 5 Q40 10 45 20" fill="#d4c4a8"/><path d="M55 20 Q50 10 55 5" fill="#d4c4a8"/></svg>`
    };

    const letterDoodles = {
      1: [{ type: 'doodle', svg: doodles.flower_round, x: 60, y: 320, rotate: -15 }],
      3: [{ type: 'doodle', svg: doodles.butterfly_simple, x: 550, y: 280, rotate: -20 }],
      4: [{ type: 'doodle', svg: doodles.butterfly_simple, x: 60, y: 200, rotate: 15 }],
      5: [{ type: 'doodle', svg: doodles.raindrop_simple, x: 60, y: 100, rotate: 0 }, { type: 'doodle', svg: doodles.raindrop_simple, x: 550, y: 80, rotate: 15 }],
      7: [{ type: 'doodle', svg: doodles.ring_simple, x: 550, y: 250, rotate: -10 }],
      8: [{ type: 'doodle', svg: doodles.heart_simple, x: 300, y: 350, rotate: 0 }],
      11: [{ type: 'doodle', svg: doodles.ring_simple, x: 60, y: 250, rotate: 15 }],
      12: [{ type: 'doodle', svg: doodles.eye_simple, x: 550, y: 200, rotate: 0 }],
      14: [{ type: 'doodle', svg: doodles.flower_wild_simple, x: 300, y: 350, rotate: 20 }],
      16: [{ type: 'doodle', svg: doodles.dog_simple, x: 60, y: 250, rotate: -10 }],
      19: [{ type: 'doodle', svg: doodles.flame_simple, x: 60, y: 150, rotate: 10 }, { type: 'doodle', svg: doodles.ring_simple, x: 550, y: 350, rotate: 0 }],
      20: [{ type: 'doodle', svg: doodles.snake_simple, x: 300, y: 320, rotate: -5 }],
      21: [{ type: 'doodle', svg: doodles.car_simple, x: 550, y: 250, rotate: 0 }, { type: 'doodle', svg: doodles.star_simple, x: 60, y: 150, rotate: 30 }],
      22: [{ type: 'doodle', svg: doodles.snowflake_simple, x: 60, y: 100, rotate: 0 }, { type: 'doodle', svg: doodles.snowflake_simple, x: 550, y: 80, rotate: 45 }],
      23: [{ type: 'doodle', svg: doodles.butterfly_simple, x: 300, y: 350, rotate: 0 }],
      25: [{ type: 'doodle', svg: doodles.flower_round, x: 60, y: 350, rotate: 10 }, { type: 'doodle', svg: doodles.butterfly_simple, x: 550, y: 150, rotate: 25 }, { type: 'doodle', svg: doodles.star_simple, x: 300, y: 80, rotate: 0 }]
    };

    const xiaoheiSvg = (body) => `
      <svg viewBox="0 0 600 340" width="100%" xmlns="http://www.w3.org/2000/svg" style="background:#fff;">
        <defs>
          <style>
            .hand { stroke-linecap: round; stroke-linejoin: round; }
          </style>
        </defs>
        ${body}
      </svg>
    `;

    const xiaohei = (cx, cy, scale = 1, pose = 'stand') => {
      const s = scale;
      let arms = '';
      if (pose === 'hold') {
        arms = `
          <path d="M-18 5 Q-25 0 -30 -5" stroke="#111" stroke-width="3" class="hand" fill="none"/>
          <path d="M18 5 Q25 0 30 -5" stroke="#111" stroke-width="3" class="hand" fill="none"/>
        `;
      } else if (pose === 'reach') {
        arms = `
          <path d="M-18 5 Q-30 0 -40 -8" stroke="#111" stroke-width="3" class="hand" fill="none"/>
          <path d="M18 5 Q30 0 40 -8" stroke="#111" stroke-width="3" class="hand" fill="none"/>
        `;
      } else if (pose === 'oneup') {
        arms = `
          <path d="M-18 5 Q-20 -5 -15 -15" stroke="#111" stroke-width="3" class="hand" fill="none"/>
          <path d="M18 5 Q28 0 32 -12" stroke="#111" stroke-width="3" class="hand" fill="none"/>
        `;
      } else {
        arms = `
          <path d="M-18 5 Q-22 15 -20 25" stroke="#111" stroke-width="3" class="hand" fill="none"/>
          <path d="M18 5 Q22 15 20 25" stroke="#111" stroke-width="3" class="hand" fill="none"/>
        `;
      }
      return `
        <g transform="translate(${cx}, ${cy}) scale(${s})">
          <path d="M0 -32 
                   Q22 -32 25 -15 
                   Q28 5 22 18 
                   Q16 28 0 30 
                   Q-16 28 -22 18 
                   Q-28 5 -25 -15 
                   Q-22 -32 0 -32 Z" 
                fill="#111"/>
          <circle cx="-8" cy="-8" r="4" fill="#fff"/>
          <circle cx="10" cy="-8" r="4" fill="#fff"/>
          <circle cx="-7" cy="-7" r="1.5" fill="#111"/>
          <circle cx="11" cy="-7" r="1.5" fill="#111"/>
          ${arms}
          <path d="M-12 30 L-12 50" stroke="#111" stroke-width="3.5" class="hand"/>
          <path d="M10 30 L10 50" stroke="#111" stroke-width="3.5" class="hand"/>
          <path d="M-12 50 L-18 55" stroke="#111" stroke-width="3.5" class="hand"/>
          <path d="M10 50 L16 55" stroke="#111" stroke-width="3.5" class="hand"/>
        </g>
      `;
    };

    const illustrations = {
      1: {
        svg: xiaoheiSvg(`
          <!-- 地面 -->
          <path d="M0 280 Q100 270 200 275 Q300 280 400 272 Q500 265 600 278 L600 340 L0 340 Z" 
                fill="#f5f5f0" stroke="#ccc" stroke-width="1.5" class="hand"/>
          <!-- 草丛 -->
          <g stroke="#8b9a6a" stroke-width="1.5" fill="none" class="hand">
            <path d="M50 275 Q52 265 48 258"/>
            <path d="M55 275 Q58 268 60 260"/>
            <path d="M460 270 Q463 262 465 255"/>
            <path d="M470 272 Q473 265 476 258"/>
          </g>
          <!-- 花苗 -->
          <g transform="translate(400, 200)">
            <path d="M0 80 Q-2 50 0 20" stroke="#6b8e4e" stroke-width="2" class="hand" fill="none"/>
            <path d="M0 60 Q-15 50 -20 35" stroke="#6b8e4e" stroke-width="1.5" class="hand" fill="none"/>
            <path d="M0 45 Q12 38 18 25" stroke="#6b8e4e" stroke-width="1.5" class="hand" fill="none"/>
            <circle cx="0" cy="15" r="12" fill="#f0b8c8" stroke="#d48aa0" stroke-width="1.5"/>
            <circle cx="0" cy="15" r="5" fill="#e88" stroke="#d66" stroke-width="1"/>
          </g>
          <!-- 小石子 -->
          <ellipse cx="120" cy="285" rx="8" ry="4" fill="#ddd" stroke="#bbb" stroke-width="1"/>
          <ellipse cx="520" cy="280" rx="6" ry="3" fill="#ddd" stroke="#bbb" stroke-width="1"/>
          <!-- 小黑在种花 -->
          ${xiaohei(220, 220, 1, 'hold')}
          <!-- 小黑手里的小铲子 -->
          <g transform="translate(250, 205) rotate(20)">
            <line x1="0" y1="0" x2="0" y2="30" stroke="#8b6b4a" stroke-width="2.5" class="hand"/>
            <path d="M-6 30 L6 30 L4 40 L-4 40 Z" fill="#999" stroke="#777" stroke-width="1.5"/>
          </g>
          <!-- 红色批注 -->
          <g>
            <path d="M470 80 Q460 95 450 110" stroke="#e85a5a" stroke-width="2" class="hand" fill="none"/>
            <text x="480" y="72" font-size="16" fill="#e85a5a" font-family="'Kaiti','STKaiti',serif" style="letter-spacing:1px;">等花开</text>
          </g>
          <!-- 蓝色批注 -->
          <g>
            <path d="M80 140 Q95 150 110 160" stroke="#5a8ac4" stroke-width="2" class="hand" fill="none"/>
            <text x="40" y="132" font-size="14" fill="#5a8ac4" font-family="'Kaiti','STKaiti',serif" style="letter-spacing:1px;">两年后</text>
          </g>
        `),
        position: 'after-2nd',
        caption: ''
      },
      3: {
        svg: xiaoheiSvg(`
          <!-- 窗户 -->
          <g transform="translate(80, 50)">
            <rect x="0" y="0" width="140" height="200" fill="none" stroke="#999" stroke-width="2" class="hand" rx="2"/>
            <line x1="70" y1="0" x2="70" y2="200" stroke="#999" stroke-width="1.5" class="hand"/>
            <line x1="0" y1="100" x2="140" y2="100" stroke="#999" stroke-width="1.5" class="hand"/>
            <!-- 窗外的云 -->
            <path d="M20 40 Q30 30 45 35 Q55 28 65 38 Q55 48 40 45 Q25 50 20 40 Z" fill="#f0f0f0" stroke="#ddd" stroke-width="1"/>
            <path d="M80 60 Q90 52 105 58 Q115 50 125 62 Q115 72 100 70 Q85 75 80 60 Z" fill="#f0f0f0" stroke="#ddd" stroke-width="1"/>
          </g>
          <!-- 窗帘 -->
          <path d="M60 50 Q58 120 62 200" stroke="#c9a227" stroke-width="3" class="hand" fill="none"/>
          <path d="M240 50 Q242 120 238 200" stroke="#c9a227" stroke-width="3" class="hand" fill="none"/>
          <!-- 地面 -->
          <path d="M0 290 L600 290 L600 340 L0 340 Z" fill="#f8f8f5" stroke="#ddd" stroke-width="1"/>
          <!-- 地毯 -->
          <ellipse cx="350" cy="285" rx="120" ry="15" fill="none" stroke="#c9a227" stroke-width="1.5" stroke-dasharray="5,3"/>
          <!-- 小黑站在窗前 -->
          ${xiaohei(350, 230, 1, 'oneup')}
          <!-- 飞舞的蝴蝶 -->
          <g transform="translate(480, 100)">
            <path d="M0 0 Q-18 -12 -22 -3 Q-12 5 0 0" fill="#f0c8d8" stroke="#d48aa0" stroke-width="1.5"/>
            <path d="M0 0 Q18 -12 22 -3 Q12 5 0 0" fill="#f0c8d8" stroke="#d48aa0" stroke-width="1.5"/>
            <path d="M0 0 Q-15 8 -18 18 Q-8 12 0 0" fill="#f0c8d8" stroke="#d48aa0" stroke-width="1.5"/>
            <path d="M0 0 Q15 8 18 18 Q8 12 0 0" fill="#f0c8d8" stroke="#d48aa0" stroke-width="1.5"/>
            <line x1="0" y1="-5" x2="0" y2="8" stroke="#333" stroke-width="1.5"/>
            <path d="M0 -5 Q-5 -12 -8 -15" stroke="#333" stroke-width="1"/>
            <path d="M0 -5 Q5 -12 8 -15" stroke="#333" stroke-width="1"/>
          </g>
          <!-- 桌子上的杯子 -->
          <g transform="translate(500, 250)">
            <path d="M0 0 L25 0 L23 30 Q12 35 2 30 Z" fill="#f5f5f5" stroke="#999" stroke-width="1.5" class="hand"/>
            <path d="M25 8 Q35 10 33 20 Q30 25 25 22" fill="none" stroke="#999" stroke-width="1.5" class="hand"/>
            <path d="M5 -5 Q12 -8 20 -5" stroke="#aaa" stroke-width="1" fill="none"/>
          </g>
          <!-- 橙色批注 -->
          <g>
            <path d="M420 160 Q400 175 380 190" stroke="#e8a23a" stroke-width="2" class="hand" fill="none"/>
            <text x="430" y="152" font-size="15" fill="#e8a23a" font-family="'Kaiti','STKaiti',serif" style="letter-spacing:1px;">望眼欲穿</text>
          </g>
        `),
        position: 'after-3rd',
        caption: ''
      },
      4: {
        svg: xiaoheiSvg(`
          <!-- 桌子 -->
          <rect x="100" y="220" width="400" height="15" fill="#d4c4a8" stroke="#b0a080" stroke-width="1.5" class="hand" rx="2"/>
          <rect x="120" y="235" width="10" height="60" fill="#d4c4a8" stroke="#b0a080" stroke-width="1.5"/>
          <rect x="470" y="235" width="10" height="60" fill="#d4c4a8" stroke="#b0a080" stroke-width="1.5"/>
          <!-- 标本盒 -->
          <g transform="translate(350, 170)">
            <rect x="0" y="0" width="100" height="70" fill="#fafafa" stroke="#888" stroke-width="2" class="hand" rx="2"/>
            <!-- 标本针 -->
            <line x1="50" y1="10" x2="50" y2="25" stroke="#666" stroke-width="1.5"/>
            <circle cx="50" cy="10" r="3" fill="#888"/>
            <!-- 蝴蝶标本 -->
            <g transform="translate(50, 40)">
              <path d="M0 0 Q-25 -18 -30 -5 Q-15 8 0 2" fill="#e8d8c8" stroke="#b09080" stroke-width="1.5"/>
              <path d="M0 0 Q25 -18 30 -5 Q15 8 0 2" fill="#e8d8c8" stroke="#b09080" stroke-width="1.5"/>
              <path d="M0 5 Q-20 12 -22 22 Q-10 15 0 5" fill="#e8d8c8" stroke="#b09080" stroke-width="1.5"/>
              <path d="M0 5 Q20 12 22 22 Q10 15 0 5" fill="#e8d8c8" stroke="#b09080" stroke-width="1.5"/>
              <line x1="0" y1="-8" x2="0" y2="15" stroke="#555" stroke-width="1.5"/>
            </g>
            <!-- 标签 -->
            <rect x="10" y="55" width="30" height="10" fill="#fff" stroke="#999" stroke-width="0.8"/>
          </g>
          <!-- 小黑在做标本 -->
          ${xiaohei(200, 165, 0.9, 'hold')}
          <!-- 镊子 -->
          <g transform="translate(240, 140) rotate(-20)">
            <line x1="0" y1="0" x2="-5" y2="40" stroke="#777" stroke-width="2" class="hand"/>
            <line x1="3" y1="0" x2="8" y2="40" stroke="#777" stroke-width="2" class="hand"/>
            <path d="M-5 40 Q-2 45 0 40" stroke="#777" stroke-width="2" fill="none" class="hand"/>
          </g>
          <!-- 放大镜 -->
          <g transform="translate(130, 180)">
            <circle cx="0" cy="0" r="18" fill="none" stroke="#666" stroke-width="2.5" class="hand"/>
            <line x1="13" y1="13" x2="28" y2="28" stroke="#666" stroke-width="3" class="hand"/>
          </g>
          <!-- 红色批注 -->
          <g>
            <path d="M420 70 Q400 85 380 100" stroke="#e85a5a" stroke-width="2" class="hand" fill="none"/>
            <text x="430" y="62" font-size="15" fill="#e85a5a" font-family="'Kaiti','STKaiti',serif" style="letter-spacing:1px;">定格美丽</text>
          </g>
          <!-- 桌上的小蝴蝶 -->
          <g transform="translate(150, 200)">
            <path d="M0 0 Q-10 -6 -12 -1 Q-6 3 0 0" fill="#f0c8d8" stroke="#d48aa0" stroke-width="1"/>
            <path d="M0 0 Q10 -6 12 -1 Q6 3 0 0" fill="#f0c8d8" stroke="#d48aa0" stroke-width="1"/>
          </g>
        `),
        position: 'after-2nd',
        caption: ''
      },
      5: {
        svg: xiaoheiSvg(`
          <!-- 雨 -->
          <g stroke="#8ab0d8" stroke-width="1.5" class="hand">
            <line x1="60" y1="30" x2="52" y2="60"/>
            <line x1="120" y1="20" x2="112" y2="50"/>
            <line x1="180" y1="40" x2="172" y2="70"/>
            <line x1="500" y1="25" x2="492" y2="55"/>
            <line x1="550" y1="50" x2="542" y2="80"/>
            <line x1="440" y1="60" x2="432" y2="90"/>
            <line x1="80" y1="150" x2="72" y2="180"/>
            <line x1="530" y1="130" x2="522" y2="160"/>
          </g>
          <!-- 地面 -->
          <path d="M0 285 Q150 278 300 282 Q450 286 600 280 L600 340 L0 340 Z" 
                fill="#e8e8e0" stroke="#bbb" stroke-width="1.5" class="hand"/>
          <!-- 水洼 -->
          <ellipse cx="150" cy="295" rx="35" ry="6" fill="#c8d8e8" stroke="#a8c0d8" stroke-width="1"/>
          <ellipse cx="450" cy="292" rx="25" ry="5" fill="#c8d8e8" stroke="#a8c0d8" stroke-width="1"/>
          <!-- 路灯 -->
          <g transform="translate(100, 100)">
            <line x1="0" y1="0" x2="0" y2="180" stroke="#666" stroke-width="3" class="hand"/>
            <path d="M0 0 L-20 -15 L20 -15 Z" fill="#f5e6a8" stroke="#c9a227" stroke-width="1.5"/>
            <ellipse cx="0" cy="-10" rx="25" ry="8" fill="none" stroke="#f5e6a8" stroke-width="1" opacity="0.5"/>
          </g>
          <!-- 小黑撑伞 -->
          <g>
            ${xiaohei(350, 230, 1, 'hold')}
            <!-- 雨伞 -->
            <g transform="translate(350, 130)">
              <path d="M-55 0 Q0 -45 55 0" fill="#e85a5a" stroke="#c94040" stroke-width="2" class="hand"/>
              <line x1="0" y1="0" x2="0" y2="80" stroke="#666" stroke-width="2" class="hand"/>
              <path d="M-55 0 Q-40 5 -20 2 Q0 5 20 2 Q40 5 55 0" fill="none" stroke="#c94040" stroke-width="1.5"/>
              <path d="M0 80 Q5 88 0 92 Q-5 88 0 80" fill="#666" stroke="#555" stroke-width="1"/>
            </g>
          </g>
          <!-- 另一个人影 -->
          <g transform="translate(450, 240)" opacity="0.3">
            <ellipse cx="0" cy="0" rx="15" ry="18" fill="#333"/>
            <line x1="-6" y1="18" x2="-6" y2="40" stroke="#333" stroke-width="2.5"/>
            <line x1="6" y1="18" x2="6" y2="40" stroke="#333" stroke-width="2.5"/>
          </g>
          <!-- 蓝色批注 -->
          <g>
            <path d="M200 80 Q190 95 180 110" stroke="#5a8ac4" stroke-width="2" class="hand" fill="none"/>
            <text x="210" y="72" font-size="15" fill="#5a8ac4" font-family="'Kaiti','STKaiti',serif" style="letter-spacing:1px;">重逢的雨夜</text>
          </g>
        `),
        position: 'after-1st',
        caption: ''
      },
      7: {
        svg: xiaoheiSvg(`
          <!-- 桌面 -->
          <rect x="50" y="230" width="500" height="20" fill="#d4c4a8" stroke="#b0a080" stroke-width="1.5" class="hand" rx="3"/>
          <!-- 布雷诺老屋的桌子 -->
          <rect x="80" y="250" width="12" height="50" fill="#d4c4a8" stroke="#b0a080" stroke-width="1.5"/>
          <rect x="508" y="250" width="12" height="50" fill="#d4c4a8" stroke="#b0a080" stroke-width="1.5"/>
          <!-- 丝绒盒子 -->
          <g transform="translate(380, 180)">
            <rect x="0" y="0" width="80" height="50" rx="4" fill="#8b2a2a" stroke="#6b1a1a" stroke-width="2" class="hand"/>
            <rect x="5" y="5" width="70" height="18" rx="2" fill="#a83a3a" stroke="none"/>
            <ellipse cx="40" cy="35" rx="15" ry="8" fill="#f5e6a8" stroke="#c9a227" stroke-width="1.5"/>
          </g>
          <!-- 戒指 -->
          <g transform="translate(420, 160)">
            <ellipse cx="0" cy="0" rx="18" ry="12" fill="none" stroke="#c9a227" stroke-width="3" class="hand"/>
            <path d="M0 -12 L5 -5 L0 2 L-5 -5 Z" fill="#87ceeb" stroke="#5a8ac4" stroke-width="1.5"/>
            <circle cx="-2" cy="-8" r="2" fill="#fff" opacity="0.8"/>
          </g>
          <!-- 小黑看着戒指 -->
          ${xiaohei(200, 180, 0.9, 'oneup')}
          <!-- 小黑伸出的手 -->
          <path d="M280 180 Q320 170 360 165" stroke="#111" stroke-width="3" class="hand" fill="none"/>
          <!-- 红色批注 -->
          <g>
            <path d="M100 100 Q120 115 140 130" stroke="#e85a5a" stroke-width="2" class="hand" fill="none"/>
            <text x="40" y="92" font-size="15" fill="#e85a5a" font-family="'Kaiti','STKaiti',serif" style="letter-spacing:1px;">自由的代价</text>
          </g>
          <!-- 桌上的羽毛笔 -->
          <g transform="translate(130, 200) rotate(-30)">
            <path d="M0 0 Q5 20 0 50 Q-3 60 -5 70" stroke="#8b6b4a" stroke-width="2" class="hand" fill="none"/>
            <path d="M0 0 Q15 -10 10 -25 Q5 -15 0 0" fill="#f5f5f0" stroke="#ccc" stroke-width="1"/>
          </g>
        `),
        position: 'after-2nd',
        caption: ''
      },
      8: {
        svg: xiaoheiSvg(`
          <!-- 火车站台 -->
          <rect x="0" y="270" width="600" height="70" fill="#e0d8c8" stroke="#b0a080" stroke-width="1.5"/>
          <!-- 铁轨 -->
          <g stroke="#666" stroke-width="2" class="hand">
            <line x1="0" y1="300" x2="600" y2="300"/>
            <line x1="0" y1="315" x2="600" y2="315"/>
          </g>
          <!-- 枕木 -->
          <g stroke="#8b6b4a" stroke-width="3" class="hand">
            <line x1="50" y1="297" x2="50" y2="318"/>
            <line x1="150" y1="297" x2="150" y2="318"/>
            <line x1="250" y1="297" x2="250" y2="318"/>
            <line x1="350" y1="297" x2="350" y2="318"/>
            <line x1="450" y1="297" x2="450" y2="318"/>
            <line x1="550" y1="297" x2="550" y2="318"/>
          </g>
          <!-- 火车（远去的） -->
          <g transform="translate(480, 200)" opacity="0.4">
            <rect x="0" y="0" width="60" height="70" fill="#888" stroke="#666" stroke-width="2"/>
            <rect x="10" y="15" width="18" height="15" fill="#fff" stroke="#666" stroke-width="1"/>
            <rect x="32" y="15" width="18" height="15" fill="#fff" stroke="#666" stroke-width="1"/>
            <circle cx="20" cy="70" r="10" fill="#666"/>
            <circle cx="50" cy="70" r="10" fill="#666"/>
            <!-- 烟囱冒烟 -->
            <path d="M45 -10 Q50 -25 40 -35 Q30 -40 35 -50" stroke="#ccc" stroke-width="3" fill="none" opacity="0.6"/>
          </g>
          <!-- 小黑站在站台上 -->
          ${xiaohei(150, 215, 1, 'stand')}
          <!-- 小黑手里的信 -->
          <g transform="translate(175, 200)">
            <rect x="0" y="0" width="20" height="14" fill="#fff" stroke="#999" stroke-width="1"/>
            <path d="M0 0 L10 7 L20 0" fill="none" stroke="#999" stroke-width="1"/>
          </g>
          <!-- 心碎 -->
          <g transform="translate(350, 100)">
            <path d="M-25 0 Q-25 -20 -10 -25 Q0 -25 0 -10 Q0 -25 10 -25 Q25 -20 25 0 
                     Q25 15 0 35 Q-25 15 -25 0 Z" 
                  fill="none" stroke="#e85a5a" stroke-width="2.5" class="hand"/>
            <path d="M-20 5 L20 20" stroke="#e85a5a" stroke-width="2" class="hand"/>
            <path d="M-15 -5 L10 8" stroke="#e85a5a" stroke-width="1.5"/>
          </g>
          <!-- 红色批注 -->
          <g>
            <path d="M80 80 Q100 95 120 110" stroke="#e85a5a" stroke-width="2" class="hand" fill="none"/>
            <text x="40" y="72" font-size="15" fill="#e85a5a" font-family="'Kaiti','STKaiti',serif" style="letter-spacing:1px;">心碎离别</text>
          </g>
        `),
        position: 'after-3rd',
        caption: ''
      },
      12: {
        svg: xiaoheiSvg(`
          <!-- 黑暗背景 -->
          <rect x="0" y="0" width="600" height="340" fill="#1a1a1a" opacity="0.1"/>
          <!-- 地面 -->
          <path d="M0 285 Q150 280 300 283 Q450 286 600 280 L600 340 L0 340 Z" 
                fill="#f0ede8" stroke="#ccc" stroke-width="1.5"/>
          <!-- 掉落的眼镜 -->
          <g transform="translate(200, 260) rotate(-15)">
            <circle cx="0" cy="0" r="18" fill="none" stroke="#8b6b4a" stroke-width="2.5" class="hand"/>
            <circle cx="45" cy="0" r="18" fill="none" stroke="#8b6b4a" stroke-width="2.5" class="hand"/>
            <line x1="18" y1="0" x2="27" y2="0" stroke="#8b6b4a" stroke-width="2.5" class="hand"/>
          </g>
          <!-- 小黑蒙眼 -->
          <g>
            ${xiaohei(350, 220, 1, 'reach')}
            <!-- 蒙眼布 -->
            <g transform="translate(350, 180)">
              <rect x="-30" y="-8" width="60" height="16" fill="#e85a5a" stroke="#c94040" stroke-width="1.5" rx="2"/>
              <path d="M25 0 Q40 -5 50 5" stroke="#c94040" stroke-width="2" fill="none"/>
              <path d="M25 5 Q35 15 45 20" stroke="#c94040" stroke-width="2" fill="none"/>
            </g>
          </g>
          <!-- 一只大眼睛（象征失去的光明） -->
          <g transform="translate(130, 120)">
            <ellipse cx="0" cy="0" rx="50" ry="35" fill="none" stroke="#5a8ac4" stroke-width="2" class="hand"/>
            <circle cx="0" cy="0" r="20" fill="#5a8ac4" opacity="0.3"/>
            <circle cx="0" cy="0" r="10" fill="#5a8ac4"/>
            <circle cx="-5" cy="-5" r="4" fill="#fff"/>
          </g>
          <!-- 蓝色批注 -->
          <g>
            <path d="M400 80 Q380 95 360 110" stroke="#5a8ac4" stroke-width="2" class="hand" fill="none"/>
            <text x="410" y="72" font-size="15" fill="#5a8ac4" font-family="'Kaiti','STKaiti',serif" style="letter-spacing:1px;">坠入黑暗</text>
          </g>
          <!-- 地上的药瓶 -->
          <g transform="translate(500, 265)">
            <rect x="-8" y="-15" width="16" height="20" rx="2" fill="#f5f5f5" stroke="#999" stroke-width="1.5"/>
            <rect x="-8" y="-18" width="16" height="5" fill="#ddd" stroke="#999" stroke-width="1"/>
          </g>
        `),
        position: 'after-2nd',
        caption: ''
      },
      16: {
        svg: xiaoheiSvg(`
          <!-- 地面 -->
          <path d="M0 285 Q150 280 300 282 Q450 286 600 280 L600 340 L0 340 Z" 
                fill="#f5f2e8" stroke="#ccc" stroke-width="1.5" class="hand"/>
          <!-- 小径 -->
          <path d="M0 290 Q150 285 300 288 Q450 290 600 285" stroke="#ddd" stroke-width="30" fill="none" opacity="0.5"/>
          <!-- 路边的草 -->
          <g stroke="#8b9a6a" stroke-width="1.5" fill="none" class="hand">
            <path d="M50 278 Q52 268 48 260"/>
            <path d="M55 278 Q58 270 60 262"/>
            <path d="M550 275 Q553 267 555 260"/>
          </g>
          <!-- 导盲犬 -->
          <g transform="translate(350, 245)">
            <ellipse cx="0" cy="-12" rx="45" ry="28" fill="none" stroke="#c9a227" stroke-width="2.5" class="hand"/>
            <ellipse cx="-25" cy="-18" rx="12" ry="14" fill="none" stroke="#c9a227" stroke-width="2.5" class="hand"/>
            <circle cx="-28" cy="-20" r="2.5" fill="#c9a227"/>
            <circle cx="-20" cy="-20" r="2.5" fill="#c9a227"/>
            <path d="M-35 -12 Q-45 -8 -50 -5" stroke="#c9a227" stroke-width="2.5" class="hand" fill="none"/>
            <path d="M25 -10 Q35 -15 45 -20" stroke="#c9a227" stroke-width="2.5" class="hand" fill="none"/>
            <line x1="-25" y1="16" x2="-25" y2="32" stroke="#c9a227" stroke-width="3" class="hand"/>
            <line x1="25" y1="16" x2="25" y2="32" stroke="#c9a227" stroke-width="3" class="hand"/>
            <!-- 导盲鞍 -->
            <rect x="-20" y="-8" width="35" height="12" fill="#e85a5a" stroke="#c94040" stroke-width="1.5" rx="2"/>
          </g>
          <!-- 牵引绳 -->
          <path d="M305 240 Q280 230 250 235" stroke="#c94040" stroke-width="2" class="hand" fill="none"/>
          <!-- 小黑被导盲犬领着 -->
          ${xiaohei(220, 225, 0.9, 'hold')}
          <!-- 盲杖 -->
          <path d="M180 260 Q175 280 178 290" stroke="#fff" stroke-width="3" class="hand"/>
          <path d="M180 260 Q175 280 178 290" stroke="#e85a5a" stroke-width="2" stroke-dasharray="8,6" fill="none"/>
          <!-- 橙色批注 -->
          <g>
            <path d="M450 80 Q430 95 410 110" stroke="#e8a23a" stroke-width="2" class="hand" fill="none"/>
            <text x="460" y="72" font-size="15" fill="#e8a23a" font-family="'Kaiti','STKaiti',serif" style="letter-spacing:1px;">黑暗中的光</text>
          </g>
          <!-- 小石子 -->
          <ellipse cx="100" cy="290" rx="6" ry="3" fill="#ddd" stroke="#bbb" stroke-width="1"/>
          <ellipse cx="480" cy="288" rx="8" ry="4" fill="#ddd" stroke="#bbb" stroke-width="1"/>
        `),
        position: 'after-2nd',
        caption: ''
      },
      19: {
        svg: xiaoheiSvg(`
          <!-- 夜晚的森林 -->
          <rect x="0" y="0" width="600" height="340" fill="#1a1a2e" opacity="0.15"/>
          <!-- 地面 -->
          <path d="M0 280 Q150 275 300 278 Q450 282 600 276 L600 340 L0 340 Z" 
                fill="#3a3a4a" stroke="#555" stroke-width="1.5" class="hand"/>
          <!-- 篝火 -->
          <g transform="translate(150, 200)">
            <!-- 木柴 -->
            <line x1="-25" y1="75" x2="25" y2="80" stroke="#8b6b4a" stroke-width="5" class="hand" transform="rotate(-5)"/>
            <line x1="-20" y1="78" x2="30" y2="75" stroke="#6b4a2a" stroke-width="4" class="hand" transform="rotate(8)"/>
            <!-- 火焰 -->
            <path d="M0 70 Q-20 50 -15 30 Q-10 10 0 0 Q10 10 15 30 Q20 50 0 70 Z" 
                  fill="#f5c842" stroke="#e8a23a" stroke-width="2" class="hand"/>
            <path d="M0 60 Q-12 45 -8 28 Q-5 15 0 10 Q5 15 8 28 Q12 45 0 60 Z" 
                  fill="#e85a5a" stroke="#d04040" stroke-width="1.5"/>
            <path d="M0 45 Q-6 35 -4 22 Q-2 15 0 12 Q2 15 4 22 Q6 35 0 45 Z" fill="#fff8e0"/>
            <!-- 火光 -->
            <circle cx="0" cy="50" r="60" fill="#f5c842" opacity="0.15"/>
          </g>
          <!-- 小黑坐在篝火旁 -->
          ${xiaohei(350, 230, 0.9, 'hold')}
          <!-- 小黑手里的戒指 -->
          <g transform="translate(380, 200)">
            <ellipse cx="0" cy="0" rx="15" ry="10" fill="none" stroke="#c9a227" stroke-width="2.5" class="hand"/>
            <circle cx="0" cy="-10" r="5" fill="#87ceeb" stroke="#5a8ac4" stroke-width="1"/>
          </g>
          <!-- 远处的树 -->
          <g stroke="#2a2a3a" stroke-width="2" fill="none" class="hand">
            <line x1="50" y1="150" x2="50" y2="275"/>
            <path d="M50 150 Q30 170 35 200"/>
            <path d="M50 160 Q70 180 65 210"/>
            <line x1="530" y1="180" x2="530" y2="275"/>
            <path d="M530 180 Q510 200 515 225"/>
            <path d="M530 190 Q550 210 545 230"/>
          </g>
          <!-- 红色批注 -->
          <g>
            <path d="M400 60 Q380 75 360 90" stroke="#e85a5a" stroke-width="2" class="hand" fill="none"/>
            <text x="410" y="52" font-size="15" fill="#e85a5a" font-family="'Kaiti','STKaiti',serif" style="letter-spacing:1px;">复仇的火焰</text>
          </g>
          <!-- 星星 -->
          <g fill="#fff">
            <circle cx="100" cy="50" r="1.5"/>
            <circle cx="250" cy="30" r="1"/>
            <circle cx="450" cy="45" r="1.5"/>
            <circle cx="550" cy="80" r="1"/>
          </g>
        `),
        position: 'after-2nd',
        caption: ''
      },
      20: {
        svg: xiaoheiSvg(`
          <!-- 草地 -->
          <path d="M0 275 Q150 270 300 273 Q450 276 600 270 L600 340 L0 340 Z" 
                fill="#e8e0c8" stroke="#b0a880" stroke-width="1.5" class="hand"/>
          <!-- 草丛 -->
          <g stroke="#6b8e4e" stroke-width="1.5" fill="none" class="hand">
            <path d="M80 270 Q82 260 78 250"/>
            <path d="M85 270 Q88 262 90 252"/>
            <path d="M78 272 Q75 262 70 255"/>
            <path d="M480 268 Q483 258 485 250"/>
            <path d="M490 270 Q493 260 495 250"/>
          </g>
          <!-- 蛇 -->
          <g transform="translate(350, 240)">
            <path d="M-100 30 Q-70 5 -40 15 Q-10 25 20 5 Q40 -10 70 0 Q90 8 100 -5" 
                  fill="none" stroke="#5a7a3a" stroke-width="4" class="hand"/>
            <path d="M-100 30 Q-70 5 -40 15 Q-10 25 20 5 Q40 -10 70 0 Q90 8 100 -5" 
                  fill="none" stroke="#7a9a5a" stroke-width="2" stroke-dasharray="4,4"/>
            <!-- 蛇头 -->
            <ellipse cx="100" cy="-5" rx="12" ry="10" fill="#5a7a3a" stroke="#4a6a2a" stroke-width="1.5"/>
            <circle cx="103" cy="-8" r="2.5" fill="#fff"/>
            <circle cx="103" cy="-8" r="1" fill="#111"/>
            <!-- 蛇信 -->
            <path d="M112 -5 L120 -3 M112 -5 L120 -7" stroke="#e85a5a" stroke-width="1.5" class="hand"/>
          </g>
          <!-- 小黑看着蛇 -->
          ${xiaohei(180, 220, 0.9, 'stand')}
          <!-- 眼泪 -->
          <path d="M170 200 Q168 210 170 215" stroke="#8ab0d8" stroke-width="2" fill="none" class="hand"/>
          <!-- "想笑就笑"的牌子 -->
          <g transform="translate(450, 100)">
            <path d="M-50 0 L50 0 L50 30 L-50 30 Z" fill="#f5f5f0" stroke="#999" stroke-width="2" class="hand"/>
            <text x="-40" y="22" font-size="16" fill="#333" font-family="'Kaiti','STKaiti',serif">想笑就笑</text>
            <!-- 木牌支架 -->
            <line x1="0" y1="30" x2="0" y2="60" stroke="#8b6b4a" stroke-width="4" class="hand"/>
          </g>
          <!-- 红色批注 -->
          <g>
            <path d="M80 80 Q100 95 120 110" stroke="#e85a5a" stroke-width="2" class="hand" fill="none"/>
            <text x="40" y="72" font-size="15" fill="#e85a5a" font-family="'Kaiti','STKaiti',serif" style="letter-spacing:1px;">他的牺牲</text>
          </g>
        `),
        position: 'after-2nd',
        caption: ''
      },
      21: {
        svg: xiaoheiSvg(`
          <!-- 沙漠 -->
          <path d="M0 260 Q150 240 300 255 Q450 270 600 250 L600 340 L0 340 Z" 
                fill="#e8d8b0" stroke="#c9a878" stroke-width="1.5" class="hand"/>
          <!-- 沙丘 -->
          <path d="M0 270 Q100 250 200 260 Q300 270 400 255 Q500 240 600 260" 
                fill="none" stroke="#d4c090" stroke-width="2" class="hand"/>
          <!-- 仙人掌 -->
          <g transform="translate(80, 200)">
            <path d="M0 60 L0 0 Q0 -15 10 -15 Q20 -15 20 0 L20 60" fill="#6b8e4e" stroke="#5a7a3a" stroke-width="2"/>
            <path d="M0 20 Q-15 15 -18 5 Q-20 15 -15 25" fill="#6b8e4e" stroke="#5a7a3a" stroke-width="2"/>
            <path d="M0 40 Q15 35 18 25 Q20 35 15 45" fill="#6b8e4e" stroke="#5a7a3a" stroke-width="2"/>
          </g>
          <!-- 汽车 -->
          <g transform="translate(320, 210)">
            <path d="M-80 10 L-60 -30 L80 -30 L100 10 L90 35 L-90 35 Z" 
                  fill="#8b6b4a" stroke="#6b4a2a" stroke-width="2.5" class="hand"/>
            <!-- 车窗 -->
            <rect x="-55" y="-25" width="45" height="25" fill="#a8c5e8" stroke="#6b4a2a" stroke-width="1.5"/>
            <rect x="20" y="-25" width="50" height="25" fill="#a8c5e8" stroke="#6b4a2a" stroke-width="1.5"/>
            <!-- 轮子 -->
            <circle cx="-55" cy="35" r="18" fill="#333" stroke="#222" stroke-width="2"/>
            <circle cx="-55" cy="35" r="8" fill="#666"/>
            <circle cx="65" cy="35" r="18" fill="#333" stroke="#222" stroke-width="2"/>
            <circle cx="65" cy="35" r="8" fill="#666"/>
            <!-- 小黑在开车 -->
            ${xiaohei(-20, -5, 0.5, 'hold')}
          </g>
          <!-- 扬起的沙尘 -->
          <g opacity="0.4" fill="#d4c090">
            <circle cx="180" cy="250" r="8"/>
            <circle cx="160" cy="255" r="6"/>
            <circle cx="170" cy="245" r="5"/>
          </g>
          <!-- 星星（傍晚） -->
          <g fill="#e8a23a">
            <path d="M80 60 L83 52 L86 60 L83 63 Z" opacity="0.9"/>
            <path d="M500 40 L503 32 L506 40 L503 43 Z" opacity="0.8"/>
            <path d="M550 90 L553 82 L556 90 L553 93 Z" opacity="0.7"/>
            <path d="M150 100 L153 92 L156 100 L153 103 Z" opacity="0.6"/>
          </g>
          <!-- 橙色批注 -->
          <g>
            <path d="M430 120 Q410 135 390 150" stroke="#e8a23a" stroke-width="2" class="hand" fill="none"/>
            <text x="440" y="112" font-size="15" fill="#e8a23a" font-family="'Kaiti','STKaiti',serif" style="letter-spacing:1px;">一路向西</text>
          </g>
        `),
        position: 'after-3rd',
        caption: ''
      },
      22: {
        svg: xiaoheiSvg(`
          <!-- 雪地 -->
          <path d="M0 280 Q150 275 300 278 Q450 282 600 276 L600 340 L0 340 Z" 
                fill="#f0f5fa" stroke="#c8d8e8" stroke-width="1.5" class="hand"/>
          <!-- 雪花 -->
          <g stroke="#8ab0d8" stroke-width="1.5" class="hand" fill="none">
            <line x1="100" y1="40" x2="100" y2="60"/>
            <line x1="90" y1="50" x2="110" y2="50"/>
            <line x1="93" y1="43" x2="107" y2="57"/>
            <line x1="107" y1="43" x2="93" y2="57"/>
            
            <line x1="200" y1="60" x2="200" y2="80"/>
            <line x1="190" y1="70" x2="210" y2="70"/>
            <line x1="193" y1="63" x2="207" y2="77"/>
            <line x1="207" y1="63" x2="193" y2="77"/>
            
            <line x1="450" y1="30" x2="450" y2="50"/>
            <line x1="440" y1="40" x2="460" y2="40"/>
            <line x1="443" y1="33" x2="457" y2="47"/>
            <line x1="457" y1="33" x2="443" y2="47"/>
            
            <line x1="520" y1="80" x2="520" y2="100"/>
            <line x1="510" y1="90" x2="530" y2="90"/>
            <line x1="513" y1="83" x2="527" y2="97"/>
            <line x1="527" y1="83" x2="513" y2="97"/>
            
            <line x1="80" y1="150" x2="80" y2="170"/>
            <line x1="70" y1="160" x2="90" y2="160"/>
            
            <line x1="500" y1="140" x2="500" y2="160"/>
            <line x1="490" y1="150" x2="510" y2="150"/>
          </g>
          <g fill="#c8d8e8">
            <circle cx="150" cy="90" r="2"/>
            <circle cx="300" cy="50" r="1.5"/>
            <circle cx="380" cy="100" r="2"/>
            <circle cx="250" cy="130" r="1.5"/>
            <circle cx="550" cy="180" r="2"/>
            <circle cx="50" cy="200" r="1.5"/>
          </g>
          <!-- 枯树 -->
          <g stroke="#8b7355" stroke-width="2" fill="none" class="hand">
            <line x1="50" y1="280" x2="50" y2="180"/>
            <path d="M50 200 Q30 190 20 175"/>
            <path d="M50 210 Q70 200 80 185"/>
            <path d="M50 220 Q35 215 25 200"/>
            <line x1="530" y1="280" x2="530" y2="200"/>
            <path d="M530 220 Q510 210 500 195"/>
            <path d="M530 230 Q550 220 560 205"/>
          </g>
          <!-- 小黑在雪中走 -->
          ${xiaohei(280, 230, 0.95, 'oneup')}
          <!-- 围巾 -->
          <path d="M260 200 Q270 195 280 200 Q290 195 300 200 L298 215 Q280 210 262 215 Z" 
                fill="#e85a5a" stroke="#c94040" stroke-width="1.5"/>
          <!-- 脚印 -->
          <g fill="#c8d8e8" stroke="#a8c0d8" stroke-width="1">
            <ellipse cx="200" cy="285" rx="5" ry="3"/>
            <ellipse cx="190" cy="282" rx="5" ry="3"/>
            <ellipse cx="175" cy="288" rx="5" ry="3"/>
            <ellipse cx="165" cy="285" rx="5" ry="3"/>
          </g>
          <!-- 蓝色批注 -->
          <g>
            <path d="M400 70 Q380 85 360 100" stroke="#5a8ac4" stroke-width="2" class="hand" fill="none"/>
            <text x="410" y="62" font-size="15" fill="#5a8ac4" font-family="'Kaiti','STKaiti',serif" style="letter-spacing:1px;">寒夜独行</text>
          </g>
        `),
        position: 'after-2nd',
        caption: ''
      },
      25: {
        svg: xiaoheiSvg(`
          <!-- 开满花的山坡 -->
          <path d="M0 280 Q150 250 300 260 Q450 270 600 245 L600 340 L0 340 Z" 
                fill="#e8e0c8" stroke="#b0a880" stroke-width="1.5" class="hand"/>
          <!-- 更多花 -->
          <g>
            <circle cx="100" cy="230" r="10" fill="#f0b8c8" stroke="#d48aa0" stroke-width="1.5"/>
            <circle cx="100" cy="230" r="4" fill="#e88" stroke="#d66" stroke-width="1"/>
            <line x1="100" y1="240" x2="100" y2="278" stroke="#6b8e4e" stroke-width="1.5"/>
            
            <circle cx="180" cy="250" r="8" fill="#f0c8d8" stroke="#d48aa0" stroke-width="1.5"/>
            <circle cx="180" cy="250" r="3" fill="#e88" stroke="#d66" stroke-width="1"/>
            <line x1="180" y1="258" x2="180" y2="280" stroke="#6b8e4e" stroke-width="1.5"/>
            
            <circle cx="260" cy="225" r="12" fill="#f8d8e8" stroke="#d48aa0" stroke-width="1.5"/>
            <circle cx="260" cy="225" r="5" fill="#e88" stroke="#d66" stroke-width="1"/>
            <line x1="260" y1="237" x2="260" y2="280" stroke="#6b8e4e" stroke-width="2"/>
            
            <circle cx="420" cy="240" r="10" fill="#f0b8c8" stroke="#d48aa0" stroke-width="1.5"/>
            <circle cx="420" cy="240" r="4" fill="#e88" stroke="#d66" stroke-width="1"/>
            <line x1="420" y1="250" x2="420" y2="278" stroke="#6b8e4e" stroke-width="1.5"/>
            
            <circle cx="500" cy="220" r="11" fill="#f8d8e8" stroke="#d48aa0" stroke-width="1.5"/>
            <circle cx="500" cy="220" r="4.5" fill="#e88" stroke="#d66" stroke-width="1"/>
            <line x1="500" y1="231" x2="500" y2="278" stroke="#6b8e4e" stroke-width="1.5"/>
            
            <circle cx="60" cy="260" r="7" fill="#f0c8d8" stroke="#d48aa0" stroke-width="1"/>
            <circle cx="560" cy="255" r="8" fill="#f0b8c8" stroke="#d48aa0" stroke-width="1"/>
            <circle cx="350" cy="260" r="6" fill="#f8d8e8" stroke="#d48aa0" stroke-width="1"/>
          </g>
          <!-- 草 -->
          <g stroke="#6b8e4e" stroke-width="1.5" fill="none" class="hand">
            <path d="M130 275 Q132 265 128 258"/>
            <path d="M135 275 Q138 267 140 260"/>
            <path d="M320 272 Q323 264 325 257"/>
            <path d="M460 270 Q463 262 465 255"/>
          </g>
          <!-- 小黑站在花丛中 -->
          ${xiaohei(300, 220, 0.9, 'reach')}
          <!-- 飞舞的蝴蝶 -->
          <g transform="translate(450, 80)">
            <path d="M0 0 Q-20 -14 -24 -3 Q-13 6 0 0" fill="#f0c8d8" stroke="#d48aa0" stroke-width="1.5"/>
            <path d="M0 0 Q20 -14 24 -3 Q13 6 0 0" fill="#f0c8d8" stroke="#d48aa0" stroke-width="1.5"/>
            <path d="M0 0 Q-17 9 -20 20 Q-9 14 0 0" fill="#f0c8d8" stroke="#d48aa0" stroke-width="1.5"/>
            <path d="M0 0 Q17 9 20 20 Q9 14 0 0" fill="#f0c8d8" stroke="#d48aa0" stroke-width="1.5"/>
            <line x1="0" y1="-6" x2="0" y2="10" stroke="#333" stroke-width="1.5"/>
            <path d="M0 -6 Q-6 -13 -10 -16" stroke="#333" stroke-width="1"/>
            <path d="M0 -6 Q6 -13 10 -16" stroke="#333" stroke-width="1"/>
          </g>
          <g transform="translate(150, 100)" opacity="0.8">
            <path d="M0 0 Q-15 -10 -18 -2 Q-10 4 0 0" fill="#f0b8c8" stroke="#d48aa0" stroke-width="1.5"/>
            <path d="M0 0 Q15 -10 18 -2 Q10 4 0 0" fill="#f0b8c8" stroke="#d48aa0" stroke-width="1.5"/>
            <line x1="0" y1="-4" x2="0" y2="8" stroke="#333" stroke-width="1"/>
          </g>
          <!-- 红色批注 -->
          <g>
            <path d="M80 60 Q100 75 120 90" stroke="#e85a5a" stroke-width="2" class="hand" fill="none"/>
            <text x="40" y="52" font-size="15" fill="#e85a5a" font-family="'Kaiti','STKaiti',serif" style="letter-spacing:1px;">来世再相逢</text>
          </g>
          <!-- 云 -->
          <path d="M450 50 Q470 40 490 48 Q500 42 515 52 Q505 62 485 60 Q465 65 450 50 Z" 
                fill="#f5f5f5" stroke="#ddd" stroke-width="1" opacity="0.6"/>
        `),
        position: 'after-2nd',
        caption: ''
      }
    };

    const letterIllustrations = {};
    for (const [num, illus] of Object.entries(illustrations)) {
      letterIllustrations[num] = {
        svg: illus.svg,
        position: illus.position,
        caption: illus.caption
      };
    }

    for (let i = 0; i < letterData.length; i++) {
      const data = letterData[i];
      const date = new Date(data.date);

      const content = letterDoodles[data.num] || [];

      const letter = {
        id: `brenuo-${data.num}`,
        mailboxId: 'mailbox-brenuo',
        title: data.title,
        subtitle: data.subtitle,
        sender: data.sender,
        recipient: data.recipient,
        paperStyle: 'vintage-literary',
        bgmUrl: '',
        date: data.date,
        time: data.time,
        weekday: data.weekday,
        location: data.location,
        letterTitle: data.subtitle,
        bodyText: data.body,
        content: content,
        illustration: letterIllustrations[data.num] || null,
        createdAt: date.getTime(),
        updatedAt: date.getTime()
      };
      letters.push(letter);
    }

    return letters;
  },

  generateDaliangLetters() {
    const letterData = [
      {
        num: 1,
        title: '第一封',
        subtitle: '锦荷消失后两月有余。新居初成，院中槐树今日亲手栽下。纸边沾了泥土，墨迹因手汗微微洇开。未寄出。',
        date: '承平十二年-03-17',
        time: '巳时',
        weekday: '',
        recipient: '吾妻锦荷',
        sender: '慕风',
        location: '新居院中',
        body: `你走的那天，院子里的杏花刚落完。我记得。因为你说："杏花谢了就是春天了。"——这句话我翻来覆去想了几十遍，每一遍都觉得你是在同我告别，每一遍又都觉得不是。

你说过你会回来的。

我信了。

今日院中落成。溪水从东墙引入，经石桥折向西廊，水质清冽，我试过了，和你描述的一模一样。秋千挂在南角的老榆树下，绳结用的是你教我的法子——三绕两扣，不会松。糖糕我买不来你做的那个味道，但灶台已经垒好了，柴也备了半屋，等你回来，我再求你做一次。

院中央我留了一块空地。今日辰时，我亲自从山里移了一棵槐树苗来，种在了那里。土很松，根扎得应该不深。我在树旁垒了一圈矮石，免得被人踩了去。

你说过的——"日后有座自己的院子，门前要有一条溪，院中要有一棵大树，夏天好乘凉。"

我全记着。一样一样，全做了。

你走之前那个晚上，我们坐在你娘家的廊下说话。你说："慕风，我想要一扇能看见月光的窗。"——那扇窗我也留了。朝南，窗台宽一尺，你若坐在上面，能看见院子里所有东西。

现在院子里什么都有了。溪有了，树有了，秋千有了。灶台有了，窗有了。连那只你从路边捡回来的狸花猫也有了——它瘦了不少，但还认人，每日蹲在门口望。

唯独缺一个人。

锦荷，你在何处？

我不信你不要这个家了。你亲手挑的窗帘颜色，你亲手铺的那块灶前草垫——你若不要了，为何走之前要把这些事做得这样仔细？

那夜你说"等我"。我当时没问等多久。我该问的。是我没问。如今两月了，每一个来叩门的人，我都以为是。每一阵风吹响门帘，我都以为是。

你不在，这个院子就只是一座房子。有水，有树，有房，有墙——没有家。

我写了这么长，才发现自己只是把你说的话复述了一遍。你说的每一句话我都记得，每一个字都刻着。可是你若不回来，这些字就是刀，刻在哪里，哪里就疼。

槐树种下去了。今日春分刚过，雨水充足，应当能活。

你回来的时候，它或许已经长高了。

锦荷——我在等你。`
      },
      {
        num: 2,
        title: '第二封',
        subtitle: '她归来十日后永别。写于神庙之中，牌位前烛泪滴落纸面，蜡痕三处。信中多处涂改，墨迹浓重，可见落笔极重，似是写了几行便划去、撕去、又重新开始。纸面破损，仅余可辨认之片段。未寄出。',
        date: '承平二十二年-06-24',
        time: '丑时',
        weekday: '',
        recipient: '吾妻锦荷',
        sender: '方慕风',
        location: '神庙',
        body: `锦荷：

你回来了。

我等了十年。十年。三千六百五十天。每一天我去院子里看那棵槐树，看它长了一寸、两寸、高了半尺——十年，它已经亭亭如盖了。归有光写："庭有槐树，吾妻死之年所手植也，今已亭亭如盖矣。"他等的是一棵长成的树。我等的是你。

你回来了。

可是只有十天。

你从何处归来，我至今不知。你身上带着一种我从没见过的气息——不是香，不是药，是一种更深、更古老的东西。像石头被火烧过后残留的余温。你瘦了很多。你的手指凉得像冬天的溪水。你叫我的名字时，声音像是隔了一层雾。

你说："慕风，我没有家。"

你说这话的时候，站在我院子里。溪水在流，槐树在荫，秋千在晃，猫在脚边绕。你站在这一切之中——我们说好的一切——你说，你没有家。

我听见了。每一个字都听见了。可我到今天才明白你在说什么。

你是说：我建的不是家。

你是说：没有你的地方，不是家。

你是说：这十年我垒的每一块砖、引的每一寸水、种的每一棵树——在你眼里，不过是一座精致的空屋。

我不是在怪你。我是在怪我自己。我怎么就没想到呢？家不是砖瓦。家不是溪水和秋千。家是你在灶前做糖糕时回头的那个笑。家是你喊我"慕风"时尾音微微上扬的那个调子。家是你。

只有你。

我只有八天。十天里，两天在路上。在一起的日子，只有八天。

你记不记得你说过"等我"？

那八天里，我什么都来不及说。来不及问你这十年去了哪里，来不及问你受了多少苦，来不及替你挡那些我本该挡在前面的东西。我只来得及做一些最蠢的事——给你倒水，给你拿毯子，给你把猫抱到你膝上。

像在讨好一个随时会走的客人。

而你果然走了。

你走的时候没有回头。天还没亮。猫叫了一声。溪水还是那条溪水。槐树还是那棵槐树。什么都没变。又什么都变了。

仙脉神石。

梁朝文帝。

那些我够不着的力量，那些我杀不死的神明，那些坐在龙椅上把人间当棋盘的帝王——他们有什么资格决定你的生死？凭什么你只能回来十日！凭什么——

我知道你在哪里了。

你在那些我永远去不了的地方。

可这棵树——我亲手种的这棵树——它还在长。它会继续长下去。十年不够，二十年，三十年，四十年。它会荫蔽整个院子，荫蔽这座空屋，荫蔽这座没有你的"家"。

而我会坐在这棵树下，像一座石碑，等一片永远不会落在肩上的叶子。

锦荷，你说你没有家。

你错了。

你的家在这里。我在这里。

只是你不在了。所以家不在了。

而我再也建不起来了。`
      },
      {
        num: 3,
        title: '第三封',
        subtitle: '昭雪离去十周年。写在她的牌位前，纸已泛黄——此信大约起笔于数年前，搁置多时，今日方才续完。未寄出。',
        date: '承平三十二年-06-24',
        time: '辰时',
        weekday: '',
        recipient: '锦荷',
        sender: '慕风',
        location: '神庙',
        body: `锦荷：

今天是六月廿四。你走的日子。

院子里的槐树已经很高了。高过我屋檐，高过院墙。下午的日光斜过来，荫能铺满半个院子。方芷前些日子来过一次，说："哥，你这棵树该修枝了，不然枝条都快伸到屋顶上了。"我说不修。她说那是为什么。我说它想长到哪儿就长到哪儿。

方芷看着我，没说话。她大概懂。她什么都懂。

方仲庭老了许多。虎卫的事如今多由副手打理，他偶尔来我院中坐坐，看我浇树，看我给猫喂食。有一回他说："慕风，你在等什么？"我说我在等树长大。他说树已经长大了。我说，还没有。

他没再问了。

帮里的事还好。该挡的挡了，该平的平了。这些年方帮上下安稳，子弟们有饭吃、有屋住、有人管。他们叫我帮主，我叫他们"家里人"。我给那些无家可归的人建了房子，给那些漂泊的人留了灯火。他们说方帮是他们的家。

可我知道。

林觉民在《与妻书》里写："吾充吾爱汝之心，助天下人爱其所爱。"

我充不了。我的心只有这么大，已经被你占满了。我替别人建家，可我建不了自己的。不是不能，是不敢——因为我知道，这个家的每一块砖上都有你的名字，每一寸墙里都嵌着你的影子。如果我把这座房子叫"家"，而你不在这里，那这个字就脏了。

我如今的日常，说给你听罢。

卯时起。先去院子里看看槐树。浇水，拔草。猫已经老了，不太动，就卧在秋千脚下的那块草垫上——就是当年你铺的那块。我换了三次草垫了，它的窝还是在原来的位置。大概它也记得你。

辰时去帮中处理事务。午后若有空，便回院子里坐。溪水还是从东墙入、从西廊出，声音和十年前一样。我有时候坐在溪边，听水声，听风声，听猫偶尔的呼噜声。这些声音加在一起，像一首你弹过但我忘了曲名的调子。

酉时在院中用饭。饭是帮中伙房做的。做不出你的味道。糖糕我还是买不到那个味道，或许那个味道只存在于你还在的那几年。味道是会死的，同花一样。

戌时点灯，去神庙。在你牌位前坐到困了，便回去睡。若不困——多数时候不困——便写这些你永远不会看到的信。

锦荷，你说的对。你说过"我没有家"。

如今我也懂了。

那门口的溪流不是家。那巍巍的槐树不是家。那有糖糕、有小猫、有秋千、有明月的地方也不是家。唯有你我共在的地方，才能叫做你我的"家"。

你不在了，所以没有家了。

可我不肯把这座空屋叫别的名字。我坚持叫它"家"。因为我怕，若我松了口，不再叫它"家"，那你的痕迹就会开始褪色。那一寸一寸的褪色，我承受不住。

所以我每天浇水，拔草，喂猫，听溪，修秋千——做你还在时会做的一切事。我把自己活成了你的影子。你活着的时候我做什么，你走了以后我还是做什么。区别只在于：从前是两个人做，现在是一个人做。

像一座空转的水车，还转着，但磨不出粮食。

今日院内槐树落了三片叶。`
      },
      {
        num: 4,
        title: '第四封',
        subtitle: '昭雪离去二十周年。深夜，神庙中不点烛，仅凭月光映纸。字迹出奇地平静，像一个人穿过了所有的悲恸，在另一端坐了下来。笔端稳，墨色匀，无涂改，无洇开。未寄出。',
        date: '承平四十二年-06-24',
        time: '子时',
        weekday: '',
        recipient: '吾妻锦荷',
        sender: '至始至终 等你的 慕风',
        location: '神庙',
        body: `锦荷：

今日没有点灯。

月亮从神庙东窗照进来，刚好落在你的牌位上。我叫人刻你的名字时，选了最细的刀法，刻完之后用手指摸了一遍。木头的纹理很细，刻痕也细，摸上去像一道愈合了很久的疤。

二十年了。

我今年多大？我有时会忘了自己的年纪。方芷已经有了孩子，叫她姨母。方仲庭已经走了——走的那天很平静，拉着我的手说："慕风，你为我守了方家大半辈子，够了。"我没有回答。我守的不是方家。他大概知道。

帮里已经换了三代人了。第一代人老的老、走的走；第二代人成了中坚；第三代人出生在我建的那些屋子里，不知道什么叫"无家可归"。这很好。这正是我要的。我这一生能为这个世界做的最善的事，就是让更多的人有地方回去。

可我自己回不去。

不是回不了这座院子——我天天在。是回不了那个有你在的时空。

锦荷，今夜我写这封信，不是同你诉苦。诉了二十年了，我不苦了。或者说，苦到深处便不觉得苦了，像人在极寒之地待久了，反而不觉得冷。

今夜我写信，是想求你一件事。

不——是求他们。

我不知道那仙脉神石后面是谁。仙灵？天命？还是某个坐在云端俯瞰人间的无聊之物？我不管。我今夜在这月光里，在这座为你而建的神庙中，向你，向他们，向一切有耳朵能听见的东西——

祈求。

若你尚有残魂游荡于天地之间，若那仙脉神石还留着你一丝气息——求你回来。

不。不只是祈求。

恳求。

我方慕风一辈子不求人。帮主二字是用拳头和血换来的，我这一生做的每一个决定都是我自己选的，每一条路都是我自己走的，每一个失去的人都是我自己亲手松开的手。我不欠谁。不跪谁。不求谁。

今夜我跪了。

不是跪神。是跪命运。

哀求。

我算过了。这一生我失去的人，六重。每一个都像一根钉子，钉在这座"家"的地基里。我的父亲，我的母亲，我的师父，我的兄弟，我的义妹的丈夫——你。你是最后一根。最后一根钉下去之后，地基反而稳了。可我活着的部分越来越少，像一座被掏空了心的房子，外面看着还立着，里面什么都没有了。

我不怕空。我怕的是——你真的什么都没剩下。

若你还有一丝气息，若仙脉神石还留了你一缕魂魄——让你回来。不是一天。不是十天。永远。

你说你"没有家"。那是因为你不在该在的地方。你该在的地方在这里。在这棵树下，这道溪旁，这只猫脚边。你该在灶前做糖糕，该在秋千上晃脚，该在窗台上看月亮，该在夜里叫我一声"慕风"。

我知道这个要求过分。我知道命运不讲道理。我知道一个凡人向神石求人，比蚂蚁向龙王求雨还荒唐。可我不怕荒唐。我等了二十年，还有什么怕的。

今夜我什么都没点。没有蜡烛，没有灯，没有火。只有月光。

我在听。

槐树的枝叶在月光下是银色的。风来的时候它会响。沙沙的，像一个人在低声说什么。二十年了，这声音我听了二十年了。有时候我觉得它在叫你的名字，有时候我觉得什么都没说。

今夜我只要你给我一个应答。

三声。

我就求三声。

若今夜风吹过槐树，枝叶响三声——不必是大的声响，不必是任何异象——只要三声。我就能再等二十年。

不是因为你一定回来。而是因为那三声告诉我：你在某个地方，你还记得这棵树。

若没有三声也无妨。

庭有槐树，吾妻死之年所手植也，今已亭亭如盖矣。

——然年年叶落，岁岁花开，吾仍在树下等你。锦荷，你听到了吗？

就今夜。三声。我只求三声。

至始至终，等你的 慕风。`
      }
    ];

    const letters = [];

    for (let i = 0; i < letterData.length; i++) {
      const data = letterData[i];
      const date = new Date('2025-01-01');
      date.setDate(date.getDate() + i * 7);

      const letter = {
        id: `daliang-${data.num}`,
        mailboxId: 'mailbox-daliang',
        title: data.title,
        subtitle: data.subtitle,
        sender: data.sender,
        recipient: data.recipient,
        paperStyle: 'vintage-literary',
        bgmUrl: '',
        date: data.date,
        time: data.time,
        weekday: data.weekday,
        location: data.location,
        letterTitle: data.subtitle,
        bodyText: data.body,
        content: [],
        illustration: null,
        createdAt: date.getTime(),
        updatedAt: date.getTime()
      };
      letters.push(letter);
    }

    return letters;
  },

  generateRuguLetters() {
    const letterData = [
      {
        num: 1,
        title: '第一封',
        subtitle: '写于面圣后第三日。纸张为宗学统一的上等竹浆纸，墨色均匀，笔迹端正工整，似反复誊写过一遍。未寄出。',
        date: '文远元年-03-12',
        time: '辰时',
        weekday: '',
        recipient: '谣女公子',
        sender: '连世疆',
        location: '宗学偏院',
        body: `谣女公子见字如面。

面圣那日，诸位同窗皆在殿前，圣上问话，有人应对自如，有人讷讷不敢言。我本不在意旁人如何——世子衔在身，面圣是家常之事。可偏偏记住了你。

旁人跪拜的姿态各有各的疏漏，唯独你，膝落时无声，脊背直如尺，抬眼的时辰恰到好处——既非木讷，又不张扬。事后听人说，那是卫家女公子，自幼习礼，规矩刻进骨子里。

规矩刻进骨子里。

我回去想了很久这句话。世人皆说礼教束缚，可若当真刻进骨里了，便不觉得是束缚了罢？像刀剑入鞘——镡与刃严丝合缝，谁也分不开谁。倒也自在。

今日在宗学偏院偶遇你，你在廊下看书，阳光打在你肩上。我本欲上前搭话，又怕唐突了卫家的规矩。遂作罢，回来写了这封信。

宗学之大，同窗数十人，偏偏只记住了那一个跪得最端正的身影。我想，这大约就是——情不知所起。

连世疆
文远元年 三月十二`
      },
      {
        num: 2,
        title: '第二封',
        subtitle: '对弈后所作。纸上压着一瓣干花，应是棋室窗台上的寒梅落瓣。笔迹比第一封稍自由些，仍工整，但偶有连笔。未寄出。',
        date: '文远元年-11-09',
        time: '申时',
        weekday: '',
        recipient: '谣女公子',
        sender: '连世疆',
        location: '宗学棋室',
        body: `谣女公子：

今日又输给你了。

黑七目，我数了三遍。你说"世子殿下棋风刚烈，但不善守"。我笑了笑，没辩驳。

其实我何尝不知自己的棋路。陇平人下棋，讲究气势，讲究先手，一子落下去恨不得铺天盖地。可你偏不按我的路来——你拿白子，第一手不占星位，不挂角，不拆边，直直落在天元。

天元。棋盘正中央。

我愣了片刻。你微微侧头，说："谣女公子执白，从来以天元开局。殿下莫笑。"

我笑什么？我见过世间无数棋谱，从未见过有人第一手便下天元的。旁人皆笑你不合棋理，可我想的是——这个女子，从不按别人的规矩走。

棋室窗外落了雪。煊阳的雪不似陇平那般厚重，薄薄一层，似有似无。你执白子，指节微凉。我执黑子，指尖是南方冬日里难得的一丝暖意。

那个下午我输了七目。可这七目是我心甘情愿输的。若棋盘对面是你，纵使将败，那也是世间最值得的一场输局。

世间万事皆可算计，唯独此刻不可。

连世疆
文远元年 十一月初九`
      },
      {
        num: 3,
        title: '第三封',
        subtitle: '写于话本夹页之间，折叠方式随意，像随手塞在书页里的便笺。笔迹轻快，有几分少年意气。未寄出。',
        date: '文远元年-12-23',
        time: '酉时',
        weekday: '',
        recipient: '阿谣',
        sender: '连世疆',
        location: '宗学藏书阁',
        body: `阿谣——

请恕我唐突，用了这样近的称呼。你上次说你近来在读一本话本，情节曲折，甚是好看，问我有没有兴趣同读。

我当然有兴趣。但不好说得那样直白，便回了一句"殿下公务繁忙，闲暇有限"。你便真的借了我一本棋谱——说什么让我先研究过棋理再来找你讨教。

你是故意的罢？

我知道那本棋谱你没读过。书脊上的折痕是新的，里面一个指印都没有。可你还是一本正经地说："殿下先将此谱读熟，谣日后定当与殿下手谈。"

那我便读了。

读了三天，将那棋谱翻了个遍。第四日我去了藏书阁，你不是在看话本，是在抄经。我假装路过，故意走得很慢。你抬头看了我一眼，没有说话。

那一眼里有笑意。我确信。

现在我将这本棋谱和这封信一起夹在话本的第七十二页——因为上次你说，故事正好讲到第七十二回，"此后便入佳境了"。

入佳境。我想，我也是。

——连世疆
文远元年 十二月廿三`
      },
      {
        num: 4,
        title: '第四封',
        subtitle: '写在粗布上，炭笔所书。纸张并非正式用纸，是随手撕下的军中账簿内页。字迹急促，多处涂改，有几行写得极重，几乎划破纸面。未寄出。',
        date: '文远二年-07-07',
        time: '寅时',
        weekday: '',
        recipient: '谣女公子',
        sender: '连世疆',
        location: '煊阳·城北临时驻所',
        body: `谣女公子：

皇城大火。

我不该写这封信。我应该去清点伤亡、安置伤员、上报朝廷。可我坐在废墟边上，满手是灰，脑子里全是你的脸。

火从东宫开始，烧了半夜。太子被拥立继位，太后垂帘辅政，朝堂一夜之间变了天。多少人死了，多少人失了靠山，多少人被清洗。我守在武库外头，听见城里有哭声、有马蹄声、有刀剑相击的声音，一整夜没有合眼。

天亮以后，我站在城墙上往下看——煊阳还是那个煊阳，可已经不是那个煊阳了。街道上的石板被烟熏黑了，空气里有焦味，东宫那边塌了一角。

可我想的不是这些。我想的是——你在哪里？

听说卫家在变局中暂时没有受到波及。我松了一口气。只有一口。因为我知道，这朝堂上的风还没有停。今日无事，不代表明日无事。

我该走的。父命难违，陇平那边还有好多事要料理。可我不走——不是因为忠义，不是因为大局，是因为我在煊阳，离你还算近一些。

信写到一半，炭笔断了。我不换笔了。

谣女公子，你还好吗？

连世疆
文远二年 七月初七`
      },
      {
        num: 5,
        title: '第五封（第一幕）',
        subtitle: '写在掀翻棋盘之后。纸面有水渍，墨迹在边缘微微洇开。字迹一改往日的端正，写得急而乱，像是一个人在极力压制什么情绪。信的开头"谣"字反复写了三遍——第一遍太轻，第二遍太重，第三遍才落定。未寄出。',
        date: '文远二年-01-03',
        time: '亥时',
        weekday: '',
        recipient: '谣女公子',
        sender: '李文瑙',
        location: '宗学棋室',
        body: `谣女公子：

见字如面。

那场雪后，你误入我的弈局，便算是你我初见。

可我总觉得，我们的相逢，比那更早一些。也许是旧梦未醒，亦或许是前缘未尽。

或许，既是乍见之欢，也是久别重逢。

那日我心乱如麻，失了分寸，竟掀翻棋盘，言语失度，唐突了你。事后想起来，你低头看那一地散落的棋子时，眼中的神色——不是惊，不是怒，是一种我读不懂的东西。那之后你转身便走了，没有回头。

我喊了你一声。你没应。

谣女公子，我那日并非有意失态。只是坐在棋盘对面，看着你执白落子，看着你垂下的眼睫投下一小片阴影，看着你指尖微凉地拈起白子放在天元——我心里忽然涌上来一股说不清道不明的东西。是慌张，是欢喜，是一种从未有过的、不可遏制的心乱。

是情。

我掀翻的不是棋盘，是我自己。是那颗好不容易维持的、世子该有的、不动声色的心。

望谣女公子海涵，一时情乱，脱口而出实非我本心。此事至今，仍觉抱愧。

若你还愿与我对坐，来日风雪初歇，可否与我，再下一局？

不为胜负，只为与你对坐，当面致歉，讨教棋艺。

李文瑙
文远二年 正月初三`
      },
      {
        num: 6,
        title: '第六封（第二幕）',
        subtitle: '元宵夜，写于借棋谱之后。纸角沾了蜡油——是在灯下写的。笔迹工整中透着少年人的雀跃，有几处涂改不是改措辞，是改得太直白了又收回去。未寄出。',
        date: '文远二年-01-15',
        time: '戌时',
        weekday: '',
        recipient: '谣女公子',
        sender: '李文瑙',
        location: '宗学藏书阁',
        body: `谣女公子：

元宵夜，学宫放假，旁人都去街上看灯了。我没去。

我在藏书阁里翻你借我的那本棋谱。翻了三天了，快翻烂了。

你借我棋谱的时候，说什么"殿下先将此谱读熟，谣日后定当与殿下手谈"。我知道你没读过那本书——书脊上的折痕是新的，里面一个指印都没有。可你还是一本正经地站在藏书阁门口，眼睛里含着光，用那种端庄的闺秀风范一本正经地骗我。

你骗我的时候，嘴角是压着的。你自以为藏得很好。

我自然装作不知。殿下公务繁忙，自然要先将棋谱读熟。于是我便日日来藏书阁，假装查书，实则偷得几日与你共话的光景。你坐在窗边抄经，我坐在三步之外假装读书。阳光从窗棂间打进来，落在你肩上、落在你低垂的眉眼间。

你不说话。我也不说话。可那种安静——那种两个人明明什么都没做、却什么都已经说了的安静——让我觉得，整个学宫的喧嚣都与你我无关。

偷得几日与你共话的光景——够了。这几日够我想很久了。

谣女公子，棋谱已读熟。不知何时可与殿下手谈？

李文瑙
文远二年 正月十五`
      },
      {
        num: 7,
        title: '第七封（第三幕）',
        subtitle: '写于话本讨论之后。纸张折痕细密，像被反复折叠又展开。笔迹中有几处极轻极淡——是犹豫着写下的句子。未寄出。',
        date: '文远二年-02-02',
        time: '戌时',
        weekday: '',
        recipient: '阿谣',
        sender: '李文瑙',
        location: '宗学后山',
        body: `阿谣——

你今日同我讲那本话本，讲到动情处，你说："话本里的人冲破梦境与现实，死生契阔，只求一场永结同心。"

然后你沉默了很久，说："而我不敢妄求梦圆。只愿不负这一场相遇相知。世间局多，人各有位。我所背负者，未曾敢弃。"

我听了这话，心里忽然一疼。

世间局多，人各有位——你从什么时候起，就把"自己的位"看得比"自己的心"更重了？你从什么时候起，学会了把自己想要的东西一一放下来，只留下那些"必须背负"的东西？

你最后说了一句话。

你说："我要倾尽全力，挣一个好结局。像牡丹亭一样的好结局。"

你说这话的时候，眼睛里有光。是那种——明知不可为而为之、明知前路漫漫而仍然向前走的光。我见过很多人说狠话，见过很多人说豪言壮语，可从没有见过一个人，用这样平静的语气，说出这么大的决心。

可我也听出了另一层。

你说"相爱相守，是很难的事情"——你说这话的时候，不是在说道理，是在说自己。你是在告诉我，你早就知道这条路有多难。你选了，你认了，你往前走了。可你的手在发抖。

我也在发抖。

前几日你同我闲话时，我说了一句逾矩的话。你看了我一眼，淡淡道："连二公子会自重的。"

连二公子会自重的。

好。好的。我自重。

可阿谣，你教我自重，却不教我如何不想你。

李文瑙
文远二年 二月初二`
      },
      {
        num: 8,
        title: '第八封（第四幕）',
        subtitle: '写在落水事件之后。纸上有明显的揉皱痕迹。笔迹急促，有些字写得极重，几乎戳破纸面。有几行写了一半被划去，划了又写，写了又划。未寄出。',
        date: '文远二年-03-09',
        time: '亥时',
        weekday: '',
        recipient: '谣女公子',
        sender: '李文瑙',
        location: '宗学·庭院',
        body: `谣女公子：

你在生气。

你一定在生气。可你不会表现出来——你是把规矩刻进骨头里的人，生气的方式不过是比平常更端庄、更沉默、更守礼。而我偏偏最怕你这种沉默。

那日的事，是我认错了人。不该将你错认成旁人，更不该拉你落水。事后你的衣服湿透了，站在风里，脸色发白，却一声不吭。卫将军赶来时，你只说"不慎落水"，连我的名字都没提。

你在护我。

你明明在气我，你明明该骂我一句"连二公子会自重的"，可你一个字都没说。你只是把头转过去了，不看我。

我从不知道，一个人不看你，可以比全世界都指责你更疼。

后来我想了很多。你在棋盘上从不按别人的路走，你以天元开局，你借我棋谱，你偷偷在抄经的时候抬眼看我——我以为我离你很近了。可落水那一日我才明白，你心里筑着墙。不是宫墙那种高墙，是一种看不见的、温柔的、把所有人都挡在外面、也把自己挡在里面的墙。

你教我下棋，教我落子无悔，教我天元开局。可你从来不教我——怎么走进你心里。

我愿做你乘过的陇平马。我愿带你走出那布好的命数。可你连看都不看我一眼。

谣女公子，你信不信执子之手，与子偕老？

若不信，那便换一种——我以陇平边关的雪起誓，来日若有一日你困在局中，我必破去那困局，带你走出。

你信也好，不信也好。这局棋，我不会掀翻了。

李文瑙
文远二年 三月初九`
      },
      {
        num: 9,
        title: '第九封（第五幕）',
        subtitle: '中秋夜。纸张上等，墨色端正，但字里行间透着一股被强行压住的焦灼。信纸被折叠过很多次，像是写了又拆开、拆开又叠好。未寄出。',
        date: '文远二年-08-15',
        time: '亥时',
        weekday: '',
        recipient: '谣女公子',
        sender: '李文瑙',
        location: '煊阳·城南驿馆',
        body: `谣女公子：

我托人送徐医师去了东华，不知你收到没有。

你已许久没有回信了。上一次收到你的只言片语，还是两月前的事。宫墙之隔，信笺难通，我理解。可理解归理解，焦灼归焦灼——每一日没有你的消息，我心上那根弦便紧一分。

东华那边传来消息，说阮连珠殁了，俞夫人也去了。我听到这些的时候，手中的茶盏落在地上，碎成了渣。

阮连珠。俞夫人。那些在学宫里还同你笑着说话的人。走了。

我不知你听闻此事时是什么光景。我甚至不知你是否已经知道了。宫墙之内，消息能传进来，却也传得面目全非。我恨不得即刻进宫，站在你面前，亲口告诉你外面发生了什么——可我不能。外人不可擅入内廷。

还记得学宫时我们在观星楼上看月亮的那个晚上吗？你说："殿下，陇平的月亮也是这样吗？"

我说陇平的月亮更大。你说好想看。

阿谣，我现在看着煊阳的月亮，忽然想问你一个问题——

若有一日你出了宫墙，若有一日你不必再背负那些你"未曾敢弃"的东西，陇平会是你我的选择吗？

我知道你在宫中身不由己。我知道你心防重重，不会轻易信人。可我还是想问你。哪怕你永远不会回这封信，哪怕你永远不会知道我问过——我还是想问。

陇平会是你我的选择吗？

李文瑙
文远二年 八月十五`
      },
      {
        num: 10,
        title: '第十封（第六幕）',
        subtitle: '深夜独写，烛台燃尽，蜡油凝固在纸角。笔迹在首尾两段截然不同——开头如常，写到中间忽然顿了许久，再落笔时，字极小、极密。未寄出。',
        date: '文远三年-02-02',
        time: '丑时',
        weekday: '',
        recipient: '阿谣',
        sender: '李文瑙',
        location: '陇平·夜璃王府书房',
        body: `阿谣：

你入宫了。

我得到消息后，连夜赶回了陇平。路途颠簸，满脑子都是宫墙的样子——那座城墙比边关的还高、还厚。

我在陇平看到的东西，不知该不该写给你。

去年关中大旱，陇平受灾，粮草断绝。我到了之后才知，灾情远比奏报中所写的严重十倍。村落十室九空，道旁有饿殍，有易子而食者——我不忍写，可这是真的。

这些日子我在陇平安排赈灾，看着那些失去一切的百姓，忽然想：棋盘之上，何止你我二人。这天下，这苍生，哪一个不是棋盘上的一颗子？你被困在宫墙之内，他们被困在天灾之中。所有人都是棋子，可没有一个人愿意当棋子。

阿谣，学宫时候下棋的那个下午，窗外落着雪，你执白，我执黑，棋盘上有天地。如今回望，那盘棋何其干净——至少那时候，落子的只有你我。

而如今这盘棋，所有人都在其中，身不由己。宫墙困着你，天灾困着陇平的百姓，命运困着我们所有人。

可我不会认输。这盘棋，我会下赢。

边关的城墙不似宫里那样高，它困不住你。阿谣，我向你保证——总有一日，你会走出那座宫墙。若你愿，我等你在陇平。

秋深了，夜凉。珍重。

李文瑙
文远三年 二月初二`
      },
      {
        num: 11,
        title: '第十一封（第七幕）',
        subtitle: '出征前匆匆写下。字迹草率但刻意写得清晰——怕她看不懂。信封上有手画的棋盘格纹，像是想寄又不敢寄。未寄出。',
        date: '文远三年-09-19',
        time: '卯时',
        weekday: '',
        recipient: '阿谣',
        sender: '文瑙',
        location: '煊阳·城南驿馆',
        body: `阿谣：

我要走了。临行前有几句话，务必记在心里。

宫中有人送过荔枝。我托人转交的。你大约已经收到了。

陇平多雪，我不曾吃过如此甘甜的荔枝。谢谢你——谢谢你愿意收下。我知道宫里苦，这一点甜味算不了什么。可我能给的，只有这些了。

还有几件事，你务必上心。

袁玠那厮败絮其中，想来你在宫中的日子不会好过。务必多加小心，照顾好自己。此人面善心恶，他若笑的时候最是要提防。不要跟他正面冲突，不要替人出头。你只要活着就好。

小妹——玥楼——已被送入宫中。也是簪子。我拦不住。太后点名要连家的女儿入宫伴驾，这是赏赐，也是要挟。

她性子单纯，不谙世事。宫中杀机暗藏，我实在放心不下。

阿谣，唯有你，我可托付。

我知道你也身不由己，我知道宫中水深，我知道自己没有资格再向你开这个口。可是这世上千万人，唯有你，我可托付。

你在宫中，若见玥楼受了委屈，替我说一句话。不必说是我说的，只告诉她——忍。

不是认输。是活下来。

这局已无退路。但我会回来的。

阿谣，待我破局，带你们回家。

等我。

文瑙
文远三年 九月十九`
      },
      {
        num: 12,
        title: '第十二封',
        subtitle: '写在月夜。纸张上似有银色光斑，但细看并非银墨——是月光洒在纸面上，被水渍或泪痕凝固的痕迹。字迹清瘦，有一种刻意维持的平静。未寄出。',
        date: '文远四年-03-15',
        time: '亥时',
        weekday: '',
        recipient: '阿谣',
        sender: '李文瑙',
        location: '煊阳·观星楼',
        body: `阿谣：

又是月圆。

观星楼是我们同窗时偷偷来过的地方。那晚也是月亮，也是春天。你坐在栏杆上看天，我站在你身后看你的侧脸。你没回头，但你知道我在看你。

你说："殿下，陇平的月亮也是这样吗？"

我说："陇平的月亮更大。因为天更空旷，什么都挡不住。"

你说："好想看。"

阿谣，你现在还能看见月亮吗？宫墙再高，应该还挡不住月亮。

你的信越来越少了。从最初一月一封，到两月一封，到如今——三个月了。我知道宫中不易，我知道你能写信已是不易，可我还是忍不住去想最坏的结果。

今夜我独自上了观星楼。楼梯还是那条楼梯，栏杆还是那道栏杆，月亮还是那个月亮。可人不在了。

我回来之后，以为自己能改变一切。可有些东西，知道也改不了。命运像一个巨大的棋局，每一步都已经被提前写好。我以为我是执棋之人，到头来发现，我也不过是棋盘上的一颗子。

可即便如此——即便我也是一颗子——我仍要以身为子，把这盘棋下到底。

阿谣，我会来的。

李文瑙
文远四年 三月十五`
      },
      {
        num: 13,
        title: '第十三封',
        subtitle: '追兵将至前夜。写给最重要的人的最重要的信。纸张上等，笔墨齐全——像是提前备好的。字迹极其工整，每一笔都写得极认真，像是在刻碑。未寄出。',
        date: '文远五年-01-03',
        time: '亥时',
        weekday: '',
        recipient: '阿谣',
        sender: '李文瑙',
        location: '煊阳·城西密室',
        body: `阿谣：

我该怎么跟你说呢？

要问我对你是恨多一点还是爱多一点，我答不上来——我心里那道线，从来就划不分明。

我也说不清是从什么时候爱上你的——或许是这一世，刚发现自己有机会去改变一切时；或许是那日我和连世疆在宗学廊下摆好棋盘，等你走来的时候；或许更早，早到上一世，我站在宫门外，望着你凤冠霞帔的背影，故事就那样戛然而止的那一刻。

我身上背着太多债了：上一世城墙下被凌辱至死的玥楼，煜阳城里惨死的连祈蔚，还有我亲手杀死的连世疆……这些前尘的爱恨罪孽压得我喘不过气，我以为自己早没资格牵你的手了。直到宫宴那天，你为我营造的那点可怜的幸福被一点点撕碎，我裹在心上那层"我们只是旧友"的纱也跟着破了，藏在底下的爱，终于藏不住了。

上一世我也有遗憾吧？太后给我指了公主，她听说我爱下棋，笑着问我棋艺如何，我只低着头说"棋艺不精"，从那以后再也没碰过棋子。可重来一世，急着往廊下跑、蹲在石桌上摆棋盘的人，又是谁呢？

我心里总空落落的，好像抓着什么，又什么都没抓住。直到此刻我才敢承认，我是在乎你的。我想带你回陇平，不是因为你需要我，是我想要——是我想牵着你的手，踩在陇平厚厚的雪上，再也不回来。

我曾对着天发誓，这一次一定要把你和玥楼完完整整带出宫。可我万万没想到，我最爱的人，会毁在我最爱的人手里。

你在这宫墙里的所有希望都灭了，对谁都筑起了心防，卫缨朝你伸手的那一刻，你信了，对不对？你心里那道裂了又裂的缝里，终究还是透进了一点光。

那你肯再为我透出一丝缝隙吗？

我的阿谣太苦了，是我没有……是我没有护住你，是我没用。我的阿谣是被逼疯的。我理解你，可我没法原谅你。有时候我甚至会想，是不是我那日给你的回信太坦诚，才把你推到了这一步？你后来抱着我说你悔了，可太晚了，阿谣，太晚了，我们再也回不去了。

我爱你，想和你往后的每一天都并肩走下去；我也恨你，恨你让玥楼永远闭上了眼睛，我本该提着剑让你偿命。可当我的剑真的抵在你颈间，看见你白丝带下藏着的旧伤，望进你眼里那片碎得像星子一样的绝望时——

李文瑙这一剑，我怎么斩得下去？

爱不能相依，恨下不了手，我们就困在这死局里，谁都动不了。所有人都觉得他们把最好的给了你，可那些杂乱又汹涌的"爱"，撞来撞去，最后只把你变成了这池子里唯一的鱼，唯一的受害者。

阿谣，你所有的一切我都在乎，我想改变这世上的每一件事，想把你受过的苦都抹平。甚至每次见你，我都疯了一样想带你走，想抛下我身上所有的债，所有的责任，只带你一个人走。

我眼睁睁看着玥楼倒在我怀里，我不能再看着你也倒下去了。我本来想带你回陇平的，可太晚了，玥楼回不去了，我们也回不去了！我不会让你变成第二个阮连珠，困在这四方的院子里一辈子——

阿谣，别等我了。往前走吧。

李文瑙
文远五年 正月初三`
      },
      {
        num: 14,
        title: '第十四封',
        subtitle: '最后一封完整的信。写在多张纸上，部分纸张墨色不同（中途换过墨），有些段落写于深夜，有些写于黎明前。没有点烛——月光。因此靠窗的部分笔迹清晰，靠里的部分模糊。这是十五封信中最长的一封。未寄出。',
        date: '文远五年-04-02',
        time: '寅时',
        weekday: '',
        recipient: '子谣',
        sender: '李文瑙',
        location: '陇平·夜璃王府书房',
        body: `子谣：

这封信我写了好几天。写写停停，写完了又撕，撕完了又重新写。到最后发现，不是写不完，是说不完。还有好多话堵在喉咙里，说不出来了，就像陇平的雪，落得纷纷扬扬，却怎么也堆不成完整的模样。

我想从最开始说起。

文远元年，面圣。你是所有人里跪得最端正的那一个。我当时想：这个人把规矩刻进骨头里了。后来我才明白——不是刻进骨头，是她把骨头磨成了规矩的形状。磨的过程有多疼，只有她自己知道。

你教我下棋的时候，窗外在下雪。煊阳的雪薄，落在窗台上就化了。你说"谣女公子执白，从来以天元开局"。你不知道那句话在我心里住了多久。住到今天，住到最后一封信，它还在。

后来你借我话本。你借我棋谱。你在藏书阁抄经，我假装路过，故意走得很慢。你以为我不知道，但你心里是知道的。你笑了。你抬头看我的时候，嘴角有笑意。你假装没在笑，可你在笑。

我那时候不懂。我以为日子会一直这样下去——你教我下棋，我陪你读书，雪会一直下，话本永远翻不到最后一页。

后来皇城大火。后来宫墙建起来。后来你被送进宫当了簪子。

我在这封信里不想说宫中的事了。那不是你该经历的事。你本该在陇平的雪地里打滚，在棋盘上以天元开局，在读话本的时候把书页折出痕迹。你本该是自由的。

可你不自由。是我没有让你自由。

你说过，你要倾尽全力，挣一个好结局。像牡丹亭一样的好结局。可我连这个都没能给你。

子谣，对不起。

我爱你，所以我放你走；我也恨你，恨你要带着我的死，日日夜夜困在回忆里。阿谣，承认吧，你也中了我用棋局为你编织的情蛊。

故事到这儿就结束了吧。我还在想什么呢？遗憾？不舍？还是后悔？大概都有吧，只盼着你往后的日子，能少点风雨，多点安稳。

李文瑙和卫子谣的故事，本来就该这样，戛然而止。

我的命从来不会交给任何人。所以这盘棋，让我自己来选吧。我以我的命为子，布这最后一局，换你赢，换你自由，换你不再被困在这棋局里。

——李文瑙
文远五年 四月初二`
      },
      {
        num: 15,
        title: '第十五封（绝笔）',
        subtitle: '绝笔。仅寥寥数行，写在一张纸上，纸面干净，无泪痕，无墨渍。放在棋盘上。旁边搁着一颗白子。未寄出。',
        date: '文远五年-04-03',
        time: '辰时',
        weekday: '',
        recipient: '谣女公子',
        sender: '连世疆',
        location: '陇平·夜璃王府棋室',
        body: `谣女公子：

阿谣，别回头了，往前走吧。

这盘棋，我输了。

陇平的雪会替我看着你。

李文瑙
绝笔

文远五年 四月初三`
      }
    ];

    const letters = [];

    for (let i = 0; i < letterData.length; i++) {
      const data = letterData[i];
      const date = new Date('2025-01-01');
      date.setDate(date.getDate() + i * 10);

      const letter = {
        id: `rugu-${data.num}`,
        mailboxId: 'mailbox-rugu',
        title: data.title,
        subtitle: data.subtitle,
        sender: data.sender,
        recipient: data.recipient,
        paperStyle: 'vintage-literary',
        bgmUrl: '',
        date: data.date,
        time: data.time,
        weekday: data.weekday,
        location: data.location,
        letterTitle: data.subtitle,
        bodyText: data.body,
        content: [],
        illustration: null,
        createdAt: date.getTime(),
        updatedAt: date.getTime()
      };
      letters.push(letter);
    }

    return letters;
  },

  generateTaozhiLetters() {
    const letterData = [
      {
        num: 1,
        title: '第一封',
        subtitle: '入学第一个月的中秋夜，偷塞在江淮安房门下的便条。纸是撕下来的作业纸边缘，墨迹歪歪扭扭，有两处涂黑——大概是写了又觉得太直白。未寄出。',
        date: '建兴五年-08-15',
        time: '亥时',
        weekday: '',
        recipient: '江淮安',
        sender: '戚凭川',
        location: '静远书院·寝室',
        body: `淮安：

今日中秋，月亮又大又圆。

贺清风不知从哪掏出一壶酒来，拉着满院子的人赏月。任朝野本来不想出来，一听贺清风的声就跟着走了，也不知道他到底在怕什么。周然倒好说话，就是嘴里念叨着"不合规矩不合规矩"。

月亮真大。我在想你在不在看。

你屋里灯还亮着，大概又在温书了。科举将至嘛，你若能考满分，我便陪你回我家乡玩。不过以我的水平，怕是要让你等上八百年。

算了不写这个了。我就是想跟你说一声——

今日的月亮又大又圆，在书院里看到的月亮，跟你在一块儿看的时候，好像也没那么大。

不，其实一样大。

——戚凭川
建兴五年 八月十五`
      },
      {
        num: 2,
        title: '第二封',
        subtitle: '纸是桃止门粗糙的草纸，墨是从灶台偷来的锅灰兑水。多处被水渍模糊——是汗水还是别的什么，分不清。折叠方式极为仔细，像是一遍遍叠好又拆开。',
        date: '建兴七年-10-06',
        time: '戌时',
        weekday: '',
        recipient: '江淮安',
        sender: '戚凭川',
        location: '桃止山·弟子房',
        body: `淮安：

我到桃止山了。

你大概不知道我被送到这里来了罢。说来话长，总之家中出了事，长老们觉得我"难堪此任"，就把我丢到这个瘴气遍地的地方来了。

桃止山在西南苗疆，终年潮湿，蚊虫蚁鼠多得能把你抬走。山顶白雾笼罩，山路陡峭，来者罕有登顶。每月望日夜晚才有火把引路。我倒觉得这里挺好——至少没人嫌我话多。

走之前，父母板着脸来见我，给了我一个绣着梅花纹样的香囊。他们什么都没说，只说让我随身带着。我摸了摸那香囊，觉得沉甸甸的，好像里面装的不只是香料。

我在这边也开始学了。师父教我毒经之道，说桃止门的刀法讲究"狠、诡、毒、快"。我练轻功练得还可以，就是快刀不太行——我更喜欢用毒。师父说我"有些天赋"。我也不知道该高兴还是该害怕。

想你了。不是那种想——就是想。桃止山上没有月亮那么大那么圆的东西，只有白雾和瘴气。我把你以前在书院说过的话都记着呢。

别替我担心。我好得很。

戚凭川
建兴七年 十月初六`
      },
      {
        num: 3,
        title: '第三封',
        subtitle: '写在桃止山夕阳下。纸张边缘有焦痕，像是被火燎过。字迹比前两封沉稳了些，但某些地方忽然写得很用力。',
        date: '建兴八年-03-03',
        time: '酉时',
        weekday: '',
        recipient: '淮安',
        sender: '凭川',
        location: '桃止山·山坡',
        body: `淮安：

收到你的信了。你在信里说丹溪谷的花开了，紫藤花爬满了院墙，你每日在花圃里种草栽花、松土浇水。我看了好几遍，把信折好藏在床底下，跟沈池懿和贺清风的信放在一起。

桃止山上也有花，只是开在瘴气里，我懒得去看。

淮安，我今天杀一个人了。

是同门弟子。他烧了我的信——你和沈池懿和贺清风写给我的所有信，全被他一把火烧了。我看着那些灰烬落在地上，觉得什么东西在我心里也跟着烧没了。

然后我用了自己研的毒药。是你取的"梅花烙"，无色无味，杀人之后脖子上会留下一个梅花形状的紫色痕迹。

他死了。

我是桃止门的弟子。这里弱肉强食，弟子间相互投毒暗杀是常态，睡觉时都要留一丝神智。我亲眼看过同门被砍下小指、扒下皮。

我知道你若知道了会说什么。你会皱眉头，然后从针袋里取出银针，不由分说地封住我的穴位，一边处理伤口一边说"你怎么不想想后果"。

可你不在。

贺清风来信说她在天行教很好，寄了一堆乱七八糟的东西给我——吃饭吃到的蜗牛壳，路边小摊上的丑猴子玩偶。我拿着信又好笑又好气。我回寄了一些毒虫给她，附信道这是"无敌小毒虫，剧毒无比，触碰者会大笑三日"。

清风回信说"戚兄，我看到这只猴子便想起你"。

我给她回了一封："谁嫉妒你谁晚饭吃肉只有骨头。"

淮安，日子很长，也很快。我在桃止山第五年了。你信里说你最近在学一种新的针灸法，忙得顾不上吃饭。你自己都不照顾自己，怎么给别人治病？

别忘了吃饭。

——凭川
建兴八年 三月初三`
      },
      {
        num: 4,
        title: '第四封',
        subtitle: '下山游历时所写。纸是客栈的粗纸，炭笔所书。字迹潦草，有夜风的痕迹——纸张边角卷翘。信中夹了一片干枯的树叶。',
        date: '建兴九年-09-19',
        time: '戌时',
        weekday: '',
        recipient: '淮安',
        sender: '随安',
        location: '桃止山外·游历途中客栈',
        body: `淮安：

我下山了。游历了一年，走南闯北。

穿着一身黑灰，配上我日渐苍白的脸色，看上去更像灾星。也不打紧，反正好歹能走。

路上遇见练家子欺负百姓，我白天笑着让开，夜里再用蛊虫去收拾。日复一日地挖空人的脏腑，蚕食人的神智。这种阴毒的路见不平拔刀相助，就是我坚守的道义吗？我不得而知。

路过一个集市的时候，忽然听到一个熟悉的声音："这位兄台，借个道！"我被他拉着往巷边走，用身躯替他挡了追兵的目光。良久，他呼出一口气，我转身一看——是任朝野。

他已经长成大人模样了，成熟挺拔，眉眼一如既往。

我拉着他去了客栈，忙前忙后沏茶，又从药箱里拿了一瓶金疮药递给他。他愣住看我，一直没接。

我忍不住大笑："任兄，这是秘制金疮药，真没毒。"

他笑了笑，问我你和其他人如何了。我垂下眼眸，用茶盏拨开茶面漂浮的叶子，说已经没有联系了。

他说谎，我也说谎。

后来任朝野得空便帮贺清风送信来，信笺里偶尔附上一袋糖饼。我生性喜甜，上了桃止山后很久没吃过糖了。我时常期待着他的到来。

只是这样的时日没过多久，他便也忙了起来，再没收到那封带糖的信笺。

淮安，路上经过一家胭脂水粉铺子，我不免想到你。你好像不喜欢胭脂，平时素面朝天我也喜欢得紧。我在铺子前站了一会儿，想如果有一天我们成亲，我撩开你的红盖头，下面是你漂亮又淡然的脸——

想远了。

今日我在看夕阳，桃止山上的晚霞粉粉橙橙的，是这鬼地方唯一好看的东西。

随安
建兴九年 九月十九`
      },
      {
        num: 5,
        title: '第五封',
        subtitle: '住在丹溪谷养伤期间所写。纸张是丹溪谷上好的宣纸，墨色温润。笔迹出奇地温柔，有几处写到一半停顿了，像是不知道该怎么往下说。未寄出。',
        date: '建兴十二年-06-06',
        time: '酉时',
        weekday: '',
        recipient: '淮安',
        sender: '随安',
        location: '丹溪谷·客房',
        body: `淮安：

你的银针还是那么准。

那天在丹溪谷口，一个疯子提剑朝你刺去。我本来只是路过，可看到那白衣飘飘的身影——鬼使神差就冲上去了。来不及用兵刃格挡，赤手挡了那一剑。剑刃刺穿手掌的时候，我连眉头都没皱一下。不是不疼，是疼惯了。

可你慌了。

你从针袋里取出银针，连落三针封住我的穴位，手指在发抖。你做这事极为熟练，想来是怕那刀上涂毒，先一步将血口封住。

你问我："你怎么忽然来了？也不提前说一声？"

我说："这不是想着给江谷主一个惊喜嘛。"

你说："刚才怎么想也不想就冲上去了，不知道危险吗？"

我说："他要伤你。"

你说："他儿子我没救回来，挨一刀也是应该的。"

淮安，你总是这样。别人伤了你，你觉得是自己的错。可是你错了——你不是该挨刀的人。

我在你这里住了些日子。整日看你行医救人，种草栽花。你怕我粗心，一律不让我动手。我就乖乖坐在紫藤花下，看你忙前忙后。

有一天你在花圃里忽然不出声了。我走过去一看，一朵玫瑰悄然无息地枯了，叶片萎靡。

你喃喃说："它死了。"

我说："别怕，它会以另种方式，重新活过来。"

你沉默了一会儿，忽然问我："随安，你相信来世吗？"

我说："我不信，来生的事，来生再谈。若有来世，我也会在见到你的第一眼，便一见倾心。"

你后来领我去拜了沧敬长老。琼山后山，山风与鸟鸣，风吹来衣袍攒动。

那日你看了我很久，终于点了点头。泪光在日光下亮晶晶的。

以后我们常来看他，别哭，日子还长呢。

淮安，你说日子长不长？我觉得很长——长到足够我把你的每一句话都记一辈子。

随安
建兴十二年 六月初六`
      },
      {
        num: 6,
        title: '第六封',
        subtitle: '离别之日，快马加鞭后在驿站停下所写。纸张被汗水浸湿过，墨迹洇开。信封上有几道深深的褶皱，像是被人攥紧又松开。未寄出。',
        date: '建兴十二年-07-07',
        time: '申时',
        weekday: '',
        recipient: '淮安',
        sender: '随安',
        location: '丹溪谷口·山脚驿站',
        body: `淮安：

我走了。

你送我到山脚小镇的驿站，眼见着要跟我一路回桃止门。我再三要求，你才答应就在驿站目送我离开。

我骑上马，快马加鞭，直到离开琼山及远处才慢下来。

我一点也不敢回头。

我怕看见你一身白裙站在那里，怕我会忍不住调转马头把你一同带回去。可是我不能。桃止山是瘴气遍地的地方。

临走前我送了你一把佩剑，又给你一瓶毒药——天下无解。你收下了，还笑着说"用不着"。我没告诉你那把剑上也涂了剧毒，你若知道了定要骂我。可我宁愿你骂我，也不愿有一天这把剑救不了你。

淮安，我方才在马上回头望了一眼——琼山已经看不见了，只看见远处的云。

随安
建兴十二年 七月初七`
      },
      {
        num: 7,
        title: '第七封',
        subtitle: '灭门之后所写。纸面干净但墨极重，像每一个字都是刻上去的。没有涂改，没有一个多余的字。整封信散发着一种被硬压住的、即将碎裂的东西。未寄出。',
        date: '建兴十五年-01-01',
        time: '丑时',
        weekday: '',
        recipient: '淮安',
        sender: '戚凭川',
        location: '桃止山·门主书房',
        body: `淮安：

戚家没了。

一个戴着金色面具的男人凭空出现。一夜之间，屠杀戚家，亲人无一幸免。他趁我赶回家的路上独身杀上桃止山，门人死伤大半。他像是确切知道秘籍的藏匿之处，偷走了秘籍。

我回到桃止山的时候，满地都是血。

淮安，我没护住任何人。父母没了。门人死了大半。秘籍被偷了。

我曾经以为日子会一天一天这样平淡地过去，总有一天能祈得父母的谅解，总有一天能牵到心爱人的手。

金色面具人。我不认识他，无冤无仇。可他毁了我所有的一切。

我把丧事打点完了，回到桃止山，重新整顿门派。在我的带领下，弟子们逐渐学会并肩作战，懂得门派第一，自己第二。我下令礼节等事一概不问，打得过就让对方喊师兄，打不过就跪下承认是师弟。

我当了甩手掌柜，偶尔授课。

没人知道我夜里做什么。我几近疯狂地想着要为父母和门派报仇雪恨。

淮安，你现在在做什么？还在丹溪谷种花吗？紫藤花应该又开了一季了吧。

我没有给你寄信。不是不想写，是不敢写。我怕我的手上有血，写信给你会把你也染脏了。

戚凭川
建兴十五年 正月初一`
      },
      {
        num: 8,
        title: '第八封',
        subtitle: '深夜独写。烛火摇曳，纸张上偶尔出现断笔——写到这里忽然握不住笔了。后半段字迹极小极密，像是在写只给自己看的文字。未寄出。',
        date: '建兴二十年-03-03',
        time: '子时',
        weekday: '',
        recipient: '淮安',
        sender: '随安',
        location: '桃止山·书房',
        body: `淮安：

很久没给你写信了。

你知道我为什么不再写信了吗？我当上了桃止门的门主，掌握了天下第一蛊虫秘籍。可这不算什么。真正让我夜不能寐的，是另一件事。

我正在做一件很危险的事。

母亲将那个梅花香囊交给我的时候，表情沉重。我终于明白了——家族卷入的是二皇子的旧部。父亲因与二皇子的关联而被囚禁。母亲为了保护我，甚至说要断绝母子关系。

她说："什么皇帝，什么改朝换代，在我眼里都没有你的安危重要。"

我还是选择了与二皇子旧部合作。因为皇帝——他不是一个好皇帝。这条路一旦踏上，便没有回头。

淮安，我不能再写信给你了。砍头连坐，我不想连累你。

可我还是写了这一封。

就当是我自私吧。

随安
建兴二十年 三月初三`
      },
      {
        num: 9,
        title: '第九封',
        subtitle: '双目已近全盲。信纸上的字歪歪斜斜，有些字的偏旁写反了，有些字叠在了一起——他已经几乎看不见自己在写什么了。只有落款处的"随安"两个字写得极为用力，像是凭着肌肉记忆刻上去的。未寄出。',
        date: '建兴二十五年-12-23',
        time: '亥时',
        weekday: '',
        recipient: '淮安',
        sender: '随安',
        location: '桃止山·书房',
        body: `淮安：

我看不见了。

不是一下子看不见的，是一点一点。先是视野模糊，然后像隔了一层纱，再后来连人影都分不清了。大夫说头上的淤血没有及时处理，日积月累，便到了这个地步。

丹溪谷有圣医，能治好我的眼。可我快行至山穷水尽了——叛君之罪，砍头连坐。我怎么敢，又怎么舍得再去丹溪谷，把你拖进来。

我拒绝了沈池懿。

他带着柳君来求我——柳君身中我下的梅花烙毒，已是垂危之际。他恭恭敬敬地躬身作揖，叫我"随安"，说"唯有你能解此毒"。

我说不救。

淮安，你知道吗，柳君可能已经把关于我的事情告诉沈池懿了。没有人能保证以后不会。我不是不心痛，可我已经不是从前的我了。

唐挽初也断了联系。她听到桃止门的传闻——"杀伐无恶不作"。她最后一封信只有两句："山水有相逢，望君多珍重。"

贺清风呢？贺清风倒是无所谓，她篡了天行教教主的位置，轻描淡写地告诉我。她说"走了走了，进去坐下再说"——我有时候真的很羡慕她。

叛军节节败退了。我亲眼看到了战场上的惨状——饿殍满地，尸横遍野。叛军并没有比皇帝好到哪里去。那些士兵依然烧杀抢掠无恶不作。

我以前以为自己是在做对的事。可现在我不确定了。

这世上的事，怎么可能是非黑即白的呢？曾经我也不是白色的，这染缸里也断然没有纯净的白色。

淮安，如果有一天你能看到这封信——不要替我难过。你素面朝天的样子最好看，别哭。

随安
建兴二十五年 腊月廿三`
      },
      {
        num: 10,
        title: '第十封',
        subtitle: '身死之后，在忘川中所写。纸面没有任何痕迹——这不是纸，也不知是什么材质。字迹忽然变得极为清晰工整，像是一个已经看不见的人凭着记忆在写。全信不长。未寄出。',
        date: '建兴二十六年-01-01',
        time: '',
        weekday: '',
        recipient: '淮安',
        sender: '戚凭川',
        location: '途川（忘川）',
        body: `淮安：

我到了一个地方。他们叫它途川。

忘了怎么死的。也忘了很多事。可是有些东西忘不掉。

我忘了怎么走到这里来的，忘了最后发生了什么。可我记得建兴五年的月亮——又大又圆，我跟你说月亮在书院里看到的跟你在一块儿看的时候好像没那么大。其实是骗你的，一样大。

我记得你在花圃里说"它死了"，我记得你在沧敬长老墓前红了眼眶。我记得你说"随安，你相信来世吗"，我说若有来世，也会在见到你的第一眼便一见倾心。

我记得拜师墓那天我说"以后我们常来看他，别哭，日子还长呢"。

淮安，日子不长。

可你在的日子里，月亮是真的又大又圆。

尘事如潮人如水，只叹江湖几人回。

——戚凭川`
      },
      {
        num: 11,
        title: '第十一封',
        subtitle: '身死之后，在忘川中所写。纸面没有任何痕迹——这不是纸，也不知是什么材质。字迹忽然变得极为清晰工整，像是一个已经看不见的人凭着记忆在写。未寄出。',
        date: '建兴二十六年-01-01',
        time: '',
        weekday: '',
        recipient: '淮安',
        sender: '戚凭川',
        location: '途川（忘川）',
        body: `淮安：

我戚凭川，字随安，意思是我会一直一直伴随着江淮安。能够遇见你，我戚凭川此生无悔。下一次再给我做冰糖雪梨吧。
护你河清海宴，护你一马平川。

"淮安，这边有点冷。"
"淮安，我见到了很多熟悉的人，有我们之前的朋友，还有我的家人。"
"淮安，没有你的生活好无聊啊，我想喝你做的冰糖雪梨了。"
"淮安，我相信来世了，你也一定要相信啊，我们来世再见，我一定会找到你的。"
"淮安，当我知道我们的孩子没了的时候，我真的好难过啊。我本来想给他起个名字的，因为听说有名字就在世上有了牵挂，就不会孤单了。但好像我每次起的名字都不好听，你帮他起个名字好嘛？"
"淮安，这一世我好像都很幼稚，如果下辈子我们还能遇到，我一定要变得成熟一些。"
"晏之，我抱你去树上看月亮好不好。"
"啊？可是现在是白天啊……哎哎哎……"
"那就陪我一起等到晚上嘛，好不好？"
"好好好……"
"晏之，我跟你说，我家乡的风景可好看了，你一定要跟我去我的家乡看看。"
"晏之晏之，书院里的饭一点也不好吃，我喜欢喝你熬的冰糖雪梨，如果能多加点糖就更好啦。"
"晏之，你渴不渴，饿不饿，我下去帮你拿点吃的喝的。"
"晏之晏之，你会一直陪着我的对吗……"

我想要的，只是和淮安一起，和大家一起，走遍这山川湖海，游历四方，拔刀不平。
我想要的，只是与你一起看夕阳，看朝霞，安安稳稳的生活在一起。淮安，若有来世，我也会在见到你的第一眼，便一见倾心。

——戚凭川`
      }
    ];

    const letters = [];

    for (let i = 0; i < letterData.length; i++) {
      const data = letterData[i];
      const date = new Date('2025-01-01');
      date.setDate(date.getDate() + i * 15);

      const letter = {
        id: `taozhi-${data.num}`,
        mailboxId: 'mailbox-taozhi',
        title: data.title,
        subtitle: data.subtitle,
        sender: data.sender,
        recipient: data.recipient,
        paperStyle: 'vintage-literary',
        bgmUrl: '',
        date: data.date,
        time: data.time,
        weekday: data.weekday,
        location: data.location,
        letterTitle: data.subtitle,
        bodyText: data.body,
        content: [],
        illustration: null,
        createdAt: date.getTime(),
        updatedAt: date.getTime()
      };
      letters.push(letter);
    }

    return letters;
  },

  generateZhaixingLetters() {
    const letterData = [
      {
        num: 1,
        title: '第一封',
        subtitle: '写在作业本最后一页撕下来的纸上，折成歪歪扭扭的方块。字迹是小学三年级男生那种又大又歪的字，有好几个错别字用涂改液盖住了。纸上有绿豆冰沙的渍印。未寄出。',
        date: '2010-03-15',
        time: '晚上',
        weekday: '',
        recipient: '江宴',
        sender: '李平川',
        location: '方姨家客厅',
        body: `江宴：

今天来你家吃饭了。方姨做的红烧排骨好好吃，你吃了三块，我吃了四块。方姨笑我说"这孩子饿坏了"。

其实我没有饿坏。我就是觉得在你们家吃饭特别香。比我一个人在家吃香一万倍。

你今天牵着我手回家的。你的手好小好软，我故意走得慢一点，这样你就能多牵一会儿。

今天方姨说"以后都来咱家吃饭吧，和小宴一起"的时候，我差点哭了。但我忍住了。我可是男子汉，男子汉不能随便哭。

对了，你头发又长了。我送你的那根橡筋你戴在手上了，可是你一直不扎头发。风吹起来的时候你就用那根橡筋扎起来。你扎头发的时候特别好看。

我以后每天都陪你走回家。

李平川
2010年3月15日`
      },
      {
        num: 2,
        title: '第二封',
        subtitle: '写在数学草稿纸背面。字迹比第一封端正了不少，但依然有少年人的潦草。纸角有蚊香烧过的黑点。未寄出。',
        date: '2013-06-20',
        time: '深夜',
        weekday: '',
        recipient: '江宴',
        sender: '李平川',
        location: '阳台懒人沙发',
        body: `江宴：

你说你出生在海边。

我从来不知道。你说你爸爸已经去世了，你也不知道妈妈在哪里。你说这话的时候眼睛看着天上的星星，嘴角的绿豆冰沙渍都没擦掉。

我帮你擦了。"吃个东西都不干净，真是太笨了"。

我不想让你再一个人了。

今晚的星星好多。你说"和海边一样多"。我没有见过海。可是我想，如果海边的星星和今晚一样多，那海一定很漂亮。

你说的退潮以后捡贝壳，我也想去。等你带我去。

还有一件事我没告诉你。我在你椅子上敲的那三下——哒，哒，哒——我告诉你是"老师来了"的意思。

不是。

但我现在不告诉你真正意思是什么。等以后再说。

李平川
2013年6月20日`
      },
      {
        num: 3,
        title: '第三封',
        subtitle: '写在方姨给的信纸上，应该是种树那天。纸上有泥巴印子，字迹工整了很多，有一种少年人故作老成的认真。未寄出。',
        date: '2013-07-05',
        time: '下午',
        weekday: '',
        recipient: '小宴',
        sender: '李平川',
        location: '方姨家院子',
        body: `小宴：

今天我们种了一棵橄榄树。方姨说橄榄树要七年才能结果，要好好照顾它。

七年以后我们就大学毕业了。你说"七年以后我们在做什么"的时候，我就想好了答案——我要当警察。

你可能觉得我在说大话。可是我是认真的。小时候我做噩梦，梦到那些不好的事情，我缩在床底下祈求警察赶到。既然奇迹没有在过去发生，那我就自己来成为奇迹吧。

我给这棵树取名叫"小树"。

你知道吗，种树的时候街边超市正好在放《橄榄树》——"不要问我从哪里来，我的故乡在远方"。你愣了愣，然后点了点头说"好，那就叫小树"。

你点头的时候，我在想，如果以后每年都和你来给小树浇一次水，那七年很快就过去了。

到时候小树结果了，我们也毕业了，我也当上警察了。

你说我能不能考上大学——好吧，我可能确实智商不太够。但是你马虎起来指不定考试连名字都忘写。所以我们都差不多。

李平川
2013年7月5日`
      },
      {
        num: 4,
        title: '第四封',
        subtitle: '写在宿舍信纸上。字迹开始有了高中生的风格——不再歪歪扭扭，但行书还没练好，有些连笔很别扭。纸上有圆珠笔戳出来的洞——是写信的人用力太重了。未寄出。',
        date: '2015-11-12',
        time: '晚自习后',
        weekday: '',
        recipient: '小宴',
        sender: '李平川',
        location: '高中宿舍',
        body: `小宴：

冬天了。你织的红围巾我收到了。

说实话，一开始我觉得颜色太俗了。红色？戴出去不被人笑话死？可是你瞪了我一眼说"你敢摘下来我们就分手"，我只好认了。

——其实我特别喜欢。我戴着它在宿舍里晃了一圈，沈星何问我"哪儿来的"，我说是我女朋友织的，他白了我一眼说你秀恩爱能不能别这么明目张胆。

我哪儿明目张胆了。这就是名正言顺的炫耀。

今天走在放学路上，蔷薇花还开着，花瓣落了你一头你都不知道。我忽然想起很久以前的事——小学的时候你转学过来，翻我的课本封面知道了我的名字，主动和我做朋友。初中的时候我在你椅子上敲三下，你转过头看我，一脸疑惑。

哒，哒，哒。

你知道那是什么意思吗？

算了，不写了。反正你也不知道。

啊对了，你和沈星何比成绩又差了零点五分，他到处跟人吹。别理他，下次考回来。我在你心里永远是最帅的——不是，你永远是最厉害的。

李平川
2015年11月12日`
      },
      {
        num: 5,
        title: '第五封',
        subtitle: '高考结束当天。写在一张照片背面——照片是两人站在校门口的合照，江宴比了个耶，李平川歪着头笑。字迹轻快，有明显的少年人的雀跃和释然。未寄出。',
        date: '2016-06-08',
        time: '傍晚',
        weekday: '',
        recipient: '小宴',
        sender: '李平川',
        location: '教室',
        body: `小宴：

考完了！！！

不管考得怎么样，反正考完了！我估计语文最后那道大题我写跑题了，不过无所谓了。

你呢？你肯定考得不错。你什么时候考不好过？

说真的，我们真的要一起去公安大学了。你学法医，我学侦查。沈星何也来——这家伙非要跟我在一个宿舍，我拦都拦不住。

想想就觉得挺好的。三个人一起考进去，以后一起当警察。沈星何说要做最一线的缉毒警——我也要。你学法医，能帮我们验伤什么的。

用冰镇雪梨和辣条代替歃血为盟的时候，你是不是觉得我们很幼稚？我觉得也是。可是这种事，不正经地做反而不对味。

小宴，谢谢你愿意和我一起。

你知道吗，高一那天放学路上，我忽然弯腰亲你的时候，心跳快得要命。我以为你会打我。结果你只是红了脸说"你耍什么流氓"。

做我女朋友吧，江宴。我们谈恋爱。

——哦等等，你已经答应了。那我重新说：谢谢你答应和我谈恋爱。

李平川
2016年6月8日`
      },
      {
        num: 6,
        title: '第六封',
        subtitle: '写在军训期间。纸张是统一发放的信纸，折痕很整齐。字迹有了大学生的成熟感但依然活泼。纸上有汗渍——军训太热了。未寄出。',
        date: '2017-09-15',
        time: '熄灯前',
        weekday: '',
        recipient: '小宴',
        sender: '李平川',
        location: '公安大学宿舍',
        body: `小宴：

军训累死了。

唐歧他亲爹当教官，第一天就让唐歧加训三十分钟，我们全班在太阳底下罚站。唐歧那个表情，我到现在想起来还笑。

任远学长和贺引生学姐买了西瓜在队列前吃，被教官逮住了。于是连我们一起罚了十五组单臂支撑。我趴在地上的时候胳膊都在抖，余光往你那边飘，你不住回头看我。

你能不能别回头看我啊——教官盯着呢。看了我也不能帮你撑，我自己的胳膊都要断了。

不过足球友谊赛你太猛了。帽子戏法？连进三球？我和唐歧面面相觑——连妹子都踢不过，还争什么第一。

贺引生学姐对你特别欣赏，经常拉我们一起坐。我觉得她可能在撮合什么——不对，她已经和周然在一起了。那她就是单纯觉得你厉害。

对了，今天沈星何说宿舍夜话聊女生，问我"我们学校有美女吗"。我当然说了："我们小宴，法医组一枝花，全大学最美最好的女生。"

唐歧在旁边说"行，那来聊你的小宴吧"。我说"我和你还没熟到那个份上"——他还记着上次你夸他帅的事呢。你就不能看在我面子上少夸别人两句吗？

算了算了，你也夸过我是最帅的。我原谅你了。

李平川
2017年9月15日`
      },
      {
        num: 7,
        title: '第七封',
        subtitle: '大二下学期，毕业季尚远，日子还很长。字迹舒展自由，有大学生恋爱中特有的甜蜜和得意。写在图书馆借书单的背面。未寄出。',
        date: '2019-03-14',
        time: '下午',
        weekday: '',
        recipient: '小宴',
        sender: '李平川',
        location: '公安大学图书馆',
        body: `小宴：

你今天来寝室找我了。

然后你当着我的面说"唐歧也太帅了"。

——你知道我接下来一整周心情有多差吗？

你还说"在你心里我永远是最帅的"——可你先夸了别人啊！什么叫"先夸别人再哄我"，这逻辑不对吧？

算了。我原谅你了。谁让你是我女朋友呢。

最近想了很多事。唐永明老师的课越来越难了，可是他其实对我们很好。上次打架被抓进派出所，他明明可以给我们处分，最后只让写检讨。我那个检讨写了一千字，用了好多他看不懂的学术词汇——反正他也看不出来。

任远学长毕业后去了市局缉毒处，听说干得不错。沈星何说他以后也要做缉毒警。我也想。

小宴，有时候晚上躺在宿舍床上会想你。想你小学三年级转学过来的第一天，翻我课本看我的名字。想你初中拿着绿豆冰沙来找我，我们在阳台看星星。想你高中织的那条红围巾。

日子还长。我们还有很久很久。

李平川
2019年3月14日`
      },
      {
        num: 8,
        title: '第八封',
        subtitle: '毕业聚餐后所写。贺引生组织了六人聚餐，在周然的画廊。桌上摆着六朵卡萨布兰卡。字迹开始有了毕业生的感慨和一点点不安，但整体还是温暖的。未寄出。',
        date: '2020-06-28',
        time: '深夜',
        weekday: '',
        recipient: '小宴',
        sender: '李平川',
        location: 'STELLA画廊',
        body: `小宴：

毕业了。

唐永明老师在毕业典礼上致辞的时候，引用了康德的话："头顶的星空和心中的道德律。"我穿着学士服站在那里，忽然觉得这两句话特别好——头顶的星空是我们仰望的东西，心中的道德律是我们坚守的东西。

我以第一名毕业，直接进省厅。你继续做你的法医。沈星何去了市局缉毒处。唐歧进了禁毒支队。贺引生被内定为下一任禁毒支队副支队长。任远学长——

任远学长不在了。

今天在画廊吃饭的时候，桌上摆了六朵卡萨布兰卡。花语是"永恒的美丽"。这六朵花本来是我给你准备生日礼物的。可是任远走了。花还在，人不在。

你作为法医，不得不亲手检验了伙伴的遗体。你拒绝任何人陪。我知道你心里有多疼。可是你什么都不说，你就一个人扛着。

沈星何说任远的死不是单纯的交通事故。那张纸条上画着老虎图案——我不知道这意味着什么，但我会查清楚的。

小宴，我站在省局门口的时候，把毕业证明书攥成一团。我发誓——我要成为一名优秀的缉毒警察。

为了任远学长。为了你。为了我们所有人。

李平川
2020年6月28日`
      },
      {
        num: 9,
        title: '第九封',
        subtitle: '字迹忽然变得很不一样——表面轻松但能感觉到笔尖在抖。写在奶茶店的订单纸背面。墨色时深时浅，有些字写了一半被划掉，划掉的地方又被重新写了别的字。未寄出。',
        date: '2024-08-15',
        time: '打烊后',
        weekday: '',
        recipient: '小宴',
        sender: '李平川',
        location: '摘星人奶茶店',
        body: `小宴：

我开了一家奶茶店。叫"摘星人"。你不是爱喝奶茶吗，我专门给你做。

我知道你在想什么——你不是问我"不做警察了吗"吗。嗯。不做了。

你没有追问。你只是勉强笑了笑，说"这算什么事啊"。

小宴，对不起。

我没有办法告诉你真正的理由。我只能像从前一样，维持着和从前一样的神情和语气。看到你松了一口气的时候，我心里涌上来的不是轻松，是无限的亏欠。

你知道方姨喜欢什么花，你知道我最爱吃的东西，你知道我走路时要把你拉到路内侧。可是你连我家是什么样的都不知道。我知道你所有的事情，你什么都不知道——但是我不愿意这样，但是我不能告诉你。

你最近越来越沉默了。我知道你在生气——我和你一起长大，你太了解我了。你一定察觉到了什么。

可我什么都不能说。

摘星人奶茶店开业了。贺引生来捧场了，沈星何也来了，唐歧也来了。你最后来的，站在门口看了一眼招牌，没有说话。

小宴，你还是别来了。这家店——不是一个好地方。

李平川
2024年8月15日`
      },
      {
        num: 10,
        title: '第十封',
        subtitle: '深夜独写。毒瘾发作后所写。纸面有大量水渍——分不清是汗是泪。字迹时而大时而小，有些句子写到一半忽然断了，像写字的人忽然失去了力气。未寄出。',
        date: '2026-01-07',
        time: '凌晨',
        weekday: '',
        recipient: '小宴',
        sender: '李平川',
        location: '摘星人奶茶店·后室',
        body: `小宴：

我又做那个梦了。

梦里我穿着干净的警服，上面有勋章，你坐在旁边笑。你弹我额头说"你的庆功宴，自己一点都不上心，赶快去接下他们"。沈星何拎着礼物来了，唐歧帅得引起惊呼，贺引生和周然也来了。

然后一个熟悉的声音说："李平川，我来迟了。"

我抬头一看——是任远。可是任远已经死了。

世界扭曲崩塌。所有的愉悦变成尖刻的嘲笑。我抱头痛哭。

这不是真的。这不是真的。

快乐这种情绪直接在我的生命中消失了。我能感受到的"快乐"只有幻觉里的东西。除此之外，我什么都不要。不——是我什么都不要，除了你。

我自己在戒。汗水唾液浸湿毯子，背上手臂全是自己挠出来的血痕。幻觉里看到妈妈招手——可是我，我想你了，我每次都拒绝了。

因为我怕。我怕有一天我会发疯，怕百分之一的可能对你会动手。

所以我该走了。什么看海、什么青梅竹马都化作过眼云烟。你值得更好的人。

小宴，你最近收到一个熔岩蛋糕——不是我送的。我不送蛋糕。你知道的。可是你没有说。你只是在冷战。我甚至怀疑你是不是有了喜欢的人了。

如果是，也好。比我这个见不得光的身份好得多。

李平川
2026年1月7日`
      },
      {
        num: 11,
        title: '第十一封',
        subtitle: '写在沈星何生日事件之后。纸张被揉成一团又展平，褶痕极深。字迹非常潦草，有些字几乎无法辨认。这封信写得很短。未寄出。',
        date: '2028-07-10',
        time: '深夜',
        weekday: '',
        recipient: '小宴',
        sender: '李平川',
        location: '摘星人奶茶店',
        body: `小宴：

沈星何来给我过生日了。他定了一只皮卡丘蛋糕，说"祝你永远十八岁"。

十八岁。

他跟我说"跟江宴和和美美，早日步入结婚殿堂"。我在心里说：抱歉，做不到。

他说"万事顺心如意，苟富贵，勿相忘"。我在心里说：顺心如意，太难了。

他说"身体健康，平平安安"。我沉默地笑了笑。

小宴，你知道我本来打算在生日那天向你求婚的吗？

我什么都准备好了。戒指、花、话。

可是我回不去了。

后来沈星何喝了那杯酒——我给他倒的酒。他开始浑身颤抖，酒杯摔在桌面。我打了120，然后自己也坠入了昏迷。

他没事。我后来打听到他无大碍。可是我再也没有联系过他。

小宴，你知道我多想掀翻那张桌子吗。多想哭喊着对他说"你快走好不好"。可是我不能。外面有人在看着。如果我没有把今天的事办好，我失去的东西，会比我的命还重要。

所以我亲手把毒下在了最好的兄弟的酒里。

小宴，我还是人吗？

李平川
2028年7月10日`
      },
      {
        num: 12,
        title: '第十二封',
        subtitle: '天桥分手那天晚上所写。纸面被雪水浸湿过，墨迹严重晕开。写在一张被折叠了无数次的小纸片上——可能是随身携带了很久的纸。字迹颤抖，有些地方用力极重几乎戳破纸面。未寄出。',
        date: '2029-01',
        time: '雪夜',
        weekday: '',
        recipient: '小宴',
        sender: '李平川',
        location: '天桥',
        body: `小宴：

你今天在天桥上问我："你到底在隐瞒什么？"

街头艺人在天桥下面唱《橄榄树》——"不要问我从哪里来，我的故乡在远方。"

七年了。小树应该结果了吧。

可是那棵橄榄树已经被砍了。等了七年，没有等来七年前期盼的图景。

我想起我敲你椅子的那三下。哒，哒，哒。你那时候转过头看我，一脸疑惑。

我想起你织红围巾的时候，威胁我"你敢摘下来我们就分手"。

我想起我们在阳台懒人沙发上躺着看星星，你说"这里的星星好多，和海边一样多"。

我想起种树那天，你说"七年以后我们在做什么"。

七年以后，我在这里。一个吸毒的人。一个卧底的人。一个亲手把毒下在兄弟酒里的人。一个再也无法当警察的人。

我戴着你织的红围巾站在天桥上。雪下得很大。你说的话我一个字都回答不了。

我想让你过更幸福的生活。所以我选择了离开。

——其实我想说的是：是的，不用再说了。我爱你。

可我没有说出口。

李平川
2029年1月`
      },
      {
        num: 13,
        title: '第十三封',
        subtitle: '写在剧本杀事件之后。冰库中发现尸体、周然被害之后。纸面极为干净，像是在下最后决心之前写的。字迹有一种令人不安的平静。未寄出。',
        date: '2029-03',
        time: '深夜',
        weekday: '',
        recipient: '小宴',
        sender: '李平川',
        location: '废弃海鲜市场外',
        body: `小宴：

贺引生说凶手在我们当中。你说"你们俩，给我老老实实在这待着"——你看着我。我不敢看你的眼睛。

你检查尸体的时候，手上全是血渍。你说他生前经历过很大的痛苦。你哽咽了。

我倚着架子，眼睛瞟向别处，故意把声音拖得很长："遵命——"

你一定恨死我了。

小宴，你知道我是谁吗？我是"逐日"。我是戚卫国培养出来的毒贩。我是那个在沈星何酒里下毒的人。我是那个八岁时在星星花田里逃命的孩子的反面——我变成了制造噩梦的人。

可我也曾经是你同桌的那个男生，是你给我擦汗的那个少年，是你在阳台上一起看星星的那个人。

头顶的星空和心中的道德律。

小宴，我还能看见头顶的星空，可我心中的道德律已经碎了。

李平川
2029年3月`
      },
      {
        num: 14,
        title: '第十四封',
        subtitle: '回到一切开始的地方。纸张粗糙，像是在旅途中随手买的。字迹出奇地稳定——是一个已经做好了所有决定的人的笔迹。未寄出。',
        date: '2029-05',
        time: '傍晚',
        weekday: '',
        recipient: '小宴',
        sender: '李平川',
        location: '西南边陲',
        body: `小宴：

我回来了。西南边陲。我出生的地方。

星星花还在开。和你小时候看到的不一样——这里没有星星花田了，只有零星几朵开在路边。它们长得很好，像什么都没有发生过一样。

我站在那里看了一会儿。风吹过来的时候，我好像又听到了那个童谣："天亮了，花开了，我们摘掉花里的星星，卖给不快乐的人。"

我不快乐。可是我不需要星星花。

我需要的是你。

小宴，我想了很久很久。从我八岁那年在床底下听到父母最后的声音——"去找警察"——到现在已经二十多年了。我找过警察，我也当过警察。后来我不当警察了。

可是我还是要做最后一件像警察的事。

你永远不会知道那三声哒哒哒的意思是我爱你。你永远不会知道我把那颗白色石头藏了二十一年。你永远不会知道我每次路过那棵被砍掉的小树都会停下来站很久。

你也不会知道，其实我一直叶公好龙、尾生抱柱般爱你——爱到不敢说出来，爱到只能用敲三下椅子来代替。

小宴，我愿你去永远仰望苍穹，永远心怀热忱，永远有头顶那一片星空，永远铭记心中道德。

扔了那条红围巾。忘了我。

李平川
2029年5月`
      },
      {
        num: 15,
        title: '第十五封',
        subtitle: '纸面没有任何瑕疵——不像是在艰难条件下写的，花了很长时间一笔一笔认真写下来的。字迹工整，每一个字都落在该落的位置上。全文不长。未寄出。',
        date: '不确定',
        time: '',
        weekday: '',
        recipient: '江宴',
        sender: '李平川',
        location: '卡萨布兰卡花田',
        body: `江宴：

小宴，从年少至今，我最大的幸福无非就是你的笑靥如花。后来每当我毒瘾发作时，我都在极端的痛苦中，恍惚想起我们那模糊而遥远的过去——那棵我们亲手种的小树，那条你织的红围巾，那一朵朵卡萨布兰卡。那时我们风华正茂，有远大前程与光明理想。

可命运是如此凉薄而讥讽。天地多不公。小宴，我再也做不了警察了。我的未来是死寂的苍茫大雪。我是逐日，像夸父逐日般永远可望而不可即。我又怎么配得上你。

你像盛开的卡萨布兰卡灼灼肆放在最干净的土壤。

小宴，我给你贫穷的街道，我给你绝望的日落，我给你破败郊区的月亮，我给你一个久久望着孤月的人的悲哀。

小宴，你永远不会知道我一直叶公好龙、尾生抱柱般爱你。你永远不会知道那三声哒哒哒的意思是我爱你，那是我无比隐晦而无法负担的爱意。

小宴，我愿你永远仰望苍穹，永远心怀热忱，永远有头顶那一片星空，永远铭记心中道德。扔了那条红围巾，忘了我。

或者当我已经死了——当我李平川已经作为一名光荣的缉毒警察英勇牺牲，被葬在一片卡萨布兰卡盛开的花田下，这样几十年后树都老了，我们还能再次相逢。

让年少时我的玉树琅琅意气风发是你对我最后的记忆，永远年轻，永远热泪盈眶，而不是作为一个臭名昭著声名狼藉的毒贩锒铛入狱十五年。

小宴，那可是十五年啊。对于你多么珍贵的时光。别再等我了。你的前途万丈光明，你要让你的父亲骄傲。而我早就失去了与你并肩的资格。

小宴，我这一生注定无法一马平川，只能以我半生微薄护你河清海晏。我给你一个从未有过信仰的人最隐晦而坚定的忠诚。

小宴，做你自己。

我爱你。

李平川`
      }
    ];

    const letters = [];

    for (let i = 0; i < letterData.length; i++) {
      const data = letterData[i];
      const date = new Date('2010-03-15');
      date.setDate(date.getDate() + i * 180);

      const letter = {
        id: `zhaixing-${data.num}`,
        mailboxId: 'mailbox-zhaixing',
        title: data.title,
        subtitle: data.subtitle,
        sender: data.sender,
        recipient: data.recipient,
        paperStyle: 'vintage-literary',
        bgmUrl: '',
        date: data.date,
        time: data.time,
        weekday: data.weekday,
        location: data.location,
        letterTitle: data.subtitle,
        bodyText: data.body,
        content: [],
        illustration: null,
        createdAt: date.getTime(),
        updatedAt: date.getTime()
      };
      letters.push(letter);
    }

    return letters;
  },

  generateXiaowangziLetters() {
    const letterData = [
      {
        num: 1,
        title: '第一封',
        subtitle: '写在白房子的作业纸背面。字迹是少年人那种歪歪扭扭但又努力写工整的字，有些字的笔画明显犹豫了——想写又不太敢写。纸角有一个歪歪扭扭的纸飞机折痕，大概是上课无聊折着玩的。未寄出。',
        date: '白房子·第七年',
        time: '课后',
        weekday: '',
        recipient: '江雪',
        sender: '李云意',
        location: '白房子·宿舍',
        body: `江雪：

你是不是又在追沈泊安了？上次我看到你在走廊里追着他跑了三圈，他跑得比你还快。唐潮说你追人的时候像一阵风，我觉得他说得不对——你追人的时候明明像龙卷风。

打了他们，可以不打我了吗。白房子的走廊那么窄，你每次追上来我就往另一头跑，跑到门口了再折回来。有一次你追得太急摔了一跤，膝盖出了血，我吓了一跳，蹲下去看你的伤口，你哇的一下就哭了。

结果哭完了你又追着我打了。你这个人到底讲不讲道理？

白房子的天空一直是那个穹顶。我有时候想，穹顶外面是什么样子的。沈泊安说外面全是废墟，不值得看。可我还是想知道。

你今天在院子里看天看了好久。我也在旁边看了好久。后来你问我"你在看什么"，我说"在看你看天"。你白了我一眼。

算了不写了，你又要追我打了。

——李云意`
      },
      {
        num: 2,
        title: '第二封',
        subtitle: '写在医馆处方笺的空白处。字迹比第一封端正了一些，但某些地方用力太重，纸面被戳出了浅浅的痕迹。纸张边角有药水的渍印。未寄出。',
        date: '分配后第三天',
        time: '午后',
        weekday: '',
        recipient: '小江医生',
        sender: '李云意',
        location: '医馆走廊',
        body: `小江医生：

我被分配为"园丁"。你被分配做医生。沈泊安被分配去做技术员。

我本来以为自己会分到一个很无聊的活儿，结果他们让我去种地。园丁——说白了就是种地的。不过也挺好，我爸妈也是搞农业研究的。

昨天我第一次去医馆找你。我假装胳膊上有个小伤口，你低头看了一眼，拿棉签帮我擦了擦，说了句"没事了"。

你的手好凉。但是碰到我胳膊的那一下，暖暖的。

所以我今天又去了，这次是另一个胳膊。你看了我一眼，说"昨天不是左胳膊吗，今天换右边了？"

我没说话。

你说："你不是因为伤口疼吧。"

我被你拆穿了。但没关系——被拆穿也没关系，小江医生。明天再来的话，理由只会是，我想见你。后天，大后天都是。

——李云意`
      },
      {
        num: 3,
        title: '第三封',
        subtitle: '深秋傍晚坐在医馆门口台阶上写的。纸张是从处方笺上撕下来的，上面有一小块碘伏渍。字迹在傍晚的光线下写得有点随意，但某些地方忽然很认真。风吹过的时候纸差点飞走，按住了继续写。未寄出。',
        date: '深秋',
        time: '傍晚',
        weekday: '',
        recipient: '小江医生',
        sender: '李云意',
        location: '医馆门口台阶',
        body: `小江医生：

你今天凑在我耳边敲了三下。

哒、哒、哒。

你知道吗，我差点从椅子上摔下来。小时候你追着我打，我从来没想过有一天你会壁咚着给我处理伤口。你一只手撑在我身后的墙上，另一只手拿棉签擦我额头上的擦伤，整个人凑得特别近。我都能闻到你身上的药水味。

你敲的那三下——是什么意思？

你说是"检查伤口"的信号。我不信。

不过也没关系。反正你在我耳边敲的时候，我心跳快得要命这件事，你大概也听到了。毕竟你靠得那么近。

昨天你教我折纸船。我折了三只都丑得不行，你拿过去帮我拆了重新折，嘴里说"你怎么这么笨"，手上却折得很仔细。最后那只纸船我带回来了，放在窗台上。

窗台上现在有一只纸船。

等我学会了折，也送你一只。

——李云意`
      },
      {
        num: 4,
        title: '第四封',
        subtitle: '南瓜灯告白当晚所写。纸张是从包装纸上撕下来的，上面有蜡烛熏出的淡淡焦味。字迹比平时大了不少，有些地方写得很用力像在喊，有些地方忽然变小变轻。信纸折叠方式很奇怪——折成了纸飞机的形状。未寄出。',
        date: '南瓜灯之夜',
        time: '深夜',
        weekday: '',
        recipient: '小江医生',
        sender: '李云意',
        location: '屋顶',
        body: `小江医生：

我做了一只南瓜灯。

世界上大概从来没有人做过南瓜灯。桃源城里没有南瓜——至少我从来没见过。可是我找到了一个长得像南瓜的东西，挖空了里面，刻了一张笑脸。

你看到的时候愣了一下。然后你说"这是什么"。我说"南瓜灯"。你又说"哪有南瓜灯这种东西"。我说"现在有了，我做的"。

你盯着我看了好几秒，然后笑了一下。

你的笑真好看。穹顶下的人造灯光再亮，都没有你的笑好看。

然后我告诉你——

我喜欢你，江雪。

你站在那里没有说话。南瓜灯的烛光在你脸上跳。你好像想说什么，又好像什么都说不出来。

后来你说："你现在还不够格。"

我知道你的意思。所以我等。等到够格的那一天。

屋顶上风很大，南瓜灯差点被吹灭了。我用手护着火光，你在旁边看着我。

后来我们一起坐在屋顶上，你教我折纸飞机。我折的"江雪号"飞得比你的还远。你瞪了我一眼说"是不是作弊"，我说"是你的名字给它加的buff"。

小江医生，南瓜灯的烛光会灭，但是我喜欢你的这件事不会灭。

——李云意`
      },
      {
        num: 5,
        title: '第五封',
        subtitle: '一起做饭之后写的。纸张有油渍——大概是做饭时手没擦干净就写了。字迹轻快跳跃，有些地方写得很快像怕人看到。纸的右下角画了一只歪歪扭扭的纸船。未寄出。',
        date: '冬日',
        time: '饭后',
        weekday: '',
        recipient: '江雪',
        sender: '李云意',
        location: '医馆后厨',
        body: `江雪：

今天我们一起做饭了。

你负责切菜，我负责炒菜。你切土豆丝切得比我还细，我说"不愧是小江医生，拿手术刀的手切土豆丝也是专业级别"，你笑了一下说"别贫嘴"。

我不小心把锅铲碰到了地上，弯腰去捡的时候正好碰到你弯腰来捡，两个人的头差点撞在一起。你退后一步说"让开"，我蹲在那里看着你。

你今天围着红围巾。红色的，特别好看。

我们端着两碗面坐在门口吃。外城的风吹过来，面凉得很快，但我们都吃得很快。你吃到一半停了一下，我说"怎么了"，你说"没什么，就是觉得面很好吃"。

我知道你不是在说面。

冬天真冷。但今天不冷。

——李云意`
      },
      {
        num: 6,
        title: '第六封',
        subtitle: '冰面奔跑之后所写。纸张冻得有些发硬，墨迹在寒冷中干得很慢，字迹反而格外清晰。有几滴不知道是水还是别的什么落在纸上，很快结成了微小的冰晶。未寄出。',
        date: '初春·冰面',
        time: '傍晚',
        weekday: '',
        recipient: '江雪',
        sender: '李云意',
        location: '外城·冰面旁',
        body: `江雪：

今天冰面上的风好大，你的头发全飞起来了。

你在冰上跑的。你跑得比我快——就像小时候追着我打一样，"你怎么还是跑这么快"，你回头笑了一下说"是你太慢了"。

我追上去了。你往前跑我往前追，冰面滑得不行，两个人都差点摔。后来你停下来了，转过身来，风把你头发吹到脸上，你也不管。

你站在冰面对我说："就算是世界末日又如何。"

我站在那里看着你。穹顶外的世界是废墟，杂草吞没了人类所有的造物。可是你站在冰上，背后是灰蒙蒙的天，"就算是世界末日又如何"。

那一刻我在想，如果世界真的要末日了，那我也只要你在旁边就够了。

后来我们一起看月光落在雪上。雪在发光，一闪一闪的，像碎掉的星星。你蹲下去捧了一把雪，然后朝我扔过来。

我躲开了。你扔得不准。但我假装没躲开，让雪砸在脸上。

你笑得前仰后合。

江雪，你知道吗，有些时候我觉得穹顶外面那些废墟也没那么可怕。因为不管世界变成什么样，你都会朝我扔雪球。

——李云意`
      },
      {
        num: 7,
        title: '第七封',
        subtitle: '在玫瑰园里写的。纸张上沾了泥土和碎花瓣的痕迹，有一片极小的叶子被夹在折痕里。字迹舒展温柔，有一种终于安定下来的从容。未寄出。',
        date: '外城·第一年夏',
        time: '午后',
        weekday: '',
        recipient: '小雪',
        sender: '你的·云意',
        location: '玫瑰园',
        body: `小雪：

我找了好久才找到一棵小苗，你帮我一起挖坑，我扶着树干你填土。种完以后你从口袋里掏出一根红绳，系在了树枝上。

风吹过来的时候红绳飘了一下。你说"希望它能好好长大"。

我给这棵树取了个名字——不对，这棵树的名字是你取的。因为你之前说"七年才能结果"的时候，我就想到了很久以前的事情。好像是很久很久以前——久到像上一辈子的事。那时候也有人种过一棵树，叫"小树"。

小雪，你有没有一种感觉——我们好像以前就认识了。

不是白房子那种认识。是更早以前。

我们领养了阿还。你第一次抱他的时候他一直在哭，后来你轻轻拍了三下他的背——哒、哒、哒——他忽然就不哭了。

你看到我愣住了。你说"怎么了"，我说"没什么"。

没什么。只是那三下太熟悉了。

屋顶上的纸飞机大赛，你的"云意号"飞得最远——好啦我承认是上次"江雪号"那次我确实有点取巧。但这次是公平比赛。你赢了以后得意得不行，可是"你可不可以谦虚一点"。

小雪，你教我折的纸船，你不在的日子里我折了一只又一只。窗台上已经放不下了。我把它们串起来挂在天花板上，每次抬头都能看到。

每一只纸船都装着我对你的思念。

我把所有的纸船送你，你会跟我走吗？

——你的·云意`
      },
      {
        num: 8,
        title: '第八封',
        subtitle: '黄昏之舞后所写。纸张上有花粉和露水的痕迹。字迹轻柔极了，像在写一首诗。某些地方停顿了很久——墨水在停笔处洇开一小团。整体散发着一种安静的、温柔到骨头里的东西。未寄出。',
        date: '秋·黄昏',
        time: '黄昏',
        weekday: '',
        recipient: '小雪',
        sender: '云意',
        location: '玫瑰园',
        body: `小雪：

今天黄昏的时候我们在玫瑰园里跳舞。

没有音乐。你哼了一段旋律，我认不出来，但你哼得很好听。我请你跳舞的时候你看了我好几秒，说"你什么时候学会说这种话了"。

我说"一直都会。只是以前不敢说。"

你把手放在我肩膀上。我们踩着枯叶转了一圈又一圈，落叶被风卷起来，红黄相间的碎片在空中飘。

我忽然觉得——如果这一刻永远不停就好了。

穹顶的光模拟了黄昏的颜色，橘红和金色混在一起。你指着天空问我"你觉得那片云像什么"，"像一只船"。"纸船还是木船"，"你折的那种"。

然后我们聊到了河流。

我轻声问你，小雪，河流的尽头有什么呢？

你想了想，笑着答——有我们思念的人。

我转头看你。黄昏的光在你脸上，你的眼睛亮亮的。

那一刻我许了一个愿——用我的一切，换江雪岁岁平安。

流星不知道有没有听到。反正穹顶里不会有流星。但我还是许了。

小雪，和你在一起的每一刻都是幸福。不是那种惊天动地的幸福，是你在厨房切土豆丝我在旁边碍手碍脚、你在屋顶折纸飞机我在下面捡、你朝我扔雪球我假装被砸到的那些时刻。

那些小小的时刻加在一起，就是我全部的幸福。

——云意`
      },
      {
        num: 9,
        title: '第九封',
        subtitle: '月光综合征发病期间所写。听觉已明显衰退，纸张被压得很平——写字的人似乎在用更大的力气确认自己还在"说话"。字迹比以前大了一些，某些地方笔迹忽然断了，像是在确认自己还能不能听见笔尖划过纸面的声音。未寄出。',
        date: '发病后·第四十天',
        time: '夜',
        weekday: '',
        recipient: '小雪',
        sender: '云意',
        location: '玫瑰园·小屋',
        body: `小雪：

我听不太清了。

一开始只是远处的声音变得模糊，后来你站在我身边说话也像隔了一层水。我知道你在说什么——我看你的口型就能猜到。可是我听不到你的声音了。

你大概已经发现了。因为你现在说话的时候会面向我，会放慢速度，会在我看不到的地方轻轻拍我三下。

哒、哒、哒。

只要这三下，我就知道你在。我就安心了。

你总守在我目光能及的地方。我找不到你的时候会慌，然后一转头就看到你站在那里。你就站在那里，安安静静地看着我。

昨天你处理完伤口以后我拉住了你的手。你的手还是凉的，但是碰到我的那一刻暖暖的。

我想跟你说很多话。想说我怕，说我不想让你看到我这个样子，说我应该被保护的人是你才对。可我说不出口——不是不想说，是说了你也听不清我说什么了。

所以我写了这封信。

小雪，我听不到你说话了。可是我能看到你。你笑的时候眼睛会弯成月牙，你皱眉的时候鼻尖会动一下，你说"别贫嘴"的时候嘴角其实是翘着的。

这些我都看得到。

所以不要担心。你在我目光能及的地方，就够了。

——云意`
      },
      {
        num: 10,
        title: '第十封',
        subtitle: '废墟婚礼之后所写。纸张是从旧世界的某本书上撕下来的，边缘发黄发脆。字迹极为清晰——是一个已经与这个世界和解的人写的。没有涂改，没有犹豫，每一笔都落在它该落的位置上。纸张被对折了一次，折痕里夹了一片枯玫瑰花瓣。未寄出。',
        date: '不确定',
        time: '',
        weekday: '',
        recipient: '江雪',
        sender: '李云意',
        location: '废墟',
        body: `江雪：

我们结婚了。

在废墟里。没有教堂，没有宾客，没有白纱，没有戒指。世界在崩塌，而我们在相爱。

你站在碎石和断墙之间，穿着你那件旧白大褂，上面有洗不掉的药渍。阳光从穹顶的裂缝里漏进来，照在你身上。

"我们就并肩站在一起好不好"。

你割破了自己的蜂鸟纹身取血救我。——用你10年换我们一起的5年。我的好女孩啊，你怎么这么傻。

本该是我保护你的。

可是我这一次不能再把你推开了。前两世——不，是以前那些无论如何也想不起来的梦里——我好像总是把你推开。那时候我觉得这是为了你好。可现在我明白了。

我从前总执拗地想让你好好活着，可我也忘了——一起奔赴死亡，又怎么不算最浪漫的爱意。

小雪，我斩了橄榄树，做成了木舟。

我要带你去河流的尽头看看。你走慢些，我会追的快些。

我知道你知道我这辈子除了遇见你，最骄傲的事情是什么——是我在这个荒芜星球上孕育出了全世界独一无二的玫瑰花送给你。

而如今丹溪谷凋零的玫瑰，如今开满桃源。

在这贫瘠的土地上，你是我唯一的玫瑰。也许世界上也有五千朵和你一模一样的花，但只有你是我独一无二的玫瑰。

世界在崩塌，而我们在相爱。

在下个新世界，等我。

——李云意`
      },
      {
        num: 11,
        title: '第十一封（绝笔·三生信）',
        subtitle: '纸面干净，字迹工整从容。像是在很长的一段时间里断断续续写的，但每一处墨色深浅一致，没有急躁的痕迹。全文跨越三生三世。未寄出。',
        date: '不确定',
        time: '',
        weekday: '',
        recipient: '江雪（淮安/小宴）',
        sender: '你的男朋友 李云意',
        location: '不确定',
        body: `致我唯一爱的小江：

信写到开头反倒犹豫了，该叫你淮安、小宴，还是小雪呢？算了不纠结啦，就叫你——我天下第一无敌可爱、聪明漂亮、贤惠温柔又有气质的女朋友大人！毕竟我这起名鬼才的名号可不是白来的对吧？
每一世，我都会在见到你的第一眼就动心，你呀，跑不掉的。

曾经你还问我，你相信来世吗。我相信，仅一世的姻缘怎能满足得了的我，我想要和你生生世世在一起。

以前总忍不住想，这个世界上真的有神明存在吗？
现在我信了。念念不忘必有回响，一定是神明听见了我翻来覆去的思念祈愿，才让我每一世都能找到你。

第一世，我是傻乎乎的戚凭川，爱上了叫江淮安的姑娘。那时候在书院，你乔装成男生，我宁愿承认自己喜欢男孩子，也要向所有人昭告对你的心意。晏之，我心悦你。现在想想真的好傻，哈哈哈，可我那时候本来就笨得不行——读书要你教，名字要你取，就连你哒哒哒敲我房门、抱着我们的孩子来找我的那天，我都硬着心肠把你拦在了门外……

淮安，想带你看看桃止的晚霞。我本来答应要带你去桃止山看最美的晚霞，最后还是食言了。直到生命最后一刻，我都没能兑现这个约定。对不起。我多想再看你一眼啊，哪怕就一眼，可到最后我连你的模样都没能再见到，我早已失去视觉。可是人生的最后一刻，我明明看见了你。戚凭川啊戚凭川，你怎么就舍得把江淮安一个人留在这世上呢。淮安，来生的事，来生再谈，若真有来世，我也会对你一见倾心。

后来第二世，我们到了公安大学。这一回我总算不笨啦，成了同届最优秀的学生李平川，说到这儿是不是该给你男朋友鼓个掌？我厉害吧！
我的日子因为江宴的到来，变得幸福。我永远都忘不掉，我们青梅竹马一起长大的那些快乐时光。小宴，我喜欢你。
"哒哒哒"是专属于我们的暗号，是我藏在心底的爱意证明。
你织的红围巾我一直戴在身上，半分都不敢摘——我可太清楚了，以你的小脾气，指不定就要闹着跟我分手呢。
送你的六朵卡萨布兰卡，藏着我们永恒不变的爱❤️
还有我们一起种下的那棵小树，听说它七年才结一次果，那时候我总在偷偷想，能陪你看多少次它结果的样子啊。

对不起，我还是长不了嘴，堕入黑暗的我失去你应该是理所应当的叭……不过还好，你安然无恙。
我失去了味觉，再也尝不出甜是什么滋味；
我砍掉了我们一起种了许多年的小树；
天桥的雨夜我把你送我的红围巾，还给了你，那天我听出来了，原来不管我干了什么你都爱我，可是我怎么能让这个世界我唯一的光和我一起堕入黑暗呢？
七朵卡萨布兰卡，装着我承受不起的爱意💔
可真的是这样吗？
等我花了十五年终于走出黑暗的那一刻，第一眼就看见，你还站在原地等我。
谢谢你，原来你一直都在。
我才明白，七朵卡萨布兰卡加一枝玫瑰，是——李平川永远爱江宴，而江宴一直等李平川。

这一世，你是T0221江雪，我是A0517李云意。
小时候你总追着我打，我没想过有一天你会凑在我耳边敲三下，壁咚着给我处理伤口。哎呀，现在想起来我都还脸红。
长大以后更没出息，为了天天能见到你，我三天两头往医院跑，拿胳膊上的小伤口当借口，最后被你毫不留情地拆穿。可就算被拆穿也没关系，小江医生，明天再来的话，理由只会是，我想见你。后天，大后天都是。

我永远都会为你而来，也只为你而来。只要你愿意见我，我的答案永远都是——想见到你。我喜欢你，江雪。
你教我折的纸船，你不在的日子里，我折了一只又一只，每一只都装着我对你的思念。我把所有的纸船送你，你会跟我走吗？
和你在一起的每一刻都是幸福。我们一起围着红围巾，一起折纸船，一起看月光落在雪上闪闪发亮；我们一起照顾你领养的孩子，像真正的一家人；我们一起看系着红绳的橄榄树，我还做了世界上第一只南瓜灯🎃。
后来我得了月光综合征，听觉一点点消退，再也听不见你的声音。可你总守在我目光能及的地方陪着我，轻轻"哒哒哒"拍我三下，我就安心了。

我曾是一个一无所有，也拥有过一切的绝望者，是你紧紧牵着我最后的希望。

这一世，当我们再次遇到生离死别，你选择了忍受极度的痛苦，用你的10年换我们一起的五年。我的好女孩啊，你怎么这么傻呀。本该是我保护你的...
这一次，我不能再把你推开了。我们就并肩站在一起好不好？我们去废墟下结婚，剩下的日子，我想和你一起去旅行，一直走到世界的尽头。

江雪小姐，我能在晚霞中请你跳支舞吗？

我曾轻声问你，小雪，河流的尽头有什么呢？
你笑着答，有我们思念的人。

小雪，我斩了橄榄树，做成了木舟，带着你去河流的尽头看看可好，你走的慢些，我会追的快些。

我从前总执拗地想让你好好活着，可我也忘了，一起奔赴死亡，又怎么不算最浪漫的爱意。

世界在崩塌，而我们在相爱。

你知道我这辈子除了遇见你，最骄傲的事情是什么嘛，是我在这个荒芜星球上孕育出了全世界独一无二的玫瑰花送给你。

而如今丹溪谷凋零的玫瑰，如今开满桃源。

而在我这贫瘠的土地上，你是我唯一的玫瑰。就像小王子的故事里说的那样，也许世界上也有五千朵和你一模一样的花，但只有你是我独一无二的玫瑰。哪怕他见过成千上万朵一模一样的玫瑰，他最爱的，永远是自己星球上那一朵。

而你，就是我生命里唯一的那朵玫瑰。玫瑰，永远不会缺少追逐她的小王子，我们终将于新世界再次重逢。

爱情是什么呢？
每个人都有自己的答案，可对我来说，答案从来都很简单。
你告诉我，你叫江淮安。你叫江宴。你叫江雪。
那爱情是戚凭川遇见江淮安，是李平川遇见江宴，是李云意遇见江雪，是我遇见了你。
爱情是第一眼就认定的命中注定。
爱是"哒哒哒"的暗号，是不能摘下的红围巾，是七朵卡萨布兰卡与一朵玫瑰，是一起种下的橄榄树，是小王子和他独一无二的玫瑰花。
爱是和你在一起的每分每秒都很幸福；是为了保护你，我愿意牺牲一切也在所不辞；
是人生所有的选择题里，我的答案永远都是你。

我爱你。
无论过去、现在，还是未来。
生生世世，我只为你一人动心。

在下个新世界，等我。

你的男朋友 李云意`
      }
    ];

    const letters = [];

    for (let i = 0; i < letterData.length; i++) {
      const data = letterData[i];
      const date = new Date('2025-01-01');
      date.setDate(date.getDate() + i * 100);

      const letter = {
        id: `xiaowangzi-${data.num}`,
        mailboxId: 'mailbox-xiaowangzi',
        title: data.title,
        subtitle: data.subtitle,
        sender: data.sender,
        recipient: data.recipient,
        paperStyle: 'vintage-literary',
        bgmUrl: '',
        date: data.date,
        time: data.time,
        weekday: data.weekday,
        location: data.location,
        letterTitle: data.subtitle,
        bodyText: data.body,
        content: [],
        illustration: null,
        createdAt: date.getTime(),
        updatedAt: date.getTime()
      };
      letters.push(letter);
    }

    return letters;
  },

  generateTianzhuLetters() {
    const letterData = [
      {
        num: 1,
        title: '第一封',
        subtitle: '写在司天监的奏折背面。墨色是蟪蛄特有的青蓝色，字迹急躁潦草——写字的人显然脾气不太好。纸面被揉过一次又展平，折痕很深。未寄出。',
        date: '铁三角时代·某日',
        time: '午后',
        weekday: '',
        recipient: '雪衣',
        sender: '你的上官 天诛',
        location: '司天监',
        body: `雪衣：

你今天又穿着白袍来了。我注意到你袍子上的花纹换了——不是昨天那种，是另一种。你每次来见我都换不同的花纹，以为我看不到吗？

我看到了。

你被我戳穿的时候耳朵尖红了一下，然后迅速低头转移了话题："先不说这些……你太累了。"

我才不累。

好吧，我有点累。但我不想跟你说这个。我想说的是——

你知道吗，今天寒蝉在神坛边玩的时候跟我说，祂觉得你太高冷了，不近人情。我跟祂说，你只是不太会跟人相处。

祂说"不近人情"。

我说"笨拙"。

这两个词差很远。可我觉得，我看到的雪衣比所有人都看到的更近。

还有一件事。今天我在青铜树那边跟群蜂玩耍的时候，看到你在远处站着。你明明可以过来，可你就在那里站了好一会儿，然后转身走了。

你为什么不过来？

算了，你肯定又要说什么"蟪蛄专人专责，上官不宜与权臣私下过多往来"之类的话。

可我想告诉你——在你转身走之前，你看了我一眼。那一眼里没有权臣的规矩，没有冰冷。那一眼里只有一个想过来又不敢过来的人。

雪衣，你不用怕。

我的司天监永远为你开着门。

——你的上官 天诛`
      },
      {
        num: 2,
        title: '第二封',
        subtitle: '写在仆从令事件当晚。纸张边缘有银色令牌压出的浅浅痕迹——写字的人把仆从令放在纸上当镇纸。字迹比第一封沉稳了许多，但某些地方用力极重，像是在强调什么。未寄出。',
        date: '仆从令事件后',
        time: '深夜',
        weekday: '',
        recipient: '雪衣',
        sender: '天诛',
        location: '司天监·窗前',
        body: `雪衣：

你不肯戴仆从令。

我让你戴，你说不需要。我说"我命所有子民都带上，从今起你与我一样，拥有一群永远在你左右的'小跟班'"——你说"我与你有别"。

万民朝拜于神佛，你却眉眼微挑，只向我行礼。不拜神却拜你的你。

雪衣，你知道我为什么一定要你戴上仆从令吗？

不是要束缚你。是想让你知道——你不是一个人。

寒蝉说仆从令可以让佩戴者永远追随你，不会离开你。那我便命所有子民带上仆从令。我以为这样你就不会再觉得与我有什么分别了。

可你说——

"只有你，愿意试一试，与你，或许不需要这样的外物来维系。"

"只有你，赌你与我永不分离。"

雪衣，你是我推演不出未来的那个人。蛛网能推算寒蝉的终站、推算蟪蛄的每一个结局，可每一次蛛丝伸向你的时候，都像落入了一片空白。

我曾经以为是我的能力不够。后来我想明白了——推算需要逻辑和因果，而你与我的关系，不在逻辑和因果之内。

所以我不再推演你了。

我要自己去走。走到你愿意告诉我的那天。

你知道吗，我有一个梦。梦里有一个棕色衣衫的孩子，拉着我的手，跟我说"我只能陪你到这儿了"。醒来以后我跟你说这个梦，你看着我的眼神很奇怪。

后来我拼命找这个孩子。所有人都告诉我他不存在。

可你——你在我的身旁。你没有说"他不存在"。你只是说："天诛，你信他有，我可以陪你找。"

这大概是我这辈子听过的最温柔的话。

雪衣，蟪蛄上有无数代上官，可从来没有过一个权臣。我想你成为这个世代的唯一。后辈听到权臣的称号，只会想起你雪衣。

你会被永远记住。

——天诛`
      },
      {
        num: 3,
        title: '第三封',
        subtitle: '蟪蛄陨落前最后一夜所写。纸张是冰雪做的，和子民们喝的那杯幻色酒杯的材质一样。墨色在冰面上结了霜，字迹反而格外清晰——是冰的质感。信纸边缘有一道月色的折光。未寄出。',
        date: '蟪蛄陨落前最后一夜',
        time: '子夜',
        weekday: '',
        recipient: '雪衣',
        sender: '只属于雪衣的 天诛',
        location: '冻海边·青铜树下',
        body: `雪衣：

我们回家去吧。

这是你在方舟上说的最后一句话。你把头靠在我肩上，瞳孔里映着月亮。

蟪蛄没有了。

可你在。

我答应过你，不会再让你失去。可我还是让蜂离开了——我把司天监的令牌挂在祂的舱壁上。你站在我身后，什么也没说，只是握住了我的手。

蜂不想走。祂拉着我的手不肯松开，翅膀上还带着蜂房里蜂蜜的甜味。我说"我只是先走一步"。

你大概觉得我在骗祂。

可我没有。我只是真的要先走一步——走到你身边。

雪衣，我从前总说你害怕失去。你说"我们只是君臣关系"的时候，我在想你是不是害怕了。你负责蟪蛄的生死，看惯了离别，所以你不敢靠近任何人——因为靠近了就意味着有一天会失去。

可你还是靠近了。

你先做了雪衣，再做了权臣。你选择成为权臣，只为了留在我身边。

而我——从前我先是上官，再是天诛。可我一直忘了你先是雪衣，再是权臣。

我忘了。

我忘了在你是权臣之前，你只是一个害怕失去的人。

对不起。

而这一次，我不想再做蟪蛄的上官了。这一次，我想做天诛，只属于雪衣的天诛。

在面临毁灭的那一刻，在众生推我上甲板的那一刻，我就想好了——我要与你，同生共死。

蟪蛄不能没有上官，所以我传了位。蜂会是下一任。祂会带着蟪蛄的故事到达地球。蜂的史书上写着——"为蟪蛄最好的上官与权臣"。

你说你推算一切，唯有爱之一字算不出分毫。

雪衣，你赌赢了。

我们相拥于蟪蛄之上，这片一直被我们热爱着的土地上。我们不再有别，我们会合为一体，成为天上最美的天幕。

我永远在你左右，雪衣。

——只属于雪衣的 天诛`
      },
      {
        num: 4,
        title: '第四封（绝笔·天诛的最后信）',
        subtitle: '蟪蛄陨落前最后一刻所写。不是纸——是蛛丝结成的一片薄薄的光膜，上面凝结着天诛最后一丝生命力。字迹不是墨写的，是蛛丝自然的纹路，每一个字都发着青色的微光。它不会消失——因为它就是蟪蛄最后的灯火之一。未寄出。',
        date: '蟪蛄陨落前最后一刻',
        time: '末刻',
        weekday: '',
        recipient: '雪衣',
        sender: '你的男朋友 天诛',
        location: '冻海中央·青铜树下',
        body: `雪衣：

我为上官天诛，历代天诛以生命吐丝结网，为蟪蛄推演未来。

我有我的子民，我要保护这片蟪蛄土地。

我是蟪蛄的君主，大家都会敬我几分，可是直到遇到雪衣——竟敢骂我是孤儿。雪衣的出现，让我甘愿破例。

"冢是生命的尽头，家是生命的开始。"

"冢，只要改变一点，那便是家。"

你害怕失去。

蟪蛄上有无数代上官，可从来没有过一个权臣。我想你成为这个世代的唯一。后辈听到权臣的称号，只会想起你雪衣。你会被永远记住。

你害怕失去。

雪衣族群负责生死，我总是会想，这对你来说是否太残忍了？是不是因为这份责任，让你对我一次次的推开，一次次的告诉我"我们只是君臣关系"。

你害怕失去。

你害怕失去。

寒蝉说仆从令可以让佩戴者永远追随你，不会离开你。那我便命所有子民带上仆从令，从今起，你与我一样，拥有一群永远在你左右的"小跟班"。你不必再认为你与我有别。

你害怕失去。

雪衣，我无法掌控生死，无法掌控离别，可是我不想你伤心难过，不想让你再失去。

"只有你，愿意试一试，与你，或许不需要这样的外物来维系。"

"只有你，赌你与我可以永不分离。"

在面临毁灭的那一刻，在我被众生推上甲板的那一刻，我就想好了，我要与你，同生共死。

蟪蛄不能没有上官，那我便把上官之位传承下去。

从前我先是上官，再是天诛，可我一直忘了你先是雪衣，再是权臣。

而这一次，我想做天诛，只属于雪衣的天诛。

我们相拥于蟪蛄之上，这片一直被我们热爱着的土地上。我们不再有别，我们会合为一体，成为天上最美的天幕。

雪衣，你赌赢了。

"我永远在你左右，雪衣。"

雪衣，我们是什么关系？

——你的男朋友 天诛`
      }
    ];

    const letters = [];

    for (let i = 0; i < letterData.length; i++) {
      const data = letterData[i];
      const date = new Date('2025-01-01');
      date.setDate(date.getDate() + i * 50);

      const letter = {
        id: `tianzhu-${data.num}`,
        mailboxId: 'mailbox-tianzhu',
        title: data.title,
        subtitle: data.subtitle,
        sender: data.sender,
        recipient: data.recipient,
        paperStyle: 'vintage-literary',
        bgmUrl: '',
        date: data.date,
        time: data.time,
        weekday: data.weekday,
        location: data.location,
        letterTitle: data.subtitle,
        bodyText: data.body,
        content: [],
        illustration: null,
        createdAt: date.getTime(),
        updatedAt: date.getTime()
      };
      letters.push(letter);
    }

    return letters;
  },

});
