// Relocato PWA Service Worker
// Version 1.0.0 - Professional Moving Services

const CACHE_NAME = 'relocato-v1.0.0';
const RUNTIME_CACHE = 'relocato-runtime-v1.0.0';

// Core files to cache for offline functionality
const CORE_ASSETS = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/favicon.ico',
  '/logo192.png',
  '/logo512.png',
];

// API endpoints to cache for offline access
const API_CACHE_PATTERNS = [
  /^https:\/\/api\.ruempel-schmiede\.com\//,
  /^https:\/\/docs\.google\.com\/spreadsheets\//,
];

// Install event - cache core assets
self.addEventListener('install', event => {
  console.log('[SW] Installing Relocato Service Worker v1.0.0');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching core assets');
        return cache.addAll(CORE_ASSETS);
      })
      .then(() => {
        console.log('[SW] Core assets cached successfully');
        self.skipWaiting();
      })
      .catch(error => {
        console.error('[SW] Failed to cache core assets:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[SW] Activating Relocato Service Worker v1.0.0');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(cacheName => {
            return cacheName.startsWith('relocato-') && 
                   cacheName !== CACHE_NAME && 
                   cacheName !== RUNTIME_CACHE;
          })
          .map(cacheName => {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    }).then(() => {
      console.log('[SW] Service Worker activated and ready');
      return self.clients.claim();
    })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and non-http requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Handle different types of requests
  if (isNavigationRequest(request)) {
    // Navigation requests - Network first, fallback to cache
    event.respondWith(handleNavigationRequest(request));
  } else if (isAPIRequest(url)) {
    // API requests - Network first with cache fallback
    event.respondWith(handleAPIRequest(request));
  } else if (isStaticAsset(url)) {
    // Static assets - Cache first
    event.respondWith(handleStaticAsset(request));
  } else {
    // Everything else - Network first
    event.respondWith(handleNetworkFirst(request));
  }
});

// Handle navigation requests (page loads)
async function handleNavigationRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Navigation request failed, trying cache:', error);
    
    // Fallback to cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Ultimate fallback - return cached index page
    const indexCache = await caches.match('/');
    if (indexCache) {
      return indexCache;
    }
    
    // If nothing works, return a basic offline page
    return new Response(
      createOfflinePage(),
      {
        headers: { 'Content-Type': 'text/html' }
      }
    );
  }
}

// Handle API requests
async function handleAPIRequest(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful API responses
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    throw new Error(`API request failed with status: ${networkResponse.status}`);
  } catch (error) {
    console.log('[SW] API request failed, trying cache:', error);
    
    // Fallback to cache
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      // Add a header to indicate this is from cache
      const headers = new Headers(cachedResponse.headers);
      headers.set('X-From-Cache', 'true');
      
      return new Response(cachedResponse.body, {
        status: cachedResponse.status,
        statusText: cachedResponse.statusText,
        headers: headers
      });
    }
    
    // Return offline response for API calls
    return new Response(
      JSON.stringify({
        error: 'Offline',
        message: 'Diese Anfrage ist im Offline-Modus nicht verfügbar.',
        cached: false
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Handle static assets
async function handleStaticAsset(request) {
  const cache = await caches.open(CACHE_NAME);
  
  // Try cache first
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // If not in cache, fetch from network and cache
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[SW] Static asset request failed:', error);
    
    // For failed image requests, return a placeholder
    if (request.destination === 'image') {
      return new Response(
        createImagePlaceholder(),
        { headers: { 'Content-Type': 'image/svg+xml' } }
      );
    }
    
    throw error;
  }
}

// Handle network-first requests
async function handleNetworkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Fallback to cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

// Helper functions
function isNavigationRequest(request) {
  return request.mode === 'navigate' || 
         (request.method === 'GET' && request.headers.get('accept').includes('text/html'));
}

function isAPIRequest(url) {
  return API_CACHE_PATTERNS.some(pattern => pattern.test(url.href)) ||
         url.pathname.startsWith('/api/');
}

function isStaticAsset(url) {
  const pathname = url.pathname;
  return pathname.startsWith('/static/') ||
         pathname.endsWith('.js') ||
         pathname.endsWith('.css') ||
         pathname.endsWith('.png') ||
         pathname.endsWith('.jpg') ||
         pathname.endsWith('.jpeg') ||
         pathname.endsWith('.gif') ||
         pathname.endsWith('.svg') ||
         pathname.endsWith('.ico') ||
         pathname.endsWith('.woff') ||
         pathname.endsWith('.woff2');
}

function createOfflinePage() {
  return `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Relocato - Offline</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          margin: 0;
          padding: 40px 20px;
          text-align: center;
          background: linear-gradient(135deg, #1565C0 0%, #42A5F5 100%);
          color: white;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }
        .container {
          max-width: 500px;
          background: rgba(255, 255, 255, 0.1);
          padding: 40px;
          border-radius: 16px;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        h1 {
          font-size: 2.5rem;
          margin-bottom: 1rem;
          font-weight: 800;
        }
        p {
          font-size: 1.1rem;
          line-height: 1.6;
          margin-bottom: 2rem;
          opacity: 0.9;
        }
        .icon {
          font-size: 4rem;
          margin-bottom: 2rem;
        }
        .retry-btn {
          background: white;
          color: #1565C0;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          font-size: 1rem;
          transition: transform 0.2s;
        }
        .retry-btn:hover {
          transform: translateY(-2px);
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">📱</div>
        <h1>Relocato</h1>
        <p>
          Sie sind momentan offline. Einige Funktionen sind eingeschränkt verfügbar.
          Bitte überprüfen Sie Ihre Internetverbindung.
        </p>
        <button class="retry-btn" onclick="window.location.reload()">
          Erneut versuchen
        </button>
      </div>
    </body>
    </html>
  `;
}

function createImagePlaceholder() {
  return `
    <svg width="300" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect width="300" height="200" fill="#f0f0f0"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" 
            font-family="Arial, sans-serif" font-size="14" fill="#999">
        Bild nicht verfügbar
      </text>
    </svg>
  `;
}

// Handle background sync for offline actions
self.addEventListener('sync', event => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'background-sync-quotes') {
    event.waitUntil(syncOfflineQuotes());
  } else if (event.tag === 'background-sync-customers') {
    event.waitUntil(syncOfflineCustomers());
  }
});

// Sync offline quotes when connection is restored
async function syncOfflineQuotes() {
  try {
    // Get offline quotes from IndexedDB or localStorage
    const offlineQuotes = JSON.parse(localStorage.getItem('offline-quotes') || '[]');
    
    for (const quote of offlineQuotes) {
      try {
        // Attempt to sync each quote
        await fetch('/api/quotes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(quote)
        });
        
        console.log('[SW] Successfully synced offline quote:', quote.id);
      } catch (error) {
        console.error('[SW] Failed to sync quote:', quote.id, error);
      }
    }
    
    // Clear synced quotes
    localStorage.removeItem('offline-quotes');
    console.log('[SW] Offline quotes sync completed');
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

// Sync offline customers when connection is restored
async function syncOfflineCustomers() {
  try {
    const offlineCustomers = JSON.parse(localStorage.getItem('offline-customers') || '[]');
    
    for (const customer of offlineCustomers) {
      try {
        await fetch('/api/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(customer)
        });
        
        console.log('[SW] Successfully synced offline customer:', customer.id);
      } catch (error) {
        console.error('[SW] Failed to sync customer:', customer.id, error);
      }
    }
    
    localStorage.removeItem('offline-customers');
    console.log('[SW] Offline customers sync completed');
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

// Handle push notifications
self.addEventListener('push', event => {
  console.log('[SW] Push notification received');
  
  const options = {
    body: 'Sie haben eine neue Benachrichtigung von Relocato',
    icon: '/logo192.png',
    badge: '/logo192.png',
    vibrate: [200, 100, 200],
    tag: 'relocato-notification',
    actions: [
      {
        action: 'open',
        title: 'Öffnen',
        icon: '/icons/action-open.png'
      },
      {
        action: 'dismiss',
        title: 'Schließen',
        icon: '/icons/action-close.png'
      }
    ]
  };
  
  if (event.data) {
    const data = event.data.json();
    options.body = data.message || options.body;
    options.title = data.title || 'Relocato';
  }
  
  event.waitUntil(
    self.registration.showNotification('Relocato', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  console.log('[SW] Notification clicked:', event.action);
  
  event.notification.close();
  
  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

console.log('[SW] Relocato Service Worker v1.0.0 loaded successfully');