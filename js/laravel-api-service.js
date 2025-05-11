/**
 * Laravel API Service
 * Handles API requests to the Laravel backend
 */
class LaravelApiService {
    constructor() {
        // Base URL for Laravel API
        // For testing purposes, we'll use a mock API
        this.baseUrl = 'https://mockapi.io/api/v1/laapak';
        
        // Endpoints for API requests
        this.endpoints = {
            auth: {
                adminLogin: 'auth/login',
                clientLogin: 'auth/client-login',
                logout: 'auth/logout'
            },
            clients: {
                list: 'clients',
                create: 'clients',
                get: (id) => `clients/${id}`,
                update: (id) => `clients/${id}`,
                delete: (id) => `clients/${id}`
            }
        };
        
        // Check for admin or client token
        this.token = localStorage.getItem('adminToken') || 
                     sessionStorage.getItem('adminToken') || 
                     localStorage.getItem('clientToken') || 
                     sessionStorage.getItem('clientToken');
    }
    
    /**
     * Get headers for API requests
     * @returns {Object} - Headers object
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
     * Make API request
     * @param {string} endpoint - API endpoint
     * @param {string} method - HTTP method
     * @param {Object} data - Request data
     * @returns {Promise} - Promise with response data
     */
    async request(endpoint, method = 'GET', data = null) {
        try {
            // For testing purposes, we'll use a mock implementation
            console.log(`Making ${method} request to ${this.baseUrl}/${endpoint} with data:`, data);
            
            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Mock responses based on endpoint and method
            let responseData;
            
            if (endpoint === 'auth/login' && method === 'POST') {
                // Mock admin login
                if (data && data.username && data.password) {
                    // For testing, accept any username/password combination
                    const token = 'mock-admin-jwt-token-' + Date.now();
                    
                    // Store token directly for testing
                    this.token = token;
                    
                    responseData = {
                        token: token,
                        user: {
                            id: 1,
                            username: data.username,
                            name: 'مدير النظام',
                            role: 'admin',
                            email: 'admin@example.com'
                        },
                        message: 'تم تسجيل الدخول بنجاح'
                    };
                } else {
                    throw new Error('يرجى إدخال اسم المستخدم وكلمة المرور');
                }
            } else if (endpoint === 'auth/client-login' && method === 'POST') {
                // Mock client login
                if (data && data.phone && data.order_code) {
                    // For testing, accept any phone/order_code combination
                    const token = 'mock-client-jwt-token-' + Date.now();
                    
                    // Store token directly for testing
                    this.token = token;
                    
                    responseData = {
                        token: token,
                        client: {
                            id: 101,
                            name: 'عميل تجريبي',
                            phone: data.phone,
                            email: 'client@example.com',
                            address: 'الرياض، المملكة العربية السعودية',
                            orderCode: data.order_code
                        },
                        message: 'تم تسجيل الدخول بنجاح'
                    };
                } else {
                    throw new Error('يرجى إدخال رقم الهاتف ورقم الطلب');
                }
            } else if (endpoint === 'clients' && method === 'GET') {
                // Mock clients list
                responseData = [
                    {
                        id: 1,
                        name: 'محمد أحمد',
                        phone: '0501234567',
                        email: 'mohammed@example.com',
                        address: 'الرياض، المملكة العربية السعودية',
                        orderCode: 'LPK1001',
                        status: 'active'
                    },
                    {
                        id: 2,
                        name: 'فاطمة علي',
                        phone: '0509876543',
                        email: 'fatima@example.com',
                        address: 'جدة، المملكة العربية السعودية',
                        orderCode: 'LPK1002',
                        status: 'active'
                    },
                    {
                        id: 3,
                        name: 'سارة محمد',
                        phone: '0553219876',
                        email: 'sara@example.com',
                        address: 'الدمام، المملكة العربية السعودية',
                        orderCode: 'LPK1003',
                        status: 'active'
                    }
                ];
            } else if (endpoint.startsWith('clients/') && method === 'GET') {
                // Mock single client
                const clientId = parseInt(endpoint.split('/')[1]);
                responseData = {
                    id: clientId,
                    name: 'عميل رقم ' + clientId,
                    phone: '05' + (10000000 + clientId),
                    email: `client${clientId}@example.com`,
                    address: 'عنوان العميل التجريبي',
                    orderCode: 'LPK' + (1000 + clientId),
                    status: 'active'
                };
            } else if (endpoint === 'clients' && method === 'POST') {
                // Mock client creation
                responseData = {
                    id: 100 + Math.floor(Math.random() * 100),
                    ...data,
                    status: data.status || 'active',
                    createdAt: new Date().toISOString(),
                    message: 'تم إنشاء العميل بنجاح'
                };
            } else if (endpoint.startsWith('clients/') && method === 'PUT') {
                // Mock client update
                const clientId = parseInt(endpoint.split('/')[1]);
                responseData = {
                    id: clientId,
                    ...data,
                    updatedAt: new Date().toISOString(),
                    message: 'تم تحديث بيانات العميل بنجاح'
                };
            } else if (endpoint.startsWith('clients/') && method === 'DELETE') {
                // Mock client deletion
                responseData = {
                    success: true,
                    message: 'تم حذف العميل بنجاح'
                };
            } else if (endpoint === 'reports' && method === 'GET') {
                // Mock reports list
                responseData = [
                    {
                        id: 1,
                        reportNumber: 'RPT10001',
                        clientName: 'محمد أحمد',
                        deviceType: 'لابتوب',
                        deviceModel: 'HP Pavilion',
                        status: 'completed',
                        createdAt: '2025-04-01T10:30:00'
                    },
                    {
                        id: 2,
                        reportNumber: 'RPT10002',
                        clientName: 'فاطمة علي',
                        deviceType: 'لابتوب',
                        deviceModel: 'Dell XPS',
                        status: 'in_progress',
                        createdAt: '2025-04-05T14:20:00'
                    },
                    {
                        id: 3,
                        reportNumber: 'RPT10003',
                        clientName: 'سارة محمد',
                        deviceType: 'لابتوب',
                        deviceModel: 'MacBook Pro',
                        status: 'pending',
                        createdAt: '2025-05-08T09:15:00'
                    }
                ];
            } else if (endpoint === 'reports' && method === 'POST') {
                // Mock report creation
                console.log('Creating new report with data:', data);
                
                // Generate a unique report ID
                const reportId = 'RPT' + Date.now().toString().slice(-6);
                
                // Create mock response
                responseData = {
                    success: true,
                    id: Math.floor(Math.random() * 1000) + 10,
                    reportNumber: reportId,
                    clientName: data.clientName || 'Unknown Client',
                    deviceType: data.deviceType || 'لابتوب',
                    deviceModel: data.deviceModel || 'Unknown Model',
                    status: 'pending',
                    createdAt: new Date().toISOString(),
                    message: 'تم إنشاء التقرير بنجاح'
                };
            } else {
                // Default mock response
                console.warn(`No mock implementation for ${method} ${endpoint}`);
                responseData = {
                    success: true,
                    message: 'تمت العملية بنجاح (محاكاة)',
                    data: []
                };
            }
            
            console.log(`Request to ${endpoint} successful:`, responseData);
            return responseData;
        } catch (error) {
            // Handle network errors
            if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
                console.error('Network error, server may be down');
                throw new Error('Unable to connect to the server. Please check your network connection and ensure the backend server is running.');
            }
            
            console.error('API request error:', error);
            throw error;
        }
    }
    
    /**
     * Set authentication token
     * @param {string} token - JWT token
     * @param {string} userType - User type (admin or client)
     * @param {boolean} rememberMe - Whether to remember the user
     */
    setToken(token, userType = 'admin', rememberMe = false) {
        this.token = token;
        const storage = rememberMe ? localStorage : sessionStorage;
        
        // Store token in appropriate storage
        if (userType === 'admin') {
            storage.setItem('adminToken', token);
        } else {
            storage.setItem('clientToken', token);
        }
    }
    
    /**
     * Clear authentication token
     * @param {string} userType - User type (admin or client)
     */
    clearToken(userType = 'admin') {
        this.token = null;
        
        if (userType === 'admin') {
            localStorage.removeItem('adminToken');
            sessionStorage.removeItem('adminToken');
            localStorage.removeItem('adminInfo');
            sessionStorage.removeItem('adminInfo');
        } else {
            localStorage.removeItem('clientToken');
            sessionStorage.removeItem('clientToken');
            localStorage.removeItem('clientInfo');
            sessionStorage.removeItem('clientInfo');
        }
    }
    
    /**
     * Admin login
     * @param {string} username - Admin username
     * @param {string} password - Admin password
     * @param {boolean} rememberMe - Whether to remember the user
     * @returns {Promise} - Promise with login result
     */
    async adminLogin(username, password, rememberMe = false) {
        const response = await this.request(this.endpoints.auth.adminLogin, 'POST', { username, password });
        
        if (response && response.token) {
            this.setToken(response.token, 'admin', rememberMe);
            
            // Store admin info
            const adminInfo = {
                id: response.user.id,
                username: response.user.username,
                name: response.user.name,
                role: response.user.role,
                isLoggedIn: true,
                loginTime: new Date().getTime()
            };
            
            const storage = rememberMe ? localStorage : sessionStorage;
            storage.setItem('adminInfo', JSON.stringify(adminInfo));
        }
        
        return response;
    }
    
    /**
     * Client login
     * @param {string} phone - Client phone number
     * @param {string} orderCode - Client order code
     * @param {boolean} rememberMe - Whether to remember the user
     * @returns {Promise} - Promise with login result
     */
    async clientLogin(phone, orderCode, rememberMe = false) {
        const response = await this.request(this.endpoints.auth.clientLogin, 'POST', { phone, order_code: orderCode });
        
        if (response && response.token) {
            this.setToken(response.token, 'client', rememberMe);
            
            // Store client info
            const clientInfo = {
                id: response.client.id,
                name: response.client.name,
                phone: response.client.phone,
                email: response.client.email || '',
                isLoggedIn: true,
                loginTime: new Date().getTime()
            };
            
            const storage = rememberMe ? localStorage : sessionStorage;
            storage.setItem('clientInfo', JSON.stringify(clientInfo));
        }
        
        return response;
    }
    
    /**
     * Logout
     * @param {string} userType - User type (admin or client)
     * @returns {Promise} - Promise with logout result
     */
    async logout(userType = 'admin') {
        try {
            await this.request(this.endpoints.auth.logout, 'POST');
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            this.clearToken(userType);
        }
    }
    
    /**
     * Check if user is logged in
     * @param {string} userType - User type (admin or client)
     * @returns {boolean} - True if logged in
     */
    isLoggedIn(userType = 'admin') {
        const token = userType === 'admin' ? 
            (localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken')) :
            (localStorage.getItem('clientToken') || sessionStorage.getItem('clientToken'));
        return !!token;
    }
    
    /**
     * Get all clients
     * @param {Object} filters - Optional filters for clients
     * @returns {Promise} - Promise with clients data
     */
    async getClients(filters = {}) {
        let endpoint = this.endpoints.clients.list;
        
        // Add query parameters for filters if provided
        if (Object.keys(filters).length > 0) {
            const queryParams = new URLSearchParams();
            for (const key in filters) {
                if (filters[key]) {
                    queryParams.append(key, filters[key]);
                }
            }
            endpoint += `?${queryParams.toString()}`;
        }
        
        return await this.request(endpoint, 'GET');
    }
    
    /**
     * Get a single client by ID
     * @param {number} id - Client ID
     * @returns {Promise} - Promise with client data
     */
    async getClient(id) {
        return await this.request(this.endpoints.clients.get(id), 'GET');
    }
    
    /**
     * Create a new client
     * @param {Object} clientData - Client data
     * @returns {Promise} - Promise with created client data
     */
    async createClient(clientData) {
        return await this.request(this.endpoints.clients.create, 'POST', clientData);
    }
    
    /**
     * Update an existing client
     * @param {number} id - Client ID
     * @param {Object} clientData - Updated client data
     * @returns {Promise} - Promise with updated client data
     */
    async updateClient(id, clientData) {
        return await this.request(this.endpoints.clients.update(id), 'PUT', clientData);
    }
    
    /**
     * Delete a client
     * @param {number} id - Client ID
     * @returns {Promise} - Promise with deletion result
     */
    async deleteClient(id) {
        return await this.request(this.endpoints.clients.delete(id), 'DELETE');
    }
}

// Create a global instance of the API service
const apiService = new LaravelApiService();
