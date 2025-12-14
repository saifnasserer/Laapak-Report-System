# 🔑 Third-Party API Integration Guide

## 📋 **Overview**

This guide provides step-by-step instructions for third-party developers to integrate with the Laapak Report System using API keys. The system allows secure access to client data including reports, invoices, and financial information.

## 🚀 **Quick Start**

### **1. Get Your API Key**
Contact the Laapak system administrator to obtain your API key. You'll receive:
- **API Key**: `ak_live_[64-character-hash]`
- **Base URL**: `https://reports.laapak.com/api/v2/external`
- **Permissions**: Specific access rights for your integration

### **2. Test Your Connection**
```bash
curl -X GET "https://reports.laapak.com/api/v2/external/health" \
  -H "x-api-key: ak_live_your_api_key_here"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "API key authentication successful",
  "timestamp": "2024-01-20T15:30:00Z",
  "apiKey": {
    "name": "Your Integration Key",
    "permissions": {
      "reports": {"read": true, "write": false, "delete": false},
      "invoices": {"read": true, "write": false, "delete": false},
      "clients": {"read": true, "write": false, "delete": false}
    },
    "rateLimit": 1000
  }
}
```

## 🔐 **Authentication**

### **Required Headers**
Every API request must include:
```http
x-api-key: ak_live_your_api_key_here
Content-Type: application/json
```

### **Rate Limits**
- **Default**: 1000 requests per hour
- **Response**: 429 status when limit exceeded
- **Retry-After**: Header indicates when to retry

## 👥 **Client Authentication**

### **Verify Client Credentials**
Before accessing client data, verify the client exists in the system.

```http
POST /api/v2/external/auth/verify-client
Content-Type: application/json
x-api-key: ak_live_your_api_key_here

{
  "phone": "01128260256",
  "orderCode": "ORD123456"
}
```

**Alternative with Email:**
```json
{
  "email": "client@example.com",
  "orderCode": "ORD123456"
}
```

**Success Response:**
```json
{
  "success": true,
  "client": {
    "id": 1,
    "name": "Ahmed Mohamed",
    "phone": "01128260256",
    "email": "ahmed@example.com",
    "status": "active",
    "createdAt": "2024-01-15T10:00:00Z",
    "lastLogin": "2024-01-20T15:30:00Z"
  },
  "message": "Client verified successfully"
}
```

**Error Responses:**
```json
// Client not found
{
  "message": "Client not found",
  "error": "CLIENT_NOT_FOUND"
}

// Invalid credentials
{
  "message": "Invalid credentials",
  "error": "INVALID_CREDENTIALS"
}

// Client inactive
{
  "message": "Client account is inactive",
  "error": "CLIENT_INACTIVE"
}
```

## 📊 **Accessing Client Reports**

### **Get Client Reports**
```http
GET /api/v2/external/clients/{client_id}/reports
x-api-key: ak_live_your_api_key_here
```

**Query Parameters:**
- `status`: Filter by status (`active`, `completed`, `cancelled`, etc.)
- `startDate`: Filter from date (`2024-01-01`)
- `endDate`: Filter to date (`2024-01-31`)
- `deviceModel`: Filter by device model (`iPhone 15`)
- `limit`: Number of results (default: 50, max: 100)
- `offset`: Pagination offset (default: 0)
- `sortBy`: Sort field (`created_at`, `inspection_date`, `status`)
- `sortOrder`: Sort direction (`ASC`, `DESC`)

**Example Request:**
```bash
curl -X GET "https://reports.laapak.com/api/v2/external/clients/1/reports?status=active&limit=10&sortBy=created_at&sortOrder=DESC" \
  -H "x-api-key: ak_live_your_api_key_here"
```

**Response:**
```json
{
  "success": true,
  "reports": [
    {
      "id": "RPT123456",
      "device_model": "iPhone 15 Pro",
      "serial_number": "ABC123456789",
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
    "limit": 10,
    "offset": 0,
    "hasMore": true
  }
}
```

### **Get Specific Report Details**
```http
GET /api/v2/external/reports/{report_id}
x-api-key: ak_live_your_api_key_here
```

**Response:**
```json
{
  "success": true,
  "report": {
    "id": "RPT123456",
    "client_id": 1,
    "client_name": "Ahmed Mohamed",
    "client_phone": "01128260256",
    "client_email": "ahmed@example.com",
    "client_address": "123 Main Street, Cairo",
    "order_number": "ORD123456",
    "device_model": "iPhone 15 Pro",
    "serial_number": "ABC123456789",
    "inspection_date": "2024-01-15T10:00:00Z",
    "hardware_status": "[{\"component\": \"screen\", \"status\": \"good\"}, {\"component\": \"battery\", \"status\": \"needs_replacement\"}]",
    "external_images": "[\"image1.jpg\", \"image2.jpg\"]",
    "notes": "Screen has minor scratches, battery needs replacement",
    "billing_enabled": true,
    "amount": "500.00",
    "status": "active",
    "invoice_created": true,
    "invoice_id": "INV123456",
    "invoice_date": "2024-01-15T11:00:00Z",
    "created_at": "2024-01-15T10:00:00Z",
    "updated_at": "2024-01-15T10:00:00Z"
  }
}
```

## 💰 **Accessing Client Invoices**

### **Get Client Invoices**
```http
GET /api/v2/external/clients/{client_id}/invoices
x-api-key: ak_live_your_api_key_here
```

**Query Parameters:**
- `paymentStatus`: Filter by payment status (`paid`, `unpaid`, `partial`, `pending`)
- `startDate`: Filter from date
- `endDate`: Filter to date
- `limit`: Number of results (default: 50)
- `offset`: Pagination offset (default: 0)

**Example Request:**
```bash
curl -X GET "https://reports.laapak.com/api/v2/external/clients/1/invoices?paymentStatus=paid&limit=10" \
  -H "x-api-key: ak_live_your_api_key_here"
```

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
      "reportId": "RPT123456",
      "report_id": "RPT123456",
      "created_from_report": true,
      "report_order_number": "ORD123456",
      "created_at": "2024-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "total": 5,
    "limit": 10,
    "offset": 0,
    "hasMore": false
  }
}
```

### **Get Specific Invoice with Items**
```http
GET /api/v2/external/invoices/{invoice_id}
x-api-key: ak_live_your_api_key_here
```

**Response:**
```json
{
  "success": true,
  "invoice": {
    "id": "INV123456",
    "client_id": 1,
    "date": "2024-01-15T10:00:00Z",
    "subtotal": "500.00",
    "discount": "0.00",
    "taxRate": "15.00",
    "tax": "75.00",
    "total": "575.00",
    "paymentStatus": "paid",
    "paymentMethod": "cash",
    "paymentDate": "2024-01-15T12:00:00Z",
    "InvoiceItems": [
      {
        "id": 1,
        "description": "Screen Repair Service",
        "type": "service",
        "amount": "300.00",
        "quantity": 1,
        "totalAmount": "300.00",
        "serialNumber": "ABC123456789",
        "cost_price": "200.00",
        "profit_amount": "100.00",
        "profit_margin": "33.33"
      },
      {
        "id": 2,
        "description": "Battery Replacement",
        "type": "part",
        "amount": "200.00",
        "quantity": 1,
        "totalAmount": "200.00",
        "serialNumber": "BAT789012345",
        "cost_price": "150.00",
        "profit_amount": "50.00",
        "profit_margin": "25.00"
      }
    ]
  }
}
```

## 🔄 **Bulk Operations**

### **Bulk Client Lookup**
Look up multiple clients at once for efficiency.

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

**Response:**
```json
{
  "success": true,
  "clients": [
    {
      "id": 1,
      "name": "Ahmed Mohamed",
      "phone": "01128260256",
      "email": "ahmed@example.com",
      "status": "active",
      "createdAt": "2024-01-15T10:00:00Z"
    },
    {
      "id": 2,
      "name": "Sara Ali",
      "phone": "01234567890",
      "email": "sara@example.com",
      "status": "active",
      "createdAt": "2024-01-16T10:00:00Z"
    }
  ],
  "count": 2
}
```

### **Export Client Data**
Get comprehensive client data including reports and invoices.

```http
GET /api/v2/external/clients/{client_id}/data-export?format=json
x-api-key: ak_live_your_api_key_here
```

**Response:**
```json
{
  "success": true,
  "data": {
    "client": {
      "id": 1,
      "name": "Ahmed Mohamed",
      "phone": "01128260256",
      "email": "ahmed@example.com",
      "address": "123 Main Street, Cairo",
      "status": "active",
      "createdAt": "2024-01-15T10:00:00Z",
      "lastLogin": "2024-01-20T15:30:00Z"
    },
    "reports": [
      {
        "id": "RPT123456",
        "device_model": "iPhone 15 Pro",
        "serial_number": "ABC123456789",
        "inspection_date": "2024-01-15T10:00:00Z",
        "status": "active",
        "amount": "500.00",
        "created_at": "2024-01-15T10:00:00Z"
      }
    ],
    "invoices": [
      {
        "id": "INV123456",
        "date": "2024-01-15T10:00:00Z",
        "total": "575.00",
        "paymentStatus": "paid",
        "created_at": "2024-01-15T10:00:00Z"
      }
    ],
    "summary": {
      "total_reports": 1,
      "total_invoices": 1,
      "total_amount": 575.00,
      "export_date": "2024-01-20T15:30:00Z"
    }
  }
}
```

## 💻 **Code Examples**

### **JavaScript/Node.js**
```javascript
class LaapakAPI {
    constructor(apiKey, baseUrl = 'https://reports.laapak.com/api/v2/external') {
        this.apiKey = apiKey;
        this.baseUrl = baseUrl;
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

    // Verify client credentials
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
const api = new LaapakAPI('ak_live_your_api_key_here');

async function getClientData(phone, orderCode) {
    try {
        // Verify client
        const verification = await api.verifyClient(phone, orderCode);
        const client = verification.client;
        
        console.log('Client verified:', client.name);
        
        // Get client reports
        const reports = await api.getClientReports(client.id, {
            status: 'active',
            limit: 10
        });
        
        console.log(`Found ${reports.reports.length} reports`);
        
        // Get client invoices
        const invoices = await api.getClientInvoices(client.id, {
            paymentStatus: 'paid',
            limit: 10
        });
        
        console.log(`Found ${invoices.invoices.length} invoices`);
        
        return {
            client,
            reports: reports.reports,
            invoices: invoices.invoices
        };
        
    } catch (error) {
        console.error('API Error:', error.message);
        throw error;
    }
}

// Example usage
getClientData('01128260256', 'ORD123456')
    .then(data => console.log('Client data:', data))
    .catch(error => console.error('Error:', error));
```

### **Python**
```python
import requests
import json
from typing import Dict, List, Optional

class LaapakAPI:
    def __init__(self, api_key: str, base_url: str = "https://reports.laapak.com/api/v2/external"):
        self.api_key = api_key
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'x-api-key': api_key
        })
    
    def _make_request(self, endpoint: str, method: str = 'GET', data: Dict = None, params: Dict = None) -> Dict:
        url = f"{self.base_url}{endpoint}"
        
        try:
            if method.upper() == 'GET':
                response = self.session.get(url, params=params)
            elif method.upper() == 'POST':
                response = self.session.post(url, json=data, params=params)
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            response.raise_for_status()
            return response.json()
            
        except requests.exceptions.RequestException as e:
            raise Exception(f"API Error: {e}")
    
    def verify_client(self, phone: str, order_code: str, email: str = None) -> Dict:
        """Verify client credentials"""
        data = {'phone': phone, 'orderCode': order_code}
        if email:
            data['email'] = email
        
        return self._make_request('/auth/verify-client', 'POST', data)
    
    def get_client_reports(self, client_id: int, filters: Dict = None) -> Dict:
        """Get client reports with optional filters"""
        return self._make_request(f'/clients/{client_id}/reports', params=filters)
    
    def get_client_invoices(self, client_id: int, filters: Dict = None) -> Dict:
        """Get client invoices with optional filters"""
        return self._make_request(f'/clients/{client_id}/invoices', params=filters)
    
    def get_report(self, report_id: str) -> Dict:
        """Get specific report details"""
        return self._make_request(f'/reports/{report_id}')
    
    def get_invoice(self, invoice_id: str) -> Dict:
        """Get specific invoice with items"""
        return self._make_request(f'/invoices/{invoice_id}')
    
    def bulk_lookup_clients(self, phones: List[str] = None, emails: List[str] = None, order_codes: List[str] = None) -> Dict:
        """Bulk client lookup"""
        data = {}
        if phones:
            data['phones'] = phones
        if emails:
            data['emails'] = emails
        if order_codes:
            data['orderCodes'] = order_codes
        
        return self._make_request('/clients/bulk-lookup', 'POST', data)
    
    def export_client_data(self, client_id: int, format: str = 'json') -> Dict:
        """Export comprehensive client data"""
        return self._make_request(f'/clients/{client_id}/data-export', params={'format': format})
    
    def health_check(self) -> Dict:
        """Check API health and permissions"""
        return self._make_request('/health')

# Usage Example
api = LaapakAPI('ak_live_your_api_key_here')

def get_client_data(phone: str, order_code: str):
    try:
        # Verify client
        verification = api.verify_client(phone, order_code)
        client = verification['client']
        
        print(f"Client verified: {client['name']}")
        
        # Get client reports
        reports = api.get_client_reports(client['id'], {
            'status': 'active',
            'limit': 10
        })
        
        print(f"Found {len(reports['reports'])} reports")
        
        # Get client invoices
        invoices = api.get_client_invoices(client['id'], {
            'paymentStatus': 'paid',
            'limit': 10
        })
        
        print(f"Found {len(invoices['invoices'])} invoices")
        
        return {
            'client': client,
            'reports': reports['reports'],
            'invoices': invoices['invoices']
        }
        
    except Exception as e:
        print(f"Error: {e}")
        raise

# Example usage
try:
    data = get_client_data('01128260256', 'ORD123456')
    print("Client data retrieved successfully")
except Exception as e:
    print(f"Failed to get client data: {e}")
```

### **PHP**
```php
<?php
class LaapakAPI {
    private $apiKey;
    private $baseUrl;
    
    public function __construct($apiKey, $baseUrl = 'https://reports.laapak.com/api/v2/external') {
        $this->apiKey = $apiKey;
        $this->baseUrl = $baseUrl;
    }
    
    private function makeRequest($endpoint, $method = 'GET', $data = null, $params = []) {
        $url = $this->baseUrl . $endpoint;
        
        if (!empty($params)) {
            $url .= '?' . http_build_query($params);
        }
        
        $headers = [
            'Content-Type: application/json',
            'x-api-key: ' . $this->apiKey
        ];
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
        
        if ($data && ($method === 'POST' || $method === 'PUT')) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        }
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode >= 400) {
            $errorData = json_decode($response, true);
            throw new Exception("API Error: $httpCode " . ($errorData['message'] ?? 'Unknown error'));
        }
        
        return json_decode($response, true);
    }
    
    public function verifyClient($phone, $orderCode, $email = null) {
        $data = ['phone' => $phone, 'orderCode' => $orderCode];
        if ($email) {
            $data['email'] = $email;
        }
        
        return $this->makeRequest('/auth/verify-client', 'POST', $data);
    }
    
    public function getClientReports($clientId, $filters = []) {
        return $this->makeRequest("/clients/$clientId/reports", 'GET', null, $filters);
    }
    
    public function getClientInvoices($clientId, $filters = []) {
        return $this->makeRequest("/clients/$clientId/invoices", 'GET', null, $filters);
    }
    
    public function getReport($reportId) {
        return $this->makeRequest("/reports/$reportId");
    }
    
    public function getInvoice($invoiceId) {
        return $this->makeRequest("/invoices/$invoiceId");
    }
    
    public function bulkLookupClients($phones = [], $emails = [], $orderCodes = []) {
        $data = [];
        if (!empty($phones)) $data['phones'] = $phones;
        if (!empty($emails)) $data['emails'] = $emails;
        if (!empty($orderCodes)) $data['orderCodes'] = $orderCodes;
        
        return $this->makeRequest('/clients/bulk-lookup', 'POST', $data);
    }
    
    public function exportClientData($clientId, $format = 'json') {
        return $this->makeRequest("/clients/$clientId/data-export", 'GET', null, ['format' => $format]);
    }
    
    public function healthCheck() {
        return $this->makeRequest('/health');
    }
}

// Usage Example
$api = new LaapakAPI('ak_live_your_api_key_here');

function getClientData($phone, $orderCode) {
    try {
        // Verify client
        $verification = $api->verifyClient($phone, $orderCode);
        $client = $verification['client'];
        
        echo "Client verified: " . $client['name'] . "\n";
        
        // Get client reports
        $reports = $api->getClientReports($client['id'], [
            'status' => 'active',
            'limit' => 10
        ]);
        
        echo "Found " . count($reports['reports']) . " reports\n";
        
        // Get client invoices
        $invoices = $api->getClientInvoices($client['id'], [
            'paymentStatus' => 'paid',
            'limit' => 10
        ]);
        
        echo "Found " . count($invoices['invoices']) . " invoices\n";
        
        return [
            'client' => $client,
            'reports' => $reports['reports'],
            'invoices' => $invoices['invoices']
        ];
        
    } catch (Exception $e) {
        echo "Error: " . $e->getMessage() . "\n";
        throw $e;
    }
}

// Example usage
try {
    $data = getClientData('01128260256', 'ORD123456');
    echo "Client data retrieved successfully\n";
} catch (Exception $e) {
    echo "Failed to get client data: " . $e->getMessage() . "\n";
}
?>
```

## 🚨 **Error Handling**

### **Common Error Codes**

| Status Code | Error | Description | Solution |
|-------------|-------|-------------|----------|
| 401 | `API_KEY_REQUIRED` | Missing API key | Include `x-api-key` header |
| 401 | `INVALID_API_KEY` | Invalid API key | Check API key format and validity |
| 401 | `API_KEY_EXPIRED` | API key expired | Contact admin for new key |
| 403 | `IP_NOT_WHITELISTED` | IP not allowed | Contact admin to whitelist IP |
| 403 | `INSUFFICIENT_PERMISSIONS` | No permission for resource | Contact admin for permission |
| 404 | `CLIENT_NOT_FOUND` | Client doesn't exist | Verify client credentials |
| 404 | `REPORT_NOT_FOUND` | Report doesn't exist | Check report ID |
| 404 | `INVOICE_NOT_FOUND` | Invoice doesn't exist | Check invoice ID |
| 429 | `RATE_LIMIT_EXCEEDED` | Too many requests | Wait and retry later |
| 500 | `AUTH_ERROR` | Authentication error | Contact support |

### **Error Response Format**
```json
{
  "message": "Error description",
  "error": "ERROR_CODE"
}
```

### **Rate Limit Handling**
```javascript
// Handle rate limiting
async function makeRequestWithRetry(apiFunction, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await apiFunction();
        } catch (error) {
            if (error.message.includes('429')) {
                const retryAfter = error.headers?.get('retry-after') || 3600;
                console.log(`Rate limited. Retrying after ${retryAfter} seconds...`);
                await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
                continue;
            }
            throw error;
        }
    }
    throw new Error('Max retries exceeded');
}
```

## 🔒 **Security Best Practices**

### **1. API Key Security**
- ✅ **Never expose API keys** in client-side code
- ✅ **Store keys securely** in environment variables
- ✅ **Rotate keys regularly** for enhanced security
- ✅ **Use HTTPS only** for all API requests

### **2. Data Handling**
- ✅ **Validate all input** before sending requests
- ✅ **Handle errors gracefully** with proper user feedback
- ✅ **Log API usage** for debugging and monitoring
- ✅ **Respect rate limits** to avoid service disruption

### **3. Error Handling**
- ✅ **Implement retry logic** for transient errors
- ✅ **Provide fallback mechanisms** for API failures
- ✅ **Monitor API health** with regular health checks
- ✅ **Alert on critical errors** for immediate attention

## 📊 **Monitoring & Analytics**

### **Health Check**
```bash
curl -X GET "https://reports.laapak.com/api/v2/external/health" \
  -H "x-api-key: ak_live_your_api_key_here"
```

### **Usage Statistics**
```bash
curl -X GET "https://reports.laapak.com/api/v2/external/usage-stats?days=30" \
  -H "x-api-key: ak_live_your_api_key_here"
```

## 🆘 **Support & Troubleshooting**

### **Common Issues**

1. **"Invalid API key" error**
   - Check API key format: `ak_live_[64-char-hash]`
   - Verify key is active and not expired
   - Contact admin if key is correct but still failing

2. **"Rate limit exceeded" error**
   - Implement exponential backoff
   - Reduce request frequency
   - Contact admin to increase rate limit

3. **"Client not found" error**
   - Verify client phone number format
   - Check order code accuracy
   - Ensure client account is active

4. **"Insufficient permissions" error**
   - Contact admin to update API key permissions
   - Check which resources you're trying to access
   - Verify API key has required access rights

### **Getting Help**
- **Email**: support@laapak.com
- **Documentation**: https://docs.laapak.com
- **Status Page**: https://status.laapak.com

### **API Status**
Check the API status page for real-time updates on service availability and any ongoing issues.

---

## 📝 **Quick Reference**

### **Base URL**
```
https://reports.laapak.com/api/v2/external
```

### **Required Headers**
```http
x-api-key: ak_live_your_api_key_here
Content-Type: application/json
```

### **Rate Limits**
- **Default**: 1000 requests/hour
- **Burst**: 100 requests/minute
- **Response**: 429 with retry-after header

### **Pagination**
- **Default limit**: 50 records
- **Maximum limit**: 100 records
- **Use offset**: For pagination through results

This guide provides everything you need to integrate with the Laapak Report System API. For additional support or questions, please contact the system administrator.
