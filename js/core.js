/* La Dernière Forge — noyau : état, sauvegarde, utilitaires, sons, icônes, interface commune */
(function () {
  const SAVE_KEY = 'derniere-forge-save-v1';

  /* ---------- utilitaires ---------- */
  G.$ = (s, r) => (r || document).querySelector(s);
  G.$$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  G.rand = (a, b) => a + Math.random() * (b - a);
  G.randi = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
  G.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  G.lerp = (a, b, t) => a + (b - a) * t;
  G.pick = arr => arr[Math.floor(Math.random() * arr.length)];
  G.wpick = list => { // [[val, weight], ...]
    let t = 0; for (const e of list) t += e[1];
    let r = Math.random() * t;
    for (const e of list) { r -= e[1]; if (r <= 0) return e; }
    return list[list.length - 1];
  };
  G.esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  // {nom} → nom du joueur ; en français, espace fine insécable avant ; : ! ? » et après « (pas de ponctuation seule en début de ligne)
  G.fmt = s => {
    let t = String(s).replace(/\{nom\}/g, G.esc(G.state ? G.state.name : G.L('Apprenti', 'Apprentice')));
    if (G.lang !== 'en') t = t.replace(/ ([;:!?»])/g, '\u202F$1').replace(/« /g, '«\u202F');
    return t;
  };
  G.sleep = ms => new Promise(r => setTimeout(r, ms));
  G.vibrate = p => { try { if (G.state.settings.vibe && navigator.vibrate) navigator.vibrate(p); } catch (e) {} };

  /* ---------- état ---------- */
  G.newState = function (name) {
    return {
      v: 3, name: name || 'Brenn', gold: 30, ch: 0, introSeen: -1, goals: {}, ended: false,
      inv: { charbon: 4, bois: 2, potion: 1 },
      gear: [
        { uid: 1, id: 'dague_rouillee', q: 50 },
        { uid: 2, id: 'tablier', q: 50 },
        { uid: 3, id: 'pioche_vieille', q: 50 },
      ],
      eq: { arme: 1, armure: 2, pioche: 3, lanterne: 0 },
      uidN: 4, crafted: {}, boss: {},
      best: { depth: {} },
      settings: { sfx: true, music: true, vibe: true, musicVol: 0.55, sfxVol: 0.8 },
      tuto: {},
      board: [], rep: 0, done: 0, arcs: {}, perks: {},
    };
  };

  G.save = function () {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(G.state)); } catch (e) {}
  };
  G.load = function () {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      const s = JSON.parse(raw);
      const base = G.newState(s.name);
      // fusion douce pour les vieilles sauvegardes
      for (const k in base) if (s[k] === undefined) s[k] = base[k];
      s.settings = Object.assign(base.settings, s.settings || {});
      G.migrate(s);
      return s;
    } catch (e) { return null; }
  };
  // anciennes sauvegardes : les objets de commande deviennent des pièces forgées avec une qualité
  G.migrate = function (s) {
    ['fer_cheval', 'clochette'].forEach(id => {
      const n = s.inv[id] || 0;
      for (let i = 0; i < n; i++) s.gear.push({ uid: s.uidN++, id, q: 60 });
      delete s.inv[id];
    });
    // v3 : paliers de renommée relevés (0/6/16/28/40 au lieu de 0/4/10/18/28) : on convertit la renommée pour garder le même palier et la même avancée
    if ((s.v || 1) < 3 && s.rep) {
      const A = [0, 4, 10, 18, 28], B = [0, 6, 16, 28, 40];
      let i = 0; while (i < 3 && s.rep >= A[i + 1]) i++;
      s.rep = Math.round(B[i] + (s.rep - A[i]) * (B[i + 1] - B[i]) / (A[i + 1] - A[i]));
    }
    s.v = Math.max(s.v || 1, 3);
  };
  G.hasSave = function () { try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; } };
  G.wipe = function () { try { localStorage.removeItem(SAVE_KEY); } catch (e) {} };

  /* ---------- inventaire ---------- */
  G.count = id => G.state.inv[id] || 0;
  G.add = function (id, n) {
    n = n === undefined ? 1 : n;
    if (G.GEAR[id]) { for (let i = 0; i < n; i++) G.addGear(id, 50); return; }
    G.state.inv[id] = (G.state.inv[id] || 0) + n;
    if (G.state.inv[id] <= 0) delete G.state.inv[id];
  };
  G.addGear = function (id, q) {
    const g = { uid: G.state.uidN++, id, q: Math.round(q) };
    G.state.gear.push(g);
    return g;
  };
  G.can = function (req, mult) {
    mult = mult || 1;
    for (const k in req) if (G.count(k) < req[k] * mult) return false;
    return true;
  };
  G.pay = function (req, mult) {
    mult = mult || 1;
    for (const k in req) G.add(k, -req[k] * mult);
  };
  G.maxAfford = function (req) {
    let m = 99;
    for (const k in req) m = Math.min(m, Math.floor(G.count(k) / req[k]));
    return m;
  };
  G.itemName = id => (G.ITEMS[id] || G.GEAR[id] || { name: id }).name;
  G.itemDef = id => G.ITEMS[id] || G.GEAR[id];

  /* ---------- qualité & stats ---------- */
  G.qual = function (q) {
    let r = G.QUALITY[0];
    for (const t of G.QUALITY) if (q >= t.min) r = t;
    return r;
  };
  G.gearByUid = uid => G.state.gear.find(g => g.uid === uid);
  G.equipped = slot => G.gearByUid(G.state.eq[slot]);
  G.gearStats = function (g) {
    const d = G.GEAR[g.id], m = G.qual(g.q).mult, o = {};
    if (d.atk !== undefined) o.atk = Math.round(d.atk * m);
    if (d.def !== undefined) o.def = Math.round(d.def * m);
    if (d.hp !== undefined) o.hp = Math.round(d.hp * m);
    if (d.power !== undefined) { o.power = d.power; o.energy = Math.round((m - 1) * 40); }
    if (d.light !== undefined) o.light = d.light;
    if (d.slot === 'commande') o.cmd = true;
    return o;
  };
  // renommée : index du palier atteint (0 = apprenti)
  G.repLevel = function () {
    let l = 0;
    G.REP.forEach((r, i) => { if ((G.state.rep || 0) >= r.at) l = i; });
    return l;
  };
  // avantages permanents (fin des histoires des villageois)
  G.hasPerk = k => !!(G.state && G.state.perks && G.state.perks[k]);
  G.sellPrice = id => Math.round(((G.ITEMS[id] || {}).sell || 0) * (G.hasPerk('commerce') ? 1.25 : 1));
  G.gemDots = g => (g && g.gems && g.gems.length ? `<span class="gem-dots">${g.gems.map(x => `<span class="gem-dot" title="${G.ITEMS[x.id].name}">${G.icon(x.id, 18)}</span>`).join('')}</span>` : '');
  G.sockets = g => Math.max(G.SOCKETS(g.q), (g.gems || []).length);
  G.player = function () {
    const w = G.equipped('arme'), a = G.equipped('armure'), p = G.equipped('pioche'), l = G.equipped('lanterne');
    const ws = G.gearStats(w), as = G.gearStats(a), ps = G.gearStats(p);
    const wd = G.GEAR[w.id], ad = G.GEAR[a.id];
    // gemmes serties sur l'arme et l'armure portées
    const gem = { rubis: 0, cristal: 0, quartz: 0, saphir: 0 };
    [w, a].forEach(g => (g.gems || []).forEach(x => { if (gem[x.id] !== undefined && G.GEMS[x.id].slot === G.GEAR[g.id].slot) gem[x.id] += x.k; }));
    return {
      atk: ws.atk, wtype: wd.type, silver: !!wd.silver, weapon: wd.name, wkind: wd.kind,
      def: as.def + (G.hasPerk('garde') ? 1 : 0), hpMax: 30 + as.hp + Math.round(8 * gem.quartz), rustproof: !!ad.rustproof,
      perfMult: 1 + 0.15 * gem.rubis, parryMult: 1 + 0.2 * gem.saphir, gemElan: gem.cristal,
      power: ps.power, energy: G.MINE_BASE_ENERGY + ps.energy + (G.repLevel() >= 2 ? 10 : 0) + (G.hasPerk('pain') ? 10 : 0), light: 2 + (l ? 1 : 0),
    };
  };

  /* ---------- assets (images Gemini, musiques) ---------- */
  // G.AVAILABLE est généré au build (js/assets.js) : on ne charge que ce qui existe.
  G.ASSETS = {};
  G.assetList = function () {
    if (G.AVAILABLE) return G.AVAILABLE.filter(p => p.indexOf('img/') === 0);
    const l = [];
    ['titre', 'forge', 'village', 'mine', 'foret', 'marais', 'pic', 'coeur'].forEach(k => l.push('img/decors/' + k + '.webp'));
    Object.keys(G.ENEMIES).forEach(k => l.push('img/monstres/' + k + '.webp'));
    Object.keys(G.NPCS).forEach(k => { if (k !== 'recit' && k !== 'moi') l.push('img/portraits/' + k + '.webp'); });
    return l;
  };
  G.loadAssets = function () {
    G.assetList().forEach(p => {
      const im = new Image();
      im.decoding = 'async';
      im.onload = () => { G.ASSETS[p] = im; if (G.onAsset) G.onAsset(p); };
      im.src = 'assets/' + p;
    });
  };
  G.img = p => (G.ASSETS[p] ? 'assets/' + p : null);
  G.imgEl = p => G.ASSETS[p] || null;
  G.hasMusic = t => !G.AVAILABLE || G.AVAILABLE.indexOf('musique/' + t + '.mp3') >= 0;

  // portrait de monstre adouci (bords fondus) pour se fondre dans la scène, mis en cache
  const softCache = {};
  G.softImg = function (p) {
    if (softCache[p]) return softCache[p];
    const im = G.imgEl(p);
    if (!im) return null;
    const S = 320, c = document.createElement('canvas');
    c.width = c.height = S;
    const x = c.getContext('2d');
    x.drawImage(im, 0, 0, S, S);
    x.globalCompositeOperation = 'destination-in';
    const g = x.createRadialGradient(S / 2, S * 0.48, S * 0.28, S / 2, S * 0.5, S * 0.52);
    g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g; x.fillRect(0, 0, S, S);
    softCache[p] = c;
    return c;
  };

  /* ---------- son ---------- */
  let AC = null, master = null, noiseBuf = null;
  G.audioInit = function () {
    if (AC) { if (AC.state === 'suspended') AC.resume(); return; }
    try {
      AC = new (window.AudioContext || window.webkitAudioContext)();
      master = AC.createGain(); master.connect(AC.destination); G.sfxVolume();
      noiseBuf = AC.createBuffer(1, AC.sampleRate * 1.5, AC.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    } catch (e) { AC = null; }
    G.musicUnlock();
  };
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) G.musicPause(true);
    else { if (AC && AC.state === 'suspended') AC.resume(); G.musicPause(false); }
  });
  function env(g, t, a, peak, dec) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + dec);
  }
  function tone(freq, type, peak, dec, delay, slide) {
    const t = AC.currentTime + (delay || 0);
    const o = AC.createOscillator(), g = AC.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dec);
    env(g, t, 0.004, peak, dec);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + dec + 0.05);
  }
  function noise(peak, dec, ftype, freq, q, delay) {
    const t = AC.currentTime + (delay || 0);
    const s = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain();
    s.buffer = noiseBuf; f.type = ftype || 'lowpass'; f.frequency.value = freq || 1000; f.Q.value = q || 1;
    env(g, t, 0.005, peak, dec);
    s.connect(f); f.connect(g); g.connect(master); s.start(t); s.stop(t + dec + 0.05);
  }
  const SFX = {
    clang(p) { // p: 0 raté, 1 bon, 2 parfait
      const base = p === 2 ? 820 : p === 1 ? 700 : 520;
      [1, 2.76, 5.4, 8.93].forEach((r, i) => tone(base * r, 'sine', 0.22 / (i + 1), p === 2 ? 0.9 : 0.45));
      noise(0.35, 0.06, 'highpass', 2500);
    },
    dull() { noise(0.4, 0.12, 'lowpass', 600); tone(120, 'triangle', 0.25, 0.15); },
    bellows() { noise(0.28, 0.32, 'bandpass', 420, 0.8); },
    roar() { noise(0.25, 0.6, 'lowpass', 300); },
    sizzle() { noise(0.35, 1.4, 'highpass', 3200); noise(0.2, 0.5, 'bandpass', 900, 2); },
    dig() { noise(0.35, 0.09, 'lowpass', 900); tone(160, 'triangle', 0.15, 0.08); },
    break() { noise(0.45, 0.25, 'lowpass', 500); tone(90, 'triangle', 0.2, 0.2); },
    ore() { tone(988, 'triangle', 0.18, 0.12); tone(1319, 'triangle', 0.16, 0.2, 0.07); },
    gem() { [1319, 1568, 1976, 2637].forEach((f, i) => tone(f, 'sine', 0.12, 0.3, i * 0.06)); },
    thud() { noise(0.6, 0.35, 'lowpass', 220); tone(60, 'sine', 0.5, 0.3, 0, 35); },
    gas() { noise(0.25, 0.9, 'bandpass', 1400, 0.6); },
    hit() { noise(0.4, 0.1, 'bandpass', 1800, 1.2); tone(200, 'square', 0.12, 0.08, 0, 90); },
    crit() { SFX.hit(); [1047, 1568].forEach((f, i) => tone(f, 'square', 0.08, 0.12, 0.03 + i * 0.05)); },
    parry() { [1200, 3100].forEach(f => tone(f, 'sine', 0.2, 0.35)); noise(0.3, 0.05, 'highpass', 4000); },
    hurt() { tone(300, 'sawtooth', 0.15, 0.25, 0, 90); noise(0.25, 0.12, 'lowpass', 800); },
    heal() { [523, 659, 784].forEach((f, i) => tone(f, 'sine', 0.13, 0.25, i * 0.07)); },
    tick() { tone(1800, 'sine', 0.06, 0.03); },
    coin() { tone(1568, 'square', 0.06, 0.08); tone(2093, 'square', 0.06, 0.14, 0.06); },
    win() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 'triangle', 0.18, 0.35, i * 0.11)); },
    lose() { [392, 330, 262, 196].forEach((f, i) => tone(f, 'triangle', 0.18, 0.4, i * 0.15)); },
    page() { noise(0.12, 0.08, 'bandpass', 2500, 0.7); },
  };
  G.sfx = function (name, arg) {
    if (!AC || !G.state || !G.state.settings.sfx) return;
    try { SFX[name] && SFX[name](arg); } catch (e) {}
  };

  G.sfxVolume = function () { if (master && G.state) master.gain.value = 0.7 * (G.state.settings.sfxVol == null ? 0.8 : G.state.settings.sfxVol); };

  /* musique : deux lecteurs en alternance pour des fondus enchaînés et des boucles sans trou */
  const MUS = { cur: null, els: [], active: -1, ticker: null };
  G._MUS = MUS;
  function musVol() { return G.state && G.state.settings.music ? (G.state.settings.musicVol == null ? 0.55 : G.state.settings.musicVol) : 0; }
  function mkPlayer() {
    const el = new Audio();
    el.preload = 'auto';
    const p = { el, v: 0, tv: 0, rate: 1, gain: null, track: null };
    el.addEventListener('error', () => {
      // repli : certains hébergeurs servent mieux un blob qu'un fichier relatif
      if (p.blobTried || !p.track) return;
      p.blobTried = true;
      fetch('assets/musique/' + p.track + '.mp3').then(r => r.ok ? r.blob() : null).then(b => {
        if (!b) return;
        el.src = URL.createObjectURL(b);
        if (p.tv > 0) el.play().catch(() => {});
      }).catch(() => {});
    });
    return p;
  }
  function wire(p) {
    if (p.gain || !AC) return;
    try {
      const src = AC.createMediaElementSource(p.el);
      p.gain = AC.createGain(); p.gain.gain.value = 0;
      src.connect(p.gain); p.gain.connect(AC.destination);
    } catch (e) { p.gain = null; }
  }
  function apply(p) {
    const v = Math.max(0, Math.min(1, p.v * musVol()));
    if (p.gain) { p.gain.gain.value = v; p.el.volume = 1; }
    else p.el.volume = v;
  }
  function tick() {
    const dt = 0.05;
    let busy = false;
    MUS.els.forEach((p, i) => {
      if (p.v !== p.tv) {
        busy = true;
        p.v = p.tv > p.v ? Math.min(p.tv, p.v + dt / p.rate) : Math.max(p.tv, p.v - dt / p.rate);
        if (p.v === 0 && p.tv === 0) p.el.pause();
      }
      apply(p);
      // boucle : on relance la piste sur l'autre lecteur juste avant la fin
      if (i === MUS.active && p.track && !p.looping && p.el.duration && p.el.duration - p.el.currentTime < 2.3 && !p.el.paused) {
        p.looping = true;
        start(p.track, 2.0);
      }
      if (!p.el.paused) busy = true;
    });
    if (!busy) { clearInterval(MUS.ticker); MUS.ticker = null; }
  }
  function ensureTicker() { if (!MUS.ticker) MUS.ticker = setInterval(tick, 50); }
  function start(track, fade) {
    if (!MUS.els.length) MUS.els = [mkPlayer(), mkPlayer()];
    const prev = MUS.els[MUS.active];
    const ni = MUS.active === 0 ? 1 : 0, p = MUS.els[ni];
    MUS.active = ni;
    wire(p);
    if (p.track !== track || p.blobTried) { p.blobTried = false; p.el.src = 'assets/musique/' + track + '.mp3'; }
    p.track = track; p.looping = false;
    try { p.el.currentTime = 0; } catch (e) {}
    p.v = 0; p.tv = 1; p.rate = fade; apply(p);
    const pr = p.el.play(); if (pr && pr.catch) pr.catch(() => {});
    if (prev && prev !== p) { prev.tv = 0; prev.rate = fade; }
    ensureTicker();
  }
  G.music = function (track) {
    if (MUS.cur === track) return;
    MUS.cur = track;
    if (!track || !G.state || !G.state.settings.music || !G.hasMusic(track)) {
      MUS.els.forEach(p => { p.tv = 0; p.rate = 0.8; });
      ensureTicker();
      return;
    }
    start(track, 1.2);
  };
  G.musicRefresh = function () { const t = MUS.cur; MUS.cur = null; G.music(t); };
  G.musicVolume = function () { MUS.els.forEach(apply); };
  G.musicPause = function (on) {
    MUS.els.forEach((p, i) => {
      if (on) p.el.pause();
      else if (i === MUS.active && p.tv > 0) { const pr = p.el.play(); if (pr && pr.catch) pr.catch(() => {}); }
    });
  };
  // déverrouillage iOS : le premier geste prépare les deux lecteurs
  G.musicUnlock = function () {
    if (!MUS.els.length) MUS.els = [mkPlayer(), mkPlayer()];
    MUS.els.forEach(p => wire(p));
  };

  /* ---------- icônes SVG dessinées en code ---------- */
  function shade(hex, f) {
    const n = parseInt(hex.slice(1), 16);
    let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    if (f < 0) { r *= 1 + f; g *= 1 + f; b *= 1 + f; } else { r += (255 - r) * f; g += (255 - g) * f; b += (255 - b) * f; }
    return '#' + [r, g, b].map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
  }
  G.shade = shade;
  const ICONS = {
    ore: c => `<path d="M4 15 7 7l6-3 7 4 1 8-6 5-8-1z" fill="#4a423c" stroke="#24201d"/><path d="M8 10l3-1 1 3-3 1zM14 13l3 0 0 3-3 1zM9 16l2 0 0 2-2 0z" fill="${c}" stroke="${shade(c, -0.4)}" stroke-width=".6"/>`,
    ingot: c => `<path d="M3 16 6 9h12l3 7z" fill="${c}" stroke="${shade(c, -0.45)}"/><path d="M6 9h12l-1.5-2.5h-9z" fill="${shade(c, 0.35)}" stroke="${shade(c, -0.45)}"/><path d="M7 11h8" stroke="${shade(c, 0.5)}" stroke-width="1" opacity=".7"/>`,
    gem: c => `<path d="M7 5h10l4 5-9 11-9-11z" fill="${c}" stroke="${shade(c, -0.5)}"/><path d="M3 10h18M9 5l-2 5 5 11 5-11-2-5" fill="none" stroke="${shade(c, -0.25)}" stroke-width=".8"/><path d="M8 7l2 2" stroke="#fff" opacity=".8"/>`,
    coal: c => `<path d="M3 17l2-6 5-2 3 3-1 5-4 2z" fill="#26211e" stroke="#0d0b0a"/><path d="M11 12l4-5 5 2 1 6-4 4-5-2z" fill="#332c28" stroke="#0d0b0a"/><path d="M14 9l2 1M6 13l2-1" stroke="#776a60" stroke-width=".8"/>`,
    wood: c => `<rect x="3" y="8" width="16" height="9" rx="2" fill="${c}" stroke="${shade(c, -0.45)}"/><ellipse cx="19" cy="12.5" rx="3" ry="4.5" fill="${shade(c, 0.35)}" stroke="${shade(c, -0.45)}"/><ellipse cx="19" cy="12.5" rx="1.3" ry="2" fill="none" stroke="${shade(c, -0.2)}" stroke-width=".7"/><path d="M5 11h9M7 14h8" stroke="${shade(c, -0.25)}" stroke-width=".7"/>`,
    leather: c => `<path d="M6 4c2 1 4 1 6 0 2 1 4 1 6 0l-1 4 3 3-2 4 1 5c-3-1-5-1-7 0-2-1-4-1-7 0l1-5-2-4 3-3z" fill="${c}" stroke="${shade(c, -0.45)}"/><path d="M9 9c2 2 4 2 6 0" fill="none" stroke="${shade(c, 0.3)}" stroke-width=".8"/>`,
    bone: c => `<path d="M7 17l10-10" stroke="${c}" stroke-width="3.2" stroke-linecap="round"/><circle cx="6" cy="16" r="2" fill="${c}"/><circle cx="8" cy="18.5" r="2" fill="${c}"/><circle cx="16" cy="5.5" r="2" fill="${c}"/><circle cx="18.5" cy="8" r="2" fill="${c}"/><path d="M7 17l10-10" stroke="${shade(c, -0.3)}" stroke-width=".6" opacity=".6"/>`,
    fang: c => `<path d="M7 4c5 0 10 2 10 6-1 5-5 9-9 11 2-4 2-8 0-11z" fill="${c}" stroke="${shade(c, -0.45)}"/><path d="M10 7c3 1 4 3 4 5" fill="none" stroke="#fff" stroke-width=".8" opacity=".7"/>`,
    feather: c => `<path d="M18 3C9 5 6 12 6 19l2-1c1-6 5-11 10-15z" fill="${c}" stroke="${shade(c, -0.45)}"/><path d="M5 21 15 7" stroke="${shade(c, -0.5)}" stroke-width=".9"/>`,
    scale: c => `<path d="M12 3c5 3 7 8 6 13-2 3-4 4-6 5-2-1-4-2-6-5-1-5 1-10 6-13z" fill="${c}" stroke="${shade(c, -0.5)}"/><path d="M12 6v13M8 11c2 1 6 1 8 0" fill="none" stroke="${shade(c, 0.35)}" stroke-width=".8"/>`,
    core: c => `<circle cx="12" cy="12" r="7" fill="${c}" stroke="${shade(c, -0.5)}"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2" stroke="${shade(c, -0.3)}" stroke-width="2"/><circle cx="12" cy="12" r="2.5" fill="${shade(c, 0.4)}"/>`,
    potion: c => `<path d="M10 3h4v4l4 5c1 4-1 9-6 9s-7-5-6-9l4-5z" fill="#d8e3e8" fill-opacity=".25" stroke="#cfd8dc"/><path d="M7.3 13h9.4c.6 3-1.4 6.6-4.7 6.6s-5.3-3.6-4.7-6.6z" fill="${c}"/><rect x="9.5" y="2" width="5" height="2" rx=".6" fill="#8a5a3a"/>`,
    bomb: c => `<circle cx="11" cy="14" r="7" fill="${c}" stroke="#141110"/><path d="M14 8l3-3" stroke="#8a6a4a" stroke-width="1.6"/><path d="M17 5l1.5-1.5M18 6l2 0M16.5 3.5l0-1.5" stroke="#ffb03a" stroke-width="1.1"/><circle cx="8.5" cy="11.5" r="1.5" fill="#fff" opacity=".35"/>`,
    ration: c => `<path d="M4 13c0-4 4-6 8-6s8 2 8 6v3H4z" fill="${c}" stroke="${shade(c, -0.45)}"/><path d="M8 10l1 2M12 9v3M16 10l-1 2" stroke="${shade(c, -0.3)}"/><rect x="3" y="15" width="18" height="3" rx="1" fill="${shade(c, -0.2)}"/>`,
    note: c => `<path d="M6 3h9l4 4v14H6z" fill="${c}" stroke="${shade(c, -0.5)}"/><path d="M15 3v4h4" fill="none" stroke="${shade(c, -0.5)}"/><path d="M8.5 10h8M8.5 13h8M8.5 16h5" stroke="${shade(c, -0.45)}" stroke-width=".9"/>`,
    sword: c => `<path d="M17.5 3.5 20.5 3.5 20.5 6.5 10 17 7 14z" fill="${c}" stroke="${shade(c, -0.5)}"/><path d="M19.5 4.5 9 15" stroke="${shade(c, 0.5)}" stroke-width=".7"/><path d="M5 12l7 7" stroke="#6b4a2e" stroke-width="2.2" stroke-linecap="round"/><path d="M8 16l-4 4" stroke="#4a3020" stroke-width="2.6" stroke-linecap="round"/><circle cx="3.5" cy="20.5" r="1.4" fill="${c}"/>`,
    dagger: c => `<path d="M15 5l3-1-1 3-6 6-2-2z" fill="${c}" stroke="${shade(c, -0.5)}"/><path d="M7 10l7 7" stroke="#5a3a24" stroke-width="2" stroke-linecap="round"/><path d="M10 14l-4 4" stroke="#4a3020" stroke-width="2.4" stroke-linecap="round"/>`,
    mace: c => `<path d="M6 19 14 11" stroke="#6b4a2e" stroke-width="2.4" stroke-linecap="round"/><circle cx="16" cy="8" r="4.6" fill="${c}" stroke="${shade(c, -0.5)}"/><path d="M16 1.5v2M22.5 8h-2M16 14.5v-2M10.5 3l1.5 1.5M21 3l-1.5 1.5M21 13l-1.5-1.5" stroke="${shade(c, -0.3)}" stroke-width="1.8" stroke-linecap="round"/><circle cx="14.6" cy="6.6" r="1.2" fill="#fff" opacity=".45"/>`,
    pick: c => `<path d="M4 20 15 9" stroke="#6b4a2e" stroke-width="2.4" stroke-linecap="round"/><path d="M6 6c4-3 9-3 13 1l1-1c-5-5-11-5-15-1z" fill="${c}" stroke="${shade(c, -0.5)}"/><path d="M19 7c2 2 3 4 3 7l-1 0c0-3-1-5-3-6z" fill="${c}" stroke="${shade(c, -0.5)}"/>`,
    armor: c => `<path d="M6 4l3 1h6l3-1 3 4-2 3v9H5v-9L3 8z" fill="${c}" stroke="${shade(c, -0.5)}"/><path d="M9 5c1 2 5 2 6 0M12 8v11M8 13h8" fill="none" stroke="${shade(c, -0.3)}" stroke-width=".9"/><path d="M7 9v8" stroke="${shade(c, 0.4)}" stroke-width=".8"/>`,
    lantern: c => `<path d="M9 4h6M12 2v2" stroke="#7a6a5a" stroke-width="1.5"/><rect x="7" y="6" width="10" height="13" rx="2" fill="#2b2420" stroke="#7a6a5a"/><rect x="9" y="8" width="6" height="9" rx="1" fill="${c}"/><circle cx="12" cy="12.5" r="2" fill="#fff6c8"/><path d="M6 19h12" stroke="#7a6a5a" stroke-width="1.6"/>`,
    horseshoe: c => `<path d="M6 4c-2 5-2 11 2 14s7 1 9-2c2-4 2-8 1-12h-3c1 4 1 7 0 9-1 2-3 3-5 1-2-2-2-6 0-10z" fill="${c}" stroke="${shade(c, -0.5)}"/><circle cx="7.4" cy="9" r=".8" fill="#222"/><circle cx="16.6" cy="9" r=".8" fill="#222"/><circle cx="8.5" cy="13.5" r=".8" fill="#222"/><circle cx="15.4" cy="13.5" r=".8" fill="#222"/>`,
    bell: c => `<path d="M12 3c-4 0-6 3-6 7v4l-2 3h16l-2-3v-4c0-4-2-7-6-7z" fill="${c}" stroke="${shade(c, -0.5)}"/><circle cx="12" cy="19.5" r="1.8" fill="${shade(c, -0.3)}"/><path d="M9 7c-1 1-1 3-1 5" stroke="#fff" opacity=".7"/>`,
    sickle: c => `<path d="M14 3c5 1 7 6 5 10-1 3-5 5-9 4 4-1 7-3 7-7 0-3-1-5-3-7z" fill="${c}" stroke="${shade(c, -0.5)}"/><path d="M10 15l-6 6" stroke="#6b4a2e" stroke-width="2.6" stroke-linecap="round"/>`,
    arrows: c => `<path d="M4 20 16 8M8 21 19 10M3 16 14 5" stroke="#8a6a4a" stroke-width="1.3"/><path d="M16 8l1-4 3 3zM19 10l1-4 3 3zM14 5l1-4 3 3z" fill="${c}" stroke="${shade(c, -0.5)}" stroke-width=".7"/><path d="M4 20l-1 1M8 21l-1 1M3 16l-1 1" stroke="#d9cbb8" stroke-width="1.6"/>`,
    cauldron: c => `<path d="M4 9h16c0 6-3 10-8 10S4 15 4 9z" fill="${c}" stroke="${shade(c, -0.5)}"/><path d="M3 9h18" stroke="${shade(c, 0.3)}" stroke-width="2"/><path d="M7 19l-1 2M17 19l1 2" stroke="${shade(c, -0.4)}" stroke-width="1.6"/><path d="M8 7c1-2 2 0 3-2M13 7c1-2 2 0 3-2" fill="none" stroke="#cfd8dc" stroke-width=".8" opacity=".7"/>`,
    candle: c => `<path d="M6 20h12l-2-3H8z" fill="${c}" stroke="${shade(c, -0.5)}"/><rect x="11" y="9" width="2.2" height="8" fill="#efe6cf"/><path d="M12 4c1.6 1.6 1.6 3.4 0 4.6-1.6-1.2-1.6-3 0-4.6z" fill="#ffb03a"/><path d="M9 17v-2h6v2" fill="none" stroke="${shade(c, -0.3)}"/>`,
    lock: c => `<path d="M8 10V7a4 4 0 0 1 8 0v3" fill="none" stroke="${shade(c, -0.2)}" stroke-width="2"/><rect x="5" y="10" width="14" height="11" rx="2" fill="${c}" stroke="${shade(c, -0.5)}"/><circle cx="12" cy="14.5" r="1.6" fill="#221c18"/><path d="M12 15.5v2.5" stroke="#221c18" stroke-width="1.4"/>`,
  };
  // icônes peintes (assets/img/icones) ; repli sur le dessin vectoriel si l'image manque
  const ICON_ALIAS = { carnet_1: 'carnet', carnet_2: 'carnet', carnet_3: 'carnet' };
  G.iconSrc = function (id) {
    const k = ICON_ALIAS[id] || id;
    const p = 'img/icones/' + k + '.webp';
    return (!G.AVAILABLE || G.AVAILABLE.indexOf(p) >= 0) ? 'assets/' + p : null;
  };
  G.icon = function (id, size) {
    const src = G.iconSrc(id);
    if (src) return `<img class="ico" src="${src}" width="${size || 28}" height="${size || 28}" alt="" draggable="false">`;
    const d = G.itemDef(id) || { kind: 'note', color: '#888' };
    const f = ICONS[d.kind] || ICONS.note;
    return `<svg class="ico" viewBox="0 0 24 24" width="${size || 28}" height="${size || 28}" aria-hidden="true" stroke-width="1" stroke-linejoin="round">${f(d.color)}</svg>`;
  };

  /* ---------- interface commune ---------- */
  G.show = function (id) {
    if (G.fxs) G.fxs.length = 0;
    if (G.parts) G.parts.length = 0;
    if (G.floaters) G.floaters.length = 0;
    G.$$('.screen').forEach(s => { s.hidden = s.id !== id; });
    G.current = id;
  };

  let toastT = null;
  G.toast = function (html, kind) {
    const t = G.$('#toast');
    t.innerHTML = html; t.className = 'toast show ' + (kind || '');
    clearTimeout(toastT);
    toastT = setTimeout(() => { t.className = 'toast'; }, 2400);
  };

  /* ---------- clavier et lecteur d'écran dans les fenêtres ---------- */
  // élément qui avait le focus avant l'ouverture d'une fenêtre, pour le lui rendre à la fermeture
  function focusOrigin() {
    const a = document.activeElement;
    return a && a !== document.body && !a.closest('#modal, #dialog') ? a : null;
  }
  function restoreFocus(el) {
    // une autre fenêtre a pu s'ouvrir juste après (enchaînement) : elle garde le focus
    if (!G.$('#modal').hidden || !G.$('#dialog').hidden) return;
    if (el && el.isConnected && !el.disabled) el.focus({ preventScroll: true });
  }
  // Tab et Maj+Tab restent dans la fenêtre
  function trapTab(e, box) {
    if (e.key !== 'Tab') return;
    const f = G.$$('button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])', box).filter(x => !x.disabled && x.getClientRects().length);
    if (!f.length) { e.preventDefault(); return; }
    const first = f[0], last = f[f.length - 1], a = document.activeElement;
    if (e.shiftKey && (a === first || a === box)) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && a === last) { e.preventDefault(); first.focus(); }
  }
  // boutons de jeu qui réagissent au pointerdown (réactivité au toucher) : Entrée et Espace les actionnent aussi
  G.keyTap = function (el, fn) {
    if (!el) return;
    el.addEventListener('click', e => { if (e.detail === 0) fn(e); });   // detail 0 : clic venu du clavier
    el.addEventListener('keydown', e => { if (e.repeat && (e.key === 'Enter' || e.key === ' ')) e.preventDefault(); });   // Entrée maintenue : pas de rafale
  };
  // dernier mode de saisie : au clavier, le focus suit les boutons que le jeu remplace (combat)
  G.kbd = false;
  addEventListener('keydown', e => { if (['Tab', 'Enter', ' ', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) G.kbd = true; }, true);
  addEventListener('pointerdown', () => { G.kbd = false; }, true);
  G.kbdFocus = el => {
    const a = document.activeElement;
    if (el && G.kbd && (!a || a === document.body || !a.isConnected)) el.focus({ preventScroll: true });
  };

  // fenêtre modale : retourne une promesse résolue avec la valeur du bouton
  G.modal = function (opts) {
    return new Promise(res => {
      const m = G.$('#modal');
      const btns = (opts.buttons || [{ label: 'OK', value: true, primary: true }]).map((b, i) =>
        `<button class="btn ${b.primary ? 'primary' : ''} ${b.danger ? 'danger' : ''}" data-i="${i}" ${b.disabled ? 'disabled' : ''}>${b.label}</button>`).join('');
      const back = focusOrigin();
      m.innerHTML = `<div class="modal-card ${opts.cls || ''}" role="dialog" aria-modal="true" tabindex="-1"${opts.title ? ' aria-labelledby="modal-h"' : ''}>
        ${opts.title ? `<h2 id="modal-h">${opts.title}</h2>` : ''}<div class="modal-body">${opts.body || ''}</div>
        <div class="modal-btns">${btns}</div></div>`;
      m.hidden = false;
      if (opts.onOpen) opts.onOpen(m);
      const card = m.firstElementChild;
      card.addEventListener('keydown', e => trapTab(e, card));
      // le lecteur d'écran annonce le titre ; Tab mène aux boutons (sauf si onOpen a déjà placé le focus, ex. champ du nom)
      if (!card.contains(document.activeElement)) card.focus({ preventScroll: true });
      G.$$('.modal-btns .btn', m).forEach(b => b.addEventListener('click', () => {
        G.sfx('tick');
        const b2 = opts.buttons ? opts.buttons[+b.dataset.i] : { value: true };
        let v = b2.value;
        if (opts.collect) v = { value: v, data: opts.collect(m) };
        m.hidden = true; m.innerHTML = '';
        restoreFocus(back);
        res(v);
      }));
    });
  };

  // dialogues d'histoire : lignes [pnj, texte]
  G.story = function (lines, art) {
    return new Promise(res => {
      const d = G.$('#dialog');
      const artSrc = art ? G.img(art) : null;
      let i = 0;
      const draw = () => {
        const [who, txt] = lines[i];
        const npc = G.NPCS[who] || G.NPCS.recit;
        const name = who === 'moi' ? G.state.name : npc.name;
        const portrait = G.img(npc.pic || 'img/portraits/' + who + '.webp');
        d.className = 'dialog ' + (who === 'recit' ? 'narr' : '') + (artSrc ? ' has-art' : '');
        const pic = who !== 'recit' && portrait;
        d.innerHTML = `${artSrc ? `<div class="dlg-art"><img src="${artSrc}" alt=""></div>` : ''}<div class="dlg-card ${pic ? 'with-pic' : ''}" style="--c:${npc.color}">
          ${pic ? `<img class="dlg-pic" src="${portrait}" alt="">` : ''}
          <div class="dlg-main">
          ${who !== 'recit' ? `<div class="dlg-who">${pic ? '' : `<span class="dlg-face">${npc.emoji}</span>`}<b style="color:${npc.color}">${G.esc(name)}</b></div>` : ''}
          <p class="dlg-txt">${G.fmt(txt)}</p>
          <div class="dlg-next">${i < lines.length - 1 ? G.L('Toucher pour continuer', 'Tap to continue') : G.L('Toucher pour fermer', 'Tap to close')} <span class="dots">${i + 1}/${lines.length}</span></div></div></div>`;
      };
      const next = () => {
        G.sfx('page');
        i++;
        if (i >= lines.length) { d.hidden = true; d.onclick = d.onkeydown = null; restoreFocus(back); res(); return; }
        draw();
      };
      const back = focusOrigin();
      d.setAttribute('aria-label', G.L('Histoire', 'Story'));
      d.hidden = false; draw();
      d.focus({ preventScroll: true });
      d.onclick = next;
      // au clavier : Entrée ou Espace pour passer à la réplique suivante
      d.onkeydown = e => {
        if (e.key === 'Tab') { e.preventDefault(); return; }
        if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) { e.preventDefault(); next(); }
      };
    });
  };

  // aide des mini-jeux : affichée la première fois, puis via le bouton « ? »
  G.HOWTO = G.HOWTO || {};
  G.howto = function (key, force) {
    if (!force && G.state.tuto[key]) return Promise.resolve();
    const h = G.HOWTO[key];
    if (!h) return Promise.resolve();
    G.state.tuto[key] = true; G.save();
    G.paused = true;
    return G.modal({ title: h.title, cls: 'howto-card', body: `<ol class="howto">${h.steps.map(st => `<li>${st}</li>`).join('')}</ol>`, buttons: [{ label: force ? G.L('Reprendre', 'Resume') : G.L('Compris, on y va', "Got it, let's go"), value: true, primary: true }] })
      .then(v => { G.paused = false; return v; });
  };
  G.helpBtn = key => `<button class="help-btn" data-help="${key}" aria-label="${G.L('Aide', 'Help')}">?</button>`;
  // les mini-jeux se mettent en pause pendant l'aide
  G.paused = false;
  G.bindHelp = function (root, key) {
    const b = G.$('[data-help]', root);
    if (b) b.addEventListener('click', e => { e.stopPropagation(); G.howto(key, true); });
    if (b) b.addEventListener('pointerdown', e => e.stopPropagation());
  };

  // délégation de clics simple
  G.on = function (root, sel, fn) {
    root.addEventListener('click', e => {
      const t = e.target.closest(sel);
      if (t && root.contains(t)) fn(t, e);
    });
  };

  // canvas net sur écrans haute densité
  G.fitCanvas = function (cv) {
    const r = cv.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    cv.width = Math.max(1, Math.round(r.width * dpr));
    cv.height = Math.max(1, Math.round(r.height * dpr));
    const ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, w: r.width, h: r.height };
  };

  // boucle d'animation gérée (une seule active à la fois)
  let loopFn = null, lastT = 0, rafId = 0;
  // téléphone couché : l'écran « Tourne ton téléphone » couvre le jeu, le temps s'arrête (mêmes conditions que le CSS de #rot)
  // (à garder identique à la règle @media de #rot dans css/style.css)
  const lying = matchMedia('(orientation: landscape) and (max-height: 500px) and (pointer: coarse)');
  // la musique se tait aussi pendant ce temps
  lying.addEventListener('change', () => { if (!document.hidden && G.musicPause) G.musicPause(lying.matches); });
  G.loop = function (fn) {
    loopFn = fn; lastT = performance.now();
    cancelAnimationFrame(rafId);
    const step = t => {
      if (!loopFn) return;
      const dt = Math.min(0.05, (t - lastT) / 1000); lastT = t;
      loopFn(G.paused || lying.matches ? 0 : dt, t / 1000);
      rafId = requestAnimationFrame(step);
    };
    rafId = requestAnimationFrame(step);
  };
  G.stopLoop = function () { loopFn = null; cancelAnimationFrame(rafId); };

  // texte flottant ("Parfait !", "+2 Fer")
  G.floaters = [];
  G.float = function (x, y, txt, color, size) {
    G.floaters.push({ x, y, txt, color: color || '#ffd27a', size: size || 18, t: 0 });
  };
  // textes flottants : apparition en « pop », tenue, puis montée et fondu ; contour épais pour rester lisibles sur le décor
  G.drawFloaters = function (ctx, dt) {
    const D = 1.25;
    for (let i = G.floaters.length - 1; i >= 0; i--) {
      const f = G.floaters[i]; f.t += dt;
      if (f.t > D) { G.floaters.splice(i, 1); continue; }
      const k = f.t / D, pop = f.t < 0.14 ? 1 + 0.45 * (1 - f.t / 0.14) : 1;
      ctx.save();
      ctx.globalAlpha = k < 0.6 ? 1 : 1 - (k - 0.6) / 0.4;
      ctx.translate(f.x, f.y - Math.max(0, f.t - 0.25) * 34);
      ctx.scale(pop, pop);
      ctx.font = `800 ${f.size}px ${G.uiFont ? G.uiFont() : 'sans-serif'}`;
      ctx.textAlign = 'center'; ctx.lineJoin = 'round';
      ctx.lineWidth = Math.max(4, f.size * 0.28); ctx.strokeStyle = 'rgba(14,9,6,.88)';
      ctx.strokeText(f.txt, 0, 0);
      ctx.shadowColor = f.color; ctx.shadowBlur = 10;
      ctx.fillStyle = f.color; ctx.fillText(f.txt, 0, 0);
      ctx.restore();
    }
  };
  // plaque de statut : texte sur un cartouche sombre bordé de sa couleur, avec « pop » à chaque changement de texte
  const POP = {};
  G.pop = function (key, txt) {
    const p = POP[key] || (POP[key] = { txt: null, t: 0 }), now = performance.now();
    if (p.txt !== txt) { p.txt = txt; p.t = now; }
    const k = Math.min(1, (now - p.t) / 240);
    return 1 + 0.38 * (1 - k) * (1 - k);
  };
  G.plate = function (ctx, txt, x, y, o) {
    o = o || {};
    const size = o.size || 22, col = o.color || '#ffd27a';
    ctx.save();
    ctx.font = o.disp ? `600 ${size}px ${G.dispFont()}` : `800 ${size}px ${G.uiFont()}`;
    const tw = ctx.measureText(txt).width, ph = size * 1.6, pw = tw + size * 1.3;
    let sc = (o.scale || 1);
    if (o.maxW && pw * sc > o.maxW) sc = o.maxW / pw;
    ctx.translate(x, y); ctx.scale(sc, sc);
    if (o.alpha !== undefined) ctx.globalAlpha = o.alpha;
    ctx.shadowColor = 'rgba(0,0,0,.7)'; ctx.shadowBlur = 14;
    ctx.fillStyle = 'rgba(16,11,8,.86)';
    G.roundRect(ctx, -pw / 2, -ph / 2, pw, ph, ph / 2); ctx.fill();
    ctx.shadowColor = col; ctx.shadowBlur = o.glow ? 18 * o.glow : 0;
    ctx.lineWidth = 2.5; ctx.strokeStyle = col; ctx.stroke();
    ctx.shadowBlur = o.glow ? 12 * o.glow : 0;
    ctx.fillStyle = col; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(txt, 0, size * (o.disp ? 0.08 : 0.04));
    ctx.restore();
  };

  // particules simples (étincelles, éclats)
  G.parts = [];
  G.burst = function (x, y, n, color, spd, life, grav) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = (spd || 120) * (0.4 + Math.random());
      G.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - (spd || 120) * 0.4, life: (life || 0.6) * (0.6 + Math.random() * 0.6), t: 0, c: color || '#ffb347', g: grav === undefined ? 500 : grav });
    }
  };
  /* ---------- effets lumineux (planche fx sur fond noir, fusion additive) ---------- */
  G.fxs = [];
  // name, x, y, opts : size, life, rot, spin, grow (facteur final), alpha, vx, vy, fade ('out' | 'inout')
  G.fx = function (name, x, y, o) {
    o = o || {};
    G.fxs.push({ name, x, y, size: o.size || 80, life: o.life || 0.45, rot: o.rot || 0, spin: o.spin || 0, grow: o.grow == null ? 1.3 : o.grow,
      alpha: o.alpha == null ? 1 : o.alpha, vx: o.vx || 0, vy: o.vy || 0, fade: o.fade || 'out', t: 0, flip: !!o.flip });
  };
  G.drawFx = function (ctx, dt) {
    if (!G.fxs.length) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = G.fxs.length - 1; i >= 0; i--) {
      const f = G.fxs[i]; f.t += dt;
      if (f.t >= f.life) { G.fxs.splice(i, 1); continue; }
      const k = f.t / f.life;
      const im = G.imgEl('img/fx/' + f.name + '.webp');
      if (!im) continue;
      f.x += f.vx * dt; f.y += f.vy * dt;
      const a = f.fade === 'inout' ? Math.sin(k * Math.PI) : (k < 0.15 ? k / 0.15 : 1 - (k - 0.15) / 0.85);
      const sz = f.size * G.lerp(1, f.grow, k);
      ctx.save();
      ctx.globalAlpha = Math.max(0, a * f.alpha);
      ctx.translate(f.x, f.y); ctx.rotate(f.rot + f.spin * f.t); if (f.flip) ctx.scale(-1, 1);
      ctx.drawImage(im, -sz / 2, -sz / 2, sz, sz);
      ctx.restore();
    }
    ctx.restore();
  };
  // dessine un effet sans cycle de vie (flammes permanentes, aura…)
  G.drawFxNow = function (ctx, name, x, y, size, alpha, rot) {
    const im = G.imgEl('img/fx/' + name + '.webp');
    if (!im || alpha <= 0) return;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = Math.min(1, alpha);
    ctx.translate(x, y); if (rot) ctx.rotate(rot);
    ctx.drawImage(im, -size / 2, -size / 2, size, size);
    ctx.restore();
  };

  /* image « cover » : renvoie la transformation image -> canvas en alignant un point focal */
  G.coverMap = function (img, w, h, fx, fy, tx, ty) {
    const s = Math.max(w / img.width, h / img.height);
    const iw = img.width * s, ih = img.height * s;
    let ox = tx - fx * iw, oy = ty - fy * ih;
    ox = Math.min(0, Math.max(w - iw, ox)); oy = Math.min(0, Math.max(h - ih, oy));
    return { s, ox, oy, iw, ih, x: u => ox + u * iw, y: v => oy + v * ih };
  };
  G.drawCover = function (ctx, img, m) { ctx.drawImage(img, m.ox, m.oy, m.iw, m.ih); };

  /* recoloration d'une pièce grise selon une couleur de chaleur (mise en cache) */
  const tintCache = {};
  G.tinted = function (path, color, glow) {
    const im = G.imgEl(path);
    if (!im) return null;
    const key = path + color + '|' + glow.toFixed(2);
    if (tintCache[key]) return tintCache[key];
    const c = document.createElement('canvas'); c.width = im.width; c.height = im.height;
    const x = c.getContext('2d');
    x.drawImage(im, 0, 0);
    x.globalCompositeOperation = 'multiply'; x.fillStyle = color; x.fillRect(0, 0, c.width, c.height);
    x.globalCompositeOperation = 'lighter'; x.globalAlpha = glow; x.fillStyle = color; x.fillRect(0, 0, c.width, c.height);
    x.globalAlpha = 1; x.globalCompositeOperation = 'destination-in'; x.drawImage(im, 0, 0);
    const keys = Object.keys(tintCache); if (keys.length > 160) keys.slice(0, 80).forEach(k => delete tintCache[k]);
    tintCache[key] = c;
    return c;
  };

  G.drawParts = function (ctx, dt) {
    for (let i = G.parts.length - 1; i >= 0; i--) {
      const p = G.parts[i]; p.t += dt;
      if (p.t > p.life) { G.parts.splice(i, 1); continue; }
      p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      ctx.globalAlpha = 1 - p.t / p.life; ctx.fillStyle = p.c;
      ctx.fillRect(p.x - 1.5, p.y - 1.5, 3, 3);
    }
    ctx.globalAlpha = 1;
  };
})();
