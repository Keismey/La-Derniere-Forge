/* La Dernière Forge — écran principal (village/forge), histoire, commandes, boutique */
(function () {
  const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI'];
  const TABS = [
    ['forge', 'Forge', '<path d="M3 9h14c0 2-1 3-3 3h-1l1 4h3v3H5v-3h3l1-4H7C5 12 3 11 3 9z"/><path d="M17 9h4l-1 2h-3" />'],
    ['mine', 'Mine', '<path d="M4 20 15 9" stroke-width="2.4"/><path d="M6 6c4-3 9-3 13 1l1-1c-5-5-11-5-15-1z"/>'],
    ['chasse', G.L('Chasse', 'Hunt'), '<path d="M17 3h4v4L10 18l-4-4z"/><path d="M5 13l6 6M7 17l-3 3" stroke-width="2.2"/>'],
    ['raffinage', G.L('Raffinage', 'Refining'), '<circle cx="12" cy="12" r="7"/>'],
    ['sac', G.L('Sac', 'Bag'), '<path d="M6 8h12l1 12H5z"/><path d="M9 8V6a3 3 0 0 1 6 0v2" fill="none"/>'],
    ['village', 'Village', '<path d="M3 11 12 4l9 7v9H3z"/><path d="M10 20v-5h4v5"/>'],
  ];
  const ZONE_IMG = { foret: 'foret', marais: 'marais', pic: 'pic', coeur: 'coeur' };
  const BANNER = { forge: G.L('La forge', 'The forge'), mine: G.L('La mine', 'The mine'), chasse: G.L('La chasse', 'The hunt'), raffinage: G.L('Raffinage', 'Refining'), sac: G.L('Ton sac', 'Your bag'), village: 'Combefroide' };
  const CAT_LABEL = { Outils: G.L('Outils', 'Tools'), Armes: G.L('Armes', 'Weapons'), Armures: G.L('Armures', 'Armor'), Commandes: G.L('Commandes', 'Orders') };
  // types de dégâts (clés des données) affichés dans la langue active
  const dmgT = t => (t === 'aube' ? G.L('tranchant + contondant', 'slashing + blunt') : t === 'tranchant' ? G.L('tranchant', 'slashing') : t === 'contondant' ? G.L('contondant', 'blunt') : t);
  const chapL = i => G.L('Chapitre ', 'Chapter ') + ROMAN[i];
  let tab = 'forge', forgeCat = 'Outils';

  /* ---------- démarrage ---------- */
  function boot() {
    G.state = G.load() || G.newState();
    // langue venue d'un lien ?lang= : retenue pour les prochaines ouvertures
    if (/[?&]lang=(fr|en)\b/.test(location.search) && G.state.settings.lang !== G.lang) { G.state.settings.lang = G.lang; G.save(); }
    studioSplash();
    G.loadAssets();
    let rt = null;
    G.onAsset = p => {
      if (p.indexOf('titre') >= 0) titleBg();
      clearTimeout(rt);
      rt = setTimeout(() => { if (G.current === 's-hub' && G.$('#hub-body')) keepScroll(); }, 120);
    };
    buildTitle();
    patchNotesAuto();
    G.show('s-title');
    // service worker (hors artifact)
    if ('serviceWorker' in navigator && location.protocol.startsWith('http') && !window.__ARTIFACT__) {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
    document.addEventListener('visibilitychange', () => { if (document.hidden) G.save(); });
    document.addEventListener('pointerdown', () => G.audioInit(), { passive: true });
    document.addEventListener('contextmenu', e => { if (!e.target.closest('input')) e.preventDefault(); });
  }

  // logo du studio au démarrage, avant l'écran titre (toucher pour passer)
  function studioSplash() {
    const p = 'img/studio/logo.webp';
    if (G.AVAILABLE && G.AVAILABLE.indexOf(p) < 0) return;
    const src = 'assets/' + p;
    const d = document.createElement('div');
    d.className = 'splash';
    d.innerHTML = `<img src="${src}" alt="Keismey Studio" draggable="false">`;
    document.body.appendChild(d);
    let gone = false;
    const end = () => { if (gone) return; gone = true; d.classList.add('out'); setTimeout(() => d.remove(), 600); };
    d.addEventListener('pointerdown', end);
    // le compte à rebours part quand le logo est chargé (réseau lent), 5 s au plus
    const im = d.querySelector('img');
    const arm = () => setTimeout(end, 2400);
    if (im.complete) arm(); else { im.onload = arm; im.onerror = end; }
    setTimeout(end, 5000);
  }

  function titleBg() {
    const p = G.img('img/decors/titre.webp'), el = G.$('#title-art');
    if (p && el) { el.style.backgroundImage = `url(${p})`; el.classList.add('on'); }
  }

  function buildTitle() {
    const s = G.$('#s-title');
    const has = G.hasSave() && G.state.introSeen >= 0;
    s.innerHTML = `
      <div class="title-art" id="title-art" aria-hidden="true"></div>
      <canvas id="title-embers" aria-hidden="true"></canvas>
      <div class="title-wrap">
        <p class="eyebrow">${G.L('Un conte de forge et de rouille', 'A tale of forge and rust')}</p>
        <h1 class="logo">${G.L('La Dernière<br>Forge', 'The Last<br>Forge')}</h1>
        <div class="title-btns">
          ${has ? `<button class="btn primary big" id="t-continue">${G.L('Continuer', 'Continue')} <small>${G.esc(G.state.name)} · ${G.state.ended ? G.L('Épilogue', 'Epilogue') : G.L('Chapitre ', 'Chapter ') + (ROMAN[G.state.ch] || 'V')}</small></button>` : ''}
          <button class="btn ${has ? '' : 'primary'} big" id="t-new">${G.L('Nouvelle partie', 'New game')}</button>
          <button class="btn" id="t-opt">Options</button>
        </div>
        <p class="title-foot">${G.L('Avec le son, c’est mieux.', 'Best played with sound.')}</p>
      </div>`;
    titleBg();
    embers(G.$('#title-embers'));
    G.$('#t-opt').onclick = () => { G.audioInit(); G.sfx('tick'); openOptions(true); };
    if (has) G.$('#t-continue').onclick = () => { G.audioInit(); G.sfx('clang', 2); enterGame(); };
    G.$('#t-new').onclick = async () => {
      G.audioInit();
      if (has) {
        const ok = await G.modal({ title: G.L('Nouvelle partie ?', 'New game?'), body: G.L('<p>Ta progression actuelle sera effacée.</p>', '<p>Your current progress will be erased.</p>'),
          buttons: [{ label: G.L('Annuler', 'Cancel'), value: false }, { label: G.L('Effacer et recommencer', 'Erase and start over'), value: true, danger: true }] });
        if (!ok) return;
      }
      const r = await G.modal({
        title: G.L('Ton nom, apprenti ?', 'Your name, apprentice?'),
        body: `<label class="field"><span>${G.L('Le nom sous lequel le village te connaît', 'The name the village knows you by')}</span><input id="name-in" maxlength="14" value="Brenn" autocomplete="off"></label>`,
        buttons: [{ label: G.L('Allumer la forge', 'Light the forge'), value: true, primary: true }],
        collect: m => (G.$('#name-in', m).value || '').trim(),
        onOpen: m => { const i = G.$('#name-in', m); i.focus(); i.select(); },
      });
      const keep = G.state.settings;
      G.wipe();
      G.state = G.newState(r.data || 'Brenn');
      G.state.settings = keep;
      G.save();
      G.sfx('clang', 2);
      enterGame();
    };
  }

  // braises animées de l'écran titre
  function embers(cv) {
    let sz = G.fitCanvas(cv);
    const ps = [];
    window.onresize = () => { if (G.current === 's-title') sz = G.fitCanvas(cv); };
    G.loop(dt => {
      if (G.current !== 's-title') return;
      // le canvas a pu être mesuré pendant que l'écran titre était caché (taille 0) : on le remesure
      if (sz.w < 2 || sz.h < 2) { sz = G.fitCanvas(cv); if (sz.w < 2) return; }
      const { ctx, w, h } = sz;
      ctx.clearRect(0, 0, w, h);
      if (ps.length < 70 && Math.random() < 0.6) ps.push({ x: Math.random() * w, y: h + 5, vy: -G.rand(25, 70), vx: G.rand(-10, 10), r: G.rand(0.8, 2.4), t: 0, l: G.rand(3, 7) });
      for (let i = ps.length - 1; i >= 0; i--) {
        const p = ps[i]; p.t += dt; p.y += p.vy * dt; p.x += (p.vx + Math.sin(p.t * 2 + i) * 12) * dt;
        if (p.t > p.l) { ps.splice(i, 1); continue; }
        const a = Math.sin((p.t / p.l) * Math.PI);
        ctx.fillStyle = `rgba(255,${120 + (i % 5) * 20},40,${a * 0.9})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill();
      }
    });
  }

  async function enterGame() {
    G.stopLoop();
    G.music(G.state.ended ? 'fin' : 'village');
    if (G.state.introSeen < G.state.ch) {
      G.show('s-hub'); renderHub();
      await G.story(G.CHAPTERS[G.state.ch].intro, chArt(G.state.ch));
      G.state.introSeen = G.state.ch;
      G.save();
    }
    G.toHub('forge');
  }

  function chArt(i) { return 'img/histoire/ch' + (i + 1) + '.webp'; }

  /* ---------- hub ---------- */
  G.toHub = function (t) {
    G.stopLoop();
    if (t) tab = t;
    refillBoard();
    G.show('s-hub');
    G.music(G.state.ended ? 'fin' : 'village');
    renderHub();
    G.$('#hub-body').scrollTop = 0;
    G.save();
    checkGoals();
  };

  function renderHub() {
    const s = G.$('#s-hub');
    const ch = G.CHAPTERS[Math.min(G.state.ch, G.CHAPTERS.length - 1)];
    const bgKey = { forge: 'forge', mine: 'mine', chasse: 'foret', sac: 'forge', village: 'village', raffinage: G.img('img/decors/meule.webp') ? 'meule' : 'forge' }[tab];
    const bg = G.img('img/decors/' + bgKey + '.webp');
    s.innerHTML = `
      <header class="topbar">
        <div class="chap"><span class="eyebrow">${G.state.ended ? G.L('Épilogue', 'Epilogue') : chapL(G.state.ch)}</span><b>${G.state.ended ? G.L('La forge est rallumée', 'The forge burns again') : ch.title}</b></div>
        <div class="top-r"><div class="gold" aria-label="${G.L('Or', 'Gold')}">${coin()}<span>${G.state.gold}</span></div>
          <button class="gear-btn" id="opt-open" aria-label="Options">${GEAR_SVG}</button></div>
      </header>
      <div class="banner ${bg ? 'has-img' : ''} b-${tab}" ${bg ? `style="background-image:url(${bg})"` : ''}>
        <h2 class="banner-title">${BANNER[tab]}</h2>
        <p class="banner-sub">${bannerSub()}</p>
      </div>
      <main class="hub-body" id="hub-body">${renderTab()}</main>
      <nav class="tabbar">${TABS.filter(([id]) => id !== 'raffinage' || G.refine.unlocked()).map(([id, label, path]) =>
        `<button class="tab ${tab === id ? 'on' : ''}" data-tab="${id}">${tabIcon(id, path)}<span>${label}</span>${id === 'village' && deliverable() ? '<i class="pip"></i>' : ''}</button>`).join('')}</nav>`;
  }

  const TAB_ICON = { forge: 'tab_forge', mine: 'pioche_fer', chasse: 'tab_chasse', raffinage: G.iconSrc && G.AVAILABLE && G.AVAILABLE.includes('img/icones/tab_raffinage.webp') ? 'tab_raffinage' : 'rubis', sac: 'tab_sac', village: 'tab_village' };
  function tabIcon(id, path) {
    const src = G.iconSrc(TAB_ICON[id]);
    return src ? `<img class="tab-ico" src="${src}" alt="" draggable="false">` : `<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linejoin="round">${path}</svg>`;
  }
  function coin() { if (G.iconSrc('piece')) return G.icon('piece', 22); return '<svg viewBox="0 0 24 24" width="18" height="18"><circle cx="12" cy="12" r="8" fill="#e8b84a" stroke="#8a5f1c" stroke-width="1.5"/><path d="M12 7v10M9 9.5h4.5a1.8 1.8 0 0 1 0 3.5H10a1.8 1.8 0 0 0 0 3.5h5" fill="none" stroke="#8a5f1c" stroke-width="1.4"/></svg>'; }

  function bannerSub() {
    const p = G.player();
    if (tab === 'raffinage') return G.L('Reprendre une pièce à la meule, sertir des gemmes.', 'Rework a piece at the grindstone, set gems.');
    if (tab === 'forge') return G.L('Fonds le minerai, frappe le métal, trempe la lame.', 'Smelt the ore, strike the metal, quench the blade.');
    if (tab === 'mine') return G.L(`${G.itemName(G.equipped('pioche').id)} · puissance ${p.power} · endurance ${p.energy}`, `${G.itemName(G.equipped('pioche').id)} · power ${p.power} · stamina ${p.energy}`);
    if (tab === 'chasse') return G.L(`${p.hpMax} PV · ATQ ${p.atk} · DÉF ${p.def}`, `${p.hpMax} HP · ATK ${p.atk} · DEF ${p.def}`);
    if (tab === 'sac') return G.L('Équipement, commandes, matériaux.', 'Gear, orders, materials.');
    const r = G.REP[G.repLevel()];
    return G.L(`Renommée ${G.repLevel() + 1} · ${r.name}`, `Renown ${G.repLevel() + 1} · ${r.name}`);
  }

  function renderTab() {
    if (tab === 'forge') return tabForge();
    if (tab === 'mine') return tabMine();
    if (tab === 'chasse') return tabHunt();
    if (tab === 'sac') return tabBag();
    if (tab === 'raffinage') return tabRefine();
    return tabVillage();
  }

  function reqChips(req, mult) {
    mult = mult || 1;
    return `<div class="chips">${Object.keys(req).map(k => {
      const need = req[k] * mult, have = G.count(k);
      return `<span class="chip ${have >= need ? 'ok' : 'no'}" title="${G.itemName(k)}">${G.icon(k, 18)}<span>${have}/${need}</span></span>`;
    }).join('')}</div>`;
  }

  // objets demandés par l'histoire ou le tableau : mis en avant à la forge
  function wanted() {
    const set = {};
    if (!G.state.ended) G.CHAPTERS[G.state.ch].goals.forEach(g => {
      if (G.state.goals[g.id]) return;
      [].concat(g.item || []).forEach(i => { set[i] = G.L('Objectif', 'Goal'); });
    });
    (G.state.board || []).forEach(b => { const r = G.REQUESTS[b.k]; if (r && !set[r.item]) set[r.item] = G.L('Commande', 'Order'); });
    return set;
  }

  function statLine(id) {
    const d = G.GEAR[id];
    if (!d) return G.ITEMS[id] ? G.ITEMS[id].desc : '';
    if (d.slot === 'commande') return d.desc;
    if (d.atk !== undefined) return G.L(`ATQ ${d.atk} · ${dmgT(d.type)}${d.silver ? ' · argent' : ''}`, `ATK ${d.atk} · ${dmgT(d.type)}${d.silver ? ' · silver' : ''}`);
    if (d.def !== undefined) return G.L(`DÉF ${d.def} · +${d.hp} PV${d.rustproof ? ' · anti-Rouille' : ''}`, `DEF ${d.def} · +${d.hp} HP${d.rustproof ? ' · Rust-proof' : ''}`);
    if (d.power !== undefined) return G.L(`Puissance ${d.power}`, `Power ${d.power}`);
    if (d.light) return G.L(`+${d.light} lumière`, `+${d.light} light`);
    return '';
  }

  function tabForge() {
    const ch = G.state.ch + 1, want = wanted();
    let h = `<section class="sect"><h3 class="sect-h">${G.L('Fonderie <small>minerai → lingots</small>', 'Smelter <small>ore → ingots</small>')}</h3>`;
    for (const id in G.SMELT) {
      const r = G.SMELT[id];
      if (r.ch > ch) { h += lockedCard(id, r.ch); continue; }
      const ok = G.can(r.in);
      h += `<div class="card recipe">
        <div class="rc-ico">${G.icon(id, 34)}</div>
        <div class="rc-main"><b>${G.itemName(id)} <span class="x">×${r.out}</span></b>${reqChips(r.in)}</div>
        <button class="btn ${ok ? 'primary' : ''}" data-smelt="${id}" ${ok ? '' : 'disabled'}>${G.L('Fondre', 'Smelt')}</button></div>`;
    }
    const cats = ['Outils', 'Armes', 'Armures', 'Commandes'];
    const catWant = c => Object.keys(G.RECIPES).some(id => G.RECIPES[id].cat === c && want[id] && G.RECIPES[id].ch <= ch);
    h += `</section><section class="sect"><h3 class="sect-h">${G.L('Enclume <small>forgeage + trempe</small>', 'Anvil <small>forging + quench</small>')}</h3>
      <div class="seg">${cats.map(c => `<button class="seg-b ${forgeCat === c ? 'on' : ''}" data-cat="${c}">${CAT_LABEL[c] || c}${catWant(c) ? '<i class="dot"></i>' : ''}</button>`).join('')}</div>`;
    for (const id in G.RECIPES) {
      const r = G.RECIPES[id];
      if (r.cat !== forgeCat) continue;
      if (r.ch > ch) { h += lockedCard(id, r.ch); continue; }
      const ok = G.can(r.in);
      h += `<div class="card recipe ${want[id] ? 'wanted' : ''}">
        <div class="rc-ico">${G.icon(id, 34)}</div>
        <div class="rc-main"><b>${G.itemName(id)}${want[id] ? ` <span class="tag">${want[id]}</span>` : ''}</b><span class="sub">${statLine(id)}</span>${reqChips(r.in)}</div>
        <button class="btn ${ok ? 'primary' : ''}" data-forge="${id}" ${ok ? '' : 'disabled'}>${G.L('Forger', 'Forge')}</button></div>`;
    }
    h += `</section><section class="sect"><h3 class="sect-h">${G.L('Établi', 'Workbench')}</h3>`;
    for (const id in G.BENCH) {
      const r = G.BENCH[id], ok = G.can(r.in);
      h += `<div class="card recipe"><div class="rc-ico">${G.icon(id, 34)}</div>
        <div class="rc-main"><b>${G.itemName(id)}</b><span class="sub">${G.ITEMS[id].desc}</span>${reqChips(r.in)}</div>
        <button class="btn ${ok ? 'primary' : ''}" data-bench="${id}" ${ok ? '' : 'disabled'}>${G.L('Assembler', 'Assemble')}</button></div>`;
    }
    return h + '</section>';
  }

  function lockedCard(id, ch) {
    return `<div class="card recipe locked"><div class="rc-ico">${G.icon(id, 34)}</div><div class="rc-main"><b>${G.itemName(id)}</b><span class="sub">${chapL(ch - 1)}</span></div></div>`;
  }

  function tabMine() {
    const p = G.player();
    let h = `<section class="sect"><div class="card kit">
      <div class="kit-row">${G.icon(G.equipped('pioche').id, 30)}<div><b>${G.itemName(G.equipped('pioche').id)}</b><span class="sub">${G.L(`Puissance ${p.power} · Endurance ${p.energy} · Lumière ${p.light}`, `Power ${p.power} · Stamina ${p.energy} · Light ${p.light}`)}</span></div></div>
      <div class="kit-row">${G.icon('ration', 30)}<div><b>${G.L('Rations : ', 'Rations: ')}${G.count('ration')}</b><span class="sub">${G.L('+15 endurance pendant la descente.', '+15 stamina during the descent.')}</span></div></div></div>
      <button class="btn ghost small" data-help="mine">${G.L('Comment ça marche ?', 'How does it work?')}</button></section>
      <section class="sect"><h3 class="sect-h">${G.L('Galeries', 'Tunnels')}</h3>`;
    G.MINE.forEach((L, i) => {
      const lockedCh = L.ch > G.state.ch + 1;
      const weak = p.power < L.reqPower;
      const best = G.state.best.depth[L.id] || 0;
      const noteDone = L.note && G.count(L.note) > 0;
      const img = G.img('img/decors/mine' + L.id + '.webp');
      h += `<div class="card level ${lockedCh ? 'locked' : ''} ${img ? 'has-img' : ''}" ${img ? `style="background-image:linear-gradient(90deg, rgba(21,17,14,.95) 0%, rgba(21,17,14,.78) 60%, rgba(21,17,14,.35) 100%), url(${img})"` : ''}>
        <div class="lv-n">${i + 1}</div>
        <div class="rc-main"><b>${L.name}</b><span class="sub">${lockedCh ? chapL(L.ch - 1) : L.desc}</span>
          ${lockedCh ? '' : `<span class="meta">${G.L(`Pioche ${L.reqPower}+ · Record : ${best} m${L.note ? (noteDone ? ' · Carnet trouvé' : ' · <em>Un carnet attend au fond</em>') : ''}`, `Pickaxe ${L.reqPower}+ · Best: ${best} m${L.note ? (noteDone ? ' · Notebook found' : ' · <em>A notebook waits at the bottom</em>') : ''}`)}</span>`}</div>
        ${lockedCh ? '' : `<button class="btn ${weak ? '' : 'primary'}" data-mine="${i}" ${weak ? 'disabled' : ''}>${weak ? G.L('Pioche ' + L.reqPower + ' requise', 'Pickaxe ' + L.reqPower + ' needed') : G.L('Descendre', 'Descend')}</button>`}</div>`;
    });
    return h + '</section>';
  }

  function monThumb(e) {
    const p = G.img('img/monstres/' + e + '.webp');
    return p ? `<img class="mon-th" src="${p}" alt="${G.ENEMIES[e].name}" title="${G.ENEMIES[e].name}">` : `<span title="${G.ENEMIES[e].name}">${G.ENEMIES[e].emoji}</span>`;
  }

  function tabHunt() {
    const p = G.player();
    let h = `<section class="sect"><div class="card kit">
      <div class="kit-row">${G.icon(G.equipped('arme').id, 30)}<div><b>${p.weapon}</b><span class="sub">${G.L(`ATQ ${p.atk} · ${dmgT(p.wtype)}${p.silver ? ' · argent' : ''}`, `ATK ${p.atk} · ${dmgT(p.wtype)}${p.silver ? ' · silver' : ''}`)}</span></div></div>
      <div class="kit-row">${G.icon(G.equipped('armure').id, 30)}<div><b>${G.itemName(G.equipped('armure').id)}</b><span class="sub">${G.L(`${p.hpMax} PV · DÉF ${p.def}${p.rustproof ? ' · anti-Rouille' : ''}`, `${p.hpMax} HP · DEF ${p.def}${p.rustproof ? ' · Rust-proof' : ''}`)}</span></div></div>
      <div class="kit-row">${G.icon('potion', 30)}<div><b>${G.L(`Potions ${G.count('potion') + G.count('grande_potion')} · Bombes ${G.count('bombe')}`, `Potions ${G.count('potion') + G.count('grande_potion')} · Bombs ${G.count('bombe')}`)}</b><span class="sub">${G.L('Utilisables pendant le combat.', 'Usable during combat.')}</span></div></div></div>
      <button class="btn ghost small" data-help="combat">${G.L('Comment ça marche ?', 'How does it work?')}</button></section>
      ${G.state.ended ? `<section class="sect"><div class="card hard-card"><label class="tgl"><input type="checkbox" id="hard-tgl" ${G.state.hard !== false ? 'checked' : ''}><span><b>${G.L('Combats renforcés', 'Hardened fights')}</b><small>${G.L('Ennemis taillés pour la Lame d’Aube et l’armure d’argent. Butin doublé, or triplé, gemmes.', 'Enemies built for the Dawn Blade and silver armour. Double loot, triple gold, gems.')}</small></span></label></div></section>` : ''}
      <section class="sect"><h3 class="sect-h">${G.L('Territoires', 'Territories')}</h3>`;
    for (const id in G.ZONES) {
      const z = G.ZONES[id];
      const img = G.img('img/decors/' + ZONE_IMG[id] + '.webp');
      const style = img ? `style="background-image:linear-gradient(90deg, rgba(21,17,14,.96) 0%, rgba(21,17,14,.8) 55%, rgba(21,17,14,.4) 100%), url(${img})"` : '';
      if (z.ch > G.state.ch + 1) { h += `<div class="card zone locked ${img ? 'has-img' : ''}" ${style}><div class="rc-main"><b>${z.name}</b><span class="sub">${chapL(z.ch - 1)}</span></div></div>`; continue; }
      // après la fin, tous les boss se réaffrontent à volonté
      const bossOpen = (z.bossCh <= G.state.ch + 1 && !G.state.boss[z.boss]) || !!G.state.ended;
      const bd = G.ENEMIES[z.boss];
      h += `<div class="card zone ${img ? 'has-img' : ''}" ${style}>
        <div class="rc-main"><b>${z.name}</b><span class="sub">${z.desc}</span>
        <span class="mons">${[...new Set(z.pool)].map(monThumb).join('')}</span></div>
        <div class="zone-btns">
          ${z.bossOnly ? '' : `<button class="btn primary" data-hunt="${id}">${G.L('Chasser', 'Hunt')}</button>`}
          ${bossOpen ? `<button class="btn boss" data-boss="${id}">${G.state.boss[z.boss] ? G.L('Revanche : ', 'Rematch: ') : ''}${bd.name}</button>` : (G.state.boss[z.boss] ? `<span class="done-tag">${G.L(`Boss vaincu : ${bd.name}`, `Boss defeated: ${bd.name}`)}</span>` : '')}
        </div></div>`;
    }
    return h + '</section>';
  }

  function qBadge(q, g) { const t = G.qual(q); return `<span class="qb ${t.cls}">${t.name}</span>${g ? G.gemDots(g) : ''}`; }
  const STARTERS = ['dague_rouillee', 'tablier', 'pioche_vieille'];

  /* ---------- raffinage : meule et sertissage ---------- */
  function tabRefine() {
    const eq = Object.values(G.state.eq);
    const all = G.state.gear.filter(g => G.RECIPES[g.id]).sort((a, b) => a.id.localeCompare(b.id) || b.q - a.q);
    const tag = g => eq.includes(g.uid) ? ` <span class="tag good">${G.L('Équipée', 'Equipped')}</span>` : '';
    let h = foldOpen('meule', G.L('La meule', 'The grindstone'), G.L('reprise de qualité', 'quality rework'), false);
    h += G.L('<p class="help">Une pièce ne passe qu’une seule fois à la meule. Bien reprise, elle gagne jusqu’à +15 de qualité ; ratée, elle peut en perdre un peu (−5 au pire). Ses gemmes restent en place.</p>', '<p class="help">A piece goes to the grindstone only once. Done well, it gains up to +15 quality; botched, it may lose a little (−5 at worst). Its gems stay in place.</p>');
    // filtre par qualité (gardé en mémoire) : ne reprendre que le Bon, sans risquer un Excellent
    const tiers = G.QUALITY.filter(t => t.min < 95), f = (G.state.fold || {}).honeQ;
    const cand = all.filter(g => G.refine.canHone(g));
    h += `<div class="seg qfilter"><button class="seg-b ${f === undefined ? 'on' : ''}" data-hq="all">${G.L('Toutes', 'All')}</button>${tiers.map((t, i) => `<button class="seg-b ${f === i ? 'on' : ''}" data-hq="${i}">${t.name}</button>`).join('')}</div>`;
    const hone = cand.filter(g => f === undefined || G.qual(g.q) === tiers[f]);
    if (!hone.length) h += `<p class="help">${cand.length ? G.L('Aucune pièce de cette qualité.', 'No piece of this quality.') : G.L('Aucune pièce à reprendre.', 'No piece to rework.')}</p>`;
    hone.forEach(g => {
      const next = G.QUALITY.find(t => t.min > g.q);
      h += `<div class="card recipe"><div class="rc-ico">${G.icon(g.id, 32)}</div>
        <div class="rc-main"><b>${G.itemName(g.id)} ${qBadge(g.q, g)}${tag(g)}</b><span class="sub">${G.L(`Qualité ${g.q}${next ? ` · ${next.name} à ${next.min}` : ''}`, `Quality ${g.q}${next ? ` · ${next.name} at ${next.min}` : ''}`)}</span></div>
        <button class="btn primary" data-hone="${g.uid}">${G.HONE_VERB(G.itemDef(g.id).kind)}</button></div>`;
    });
    h += foldClose;
    const gems = Object.keys(G.GEMS).filter(k => G.count(k) > 0);
    h += foldOpen('sertir', G.L('Sertissage', 'Gem setting'), G.L('gemmes', 'gems'), false);
    h += `<div class="gem-inv">${Object.keys(G.GEMS).map(k => `<span class="gem-chip ${G.count(k) ? '' : 'none'}">${G.icon(k, 26)}<b>${G.count(k)}</b><small>${G.GEMS[k].slot === 'arme' ? G.L('arme', 'weapon') : G.L('armure', 'armor')}</small></span>`).join('')}</div>`;
    h += G.L('<p class="help">Excellent : 1 chasse. Chef-d’œuvre : 2 chasses. Rubis et cristal astral vont sur les armes, quartz et saphir sur les armures. Chaque gemme augmente aussi la valeur de la pièce.</p>', `<p class="help">${G.qual(85).name}: 1 socket. ${G.qual(95).name}: 2 sockets. ${G.itemName('rubis')} and ${G.itemName('cristal')} go on weapons, ${G.itemName('quartz')} and ${G.itemName('saphir')} on armour. Each gem also raises the piece’s value.</p>`);
    const sock = all.filter(g => (G.refine.settable(g) && G.sockets(g) > 0) || (g.gems || []).length);
    if (!sock.length) h += G.L('<p class="help">Aucune pièce Excellente pour l’instant.</p>', `<p class="help">No ${G.qual(85).name} piece yet.</p>`);
    sock.forEach(g => {
      const free = G.refine.freeSockets(g), ok = G.refine.gemsFor(g).filter(k => G.count(k) > 0);
      const slots = Array.from({ length: G.sockets(g) }, (_, i) => { const x = (g.gems || [])[i]; return x ? `<span class="sock full">${G.icon(x.id, 22)}</span>` : '<span class="sock"></span>'; }).join('');
      const effs = (g.gems || []).map(x => G.GEAR[g.id].slot === 'commande' ? G.L('valeur +25 %', 'value +25%') : G.GEMS[x.id].eff(x.k)).join(' · ');
      h += `<div class="card recipe"><div class="rc-ico">${G.icon(g.id, 32)}</div>
        <div class="rc-main"><b>${G.itemName(g.id)} ${qBadge(g.q)}${tag(g)}</b><span class="socks">${slots}</span>${effs ? `<span class="sub">${effs}</span>` : ''}</div>
        ${free > 0 ? `<button class="btn ${ok.length ? 'primary' : ''}" data-gem="${g.uid}" ${ok.length ? '' : 'disabled'}>${G.L('Sertir', 'Set')}</button>` : ''}</div>`;
    });
    void gems;
    return h + foldClose;
  }
  async function askGem(uid) {
    const g = G.gearByUid(uid), ok = G.refine.gemsFor(g).filter(k => G.count(k) > 0);
    if (!ok.length) return;
    const v = await G.modal({
      title: G.L('Quelle gemme ?', 'Which gem?'), body: G.L(`<p class="sub">Pour ${G.itemName(g.id)}. La gemme est consommée.</p>`, `<p class="sub">For ${G.itemName(g.id)}. The gem is used up.</p>`),
      buttons: ok.map(k => ({ label: `${G.icon(k, 20)} ${G.itemName(k)} (${G.count(k)}) · ${G.GEAR[g.id].slot === 'commande' ? G.L('valeur +25 %', 'value +25%') : G.GEMS[k].eff(1)}`, value: k, primary: true })).concat([{ label: G.L('Annuler', 'Cancel'), value: null }]),
    });
    if (v) G.refine.gemset(uid, v);
  }

  function tabBag() {
    let h = `<section class="sect"><h3 class="sect-h">${G.L('Équipé', 'Equipped')}</h3><div class="eq-grid">`;
    [['arme', G.L('Arme', 'Weapon')], ['armure', G.L('Armure', 'Armor')], ['pioche', G.L('Pioche', 'Pickaxe')], ['lanterne', G.L('Lanterne', 'Lantern')]].forEach(([slot, lab]) => {
      const g = G.equipped(slot);
      h += `<div class="card eq"><span class="eyebrow">${lab}</span>${g ? `${G.icon(g.id, 36)}<b>${G.itemName(g.id)}</b>${qBadge(g.q, g)}<span class="sub">${gearLine(g)}</span>` : `<span class="sub">${G.L('Aucune', 'None')}</span>`}</div>`;
    });
    const equipped = Object.values(G.state.eq);
    const cmds = G.state.gear.filter(g => G.GEAR[g.id].slot === 'commande');
    const others = G.state.gear.filter(g => !equipped.includes(g.uid) && G.GEAR[g.id].slot !== 'commande');
    h += '</div></section>';
    if (cmds.length) {
      h += `<section class="sect"><h3 class="sect-h">${G.L('Commandes prêtes', 'Ready orders')}</h3>`;
      cmds.sort((a, b) => a.id.localeCompare(b.id) || b.q - a.q).forEach(g => {
        h += `<div class="card recipe"><div class="rc-ico">${G.icon(g.id, 32)}</div>
          <div class="rc-main"><b>${G.itemName(g.id)} ${qBadge(g.q, g)}</b><span class="sub">${G.GEAR[g.id].desc}</span></div>
          <button class="btn ghost" data-sellg="${g.uid}">${G.L('Vendre', 'Sell')} ${gearPrice(g)}</button></div>`;
      });
      h += '</section>';
    }
    h += `<section class="sect"><h3 class="sect-h">${G.L('Équipement', 'Gear')}</h3>`;
    if (!others.length) h += G.L('<p class="help">Rien d’autre pour l’instant. Ce que tu forges arrive ici.</p>', '<p class="help">Nothing else yet. What you forge ends up here.</p>');
    others.sort((a, b) => a.id.localeCompare(b.id) || b.q - a.q).forEach(g => {
      h += `<div class="card recipe"><div class="rc-ico">${G.icon(g.id, 32)}</div>
        <div class="rc-main"><b>${G.itemName(g.id)} ${qBadge(g.q, g)}</b><span class="sub">${gearLine(g)}</span></div>
        <div class="zone-btns"><button class="btn primary" data-equip="${g.uid}">${G.L('Équiper', 'Equip')}</button>${STARTERS.includes(g.id) ? '' : `<button class="btn ghost" data-sellg="${g.uid}">${G.L('Vendre', 'Sell')} ${gearPrice(g)}</button>`}</div></div>`;
    });
    h += `</section><section class="sect"><h3 class="sect-h">${G.L('Matériaux & objets', 'Materials & items')}</h3><div class="inv-grid">`;
    const ids = Object.keys(G.state.inv).filter(k => G.state.inv[k] > 0);
    const order = Object.keys(G.ITEMS);
    ids.sort((a, b) => order.indexOf(a) - order.indexOf(b));
    if (!ids.length) h += G.L('<p class="help">Sac vide.</p>', '<p class="help">Bag empty.</p>');
    ids.forEach(id => { h += `<button class="inv" data-info="${id}">${G.icon(id, 30)}<span class="n">${G.state.inv[id]}</span></button>`; });
    return h + '</div></section>';
  }

  function gearLine(g) {
    const s = G.gearStats(g), d = G.GEAR[g.id];
    if (s.cmd) return d.desc;
    if (s.atk !== undefined) return G.L(`ATQ ${s.atk} · ${dmgT(d.type)}`, `ATK ${s.atk} · ${dmgT(d.type)}`);
    if (s.def !== undefined) return G.L(`DÉF ${s.def} · +${s.hp} PV`, `DEF ${s.def} · +${s.hp} HP`);
    if (s.power !== undefined) return G.L(`Puissance ${s.power} · endurance ${s.energy >= 0 ? '+' : ''}${s.energy}`, `Power ${s.power} · stamina ${s.energy >= 0 ? '+' : ''}${s.energy}`);
    if (s.light) return G.L(`+${s.light} lumière`, `+${s.light} light`);
    return '';
  }
  G.gearPrice = g => gearPrice(g);
  function gearPrice(g) {
    const r = G.RECIPES[g.id];
    if (!r) return 5;
    let v = 0; for (const k in r.in) v += ((G.ITEMS[k] || {}).sell || 2) * r.in[k];
    return Math.max(5, Math.round(v * 0.8 * G.qual(g.q).mult * (G.hasPerk('commerce') ? 1.25 : 1) * (1 + 0.25 * ((g.gems || []).length))));
  }

  /* ---------- livraisons (histoire + tableau) ---------- */
  // pièces forgées disponibles pour une livraison : d'abord celles qui ne sont pas équipées, puis la qualité la plus basse suffisante
  function findGear(item, n, minQ) {
    const eq = Object.values(G.state.eq);
    const c = G.state.gear.filter(x => x.id === item && x.q >= (minQ || 0))
      .sort((a, b) => (eq.includes(a.uid) - eq.includes(b.uid)) || a.q - b.q);
    return c.length >= n ? c.slice(0, n) : null;
  }
  function haveFor(item, n, minQ) {
    return G.GEAR[item] ? findGear(item, n, minQ) : (G.count(item) >= n ? true : null);
  }
  function countFor(item, minQ) {
    return G.GEAR[item] ? G.state.gear.filter(x => x.id === item && x.q >= (minQ || 0)).length : G.count(item);
  }
  // choix des pièces à livrer : demandé dès qu'il y a un choix possible ou qu'une pièce équipée partirait
  function choosePieces(item, n, minQ, rewardOf) {
    const eq = Object.values(G.state.eq);
    const all = G.state.gear.filter(x => x.id === item && x.q >= (minQ || 0))
      .sort((a, b) => (eq.includes(a.uid) - eq.includes(b.uid)) || a.q - b.q);
    if (all.length < n) return Promise.resolve(null);
    const def = all.slice(0, n).map(x => x.uid);
    if (all.length === n && !def.some(u => eq.includes(u))) return Promise.resolve(def);
    let sel = def.slice();
    const row = g => `<button class="pick ${sel.includes(g.uid) ? 'on' : ''}" data-uid="${g.uid}" type="button">
        ${G.icon(g.id, 40)}<span class="pick-main"><b>${G.itemName(g.id)}</b>${qBadge(g.q)}${eq.includes(g.uid) ? `<span class="tag bad">${G.L('Équipée', 'Equipped')}</span>` : ''}</span><span class="pick-chk"></span></button>`;
    return G.modal({
      title: n > 1 ? G.L(`Quelles ${n} pièces livrer ?`, `Which ${n} pieces to deliver?`) : G.L('Quelle pièce livrer ?', 'Which piece to deliver?'),
      body: `<p class="sub">${G.L('Touche une pièce pour la choisir.', 'Tap a piece to choose it.')}${rewardOf ? G.L(' La qualité fait le prix.', ' Quality sets the price.') : ''}</p><div class="pick-list">${all.map(row).join('')}</div><p class="warn" id="pick-warn" hidden>${G.L('Attention : tu vas livrer une pièce que tu portes.', 'Careful: you are about to deliver a piece you are wearing.')}</p><p class="sub" id="pick-gain"></p>`,
      buttons: [{ label: G.L('Annuler', 'Cancel'), value: false }, { label: G.L('Livrer', 'Deliver'), value: true, primary: true }],
      collect: () => sel.slice(),
      onOpen: m => {
        const refresh = () => {
          G.$$('.pick', m).forEach(b => b.classList.toggle('on', sel.includes(+b.dataset.uid)));
          G.$('#pick-warn', m).hidden = !sel.some(u => eq.includes(u));
          const ok = G.$('.modal-btns .btn[data-i="1"]', m);
          ok.disabled = sel.length !== n;
          if (rewardOf) G.$('#pick-gain', m).textContent = sel.length === n ? G.L(`Récompense : ${rewardOf(sel.map(u => G.gearByUid(u)))} or`, `Reward: ${rewardOf(sel.map(u => G.gearByUid(u)))} gold`) : '';
        };
        G.$$('.pick', m).forEach(b => b.addEventListener('click', () => {
          const u = +b.dataset.uid; G.sfx('tick');
          if (n === 1) sel = [u];
          else if (sel.includes(u)) sel = sel.filter(x => x !== u);
          else { sel.push(u); if (sel.length > n) sel.shift(); }
          refresh();
        }));
        refresh();
      },
    }).then(r => (r && r.value && r.data.length === n ? r.data : null));
  }

  function takeItems(item, n, minQ, uids) {
    if (G.GEAR[item]) {
      const found = uids ? uids.map(u => G.gearByUid(u)).filter(Boolean) : findGear(item, n, minQ);
      found.forEach(it => {
        for (const slot in G.state.eq) if (G.state.eq[slot] === it.uid) G.state.eq[slot] = 0;
        G.state.gear = G.state.gear.filter(x => x.uid !== it.uid);
      });
      reequip();
      return found;
    }
    G.add(item, -n);
    return null;
  }

  function deliverable() {
    if (!G.state.ended && G.CHAPTERS[G.state.ch].goals.some(g => g.type === 'deliver' && !G.state.goals[g.id] && haveFor(g.item, g.count || 1, g.minQ))) return true;
    if (arcSteps().some(a => haveFor(a.step.item, a.step.n, a.step.minQ))) return true;
    return (G.state.board || []).some(b => { const r = G.REQUESTS[b.k]; return r && haveFor(r.item, r.n, r.minQ); });
  }

  /* ---------- tableau des commandes ---------- */
  function reqAvailable(r) {
    if (r.end && !G.state.ended) return false;   // commandes de fin de partie (Hogar)
    const ch = G.state.ch + 1;
    if (r.ch > ch) return false;
    const rec = G.RECIPES[r.item];
    if (rec && rec.ch > ch) return false;
    return true;
  }
  function refillBoard() {
    G.state.board = (G.state.board || []).filter(b => G.REQUESTS[b.k]);
    const recent = G.state.recent || [];
    let guard = 0;
    while (G.state.board.length < 3 && guard++ < 40) {
      const used = G.state.board.map(b => b.k);
      const npcs = G.state.board.map(b => G.REQUESTS[b.k].npc);
      const pool = G.REQUESTS.map((r, k) => ({ r, k })).filter(({ r, k }) => reqAvailable(r) && !used.includes(k) && !recent.includes(k));
      if (!pool.length) break;
      // varier les villageois et favoriser les commandes du chapitre en cours
      const weighted = pool.map(({ r, k }) => [k, (npcs.includes(r.npc) ? 0.3 : 1) * (r.ch === G.state.ch + 1 ? 1.6 : 1)]);
      const k = G.wpick(weighted)[0];
      G.state.board.push({ k, fresh: true });
    }
  }
  function reqReward(r, pieces) {
    let g = r.gold;
    if (pieces) {
      const avg = pieces.reduce((a, p) => a + p.q, 0) / pieces.length;
      g *= G.qual(avg).mult;
    }
    if (G.repLevel() >= 3) g *= 1.25;
    return Math.round(g);
  }
  function qualTag(minQ) { return minQ ? `<span class="qb ${G.qual(minQ).cls}">${G.qual(minQ).name}+</span>` : ''; }

  function boardHTML() {
    const b = G.state.board || [];
    let h = foldOpen('board', G.L('Commandes du village', 'Village orders'), `${b.length}/3`, b.some(e => { const r = G.REQUESTS[e.k]; return r && haveFor(r.item, r.n, r.minQ); }));
    if (!b.length) h += G.L('<p class="help">Pas de nouvelle commande pour l’instant. Reviens après ta prochaine sortie.</p>', '<p class="help">No new orders for now. Come back after your next outing.</p>');
    b.forEach((e, i) => {
      const r = G.REQUESTS[e.k], npc = G.NPCS[r.npc];
      const can = haveFor(r.item, r.n, r.minQ);
      const pic = G.img('img/portraits/' + r.npc + '.webp');
      const isGear = !!G.GEAR[r.item];
      h += `<div class="card req ${e.fresh ? 'fresh' : ''}">
        <div class="req-top">
          <span class="req-face" style="--c:${npc.color}">${pic ? `<img src="${pic}" alt="">` : npc.emoji}</span>
          <div class="rc-main"><b style="color:${npc.color}">${npc.name.split(',')[0]}</b><span class="sub req-txt">${G.L(`« ${r.txt} »`, `“${r.txt}”`)}</span></div>
          <button class="x-btn" data-drop="${i}" aria-label="${G.L('Refuser la commande', 'Decline the order')}">×</button>
        </div>
        <div class="req-bot">
          <span class="req-item">${G.icon(r.item, 26)}<b>${r.n} × ${G.itemName(r.item)}</b>${qualTag(r.minQ)}</span>
          <span class="req-rew">${G.L(`${r.gold} or${isGear ? ' <small>× qualité</small>' : ''} · +${r.rep} renommée`, `${r.gold} gold${isGear ? ' <small>× quality</small>' : ''} · +${r.rep} renown`)}</span>
          <span class="prog">${Math.min(countFor(r.item, r.minQ), r.n)}/${r.n}</span>
          <button class="btn ${can ? 'primary' : ''}" data-req="${i}" ${can ? '' : 'disabled'}>${G.L('Livrer', 'Deliver')}</button>
        </div></div>`;
    });
    return h + foldClose;
  }

  /* ---------- ton échoppe (fin de partie) ---------- */
  function shopCardHTML() {
    if (!G.shop.unlocked()) {
      if (((G.state.arcs || {}).odile || 0) >= 1) return `<section class="sect"><div class="card shop-teaser"><b>${G.L('Ton échoppe', 'Your shop')}</b><span class="sub">${G.L(`Termine l’histoire d’Odile pour ouvrir ta propre boutique (étape ${(G.state.arcs || {}).odile} / 3 faite).`, `Finish Odile’s story to open your own shop (step ${(G.state.arcs || {}).odile} / 3 done).`)}</span></div></section>`;
      return '';
    }
    const d = G.shop.data(), stock = G.shop.stock().length;
    return `<section class="sect"><h3 class="sect-h">${G.L('Ton échoppe', 'Your shop')} ${G.shop.starsHTML(G.shop.stars())} ${G.shop.repBar()}</h3>
      <div class="card shop-card">
        <p class="sub">${stock ? G.L(`${stock} pièce${stock > 1 ? 's' : ''} sur ton étal.`, `${stock} piece${stock > 1 ? 's' : ''} on your stall.`) : G.L('Ton étal est vide : forge des pièces à vendre (les pièces équipées restent sur toi).', 'Your stall is empty: forge pieces to sell (equipped pieces stay on you).')}</p>
        <div class="shop-stats"><span><b>${d.days}</b> ${G.L('journées', 'days')}</span><span><b>${d.sales}</b> ${G.L('ventes', 'sales')}</span><span><b>${d.best}</b> ${G.L('or, meilleure vente', 'gold, best sale')}</span></div>
        <button class="btn ${stock ? 'primary' : ''}" id="shop-open" ${stock ? '' : 'disabled'}>${G.L('Ouvrir pour la journée', 'Open for the day')}</button>
      </div></section>`;
  }

  /* ---------- sections pliables (état gardé dans la sauvegarde) ---------- */
  function foldOpen(key, title, small, ready) {
    const closed = !!(G.state.fold || {})[key];
    return `<section class="sect fold ${closed ? 'closed' : ''}"><button class="sect-h fold-h" data-fold="${key}" aria-expanded="${!closed}">
      <span class="fold-t">${title}${small ? ` <small>${small}</small>` : ''}</span>${ready ? `<span class="ready">${G.L('À livrer', 'Ready to deliver')}</span>` : ''}<i class="chev" aria-hidden="true"></i></button>
      <div class="fold-body" ${closed ? 'hidden' : ''}>`;
  }
  const foldClose = '</div></section>';

  /* ---------- histoires des villageois ---------- */
  // étapes disponibles : une par villageois, si le chapitre le permet
  function arcSteps() {
    const done = G.state.arcs || {}, ch = G.state.ch + 1, out = [];
    Object.keys(G.ARCS).forEach(npc => {
      const a = G.ARCS[npc], i = done[npc] || 0, step = a.steps[i];
      if (step && step.ch <= ch) out.push({ npc, a, i, step });
    });
    return out;
  }
  function arcsHTML() {
    const list = arcSteps(), finished = Object.keys(G.ARCS).filter(n => (G.state.arcs || {})[n] >= G.ARCS[n].steps.length);
    if (!list.length && !finished.length) return '';
    let h = foldOpen('arcs', G.L('Histoires du village', 'Village stories'), `${finished.length}/${Object.keys(G.ARCS).length}`, list.some(x => haveFor(x.step.item, x.step.n, x.step.minQ)));
    list.forEach(({ npc, a, i, step }) => {
      const p = G.NPCS[npc], can = haveFor(step.item, step.n, step.minQ);
      const pic = G.img('img/portraits/' + npc + '.webp');
      const last = i === a.steps.length - 1, perk = G.PERKS[a.perk];
      h += `<div class="card req arc">
        <div class="req-top">
          <span class="req-face" style="--c:${p.color}">${pic ? `<img src="${pic}" alt="">` : p.emoji}</span>
          <div class="rc-main"><span class="eyebrow">${a.title} · ${i + 1}/${a.steps.length}</span><b style="color:${p.color}">${p.name.split(',')[0]}</b><span class="sub req-txt">${G.L(`« ${G.fmt(step.txt)} »`, `“${G.fmt(step.txt)}”`)}</span></div>
        </div>
        <div class="req-bot">
          <span class="req-item">${G.icon(step.item, 26)}<b>${step.n} × ${G.itemName(step.item)}</b>${qualTag(step.minQ)}</span>
          <span class="req-rew">${G.L(`${step.gold} or · +${step.rep} renommée`, `${step.gold} gold · +${step.rep} renown`)}${last && perk ? ` · <b class="arc-perk">${perk.name}</b>` : ''}</span>
          <span class="prog">${Math.min(countFor(step.item, step.minQ), step.n)}/${step.n}</span>
          <button class="btn ${can ? 'primary' : ''}" data-arc="${npc}" ${can ? '' : 'disabled'}>${G.L('Livrer', 'Deliver')}</button>
        </div></div>`;
    });
    if (finished.length) {
      h += `<div class="card perks-done">${finished.map(n => { const pk = G.PERKS[G.ARCS[n].perk]; return `<div class="perk-row">${G.icon(pk.icon, 30)}<div class="rc-main"><b>${pk.name}</b><span class="sub">${G.ARCS[n].title} · ${pk.desc}</span></div></div>`; }).join('')}</div>`;
    }
    return h + foldClose;
  }
  async function deliverArc(npc) {
    const a = G.ARCS[npc], i = (G.state.arcs || {})[npc] || 0, step = a.steps[i];
    if (!step || !haveFor(step.item, step.n, step.minQ)) return;
    const before = G.repLevel();
    let uids = null;
    if (G.GEAR[step.item]) { uids = await choosePieces(step.item, step.n, step.minQ, () => step.gold); if (!uids) return; }
    takeItems(step.item, step.n, step.minQ, uids);
    G.state.arcs = G.state.arcs || {}; G.state.arcs[npc] = i + 1;
    G.state.gold += step.gold;
    G.state.rep = (G.state.rep || 0) + step.rep;
    G.sfx('coin');
    G.save(); keepScroll();
    await G.story(step.after);
    if (i === a.steps.length - 1) {
      G.state.perks = G.state.perks || {}; G.state.perks[a.perk] = true; G.save();
      const pk = G.PERKS[a.perk];
      G.sfx('win');
      await G.modal({ title: G.L('Histoire terminée', 'Story complete'), cls: 'summary good', body: `<div class="info-ico">${G.icon(pk.icon, 64)}</div><p class="big-name">${pk.name}</p><p>${pk.desc}</p><p class="sub">${a.title}, ${G.L('avec', 'with')} ${G.NPCS[npc].name.split(',')[0]}.</p>`, buttons: [{ label: G.L('Merci', 'Thank you'), value: true, primary: true }] });
    } else G.toast(G.L(`${G.NPCS[npc].name.split(',')[0]} : +${step.gold} or · +${step.rep} renommée`, `${G.NPCS[npc].name.split(',')[0]}: +${step.gold} gold · +${step.rep} renown`), 'good');
    keepScroll();
    const after = G.repLevel();
    if (after > before) {
      const lv = G.REP[after];
      G.sfx('win');
      await G.modal({ title: G.L('Renommée ', 'Renown ') + (after + 1), cls: 'summary good', body: `<p class="big-name">${lv.name}</p><p>${lv.perk}</p>`, buttons: [{ label: G.L('Formidable', 'Wonderful'), value: true, primary: true }] });
      keepScroll();
    }
    checkGoals();
  }

  function repHTML() {
    const l = G.repLevel(), cur = G.REP[l], next = G.REP[l + 1], rep = G.state.rep || 0;
    const pct = next ? Math.round((rep - cur.at) / (next.at - cur.at) * 100) : 100;
    return `<section class="sect"><div class="card rep">
      <div class="rep-head"><span class="rep-medal">${G.icon('medaille', 56)}</span><div class="rc-main"><span class="eyebrow">${G.L('Renommée', 'Renown')} ${l + 1} / ${G.REP.length}</span><b class="rep-name">${cur.name}</b><span class="sub">${next ? G.L(`Prochain palier : ${next.name} (${rep}/${next.at})`, `Next tier: ${next.name} (${rep}/${next.at})`) : G.L('Renommée maximale', 'Maximum renown')}</span></div></div>
      <div class="bar rep-bar"><i style="width:${pct}%"></i></div>
      <ul class="perks">${G.REP.slice(1).map((r, i) => `<li class="${l >= i + 1 ? 'on' : ''}"><b>${i + 2}</b> ${r.perk}</li>`).join('')}</ul>
    </div></section>`;
  }

  /* ---------- journal : ce qu'il faut fournir, et où aller ---------- */
  function goalDetail(g) {
    if (g.type === 'craft' || g.type === 'deliver') {
      const ids = [].concat(g.item);
      return ids.map(id => {
        const r = G.RECIPES[id], n = g.count || 1;
        const line = `<span class="gd-item">${G.icon(id, 24)}<b>${n > 1 ? n + ' × ' : ''}${G.itemName(id)}</b>${g.minQ ? qualTag(g.minQ) : ''}</span>`;
        if (!r) return `<div class="goal-detail">${line}<span class="gd-where">${G.L('À récolter (mine ou chasse)', 'To gather (mine or hunt)')}</span></div>`;
        const locked = r.ch > G.state.ch + 1;
        return `<div class="goal-detail">${line}<span class="gd-where">${G.L('Recette', 'Recipe')}${n > 1 ? ' ×' + n : ''} :</span>${reqChips(r.in, n)}${locked ? `<span class="gd-where">${G.L('Recette pas encore connue', 'Recipe not known yet')}</span>` : ''}</div>`;
      }).join(ids.length > 1 ? `<span class="gd-or">${G.L('ou', 'or')}</span>` : '');
    }
    if (g.type === 'find') {
      const L = G.MINE.find(m => m.note === g.item);
      if (!L) return '';
      const pw = G.player().power;
      return `<div class="goal-detail"><span class="gd-item">${G.icon('carnet', 24)}<b>${G.itemName(g.item)}</b></span><span class="gd-where">${G.L('Mine', 'Mine')} · ${L.name} · ${G.L('tout au fond', 'at the very bottom')}</span>${pw < L.reqPower ? `<span class="gd-warn">${G.L(`Il faut une pioche de puissance ${L.reqPower} (la tienne : ${pw}).`, `Needs a pickaxe of power ${L.reqPower} (yours: ${pw}).`)}</span>` : ''}</div>`;
    }
    if (g.type === 'boss') {
      const zid = Object.keys(G.ZONES).find(k => G.ZONES[k].boss === g.enemy), Z = G.ZONES[zid], E = G.ENEMIES[g.enemy];
      const open = Z && G.state.ch + 1 >= (Z.bossCh || Z.ch);
      return `<div class="goal-detail"><span class="gd-item"><b>${E.name}</b></span><span class="gd-where">${G.L('Chasse', 'Hunt')} · ${Z ? Z.name : ''}</span>${E.weak ? `<span class="gd-where">${G.L('Faible : ', 'Weak: ')}${E.weak === 'aube' ? G.itemName('lame_aube') : dmgT(E.weak)}${E.rust ? G.L(' · prends une arme d’argent', ' · bring a silver weapon') : ''}</span>` : ''}${open ? '' : `<span class="gd-warn">${G.L('Pas encore accessible.', 'Not available yet.')}</span>`}</div>`;
    }
    if (g.type === 'rep') {
      const need = G.REP[g.level - 1].at, rep = G.state.rep || 0;
      return `<div class="goal-detail"><span class="gd-where">${G.L('Renommée', 'Renown')} ${rep} / ${need} · ${G.L('histoires et commandes du village', 'village stories and orders')}</span><div class="bar rep-bar"><i style="width:${Math.min(100, Math.round(rep / need * 100))}%"></i></div></div>`;
    }
    return '';
  }
  function goalGo(g) {
    let go = null, lab = '';
    if (g.type === 'craft') { const r = G.RECIPES[[].concat(g.item)[0]]; if (r) { go = 'forge:' + r.cat; lab = G.L('Forger', 'Forge'); } }
    else if (g.type === 'find') { go = 'mine'; lab = G.L('Mine', 'Mine'); }
    else if (g.type === 'boss') { go = 'chasse'; lab = G.L('Chasse', 'Hunt'); }
    return go ? `<div class="goal-act"><button class="btn ghost" data-goto="${go}">${lab} →</button></div>` : '';
  }

  function goalProgress(g) {
    if (G.state.goals[g.id] || g.type !== 'deliver') return '';
    return `${Math.min(countFor(g.item, g.minQ), g.count || 1)}/${g.count || 1}`;
  }

  function shopPrice(d) { return Math.round(d.price * (G.repLevel() >= 1 ? 0.85 : 1)); }

  function tabVillage() {
    let h = '';
    if (!G.state.ended) {
      const ch = G.CHAPTERS[G.state.ch];
      const jReady = ch.goals.some(g => g.type === 'deliver' && !G.state.goals[g.id] && haveFor(g.item, g.count || 1, g.minQ));
      h += foldOpen('journal', 'Journal', chapL(G.state.ch), jReady);
      ch.goals.forEach(g => {
        const done = !!G.state.goals[g.id];
        const can = !done && g.type === 'deliver' && haveFor(g.item, g.count || 1, g.minQ);
        const npc = g.npc ? G.NPCS[g.npc] : null;
        const extra = g.type === 'rep' && !done ? `<span class="prog">${G.repLevel() + 1}/${g.level}</span>` : '';
        h += `<div class="card goal ${done ? 'done' : ''}">
          <span class="check">${done ? '✓' : ''}</span>
          <div class="rc-main"><b>${g.title}</b>
          ${npc ? `<span class="sub" style="color:${npc.color}">${npc.name}${g.reward ? ' · ' + g.reward + G.L(' or', ' gold') : ''}</span>` : ''}
          ${done ? '' : `<span class="sub hint">${g.hint}</span>${goalDetail(g)}`}</div>
          ${g.type === 'deliver' && !done ? `<div class="goal-act"><span class="prog">${goalProgress(g)}</span><button class="btn ${can ? 'primary' : ''}" data-deliver="${g.id}" ${can ? '' : 'disabled'}>${G.L('Livrer', 'Deliver')}</button></div>` : done ? '' : goalGo(g) || extra}
        </div>`;
      });
      h += `<button class="btn ghost small" id="reread">${G.L('Relire l’introduction du chapitre', 'Reread the chapter introduction')}</button>` + foldClose;
    } else {
      h += `<section class="sect"><div class="card"><p>${G.L('La Rouille a quitté le mont Ardent. La forge est à toi : continue de miner, forger, chasser et honorer les commandes du village.', 'The Rust has left Mount Ardent. The forge is yours: keep mining, forging, hunting and filling the village orders.')}</p></div></section>`;
    }
    h += repHTML() + arcsHTML() + boardHTML();
    h += shopCardHTML();
    h += `<section class="sect"><h3 class="sect-h">${G.L('L’échoppe d’Odile', 'Odile’s stall')}${G.repLevel() >= 1 ? G.L(' <small>−15 %</small>', ' <small>−15%</small>') : ''}</h3>`;
    // après la fin : onglets Fournitures / Minerais / Lingots (selon les étoiles de ton échoppe)
    const otab = G.state.ended ? ((G.state.fold || {}).odile || 'base') : 'base';
    if (G.state.ended) h += `<div class="seg odile-tabs">${[['base', G.L('Fournitures', 'Supplies')], ['ore', G.L('Minerais', 'Ores')], ['ingot', G.L('Lingots', 'Ingots')]].map(([k, l]) => `<button class="seg-b ${otab === k ? 'on' : ''}" data-otab="${k}">${l}</button>`).join('')}</div>`;
    if (otab !== 'base') {
      const stars = G.shop.stars();
      h += `<p class="help">${G.L('Pour quand tu n’as pas envie de miner ou de fondre : c’est cher, mais ça t’évite le travail. Plus ton échoppe a d’étoiles, plus Odile te fournit.', 'For when you can’t be bothered to mine or smelt: it’s pricey, but it saves you the work. The more stars your shop has, the more Odile can supply.')}</p>`;
      G.LAZY.filter(([id]) => (G.ITEMS[id].kind === 'ore') === (otab === 'ore')).forEach(([id, need]) => {
        const d = G.ITEMS[id], pr = G.lazyPrice(id), lock = stars < need;
        h += `<div class="card recipe shop ${lock ? 'locked' : ''}"><div class="rc-ico">${G.icon(id, 30)}</div>
          <div class="rc-main"><b>${d.name} <span class="x">×${G.count(id)}</span></b><span class="sub">${lock ? G.L(`Il faut ${need} étoiles à ton échoppe.`, `Your shop needs ${need} stars.`) : d.desc}</span></div>
          ${lock ? `<span class="lock-stars">${G.shop.starsHTML(need)}</span>` : `<div class="zone-btns"><button class="btn ${G.state.gold >= pr ? 'primary' : ''}" data-lazy="${id}" data-n="1" ${G.state.gold >= pr ? '' : 'disabled'}>${pr} ${G.L('or', 'gold')}</button><button class="btn ghost" data-lazy="${id}" data-n="5" ${G.state.gold >= pr * 5 ? '' : 'disabled'}>×5 · ${pr * 5}</button></div>`}</div>`;
      });
    }
    if (otab === 'base') G.SHOP.forEach(id => {
      const d = G.ITEMS[id];
      if (d.ch && d.ch > G.state.ch + 1) return;
      const pr = shopPrice(d);
      h += `<div class="card recipe shop"><div class="rc-ico">${G.icon(id, 30)}</div>
        <div class="rc-main"><b>${d.name} <span class="x">×${G.count(id)}</span></b><span class="sub">${d.desc}</span></div>
        <button class="btn ${G.state.gold >= pr ? 'primary' : ''}" data-buy="${id}" ${G.state.gold >= pr ? '' : 'disabled'}>${pr} ${G.L('or', 'gold')}</button></div>`;
    });
    const sellable = Object.keys(G.state.inv).filter(k => G.state.inv[k] > 0 && G.ITEMS[k] && !G.ITEMS[k].key && G.ITEMS[k].sell);
    if (sellable.length) {
      h += `<h4 class="sub-h">${G.L('Vendre à Odile', 'Sell to Odile')}</h4><div class="inv-grid">`;
      sellable.forEach(id => { h += `<button class="inv" data-sell="${id}">${G.icon(id, 28)}<span class="n">${G.state.inv[id]}</span><span class="p">${G.sellPrice(id)}</span></button>`; });
      h += '</div>';
    }
    h += '</section>';
    return h;
  }

  /* ---------- actions (délégation unique, posée une fois) ---------- */
  function bindHub(s) {
    G.on(s, '[data-tab]', b => { G.sfx('tick'); tab = b.dataset.tab; renderHub(); G.$('#hub-body').scrollTop = 0; });
    G.on(s, '[data-cat]', b => { G.sfx('tick'); forgeCat = b.dataset.cat; keepScroll(); });
    G.on(s, '[data-goto]', b => { const [t, cat] = b.dataset.goto.split(':'); G.sfx('tick'); tab = t; if (cat) forgeCat = cat; renderHub(); G.$('#hub-body').scrollTop = 0; });
    G.on(s, '[data-help]', b => G.howto(b.dataset.help, true));
    G.on(s, '[data-smelt]', b => askSmelt(b.dataset.smelt));
    G.on(s, '[data-forge]', b => askForge(b.dataset.forge));
    G.on(s, '[data-bench]', b => {
      const r = G.BENCH[b.dataset.bench];
      if (!G.can(r.in)) return;
      G.pay(r.in); G.add(b.dataset.bench, r.out); G.sfx('clang', 1);
      G.toast(`${G.icon(b.dataset.bench, 20)} ${G.itemName(b.dataset.bench)} ${G.L('assemblée', 'assembled')}`);
      keepScroll(); G.save();
    });
    G.on(s, '[data-mine]', b => G.mine.start(+b.dataset.mine));
    G.on(s, '[data-hunt]', b => G.combat.hunt(b.dataset.hunt, false));
    G.on(s, '[data-boss]', async b => {
      const z = G.ZONES[b.dataset.boss], p = G.player();
      const e = G.state.ended && G.state.hard !== false ? G.combat.hardify(G.ENEMIES[z.boss]) : G.ENEMIES[z.boss];
      const pic = G.img('img/monstres/' + z.boss + '.webp');
      const warn = e.rust && !p.silver ? G.L('<p class="warn">Ton arme n’est pas en argent : la Rouille réduira tes dégâts de 40 %.</p>', '<p class="warn">Your weapon is not silver: the Rust will cut your damage by 40%.</p>') : '';
      const ok = await G.modal({ title: e.name, body: `${pic ? `<img class="boss-pic" src="${pic}" alt="">` : `<p class="boss-emoji">${e.emoji}</p>`}${G.L(`<p>${e.hp} PV${e.armor ? ' · carapace ' + e.armor : ''} · faible au ${e.weak === 'aube' ? "métal d’Aube" : e.weak}.</p>${warn}<p>Toi : ${p.hpMax} PV · ATQ ${p.atk} · DÉF ${p.def}.</p>`, `<p>${e.hp} HP${e.armor ? ' · shell ' + e.armor : ''} · weak to ${e.weak === 'aube' ? 'Dawn metal' : dmgT(e.weak)}.</p>${warn}<p>You: ${p.hpMax} HP · ATK ${p.atk} · DEF ${p.def}.</p>`)}`,
        buttons: [{ label: G.L('Pas encore', 'Not yet'), value: false }, { label: G.L('Affronter', 'Fight'), value: true, primary: true }] });
      if (ok) G.combat.hunt(b.dataset.boss, true);
    });
    G.on(s, '[data-equip]', b => {
      const g = G.gearByUid(+b.dataset.equip);
      G.state.eq[G.GEAR[g.id].slot] = g.uid; G.sfx('tick'); G.save(); keepScroll();
    });
    G.on(s, '[data-sellg]', async b => {
      const g = G.gearByUid(+b.dataset.sellg), price = gearPrice(g);
      const ok = await G.modal({ title: G.L('Vendre ?', 'Sell?'), body: G.L(`<p>${G.itemName(g.id)} (${G.qual(g.q).name}) pour ${price} or.</p>`, `<p>${G.itemName(g.id)} (${G.qual(g.q).name}) for ${price} gold.</p>`), buttons: [{ label: G.L('Garder', 'Keep'), value: false }, { label: G.L('Vendre', 'Sell'), value: true, primary: true }] });
      if (!ok) return;
      G.state.gear = G.state.gear.filter(x => x.uid !== g.uid); reequip(); G.state.gold += price; G.sfx('coin'); G.save(); keepScroll();
    });
    G.on(s, '[data-info]', b => {
      const id = b.dataset.info, d = G.ITEMS[id];
      const note = G.NOTES[id] ? `<p class="note-txt">${G.NOTES[id]}</p>` : '';
      G.modal({ title: d.name, body: `<div class="info-ico">${G.icon(id, 56)}</div><p>${d.desc || ''}</p>${note}<p class="sub">${G.L(`Tu en as ${G.count(id)}.${d.sell && !d.key ? ' Revente : ' + G.sellPrice(id) + ' or.' : ''}`, `You have ${G.count(id)}.${d.sell && !d.key ? ' Resale: ' + G.sellPrice(id) + ' gold.' : ''}`)}</p>` });
    });
    s.addEventListener('change', e => { if (e.target.id === 'hard-tgl') { G.state.hard = e.target.checked; G.save(); G.sfx('tick'); } });
    G.on(s, '[data-otab]', b => { G.state.fold = G.state.fold || {}; G.state.fold.odile = b.dataset.otab; G.sfx('tick'); G.save(); keepScroll(); });
    G.on(s, '[data-lazy]', b => {
      const id = b.dataset.lazy, n = +b.dataset.n, pr = G.lazyPrice(id) * n;
      if (G.state.gold < pr) return;
      G.state.gold -= pr; G.add(id, n); G.sfx('coin'); G.save(); keepScroll();
    });
    G.on(s, '[data-buy]', b => {
      const id = b.dataset.buy, d = G.ITEMS[id], pr = shopPrice(d);
      if (G.state.gold < pr) return;
      G.state.gold -= pr; G.add(id, 1); G.sfx('coin'); G.save(); keepScroll();
    });
    G.on(s, '[data-sell]', async b => {
      const id = b.dataset.sell, d = G.ITEMS[id], have = G.count(id);
      const r = await G.modal({ title: G.L('Vendre ', 'Sell ') + d.name, body: G.L(`<p>${G.sellPrice(id)} or la pièce. Tu en as ${have}.</p>`, `<p>${G.sellPrice(id)} gold each. You have ${have}.</p>`),
        buttons: [{ label: G.L('Annuler', 'Cancel'), value: 0 }, { label: G.L('Vendre 1', 'Sell 1'), value: 1, primary: true }, { label: G.L(`Tout (${have * G.sellPrice(id)} or)`, `All (${have * G.sellPrice(id)} gold)`), value: have }] });
      if (!r) return;
      G.add(id, -r); G.state.gold += r * G.sellPrice(id); G.sfx('coin'); G.save(); keepScroll();
    });
    G.on(s, '[data-deliver]', b => deliver(b.dataset.deliver));
    G.on(s, '[data-req]', b => deliverReq(+b.dataset.req));
    G.on(s, '[data-arc]', b => deliverArc(b.dataset.arc));
    G.on(s, '#shop-open', () => { G.sfx('tick'); G.shop.start(); });
    G.on(s, '[data-hone]', b => {
      const g = G.gearByUid(+b.dataset.hone);
      G.modal({ title: G.HONE_VERB(G.itemDef(g.id).kind) + G.L(' ?', '?'), body: `<p>${G.itemName(g.id)} (${G.qual(g.q).name}, ${g.q}). ${G.L('Une seule reprise par pièce : réussie, elle gagne jusqu’à +15 de qualité ; ratée, elle peut en perdre un peu (−5 au pire).', 'One rework per piece: if it succeeds, it gains up to +15 quality; if it fails, it may lose a little (−5 at worst).')}</p>`,
        buttons: [{ label: G.L('Pas maintenant', 'Not now'), value: false }, { label: G.L('À la meule', 'To the grindstone'), value: true, primary: true }] }).then(ok => { if (ok) G.refine.hone(g.uid); });
    });
    G.on(s, '[data-gem]', b => askGem(+b.dataset.gem));
    G.on(s, '[data-hq]', b => { G.state.fold = G.state.fold || {}; const v = b.dataset.hq; if (v === 'all') delete G.state.fold.honeQ; else G.state.fold.honeQ = +v; G.sfx('tick'); G.save(); keepScroll(); });
    G.on(s, '[data-fold]', b => {
      const k = b.dataset.fold;
      G.state.fold = G.state.fold || {}; G.state.fold[k] = !G.state.fold[k];
      G.sfx('tick'); G.save(); keepScroll();
    });
    G.on(s, '[data-drop]', async b => {
      const i = +b.dataset.drop, r = G.REQUESTS[G.state.board[i].k];
      const ok = await G.modal({ title: G.L('Refuser la commande ?', 'Decline the order?'), body: `<p>${G.NPCS[r.npc].name.split(',')[0]} ${G.L('ira voir ailleurs. Une autre commande arrivera après ta prochaine sortie.', 'will look elsewhere. Another order will come after your next outing.')}</p>`, buttons: [{ label: G.L('Garder', 'Keep'), value: false }, { label: G.L('Refuser', 'Decline'), value: true, danger: true }] });
      if (!ok) return;
      G.state.board.splice(i, 1); G.save(); keepScroll();
    });
    G.on(s, '#reread', () => G.story(G.CHAPTERS[G.state.ch].intro, chArt(G.state.ch)));
    G.on(s, '#opt-open', () => { G.sfx('tick'); openOptions(); });
  }

  /* ---------- options : roue crantée en haut à droite ---------- */
  const GEAR_SVG = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" fill-rule="evenodd" d="M10.3 2h3.4l.5 2.6a7.6 7.6 0 0 1 1.9.8l2.2-1.5 2.4 2.4-1.5 2.2c.3.6.6 1.2.8 1.9l2.6.5v3.4l-2.6.5a7.6 7.6 0 0 1-.8 1.9l1.5 2.2-2.4 2.4-2.2-1.5a7.6 7.6 0 0 1-1.9.8l-.5 2.6h-3.4l-.5-2.6a7.6 7.6 0 0 1-1.9-.8l-2.2 1.5-2.4-2.4 1.5-2.2a7.6 7.6 0 0 1-.8-1.9L2 13.7v-3.4l2.6-.5c.2-.7.5-1.3.8-1.9L3.9 5.7l2.4-2.4 2.2 1.5c.6-.3 1.2-.6 1.9-.8L10.3 2zM12 8.2a3.8 3.8 0 1 0 0 7.6 3.8 3.8 0 0 0 0-7.6z"/></svg>';
  function optionsHTML() {
    const st = G.state.settings;
    return `<div class="opts">
      <label class="tgl"><input type="checkbox" data-opt="music" ${st.music ? 'checked' : ''}><span>${G.L('Musique', 'Music')}</span><input type="range" class="vol" data-vol="musicVol" min="0" max="1" step="0.05" value="${st.musicVol}" aria-label="${G.L('Volume de la musique', 'Music volume')}"></label>
      <label class="tgl"><input type="checkbox" data-opt="sfx" ${st.sfx ? 'checked' : ''}><span>${G.L('Bruitages', 'Sound effects')}</span><input type="range" class="vol" data-vol="sfxVol" min="0" max="1" step="0.05" value="${st.sfxVol}" aria-label="${G.L('Volume des bruitages', 'Sound effects volume')}"></label>
      <label class="tgl"><input type="checkbox" data-opt="vibe" ${st.vibe ? 'checked' : ''}><span>${G.L('Vibrations', 'Vibration')}</span></label>
      <div class="tgl lang-row"><span>${G.L('Langue', 'Language')}</span><div class="seg" style="flex:1">${[['fr', 'Français'], ['en', 'English']].map(([k, lab]) => `<button type="button" class="seg-b ${G.lang === k ? 'on' : ''}" data-lang="${k}">${lab}</button>`).join('')}</div></div></div>
      <p class="opt-ver">v${PATCH_NOTES[0].v} · Keismey Studio</p>
      <p class="opt-ver">${G.L('Conception et direction : Keismey · Développé avec l’aide d’outils IA', 'Design and direction: Keismey · Developed with the help of AI tools')}</p>`;
  }
  async function openOptions(fromTitle) {
    const v = await G.modal({
      title: 'Options', cls: 'opt-card', body: optionsHTML(),
      buttons: [{ label: G.L('Sauvegarde (exporter / importer)', 'Save (export / import)'), value: 'save' }, { label: G.L('Notes de mise à jour', 'Patch notes'), value: 'pn' },
        ...(fromTitle ? [] : [{ label: G.L('Écran titre', 'Title screen'), value: 'title' }]),
        { label: G.L('Signaler un bug', 'Report a bug'), value: 'bug' }, { label: G.L('Soutenir le studio', 'Support the studio'), value: 'sup' },
        { label: G.L('Retour au hub', 'Back to the hub'), value: 'hub' }, { label: G.L('Fermer', 'Close'), value: true, primary: true }],
      onOpen: m => {
        const card = m.firstElementChild;   // écouteurs posés sur la carte : ils disparaissent avec elle
        card.addEventListener('change', e => {
          const d = e.target.dataset || {};
          if (d.opt) { G.state.settings[d.opt] = e.target.checked; G.save(); if (d.opt === 'music') G.musicRefresh(); }
          if (d.vol === 'sfxVol') G.sfx('clang', 1);
        });
        card.addEventListener('input', e => {
          const k = e.target.dataset && e.target.dataset.vol;
          if (!k) return;
          G.state.settings[k] = +e.target.value; G.save();
          if (k === 'musicVol') G.musicVolume(); else G.sfxVolume();
        });
        card.addEventListener('click', e => {
          const b = e.target.closest && e.target.closest('[data-lang]');
          if (!b || b.dataset.lang === G.lang) return;
          G.state.settings.lang = b.dataset.lang; G.save();
          location.reload();
        });
      },
    });
    if (v === 'title') { G.save(); G.stopLoop(); G.show('s-title'); buildTitle(); }
    if (v === 'pn') { await showPatchNotes(); openOptions(fromTitle); }
    if (v === 'save' && window.KS) { openOptions(fromTitle); KS.saveDialog({ keys: ['derniere-forge-save-v1'], lang: G.lang === 'en' ? 'en' : 'fr', save: G.save, accent: '#e0892f' }); }
    if (v === 'bug' && window.KS) KS.bug('La Dernière Forge', G.lang === 'en' ? 'en' : 'fr');
    if (v === 'sup' && window.KS) { KS.support(); openOptions(fromTitle); }
    if (v === 'hub') { G.save(); if (window.KSBack) KSBack.toHub(); }
  }

  /* ---------- notes de mise à jour (la plus récente en premier) ---------- */
  const PATCH_NOTES = [
    { v: '1.0.7', d: ['31 octobre 2026', '31 October 2026'],
      fr: ['Combat : les actions restent entièrement à l’écran sur les petits téléphones.', 'Boutons plus faciles à toucher (Options, aide, onglets).', 'Téléphone couché : un écran invite à le redresser et le jeu se met en pause.', 'Le zoom du navigateur est de nouveau possible.', 'Au clavier : fenêtres, dialogues, fonderie, trempe, combat et marchandage utilisables.'],
      en: ['Combat: the actions now stay fully on screen on small phones.', 'Easier-to-tap buttons (Options, help, tabs).', 'Phone held sideways: a screen asks you to turn it upright and the game pauses.', 'Browser zoom works again.', 'Keyboard: windows, dialogues, smelting, quenching, combat and haggling now work.'] },
    { v: '1.0.6', d: ['29 octobre 2026', '29 October 2026'],
      fr: ['Options : bouton « Retour au hub », et le même ordre que dans les autres jeux du studio.'],
      en: ['Options: a “Back to the hub” button, in the same order as the studio’s other games.'] },
    { v: '1.0.5', d: ['26 octobre 2026', '26 October 2026'],
      fr: ['Les Options s’ouvrent aussi depuis l’écran titre.', 'Un nouveau joueur ne voit plus les notes de mise à jour dès son premier lancement.', 'Options : crédits du jeu.'],
      en: ['Options can now be opened from the title screen too.', 'New players no longer get the patch notes on their very first launch.', 'Options: game credits.'] },
    { v: '1.0.4', d: ['19 octobre 2026', '19 October 2026'],
      fr: ['Options : sauvegarde à exporter ou importer (pour changer d’appareil), signalement de bug, soutien au studio et numéro de version.', 'Le navigateur est invité à garder ta sauvegarde même quand il fait du ménage.'],
      en: ['Options: a save you can export or import (to switch devices), bug reports, studio support and the version number.', 'The browser is asked to keep your save even when it clears space.'] },
    { v: '1.0.3', d: ['19 octobre 2026', '19 October 2026'],
      fr: ['Le bouton retour du téléphone ne quitte plus le jeu d’un coup : il ferme les fenêtres, revient à l’onglet Forge, puis propose de revenir à l’écran titre. Depuis l’écran titre, il propose d’aller au hub Keismey Studio. Dans la mine, il propose de remonter ; en chasse, de fuir.'],
      en: ['The phone’s back button no longer leaves the game at once: it closes windows, returns to the Forge tab, then offers to go back to the title screen. From the title screen, it offers to go to the Keismey Studio hub. In the mine it offers to go up; in a hunt, to flee.'] },
    { v: '1.0.2', d: ['16 octobre 2026', '16 October 2026'],
      fr: ['Nouveau : ces notes de mise à jour, dans les Options.', 'Les polices sont fournies avec le jeu : affichage plus rapide et identique hors ligne.', 'Le jeu se met à jour plus sûrement à chaque ouverture.'],
      en: ['New: these patch notes, in Options.', 'Fonts now ship with the game: faster display, identical offline.', 'The game updates more reliably each time you open it.'] },
    { v: '1.0.1', d: ['12 octobre 2026', '12 October 2026'],
      fr: ['Nouvelle icône d\'application, peinte.'], en: ['New painted app icon.'] },
    { v: '1.0', d: ['12 octobre 2026', '12 October 2026'],
      fr: ['Première version : la mine, la fonte, l\'affinage, la forge, la boutique et les combats.'],
      en: ['First release: the mine, smelting, refining, the forge, the shop and the battles.'] },
  ];
  const PN_KEY = 'forge-pn';
  function showPatchNotes() {
    try { localStorage.setItem(PN_KEY, PATCH_NOTES[0].v); } catch (e) { /* stockage indisponible */ }
    const body = PATCH_NOTES.map((p, i) => `<details${i ? '' : ' open'}><summary><b>${G.L('Version', 'Version')} ${p.v}</b> · ${G.L(p.d[0], p.d[1])}</summary><ul style="margin:6px 0 4px;padding-left:20px">${(G.lang === 'en' ? p.en : p.fr).map(l => `<li style="margin-bottom:4px">${l}</li>`).join('')}</ul></details>`).join('');
    return G.modal({ title: G.L('Notes de mise à jour', 'Patch notes'), body, buttons: [{ label: G.L('Fermer', 'Close'), value: true, primary: true }] });
  }
  /* Une fois après chaque mise à jour, seulement pour un joueur qui a déjà une partie. */
  function patchNotesAuto() {
    let seen = null; try { seen = localStorage.getItem(PN_KEY); } catch (e) { return; }
    if (seen === PATCH_NOTES[0].v) return;
    // la partie est créée dès le chargement : « déjà joué » = l'intro a été vue
    if (G.hasSave() && G.state.introSeen >= 0) showPatchNotes(); else try { localStorage.setItem(PN_KEY, PATCH_NOTES[0].v); } catch (e) { /* stockage indisponible */ }
  }

  function keepScroll() {
    const b = G.$('#hub-body'), y = b ? b.scrollTop : 0;
    renderHub();
    G.$('#hub-body').scrollTop = y;
  }

  async function askSmelt(id) {
    const r = G.SMELT[id], max = Math.min(5, G.maxAfford(r.in));
    if (max < 1) return;
    let n = 1;
    if (max > 1) {
      const btns = [];
      for (let i = 1; i <= max; i++) btns.push({ label: '×' + i, value: i, primary: i === max });
      n = await G.modal({ title: G.itemName(id), body: `<p>${G.L('Combien de fournées en une seule coulée ? Plus la quantité est grande, plus l’enjeu est grand.', 'How many batches in a single pour? The bigger the batch, the higher the stakes.')}</p>${reqChips(r.in)}`, buttons: btns.concat([{ label: G.L('Annuler', 'Cancel'), value: 0 }]) });
      if (!n) return;
    }
    G.smelt.start(id, n);
  }

  async function askForge(id) {
    const r = G.RECIPES[id];
    if (!G.can(r.in)) return;
    const ok = await G.modal({
      title: G.L('Forger : ', 'Forge: ') + G.itemName(id),
      body: `<div class="info-ico">${G.icon(id, 56)}</div><p class="sub center">${statLine(id)}</p>${reqChips(r.in)}
        <p>${G.L(`${r.strikes} frappes · trempe : ${G.METALS[r.metal].label}`, `${r.strikes} strikes · quench: ${G.METALS[r.metal].label}`)}</p>`,
      buttons: [{ label: G.L('Annuler', 'Cancel'), value: false }, { label: G.L('Allumer la forge', 'Light the forge'), value: true, primary: true }],
    });
    if (!ok) return;
    G.forge.start(id);
  }

  async function deliver(gid) {
    const g = G.CHAPTERS[G.state.ch].goals.find(x => x.id === gid);
    if (!haveFor(g.item, g.count || 1, g.minQ)) return;
    let uids = null;
    if (G.GEAR[g.item]) { uids = await choosePieces(g.item, g.count || 1, g.minQ); if (!uids) return; }
    takeItems(g.item, g.count || 1, g.minQ, uids);
    G.state.gold += g.reward || 0;
    if (g.bonus) for (const k in g.bonus) G.add(k, g.bonus[k]);
    G.state.goals[gid] = true;
    G.sfx('coin'); G.sfx('win');
    const npc = G.NPCS[g.npc];
    G.toast(`${npc.name.split(',')[0]} ${G.L('te remercie', 'thanks you')} · +${g.reward || 0} ${G.L('or', 'gold')}${g.bonus ? ' · ' + Object.keys(g.bonus).map(k => g.bonus[k] + ' ' + G.itemName(k)).join(', ') : ''}`, 'good');
    G.save(); keepScroll();
    checkGoals();
  }

  async function deliverReq(i) {
    const e = G.state.board[i], r = e && G.REQUESTS[e.k];
    if (!r || !haveFor(r.item, r.n, r.minQ)) return;
    const before = G.repLevel();
    let uids = null;
    if (G.GEAR[r.item]) { uids = await choosePieces(r.item, r.n, r.minQ, ps => reqReward(r, ps)); if (!uids) return; }
    if (G.state.board[i] !== e) return;
    const pieces = takeItems(r.item, r.n, r.minQ, uids);
    const gold = reqReward(r, pieces);
    G.state.gold += gold;
    G.state.rep = (G.state.rep || 0) + r.rep;
    G.state.done = (G.state.done || 0) + 1;
    G.state.board.splice(i, 1);
    G.state.recent = [e.k].concat(G.state.recent || []).slice(0, 4);
    let gift = '';
    // palier 5 : parfois une petite attention (35 % : une potion ou une ration)
    if (G.repLevel() >= 4 && Math.random() < 0.35) { const k = Math.random() < 0.5 ? 'potion' : 'ration'; G.add(k, 1); gift = ' · ' + G.itemName(k); }
    G.sfx('coin'); G.sfx('win');
    G.toast(G.L(`${G.NPCS[r.npc].name.split(',')[0]} : merci ! +${gold} or · +${r.rep} renommée${gift}`, `${G.NPCS[r.npc].name.split(',')[0]}: thank you! +${gold} gold · +${r.rep} renown${gift}`), 'good');
    G.save(); keepScroll();
    const after = G.repLevel();
    if (after > before) {
      const lv = G.REP[after];
      await G.sleep(500);
      G.sfx('win');
      await G.modal({ title: G.L('Renommée ', 'Renown ') + (after + 1), cls: 'summary good', body: `<p class="big-name">${lv.name}</p><p>${lv.perk}</p>`, buttons: [{ label: G.L('Formidable', 'Wonderful'), value: true, primary: true }] });
      keepScroll();
    }
    checkGoals();
  }

  // si un emplacement est vide, on équipe le meilleur objet disponible
  function reequip() {
    ['arme', 'armure', 'pioche'].forEach(slot => {
      if (G.gearByUid(G.state.eq[slot])) return;
      const cands = G.state.gear.filter(g => G.GEAR[g.id].slot === slot);
      cands.sort((a, b) => G.forge.compare(b, a));
      G.state.eq[slot] = cands[0] ? cands[0].uid : 0;
    });
  }
  G.reequip = reequip;

  /* ---------- objectifs & chapitres ---------- */
  let checking = false;
  function markGoals() {
    const fresh = [];
    G.CHAPTERS[G.state.ch].goals.forEach(g => {
      if (G.state.goals[g.id]) return;
      let ok = false;
      if (g.type === 'craft') ok = [].concat(g.item).some(i => G.state.crafted[i]);
      if (g.type === 'find') ok = G.count(g.item) > 0;
      if (g.type === 'boss') ok = !!G.state.boss[g.enemy];
      if (g.type === 'rep') ok = G.repLevel() + 1 >= g.level;
      if (ok) { G.state.goals[g.id] = true; fresh.push(g); }
    });
    return fresh;
  }
  async function checkGoals() {
    if (checking || G.state.ended) return;
    checking = true;
    try {
      for (;;) {
        const ch = G.CHAPTERS[G.state.ch];
        const fresh = markGoals();
        if (fresh.length) { G.toast(G.L('Objectif accompli : ', 'Goal complete: ') + fresh.map(g => g.title).join(' · '), 'good'); G.sfx('win'); G.save(); if (G.current === 's-hub') keepScroll(); }
        if (!ch.goals.every(g => G.state.goals[g.id])) break;
        await G.sleep(fresh.length ? 1100 : 300);
        await G.story(ch.outroAlt && !G.state.hogarFreed ? ch.outroAlt : ch.outro, G.state.ch === G.CHAPTERS.length - 1 ? 'img/histoire/fin.webp' : null);
        G.state.ch++;
        if (G.state.ch >= G.CHAPTERS.length) {
          G.state.ch = G.CHAPTERS.length - 1;
          G.state.ended = true; G.save();
          G.music('fin');
          await G.modal({ cls: 'ending', title: G.L('Fin', 'The End'), body: G.L(`<p class="logo small">La Dernière Forge</p><p>Merci d’avoir joué, ${G.esc(G.state.name)}.</p><p class="sub">Une histoire de cuivre, de fer, d’argent et d’étoiles.</p>`, `<p class="logo small">The Last Forge</p><p>Thank you for playing, ${G.esc(G.state.name)}.</p><p class="sub">A tale of copper, iron, silver and stars.</p>`), buttons: [{ label: G.L('Retourner à la forge', 'Back to the forge'), value: true, primary: true }] });
          tab = 'village'; renderHub();
          break;
        }
        refillBoard();
        G.save(); renderHub();
        await G.story(G.CHAPTERS[G.state.ch].intro, chArt(G.state.ch));
        const gift = G.CHAPTERS[G.state.ch].gift;
        if (gift) { for (const k in gift) G.add(k, gift[k]); G.toast(G.L('Reçu : ', 'Received: ') + Object.keys(gift).map(k => gift[k] + ' ' + G.itemName(k)).join(', '), 'good'); }
        G.state.introSeen = G.state.ch; G.save(); renderHub();
      }
    } finally { checking = false; }
  }
  G.checkGoals = checkGoals;

  // résultat commun de fin d'activité : écran récapitulatif
  G.summary = function (title, lines, items, kind, btn) {
    const it = Object.keys(items || {}).filter(k => items[k] > 0);
    return G.modal({
      title, cls: 'summary ' + (kind || ''),
      body: `${lines.map(l => `<p>${l}</p>`).join('')}${it.length ? `<div class="loot">${it.map(k => `<span class="loot-i">${G.icon(k, 30)}<b>${items[k]}</b><small>${G.itemName(k)}</small></span>`).join('')}</div>` : ''}`,
      buttons: [{ label: btn || G.L('Retour au village', 'Back to the village'), value: true, primary: true }],
    });
  };

  /* ---------- bouton retour du téléphone (voir ks-back.js) ----------
     fenêtre ouverte → fermée (si elle a un bouton pour ça) ; onglet → Forge ; Forge → écran titre (confirmé) ;
     écran titre → hub ; mine → remonter (confirmé) ; chasse → fuir (confirmé par le jeu) ;
     fonte, forge, affûtage, journée d'échoppe : ignoré (les matériaux sont déjà engagés). */
  const DISMISS = ['Fermer', 'Annuler', 'Rester', 'Close', 'Cancel', 'Stay'];
  function backAsk(title, body, yes, fn) {
    G.modal({ title, body: `<p>${body}</p>`, buttons: [{ label: G.L('Annuler', 'Cancel'), value: false }, { label: yes, value: true, primary: true }] })
      .then(ok => { if (ok) fn(); });
  }
  function onBack() {
    const m = G.$('#modal');
    if (!m.hidden) {
      const bs = G.$$('.modal-btns .btn', m).filter(b => !b.disabled);
      const b = bs.length === 1 ? bs[0] : bs.find(x => DISMISS.includes(x.textContent.trim()));
      if (b) b.click();
      return;
    }
    if (!G.$('#dialog').hidden) return;                      // dialogue d'histoire : il faut le lire
    const cur = G.current;
    if (cur === 's-title') {
      backAsk(G.L('Quitter La Dernière Forge ?', 'Leave The Last Forge?'), G.L('Ta partie est enregistrée. Tu retrouveras les autres jeux de Keismey Studio sur le hub.', 'Your game is saved. You will find the other Keismey Studio games on the hub.'), G.L('Aller au hub', 'Go to the hub'), () => KSBack.toHub());
      return;
    }
    if (cur === 's-mine') {
      const up = G.$('#mn-up');
      if (up) backAsk(G.L('Remonter ?', 'Go up?'), G.L('Tu remontes à la surface avec ce que tu as extrait.', 'You go back up with what you have mined.'), G.L('Remonter', 'Go up'), () => up.click());
      return;
    }
    if (cur === 's-combat') { const f = G.$('#s-combat [data-a="flee"]:not([disabled])'); if (f) f.click(); return; }
    if (cur !== 's-hub') { G.toast(G.L('Termine d’abord ce que tu as commencé.', 'Finish what you started first.')); return; }
    if (tab !== 'forge') { tab = 'forge'; renderHub(); G.$('#hub-body').scrollTop = 0; return; }
    backAsk(G.L('Retour à l’écran titre ?', 'Back to the title screen?'), G.L('Ta partie est enregistrée.', 'Your game is saved.'), G.L('Écran titre', 'Title screen'),
      () => { G.save(); G.stopLoop(); G.show('s-title'); buildTitle(); });
  }
  if (window.KSBack) KSBack.init({
    back: onBack,
    lang: () => (G.lang === 'en' ? 'en' : 'fr'),
    title: () => G.current === 's-title' && G.$('#modal').hidden && G.$('#dialog').hidden
  });

  window.addEventListener('load', () => { boot(); bindHub(G.$('#s-hub')); });
})();
