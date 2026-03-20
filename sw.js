// Incrementa questo numero ogni volta che carichi modifiche su GitHub
const CACHE_NAME = 'kidstable-v1.03'; 

const ASSETS = [
  './',
  'index.html',
  'style.css',
  'script.js',
  'locali.csv',
  'KidsTable.png'
];

// Installazione: scarica i file iniziali
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting(); 
});

// Attivazione: cancella automaticamente le vecchie versioni della cache
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('PWA: Rimozione vecchia cache', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Gestione Richieste: Strategia "Network First"
// Prova a scaricare dal web, se non c'è connessione usa la cache.
self.addEventListener('fetch', (e) => {
  e.respondWith(
    fetch(e.request)
      .then((response) => {
        // Se la rete risponde, salva una copia aggiornata in cache
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(e.request, response.clone());
          return response;
        });
      })
      .catch(() => {
        // Se la rete fallisce (sei offline), usa la cache
        return caches.match(e.request);
      })
  );
});
