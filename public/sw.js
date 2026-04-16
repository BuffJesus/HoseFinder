// HoseFinder service worker.
// Strategy:
//   - App shell (HTML/JS/CSS/fonts): stale-while-revalidate, scoped to this origin.
//   - Data (hoses.json / rows.json): stale-while-revalidate — cache survives offline.
//   - Catalog + hose images: cache-on-demand via cache-first with background update.
//   - Other origins and POST/etc: passthrough.

// Bump this on any deploy that needs to invalidate stale caches — a byte
// change makes browsers detect a new worker, fire `activate`, and purge
// every cache that doesn't start with the new VERSION prefix.
const VERSION = "hosefinder-v2-pages";
const SHELL = `${VERSION}-shell`;
const DATA = `${VERSION}-data`;
const IMG = `${VERSION}-img`;

self.addEventListener("install", (e) => {
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter((k) => !k.startsWith(VERSION))
        .map((k) => caches.delete(k)),
    );
    await self.clients.claim();
  })());
});

async function staleWhileRevalidate(req, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  const fetched = fetch(req)
    .then((res) => {
      if (res && res.ok) cache.put(req, res.clone());
      return res;
    })
    .catch(() => cached);
  return cached || fetched;
}

async function cacheFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  if (cached) return cached;
  try {
    const res = await fetch(req);
    if (res && res.ok) cache.put(req, res.clone());
    return res;
  } catch (err) {
    return cached || Response.error();
  }
}

self.addEventListener("fetch", (e) => {
  const { request } = e;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.endsWith(".json") && /data\//.test(url.pathname)) {
    e.respondWith(staleWhileRevalidate(request, DATA));
    return;
  }

  if (/\.(png|jpe?g|svg|webp|avif)$/i.test(url.pathname) && /images\//.test(url.pathname)) {
    e.respondWith(cacheFirst(request, IMG));
    return;
  }

  // HTML / JS / CSS / fonts / manifest — app shell.
  if (request.destination === "document"
      || request.destination === "script"
      || request.destination === "style"
      || request.destination === "font"
      || request.destination === "manifest"
      || request.destination === "") {
    e.respondWith(staleWhileRevalidate(request, SHELL));
  }
});
