/**
 * API Service for Laapak Reports
 * Handles all API calls to the backend
 */

class ApiService {
    constructor() {
        this.baseUrl = '/api'; // Base URL for API endpoints
        this.token = localStorage.getItem('auth_token');
    }

    /**
     * Set authentication token
     * @param {string} token - JWT token
     */
    setToken(token) {
        this.token = token;
        localStorage.setItem('auth_token', token);
    }

    /**
     * Clear authentication token
     */
    clearToken() {
        this.token = null;
        localStorage.removeItem('auth_token');
    }

    /**
     * Get request headers
     * @returns {Object} Headers object
     */
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        return headers;
    }

    /**
     * Make a GET request
     * @param {string} endpoint - API endpoint
     * @returns {Promise} Promise with response data
     */
    async get(endpoint) {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method: 'GET',
                headers: this.getHeaders()
            });

            return this.handleResponse(response);
        } catch (error) {
            console.error('API GET Error:', error);
            throw error;
        }
    }

    /**
     * Make a POST request
     * @param {string} endpoint - API endpoint
     * @param {Object} data - Request payload
     * @returns {Promise} Promise with response data
     */
    async post(endpoint, data) {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(data)
            });

            return this.handleResponse(response);
        } catch (error) {
            console.error('API POST Error:', error);
            throw error;
        }
    }

    /**
     * Make a PUT request
     * @param {string} endpoint - API endpoint
     * @param {Object} data - Request payload
     * @returns {Promise} Promise with response data
     */
    async put(endpoint, data) {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify(data)
            });

            return this.handleResponse(response);
        } catch (error) {
            console.error('API PUT Error:', error);
            throw error;
        }
    }

    /**
     * Make a DELETE request
     * @param {string} endpoint - API endpoint
     * @returns {Promise} Promise with response data
     */
    async delete(endpoint) {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method: 'DELETE',
                headers: this.getHeaders()
            });

            return this.handleResponse(response);
        } catch (error) {
            console.error('API DELETE Error:', error);
            throw error;
        }
    }

    /**
     * Handle API response
     * @param {Response} response - Fetch API response
     * @returns {Promise} Promise with response data
     */
    async handleResponse(response) {
        const data = await response.json();

        if (!response.ok) {
            const error = {
                status: response.status,
                message: data.message || 'Something went wrong',
                errors: data.errors || {}
            };
            
            throw error;
        }

        return data;
    }

    // Authentication endpoints
    
    /**
     * Client login
     * @param {string} phone - Client phone number
     * @param {string} orderCode - Client order code
     * @returns {Promise} Promise with login response
     */
    async clientLogin(phone, orderCode) {
        return this.post('/client/login', { phone, order_code: orderCode });
    }

    /**
     * Admin login
     * @param {string} email - Admin email
     * @param {string} password - Admin password
     * @returns {Promise} Promise with login response
     */
    async adminLogin(email, password) {
        return this.post('/admin/login', { email, password });
    }

    /**
     * Logout
     * @returns {Promise} Promise with logout response
     */
    async logout() {
        const response = await this.post('/logout', {});
        this.clearToken();
        return response;
    }

    // For testing purposes - simulate authentication
    async simulateLogin(userType, credentials) {
        // This is just for testing without a real backend
        console.log(`Simulating ${userType} login with:`, credentials);
        
        // Simulate successful login
        const token = `fake_token_${Date.now()}`;
        const user = {
            id: 1,
            name: userType === 'admin' ? 'Admin User' : 'Client User',
            email: userType === 'admin' ? credentials.email : null,
            phone: userType === 'client' ? credentials.phone : null
        };
        
        this.setToken(token);
        
        return {
            token,
            user,
            message: 'Login successful'
        };
    }
}

// Create a singleton instance
const apiService = new ApiService();
