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
 * Format report status with appropriate badge
 * @param {string} status - The status string
 * @returns {string} HTML string with formatted status badge
 */
function formatReportStatus(status) {
    if (!status) return '<span class="badge bg-secondary">غير محدد</span>';
    
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
            badgeClass = 'bg-warning text-dark';
            statusText = 'قيد الانتظار';
            break;
        case 'in-progress':
        case 'قيد المعالجة':
            badgeClass = 'bg-info text-dark';
            statusText = 'قيد المعالجة';
            break;
        case 'cancelled':
        case 'ملغى':
            badgeClass = 'bg-danger';
            statusText = 'ملغى';
            break;
        case 'active':
        case 'نشط':
            badgeClass = 'bg-primary';
            statusText = 'قيد الانتظار';
            break;
        default:
            badgeClass = 'bg-secondary';
            statusText = status;
    }
    
    return `<span class="badge ${badgeClass}">${statusText}</span>`;
}

/**
 * Get invoice link for a report
 * @param {Object} report - The report object
 * @returns {string} HTML string with invoice link or status
 */
function getInvoiceLink(report) {
    // Check if report has billing enabled
    if (report.billing_enabled && report.amount > 0) {
        // Try to find associated invoice
        if (report.invoice_id) {
            const statusBadge = getInvoiceStatusBadge(report.invoice_status);
            return `<div class="d-flex flex-column gap-1">
                <a href="view-invoice.html?id=${report.invoice_id}" class="btn btn-sm btn-outline-primary">
                    <i class="fas fa-file-invoice me-1"></i>عرض الفاتورة
                </a>
                <small class="text-muted">${report.invoice_number || 'رقم الفاتورة غير محدد'}</small>
                ${statusBadge}
            </div>`;
        } else {
            return `<span class="badge bg-warning text-dark">
                <i class="fas fa-file-invoice me-1"></i>فاتورة مطلوبة
            </span>`;
        }
    } else {
        return `<span class="badge bg-secondary">
            <i class="fas fa-times me-1"></i>لا توجد فاتورة
        </span>`;
    }
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
            badgeClass = 'bg-success';
            statusText = 'مدفوع';
            break;
        case 'unpaid':
            badgeClass = 'bg-danger';
            statusText = 'غير مدفوع';
            break;
        case 'partial':
            badgeClass = 'bg-warning text-dark';
            statusText = 'مدفوع جزئياً';
            break;
        case 'overdue':
            badgeClass = 'bg-danger';
            statusText = 'متأخر';
            break;
        case 'draft':
            badgeClass = 'bg-secondary';
            statusText = 'مسودة';
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
            mappedReport.invoice_status = firstInvoice.status;
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
            <td class="text-center">${formatReportStatus(mappedReport.status)}</td>
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
 * Share a report
 * @param {string} reportId - ID of the report to share
 */
function shareReport(reportId) {
    const reportUrl = `${window.location.origin}/report.html?id=${reportId}`;
    
    // Check if Web Share API is available
    if (navigator.share) {
        navigator.share({
            title: 'تقرير صيانة Laapak',
            text: 'إليك تقرير الصيانة الخاص بجهازك',
            url: reportUrl
        })
        .then(() => console.log('Report shared successfully'))
        .catch(error => console.error('Error sharing report:', error));
    } else {
        // Fallback to clipboard
        navigator.clipboard.writeText(reportUrl)
            .then(() => {
                alert('تم نسخ رابط التقرير إلى الحافظة');
            })
            .catch(error => {
                console.error('Error copying report URL:', error);
                prompt('انسخ رابط التقرير أدناه:', reportUrl);
            });
    }
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
