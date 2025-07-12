/**
 * Laapak Report System - Reports List Page JavaScript
 * Handles functionality for the reports listing page
 */

// Pagination settings
const REPORTS_PER_PAGE = 20;
let currentPage = 1;
let totalReports = 0;
let allReports = [];
let filteredReports = [];
let isFiltered = false;
let activeFilters = {
    searchTerm: '',
    dateFrom: '',
    dateTo: '',
    client: '',
    deviceType: '',
    status: ''
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
    
    // Initialize reports functionality
    initReports();
    
    // Initialize search form
    initSearchForm();
    
    // Initialize pagination
    initPagination();
    
    // Initialize search functionality
    initSearchFunctionality();
    
    // Initialize advanced filters
    initAdvancedFilters();
});

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
                
                // Populate filter dropdowns with unique values
                populateFilterDropdowns();
            }
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
 * @param {boolean} isFiltered - Whether this is filtered data
 */
function populateReportsTable(reports, updatePagination = true, isFiltered = false) {
    const reportsTableBody = document.getElementById('reportsTableBody');
    
    if (!reportsTableBody) return;
    
    // Store all reports for pagination (only if not filtered)
    if (updatePagination && !isFiltered) {
        allReports = reports;
        totalReports = reports.length;
        // Reset to first page when new data is loaded
        currentPage = 1;
        
        // Clear any existing filter summary
        const filterSummary = document.getElementById('filterSummary');
        if (filterSummary) {
            filterSummary.classList.add('d-none');
        }
    }
    
    // Clear existing rows
    reportsTableBody.innerHTML = '';
    
    // Check if reports array is empty
    if (!reports || reports.length === 0) {
                        const noDataRow = document.createElement('tr');
                noDataRow.innerHTML = `
                    <td colspan="6" class="text-center py-5">
                        <div class="empty-state">
                            <i class="fas fa-file-alt fa-3x mb-3 text-muted"></i>
                            <h5>لا توجد تقارير</h5>
                            <p class="text-muted">${isFiltered ? 'لم يتم العثور على تقارير تطابق البحث.' : 'لم يتم العثور على أي تقارير في قاعدة البيانات.'}</p>
                            ${!isFiltered ? `<a href="create-report.html" class="btn btn-primary mt-3">
                                <i class="fas fa-plus-circle me-2"></i> إنشاء تقرير جديد
                            </a>` : ''}
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
        console.log('🔍 [DEBUG] Calling updatePaginationControls from populateReportsTable');
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
            status: report.status || 'active' // Include status field
        };
        
        // Format date if available
        let formattedDate = 'غير محدد';
        if (mappedReport.inspectionDate) {
            const date = new Date(mappedReport.inspectionDate);
            const year = date.getFullYear();
            const month = ('0' + (date.getMonth() + 1)).slice(-2);
            const day = ('0' + date.getDate()).slice(-2);
            formattedDate = `${year}-${month}-${day}`;
        }
        
        // Get status badge class and text
        const statusBadge = getStatusBadge(mappedReport.status);
        
        console.log('🔍 [DEBUG] Table row status processing:', {
            reportId: mappedReport.id,
            originalStatus: report.status,
            mappedStatus: mappedReport.status,
            statusBadge: statusBadge
        });
        
        row.innerHTML = `
            <td>${mappedReport.orderNumber || 'غير محدد'}</td>
            <td>${mappedReport.clientName || 'غير محدد'}</td>
            <td>${mappedReport.deviceModel || 'غير محدد'}</td>
            <td>${formattedDate}</td>
            <td>${statusBadge}</td>
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
    
    // Cache reports for offline use (only if not filtered)
    if (!isFiltered) {
        cacheReports(reports);
    }
}

/**
 * Initialize search form functionality
 */
function initSearchForm() {
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
                    populateReportsTable(reports, true, true); // Pass true for updatePagination and true for isFiltered
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
    const paginationContainer = document.querySelector('nav[aria-label="Page navigation"]');
    if (!paginationContainer) return;
    
    const paginationUl = paginationContainer.querySelector('ul.pagination');
    if (!paginationUl) return;
    
    const prevPageBtn = paginationUl.querySelector('.page-item:first-child .page-link');
    const nextPageBtn = paginationUl.querySelector('.page-item:last-child .page-link');
    
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
    console.log('🔍 [DEBUG] updatePaginationControls called');
    console.log('🔍 [DEBUG] totalReports:', totalReports, 'currentPage:', currentPage);
    
    const paginationContainer = document.querySelector('nav[aria-label="Page navigation"]');
    if (!paginationContainer) {
        console.warn('Pagination container not found');
        return;
    }
    
    // Find the ul element inside the nav
    const paginationUl = paginationContainer.querySelector('ul.pagination');
    if (!paginationUl) {
        console.warn('Pagination ul not found');
        return;
    }
    
    // Calculate total pages
    const totalPages = Math.ceil(totalReports / REPORTS_PER_PAGE);
    
    // Clear existing page number buttons (keep prev/next buttons)
    const pageItems = paginationUl.querySelectorAll('.page-item');
    for (let i = 1; i < pageItems.length - 1; i++) {
        pageItems[i].remove();
    }
    
    // Get prev/next buttons
    const prevPageItem = paginationUl.querySelector('.page-item:first-child');
    const nextPageItem = paginationUl.querySelector('.page-item:last-child');
    
    // Ensure we have the basic pagination structure
    if (!prevPageItem || !nextPageItem) {
        console.warn('Pagination structure not found, recreating...');
        paginationUl.innerHTML = `
            <li class="page-item disabled">
                <a class="page-link" href="#" tabindex="-1" aria-disabled="true">السابق</a>
            </li>
            <li class="page-item active"><a class="page-link" href="#">1</a></li>
            <li class="page-item">
                <a class="page-link" href="#">التالي</a>
            </li>
        `;
        return;
    }
    
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
        
        // Safely insert before the next button
        try {
            paginationUl.insertBefore(pageItem, nextPageItem);
        } catch (error) {
            console.warn('Error inserting pagination item:', error);
            // Fallback: append to the end
            paginationUl.appendChild(pageItem);
        }
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
                
                // Populate filter dropdowns with cached data
                populateFilterDropdowns();
                
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
 * Share a report
 * @param {string} reportId - ID of the report to share
 */
function shareReport(reportId) {
    // Find the report data to get client information
    const report = allReports.find(r => r.id === reportId);
    
    if (!report) {
        alert('لم يتم العثور على بيانات التقرير');
        return;
    }
    
    // Get client information
    const clientPhone = report.client_phone || report.clientPhone || 'غير متوفر';
    const orderNumber = report.order_number || report.orderNumber || 'غير متوفر';
    
    // Create the report URL
    const reportUrl = `${window.location.origin}`;
    
    // Create the message to copy
    const message = `التقرير الخاص بحضرتك دلوقتي جاهز تقدر تشوف تفاصيله كامله دلوقتي من هنا
${reportUrl}

Username: ${clientPhone}
Password: ${orderNumber}`;
    
    // Copy to clipboard
    navigator.clipboard.writeText(message)
        .then(() => {
            // Show success message
            alert('تم نسخ رابط التقرير وبيانات الدخول إلى الحافظة');
        })
        .catch(error => {
            console.error('Error copying to clipboard:', error);
            
            // Fallback: show the message in a prompt
            prompt('انسخ النص التالي:', message);
        });
}

/**
 * Delete a report
 * @param {string} reportId - ID of the report to delete
 */
function deleteReport(reportId) {
    if (confirm('هل أنت متأكد من رغبتك في حذف هذا التقرير؟ سيتم حذف الفواتير المرتبطة أيضاً. لا يمكن التراجع عن هذا الإجراء.')) {
        // Show loading indicator
        const loadingIndicator = document.getElementById('loadingIndicator');
        if (loadingIndicator) {
            loadingIndicator.classList.remove('d-none');
        }
        
        // Delete report via API
        apiService.deleteReport(reportId)
            .then((response) => {
                console.log('🔍 [DEBUG] Report deletion response:', response);
                
                // Hide loading indicator
                if (loadingIndicator) {
                    loadingIndicator.classList.add('d-none');
                }
                
                // Show success message based on whether invoices were deleted
                let successMessage = 'تم حذف التقرير بنجاح';
                if (response && response.deletedInvoices > 0) {
                    successMessage += `\nتم حذف ${response.deletedInvoices} فاتورة مرتبطة`;
                } else {
                    successMessage += '\nلم تكن هناك فواتير مرتبطة';
                }
                
                // Show success alert
                alert(successMessage);
                
                // Refresh reports list
                initReports();
            })
            .catch(error => {
                console.error('❌ [DEBUG] Error deleting report:', error);
                
                // Hide loading indicator
                if (loadingIndicator) {
                    loadingIndicator.classList.add('d-none');
                }
                
                // Show error message
                alert('حدث خطأ أثناء حذف التقرير. يرجى المحاولة مرة أخرى لاحقًا.');
            });
    }
}

/**
 * Initialize search functionality
 */
function initSearchFunctionality() {
    const searchBox = document.getElementById('searchReport');
    
    if (searchBox) {
        // Add event listener for real-time search
        searchBox.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase().trim();
            filterReports(searchTerm);
        });
        
        // Add event listener for Enter key
        searchBox.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                const searchTerm = this.value.toLowerCase().trim();
                filterReports(searchTerm);
            }
        });
    }
}

/**
 * Filter reports based on search term
 * @param {string} searchTerm - The search term to filter by
 */
function filterReports(searchTerm) {
    // Update active filters
    activeFilters.searchTerm = searchTerm;
    
    // Apply all filters
    applyFilters();
}

/**
 * Reset report filters and search
 */
function resetReportFilters() {
    // Clear search box
    const searchBox = document.getElementById('searchReport');
    if (searchBox) {
        searchBox.value = '';
    }
    
    // Clear advanced filters
    clearAdvancedFilters();
    
    // Reset filter state
    activeFilters = {
        searchTerm: '',
        dateFrom: '',
        dateTo: '',
        client: '',
        deviceType: '',
        status: ''
    };
    isFiltered = false;
    filteredReports = [];
    
    // Reset to original data
    totalReports = allReports.length;
    currentPage = 1;
    
    // Repopulate table with all reports (not filtered)
    populateReportsTable(allReports, false, false);
    
    // Update pagination controls
    updatePaginationControls();
}

/**
 * Toggle advanced filters visibility
 */
function toggleAdvancedFilters() {
    const advancedFilters = document.getElementById('advancedFilters');
    const toggleButton = document.querySelector('button[onclick="toggleAdvancedFilters()"]');
    
    if (advancedFilters.classList.contains('d-none')) {
        advancedFilters.classList.remove('d-none');
        toggleButton.innerHTML = '<i class="fas fa-times me-2"></i>إخفاء الفلاتر';
        toggleButton.classList.remove('btn-outline-primary');
        toggleButton.classList.add('btn-outline-secondary');
    } else {
        advancedFilters.classList.add('d-none');
        toggleButton.innerHTML = '<i class="fas fa-filter me-2"></i>فلاتر متقدمة';
        toggleButton.classList.remove('btn-outline-secondary');
        toggleButton.classList.add('btn-outline-primary');
    }
}

/**
 * Initialize advanced filters
 */
function initAdvancedFilters() {
    // Initialize date filters with current month range
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const dateFrom = document.getElementById('dateFrom');
    const dateTo = document.getElementById('dateTo');
    
    if (dateFrom) {
        dateFrom.value = firstDayOfMonth.toISOString().split('T')[0];
    }
    if (dateTo) {
        dateTo.value = today.toISOString().split('T')[0];
    }
    
    // Add event listeners for real-time filtering
    if (dateFrom) {
        dateFrom.addEventListener('change', function() {
            activeFilters.dateFrom = this.value;
            applyFilters();
        });
    }
    
    if (dateTo) {
        dateTo.addEventListener('change', function() {
            activeFilters.dateTo = this.value;
            applyFilters();
        });
    }
    
    // Initialize client filter
    const clientFilter = document.getElementById('clientFilter');
    if (clientFilter) {
        clientFilter.addEventListener('change', function() {
            activeFilters.client = this.value;
            applyFilters();
        });
    }
    
    // Initialize device type filter
    const deviceTypeFilter = document.getElementById('deviceTypeFilter');
    if (deviceTypeFilter) {
        deviceTypeFilter.addEventListener('change', function() {
            activeFilters.deviceType = this.value;
            applyFilters();
        });
    }
    
    // Initialize status filter
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', function() {
            activeFilters.status = this.value;
            applyFilters();
        });
    }
}

/**
 * Clear advanced filters
 */
function clearAdvancedFilters() {
    const dateFrom = document.getElementById('dateFrom');
    const dateTo = document.getElementById('dateTo');
    const clientFilter = document.getElementById('clientFilter');
    const deviceTypeFilter = document.getElementById('deviceTypeFilter');
    const statusFilter = document.getElementById('statusFilter');
    
    if (dateFrom) dateFrom.value = '';
    if (dateTo) dateTo.value = '';
    if (clientFilter) clientFilter.value = '';
    if (deviceTypeFilter) deviceTypeFilter.value = '';
    if (statusFilter) statusFilter.value = '';
}

/**
 * Apply advanced filters (legacy function for button compatibility)
 */
function applyAdvancedFilters() {
    // Get filter values
    const dateFrom = document.getElementById('dateFrom')?.value || '';
    const dateTo = document.getElementById('dateTo')?.value || '';
    const client = document.getElementById('clientFilter')?.value || '';
    const deviceType = document.getElementById('deviceTypeFilter')?.value || '';
    const status = document.getElementById('statusFilter')?.value || '';
    const searchTerm = document.getElementById('searchReport')?.value || '';
    
    // Update active filters
    activeFilters = {
        searchTerm: searchTerm,
        dateFrom: dateFrom,
        dateTo: dateTo,
        client: client,
        deviceType: deviceType,
        status: status
    };
    
    // Apply filters
    applyFilters();
}

/**
 * Apply all active filters
 */
function applyFilters() {
    if (!allReports || allReports.length === 0) {
        return;
    }
    
    let filtered = allReports;
    
    // Apply search term filter
    if (activeFilters.searchTerm) {
        const searchTerm = activeFilters.searchTerm.toLowerCase().trim();
        filtered = filtered.filter(report => {
            const mappedReport = mapReportFields(report);
            return (
                (mappedReport.orderNumber && mappedReport.orderNumber.toLowerCase().includes(searchTerm)) ||
                (mappedReport.clientName && mappedReport.clientName.toLowerCase().includes(searchTerm)) ||
                (mappedReport.deviceModel && mappedReport.deviceModel.toLowerCase().includes(searchTerm)) ||
                (mappedReport.serialNumber && mappedReport.serialNumber.toLowerCase().includes(searchTerm)) ||
                (mappedReport.id && mappedReport.id.toString().toLowerCase().includes(searchTerm))
            );
        });
    }
    
    // Apply date range filter
    if (activeFilters.dateFrom || activeFilters.dateTo) {
        filtered = filtered.filter(report => {
            const mappedReport = mapReportFields(report);
            if (!mappedReport.inspectionDate) return false;
            
            const reportDate = new Date(mappedReport.inspectionDate);
            const fromDate = activeFilters.dateFrom ? new Date(activeFilters.dateFrom) : null;
            const toDate = activeFilters.dateTo ? new Date(activeFilters.dateTo) : null;
            
            if (fromDate && reportDate < fromDate) return false;
            if (toDate && reportDate > toDate) return false;
            
            return true;
        });
    }
    
    // Apply client filter
    if (activeFilters.client) {
        filtered = filtered.filter(report => {
            const mappedReport = mapReportFields(report);
            return mappedReport.clientName === activeFilters.client;
        });
    }
    
    // Apply device type filter
    if (activeFilters.deviceType) {
        filtered = filtered.filter(report => {
            const mappedReport = mapReportFields(report);
            return mappedReport.deviceModel === activeFilters.deviceType;
        });
    }
    
    // Apply status filter
    if (activeFilters.status) {
        filtered = filtered.filter(report => {
            const mappedReport = mapReportFields(report);
            return mappedReport.status === activeFilters.status;
        });
    }
    
    // Update filtered results
    filteredReports = filtered;
    isFiltered = true;
    totalReports = filtered.length;
    currentPage = 1;
    
    // Populate table with filtered results
    populateReportsTable(filtered, false, true);
    
    // Update pagination controls
    updatePaginationControls();
    
    // Show filter summary
    showFilterSummary();
}

/**
 * Map report fields to consistent format
 * @param {Object} report - Report object from API
 * @returns {Object} Mapped report object
 */
function mapReportFields(report) {
    return {
        id: report.id,
        orderNumber: report.order_number || report.orderNumber,
        clientName: report.client_name || report.clientName,
        deviceModel: report.device_model || report.deviceModel,
        inspectionDate: report.inspection_date || report.inspectionDate,
        serialNumber: report.serial_number || report.serialNumber,
        status: report.status || 'active' // Use status directly from API response
    };
}

/**
 * Show filter summary
 */
function showFilterSummary() {
    const filterSummary = document.getElementById('filterSummary');
    if (!filterSummary) {
        // Create filter summary element if it doesn't exist
        const summaryDiv = document.createElement('div');
        summaryDiv.id = 'filterSummary';
        summaryDiv.className = 'alert alert-info mt-3';
        summaryDiv.innerHTML = '';
        
        const cardBody = document.querySelector('.card-body');
        if (cardBody) {
            cardBody.appendChild(summaryDiv);
        }
    }
    
    const summary = document.getElementById('filterSummary');
    if (summary && isFiltered) {
        const activeFilterCount = Object.values(activeFilters).filter(v => v !== '').length;
        const totalCount = allReports.length;
        const filteredCount = filteredReports.length;
        
        let summaryText = `تم العثور على ${filteredCount} تقرير من أصل ${totalCount}`;
        
        if (activeFilterCount > 0) {
            summaryText += ` (${activeFilterCount} فلتر نشط)`;
        }
        
        summary.innerHTML = `
            <i class="fas fa-filter me-2"></i>
            ${summaryText}
            <button type="button" class="btn btn-sm btn-outline-secondary ms-2" onclick="resetReportFilters()">
                <i class="fas fa-times me-1"></i>مسح الفلاتر
            </button>
        `;
        summary.classList.remove('d-none');
    } else if (summary) {
        summary.classList.add('d-none');
    }
}

/**
 * Get status badge HTML for display
 * @param {string} status - Report status
 * @returns {string} HTML badge element
 */
function getStatusBadge(status) {
    console.log('🔍 [DEBUG] getStatusBadge called with status:', status);
    
    if (!status) return '<span class="badge bg-secondary">غير محدد</span>';
    
    const statusMap = {
        'completed': { class: 'bg-success', text: 'مكتمل' },
        'مكتمل': { class: 'bg-success', text: 'مكتمل' },
        'active': { class: 'bg-primary', text: 'في المخزن' },
        'في المخزن': { class: 'bg-primary', text: 'في المخزن' },
        'cancelled': { class: 'bg-danger', text: 'ملغي' },
        'ملغي': { class: 'bg-danger', text: 'ملغي' },
        'pending': { class: 'bg-warning', text: 'قيد الانتظار' },
        'in-progress': { class: 'bg-info', text: 'قيد التنفيذ' }
    };
    
    const statusInfo = statusMap[status] || { class: 'bg-secondary', text: status };
    console.log('🔍 [DEBUG] Status badge result:', statusInfo);
    
    return `<span class="badge ${statusInfo.class}">${statusInfo.text}</span>`;
}

/**
 * Populate filter dropdowns with unique values
 */
function populateFilterDropdowns() {
    if (!allReports || allReports.length === 0) return;
    
    console.log('🔍 [DEBUG] Populating filter dropdowns with reports:', allReports.length);
    console.log('🔍 [DEBUG] Sample report data:', allReports[0]);
    
    // Get unique clients
    const clients = [...new Set(allReports.map(report => {
        const mapped = mapReportFields(report);
        return mapped.clientName;
    }).filter(name => name))];
    
    // Get unique device types
    const deviceTypes = [...new Set(allReports.map(report => {
        const mapped = mapReportFields(report);
        return mapped.deviceModel;
    }).filter(type => type))];

    // Get unique statuses
    const statuses = [...new Set(allReports.map(report => {
        const mapped = mapReportFields(report);
        console.log('🔍 [DEBUG] Report status mapping:', { 
            original: report.status, 
            mapped: mapped.status 
        });
        return mapped.status;
    }).filter(status => status))];
    
    console.log('🔍 [DEBUG] Unique statuses found:', statuses);
    
    // Populate client filter
    const clientFilter = document.getElementById('clientFilter');
    if (clientFilter) {
        // Keep the "all clients" option
        clientFilter.innerHTML = '<option value="">جميع العملاء</option>';
        
        // Add unique clients
        clients.forEach(client => {
            const option = document.createElement('option');
            option.value = client;
            option.textContent = client;
            clientFilter.appendChild(option);
        });
    }
    
    // Populate device type filter
    const deviceTypeFilter = document.getElementById('deviceTypeFilter');
    if (deviceTypeFilter) {
        // Keep the "all devices" option
        deviceTypeFilter.innerHTML = '<option value="">جميع الأجهزة</option>';
        
        // Add unique device types
        deviceTypes.forEach(deviceType => {
            const option = document.createElement('option');
            option.value = deviceType;
            option.textContent = deviceType;
            deviceTypeFilter.appendChild(option);
        });
    }

    // Populate status filter
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        // Keep the "all statuses" option
        statusFilter.innerHTML = '<option value="">جميع الحالات</option>';

        // Define status mapping for display
            const statusDisplayMap = {
        'completed': 'مكتمل',
        'active': 'في المخزن',
        'cancelled': 'ملغي',
        'مكتمل': 'مكتمل',
        'في المخزن': 'في المخزن',
        'ملغي': 'ملغي',
        'pending': 'قيد الانتظار',
        'in-progress': 'قيد التنفيذ'
    };

        // Add unique statuses with proper Arabic labels
        statuses.forEach(status => {
            const option = document.createElement('option');
            option.value = status;
            option.textContent = statusDisplayMap[status] || status;
            statusFilter.appendChild(option);
        });
    }
}
