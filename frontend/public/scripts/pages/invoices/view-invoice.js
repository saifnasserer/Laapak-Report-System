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
    
    // Debug: Log element selection
    console.log('Elements found on page load:', {
        clientNameEl: !!clientNameEl,
        clientPhoneEl: !!clientPhoneEl,
        clientEmailEl: !!clientEmailEl,
        clientAddressEl: !!clientAddressEl
    });

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
        
        // Debug: Check if elements exist
        console.log('Client elements found:', {
            clientNameEl: !!clientNameEl,
            clientPhoneEl: !!clientPhoneEl,
            clientEmailEl: !!clientEmailEl,
            clientAddressEl: !!clientAddressEl
        });
        
        // Client Details - Enhanced to handle multiple data structures
        // Try to get client data from multiple possible sources
        const clientData = invoice.client || invoice.Client || {};
        
        const clientName = clientData.name || invoice.client_name || 'لا يوجد';
        const clientPhone = clientData.phone || invoice.client_phone || 'لا يوجد';
        const clientEmail = clientData.email || invoice.client_email || 'لا يوجد';
        const clientAddress = clientData.address || invoice.client_address || 'لا يوجد';
        
        console.log('Extracted client data:', { clientName, clientPhone, clientEmail, clientAddress });
        
        // Update elements if they exist, with fallback selection
        const nameEl = clientNameEl || document.getElementById('clientName');
        const phoneEl = clientPhoneEl || document.getElementById('clientPhone');
        const emailEl = clientEmailEl || document.getElementById('clientEmail');
        const addressEl = clientAddressEl || document.getElementById('clientAddress');
        
        if (nameEl) {
            nameEl.textContent = clientName;
            console.log('Updated clientNameEl:', nameEl.textContent);
        } else {
            console.error('clientNameEl not found even after fallback!');
        }
        
        if (phoneEl) {
            phoneEl.textContent = clientPhone;
            console.log('Updated clientPhoneEl:', phoneEl.textContent);
        } else {
            console.error('clientPhoneEl not found even after fallback!');
        }
        
        if (emailEl) {
            emailEl.textContent = clientEmail;
            console.log('Updated clientEmailEl:', emailEl.textContent);
        } else {
            console.error('clientEmailEl not found even after fallback!');
        }
        
        if (addressEl) {
            addressEl.textContent = clientAddress;
            console.log('Updated clientAddressEl:', addressEl.textContent);
        } else {
            console.error('clientAddressEl not found even after fallback!');
        }

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
                // Get invoice data from the page
                const invoiceData = getInvoiceDataFromPage();
                
                // Generate clean PDF without screenshots
                generateCleanInvoicePDF(invoiceData);
                
                // Also trigger print dialog
                setTimeout(() => {
                    window.print();
                }, 500);

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

    // Function to extract invoice data from the page
    function getInvoiceDataFromPage() {
        return {
            invoiceId: invoiceIdEl ? invoiceIdEl.textContent : '',
            clientName: clientNameEl ? clientNameEl.textContent : '',
            clientPhone: clientPhoneEl ? clientPhoneEl.textContent : '',
            clientEmail: clientEmailEl ? clientEmailEl.textContent : '',
            clientAddress: clientAddressEl ? clientAddressEl.textContent : '',
            invoiceDate: invoiceDateEl ? invoiceDateEl.textContent : '',
            paymentStatus: paymentStatusEl ? paymentStatusEl.textContent : '',
            paymentMethod: paymentMethodEl ? paymentMethodEl.textContent : '',
            subtotal: subtotalEl ? subtotalEl.textContent : '',
            discount: discountEl ? discountEl.textContent : '',
            taxRate: taxRateEl ? taxRateEl.textContent : '',
            taxAmount: taxAmountEl ? taxAmountEl.textContent : '',
            total: totalAmountEl ? totalAmountEl.textContent : '',
            items: getInvoiceItemsFromTable()
        };
    }

    // Function to extract invoice items from the table
    function getInvoiceItemsFromTable() {
        const items = [];
        if (invoiceItemsTableBodyEl) {
            const rows = invoiceItemsTableBodyEl.querySelectorAll('tr');
            rows.forEach((row, index) => {
                const cells = row.querySelectorAll('td');
                if (cells.length >= 4 && cells[0].textContent !== '#') {
                    items.push({
                        index: cells[0].textContent,
                        description: cells[1].textContent,
                        serialNumber: cells[2].textContent,
                        amount: cells[3].textContent
                    });
                }
            });
        }
        return items;
    }

    // Function to generate clean PDF without screenshots
    function generateCleanInvoicePDF(invoiceData) {
        console.log('Starting clean PDF generation with data:', invoiceData);
        
        // Check if jsPDF is available
        if (typeof window.jspdf === 'undefined') {
            console.error('jsPDF library not loaded!');
            throw new Error('مكتبة PDF غير متوفرة');
        }
        
        const { jsPDF } = window.jspdf;
        
        // A5 dimensions in mm: 148 x 210
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a5',
            compress: true
        });

        // Set font
        pdf.setFont('helvetica');
        
        // Colors
        const primaryColor = [10, 89, 44]; // #0a592c
        const secondaryColor = [13, 148, 77]; // #0d944d
        const textColor = [51, 51, 51]; // #333
        const lightGray = [248, 249, 250]; // #f8f9fa
        
        let yPosition = 15;
        
        // Header with gradient effect (simulated with rectangles)
        pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        pdf.rect(0, 0, 148, 25, 'F');
        
        // Company name
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(20);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Laapak', 15, yPosition + 5);
        
        // Invoice title
        pdf.setFontSize(16);
        pdf.text('فاتورة', 120, yPosition + 5);
        
        yPosition += 35;
        
        // Client details section
        pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('فاتورة إلى:', 15, yPosition);
        
        yPosition += 8;
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
        
        // Client info in two columns
        const clientInfo = [
            `الاسم: ${invoiceData.clientName}`,
            `الهاتف: ${invoiceData.clientPhone}`,
            `البريد الإلكتروني: ${invoiceData.clientEmail}`,
            `العنوان: ${invoiceData.clientAddress}`
        ];
        
        clientInfo.forEach((info, index) => {
            if (info && !info.includes('لا يوجد') && !info.includes('غير متوفر')) {
                pdf.text(info, 15, yPosition);
                yPosition += 5;
            }
        });
        
        yPosition += 10;
        
        // Invoice details section
        pdf.setFont('helvetica', 'bold');
        pdf.text('تفاصيل الفاتورة:', 15, yPosition);
        
        yPosition += 8;
        pdf.setFont('helvetica', 'normal');
        
        const invoiceInfo = [
            `رقم الفاتورة: ${invoiceData.invoiceId}`,
            `تاريخ الفاتورة: ${invoiceData.invoiceDate}`,
            `حالة الدفع: ${invoiceData.paymentStatus}`,
            `طريقة الدفع: ${invoiceData.paymentMethod}`
        ];
        
        invoiceInfo.forEach((info, index) => {
            if (info && !info.includes('لا يوجد') && !info.includes('غير محدد')) {
                pdf.text(info, 15, yPosition);
                yPosition += 5;
            }
        });
        
        yPosition += 15;
        
        // Items table header
        pdf.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
        pdf.rect(15, yPosition - 5, 118, 8, 'F');
        
        pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.text('#', 18, yPosition);
        pdf.text('الوصف', 25, yPosition);
        pdf.text('السيريال', 85, yPosition);
        pdf.text('السعر', 130, yPosition);
        
        yPosition += 8;
        
        // Items rows
        pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
        pdf.setFont('helvetica', 'normal');
        
        invoiceData.items.forEach((item, index) => {
            if (yPosition > 180) {
                pdf.addPage();
                yPosition = 15;
            }
            
            pdf.setFontSize(9);
            pdf.text(item.index, 18, yPosition);
            
            // Handle long descriptions
            const description = item.description.length > 25 ? 
                item.description.substring(0, 22) + '...' : item.description;
            pdf.text(description, 25, yPosition);
            
            const serial = item.serialNumber && item.serialNumber !== 'لا يوجد' ? 
                item.serialNumber : '';
            pdf.text(serial, 85, yPosition);
            
            pdf.text(item.amount, 130, yPosition);
            
            yPosition += 6;
        });
        
        yPosition += 10;
        
        // Summary section
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        
        // Subtotal
        pdf.text('المجموع الفرعي:', 100, yPosition);
        pdf.text(invoiceData.subtotal, 130, yPosition);
        yPosition += 6;
        
        // Discount (if exists)
        if (invoiceData.discount && parseFloat(invoiceData.discount.replace(/[^\d.]/g, '')) > 0) {
            pdf.text('الخصم:', 100, yPosition);
            pdf.text(invoiceData.discount, 130, yPosition);
            yPosition += 6;
        }
        
        // Tax (if exists)
        if (invoiceData.taxAmount && parseFloat(invoiceData.taxAmount.replace(/[^\d.]/g, '')) > 0) {
            pdf.text(`ضريبة القيمة المضافة (${invoiceData.taxRate}%):`, 100, yPosition);
            pdf.text(invoiceData.taxAmount, 130, yPosition);
            yPosition += 6;
        }
        
        // Total
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        pdf.text('المبلغ الإجمالي:', 100, yPosition);
        pdf.text(invoiceData.total, 130, yPosition);
        
        // Footer
        yPosition = 200;
        pdf.setTextColor(128, 128, 128);
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.text('شكراً لثقتكم - Laapak Report System', 50, yPosition);
        
        // Save PDF
        const fileName = `invoice-${invoiceData.invoiceId || 'details'}.pdf`;
        console.log('Saving PDF with filename:', fileName);
        pdf.save(fileName);
        
        // Show success message
        if (typeof toastr !== 'undefined') {
            toastr.success('تم إنشاء ملف PDF بنجاح - حجم صغير');
        }
        
        console.log('PDF generation completed successfully');
    }

    // Initial call to fetch and display data
    fetchInvoiceData();
});
