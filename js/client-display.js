/**
 * Laapak Report System - Client Display JavaScript
 * Handles displaying reports and invoices in the client dashboard
 */

/**
 * Display client reports
 */
function displayReports(reports) {
    const reportsList = document.getElementById('reportsList');
    const noReportsMessage = document.getElementById('noReportsMessage');
    
    if (!reportsList) {
        return;
    }
    
    if (reports.length === 0) {
        if (noReportsMessage) {
            noReportsMessage.classList.remove('d-none');
        }
        return;
    }
    
    // Hide the "no reports" message if it exists
    if (noReportsMessage) {
        noReportsMessage.classList.add('d-none');
    }
    
    // Clear existing content
    reportsList.innerHTML = '';
    
    // Find the most recent report based on inspection_date or created_at
    const sortedReports = [...reports].sort((a, b) => {
        const dateA = new Date(a.inspection_date || a.created_at);
        const dateB = new Date(b.inspection_date || b.created_at);
        return dateB - dateA; // Most recent first
    });
    
    const mostRecentReportId = sortedReports.length > 0 ? sortedReports[0].id : null;
    
    // Process each report
    sortedReports.forEach(report => {
        const reportDate = new Date(report.inspection_date || report.created_at);
        const isNewest = report.id === mostRecentReportId;
        const col = document.createElement('div');
        col.className = 'col-md-6 mb-4';
        
        // Add animation CSS for the newest card
        if (isNewest) {
            const style = document.createElement('style');
            style.textContent = `
                @keyframes shine {
                    0% { background-position: -100px; }
                    40% { background-position: 140px; }
                    100% { background-position: 140px; }
                }
                .latest-card {
                    position: relative;
                    overflow: hidden;
                    border: 2px solid #ffc107 !important;
                    box-shadow: 0 0 15px rgba(255, 193, 7, 0.5) !important;
                }
                .latest-card::before {
                    content: '';
                    display: block;
                    position: absolute;
                    width: 100%;
                    height: 100%;
                    top: 0;
                    left: 0;
                    background: linear-gradient(to right, transparent 0%, rgba(255, 215, 0, 0.2) 50%, transparent 100%);
                    background-size: 200px 100%;
                    animation: shine 3s infinite linear;
                    z-index: 1;
                    pointer-events: none;
                }
                .latest-badge {
                    display: inline-block;
                    animation: pulse 2s infinite;
                }
                @keyframes pulse {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                    100% { transform: scale(1); }
                }
                .ribbon {
                    position: absolute;
                    top: -5px;
                    right: -5px;
                    color: white;
                    z-index: 2;
                }
                .ribbon i {
                    font-size: 40px;
                    color: #FF9800;
                    text-shadow: 0 0 5px rgba(0,0,0,0.3);
                }
            `;
            document.head.appendChild(style);
        }
        
        // Create simplified premium report card
        col.innerHTML = `
            <div class="card h-100 border-0 ${isNewest ? 'shadow-lg' : 'shadow-sm'}">
                <div class="card-body p-4">
                    ${isNewest ? '<div class="position-absolute end-0 top-0 mt-2 me-3"><i class="fas fa-circle text-warning"></i></div>' : ''}
                    
                    <h5 class="mb-3 fw-bold">${report.device_model || 'جهاز غير محدد'}</h5>
                    
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <span class="text-muted">
                            <i class="fas fa-calendar-alt me-1"></i> ${formatGregorianDate(reportDate)}
                        </span>
                        <span class="badge ${report.status === 'active' ? 'bg-success' : 
                                         report.status === 'completed' ? 'bg-primary' : 
                                         report.status === 'in-progress' ? 'bg-warning' : 'bg-secondary'} rounded-pill px-3">
                            ${report.status === 'active' ? 'نشط' : 
                             report.status === 'completed' ? 'مكتمل' : 
                             report.status === 'in-progress' ? 'قيد التنفيذ' : report.status || 'غير محدد'}
                        </span>
                    </div>
                    
                    ${report.serial_number ? `
                    <div class="text-muted small mb-3">
                        <i class="fas fa-barcode me-1"></i> ${report.serial_number}
                    </div>
                    ` : ''}
                    
                    ${report.notes ? `
                    <div class="mt-3 pt-3 border-top text-muted small">
                        ${report.notes.length > 80 ? report.notes.substring(0, 80) + '...' : report.notes}
                    </div>` : ''}
                </div>
                <div class="card-footer border-0 bg-transparent pb-4 px-4">
                    <a href="report.html?id=${report.id}" class="btn btn-sm ${isNewest ? 'btn-warning' : 'btn-outline-primary'} w-100">
                        <i class="fas fa-eye me-1"></i> عرض التقرير
                    </a>
                </div>
            </div>
        `;
        
        reportsList.appendChild(col);
    });
}

/**
 * Format currency to EGP
 */
function formatCurrency(amount) {
    const num = parseFloat(amount);
    if (isNaN(num)) return '0.00'; // Or some other default for card display
    // Ensure 'ar-EG' for Egyptian Arabic and 'EGP' for Egyptian Pound
    return num.toLocaleString('ar-EG', { style: 'currency', currency: 'EGP', minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Format date in Gregorian calendar (Miladi)
 */
function formatGregorianDate(date) {
    return date.toLocaleDateString('ar', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        calendar: 'gregory' // Explicitly use Gregorian calendar
    });
}

/**
 * Display client invoices
 */
function displayInvoices(invoices) {
    const invoicesList = document.getElementById('invoicesList');
    const noInvoicesMessage = document.getElementById('noInvoicesMessage');
    
    if (!invoicesList) {
        return;
    }
    
    if (invoices.length === 0) {
        if (noInvoicesMessage) {
            noInvoicesMessage.classList.remove('d-none');
        }
        return;
    }
    
    // Hide the "no invoices" message if it exists
    if (noInvoicesMessage) {
        noInvoicesMessage.classList.add('d-none');
    }
    
    // Clear existing content
    invoicesList.innerHTML = '';
    
    // Sort invoices by date - newest first
    const sortedInvoices = [...invoices].sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateB - dateA; // Most recent first
    });
    
    // Get the most recent invoice for highlighting
    const mostRecentInvoiceId = sortedInvoices.length > 0 ? sortedInvoices[0].id : null;
    
    // Process each invoice
    sortedInvoices.forEach(invoice => {
        const invoiceDate = new Date(invoice.date);
        const isNewest = invoice.id === mostRecentInvoiceId;
        // Check payment status correctly - use paymentStatus enum field instead of paid boolean
        const isPending = invoice.paymentStatus === 'unpaid' || invoice.paymentStatus === 'partial';
        console.log('Invoice ID:', invoice.id, 'Payment Status:', invoice.paymentStatus, 'isPending:', isPending);
        const col = document.createElement('div');
        col.className = 'col-md-6 mb-4';
        
        // Create enhanced invoice card
        col.innerHTML = `
            <div class="card h-100 border-0 ${isNewest ? 'shadow-lg' : 'shadow-sm'}">
                <div class="card-body p-4">
                    ${isNewest ? '<div class="position-absolute end-0 top-0 mt-2 me-3"><i class="fas fa-circle text-warning"></i></div>' : ''}
                    
                    <div class="d-flex justify-content-between mb-3">
                        <h5 class="mb-0 fw-bold">فاتورة #${invoice.id.substring(invoice.id.length - 5)}</h5>
                    </div>
                    
                    <div class="d-flex justify-content-between mb-3">
                        <div class="text-muted">
                            <i class="fas fa-calendar-alt me-1"></i> ${formatGregorianDate(invoiceDate)}
                        </div>
                        <div class="fw-bold text-success">
                            ${formatCurrency(invoice.total)}
                        </div>
                    </div>
                    
                    <div class="mb-3 text-muted small">
                        <i class="fas fa-credit-card me-1"></i> ${invoice.paymentMethod ? invoice.paymentMethod : 'غير محدد'}
                    </div>
                    
                    ${invoice.paymentStatus === 'paid' ? 
                        `<div class="small text-success mt-1">
                            <i class="fas fa-check-circle me-1"></i> تم الدفع بتاريخ ${formatGregorianDate(new Date(invoice.paymentDate || invoice.date))}
                        </div>` : 
                        invoice.paymentStatus === 'partial' ?
                        `<div class="small text-warning mt-1">
                            <i class="fas fa-exclamation-circle me-1"></i> تم دفع جزء من المبلغ
                        </div>` : ''
                    }
                </div>
                <div class="card-footer bg-white border-top-0 pt-0">
                    <div class="d-grid">
                        <a href="view-invoice.html?id=${invoice.id}" class="btn ${invoice.paymentStatus === 'paid' ? 'btn-success' : invoice.paymentStatus === 'partial' ? 'btn-warning' : 'btn-danger'}">
                            <i class="fas ${invoice.paymentStatus === 'paid' ? 'fa-receipt' : 'fa-file-invoice'} me-2"></i> 
                            ${invoice.paymentStatus === 'paid' ? 'عرض تفاصيل الفاتورة' : 
                             invoice.paymentStatus === 'partial' ? 'عرض واستكمال الدفع' : 
                             'عرض ودفع الفاتورة'}
                        </a>
                    </div>
                </div>
            </div>
            ${isNewest ? '<div class="text-center mt-1 mb-2"><small class="badge bg-warning px-3 py-1"><i class="fas fa-star me-1"></i> أحدث فاتورة</small></div>' : ''}
        `;
        
        invoicesList.appendChild(col);
    });
}

/**
 * Setup event listeners for report detail viewers
 */
function setupReportDetailViewers() {
    const printReportBtn = document.getElementById('printReportBtn');
    if (printReportBtn) {
        printReportBtn.addEventListener('click', function() {
            printReport();
        });
    }
}

/**
 * Setup event listeners for invoice detail viewers
 */
function setupInvoiceDetailViewers() {
    const printInvoiceBtn = document.getElementById('printInvoiceBtn');
    if (printInvoiceBtn) {
        printInvoiceBtn.addEventListener('click', function() {
            printInvoice();
        });
    }
}

/**
 * View report details in modal
 */
function viewReportDetails(reportId) {
    // Get the report data
    const clientInfo = getClientInfo();
    const reports = getMockReports(clientInfo.client_id);
    const report = reports.find(r => r.id === reportId);
    
    if (!report) {
        return;
    }
    
    // Populate the modal
    const reportModalContent = document.getElementById('reportModalContent');
    const reportDate = new Date(report.creationDate);
    
    if (reportModalContent) {
        reportModalContent.innerHTML = `
            <div class="mb-4 text-center">
                <img src="img/logo.png" alt="Laapak" width="120" class="mb-3">
                <h5 class="mb-0 fw-bold">تقرير صيانة</h5>
                <p class="text-muted small">رقم التقرير: ${report.id}</p>
            </div>
            
            <div class="card mb-4 border-0 bg-light">
                <div class="card-body">
                    <h6 class="card-title mb-3 text-primary"><i class="fas fa-info-circle me-2"></i> معلومات الجهاز</h6>
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <p class="mb-1 fw-bold small">نوع الجهاز</p>
                            <p class="mb-0">${report.deviceType}</p>
                        </div>
                        <div class="col-md-6 mb-3">
                            <p class="mb-1 fw-bold small">الشركة المصنعة</p>
                            <p class="mb-0">${report.brand}</p>
                        </div>
                        <div class="col-md-6 mb-3">
                            <p class="mb-1 fw-bold small">الموديل</p>
                            <p class="mb-0">${report.model}</p>
                        </div>
                        <div class="col-md-6 mb-3">
                            <p class="mb-1 fw-bold small">الرقم التسلسلي</p>
                            <p class="mb-0">${report.serialNumber}</p>
                        </div>
                        <div class="col-md-6 mb-3">
                            <p class="mb-1 fw-bold small">تاريخ التقرير</p>
                            <p class="mb-0">${formatDate(reportDate)}</p>
                        </div>
                        <div class="col-md-6 mb-3">
                            <p class="mb-1 fw-bold small">اسم الفني</p>
                            <p class="mb-0">${report.technicianName}</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="card mb-4 border-0 bg-light">
                <div class="card-body">
                    <h6 class="card-title mb-3 text-primary"><i class="fas fa-clipboard-list me-2"></i> تفاصيل الصيانة</h6>
                    <div class="mb-3">
                        <p class="mb-1 fw-bold small">المشكلة</p>
                        <p class="mb-0">${report.problem}</p>
                    </div>
                    <div class="mb-3">
                        <p class="mb-1 fw-bold small">التشخيص</p>
                        <p class="mb-0">${report.diagnosis}</p>
                    </div>
                    <div class="mb-0">
                        <p class="mb-1 fw-bold small">الحل</p>
                        <p class="mb-0">${report.solution}</p>
                    </div>
                </div>
            </div>
            
            <div class="card mb-4 border-0 bg-light">
                <div class="card-body">
                    <h6 class="card-title mb-3 text-primary"><i class="fas fa-cogs me-2"></i> قطع الغيار المستبدلة</h6>
                    <div class="table-responsive">
                        <table class="table table-sm table-borderless mb-0">
                            <thead class="text-muted">
                                <tr>
                                    <th>اسم القطعة</th>
                                    <th class="text-end">التكلفة (ريال)</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${report.parts.map(part => `
                                    <tr>
                                        <td>${part.name}</td>
                                        <td class="text-end">${part.cost}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            
            <div class="alert alert-success small">
                <i class="fas fa-info-circle me-2"></i>
                تتمتع بثلاثة أنواع من الضمان:
                <ul class="mb-0 mt-1">
                    <li>ضمان عيوب الصناعة: 6 أشهر من تاريخ التقرير</li>
                    <li>ضمان الاستبدال: 14 يوم من تاريخ الاستلام</li>
                    <li>ضمان الصيانة الدورية: سنة كاملة (مرة كل 6 أشهر)</li>
                </ul>
            </div>
        `;
    }
    
    // Show the modal
    const reportModal = new bootstrap.Modal(document.getElementById('reportModal'));
    reportModal.show();
}

/**
 * View invoice details in modal
 */
function viewInvoiceDetails(invoiceId) {
    // Get the invoice data
    const clientInfo = getClientInfo();
    const invoices = getMockInvoices(clientInfo.client_id);
    const invoice = invoices.find(i => i.id === invoiceId);
    
    if (!invoice) {
        return;
    }
    
    // Populate the modal
    const invoiceModalContent = document.getElementById('invoiceModalContent');
    const invoiceDate = new Date(invoice.date);
    
    if (invoiceModalContent) {
        invoiceModalContent.innerHTML = `
            <div class="mb-4 text-center">
                <img src="img/logo.png" alt="Laapak" width="120" class="mb-3">
                <h5 class="mb-0 fw-bold">فاتورة صيانة</h5>
                <p class="text-muted small">رقم الفاتورة: ${invoice.id}</p>
                <p class="text-muted small"><a href="https://laapak.com/partner" target="_blank">للتحقق من الضمان: laapak.com/partner</a></p>
            </div>
            
            <div class="row mb-4">
                <div class="col-md-6 mb-3 mb-md-0">
                    <h6 class="fw-bold mb-2">معلومات العميل</h6>
                    <p class="mb-1">الاسم: ${clientInfo.name}</p>
                    <p class="mb-0">رقم الهاتف: ${clientInfo.phone}</p>
                </div>
                <div class="col-md-6 text-md-end">
                    <h6 class="fw-bold mb-2">معلومات الفاتورة</h6>
                    <p class="mb-1">التاريخ: ${formatDate(invoiceDate)}</p>
                    <p class="mb-0">رقم التقرير: ${invoice.reportId}</p>
                </div>
            </div>
            
            <div class="card mb-4 border-0 bg-light">
                <div class="card-body">
                    <h6 class="card-title mb-3 text-primary"><i class="fas fa-list me-2"></i> تفاصيل الفاتورة</h6>
                    <div class="table-responsive">
                        <table class="table table-sm">
                            <thead>
                                <tr>
                                    <th>البيان</th>
                                    <th class="text-end">المبلغ (ريال)</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${invoice.items.map(item => `
                                    <tr>
                                        <td>${item.description}</td>
                                        <td class="text-end">${item.amount.toFixed(2)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <th>المجموع الفرعي</th>
                                    <th class="text-end">${invoice.subtotal.toFixed(2)}</th>
                                </tr>
                                ${invoice.discount > 0 ? `
                                <tr>
                                    <th>الخصم</th>
                                    <th class="text-end">${invoice.discount.toFixed(2)}</th>
                                </tr>` : ''}
                                ${invoice.tax > 0 ? `
                                <tr>
                                    <th>الضريبة (${invoice.taxRate || 14}%)</th>
                                    <th class="text-end">${invoice.tax.toFixed(2)}</th>
                                </tr>` : ''}
                                <tr>
                                    <th>المجموع الكلي</th>
                                    <th class="text-end">${invoice.total.toFixed(2)}</th>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            </div>
            
            <div class="card mb-4 border-0 bg-light">
                <div class="card-body">
                    <h6 class="card-title mb-3 text-primary"><i class="fas fa-money-check-alt me-2"></i> معلومات الدفع</h6>
                    <div class="row">
                        <div class="col-md-4 mb-3">
                            <p class="mb-1 fw-bold small">الحالة</p>
                            <p class="mb-0">
                                <span class="badge ${invoice.paid ? 'bg-success' : 'bg-danger'} p-2">
                                    ${invoice.paid ? 'مدفوعة' : 'غير مدفوعة'}
                                </span>
                            </p>
                        </div>
                        <div class="col-md-4 mb-3">
                            <p class="mb-1 fw-bold small">طريقة الدفع</p>
                            <p class="mb-0">${invoice.paymentMethod || 'غير محدد'}</p>
                        </div>
                        <div class="col-md-4 mb-3">
                            <p class="mb-1 fw-bold small">تاريخ الدفع</p>
                            <p class="mb-0">${invoice.paid ? formatDate(new Date(invoice.paymentDate)) : 'لم يتم الدفع بعد'}</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="text-center mt-4">
                <p class="mb-1 small fw-bold text-muted">Laapak للصيانة والدعم الفني</p>
                <p class="mb-0 small text-muted">الرياض، المملكة العربية السعودية</p>
                <p class="mb-0 small text-muted">هاتف: 0595555555</p>
            </div>
        `;
    }
    
    // Show the modal
    const invoiceModal = new bootstrap.Modal(document.getElementById('invoiceModal'));
    invoiceModal.show();
}

/**
 * Print a report (placeholder function)
 */
function printReport() {
    window.print();
}

/**
 * Print an invoice (placeholder function)
 */
function printInvoice() {
    window.print();
}
