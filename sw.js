/* Αγροτεχνίτης ΤΝ — service worker (offline-first app shell) */
const CACHE = 'agrotexnitis-v1';
const ASSETS = [
  './', './index.html', './manifest.json', './icon-192.png', './icon-512.png',
  './plants.js', './graft.js', './leaflet.min.css', './leaflet.min.js',
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
  const url = e.request.url;
  // Χάρτης & καιρός: πάντα δίκτυο (χωρίς φούσκωμα cache), με fallback αν υπάρχει
  if (url.includes('tile.openstreetmap') || url.includes('open-meteo')) {
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
    return;
  }
  // App shell & Leaflet: cache-first
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).then(res => {
      if (e.request.method === 'GET' && res && res.ok) {
        const cp = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, cp));
      }
      return res;
    }).catch(() => caches.match('./index.html')))
  );
});
