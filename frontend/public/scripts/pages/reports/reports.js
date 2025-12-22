/**
 * Laapak Report System - Reports List Page JavaScript
 * Handles functionality for the reports listing page
 * 
 * Features:
 * - Reports are automatically sorted by inspection date (newest first)
 * - Real-time search and filtering
 * - Pagination support
 * - Status management with dropdown
 * - Invoice integration
 */

/**
 * Get API base URL from config or auto-detect
 * @returns {string} The API base URL
 */
function getApiBaseUrl() {
    if (window.config && window.config.api && window.config.api.baseUrl) {
        return window.config.api.baseUrl;
    }
    // Auto-detect based on hostname
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:3001';
    }
    return 'https://reports.laapak.com';
}

// Pagination settings - Load More style
const REPORTS_PER_PAGE = 20;
let displayedReportsCount = 0; // How many reports are currently displayed
let totalReports = 0;
let allReports = [];

// Filter state
let currentFilters = {
    startDate: null,
    endDate: null,
    status: '',
    invoiceStatus: '',
    period: 'month' // Default to current month
};

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
    
    // Initialize filters
    initFilters();
    
    // Initialize reports functionality
    initReports();
    
    // Initialize search form
    initSearchForm();
    
    // Initialize load more functionality
    initLoadMore();
});

/**
 * Format report status with appropriate badge and quick edit functionality
 * @param {string} status - The status string
 * @param {string} reportId - The report ID for editing
 * @returns {string} HTML string with formatted status badge and edit functionality
 */
function formatReportStatus(status, reportId) {
    if (!status) status = 'قيد الانتظار';
    
    // Trim whitespace and normalize
    const normalizedStatus = String(status).trim();
    const statusLower = normalizedStatus.toLowerCase();
    let badgeClass = 'bg-secondary';
    let statusText = normalizedStatus;
    
    // Check for completed status (both English and Arabic)
    if (statusLower === 'completed' || normalizedStatus === 'مكتمل') {
        badgeClass = 'bg-success';
        statusText = 'مكتمل';
    }
    // Check for pending status
    else if (statusLower === 'pending' || 
             normalizedStatus === 'قيد الانتظار' || 
             normalizedStatus === 'في المخزن' ||
             statusLower === 'active') {
        badgeClass = 'bg-warning text-dark';
        statusText = 'قيد الانتظار';
    }
    // Check for cancelled status
    else if (statusLower === 'cancelled' || 
             statusLower === 'canceled' ||
             normalizedStatus === 'ملغى' || 
             normalizedStatus === 'ملغي') {
        badgeClass = 'bg-danger';
        statusText = 'ملغي';
    }
    // Check for in-progress status
    else if (statusLower === 'in-progress' || 
             normalizedStatus === 'قيد المعالجة') {
        badgeClass = 'bg-info text-dark';
        statusText = 'قيد المعالجة';
    }
    // Default: keep original status
    else {
        badgeClass = 'bg-secondary';
        statusText = normalizedStatus;
    }
    
    return `
        <div class="dropdown">
            <span class="badge ${badgeClass} status-badge rounded-pill px-3 py-2" 
                  data-bs-toggle="dropdown" 
                  data-bs-boundary="viewport"
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
    // Priority 1: Check relatedInvoices (from backend association)
    let invoice = null;
    if (report.relatedInvoices && Array.isArray(report.relatedInvoices) && report.relatedInvoices.length > 0) {
        invoice = report.relatedInvoices[0];
    }
    // Priority 2: Check invoices array (legacy format)
    else if (report.invoices && Array.isArray(report.invoices) && report.invoices.length > 0) {
        invoice = report.invoices[0];
    }
    
    if (invoice) {
        const paymentStatus = invoice.paymentStatus || invoice.payment_status || invoice.status;
        
        // Check if payment is completed
        const isCompleted = paymentStatus && (
            paymentStatus.toLowerCase() === 'completed' || 
            paymentStatus.toLowerCase() === 'paid' ||
            paymentStatus === 'مكتمل' ||
            paymentStatus === 'مدفوع'
        );
        
        if (isCompleted) {
            return `<a href="view-invoice.html?id=${invoice.id}" class="btn btn-sm btn-success">
                <i class="fas fa-file-invoice me-1"></i>عرض الفاتورة
            </a>`;
        } else {
            return `<a href="view-invoice.html?id=${invoice.id}" class="btn btn-sm btn-outline-primary">
                <i class="fas fa-file-invoice me-1"></i>عرض الفاتورة
            </a>`;
        }
    }
    
    // Check if report has invoice_id (direct invoice reference)
    if (report.invoice_id && report.invoice_id !== null) {
        // Check if payment is completed
        const isCompleted = report.invoice_status && (
            report.invoice_status.toLowerCase() === 'completed' || 
            report.invoice_status.toLowerCase() === 'paid' ||
            report.invoice_status === 'مكتمل' ||
            report.invoice_status === 'مدفوع'
        );
        
        if (isCompleted) {
            return `<a href="view-invoice.html?id=${report.invoice_id}" class="btn btn-sm btn-success">
                <i class="fas fa-file-invoice me-1"></i>عرض الفاتورة
            </a>`;
        } else {
            return `<a href="view-invoice.html?id=${report.invoice_id}" class="btn btn-sm btn-outline-primary">
                <i class="fas fa-file-invoice me-1"></i>عرض الفاتورة
            </a>`;
        }
    }
    
    // Check if report has invoice_created flag
    if (report.invoice_created === true && report.invoice_id) {
        // Check if payment is completed
        const isCompleted = report.invoice_status && (
            report.invoice_status.toLowerCase() === 'completed' || 
            report.invoice_status.toLowerCase() === 'paid' ||
            report.invoice_status === 'مكتمل' ||
            report.invoice_status === 'مدفوع'
        );
        
        if (isCompleted) {
            return `<a href="view-invoice.html?id=${report.invoice_id}" class="btn btn-sm btn-success">
                <i class="fas fa-file-invoice me-1"></i>عرض الفاتورة
            </a>`;
        } else {
            return `<a href="view-invoice.html?id=${report.invoice_id}" class="btn btn-sm btn-outline-primary">
                <i class="fas fa-file-invoice me-1"></i>عرض الفاتورة
            </a>`;
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
 * Sort reports by date (newest first)
 * @param {Array} reports - Array of report objects
 * @returns {Array} Sorted array of reports
 */
function sortReportsByDate(reports) {
    if (!Array.isArray(reports)) return [];
    
    return reports.sort((a, b) => {
        // Get inspection dates from both reports
        const dateA = a.inspection_date || a.inspectionDate || a.created_at || a.createdAt || new Date(0);
        const dateB = b.inspection_date || b.inspectionDate || b.created_at || b.createdAt || new Date(0);
        
        // Convert to Date objects if they're strings
        const dateObjA = new Date(dateA);
        const dateObjB = new Date(dateB);
        
        // Sort by newest first (descending order)
        return dateObjB - dateObjA;
    });
}

/**
 * Initialize filters with default current month
 */
function initFilters() {
    // Set default to current month
    setCurrentMonthFilter();
    
    // Filter icon button toggle
    const filterIconBtn = document.getElementById('filterIconBtn');
    const filterDropdown = document.getElementById('filterDropdown');
    
    if (filterIconBtn && filterDropdown) {
        filterIconBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            const isVisible = filterDropdown.style.display !== 'none';
            filterDropdown.style.display = isVisible ? 'none' : 'block';
            
            // Add active state to button
            if (!isVisible) {
                filterIconBtn.classList.add('active');
            } else {
                filterIconBtn.classList.remove('active');
            }
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (filterDropdown && !filterDropdown.contains(e.target) && !filterIconBtn.contains(e.target)) {
                filterDropdown.style.display = 'none';
                filterIconBtn.classList.remove('active');
            }
        });
    }
    
    // Quick filter buttons
    const quickFilterBtns = document.querySelectorAll('.quick-filter-btn');
    quickFilterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove active class from all buttons
            quickFilterBtns.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            this.classList.add('active');
            
            const period = this.dataset.period;
            applyQuickFilter(period);
        });
    });
    
    // Apply filters button
    const applyFiltersBtn = document.getElementById('applyFiltersBtn');
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', function() {
            applyFilters();
            // Close dropdown after applying filters
            if (filterDropdown) {
                filterDropdown.style.display = 'none';
                if (filterIconBtn) {
                    filterIconBtn.classList.remove('active');
                }
            }
        });
    }
    
    // Reset filters button
    const resetFiltersBtn = document.getElementById('resetFiltersBtn');
    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', function() {
            resetFilters();
            // Close dropdown after resetting filters
            if (filterDropdown) {
                filterDropdown.style.display = 'none';
                if (filterIconBtn) {
                    filterIconBtn.classList.remove('active');
                }
            }
        });
    }
    
    // Update active filters count
    updateActiveFiltersCount();
}

/**
 * Set current month as default filter
 */
function setCurrentMonthFilter() {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    // Format dates as YYYY-MM-DD
    const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };
    
    currentFilters.startDate = formatDate(firstDay);
    currentFilters.endDate = formatDate(lastDay);
    currentFilters.period = 'month';
    
    console.log('=== CURRENT MONTH FILTER DEBUG ===');
    console.log('Current date:', now);
    console.log('Filter start date:', currentFilters.startDate);
    console.log('Filter end date:', currentFilters.endDate);
    console.log('First day object:', firstDay);
    console.log('Last day object:', lastDay);
    console.log('=== END CURRENT MONTH FILTER DEBUG ===');
    
    // Update date inputs
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    
    if (startDateInput) startDateInput.value = currentFilters.startDate;
    if (endDateInput) endDateInput.value = currentFilters.endDate;
}

/**
 * Apply quick filter (today, week, month, all)
 */
function applyQuickFilter(period) {
    const now = new Date();
    let startDate, endDate;
    
    switch (period) {
        case 'today':
            startDate = new Date(now);
            endDate = new Date(now);
            break;
        case 'week':
            const dayOfWeek = now.getDay();
            const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Monday
            startDate = new Date(now.setDate(diff));
            endDate = new Date(now);
            endDate.setDate(endDate.getDate() + 6); // Sunday
            break;
        case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            break;
        case 'all':
            startDate = null;
            endDate = null;
            break;
        default:
            return;
    }
    
    // Format dates
    const formatDate = (date) => {
        if (!date) return null;
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };
    
    currentFilters.startDate = formatDate(startDate);
    currentFilters.endDate = formatDate(endDate);
    currentFilters.period = period;
    
    // Update date inputs
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    
    if (startDateInput) startDateInput.value = currentFilters.startDate || '';
    if (endDateInput) endDateInput.value = currentFilters.endDate || '';
    
    // Apply filters
    applyFilters();
}

/**
 * Apply filters from form
 */
function applyFilters() {
    // Get filter values from form
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    const statusFilter = document.getElementById('statusFilter');
    const invoiceStatusFilter = document.getElementById('invoiceStatusFilter');
    
    currentFilters.startDate = startDateInput ? startDateInput.value : null;
    currentFilters.endDate = endDateInput ? endDateInput.value : null;
    currentFilters.status = statusFilter ? statusFilter.value : '';
    currentFilters.invoiceStatus = invoiceStatusFilter ? invoiceStatusFilter.value : '';
    
    // Update active filters count
    updateActiveFiltersCount();
    
    // Update title
    updateReportsTitle();
    
    // Reset to first page
    currentPage = 1;
    
    // Reload reports with filters
    initReports();
}

/**
 * Reset all filters to default (current month)
 * Made global for use in HTML onclick handlers
 */
window.resetFilters = function() {
    // Reset filter state
    currentFilters = {
        startDate: null,
        endDate: null,
        status: '',
        invoiceStatus: '',
        period: 'month'
    };
    
    // Set to current month
    setCurrentMonthFilter();
    
    // Reset form
    const statusFilter = document.getElementById('statusFilter');
    const invoiceStatusFilter = document.getElementById('invoiceStatusFilter');
    
    if (statusFilter) statusFilter.value = '';
    if (invoiceStatusFilter) invoiceStatusFilter.value = '';
    
    // Update quick filter buttons
    const quickFilterBtns = document.querySelectorAll('.quick-filter-btn');
    quickFilterBtns.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.period === 'month') {
            btn.classList.add('active');
        }
    });
    
    // Update active filters count
    updateActiveFiltersCount();
    
    // Update title
    updateReportsTitle();
    
    // Reset to first page
    currentPage = 1;
    
    // Reload reports
    initReports();
};

/**
 * Update active filters count badge
 */
function updateActiveFiltersCount() {
    let count = 0;
    
    if (currentFilters.startDate || currentFilters.endDate) count++;
    if (currentFilters.status) count++;
    if (currentFilters.invoiceStatus) count++;
    
    const badge = document.getElementById('activeFiltersCount');
    if (badge) {
        badge.textContent = count;
        // Show badge if count > 0, hide if 0
        if (count > 0) {
            badge.style.display = 'flex';
            badge.classList.remove('d-none');
        } else {
            badge.style.display = 'none';
            badge.classList.add('d-none');
        }
    }
}

/**
 * Update reports title based on active filters
 */
function updateReportsTitle() {
    const titleElement = document.getElementById('reportsTitle');
    if (!titleElement) return;
    
    let title = 'جميع التقارير';
    
    if (currentFilters.period === 'month') {
        title = 'تقارير هذا الشهر';
    } else if (currentFilters.period === 'week') {
        title = 'تقارير هذا الأسبوع';
    } else if (currentFilters.period === 'today') {
        title = 'تقارير اليوم';
    } else if (currentFilters.startDate || currentFilters.endDate) {
        title = 'التقارير المصفاة';
    }
    
    titleElement.textContent = title;
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
            
            // Build filter parameters
            const filterParams = {
                fetch_mode: 'all_reports'
            };
            
            // Don't send date filters to backend when period is 'month' (default)
            // We need ALL reports to filter client-side: pending (any date) + current month (any status)
            // Only send date filters if period is NOT 'month' (e.g., 'today', 'week', 'all', or custom range)
            if (currentFilters.period !== 'month') {
                if (currentFilters.startDate) {
                    filterParams.startDate = currentFilters.startDate;
                }
                if (currentFilters.endDate) {
                    filterParams.endDate = currentFilters.endDate;
                }
            }
            
            // Add status filter if set (but not when period is 'month' - we want all statuses)
            if (currentFilters.status && currentFilters.period !== 'month') {
                filterParams.status = currentFilters.status;
            }
            
            console.log('=== API REQUEST DEBUG ===');
            console.log('Filter params being sent:', filterParams);
            console.log('Current filters state:', currentFilters);
            console.log('Start date:', currentFilters.startDate);
            console.log('End date:', currentFilters.endDate);
            
            // If connected, fetch reports from API with filters
            return apiService.getReports(filterParams);
        })
        .catch(error => {
            // If server connection fails, try to load from cache first
            console.log('Server connection failed, attempting to load from cache...');
            const cachedReports = localStorage.getItem('cachedReports');
            if (cachedReports) {
                try {
                    const reports = JSON.parse(cachedReports);
                    console.log('Loaded reports from cache:', reports.length);
                    
                    // Hide loading indicator
                    if (loadingIndicator) {
                        loadingIndicator.classList.add('d-none');
                    }
                    
                    // Show offline notification
                    const offlineAlert = document.getElementById('offlineAlert');
                    if (offlineAlert) {
                        offlineAlert.classList.add('show');
                        offlineAlert.innerHTML = 'أنت تعمل في وضع عدم الاتصال. البيانات المعروضة من التخزين المحلي.';
                    }
                    
                    // Populate table with cached data
                    populateReportsTable(reports);
                    return; // Exit early
                } catch (cacheError) {
                    console.error('Error loading from cache:', cacheError);
                }
            }
            
            // If cache loading fails or no cache available, re-throw the original error
            throw error;
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
            
            console.log('=== REPORTS DEBUG ===');
            console.log('Total reports fetched:', reports.length);
            console.log('Current filters:', currentFilters);
            
            // Debug: Show status breakdown
            const statusBreakdown = {};
            reports.forEach(report => {
                const status = report.status || 'undefined';
                statusBreakdown[status] = (statusBreakdown[status] || 0) + 1;
            });
            console.log('Status breakdown:', statusBreakdown);
            
            // Debug: Show reports with pending status
            const pendingReports = reports.filter(r => {
                const rawStatus = r.status;
                const status = rawStatus || '';
                const statusLower = status.toLowerCase();
                return status === 'قيد الانتظار' || statusLower === 'pending' || statusLower === 'active';
            });
            console.log('Pending reports found:', pendingReports.length);
            if (pendingReports.length > 0) {
                console.log('Sample pending reports:', pendingReports.slice(0, 3).map(r => ({
                    id: r.id,
                    status: r.status,
                    inspection_date: r.inspection_date,
                    created_at: r.created_at,
                    order_number: r.order_number
                })));
            }
            
            // Debug: Show date information
            const reportsWithDates = reports.map(r => ({
                id: r.id,
                status: r.status,
                inspection_date: r.inspection_date,
                created_at: r.created_at,
                inRange: checkDateInRange(r, currentFilters.startDate, currentFilters.endDate)
            }));
            console.log('Date range check (first 5):', reportsWithDates.slice(0, 5));
            console.log('=== END REPORTS DEBUG ===');
            
            // Cache the reports for offline access
            cacheReports(reports);
            
            // Apply client-side filters (invoice status, etc.)
            let filteredReports = applyClientSideFilters(reports);
            
            // If no reports after filtering with current month, check if we should show all
            // This handles cases where reports are in different months/years
            if (filteredReports.length === 0 && currentFilters.period === 'month') {
                console.log('No reports found for current month, checking if we should show all reports...');
                
                // Check if there are any reports at all
                if (reports.length > 0) {
                    // Find the date range of all reports
                    const allDates = reports
                        .map(r => r.inspection_date || r.inspectionDate || r.created_at || r.createdAt)
                        .filter(d => d)
                        .map(d => new Date(d))
                        .filter(d => !isNaN(d.getTime()));
                    
                    if (allDates.length > 0) {
                        const minDate = new Date(Math.min(...allDates));
                        const maxDate = new Date(Math.max(...allDates));
                        
                        console.log(`Reports date range: ${minDate.toISOString()} to ${maxDate.toISOString()}`);
                        console.log(`Current month filter: ${currentFilters.startDate} to ${currentFilters.endDate}`);
                        
                        // If all reports are outside current month, suggest showing all
                        const currentMonthStart = new Date(currentFilters.startDate);
                        const currentMonthEnd = new Date(currentFilters.endDate + 'T23:59:59');
                        
                        if (maxDate < currentMonthStart || minDate > currentMonthEnd) {
                            console.log('All reports are outside current month range. Consider showing all reports.');
                            // Don't auto-change, but log the suggestion
                        }
                    }
                }
            }
            
            // Update reports count - filter by current month date range
            updateReportsCount(filteredReports.length, reports);
            
            // Check if reports array is empty
            if (filteredReports.length === 0) {
                // Show empty state message
                const reportsTableBody = document.getElementById('reportsTableBody');
                if (reportsTableBody) {
                    reportsTableBody.innerHTML = `
                        <tr>
                            <td colspan="7" class="text-center py-5">
                                <div class="empty-state">
                                    <i class="fas fa-file-alt fa-3x mb-3 text-muted"></i>
                                    <h5>لا توجد تقارير</h5>
                                    <p class="text-muted">لم يتم العثور على أي تقارير تطابق معايير التصفية المحددة.</p>
                                    <button class="btn btn-outline-primary mt-2" onclick="resetFilters()">
                                        <i class="fas fa-redo me-2"></i> إعادة تعيين التصفية
                                    </button>
                                    <a href="create-report.html" class="btn btn-primary mt-2">
                                        <i class="fas fa-plus-circle me-2"></i> إنشاء تقرير جديد
                                    </a>
                                </div>
                            </td>
                        </tr>
                    `;
                }
            } else {
                // Populate reports table with data
                populateReportsTable(filteredReports);
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
            let showRetryButton = false;
            
            // Check if this is a database connection error
            if (error.message && (error.message.includes('database') || error.message.includes('connection'))) {
                errorMsg += 'لا يمكن الاتصال بقاعدة البيانات. يرجى التأكد من تشغيل خدمة MySQL.';
                showRetryButton = true;
            } else if (error.message && error.message.includes('NetworkError')) {
                errorMsg += 'لا يمكن الاتصال بالخادم. يرجى التأكد من تشغيل خادم Node.js على المنفذ 3001.';
                showRetryButton = true;
            } else if (error.message && error.message.includes('timeout')) {
                errorMsg += 'انتهت مهلة الاتصال بالخادم. يرجى المحاولة مرة أخرى.';
                showRetryButton = true;
            } else if (error.message) {
                errorMsg += error.message;
                showRetryButton = true;
            } else {
                errorMsg += 'خطأ غير معروف';
                showRetryButton = true;
            }
            
            if (errorContainer) {
                errorContainer.innerHTML = `
                    <div class="d-flex justify-content-between align-items-center">
                        <span>${errorMsg}</span>
                        ${showRetryButton ? '<button class="btn btn-sm btn-outline-primary" onclick="initReports()">إعادة المحاولة</button>' : ''}
                    </div>
                `;
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
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        // Try to get apiService from different sources
        const service = typeof apiService !== 'undefined' ? apiService : 
                      (window && window.apiService) ? window.apiService : null;
        
        // Determine base URL safely
        const baseUrl = service && service.baseUrl ? service.baseUrl : 
                      (window.config && window.config.api && window.config.api.baseUrl) ? window.config.api.baseUrl :
                      'https://reports.laapak.com';
        
        console.log('Attempting to connect to:', baseUrl);
        
        // Try to connect to the server - use /api/health first, then fallback to /api/reports
        let response;
        try {
            response = await fetch(`${baseUrl}/api/health`, {
                method: 'GET',
                signal: controller.signal,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        } catch (healthError) {
            console.log('Health endpoint failed, trying reports endpoint...');
            // Fallback to reports endpoint
            response = await fetch(`${baseUrl}/api/reports`, {
                method: 'GET',
                signal: controller.signal,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        }
        
        clearTimeout(timeoutId);
        console.log('Server connection successful:', response.status);
        return response.ok;
    } catch (error) {
        console.error('Server connection check failed:', error);
        
        // Provide more specific error information
        if (error.name === 'AbortError') {
            console.log('Connection timed out after 10 seconds');
        } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
            console.log('Network error - server may be offline');
        }
        
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
    
    // Sort reports by date (newest first)
    const sortedReports = sortReportsByDate(reports);
    
    // Store all reports
    if (updatePagination) {
        allReports = sortedReports;
        totalReports = sortedReports.length;
        // Reset displayed count when new data is loaded
        displayedReportsCount = 0;
    }
    
    // Check if reports array is empty
    if (!reports || reports.length === 0) {
        // Clear existing rows
        reportsTableBody.innerHTML = '';
        
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
        
        // Hide load more button
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        if (loadMoreBtn) {
            loadMoreBtn.style.display = 'none';
        }
        return;
    }
    
    // Calculate how many reports to display
    let reportsToDisplay;
    let reportsToAdd;
    
    if (updatePagination) {
        // Reset: show first page
        displayedReportsCount = 0;
        reportsToDisplay = Math.min(REPORTS_PER_PAGE, reports.length);
        reportsToAdd = reports.slice(0, reportsToDisplay);
        displayedReportsCount = reportsToDisplay;
        
        // Clear existing rows when resetting
        reportsTableBody.innerHTML = '';
    } else {
        // Load more: append next batch
        const startIndex = displayedReportsCount;
        const endIndex = Math.min(displayedReportsCount + REPORTS_PER_PAGE, reports.length);
        reportsToAdd = reports.slice(startIndex, endIndex);
        displayedReportsCount = endIndex;
    }
    
    // Add report rows (append if loading more, replace if resetting)
    reportsToAdd.forEach(report => {
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
        
        // Check if report has associated invoices (check both invoices and relatedInvoices)
        let firstInvoice = null;
        
        // Priority 1: Check relatedInvoices (from backend association)
        if (report.relatedInvoices && Array.isArray(report.relatedInvoices) && report.relatedInvoices.length > 0) {
            firstInvoice = report.relatedInvoices[0];
            console.log('Using relatedInvoices for report', report.id, ':', firstInvoice);
        }
        // Priority 2: Check invoices array (legacy format)
        else if (report.invoices && Array.isArray(report.invoices) && report.invoices.length > 0) {
            firstInvoice = report.invoices[0];
            console.log('Using invoices array for report', report.id, ':', firstInvoice);
        }
        
        if (firstInvoice) {
            mappedReport.invoice_id = firstInvoice.id;
            mappedReport.invoice_number = firstInvoice.invoice_number || firstInvoice.id;
            mappedReport.invoice_status = firstInvoice.paymentStatus || firstInvoice.payment_status || firstInvoice.status;
            console.log('Set invoice status for report', report.id, ':', mappedReport.invoice_status);
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
        
        // Debug: Log status values to help diagnose issues
        if (mappedReport.status === 'completed' || mappedReport.status === 'مكتمل') {
            console.log(`[STATUS DEBUG] Report ${mappedReport.id} has status: "${mappedReport.status}" (type: ${typeof mappedReport.status})`);
        }
        
        row.innerHTML = `
            <td>${mappedReport.orderNumber || 'غير محدد'}</td>
            <td>${mappedReport.clientName || 'غير محدد'}</td>
            <td>${mappedReport.deviceModel || 'غير محدد'}</td>
            <td>${formattedDate}</td>
            <td class="text-center">${formatReportStatus(mappedReport.status, mappedReport.id)}</td>
            <td class="text-center">${getInvoiceLink(mappedReport)}</td>
            <td class="text-center">
                <div class="d-flex justify-content-center align-items-center gap-2">
                    <a href="report.html?id=${mappedReport.id}" class="btn btn-sm btn-outline-primary rounded-circle" title="عرض التقرير" style="width: 32px; height: 32px; display: inline-flex; align-items: center; justify-content: center; padding: 0;">
                        <i class="fas fa-eye" style="font-size: 12px;"></i>
                    </a>
                    <a href="create-report.html?id=${mappedReport.id}" class="btn btn-sm btn-outline-success rounded-circle" title="تعديل التقرير" style="width: 32px; height: 32px; display: inline-flex; align-items: center; justify-content: center; padding: 0;">
                        <i class="fas fa-edit" style="font-size: 12px;"></i>
                    </a>
                    <button type="button" class="btn btn-sm btn-outline-info rounded-circle" onclick="shareReport('${mappedReport.id}'); return false;" title="مشاركة التقرير" style="width: 32px; height: 32px; display: inline-flex; align-items: center; justify-content: center; padding: 0;">
                        <i class="fas fa-share-alt" style="font-size: 12px;"></i>
                    </button>
                    <button type="button" class="btn btn-sm btn-outline-danger rounded-circle" onclick="deleteReport('${mappedReport.id}'); return false;" title="حذف التقرير" style="width: 32px; height: 32px; display: inline-flex; align-items: center; justify-content: center; padding: 0;">
                        <i class="fas fa-trash" style="font-size: 12px;"></i>
                    </button>
                </div>
            </td>
        `;
        
        reportsTableBody.appendChild(row);
    });
    
    // Initialize Bootstrap dropdowns for newly added rows (status dropdowns)
    // Use approach similar to invoices.js but adapted for regular table (not DataTable)
    if (typeof bootstrap !== 'undefined') {
        const dropdownElementList = reportsTableBody.querySelectorAll('.status-badge[data-bs-toggle="dropdown"]');
        dropdownElementList.forEach(dropdownToggleEl => {
            // Only initialize if not already initialized
            if (!dropdownToggleEl._dropdown) {
                try {
                    const dropdownMenu = dropdownToggleEl.nextElementSibling;
                    const dropdownContainer = dropdownToggleEl.closest('.dropdown');
                    
                    if (dropdownMenu && dropdownMenu.classList.contains('dropdown-menu')) {
                        // Store original parent for restoration
                        dropdownMenu._originalParent = dropdownContainer;
                        dropdownMenu._toggleElement = dropdownToggleEl;
                        
                        // Move dropdown menu to body when shown to escape table constraints
                        dropdownToggleEl.addEventListener('show.bs.dropdown', function() {
                            // Move menu to body before Bootstrap positions it
                            if (dropdownMenu.parentNode !== document.body) {
                                document.body.appendChild(dropdownMenu);
                            }
                            dropdownMenu.style.zIndex = '9999';
                        });
                        
                        // Update position after Bootstrap positions it (if needed)
                        dropdownToggleEl.addEventListener('shown.bs.dropdown', function() {
                            // Ensure menu is in body and has high z-index
                            if (dropdownMenu.parentNode !== document.body) {
                                document.body.appendChild(dropdownMenu);
                            }
                            
                            // Get toggle button position
                            const toggleRect = dropdownToggleEl.getBoundingClientRect();
                            
                            // Position menu below toggle button, centered
                            dropdownMenu.style.position = 'fixed';
                            dropdownMenu.style.top = `${toggleRect.bottom + window.scrollY + 5}px`;
                            dropdownMenu.style.left = `${toggleRect.left + window.scrollX + (toggleRect.width / 2) - (dropdownMenu.offsetWidth / 2)}px`;
                            dropdownMenu.style.zIndex = '9999';
                            
                            // Adjust if menu goes off screen
                            const menuRect = dropdownMenu.getBoundingClientRect();
                            if (menuRect.right > window.innerWidth) {
                                dropdownMenu.style.left = `${window.innerWidth - menuRect.width - 10}px`;
                            }
                            if (menuRect.left < 0) {
                                dropdownMenu.style.left = '10px';
                            }
                        });
                        
                        // Move menu back to original position when hidden
                        dropdownToggleEl.addEventListener('hide.bs.dropdown', function() {
                            // Let Bootstrap handle the hide animation first
                        });
                        
                        dropdownToggleEl.addEventListener('hidden.bs.dropdown', function() {
                            // Move menu back to original parent
                            if (dropdownMenu._originalParent && dropdownMenu.parentNode === document.body) {
                                dropdownMenu._originalParent.appendChild(dropdownMenu);
                                dropdownMenu.style.position = '';
                                dropdownMenu.style.top = '';
                                dropdownMenu.style.left = '';
                                dropdownMenu.style.zIndex = '';
                            }
                        });
                        
                        // Initialize Bootstrap dropdown with viewport boundary
                        const dropdown = new bootstrap.Dropdown(dropdownToggleEl, {
                            boundary: 'viewport'
                        });
                        dropdownToggleEl._dropdown = dropdown;
                    } else {
                        // Fallback: simple initialization
                        const dropdown = new bootstrap.Dropdown(dropdownToggleEl, {
                            boundary: 'viewport'
                        });
                        dropdownToggleEl._dropdown = dropdown;
                    }
                } catch (error) {
                    console.warn('Error initializing status dropdown:', error);
                }
            }
        });
    }
    
    // Update load more button
    updateLoadMoreButton();
    
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
 * Check if a report's date is within the specified range
 */
function checkDateInRange(report, startDate, endDate) {
    const inspectionDate = report.inspection_date || report.inspectionDate;
    const createdDate = report.created_at || report.createdAt;
    const reportDate = inspectionDate || createdDate;
    
    if (!reportDate) return true; // Include reports without dates
    
    // Parse date consistently to avoid timezone issues
    let dateObj;
    if (typeof reportDate === 'string') {
        const dateStr = reportDate.split('T')[0]; // Get just the date part
        const [year, month, day] = dateStr.split('-').map(Number);
        if (year && month && day) {
            // Create date in local timezone to avoid UTC parsing issues
            dateObj = new Date(year, month - 1, day);
        } else {
            dateObj = new Date(reportDate);
        }
    } else {
        dateObj = new Date(reportDate);
    }
    
    if (isNaN(dateObj.getTime())) return true;
    
    dateObj.setHours(0, 0, 0, 0);
    
    if (startDate) {
        const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
        const start = new Date(startYear, startMonth - 1, startDay);
        start.setHours(0, 0, 0, 0);
        if (dateObj < start) return false;
    }
    
    if (endDate) {
        const [endYear, endMonth, endDay] = endDate.split('-').map(Number);
        const end = new Date(endYear, endMonth - 1, endDay);
        end.setHours(23, 59, 59, 999);
        if (dateObj > end) return false;
    }
    
    return true;
}

/**
 * Check if we're in default state (no filters applied)
 * @returns {boolean} True if in default state
 */
function isDefaultState() {
    // Default state: period is 'month' AND no status filter AND no invoice status filter
    // AND dates match current month (if dates are set)
    if (currentFilters.period !== 'month' || currentFilters.status || currentFilters.invoiceStatus) {
        return false;
    }
    
    // If dates are set, verify they match current month
    if (currentFilters.startDate && currentFilters.endDate) {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        
        const formatDate = (date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };
        
        const currentMonthStart = formatDate(firstDay);
        const currentMonthEnd = formatDate(lastDay);
        
        // Dates must match current month exactly
        if (currentFilters.startDate !== currentMonthStart || currentFilters.endDate !== currentMonthEnd) {
            return false; // Custom date range, not default state
        }
    }
    
    return true;
}

/**
 * Check if a report is pending
 * @param {Object} report - The report object
 * @returns {boolean} True if report is pending
 */
function isPendingReport(report) {
    const rawStatus = report.status || '';
    const status = rawStatus || '';
    const statusLower = status.toLowerCase();
    
    return status === 'قيد الانتظار' || 
           statusLower === 'pending' || 
           statusLower === 'active';
}

/**
 * Check if a report's date is within the specified range
 * @param {Object} report - The report object
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {boolean} True if report date is in range
 */
function isReportDateInRange(report, startDate, endDate) {
    const inspectionDate = report.inspection_date || report.inspectionDate;
    const createdDate = report.created_at || report.createdAt;
    const reportDate = inspectionDate || createdDate;
    
    if (!reportDate) return false;
    
    // Parse date consistently to avoid timezone issues
    let dateObj;
    if (typeof reportDate === 'string') {
        const dateStr = reportDate.split('T')[0]; // Get just the date part
        const [year, month, day] = dateStr.split('-').map(Number);
        if (year && month && day) {
            dateObj = new Date(year, month - 1, day);
        } else {
            dateObj = new Date(reportDate);
        }
    } else {
        dateObj = new Date(reportDate);
    }
    
    if (isNaN(dateObj.getTime())) return false;
    
    dateObj.setHours(0, 0, 0, 0);
    
    if (startDate) {
        const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
        const start = new Date(startYear, startMonth - 1, startDay);
        start.setHours(0, 0, 0, 0);
        if (dateObj < start) return false;
    }
    
    if (endDate) {
        const [endYear, endMonth, endDay] = endDate.split('-').map(Number);
        const end = new Date(endYear, endMonth - 1, endDay);
        end.setHours(23, 59, 59, 999);
        if (dateObj > end) return false;
    }
    
    return true;
}

/**
 * Apply client-side filters (invoice status, etc.)
 * @param {Array} reports - Array of reports to filter
 * @returns {Array} Filtered reports
 */
function applyClientSideFilters(reports) {
    console.log('=== CLIENT-SIDE FILTER DEBUG ===');
    console.log('Input reports count:', reports.length);
    console.log('Active filters:', currentFilters);
    console.log('Is default state:', isDefaultState());
    
    let filtered = [...reports];
    
    // Check if we're in default state
    const inDefaultState = isDefaultState();
    
    // Filter by invoice status (if applied, we're not in default state anymore)
    if (currentFilters.invoiceStatus) {
        switch (currentFilters.invoiceStatus) {
            case 'with_invoice':
                filtered = filtered.filter(report => {
                    return (report.relatedInvoices && report.relatedInvoices.length > 0) ||
                           (report.invoices && report.invoices.length > 0) || 
                           (report.invoice_id && report.invoice_id !== null) ||
                           (report.invoice_created === true);
                });
                break;
            case 'without_invoice':
                filtered = filtered.filter(report => {
                    return (!report.relatedInvoices || report.relatedInvoices.length === 0) &&
                           (!report.invoices || report.invoices.length === 0) && 
                           (!report.invoice_id || report.invoice_id === null) &&
                           (report.invoice_created !== true);
                });
                break;
            case 'paid':
                filtered = filtered.filter(report => {
                    // Check relatedInvoices first
                    if (report.relatedInvoices && report.relatedInvoices.length > 0) {
                        return report.relatedInvoices.some(inv => {
                            const status = inv.paymentStatus || inv.payment_status || inv.status;
                            return status && (
                                status.toLowerCase() === 'paid' || 
                                status.toLowerCase() === 'completed' ||
                                status === 'مدفوع' ||
                                status === 'مكتمل'
                            );
                        });
                    }
                    // Check invoices array (legacy)
                    if (report.invoices && report.invoices.length > 0) {
                        return report.invoices.some(inv => {
                            const status = inv.paymentStatus || inv.payment_status || inv.status;
                            return status && (
                                status.toLowerCase() === 'paid' || 
                                status.toLowerCase() === 'completed' ||
                                status === 'مدفوع' ||
                                status === 'مكتمل'
                            );
                        });
                    }
                    // Check invoice_status field
                    if (report.invoice_status) {
                        const status = report.invoice_status.toLowerCase();
                        return status === 'paid' || status === 'completed' || 
                               status === 'مدفوع' || status === 'مكتمل';
                    }
                    return false;
                });
                break;
            case 'unpaid':
                filtered = filtered.filter(report => {
                    // Check relatedInvoices first
                    if (report.relatedInvoices && report.relatedInvoices.length > 0) {
                        return report.relatedInvoices.some(inv => {
                            const status = inv.paymentStatus || inv.payment_status || inv.status;
                            return status && (
                                status.toLowerCase() === 'unpaid' || 
                                status.toLowerCase() === 'pending' ||
                                status === 'غير مدفوع' ||
                                status === 'قيد الانتظار'
                            );
                        });
                    }
                    // Check invoices array (legacy)
                    if (report.invoices && report.invoices.length > 0) {
                        return report.invoices.some(inv => {
                            const status = inv.paymentStatus || inv.payment_status || inv.status;
                            return status && (
                                status.toLowerCase() === 'unpaid' || 
                                status.toLowerCase() === 'pending' ||
                                status === 'غير مدفوع' ||
                                status === 'قيد الانتظار'
                            );
                        });
                    }
                    // Check invoice_status field
                    if (report.invoice_status) {
                        const status = report.invoice_status.toLowerCase();
                        return status === 'unpaid' || status === 'pending' || 
                               status === 'غير مدفوع' || status === 'قيد الانتظار';
                    }
                    return false;
                });
                break;
        }
    }
    
    // Filter by date range
    if (currentFilters.startDate || currentFilters.endDate) {
        const beforeDateFilter = filtered.length;
        
        console.log('=== DATE FILTER DEBUG ===');
        console.log('Filter start date:', currentFilters.startDate);
        console.log('Filter end date:', currentFilters.endDate);
        console.log('Filter period:', currentFilters.period);
        console.log('In default state:', inDefaultState);
        
        if (inDefaultState) {
            // DEFAULT STATE: Show all pending (any date) + all current month (any status)
            filtered = filtered.filter(report => {
                const pending = isPendingReport(report);
                
                if (pending) {
                    console.log(`Report ${report.id} (status: ${report.status}) is PENDING - INCLUDING (default state)`);
                    return true; // Always include pending reports regardless of date
                }
                
                // For non-pending reports, check if they're in current month
                if (currentFilters.startDate && currentFilters.endDate) {
                    const inCurrentMonth = isReportDateInRange(report, currentFilters.startDate, currentFilters.endDate);
                    if (inCurrentMonth) {
                        console.log(`Report ${report.id} (status: ${report.status}) is IN CURRENT MONTH - INCLUDING (default state)`);
                        return true; // Include reports in current month regardless of status
                    } else {
                        console.log(`Report ${report.id} (status: ${report.status}) is OUTSIDE CURRENT MONTH - EXCLUDING (default state)`);
                        return false;
                    }
                }
                
                return false;
            });
        } else {
            // FILTERS APPLIED: Apply date filter strictly
            filtered = filtered.filter(report => {
                // If no date filter, include all
                if (!currentFilters.startDate && !currentFilters.endDate) {
                    return true;
                }
                
                // Apply date filter strictly
                const inRange = isReportDateInRange(report, currentFilters.startDate, currentFilters.endDate);
                
                if (!inRange) {
                    console.log(`Report ${report.id} (status: ${report.status}) is OUTSIDE DATE RANGE - EXCLUDING (filter applied)`);
                }
                
                return inRange;
            });
        }
        
        console.log(`Date filter: ${beforeDateFilter} -> ${filtered.length} reports`);
        console.log('=== END DATE FILTER DEBUG ===');
    }
    
    // Filter by status (if applied, we're not in default state anymore)
    if (currentFilters.status) {
        const beforeStatusFilter = filtered.length;
        filtered = filtered.filter(report => {
            // Apply status filter strictly - only show reports matching the selected status
            const reportStatus = report.status || '';
            const matches = reportStatus === currentFilters.status;
            if (!matches) {
                console.log(`Report ${report.id} status '${reportStatus}' doesn't match filter '${currentFilters.status}' - EXCLUDING`);
            } else {
                console.log(`Report ${report.id} status '${reportStatus}' matches filter '${currentFilters.status}' - INCLUDING`);
            }
            return matches;
        });
        console.log(`Status filter: ${beforeStatusFilter} -> ${filtered.length} reports`);
    }
    
    // Final status breakdown
    const finalStatusBreakdown = {};
    filtered.forEach(report => {
        const status = report.status || 'undefined';
        finalStatusBreakdown[status] = (finalStatusBreakdown[status] || 0) + 1;
    });
    console.log('Final filtered status breakdown:', finalStatusBreakdown);
    console.log('Output reports count:', filtered.length);
    console.log('=== END CLIENT-SIDE FILTER DEBUG ===');
    
    return filtered;
}

/**
 * Update reports count display - only count reports within current month date range
 */
function updateReportsCount(count, allReports = []) {
    const countElement = document.getElementById('reportsCount');
    if (!countElement) return;
    
    // If we have allReports array, filter by current month date range
    let filteredCount = count;
    if (allReports && allReports.length > 0) {
        // Get current month date range
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        
        // Set time to start/end of day
        firstDay.setHours(0, 0, 0, 0);
        lastDay.setHours(23, 59, 59, 999);
        
        // Filter reports within current month
        filteredCount = allReports.filter(report => {
            // Get report date (prefer inspection_date, fallback to created_at)
            const reportDate = report.inspection_date || report.inspectionDate || report.created_at || report.createdAt;
            if (!reportDate) return false;
            
            const date = new Date(reportDate);
            date.setHours(0, 0, 0, 0);
            
            // Include pending/active reports regardless of date, or completed/cancelled within month
            // Only treat explicit pending status as pending (not null/empty)
            const rawStatus = report.status;
            const status = rawStatus || '';
            const statusLower = status.toLowerCase();
            const isPending = status === 'قيد الانتظار' || 
                            statusLower === 'pending' || 
                            statusLower === 'active';
            
            if (isPending) {
                return true; // Always include pending reports
            }
            
            // For completed/cancelled, check if within current month
            return date >= firstDay && date <= lastDay;
        }).length;
    }
    
    countElement.textContent = `(${filteredCount} ${filteredCount === 1 ? 'تقرير' : 'تقرير'})`;
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
            
            // Search in client phone number
            const clientPhone = (report.client && report.client.phone) ? report.client.phone.toLowerCase() : '';
            const clientEmail = (report.client && report.client.email) ? report.client.email.toLowerCase() : '';
            
            return orderNumber.includes(searchLower) ||
                   clientName.includes(searchLower) ||
                   deviceModel.includes(searchLower) ||
                   serialNumber.includes(searchLower) ||
                   status.includes(searchLower) ||
                   clientPhone.includes(searchLower) ||
                   clientEmail.includes(searchLower);
        });
    }
    
    // Apply client-side filters first
    filteredReports = applyClientSideFilters(filteredReports);
    
    // Sort filtered reports by date
    filteredReports = sortReportsByDate(filteredReports);
    
    // Reset displayed count when filtering
    displayedReportsCount = 0;
    
    // Update reports count - filter by current month date range
    updateReportsCount(filteredReports.length, allReports);
    
    // Populate table with filtered results (reset to show first page)
    populateReportsTable(filteredReports, true);
    
    // Update total for load more button
    totalReports = filteredReports.length;
    
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
 * Initialize Load More functionality
 */
function initLoadMore() {
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', function() {
            loadMoreReports();
        });
    }
}

/**
 * Load more reports
 */
function loadMoreReports() {
    if (!allReports || allReports.length === 0) return;
    
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    const loadMoreText = document.getElementById('loadMoreText');
    
    if (loadMoreBtn) {
        loadMoreBtn.disabled = true;
        if (loadMoreText) {
            loadMoreText.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i> جاري التحميل...';
        }
    }
    
    // Small delay for better UX
    setTimeout(() => {
        // Load more reports by appending to existing table
        populateReportsTable(allReports, false);
        
        // Re-enable button and restore text (updateLoadMoreButton will handle this)
        if (loadMoreBtn) {
            loadMoreBtn.disabled = false;
        }
        
        // Update button will restore the text
        updateLoadMoreButton();
    }, 300);
}

/**
 * Update Load More button visibility and text
 */
function updateLoadMoreButton() {
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    const loadMoreText = document.getElementById('loadMoreText');
    const loadMoreCount = document.getElementById('loadMoreCount');
    
    if (!loadMoreBtn) return;
    
    const remaining = totalReports - displayedReportsCount;
    
    if (remaining > 0) {
        // Show button if there are more reports to load
        loadMoreBtn.style.display = 'inline-flex';
        loadMoreBtn.classList.remove('d-none');
        loadMoreBtn.disabled = false;
        
        if (loadMoreText) {
            loadMoreText.textContent = 'تحميل المزيد';
        }
        
        if (loadMoreCount) {
            loadMoreCount.textContent = `(${remaining} متبقي)`;
        }
    } else {
        // Hide button if all reports are displayed
        loadMoreBtn.style.display = 'none';
        loadMoreBtn.classList.add('d-none');
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
                // Sort cached reports by date
                const sortedReports = sortReportsByDate(reports);
                populateReportsTable(sortedReports);
                
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
${getApiBaseUrl()}

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
        window.location.href = `create-report.html?id=${reportId}`;
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
        
        // Get API base URL
        const apiBaseUrl = getApiBaseUrl();
        
        // Update via API
        const response = await fetch(`${apiBaseUrl}/api/reports/${reportId}`, {
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
            // Wait a bit for backend to save the report update first
            await new Promise(resolve => setTimeout(resolve, 500));
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
        
        // Fetch fresh report data from backend to get latest invoice information
        let report = null;
        try {
            const reportResponse = await apiService.getReport(reportId);
            console.log('Raw report response:', reportResponse);
            
            // Handle different response formats
            if (reportResponse && reportResponse.report) {
                report = reportResponse.report;
            } else if (reportResponse && reportResponse.id) {
                report = reportResponse;
            } else if (reportResponse && reportResponse.success && reportResponse.report) {
                report = reportResponse.report;
            } else {
                report = reportResponse;
            }
            
            console.log('Fetched fresh report data:', report);
            console.log('Report keys:', Object.keys(report || {}));
            console.log('Report relatedInvoices (direct):', report?.relatedInvoices);
            console.log('Report relatedInvoices type:', typeof report?.relatedInvoices);
            console.log('Report relatedInvoices isArray:', Array.isArray(report?.relatedInvoices));
        } catch (fetchError) {
            console.error('Error fetching fresh report data, falling back to cache:', fetchError);
            // Fallback to cached data
            const cachedReports = JSON.parse(localStorage.getItem('cachedReports') || '[]');
            report = cachedReports.find(r => r.id == reportId);
        }
        
        if (!report) {
            console.log('Report not found in backend or cache');
            return;
        }
        
        console.log('Report invoices:', report.invoices);
        console.log('Report invoice_id:', report.invoice_id);
        console.log('Report relatedInvoices:', report.relatedInvoices);
        
        // Check for different invoice data structures - prioritize fresh data
        let invoices = [];
        
        // Check relatedInvoices (from backend association)
        if (report.relatedInvoices && Array.isArray(report.relatedInvoices) && report.relatedInvoices.length > 0) {
            invoices = report.relatedInvoices.map(inv => ({
                id: inv.id,
                paymentStatus: inv.paymentStatus
            }));
            console.log('Using relatedInvoices from backend:', invoices);
        }
        // Check invoices array
        else if (report.invoices && Array.isArray(report.invoices) && report.invoices.length > 0) {
            invoices = report.invoices.map(inv => ({
                id: inv.id || inv.invoiceId,
                paymentStatus: inv.paymentStatus || inv.payment_status
            }));
            console.log('Using invoices array:', invoices);
        }
        // Check invoice_id (direct reference)
        else if (report.invoice_id) {
            invoices = [{ 
                id: report.invoice_id, 
                paymentStatus: report.invoice_status || report.invoiceStatus || 'pending'
            }];
            console.log('Using invoice_id:', invoices);
        }
        // Check direct invoice object
        else if (report.invoice) {
            invoices = [{
                id: report.invoice.id || report.invoice.invoiceId,
                paymentStatus: report.invoice.paymentStatus || report.invoice.payment_status
            }];
            console.log('Using direct invoice object:', invoices);
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
        
        // Get API base URL
        const apiBaseUrl = getApiBaseUrl();
        
        // Prepare update data - always set paymentMethod to 'cash' when status changes
        const updateData = {
            paymentStatus: newStatus,
            paymentMethod: 'cash' // Auto-set payment method to cash when status is changed
        };
        
        console.log(`Updating invoice with data:`, updateData);
        
        const response = await fetch(`${apiBaseUrl}/api/invoices/${invoiceId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token
            },
            body: JSON.stringify(updateData)
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
