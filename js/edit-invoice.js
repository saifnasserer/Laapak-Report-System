document.addEventListener('DOMContentLoaded', function () {
    const invoiceId = getInvoiceIdFromUrl();
    const mode = getModeFromUrl();
    const invoiceIdDisplay = document.getElementById('invoiceIdDisplay');
    const editInvoiceForm = document.getElementById('editInvoiceForm');
    const clientIdSelect = document.getElementById('clientId');
    const reportIdInput = document.getElementById('reportId');
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
    let isCreateMode = mode === 'create';

    // Update page title and button text based on mode
    if (isCreateMode) {
        document.title = 'إنشاء فاتورة جديدة - نظام التقارير';
        if (invoiceIdDisplay) {
            invoiceIdDisplay.textContent = 'فاتورة جديدة';
        }
        if (updateInvoiceBtn) {
            updateInvoiceBtn.innerHTML = '<i class="fas fa-plus me-2"></i> إنشاء الفاتورة';
        }
        
        // Add back button for create mode
        const backButton = document.createElement('button');
        backButton.type = 'button';
        backButton.className = 'btn btn-outline-secondary me-2';
        backButton.innerHTML = '<i class="fas fa-arrow-right me-2"></i> العودة لاختيار التقارير';
        backButton.onclick = function() {
            if (confirm('هل أنت متأكد من العودة؟ سيتم فقدان البيانات المدخلة.')) {
                localStorage.removeItem('lpk_new_invoice_data');
                window.location.href = 'create-invoice.html';
            }
        };
        
        // Insert back button before the form
        const formContainer = document.querySelector('.container');
        if (formContainer) {
            const firstRow = formContainer.querySelector('.row');
            if (firstRow) {
                firstRow.insertBefore(backButton, firstRow.firstChild);
            }
        }
    } else if (invoiceIdDisplay && invoiceId) {
        invoiceIdDisplay.textContent = `#${invoiceId}`;
    }

    function getInvoiceIdFromUrl() {
        const params = new URLSearchParams(window.location.search);
        return params.get('id');
    }

    function getModeFromUrl() {
        const params = new URLSearchParams(window.location.search);
        return params.get('mode');
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
            reportIdInput.value = invoice.report_id || 'N/A';
            invoiceDateInput.value = invoice.date ? invoice.date.split('T')[0] : '';
            paymentStatusSelect.value = invoice.paymentStatus;
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
                        type: item.type,
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
            <div class="col-md-4">
                <label for="description-${itemId}" class="form-label">الوصف <span class="text-danger">*</span></label>
                <input type="text" class="form-control item-description" id="description-${itemId}" value="${item.description || ''}" required>
            </div>
            <div class="col-md-2">
                <label for="type-${itemId}" class="form-label">النوع <span class="text-danger">*</span></label>
                <select class="form-select item-type" id="type-${itemId}" required>
                    <option value="item" ${item.type === 'item' ? 'selected' : ''}>قطعة</option>
                    <option value="service" ${item.type === 'service' ? 'selected' : ''}>خدمة</option>
                    <option value="laptop" ${item.type === 'laptop' ? 'selected' : ''}>جهاز</option>
                </select>
            </div>
            <div class="col-md-2">
                <label for="quantity-${itemId}" class="form-label">الكمية <span class="text-danger">*</span></label>
                <input type="number" class="form-control item-quantity" id="quantity-${itemId}" value="${item.quantity || 1}" min="1" required>
            </div>
            <div class="col-md-2">
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
        
        const isCreateMode = mode === 'create';
        const buttonText = isCreateMode ? 'إنشاء الفاتورة' : 'تحديث الفاتورة';
        const loadingText = isCreateMode ? 'جاري الإنشاء...' : 'جاري التحديث...';
        
        updateInvoiceBtn.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> ${loadingText}`;

        const invoiceData = {
            client_id: clientIdSelect.value,
            report_id: reportIdInput.value === 'N/A' ? null : reportIdInput.value,
            date: invoiceDateInput.value,
            paymentStatus: paymentStatusSelect.value,
            paymentMethod: paymentMethodSelect.value || null,
            paymentDate: paymentDateInput.value || null,
            discount: parseFloat(discountInput.value).toFixed(2),
            taxRate: parseFloat(taxRateInput.value).toFixed(2),
            items: []
        };

        // Add report_ids for create mode
        if (isCreateMode) {
            const storedData = localStorage.getItem('lpk_new_invoice_data');
            if (storedData) {
                const createData = JSON.parse(storedData);
                invoiceData.report_ids = createData.report_ids || [];
            }
        } else {
            // For edit mode, include the invoice ID
            invoiceData.id = document.getElementById('invoiceId').value;
        }

        const itemRows = invoiceItemsContainer.querySelectorAll('.invoice-item');
        itemRows.forEach(row => {
            invoiceData.items.push({
                description: row.querySelector('.item-description').value,
                type: row.querySelector('.item-type').value,
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
            
            let response;
            if (isCreateMode) {
                // Create new invoice
                response = await fetch('https://reports.laapak.com/api/invoices', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-auth-token': token
                    },
                    body: JSON.stringify(invoiceData)
                });
            } else {
                // Update existing invoice
                response = await fetch(`https://reports.laapak.com/api/invoices/${invoiceData.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-auth-token': token
                    },
                    body: JSON.stringify(invoiceData)
                });
            }

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `فشل في ${isCreateMode ? 'إنشاء' : 'تحديث'} الفاتورة.`);
            }

            const result = await response.json();
            
            // Clear localStorage data if in create mode
            if (isCreateMode) {
                localStorage.removeItem('lpk_new_invoice_data');
            }

            toastr.success(`تم ${isCreateMode ? 'إنشاء' : 'تحديث'} الفاتورة بنجاح!`);
            
            setTimeout(() => {
                // Redirect to view invoice page
                const invoiceId = isCreateMode ? result.id : invoiceData.id;
                window.location.href = `view-invoice.html?id=${invoiceId}`;
            }, 1000);

        } catch (error) {
            console.error(`Error ${isCreateMode ? 'creating' : 'updating'} invoice:`, error);
            toastr.error(error.message || `حدث خطأ أثناء ${isCreateMode ? 'إنشاء' : 'تحديث'} الفاتورة.`);
        } finally {
            updateInvoiceBtn.disabled = false;
            updateInvoiceBtn.innerHTML = `<i class="fas fa-${isCreateMode ? 'plus' : 'save'} me-2"></i> ${buttonText}`;
        }
    });

    // Initial setup
    fetchClients().then(() => { // Ensure clients are loaded before fetching invoice details
        if (isCreateMode) {
            loadCreateModeData();
        } else {
            fetchInvoiceDetails();
        }
    });

    async function loadCreateModeData() {
        try {
            // Get invoice data from localStorage
            const storedData = localStorage.getItem('lpk_new_invoice_data');
            if (!storedData) {
                toastr.error('لم يتم العثور على بيانات الفاتورة. الرجاء العودة إلى صفحة إنشاء الفاتورة.');
                loadingIndicator.innerHTML = '<p class="text-danger">لم يتم العثور على بيانات الفاتورة.</p>';
                return;
            }

            const invoiceData = JSON.parse(storedData);
            console.log('Loading create mode data:', invoiceData);

            // Validate required data
            if (!invoiceData.client_id) {
                toastr.error('معرف العميل مفقود من بيانات الفاتورة.');
                loadingIndicator.innerHTML = '<p class="text-danger">معرف العميل مفقود من بيانات الفاتورة.</p>';
                return;
            }

            if (!invoiceData.report_ids || !Array.isArray(invoiceData.report_ids) || invoiceData.report_ids.length === 0) {
                toastr.error('لم يتم تحديد أي تقارير للفاتورة.');
                loadingIndicator.innerHTML = '<p class="text-danger">لم يتم تحديد أي تقارير للفاتورة.</p>';
                return;
            }

            if (!invoiceData.items || !Array.isArray(invoiceData.items) || invoiceData.items.length === 0) {
                toastr.error('لم يتم تحديد أي عناصر للفاتورة.');
                loadingIndicator.innerHTML = '<p class="text-danger">لم يتم تحديد أي عناصر للفاتورة.</p>';
                return;
            }

            // Pre-populate form with invoice data
            populateFormForCreate(invoiceData);
            
            // Show selected reports count in create mode
            if (invoiceData.report_ids && invoiceData.report_ids.length > 0) {
                const reportsCountElement = document.createElement('div');
                reportsCountElement.className = 'alert alert-info mb-3';
                reportsCountElement.innerHTML = `
                    <i class="fas fa-info-circle me-2"></i>
                    تم تحديد ${invoiceData.report_ids.length} تقرير لهذه الفاتورة
                `;
                
                // Insert after the page title
                const formContainer = document.querySelector('.container');
                if (formContainer) {
                    const firstRow = formContainer.querySelector('.row');
                    if (firstRow) {
                        firstRow.insertBefore(reportsCountElement, firstRow.firstChild);
                    }
                }
            }
            
            // Hide loading and show form
            loadingIndicator.classList.add('d-none');
            formContent.classList.remove('d-none');

        } catch (error) {
            console.error('Error loading create mode data:', error);
            toastr.error('حدث خطأ أثناء تحميل بيانات الفاتورة.');
            loadingIndicator.innerHTML = '<p class="text-danger">حدث خطأ أثناء تحميل بيانات الفاتورة.</p>';
        }
    }

    function populateFormForCreate(invoiceData) {
        try {
            // Set client
            if (invoiceData.client_id) {
                clientIdSelect.value = invoiceData.client_id;
            }

            // Set date
            if (invoiceData.date) {
                invoiceDateInput.value = invoiceData.date;
            }

            // Set payment status and method
            if (invoiceData.paymentStatus) {
                paymentStatusSelect.value = invoiceData.paymentStatus;
            }
            if (invoiceData.paymentMethod) {
                paymentMethodSelect.value = invoiceData.paymentMethod;
            }

            // Set discount and tax rate
            if (invoiceData.discount !== undefined) {
                discountInput.value = parseFloat(invoiceData.discount).toFixed(2);
            }
            if (invoiceData.taxRate !== undefined) {
                taxRateInput.value = parseFloat(invoiceData.taxRate).toFixed(2);
            }

            // Clear existing items
            invoiceItemsContainer.innerHTML = '';

            // Add items from selected reports
            if (invoiceData.items && invoiceData.items.length > 0) {
                invoiceData.items.forEach(item => {
                    addInvoiceItemRow({
                        description: item.description,
                        type: item.type || 'service',
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
            console.error('Error populating form for create mode:', error);
            toastr.error('حدث خطأ أثناء تحميل بيانات الفاتورة.');
        }
    }
});