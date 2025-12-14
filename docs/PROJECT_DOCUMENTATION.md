# Laapak Report System - Comprehensive Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Technology Stack](#technology-stack)
4. [Database Design](#database-design)
5. [Core Features](#core-features)
6. [User Roles & Authentication](#user-roles--authentication)
7. [API Endpoints](#api-endpoints)
8. [Frontend Components](#frontend-components)
9. [Progressive Web App (PWA) Features](#progressive-web-app-pwa-features)
10. [Deployment & DevOps](#deployment--devops)
11. [Security Features](#security-features)
12. [Future Enhancements](#future-enhancements)

## Project Overview

The **Laapak Report System** is a comprehensive web-based application designed for laptop inspection and reporting services. It serves as a complete solution for managing device inspections, generating detailed reports, handling client relationships, and processing invoices. The system is built as a Progressive Web Application (PWA) with offline capabilities, making it accessible across various devices and network conditions.

### Key Objectives
- Streamline laptop inspection processes
- Generate detailed technical reports
- Manage client relationships and orders
- Handle billing and invoicing
- Provide offline-capable web application
- Support multi-language interface (Arabic/English)

## System Architecture

### Backend Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Express.js    │    │   Sequelize     │    │   MySQL         │
│   Server        │◄──►│   ORM           │◄──►│   Database      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌─────────────────┐
│   JWT Auth      │    │   File Storage  │
│   Middleware    │    │   (Images)      │
└─────────────────┘    └─────────────────┘
```

### Frontend Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   HTML5         │    │   Bootstrap 5   │    │   Custom CSS    │
│   (RTL Support) │    │   (RTL)         │    │   (Responsive)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Vanilla JS    │    │   Service       │    │   PWA Features  │
│   (ES6+)        │    │   Worker        │    │   (Offline)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Technology Stack

### Backend Technologies
- **Node.js** (v18+) - Runtime environment
- **Express.js** (v4.18.2) - Web framework
- **Sequelize** (v6.32.1) - ORM for database operations
- **MySQL** (v5.7+) - Relational database
- **JWT** (v9.0.1) - Authentication tokens
- **bcryptjs** (v2.4.3) - Password hashing
- **CORS** (v2.8.5) - Cross-origin resource sharing
- **Morgan** (v1.10.0) - HTTP request logger

### Frontend Technologies
- **HTML5** - Semantic markup with RTL support
- **CSS3** - Custom responsive styling
- **Bootstrap 5** - UI framework with RTL support
- **Vanilla JavaScript** (ES6+) - Client-side logic
- **Service Workers** - Offline functionality
- **PWA Manifest** - App installation capabilities

### Development & Deployment
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **Nodemon** - Development server with auto-reload
- **dotenv** - Environment variable management

## Database Design

### Core Tables

#### 1. Admins Table
```sql
CREATE TABLE admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role ENUM('admin', 'technician', 'viewer') NOT NULL DEFAULT 'viewer',
  email VARCHAR(255),
  lastLogin DATETIME,
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL
);
```

#### 2. Clients Table
```sql
CREATE TABLE clients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  address TEXT,
  orderCode VARCHAR(50) NOT NULL UNIQUE,
  lastLogin DATETIME,
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL
);
```

#### 3. Reports Table
```sql
CREATE TABLE reports (
  id VARCHAR(50) PRIMARY KEY,
  client_id INT NOT NULL,
  client_name VARCHAR(100),
  client_phone VARCHAR(20),
  client_email VARCHAR(100),
  client_address TEXT,
  order_number VARCHAR(20) NOT NULL,
  device_model VARCHAR(100) NOT NULL,
  serial_number VARCHAR(100),
  inspection_date DATETIME NOT NULL,
  hardware_status LONGTEXT,
  external_images LONGTEXT,
  notes TEXT,
  billing_enabled TINYINT(1) DEFAULT 0,
  amount DECIMAL(10,2) DEFAULT 0.00,
  status ENUM('pending', 'in-progress', 'completed', 'cancelled', 'active') DEFAULT 'active',
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);
```

#### 4. Invoices Table
```sql
CREATE TABLE invoices (
  id VARCHAR(50) PRIMARY KEY,
  client_id INT NOT NULL,
  report_id VARCHAR(50),
  invoice_number VARCHAR(50) NOT NULL UNIQUE,
  issue_date DATETIME NOT NULL,
  due_date DATETIME,
  subtotal DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2) DEFAULT 0.00,
  total_amount DECIMAL(10,2) NOT NULL,
  status ENUM('draft', 'sent', 'paid', 'overdue', 'cancelled') DEFAULT 'draft',
  notes TEXT,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE SET NULL
);
```

#### 5. Invoice Items Table
```sql
CREATE TABLE invoice_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  invoice_id VARCHAR(50) NOT NULL,
  description VARCHAR(255) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
);
```

### Database Relationships
- **Clients** → **Reports** (One-to-Many)
- **Clients** → **Invoices** (One-to-Many)
- **Reports** → **Invoices** (One-to-Many)
- **Invoices** → **Invoice Items** (One-to-Many)

## Core Features

### 1. Authentication System
- **Dual Authentication**: Separate login systems for admins and clients
- **JWT Tokens**: Secure token-based authentication
- **Role-based Access**: Admin, technician, and viewer roles
- **Session Management**: Automatic token refresh and validation

### 2. Report Management
- **Comprehensive Reports**: Detailed laptop inspection reports
- **Image Support**: External device images storage
- **Hardware Status**: Detailed hardware condition documentation
- **Status Tracking**: Report lifecycle management
- **Billing Integration**: Automatic invoice generation

### 3. Client Management
- **Client Profiles**: Complete client information management
- **Order Tracking**: Order code-based client access
- **Communication History**: Track client interactions
- **Report Access**: Clients can view their own reports

### 4. Invoice System
- **Automated Generation**: Create invoices from reports
- **Itemized Billing**: Detailed service breakdown
- **Status Tracking**: Invoice lifecycle management
- **PDF Generation**: Professional invoice documents

### 5. Admin Dashboard
- **User Management**: Admin, technician, and client management
- **Report Overview**: All reports with filtering and search
- **Analytics**: System usage statistics
- **Bulk Operations**: Mass report and invoice operations

## User Roles & Authentication

### Admin Roles
1. **Super Admin**: Full system access
2. **Technician**: Report creation and management
3. **Viewer**: Read-only access to reports

### Client Access
- **Phone + Order Code**: Simple client authentication
- **Report Access**: View only their own reports
- **Invoice Access**: View and download invoices

### Authentication Flow
```
1. User Login (Admin/Client)
   ↓
2. Credential Validation
   ↓
3. JWT Token Generation
   ↓
4. Token Storage (Local Storage)
   ↓
5. API Request Authentication
   ↓
6. Role-based Access Control
```

## API Endpoints

### Authentication Routes
- `POST /api/auth/admin` - Admin login
- `POST /api/auth/client` - Client login
- `GET /api/auth/me` - Get current user

### User Management
- `GET /api/users` - List all users
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Reports
- `GET /api/reports` - List reports
- `POST /api/reports` - Create report
- `GET /api/reports/:id` - Get specific report
- `PUT /api/reports/:id` - Update report
- `DELETE /api/reports/:id` - Delete report

### Clients
- `GET /api/clients` - List clients
- `POST /api/clients` - Create client
- `GET /api/clients/:id` - Get client details
- `PUT /api/clients/:id` - Update client

### Invoices
- `GET /api/invoices` - List invoices
- `POST /api/invoices` - Create invoice
- `GET /api/invoices/:id` - Get invoice details
- `PUT /api/invoices/:id` - Update invoice

## Frontend Components

### 1. Authentication Components
- **Login Forms**: Separate admin and client login
- **Token Management**: Automatic token refresh
- **Route Protection**: Authentication middleware

### 2. Report Components
- **Report Creation**: Multi-step form wizard
- **Report Viewer**: Detailed report display
- **Image Gallery**: Device image management
- **Status Updates**: Real-time status changes

### 3. Dashboard Components
- **Admin Dashboard**: Comprehensive admin interface
- **Client Dashboard**: Client-specific view
- **Analytics Widgets**: System statistics
- **Quick Actions**: Common task shortcuts

### 4. Invoice Components
- **Invoice Creation**: Automated from reports
- **Invoice Editor**: Manual invoice creation
- **PDF Generation**: Professional document creation
- **Status Tracking**: Invoice lifecycle management

## Progressive Web App (PWA) Features

### 1. Service Worker
- **Offline Caching**: Cache essential assets
- **Background Sync**: Sync data when online
- **Push Notifications**: Real-time updates
- **App Updates**: Automatic version management

### 2. Manifest Features
- **App Installation**: Install as native app
- **Splash Screen**: Professional app loading
- **Theme Colors**: Consistent branding
- **Orientation**: Landscape/portrait support

### 3. Offline Capabilities
- **Offline Reports**: View cached reports
- **Offline Forms**: Create reports offline
- **Data Sync**: Sync when connection restored
- **Offline Indicators**: Clear offline status

## Deployment & DevOps

### Docker Configuration
```yaml
version: '3.8'
services:
  app:
    build: .
    ports: ["3001:3001"]
    env_file: [.env]
    depends_on: [db]
    volumes: [.:/app]
    restart: always
  
  db:
    image: mysql:5.7
    environment:
      MYSQL_DATABASE: ${DB_NAME}
      MYSQL_USER: ${DB_USER}
      MYSQL_PASSWORD: ${DB_PASSWORD}
    ports: ["3306:3306"]
    volumes: [mysql_data:/var/lib/mysql]
```

### Environment Variables
```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=laapak_report_system
DB_PORT=3306

# JWT Configuration
JWT_SECRET=your_jwt_secret_key

# Server Configuration
PORT=3001
NODE_ENV=production
```

### Deployment Steps
1. **Environment Setup**: Configure environment variables
2. **Database Migration**: Run database migrations
3. **Docker Build**: Build application container
4. **Service Start**: Start with docker-compose
5. **Health Check**: Verify system functionality

## Security Features

### 1. Authentication Security
- **Password Hashing**: bcryptjs for secure password storage
- **JWT Tokens**: Secure token-based authentication
- **Token Expiration**: Automatic token refresh
- **Session Management**: Secure session handling

### 2. Data Protection
- **Input Validation**: Comprehensive input sanitization
- **SQL Injection Prevention**: Parameterized queries
- **XSS Protection**: Content Security Policy
- **CSRF Protection**: Cross-site request forgery prevention

### 3. API Security
- **Rate Limiting**: Prevent abuse
- **CORS Configuration**: Controlled cross-origin access
- **Request Logging**: Comprehensive audit trail
- **Error Handling**: Secure error responses

## Future Enhancements

### 1. Advanced Features
- **Real-time Notifications**: WebSocket integration
- **Advanced Analytics**: Business intelligence dashboard
- **Multi-language Support**: Internationalization
- **Mobile App**: Native mobile applications

### 2. Integration Capabilities
- **Payment Gateway**: Online payment processing
- **Email Integration**: Automated email notifications
- **SMS Integration**: Text message notifications
- **Third-party APIs**: External service integration

### 3. Performance Optimizations
- **Caching Layer**: Redis integration
- **CDN Integration**: Content delivery network
- **Database Optimization**: Query optimization
- **Image Optimization**: Automatic image compression

### 4. User Experience
- **Dark Mode**: Theme customization
- **Advanced Search**: Full-text search capabilities
- **Bulk Operations**: Mass data operations
- **Custom Reports**: User-defined report templates

### 5. Business Intelligence
- **Analytics Dashboard**: Comprehensive business metrics
- **Report Templates**: Customizable report formats
- **Export Capabilities**: Multiple export formats
- **Data Visualization**: Charts and graphs

## Conclusion

The Laapak Report System represents a modern, scalable solution for laptop inspection and reporting services. With its comprehensive feature set, robust architecture, and progressive web app capabilities, it provides a solid foundation for business growth and technological advancement.

The system's modular design, security features, and offline capabilities make it suitable for various deployment scenarios, from small businesses to enterprise-level operations. The technology stack chosen ensures long-term maintainability and scalability while providing excellent user experience across all devices.

---

**Last Updated**: December 2024  
**Version**: 1.0.0  
**Maintainer**: Laapak Development Team 