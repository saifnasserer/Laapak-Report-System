/**
 * Laapak Report System - Admin Dashboard JavaScript
 * Handles functionality specific to the admin dashboard
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('Admin dashboard loaded');
    // Check if admin is authenticated
    checkAdminAuth();
    
    // Test API connectivity first
    testAPIConnectivity();
    
    // Test goals API specifically
    testGoalsAPI();
    
    // Load dashboard data from API
    displayCurrentDate();
    loadTodaySummary();
    loadDashboardStats();
    initializeCharts();
    loadReportsStatusChart();
    loadDeviceModelsInsights();
    loadWarrantyAlerts();
    
    // Initialize device models filter
    initializeDeviceModelsFilter();
});

/**
 * Format date to Arabic locale string
 */
function formatArabicDate(date) {
    if (!date) return '';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(date).toLocaleDateString('ar-EG', options);
}

/**
 * Initialize device models filter dropdown
 */
function initializeDeviceModelsFilter() {
    const filterBtn = document.getElementById('deviceModelsFilterBtn');
    const filterMenu = document.getElementById('deviceModelsFilterMenu');
    const customDateRange = document.getElementById('device-models-custom-date-range');
    const applyCustomDateBtn = document.getElementById('device-models-apply-custom-date');
    
    if (!filterMenu) return;
    
    // Handle period selection
    filterMenu.addEventListener('click', function(e) {
        e.preventDefault();
        const periodItem = e.target.closest('[data-period]');
        if (!periodItem) return;
        
        const period = periodItem.getAttribute('data-period');
        const filterTextEl = document.getElementById('device-models-filter-text');
        
        // Update filter button text
        const periodTexts = {
            'this-month': 'هذا الشهر',
            'last-month': 'الشهر الماضي',
            'this-week': 'هذا الأسبوع',
            'last-week': 'الأسبوع الماضي',
            'last-30-days': 'آخر 30 يوم',
            'last-7-days': 'آخر 7 أيام',
            'custom': 'فترة مخصصة'
        };
        
        if (filterTextEl) {
            filterTextEl.textContent = periodTexts[period] || 'هذا الشهر';
        }
        
        // Show/hide custom date range picker
        if (period === 'custom') {
            if (customDateRange) {
                customDateRange.style.display = 'block';
            }
        } else {
            if (customDateRange) {
                customDateRange.style.display = 'none';
            }
            // Load data for selected period
            loadDeviceModelsInsights(period);
        }
        
        // Update active state
        filterMenu.querySelectorAll('.dropdown-item').forEach(item => {
            item.classList.remove('active');
        });
        periodItem.classList.add('active');
    });
    
    // Handle custom date apply button
    if (applyCustomDateBtn) {
        applyCustomDateBtn.addEventListener('click', function() {
            const startInput = document.getElementById('device-models-start-date');
            const endInput = document.getElementById('device-models-end-date');
            
            if (!startInput || !endInput || !startInput.value || !endInput.value) {
                if (typeof toastr !== 'undefined') {
                    toastr.warning('يرجى اختيار تاريخ البداية والنهاية');
                }
                return;
            }
            
            if (new Date(startInput.value) > new Date(endInput.value)) {
                if (typeof toastr !== 'undefined') {
                    toastr.error('تاريخ البداية يجب أن يكون قبل تاريخ النهاية');
                }
                return;
            }
            
            loadDeviceModelsInsights('custom');
        });
    }
}

/**
 * Load today's summary statistics
 */
function loadTodaySummary() {
    const adminInfo = JSON.parse(localStorage.getItem('adminInfo') || '{}');
    const authMiddleware = new AuthMiddleware();
    const token = authMiddleware.getAdminToken() || adminInfo.token || '';
    // Get baseUrl with port 3001 enforcement for localhost
    let baseUrl;
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (window.config && window.config.api && window.config.api.baseUrl) {
        baseUrl = window.config.api.baseUrl;
        // Override if config has wrong port for localhost
        if (isLocalhost && baseUrl.includes(':3000')) {
            baseUrl = 'http://localhost:3001';
        }
    } else if (isLocalhost) {
        baseUrl = 'http://localhost:3001';
    } else {
        baseUrl = window.location.origin;
    }
    // Final safety check
    if (isLocalhost && baseUrl.includes(':3000')) {
        baseUrl = 'http://localhost:3001';
    }
    
    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Get yesterday's date range for comparison
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    Promise.all([
        // Reports today (use inspection_date for when reports were created/inspected)
        fetch(`${baseUrl}/api/reports/count?dateField=inspection_date&startDate=${today.toISOString()}&endDate=${tomorrow.toISOString()}`, {
            headers: { 'x-auth-token': token }
        }).then(r => {
            if (!r.ok) {
                console.error(`Reports today failed: ${r.status}`, r.statusText);
                return { count: 0 };
            }
            return r.json().then(data => {
                console.log('Reports today response:', data);
                return data;
            });
        }),
        // Reports yesterday (use inspection_date for when reports were created/inspected)
        fetch(`${baseUrl}/api/reports/count?dateField=inspection_date&startDate=${yesterday.toISOString()}&endDate=${today.toISOString()}`, {
            headers: { 'x-auth-token': token }
        }).then(r => {
            if (!r.ok) throw new Error(`Reports yesterday failed: ${r.status}`);
            return r.json();
        }),
        // Invoices today
        fetch(`${baseUrl}/api/invoices/count?startDate=${today.toISOString()}&endDate=${tomorrow.toISOString()}`, {
            headers: { 'x-auth-token': token }
        }).then(r => {
            if (!r.ok) {
                console.error(`Invoices today failed: ${r.status} ${r.statusText}`);
                return { count: 0 };
            }
            return r.json();
        }),
        // Invoices yesterday
        fetch(`${baseUrl}/api/invoices/count?startDate=${yesterday.toISOString()}&endDate=${today.toISOString()}`, {
            headers: { 'x-auth-token': token }
        }).then(r => {
            if (!r.ok) {
                console.error(`Invoices yesterday failed: ${r.status} ${r.statusText}`);
                return { count: 0 };
            }
            return r.json();
        }),
        // Completed reports today (status = completed, use updated_at to track when completed)
        fetch(`${baseUrl}/api/reports/count?status=completed&dateField=updated_at&startDate=${today.toISOString()}&endDate=${tomorrow.toISOString()}`, {
            headers: { 'x-auth-token': token }
        }).then(r => {
            if (!r.ok) {
                console.error(`Completed reports today failed: ${r.status} ${r.statusText}`);
                return { count: 0 };
            }
            return r.json();
        }),
        // Completed reports yesterday (use updated_at to track when completed)
        fetch(`${baseUrl}/api/reports/count?status=completed&dateField=updated_at&startDate=${yesterday.toISOString()}&endDate=${today.toISOString()}`, {
            headers: { 'x-auth-token': token }
        }).then(r => {
            if (!r.ok) {
                console.error(`Completed reports yesterday failed: ${r.status} ${r.statusText}`);
                return { count: 0 };
            }
            return r.json();
        }),
        // Pending reports (all pending reports regardless of date)
        fetch(`${baseUrl}/api/reports/count?status=pending`, {
            headers: { 'x-auth-token': token }
        }).then(r => {
            if (!r.ok) {
                console.error(`Pending reports count failed: ${r.status} ${r.statusText}`);
                return { count: 0 };
            }
            return r.json();
        })
    ])
    .then(([reportsToday, reportsYesterday, invoicesToday, invoicesYesterday, completedToday, completedYesterday, pendingCount]) => {
        console.log('Today Summary Data:', {
            reportsToday,
            reportsYesterday,
            invoicesToday,
            invoicesYesterday,
            completedToday,
            completedYesterday,
            pendingCount
        });
        
        // Update today's summary
        const reportsTodayEl = document.getElementById('reports-today');
        const reportsTodayTrendEl = document.getElementById('reports-today-trend');
        const invoicesTodayEl = document.getElementById('invoices-today');
        const invoicesTodayTrendEl = document.getElementById('invoices-today-trend');
        const completedTodayEl = document.getElementById('completed-today');
        const completedTodayTrendEl = document.getElementById('completed-today-trend');
        const attentionEl = document.getElementById('attention-needed');
        
        const reportsTodayCount = reportsToday?.count ?? 0;
        const reportsYesterdayCount = reportsYesterday?.count ?? 0;
        const invoicesTodayCount = invoicesToday?.count ?? 0;
        const invoicesYesterdayCount = invoicesYesterday?.count ?? 0;
        const completedTodayCount = completedToday?.count ?? 0;
        const completedYesterdayCount = completedYesterday?.count ?? 0;
        const pendingReportsCount = pendingCount?.count ?? 0;
        
        console.log('Today Summary Counts:', {
            reportsTodayCount,
            reportsYesterdayCount,
            invoicesTodayCount,
            invoicesYesterdayCount,
            completedTodayCount,
            completedYesterdayCount,
            pendingReportsCount
        });
        
        if (reportsTodayEl) reportsTodayEl.textContent = reportsTodayCount;
        if (reportsTodayTrendEl) {
            const diff = reportsTodayCount - reportsYesterdayCount;
            if (diff > 0) {
                reportsTodayTrendEl.innerHTML = `<span class="text-success"><i class="fas fa-arrow-up"></i> +${diff}</span>`;
            } else if (diff < 0) {
                reportsTodayTrendEl.innerHTML = `<span class="text-danger"><i class="fas fa-arrow-down"></i> ${diff}</span>`;
            } else {
                reportsTodayTrendEl.innerHTML = `<span class="text-muted">=</span>`;
            }
        }
        
        if (invoicesTodayEl) invoicesTodayEl.textContent = invoicesTodayCount;
        if (invoicesTodayTrendEl) {
            const diff = invoicesTodayCount - invoicesYesterdayCount;
            if (diff > 0) {
                invoicesTodayTrendEl.innerHTML = `<span class="text-success"><i class="fas fa-arrow-up"></i> +${diff}</span>`;
            } else if (diff < 0) {
                invoicesTodayTrendEl.innerHTML = `<span class="text-danger"><i class="fas fa-arrow-down"></i> ${diff}</span>`;
            } else {
                invoicesTodayTrendEl.innerHTML = `<span class="text-muted">=</span>`;
            }
        }
        
        if (completedTodayEl) completedTodayEl.textContent = completedTodayCount;
        if (completedTodayTrendEl) {
            const diff = completedTodayCount - completedYesterdayCount;
            if (diff > 0) {
                completedTodayTrendEl.innerHTML = `<span class="text-success"><i class="fas fa-arrow-up"></i> +${diff}</span>`;
            } else if (diff < 0) {
                completedTodayTrendEl.innerHTML = `<span class="text-danger"><i class="fas fa-arrow-down"></i> ${diff}</span>`;
            } else {
                completedTodayTrendEl.innerHTML = `<span class="text-muted">=</span>`;
            }
        }
        
        // Update attention needed (pending reports)
        if (attentionEl) {
            attentionEl.textContent = pendingReportsCount;
            console.log('Updated attention-needed with:', pendingReportsCount);
        }
    })
    .catch(error => {
        console.error('Error loading today summary:', error);
        
        // Set placeholder values on error
        const reportsTodayEl = document.getElementById('reports-today');
        const invoicesTodayEl = document.getElementById('invoices-today');
        const completedTodayEl = document.getElementById('completed-today');
        const attentionEl = document.getElementById('attention-needed');
        
        if (reportsTodayEl) reportsTodayEl.textContent = '0';
        if (invoicesTodayEl) invoicesTodayEl.textContent = '0';
        if (completedTodayEl) completedTodayEl.textContent = '0';
        if (attentionEl) attentionEl.textContent = '0';
        
        // Show error toast
        if (typeof toastr !== 'undefined') {
            toastr.error('فشل في تحميل ملخص اليوم');
        }
    });
}

/**
 * Load dashboard statistics from API
 */
function loadDashboardStats() {
    console.log('Loading dashboard stats from API');
    
    // Get admin info from localStorage
    const adminInfo = JSON.parse(localStorage.getItem('adminInfo') || '{}');
    const authMiddleware = new AuthMiddleware();
    const token = authMiddleware.getAdminToken() || adminInfo.token || '';
    
    console.log('Admin info:', adminInfo);
    console.log('Token available:', !!token);
    
    // API base URL
    // Get baseUrl with port 3001 enforcement for localhost
    let baseUrl;
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (window.config && window.config.api && window.config.api.baseUrl) {
        baseUrl = window.config.api.baseUrl;
        // Override if config has wrong port for localhost
        if (isLocalhost && baseUrl.includes(':3000')) {
            baseUrl = 'http://localhost:3001';
        }
    } else if (isLocalhost) {
        baseUrl = 'http://localhost:3001';
    } else {
        baseUrl = window.location.origin;
    }
    // Final safety check
    if (isLocalhost && baseUrl.includes(':3000')) {
        baseUrl = 'http://localhost:3001';
    }
    console.log('API Base URL:', baseUrl);
    
    // Get current month date range
    const today = new Date();
    const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const currentMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);
    const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59);
    
    // Get current week date range
    const currentWeekStart = new Date(today);
    currentWeekStart.setDate(today.getDate() - today.getDay()); // Sunday
    currentWeekStart.setHours(0, 0, 0, 0);
    const currentWeekEnd = new Date(currentWeekStart);
    currentWeekEnd.setDate(currentWeekStart.getDate() + 6);
    currentWeekEnd.setHours(23, 59, 59);
    
    const lastWeekStart = new Date(currentWeekStart);
    lastWeekStart.setDate(currentWeekStart.getDate() - 7);
    const lastWeekEnd = new Date(currentWeekStart);
    lastWeekEnd.setDate(currentWeekStart.getDate() - 1);
    lastWeekEnd.setHours(23, 59, 59);
    
    // Make simultaneous API requests to get statistics (only needed metrics)
    Promise.all([
        // Pending reports count
        fetch(`${baseUrl}/api/reports/count?status=pending`, {
            headers: { 'x-auth-token': token }
        }).then(r => {
            if (!r.ok) throw new Error(`Pending reports count failed: ${r.status}`);
            return r.json();
        }),
        // Reports this month (only completed reports)
        fetch(`${baseUrl}/api/reports/count?status=completed&dateField=updated_at&startDate=${currentMonthStart.toISOString()}&endDate=${currentMonthEnd.toISOString()}`, {
            headers: { 'x-auth-token': token }
        }).then(r => {
            if (!r.ok) throw new Error(`Reports this month failed: ${r.status}`);
            return r.json();
        }),
        // Reports last month (only completed reports)
        fetch(`${baseUrl}/api/reports/count?status=completed&dateField=updated_at&startDate=${lastMonthStart.toISOString()}&endDate=${lastMonthEnd.toISOString()}`, {
            headers: { 'x-auth-token': token }
        }).then(r => {
            if (!r.ok) throw new Error(`Reports last month failed: ${r.status}`);
            return r.json();
        }),
        // Completed this week (use updated_at to get reports completed this week, not just inspected)
        fetch(`${baseUrl}/api/reports/count?status=completed&dateField=updated_at&startDate=${currentWeekStart.toISOString()}&endDate=${currentWeekEnd.toISOString()}`, {
            headers: { 'x-auth-token': token }
        }).then(r => {
            if (!r.ok) throw new Error(`Completed this week failed: ${r.status}`);
            return r.json();
        }),
        // Completed last week (use updated_at to get reports completed last week)
        fetch(`${baseUrl}/api/reports/count?status=completed&dateField=updated_at&startDate=${lastWeekStart.toISOString()}&endDate=${lastWeekEnd.toISOString()}`, {
            headers: { 'x-auth-token': token }
        }).then(r => {
            if (!r.ok) throw new Error(`Completed last week failed: ${r.status}`);
            return r.json();
        })
    ])
    .then(data => {
        console.log('Dashboard stats data:', data);
        // Process data [pendingReports, reportsThisMonth, reportsLastMonth, completedThisWeek, completedLastWeek]
        const pendingReportsEl = document.getElementById('pending-reports');
        const reportsThisMonthEl = document.getElementById('reports-this-month');
        const reportsThisMonthTrendEl = document.getElementById('reports-this-month-trend');
        const completedThisWeekEl = document.getElementById('completed-this-week');
        const completedThisWeekTrendEl = document.getElementById('completed-this-week-trend');
        
        const pendingReports = data[0].count || 0;
        const reportsThisMonth = data[1].count || 0;
        const reportsLastMonth = data[2].count || 0;
        const completedThisWeek = data[3].count || 0;
        const completedLastWeek = data[4].count || 0;
        
        if (pendingReportsEl) pendingReportsEl.textContent = pendingReports;
        if (reportsThisMonthEl) reportsThisMonthEl.textContent = reportsThisMonth;
        if (completedThisWeekEl) completedThisWeekEl.textContent = completedThisWeek;
        
        // Calculate trends (simplified - comparing with previous period)
        if (reportsThisMonthTrendEl) {
            const diff = reportsThisMonth - reportsLastMonth;
            if (diff > 0) {
                const percent = reportsLastMonth > 0 ? Math.round((diff / reportsLastMonth) * 100) : 0;
                reportsThisMonthTrendEl.innerHTML = `<span class="text-success"><i class="fas fa-arrow-up"></i> +${percent}%</span>`;
            } else if (diff < 0) {
                const percent = reportsLastMonth > 0 ? Math.round((Math.abs(diff) / reportsLastMonth) * 100) : 0;
                reportsThisMonthTrendEl.innerHTML = `<span class="text-danger"><i class="fas fa-arrow-down"></i> -${percent}%</span>`;
            } else {
                reportsThisMonthTrendEl.innerHTML = `<span class="text-muted">=</span>`;
            }
        }
        
        if (completedThisWeekTrendEl) {
            const diff = completedThisWeek - completedLastWeek;
            if (diff > 0) {
                const percent = completedLastWeek > 0 ? Math.round((diff / completedLastWeek) * 100) : 0;
                completedThisWeekTrendEl.innerHTML = `<span class="text-success"><i class="fas fa-arrow-up"></i> +${percent}%</span>`;
            } else if (diff < 0) {
                const percent = completedLastWeek > 0 ? Math.round((Math.abs(diff) / completedLastWeek) * 100) : 0;
                completedThisWeekTrendEl.innerHTML = `<span class="text-danger"><i class="fas fa-arrow-down"></i> -${percent}%</span>`;
            } else {
                completedThisWeekTrendEl.innerHTML = `<span class="text-muted">=</span>`;
            }
        }
        
        console.log('Updated dashboard elements with data');
    })
    .catch(error => {
        console.error('Error loading dashboard stats:', error);
        
        // Set placeholder values on error (only if elements exist)
        const pendingReportsEl = document.getElementById('pending-reports');
        const reportsThisMonthEl = document.getElementById('reports-this-month');
        const completedThisWeekEl = document.getElementById('completed-this-week');
        
        if (pendingReportsEl) pendingReportsEl.textContent = '0';
        if (reportsThisMonthEl) reportsThisMonthEl.textContent = '0';
        if (completedThisWeekEl) completedThisWeekEl.textContent = '0';
        
        // Show error toast
        if (typeof toastr !== 'undefined') {
            toastr.error('فشل في تحميل إحصائيات لوحة التحكم');
        }
    });
}

/**
 * Load recent reports from API
 */
function loadRecentReports() {
    console.log('Loading recent reports from API');
    
    // Get admin info from localStorage
    const adminInfo = JSON.parse(localStorage.getItem('adminInfo') || '{}');
    const authMiddleware = new AuthMiddleware();
    const token = authMiddleware.getAdminToken() || adminInfo.token || '';
    
    // API base URL
    // Get baseUrl with port 3001 enforcement for localhost
    let baseUrl;
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (window.config && window.config.api && window.config.api.baseUrl) {
        baseUrl = window.config.api.baseUrl;
        // Override if config has wrong port for localhost
        if (isLocalhost && baseUrl.includes(':3000')) {
            baseUrl = 'http://localhost:3001';
        }
    } else if (isLocalhost) {
        baseUrl = 'http://localhost:3001';
    } else {
        baseUrl = window.location.origin;
    }
    // Final safety check
    if (isLocalhost && baseUrl.includes(':3000')) {
        baseUrl = 'http://localhost:3001';
    }
    
    // Make API request to get recent reports
    fetch(`${baseUrl}/api/reports?limit=5&sort=desc`, {
        headers: {
            'x-auth-token': token,
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to load recent reports');
        }
        return response.json();
    })
    .then(data => {
        console.log('Recent reports:', data);
        
        const reportsTable = document.getElementById('recent-reports-table');
        
        // Check if element exists before manipulating it
        if (!reportsTable) {
            console.log('Recent reports table element not found in this page');
            return;
        }
        
        // Clear loading spinner
        reportsTable.innerHTML = '';
        
        if (!data || data.length === 0) {
            reportsTable.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-4">لا توجد تقارير حديثة</td>
                </tr>
            `;
            return;
        }
        
        // Add reports to table
        data.forEach(report => {
            const statusClass = getStatusClass(report.status);
            const inspectionDateObj = new Date(report.inspection_date);
            const year = inspectionDateObj.getFullYear();
            const month = ('0' + (inspectionDateObj.getMonth() + 1)).slice(-2);
            const day = ('0' + inspectionDateObj.getDate()).slice(-2);
            const formattedDate = `${year}-${month}-${day}`;
            
            reportsTable.innerHTML += `
                <tr>
                    <td class="ps-4">${report.id}</td>
                    <td>${report.client_name}</td>
                    <td>${report.device_model}</td>
                    <td>${formattedDate}</td>
                    <td><span class="badge ${statusClass}">${translateStatus(report.status)}</span></td>
                    <td class="text-center">
                        <a href="view-report.html?id=${report.id}" class="btn btn-sm btn-outline-primary me-1">
                            <i class="fas fa-eye"></i>
                        </a>
                        <a href="create-report.html?id=${report.id}" class="btn btn-sm btn-outline-success me-1">
                            <i class="fas fa-edit"></i>
                        </a>
                    </td>
                </tr>
            `;
        });
    })
    .catch(error => {
        console.error('Error loading recent reports:', error);
        
        const reportsTable = document.getElementById('recent-reports-table');
        reportsTable.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-4">
                    <div class="alert alert-warning mb-0">
                        <i class="fas fa-exclamation-triangle me-2"></i> تعذر تحميل التقارير
                    </div>
                </td>
            </tr>
        `;
    });
}

/**
 * Load recent invoices from API
 */
function loadRecentInvoices() {
    console.log('Loading recent invoices from API');
    
    // Get admin info from localStorage
    const adminInfo = JSON.parse(localStorage.getItem('adminInfo') || '{}');
    const authMiddleware = new AuthMiddleware();
    const token = authMiddleware.getAdminToken() || adminInfo.token || '';
    
    // API base URL
    // Get baseUrl with port 3001 enforcement for localhost
    let baseUrl;
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (window.config && window.config.api && window.config.api.baseUrl) {
        baseUrl = window.config.api.baseUrl;
        // Override if config has wrong port for localhost
        if (isLocalhost && baseUrl.includes(':3000')) {
            baseUrl = 'http://localhost:3001';
        }
    } else if (isLocalhost) {
        baseUrl = 'http://localhost:3001';
    } else {
        baseUrl = window.location.origin;
    }
    // Final safety check
    if (isLocalhost && baseUrl.includes(':3000')) {
        baseUrl = 'http://localhost:3001';
    }
    
    // Make API request to get recent invoices
    fetch(`${baseUrl}/api/invoices?limit=5&sort=desc`, {
        headers: {
            'x-auth-token': token,
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to load recent invoices');
        }
        return response.json();
    })
    .then(data => {
        console.log('Recent invoices:', data);
        
        const invoicesTable = document.getElementById('recent-invoices-table');
        
        // Check if element exists before manipulating it
        if (!invoicesTable) {
            console.log('Recent invoices table element not found in this page');
            return;
        }
        
        // Clear loading spinner
        invoicesTable.innerHTML = '';
        
        if (!data || data.length === 0) {
            invoicesTable.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-4">لا توجد فواتير حديثة</td>
                </tr>
            `;
            return;
        }
        
        // Add invoices to table
        // data.forEach(invoice => {
        //     const formattedDate = new Date(invoice.date).toLocaleDateString('ar-SA');
        //     const formattedAmount = invoice.total.toLocaleString('ar-SA') + ' ر.س';
            
        //     invoicesTable.innerHTML += `
        //         <tr>
        //             <td class="ps-4">${invoice.id}</td>
        //             <td>${invoice.client?.name || 'غير معروف'}</td>
        //             <td>${formattedDate}</td>
        //             <td>${formattedAmount}</td>
        //             <td><span class="badge ${getPaymentStatusClass(invoice.paymentStatus)}">${translatePaymentStatus(invoice.paymentStatus)}</span></td>
        //             <td class="text-center">
        //                 <a href="view-invoice.html?id=${invoice.id}" class="btn btn-sm btn-outline-primary me-1">
        //                     <i class="fas fa-eye"></i>
        //                 </a>
        //                 <a href="edit-invoice.html?id=${invoice.id}" class="btn btn-sm btn-outline-success me-1">
        //                     <i class="fas fa-edit"></i>
        //                 </a>
        //             </td>
        //         </tr>
        //     `;
        // });
    })
    .catch(error => {
        console.error('Error loading recent invoices:', error);
        
        const invoicesTable = document.getElementById('recent-invoices-table');
        invoicesTable.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-4">
                    <div class="alert alert-warning mb-0">
                        <i class="fas fa-exclamation-triangle me-2"></i> تعذر تحميل الفواتير
                    </div>
                </td>
            </tr>
        `;
    });
}

/**
 * Get CSS class for report status
 */
function getStatusClass(status) {
    switch(status) {
        case 'pending':
            return 'bg-warning';
        case 'in-progress':
            return 'bg-info';
        case 'completed':
            return 'bg-success';
        case 'cancelled':
            return 'bg-danger';
        case 'active':
            return 'bg-primary';
        default:
            return 'bg-secondary';
    }
}

/**
 * Get CSS class for payment status
 */
function getPaymentStatusClass(status) {
    switch(status) {
        case 'paid':
            return 'bg-success';
        case 'partial':
            return 'bg-warning';
        case 'unpaid':
            return 'bg-danger';
        default:
            return 'bg-secondary';
    }
}

/**
 * Translate report status to Arabic
 */
function translateStatus(status) {
    switch(status) {
        case 'pending':
            return 'قيد الانتظار';
        case 'in-progress':
            return 'قيد التنفيذ';
        case 'completed':
            return 'مكتمل';
        case 'cancelled':
            return 'ملغي';
        case 'active':
            return 'نشط';
        default:
            return status;
    }
}

/**
 * Translate payment status to Arabic
 */
function translatePaymentStatus(status) {
    switch(status) {
        case 'paid':
            return 'مدفوعة';
        case 'partial':
            return 'مدفوعة جزئياً';
        case 'unpaid':
            return 'غير مدفوعة';
        default:
            return status || 'غير معروف';
    }
}

/**
 * Display current date in Arabic format
 */
function displayCurrentDate() {
    const dateElement = document.getElementById('current-date');
    if (!dateElement) return;
    
    // Options for Arabic date format
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric', 
        calendar: 'gregory' 
    };
    
    // Create date in Arabic locale
    const today = new Date();
    const arabicDate = today.toLocaleDateString('ar-EG', options);
    
    // Display the date
    if (dateElement) {
        dateElement.textContent = arabicDate;
    }
    
    // Also update small date badge in today's summary
    const dateSmallElement = document.getElementById('current-date-small');
    if (dateSmallElement) {
        dateSmallElement.textContent = arabicDate;
    }
}

/**
 * Initialize dashboard charts
 */
function initializeCharts() {
    // Get admin token for API requests
    const adminInfo = JSON.parse(localStorage.getItem('adminInfo') || '{}');
    const authMiddleware = new AuthMiddleware();
    const token = authMiddleware.getAdminToken() || adminInfo.token || '';
    // Get baseUrl with port 3001 enforcement for localhost
    let baseUrl;
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (window.config && window.config.api && window.config.api.baseUrl) {
        baseUrl = window.config.api.baseUrl;
        // Override if config has wrong port for localhost
        if (isLocalhost && baseUrl.includes(':3000')) {
            baseUrl = 'http://localhost:3001';
        }
    } else if (isLocalhost) {
        baseUrl = 'http://localhost:3001';
    } else {
        baseUrl = window.location.origin;
    }
    // Final safety check
    if (isLocalhost && baseUrl.includes(':3000')) {
        baseUrl = 'http://localhost:3001';
    }
    
    // Performance chart - Line chart for reports and invoices
    const performanceChartCanvas = document.getElementById('performanceChart');
    if (performanceChartCanvas) {
        // Last 6 months in Arabic
        const months = [
            'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
            'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
        ];
        
        // Get last 6 months
        const currentMonth = new Date().getMonth();
        const last6Months = [];
        const last6MonthsDate = [];
        
        for (let i = 5; i >= 0; i--) {
            const monthIndex = (currentMonth - i + 12) % 12;
            last6Months.push(months[monthIndex]);
            
            // Create date objects for API query
            const date = new Date();
            date.setMonth(currentMonth - i);
            date.setDate(1); // First day of month
            date.setHours(0, 0, 0, 0);
            last6MonthsDate.push(date);
        }
        
        // Get report and invoice counts by month
        const reportsPromises = [];
        const invoicesPromises = [];
        
        // For each month, query the API for reports and invoices created in that month
        last6MonthsDate.forEach((startDate, index) => {
            // Calculate end date (first day of next month)
            const endDate = new Date(startDate);
            endDate.setMonth(endDate.getMonth() + 1);
            
            // Query for reports in this month
            const reportPromise = fetch(`${baseUrl}/api/reports/count?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`, {
                headers: {
                    'x-auth-token': token
                }
            }).then(res => res.json());
            
            // Query for invoices in this month
            const invoicePromise = fetch(`${baseUrl}/api/invoices/count?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`, {
                headers: {
                    'x-auth-token': token
                }
            }).then(res => res.json());
            
            reportsPromises.push(reportPromise);
            invoicesPromises.push(invoicePromise);
        });
        
        // Process all the data and create the chart
        Promise.all([Promise.all(reportsPromises), Promise.all(invoicesPromises)])
            .then(([reportResults, invoiceResults]) => {
                // Extract counts from results
                const reportsData = reportResults.map(result => result.count || 0);
                const invoicesData = invoiceResults.map(result => result.count || 0);
                
                // Create the chart (Column chart instead of line)
                new Chart(performanceChartCanvas, {
                    type: 'bar',
                    data: {
                        labels: last6Months,
                        datasets: [
                            {
                                label: 'التقارير',
                                data: reportsData,
                                backgroundColor: 'rgba(0, 117, 83, 0.8)',
                                borderColor: '#007553',
                                borderWidth: 1,
                                borderRadius: 4
                            },
                            {
                                label: 'الفواتير',
                                data: invoicesData,
                                backgroundColor: 'rgba(13, 110, 253, 0.8)',
                                borderColor: '#0d6efd',
                                borderWidth: 1,
                                borderRadius: 4
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        interaction: {
                            mode: 'index',
                            intersect: false
                        },
                        plugins: {
                            legend: {
                                position: 'top',
                                align: 'end',
                                labels: {
                                    boxWidth: 12,
                                    usePointStyle: true,
                                    pointStyle: 'circle',
                                    padding: 15
                                }
                            },
                            tooltip: {
                                mode: 'index',
                                intersect: false,
                                rtl: true,
                                titleAlign: 'right',
                                bodyAlign: 'right',
                                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                padding: 12,
                                displayColors: true
                            }
                        },
                        scales: {
                            x: {
                                grid: {
                                    display: false,
                                    drawBorder: false
                                },
                                ticks: {
                                    color: '#6c757d',
                                    padding: 15,
                                    font: {
                                        size: 11,
                                        family: 'Cairo, sans-serif'
                                    }
                                }
                            },
                            y: {
                                beginAtZero: true,
                                grid: {
                                    drawBorder: false,
                                    display: true,
                                    drawOnChartArea: true,
                                    drawTicks: false,
                                    borderDash: [5, 5],
                                    color: 'rgba(0, 0, 0, 0.05)'
                                },
                                ticks: {
                                    display: true,
                                    padding: 10,
                                    color: '#b2b9bf',
                                    font: {
                                        size: 11,
                                        family: 'Cairo, sans-serif'
                                    }
                                }
                            }
                        }
                    }
                });
            })
            .catch(error => {
                console.error('Error loading chart data:', error);
                // Show error message on the chart
                new Chart(performanceChartCanvas, {
                    type: 'bar',
                    data: {
                        labels: last6Months,
                        datasets: []
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            title: {
                                display: true,
                                text: 'فشل في تحميل البيانات',
                                color: '#dc3545',
                                font: {
                                    size: 14,
                                    family: 'Cairo, sans-serif'
                                }
                            }
                        }
                    }
                });
            });
    }
    
    // Invoice Status Chart removed - not always showing correct data and not useful for operational dashboard
}

/**
 * Load reports status breakdown chart
 */
function loadReportsStatusChart() {
    const adminInfo = JSON.parse(localStorage.getItem('adminInfo') || '{}');
    const authMiddleware = new AuthMiddleware();
    const token = authMiddleware.getAdminToken() || adminInfo.token || '';
    // Get baseUrl with port 3001 enforcement for localhost
    let baseUrl;
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (window.config && window.config.api && window.config.api.baseUrl) {
        baseUrl = window.config.api.baseUrl;
        // Override if config has wrong port for localhost
        if (isLocalhost && baseUrl.includes(':3000')) {
            baseUrl = 'http://localhost:3001';
        }
    } else if (isLocalhost) {
        baseUrl = 'http://localhost:3001';
    } else {
        baseUrl = window.location.origin;
    }
    // Final safety check
    if (isLocalhost && baseUrl.includes(':3000')) {
        baseUrl = 'http://localhost:3001';
    }
    
    const reportsStatusChartCanvas = document.getElementById('reportsStatusChart');
    if (!reportsStatusChartCanvas) {
        console.log('Reports status chart canvas not found');
        return;
    }
    
    // Fetch reports count by status
    Promise.all([
        fetch(`${baseUrl}/api/reports/count?status=pending`, {
            headers: { 'x-auth-token': token }
        }).then(r => {
            if (!r.ok) return { count: 0 };
            return r.json();
        }).catch(() => ({ count: 0 })),
        fetch(`${baseUrl}/api/reports/count?status=in-progress`, {
            headers: { 'x-auth-token': token }
        }).then(r => {
            if (!r.ok) return { count: 0 };
            return r.json();
        }).catch(() => ({ count: 0 })),
        fetch(`${baseUrl}/api/reports/count?status=completed`, {
            headers: { 'x-auth-token': token }
        }).then(r => {
            if (!r.ok) return { count: 0 };
            return r.json();
        }).catch(() => ({ count: 0 })),
        fetch(`${baseUrl}/api/reports/count?status=cancelled`, {
            headers: { 'x-auth-token': token }
        }).then(r => {
            if (!r.ok) return { count: 0 };
            return r.json();
        }).catch(() => ({ count: 0 }))
    ])
    .then(data => {
        // Extract counts: [pending, in-progress, completed, cancelled]
        const statusData = [
            parseInt(data[0]?.count || 0),
            parseInt(data[1]?.count || 0),
            parseInt(data[2]?.count || 0),
            parseInt(data[3]?.count || 0)
        ];
        
        // Only create chart if there's data
        const total = statusData.reduce((a, b) => a + b, 0);
        if (total === 0) {
            // Show empty state
            reportsStatusChartCanvas.closest('.card-body').innerHTML = `
                <div class="text-center py-4">
                    <i class="fas fa-info-circle text-muted fa-2x mb-3"></i>
                    <p class="text-muted">لا توجد تقارير لعرضها</p>
                </div>
            `;
            return;
        }
        
        // Create the chart
        new Chart(reportsStatusChartCanvas, {
            type: 'doughnut',
            data: {
                labels: ['قيد الانتظار', 'قيد التنفيذ', 'مكتمل', 'ملغي'],
                datasets: [{
                    data: statusData,
                    backgroundColor: [
                        '#ffc107',  // pending - yellow
                        '#0dcaf0',  // in-progress - cyan
                        '#198754',  // completed - green
                        '#dc3545'   // cancelled - red
                    ],
                    borderWidth: 0,
                    cutout: '75%',
                    borderRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            usePointStyle: true,
                            pointStyle: 'circle',
                            font: {
                                size: 12,
                                family: 'Cairo, sans-serif'
                            }
                        }
                    },
                    tooltip: {
                        rtl: true,
                        titleAlign: 'right',
                        bodyAlign: 'right',
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    })
    .catch(error => {
        console.error('Error loading reports status chart:', error);
        // Show empty chart on error
        new Chart(reportsStatusChartCanvas, {
            type: 'doughnut',
            data: {
                labels: [],
                datasets: []
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'فشل في تحميل البيانات',
                        color: '#dc3545',
                        font: {
                            size: 14,
                            family: 'Cairo, sans-serif'
                        }
                    }
                }
            }
        });
    });
}

/**
 * Load goals and achievements
 */
function loadGoalsAndAchievements() {
    console.log('Loading goals and achievements');
    
    const authMiddleware = new AuthMiddleware();
    const token = authMiddleware.getAdminToken();
    // Get baseUrl with port 3001 enforcement for localhost
    let baseUrl;
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (window.config && window.config.api && window.config.api.baseUrl) {
        baseUrl = window.config.api.baseUrl;
        // Override if config has wrong port for localhost
        if (isLocalhost && baseUrl.includes(':3000')) {
            baseUrl = 'http://localhost:3001';
        }
    } else if (isLocalhost) {
        baseUrl = 'http://localhost:3001';
    } else {
        baseUrl = window.location.origin;
    }
    // Final safety check
    if (isLocalhost && baseUrl.includes(':3000')) {
        baseUrl = 'http://localhost:3001';
    }
    
    console.log('Goals API - Token:', !!token, 'Base URL:', baseUrl);
    
    // Load current goal
    console.log('Fetching current goal from:', `${baseUrl}/api/goals/current`);
    fetch(`${baseUrl}/api/goals/current`, {
        headers: {
            'x-auth-token': token
        }
    })
    .then(response => {
        console.log('Goal response status:', response.status, response.statusText);
        if (!response.ok) {
            throw new Error(`Failed to load goal: ${response.status} ${response.statusText}`);
        }
        return response.json();
    })
    .then(goal => {
        console.log('Goal data received:', goal);
        displayGoal(goal);
    })
    .catch(error => {
        console.error('Error loading goal:', error);
        displayGoalError();
    });
    
    // Load achievements
    console.log('Fetching achievements from:', `${baseUrl}/api/goals/achievements`);
    fetch(`${baseUrl}/api/goals/achievements`, {
        headers: {
            'x-auth-token': token
        }
    })
    .then(response => {
        console.log('Achievements response status:', response.status, response.statusText);
        if (!response.ok) {
            throw new Error(`Failed to load achievements: ${response.status} ${response.statusText}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Achievements data received:', data);
        displayAchievements(data.achievements, data.newAchievements);
    })
    .catch(error => {
        console.error('Error loading achievements:', error);
        displayAchievementsError();
    });
}

/**
 * Display goal information
 */
function displayGoal(goal) {
    const goalContent = document.getElementById('goalContent');
    if (!goalContent) return;
    
    const progress = Math.min((goal.current / goal.target) * 100, 100);
    const progressClass = progress >= 100 ? 'bg-success' : progress >= 75 ? 'bg-warning' : 'bg-primary';
    
    goalContent.innerHTML = `
        <div class="text-center mb-4">
            <h4 class="fw-bold text-primary mb-2">${goal.title}</h4>
            <div class="d-flex justify-content-between align-items-center mb-2">
                <span class="text-muted">التقدم</span>
                <span class="fw-bold">${goal.current} / ${goal.target} ${goal.unit}</span>
            </div>
            <div class="progress mb-3" style="height: 10px;">
                <div class="progress-bar ${progressClass}" role="progressbar" 
                     style="width: ${progress}%" 
                     aria-valuenow="${progress}" 
                     aria-valuemin="0" 
                     aria-valuemax="100">
                </div>
            </div>
            <div class="d-flex justify-content-between">
                <small class="text-muted">0</small>
                <small class="text-muted">${goal.target}</small>
            </div>
        </div>
        <div class="text-center">
            <p class="text-muted mb-0">
                ${progress >= 100 ? '🎉 تم تحقيق الهدف!' : 
                  progress >= 75 ? '🔥 أنت قريب من الهدف!' : 
                  '💪 استمر في العمل الجيد!'}
            </p>
        </div>
    `;
    
    // Store current goal data for editing
    window.currentGoal = goal;
}

/**
 * Display goal error
 */
function displayGoalError() {
    const goalContent = document.getElementById('goalContent');
    if (!goalContent) return;
    
    goalContent.innerHTML = `
        <div class="text-center py-4">
            <i class="fas fa-exclamation-triangle text-warning fa-2x mb-3"></i>
            <p class="text-muted">تعذر تحميل الهدف</p>
        </div>
    `;
}

/**
 * Display achievements
 */
function displayAchievements(achievements, newAchievements = []) {
    const achievementsContent = document.getElementById('achievementsContent');
    if (!achievementsContent) return;
    
    if (!achievements || achievements.length === 0) {
        achievementsContent.innerHTML = `
            <div class="text-center py-4">
                <i class="fas fa-trophy text-muted fa-2x mb-3"></i>
                <p class="text-muted">لا توجد إنجازات بعد</p>
            </div>
        `;
        return;
    }
    
    let achievementsHtml = '';
    
    // Show new achievements first
    if (newAchievements && newAchievements.length > 0) {
        achievementsHtml += `
            <div class="alert alert-success mb-3">
                <i class="fas fa-star me-2"></i>
                <strong>إنجازات جديدة!</strong>
            </div>
        `;
    }
    
    // Remove duplicates by title and metric
    const uniqueAchievements = achievements.filter((achievement, index, self) => 
        index === self.findIndex(a => a.title === achievement.title && a.metric === achievement.metric)
    );
    
    // Display unique achievements
    uniqueAchievements.forEach(achievement => {
        const isNew = newAchievements.some(newAchievement => newAchievement.id === achievement.id);
        const badgeClass = isNew ? 'badge-success' : 'badge-secondary';
        
        // Get dynamic icon and color based on achievement type
        const icon = achievement.icon || getAchievementIcon(achievement.type, achievement.metric);
        const color = achievement.color || getAchievementColor(achievement.type, achievement.metric);
        
        achievementsHtml += `
            <div class="d-flex align-items-center mb-3 p-3 rounded" 
                 style="background-color: ${color}15; border-left: 4px solid ${color};">
                <div class="me-3">
                    <i class="${icon}" style="color: ${color}; font-size: 1.5rem;"></i>
                </div>
                <div class="flex-grow-1">
                    <h6 class="mb-1 fw-bold">${achievement.title}</h6>
                    <p class="text-muted mb-1 small">${achievement.description || ''}</p>
                    <div class="d-flex align-items-center">
                        <span class="badge ${badgeClass} me-2">${achievement.value}</span>
                        <small class="text-muted">${getMetricText(achievement.metric)}</small>
                    </div>
                </div>
                ${isNew ? '<span class="badge bg-success">جديد</span>' : ''}
            </div>
        `;
    });
    
    achievementsContent.innerHTML = achievementsHtml;
}

/**
 * Get achievement icon based on type and metric
 */
function getAchievementIcon(type, metric) {
    switch (metric) {
        case 'total_reports':
            return 'fas fa-file-alt';
        case 'total_clients':
            return 'fas fa-users';
        case 'total_invoices':
            return 'fas fa-file-invoice';
        case 'monthly_reports':
            return 'fas fa-calendar-check';
        default:
            return 'fas fa-trophy';
    }
}

/**
 * Get achievement color based on type and metric
 */
function getAchievementColor(type, metric) {
    switch (metric) {
        case 'total_reports':
            return '#007553';
        case 'total_clients':
            return '#0d6efd';
        case 'total_invoices':
            return '#fd7e14';
        case 'monthly_reports':
            return '#6f42c1';
        default:
            return '#6c757d';
    }
}

/**
 * Get metric text in Arabic
 */
function getMetricText(metric) {
    switch (metric) {
        case 'total_reports':
            return 'إجمالي التقارير';
        case 'total_clients':
            return 'إجمالي العملاء';
        case 'total_invoices':
            return 'إجمالي الفواتير';
        case 'monthly_reports':
            return 'التقارير الشهرية';
        default:
            return metric;
    }
}

/**
 * Display achievements error
 */
function displayAchievementsError() {
    const achievementsContent = document.getElementById('achievementsContent');
    if (!achievementsContent) return;
    
    achievementsContent.innerHTML = `
        <div class="text-center py-4">
            <i class="fas fa-exclamation-triangle text-warning fa-2x mb-3"></i>
            <p class="text-muted">تعذر تحميل الإنجازات</p>
        </div>
    `;
}

/**
 * Initialize goals and achievements event listeners
 */
function initializeGoalsAndAchievements() {
    // Edit goal button
    const editGoalBtn = document.getElementById('editGoalBtn');
    if (editGoalBtn) {
        editGoalBtn.addEventListener('click', function() {
            if (window.currentGoal) {
                populateGoalForm(window.currentGoal);
                const modal = new bootstrap.Modal(document.getElementById('editGoalModal'));
                modal.show();
            }
        });
    }
    
    // Save goal button
    const saveGoalBtn = document.getElementById('saveGoalBtn');
    if (saveGoalBtn) {
        saveGoalBtn.addEventListener('click', function() {
            saveGoal();
        });
    }
    
    // Add achievement button
    const addAchievementBtn = document.getElementById('addAchievementBtn');
    if (addAchievementBtn) {
        addAchievementBtn.addEventListener('click', function() {
            const modal = new bootstrap.Modal(document.getElementById('addAchievementModal'));
            modal.show();
        });
    }
    
    // Save achievement button
    const saveAchievementBtn = document.getElementById('saveAchievementBtn');
    if (saveAchievementBtn) {
        saveAchievementBtn.addEventListener('click', function() {
            saveAchievement();
        });
    }
}

/**
 * Populate goal form with current data
 */
function populateGoalForm(goal) {
    document.getElementById('goalTitle').value = goal.title;
    document.getElementById('goalType').value = goal.type;
    document.getElementById('goalTarget').value = goal.target;
    document.getElementById('goalUnit').value = goal.unit;
}

/**
 * Save goal
 */
function saveGoal() {
    const authMiddleware = new AuthMiddleware();
    const token = authMiddleware.getAdminToken();
    // Get baseUrl with port 3001 enforcement for localhost
    let baseUrl;
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (window.config && window.config.api && window.config.api.baseUrl) {
        baseUrl = window.config.api.baseUrl;
        // Override if config has wrong port for localhost
        if (isLocalhost && baseUrl.includes(':3000')) {
            baseUrl = 'http://localhost:3001';
        }
    } else if (isLocalhost) {
        baseUrl = 'http://localhost:3001';
    } else {
        baseUrl = window.location.origin;
    }
    // Final safety check
    if (isLocalhost && baseUrl.includes(':3000')) {
        baseUrl = 'http://localhost:3001';
    }
    
    const goalData = {
        title: document.getElementById('goalTitle').value,
        type: document.getElementById('goalType').value,
        target: parseInt(document.getElementById('goalTarget').value),
        unit: document.getElementById('goalUnit').value
    };
    
    fetch(`${baseUrl}/api/goals/current`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'x-auth-token': token
        },
        body: JSON.stringify(goalData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to update goal');
        }
        return response.json();
    })
    .then(updatedGoal => {
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('editGoalModal'));
        modal.hide();
        
        // Reload goals
        loadGoalsAndAchievements();
        
        // Show success message
        showToast('تم تحديث الهدف بنجاح', 'success');
    })
    .catch(error => {
        console.error('Error updating goal:', error);
        showToast('فشل في تحديث الهدف', 'error');
    });
}

/**
 * Save achievement
 */
function saveAchievement() {
    const authMiddleware = new AuthMiddleware();
    const token = authMiddleware.getAdminToken();
    // Get baseUrl with port 3001 enforcement for localhost
    let baseUrl;
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (window.config && window.config.api && window.config.api.baseUrl) {
        baseUrl = window.config.api.baseUrl;
        // Override if config has wrong port for localhost
        if (isLocalhost && baseUrl.includes(':3000')) {
            baseUrl = 'http://localhost:3001';
        }
    } else if (isLocalhost) {
        baseUrl = 'http://localhost:3001';
    } else {
        baseUrl = window.location.origin;
    }
    // Final safety check
    if (isLocalhost && baseUrl.includes(':3000')) {
        baseUrl = 'http://localhost:3001';
    }
    
    const achievementData = {
        title: document.getElementById('achievementTitle').value,
        description: document.getElementById('achievementDescription').value,
        metric: document.getElementById('achievementMetric').value,
        value: parseInt(document.getElementById('achievementValue').value),
        icon: document.getElementById('achievementIcon').value,
        color: document.getElementById('achievementColor').value,
        type: 'custom'
    };
    
    fetch(`${baseUrl}/api/goals/achievements`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-auth-token': token
        },
        body: JSON.stringify(achievementData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to create achievement');
        }
        return response.json();
    })
    .then(newAchievement => {
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('addAchievementModal'));
        modal.hide();
        
        // Clear form
        document.getElementById('addAchievementForm').reset();
        
        // Reload achievements
        loadGoalsAndAchievements();
        
        // Show success message
        showToast('تم إضافة الإنجاز بنجاح', 'success');
    })
    .catch(error => {
        console.error('Error creating achievement:', error);
        showToast('فشل في إضافة الإنجاز', 'error');
    });
}

/**
 * Show toast message
 */
function showToast(message, type = 'info') {
    // Create toast element
    const toastHtml = `
        <div class="toast align-items-center text-white bg-${type === 'success' ? 'success' : type === 'error' ? 'danger' : 'info'} border-0" 
             role="alert" aria-live="assertive" aria-atomic="true">
            <div class="d-flex">
                <div class="toast-body">
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        </div>
    `;
    
    // Add toast to page
    const toastContainer = document.getElementById('toastContainer') || createToastContainer();
    toastContainer.insertAdjacentHTML('beforeend', toastHtml);
    
    // Show toast
    const toastElement = toastContainer.lastElementChild;
    const toast = new bootstrap.Toast(toastElement);
    toast.show();
    
    // Remove toast after it's hidden
    toastElement.addEventListener('hidden.bs.toast', function() {
        toastElement.remove();
    });
}

/**
 * Create toast container if it doesn't exist
 */
function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container position-fixed top-0 end-0 p-3';
    container.style.zIndex = '9999';
    document.body.appendChild(container);
    return container;
}

/**
 * Check if admin is authenticated
 */
function checkAdminAuth() {
    // Check if AuthMiddleware class is available
    if (typeof AuthMiddleware === 'undefined') {
        console.error('AuthMiddleware class not available');
        return;
    }
    
    console.log('Checking admin authentication...');
    
    // Create AuthMiddleware instance to check if admin is logged in
    const authMiddleware = new AuthMiddleware();
    if (!authMiddleware.isAdminLoggedIn()) {
        console.log('Admin not authenticated, redirecting to login page');
        window.location.href = 'index.html';
        return;
    }
    
    console.log('Admin authenticated, access granted');
    
    // Optional: Validate token with server
    const adminToken = authMiddleware.getAdminToken();
    if (adminToken) {
        // Get apiBaseUrl with port 3001 enforcement for localhost
        let apiBaseUrl;
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        if (window.config && window.config.api && window.config.api.baseUrl) {
            apiBaseUrl = window.config.api.baseUrl;
            if (isLocalhost && apiBaseUrl.includes(':3000')) {
                apiBaseUrl = 'http://localhost:3001';
            }
        } else if (isLocalhost) {
            apiBaseUrl = 'http://localhost:3001';
        } else {
            apiBaseUrl = window.location.origin;
        }
        if (isLocalhost && apiBaseUrl.includes(':3000')) {
            apiBaseUrl = 'http://localhost:3001';
        }
        
        fetch(`${apiBaseUrl}/api/auth/me`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': adminToken
            }
        })
        .then(response => {
            if (!response.ok) {
                console.log('Token validation failed, clearing admin session');
                localStorage.removeItem('adminToken');
                localStorage.removeItem('adminInfo');
                sessionStorage.removeItem('adminToken');
                sessionStorage.removeItem('adminInfo');
    window.location.href = 'index.html';
            } else {
                console.log('Admin token validation successful');
            }
        })
        .catch(error => {
            console.error('Token validation error:', error);
            // On network error, don't clear sessions immediately
        });
    }
}

/**
 * Test API connectivity
 */
function testAPIConnectivity() {
    console.log('Testing API connectivity...');
    
    const authMiddleware = new AuthMiddleware();
    const token = authMiddleware.getAdminToken();
    // Get baseUrl with port 3001 enforcement for localhost
    let baseUrl;
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (window.config && window.config.api && window.config.api.baseUrl) {
        baseUrl = window.config.api.baseUrl;
        // Override if config has wrong port for localhost
        if (isLocalhost && baseUrl.includes(':3000')) {
            baseUrl = 'http://localhost:3001';
        }
    } else if (isLocalhost) {
        baseUrl = 'http://localhost:3001';
    } else {
        baseUrl = window.location.origin;
    }
    // Final safety check
    if (isLocalhost && baseUrl.includes(':3000')) {
        baseUrl = 'http://localhost:3001';
    }
    
    console.log('Testing with:', {
        baseUrl: baseUrl,
        hasToken: !!token,
        tokenLength: token ? token.length : 0
    });
    
    // Test a simple endpoint
    fetch(`${baseUrl}/api/reports/count`, {
        headers: {
            'x-auth-token': token || ''
        }
    })
    .then(response => {
        console.log('API Test Response:', {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok
        });
        return response.json();
    })
    .then(data => {
        console.log('API Test Data:', data);
    })
    .catch(error => {
        console.error('API Test Error:', error);
    });
}

/**
 * Test goals API endpoints
 */
function testGoalsAPI() {
    console.log('Testing goals API endpoints...');
    
    const authMiddleware = new AuthMiddleware();
    const token = authMiddleware.getAdminToken();
    // Get baseUrl with port 3001 enforcement for localhost
    let baseUrl;
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (window.config && window.config.api && window.config.api.baseUrl) {
        baseUrl = window.config.api.baseUrl;
        // Override if config has wrong port for localhost
        if (isLocalhost && baseUrl.includes(':3000')) {
            baseUrl = 'http://localhost:3001';
        }
    } else if (isLocalhost) {
        baseUrl = 'http://localhost:3001';
    } else {
        baseUrl = window.location.origin;
    }
    // Final safety check
    if (isLocalhost && baseUrl.includes(':3000')) {
        baseUrl = 'http://localhost:3001';
    }
    
    // Test goals endpoints
    Promise.all([
        fetch(`${baseUrl}/api/goals/current`, {
            headers: {
                'x-auth-token': token || ''
            }
        }),
        fetch(`${baseUrl}/api/goals/achievements`, {
            headers: {
                'x-auth-token': token || ''
            }
        })
    ])
    .then(responses => {
        console.log('Goals API Test Results:');
        responses.forEach((response, index) => {
            const endpoint = index === 0 ? 'current goal' : 'achievements';
            console.log(`${endpoint} endpoint:`, {
                status: response.status,
                statusText: response.statusText,
                ok: response.ok
            });
        });
    })
    .catch(error => {
        console.error('Goals API Test Error:', error);
    });
}

/**
 * Load device models sold in a specific time period
 */
function loadDeviceModelsInsights(period = 'this-month') {
    console.log('Loading device models insights for period:', period);
    
    const authMiddleware = new AuthMiddleware();
    const token = authMiddleware.getAdminToken();
    // Get baseUrl with port 3001 enforcement for localhost
    let baseUrl;
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (window.config && window.config.api && window.config.api.baseUrl) {
        baseUrl = window.config.api.baseUrl;
        // Override if config has wrong port for localhost
        if (isLocalhost && baseUrl.includes(':3000')) {
            baseUrl = 'http://localhost:3001';
        }
    } else if (isLocalhost) {
        baseUrl = 'http://localhost:3001';
    } else {
        baseUrl = window.location.origin;
    }
    // Final safety check
    if (isLocalhost && baseUrl.includes(':3000')) {
        baseUrl = 'http://localhost:3001';
    }
    
    // Calculate date range based on period
    const today = new Date();
    let startDate, endDate;
    
    switch(period) {
        case 'this-month':
            startDate = new Date(today.getFullYear(), today.getMonth(), 1);
            endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            endDate.setHours(23, 59, 59, 999);
            break;
        case 'last-month':
            startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            endDate = new Date(today.getFullYear(), today.getMonth(), 0);
            endDate.setHours(23, 59, 59, 999);
            break;
        case 'this-week':
            startDate = new Date(today);
            startDate.setDate(today.getDate() - today.getDay()); // Sunday
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(today);
            endDate.setHours(23, 59, 59, 999);
            break;
        case 'last-week':
            const lastWeekStart = new Date(today);
            lastWeekStart.setDate(today.getDate() - today.getDay() - 7); // Last Sunday
            lastWeekStart.setHours(0, 0, 0, 0);
            const lastWeekEnd = new Date(lastWeekStart);
            lastWeekEnd.setDate(lastWeekStart.getDate() + 6);
            lastWeekEnd.setHours(23, 59, 59, 999);
            startDate = lastWeekStart;
            endDate = lastWeekEnd;
            break;
        case 'last-30-days':
            startDate = new Date(today);
            startDate.setDate(today.getDate() - 30);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(today);
            endDate.setHours(23, 59, 59, 999);
            break;
        case 'last-7-days':
            startDate = new Date(today);
            startDate.setDate(today.getDate() - 7);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(today);
            endDate.setHours(23, 59, 59, 999);
            break;
        case 'custom':
            // Get custom dates from inputs
            const startInput = document.getElementById('device-models-start-date');
            const endInput = document.getElementById('device-models-end-date');
            if (startInput && endInput && startInput.value && endInput.value) {
                startDate = new Date(startInput.value);
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date(endInput.value);
                endDate.setHours(23, 59, 59, 999);
            } else {
                // Default to this month if custom dates not set
                startDate = new Date(today.getFullYear(), today.getMonth(), 1);
                endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                endDate.setHours(23, 59, 59, 999);
            }
            break;
        default:
            startDate = new Date(today.getFullYear(), today.getMonth(), 1);
            endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            endDate.setHours(23, 59, 59, 999);
    }
    
    // Build API URL with date range
    const url = `${baseUrl}/api/reports/insights/device-models?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`;
    
    fetch(url, {
        headers: {
            'x-auth-token': token
        }
    })
    .then(response => {
        console.log('Device models response status:', response.status, response.statusText);
        if (!response.ok) {
            throw new Error(`Failed to load device models: ${response.status} ${response.statusText}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Device models data:', data);
        displayDeviceModels(data, period, startDate, endDate);
    })
    .catch(error => {
        console.error('Error loading device models:', error);
        displayDeviceModelsError();
    });
}

/**
 * Display device models insights
 */
function displayDeviceModels(deviceModels, period = 'this-month', startDate = null, endDate = null) {
    const content = document.getElementById('deviceModelsContent');
    const countBadge = document.getElementById('device-models-count');
    const periodTextEl = document.getElementById('device-models-period-text');
    
    if (!content) return;
    
    // Update period text
    if (periodTextEl) {
        const periodTexts = {
            'this-month': 'أفضل الأجهزة مبيعاً في الشهر الحالي',
            'last-month': 'أفضل الأجهزة مبيعاً في الشهر الماضي',
            'this-week': 'أفضل الأجهزة مبيعاً في هذا الأسبوع',
            'last-week': 'أفضل الأجهزة مبيعاً في الأسبوع الماضي',
            'last-30-days': 'أفضل الأجهزة مبيعاً في آخر 30 يوم',
            'last-7-days': 'أفضل الأجهزة مبيعاً في آخر 7 أيام',
            'custom': startDate && endDate ? 
                `أفضل الأجهزة مبيعاً من ${formatArabicDate(startDate)} إلى ${formatArabicDate(endDate)}` :
                'أفضل الأجهزة مبيعاً'
        };
        periodTextEl.textContent = periodTexts[period] || periodTexts['this-month'];
    }
    
    if (!deviceModels || deviceModels.length === 0) {
        const emptyMessages = {
            'this-month': 'لا توجد أجهزة مباعة هذا الشهر',
            'last-month': 'لا توجد أجهزة مباعة في الشهر الماضي',
            'this-week': 'لا توجد أجهزة مباعة هذا الأسبوع',
            'last-week': 'لا توجد أجهزة مباعة في الأسبوع الماضي',
            'last-30-days': 'لا توجد أجهزة مباعة في آخر 30 يوم',
            'last-7-days': 'لا توجد أجهزة مباعة في آخر 7 أيام',
            'custom': 'لا توجد أجهزة مباعة في الفترة المحددة'
        };
        
        content.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-laptop text-muted fa-3x mb-3"></i>
                <p class="text-muted fs-5">${emptyMessages[period] || emptyMessages['this-month']}</p>
            </div>
        `;
        if (countBadge) countBadge.textContent = '0';
        return;
    }
    
    // Calculate total count for percentage calculations
    const totalCount = deviceModels.reduce((sum, m) => sum + parseInt(m.count || 0), 0);
    
    // Create enhanced display with chart and table
    let html = '<div class="row g-3">';
    
    // Left side: Top devices list with enhanced styling (scrollable)
    html += '<div class="col-lg-7">';
    html += '<div class="mb-3"><h6 class="fw-bold mb-3"><i class="fas fa-trophy text-warning me-2"></i>أفضل الأجهزة مبيعاً</h6></div>';
    html += '<div style="max-height: 450px; overflow-y: auto; padding-right: 10px;">';
    html += '<style>.device-models-scroll::-webkit-scrollbar { width: 6px; } .device-models-scroll::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 10px; } .device-models-scroll::-webkit-scrollbar-thumb { background: #888; border-radius: 10px; } .device-models-scroll::-webkit-scrollbar-thumb:hover { background: #555; }</style>';
    
    deviceModels.forEach((model, index) => {
        const count = parseInt(model.count || 0);
        const deviceModel = model.device_model || 'غير معروف';
        const percentage = totalCount > 0 ? ((count / totalCount) * 100).toFixed(1) : 0;
        const barWidth = totalCount > 0 ? (count / totalCount) * 100 : 0;
        
        // Color coding based on rank
        let borderColor = '#0d6efd';
        let bgColor = 'rgba(13, 110, 253, 0.05)';
        if (index === 0) {
            borderColor = '#ffc107';
            bgColor = 'rgba(255, 193, 7, 0.1)';
        } else if (index === 1) {
            borderColor = '#6c757d';
            bgColor = 'rgba(108, 117, 125, 0.1)';
        } else if (index === 2) {
            borderColor = '#fd7e14';
            bgColor = 'rgba(253, 126, 20, 0.1)';
        }
        
        html += `
            <div class="mb-3 p-3 rounded shadow-sm" style="background-color: ${bgColor}; border-left: 4px solid ${borderColor};">
                <div class="d-flex align-items-center justify-content-between mb-2">
                    <div class="d-flex align-items-center">
                        <div class="me-3" style="min-width: 30px;">
                            ${index === 0 ? '<i class="fas fa-crown text-warning fa-lg"></i>' : 
                              index === 1 ? '<i class="fas fa-medal text-secondary fa-lg"></i>' :
                              index === 2 ? '<i class="fas fa-award text-warning fa-lg"></i>' :
                              `<span class="fw-bold text-muted">${index + 1}</span>`}
                        </div>
                        <div>
                            <h6 class="mb-0 fw-bold">${deviceModel}</h6>
                        </div>
                    </div>
                    <div class="text-end">
                        <span class="badge bg-primary fs-6 px-3 py-2">${count} جهاز</span>
                        <small class="d-block text-muted mt-1">${percentage}%</small>
                    </div>
                </div>
                <div class="progress" style="height: 8px;">
                    <div class="progress-bar" role="progressbar" style="width: ${barWidth}%; background-color: ${borderColor};" 
                         aria-valuenow="${barWidth}" aria-valuemin="0" aria-valuemax="100"></div>
                </div>
            </div>
        `;
    });
    
    html += '</div></div>'; // Close scrollable container and col
    
    // Right side: Visual chart representation (scrollable)
    html += '<div class="col-lg-5">';
    html += '<div class="mb-3"><h6 class="fw-bold mb-3"><i class="fas fa-chart-pie text-info me-2"></i>التوزيع النسبي</h6></div>';
    html += '<div style="max-height: 450px; overflow-y: auto; padding-right: 10px;" class="device-models-scroll">';
    
    deviceModels.forEach((model, index) => {
        const count = parseInt(model.count || 0);
        const deviceModel = model.device_model || 'غير معروف';
        const percentage = totalCount > 0 ? ((count / totalCount) * 100).toFixed(1) : 0;
        
        html += `
            <div class="p-3 rounded shadow-sm" style="background: rgba(13, 110, 253, 0.03);">
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <span class="small fw-bold">${deviceModel}</span>
                    <span class="badge bg-info">${percentage}%</span>
                </div>
                <div class="progress" style="height: 10px;">
                    <div class="progress-bar bg-info" role="progressbar" style="width: ${percentage}%" 
                         aria-valuenow="${percentage}" aria-valuemin="0" aria-valuemax="100"></div>
                </div>
                <small class="text-muted d-block mt-2">${count} جهاز من ${totalCount} إجمالي</small>
            </div>
        `;
    });
    
    html += '</div></div>'; // Close scrollable container and col
    html += '</div>'; // Close row
    
    // Summary stats at bottom
    html += `
        <div class="row g-3 mt-3 pt-3 border-top">
            <div class="col-md-4">
                <div class="text-center p-3 rounded" style="background: rgba(13, 110, 253, 0.05);">
                    <i class="fas fa-laptop text-primary fa-2x mb-2"></i>
                    <h4 class="fw-bold mb-0">${deviceModels.length}</h4>
                    <small class="text-muted">نوع مختلف من الأجهزة</small>
                </div>
            </div>
            <div class="col-md-4">
                <div class="text-center p-3 rounded" style="background: rgba(25, 135, 84, 0.05);">
                    <i class="fas fa-shopping-cart text-success fa-2x mb-2"></i>
                    <h4 class="fw-bold mb-0">${totalCount}</h4>
                    <small class="text-muted">إجمالي الأجهزة المباعة</small>
                </div>
            </div>
            <div class="col-md-4">
                <div class="text-center p-3 rounded" style="background: rgba(255, 193, 7, 0.05);">
                    <i class="fas fa-chart-line text-warning fa-2x mb-2"></i>
                    <h4 class="fw-bold mb-0">${totalCount > 0 && deviceModels.length > 0 ? ((parseInt(deviceModels[0].count || 0) / totalCount) * 100).toFixed(1) : 0}%</h4>
                    <small class="text-muted">حصة أفضل جهاز</small>
                </div>
            </div>
        </div>
    `;
    
    content.innerHTML = html;
    if (countBadge) countBadge.textContent = deviceModels.length;
}

/**
 * Display device models error
 */
function displayDeviceModelsError() {
    const content = document.getElementById('deviceModelsContent');
    if (!content) return;
    
    content.innerHTML = `
        <div class="text-center py-4">
            <i class="fas fa-exclamation-triangle text-warning fa-2x mb-3"></i>
            <p class="text-muted">تعذر تحميل بيانات الأجهزة</p>
        </div>
    `;
}

/**
 * Load warranty alerts
 */
function loadWarrantyAlerts() {
    console.log('Loading warranty alerts');
    
    const authMiddleware = new AuthMiddleware();
    const token = authMiddleware.getAdminToken();
    // Get baseUrl with port 3001 enforcement for localhost
    let baseUrl;
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (window.config && window.config.api && window.config.api.baseUrl) {
        baseUrl = window.config.api.baseUrl;
        // Override if config has wrong port for localhost
        if (isLocalhost && baseUrl.includes(':3000')) {
            baseUrl = 'http://localhost:3001';
        }
    } else if (isLocalhost) {
        baseUrl = 'http://localhost:3001';
    } else {
        baseUrl = window.location.origin;
    }
    // Final safety check
    if (isLocalhost && baseUrl.includes(':3000')) {
        baseUrl = 'http://localhost:3001';
    }
    
    fetch(`${baseUrl}/api/reports/insights/warranty-alerts`, {
        headers: {
            'x-auth-token': token
        }
    })
    .then(response => {
        console.log('Warranty alerts response status:', response.status, response.statusText);
        if (!response.ok) {
            throw new Error(`Failed to load warranty alerts: ${response.status} ${response.statusText}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Warranty alerts data:', data);
        displayWarrantyAlerts(data);
    })
    .catch(error => {
        console.error('Error loading warranty alerts:', error);
        displayWarrantyAlertsError();
    });
}

/**
 * Display warranty alerts
 */
function displayWarrantyAlerts(alerts) {
    const content = document.getElementById('warrantyAlertsContent');
    const countBadge = document.getElementById('warranty-alerts-count');
    
    if (!content) return;
    
    if (!alerts || alerts.length === 0) {
        content.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-shield-check text-success fa-3x mb-3"></i>
                <p class="text-muted fs-5">لا توجد تنبيهات ضمان</p>
                <small class="text-muted">جميع الضمانات سارية المفعول</small>
            </div>
        `;
        if (countBadge) countBadge.textContent = '0';
        return;
    }
    
    // Group alerts by urgency
    const criticalAlerts = alerts.filter(a => a.days_remaining <= 3);
    const warningAlerts = alerts.filter(a => a.days_remaining > 3 && a.days_remaining <= 5);
    const infoAlerts = alerts.filter(a => a.days_remaining > 5);
    
    let html = '';
    
    // Summary cards at top
    html += `
        <div class="row g-2 mb-3">
            <div class="col-md-4">
                <div class="text-center p-2 rounded" style="background: rgba(220, 53, 69, 0.1); border: 1px solid rgba(220, 53, 69, 0.3);">
                    <i class="fas fa-exclamation-circle text-danger fa-lg mb-1"></i>
                    <h5 class="mb-0 text-danger">${criticalAlerts.length}</h5>
                    <small class="text-muted">عاجلة (≤ 3 أيام)</small>
                </div>
            </div>
            <div class="col-md-4">
                <div class="text-center p-2 rounded" style="background: rgba(255, 193, 7, 0.1); border: 1px solid rgba(255, 193, 7, 0.3);">
                    <i class="fas fa-exclamation-triangle text-warning fa-lg mb-1"></i>
                    <h5 class="mb-0 text-warning">${warningAlerts.length}</h5>
                    <small class="text-muted">تحذير (4-5 أيام)</small>
                </div>
            </div>
            <div class="col-md-4">
                <div class="text-center p-2 rounded" style="background: rgba(13, 202, 240, 0.1); border: 1px solid rgba(13, 202, 240, 0.3);">
                    <i class="fas fa-info-circle text-info fa-lg mb-1"></i>
                    <h5 class="mb-0 text-info">${infoAlerts.length}</h5>
                    <small class="text-muted">تنبيه (6-7 أيام)</small>
                </div>
            </div>
        </div>
    `;
    
    // Scrollable alerts list
    html += '<div style="max-height: 400px; overflow-y: auto; padding-right: 10px;" class="warranty-alerts-scroll">';
    html += '<style>.warranty-alerts-scroll::-webkit-scrollbar { width: 6px; } .warranty-alerts-scroll::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 10px; } .warranty-alerts-scroll::-webkit-scrollbar-thumb { background: #888; border-radius: 10px; } .warranty-alerts-scroll::-webkit-scrollbar-thumb:hover { background: #555; }</style>';
    
    // Display critical alerts first
    if (criticalAlerts.length > 0) {
        criticalAlerts.forEach(alert => {
            html += buildWarrantyAlertCard(alert, 'critical');
        });
    }
    
    // Then warning alerts
    if (warningAlerts.length > 0) {
        warningAlerts.forEach(alert => {
            html += buildWarrantyAlertCard(alert, 'warning');
        });
    }
    
    // Finally info alerts
    if (infoAlerts.length > 0) {
        infoAlerts.forEach(alert => {
            html += buildWarrantyAlertCard(alert, 'info');
        });
    }
    
    html += '</div>'; // Close scrollable container
    
    content.innerHTML = html;
    if (countBadge) countBadge.textContent = alerts.length;
}

/**
 * Build warranty alert card
 */
function buildWarrantyAlertCard(alert, urgencyLevel = 'info') {
    const urgencyConfig = {
        'critical': {
            color: '#dc3545',
            bgColor: 'rgba(220, 53, 69, 0.1)',
            borderColor: '#dc3545',
            icon: 'fa-exclamation-circle',
            badgeClass: 'bg-danger',
            text: 'عاجل'
        },
        'warning': {
            color: '#ffc107',
            bgColor: 'rgba(255, 193, 7, 0.1)',
            borderColor: '#ffc107',
            icon: 'fa-exclamation-triangle',
            badgeClass: 'bg-warning',
            text: 'تحذير'
        },
        'info': {
            color: '#0dcaf0',
            bgColor: 'rgba(13, 202, 240, 0.1)',
            borderColor: '#0dcaf0',
            icon: 'fa-info-circle',
            badgeClass: 'bg-info',
            text: 'تنبيه'
        }
    };
    
    const config = urgencyConfig[urgencyLevel] || urgencyConfig['info'];
    const warrantyTypeText = {
        'maintenance_6months': 'ضمان الصيانة (6 أشهر)',
        'maintenance_12months': 'ضمان الصيانة (12 شهر)'
    }[alert.warranty_type] || alert.warranty_type || 'ضمان';
    
    const inspectionDate = alert.inspection_date ? new Date(alert.inspection_date).toLocaleDateString('ar-EG') : 'غير محدد';
    const warrantyEndDate = alert.warranty_end_date ? new Date(alert.warranty_end_date).toLocaleDateString('ar-EG') : 'غير محدد';
    
    return `
        <div class="mb-3 p-3 rounded shadow-sm" 
             style="background-color: ${config.bgColor}; border-left: 4px solid ${config.borderColor};">
            <div class="d-flex align-items-start justify-content-between mb-2">
                <div class="d-flex align-items-start flex-grow-1">
                    <div class="me-3">
                        <i class="fas ${config.icon}" style="color: ${config.color}; font-size: 1.5rem; margin-top: 5px;"></i>
                    </div>
                    <div class="flex-grow-1">
                        <div class="d-flex align-items-center mb-1">
                            <h6 class="mb-0 fw-bold me-2">${alert.client_name || 'عميل غير معروف'}</h6>
                            <span class="badge ${config.badgeClass} badge-sm">${config.text}</span>
                        </div>
                        <div class="mb-2">
                            <p class="mb-1 fw-bold small">${alert.device_model || 'جهاز غير معروف'}</p>
                            ${alert.serial_number ? `<small class="text-muted d-block"><i class="fas fa-barcode me-1"></i>${alert.serial_number}</small>` : ''}
                        </div>
                        <div class="d-flex flex-wrap gap-2 mb-2">
                            <span class="badge ${config.badgeClass} fs-6 px-3 py-1">
                                <i class="fas fa-clock me-1"></i>
                                ${alert.days_remaining} ${alert.days_remaining === 1 ? 'يوم' : 'أيام'} متبقية
                            </span>
                            <span class="badge bg-secondary fs-6 px-3 py-1">
                                <i class="fas fa-shield-alt me-1"></i>
                                ${warrantyTypeText}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="row g-2 mt-2 pt-2 border-top" style="border-color: ${config.borderColor}40 !important;">
                <div class="col-6">
                    <small class="text-muted d-block">
                        <i class="fas fa-calendar-check me-1"></i>
                        تاريخ الفحص
                    </small>
                    <small class="fw-bold">${inspectionDate}</small>
                </div>
                <div class="col-6">
                    <small class="text-muted d-block">
                        <i class="fas fa-calendar-times me-1"></i>
                        ينتهي الضمان
                    </small>
                    <small class="fw-bold">${warrantyEndDate}</small>
                </div>
                ${alert.client_phone ? `
                <div class="col-12 mt-1">
                    <small class="text-muted d-block">
                        <i class="fas fa-phone me-1"></i>
                        ${alert.client_phone}
                    </small>
                </div>
                ` : ''}
                ${alert.report_id ? `
                <div class="col-12 mt-1">
                    <a href="report.html?id=${alert.report_id}" class="btn btn-sm btn-outline-primary w-100">
                        <i class="fas fa-eye me-1"></i>عرض التقرير
                    </a>
                </div>
                ` : ''}
            </div>
        </div>
    `;
}

/**
 * Display warranty alerts error
 */
function displayWarrantyAlertsError() {
    const content = document.getElementById('warrantyAlertsContent');
    if (!content) return;
    
    content.innerHTML = `
        <div class="text-center py-4">
            <i class="fas fa-exclamation-triangle text-warning fa-2x mb-3"></i>
            <p class="text-muted">تعذر تحميل تنبيهات الضمان</p>
        </div>
    `;
}

/**
 * Format date for display
 */
function formatDate(date) {
    return new Intl.DateTimeFormat('ar-SA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    }).format(date);
}