document.addEventListener('DOMContentLoaded', function () {
    const urlParams = new URLSearchParams(window.location.search);
    const isNewInvoice = urlParams.get('new') === 'true';
    const invoiceId = isNewInvoice ? null : getInvoiceIdFromUrl();
    const invoiceIdDisplay = document.getElementById('invoiceIdDisplay');
    const editInvoiceForm = document.getElementById('editInvoiceForm');
    const clientIdSelect = document.getElementById('clientId');
    const reportIdInput = document.getElementById('reportId');
    const invoiceDateInput = document.getElementById('invoiceDate');
    const paymentStatusSelect = document.getElementById('paymentStatus');
    const paymentMethodSelect = document.getElementById('paymentMethod');
    // const paymentDateInput = document.getElementById('paymentDate'); // Removed payment date field
    const invoiceItemsContainer = document.getElementById('invoiceItemsContainer');
    const addItemBtn = document.getElementById('addItemBtn');
    const subtotalAmountDisplay = document.getElementById('subtotalAmount');
    const discountInput = document.getElementById('discount');
    const taxRateInput = document.getElementById('taxRate');
    const taxAmountDisplay = document.getElementById('taxAmount');
    const totalAmountDisplay = document.getElementById('totalAmount');
    const updateInvoiceBtn = document.getElementById('updateInvoiceBtn');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const formContent = document.getElementById('formContent');
    const noItemsAlert = document.getElementById('noItemsAlert');

    let clients = []; // To store clients for the dropdown

    // Update page title and button text for new invoices
    if (isNewInvoice) {
        document.title = 'إنشاء فاتورة جديدة - Laapak Report System';
        if (invoiceIdDisplay) {
            invoiceIdDisplay.textContent = 'فاتورة جديدة';
        }
        if (updateInvoiceBtn) {
            updateInvoiceBtn.innerHTML = '<i class="fas fa-save me-2"></i> إنشاء الفاتورة';
        }
    } else if (invoiceIdDisplay && invoiceId) {
        invoiceIdDisplay.textContent = `#${invoiceId}`;
    }

    function getInvoiceIdFromUrl() {
        const params = new URLSearchParams(window.location.search);
        return params.get('id');
    }

    async function fetchClients() {
        try {
            // Get the admin or client token based on which one is available
            const token = localStorage.getItem('adminToken') || 
                         sessionStorage.getItem('adminToken') || 
                         localStorage.getItem('clientToken') || 
                         sessionStorage.getItem('clientToken');
                         
            if (!token) {
                throw new Error('No authentication token found');
            }
            
            const response = await fetch('https://reports.laapak.com/api/clients?all=true', {
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch clients');
            }
            
            const data = await response.json();
            clients = data.clients || data; // Handle different response formats
            populateClientDropdown();
        } catch (error) {
            console.error('Error fetching clients:', error);
            toastr.error('فشل في تحميل قائمة العملاء.');
        }
    }

    function populateClientDropdown() {
        clients.forEach(client => {
            const option = document.createElement('option');
            option.value = client.id;
            option.textContent = `${client.name} (${client.phone})`;
            clientIdSelect.appendChild(option);
        });
    }

    async function fetchInvoiceDetails() {
        if (!invoiceId) {
            toastr.error('رقم الفاتورة غير موجود.');
            loadingIndicator.innerHTML = '<p class="text-danger">رقم الفاتورة غير محدد في الرابط.</p>';
            return;
        }

        try {
            // Get the admin or client token based on which one is available
            const token = localStorage.getItem('adminToken') || 
                         sessionStorage.getItem('adminToken') || 
                         localStorage.getItem('clientToken') || 
                         sessionStorage.getItem('clientToken');
                         
            if (!token) {
                throw new Error('No authentication token found');
            }
            
            const response = await fetch(`https://reports.laapak.com/api/invoices/${invoiceId}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                }
            });
            
            if (!response.ok) {
                if (response.status === 404) {
                    toastr.error('الفاتورة غير موجودة.');
                    loadingIndicator.innerHTML = '<p class="text-danger">الفاتورة المطلوبة غير موجودة.</p>';
                } else if (response.status === 401) {
                    toastr.error('غير مصرح لك بالوصول لهذه الفاتورة.');
                    loadingIndicator.innerHTML = '<p class="text-danger">يرجى تسجيل الدخول للوصول إلى هذه الفاتورة.</p>';
                } else {
                    toastr.error('فشل في تحميل تفاصيل الفاتورة.');
                    loadingIndicator.innerHTML = '<p class="text-danger">حدث خطأ أثناء تحميل بيانات الفاتورة.</p>';
                }
                return;
            }
            
            const invoice = await response.json();
            populateForm(invoice);
            loadingIndicator.classList.add('d-none');
            formContent.classList.remove('d-none');
        } catch (error) {
            console.error('Error fetching invoice details:', error);
            toastr.error('فشل في تحميل تفاصيل الفاتورة.');
            loadingIndicator.innerHTML = '<p class="text-danger">حدث خطأ أثناء تحميل بيانات الفاتورة.</p>';
        }
    }

    function populateForm(invoice) {
        try {
            document.getElementById('invoiceId').value = invoice.id;
            clientIdSelect.value = invoice.client_id;
            
            // Handle report_id for existing invoices
            if (invoice.report_id) {
                if (reportIdInput) {
                    reportIdInput.value = invoice.report_id;
                }
                if (reportIdInput) {
                    reportIdInput.value = invoice.report_id;
                }
            } else if (invoice.report_ids && Array.isArray(invoice.report_ids)) {
                // Handle multiple reports for bulk invoices
                if (reportIdInput) {
                    reportIdInput.value = invoice.report_ids.join(', ');
                }
                
                // For bulk invoices, disable report selection since reports are pre-selected
                if (reportIdInput) {
                    reportIdInput.value = invoice.report_ids.join(', ');
                }
            } else {
                if (reportIdInput) {
                    reportIdInput.value = 'N/A';
                }
            }
            
            // Handle date formatting - check for different date formats
            let formattedDate = '';
            if (invoice.date) {
                if (typeof invoice.date === 'string') {
                    // Handle ISO date string
                    if (invoice.date.includes('T')) {
                        formattedDate = invoice.date.split('T')[0];
                    } else if (invoice.date.includes(' ')) {
                        // Handle date with time but no T
                        formattedDate = invoice.date.split(' ')[0];
                    } else {
                        // Assume it's already in YYYY-MM-DD format
                        formattedDate = invoice.date;
                    }
                } else {
                    // Handle Date object
                    const date = new Date(invoice.date);
                    formattedDate = date.toISOString().split('T')[0];
                }
            }
            invoiceDateInput.value = formattedDate;
            paymentStatusSelect.value = invoice.paymentStatus || 'pending';
            paymentMethodSelect.value = invoice.paymentMethod || '';
            // paymentDateInput.value = invoice.paymentDate ? invoice.paymentDate.split('T')[0] : ''; // Removed payment date field
            discountInput.value = parseFloat(invoice.discount || 0).toFixed(2);
            taxRateInput.value = parseFloat(invoice.taxRate || 14.00).toFixed(2);

            // Clear existing items
            invoiceItemsContainer.innerHTML = '';

            // Get invoice items from the correct property
            const items = invoice.InvoiceItems || invoice.items || [];
            
            if (items.length > 0) {
                items.forEach(item => {
                    addInvoiceItemRow({
                        description: item.description,
                        quantity: item.quantity || 1,
                        amount: parseFloat(item.amount).toFixed(2),
                        serialNumber: item.serialNumber || '',
                        type: item.type || 'standard',
                        report_id: item.report_id || ''
                    });
                });
                noItemsAlert.classList.add('d-none');
            } else {
                noItemsAlert.classList.remove('d-none');
            }
            
            calculateTotals();
        } catch (error) {
            console.error('Error populating form:', error);
            toastr.error('حدث خطأ أثناء تحميل بيانات الفاتورة.');
            loadingIndicator.innerHTML = '<p class="text-danger">حدث خطأ أثناء تحميل بيانات الفاتورة.</p>';
        }
    }

    function addInvoiceItemRow(item = {}) {
        const itemId = `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const itemRow = document.createElement('div');
        itemRow.classList.add('row', 'g-3', 'mb-3', 'p-3', 'border', 'rounded', 'invoice-item');
        itemRow.setAttribute('data-item-id', itemId);

        itemRow.innerHTML = `
            <div class="col-md-4">
                <label for="description-${itemId}" class="form-label">الوصف <span class="text-danger">*</span></label>
                <input type="text" class="form-control item-description" id="description-${itemId}" value="${item.description || ''}" required>
            </div>
            <div class="col-md-2">
                <label for="quantity-${itemId}" class="form-label">الكمية <span class="text-danger">*</span></label>
                <input type="number" class="form-control item-quantity" id="quantity-${itemId}" value="${item.quantity || 1}" min="1" required>
            </div>
            <div class="col-md-2">
                <label for="amount-${itemId}" class="form-label">السعر الوحدوي <span class="text-danger">*</span></label>
                <input type="number" class="form-control item-amount" id="amount-${itemId}" value="${parseFloat(item.amount || 0).toFixed(2)}" step="0.01" min="0" required>
            </div>
            <div class="col-md-2">
                <label for="item-type-${itemId}" class="form-label">نوع العنصر</label>
                <select class="form-control item-type" id="item-type-${itemId}">
                    <option value="standard" ${item.type === 'standard' ? 'selected' : ''}>عنصر عادي</option>
                    <option value="report" ${item.type === 'report' ? 'selected' : ''}>تقرير</option>
                    <option value="service" ${item.type === 'service' ? 'selected' : ''}>خدمة</option>
                    <option value="part" ${item.type === 'part' ? 'selected' : ''}>قطع غيار</option>
                </select>
            </div>
            <div class="col-md-2 d-flex align-items-end">
                <button type="button" class="btn btn-sm btn-danger removeItemBtn w-100">
                    <i class="fas fa-trash-alt me-1"></i> إزالة
                </button>
            </div>
            <div class="col-md-6 mt-2">
                <label for="serialNumber-${itemId}" class="form-label">الرقم التسلسلي (اختياري)</label>
                <input type="text" class="form-control item-serial" id="serialNumber-${itemId}" value="${item.serialNumber || ''}">
            </div>
            <div class="col-md-6 mt-2">
                <label for="report-id-${itemId}" class="form-label">معرف التقرير (إذا كان نوع التقرير)</label>
                <input type="text" class="form-control item-report-id" id="report-id-${itemId}" value="${item.report_id || ''}" placeholder="مثال: RPT10001">
            </div>
        `;
        invoiceItemsContainer.appendChild(itemRow);
        noItemsAlert.classList.add('d-none');

        // Add event listeners for the new item row
        const removeBtn = itemRow.querySelector('.removeItemBtn');
        removeBtn.addEventListener('click', function () {
            itemRow.remove();
            if (invoiceItemsContainer.children.length === 0) {
                noItemsAlert.classList.remove('d-none');
            }
            calculateTotals();
        });

        // Add event listeners for quantity and amount changes
        ['.item-quantity', '.item-amount'].forEach(selector => {
            itemRow.querySelector(selector).addEventListener('input', calculateTotals);
        });

        // Add event listener for item type change
        const itemTypeSelect = itemRow.querySelector('.item-type');
        const reportIdInput = itemRow.querySelector('.item-report-id');
        
        // Trigger initial visibility setup for existing items
        console.log('Setting up item row for type:', itemTypeSelect.value, 'with report_id:', item.report_id);
        
        // Add a small delay to ensure DOM is fully rendered
        setTimeout(() => {
            if (itemTypeSelect.value === 'report') {
                console.log('Item type is report, showing report ID field');
                reportIdInput.style.display = 'block';
                reportIdInput.parentElement.style.display = 'block';
                reportIdInput.required = false;
                
                // Add visual indicator if there's an existing report_id
                if (item.report_id) {
                    console.log('Found existing report_id:', item.report_id);
                    const existingReportIndicator = document.createElement('div');
                    existingReportIndicator.className = 'mt-1';
                    existingReportIndicator.innerHTML = `
                        <small class="text-success">
                            <i class="fas fa-check-circle me-1"></i>تم اختيار تقرير: ${item.report_id}
                        </small>
                    `;
                    reportIdInput.parentElement.appendChild(existingReportIndicator);
                    
                    // Add change report button
                    const changeReportBtn = document.createElement('button');
                    changeReportBtn.type = 'button';
                    changeReportBtn.className = 'btn btn-sm btn-outline-warning mt-1 change-report-btn';
                    changeReportBtn.innerHTML = '<i class="fas fa-edit me-1"></i>تغيير التقرير';
                    changeReportBtn.addEventListener('click', function() {
                        showReportSelectionModal(itemRow);
                    });
                    reportIdInput.parentElement.appendChild(changeReportBtn);
                } else {
                    console.log('No existing report_id, adding select button');
                    // Only add select report button if there's no existing report_id
                    if (!itemRow.querySelector('.select-report-btn')) {
                        const selectReportBtn = document.createElement('button');
                        selectReportBtn.type = 'button';
                        selectReportBtn.className = 'btn btn-sm btn-outline-info mt-1 select-report-btn';
                        selectReportBtn.innerHTML = '<i class="fas fa-search me-1"></i>اختيار تقرير';
                        selectReportBtn.addEventListener('click', function() {
                            showReportSelectionModal(itemRow);
                        });
                        reportIdInput.parentElement.appendChild(selectReportBtn);
                    }
                }
            } else {
                console.log('Item type is not report, hiding report ID field');
                // Only hide the input field, not the parent container
                reportIdInput.style.display = 'none';
                reportIdInput.required = false;
            }
        }, 100);
        
        itemTypeSelect.addEventListener('change', function() {
            if (this.value === 'report') {
                reportIdInput.style.display = 'block';
                reportIdInput.parentElement.style.display = 'block';
                reportIdInput.required = false;
                
                // Only add select report button if there's no existing report_id
                if (!itemRow.querySelector('.select-report-btn') && !item.report_id) {
                    const selectReportBtn = document.createElement('button');
                    selectReportBtn.type = 'button';
                    selectReportBtn.className = 'btn btn-sm btn-outline-info mt-1 select-report-btn';
                    selectReportBtn.innerHTML = '<i class="fas fa-search me-1"></i>اختيار تقرير';
                    selectReportBtn.addEventListener('click', function() {
                        showReportSelectionModal(itemRow);
                    });
                    reportIdInput.parentElement.appendChild(selectReportBtn);
                }
            } else {
                reportIdInput.style.display = 'none';
                reportIdInput.required = false;
                reportIdInput.value = '';
                
                // Remove the select report button
                const selectReportBtn = itemRow.querySelector('.select-report-btn');
                if (selectReportBtn) {
                    selectReportBtn.remove();
                }
                
                // Remove the change report button
                const changeReportBtn = itemRow.querySelector('.change-report-btn');
                if (changeReportBtn) {
                    changeReportBtn.remove();
                }
                
                // Remove the existing report indicator
                const existingIndicator = itemRow.querySelector('.text-success');
                if (existingIndicator) {
                    existingIndicator.remove();
                }
            }
        });

        calculateTotals(); // Initial calculation for new row
    }

    function calculateTotals() {
        let subtotal = 0;
        const items = invoiceItemsContainer.querySelectorAll('.invoice-item');
        items.forEach(itemRow => {
            const quantity = parseFloat(itemRow.querySelector('.item-quantity').value) || 0;
            const amount = parseFloat(itemRow.querySelector('.item-amount').value) || 0;
            subtotal += quantity * amount;
        });

        const discount = parseFloat(discountInput.value) || 0;
        const taxRate = parseFloat(taxRateInput.value) || 0;

        const subtotalAfterDiscount = subtotal - discount;
        const tax = subtotalAfterDiscount * (taxRate / 100);
        const total = subtotalAfterDiscount + tax;

        subtotalAmountDisplay.textContent = `${subtotal.toFixed(2)} جنيه`;
        taxAmountDisplay.textContent = `${tax.toFixed(2)} جنيه`;
        totalAmountDisplay.textContent = `${total.toFixed(2)} جنيه`;
    }

    addItemBtn.addEventListener('click', () => addInvoiceItemRow());
    discountInput.addEventListener('input', calculateTotals);
    taxRateInput.addEventListener('input', calculateTotals);
    
    // Add event listener for date input to ensure it's properly handled
    invoiceDateInput.addEventListener('change', function() {
        console.log('Date input changed to:', this.value);
        console.log('Date input type:', typeof this.value);
        console.log('Date input validity:', this.validity.valid);
    });
    
    // Also listen for input events to catch all changes
    invoiceDateInput.addEventListener('input', function() {
        console.log('Date input event - value:', this.value);
    });

    editInvoiceForm.addEventListener('submit', async function (event) {
        event.preventDefault();
        updateInvoiceBtn.disabled = true;
        updateInvoiceBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> جاري التحديث...';

        // Get the selected report ID from the dropdown if available
        let selectedReportId = null;
        if (reportIdInput && reportIdInput.value && reportIdInput.value !== 'N/A') {
            selectedReportId = reportIdInput.value;
        }

        // Ensure date is properly formatted
        let formattedInvoiceDate = '';
        if (invoiceDateInput.value && invoiceDateInput.value.trim() !== '') {
            const date = new Date(invoiceDateInput.value);
            if (!isNaN(date.getTime())) {
                formattedInvoiceDate = date.toISOString().split('T')[0];
            } else {
                // If invalid date, use current date as fallback
                formattedInvoiceDate = new Date().toISOString().split('T')[0];
                console.warn('Invalid date provided, using current date as fallback');
            }
        } else {
            // If no date provided, use current date
            formattedInvoiceDate = new Date().toISOString().split('T')[0];
            console.warn('No date provided, using current date as fallback');
        }

        const invoiceData = {
            id: document.getElementById('invoiceId').value,
            client_id: clientIdSelect.value,
            report_id: selectedReportId, // Use the selected report ID
            date: formattedInvoiceDate,
            paymentStatus: paymentStatusSelect.value,
            paymentMethod: paymentMethodSelect.value || null,
            paymentDate: null, // Removed payment date field - always null
            discount: parseFloat(discountInput.value).toFixed(2),
            taxRate: parseFloat(taxRateInput.value).toFixed(2),
            items: []
        };

        // Handle report_ids for new invoices (multiple reports)
        if (isNewInvoice && selectedReportId) {
            const reportIds = selectedReportId.split(',').map(id => id.trim()).filter(id => id);
            invoiceData.report_ids = reportIds;
        }

        const itemRows = invoiceItemsContainer.querySelectorAll('.invoice-item');
        itemRows.forEach(row => {
            const itemType = row.querySelector('.item-type').value;
            const itemData = {
                description: row.querySelector('.item-description').value,
                quantity: parseInt(row.querySelector('.item-quantity').value),
                amount: parseFloat(row.querySelector('.item-amount').value).toFixed(2),
                serialNumber: row.querySelector('.item-serial').value || null,
                type: itemType, // Include the item type
                report_id: row.querySelector('.item-report-id').value || null
            };

            invoiceData.items.push(itemData);
        });
        
        // Recalculate final amounts based on items and form values
        let currentSubtotal = 0;
        invoiceData.items.forEach(item => {
            currentSubtotal += item.quantity * item.amount;
        });
        invoiceData.subtotal = currentSubtotal.toFixed(2);
        const currentDiscount = parseFloat(invoiceData.discount);
        const subtotalAfterDiscount = currentSubtotal - currentDiscount;
        const currentTax = subtotalAfterDiscount * (parseFloat(invoiceData.taxRate) / 100);
        invoiceData.tax = currentTax.toFixed(2);
        invoiceData.total = (subtotalAfterDiscount + currentTax).toFixed(2);

        try {
            // Debug: Log the invoice data being sent
            console.log('Invoice data being sent:', invoiceData);
            console.log('Original date input value:', invoiceDateInput.value);
            console.log('Formatted date:', formattedInvoiceDate);
            
            // Get the admin or client token based on which one is available
            const token = localStorage.getItem('adminToken') || 
                         sessionStorage.getItem('adminToken') || 
                         localStorage.getItem('clientToken') || 
                         sessionStorage.getItem('clientToken');
                         
            if (!token) {
                throw new Error('No authentication token found');
            }
            
            // Determine if this is a bulk invoice (multiple reports)
            const isBulkInvoice = invoiceData.report_ids && Array.isArray(invoiceData.report_ids) && invoiceData.report_ids.length > 1;
            
            let url, method;
            
            if (isNewInvoice) {
                if (isBulkInvoice) {
                    // Use bulk invoice endpoint for multiple reports
                    url = 'https://reports.laapak.com/api/invoices/bulk';
                    // Convert report_ids to reportIds for bulk endpoint
                    invoiceData.reportIds = invoiceData.report_ids;
                    delete invoiceData.report_ids;
                } else {
                    // Use regular invoice endpoint for single report
                    url = 'https://reports.laapak.com/api/invoices';
                }
                method = 'POST';
            } else {
                url = `https://reports.laapak.com/api/invoices/${invoiceData.id}`;
                method = 'PUT';
            }
            
            // Debug: Log the final request data
            console.log('Final request URL:', url);
            console.log('Final request method:', method);
            console.log('Final request body:', JSON.stringify(invoiceData, null, 2));
            
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify(invoiceData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || (isNewInvoice ? 'فشل في إنشاء الفاتورة.' : 'فشل في تحديث الفاتورة.'));
            }

            const result = await response.json();
            const successMessage = isNewInvoice ? 'تم إنشاء الفاتورة بنجاح!' : 'تم تحديث الفاتورة بنجاح!';
            toastr.success(successMessage);
            
            setTimeout(() => {
                const invoiceId = result.id || invoiceData.id;
                window.location.href = `view-invoice.html?id=${invoiceId}`; // Redirect to view invoice page
            }, 1000);

        } catch (error) {
            console.error('Error updating invoice:', error);
            toastr.error(error.message || 'حدث خطأ أثناء تحديث الفاتورة.');
        } finally {
            updateInvoiceBtn.disabled = false;
            const buttonText = isNewInvoice ? 'إنشاء الفاتورة' : 'تحديث الفاتورة';
            updateInvoiceBtn.innerHTML = `<i class="fas fa-save me-2"></i> ${buttonText}`;
        }
    });

    // Initial setup
    fetchClients().then(() => { // Ensure clients are loaded before fetching invoice details
        if (isNewInvoice) {
            loadNewInvoiceData();
        } else {
        fetchInvoiceDetails();
        }
    });

    function loadNewInvoiceData() {
        try {
            const newInvoiceData = localStorage.getItem('lpk_new_invoice_data');
            if (!newInvoiceData) {
                toastr.error('لم يتم العثور على بيانات الفاتورة الجديدة.');
                loadingIndicator.innerHTML = '<p class="text-danger">لم يتم العثور على بيانات الفاتورة الجديدة.</p>';
                return;
            }

            const invoice = JSON.parse(newInvoiceData);
            populateForm(invoice);
            loadingIndicator.classList.add('d-none');
            formContent.classList.remove('d-none');
            
            // Clear the localStorage data after loading
            localStorage.removeItem('lpk_new_invoice_data');
        } catch (error) {
            console.error('Error loading new invoice data:', error);
            toastr.error('فشل في تحميل بيانات الفاتورة الجديدة.');
            loadingIndicator.innerHTML = '<p class="text-danger">حدث خطأ أثناء تحميل بيانات الفاتورة الجديدة.</p>';
        }
    }

    /**
     * Show report selection modal for choosing reports
     * @param {HTMLElement} itemRow - The item row to update
     */
    function showReportSelectionModal(itemRow) {
        // Create modal HTML
        const modalHtml = `
            <div class="modal fade" id="reportSelectionModal" tabindex="-1" aria-labelledby="reportSelectionModalLabel" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="reportSelectionModalLabel">اختيار تقرير</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <div class="mb-3">
                                <input type="text" class="form-control" id="reportSearchInput" placeholder="البحث في التقارير...">
                            </div>
                            <div class="table-responsive" style="max-height: 400px;">
                                <table class="table table-hover">
                                    <thead class="table-light sticky-top">
                                        <tr>
                                            <th>معرف التقرير</th>
                                            <th>العميل</th>
                                            <th>الجهاز</th>
                                            <th>الحالة</th>
                                            <th>الإجراء</th>
                                        </tr>
                                    </thead>
                                    <tbody id="reportSelectionTableBody">
                                        <tr>
                                            <td colspan="5" class="text-center">جاري التحميل...</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">إلغاء</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add modal to body if it doesn't exist
        if (!document.getElementById('reportSelectionModal')) {
            document.body.insertAdjacentHTML('beforeend', modalHtml);
        }

        // Load reports for selection
        loadReportsForSelection(itemRow);

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('reportSelectionModal'));
        modal.show();
    }

    /**
     * Load reports for selection in the modal
     * @param {HTMLElement} itemRow - The item row to update
     */
    async function loadReportsForSelection(itemRow) {
        try {
            const tableBody = document.getElementById('reportSelectionTableBody');
            tableBody.innerHTML = '<tr><td colspan="5" class="text-center">جاري التحميل...</td></tr>';

            // Get auth token
            const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
            if (!token) {
                throw new Error('No authentication token found');
            }

            // Fetch all reports
            const response = await fetch('https://reports.laapak.com/api/reports?fetch_mode=all_reports', {
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch reports');
            }

            const data = await response.json();
            const reports = Array.isArray(data) ? data : (data.reports || []);

            // Filter out reports that already have invoices
            const availableReports = reports.filter(report => {
                const hasInvoiceId = report.invoice_id && report.invoice_id !== null;
                const hasInvoice = report.invoice && report.invoice !== null;
                const hasInvoices = report.invoices && Array.isArray(report.invoices) && report.invoices.length > 0;
                const hasInvoiceCreated = report.invoice_created === true;
                
                return !hasInvoiceId && !hasInvoice && !hasInvoices && !hasInvoiceCreated;
            });

            // Populate table
            if (availableReports.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="5" class="text-center">لا توجد تقارير متاحة</td></tr>';
                return;
            }

            tableBody.innerHTML = availableReports.map(report => `
                <tr>
                    <td>${report.id}</td>
                    <td>${report.client_name || 'غير محدد'}</td>
                    <td>${report.device_model || 'غير محدد'}</td>
                    <td><span class="badge bg-${getStatusBadgeColor(report.status)}">${report.status || 'قيد الانتظار'}</span></td>
                    <td>
                        <button type="button" class="btn btn-sm btn-primary select-report-btn" 
                                data-report-id="${report.id}" 
                                data-report-description="${report.device_model || 'جهاز'} (${report.id})"
                                data-report-amount="${report.amount || 0}">
                            اختيار
                        </button>
                    </td>
                </tr>
            `).join('');

            // Add event listeners for report selection
            tableBody.querySelectorAll('.select-report-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const reportId = this.dataset.reportId;
                    const reportDescription = this.dataset.reportDescription;
                    const reportAmount = parseFloat(this.dataset.reportAmount) || 0;

                    // Update the item row
                    const descriptionInput = itemRow.querySelector('.item-description');
                    const amountInput = itemRow.querySelector('.item-amount');
                    const reportIdInput = itemRow.querySelector('.item-report-id');

                    if (descriptionInput) descriptionInput.value = reportDescription;
                    if (amountInput) amountInput.value = reportAmount.toFixed(2);
                    if (reportIdInput) reportIdInput.value = reportId;

                    // Close modal
                    const modal = bootstrap.Modal.getInstance(document.getElementById('reportSelectionModal'));
                    modal.hide();

                    // Recalculate totals
                    calculateTotals();

                    // Show success message
                    toastr.success('تم اختيار التقرير بنجاح');
                });
            });

            // Add search functionality
            const searchInput = document.getElementById('reportSearchInput');
            if (searchInput) {
                searchInput.addEventListener('input', function() {
                    const searchTerm = this.value.toLowerCase();
                    const rows = tableBody.querySelectorAll('tr');
                    
                    rows.forEach(row => {
                        const text = row.textContent.toLowerCase();
                        row.style.display = text.includes(searchTerm) ? '' : 'none';
                    });
                });
            }

        } catch (error) {
            console.error('Error loading reports for selection:', error);
            const tableBody = document.getElementById('reportSelectionTableBody');
            tableBody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">حدث خطأ أثناء تحميل التقارير</td></tr>';
        }
    }

    /**
     * Get badge color for report status
     * @param {string} status - Report status
     * @returns {string} Bootstrap badge color class
     */
    function getStatusBadgeColor(status) {
        if (!status) return 'secondary';
        
        const statusLower = status.toLowerCase();
        switch (statusLower) {
            case 'completed':
            case 'مكتمل':
                return 'success';
            case 'pending':
            case 'قيد الانتظار':
                return 'warning';
            case 'cancelled':
            case 'canceled':
            case 'ملغي':
                return 'danger';
            case 'in-progress':
            case 'قيد المعالجة':
                return 'info';
            default:
                return 'secondary';
        }
    }
});