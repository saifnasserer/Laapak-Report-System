/**
 * Laapak Report System - Service Worker
 * Enables offline capabilities for the PWA
 */

const CACHE_NAME = 'laapak-report-system-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/report.html',
  '/admin.html',
  '/css/styles.css',
  '/js/main.js',
  '/js/report.js',
  '/js/admin.js',
  '/manifest.json',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.rtl.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/lightbox2/2.11.3/css/lightbox.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/lightbox2/2.11.3/js/lightbox.min.js'
];

// Install event - cache assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            // Delete outdated caches
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', event => {
  // Skip caching for API requests
  if (event.request.url.includes('/api/')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        
        // Clone the request
        const fetchRequest = event.request.clone();
        
        return fetch(fetchRequest)
          .then(response => {
            // Check if valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clone the response
            const responseToCache = response.clone();
            
            // Open cache and store response
            caches.open(CACHE_NAME)
              .then(cache => {
                // Only cache same-origin requests and non-API requests
                if (event.request.url.startsWith(self.location.origin) && 
                    !event.request.url.includes('/api/')) {
                  cache.put(event.request, responseToCache);
                }
              });
              
            return response;
          })
          .catch(() => {
            // If network fails and it's a document, serve offline page
            if (event.request.mode === 'navigate') {
              return caches.match('/index.html');
            }
          });
      })
  );
});

// Background sync for pending actions (future implementation)
self.addEventListener('sync', event => {
  if (event.tag === 'sync-reports') {
    event.waitUntil(syncPendingReports());
  }
});

// Function to sync pending reports when back online
function syncPendingReports() {
  // This would be implemented to sync any offline changes
  console.log('Syncing pending reports');
  // Future implementation
}

// Push notification handling
self.addEventListener('push', event => {
  if (event.data) {
    const notificationData = event.data.json();
    const options = {
      body: notificationData.body,
      icon: '/img/icons/icon-192x192.png',
      badge: '/img/icons/badge-72x72.png',
      data: {
        url: notificationData.url
      }
    };
    
    event.waitUntil(
      self.registration.showNotification(notificationData.title, options)
    );
  }
});

// Notification click handling
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.notification.data && event.notification.data.url) {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  }
});
