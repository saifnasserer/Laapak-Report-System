/**
 * Laapak Report System - Service Worker Reset
 * Helps to unregister service workers and clear caches to ensure clean updates
 */

// Function to unregister all service workers
async function unregisterServiceWorkers() {
    if ('serviceWorker' in navigator) {
        try {
            const registrations = await navigator.serviceWorker.getRegistrations();
            for (let registration of registrations) {
                await registration.unregister();
            }
            console.log('Service workers unregistered successfully');
            return true;
        } catch (error) {
            console.error('Error unregistering service workers:', error);
            return false;
        }
    }
    return false;
}

// Function to clear all caches
async function clearAllCaches() {
    if ('caches' in window) {
        try {
            const cacheNames = await caches.keys();
            await Promise.all(
                cacheNames.map(cacheName => {
                    console.log('Deleting cache:', cacheName);
                    return caches.delete(cacheName);
                })
            );
            console.log('Caches cleared successfully');
            return true;
        } catch (error) {
            console.error('Error clearing caches:', error);
            return false;
        }
    }
    return false;
}

// Initialize on page load - but don't automatically run the clearing functions
document.addEventListener('DOMContentLoaded', function() {
    const resetButton = document.getElementById('resetServiceWorkerBtn');
    
    if (resetButton) {
        resetButton.addEventListener('click', async function() {
            const workersCleared = await unregisterServiceWorkers();
            const cachesCleared = await clearAllCaches();
            
            if (workersCleared && cachesCleared) {
                alert('App cache cleared. The page will now reload.');
                window.location.reload();
            } else {
                alert('There was an issue clearing the cache. Please try again or contact support.');
            }
        });
    }
    
    console.log('Service worker reset handler initialized');
});
