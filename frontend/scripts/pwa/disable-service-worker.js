/**
 * Laapak Report System - Service Worker Disabler
 * This script unregisters all service workers to fix API connection issues
 */

// Immediately unregister all service workers when the script loads
(function() {
    if ('serviceWorker' in navigator) {
        console.log('Disabling service workers to fix API connection issues...');
        
        navigator.serviceWorker.getRegistrations()
            .then(registrations => {
                for (let registration of registrations) {
                    registration.unregister();
                    console.log('Service Worker unregistered');
                }
                
                // Clear all caches
                if ('caches' in window) {
                    caches.keys().then(cacheNames => {
                        return Promise.all(
                            cacheNames.map(cacheName => {
                                console.log('Deleting cache:', cacheName);
                                return caches.delete(cacheName);
                            })
                        );
                    }).then(() => {
                        console.log('All caches cleared');
                    });
                }
            });
    }
})();
