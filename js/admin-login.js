/**
 * Laapak Report System - Admin Login JavaScript
 * Handles administrator authentication functionality
 */

document.addEventListener('DOMContentLoaded', function() {
    // Admin login form
    const loginForm = document.getElementById('adminLoginForm');
    const loginError = document.getElementById('loginError');
    
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const rememberMe = document.getElementById('rememberMe').checked;
            
            // In a real implementation, this would validate against a database
            // For prototype, we'll use mock data
            
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
                loginError.classList.remove('d-none');
                
                // Clear error after 4 seconds
                setTimeout(() => {
                    loginError.classList.add('d-none');
                }, 4000);
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
