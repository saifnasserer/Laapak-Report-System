/**
 * Laapak Report System - Authentication Check
 * This script checks if a user is authenticated before allowing access to protected pages
 */

document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on a protected admin page
    const currentPath = window.location.pathname;
    const adminPages = [
        '/admin.html', 
        '/reports.html', 
        '/create-report.html', 
        '/clients.html', 
        '/settings.html',
        '/report.html'
    ];
    
    // Get the filename from the path
    const filename = currentPath.split('/').pop();
    
    // Check if current page is an admin page
    const isAdminPage = adminPages.some(page => page.includes(filename));
    
    if (isAdminPage) {
        // Check if admin is logged in
        const adminInfo = JSON.parse(localStorage.getItem('adminInfo') || sessionStorage.getItem('adminInfo') || '{}');
        
        if (!adminInfo.isLoggedIn) {
            // Not logged in, redirect to admin login
            window.location.href = 'admin-login.html';
        }
    }
    
    // Check if we're on a client page
    const clientPages = [
        '/client-dashboard.html'
    ];
    
    // Check if current page is a client page
    const isClientPage = clientPages.some(page => page.includes(filename));
    
    if (isClientPage) {
        // Check if client is logged in
        const clientInfo = JSON.parse(localStorage.getItem('clientInfo') || sessionStorage.getItem('clientInfo') || '{}');
        
        if (!clientInfo.isLoggedIn) {
            // Not logged in, redirect to client login
            window.location.href = 'client-login.html';
        }
    }
    
    // Add logout functionality to any logout buttons
    const logoutButtons = document.querySelectorAll('.admin-logout-btn, .client-logout-btn');
    
    logoutButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            if (button.classList.contains('admin-logout-btn')) {
                // Clear admin session
                localStorage.removeItem('adminInfo');
                sessionStorage.removeItem('adminInfo');
                
                // Redirect to admin login
                window.location.href = 'admin-login.html';
            } else {
                // Clear client session
                localStorage.removeItem('clientInfo');
                sessionStorage.removeItem('clientInfo');
                
                // Redirect to client login
                window.location.href = 'client-login.html';
            }
        });
    });
});
