/**
 * Laapak Report System - Authentication Check & Session Wrapper
 * Base authentication wrapper that checks for active sessions and redirects accordingly
 * This runs on ALL pages to ensure proper session management
 */

// Global Auth Wrapper - Runs immediately to check sessions
// This runs BEFORE DOMContentLoaded to catch sessions early
(function () {
    'use strict';

    // Immediate check function - checks storage directly
    function checkSessionImmediate() {
        try {
            // Get current page information
            const currentPath = window.location.pathname;
            const filename = currentPath.split('/').pop() || 'index.html';
            const isRoot = currentPath === '/' || currentPath.endsWith('/index.html') || filename === 'index.html' || filename === '';

            if (!isRoot) {
                return false;
            }

            // Check storage directly first (faster, no dependency on authMiddleware)
            // Check standard keys
            const adminTokenLocal = localStorage.getItem('adminToken');
            const adminTokenSession = sessionStorage.getItem('adminToken');
            const clientTokenLocal = localStorage.getItem('clientToken');
            const clientTokenSession = sessionStorage.getItem('clientToken');

            // Also check alternative keys (from remote SDK)
            const laapakToken = localStorage.getItem('laapak_token');

            // Also check clientInfo for token
            const clientInfoLocal = localStorage.getItem('clientInfo');
            const clientInfoSession = sessionStorage.getItem('clientInfo');

            // Try to get token from clientInfo if it exists
            let clientTokenFromInfo = null;
            if (clientInfoLocal) {
                try {
                    const info = JSON.parse(clientInfoLocal);
                    clientTokenFromInfo = info.token || null;
                } catch (e) { }
            }
            if (clientInfoSession && !clientTokenFromInfo) {
                try {
                    const info = JSON.parse(clientInfoSession);
                    clientTokenFromInfo = info.token || null;
                } catch (e) { }
            }

            const adminToken = adminTokenLocal || adminTokenSession;
            const clientToken = clientTokenLocal || clientTokenSession || laapakToken || clientTokenFromInfo;

            // Basic token validation (length check)
            const hasAdminSession = adminToken && adminToken.length >= 10;
            const hasClientSession = clientToken && clientToken.length >= 10;

            // Redirect immediately if session found
            if (hasAdminSession) {
                try {
                    window.location.replace('/admin.html');
                    return true;
                } catch (error) {
                    console.error('Error during redirect:', error);
                    return false;
                }
            }

            if (hasClientSession) {
                try {
                    window.location.replace('/client-dashboard.html');
                    return true;
                } catch (error) {
                    console.error('Error during redirect:', error);
                    return false;
                }
            }

            return false;
        } catch (error) {
            console.error('Error in checkSessionImmediate:', error);
            return false;
        }
    }

    // Enhanced check with authMiddleware when available
    function checkSessionEnhanced() {
        try {
            // Check if auth-middleware.js is loaded
            if (typeof authMiddleware === 'undefined') {
                setTimeout(checkSessionEnhanced, 50);
                return;
            }

            // Get current page information
            const currentPath = window.location.pathname;
            const filename = currentPath.split('/').pop() || 'index.html';
            const isRoot = currentPath === '/' || currentPath.endsWith('/index.html') || filename === 'index.html' || filename === '';

            if (!isRoot) {
                return;
            }

            // Use authMiddleware for more accurate check
            const adminLoggedIn = authMiddleware.isAdminLoggedIn();
            const clientLoggedIn = authMiddleware.isClientLoggedIn();

            // Redirect if authenticated
            if (adminLoggedIn) {
                try {
                    window.location.replace('/admin.html');
                    return;
                } catch (error) {
                    console.error('Error during redirect:', error);
                }
            }

            if (clientLoggedIn) {
                try {
                    window.location.replace('/client-dashboard.html');
                    return;
                } catch (error) {
                    console.error('Error during redirect:', error);
                }
            }
        } catch (error) {
            console.error('Error in checkSessionEnhanced:', error);
        }
    }

    // Run immediate check right away (before any scripts load)
    const immediateRedirect = checkSessionImmediate();

    // If immediate check didn't redirect, run enhanced check when scripts are ready
    if (!immediateRedirect) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', checkSessionEnhanced);
        } else {
            checkSessionEnhanced();
        }
    }
})();

// Page-specific authentication checks
document.addEventListener('DOMContentLoaded', async function () {
    // Check if auth-middleware.js is loaded
    if (typeof authMiddleware === 'undefined') {
        console.error('Auth middleware not loaded! Make sure auth-middleware.js is included before auth-check.js');
        return;
    }

    // Get current page information
    const currentPath = window.location.pathname;
    const filename = currentPath.split('/').pop() || 'index.html';

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

    // Handle authentication checks
    if (isAdminPage || isSuperadminPage) {
        // Check if admin is logged in
        if (!authMiddleware.isAdminLoggedIn()) {
            window.location.href = '/';
            return;
        } else {
            // For superadmin pages, check if user has superadmin role
            if (isSuperadminPage) {
                // Get user info from API instead of localStorage to ensure accuracy
                let userRole = 'admin'; // default fallback
                let adminInfo = {};

                console.log('[AUTH-CHECK] Checking superadmin access for financial page');

                try {
                    const token = authMiddleware.getAdminToken();
                    console.log('[AUTH-CHECK] Got admin token:', token ? 'Token exists' : 'No token');

                    const apiBaseUrl = window.config ? window.config.api.baseUrl : window.location.origin;
                    console.log('[AUTH-CHECK] API Base URL:', apiBaseUrl);

                    // Add a small delay to ensure the page is fully loaded
                    await new Promise(resolve => setTimeout(resolve, 100));

                    console.log('[AUTH-CHECK] Fetching user data from /api/auth/me');
                    const response = await fetch(`${apiBaseUrl}/api/auth/me`, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-auth-token': token
                        }
                    });

                    console.log('[AUTH-CHECK] API Response status:', response.status, response.ok ? 'OK' : 'NOT OK');

                    if (response.ok) {
                        const userData = await response.json();
                        console.log('[AUTH-CHECK] User data received:', JSON.stringify(userData, null, 2));

                        // Check if userData has a user property (wrapped) or is the user object directly
                        if (userData && userData.user) {
                            userRole = userData.user.role || 'admin';
                            adminInfo = userData.user;
                            console.log('[AUTH-CHECK] Extracted role from userData.user:', userRole);
                        } else if (userData && userData.role) {
                            // Direct user object response
                            userRole = userData.role || 'admin';
                            adminInfo = userData;
                            console.log('[AUTH-CHECK] Extracted role from userData directly:', userRole);
                        } else {
                            console.error('[AUTH-CHECK] Invalid user data structure:', userData);
                            throw new Error('Invalid user data structure');
                        }

                        // Update localStorage with fresh data
                        localStorage.setItem('adminInfo', JSON.stringify(adminInfo));
                        console.log('[AUTH-CHECK] Updated localStorage with fresh admin info');
                    } else {
                        const errorText = await response.text();
                        console.error('[AUTH-CHECK] API response not ok:', response.status, errorText);
                        throw new Error(`API response not ok: ${response.status} - ${errorText}`);
                    }
                } catch (error) {
                    console.error('[AUTH-CHECK] Error getting user info from API:', error);
                    console.log('[AUTH-CHECK] Falling back to localStorage');

                    // Fallback to localStorage
                    const storedInfo = localStorage.getItem('adminInfo');
                    console.log('[AUTH-CHECK] localStorage adminInfo:', storedInfo);

                    adminInfo = JSON.parse(storedInfo || '{}');
                    userRole = adminInfo.role || 'admin';
                    console.log('[AUTH-CHECK] Role from localStorage:', userRole);
                }

                console.log('[AUTH-CHECK] Final role decision:', userRole);
                console.log('[AUTH-CHECK] Is superadmin?', userRole === 'superadmin');

                if (userRole !== 'superadmin') {
                    console.warn('[AUTH-CHECK] Access denied - user is not superadmin');
                    showAccessDeniedModal(userRole);  // Pass the actual detected role
                    return;
                } else {
                    console.log('[AUTH-CHECK] Access granted - user is superadmin');
                }
            }
        }
    }

    if (isClientPage) {
        // Check if client is logged in
        if (!authMiddleware.isClientLoggedIn()) {
            window.location.href = '/';
            return;
        }
    }

    // Handle login page - redirect if already authenticated
    if (isLoginPage) {
        // Check if admin is already logged in
        if (authMiddleware.isAdminLoggedIn()) {
            window.location.href = 'admin.html';
            return;
        }

        // Check if client is already logged in
        if (authMiddleware.isClientLoggedIn()) {
            window.location.href = 'client-dashboard.html';
            return;
        }
    }

    // Add logout functionality to any logout buttons
    const logoutButtons = document.querySelectorAll('.admin-logout-btn, .client-logout-btn, .logout-btn');

    logoutButtons.forEach(button => {
        button.addEventListener('click', function (e) {
            e.preventDefault();

            if (button.classList.contains('admin-logout-btn')) {
                authMiddleware.adminLogout();
            } else if (button.classList.contains('client-logout-btn')) {
                authMiddleware.clientLogout();
            } else {
                // Generic logout - try both
                authMiddleware.adminLogout();
                authMiddleware.clientLogout();
            }

            // Redirect to domain root
            window.location.href = '/';
        });
    });
});


// Show access denied modal
function showAccessDeniedModal(detectedRole = 'admin') {
    console.log('[AUTH-CHECK] Showing access denied modal with role:', detectedRole);

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
                            <span id="currentUserRole"></span>
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

    // Show current user role (use the detected role, not localStorage)
    const roleDisplay = detectedRole === 'superadmin' ? 'مدير النظام الأعلى' : 'مدير';
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
