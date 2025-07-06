// Service Worker for offline support and caching
const CACHE_NAME = 'plotweaver-v1'
const STATIC_CACHE = 'plotweaver-static-v1'
const DYNAMIC_CACHE = 'plotweaver-dynamic-v1'
const API_CACHE = 'plotweaver-api-v1'

// Files to cache immediately
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/offline.html',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
]

// API endpoints to cache
const API_ENDPOINTS = [
  '/api/projects',
  '/api/user/profile',
  '/api/settings'
]

// Cache strategies
enum CacheStrategy {
  CACHE_FIRST = 'cache-first',
  NETWORK_FIRST = 'network-first',
  STALE_WHILE_REVALIDATE = 'stale-while-revalidate',
  NETWORK_ONLY = 'network-only',
  CACHE_ONLY = 'cache-only'
}

// Route configurations
const ROUTE_CONFIGS = new Map([
  // Static assets - cache first
  [/\.(js|css|png|jpg|jpeg|gif|svg|woff2?)$/, CacheStrategy.CACHE_FIRST],
  
  // API calls - network first with fallback
  [/^\/api\//, CacheStrategy.NETWORK_FIRST],
  
  // HTML pages - stale while revalidate
  [/\/$/, CacheStrategy.STALE_WHILE_REVALIDATE],
  
  // Next.js static files
  [/^\/_next\//, CacheStrategy.CACHE_FIRST]
])

// Install event - cache static assets
self.addEventListener('install', (event: ExtendableEvent) => {
  console.log('Service Worker installing...')
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE).then(cache => {
        return cache.addAll(STATIC_ASSETS)
      }),
      
      // Skip waiting to activate immediately
      self.skipWaiting()
    ])
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event: ExtendableEvent) => {
  console.log('Service Worker activating...')
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => 
              cacheName.startsWith('plotweaver-') && 
              ![STATIC_CACHE, DYNAMIC_CACHE, API_CACHE].includes(cacheName)
            )
            .map(cacheName => caches.delete(cacheName))
        )
      }),
      
      // Take control of all clients
      self.clients.claim()
    ])
  )
})

// Fetch event - handle requests with appropriate strategy
self.addEventListener('fetch', (event: FetchEvent) => {
  const { request } = event
  const url = new URL(request.url)
  
  // Skip cross-origin requests
  if (url.origin !== self.location.origin) {
    return
  }
  
  // Determine cache strategy
  const strategy = getStrategyForRequest(request)
  
  event.respondWith(
    handleRequest(request, strategy)
  )
})

// Get cache strategy for a request
function getStrategyForRequest(request: Request): CacheStrategy {
  const url = new URL(request.url)
  const pathname = url.pathname
  
  for (const [pattern, strategy] of ROUTE_CONFIGS) {
    if (pattern.test(pathname)) {
      return strategy
    }
  }
  
  // Default strategy
  return CacheStrategy.STALE_WHILE_REVALIDATE
}

// Handle request with specified strategy
async function handleRequest(request: Request, strategy: CacheStrategy): Promise<Response> {
  switch (strategy) {
    case CacheStrategy.CACHE_FIRST:
      return cacheFirst(request)
    
    case CacheStrategy.NETWORK_FIRST:
      return networkFirst(request)
    
    case CacheStrategy.STALE_WHILE_REVALIDATE:
      return staleWhileRevalidate(request)
    
    case CacheStrategy.NETWORK_ONLY:
      return fetch(request)
    
    case CacheStrategy.CACHE_ONLY:
      return cacheOnly(request)
    
    default:
      return fetch(request)
  }
}

// Cache first strategy
async function cacheFirst(request: Request): Promise<Response> {
  const cache = await caches.open(STATIC_CACHE)
  const cachedResponse = await cache.match(request)
  
  if (cachedResponse) {
    return cachedResponse
  }
  
  try {
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    return getOfflineFallback(request)
  }
}

// Network first strategy
async function networkFirst(request: Request): Promise<Response> {
  const cache = await caches.open(
    request.url.includes('/api/') ? API_CACHE : DYNAMIC_CACHE
  )
  
  try {
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    const cachedResponse = await cache.match(request)
    
    if (cachedResponse) {
      return cachedResponse
    }
    
    return getOfflineFallback(request)
  }
}

// Stale while revalidate strategy
async function staleWhileRevalidate(request: Request): Promise<Response> {
  const cache = await caches.open(DYNAMIC_CACHE)
  const cachedResponse = await cache.match(request)
  
  // Always try to update in background
  const networkPromise = fetch(request).then(response => {
    if (response.ok) {
      cache.put(request, response.clone())
    }
    return response
  }).catch(() => {
    // Network failed, but we might have cache
  })
  
  // Return cache immediately if available
  if (cachedResponse) {
    return cachedResponse
  }
  
  // Otherwise wait for network
  try {
    return await networkPromise
  } catch (error) {
    return getOfflineFallback(request)
  }
}

// Cache only strategy
async function cacheOnly(request: Request): Promise<Response> {
  const cache = await caches.open(STATIC_CACHE)
  const cachedResponse = await cache.match(request)
  
  if (cachedResponse) {
    return cachedResponse
  }
  
  return getOfflineFallback(request)
}

// Get offline fallback
function getOfflineFallback(request: Request): Response {
  const url = new URL(request.url)
  
  // Return offline page for navigation requests
  if (request.mode === 'navigate') {
    return caches.match('/offline.html').then(response => 
      response || new Response('Offline', { status: 503 })
    )
  }
  
  // Return cached fallback for API requests
  if (url.pathname.startsWith('/api/')) {
    return new Response(
      JSON.stringify({
        error: 'Offline',
        message: 'This feature requires an internet connection'
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
  
  // Generic offline response
  return new Response('Offline', { status: 503 })
}

// Background sync for offline actions
self.addEventListener('sync', (event: any) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(
      syncOfflineActions()
    )
  }
})

// Sync offline actions when connection is restored
async function syncOfflineActions() {
  try {
    // Get offline actions from IndexedDB
    const db = await openOfflineDB()
    const transaction = db.transaction(['offlineActions'], 'readwrite')
    const store = transaction.objectStore('offlineActions')
    const actions = await getAllFromStore(store)
    
    // Process each action
    for (const action of actions) {
      try {
        await processOfflineAction(action)
        
        // Remove successful action
        await store.delete(action.id)
      } catch (error) {
        console.error('Failed to sync action:', action, error)
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error)
  }
}

// Process an offline action
async function processOfflineAction(action: any) {
  const { type, data, timestamp } = action
  
  switch (type) {
    case 'SAVE_DRAFT':
      return fetch('/api/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
    
    case 'ADD_COMMENT':
      return fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
    
    case 'UPDATE_SETTINGS':
      return fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
    
    default:
      console.warn('Unknown offline action type:', type)
  }
}

// IndexedDB helpers
function openOfflineDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('PlotWeaverOffline', 1)
    
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    
    request.onupgradeneeded = () => {
      const db = request.result
      
      if (!db.objectStoreNames.contains('offlineActions')) {
        const store = db.createObjectStore('offlineActions', { keyPath: 'id' })
        store.createIndex('timestamp', 'timestamp')
      }
    }
  })
}

function getAllFromStore(store: IDBObjectStore): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const request = store.getAll()
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
  })
}

// Push notifications
self.addEventListener('push', (event: any) => {
  if (!event.data) return
  
  const data = event.data.json()
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    data: data.data,
    actions: data.actions || []
  }
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  )
})

// Notification click handling
self.addEventListener('notificationclick', (event: any) => {
  const { notification, action } = event
  const data = notification.data || {}
  
  notification.close()
  
  event.waitUntil(
    handleNotificationClick(action, data)
  )
})

// Handle notification clicks
async function handleNotificationClick(action: string, data: any) {
  const clients = await self.clients.matchAll({ type: 'window' })
  
  // Check if app is already open
  const existingClient = clients.find(client => 
    client.url.includes(self.location.origin)
  )
  
  const url = getUrlForAction(action, data)
  
  if (existingClient) {
    // Focus existing window and navigate
    await existingClient.focus()
    existingClient.postMessage({
      type: 'NAVIGATE',
      url: url
    })
  } else {
    // Open new window
    await self.clients.openWindow(url)
  }
}

// Get URL for notification action
function getUrlForAction(action: string, data: any): string {
  switch (action) {
    case 'view_comment':
      return `/projects/${data.projectId}?comment=${data.commentId}`
    
    case 'view_project':
      return `/projects/${data.projectId}`
    
    case 'view_collaboration':
      return `/projects/${data.projectId}/collaborate`
    
    default:
      return '/'
  }
}

// Periodic background sync for critical data
self.addEventListener('periodicsync', (event: any) => {
  if (event.tag === 'critical-sync') {
    event.waitUntil(syncCriticalData())
  }
})

// Sync critical data
async function syncCriticalData() {
  try {
    // Sync user settings
    await fetch('/api/settings/sync', { method: 'POST' })
    
    // Sync project metadata
    await fetch('/api/projects/sync', { method: 'POST' })
    
    // Update cache with fresh data
    const cache = await caches.open(API_CACHE)
    await cache.addAll([
      '/api/user/profile',
      '/api/projects',
      '/api/settings'
    ])
  } catch (error) {
    console.error('Critical sync failed:', error)
  }
}

export {}