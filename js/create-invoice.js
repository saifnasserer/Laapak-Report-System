/**
 * Laapak Report System - Create Invoice
 * Handles the invoice creation functionality and API integration
 */

// Global variables
let reportsData = [];
let selectedReports = [];
let clientsData = [];
let invoiceSettings = {
    title: 'فاتورة',
    date: new Date().toISOString().split('T')[0],
    taxRate: 15,
    discountRate: 0,
    paymentMethod: 'cash',
    notes: ''
};

document.addEventListener('DOMContentLoaded', function() {
    // Check if user is authenticated
    if (typeof authMiddleware !== 'undefined' && !authMiddleware.isAdminLoggedIn()) {
        window.location.href = 'index.html';
        return;
    }

    // Initialize the page
    initPage();
    
    // Set up event listeners
    setupEventListeners();
    
    // Load initial data
    loadClients();
    loadReports();
});

/**
 * Initialize the page
 */
function initPage() {
    // Set today's date as default for invoice date
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('invoiceDate').value = today;
    
    // Initialize tooltips and popovers
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function(tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
}

/**
 * Set up event listeners for the page
 */
function setupEventListeners() {
    // Select all reports checkbox
    const selectAllCheckbox = document.getElementById('selectAllReports');
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', function() {
            const isChecked = this.checked;
            const checkboxes = document.querySelectorAll('.report-checkbox');
            
            checkboxes.forEach(checkbox => {
                checkbox.checked = isChecked;
                
                // Trigger change event to update selected reports
                const changeEvent = new Event('change');
                checkbox.dispatchEvent(changeEvent);
            });
        });
    }
    
    // Filter buttons
    const applyFiltersBtn = document.getElementById('applyFiltersBtn');
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', applyFilters);
    }
    
    const resetFiltersBtn = document.getElementById('resetFiltersBtn');
    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', resetFilters);
    }
    
    // Generate invoice button
    const generateInvoiceBtn = document.getElementById('generateInvoiceBtn');
    if (generateInvoiceBtn) {
        generateInvoiceBtn.addEventListener('click', function() {
            if (selectedReports.length > 0) {
                showInvoiceSettingsModal();
            } else {
                showToast('الرجاء تحديد تقرير واحد على الأقل', 'warning');
            }
        });
    }
    
    // Apply settings button
    const applySettingsBtn = document.getElementById('applySettingsBtn');
    if (applySettingsBtn) {
        applySettingsBtn.addEventListener('click', function() {
            // Get settings from form
            invoiceSettings.title = document.getElementById('invoiceTitle').value;
            invoiceSettings.date = document.getElementById('invoiceDate').value;
            invoiceSettings.taxRate = parseFloat(document.getElementById('taxRate').value) || 0;
            invoiceSettings.discountRate = parseFloat(document.getElementById('discountRate').value) || 0;
            invoiceSettings.paymentMethod = document.getElementById('paymentMethod').value;
            invoiceSettings.notes = document.getElementById('invoiceNotes').value;
            
            // Hide settings modal
            const settingsModal = bootstrap.Modal.getInstance(document.getElementById('invoiceSettingsModal'));
            settingsModal.hide();
            
            // Generate invoice preview
            generateInvoicePreview();
        });
    }
    
    // Save invoice button
    const saveInvoiceBtn = document.getElementById('saveInvoiceBtn');
    if (saveInvoiceBtn) {
        saveInvoiceBtn.addEventListener('click', saveInvoice);
    }
    
    // Export PDF button
    const exportPdfBtn = document.getElementById('exportPdfBtn');
    if (exportPdfBtn) {
        exportPdfBtn.addEventListener('click', exportToPdf);
    }
    
    // Share buttons
    const shareEmailBtn = document.getElementById('shareEmailBtn');
    if (shareEmailBtn) {
        shareEmailBtn.addEventListener('click', function() {
            shareInvoice('email');
        });
    }
    
    const shareWhatsAppBtn = document.getElementById('shareWhatsAppBtn');
    if (shareWhatsAppBtn) {
        shareWhatsAppBtn.addEventListener('click', function() {
            shareInvoice('whatsapp');
        });
    }
    
    const copyLinkBtn = document.getElementById('copyLinkBtn');
    if (copyLinkBtn) {
        copyLinkBtn.addEventListener('click', function() {
            copyInvoiceLink();
        });
    }
}

/**
 * Load clients from API or localStorage
 */
async function loadClients() {
    try {
        // Show loading state in the dropdown
        const clientFilter = document.getElementById('clientFilter');
        if (!clientFilter) return;
        
        // Try to get clients from API
        let clients = [];
        try {
            // Check if apiService is defined and has getClients method
            if (typeof apiService !== 'undefined' && typeof apiService.getClients === 'function') {
                // Use ApiService to fetch clients
                clients = await apiService.getClients();
                
                // Cache clients in localStorage for offline use
                localStorage.setItem('lpk_clients', JSON.stringify(clients));
            } else {
                throw new Error('API service not available');
            }
        } catch (apiError) {
            console.warn('Error fetching clients from API, falling back to localStorage:', apiError);
            // Fall back to localStorage if API fails
            const storedClients = localStorage.getItem('lpk_clients');
            clients = storedClients ? JSON.parse(storedClients) : [];
            
            // If still no clients, use mock data
            if (clients.length === 0) {
                console.log('No clients in localStorage, using mock data');
                clients = getMockClients();
                localStorage.setItem('lpk_clients', JSON.stringify(clients));
            }
        }
        
        // Store clients data globally
        clientsData = clients;
        
        // Add clients to dropdown
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

/**
 * Get mock clients data for testing
 * @returns {Array} Array of mock client objects
 */
function getMockClients() {
    return [
        {
            id: 1,
            name: 'محمد أحمد',
            phone: '0501234567',
            email: 'mohammed@example.com',
            orderCode: 'LPK1001',
            status: 'active'
        },
        {
            id: 2,
            name: 'فاطمة علي',
            phone: '0509876543',
            email: 'fatima@example.com',
            orderCode: 'LPK1002',
            status: 'active'
        },
        {
            id: 3,
            name: 'سارة محمد',
            phone: '0553219876',
            email: 'sara@example.com',
            orderCode: 'LPK1003',
            status: 'active'
        }
    ];
}

/**
 * Load reports from API or localStorage
 */
async function loadReports() {
    try {
        // Show loading state
        const reportsTableBody = document.getElementById('reportsTableBody');
        if (!reportsTableBody) return;
        
        // Try to get reports from API
        let reports = [];
        try {
            // Check if apiService is defined and has getReports method
            if (typeof apiService !== 'undefined' && typeof apiService.getReports === 'function') {
                // Use ApiService to fetch reports
                reports = await apiService.getReports({ hasInvoice: false });
            } else {
                throw new Error('API service not available');
            }
        } catch (apiError) {
            console.warn('Error fetching reports from API, falling back to localStorage:', apiError);
            // Fall back to localStorage if API fails
            const storedReports = localStorage.getItem('lpk_reports');
            reports = storedReports ? JSON.parse(storedReports) : [];
            
            // Filter reports without invoices
            reports = reports.filter(report => !report.invoice || !report.invoice.id);
            
            // If still no reports, use mock data
            if (reports.length === 0) {
                console.log('No reports in localStorage, using mock data');
                reports = getMockReports();
                localStorage.setItem('lpk_reports', JSON.stringify(reports));
            }
        }
        
        // Store reports data globally
        reportsData = reports;
        
        // Display reports
        displayReports(reports);
        
    } catch (error) {
        console.error('Error loading reports:', error);
        const reportsTableBody = document.getElementById('reportsTableBody');
        if (reportsTableBody) {
            reportsTableBody.innerHTML = `
                <tr class="text-center">
                    <td colspan="7" class="py-5 text-danger">
                        <i class="fas fa-exclamation-circle me-2"></i>
                        حدث خطأ أثناء تحميل التقارير. الرجاء المحاولة مرة أخرى.
                    </td>
                </tr>
            `;
        }
    }
}

/**
 * Get mock reports data for testing
 * @returns {Array} Array of mock report objects
 */
function getMockReports() {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);
    
    return [
        {
            id: 'RPT10001',
            orderNumber: 'LPK1001',
            inspectionDate: today.toISOString().split('T')[0],
            createdAt: today.toISOString(),
            client_id: 1,
            clientName: 'محمد أحمد',
            clientPhone: '0501234567',
            deviceModel: 'MacBook Pro 2021',
            serialNumber: 'FVFXC2ABCDEF',
            hardwareStatus: {
                camera_status: 'working',
                speakers_status: 'working',
                microphone_status: 'not_working',
                wifi_status: 'working',
                bluetooth_status: 'working'
            },
            systemComponents: {
                cpuStatus: 'good',
                gpuStatus: 'good',
                ramStatus: 'good',
                storageStatus: 'needs_replacement',
                batteryStatus: 'good'
            },
            invoice: null,
            amount: 750
        },
        {
            id: 'RPT10002',
            orderNumber: 'LPK1002',
            inspectionDate: yesterday.toISOString().split('T')[0],
            createdAt: yesterday.toISOString(),
            client_id: 2,
            clientName: 'فاطمة علي',
            clientPhone: '0509876543',
            deviceModel: 'Dell XPS 15',
            serialNumber: 'DX15987654',
            hardwareStatus: {
                camera_status: 'working',
                speakers_status: 'not_working',
                microphone_status: 'working',
                wifi_status: 'working',
                bluetooth_status: 'not_working'
            },
            systemComponents: {
                cpuStatus: 'good',
                gpuStatus: 'good',
                ramStatus: 'needs_upgrade',
                storageStatus: 'good',
                batteryStatus: 'needs_replacement'
            },
            invoice: null,
            amount: 950
        },
        {
            id: 'RPT10003',
            orderNumber: 'LPK1003',
            inspectionDate: lastWeek.toISOString().split('T')[0],
            createdAt: lastWeek.toISOString(),
            client_id: 3,
            clientName: 'سارة محمد',
            clientPhone: '0553219876',
            deviceModel: 'HP Spectre x360',
            serialNumber: 'HP360123456',
            hardwareStatus: {
                camera_status: 'not_working',
                speakers_status: 'working',
                microphone_status: 'working',
                wifi_status: 'working',
                bluetooth_status: 'working'
            },
            systemComponents: {
                cpuStatus: 'good',
                gpuStatus: 'needs_replacement',
                ramStatus: 'good',
                storageStatus: 'good',
                batteryStatus: 'good'
            },
            invoice: null,
            amount: 1200
        },
        {
            id: 'RPT10004',
            orderNumber: 'LPK1001',
            inspectionDate: lastWeek.toISOString().split('T')[0],
            createdAt: lastWeek.toISOString(),
            client_id: 1,
            clientName: 'محمد أحمد',
            clientPhone: '0501234567',
            deviceModel: 'Lenovo ThinkPad X1',
            serialNumber: 'LTP123X1456',
            hardwareStatus: {
                camera_status: 'working',
                speakers_status: 'working',
                microphone_status: 'working',
                wifi_status: 'not_working',
                bluetooth_status: 'working'
            },
            systemComponents: {
                cpuStatus: 'good',
                gpuStatus: 'good',
                ramStatus: 'good',
                storageStatus: 'good',
                batteryStatus: 'needs_replacement'
            },
            invoice: null,
            amount: 350
        }
    ];
}

/**
 * Display reports in the table
 * @param {Array} reports - Array of report objects
 */
function displayReports(reports) {
    const reportsTableBody = document.getElementById('reportsTableBody');
    if (!reportsTableBody) return;
    
    // Clear table
    reportsTableBody.innerHTML = '';
    
    // Check if there are reports to display
    if (!reports || reports.length === 0) {
        reportsTableBody.innerHTML = `
            <tr class="text-center">
                <td colspan="7" class="py-5 text-muted">
                    <i class="fas fa-file-alt me-2"></i>
                    لا توجد تقارير بدون فواتير
                </td>
            </tr>
        `;
        return;
    }
    
    // Group reports by client
    const reportsByClient = {};
    reports.forEach(report => {
        if (!reportsByClient[report.client_id]) {
            reportsByClient[report.client_id] = [];
        }
        reportsByClient[report.client_id].push(report);
    });
    
    // Display reports grouped by client
    Object.keys(reportsByClient).forEach(client_id => {
        const clientReports = reportsByClient[client_id];
        const clientName = clientReports[0].clientName || 'عميل غير معروف';
        
        // Add client header row
        const clientRow = document.createElement('tr');
        clientRow.className = 'table-light';
        clientRow.innerHTML = `
            <td colspan="7" class="fw-bold">
                <i class="fas fa-user me-2"></i> ${clientName}
                <span class="badge bg-primary rounded-pill ms-2">${clientReports.length}</span>
            </td>
        `;
        reportsTableBody.appendChild(clientRow);
        
        // Add report rows for this client
        clientReports.forEach(report => {
            const row = document.createElement('tr');
            row.setAttribute('data-report-id', report.id);
            
            // Format date
            const reportDate = new Date(report.inspectionDate);
            const formattedDate = reportDate.toLocaleDateString('ar-SA');
            
            // Format amount
            const formattedAmount = `${report.amount.toFixed(2)} ريال`;
            
            row.innerHTML = `
                <td class="text-center">
                    <div class="form-check">
                        <input class="form-check-input report-checkbox" type="checkbox" value="${report.id}" id="report_${report.id}">
                        <label class="form-check-label" for="report_${report.id}"></label>
                    </div>
                </td>
                <td>${clientName}</td>
                <td>${report.id}</td>
                <td>${report.deviceModel}</td>
                <td>${formattedDate}</td>
                <td class="text-success fw-bold">${formattedAmount}</td>
                <td>
                    <button type="button" class="btn btn-sm btn-outline-primary view-report-btn" data-report-id="${report.id}" data-bs-toggle="tooltip" title="عرض التقرير">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            `;
            
            reportsTableBody.appendChild(row);
            
            // Add event listener for checkbox
            const checkbox = row.querySelector('.report-checkbox');
            checkbox.addEventListener('change', function() {
                if (this.checked) {
                    // Add report to selected reports
                    if (!selectedReports.includes(report.id)) {
                        selectedReports.push(report.id);
                    }
                } else {
                    // Remove report from selected reports
                    const index = selectedReports.indexOf(report.id);
                    if (index !== -1) {
                        selectedReports.splice(index, 1);
                    }
                }
                
                // Update selected reports count and total amount
                updateSelectedReportsSummary();
                
                // Enable/disable generate invoice button
                const generateInvoiceBtn = document.getElementById('generateInvoiceBtn');
                if (generateInvoiceBtn) {
                    generateInvoiceBtn.disabled = selectedReports.length === 0;
                }
            });
            
            // Add event listener for view report button
            const viewReportBtn = row.querySelector('.view-report-btn');
            viewReportBtn.addEventListener('click', function() {
                const reportId = this.getAttribute('data-report-id');
                viewReport(reportId);
            });
        });
    });
    
    // Initialize tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function(tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
}

/**
 * Update the selected reports summary
 */
function updateSelectedReportsSummary() {
    const selectedCount = document.getElementById('selectedCount');
    const totalAmount = document.getElementById('totalAmount');
    
    if (!selectedCount || !totalAmount) return;
    
    // Calculate total amount
    let total = 0;
    selectedReports.forEach(reportId => {
        const report = reportsData.find(r => r.id === reportId);
        if (report) {
            total += report.amount || 0;
        }
    });
    
    // Update UI
    selectedCount.textContent = selectedReports.length;
    totalAmount.textContent = `${total.toFixed(2)} ريال`;
    
    // Update selected reports section visibility
    const selectedReportsSection = document.getElementById('selectedReportsSection');
    if (selectedReportsSection) {
        selectedReportsSection.style.display = selectedReports.length > 0 ? 'block' : 'none';
    }
}

/**
 * Apply filters to reports
 */
function applyFilters() {
    // Get filter values
    const client_id = document.getElementById('clientFilter').value;
    const dateFrom = document.getElementById('dateFromFilter').value;
    const dateTo = document.getElementById('dateToFilter').value;
    const deviceModel = document.getElementById('deviceModelFilter').value.trim().toLowerCase();
    
    // Filter reports
    let filteredReports = [...reportsData];
    
    // Filter by client
    if (client_id) {
        filteredReports = filteredReports.filter(report => report.client_id.toString() === client_id);
    }
    
    // Filter by date range
    if (dateFrom) {
        const fromDate = new Date(dateFrom);
        filteredReports = filteredReports.filter(report => {
            const reportDate = new Date(report.inspectionDate);
            return reportDate >= fromDate;
        });
    }
    
    if (dateTo) {
        const toDate = new Date(dateTo);
        // Set time to end of day
        toDate.setHours(23, 59, 59, 999);
        filteredReports = filteredReports.filter(report => {
            const reportDate = new Date(report.inspectionDate);
            return reportDate <= toDate;
        });
    }
    
    // Filter by device model
    if (deviceModel) {
        filteredReports = filteredReports.filter(report => {
            return report.deviceModel.toLowerCase().includes(deviceModel);
        });
    }
    
    // Display filtered reports
    displayReports(filteredReports);
    
    // Reset selected reports
    selectedReports = [];
    updateSelectedReportsSummary();
}

/**
 * Reset filters
 */
function resetFilters() {
    // Reset filter inputs
    document.getElementById('clientFilter').value = '';
    document.getElementById('dateFromFilter').value = '';
    document.getElementById('dateToFilter').value = '';
    document.getElementById('deviceModelFilter').value = '';
    
    // Display all reports
    displayReports(reportsData);
    
    // Reset selected reports
    selectedReports = [];
    updateSelectedReportsSummary();
}

/**
 * View report details
 * @param {string} reportId - ID of the report to view
 */
function viewReport(reportId) {
    // Find report
    const report = reportsData.find(r => r.id === reportId);
    if (!report) {
        showToast('لم يتم العثور على التقرير', 'error');
        return;
    }
    
    // Redirect to report page
    window.open(`report.html?id=${reportId}`, '_blank');
}

/**
 * Show invoice settings modal
 */
function showInvoiceSettingsModal() {
    // Check if any reports are selected
    if (selectedReports.length === 0) {
        showToast('الرجاء تحديد تقرير واحد على الأقل', 'warning');
        return;
    }
    
    // Check if all selected reports are for the same client
    const selectedReportsData = reportsData.filter(report => selectedReports.includes(report.id));
    const client_ids = [...new Set(selectedReportsData.map(report => report.client_id))];
    
    if (client_ids.length > 1) {
        showToast('يجب أن تكون جميع التقارير المحددة لنفس العميل', 'warning');
        return;
    }
    
    // Set client name in modal
    const clientName = selectedReportsData[0].clientName || 'عميل غير معروف';
    document.getElementById('invoiceClientName').textContent = clientName;
    
    // Set report count in modal
    document.getElementById('invoiceReportCount').textContent = selectedReports.length;
    
    // Calculate total amount
    let total = 0;
    selectedReportsData.forEach(report => {
        total += report.amount || 0;
    });
    document.getElementById('invoiceTotalAmount').textContent = `${total.toFixed(2)} ريال`;
    
    // Show modal
    const settingsModal = new bootstrap.Modal(document.getElementById('invoiceSettingsModal'));
    settingsModal.show();
}

/**
 * Generate invoice preview
 */
function generateInvoicePreview() {
    // Check if any reports are selected
    if (selectedReports.length === 0) {
        showToast('الرجاء تحديد تقرير واحد على الأقل', 'warning');
        return;
    }
    
    // Get selected reports data
    const selectedReportsData = reportsData.filter(report => selectedReports.includes(report.id));
    
    // Get client data
    const client_id = selectedReportsData[0].client_id;
    const client = clientsData.find(c => c.id.toString() === client_id.toString()) || {
        name: selectedReportsData[0].clientName || 'عميل غير معروف',
        phone: selectedReportsData[0].clientPhone || '',
        email: '',
        address: ''
    };
    
    // Calculate totals
    let subtotal = 0;
    selectedReportsData.forEach(report => {
        subtotal += report.amount || 0;
    });
    
    const taxAmount = (subtotal * invoiceSettings.taxRate) / 100;
    const discountAmount = (subtotal * invoiceSettings.discountRate) / 100;
    const total = subtotal + taxAmount - discountAmount;
    
    // Generate invoice HTML
    const invoicePreviewContainer = document.getElementById('invoicePreviewContainer');
    if (!invoicePreviewContainer) return;
    
    // Format date
    const invoiceDate = new Date(invoiceSettings.date);
    const formattedDate = invoiceDate.toLocaleDateString('ar-SA');
    
    // Generate invoice number
    const invoiceNumber = generateInvoiceNumber();
    
    invoicePreviewContainer.innerHTML = `
        <div class="invoice-container p-4 border rounded bg-white shadow-sm">
            <!-- Invoice Header -->
            <div class="row mb-4">
                <div class="col-6">
                    <h2 class="mb-1">${invoiceSettings.title}</h2>
                    <p class="text-muted mb-0">رقم الفاتورة: ${invoiceNumber}</p>
                    <p class="text-muted mb-0">التاريخ: ${formattedDate}</p>
                </div>
                <div class="col-6 text-end">
                    <img src="img/logo.png" alt="Laapak Logo" height="60">
                    <p class="mb-0 mt-2">شركة لاباك للصيانة</p>
                    <p class="text-muted mb-0">الرياض، المملكة العربية السعودية</p>
                </div>
            </div>
            
            <!-- Client Info -->
            <div class="row mb-4">
                <div class="col-12">
                    <div class="bg-light p-3 rounded">
                        <h5 class="mb-2">معلومات العميل</h5>
                        <div class="row">
                            <div class="col-6">
                                <p class="mb-1"><strong>الاسم:</strong> ${client.name}</p>
                                <p class="mb-1"><strong>الهاتف:</strong> ${client.phone || 'غير متوفر'}</p>
                            </div>
                            <div class="col-6">
                                <p class="mb-1"><strong>البريد الإلكتروني:</strong> ${client.email || 'غير متوفر'}</p>
                                <p class="mb-1"><strong>العنوان:</strong> ${client.address || 'غير متوفر'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Reports Table -->
            <div class="row mb-4">
                <div class="col-12">
                    <h5 class="mb-3">تفاصيل التقارير</h5>
                    <div class="table-responsive">
                        <table class="table table-bordered">
                            <thead class="table-light">
                                <tr>
                                    <th>#</th>
                                    <th>رقم التقرير</th>
                                    <th>موديل الجهاز</th>
                                    <th>الرقم التسلسلي</th>
                                    <th>تاريخ الفحص</th>
                                    <th>المبلغ</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${selectedReportsData.map((report, index) => {
                                    const reportDate = new Date(report.inspectionDate);
                                    const formattedReportDate = reportDate.toLocaleDateString('ar-SA');
                                    return `
                                        <tr>
                                            <td>${index + 1}</td>
                                            <td>${report.id}</td>
                                            <td>${report.deviceModel}</td>
                                            <td>${report.serialNumber}</td>
                                            <td>${formattedReportDate}</td>
                                            <td class="text-end">${report.amount.toFixed(2)} ريال</td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            
            <!-- Totals -->
            <div class="row mb-4">
                <div class="col-6 offset-6">
                    <table class="table table-sm">
                        <tbody>
                            <tr>
                                <td class="text-start">المجموع الفرعي:</td>
                                <td class="text-end">${subtotal.toFixed(2)} ريال</td>
                            </tr>
                            ${invoiceSettings.taxRate > 0 ? `
                                <tr>
                                    <td class="text-start">ضريبة القيمة المضافة (${invoiceSettings.taxRate}%):</td>
                                    <td class="text-end">${taxAmount.toFixed(2)} ريال</td>
                                </tr>
                            ` : ''}
                            ${invoiceSettings.discountRate > 0 ? `
                                <tr>
                                    <td class="text-start">الخصم (${invoiceSettings.discountRate}%):</td>
                                    <td class="text-end">${discountAmount.toFixed(2)} ريال</td>
                                </tr>
                            ` : ''}
                            <tr>
                                <td class="text-start fw-bold">المجموع الكلي:</td>
                                <td class="text-end fw-bold">${total.toFixed(2)} ريال</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            
            <!-- Payment Info -->
            <div class="row mb-4">
                <div class="col-12">
                    <div class="bg-light p-3 rounded">
                        <h5 class="mb-2">معلومات الدفع</h5>
                        <p class="mb-1"><strong>طريقة الدفع:</strong> ${getPaymentMethodText(invoiceSettings.paymentMethod)}</p>
                        ${invoiceSettings.notes ? `<p class="mb-0"><strong>ملاحظات:</strong> ${invoiceSettings.notes}</p>` : ''}
                    </div>
                </div>
            </div>
            
            <!-- Footer -->
            <div class="row">
                <div class="col-12 text-center">
                    <p class="text-muted mb-0">شكراً لتعاملكم مع شركة لاباك للصيانة</p>
                </div>
            </div>
        </div>
    `;
    
    // Show invoice preview section
    const invoicePreviewSection = document.getElementById('invoicePreviewSection');
    if (invoicePreviewSection) {
        invoicePreviewSection.style.display = 'block';
        
        // Scroll to invoice preview
        invoicePreviewSection.scrollIntoView({ behavior: 'smooth' });
    }
}

/**
 * Generate a unique invoice number
 * @returns {string} Invoice number
 */
function generateInvoiceNumber() {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    
    return `INV-${year}${month}${day}-${random}`;
}

/**
 * Get payment method text
 * @param {string} method - Payment method code
 * @returns {string} Payment method text
 */
function getPaymentMethodText(method) {
    const methods = {
        'cash': 'نقداً',
        'card': 'بطاقة ائتمان',
        'bank_transfer': 'تحويل بنكي',
        'online': 'دفع إلكتروني'
    };
    
    return methods[method] || method;
}

/**
 * Save invoice to database
 */
async function saveInvoice() {
    try {
        // Check if any reports are selected
        if (selectedReports.length === 0) {
            showToast('الرجاء تحديد تقرير واحد على الأقل', 'warning');
            return;
        }
        
        // Get selected reports data
        const selectedReportsData = reportsData.filter(report => selectedReports.includes(report.id));
        
        // Get client data
        const client_id = selectedReportsData[0].client_id;
        
        // Calculate totals
        let subtotal = 0;
        selectedReportsData.forEach(report => {
            subtotal += report.amount || 0;
        });
        
        const taxAmount = (subtotal * invoiceSettings.taxRate) / 100;
        const discountAmount = (subtotal * invoiceSettings.discountRate) / 100;
        const total = subtotal + taxAmount - discountAmount;
        
        // Generate invoice number
        const invoiceNumber = generateInvoiceNumber();
        
        // Create invoice object
        const invoice = {
            id: invoiceNumber,
            title: invoiceSettings.title,
            date: invoiceSettings.date,
            client_id: client_id,
            reports: selectedReports,
            subtotal: subtotal,
            taxRate: invoiceSettings.taxRate,
            taxAmount: taxAmount,
            discountRate: invoiceSettings.discountRate,
            discountAmount: discountAmount,
            total: total,
            paymentMethod: invoiceSettings.paymentMethod,
            notes: invoiceSettings.notes,
            status: 'pending',
            createdAt: new Date().toISOString()
        };
        
        // Try to save invoice to API
        let savedInvoice = null;
        try {
            // Check if apiService is defined and has saveInvoice method
            if (typeof apiService !== 'undefined' && typeof apiService.saveInvoice === 'function') {
                // Use ApiService to save invoice
                savedInvoice = await apiService.saveInvoice(invoice);
                
                // Update reports with invoice ID
                for (const reportId of selectedReports) {
                    await apiService.updateReport(reportId, { invoiceId: invoiceNumber });
                }
            } else {
                throw new Error('API service not available');
            }
        } catch (apiError) {
            console.warn('Error saving invoice to API, falling back to localStorage:', apiError);
            // Fall back to localStorage if API fails
            
            // Get existing invoices
            const storedInvoices = localStorage.getItem('lpk_invoices');
            const invoices = storedInvoices ? JSON.parse(storedInvoices) : [];
            
            // Add new invoice
            invoices.push(invoice);
            
            // Save invoices to localStorage
            localStorage.setItem('lpk_invoices', JSON.stringify(invoices));
            
            // Update reports with invoice ID
            const storedReports = localStorage.getItem('lpk_reports');
            let reports = storedReports ? JSON.parse(storedReports) : [];
            
            // Update reports with invoice ID
            reports = reports.map(report => {
                if (selectedReports.includes(report.id)) {
                    return {
                        ...report,
                        invoice: {
                            id: invoiceNumber
                        }
                    };
                }
                return report;
            });
            
            // Save updated reports to localStorage
            localStorage.setItem('lpk_reports', JSON.stringify(reports));
            
            savedInvoice = invoice;
        }
        
        // Show success message
        showToast('تم حفظ الفاتورة بنجاح', 'success');
        
        // Disable save button
        const saveInvoiceBtn = document.getElementById('saveInvoiceBtn');
        if (saveInvoiceBtn) {
            saveInvoiceBtn.disabled = true;
            saveInvoiceBtn.innerHTML = '<i class="fas fa-check me-2"></i>تم الحفظ';
        }
        
        // Enable export and share buttons
        const exportPdfBtn = document.getElementById('exportPdfBtn');
        if (exportPdfBtn) {
            exportPdfBtn.disabled = false;
        }
        
        const shareEmailBtn = document.getElementById('shareEmailBtn');
        if (shareEmailBtn) {
            shareEmailBtn.disabled = false;
        }
        
        const shareWhatsAppBtn = document.getElementById('shareWhatsAppBtn');
        if (shareWhatsAppBtn) {
            shareWhatsAppBtn.disabled = false;
        }
        
        const copyLinkBtn = document.getElementById('copyLinkBtn');
        if (copyLinkBtn) {
            copyLinkBtn.disabled = false;
        }
        
        // Store invoice ID for sharing
        window.currentInvoiceId = invoiceNumber;
        
        // Reload reports after a short delay
        setTimeout(() => {
            loadReports();
        }, 2000);
        
        return savedInvoice;
        
    } catch (error) {
        console.error('Error saving invoice:', error);
        showToast('حدث خطأ أثناء حفظ الفاتورة', 'error');
        return null;
    }
}

/**
 * Export invoice to PDF
 */
function exportToPdf() {
    try {
        // Check if html2pdf is available
        if (typeof html2pdf === 'undefined') {
            console.error('html2pdf library not loaded');
            showToast('المكتبة المطلوبة لتصدير PDF غير متوفرة', 'error');
            return;
        }
        
        // Get invoice container
        const invoiceContainer = document.querySelector('.invoice-container');
        if (!invoiceContainer) {
            showToast('لم يتم العثور على محتوى الفاتورة', 'error');
            return;
        }
        
        // Show loading message
        showToast('جاري تصدير الفاتورة إلى PDF...', 'info');
        
        // Set options for PDF
        const options = {
            margin: 10,
            filename: `فاتورة_${window.currentInvoiceId || generateInvoiceNumber()}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        
        // Generate PDF
        html2pdf()
            .set(options)
            .from(invoiceContainer)
            .save()
            .then(() => {
                showToast('تم تصدير الفاتورة بنجاح', 'success');
            })
            .catch(error => {
                console.error('Error exporting PDF:', error);
                showToast('حدث خطأ أثناء تصدير الفاتورة', 'error');
            });
        
    } catch (error) {
        console.error('Error exporting to PDF:', error);
        showToast('حدث خطأ أثناء تصدير الفاتورة', 'error');
    }
}

/**
 * Share invoice via email or WhatsApp
 * @param {string} method - Sharing method (email or whatsapp)
 */
function shareInvoice(method) {
    try {
        // Get client data
        const selectedReportsData = reportsData.filter(report => selectedReports.includes(report.id));
        if (selectedReportsData.length === 0) {
            showToast('لم يتم العثور على بيانات التقرير', 'error');
            return;
        }
        
        const client_id = selectedReportsData[0].client_id;
        const client = clientsData.find(c => c.id.toString() === client_id.toString()) || {
            name: selectedReportsData[0].clientName || 'عميل غير معروف',
            phone: selectedReportsData[0].clientPhone || '',
            email: ''
        };
        
        // Get invoice ID
        const invoiceId = window.currentInvoiceId || generateInvoiceNumber();
        
        // Create invoice URL
        const invoiceUrl = `${window.location.origin}/invoice.html?id=${invoiceId}`;
        
        // Create message
        const message = `مرحباً ${client.name},\n\nنرفق لكم فاتورة الصيانة رقم ${invoiceId}.\n\nيمكنكم الاطلاع على الفاتورة من خلال الرابط التالي:\n${invoiceUrl}\n\nشكراً لتعاملكم مع شركة لاباك للصيانة.`;
        
        if (method === 'email') {
            // Share via email
            const subject = `فاتورة صيانة رقم ${invoiceId}`;
            const mailtoUrl = `mailto:${client.email || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
            window.open(mailtoUrl, '_blank');
        } else if (method === 'whatsapp') {
            // Share via WhatsApp
            const phone = client.phone ? client.phone.replace(/^0/, '966') : '';
            const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
            window.open(whatsappUrl, '_blank');
        }
        
    } catch (error) {
        console.error(`Error sharing invoice via ${method}:`, error);
        showToast('حدث خطأ أثناء مشاركة الفاتورة', 'error');
    }
}

/**
 * Copy invoice link to clipboard
 */
function copyInvoiceLink() {
    try {
        // Get invoice ID
        const invoiceId = window.currentInvoiceId || generateInvoiceNumber();
        
        // Create invoice URL
        const invoiceUrl = `${window.location.origin}/invoice.html?id=${invoiceId}`;
        
        // Copy to clipboard
        navigator.clipboard.writeText(invoiceUrl)
            .then(() => {
                showToast('تم نسخ رابط الفاتورة إلى الحافظة', 'success');
            })
            .catch(error => {
                console.error('Error copying to clipboard:', error);
                showToast('حدث خطأ أثناء نسخ الرابط', 'error');
            });
        
    } catch (error) {
        console.error('Error copying invoice link:', error);
        showToast('حدث خطأ أثناء نسخ رابط الفاتورة', 'error');
    }
}

/**
 * Show toast notification
 * @param {string} message - Message to display
 * @param {string} type - Toast type (success, error, warning, info)
 */
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
