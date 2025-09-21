# Laapak Report System - Client Account Login & Integration Guide

## Overview

This document provides comprehensive guidance on client account login and how to integrate with the Laapak Report System API for client access. The system supports client accounts with limited access to their own data.

## Client Account System

### Client Accounts

**Purpose**: Limited access for customers to view their own reports and invoices.

**Capabilities**:
- View their own reports
- View their own invoices
- Update their profile information (name, email, address)
- Cannot access other clients' data

## Authentication System

### JWT Token-Based Authentication

The system uses JWT (JSON Web Tokens) for authentication. All API requests require a valid token in the request header.

**Token Header Format**:
```http
x-auth-token: your-jwt-token-here
```

**Token Expiration**: 24 hours

## API Integration Guide

### Base URLs

- **Development**: `http://localhost:3000/api`
- **Production**: `https://reports.laapak.com/api`

### Client Authentication & Management

#### Client Login
```http
POST /api/clients/auth
Content-Type: application/json

{
    "phone": "1234567890",
    "orderCode": "ORD123456"
}
```

**Response**:
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

#### Update Client Profile
```http
PUT /api/users/clients/:id
Content-Type: application/json
x-auth-token: your-client-token

{
    "name": "Updated Client Name",
    "email": "updated@example.com",
    "address": "New Address"
}
```

### Data Access for Clients
Clients have limited access to their own data:

```javascript
// Get client's own reports
GET /api/reports/client/me
x-auth-token: client-token

// Get client's own invoices
GET /api/invoices/client
x-auth-token: client-token

// Update own profile
PUT /api/users/clients/:id
x-auth-token: client-token
```

## Integration Examples

### Client Portal Integration

```javascript
class ClientPortal {
    constructor(baseUrl = 'https://reports.laapak.com/api') {
        this.baseUrl = baseUrl;
        this.token = null;
    }

    // Client login
    async loginClient(phone, orderCode) {
        const response = await fetch(`${this.baseUrl}/clients/auth`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, orderCode })
        });
        
        const data = await response.json();
        this.token = data.token;
        return data;
    }

    // Get client's reports
    async getMyReports() {
        return await this.makeRequest('GET', `${this.baseUrl}/reports/client/me`);
    }

    // Get client's invoices
    async getMyInvoices() {
        return await this.makeRequest('GET', `${this.baseUrl}/invoices/client`);
    }

    // Update profile
    async updateProfile(profileData) {
        return await this.makeRequest('PUT', `${this.baseUrl}/users/clients/${this.clientId}`, profileData);
    }

    // Generic request method
    async makeRequest(method, url, data = null) {
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

        const response = await fetch(url, options);
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        return await response.json();
    }
}

// Usage example
const clientPortal = new ClientPortal();

// Client login
const loginResult = await clientPortal.loginClient('1234567890', 'ORD123456');

// Get client's reports
const myReports = await clientPortal.getMyReports();

// Get client's invoices
const myInvoices = await clientPortal.getMyInvoices();
```

### Webhook Integration

```javascript
// Webhook endpoint to receive data from Laapak system
app.post('/webhook/laapak', async (req, res) => {
    const { event, data } = req.body;
    
    switch (event) {
        case 'client.login':
            // Handle client login
            await handleClientLogin(data);
            break;
            
        case 'client.updated':
            // Handle client profile update
            await handleClientUpdate(data);
            break;
    }
    
    res.json({ success: true });
});
```

## Security Considerations

### 1. Token Management
- Store tokens securely (not in localStorage for production)
- Implement token refresh mechanism
- Handle token expiration gracefully

### 2. API Rate Limiting
- Implement rate limiting in your integration
- Handle 429 (Too Many Requests) responses
- Use exponential backoff for retries

### 3. Data Validation
- Validate all data before sending to API
- Handle API validation errors appropriately
- Implement proper error handling

### 4. HTTPS Only
- Always use HTTPS in production
- Validate SSL certificates
- Never send tokens over HTTP

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

// 404 Not Found
{
    "message": "Resource not found"
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
        if (error.status === 401) {
            // Token expired, redirect to login
            redirectToLogin();
        } else if (error.status === 403) {
            // Insufficient permissions
            showError('You do not have permission to perform this action');
        } else if (error.status === 404) {
            // Resource not found
            showError('The requested resource was not found');
        } else {
            // Generic error
            showError('An error occurred: ' + error.message);
        }
        
        return { success: false, error: error.message };
    }
}
```

## Testing Integration

### Test Client Account
```javascript
// Test client login
const testClient = await clientPortal.loginClient('1234567890', 'TEST123');

// Test getting client data
const reports = await clientPortal.getMyReports();
const invoices = await clientPortal.getMyInvoices();
```

## Deployment Considerations

### 1. Environment Variables
```bash
# Required environment variables
JWT_SECRET=your-secret-key
DB_HOST=localhost
DB_USER=username
DB_PASSWORD=password
DB_NAME=laapak_reports
NODE_ENV=production
```

### 2. CORS Configuration
The system is configured to allow requests from:
- `http://localhost:3001` (development)
- `http://localhost:3000` (development)
- `https://reports.laapak.com` (production)
- `https://www.reports.laapak.com` (production)

### 3. Database Setup
Ensure the database is properly configured with all required tables and relationships.

## Support and Troubleshooting

### Common Issues

1. **Token Expiration**: Implement automatic token refresh
2. **CORS Errors**: Ensure your domain is whitelisted
3. **Database Connection**: Verify database credentials and connectivity
4. **Permission Errors**: Check user roles and permissions

### Debug Mode
Enable debug logging by setting `NODE_ENV=development` in your environment variables.

This comprehensive guide should help you integrate with the Laapak Report System API effectively and securely.
