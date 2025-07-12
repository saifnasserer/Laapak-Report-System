/**
 * Laapak Report System - Admin Login JavaScript
 * Handles administrator authentication functionality
 */

document.addEventListener('DOMContentLoaded', function() {
    // Admin login form
    const loginForm = document.getElementById('adminLoginForm');
    const loginError = document.getElementById('loginError');
    
    // API endpoints - Use config object if available, otherwise fallback to environment value
    const API_URL = window.config ? window.config.api.baseUrl : 'https://reports.laapak.com';
    const ADMIN_LOGIN_URL = `${API_URL}/api/auth/admin`;
    
    console.log('Admin login URL:', ADMIN_LOGIN_URL);
    
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const rememberMe = document.getElementById('rememberMe').checked;
            
            // Disable submit button during API call
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> جاري تسجيل الدخول...';
            
            try {
                if (!username || !password) {
                    throw new Error('يرجى إدخال اسم المستخدم وكلمة المرور');
                }
                
                // Call admin login API
                console.log('Attempting admin login with username:', username);
                
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
                
            } catch (error) {
                console.error('Admin login error:', error);
                
                // Show error message
                if (loginError) {
                    loginError.textContent = error.message;
                    loginError.classList.remove('d-none');
                    
                    // Clear error after 4 seconds
                    setTimeout(() => {
                        loginError.classList.add('d-none');
                    }, 4000);
                } else {
                    alert(error.message);
                }
            } finally {
                // Re-enable submit button
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
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
