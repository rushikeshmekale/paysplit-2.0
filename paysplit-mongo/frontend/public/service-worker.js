const CACHE = 'paysplit-v2'
const PRECACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
]

// Install — precache key assets
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(PRECACHE).catch(() => {}))
  )
  self.skipWaiting()
})

// Activate — clean old caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// Fetch — network first for API, cache first for assets
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url)

  // Never cache API calls or external services
  if (url.hostname.includes('onrender.com') ||
      url.hostname.includes('supabase.co') ||
      url.hostname.includes('dicebear.com') ||
      url.hostname.includes('fonts.googleapis.com')) {
    return
  }

  // Cache first for static assets (images, fonts, icons)
  if (e.request.destination === 'image' ||
      e.request.destination === 'font' ||
      url.pathname.includes('/icon-') ||
      url.pathname.includes('/screenshot')) {
    e.respondWith(
      caches.match(e.request).then((cached) => {
        return cached || fetch(e.request).then((res) => {
          const clone = res.clone()
          caches.open(CACHE).then((c) => c.put(e.request, clone))
          return res
        })
      })
    )
    return
  }

  // Network first for everything else (HTML, JS, CSS)
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res.ok) {
          const clone = res.clone()
          caches.open(CACHE).then((c) => c.put(e.request, clone))
        }
        return res
      })
      .catch(() => caches.match(e.request).then((cached) => cached || caches.match('/index.html')))
  )
})
