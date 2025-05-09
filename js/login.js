/**
 * Laapak Report System - Unified Login JavaScript
 * Handles both administrator and client authentication functionality
 * Updated to use backend authentication API
 */

document.addEventListener('DOMContentLoaded', function() {
    // Login form
    const loginForm = document.getElementById('unifiedLoginForm');
    const loginError = document.getElementById('loginError');
    const loginTypeSwitch = document.getElementById('loginTypeSwitch');
    const adminFields = document.getElementById('adminLoginFields');
    const clientFields = document.getElementById('clientLoginFields');
    const loginSubmitBtn = document.getElementById('loginSubmitBtn');
    const loginTypeLabel = document.getElementById('loginTypeLabel');
    
    // API endpoints
    const API_URL = window.location.origin;
    const ADMIN_LOGIN_URL = `${API_URL}/api/auth/admin`;
    const CLIENT_LOGIN_URL = `${API_URL}/api/auth/client`;
    
    let isAdminLogin = false; // Default to client login
    
    // Check if user is already logged in
    const checkExistingLogin = () => {
        const adminToken = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
        const clientToken = localStorage.getItem('clientToken') || sessionStorage.getItem('clientToken');
        
        if (adminToken) {
            // Redirect to admin dashboard
            window.location.href = 'admin.html';
            return true;
        } else if (clientToken) {
            // Redirect to client dashboard
            window.location.href = 'client-dashboard.html';
            return true;
        }
        
        return false;
    };
    
    // Check for existing login on page load
    if (checkExistingLogin()) {
        return; // Stop execution if already logged in
    }
    
    // Initialize login form type
    if (loginTypeSwitch) {
        loginTypeSwitch.addEventListener('change', function() {
            isAdminLogin = this.checked;
            
            if (isAdminLogin) {
                // Switch to admin login
                adminFields.classList.remove('d-none');
                clientFields.classList.add('d-none');
                loginTypeLabel.textContent = 'تسجيل دخول الموظفين';
                loginSubmitBtn.textContent = 'تسجيل دخول الموظفين';
            } else {
                // Switch to client login
                adminFields.classList.add('d-none');
                clientFields.classList.remove('d-none');
                loginTypeLabel.textContent = 'تسجيل دخول العملاء';
                loginSubmitBtn.textContent = 'تسجيل دخول العملاء';
            }
        });
    }
    
    // Show error message
    const showError = (message) => {
        loginError.textContent = message;
        loginError.classList.remove('d-none');
        
        // Clear error after 4 seconds
        setTimeout(() => {
            loginError.classList.add('d-none');
        }, 4000);
    };
    
    // Handle form submission
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Disable submit button during API call
            loginSubmitBtn.disabled = true;
            loginSubmitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> جاري تسجيل الدخول...';
            
            const rememberMe = document.getElementById('rememberMe').checked;
            
            try {
                if (isAdminLogin) {
                    // Admin login logic
                    const username = document.getElementById('username').value;
                    const password = document.getElementById('password').value;
                    
                    if (!username || !password) {
                        throw new Error('يرجى إدخال اسم المستخدم وكلمة المرور');
                    }
                    
                    // Call admin login API
                    const response = await fetch(ADMIN_LOGIN_URL, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ username, password })
                    });
                    
                    const data = await response.json();
                    
                    if (!response.ok) {
                        throw new Error(data.message || 'خطأ في اسم المستخدم أو كلمة المرور');
                    }
                    
                    // Store admin info and token
                    const adminInfo = {
                        userId: data.user.id,
                        name: data.user.name,
                        username: data.user.username,
                        role: data.user.role,
                        isLoggedIn: true,
                        loginTime: new Date().getTime()
                    };
                    
                    // Save to session or local storage based on "remember me" checkbox
                    if (rememberMe) {
                        localStorage.setItem('adminInfo', JSON.stringify(adminInfo));
                        localStorage.setItem('adminToken', data.token);
                    } else {
                        sessionStorage.setItem('adminInfo', JSON.stringify(adminInfo));
                        sessionStorage.setItem('adminToken', data.token);
                    }
                    
                    // Redirect to admin dashboard
                    window.location.href = 'admin.html';
                } else {
                    // Client login logic
                    const phoneNumber = document.getElementById('phoneNumber').value;
                    const orderCode = document.getElementById('orderCode').value;
                    
                    if (!phoneNumber || !orderCode) {
                        throw new Error('يرجى إدخال رقم الموبايل وكود الطلب');
                    }
                    
                    // Call client login API
                    const response = await fetch(CLIENT_LOGIN_URL, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ phone: phoneNumber, orderCode })
                    });
                    
                    const data = await response.json();
                    
                    if (!response.ok) {
                        throw new Error(data.message || 'خطأ في رقم الموبايل أو كود الطلب');
                    }
                    
                    // Store client info and token
                    const clientInfo = {
                        clientId: data.user.id,
                        name: data.user.name,
                        phone: data.user.phone,
                        isLoggedIn: true,
                        loginTime: new Date().getTime()
                    };
                    
                    // Save to session or local storage based on "remember me" checkbox
                    if (rememberMe) {
                        localStorage.setItem('clientInfo', JSON.stringify(clientInfo));
                        localStorage.setItem('clientToken', data.token);
                    } else {
                        sessionStorage.setItem('clientInfo', JSON.stringify(clientInfo));
                        sessionStorage.setItem('clientToken', data.token);
                    }
                    
                    // Redirect to client dashboard
                    window.location.href = 'client-dashboard.html';
                }
            } catch (error) {
                // Show error message
                showError(error.message);
            } finally {
                // Re-enable submit button
                loginSubmitBtn.disabled = false;
                loginSubmitBtn.textContent = isAdminLogin ? 'تسجيل دخول الموظفين' : 'تسجيل دخول العملاء';
            }
        });
    }

    // Check for offline status
    function updateOfflineStatus() {
        const offlineAlert = document.getElementById('offlineAlert');
        if (offlineAlert) {
            if (navigator.onLine) {
                offlineAlert.style.display = 'none';
            } else {
                offlineAlert.style.display = 'block';
            }
        }
    }

    // Initial check
    updateOfflineStatus();

    // Listen for online/offline events
    window.addEventListener('online', updateOfflineStatus);
    window.addEventListener('offline', updateOfflineStatus);
});
