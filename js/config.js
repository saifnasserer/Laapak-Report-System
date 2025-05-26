// Client-side configuration
const config = {
    // API configuration
    api: {
        // Default to window.location.origin if no API_BASE_URL is set
        baseUrl: process.env.API_BASE_URL || window.location.origin,
        version: 'v1'
    }
};

// Export as a function for better access
export const getConfig = () => config;

// Also export as a module for non-ES6 environments
window.config = config;
