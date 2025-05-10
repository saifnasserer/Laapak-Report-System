/**
 * Laapak Report System - API Service
 * Handles all API calls to the backend server
 */

class ApiService {
    constructor() {
        // Set the backend API URL to match the test script
        this.baseUrl = 'http://localhost:3001';
        this.authToken = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
    }

    // Helper method to get auth headers
    getAuthHeaders() {
        return {
            'Content-Type': 'application/json',
            'x-auth-token': this.authToken
        };
    }

    // Update auth token
    setAuthToken(token) {
        this.authToken = token;
    }

    // Generic API request method
    async request(endpoint, method = 'GET', data = null) {
        const url = `${this.baseUrl}${endpoint}`;
        const options = {
            method,
            headers: this.getAuthHeaders()
        };

        if (data && (method === 'POST' || method === 'PUT')) {
            options.body = JSON.stringify(data);
        }

        console.log(`API Request: ${method} ${url}`);
        
        try {
            const response = await fetch(url, options);
            console.log(`API Response status: ${response.status}`);
            
            // Handle non-JSON responses
            let responseData;
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                responseData = await response.json();
            } else {
                const text = await response.text();
                console.log('Non-JSON response:', text);
                responseData = { message: text };
            }

            if (!response.ok) {
                throw new Error(responseData.message || `API request failed with status ${response.status}`);
            }

            return responseData;
        } catch (error) {
            console.error(`API Error (${endpoint}):`, error);
            throw error;
        }
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
