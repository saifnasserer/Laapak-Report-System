/**
 * Laapak Report System - Laravel API Service
 * Handles all API calls to the Laravel backend server
 */

class LaravelApiService {
    constructor() {
        // Set the Laravel backend API URL to match the Node.js API port
        this.baseUrl = 'http://localhost:3001/api';
        this.authToken = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
    }

    // Helper method to get auth headers
    getAuthHeaders() {
        return {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'x-auth-token': this.authToken
        };
    }

    // Update auth token
    setAuthToken(token) {
        this.authToken = token;
        if (token) {
            localStorage.setItem('adminToken', token);
            sessionStorage.setItem('adminToken', token);
        } else {
            localStorage.removeItem('adminToken');
            sessionStorage.removeItem('adminToken');
        }
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
    
    // Authentication methods
    async login(credentials) {
        const response = await this.request('/login', 'POST', credentials);
        if (response.token) {
            this.setAuthToken(response.token);
        }
        return response;
    }
    
    async logout() {
        try {
            await this.request('/logout', 'POST');
        } finally {
            this.setAuthToken(null);
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
        const response = await this.request(`/clients${queryParams}`);
        return response.data || [];
    }
    
    async getClient(clientId) {
        const response = await this.request(`/clients/${clientId}`);
        return response.data;
    }
    
    async createClient(clientData) {
        const response = await this.request('/clients', 'POST', clientData);
        return response.data;
    }
    
    async updateClient(clientId, clientData) {
        const response = await this.request(`/clients/${clientId}`, 'PUT', clientData);
        return response.data;
    }
    
    async deleteClient(clientId) {
        return this.request(`/clients/${clientId}`, 'DELETE');
    }

    // Report API Methods
    async getReports(filters = {}) {
        let queryParams = '';
        if (Object.keys(filters).length > 0) {
            queryParams = '?' + Object.entries(filters)
                .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
                .join('&');
        }
        const response = await this.request(`/reports${queryParams}`);
        return response.data || [];
    }
    
    async getReport(id) {
        const response = await this.request(`/reports/${id}`);
        return response.data;
    }
    
    async createReport(reportData) {
        const response = await this.request('/reports', 'POST', reportData);
        return response.data;
    }
    
    async updateReport(id, reportData) {
        const response = await this.request(`/reports/${id}`, 'PUT', reportData);
        return response.data;
    }
    
    async deleteReport(id) {
        return this.request(`/reports/${id}`, 'DELETE');
    }
    
    // Device API Methods
    async getDevices(filters = {}) {
        let queryParams = '';
        if (Object.keys(filters).length > 0) {
            queryParams = '?' + Object.entries(filters)
                .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
                .join('&');
        }
        const response = await this.request(`/devices${queryParams}`);
        return response.data || [];
    }
    
    async getDevice(id) {
        const response = await this.request(`/devices/${id}`);
        return response.data;
    }
    
    async createDevice(deviceData) {
        const response = await this.request('/devices', 'POST', deviceData);
        return response.data;
    }
    
    async updateDevice(id, deviceData) {
        const response = await this.request(`/devices/${id}`, 'PUT', deviceData);
        return response.data;
    }
    
    async deleteDevice(id) {
        return this.request(`/devices/${id}`, 'DELETE');
    }
    
    // Component Test API Methods
    async createComponentTest(testData) {
        const response = await this.request('/component-tests', 'POST', testData);
        return response.data;
    }
    
    async deleteComponentTest(id) {
        return this.request(`/component-tests/${id}`, 'DELETE');
    }
    
    // External Inspection API Methods
    async createExternalInspection(inspectionData) {
        const response = await this.request('/external-inspections', 'POST', inspectionData);
        return response.data;
    }
    
    async deleteExternalInspection(id) {
        return this.request(`/external-inspections/${id}`, 'DELETE');
    }
    
    // Report Notes API Methods
    async createReportNote(noteData) {
        const response = await this.request('/report-notes', 'POST', noteData);
        return response.data;
    }
    
    async deleteReportNote(id) {
        return this.request(`/report-notes/${id}`, 'DELETE');
    }
}

// Create a global instance
const laravelApiService = new LaravelApiService();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = laravelApiService;
}
