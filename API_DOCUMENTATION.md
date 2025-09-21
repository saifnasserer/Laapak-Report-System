# Laapak Report System - API Documentation

## Overview

The Laapak Report System has a comprehensive REST API built with Node.js, Express, and MySQL/Sequelize. The API provides full CRUD operations for reports, invoices, clients, and user management with proper authentication and authorization.

## Base URL

- **Development**: `http://localhost:3000/`
- **Production**: `https://reports.laapak.com/`

## Authentication

The API uses JWT tokens for authentication. Include the token in the request header:

```javascript
headers: {
    'Content-Type': 'application/json',
    'x-auth-token': 'your-jwt-token-here'
}
```

## API Service (Client-Side)

The system includes a comprehensive `ApiService` class (`js/api-service.js`) that handles all API interactions:

```javascript
// Initialize the API service
const apiService = new ApiService();

// Or with custom base URL
const apiService = new ApiService('https://reports.laapak.com');
```

## API Endpoints

### 1. Authentication Routes (`/api/auth`)

#### Login (Admin)
```javascript
POST /api/auth/login
Content-Type: application/json

{
    "username": "admin_username",
    "password": "admin_password"
}

// Response
{
    "token": "jwt-token-here",
    "user": {
        "id": 1,
        "username": "admin",
        "isAdmin": true
    }
}
```

#### Login (Client)
```javascript
POST /api/clients/auth
Content-Type: application/json

{
    "phone": "client_phone_number",
    "orderCode": "order_code"
}

// Response
{
    "token": "jwt-token-here",
    "client": {
        "id": 1,
        "name": "Client Name",
        "phone": "phone_number",
        "email": "email@example.com"
    }
}
```

### 2. Reports API (`/api/reports`)

#### Get All Reports
```javascript
GET /api/reports
// Optional query parameters:
// - billing_enabled: true/false
// - fetch_mode: 'all_reports' (to include invoiced reports)
// - startDate, endDate: date range filters

// Using ApiService
const reports = await apiService.getReports({
    billing_enabled: true,
    startDate: '2024-01-01',
    endDate: '2024-12-31'
});
```

#### Get Single Report
```javascript
GET /api/reports/:id

// Using ApiService
const report = await apiService.getReport('RPT123456');
```

#### Get Enhanced Report (with related data)
```javascript
// Using ApiService
const report = await apiService.getReportEnhanced('RPT123456', true);
```

#### Create Report
```javascript
POST /api/reports
Content-Type: application/json

{
    "client_id": 1,
    "title": "Report Title",
    "description": "Report Description",
    "device_model": "iPhone 15",
    "serial_number": "ABC123",
    "inspection_date": "2024-01-15T10:00:00Z",
    "hardware_status": "[{\"component\": \"screen\", \"status\": \"good\"}]",
    "external_images": "[\"image1.jpg\", \"image2.jpg\"]",
    "notes": "Additional notes",
    "billing_enabled": true,
    "amount": 500.00,
    "status": "active"
}

// Using ApiService
const newReport = await apiService.createNewReport(reportData);
```

#### Update Report
```javascript
PUT /api/reports/:id
Content-Type: application/json

{
    "client_name": "Updated Client Name",
    "notes": "Updated notes",
    "status": "completed"
}

// Using ApiService
const updatedReport = await apiService.updateReport('RPT123456', updateData);
```

#### Delete Report
```javascript
DELETE /api/reports/:id

// Using ApiService
await apiService.deleteReport('RPT123456');
```

#### Search Reports
```javascript
GET /api/reports/search?q=search_term

// Using ApiService
const results = await apiService.searchReports('iPhone');
```

#### Get Client Reports
```javascript
GET /api/reports/client/me
// Returns reports for authenticated client

// Using ApiService
const clientReports = await apiService.getClientReports();
```

### 3. Invoices API (`/api/invoices`)

#### Get All Invoices (Admin)
```javascript
GET /api/invoices
// Optional query parameters:
// - paymentMethod: 'cash', 'instapay', 'محفظة', 'بنك'
// - paymentStatus: 'paid', 'pending', 'partial', 'cancelled'
// - clientId: client ID
// - startDate, endDate: date range

// Using ApiService
const invoices = await apiService.getInvoices({
    paymentStatus: 'paid',
    startDate: '2024-01-01'
});
```

#### Get Single Invoice
```javascript
GET /api/invoices/:id

// Using ApiService
const invoice = await apiService.getInvoice('INV123456');
```

#### Create Invoice
```javascript
POST /api/invoices
Content-Type: application/json

{
    "id": "INV123456",
    "client_id": 1,
    "date": "2024-01-15T10:00:00Z",
    "subtotal": 400.00,
    "discount": 0.00,
    "taxRate": 15.00,
    "tax": 60.00,
    "total": 460.00,
    "paymentStatus": "unpaid",
    "paymentMethod": "cash",
    "items": [
        {
            "description": "Device Repair",
            "type": "service",
            "quantity": 1,
            "amount": 400.00,
            "totalAmount": 400.00
        }
    ]
}

// Using ApiService
const newInvoice = await apiService.createInvoice(invoiceData);
```

#### Create Bulk Invoice
```javascript
POST /api/invoices/bulk
Content-Type: application/json

{
    "date": "2024-01-15T10:00:00Z",
    "reportIds": ["RPT123", "RPT124", "RPT125"],
    "client_id": 1,
    "items": [...],
    "subtotal": 1200.00,
    "total": 1380.00
}

// Using ApiService
const bulkInvoice = await apiService.createBulkInvoiceForReports(reportIds, invoiceData);
```

#### Update Invoice
```javascript
PUT /api/invoices/:id
Content-Type: application/json

{
    "paymentStatus": "paid",
    "paymentMethod": "instapay",
    "notes": "Payment received"
}

// Using ApiService
const updatedInvoice = await apiService.updateInvoice('INV123456', updateData);
```

#### Update Invoice Payment
```javascript
PUT /api/invoices/:id/payment
Content-Type: application/json

{
    "paymentStatus": "paid",
    "paymentMethod": "cash"
}

// Using ApiService
await apiService.updateInvoicePayment('INV123456', paymentData);
```

#### Delete Invoice
```javascript
DELETE /api/invoices/:id

// Using ApiService
await apiService.deleteInvoice('INV123456');
```

#### Get Client Invoices
```javascript
GET /api/invoices/client
// Returns invoices for authenticated client

// Using ApiService
const clientInvoices = await apiService.getClientInvoices();
```

### 4. Clients API (`/api/clients`)

#### Get All Clients (Admin)
```javascript
GET /api/clients

// Using ApiService
const clients = await apiService.getClients();
```

#### Get Single Client
```javascript
GET /api/clients/:id

// Using ApiService
const client = await apiService.getClient(1);
```

#### Create Client
```javascript
POST /api/clients
Content-Type: application/json

{
    "name": "Client Name",
    "phone": "1234567890",
    "email": "client@example.com",
    "address": "Client Address",
    "orderCode": "ORD123456",
    "status": "active"
}

// Using ApiService
const newClient = await apiService.createClient(clientData);
```

#### Update Client
```javascript
PUT /api/clients/:id
Content-Type: application/json

{
    "name": "Updated Name",
    "phone": "0987654321",
    "email": "newemail@example.com"
}

// Using ApiService
const updatedClient = await apiService.updateClient(1, updateData);
```

#### Delete Client
```javascript
DELETE /api/clients/:id

// Using ApiService
await apiService.deleteClient(1);
```

### 5. User Management API (`/api/users`)

#### Get Admins
```javascript
GET /api/users/admins

// Using ApiService
const admins = await apiService.getAdmins();
```

#### Create Admin
```javascript
POST /api/users/admins
Content-Type: application/json

{
    "username": "new_admin",
    "password": "secure_password",
    "email": "admin@example.com"
}

// Using ApiService
const newAdmin = await apiService.createAdmin(adminData);
```

#### Update Admin
```javascript
PUT /api/users/admins/:id
Content-Type: application/json

{
    "username": "updated_admin",
    "email": "updated@example.com"
}

// Using ApiService
const updatedAdmin = await apiService.updateAdmin(1, updateData);
```

#### Delete Admin
```javascript
DELETE /api/users/admins/:id

// Using ApiService
await apiService.deleteAdmin(1);
```

#### Change Password
```javascript
POST /api/users/change-password
Content-Type: application/json

{
    "currentPassword": "old_password",
    "newPassword": "new_password"
}

// Using ApiService
await apiService.changePassword(passwordData);
```

### 6. Health Check

#### System Health
```javascript
GET /api/health

// Using ApiService
const health = await apiService.healthCheck();
```

## Error Handling

The API returns standardized error responses:

```javascript
// 400 Bad Request
{
    "error": "Validation error",
    "details": ["Field is required", "Invalid format"]
}

// 401 Unauthorized
{
    "error": "Access denied. No token provided."
}

// 403 Forbidden
{
    "error": "Not authorized to view this resource"
}

// 404 Not Found
{
    "error": "Resource not found"
}

// 500 Internal Server Error
{
    "error": "Internal server error",
    "details": "Error message (development only)"
}
```

## Usage Examples

### Complete Report Creation Flow
```javascript
// 1. Create a client
const client = await apiService.createClient({
    name: "John Doe",
    phone: "1234567890",
    email: "john@example.com",
    orderCode: "ORD123456"
});

// 2. Create a report
const report = await apiService.createNewReport({
    client_id: client.id,
    device_model: "iPhone 15",
    serial_number: "ABC123",
    inspection_date: new Date(),
    hardware_status: JSON.stringify([
        {component: "screen", status: "good"},
        {component: "battery", status: "needs_replacement"}
    ]),
    billing_enabled: true,
    amount: 500.00
});

// 3. Create an invoice for the report
const invoice = await apiService.createInvoice({
    id: "INV" + Date.now(),
    client_id: client.id,
    date: new Date(),
    subtotal: 500.00,
    taxRate: 15.00,
    tax: 75.00,
    total: 575.00,
    items: [{
        description: "Device Repair Service",
        type: "service",
        quantity: 1,
        amount: 500.00,
        totalAmount: 500.00
    }]
});
```

### Bulk Operations
```javascript
// Create bulk invoice for multiple reports
const reportIds = ["RPT123", "RPT124", "RPT125"];
const bulkInvoice = await apiService.createBulkInvoiceForReports(reportIds, {
    client_id: 1,
    date: new Date(),
    subtotal: 1200.00,
    total: 1380.00,
    items: [
        {description: "Repair Service 1", amount: 400.00, totalAmount: 400.00},
        {description: "Repair Service 2", amount: 400.00, totalAmount: 400.00},
        {description: "Repair Service 3", amount: 400.00, totalAmount: 400.00}
    ]
});
```

## Authentication Flow

### Admin Authentication
```javascript
// 1. Login to get token
const loginResponse = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        username: 'admin',
        password: 'password'
    })
});

const { token } = await loginResponse.json();

// 2. Set token in ApiService
apiService.setAuthToken(token);

// 3. Now you can make authenticated requests
const reports = await apiService.getReports();
```

### Client Authentication
```javascript
// 1. Client login
const loginResponse = await fetch('/api/clients/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        phone: '1234567890',
        orderCode: 'ORD123456'
    })
});

const { token } = await loginResponse.json();

// 2. Set token and get client data
apiService.setAuthToken(token);
const clientReports = await apiService.getClientReports();
```

## Database Models

The API works with the following main models:

- **Report**: Device inspection reports
- **Client**: Customer information
- **Invoice**: Billing information
- **InvoiceItem**: Invoice line items
- **Admin**: System administrators
- **ReportTechnicalTest**: Technical test results

## Rate Limiting & Security

- All endpoints require authentication except login endpoints
- Admin-only endpoints are protected with `adminAuth` middleware
- Client endpoints are protected with `clientAuth` middleware
- CORS is configured for specific origins
- Input validation is performed on all endpoints

## Development Setup

1. Install dependencies: `npm install`
2. Configure database in `config/db.js`
3. Run database migrations: `npm run migrate`
4. Start server: `npm start`
5. API will be available at `http://localhost:3000/api`

This comprehensive API provides full functionality for managing reports, invoices, clients, and users in the Laapak Report System.

