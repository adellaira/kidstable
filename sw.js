const CACHE_NAME = 'kidstable-v1.04';
const ASSETS = [
  './',
  'index.html',
  'style.css',
  'script.js',
  'locali.csv',
  'KidsTable.png'
];

// Installazione: Salva i file base
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Attivazione: Pulizia vecchie versioni
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
  return self.clients.claim();
});

// GESTIONE RICHIESTE INTELLIGENTE (Stale-while-revalidate)
self.addEventListener('fetch', (event) => {
  // Ignora le richieste non-GET (es. analytics)
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((cachedResponse) => {
        const fetchedResponse = fetch(event.request).then((networkResponse) => {
          // Se la rete risponde, aggiorna la cache per la prossima volta
          if (networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(() => {
          // Se la rete fallisce (offline o 429), non fare nulla, abbiamo la cache
        });

        // Restituisce la cache SUBITO, o aspetta la rete se non c'è in cache
        return cachedResponse || fetchedResponse;
      });
    })
  );
});
