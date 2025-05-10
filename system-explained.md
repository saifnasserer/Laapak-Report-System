# Laapak Report System - System Architecture and Components

## System Overview

The Laapak Report System is a comprehensive solution for managing device inspection reports, with a fully integrated frontend and backend architecture. The system provides secure authentication for both administrators and clients, with role-based access control and complete data management capabilities.

### Recent Updates
- **Enhanced Client Database Integration**: Implemented robust client database integration with real-time updates across all pages
- **Improved Client Management**: Enhanced client CRUD operations with automatic UI refresh and data synchronization
- **Offline Client Support**: Added fallback mechanisms and mock data for offline client management
- **Modular Settings Architecture**: Restructured settings functionality into smaller, more maintainable modules
- **Client Selection in Reports**: Added ability to select existing clients when creating reports and add new clients on the fly
- **User Management Improvements**: Fixed issues with adding, editing, and deleting users in the settings page
- **Backend Integration**: Frontend components now fully communicate with the backend API
- **Authentication System**: Secure JWT-based authentication for both admin and client users
- **Report Management**: Complete CRUD operations for device inspection reports
- **Offline Support**: Data caching for offline access to reports and client information
- **UI/UX Improvements**: Enhanced navigation, clickable header links, and removal of duplicated content

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
  - `js/clients.js`: Handles client CRUD operations with improved UI updates
  - `js/reports.js`: Manages report listing and filtering
  - `js/create-report.js`: Handles the multi-step report creation process with client selection

- **Settings Modules**:
  - `js/settings/settings-manager.js`: Main coordinator for all settings modules
  - `js/settings/settings-constants.js`: Constants and default values used across settings modules
  - `js/settings/settings-utils.js`: Utility functions for settings components
  - `js/settings/user-manager.js`: Handles user management functionality
  - `js/settings/backup-manager.js`: Manages backup creation and restoration
  - `js/settings/appearance-manager.js`: Controls theme and UI preferences
  - `js/settings/general-manager.js`: Manages general system settings

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
- **Integrated Client Database Management**: Comprehensive client database integration with consistent API usage across all pages
- **Real-time Client Data Synchronization**: Automatic refresh of client data after any CRUD operation to ensure all views stay in sync
- **Enhanced Client Selection**: Ability to select existing clients when creating reports and add new clients on the fly with immediate UI updates
- **Improved Client Management Interface**: Streamlined client management with proper UI feedback and data validation
- **Offline Client Management**: Robust fallback mechanisms with localStorage caching and mock data for offline operations
- **Modular Settings Architecture**: Settings functionality divided into smaller, more maintainable modules for better organization and easier debugging
- **Improved User Management**: Fixed issues with adding, editing, and deleting users in the settings page
- **Role-based Access Control**: Different admin roles (admin, technician, viewer) have different permissions
- **Advanced Report Creation**: Multi-step form for detailed device inspection reports with client integration
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
  - Provides standardized methods for all CRUD operations
  - Implements consistent error handling and response parsing
  - Supports both direct API requests and specialized client/report methods

#### Client Database Integration
- **Consistent API Method Usage**: Standardized approach to client operations across all pages
  - `getClients()`: Retrieves all clients with optional filtering
  - `createClient()`: Creates new client records with validation
  - `updateClient()`: Updates existing client information
  - `deleteClient()`: Removes client records with proper cleanup
- **Real-time Data Synchronization**: Automatic refresh of client data after any CRUD operation
- **Fallback Mechanisms**: Multi-layered approach for handling API failures
  - Primary: Direct API communication
  - Secondary: localStorage cached data
  - Tertiary: Mock client data for complete offline support

#### Data Flow
1. **Authentication**: User logs in via `login.js` which communicates with the auth API
2. **Token Management**: Auth token stored and managed by `auth-middleware.js`
3. **Data Retrieval**: Components use `api-service.js` to fetch data from the backend
4. **Data Synchronization**: Changes to client data are immediately propagated to all views
5. **Data Display**: Retrieved data is displayed in the appropriate components with proper UI feedback
6. **Offline Support**: Data is cached for offline access using localStorage with automatic sync when connection is restored

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
│   ├── create-report.js        # Report creation logic with client selection
│   ├── header-component.js     # Admin header component
│   ├── invoice-generator.js    # Invoice generation logic
│   ├── login.js                # Login page logic
│   ├── reports.js              # Report management logic
│   ├── settings.js             # Entry point for settings modules
│   ├── settings/
│   │   ├── settings-manager.js     # Main coordinator for settings modules
│   │   ├── settings-constants.js   # Constants and default values
│   │   ├── settings-utils.js       # Utility functions for settings
│   │   ├── user-manager.js         # User management functionality
│   │   ├── backup-manager.js       # Backup creation and restoration
│   │   ├── appearance-manager.js   # Theme and UI preferences
│   │   └── general-manager.js      # General system settings
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

## 5. Report Creation Process

The report creation process is a central feature of the Laapak Report System, implemented through a multi-step form that guides technicians through collecting comprehensive device inspection data. This section explains the technical implementation of this process.

### Multi-Step Form Architecture

The report creation form is divided into five main steps, each focusing on different aspects of the device inspection:

1. **Basic Information**: Client selection, order details, and device identification
2. **Technical Tests**: Hardware component status checks and system performance tests
3. **External Inspection**: Physical condition assessment and image uploads
4. **Notes**: General observations and internal notes
5. **Invoice**: Optional billing information and payment details

### Key Files Involved

- **`create-report.html`**: Contains the HTML structure of the multi-step form
- **`js/create-report.js`**: Handles client selection, data collection, and form submission
- **`js/form-steps.js`**: Manages the multi-step form navigation, validation, and submission logic

### Form Steps Management (`form-steps.js`)

The `form-steps.js` file is responsible for managing the multi-step form functionality. It provides a robust framework for navigating between steps, validating user input, and submitting the completed form.

#### Core Functions and Components

1. **Step Navigation**
   - `showStep(stepIndex)`: Displays the specified step and hides others
   - `nextStep()`: Validates the current step and advances to the next if valid
   - `prevStep()`: Moves back to the previous step without validation
   - `updateProgressBar()`: Updates the visual progress indicator

2. **Form Validation**
   - `validateStep(stepIndex)`: Validates a specific step based on its type
   - `validateBasicInfoStep()`: Ensures client and device information is complete
   - `validateTechnicalStep()`: Checks that technical tests are properly documented
   - `validateExternalStep()`: Validates external inspection data
   - `validateNotesStep()`: Simple validation for notes (usually always passes)
   - `validateInvoiceStep()`: Validates invoice data if billing is enabled
   - `validateRequiredFields()`: Generic function to check required fields in any step

3. **Form Submission**
   - `handleFormSubmit(event)`: Processes the form submission
   - `collectReportData()`: Gathers all form data into a structured object
   - `saveReport(reportData)`: Sends the report data to the backend API
   - `showSuccessModal(reportData, invoice)`: Displays success message after submission
   - `updateSuccessModal(reportData, invoice)`: Updates modal content with report details

4. **Optional Invoice Logic**
   - The invoice step can be enabled or disabled based on user preference
   - When disabled, the invoice step is skipped in validation
   - The submit button text changes based on whether billing is enabled

#### Step Validation Process

The validation process follows these steps:

1. When a user clicks "Next" or submits the form, the current step is validated
2. If validation fails, error messages are displayed and progression is halted
3. If validation passes, the user advances to the next step or the form is submitted

```javascript
// Example of step validation logic
function validateStep(stepIndex) {
    const stepEl = document.querySelectorAll('.form-step')[stepIndex];
    const errorMessages = [];
    
    let isValid = false;
    
    // Validate based on step type
    switch(stepIndex) {
        case 0: // Basic Info
            isValid = validateBasicInfoStep(stepEl, errorMessages);
            break;
        case 1: // Technical Tests
            isValid = validateTechnicalStep(stepEl, errorMessages);
            break;
        case 2: // External Inspection
            isValid = validateExternalStep(stepEl, errorMessages);
            break;
        case 3: // Notes
            isValid = validateNotesStep(stepEl, errorMessages);
            break;
        case 4: // Invoice
            isValid = validateInvoiceStep(stepEl, errorMessages);
            break;
    }
    
    // Display or clear error messages
    displayErrorMessages(stepEl, errorMessages);
    
    return isValid;
}
```

#### Invoice Step Optional Logic

The invoice step can be made optional through a checkbox in the UI:

```javascript
// Validation logic for invoice step
function validateInvoiceStep(stepEl, errorMessages) {
    const billingEnabled = document.getElementById('enableBilling')?.checked || false;
    if (!billingEnabled) {
        return true; // Skip validation if billing is disabled
    }
    return validateRequiredFields(stepEl, errorMessages);
}
```

### Data Collection Process (`create-report.js`)

The `create-report.js` file handles the collection and organization of report data from the form. It works in conjunction with `form-steps.js` to ensure all necessary data is captured.

#### Client Selection and Management

1. **Client Loading**
   - `loadClients()`: Fetches client data from the API or localStorage
   - `populateClientDropdown(clients)`: Fills the client selection dropdown
   - `setupClientSearch()`: Implements search functionality for finding clients

2. **New Client Creation**
   - `saveNewClient()`: Adds a new client to the system during report creation
   - `validateClientForm()`: Ensures new client data is valid
   - `addClientToDropdown(client)`: Updates the client dropdown with the new client

#### Data Collection Functions

1. **`collectReportData()`**: The main function that gathers all form data
   - Collects client information from the selected client
   - Gathers device details (model, serial number, etc.)
   - Compiles hardware status checks
   - Collects system component test results
   - Processes external inspection data and images
   - Includes notes and observations
   - Adds invoice data if billing is enabled

```javascript
// Example of data collection logic
window.collectReportData = function() {
    // Get client ID from selection
    const clientId = document.getElementById('clientSelect')?.value || null;
    
    // Find selected client details from global clientsData
    let clientDetails = {};
    if (clientId && Array.isArray(clientsData)) {
        const selectedClient = clientsData.find(client => client.id == clientId);
        if (selectedClient) {
            clientDetails = {
                clientName: selectedClient.name,
                clientPhone: selectedClient.phone,
                clientEmail: selectedClient.email || '',
                clientAddress: selectedClient.address || ''
            };
        }
    }
    
    // Check if billing is enabled
    const billingEnabled = document.getElementById('enableBilling')?.checked || false;
    
    // Get hardware component statuses
    const hardwareStatus = {
        camera: document.getElementById('camera_status')?.value || 'not_tested',
        speakers: document.getElementById('speakers_status')?.value || 'not_tested',
        // Additional hardware components...
    };
    
    // Get invoice data if billing is enabled
    let invoiceData = null;
    if (billingEnabled) {
        const taxRate = parseFloat(document.getElementById('taxRate')?.value || 15);
        const discount = parseFloat(document.getElementById('discount')?.value || 0);
        // Additional invoice data...
        
        invoiceData = {
            taxRate,
            discount,
            paymentStatus,
            paymentMethod,
            subtotal,
            taxAmount,
            totalAmount
        };
    }
    
    // Return collected data
    return {
        id: reportId,
        clientId,
        ...clientDetails,
        orderNumber: document.getElementById('orderNumber')?.value || '',
        inspectionDate: document.getElementById('inspectionDate')?.value || new Date().toISOString().split('T')[0],
        deviceModel: document.getElementById('deviceModel')?.value || '',
        serialNumber: document.getElementById('serialNumber')?.value || '',
        hardwareStatus,
        systemComponents,
        externalImages,
        notes: document.getElementById('reportNotes')?.value || '',
        billingEnabled: billingEnabled,
        invoice: invoiceData,
        amount: invoiceData ? invoiceData.totalAmount : 0,
        createdAt: new Date().toISOString()
    };
};
```

2. **Billing Toggle Functionality**
   - `setupBillingToggle()`: Configures the billing checkbox behavior
   - Updates UI elements based on the billing state
   - Shows/hides payment information and invoice preview sections
   - Changes the submit button text accordingly

```javascript
function setupBillingToggle() {
    const enableBillingCheckbox = document.getElementById('enableBilling');
    const paymentInfoSection = document.getElementById('paymentInfoSection');
    const invoicePreviewSection = document.querySelector('.card.bg-light');
    const submitButton = document.getElementById('submitReportBtn');
    
    if (!enableBillingCheckbox || !paymentInfoSection || !invoicePreviewSection || !submitButton) return;
    
    // Function to update UI based on checkbox state
    function updateBillingUI() {
        const isEnabled = enableBillingCheckbox.checked;
        
        // Show/hide payment info section
        paymentInfoSection.style.display = isEnabled ? 'block' : 'none';
        
        // Show/hide invoice preview section
        invoicePreviewSection.style.display = isEnabled ? 'block' : 'none';
        
        // Update submit button text
        submitButton.textContent = isEnabled ? 'إنشاء التقرير والفاتورة' : 'إنشاء التقرير';
    }
    
    // Set initial state
    updateBillingUI();
    
    // Add event listener for checkbox changes
    enableBillingCheckbox.addEventListener('change', updateBillingUI);
}
```

### Form Submission and API Integration

When the form is submitted, the following process occurs:

1. The form submission event is captured by the `handleFormSubmit()` function
2. All form data is collected using `collectReportData()`
3. The data is validated one final time
4. If valid, the report is saved using `saveReport(reportData)`
5. The API service sends the data to the backend
6. Upon success, a modal is shown with the report details and options to view the report or create an invoice

```javascript
async function handleFormSubmit(event) {
    event.preventDefault();
    
    // Validate all steps before submission
    let allValid = true;
    for (let i = 0; i < totalSteps; i++) {
        if (!validateStep(i)) {
            allValid = false;
            showStep(i);
            break;
        }
    }
    
    if (!allValid) return;
    
    // Collect all form data
    const reportData = window.collectReportData();
    
    try {
        // Show loading state
        const submitBtn = document.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> جاري الحفظ...';
        
        // Save report to API or localStorage
        const result = await saveReport(reportData);
        
        // Show success message
        showSuccessModal(reportData, reportData.invoice);
        
        // Reset form
        resetForm();
    } catch (error) {
        console.error('Error saving report:', error);
        showToast('حدث خطأ أثناء حفظ التقرير. يرجى المحاولة مرة أخرى.', 'error');
    } finally {
        // Restore button state
        const submitBtn = document.querySelector('button[type="submit"]');
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}
```

### Success Modal and Post-Submission Options

After successful submission, a modal is displayed with:

1. Confirmation message with report ID
2. Button to view the created report
3. Button to create an invoice (if billing is enabled but no invoice was created)

```javascript
function updateSuccessModal(reportData, invoice) {
    const modal = document.getElementById('reportCreatedModal');
    if (!modal) return;
    
    // Update report ID and link
    const reportIdEl = modal.querySelector('#createdReportId');
    if (reportIdEl) {
        reportIdEl.textContent = reportData.id;
    }
    
    // Update invoice information if available
    const invoiceInfoEl = modal.querySelector('#invoiceInfo');
    if (invoiceInfoEl) {
        if (invoice) {
            invoiceInfoEl.innerHTML = `
                <div class="alert alert-success">
                    <i class="fas fa-check-circle me-2"></i>
                    تم إنشاء فاتورة بقيمة <strong>${invoice.totalAmount.toFixed(2)} جنية</strong>
                </div>
            `;
        } else if (reportData.billingEnabled) {
            invoiceInfoEl.innerHTML = `
                <div class="alert alert-info">
                    <i class="fas fa-info-circle me-2"></i>
                    تم تفعيل الفوترة ولكن لم يتم إنشاء فاتورة. يمكنك إنشاء فاتورة لاحقًا.
                </div>
            `;
        } else {
            invoiceInfoEl.innerHTML = '';
        }
    }
    
    // Set up view report button
    const viewReportBtn = modal.querySelector('#viewReportBtn');
    if (viewReportBtn) {
        viewReportBtn.onclick = function(e) {
            e.preventDefault();
            window.location.href = `report.html?id=${reportData.id}`;
        };
    }
    
    // Set up create invoice button if billing is enabled but no invoice was created
    const createInvoiceBtn = modal.querySelector('#createInvoiceBtn');
    if (createInvoiceBtn) {
        if (reportData.billingEnabled && !invoice) {
            createInvoiceBtn.style.display = 'inline-block';
            createInvoiceBtn.onclick = function(e) {
                e.preventDefault();
                window.location.href = 'create-invoice.html';
            };
        } else {
            createInvoiceBtn.style.display = 'none';
        }
    }
}
```

### Data Flow Summary

1. **User Input**: Technician enters report data through the multi-step form
2. **Validation**: Each step is validated before proceeding
3. **Data Collection**: All form data is collected into a structured object
4. **API Submission**: Data is sent to the backend API
5. **Feedback**: Success modal provides confirmation and next steps
6. **Navigation Options**: User can view the report or create an invoice

This comprehensive approach ensures that report data is collected accurately and completely, with appropriate validation at each step and a smooth user experience throughout the process.
