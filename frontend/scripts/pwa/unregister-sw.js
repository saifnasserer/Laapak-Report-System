/**
 * Unregister service workers to prevent caching issues
 */
(function() {
    // Check if service workers are supported
    if ('serviceWorker' in navigator) {
        console.log('Checking for active service workers...');
        
        // Get all registered service workers and unregister them
        navigator.serviceWorker.getRegistrations().then(function(registrations) {
            for (let registration of registrations) {
                console.log('Unregistering service worker:', registration);
                registration.unregister();
            }
            console.log('Service workers unregistered successfully');
            
            // Clear caches
            if ('caches' in window) {
                caches.keys().then(function(cacheNames) {
                    return Promise.all(
                        cacheNames.map(function(cacheName) {
                            console.log('Deleting cache:', cacheName);
                            return caches.delete(cacheName);
                        })
                    );
                }).then(function() {
                    console.log('Caches cleared successfully');
                    // Reload the page to ensure clean state
                    window.location.reload(true);
                });
            }
        }).catch(function(error) {
            console.error('Error unregistering service workers:', error);
        });
    }
})();
