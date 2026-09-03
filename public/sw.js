const CACHE = 'bsuir-v1'
const SCOPE = (self.registration && self.registration.scope) || self.location.origin + '/'
const scopeUrl = (p) => new URL(p, SCOPE).href

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll([scopeUrl('.'), scopeUrl('manifest.json'), scopeUrl('icons/icon-192.png'), scopeUrl('icons/icon-512.png')])).then(() => self.skipWaiting()))
})
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((k) => Promise.all(k.filter((x) => x !== CACHE).map((x) => caches.delete(x)))).then(() => self.clients.claim()))
})
self.addEventListener('fetch', (e) => {
  const r = e.request
  if (r.method !== 'GET') return
  const u = new URL(r.url)
  if (u.origin !== self.location.origin) return
  if (r.mode === 'navigate') {
    e.respondWith(fetch(r).then((res) => { const c = res.clone(); caches.open(CACHE).then((x) => x.put(r, c)); return res }).catch(() => caches.match(scopeUrl('.'))))
    return
  }
  e.respondWith(caches.match(r).then((cached) => {
    const net = fetch(r).then((res) => { if (res?.ok) { const c = res.clone(); caches.open(CACHE).then((x) => x.put(r, c)) } return res }).catch(() => cached)
    return cached || net
  }))
})
self.addEventListener('message', (e) => { if (e.data === 'SKIP_WAITING') self.skipWaiting() })
