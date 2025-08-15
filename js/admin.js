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
    loadDashboardStats();
    displayCurrentDate();
    initializeCharts();
    loadRecentReports();
    loadRecentInvoices();
    loadGoalsAndAchievements();
    loadDeviceModelsInsights();
    loadWarrantyAlerts();
    
    // Initialize goal and achievement event listeners
    initializeGoalsAndAchievements();
});

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
    const baseUrl = window.config ? window.config.api.baseUrl : window.location.origin;
    console.log('API Base URL:', baseUrl);
    
    // Make simultaneous API requests to get statistics
    Promise.all([
        // Total reports count
        fetch(`${baseUrl}/api/reports/count`, {
            headers: {
                'x-auth-token': token
            }
        }).then(response => {
            console.log('Reports count response:', response.status, response.statusText);
            return response;
        }),
        // Total invoices count
        fetch(`${baseUrl}/api/invoices/count`, {
            headers: {
                'x-auth-token': token
            }
        }).then(response => {
            console.log('Invoices count response:', response.status, response.statusText);
            return response;
        }),
        // Total clients count
        fetch(`${baseUrl}/api/clients/count`, {
            headers: {
                'x-auth-token': token
            }
        }).then(response => {
            console.log('Clients count response:', response.status, response.statusText);
            return response;
        }),
        // Unpaid invoices count
        fetch(`${baseUrl}/api/invoices/count?paymentStatus=unpaid`, {
            headers: {
                'x-auth-token': token
            }
        }).then(response => {
            console.log('Unpaid invoices count response:', response.status, response.statusText);
            return response;
        })
    ])
    .then(responses => {
        // Check if all responses are ok
        const failedResponses = responses.filter(resp => !resp.ok);
        if (failedResponses.length > 0) {
            console.error('Failed responses:', failedResponses);
            throw new Error(`Failed to load dashboard stats: ${failedResponses.length} requests failed`);
        }
        return Promise.all(responses.map(resp => resp.json()));
    })
    .then(data => {
        console.log('Dashboard stats data:', data);
        // Process data [totalReports, totalInvoices, totalClients, unpaidInvoices]
        // Add element existence checks to prevent errors
        const totalReportsEl = document.getElementById('total-reports');
        const totalInvoicesEl = document.getElementById('total-invoices');
        const totalClientsEl = document.getElementById('total-clients');
        const pendingReportsEl = document.getElementById('pending-reports');
        
        if (totalReportsEl) totalReportsEl.textContent = data[0].count || '0';
        if (totalInvoicesEl) totalInvoicesEl.textContent = data[1].count || '0';
        if (totalClientsEl) totalClientsEl.textContent = data[2].count || '0';
        if (pendingReportsEl) pendingReportsEl.textContent = data[3].count || '0';
        
        console.log('Updated dashboard elements with data');
    })
    .catch(error => {
        console.error('Error loading dashboard stats:', error);
        
        // Set placeholder values on error (only if elements exist)
        const totalReportsEl = document.getElementById('total-reports');
        const totalInvoicesEl = document.getElementById('total-invoices');
        const totalClientsEl = document.getElementById('total-clients');
        const pendingReportsEl = document.getElementById('pending-reports');
        
        if (totalReportsEl) totalReportsEl.textContent = '0';
        if (totalInvoicesEl) totalInvoicesEl.textContent = '0';
        if (totalClientsEl) totalClientsEl.textContent = '0';
        if (pendingReportsEl) pendingReportsEl.textContent = '0';
        
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
    const baseUrl = window.config ? window.config.api.baseUrl : window.location.origin;
    
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
                        <a href="edit-report.html?id=${report.id}" class="btn btn-sm btn-outline-success me-1">
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
    const baseUrl = window.config ? window.config.api.baseUrl : window.location.origin;
    
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
    dateElement.textContent = arabicDate;
}

/**
 * Initialize dashboard charts
 */
function initializeCharts() {
    // Get admin token for API requests
    const adminInfo = JSON.parse(localStorage.getItem('adminInfo') || '{}');
    const authMiddleware = new AuthMiddleware();
    const token = authMiddleware.getAdminToken() || adminInfo.token || '';
    const baseUrl = window.config ? window.config.api.baseUrl : window.location.origin;
    
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
                
                // Create the chart
                new Chart(performanceChartCanvas, {
                    type: 'line',
                    data: {
                        labels: last6Months,
                        datasets: [
                            {
                                label: 'التقارير',
                                data: reportsData,
                                borderColor: '#007553',
                                backgroundColor: 'rgba(0, 117, 83, 0.1)',
                                borderWidth: 2,
                                pointBackgroundColor: '#007553',
                                tension: 0.4,
                                fill: true
                            },
                            {
                                label: 'الفواتير',
                                data: invoicesData,
                                borderColor: '#0d6efd',
                                backgroundColor: 'rgba(13, 110, 253, 0.1)',
                                borderWidth: 2,
                                pointBackgroundColor: '#0d6efd',
                                tension: 0.4,
                                fill: true
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'top',
                                align: 'end',
                                labels: {
                                    boxWidth: 10,
                                    usePointStyle: true,
                                    pointStyle: 'circle'
                                }
                            },
                            tooltip: {
                                mode: 'index',
                                intersect: false,
                                rtl: true,
                                titleAlign: 'right',
                                bodyAlign: 'right'
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                grid: {
                                    drawBorder: false,
                                    display: true,
                                    drawOnChartArea: true,
                                    drawTicks: false,
                                    borderDash: [5, 5]
                                },
                                ticks: {
                                    display: true,
                                    padding: 10,
                                    color: '#b2b9bf',
                                    font: {
                                        size: 11,
                                        family: 'Cairo, sans-serif',
                                        style: 'normal',
                                        lineHeight: 2
                                    }
                                }
                            },
                            x: {
                                grid: {
                                    drawBorder: false,
                                    display: false,
                                    drawOnChartArea: false,
                                    drawTicks: false,
                                    borderDash: [5, 5]
                                },
                                ticks: {
                                    display: true,
                                    color: '#b2b9bf',
                                    padding: 20,
                                    font: {
                                        size: 11,
                                        family: 'Cairo, sans-serif',
                                        style: 'normal',
                                        lineHeight: 2
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
                    type: 'line',
                    data: {
                        labels: last6Months,
                        datasets: []
                    },
                    options: {
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
    
    // Invoice Status Chart - Doughnut chart
    const invoiceStatusChartCanvas = document.getElementById('invoiceStatusChart');
    if (invoiceStatusChartCanvas) {
        // Fetch real invoice data by payment status
        Promise.all([
            // Paid invoices
            fetch(`${baseUrl}/api/invoices/count?paymentStatus=paid`, {
                headers: {
                    'x-auth-token': token
                }
            }),
            // Partially paid invoices
            fetch(`${baseUrl}/api/invoices/count?paymentStatus=partial`, {
                headers: {
                    'x-auth-token': token
                }
            }),
            // Unpaid invoices
            fetch(`${baseUrl}/api/invoices/count?paymentStatus=unpaid`, {
                headers: {
                    'x-auth-token': token
                }
            })
        ])
        .then(responses => {
            // Check if all responses are ok
            const failedResponses = responses.filter(resp => !resp.ok);
            if (failedResponses.length > 0) {
                throw new Error(`Failed to load invoice status data: ${failedResponses.length} requests failed`);
            }
            return Promise.all(responses.map(resp => resp.json()));
        })
        .then(data => {
            // Extract counts from results [paid, partial, unpaid]
            const invoiceStatusData = data.map(result => result.count || 0);
            
            // Create the chart
            new Chart(invoiceStatusChartCanvas, {
                type: 'doughnut',
                data: {
                    labels: ['مدفوعة', 'مدفوعة جزئياً', 'غير مدفوعة'],
                    datasets: [{
                        data: invoiceStatusData,
                        backgroundColor: ['#198754', '#ffc107', '#dc3545'],
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
                                pointStyle: 'circle'
                            }
                        },
                        tooltip: {
                            rtl: true,
                            titleAlign: 'right',
                            bodyAlign: 'right'
                        }
                    }
                }
            });
        })
        .catch(error => {
            console.error('Error loading invoice status data:', error);
            // Show error message on the chart
            new Chart(invoiceStatusChartCanvas, {
                type: 'doughnut',
                data: {
                    labels: [],
                    datasets: []
                },
                options: {
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
}

/**
 * Load goals and achievements
 */
function loadGoalsAndAchievements() {
    console.log('Loading goals and achievements');
    
    const authMiddleware = new AuthMiddleware();
    const token = authMiddleware.getAdminToken();
    const baseUrl = window.config ? window.config.api.baseUrl : window.location.origin;
    
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
    const baseUrl = window.config ? window.config.api.baseUrl : window.location.origin;
    
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
    const baseUrl = window.config ? window.config.api.baseUrl : window.location.origin;
    
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
    // Check if authMiddleware is available
    if (typeof authMiddleware === 'undefined') {
        console.error('AuthMiddleware not available');
        return;
    }
    
    console.log('Checking admin authentication...');
    
    // Use authMiddleware to check if admin is logged in
    if (!authMiddleware.isAdminLoggedIn()) {
        console.log('Admin not authenticated, redirecting to login page');
        window.location.href = 'index.html';
        return;
    }
    
    console.log('Admin authenticated, access granted');
    
    // Optional: Validate token with server
    const adminToken = authMiddleware.getAdminToken();
    if (adminToken) {
        const apiBaseUrl = window.config ? window.config.api.baseUrl : window.location.origin;
        
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
    const baseUrl = window.config ? window.config.api.baseUrl : window.location.origin;
    
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
    const baseUrl = window.config ? window.config.api.baseUrl : window.location.origin;
    
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
 * Load device models sold this month
 */
function loadDeviceModelsInsights() {
    console.log('Loading device models insights');
    
    const authMiddleware = new AuthMiddleware();
    const token = authMiddleware.getAdminToken();
    const baseUrl = window.config ? window.config.api.baseUrl : window.location.origin;
    
    fetch(`${baseUrl}/api/reports/insights/device-models`, {
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
        displayDeviceModels(data);
    })
    .catch(error => {
        console.error('Error loading device models:', error);
        displayDeviceModelsError();
    });
}

/**
 * Display device models insights
 */
function displayDeviceModels(deviceModels) {
    const content = document.getElementById('deviceModelsContent');
    const countBadge = document.getElementById('device-models-count');
    
    if (!content) return;
    
    if (!deviceModels || deviceModels.length === 0) {
        content.innerHTML = `
            <div class="text-center py-4">
                <i class="fas fa-laptop text-muted fa-2x mb-3"></i>
                <p class="text-muted">لا توجد أجهزة مباعة هذا الشهر</p>
            </div>
        `;
        if (countBadge) countBadge.textContent = '0';
        return;
    }
    
    let html = '';
    let totalCount = 0;
    
    deviceModels.forEach((model, index) => {
        totalCount += parseInt(model.count);
        const percentage = ((model.count / deviceModels.reduce((sum, m) => sum + parseInt(m.count), 0)) * 100).toFixed(1);
        
        html += `
            <div class="d-flex align-items-center mb-3 p-3 rounded" 
                 style="background-color: rgba(13, 110, 253, 0.05); border-left: 4px solid #0d6efd;">
                <div class="me-3">
                    <div class="fw-bold text-primary">${index + 1}</div>
                </div>
                <div class="flex-grow-1">
                    <h6 class="mb-1 fw-bold">${model.device_model}</h6>
                    <div class="d-flex align-items-center">
                        <span class="badge bg-primary me-2">${model.count} جهاز</span>
                        <small class="text-muted">${percentage}% من المبيعات</small>
                    </div>
                </div>
            </div>
        `;
    });
    
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
    const baseUrl = window.config ? window.config.api.baseUrl : window.location.origin;
    
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
            <div class="text-center py-4">
                <i class="fas fa-shield-check text-success fa-2x mb-3"></i>
                <p class="text-muted">لا توجد تنبيهات ضمان</p>
            </div>
        `;
        if (countBadge) countBadge.textContent = '0';
        return;
    }
    
    let html = '';
    
    alerts.forEach(alert => {
        const urgencyClass = alert.days_remaining <= 3 ? 'border-danger' : 
                           alert.days_remaining <= 5 ? 'border-warning' : 'border-info';
        const urgencyColor = alert.days_remaining <= 3 ? '#dc3545' : 
                           alert.days_remaining <= 5 ? '#ffc107' : '#0dcaf0';
        
        const warrantyTypeText = {
            'maintenance_6months': 'ضمان الصيانة الدورية (6 أشهر)',
            'maintenance_12months': 'ضمان الصيانة الدورية (12 شهر)'
        }[alert.warranty_type] || alert.warranty_type;
        
        html += `
            <div class="d-flex align-items-center mb-3 p-3 rounded" 
                 style="background-color: ${urgencyColor}15; border-left: 4px solid ${urgencyColor};">
                <div class="me-3">
                    <i class="fas fa-exclamation-triangle" style="color: ${urgencyColor}; font-size: 1.2rem;"></i>
                </div>
                <div class="flex-grow-1">
                    <h6 class="mb-1 fw-bold">${alert.client_name}</h6>
                    <p class="text-muted mb-1 small">${alert.device_model}</p>
                    <div class="d-flex align-items-center">
                        <span class="badge ${alert.days_remaining <= 3 ? 'bg-danger' : alert.days_remaining <= 5 ? 'bg-warning' : 'bg-info'} me-2">
                            ${alert.days_remaining} يوم
                        </span>
                        <small class="text-muted">${warrantyTypeText}</small>
                    </div>
                </div>
                <div class="text-end">
                    <small class="text-muted d-block">${formatDate(new Date(alert.warranty_end_date))}</small>
                    <a href="report.html?id=${alert.report_id}" class="btn btn-sm btn-outline-primary">
                        <i class="fas fa-eye"></i>
                    </a>
                </div>
            </div>
        `;
    });
    
    content.innerHTML = html;
    if (countBadge) countBadge.textContent = alerts.length;
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