/**
 * Laapak Report System - Unified Login JavaScript
 * Handles both administrator and client authentication functionality
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
    
    let isAdminLogin = false; // Default to client login
    
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
    
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const rememberMe = document.getElementById('rememberMe').checked;
            
            if (isAdminLogin) {
                // Admin login logic
                const username = document.getElementById('username').value;
                const password = document.getElementById('password').value;
                
                // Mock admin users data (in real implementation, this would come from a server)
                const mockAdmins = [
                    { username: "admin", password: "admin123", userId: "1", name: "مدير النظام", role: "admin" },
                    { username: "tech", password: "tech123", userId: "2", name: "فني الصيانة", role: "technician" },
                    { username: "viewer", password: "viewer123", userId: "3", name: "مشاهد", role: "viewer" }
                ];
                
                // Validate credentials
                const admin = mockAdmins.find(a => a.username === username && a.password === password);
                
                if (admin) {
                    // Store admin info in session/local storage
                    const adminInfo = {
                        userId: admin.userId,
                        name: admin.name,
                        username: admin.username,
                        role: admin.role,
                        isLoggedIn: true,
                        loginTime: new Date().getTime()
                    };
                    
                    // Save to session or local storage based on "remember me" checkbox
                    if (rememberMe) {
                        localStorage.setItem('adminInfo', JSON.stringify(adminInfo));
                    } else {
                        sessionStorage.setItem('adminInfo', JSON.stringify(adminInfo));
                    }
                    
                    // Redirect to admin dashboard
                    window.location.href = 'admin.html';
                } else {
                    // Show error message
                    loginError.textContent = 'خطأ في اسم المستخدم أو كلمة المرور. يرجى المحاولة مرة أخرى.';
                    loginError.classList.remove('d-none');
                    
                    // Clear error after 4 seconds
                    setTimeout(() => {
                        loginError.classList.add('d-none');
                    }, 4000);
                }
            } else {
                // Client login logic
                const phoneNumber = document.getElementById('phoneNumber').value;
                const orderCode = document.getElementById('orderCode').value;
                
                // Mock clients data (in real implementation, this would come from a server)
                const mockClients = [
                    { phone: "0501234567", orderCode: "LP12345", clientId: "1", name: "أحمد محمد" },
                    { phone: "0509876543", orderCode: "LP67890", clientId: "2", name: "سارة علي" },
                    { phone: "0553219876", orderCode: "LP54321", clientId: "3", name: "محمود خالد" }
                ];
                
                // Validate credentials
                const client = mockClients.find(c => c.phone === phoneNumber && c.orderCode === orderCode);
                
                if (client) {
                    // Store client info in session/local storage
                    const clientInfo = {
                        clientId: client.clientId,
                        name: client.name,
                        phone: client.phone,
                        isLoggedIn: true,
                        loginTime: new Date().getTime()
                    };
                    
                    // Save to session or local storage based on "remember me" checkbox
                    if (rememberMe) {
                        localStorage.setItem('clientInfo', JSON.stringify(clientInfo));
                    } else {
                        sessionStorage.setItem('clientInfo', JSON.stringify(clientInfo));
                    }
                    
                    // Redirect to client dashboard
                    window.location.href = 'client-dashboard.html';
                } else {
                    // Show error message
                    loginError.textContent = 'خطأ في رقم الموبايل أو كود الطلب. يرجى المحاولة مرة أخرى.';
                    loginError.classList.remove('d-none');
                    
                    // Clear error after 4 seconds
                    setTimeout(() => {
                        loginError.classList.add('d-none');
                    }, 4000);
                }
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
