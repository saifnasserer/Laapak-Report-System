/**
 * Laapak Report System - Offline Handler
 * Handles offline functionality and caching
 */

// Check if the browser is online or offline
function updateOfflineStatus() {
    const offlineAlert = document.getElementById('offlineAlert');
    if (offlineAlert) {
        if (navigator.onLine) {
            offlineAlert.style.display = 'none';
        } else {
            offlineAlert.style.display = 'block';
        }
    }
}

// Listen for online/offline events
window.addEventListener('online', updateOfflineStatus);
window.addEventListener('offline', updateOfflineStatus);

// Initial check
document.addEventListener('DOMContentLoaded', function() {
    updateOfflineStatus();
    
    console.log('Offline handler initialized');
});
