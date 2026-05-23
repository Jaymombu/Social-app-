const CACHE_NAME = "social-app-v6";

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
  
  if (
  event.request.url.includes("supabase")
) {
  return;
}

  event.respondWith(

    caches.match(event.request)
      .then((cachedResponse) => {

        // RETURN CACHE
        if (cachedResponse) {
          return cachedResponse;
        }

        // FETCH NETWORK
        return fetch(event.request)
          .then((networkResponse) => {

            // CLONE
            const responseClone = networkResponse.clone();

            // SAVE TO CACHE
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseClone);
              });

            return networkResponse;

          })
          .catch(() => {

            // OFFLINE FALLBACK
            return caches.match("./index.html");

          });

      })

  );

});