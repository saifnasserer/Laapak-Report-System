# Laapak Report System - API Key Access Guide

## 🔑 **API Key Authentication**

You can now access the Laapak Report System API using API keys instead of user login credentials. This is perfect for external system integration.

## **API Keys Available**

### **Default API Keys:**
- `laapak-api-key-2024` (Primary key)
- `laapak-external-access-key` (Secondary key)
- `laapak-integration-key` (Integration key)

### **Environment Variable:**
Set `API_KEY` environment variable for custom key:
```bash
export API_KEY="your-custom-api-key"
```

## **API Endpoints with API Key**

### **Base URL:**
- **Development**: `http://localhost:3000/api/external`
- **Production**: `https://reports.laapak.com/api/external`

### **Authentication Header:**
```http
x-api-key: laapak-api-key-2024
```

## **Available Endpoints**

### 1. **Client Lookup by Phone**
```http
GET /api/external/clients/lookup?phone=01128260256
x-api-key: laapak-api-key-2024
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
        "createdAt": "2024-01-15T10:00:00Z"
    }
}
```

### 2. **Client Lookup by Email**
```http
GET /api/external/clients/lookup?email=client@example.com
x-api-key: laapak-api-key-2024
```

### 3. **Client Verification (Phone + Order Code)**
```http
POST /api/external/clients/verify
x-api-key: laapak-api-key-2024
Content-Type: application/json

{
    "phone": "01128260256",
    "orderCode": "ORD123456"
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
        "status": "active"
    },
    "message": "Client verified successfully"
}
```

### 4. **Get Client's Reports**
```http
GET /api/external/clients/1/reports
x-api-key: laapak-api-key-2024
```

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
            "createdAt": "2024-01-15T10:00:00Z"
        }
    ],
    "count": 1
}
```

### 5. **Get Client's Invoices**
```http
GET /api/external/clients/1/invoices
x-api-key: laapak-api-key-2024
```

**Response:**
```json
{
    "success": true,
    "invoices": [
        {
            "id": "INV123456",
            "total": "500.00",
            "paymentStatus": "paid",
            "date": "2024-01-15T10:00:00Z",
            "createdAt": "2024-01-15T10:00:00Z"
        }
    ],
    "count": 1
}
```

### 6. **Health Check**
```http
GET /api/external/health
x-api-key: laapak-api-key-2024
```

## **JavaScript Integration**

```javascript
class LaapakAPI {
    constructor(baseUrl = 'https://reports.laapak.com/api/external', apiKey = 'laapak-api-key-2024') {
        this.baseUrl = baseUrl;
        this.apiKey = apiKey;
    }

    async makeRequest(endpoint, method = 'GET', data = null) {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.apiKey
            }
        };

        if (data) {
            options.body = JSON.stringify(data);
        }

        const response = await fetch(`${this.baseUrl}${endpoint}`, options);
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        return await response.json();
    }

    // Lookup client by phone
    async lookupClientByPhone(phone) {
        return await this.makeRequest(`/clients/lookup?phone=${phone}`);
    }

    // Lookup client by email
    async lookupClientByEmail(email) {
        return await this.makeRequest(`/clients/lookup?email=${email}`);
    }

    // Verify client credentials
    async verifyClient(phone, orderCode) {
        return await this.makeRequest('/clients/verify', 'POST', { phone, orderCode });
    }

    // Get client's reports
    async getClientReports(clientId) {
        return await this.makeRequest(`/clients/${clientId}/reports`);
    }

    // Get client's invoices
    async getClientInvoices(clientId) {
        return await this.makeRequest(`/clients/${clientId}/invoices`);
    }

    // Health check
    async healthCheck() {
        return await this.makeRequest('/health');
    }
}

// Usage Example
const api = new LaapakAPI();

// Test connection
try {
    const health = await api.healthCheck();
    console.log('✅ API Connection successful:', health);
} catch (error) {
    console.error('❌ API Connection failed:', error.message);
}

// Lookup client by phone
try {
    const client = await api.lookupClientByPhone('01128260256');
    console.log('Client found:', client.client);
} catch (error) {
    console.error('Client lookup failed:', error.message);
}

// Verify client credentials
try {
    const verification = await api.verifyClient('01128260256', 'ORD123456');
    console.log('Client verified:', verification.client);
} catch (error) {
    console.error('Client verification failed:', error.message);
}
```

## **cURL Examples**

### **Test API Key Authentication**
```bash
curl -X GET https://reports.laapak.com/api/external/health \
  -H "x-api-key: laapak-api-key-2024"
```

### **Lookup Client by Phone**
```bash
curl -X GET "https://reports.laapak.com/api/external/clients/lookup?phone=01128260256" \
  -H "x-api-key: laapak-api-key-2024"
```

### **Verify Client Credentials**
```bash
curl -X POST https://reports.laapak.com/api/external/clients/verify \
  -H "x-api-key: laapak-api-key-2024" \
  -H "Content-Type: application/json" \
  -d '{"phone": "01128260256", "orderCode": "ORD123456"}'
```

### **Get Client Reports**
```bash
curl -X GET https://reports.laapak.com/api/external/clients/1/reports \
  -H "x-api-key: laapak-api-key-2024"
```

## **Error Handling**

### **Common Error Responses**

```json
// 401 Unauthorized - Invalid API Key
{
    "message": "Invalid or missing API key",
    "error": "API_KEY_REQUIRED"
}

// 400 Bad Request - Missing Parameters
{
    "message": "Phone number or email is required",
    "error": "MISSING_PARAMETERS"
}

// 404 Not Found - Client Not Found
{
    "message": "Client not found",
    "error": "CLIENT_NOT_FOUND"
}

// 404 Not Found - Invalid Credentials
{
    "message": "Invalid credentials",
    "error": "INVALID_CREDENTIALS"
}
```

### **Error Handling Example**

```javascript
async function handleApiCall(apiFunction) {
    try {
        const result = await apiFunction();
        return { success: true, data: result };
    } catch (error) {
        if (error.message.includes('401')) {
            console.error('❌ Invalid API key');
        } else if (error.message.includes('404')) {
            console.error('❌ Client not found');
        } else if (error.message.includes('400')) {
            console.error('❌ Missing parameters');
        } else {
            console.error('❌ API Error:', error.message);
        }
        
        return { success: false, error: error.message };
    }
}
```

## **Your Specific Use Case**

Based on your error, you're trying to check if a user exists. Here's how to fix it:

### **Before (Causing 401 Error):**
```javascript
// ❌ This will fail - no authentication
fetch('https://reports.laapak.com/api/clients?phone=01128260256')
```

### **After (Using API Key):**
```javascript
// ✅ This will work - using API key
fetch('https://reports.laapak.com/api/external/clients/lookup?phone=01128260256', {
    headers: {
        'x-api-key': 'laapak-api-key-2024'
    }
})
```

### **Complete Solution for Your Code:**

```javascript
class LaapakUserChecker {
    constructor() {
        this.apiKey = 'laapak-api-key-2024';
        this.baseUrl = 'https://reports.laapak.com/api/external';
    }

    async checkUser(phone) {
        try {
            console.log(`[AUTH] Checking Laapak Reports user: ${phone}`);
            
            const response = await fetch(`${this.baseUrl}/clients/lookup?phone=${phone}`, {
                headers: {
                    'x-api-key': this.apiKey,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                if (response.status === 404) {
                    console.log('🔍 [AUTH] User not found in Laapak system');
                    return { found: false, message: 'User not found' };
                }
                throw new Error(`API Error: ${response.status}`);
            }

            const data = await response.json();
            console.log('✅ [AUTH] User found in Laapak system:', data.client);
            return { found: true, client: data.client };
            
        } catch (error) {
            console.error('❌ [AUTH] Laapak API error:', error.message);
            return { found: false, error: error.message };
        }
    }

    async verifyUser(phone, orderCode) {
        try {
            const response = await fetch(`${this.baseUrl}/clients/verify`, {
                method: 'POST',
                headers: {
                    'x-api-key': this.apiKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ phone, orderCode })
            });

            if (!response.ok) {
                if (response.status === 404) {
                    return { verified: false, message: 'Invalid credentials' };
                }
                throw new Error(`API Error: ${response.status}`);
            }

            const data = await response.json();
            return { verified: true, client: data.client };
            
        } catch (error) {
            console.error('❌ [AUTH] Verification error:', error.message);
            return { verified: false, error: error.message };
        }
    }
}

// Usage
const laapakChecker = new LaapakUserChecker();

// Check if user exists
const userCheck = await laapakChecker.checkUser('01128260256');
if (userCheck.found) {
    console.log('User found:', userCheck.client);
} else {
    console.log('User not found');
}

// Verify user credentials
const verification = await laapakChecker.verifyUser('01128260256', 'ORD123456');
if (verification.verified) {
    console.log('User verified:', verification.client);
} else {
    console.log('Verification failed');
}
```

## **Security Notes**

- API keys are for external system integration only
- Keep your API keys secure and don't expose them in client-side code
- Use HTTPS in production
- Monitor API key usage
- Rotate API keys regularly

This solution provides you with API key access to check users without requiring login credentials!
