# Laapak Report System - Remote Integration Guide

## 🎯 **Overview**

This guide shows you how to integrate with the Laapak Report System remotely to access client data, reports, invoices, and warranty information from external applications.

## 🔑 **Authentication Methods**

### **Method 1: JWT Token Authentication (Recommended)**

```javascript
class LaapakRemoteClient {
    constructor(config = {}) {
        this.baseUrl = config.baseUrl || 'https://reports.laapak.com';
        this.token = null;
        this.clientInfo = null;
    }

    // Step 1: Login to get JWT token
    async login(phone, password) {
        try {
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
                throw new Error(`Login failed: ${response.status}`);
            }

            const data = await response.json();
            this.token = data.token;
            this.clientInfo = data.client;
            
            // Store for future use
            localStorage.setItem('laapakToken', this.token);
            localStorage.setItem('laapakClientInfo', JSON.stringify(this.clientInfo));
            
            return data;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    // Step 2: Get authentication headers
    getAuthHeaders() {
        return {
            'Content-Type': 'application/json',
            'x-auth-token': this.token
        };
    }
}
```

### **Method 2: API Key Authentication**

```javascript
class LaapakApiKeyClient {
    constructor(config = {}) {
        this.baseUrl = config.baseUrl || 'https://reports.laapak.com';
        this.apiKey = config.apiKey || 'laapak-api-key-2024';
        this.clientId = config.clientId;
    }

    getAuthHeaders() {
        const headers = {
            'Content-Type': 'application/json',
            'x-api-key': this.apiKey
        };
        
        if (this.clientId) {
            headers['x-client-id'] = this.clientId;
        }
        
        return headers;
    }
}
```

## 📊 **Core Data Access Methods**

### **1. Get Client Reports**

```javascript
async getClientReports() {
    try {
        const response = await fetch(`${this.baseUrl}/api/reports/client/me`, {
            method: 'GET',
            headers: this.getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch reports: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching reports:', error);
        throw error;
    }
}
```

### **2. Get Client Invoices**

```javascript
async getClientInvoices() {
    try {
        const response = await fetch(`${this.baseUrl}/api/invoices/client`, {
            method: 'GET',
            headers: this.getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch invoices: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching invoices:', error);
        throw error;
    }
}
```

### **3. Search Reports**

```javascript
async searchReports(query) {
    try {
        const response = await fetch(`${this.baseUrl}/api/reports/search?q=${encodeURIComponent(query)}`, {
            method: 'GET',
            headers: this.getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error(`Search failed: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Search error:', error);
        throw error;
    }
}
```

### **4. Get Specific Report**

```javascript
async getReport(reportId) {
    try {
        const response = await fetch(`${this.baseUrl}/api/reports/${reportId}`, {
            method: 'GET',
            headers: this.getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch report: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching report:', error);
        throw error;
    }
}
```

## 🔧 **Complete Implementation Example**

### **WordPress Integration**

```javascript
class WordPressLaapakIntegration {
    constructor() {
        this.baseUrl = 'https://reports.laapak.com';
        this.token = null;
        this.clientInfo = null;
    }

    // Initialize with stored credentials
    async initialize() {
        // Try to get stored token
        this.token = localStorage.getItem('laapakToken');
        this.clientInfo = JSON.parse(localStorage.getItem('laapakClientInfo') || 'null');
        
        if (this.token && this.clientInfo) {
            console.log('✅ Using stored credentials');
            return true;
        }
        
        return false;
    }

    // Login with WordPress user credentials
    async loginWithWordPressUser() {
        try {
            // Get WordPress user data
            const wpUser = wp_get_current_user();
            const phone = wpUser.user_phone || wpUser.user_login;
            const password = wpUser.user_password; // You'll need to handle this securely
            
            return await this.login(phone, password);
        } catch (error) {
            console.error('WordPress login failed:', error);
            throw error;
        }
    }

    // Get client dashboard data
    async getClientDashboard() {
        try {
            const [reports, invoices] = await Promise.all([
                this.getClientReports(),
                this.getClientInvoices()
            ]);

            return {
                reports: reports,
                invoices: invoices,
                client: this.clientInfo,
                summary: {
                    totalReports: reports.length,
                    totalInvoices: invoices.length,
                    totalAmount: invoices.reduce((sum, invoice) => sum + (invoice.amount || 0), 0)
                }
            };
        } catch (error) {
            console.error('Dashboard data error:', error);
            throw error;
        }
    }

    // Display reports in WordPress
    displayReportsInWordPress(reports) {
        const container = document.getElementById('laapak-reports');
        if (!container) return;

        container.innerHTML = `
            <div class="laapak-reports-container">
                <h3>Your Reports (${reports.length})</h3>
                <div class="reports-grid">
                    ${reports.map(report => `
                        <div class="report-card">
                            <h4>${report.order_number}</h4>
                            <p><strong>Device:</strong> ${report.device_model}</p>
                            <p><strong>Date:</strong> ${new Date(report.inspection_date).toLocaleDateString()}</p>
                            <p><strong>Status:</strong> ${report.status}</p>
                            <a href="#" onclick="viewReport(${report.id})" class="btn btn-primary">View Report</a>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // Display invoices in WordPress
    displayInvoicesInWordPress(invoices) {
        const container = document.getElementById('laapak-invoices');
        if (!container) return;

        container.innerHTML = `
            <div class="laapak-invoices-container">
                <h3>Your Invoices (${invoices.length})</h3>
                <div class="invoices-table">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Invoice #</th>
                                <th>Amount</th>
                                <th>Date</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${invoices.map(invoice => `
                                <tr>
                                    <td>${invoice.invoice_number}</td>
                                    <td>$${invoice.amount}</td>
                                    <td>${new Date(invoice.created_at).toLocaleDateString()}</td>
                                    <td><span class="badge badge-${invoice.status}">${invoice.status}</span></td>
                                    <td>
                                        <a href="#" onclick="viewInvoice(${invoice.id})" class="btn btn-sm btn-outline-primary">View</a>
                                        <a href="#" onclick="downloadInvoice(${invoice.id})" class="btn btn-sm btn-outline-success">Download</a>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }
}
```

## 🚀 **Usage Examples**

### **Example 1: Basic Client Data Access**

```javascript
// Initialize the client
const laapakClient = new LaapakRemoteClient({
    baseUrl: 'https://reports.laapak.com'
});

// Login and get data
async function loadClientData() {
    try {
        // Login
        await laapakClient.login('+1234567890', 'password123');
        
        // Get reports
        const reports = await laapakClient.getClientReports();
        console.log('Client reports:', reports);
        
        // Get invoices
        const invoices = await laapakClient.getClientInvoices();
        console.log('Client invoices:', invoices);
        
    } catch (error) {
        console.error('Error:', error);
    }
}
```

### **Example 2: WordPress Plugin Integration**

```javascript
// WordPress plugin integration
class LaapakWordPressPlugin {
    constructor() {
        this.laapakClient = new LaapakRemoteClient();
        this.init();
    }

    async init() {
        // Check if user is logged in
        if (!this.laapakClient.initialize()) {
            // Show login form
            this.showLoginForm();
            return;
        }

        // Load client data
        await this.loadClientData();
    }

    showLoginForm() {
        const container = document.getElementById('laapak-container');
        container.innerHTML = `
            <div class="laapak-login-form">
                <h3>Access Your Reports</h3>
                <form id="laapak-login">
                    <div class="form-group">
                        <label>Phone Number:</label>
                        <input type="tel" id="phone" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label>Password:</label>
                        <input type="password" id="password" class="form-control" required>
                    </div>
                    <button type="submit" class="btn btn-primary">Login</button>
                </form>
            </div>
        `;

        // Handle login form submission
        document.getElementById('laapak-login').addEventListener('submit', async (e) => {
            e.preventDefault();
            const phone = document.getElementById('phone').value;
            const password = document.getElementById('password').value;
            
            try {
                await this.laapakClient.login(phone, password);
                await this.loadClientData();
            } catch (error) {
                alert('Login failed: ' + error.message);
            }
        });
    }

    async loadClientData() {
        try {
            const dashboardData = await this.laapakClient.getClientDashboard();
            
            // Display data
            this.displayReportsInWordPress(dashboardData.reports);
            this.displayInvoicesInWordPress(dashboardData.invoices);
            
        } catch (error) {
            console.error('Failed to load client data:', error);
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new LaapakWordPressPlugin();
});
```

### **Example 3: React Component Integration**

```jsx
import React, { useState, useEffect } from 'react';

const LaapakClientDashboard = () => {
    const [client, setClient] = useState(null);
    const [reports, setReports] = useState([]);
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadClientData();
    }, []);

    const loadClientData = async () => {
        try {
            setLoading(true);
            
            const laapakClient = new LaapakRemoteClient({
                baseUrl: 'https://reports.laapak.com'
            });

            // Login (you might want to handle this differently)
            await laapakClient.login('+1234567890', 'password123');

            const [reportsData, invoicesData] = await Promise.all([
                laapakClient.getClientReports(),
                laapakClient.getClientInvoices()
            ]);

            setReports(reportsData);
            setInvoices(invoicesData);
            setLoading(false);
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div className="laapak-dashboard">
            <h2>Your Reports & Invoices</h2>
            
            <div className="reports-section">
                <h3>Reports ({reports.length})</h3>
                <div className="reports-grid">
                    {reports.map(report => (
                        <div key={report.id} className="report-card">
                            <h4>{report.order_number}</h4>
                            <p>Device: {report.device_model}</p>
                            <p>Date: {new Date(report.inspection_date).toLocaleDateString()}</p>
                            <p>Status: {report.status}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="invoices-section">
                <h3>Invoices ({invoices.length})</h3>
                <div className="invoices-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Invoice #</th>
                                <th>Amount</th>
                                <th>Date</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoices.map(invoice => (
                                <tr key={invoice.id}>
                                    <td>{invoice.invoice_number}</td>
                                    <td>${invoice.amount}</td>
                                    <td>{new Date(invoice.created_at).toLocaleDateString()}</td>
                                    <td>{invoice.status}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default LaapakClientDashboard;
```

## 🔒 **Security Best Practices**

### **1. Token Management**

```javascript
class SecureLaapakClient {
    constructor() {
        this.baseUrl = 'https://reports.laapak.com';
        this.token = null;
        this.tokenExpiry = null;
    }

    // Store token securely
    storeToken(token, expiry) {
        this.token = token;
        this.tokenExpiry = expiry;
        
        // Store in secure storage
        sessionStorage.setItem('laapakToken', token);
        sessionStorage.setItem('laapakTokenExpiry', expiry);
    }

    // Check if token is valid
    isTokenValid() {
        if (!this.token || !this.tokenExpiry) return false;
        return new Date() < new Date(this.tokenExpiry);
    }

    // Auto-refresh token if needed
    async ensureValidToken() {
        if (!this.isTokenValid()) {
            // Refresh token or re-login
            await this.refreshToken();
        }
    }

    async refreshToken() {
        // Implement token refresh logic
        throw new Error('Token refresh not implemented');
    }
}
```

### **2. Error Handling**

```javascript
class RobustLaapakClient {
    async makeRequest(endpoint, options = {}) {
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
                    // Token expired, try to refresh
                    await this.refreshToken();
                    return this.makeRequest(endpoint, options);
                }
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Request failed:', error);
            throw error;
        }
    }
}
```

## 📱 **Mobile App Integration**

### **React Native Example**

```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

class LaapakMobileClient {
    constructor() {
        this.baseUrl = 'https://reports.laapak.com';
    }

    async login(phone, password) {
        try {
            const response = await fetch(`${this.baseUrl}/api/auth/client/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ phone, password })
            });

            const data = await response.json();
            
            // Store securely
            await AsyncStorage.setItem('laapakToken', data.token);
            await AsyncStorage.setItem('laapakClientInfo', JSON.stringify(data.client));
            
            return data;
        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        }
    }

    async getStoredToken() {
        return await AsyncStorage.getItem('laapakToken');
    }

    async getClientReports() {
        const token = await this.getStoredToken();
        
        const response = await fetch(`${this.baseUrl}/api/reports/client/me`, {
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token
            }
        });

        return await response.json();
    }
}
```

## 🎯 **Quick Start Checklist**

1. **Choose Authentication Method**
   - [ ] JWT Token (recommended)
   - [ ] API Key + Client ID

2. **Implement Basic Client**
   - [ ] Login functionality
   - [ ] Token management
   - [ ] Error handling

3. **Add Data Access Methods**
   - [ ] Get client reports
   - [ ] Get client invoices
   - [ ] Search functionality

4. **Integrate with Your Platform**
   - [ ] WordPress plugin
   - [ ] React component
   - [ ] Mobile app
   - [ ] Custom web app

5. **Test Integration**
   - [ ] Test authentication
   - [ ] Test data retrieval
   - [ ] Test error scenarios
   - [ ] Test offline scenarios

## 📞 **Support & Troubleshooting**

### **Common Issues**

1. **401 Unauthorized**: Check token validity
2. **404 Not Found**: Verify API endpoints
3. **CORS Issues**: Configure server CORS settings
4. **Token Expiry**: Implement token refresh

### **Debug Tools**

```javascript
// Debug helper
function debugLaapakConnection() {
    console.log('🔍 Laapak Connection Debug:');
    console.log('Base URL:', this.baseUrl);
    console.log('Token exists:', !!this.token);
    console.log('Token valid:', this.isTokenValid());
    console.log('Client info:', this.clientInfo);
}
```

This guide provides everything you need to integrate with the Laapak Report System remotely. Choose the authentication method that works best for your use case and implement the appropriate integration pattern.
