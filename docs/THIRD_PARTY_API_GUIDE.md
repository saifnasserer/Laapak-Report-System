# Laapak Report System - Third-Party API Integration Guide

## 📋 Table of Contents

1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [Authentication](#authentication)
4. [API Endpoints](#api-endpoints)
5. [Request/Response Formats](#requestresponse-formats)
6. [Code Examples](#code-examples)
7. [Error Handling](#error-handling)
8. [Rate Limiting](#rate-limiting)
9. [Best Practices](#best-practices)
10. [Support & Troubleshooting](#support--troubleshooting)

---

## Overview

The Laapak Report System provides a RESTful API that allows third-party applications to integrate with the system. You can access client data, reports, invoices, and perform various operations programmatically.

### Key Features

- ✅ **API Key Authentication** - Secure access without user credentials
- ✅ **JWT Token Authentication** - For user-based authentication
- ✅ **Comprehensive Data Access** - Reports, invoices, clients, and more
- ✅ **Bulk Operations** - Efficient batch processing
- ✅ **Advanced Filtering** - Query data with flexible filters
- ✅ **Rate Limiting** - Built-in protection against abuse
- ✅ **Usage Logging** - Track API usage for analytics

### Base URLs

- **Production**: `https://reports.laapak.com/api`
- **Development**: `http://localhost:3000/api`
- **API Key Endpoints**: `https://reports.laapak.com/api/v2/external`

---

## Getting Started

### Step 1: Obtain API Credentials

Contact the Laapak system administrator to obtain:
- **API Key** (for API key authentication)
- **Base URL** (production or development)
- **Permissions** (what resources you can access)

### Step 2: Test Your Connection

```bash
# Test API key authentication
curl -X GET "https://reports.laapak.com/api/v2/external/health" \
  -H "x-api-key: your_api_key_here"

# Test JWT authentication (after login)
curl -X GET "https://reports.laapak.com/api/health" \
  -H "x-auth-token: your_jwt_token_here"
```

### Step 3: Choose Your Authentication Method

- **API Key**: Best for server-to-server integrations, automated systems
- **JWT Token**: Best for user-facing applications, web apps

---

## Authentication

### Method 1: API Key Authentication

API keys provide secure access without requiring user credentials. Perfect for automated systems and integrations.

#### Headers Required

```http
x-api-key: ak_live_your_api_key_here
Content-Type: application/json
```

#### API Key Format

- **Live Keys**: `ak_live_[64-character-hash]`
- **Test Keys**: `ak_test_[64-character-hash]`

#### Permissions

API keys have granular permissions:

```json
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

#### Health Check with API Key

```bash
curl -X GET "https://reports.laapak.com/api/v2/external/health" \
  -H "x-api-key: ak_live_your_api_key_here"
```

**Response:**
```json
{
  "success": true,
  "message": "API key authentication successful",
  "timestamp": "2024-01-20T15:30:00Z",
  "apiKey": {
    "name": "Your Integration Key",
    "permissions": {
      "reports": {"read": true, "write": false},
      "invoices": {"read": true, "write": false},
      "clients": {"read": true, "write": false}
    },
    "rateLimit": 1000
  }
}
```

### Method 2: JWT Token Authentication

JWT tokens are obtained through user login and provide session-based authentication.

#### Step 1: Login (Admin)

```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin_username",
  "password": "admin_password"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "admin",
    "isAdmin": true
  }
}
```

#### Step 2: Login (Client)

```http
POST /api/clients/auth
Content-Type: application/json

{
  "phone": "01128260256",
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
    "phone": "01128260256",
    "email": "client@example.com"
  }
}
```

#### Step 3: Use Token in Requests

```http
x-auth-token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

---

## API Endpoints

### Client Management

#### Verify Client Credentials (API Key Only)

```http
POST /api/v2/external/auth/verify-client
x-api-key: your_api_key_here
Content-Type: application/json

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

**Response:**
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

#### Get Client Profile

```http
GET /api/v2/external/clients/{client_id}/profile
x-api-key: your_api_key_here
```

#### Get All Clients (JWT - Admin Only)

```http
GET /api/clients
x-auth-token: your_jwt_token_here
```

#### Get Single Client

```http
GET /api/clients/{client_id}
x-auth-token: your_jwt_token_here
```

#### Create Client (JWT - Admin Only)

```http
POST /api/clients
x-auth-token: your_jwt_token_here
Content-Type: application/json

{
  "name": "Client Name",
  "phone": "1234567890",
  "email": "client@example.com",
  "address": "Client Address",
  "orderCode": "ORD123456",
  "status": "active"
}
```

#### Update Client (JWT - Admin Only)

```http
PUT /api/clients/{client_id}
x-auth-token: your_jwt_token_here
Content-Type: application/json

{
  "name": "Updated Name",
  "phone": "0987654321",
  "email": "newemail@example.com"
}
```

### Reports

#### Get Client Reports (API Key)

```http
GET /api/v2/external/clients/{client_id}/reports
x-api-key: your_api_key_here
```

**Query Parameters:**
- `status`: Filter by status (`active`, `completed`, `cancelled`, etc.)
- `startDate`: Filter from date (`2024-01-01`)
- `endDate`: Filter to date (`2024-01-31`)
- `deviceModel`: Filter by device model
- `limit`: Number of results (default: 50, max: 100)
- `offset`: Pagination offset (default: 0)
- `sortBy`: Sort field (`created_at`, `inspection_date`, `status`)
- `sortOrder`: Sort direction (`ASC`, `DESC`)

**Example:**
```bash
curl -X GET "https://reports.laapak.com/api/v2/external/clients/1/reports?status=active&limit=10" \
  -H "x-api-key: your_api_key_here"
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
      "cpu": "Apple A17 Pro",
      "gpu": "Apple GPU (6-core)",
      "ram": "8GB",
      "storage": "256GB NVMe SSD",
      "inspection_date": "2024-01-15T10:00:00Z",
      "status": "active",
      "billing_enabled": true,
      "amount": "500.00",
      "invoice_created": true,
      "invoice_id": "INV123456",
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

#### Get Specific Report

```http
GET /api/v2/external/reports/{report_id}
x-api-key: your_api_key_here
```

**Or with JWT:**
```http
GET /api/reports/{report_id}
x-auth-token: your_jwt_token_here
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
    "order_number": "ORD123456",
    "device_model": "iPhone 15 Pro",
    "serial_number": "ABC123456789",
    "cpu": "Apple A17 Pro",
    "gpu": "Apple GPU (6-core)",
    "ram": "8GB",
    "storage": "256GB NVMe SSD",
    "inspection_date": "2024-01-15T10:00:00Z",
    "hardware_status": "[{\"component\": \"screen\", \"status\": \"good\"}]",
    "external_images": "[\"image1.jpg\", \"image2.jpg\"]",
    "notes": "Screen has minor scratches",
    "billing_enabled": true,
    "amount": "500.00",
    "status": "active",
    "created_at": "2024-01-15T10:00:00Z"
  }
}
```

#### Get My Reports (JWT - Client Only)

```http
GET /api/reports/me
x-auth-token: your_jwt_token_here
```

**Description:**
- Automatically identifies the client from the JWT token
- Returns only reports belonging to the authenticated client
- No need to pass client_id in the URL
- More secure and efficient than fetching all reports

**Query Parameters:**
- `status`: Filter by status (`active`, `completed`, `cancelled`, etc.)
- `startDate`: Filter from date (`2024-01-01`)
- `endDate`: Filter to date (`2024-01-31`)
- `deviceModel`: Filter by device model (partial match)
- `limit`: Number of results (default: 50, max: 100)
- `offset`: Pagination offset (default: 0)
- `sortBy`: Sort field (`created_at`, `inspection_date`, `status`, `device_model`)
- `sortOrder`: Sort direction (`ASC`, `DESC`)

**Example:**
```bash
curl -X GET "https://reports.laapak.com/api/reports/me?status=active&limit=10&sortBy=created_at&sortOrder=DESC" \
  -H "x-auth-token: your_jwt_token_here"
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
      "cpu": "Apple A17 Pro",
      "gpu": "Apple GPU (6-core)",
      "ram": "8GB",
      "storage": "256GB NVMe SSD",
      "inspection_date": "2024-01-15T10:00:00Z",
      "status": "active",
      "billing_enabled": true,
      "amount": "500.00",
      "invoice_created": true,
      "invoice_id": "INV123456",
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

#### Get All Reports (JWT - Admin)

```http
GET /api/reports
x-auth-token: your_jwt_token_here
```

**Query Parameters:**
- `billing_enabled`: `true`/`false`
- `fetch_mode`: `all_reports` (to include invoiced reports)
- `startDate`: Start date filter
- `endDate`: End date filter
- `status`: Status filter

#### Create Report (JWT - Admin)

```http
POST /api/reports
x-auth-token: your_jwt_token_here
Content-Type: application/json

{
  "client_id": 1,
  "device_model": "iPhone 15",
  "serial_number": "ABC123",
  "cpu": "Apple A16 Bionic",
  "gpu": "Apple GPU (5-core)",
  "ram": "6GB",
  "storage": "128GB NVMe SSD",
  "inspection_date": "2024-01-15T10:00:00Z",
  "hardware_status": "[{\"component\": \"screen\", \"status\": \"good\"}]",
  "external_images": "[\"image1.jpg\"]",
  "notes": "Device in good condition",
  "billing_enabled": true,
  "amount": 500.00,
  "status": "active"
}
```

**Note:** The `cpu`, `gpu`, `ram`, and `storage` fields are optional. If not provided, they will be set to `null`.

#### Update Report (JWT - Admin)

```http
PUT /api/reports/{report_id}
x-auth-token: your_jwt_token_here
Content-Type: application/json

{
  "status": "completed",
  "notes": "Repair completed successfully",
  "cpu": "Apple A17 Pro",
  "gpu": "Apple GPU (6-core)",
  "ram": "8GB",
  "storage": "256GB NVMe SSD"
}
```

**Note:** All fields are optional. Only include the fields you want to update. The `cpu`, `gpu`, `ram`, and `storage` fields can be updated along with other report fields.

#### Search Reports

```http
GET /api/reports/search?q=search_term
x-auth-token: your_jwt_token_here
```

### Invoices

#### Get Client Invoices (API Key)

```http
GET /api/v2/external/clients/{client_id}/invoices
x-api-key: your_api_key_here
```

**Query Parameters:**
- `paymentStatus`: `paid`, `unpaid`, `partial`, `pending`
- `startDate`: Filter from date
- `endDate`: Filter to date
- `limit`: Number of results (default: 50)
- `offset`: Pagination offset (default: 0)

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
    "total": 5,
    "limit": 10,
    "offset": 0,
    "hasMore": false
  }
}
```

#### Get Specific Invoice with Items

```http
GET /api/v2/external/invoices/{invoice_id}
x-api-key: your_api_key_here
```

**Or with JWT:**
```http
GET /api/invoices/{invoice_id}
x-auth-token: your_jwt_token_here
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
    "InvoiceItems": [
      {
        "id": 1,
        "description": "Screen Repair Service",
        "type": "service",
        "amount": "300.00",
        "quantity": 1,
        "totalAmount": "300.00",
        "serialNumber": "ABC123456789"
      }
    ]
  }
}
```

#### Print Invoice (Print-Ready HTML)

Get a print-ready HTML version of an invoice. This endpoint returns a beautifully formatted HTML page optimized for printing.

```http
GET /api/invoices/{invoice_id}/print
x-auth-token: your_jwt_token_here
```

**Or with token in query parameter (for direct browser access):**
```http
GET /api/invoices/{invoice_id}/print?token=your_jwt_token_here
```

**Authentication:**
- JWT token required (can be in header or query parameter)
- Supports both admin and client tokens
- Clients can only print their own invoices

**Response:**
Returns HTML content (Content-Type: `text/html; charset=utf-8`)

**Features:**
- ✅ Print-optimized layout (A4 size)
- ✅ RTL (Right-to-Left) support for Arabic
- ✅ Company header with contact information
- ✅ Complete invoice details (number, date, status)
- ✅ Client information section
- ✅ Device information (type, model, serial number, CPU, GPU, RAM, Storage)
- ✅ Itemized costs table
- ✅ Payment summary (subtotal, tax, discount, total, paid, remaining)
- ✅ Professional styling matching industry standards
- ✅ Print and close buttons (hidden when printing)

**Example Usage:**

**JavaScript:**
```javascript
// Open print view in new window
const invoiceId = 'INV123456';
const token = localStorage.getItem('authToken');
const printUrl = `https://reports.laapak.com/api/invoices/${invoiceId}/print?token=${token}`;
window.open(printUrl, '_blank');
```

**cURL:**
```bash
# With token in header
curl -X GET "https://reports.laapak.com/api/invoices/INV123456/print" \
  -H "x-auth-token: your_jwt_token_here" \
  -o invoice_print.html

# With token in query parameter
curl -X GET "https://reports.laapak.com/api/invoices/INV123456/print?token=your_jwt_token_here" \
  -o invoice_print.html
```

**Direct Browser Access:**
```
https://reports.laapak.com/api/invoices/INV123456/print?token=your_jwt_token_here
```

**Print View Includes:**
- Company information (address, phone, email)
- Invoice number and report/order number
- Issue date and time (formatted in Arabic)
- Payment status badge
- Client details (name, phone, email)
- Device information (type, model, serial number, CPU, GPU, RAM, Storage)
- Itemized costs table with:
  - Description
  - Quantity
  - Unit price
  - Discount
  - Total
- Financial summary:
  - Subtotal
  - Discount (if applicable)
  - Tax (if applicable)
  - Total amount
  - Paid amount
  - Remaining amount
- Footer with thank you message

**Error Responses:**

**401 Unauthorized:**
```html
<html>
  <body>
    <h1>Authentication Required</h1>
    <p>Please provide a valid authentication token.</p>
  </body>
</html>
```

**404 Not Found:**
```html
<html>
  <body>
    <h1>Invoice Not Found</h1>
    <p>The invoice you're looking for doesn't exist.</p>
  </body>
</html>
```

**Notes:**
- The print view automatically hides action buttons when printing
- Optimized for A4 paper size
- Supports browser's native print dialog
- Can be saved as PDF using browser's print-to-PDF feature
- Responsive design works on both desktop and mobile

#### Get All Invoices (JWT - Admin)

```http
GET /api/invoices
x-auth-token: your_jwt_token_here
```

**Query Parameters:**
- `paymentMethod`: `cash`, `instapay`, `محفظة`, `بنك`
- `paymentStatus`: `paid`, `pending`, `partial`, `cancelled`
- `clientId`: Filter by client ID
- `startDate`: Start date filter
- `endDate`: End date filter

#### Create Invoice (JWT - Admin)

```http
POST /api/invoices
x-auth-token: your_jwt_token_here
Content-Type: application/json

{
  "client_id": 1,
  "date": "2024-01-15T10:00:00Z",
  "subtotal": 500.00,
  "discount": 0.00,
  "taxRate": 15.00,
  "tax": 75.00,
  "total": 575.00,
  "paymentStatus": "unpaid",
  "paymentMethod": "cash",
  "items": [
    {
      "description": "Device Repair",
      "type": "service",
      "quantity": 1,
      "amount": 500.00,
      "totalAmount": 500.00
    }
  ]
}
```

#### Create Bulk Invoice (JWT - Admin)

```http
POST /api/invoices/bulk
x-auth-token: your_jwt_token_here
Content-Type: application/json

{
  "date": "2024-01-15T10:00:00Z",
  "reportIds": ["RPT123", "RPT124", "RPT125"],
  "client_id": 1,
  "items": [
    {
      "description": "Repair Service 1",
      "type": "service",
      "amount": 400.00,
      "totalAmount": 400.00,
      "report_id": "RPT123"
    }
  ],
  "subtotal": 1200.00,
  "total": 1380.00
}
```

#### Update Invoice (JWT - Admin)

```http
PUT /api/invoices/{invoice_id}
x-auth-token: your_jwt_token_here
Content-Type: application/json

{
  "paymentStatus": "paid",
  "paymentMethod": "instapay",
  "notes": "Payment received"
}
```

### Bulk Operations

#### Bulk Client Lookup (API Key)

```http
POST /api/v2/external/clients/bulk-lookup
x-api-key: your_api_key_here
Content-Type: application/json

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
      "status": "active"
    }
  ],
  "count": 1
}
```

#### Export Client Data (API Key)

```http
GET /api/v2/external/clients/{client_id}/data-export?format=json
x-api-key: your_api_key_here
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
      "email": "ahmed@example.com"
    },
    "reports": [...],
    "invoices": [...],
    "summary": {
      "total_reports": 5,
      "total_invoices": 3,
      "total_amount": 1725.00,
      "export_date": "2024-01-20T15:30:00Z"
    }
  }
}
```

### Health & Status

#### Health Check

```http
GET /api/health
```

**Or with API Key:**
```http
GET /api/v2/external/health
x-api-key: your_api_key_here
```

---

## Request/Response Formats

### Request Format

All requests should use:
- **Content-Type**: `application/json`
- **Method**: `GET`, `POST`, `PUT`, `DELETE`
- **Authentication**: Either `x-api-key` or `x-auth-token` header

### Response Format

#### Success Response

```json
{
  "success": true,
  "data": {...},
  "message": "Operation successful"
}
```

#### Paginated Response

```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "total": 100,
    "limit": 50,
    "offset": 0,
    "hasMore": true
  }
}
```

#### Error Response

```json
{
  "message": "Error description",
  "error": "ERROR_CODE",
  "details": "Additional error details (development only)"
}
```

---

## Code Examples

### JavaScript/Node.js

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

### Python

```python
import requests
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

### PHP

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
    global $api;
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

---

## Error Handling

### Common Error Codes

| Status Code | Error Code | Description | Solution |
|-------------|------------|-------------|----------|
| 400 | `MISSING_PARAMETERS` | Required parameters missing | Check request body/query params |
| 401 | `API_KEY_REQUIRED` | Missing API key | Include `x-api-key` header |
| 401 | `INVALID_API_KEY` | Invalid API key | Check API key format and validity |
| 401 | `API_KEY_EXPIRED` | API key expired | Contact admin for new key |
| 401 | `INVALID_TOKEN` | Invalid JWT token | Re-authenticate to get new token |
| 403 | `IP_NOT_WHITELISTED` | IP not allowed | Contact admin to whitelist IP |
| 403 | `INSUFFICIENT_PERMISSIONS` | No permission for resource | Contact admin for permission |
| 403 | `CLIENT_INACTIVE` | Client account inactive | Contact admin to activate account |
| 404 | `CLIENT_NOT_FOUND` | Client doesn't exist | Verify client credentials |
| 404 | `REPORT_NOT_FOUND` | Report doesn't exist | Check report ID |
| 404 | `INVOICE_NOT_FOUND` | Invoice doesn't exist | Check invoice ID |
| 429 | `RATE_LIMIT_EXCEEDED` | Too many requests | Wait and retry later |
| 500 | `AUTH_ERROR` | Authentication error | Contact support |

### Error Response Format

```json
{
  "message": "Error description",
  "error": "ERROR_CODE"
}
```

### Error Handling Example

```javascript
async function makeRequestWithErrorHandling(apiFunction) {
    try {
        return await apiFunction();
    } catch (error) {
        if (error.message.includes('401')) {
            console.error('Authentication failed. Check your API key or token.');
        } else if (error.message.includes('403')) {
            console.error('Access denied. Check your permissions.');
        } else if (error.message.includes('404')) {
            console.error('Resource not found.');
        } else if (error.message.includes('429')) {
            console.error('Rate limit exceeded. Please wait before retrying.');
        } else if (error.message.includes('500')) {
            console.error('Server error. Please try again later.');
        } else {
            console.error('Unexpected error:', error.message);
        }
        throw error;
    }
}
```

---

## Rate Limiting

### Default Limits

- **API Keys**: 1000 requests per hour
- **JWT Tokens**: 1000 requests per hour
- **Burst Limit**: 100 requests per minute

### Rate Limit Headers

When rate limit is exceeded, the response includes:

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 3600
```

### Handling Rate Limits

```javascript
async function makeRequestWithRetry(apiFunction, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await apiFunction();
        } catch (error) {
            if (error.message.includes('429')) {
                const retryAfter = 3600; // Default 1 hour
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

---

## Best Practices

### 1. Security

- ✅ **Never expose API keys** in client-side code
- ✅ **Store keys securely** in environment variables
- ✅ **Use HTTPS only** for all API requests
- ✅ **Rotate keys regularly** for enhanced security
- ✅ **Validate all input** before sending requests

### 2. Performance

- ✅ **Use pagination** for large datasets
- ✅ **Implement caching** where appropriate
- ✅ **Batch requests** when possible (use bulk operations)
- ✅ **Respect rate limits** to avoid service disruption

### 3. Error Handling

- ✅ **Implement retry logic** for transient errors
- ✅ **Provide fallback mechanisms** for API failures
- ✅ **Log errors** for debugging and monitoring
- ✅ **Handle all error codes** gracefully

### 4. Data Handling

- ✅ **Validate data** before processing
- ✅ **Handle pagination** properly
- ✅ **Parse JSON fields** correctly (hardware_status, external_images)
- ✅ **Handle date formats** consistently (ISO 8601)

### 5. Monitoring

- ✅ **Monitor API health** with regular health checks
- ✅ **Track API usage** for analytics
- ✅ **Alert on critical errors** for immediate attention
- ✅ **Monitor rate limit usage** to optimize requests

---

## Support & Troubleshooting

### Common Issues

#### 1. "Invalid API key" error

**Solutions:**
- Check API key format: `ak_live_[64-char-hash]`
- Verify key is active and not expired
- Ensure key is included in `x-api-key` header
- Contact admin if key is correct but still failing

#### 2. "Rate limit exceeded" error

**Solutions:**
- Implement exponential backoff
- Reduce request frequency
- Use bulk operations when possible
- Contact admin to increase rate limit if needed

#### 3. "Client not found" error

**Solutions:**
- Verify client phone number format
- Check order code accuracy
- Ensure client account is active
- Use bulk lookup to verify client exists

#### 4. "Insufficient permissions" error

**Solutions:**
- Contact admin to update API key permissions
- Check which resources you're trying to access
- Verify API key has required access rights
- Review permission structure in health check response

#### 5. "IP not whitelisted" error

**Solutions:**
- Contact admin to whitelist your IP address
- Provide your server's public IP address
- For dynamic IPs, request IP range whitelisting

### Getting Help

- **Email**: support@laapak.com
- **Documentation**: Check this guide and related docs
- **Status Page**: Monitor API status for service updates

### API Status

Check the API health endpoint regularly to monitor service availability:

```bash
curl -X GET "https://reports.laapak.com/api/v2/external/health" \
  -H "x-api-key: your_api_key_here"
```

---

## Quick Reference

### Base URLs

- **API Key Endpoints**: `https://reports.laapak.com/api/v2/external`
- **JWT Endpoints**: `https://reports.laapak.com/api`
- **Development**: `http://localhost:3000/api`

### Required Headers

**API Key Authentication:**
```http
x-api-key: ak_live_your_api_key_here
Content-Type: application/json
```

**JWT Authentication:**
```http
x-auth-token: your_jwt_token_here
Content-Type: application/json
```

### Rate Limits

- **Default**: 1000 requests/hour
- **Burst**: 100 requests/minute
- **Response**: 429 with retry-after header

### Pagination

- **Default limit**: 50 records
- **Maximum limit**: 100 records
- **Use offset**: For pagination through results

### Date Formats

- **ISO 8601**: `2024-01-15T10:00:00Z`
- **Date only**: `2024-01-15`

### JSON Fields

Some fields are stored as JSON strings and need parsing:
- `hardware_status`: Array of component statuses
- `external_images`: Array of image URLs

### Device Specification Fields

Reports include optional device specification fields:
- `cpu`: Processor/CPU specification (e.g., "Apple A17 Pro", "Intel Core i7-11800H")
- `gpu`: Graphics processing unit specification (e.g., "Apple GPU (6-core)", "NVIDIA GeForce RTX 3060")
- `ram`: Memory/RAM specification (e.g., "8GB", "16GB DDR4")
- `storage`: Storage specification (e.g., "256GB NVMe SSD", "512GB NVMe SSD")

These fields are optional and can be `null` if not provided when creating or updating a report.

---

## Additional Resources

- **API Documentation**: See `API_DOCUMENTATION.md` for detailed endpoint documentation
- **API Key Guide**: See `API_KEY_GUIDE.md` for API key management
- **Enhanced API System**: See `ENHANCED_API_KEY_SYSTEM.md` for advanced features

---

**Last Updated**: January 2024  
**API Version**: v2  
**Support**: support@laapak.com

