/* La Dernière Forge — données du jeu
   Tout le contenu (objets, recettes, mine, chasse, histoire) vit ici.
   Le code des autres fichiers ne fait que lire ces tables. */
window.G = window.G || {};

G.QUALITY = [
  { min: 0,  name: 'Médiocre',      mult: 0.85, cls: 'q0' },
  { min: 40, name: 'Correct',       mult: 1.00, cls: 'q1' },
  { min: 65, name: 'Bon',           mult: 1.15, cls: 'q2' },
  { min: 85, name: 'Excellent',     mult: 1.30, cls: 'q3' },
  { min: 95, name: "Chef-d’œuvre",  mult: 1.50, cls: 'q4' },
];

/* ---------- Objets ---------- */
G.ITEMS = {
  // combustibles et matières de base
  charbon:        { name: 'Charbon', kind: 'coal', color: '#3a3430', price: 10, sell: 2, desc: 'Combustible de la fonderie.' },
  bois:           { name: 'Bois de frêne', kind: 'wood', color: '#9a6b3f', price: 6, sell: 2, desc: 'Pour les manches.' },
  // minerais
  minerai_cuivre: { name: 'Minerai de cuivre', kind: 'ore', color: '#d0763a', sell: 2, desc: 'Fondu avec de l’étain, il donne le bronze.' },
  minerai_etain:  { name: "Minerai d'étain", kind: 'ore', color: '#b9c0c6', sell: 2, desc: 'Allié au cuivre pour le bronze.' },
  minerai_fer:    { name: 'Minerai de fer', kind: 'ore', color: '#9a5d48', sell: 3, desc: 'Le métal du forgeron.' },
  minerai_argent: { name: "Minerai d'argent", kind: 'ore', color: '#e6edf2', sell: 6, desc: 'La Rouille le craint.' },
  minerai_astral: { name: "Minerai d'astralite", kind: 'ore', color: '#79e6f0', sell: 12, desc: 'Tombé du ciel il y a mille ans.' },
  // gemmes
  quartz:         { name: 'Quartz', kind: 'gem', color: '#ece6ff', sell: 12, desc: 'Cristal clair. Serti sur une armure : +8 PV.' },
  rubis:          { name: 'Rubis', kind: 'gem', color: '#e2445e', sell: 30, desc: 'Se vend cher. Serti sur une arme : coups parfaits +15 %.' },
  saphir:         { name: 'Saphir', kind: 'gem', color: '#3f6fe0', sell: 26, desc: 'Bleu profond, des Grottes d’argent. Serti sur une armure : parade plus facile.' },
  cristal:        { name: 'Cristal astral', kind: 'gem', color: '#8ff6ff', sell: 50, desc: 'Il pulse doucement, comme un cœur. Serti sur une arme : +1 élan en début de combat.' },
  // lingots
  lingot_bronze:  { name: 'Lingot de bronze', kind: 'ingot', color: '#c98a3a', sell: 6, desc: 'Facile à travailler.' },
  lingot_fer:     { name: 'Lingot de fer', kind: 'ingot', color: '#8e9298', sell: 9, desc: 'Solide et honnête.' },
  lingot_acier:   { name: "Lingot d’acier", kind: 'ingot', color: '#bcc8d2', sell: 14, desc: 'Fer affiné au charbon.' },
  lingot_argent:  { name: "Lingot d’argent", kind: 'ingot', color: '#f1f5f8', sell: 16, desc: 'Brille même dans le noir.' },
  lingot_astral:  { name: "Lingot d’astralite", kind: 'ingot', color: '#62dbe9', sell: 40, desc: 'Léger comme une plume, dur comme la foi.' },
  // butin de chasse
  cuir:           { name: 'Cuir', kind: 'leather', color: '#8a5634', sell: 3, desc: 'Pour les poignées et les armures.' },
  os:             { name: 'Os', kind: 'bone', color: '#e8dfc8', sell: 2, desc: 'Renforts et bombes.' },
  croc:           { name: 'Croc', kind: 'fang', color: '#f3eedf', sell: 4, desc: 'Trophée de chasse.' },
  plume:          { name: 'Plume de harpie', kind: 'feather', color: '#a7b7c8', sell: 5, desc: 'Légère et coupante.' },
  ecaille:        { name: 'Écaille', kind: 'scale', color: '#5f8f6a', sell: 6, desc: 'Plus dure que le cuir.' },
  noyau_rouille:  { name: 'Noyau de Rouille', kind: 'core', color: '#c4532a', sell: 10, desc: 'Il grince quand on le serre.' },
  ecaille_wyverne:{ name: 'Écaille de Wyverne', kind: 'scale', color: '#3f9a8a', sell: 0, desc: 'Ne fond dans aucun feu.', key: true },
  // consommables
  potion:         { name: 'Potion de soin', kind: 'potion', color: '#e0505e', price: 15, sell: 5, desc: 'Rend 25 PV.', heal: 25, use: 'combat' },
  grande_potion:  { name: 'Grande potion', kind: 'potion', color: '#ff7d4d', price: 40, sell: 12, desc: 'Rend 60 PV.', heal: 60, use: 'combat', ch: 3 },
  bombe:          { name: 'Bombe à clous', kind: 'bomb', color: '#4a4440', sell: 6, desc: '22 dégâts, ignore la carapace.', bomb: 22, use: 'combat' },
  ration:         { name: 'Ration de mineur', kind: 'ration', color: '#c9a25b', price: 10, sell: 3, desc: '+15 endurance dans la mine.', energy: 15, use: 'mine' },
  // objets d'histoire
  carnet_1:       { name: 'Carnet de Hogar (I)', kind: 'note', color: '#d9c49a', key: true, desc: 'Trouvé dans les Veines de fer.' },
  carnet_2:       { name: 'Carnet de Hogar (II)', kind: 'note', color: '#d9c49a', key: true, desc: "Trouvé dans les Grottes d’argent." },
  carnet_3:       { name: 'Carnet de Hogar (III)', kind: 'note', color: '#d9c49a', key: true, desc: 'Trouvé dans les Abysses.' },
};

/* ---------- Équipement ---------- */
// slot: arme | armure | pioche | lanterne
G.GEAR = {
  dague_rouillee: { name: 'Dague rouillée', slot: 'arme', kind: 'dagger', color: '#9a6a4a', atk: 4, type: 'tranchant', desc: 'Celle que tu as toujours eue.' },
  epee_bronze:    { name: 'Épée de bronze', slot: 'arme', kind: 'sword', color: '#c98a3a', atk: 7, type: 'tranchant' },
  masse_bronze:   { name: 'Masse de bronze', slot: 'arme', kind: 'mace', color: '#c98a3a', atk: 8, type: 'contondant' },
  epee_fer:       { name: 'Épée de fer', slot: 'arme', kind: 'sword', color: '#8e9298', atk: 11, type: 'tranchant' },
  masse_fer:      { name: 'Masse de fer', slot: 'arme', kind: 'mace', color: '#8e9298', atk: 12, type: 'contondant' },
  epee_acier:     { name: "Épée d’acier", slot: 'arme', kind: 'sword', color: '#bcc8d2', atk: 15, type: 'tranchant' },
  masse_acier:    { name: "Masse d’acier", slot: 'arme', kind: 'mace', color: '#bcc8d2', atk: 16, type: 'contondant' },
  epee_argent:    { name: "Épée d’argent", slot: 'arme', kind: 'sword', color: '#f1f5f8', atk: 18, type: 'tranchant', silver: true },
  masse_argent:   { name: "Masse d’argent", slot: 'arme', kind: 'mace', color: '#f1f5f8', atk: 19, type: 'contondant', silver: true },
  lame_aube:      { name: "Lame d’Aube", slot: 'arme', kind: 'sword', color: '#62dbe9', atk: 28, type: 'aube', silver: true, desc: 'Tranche et brise. La Rouille fuit sa lumière.' },

  tablier:        { name: 'Tablier de cuir', slot: 'armure', kind: 'armor', color: '#7a4a2e', def: 0, hp: 0 },
  plastron_bronze:{ name: 'Plastron de bronze', slot: 'armure', kind: 'armor', color: '#c98a3a', def: 1, hp: 6 },
  cotte_fer:      { name: 'Cotte de fer', slot: 'armure', kind: 'armor', color: '#8e9298', def: 2, hp: 12 },
  plastron_acier: { name: "Plastron d’acier", slot: 'armure', kind: 'armor', color: '#bcc8d2', def: 3, hp: 20 },
  armure_argent:  { name: "Armure d’argent", slot: 'armure', kind: 'armor', color: '#f1f5f8', def: 4, hp: 28, rustproof: true, desc: 'Insensible à la Rouille.' },

  pioche_vieille: { name: 'Vieille pioche', slot: 'pioche', kind: 'pick', color: '#7d6a5a', power: 1 },
  pioche_bronze:  { name: 'Pioche de bronze', slot: 'pioche', kind: 'pick', color: '#c98a3a', power: 2 },
  pioche_fer:     { name: 'Pioche de fer', slot: 'pioche', kind: 'pick', color: '#8e9298', power: 3 },
  pioche_acier:   { name: "Pioche d’acier", slot: 'pioche', kind: 'pick', color: '#bcc8d2', power: 4 },

  lanterne:       { name: 'Lanterne de mineur', slot: 'lanterne', kind: 'lantern', color: '#f2b44a', light: 1, desc: '+1 rayon de lumière dans la mine.' },

  // commandes : pièces forgées pour les villageois, leur qualité fait le prix
  faucille:       { name: 'Faucille', slot: 'commande', kind: 'sickle', color: '#c98a3a', desc: 'Pour les moissons de Bertille.' },
  pointes:        { name: 'Pointes de flèche', slot: 'commande', kind: 'arrows', color: '#c98a3a', desc: 'La garde en use beaucoup.' },
  fer_cheval:     { name: 'Fer à cheval', slot: 'commande', kind: 'horseshoe', color: '#8e9298', desc: 'Les chevaux de la vallée en usent vite.' },
  chaudron:       { name: 'Chaudron', slot: 'commande', kind: 'cauldron', color: '#c98a3a', desc: 'Pour la tannerie ou la cuisine.' },
  serrure:        { name: 'Serrure', slot: 'commande', kind: 'lock', color: '#8e9298', desc: 'Les gens ferment leurs portes, ces temps-ci.' },
  clochette:      { name: "Clochette d’argent", slot: 'commande', kind: 'bell', color: '#f1f5f8', desc: 'Son tintement éloigne la Rouille.' },
  bougeoir:       { name: "Bougeoir d’argent", slot: 'commande', kind: 'candle', color: '#f1f5f8', desc: 'Pour la chapelle.' },
};

/* ---------- Fonderie (minerai → lingots) ---------- */
// zone: largeur de la zone idéale (0-1), drift: vitesse de déplacement de la zone, decay: refroidissement
G.SMELT = {
  lingot_bronze: { in: { minerai_cuivre: 2, minerai_etain: 1, charbon: 1 }, out: 2, ch: 1, zone: 0.24, center: 0.45, drift: 0.05, decay: 0.30, dur: 9 },
  lingot_fer:    { in: { minerai_fer: 2, charbon: 1 }, out: 1, ch: 2, zone: 0.20, center: 0.58, drift: 0.08, decay: 0.34, dur: 10 },
  lingot_acier:  { in: { minerai_fer: 2, charbon: 2 }, out: 1, ch: 2, zone: 0.15, center: 0.72, drift: 0.10, decay: 0.38, dur: 11 },
  lingot_argent: { in: { minerai_argent: 2, charbon: 1 }, out: 1, ch: 3, zone: 0.17, center: 0.52, drift: 0.13, decay: 0.34, dur: 11 },
  lingot_astral: { in: { minerai_astral: 3, charbon: 2 }, out: 1, ch: 4, zone: 0.12, center: 0.80, drift: 0.17, decay: 0.42, dur: 12 },
};

/* ---------- Enclume (forgeage + trempe) ---------- */
// metal: profil de trempe & difficulté. strikes: nombre de frappes.
G.METALS = {
  bronze: { label: 'bronze', ring: 1.05, cool: 9,  target: 880, tol: 70, hue: 'warm' },
  fer:    { label: 'fer',    ring: 0.95, cool: 10, target: 800, tol: 60, hue: 'warm' },
  acier:  { label: 'acier',  ring: 0.85, cool: 11, target: 780, tol: 45, hue: 'warm' },
  argent: { label: 'argent', ring: 0.80, cool: 12, target: 700, tol: 45, hue: 'warm' },
  astral: { label: 'astralite', ring: 0.70, cool: 13, target: 1050, tol: 35, hue: 'astral' },
};

G.RECIPES = {
  // outils
  pioche_bronze:  { cat: 'Outils', ch: 1, metal: 'bronze', strikes: 7,  in: { lingot_bronze: 2, bois: 1 } },
  pioche_fer:     { cat: 'Outils', ch: 2, metal: 'fer',    strikes: 9,  in: { lingot_fer: 3, bois: 1 } },
  pioche_acier:   { cat: 'Outils', ch: 3, metal: 'acier',  strikes: 10, in: { lingot_acier: 3, bois: 1, cuir: 1 } },
  lanterne:       { cat: 'Outils', ch: 2, metal: 'fer',    strikes: 6,  in: { lingot_fer: 1, quartz: 1 } },
  // armes
  epee_bronze:    { cat: 'Armes', ch: 1, metal: 'bronze', strikes: 8,  in: { lingot_bronze: 2, cuir: 1 } },
  masse_bronze:   { cat: 'Armes', ch: 1, metal: 'bronze', strikes: 8,  in: { lingot_bronze: 3, bois: 1 } },
  epee_fer:       { cat: 'Armes', ch: 2, metal: 'fer',    strikes: 10, in: { lingot_fer: 3, cuir: 1 } },
  masse_fer:      { cat: 'Armes', ch: 2, metal: 'fer',    strikes: 10, in: { lingot_fer: 3, bois: 1, os: 1 } },
  epee_acier:     { cat: 'Armes', ch: 3, metal: 'acier',  strikes: 11, in: { lingot_acier: 3, cuir: 2 } },
  masse_acier:    { cat: 'Armes', ch: 3, metal: 'acier',  strikes: 11, in: { lingot_acier: 3, bois: 1, os: 2 } },
  epee_argent:    { cat: 'Armes', ch: 3, metal: 'argent', strikes: 12, in: { lingot_acier: 2, lingot_argent: 2, cuir: 1, quartz: 1 } },
  masse_argent:   { cat: 'Armes', ch: 3, metal: 'argent', strikes: 12, in: { lingot_acier: 2, lingot_argent: 2, bois: 1, quartz: 1 } },
  lame_aube:      { cat: 'Armes', ch: 4, metal: 'astral', strikes: 16, in: { lingot_astral: 3, lingot_argent: 2, ecaille_wyverne: 1, cristal: 1 } },
  // armures
  plastron_bronze:{ cat: 'Armures', ch: 1, metal: 'bronze', strikes: 9,  in: { lingot_bronze: 3, cuir: 2 } },
  cotte_fer:      { cat: 'Armures', ch: 2, metal: 'fer',    strikes: 11, in: { lingot_fer: 4, cuir: 2 } },
  plastron_acier: { cat: 'Armures', ch: 3, metal: 'acier',  strikes: 12, in: { lingot_acier: 4, cuir: 3 } },
  armure_argent:  { cat: 'Armures', ch: 4, metal: 'argent', strikes: 13, in: { lingot_acier: 3, lingot_argent: 3, ecaille: 2 } },
  // commandes
  faucille:       { cat: 'Commandes', ch: 1, metal: 'bronze', strikes: 6, in: { lingot_bronze: 1, bois: 1 } },
  pointes:        { cat: 'Commandes', ch: 1, metal: 'bronze', strikes: 5, in: { lingot_bronze: 1, os: 1 } },
  fer_cheval:     { cat: 'Commandes', ch: 2, metal: 'fer',    strikes: 5, in: { lingot_fer: 1 } },
  chaudron:       { cat: 'Commandes', ch: 2, metal: 'bronze', strikes: 8, in: { lingot_bronze: 3 } },
  serrure:        { cat: 'Commandes', ch: 2, metal: 'fer',    strikes: 7, in: { lingot_fer: 1, lingot_bronze: 1 } },
  clochette:      { cat: 'Commandes', ch: 3, metal: 'argent', strikes: 6, in: { lingot_argent: 1, quartz: 1 } },
  bougeoir:       { cat: 'Commandes', ch: 3, metal: 'argent', strikes: 7, in: { lingot_argent: 1, lingot_bronze: 1 } },
};

/* ---------- Établi (sans mini-jeu) ---------- */
G.BENCH = {
  bombe: { in: { charbon: 2, os: 1 }, out: 1, ch: 1 },
};

/* ---------- Mine ---------- */
G.MINE = [
  { id: 1, name: 'Galeries hautes', reqPower: 1, ch: 1, rows: 34, hard: [1, 2],
    ores: [['charbon', 10], ['minerai_cuivre', 9], ['minerai_etain', 6], ['quartz', 0.8, 0.45]],
    oreMin: 0.10, oreMax: 0.22, boulder: 0.02, gas: 0, desc: 'Cuivre, étain et charbon. Parfait pour débuter.' },
  { id: 2, name: 'Veines de fer', reqPower: 2, ch: 2, rows: 38, hard: [2, 3],
    ores: [['charbon', 9], ['minerai_fer', 10], ['minerai_cuivre', 3], ['minerai_etain', 2], ['quartz', 1.4, 0.3], ['rubis', 0.5, 0.6]],
    oreMin: 0.11, oreMax: 0.24, boulder: 0.035, gas: 0.012, note: 'carnet_1', desc: 'Du fer en abondance. Attention aux éboulements.' },
  { id: 3, name: "Grottes d’argent", reqPower: 3, ch: 3, rows: 42, hard: [3, 4],
    ores: [['charbon', 6], ['minerai_fer', 6], ['minerai_argent', 8, 0.15], ['quartz', 2, 0.2], ['rubis', 1, 0.5], ['saphir', 1.1, 0.35]],
    oreMin: 0.12, oreMax: 0.25, boulder: 0.04, gas: 0.02, note: 'carnet_2', desc: "L’argent luit au fond des grottes. L’air y est vicié." },
  { id: 4, name: 'Abysses', reqPower: 4, ch: 4, rows: 46, hard: [4, 5],
    ores: [['charbon', 4], ['minerai_argent', 5], ['minerai_astral', 6, 0.35], ['cristal', 1.1, 0.6], ['rubis', 1, 0.3], ['saphir', 0.8, 0.2]],
    oreMin: 0.12, oreMax: 0.26, boulder: 0.05, gas: 0.03, note: 'carnet_3', desc: "Là où l’astralite est tombée. Personne n’en est revenu… sauf toi ?" },
];
G.MINE_BASE_ENERGY = 45;

/* ---------- Chasse ---------- */
// intentions : atk (dmg, hits), prep -> heavy, guard (armor), buff (atk), rust (def-), heal, poison, roar (élan à 0)
G.ENEMIES = {
  loup:      { name: 'Loup gris', emoji: '🐺', hp: 16, agi: 1.0, weak: 'tranchant', gold: [2, 5],
               moves: [['atk', 3, { dmg: 3, name: 'Morsure' }], ['atk', 1, { dmg: 2, hits: 2, name: 'Assaut' }], ['buff', 1, { atk: 1, name: 'Hurlement' }]],
               drops: [['cuir', 1, 2, 1], ['croc', 1, 1, 0.45]] },
  sanglier:  { name: 'Sanglier', emoji: '🐗', hp: 24, agi: 0.85, weak: 'tranchant', gold: [3, 6],
               moves: [['atk', 2, { dmg: 4, name: 'Coup de boutoir' }], ['prep', 1, { next: { dmg: 10, name: 'Charge' }, name: 'Gratte le sol' }]],
               drops: [['cuir', 1, 1, 1], ['os', 1, 2, 0.9]] },
  araignee:  { f: true, name: 'Araignée des fourrés', emoji: '🕷️', hp: 13, agi: 1.25, weak: 'contondant', gold: [2, 4],
               moves: [['atk', 2, { dmg: 3, name: 'Piqûre' }], ['poison', 2, { dmg: 2, turns: 3, name: 'Venin' }]],
               drops: [['os', 1, 1, 0.5], ['croc', 1, 1, 0.5]] },
  ours_rouille: { name: 'Ours rouillé', emoji: '🐻', hp: 80, agi: 0.9, weak: 'contondant', rust: true, armor: 12, boss: true, gold: [30, 30],
               moves: [['atk', 3, { dmg: 7, name: 'Griffes' }], ['prep', 2, { next: { dmg: 16, name: 'Étreinte' }, name: 'Se dresse' }], ['guard', 1, { armor: 10, name: 'Plaques de rouille' }], ['rust', 1, { def: 1, name: 'Souffle rouillé' }]],
               drops: [['noyau_rouille', 1, 1, 1], ['cuir', 3, 3, 1], ['os', 2, 2, 1]] },

  crapaud:   { name: 'Crapaud rouillé', emoji: '🐸', hp: 30, agi: 1.0, weak: 'tranchant', rust: true, gold: [5, 9],
               moves: [['atk', 3, { dmg: 7, name: 'Langue' }], ['poison', 2, { dmg: 3, turns: 3, name: 'Bave acide' }], ['heal', 1, { hp: 8, name: 'Se gonfle' }]],
               drops: [['os', 1, 2, 0.8], ['noyau_rouille', 1, 1, 0.25]] },
  golemet:   { name: 'Golemet de rouille', emoji: '🗿', hp: 30, agi: 0.75, weak: 'contondant', rust: true, armor: 14, gold: [6, 10],
               moves: [['atk', 3, { dmg: 8, name: 'Poing' }], ['guard', 2, { armor: 10, name: 'Se recouvre' }], ['rust', 1, { def: 1, name: 'Poussière rouge' }]],
               drops: [['noyau_rouille', 1, 1, 0.6], ['minerai_fer', 1, 3, 0.8]] },
  feu_follet:{ name: 'Feu follet', emoji: '🔥', hp: 20, agi: 1.4, weak: 'tranchant', evade: 0.45, gold: [5, 8],
               moves: [['atk', 3, { dmg: 5, hits: 2, name: 'Étincelles' }], ['buff', 1, { atk: 2, name: 'Grandit' }]],
               drops: [['charbon', 2, 4, 1], ['quartz', 1, 1, 0.2]] },
  golem_ancien: { name: 'Golem ancien', emoji: '🗿', hp: 150, agi: 0.8, weak: 'contondant', rust: true, armor: 30, boss: true, gold: [80, 80],
               moves: [['atk', 3, { dmg: 11, name: 'Marteau de pierre' }], ['prep', 2, { next: { dmg: 24, name: 'Séisme' }, name: 'Lève les bras' }], ['guard', 2, { armor: 18, name: 'Peau de pierre' }], ['rust', 1, { def: 2, name: 'Nuage de rouille' }]],
               drops: [['noyau_rouille', 2, 2, 1], ['quartz', 2, 2, 1], ['lingot_argent', 1, 1, 1]] },

  harpie:    { f: true, name: 'Harpie', emoji: '🦅', hp: 34, agi: 1.35, weak: 'tranchant', evade: 0.35, gold: [8, 12],
               moves: [['atk', 3, { dmg: 8, hits: 2, name: 'Serres' }], ['roar', 1, { name: 'Cri strident' }], ['buff', 1, { atk: 2, name: 'Plonge' }]],
               drops: [['plume', 1, 2, 1], ['os', 1, 1, 0.5]] },
  wyverneau: { name: 'Wyverneau', emoji: '🦎', hp: 48, agi: 1.0, weak: 'contondant', armor: 10, gold: [9, 14],
               moves: [['atk', 3, { dmg: 11, name: 'Morsure' }], ['poison', 1, { dmg: 4, turns: 3, name: 'Dard' }], ['guard', 1, { armor: 10, name: 'Se roule' }]],
               drops: [['ecaille', 1, 2, 1], ['cuir', 1, 1, 0.6]] },
  wyverne:   { f: true, name: 'Wyverne des Vents', emoji: '🐉', hp: 210, agi: 1.15, weak: 'contondant', armor: 20, boss: true, gold: [150, 150],
               moves: [['atk', 3, { dmg: 13, name: 'Coup de queue' }], ['atk', 1, { dmg: 7, hits: 3, name: 'Rafale de griffes' }], ['prep', 2, { next: { dmg: 30, name: 'Souffle des cimes' }, name: 'Inspire profondément' }], ['poison', 1, { dmg: 5, turns: 3, name: 'Dard venimeux' }], ['guard', 1, { armor: 16, name: 'Replie ses ailes' }]],
               drops: [['ecaille_wyverne', 1, 1, 1], ['ecaille', 3, 3, 1], ['cristal', 1, 1, 1]] },

  roi_rouille: { name: 'Le Roi Rouille', emoji: '👑', hp: 320, agi: 1.15, weak: 'aube', rust: true, armor: 40, boss: true, final: true, gold: [0, 0],
               moves: [['atk', 3, { dmg: 15, name: 'Sceptre rongé' }], ['atk', 1, { dmg: 8, hits: 3, name: 'Pluie de limaille' }], ['prep', 2, { next: { dmg: 34, name: 'Effondrement' }, name: 'Fait gronder la montagne' }], ['guard', 1, { armor: 25, name: 'Armure de ferraille' }], ['rust', 1, { def: 2, name: 'Rouille dévorante' }], ['heal', 1, { hp: 25, name: 'Aspire le métal' }]],
               drops: [] },
};

G.ZONES = {
  foret:  { name: 'Forêt de Combefroide', ch: 1, fights: 3, pool: ['loup', 'loup', 'sanglier', 'araignee'], boss: 'ours_rouille', bossCh: 2,
            desc: 'Loups, sangliers et araignées. Cuir et os en quantité.' },
  marais: { name: 'Marais de Rouille', ch: 3, fights: 3, pool: ['crapaud', 'golemet', 'feu_follet'], boss: 'golem_ancien', bossCh: 3,
            desc: "Les bêtes y sont rongées par la Rouille. Prends de l’argent." },
  pic:    { name: 'Pic des Vents', ch: 4, fights: 3, pool: ['harpie', 'wyverneau', 'harpie'], boss: 'wyverne', bossCh: 4,
            desc: 'Le nid de la Wyverne. Ses écailles ne fondent dans aucun feu.' },
  coeur:  { name: 'Cœur de la Montagne', ch: 5, fights: 0, pool: [], boss: 'roi_rouille', bossCh: 5, bossOnly: true,
            desc: 'La source de la Rouille. Et peut-être Hogar.' },
};

/* ---------- Village ---------- */
G.NPCS = {
  hogar:   { name: 'Maître Hogar', color: '#d9a35b', emoji: '🧔' },
  sven:    { name: 'Sven, le garde', color: '#7fa2c9', emoji: '💂' },
  ida:     { name: 'Ida, la tanneuse', color: '#c9875f', emoji: '👩' },
  bertille:{ name: 'Bertille, la fermière', color: '#a9c46a', emoji: '👩‍🌾' },
  aldric:  { name: 'Père Aldric', color: '#c8b8e8', emoji: '🧓' },
  odile:   { name: 'Odile, la marchande', color: '#e0b04a', emoji: '🧕' },
  roi:     { name: 'Varn, le Roi Rouille', color: '#e0663a', emoji: '👑' },
  hogar_ronge: { name: 'Maître Hogar', color: '#c9734a', emoji: '🧔' },
  moi:     { name: '', color: '#ff8a3d', emoji: '🔨' },
  recit:   { name: '', color: '#a89c8c', emoji: '' },
};

G.SHOP = ['charbon', 'bois', 'potion', 'grande_potion', 'ration'];
// après la fin de l'histoire : minerais et lingots en vente chez Odile, débloqués par les étoiles de ton échoppe.
// « Achats flemme » : chers (minerai = 5 × la revente, lingot = 4 ×), pour s'éviter une descente ou une fonte.
G.LAZY = [
  ['minerai_cuivre', 1], ['minerai_etain', 1], ['minerai_fer', 1], ['minerai_argent', 2], ['minerai_astral', 4],
  ['lingot_bronze', 1], ['lingot_fer', 1], ['lingot_acier', 2], ['lingot_argent', 3], ['lingot_astral', 5],
];
G.lazyPrice = id => Math.round(G.ITEMS[id].sell * (G.ITEMS[id].kind === 'ore' ? 5 : 4));

/* ---------- Histoire ---------- */
// objectifs : craft (forger X), deliver (livrer X, qualité min), boss (vaincre), find (trouver un objet)
G.CHAPTERS = [
  {
    title: "L’enclume froide",
    intro: [
      ['recit', "Combefroide, village de mineurs au pied du mont Ardent. Depuis l’automne, une maladie ronge le métal : les outils s’effritent, les épées se tachent d’orange. On l’appelle la Rouille."],
      ['recit', "Depuis quelques semaines, les mineurs entendent frapper la nuit, très loin sous la montagne. Un rythme lent, régulier. Comme une enclume."],
      ['recit', "Il y a trois nuits, Maître Hogar, le forgeron, est descendu dans la mine pour en trouver la source. Il n’est jamais remonté."],
      ['sven', "{nom} ! Tu étais son apprenti. Sans forgeron, le village ne tiendra pas l’hiver. La forge est à toi, maintenant."],
      ['moi', "Je n’ai jamais forgé seul… Mais je connais les gestes. Il me faut d’abord une vraie pioche."],
      ['sven', "Et une épée pour la garde, si tu peux. Les loups de la forêt deviennent fous. Va voir Odile si tu manques de charbon ou de bois."],
    ],
    goals: [
      { id: 'c1_pioche', type: 'craft', item: 'pioche_bronze', title: 'Forger une pioche de bronze', hint: "Mine du cuivre et de l’étain, fonds le bronze à la fonderie, puis forge la pioche à l’enclume." },
      { id: 'c1_epee', type: 'deliver', item: 'epee_bronze', minQ: 40, npc: 'sven', reward: 40, title: 'Une épée pour Sven', hint: 'Qualité « Correct » minimum. Il te faudra du cuir : chasse en forêt.' },
      { id: 'c1_cuir', type: 'deliver', item: 'cuir', count: 3, npc: 'ida', reward: 25, bonus: { potion: 2 }, title: '3 cuirs pour Ida', hint: 'Les loups et les sangliers de la forêt en donnent.' },
    ],
    outro: [
      ['sven', "Belle lame. Hogar serait fier. Mais écoute : les mineurs disent que la Rouille vient d’en bas. De plus profond que les Galeries hautes."],
      ['moi', "Alors il me faut du fer. Et une pioche capable de le creuser."],
    ],
  },
  {
    title: 'Le cœur de fer',
    intro: [
      ['bertille', "Mes chevaux ont perdu leurs fers, ils sont tombés en poussière orange ! Il m’en faut deux, s’il te plaît."],
      ['ida', "Et un ours énorme rôde à l’orée du bois. Sa fourrure est couverte de plaques de rouille. Les flèches rebondissent dessus."],
      ['moi', "Une masse brisera ces plaques mieux qu’une lame. Et dans les Veines de fer, je trouverai peut-être une trace de Maître Hogar."],
    ],
    goals: [
      { id: 'c2_fers', type: 'deliver', item: 'fer_cheval', count: 2, npc: 'bertille', reward: 60, title: '2 fers à cheval pour Bertille', hint: 'Mine du fer dans les Veines de fer, fonds-le en lingots, puis forge les fers à l’enclume.' },
      { id: 'c2_cotte', type: 'deliver', item: 'cotte_fer', minQ: 40, npc: 'sven', reward: 80, title: 'Une cotte de fer pour Sven', hint: 'Qualité « Correct » minimum.' },
      { id: 'c2_carnet', type: 'find', item: 'carnet_1', title: 'Retrouver la trace de Hogar', hint: 'Fouille le fond des Veines de fer. Un coffre y attend.' },
      { id: 'c2_ours', type: 'boss', enemy: 'ours_rouille', title: "Abattre l’Ours rouillé", hint: 'En forêt. Les coups contondants brisent sa carapace.' },
    ],
    outro: [
      ['recit', "Carnet de Hogar, page griffonnée : « La Rouille craint l’argent. J’en ai vu l’effet sur une bête : sa peau grésillait au contact d’une bague. Il me faut descendre aux Grottes d’argent. »"],
      ['aldric', "L’ours portait ce noyau dans le cœur… Il grince comme une porte. Ce mal n’est pas naturel, {nom}. Il vient de quelque chose, ou de quelqu’un."],
    ],
  },
  {
    title: "L’argent contre la Rouille",
    intro: [
      ['aldric', "Le marais au nord est perdu. Les crapauds y sont devenus de fer rongé, et un géant de pierre en garde le cœur."],
      ['aldric', "Forge-moi une clochette d’argent pour la chapelle. Son chant protégera le village pendant que tu te bats."],
      ['moi', "Pour atteindre l’argent, il me faudra une pioche de fer. Et pour le marais, une arme d’argent."],
    ],
    goals: [
      { id: 'c3_cloche', type: 'deliver', item: 'clochette', npc: 'aldric', reward: 120, title: "Une clochette d’argent", hint: "Il faut une pioche de fer pour les Grottes d’argent." },
      { id: 'c3_arme', type: 'craft', item: ['epee_argent', 'masse_argent'], title: "Forger une arme d’argent", hint: "Épée ou masse d’argent. Les créatures de Rouille y sont vulnérables." },
      { id: 'c3_carnet', type: 'find', item: 'carnet_2', title: 'Suivre la trace de Hogar', hint: "Au fond des Grottes d’argent." },
      { id: 'c3_golem', type: 'boss', enemy: 'golem_ancien', title: 'Vaincre le Golem ancien', hint: 'Au cœur du Marais de Rouille.' },
      { id: 'c3_rep', type: 'rep', level: 3, title: 'Gagner la confiance du village', hint: 'Atteins la renommée 3 en honorant les commandes du village (onglet Village).' },
    ],
    outro: [
      ['recit', "Carnet de Hogar : « L’astralite. Le métal tombé du ciel, sous la montagne. Lui seul peut trancher le cœur de la Rouille. Mais il ne se travaille qu’avec un manche que rien ne brûle… Les anciens parlaient des écailles de la Wyverne du Pic. »"],
      ['aldric', "Une couronne dans la roche… Les vieilles chroniques de la chapelle parlent d’un royaume, ici, bien avant le village. Ardent. Et de son roi-forgeron, Varn."],
      ['aldric', "On dit qu’une étoile est tombée dans la montagne, et que Varn s’en est forgé une couronne pour que sa forge ne s’éteigne jamais. Puis le royaume a disparu, rongé comme nos outils. Pas la couronne, apparemment."],
      ['sven', "Le Pic des Vents ? Personne n’y monte. Mais si quelqu’un peut le faire, c’est toi."],
    ],
  },
  {
    title: 'Le métal des étoiles',
    intro: [
      ['moi', "Une pioche d’acier pour les Abysses. L’écaille de la Wyverne pour le manche. Et l’astralite pour la lame."],
      ['ida', "Prends ces potions. Et reviens, d’accord ? On a déjà perdu un forgeron."],
    ],
    gift: { potion: 3 },
    goals: [
      { id: 'c4_pioche', type: 'craft', item: 'pioche_acier', title: "Forger une pioche d’acier", hint: "Indispensable pour creuser les Abysses." },
      { id: 'c4_carnet', type: 'find', item: 'carnet_3', title: 'La dernière page de Hogar', hint: 'Tout au fond des Abysses.' },
      { id: 'c4_wyverne', type: 'boss', enemy: 'wyverne', title: 'Vaincre la Wyverne des Vents', hint: 'Au sommet du Pic des Vents.' },
      { id: 'c4_rep', type: 'rep', level: 4, title: 'Devenir maître de forge', hint: 'Renommée 4 : le village doit croire en toi avant que tu descendes.' },
      { id: 'c4_lame', type: 'craft', item: 'lame_aube', title: "Forger la Lame d’Aube", hint: "Astralite, argent, écaille de Wyverne et cristal astral. Le forgeage le plus dur de ta vie." },
    ],
    outro: [
      ['recit', "Carnet de Hogar, au bas de la dernière page, l’écriture tremble : « Il est là. Varn. Un roi de métal mort, assis devant son enclume. Sa couronne se fend, et il veut un forgeron pour la réparer. C’est lui qui frappait, la nuit : il appelait. »"],
      ['recit', "« Je lui ai dit non. Il m’a pris les mains. Je sens la Rouille y entrer. Bientôt, je frapperai pour lui, et chaque coup réparera un peu sa couronne. Apprenti… forge ce que je n’ai pas pu forger. »"],
      ['moi', "J’arrive, Maître."],
    ],
  },
  {
    title: 'Le Roi Rouille',
    intro: [
      ['recit', "La Lame d’Aube brille d’une lumière froide. Au fond des Abysses, une galerie que tu n’avais jamais vue s’est ouverte. L’air y sent le fer chaud, et on y entend frapper."],
      ['recit', "Au bout, une salle taillée dans la roche. Des statues de forgerons agenouillés. Et sur un trône de ferraille, un roi dont la couronne fendue luit comme une braise."],
      ['recit', "À ses pieds, Maître Hogar frappe sur une enclume, enchaîné par trois entraves de rouille. Il ne lève pas les yeux."],
      ['moi', "Tant que Hogar frappe pour lui, la couronne se répare. Si je brise ces entraves, le roi n’aura plus de forgeron."],
    ],
    goals: [
      { id: 'c5_roi', type: 'boss', enemy: 'roi_rouille', title: 'Affronter le Roi Rouille', hint: 'Au Cœur de la Montagne (onglet Chasse). Pendant le combat, le sceau « Libérer » (2 élan) brise une entrave de Hogar.' },
    ],
    // fin si Hogar a été libéré pendant le combat
    outro: [
      ['recit', "Le Roi Rouille s’effondre dans un fracas de ferraille. Sa couronne roule à tes pieds, s’éteint, et n’est plus qu’un anneau de métal froid."],
      ['hogar', "{nom}… Là-dessous, j’entendais une enclume répondre à la mienne. Une belle frappe, régulière… C’était donc toi. Je savais bien que tu avais la main."],
      ['moi', "Rentrons, Maître. La forge est froide sans vous."],
      ['hogar', "Ramasse la couronne. On va la fondre, toi et moi, et en faire une enclume. La dernière forge d’Ardent n’était pas la sienne : c’est la nôtre."],
      ['hogar', "Et après, la forge sera à toi. Moi, je m’assiérai au coin du feu pour te regarder travailler. Et critiquer, bien sûr."],
      ['recit', "Au printemps, la Rouille disparut du mont Ardent. À Combefroide, on raconte encore l’histoire de l’apprenti qui ralluma la dernière forge, et du vieux maître qui revint vivant de la montagne."],
    ],
    // fin si Hogar est resté enchaîné jusqu'au bout
    outroAlt: [
      ['recit', "Le Roi Rouille s’effondre dans un fracas de ferraille. Au même instant, Hogar lâche son marteau et tombe à genoux, comme si les chaînes l’avaient tenu debout."],
      ['hogar_ronge', "{nom}… C’est fini ? Je ne sens plus mes mains."],
      ['recit', "Ses mains ont la couleur de la rouille. Elles ne guériront pas tout à fait."],
      ['hogar_ronge', "Ne fais pas cette tête. Un forgeron, ça a deux mains, et la forge n’en demande pas plus : les tiennes suffiront. Tiens. Mon marteau. Il est à toi."],
      ['moi', "Je vous ramène à la maison, Maître."],
      ['recit', "Au printemps, la Rouille disparut du mont Ardent. Hogar ne forgea plus jamais, mais il ne manqua pas une seule de tes frappes, assis au coin du feu. On dit qu’il les comptait."],
    ],
  },
];

G.NOTES = {
  carnet_1: "« Jour 1. On frappe, sous la montagne. Toutes les nuits, le même rythme, comme un forgeron qui attendrait un apprenti. Les veines de fer saignent de l’orange. La Rouille monte d’en bas. Je descends voir. — H. »",
  carnet_2: "« Jour 2. L’argent repousse la Rouille, j’en suis sûr. Plus bas, une salle taillée, des statues de forgerons agenouillés. Et au fond, une couronne dans la roche. Elle respirait. — H. »",
  carnet_3: "« Jour 3. Il s’appelle Varn. Il veut que je répare sa couronne. Si tu trouves ceci, apprenti : l’astralite, l’argent, l’écaille de la Wyverne. Forge l’Aube. Et ne l’écoute pas quand il te parlera de feu éternel. — H. »",
};

/* ---------- Histoires des villageois (arcs en 3 étapes, débloqués par chapitre) ---------- */
// chaque étape : chapitre min (1-5), objet demandé, nombre, qualité min, or, renommée, demande, puis dialogue à la livraison.
// la dernière étape donne un avantage permanent (G.PERKS).
G.ARCS = {
  sven: { title: 'Le petit frère', perk: 'garde', steps: [
    { ch: 1, item: 'pointes', n: 1, gold: 25, rep: 1,
      txt: "Mon petit frère Tobias veut entrer dans la garde. Il a quinze ans. S’il doit s’entraîner, autant que ce soit avec de bonnes pointes de flèche.",
      after: [['sven', "Il a tiré toute la journée sur un tonneau. Il l’a touché deux fois. C’est un début."]] },
    { ch: 2, item: 'epee_fer', n: 1, minQ: 40, gold: 70, rep: 1,
      txt: "Tobias est parti seul en forêt pour prouver ce qu’il vaut. Il est revenu avec la main couverte de taches orange. Il lui faut une vraie lame, pas un bâton.",
      after: [['sven', "Il ne lâche plus ton épée. Il dort avec, je crois."], ['moi', "Et sa main ?"], ['sven', "Le père Aldric dit que ça ne s’étend pas. Pour l’instant."]] },
    { ch: 3, item: 'plastron_acier', n: 1, minQ: 65, gold: 130, rep: 1,
      txt: "La garde monte au marais demain. Tobias vient avec nous, je n’ai pas pu l’en empêcher. Alors forge-lui une armure qui me laisse dormir.",
      after: [['sven', "On est revenus. Tous. Tobias a pris un poing de golemet en pleine poitrine et il s’est relevé en riant. Ton acier a tenu."], ['sven', "Tiens : l’écusson de la garde. Tu en fais partie, maintenant, que tu le veuilles ou non."]] },
  ] },
  ida: { title: 'Le tablier de Hogar', perk: 'tablier', steps: [
    { ch: 1, item: 'croc', n: 2, gold: 20, rep: 1, raw: true,
      txt: "Hogar me rapportait toujours un croc de loup quand il passait par la forêt. Une manie de vieux bourru. Tu veux bien… continuer la tradition ?",
      after: [['ida', "Je les garde dans une boîte. Il y en avait quarante-trois. Quarante-cinq, maintenant."]] },
    { ch: 2, item: 'chaudron', n: 1, gold: 55, rep: 1,
      txt: "Mes cuves de tannage rouillent. Hogar m’avait promis un chaudron « quand il aurait le temps ». Il n’a jamais eu le temps.",
      after: [['ida', "Il est parfait. Il aurait râlé qu’il était trop beau pour du cuir."], ['ida', "Tu sais, il parlait de toi. Tout le temps. « L’apprenti a la main », qu’il disait. Il ne te l’aurait jamais dit en face, bien sûr."]] },
    { ch: 4, item: 'ecaille', n: 2, gold: 60, rep: 1, raw: true,
      txt: "Je veux te faire un tablier. Un vrai, en écailles de wyverneau doublées de cuir : la chaleur glisse dessus. Rapporte-moi deux écailles.",
      after: [['ida', "Voilà. Il ne brûle pas, il ne se perce pas, et le métal garde sa chaleur contre toi."], ['ida', "Quand tu reverras Hogar, montre-lui que tu en as un plus beau que le sien. Et tu me raconteras sa tête."]] },
  ] },
  bertille: { title: 'La terre malade', perk: 'pain', steps: [
    { ch: 1, item: 'faucille', n: 1, minQ: 40, gold: 25, rep: 1,
      txt: "La Rouille est dans la terre, maintenant. Les blés poussent avec des taches orange. Je dois couper les épis malades avant qu’ils gâtent le reste.",
      after: [['bertille', "J’ai sauvé la moitié du champ. L’autre moitié… je l’ai brûlée. Ça sentait le fer chaud."]] },
    { ch: 2, item: 'fer_cheval', n: 4, gold: 70, rep: 1,
      txt: "Je descends vendre à la vallée tant qu’il reste quelque chose à vendre. Il me faut des fers pour tout l’attelage.",
      after: [['bertille', "Au marché, on parle de Combefroide. On dit que la Rouille vient d’un vieux roi enterré sous la montagne, qui ne veut pas mourir."], ['bertille', "Des contes de grand-mère… Hein ?"]] },
    { ch: 3, item: 'lingot_argent', n: 1, gold: 45, rep: 1, raw: true,
      txt: "Le père Aldric dit que l’argent purifie. Si je mêle de la limaille d’argent à la terre… Apporte-m’en un lingot, je le râperai moi-même.",
      after: [['bertille', "Les pousses sont vertes. Vertes ! J’ai pleuré comme une gamine devant mon champ."], ['bertille', "Prends ce pain de seigle. Il en viendra un chaque semaine : avec ça au ventre, tu creuseras plus longtemps."]] },
  ] },
  aldric: { title: "La chronique d’Ardent", perk: 'benediction', steps: [
    { ch: 3, item: 'noyau_rouille', n: 1, gold: 40, rep: 1, raw: true,
      txt: "Ce noyau que tu as rapporté de l’ours… J’en voudrais un autre. Je crois qu’il y a quelque chose de gravé dedans.",
      after: [['aldric', "Regarde à la loupe. Ce n’est pas de la rouille : c’est de la limaille, tassée. Et dedans, une lettre. Un V couronné."], ['aldric', "Le sceau des rois d’Ardent. Le royaume qui était ici avant le village. Avant tout."]] },
    { ch: 3, item: 'bougeoir', n: 1, gold: 60, rep: 1,
      txt: "Les archives sont sous la crypte, dans le noir. Avec un bougeoir d’argent, je pourrai lire sans que la Rouille mange les reliures.",
      after: [['aldric', "J’ai trouvé : « Varn, roi-forgeron d’Ardent, reçut une étoile tombée dans la montagne, et s’en forgea une couronne pour que sa forge ne s’éteignît jamais. »"], ['aldric', "« Mais la couronne avait faim. Elle mangea les outils, puis les épées, puis les portes du royaume. » La page suivante est rongée. Orange."]] },
    { ch: 4, item: 'lingot_astral', n: 1, gold: 80, rep: 1, raw: true,
      txt: "Apporte-moi un lingot d’astralite. Je veux voir ce qu’il fait à côté d’un noyau de Rouille.",
      after: [['aldric', "Le noyau a tremblé. Il s’est tourné vers l’astralite, comme une fleur vers le soleil."], ['aldric', "La Rouille n’est pas une maladie, {nom}. C’est une faim. La couronne de Varn mange le métal pour rester chaude. Et pour se réparer, il lui faut des mains de forgeron."], ['aldric', "Prends ma bénédiction. Elle ne vaut pas une lame, mais tu entreras dans chaque combat avec un peu d’élan."]] },
  ] },
  odile: { title: 'Les pièces à la couronne', perk: 'commerce', steps: [
    { ch: 2, item: 'serrure', n: 1, gold: 45, rep: 1,
      txt: "On a forcé mon coffre cette nuit. On n’a rien pris… sauf les vieilles pièces à la couronne que les mineurs me revendent. Qui vole des pièces qui ne valent rien ? Il me faut une serrure.",
      after: [['odile', "On a retrouvé les pièces ce matin, au bord du puits de la mine. Toutes alignées, la couronne tournée vers le bas."], ['odile', "Je n’aime pas ça. Pas du tout."]] },
    { ch: 3, item: 'rubis', n: 1, gold: 70, rep: 1, raw: true,
      txt: "Un client de la capitale paie une fortune pour un rubis du mont Ardent. Avec ça, je peux faire rouvrir la route marchande.",
      after: [['odile', "La route est rouverte ! Les marchands remontent… et ils veulent des lames. Des lames forgées à Combefroide, « la forge qui tient tête à la Rouille »."]] },
    { ch: 4, item: 'epee_acier', n: 2, minQ: 65, gold: 200, rep: 1,
      txt: "Un marchand de la capitale veut deux épées d’acier, et des bonnes. Ta réputation te précède, apprenti.",
      after: [['odile', "Il a payé le double sans discuter. Tu te rends compte ?"], ['odile', "Ouvre donc ta propre échoppe, ici, au village : je t’enverrai les clients de passage. Et je te rachète tout plus cher : entre associés, c’est normal."]] },
  ] },
};
// avantages permanents gagnés au bout des histoires
G.PERKS = {
  garde:       { name: 'Écusson de la garde', icon: 'bouclier', desc: '+1 DÉF en permanence.' },
  tablier:     { name: "Tablier d’écailles", icon: 'tablier', desc: 'À l’enclume, le métal refroidit 20 % moins vite.' },
  pain:        { name: 'Pain de Bertille', icon: 'ration', desc: '+10 endurance dans la mine.' },
  benediction: { name: "Bénédiction d’Aldric", icon: 'clochette', desc: 'Chaque combat commence avec 1 élan.' },
  commerce:    { name: "Associé·e d’Odile", icon: 'piece', desc: 'Tu ouvres ta propre échoppe (onglet Village), et tes reventes à Odile rapportent 25 % de plus.' },
};

/* ---------- Échoppe (fin de partie : débloquée par l'histoire d'Odile ou la fin du jeu) ---------- */
// clients : budget = multiplicateur du prix maximal accepté ; cats = emplacements d'équipement qui l'intéressent ; minQ = exigence minimale
G.CUSTOMERS = {
  marchand:   { name: 'Corvin, marchand de la capitale', color: '#e0b04a', emoji: '🧔', budget: 1.2, w: 3,
                hi: ["On m’a vanté ton acier jusqu’à la capitale.", "Je revends dans tout le royaume. Montre-moi ce que tu as."] },
  chevaliere: { name: 'Dame Isaure, chevalière', color: '#9fb7d9', emoji: '🛡️', budget: 1.15, cats: ['arme', 'armure'], minQ: 40, w: 2,
                hi: ["Je pars garder le col. Il me faut du solide.", "Mon écuyer a cassé mon équipement. Encore."] },
  aventurier: { name: 'Fenn, aventurier', color: '#8fc28a', emoji: '🧭', budget: 0.9, w: 3,
                hi: ["Pas beaucoup d’or, mais de belles histoires !", "On dit qu’il y a un trésor sous la montagne. Je vais voir."] },
  baron:      { name: 'Le baron de Valrouge', color: '#c98ad9', emoji: '🎩', budget: 1.6, minQ: 65, w: 1, stars: 3,
                hi: ["Je ne veux que le meilleur. Le prix importe peu… dans une certaine mesure.", "Faites vite, mon carrosse attend."] },
  sven:       { name: 'Sven, le garde', color: '#7fa2c9', emoji: '💂', budget: 0.9, cats: ['arme', 'armure', 'commande'], w: 1,
                hi: ["La caserne a besoin de matériel. Fais-moi un prix d’ami.", "Pour Tobias. Ne lui dis pas, c’est une surprise."] },
  bertille:   { name: 'Bertille, la fermière', color: '#a9c46a', emoji: '👩‍🌾', budget: 0.85, cats: ['commande', 'pioche'], w: 1,
                hi: ["La moisson approche. Tu as ce qu’il me faut ?", "Je paie en or, cette fois. Pas en œufs."] },
};
// étoiles de l'échoppe : renommée de boutique requise
G.SHOP_STARS = [0, 8, 20, 38, 60];

/* ---------- Raffinage : meule (reprise de qualité, une fois par pièce) et sertissage ---------- */
// chasses (emplacements de gemme) selon la qualité : Excellent = 1, Chef-d'œuvre = 2. Une gemme sertie n'est jamais perdue.
G.SOCKETS = q => (q >= 95 ? 2 : q >= 85 ? 1 : 0);
// gemmes : sur quelle pièce, et l'effet à pleine réussite (k = qualité du sertissage, 0,4 à 1)
G.GEMS = {
  rubis:   { slot: 'arme',   eff: k => `Coups parfaits +${Math.round(15 * k)} %` },
  cristal: { slot: 'arme',   eff: k => (k >= 0.7 ? '+1 élan au début des combats' : `+1 élan au début des combats (${Math.round(k * 100)} % de chances)`) },
  quartz:  { slot: 'armure', eff: k => `+${Math.round(8 * k)} PV max` },
  saphir:  { slot: 'armure', eff: k => `Fenêtre de parade +${Math.round(20 * k)} %` },
};
// meule : aiguiser les lames et outils tranchants, polir le reste
G.HONE_VERB = kind => (['sword', 'dagger', 'arrows', 'sickle', 'pick'].includes(kind) ? 'Aiguiser' : 'Polir');

/* ---------- Renommée ---------- */
G.REP = [
  { at: 0,  name: 'Apprenti',             perk: '' },
  { at: 6,  name: 'Forgeron du village',  perk: 'Odile te fait −15 % sur ses prix.' },
  { at: 16, name: 'Artisan reconnu',      perk: '+10 endurance dans la mine.' },
  { at: 28, name: 'Maître de forge',      perk: 'Les commandes rapportent +25 % d’or.' },
  { at: 40, name: 'Légende de Combefroide', perk: 'Les villageois t’offrent parfois une potion ou une ration avec une commande.' },
];

/* ---------- Commandes du tableau (quêtes secondaires) ---------- */
// item, nombre, qualité min, chapitre min, prix de base (or), renommée, phrase
G.REQUESTS = [
  { npc: 'bertille', item: 'faucille', n: 1, ch: 1, gold: 22, rep: 1, txt: 'Ma vieille faucille est partie en poussière orange. Il m’en faut une avant la moisson.' },
  { npc: 'bertille', item: 'faucille', n: 2, minQ: 65, ch: 2, gold: 50, rep: 2, txt: 'Mes deux valets veulent chacun la leur. Des belles, hein, pas des cuillères tordues.' },
  { npc: 'bertille', item: 'fer_cheval', n: 2, ch: 2, gold: 40, rep: 1, txt: 'La jument boite encore. Deux fers, s’il te plaît.' },
  { npc: 'sven', item: 'pointes', n: 1, ch: 1, gold: 20, rep: 1, txt: 'La garde manque de flèches. Forge-moi des pointes.' },
  { npc: 'sven', item: 'pointes', n: 2, minQ: 65, ch: 2, gold: 46, rep: 2, txt: 'Des pointes bien trempées : les loups ont la peau dure cet hiver.' },
  { npc: 'sven', item: 'masse_fer', n: 1, minQ: 65, ch: 2, gold: 70, rep: 2, txt: 'Le capitaine veut une masse de fer. Une bonne, il est difficile.' },
  { npc: 'sven', item: 'epee_acier', n: 1, minQ: 65, ch: 3, gold: 120, rep: 3, txt: 'Mon épée ne tient plus. Fais-moi de l’acier, et du bon.' },
  { npc: 'ida', item: 'cuir', n: 4, ch: 1, gold: 26, rep: 1, txt: 'La tannerie tourne à vide. Ramène-moi du cuir.', raw: true },
  { npc: 'ida', item: 'croc', n: 3, ch: 1, gold: 22, rep: 1, txt: 'Des crocs de loup, pour des colliers porte-bonheur. Ça se vend bien.', raw: true },
  { npc: 'ida', item: 'chaudron', n: 1, ch: 2, gold: 45, rep: 2, txt: 'Mon chaudron de teinture est rongé par la Rouille. Il m’en faut un neuf.' },
  { npc: 'ida', item: 'plume', n: 3, ch: 4, gold: 50, rep: 2, txt: 'Des plumes de harpie ! On dit qu’elles coupent comme des rasoirs.', raw: true },
  { npc: 'ida', item: 'ecaille', n: 2, ch: 4, gold: 60, rep: 2, txt: 'Des écailles de wyverneau pour un gilet. Je paie bien.', raw: true },
  { npc: 'odile', item: 'lingot_bronze', n: 3, ch: 1, gold: 28, rep: 1, txt: 'Un marchand de la vallée cherche du bronze. Je te le rachète.', raw: true },
  { npc: 'odile', item: 'serrure', n: 1, ch: 2, gold: 40, rep: 1, txt: 'Depuis la Rouille, tout le monde veut des serrures. Moi la première.' },
  { npc: 'odile', item: 'lingot_fer', n: 3, ch: 2, gold: 42, rep: 1, txt: 'Trois lingots de fer pour un client pressé.', raw: true },
  { npc: 'odile', item: 'quartz', n: 2, ch: 1, gold: 36, rep: 1, txt: 'Du quartz bien clair, pour un bijoutier.', raw: true },
  { npc: 'odile', item: 'rubis', n: 1, ch: 2, gold: 55, rep: 2, txt: 'Un rubis ! Une dame de la ville en rêve.', raw: true },
  { npc: 'odile', item: 'chaudron', n: 1, minQ: 85, ch: 3, gold: 90, rep: 3, txt: 'Un chaudron digne d’une auberge de la capitale. Excellent, pas moins.' },
  { npc: 'aldric', item: 'bougeoir', n: 2, ch: 3, gold: 70, rep: 2, txt: 'Deux bougeoirs d’argent pour l’autel. La lumière tient la Rouille à distance.' },
  { npc: 'aldric', item: 'os', n: 4, ch: 1, gold: 18, rep: 1, txt: 'Je dois reconsolider le vieil ossuaire… Ne pose pas de questions.', raw: true },
  { npc: 'aldric', item: 'noyau_rouille', n: 2, ch: 3, gold: 60, rep: 2, txt: 'Apporte-moi des noyaux de Rouille. Je veux comprendre ce mal.', raw: true },
  { npc: 'aldric', item: 'lingot_argent', n: 2, ch: 3, gold: 60, rep: 2, txt: 'De l’argent pur, pour bénir le puits du village.', raw: true },
  { npc: 'sven', item: 'cotte_fer', n: 1, minQ: 85, ch: 3, gold: 140, rep: 3, txt: 'Le nouveau garde n’a pas d’armure. Fais-lui une cotte excellente, il est jeune.' },
  { npc: 'bertille', item: 'serrure', n: 2, minQ: 65, ch: 3, gold: 85, rep: 2, txt: 'Quelqu’un vole mes poules. Deux serrures solides, pour la grange et le poulailler.' },
  // fin de partie : Maître Hogar commande des pièces d'exception
  { npc: 'hogar', item: 'epee_argent', n: 1, minQ: 95, ch: 5, end: true, gold: 420, rep: 3, txt: 'Le capitaine de la vallée veut une épée d’argent. Je lui ai dit que mon apprenti faisait mieux que moi. Ne me fais pas mentir : un chef-d’œuvre.' },
  { npc: 'hogar', item: 'armure_argent', n: 1, minQ: 85, ch: 5, end: true, gold: 380, rep: 3, txt: 'Une armure d’argent pour la garde du col. Excellente, au moins : je vérifierai chaque rivet.' },
  { npc: 'hogar', item: 'masse_acier', n: 1, minQ: 95, ch: 5, end: true, gold: 300, rep: 2, txt: 'Une masse d’acier parfaite. C’est pour moi, pour la regarder au coin du feu. Ne pose pas de questions.' },
  { npc: 'hogar', item: 'plastron_acier', n: 1, minQ: 95, ch: 5, end: true, gold: 320, rep: 2, txt: 'Un plastron d’acier sans un seul défaut. Le fils du meunier part à la ville, il ne partira pas mal protégé.' },
  { npc: 'hogar', item: 'clochette', n: 1, minQ: 95, ch: 5, end: true, gold: 260, rep: 2, txt: 'Une clochette d’argent, un chef-d’œuvre, pour la salle du trône sous la montagne. Même un roi fou mérite qu’on sonne pour lui.' },
  { npc: 'hogar', item: 'lame_aube', n: 1, minQ: 85, ch: 5, end: true, gold: 900, rep: 4, txt: 'Le temple de la capitale réclame une Lame d’Aube. Une seule au monde, ça ne leur suffit plus, paraît-il. Il te faudra une nouvelle écaille de la Wyverne.' },
];

/* ---------- Aide des mini-jeux ---------- */
G.HOWTO = {
  hone: { title: 'La meule', steps: [
    'Les chefs-d’œuvre ne passent pas à la meule. Utilise le filtre pour ne reprendre qu’une qualité précise.',
    'Pose le doigt sur la pièce et fais-la glisser vers la droite, sur la meule, d’un seul geste.',
    'Garde la <b>bonne vitesse</b> (aiguille dans la bande dorée). Trop lent : le métal chauffe et bleuit. Trop vite : le fil est inégal.',
    '4 passes. Une reprise réussie fait monter la qualité de la pièce (jusqu’à +15). Ratée, elle peut la faire un peu baisser (−5 au pire).',
    'Une pièce ne passe qu’<b>une seule fois</b> à la meule. Ses gemmes restent en place.',
  ] },
  gemset: { title: 'Le sertissage', steps: [
    'La gemme tremble au-dessus de la chasse. Garde-la au centre en faisant glisser ton doigt.',
    'Puis <b>fige-la d’un coup de marteau</b> : touche quand la force est dans la zone dorée. Trop doux, la griffe tient mal ; trop fort, la gemme s’ébrèche.',
    'La tenue (pose et frappe) fixe la force de l’effet.',
    'Rubis et cristal astral se sertissent sur les armes, quartz et saphir sur les armures. Chaque gemme augmente aussi la valeur de la pièce.',
    'Excellent : 1 chasse. Chef-d’œuvre : 2 chasses. Une gemme sertie ne se perd jamais.',
  ] },
  shop: { title: 'Ton échoppe', steps: [
    'Ton étal présente toutes tes pièces forgées que tu ne portes pas. Forge en avance pour avoir de quoi vendre.',
    'Chaque client demande un objet, avec parfois une qualité minimale. Choisis une pièce de ton étal, ou dis-lui que tu n’as pas ça.',
    '<b>Marchandage</b> : le curseur parcourt les prix. Touche pour annoncer ton prix. Dans la zone rouge, c’est trop cher : le client refuse, et sa patience baisse.',
    'Juste sous la limite, dans la <b>bande dorée</b> : le meilleur prix, et ta boutique gagne en réputation. Plus d’étoiles, plus de clients riches.',
    'La limite exacte du client se devine mal : la zone qui rougit en dégradé peut déjà être trop chère. Le curseur accélère vers les prix hauts, et chaque refus le rend plus rapide.',
  ] },
  smelt: { title: 'La fonderie', steps: [
    'Appuie sur <b>Soufflet</b> pour chauffer le creuset. La chaleur monte avec un temps de retard : anticipe.',
    'Garde l’aiguille dans la <b>bande dorée</b>, qui bouge pendant la coulée.',
    'Trop chaud = scories (la pureté baisse vite). Trop froid = rien ne fond.',
    '<b>80 % de pureté</b> ou plus : tu gagnes 50 % de lingots en plus. Sous 45 %, la moitié est perdue.',
  ] },
  forge: { title: 'L’enclume', steps: [
    '<b>Forgeage</b> : touche chaque cercle au moment où l’anneau orange se referme dessus.',
    'Les frappes arrivent par <b>séries</b> séparées de courtes pauses.',
    'Le métal refroidit. Sous la ligne bleue de la jauge, il est <b>trop froid</b> : tes frappes comptent moins.',
    'Touche <b>Réchauffer</b> pendant une pause : la pièce retourne au feu un instant. Les cercles qui arrivent pendant ce temps sont ratés.',
    '<b>Trempe</b> : plonge la pièce quand sa couleur correspond à la cible. Qualité finale = 70 % forgeage + 30 % trempe.',
  ] },
  mine: { title: 'La mine', steps: [
    'Touche à côté du mineur (gauche, droite, haut, bas) : il creuse la case puis s’y avance tout seul. Garde le doigt appuyé pour creuser en continu.',
    'Chaque coup de pioche coûte <b>1 endurance</b>. Les roches sombres sont plus dures : plusieurs coups. Une meilleure pioche creuse plus vite et plus profond.',
    '<b>Rochers ronds</b> : ils tombent si tu creuses dessous, et tu te retrouves juste en dessous ! Un « ! » = il va tomber : écarte-toi vite.',
    '<b>Roche à bulles vertes</b> : poche de gaz. La casser libère un nuage toxique en plein sur toi, qui vide ton endurance. Recule vite de 2 cases et attends qu’il se dissipe.',
    '<b>Coffres</b> : caches d’anciens mineurs, et les carnets de Hogar tout au fond.',
    'Remonte avant d’être épuisé : un évanouissement fait perdre <b>la moitié du butin</b>.',
  ] },
  combat: { title: 'La chasse', steps: [
    'L’<b>intention</b> de l’ennemi est affichée : tu sais toujours ce qu’il va faire.',
    '<b>Attaquer</b> : touche l’écran quand le curseur passe dans la zone. Zone claire = coup parfait (critique).',
    'Quand l’ennemi frappe, un anneau se referme sur ton bouclier. Touche quand il traverse la <b>bande dorée</b> : parade parfaite = aucun dégât + 1 élan. Dans le halo orange autour : dégâts réduits.',
    '<b>Parade</b> (action) : te met en garde, réduit les dégâts et riposte sur une parade parfaite. Idéal avant une attaque lourde.',
    '<b>Élan</b> : 2 losanges = un <b>coup puissant</b> qui brise les carapaces.',
    'Les <b>contondants</b> (masses) brisent deux fois mieux les carapaces. Contre la Rouille, prends une arme d’<b>argent</b>.',
  ] },
};
