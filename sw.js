const CACHE_NAME = "social-app-v2";

const urlsToCache = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

// INSTALL
self.addEventListener("install", (event) => {

  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

// ACTIVATE
self.addEventListener("activate", (event) => {

  event.waitUntil(
    caches.keys().then((cacheNames) => {

      return Promise.all(
        cacheNames.map((cache) => {

          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }

        })
      );

    })
  );

  self.clients.claim();

});

// FETCH
self.addEventListener("fetch", (event) => {

  event.respondWith(

    caches.match(event.request).then((cachedResponse) => {

      // RETURN CACHE
      if (cachedResponse) {
        return cachedResponse;
      }

      // FETCH NETWORK
      return fetch(event.request)
        .then((networkResponse) => {

          // CLONE RESPONSE
          const clonedResponse = networkResponse.clone();

          // SAVE NEW FILES
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clonedResponse);
          });

          return networkResponse;

        })
        .catch(() => {

          // OFFLINE FALLBACK
          if (event.request.mode === "navigate") {
            return caches.match("./index.html");
          }

        });

    })

  );

});