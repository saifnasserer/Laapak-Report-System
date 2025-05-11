/**
 * Laapak Report System - Client Login JavaScript
 * Handles client authentication functionality
 */

document.addEventListener('DOMContentLoaded', function() {
    // Client login form
    const loginForm = document.getElementById('clientLoginForm');
    const loginError = document.getElementById('loginError');
    
    // API base URL - dynamically determine the backend URL
    const API_BASE_URL = 'http://localhost:8000';
    const CLIENT_LOGIN_URL = `${API_BASE_URL}/api/auth/client`;
    
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const phone = document.getElementById('phoneNumber').value;
            const orderCode = document.getElementById('orderCode').value;
            const rememberMe = document.getElementById('rememberMe').checked;
            
            try {
                // Call the API service for client authentication
                console.log('Attempting client login with:', { phone, orderCode });
                
                // Use the apiService if available, otherwise fall back to direct fetch
                let data;
                if (window.apiService && typeof window.apiService.clientLogin === 'function') {
                    data = await window.apiService.clientLogin(phone, orderCode);
                } else {
                    // Fallback to direct fetch if apiService is not available
                    const response = await fetch(CLIENT_LOGIN_URL, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        },
                        body: JSON.stringify({ phone, orderCode })
                    });
                    
                    // Check if the response is JSON
                    const contentType = response.headers.get('content-type');
                    
                    if (contentType && contentType.includes('application/json')) {
                        data = await response.json();
                    } else {
                        // Handle non-JSON response
                        const text = await response.text();
                        console.error('Received non-JSON response:', text.substring(0, 150) + '...');
                        throw new Error('Invalid response format from server');
                    }
                }
                
                if (data && data.token) {
                    console.log('Client login successful, token received');
                    
                    // Store the token using consistent key names
                    if (rememberMe) {
                        localStorage.setItem('clientToken', data.token);
                    } else {
                        sessionStorage.setItem('clientToken', data.token);
                    }
                    
                    // Store client info
                    const clientInfo = {
                        clientId: data.user.id,
                        name: data.user.name,
                        phone: data.user.phone,
                        isLoggedIn: true,
                        loginTime: new Date().getTime()
                    };
                    
                    if (rememberMe) {
                        localStorage.setItem('clientInfo', JSON.stringify(clientInfo));
                    } else {
                        sessionStorage.setItem('clientInfo', JSON.stringify(clientInfo));
                    }
                    
                    // Update API service token if available
                    if (window.apiService && typeof window.apiService.setAuthToken === 'function') {
                        window.apiService.setAuthToken(data.token);
                    }
                    
                    // Redirect to client dashboard
                    window.location.href = 'client-dashboard.html';
                } else {
                    // Show error message
                    loginError.textContent = data.message || 'Invalid phone number or order code';
                    loginError.classList.remove('d-none');
                    
                    // Clear error after 4 seconds
                    setTimeout(() => {
                        loginError.classList.add('d-none');
                    }, 4000);
                }
            } catch (error) {
                console.error('Client login fetch error:', error);
                loginError.textContent = 'Connection error. Please try again.';
                loginError.classList.remove('d-none');
                
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
