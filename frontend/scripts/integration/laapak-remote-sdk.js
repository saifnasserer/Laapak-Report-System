/**
 * Laapak Report System - Remote SDK
 * Complete JavaScript SDK for remote access to Laapak client data
 * 
 * Usage:
 * const laapak = new LaapakRemoteSDK({
 *   baseUrl: 'https://reports.laapak.com',
 *   authMethod: 'jwt' // or 'apiKey'
 * });
 */

class LaapakRemoteSDK {
    constructor(config = {}) {
        this.baseUrl = config.baseUrl || 'https://reports.laapak.com';
        this.authMethod = config.authMethod || 'jwt';
        this.apiKey = config.apiKey || 'laapak-api-key-2024';
        this.clientId = config.clientId;
        this.token = null;
        this.clientInfo = null;
        this.tokenExpiry = null;
        
        // Auto-initialize from stored credentials
        this.initializeFromStorage();
    }

    /**
     * Initialize from stored credentials
     */
    initializeFromStorage() {
        try {
            this.token = localStorage.getItem('laapakToken') || sessionStorage.getItem('laapakToken');
            this.clientInfo = JSON.parse(localStorage.getItem('laapakClientInfo') || sessionStorage.getItem('laapakClientInfo') || 'null');
            this.tokenExpiry = localStorage.getItem('laapakTokenExpiry') || sessionStorage.getItem('laapakTokenExpiry');
            
            if (this.token && this.clientInfo) {
                console.log('✅ Laapak SDK initialized with stored credentials');
            }
        } catch (error) {
            console.warn('Failed to initialize from storage:', error);
        }
    }

    /**
     * Client login with phone and password
     * @param {string} phone - Client phone number
     * @param {string} password - Client password
     * @returns {Promise<Object>} Login response
     */
    async login(phone, password) {
        try {
            console.log('🔐 Authenticating with Laapak...');
            
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
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Login failed: ${response.status} - ${errorData.message || response.statusText}`);
            }

            const data = await response.json();
            
            // Store credentials
            this.token = data.token;
            this.clientInfo = data.client;
            this.tokenExpiry = data.expires_at || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
            
            // Persist to storage
            this.persistCredentials();
            
            console.log('✅ Login successful');
            return data;
        } catch (error) {
            console.error('❌ Login failed:', error);
            throw error;
        }
    }

    /**
     * Persist credentials to storage
     */
    persistCredentials() {
        if (this.token) {
            localStorage.setItem('laapakToken', this.token);
            localStorage.setItem('laapakClientInfo', JSON.stringify(this.clientInfo));
            localStorage.setItem('laapakTokenExpiry', this.tokenExpiry);
        }
    }

    /**
     * Clear stored credentials
     */
    logout() {
        this.token = null;
        this.clientInfo = null;
        this.tokenExpiry = null;
        
        localStorage.removeItem('laapakToken');
        localStorage.removeItem('laapakClientInfo');
        localStorage.removeItem('laapakTokenExpiry');
        
        console.log('✅ Logged out successfully');
    }

    /**
     * Check if token is valid
     */
    isTokenValid() {
        if (!this.token) return false;
        if (this.tokenExpiry && new Date() >= new Date(this.tokenExpiry)) return false;
        return true;
    }

    /**
     * Get authentication headers
     */
    getAuthHeaders() {
        if (this.authMethod === 'apiKey') {
            const headers = {
                'Content-Type': 'application/json',
                'x-api-key': this.apiKey
            };
            
            if (this.clientId) {
                headers['x-client-id'] = this.clientId;
            }
            
            return headers;
        } else {
            return {
                'Content-Type': 'application/json',
                'x-auth-token': this.token
            };
        }
    }

    /**
     * Make authenticated request
     */
    async makeRequest(endpoint, options = {}) {
        if (!this.isTokenValid() && this.authMethod === 'jwt') {
            throw new Error('Authentication required. Please login first.');
        }

        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                ...options,
                headers: {
                    ...this.getAuthHeaders(),
                    ...options.headers
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    this.logout();
                    throw new Error('Authentication failed. Please login again.');
                }
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Request failed:', error);
            throw error;
        }
    }

    /**
     * Get client reports
     * @returns {Promise<Array>} Array of client reports
     */
    async getClientReports() {
        try {
            console.log('📊 Fetching client reports...');
            const reports = await this.makeRequest('/api/reports/client/me');
            console.log(`✅ Found ${reports.length} reports`);
            return reports;
        } catch (error) {
            console.error('❌ Failed to fetch reports:', error);
            throw error;
        }
    }

    /**
     * Get client invoices
     * @returns {Promise<Array>} Array of client invoices
     */
    async getClientInvoices() {
        try {
            console.log('💰 Fetching client invoices...');
            const invoices = await this.makeRequest('/api/invoices/client');
            console.log(`✅ Found ${invoices.length} invoices`);
            return invoices;
        } catch (error) {
            console.error('❌ Failed to fetch invoices:', error);
            throw error;
        }
    }

    /**
     * Search reports
     * @param {string} query - Search query
     * @returns {Promise<Array>} Array of matching reports
     */
    async searchReports(query) {
        try {
            console.log(`🔍 Searching reports for: "${query}"`);
            const reports = await this.makeRequest(`/api/reports/search?q=${encodeURIComponent(query)}`);
            console.log(`✅ Found ${reports.length} matching reports`);
            return reports;
        } catch (error) {
            console.error('❌ Search failed:', error);
            throw error;
        }
    }

    /**
     * Get specific report by ID
     * @param {number} reportId - Report ID
     * @returns {Promise<Object>} Report details
     */
    async getReport(reportId) {
        try {
            console.log(`📄 Fetching report ${reportId}...`);
            const report = await this.makeRequest(`/api/reports/${reportId}`);
            console.log('✅ Report fetched successfully');
            return report;
        } catch (error) {
            console.error('❌ Failed to fetch report:', error);
            throw error;
        }
    }

    /**
     * Get specific invoice by ID
     * @param {number} invoiceId - Invoice ID
     * @returns {Promise<Object>} Invoice details
     */
    async getInvoice(invoiceId) {
        try {
            console.log(`💰 Fetching invoice ${invoiceId}...`);
            const invoice = await this.makeRequest(`/api/invoices/${invoiceId}`);
            console.log('✅ Invoice fetched successfully');
            return invoice;
        } catch (error) {
            console.error('❌ Failed to fetch invoice:', error);
            throw error;
        }
    }

    /**
     * Get client dashboard data (reports + invoices)
     * @returns {Promise<Object>} Dashboard data
     */
    async getClientDashboard() {
        try {
            console.log('📊 Loading client dashboard...');
            
            const [reports, invoices] = await Promise.all([
                this.getClientReports(),
                this.getClientInvoices()
            ]);

            const dashboardData = {
                reports: reports,
                invoices: invoices,
                client: this.clientInfo,
                summary: {
                    totalReports: reports.length,
                    totalInvoices: invoices.length,
                    totalAmount: invoices.reduce((sum, invoice) => sum + (parseFloat(invoice.amount) || 0), 0),
                    recentReports: reports.slice(0, 5),
                    recentInvoices: invoices.slice(0, 5)
                }
            };

            console.log('✅ Dashboard data loaded successfully');
            return dashboardData;
        } catch (error) {
            console.error('❌ Failed to load dashboard:', error);
            throw error;
        }
    }

    /**
     * Get warranty information for client
     * @returns {Promise<Object>} Warranty information
     */
    async getWarrantyInfo() {
        try {
            console.log('🛡️ Fetching warranty information...');
            const warranty = await this.makeRequest('/api/warranty/client');
            console.log('✅ Warranty information loaded');
            return warranty;
        } catch (error) {
            console.error('❌ Failed to fetch warranty info:', error);
            throw error;
        }
    }

    /**
     * Get maintenance schedule for client
     * @returns {Promise<Object>} Maintenance schedule
     */
    async getMaintenanceSchedule() {
        try {
            console.log('🔧 Fetching maintenance schedule...');
            const maintenance = await this.makeRequest('/api/maintenance/client');
            console.log('✅ Maintenance schedule loaded');
            return maintenance;
        } catch (error) {
            console.error('❌ Failed to fetch maintenance schedule:', error);
            throw error;
        }
    }

    /**
     * Check connection status
     * @returns {Promise<boolean>} Connection status
     */
    async checkConnection() {
        try {
            const response = await fetch(`${this.baseUrl}/api/health`, {
                method: 'GET',
                timeout: 5000
            });
            return response.ok;
        } catch (error) {
            console.error('Connection check failed:', error);
            return false;
        }
    }

    /**
     * Get client info
     * @returns {Object|null} Client information
     */
    getClientInfo() {
        return this.clientInfo;
    }

    /**
     * Check if user is logged in
     * @returns {boolean} Login status
     */
    isLoggedIn() {
        return this.isTokenValid() && this.clientInfo !== null;
    }
}

/**
 * WordPress Integration Helper
 */
class LaapakWordPressIntegration {
    constructor() {
        this.sdk = new LaapakRemoteSDK();
        this.init();
    }

    async init() {
        // Check if user is already logged in
        if (this.sdk.isLoggedIn()) {
            await this.loadClientData();
        } else {
            this.showLoginForm();
        }
    }

    showLoginForm() {
        const container = document.getElementById('laapak-container');
        if (!container) return;

        container.innerHTML = `
            <div class="laapak-login-form">
                <h3>Access Your Reports</h3>
                <form id="laapak-login-form">
                    <div class="form-group">
                        <label for="laapak-phone">Phone Number:</label>
                        <input type="tel" id="laapak-phone" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label for="laapak-password">Password:</label>
                        <input type="password" id="laapak-password" class="form-control" required>
                    </div>
                    <button type="submit" class="btn btn-primary">Login</button>
                </form>
                <div id="laapak-login-error" class="alert alert-danger" style="display: none;"></div>
            </div>
        `;

        // Handle form submission
        document.getElementById('laapak-login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleLogin();
        });
    }

    async handleLogin() {
        const phone = document.getElementById('laapak-phone').value;
        const password = document.getElementById('laapak-password').value;
        const errorDiv = document.getElementById('laapak-login-error');

        try {
            await this.sdk.login(phone, password);
            await this.loadClientData();
        } catch (error) {
            errorDiv.textContent = 'Login failed: ' + error.message;
            errorDiv.style.display = 'block';
        }
    }

    async loadClientData() {
        try {
            const dashboardData = await this.sdk.getClientDashboard();
            this.displayDashboard(dashboardData);
        } catch (error) {
            console.error('Failed to load client data:', error);
        }
    }

    displayDashboard(data) {
        const container = document.getElementById('laapak-container');
        container.innerHTML = `
            <div class="laapak-dashboard">
                <div class="dashboard-header">
                    <h2>Welcome, ${data.client.name}</h2>
                    <button onclick="laapakWordPress.logout()" class="btn btn-outline-secondary">Logout</button>
                </div>
                
                <div class="dashboard-summary">
                    <div class="summary-card">
                        <h4>Reports</h4>
                        <span class="count">${data.summary.totalReports}</span>
                    </div>
                    <div class="summary-card">
                        <h4>Invoices</h4>
                        <span class="count">${data.summary.totalInvoices}</span>
                    </div>
                    <div class="summary-card">
                        <h4>Total Amount</h4>
                        <span class="amount">$${data.summary.totalAmount.toFixed(2)}</span>
                    </div>
                </div>

                <div class="dashboard-content">
                    <div class="reports-section">
                        <h3>Recent Reports</h3>
                        <div class="reports-grid">
                            ${data.summary.recentReports.map(report => `
                                <div class="report-card">
                                    <h5>${report.order_number}</h5>
                                    <p><strong>Device:</strong> ${report.device_model}</p>
                                    <p><strong>Date:</strong> ${new Date(report.inspection_date).toLocaleDateString()}</p>
                                    <p><strong>Status:</strong> ${report.status}</p>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <div class="invoices-section">
                        <h3>Recent Invoices</h3>
                        <div class="invoices-table">
                            <table class="table">
                                <thead>
                                    <tr>
                                        <th>Invoice #</th>
                                        <th>Amount</th>
                                        <th>Date</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${data.summary.recentInvoices.map(invoice => `
                                        <tr>
                                            <td>${invoice.invoice_number}</td>
                                            <td>$${invoice.amount}</td>
                                            <td>${new Date(invoice.created_at).toLocaleDateString()}</td>
                                            <td><span class="badge badge-${invoice.status}">${invoice.status}</span></td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async logout() {
        this.sdk.logout();
        this.showLoginForm();
    }
}

// Auto-initialize WordPress integration
if (typeof window !== 'undefined') {
    window.laapakWordPress = new LaapakWordPressIntegration();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { LaapakRemoteSDK, LaapakWordPressIntegration };
}
