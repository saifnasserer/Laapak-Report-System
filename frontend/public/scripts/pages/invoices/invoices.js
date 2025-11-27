/**
 * Laapak Report System - Invoices Management
 * Handles the invoices listing, filtering, and management functionality
 */

/**
 * Get API base URL from config or auto-detect
 * @returns {string} The API base URL
 */
function getApiBaseUrl() {
    if (window.config && window.config.api && window.config.api.baseUrl) {
        return window.config.api.baseUrl;
    }
    // Auto-detect based on hostname
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:3001';
    }
    return 'https://reports.laapak.com';
}

let invoicesTable; // Global variable for the DataTable instance
let clients = []; // Store clients data
let reports = []; // Store reports data

document.addEventListener('DOMContentLoaded', function() {
    // Check if user is authenticated
    if (!authMiddleware.isAdminLoggedIn()) {
        window.location.href = 'login.html';
        return;
    }
    
    // Load header component
    if (document.getElementById('header-container')) {
        HeaderComponent.loadAdminHeader('invoices');
    }
    
    // Initialize the page - load clients first, then invoices
    initializeDataTable();
    loadClientsData().then(() => {
        // After clients are loaded, load invoices and reports
    loadInvoicesData();
    loadReportsData();
    });
    setupEventListeners();
    setupCalculations();
});

/**
 * Initialize DataTable for invoices
 */
function initializeDataTable() {
    const table = $('#invoicesTable');
    if (table.length === 0) return;
    
    try {
        // Check that the table has the correct number of columns
        if (table.find('thead th').length !== 7) {
            console.error('DataTable columns mismatch: Expected 7 columns in HTML markup');
            return;
        }
        
        // Clear any existing DataTable instance to avoid duplication
        if ($.fn.DataTable.isDataTable(table)) {
            table.DataTable().destroy();
        }
        
        // Initialize DataTable with configuration for local database data to match clients.html style
        invoicesTable = table.DataTable({
            language: {
                url: 'https://cdn.datatables.net/plug-ins/1.11.5/i18n/ar.json'
            },
            processing: true,
            responsive: true,
            ordering: true,
            pageLength: 10,
            // Define data columns that match your MySQL database structure
            columns: [
                // Define explicit mapping between data and columns
                { 
                    data: 'id', 
                    title: 'رقم الفاتورة',
                    type: 'num', // Specify numeric type for proper sorting
                    render: function(data, type, row) {
                        if (type === 'display') {
                            return data; // Return formatted ID for display
                        }
                        return row.idSort; // Return numeric value for sorting
                    }
                },
                { data: 'client_name', title: 'العميل' },
                { 
                    data: 'date', 
                    title: 'التاريخ',
                    type: 'num', // Specify numeric type for proper sorting
                    render: function(data, type, row) {
                        if (type === 'display') {
                            return data; // Return formatted date for display
                        }
                        return row.dateSort; // Return sort data for sorting
                    }
                },
                { 
                    data: 'total', 
                    title: 'المبلغ',
                    type: 'num', // Specify numeric type for proper sorting
                    render: function(data, type, row) {
                        if (type === 'display') {
                            return data; // Return formatted amount for display
                        }
                        return row.totalSort; // Return numeric value for sorting
                    }
                },
                { data: 'paymentStatus', title: 'حالة الدفع' },
                { data: 'paymentMethod', title: 'طريقة الدفع' },
                { data: 'actions', title: 'إجراءات', orderable: false }
            ],
            order: [[2, 'desc']], // Order by date, newest first
            // Empty data array to start - will be populated by AJAX
            data: [],
            // Disable built-in DataTables pagination to prevent duplication
            paging: true,
            pagingType: "simple_numbers",
            dom: '<"row"<"col-sm-12"tr>>', // Only show table, no built-in controls
            // Connect DataTable pagination to the custom pagination in HTML
            drawCallback: function() {
                // Hide the built-in DataTables pagination
                $(this).closest('.dataTables_wrapper').find('.dataTables_paginate').hide();
                $(this).closest('.dataTables_wrapper').find('.dataTables_info').hide();
                
                // Update the custom pagination UI
                updateCustomPagination(this.api().page.info());
            }
        });
        
        // Add custom search functionality with enhanced features
        setupSearchFunctionality();
        
        console.log('DataTable initialized successfully');
    } catch (error) {
        console.error('Error initializing DataTable:', error);
    }
}

/**
 * Load invoices data from API connected to local MySQL database
 */
async function loadInvoicesData(filters = {}) {
    try {
        // Clear existing data
        if (invoicesTable) {
            invoicesTable.clear();
        }
        
        // Build API URL with filters
        const apiBaseUrl = window.config ? window.config.api.baseUrl : window.location.origin;
        let apiUrl = `${apiBaseUrl}/api/invoices`;
        const queryParams = [];
        
        // Add filters to query params if any
        if (filters.clientId) queryParams.push(`clientId=${filters.clientId}`);
        if (filters.paymentStatus) queryParams.push(`paymentStatus=${filters.paymentStatus}`);
        if (filters.fromDate) queryParams.push(`fromDate=${filters.fromDate}`);
        if (filters.toDate) queryParams.push(`toDate=${filters.toDate}`);
        if (filters.search) queryParams.push(`search=${encodeURIComponent(filters.search)}`);
        
        // Add query params to URL
        if (queryParams.length > 0) {
            apiUrl += `?${queryParams.join('&')}`;
        }
        
        console.log('Fetching invoices from:', apiUrl);
        
        // Get token for authentication
        const token = authMiddleware.getAdminToken();
        if (!token) {
            throw new Error('Authentication token not available');
        }
        
        // Fetch invoices from API (which connects to your local MySQL database)
        const response = await fetch(apiUrl, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        // console.log('Received data from server:', data);
        
        // Extract invoices array from response
        let invoices = [];
        if (Array.isArray(data)) {
            invoices = data;
        } else if (data.invoices && Array.isArray(data.invoices)) {
            invoices = data.invoices;
        } else if (data.data && Array.isArray(data.data)) {
            invoices = data.data;
        }
        
        if (invoices.length === 0) {
            console.log('No invoices found in the database');
        }
        
        // Format the invoices for display
        const formattedInvoices = invoices.map(invoice => formatInvoiceForTable(invoice));
        
        // Update the DataTable with the formatted data
        if (invoicesTable) {
            invoicesTable.clear().rows.add(formattedInvoices).draw();
            console.log(`Added ${formattedInvoices.length} invoices to the table`);
        }
        
        return invoices;
    } catch (error) {
        console.error('Error loading invoices from local database:', error);
        showToast('حدث خطأ أثناء تحميل الفواتير', 'error');
        
        // Show error in table
        if (invoicesTable) {
            invoicesTable.clear().draw();
        }
        
        return [];
    }
}

/**
 * Format invoice data from MySQL database for display in the DataTable
 */
function formatInvoiceForTable(invoice) {
    try {
        // Log the raw invoice data for debugging
        // console.log('Formatting invoice:', invoice);
        
        if (!invoice || typeof invoice !== 'object') {
            console.error('Invalid invoice data:', invoice);
            return {
                id: 'Error',
                client_name: 'Invalid data',
                date: '-',
                total: '0.00 ج.م.',
                paymentStatus: '<span class="badge bg-secondary">غير معروف</span>',
                paymentMethod: '-',
                actions: ''
            };
        }
        
        // Get client name - might come from joined data or need to be looked up
        let clientName = 'غير معروف'; // Unknown
        let clientFound = false;
        
        // First, try to get client name from the invoice data itself
        if (invoice.client_name) {
            clientName = invoice.client_name;
            clientFound = true;
        } else if (invoice.Client && invoice.Client.name) {
            // If using Sequelize include with nested Client object
            clientName = invoice.Client.name;
            clientFound = true;
        } else if (invoice.client && invoice.client.name) {
            // Alternative nested client structure
            clientName = invoice.client.name;
            clientFound = true;
        }
        
        // If not found in invoice data, try to find in our cached clients array
        if (!clientFound && invoice.client_id && clients && clients.length > 0) {
            const client = clients.find(c => c.id == invoice.client_id);
            if (client) {
                clientName = client.name;
                clientFound = true;
                console.log(`Found client ${clientName} for invoice ${invoice.id}`);
            } else {
                console.warn(`Client not found for invoice ${invoice.id} with client_id ${invoice.client_id}`);
            }
        }
        
        // If still not found, show client ID as fallback
        if (!clientFound && invoice.client_id) {
            clientName = `العميل #${invoice.client_id}`;
        }
        
        // Format date - handle both string and Date objects
        let formattedDate = '-';
        let dateSort = null;
        if (invoice.date) {
            try {
                const dateObj = moment(invoice.date);
                if (dateObj.isValid()) {
                    formattedDate = dateObj.format('DD/MM/YYYY');
                    dateSort = dateObj.valueOf(); // Unix timestamp for proper sorting
                } else {
                    console.warn('Invalid date format:', invoice.date);
                    formattedDate = '-';
                    dateSort = 0;
                }
            } catch (error) {
                console.error('Error formatting date:', error, invoice.date);
                formattedDate = '-';
                dateSort = 0;
            }
        }
        
        // Format payment status with appropriate badge and quick edit functionality
        let statusBadge = formatInvoicePaymentStatus(invoice.paymentStatus, invoice.id);
        
        // Format payment method
        let paymentMethodText = '-';
        if (invoice.paymentMethod) {
            switch (invoice.paymentMethod) {
                case 'cash':
                    paymentMethodText = 'نقداً';
                    break;
                case 'instapay':
                    paymentMethodText = 'Instapay';
                    break;
                case 'محفظة':
                    paymentMethodText = 'محفظة رقمية';
                    break;
                case 'بنك':
                    paymentMethodText = 'حساب بنكي';
                    break;
                default:
                    paymentMethodText = invoice.paymentMethod;
            }
        }
        
        // Format total amount
        let formattedTotal = '0.00 ج.م.';
        let totalSort = 0;
        if (invoice.total !== undefined) {
            const totalValue = parseFloat(invoice.total);
            if (!isNaN(totalValue)) {
                formattedTotal = `${totalValue.toFixed(2)} ج.م.`;
                totalSort = totalValue; // Numeric value for sorting
            }
        }
        
        // Create action buttons
        const invoiceId = invoice.id || 'unknown';
        const idSort = typeof invoice.id === 'number' ? invoice.id : parseInt(invoice.id) || 0;
        let actionsHtml = `
            <div class="dropdown text-center">
                <button class="btn btn-sm btn-light rounded-circle p-1 border-0 shadow-sm" data-bs-toggle="dropdown" aria-expanded="false" style="width: 28px; height: 28px;">
                    <i class="fas fa-ellipsis-v" style="font-size: 12px;"></i>
                </button>
                <ul class="dropdown-menu dropdown-menu-end shadow-sm">
                    <li><a class="dropdown-item py-2" href="view-invoice.html?id=${invoice.id}"><i class="fas fa-eye me-2 text-primary"></i> عرض</a></li>
                    <li><a class="dropdown-item py-2" href="edit-invoice.html?id=${invoice.id}"><i class="fas fa-edit me-2 text-success"></i> تعديل</a></li>
                    <li><a class="dropdown-item py-2" href="#" onclick="printInvoice('${invoice.id}'); return false;"><i class="fas fa-print me-2 text-info"></i> طباعة</a></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item py-2" href="#" onclick="deleteInvoice('${invoice.id}'); return false;"><i class="fas fa-trash me-2 text-danger"></i> حذف</a></li>
                </ul>
            </div>
        `;
        
        // Return formatted invoice data for DataTable in the exact format it expects
        return {
            id: invoiceId,
            idSort: idSort, // Add sort data for proper ID sorting
            client_name: clientName,
            date: formattedDate,
            dateSort: dateSort, // Add sort data for proper date sorting
            total: formattedTotal,
            totalSort: totalSort, // Add sort data for proper amount sorting
            paymentStatus: statusBadge,
            paymentMethod: paymentMethodText,
            actions: actionsHtml,
            // Store raw data for later use
            raw: invoice
        };
    } catch (error) {
        console.error('Error formatting invoice:', error);
        return {
            id: 'Error',
            client_name: 'Formatting error',
            date: '-',
            total: '0.00 ج.م.',
            paymentStatus: '<span class="badge bg-secondary">خطأ</span>',
            paymentMethod: '-',
            actions: ''
        };
    }
}

/**
 * Format invoice payment status with quick edit functionality
 * @param {string} status - The payment status
 * @param {string} invoiceId - The invoice ID for editing
 * @returns {string} HTML string with formatted status badge and edit functionality
 */
function formatInvoicePaymentStatus(status, invoiceId) {
    if (!status) status = 'pending';
    
    const statusLower = status.toLowerCase();
    let badgeClass = 'bg-secondary';
    let statusText = status;
    
    switch (statusLower) {
        case 'completed':
        case 'paid':
            badgeClass = 'bg-success';
            statusText = 'مكتمل';
            break;
        case 'pending':
        case 'unpaid':
            badgeClass = 'bg-warning text-dark';
            statusText = 'قيد الانتظار';
            break;
        case 'cancelled':
        case 'canceled':
        case 'ملغى':
            badgeClass = 'bg-danger';
            statusText = 'ملغى';
            break;
        case 'partial':
            badgeClass = 'bg-info text-dark';
            statusText = 'مدفوع جزئياً';
            break;
        case 'overdue':
            badgeClass = 'bg-danger';
            statusText = 'متأخر';
            break;
        case 'draft':
            badgeClass = 'bg-secondary';
            statusText = 'مسودة';
            break;
        default:
            badgeClass = 'bg-secondary';
            statusText = status;
    }
    
    return `
        <div class="dropdown">
            <span class="badge ${badgeClass} payment-status-badge rounded-pill px-3 py-2" 
                  data-bs-toggle="dropdown" 
                  data-invoice-id="${invoiceId}" 
                  style="cursor: pointer; font-size: 0.85rem; min-width: 100px; display: inline-flex; align-items: center; justify-content: center; gap: 5px;" 
                  title="انقر لتغيير حالة الدفع">
                ${statusText}
                <i class="fas fa-chevron-down" style="font-size: 0.7em;"></i>
            </span>
            <ul class="dropdown-menu payment-status-dropdown shadow-sm border-0" style="min-width: 200px;">
                <li><a class="dropdown-item payment-status-option d-flex align-items-center py-2" href="#" data-status="pending" data-invoice-id="${invoiceId}">
                    <span class="badge bg-warning text-dark rounded-pill me-3" style="width: 20px; height: 20px; display: inline-flex; align-items: center; justify-content: center; font-size: 0.7rem;">⏳</span>
                    <span>قيد الانتظار</span>
                </a></li>
                <li><a class="dropdown-item payment-status-option d-flex align-items-center py-2" href="#" data-status="completed" data-invoice-id="${invoiceId}">
                    <span class="badge bg-success rounded-pill me-3" style="width: 20px; height: 20px; display: inline-flex; align-items: center; justify-content: center; font-size: 0.7rem;">✓</span>
                    <span>مكتمل</span>
                </a></li>
                <li><a class="dropdown-item payment-status-option d-flex align-items-center py-2" href="#" data-status="cancelled" data-invoice-id="${invoiceId}">
                    <span class="badge bg-danger rounded-pill me-3" style="width: 20px; height: 20px; display: inline-flex; align-items: center; justify-content: center; font-size: 0.7rem;">✕</span>
                    <span>ملغى</span>
                </a></li>
            </ul>
        </div>
    `;
}

/**
 * Load clients data from API
 */
async function loadClientsData() {
    try {
        console.log('Loading clients data...');
        
        // Build API URL
        const apiBaseUrl = window.config ? window.config.api.baseUrl : 
                          (window.location.hostname === 'localhost' ? 'http://localhost:3001' : 'https://reports.laapak.com');
        const apiUrl = `${apiBaseUrl}/api/clients`;
        
        console.log('Fetching clients from:', apiUrl);
        
        // Get token for authentication - try multiple sources
        let token = null;
        if (typeof authMiddleware !== 'undefined' && authMiddleware.getAdminToken) {
            token = authMiddleware.getAdminToken();
        } else {
            // Fallback to direct token access
            token = localStorage.getItem('adminToken') || 
                   sessionStorage.getItem('adminToken') || 
                   localStorage.getItem('clientToken') || 
                   sessionStorage.getItem('clientToken');
        }
        
        if (!token) {
            console.warn('No authentication token found, trying without token');
        }
        
        // Prepare headers
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
            headers['x-auth-token'] = token; // Try both header formats
        }
        
        // Fetch clients from API
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: headers
        });
        
        console.log('Client API response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status} - ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Client API response data:', data);
        
        // Handle different API response formats
        if (Array.isArray(data)) {
            clients = data;
        } else if (data && data.clients && Array.isArray(data.clients)) {
            clients = data.clients;
        } else if (data && data.data && Array.isArray(data.data)) {
            clients = data.data;
        } else if (data && typeof data === 'object') {
            // If it's an object with client properties, convert to array
            clients = Object.values(data).filter(item => item && typeof item === 'object' && item.id);
        } else {
            clients = [];
        }
        
        console.log('Processed clients data:', clients);
        
        // Populate client dropdowns
        populateClientDropdowns(clients);
        
        return clients;
    } catch (error) {
        console.error('Error loading clients:', error);
        
        // Try to load from cache if available
        try {
            const cachedClients = localStorage.getItem('cachedClients');
            if (cachedClients) {
                clients = JSON.parse(cachedClients);
                console.log('Loaded clients from cache:', clients);
                populateClientDropdowns(clients);
                return clients;
            }
        } catch (cacheError) {
            console.error('Error loading cached clients:', cacheError);
        }
        
        return [];
    }
}

/**
 * Load reports data from API
 */
async function loadReportsData() {
    try {
        // Build API URL
        const apiBaseUrl = window.config ? window.config.api.baseUrl : window.location.origin;
        const apiUrl = `${apiBaseUrl}/api/reports`;
        
        // Get token for authentication
        const token = authMiddleware.getAdminToken();
        if (!token) {
            throw new Error('Authentication token not available');
        }
        
        // Fetch reports from API
        const response = await fetch(apiUrl, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        reports = data.reports || data; // Handle different API response formats
        
        // Skip report dropdown population for now to avoid errors
        // We'll add the proper implementation later
        console.log('Reports loaded:', reports.length);
        
        return reports;
    } catch (error) {
        console.error('Error loading reports:', error);
        return [];
    }
}

/**
 * Populate client dropdowns in the forms
 */
function populateClientDropdowns(clientsData) {
    try {
        console.log('Populating client dropdowns with data:', clientsData);
        
        // Make sure we have valid data
        if (!Array.isArray(clientsData)) {
            console.error('Invalid client data format - expected array, got:', typeof clientsData);
            return;
        }
        
        if (clientsData.length === 0) {
            console.warn('No clients data available');
            return;
        }
        
        const clientDropdowns = [
            document.getElementById('clientId'),
            document.getElementById('editClientId'),
            document.getElementById('clientFilter') // Add filter dropdown if it exists
        ];

        console.log('Found client dropdowns:', clientDropdowns.filter(d => d !== null).length);

        clientDropdowns.forEach((dropdown, index) => {
            if (!dropdown) {
                console.log(`Dropdown ${index} not found in DOM`);
                return;
            }

            console.log(`Populating dropdown ${index}:`, dropdown.id);

            // Keep default option and clear the rest
            const defaultOption = dropdown.querySelector('option');
            dropdown.innerHTML = '';
            if (defaultOption) {
                dropdown.appendChild(defaultOption);
            }

            // Add client options
            let addedCount = 0;
            clientsData.forEach(client => {
                // Add safety check for client data
                if (client && client.id && client.name) {
                    const option = document.createElement('option');
                    option.value = client.id;
                    option.textContent = `${client.name}${client.phone ? ` (${client.phone})` : ''}`;
                    dropdown.appendChild(option);
                    addedCount++;
                } else {
                    console.warn('Invalid client data:', client);
                }
            });
            
            console.log(`Added ${addedCount} clients to dropdown ${index}`);
        });
        
        // Cache the clients data for offline use
        try {
            localStorage.setItem('cachedClients', JSON.stringify(clientsData));
            console.log('Clients data cached successfully');
        } catch (cacheError) {
            console.error('Error caching clients data:', cacheError);
        }
        
        console.log('Client dropdowns populated successfully');
        
        // Refresh invoice table if it exists to update client names
        refreshInvoiceTableWithClientNames();
    } catch (error) {
        console.error('Error populating client dropdowns:', error);
    }
}

/**
 * Refresh invoice table to update client names after clients are loaded
 */
function refreshInvoiceTableWithClientNames() {
    if (invoicesTable && clients && clients.length > 0) {
        console.log('Refreshing invoice table with client names...');
        
        // Get current table data
        const currentData = invoicesTable.data().toArray();
        
        // Update client names in the data
        const updatedData = currentData.map(row => {
            if (row.raw && row.raw.client_id && !row.raw.client_name) {
                const client = clients.find(c => c.id == row.raw.client_id);
                if (client) {
                    row.client_name = client.name;
                    console.log(`Updated client name for invoice ${row.id} to ${client.name}`);
                }
            }
            return row;
        });
        
        // Clear and redraw the table with updated data
        invoicesTable.clear().rows.add(updatedData).draw();
        console.log('Invoice table refreshed with client names');
    }
}

// Add event listeners to invoice action buttons
function addInvoiceActionListeners() {
    // View invoice buttons
    const viewButtons = document.querySelectorAll('.view-invoice-btn');
    viewButtons.forEach(button => {
        button.addEventListener('click', function() {
            const invoiceId = this.getAttribute('data-invoice-id');
            window.location.href = `view-invoice.html?id=${invoiceId}`;
        });
    });
    
    // Edit invoice buttons
    const editButtons = document.querySelectorAll('.edit-invoice-btn');
    editButtons.forEach(button => {
        button.addEventListener('click', function() {
            const invoiceId = this.getAttribute('data-invoice-id');
            window.location.href = `edit-invoice.html?id=${invoiceId}`;
        });
    });
    
    // Delete invoice buttons
    const deleteButtons = document.querySelectorAll('.delete-invoice-btn');
    deleteButtons.forEach(button => {
        button.addEventListener('click', function() {
            const invoiceId = this.getAttribute('data-invoice-id');
            if (confirm('هل أنت متأكد من حذف هذه الفاتورة؟')) {
                deleteInvoice(invoiceId);
            }
        });
    });
}

/**
 * Add invoice item to the form
 */
function addInvoiceItem() {
    const invoiceItems = document.getElementById('invoiceItems');
    if (!invoiceItems) return;
    
    // Clone the first item as a template
    const template = invoiceItems.children[0];
    const newItem = template.cloneNode(true);
    
    // Reset input values
    newItem.querySelectorAll('input').forEach(input => {
        if (input.classList.contains('item-quantity')) {
            input.value = '1';
        } else {
            input.value = '';
        }
    });
    
    // Add event listener to remove button
    const removeButton = newItem.querySelector('.remove-item');
    if (removeButton) {
        removeButton.addEventListener('click', function() {
            // Only remove if there are more than one item
            if (invoiceItems.children.length > 1) {
                newItem.remove();
                updateCalculations();
            } else {
                showToast('يجب أن يكون هناك بند واحد على الأقل', 'warning');
            }
        });
    }
    
    // Add the new item to the form
    invoiceItems.appendChild(newItem);
    
    // Update calculations
    updateCalculations();
}

/**
 * Add invoice item to the edit form
 */
function addEditInvoiceItem() {
    const editInvoiceItems = document.getElementById('editInvoiceItems');
    if (!editInvoiceItems) return;
    
    // Clone the first item as a template
    const template = editInvoiceItems.children[0];
    const newItem = template.cloneNode(true);
    
    // Reset input values
    newItem.querySelectorAll('input').forEach(input => {
        if (input.classList.contains('item-quantity')) {
            input.value = '1';
        } else {
            input.value = '';
        }
    });
    
    // Add event listener to remove button
    const removeButton = newItem.querySelector('.remove-item');
    if (removeButton) {
        removeButton.addEventListener('click', function() {
            // Only remove if there are more than one item
            if (editInvoiceItems.children.length > 1) {
                newItem.remove();
                updateEditCalculations();
            } else {
                showToast('يجب أن يكون هناك بند واحد على الأقل', 'warning');
            }
        });
    }
    
    // Add the new item to the form
    editInvoiceItems.appendChild(newItem);
    
    // Update calculations
    updateEditCalculations();
}

function setupEventListeners() {
    // Create invoice button
    const createInvoiceBtn = document.getElementById('createInvoiceBtn');
    if (createInvoiceBtn) {
        createInvoiceBtn.addEventListener('click', function() {
            window.location.href = 'create-invoice.html';
        });
    }
    
    // The Add Invoice button now uses a direct href link to create-invoice.html
    // No event handler needed for navigation
    
    // Save invoice button
    const saveInvoiceBtn = document.getElementById('saveInvoiceBtn');
    if (saveInvoiceBtn) {
        saveInvoiceBtn.addEventListener('click', saveInvoice);
    }
    
    // Add item button
    const addItemBtn = document.getElementById('addItemBtn');
    if (addItemBtn) {
        addItemBtn.addEventListener('click', addInvoiceItem);
    }
    
    // Edit add item button
    const editAddItemBtn = document.getElementById('editAddItemBtn');
    if (editAddItemBtn) {
        editAddItemBtn.addEventListener('click', addEditInvoiceItem);
    }
    
    // Update invoice button
    const updateInvoiceBtn = document.getElementById('updateInvoiceBtn');
    if (updateInvoiceBtn) {
        updateInvoiceBtn.addEventListener('click', updateInvoice);
    }
    
    // Print invoice button
    const printInvoiceBtn = document.getElementById('printInvoiceBtn');
    if (printInvoiceBtn) {
        printInvoiceBtn.addEventListener('click', printInvoice);
    }
    
    // Confirm delete invoice button
    const confirmDeleteInvoiceBtn = document.getElementById('confirmDeleteInvoiceBtn');
    if (confirmDeleteInvoiceBtn) {
        confirmDeleteInvoiceBtn.addEventListener('click', confirmDeleteInvoice);
    }
    
    // Apply filters button
    const applyFiltersBtn = document.getElementById('applyFiltersBtn');
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', applyFilters);
    }
    
    // Document event listeners for dynamically created elements
    document.addEventListener('click', function(event) {
        // View invoice button
        if (event.target.closest('.view-invoice')) {
            const invoiceId = event.target.closest('.view-invoice').dataset.id;
            viewInvoice(invoiceId);
        }
        
        // Edit invoice button
        if (event.target.closest('.edit-invoice')) {
            const invoiceId = event.target.closest('.edit-invoice').dataset.id;
            editInvoice(invoiceId);
        }
        
        // Delete invoice button
        if (event.target.closest('.delete-invoice')) {
            const invoiceId = event.target.closest('.delete-invoice').dataset.id;
            document.getElementById('deleteInvoiceId').value = invoiceId;
            const deleteModal = new bootstrap.Modal(document.getElementById('deleteInvoiceModal'));
            deleteModal.show();
        }
        
        // Remove item button
        if (event.target.closest('.remove-item')) {
            const itemContainer = event.target.closest('.invoice-item');
            if (itemContainer) {
                // Check if this is the last item
                const parentContainer = itemContainer.parentElement;
                if (parentContainer && parentContainer.children.length > 1) {
                    itemContainer.remove();
                    // Update calculations
                    updateCalculations();
                } else {
                    showToast('يجب أن يكون هناك بند واحد على الأقل', 'warning');
                }
            }
        }
        
        // Payment status option clicks
        if (event.target.closest('.payment-status-option')) {
            event.preventDefault();
            const statusOption = event.target.closest('.payment-status-option');
            const invoiceId = statusOption.dataset.invoiceId;
            const newStatus = statusOption.dataset.status;
            
            updateInvoicePaymentStatus(invoiceId, newStatus);
        }
    });
    
    // Add input event listeners for calculations
    document.addEventListener('input', function(event) {
        // For add invoice form
        if (event.target.closest('#addInvoiceForm') && 
            (event.target.classList.contains('item-amount') || 
             event.target.classList.contains('item-quantity') || 
             event.target.id === 'discountAmount' ||
             event.target.id === 'taxRate')) {
            updateCalculations();
        }
        
        // For edit invoice form
        if (event.target.closest('#editInvoiceForm') && 
            (event.target.classList.contains('item-amount') || 
             event.target.classList.contains('item-quantity') || 
             event.target.id === 'editDiscountAmount' ||
             event.target.id === 'editTaxRate')) {
            updateEditCalculations();
        }
    });
}

/**
 * Setup calculations for invoice forms
 */
function setupCalculations() {
    // Set initial calculations for new invoice form
    updateCalculations();
}

/**
 * Update calculations for add invoice form
 */
function updateCalculations() {
    const itemAmountInputs = document.querySelectorAll('#invoiceItems .item-amount');
    const itemQuantityInputs = document.querySelectorAll('#invoiceItems .item-quantity');
    const discountAmount = parseFloat(document.getElementById('discountAmount')?.value || 0);
    const taxRate = parseFloat(document.getElementById('taxRate')?.value || 14);
    
    let subtotal = 0;
    
    // Calculate subtotal
    for (let i = 0; i < itemAmountInputs.length; i++) {
        const amount = parseFloat(itemAmountInputs[i].value || 0);
        const quantity = parseFloat(itemQuantityInputs[i].value || 1);
        subtotal += amount * quantity;
    }
    
    // Calculate tax
    const tax = (subtotal - discountAmount) * (taxRate / 100);
    
    // Calculate total
    const total = subtotal - discountAmount + tax;
    
    // Update display
    document.getElementById('subtotalDisplay').textContent = `${subtotal.toFixed(2)} ج.م.`;
    document.getElementById('taxRateDisplay').textContent = taxRate;
    document.getElementById('taxDisplay').textContent = `${tax.toFixed(2)} ج.م.`;
    document.getElementById('totalDisplay').textContent = `${total.toFixed(2)} ج.م.`;
}

/**
 * Update calculations for edit invoice form
 */
function updateEditCalculations() {
    const itemAmountInputs = document.querySelectorAll('#editInvoiceItems .item-amount');
    const itemQuantityInputs = document.querySelectorAll('#editInvoiceItems .item-quantity');
    const discountAmount = parseFloat(document.getElementById('editDiscountAmount')?.value || 0);
    const taxRate = parseFloat(document.getElementById('editTaxRate')?.value || 14);
    
    let subtotal = 0;
    
    // Calculate subtotal
    for (let i = 0; i < itemAmountInputs.length; i++) {
        const amount = parseFloat(itemAmountInputs[i].value || 0);
        const quantity = parseFloat(itemQuantityInputs[i].value || 1);
        subtotal += amount * quantity;
    }
    
    // Calculate tax
    const tax = (subtotal - discountAmount) * (taxRate / 100);
    
    // Calculate total
    const total = subtotal - discountAmount + tax;
    
    // Update display
    document.getElementById('editSubtotalDisplay').textContent = `${subtotal.toFixed(2)} ج.م.`;
    document.getElementById('editTaxRateDisplay').textContent = taxRate;
    document.getElementById('editTaxDisplay').textContent = `${tax.toFixed(2)} ج.م.`;
    document.getElementById('editTotalDisplay').textContent = `${total.toFixed(2)} ج.م.`;
}

// Add calculation functions and CRUD operations
function addInvoiceItem() {
    const invoiceItems = document.getElementById('invoiceItems');
    const itemTemplate = document.getElementById('itemTemplate');
    const newItem = itemTemplate.content.cloneNode(true);
    invoiceItems.appendChild(newItem);
    // Update calculations
    updateCalculations();
}

function addEditInvoiceItem() {
    const editInvoiceItems = document.getElementById('editInvoiceItems');
    const itemTemplate = document.getElementById('itemTemplate');
    const newItem = itemTemplate.content.cloneNode(true);
    editInvoiceItems.appendChild(newItem);
    // Update calculations
    updateEditCalculations();
}

/**
 * Save new invoice
 */
async function saveInvoice() {
    try {
        // Validate form
        if (!validateInvoiceForm('addInvoiceForm')) {
            return;
        }
        
        // Get form data
        const clientId = document.getElementById('clientId').value;
        const reportId = document.getElementById('reportId').value;
        const invoiceDate = document.getElementById('invoiceDate').value;
        const paymentStatus = document.getElementById('paymentStatus').value;
        const paymentMethod = document.getElementById('paymentMethod').value;
        const taxRate = parseFloat(document.getElementById('taxRate').value || 14);
        const discount = parseFloat(document.getElementById('discountAmount').value || 0);
        
        // Calculate totals
        let subtotal = 0;
        const items = [];
        
        // Get all invoice items
        const invoiceItemContainers = document.querySelectorAll('#invoiceItems .invoice-item');
        invoiceItemContainers.forEach(container => {
            const description = container.querySelector('.item-description').value;
            const type = container.querySelector('.item-type').value;
            const amount = parseFloat(container.querySelector('.item-amount').value || 0);
            const quantity = parseInt(container.querySelector('.item-quantity').value || 1);
            const serialNumber = container.querySelector('.item-serial').value || null;
            
            // Calculate total amount for this item
            const totalAmount = amount * quantity;
            subtotal += totalAmount;
            
            // Add to items array
            items.push({
                description,
                type,
                amount,
                quantity,
                totalAmount,
                serialNumber
            });
        });
        
        // Calculate tax and total
        const tax = (subtotal - discount) * (taxRate / 100);
        const total = subtotal - discount + tax;
        
        // Prepare invoice data
        const invoiceData = {
            client_id: clientId,
            report_id: reportId || null,
            date: invoiceDate,
            subtotal,
            discount,
            taxRate,
            tax,
            total,
            paymentStatus,
            paymentMethod,
            items
        };
        
        // Get token for authentication
        const token = authMiddleware.getAdminToken();
        if (!token) {
            throw new Error('Authentication token not available');
        }
        
        // Send to API
        const apiBaseUrl = window.config ? window.config.api.baseUrl : window.location.origin;
        const response = await fetch(`${apiBaseUrl}/api/invoices`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(invoiceData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to create invoice');
        }
        
        // Show success message
        showToast('تم إنشاء الفاتورة بنجاح', 'success');
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('addInvoiceModal'));
        if (modal) {
            modal.hide();
        }
        
        // Reload invoices data
        loadInvoicesData();
        
    } catch (error) {
        console.error('Error saving invoice:', error);
        showToast(`حدث خطأ أثناء حفظ الفاتورة: ${error.message}`, 'error');
    }
}

/**
 * Validate invoice form
 * @param {string} formId - ID of the form to validate
 * @returns {boolean} - True if form is valid, false otherwise
 */
function validateInvoiceForm(formId) {
    const form = document.getElementById(formId);
    if (!form) return false;
    
    let isValid = true;
    const errorMessages = [];
    
    // Check required fields
    const clientIdInput = form.querySelector('#clientId, #editClientId');
    if (!clientIdInput || !clientIdInput.value) {
        errorMessages.push('يجب اختيار العميل');
        isValid = false;
    }
    
    const invoiceDateInput = form.querySelector('#invoiceDate, #editInvoiceDate');
    if (!invoiceDateInput || !invoiceDateInput.value) {
        errorMessages.push('يجب تحديد تاريخ الفاتورة');
        isValid = false;
    }
    
    // Check invoice items
    const itemContainers = form.querySelectorAll('.invoice-item');
    let hasValidItems = false;
    
    itemContainers.forEach(container => {
        const description = container.querySelector('.item-description').value;
        const amount = parseFloat(container.querySelector('.item-amount').value || 0);
        
        if (description && amount > 0) {
            hasValidItems = true;
        }
    });
    
    if (!hasValidItems) {
        errorMessages.push('يجب إضافة بند واحد على الأقل مع الوصف والسعر');
        isValid = false;
    }
    
    // Show error messages if any
    if (!isValid) {
        const errorMessage = errorMessages.join('\n');
        showToast(errorMessage, 'error');
    }
    
    return isValid;
}

/**
 * Update existing invoice
 */
async function updateInvoice() {
    try {
        // Validate form
        if (!validateInvoiceForm('editInvoiceForm')) {
            return;
        }
        
        // Get invoice ID
        const invoiceId = document.getElementById('editInvoiceId').value;
        if (!invoiceId) {
            throw new Error('Invoice ID not found');
        }
        
        // Get form data
        const clientId = document.getElementById('editClientId').value;
        const reportId = document.getElementById('editReportId').value;
        const invoiceDate = document.getElementById('editInvoiceDate').value;
        const paymentStatus = document.getElementById('editPaymentStatus').value;
        const paymentMethod = document.getElementById('editPaymentMethod').value;
        const taxRate = parseFloat(document.getElementById('editTaxRate').value || 14);
        const discount = parseFloat(document.getElementById('editDiscountAmount').value || 0);
        
        // Calculate totals
        let subtotal = 0;
        const items = [];
        
        // Get all invoice items
        const invoiceItemContainers = document.querySelectorAll('#editInvoiceItems .invoice-item');
        invoiceItemContainers.forEach(container => {
            const itemId = container.dataset.itemId || null;
            const description = container.querySelector('.item-description').value;
            const type = container.querySelector('.item-type').value;
            const amount = parseFloat(container.querySelector('.item-amount').value || 0);
            const quantity = parseInt(container.querySelector('.item-quantity').value || 1);
            const serialNumber = container.querySelector('.item-serial').value || null;
            
            // Calculate total amount for this item
            const totalAmount = amount * quantity;
            subtotal += totalAmount;
            
            // Add to items array
            items.push({
                id: itemId,
                description,
                type,
                amount,
                quantity,
                totalAmount,
                serialNumber
            });
        });
        
        // Calculate tax and total
        const tax = (subtotal - discount) * (taxRate / 100);
        const total = subtotal - discount + tax;
        
        // Prepare invoice data
        const invoiceData = {
            id: invoiceId,
            client_id: clientId,
            report_id: reportId || null,
            date: invoiceDate,
            subtotal,
            discount,
            taxRate,
            tax,
            total,
            paymentStatus,
            paymentMethod,
            items
        };
        
        // Get token for authentication
        const token = authMiddleware.getAdminToken();
        if (!token) {
            throw new Error('Authentication token not available');
        }
        
        // Send to API
        const apiBaseUrl = window.config ? window.config.api.baseUrl : window.location.origin;
        const response = await fetch(`${apiBaseUrl}/api/invoices/${invoiceId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(invoiceData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to update invoice');
        }
        
        // Show success message
        showToast('تم تحديث الفاتورة بنجاح', 'success');
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('editInvoiceModal'));
        if (modal) {
            modal.hide();
        }
        
        // Reload invoices data
        loadInvoicesData();
        
    } catch (error) {
        console.error('Error updating invoice:', error);
        showToast(`حدث خطأ أثناء تحديث الفاتورة: ${error.message}`, 'error');
    }
}

/**
 * View invoice details
 * @param {string} invoiceId - ID of the invoice to view
 */
async function viewInvoice(invoiceId) {
    try {
        // Get token for authentication
        const token = authMiddleware.getAdminToken();
        if (!token) {
            throw new Error('Authentication token not available');
        }
        
        // Fetch invoice details from API
        const apiBaseUrl = window.config ? window.config.api.baseUrl : window.location.origin;
        const response = await fetch(`${apiBaseUrl}/api/invoices/${invoiceId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const invoice = await response.json();

        // Get client name
        let clientName = 'غير معروف';
        const client = clients.find(c => c.id === invoice.client_id);
        if (client) {
            clientName = client.name;
        }

        // Format date
        const formattedDate = moment(invoice.date).format('DD/MM/YYYY');

        // Format payment status
        let statusBadge = '';
        let statusText = '';
        switch (invoice.paymentStatus) {
            case 'completed':
            case 'paid':
                statusBadge = 'bg-success';
                statusText = 'مكتمل';
                break;
            case 'pending':
            case 'unpaid':
                statusBadge = 'bg-warning text-dark';
                statusText = 'قيد الانتظار';
                break;
            case 'cancelled':
            case 'canceled':
            case 'ملغى':
                statusBadge = 'bg-danger';
                statusText = 'ملغى';
                break;
            case 'partial':
                statusBadge = 'bg-info text-dark';
                statusText = 'مدفوع جزئياً';
                break;
            case 'overdue':
                statusBadge = 'bg-danger';
                statusText = 'متأخر';
                break;
            case 'draft':
                statusBadge = 'bg-secondary';
                statusText = 'مسودة';
                break;
            default:
                statusBadge = 'bg-secondary';
                statusText = invoice.paymentStatus;
        }

        // Format payment method
        let paymentMethodText = '-';
        if (invoice.paymentMethod) {
            switch (invoice.paymentMethod) {
                case 'cash':
                    paymentMethodText = 'نقداً';
                    break;
                case 'instapay':
                    paymentMethodText = 'Instapay';
                    break;
                case 'محفظة':
                    paymentMethodText = 'محفظة رقمية';
                    break;
                case 'بنك':
                    paymentMethodText = 'حساب بنكي';
                    break;
                default:
                    paymentMethodText = invoice.paymentMethod;
            }
        }
        
        // Build items HTML
        let itemsHtml = '';
        if (invoice.items && invoice.items.length > 0) {
            invoice.items.forEach((item, index) => {
                itemsHtml += `
                <tr>
                    <td>${index + 1}</td>
                    <td>${item.description}</td>
                    <td>${item.type === 'laptop' ? 'لابتوب' : item.type === 'item' ? 'قطعة' : 'خدمة'}</td>
                    <td>${item.serialNumber || '-'}</td>
                    <td>${item.amount.toFixed(2)} ج.م.</td>
                    <td>${item.quantity}</td>
                    <td>${item.totalAmount.toFixed(2)} ج.م.</td>
                </tr>
                `;
            });
        } else {
            itemsHtml = `
            <tr>
                <td colspan="7" class="text-center">لا توجد بنود للفاتورة</td>
            </tr>
            `;
        }
        
        // Build invoice HTML
        const invoiceHtml = `
        <div class="invoice-details">
            <div class="row mb-4">
                <div class="col-md-6">
                    <h6 class="fw-bold">معلومات الفاتورة</h6>
                    <p class="mb-1"><strong>رقم الفاتورة:</strong> ${invoice.id}</p>
                    <p class="mb-1"><strong>تاريخ الفاتورة:</strong> ${formattedDate}</p>
                    <p class="mb-1">
                        <strong>حالة الدفع:</strong> 
                        <span class="badge ${statusBadge} rounded-pill px-3">${statusText}</span>
                    </p>
                    <p class="mb-1"><strong>طريقة الدفع:</strong> ${paymentMethodText}</p>
                </div>
                <div class="col-md-6">
                    <h6 class="fw-bold">معلومات العميل</h6>
                    <p class="mb-1"><strong>اسم العميل:</strong> ${clientName}</p>
                    <p class="mb-1"><strong>رقم التقرير:</strong> ${invoice.report_id || '-'}</p>
                </div>
            </div>
            
            <h6 class="fw-bold mb-3">بنود الفاتورة</h6>
            <div class="table-responsive">
                <table class="table table-bordered">
                    <thead class="table-light">
                        <tr>
                            <th>#</th>
                            <th>الوصف</th>
                            <th>النوع</th>
                            <th>الرقم التسلسلي</th>
                            <th>السعر</th>
                            <th>الكمية</th>
                            <th>الإجمالي</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml}
                    </tbody>
                </table>
            </div>
            
            <div class="row justify-content-end mt-4">
                <div class="col-md-5">
                    <div class="card bg-light">
                        <div class="card-body">
                            <div class="d-flex justify-content-between mb-2">
                                <span>المجموع الفرعي:</span>
                                <span>${invoice.subtotal.toFixed(2)} ج.م.</span>
                            </div>
                            <div class="d-flex justify-content-between mb-2">
                                <span>الخصم:</span>
                                <span>${invoice.discount.toFixed(2)} ج.م.</span>
                            </div>
                            <div class="d-flex justify-content-between mb-2">
                                <span>الضريبة (${invoice.taxRate}%):</span>
                                <span>${invoice.tax.toFixed(2)} ج.م.</span>
                            </div>
                            <hr>
                            <div class="d-flex justify-content-between fw-bold">
                                <span>الإجمالي:</span>
                                <span>${invoice.total.toFixed(2)} ج.م.</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        `;
        
        // Display invoice in modal
        document.getElementById('viewInvoiceContent').innerHTML = invoiceHtml;
        
        // Set invoice ID for print button
        const printButton = document.getElementById('printInvoiceBtn');
        if (printButton) {
            printButton.dataset.id = invoiceId;
        }
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('viewInvoiceModal'));
        modal.show();
        
    } catch (error) {
        console.error('Error viewing invoice:', error);
        showToast(`حدث خطأ أثناء عرض الفاتورة: ${error.message}`, 'error');
    }
}

/**
 * Edit invoice
 * @param {string} invoiceId - ID of the invoice to edit
 */
async function editInvoice(invoiceId) {
    try {
        // Get token for authentication
        const token = authMiddleware.getAdminToken();
        if (!token) {
            throw new Error('Authentication token not available');
        }
        
        // Fetch invoice details from API
        const apiBaseUrl = window.config ? window.config.api.baseUrl : window.location.origin;
        const response = await fetch(`${apiBaseUrl}/api/invoices/${invoiceId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        const invoice = await response.json();
        
        // Set form values
        document.getElementById('editInvoiceId').value = invoice.id;
        document.getElementById('editClientId').value = invoice.client_id;
        document.getElementById('editReportId').value = invoice.report_id || '';
        document.getElementById('editInvoiceDate').value = invoice.date.split('T')[0];
        document.getElementById('editPaymentStatus').value = invoice.paymentStatus;
        document.getElementById('editPaymentMethod').value = invoice.paymentMethod || '';
        document.getElementById('editTaxRate').value = invoice.taxRate;
        document.getElementById('editDiscountAmount').value = invoice.discount;
        
        // Clear invoice items
        const editInvoiceItems = document.getElementById('editInvoiceItems');
        editInvoiceItems.innerHTML = '';
        
        // Add invoice items
        if (invoice.items && invoice.items.length > 0) {
            invoice.items.forEach(item => {
                const itemHtml = `
                <div class="invoice-item border rounded p-3 mb-3" data-item-id="${item.id || ''}">
                    <div class="row mb-2">
                        <div class="col-md-6">
                            <label class="form-label">الوصف <span class="text-danger">*</span></label>
                            <input type="text" class="form-control item-description" value="${item.description}" required>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">النوع <span class="text-danger">*</span></label>
                            <select class="form-select item-type" required>
                                <option value="laptop" ${item.type === 'laptop' ? 'selected' : ''}>لابتوب</option>
                                <option value="item" ${item.type === 'item' ? 'selected' : ''}>قطعة</option>
                                <option value="service" ${item.type === 'service' ? 'selected' : ''}>خدمة</option>
                            </select>
                        </div>
                    </div>
                    <div class="row mb-2">
                        <div class="col-md-4">
                            <label class="form-label">السعر <span class="text-danger">*</span></label>
                            <input type="number" class="form-control item-amount" step="0.01" min="0" value="${item.amount}" required>
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">الكمية</label>
                            <input type="number" class="form-control item-quantity" value="${item.quantity}" min="1" required>
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">الرقم التسلسلي</label>
                            <input type="text" class="form-control item-serial" value="${item.serialNumber || ''}">
                        </div>
                    </div>
                    <div class="d-flex justify-content-end">
                        <button type="button" class="btn btn-sm btn-outline-danger remove-item">حذف البند</button>
                    </div>
                </div>
                `;
                
                editInvoiceItems.insertAdjacentHTML('beforeend', itemHtml);
            });
        } else {
            // Add empty item if no items
            addEditInvoiceItem();
        }
        
        // Update calculations
        updateEditCalculations();
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('editInvoiceModal'));
        modal.show();
        
    } catch (error) {
        console.error('Error editing invoice:', error);
        showToast(`حدث خطأ أثناء تحميل الفاتورة للتعديل: ${error.message}`, 'error');
    }
}

/**
 * Print invoice
 * @param {string} invoiceId - ID of the invoice to print
 */
function printInvoice(invoiceId) {
    if (!invoiceId) {
        showToast('معرف الفاتورة غير صالح', 'error');
        return;
    }
    
    // Redirect to view page with print parameter
    window.open(`view-invoice.html?id=${invoiceId}&print=true`, '_blank');
}

/**
 * Confirm delete invoice
 */
async function confirmDeleteInvoice() {
    try {
        // Get invoice ID
        const invoiceId = document.getElementById('deleteInvoiceId').value;
        if (!invoiceId) {
            throw new Error('Invoice ID not found');
        }
        
        // Get token for authentication
        const token = authMiddleware.getAdminToken();
        if (!token) {
            throw new Error('Authentication token not available');
        }
        
        // Send delete request to API
        const apiBaseUrl = window.config ? window.config.api.baseUrl : window.location.origin;
        const response = await fetch(`${apiBaseUrl}/api/invoices/${invoiceId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to delete invoice');
        }
        
        // Show success message
        showToast('تم حذف الفاتورة بنجاح', 'success');
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('deleteInvoiceModal'));
        if (modal) {
            modal.hide();
        }
        
        // Reload invoices data
        loadInvoicesData();
        
    } catch (error) {
        console.error('Error deleting invoice:', error);
        showToast(`حدث خطأ أثناء حذف الفاتورة: ${error.message}`, 'error');
    }
}

function getInvoiceData() {
    // Get invoice data from form
    const invoiceData = {
        date: document.getElementById('invoiceDate').value,
        client: document.getElementById('clientId').value,
        items: [],
        discount: parseFloat(document.getElementById('discountAmount').value || 0),
        taxRate: parseFloat(document.getElementById('taxRate').value || 14),
    };
    
    // Get items data
    const itemAmountInputs = document.querySelectorAll('#invoiceItems .item-amount');
    const itemQuantityInputs = document.querySelectorAll('#invoiceItems .item-quantity');
    const itemDescriptionInputs = document.querySelectorAll('#invoiceItems .item-description');
    const itemSerialInputs = document.querySelectorAll('#invoiceItems .item-serial');
    
    for (let i = 0; i < itemAmountInputs.length; i++) {
        const amount = parseFloat(itemAmountInputs[i].value || 0);
        const quantity = parseFloat(itemQuantityInputs[i].value || 1);
        const description = itemDescriptionInputs[i].value;
        const serial = itemSerialInputs[i].value;
        
        invoiceData.items.push({
            amount,
            quantity,
            description,
            serial,
        });
    }
    
    return invoiceData;
}

function saveInvoiceToAPI(invoiceData) {
    // Save invoice to API
    try {
        if (typeof apiService !== 'undefined' && typeof apiService.saveInvoice === 'function') {
            apiService.saveInvoice(invoiceData);
        } else {
            throw new Error('API service not available');
        }
    } catch (apiError) {
        console.warn('Error saving invoice to API, falling back to localStorage:', apiError);
        
        // Fall back to localStorage
        const storedInvoices = localStorage.getItem('lpk_invoices');
        if (storedInvoices) {
            let invoices = JSON.parse(storedInvoices);
            invoices.push(invoiceData);
            localStorage.setItem('lpk_invoices', JSON.stringify(invoices));
        } else {
            localStorage.setItem('lpk_invoices', JSON.stringify([invoiceData]));
        }
    }
}

function updateInvoiceInAPI(invoiceData) {
    // Update invoice in API
    try {
        if (typeof apiService !== 'undefined' && typeof apiService.updateInvoice === 'function') {
            apiService.updateInvoice(invoiceData);
        } else {
            throw new Error('API service not available');
        }
    } catch (apiError) {
        console.warn('Error updating invoice in API, falling back to localStorage:', apiError);
        
        // Fall back to localStorage
        const storedInvoices = localStorage.getItem('lpk_invoices');
        if (storedInvoices) {
            let invoices = JSON.parse(storedInvoices);
            const index = invoices.findIndex(invoice => invoice.id === invoiceData.id);
            if (index !== -1) {
                invoices[index] = invoiceData;
                localStorage.setItem('lpk_invoices', JSON.stringify(invoices));
            }
        }
    }
}

function deleteInvoiceFromAPI(invoiceId) {
    // Delete invoice from API
    try {
        if (typeof apiService !== 'undefined' && typeof apiService.deleteInvoice === 'function') {
            apiService.deleteInvoice(invoiceId);
        } else {
            throw new Error('API service not available');
        }
    } catch (apiError) {
        console.warn('Error deleting invoice from API, falling back to localStorage:', apiError);
        
        // Fall back to localStorage
        const storedInvoices = localStorage.getItem('lpk_invoices');
        if (storedInvoices) {
            let invoices = JSON.parse(storedInvoices);
            invoices = invoices.filter(invoice => invoice.id !== invoiceId);
            localStorage.setItem('lpk_invoices', JSON.stringify(invoices));
        }
    }
}

// Apply filters to invoices
function applyFilters() {
    const clientFilter = document.getElementById('clientFilter').value;
    const paymentStatusFilter = document.getElementById('paymentStatusFilter').value;
    const dateFromFilter = document.getElementById('dateFromFilter').value;
    const dateToFilter = document.getElementById('dateToFilter').value;
    
    const filters = {};
    
    if (clientFilter) {
        filters.client_id = clientFilter;
    }
    
    if (paymentStatusFilter) {
        filters.paymentStatus = paymentStatusFilter;
    }
    
    if (dateFromFilter) {
        filters.dateFrom = dateFromFilter;
    }
    
    if (dateToFilter) {
        filters.dateTo = dateToFilter;
    }
    
    loadInvoicesData(filters);
}

// Reset filters
function resetFilters() {
    document.getElementById('clientFilter').value = '';
    document.getElementById('paymentStatusFilter').value = '';
    document.getElementById('dateFromFilter').value = '';
    document.getElementById('dateToFilter').value = '';
    
    loadInvoicesData();
}

// Delete invoice
async function deleteInvoice(invoiceId) {
    try {
        // Try to delete from API
        try {
            if (typeof apiService !== 'undefined' && typeof apiService.deleteInvoice === 'function') {
                await apiService.deleteInvoice(invoiceId);
            } else {
                throw new Error('API service not available');
            }
        } catch (apiError) {
            console.warn('Error deleting invoice from API, falling back to localStorage:', apiError);
            
            // Fall back to localStorage
            const storedInvoices = localStorage.getItem('lpk_invoices');
            if (storedInvoices) {
                let invoices = JSON.parse(storedInvoices);
                invoices = invoices.filter(invoice => invoice.id !== invoiceId);
                localStorage.setItem('lpk_invoices', JSON.stringify(invoices));
            }
        }
        
        // Show success message
        showToast('تم حذف الفاتورة بنجاح', 'success');
        
        // Reload invoices
        loadInvoicesData();
        
    } catch (error) {
        console.error('Error deleting invoice:', error);
        showToast('حدث خطأ أثناء حذف الفاتورة', 'error');
    }
}

// Load clients for filter dropdown
async function loadClients() {
    try {
        const clientFilter = document.getElementById('clientFilter');
        if (!clientFilter) return;
        
        let clients = [];
        
        // Try to get clients from API
        try {
            if (typeof apiService !== 'undefined' && typeof apiService.getClients === 'function') {
                clients = await apiService.getClients();
            } else {
                throw new Error('API service not available');
            }
        } catch (apiError) {
            console.warn('Error loading clients from API, falling back to localStorage:', apiError);
            
            // Fall back to localStorage
            const storedClients = localStorage.getItem('lpk_clients');
            if (storedClients) {
                clients = JSON.parse(storedClients);
            }
        }
        
        // Add client options to dropdown
        clients.forEach(client => {
            const option = document.createElement('option');
            option.value = client.id;
            option.textContent = client.name;
            clientFilter.appendChild(option);
        });
        
    } catch (error) {
        console.error('Error loading clients:', error);
    }
}

/**
 * Update custom pagination UI to match clients.html style
 * @param {Object} pageInfo - DataTables page info object
 */
function updateCustomPagination(pageInfo) {
    const pagination = $('#invoicesPagination');
    if (!pagination.length) return;

    // Clear current page items
    pagination.empty();

    // Add Previous button
    const prevDisabled = pageInfo.page <= 0 ? 'disabled' : '';
    pagination.append(
        `<li class="page-item ${prevDisabled}">
            <a class="page-link prev-page" href="#" ${prevDisabled ? 'tabindex="-1" aria-disabled="true"' : ''}>السابق</a>
        </li>`
    );

    // Calculate which page numbers to show
    const totalPages = pageInfo.pages;
    const currentPage = pageInfo.page + 1; // DataTables is 0-indexed
    let startPage = Math.max(1, currentPage - 1);
    let endPage = Math.min(totalPages, startPage + 2);
    
    // Adjust if we're at the end of the page range
    if (endPage - startPage < 2 && startPage > 1) {
        startPage = Math.max(1, endPage - 2);
    }

    // Add page number buttons
    for (let i = startPage; i <= endPage; i++) {
        const isActive = i === currentPage ? 'active' : '';
        pagination.append(
            `<li class="page-item ${isActive}">
                <a class="page-link page-number" data-page="${i-1}" href="#">${i}</a>
            </li>`
        );
    }

    // Add Next button
    const nextDisabled = currentPage >= totalPages ? 'disabled' : '';
    pagination.append(
        `<li class="page-item ${nextDisabled}">
            <a class="page-link next-page" href="#" ${nextDisabled ? 'tabindex="-1" aria-disabled="true"' : ''}>التالي</a>
        </li>`
    );

    // Add event listeners to pagination controls
    $('.prev-page').on('click', function(e) {
        e.preventDefault();
        if (!$(this).parent().hasClass('disabled')) {
            invoicesTable.page('previous').draw('page');
        }
    });

    $('.next-page').on('click', function(e) {
        e.preventDefault();
        if (!$(this).parent().hasClass('disabled')) {
            invoicesTable.page('next').draw('page');
        }
    });

    $('.page-number').on('click', function(e) {
        e.preventDefault();
        const page = parseInt($(this).data('page'));
        invoicesTable.page(page).draw('page');
    });
}

/**
 * Setup enhanced search functionality for invoices
 */
function setupSearchFunctionality() {
    const searchInput = document.getElementById('searchInvoice');
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    
    if (!searchInput) return;
    
    // Search functionality
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.trim();
        
        // Show/hide clear button
        if (clearSearchBtn) {
            if (searchTerm.length > 0) {
                clearSearchBtn.classList.remove('d-none');
            } else {
                clearSearchBtn.classList.add('d-none');
            }
        }
        
        // Perform search
        if (invoicesTable) {
            invoicesTable.search(searchTerm).draw();
        }
        
        // Add visual feedback
        if (searchTerm.length > 0) {
            searchInput.style.backgroundColor = '#fff';
            searchInput.style.boxShadow = '0 0 0 0.2rem rgba(0, 117, 83, 0.15)';
        } else {
            searchInput.style.backgroundColor = '#f8f9fa';
            searchInput.style.boxShadow = '';
        }
    });
    
    // Clear search functionality
    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', function() {
            searchInput.value = '';
            searchInput.style.backgroundColor = '#f8f9fa';
            searchInput.style.boxShadow = '';
            clearSearchBtn.classList.add('d-none');
            
            if (invoicesTable) {
                invoicesTable.search('').draw();
            }
            
            searchInput.focus();
        });
    }
    
    // Handle Enter key
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            // Trigger search
            if (invoicesTable) {
                invoicesTable.search(this.value.trim()).draw();
            }
        }
    });
    
    // Focus management
    searchInput.addEventListener('focus', function() {
        this.style.backgroundColor = '#fff';
        this.style.boxShadow = '0 0 0 0.2rem rgba(0, 117, 83, 0.15)';
    });
    
    searchInput.addEventListener('blur', function() {
        if (this.value.trim().length === 0) {
            this.style.backgroundColor = '#f8f9fa';
            this.style.boxShadow = '';
        }
    });
}

/**
 * Show toast notification
 */
function showToast(message, type = 'info') {
    // Configure toastr options
    toastr.options = {
        "closeButton": true,
        "debug": false,
        "newestOnTop": true,
        "progressBar": true,
        "positionClass": "toast-top-right",
        "preventDuplicates": false,
        "onclick": null,
        "showDuration": "300",
        "hideDuration": "1000",
        "timeOut": "5000",
        "extendedTimeOut": "1000",
        "showEasing": "swing",
        "hideEasing": "linear",
        "showMethod": "fadeIn",
        "hideMethod": "fadeOut"
    };
    
    // Show toast notification
    switch (type) {
        case 'success':
            toastr.success(message);
            break;
        case 'error':
            toastr.error(message);
            break;
        case 'warning':
            toastr.warning(message);
            break;
        default:
            toastr.info(message);
            break;
    }
}

/**
 * Create new invoice - redirect to create invoice page
 */
function createInvoice() {
    window.location.href = 'create-invoice.html';
}

/**
 * Update invoice payment status via API
 * @param {string} invoiceId - The invoice ID
 * @param {string} newStatus - The new payment status
 * @param {boolean} skipReportSync - Whether to skip report synchronization (to prevent loops)
 */
async function updateInvoicePaymentStatus(invoiceId, newStatus, skipReportSync = false) {
    let statusBadge = null;
    let originalContent = '';
    
    try {
        console.log(`Updating invoice ${invoiceId} payment status to: ${newStatus}`);
        
        // Show loading state on the status badge
        statusBadge = document.querySelector(`[data-invoice-id="${invoiceId}"].payment-status-badge`);
        if (statusBadge) {
            originalContent = statusBadge.innerHTML;
            statusBadge.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            statusBadge.disabled = true;
        }
        
        // Get auth token
        const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
        if (!token) {
            throw new Error('No authentication token found');
        }
        
        // Get API base URL
        const apiBaseUrl = getApiBaseUrl();
        
        // Update via API
        const response = await fetch(`${apiBaseUrl}/api/invoices/${invoiceId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token
            },
            body: JSON.stringify({ paymentStatus: newStatus })
        });
        
        console.log(`Invoice update response status: ${response.status}`);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Invoice update error response:', errorData);
            throw new Error(errorData.message || errorData.error || `HTTP ${response.status}: Failed to update invoice payment status`);
        }
        
        const responseData = await response.json();
        console.log(`Invoice ${invoiceId} payment status updated successfully to ${newStatus}:`, responseData);
        
        // Update the status badge with new status
        if (statusBadge) {
            const newStatusHtml = formatInvoicePaymentStatus(newStatus, invoiceId);
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = newStatusHtml;
            const newBadge = tempDiv.querySelector('.payment-status-badge');
            if (newBadge) {
                statusBadge.className = newBadge.className;
                statusBadge.innerHTML = newBadge.innerHTML;
                statusBadge.dataset.invoiceId = invoiceId;
            }
            statusBadge.disabled = false;
        }
        
        // Handle status synchronization with linked reports (only if not skipping)
        if (!skipReportSync) {
            await handleInvoiceReportStatusSync(invoiceId, newStatus);
        }
        
        // Show success message
        showToast('تم تحديث حالة الدفع بنجاح', 'success');
        
    } catch (error) {
        console.error('Error updating invoice payment status:', error);
        
        // Restore original content on error
        if (statusBadge && originalContent) {
            statusBadge.innerHTML = originalContent;
            statusBadge.disabled = false;
        }
        
        showToast(`حدث خطأ أثناء تحديث حالة الدفع: ${error.message}`, 'error');
    }
}

/**
 * Handle status synchronization between invoices and reports
 * @param {string} invoiceId - The invoice ID
 * @param {string} newStatus - The new invoice status
 */
async function handleInvoiceReportStatusSync(invoiceId, newStatus) {
    try {
        // Get API base URL
        const apiBaseUrl = getApiBaseUrl();
        
        // Get invoice details to find linked reports
        const response = await fetch(`${apiBaseUrl}/api/invoices/${invoiceId}`, {
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken')
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch invoice details');
        }
        
        const invoice = await response.json();
        
        // Map invoice status to report status (direct mapping)
        let reportStatus = newStatus; // Use the same status
        
        // Update linked reports
        if (invoice.report_id) {
            console.log(`Updating report ${invoice.report_id} status to ${reportStatus}`);
            await updateReportStatusFromInvoice(invoice.report_id, reportStatus);
        } else if (invoice.report_ids && Array.isArray(invoice.report_ids)) {
            // Handle multiple reports
            for (const reportId of invoice.report_ids) {
                console.log(`Updating report ${reportId} status to ${reportStatus}`);
                await updateReportStatusFromInvoice(reportId, reportStatus);
            }
        } else {
            console.log('No linked reports found for invoice', invoiceId);
        }
        
        console.log(`Synchronized linked reports to status: ${reportStatus}`);
        
    } catch (error) {
        console.error('Error synchronizing report status:', error);
        // Don't show error to user as this is a background sync
    }
}

/**
 * Update report status from invoice (without triggering invoice sync)
 * @param {string} reportId - The report ID
 * @param {string} newStatus - The new status
 */
async function updateReportStatusFromInvoice(reportId, newStatus) {
    try {
        // Get API base URL
        const apiBaseUrl = getApiBaseUrl();
        
        const response = await fetch(`${apiBaseUrl}/api/reports/${reportId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken')
            },
            body: JSON.stringify({ status: newStatus })
        });
        
        if (!response.ok) {
            throw new Error('Failed to update report status');
        }
        
        console.log(`Report ${reportId} status updated to ${newStatus}`);
        
        // Update the cached reports data
        const cachedReports = JSON.parse(localStorage.getItem('cachedReports') || '[]');
        const reportIndex = cachedReports.findIndex(r => r.id == reportId);
        if (reportIndex !== -1) {
            cachedReports[reportIndex].status = newStatus;
            localStorage.setItem('cachedReports', JSON.stringify(cachedReports));
        }
        
    } catch (error) {
        console.error(`Error updating report ${reportId} status:`, error);
        throw error;
    }
}
