const CACHE_NAME = 'kidstable-v1';
const ASSETS = [
  'index.html',
  'style.css',
  'script.js',
  'locali.csv',
  'KidsTable.png'
];

// Installazione e salvataggio file in cache
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

// Gestione delle richieste (usa la cache se disponibile)
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((res) => res || fetch(e.request))
  );
});
