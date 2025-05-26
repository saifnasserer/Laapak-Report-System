/**
 * Laapak Report System - Admin Dashboard JavaScript
 * Handles functionality specific to the admin dashboard
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('Admin dashboard loaded');
    // Check if admin is authenticated
    checkAdminAuth();
    
    // Load dashboard data from API
    loadDashboardStats();
    displayCurrentDate();
    initializeCharts();
    loadRecentReports();
    loadRecentInvoices();
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
    
    // API base URL
    const baseUrl = window.location.origin;
    
    // Make simultaneous API requests to get statistics
    Promise.all([
        // Total reports count
        fetch(`${baseUrl}/api/reports/count`, {
            headers: {
                'x-auth-token': token
            }
        }),
        // Total invoices count
        fetch(`${baseUrl}/api/invoices/count`, {
            headers: {
                'x-auth-token': token
            }
        }),
        // Total clients count
        fetch(`${baseUrl}/api/clients/count`, {
            headers: {
                'x-auth-token': token
            }
        }),
        // Unpaid invoices count
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
    
    // Make API request to get recent reports
    fetch(`${window.location.origin}/api/reports?limit=5&sort=desc`, {
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
    
    // Make API request to get recent invoices
    fetch(`${window.location.origin}/api/invoices?limit=5&sort=desc`, {
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
    const baseUrl = window.location.origin;
    
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
 * Check if admin is authenticated
 */
function checkAdminAuth() {
    const adminInfo = JSON.parse(localStorage.getItem('adminInfo') || '{}');
    const authMiddleware = new AuthMiddleware();
    
    console.log('Admin authentication check:', adminInfo);
    
    // Check if we have a token from the auth middleware
    if (authMiddleware.isAdminLoggedIn()) {
        console.log('Admin authenticated via auth middleware');
        return;
    }
    
    // If not, check if we have admin info stored locally
    if (!adminInfo || Object.keys(adminInfo).length === 0) {
        console.log('No admin info found, redirecting to login');
        window.location.href = 'index.html';
        return;
    }
    
    // Allow access if we have a token
    if (adminInfo.token) {
        console.log('Admin authenticated via stored token');
        return;
    }
    
    // Allow access if we have a name but no token (for development)
    if (!adminInfo.token && adminInfo.name) {
        console.log('Development mode: Allowing access without token');
        return;
    }
    
    // If we have no valid authentication, redirect to login
    console.log('Admin not authenticated, redirecting to login');
    window.location.href = 'index.html';
}