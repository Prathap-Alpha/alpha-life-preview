const PREFIX = "alpha-life-preview-";
const CACHE = PREFIX + "20261104-v5";
const SCOPE = self.registration.scope;
const CORE = [
  "./",
  "./index.html",
  "./styles.css?v=20261103-meanwhile-v4",
  "./main.js?v=20261103-meanwhile-v4",
  "./assets/alpha-direct-logo.png",
  "./assets/savanna-walk-poster.webp",
  "./assets/vision-poster-20261104.webp",
  "./assets/vision-film-20261104.vtt",
  "./fonts/inter-latin-wght-normal.woff2",
  "./fonts/inter-tight-latin-wght-normal.woff2",
].map((path) => new URL(path, SCOPE).href);
const INDEX = new URL("./index.html", SCOPE).href;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(CORE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) =>
                (key.startsWith(PREFIX) || key === "alpha-life-v3") &&
                key !== CACHE,
            )
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (
    request.method !== "GET" ||
    url.origin !== self.location.origin ||
    !url.href.startsWith(SCOPE)
  )
    return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            event.waitUntil(
              caches
                .open(CACHE)
                .then((cache) => cache.put(INDEX, copy))
                .catch(() => {}),
            );
          }
          return response;
        })
        .catch(() => caches.open(CACHE).then((cache) => cache.match(INDEX))),
    );
    return;
  }

  event.respondWith(
    caches
      .open(CACHE)
      .then((cache) => cache.match(request, { ignoreSearch: true }))
      .then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            // Partial Range responses and failed assets must not enter the offline cache.
            if (response.status === 200) {
              const copy = response.clone();
              event.waitUntil(
                caches
                  .open(CACHE)
                  .then((cache) => cache.put(request, copy))
                  .catch(() => {}),
              );
            }
            return response;
          }),
      ),
  );
});
