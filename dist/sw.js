const CACHE = 'bsuir-' + new Date().toISOString().slice(0, 10)
const ASSET_CACHE = 'bsuir-assets-' + new Date().toISOString().slice(0, 10)
const SCOPE = (self.registration && self.registration.scope) || self.location.origin + '/'
const scopeUrl = (p) => new URL(p, SCOPE).href

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll([scopeUrl('.'), scopeUrl('manifest.json'), scopeUrl('icons/icon-192.png'), scopeUrl('icons/icon-512.png')]))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE && k !== ASSET_CACHE).map((k) => caches.delete(k)))
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
      }).catch(() => caches.match(scopeUrl('.')))
    )
    return
  }

  e.respondWith(
    caches.open(ASSET_CACHE).then((cache) =>
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
  if (e.data === 'GET_VERSION') {
    e.source?.postMessage({ type: 'SW_VERSION', version: CACHE })
  }
})
