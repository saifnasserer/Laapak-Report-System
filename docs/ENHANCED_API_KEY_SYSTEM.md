# 🔑 Enhanced API Key Access System Documentation

## 🎯 **Overview**

The Enhanced API Key Access System provides secure, permission-based access to client data including reports, invoices, and financial information. This system replaces the simple hardcoded API keys with a comprehensive, database-driven solution.

## 🏗️ **System Architecture**

### **Database Schema**
- **api_keys**: Stores API key information, permissions, and metadata
- **api_usage_logs**: Tracks all API usage for analytics and security
- **Enhanced relationships**: Links API keys to clients and admins

### **Authentication Levels**
1. **System API Keys**: Global access to all data
2. **Client-Specific API Keys**: Limited to specific client data
3. **Permission-Based Access**: Granular control over data access

## 🔐 **API Key Types**

### **1. System API Keys**
```javascript
// Format: ak_live_[64-char-hash]
// Access: All system data
// Use case: System integrations, admin tools
```

### **2. Client API Keys**
```javascript
// Format: ak_live_[64-char-hash]
// Access: Specific client data only
// Use case: Client portals, third-party integrations
```

### **3. Test API Keys**
```javascript
// Format: ak_test_[64-char-hash]
// Access: Limited test data
// Use case: Development and testing
```

## 📊 **Permission System**

### **Permission Structure**
```javascript
{
  "reports": {
    "read": true,
    "write": false,
    "delete": false
  },
  "invoices": {
    "read": true,
    "write": false,
    "delete": false
  },
  "clients": {
    "read": true,
    "write": false,
    "delete": false
  },
  "financial": {
    "read": false,
    "write": false,
    "delete": false
  }
}
```

### **Permission Levels**
- **read**: View data
- **write**: Create/update data
- **delete**: Remove data

## 🚀 **API Endpoints**

### **Base URLs**
- **Development**: `http://localhost:3000/api/v2/external`
- **Production**: `https://reports.laapak.com/api/v2/external`

### **Authentication Header**
```http
x-api-key: ak_live_your_api_key_here
```

## 📋 **Client Authentication**

### **Verify Client Credentials**
```http
POST /api/v2/external/auth/verify-client
Content-Type: application/json
x-api-key: ak_live_your_api_key_here

{
  "phone": "01128260256",
  "orderCode": "ORD123456",
  "email": "client@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "client": {
    "id": 1,
    "name": "Client Name",
    "phone": "01128260256",
    "email": "client@example.com",
    "status": "active",
    "createdAt": "2024-01-15T10:00:00Z",
    "lastLogin": "2024-01-20T15:30:00Z"
  },
  "message": "Client verified successfully"
}
```

## 📊 **Reports Access**

### **Get Client Reports**
```http
GET /api/v2/external/clients/{id}/reports
x-api-key: ak_live_your_api_key_here
```

**Query Parameters:**
- `status`: Filter by report status
- `startDate`: Filter from date (YYYY-MM-DD)
- `endDate`: Filter to date (YYYY-MM-DD)
- `deviceModel`: Filter by device model
- `limit`: Number of results (default: 50)
- `offset`: Pagination offset (default: 0)
- `sortBy`: Sort field (default: created_at)
- `sortOrder`: Sort direction (ASC/DESC, default: DESC)

**Response:**
```json
{
  "success": true,
  "reports": [
    {
      "id": "RPT123456",
      "device_model": "iPhone 15",
      "serial_number": "ABC123",
      "inspection_date": "2024-01-15T10:00:00Z",
      "status": "active",
      "billing_enabled": true,
      "amount": "500.00",
      "invoice_created": true,
      "invoice_id": "INV123456",
      "invoice_date": "2024-01-15T11:00:00Z",
      "created_at": "2024-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "total": 25,
    "limit": 50,
    "offset": 0,
    "hasMore": false
  }
}
```

### **Get Specific Report**
```http
GET /api/v2/external/reports/{id}
x-api-key: ak_live_your_api_key_here
```

## 💰 **Invoices Access**

### **Get Client Invoices**
```http
GET /api/v2/external/clients/{id}/invoices
x-api-key: ak_live_your_api_key_here
```

**Query Parameters:**
- `paymentStatus`: Filter by payment status
- `startDate`: Filter from date
- `endDate`: Filter to date
- `limit`: Number of results
- `offset`: Pagination offset

**Response:**
```json
{
  "success": true,
  "invoices": [
    {
      "id": "INV123456",
      "date": "2024-01-15T10:00:00Z",
      "subtotal": "500.00",
      "discount": "0.00",
      "tax": "75.00",
      "total": "575.00",
      "paymentStatus": "paid",
      "paymentMethod": "cash",
      "paymentDate": "2024-01-15T12:00:00Z",
      "created_at": "2024-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "total": 10,
    "limit": 50,
    "offset": 0,
    "hasMore": false
  }
}
```

### **Get Specific Invoice with Items**
```http
GET /api/v2/external/invoices/{id}
x-api-key: ak_live_your_api_key_here
```

## 🔄 **Bulk Operations**

### **Bulk Client Lookup**
```http
POST /api/v2/external/clients/bulk-lookup
Content-Type: application/json
x-api-key: ak_live_your_api_key_here

{
  "phones": ["01128260256", "01234567890"],
  "emails": ["client1@example.com", "client2@example.com"],
  "orderCodes": ["ORD123456", "ORD789012"]
}
```

### **Client Data Export**
```http
GET /api/v2/external/clients/{id}/data-export?format=json
x-api-key: ak_live_your_api_key_here
```

**Response:**
```json
{
  "success": true,
  "data": {
    "client": { /* client info */ },
    "reports": [ /* all reports */ ],
    "invoices": [ /* all invoices */ ],
    "summary": {
      "total_reports": 25,
      "total_invoices": 10,
      "total_amount": 5750.00,
      "export_date": "2024-01-20T15:30:00Z"
    }
  }
}
```

## 💵 **Financial Access**

### **Get Financial Summary**
```http
GET /api/v2/external/financial/summary
x-api-key: ak_live_your_api_key_here
```

**Query Parameters:**
- `startDate`: Start date (YYYY-MM-DD)
- `endDate`: End date (YYYY-MM-DD)

### **Get Financial Ledger**
```http
GET /api/v2/external/financial/ledger
x-api-key: ak_live_your_api_key_here
```

**Query Parameters:**
- `type`: `income`, `expense`, or `all`
- `limit`: Number of results
- `offset`: Pagination offset

### **Get Expenses**
```http
GET /api/v2/external/financial/expenses
x-api-key: ak_live_your_api_key_here
```

**Query Parameters:**
- `page`: Page number
- `limit`: Items per page
- `category_id`: Filter by category ID
- `search`: Search in name or description

### **Create Expense**
```http
POST /api/v2/external/financial/expenses
Content-Type: application/json
x-api-key: ak_live_your_api_key_here

{
  "name": "Office Supplies",
  "amount": 250.00,
  "category_id": 1,
  "date": "2024-02-01",
  "money_location_id": 1
}
```

### **Get Expense Categories**
```http
GET /api/v2/external/financial/expense-categories
x-api-key: ak_live_your_api_key_here
```

### **Get Money Locations**
```http
GET /api/v2/external/financial/locations
x-api-key: ak_live_your_api_key_here
```

## 🛡️ **Security Features**

### **Rate Limiting**
- **Default**: 1000 requests per hour
- **Configurable**: Per API key
- **Response**: 429 status with retry-after header

### **IP Whitelisting**
- **Optional**: Restrict access to specific IP addresses
- **Format**: Comma-separated list
- **Example**: "192.168.1.100,10.0.0.50"

### **API Key Expiration**
- **Optional**: Set expiration date
- **Format**: ISO 8601 datetime
- **Response**: 401 status when expired

### **Usage Logging**
- **All requests**: Logged with metadata
- **Analytics**: Usage statistics and patterns
- **Security**: Suspicious activity detection

## 📈 **Analytics & Monitoring**

### **Health Check**
```http
GET /api/v2/external/health
x-api-key: ak_live_your_api_key_here
```

**Response:**
```json
{
  "success": true,
  "message": "API key authentication successful",
  "timestamp": "2024-01-20T15:30:00Z",
  "apiKey": {
    "name": "Client Portal Key",
    "permissions": { /* permissions object */ },
    "rateLimit": 1000
  }
}
```

### **Usage Statistics**
```http
GET /api/v2/external/usage-stats?days=30
x-api-key: ak_live_your_api_key_here
```

## 🔧 **Admin Management**

### **Create API Key**
```http
POST /api/admin/api-keys
Content-Type: application/json
x-auth-token: your_jwt_token

{
  "key_name": "Client Portal Key",
  "client_id": 1,
  "permissions": {
    "reports": { "read": true, "write": false, "delete": false },
    "invoices": { "read": true, "write": false, "delete": false }
  },
  "rate_limit": 1000,
  "expires_at": "2024-12-31T23:59:59Z",
  "ip_whitelist": "192.168.1.100,10.0.0.50",
  "description": "API key for client portal integration"
}
```

### **Get API Keys**
```http
GET /api/admin/api-keys?client_id=1&is_active=true&limit=50&offset=0
x-auth-token: your_jwt_token
```

### **Update API Key**
```http
PUT /api/admin/api-keys/{id}
Content-Type: application/json
x-auth-token: your_jwt_token

{
  "permissions": {
    "reports": { "read": true, "write": true, "delete": false }
  },
  "rate_limit": 2000,
  "is_active": true
}
```

### **Regenerate API Key**
```http
POST /api/admin/api-keys/{id}/regenerate
x-auth-token: your_jwt_token
```

## 🚨 **Error Handling**

### **Common Error Responses**

```json
// 401 Unauthorized - Invalid API Key
{
  "message": "Invalid API key",
  "error": "INVALID_API_KEY"
}

// 401 Unauthorized - API Key Expired
{
  "message": "API key has expired",
  "error": "API_KEY_EXPIRED"
}

// 403 Forbidden - IP Not Whitelisted
{
  "message": "IP address not allowed",
  "error": "IP_NOT_WHITELISTED"
}

// 403 Forbidden - Insufficient Permissions
{
  "message": "Access denied: read permission required for reports",
  "error": "INSUFFICIENT_PERMISSIONS"
}

// 429 Too Many Requests - Rate Limit Exceeded
{
  "message": "Rate limit exceeded",
  "error": "RATE_LIMIT_EXCEEDED",
  "retry_after": 3600
}

// 404 Not Found - Client Not Found
{
  "message": "Client not found",
  "error": "CLIENT_NOT_FOUND"
}
```

## 💻 **JavaScript SDK Example**

```javascript
class LaapakEnhancedAPI {
    constructor(baseUrl = 'https://reports.laapak.com/api/v2/external', apiKey) {
        this.baseUrl = baseUrl;
        this.apiKey = apiKey;
    }

    async makeRequest(endpoint, method = 'GET', data = null, queryParams = {}) {
        const url = new URL(`${this.baseUrl}${endpoint}`);
        
        // Add query parameters
        Object.keys(queryParams).forEach(key => {
            if (queryParams[key] !== undefined) {
                url.searchParams.append(key, queryParams[key]);
            }
        });
        
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.apiKey
            }
        };
        
        if (data && (method === 'POST' || method === 'PUT')) {
            options.body = JSON.stringify(data);
        }
        
        const response = await fetch(url, options);
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`API Error: ${response.status} ${errorData.message}`);
        }
        
        return await response.json();
    }

    // Client authentication
    async verifyClient(phone, orderCode, email = null) {
        return await this.makeRequest('/auth/verify-client', 'POST', {
            phone, orderCode, email
        });
    }

    // Get client reports
    async getClientReports(clientId, filters = {}) {
        return await this.makeRequest(`/clients/${clientId}/reports`, 'GET', null, filters);
    }

    // Get client invoices
    async getClientInvoices(clientId, filters = {}) {
        return await this.makeRequest(`/clients/${clientId}/invoices`, 'GET', null, filters);
    }

    // Get specific report
    async getReport(reportId) {
        return await this.makeRequest(`/reports/${reportId}`);
    }

    // Get specific invoice
    async getInvoice(invoiceId) {
        return await this.makeRequest(`/invoices/${invoiceId}`);
    }

    // Bulk client lookup
    async bulkLookupClients(phones = [], emails = [], orderCodes = []) {
        return await this.makeRequest('/clients/bulk-lookup', 'POST', {
            phones, emails, orderCodes
        });
    }

    // Export client data
    async exportClientData(clientId, format = 'json') {
        return await this.makeRequest(`/clients/${clientId}/data-export?format=${format}`);
    }

    // Health check
    async healthCheck() {
        return await this.makeRequest('/health');
    }
}

// Usage Example
const api = new LaapakEnhancedAPI('https://reports.laapak.com/api/v2/external', 'ak_live_your_api_key_here');

// Verify client
const client = await api.verifyClient('01128260256', 'ORD123456');
console.log('Client verified:', client.client);

// Get client reports
const reports = await api.getClientReports(client.client.id, {
    status: 'active',
    limit: 10
});
console.log('Client reports:', reports.reports);

// Get client invoices
const invoices = await api.getClientInvoices(client.client.id, {
    paymentStatus: 'paid',
    limit: 10
});
console.log('Client invoices:', invoices.invoices);
```

## 🔄 **Migration from Old System**

### **Old API Endpoints**
```javascript
// OLD (deprecated)
GET /api/external/clients/lookup?phone=01128260256
GET /api/external/clients/1/reports
GET /api/external/clients/1/invoices
```

### **New API Endpoints**
```javascript
// NEW (recommended)
POST /api/v2/external/auth/verify-client
GET /api/v2/external/clients/1/reports
GET /api/v2/external/clients/1/invoices
```

### **Migration Steps**
1. **Update API endpoints** to use `/api/v2/external`
2. **Implement new authentication** with enhanced API keys
3. **Add permission handling** for different access levels
4. **Update error handling** for new error codes
5. **Test thoroughly** with new rate limiting and security features

## 🚀 **Deployment Checklist**

### **Database Setup**
- [ ] Run migration scripts for new tables
- [ ] Create initial admin API keys
- [ ] Set up proper indexes for performance

### **Security Configuration**
- [ ] Configure rate limiting
- [ ] Set up IP whitelisting if needed
- [ ] Enable usage logging
- [ ] Test API key expiration

### **Monitoring Setup**
- [ ] Set up usage analytics
- [ ] Configure security alerts
- [ ] Monitor rate limit violations
- [ ] Track API key usage patterns

This enhanced API key system provides a robust, secure, and scalable solution for client data access with comprehensive monitoring and management capabilities.
