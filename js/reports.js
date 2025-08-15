/**
 * Laapak Report System - Reports List Page JavaScript
 * Handles functionality for the reports listing page
 */

// Pagination settings
const REPORTS_PER_PAGE = 20;
let currentPage = 1;
let totalReports = 0;
let allReports = [];

document.addEventListener('DOMContentLoaded', function() {
    // Check if user is authenticated
    if (typeof authMiddleware !== 'undefined') {
        if (!authMiddleware.isAdminLoggedIn()) {
            window.location.href = 'index.html';
            return;
        }
    }
    
    // Initialize header component
    const header = new LpkHeader({
        containerId: 'header-container',
        activeItem: 'reports',
    });
    
    // Initialize reports functionality
    initReports();
    
    // Initialize search form
    initSearchForm();
    
    // Initialize pagination
    initPagination();
});

/**
 * Format report status with appropriate badge and quick edit functionality
 * @param {string} status - The status string
 * @param {string} reportId - The report ID for editing
 * @returns {string} HTML string with formatted status badge and edit functionality
 */
function formatReportStatus(status, reportId) {
    if (!status) status = 'قيد الانتظار';
    
    const statusLower = status.toLowerCase();
    let badgeClass = 'bg-secondary';
    let statusText = status;
    
    switch (statusLower) {
        case 'completed':
        case 'مكتمل':
            badgeClass = 'bg-success';
            statusText = 'مكتمل';
            break;
        case 'pending':
        case 'قيد الانتظار':
        case 'في المخزن':
        case 'active':
            badgeClass = 'bg-warning text-dark';
            statusText = 'قيد الانتظار';
            break;
        case 'cancelled':
        case 'ملغى':
        case 'canceled':
        case 'ملغي':
            badgeClass = 'bg-danger';
            statusText = 'ملغي';
            break;
        case 'in-progress':
        case 'قيد المعالجة':
            badgeClass = 'bg-info text-dark';
            statusText = 'قيد المعالجة';
            break;
        default:
            badgeClass = 'bg-secondary';
            statusText = status;
    }
    
    return `
        <div class="dropdown">
            <span class="badge ${badgeClass} status-badge rounded-pill px-3 py-2" 
                  data-bs-toggle="dropdown" 
                  data-report-id="${reportId}" 
                  style="cursor: pointer; font-size: 0.85rem; min-width: 100px; display: inline-flex; align-items: center; justify-content: center; gap: 5px;" 
                  title="انقر لتغيير الحالة">
                ${statusText}
                <i class="fas fa-chevron-down" style="font-size: 0.7em;"></i>
            </span>
            <ul class="dropdown-menu status-dropdown shadow-sm border-0" style="min-width: 200px;">
                <li><a class="dropdown-item status-option d-flex align-items-center py-2" href="#" data-status="قيد الانتظار" data-report-id="${reportId}">
                    <span class="badge bg-warning text-dark rounded-pill me-3" style="width: 20px; height: 20px; display: inline-flex; align-items: center; justify-content: center; font-size: 0.7rem;">⏳</span>
                    <span>قيد الانتظار</span>
                </a></li>
                <li><a class="dropdown-item status-option d-flex align-items-center py-2" href="#" data-status="مكتمل" data-report-id="${reportId}">
                    <span class="badge bg-success rounded-pill me-3" style="width: 20px; height: 20px; display: inline-flex; align-items: center; justify-content: center; font-size: 0.7rem;">✓</span>
                    <span>مكتمل</span>
                </a></li>
                <li><a class="dropdown-item status-option d-flex align-items-center py-2" href="#" data-status="ملغي" data-report-id="${reportId}">
                    <span class="badge bg-danger rounded-pill me-3" style="width: 20px; height: 20px; display: inline-flex; align-items: center; justify-content: center; font-size: 0.7rem;">✕</span>
                    <span>ملغي</span>
                </a></li>
            </ul>
        </div>
    `;
}

/**
 * Get invoice link for a report
 * @param {Object} report - The report object
 * @returns {string} HTML string with invoice link or status
 */
function getInvoiceLink(report) {
    // Check if report has invoices array
    if (report.invoices && Array.isArray(report.invoices) && report.invoices.length > 0) {
        // Get the first invoice (assuming one invoice per report for now)
        const invoice = report.invoices[0];
        const statusBadge = getInvoiceStatusBadge(invoice.paymentStatus);
        
        // Check if payment is completed
        const isCompleted = invoice.paymentStatus && (
            invoice.paymentStatus.toLowerCase() === 'completed' || 
            invoice.paymentStatus.toLowerCase() === 'paid' ||
            invoice.paymentStatus === 'مكتمل' ||
            invoice.paymentStatus === 'مدفوع'
        );
        
        if (isCompleted) {
            return `<div class="d-flex flex-column gap-1">
                <a href="view-invoice.html?id=${invoice.id}" class="btn btn-sm btn-success">
                    <i class="fas fa-file-invoice me-1"></i>عرض الفاتورة
                </a>
                                 <!-- ${statusBadge} -->

            </div>`;
        } else {
            return `<div class="d-flex flex-column gap-1">
                <a href="view-invoice.html?id=${invoice.id}" class="btn btn-sm btn-outline-primary">
                    <i class="fas fa-file-invoice me-1"></i>عرض الفاتورة
                </a>
                <!-- ${statusBadge} -->
            </div>`;
        }
    }
    
    // Check if report has invoice_id (direct invoice reference)
    if (report.invoice_id && report.invoice_id !== null) {
        const statusBadge = getInvoiceStatusBadge(report.invoice_status);
        
        // Check if payment is completed
        const isCompleted = report.invoice_status && (
            report.invoice_status.toLowerCase() === 'completed' || 
            report.invoice_status.toLowerCase() === 'paid' ||
            report.invoice_status === 'مكتمل' ||
            report.invoice_status === 'مدفوع'
        );
        
        if (isCompleted) {
            return `<div class="d-flex flex-column gap-1">
                <a href="view-invoice.html?id=${report.invoice_id}" class="btn btn-sm btn-success">
                    <i class="fas fa-file-invoice me-1"></i>عرض الفاتورة
                </a>
                <!-- ${statusBadge} -->
            </div>`;
        } else {
            return `<div class="d-flex flex-column gap-1">
                <a href="view-invoice.html?id=${report.invoice_id}" class="btn btn-sm btn-outline-primary">
                    <i class="fas fa-file-invoice me-1"></i>عرض الفاتورة
                </a>
                <!-- ${statusBadge} -->
            </div>`;
        }
    }
    
    // Check if report has invoice_created flag
    if (report.invoice_created === true && report.invoice_id) {
        const statusBadge = getInvoiceStatusBadge(report.invoice_status);
        
        // Check if payment is completed
        const isCompleted = report.invoice_status && (
            report.invoice_status.toLowerCase() === 'completed' || 
            report.invoice_status.toLowerCase() === 'paid' ||
            report.invoice_status === 'مكتمل' ||
            report.invoice_status === 'مدفوع'
        );
        
        if (isCompleted) {
            return `<div class="d-flex flex-column gap-1">
                <a href="view-invoice.html?id=${report.invoice_id}" class="btn btn-sm btn-success">
                    <i class="fas fa-file-invoice me-1"></i>عرض الفاتورة
                </a>
                <!-- ${statusBadge} -->
            </div>`;
        } else {
            return `<div class="d-flex flex-column gap-1">
                <a href="view-invoice.html?id=${report.invoice_id}" class="btn btn-sm btn-outline-primary">
                    <i class="fas fa-file-invoice me-1"></i>عرض الفاتورة
                </a>
                                <!-- ${statusBadge} -->

            </div>`;
        }
    }
    
    // Check if report has billing enabled but no invoice
    if (report.billing_enabled && report.amount > 0) {
        return `<span class="badge bg-warning text-dark">
            <i class="fas fa-file-invoice me-1"></i>فاتورة مطلوبة
        </span>`;
    }
    
    // No billing or invoice
    return `<span class="badge bg-secondary">
        <i class="fas fa-times me-1"></i>لا توجد فاتورة
    </span>`;
}

/**
 * Get invoice status badge
 * @param {string} status - The invoice status
 * @returns {string} HTML string with status badge
 */
function getInvoiceStatusBadge(status) {
    if (!status) return '';
    
    const statusLower = status.toLowerCase();
    let badgeClass = 'bg-secondary';
    let statusText = status;
    
    switch (statusLower) {
        case 'paid':
        case 'completed':
        case 'مدفوع':
        case 'مكتمل':
            badgeClass = 'bg-success';
            statusText = 'مدفوع';
            break;
        case 'unpaid':
        case 'pending':
        case 'غير مدفوع':
        case 'قيد الانتظار':
            badgeClass = 'bg-danger';
            statusText = 'غير مدفوع';
            break;
        case 'partial':
        case 'مدفوع جزئياً':
            badgeClass = 'bg-warning text-dark';
            statusText = 'مدفوع جزئياً';
            break;
        case 'overdue':
        case 'متأخر':
            badgeClass = 'bg-danger';
            statusText = 'متأخر';
            break;
        case 'draft':
        case 'مسودة':
            badgeClass = 'bg-secondary';
            statusText = 'مسودة';
            break;
        case 'cancelled':
        case 'canceled':
        case 'ملغي':
        case 'ملغى':
            badgeClass = 'bg-danger';
            statusText = 'ملغي';
            break;
        default:
            badgeClass = 'bg-secondary';
            statusText = status;
    }
    
    return `<span class="badge ${badgeClass} small">${statusText}</span>`;
}

/**
 * Initialize reports listing functionality
 */
function initReports() {
    const reportsTableBody = document.getElementById('reportsTableBody');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const errorContainer = document.getElementById('errorContainer');
    
    // Show loading indicator
    if (loadingIndicator) {
        loadingIndicator.classList.remove('d-none');
    }
    
    // First check if the server is reachable
    checkServerConnection()
        .then(isConnected => {
            if (!isConnected) {
                throw new Error('لا يمكن الاتصال بالخادم. الخادم غير متوفر حاليًا.');
            }
            
            // If connected, fetch reports from API
            return apiService.getReports({ fetch_mode: 'all_reports' });
        })
        .then(data => {
            // Hide loading indicator
            if (loadingIndicator) {
                loadingIndicator.classList.add('d-none');
            }
            
            // Clear any previous errors
            if (errorContainer) {
                errorContainer.classList.add('d-none');
            }
            
            // Check the format of the response
            let reports = [];
            if (Array.isArray(data)) {
                // If the response is an array, use it directly
                reports = data;
            } else if (data && typeof data === 'object') {
                // If the response is an object, check for reports property
                reports = data.reports || data.data || [];
            }
            
            console.log('Reports data:', reports);
            
            // Cache the reports for offline access
            cacheReports(reports);
            
            // Check if reports array is empty
            if (reports.length === 0) {
                // Show empty state message
                const reportsTableBody = document.getElementById('reportsTableBody');
                if (reportsTableBody) {
                    reportsTableBody.innerHTML = `
                        <tr>
                            <td colspan="5" class="text-center py-5">
                                <div class="empty-state">
                                    <i class="fas fa-file-alt fa-3x mb-3 text-muted"></i>
                                    <h5>لا توجد تقارير</h5>
                                    <p class="text-muted">لم يتم العثور على أي تقارير في قاعدة البيانات.</p>
                                    <a href="create-report.html" class="btn btn-primary mt-3">
                                        <i class="fas fa-plus-circle me-2"></i> إنشاء تقرير جديد
                                    </a>
                                </div>
                            </td>
                        </tr>
                    `;
                }
            } else {
                // Populate reports table with data
                populateReportsTable(reports);
            }
            
            // Add event listeners for status dropdown after populating table
            setupStatusDropdownListeners();
        })
        .catch(error => {
            console.error('Error fetching reports:', error);
            
            // Hide loading indicator
            if (loadingIndicator) {
                loadingIndicator.classList.add('d-none');
            }
            
            // Display more detailed error information
            let errorMsg = 'حدث خطأ أثناء تحميل التقارير: ';
            
            // Check if this is a database connection error
            if (error.message && (error.message.includes('database') || error.message.includes('connection'))) {
                errorMsg += 'لا يمكن الاتصال بقاعدة البيانات. يرجى التأكد من تشغيل خدمة MySQL.';
            } else if (error.message && error.message.includes('NetworkError')) {
                errorMsg += 'لا يمكن الاتصال بالخادم. يرجى التأكد من تشغيل خادم Node.js على المنفذ 3001.';
            } else if (error.message) {
                errorMsg += error.message;
            } else {
                errorMsg += 'خطأ غير معروف';
            }
            
            if (errorContainer) {
                errorContainer.innerHTML = errorMsg;
                errorContainer.classList.remove('d-none');
            }
            
            // Try to load from cache if available
            loadReportsFromCache();
        });
}

/**
 * Check if the server is reachable
 * @returns {Promise<boolean>} True if server is reachable, false otherwise
 */
async function checkServerConnection() {
    try {
        // Try to connect to the server with a timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        
        // Try to get apiService from different sources
        const service = typeof apiService !== 'undefined' ? apiService : 
                      (window && window.apiService) ? window.apiService : null;
        
        // Determine base URL safely
        const baseUrl = service && service.baseUrl ? service.baseUrl : 
                      (window.config && window.config.api && window.config.api.baseUrl) ? window.config.api.baseUrl :
                      'https://reports.laapak.com';
        
        // Try to connect to the server - use /api/reports since we know that endpoint exists
        const response = await fetch(`${baseUrl}/api/reports`, {
            method: 'GET',
            signal: controller.signal,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        clearTimeout(timeoutId);
        return response.ok;
    } catch (error) {
        console.error('Server connection check failed:', error);
        return false;
    }
}

/**
 * Populate the reports table with data
 * @param {Array} reports - Array of report objects
 * @param {boolean} updatePagination - Whether to update pagination controls
 */
function populateReportsTable(reports, updatePagination = true) {
    const reportsTableBody = document.getElementById('reportsTableBody');
    
    if (!reportsTableBody) return;
    
    // Store all reports for pagination
    if (updatePagination) {
        allReports = reports;
        totalReports = reports.length;
        // Reset to first page when new data is loaded
        currentPage = 1;
    }
    
    // Clear existing rows
    reportsTableBody.innerHTML = '';
    
    // Check if reports array is empty
    if (!reports || reports.length === 0) {
        const noDataRow = document.createElement('tr');
        noDataRow.innerHTML = `
            <td colspan="7" class="text-center py-5">
                <div class="empty-state">
                    <i class="fas fa-file-alt fa-3x mb-3 text-muted"></i>
                    <h5>لا توجد تقارير</h5>
                    <p class="text-muted">لم يتم العثور على أي تقارير في قاعدة البيانات.</p>
                    <a href="create-report.html" class="btn btn-primary mt-3">
                        <i class="fas fa-plus-circle me-2"></i> إنشاء تقرير جديد
                    </a>
                </div>
            </td>
        `;
        reportsTableBody.appendChild(noDataRow);
        
        // Hide pagination if no reports
        const paginationContainer = document.querySelector('nav[aria-label="Page navigation"]');
        if (paginationContainer) {
            paginationContainer.classList.add('d-none');
        }
        return;
    }
    
    // Show pagination if we have reports
    const paginationContainer = document.querySelector('nav[aria-label="Page navigation"]');
    if (paginationContainer) {
        paginationContainer.classList.remove('d-none');
    }
    
    // Calculate pagination
    const startIndex = (currentPage - 1) * REPORTS_PER_PAGE;
    const endIndex = Math.min(startIndex + REPORTS_PER_PAGE, reports.length);
    const paginatedReports = reports.slice(startIndex, endIndex);
    
    // Update pagination controls if needed
    if (updatePagination) {
        updatePaginationControls();
    }
    
    // Add report rows for current page only
    paginatedReports.forEach(report => {
        const row = document.createElement('tr');
        
        // Map backend field names to frontend expected names
        const mappedReport = {
            id: report.id,
            orderNumber: report.order_number || report.orderNumber,
            clientName: report.client_name || report.clientName,
            deviceModel: report.device_model || report.deviceModel,
            inspectionDate: report.inspection_date || report.inspectionDate,
            serialNumber: report.serial_number || report.serialNumber,
            status: report.status,
            billing_enabled: report.billing_enabled || false,
            amount: report.amount || 0,
            invoice_id: null // Will be set below if invoice exists
        };
        
        // Check if report has associated invoices
        if (report.invoices && Array.isArray(report.invoices) && report.invoices.length > 0) {
            // Get the first invoice (assuming one invoice per report for now)
            const firstInvoice = report.invoices[0];
            mappedReport.invoice_id = firstInvoice.id;
            mappedReport.invoice_number = firstInvoice.invoice_number;
            mappedReport.invoice_status = firstInvoice.paymentStatus; // Use paymentStatus instead of status
        }
        
        // Format date if available
        let formattedDate = 'غير محدد';
        if (mappedReport.inspectionDate) {
            const date = new Date(mappedReport.inspectionDate);
            const year = date.getFullYear();
            const month = ('0' + (date.getMonth() + 1)).slice(-2);
            const day = ('0' + date.getDate()).slice(-2);
            formattedDate = `${year}-${month}-${day}`;
        }
        
        // Add action buttons
        const actionsHtml = `
            <div class="btn-group btn-group-sm" role="group">
                <button type="button" class="btn btn-outline-primary" onclick="viewReport('${report.id}')" title="عرض التقرير">
                    <i class="fas fa-eye"></i>
                </button>
                <button type="button" class="btn btn-outline-warning" onclick="editReport('${report.id}')" title="تعديل التقرير">
                    <i class="fas fa-edit"></i>
                </button>
                <button type="button" class="btn btn-outline-danger" onclick="deleteReport('${report.id}')" title="حذف التقرير">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        row.innerHTML = `
            <td>${mappedReport.orderNumber || 'غير محدد'}</td>
            <td>${mappedReport.clientName || 'غير محدد'}</td>
            <td>${mappedReport.deviceModel || 'غير محدد'}</td>
            <td>${formattedDate}</td>
            <td class="text-center">${formatReportStatus(mappedReport.status, mappedReport.id)}</td>
            <td class="text-center">${getInvoiceLink(mappedReport)}</td>
            <td class="text-center">
                <div class="dropdown">
                    <button class="btn btn-sm btn-light rounded-circle p-1 border-0 shadow-sm" data-bs-toggle="dropdown" aria-expanded="false" style="width: 28px; height: 28px;">
                        <i class="fas fa-ellipsis-v" style="font-size: 12px;"></i>
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end shadow-sm">
                        <li><a class="dropdown-item py-2" href="report.html?id=${mappedReport.id}"><i class="fas fa-eye me-2 text-primary"></i> عرض</a></li>
                        <li><a class="dropdown-item py-2" href="edit-report.html?id=${mappedReport.id}"><i class="fas fa-edit me-2 text-success"></i> تعديل</a></li>
                        <li><a class="dropdown-item py-2" href="#" onclick="shareReport('${mappedReport.id}'); return false;"><i class="fas fa-share-alt me-2 text-info"></i> مشاركة</a></li>
                        <li><hr class="dropdown-divider"></li>
                        <li><a class="dropdown-item py-2" href="#" onclick="deleteReport('${mappedReport.id}'); return false;"><i class="fas fa-trash me-2 text-danger"></i> حذف</a></li>
                    </ul>
                </div>
            </td>
        `;
        
        reportsTableBody.appendChild(row);
    });
    
    // Cache reports for offline use
    cacheReports(reports);
}

/**
 * Initialize search form functionality
 */
function initSearchForm() {
    // Setup the minimal round search bar functionality
    setupMinimalSearchBar();
    
    // Keep the existing search form functionality for backward compatibility
    const searchForm = document.getElementById('searchForm');
    
    if (searchForm) {
        searchForm.addEventListener('submit', function(event) {
            event.preventDefault();
            
            // Get form values
            const formData = new FormData(searchForm);
            const searchParams = {};
            
            for (const [key, value] of formData.entries()) {
                if (value) {
                    searchParams[key] = value;
                }
            }
            
            // Show loading indicator
            const loadingIndicator = document.getElementById('loadingIndicator');
            if (loadingIndicator) {
                loadingIndicator.classList.remove('d-none');
            }
            
            // Search reports
            apiService.searchReports(searchParams)
                .then(reports => {
                    // Hide loading indicator
                    if (loadingIndicator) {
                        loadingIndicator.classList.add('d-none');
                    }
                    
                    // Populate table with results
                    populateReportsTable(reports);
                })
                .catch(error => {
                    console.error('Error searching reports:', error);
                    
                    // Hide loading indicator
                    if (loadingIndicator) {
                        loadingIndicator.classList.add('d-none');
                    }
                    
                    // Show error message
                    alert('حدث خطأ أثناء البحث عن التقارير. يرجى المحاولة مرة أخرى لاحقًا.');
                });
        });
    }
}

/**
 * Setup minimal round search bar functionality for reports
 */
function setupMinimalSearchBar() {
    const searchInput = document.getElementById('searchReport');
    const clearSearchBtn = document.getElementById('clearReportSearchBtn');
    
    if (!searchInput) return;
    
    // Search functionality
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.trim();
        
        // Show/hide clear button
        if (clearSearchBtn) {
            if (searchTerm.length > 0) {
                clearSearchBtn.classList.remove('d-none');
            } else {
                clearSearchBtn.classList.add('d-none');
            }
        }
        
        // Filter reports based on search term
        filterReportsBySearch(searchTerm);
        
        // Add visual feedback
        if (searchTerm.length > 0) {
            searchInput.style.backgroundColor = '#fff';
            searchInput.style.boxShadow = '0 0 0 0.2rem rgba(0, 117, 83, 0.15)';
        } else {
            searchInput.style.backgroundColor = '#f8f9fa';
            searchInput.style.boxShadow = '';
        }
    });
    
    // Clear search functionality
    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', function() {
            searchInput.value = '';
            searchInput.style.backgroundColor = '#f8f9fa';
            searchInput.style.boxShadow = '';
            clearSearchBtn.classList.add('d-none');
            
            // Reset to show all reports
            filterReportsBySearch('');
            
            searchInput.focus();
        });
    }
    
    // Handle Enter key
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            // Trigger search
            filterReportsBySearch(this.value.trim());
        }
    });
    
    // Focus management
    searchInput.addEventListener('focus', function() {
        this.style.backgroundColor = '#fff';
        this.style.boxShadow = '0 0 0 0.2rem rgba(0, 117, 83, 0.15)';
    });
    
    searchInput.addEventListener('blur', function() {
        if (this.value.trim().length === 0) {
            this.style.backgroundColor = '#f8f9fa';
            this.style.boxShadow = '';
        }
    });
}

/**
 * Filter reports based on search term
 * @param {string} searchTerm - The search term to filter by
 */
function filterReportsBySearch(searchTerm) {
    if (!allReports || allReports.length === 0) return;
    
    let filteredReports = allReports;
    
    if (searchTerm.length > 0) {
        const searchLower = searchTerm.toLowerCase();
        filteredReports = allReports.filter(report => {
            // Search in multiple fields
            const orderNumber = (report.order_number || report.orderNumber || '').toLowerCase();
            const clientName = (report.client_name || report.clientName || '').toLowerCase();
            const deviceModel = (report.device_model || report.deviceModel || '').toLowerCase();
            const serialNumber = (report.serial_number || report.serialNumber || '').toLowerCase();
            const status = (report.status || '').toLowerCase();
            
            return orderNumber.includes(searchLower) ||
                   clientName.includes(searchLower) ||
                   deviceModel.includes(searchLower) ||
                   serialNumber.includes(searchLower) ||
                   status.includes(searchLower);
        });
    }
    
    // Reset to first page when filtering
    currentPage = 1;
    
    // Populate table with filtered results
    populateReportsTable(filteredReports, false);
    
    // Update pagination for filtered results
    totalReports = filteredReports.length;
    updatePaginationControls();
    
    // Show search results count
    if (searchTerm.length > 0) {
        console.log(`Search results: ${filteredReports.length} of ${allReports.length} reports`);
    }
}

/**
 * Show error message in the error container
 * @param {string} message - Error message to display
 */
function showErrorMessage(message) {
    const errorContainer = document.getElementById('errorContainer');
    if (errorContainer) {
        errorContainer.innerHTML = message;
        errorContainer.classList.remove('d-none');
    }
}

/**
 * Initialize pagination functionality
 */
function initPagination() {
    // Get pagination elements
    const prevPageBtn = document.querySelector('.pagination .page-item:first-child .page-link');
    const nextPageBtn = document.querySelector('.pagination .page-item:last-child .page-link');
    
    // Add event listeners for pagination controls
    if (prevPageBtn) {
        prevPageBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (currentPage > 1) {
                currentPage--;
                populateReportsTable(allReports, false);
                updatePaginationControls();
            }
        });
    }
    
    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const totalPages = Math.ceil(totalReports / REPORTS_PER_PAGE);
            if (currentPage < totalPages) {
                currentPage++;
                populateReportsTable(allReports, false);
                updatePaginationControls();
            }
        });
    }
}

/**
 * Update pagination controls based on current page and total reports
 */
function updatePaginationControls() {
    const paginationContainer = document.querySelector('.pagination');
    if (!paginationContainer) return;
    
    // Calculate total pages
    const totalPages = Math.ceil(totalReports / REPORTS_PER_PAGE);
    
    // Clear existing page number buttons (keep prev/next buttons)
    const pageItems = paginationContainer.querySelectorAll('.page-item');
    for (let i = 1; i < pageItems.length - 1; i++) {
        pageItems[i].remove();
    }
    
    // Get prev/next buttons
    const prevPageItem = paginationContainer.querySelector('.page-item:first-child');
    const nextPageItem = paginationContainer.querySelector('.page-item:last-child');
    
    // Create page number buttons
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    // Adjust if we're near the end
    if (endPage - startPage + 1 < maxVisiblePages && startPage > 1) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    // Create page number elements
    for (let i = startPage; i <= endPage; i++) {
        const pageItem = document.createElement('li');
        pageItem.className = `page-item${i === currentPage ? ' active' : ''}`;
        
        const pageLink = document.createElement('a');
        pageLink.className = 'page-link';
        pageLink.href = '#';
        pageLink.textContent = i;
        
        // Add click event
        pageLink.addEventListener('click', function(e) {
            e.preventDefault();
            currentPage = i;
            populateReportsTable(allReports, false);
            updatePaginationControls();
        });
        
        pageItem.appendChild(pageLink);
        
        // Insert before the next button
        paginationContainer.insertBefore(pageItem, nextPageItem);
    }
    
    // Update prev/next button states
    if (prevPageItem) {
        if (currentPage <= 1) {
            prevPageItem.classList.add('disabled');
        } else {
            prevPageItem.classList.remove('disabled');
        }
    }
    
    if (nextPageItem) {
        if (currentPage >= totalPages) {
            nextPageItem.classList.add('disabled');
        } else {
            nextPageItem.classList.remove('disabled');
        }
    }
}

/**
 * Cache reports for offline access
 * @param {Array} reports - Array of report objects
 */
function cacheReports(reports) {
    if ('localStorage' in window) {
        localStorage.setItem('cachedReports', JSON.stringify(reports));
        localStorage.setItem('reportsLastUpdated', new Date().toISOString());
    }
}

/**
 * Load reports from cache when offline
 */
function loadReportsFromCache() {
    if ('localStorage' in window) {
        const cachedReports = localStorage.getItem('cachedReports');
        const lastUpdated = localStorage.getItem('reportsLastUpdated');
        
        if (cachedReports) {
            try {
                const reports = JSON.parse(cachedReports);
                populateReportsTable(reports);
                
                // Show offline notification
                const offlineAlert = document.getElementById('offlineAlert');
                if (offlineAlert) {
                    offlineAlert.classList.add('show');
                    
                    if (lastUpdated) {
                        const date = new Date(lastUpdated);
                        const formattedDate = date.toLocaleDateString('ar-SA', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                        });
                        
                        offlineAlert.innerHTML += ` آخر تحديث: ${formattedDate}`;
                    }
                }
            } catch (error) {
                console.error('Error parsing cached reports:', error);
            }
        }
    }
}

/**
 * Share a report via WhatsApp
 * @param {string} reportId - ID of the report to share
 */
function shareReport(reportId) {
    // Find the report in cached data to get client information
    const cachedReports = JSON.parse(localStorage.getItem('cachedReports') || '[]');
    const report = cachedReports.find(r => r.id == reportId);
    
    if (!report) {
        showToast('لم يتم العثور على بيانات التقرير', 'error');
        return;
    }
    
    // Get client phone number and order number
    const clientPhone = report.client_phone || report.client?.phone || '';
    const orderNumber = report.order_number || report.orderNumber || '';
    
    if (!clientPhone) {
        showToast('رقم هاتف العميل غير متوفر', 'error');
        return;
    }
    
    if (!orderNumber) {
        showToast('رقم الطلب غير متوفر', 'error');
        return;
    }
    
    // Format phone number for WhatsApp (remove any non-digit characters and ensure it starts with country code)
    let formattedPhone = clientPhone.replace(/\D/g, ''); // Remove non-digits
    
    // If phone doesn't start with country code, assume it's Egyptian (+20)
    if (!formattedPhone.startsWith('20') && formattedPhone.length === 11) {
        formattedPhone = '20' + formattedPhone;
    } else if (formattedPhone.length === 10) {
        formattedPhone = '20' + formattedPhone;
    }
    
    // Ensure it starts with country code
    if (!formattedPhone.startsWith('20')) {
        formattedPhone = '20' + formattedPhone;
    }
    
    // Create the message
    const message = `التقرير الخاص بحضرتك دلوقتي جاهز تقدر تشوف تفاصيله كامله دلوقتي من هنا
https://reports.laapak.com

Username: ${clientPhone}
Password: ${orderNumber}`;
    
    // Encode the message for URL
    const encodedMessage = encodeURIComponent(message);
    
    // Create WhatsApp URL
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
    
    // Open WhatsApp in new tab
    window.open(whatsappUrl, '_blank');
    
    // Show success message
    showToast('تم فتح واتساب مع العميل', 'success');
}

/**
 * Delete a report
 * @param {string} reportId - ID of the report to delete
 */
function deleteReport(reportId) {
    if (confirm('هل أنت متأكد من رغبتك في حذف هذا التقرير؟ لا يمكن التراجع عن هذا الإجراء.')) {
        // Show loading indicator
        const loadingIndicator = document.getElementById('loadingIndicator');
        if (loadingIndicator) {
            loadingIndicator.classList.remove('d-none');
        }
        
        // Delete report via API
        apiService.deleteReport(reportId)
            .then(() => {
                // Refresh reports list
                initReports();
            })
            .catch(error => {
                console.error('Error deleting report:', error);
                
                // Hide loading indicator
                if (loadingIndicator) {
                    loadingIndicator.classList.add('d-none');
                }
                
                // Show error message
                alert('حدث خطأ أثناء حذف التقرير. يرجى المحاولة مرة أخرى لاحقًا.');
            });
    }
}

// Function to edit a report
function editReport(reportId) {
    if (confirm('هل تريد تعديل هذا التقرير؟')) {
        window.location.href = `edit-report.html?id=${reportId}`;
    }
}

/**
 * Setup event listeners for status dropdown
 */
function setupStatusDropdownListeners() {
    // Add event listeners for status option clicks
    document.addEventListener('click', function(event) {
        if (event.target.closest('.status-option')) {
            event.preventDefault();
            const statusOption = event.target.closest('.status-option');
            const reportId = statusOption.dataset.reportId;
            const newStatus = statusOption.dataset.status;
            
            updateReportStatus(reportId, newStatus);
        }
    });
}

/**
 * Update report status via API
 * @param {string} reportId - The report ID
 * @param {string} newStatus - The new status
 * @param {boolean} skipInvoiceSync - Whether to skip invoice synchronization (to prevent loops)
 */
async function updateReportStatus(reportId, newStatus, skipInvoiceSync = false) {
    let statusBadge = null;
    let originalContent = '';
    
    try {
        console.log(`Updating report ${reportId} status to: ${newStatus}`);
        
        // Show loading state on the status badge
        statusBadge = document.querySelector(`[data-report-id="${reportId}"].status-badge`);
        if (statusBadge) {
            originalContent = statusBadge.innerHTML;
            statusBadge.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            statusBadge.disabled = true;
        }
        
        // Prepare the request data
        const requestData = { status: newStatus };
        console.log('Request data:', requestData);
        
        // Get auth token
        const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
        console.log('Auth token available:', !!token);
        
        if (!token) {
            throw new Error('No authentication token found');
        }
        
        // Update via API
        const response = await fetch(`https://reports.laapak.com/api/reports/${reportId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token
            },
            body: JSON.stringify(requestData)
        });
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Error response data:', errorData);
            throw new Error(errorData.message || errorData.error || `HTTP ${response.status}: Failed to update report status`);
        }
        
        const responseData = await response.json();
        console.log('Success response:', responseData);
        
        // Update the status badge with new status
        if (statusBadge) {
            const newStatusHtml = formatReportStatus(newStatus, reportId);
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = newStatusHtml;
            const newBadge = tempDiv.querySelector('.status-badge');
            if (newBadge) {
                statusBadge.className = newBadge.className;
                statusBadge.innerHTML = newBadge.innerHTML;
                statusBadge.dataset.reportId = reportId;
            }
            statusBadge.disabled = false;
        }
        
        // Handle status synchronization with linked invoices (only if not skipping)
        if (!skipInvoiceSync) {
            await handleReportInvoiceStatusSync(reportId, newStatus);
        }
        
        // Show success message
        const statusMessage = newStatus === 'ملغي' || newStatus === 'cancelled' ? 
            'تم إلغاء التقرير وتحديث حالة الفاتورة' : 
            'تم تحديث حالة التقرير بنجاح';
        showToast(statusMessage, 'success');
        
        // Update the cached reports data
        const cachedReports = JSON.parse(localStorage.getItem('cachedReports') || '[]');
        const reportIndex = cachedReports.findIndex(r => r.id == reportId);
        if (reportIndex !== -1) {
            cachedReports[reportIndex].status = newStatus;
            localStorage.setItem('cachedReports', JSON.stringify(cachedReports));
        }
        
    } catch (error) {
        console.error('Error updating report status:', error);
        
        // Restore original content on error
        if (statusBadge && originalContent) {
            statusBadge.innerHTML = originalContent;
            statusBadge.disabled = false;
        }
        
        showToast(`حدث خطأ أثناء تحديث حالة التقرير: ${error.message}`, 'error');
    }
}

/**
 * Handle status synchronization between reports and invoices
 * @param {string} reportId - The report ID
 * @param {string} newStatus - The new report status
 */
async function handleReportInvoiceStatusSync(reportId, newStatus) {
    try {
        console.log(`Starting invoice sync for report ${reportId} with status: ${newStatus}`);
        
        // Find the report in cached data to get invoice information
        const cachedReports = JSON.parse(localStorage.getItem('cachedReports') || '[]');
        console.log('Cached reports count:', cachedReports.length);
        
        const report = cachedReports.find(r => r.id == reportId);
        console.log('Found report:', report);
        
        if (!report) {
            console.log('Report not found in cache');
            return;
        }
        
        console.log('Report invoices:', report.invoices);
        console.log('Report invoice_id:', report.invoice_id);
        
        // Check for different invoice data structures
        let invoices = [];
        if (report.invoices && Array.isArray(report.invoices)) {
            invoices = report.invoices;
        } else if (report.invoice_id) {
            // Single invoice case
            invoices = [{ id: report.invoice_id, paymentStatus: report.invoice_status }];
        } else if (report.invoice) {
            // Direct invoice object
            invoices = [report.invoice];
        }
        
        console.log('Processed invoices:', invoices);
        
        if (invoices.length === 0) {
            console.log('No linked invoices found for report', reportId);
            return; // No linked invoices to update
        }
        
        // Map Arabic report status to invoice status
        let invoiceStatus = 'pending'; // Default to English for invoices
        
        switch (newStatus) {
            case 'مكتمل':
                invoiceStatus = 'completed';
                break;
            case 'ملغي':
            case 'ملغى':
            case 'cancelled':
            case 'canceled':
                invoiceStatus = 'cancelled';
                break;
            case 'قيد الانتظار':
            case 'قيد المعالجة':
            case 'pending':
            case 'in-progress':
            default:
                invoiceStatus = 'pending';
                break;
        }
        
        console.log(`Mapping report status '${newStatus}' to invoice status '${invoiceStatus}'`);
        
        // Update all linked invoices (only if status is different)
        let updatedInvoices = 0;
        for (const invoice of invoices) {
            if (invoice.id) {
                const currentInvoiceStatus = invoice.paymentStatus || 'pending';
                
                // Check if invoice status is already the target status
                if (currentInvoiceStatus.toLowerCase() === invoiceStatus.toLowerCase()) {
                    console.log(`Invoice ${invoice.id} already has status '${currentInvoiceStatus}', skipping update`);
                    continue;
                }
                
                // Check if invoice is already cancelled and we're trying to cancel it again
                if (invoiceStatus === 'cancelled' && 
                    (currentInvoiceStatus.toLowerCase() === 'cancelled' || 
                     currentInvoiceStatus.toLowerCase() === 'ملغي' || 
                     currentInvoiceStatus.toLowerCase() === 'ملغى')) {
                    console.log(`Invoice ${invoice.id} is already cancelled, skipping update`);
                    continue;
                }
                
                console.log(`Updating invoice ${invoice.id} status from ${currentInvoiceStatus} to ${invoiceStatus}`);
                await updateInvoiceStatus(invoice.id, invoiceStatus, true); // Skip report sync to prevent loops
                updatedInvoices++;
            }
        }
        
        console.log(`Synchronized ${updatedInvoices} invoices to status: ${invoiceStatus}`);
        
        // Only refresh if we actually updated any invoices
        if (updatedInvoices > 0) {
            // Refresh the reports table to show updated invoice status
            setTimeout(() => {
                initReports();
            }, 1000);
        }
        
    } catch (error) {
        console.error('Error synchronizing invoice status:', error);
        // Don't show error to user as this is a background sync
    }
}

/**
 * Update invoice status via API
 * @param {string} invoiceId - The invoice ID
 * @param {string} newStatus - The new status
 * @param {boolean} skipReportSync - Whether to skip report synchronization
 */
async function updateInvoiceStatus(invoiceId, newStatus, skipReportSync = false) {
    try {
        console.log(`Updating invoice ${invoiceId} status to: ${newStatus}`);
        
        // Get auth token
        const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
        if (!token) {
            throw new Error('No authentication token found for invoice update');
        }
        
        const response = await fetch(`https://reports.laapak.com/api/invoices/${invoiceId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token
            },
            body: JSON.stringify({ paymentStatus: newStatus })
        });
        
        console.log(`Invoice update response status: ${response.status}`);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Invoice update error response:', errorData);
            throw new Error(errorData.message || errorData.error || `HTTP ${response.status}: Failed to update invoice status`);
        }
        
        const responseData = await response.json();
        console.log(`Invoice ${invoiceId} status updated successfully to ${newStatus}:`, responseData);
        
    } catch (error) {
        console.error(`Error updating invoice ${invoiceId} status:`, error);
        throw error;
    }
}

/**
 * Show toast notification
 */
function showToast(message, type = 'info') {
    // Check if toastr is available
    if (typeof toastr !== 'undefined') {
        toastr[type](message);
    } else {
        // Fallback to alert
        alert(message);
    }
}
