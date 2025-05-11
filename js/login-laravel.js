/**
 * Laapak Report System - Unified Login JavaScript
 * Handles both administrator and client authentication functionality
 * Updated to use Laravel API service for authentication
 */

document.addEventListener('DOMContentLoaded', function() {
    // Login form elements
    const loginForm = document.getElementById('unifiedLoginForm');
    const loginError = document.getElementById('loginError');
    const loginTypeSwitch = document.getElementById('loginTypeSwitch');
    const adminFields = document.getElementById('adminLoginFields');
    const clientFields = document.getElementById('clientLoginFields');
    const loginSubmitBtn = document.getElementById('loginSubmitBtn');
    const loginTypeLabel = document.getElementById('loginTypeLabel');
    const rememberMeCheckbox = document.getElementById('rememberMe');
    
    console.log('Login form elements initialized');
    
    let isAdminLogin = false; // Default to client login
    
    // Check if user is already logged in
    const checkExistingLogin = () => {
        // Check for admin or client token
        if (apiService.isLoggedIn('admin')) {
            window.location.href = 'admin.html';
            return true;
        } else if (apiService.isLoggedIn('client')) {
            window.location.href = 'client-dashboard.html';
            return true;
        }
        return false;
    };
    
    // Check for existing login on page load
    if (checkExistingLogin()) {
        return; // Exit if already logged in
    }
    
    // Toggle between admin and client login forms
    if (loginTypeSwitch) {
        loginTypeSwitch.addEventListener('change', function() {
            isAdminLogin = this.checked;
            
            if (isAdminLogin) {
                adminFields.style.display = 'block';
                clientFields.style.display = 'none';
                loginTypeLabel.textContent = 'تسجيل دخول الموظفين';
                loginSubmitBtn.textContent = 'تسجيل دخول كموظف';
            } else {
                adminFields.style.display = 'none';
                clientFields.style.display = 'block';
                loginTypeLabel.textContent = 'تسجيل دخول العملاء';
                loginSubmitBtn.textContent = 'تسجيل دخول كعميل';
            }
        });
    }
    
    // Handle form submission
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Clear previous error messages
            if (loginError) {
                loginError.textContent = '';
                loginError.style.display = 'none';
            }
            
            // Disable submit button and show loading state
            if (loginSubmitBtn) {
                loginSubmitBtn.disabled = true;
                loginSubmitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> جاري تسجيل الدخول...';
            }
            
            try {
                const rememberMe = rememberMeCheckbox ? rememberMeCheckbox.checked : false;
                
                if (isAdminLogin) {
                    // Admin login
                    const username = document.getElementById('adminUsername').value;
                    const password = document.getElementById('adminPassword').value;
                    
                    if (!username || !password) {
                        throw new Error('يرجى إدخال اسم المستخدم وكلمة المرور');
                    }
                    
                    // Use Laravel API service for admin login
                    const response = await apiService.adminLogin(username, password, rememberMe);
                    
                    if (response.error) {
                        throw new Error(response.message || 'فشل تسجيل الدخول. يرجى التحقق من بيانات الاعتماد الخاصة بك.');
                    }
                    
                    console.log('Admin login successful:', response);
                    
                    // Redirect to admin dashboard
                    window.location.href = 'admin.html';
                } else {
                    // Client login
                    const phone = document.getElementById('clientPhone').value;
                    const orderCode = document.getElementById('clientOrderCode').value;
                    
                    if (!phone || !orderCode) {
                        throw new Error('يرجى إدخال رقم الهاتف ورمز الطلب');
                    }
                    
                    // Use Laravel API service for client login
                    const response = await apiService.clientLogin(phone, orderCode, rememberMe);
                    
                    if (response.error) {
                        throw new Error(response.message || 'فشل تسجيل الدخول. يرجى التحقق من بيانات الاعتماد الخاصة بك.');
                    }
                    
                    console.log('Client login successful:', response);
                    
                    // Redirect to client dashboard
                    window.location.href = 'client-dashboard.html';
                }
            } catch (error) {
                console.error('Login error:', error);
                
                // Show error message
                if (loginError) {
                    loginError.textContent = error.message || 'حدث خطأ أثناء تسجيل الدخول';
                    loginError.style.display = 'block';
                }
                
                // Reset submit button
                if (loginSubmitBtn) {
                    loginSubmitBtn.disabled = false;
                    loginSubmitBtn.textContent = isAdminLogin ? 'تسجيل دخول كموظف' : 'تسجيل دخول كعميل';
                }
            }
        });
    }
});
