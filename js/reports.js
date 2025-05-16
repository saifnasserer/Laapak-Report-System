/**
 * Laapak Report System - Reports List Page JavaScript
 * Handles functionality for the reports listing page
 */

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
            return apiService.getReports();
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
        
        // Try to connect to the server - use /api/reports since we know that endpoint exists
        const response = await fetch(`${apiService.baseUrl}/api/reports`, {
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
 */
function populateReportsTable(reports) {
    const reportsTableBody = document.getElementById('reportsTableBody');
    
    if (!reportsTableBody) return;
    
    // Clear existing rows
    reportsTableBody.innerHTML = '';
    
    // Check if reports array is empty
    if (!reports || reports.length === 0) {
        const noDataRow = document.createElement('tr');
        noDataRow.innerHTML = `
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
        `;
        reportsTableBody.appendChild(noDataRow);
        return;
    }
    
    // Add report rows
    reports.forEach(report => {
        const row = document.createElement('tr');
        
        // Map backend field names to frontend expected names
        const mappedReport = {
            id: report.id,
            orderNumber: report.order_number || report.orderNumber,
            clientName: report.client_name || report.clientName,
            deviceModel: report.device_model || report.deviceModel,
            inspectionDate: report.inspection_date || report.inspectionDate,
            serialNumber: report.serial_number || report.serialNumber
        };
        
        // Format date if available
        let formattedDate = 'غير محدد';
        if (mappedReport.inspectionDate) {
            const date = new Date(mappedReport.inspectionDate);
            formattedDate = date.toLocaleDateString('ar-SA', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            }).replace(/\//g, '-');
        }
        
        row.innerHTML = `
            <td>${mappedReport.orderNumber || 'غير محدد'}</td>
            <td>${mappedReport.clientName || 'غير محدد'}</td>
            <td>${mappedReport.deviceModel || 'غير محدد'}</td>
            <td>${formattedDate}</td>
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
