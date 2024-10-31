const urlsToCache = [
  "https://img1.baidu.com/it/u=422078137,1307526884&fm=253&fmt=auto&app=120&f=JPEG?w=1280&h=800",
  "./1.html",
];
const CACHE_NAME = "offline-cache-v1";
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      console.log(event.request);
      if (response) {
        return response;
      }
      console.log(1);
      return fetch(event.request);
    })
  );
});

self.addEventListener("activate", function (event) {
  console.log("Service Worker 激活成功");

  // 在激活时进行资源清理等操作
});
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-messages") {
    console.log(123);
  }
});
