// Cambia 'v1' in 'v2', 'v3', ecc. ogni volta che aggiorni il sito!
const CACHE_NAME = 'kidstable-v1.02'; 

const ASSETS = [
  './',
  'index.html',
  'style.css',
  'script.js',
  'locali.csv',
  'KidsTable.png'
];

// Installazione
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting(); // Forza l'attivazione immediata
});

// Pulizia vecchie cache
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      );
    })
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((res) => res || fetch(e.request))
  );
});
