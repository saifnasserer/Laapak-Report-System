/**
 * Laapak Report System - Admin Login JavaScript
 * Handles administrator authentication functionality
 */

document.addEventListener('DOMContentLoaded', function() {
    // Admin login form
    const loginForm = document.getElementById('adminLoginForm');
    const loginError = document.getElementById('loginError');
    
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const rememberMe = document.getElementById('rememberMe').checked;
            
            // Show loading state
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>جاري تسجيل الدخول...';
            
            try {
                // Get API base URL
                const baseUrl = window.config ? window.config.api.baseUrl : window.location.origin;
                
                // Call the real admin login API
                const response = await fetch(`${baseUrl}/api/auth/admin`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, password })
                });
                
                const result = await response.json();
                
                if (response.ok && result.token) {
                    // Store admin info and token
                    const adminInfo = {
                        userId: result.user.id,
                        name: result.user.name,
                        username: result.user.username,
                        role: result.user.role,
                        token: result.token,
                        isLoggedIn: true,
                        loginTime: new Date().getTime()
                    };
                    
                    // Save to session or local storage based on "remember me" checkbox
                    if (rememberMe) {
                        localStorage.setItem('adminInfo', JSON.stringify(adminInfo));
                        localStorage.setItem('adminToken', result.token);
                    } else {
                        sessionStorage.setItem('adminInfo', JSON.stringify(adminInfo));
                        sessionStorage.setItem('adminToken', result.token);
                    }
                    
                    console.log('Admin login successful:', adminInfo);
                    
                    // Redirect to admin dashboard
                    window.location.href = 'admin.html';
                } else {
                    // Show error message
                    const errorMessage = result.message || 'خطأ في تسجيل الدخول';
                    loginError.textContent = errorMessage;
                    loginError.classList.remove('d-none');
                    
                    // Clear error after 4 seconds
                    setTimeout(() => {
                        loginError.classList.add('d-none');
                    }, 4000);
                }
            } catch (error) {
                console.error('Login error:', error);
                
                // Show error message
                loginError.textContent = 'خطأ في الاتصال بالخادم. يرجى المحاولة مرة أخرى.';
                loginError.classList.remove('d-none');
                
                // Clear error after 4 seconds
                setTimeout(() => {
                    loginError.classList.add('d-none');
                }, 4000);
            } finally {
                // Restore button state
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
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
