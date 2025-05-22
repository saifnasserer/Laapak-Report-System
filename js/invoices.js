/**
 * Laapak Report System - Invoices Management
 * Handles the invoices listing, filtering, and management functionality
 */

let invoicesTable; // Global variable for the DataTable instance
let clients = []; // Store clients data
let reports = []; // Store reports data

document.addEventListener('DOMContentLoaded', function() {
    // Check if user is authenticated
    if (!AuthMiddleware.isAdminLoggedIn()) {
        window.location.href = 'login.html';
        return;
    }
    
    // Load header component
    if (document.getElementById('header-container')) {
        HeaderComponent.loadAdminHeader('invoices');
    }
    
    // Initialize the page
    initializeDataTable();
    loadInvoicesData();
    loadClientsData();
    loadReportsData();
    setupEventListeners();
    setupCalculations();
});

/**
 * Initialize DataTable for invoices
 */
function initializeDataTable() {
    const table = $('#invoicesTable');
    if (table.length === 0) return;
    
    // Initialize DataTable with configurations
    invoicesTable = table.DataTable({
        language: {
            url: 'https://cdn.datatables.net/plug-ins/1.11.5/i18n/ar.json'
        },
        columns: [
            { data: 'id' }, // Invoice ID
            { data: 'client_name' }, // Client Name
            { data: 'date' }, // Date
            { data: 'total' }, // Amount
            { data: 'paymentStatus' }, // Payment Status
            { data: 'paymentMethod' }, // Payment Method
            { data: 'actions', sortable: false } // Actions column
        ],
        order: [[2, 'desc']], // Order by date, newest first
        pageLength: 10,
        responsive: true,
        dom: '<"d-flex justify-content-between align-items-center mb-3"f<"d-flex align-items-center"l<"ms-2"i>>><"table-responsive"t><"d-flex justify-content-between mt-3"p>',
        initComplete: function() {
            // Add custom search functionality
            $('#searchInvoice').on('keyup', function() {
                invoicesTable.search(this.value).draw();
            });
        }
    });
}

/**
 * Load invoices data from API
 */
async function loadInvoicesData(filters = {}) {
    try {
        // Clear existing data
        if (invoicesTable) {
            invoicesTable.clear();
        }
        
        // Build API URL with filters
        let apiUrl = 'http://localhost:3001/api/invoices';
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
        
        // Get token for authentication
        const token = AuthMiddleware.getAdminToken();
        if (!token) {
            throw new Error('Authentication token not available');
        }
        
        // Fetch invoices from API
        const response = await fetch(apiUrl, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        const invoices = data.invoices || data; // Handle different API response formats
        
        // Format and add data to DataTable
        const formattedInvoices = invoices.map(invoice => formatInvoiceForTable(invoice));
        
        if (invoicesTable) {
            invoicesTable.rows.add(formattedInvoices).draw();
        }
        
        return invoices;
    } catch (error) {
        console.error('Error loading invoices:', error);
        showToast('حدث خطأ أثناء تحميل الفواتير', 'error');
        
        // Show error in table
        if (invoicesTable) {
            invoicesTable.clear().draw();
        }
        
        return [];
    }
}

/**
 * Format invoice data for display in the DataTable
 */
function formatInvoiceForTable(invoice) {
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
    switch (invoice.paymentStatus) {
        case 'paid':
            statusBadge = '<span class="badge bg-success rounded-pill px-3">مدفوعة</span>';
            break;
        case 'partial':
            statusBadge = '<span class="badge bg-warning text-dark rounded-pill px-3">مدفوعة جزئياً</span>';
            break;
        case 'unpaid':
        default:
            statusBadge = '<span class="badge bg-danger rounded-pill px-3">غير مدفوعة</span>';
            break;
    }
    
    // Format payment method
    let paymentMethodText = '-';
    if (invoice.paymentMethod) {
        switch (invoice.paymentMethod) {
            case 'cash':
                paymentMethodText = 'نقداً';
                break;
            case 'credit_card':
                paymentMethodText = 'بطاقة ائتمان';
                break;
            case 'bank_transfer':
                paymentMethodText = 'تحويل بنكي';
                break;
            case 'other':
                paymentMethodText = 'أخرى';
                break;
            default:
                paymentMethodText = invoice.paymentMethod;
        }
    }
    
    // Format actions buttons
    const actions = `
        <div class="d-flex justify-content-center">
            <button class="btn btn-sm btn-primary me-1 view-invoice" data-id="${invoice.id}" title="عرض الفاتورة">
                <i class="fas fa-eye"></i>
            </button>
            <button class="btn btn-sm btn-warning me-1 edit-invoice" data-id="${invoice.id}" title="تعديل الفاتورة">
                <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-sm btn-danger delete-invoice" data-id="${invoice.id}" title="حذف الفاتورة">
                <i class="fas fa-trash-alt"></i>
            </button>
        </div>
    `;
    
    // Return formatted invoice data for DataTable
    return {
        id: invoice.id,
        client_name: clientName,
        date: formattedDate,
        total: `${invoice.total.toFixed(2)} ج.م.`,
        paymentStatus: statusBadge,
        paymentMethod: paymentMethodText,
        actions: actions,
        // Store raw data for later use
        raw: invoice
    };
}

/**
 * Load clients data from API
 */
async function loadClientsData() {
    try {
        // Build API URL
        const apiUrl = 'http://localhost:3001/api/clients';
        
        // Get token for authentication
        const token = AuthMiddleware.getAdminToken();
        if (!token) {
            throw new Error('Authentication token not available');
        }
        
        // Fetch clients from API
        const response = await fetch(apiUrl, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        clients = data.clients || data; // Handle different API response formats
        
        // Populate client dropdowns
        populateClientDropdowns(clients);
        
        return clients;
    } catch (error) {
        console.error('Error loading clients:', error);
        return [];
    }
}

/**
 * Load reports data from API
 */
async function loadReportsData() {
    try {
        // Build API URL
        const apiUrl = 'http://localhost:3001/api/reports';
        
        // Get token for authentication
        const token = AuthMiddleware.getAdminToken();
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
        
        // Populate report dropdowns
        populateReportDropdowns(reports);
        
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
    const clientDropdowns = [
        document.getElementById('clientId'),
        document.getElementById('editClientId'),
        document.getElementById('filterPaymentStatus')
    ];

    clientDropdowns.forEach(dropdown => {
        if (!dropdown) return;

        // Keep default option and clear the rest
        const defaultOption = dropdown.querySelector('option');
        dropdown.innerHTML = '';
        if (defaultOption) {
            dropdown.appendChild(defaultOption);
        }

        // Add client options
        clientsData.forEach(client => {
            if (client.status === 'active') {
                const option = document.createElement('option');
                option.value = client.id;
                option.textContent = client.name;
                dropdown.appendChild(option);
            }
        });
        
        // Get payment status badge class
        let statusBadgeClass = 'bg-secondary';
        let statusText = 'غير معروف';
        
        switch (invoice.paymentStatus) {
            case 'paid':
                statusBadgeClass = 'bg-success';
                statusText = 'مدفوعة';
                break;
            case 'partial':
                statusBadgeClass = 'bg-warning';
                statusText = 'مدفوعة جزئياً';
                break;
            case 'unpaid':
                statusBadgeClass = 'bg-danger';
                statusText = 'غير مدفوعة';
                break;
        }
        
        // Get client name
        let clientName = 'عميل غير معروف';
        if (invoice.client_name) {
            clientName = invoice.client_name;
        } else if (invoice.clientName) {
            clientName = invoice.clientName;
        }
        
        row.innerHTML = `
            <td>${invoice.id}</td>
            <td>${clientName}</td>
            <td>${formattedDate}</td>
            <td>${parseFloat(invoice.total || 0).toFixed(2)} جنية</td>
            <td><span class="badge ${statusBadgeClass}">${statusText}</span></td>
            <td>
                <div class="btn-group">
                    <button type="button" class="btn btn-sm btn-outline-primary view-invoice-btn" data-invoice-id="${invoice.id}">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button type="button" class="btn btn-sm btn-outline-warning edit-invoice-btn" data-invoice-id="${invoice.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button type="button" class="btn btn-sm btn-outline-danger delete-invoice-btn" data-invoice-id="${invoice.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        
        invoicesTableBody.appendChild(row);
    });
    
    // Add event listeners to action buttons
    addInvoiceActionListeners();
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
    // Add invoice button
    const addInvoiceBtn = document.getElementById('addInvoiceBtn');
    if (addInvoiceBtn) {
        addInvoiceBtn.addEventListener('click', () => {
            // Reset form
            document.getElementById('addInvoiceForm').reset();
            // Set default date to today
            document.getElementById('invoiceDate').valueAsDate = new Date();
            // Clear invoice items except the first one
            const invoiceItems = document.getElementById('invoiceItems');
            if (invoiceItems && invoiceItems.children.length > 1) {
                Array.from(invoiceItems.children).slice(1).forEach(item => item.remove());
            }
            // Reset item fields
            const itemDescriptionInputs = document.querySelectorAll('.item-description');
            const itemAmountInputs = document.querySelectorAll('.item-amount');
            const itemQuantityInputs = document.querySelectorAll('.item-quantity');
            const itemSerialInputs = document.querySelectorAll('.item-serial');
            
            itemDescriptionInputs.forEach(input => input.value = '');
            itemAmountInputs.forEach(input => input.value = '');
            itemQuantityInputs.forEach(input => input.value = '1');
            itemSerialInputs.forEach(input => input.value = '');
            
            // Reset calculations
            updateCalculations();
        });
    }
    
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
        const token = AuthMiddleware.getAdminToken();
        if (!token) {
            throw new Error('Authentication token not available');
        }
        
        // Send to API
        const response = await fetch('http://localhost:3001/api/invoices', {
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
        const token = AuthMiddleware.getAdminToken();
        if (!token) {
            throw new Error('Authentication token not available');
        }
        
        // Send to API
        const response = await fetch(`http://localhost:3001/api/invoices/${invoiceId}`, {
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
        const token = AuthMiddleware.getAdminToken();
        if (!token) {
            throw new Error('Authentication token not available');
        }
        
        // Fetch invoice details from API
        const response = await fetch(`http://localhost:3001/api/invoices/${invoiceId}`, {
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
            case 'paid':
                statusBadge = 'bg-success';
                statusText = 'مدفوعة';
                break;
            case 'partial':
                statusBadge = 'bg-warning text-dark';
                statusText = 'مدفوعة جزئياً';
                break;
            case 'unpaid':
            default:
                statusBadge = 'bg-danger';
                statusText = 'غير مدفوعة';
                break;
        }
        
        // Format payment method
        let paymentMethodText = '-';
        if (invoice.paymentMethod) {
            switch (invoice.paymentMethod) {
                case 'cash':
                    paymentMethodText = 'نقداً';
                    break;
                case 'credit_card':
                    paymentMethodText = 'بطاقة ائتمان';
                    break;
                case 'bank_transfer':
                    paymentMethodText = 'تحويل بنكي';
                    break;
                case 'other':
                    paymentMethodText = 'أخرى';
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
        const token = AuthMiddleware.getAdminToken();
        if (!token) {
            throw new Error('Authentication token not available');
        }
        
        // Fetch invoice details from API
        const response = await fetch(`http://localhost:3001/api/invoices/${invoiceId}`, {
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
 */
function printInvoice() {
    const invoiceContent = document.getElementById('viewInvoiceContent').innerHTML;
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    
    printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>فاتورة لاباك</title>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.rtl.min.css">
        <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .invoice-header { text-align: center; margin-bottom: 30px; }
            .invoice-header img { max-height: 80px; }
            .invoice-footer { margin-top: 50px; text-align: center; font-size: 14px; }
            @media print {
                @page { margin: 0.5cm; }
                body { margin: 1cm; }
                .no-print { display: none; }
            }
        </style>
    </head>
    <body>
        <div class="invoice-header">
            <img src="img/logo.png" alt="Laapak Logo">
            <h4 class="mt-2">فاتورة لاباك</h4>
        </div>
        
        ${invoiceContent}
        
        <div class="invoice-footer">
            <p>شكراً لتعاملكم مع لاباك</p>
            <p>&copy; ${new Date().getFullYear()} نظام تقارير لاباك. جميع الحقوق محفوظة.</p>
        </div>
        
        <div class="mt-4 no-print text-center">
            <button class="btn btn-primary" onclick="window.print()">طباعة الفاتورة</button>
            <button class="btn btn-secondary ms-2" onclick="window.close()">إغلاق</button>
        </div>
    </body>
    </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    // Auto print after loading
    printWindow.onload = function() {
        setTimeout(() => {
            printWindow.print();
        }, 500);
    };
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
        const token = AuthMiddleware.getAdminToken();
        if (!token) {
            throw new Error('Authentication token not available');
        }
        
        // Send delete request to API
        const response = await fetch(`http://localhost:3001/api/invoices/${invoiceId}`, {
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
    
    loadInvoices(filters);
}

// Reset filters
function resetFilters() {
    document.getElementById('clientFilter').value = '';
    document.getElementById('paymentStatusFilter').value = '';
    document.getElementById('dateFromFilter').value = '';
    document.getElementById('dateToFilter').value = '';
    
    loadInvoices();
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
        loadInvoices();
        
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

// Show toast notification
function showToast(message, type = 'info') {
    // Check if toastr is available
    if (typeof toastr === 'undefined') {
        // Fallback to alert if toastr is not available
        alert(message);
        return;
    }
    
    // Set toastr options
    toastr.options = {
        closeButton: true,
        progressBar: true,
        positionClass: 'toast-top-right',
        timeOut: 5000,
        rtl: true
    };
    
    // Show toast based on type
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
    }
}
