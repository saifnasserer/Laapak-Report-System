/**
 * Laapak Report System - API Service
 * Handles all API calls to the backend server
 */

class ApiService {
    constructor(baseUrl = '') {
        // Use port 3000 for the API server
        this.baseUrl = baseUrl || 'http://localhost:3000';
        this.authToken = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
    }
    
    /**
     * Helper method to format a value as a JSON string
     * @param {*} value - The value to format as JSON
     * @returns {string} - A properly formatted JSON string
     */
    _formatJsonField(value) {
        try {
            // If it's already a string, check if it's valid JSON
            if (typeof value === 'string') {
                // Try to parse and re-stringify to ensure valid JSON format
                const parsed = JSON.parse(value);
                return JSON.stringify(parsed);
            } else {
                // If it's an object/array, stringify it
                return JSON.stringify(value);
            }
        } catch (e) {
            console.error('Error formatting JSON field:', e);
            // Return empty array as fallback
            return '[]';
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
            headers: this.getAuthHeaders()
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
                // Enhanced error message for database issues
                if (response.status === 500) {
                    if (method === 'POST' && endpoint === '/api/reports') {
                        throw new Error('فشل في حفظ التقرير في قاعدة البيانات. يرجى التأكد من اتصال قاعدة البيانات.');
                    } else {
                        throw new Error(responseData.message || 'خطأ في الخادم. يرجى التأكد من اتصال قاعدة البيانات.');
                    }
                } else {
                    throw new Error(responseData.message || `فشل طلب API بحالة ${response.status}`);
                }
            }

            return responseData;
        } catch (error) {
            console.error(`API Error (${endpoint}):`, error);
            
            // Check if this is an AbortError (timeout)
            if (error.name === 'AbortError') {
                throw new Error('طلب API انتهت مهلته. يرجى المحاولة مرة أخرى.');
            }
            
            // Network error (server not running or connection issues)
            if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
                throw new Error('فشل الاتصال بالخادم. يرجى التحقق من اتصال الشبكة وتشغيل الخادم.');
            }
            
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
        console.log('Creating report with data:', reportData);
        try {
            // Parse client_id to ensure it's a valid number
            let clientId;
            try {
                clientId = parseInt(reportData.client_id || reportData.clientId || '0', 10);
                if (isNaN(clientId) || clientId <= 0) {
                    throw new Error('Client ID must be a valid positive number');
                }
            } catch (e) {
                console.error('Error parsing client_id:', e);
                throw new Error('Client ID must be a valid number');
            }
            
            // Format hardware_status as a JSON string if it's not already
            let hardwareStatus;
            try {
                if (typeof reportData.hardware_status === 'string') {
                    // Keep it as is if it's already a string
                    hardwareStatus = reportData.hardware_status;
                } else if (Array.isArray(reportData.hardware_status)) {
                    hardwareStatus = JSON.stringify(reportData.hardware_status);
                } else if (reportData.hardwareStatus) {
                    if (typeof reportData.hardwareStatus === 'string') {
                        hardwareStatus = reportData.hardwareStatus;
                    } else {
                        hardwareStatus = JSON.stringify(reportData.hardwareStatus);
                    }
                } else {
                    hardwareStatus = '[]';
                }
            } catch (e) {
                console.error('Error formatting hardware_status:', e);
                hardwareStatus = '[]';
            }
            
            // Format external_images as a JSON string if it's not already
            let externalImages = null;
            try {
                if (typeof reportData.external_images === 'string' && reportData.external_images) {
                    externalImages = reportData.external_images;
                } else if (Array.isArray(reportData.external_images)) {
                    externalImages = JSON.stringify(reportData.external_images);
                } else if (reportData.externalImages) {
                    if (typeof reportData.externalImages === 'string' && reportData.externalImages) {
                        externalImages = reportData.externalImages;
                    } else {
                        externalImages = JSON.stringify(reportData.externalImages);
                    }
                }
            } catch (e) {
                console.error('Error formatting external_images:', e);
                externalImages = null;
            }
            
            // Generate a report ID if not provided
            const reportId = reportData.id || ('RPT' + Date.now() + Math.floor(Math.random() * 1000));
            
            // Generate a title for the report if not provided
            const title = reportData.title || 
                          `Report for ${reportData.device_model || reportData.deviceModel || ''} - ${reportData.client_name || reportData.clientName || 'Client'}`;
            
            // Create a report object that includes both the fields expected by the route handler
            // and the fields that match the database schema
            const reportObject = {
                // Fields required by the route handler
                clientId: clientId,
                title: title,
                description: reportData.notes || '',
                
                // Database schema fields
                id: reportId,
                client_id: clientId,
                client_name: reportData.client_name || reportData.clientName || '',
                client_phone: reportData.client_phone || reportData.clientPhone || '',
                client_email: (reportData.client_email || reportData.clientEmail || '').trim() === '' ? null : (reportData.client_email || reportData.clientEmail),
                client_address: reportData.client_address || reportData.clientAddress || '',
                order_number: reportData.order_number || reportData.orderNumber || '',
                device_model: reportData.device_model || reportData.deviceModel || '',
                serial_number: reportData.serial_number || reportData.serialNumber || '',
                inspection_date: reportData.inspection_date instanceof Date ? 
                    reportData.inspection_date.toISOString() : 
                    new Date(reportData.inspection_date || reportData.inspectionDate || Date.now()).toISOString(),
                hardware_status: hardwareStatus,
                external_images: externalImages,
                notes: reportData.notes || '',
                billing_enabled: Boolean(reportData.billing_enabled ?? reportData.billingEnabled ?? false),
                amount: Number(reportData.amount || 0),
                status: reportData.status || 'active'
            };
            
            // Make a direct fetch request
            const url = `${this.baseUrl}/api/reports`;
            const options = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(reportObject)
            };
            
            console.log(`Direct API Request: POST ${url}`);
            console.log('Report data being sent:', reportObject);
            
            const response = await fetch(url, options);
            console.log(`API Response status: ${response.status}`);
            
            // Handle the response
            if (!response.ok) {
                let errorMessage = `API request failed with status ${response.status}`;
                try {
                    const errorData = await response.json();
                    console.error('Server error details:', errorData);
                    if (errorData.details) {
                        errorMessage = `${errorData.error || 'Error'}: ${errorData.details}`;
                    } else {
                        errorMessage = errorData.message || errorData.error || errorMessage;
                    }
                } catch (e) {
                    console.error('Failed to parse error response:', e);
                }
                throw new Error(errorMessage);
            }
            
            const result = await response.json();
            console.log('Report created successfully:', result);
            return result;
        } catch (error) {
            console.error('Error creating report:', error);
            // Provide a more user-friendly error message
            if (error.message.includes('database')) {
                throw new Error('Failed to save report to database. Please check database connection.');
            }
            throw error;
        }
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
        console.log('Creating invoice with data:', invoiceData);
        try {
            // Make sure we're using the correct field names that match the database
            const formattedData = {
                invoice_number: invoiceData.invoice_number || ('INV' + Date.now() + Math.floor(Math.random() * 1000)),
                report_id: invoiceData.report_id || invoiceData.reportId || null,
                client_id: Number(invoiceData.client_id || invoiceData.clientId || 0),
                client_name: invoiceData.client_name || invoiceData.clientName || '',
                client_phone: invoiceData.client_phone || invoiceData.clientPhone || '',
                client_email: (invoiceData.client_email || invoiceData.clientEmail || '').trim() === '' ? null : (invoiceData.client_email || invoiceData.clientEmail),
                client_address: invoiceData.client_address || invoiceData.clientAddress || '',
                subtotal: Number(invoiceData.subtotal || 0),
                tax: Number(invoiceData.tax || 0),
                discount: Number(invoiceData.discount || 0),
                total: Number(invoiceData.total || 0),
                notes: invoiceData.notes || '',
                status: invoiceData.status || 'pending',
                items: Array.isArray(invoiceData.items) ? invoiceData.items.map(item => ({
                    description: item.description || '',
                    quantity: Number(item.quantity || 1),
                    unit_price: Number(item.unit_price || 0),
                    total: Number(item.total || 0)
                })) : []
            };
            
            // Validate client_id is a number and greater than 0
            if (isNaN(formattedData.client_id) || formattedData.client_id <= 0) {
                throw new Error('Client ID must be a valid number');
            }
            
            // Validate items array
            if (!formattedData.items || formattedData.items.length === 0) {
                throw new Error('Invoice must have at least one item');
            }
            
            console.log('Creating invoice with formatted data:', formattedData);
            return this.request('/api/invoices', 'POST', formattedData);
        } catch (error) {
            console.error('Error formatting invoice data:', error);
            throw error;
        }
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
