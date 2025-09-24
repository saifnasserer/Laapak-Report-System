/**
 * Laapak Report System - Client Login JavaScript
 * Handles client authentication functionality
 */

document.addEventListener('DOMContentLoaded', function() {
    // Client login form
    const loginForm = document.getElementById('clientLoginForm');
    const loginError = document.getElementById('loginError');
    
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const phoneNumber = document.getElementById('phoneNumber').value;
            const orderCode = document.getElementById('orderCode').value;
            const rememberMe = document.getElementById('rememberMe').checked;
            
            // In a real implementation, this would validate against a database
            // For prototype, we'll use mock data
            
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
