/**
 * Laapak Report System - API Service
 * Handles all API calls to the backend server
 */

class ApiService {
    constructor() {
        // Set the backend API URL to our Laravel backend
        this.baseUrl = 'http://localhost:8000';
        console.log('API Service initialized with authentication bypass');
        
        // Create a default token for all API requests
        this.authToken = 'bypass-api-token-' + Date.now();
        
        // Set up default authentication tokens and info
        this.setupDefaultAuth();
        
        console.log('API Service initialized with auth bypass');
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

    // Helper method to get auth headers - always includes a token
    getAuthHeaders() {
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${this.authToken || 'bypass-token'}`
        };
        
        return headers;
    }

    // Update auth token
    setAuthToken(token) {
        this.authToken = token;
    }

    // Generic API request method - bypassed to return mock data
    async request(endpoint, method = 'GET', data = null) {
        const url = `${this.baseUrl}${endpoint}`;
        console.log(`API Request (BYPASSED): ${method} ${url}`);
        
        // Short delay to simulate network request
        await new Promise(resolve => setTimeout(resolve, 200));
        
        try {
            // Generate mock response based on endpoint and method
            const mockResponse = this.generateMockResponse(endpoint, method, data);
            console.log(`Mock API Response for ${endpoint}:`, mockResponse);
            return mockResponse;
        } catch (error) {
            console.error(`Mock API Error (${endpoint}):`, error);
            throw error;
        }
    }
    
    // Generate mock responses based on endpoint
    generateMockResponse(endpoint, method, data) {
        // Default success response
        const defaultResponse = {
            success: true,
            message: 'Operation completed successfully (bypassed)'
        };
        
        // Handle different endpoints
        if (endpoint.includes('/api/auth/')) {
            return {
                success: true,
                token: 'bypass-token-' + Date.now(),
                user: {
                    id: 1,
                    username: 'admin',
                    name: 'System Administrator',
                    role: 'admin'
                },
                message: 'Authentication successful (bypassed)'
            };
        } else if (endpoint.includes('/api/reports')) {
            if (method === 'GET') {
                // Return a list of mock reports
                return {
                    success: true,
                    data: [
                        {
                            id: 1,
                            order_number: 'LPK001',
                            client_name: 'Ahmed Mohamed',
                            device_model: 'MacBook Pro 2019',
                            created_at: '2025-05-01',
                            status: 'completed'
                        },
                        {
                            id: 2,
                            order_number: 'LPK002',
                            client_name: 'Sara Ahmed',
                            device_model: 'Dell XPS 15',
                            created_at: '2025-05-05',
                            status: 'in_progress'
                        },
                        {
                            id: 3,
                            order_number: 'LPK003',
                            client_name: 'Mohamed Ali',
                            device_model: 'HP Spectre',
                            created_at: '2025-05-08',
                            status: 'completed'
                        }
                    ],
                    message: 'Reports retrieved successfully (bypassed)'
                };
            } else if (method === 'POST') {
                // Return a success response for creating a report
                return {
                    success: true,
                    data: {
                        id: Math.floor(Math.random() * 1000) + 10,
                        ...data,
                        created_at: new Date().toISOString().split('T')[0],
                        status: 'completed'
                    },
                    message: 'Report created successfully (bypassed)'
                };
            }
        } else if (endpoint.includes('/api/clients')) {
            if (method === 'GET') {
                // Return a list of mock clients
                return {
                    success: true,
                    data: [
                        {
                            id: 1,
                            name: 'Ahmed Mohamed',
                            phone: '01012345678',
                            email: 'ahmed@example.com'
                        },
                        {
                            id: 2,
                            name: 'Sara Ahmed',
                            phone: '01023456789',
                            email: 'sara@example.com'
                        },
                        {
                            id: 3,
                            name: 'Mohamed Ali',
                            phone: '01034567890',
                            email: 'mohamed@example.com'
                        }
                    ],
                    message: 'Clients retrieved successfully (bypassed)'
                };
            }
        } else if (endpoint.includes('/api/invoices')) {
            if (method === 'GET') {
                // Return a list of mock invoices
                return {
                    success: true,
                    data: [
                        {
                            id: 1,
                            order_number: 'LPK001',
                            client_name: 'Ahmed Mohamed',
                            amount: 1500,
                            status: 'paid',
                            created_at: '2025-05-01'
                        },
                        {
                            id: 2,
                            order_number: 'LPK002',
                            client_name: 'Sara Ahmed',
                            amount: 2000,
                            status: 'pending',
                            created_at: '2025-05-05'
                        }
                    ],
                    message: 'Invoices retrieved successfully (bypassed)'
                };
            }
        }
        
        // Return default response for any other endpoint
        return defaultResponse;
    }
    
    // Client management methods
    async getClients(filters = {}) {
        let queryParams = '';
        if (Object.keys(filters).length > 0) {
            queryParams = '?' + Object.entries(filters)
                .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
                .join('&');
        }
        return this.request(`/api/clients${queryParams}`);
    }
    
    async getClient(clientId) {
        return this.request(`/api/clients/${clientId}`);
    }
    
    async createClient(clientData) {
        return this.request('/api/clients', 'POST', clientData);
    }
    
    async updateClient(clientId, clientData) {
        return this.request(`/api/clients/${clientId}`, 'PUT', clientData);
    }
    
    async deleteClient(clientId) {
        return this.request(`/api/clients/${clientId}`, 'DELETE');
    }

    // User Management API Methods
    async getAdmins() {
        return this.request('/api/users/admins');
    }

    async getAdmin(id) {
        return this.request(`/api/users/admins/${id}`);
    }

    async createAdmin(adminData) {
        return this.request('/api/users/admins', 'POST', adminData);
    }

    async updateAdmin(id, adminData) {
        return this.request(`/api/users/admins/${id}`, 'PUT', adminData);
    }

    async deleteAdmin(id) {
        return this.request(`/api/users/admins/${id}`, 'DELETE');
    }

    async changePassword(data) {
        return this.request('/api/users/change-password', 'POST', data);
    }

    // Client Management API Methods
    async getClients() {
        return this.request('/api/users/clients');
    }

    async getClient(id) {
        return this.request(`/api/users/clients/${id}`);
    }

    async createClient(clientData) {
        return this.request('/api/users/clients', 'POST', clientData);
    }

    async updateClient(id, clientData) {
        return this.request(`/api/users/clients/${id}`, 'PUT', clientData);
    }

    async deleteClient(id) {
        return this.request(`/api/users/clients/${id}`, 'DELETE');
    }

    // Authentication methods - bypassed to always succeed
    async adminLogin(username, password) {
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
            
            // Update the service token
            this.authToken = mockResponse.token;
            
            // Resolve with the mock response after a short delay to simulate API call
            setTimeout(() => resolve(mockResponse), 300);
        });
    }
    
    async clientLogin(phone, orderCode) {
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
            
            // Update the service token
            this.authToken = mockResponse.token;
            
            // Resolve with the mock response after a short delay to simulate API call
            setTimeout(() => resolve(mockResponse), 300);
        });
    }
    
    async verifyToken() {
        return this.request('/api/auth/verify');
    }
    
    async refreshToken() {
        return this.request('/api/auth/refresh', 'POST');
    }
    
    async logout() {
        return this.request('/api/auth/logout', 'POST');
    }
    
    // Check if user is authenticated - always returns true
    isAuthenticated() {
        return true;
    }
    
    // Get user type (admin or client)
    getUserType() {
        return this.userType;
    }
    
    // Clear authentication data - does nothing in bypass mode
    clearAuth() {
        console.log('Auth clear bypassed - maintaining authentication');
        // Create a new token instead of clearing
        this.authToken = 'bypass-token-' + Date.now();
        // Re-setup default auth
        this.setupDefaultAuth();
    }
    
    // Health check
    async healthCheck() {
        return this.request('/api/health');
    }
    
    // Report API Methods
    async getReports(filters = {}) {
        let queryParams = '';
        if (Object.keys(filters).length > 0) {
            queryParams = '?' + Object.entries(filters)
                .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
                .join('&');
        }
        // Make sure the endpoint matches the backend API structure
        return this.request(`/api/reports${queryParams}`);
    }
    
    async getReport(id) {
        return this.request(`/api/reports/${id}`);
    }
    
    async createReport(reportData) {
        return this.request('/api/reports', 'POST', reportData);
    }
    
    async updateReport(id, reportData) {
        return this.request(`/api/reports/${id}`, 'PUT', reportData);
    }
    
    async deleteReport(id) {
        return this.request(`/api/reports/${id}`, 'DELETE');
    }
    
    // Invoice API Methods
    async getInvoices(filters = {}) {
        let queryParams = '';
        if (Object.keys(filters).length > 0) {
            queryParams = '?' + Object.entries(filters)
                .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
                .join('&');
        }
        return this.request(`/api/invoices${queryParams}`);
    }
    
    async getInvoice(id) {
        return this.request(`/api/invoices/${id}`);
    }
    
    async createInvoice(invoiceData) {
        return this.request('/api/invoices', 'POST', invoiceData);
    }
    
    async updateInvoicePayment(id, paymentData) {
        return this.request(`/api/invoices/${id}/payment`, 'PUT', paymentData);
    }
    
    async deleteInvoice(id) {
        return this.request(`/api/invoices/${id}`, 'DELETE');
    }
    
    async getClientReports() {
        return this.request('/api/reports/client');
    }
    
    async searchReports(query) {
        return this.request(`/api/reports/search/${query}`);
    }
}

// Create a global instance
const apiService = new ApiService();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = apiService;
}
