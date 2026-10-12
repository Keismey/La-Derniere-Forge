/* La Dernière Forge — données en anglais (appliquées si G.lang === "en") */
if (G.lang === 'en') {
  // ---------- helpers ----------
  // map { key: [name, desc?] } onto a table of objects
  const nd = (tbl, map) => {
    for (const k in map) {
      const o = tbl[k]; if (!o) continue;
      const [name, desc] = map[k];
      if (name !== undefined) o.name = name;
      if (desc !== undefined) o.desc = desc;
    }
  };
  // map { key: {field: value} } onto a table of objects
  const put = (tbl, map) => { for (const k in map) if (tbl[k]) Object.assign(tbl[k], map[k]); };

  // ---------- Quality ----------
  ['Poor', 'Fair', 'Good', 'Excellent', 'Masterpiece'].forEach((n, i) => { if (G.QUALITY[i]) G.QUALITY[i].name = n; });

  // ---------- Items ----------
  nd(G.ITEMS, {
    charbon:        ['Coal', 'Fuel for the smelter.'],
    bois:           ['Ash wood', 'For handles.'],
    minerai_cuivre: ['Copper ore', 'Smelted with tin, it makes bronze.'],
    minerai_etain:  ['Tin ore', 'Alloyed with copper to make bronze.'],
    minerai_fer:    ['Iron ore', "The smith's own metal."],
    minerai_argent: ['Silver ore', 'The Rust fears it.'],
    minerai_astral: ['Astralite ore', 'Fell from the sky a thousand years ago.'],
    quartz:         ['Quartz', 'Clear crystal. Set in armour: +8 HP.'],
    rubis:          ['Ruby', 'Sells dear. Set in a weapon: perfect hits +15%.'],
    saphir:         ['Sapphire', 'Deep blue, from the Silver Caves. Set in armour: easier parry.'],
    cristal:        ['Astral crystal', 'It pulses softly, like a heart. Set in a weapon: +1 momentum at the start of a fight.'],
    lingot_bronze:  ['Bronze ingot', 'Easy to work.'],
    lingot_fer:     ['Iron ingot', 'Sturdy and honest.'],
    lingot_acier:   ['Steel ingot', 'Iron refined with coal.'],
    lingot_argent:  ['Silver ingot', 'Shines even in the dark.'],
    lingot_astral:  ['Astralite ingot', 'Light as a feather, hard as faith.'],
    cuir:           ['Leather', 'For grips and armour.'],
    os:             ['Bone', 'For reinforcements and bombs.'],
    croc:           ['Fang', 'A hunting trophy.'],
    plume:          ['Harpy feather', 'Light and sharp.'],
    ecaille:        ['Scale', 'Tougher than leather.'],
    noyau_rouille:  ['Rust core', 'It creaks when you squeeze it.'],
    ecaille_wyverne:['Wyvern scale', 'No fire can melt it.'],
    potion:         ['Healing potion', 'Restores 25 HP.'],
    grande_potion:  ['Greater potion', 'Restores 60 HP.'],
    bombe:          ['Nail bomb', '22 damage, ignores shell.'],
    ration:         ["Miner's ration", '+15 stamina in the mine.'],
    carnet_1:       ["Hogar's Notebook (I)", 'Found in the Iron Veins.'],
    carnet_2:       ["Hogar's Notebook (II)", 'Found in the Silver Caves.'],
    carnet_3:       ["Hogar's Notebook (III)", 'Found in the Abyss.'],
  });

  // ---------- Gear ----------
  nd(G.GEAR, {
    dague_rouillee: ['Rusty dagger', "The one you've always had."],
    epee_bronze:    ['Bronze sword'],
    masse_bronze:   ['Bronze mace'],
    epee_fer:       ['Iron sword'],
    masse_fer:      ['Iron mace'],
    epee_acier:     ['Steel sword'],
    masse_acier:    ['Steel mace'],
    epee_argent:    ['Silver sword'],
    masse_argent:   ['Silver mace'],
    lame_aube:      ['Dawn Blade', 'It cuts and it shatters. The Rust flees its light.'],
    tablier:        ['Leather apron'],
    plastron_bronze:['Bronze breastplate'],
    cotte_fer:      ['Iron mail'],
    plastron_acier: ['Steel breastplate'],
    armure_argent:  ['Silver armour', 'Immune to the Rust.'],
    pioche_vieille: ['Old pickaxe'],
    pioche_bronze:  ['Bronze pickaxe'],
    pioche_fer:     ['Iron pickaxe'],
    pioche_acier:   ['Steel pickaxe'],
    lanterne:       ["Miner's lantern", '+1 light radius in the mine.'],
    faucille:       ['Sickle', "For Bertille's harvests."],
    pointes:        ['Arrowheads', 'The guard goes through plenty.'],
    fer_cheval:     ['Horseshoe', 'The valley horses wear them out fast.'],
    chaudron:       ['Cauldron', 'For the tannery or the kitchen.'],
    serrure:        ['Lock', 'People lock their doors these days.'],
    clochette:      ['Silver bell', 'Its chime keeps the Rust at bay.'],
    bougeoir:       ['Silver candlestick', 'For the chapel.'],
  });

  // ---------- Metals (quench label) ----------
  put(G.METALS, {
    bronze: { label: 'bronze' }, fer: { label: 'iron' }, acier: { label: 'steel' },
    argent: { label: 'silver' }, astral: { label: 'astralite' },
  });

  // ---------- Mine ----------
  [
    ['Upper Galleries', 'Copper, tin and coal. Perfect for starting out.'],
    ['Iron Veins', 'Iron aplenty. Beware of cave-ins.'],
    ['Silver Caves', 'Silver gleams deep in the caves. The air is foul.'],
    ['The Abyss', 'Where the astralite fell. No one has ever come back… except you?'],
  ].forEach(([name, desc], i) => { if (G.MINE[i]) Object.assign(G.MINE[i], { name, desc }); });

  // ---------- Enemies (name + move names by index; prep moves: [name, next.name]) ----------
  const foes = {
    loup:         ['Grey wolf', ['Bite', 'Onslaught', 'Howl']],
    sanglier:     ['Boar', ['Tusk ram', ['Paws the ground', 'Charge']]],
    araignee:     ['Thicket spider', ['Sting', 'Venom']],
    ours_rouille: ['Rusted bear', ['Claws', ['Rears up', 'Crushing hug'], 'Rust plates', 'Rusty breath']],
    crapaud:      ['Rusted toad', ['Tongue lash', 'Acid drool', 'Puffs up']],
    golemet:      ['Rust golemling', ['Fist', 'Hardens', 'Red dust']],
    feu_follet:   ["Will-o'-the-wisp", ['Sparks', 'Grows']],
    golem_ancien: ['Ancient golem', ['Stone hammer', ['Raises its arms', 'Earthquake'], 'Stone skin', 'Rust cloud']],
    harpie:       ['Harpy', ['Talons', 'Shrill cry', 'Dive']],
    wyverneau:    ['Wyvernling', ['Bite', 'Stinger', 'Curls up']],
    wyverne:      ['Wind Wyvern', ['Tail lash', 'Claw flurry', ['Breathes in deep', 'Breath of the Peaks'], 'Venomous stinger', 'Folds its wings']],
    roi_rouille:  ['The Rust King', ['Corroded sceptre', 'Rain of filings', ['Makes the mountain rumble', 'Collapse'], 'Scrap-iron armour', 'Devouring rust', 'Drinks the metal']],
  };
  for (const k in foes) {
    const e = G.ENEMIES[k]; if (!e) continue;
    const [name, moves] = foes[k];
    e.name = name;
    moves.forEach((m, i) => {
      const mv = e.moves[i] && e.moves[i][2]; if (!mv) return;
      if (Array.isArray(m)) { mv.name = m[0]; if (mv.next) mv.next.name = m[1]; }
      else mv.name = m;
    });
  }

  // ---------- Hunting zones ----------
  nd(G.ZONES, {
    foret:  ['Combefroide Forest', 'Wolves, boars and spiders. Plenty of leather and bone.'],
    marais: ['Rust Marsh', 'The beasts there are eaten away by the Rust. Bring silver.'],
    pic:    ['Windpeak', "The Wyvern's nest. Its scales will not melt in any fire."],
    coeur:  ['Heart of the Mountain', 'The source of the Rust. And perhaps Hogar.'],
  });

  // ---------- Village NPCs ----------
  nd(G.NPCS, {
    hogar:       ['Master Hogar'],
    sven:        ['Sven, the guard'],
    ida:         ['Ida, the tanner'],
    bertille:    ['Bertille, the farmer'],
    aldric:      ['Father Aldric'],
    odile:       ['Odile, the merchant'],
    roi:         ['Varn, the Rust King'],
    hogar_ronge: ['Master Hogar'],
  });

  // ---------- Story chapters ----------
  // goals: [title, hint] by index
  const chapters = [
    {
      title: 'The Cold Anvil',
      intro: [
        ['recit', "Combefroide, a mining village at the foot of Mount Ardent. Since autumn, a sickness has been eating the metal: tools crumble, swords stain orange. They call it the Rust."],
        ['recit', "For some weeks now, the miners have heard hammering at night, far beneath the mountain. A slow, steady beat. Like an anvil."],
        ['recit', "Three nights ago, Master Hogar, the smith, went down into the mine to find its source. He never came back up."],
        ['sven', "{nom}! You were his apprentice. Without a smith, the village won't last the winter. The forge is yours now."],
        ['moi', "I've never forged alone… But I know the motions. First, I need a proper pickaxe."],
        ['sven', "And a sword for the guard, if you can. The forest wolves are going mad. See Odile if you're short on coal or wood."],
      ],
      goals: [
        ['Forge a bronze pickaxe', 'Mine copper and tin, smelt bronze at the smelter, then forge the pickaxe at the anvil.'],
        ['A sword for Sven', 'At least “Fair” quality. You will need leather: go hunting in the forest.'],
        ['3 leather for Ida', 'The forest wolves and boars drop it.'],
      ],
      outro: [
        ['sven', "Fine blade. Hogar would be proud. But listen: the miners say the Rust comes from below. From deeper than the Upper Galleries."],
        ['moi', "Then I need iron. And a pickaxe that can dig it."],
      ],
    },
    {
      title: 'The Iron Heart',
      intro: [
        ['bertille', "My horses have lost their shoes, they crumbled into orange dust! I need two, please."],
        ['ida', "And a huge bear is prowling the edge of the woods. Its fur is covered in plates of rust. Arrows bounce right off."],
        ['moi', "A mace will break those plates better than a blade. And in the Iron Veins, I might find some trace of Master Hogar."],
      ],
      goals: [
        ['2 horseshoes for Bertille', 'Mine iron in the Iron Veins, smelt it into ingots, then forge the shoes at the anvil.'],
        ['Iron mail for Sven', 'At least “Fair” quality.'],
        ["Find Hogar's trail", 'Search the bottom of the Iron Veins. A chest awaits.'],
        ['Bring down the Rusted bear', 'In the forest. Blunt blows break its shell.'],
      ],
      outro: [
        ['recit', "Hogar's Notebook, a scribbled page: “The Rust fears silver. I saw its effect on a beast: its hide sizzled at the touch of a ring. I must go down to the Silver Caves.”"],
        ['aldric', "The bear carried this core in its heart… It creaks like a door. This evil is not natural, {nom}. It comes from something, or someone."],
      ],
    },
    {
      title: 'Silver Against the Rust',
      intro: [
        ['aldric', "The marsh to the north is lost. The toads there have turned to gnawed iron, and a stone giant guards its heart."],
        ['aldric', "Forge me a silver bell for the chapel. Its song will protect the village while you fight."],
        ['moi', "To reach the silver, I'll need an iron pickaxe. And for the marsh, a silver weapon."],
      ],
      goals: [
        ['A silver bell', 'You need an iron pickaxe for the Silver Caves.'],
        ['Forge a silver weapon', 'Silver sword or mace. Creatures of the Rust are vulnerable to it.'],
        ["Follow Hogar's trail", 'At the bottom of the Silver Caves.'],
        ['Defeat the Ancient golem', 'In the heart of the Rust Marsh.'],
        ["Earn the village's trust", 'Reach renown 3 by fulfilling village orders (Village tab).'],
      ],
      outro: [
        ['recit', "Hogar's Notebook: “Astralite. The metal that fell from the sky, beneath the mountain. It alone can cut the heart of the Rust. But it can only be worked with a handle that nothing can burn… The elders spoke of the scales of the Wyvern of the Peak.”"],
        ['aldric', "A crown in the rock… The old chapel chronicles speak of a kingdom here, long before the village. Ardent. And of its smith-king, Varn."],
        ['aldric', "They say a star fell into the mountain, and Varn forged himself a crown from it so that his forge would never go out. Then the kingdom vanished, eaten away like our tools. Not the crown, it seems."],
        ['sven', "Windpeak? Nobody goes up there. But if anyone can, it's you."],
      ],
    },
    {
      title: 'Metal of the Stars',
      intro: [
        ['moi', "A steel pickaxe for the Abyss. The Wyvern's scale for the handle. And astralite for the blade."],
        ['ida', "Take these potions. And come back, all right? We've already lost one smith."],
      ],
      goals: [
        ['Forge a steel pickaxe', 'Essential for digging in the Abyss.'],
        ["Hogar's last page", 'At the very bottom of the Abyss.'],
        ['Defeat the Wind Wyvern', 'At the summit of Windpeak.'],
        ['Become a master smith', 'Renown 4: the village must believe in you before you go down.'],
        ['Forge the Dawn Blade', 'Astralite, silver, Wyvern scale and astral crystal. The hardest forging of your life.'],
      ],
      outro: [
        ['recit', "Hogar's Notebook, at the bottom of the last page, the writing shaky: “He is here. Varn. A dead king of metal, seated before his anvil. His crown is cracking, and he wants a smith to mend it. It was him hammering at night: he was calling.”"],
        ['recit', "“I told him no. He took my hands. I can feel the Rust seeping into them. Soon I will hammer for him, and every blow will mend his crown a little more. Apprentice… forge what I could not.”"],
        ['moi', "I'm coming, Master."],
      ],
    },
    {
      title: 'The Rust King',
      intro: [
        ['recit', "The Dawn Blade shines with a cold light. Deep in the Abyss, a gallery you had never seen has opened. The air smells of hot iron, and you can hear hammering."],
        ['recit', "At its end, a hall carved into the rock. Statues of kneeling smiths. And on a throne of scrap iron, a king whose cracked crown glows like an ember."],
        ['recit', "At his feet, Master Hogar hammers at an anvil, bound by three shackles of rust. He does not look up."],
        ['moi', "As long as Hogar hammers for him, the crown mends itself. If I break those shackles, the king will have no smith."],
      ],
      goals: [
        ['Face the Rust King', 'In the Heart of the Mountain (Hunt tab). During the fight, the “Free” seal (2 momentum) breaks one of Hogar’s shackles.'],
      ],
      outro: [
        ['recit', "The Rust King collapses in a crash of scrap iron. His crown rolls to your feet, dims, and is nothing but a ring of cold metal."],
        ['hogar', "{nom}… Down there, I could hear an anvil answering mine. A fine, steady strike… So it was you. I always knew you had the touch."],
        ['moi', "Let's go home, Master. The forge is cold without you."],
        ['hogar', "Pick up the crown. We'll melt it down, you and I, and make an anvil of it. The last forge of Ardent was never his: it's ours."],
        ['hogar', "And after that, the forge will be yours. As for me, I'll sit by the fire and watch you work. And criticise, of course."],
        ['recit', "In spring, the Rust vanished from Mount Ardent. In Combefroide, they still tell the tale of the apprentice who relit the last forge, and of the old master who came back alive from the mountain."],
      ],
      outroAlt: [
        ['recit', "The Rust King collapses in a crash of scrap iron. At that very moment, Hogar drops his hammer and falls to his knees, as if the chains had been holding him up."],
        ['hogar_ronge', "{nom}… Is it over? I can't feel my hands."],
        ['recit', "His hands are the colour of rust. They will never fully heal."],
        ['hogar_ronge', "Don't make that face. A smith has two hands, and the forge asks no more than that: yours will do. Here. My hammer. It's yours."],
        ['moi', "I'm taking you home, Master."],
        ['recit', "In spring, the Rust vanished from Mount Ardent. Hogar never forged again, but he never missed a single one of your strikes, sitting by the fire. They say he counted them."],
      ],
    },
  ];
  chapters.forEach((c, i) => {
    const ch = G.CHAPTERS[i]; if (!ch) return;
    ch.title = c.title;
    ['intro', 'outro', 'outroAlt'].forEach(f => { if (c[f] && ch[f]) ch[f] = c[f]; });
    c.goals.forEach(([title, hint], j) => { if (ch.goals[j]) Object.assign(ch.goals[j], { title, hint }); });
  });

  // ---------- Hogar's notebooks ----------
  Object.assign(G.NOTES, {
    carnet_1: "“Day 1. Something is hammering beneath the mountain. Every night, the same beat, like a smith waiting for an apprentice. The iron veins bleed orange. The Rust is rising from below. I'm going down to see. — H.”",
    carnet_2: "“Day 2. Silver repels the Rust, I'm sure of it. Further down, a carved hall, statues of kneeling smiths. And at the far end, a crown in the rock. It was breathing. — H.”",
    carnet_3: "“Day 3. His name is Varn. He wants me to mend his crown. If you find this, apprentice: astralite, silver, the Wyvern's scale. Forge the Dawn. And don't listen to him when he speaks to you of eternal fire. — H.”",
  });

  // ---------- Village stories (arcs): title + steps [txt, after] ----------
  const arcs = {
    sven: ['The Little Brother', [
      ["My little brother Tobias wants to join the guard. He's fifteen. If he has to train, it might as well be with good arrowheads.",
        [['sven', "He shot at a barrel all day. Hit it twice. It's a start."]]],
      ["Tobias went into the forest alone to prove his worth. He came back with his hand covered in orange spots. He needs a real blade, not a stick.",
        [['sven', "He won't let go of your sword. Sleeps with it, I think."], ['moi', "And his hand?"], ['sven', "Father Aldric says it isn't spreading. For now."]]],
      ["The guard heads up to the marsh tomorrow. Tobias is coming with us; I couldn't stop him. So forge him armour that will let me sleep at night.",
        [['sven', "We came back. All of us. Tobias took a golemling's fist square in the chest and got up laughing. Your steel held."], ['sven', "Here: the guard's crest. You're one of us now, like it or not."]]],
    ]],
    ida: ["Hogar's Apron", [
      ["Hogar always brought me back a wolf fang when he passed through the forest. An old grump's habit. Would you… carry on the tradition?",
        [['ida', "I keep them in a box. There were forty-three. Forty-five, now."]]],
      ["My tanning vats are rusting. Hogar promised me a cauldron “when he had the time.” He never had the time.",
        [['ida', "It's perfect. He'd have grumbled that it was too pretty for leather."], ['ida', "You know, he talked about you. All the time. “The apprentice has the touch,” he'd say. He'd never have told you to your face, of course."]]],
      ["I want to make you an apron. A real one, wyvernling scales lined with leather: heat just slides off it. Bring me two scales.",
        [['ida', "There. It won't burn, it won't tear, and it keeps the metal's heat close to you."], ['ida', "When you see Hogar again, show him yours is finer than his. And then tell me the look on his face."]]],
    ]],
    bertille: ['Blighted Soil', [
      ["The Rust is in the soil now. The wheat grows with orange spots. I have to cut the sick ears before they spoil the rest.",
        [['bertille', "I saved half the field. The other half… I burned. It smelled of hot iron."]]],
      ["I'm going down to sell in the valley while there's still something to sell. I need shoes for the whole team.",
        [['bertille', "At the market, they talk about Combefroide. They say the Rust comes from an old king buried under the mountain, one who refuses to die."], ['bertille', "Old wives' tales… Right?"]]],
      ["Father Aldric says silver purifies. If I mix silver filings into the soil… Bring me an ingot, I'll grate it myself.",
        [['bertille', "The shoots are green. Green! I cried like a little girl in front of my field."], ['bertille', "Take this rye bread. There'll be one every week: with that in your belly, you'll dig longer."]]],
    ]],
    aldric: ['The Chronicle of Ardent', [
      ["That core you brought back from the bear… I'd like another. I believe something is engraved inside.",
        [['aldric', "Look through the lens. This isn't rust: it's filings, packed tight. And inside, a letter. A crowned V."], ['aldric', "The seal of the kings of Ardent. The kingdom that stood here before the village. Before everything."]]],
      ["The archives lie beneath the crypt, in the dark. With a silver candlestick, I can read without the Rust eating the bindings.",
        [['aldric', "I found it: “Varn, smith-king of Ardent, received a star fallen into the mountain, and forged himself a crown from it, that his forge might never go out.”"], ['aldric', "“But the crown was hungry. It ate the tools, then the swords, then the gates of the kingdom.” The next page is eaten away. Orange."]]],
      ["Bring me an astralite ingot. I want to see what it does beside a Rust core.",
        [['aldric', "The core trembled. It turned towards the astralite, like a flower towards the sun."], ['aldric', "The Rust is not a sickness, {nom}. It is a hunger. Varn's crown eats metal to stay warm. And to mend itself, it needs a smith's hands."], ['aldric', "Take my blessing. It's no blade, but you will enter every fight with a little momentum."]]],
    ]],
    odile: ['Crown Coins', [
      ["Someone broke into my chest last night. They took nothing… except the old crown coins the miners sell me. Who steals worthless coins? I need a lock.",
        [['odile', "We found the coins this morning, at the edge of the mine shaft. All lined up, crown side down."], ['odile', "I don't like it. Not one bit."]]],
      ["A client in the capital pays a fortune for a ruby from Mount Ardent. With that, I can get the trade road reopened.",
        [['odile', "The road is open again! The merchants are coming back up… and they want blades. Blades forged in Combefroide, “the forge that stands up to the Rust.”"]]],
      ["A merchant from the capital wants two steel swords, and good ones. Your reputation precedes you, apprentice.",
        [['odile', "He paid double without haggling. Can you believe it?"], ['odile', "Open your own shop, right here in the village: I'll send passing customers your way. And I'll buy everything from you at a better price: that's only fair between partners."]]],
    ]],
  };
  for (const k in arcs) {
    const a = G.ARCS[k]; if (!a) continue;
    const [title, steps] = arcs[k];
    a.title = title;
    steps.forEach(([txt, after], i) => { if (a.steps[i]) Object.assign(a.steps[i], { txt, after }); });
  }

  // ---------- Perks ----------
  nd(G.PERKS, {
    garde:       ["Guard's crest", '+1 DEF permanently.'],
    tablier:     ['Scale apron', 'At the anvil, metal cools 20% slower.'],
    pain:        ["Bertille's bread", '+10 stamina in the mine.'],
    benediction: ["Aldric's blessing", 'Every fight starts with 1 momentum.'],
    commerce:    ["Odile's partner", 'You open your own shop (Village tab), and your sales to Odile earn 25% more.'],
  });

  // ---------- Shop customers ----------
  put(G.CUSTOMERS, {
    marchand:   { name: 'Corvin, merchant from the capital', hi: ["They praised your steel all the way to the capital.", "I sell across the whole kingdom. Show me what you have."] },
    chevaliere: { name: 'Dame Isaure, knight', hi: ["I'm off to guard the pass. I need something sturdy.", "My squire broke my gear. Again."] },
    aventurier: { name: 'Fenn, adventurer', hi: ["Not much gold, but great stories!", "They say there's treasure under the mountain. I'm going to look."] },
    baron:      { name: 'The Baron of Valrouge', hi: ["I want only the best. Price matters little… within reason.", "Be quick, my carriage is waiting."] },
    sven:       { name: 'Sven, the guard', hi: ["The barracks need equipment. Give me a friend's price.", "For Tobias. Don't tell him, it's a surprise."] },
    bertille:   { name: 'Bertille, the farmer', hi: ["Harvest is coming. Have you got what I need?", "I'm paying in gold this time. Not eggs."] },
  });

  // ---------- Refining: gems and grindstone ----------
  put(G.GEMS, {
    rubis:   { eff: k => `Perfect hits +${Math.round(15 * k)}%` },
    cristal: { eff: k => (k >= 0.7 ? '+1 momentum at the start of fights' : `+1 momentum at the start of fights (${Math.round(k * 100)}% chance)`) },
    quartz:  { eff: k => `+${Math.round(8 * k)} max HP` },
    saphir:  { eff: k => `Parry window +${Math.round(20 * k)}%` },
  });
  G.HONE_VERB = kind => (['sword', 'dagger', 'arrows', 'sickle', 'pick'].includes(kind) ? 'Sharpen' : 'Polish');

  // ---------- Renown ----------
  [
    ['Apprentice', ''],
    ['Village smith', 'Odile gives you 15% off her prices.'],
    ['Renowned artisan', '+10 stamina in the mine.'],
    ['Master smith', 'Village orders pay 25% more gold.'],
    ['Legend of Combefroide', 'The villagers sometimes give you a potion or a ration with an order.'],
  ].forEach(([name, perk], i) => { if (G.REP[i]) Object.assign(G.REP[i], { name, perk }); });

  // ---------- Village orders (board) ----------
  [
    'My old sickle crumbled into orange dust. I need a new one before the harvest.',
    'My two farmhands each want their own. Nice ones, mind, not bent spoons.',
    'The mare is limping again. Two shoes, please.',
    'The guard is short on arrows. Forge me some arrowheads.',
    'Well-quenched arrowheads: the wolves have tough hides this winter.',
    'The captain wants an iron mace. A good one, he is hard to please.',
    'My sword won’t hold any more. Make me steel, and good steel.',
    'The tannery is running empty. Bring me leather.',
    'Wolf fangs, for good-luck necklaces. They sell well.',
    'My dye cauldron has been eaten by the Rust. I need a new one.',
    'Harpy feathers! They say they cut like razors.',
    'Wyvernling scales for a vest. I pay well.',
    'A merchant from the valley is looking for bronze. I’ll buy it from you.',
    'Since the Rust came, everyone wants locks. Me first of all.',
    'Three iron ingots for a client in a hurry.',
    'Nice clear quartz, for a jeweller.',
    'A ruby! A lady in town dreams of one.',
    'A cauldron worthy of an inn in the capital. Excellent, nothing less.',
    'Two silver candlesticks for the altar. Light keeps the Rust at bay.',
    'I must shore up the old ossuary… Don’t ask questions.',
    'Bring me Rust cores. I want to understand this evil.',
    'Pure silver, to bless the village well.',
    'The new guard has no armour. Make him excellent mail, he is young.',
    'Someone is stealing my hens. Two sturdy locks, for the barn and the henhouse.',
    // endgame: Master Hogar orders exceptional pieces
    'The valley captain wants a silver sword. I told him my apprentice does better work than I do. Don’t make a liar of me: a masterpiece.',
    'Silver armour for the guard at the pass. Excellent at the very least: I’ll check every rivet.',
    'A flawless steel mace. It’s for me, to admire by the fire. Don’t ask questions.',
    'A steel breastplate without a single flaw. The miller’s son is off to the city, and he won’t go poorly protected.',
    'A silver bell, a masterpiece, for the throne room beneath the mountain. Even a mad king deserves a bell rung for him.',
    'The temple in the capital is asking for a Dawn Blade. One in the whole world isn’t enough for them any more, it seems. You’ll need a fresh scale from the Wyvern.',
  ].forEach((txt, i) => { if (G.REQUESTS[i]) G.REQUESTS[i].txt = txt; });

  // ---------- Mini-game help ----------
  put(G.HOWTO, {
    hone: { title: 'The grindstone', steps: [
      'Masterpieces don’t go on the grindstone. Use the filter to rework only one quality tier.',
      'Put your finger on the piece and slide it right, across the grindstone, in a single motion.',
      'Keep the <b>right speed</b> (needle in the golden band). Too slow: the metal overheats and turns blue. Too fast: the edge comes out uneven.',
      '4 passes. A good rework raises the piece’s quality (up to +15). A botched one can lower it a little (−5 at worst).',
      'A piece goes on the grindstone <b>only once</b>. Its gems stay in place.',
    ] },
    gemset: { title: 'Gem setting', steps: [
      'The gem wobbles above the socket. Keep it centred by sliding your finger.',
      'Then <b>lock it in with a hammer tap</b>: tap when the force is in the golden zone. Too soft, the prong holds poorly; too hard, the gem chips.',
      'The hold (placement and strike) sets the strength of the effect.',
      'Rubies and astral crystals are set in weapons, quartz and sapphires in armour. Each gem also raises the piece’s value.',
      'Excellent: 1 socket. Masterpiece: 2 sockets. A set gem is never lost.',
    ] },
    shop: { title: 'Your shop', steps: [
      'Your stall shows every forged piece you aren’t wearing. Forge ahead so you have something to sell.',
      'Each customer asks for an item, sometimes with a minimum quality. Pick a piece from your stall, or tell them you don’t have it.',
      '<b>Haggling</b>: the cursor sweeps across the prices. Tap to name your price. In the red zone it’s too expensive: the customer refuses, and their patience drops.',
      'Just under the limit, in the <b>golden band</b>: the best price, and your shop gains reputation. More stars, richer customers.',
      'A customer’s exact limit is hard to judge: the zone fading into red may already be too expensive. The cursor speeds up towards the high prices, and every refusal makes it faster.',
    ] },
    smelt: { title: 'The smelter', steps: [
      'Press <b>Bellows</b> to heat the crucible. The heat rises with a delay: plan ahead.',
      'Keep the needle in the <b>golden band</b>, which moves during the pour.',
      'Too hot = slag (purity drops fast). Too cold = nothing melts.',
      '<b>80% purity</b> or more: you get 50% more ingots. Below 45%, half is lost.',
    ] },
    forge: { title: 'The anvil', steps: [
      '<b>Forging</b>: tap each circle just as the orange ring closes on it.',
      'Strikes come in <b>series</b> separated by short pauses.',
      'The metal cools. Below the blue line on the gauge it is <b>too cold</b>: your strikes count for less.',
      'Tap <b>Reheat</b> during a pause: the piece goes back into the fire for a moment. Circles that arrive meanwhile are missed.',
      '<b>Quench</b>: plunge the piece when its colour matches the target. Final quality = 70% forging + 30% quench.',
    ] },
    mine: { title: 'The mine', steps: [
      'Tap next to the miner (left, right, up, down): they dig the tile, then step into it on their own. Keep your finger down to dig continuously.',
      'Each pickaxe swing costs <b>1 stamina</b>. Dark rocks are harder: several swings. A better pickaxe digs faster and deeper.',
      '<b>Round boulders</b>: they fall if you dig beneath them, and you end up right underneath! A “!” means it’s about to fall: get out of the way, fast.',
      '<b>Rock with green bubbles</b>: a gas pocket. Breaking it releases a toxic cloud right on top of you that drains your stamina. Back off 2 tiles quickly and wait for it to clear.',
      '<b>Chests</b>: caches left by old miners, and Hogar’s notebooks at the very bottom.',
      'Head back up before you’re exhausted: fainting costs you <b>half your loot</b>.',
    ] },
    combat: { title: 'The hunt', steps: [
      'The enemy’s <b>intent</b> is shown: you always know what it will do.',
      '<b>Attack</b>: tap the screen when the cursor crosses the zone. Bright zone = perfect hit (critical).',
      'When the enemy strikes, a ring closes on your shield. Tap as it crosses the <b>golden band</b>: perfect parry = no damage + 1 momentum. In the orange halo around it: reduced damage.',
      '<b>Parry</b> (action): puts you on guard, reduces damage and counters on a perfect parry. Ideal before a heavy attack.',
      '<b>Momentum</b>: 2 diamonds = a <b>power strike</b> that breaks shells.',
      '<b>Blunt</b> weapons (maces) break shells twice as well. Against the Rust, bring a <b>silver</b> weapon.',
    ] },
  });
}
