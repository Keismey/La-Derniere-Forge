/* La Dernière Forge — Enclume : forgeage en rythme (par séries) puis trempe à la couleur */
(function () {
  const F = {};
  G.forge = F;
  const COLD = 35;          // sous ce seuil, le métal est trop froid
  const FIRE_TIME = 0.9;    // durée d'un passage au feu
  const FIRE_GAIN = 60;     // chaleur regagnée par passage

  const WARM = [[450, '#1c0f0a'], [600, '#4a120a'], [700, '#8a160c'], [780, '#c41e12'], [860, '#e8501a'], [950, '#f68a22'], [1050, '#fbc33c'], [1150, '#feea8a'], [1350, '#fffbe8']];
  const ASTRAL = [[600, '#0b1a24'], [800, '#0f3c55'], [900, '#13628a'], [1000, '#1aa3c4'], [1080, '#5fe3f0'], [1200, '#c8fbff'], [1500, '#ffffff']];
  function hex2rgb(h) { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
  function tempColor(T, hue) {
    const st = hue === 'astral' ? ASTRAL : WARM;
    if (T <= st[0][0]) return st[0][1];
    for (let i = 1; i < st.length; i++) {
      if (T <= st[i][0]) {
        const a = hex2rgb(st[i - 1][1]), b = hex2rgb(st[i][1]), t = (T - st[i - 1][0]) / (st[i][0] - st[i - 1][0]);
        return `rgb(${a.map((v, k) => Math.round(G.lerp(v, b[k], t))).join(',')})`;
      }
    }
    return st[st.length - 1][1];
  }
  function tempName(T, hue) {
    if (hue === 'astral') return T < 900 ? G.L('bleu nuit', 'midnight blue') : T < 1000 ? G.L('bleu', 'blue') : T < 1110 ? G.L('azur', 'azure') : G.L('blanc', 'white');
    return T < 620 ? G.L('brun', 'brown') : T < 740 ? G.L('rouge sombre', 'dark red') : T < 830 ? G.L('rouge cerise', 'cherry red') : T < 920 ? G.L('orange', 'orange') : T < 1080 ? G.L('jaune', 'yellow') : G.L('blanc', 'white');
  }
  F.tempColor = tempColor;
  const SHAPE = { sword: 'blade', dagger: 'blade', arrows: 'blade', mace: 'mace', pick: 'pick', sickle: 'pick', armor: 'armor', horseshoe: 'horseshoe' };
  // ébauche grise peinte selon le type d'objet, et sa largeur relative à la table de l'enclume
  const BLANK = {
    sword: ['blank_blade', 1.25], dagger: ['blank_dagger', 0.85], arrows: ['blank_arrows', 0.7], mace: ['blank_mace', 1.15],
    pick: ['blank_pick', 0.78], sickle: ['blank_sickle', 0.5], armor: ['blank_plate', 0.5], horseshoe: ['blank_horseshoe', 0.45],
    bell: ['blank_bell', 0.42], cauldron: ['blank_cauldron', 0.55], candle: ['blank_candle', 0.4], lock: ['blank_lock', 0.42], lantern: ['blank_lantern', 0.36],
  };
  // ébauches propres à un objet précis
  const BLANK_ITEM = { cotte_fer: ['blank_mail', 0.52] };
  F.blankOf = id => 'img/forge/' + (BLANK_ITEM[id] || BLANK[(G.itemDef(id) || {}).kind] || ['blank_bar'])[0] + '.webp';
  F.blankScale = id => (BLANK_ITEM[id] || BLANK[(G.itemDef(id) || {}).kind] || ['blank_bar', 0.7])[1];
  // points remarquables des décors (coordonnées relatives à l'image)
  const ANVIL = { x: 0.575, y: 0.565, faceW: 0.5 }, HEARTH = { x: 0.1, y: 0.4 }, WATER = { x: 0.495, y: 0.622, w: 0.5 };

  // points opaques d'une image (pour poser les cibles sur la pièce elle-même)
  const maskCache = {};
  function opaquePoints(path) {
    if (maskCache[path]) return maskCache[path];
    const im = G.imgEl(path);
    if (!im) return null;
    const c = document.createElement('canvas'); c.width = im.width; c.height = im.height;
    const x = c.getContext('2d'); x.drawImage(im, 0, 0);
    let data;
    try { data = x.getImageData(0, 0, c.width, c.height).data; } catch (e) { return null; }
    const pts = [], step = 6;
    for (let yy = 0; yy < c.height; yy += step) for (let xx = 0; xx < c.width; xx += step) {
      if (data[(yy * c.width + xx) * 4 + 3] > 200) pts.push({ u: xx / c.width, v: yy / c.height });
    }
    maskCache[path] = pts;
    return pts;
  }

  // séries de frappes : [taille de série...] selon la difficulté du métal
  function buildPattern(n, M, T) {
    const hard = M.ring < 0.9;
    const g = T * 0.62, pause = 1.75;
    const times = [];
    let t = 0, left = n, first = true;
    while (left > 0) {
      let size = Math.min(left, G.randi(hard ? 3 : 2, hard ? 4 : 3));
      if (left - size === 1) size = left;            // pas de série d'une seule frappe à la fin
      if (!first) t += pause;
      for (let i = 0; i < size; i++) {
        if (i > 0) t += (hard && i > 1 && Math.random() < 0.3) ? g * 0.55 : g;
        times.push(t);
      }
      left -= size; first = false;
    }
    return times;
  }

  F.start = function (id) {
    const r = G.RECIPES[id], M = G.METALS[r.metal], def = G.itemDef(id), kind = SHAPE[def.kind] || 'blob';
    const blank = BLANK_ITEM[id] || BLANK[def.kind] || ['blank_bar', 0.7];
    const blankPath = 'img/forge/' + blank[0] + '.webp';
    G.pay(r.in); G.save();
    const scr = G.$('#s-forge');
    scr.innerHTML = `
      <header class="mg-top"><div><span class="eyebrow">${G.L('Enclume', 'Anvil')} · ${M.label}</span><b>${G.itemName(id)}</b></div>
        <div class="mg-top-r"><ol class="steps"><li class="on" id="fs-1">${G.L('Forgeage', 'Forging')}</li><li id="fs-2">${G.L('Trempe', 'Quench')}</li></ol>${G.helpBtn('forge')}</div></header>
      <div class="mg-stage"><canvas id="fg-cv"></canvas><div class="mg-hint" id="fg-hint">${G.L('Touche chaque cercle quand l’anneau se referme dessus.', 'Tap each circle as the ring closes on it.')}</div></div>
      <div class="mg-bottom" id="fg-bottom">
        <div class="meter"><span>${G.L('Chaleur', 'Heat')}</span><div class="bar heat"><i id="fg-heat"></i><s class="cold-line" style="left:${COLD}%"></s></div><b id="fg-heatv">100</b></div>
        <div class="row2"><div class="score-pill" id="fg-score">0 / ${r.strikes}</div><button class="btn huge" id="fg-reheat">${G.L('Réchauffer', 'Reheat')}</button></div>
      </div>`;
    G.show('s-forge');
    G.music('forge');
    G.bindHelp(scr, 'forge');
    const cv = G.$('#fg-cv');
    let sz = G.fitCanvas(cv);
    const bgA = G.imgEl('img/decors/enclume.webp'), bgQ = G.imgEl('img/decors/trempe.webp');
    const blankImg = G.imgEl(blankPath), hammerImg = G.imgEl('img/forge/tool_hammer.webp'), tongsImg = G.imgEl('img/forge/tool_tongs.webp');

    const T = 1.15 * M.ring;            // durée d'approche d'un anneau
    const st = {
      phase: 'hammer', song: -1.8, heat: 100, fire: 0, targets: [], results: [], shake: 0, swing: null,
      quench: null, streak: 0, best: 0, coldHits: 0, qfade: 0,
    };
    G._dbg = st;
    let R, mapA, mapQ, pr;
    // pièce posée sur l'enclume : rectangle en coordonnées canvas
    function layout() {
      const { w, h } = sz;
      R = G.clamp(w * 0.085, 28, 38);
      if (bgA) {
        mapA = G.coverMap(bgA, w, h, ANVIL.x, ANVIL.y, w * 0.52, h * 0.6);
        const face = ANVIL.faceW * mapA.iw;
        const ax = mapA.x(ANVIL.x), ay = mapA.y(ANVIL.y);
        const pw = Math.min(w * 0.94, face * blank[1] * 1.15);
        const ph = blankImg ? pw * blankImg.height / blankImg.width : pw * 0.2;
        pr = { x: ax - pw / 2, y: ay - ph * (ph > pw * 0.5 ? 0.92 : 0.8), w: pw, h: ph };
      } else {
        const pw = Math.min(w * 0.8, 380), ph = blankImg ? pw * blankImg.height / blankImg.width : 40;
        pr = { x: w / 2 - pw / 2, y: h * 0.5 - ph / 2, w: pw, h: ph };
      }
      if (bgQ) mapQ = G.coverMap(bgQ, w, h, WATER.x, WATER.y, w * 0.5, h * 0.62);
    }
    layout();
    window.onresize = () => { if (G.current === 's-forge') { sz = G.fitCanvas(cv); layout(); } };

    // cibles posées sur des points opaques de l'ébauche, assez loin des précédentes
    const pts = opaquePoints(blankPath) || Array.from({ length: 60 }, () => ({ u: Math.random(), v: 0.5 }));
    const times = buildPattern(r.strikes, M, T);
    let prev = [];
    times.forEach((tHit, i) => {
      let pick = null, bestD = -1;
      for (let k = 0; k < 50; k++) {
        const c = G.pick(pts);
        // évite les bords extrêmes de la pièce
        if (c.u < 0.06 || c.u > 0.94) continue;
        const d = Math.min(...prev.map(p => Math.hypot((c.u - p.u) * pr.w, (c.v - p.v) * pr.h)), 999);
        if (d >= R * 2.3) { pick = c; break; }
        if (d > bestD) { bestD = d; pick = c; }
      }
      pick = pick || pts[0];
      st.targets.push({ i, u: pick.u, v: pick.v, tHit, judged: false, res: null, phraseStart: i === 0 || tHit - times[i - 1] > 1.2 });
      prev = [pick].concat(prev).slice(0, 2);
    });

    function tpos(t) { return { x: pr.x + t.u * pr.w, y: pr.y + t.v * pr.h }; }
    st.tpos = tpos;

    const reheatBtn = G.$('#fg-reheat');
    reheatBtn.addEventListener('pointerdown', e => {
      e.preventDefault();
      if (st.phase !== 'hammer' || st.fire > 0 || st.heat >= 99) return;
      st.fire = FIRE_TIME; G.sfx('bellows'); G.sfx('roar'); G.vibrate(10);
    });

    cv.addEventListener('pointerdown', e => {
      e.preventDefault();
      if (st.phase !== 'hammer' || G.paused) return;
      const rect = cv.getBoundingClientRect();
      hammerTap(e.clientX - rect.left, e.clientY - rect.top);
    });

    function hammerTap(px, py) {
      if (st.fire > 0) { G.float(px, py - 20, G.L('La pièce est au feu !', 'The piece is in the fire!'), '#ffb36a', 21); return; }
      let best = null, bd = 1e9;
      st.targets.forEach(t => {
        if (t.judged) return;
        const err = st.song - t.tHit;
        if (err < -0.32 || err > 0.22) return;
        const p = tpos(t), d = Math.hypot(px - p.x, py - p.y);
        if (d > R * 2.4) return;
        const score = Math.abs(err) * 400 + d;
        if (score < bd) { bd = score; best = t; }
      });
      if (!best) return;
      const err = Math.abs(st.song - best.tHit);
      judge(best, err < 0.08 ? 2 : err < 0.18 ? 1 : 0);
    }

    function judge(t, g, why) {
      t.judged = true;
      const cold = st.heat < COLD;
      let pts = [0, 70, 100][g];
      if (cold && g > 0) { pts = g === 2 ? 60 : 40; st.coldHits++; }
      t.res = g; st.results.push(pts);
      st.streak = g === 2 && !cold ? st.streak + 1 : 0;
      st.best = Math.max(st.best, st.streak);
      const p = tpos(t);
      if (g === 0) {
        G.sfx('dull'); G.vibrate(30);
        G.float(p.x, p.y - 34, why === 'fire' ? G.L('Raté (au feu)', 'Miss (in the fire)') : G.L('Raté', 'Miss'), '#ff8a6a', 22);
      } else {
        st.swing = { x: p.x, y: p.y, t: 0 };
        G.sfx('clang', cold ? 0 : g);
        G.burst(p.x, p.y, g === 2 ? 22 : 10, cold ? '#9a8a8a' : g === 2 ? '#ffe7a0' : '#ffb347', g === 2 ? 220 : 150, 0.5);
        G.fx(g === 2 && !cold ? 'crit' : 'spark', p.x, p.y, { size: R * (g === 2 ? 3.2 : 2.2), life: 0.3, rot: Math.random() * 6 });
        if (!cold) G.fx('impact', p.x, p.y, { size: R * 2.2, life: 0.22, alpha: 0.7 });
        if (cold) G.float(p.x, p.y - 34, G.L('Métal froid ! −40 %', 'Cold metal! −40%'), '#8ec5ff', 22);
        else G.float(p.x, p.y - 34, g === 2 ? (st.streak >= 3 ? G.L(`Parfait ×${st.streak}`, `Perfect ×${st.streak}`) : G.L('Parfait !', 'Perfect!')) : G.L('Bien', 'Good'), g === 2 ? '#ffe08a' : '#ffffff', g === 2 ? 26 : 22);
        st.shake = g === 2 ? 6 : 3;
        G.vibrate(g === 2 ? 20 : 12);
        st.heat = Math.max(0, st.heat - 2);
      }
      G.$('#fg-score').textContent = `${st.results.length} / ${r.strikes}`;
    }

    const hint = G.$('#fg-hint');
    let hintMode = '';
    function setHint(mode) {
      if (mode === hintMode) return;
      hintMode = mode;
      hint.className = 'mg-hint ' + (mode === 'cold' ? 'warn-cold' : mode === 'low' ? 'warn-low' : '');
      hint.textContent = mode === 'cold' ? G.L('Trop froid ! Touche Réchauffer.', 'Too cold! Tap Reheat.') : mode === 'low' ? G.L('Le métal refroidit : réchauffe pendant la prochaine pause.', 'The metal is cooling: reheat during the next pause.') : mode === 'fire' ? G.L('Au feu… les cercles qui arrivent maintenant sont perdus.', 'In the fire… circles arriving now are lost.') : G.L('Touche chaque cercle quand l’anneau se referme dessus.', 'Tap each circle as the ring closes on it.');
    }

    G.loop(dt => {
      const { ctx, w, h } = sz;
      if (st.phase === 'hammer') {
        st.song += dt;
        if (st.fire > 0) {
          const k = Math.min(dt, st.fire);
          st.fire -= dt; st.heat = Math.min(100, st.heat + FIRE_GAIN * k / FIRE_TIME);
        } else if (st.song > 0) st.heat = Math.max(0, st.heat - M.cool * dt * (G.hasPerk('tablier') ? 0.8 : 1));
        st.targets.forEach(t => { if (!t.judged && st.song > t.tHit + 0.22) judge(t, 0, st.fire > 0 ? 'fire' : null); });
        if (st.targets.every(t => t.judged)) { st.phase = 'pause'; setTimeout(startQuench, 650); }
        G.$('#fg-heat').style.width = st.heat + '%';
        G.$('#fg-heat').className = st.heat < COLD ? 'cold' : st.heat < COLD + 15 ? 'mid' : '';
        G.$('#fg-heatv').textContent = Math.round(st.heat);
        const low = st.heat < COLD + 15 && st.fire <= 0;
        // toujours allumé ; plus vif quand le métal refroidit, pulsant quand c'est critique
        reheatBtn.classList.toggle('warm', !low);
        reheatBtn.classList.toggle('primary', low);
        reheatBtn.classList.toggle('pulse', st.heat < COLD && st.fire <= 0);
        reheatBtn.disabled = st.fire > 0;
        setHint(st.fire > 0 ? 'fire' : st.heat < COLD ? 'cold' : low ? 'low' : '');
      }
      if (st.phase === 'quench' && st.quench && st.quench.ready && !st.quench.done) {
        const q = st.quench;
        q.T -= q.v * dt * (0.85 + 0.3 * Math.sin(q.wob += dt * 3));
        const qc = G.$('#q-cur'), qn = G.$('#q-nowname');
        if (qc) { qc.style.left = qPct(q.T) + '%'; const e = Math.abs(q.T - M.target); qc.className = 'qt-cur' + (e <= M.tol / 4 ? ' perf' : e <= M.tol ? ' good' : ''); }
        if (qn) qn.textContent = Math.round(q.T) + ' °C';
        if (q.T < M.target - M.tol * 2.6) doQuench(true);
      }
      if (st.quench) st.qfade = Math.min(1, st.qfade + dt * 2.5);
      st.shake = Math.max(0, st.shake - dt * 30);
      ctx.save();
      if (st.shake) ctx.translate(G.rand(-st.shake, st.shake), G.rand(-st.shake, st.shake));
      draw(ctx, w, h, dt);
      ctx.restore();
      G.drawFx(ctx, dt);
      G.drawParts(ctx, dt);
      G.drawFloaters(ctx, dt);
    });

    // couleur et éclat de la pièce selon la température
    function pieceSprite(Tdeg, glow) {
      const col = tempColor(Tdeg, M.hue);
      return { img: G.tinted(blankPath, col, glow), col };
    }
    function drawPieceAt(ctx, x, y, wdt, hgt, Tdeg, glow, alpha) {
      const sp = pieceSprite(Tdeg, glow);
      ctx.save(); ctx.globalAlpha = alpha == null ? 1 : alpha;
      ctx.shadowColor = sp.col; ctx.shadowBlur = 8 + glow * 40;
      if (sp.img) ctx.drawImage(sp.img, x, y, wdt, hgt);
      else { ctx.fillStyle = sp.col; ctx.fillRect(x, y + hgt * 0.35, wdt, hgt * 0.3); }
      ctx.restore();
    }

    function draw(ctx, w, h, dt) {
      ctx.clearRect(0, 0, w, h);
      const heatK = st.phase === 'hammer' || st.phase === 'pause' ? st.heat / 100 : 0.6;
      // décor : enclume, puis fondu vers le bac de trempe
      if (bgA) G.drawCover(ctx, bgA, mapA); else { ctx.fillStyle = '#1a120d'; ctx.fillRect(0, 0, w, h); }
      if (bgQ && st.qfade > 0) { ctx.globalAlpha = st.qfade; G.drawCover(ctx, bgQ, mapQ); ctx.globalAlpha = 1; }
      ctx.fillStyle = 'rgba(10,7,5,.18)'; ctx.fillRect(0, 0, w, h);
      // foyer : il s'embrase quand la pièce y retourne
      if (bgA && !st.quench) {
        const hx = mapA.x(HEARTH.x), hy = mapA.y(HEARTH.y);
        G.drawFxNow(ctx, 'flames', hx, hy - 10, (st.fire > 0 ? 170 : 110), st.fire > 0 ? 0.9 : 0.35 + Math.sin(performance.now() / 180) * 0.06);
      }
      if (!st.quench) {
        // pièce : sur l'enclume, ou dans le foyer pendant la chauffe
        let x = pr.x, y = pr.y, wd = pr.w, hg = pr.h, a = 1;
        if (st.fire > 0 && bgA) {
          const k = Math.sin(Math.min(1, (FIRE_TIME - st.fire) / FIRE_TIME) * Math.PI);
          const hx = mapA.x(HEARTH.x), hy = mapA.y(HEARTH.y);
          const sc = 1 - k * 0.45;
          wd = pr.w * sc; hg = pr.h * sc;
          x = G.lerp(pr.x, hx - wd * 0.3, k); y = G.lerp(pr.y, hy - hg / 2, k); a = 1 - k * 0.3;
        }
        drawPieceAt(ctx, x, y, wd, hg, 520 + st.heat * 6.3, 0.08 + heatK * 0.22, a);
        if (st.heat > 60 && Math.random() < heatK * 0.3) G.burst(x + Math.random() * wd, y + hg * 0.3, 1, '#ffb347', 50, 0.5, -60);
      } else {
        // trempe : la pièce au-dessus du bac, puis plongée sous la surface
        const q = st.quench, m = mapQ;
        const wx = m ? m.x(WATER.x) : w / 2, wy = m ? m.y(WATER.y) : h * 0.62;
        const wd = Math.min(pr.w, (m ? WATER.w * m.iw : w * 0.6) * 1.2), hg = pr.h * wd / pr.w;
        const y = wy - hg - 40 + q.y + Math.sin(performance.now() / 400) * (q.done ? 0 : 3);
        ctx.save(); ctx.beginPath(); ctx.rect(0, 0, w, wy + 4); ctx.clip();
        drawPieceAt(ctx, wx - wd / 2, y, wd, hg, q.T, q.done ? 0.1 : 0.28);
        ctx.restore();
        if (q.done && q.steam > 0) {
          q.steam -= dt;
          if (Math.random() < 0.35) G.fx('steam', wx + G.rand(-wd * 0.35, wd * 0.35), wy - 20, { size: G.rand(70, 120), life: 1.3, vy: -50, grow: 1.6, alpha: 0.7, rot: Math.random() * 6 });
        }
      }

      // cibles
      if (st.phase === 'hammer' || st.phase === 'pause') {
        const cold = st.heat < COLD, away = st.fire > 0;
        st.targets.forEach(t => {
          if (t.judged) return;
          const p = tpos(t), dtHit = t.tHit - st.song;
          if (dtHit > T) return;
          const k = G.clamp(dtHit / T, -0.2, 1);
          ctx.lineWidth = 3;
          ctx.strokeStyle = away ? 'rgba(160,150,140,.6)' : cold ? '#8ec5ff' : 'rgba(255,240,200,.95)';
          ctx.fillStyle = 'rgba(20,12,8,.45)';
          ctx.beginPath(); ctx.arc(p.x, p.y, R, 0, 7); ctx.fill(); ctx.stroke();
          ctx.strokeStyle = away ? 'rgba(160,150,140,.5)' : k < 0.12 ? '#ffe08a' : '#ff9a3a'; ctx.lineWidth = 4;
          ctx.beginPath(); ctx.arc(p.x, p.y, R + Math.max(0, k) * R * 2.4, 0, 7); ctx.stroke();
          ctx.fillStyle = '#ffe9c2'; ctx.font = '800 16px ' + G.uiFont(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(t.i + 1, p.x, p.y + 1); ctx.textBaseline = 'alphabetic';
        });
        const next = st.targets.find(t => !t.judged), now = performance.now();
        if (next && next.phraseStart && next.tHit - st.song > T + 0.2 && st.song > 0 && st.fire <= 0) {
          const low = st.heat < 70, txt = low ? G.L('Pause : réchauffe maintenant !', 'Pause: reheat now!') : G.L('Pause', 'Pause');
          G.plate(ctx, txt, w / 2, h * 0.14, { size: low ? 22 : 24, color: low ? '#ffb347' : '#ecdfcd', glow: low ? 1.2 : 0.4, scale: G.pop('fg-pause', txt) * (low ? 1 + Math.sin(now / 110) * 0.04 : 1), maxW: w - 24 });
        }
        if (st.song < 0) {
          const go = st.song >= -0.8, txt = go ? G.L('Frappe !', 'Strike!') : G.L('Prêt ?', 'Ready?');
          G.plate(ctx, txt, w / 2, h * 0.18, { disp: true, size: 42, color: go ? '#ffb347' : '#ffd27a', glow: go ? 1.4 : 0.7, scale: G.pop('fg-go', txt), maxW: w - 24 });
        }
        ctx.shadowBlur = 0;
      }
      // marteau : il tombe du haut à droite sur le point frappé
      if (st.swing && hammerImg) {
        st.swing.t += dt;
        const t = st.swing.t;
        if (t > 0.32) st.swing = null;
        else {
          const S = R * 3.4, iw = S, ih = S * hammerImg.height / hammerImg.width;
          const lift = t < 0.06 ? 1 - t / 0.06 : 0;                 // arrivée rapide
          const a = t < 0.2 ? 1 : 1 - (t - 0.2) / 0.12;
          const px = st.swing.x + 0.76 * ih, py = st.swing.y - 0.76 * iw;
          ctx.save(); ctx.globalAlpha = a;
          ctx.translate(px, py); ctx.rotate(-Math.PI / 2 - lift * 0.9);
          ctx.drawImage(hammerImg, -0.93 * iw, -0.93 * ih, iw, ih);
          ctx.restore();
        }
      }
    }

    let qPct = () => 0;
    function startQuench() {
      st.phase = 'quench';
      st.hammer = st.results.reduce((a, b) => a + b, 0) / r.strikes;
      G.$('#fs-1').className = 'ok'; G.$('#fs-2').className = 'on';
      const tname = tempName(M.target, M.hue);
      hint.className = 'mg-hint'; hint.textContent = G.L(`Plonge la pièce quand elle est ${tname}.`, `Plunge the piece when it glows ${tname}.`);
      st.quench = { T: M.target + 430 + G.rand(-30, 30), v: 120 + (M.cool - 9) * 16, wob: Math.random() * 6, y: 0, done: false, steam: 0, ready: false };
      // échelle de couleur : du point « trop tard » à la température de départ ; zones bien / parfait et curseur de la pièce
      const T0 = M.target - M.tol * 2.6, T1 = M.target + 470;
      qPct = T => G.clamp((T - T0) / (T1 - T0), 0, 1) * 100;
      const stops = []; for (let i = 0; i <= 12; i++) { const T = T0 + (T1 - T0) * i / 12; stops.push(`${tempColor(T, M.hue)} ${(i / 12 * 100).toFixed(1)}%`); }
      const gL = qPct(M.target - M.tol), gR = qPct(M.target + M.tol), pL = qPct(M.target - M.tol / 4), pR = qPct(M.target + M.tol / 4);
      G.$('#fg-bottom').innerHTML = `
        <div class="qbar">
          <div class="qbar-lbl"><span>${G.L('Cible :', 'Target:')} <i class="sw" style="background:${tempColor(M.target, M.hue)}"></i><b>${tname}</b> · ${M.target} °C</span><span>${G.L('Pièce :', 'Piece:')} <b id="q-nowname">${Math.round(st.quench.T)} °C</b></span></div>
          <div class="qbar-track" style="background:linear-gradient(90deg, ${stops.join(', ')})">
            <i class="qt-good" style="left:${gL}%;width:${gR - gL}%"></i><i class="qt-perf" style="left:${pL}%;width:${pR - pL}%"></i>
            <i class="qt-cur" id="q-cur" style="left:${qPct(st.quench.T)}%"></i>
          </div>
          <div class="qbar-ends"><span>${G.L('froid', 'cold')}</span><span>${G.L('chaud', 'hot')}</span></div>
        </div>
        <button class="btn huge" id="fg-quench" disabled>${G.L('Vers le bac…', 'To the tub…')}</button>`;
      const qb = G.$('#fg-quench');
      qb.addEventListener('pointerdown', e => { e.preventDefault(); if (st.quench.ready) doQuench(false); });
      // court temps de transition : évite de tremper par erreur en visant « Réchauffer »
      setTimeout(() => {
        if (st.phase !== 'quench') return;
        st.quench.ready = true;
        qb.disabled = false; qb.textContent = G.L('Tremper', 'Quench'); qb.classList.add('primary', 'pop');
        G.sfx('tick');
      }, 1400);
    }

    function doQuench(late) {
      const q = st.quench;
      if (q.done) return;
      q.done = true; q.steam = 1.4;
      const err = Math.abs(q.T - M.target);
      let qs;
      if (late) qs = 0;
      else if (err <= M.tol / 4) qs = 100;
      else qs = Math.max(0, Math.round(100 - (err - M.tol / 4) / (M.tol * 1.5) * 100));
      st.quenchScore = qs;
      G.sfx('sizzle'); G.vibrate([15, 40, 15]);
      const t0 = performance.now(), dist = sz.h * 0.35;
      const anim = () => { const k = Math.min(1, (performance.now() - t0) / 320); q.y = dist * k * k; if (k < 1) requestAnimationFrame(anim); };
      anim();
      setTimeout(() => {
        const m = mapQ, wx = m ? m.x(WATER.x) : sz.w / 2, wy = m ? m.y(WATER.y) : sz.h * 0.62;
        G.fx('splash', wx, wy - 30, { size: 170, life: 0.6, grow: 1.4 });
        G.fx('steam', wx, wy - 40, { size: 200, life: 1.4, vy: -60, grow: 1.8, alpha: 0.9 });
      }, 180);
      G.$('#fg-quench').disabled = true;
      G.$('#q-nowname').textContent = late ? G.L('trop tard', 'too late') : `${Math.round(q.T)} °C`;
      setTimeout(() => finish(q.T, late), 1400);
    }

    async function finish(Tq, late) {
      st.phase = 'end';
      const q = G.clamp(Math.round(st.hammer * 0.7 + st.quenchScore * 0.3), 0, 100);
      const tier = G.qual(q);
      G.state.crafted[id] = true;
      const g = G.addGear(id, q);
      const slot = G.GEAR[id].slot;
      let line;
      if (slot === 'commande') line = G.L('Prête à être livrée. Plus la qualité est haute, plus elle se vend cher.', 'Ready to deliver. The higher the quality, the higher the price.');
      else {
        const cur = G.equipped(slot);
        const better = !cur || compare(g, cur) > 0;
        if (better) G.state.eq[slot] = g.uid;
        const s = G.gearStats(g);
        line = (s.atk !== undefined ? G.L(`ATQ ${s.atk}`, `ATK ${s.atk}`) : s.def !== undefined ? G.L(`DÉF ${s.def} · +${s.hp} PV`, `DEF ${s.def} · +${s.hp} HP`) : s.power !== undefined ? G.L(`Puissance ${s.power} · endurance ${s.energy >= 0 ? '+' : ''}${s.energy}`, `Power ${s.power} · stamina ${s.energy >= 0 ? '+' : ''}${s.energy}`) : G.L(`+${s.light} lumière`, `+${s.light} light`)) + (better ? G.L(' · équipé', ' · equipped') : '');
      }
      G.save();
      G.sfx(q >= 65 ? 'win' : 'clang', 1);
      const tip = st.coldHits > 0 ? `<p class="tip">${G.L(`${st.coldHits} frappe${st.coldHits > 1 ? 's' : ''} sur du métal froid. Réchauffe pendant les pauses pour une meilleure note.`, `${st.coldHits} strike${st.coldHits > 1 ? 's' : ''} on cold metal. Reheat during pauses to score higher.`)}</p>` : '';
      await G.modal({
        title: tier.name, cls: 'summary craft ' + tier.cls,
        body: `<div class="info-ico glow">${G.icon(id, 88)}</div><p class="big-name">${G.itemName(id)}</p><p class="sub">${line}</p>
          <div class="breakdown"><div><span>${G.L('Forgeage', 'Forging')}</span><b>${Math.round(st.hammer)}</b></div><div><span>${G.L('Trempe', 'Quench')}</span><b>${late ? G.L('trop tard', 'too late') : st.quenchScore}</b></div><div><span>${G.L('Qualité', 'Quality')}</span><b>${q}</b></div></div>
          <p class="sub">${late ? G.L('La pièce a trop refroidi avant la trempe.', 'The piece cooled too much before the quench.') : G.L(`Trempée à ${Math.round(Tq)} °C pour une cible de ${M.target} °C.`, `Quenched at ${Math.round(Tq)} °C for a target of ${M.target} °C.`)}${st.best >= 3 ? G.L(` Meilleure série : ${st.best} parfaits.`, ` Best streak: ${st.best} perfects.`) : ''}</p>${tip}`,
        buttons: [{ label: G.L('Retour à la forge', 'Back to the forge'), value: true, primary: true }],
      });
      G.toHub('forge');
    }

    G.howto('forge');
  };

  function compare(a, b) {
    const sa = G.gearStats(a), sb = G.gearStats(b);
    const v = s => (s.atk || 0) + (s.def || 0) * 3 + (s.hp || 0) * 0.2 + (s.power || 0) * 10 + (s.energy || 0) * 0.1 + (s.light || 0);
    return v(sa) - v(sb);
  }
  F.compare = compare;
})();
