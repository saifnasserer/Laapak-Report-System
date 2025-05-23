/**
 * Laapak Report System - Service Worker Registration
 * Registers the service worker for offline functionality
 */

// Register service worker if supported
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/service-worker.js')
            .then(function(registration) {
                console.log('Service Worker registered with scope:', registration.scope);
            })
            .catch(function(error) {
                console.log('Service Worker registration failed:', error);
            });
    });
}

// Check if online
function updateOnlineStatus() {
    const offlineAlert = document.getElementById('offlineAlert');
    if (offlineAlert) {
        if (navigator.onLine) {
            offlineAlert.style.display = 'none';
        } else {
            offlineAlert.style.display = 'block';
        }
    }
}

// Add event listeners for online/offline events
window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);

// Check status on initial load
document.addEventListener('DOMContentLoaded', updateOnlineStatus);
