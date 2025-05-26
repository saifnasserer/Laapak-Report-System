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
  '/invoices.html',
  '/create-invoice.html',
  '/css/styles.css',
  '/css/custom-admin.css',
  '/js/main.js',
  '/js/report.js',
  '/js/admin.js',
  '/js/invoices.js',
  '/js/header-component.js',
  '/js/auth-middleware.js',
  '/js/sw-register.js',
  '/manifest.json',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.rtl.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdn.datatables.net/1.11.5/css/dataTables.bootstrap5.min.css',
  'https://cdn.datatables.net/1.11.5/js/jquery.dataTables.min.js',
  'https://cdn.datatables.net/1.11.5/js/dataTables.bootstrap5.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/toastr.js/latest/toastr.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/toastr.js/latest/toastr.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.29.1/moment.min.js',
  'https://code.jquery.com/jquery-3.6.0.min.js'
];

// Install event - cache assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(ASSETS_TO_CACHE).catch(error => {
          console.error('Failed to cache one or more assets during install:', error);
          // Optionally, you can inspect which request failed if the browser provides that info
          // For example, some browsers might show the failing URL in the error object
          // Or you might have to cache them one by one to pinpoint the issue
          // For now, just re-throw the error to ensure the SW install fails clearly
          throw error;
        });
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
