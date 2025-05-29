// Client-side configuration
var config = {
    // API configuration
    api: {
        // Default to window.location.origin if no API_BASE_URL is set
        baseUrl: 'https://reports.laapak.com',
        version: 'v1'
    }
};

// Make config globally available
window.config = config;

// Helper function to get the config
function getConfig() {
    return window.config || config;
}

// Self-executing function to ensure config is initialized immediately
(function() {
    console.log('Config initialized with API base URL:', config.api.baseUrl);
    // Expose config to global scope for browser console debugging
    if (typeof window !== 'undefined') {
        window.appConfig = config;
    }
})();
