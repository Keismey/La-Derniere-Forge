/* Service worker : le jeu fonctionne hors ligne une fois chargé.
   Change VERSION à chaque mise en ligne pour forcer la mise à jour. */
const VERSION = 'forge-v1.0.1';
const CORE = [
  './', './index.html', './css/style.css', './manifest.webmanifest',
  './js/i18n.js', './js/data.js', './js/data_en.js', './js/assets.js', './js/core.js', './js/smelt.js', './js/forge.js', './js/mine.js', './js/combat.js', './js/shop.js', './js/refine.js', './js/main.js',
  './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png',
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// réseau d'abord pour le code (mises à jour rapides), cache d'abord pour les images et musiques
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const asset = url.pathname.includes('/assets/') || url.hostname.includes('gstatic') || url.hostname.includes('googleapis');
  if (asset) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res.ok || res.type === 'opaque') { const cp = res.clone(); caches.open(VERSION).then(c => c.put(req, cp)); }
      return res;
    })));
  } else {
    e.respondWith(fetch(req).then(res => {
      if (res.ok) { const cp = res.clone(); caches.open(VERSION).then(c => c.put(req, cp)); }
      return res;
    }).catch(() => caches.match(req).then(hit => hit || caches.match('./index.html'))));
  }
});
