/* Αγροτεχνίτης ΤΝ — service worker */
const CACHE = 'agrotexnitis-v3';
const ASSETS = [
  './', './index.html', './manifest.json', './icon-192.png', './icon-512.png',
  './plants.js', './graft.js', './tools.js', './leaflet.min.css', './leaflet.min.js',
  './images/marker-icon.png', './images/marker-icon-2x.png', './images/marker-shadow.png',
  './images/layers.png', './images/layers-2x.png'
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS).catch(()=>{})).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = e.request.url;
  // Εξωτερικά live (καιρός/χάρτης/φωτογραφίες): πάντα δίκτυο, χωρίς φούσκωμα cache
  if (url.includes('tile.openstreetmap') || url.includes('open-meteo') || url.includes('wikipedia.org') || url.includes('wikimedia.org')) {
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
    return;
  }
  // Δικά μας HTML/JS/JSON: NETWORK-FIRST — οι ενημερώσεις εμφανίζονται όταν υπάρχει σύνδεση· cache = offline fallback
  if (/\.(html|js|json)($|\?)/.test(url) || url.endsWith('/')) {
    e.respondWith(
      fetch(e.request).then(res => {
        if (res && res.ok) { const cp = res.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); }
        return res;
      }).catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
    );
    return;
  }
  // Στατικά (leaflet, εικόνες): cache-first
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).then(res => {
      if (res && res.ok) { const cp = res.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); }
      return res;
    }).catch(() => caches.match('./index.html')))
  );
});
