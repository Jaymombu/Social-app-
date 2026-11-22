const CACHE_NAME = "socialapp-v282";

const STATIC_ASSETS = [
  "/Social-app-/",
  "/Social-app-/index.html",
  "/Social-app-/manifest.json"
];

// Install service worker
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {
        console.warn("Some static assets could not be cached.");
      });
    })
  );

  self.skipWaiting();
});

// Activate service worker
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith("socialapp-") && name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );

  self.clients.claim();
});

// Detect media requests
function isMediaRequest(request) {
  const url = new URL(request.url);

  const mediaExtensions =
    /\.(png|jpe?g|gif|webp|svg|mp4|webm|mov|mp3|wav|ogg|m4a|aac)$/i;

  const mediaTypes = [
    "image/",
    "video/",
    "audio/"
  ];

  return (
    mediaExtensions.test(url.pathname) ||
    mediaTypes.some((type) =>
      (request.headers.get("accept") || "").includes(type)
    );
  );
}

// Detect Supabase requests
function isSupabaseRequest(request) {
  return request.url.includes(".supabase.co");
}

// Network-only requests for sensitive content
async function networkOnly(request) {
  try {
    return await fetch(request, {
      cache: "no-store"
    });
  } catch (error) {
    return new Response(
      "Media unavailable. Please reconnect to the internet.",
      {
        status: 503,
        headers: {
          "Content-Type": "text/plain",
          "Cache-Control": "no-store"
        }
      }
    );
  }
}

// Handle requests
self.addEventListener("fetch", (event) => {
  const request = event.request;

  // Only handle GET requests
  if (request.method !== "GET") {
    return;
  }

  // Never cache Supabase data, authentication or storage
  if (isSupabaseRequest(request)) {
    event.respondWith(networkOnly(request));
    return;
  }

  // Never cache images, videos or audio
  if (isMediaRequest(request)) {
    event.respondWith(networkOnly(request));
    return;
  }

  // Static assets can use cache
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (
          response &&
          response.ok &&
          response.type !== "opaque"
        ) {
          const responseClone = response.clone();

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }

        return response;
      })
      .catch(async () => {
        const cachedResponse = await caches.match(request);

        if (cachedResponse) {
          return cachedResponse;
        }

        // Only fallback to app shell for navigation requests
        if (request.mode === "navigate") {
          return caches.match("/Social-app-/index.html");
        }

        return new Response("Offline", {
          status: 503,
          headers: {
            "Content-Type": "text/plain"
          }
        });
      })
  );
});