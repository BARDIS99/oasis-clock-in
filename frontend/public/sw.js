/**
 * Oasis Clock-In PWA Service Worker
 * 
 * Caches ONLY static assets (HTML, CSS, JS, images) for offline/fast-reload.
 * Does NOT cache API responses - all backend calls to Express/Supabase stay live.
 */

const CACHE_NAME = 'oasis-clockin-v1';
const STATIC_CACHE_NAME = 'oasis-static-v1';

// Files to cache on install - only static assets
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/logo.svg',
  '/favicon.svg',
  '/icon-192.svg',
  '/icon-512.svg',
  '/offline.html'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Static assets cached');
        return self.skipWaiting(); // Activate immediately
      })
      .catch((error) => {
        console.error('[SW] Failed to cache static assets:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE_NAME && cacheName !== CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Service worker activated');
        return self.clients.claim(); // Take control immediately
      })
  );
});

// Fetch event - serve from cache for static assets, network for API calls
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // NEVER cache API calls - always fetch from network
  // This includes Supabase, Express backend, and any data endpoints
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/_server/') ||
    url.pathname.includes('supabase') ||
    request.method !== 'GET'
  ) {
    // Always fetch from network for API calls
    event.respondWith(fetch(request));
    return;
  }
  
  // For static assets: try cache first, fall back to network
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          // Return cached version
          return cachedResponse;
        }
        
        // Not in cache, fetch from network
        return fetch(request)
          .then((networkResponse) => {
            // Only cache successful responses for static assets
            if (
              networkResponse &&
              networkResponse.status === 200 &&
              networkResponse.type === 'basic'
            ) {
              // Clone the response (can only be consumed once)
              const responseToCache = networkResponse.clone();
              
              // Cache static files only (JS, CSS, images, fonts)
              if (
                url.pathname.endsWith('.js') ||
                url.pathname.endsWith('.css') ||
                url.pathname.endsWith('.svg') ||
                url.pathname.endsWith('.png') ||
                url.pathname.endsWith('.jpg') ||
                url.pathname.endsWith('.jpeg') ||
                url.pathname.endsWith('.gif') ||
                url.pathname.endsWith('.webp') ||
                url.pathname.endsWith('.woff') ||
                url.pathname.endsWith('.woff2') ||
                url.pathname.endsWith('.ttf') ||
                url.pathname === '/'
              ) {
                caches.open(CACHE_NAME)
                  .then((cache) => {
                    cache.put(request, responseToCache);
                  });
              }
            }
            
            return networkResponse;
          })
          .catch((error) => {
            console.error('[SW] Fetch failed:', error);
            // Could return a custom offline page here if needed
            throw error;
          });
      })
  );
});

// Message event - handle messages from the app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }
});

console.log('[SW] Service worker script loaded');
