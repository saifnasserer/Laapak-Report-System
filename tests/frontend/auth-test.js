/**
 * Laapak Report System - Authentication Test Script
 * This script helps test and debug the authentication system
 */

class AuthTest {
    constructor() {
        this.authMiddleware = typeof authMiddleware !== 'undefined' ? authMiddleware : null;
    }
    
    // Test authentication status
    testAuthStatus() {
        console.log('=== Authentication Status Test ===');
        
        if (!this.authMiddleware) {
            console.error('❌ AuthMiddleware not loaded');
            return false;
        }
        
        const adminLoggedIn = this.authMiddleware.isAdminLoggedIn();
        const clientLoggedIn = this.authMiddleware.isClientLoggedIn();
        
        console.log('Admin logged in:', adminLoggedIn);
        console.log('Client logged in:', clientLoggedIn);
        
        // Check stored tokens
        const adminToken = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
        const clientToken = localStorage.getItem('clientToken') || sessionStorage.getItem('clientToken');
        
        console.log('Admin token exists:', !!adminToken);
        console.log('Client token exists:', !!clientToken);
        
        // Check stored info
        const adminInfo = localStorage.getItem('adminInfo') || sessionStorage.getItem('adminInfo');
        const clientInfo = localStorage.getItem('clientInfo') || sessionStorage.getItem('clientInfo');
        
        console.log('Admin info exists:', !!adminInfo);
        console.log('Client info exists:', !!clientInfo);
        
        if (adminInfo) {
            try {
                const parsed = JSON.parse(adminInfo);
                console.log('Admin info:', parsed);
            } catch (e) {
                console.error('Error parsing admin info:', e);
            }
        }
        
        if (clientInfo) {
            try {
                const parsed = JSON.parse(clientInfo);
                console.log('Client info:', parsed);
            } catch (e) {
                console.error('Error parsing client info:', e);
            }
        }
        
        return adminLoggedIn || clientLoggedIn;
    }
    
    // Test token validation
    async testTokenValidation() {
        console.log('=== Token Validation Test ===');
        
        const adminToken = this.authMiddleware?.getAdminToken();
        const clientToken = this.authMiddleware?.getClientToken();
        
        if (!adminToken && !clientToken) {
            console.log('❌ No tokens found');
            return false;
        }
        
        const token = adminToken || clientToken;
        const apiBaseUrl = window.config ? window.config.api.baseUrl : window.location.origin;
        
        try {
            const response = await fetch(`${apiBaseUrl}/api/auth/me`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                }
            });
            
            if (response.ok) {
                const userData = await response.json();
                console.log('✅ Token validation successful');
                console.log('User data:', userData);
                return true;
            } else {
                console.log('❌ Token validation failed');
                console.log('Response status:', response.status);
                return false;
            }
        } catch (error) {
            console.error('❌ Token validation error:', error);
            return false;
        }
    }
    
    // Test logout functionality
    testLogout() {
        console.log('=== Logout Test ===');
        
        // Clear all sessions
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminInfo');
        localStorage.removeItem('clientToken');
        localStorage.removeItem('clientInfo');
        sessionStorage.removeItem('adminToken');
        sessionStorage.removeItem('adminInfo');
        sessionStorage.removeItem('clientToken');
        sessionStorage.removeItem('clientInfo');
        
        console.log('✅ All sessions cleared');
        
        // Verify logout
        const adminLoggedIn = this.authMiddleware?.isAdminLoggedIn();
        const clientLoggedIn = this.authMiddleware?.isClientLoggedIn();
        
        console.log('Admin logged in after logout:', adminLoggedIn);
        console.log('Client logged in after logout:', clientLoggedIn);
        
        if (!adminLoggedIn && !clientLoggedIn) {
            console.log('✅ Logout successful');
            return true;
        } else {
            console.log('❌ Logout failed');
            return false;
        }
    }
    
    // Run all tests
    async runAllTests() {
        console.log('🧪 Starting Authentication Tests...');
        
        const authStatus = this.testAuthStatus();
        const tokenValidation = await this.testTokenValidation();
        
        console.log('\n=== Test Results ===');
        console.log('Authentication Status:', authStatus ? '✅ PASS' : '❌ FAIL');
        console.log('Token Validation:', tokenValidation ? '✅ PASS' : '❌ FAIL');
        
        return authStatus && tokenValidation;
    }
}

// Make AuthTest available globally for testing
window.AuthTest = AuthTest;

// Auto-run tests if in development mode
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(() => {
            const authTest = new AuthTest();
            authTest.runAllTests();
        }, 1000);
    });
} 