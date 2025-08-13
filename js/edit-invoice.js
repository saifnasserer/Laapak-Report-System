document.addEventListener('DOMContentLoaded', function () {
    const urlParams = new URLSearchParams(window.location.search);
    const isNewInvoice = urlParams.get('new') === 'true';
    const invoiceId = isNewInvoice ? null : getInvoiceIdFromUrl();
    const invoiceIdDisplay = document.getElementById('invoiceIdDisplay');
    const editInvoiceForm = document.getElementById('editInvoiceForm');
    const clientIdSelect = document.getElementById('clientId');
    const reportIdInput = document.getElementById('reportId');
    const reportSelect = document.getElementById('reportSelect'); // New report select dropdown
    const invoiceDateInput = document.getElementById('invoiceDate');
    const paymentStatusSelect = document.getElementById('paymentStatus');
    const paymentMethodSelect = document.getElementById('paymentMethod');
    const paymentDateInput = document.getElementById('paymentDate');
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
    let reports = []; // To store reports for the dropdown

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

    async function fetchReports() {
        try {
            // Get the admin or client token based on which one is available
            const token = localStorage.getItem('adminToken') || 
                         sessionStorage.getItem('adminToken') || 
                         localStorage.getItem('clientToken') || 
                         sessionStorage.getItem('clientToken');
                         
            if (!token) {
                throw new Error('No authentication token found');
            }
            
            // Fetch reports that are not linked to invoices
            const response = await fetch('https://reports.laapak.com/api/reports?limit=1000&sort=desc', {
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch reports');
            }
            
            const data = await response.json();
            reports = data.reports || data; // Handle different response formats
            
            // Filter out reports that are already linked to invoices
            const availableReports = reports.filter(report => {
                // Check if report has any invoice association
                const hasInvoiceId = report.invoice_id && report.invoice_id !== null;
                const hasInvoice = report.invoice && report.invoice !== null;
                const hasInvoices = report.invoices && Array.isArray(report.invoices) && report.invoices.length > 0;
                
                // Report is available if it has NO invoice associations
                return !hasInvoiceId && !hasInvoice && !hasInvoices;
            });
            
            console.log(`Total reports: ${reports.length}, Available reports: ${availableReports.length}`);
            
            populateReportDropdown(availableReports);
        } catch (error) {
            console.error('Error fetching reports:', error);
            toastr.error('فشل في تحميل قائمة التقارير.');
        }
    }

    async function fetchReportsForClient(clientId) {
        try {
            // Get the admin or client token based on which one is available
            const token = localStorage.getItem('adminToken') || 
                         sessionStorage.getItem('adminToken') || 
                         localStorage.getItem('clientToken') || 
                         sessionStorage.getItem('clientToken');
                         
            if (!token) {
                throw new Error('No authentication token found');
            }
            
            // Fetch reports for the specific client that are not linked to invoices
            const response = await fetch(`https://reports.laapak.com/api/reports?limit=1000&sort=desc&clientId=${clientId}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch reports');
            }
            
            const data = await response.json();
            const clientReports = data.reports || data; // Handle different response formats
            
            // Filter out reports that are already linked to invoices
            const availableReports = clientReports.filter(report => {
                // Check if report has any invoice association
                const hasInvoiceId = report.invoice_id && report.invoice_id !== null;
                const hasInvoice = report.invoice && report.invoice !== null;
                const hasInvoices = report.invoices && Array.isArray(report.invoices) && report.invoices.length > 0;
                
                // Report is available if it has NO invoice associations
                return !hasInvoiceId && !hasInvoice && !hasInvoices;
            });
            
            console.log(`Client reports: ${clientReports.length}, Available reports: ${availableReports.length}`);
            
            populateReportDropdown(availableReports);
        } catch (error) {
            console.error('Error fetching client reports:', error);
            toastr.error('فشل في تحميل تقارير العميل.');
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

    function populateReportDropdown(availableReports) {
        if (!reportSelect) return;
        
        // Clear existing options except the first one
        while (reportSelect.children.length > 1) {
            reportSelect.removeChild(reportSelect.lastChild);
        }
        
        console.log('Populating report dropdown with:', availableReports.length, 'reports');
        
        // Add available reports
        availableReports.forEach(report => {
            const option = document.createElement('option');
            option.value = report.id;
            
            // Create a more descriptive text
            const clientName = report.client_name || report.client?.name || 'غير معروف';
            const deviceModel = report.device_model || 'غير محدد';
            const orderNumber = report.order_number || '';
            const status = report.status || 'قيد الانتظار';
            
            option.textContent = `#${report.id} - ${clientName} - ${deviceModel}${orderNumber ? ` (${orderNumber})` : ''} - ${status}`;
            reportSelect.appendChild(option);
        });
        
        // If no reports available, show a message
        if (availableReports.length === 0) {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'لا توجد تقارير متاحة للربط (جميع التقارير مرتبطة بفواتير)';
            option.disabled = true;
            reportSelect.appendChild(option);
            
            // Also show a toast notification
            toastr.info('جميع التقارير مرتبطة بفواتير بالفعل. لا توجد تقارير متاحة للربط.');
        } else {
            // Show success message
            toastr.success(`تم تحميل ${availableReports.length} تقرير متاح للربط`);
        }
    }

    // Add event listener for client selection
    if (clientIdSelect) {
        clientIdSelect.addEventListener('change', function() {
            const selectedClientId = this.value;
            if (selectedClientId && !reportSelect.disabled) {
                // Load reports for the selected client
                fetchReportsForClient(selectedClientId);
            }
        });
    }

    // Add event listener for report selection
    if (reportSelect) {
        reportSelect.addEventListener('change', function() {
            const selectedReportId = this.value;
            if (selectedReportId) {
                // Update the report ID input field
                if (reportIdInput) {
                    reportIdInput.value = selectedReportId;
                }
                
                // Optionally, you can also auto-populate some fields from the selected report
                const selectedReport = reports.find(r => r.id == selectedReportId);
                if (selectedReport) {
                    // Auto-populate client if not already selected
                    if (clientIdSelect && !clientIdSelect.value) {
                        clientIdSelect.value = selectedReport.client_id;
                    }
                    
                    // Auto-populate device information in invoice items if no items exist
                    if (invoiceItemsContainer.children.length === 0) {
                        addInvoiceItemRow({
                            description: `تقرير فحص - ${selectedReport.device_model || 'جهاز'}`,
                            type: 'service',
                            quantity: 1,
                            amount: selectedReport.amount || 250,
                            serialNumber: selectedReport.serial_number || ''
                        });
                    }
                }
            }
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
                if (reportSelect) {
                    reportSelect.value = invoice.report_id;
                    // Freeze the report selection field since invoice is already linked
                    reportSelect.disabled = true;
                    reportSelect.style.backgroundColor = '#f8f9fa';
                    reportSelect.style.cursor = 'not-allowed';
                    
                    // Add a visual indicator that the field is frozen
                    const reportSelectContainer = reportSelect.parentElement;
                    if (reportSelectContainer) {
                        const frozenIndicator = document.createElement('small');
                        frozenIndicator.className = 'text-muted mt-1 d-block';
                        frozenIndicator.innerHTML = '<i class="fas fa-lock me-1"></i> الفاتورة مرتبطة بتقرير - لا يمكن تغيير الربط';
                        reportSelectContainer.appendChild(frozenIndicator);
                    }
                }
            } else if (invoice.report_ids && Array.isArray(invoice.report_ids)) {
                // Handle multiple reports for new invoices
                if (reportIdInput) {
                    reportIdInput.value = invoice.report_ids.join(', ');
                }
                // Load reports for the selected client
                fetchReportsForClient(invoice.client_id);
            } else {
                if (reportIdInput) {
                    reportIdInput.value = 'N/A';
                }
                if (reportSelect) {
                    reportSelect.value = '';
                }
                // Load reports for the selected client
                fetchReportsForClient(invoice.client_id);
            }
            
            invoiceDateInput.value = invoice.date ? invoice.date.split('T')[0] : '';
            paymentStatusSelect.value = invoice.paymentStatus || 'pending';
            paymentMethodSelect.value = invoice.paymentMethod || '';
            paymentDateInput.value = invoice.paymentDate ? invoice.paymentDate.split('T')[0] : '';
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
                        serialNumber: item.serialNumber || ''
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
            <div class="col-md-5">
                <label for="description-${itemId}" class="form-label">الوصف <span class="text-danger">*</span></label>
                <input type="text" class="form-control item-description" id="description-${itemId}" value="${item.description || ''}" required>
            </div>
            <div class="col-md-2">
                <label for="quantity-${itemId}" class="form-label">الكمية <span class="text-danger">*</span></label>
                <input type="number" class="form-control item-quantity" id="quantity-${itemId}" value="${item.quantity || 1}" min="1" required>
            </div>
            <div class="col-md-3">
                <label for="amount-${itemId}" class="form-label">السعر الوحدوي <span class="text-danger">*</span></label>
                <input type="number" class="form-control item-amount" id="amount-${itemId}" value="${parseFloat(item.amount || 0).toFixed(2)}" step="0.01" min="0" required>
            </div>
             <div class="col-md-2 d-flex align-items-end">
                <button type="button" class="btn btn-sm btn-danger removeItemBtn w-100">
                    <i class="fas fa-trash-alt me-1"></i> إزالة
                </button>
            </div>
            <div class="col-md-12 mt-2">
                <label for="serialNumber-${itemId}" class="form-label">الرقم التسلسلي (اختياري)</label>
                <input type="text" class="form-control item-serial" id="serialNumber-${itemId}" value="${item.serialNumber || ''}">
            </div>
        `;
        invoiceItemsContainer.appendChild(itemRow);
        noItemsAlert.classList.add('d-none');

        itemRow.querySelector('.removeItemBtn').addEventListener('click', function () {
            itemRow.remove();
            if (invoiceItemsContainer.children.length === 0) {
                noItemsAlert.classList.remove('d-none');
            }
            calculateTotals();
        });

        ['.item-quantity', '.item-amount'].forEach(selector => {
            itemRow.querySelector(selector).addEventListener('input', calculateTotals);
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

    editInvoiceForm.addEventListener('submit', async function (event) {
        event.preventDefault();
        updateInvoiceBtn.disabled = true;
        updateInvoiceBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> جاري التحديث...';

        // Get the selected report ID from the dropdown if available
        let selectedReportId = null;
        if (reportSelect && reportSelect.value) {
            selectedReportId = reportSelect.value;
        } else if (reportIdInput && reportIdInput.value && reportIdInput.value !== 'N/A') {
            selectedReportId = reportIdInput.value;
        }

        const invoiceData = {
            id: document.getElementById('invoiceId').value,
            client_id: clientIdSelect.value,
            report_id: selectedReportId, // Use the selected report ID
            date: invoiceDateInput.value,
            paymentStatus: paymentStatusSelect.value,
            paymentMethod: paymentMethodSelect.value || null,
            paymentDate: paymentDateInput.value || null,
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
            invoiceData.items.push({
                description: row.querySelector('.item-description').value,
                quantity: parseInt(row.querySelector('.item-quantity').value),
                amount: parseFloat(row.querySelector('.item-amount').value).toFixed(2),
                serialNumber: row.querySelector('.item-serial').value || null
            });
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
            // Get the admin or client token based on which one is available
            const token = localStorage.getItem('adminToken') || 
                         sessionStorage.getItem('adminToken') || 
                         localStorage.getItem('clientToken') || 
                         sessionStorage.getItem('clientToken');
                         
            if (!token) {
                throw new Error('No authentication token found');
            }
            
            const url = isNewInvoice ? 
                'https://reports.laapak.com/api/invoices' : 
                `https://reports.laapak.com/api/invoices/${invoiceData.id}`;
            
            const method = isNewInvoice ? 'POST' : 'PUT';
            
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
            
            // Load reports for the client if available
            if (invoice.client_id) {
                fetchReportsForClient(invoice.client_id);
            }
            
            // Clear the localStorage data after loading
            localStorage.removeItem('lpk_new_invoice_data');
        } catch (error) {
            console.error('Error loading new invoice data:', error);
            toastr.error('فشل في تحميل بيانات الفاتورة الجديدة.');
            loadingIndicator.innerHTML = '<p class="text-danger">حدث خطأ أثناء تحميل بيانات الفاتورة الجديدة.</p>';
        }
    }
});