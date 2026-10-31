/* La Dernière Forge — Échoppe (fin de partie) : servir les clients et marchander au meilleur prix */
(function () {
  const S = {};
  G.shop = S;
  const DAY = 5;               // clients par journée

  S.unlocked = () => G.hasPerk('commerce') || !!G.state.ended;
  S.data = () => (G.state.shop = G.state.shop || { rep: 0, days: 0, sales: 0, best: 0, gold: 0 });
  S.stars = () => { let n = 1; G.SHOP_STARS.forEach((t, i) => { if (S.data().rep >= t) n = i + 1; }); return n; };
  // étal : toutes les pièces forgées que l'on ne porte pas
  S.stock = () => {
    const eq = Object.values(G.state.eq);
    return G.state.gear.filter(g => !eq.includes(g.uid) && G.RECIPES[g.id]);
  };
  // réputation de l'échoppe : progression vers l'étoile suivante
  S.repBar = () => {
    const r = S.data().rep, n = S.stars(), cur = G.SHOP_STARS[n - 1], next = G.SHOP_STARS[n];
    if (next === undefined) return `<span class="star-rep"><span class="star-bar"><i style="width:100%"></i></span><small>max</small></span>`;
    return `<span class="star-rep" title="${G.L('Réputation de l’échoppe', 'Shop reputation')}"><span class="star-bar"><i style="width:${Math.round((r - cur) / (next - cur) * 100)}%"></i></span><small>${r}/${next}</small></span>`;
  };
  S.starsHTML = n => `<span class="stars" aria-label="${n} ${G.L('étoile', 'star')}${n > 1 ? 's' : ''}">${[1, 2, 3, 4, 5].map(i => `<i class="${i <= n ? 'on' : ''}"></i>`).join('')}</span>`;

  // prix de référence d'une pièce (prix de revente à Odile, qualité comprise)
  const value = (id, q) => G.gearPrice({ id, q });

  function makeCustomer(used) {
    const stars = S.stars(), stock = S.stock();
    const pool = Object.keys(G.CUSTOMERS).filter(k => !used.includes(k) && (G.CUSTOMERS[k].stars || 1) <= stars);
    const cid = G.wpick(pool.map(k => [k, G.CUSTOMERS[k].w]))[0];
    const c = G.CUSTOMERS[cid];
    const fits = stock.filter(g => (!c.cats || c.cats.includes(G.GEAR[g.id].slot)) && g.q >= (c.minQ || 0));
    let item, minQ;
    if (fits.length && Math.random() < 0.8) {
      // demande une pièce de l'étal : la qualité exigée ne dépasse pas celle qu'on a
      const g = G.pick(fits);
      item = g.id;
      const tiers = G.QUALITY.filter(t => t.min <= g.q && t.min >= (c.minQ || 0) && t.min < 95);
      minQ = Math.random() < 0.35 + stars * 0.08 ? G.pick(tiers).min : (c.minQ || 0);
    } else {
      // demande au hasard parmi ce que tu sais forger
      const ch = G.state.ch + 1;
      const ids = Object.keys(G.RECIPES).filter(id => G.RECIPES[id].ch <= ch && id !== 'lame_aube' && (!c.cats || c.cats.includes(G.GEAR[id].slot)));
      item = G.pick(ids);
      minQ = Math.max(c.minQ || 0, G.pick([0, 0, 40, 65]));
    }
    const mult = c.budget * (1.45 + stars * 0.07) * G.rand(0.92, 1.08);
    return { cid, c, item, minQ, mult, patience: 3, hi: G.pick(c.hi) };
  }

  S.start = function () {
    const scr = G.$('#s-shop');
    const st = { n: 0, used: [], sold: 0, gold: 0, repGain: 0, cust: null, phase: 'enter', hg: null, done: false, stars0: S.stars() };
    G._dbg = st;
    scr.innerHTML = `
      <header class="mg-top"><div><span class="eyebrow">${G.L('Ton échoppe', 'Your shop')} · ${S.starsHTML(S.stars())} ${S.repBar()}</span><b id="sh-title">${G.L('Jour', 'Day')} ${S.data().days + 1}</b></div>
        <div class="mg-top-r"><div class="gold sh-gold">${G.icon('piece', 20)}<b id="sh-goldv">+0</b></div><div class="mg-timer" id="sh-count">1 / ${DAY}</div>${G.helpBtn('shop')}</div></header>
      <div class="mg-stage sh-stage" id="sh-stage">
        <div class="sh-bg"></div>
        <div class="sh-cust" id="sh-cust"></div>
        <div class="sh-fg"></div>
        <div class="sh-bubble" id="sh-bubble" hidden></div>
        <div class="sh-plate" id="sh-plate" hidden></div>
      </div>
      <div class="mg-bottom sh-bottom" id="sh-bottom"></div>`;
    G.show('s-shop');
    G.music('village');
    G.bindHelp(scr, 'shop');
    // décor : le comptoir de l'échoppe repasse devant le client (même image, découpée sous le haut du comptoir)
    const shopImg = G.imgEl('img/decors/echoppe.webp');
    const bg = G.img('img/decors/echoppe.webp') || G.img('img/decors/forge.webp');
    const bgEl = G.$('.sh-bg', scr), fgEl = G.$('.sh-fg', scr);
    if (bg) { bgEl.style.backgroundImage = `url(${bg})`; if (shopImg) fgEl.style.backgroundImage = `url(${bg})`; }
    function layout() {
      const stage = G.$('#sh-stage'); if (!stage) return;
      const W = stage.clientWidth, H = stage.clientHeight, cust = G.$('#sh-cust');
      if (!shopImg || !shopImg.width) { fgEl.hidden = true; cust.style.bottom = '0px'; return; }
      const k = Math.max(W / shopImg.width, H / shopImg.height), dw = shopImg.width * k, dh = shopImg.height * k;
      const COUNTER = 0.655;                         // haut du comptoir dans l'image
      const oy = G.clamp(H * 0.8 - COUNTER * dh, H - dh, 0), ox = (W - dw) / 2;
      [bgEl, fgEl].forEach(el => { el.style.backgroundSize = `${dw}px ${dh}px`; el.style.backgroundPosition = `${ox}px ${oy}px`; });
      const cy = oy + COUNTER * dh;
      fgEl.style.clipPath = `inset(${cy}px 0 0 0)`;
      cust.style.bottom = Math.max(0, H - cy - 14) + 'px';
    }
    requestAnimationFrame(layout);
    window.onresize = () => { if (G.current === 's-shop') layout(); };
    const bottom = G.$('#sh-bottom'), bubble = G.$('#sh-bubble'), custEl = G.$('#sh-cust'), plate = G.$('#sh-plate');

    const say = (html, cls) => { bubble.hidden = false; bubble.className = 'sh-bubble ' + (cls || ''); bubble.innerHTML = (st.cust ? `<b class="sh-who" style="color:${st.cust.c.color}">${st.cust.c.name}</b>` : '') + html; void bubble.offsetWidth; bubble.classList.add('pop'); };
    const flash = (txt, cls) => {
      plate.hidden = false; plate.className = 'sh-plate ' + (cls || ''); plate.textContent = txt;
      void plate.offsetWidth; plate.classList.add('pop');
      clearTimeout(plate._t); plate._t = setTimeout(() => { plate.hidden = true; }, 1300);
    };
    const qTag = q => q ? `<span class="qb ${G.qual(q).cls}">${G.qual(q).name}+</span>` : '';

    function nextCustomer() {
      if (st.n >= DAY) return endDay();
      st.n++;
      G.$('#sh-count').textContent = `${st.n} / ${DAY}`;
      const cu = makeCustomer(st.used);
      st.used.push(cu.cid); if (st.used.length > 3) st.used.shift();
      st.cust = cu;
      const pic = G.img('img/portraits/' + cu.cid + '.webp');
      custEl.className = 'sh-cust enter';
      custEl.style.setProperty('--c', cu.c.color);
      custEl.innerHTML = pic ? `<img src="${pic}" alt="">` : `<span class="sh-face">${cu.c.emoji}</span>`;
      bubble.hidden = true; bottom.innerHTML = '';
      setTimeout(() => {
        say(`<p>${cu.hi}</p><div class="sh-want">${G.icon(cu.item, 34)}<span><b>${G.itemName(cu.item)}</b>${qTag(cu.minQ)}</span></div>`);
        G.sfx('page');
        showStall();
      }, 420);
    }

    function showStall() {
      st.phase = 'choose';
      const cu = st.cust;
      const ok = S.stock().filter(g => g.id === cu.item && g.q >= cu.minQ).sort((a, b) => a.q - b.q);
      bottom.innerHTML = `<div class="sh-stall">${ok.length ? ok.map(g => `<button class="sh-piece" data-uid="${g.uid}">${G.icon(g.id, 36)}<span><b>${G.itemName(g.id)}</b><span class="qb ${G.qual(g.q).cls}">${G.qual(g.q).name}</span><small>${G.L(`valeur ${value(g.id, g.q)} or`, `value ${value(g.id, g.q)} gold`)}</small></span></button>`).join('')
        : `<p class="sh-empty">${G.L('Rien de tel sur ton étal.', 'Nothing like that on your stall.')}</p>`}</div>
        <button class="btn ghost" id="sh-none">${ok.length ? G.L('Pas pour vous, désolé', 'Not for you, sorry') : G.L('Je n’ai pas ça, désolé', 'I don’t have that, sorry')}</button>`;
      G.$$('.sh-piece', bottom).forEach(b => b.addEventListener('click', () => { G.sfx('tick'); haggle(G.gearByUid(+b.dataset.uid)); }));
      G.$('#sh-none').addEventListener('click', () => { G.sfx('tick'); leave(G.L('Tant pis. Une autre fois, peut-être.', 'Too bad. Another time, perhaps.')); });
    }

    // marchandage : le curseur parcourt les prix, on touche pour annoncer
    function haggle(g) {
      st.phase = 'haggle';
      const cu = st.cust;
      const floor = value(g.id, g.q);
      // la qualité au-dessus de l'exigence fait monter la limite
      const M = Math.round(floor * cu.mult * (1 + Math.max(0, g.q - cu.minQ) / 250));
      const ceil = Math.round(M * 1.35);
      // la vraie limite du client n'est connue qu'à peu près : elle varie de −4 % à +2 % autour de celle affichée
      const real = Math.round(M * (0.96 + Math.random() * 0.06));
      const S0 = 0.95 + S.stars() * 0.06 + (cu.cid === 'baron' ? 0.15 : 0);
      const pct = v => (v - floor) / (ceil - floor) * 100;
      st.hg = { g, floor, M, real, ceil, x: 0, dir: 1, speed: S0, locked: false };
      say(`<p>${G.pick(G.L(['Combien tu en veux ?', 'Belle pièce. Ton prix ?', 'Hmm. Et ça coûte combien ?'], ['How much do you want for it?', 'Fine piece. Your price?', 'Hmm. And how much is that?']))}</p><div class="sh-want">${G.icon(g.id, 34)}<span><b>${G.itemName(g.id)}</b><span class="qb ${G.qual(g.q).cls}">${G.qual(g.q).name}</span></span></div>`);
      bottom.innerHTML = `
        <div class="hg">
          <div class="hg-lbl"><span>${floor} ${G.L('or', 'gold')}</span><span class="hg-pat" id="hg-pat"></span><span>${ceil} ${G.L('or', 'gold')}</span></div>
          <div class="hg-track">
            <i class="hg-good" style="left:${pct(M * 0.8)}%;width:${pct(M * 0.94) - pct(M * 0.8)}%"></i>
            <i class="hg-best" style="left:${pct(M * 0.94)}%;width:${pct(M) - pct(M * 0.94)}%"></i>
            <i class="hg-fuzz" style="left:${pct(M * 0.96)}%;width:${pct(M * 1.02) - pct(M * 0.96)}%"></i><i class="hg-over" style="left:${pct(M * 1.02)}%;right:0"></i>
            <i class="hg-cur" id="hg-cur"><em id="hg-val">${floor}</em></i>
          </div>
          <button class="btn primary huge" id="hg-go">${G.L('Annoncer ce prix', 'Name this price')}</button>
        </div>`;
      patience();
      const go = e => { if (e) e.preventDefault(); if (st.phase === 'haggle' && !st.hg.locked) offer(); };
      G.$('#hg-go').addEventListener('pointerdown', go);
      G.keyTap(G.$('#hg-go'), go);
      G.$('#sh-stage').onpointerdown = e => { if (e.target.closest('button')) return; go(e); };
    }
    function patience() {
      const p = G.$('#hg-pat');
      if (p) p.innerHTML = `${G.L('Patience', 'Patience')} ${[0, 1, 2].map(i => `<i class="${i < st.cust.patience ? 'on' : ''}"></i>`).join('')}`;
    }
    function priceAt(x) { const h = st.hg; return Math.round(h.floor + (h.ceil - h.floor) * x); }

    function offer() {
      const h = st.hg, cu = st.cust, price = priceAt(h.x);
      h.locked = true;
      if (price > h.real) {
        cu.patience--; patience();
        G.sfx('dull'); G.vibrate(20);
        flash(G.L('Trop cher !', 'Too expensive!'), 'bad');
        if (cu.patience <= 0) { G.$('#sh-stage').onpointerdown = null; return leave(G.pick(G.L(['Je vais voir ailleurs.', 'Tu te moques de moi ? Adieu.', 'Non, vraiment, c’est trop.'], ['I’ll look elsewhere.', 'Are you mocking me? Farewell.', 'No, really, that’s too much.']))); }
        say(`<p>${G.pick(G.L(['Tu plaisantes ?', 'C’est beaucoup trop !', 'Allons, sois raisonnable.'], ['You’re joking?', 'That’s far too much!', 'Come now, be reasonable.']))}</p>`, 'cross');
        h.speed *= 1.15;
        setTimeout(() => { h.locked = false; }, 650);
        return;
      }
      G.$('#sh-stage').onpointerdown = null;
      const best = price >= h.M * 0.94, good = price >= h.M * 0.8;
      const rep = best ? 2 : 1;
      G.state.gear = G.state.gear.filter(x => x.uid !== h.g.uid);
      G.state.gold += price;
      const d = S.data(); d.rep += rep; d.sales++; d.gold += price; d.best = Math.max(d.best, price);
      st.sold++; st.gold += price; st.repGain += rep;
      G.$('#sh-goldv').textContent = '+' + st.gold;
      G.sfx('coin'); if (best) G.sfx('win');
      flash(best ? G.L('Meilleur prix !', 'Best price!') : good ? G.L('Marché conclu', 'Deal') : G.L('Bonne affaire… pour le client', 'A bargain… for the customer'), best ? 'best' : good ? 'good' : '');
      say(`<p>${best ? G.pick(G.L(['Cher, mais ça les vaut.', 'Tu sais vendre, toi.', 'Marché conclu. Tu es dur en affaires !'], ['Pricey, but worth it.', 'You know how to sell, you.', 'Deal. You drive a hard bargain!'])) : good ? G.pick(G.L(['Affaire conclue !', 'Ça me va.', 'Parfait, je prends.'], ['Agreed!', 'Suits me.', 'Perfect, I’ll take it.'])) : G.pick(G.L(['Vendu ! Quelle aubaine.', 'Tope là ! Je n’en espérais pas tant.'], ['Sold! What a bargain.', 'Shake on it! I didn’t hope for so much.']))}</p><p class="sh-paid">+${price} ${G.L('or', 'gold')}</p>`, 'happy');
      G.save();
      bottom.innerHTML = '';
      setTimeout(() => { custEl.className = 'sh-cust leave'; setTimeout(nextCustomer, 450); }, 1500);
    }
    function leave(line) {
      st.phase = 'leave';
      say(`<p>${line}</p>`, 'cross');
      bottom.innerHTML = '';
      setTimeout(() => { custEl.className = 'sh-cust leave'; setTimeout(nextCustomer, 450); }, 1300);
    }
    async function endDay() {
      st.done = true; G.stopLoop();
      const d = S.data(); d.days++;
      G.save();
      const lines = [G.L(`${st.sold} vente${st.sold > 1 ? 's' : ''} sur ${DAY} clients.`, `${st.sold} sale${st.sold !== 1 ? 's' : ''} out of ${DAY} customers.`), G.L(`+${st.gold} or · +${st.repGain} réputation de l’échoppe`, `+${st.gold} gold · +${st.repGain} shop reputation`)];
      if (S.stars() > st.stars0) lines.push(G.L(`Ton échoppe gagne une étoile : ${S.stars()} / 5 ! Des clients plus riches viendront.`, `Your shop earns a star: ${S.stars()} / 5! Wealthier customers will come.`));
      await G.summary(G.L('Fin de la journée', 'End of the day'), lines, null, st.sold ? 'good' : '');
      G.toHub('village');
    }

    G.loop(dt => {
      const h = st.hg;
      if (st.phase !== 'haggle' || !h || h.locked) return;
      h.x += h.dir * h.speed * dt * (0.7 + h.x * 1.1);   // le curseur accélère nettement vers les prix hauts
      if (h.x >= 1) { h.x = 1; h.dir = -1; } else if (h.x <= 0) { h.x = 0; h.dir = 1; }
      const cur = G.$('#hg-cur');
      if (cur) {
        const p = priceAt(h.x);
        cur.style.left = (h.x * 100) + '%';
        cur.className = 'hg-cur' + (p > h.M * 1.02 ? ' over' : p >= h.M * 0.94 ? ' best' : p >= h.M * 0.8 ? ' good' : '');
        G.$('#hg-val').textContent = p;
        G.$('#hg-go').textContent = G.L(`Annoncer : ${p} or`, `Name ${p} gold`);
      }
    });
    G.howto('shop').then(nextCustomer);
  };
})();
