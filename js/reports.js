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
    
    // Fetch reports from API
    apiService.getReports()
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
            
            // Populate reports table
            populateReportsTable(reports);
        })
        .catch(error => {
            console.error('Error fetching reports:', error);
            
            // Hide loading indicator
            if (loadingIndicator) {
                loadingIndicator.classList.add('d-none');
            }
            
            // Show error message with more details
            if (errorContainer) {
                let errorMessage = 'حدث خطأ أثناء تحميل التقارير. يرجى المحاولة مرة أخرى لاحقًا.';
                
                // Add more specific error information if available
                if (error && error.message) {
                    errorMessage += '<br><small class="text-muted mt-2">تفاصيل الخطأ: ' + error.message + '</small>';
                    
                    // Add connection troubleshooting tips
                    errorMessage += '<div class="mt-3 small">';
                    errorMessage += '<strong>اقتراحات للحل:</strong><ul>';
                    errorMessage += '<li>تأكد من تشغيل خادم الواجهة الخلفية على المنفذ 3001</li>';
                    errorMessage += '<li>تحقق من اتصال الشبكة</li>';
                    errorMessage += '<li>تأكد من تكوين API الصحيح</li>';
                    errorMessage += '</ul></div>';
                }
                
                errorContainer.innerHTML = errorMessage;
                errorContainer.classList.remove('d-none');
            }
            
            // Try to load from cache if available
            loadReportsFromCache();
        });
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
    
    // Check if we have reports
    if (reports.length === 0) {
        const noDataRow = document.createElement('tr');
        noDataRow.innerHTML = `
            <td colspan="5" class="text-center py-4">
                <div class="empty-state">
                    <i class="fas fa-file-alt fa-3x text-muted mb-3"></i>
                    <h5>لا توجد تقارير</h5>
                    <p class="text-muted">لم يتم العثور على أي تقارير. يمكنك إنشاء تقرير جديد من خلال النقر على زر "إنشاء تقرير جديد".</p>
                </div>
            </td>
        `;
        reportsTableBody.appendChild(noDataRow);
        return;
    }
    
    // Add report rows
    reports.forEach(report => {
        const row = document.createElement('tr');
        
        // Format date if available
        let formattedDate = 'غير محدد';
        if (report.inspectionDate) {
            const date = new Date(report.inspectionDate);
            formattedDate = date.toLocaleDateString('ar-SA', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            }).replace(/\//g, '-');
        }
        
        row.innerHTML = `
            <td>${report.orderNumber || 'غير محدد'}</td>
            <td>${report.clientName || 'غير محدد'}</td>
            <td>${report.deviceModel || 'غير محدد'}</td>
            <td>${formattedDate}</td>
            <td class="text-center">
                <div class="dropdown">
                    <button class="btn btn-sm btn-light rounded-circle p-1 border-0 shadow-sm" data-bs-toggle="dropdown" aria-expanded="false" style="width: 28px; height: 28px;">
                        <i class="fas fa-ellipsis-v" style="font-size: 12px;"></i>
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end shadow" style="border-radius: 10px; border: none;">
                        <li><a class="dropdown-item py-2" href="report.html?id=${report.id}"><i class="fas fa-eye me-2 text-primary"></i> عرض</a></li>
                        <li><a class="dropdown-item py-2" href="create-report.html?edit=${report.id}"><i class="fas fa-edit me-2 text-warning"></i> تعديل</a></li>
                        <li><a class="dropdown-item py-2" href="#" onclick="shareReport('${report.id}'); return false;"><i class="fas fa-share-alt me-2 text-success"></i> مشاركة</a></li>
                        <li><hr class="dropdown-divider"></li>
                        <li><a class="dropdown-item py-2" href="#" onclick="deleteReport('${report.id}'); return false;"><i class="fas fa-trash me-2 text-danger"></i> حذف</a></li>
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
        searchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form values
            const searchQuery = this.querySelector('input[type="text"]').value.trim();
            const deviceType = this.querySelector('select').value;
            const fromDate = this.querySelector('input[type="date"]:nth-of-type(1)').value;
            const toDate = this.querySelector('input[type="date"]:nth-of-type(2)').value;
            
            // Build filters object
            const filters = {};
            if (searchQuery) filters.query = searchQuery;
            if (deviceType) filters.deviceType = deviceType;
            if (fromDate) filters.fromDate = fromDate;
            if (toDate) filters.toDate = toDate;
            
            // Show loading indicator
            const loadingIndicator = document.getElementById('loadingIndicator');
            if (loadingIndicator) {
                loadingIndicator.classList.remove('d-none');
            }
            
            // Fetch filtered reports
            apiService.getReports(filters)
                .then(data => {
                    // Hide loading indicator
                    if (loadingIndicator) {
                        loadingIndicator.classList.add('d-none');
                    }
                    
                    // Populate reports table
                    populateReportsTable(data.reports || []);
                })
                .catch(error => {
                    console.error('Error fetching filtered reports:', error);
                    
                    // Hide loading indicator
                    if (loadingIndicator) {
                        loadingIndicator.classList.add('d-none');
                    }
                    
                    // Show error message
                    const errorContainer = document.getElementById('errorContainer');
                    if (errorContainer) {
                        errorContainer.textContent = 'حدث خطأ أثناء تحميل التقارير المصفاة. يرجى المحاولة مرة أخرى لاحقًا.';
                        errorContainer.classList.remove('d-none');
                    }
                });
        });
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
