/* La Dernière Forge — langue (français / anglais)
   Chargé en premier. Langue = choix enregistré dans les options, sinon langue de l'appareil (français si « fr… », anglais sinon).
   Dans le code : G.L('texte français', 'English text') renvoie la version de la langue active.
   Les données (objets, dialogues…) sont traduites dans js/data_en.js, appliqué après js/data.js. */
window.G = window.G || {};
(function () {
  let lang = null;
  // ?lang=fr / ?lang=en (liens du hub Keismey Studio) : prioritaire, et retenu dans la sauvegarde
  let q = null;
  try { q = new URLSearchParams(location.search).get('lang'); } catch (e) {}
  if (q !== 'fr' && q !== 'en') q = null;
  try {
    const key = 'derniere-forge-save-v1';
    const s = JSON.parse(localStorage.getItem(key) || 'null');
    if (q) {
      lang = q;
      if (s && s.settings && s.settings.lang !== q) { s.settings.lang = q; localStorage.setItem(key, JSON.stringify(s)); }
    } else if (s && s.settings && (s.settings.lang === 'fr' || s.settings.lang === 'en')) lang = s.settings.lang;
  } catch (e) { if (q) lang = q; }
  if (!lang) {
    const n = (navigator.languages && navigator.languages[0]) || navigator.language || 'fr';
    lang = /^fr/i.test(n) ? 'fr' : 'en';
  }
  G.lang = lang;
  G.L = (fr, en) => (G.lang === 'en' && en !== undefined ? en : fr);
  try { document.documentElement.lang = lang; if (lang === 'en') document.title = 'The Last Forge'; } catch (e) {}
})();
