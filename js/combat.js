/* La Dernière Forge — Chasse : combat au tour par tour avec timing d'attaque et de parade */
(function () {
  const C = {};
  G.combat = C;

  C.hunt = function (zoneId, boss) {
    const z = G.ZONES[zoneId];
    const P = G.player();
    const run = { z, zoneId, boss, idx: 0, total: boss ? 1 : z.fights, loot: {}, gold: 0, hp: P.hpMax, P };
    nextFight(run);
  };

  function nextFight(run) {
    const id = run.boss ? run.z.boss : pickEnemy(run);
    fight(run, id);
  }
  function pickEnemy(run) {
    // le dernier combat d'une chasse est plus coriace : on évite le plus faible
    return G.pick(run.z.pool);
  }

  // combats renforcés : PV, dégâts, carapace et soins revus pour un équipement de fin de partie ; butin doublé et gemmes
  C.hardify = E0 => hardify(E0);
  function hardify(E0) {
    const E = Object.assign({}, E0);
    const k = E0.boss ? 1 : 0;
    E.hp = Math.round((E0.hp + 60) * (k ? 3.2 : 3));
    if (E0.armor) E.armor = Math.round(E0.armor * 1.6);
    const dmg = d => Math.round(d * 1.3 + 6 + k * 2);
    E.moves = E0.moves.map(([t, w, o]) => {
      const n = Object.assign({}, o);
      if (n.dmg) n.dmg = dmg(n.dmg);
      if (n.next) n.next = Object.assign({}, n.next, { dmg: dmg(n.next.dmg) });
      if (n.armor) n.armor = Math.round(n.armor * 1.6);
      if (n.hp) n.hp = Math.round(n.hp * 3);
      return [t, w, n];
    });
    E.gold = [E0.gold[0] * 3 + 10, E0.gold[1] * 3 + 20];
    E.drops = E0.drops.map(([id, a, b, ch]) => [id, a * 2, b * 2, ch]).concat([['rubis', 1, 1, 0.1], ['saphir', 1, 1, 0.1], ['quartz', 1, 1, 0.14], ['cristal', 1, 1, E0.boss ? 0.5 : 0.05]]);
    E.hard = true;
    return E;
  }

  // jauge : icône peinte, piste creusée, remplissage brillant et traînée de dégâts
  function gauge(id, kind, icon) {
    return `<div class="gauge g-${kind}" data-base="gauge g-${kind}" id="${id}"><span class="g-ico">${G.icon(icon, 34)}</span><div class="g-track"><i class="g-trail"></i><i class="g-fill"></i><i class="g-ticks"></i><i class="g-gloss"></i><em class="g-val"></em></div></div>`;
  }
  function setGauge(id, frac, text, cls) {
    const g = G.$('#' + id);
    if (!g) return;
    const pct = Math.max(0, Math.min(1, frac)) * 100 + '%';
    const fill = G.$('.g-fill', g), trail = G.$('.g-trail', g);
    const prev = parseFloat(fill.style.width) || 100;
    fill.style.width = pct;
    // la traînée claire rattrape le remplissage avec un temps de retard quand on perd des points
    if (parseFloat(pct) < prev) trail.style.width = prev + '%';
    clearTimeout(g._t); g._t = setTimeout(() => { trail.style.width = pct; }, 380);
    if (parseFloat(pct) >= prev) trail.style.width = pct;
    G.$('.g-val', g).textContent = text;
    g.className = g.dataset.base + (cls ? ' ' + cls : '');
  }
  const INTENT_ICON = { atk: 'tab_chasse', heavy: 'masse_acier', guard: 'bouclier', buff: 'croc', rust: 'noyau_rouille', heal: 'potion', roar: 'plume' };

  function fight(run, eid) {
    // après la fin de l'histoire : combats renforcés (si l'option est active), pensés pour Lame d'Aube + armure d'argent, plus de butin
    const HARD = !!G.state.ended && G.state.hard !== false;
    const E = HARD ? hardify(G.ENEMIES[eid]) : G.ENEMIES[eid], P = run.P;
    // le roi revient en revanche sans la mécanique de Hogar (déjà libéré, ou rentré au village)
    const FINAL = !!E.final && !G.state.ended;
    const en = { id: eid, d: E, hp: E.hp, max: E.hp, armor: E.armor || 0, buff: 0, intent: null, prep: null };
    const gemElan = P.gemElan >= 0.7 || Math.random() < P.gemElan ? 1 : 0;
    const me = { hp: run.hp, max: P.hpMax, elan: Math.min(3, (G.hasPerk('benediction') ? 1 : 0) + gemElan), stance: false, poison: null, rust: 0, rustWarned: false };
    // combat final : Hogar est enchaîné à l'enclume du roi par 3 entraves ; tant qu'il frappe pour lui, la couronne se répare
    if (FINAL) { en.chains = 3; en.freed = false; G.state.hogarFreed = false; }
    const scr = G.$('#s-combat');
    const monImg = G.softImg('img/monstres/' + eid + '.webp');
    const bgImg = G.imgEl('img/decors/' + run.zoneId + '.webp');
    // animation du monstre dans la scène
    const mon = { shake: 0, lunge: 0, flash: 0, dead: 0, t: 0 };
    scr.innerHTML = `
      <header class="mg-top"><div><span class="eyebrow">${run.z.name}</span><b>${run.boss ? G.L('Combat de boss', 'Boss fight') : G.L(`Combat ${run.idx + 1} / ${run.total}`, `Fight ${run.idx + 1} / ${run.total}`)}</b></div>
        <div class="mg-top-r"><div class="cb-loot" id="cb-loot"></div>${G.helpBtn('combat')}</div></header>
      <div class="cb-enemy ${E.boss ? 'boss' : ''}">
        <div class="cb-info">
          <div class="cb-namerow"><b class="cb-name">${E.name}</b><div class="tags" id="cb-etags"></div></div>
          ${gauge('cb-ehp', 'foe', 'coeur')}
          ${gauge('cb-earm', 'armor', 'bouclier')}
          <div class="intent" id="cb-intent"></div>
        </div>
      </div>
      <div class="mg-stage cb-stage"><canvas id="cb-cv"></canvas><div class="cb-log" id="cb-log"></div></div>
      <div class="cb-me">
        <div class="cb-me-row">${gauge('cb-mhp', 'me', 'coeur')}<div class="elan" id="cb-elan" aria-label="${G.L('Élan', 'Momentum')}"></div></div>
        <div class="tags" id="cb-mtags"></div>
      </div>
      <div class="cb-actions" id="cb-actions"></div>`;
    G.show('s-combat');
    G.music(E.boss ? 'boss' : 'chasse');
    const cv = G.$('#cb-cv');
    let sz = G.fitCanvas(cv);
    window.onresize = () => { if (G.current === 's-combat') sz = G.fitCanvas(cv); };

    let qte = null;   // QTE en cours
    let over = false;
    G._dbg = { en, me, run, get qte() { return qte; } };

    // toucher n'importe où dans la scène pendant un QTE
    scr.onpointerdown = e => {
      if (!qte) return;
      if (e.target.closest('button')) return;
      e.preventDefault();
      qte.tap();
    };

    G.bindHelp(scr, 'combat');
    // géométrie de la scène : le monstre au centre, les QTE autour
    function geo() {
      const { w, h } = sz;
      const ms = Math.min(w * 0.7, h * 0.66, 300);
      return { x: w / 2, y: Math.max(ms / 2 + 18, h * 0.42), ms, barY: Math.min(h - 40, h * 0.42 + ms / 2 + 4) };
    }
    G.loop(dt => {
      const { ctx, w, h } = sz;
      ctx.clearRect(0, 0, w, h);
      drawScene(ctx, w, h, dt);
      if (qte) qte.draw(ctx, w, h, dt);
      G.drawFx(ctx, dt);
      G.drawParts(ctx, dt);
      G.drawFloaters(ctx, dt);
    });

    function drawScene(ctx, w, h, dt) {
      mon.t += dt; mon.shake = Math.max(0, mon.shake - dt); mon.lunge = Math.max(0, mon.lunge - dt); mon.flash = Math.max(0, mon.flash - dt);
      if (over && en.hp <= 0) mon.dead = Math.min(1, mon.dead + dt * 1.5);
      if (bgImg) {
        const s = Math.max(w / bgImg.width, h / bgImg.height);
        const iw = bgImg.width * s, ih = bgImg.height * s;
        ctx.drawImage(bgImg, (w - iw) / 2, (h - ih) / 2, iw, ih);
        ctx.fillStyle = 'rgba(14,10,8,.5)'; ctx.fillRect(0, 0, w, h);
      } else {
        const g = ctx.createRadialGradient(w / 2, h * 0.45, 10, w / 2, h * 0.45, h * 0.8);
        g.addColorStop(0, E.boss ? '#3a160c' : '#2a221c'); g.addColorStop(1, '#100c0a');
        ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      }
      const v = ctx.createRadialGradient(w / 2, h / 2, h * 0.25, w / 2, h / 2, h * 0.85);
      v.addColorStop(0, 'rgba(10,7,5,0)'); v.addColorStop(1, 'rgba(10,7,5,.75)');
      ctx.fillStyle = v; ctx.fillRect(0, 0, w, h);
      const G0 = geo();
      const breath = 1 + Math.sin(mon.t * 2) * 0.012;
      const lk = mon.lunge > 0 ? Math.sin((1 - mon.lunge / 0.35) * Math.PI) : 0;
      const sc = (E.boss ? 1.05 : 1) * breath * (1 + lk * 0.12) * (1 - mon.dead * 0.1);
      const sx = mon.shake > 0 ? Math.sin(mon.t * 70) * 8 * (mon.shake / 0.3) : 0;
      const size = G0.ms * sc;
      ctx.save();
      ctx.globalAlpha = 1 - mon.dead * 0.75;
      ctx.translate(G0.x + sx, G0.y + lk * 14);
      if (E.boss) {
        const aura = ctx.createRadialGradient(0, 0, size * 0.2, 0, 0, size * 0.65);
        aura.addColorStop(0, 'rgba(255,90,40,.25)'); aura.addColorStop(1, 'rgba(255,90,40,0)');
        ctx.fillStyle = aura; ctx.fillRect(-size, -size, size * 2, size * 2);
      }
      if (monImg) ctx.drawImage(monImg, -size / 2, -size / 2, size, size);
      else { ctx.font = `${Math.round(size * 0.55)}px serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(E.emoji, 0, 0); ctx.textBaseline = 'alphabetic'; }
      if (mon.flash > 0) {
        ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = mon.flash / 0.15 * 0.5;
        const fl = ctx.createRadialGradient(0, 0, 4, 0, 0, size * 0.45);
        fl.addColorStop(0, 'rgba(255,240,200,1)'); fl.addColorStop(1, 'rgba(255,240,200,0)');
        ctx.fillStyle = fl; ctx.fillRect(-size / 2, -size / 2, size, size);
      }
      ctx.restore();
      if (mon.dead > 0) { ctx.fillStyle = `rgba(10,7,5,${mon.dead * 0.35})`; ctx.fillRect(0, 0, w, h); }
    }
    function monHit() { mon.shake = 0.3; mon.flash = 0.15; }

    function log(t) { G.$('#cb-log').innerHTML = t; }
    function ui() {
      setGauge('cb-ehp', en.hp / en.max, `${Math.max(0, Math.ceil(en.hp))} / ${en.max}`);
      // la jauge de carapace garde sa place même vide : la scène ne doit pas changer de taille
      G.$('#cb-earm').style.visibility = en.armor > 0 ? 'visible' : 'hidden';
      setGauge('cb-earm', en.armor / Math.max(E.armor || 20, en.armor), G.L(`Carapace ${Math.ceil(en.armor)}`, `Shell ${Math.ceil(en.armor)}`));
      setGauge('cb-mhp', me.hp / me.max, `${Math.max(0, Math.ceil(me.hp))} / ${me.max} ${G.L('PV', 'HP')}`, me.hp / me.max < 0.3 ? 'g-low' : '');
      const gem = G.iconSrc('cristal');
      G.$('#cb-elan').innerHTML = [0, 1, 2].map(i => `<span class="gem ${i < me.elan ? 'on' : ''}">${gem ? `<img src="${gem}" alt="">` : '<i></i>'}</span>`).join('');
      const et = [];
      if (E.hard) et.push(`<span class="tag bad">${G.L('Renforcé', 'Hardened')}</span>`);
      if (FINAL) et.push(en.freed ? `<span class="tag good">${G.L('Hogar libre', 'Hogar free')}</span>` : `<span class="tag bad">${G.L(`Hogar : ${en.chains} entrave${en.chains > 1 ? 's' : ''}`, `Hogar: ${en.chains} shackle${en.chains > 1 ? 's' : ''}`)}</span>`);
      if (E.weak) et.push(`<span class="tag">${G.L('Faible :', 'Weak:')} ${E.weak === 'aube' ? G.itemName('lame_aube') : G.L(E.weak, { tranchant: 'slashing', contondant: 'blunt' }[E.weak] || E.weak)}</span>`);
      if (E.rust) et.push(`<span class="tag rust">${G.L('Rouille', 'Rust')}</span>`);
      if (E.evade) et.push(`<span class="tag">${G.L('Esquive', 'Dodge')}</span>`);
      if (en.buff) et.push(`<span class="tag bad">${G.L('ATQ', 'ATK')} +${en.buff}</span>`);
      G.$('#cb-etags').innerHTML = et.join('');
      const mt = [];
      if (me.stance) mt.push(`<span class="tag good">${G.L('En garde', 'On guard')}</span>`);
      if (me.poison) mt.push(`<span class="tag bad">${G.L('Poison', 'Poison')} ${me.poison.dmg} (${me.poison.turns})</span>`);
      if (me.rust) mt.push(`<span class="tag rust">${G.L('DÉF', 'DEF')} −${me.rust}</span>`);
      G.$('#cb-mtags').innerHTML = mt.join('');
      const lt = Object.keys(run.loot).filter(k => run.loot[k] > 0);
      G.$('#cb-loot').innerHTML = lt.map(k => `<span>${G.icon(k, 18)}${run.loot[k]}</span>`).join('');
    }

    /* ----- intentions ennemies ----- */
    function chooseIntent() {
      if (en.prep) { en.intent = { t: 'heavy', dmg: en.prep.dmg, name: en.prep.name }; en.prep = null; return; }
      let moves = E.moves.filter(m => {
        if (m[0] === 'heal' && en.hp > en.max * 0.6) return false;
        if (m[0] === 'heal' && E.final && (en.freed || G.state.ended)) return false;
        if (m[0] === 'guard' && en.armor > (E.armor || 10) * 0.6) return false;
        if (m[0] === 'buff' && en.buff >= 4) return false;
        if (m[0] === 'rust' && (P.rustproof || me.rust >= 3)) return false;
        if (m[0] === 'poison' && me.poison) return false;
        if (m[0] === 'roar' && me.elan === 0) return false;
        return true;
      });
      if (!moves.length) moves = E.moves.filter(m => m[0] === 'atk');
      const m = G.wpick(moves);
      en.intent = Object.assign({ t: m[0] }, m[2]);
    }
    function intentHTML() {
      const i = en.intent, b = en.buff;
      if (!i) return '';
      const ico = k => {
        if (k === 'prep') return `<img class="fxico" src="${G.img('img/fx/spark.webp') || ''}" alt="">`;
        if (k === 'poison') return `<img class="fxico" src="${G.img('img/fx/poison.webp') || ''}" alt="">`;
        return G.icon(INTENT_ICON[k] || 'tab_chasse', 34);
      };
      const val = {
        atk: () => `<b class="iv">${i.dmg + b}${i.hits > 1 ? '<small>×' + i.hits + '</small>' : ''}</b>`,
        heavy: () => `<b class="iv danger">${i.dmg + b}</b>`,
        prep: () => `<span class="isub">${G.L('prépare', 'readies')} ${i.next.name} <b>${i.next.dmg + b}</b></span>`,
        guard: () => `<span class="isub">+${i.armor} ${G.L('carapace', 'shell')}</span>`,
        buff: () => `<span class="isub">${G.L('ATQ', 'ATK')} +${i.atk}</span>`,
        rust: () => `<span class="isub">${G.L('DÉF', 'DEF')} −${i.def}</span>`,
        heal: () => `<span class="isub">+${i.hp} ${G.L('PV', 'HP')}</span>`,
        poison: () => `<span class="isub">${i.dmg} ${G.L('par tour', 'per turn')}</span>`,
        roar: () => `<span class="isub">${G.L('vide ton élan', 'drains your momentum')}</span>`,
      }[i.t]();
      const kind = i.t === 'heavy' ? 'danger' : (i.t === 'atk' || i.t === 'poison') ? 'atk' : 'other';
      return `<div class="int-card int-${kind}"><span class="int-ico">${ico(i.t)}</span><div class="int-main"><span class="eyebrow">${G.L('Intention', 'Intent')}</span><b>${i.name}</b></div>${val}</div>`;
    }

    /* ----- QTE d'attaque : arrêter le curseur dans la zone ----- */
    function qteAttack(power) {
      return new Promise(res => {
        const heavyW = P.wkind === 'mace', dagger = P.wkind === 'dagger';
        let dur = (heavyW ? 1.3 : dagger ? 0.95 : 1.05) / (E.agi || 1);
        let good = heavyW ? 0.26 : 0.2, perf = heavyW ? 0.075 : 0.06;
        if (power) { dur *= 0.8; good *= 0.8; perf *= 0.85; }
        const center = G.rand(0.42 + good / 2, 0.9 - good / 2);
        let t = -0.35, done = false;
        qtePanel('atk');
        qte = {
          tap() {
            if (done || t < 0) return;
            done = true;
            const x = t / dur, d = Math.abs(x - center);
            const g = d <= perf / 2 ? 2 : d <= good / 2 ? 1 : 0;
            qzResult(g);
            setTimeout(() => { qte = null; setActions(false); res(g); }, 260);
            qte.result = g;
          },
          draw(ctx, w, h, dt) {
            if (!done) { t += dt; if (t > dur) { done = true; qte.result = 0; setTimeout(() => { qte = null; setActions(false); res(0); }, 260); } }
            const bw = Math.min(w - 48, 420), bx = (w - bw) / 2, bh = 34, by = geo().barY - bh / 2;
            const prog = G.clamp(Math.max(0, t) / dur, 0, 1), x = bx + bw * prog;
            // cadre en laiton
            ctx.save();
            ctx.shadowColor = 'rgba(0,0,0,.7)'; ctx.shadowBlur = 14;
            const fr = ctx.createLinearGradient(0, by - 6, 0, by + bh + 6);
            fr.addColorStop(0, '#d9a85a'); fr.addColorStop(0.5, '#7a5226'); fr.addColorStop(1, '#3a2412');
            ctx.fillStyle = fr; G.roundRect(ctx, bx - 6, by - 6, bw + 12, bh + 12, 14); ctx.fill();
            ctx.restore();
            const tr = ctx.createLinearGradient(0, by, 0, by + bh);
            tr.addColorStop(0, '#0b0807'); tr.addColorStop(1, '#241a14');
            ctx.fillStyle = tr; G.roundRect(ctx, bx, by, bw, bh, 9); ctx.fill();
            ctx.save(); G.roundRect(ctx, bx, by, bw, bh, 9); ctx.clip();
            // zone « bien » puis zone « parfait », lumineuses
            const gx = bx + bw * (center - good / 2), gw2 = bw * good;
            const gg = ctx.createLinearGradient(0, by, 0, by + bh);
            gg.addColorStop(0, 'rgba(255,170,70,.85)'); gg.addColorStop(1, 'rgba(190,90,30,.85)');
            ctx.fillStyle = gg; ctx.fillRect(gx, by, gw2, bh);
            const px2 = bx + bw * (center - perf / 2), pw2 = bw * perf;
            ctx.shadowColor = '#ffe08a'; ctx.shadowBlur = 16;
            const pg = ctx.createLinearGradient(0, by, 0, by + bh);
            pg.addColorStop(0, '#fff8d8'); pg.addColorStop(1, '#ffd060');
            ctx.fillStyle = pg; ctx.fillRect(px2, by, pw2, bh);
            ctx.shadowBlur = 0;
            // reflet
            ctx.fillStyle = 'rgba(255,255,255,.08)'; ctx.fillRect(bx, by, bw, bh * 0.4);
            ctx.restore();
            // curseur : trait lumineux et deux pointes
            const cc = qte.result === undefined ? '#ffffff' : ['#ff7a6a', '#ffb347', '#fff2a8'][qte.result];
            ctx.save();
            ctx.shadowColor = cc; ctx.shadowBlur = 14; ctx.fillStyle = cc;
            ctx.fillRect(x - 2.5, by - 4, 5, bh + 8);
            ctx.beginPath(); ctx.moveTo(x - 9, by - 14); ctx.lineTo(x + 9, by - 14); ctx.lineTo(x, by - 3); ctx.closePath(); ctx.fill();
            ctx.beginPath(); ctx.moveTo(x - 9, by + bh + 14); ctx.lineTo(x + 9, by + bh + 14); ctx.lineTo(x, by + bh + 3); ctx.closePath(); ctx.fill();
            ctx.restore();
            ctx.font = '700 15px ' + G.uiFont(); ctx.textAlign = 'center'; ctx.fillStyle = '#f3e6d4';
            ctx.shadowColor = '#000'; ctx.shadowBlur = 6;
            ctx.fillText(power ? G.L('Coup puissant : vise la zone claire !', 'Power strike: aim for the bright zone!') : G.L('Touche quand le curseur passe dans la zone', 'Tap when the cursor crosses the zone'), w / 2, by - 24);
            if (qte.result !== undefined) {
              ctx.font = '700 28px ' + G.dispFont(); ctx.fillStyle = ['#ff8a6a', '#ffd27a', '#fff2a8'][qte.result];
              ctx.fillText(G.L(['Raté', 'Bien', 'Parfait !'], ['Miss', 'Good', 'Perfect!'])[qte.result], w / 2, by + bh + 46);
            }
            ctx.shadowBlur = 0;
          },
        };
      });
    }

    /* ----- QTE de parade : toucher quand l'anneau se referme ----- */
    function qteDefend(hits, heavy) {
      return new Promise(res => {
        const app = 0.85 / (E.agi || 1);
        const pw = (me.stance ? 0.11 : 0.075) * (P.parryMult || 1), gw = (me.stance ? 0.22 : 0.16) * (P.parryMult || 1);
        const rings = [];
        let start = G.rand(0.35, 0.95);
        for (let i = 0; i < hits; i++) { rings.push({ at: start + app, g: null }); start += G.rand(0.42, 0.62); }
        let t = 0, ended = false;
        const results = [];
        const judge = (r, g) => {
          r.g = g; results.push(g); mon.lunge = 0.35;
          qzResult(g);
          const gy = geo().y;
          if (g === 2) { G.sfx('parry'); G.float(sz.w / 2, gy - 60, G.L('Paré !', 'Parried!'), '#bfe6ff', 24); G.fx('parry', sz.w / 2, gy, { size: 200, life: 0.45, rot: Math.random() * 6 }); G.vibrate(15); }
          else if (g === 1) { G.sfx('clang', 0); G.float(sz.w / 2, gy - 60, G.L('Bloqué', 'Blocked'), '#ffffff', 20); G.fx('spark', sz.w / 2, gy, { size: 120, life: 0.3 }); }
          else { G.float(sz.w / 2, gy - 60, G.L('Touché', 'Hit'), '#ff8a6a', 20); G.fx('slash', sz.w / 2, gy + 20, { size: 220, life: 0.35, rot: 2.2 + Math.random(), alpha: 0.8 }); }
          onHit(g, heavy);
        };
        qtePanel('par');
        qte = {
          tap() {
            const r = rings.find(x => x.g === null);
            if (!r) return;
            const err = t - r.at;
            if (err < -0.35) return;                 // bien trop tôt : ignoré
            const a = Math.abs(err);
            judge(r, a <= pw ? 2 : a <= gw ? 1 : 0);
          },
          draw(ctx, w, h, dt) {
            t += dt;
            rings.forEach(r => { if (r.g === null && t > r.at + gw) judge(r, 0); });
            if (!ended && rings.every(r => r.g !== null)) { ended = true; setTimeout(() => { qte = null; setActions(false); res(results); }, 380); }
            const cx = w / 2, cy = geo().y, R = 62, SH = 34, DIST = 115;
            ctx.fillStyle = 'rgba(10,7,5,.45)'; ctx.beginPath(); ctx.arc(cx, cy, R + DIST * 0.75, 0, 7); ctx.fill();
            // bouclier
            const sh = G.imgEl('img/forge/tool_shield.webp');
            if (sh) {
              if (me.stance) G.drawFxNow(ctx, 'parry', cx, cy, SH * 3.4, 0.35 + Math.sin(performance.now() / 200) * 0.1);
              ctx.drawImage(sh, cx - SH, cy - SH, SH * 2, SH * 2);
            } else {
              ctx.fillStyle = me.stance ? '#4a6a8a' : '#4a3a2e'; ctx.strokeStyle = '#d9cbb8'; ctx.lineWidth = 3;
              ctx.beginPath(); ctx.arc(cx, cy, SH, 0, 7); ctx.fill(); ctx.stroke();
            }
            // bandes de parade : l'anneau qui se referme doit être dans la bande dorée au moment du toucher
            const SPEED = DIST / app;
            const r = rings.find(x => x.g === null);
            const goodW = gw * SPEED, perfW = pw * SPEED;
            let inPerf = false, inGood = false, rr = null;
            if (r) {
              rr = R + ((r.at - t) / app) * DIST;
              inPerf = Math.abs(rr - R) <= perfW; inGood = Math.abs(rr - R) <= goodW;
            }
            // le panneau du bas rejoue l'anneau en miniature, au même instant : même départ, même passage dans la bande.
            // La course (DIST) est ramenée à 36 px, autour d'une bande de rayon 50 px ; les fenêtres suivent la même échelle.
            const PS = 36 / DIST;
            const qs = G.$('#cb-qshrink'), qd = G.$('#cb-qdash'), qb = G.$('#cb-qband');
            const circ = (el, rad) => { const d = (2 * rad).toFixed(1) + 'px', m = (-rad).toFixed(1) + 'px'; el.style.width = el.style.height = d; el.style.marginLeft = el.style.marginTop = m; };
            if (qb) { const bw = Math.max(5, Math.round(2 * perfW * PS)); qb.style.borderWidth = bw + 'px'; circ(qb, 50 + bw / 2); }
            if (qd) circ(qd, 50 + goodW * PS + 1);
            if (qs) {
              const show = r && rr <= R + DIST;
              qs.style.opacity = show ? 1 : 0;
              if (show) circ(qs, 50 + (Math.max(SH, rr) - R) * PS + 1.5);
              qs.classList.toggle('heavy', !!heavy); qs.classList.toggle('in', !!show && inGood && !inPerf); qs.classList.toggle('perf', !!show && inPerf);
            }
            ctx.save();
            // halo orange : limites de la parade partielle, en pointillés
            ctx.setLineDash([6, 6]); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,160,70,.7)';
            ctx.beginPath(); ctx.arc(cx, cy, R + goodW, 0, 7); ctx.stroke();
            ctx.beginPath(); ctx.arc(cx, cy, Math.max(SH + 2, R - goodW), 0, 7); ctx.stroke();
            ctx.setLineDash([]);
            // bande dorée : parade parfaite
            ctx.lineWidth = perfW * 2;
            ctx.strokeStyle = inPerf ? 'rgba(255,240,170,.8)' : 'rgba(255,200,80,.42)';
            ctx.shadowColor = '#ffcf5a'; ctx.shadowBlur = inPerf ? 28 : 10;
            ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.stroke();
            ctx.shadowBlur = 0;
            ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,245,215,.95)';
            ctx.beginPath(); ctx.arc(cx, cy, R + perfW, 0, 7); ctx.stroke();
            ctx.beginPath(); ctx.arc(cx, cy, R - perfW, 0, 7); ctx.stroke();
            ctx.restore();
            if (r) {
              const k = (r.at - t) / app;
              if (k <= 1) {
                const col = inPerf ? '#fff6c8' : inGood ? '#ffb347' : heavy ? '#ff4a2a' : '#ff8a3a';
                ctx.save();
                ctx.strokeStyle = col; ctx.lineWidth = heavy ? 7 : 5;
                ctx.shadowColor = col; ctx.shadowBlur = inPerf ? 22 : 8;
                ctx.beginPath(); ctx.arc(cx, cy, Math.max(SH, rr), 0, 7); ctx.stroke();
                ctx.restore();
              } else {
                ctx.font = '700 30px ' + G.dispFont(); ctx.fillStyle = '#ffb36a'; ctx.textAlign = 'center'; ctx.fillText('!', cx, cy - R - perfW - 30);
              }
            }
            ctx.font = '600 14px ' + G.uiFont(); ctx.textAlign = 'center'; ctx.fillStyle = '#e9dccb';
            ctx.shadowColor = '#000'; ctx.shadowBlur = 6;
            const ty = Math.min(h - 10, cy + R + DIST * 0.75 + 30);
            ctx.font = '800 16px ' + G.uiFont(); ctx.fillStyle = heavy ? '#ff8a6a' : '#ffd27a';
            ctx.fillText(`${en.intent.name}${hits > 1 ? ` (${Math.min(hits, rings.filter(x => x.g !== null).length + 1)}/${hits})` : ''}`, cx, ty - 20);
            ctx.font = '600 14px ' + G.uiFont(); ctx.fillStyle = '#e9dccb';
            ctx.fillText(G.L('Pare quand l’anneau traverse la bande dorée', 'Parry when the ring crosses the golden band'), cx, ty);
          },
        };
      });

      function onHit(g, heavy) {
        const base = en.intent.dmg + en.buff;
        let mult;
        if (me.stance) mult = heavy ? [1, 0.4, 0][g] : [1, 0.25, 0][g];
        else mult = heavy ? [1, 0.75, 0.3][g] : [1, 0.5, 0][g];
        const def = Math.max(0, P.def - me.rust);
        const dmg = mult === 0 ? 0 : Math.max(1, Math.round(base * mult) - def);
        if (dmg > 0) {
          me.hp -= dmg; G.sfx('hurt'); flash('hurt');
          G.fx('impact', sz.w / 2 + G.rand(-40, 40), sz.h * 0.86, { size: 150, life: 0.3, alpha: 0.8 });
          G.float(sz.w / 2 + G.rand(-30, 30), sz.h * 0.88, `-${dmg}`, '#ff6a5a', 26);
          G.vibrate(40);
        }
        if (g === 2) {
          me.elan = Math.min(3, me.elan + 1);
          if (me.stance) {
            const c = Math.round(attackDamage(1, false) * 0.8);
            hurtEnemy(c, false, true);
            G.float(sz.w / 2, geo().y - 40, G.L(`Riposte ${c}`, `Riposte ${c}`), '#ffe08a', 20);
          }
        }
        if (en.intent.t === 'poison' && g < 2) { me.poison = { dmg: en.intent.dmg, turns: en.intent.turns }; G.fx('poison', sz.w / 2, sz.h * 0.82, { size: 240, life: 1.1, alpha: 0.8 }); }
        ui();
      }
    }

    function flash(cls) {
      const s = G.$('#s-combat');
      s.classList.remove('fx-hurt', 'fx-hit'); void s.offsetWidth; s.classList.add('fx-' + cls);
    }

    /* ----- dégâts ----- */
    function attackDamage(g, power) {
      let d = P.atk * [0.5, 1, P.wtype === 'tranchant' ? 1.8 : 1.5][g];
      if (g === 2) d *= P.perfMult || 1;
      if (power) d *= 2.2;
      if (E.weak && (E.weak === P.wtype || (P.wtype === 'aube' && E.weak !== 'aube') || (E.weak === 'aube' && P.wtype === 'aube'))) d *= 1.5;
      if (E.rust && !P.silver) d *= 0.6;
      return Math.max(1, Math.round(d));
    }
    function hurtEnemy(d, power, quiet) {
      let left = d;
      if (en.armor > 0) {
        const blunt = P.wtype === 'contondant' || P.wtype === 'aube';
        const k = (blunt ? 2 : 1) * (power ? 1.5 : 1);
        const ad = d * k;
        if (ad >= en.armor) {
          left = (ad - en.armor) / k; en.armor = 0;
          G.float(sz.w / 2, geo().y - geo().ms * 0.35, G.L('Carapace brisée !', 'Shell broken!'), '#ffd27a', 20); G.sfx('break'); G.fx('dust', geo().x, geo().y, { size: geo().ms * 1.2, life: 0.8, grow: 1.5 });
        } else { en.armor -= ad; left = 0; G.float(sz.w / 2 + 50, geo().y - 20, G.L(`−${Math.round(ad)} carapace`, `−${Math.round(ad)} shell`), '#c9d2d8', 16); }
      }
      left = Math.round(left);
      if (left > 0) {
        en.hp -= left;
        G.float(sz.w / 2 + G.rand(-40, 40), geo().y, `${left}`, '#fff2a8', quiet ? 22 : 34);
      }
      monHit();
      ui();
    }

    /* ----- boucle de combat ----- */
    // panneau du bas : jamais vide. Choix d'action, gros bouton pendant un QTE, ou attente.
    function qtePanel(kind) {
      const a = G.$('#cb-actions');
      const atk = kind === 'atk';
      a.className = 'cb-actions dial-mode';
      a.innerHTML = `<button class="qz ${atk ? 'qz-atk' : 'qz-par'}" id="cb-qbtn" aria-label="${G.L(`${atk ? 'Frapper' : 'Parer'} : touche n’importe où`, `${atk ? 'Strike' : 'Parry'}: tap anywhere`)}">
        <i class="qz-c tl"></i><i class="qz-c tr"></i><i class="qz-c bl"></i><i class="qz-c br"></i>
        <span class="qz-hint">${atk ? G.L('Touche<br>n’importe où', 'Tap<br>anywhere') : G.L('Quand le cercle<br>touche l’or', 'When the ring<br>hits the gold')}</span>
        <span class="qz-ring"><i class="qz-dash" id="cb-qdash"></i><i class="qz-band" id="cb-qband"></i>${atk ? '' : '<i class="qz-shrink" id="cb-qshrink"></i>'}<span class="qz-med">${G.icon(atk ? G.equipped('arme').id : 'bouclier', 50)}</span></span>
        <span class="qz-title">${atk ? G.L('Frapper !', 'Strike!') : G.L('Parer !', 'Parry!')}</span></button>`;
      G.$('#cb-qbtn').addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); if (qte) qte.tap(); });
      G.keyTap(G.$('#cb-qbtn'), () => { if (qte) qte.tap(); });
      G.kbdFocus(G.$('#cb-qbtn'));   // le bouton choisi au clavier vient de disparaître : le focus passe sur la zone de frappe
    }
    // éclair de couleur sur l'anneau du panneau selon la qualité du geste
    function qzResult(g) {
      const b = G.$('#cb-qbtn');
      if (!b) return;
      b.classList.remove('res-0', 'res-1', 'res-2'); void b.offsetWidth;
      b.classList.add('res-' + g);
      clearTimeout(b._rt); b._rt = setTimeout(() => b.classList.remove('res-' + g), 320);
    }
    function setActions(on, label) {
      const a = G.$('#cb-actions');
      a.className = 'cb-actions dial-mode';
      if (!on) {
        const it = en.intent && en.intent.t;
        const sub = !label && !over && (it === 'atk' || it === 'heavy') ? G.L('Tiens-toi prêt à parer', 'Get ready to parry') : '';
        a.innerHTML = `<div class="qz wait" role="status"><span class="qz-ring"><i class="qz-track"></i>${over ? '' : '<i class="qz-sweep"></i>'}<span class="qz-med qz-foe"><img src="assets/img/monstres/${eid}.webp" alt="" draggable="false"></span></span>
          <span class="qz-title">${label || (over ? G.L('Combat terminé', 'Fight over') : G.L('Tour de l’ennemi…', 'Enemy turn…'))}</span>${sub ? `<span class="qz-sub">${sub}</span>` : ''}</div>`;
        return;
      }
      const items = G.count('potion') + G.count('grande_potion') + G.count('bombe');
      const pow = me.elan >= 2;
      // sceaux de laiton en arc : Attaquer au centre, plus gros et en braise
      const fee = E.boss ? 'disabled' : '';
      a.innerHTML = `<div class="seals"><i class="seals-arc"></i>
        <button class="seal s-out" data-a="item" ${items ? '' : 'disabled'}><span class="seal-m">${G.icon('potion', 34)}${items ? `<em class="sat-n">${items}</em>` : ''}</span><b>${G.L('Objets', 'Items')}</b></button>
        <button class="seal s-in" data-a="pow" ${pow ? '' : 'disabled'}><span class="seal-m">${G.icon('marteau', 42)}</span><b>${G.L('Coup puissant', 'Power strike')}</b><small>${G.L('2 élan', '2 momentum')}</small></button>
        <button class="seal s-core" data-a="atk"><span class="seal-m hot">${G.icon(G.equipped('arme').id, 58)}</span><b>${G.L('Attaquer', 'Attack')}</b></button>
        <button class="seal s-in" data-a="guard"><span class="seal-m">${G.icon('bouclier', 42)}</span><b>${G.L('Parade', 'Parry')}</b><small>${G.L('+1 élan', '+1 momentum')}</small></button>
        ${FINAL ? `<button class="seal s-out ${en.freed ? 'iron' : 'chain'}" data-a="free" ${!en.freed && me.elan >= 2 ? '' : 'disabled'}><span class="seal-m">${G.icon('serrure', 32)}</span><b>${G.L('Libérer', 'Free')}</b><small>${en.freed ? G.L('Hogar est libre', 'Hogar is free') : G.L('2 élan', '2 momentum')}</small></button>`
          : `<button class="seal s-out iron" data-a="flee" ${fee}><span class="seal-m">${G.icon('fer_cheval', 32)}</span><b>${G.L('Fuir', 'Flee')}</b>${E.boss ? `<small>${G.L('impossible', 'impossible')}</small>` : ''}</button>`}
      </div>`;
      G.kbdFocus(G.$('.seal.s-core', a));
    }
    function waitAction() {
      return new Promise(res => {
        setActions(true);
        G.$$('#cb-actions [data-a]').forEach(b => b.addEventListener('click', () => { G.sfx('tick'); setActions(false); res(b.dataset.a); }));
      });
    }

    async function useItem() {
      const opts = ['potion', 'grande_potion', 'bombe'].filter(k => G.count(k) > 0);
      const v = await G.modal({
        title: G.L('Objets', 'Items'), body: `<p class="sub">${G.L('Utiliser un objet prend ton tour.', 'Using an item takes your turn.')}</p>`,
        buttons: opts.map(k => ({ label: `${G.icon(k, 20)} ${G.itemName(k)} (${G.count(k)})`, value: k, primary: true })).concat([{ label: G.L('Annuler', 'Cancel'), value: null }]),
      });
      if (!v) return false;
      const d = G.ITEMS[v];
      G.add(v, -1);
      if (d.heal) { me.hp = Math.min(me.max, me.hp + d.heal); G.sfx('heal'); G.fx('heal', sz.w / 2, sz.h * 0.8, { size: 220, life: 1 }); G.float(sz.w / 2, sz.h * 0.85, `+${d.heal} ${G.L('PV', 'HP')}`, '#8fe08a', 24); log(G.L(`Tu bois une ${d.name.toLowerCase()}.`, `You drink the ${d.name.toLowerCase()}.`)); }
      if (d.bomb) {
        G.sfx('thud'); G.fx('explosion', geo().x, geo().y, { size: geo().ms * 1.1, life: 0.7, grow: 1.4 });
        en.hp -= d.bomb; G.float(sz.w / 2, geo().y, `${d.bomb}`, '#ffb347', 30); log(G.L('La bombe explose !', 'The bomb explodes!'));
        monHit();
      }
      ui();
      return true;
    }

    async function loopTurns() {
      chooseIntent();
      G.$('#cb-intent').innerHTML = intentHTML();
      ui();
      log(E.boss ? G.L(`Face à toi : ${E.name}.`, `Before you: ${E.name}.`) : G.L(`${E.f ? 'Une' : 'Un'} ${E.name.toLowerCase()} surgit !`, `${/^[aeiou]/i.test(E.name) ? 'An' : 'A'} ${E.name.toLowerCase()} appears!`));
      if (E.rust && !P.silver) { await G.sleep(400); log(G.L('Ton arme n’est pas en argent : la Rouille l’émousse (dégâts −40 %).', 'Your weapon isn’t silver: the Rust dulls it (damage −40%).')); }
      while (!over) {
        // poison au début de ton tour
        if (me.poison) {
          me.hp -= me.poison.dmg; G.sfx('hurt'); flash('hurt');
          G.float(sz.w / 2, sz.h * 0.85, G.L(`Poison −${me.poison.dmg}`, `Poison −${me.poison.dmg}`), '#b6e06a', 20);
          if (--me.poison.turns <= 0) me.poison = null;
          ui();
          if (me.hp <= 0) return lose();
          await G.sleep(400);
        }
        me.stance = false; ui();
        let acted = false;
        while (!acted) {
          const a = await waitAction();
          if (a === 'atk' || a === 'pow') {
            if (a === 'pow') me.elan -= 2;
            ui();
            log(a === 'pow' ? G.L('Coup puissant…', 'Power strike…') : G.L('À l’attaque…', 'Attacking…'));
            const g = await qteAttack(a === 'pow');
            if (g === 2) me.elan = Math.min(3, me.elan + 1);
            if (E.evade && g < 2 && Math.random() < E.evade) {
              G.float(sz.w / 2, geo().y - 30, G.L('Esquive !', 'Dodge!'), '#c9d2d8', 24); G.sfx('dull'); log(G.L(`${E.name} esquive.`, `${E.name} dodges.`));
            } else {
              const d = attackDamage(g, a === 'pow');
              G.sfx(g === 2 ? 'crit' : 'hit'); flash('hit');
              const G0 = geo();
              G.fx('slash', G0.x, G0.y, { size: G0.ms * (a === 'pow' ? 1.2 : 0.95), life: 0.32, rot: G.rand(-0.6, 0.4), grow: 1.15, flip: Math.random() < 0.5 });
              G.fx(g === 2 ? 'crit' : 'impact', G0.x + G.rand(-20, 20), G0.y + G.rand(-20, 20), { size: G0.ms * (g === 2 ? 0.9 : 0.6), life: 0.35, spin: 2 });
              if (P.wtype === 'aube') G.fx('dawn', G0.x, G0.y, { size: G0.ms * 1.4, life: 0.6, alpha: 0.8, rot: -0.6 });
              hurtEnemy(d, a === 'pow');
              log(g === 2 ? G.L('Coup parfait !', 'Perfect strike!') : g === 1 ? G.L('Touché.', 'Hit.') : G.L('Coup maladroit.', 'Clumsy blow.'));
            }
            acted = true;
          } else if (a === 'free') {
            me.elan -= 2; ui();
            log(G.L('Tu vises une entrave de Hogar…', 'You aim at one of Hogar’s shackles…'));
            const g = await qteAttack(false);
            if (g >= 1) {
              en.chains--;
              G.sfx('break'); G.vibrate(30); flash('hit');
              G.fx('spark', sz.w / 2, sz.h * 0.8, { size: 220, life: 0.5, spin: 2 }); G.fx('rust', sz.w / 2, sz.h * 0.8, { size: 200, life: 0.8, alpha: 0.8 });
              G.float(sz.w / 2, sz.h * 0.78, en.chains ? G.L(`Entrave brisée ! (${en.chains} restante${en.chains > 1 ? 's' : ''})`, `Shackle broken! (${en.chains} left)`) : G.L('Hogar est libre !', 'Hogar is free!'), '#ffe08a', 24);
              ui();
              if (en.chains === 0) {
                en.freed = true; G.state.hogarFreed = true;
                await G.sleep(500);
                await G.story([
                  ['hogar_ronge', G.L("Mes mains… Je sens mes mains !", "My hands… I can feel my hands!")],
                  ['roi', G.L("Non ! Mon forgeron ! Qui réparera ma couronne ?", "No! My smith! Who will mend my crown?")],
                  ['hogar_ronge', G.L("Personne, Varn. Plus jamais. {nom}, à nous deux : je frappe, tu tranches !", "No one, Varn. Never again. {nom}, together now: I strike, you cut!")],
                ]);
                log(G.L('Hogar ramasse son marteau. La couronne ne se répare plus.', 'Hogar takes up his hammer. The crown mends no more.'));
              } else log(g === 2 ? G.L('L’entrave vole en éclats !', 'The shackle shatters!') : G.L('L’entrave cède.', 'The shackle gives way.'));
            } else {
              G.sfx('dull'); G.float(sz.w / 2, sz.h * 0.78, G.L('L’entrave tient bon', 'The shackle holds'), '#ff8a6a', 22);
              log(G.L('Ton coup glisse sur la rouille.', 'Your blow slides off the rust.'));
            }
            acted = true;
          } else if (a === 'guard') {
            me.stance = true; me.elan = Math.min(3, me.elan + 1); log(G.L('Tu te mets en garde.', 'You stand on guard.')); G.sfx('parry'); ui(); acted = true;
          } else if (a === 'item') {
            acted = await useItem();
          } else if (a === 'flee') {
            const ok = await G.modal({ title: G.L('Fuir ?', 'Flee?'), body: `<p>${G.L('Tu gardes le butin des combats précédents, mais pas celui-ci.', 'You keep the loot from earlier fights, but not this one.')}</p>`, buttons: [{ label: G.L('Rester', 'Stay'), value: false }, { label: G.L('Fuir', 'Flee'), value: true, primary: true }] });
            if (ok) return endHunt('flee');
          }
        }
        if (en.hp <= 0) return win();
        if (FINAL && en.freed) {
          await G.sleep(350);
          const hd = 8 + Math.round(P.atk * 0.3);
          G.sfx('clang', 1); G.fx('impact', geo().x + G.rand(-30, 30), geo().y, { size: geo().ms * 0.6, life: 0.35 });
          G.float(sz.w / 2 - 60, geo().y - geo().ms * 0.3, G.L('Hogar frappe !', 'Hogar strikes!'), '#d9a35b', 20);
          hurtEnemy(hd, true, true);
          log(G.L('Hogar frappe la couronne de toutes ses forces.', 'Hogar strikes the crown with all his might.'));
          if (en.hp <= 0) return win();
        }
        await G.sleep(450);
        // tour de l'ennemi
        await enemyTurn();
        if (me.hp <= 0) return lose();
        if (en.hp <= 0) return win();
        chooseIntent();
        G.$('#cb-intent').innerHTML = intentHTML();
        ui();
      }
    }

    async function enemyTurn() {
      const i = en.intent;
      if (i.t === 'atk' || i.t === 'heavy' || i.t === 'poison') {
        log(G.L(`${E.name} : ${i.name} !`, `${E.name}: ${i.name}!`));
        await qteDefend(i.hits || 1, i.t === 'heavy');
      } else if (i.t === 'prep') {
        en.prep = i.next; log(G.L(`${E.name} ${i.name.toLowerCase()}… Mets-toi en garde !`, `${E.name} ${i.name.toLowerCase()}… Brace yourself!`)); G.sfx('roar');
      } else if (i.t === 'guard') {
        en.armor += i.armor; log(G.L(`${E.name} : ${i.name} (+${i.armor} carapace).`, `${E.name}: ${i.name} (+${i.armor} shell).`)); G.sfx('clang', 0); G.fx('dust', geo().x, geo().y, { size: geo().ms, life: 0.8, alpha: 0.6 });
      } else if (i.t === 'buff') {
        en.buff += i.atk; log(G.L(`${E.name} : ${i.name} (ATQ +${i.atk}).`, `${E.name}: ${i.name} (ATK +${i.atk}).`)); G.sfx('roar');
      } else if (i.t === 'rust') {
        if (P.rustproof) log(G.L('Ton armure d’argent repousse la Rouille.', 'Your silver armour wards off the Rust.'));
        else { me.rust = Math.min(4, me.rust + i.def); log(G.L(`${i.name} : ta défense rouille (−${i.def}).`, `${i.name}: your defence rusts (−${i.def}).`)); G.sfx('gas'); G.fx('rust', sz.w / 2, sz.h * 0.75, { size: 260, life: 1.2, spin: 1, alpha: 0.9 }); }
      } else if (i.t === 'heal') {
        en.hp = Math.min(en.max, en.hp + i.hp); log(FINAL ? G.L(`Hogar frappe pour le roi : la couronne se répare (+${i.hp} PV).`, `Hogar strikes for the king: the crown mends (+${i.hp} HP).`) : G.L(`${E.name} : ${i.name} (+${i.hp} PV).`, `${E.name}: ${i.name} (+${i.hp} HP).`)); G.sfx('heal'); G.fx('heal', geo().x, geo().y, { size: geo().ms, life: 0.9 });
      } else if (i.t === 'roar') {
        me.elan = 0; log(G.L(`${i.name} : ton élan retombe.`, `${i.name}: your momentum fades.`)); G.sfx('roar');
      }
      ui();
      await G.sleep(500);
    }

    async function win() {
      over = true; setActions(false);
      G.sfx('win');

      const got = {};
      E.drops.forEach(([id, a, b, ch]) => { if (Math.random() < ch) { const n = G.randi(a, b); got[id] = (got[id] || 0) + n; run.loot[id] = (run.loot[id] || 0) + n; } });
      const gold = G.randi(E.gold[0], E.gold[1]); run.gold += gold;
      if (E.boss) G.state.boss[eid] = true;
      run.hp = me.hp; run.idx++;
      ui();
      log(G.L(`${E.name} est à terre !`, `${E.name} is down!`));
      await G.sleep(700);
      if (FINAL) return endHunt('final');
      if (run.idx >= run.total) return endHunt('win');
      const lootLine = Object.keys(got).map(k => `${got[k]} ${G.itemName(k)}`).join(', ') || G.L('rien', 'nothing');
      const go = await G.modal({
        title: G.L('Victoire', 'Victory'),
        body: G.L(`<p>Butin : ${lootLine} · ${gold} or.</p><p>Il te reste <b>${Math.ceil(me.hp)} / ${me.max} PV</b>. Continuer la chasse ?</p>`, `<p>Loot: ${lootLine} · ${gold} gold.</p><p>You have <b>${Math.ceil(me.hp)} / ${me.max} HP</b> left. Keep hunting?</p>`),
        buttons: [{ label: G.L('Rentrer', 'Head home'), value: false }, { label: G.L(`Combat ${run.idx + 1} / ${run.total}`, `Fight ${run.idx + 1} / ${run.total}`), value: true, primary: true }],
      });
      if (go) nextFight(run); else endHunt('win');
    }

    async function lose() {
      over = true; setActions(false);
      G.sfx('lose'); G.vibrate([100, 50, 100]);
      log(G.L('Tu t’effondres…', 'You collapse…'));
      await G.sleep(900);
      endHunt('lose');
    }

    async function endHunt(how) {
      G.stopLoop();
      let lines;
      if (how === 'lose') { run.loot = {}; run.gold = 0; lines = G.L(['Tu reprends connaissance à l’orée du village.', 'Le butin de cette chasse est perdu.'], ['You come to at the edge of the village.', 'The loot from this hunt is lost.']); }
      else if (how === 'flee') lines = [G.L('Tu prends la fuite avec ce que tu as déjà récolté.', 'You flee with what you’ve already gathered.')];
      else if (how === 'final') lines = [G.L('Le silence retombe sur la montagne.', 'Silence falls over the mountain once more.')];
      else lines = [run.boss ? G.L(`Boss vaincu : ${E.name}. Le village en parlera longtemps.`, `Boss defeated: ${E.name}. The village will speak of it for years.`) : G.L('Tu rentres de la chasse.', 'You return from the hunt.')];
      for (const k in run.loot) G.add(k, run.loot[k]);
      G.state.gold += run.gold;
      if (run.gold) lines.push(`+${run.gold} ${G.L('or', 'gold')}`);
      G.save();
      if (how !== 'final') await G.summary(run.z.name, lines, run.loot, how === 'lose' ? 'bad' : '');
      G.toHub(how === 'final' ? 'village' : 'chasse');
    }

    setActions(false, G.L('Prépare-toi…', 'Get ready…'));
    G.howto('combat').then(async () => {
      if (FINAL) {
        await G.story([
          ['roi', G.L("Un forgeron. Enfin, un second forgeron. Le premier faiblit, vois-tu.", "A smith. At last, a second smith. The first one is failing, you see.")],
          ['hogar_ronge', G.L("{nom}… Va-t’en… Il veut tes mains…", "{nom}… Get out… He wants your hands…")],
          ['roi', G.L("Ma couronne se fend. Répare-la, et je t’offre ce que j’ai offert à Ardent : une forge qui ne s’éteint jamais.", "My crown is cracking. Mend it, and I'll give you what I gave Ardent: a forge that never goes out.")],
          ['moi', G.L("Ta forge a dévoré ton royaume. Elle ne dévorera pas mon village.", "Your forge devoured your kingdom. It won't devour my village.")],
          ['recit', G.L("Brise les entraves de Hogar avec le sceau « Libérer » (2 élan) : tant qu’il frappe pour le roi, la couronne se répare.", "Break Hogar's shackles with the “Free” seal (2 momentum): as long as he strikes for the king, the crown keeps mending.")],
        ]);
      }
      loopTurns();
    });
  }
})();
