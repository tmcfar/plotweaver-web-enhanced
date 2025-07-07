/// <reference lib="webworker" />

import { clientsClaim } from 'workbox-core';
import { ExpirationPlugin } from 'workbox-expiration';
import { precacheAndRoute, createHandlerBoundToURL } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { StaleWhileRevalidate, CacheFirst, NetworkFirst } from 'workbox-strategies';
import { BackgroundSyncPlugin } from 'workbox-background-sync';
import { Queue } from 'workbox-background-sync';

declare const self: ServiceWorkerGlobalScope;

clientsClaim();

// Precache all static assets
precacheAndRoute(self.__WB_MANIFEST);

// Cache the App Shell
const appShellRoute = new NavigationRoute(createHandlerBoundToURL('/index.html'));
registerRoute(appShellRoute);

// Cache API responses with network-first strategy
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 5 * 60, // 5 minutes
      }),
    ],
  })
);

// Cache git read operations with cache-first strategy
registerRoute(
  ({ url }) => url.pathname.includes('/git/read'),
  new CacheFirst({
    cacheName: 'git-read-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 60 * 60, // 1 hour
      }),
    ],
  })
);

// Cache images with cache-first strategy
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      }),
    ],
  })
);

// Background sync for write operations
const bgSyncPlugin = new BackgroundSyncPlugin('write-queue', {
  maxRetentionTime: 24 * 60, // Retry for up to 24 hours
});

// Queue for failed write operations
const writeQueue = new Queue('write-operations', {
  onSync: async ({ queue }) => {
    let entry;
    while ((entry = await queue.shiftRequest())) {
      try {
        await fetch(entry.request);
      } catch (error) {
        await queue.unshiftRequest(entry);
        throw error;
      }
    }
  },
});

// Handle write operations with background sync
registerRoute(
  ({ url }) => url.pathname.includes('/api/') && 
    ['POST', 'PUT', 'DELETE', 'PATCH'].includes(url.searchParams.get('method') || ''),
  async ({ event }) => {
    try {
      const response = await fetch(event.request.clone());
      return response;
    } catch (error) {
      await writeQueue.pushRequest({ request: event.request });
      return new Response(
        JSON.stringify({ 
          error: 'Offline - request queued for sync',
          queued: true 
        }),
        { 
          status: 202,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  },
  'POST'
);

// Skip waiting and claim clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Listen for sync events
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-writes') {
    event.waitUntil(writeQueue.replayRequests());
  }
});
