/* La Dernière Forge — Mine : creuser case par case, gérer l'endurance, éviter éboulements et gaz.
   Rendu entièrement en images : tuiles peintes, filons, décor, mineur à poses. */
(function () {
  const M = {};
  G.mine = M;
  const W = 9;
  const ROCK = { 1: '#6e4d35', 2: '#7a7570', 3: '#55525a', 4: '#8a7d78', 5: '#2b2937', 6: '#22202a' };
  const IMG = p => G.imgEl('img/mine/' + p + '.webp');
  const POSE = p => G.imgEl('img/mineur/' + p + '.webp');
  // décor des galeries : poids et règle d'ancrage
  const DECOR = {
    stalactite: { w: 25, anchor: 'top' }, champi: { w: 22, anchor: 'floor' }, crane: { w: 14, anchor: 'floor' },
    toile: { w: 14, anchor: 'corner' }, lanterne: { w: 12, anchor: 'wall', lv: [1, 2] }, etai: { w: 10, anchor: 'full', lv: [1, 2, 3] },
    wagon: { w: 5, anchor: 'floor', lv: [1, 2] },
  };

  function gen(L) {
    const rows = L.rows, grid = [];
    const decos = Object.keys(DECOR).filter(k => !DECOR[k].lv || DECOR[k].lv.includes(L.id)).map(k => [k, DECOR[k].w]);
    for (let y = 0; y < rows; y++) {
      const row = [];
      for (let x = 0; x < W; x++) {
        const c = { t: 'rock', h: 1, hp: 1, ore: null, rev: false, sp: [Math.random(), Math.random(), Math.random(), Math.random(), Math.random(), Math.random()] };
        const f = y / rows;
        if (y === 0) c.t = 'air';
        else if (y === rows - 1) c.t = 'bedrock';
        else {
          c.h = Math.random() < 0.08 + f * 0.75 ? L.hard[1] : L.hard[0];
          if (Math.random() < 0.04 && f > 0.5) c.h = Math.min(6, L.hard[1] + 1);
          const rate = G.lerp(L.oreMin, L.oreMax, f);
          if (Math.random() < rate) {
            const avail = L.ores.filter(o => (o[2] || 0) <= f);
            c.ore = G.wpick(avail)[0];
          } else if (y > 2 && Math.random() < L.boulder) { c.t = 'boulder'; }
          else if (y > 3 && Math.random() < L.gas) { c.gas = true; }
          // petites cavernes déjà ouvertes
          if (!c.ore && c.t === 'rock' && y > 4 && Math.random() < 0.035) c.t = 'air';
        }
        // décor révélé quand la case est vide (caverne naturelle ou galerie creusée)
        if (y > 1 && !c.ore && Math.random() < (c.t === 'air' ? 0.5 : 0.07)) c.decor = G.wpick(decos)[0];
        row.push(c);
      }
      grid.push(row);
    }
    grid[0].forEach(c => { c.t = 'air'; c.decor = null; });
    if (L.note && G.count(L.note) === 0) {
      const y = G.randi(rows - 5, rows - 2), x = G.randi(0, W - 1);
      Object.assign(grid[y][x], { t: 'chest', note: L.note, ore: null, gas: false, h: L.hard[0], decor: null });
    }
    if (Math.random() < 0.7) {
      const y = G.randi(Math.floor(rows * 0.35), Math.floor(rows * 0.8)), x = G.randi(0, W - 1);
      Object.assign(grid[y][x], { t: 'chest', cache: true, ore: null, gas: false, h: L.hard[0], decor: null });
    }
    grid.forEach(r => r.forEach(c => { c.hp = c.max = c.h; }));
    return grid;
  }

  M.start = function (li) {
    const L = G.MINE[li], P = G.player();
    const scr = G.$('#s-mine');
    scr.innerHTML = `
      <header class="mine-hud">
        <div class="meter"><span>${G.L('Endurance', 'Stamina')}</span><div class="bar energy"><i id="mn-en"></i></div><b id="mn-env">0</b></div>
        <div class="mine-stats"><span id="mn-depth">0 m</span><span id="mn-loot">${G.L('Butin : 0', 'Loot: 0')}</span>${G.helpBtn('mine')}</div>
        <div class="gas-alert" id="mn-gas" hidden>${G.L('Gaz toxique : tu perds de l’endurance. Éloigne-toi de 2 cases !', 'Toxic gas: you are losing stamina. Move 2 tiles away!')}</div>
      </header>
      <div class="mg-stage mine-stage"><canvas id="mn-cv"></canvas></div>
      <div class="mg-bottom row2">
        <button class="btn" id="mn-ration">${G.icon('ration', 26)} ${G.L('Ration', 'Ration')} (${G.count('ration')})</button>
        <button class="btn primary" id="mn-up">${G.L('Remonter', 'Go up')}</button>
      </div>`;
    G.show('s-mine');
    G.music('mine');
    const cv = G.$('#mn-cv');
    let sz = G.fitCanvas(cv);
    window.onresize = () => { if (G.current === 's-mine') sz = G.fitCanvas(cv); };
    const backdrop = G.imgEl('img/decors/mine' + L.id + '.webp');

    const grid = gen(L);
    const st = {
      px: 4, py: 0, face: 1, en: P.energy, max: P.energy, loot: {}, gas: [], camY: -9999, done: false,
      bump: 0, bumpDx: 0, bumpDy: 0, tick: 0, hurt: 0, deepest: 0, light: P.light, msg: null, msgT: 0,
      ox: 0, oy: 0, anim: [], pose: 'idle', fainted: false,
    };
    const ts = () => sz.w / W;
    reveal();
    G._dbg = { st, grid, act: (dx, dy) => act(dx, dy) };

    function reveal() {
      const r = st.light + 0.5;
      for (let y = Math.max(0, st.py - st.light - 1); y <= Math.min(L.rows - 1, st.py + st.light + 1); y++)
        for (let x = 0; x < W; x++)
          if ((x - st.px) ** 2 + (y - st.py) ** 2 <= r * r) grid[y][x].rev = true;
    }
    function tile(x, y) { return y >= 0 && y < L.rows && x >= 0 && x < W ? grid[y][x] : null; }
    function solid(x, y) { const c = tile(x, y); return !c || (c.t !== 'air' && c.t !== 'boulder'); }
    // enchaînement de poses du mineur
    function play(seq) { st.anim = seq.map(([p, d]) => ({ p, d })); st.pose = st.anim[0].p; }

    function act(dx, dy) {
      if (st.done) return;
      const nx = st.px + dx, ny = st.py + dy;
      if (dx) st.face = dx;
      const c = tile(nx, ny);
      if (!c) return;
      if (c.t === 'air') {
        st.px = nx; st.py = ny; st.ox = -dx; st.oy = -dy; reveal();
        if (st.py > st.deepest) st.deepest = st.py;
        play([['walk', 0.14]]);
        G.sfx('tick');
        return;
      }
      const t = ts(), cx = (nx + 0.5) * t, cy = (ny + 0.5) * t - st.camY;
      if (c.t === 'bedrock') { say(G.L('Roche-mère : impossible à creuser.', 'Bedrock: impossible to dig.')); bump(dx, dy); G.sfx('dull'); play([['strike', 0.08], ['down', 0.12]]); return; }
      if (c.t === 'boulder') { say(G.L('Rocher instable : creuse dessous ou contourne-le.', 'Loose boulder: dig under it or go around.')); bump(dx, dy); return; }
      if (c.h > P.power + 2) { say(G.L('Trop dur pour ta pioche.', 'Too hard for your pick.')); bump(dx, dy); G.sfx('dull'); G.fx('spark', cx, cy, { size: t * 0.9, life: 0.25 }); return; }
      const hits = Math.max(1, c.h - P.power + 1);
      if (c.max !== hits) { c.hp = Math.min(c.hp, hits); c.max = hits; }
      st.en -= 1; c.hp -= 1;
      bump(dx, dy);
      if (dy > 0) play([['raise', 0.07], ['down', 0.14]]);
      else if (dy < 0) play([['idle', 0.05], ['up', 0.16]]);
      else play([['strike', 0.07], ['down', 0.14]]);
      G.vibrate(10);
      if (c.hp > 0) {
        G.sfx('dig'); G.burst(cx, cy, 5, ROCK[c.h] || '#555', 90, 0.4);
        G.fx('spark', cx - dx * t * 0.35, cy - dy * t * 0.35, { size: t * 0.8, life: 0.22, rot: Math.random() * 6 });
      } else {
        breakTile(c, nx, ny, cx, cy);
        // case percée : le mineur s'y avance tout seul juste après le coup
        st.step = { x: nx, y: ny, dx, dy, fx: st.px, fy: st.py, t: 0.15 };
      }
      if (st.en <= 0) faint();
    }

    function breakTile(c, x, y, cx, cy) {
      const t = ts();
      G.sfx('break');
      G.burst(cx, cy, 10, ROCK[c.h] || '#555', 140, 0.5);
      G.fx('dust', cx, cy, { size: t * 1.6, life: 0.6, grow: 1.4, alpha: 0.75, rot: Math.random() * 6 });
      if (c.ore) {
        const n = (y / L.rows > 0.6 && Math.random() < 0.25) ? 2 : 1;
        st.loot[c.ore] = (st.loot[c.ore] || 0) + n;
        const d = G.ITEMS[c.ore];
        G.float(cx, cy - 10, `+${n} ${G.lang === 'en' ? d.name.replace(/\s+ore$/i, '') : d.name.replace('Minerai ', '').replace(/^de |^d['’]/, '')}`, d.color, 16);
        G.sfx(d.kind === 'gem' ? 'gem' : 'ore');
        G.fx(d.kind === 'gem' ? 'crit' : 'spark', cx, cy, { size: t * 1.4, life: 0.5, spin: 2 });
      }
      if (c.gas) {
        st.gas.push({ x, y, t: 4.5, rot: Math.random() * 6 });
        G.sfx('gas'); say(G.L('Poche de gaz ! Recule de 2 cases et attends.', 'Gas pocket! Back off 2 tiles and wait.'));
      }
      if (c.t === 'chest') {
        G.fx('crit', cx, cy, { size: t * 2.2, life: 0.8, spin: 1.5 });
        if (c.note) {
          G.add(c.note, 1);
          G.sfx('win');
          st.pause = true;
          setTimeout(async () => {
            await G.modal({ title: G.itemName(c.note), body: `<div class="info-ico">${G.icon(c.note, 72)}</div><p class="note-txt">${G.NOTES[c.note]}</p>`, buttons: [{ label: G.L('Ranger le carnet', 'Put the notebook away'), value: true, primary: true }] });
            st.pause = false; G.save();
          }, 200);
        } else {
          const r = G.pick([['potion', 1], ['ration', 1], ['bombe', 2], ['gold', G.randi(15, 40)], ['quartz', 1]]);
          if (r[0] === 'gold') { st.gold = (st.gold || 0) + r[1]; G.float(cx, cy - 10, G.L(`Cache : +${r[1]} or`, `Cache: +${r[1]} gold`), '#ffd27a'); }
          else { st.loot[r[0]] = (st.loot[r[0]] || 0) + r[1]; G.float(cx, cy - 10, G.L(`Cache : ${r[1]} ${G.itemName(r[0])}`, `Cache: ${r[1]} ${G.itemName(r[0])}`), '#ffd27a', 15); }
          G.sfx('coin');
        }
      }
      c.t = 'air'; c.ore = null; c.gas = false;
    }

    function bump(dx, dy) { st.bump = 1; st.bumpDx = dx; st.bumpDy = dy; }
    function say(m) { st.msg = m; st.msgT = 1.6; }

    // éboulements
    function physics() {
      for (let y = L.rows - 2; y >= 0; y--) {
        for (let x = 0; x < W; x++) {
          const c = grid[y][x];
          if (c.t !== 'boulder') continue;
          const below = grid[y + 1][x];
          const playerBelow = st.px === x && st.py === y + 1;
          if (below.t === 'air') {
            if (!c.wobble && !c.moving) { c.wobble = 0.75; if (c.rev) G.sfx('dull'); continue; }
            if (c.wobble > 0) continue;
            if (playerBelow) {
              const dmg = 8, t = ts();
              st.en -= dmg; st.hurt = 0.6; play([['hurt', 0.55]]);
              G.sfx('thud'); G.vibrate([60, 30, 60]);
              G.float((x + 0.5) * t, (y + 1) * t - st.camY, G.L(`-${dmg} endurance`, `-${dmg} stamina`), '#ff7a6a');
              G.fx('dust', (x + 0.5) * t, (y + 1) * t - st.camY, { size: t * 2.4, life: 0.8, grow: 1.5 });
              G.fx('impact', (x + 0.5) * t, (y + 1) * t - st.camY, { size: t * 1.6, life: 0.3 });
              c.t = 'air'; c.wobble = 0; c.moving = false;
              if (st.en <= 0) faint();
              continue;
            }
            below.t = 'boulder'; below.moving = true; below.fall = 1; below.wobble = 0; below.rev = below.rev || c.rev; below.h = c.h; below.sp = c.sp;
            c.t = 'air'; c.moving = false; c.wobble = 0;
          } else {
            if (c.moving && c.rev) { G.sfx('thud'); const t = ts(); G.fx('dust', (x + 0.5) * t, (y + 0.9) * t - st.camY, { size: t * 1.4, life: 0.5, alpha: 0.6 }); }
            c.moving = false; c.wobble = 0;
          }
        }
      }
    }

    // contrôles : toucher une zone autour du mineur = creuser/avancer dans cette direction
    let hold = null;
    function dirFrom(e) {
      const r = cv.getBoundingClientRect(), t = ts();
      const px = (st.px + 0.5) * t, py = (st.py + 0.5) * t - st.camY;
      const dx = e.clientX - r.left - px, dy = e.clientY - r.top - py;
      if (Math.abs(dx) < t * 0.35 && Math.abs(dy) < t * 0.35) return null;
      return Math.abs(dx) > Math.abs(dy) ? [Math.sign(dx), 0] : [0, Math.sign(dy)];
    }
    cv.addEventListener('pointerdown', e => {
      e.preventDefault();
      if (st.pause || G.paused) return;
      cv.setPointerCapture && cv.setPointerCapture(e.pointerId);
      hold = { e, next: 0.28 };
      const d = dirFrom(e); if (d) act(d[0], d[1]);
    });
    cv.addEventListener('pointermove', e => { if (hold) hold.e = e; });
    const end = () => { hold = null; };
    cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end); cv.addEventListener('pointerleave', end);

    const gasEl = G.$('#mn-gas');
    G.bindHelp(scr, 'mine');
    G.howto('mine');
    G.$('#mn-up').onclick = () => leave(false);
    G.$('#mn-ration').onclick = () => {
      if (G.count('ration') < 1 || st.done) return;
      G.add('ration', -1); st.en = Math.min(st.max + 15, st.en + 15); G.sfx('heal');
      const t = ts(); G.fx('heal', (st.px + 0.5) * t, (st.py + 0.5) * t - st.camY, { size: t * 2, life: 0.8 });
      G.$('#mn-ration').innerHTML = `${G.icon('ration', 26)} ${G.L('Ration', 'Ration')} (${G.count('ration')})`;
      G.save();
    };

    G.loop(dt => {
      const { ctx, w, h } = sz;
      if (!st.done && !st.pause) {
        if (st.step) {
          st.step.t -= dt;
          if (st.step.t <= 0) {
            const s = st.step; st.step = null;
            const c = tile(s.x, s.y);
            if (st.px === s.fx && st.py === s.fy && c && c.t === 'air') act(s.dx, s.dy);
          }
        }
        if (hold) { hold.next -= dt; if (hold.next <= 0) { hold.next = 0.16; const d = dirFrom(hold.e); if (d) act(d[0], d[1]); } }
        st.tick += dt;
        grid.forEach(r => r.forEach(c => { if (c.wobble > 0) c.wobble -= dt; if (c.fall > 0) c.fall = Math.max(0, c.fall - dt * 9); }));
        if (st.tick >= 0.11) { st.tick = 0; physics(); }
        for (let i = st.gas.length - 1; i >= 0; i--) { st.gas[i].t -= dt; if (st.gas[i].t <= 0) st.gas.splice(i, 1); }
        if (st.gas.some(g => Math.abs(g.x - st.px) <= 1 && Math.abs(g.y - st.py) <= 1)) {
          st.en -= 2.5 * dt; st.inGas = true;
          if (st.en <= 0) faint();
        } else st.inGas = false;
        gasEl.hidden = !st.inGas;
      }
      // poses et déplacement interpolé
      if (st.anim.length) {
        st.anim[0].d -= dt;
        if (st.anim[0].d <= 0) st.anim.shift();
        st.pose = st.anim.length ? st.anim[0].p : 'idle';
      }
      if (st.fainted) st.pose = 'tired';
      st.ox *= Math.pow(0.0005, dt); st.oy *= Math.pow(0.0005, dt);
      if (Math.abs(st.ox) < 0.01) st.ox = 0; if (Math.abs(st.oy) < 0.01) st.oy = 0;
      st.bump = Math.max(0, st.bump - dt * 7);
      st.hurt = Math.max(0, st.hurt - dt);
      st.msgT = Math.max(0, st.msgT - dt);
      const t = ts();
      const want = G.clamp((st.py + st.oy) * t - h * 0.38, -t * 2.2, L.rows * t - h);
      st.camY = st.camY < -9000 ? want : G.lerp(st.camY, want, Math.min(1, dt * 8));
      draw(ctx, w, h, t, dt);
      G.drawFx(ctx, dt);
      G.drawParts(ctx, dt);
      G.drawFloaters(ctx, dt);
      hud();
    });

    function hud() {
      const en = Math.max(0, st.en);
      G.$('#mn-en').style.width = Math.min(100, en / st.max * 100) + '%';
      G.$('#mn-en').className = en / st.max < 0.25 ? 'low' : '';
      G.$('#mn-env').textContent = Math.ceil(en);
      G.$('#mn-depth').textContent = `${st.py * 2} m`;
      const n = Object.values(st.loot).reduce((a, b) => a + b, 0);
      G.$('#mn-loot').textContent = G.L(`Butin : ${n}`, `Loot: ${n}`);
    }

    function draw(ctx, w, h, t, dt) {
      const cam = st.camY;
      // fond peint de la galerie, fixe derrière les tunnels
      ctx.fillStyle = '#070505'; ctx.fillRect(0, 0, w, h);
      if (backdrop) {
        const m = G.coverMap(backdrop, w, h, 0.5, 0.5, w / 2, h / 2);
        G.drawCover(ctx, backdrop, m);
        ctx.fillStyle = 'rgba(8,6,5,.5)'; ctx.fillRect(0, 0, w, h);
      }
      if (cam < 0) {
        ctx.fillStyle = 'rgba(255,220,170,.85)'; ctx.font = '700 13px ' + G.uiFont(); ctx.textAlign = 'center';
        ctx.shadowColor = '#000'; ctx.shadowBlur = 6;
        ctx.fillText(L.name, w / 2, -cam - t * 1.4);
        ctx.shadowBlur = 0;
      }
      const y0 = Math.max(0, Math.floor(cam / t)), y1 = Math.min(L.rows - 1, Math.ceil((cam + h) / t));
      const lr = st.light + 0.5;
      // 1) tuiles (les cases inconnues sont de la roche plongée dans le noir, sans filon visible)
      for (let y = y0; y <= y1; y++) for (let x = 0; x < W; x++) {
        const c = grid[y][x], X = x * t, Y = y * t - cam;
        if (!c.rev) {
          const im = blockImg(c, y);
          if (im) ctx.drawImage(im, X, Y, t + 0.5, t + 0.5);
          ctx.fillStyle = 'rgba(5,4,3,.84)'; ctx.fillRect(X, Y, t + 0.5, t + 0.5);
          continue;
        }
        drawTile(ctx, c, X, Y, t, x, y);
      }
      // 2) ombres des parois et décor dans les cases vides
      for (let y = y0; y <= y1; y++) for (let x = 0; x < W; x++) {
        const c = grid[y][x], X = x * t, Y = y * t - cam;
        if (!c.rev || (c.t !== 'air' && c.t !== 'boulder')) continue;
        // le décor est peint avant les ombres des parois : il recule dans la galerie
        if (c.decor && c.t === 'air') drawDecor(ctx, c, X, Y, t, x, y);
        shade(ctx, X, Y, t, x, y);
      }
      // 3) rochers (par-dessus les ombres)
      for (let y = y0; y <= y1; y++) for (let x = 0; x < W; x++) {
        const c = grid[y][x];
        if (c.rev && c.t === 'boulder') drawBoulder(ctx, c, x * t, y * t - cam, t);
      }
      // 4) gaz
      st.gas.forEach(g => {
        const a = Math.min(1, g.t / 1.5);
        const gx = (g.x + 0.5) * t, gy = (g.y + 0.5) * t - cam;
        g.rot += dt * 0.4;
        G.drawFxNow(ctx, 'gas', gx, gy, t * 3.6 * (1 + Math.sin(performance.now() / 500) * 0.04), a * 0.85, g.rot);
        G.drawFxNow(ctx, 'gas', gx, gy, t * 2.6, a * 0.5, -g.rot * 1.3);
        ctx.fillStyle = `rgba(220,255,180,${a})`; ctx.font = '800 ' + Math.round(t * 0.3) + 'px ' + G.uiFont(); ctx.textAlign = 'center';
        ctx.shadowColor = '#000'; ctx.shadowBlur = 4;
        ctx.fillText(G.L('GAZ ', 'GAS ') + Math.ceil(g.t) + 's', gx, gy - t * 1.6 - 4);
        ctx.shadowBlur = 0;
      });
      // 5) mineur
      drawMiner(ctx, t, cam);
      // 6) obscurité : brouillard hors de la lumière
      for (let y = y0; y <= y1; y++) for (let x = 0; x < W; x++) {
        const c = grid[y][x], X = x * t, Y = y * t - cam;
        if (!c.rev) continue;
        const d2 = (x - st.px) ** 2 + (y - st.py) ** 2;
        if (d2 > lr * lr) { ctx.fillStyle = 'rgba(5,4,3,.6)'; ctx.fillRect(X, Y, t + 1, t + 1); }
        else if (d2 > (lr - 1) * (lr - 1)) { ctx.fillStyle = 'rgba(5,4,3,.28)'; ctx.fillRect(X, Y, t + 1, t + 1); }
      }
      // halo chaud de la lampe frontale
      const lx = (st.px + 0.5 + st.ox) * t, ly = (st.py + 0.3 + st.oy) * t - cam;
      const halo = ctx.createRadialGradient(lx, ly, t * 0.3, lx, ly, t * (st.light + 1.2));
      halo.addColorStop(0, 'rgba(255,200,110,.16)'); halo.addColorStop(1, 'rgba(255,190,90,0)');
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = halo; ctx.fillRect(lx - t * 5, ly - t * 5, t * 10, t * 10); ctx.restore();
      if (st.msgT > 0) {
        ctx.globalAlpha = Math.min(1, st.msgT * 2);
        ctx.fillStyle = 'rgba(15,10,8,.88)'; G.roundRect(ctx, 12, h - 46, w - 24, 34, 10); ctx.fill();
        ctx.fillStyle = '#ffd9a8'; ctx.font = '600 14px ' + G.uiFont(); ctx.textAlign = 'center'; ctx.fillText(st.msg, w / 2, h - 24);
        ctx.globalAlpha = 1;
      }
      if (st.py === 0 && st.deepest === 0 && !st.done) {
        ctx.fillStyle = '#ffd27a'; ctx.font = '700 14px ' + G.uiFont(); ctx.textAlign = 'center';
        ctx.shadowColor = '#000'; ctx.shadowBlur = 6;
        ctx.fillText(G.L('Touche sous le mineur pour creuser vers le bas', 'Tap below the miner to dig down'), w / 2, 2.5 * t - cam + 8);
        ctx.shadowBlur = 0;
      }
    }

    function blockImg(c, y) {
      if (c.t === 'bedrock') return IMG('bedrock');
      if (L.id === 1 && y === 1) return IMG('surface');
      return IMG('t' + Math.min(6, Math.max(1, c.h)));
    }

    function drawTile(ctx, c, X, Y, t, x, y) {
      if (c.t === 'air' || c.t === 'boulder') return;
      if (c.t === 'chest') {
        const wall = IMG('wall');
        if (wall) ctx.drawImage(wall, X, Y, t + 0.5, t + 0.5);
        const ch = IMG(c.note ? 'chest_hogar' : 'chest');
        if (ch) ctx.drawImage(ch, X + t * 0.08, Y + t * 0.12, t * 0.84, t * 0.84);
      } else {
        const im = blockImg(c, y);
        if (im) {
          // variation : miroir horizontal et teinte légère pour casser la répétition
          if (c.sp[0] < 0.5) { ctx.save(); ctx.translate(X + t, Y); ctx.scale(-1, 1); ctx.drawImage(im, 0, 0, t + 0.5, t + 0.5); ctx.restore(); }
          else ctx.drawImage(im, X, Y, t + 0.5, t + 0.5);
          if (c.sp[1] > 0.55) { ctx.fillStyle = `rgba(0,0,0,${(c.sp[1] - 0.55) * 0.3})`; ctx.fillRect(X, Y, t + 0.5, t + 0.5); }
        } else { ctx.fillStyle = ROCK[c.h] || '#333'; ctx.fillRect(X, Y, t + 1, t + 1); }
        if (c.gas) {
          const g = IMG('gas'), pu = 1 + Math.sin(performance.now() / 300 + x + y) * 0.04;
          if (g) { const s = t * 0.96 * pu; ctx.drawImage(g, X + (t - s) / 2, Y + (t - s) / 2, s, s); }
        }
        if (c.ore) {
          const o = IMG('ore_' + c.ore);
          if (o) {
            const s = t * (G.ITEMS[c.ore].kind === 'gem' ? 0.7 : 0.78);
            ctx.drawImage(o, X + (t - s) / 2 + (c.sp[2] - 0.5) * t * 0.08, Y + (t - s) / 2 + (c.sp[3] - 0.5) * t * 0.08, s, s);
            const tw = (Math.sin(performance.now() / 380 + x * 2 + y) + 1) / 2;
            if (tw > 0.85) G.drawFxNow(ctx, 'spark', X + t * (0.3 + c.sp[4] * 0.4), Y + t * (0.3 + c.sp[5] * 0.4), t * 0.45, (tw - 0.85) * 5);
          }
        }
      }
      if (c.hp < c.max) {
        const k = 1 - c.hp / c.max, cr = IMG(k < 0.5 ? 'crack1' : 'crack2');
        if (cr) { ctx.globalAlpha = 0.9; ctx.drawImage(cr, X + t * 0.04, Y + t * 0.04, t * 0.92, t * 0.92); ctx.globalAlpha = 1; }
      }
    }

    // ombre portée des parois sur une case vide : donne du relief au tunnel
    function shade(ctx, X, Y, t, x, y) {
      const d = t * 0.26;
      const strip = (x0, y0, x1, y1, gx0, gy0, gx1, gy1) => {
        const g = ctx.createLinearGradient(gx0, gy0, gx1, gy1);
        g.addColorStop(0, 'rgba(6,4,3,.75)'); g.addColorStop(1, 'rgba(6,4,3,0)');
        ctx.fillStyle = g; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
      };
      if (solid(x, y - 1)) strip(X, Y, X + t, Y + d, X, Y, X, Y + d);
      if (solid(x, y + 1)) strip(X, Y + t - d * 0.6, X + t, Y + t, X, Y + t, X, Y + t - d * 0.6);
      if (solid(x - 1, y)) strip(X, Y, X + d, Y + t, X, Y, X + d, Y);
      if (solid(x + 1, y)) strip(X + t - d, Y, X + t, Y + t, X + t, Y, X + t - d, Y);
    }

    // décor d'arrière-plan : version assombrie et désaturée (mise en cache), pour ne pas passer pour un objet à ramasser ou un danger
    const DIM = {};
    function dimImg(id) {
      if (DIM[id]) return DIM[id];
      const src = IMG('deco_' + id);
      if (!src || !src.width) return null;
      const cv = document.createElement('canvas'); cv.width = src.width; cv.height = src.height;
      const g = cv.getContext('2d');
      g.drawImage(src, 0, 0);
      if (id !== 'lanterne') { g.globalCompositeOperation = 'saturation'; g.fillStyle = 'rgba(128,128,128,.55)'; g.fillRect(0, 0, cv.width, cv.height); }
      g.globalCompositeOperation = 'source-atop'; g.fillStyle = id === 'lanterne' ? 'rgba(20,14,10,.25)' : 'rgba(22,17,13,.45)'; g.fillRect(0, 0, cv.width, cv.height);
      g.globalCompositeOperation = 'destination-in'; g.drawImage(src, 0, 0);
      return (DIM[id] = cv);
    }
    // chaque décor est posé contre la case qui le porte (plafond, sol ou paroi) ;
    // si cette case est creusée, le décor tombe avec elle.
    // Repères mesurés dans les images 160 px : bas du contenu, haut, bord gauche.
    const DECO_BOX = { champi: { b: 152 }, crane: { b: 109 }, wagon: { b: 143 }, stalactite: { t: 5 }, toile: { l: 11, t: 16 }, lanterne: { l: 23, t: 5 }, etai: { t: 5, b: 155 } };
    function decoSupports(c, x, y) {
      const a = DECOR[c.decor].anchor;
      if (a === 'top') return solid(x, y - 1) ? [[x, y - 1]] : null;
      if (a === 'floor') return solid(x, y + 1) ? [[x, y + 1]] : null;
      if (a === 'full') return solid(x, y - 1) && solid(x, y + 1) ? [[x, y - 1], [x, y + 1]] : null;
      // paroi (lanterne) : à droite de préférence ; coin (toile) : plafond + une paroi
      const sides = c.decor === 'lanterne' ? [1, -1] : (c.sp[5] < 0.5 ? [1, -1] : [-1, 1]);
      const side = sides.find(sd => solid(x + sd, y));
      if (side === undefined) return null;
      c.side = side;
      if (a === 'corner') return solid(x, y - 1) ? [[x, y - 1], [x + side, y]] : null;
      return [[x + side, y]];
    }
    function drawDecor(ctx, c, X, Y, t, x, y) {
      if (c.sup === undefined) { c.sup = decoSupports(c, x, y); if (!c.sup) { c.decor = null; return; } }
      if (c.sup.some(([sx, sy]) => !solid(sx, sy))) {
        // la case porteuse a été creusée : le décor s'effondre avec elle
        G.fx('dust', X + t / 2, Y + t / 2, { size: t * 0.9, life: 0.4, alpha: 0.5 });
        c.decor = null; c.sup = undefined; return;
      }
      const im = dimImg(c.decor);
      if (!im) return;
      const a = DECOR[c.decor].anchor, bx = DECO_BOX[c.decor];
      // flip : miroir autour du centre de la case ; on calcule toujours la position « côté gauche »
      const flip = (a === 'wall' || a === 'corner') ? c.side > 0 : c.sp[5] < 0.5;
      const put = (dx, dy, dw, dh) => {
        if (flip) { ctx.save(); ctx.translate(2 * X + t, 0); ctx.scale(-1, 1); ctx.drawImage(im, dx, dy, dw, dh); ctx.restore(); }
        else ctx.drawImage(im, dx, dy, dw, dh);
      };
      const sink = t * 0.03;   // mord un peu dans la case porteuse
      if (a === 'top') {
        const S = t * 0.52;
        put(X + (t - S) / 2 + (c.sp[4] - 0.5) * t * 0.2, Y - S * bx.t / 160 - sink, S, S);
      } else if (a === 'floor') {
        const S = t * (c.decor === 'wagon' ? 0.8 : c.decor === 'champi' ? 0.4 : 0.46);
        put(X + (t - S) / 2 + (c.sp[4] - 0.5) * t * 0.2, Y + t - S * bx.b / 160 + sink, S, S);
      } else if (a === 'corner') {
        const S = t * 0.6;
        put(X - S * bx.l / 160 - sink, Y - S * bx.t / 160 - sink, S, S);
      } else if (a === 'wall') {
        const S = t * 0.52;
        put(X - S * bx.l / 160 - sink, Y + t * 0.1, S, S);
        // la flamme suit la lanterne (centre du verre ≈ 45 % / 68 % de l'image)
        const lx = flip ? 2 * X + t - (X - S * bx.l / 160 - sink + S * 0.45) : X - S * bx.l / 160 - sink + S * 0.45;
        G.drawFxNow(ctx, 'flames', lx, Y + t * 0.1 + S * 0.68, t * 0.42, 0.22 + Math.sin(performance.now() / 160 + x) * 0.05);
      } else if (a === 'full') {
        const H = t * 160 / (bx.b - bx.t) + sink * 2;
        put(X + (t - H) / 2, Y - H * bx.t / 160 - sink, H, H);
      }
    }

    function drawBoulder(ctx, c, X, Y, t) {
      const b = IMG('boulder');
      const wob = c.wobble > 0 ? Math.sin(performance.now() / 30) * t * 0.05 : 0;
      const fy = (c.fall || 0) * -t;
      if (b) ctx.drawImage(b, X + t * 0.04 + wob, Y + t * 0.04 + fy, t * 0.92, t * 0.92);
      if (c.wobble > 0) {
        ctx.fillStyle = '#ffb36a'; ctx.font = '800 ' + Math.round(t * 0.45) + 'px ' + G.uiFont(); ctx.textAlign = 'center';
        ctx.shadowColor = '#000'; ctx.shadowBlur = 5; ctx.fillText('!', X + t / 2, Y - t * 0.08); ctx.shadowBlur = 0;
      }
    }

    function drawMiner(ctx, t, cam) {
      const im = POSE(st.pose) || POSE('idle');
      const bx = st.bumpDx * st.bump * t * 0.12, by = st.bumpDy * st.bump * t * 0.12;
      const cx = (st.px + 0.5 + st.ox) * t + bx, feet = (st.py + 1 + st.oy) * t - cam + by - t * 0.02;
      if (!im) return;
      const hgt = t * 1.32, wid = hgt * im.width / im.height;
      const ax = wid * (79 / 159);
      ctx.save();
      ctx.translate(cx, feet);
      if (st.face < 0) ctx.scale(-1, 1);
      if (st.hurt > 0 && Math.floor(st.hurt * 20) % 2) ctx.globalAlpha = 0.6;
      ctx.drawImage(im, -ax, -hgt, wid, hgt);
      ctx.restore();
      if (st.inGas) G.drawFxNow(ctx, 'poison', cx, feet - hgt * 0.6, t * 1.1, 0.35 + Math.sin(performance.now() / 150) * 0.1);
    }

    async function faint() {
      if (st.done) return;
      st.done = true; st.fainted = true;
      G.sfx('lose'); G.vibrate([80, 40, 80]);
      const kept = {};
      for (const k in st.loot) kept[k] = Math.floor(st.loot[k] / 2);
      await G.sleep(900);
      finish(kept, [G.L('Tu t’effondres, épuisé. Des mineurs te ramènent à la surface.', 'You collapse, exhausted. Miners carry you back to the surface.'), G.L('La moitié de ton butin est restée au fond.', 'Half your loot stayed at the bottom.')]);
    }

    function leave() {
      if (st.done) return;
      st.done = true;
      G.sfx('ore');
      finish(st.loot, [G.L(`Tu remontes à la lumière depuis ${st.deepest * 2} m.`, `You climb back to daylight from ${st.deepest * 2} m.`)]);
    }

    async function finish(items, lines) {
      for (const k in items) G.add(k, items[k]);
      if (st.gold) { G.state.gold += st.gold; lines.push(G.L(`Trouvé dans une cache : ${st.gold} or.`, `Found in a cache: ${st.gold} gold.`)); }
      const prev = G.state.best.depth[L.id] || 0;
      if (st.deepest * 2 > prev) { G.state.best.depth[L.id] = st.deepest * 2; if (prev) lines.push(G.L(`Nouveau record : ${st.deepest * 2} m !`, `New record: ${st.deepest * 2} m!`)); }
      G.save();
      await G.summary(L.name, lines, items);
      G.toHub('mine');
    }
  };
})();
