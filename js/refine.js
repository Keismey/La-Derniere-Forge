/* La Dernière Forge — Raffinage : la meule (reprise de qualité, une seule fois par pièce) et le sertissage des gemmes */
(function () {
  const R = {};
  G.refine = R;

  R.unlocked = () => G.state.ch >= 1;
  R.canHone = g => !!G.RECIPES[g.id] && !g.honed && g.q < 95;   // un chef-d'œuvre n'a rien à gagner à la meule
  R.freeSockets = g => (['arme', 'armure'].includes(G.GEAR[g.id].slot) ? G.SOCKETS(g.q) - (g.gems || []).length : 0);
  // gemmes possibles sur une pièce : selon son emplacement (toutes sur les pièces de commande)
  // seules les armes et les armures se sertissent (pas de gemme pertinente pour pioches, lanternes et commandes)
  R.settable = g => ['arme', 'armure'].includes(G.GEAR[g.id].slot);
  R.gemsFor = g => (R.settable(g) ? Object.keys(G.GEMS).filter(id => G.GEMS[id].slot === G.GEAR[g.id].slot) : []);

  /* ================= LA MEULE ================= */
  const PASSES = 4, SEG = 24;
  R.hone = function (uid) {
    const g = G.gearByUid(uid);
    if (!g || !R.canHone(g)) return;
    const verb = G.HONE_VERB(G.itemDef(g.id).kind);
    const scr = G.$('#s-refine');
    scr.innerHTML = `
      <header class="mg-top"><div><span class="eyebrow">${G.L('Meule', 'Grindstone')} · ${verb}</span><b>${G.itemName(g.id)}</b></div>
        <div class="mg-top-r"><div class="mg-timer" id="hn-pass">1 / ${PASSES}</div>${G.helpBtn('hone')}</div></header>
      <div class="mg-stage"><canvas id="hn-cv"></canvas><div class="mg-hint" id="hn-hint">${G.L('Pose le doigt sur la pièce et fais-la glisser vers la droite, d’un seul geste.', 'Put your finger on the piece and slide it to the right in one smooth stroke.')}</div></div>
      <div class="mg-bottom"><div class="meter"><span>${G.L('Fil', 'Edge')}</span><div class="bar"><i id="hn-bar"></i></div><b id="hn-val">—</b></div></div>`;
    G.show('s-refine');
    G.music('forge');
    G.bindHelp(scr, 'hone');
    const cv = G.$('#hn-cv');
    let sz = G.fitCanvas(cv);
    window.onresize = () => { if (G.current === 's-refine') sz = G.fitCanvas(cv); };
    const bg = G.imgEl('img/decors/meule.webp') || G.imgEl('img/decors/forge.webp');
    const wheel = G.imgEl('img/forge/tool_grindstone.webp');
    const blank = G.forge.blankOf(g.id);
    const st = { needle: 0, pass: 0, segs: [], active: false, p: 0, x0: 0, lastX: 0, lastT: 0, v: 0, ang: 0, results: [], done: false, msg: '', msgKind: '', msgT: 0 };
    G._dbg = st;
    const geo = () => {
      const { w, h } = sz, R0 = Math.min(w * 0.3, h * 0.24);
      // longueur à l'échelle de l'objet : une lanterne n'est pas une épée
      const L = Math.min(w * 0.72, 340) * G.clamp(G.forge.blankScale(g.id) / 1.25, 0.34, 1);
      return { w, h, cx: w * 0.5, cy: h * 0.62, R0, L, top: h * 0.62 - R0 };
    };
    // vitesse idéale : traverser la pièce en ~1,1 s
    const band = () => { const L = geo().L; return { lo: L / 1.7, hi: L / 0.7, ideal: L / 1.1 }; };
    const newPass = () => { st.segs = new Array(SEG).fill(null); st.p = 0; };
    newPass();

    cv.addEventListener('pointerdown', e => {
      if (st.done || st.active || G.paused) return;
      e.preventDefault();
      cv.setPointerCapture && cv.setPointerCapture(e.pointerId);
      st.active = true; st.x0 = e.clientX; st.lastX = e.clientX; st.lastT = performance.now(); st.v = 0; st.needle = 0;
    });
    cv.addEventListener('pointermove', e => {
      if (!st.active) return;
      const now = performance.now(), dt = Math.max(1, now - st.lastT) / 1000;
      const inst = (e.clientX - st.lastX) / dt;
      st.v += (inst - st.v) * (1 - Math.exp(-dt / 0.16));   // vitesse lissée sur ~0,16 s
      st.lastX = e.clientX; st.lastT = now;
      const { L } = geo(), b = band();
      const p = G.clamp((e.clientX - st.x0) / L, 0, 1);
      if (p > st.p) {
        const q = st.v < b.lo ? 'heat' : st.v > b.hi ? 'skip' : 'good';
        for (let i = Math.floor(st.p * SEG); i < Math.floor(p * SEG); i++) if (!st.segs[i]) st.segs[i] = q;
        st.p = p;
        if (q === 'good' && Math.random() < 0.7) { const G0 = geo(); G.burst(G0.cx, G0.top + 2, 3, '#ffd27a', 220, 0.45, 400); }
        if (q === 'heat') { st.msg = G.L('Trop lent : le métal chauffe !', 'Too slow: the metal heats up!'); st.msgKind = 'slow'; st.msgT = 0.8; }
        if (q === 'skip') { st.msg = G.L('Trop vite : le fil est inégal', 'Too fast: the edge is uneven'); st.msgKind = 'fast'; st.msgT = 0.8; }
      }
      if (st.p >= 1) endPass();
    });
    const up = () => { if (st.active) endPass(); };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);

    function endPass() {
      st.active = false;
      const sc = st.segs.reduce((a, s) => a + (s === 'good' ? 1 : s === 'heat' ? -0.5 : 0), 0) / SEG;
      st.results.push(G.clamp(sc, 0, 1));
      G.sfx(sc > 0.75 ? 'clang' : 'dull', 1);
      const mean = st.results.reduce((a, b) => a + b, 0) / st.results.length;
      G.$('#hn-bar').style.width = Math.round(mean * 100) + '%';
      G.$('#hn-val').textContent = Math.round(mean * 100) + ' %';
      st.msg = sc > 0.85 ? G.L('Belle passe !', 'Fine pass!') : sc > 0.55 ? G.L('Passe correcte', 'Decent pass') : G.L('Passe ratée', 'Botched pass'); st.msgKind = sc > 0.55 ? 'good' : 'bad'; st.msgT = 1;
      st.pass++;
      if (st.pass >= PASSES) { st.done = true; setTimeout(finish, 700); return; }
      G.$('#hn-pass').textContent = `${st.pass + 1} / ${PASSES}`;
      setTimeout(newPass, 500);
    }

    async function finish() {
      G.stopLoop();
      const s = st.results.reduce((a, b) => a + b, 0) / PASSES;
      const before = g.q;
      // de −5 (tout raté) à +15 (parfait) : la reprise est difficile, l'échec ne doit pas être trop punitif
      const delta = s < 0.4 ? Math.round((s - 0.4) * 12.5) : Math.round((s - 0.4) * 25);
      g.q = G.clamp(before + delta, 0, 100);
      g.honed = true;                                    // une seule fois ; les gemmes restent en place
      G.save();
      G.sfx(delta >= 0 ? 'win' : 'lose');
      const qb = q => `<span class="qb ${G.qual(q).cls}">${G.qual(q).name} · ${q}</span>`;
      const sock = G.SOCKETS(g.q) > G.SOCKETS(before) ? `<p class="good-txt">${G.L('Nouvelle chasse : tu peux y sertir une gemme de plus.', 'New socket: you can set one more gem.')}</p>` : '';
      await G.modal({
        title: delta > 0 ? G.L('Reprise réussie', 'Rework succeeded') : delta === 0 ? G.L('Sans changement', 'No change') : G.L('Reprise ratée', 'Rework failed'), cls: 'summary ' + (delta > 0 ? 'good' : delta < 0 ? 'bad' : ''),
        body: `<div class="info-ico">${G.icon(g.id, 56)}</div><p class="big-name">${G.itemName(g.id)}</p><p class="q-change">${qb(before)} <span>→</span> ${qb(g.q)}</p>
          <p class="sub">${G.L(`Fil : ${Math.round(s * 100)} % · qualité ${delta >= 0 ? '+' : ''}${delta}.`, `Edge: ${Math.round(s * 100)}% · quality ${delta >= 0 ? '+' : ''}${delta}.`)}</p>${sock}`,
        buttons: [{ label: G.L('Retour au raffinage', 'Back to refining'), value: true, primary: true }],
      });
      G.toHub('raffinage');
    }

    G.loop(dt => {
      const { ctx } = sz, G0 = geo(), { w, h, cx, cy, R0, L, top } = G0;
      ctx.clearRect(0, 0, w, h);
      if (bg) { G.drawCover(ctx, bg, G.coverMap(bg, w, h, 0.5, 0.5, w / 2, h / 2)); ctx.fillStyle = 'rgba(14,10,8,.55)'; ctx.fillRect(0, 0, w, h); }
      else { ctx.fillStyle = '#17110d'; ctx.fillRect(0, 0, w, h); }
      // meule qui tourne
      st.ang += dt * (st.active ? 9 : 5);
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(st.ang);
      if (wheel) ctx.drawImage(wheel, -R0, -R0, R0 * 2, R0 * 2);
      else {
        const gr = ctx.createRadialGradient(0, 0, R0 * 0.1, 0, 0, R0);
        gr.addColorStop(0, '#8a8178'); gr.addColorStop(0.85, '#5d554d'); gr.addColorStop(1, '#3a332d');
        ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(0, 0, R0, 0, 7); ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = 2;
        for (let i = 0; i < 10; i++) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(i * 0.63) * R0, Math.sin(i * 0.63) * R0); ctx.stroke(); }
        ctx.fillStyle = '#2a221c'; ctx.beginPath(); ctx.arc(0, 0, R0 * 0.14, 0, 7); ctx.fill();
      }
      ctx.restore();
      // la pièce : son extrémité droite au point de contact au début, elle glisse vers la droite
      const im = G.tinted(blank, '#c9cfd4', 0.04);
      const ph = im ? L * im.height / im.width : 30;
      const x0 = cx - L + st.p * L, y0 = top - ph * 0.62;
      if (im) ctx.drawImage(im, x0, y0, L, ph); else { ctx.fillStyle = '#9aa3aa'; ctx.fillRect(x0, top - 16, L, 14); }
      // le fil : segments travaillés le long du bord, à la bonne couleur
      const ey = top - 2;
      for (let i = 0; i < SEG; i++) {
        const sgm = st.segs[SEG - 1 - i]; if (!sgm) continue;
        ctx.fillStyle = sgm === 'good' ? '#ffe08a' : sgm === 'heat' ? '#5a8cff' : '#8a8178';
        ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = sgm === 'good' ? 10 : 4;
        ctx.fillRect(x0 + (i / SEG) * L, ey - 3, L / SEG + 0.5, 4);
      }
      ctx.shadowBlur = 0;
      // compteur de vitesse : bande dorée = bon rythme
      const b = band(), gw = Math.min(w - 40, 320), gx = (w - gw) / 2, gy = 26, max = b.hi * 1.5;
      ctx.fillStyle = 'rgba(16,11,8,.85)'; G.roundRect(ctx, gx - 6, gy - 6, gw + 12, 26, 13); ctx.fill();
      ctx.fillStyle = 'rgba(90,140,255,.35)'; ctx.fillRect(gx, gy, gw * b.lo / max, 14);
      ctx.fillStyle = '#ffd060'; ctx.fillRect(gx + gw * b.lo / max, gy, gw * (b.hi - b.lo) / max, 14);
      ctx.fillStyle = 'rgba(200,60,50,.45)'; ctx.fillRect(gx + gw * b.hi / max, gy, gw * (1 - b.hi / max), 14);
      // l'aiguille suit la vitesse en douceur ; doigt immobile = la vitesse retombe
      if (st.active && performance.now() - st.lastT > 90) st.v *= Math.pow(0.02, dt);
      st.needle = (st.needle || 0) + ((st.active ? Math.max(0, st.v) : 0) - (st.needle || 0)) * Math.min(1, dt * 7);
      const nv = G.clamp(st.needle / max, 0, 1);
      ctx.fillStyle = '#fff'; ctx.shadowColor = '#fff'; ctx.shadowBlur = 8; ctx.fillRect(gx + gw * nv - 2, gy - 5, 4, 24); ctx.shadowBlur = 0;
      ctx.font = '800 11px ' + G.uiFont(); ctx.fillStyle = '#a8998a'; ctx.textAlign = 'left'; ctx.fillText(G.L('LENT', 'SLOW'), gx, gy + 32); ctx.textAlign = 'right'; ctx.fillText(G.L('RAPIDE', 'FAST'), gx + gw, gy + 32); ctx.textAlign = 'center'; ctx.fillStyle = '#ffd27a'; ctx.fillText(G.L('VITESSE', 'SPEED'), w / 2, gy + 32);
      st.msgT = Math.max(0, st.msgT - dt);
      if (st.msgT > 0) G.plate(ctx, st.msg, w / 2, h * 0.24, { size: 20, color: st.msgKind === 'slow' ? '#8ec5ff' : st.msgKind === 'fast' || st.msgKind === 'bad' ? '#ff8a6a' : '#ffe08a', alpha: Math.min(1, st.msgT * 2), scale: G.pop('hn-msg', st.msg + st.pass), maxW: w - 24 });
      G.drawParts(ctx, dt);
    });
    G.howto('hone');
  };

  /* ================= LE SERTISSAGE ================= */
  // 1) poser : garder la gemme tremblante au centre de la chasse ; 2) figer : un coup de marteau dosé
  const PLACE = 3.6;
  R.gemset = function (uid, gemId) {
    const g = G.gearByUid(uid);
    if (!g || R.freeSockets(g) <= 0 || G.count(gemId) < 1) return;
    G.add(gemId, -1); G.save();
    const scr = G.$('#s-refine');
    scr.innerHTML = `
      <header class="mg-top"><div><span class="eyebrow">${G.L('Sertissage', 'Gem setting')} · ${G.itemName(gemId)}</span><b>${G.itemName(g.id)}</b></div>
        <div class="mg-top-r">${G.helpBtn('gemset')}</div></header>
      <div class="mg-stage"><canvas id="gs-cv"></canvas><div class="mg-hint" id="gs-hint">${G.L('Garde la gemme au centre de la chasse en faisant glisser ton doigt.', 'Keep the gem centred in the socket by sliding your finger.')}</div></div>
      <div class="mg-bottom"><div class="meter"><span>${G.L('Tenue', 'Hold')}</span><div class="bar"><i id="gs-bar"></i></div><b id="gs-val">—</b></div></div>`;
    G.show('s-refine');
    G.bindHelp(scr, 'gemset');
    const cv = G.$('#gs-cv');
    let sz = G.fitCanvas(cv);
    window.onresize = () => { if (G.current === 's-refine') sz = G.fitCanvas(cv); };
    const bg = G.imgEl('img/decors/joaillier.webp') || G.imgEl('img/decors/forge.webp');
    const sockOpen = G.imgEl('img/forge/chasse_ouverte.webp'), sockShut = G.imgEl('img/forge/chasse_fermee.webp');
    const hammer = G.imgEl('img/forge/tool_hammer.webp');
    const gemImg = G.imgEl('img/icones/' + gemId + '.webp');
    const st = { phase: 'place', t: -1.2, ox: 0, oy: 0, vx: 0, vy: 0, inT: 0, drag: null, ph: Math.random() * 9,
      pw: 0, pdir: 1, pspeed: 0.95, strike: null, swing: 0, closed: 0, shake: 0, kp: 0, ks: 0, msg: '', msgT: 0 };
    G._dbg = st;
    // zone de frappe : ni trop doux, ni trop fort
    const ZG = [0.58, 0.82], ZP = [0.66, 0.74];

    cv.addEventListener('pointerdown', e => {
      e.preventDefault();
      if (G.paused) return;
      if (st.phase === 'strike') return hit();
      st.drag = { x: e.clientX, y: e.clientY }; cv.setPointerCapture && cv.setPointerCapture(e.pointerId);
    });
    cv.addEventListener('pointermove', e => {
      if (!st.drag || st.phase !== 'place') return;
      st.ox += e.clientX - st.drag.x; st.oy += e.clientY - st.drag.y;
      st.drag = { x: e.clientX, y: e.clientY };
    });
    const up = () => { st.drag = null; };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);

    function toStrike() {
      st.phase = 'strike'; st.drag = null; st.armT = 1.0;   // temps d'arrêt : évite le clic raté juste après la pose
      st.kp = G.clamp(st.inT / PLACE, 0, 1);
      G.$('#gs-hint').textContent = G.L('Touche pour frapper quand la force est dans la zone dorée.', 'Tap to strike when the force is in the golden zone.');
      G.sfx('tick');
    }
    function hit() {
      if (st.strike || st.armT > 0) return;
      const p = st.pw;
      st.ks = p >= ZP[0] && p <= ZP[1] ? 1 : p >= ZG[0] && p <= ZG[1] ? 0.8 : p < ZG[0] ? 0.45 : 0.35;
      st.strike = { p, t: 0 };
      st.msg = st.ks === 1 ? G.L('Coup parfait !', 'Perfect strike!') : st.ks >= 0.8 ? G.L('Bien frappé', 'Well struck') : p < ZG[0] ? G.L('Trop doux : la griffe tient mal', 'Too soft: the prong barely holds') : G.L('Trop fort : la gemme s’ébrèche', 'Too hard: the gem chips');
      st.msgT = 1.6;
    }
    async function finish() {
      G.stopLoop();
      const k = Math.round(G.clamp(st.kp * 0.6 + st.ks * 0.4, 0.4, 1) * 100) / 100;
      g.gems = (g.gems || []).concat([{ id: gemId, k }]);
      G.save();
      G.sfx(k >= 0.85 ? 'win' : 'clang', 1);
      const eff = G.GEAR[g.id].slot === 'commande' ? G.L('Valeur de la pièce +25 %.', 'Piece value +25%.') : G.GEMS[gemId].eff(k) + G.L(' (quand la pièce est portée).', ' (while the piece is worn).');
      await G.modal({
        title: k >= 0.85 ? G.L('Sertie à la perfection', 'Flawlessly set') : k >= 0.6 ? G.L('Gemme sertie', 'Gem set') : G.L('Sertissage fragile', 'Fragile setting'), cls: 'summary ' + (k >= 0.85 ? 'good' : ''),
        body: `<div class="info-ico">${G.icon(g.id, 56)}</div><p class="big-name">${G.itemName(g.id)} ${G.gemDots(g)}</p><p>${eff}</p>
          <div class="breakdown"><div><span>${G.L('Pose', 'Placement')}</span><b>${Math.round(st.kp * 100)} %</b></div><div><span>${G.L('Frappe', 'Strike')}</span><b>${Math.round(st.ks * 100)} %</b></div><div><span>${G.L('Tenue', 'Hold')}</span><b>${Math.round(k * 100)} %</b></div></div>`,
        buttons: [{ label: G.L('Retour au raffinage', 'Back to refining'), value: true, primary: true }],
      });
      G.toHub('raffinage');
    }

    // chasse dessinée en attendant les images : bâte en laiton et 4 griffes qui se rabattent
    function drawBezel(ctx, cx, cy, r, closed) {
      ctx.save();
      const gr = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.2, cx, cy, r * 1.15);
      gr.addColorStop(0, '#ffe7a6'); gr.addColorStop(0.55, '#c9a24a'); gr.addColorStop(1, '#6e4c1a');
      ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 18;
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.fill();
      ctx.shadowBlur = 0;
      const seat = ctx.createRadialGradient(cx, cy, r * 0.1, cx, cy, r * 0.72);
      seat.addColorStop(0, '#2a1d12'); seat.addColorStop(1, '#0e0906');
      ctx.fillStyle = seat; ctx.beginPath(); ctx.arc(cx, cy, r * 0.72, 0, 7); ctx.fill();
      for (let i = 0; i < 4; i++) {
        const an = i * Math.PI / 2 + Math.PI / 4;
        const d = r * (1.12 - closed * 0.42), pw = r * 0.22, pl = r * (0.42 + closed * 0.08);
        ctx.save(); ctx.translate(cx + Math.cos(an) * d, cy + Math.sin(an) * d); ctx.rotate(an + Math.PI / 2 - closed * 0.0);
        const pg = ctx.createLinearGradient(-pw / 2, 0, pw / 2, 0);
        pg.addColorStop(0, '#8a6424'); pg.addColorStop(0.5, '#f3d27e'); pg.addColorStop(1, '#8a6424');
        ctx.fillStyle = pg; ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 6;
        G.roundRect(ctx, -pw / 2, -pl / 2, pw, pl, pw / 2); ctx.fill();
        ctx.restore();
      }
      ctx.restore();
    }

    G.loop(dt => {
      const { ctx, w, h } = sz, cx = w / 2, cy = h * 0.46, S = Math.min(w, h) * 0.5, RIN = S * 0.12, BR = S * 0.24;
      const now = performance.now();
      if (st.phase === 'place') {
        st.t += dt;
        if (st.t > 0) {
          const a = 1 + st.t * 0.35, T = st.t + st.ph;
          st.vx += (Math.sin(T * 1.7) * 60 + Math.sin(T * 4.3) * 40 + (Math.random() - 0.5) * 260) * a * dt;
          st.vy += (Math.cos(T * 1.3) * 60 + Math.sin(T * 3.7) * 40 + (Math.random() - 0.5) * 260) * a * dt;
          st.vx *= Math.pow(0.35, dt); st.vy *= Math.pow(0.35, dt);
          st.ox += st.vx * dt; st.oy += st.vy * dt;
          const lim = S * 0.6; st.ox = G.clamp(st.ox, -lim, lim); st.oy = G.clamp(st.oy, -lim, lim);
          if (Math.hypot(st.ox, st.oy) <= RIN) st.inT += dt;
          const k = Math.min(1, st.inT / Math.max(0.01, Math.min(st.t, PLACE)));
          G.$('#gs-bar').style.width = Math.round(k * 100) + '%'; G.$('#gs-val').textContent = Math.round(k * 100) + ' %';
          if (st.t >= PLACE) toStrike();
        }
      } else if (st.phase === 'strike') {
        st.armT = Math.max(0, (st.armT || 0) - dt);
        if (!st.strike) {
          if (st.armT <= 0) {
          st.pw += st.pdir * st.pspeed * dt * (0.7 + st.pw * 0.8);
          if (st.pw >= 1) { st.pw = 1; st.pdir = -1; } else if (st.pw <= 0) { st.pw = 0; st.pdir = 1; }
          }
        } else {
          st.strike.t += dt;
          if (st.strike.t >= 0.16 && !st.strike.hit) {
            st.strike.hit = true; st.shake = 0.25; G.vibrate(25);
            G.sfx(st.ks >= 0.8 ? 'clang' : 'dull', 1);
            G.burst(cx + st.ox, cy + st.oy, 14, '#ffd27a', 260, 0.5, 300);
            G.fx(st.ks === 1 ? 'crit' : 'spark', cx + st.ox, cy + st.oy, { size: S * 0.8, life: 0.4, spin: 2 });
          }
          if (st.strike.hit) st.closed = Math.min(1, st.closed + dt * 6);
          if (st.strike.t >= 1.3 && !st.strike.end) { st.strike.end = true; finish(); }
        }
      }
      st.shake = Math.max(0, st.shake - dt);
      st.msgT = Math.max(0, st.msgT - dt);

      ctx.clearRect(0, 0, w, h);
      if (bg) { G.drawCover(ctx, bg, G.coverMap(bg, w, h, 0.5, 0.5, w / 2, h / 2)); ctx.fillStyle = 'rgba(14,10,8,.62)'; ctx.fillRect(0, 0, w, h); }
      const sx = st.shake > 0 ? Math.sin(now / 18) * 4 * st.shake / 0.25 : 0;
      ctx.save(); ctx.translate(sx, 0);
      // la chasse
      const img = st.closed > 0.5 ? (sockShut || sockOpen) : sockOpen;
      if (img) ctx.drawImage(img, cx - BR * 1.35, cy - BR * 1.35, BR * 2.7, BR * 2.7);
      else drawBezel(ctx, cx, cy, BR, st.closed);
      // pendant la pose : halo doux au centre et arc de progression autour de la chasse
      if (st.phase === 'place') {
        const inside = Math.hypot(st.ox, st.oy) <= RIN;
        const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, RIN * 1.4);
        halo.addColorStop(0, inside ? 'rgba(255,236,170,.45)' : 'rgba(255,208,96,.22)'); halo.addColorStop(1, 'rgba(255,208,96,0)');
        ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(cx, cy, RIN * 1.4, 0, 7); ctx.fill();
        ctx.setLineDash([4, 5]); ctx.lineWidth = 2; ctx.strokeStyle = inside ? '#fff2b0' : 'rgba(255,208,96,.75)';
        ctx.beginPath(); ctx.arc(cx, cy, RIN, 0, 7); ctx.stroke(); ctx.setLineDash([]);
        const prog = G.clamp(st.t / PLACE, 0, 1);
        ctx.lineWidth = 6; ctx.lineCap = 'round';
        ctx.strokeStyle = 'rgba(16,11,8,.7)'; ctx.beginPath(); ctx.arc(cx, cy, BR * 1.55, 0, 7); ctx.stroke();
        if (prog > 0) { ctx.strokeStyle = '#ffd060'; ctx.shadowColor = '#ffd060'; ctx.shadowBlur = 10; ctx.beginPath(); ctx.arc(cx, cy, BR * 1.55, -Math.PI / 2, -Math.PI / 2 + prog * Math.PI * 2); ctx.stroke(); ctx.shadowBlur = 0; }
      }
      // la gemme
      const gs = BR * 1.25, gx = cx + st.ox, gy = cy + st.oy;
      if (gemImg) ctx.drawImage(gemImg, gx - gs / 2, gy - gs / 2, gs, gs);
      else { ctx.fillStyle = G.ITEMS[gemId].color; ctx.beginPath(); ctx.arc(gx, gy, gs * 0.3, 0, 7); ctx.fill(); }
      // marteau qui tombe sur la chasse
      if (st.strike && hammer) {
        const k = G.clamp(st.strike.t / 0.16, 0, 1), up = st.strike.hit ? G.clamp((st.strike.t - 0.16) / 0.4, 0, 1) : 0;
        const hs = S * 0.7, ang = -1.1 + k * 1.1 - up * 0.6;
        ctx.save(); ctx.translate(cx + st.ox + hs * 0.55, cy + st.oy - hs * 0.15); ctx.rotate(ang);
        ctx.globalAlpha = 1 - up * 0.8; ctx.drawImage(hammer, -hs, -hs * 0.5, hs, hs); ctx.restore();
      }
      ctx.restore();
      // jauge de force
      if (st.phase === 'strike') {
        const bw = Math.min(w - 48, 340), bx = (w - bw) / 2, by = h * 0.82, bh = 26;
        ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.7)'; ctx.shadowBlur = 12;
        const fr = ctx.createLinearGradient(0, by - 5, 0, by + bh + 5); fr.addColorStop(0, '#d9a85a'); fr.addColorStop(0.5, '#7a5226'); fr.addColorStop(1, '#3a2412');
        ctx.fillStyle = fr; G.roundRect(ctx, bx - 5, by - 5, bw + 10, bh + 10, 12); ctx.fill(); ctx.restore();
        ctx.fillStyle = '#120d0a'; G.roundRect(ctx, bx, by, bw, bh, 8); ctx.fill();
        ctx.save(); G.roundRect(ctx, bx, by, bw, bh, 8); ctx.clip();
        ctx.fillStyle = 'rgba(140,180,220,.35)'; ctx.fillRect(bx, by, bw * ZG[0], bh);
        ctx.fillStyle = 'rgba(255,160,60,.8)'; ctx.fillRect(bx + bw * ZG[0], by, bw * (ZG[1] - ZG[0]), bh);
        ctx.fillStyle = '#ffe9a0'; ctx.shadowColor = '#ffe08a'; ctx.shadowBlur = 14; ctx.fillRect(bx + bw * ZP[0], by, bw * (ZP[1] - ZP[0]), bh); ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(200,60,50,.55)'; ctx.fillRect(bx + bw * ZG[1], by, bw * (1 - ZG[1]), bh);
        ctx.restore();
        const px = bx + bw * (st.strike ? st.strike.p : st.pw);
        ctx.fillStyle = '#fff'; ctx.shadowColor = '#fff'; ctx.shadowBlur = 12; ctx.fillRect(px - 2.5, by - 8, 5, bh + 16); ctx.shadowBlur = 0;
        ctx.font = '800 11px ' + G.uiFont(); ctx.fillStyle = '#a8998a'; ctx.textAlign = 'left'; ctx.fillText(G.L('DOUX', 'SOFT'), bx, by + bh + 20); ctx.textAlign = 'right'; ctx.fillText(G.L('FORT', 'HARD'), bx + bw, by + bh + 20);
        ctx.textAlign = 'center'; ctx.fillStyle = '#ffd27a'; ctx.fillText(G.L('FORCE DU COUP', 'STRIKE FORCE'), w / 2, by - 12);
      }
      if (st.phase === 'place' && st.t < 0) G.plate(ctx, G.L('Prêt ?', 'Ready?'), w / 2, h * 0.12, { disp: true, size: 40, color: '#ffd27a', glow: 0.7 });
      else if (st.phase === 'place') { const ins = Math.hypot(st.ox, st.oy) <= RIN; G.plate(ctx, ins ? G.L('Tiens bon !', 'Hold steady!') : G.L('Recentre la gemme', 'Centre the gem'), w / 2, h * 0.12, { size: 20, color: ins ? '#ffe08a' : '#ff9a5a', glow: ins ? 1 : 0.5, scale: G.pop('gs', ins) }); }
      else if (!st.strike && st.armT > 0) G.plate(ctx, G.L('Prépare le marteau…', 'Ready the hammer…'), w / 2, h * 0.12, { size: 20, color: '#ecdfcd', glow: 0.4, scale: G.pop('gs', 'arm'), maxW: w - 24 });
      else if (!st.strike) G.plate(ctx, G.L('Fige-la d’un coup de marteau !', 'Lock it with a hammer blow!'), w / 2, h * 0.12, { size: 20, color: '#ffb347', glow: 1, scale: G.pop('gs', 'hit') * (1 + Math.sin(now / 120) * 0.03), maxW: w - 24 });
      else if (st.msgT > 0) G.plate(ctx, st.msg, w / 2, h * 0.12, { size: 21, color: st.ks === 1 ? '#fff2b0' : st.ks >= 0.8 ? '#ffb347' : '#ff8a6a', glow: 1, scale: G.pop('gs', st.msg), maxW: w - 24 });
      G.drawFx(ctx, dt); G.drawParts(ctx, dt);
    });
    G.howto('gemset');
  };
})();
