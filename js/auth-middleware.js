/**
 * Laapak Report System - Authentication Middleware
 * Handles authentication state and token management for client pages
 */

// Authentication middleware for client and admin pages
class AuthMiddleware {
    constructor() {
        this.API_URL = window.location.origin;
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
        return !!this.getAdminToken();
    }

    // Check if client is logged in
    isClientLoggedIn() {
        return !!this.getClientToken();
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
        
        // Redirect to login page
        window.location.href = 'index.html';
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
