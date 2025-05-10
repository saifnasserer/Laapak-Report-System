# Laapak Report System - System Architecture and Components

## System Overview

The Laapak Report System is a comprehensive solution for managing device inspection reports, with a fully integrated frontend and backend architecture. The system provides secure authentication for both administrators and clients, with role-based access control and complete data management capabilities.

### Recent Updates
- **Backend Integration**: Frontend components now fully communicate with the backend API
- **Authentication System**: Secure JWT-based authentication for both admin and client users
- **Report Management**: Complete CRUD operations for device inspection reports
- **Offline Support**: Data caching for offline access to reports and client information
- **UI/UX Improvements**: Enhanced navigation, clickable header links, and removal of duplicated content
- **Admin Login Fix**: Resolved authentication issues for admin users
- **Removed Reset Password**: Simplified admin authentication by removing unnecessary reset password functionality

## 1. Client System Architecture

The client system in the Laapak Report System is designed to provide clients with a user-friendly interface to access their device maintenance reports, warranty information, maintenance schedules, and invoices. The system follows a modular approach with clear separation of concerns.

### Client System Components

#### Frontend Structure
- **HTML Pages**:
  - `client-dashboard.html`: The main client interface with tabs for reports, warranty, maintenance, and invoices
  - `report.html`: Displays detailed information about a specific maintenance report
  - `client-warranty.html`: Shows warranty details for client devices
  - `client-maintenance.html`: Displays maintenance schedule information

#### JavaScript Files
- **Core Client Functionality**:
  - `js/client-dashboard.js`: Manages the client dashboard UI and data loading
  - `js/client-header-component.js`: Provides a reusable header component for client pages
  - `js/client-warranty.js`: Handles warranty calculations and display
  - `js/client-maintenance.js`: Manages maintenance schedule calculations
  - `js/invoice-generator.js`: Generates and displays invoice information

- **Authentication and API**:
  - `js/auth-middleware.js`: Handles client authentication, token management, and session persistence
  - `js/auth-check.js`: Verifies client authentication status and redirects unauthenticated users
  - `js/api-service.js`: Provides API communication services for client data

#### CSS Files
- `css/styles.css`: Global styles shared across the application
- `css/custom-client.css`: Client-specific styling

### Client Data Flow
1. **Authentication**: Clients log in using their phone number and order code
2. **Data Retrieval**: Upon successful authentication, client data is fetched from the backend API
3. **Dashboard Display**: Data is organized into tabs for reports, warranty, maintenance, and invoices
4. **Interaction**: Clients can view detailed information by clicking on specific items

### Client System Features
- **Responsive Design**: Adapts to different screen sizes
- **Offline Support**: Basic functionality works offline with cached data
- **Improved Navigation**: Enhanced header with clickable links for better user experience
- **Streamlined UI**: Removed duplicated content and improved visual consistency
- **Component-Based Architecture**: Reusable components like the client header for consistent UI across pages
- **Tab-based Navigation**: Organized access to different types of information
- **Secure Authentication**: Token-based authentication with session management

## 2. Admin System Architecture

The admin system provides a comprehensive interface for administrators to manage clients, create and edit reports, and configure system settings. It follows a similar modular approach to the client system but with expanded capabilities.

### Admin System Components

#### Frontend Structure
- **HTML Pages**:
  - `admin.html`: Main admin dashboard with overview statistics
  - `clients.html`: Client management interface
  - `reports.html`: Report management and listing
  - `create-report.html`: Form for creating new maintenance reports
  - `settings.html`: System configuration interface

#### JavaScript Files
- **Core Admin Functionality**:
  - `js/admin.js`: Manages the admin dashboard UI and data loading
  - `js/header-component.js`: Provides a reusable header component for admin pages
  - `js/clients.js`: Handles client CRUD operations
  - `js/reports.js`: Manages report listing and filtering
  - `js/create-report.js`: Handles the multi-step report creation process

- **Authentication and API**:
  - `js/auth-middleware.js`: Handles admin authentication, token management, and session persistence
  - `js/auth-check.js`: Verifies admin authentication status and redirects unauthenticated users
  - `js/api-service.js`: Provides API communication services for admin data

#### CSS Files
- `css/styles.css`: Global styles shared across the application
- `css/custom-admin.css`: Admin-specific styling

### Admin Data Flow
1. **Authentication**: Admins log in using username and password
2. **Dashboard Overview**: Upon login, admins see system statistics and recent activities
3. **Client Management**: Admins can create, view, edit, and delete client records
4. **Report Management**: Admins can create new reports, view existing ones, and edit them
5. **System Configuration**: Admins can adjust system settings and preferences

### Admin System Features
- **Role-based Access Control**: Different admin roles (admin, technician, viewer) have different permissions
- **Client Management**: Complete CRUD operations for client records
- **Report Creation**: Multi-step form for detailed device inspection reports
- **Analytics Dashboard**: Overview of system statistics and activities
- **Responsive Design**: Works on various devices and screen sizes

## 3. Authentication and Backend Architecture

The authentication system and backend API provide the foundation for both client and admin interfaces, ensuring secure access to data and functionality.

### Authentication Components

#### Backend Structure
- **API Routes**:
  - `routes/auth.js`: Handles admin authentication
  - `routes/clients.js`: Includes client authentication endpoints
  - `routes/users.js`: Manages admin user accounts
  - `routes/reset-password.js`: Handles password reset functionality
  - `routes/reports.js`: Manages report CRUD operations

- **Middleware**:
  - `middleware/auth.js`: Verifies JWT tokens and enforces role-based access control

- **Models**:
  - `models/Admin.js`: Defines the admin user schema
  - `models/Client.js`: Defines the client schema
  - `models/Report.js`: Defines the report schema with relationships to Admin and Client

#### Authentication Flow
1. **Login Request**: User submits credentials (admin: username/password, client: phone/orderCode)
2. **Credential Verification**: Backend validates credentials against the database
3. **Token Generation**: Upon successful verification, a JWT token is generated
4. **Token Storage**: Token is stored in localStorage or sessionStorage based on "remember me" option
5. **Authenticated Requests**: Subsequent API requests include the token in headers
6. **Token Verification**: Middleware verifies token validity for protected routes

### Frontend-Backend Integration

#### API Service
- `js/api-service.js`: Central service for all API communication
  - Handles authentication token management
  - Provides methods for all CRUD operations
  - Includes error handling and response parsing

#### Data Flow
1. **Authentication**: User logs in via `login.js` which communicates with the auth API
2. **Token Management**: Auth token stored and managed by `auth-middleware.js`
3. **Data Retrieval**: Components use `api-service.js` to fetch data from the backend
4. **Data Display**: Retrieved data is displayed in the appropriate components
5. **Offline Support**: Data is cached for offline access using localStorage

#### Report Management
- **Creation**: Reports created in `create-report.js` are sent to the backend via API
- **Retrieval**: Reports fetched from backend in `report.js` and `client-dashboard.js`
- **Updates**: Changes to reports are sent to the backend and reflected in the UI
- **Search**: Backend provides search functionality for finding specific reports

### Backend API Architecture

#### Core Components
- **Server Setup**:
  - `server.js`: Main entry point that configures Express and middleware
  - `config/config.js`: Application configuration settings
  - `config/db.js`: Database connection setup
  - `config/dbInit.js`: Database initialization and seeding

- **API Routes**:
  - `routes/clients.js`: Client CRUD operations
  - `routes/reports.js`: Report management endpoints
  - `routes/health.js`: System health check endpoints

- **Database Models**:
  - `models/Admin.js`: Admin user model
  - `models/Client.js`: Client model
  - `models/Report.js`: Report model
  - `models/index.js`: Model associations and exports

### API Data Flow
1. **Request Reception**: Express server receives API requests
2. **Authentication**: Middleware authenticates and authorizes requests
3. **Data Processing**: Route handlers process requests and interact with the database
4. **Response Generation**: Appropriate responses are generated and sent back to the client

### Security Features
- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: Secure storage of passwords using bcrypt
- **Role-based Access Control**: Different permissions for different user roles
- **Input Validation**: Validation of all incoming data
- **Error Handling**: Comprehensive error handling and logging

## File Structure Summary

```
Laapak Report System/
├── config/
│   ├── config.js         # Application configuration
│   ├── db.js             # Database connection
│   └── dbInit.js         # Database initialization
├── middleware/
│   └── auth.js           # Authentication middleware
├── models/
│   ├── Admin.js          # Admin user model
│   ├── Client.js         # Client model
│   ├── Report.js         # Report model
│   └── index.js          # Model associations
├── routes/
│   ├── auth.js           # Authentication routes
│   ├── clients.js        # Client management routes
│   ├── health.js         # Health check routes
│   ├── reports.js        # Report management routes
│   ├── reset-password.js # Password reset routes
│   └── users.js          # User management routes
├── js/
│   ├── admin.js                # Admin dashboard logic
│   ├── api-service.js          # API communication service
│   ├── auth-check.js           # Authentication verification
│   ├── auth-middleware.js      # Frontend auth middleware
│   ├── client-dashboard.js     # Client dashboard logic
│   ├── client-header-component.js # Client header component
│   ├── client-maintenance.js   # Client maintenance logic
│   ├── client-warranty.js      # Client warranty logic
│   ├── clients.js              # Client management logic
│   ├── create-report.js        # Report creation logic
│   ├── header-component.js     # Admin header component
│   ├── invoice-generator.js    # Invoice generation logic
│   ├── login.js                # Login page logic
│   └── reports.js              # Report management logic
├── css/
│   ├── styles.css              # Global styles
│   ├── custom-admin.css        # Admin-specific styles
│   └── custom-client.css       # Client-specific styles
├── html/
│   ├── admin.html              # Admin dashboard
│   ├── client-dashboard.html   # Client dashboard
│   ├── clients.html            # Client management
│   ├── create-report.html      # Report creation
│   ├── index.html              # Login page
│   ├── report.html             # Report view
│   └── settings.html           # Settings page
└── server.js                   # Main server entry point
```

This architecture provides a scalable, maintainable, and secure foundation for the Laapak Report System, with clear separation of concerns between client and admin functionality, and a robust authentication and API layer.
