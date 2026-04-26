// Bump version to invalidate any stale cache that may have served wrong viewport HTML
const CACHE = "jello-v4";

self.addEventListener("install", (e) => {
  self.skipWaiting();
  // Only cache static assets, NOT the HTML page itself
  e.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(["/manifest.json"]).catch(() => {})),
  );
});

self.addEventListener("activate", (e) => {
  // Delete ALL old caches including jello-v1, jello-v2
  e.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)),
        ),
      ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  if (e.request.url.startsWith("chrome-extension://")) return;

  // Navigation requests (HTML pages): always network-first, never serve stale HTML
  if (e.request.mode === "navigate") {
    e.respondWith(fetch(e.request).catch(() => caches.match("/")));
    return;
  }

  // Static assets: cache-first
  e.respondWith(
    caches.match(e.request).then(
      (cached) =>
        cached ||
        fetch(e.request).then((r) => {
          if (r.ok && !e.request.url.includes("api.unsplash.com")) {
            caches.open(CACHE).then((c) => c.put(e.request, r.clone()));
          }
          return r;
        }),
    ),
  );
});
