# Laapak Report System - Client Files List

## Overview
This document lists all client-related files in the Laapak Report System, organized by type and functionality.

## HTML Files (Client Pages)

### Main Client Pages
- `client-login.html` - Client login page
- `client-dashboard.html` - Client dashboard after login
- `client-login-test.html` - Client login testing page

### Related Client Pages
- `clients.html` - Admin page for managing clients
- `report.html` - Report viewing page (client accessible)
- `view-invoice.html` - Invoice viewing page (client accessible)

## CSS Files (Client Styling)

### Client-Specific Styles
- `css/custom-client.css` - Main client portal styling
- `css/child-friendly.css` - Child-friendly report styling
- `css/device-gallery.css` - Device gallery styling
- `css/premium-report.css` - Premium report styling
- `css/report-walkthrough.css` - Report walkthrough styling

### Shared Styles
- `css/styles.css` - Main application styles
- `css/form-steps.css` - Form step styling

## JavaScript Files (Client Functionality)

### Client-Specific JavaScript
- `js/client-dashboard.js` - Client dashboard functionality
- `js/client-display.js` - Client data display
- `js/client-header-component.js` - Client header component
- `js/client-login.js` - Client login functionality
- `js/client-maintenance.js` - Client maintenance features
- `js/client-selection.js` - Client selection functionality
- `js/client-warranty.js` - Client warranty features

### Authentication & API
- `js/api-service.js` - API service for all operations
- `js/auth-check.js` - Authentication checking
- `js/auth-middleware.js` - Authentication middleware

### Shared JavaScript
- `js/main.js` - Main application logic
- `js/config.js` - Configuration settings

## Backend Files (Client Support)

### API Routes
- `routes/auth.js` - Authentication routes (client login)
- `routes/clients.js` - Client management routes
- `routes/reports.js` - Report routes (client access)
- `routes/invoices.js` - Invoice routes (client access)

### Models
- `models/Client.js` - Client data model
- `models/Report.js` - Report data model
- `models/Invoice.js` - Invoice data model

### Middleware
- `middleware/auth.js` - Authentication middleware

## Assets (Client Resources)

### Images
- `img/logo.png` - Main Laapak logo
- `img/cropped-Logo-mark.png.png` - Logo mark/icon
- `img/dashboard-illustration.svg` - Dashboard illustration

## Client Portal Structure (Organized)

### HTML Files
```
client-portal/html/
├── client-login.html
├── client-dashboard.html
└── client-login-test.html
```

### CSS Files
```
client-portal/css/
├── custom-client.css
├── child-friendly.css
├── device-gallery.css
├── premium-report.css
└── report-walkthrough.css
```

### JavaScript Files
```
client-portal/js/
├── api-service.js
├── auth-check.js
├── auth-middleware.js
├── client-dashboard.js
├── client-display.js
├── client-header-component.js
├── client-login.js
├── client-maintenance.js
├── client-selection.js
└── client-warranty.js
```

### Assets
```
client-portal/assets/
├── cropped-Logo-mark.png.png
├── dashboard-illustration.svg
└── logo.png
```

## Client Features by File

### Authentication Features
- **Login**: `client-login.html`, `js/client-login.js`
- **Auth Check**: `js/auth-check.js`, `js/auth-middleware.js`
- **API Service**: `js/api-service.js`

### Dashboard Features
- **Dashboard**: `client-dashboard.html`, `js/client-dashboard.js`
- **Header**: `js/client-header-component.js`
- **Display**: `js/client-display.js`

### Report Features
- **Report Viewing**: `report.html`
- **Child-Friendly**: `css/child-friendly.css`
- **Premium Reports**: `css/premium-report.css`
- **Report Walkthrough**: `css/report-walkthrough.css`

### Invoice Features
- **Invoice Viewing**: `view-invoice.html`
- **Invoice Display**: Integrated in dashboard

### Maintenance Features
- **Maintenance**: `js/client-maintenance.js`
- **Warranty**: `js/client-warranty.js`
- **Device Gallery**: `css/device-gallery.css`

### Profile Management
- **Profile Updates**: Integrated in dashboard
- **Client Selection**: `js/client-selection.js`

## API Endpoints for Clients

### Authentication
- `POST /api/clients/auth` - Client login
- `GET /api/auth/me` - Get current user

### Data Access
- `GET /api/reports/client/me` - Get client's reports
- `GET /api/invoices/client` - Get client's invoices
- `GET /api/users/clients/:id` - Get client profile
- `PUT /api/users/clients/:id` - Update client profile

## Security Features

### Client Data Protection
- JWT token authentication
- Client data isolation
- Role-based access control
- Secure API endpoints

### Privacy Controls
- Clients can only access their own data
- No cross-client data access
- Secure session management
- Token expiration handling

## Deployment Notes

### Required Files for Client Portal
1. All HTML files in `client-portal/html/`
2. All CSS files in `client-portal/css/`
3. All JavaScript files in `client-portal/js/`
4. All assets in `client-portal/assets/`
5. Backend API routes and models
6. Authentication middleware

### Dependencies
- Bootstrap 5.3.0 (RTL)
- Font Awesome 6.4.0
- Custom CSS and JavaScript
- API service integration

### Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile responsive design
- RTL (Right-to-Left) support for Arabic
- Progressive Web App features

This comprehensive list includes all files needed for the client portal functionality in the Laapak Report System.

