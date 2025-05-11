/**
 * Laapak Report System - Authentication Proxy
 * MODIFIED: Authentication bypass version - automatically provides successful login
 */

class AuthProxy {
    constructor() {
        this.baseUrl = 'http://localhost:8000';
        console.log('Auth Proxy initialized with authentication bypass');
        
        // Set default tokens in localStorage for automatic access
        this.setupDefaultAuth();
    }
    
    /**
     * Setup default authentication tokens and user info
     */
    setupDefaultAuth() {
        // Create a default admin token and info
        const adminToken = 'bypass-admin-token-' + Date.now();
        const adminInfo = {
            userId: 1,
            username: 'admin',
            name: 'System Administrator',
            role: 'admin',
            isLoggedIn: true,
            loginTime: new Date().getTime()
        };
        
        // Create a default client token and info
        const clientToken = 'bypass-client-token-' + Date.now();
        const clientInfo = {
            clientId: 1,
            name: 'Default Client',
            phone: '01012345678',
            email: 'client@example.com',
            isLoggedIn: true,
            loginTime: new Date().getTime()
        };
        
        // Store tokens and info in both localStorage and sessionStorage
        localStorage.setItem('adminToken', adminToken);
        localStorage.setItem('adminInfo', JSON.stringify(adminInfo));
        localStorage.setItem('clientToken', clientToken);
        localStorage.setItem('clientInfo', JSON.stringify(clientInfo));
        
        sessionStorage.setItem('adminToken', adminToken);
        sessionStorage.setItem('adminInfo', JSON.stringify(adminInfo));
        sessionStorage.setItem('clientToken', clientToken);
        sessionStorage.setItem('clientInfo', JSON.stringify(clientInfo));
        
        console.log('Default authentication tokens and user info set up');
    }

    /**
     * Direct admin login - bypassed to always succeed
     */
    adminLogin(username, password) {
        return new Promise((resolve) => {
            console.log('Admin login bypassed - auto success');
            
            // Create a mock successful response
            const mockResponse = {
                success: true,
                token: 'bypass-admin-token-' + Date.now(),
                user: {
                    id: 1,
                    username: username || 'admin',
                    name: 'System Administrator',
                    role: 'admin'
                },
                message: 'Login successful (bypassed)'
            };
            
            // Store the token and user info
            localStorage.setItem('adminToken', mockResponse.token);
            localStorage.setItem('adminInfo', JSON.stringify({
                userId: mockResponse.user.id,
                username: mockResponse.user.username,
                name: mockResponse.user.name,
                role: mockResponse.user.role,
                isLoggedIn: true,
                loginTime: new Date().getTime()
            }));
            
            // Resolve with the mock response after a short delay to simulate API call
            setTimeout(() => resolve(mockResponse), 300);
        });
    }

    /**
     * Direct client login - bypassed to always succeed
     */
    clientLogin(phone, orderCode) {
        return new Promise((resolve) => {
            console.log('Client login bypassed - auto success');
            
            // Create a mock successful response
            const mockResponse = {
                success: true,
                token: 'bypass-client-token-' + Date.now(),
                client: {
                    id: 1,
                    name: 'Default Client',
                    phone: phone || '01012345678',
                    email: 'client@example.com'
                },
                message: 'Login successful (bypassed)'
            };
            
            // Store the token and client info
            localStorage.setItem('clientToken', mockResponse.token);
            localStorage.setItem('clientInfo', JSON.stringify({
                clientId: mockResponse.client.id,
                name: mockResponse.client.name,
                phone: mockResponse.client.phone,
                email: mockResponse.client.email,
                isLoggedIn: true,
                loginTime: new Date().getTime()
            }));
            
            // Resolve with the mock response after a short delay to simulate API call
            setTimeout(() => resolve(mockResponse), 300);
        });
    }
}

// Create a global instance
const authProxy = new AuthProxy();

// For module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = authProxy;
}
