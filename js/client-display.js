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
    
    // Process each report
    reports.forEach(report => {
        const reportDate = new Date(report.creationDate);
        const col = document.createElement('div');
        col.className = 'col-md-6 mb-4';
        
        // Create report card
        col.innerHTML = `
            <div class="card report-card shadow-sm h-100">
                <div class="card-header bg-light">
                    <div class="d-flex justify-content-between align-items-center">
                        <h6 class="mb-0">${report.brand} ${report.model}</h6>
                        <span class="badge bg-success">${report.status}</span>
                    </div>
                </div>
                <div class="card-body">
                    <div class="mb-3">
                        <p class="text-muted mb-1"><i class="fas fa-calendar-alt me-2"></i> تاريخ التقرير: ${formatDate(reportDate)}</p>
                        <p class="text-muted mb-1"><i class="fas fa-barcode me-2"></i> الرقم التسلسلي: ${report.serialNumber}</p>
                        <p class="text-muted mb-0"><i class="fas fa-user-cog me-2"></i> الفني: ${report.technicianName}</p>
                    </div>
                    <div class="mb-3">
                        <div class="d-flex mb-1">
                            <span class="text-dark fw-bold">المشكلة:</span>
                        </div>
                        <p class="text-muted small">${report.problem}</p>
                    </div>
                    <div>
                        <div class="d-flex mb-1">
                            <span class="text-dark fw-bold">الحل:</span>
                        </div>
                        <p class="text-muted small">${report.solution}</p>
                    </div>
                </div>
                <div class="card-footer bg-white border-top-0">
                    <div class="d-grid gap-2">
                        <button type="button" class="btn btn-sm btn-outline-primary" onclick="viewReportDetails('${report.id}')">
                            <i class="fas fa-eye me-2"></i> عرض التفاصيل
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        reportsList.appendChild(col);
    });
    
    // Setup event listeners for report details
    setupReportDetailViewers();
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
    
    // Process each invoice
    invoices.forEach(invoice => {
        const invoiceDate = new Date(invoice.date);
        const col = document.createElement('div');
        col.className = 'col-md-6 mb-4';
        
        // Create invoice card
        col.innerHTML = `
            <div class="card report-card shadow-sm h-100">
                <div class="card-header bg-light">
                    <div class="d-flex justify-content-between align-items-center">
                        <h6 class="mb-0">فاتورة رقم: ${invoice.id}</h6>
                        <span class="badge ${invoice.paid ? 'bg-success' : 'bg-danger'}">
                            ${invoice.paid ? 'مدفوعة' : 'غير مدفوعة'}
                        </span>
                    </div>
                </div>
                <div class="card-body">
                    <div class="mb-3">
                        <p class="text-muted mb-1">
                            <i class="fas fa-calendar-alt me-2"></i> تاريخ الفاتورة: ${formatDate(invoiceDate)}
                        </p>
                        <p class="text-muted mb-1">
                            <i class="fas fa-file-alt me-2"></i> رقم التقرير: ${invoice.reportId}
                        </p>
                        <p class="text-muted mb-0">
                            <i class="fas fa-money-bill-wave me-2"></i> المبلغ الإجمالي: ${invoice.total} ريال
                        </p>
                    </div>
                    <div class="mb-0">
                        <div class="d-flex mb-1">
                            <span class="text-dark fw-bold">طريقة الدفع:</span>
                            <span class="ms-2">${invoice.paymentMethod || 'غير محدد'}</span>
                        </div>
                        ${invoice.paid ? 
                            `<div class="d-flex">
                                <span class="text-dark fw-bold">تاريخ الدفع:</span>
                                <span class="ms-2">${formatDate(new Date(invoice.paymentDate))}</span>
                            </div>` : ''
                        }
                    </div>
                </div>
                <div class="card-footer bg-white border-top-0">
                    <div class="d-grid gap-2">
                        <button type="button" class="btn btn-sm btn-outline-primary" onclick="viewInvoiceDetails('${invoice.id}')">
                            <i class="fas fa-eye me-2"></i> عرض التفاصيل
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        invoicesList.appendChild(col);
    });
    
    // Setup event listeners for invoice details
    setupInvoiceDetailViewers();
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
