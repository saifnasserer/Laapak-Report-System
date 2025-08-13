/**
 * Laapak Report System - Authentication Check
 * This script checks if a user is authenticated before allowing access to protected pages
 */

document.addEventListener('DOMContentLoaded', function() {
    // Check if auth-middleware.js is loaded
    if (typeof authMiddleware === 'undefined') {
        console.error('Auth middleware not loaded! Make sure auth-middleware.js is included before auth-check.js');
        return;
    }

    // Get current page information
    const currentPath = window.location.pathname;
    const filename = currentPath.split('/').pop() || 'index.html';
    
    console.log('Auth check for page:', filename);
    
    // Define protected pages
    const adminPages = [
        'admin.html', 
        'reports.html', 
        'create-report.html', 
        'clients.html', 
        'settings.html',
        'report.html',
        'invoices.html',
        'create-invoice.html',
        'edit-invoice.html',
        'view-invoice.html'
    ];
    
    // Define superadmin-only pages (financial pages)
    const superadminPages = [
        'financial-dashboard.html',
        'financial-profit-management.html',
        'financial-add-expense.html'
    ];
    
    const clientPages = [
        'client-dashboard.html',
        'client-login.html',
        'client-login-test.html'
    ];
    
    // Check if current page is an admin page
    const isAdminPage = adminPages.includes(filename);
    const isSuperadminPage = superadminPages.includes(filename);
    const isClientPage = clientPages.includes(filename);
    const isLoginPage = filename === 'index.html';
    
    console.log('Page type:', { isAdminPage, isSuperadminPage, isClientPage, isLoginPage });
    
    // Handle authentication checks
    if (isAdminPage || isSuperadminPage) {
        // Check if admin is logged in
        if (!authMiddleware.isAdminLoggedIn()) {
            console.log('Admin not authenticated, redirecting to login page');
            window.location.href = 'index.html';
            return;
        } else {
            console.log('Admin authenticated, checking role permissions...');
            
            // For superadmin pages, check if user has superadmin role
            if (isSuperadminPage) {
                const adminInfo = JSON.parse(localStorage.getItem('adminInfo') || '{}');
                const userRole = adminInfo.role || 'admin';
                
                console.log('User role:', userRole);
                
                if (userRole !== 'superadmin') {
                    console.log('Access denied: Financial pages require superadmin role');
                    showAccessDeniedModal();
                    return;
                } else {
                    console.log('Superadmin access granted to financial page');
                }
            } else {
                console.log('Admin access granted');
            }
        }
    }
    
    if (isClientPage) {
        // Check if client is logged in
        if (!authMiddleware.isClientLoggedIn()) {
            console.log('Client not authenticated, redirecting to login page');
            window.location.href = 'index.html';
            return;
        } else {
            console.log('Client authenticated, access granted');
        }
    }
    
    // Handle login page - redirect if already authenticated
    if (isLoginPage) {
        // Check if admin is already logged in
        if (authMiddleware.isAdminLoggedIn()) {
            console.log('Admin already authenticated, redirecting to admin dashboard');
            window.location.href = 'admin.html';
            return;
        }
        
        // Check if client is already logged in
        if (authMiddleware.isClientLoggedIn()) {
            console.log('Client already authenticated, redirecting to client dashboard');
            window.location.href = 'client-dashboard.html';
            return;
        }
        
        console.log('No authentication found, staying on login page');
    }
    
    // Add logout functionality to any logout buttons
    const logoutButtons = document.querySelectorAll('.admin-logout-btn, .client-logout-btn, .logout-btn');
    
    logoutButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            console.log('Logout button clicked');
            
            if (button.classList.contains('admin-logout-btn')) {
                authMiddleware.adminLogout();
            } else if (button.classList.contains('client-logout-btn')) {
                authMiddleware.clientLogout();
            } else {
                // Generic logout - try both
                authMiddleware.adminLogout();
                authMiddleware.clientLogout();
            }
            
            // Redirect to login page
            window.location.href = 'index.html';
        });
    });
});

// Show access denied modal
function showAccessDeniedModal() {
    // Create modal HTML
    const modalHTML = `
        <div class="modal fade" id="accessDeniedModal" tabindex="-1" data-bs-backdrop="static" data-bs-keyboard="false">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header border-0">
                        <h5 class="modal-title text-danger">
                            <i class="fas fa-exclamation-triangle me-2"></i>
                            رفض الوصول
                        </h5>
                    </div>
                    <div class="modal-body text-center py-4">
                        <div class="mb-4">
                            <i class="fas fa-lock" style="font-size: 4rem; color: #dc3545; opacity: 0.7;"></i>
                        </div>
                        <h4 class="mb-3">غير مصرح لك بالوصول</h4>
                        <p class="text-muted mb-4">
                            هذه الصفحة متاحة فقط لمدير النظام الأعلى (Super Admin).<br>
                            يرجى التواصل مع مدير النظام للحصول على الصلاحيات المطلوبة.
                        </p>
                        <div class="alert alert-info">
                            <i class="fas fa-info-circle me-2"></i>
                            <strong>دورك الحالي:</strong> 
                            <span id="currentUserRole">مدير</span>
                        </div>
                    </div>
                    <div class="modal-footer border-0 justify-content-center">
                        <button type="button" class="btn btn-primary" onclick="redirectToAdmin()">
                            <i class="fas fa-arrow-left me-2"></i>
                            العودة للوحة التحكم
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to page
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Show current user role
    const adminInfo = JSON.parse(localStorage.getItem('adminInfo') || '{}');
    const userRole = adminInfo.role || 'admin';
    const roleDisplay = userRole === 'superadmin' ? 'مدير النظام الأعلى' : 'مدير';
    document.getElementById('currentUserRole').textContent = roleDisplay;
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('accessDeniedModal'));
    modal.show();
    
    // Prevent modal from being closed by clicking outside or pressing ESC
    document.getElementById('accessDeniedModal').addEventListener('hide.bs.modal', function (e) {
        e.preventDefault();
        return false;
    });
}

// Redirect to admin dashboard
function redirectToAdmin() {
    window.location.href = 'admin.html';
}
