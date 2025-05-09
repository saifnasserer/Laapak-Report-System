/**
 * Laapak Report System - API Service
 * Handles all API calls to the backend server
 */

class ApiService {
    constructor() {
        this.baseUrl = window.location.origin;
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

        try {
            const response = await fetch(url, options);
            const responseData = await response.json();

            if (!response.ok) {
                throw new Error(responseData.message || 'API request failed');
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
}

// Create a global instance
const apiService = new ApiService();
