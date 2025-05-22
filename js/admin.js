/**
 * Laapak Report System - Admin Dashboard JavaScript
 * Handles functionality specific to the admin dashboard
 */

document.addEventListener('DOMContentLoaded', function() {
    // Check if admin is authenticated
    checkAdminAuth();
    
    // Load dashboard data from API
    loadDashboardStats();
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
    
    // Make simultaneous API requests to get statistics
    Promise.all([
        fetch('http://localhost:3001/api/reports/count', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        }),
        fetch('http://localhost:3001/api/invoices/count', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        }),
        fetch('http://localhost:3001/api/clients/count', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        }),
        fetch('http://localhost:3001/api/reports/count?status=pending', {
            headers: {
                'Authorization': `Bearer ${token}`
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
        // Process data [totalReports, totalInvoices, totalClients, pendingReports]
        document.getElementById('total-reports').textContent = data[0].count || '0';
        document.getElementById('total-invoices').textContent = data[1].count || '0';
        document.getElementById('total-clients').textContent = data[2].count || '0';
        document.getElementById('pending-reports').textContent = data[3].count || '0';
    })
    .catch(error => {
        console.error('Error loading dashboard stats:', error);
        
        // Set placeholder values on error
        document.getElementById('total-reports').textContent = '0';
        document.getElementById('total-invoices').textContent = '0';
        document.getElementById('total-clients').textContent = '0';
        document.getElementById('pending-reports').textContent = '0';
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
    fetch('http://localhost:3001/api/reports?limit=5&sort=desc', {
        headers: {
            'Authorization': `Bearer ${token}`
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
            const formattedDate = new Date(report.inspection_date).toLocaleDateString('ar-SA');
            
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
    fetch('http://localhost:3001/api/invoices?limit=5&sort=desc', {
        headers: {
            'Authorization': `Bearer ${token}`
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
        data.forEach(invoice => {
            const formattedDate = new Date(invoice.date).toLocaleDateString('ar-SA');
            const formattedAmount = invoice.total.toLocaleString('ar-SA') + ' ر.س';
            
            invoicesTable.innerHTML += `
                <tr>
                    <td class="ps-4">${invoice.id}</td>
                    <td>${invoice.client?.name || 'غير معروف'}</td>
                    <td>${formattedDate}</td>
                    <td>${formattedAmount}</td>
                    <td><span class="badge ${getPaymentStatusClass(invoice.paymentStatus)}">${translatePaymentStatus(invoice.paymentStatus)}</span></td>
                    <td class="text-center">
                        <a href="view-invoice.html?id=${invoice.id}" class="btn btn-sm btn-outline-primary me-1">
                            <i class="fas fa-eye"></i>
                        </a>
                        <a href="edit-invoice.html?id=${invoice.id}" class="btn btn-sm btn-outline-success me-1">
                            <i class="fas fa-edit"></i>
                        </a>
                    </td>
                </tr>
            `;
        });
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
            return 'مدفوع';
        case 'partial':
            return 'مدفوع جزئياً';
        case 'unpaid':
            return 'غير مدفوع';
        default:
            return status;
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