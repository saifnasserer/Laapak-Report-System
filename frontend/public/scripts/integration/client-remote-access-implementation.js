/**
 * Laapak Client Remote Access Implementation
 * Complete working example for accessing client data remotely
 */

class LaapakRemoteClient {
    constructor(config = {}) {
        this.baseUrl = config.baseUrl || 'https://reports.laapak.com';
        this.authMethod = config.authMethod || 'jwt';
        this.apiKey = config.apiKey;
        this.clientId = config.clientId;
        this.token = null;
        this.clientInfo = null;
    }

    /**
     * Authenticate client using phone and password
     * @param {string} phone - Client phone number
     * @param {string} password - Client password
     * @returns {Promise<Object>} Authentication response
     */
    async login(phone, password) {
        try {
            console.log('🔐 Authenticating client...');
            
            const response = await fetch(`${this.baseUrl}/api/auth/client/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    phone: phone,
                    password: password
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Login failed: ${response.status}`);
            }

            const data = await response.json();
            
            // Store authentication data
            this.token = data.token;
            this.clientInfo = data.client;
            
            // Store in localStorage for persistence
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem('laapak_token', data.token);
                localStorage.setItem('laapak_client_info', JSON.stringify(data.client));
            }
            
            console.log('✅ Authentication successful');
            return data;
        } catch (error) {
            console.error('❌ Authentication failed:', error);
            throw error;
        }
    }

    /**
     * Get client reports
     * @param {Object} filters - Optional filters
     * @returns {Promise<Array>} Array of reports
     */
    async getReports(filters = {}) {
        try {
            console.log('📊 Fetching client reports...');
            
            const response = await this.makeRequest('/api/reports/client/me', 'GET', null, filters);
            
            console.log(`✅ Retrieved ${response.length} reports`);
            return response;
        } catch (error) {
            console.error('❌ Error fetching reports:', error);
            throw error;
        }
    }

    /**
     * Get client invoices
     * @param {Object} filters - Optional filters
     * @returns {Promise<Array>} Array of invoices
     */
    async getInvoices(filters = {}) {
        try {
            console.log('💰 Fetching client invoices...');
            
            const response = await this.makeRequest('/api/invoices/client', 'GET', null, filters);
            
            console.log(`✅ Retrieved ${response.length} invoices`);
            return response;
        } catch (error) {
            console.error('❌ Error fetching invoices:', error);
            throw error;
        }
    }

    /**
     * Get warranty information
     * @returns {Promise<Array>} Array of warranty info
     */
    async getWarrantyInfo() {
        try {
            console.log('🛡️ Fetching warranty information...');
            
            const response = await this.makeRequest('/api/warranty/client', 'GET');
            
            console.log(`✅ Retrieved warranty info`);
            return response;
        } catch (error) {
            console.error('❌ Error fetching warranty info:', error);
            throw error;
        }
    }

    /**
     * Get maintenance schedule
     * @returns {Promise<Array>} Array of maintenance schedules
     */
    async getMaintenanceSchedule() {
        try {
            console.log('🔧 Fetching maintenance schedule...');
            
            const response = await this.makeRequest('/api/maintenance/client', 'GET');
            
            console.log(`✅ Retrieved maintenance schedule`);
            return response;
        } catch (error) {
            console.error('❌ Error fetching maintenance schedule:', error);
            throw error;
        }
    }

    /**
     * Get specific report by ID
     * @param {string} reportId - Report ID
     * @returns {Promise<Object>} Report details
     */
    async getReport(reportId) {
        try {
            console.log(`📄 Fetching report ${reportId}...`);
            
            const response = await this.makeRequest(`/api/reports/${reportId}`, 'GET');
            
            console.log('✅ Report retrieved');
            return response;
        } catch (error) {
            console.error('❌ Error fetching report:', error);
            throw error;
        }
    }

    /**
     * Get specific invoice by ID
     * @param {string} invoiceId - Invoice ID
     * @returns {Promise<Object>} Invoice details
     */
    async getInvoice(invoiceId) {
        try {
            console.log(`🧾 Fetching invoice ${invoiceId}...`);
            
            const response = await this.makeRequest(`/api/invoices/${invoiceId}`, 'GET');
            
            console.log('✅ Invoice retrieved');
            return response;
        } catch (error) {
            console.error('❌ Error fetching invoice:', error);
            throw error;
        }
    }

    /**
     * Get all client data (reports, invoices, warranty, maintenance)
     * @returns {Promise<Object>} Complete client data
     */
    async getAllClientData() {
        try {
            console.log('📦 Fetching all client data...');
            
            const [reports, invoices, warranty, maintenance] = await Promise.all([
                this.getReports(),
                this.getInvoices(),
                this.getWarrantyInfo(),
                this.getMaintenanceSchedule()
            ]);
            
            const clientData = {
                reports,
                invoices,
                warranty,
                maintenance,
                client: this.clientInfo,
                fetched_at: new Date().toISOString()
            };
            
            console.log('✅ All client data retrieved');
            return clientData;
        } catch (error) {
            console.error('❌ Error fetching all client data:', error);
            throw error;
        }
    }

    /**
     * Make authenticated API request
     * @param {string} endpoint - API endpoint
     * @param {string} method - HTTP method
     * @param {Object} data - Request data
     * @param {Object} queryParams - Query parameters
     * @returns {Promise<Object>} API response
     */
    async makeRequest(endpoint, method = 'GET', data = null, queryParams = {}) {
        // Build URL with query parameters
        let url = `${this.baseUrl}${endpoint}`;
        if (Object.keys(queryParams).length > 0) {
            const params = new URLSearchParams();
            Object.keys(queryParams).forEach(key => {
                if (queryParams[key] !== undefined) {
                    params.append(key, queryParams[key]);
                }
            });
            url += `?${params.toString()}`;
        }

        // Prepare request options
        const options = {
            method,
            headers: this.getHeaders()
        };

        // Add body for POST/PUT requests
        if (data && (method === 'POST' || method === 'PUT')) {
            options.body = JSON.stringify(data);
        }

        console.log(`🌐 API Request: ${method} ${url}`);

        try {
            const response = await fetch(url, options);
            
            console.log(`📡 Response status: ${response.status}`);

            if (!response.ok) {
                if (response.status === 401) {
                    console.log('🔒 Authentication failed, clearing stored data');
                    this.logout();
                    throw new Error('Authentication failed. Please login again.');
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const responseData = await response.json();
            return responseData;
        } catch (error) {
            console.error(`❌ API Error (${endpoint}):`, error);
            throw error;
        }
    }

    /**
     * Get request headers based on authentication method
     * @returns {Object} Request headers
     */
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };

        if (this.authMethod === 'jwt') {
            if (this.token) {
                headers['x-auth-token'] = this.token;
            } else {
                throw new Error('No authentication token found. Please login first.');
            }
        } else if (this.authMethod === 'apikey') {
            if (!this.apiKey || !this.clientId) {
                throw new Error('API key and client ID required for API key authentication.');
            }
            headers['x-api-key'] = this.apiKey;
            headers['x-client-id'] = this.clientId;
        }

        return headers;
    }

    /**
     * Check if client is authenticated
     * @returns {boolean} Authentication status
     */
    isAuthenticated() {
        return !!(this.token || (this.apiKey && this.clientId));
    }

    /**
     * Logout and clear stored data
     */
    logout() {
        this.token = null;
        this.clientInfo = null;
        
        if (typeof localStorage !== 'undefined') {
            localStorage.removeItem('laapak_token');
            localStorage.removeItem('laapak_client_info');
        }
        
        console.log('👋 Logged out successfully');
    }

    /**
     * Restore authentication from stored data
     */
    restoreAuth() {
        if (typeof localStorage !== 'undefined') {
            const storedToken = localStorage.getItem('laapak_token');
            const storedClientInfo = localStorage.getItem('laapak_client_info');
            
            if (storedToken) {
                this.token = storedToken;
                this.clientInfo = storedClientInfo ? JSON.parse(storedClientInfo) : null;
                console.log('🔄 Authentication restored from storage');
                return true;
            }
        }
        return false;
    }
}

/**
 * Usage Examples
 */

// Example 1: JWT Authentication
async function exampleJWT() {
    const client = new LaapakRemoteClient({
        baseUrl: 'https://reports.laapak.com',
        authMethod: 'jwt'
    });

    try {
        // Login
        await client.login('client_phone', 'client_password');
        
        // Get all data
        const allData = await client.getAllClientData();
        console.log('Client data:', allData);
        
    } catch (error) {
        console.error('Error:', error);
    }
}

// Example 2: API Key Authentication
async function exampleAPIKey() {
    const client = new LaapakRemoteClient({
        baseUrl: 'https://reports.laapak.com',
        authMethod: 'apikey',
        apiKey: 'your_api_key_here',
        clientId: 'client_id_here'
    });

    try {
        // Get reports (no login needed with API key)
        const reports = await client.getReports();
        console.log('Reports:', reports);
        
        // Get invoices
        const invoices = await client.getInvoices();
        console.log('Invoices:', invoices);
        
    } catch (error) {
        console.error('Error:', error);
    }
}

// Example 3: WordPress Integration
function wordpressIntegration() {
    // Add to WordPress functions.php or as a plugin
    function get_laapak_client_data($client_phone, $client_password) {
        $api_url = 'https://reports.laapak.com';
        
        // Login
        $login_response = wp_remote_post($api_url . '/api/auth/client/login', [
            'headers' => ['Content-Type' => 'application/json'],
            'body' => json_encode([
                'phone' => $client_phone,
                'password' => $client_password
            ])
        ]);
        
        if (is_wp_error($login_response)) {
            return false;
        }
        
        $login_data = json_decode(wp_remote_retrieve_body($login_response), true);
        $token = $login_data['token'];
        
        // Get reports
        $reports_response = wp_remote_get($api_url . '/api/reports/client/me', [
            'headers' => [
                'x-auth-token' => $token,
                'Content-Type' => 'application/json'
            ]
        ]);
        
        if (is_wp_error($reports_response)) {
            return false;
        }
        
        return json_decode(wp_remote_retrieve_body($reports_response), true);
    }
}

// Example 4: React Component
const ReactClientDashboard = () => {
    const [clientData, setClientData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                const client = new LaapakRemoteClient({
                    baseUrl: 'https://reports.laapak.com',
                    authMethod: 'jwt'
                });

                // Try to restore authentication
                if (!client.restoreAuth()) {
                    // If no stored auth, show login form
                    setLoading(false);
                    return;
                }

                // Load all client data
                const data = await client.getAllClientData();
                setClientData(data);
                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };

        loadData();
    }, []);

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;
    if (!clientData) return <div>Please login</div>;

    return (
        <div>
            <h1>Client Dashboard</h1>
            <h2>Reports ({clientData.reports.length})</h2>
            {clientData.reports.map(report => (
                <div key={report.id}>
                    <h3>{report.device_model}</h3>
                    <p>Status: {report.status}</p>
                </div>
            ))}
            
            <h2>Invoices ({clientData.invoices.length})</h2>
            {clientData.invoices.map(invoice => (
                <div key={invoice.id}>
                    <h3>Invoice #{invoice.id}</h3>
                    <p>Total: {invoice.total} EGP</p>
                </div>
            ))}
        </div>
    );
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LaapakRemoteClient;
}

// Make available globally
if (typeof window !== 'undefined') {
    window.LaapakRemoteClient = LaapakRemoteClient;
}
