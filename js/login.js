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
        // Check for both new and old token formats
        const adminToken = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
        const clientToken = localStorage.getItem('clientToken') || sessionStorage.getItem('clientToken');
        const legacyToken = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        
        if (adminToken) {
            console.log('Found admin token, redirecting to admin dashboard');
            // Set token in API service
            if (window.apiService) {
                window.apiService.setAuthToken(adminToken);
            }
            // Redirect to admin dashboard
            window.location.href = 'admin.html';
            return true;
        } else if (clientToken) {
            console.log('Found client token, redirecting to client dashboard');
            // Set token in API service
            if (window.apiService) {
                window.apiService.setAuthToken(clientToken);
            }
            // Redirect to client dashboard
            window.location.href = 'client-dashboard.html';
            return true;
        } else if (legacyToken) {
            console.log('Found legacy token, checking user type');
            // Check if admin or client based on stored info
            const adminInfo = JSON.parse(localStorage.getItem('adminInfo') || sessionStorage.getItem('adminInfo') || 'null');
            const clientInfo = JSON.parse(localStorage.getItem('clientInfo') || sessionStorage.getItem('clientInfo') || 'null');
            
            if (adminInfo) {
                // Migrate to new token format
                if (localStorage.getItem('authToken')) {
                    localStorage.setItem('adminToken', legacyToken);
                    localStorage.removeItem('authToken');
                } else if (sessionStorage.getItem('authToken')) {
                    sessionStorage.setItem('adminToken', legacyToken);
                    sessionStorage.removeItem('authToken');
                }
                
                window.location.href = 'admin.html';
                return true;
            } else if (clientInfo) {
                // Migrate to new token format
                if (localStorage.getItem('authToken')) {
                    localStorage.setItem('clientToken', legacyToken);
                    localStorage.removeItem('authToken');
                } else if (sessionStorage.getItem('authToken')) {
                    sessionStorage.setItem('clientToken', legacyToken);
                    sessionStorage.removeItem('authToken');
                }
                
                window.location.href = 'client-dashboard.html';
                return true;
            }
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
        // Base URL for API calls
        baseUrl: API_BASE_URL,
        async adminLogin(username, password) {
            console.log('Sending admin login request to:', ADMIN_LOGIN_URL);
            console.log('With credentials:', { username });
            
            try {
                const response = await fetch(ADMIN_LOGIN_URL, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({ username, password })
                });
                
                console.log('Admin login response status:', response.status);
                
                // Check if the response is JSON
                const contentType = response.headers.get('content-type');
                let data;
                
                if (contentType && contentType.includes('application/json')) {
                    data = await response.json();
                } else {
                    // Handle non-JSON response
                    const text = await response.text();
                    console.error('Received non-JSON response:', text.substring(0, 150) + '...');
                    throw new Error('Invalid response format from server');
                }
                
                if (!response.ok) {
                    throw new Error(data.message || 'Invalid username or password');
                }
                
                console.log('Admin login successful');
                return data;
            } catch (error) {
                console.error('Admin login error:', error);
                throw error;
            }
        },
        
        async clientLogin(phone, orderCode) {
            console.log('Sending client login request to:', CLIENT_LOGIN_URL);
            console.log('With credentials:', { phone, orderCode });
            
            try {
                const response = await fetch(CLIENT_LOGIN_URL, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({ phone, orderCode })
                });
                
                console.log('Client login response status:', response.status);
                
                // Check if the response is JSON
                const contentType = response.headers.get('content-type');
                let data;
                
                if (contentType && contentType.includes('application/json')) {
                    data = await response.json();
                } else {
                    // Handle non-JSON response
                    const text = await response.text();
                    console.error('Received non-JSON response:', text.substring(0, 150) + '...');
                    throw new Error('Invalid response format from server');
                }
                
                if (!response.ok) {
                    throw new Error(data.message || 'Invalid phone number or order code');
                }
                
                console.log('Client login successful');
                return data;
            } catch (error) {
                console.error('Client login error:', error);
                throw error;
            }
        },
        
        // Set auth token
        setAuthToken(token) {
            this.authToken = token;
            console.log('Login API service token set');
        }
    };
    
    // Handle form submission
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Clear previous error messages
        loginError.textContent = '';
        loginError.style.display = 'none';
        
        // Disable submit button and show loading state
        loginSubmitBtn.disabled = true;
        loginSubmitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> جاري تسجيل الدخول...';
        
        try {
            const rememberMe = rememberMeCheckbox.checked;
            
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
            loginError.textContent = error.message || 'حدث خطأ أثناء تسجيل الدخول';
            loginError.style.display = 'block';
            
            // Reset submit button
            loginSubmitBtn.disabled = false;
            loginSubmitBtn.textContent = 'تسجيل الدخول';
        }
    });                    
                                if (contentType && contentType.includes('application/json')) {
                                    data = await response.json();
                                } else {
                                    // Handle non-JSON response
                                    const text = await response.text();
{{ ... }}
                                    throw new Error('Invalid response format from server');
                                }
                                
                                if (!response.ok) {
                                    throw new Error(data.message || 'Invalid username or password');
                                }
                            } catch (fetchError) {
                                console.error('Fetch error:', fetchError);
                                throw new Error('Connection error: Unable to connect to authentication server. Please check your network connection and try again.');
                            }
                        }
                    } catch (error) {
                        console.error('Admin login processing error:', error);
                        throw error;
                    }
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
                    console.log('Using API service:', !!window.apiService);
                    
                    // Use the auth proxy for direct client login
                    let responseData;
                    try {
                        if (window.authProxy && typeof window.authProxy.clientLogin === 'function') {
                            console.log('Using auth proxy for client login');
                            try {
                                responseData = await window.authProxy.clientLogin(phoneNumber, orderCode);
                                console.log('Auth proxy client login successful:', responseData);
                            } catch (error) {
                                console.error('Auth proxy client login error:', error);
                                throw new Error(error.message || 'Invalid phone number or order code');
                            }
                        } else if (window.apiService && typeof window.apiService.clientLogin === 'function') {
                            console.log('Falling back to API service for client login');
                            try {
                                responseData = await window.apiService.clientLogin(phoneNumber, orderCode);
                            } catch (error) {
                                console.error('API service client login error:', error);
                                throw new Error(error.message || 'Invalid phone number or order code');
                            }
                        } else {
                            // Last resort fallback to direct fetch
                            try {
                                console.log('Attempting direct fetch to:', CLIENT_LOGIN_URL);
                                const response = await fetch(CLIENT_LOGIN_URL, {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'Accept': 'application/json'
                                    },
                                    body: JSON.stringify({ phone: phoneNumber, orderCode: orderCode }),
                                    mode: 'cors' // Explicitly set CORS mode
                                });
                                
                                // Check if the response is JSON
                                const contentType = response.headers.get('content-type');
                                
                                if (contentType && contentType.includes('application/json')) {
                                    responseData = await response.json();
                                } else {
                                    // Handle non-JSON response
                                    const text = await response.text();
                                    console.error('Received non-JSON response:', text.substring(0, 150) + '...');
                                    throw new Error('Invalid response format from server');
                                }
                                
                                if (!response.ok) {
                                    throw new Error(responseData.message || 'Invalid phone number or order code');
                                }
                            } catch (fetchError) {
                                console.error('Fetch error:', fetchError);
                                throw new Error('Connection error: Unable to connect to authentication server. Please check your network connection and try again.');
                            }
                        }
                    } catch (error) {
                        console.error('Client login processing error:', error);
                        throw error;
                    }
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
                // Show error message with more details for connection issues
                if (error.message.includes('Failed to fetch') || error.message.includes('Connection error')) {
                    showError('Unable to connect to the authentication server. Please check your network connection and make sure the backend server is running.');
                } else {
                    showError(error.message);
                }
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
