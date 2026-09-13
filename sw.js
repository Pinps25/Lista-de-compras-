/* ==================================================================
   SERVICE WORKER -- Lista de Compras
   Estratégia: cache-first para o "app shell" (arquivos que definem
   o app em si), com fallback pra rede. Como o app não depende de
   nenhuma API externa (tudo roda em localStorage no aparelho), isso
   é suficiente pra funcionar 100% offline depois da 1ª visita.

   IMPORTANTE: sempre que publicar uma mudança em index.html (ou
   qualquer arquivo abaixo), suba o número da versão em CACHE_NAME
   -- é isso que força os aparelhos já instalados a buscar a versão
   nova em vez de continuar servindo a antiga do cache.
================================================================== */

const CACHE_NAME = 'lista-compras-v3';

const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
];

// Instala: baixa e guarda o app shell em cache
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

// Ativa: remove caches de versões antigas
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(nomes =>
      Promise.all(
        nomes
          .filter(nome => nome !== CACHE_NAME)
          .map(nome => caches.delete(nome))
      )
    ).then(() => self.clients.claim())
  );
});

// Busca: cache-first, com atualização em segundo plano e fallback de rede
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      const fetchPromise = fetch(event.request)
        .then(resposta => {
          if (resposta && resposta.status === 200) {
            const copia = resposta.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, copia));
          }
          return resposta;
        })
        .catch(() => cached); // offline: usa o que tiver em cache

      return cached || fetchPromise;
    })
  );
});
