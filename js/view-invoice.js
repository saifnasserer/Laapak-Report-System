document.addEventListener('DOMContentLoaded', () => {
    // Redirect to login if not authenticated as admin or client
    if (typeof authMiddleware !== 'undefined') {
        // Allow both admin and client users to view invoices
        if (!authMiddleware.isAdminLoggedIn() && !authMiddleware.isClientLoggedIn()) {
            window.location.href = 'index.html?redirect=' + encodeURIComponent(window.location.href);
            return;
        }
    }
    
    const invoiceIdParam = new URLSearchParams(window.location.search).get('id');

    // HTML Elements to populate
    const clientNameEl = document.getElementById('clientName');
    const clientPhoneEl = document.getElementById('clientPhone');
    const clientEmailEl = document.getElementById('clientEmail');
    const clientAddressEl = document.getElementById('clientAddress');

    const invoiceIdEl = document.getElementById('invoiceId');
    const invoiceDateEl = document.getElementById('invoiceDate');
    const paymentStatusEl = document.getElementById('paymentStatus');

    const invoiceItemsTableBodyEl = document.getElementById('invoiceItemsTableBody');

    const subtotalEl = document.getElementById('subtotal');
    const discountEl = document.getElementById('discount');
    const taxRateEl = document.getElementById('taxRate');
    const taxAmountEl = document.getElementById('taxAmount');
    const totalAmountEl = document.getElementById('totalAmount');
    const paymentMethodEl = document.getElementById('paymentMethod');
    const paymentDateEl = document.getElementById('paymentDate');

    const printInvoiceBtn = document.getElementById('printInvoiceBtn');
    const downloadPdfBtn = document.getElementById('downloadPdfBtn');
    const invoiceContainerToPrint = document.getElementById('invoiceContainerToPrint');

    if (!invoiceIdParam) {
        document.body.innerHTML = '<div class="container my-5"><div class="alert alert-danger">لم يتم تحديد معرف الفاتورة. يرجى التأكد من صحة الرابط.</div></div>';
        return;
    }

    // Helper to safely get potentially missing data
    const get = (obj, path, defaultValue = '-') => {
        const value = path.split('.').reduce((acc, part) => acc && acc[part], obj);
        return value !== undefined && value !== null && value !== '' ? value : defaultValue;
    };

    const formatDate = (dateString) => {
        if (!dateString || dateString === '-') return '-';
        try {
            const options = { year: 'numeric', month: 'long', day: 'numeric' };
            return new Date(dateString).toLocaleDateString('ar-EG', { ...options, calendar: 'gregory' }); // Ensured Gregorian calendar
        } catch (e) {
            return dateString; // Fallback to original string if date is invalid
        }
    };

    const formatCurrency = (amount) => {
        const num = parseFloat(amount);
        if (isNaN(num)) return '-';
        return num.toLocaleString('ar-EG', { style: 'currency', currency: 'EGP' });
    };

    const translatePaymentStatus = (status) => {
        const statuses = {
            'unpaid': { text: 'غير مدفوعة', class: 'bg-danger' },
            'partial': { text: 'مدفوعة جزئياً', class: 'bg-warning text-dark' },
            'paid': { text: 'مدفوعة', class: 'bg-success' },
            'default': { text: status, class: 'bg-secondary' }
        };
        return statuses[status.toLowerCase()] || statuses['default'];
    };

    async function fetchInvoiceData() {
        if (!invoiceIdParam) return;

        // Show a loading state if desired
        invoiceIdEl.textContent = 'جاري التحميل...';

        try {
            // Get user token (either admin or client)
            let userToken = null;
            let isAdmin = false;
            
            // Try to get admin token first
            if (typeof authMiddleware !== 'undefined') {
                if (authMiddleware.isAdminLoggedIn()) {
                    userToken = authMiddleware.getAdminToken();
                    isAdmin = true;
                    console.log('Using admin token from authMiddleware');
                } else if (authMiddleware.isClientLoggedIn()) {
                    userToken = authMiddleware.getClientToken();
                    isAdmin = false;
                    console.log('Using client token from authMiddleware');
                }
            } else {
                // Direct access from storage as fallback
                const adminToken = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
                const clientToken = localStorage.getItem('clientToken') || sessionStorage.getItem('clientToken');
                
                if (adminToken) {
                    userToken = adminToken;
                    isAdmin = true;
                    console.log('Using admin token from storage');
                } else if (clientToken) {
                    userToken = clientToken;
                    isAdmin = false;
                    console.log('Using client token from storage');
                }
            }
            
            if (!userToken) {
                throw new Error('يرجى تسجيل الدخول لعرض هذه الفاتورة');
            }
            
            let invoiceData;
            // First, try fetching from apiService if it's defined and has the method
            if (typeof apiService !== 'undefined' && typeof apiService.getInvoice === 'function') {
                // Pass the user token for authorization
                invoiceData = await apiService.getInvoice(invoiceIdParam, userToken);
                console.log('Fetched invoice data in fetchInvoiceData using apiService');
            } else {
                // Fallback: Attempt direct fetch if apiService or method is not available
                // Prepare headers with authentication if available
                const headers = {
                    'Content-Type': 'application/json'
                };
                
                if (userToken) {
                    headers['Authorization'] = `Bearer ${userToken}`;
                    // Include user type to help the API determine permissions
                    headers['X-User-Type'] = isAdmin ? 'admin' : 'client';
                }
                
                const apiBaseUrl = window.config ? window.config.api.baseUrl : window.location.origin;
                const response = await fetch(`${apiBaseUrl}/api/invoices/${invoiceIdParam}`, {
                    method: 'GET',
                    headers: headers
                });
                
                if (!response.ok) {
                    const errorResult = await response.json().catch(() => ({ message: `خطأ في الشبكة: ${response.status}` }));
                    throw new Error(errorResult.message || `فشل تحميل الفاتورة. الحالة: ${response.status}`);
                }
                
                const result = await response.json();
                if (result.success) {
                    invoiceData = result.data; // Assuming API returns { success: true, data: {invoice_object} }
                } else if (result.invoice) {
                    // Handle direct invoice object return
                    invoiceData = result.invoice;
                } else if (result.id) {
                    // The result itself might be the invoice
                    invoiceData = result;
                } else {
                    throw new Error(result.message || 'فشل تحميل بيانات الفاتورة من الاستجابة.');
                }
            }

            if (invoiceData) {
                populateInvoiceDetails(invoiceData);
            } else {
                throw new Error('لم يتم العثور على بيانات الفاتورة.');
            }

        } catch (error) {
            console.error('Error fetching invoice data:', error);
            if (invoiceContainerToPrint) {
                invoiceContainerToPrint.innerHTML = `<div class="alert alert-danger m-4">فشل تحميل بيانات الفاتورة: ${error.message}</div>`;
            }
            if (typeof toastr !== 'undefined') {
                toastr.error(`فشل تحميل بيانات الفاتورة: ${error.message}`);
            }
        }
    }

    function populateInvoiceDetails(invoice) {
    console.log('Invoice object in populateInvoiceDetails:', JSON.stringify(invoice, null, 2)); // Debug line
        // Client Details
        clientNameEl.textContent = get(invoice, 'Client.name', get(invoice, 'client_name')); // Corrected to Client.name // Fallback if client is nested or flat
        clientPhoneEl.textContent = get(invoice, 'Client.phone', get(invoice, 'client_phone')); // Corrected to Client.phone
        clientEmailEl.textContent = get(invoice, 'Client.email', get(invoice, 'client_email', 'لا يوجد')); // Corrected to Client.email
        clientAddressEl.textContent = get(invoice, 'Client.address', get(invoice, 'client_address', 'لا يوجد')); // Corrected to Client.address

        // Invoice Details
        invoiceIdEl.textContent = get(invoice, 'id');
        invoiceDateEl.textContent = formatDate(get(invoice, 'date'));
        
        const paymentStatusInfo = translatePaymentStatus(get(invoice, 'paymentStatus', 'غير معروف'));
        paymentStatusEl.textContent = paymentStatusInfo.text;
        paymentStatusEl.className = `badge ${paymentStatusInfo.class}`;

        // Invoice Items
        invoiceItemsTableBodyEl.innerHTML = ''; // Clear existing items
        if (invoiceItemsTableBodyEl && invoice.InvoiceItems && invoice.InvoiceItems.length > 0) {
            invoice.InvoiceItems.forEach((item, index) => {
                const row = invoiceItemsTableBodyEl.insertRow();
                row.insertCell().textContent = index + 1;
                row.insertCell().textContent = get(item, 'description');
                row.insertCell().textContent = get(item, 'type'); // Consider translating this if needed
                row.insertCell().textContent = get(item, 'serialNumber', 'لا يوجد');
                row.insertCell().textContent = get(item, 'quantity', 1);
                row.insertCell().textContent = formatCurrency(get(item, 'amount'));
                row.insertCell().textContent = formatCurrency(get(item, 'totalAmount'));
            });
        } else {
            invoiceItemsTableBodyEl.innerHTML = '<tr><td colspan="7" class="text-center text-muted">لا توجدรายการ في هذه الفاتورة.</td></tr>';
        }

        // Invoice Summary
    subtotalEl.textContent = formatCurrency(get(invoice, 'subtotal'));
    
    // Handle discount - show row only if discount is not zero
    const discountValue = parseFloat(get(invoice, 'discount', 0));
    discountEl.textContent = formatCurrency(discountValue);
    document.getElementById('discountRow').style.display = discountValue > 0 ? 'flex' : 'none';
    
    // Handle tax - show row only if tax is not zero
    const taxValue = parseFloat(get(invoice, 'tax', 0));
    const taxRateValue = parseFloat(get(invoice, 'taxRate', 0));
    taxRateEl.textContent = taxRateValue.toFixed(2);
    taxAmountEl.textContent = formatCurrency(taxValue);
    document.getElementById('taxRow').style.display = taxValue > 0 ? 'flex' : 'none';
    
    totalAmountEl.textContent = formatCurrency(get(invoice, 'total'));
        paymentMethodEl.textContent = get(invoice, 'paymentMethod', 'غير محدد');
        paymentDateEl.textContent = formatDate(get(invoice, 'paymentDate'));
    }

    // Print Invoice
    if (printInvoiceBtn) {
        printInvoiceBtn.addEventListener('click', () => {
            window.print();
        });
    }

    // Download PDF
    if (downloadPdfBtn && invoiceContainerToPrint) {
        downloadPdfBtn.addEventListener('click', async () => {
            downloadPdfBtn.disabled = true;
            downloadPdfBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> جاري التجهيز...';
            
            try {
                // Ensure images are loaded if any (might not be applicable for simple invoices)
                // await Promise.all(Array.from(invoiceContainerToPrint.querySelectorAll('img')).map(img => {
                //     if (img.complete) return Promise.resolve();
                //     return new Promise(resolve => { img.onload = img.onerror = resolve; });
                // }));

                const { jsPDF } = window.jspdf;
                const canvas = await html2canvas(invoiceContainerToPrint, {
                    scale: 2, // Higher scale for better quality
                    useCORS: true, // If you have external images/fonts
                    logging: false
                });
                const imgData = canvas.toDataURL('image/png');
                
                // A4 dimensions in mm: 210 x 297
                const pdf = new jsPDF({
                    orientation: 'portrait',
                    unit: 'mm',
                    format: 'a4'
                });

                const imgProps = pdf.getImageProperties(imgData);
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
                let heightLeft = pdfHeight;
                let position = 0;

                pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
                heightLeft -= pdf.internal.pageSize.getHeight();

                while (heightLeft >= 0) {
                    position = heightLeft - pdfHeight;
                    pdf.addPage();
                    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
                    heightLeft -= pdf.internal.pageSize.getHeight();
                }
                
                pdf.save(`invoice-${get(invoiceIdEl, 'textContent', 'details')}.pdf`);

            } catch (error) {
                console.error('Error generating PDF:', error);
                if (typeof toastr !== 'undefined') {
                    toastr.error('حدث خطأ أثناء إنشاء ملف PDF.');
                }
            } finally {
                downloadPdfBtn.disabled = false;
                downloadPdfBtn.innerHTML = '<i class="fas fa-file-pdf me-1"></i> تحميل PDF';
            }
        });
    }

    // Initial call to fetch and display data
    fetchInvoiceData();
});
