/**
 * Laapak Report System - Invoices Management
 * Handles the invoices listing, filtering, and management functionality
 */

document.addEventListener('DOMContentLoaded', function() {
    // Check if user is authenticated
    if (typeof authMiddleware !== 'undefined' && !authMiddleware.isAdminLoggedIn()) {
        window.location.href = 'index.html';
        return;
    }
    
    // Initialize the page
    loadInvoices();
    loadClients();
    setupEventListeners();
});

// Load invoices from API or localStorage
async function loadInvoices(filters = {}) {
    try {
        const invoicesTableBody = document.getElementById('invoicesTableBody');
        if (!invoicesTableBody) return;
        
        // Show loading indicator
        invoicesTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-4">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">جاري التحميل...</span>
                    </div>
                    <p class="mt-2">جاري تحميل الفواتير...</p>
                </td>
            </tr>
        `;
        
        let invoices = [];
        
        // Try to get invoices from API
        try {
            if (typeof apiService !== 'undefined' && typeof apiService.getInvoices === 'function') {
                invoices = await apiService.getInvoices(filters);
            } else {
                throw new Error('API service not available');
            }
        } catch (apiError) {
            console.warn('Error loading invoices from API, falling back to localStorage:', apiError);
            
            // Fall back to localStorage
            const storedInvoices = localStorage.getItem('lpk_invoices');
            if (storedInvoices) {
                invoices = JSON.parse(storedInvoices);
                
                // Apply filters if any
                if (filters) {
                    if (filters.client_id) {
                        invoices = invoices.filter(invoice => invoice.client_id.toString() === filters.client_id.toString());
                    }
                    if (filters.paymentStatus) {
                        invoices = invoices.filter(invoice => invoice.paymentStatus === filters.paymentStatus);
                    }
                    if (filters.dateFrom) {
                        const dateFrom = new Date(filters.dateFrom);
                        invoices = invoices.filter(invoice => new Date(invoice.date) >= dateFrom);
                    }
                    if (filters.dateTo) {
                        const dateTo = new Date(filters.dateTo);
                        dateTo.setHours(23, 59, 59, 999); // End of day
                        invoices = invoices.filter(invoice => new Date(invoice.date) <= dateTo);
                    }
                }
            }
        }
        
        // Display invoices
        displayInvoices(invoices);
        
    } catch (error) {
        console.error('Error loading invoices:', error);
        showToast('حدث خطأ أثناء تحميل الفواتير', 'error');
    }
}

// Display invoices in the table
function displayInvoices(invoices) {
    const invoicesTableBody = document.getElementById('invoicesTableBody');
    if (!invoicesTableBody) return;
    
    // Clear table
    invoicesTableBody.innerHTML = '';
    
    // Check if there are invoices to display
    if (!invoices || invoices.length === 0) {
        invoicesTableBody.innerHTML = `
            <tr class="text-center">
                <td colspan="6" class="py-5 text-muted">
                    <i class="fas fa-file-invoice-dollar me-2"></i>
                    لا توجد فواتير
                </td>
            </tr>
        `;
        return;
    }
    
    // Sort invoices by date (newest first)
    invoices.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Display invoices
    invoices.forEach(invoice => {
        const row = document.createElement('tr');
        
        // Format date
        let formattedDate = 'غير محدد';
        if (invoice.date) {
            try {
                const date = new Date(invoice.date);
                if (!isNaN(date.getTime())) {
                    formattedDate = date.toISOString().split('T')[0];
                }
            } catch (e) {
                console.warn('Invalid date:', invoice.date);
            }
        }
        
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
            window.open(`invoice.html?id=${invoiceId}`, '_blank');
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

// Setup event listeners for the page
function setupEventListeners() {
    // Filter buttons
    const applyFiltersBtn = document.getElementById('applyFiltersBtn');
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', applyFilters);
    }
    
    const resetFiltersBtn = document.getElementById('resetFiltersBtn');
    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', resetFilters);
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
