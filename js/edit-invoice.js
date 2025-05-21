/**
 * Laapak Report System - Edit Invoice
 * Handles the invoice editing functionality
 */

// Global variables
let invoiceId = null;
let invoiceData = null;
let invoiceItems = [];
let clientsData = [];
let isOffline = !navigator.onLine;

// Check for online/offline status
window.addEventListener('online', function() {
    isOffline = false;
    document.getElementById('offlineAlert').style.display = 'none';
});

window.addEventListener('offline', function() {
    isOffline = true;
    document.getElementById('offlineAlert').style.display = 'block';
});

document.addEventListener('DOMContentLoaded', function() {
    // Initialize offline alert
    document.getElementById('offlineAlert').style.display = isOffline ? 'block' : 'none';
    
    // Check if user is authenticated
    if (typeof authCheck !== 'undefined') {
        authCheck.verifyAuth();
    } else if (typeof authMiddleware !== 'undefined' && !authMiddleware.isAdminLoggedIn()) {
        window.location.href = 'login.html';
        return;
    }
    
    // Initialize the page
    initPage();
    loadClients();
    setupEventListeners();
});

// Initialize the page
function initPage() {
    // Get invoice ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    invoiceId = urlParams.get('id');
    
    if (!invoiceId) {
        // No invoice ID provided, redirect to invoices page
        window.location.href = 'invoices.html';
        return;
    }
    
    // Set page title
    const pageTitle = document.getElementById('pageTitle');
    if (pageTitle) {
        pageTitle.textContent = `تعديل الفاتورة #${invoiceId}`;
    }
    
    // Load invoice data
    loadInvoice(invoiceId);
}

// Load invoice data
async function loadInvoice(id) {
    try {
        showLoading(true);
        
        // Try to get invoice from API
        try {
            if (typeof apiService !== 'undefined' && typeof apiService.getInvoice === 'function') {
                console.log('Fetching invoice data from API for ID:', id);
                invoiceData = await apiService.getInvoice(id);
                console.log('Invoice data received:', invoiceData);
                
                // Store in localStorage as backup
                storeInvoiceInLocalStorage(invoiceData);
            } else {
                throw new Error('API service not available');
            }
        } catch (apiError) {
            console.warn('Error loading invoice from API, falling back to localStorage:', apiError);
            
            // Fall back to localStorage
            const storedInvoices = localStorage.getItem('lpk_invoices');
            if (storedInvoices) {
                const invoices = JSON.parse(storedInvoices);
                invoiceData = invoices.find(invoice => invoice.id === id || invoice.id === id.toString());
                
                if (!invoiceData) {
                    throw new Error('الفاتورة غير موجودة');
                }
            } else {
                throw new Error('لا توجد فواتير محفوظة محليًا');
            }
        }
        
        // Populate form with invoice data
        populateForm(invoiceData);
        showLoading(false);
        
    } catch (error) {
        console.error('Error loading invoice:', error);
        showLoading(false);
        showToast(`حدث خطأ أثناء تحميل بيانات الفاتورة: ${error.message}`, 'error');
        
        // Redirect back to invoices page after a delay
        setTimeout(() => {
            window.location.href = 'invoices.html';
        }, 3000);
    }
}

// Store invoice in localStorage
function storeInvoiceInLocalStorage(invoice) {
    try {
        // Get existing invoices from localStorage
        const storedInvoices = localStorage.getItem('lpk_invoices');
        let invoices = [];
        
        if (storedInvoices) {
            invoices = JSON.parse(storedInvoices);
            
            // Update existing invoice or add new one
            const index = invoices.findIndex(inv => inv.id === invoice.id || inv.id === invoice.id.toString());
            if (index !== -1) {
                invoices[index] = invoice;
            } else {
                invoices.push(invoice);
            }
        } else {
            invoices = [invoice];
        }
        
        // Save back to localStorage
        localStorage.setItem('lpk_invoices', JSON.stringify(invoices));
    } catch (error) {
        console.error('Error storing invoice in localStorage:', error);
    }
}

// Show/hide loading state
function showLoading(isLoading) {
    const loadingRow = document.getElementById('loadingItemsRow');
    if (loadingRow) {
        loadingRow.style.display = isLoading ? 'table-row' : 'none';
    }
}

// Populate form with invoice data
function populateForm(invoice) {
    console.log('Populating form with invoice data:', invoice);
    
    // Set basic invoice details
    const titleField = document.getElementById('invoiceTitle');
    if (titleField) {
        titleField.value = invoice.title || '';
    }
    
    const dateField = document.getElementById('invoiceDate');
    if (dateField) {
        // Format date to YYYY-MM-DD for input[type=date]
        if (invoice.date) {
            try {
                const date = new Date(invoice.date);
                if (!isNaN(date.getTime())) {
                    dateField.value = date.toISOString().split('T')[0];
                }
            } catch (e) {
                console.error('Error formatting date:', e);
                dateField.value = new Date().toISOString().split('T')[0];
            }
        } else {
            dateField.value = new Date().toISOString().split('T')[0];
        }
    }
    
    const statusField = document.getElementById('paymentStatus');
    if (statusField) {
        statusField.value = invoice.paymentStatus || 'unpaid';
    }
    
    const notesField = document.getElementById('invoiceNotes');
    if (notesField) {
        notesField.value = invoice.notes || '';
    }
    
    const taxRateField = document.getElementById('taxRate');
    if (taxRateField) {
        taxRateField.value = invoice.taxRate || 15;
    }
    
    const discountRateField = document.getElementById('discountRate');
    if (discountRateField) {
        discountRateField.value = invoice.discountRate || 0;
    }
    
    // Set client
    const clientSelect = document.getElementById('clientSelect');
    if (clientSelect && invoice.client_id) {
        clientSelect.value = invoice.client_id;
        
        // If no option is selected (client might not be in the list yet)
        if (clientSelect.selectedIndex === -1 && clientsData.length > 0) {
            // Try to find client in clientsData
            const client = clientsData.find(c => c.id === invoice.client_id || c.id === parseInt(invoice.client_id));
            
            if (client) {
                // Add client to select options if not already there
                const option = document.createElement('option');
                option.value = client.id;
                option.textContent = client.name;
                clientSelect.appendChild(option);
                clientSelect.value = client.id;
            }
        }
    }
    
    // Set invoice items
    invoiceItems = [];
    
    // Check if items exist in the invoice data
    if (invoice.items && Array.isArray(invoice.items) && invoice.items.length > 0) {
        console.log('Processing invoice items:', invoice.items);
        
        invoiceItems = invoice.items.map(item => ({
            description: item.description || '',
            quantity: parseInt(item.quantity) || 1,
            unitPrice: parseFloat(item.unitPrice || item.amount || 0),
            total: parseFloat(item.total || item.totalAmount || 0)
        }));
    } else if (invoice.InvoiceItems && Array.isArray(invoice.InvoiceItems) && invoice.InvoiceItems.length > 0) {
        // Handle Sequelize format where items are in InvoiceItems property
        console.log('Processing invoice items from InvoiceItems:', invoice.InvoiceItems);
        
        invoiceItems = invoice.InvoiceItems.map(item => ({
            description: item.description || '',
            quantity: parseInt(item.quantity) || 1,
            unitPrice: parseFloat(item.amount || 0),
            total: parseFloat(item.totalAmount || 0)
        }));
    } else {
        console.warn('No invoice items found in the data');
    }
    
    updateItemsTable();
    
    // Update total amount
    updateTotalAmount();
}

// Update items table
function updateItemsTable() {
    const itemsTableBody = document.getElementById('invoiceItemsTableBody');
    if (!itemsTableBody) return;
    
    // Hide loading row if it exists
    const loadingRow = document.getElementById('loadingItemsRow');
    if (loadingRow) {
        loadingRow.style.display = 'none';
    }
    
    // Clear table (except for the loading row)
    Array.from(itemsTableBody.children).forEach(child => {
        if (child.id !== 'loadingItemsRow') {
            itemsTableBody.removeChild(child);
        }
    });
    
    // Add items to table or show empty message
    if (invoiceItems.length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.id = 'emptyItemsRow';
        emptyRow.innerHTML = `
            <td colspan="5" class="text-center py-3">
                <i class="fas fa-info-circle me-2 text-muted"></i>
                لا توجد عناصر في الفاتورة. قم بإضافة عناصر باستخدام زر "إضافة عنصر جديد".
            </td>
        `;
        itemsTableBody.appendChild(emptyRow);
    } else {
        // Add items to table
        invoiceItems.forEach((item, index) => {
            const row = document.createElement('tr');
            row.setAttribute('data-item-index', index);
            
            row.innerHTML = `
                <td>
                    <input type="text" class="form-control form-control-sm item-description" value="${item.description || ''}" placeholder="وصف العنصر">
                </td>
                <td>
                    <input type="number" class="form-control form-control-sm item-quantity" value="${item.quantity || 1}" min="1" onchange="updateItemTotal(this)">
                </td>
                <td>
                    <input type="number" class="form-control form-control-sm item-price" value="${parseFloat(item.unitPrice || 0).toFixed(2)}" min="0" step="0.01" onchange="updateItemTotal(this)">
                </td>
                <td>
                    <input type="number" class="form-control form-control-sm item-total" value="${parseFloat(item.total || 0).toFixed(2)}" readonly>
                </td>
                <td class="text-center">
                    <button type="button" class="btn btn-sm btn-outline-danger delete-item-btn" onclick="deleteItem(${index})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            
            itemsTableBody.appendChild(row);
            
            // Add event listeners for description changes
            const descInput = row.querySelector('.item-description');
            if (descInput) {
                descInput.addEventListener('change', () => {
                    invoiceItems[index].description = descInput.value;
                });
            }
        });
    }
}

// Update item total
function updateItemTotal(input) {
    const row = input.closest('tr');
    const quantity = parseFloat(row.querySelector('.item-quantity').value) || 0;
    const price = parseFloat(row.querySelector('.item-price').value) || 0;
    const total = quantity * price;
    
    row.querySelector('.item-total').value = total.toFixed(2);
    
    // Update item in array
    const index = parseInt(row.getAttribute('data-item-index'));
    if (!isNaN(index) && invoiceItems[index]) {
        invoiceItems[index].quantity = quantity;
        invoiceItems[index].unitPrice = price;
        invoiceItems[index].total = total;
    }
    
    // Update total amount
    updateTotalAmount();
}

// Update total amount
function updateTotalAmount() {
    let subtotal = 0;
    
    // Calculate subtotal from items
    invoiceItems.forEach(item => {
        subtotal += parseFloat(item.total) || 0;
    });
    
    // Calculate tax and discount
    const taxRateField = document.getElementById('taxRate');
    const discountRateField = document.getElementById('discountRate');
    
    const taxRate = taxRateField ? (parseFloat(taxRateField.value) || 0) : 0;
    const discountRate = discountRateField ? (parseFloat(discountRateField.value) || 0) : 0;
    
    const taxAmount = (subtotal * taxRate) / 100;
    const discountAmount = (subtotal * discountRate) / 100;
    
    // Calculate total
    const total = subtotal + taxAmount - discountAmount;
    
    // Update total display
    const totalAmountElement = document.getElementById('totalAmount');
    if (totalAmountElement) {
        totalAmountElement.textContent = `${total.toFixed(2)} جنية`;
    }
    
    // Store calculated values for later use when saving
    invoiceData = {
        ...invoiceData,
        subtotal: subtotal,
        tax: taxAmount,
        discount: discountAmount,
        total: total,
        taxRate: taxRate,
        discountRate: discountRate
    };
}

// Add new item
function addItem() {
    // Hide empty message if it exists
    const emptyRow = document.getElementById('emptyItemsRow');
    if (emptyRow) {
        emptyRow.style.display = 'none';
    }
    
    // Create new item
    const newItem = {
        description: '',
        quantity: 1,
        unitPrice: 0,
        total: 0
    };
    
    // Add to items array
    invoiceItems.push(newItem);
    
    // Update table
    updateItemsTable();
    
    // Focus on the new item's description field
    const itemsTableBody = document.getElementById('invoiceItemsTableBody');
    const rows = itemsTableBody.querySelectorAll('tr');
    const lastRow = rows[rows.length - 1];
    if (lastRow) {
        const descField = lastRow.querySelector('.item-description');
        if (descField) {
            descField.focus();
        }
    }
    
    // Update total amount
    updateTotalAmount();
    
    // Show toast notification
    showToast('تمت إضافة عنصر جديد', 'info');
}

// Delete item
function deleteItem(index) {
    // Confirm deletion
    if (confirm('هل أنت متأكد من حذف هذا العنصر؟')) {
        // Remove item from array
        invoiceItems.splice(index, 1);
        
        // Update table
        updateItemsTable();
        
        // Update total amount
        updateTotalAmount();
        
        // Show toast notification
        showToast('تم حذف العنصر بنجاح', 'success');
    }
}

// Load clients
async function loadClients() {
    try {
        const clientSelect = document.getElementById('clientSelect');
        if (!clientSelect) return;
        
        // Show loading state in select
        const loadingOption = document.createElement('option');
        loadingOption.textContent = 'جاري تحميل العملاء...';
        loadingOption.disabled = true;
        loadingOption.selected = true;
        clientSelect.appendChild(loadingOption);
        
        // Try to get clients from API
        try {
            if (typeof apiService !== 'undefined' && typeof apiService.getClients === 'function') {
                console.log('Fetching clients from API');
                clientsData = await apiService.getClients();
                console.log('Clients data received:', clientsData);
                
                // Store in localStorage as backup
                localStorage.setItem('lpk_clients', JSON.stringify(clientsData));
            } else {
                throw new Error('API service not available');
            }
        } catch (apiError) {
            console.warn('Error loading clients from API, falling back to localStorage:', apiError);
            
            // Fall back to localStorage
            const storedClients = localStorage.getItem('lpk_clients');
            if (storedClients) {
                clientsData = JSON.parse(storedClients);
            } else {
                showToast('لا يمكن تحميل بيانات العملاء', 'warning');
                clientsData = [];
            }
        }
        
        // Remove loading option
        clientSelect.removeChild(loadingOption);
        
        // Add default empty option
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'اختر العميل';
        clientSelect.appendChild(defaultOption);
        
        // Add client options to select
        if (clientsData.length > 0) {
            // Sort clients by name
            clientsData.sort((a, b) => a.name.localeCompare(b.name));
            
            clientsData.forEach(client => {
                const option = document.createElement('option');
                option.value = client.id;
                option.textContent = client.name;
                clientSelect.appendChild(option);
            });
        } else {
            const noClientsOption = document.createElement('option');
            noClientsOption.disabled = true;
            noClientsOption.textContent = 'لا يوجد عملاء';
            clientSelect.appendChild(noClientsOption);
        }
        
    } catch (error) {
        console.error('Error loading clients:', error);
        showToast('حدث خطأ أثناء تحميل العملاء', 'error');
    }
}

// Setup event listeners
function setupEventListeners() {
    // Add item button
    const addItemBtn = document.getElementById('addItemBtn');
    if (addItemBtn) {
        addItemBtn.addEventListener('click', addItem);
    }
    
    // Tax and discount rate inputs
    const taxRateInput = document.getElementById('taxRate');
    if (taxRateInput) {
        taxRateInput.addEventListener('input', updateTotalAmount);
    }
    
    const discountRateInput = document.getElementById('discountRate');
    if (discountRateInput) {
        discountRateInput.addEventListener('input', updateTotalAmount);
    }
    
    // Save invoice buttons (there might be two - one in header and one in footer)
    const saveInvoiceBtns = document.querySelectorAll('#saveInvoiceBtn');
    saveInvoiceBtns.forEach(btn => {
        btn.addEventListener('click', saveInvoice);
    });
    
    // Cancel button
    const cancelBtn = document.getElementById('cancelBtn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            if (confirm('هل أنت متأكد من الإلغاء؟ سيتم فقدان جميع التغييرات غير المحفوظة.')) {
                window.location.href = 'invoices.html';
            }
        });
    }
    
    // Client select change
    const clientSelect = document.getElementById('clientSelect');
    if (clientSelect) {
        clientSelect.addEventListener('change', function() {
            // Update invoice data with selected client
            if (invoiceData) {
                invoiceData.client_id = this.value;
            }
        });
    }
}

// Save invoice
async function saveInvoice() {
    try {
        // Show loading state
        const saveButtons = document.querySelectorAll('#saveInvoiceBtn');
        saveButtons.forEach(btn => {
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> جاري الحفظ...';
        });
        
        // Get form data
        const titleField = document.getElementById('invoiceTitle');
        const dateField = document.getElementById('invoiceDate');
        const clientSelect = document.getElementById('clientSelect');
        const statusField = document.getElementById('paymentStatus');
        const notesField = document.getElementById('invoiceNotes');
        const taxRateField = document.getElementById('taxRate');
        const discountRateField = document.getElementById('discountRate');
        
        const title = titleField ? titleField.value : '';
        const date = dateField ? dateField.value : '';
        const client_id = clientSelect ? clientSelect.value : '';
        const paymentStatus = statusField ? statusField.value : 'unpaid';
        const notes = notesField ? notesField.value : '';
        const taxRate = taxRateField ? (parseFloat(taxRateField.value) || 0) : 0;
        const discountRate = discountRateField ? (parseFloat(discountRateField.value) || 0) : 0;
        
        // Validate required fields
        if (!title) {
            showToast('الرجاء إدخال عنوان الفاتورة', 'warning');
            resetSaveButtons(saveButtons);
            titleField.focus();
            return;
        }
        
        if (!date) {
            showToast('الرجاء اختيار تاريخ الفاتورة', 'warning');
            resetSaveButtons(saveButtons);
            dateField.focus();
            return;
        }
        
        if (!client_id) {
            showToast('الرجاء اختيار عميل', 'warning');
            resetSaveButtons(saveButtons);
            clientSelect.focus();
            return;
        }
        
        // Validate items
        if (invoiceItems.length === 0) {
            showToast('الرجاء إضافة عنصر واحد على الأقل', 'warning');
            resetSaveButtons(saveButtons);
            const addItemBtn = document.getElementById('addItemBtn');
            if (addItemBtn) addItemBtn.focus();
            return;
        }
        
        // Update items from table
        const itemsTableBody = document.getElementById('invoiceItemsTableBody');
        if (itemsTableBody) {
            const rows = itemsTableBody.querySelectorAll('tr[data-item-index]');
            
            rows.forEach((row, index) => {
                const descInput = row.querySelector('.item-description');
                const quantityInput = row.querySelector('.item-quantity');
                const priceInput = row.querySelector('.item-price');
                const totalInput = row.querySelector('.item-total');
                
                const description = descInput ? descInput.value : '';
                const quantity = quantityInput ? (parseFloat(quantityInput.value) || 0) : 0;
                const unitPrice = priceInput ? (parseFloat(priceInput.value) || 0) : 0;
                const total = totalInput ? (parseFloat(totalInput.value) || 0) : 0;
                
                if (index < invoiceItems.length) {
                    invoiceItems[index] = {
                        description,
                        quantity,
                        unitPrice,
                        total
                    };
                }
            });
        }
        
        // Calculate totals
        let subtotal = 0;
        invoiceItems.forEach(item => {
            subtotal += parseFloat(item.total) || 0;
        });
        
        const taxAmount = (subtotal * taxRate) / 100;
        const discountAmount = (subtotal * discountRate) / 100;
        const total = subtotal + taxAmount - discountAmount;
        
        // Create updated invoice object
        const updatedInvoice = {
            id: invoiceId,
            title,
            date,
            client_id,
            paymentStatus,
            notes,
            taxRate,
            discountRate,
            subtotal: parseFloat(subtotal.toFixed(2)),
            tax: parseFloat(taxAmount.toFixed(2)),
            discount: parseFloat(discountAmount.toFixed(2)),
            total: parseFloat(total.toFixed(2)),
            items: invoiceItems,
            updated_at: new Date().toISOString()
        };
        
        console.log('Saving updated invoice:', updatedInvoice);
        
        // Try to save to API
        try {
            if (typeof apiService !== 'undefined' && typeof apiService.updateInvoice === 'function') {
                const result = await apiService.updateInvoice(invoiceId, updatedInvoice);
                console.log('Invoice updated successfully:', result);
                
                // Update local storage as well
                storeInvoiceInLocalStorage(updatedInvoice);
            } else {
                throw new Error('API service not available');
            }
        } catch (apiError) {
            console.warn('Error saving invoice to API, falling back to localStorage:', apiError);
            showToast('تم حفظ الفاتورة محليًا فقط. سيتم مزامنتها عند استعادة الاتصال.', 'warning');
            
            // Store in localStorage
            storeInvoiceInLocalStorage(updatedInvoice);
        }
        
        // Show success message
        showToast('تم حفظ الفاتورة بنجاح', 'success');
        
        // Redirect to invoices page
        setTimeout(() => {
            window.location.href = 'invoices.html';
        }, 1500);
        
    } catch (error) {
        console.error('Error saving invoice:', error);
        showToast(`حدث خطأ أثناء حفظ الفاتورة: ${error.message}`, 'error');
        
        // Reset save buttons
        const saveButtons = document.querySelectorAll('#saveInvoiceBtn');
        resetSaveButtons(saveButtons);
    }
}

// Reset save buttons to normal state
function resetSaveButtons(buttons) {
    buttons.forEach(btn => {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-save me-1"></i> حفظ الفاتورة';
    });
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
        rtl: true,
        preventDuplicates: true,
        newestOnTop: true,
        showEasing: 'swing',
        hideEasing: 'linear',
        showMethod: 'fadeIn',
        hideMethod: 'fadeOut'
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
