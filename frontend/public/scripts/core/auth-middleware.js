/**
 * Laapak Report System - Authentication Middleware
 * Handles authentication state and token management for client pages
 */

// Authentication middleware for client and admin pages
class AuthMiddleware {
    constructor() {
        this.API_URL = window.config ? window.config.api.baseUrl : window.location.origin;
        this.ME_URL = `${this.API_URL}/api/auth/me`;
    }

    // Get admin token from storage
    getAdminToken() {
        return localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
    }

    // Get client token from storage
    getClientToken() {
        return localStorage.getItem('clientToken') || sessionStorage.getItem('clientToken');
    }

    // Check if admin is logged in
    isAdminLoggedIn() {
        const token = this.getAdminToken();
        if (!token) {
            console.log('🔍 No admin token found');
            return false;
        }
        
        // Basic token validation (check if it's not empty and has reasonable length)
        if (token.length < 10) {
            console.log('🔍 Admin token too short, clearing invalid token');
            this.clearAdminTokens();
            return false;
        }
        
        console.log('🔍 Admin token found and valid');
        return true;
    }

    // Check if client is logged in
    isClientLoggedIn() {
        const token = this.getClientToken();
        if (!token) {
            console.log('🔍 No client token found');
            return false;
        }
        
        // Basic token validation (check if it's not empty and has reasonable length)
        if (token.length < 10) {
            console.log('🔍 Client token too short, clearing invalid token');
            this.clearClientTokens();
            return false;
        }
        
        console.log('🔍 Client token found and valid');
        return true;
    }
    
    // Clear admin tokens
    clearAdminTokens() {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminInfo');
        sessionStorage.removeItem('adminToken');
        sessionStorage.removeItem('adminInfo');
    }
    
    // Clear client tokens
    clearClientTokens() {
        localStorage.removeItem('clientToken');
        localStorage.removeItem('clientInfo');
        sessionStorage.removeItem('clientToken');
        sessionStorage.removeItem('clientInfo');
    }

    // Get current user info
    async getCurrentUser() {
        const token = this.getAdminToken() || this.getClientToken();
        
        if (!token) {
            return null;
        }
        
        try {
            const response = await fetch(this.ME_URL, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to get user information');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error getting current user:', error);
            return null;
        }
    }

    // Logout user
    logout() {
        console.log('Logging out user...');
        
        try {
            // Determine if we're logging out an admin or client
            const isAdmin = this.isAdminLoggedIn();
            const isClient = this.isClientLoggedIn();
            
            console.log('User type:', isAdmin ? 'Admin' : (isClient ? 'Client' : 'Unknown'));
            
            // Clear admin data
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminInfo');
            sessionStorage.removeItem('adminToken');
            sessionStorage.removeItem('adminInfo');
            
            // Clear client data
            localStorage.removeItem('clientToken');
            localStorage.removeItem('clientInfo');
            sessionStorage.removeItem('clientToken');
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

    // Validate token with server
    async validateToken(token, userType = 'admin') {
        if (!token) {
            return false;
        }
        
        try {
            const response = await fetch(this.ME_URL, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                }
            });
            
            if (response.ok) {
                console.log(`✅ ${userType} token validated successfully`);
                return true;
            } else {
                console.log(`❌ ${userType} token validation failed:`, response.status);
                return false;
            }
        } catch (error) {
            console.error(`❌ Error validating ${userType} token:`, error);
            return false;
        }
    }

    // Check if admin is logged in with server validation
    async isAdminLoggedInWithValidation() {
        const token = this.getAdminToken();
        if (!token) {
            return false;
        }
        
        // Basic token validation
        if (token.length < 10) {
            this.clearAdminTokens();
            return false;
        }
        
        // Validate with server
        const isValid = await this.validateToken(token, 'admin');
        if (!isValid) {
            this.clearAdminTokens();
        }
        
        return isValid;
    }

    // Check if client is logged in with server validation
    async isClientLoggedInWithValidation() {
        const token = this.getClientToken();
        if (!token) {
            return false;
        }
        
        // Basic token validation
        if (token.length < 10) {
            this.clearClientTokens();
            return false;
        }
        
        // Validate with server
        const isValid = await this.validateToken(token, 'client');
        if (!isValid) {
            this.clearClientTokens();
        }
        
        return isValid;
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
