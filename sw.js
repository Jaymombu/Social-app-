const CACHE_NAME = "social-app-v57";

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

  self.clients.claim();

});

// FETCH
self.addEventListener("fetch", (event) => {

  // NEVER CACHE SUPABASE
  if (event.request.url.includes("supabase")) {

    event.respondWith(fetch(event.request));
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

            const responseClone =
              networkResponse.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {

                cache.put(
                  event.request,
                  responseClone
                );

              });

            return networkResponse;

          })

          .catch(() => {

            return caches.match("./index.html");

          });

      })

  );

});

self.addEventListener("push", (event) => {

  const data = event.data ? event.data.json() : {};

  event.waitUntil(
    self.registration.showNotification(
      data.title || "New notification",
      {
        body: data.body || "You have a new update",
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        data: data.data || {},
        tag: "social-app",
        renotify: true
      }
    )
  );

});

self.addEventListener("notificationclick", (event) => {

  event.notification.close();

  const data = event.notification.data;

  event.waitUntil(
    clients.openWindow("/")
  );
});