/**
 * Login functionality for Laapak Reports
 * Handles both admin and client login processes
 */

document.addEventListener('DOMContentLoaded', function() {
    // Check if already logged in
    if (authUtils.isAuthenticated()) {
        authUtils.redirectToDashboard();
        return;
    }

    // Toggle between admin and client login forms
    setupLoginToggle();
    
    // Setup form submissions
    setupAdminLoginForm();
    setupClientLoginForm();
});

/**
 * Setup login form toggle
 */
function setupLoginToggle() {
    const adminToggle = document.getElementById('admin-login-toggle');
    const clientToggle = document.getElementById('client-login-toggle');
    const adminForm = document.getElementById('admin-login-form');
    const clientForm = document.getElementById('client-login-form');

    if (adminToggle && clientToggle && adminForm && clientForm) {
        adminToggle.addEventListener('click', function(e) {
            e.preventDefault();
            adminForm.classList.remove('d-none');
            clientForm.classList.add('d-none');
            adminToggle.classList.add('active');
            clientToggle.classList.remove('active');
        });

        clientToggle.addEventListener('click', function(e) {
            e.preventDefault();
            adminForm.classList.add('d-none');
            clientForm.classList.remove('d-none');
            adminToggle.classList.remove('active');
            clientToggle.classList.add('active');
        });
    }
}

/**
 * Setup admin login form submission
 */
function setupAdminLoginForm() {
    const adminForm = document.getElementById('admin-login-form');
    
    if (adminForm) {
        adminForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('admin-email').value;
            const password = document.getElementById('admin-password').value;
            const rememberMe = document.getElementById('admin-remember').checked;
            
            try {
                showLoading('admin-login-btn');
                
                // For development/testing, use the simulate method
                // In production, use the real adminLogin method
                const response = await apiService.simulateLogin('admin', { email, password });
                // const response = await apiService.adminLogin(email, password);
                
                if (rememberMe) {
                    // Set longer expiration for token if remember me is checked
                    // This would be handled by the backend in a real implementation
                }
                
                authUtils.storeAuthData(response, 'admin');
                showSuccess('admin-login-form', 'Login successful! Redirecting...');
                
                // Redirect to admin dashboard
                setTimeout(() => {
                    window.location.href = 'admin.html';
                }, 1000);
            } catch (error) {
                hideLoading('admin-login-btn', 'Login');
                showError('admin-login-form', error.message || 'Login failed. Please check your credentials.');
                console.error('Admin login error:', error);
            }
        });
    }
}

/**
 * Setup client login form submission
 */
function setupClientLoginForm() {
    const clientForm = document.getElementById('client-login-form');
    
    if (clientForm) {
        clientForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const phone = document.getElementById('client-phone').value;
            const orderCode = document.getElementById('client-order-code').value;
            
            try {
                showLoading('client-login-btn');
                
                // For development/testing, use the simulate method
                // In production, use the real clientLogin method
                const response = await apiService.simulateLogin('client', { phone, orderCode });
                // const response = await apiService.clientLogin(phone, orderCode);
                
                authUtils.storeAuthData(response, 'client');
                showSuccess('client-login-form', 'Login successful! Redirecting...');
                
                // Redirect to client dashboard
                setTimeout(() => {
                    window.location.href = 'client-dashboard.html';
                }, 1000);
            } catch (error) {
                hideLoading('client-login-btn', 'Login');
                showError('client-login-form', error.message || 'Login failed. Please check your credentials.');
                console.error('Client login error:', error);
            }
        });
    }
}

/**
 * Show loading state on button
 * @param {string} buttonId - Button ID
 */
function showLoading(buttonId) {
    const button = document.getElementById(buttonId);
    if (button) {
        button.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Loading...';
        button.disabled = true;
    }
}

/**
 * Hide loading state on button
 * @param {string} buttonId - Button ID
 * @param {string} text - Button text
 */
function hideLoading(buttonId, text = 'Login') {
    const button = document.getElementById(buttonId);
    if (button) {
        button.innerHTML = text;
        button.disabled = false;
    }
}

/**
 * Show success message
 * @param {string} formId - Form ID
 * @param {string} message - Success message
 */
function showSuccess(formId, message) {
    const form = document.getElementById(formId);
    if (form) {
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-success mt-3';
        alertDiv.role = 'alert';
        alertDiv.textContent = message;
        
        // Remove any existing alerts
        const existingAlerts = form.querySelectorAll('.alert');
        existingAlerts.forEach(alert => alert.remove());
        
        form.appendChild(alertDiv);
    }
}

/**
 * Show error message
 * @param {string} formId - Form ID
 * @param {string} message - Error message
 */
function showError(formId, message) {
    const form = document.getElementById(formId);
    if (form) {
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-danger mt-3';
        alertDiv.role = 'alert';
        alertDiv.textContent = message;
        
        // Remove any existing alerts
        const existingAlerts = form.querySelectorAll('.alert');
        existingAlerts.forEach(alert => alert.remove());
        
        form.appendChild(alertDiv);
    }
}
