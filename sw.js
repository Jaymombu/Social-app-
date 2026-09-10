const CACHE_NAME = "social-app-v267";

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

  const request = event.request;
  const url = new URL(request.url);

  // NEVER CACHE SUPABASE
  if (url.hostname.includes("supabase")) {
    event.respondWith(fetch(request));
    return;
  }

  // NEVER INTERCEPT NON-GET REQUESTS
  if (request.method !== "GET") {
    return;
  }

  // NETWORK-FIRST FOR THE APP SHELL
  const isAppShell =
    request.mode === "navigate" ||
    url.pathname.endsWith("/index.html") ||
    url.pathname === new URL("./", self.location.href).pathname;

  if (isAppShell) {

    event.respondWith(

      fetch(request)

        .then((networkResponse) => {

          if (networkResponse && networkResponse.ok) {

            const responseClone =
              networkResponse.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(request, responseClone);
              });

          }

          return networkResponse;

        })

        .catch(() => {

          return caches.match(request)
            .then((cachedResponse) => {

              return cachedResponse ||
                caches.match("./index.html");

            });

        })

    );

    return;
  }

  // CACHE-FIRST FOR STATIC ASSETS
  event.respondWith(

    caches.match(request)

      .then((cachedResponse) => {

        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request)

          .then((networkResponse) => {

            if (networkResponse && networkResponse.ok) {

              const responseClone =
                networkResponse.clone();

              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(request, responseClone);
                });

            }

            return networkResponse;

          })

          .catch(() => {

            return caches.match("./index.html");

          });

      })

  );

});

// PUSH NOTIFICATIONS
self.addEventListener("push", (event) => {

  const data =
    event.data ? event.data.json() : {};

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

// NOTIFICATION CLICK
self.addEventListener("notificationclick", (event) => {

  event.notification.close();

  const data = event.notification.data;

  event.waitUntil(
    clients.openWindow("/")
  );

});