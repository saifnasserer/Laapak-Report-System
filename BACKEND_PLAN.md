# Laapak Report System - Backend Implementation Plan

## Database Schema Design

### Users Table
- `id` (primary key)
- `name` - Full name of the user
- `email` - Email address (unique)
- `password` - Hashed password
- `role` - Role (admin, technician, viewer)
- `active` - Account status
- `timestamps`

### Clients Table
- `id` (primary key)
- `name` - Client name
- `phone` - Phone number (for WhatsApp)
- `email` - Email address
- `notes` - Additional notes
- `timestamps`

### Devices Table
- `id` (primary key)
- `model` - Device model
- `brand` - Brand name (Dell, HP, etc.)
- `serial_number` - Serial number (unique)
- `processor` - Processor details
- `ram` - RAM specifications
- `storage` - Storage specifications
- `gpu` - Graphics card details
- `timestamps`

### Reports Table
- `id` (primary key)
- `order_number` - Order number (LAP-YYYY-XXXX)
- `client_id` - Foreign key to clients table
- `device_id` - Foreign key to devices table
- `user_id` - Foreign key to users table (technician)
- `inspection_date` - Date of inspection
- `timestamps`

### Component_Tests Table
- `id` (primary key)
- `report_id` - Foreign key to reports table
- `component_type` - Type of component (CPU, GPU, RAM, etc.)
- `test_purpose` - Purpose of the test
- `test_result` - Result (pass, warning, fail)
- `screenshot_path` - Path to the test screenshot
- `notes` - Additional notes
- `timestamps`

### External_Inspections Table
- `id` (primary key)
- `report_id` - Foreign key to reports table
- `image_path` - Path to the inspection image
- `description` - Description of the image
- `position` - Position/angle (front, back, etc.)
- `timestamps`

### Report_Notes Table
- `id` (primary key)
- `report_id` - Foreign key to reports table
- `note` - Note content
- `priority` - Priority level (low, medium, high)
- `timestamps`

## API Endpoints

### Authentication
- `POST /api/login` - User login
- `POST /api/logout` - User logout
- `GET /api/user` - Get current user

### Clients
- `GET /api/clients` - List all clients
- `GET /api/clients/{id}` - Get specific client
- `POST /api/clients` - Create new client
- `PUT /api/clients/{id}` - Update client
- `DELETE /api/clients/{id}` - Delete client

### Reports
- `GET /api/reports` - List all reports
- `GET /api/reports/{id}` - Get specific report with all related data
- `POST /api/reports` - Create new report
- `PUT /api/reports/{id}` - Update report
- `DELETE /api/reports/{id}` - Delete report
- `GET /api/reports/by-order/{order_number}` - Get report by order number
- `GET /api/reports/by-client/{client_id}` - Get reports for specific client
- `GET /api/reports/by-serial/{serial_number}` - Get report by device serial number

### Component Tests
- `GET /api/reports/{id}/tests` - Get all tests for a report
- `POST /api/reports/{id}/tests` - Add test to report
- `PUT /api/tests/{id}` - Update test
- `DELETE /api/tests/{id}` - Delete test
- `POST /api/tests/upload-screenshot` - Upload test screenshot

### External Inspections
- `GET /api/reports/{id}/inspections` - Get all inspections for a report
- `POST /api/reports/{id}/inspections` - Add inspection to report
- `DELETE /api/inspections/{id}` - Delete inspection
- `POST /api/inspections/upload` - Upload inspection image

### PDF Generation
- `GET /api/reports/{id}/pdf` - Generate PDF for report
- `POST /api/reports/{id}/send-whatsapp` - Send report link via WhatsApp

## Implementation Steps

1. **Set up Laravel Project**
   - Install Laravel via Composer
   - Configure database connection
   - Set up authentication (Laravel Sanctum)

2. **Create Database Migrations**
   - Create migration files for all tables
   - Define relationships between tables
   - Run migrations to create database schema

3. **Build Models**
   - Create Eloquent models for all entities
   - Define relationships between models
   - Add necessary accessors and mutators

4. **Create Controllers**
   - Implement RESTful controllers for all resources
   - Add validation rules for all inputs
   - Implement proper error handling

5. **Set up File Storage**
   - Configure Laravel's file storage
   - Create dedicated directories for different file types
   - Implement file upload and retrieval methods

6. **Implement PDF Generation**
   - Install and configure dompdf or snappyPDF
   - Create PDF view template
   - Add QR code generation
   - Ensure proper Arabic language support

7. **Add WhatsApp Integration**
   - Set up WhatsApp API credentials
   - Create message templates
   - Implement sending mechanism
   - Add error handling

8. **Connect Frontend**
   - Update frontend to use API endpoints
   - Implement proper loading states
   - Handle errors gracefully
   - Ensure offline support with local storage

9. **Add Authentication to Frontend**
   - Implement login form
   - Store and manage auth tokens
   - Add auth guards to protected routes
   - Implement role-based access control

10. **Testing & Optimization**
    - Write unit and feature tests
    - Test all API endpoints
    - Optimize database queries
    - Cache frequently accessed data

## Implementation Timeline

1. **Week 1**: Database design, migrations, and basic models
2. **Week 2**: Controllers, API endpoints, and authentication
3. **Week 3**: File uploads and storage implementation
4. **Week 4**: PDF generation and WhatsApp integration
5. **Week 5**: Frontend integration and testing
6. **Week 6**: Optimization, documentation, and deployment
