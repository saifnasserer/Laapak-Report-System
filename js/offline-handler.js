/**
 * Offline Handler for Laapak Report System
 * Manages offline functionality and local storage for authentication
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize offline handler
    initOfflineHandler();
    
    /**
     * Initialize offline handler
     */
    function initOfflineHandler() {
        // Check initial network status
        updateOfflineStatus();
        
        // Listen for online/offline events
        window.addEventListener('online', updateOfflineStatus);
        window.addEventListener('offline', updateOfflineStatus);
        
        // Check for cached credentials if offline
        if (!navigator.onLine) {
            checkCachedCredentials();
        }
    }
    
    /**
     * Update UI based on offline status
     */
    function updateOfflineStatus() {
        const offlineAlert = document.getElementById('offlineAlert');
        
        if (offlineAlert) {
            if (navigator.onLine) {
                offlineAlert.style.display = 'none';
                
                // Try to sync any pending requests
                syncPendingRequests();
            } else {
                offlineAlert.style.display = 'block';
            }
        }
        
        // Dispatch custom event for other components
        const event = new CustomEvent('networkStatusChanged', {
            detail: { online: navigator.onLine }
        });
        document.dispatchEvent(event);
    }
    
    /**
     * Check for cached credentials when offline
     */
    function checkCachedCredentials() {
        // Only proceed if we're on the login page
        if (!window.location.pathname.includes('index.html') && 
            !window.location.pathname.endsWith('/')) {
            return;
        }
        
        const cachedToken = localStorage.getItem('auth_token');
        const rememberMe = localStorage.getItem('remember_me') === 'true';
        
        if (cachedToken && rememberMe) {
            // We have cached credentials and user chose to be remembered
            // Show a message that we're using cached credentials
            showCachedLoginMessage();
            
            // Redirect to appropriate dashboard based on user type
            const userType = localStorage.getItem('user_type');
            
            if (userType === 'admin') {
                window.location.href = 'admin.html';
            } else if (userType === 'client') {
                window.location.href = 'client-dashboard.html';
            }
        }
    }
    
    /**
     * Show message about using cached login
     */
    function showCachedLoginMessage() {
        // Create alert container if it doesn't exist
        let alertContainer = document.querySelector('.cached-login-alert');
        
        if (!alertContainer) {
            alertContainer = document.createElement('div');
            alertContainer.className = 'alert alert-warning cached-login-alert';
            alertContainer.style.position = 'fixed';
            alertContainer.style.top = '70px';
            alertContainer.style.right = '20px';
            alertContainer.style.zIndex = '1050';
            alertContainer.style.maxWidth = '300px';
            
            document.body.appendChild(alertContainer);
        }
        
        // Set alert message
        alertContainer.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="fas fa-exclamation-triangle me-2"></i>
                <div>
                    أنت حاليًا في وضع عدم الاتصال. سيتم استخدام بيانات الدخول المحفوظة مسبقًا.
                </div>
            </div>
        `;
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            alertContainer.style.display = 'none';
        }, 5000);
    }
    
    /**
     * Sync any pending requests when back online
     */
    function syncPendingRequests() {
        // Get pending requests from local storage
        const pendingRequestsStr = localStorage.getItem('pending_requests');
        
        if (!pendingRequestsStr) {
            return;
        }
        
        try {
            const pendingRequests = JSON.parse(pendingRequestsStr);
            
            if (!Array.isArray(pendingRequests) || pendingRequests.length === 0) {
                return;
            }
            
            console.log('Syncing pending requests:', pendingRequests.length);
            
            // Process each pending request
            pendingRequests.forEach(async (request, index) => {
                try {
                    // Check if we have apiService available
                    if (window.apiService) {
                        await window.apiService.request(
                            request.endpoint,
                            request.method,
                            request.data
                        );
                        
                        // Remove this request from the pending list
                        pendingRequests.splice(index, 1);
                        
                        // Update localStorage
                        localStorage.setItem('pending_requests', JSON.stringify(pendingRequests));
                    }
                } catch (error) {
                    console.error('Error syncing request:', error);
                }
            });
            
            // If all requests are processed, clear the pending requests
            if (pendingRequests.length === 0) {
                localStorage.removeItem('pending_requests');
            }
        } catch (error) {
            console.error('Error processing pending requests:', error);
        }
    }
    
    /**
     * Add a request to the pending queue
     * @param {string} endpoint - API endpoint
     * @param {string} method - HTTP method
     * @param {object} data - Request data
     */
    window.addPendingRequest = function(endpoint, method, data) {
        // Get existing pending requests
        const pendingRequestsStr = localStorage.getItem('pending_requests');
        let pendingRequests = [];
        
        if (pendingRequestsStr) {
            try {
                pendingRequests = JSON.parse(pendingRequestsStr);
            } catch (error) {
                console.error('Error parsing pending requests:', error);
            }
        }
        
        // Add new request
        pendingRequests.push({
            endpoint,
            method,
            data,
            timestamp: new Date().toISOString()
        });
        
        // Save to localStorage
        localStorage.setItem('pending_requests', JSON.stringify(pendingRequests));
    };
});
