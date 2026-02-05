self.addEventListener("install", e => {
  e.waitUntil(
    caches.open("sarpras-v1").then(cache => {
      return cache.addAll([
        "./",
        "./index.html",
        "./style.css",
        "./app.js"
      ]);
    })
  );
});
