const CACHE_NAME = "social-app-v3";

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

    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log("Caching app shell");
        return cache.addAll(urlsToCache);
      })

  );

});

// ACTIVATE
self.addEventListener("activate", (event) => {

  event.waitUntil(

    caches.keys().then((keys) => {

      return Promise.all(
        keys.map((key) => {

          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }

        })
      );

    })

  );

  return self.clients.claim();

});

// FETCH
self.addEventListener("fetch", (event) => {

  event.respondWith(

    caches.match(event.request)
      .then((response) => {

        // CACHE FIRST
        if (response) {
          return response;
        }

        // NETWORK
        return fetch(event.request)
          .then((networkResponse) => {

            // ONLY CACHE VALID REQUESTS
            if (
              !networkResponse ||
              networkResponse.status !== 200 ||
              networkResponse.type !== "basic"
            ) {
              return networkResponse;
            }

            const responseClone = networkResponse.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseClone);
              });

            return networkResponse;

          });

      })
      .catch(() => {

        // OFFLINE PAGE
        return caches.match("./index.html");

      })

  );

});