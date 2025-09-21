# Laapak Report System - API Access Guide

## Overview
This guide provides complete instructions for accessing the Laapak Report System API from external systems, including authentication methods and API keys.

## Authentication Methods

The system uses **JWT (JSON Web Tokens)** for authentication. You need to authenticate first to get a token, then use that token for all subsequent API calls.

## Step 1: Get Authentication Token

### Method 1: Admin Authentication (Full Access)

```http
POST https://reports.laapak.com/api/auth/admin
Content-Type: application/json

{
    "username": "your_admin_username",
    "password": "your_admin_password"
}
```

**Response:**
```json
{
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
        "id": 1,
        "name": "Admin Name",
        "username": "admin",
        "role": "admin"
    }
}
```

### Method 2: Client Authentication (Limited Access)

```http
POST https://reports.laapak.com/api/clients/auth
Content-Type: application/json

{
    "phone": "1234567890",
    "orderCode": "ORD123456"
}
```

**Response:**
```json
{
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "client": {
        "id": 1,
        "name": "Client Name",
        "phone": "1234567890",
        "email": "client@example.com"
    }
}
```

## Step 2: Use Token in API Calls

Once you have the token, include it in the `x-auth-token` header for all API requests:

```http
GET https://reports.laapak.com/api/reports
x-auth-token: your-jwt-token-here
Content-Type: application/json
```

## Complete Integration Examples

### 1. JavaScript/Node.js Integration

```javascript
class LaapakAPI {
    constructor(baseUrl = 'https://reports.laapak.com/api') {
        this.baseUrl = baseUrl;
        this.token = null;
    }

    // Admin login
    async loginAdmin(username, password) {
        try {
            const response = await fetch(`${this.baseUrl}/auth/admin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            
            if (!response.ok) {
                throw new Error(`Login failed: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            this.token = data.token;
            return data;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    // Client login
    async loginClient(phone, orderCode) {
        try {
            const response = await fetch(`${this.baseUrl}/clients/auth`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, orderCode })
            });
            
            if (!response.ok) {
                throw new Error(`Login failed: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            this.token = data.token;
            return data;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    // Generic API request method
    async makeRequest(method, endpoint, data = null) {
        if (!this.token) {
            throw new Error('Not authenticated. Please login first.');
        }

        const url = `${this.baseUrl}${endpoint}`;
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': this.token
            }
        };

        if (data) {
            options.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(url, options);
            
            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Authentication failed. Token may be expired.');
                }
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API request error:', error);
            throw error;
        }
    }

    // API Methods
    async getReports(filters = {}) {
        const queryParams = new URLSearchParams(filters).toString();
        const endpoint = `/reports${queryParams ? '?' + queryParams : ''}`;
        return await this.makeRequest('GET', endpoint);
    }

    async getReport(id) {
        return await this.makeRequest('GET', `/reports/${id}`);
    }

    async createReport(reportData) {
        return await this.makeRequest('POST', '/reports', reportData);
    }

    async getInvoices(filters = {}) {
        const queryParams = new URLSearchParams(filters).toString();
        const endpoint = `/invoices${queryParams ? '?' + queryParams : ''}`;
        return await this.makeRequest('GET', endpoint);
    }

    async getInvoice(id) {
        return await this.makeRequest('GET', `/invoices/${id}`);
    }

    async createInvoice(invoiceData) {
        return await this.makeRequest('POST', '/invoices', invoiceData);
    }

    async getClients() {
        return await this.makeRequest('GET', '/users/clients');
    }

    async getClient(id) {
        return await this.makeRequest('GET', `/users/clients/${id}`);
    }

    async createClient(clientData) {
        return await this.makeRequest('POST', '/users/clients', clientData);
    }
}

// Usage Example
async function example() {
    const api = new LaapakAPI();
    
    try {
        // Login as admin
        await api.loginAdmin('your_username', 'your_password');
        
        // Get all reports
        const reports = await api.getReports();
        console.log('Reports:', reports);
        
        // Create a new client
        const newClient = await api.createClient({
            name: 'John Doe',
            phone: '1234567890',
            orderCode: 'ORD123456',
            email: 'john@example.com'
        });
        
        // Create a report for the client
        const report = await api.createReport({
            client_id: newClient.id,
            device_model: 'iPhone 15',
            serial_number: 'ABC123',
            inspection_date: new Date().toISOString(),
            billing_enabled: true,
            amount: 500.00
        });
        
    } catch (error) {
        console.error('Error:', error.message);
    }
}
```

### 2. Python Integration

```python
import requests
import json

class LaapakAPI:
    def __init__(self, base_url='https://reports.laapak.com/api'):
        self.base_url = base_url
        self.token = None
        self.session = requests.Session()

    def login_admin(self, username, password):
        """Login as admin"""
        url = f"{self.base_url}/auth/admin"
        data = {"username": username, "password": password}
        
        response = self.session.post(url, json=data)
        response.raise_for_status()
        
        result = response.json()
        self.token = result['token']
        return result

    def login_client(self, phone, order_code):
        """Login as client"""
        url = f"{self.base_url}/clients/auth"
        data = {"phone": phone, "orderCode": order_code}
        
        response = self.session.post(url, json=data)
        response.raise_for_status()
        
        result = response.json()
        self.token = result['token']
        return result

    def make_request(self, method, endpoint, data=None):
        """Make authenticated API request"""
        if not self.token:
            raise Exception("Not authenticated. Please login first.")
        
        url = f"{self.base_url}{endpoint}"
        headers = {
            'Content-Type': 'application/json',
            'x-auth-token': self.token
        }
        
        response = self.session.request(method, url, json=data, headers=headers)
        response.raise_for_status()
        return response.json()

    def get_reports(self, filters=None):
        """Get all reports"""
        endpoint = '/reports'
        if filters:
            params = '&'.join([f"{k}={v}" for k, v in filters.items()])
            endpoint += f"?{params}"
        return self.make_request('GET', endpoint)

    def create_report(self, report_data):
        """Create a new report"""
        return self.make_request('POST', '/reports', report_data)

    def get_invoices(self, filters=None):
        """Get all invoices"""
        endpoint = '/invoices'
        if filters:
            params = '&'.join([f"{k}={v}" for k, v in filters.items()])
            endpoint += f"?{params}"
        return self.make_request('GET', endpoint)

# Usage Example
api = LaapakAPI()

# Login
api.login_admin('your_username', 'your_password')

# Get reports
reports = api.get_reports()
print(f"Found {len(reports)} reports")

# Create a report
new_report = api.create_report({
    "client_id": 1,
    "device_model": "iPhone 15",
    "serial_number": "ABC123",
    "inspection_date": "2024-01-15T10:00:00Z",
    "billing_enabled": True,
    "amount": 500.00
})
```

### 3. cURL Examples

```bash
# 1. Login as admin
curl -X POST https://reports.laapak.com/api/auth/admin \
  -H "Content-Type: application/json" \
  -d '{"username": "your_username", "password": "your_password"}'

# 2. Use the token from response
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# 3. Get all reports
curl -X GET https://reports.laapak.com/api/reports \
  -H "x-auth-token: $TOKEN" \
  -H "Content-Type: application/json"

# 4. Create a new report
curl -X POST https://reports.laapak.com/api/reports \
  -H "x-auth-token: $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": 1,
    "device_model": "iPhone 15",
    "serial_number": "ABC123",
    "inspection_date": "2024-01-15T10:00:00Z",
    "billing_enabled": true,
    "amount": 500.00
  }'
```

## API Endpoints Reference

### Authentication Endpoints
- `POST /api/auth/admin` - Admin login
- `POST /api/clients/auth` - Client login
- `GET /api/auth/me` - Get current user info

### Report Endpoints
- `GET /api/reports` - Get all reports
- `GET /api/reports/:id` - Get specific report
- `POST /api/reports` - Create new report
- `PUT /api/reports/:id` - Update report
- `DELETE /api/reports/:id` - Delete report

### Invoice Endpoints
- `GET /api/invoices` - Get all invoices
- `GET /api/invoices/:id` - Get specific invoice
- `POST /api/invoices` - Create new invoice
- `PUT /api/invoices/:id` - Update invoice
- `DELETE /api/invoices/:id` - Delete invoice

### Client Endpoints
- `GET /api/users/clients` - Get all clients
- `GET /api/users/clients/:id` - Get specific client
- `POST /api/users/clients` - Create new client
- `PUT /api/users/clients/:id` - Update client
- `DELETE /api/users/clients/:id` - Delete client

## Error Handling

### Common Error Responses

```json
// 401 Unauthorized
{
    "message": "No token, authorization denied"
}

// 403 Forbidden
{
    "message": "Access denied. Admin privileges required."
}

// 400 Bad Request
{
    "message": "Please provide all required fields",
    "errors": ["Field is required"]
}

// 500 Internal Server Error
{
    "message": "Server error"
}
```

### Error Handling Example

```javascript
async function handleApiCall(apiFunction) {
    try {
        const result = await apiFunction();
        return { success: true, data: result };
    } catch (error) {
        if (error.message.includes('401')) {
            console.error('Authentication failed. Please login again.');
            // Redirect to login or refresh token
        } else if (error.message.includes('403')) {
            console.error('Access denied. Insufficient permissions.');
        } else if (error.message.includes('404')) {
            console.error('Resource not found.');
        } else {
            console.error('API Error:', error.message);
        }
        
        return { success: false, error: error.message };
    }
}
```

## Security Best Practices

### 1. Token Management
- Store tokens securely (not in localStorage for production)
- Implement token refresh mechanism
- Handle token expiration gracefully
- Use HTTPS only in production

### 2. Rate Limiting
- Implement rate limiting in your integration
- Handle 429 (Too Many Requests) responses
- Use exponential backoff for retries

### 3. Data Validation
- Validate all data before sending to API
- Handle API validation errors appropriately
- Implement proper error handling

## Testing Your Integration

### 1. Test Authentication
```javascript
// Test admin login
const api = new LaapakAPI();
try {
    const result = await api.loginAdmin('test_admin', 'test_password');
    console.log('Login successful:', result);
} catch (error) {
    console.error('Login failed:', error.message);
}
```

### 2. Test API Calls
```javascript
// Test getting reports
try {
    const reports = await api.getReports();
    console.log('Reports retrieved:', reports.length);
} catch (error) {
    console.error('Failed to get reports:', error.message);
}
```

## Troubleshooting

### Common Issues

1. **"Unauthorized" Error**
   - Make sure you're including the `x-auth-token` header
   - Check if your token has expired (tokens expire after 24 hours)
   - Verify you're using the correct authentication endpoint

2. **"Access Denied" Error**
   - Check if you have the required permissions
   - Admin endpoints require admin authentication
   - Client endpoints require client authentication

3. **CORS Errors**
   - Ensure your domain is whitelisted in the CORS configuration
   - Use HTTPS in production
   - Check browser console for CORS errors

4. **Connection Errors**
   - Verify the API URL is correct
   - Check if the server is running
   - Ensure network connectivity

## Support

If you continue to have issues:

1. Check the server logs for detailed error messages
2. Verify your authentication credentials
3. Ensure you're using the correct API endpoints
4. Test with a simple cURL request first
5. Contact the system administrator for additional support

This guide should help you successfully integrate with the Laapak Report System API from any external system.
