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
    // const paymentDateEl = document.getElementById('paymentDate'); // Removed payment date field

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
        // Client Details - Fixed to use correct client data structure
        clientNameEl.textContent = get(invoice, 'client.name', get(invoice, 'client_name', 'لا يوجد'));
        clientPhoneEl.textContent = get(invoice, 'client.phone', get(invoice, 'client_phone', 'لا يوجد'));
        clientEmailEl.textContent = get(invoice, 'client.email', get(invoice, 'client_email', 'لا يوجد'));
        clientAddressEl.textContent = get(invoice, 'client.address', get(invoice, 'client_address', 'لا يوجد'));

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
                row.insertCell().textContent = get(item, 'serialNumber', 'لا يوجد');
                row.insertCell().textContent = formatCurrency(get(item, 'amount'));
            });
        } else {
            invoiceItemsTableBodyEl.innerHTML = '<tr><td colspan="4" class="text-center text-muted">لا توجد عناصر في هذه الفاتورة.</td></tr>';
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
        // paymentDateEl.textContent = formatDate(get(invoice, 'paymentDate')); // Removed payment date field
    }

    // Save PDF and Print - Combined functionality
    if (downloadPdfBtn && invoiceContainerToPrint) {
        downloadPdfBtn.addEventListener('click', async () => {
            downloadPdfBtn.disabled = true;
            downloadPdfBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> جاري التجهيز...';
            
            try {
                // Generate and save PDF with enhanced quality
                const { jsPDF } = window.jspdf;
                
                // Temporarily add print styles for better PDF generation
                const originalStyles = document.querySelector('style').innerHTML;
                const printStyles = `
                    <style>
                        body { font-size: 14pt !important; }
                        .invoice-container { border: 2px solid #0a592c !important; }
                        .invoice-header { background: #0a592c !important; color: white !important; }
                        .invoice-section-title { color: #0a592c !important; }
                        .invoice-items-table th { background: #0a592c !important; color: white !important; }
                        .invoice-details-grid, .client-details-grid { background: #f8f9fa !important; }
                        .invoice-summary { background: #f8f9fa !important; }
                        .invoice-actions, .back-button-container { display: none !important; }
                    </style>
                `;
                
                const canvas = await html2canvas(invoiceContainerToPrint, {
                    scale: 3, // Higher scale for better quality
                    useCORS: true,
                    logging: false,
                    backgroundColor: '#ffffff',
                    removeContainer: false,
                    allowTaint: true,
                    foreignObjectRendering: true
                });
                
                const imgData = canvas.toDataURL('image/png', 1.0);
                
                // A4 dimensions in mm: 210 x 297
                const pdf = new jsPDF({
                    orientation: 'portrait',
                    unit: 'mm',
                    format: 'a4',
                    compress: true
                });

                const imgProps = pdf.getImageProperties(imgData);
                const pdfWidth = pdf.internal.pageSize.getWidth() - 20; // Add margins
                const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
                let heightLeft = pdfHeight;
                let position = 10; // Start with margin

                pdf.addImage(imgData, 'PNG', 10, position, pdfWidth, pdfHeight, '', 'FAST');
                heightLeft -= (pdf.internal.pageSize.getHeight() - 20);

                while (heightLeft >= 0) {
                    position = heightLeft - pdfHeight + 10;
                    pdf.addPage();
                    pdf.addImage(imgData, 'PNG', 10, position, pdfWidth, pdfHeight, '', 'FAST');
                    heightLeft -= (pdf.internal.pageSize.getHeight() - 20);
                }
                
                // Save PDF
                pdf.save(`invoice-${get(invoiceIdEl, 'textContent', 'details')}.pdf`);
                
                // Also trigger print dialog
                setTimeout(() => {
                    window.print();
                }, 500); // Small delay to ensure PDF download starts

            } catch (error) {
                console.error('Error generating PDF:', error);
                if (typeof toastr !== 'undefined') {
                    toastr.error('حدث خطأ أثناء إنشاء ملف PDF.');
                }
            } finally {
                downloadPdfBtn.disabled = false;
                downloadPdfBtn.innerHTML = '<i class="fas fa-file-pdf me-1"></i> حفظ PDF';
            }
        });
    }

    // Initial call to fetch and display data
    fetchInvoiceData();
});
