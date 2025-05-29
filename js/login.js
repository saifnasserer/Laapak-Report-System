/**
 * Laapak Report System - Unified Login JavaScript
 * Handles both administrator and client authentication functionality
 * Updated to use backend authentication API and apiService
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
    
    // API endpoints - Use config object if available, otherwise fallback to environment value
    const API_URL = window.config ? window.config.api.baseUrl : 'https://reports.laapak.com';
    const ADMIN_LOGIN_URL = `${API_URL}/api/auth/admin`;
    const CLIENT_LOGIN_URL = `${API_URL}/api/clients/auth`;
    
    console.log('Admin login URL:', ADMIN_LOGIN_URL);
    console.log('Client login URL:', CLIENT_LOGIN_URL);
    
    console.log('API endpoints initialized');
    
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
    
    // Create a simple API service for login if apiService is not available
    const loginApiService = window.apiService || {
        async adminLogin(username, password) {
            console.log('Sending admin login request to:', ADMIN_LOGIN_URL);
            console.log('With credentials:', { username, password });
            
            try {
                const response = await fetch(ADMIN_LOGIN_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });
                
                console.log('Admin login response status:', response.status);
                
                if (!response.ok) {
                    const errorData = await response.json();
                    console.error('Admin login error:', errorData);
                    throw new Error(errorData.message || 'خطأ في اسم المستخدم أو كلمة المرور');
                }
                
                const data = await response.json();
                console.log('Admin login successful, received data:', data);
                return data;
            } catch (error) {
                console.error('Admin login fetch error:', error);
                throw error;
            }
        },
        
        async clientLogin(phone, orderCode) {
            console.log('Sending client login request to:', CLIENT_LOGIN_URL);
            console.log('With credentials:', { phone, orderCode });
            
            try {
                const response = await fetch(CLIENT_LOGIN_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ phone, orderCode })
                });
                
                console.log('Client login response status:', response.status);
                
                if (!response.ok) {
                    const errorData = await response.json();
                    console.error('Client login error:', errorData);
                    throw new Error(errorData.message || 'خطأ في رقم الموبايل أو كود الطلب');
                }
                
                const data = await response.json();
                console.log('Client login successful, received data:', data);
                return data;
            } catch (error) {
                console.error('Client login fetch error:', error);
                throw error;
            }
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
                    console.log('Attempting admin login with username:', username);
                    
                    const data = await loginApiService.adminLogin(username, password);
                    console.log('Admin login successful');
                    
                    // Store admin info and token
                    const adminInfo = {
                        userId: data.user.id,
                        username: data.user.username,
                        name: data.user.name,
                        role: data.user.role,
                        isLoggedIn: true,
                        loginTime: new Date().getTime()
                    };
                    
                    // Save to storage based on remember me option
                    if (rememberMe) {
                        localStorage.setItem('adminToken', data.token);
                        localStorage.setItem('adminInfo', JSON.stringify(adminInfo));
                    } else {
                        sessionStorage.setItem('adminToken', data.token);
                        sessionStorage.setItem('adminInfo', JSON.stringify(adminInfo));
                    }
                    
                    // Update API service auth token if available
                    if (window.apiService && typeof window.apiService.setAuthToken === 'function') {
                        window.apiService.setAuthToken(data.token);
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
                    console.log('Attempting client login with phone:', phoneNumber);
                    
                    const responseData = await loginApiService.clientLogin(phoneNumber, orderCode);
                    console.log('Client login successful');
                    
                    // Store client info and token
                    // The backend returns client object, not user
                    console.log('Client login response data:', responseData);
                    
                    // Safely create client info object with null checks
                    const clientInfo = {
                        clientId: responseData?.client?.id || 0,
                        name: responseData?.client?.name || 'Client',
                        phone: responseData?.client?.phone || '',
                        email: responseData?.client?.email || '',
                        isLoggedIn: true,
                        loginTime: new Date().getTime()
                    };
                    
                    // Log the created client info for debugging
                    console.log('Created client info object:', clientInfo);
                    
                    // Save to session or local storage based on "remember me" checkbox
                    if (rememberMe) {
                        localStorage.setItem('clientInfo', JSON.stringify(clientInfo));
                        localStorage.setItem('clientToken', responseData.token);
                    } else {
                        sessionStorage.setItem('clientInfo', JSON.stringify(clientInfo));
                        sessionStorage.setItem('clientToken', responseData.token);
                    }
                    
                    // Update API service auth token if available
                    if (window.apiService && typeof window.apiService.setAuthToken === 'function') {
                        window.apiService.setAuthToken(responseData.token);
                    }
                    
                    // Redirect to client dashboard
                    window.location.href = 'client-dashboard.html';
                }
            } catch (error) {
                // Show error message
                showError(error.message);
                console.error('Login error:', error);
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
