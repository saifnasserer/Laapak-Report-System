/**
 * Node.js compatible API Service for testing
 */

const fetch = require('node-fetch');

class ApiService {
    constructor() {
        // Set the backend API URL to match the test script
        this.baseUrl = 'http://localhost:3001';
        this.authToken = null; // No localStorage in Node.js
    }
    
    // Login to get auth token
    async login(email, password) {
        const url = `${this.baseUrl}/api/users/login`;
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        };
        
        console.log(`Login request to ${url}`);
        
        try {
            const response = await fetch(url, options);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }
            
            this.authToken = data.token;
            console.log('Login successful, token received');
            return data;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
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
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (data && (method === 'POST' || method === 'PUT')) {
            options.body = JSON.stringify(data);
            console.log(`Request data:`, data);
        }

        console.log(`API Request: ${method} ${url}`);
        
        try {
            // Add timeout to prevent hanging requests
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
            options.signal = controller.signal;
            
            const response = await fetch(url, options);
            clearTimeout(timeoutId);
            
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
            
            // Check if this is an AbortError (timeout)
            if (error.name === 'AbortError') {
                throw new Error('Connection to server timed out. Please check your network connection.');
            }
            
            // Check if this is a network error
            if (error.message === 'Failed to fetch' || error.message.includes('NetworkError')) {
                throw new Error('Failed to connect to server. Please check your network connection and server status.');
            }
            
            throw error;
        }
    }
    
    // Report API Methods
    async createReport(reportData) {
        console.log('Creating report with data:', reportData);
        try {
            const result = await this.request('/api/reports', 'POST', reportData);
            console.log('Report created successfully:', result);
            return result;
        } catch (error) {
            console.error('Error creating report:', error);
            throw error;
        }
    }
}

// Create a global instance
const apiService = new ApiService();

// Export for module usage
module.exports = apiService;
