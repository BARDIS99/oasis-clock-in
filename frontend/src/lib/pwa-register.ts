/**
 * PWA Service Worker Registration
 * Registers the service worker for offline support and fast loading
 */

export function registerServiceWorker() {
  // Only register in production or when explicitly enabled
  if (typeof window === 'undefined') {
    return; // Don't run on server
  }

  if (!('serviceWorker' in navigator)) {
    console.log('[PWA] Service Workers not supported in this browser');
    return;
  }

  // Register on page load
  window.addEventListener('load', () => {
    const swUrl = '/sw.js';

    navigator.serviceWorker
      .register(swUrl)
      .then((registration) => {
        console.log('[PWA] Service Worker registered successfully:', registration.scope);

        // Check for updates periodically
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker available
              console.log('[PWA] New version available! Reload to update.');
              
              // Optionally show a notification to the user
              // You can integrate this with your toast system
              if (window.confirm('New version available! Reload to update?')) {
                newWorker.postMessage({ type: 'SKIP_WAITING' });
                window.location.reload();
              }
            }
          });
        });

        // Handle controller change (new service worker activated)
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          console.log('[PWA] New service worker activated');
        });
      })
      .catch((error) => {
        console.error('[PWA] Service Worker registration failed:', error);
      });
  });
}

/**
 * Unregister service worker (useful for debugging)
 */
export async function unregisterServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  const registrations = await navigator.serviceWorker.getRegistrations();
  for (const registration of registrations) {
    await registration.unregister();
  }
  console.log('[PWA] Service Worker unregistered');
}

/**
 * Clear all caches (useful for debugging)
 */
export async function clearCaches() {
  if (!('caches' in window)) return;

  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map((name) => caches.delete(name)));
  console.log('[PWA] All caches cleared');
}
