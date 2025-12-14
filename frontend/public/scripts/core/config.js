// Client-side configuration
var config = {
    // API configuration
    api: {
        // Auto-detect: use localhost for development, production URL for deployed
        baseUrl: (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) 
            ? 'http://localhost:3001' 
            : 'https://reports.laapak.com',
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
