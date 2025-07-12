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
    
    const clientPages = [
        'client-dashboard.html',
        'client-login.html',
        'client-login-test.html'
    ];
    
    // Check if current page is an admin page
    const isAdminPage = adminPages.includes(filename);
    const isClientPage = clientPages.includes(filename);
    const isLoginPage = filename === 'index.html';
    
    console.log('Page type:', { isAdminPage, isClientPage, isLoginPage });
    
    // Handle authentication checks
    if (isAdminPage) {
        // Check if admin is logged in
        if (!authMiddleware.isAdminLoggedIn()) {
            console.log('Admin not authenticated, redirecting to login page');
            window.location.href = 'index.html';
            return;
        } else {
            console.log('Admin authenticated, access granted');
        }
    }
    
    if (isClientPage) {
        // Check if admin is viewing client profile or if client is logged in
        const isAdminViewing = sessionStorage.getItem('adminViewingClient') === 'true';
        
        if (!authMiddleware.isClientLoggedIn() && !isAdminViewing) {
            console.log('Client not authenticated and not admin viewing, redirecting to login page');
            window.location.href = 'index.html';
            return;
        } else if (isAdminViewing) {
            console.log('Admin viewing client profile, access granted');
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
                // Clear admin session
                localStorage.removeItem('adminToken');
                localStorage.removeItem('adminInfo');
                sessionStorage.removeItem('adminToken');
                sessionStorage.removeItem('adminInfo');
                
                console.log('Admin session cleared');
                
                // Redirect to login page
                window.location.href = 'index.html';
            } else if (button.classList.contains('client-logout-btn')) {
                // Clear client session
                localStorage.removeItem('clientToken');
                localStorage.removeItem('clientInfo');
                sessionStorage.removeItem('clientToken');
                sessionStorage.removeItem('clientInfo');
                
                console.log('Client session cleared');
                
                // Redirect to login page
                window.location.href = 'index.html';
            } else {
                // Generic logout - clear all sessions
                localStorage.removeItem('adminToken');
                localStorage.removeItem('adminInfo');
                localStorage.removeItem('clientToken');
                localStorage.removeItem('clientInfo');
                sessionStorage.removeItem('adminToken');
                sessionStorage.removeItem('adminInfo');
                sessionStorage.removeItem('clientToken');
                sessionStorage.removeItem('clientInfo');
                
                console.log('All sessions cleared');
                
                // Redirect to login page
                window.location.href = 'index.html';
            }
        });
    });
    
    // Add token validation on page load
    function validateToken() {
        const adminToken = authMiddleware.getAdminToken();
        const clientToken = authMiddleware.getClientToken();
        
        if (adminToken || clientToken) {
            // Validate token with server
            const token = adminToken || clientToken;
            const apiBaseUrl = window.config ? window.config.api.baseUrl : window.location.origin;
            
            fetch(`${apiBaseUrl}/api/auth/me`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                }
            })
            .then(response => {
                if (!response.ok) {
                    console.log('Token validation failed, clearing sessions');
                    // Clear invalid sessions
                    localStorage.removeItem('adminToken');
                    localStorage.removeItem('adminInfo');
                    localStorage.removeItem('clientToken');
                    localStorage.removeItem('clientInfo');
                    sessionStorage.removeItem('adminToken');
                    sessionStorage.removeItem('adminInfo');
                    sessionStorage.removeItem('clientToken');
                    sessionStorage.removeItem('clientInfo');
                    
                    // Redirect to login if not already there
                    if (!isLoginPage) {
                        window.location.href = 'index.html';
                    }
                } else {
                    console.log('Token validation successful');
                }
            })
            .catch(error => {
                console.error('Token validation error:', error);
                // On network error, don't clear sessions immediately
                // Let the user continue with their current session
            });
        }
    }
    
    // Run token validation after a short delay
    setTimeout(validateToken, 1000);
});
