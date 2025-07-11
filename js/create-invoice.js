/**
 * Laapak Report System - Create Invoice
 * Handles the invoice creation functionality and API integration
 */

// Global variables
let reportsData = [];
let selectedReports = [];
let clientsData = [];
let invoiceItems = [];
let invoiceTemplates = [];
let invoiceSettings = {
    title: 'فاتورة',
    date: new Date().toISOString().split('T')[0],
    taxRate: 14,
    discountRate: 0,
    paymentMethod: 'cash',
    paymentStatus: 'unpaid', // Added default payment status
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
    loadInvoiceTemplates();
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
    // Global selectAllReports checkbox logic removed as per new requirement.
    
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
                initiateDirectInvoiceCreation();
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
            invoiceSettings.paymentStatus = document.getElementById('paymentStatusSelect').value; // Added payment status
            invoiceSettings.notes = document.getElementById('invoiceNotes').value;
            
            // Hide settings modal
            const settingsModal = bootstrap.Modal.getInstance(document.getElementById('invoiceSettingsModal'));
            settingsModal.hide();
            
            // Generate invoice preview
            generateInvoicePreview();
        });
    }
    
    // Edit Items button
    const editItemsBtn = document.getElementById('editItemsBtn');
    if (editItemsBtn) {
        editItemsBtn.addEventListener('click', function() {
            showEditItemsModal();
        });
    }
    
    // Add new item button
    const addItemBtn = document.getElementById('addItemBtn');
    if (addItemBtn) {
        addItemBtn.addEventListener('click', function() {
            addNewInvoiceItem();
        });
        }
    
    // Save items button
    const saveItemsBtn = document.getElementById('saveItemsBtn');
    if (saveItemsBtn) {
        saveItemsBtn.addEventListener('click', function() {
            saveInvoiceItems();
        });
    }
    
    // Save as template button
    const saveAsTemplateBtn = document.getElementById('saveAsTemplateBtn');
    if (saveAsTemplateBtn) {
        saveAsTemplateBtn.addEventListener('click', function() {
            saveAsTemplate();
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
            // Try to get apiService from different sources
            const service = typeof apiService !== 'undefined' ? apiService : 
                         (window && window.apiService) ? window.apiService : null;
            
            if (service && typeof service.getReports === 'function') {
                // Get reports with billing_enabled=0
                reports = await service.getReports({billing_enabled: false});
                
                console.log('Reports with billing_enabled=0 for create-invoice page:', reports);
            } else {
                // Wait a moment and try again - apiService might be initializing
                await new Promise(resolve => setTimeout(resolve, 500));
                
                // Try again after waiting
                const retryService = typeof apiService !== 'undefined' ? apiService : 
                                   (window && window.apiService) ? window.apiService : null;
                
                if (retryService && typeof retryService.getReports === 'function') {
                    reports = await retryService.getReports({billing_enabled: false});
                    console.log('Reports fetched on retry for create-invoice page:', reports);
                } else {
                    throw new Error('API service not available or not initialized yet');
                }
            }
        } catch (apiError) {
            console.warn('Error fetching reports from API, falling back to localStorage:', apiError);
            // Fall back to localStorage if API fails
            const storedReports = localStorage.getItem('lpk_reports');
            reports = storedReports ? JSON.parse(storedReports) : [];
            
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

    reportsTableBody.innerHTML = ''; // Clear existing rows

    if (!reports || reports.length === 0) {
        reportsTableBody.innerHTML = '<tr><td colspan="7" class="text-center">لا توجد تقارير متاحة حاليًا.</td></tr>';
        return;
    }

    // Group reports by client
    const reportsByClient = reports.reduce((acc, report) => {
        const clientId = report.client_id;
        if (!acc[clientId]) {
            acc[clientId] = {
                clientName: report.client_name || (clientsData.find(c => c.id === clientId)?.name || 'عميل غير معروف'),
                clientPhone: report.client_phone || (clientsData.find(c => c.id === clientId)?.phone || 'غير متوفر'),
                reports: []
            };
        }
        acc[clientId].reports.push(report);
        return acc;
    }, {});

    Object.keys(reportsByClient).forEach(clientId => {
        const clientGroup = reportsByClient[clientId];
        
        // Add client header row with a "Select All" checkbox for this client
        const clientHeaderRow = document.createElement('tr');
        clientHeaderRow.classList.add('table-light', 'client-group-header');
        clientHeaderRow.innerHTML = `
            <td colspan="2">
                <div class="form-check">
                    <input class="form-check-input client-select-all" type="checkbox" id="selectAllClient-${clientId}" data-client-id="${clientId}">
                    <label class="form-check-label fw-bold" for="selectAllClient-${clientId}">
                        ${clientGroup.clientName} (${clientGroup.clientPhone})
                    </label>
                </div>
            </td>
            <td colspan="5"></td>
        `;
        reportsTableBody.appendChild(clientHeaderRow);

        clientGroup.reports.forEach(report => {
            const row = document.createElement('tr');
            row.dataset.reportId = report.id;
            row.innerHTML = `
                <td>
                    <input class="form-check-input report-checkbox client-${clientId}-report" type="checkbox" value="${report.id}" id="report-${report.id}" data-client-id="${clientId}">
                </td>
                <td>${report.id}</td>
                <td>${report.client_name || 'N/A'}</td>
                <td>${report.device_model || 'N/A'}</td>
                <td>${new Date(report.inspection_date).toLocaleDateString()}</td>
                <td><span class="badge bg-${getReportStatusBadge(report.status)}">${getReportStatusText(report.status)}</span></td>
                <td>
                    <button class="btn btn-sm btn-outline-primary view-report-btn" data-report-id="${report.id}" title="عرض التقرير">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            `;
            reportsTableBody.appendChild(row);

            // Event listener for individual report checkbox
            const reportCheckbox = row.querySelector('.report-checkbox');
            reportCheckbox.addEventListener('change', function() {
                const reportId = report.id; // Get the ID from the report object in the closure
                if (this.checked) {
                    // Ensure we are storing only IDs and avoid duplicates
                    if (!selectedReports.includes(reportId)) {
                        selectedReports.push(reportId);
                    }
                } else {
                    // Filter out the ID
                    selectedReports = selectedReports.filter(id => id !== reportId);
                }
                updateSelectedReportsSummary();
                updateClientSelectAllState(clientId);
            });
        });
    });

    // Add event listeners for per-client select-all checkboxes
    document.querySelectorAll('.client-select-all').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const currentClientId = this.dataset.clientId;
            const isChecked = this.checked;
            document.querySelectorAll(`.report-checkbox.client-${currentClientId}-report`).forEach(reportCb => {
                if (reportCb.checked !== isChecked) {
                    reportCb.checked = isChecked;
                    // Manually trigger change event to update selectedReports array and summary
                    const changeEvent = new Event('change', { bubbles: true });
                    reportCb.dispatchEvent(changeEvent);
                }
            });
        });
    });

    // Add event listeners for view report buttons
    document.querySelectorAll('.view-report-btn').forEach(button => {
        button.addEventListener('click', function() {
            viewReport(this.dataset.reportId);
        });
    });
}

function updateClientSelectAllState(clientId) {
    const clientCheckboxes = document.querySelectorAll(`.report-checkbox.client-${clientId}-report`);
    const clientSelectAllCheckbox = document.getElementById(`selectAllClient-${clientId}`);
    if (!clientSelectAllCheckbox) return;

    const allChecked = Array.from(clientCheckboxes).every(cb => cb.checked);
    const someChecked = Array.from(clientCheckboxes).some(cb => cb.checked);

    clientSelectAllCheckbox.checked = allChecked;
    clientSelectAllCheckbox.indeterminate = !allChecked && someChecked;
}

// Helper function to get status badge (assuming it exists or you'll add it)
function getReportStatusBadge(status) {
    const statusMap = {
        'pending': 'warning',
        'in-progress': 'info',
        'completed': 'success',
        'cancelled': 'danger',
        'active': 'primary' // Assuming 'active' means ready for invoicing or similar
    };
    return statusMap[status.toLowerCase()] || 'secondary';
}

// New function to handle direct invoice creation
function initiateDirectInvoiceCreation() {
    // Ensure reports are selected
    if (selectedReports.length === 0) {
        showToast('الرجاء اختيار تقرير واحد على الأقل', 'warning');
        return;
    }

    const createInvoiceBtn = document.getElementById('createDirectInvoiceBtn');
    if(createInvoiceBtn) {
        createInvoiceBtn.dataset.originalText = createInvoiceBtn.innerHTML;
        createInvoiceBtn.disabled = true;
        createInvoiceBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> جارٍ إنشاء الفاتورة...';
    }

    // Check that we have all selected reports in reportsData
    const selectedReportObjects = [];
    let missingReportFound = false;
    
    for (const reportId of selectedReports) {
        const reportObject = reportsData.find(report => report.id === reportId);
        if (!reportObject) {
            console.error('[initiateDirectInvoiceCreation] Could not find the full report object for ID:', reportId, 'in reportsData. selectedReports:', selectedReports, 'reportsData sample:', reportsData.slice(0,2));
            missingReportFound = true;
            break;
        }
        selectedReportObjects.push(reportObject);
    }
    
    if (missingReportFound) {
        showToast('خطأ: لم يتم العثور على بيانات بعض التقارير المحددة. الرجاء تحديث الصفحة وإعادة المحاولة.', 'error');
        if(createInvoiceBtn) {
            createInvoiceBtn.disabled = false;
            createInvoiceBtn.innerHTML = createInvoiceBtn.dataset.originalText || 'إنشاء فاتورة مباشرة';
        }
        return;
    }

    // Validate all reports are for the same client
    const firstReportObject = selectedReportObjects[0];
    const clientId = firstReportObject.client_id;

    if (!clientId || clientId === 0 || clientId === '0') {
        console.error('[initiateDirectInvoiceCreation] Invalid or missing client_id from the first selected report object:', firstReportObject);
        showToast('خطأ: لم يتم العثور على معرف عميل صالح للتقرير المحدد. لا يمكن إنشاء الفاتورة.', 'error');
        if(createInvoiceBtn) {
            createInvoiceBtn.disabled = false;
            createInvoiceBtn.innerHTML = createInvoiceBtn.dataset.originalText || 'إنشاء فاتورة مباشرة';
        }
        return;
    }
    console.log('[initiateDirectInvoiceCreation] Using client_id:', clientId, 'from report object:', firstReportObject);

    showToast('جاري إنشاء الفاتورة...', 'info');

    // 1. Prepare Default Invoice Settings
    const today = new Date();
    const defaultInvoiceSettings = {
        title: `فاتورة بتاريخ ${today.toLocaleDateString('ar-SA')}`,
        date: today.toISOString().split('T')[0], // YYYY-MM-DD format
        taxRate: parseFloat(localStorage.getItem('lpk_default_tax_rate')) || 14,
        discountRate: parseFloat(localStorage.getItem('lpk_default_discount_rate')) || 0,
        paymentMethod: localStorage.getItem('lpk_default_payment_method') || 'bank_transfer',
        paymentStatus: localStorage.getItem('lpk_default_payment_status') || 'unpaid', // Added default payment status
        notes: 'تم إنشاء هذه الفاتورة مباشرةً.',
        client_id: parseInt(clientId, 10), // Set client_id
        report_ids: selectedReports // selectedReports already contains just IDs
    };

    // 2. Prepare Invoice Items from Selected Reports
    // 2. Prepare Invoice Items from Selected Reports
    // Map over selectedReport IDs to get full report objects from reportsData
    const defaultInvoiceItems = selectedReports.map((reportId, index) => {
        const reportObject = reportsData.find(r => r.id === reportId);
        if (!reportObject) {
            console.warn(`[initiateDirectInvoiceCreation] Could not find report object for ID ${reportId} when creating items. Skipping.`);
            return null; // Or handle error appropriately
        }
        const reportAmount = parseFloat(reportObject.amount) || 0;
        return {
            id: `item-${reportObject.id}-${index}-${Date.now()}`,
            description: `${reportObject.device_model || 'جهاز غير محدد'} (${reportObject.id})`,
            quantity: 1,
            unitPrice: reportAmount,
            total: reportAmount,
            type: 'item',
            report_id: reportObject.id
        };
    }).filter(item => item !== null); // Remove any nulls if reports weren't found

    // 3. Set localStorage for saveInvoice to pick up
    localStorage.setItem('lpk_invoice_settings', JSON.stringify(defaultInvoiceSettings));
    localStorage.setItem('lpk_invoice_items', JSON.stringify(defaultInvoiceItems));

    // 4. Call the original saveInvoice function
    saveInvoice();
}

// Helper function to get status text (assuming it exists or you'll add it)
function getReportStatusText(status) {
    // This could be more sophisticated, perhaps fetching from a localization object
    const statusTextMap = {
        'pending': 'قيد الانتظار',
        'in-progress': 'قيد التنفيذ',
        'completed': 'مكتمل',
        'cancelled': 'ملغي',
        'active': 'نشط'
    };
    return statusTextMap[status.toLowerCase()] || status;
}

/**
 * Update the selected reports summary
 */
// Helper function for currency formatting (can be made more sophisticated)
function formatCurrency(amount, currency = 'جنية') {
    if (typeof amount !== 'number') {
        amount = 0;
    }
    return `${amount.toFixed(2)} ${currency}`;
}

function updateSelectedReportsSummary() {
    console.log('[updateSelectedReportsSummary] Called. selectedReports length:', selectedReports.length);
    // Log only relevant parts to avoid overly verbose logs if reports are large objects
    // console.log('[updateSelectedReportsSummary] selectedReports content (IDs and amounts):', JSON.stringify(selectedReports.map(r => ({id: r.id, amount: r.amount}))));

    const generateInvoiceBtn = document.getElementById('generateInvoiceBtn');
    if (generateInvoiceBtn) {
        generateInvoiceBtn.disabled = selectedReports.length === 0;
        // console.log('[updateSelectedReportsSummary] generateInvoiceBtn.disabled set to:', generateInvoiceBtn.disabled);
    } else {
        console.warn('[updateSelectedReportsSummary] generateInvoiceBtn not found!');
    }

    const selectedCountElement = document.getElementById('selectedCount');
    if (selectedCountElement) {
        selectedCountElement.textContent = selectedReports.length;
    } else {
        console.warn('[updateSelectedReportsSummary] selectedCountElement (ID: selectedCount) not found!');
    }

    let currentTotalAmount = 0;
    try {
        selectedReports.forEach(reportObject => { // Assuming selectedReports contains full report objects
            if (reportObject && typeof reportObject.amount !== 'undefined') {
                const amount = parseFloat(reportObject.amount);
                if (!isNaN(amount)) {
                    currentTotalAmount += amount;
                } else {
                    console.warn('[updateSelectedReportsSummary] Invalid amount for report:', reportObject.id, 'amount:', reportObject.amount);
                }
            } else {
                console.warn('[updateSelectedReportsSummary] Selected report object is missing or has no amount property:', reportObject ? reportObject.id : 'undefined report object in selectedReports');
            }
        });
    } catch (error) {
        console.error('[updateSelectedReportsSummary] Error calculating total amount:', error);
    }
    
    const totalAmountElement = document.getElementById('totalAmount');
    if (totalAmountElement) {
        totalAmountElement.textContent = formatCurrency(currentTotalAmount);
    } else {
        console.warn('[updateSelectedReportsSummary] totalAmountElement (ID: totalAmount) not found!');
    }

    // Also update the second count display if it exists
    const selectedCount2Element = document.getElementById('selectedCount2');
    const totalAmount2Element = document.getElementById('totalAmount2');
    if (selectedCount2Element) {
        selectedCount2Element.textContent = selectedReports.length;
    }
    if (totalAmount2Element) {
        totalAmount2Element.textContent = formatCurrency(currentTotalAmount);
    }
    
    // Update selected reports section visibility
    const selectedReportsSection = document.getElementById('selectedReportsSection');
    if (selectedReportsSection) {
        selectedReportsSection.style.display = selectedReports.length > 0 ? 'block' : 'none';
    }

    // Regenerate invoice preview if reports are selected
    if (selectedReports.length > 0) {
        invoiceItems = []; // Clear previous items before generating new preview from reports
        generateInvoicePreview();
    } else {
        // Optionally, clear the preview if no reports are selected
        const previewContainer = document.getElementById('invoicePreviewContainer'); // Assuming this is your preview container ID
        if (previewContainer) {
            previewContainer.innerHTML = '<p class="text-center text-muted">الرجاء تحديد تقرير واحد على الأقل لعرض معاينة الفاتورة.</p>';
        }
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

    // Populate modal with current settings
    document.getElementById('invoiceTitle').value = invoiceSettings.title;
    document.getElementById('invoiceDate').value = invoiceSettings.date;
    document.getElementById('taxRate').value = invoiceSettings.taxRate;
    document.getElementById('discountRate').value = invoiceSettings.discountRate;
    document.getElementById('paymentMethod').value = invoiceSettings.paymentMethod;
    document.getElementById('paymentStatusSelect').value = invoiceSettings.paymentStatus; // Populate payment status
    document.getElementById('invoiceNotes').value = invoiceSettings.notes;

    const settingsModal = new bootstrap.Modal(document.getElementById('invoiceSettingsModal'));
    settingsModal.show();
}

/**
 * Show edit items modal
 */
function showEditItemsModal() {
    // Populate the items table
    const itemsTableBody = document.getElementById('invoiceItemsTableBody');
    if (!itemsTableBody) return;
    
    // Clear table
    itemsTableBody.innerHTML = '';
    
    // If no items yet, initialize from reports
    if (invoiceItems.length === 0) {
        // Get selected reports data
        const selectedReportsData = reportsData.filter(report => selectedReports.includes(report.id));
        
        // Create items from reports
        selectedReportsData.forEach(report => {
            invoiceItems.push({
                id: 'item_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
                description: `${report.deviceModel || 'جهاز'} (${report.id})`,
                serialNumber: report.serialNumber || '',
                unitPrice: report.amount || 0,
                total: report.amount || 0
            });
        });
    }
    
    // Display items
    invoiceItems.forEach((item, index) => {
        const row = document.createElement('tr');
        row.setAttribute('data-item-id', item.id);
        
        row.innerHTML = `
            <td>
                <input type="text" class="form-control item-description" value="${item.description}">
            </td>
            <td>
                <input type="text" class="form-control item-serial" value="${item.serialNumber || ''}" placeholder="الرقم التسلسلي">
            </td>
            <td>
                <input type="number" class="form-control item-price" value="${item.unitPrice}" min="0" step="0.01" onchange="updateItemTotal(this)">
            </td>
            <td>
                <input type="number" class="form-control item-total" value="${item.total}" readonly>
            </td>
            <td class="text-center">
                <button type="button" class="btn btn-sm btn-danger delete-item-btn" onclick="deleteInvoiceItem('${item.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        itemsTableBody.appendChild(row);
    });
    
    // Show modal
}

/**
 * Update the total amount for an invoice item based on the price
 */
function updateItemTotal(input) {
    const row = input.closest('tr');
    const price = parseFloat(row.querySelector('.item-price').value) || 0;
    
    // Since we've removed the quantity field, the total is the same as the price
    const total = price;
    
    row.querySelector('.item-total').value = total.toFixed(2);
}

/**
 * Add new invoice item
 */
function addNewInvoiceItem() {
    const itemsTableBody = document.getElementById('invoiceItemsTableBody');
    if (!itemsTableBody) return;
    
    // Create new item
    const newItem = {
        id: 'item_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
        description: '',
        serialNumber: '',
        unitPrice: 0,
        total: 0
    };
    
    // Add to items array
    invoiceItems.push(newItem);
    
    // Add row to table
    const row = document.createElement('tr');
    row.setAttribute('data-item-id', newItem.id);
    
    row.innerHTML = `
        <td>${itemsTableBody.children.length + 1}</td>
        <td>
            <input type="text" class="form-control item-description" value="">
        </td>
        <td>
            <input type="text" class="form-control item-serial" value="" placeholder="الرقم التسلسلي">
        </td>
        <td>
            <input type="number" class="form-control item-price" value="0" min="0" step="0.01">
        </td>
        <td class="text-center">
            <button type="button" class="btn btn-sm btn-danger delete-item-btn" onclick="deleteInvoiceItem('${newItem.id}')">
                <i class="fas fa-trash"></i>
            </button>
        </td>
    `;
    
    itemsTableBody.appendChild(row);
    
    // Focus on the description field
    row.querySelector('.item-description').focus();
}

/**
 * Delete invoice item
 */
function deleteInvoiceItem(itemId) {
    // Remove from items array
    invoiceItems = invoiceItems.filter(item => item.id !== itemId);
    
    // Remove row from table
    const row = document.querySelector(`tr[data-item-id="${itemId}"]`);
    if (row) {
        row.remove();
    }
}

/**
 * Collect invoice items from the form
 * @returns {Array} - Array of invoice items
 */
function collectInvoiceItems() {
    const itemsTableBody = document.getElementById('invoiceItemsTableBody');
    if (!itemsTableBody) return [];
    
    const items = [];
    
    // Loop through all rows
    const rows = itemsTableBody.querySelectorAll('tr');
    rows.forEach(row => {
        const itemId = row.getAttribute('data-item-id');
        
        // Get values from input fields
        const description = row.querySelector('.item-description').value;
        const serialNumber = row.querySelector('.item-serial').value || null;
        const unitPrice = parseFloat(row.querySelector('.item-price').value) || 0;
        const total = parseFloat(row.querySelector('.item-total').value) || 0;
        
        // Add item to array
        items.push({
            id: itemId,
            description: description,
            serialNumber: serialNumber,
            unitPrice: unitPrice,
            total: total
        });
    });
    
    return items;
}

/**
 * Save invoice items
 */
function saveInvoiceItems() {
    const itemsTableBody = document.getElementById('invoiceItemsTableBody');
    if (!itemsTableBody) return;
    
    // Get all rows
    const rows = itemsTableBody.querySelectorAll('tr');
    
    // Clear items array
    invoiceItems = [];
    
    // Get data from each row
    rows.forEach(row => {
        const itemId = row.getAttribute('data-item-id');
        const description = row.querySelector('.item-description').value;
        const serialNumber = row.querySelector('.item-serial').value || null;
        const unitPrice = parseFloat(row.querySelector('.item-price').value) || 0;
        const total = parseFloat(row.querySelector('.item-total').value) || 0;
        
        // Add to items array
        invoiceItems.push({
            id: itemId,
            description: description,
            serialNumber: serialNumber,
            unitPrice: unitPrice,
            total: total
        });
    });
    
    // Hide modal
    const editItemsModal = bootstrap.Modal.getInstance(document.getElementById('editItemsModal'));
    editItemsModal.hide();
    
    // Regenerate invoice preview
    generateInvoicePreview();
    
    // Show success message
    showToast('تم حفظ عناصر الفاتورة بنجاح', 'success');
}

/**
 * Generate invoice preview
 */
function generateInvoicePreview() {
    console.log('[generateInvoicePreview] Called. Global selectedReports (IDs):', JSON.stringify(selectedReports));
    console.log('[generateInvoicePreview] Global reportsData (first 2 items):', JSON.stringify(reportsData.slice(0, 2)));

    // Check if any reports are selected
    if (selectedReports.length === 0) {
        showToast('الرجاء تحديد تقرير واحد على الأقل', 'warning');
        return;
    }
    
    // Get selected reports data
    const selectedReportsData = reportsData.filter(report => selectedReports.includes(report.id));
    console.log('[generateInvoicePreview] Filtered selectedReportsData (first 2 items):', JSON.stringify(selectedReportsData.slice(0, 2)));
    console.log('[generateInvoicePreview] Total items in selectedReportsData:', selectedReportsData.length);

    // Get client data
    let clientName = 'عميل غير معروف'; // Default to "Unknown Client" in Arabic
    let clientPhone = '';
    let clientEmail = '';
    let clientAddress = '';
    let client_id = 0;
    
    // Try to get valid client data from the first report
    for (const report of selectedReportsData) {
        // Get client ID
        if (report.client_id) {
            client_id = report.client_id;
            break;
        }
    }
    
    // Try to find client in clientsData
    const client = clientsData.find(c => c.id && c.id.toString() === client_id.toString());
    
    if (client) {
        // Use client data from clientsData
        clientName = client.name || clientName;
        clientPhone = client.phone || '';
        clientEmail = client.email || '';
        clientAddress = client.address || '';
    } else {
        // Try to get client data from the first report with valid data
        for (const report of selectedReportsData) {
            // Get client name
            if (!clientName || clientName === 'عميل غير معروف') {
                if (report.clientName && report.clientName.trim() !== '') {
                    clientName = report.clientName;
                } else if (report.client_name && report.client_name.trim() !== '') {
                    clientName = report.client_name;
                }
            }
            
            // Get client phone
            if (!clientPhone && (report.clientPhone || report.client_phone)) {
                clientPhone = report.clientPhone || report.client_phone;
            }
            
            // Get client email
            if (!clientEmail && (report.clientEmail || report.client_email)) {
                clientEmail = report.clientEmail || report.client_email;
            }
            
            // Get client address
            if (!clientAddress && (report.clientAddress || report.client_address)) {
                clientAddress = report.clientAddress || report.client_address;
            }
        }
    }
    
    // Create client object for the invoice
    const clientObj = {
        id: client_id,
        name: clientName,
        phone: clientPhone,
        email: clientEmail,
        address: clientAddress
    };
    
    // Populate invoiceItems from selected reports data
    // This ensures the preview always reflects the currently selected reports
    invoiceItems = []; // Clear any existing items first
    selectedReportsData.forEach((report, index) => {
        console.log(`[generateInvoicePreview] Processing report for item ${index}:`, JSON.stringify(report));
        const description = `${report.device_model || report.deviceModel || 'جهاز غير محدد'}`; // Just the device model
        console.log(`[generateInvoicePreview] Generated description for item ${index}:`, description);
        invoiceItems.push({
            id: 'item_' + Date.now() + '_' + Math.floor(Math.random() * 1000) + '_' + report.id,
            description: description,
            quantity: 1,
            unitPrice: parseFloat(report.amount) || 0,
            total: parseFloat(report.amount) || 0,
            type: 'item', // Changed to 'item'
            serialNumber: report.serial_number || report.serialNumber || null
        });
    });
    
    // Calculate totals from invoice items
    let subtotal = 0;
    invoiceItems.forEach(item => {
        // Ensure total is a valid number
        const itemTotal = parseFloat(item.total) || 0;
        subtotal += itemTotal;
    });
    
    // Ensure tax and discount calculations use valid numbers
    const taxRate = parseFloat(invoiceSettings.taxRate) || 0;
    const discountRate = parseFloat(invoiceSettings.discountRate) || 0;
    
    const taxAmount = (subtotal * taxRate) / 100;
    const discountAmount = (subtotal * discountRate) / 100;
    const total = subtotal + taxAmount - discountAmount;
    
    // Generate invoice HTML
    const invoicePreviewContainer = document.getElementById('invoicePreviewContainer');
    if (!invoicePreviewContainer) return;
    
    // Format date in Gregorian format (not Hijri)
    const invoiceData = {
        // invoice_number: generateInvoiceNumber(), // Removed: Backend generates invoice_number
    };
    const invoiceDate = new Date(invoiceSettings.date);
    const formattedDate = invoiceDate.toISOString().split('T')[0]; // YYYY-MM-DD format
    
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
                </div>
            </div>
            
            <!-- Client Info -->
            <div class="row mb-4">
                <div class="col-12">
                    <div class="bg-light p-3 rounded">
                        <h5 class="mb-2">معلومات العميل</h5>
                        <div class="row">
                            <div class="col-6">
                                <p class="mb-1"><strong>الاسم:</strong> ${clientObj.name}</p>
                                <p class="mb-1"><strong>الهاتف:</strong> ${clientObj.phone || 'غير متوفر'}</p>
                            </div>
                            <div class="col-6">
                                <p class="mb-1"><strong>البريد الإلكتروني:</strong> ${clientObj.email || 'غير متوفر'}</p>
                                <p class="mb-1"><strong>العنوان:</strong> ${clientObj.address || 'غير متوفر'}</p>
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
                                    <th>الوصف</th>
                                    <th>السيريال</th>
                                    <th>السعر</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${invoiceItems.map((item, index) => {
                                    return `
                                        <tr>
                                            <td>${index + 1}</td>
                                            <td>${item.description}</td>
                                            <td class="text-center">${item.serialNumber || 'لا يوجد'}</td>
                                            <td class="text-end">${(parseFloat(item.unitPrice) || 0).toFixed(2)} جنية</td>
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
                                <td class="text-end">${subtotal.toFixed(2)} جنية</td>
                            </tr>
                            ${invoiceSettings.taxRate > 0 ? `
                                <tr>
                                    <td class="text-start">ضريبة القيمة المضافة (${invoiceSettings.taxRate}%):</td>
                                    <td class="text-end">${taxAmount.toFixed(2)} جنية</td>
                                </tr>
                            ` : ''}
                            ${invoiceSettings.discountRate > 0 ? `
                                <tr>
                                    <td class="text-start">الخصم (${invoiceSettings.discountRate}%):</td>
                                    <td class="text-end">${discountAmount.toFixed(2)} جنية</td>
                                </tr>
                            ` : ''}
                            <tr>
                                <td class="text-start fw-bold">المجموع الكلي:</td>
                                <td class="text-end fw-bold">${total.toFixed(2)} جنية</td>
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
                        <p class="mb-1"><strong>حالة الدفع:</strong> ${getPaymentStatusText(invoiceSettings.paymentStatus)}</p> // Added payment status
                        ${invoiceSettings.notes ? `<p class="mb-0"><strong>ملاحظات:</strong> ${invoiceSettings.notes}</p>` : ''}
                    </div>
                </div>
            </div>
            
            <!-- Footer -->
            <div class="row">
                <div class="col-12 text-center">
                    <p class="text-muted mb-0">شكراً لثقتكم</p>
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
 * Get payment status text
 * @param {string} status - Payment status code
 * @returns {string} Payment status text
 */
function getPaymentStatusText(status) {
    const statuses = {
        'unpaid': 'غير مدفوع',
        'partial': 'مدفوع جزئياً',
        'paid': 'مدفوع'
    };
    
    return statuses[status] || status;
}

/**
 * Save invoice to database
 */
async function saveInvoice() {
    // Load settings and items from localStorage, as they are prepared by initiateDirectInvoiceCreation
    const storedSettings = localStorage.getItem('lpk_invoice_settings');
    const storedItems = localStorage.getItem('lpk_invoice_items');

    if (!storedSettings || !storedItems) {
        showToast('بيانات الفاتورة غير مكتملة. الرجاء المحاولة مرة أخرى.', 'danger');
        console.error('Invoice settings or items not found in localStorage.');
        return;
    }

    const currentInvoiceSettings = JSON.parse(storedSettings);
    const currentInvoiceItems = JSON.parse(storedItems);

    try {
        // Check if any reports are selected (global selectedReports should be up-to-date)
        if (selectedReports.length === 0) {
            showToast('الرجاء تحديد تقرير واحد على الأقل', 'warning');
            return;
        }
        
        // Use client_id from currentInvoiceSettings (loaded from localStorage)
        const client_id = currentInvoiceSettings.client_id;
        const report_ids_to_invoice = currentInvoiceSettings.report_ids || []; // Ensure it's an array

        if (!client_id || client_id === 0) {
            showToast('خطأ حرج: معرف العميل غير متوفر في إعدادات الفاتورة المحفوظة.', 'danger');
            console.error('Critical: client_id is missing or invalid in currentInvoiceSettings. Client ID:', client_id, 'Settings:', currentInvoiceSettings);
            // Disable save button or provide a clear way for the user to recover/restart
            document.getElementById('saveInvoiceBtn').disabled = true; 
            return; // Stop if client_id is not valid
        }
        console.log('[saveInvoice] Using client_id:', client_id, 'and report_ids:', report_ids_to_invoice, 'from currentInvoiceSettings.');

        // Calculate totals from currentInvoiceItems
        let subtotal = 0;
        currentInvoiceItems.forEach(item => {
            const itemTotal = parseFloat(item.total) || 0;
            subtotal += itemTotal;
        });
        
        const taxRate = parseFloat(currentInvoiceSettings.taxRate) || 0;
        const discountRate = parseFloat(currentInvoiceSettings.discountRate) || 0;
        
        const taxAmount = (subtotal * taxRate) / 100;
        const discountAmount = (subtotal * discountRate) / 100;
        const total = subtotal + taxAmount - discountAmount;
        
        // Backend will generate the invoice ID (primary key)
        // const invoiceNumber = generateInvoiceNumber(); // Keep for local use if needed, but not for API payload 'id'

        // Generate invoice ID first - required by the API
        const invoiceId = generateInvoiceNumber();

        // Create invoice object for the API
        const invoicePayload = {
            id: invoiceId, // Include the invoice ID as required by the API
            date: currentInvoiceSettings.date, 
            client_id: client_id, // Correct client_id from currentInvoiceSettings
            report_id: report_ids_to_invoice.length > 0 ? report_ids_to_invoice[0] : null, // Send first report ID (API expects single report_id)
            items: currentInvoiceItems.map(item => ({
                description: item.description,
                quantity: 1, // Always set to 1 since we're not using quantity anymore
                type: item.type || 'service', // Ensure 'type' is included as per invoice_items schema
                amount: parseFloat(item.unitPrice) || 0, 
                totalAmount: parseFloat(item.total) || 0, 
                serialNumber: item.serialNumber || null 
            })),
            subtotal: parseFloat(subtotal.toFixed(2)),
            taxRate: parseFloat(currentInvoiceSettings.taxRate) || 0, 
            tax: parseFloat(taxAmount.toFixed(2)),
            discount: parseFloat(discountAmount.toFixed(2)), 
            total: parseFloat(total.toFixed(2)),
            paymentMethod: currentInvoiceSettings.paymentMethod,
            paymentStatus: currentInvoiceSettings.paymentStatus, // Added payment status
            notes: currentInvoiceSettings.notes
        };

        // For local fallback (localStorage), we might still want to use a client-generated ID
        const localInvoice = {
            ...invoicePayload, 
            id: generateInvoiceNumber(), 
            reports: selectedReports.map(r => r.id), // Store only report IDs for local version for simplicity if needed
            createdAt: new Date().toISOString() 
        };
        
        // Try to save invoice to API
        let savedInvoice = null;
        try {
            // Check if apiService is defined and has createInvoice method
            if (typeof apiService !== 'undefined' && typeof apiService.createInvoice === 'function') {
                // Use ApiService to create invoice with proper report_id handling
                console.log('Calling createInvoice with payload:', invoicePayload);
                savedInvoice = await apiService.createInvoice(invoicePayload);
                
                // The first selected report is linked to the invoice via 'invoicePayload.report_id'.
                // The backend /api/reports/pending should filter out reports already linked to an invoice.
                // If multiple selected reports need to be marked (e.g., status change), that logic will be handled separately.
                if (savedInvoice && savedInvoice.id) {
                        // Successfully saved to API and got an ID back.
                    showToast('تم إنشاء الفاتورة بنجاح!', 'success');
                    
                    // Clear localStorage items since they've been processed
                    localStorage.removeItem('lpk_invoice_settings');
                    localStorage.removeItem('lpk_invoice_items');
                    
                    // Reset UI: Clear all checkboxes and the selected reports array
                    document.querySelectorAll('.report-checkbox').forEach(checkbox => {
                        checkbox.checked = false;
                    });
                    
                    // Clear the selectedReports array
                    selectedReports.length = 0;
                    
                    // Reset the selection counter
                    const selectCounter = document.getElementById('selectedReportsCount');
                    if (selectCounter) {
                        selectCounter.textContent = '0';
                    }
                    
                    // Update any UI that shows selected reports count
                    // (No selection UI update function needed - we've already updated counters and checkboxes)
                    
                    // Re-enable the create invoice button
                    const createInvoiceBtn = document.getElementById('createDirectInvoiceBtn');
                    if(createInvoiceBtn) {
                        createInvoiceBtn.disabled = false;
                        createInvoiceBtn.innerHTML = createInvoiceBtn.dataset.originalText || 'إنشاء فاتورة مباشرة';
                    }
                    
                    // Refresh reports after a short delay to allow backend to complete processing
                    setTimeout(() => {
                        loadReports();
                    }, 1000);
                } else if (typeof apiService !== 'undefined' && typeof apiService.saveInvoice === 'function') {
                    // This 'else if' means it was an API call but failed to return savedInvoice.id
                    console.warn('Invoice API call made, but no ID returned from backend. Cannot confirm report linkage via API for refresh.');
                }
                // If it fell back to localStorage, localInvoice.id is used, and loadReports() should also handle localStorage refresh.
            } else {
                throw new Error('API service not available');
            }
        } catch (apiError) {
            console.warn('Error saving invoice to API, falling back to localStorage:', apiError);
            // Fall back to localStorage if API fails
            
            // Get existing invoices
            const storedInvoices = localStorage.getItem('lpk_invoices');
            const invoices = storedInvoices ? JSON.parse(storedInvoices) : [];
            
            // Add new invoice (local version)
            invoices.push(localInvoice);
            
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
                            id: localInvoice.id
                        }
                    };
                }
                return report;
            });
            
            // Save updated reports to localStorage
            localStorage.setItem('lpk_reports', JSON.stringify(reports));
            
            // Create PDF
            const invoicePreviewContainer = document.getElementById('invoicePreviewContainer');
            if (invoicePreviewContainer) {
                const element = invoicePreviewContainer.cloneNode(true);
                
                // Add some styles for PDF
                const style = document.createElement('style');
                style.innerHTML = `
                    body {
                        font-family: 'Arial', sans-serif;
                        direction: rtl;
                    }
                    .invoice-container {
                        padding: 20px;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                    }
                    th, td {
                        border: 1px solid #ddd;
                        padding: 8px;
                    }
                    th {
                        background-color: #f2f2f2;
                    }
                    .text-end {
                        text-align: left;
                    }
                    .text-start {
                        text-align: right;
                    }
                    .text-center {
                        text-align: center;
                    }
                `;
                element.prepend(style);
                
                // Generate PDF
                html2pdf()
                    .set({
                        margin: [10, 10, 10, 10],
                        filename: `invoice_${localInvoice.id}.pdf`,
                        image: { type: 'jpeg', quality: 0.98 },
                        html2canvas: { scale: 2, useCORS: true },
                        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
                    })
                    .from(element)
                    .save();
            }
            
            savedInvoice = localInvoice; // Fallback uses the localInvoice structure
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
        // Use the ID from the saved invoice (API or local)
        window.currentInvoiceId = savedInvoice ? savedInvoice.id : generateInvoiceNumber();
        
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
    const invoicePreviewContainer = document.getElementById('invoicePreviewContainer');
    if (!invoicePreviewContainer || !invoicePreviewContainer.innerHTML.trim()) {
        showToast('لا يوجد محتوى لتصديره.', 'error');
        return;
    }

    const element = invoicePreviewContainer.querySelector('.invoice-container');
    if (!element) {
        showToast('لم يتم العثور على محتوى الفاتورة الفعلي للتصدير.', 'error');
        return;
    }

    console.log('Element for PDF export:', element);
    console.log('Element dimensions (W x H):', element.offsetWidth, 'x', element.offsetHeight);
    if (element.offsetWidth === 0 || element.offsetHeight === 0) {
        showToast('محتوى الفاتورة غير مرئي أو ليس له أبعاد للتصدير. قد يتم إنشاء ملف PDF فارغ.', 'warning');
        // We still try to export to see the error from html2pdf if any
    }

    const opt = {
        margin:       [0.5, 0.5, 0.5, 0.5], // inches
        filename:     `invoice-${generateInvoiceNumber()}.pdf`, // Generates a new dynamic name
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { logging: true, useCORS: true, scrollY: 0 }, // Simplified, explicitly set scrollY to 0 for now
        jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    const exportPdfBtn = document.getElementById('exportPdfBtn');
    const originalBtnText = exportPdfBtn.innerHTML;
    exportPdfBtn.disabled = true;
    exportPdfBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> جاري التصدير...';

    console.log('[exportToPdf] Final check - element.innerHTML before html2pdf call:', element.innerHTML);
    html2pdf().from(element).set(opt).save()
        .then(() => {
            showToast('تم تصدير الفاتورة بنجاح!', 'success');
        })
        .catch(err => {
            console.error('Error exporting PDF:', err);
            showToast('حدث خطأ أثناء تصدير الفاتورة. تحقق من وحدة التحكم.', 'error');
        })
        .finally(() => {
            exportPdfBtn.disabled = false;
            exportPdfBtn.innerHTML = originalBtnText;
        });
}

/**
 * Share invoice via email or WhatsApp
 * @param {string} method - Sharing method (email or whatsapp)
 */
function shareInvoice(method) {
    try {
        let clientName = 'عميلنا العزيز';
        let clientPhone = '';
        let clientEmail = '';

        // Attempt to get client details from localStorage (populated by generateInvoicePreview or saveInvoice)
        const storedInvoiceSettings = JSON.parse(localStorage.getItem('lpk_invoice_settings'));
        if (storedInvoiceSettings && storedInvoiceSettings.client_id) {
            const clientData = clientsData.find(c => c.id && c.id.toString() === storedInvoiceSettings.client_id.toString());
            if (clientData) {
                clientName = clientData.name || clientName;
                clientPhone = clientData.phone || '';
                clientEmail = clientData.email || '';
            }
        } else if (selectedReports.length > 0) {
            // Fallback to selected reports if no invoice settings in localStorage
            const firstReport = selectedReports[0]; // selectedReports now holds full objects
            if (firstReport) {
                clientName = firstReport.client_name || firstReport.clientName || clientName;
                clientPhone = firstReport.client_phone || firstReport.clientPhone || '';
                clientEmail = firstReport.client_email || firstReport.clientEmail || '';
            }
        }

        if (clientName === 'عميلنا العزيز' && selectedReports.length === 0 && !storedInvoiceSettings) {
            showToast('الرجاء تحديد تقرير أو إنشاء فاتورة أولاً لتحديد بيانات العميل.', 'warning');
            return;
        }

        const client = {
            name: clientName,
            phone: clientPhone,
            email: clientEmail
        };

        const invoiceId = document.getElementById('invoiceNumberPreview')?.textContent.replace('رقم الفاتورة: ', '').trim() || 
                          window.currentInvoiceId || 
                          generateInvoiceNumber();
        
        const invoiceUrl = `${window.location.origin}/invoice.html?id=${invoiceId}`; // Assuming invoice.html can take an ID
        
        const message = `مرحباً ${client.name || 'عميلنا الكريم'},\n\nنرفق لكم فاتورة الصيانة رقم ${invoiceId}.\n\nيمكنكم الاطلاع على الفاتورة من خلال الرابط التالي:\n${invoiceUrl}\n\nشكراً لتعاملكم مع شركة لاباك للصيانة.`;
        
        console.log('Sharing invoice via ' + method + ' with client:', client, 'Invoice ID:', invoiceId);
        
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
 * Load invoice templates from localStorage
 */
function loadInvoiceTemplates() {
    try {
        // Get templates from localStorage
        const storedTemplates = localStorage.getItem('lpk_invoice_templates');
        if (storedTemplates) {
            invoiceTemplates = JSON.parse(storedTemplates);
            
            // Update templates dropdown
            updateTemplatesDropdown();
        }
    } catch (error) {
        console.error('Error loading invoice templates:', error);
    }
}

/**
 * Update templates dropdown with saved templates
 */
function updateTemplatesDropdown() {
    const templatesList = document.getElementById('templatesList');
    if (!templatesList) return;
    
    // Get all template items (except header and save button)
    const templateItems = templatesList.querySelectorAll('li:not(:first-child):not(:last-child)');
    templateItems.forEach(item => item.remove());
    
    // Add divider if there are templates
    if (invoiceTemplates.length > 0) {
        const divider = document.createElement('li');
        divider.innerHTML = '<hr class="dropdown-divider">';
        templatesList.insertBefore(divider, templatesList.lastElementChild);
    }
    
    // Add templates to dropdown
    invoiceTemplates.forEach(template => {
        const templateItem = document.createElement('li');
        templateItem.innerHTML = `
            <div class="dropdown-item d-flex justify-content-between align-items-center">
                <span class="template-name">${template.name}</span>
                <div>
                    <button class="btn btn-sm btn-link p-0 me-2 load-template-btn" data-template-id="${template.id}">
                        <i class="fas fa-upload"></i>
                    </button>
                    <button class="btn btn-sm btn-link p-0 delete-template-btn" data-template-id="${template.id}">
                        <i class="fas fa-trash text-danger"></i>
                    </button>
                </div>
            </div>
        `;
        templatesList.insertBefore(templateItem, templatesList.lastElementChild);
        
        // Add event listeners for template buttons
        const loadBtn = templateItem.querySelector('.load-template-btn');
        if (loadBtn) {
            loadBtn.addEventListener('click', function() {
                loadTemplate(template.id);
            });
        }
        
        const deleteBtn = templateItem.querySelector('.delete-template-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', function() {
                deleteTemplate(template.id);
            });
        }
    });
}

/**
 * Save current settings as a template
 */
function saveAsTemplate() {
    // Prompt for template name
    const templateName = prompt('الرجاء إدخال اسم القالب:', invoiceSettings.title);
    
    if (!templateName) return; // User cancelled
    
    // Create template object
    const template = {
        id: 'template_' + Date.now(),
        name: templateName,
        settings: { ...invoiceSettings },
        createdAt: new Date().toISOString()
    };
    
    // Add to templates array
    invoiceTemplates.push(template);
    
    // Save to localStorage
    localStorage.setItem('lpk_invoice_templates', JSON.stringify(invoiceTemplates));
    
    // Update templates dropdown
    updateTemplatesDropdown();
    
    // Show success message
    showToast('تم حفظ القالب بنجاح', 'success');
}

/**
 * Load template by ID
 * @param {string} templateId - Template ID to load
 */
function loadTemplate(templateId) {
    // Find template
    const template = invoiceTemplates.find(t => t.id === templateId);
    if (!template) {
        showToast('لم يتم العثور على القالب', 'error');
        return;
    }
    
    // Apply template settings
    invoiceSettings = { ...template.settings };
    
    // Update form fields
    document.getElementById('invoiceTitle').value = invoiceSettings.title;
    document.getElementById('taxRate').value = invoiceSettings.taxRate;
    document.getElementById('discountRate').value = invoiceSettings.discountRate;
    document.getElementById('paymentMethod').value = invoiceSettings.paymentMethod;
    document.getElementById('paymentStatusSelect').value = invoiceSettings.paymentStatus; // Populate payment status
    document.getElementById('invoiceNotes').value = invoiceSettings.notes;
    
    // Show success message
    showToast('تم تحميل القالب بنجاح', 'success');
}

/**
 * Delete template by ID
 * @param {string} templateId - Template ID to delete
 */
function deleteTemplate(templateId) {
    // Confirm deletion
    if (!confirm('هل أنت متأكد من حذف هذا القالب؟')) {
        return;
    }
    
    // Remove from templates array
    invoiceTemplates = invoiceTemplates.filter(t => t.id !== templateId);
    
    // Save to localStorage
    localStorage.setItem('lpk_invoice_templates', JSON.stringify(invoiceTemplates));
    
    // Update templates dropdown
    updateTemplatesDropdown();
    
    // Show success message
    showToast('تم حذف القالب بنجاح', 'success');
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
