/**
 * Laapak Report System - API Service
 * Handles all API calls to the backend server
 */

class ApiService {
    constructor(baseUrl = '') {
        // Try to determine the best API server URL
        // First check if we're running on a deployed server or localhost
        const currentHost = window.location.hostname;
        const isLocalhost = currentHost === 'localhost' || currentHost === '127.0.0.1';
        
        // If explicitly provided, use that
        if (baseUrl) {
            this.baseUrl = baseUrl;
        } 
        // For localhost development, use port 3001
        else if (isLocalhost) {
            // Safely access config with fallback
            this.baseUrl = (window.config && window.config.api && window.config.api.baseUrl) || 
                          (typeof config !== 'undefined' && config.api && config.api.baseUrl) || 
                          'https://reports.laapak.com';
        } 
        // For production, use the same origin but with /api
        else {
            this.baseUrl = window.config ? window.config.api.baseUrl : window.location.origin;
        }
        
        console.log('API Service initialized with baseUrl:', this.baseUrl);
        // Prioritize clientToken if available, otherwise fallback to adminToken
        this.authToken = localStorage.getItem('clientToken') || 
                         sessionStorage.getItem('clientToken') || 
                         localStorage.getItem('adminToken') || 
                         sessionStorage.getItem('adminToken');
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
    async request(endpoint, method = 'GET', data = null, customHeaders = null) {
        const url = `${this.baseUrl}${endpoint}`;
        const options = {
            method,
            headers: {
                ...this.getAuthHeaders(),
                // Add any custom headers passed to the method
                ...(customHeaders || {})
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
            
            // Enhanced error handling with specific messages
            if (error.name === 'AbortError') {
                throw new Error('طلب API انتهت مهلته. يرجى المحاولة مرة أخرى.');
            } else if (error.name === 'TypeError' && error.message.includes('NetworkError')) {
                throw new Error('لا يمكن الاتصال بالخادم. يرجى التأكد من تشغيل خادم Node.js على المنفذ 3000.');
            } else if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
                throw new Error('فشل الاتصال بالخادم. يرجى التأكد من تشغيل خادم API.');
            } else if (error.message && error.message.includes('database')) {
                throw new Error('مشكلة في قاعدة البيانات. يرجى التأكد من تشغيل خدمة MySQL وتكوين قاعدة البيانات بشكل صحيح.');
            }
            
            throw error;
        }
    }
    
    // Invoice methods
    async getInvoice(invoiceId, token = null) {
        // Allow passing a specific token, otherwise use the default
        const customHeaders = token ? { 'Authorization': `Bearer ${token}` } : null;
        
        try {
            // First try to get the invoice directly
            return await this.request(`/api/invoices/${invoiceId}`, 'GET', null, customHeaders);
        } catch (error) {
            // If direct access fails, try the client-accessible endpoint
            try {
                console.log('Trying client-accessible invoice endpoint...');
                return await this.request(`/api/client/invoices/${invoiceId}`, 'GET', null, customHeaders);
            } catch (secondError) {
                console.error('Both invoice endpoints failed:', secondError);
                throw secondError;
            }
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
    
    async getClient(client_id) {
        return this.request(`/api/clients/${client_id}`);
    }
    
    async updateClient(client_id, clientData) {
        return this.request(`/api/clients/${client_id}`, 'PUT', clientData);
    }
    
    async deleteClient(client_id) {
        return this.request(`/api/clients/${client_id}`, 'DELETE');
    }

    // Invoice Management API Methods
    async saveInvoice(invoiceData) {
        console.log('ApiService: Attempting to save invoice with payload:', invoiceData);
        return this.request('/api/invoices', 'POST', invoiceData);
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
        // Build query string from filters
        const queryParams = new URLSearchParams();
        for (const key in filters) {
            if (filters.hasOwnProperty(key) && filters[key] !== undefined && filters[key] !== null) {
                queryParams.append(key, filters[key]);
            }
        }
        const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
        
        try {
            console.log('Fetching reports with filters:', filters);
            const response = await this.request(`/api/reports${queryString}`);
            
            // Log the response for debugging
            console.log('Reports API response:', response);
            
            // Handle different response formats
            if (Array.isArray(response)) {
                return response;
            } else if (response && typeof response === 'object') {
                // If response is an object with data property
                if (response.data && Array.isArray(response.data)) {
                    return response.data;
                }
                // If response is an object with reports property
                else if (response.reports && Array.isArray(response.reports)) {
                    return response.reports;
                }
                // If response is just an object, return it in an array
                else {
                    return [response];
                }
            }
            
            // Default to empty array if response format is unexpected
            console.warn('Unexpected reports response format:', response);
            return [];
        } catch (error) {
            console.error('Error in getReports:', error);
            throw error;
        }
    }
    
    async getReport(id) {
        return this.request(`/api/reports/${id}`);
    }

    /**
     * Enhanced getReport method with optional related data
     * @param {string} id - Report ID
     * @param {boolean} includeRelated - Whether to include related data (client, invoice)
     * @returns {Promise<Object>} Report data
     */
    async getReportEnhanced(id, includeRelated = true) {
        try {
            console.log(`Getting enhanced report data for ID: ${id}`);
            
            // Get basic report data
            const report = await this.getReport(id);
            
            if (includeRelated) {
                // Get client data if client_id exists
                if (report.client_id) {
                    try {
                        const client = await this.getClient(report.client_id);
                        report.client = client;
                    } catch (error) {
                        console.warn('Could not fetch client data:', error);
                    }
                }
                
                // Get invoice data if billing is enabled
                if (report.billing_enabled) {
                    try {
                        const invoices = await this.getInvoices({ report_id: id });
                        report.invoices = invoices;
                    } catch (error) {
                        console.warn('Could not fetch invoice data:', error);
                    }
                }
            }
            
            return report;
        } catch (error) {
            console.error('Error getting enhanced report:', error);
            throw error;
        }
    }

    /**
     * Unified saveReport method for both create and edit operations
     * @param {Object} reportData - Report data
     * @param {string} mode - 'create' or 'edit'
     * @returns {Promise<Object>} Saved report
     */
    async saveReport(reportData, mode = 'create') {
        try {
            console.log(`Saving report in ${mode} mode:`, reportData);
            
            // Validate report data
            const validationResult = await this.validateReport(reportData);
            if (!validationResult.valid) {
                throw new Error(`Report validation failed: ${validationResult.errors.join(', ')}`);
            }
            
            // Prepare data for API
            const apiData = this.prepareReportDataForAPI(reportData, mode);
            
            if (mode === 'create') {
                return await this.createNewReport(apiData);
            } else {
                return await this.updateReport(reportData.reportId, apiData);
            }
        } catch (error) {
            console.error(`Error saving report in ${mode} mode:`, error);
            throw error;
        }
    }

    /**
     * Validate report data before saving
     * @param {Object} reportData - Report data to validate
     * @returns {Promise<Object>} Validation result
     */
    async validateReport(reportData) {
        const errors = [];
        
        // Basic validation
        if (!reportData.client_id) {
            errors.push('Client is required');
        }
        
        if (!reportData.device_model) {
            errors.push('Device model is required');
        }
        
        if (!reportData.order_number) {
            errors.push('Order number is required');
        }
        
        if (!reportData.inspection_date) {
            errors.push('Inspection date is required');
        }
        
        // Technical tests validation
        if (reportData.hardware_status) {
            try {
                const hardwareStatus = typeof reportData.hardware_status === 'string' 
                    ? JSON.parse(reportData.hardware_status) 
                    : reportData.hardware_status;
                
                if (!Array.isArray(hardwareStatus)) {
                    errors.push('Hardware status must be an array');
                }
            } catch (error) {
                errors.push('Invalid hardware status format');
            }
        }
        
        // External images validation
        if (reportData.external_images) {
            try {
                const externalImages = typeof reportData.external_images === 'string' 
                    ? JSON.parse(reportData.external_images) 
                    : reportData.external_images;
                
                if (!Array.isArray(externalImages)) {
                    errors.push('External images must be an array');
                }
            } catch (error) {
                errors.push('Invalid external images format');
            }
        }
        
        return {
            valid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Prepare report data for API submission
     * @param {Object} reportData - Raw report data
     * @param {string} mode - 'create' or 'edit'
     * @returns {Object} Prepared API data
     */
    prepareReportDataForAPI(reportData, mode) {
        // Generate report ID for create mode
        if (mode === 'create' && !reportData.id) {
            reportData.id = 'RPT' + Date.now() + Math.floor(Math.random() * 1000);
        }
        
        // Generate title if not provided
        if (!reportData.title) {
            reportData.title = `Report for ${reportData.device_model || reportData.deviceModel || ''} - ${reportData.client_name || reportData.clientName || 'Client'}`;
        }
        
        // Prepare the API object
        const apiData = {
            // Fields required by the route handler
            clientId: reportData.client_id || reportData.clientId,
            title: reportData.title,
            description: reportData.notes || '',
            
            // Database schema fields
            id: reportData.id,
            client_id: reportData.client_id || reportData.clientId,
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
            hardware_status: reportData.hardware_status || '[]',
            external_images: reportData.external_images || '[]',
            notes: reportData.notes || '',
            billing_enabled: Boolean(reportData.billing_enabled ?? reportData.billingEnabled ?? false),
            amount: Number(reportData.amount || reportData.devicePrice || window.globalDeviceDetails?.devicePrice || 0),
            status: reportData.status || 'active'
        };
        
        // Ensure JSON fields are properly stringified
        if (typeof apiData.hardware_status === 'object') {
            apiData.hardware_status = JSON.stringify(apiData.hardware_status);
        }
        
        if (typeof apiData.external_images === 'object') {
            apiData.external_images = JSON.stringify(apiData.external_images);
        }
        
        return apiData;
    }
    
    async updateReport(reportId, updateData) {
        try {
            console.log(`Updating report ${reportId} with data:`, updateData);
            
            // Ensure we have a valid report ID
            if (!reportId) {
                throw new Error('Report ID is required for update');
            }
            
            // Prepare request data
            let requestData = { ...updateData };
            
            // If hardware_status is an object, stringify it
            if (typeof requestData.hardware_status === 'object') {
                requestData.hardware_status = JSON.stringify(requestData.hardware_status);
            }
            
            // If external_images is an object, stringify it
            if (typeof requestData.external_images === 'object') {
                requestData.external_images = JSON.stringify(requestData.external_images);
            }
            
            // Make the API request
            return this.request(`/api/reports/${reportId}`, 'PUT', requestData);
        } catch (error) {
            console.error('Error updating report:', error);
            throw error;
        }
    }
    
    /**
     * Create a new report - Used by create-report.html
     * This is a dedicated endpoint for the create-report page
     * @param {Object} reportData - Report data to create
     * @returns {Promise<Object>} Created report
     */
    async createNewReport(reportData) {
        try {
            console.log('Using dedicated createNewReport method for create-report.html');
            // Generate a report ID if not provided
            let reportId = reportData.id || ('RPT' + Date.now() + Math.floor(Math.random() * 1000));
            
            // Generate a title for the report if not provided
            let title = reportData.title || 
                          `Report for ${reportData.device_model || reportData.deviceModel || ''} - ${reportData.client_name || reportData.clientName || 'Client'}`;
            
            // Create a report object that includes both the fields expected by the route handler
            // and the fields that match the database schema
            let reportObject = {
                // Fields required by the route handler
                clientId: reportData.client_id || reportData.clientId,
                title: title,
                description: reportData.notes || '',
                
                // Database schema fields
                id: reportId,
                client_id: reportData.client_id || reportData.clientId,
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
                hardware_status: reportData.hardware_status || '[]',
                external_images: reportData.external_images || '[]',
                notes: reportData.notes || '',
                billing_enabled: Boolean(reportData.billing_enabled ?? reportData.billingEnabled ?? false),
                // Ensure amount is preserved regardless of billing_enabled status
                amount: Number(reportData.amount || reportData.devicePrice || window.globalDeviceDetails?.devicePrice || 0),
                status: reportData.status || 'active'
            };
            
            // Make a direct fetch request using the standard reports endpoint
            const url = `${this.baseUrl}/api/reports`;
            let options = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Add auth token if available
                    ...this.getAuthHeaders(),
                },
                body: JSON.stringify(reportObject) // Add the request body
            };
            
            console.log(`Direct API Request to dedicated endpoint: POST ${url}`);
            console.log('Report data being sent:', reportObject);
            
            const response = await fetch(url, options);
            console.log(`API Response status: ${response.status}`);
            
            // Handle the response
            if (!response.ok) {
                let errorMessage = `API request failed with status ${response.status}`;
                try {
                    let errorData = await response.json();
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
            console.log('New report created successfully through dedicated endpoint:', result);
            return result;
        } catch (error) {
            console.error('Error creating new report:', error);
            // Provide a more user-friendly error message
            if (error.message.includes('database')) {
                throw new Error('Failed to save report to database. Please check database connection.');
            }
            throw error;
        }
    }
    
    /**
     * Legacy create report method - maintained for backwards compatibility
     * @param {Object} reportData - Report data to create
     * @returns {Promise<Object>} Created report
     */
    async createReport(reportData) {
        console.log('Using legacy createReport method - consider updating to createNewReport');
        try {
            // Generate a report ID if not provided
            let reportId = reportData.id || ('RPT' + Date.now() + Math.floor(Math.random() * 1000));
            
            // Generate a title for the report if not provided
            let title = reportData.title || 
                          `Report for ${reportData.device_model || reportData.deviceModel || ''} - ${reportData.client_name || reportData.clientName || 'Client'}`;
            
            // Create a report object that includes both the fields expected by the route handler
            // and the fields that match the database schema
            let reportObject = {
                // Fields required by the route handler
                clientId: reportData.client_id || reportData.clientId,
                title: title,
                description: reportData.notes || '',
                
                // Database schema fields
                id: reportId,
                client_id: reportData.client_id || reportData.clientId,
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
                hardware_status: reportData.hardware_status || '[]',
                external_images: reportData.external_images || '[]',
                notes: reportData.notes || '',
                billing_enabled: Boolean(reportData.billing_enabled ?? reportData.billingEnabled ?? false),
                // Ensure amount is preserved regardless of billing_enabled status
                amount: Number(reportData.amount || reportData.devicePrice || window.globalDeviceDetails?.devicePrice || 0),
                status: reportData.status || 'active'
            };
            
            // Make a direct fetch request
            const url = `${this.baseUrl}/api/reports`;
            let options = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Add auth token if available
                    ...this.getAuthHeaders(),
                    // Add any custom headers passed to the method
                },
                body: JSON.stringify(reportObject) // Add the request body
            };
            
            console.log(`Direct API Request: POST ${url}`);
            console.log('Report data being sent:', reportObject);
            
            const response = await fetch(url, options);
            console.log(`API Response status: ${response.status}`);
            
            // Handle the response
            if (!response.ok) {
                let errorMessage = `API request failed with status ${response.status}`;
                try {
                    let errorData = await response.json();
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
    
    // This method is now implemented above with more comprehensive functionality
    
    async deleteReport(id) {
        return this.request(`/api/reports/${id}`, 'DELETE');
    }
    
    // Invoice API Methods
    async getInvoices(filters = {}) {
        try {
            let queryParams = '';
            if (filters && Object.keys(filters).length > 0) {
                queryParams = '?' + new URLSearchParams(filters).toString();
            }
            return this.request(`/api/invoices${queryParams}`);
        } catch (error) {
            console.error('Error fetching invoices:', error);
            
            // Fall back to localStorage if API fails
            const storedInvoices = localStorage.getItem('lpk_invoices');
            if (storedInvoices) {
                let invoices = JSON.parse(storedInvoices);
                
                // Apply filters if any
                if (filters) {
                    if (filters.client_id) {
                        invoices = invoices.filter(invoice => invoice.client_id.toString() === filters.client_id.toString());
                    }
                    if (filters.paymentStatus) {
                        invoices = invoices.filter(invoice => invoice.paymentStatus === filters.paymentStatus);
                    }
                    if (filters.dateFrom) {
                        const dateFrom = new Date(filters.dateFrom);
                        invoices = invoices.filter(invoice => new Date(invoice.date) >= dateFrom);
                    }
                    if (filters.dateTo) {
                        const dateTo = new Date(filters.dateTo);
                        dateTo.setHours(23, 59, 59, 999); // End of day
                        invoices = invoices.filter(invoice => new Date(invoice.date) <= dateTo);
                    }
                }
                
                return invoices;
            }
            throw error;
        }
    }
    
    async getInvoice(id, adminToken = null) {
        try {
            // Prepare custom headers for this request
            let headers = {};
            
            // First, use the provided adminToken if available
            if (adminToken) {
                headers['x-auth-token'] = adminToken;
            } 
            // Fallback to class auth token (typically client token)
            else if (this.authToken) {
                headers['x-auth-token'] = this.authToken;
            }
            // Final fallback - try to get admin token directly from storage
            else {
                const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
                if (token) {
                    headers['x-auth-token'] = token;
                }
            }
            
            return this.request(`/api/invoices/${id}`, 'GET', null, headers);
        } catch (error) {
            console.error(`Error fetching invoice ${id}:`, error);
            
            // Fall back to localStorage if API fails
            const storedInvoices = localStorage.getItem('lpk_invoices');
            if (storedInvoices) {
                const invoices = JSON.parse(storedInvoices);
                const invoice = invoices.find(inv => inv.id === id);
                if (invoice) {
                    return invoice;
                }
            }
            throw error;
        }
    }
    
    async updateInvoice(id, invoiceData) {
        try {
            // Format data for API
            const formattedData = {
                title: invoiceData.title || '',
                date: invoiceData.date || new Date().toISOString(),
                client_id: invoiceData.client_id,
                subtotal: parseFloat(invoiceData.subtotal) || 0,
                discount: parseFloat(invoiceData.discount) || 0,
                taxRate: parseFloat(invoiceData.taxRate) || 0,
                tax: parseFloat(invoiceData.tax) || 0,
                total: parseFloat(invoiceData.total) || 0,
                paymentStatus: invoiceData.paymentStatus || 'unpaid',
                paymentMethod: invoiceData.paymentMethod || 'cash',
                notes: invoiceData.notes || '',
                items: invoiceData.items.map(item => ({
                    description: item.description || '',
                    type: item.type || 'service',
                    quantity: parseInt(item.quantity) || 1,
                    amount: parseFloat(item.unitPrice) || 0,
                    totalAmount: parseFloat(item.total) || 0
                }))
            };
            
            return this.request(`/api/invoices/${id}`, 'PUT', formattedData);
        } catch (error) {
            console.error(`Error updating invoice ${id}:`, error);
            
            // Fall back to localStorage if API fails
            const storedInvoices = localStorage.getItem('lpk_invoices');
            if (storedInvoices) {
                let invoices = JSON.parse(storedInvoices);
                const index = invoices.findIndex(inv => inv.id === id);
                
                if (index !== -1) {
                    // Update the invoice
                    invoices[index] = {
                        ...invoices[index],
                        ...invoiceData,
                        updated_at: new Date().toISOString()
                    };
                    
                    // Save back to localStorage
                    localStorage.setItem('lpk_invoices', JSON.stringify(invoices));
                    return invoices[index];
                }
            }
            throw error;
        }
    }
    
    async createInvoice(invoiceData) {
        console.log('Creating invoice with data:', invoiceData);
        try {
            console.log('ApiService.createInvoice received data:', JSON.stringify(invoiceData, null, 2));

            // --- Essential Validations ---
            if (!invoiceData) {
                throw new Error('Invoice data is undefined or null.');
            }            if (!invoiceData.id || typeof invoiceData.id !== 'string') {
                throw new Error('Invoice ID (invoiceData.id) is missing or not a string.');
            }
            if (typeof invoiceData.client_id !== 'number' || invoiceData.client_id <= 0) {
                throw new Error('Client ID (invoiceData.client_id) must be a valid positive number.');
            }
            if (!invoiceData.date || isNaN(new Date(invoiceData.date).getTime())) {
                throw new Error('Invoice date (invoiceData.date) is missing or invalid.');
            }
             if (invoiceData.report_id && typeof invoiceData.report_id !== 'string') { // report_id is optional
                throw new Error('Report ID (invoiceData.report_id) must be a string if provided.');
            }
            if (!Array.isArray(invoiceData.items)) {
                throw new Error('Invoice items (invoiceData.items) must be an array.');
            }

            // Create a structured payload for the API
            const payload = {
                id: invoiceData.id || this._generateUniqueId('INV'),
                client_id: Number(invoiceData.client_id),
                date: invoiceData.date ? new Date(invoiceData.date).toISOString() : new Date().toISOString(),
                report_id: invoiceData.report_id || null, // Keep report_id field
                subtotal: Number(invoiceData.subtotal || 0),
                discount: Number(invoiceData.discount || 0),
                taxRate: Number(invoiceData.taxRate || 0), // Ensure taxRate is present
                tax: Number(invoiceData.tax || 0),
                total: Number(invoiceData.total || 0),
                paymentStatus: invoiceData.paymentStatus || 'unpaid',
                paymentMethod: invoiceData.paymentMethod || null,
                paymentDate: invoiceData.paymentDate ? new Date(invoiceData.paymentDate).toISOString() : null,
                items: []
            };

            // Validate and map items
            payload.items = invoiceData.items.map(item => {
                if (!item.description || typeof item.description !== 'string') {
                    throw new Error('Item description is missing or not a string.');
                }

                // Determine the unit price: invoice-generator.js provides 'amount' for the unit price in its items.
                const unitPrice = item.amount ?? item.price; // Prefer item.amount as invoice-generator produces it.
                // Determine the line total: invoice-generator.js provides 'totalAmount'.
                const lineTotal = item.totalAmount ?? item.total;

                if (typeof unitPrice !== 'number' || unitPrice < 0) { 
                    throw new Error('Item unit price (from item.amount or item.price) is missing or not a valid non-negative number.');
                }
                if (typeof lineTotal !== 'number' || lineTotal < 0) { 
                    throw new Error('Item line total (from item.totalAmount or item.total) is missing or not a valid non-negative number.');
                }

                return {
                    invoiceId: payload.id, // Link to the main invoice
                    description: item.description,
                    type: item.type || 'service', // Default to 'service' if not provided
                    amount: Number(unitPrice), // This is unit_price, maps to 'amount' in DB invoice_items table
                    quantity: Number(item.quantity || 1),
                    totalAmount: Number(lineTotal), // This is line total, maps to 'totalAmount' in DB
                    serialNumber: item.serialNumber || item.serial || null // Prefer item.serialNumber from invoice-generator
                };
            });
            
            // Final check on client_id (redundant with above but good for safety)
            if (isNaN(payload.client_id) || payload.client_id <= 0) {
                console.error('CRITICAL: Client ID became invalid after processing:', payload.client_id, 'Original:', invoiceData.client_id);
                throw new Error('Client ID is invalid in the final payload.');
            }

            console.log('ApiService.createInvoice is sending payload:', JSON.stringify(payload, null, 2));
            return this.request('/api/invoices', 'POST', payload);
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
        // Ensure this token is for a client user, handled by the constructor logic
        return this.request('/api/reports/client/me', 'GET');
    }

    async getClientInvoices() {
        // Ensure this token is for a client user
        // This will call a new backend endpoint: /api/invoices/client/me
        return this.request('/api/invoices/client', 'GET');
    }
    
    async searchReports(query) {
        return this.request(`/api/reports/search/${query}`);
    }

    /**
     * Create invoice for a report with proper linking
     * @param {string} reportId - The report ID
     * @param {Object} invoiceData - The invoice data
     * @returns {Promise<Object>} The created invoice
     */
    async createInvoiceForReport(reportId, invoiceData) {
        try {
            console.log(`Creating invoice for report ${reportId}:`, invoiceData);
            
            // Ensure the invoice data includes the report ID
            const invoiceWithReport = {
                ...invoiceData,
                reportId: reportId,
                created_from_report: true,
                report_order_number: invoiceData.report_order_number || invoiceData.order_number
            };
            
            // Create the invoice
            const response = await this.request('/api/invoices', 'POST', invoiceWithReport);
            
            // Update the report to mark invoice as created
            if (response && response.id) {
                await this.request(`/api/reports/${reportId}`, 'PUT', {
                    invoice_created: true,
                    invoice_id: response.id,
                    invoice_date: new Date().toISOString()
                });
            }
            
            return response;
        } catch (error) {
            console.error('Error creating invoice for report:', error);
            throw error;
        }
    }

    /**
     * Create bulk invoice for multiple reports with proper linking
     * @param {Array} reportIds - Array of report IDs
     * @param {Object} invoiceData - The invoice data
     * @returns {Promise<Object>} The created invoice
     */
    async createBulkInvoiceForReports(reportIds, invoiceData) {
        try {
            console.log(`Creating bulk invoice for reports:`, reportIds, invoiceData);
            
            // Ensure the invoice data includes all report IDs
            const bulkInvoiceData = {
                ...invoiceData,
                reportIds: reportIds, // Array of report IDs
                created_from_reports: true,
                is_bulk_invoice: true
            };
            
            // Create the invoice
            const response = await this.request('/api/invoices/bulk', 'POST', bulkInvoiceData);
            
            // Update all reports to mark invoice as created
            if (response && response.id) {
                const updatePromises = reportIds.map(reportId => 
                    this.request(`/api/reports/${reportId}`, 'PUT', {
                        invoice_created: true,
                        invoice_id: response.id,
                        invoice_date: new Date().toISOString()
                    })
                );
                
                await Promise.all(updatePromises);
                console.log(`Updated ${reportIds.length} reports with invoice ID: ${response.id}`);
            }
            
            return response;
        } catch (error) {
            console.error('Error creating bulk invoice for reports:', error);
            throw error;
        }
    }

    /**
     * Get invoice for a specific report
     * @param {string} reportId - The report ID
     * @returns {Promise<Object>} The invoice data
     */
    async getInvoiceForReport(reportId) {
        try {
            const response = await this.request(`/api/invoices/report/${reportId}`);
            return response;
        } catch (error) {
            console.error('Error getting invoice for report:', error);
            throw error;
        }
    }

    /**
     * Get reports with invoice status
     * @param {Object} filters - Optional filters
     * @returns {Promise<Array>} Array of reports with invoice information
     */
    async getReportsWithInvoiceStatus(filters = {}) {
        try {
            const queryParams = new URLSearchParams();
            Object.entries(filters).forEach(([key, value]) => {
                queryParams.append(key, value);
            });
            
            const response = await this.request(`/api/reports/with-invoices?${queryParams}`);
            return response;
        } catch (error) {
            console.error('Error getting reports with invoice status:', error);
            throw error;
        }
    }
}

// Export class for module environments
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = ApiService;
}

// Create a global instance of ApiService for direct use in browser
// Use var instead of const to ensure it's accessible from all scopes
var apiService;

// Initialize with a self-executing function to ensure it runs immediately
(function() {
    try {
        // Check if apiService already exists to avoid re-creating it
        if (!window.apiService) {
            apiService = new ApiService();
            // Make it available globally
            window.apiService = apiService;
            console.log('Global apiService instance created successfully');
        } else {
            apiService = window.apiService;
            console.log('Using existing global apiService instance');
        }
    } catch (error) {
        console.error('Error initializing apiService:', error);
        // Create a fallback service with the production URL
        apiService = new ApiService('https://reports.laapak.com');
        window.apiService = apiService;
        console.log('Created fallback apiService with hardcoded URL');
    }
})();
