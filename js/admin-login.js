/**
 * Laapak Report System - Admin Login JavaScript
 * Handles administrator authentication functionality
 */

document.addEventListener('DOMContentLoaded', function() {
    // Admin login form
    const loginForm = document.getElementById('adminLoginForm');
    const loginError = document.getElementById('loginError');
    
    // API base URL - dynamically determine the backend URL
    const API_BASE_URL = 'http://localhost:8000';
    const ADMIN_LOGIN_URL = `${API_BASE_URL}/api/auth/admin`;
    
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const rememberMe = document.getElementById('rememberMe').checked;
            
            try {
                // Call the API service for admin authentication
                console.log('Attempting admin login with username:', username);
                
                // Use the apiService if available, otherwise fall back to direct fetch
                let data;
                if (window.apiService && typeof window.apiService.adminLogin === 'function') {
                    data = await window.apiService.adminLogin(username, password);
                } else {
                    // Fallback to direct fetch if apiService is not available
                    const response = await fetch(ADMIN_LOGIN_URL, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        },
                        body: JSON.stringify({ username, password })
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
                    console.log('Admin login successful, token received');
                    
                    // Store the token using consistent key names
                    if (rememberMe) {
                        localStorage.setItem('adminToken', data.token);
                    } else {
                        sessionStorage.setItem('adminToken', data.token);
                    }
                    
                    // Store admin info
                    const adminInfo = {
                        userId: data.user.id,
                        name: data.user.name,
                        username: data.user.username,
                        role: data.user.role,
                        isLoggedIn: true,
                        loginTime: new Date().getTime()
                    };
                    
                    if (rememberMe) {
                        localStorage.setItem('adminInfo', JSON.stringify(adminInfo));
                    } else {
                        sessionStorage.setItem('adminInfo', JSON.stringify(adminInfo));
                    }
                    
                    // Update API service token if available
                    if (window.apiService && typeof window.apiService.setAuthToken === 'function') {
                        window.apiService.setAuthToken(data.token);
                    }
                    
                    // Redirect to admin dashboard
                    window.location.href = 'admin.html';
                } else {
                    // Show error message
                    loginError.textContent = data.message || 'Invalid username or password';
                    loginError.classList.remove('d-none');
                    
                    // Clear error after 4 seconds
                    setTimeout(() => {
                        loginError.classList.add('d-none');
                    }, 4000);
                }
            } catch (error) {
                console.error('Admin login fetch error:', error);
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
