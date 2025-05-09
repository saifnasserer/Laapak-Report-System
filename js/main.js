/**
 * Laapak Report System - Main JavaScript
 * Handles common functionality across the application
 */

// Check if the user is online/offline and show appropriate notification
function updateOnlineStatus() {
    const offlineAlert = document.getElementById('offlineAlert');
    
    if (offlineAlert) {
        if (navigator.onLine) {
            offlineAlert.style.display = 'none';
            
            // If we were offline and now back online, sync any pending changes
            if (window.wasOffline) {
                console.log('Back online, syncing data...');
                // Future implementation: Sync local data with server
                window.wasOffline = false;
            }
        } else {
            offlineAlert.style.display = 'block';
            window.wasOffline = true;
        }
    }
}

// PWA Installation
function initPWA() {
    let deferredPrompt;
    const pwaInstallButton = document.getElementById('pwaInstallButton');
    
    if (pwaInstallButton) {
        // Hide the button initially
        pwaInstallButton.style.display = 'none';
        
        // Wait for the beforeinstallprompt event
        window.addEventListener('beforeinstallprompt', (e) => {
            // Prevent the default browser install prompt
            e.preventDefault();
            
            // Store the event for later use
            deferredPrompt = e;
            
            // Show the install button
            pwaInstallButton.style.display = 'block';
            
            // Handle the install button click
            pwaInstallButton.addEventListener('click', () => {
                // Hide the button
                pwaInstallButton.style.display = 'none';
                
                // Show the install prompt
                deferredPrompt.prompt();
                
                // Wait for the user's choice
                deferredPrompt.userChoice.then((choiceResult) => {
                    if (choiceResult.outcome === 'accepted') {
                        console.log('User accepted the install prompt');
                    } else {
                        console.log('User dismissed the install prompt');
                    }
                    
                    // Clear the deferred prompt
                    deferredPrompt = null;
                });
            });
        });
        
        // Listen for the appinstalled event
        window.addEventListener('appinstalled', () => {
            console.log('PWA was installed');
            pwaInstallButton.style.display = 'none';
        });
    }
}

// Initialize when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Check online status initially and when it changes
    updateOnlineStatus();
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    
    // Initialize PWA features
    initPWA();
    
    // Initialize any bootstrap tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
});
