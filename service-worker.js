const CACHE_NAME = "sarpras-v5";
const ASSETS = [
  "./",
  "./index.html",
  "./login.html",
  "./lokasi.html",
  "./aset.html",
  "./pemeliharaan.html",
  "./mutasi.html",
  "./laporan.html",
  "./css/style.css",
  "./manifest.json",
  "./icons/icon.svg",
  "./icons/logo-da-ibs.svg",
  "./js/app.js",
  "./js/auth.js",
  "./js/db.js",
  "./js/dashboard.js",
  "./js/lokasi.js",
  "./js/aset.js",
  "./js/pemeliharaan.js",
  "./js/mutasi.js",
  "./js/export.js",
  "./js/import.js",
  "./js/laporan.js"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))
    )
  );
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then(cached =>
      cached ||
      fetch(event.request).then(response => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        return response;
      }).catch(() => caches.match("./index.html"))
    )
  );
});
