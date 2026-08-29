const CACHE = 'screenreader-task-audit-v5';
self.addEventListener('install', event => event.waitUntil((async () => {
  const cache = await caches.open(CACHE);
  const page = await fetch('/');
  const html = await page.text();
  await cache.put('/', new Response(html, { headers: { 'content-type': 'text/html' } }));
  await cache.put('/demo', new Response(html, { headers: { 'content-type': 'text/html' } }));
  const assets = [...html.matchAll(/(?:src|href)="(\/[^"#]+)"/g)].map(match => match[1]);
  await Promise.all([...new Set([...assets, '/assets/audit-collage.webp', '/favicon.svg'])].map(async url => {
    const response = await fetch(new Request(url, { cache: 'reload' }));
    if (response.ok) await cache.put(url, response);
  }));
  await self.skipWaiting();
})()));
self.addEventListener('activate', event => event.waitUntil(Promise.all([
  caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))),
  self.clients.claim()
])));
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  // Shared reports are private, expiring server data. They must never survive
  // in Cache Storage after their server-side expiry.
  if (event.request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;
  event.respondWith(fetch(event.request).then(response => {
    if (response.ok) event.waitUntil(caches.open(CACHE).then(cache => cache.put(event.request, response.clone())));
    return response;
  }).catch(() => caches.match(event.request, { ignoreVary: true }).then(hit => hit || (event.request.mode === 'navigate' ? caches.match('/') : Response.error()))));
});
