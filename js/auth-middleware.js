/**
 * Laapak Report System - Authentication Middleware
 * Handles authentication state and token management for client pages
 */

// Authentication middleware for client and admin pages
class AuthMiddleware {
    constructor() {
        // Use dynamic API URL based on current environment
        this.API_URL = 'http://localhost:8000';
        this.VERIFY_URL = `${this.API_URL}/api/auth/verify`;
        this.LOGOUT_URL = `${this.API_URL}/api/auth/logout`;
        
        console.log('Auth middleware initialized with API URL:', this.API_URL);
    }

    // Get auth token from storage
    getAuthToken() {
        // Check for both token types (admin and client)
        return localStorage.getItem('adminToken') || 
               sessionStorage.getItem('adminToken') || 
               localStorage.getItem('clientToken') || 
               sessionStorage.getItem('clientToken');
    }

    // Check if admin is logged in
    isAdminLoggedIn() {
        const adminToken = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
        const adminInfo = JSON.parse(localStorage.getItem('adminInfo') || sessionStorage.getItem('adminInfo') || 'null');
        return !!adminToken && !!adminInfo;
    }

    // Check if client is logged in
    isClientLoggedIn() {
        const clientToken = localStorage.getItem('clientToken') || sessionStorage.getItem('clientToken');
        const clientInfo = JSON.parse(localStorage.getItem('clientInfo') || sessionStorage.getItem('clientInfo') || 'null');
        return !!clientToken && !!clientInfo;
    }

    // Get current user info
    async getCurrentUser() {
        const token = this.getAuthToken();
        
        if (!token) {
            return null;
        }
        
        try {
            const response = await fetch(this.VERIFY_URL, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to get user information');
            }
            
            const data = await response.json();
            return data.user;
        } catch (error) {
            console.error('Error getting current user:', error);
            return null;
        }
    }

    // Logout user
    async logout() {
        console.log('Logging out user...');
        
        try {
            const token = this.getAuthToken();
            if (token) {
                // Call the logout API endpoint
                try {
                    await fetch(this.LOGOUT_URL, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json',
                            'Authorization': `Bearer ${token}`
                        }
                    });
                } catch (apiError) {
                    console.error('API logout error:', apiError);
                    // Continue with local logout even if API call fails
                }
            }
            
            // Determine if we're logging out an admin or client
            const isAdmin = this.isAdminLoggedIn();
            const isClient = this.isClientLoggedIn();
            
            console.log('User type:', isAdmin ? 'Admin' : (isClient ? 'Client' : 'Unknown'));
            
            // Clear all possible token variations
            localStorage.removeItem('authToken');
            sessionStorage.removeItem('authToken');
            localStorage.removeItem('adminToken');
            sessionStorage.removeItem('adminToken');
            localStorage.removeItem('clientToken');
            sessionStorage.removeItem('clientToken');
            
            // Clear admin data
            localStorage.removeItem('adminInfo');
            sessionStorage.removeItem('adminInfo');
            
            // Clear client data
            localStorage.removeItem('clientInfo');
            sessionStorage.removeItem('clientInfo');
            
            // Clear any other session data
            localStorage.removeItem('currentUser');
            sessionStorage.removeItem('currentUser');
            
            console.log('All tokens and user info cleared');
            
            // Redirect to appropriate page
            setTimeout(() => {
                console.log('Redirecting to login page...');
                window.location.href = 'index.html';
            }, 100);
        } catch (error) {
            console.error('Error during logout:', error);
            alert('حدث خطأ أثناء تسجيل الخروج. يرجى المحاولة مرة أخرى.');
        }
    }

    // Require admin authentication for admin pages
    requireAdminAuth() {
        if (!this.isAdminLoggedIn()) {
            // Redirect to login page if not authenticated
            window.location.href = 'index.html';
            return false;
        }
        return true;
    }

    // Require client authentication for client pages
    requireClientAuth() {
        if (!this.isClientLoggedIn()) {
            // Redirect to login page if not authenticated
            window.location.href = 'index.html';
            return false;
        }
        return true;
    }

    // Update UI with user information
    async updateUserUI(nameElementId, roleElementId = null) {
        const user = await this.getCurrentUser();
        
        if (!user) {
            return false;
        }
        
        // Update name element if it exists
        const nameElement = document.getElementById(nameElementId);
        if (nameElement && user.name) {
            nameElement.textContent = user.name;
        }
        
        // Update role element if it exists and user has a role
        if (roleElementId && user.role) {
            const roleElement = document.getElementById(roleElementId);
            if (roleElement) {
                roleElement.textContent = user.role;
            }
        }
        
        return true;
    }
}

// Create a global instance
const authMiddleware = new AuthMiddleware();

// Add logout event listeners to all logout buttons
document.addEventListener('DOMContentLoaded', function() {
    const logoutButtons = document.querySelectorAll('.logout-btn');
    
    logoutButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            authMiddleware.logout();
        });
    });
});
