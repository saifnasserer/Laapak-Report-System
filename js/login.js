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
    const CLIENT_LOGIN_URL = `${API_URL}/api/clients/auth`;
    
    console.log('API endpoints:', { ADMIN_LOGIN_URL, CLIENT_LOGIN_URL });
    
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
        if (loginError) {
            loginError.textContent = message;
            loginError.classList.remove('d-none');
            
            // Clear error after 4 seconds
            setTimeout(() => {
                loginError.classList.add('d-none');
            }, 4000);
        } else {
            console.error('Login error:', message);
            alert(message);
        }
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
                    console.log('Attempting admin login with:', { username, password: '******' });
                    
                    const response = await fetch(ADMIN_LOGIN_URL, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ username, password })
                    });
                    
                    console.log('Admin login response status:', response.status);
                    
                    const responseText = await response.text();
                    console.log('Raw admin response:', responseText);
                    
                    let data;
                    try {
                        data = JSON.parse(responseText);
                        console.log('Admin login response data:', data);
                    } catch (e) {
                        console.error('Failed to parse JSON response:', responseText);
                        throw new Error('خطأ في الاتصال بالخادم');
                    }
                    
                    if (!response.ok) {
                        throw new Error(data.message || 'خطأ في اسم المستخدم أو كلمة المرور');
                    }
                    
                    // Store admin info and token
                    const adminInfo = {
                        userId: data.user.id,
                        username: data.user.username,
                        name: data.user.name,
                        role: data.user.role,
                        token: data.token
                    };
                    
                    // Save to storage based on remember me option
                    if (rememberMe) {
                        localStorage.setItem('adminToken', data.token);
                        localStorage.setItem('adminInfo', JSON.stringify(adminInfo));
                    } else {
                        sessionStorage.setItem('adminToken', data.token);
                        sessionStorage.setItem('adminInfo', JSON.stringify(adminInfo));
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
                    console.log('Attempting client login with:', { phone: phoneNumber, orderCode: '******' });
                    console.log('Sending request to:', CLIENT_LOGIN_URL);
                    
                    const response = await fetch(CLIENT_LOGIN_URL, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ phone: phoneNumber, orderCode })
                    });
                    
                    console.log('Client login response status:', response.status);
                    
                    const responseText = await response.text();
                    console.log('Raw client response:', responseText);
                    
                    let responseData;
                    try {
                        responseData = JSON.parse(responseText);
                        console.log('Client login response data:', responseData);
                    } catch (e) {
                        console.error('Failed to parse JSON response:', responseText);
                        throw new Error('خطأ في الاتصال بالخادم');
                    }
                    
                    if (!response.ok) {
                        throw new Error(responseData.message || 'خطأ في رقم الموبايل أو كود الطلب');
                    }
                    
                    // If we got here, login was successful
                    // Store client info and token
                    const clientInfo = {
                        clientId: responseData.client.id,
                        name: responseData.client.name,
                        phone: responseData.client.phone,
                        email: responseData.client.email,
                        isLoggedIn: true,
                        loginTime: new Date().getTime()
                    };
                    
                    console.log('Storing client info:', clientInfo);
                    
                    // Save to session or local storage based on "remember me" checkbox
                    if (rememberMe) {
                        localStorage.setItem('clientInfo', JSON.stringify(clientInfo));
                        localStorage.setItem('clientToken', responseData.token);
                    } else {
                        sessionStorage.setItem('clientInfo', JSON.stringify(clientInfo));
                        sessionStorage.setItem('clientToken', responseData.token);
                    }
                    
                    // Redirect to client dashboard
                    console.log('Login successful, redirecting to client dashboard');
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
