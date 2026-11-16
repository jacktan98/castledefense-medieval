// The old site's offline helper is replaced by this one, which deletes everything the old one kept, removes itself and reloads
// every open copy of the page, so the next load comes from the network (the "moved" page).
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil((async () => {
  for (const k of await caches.keys()) await caches.delete(k);
  await self.registration.unregister();
  for (const c of await self.clients.matchAll({ type: 'window' })) c.navigate(c.url);
})()));
