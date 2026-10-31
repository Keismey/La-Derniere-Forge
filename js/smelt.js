/* La Dernière Forge — Fonderie : garder la température dans la zone idéale au soufflet */
(function () {
  const S = {};
  G.smelt = S;

  S.start = function (id, n) {
    const r = G.SMELT[id];
    G.pay(r.in, n);
    G.save();
    const scr = G.$('#s-smelt');
    scr.innerHTML = `
      <header class="mg-top"><div><span class="eyebrow">${G.L('Fonderie', 'Smelter')}</span><b>${G.itemName(id)} ×${r.out * n}</b></div><div class="mg-top-r"><div class="mg-timer" id="sm-time" hidden>${r.dur}s</div>${G.helpBtn('smelt')}</div></header>
      <div class="mg-stage"><canvas id="sm-cv"></canvas>
        <div class="mg-hint" id="sm-hint">${G.L('Actionne le soufflet pour chauffer. Garde l’aiguille dans la bande dorée.', 'Pump the bellows to heat. Keep the needle in the golden band.')}</div></div>
      <div class="mg-bottom"><div class="meter"><span>${G.L('Pureté', 'Purity')}</span><div class="bar"><i id="sm-pur"></i></div><b id="sm-purv">—</b></div>
        <button class="btn primary huge" id="sm-pump">${G.L('Soufflet', 'Bellows')}</button></div>`;
    G.show('s-smelt');
    G.music('forge');
    const cv = G.$('#sm-cv');
    let sz = G.fitCanvas(cv);
    const st = {
      h: 0.12, pend: 0, t: -2.2, inZone: 0, over: 0, cold: 0, counted: 0, done: false,
      flame: 0, bellow: 0, phase: Math.random() * 6, draftT: 3 + Math.random() * 2, msg: null, msgT: 0,
    };
    const grace = 1.2;
    G._dbg = st;
    // décor peint : creuset au centre, soufflet en bas à gauche
    const bg = G.imgEl('img/decors/fonderie.webp'), thermo = G.imgEl('img/forge/tool_thermo.webp');
    function layoutS() {
      const { w, h } = sz;
      if (!bg) return { m: null, cx: w * 0.45, cy: h * 0.45, cw: 80, kx: w * 0.45, ky: h * 0.6, nx: w * 0.2, ny: h * 0.75 };
      const m = G.coverMap(bg, w, h, 0.555, 0.5, w * 0.33, h * 0.48);
      return { m, cx: m.x(0.555), cy: m.y(0.468), cw: 0.2 * m.iw, kx: m.x(0.56), ky: m.y(0.6), nx: m.x(0.43), ny: m.y(0.735) };
    }
    G.smeltLayout = layoutS;
    const zoneC = t => G.clamp(r.center + Math.sin(t * (0.8 + r.drift * 5) + st.phase) * r.drift * 1.3 + Math.sin(t * 2.3 + st.phase * 2) * r.drift * 0.4, 0.12 + r.zone / 2, 0.93 - r.zone / 2);

    const pump = e => {
      if (e) e.preventDefault();
      if (st.done || st.t < 0 || G.paused) return;
      st.pend += 0.12; st.bellow = 1;
      G.sfx('bellows'); G.vibrate(8);
      const L = layoutS();
      G.fx('steam', L.nx, L.ny, { size: 70, life: 0.6, vx: 160, vy: -70, grow: 1.6, alpha: 0.45, rot: Math.random() * 6 });
    };
    G.$('#sm-pump').addEventListener('pointerdown', pump);
    G.keyTap(G.$('#sm-pump'), pump);
    G.bindHelp(scr, 'smelt');
    G.howto('smelt');

    G.loop(dt => {
      const { ctx, w, h } = sz;
      if (!st.done) {
        st.t += dt;
        if (st.t >= 0) {
          // inertie : la chaleur pompée arrive progressivement
          const tr = st.pend * Math.min(1, dt * 3.5);
          st.h += tr; st.pend -= tr;
          st.h -= r.decay * 0.7 * (0.35 + st.h) * dt;
          // courants d'air pour les métaux exigeants
          if (r.drift >= 0.1) {
            st.draftT -= dt;
            if (st.draftT <= 0) { st.draftT = G.rand(2.4, 4.2); st.h -= 0.09; st.msg = G.L("Courant d’air !", 'Draught!'); st.msgT = 1; }
          }
          st.h = G.clamp(st.h, 0, 1);
          const c = zoneC(st.t), lo = c - r.zone / 2, hi = c + r.zone / 2;
          st.c = c;
          if (st.t > grace) {
            st.counted += dt;
            if (st.h >= lo && st.h <= hi) st.inZone += dt;
            else if (st.h > hi + 0.08) st.over += dt;
          }
          if (st.t >= r.dur + grace) finish();
        }
        st.bellow = Math.max(0, st.bellow - dt * 4);
        st.msgT = Math.max(0, st.msgT - dt);
      }
      draw(ctx, w, h, st, r, zoneC);
      G.drawFx(ctx, dt);
      G.drawParts(ctx, dt);
      G.drawFloaters(ctx, dt);
      const pur = st.counted > 0 ? purity() : 0;
      G.$('#sm-pur').style.width = (pur * 100) + '%';
      G.$('#sm-pur').className = pur >= 0.8 ? 'top' : pur >= 0.45 ? 'mid' : 'low';
      G.$('#sm-purv').textContent = st.counted > 0 ? Math.round(pur * 100) + G.L(' %', '%') : '—';
      const left = st.t < 0 ? r.dur : Math.max(0, r.dur + grace - st.t);
      G.$('#sm-time').textContent = st.t < 0 ? G.L('Prêt…', 'Ready…') : Math.ceil(left) + 's';
    });

    function purity() { return G.clamp((st.inZone - st.over * 0.5) / Math.max(st.counted, 0.001), 0, 1); }

    async function finish() {
      st.done = true;
      const p = G.clamp((st.inZone - st.over * 0.5) / r.dur, 0, 1);
      let out = r.out * n, verdict, kind;
      if (p >= 0.8) { out += Math.ceil(r.out * n * 0.5); verdict = G.L('Coulée parfaite ! Métal d’une pureté rare.', 'Perfect pour! Metal of rare purity.'); kind = 'good'; G.sfx('win'); }
      else if (p >= 0.45) { verdict = G.L('Coulée réussie.', 'Good pour.'); kind = ''; G.sfx('clang', 1); }
      else { out = Math.floor(out / 2); verdict = G.L('Coulée ratée : trop de scories, la moitié du métal est perdue.', 'Failed pour: too much slag, half the metal is lost.'); kind = 'bad'; G.sfx('lose'); }
      G.add(id, out);
      G.state.stats = G.state.stats || {};
      G.save();
      await G.sleep(500);
      await G.summary(G.L('Fonderie', 'Smelter'), [verdict, G.L(`Pureté : <b>${Math.round(p * 100)} %</b> (80 % pour un bonus)`, `Purity: <b>${Math.round(p * 100)}%</b> (80% for a bonus)`)], { [id]: out }, kind, G.L('Retour à la forge', 'Back to the forge'));
      G.toHub('forge');
    }

    window.onresize = () => { if (G.current === 's-smelt') sz = G.fitCanvas(cv); };
  };

  function heatColor(h) {
    // du rouge sombre au blanc-jaune
    const stops = [[0, [40, 18, 12]], [0.3, [130, 25, 12]], [0.55, [225, 70, 20]], [0.75, [250, 160, 40]], [1, [255, 245, 200]]];
    for (let i = 1; i < stops.length; i++) {
      if (h <= stops[i][0]) {
        const a = stops[i - 1], b = stops[i], t = (h - a[0]) / (b[0] - a[0]);
        return `rgb(${a[1].map((v, k) => Math.round(G.lerp(v, b[1][k], t))).join(',')})`;
      }
    }
    return 'rgb(255,245,200)';
  }
  S.heatColor = heatColor;

  function draw(ctx, w, h, st, r, zoneC) {
    ctx.clearRect(0, 0, w, h);
    const L = G.smeltLayout();
    const bg = G.imgEl('img/decors/fonderie.webp');
    if (bg) G.drawCover(ctx, bg, L.m); else { ctx.fillStyle = '#1a120d'; ctx.fillRect(0, 0, w, h); }
    const tt = performance.now() / 1000;
    // braises et flammes sous le creuset, selon la chaleur
    const fl = 0.25 + st.h * 0.9 + st.bellow * 0.3;
    G.drawFxNow(ctx, 'flames', L.kx, L.ky - L.cw * 0.25, L.cw * (1.1 + st.h * 0.9), Math.min(1, 0.25 + fl * 0.6) * (0.9 + Math.sin(tt * 11) * 0.1));
    G.drawFxNow(ctx, 'flames', L.kx - L.cw * 0.3, L.ky - L.cw * 0.1, L.cw * (0.7 + st.h * 0.5), Math.min(1, fl * 0.5) * (0.85 + Math.sin(tt * 13 + 1) * 0.15), -0.2);
    G.drawFxNow(ctx, 'flames', L.kx + L.cw * 0.3, L.ky - L.cw * 0.1, L.cw * (0.7 + st.h * 0.5), Math.min(1, fl * 0.5) * (0.85 + Math.sin(tt * 12 + 2) * 0.15), 0.2);
    // métal en fusion dans le creuset : lueur de la couleur de la chaleur
    const col = heatColor(st.h);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(L.cx, L.cy, 2, L.cx, L.cy, L.cw * 0.75);
    g.addColorStop(0, col); g.addColorStop(0.45, col.replace('rgb', 'rgba').replace(')', ',.55)')); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = 0.35 + st.h * 0.65;
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(L.cx, L.cy, L.cw * 0.75, L.cw * 0.42, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    if (Math.random() < st.h * 0.6) G.burst(L.cx + G.rand(-L.cw * 0.3, L.cw * 0.3), L.cy, 1, heatColor(Math.min(1, st.h + 0.1)), 60, 0.8, -40);
    if (Math.random() < 0.04 + st.h * 0.05) G.fx('embers', L.kx + G.rand(-30, 30), L.ky - 20, { size: 90, life: 1.2, vy: -40, alpha: 0.7, fade: 'inout' });

    // thermomètre en laiton : le mercure coule dans le tube de verre peint
    const th = G.imgEl('img/forge/tool_thermo.webp');
    const TW = Math.min(w * 0.31, 136), TH = th ? TW * th.height / th.width : 320;
    const tx = w - TW - 6, ty = Math.max(46, (h - TH) / 2 + 6);
    const fx = u => tx + u * TW, fy = v => ty + v * TH;
    const c = zoneC(Math.max(0, st.t)), lo = c - r.zone / 2, hi = c + r.zone / 2;
    const inZ = st.h >= lo && st.h <= hi;
    // repères du tube (mesurés sur l'image) : verre de 15,5 % à 77 % de la hauteur, bulbe à 80 %
    const V0 = 0.745, V1 = 0.16, lvl = v => fy(V0 - v * (V0 - V1));
    const tubeL = fx(0.452), tubeR = fx(0.548), bulbX = fx(0.5), bulbY = fy(0.8), bulbR = TW * 0.105;
    // halo derrière le cadre pour le détacher du mur
    ctx.save();
    const halo = ctx.createRadialGradient(fx(0.5), fy(0.5), TW * 0.2, fx(0.5), fy(0.5), TH * 0.62);
    halo.addColorStop(0, inZ ? 'rgba(255,200,90,.32)' : 'rgba(255,150,60,.18)'); halo.addColorStop(1, 'rgba(255,150,60,0)');
    ctx.fillStyle = halo; ctx.fillRect(tx - TW, ty - 30, TW * 3, TH + 60);
    ctx.restore();
    if (th) {
      ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.8)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 4;
      ctx.drawImage(th, tx, ty, TW, TH); ctx.restore();
    }
    // zone idéale : lueur dorée dans le verre et crochets sur le cadre
    ctx.save();
    ctx.fillStyle = 'rgba(255,215,110,.22)';
    ctx.fillRect(tubeL - 2, lvl(hi), tubeR - tubeL + 4, lvl(lo) - lvl(hi));
    ctx.strokeStyle = inZ ? '#fff0b0' : '#ffcf5a'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.shadowColor = '#ffb030'; ctx.shadowBlur = inZ ? 12 : 6;
    [[fx(0.3), fx(0.4), 1], [fx(0.7), fx(0.6), -1]].forEach(([a, b]) => {
      ctx.beginPath(); ctx.moveTo(a, lvl(hi)); ctx.lineTo(b, lvl(hi)); ctx.lineTo(b, lvl(lo)); ctx.lineTo(a, lvl(lo)); ctx.stroke();
    });
    ctx.restore();
    // mercure : colonne arrondie + bulbe, couleur de la chaleur, reflet du verre
    const hv = Math.max(0.02, st.h), top = lvl(hv), colA = heatColor(Math.max(0.3, st.h));
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(tubeL, top + (tubeR - tubeL) / 2);
    ctx.arc((tubeL + tubeR) / 2, top + (tubeR - tubeL) / 2, (tubeR - tubeL) / 2, Math.PI, 0);
    ctx.lineTo(tubeR, bulbY); ctx.lineTo(tubeL, bulbY); ctx.closePath();
    ctx.moveTo(bulbX + bulbR, bulbY); ctx.arc(bulbX, bulbY, bulbR, 0, Math.PI * 2);
    const lg = ctx.createLinearGradient(tubeL, 0, tubeR, 0);
    lg.addColorStop(0, G.shade ? colA : colA); lg.addColorStop(0.5, '#fff6d8'); lg.addColorStop(1, colA);
    ctx.fillStyle = colA; ctx.shadowColor = colA; ctx.shadowBlur = 10 + st.h * 16;
    ctx.fill();
    ctx.shadowBlur = 0; ctx.globalAlpha = 0.45; ctx.fillStyle = lg; ctx.fill();
    ctx.restore();
    // reflet vertical sur le verre
    ctx.fillStyle = 'rgba(255,255,255,.28)';
    ctx.fillRect(tubeL + (tubeR - tubeL) * 0.18, fy(V1), (tubeR - tubeL) * 0.18, fy(V0) - fy(V1));
    // aiguille : petite flèche en laiton à gauche du cadre
    const ny = lvl(st.h);
    ctx.save();
    ctx.fillStyle = inZ ? '#fff2b0' : st.h > hi ? '#ff7a5a' : '#8ec5ff';
    ctx.shadowColor = '#000'; ctx.shadowBlur = 4;
    ctx.beginPath(); ctx.moveTo(fx(0.04), ny); ctx.lineTo(fx(0.04) - 14, ny - 9); ctx.lineTo(fx(0.04) - 14, ny + 9); ctx.closePath(); ctx.fill();
    ctx.restore();

    // chrono : médaillon juste au-dessus du thermomètre, lisible sans quitter la jauge des yeux
    {
      const grace = 1.2, left = st.t < 0 ? r.dur : Math.max(0, r.dur + grace - st.t), frac = st.t < 0 ? 1 : G.clamp(left / r.dur, 0, 1);
      const cx = fx(0.5), cy = Math.max(30, ty - 26), R = 24, urgent = st.t >= 0 && left <= 3 && !st.done;
      const pulse = urgent ? 1 + Math.sin(performance.now() / 90) * 0.06 : 1;
      ctx.save(); ctx.translate(cx, cy); ctx.scale(pulse, pulse);
      ctx.fillStyle = 'rgba(16,11,8,.9)'; ctx.shadowColor = 'rgba(0,0,0,.7)'; ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.arc(0, 0, R, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
      ctx.lineWidth = 3; ctx.strokeStyle = '#6e5124'; ctx.beginPath(); ctx.arc(0, 0, R - 2, 0, 7); ctx.stroke();
      ctx.strokeStyle = urgent ? '#ff6a4a' : '#ffd060'; ctx.shadowColor = ctx.strokeStyle; ctx.shadowBlur = 8; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(0, 0, R - 2, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2); ctx.stroke(); ctx.shadowBlur = 0;
      ctx.fillStyle = urgent ? '#ff8a6a' : '#fff2d0'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = '800 20px ' + uiFont(); ctx.fillText(st.t < 0 ? r.dur : Math.ceil(left), 0, 1);
      ctx.restore(); ctx.textBaseline = 'alphabetic';
    }
    const mx = (w - TW - 20) / 2, maxW = w - TW - 28, now = performance.now();
    if (st.t < 0) {
      const go = st.t >= -1.2, txt = go ? G.L('Souffle !', 'Blow!') : G.L('Prêt ?', 'Ready?');
      G.plate(ctx, txt, mx, h * 0.2, { disp: true, size: 44, color: go ? '#ffb347' : '#ffd27a', glow: go ? 1.4 : 0.7, scale: G.pop('sm-go', txt) * (go ? 1 + Math.sin(now / 90) * 0.03 : 1), maxW });
    } else if (!st.done) {
      const hot = st.h > hi + 0.08, warm = st.h > hi;
      const label = inZ ? G.L('Parfait !', 'Perfect!') : hot ? G.L('Trop chaud : scories !', 'Too hot: slag!') : warm ? G.L('Un peu chaud', 'A bit hot') : G.L('Trop froid', 'Too cold');
      const col = inZ ? '#ffe08a' : hot ? '#ff6a4a' : warm ? '#ff9a5a' : '#8ec5ff';
      const pulse = inZ ? 1 + Math.sin(now / 140) * 0.04 : hot ? 1 + Math.sin(now / 70) * 0.05 : 1;
      G.plate(ctx, label, mx, 50, { size: 24, color: col, glow: inZ || hot ? 1.3 : 0.5, scale: G.pop('sm-lbl', label) * pulse, maxW });
      if (st.msgT > 0) G.plate(ctx, st.msg, mx, 100, { size: 19, color: '#9cc3ff', glow: 0.6, alpha: Math.min(1, st.msgT * 1.5), scale: G.pop('sm-msg', st.msg + Math.round(st.draftT * 10)), maxW });
    }
    ctx.shadowBlur = 0;
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  G.roundRect = roundRect;
  function uiFont() { return '"Alegreya Sans", system-ui, sans-serif'; }
  function dispFont() { return '"Grenze Gotisch", Georgia, serif'; }
  G.uiFont = uiFont; G.dispFont = dispFont;
})();
