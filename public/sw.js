const CACHE = 'bsuir-v2'
const SCOPE = (self.registration && self.registration.scope) || self.location.origin + '/'
const scopeUrl = (p) => new URL(p, SCOPE).href

self.addEventListener('install', (e) => {
  self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (e) => {
  const r = e.request
  if (r.method !== 'GET') return
  const u = new URL(r.url)
  if (u.origin !== self.location.origin) return

  if (r.mode === 'navigate') {
    e.respondWith(
      fetch(r).then((res) => {
        const c = res.clone()
        caches.open(CACHE).then((x) => x.put(r, c))
        return res
      }).catch(() => caches.match(r).then((c) => c || caches.match(scopeUrl('.'))))
    )
    return
  }

  e.respondWith(
    caches.open(CACHE).then((cache) =>
      cache.match(r).then((cached) => {
        const net = fetch(r).then((res) => {
          if (res?.ok) cache.put(r, res.clone())
          return res
        }).catch(() => cached)
        return cached || net
      })
    )
  )
})

self.addEventListener('message', (e) => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting()
})
