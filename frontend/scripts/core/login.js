/**
 * Laapak Report System - Smart Unified Login JavaScript
 * Handles both administrator and client authentication with automatic role detection
 */

document.addEventListener('DOMContentLoaded', function() {
    // Form elements
    const loginForm = document.getElementById('unifiedLoginForm');
    const loginError = document.getElementById('loginError');
    const loginErrorMessage = document.getElementById('loginErrorMessage');
    const loginSubmitBtn = document.getElementById('loginSubmitBtn');
    const loginSubmitText = document.getElementById('loginSubmitText');
    
    // Input fields
    const identifierField = document.getElementById('identifier');
    const credentialField = document.getElementById('credential');
    const rememberMeCheckbox = document.getElementById('rememberMe');
    
    // UI elements for smart detection
    const loginTypeIndicator = document.getElementById('loginTypeIndicator');
    const loginTypeText = document.getElementById('loginTypeText');
    const identifierLabel = document.getElementById('identifierLabel');
    const credentialLabel = document.getElementById('credentialLabel');
    const identifierIcon = document.getElementById('identifierIcon');
    const credentialIcon = document.getElementById('credentialIcon');
    const identifierHint = document.getElementById('identifierHint');
    const credentialHint = document.getElementById('credentialHint');
    const identifierHintText = document.getElementById('identifierHintText');
    const credentialHintText = document.getElementById('credentialHintText');
    
    // API endpoints - Auto-detect localhost and use port 3001
    // FORCE PORT 3001 FOR LOCALHOST - DO NOT USE 3000
    let API_URL;
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    if (window.config && window.config.api && window.config.api.baseUrl) {
        API_URL = window.config.api.baseUrl;
        // Override if config has wrong port for localhost
        if (isLocalhost && API_URL.includes(':3000')) {
            console.warn('⚠️ Config has port 3000, overriding to 3001');
            API_URL = 'http://localhost:3001';
        }
    } else if (isLocalhost) {
        API_URL = 'http://localhost:3001';
    } else {
        API_URL = 'https://reports.laapak.com';
    }
    
    // Final safety check - ensure localhost uses 3001
    if (isLocalhost && API_URL.includes(':3000')) {
        console.error('❌ ERROR: Detected port 3000 on localhost, forcing 3001');
        API_URL = 'http://localhost:3001';
    }
    
    const ADMIN_LOGIN_URL = `${API_URL}/api/auth/admin`;
    const CLIENT_LOGIN_URL = `${API_URL}/api/clients/auth`;
    
    console.log('🔧 Smart login system initialized');
    console.log('📍 Hostname:', window.location.hostname);
    console.log('⚙️ Config detected:', window.config ? window.config.api : 'not found');
    console.log('🌐 API_URL resolved to:', API_URL);
    console.log('🔐 Admin login URL:', ADMIN_LOGIN_URL);
    console.log('👤 Client login URL:', CLIENT_LOGIN_URL);
    
    let detectedLoginType = null; // 'client' or 'employee'
    
    // Session checking is now handled by index.html to avoid conflicts
    // Removed checkExistingLogin() function and its call
    
    // Smart detection functions
    const detectLoginType = (identifier, credential) => {
        // If both fields are empty, return null
        if (!identifier && !credential) {
            return null;
    }
    
        // Check if identifier looks like a phone number (Egyptian format)
        const phonePattern = /^(01|02|03|04|05)[0-9]{8,9}$/;
        const isPhoneNumber = phonePattern.test(identifier);
        
        // Check if credential looks like an order code (starts with letters or is numeric)
        const orderCodePattern = /^[A-Za-z]|^\d{3,}$/;
        const isOrderCode = orderCodePattern.test(credential);
        
        // Check if credential looks like a password (contains special chars or is longer)
        const passwordPattern = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]|.{8,}/;
        const isPassword = passwordPattern.test(credential);
        
        // Debug logging
        console.log('🔍 Smart Detection Debug:', {
            identifier,
            credential,
            isPhoneNumber,
            isOrderCode,
            isPassword
        });
        
        // Decision logic - prioritize phone number detection
        if (isPhoneNumber) {
            // If it's a phone number, it's likely a client login
            console.log('✅ Detected as CLIENT (phone number)');
            return 'client';
        } else if (!isPhoneNumber && isPassword) {
            // If it's not a phone number and looks like a password, it's likely an employee
            console.log('✅ Detected as EMPLOYEE (password pattern)');
            return 'employee';
        } else if (identifier && credential) {
            // If we have both fields but can't determine, make an educated guess
            // Check if credential looks like an order code (numeric or starts with letters)
            if (isOrderCode && !isPassword) {
                console.log('✅ Detected as CLIENT (order code pattern)');
                return 'client';
            } else {
                console.log('✅ Detected as EMPLOYEE (fallback)');
                return 'employee';
            }
        }
        
        console.log('❓ Detection uncertain');
        return null;
    };
    
    // Update UI based on detected login type
    const updateUIForLoginType = (loginType) => {
        // Add null checks for all elements
        if (!loginTypeIndicator || !loginTypeText || !identifierLabel || !credentialLabel || 
            !identifierIcon || !credentialIcon || !identifierHint || !credentialHint || 
            !loginSubmitBtn || !loginSubmitText) {
            console.warn('Some login form elements are missing, skipping UI update');
            return;
        }
        
        if (!loginType) {
            // Reset to default state
            if (loginTypeIndicator) loginTypeIndicator.className = 'login-type-indicator';
            if (loginTypeText) loginTypeText.textContent = 'سيتم تحديد نوع الحساب تلقائيًا';
            if (identifierLabel) identifierLabel.textContent = 'اسم المستخدم أو رقم الموبايل';
            if (credentialLabel) credentialLabel.textContent = 'كلمة المرور أو كود الطلب';
            if (identifierIcon) identifierIcon.className = 'fas fa-user text-primary';
            if (credentialIcon) credentialIcon.className = 'fas fa-lock text-primary';
            if (identifierHint) identifierHint.className = 'field-hint hide';
            if (credentialHint) credentialHint.className = 'field-hint hide';
            if (loginSubmitBtn) loginSubmitBtn.className = 'btn btn-primary rounded-pill py-3 fw-bold';
            if (loginSubmitText) loginSubmitText.textContent = 'تسجيل الدخول';
            return;
        }
        
        if (loginType === 'client') {
            // Client UI
            if (loginTypeIndicator) loginTypeIndicator.className = 'login-type-indicator client';
            if (loginTypeText) loginTypeText.innerHTML = '<i class="fas fa-user me-2"></i> تسجيل دخول العميل';
            if (identifierLabel) identifierLabel.textContent = 'رقم الموبايل';
            if (credentialLabel) credentialLabel.textContent = 'كود الطلب';
            if (identifierIcon) identifierIcon.className = 'fas fa-phone text-primary';
            if (credentialIcon) credentialIcon.className = 'fas fa-key text-primary';
            if (identifierHintText) identifierHintText.textContent = 'اكتب رقم الموبايل اللي عملت بيه الاوردر';
            if (credentialHintText) credentialHintText.textContent = 'اتواصل مع ممثل خدمة العملاء لو مش عارفه';
            if (identifierHint) identifierHint.className = 'field-hint show';
            if (credentialHint) credentialHint.className = 'field-hint show';
            if (loginSubmitBtn) loginSubmitBtn.className = 'btn btn-success rounded-pill py-3 fw-bold';
            if (loginSubmitText) loginSubmitText.textContent = 'تسجيل دخول العميل';
        } else if (loginType === 'employee') {
            // Employee UI
            if (loginTypeIndicator) loginTypeIndicator.className = 'login-type-indicator employee';
            if (loginTypeText) loginTypeText.innerHTML = '<i class="fas fa-user-tie me-2"></i> تسجيل دخول الموظف';
            if (identifierLabel) identifierLabel.textContent = 'اسم المستخدم';
            if (credentialLabel) credentialLabel.textContent = 'كلمة المرور';
            if (identifierIcon) identifierIcon.className = 'fas fa-user text-primary';
            if (credentialIcon) credentialIcon.className = 'fas fa-lock text-primary';
            if (identifierHintText) identifierHintText.textContent = 'أدخل اسم المستخدم الخاص بك';
            if (credentialHintText) credentialHintText.textContent = 'أدخل كلمة المرور الخاصة بك';
            if (identifierHint) identifierHint.className = 'field-hint show';
            if (credentialHint) credentialHint.className = 'field-hint show';
            if (loginSubmitBtn) loginSubmitBtn.className = 'btn btn-primary rounded-pill py-3 fw-bold';
            if (loginSubmitText) loginSubmitText.textContent = 'تسجيل دخول الموظف';
            }
    };
    
    // Real-time detection on input
    const handleInputChange = () => {
        const identifier = identifierField.value.trim();
        const credential = credentialField.value.trim();
        
        const newLoginType = detectLoginType(identifier, credential);
        
        if (newLoginType !== detectedLoginType) {
            detectedLoginType = newLoginType;
            updateUIForLoginType(detectedLoginType);
    }
    };
    
    // Add input event listeners for real-time detection
    identifierField.addEventListener('input', handleInputChange);
    credentialField.addEventListener('input', handleInputChange);
    
    // Show error message
    const showError = (message) => {
        if (loginError && loginErrorMessage) {
            loginErrorMessage.textContent = message;
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
    
    // API service functions
    const loginApiService = {
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
            
            const identifier = identifierField.value.trim();
            const credential = credentialField.value.trim();
            const rememberMe = rememberMeCheckbox.checked;
            
            // Validate inputs
            if (!identifier || !credential) {
                showError('يرجى إدخال جميع البيانات المطلوبة');
                return;
            }
            
            // Determine login type if not already detected
            if (!detectedLoginType) {
                detectedLoginType = detectLoginType(identifier, credential);
                updateUIForLoginType(detectedLoginType);
            }
            
            // Disable submit button during API call
            loginSubmitBtn.disabled = true;
            const originalText = loginSubmitText.textContent;
            loginSubmitText.textContent = 'جاري تسجيل الدخول...';
            
            try {
                if (detectedLoginType === 'employee') {
                    // Employee login logic
                    console.log('Attempting employee login with username:', identifier);
                    
                    const data = await loginApiService.adminLogin(identifier, credential);
                    console.log('Employee login successful');
                    
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
                    
                } else if (detectedLoginType === 'client') {
                    // Client login logic
                    console.log('Attempting client login with phone:', identifier);
                    
                    const responseData = await loginApiService.clientLogin(identifier, credential);
                    console.log('Client login successful');
                    
                    // Store client info and token
                    const clientInfo = {
                        clientId: responseData?.client?.id || 0,
                        name: responseData?.client?.name || 'Client',
                        phone: responseData?.client?.phone || '',
                        email: responseData?.client?.email || '',
                        isLoggedIn: true,
                        loginTime: new Date().getTime()
                    };
                    
                    // Save to storage based on remember me option
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
                    
                } else {
                    // Try both login types if detection is uncertain
                    console.log('Login type uncertain, trying both...');
                    
                    try {
                        // Try employee login first
                        const data = await loginApiService.adminLogin(identifier, credential);
                        console.log('Employee login successful on fallback');
                        
                        // Store admin info and token
                        const adminInfo = {
                            userId: data.user.id,
                            username: data.user.username,
                            name: data.user.name,
                            role: data.user.role,
                            isLoggedIn: true,
                            loginTime: new Date().getTime()
                        };
                        
                        if (rememberMe) {
                            localStorage.setItem('adminToken', data.token);
                            localStorage.setItem('adminInfo', JSON.stringify(adminInfo));
                        } else {
                            sessionStorage.setItem('adminToken', data.token);
                            sessionStorage.setItem('adminInfo', JSON.stringify(adminInfo));
                        }
                        
                        window.location.href = 'admin.html';
                        
                    } catch (employeeError) {
                        console.log('Employee login failed, trying client login...');
                        
                        try {
                            const responseData = await loginApiService.clientLogin(identifier, credential);
                            console.log('Client login successful on fallback');
                            
                            const clientInfo = {
                                clientId: responseData?.client?.id || 0,
                                name: responseData?.client?.name || 'Client',
                                phone: responseData?.client?.phone || '',
                                email: responseData?.client?.email || '',
                                isLoggedIn: true,
                                loginTime: new Date().getTime()
                            };
                            
                            if (rememberMe) {
                                localStorage.setItem('clientInfo', JSON.stringify(clientInfo));
                                localStorage.setItem('clientToken', responseData.token);
                            } else {
                                sessionStorage.setItem('clientInfo', JSON.stringify(clientInfo));
                                sessionStorage.setItem('clientToken', responseData.token);
                            }
                            
                            window.location.href = 'client-dashboard.html';
                            
                        } catch (clientError) {
                            console.error('Both login attempts failed:', { employeeError, clientError });
                            showError('بيانات الدخول غير صحيحة. تأكد من إدخال البيانات الصحيحة');
                        }
                    }
                }
            } catch (error) {
                showError(error.message);
                console.error('Login error:', error);
            } finally {
                // Re-enable submit button
                loginSubmitBtn.disabled = false;
                loginSubmitText.textContent = originalText;
            }
        });
    }
    
    // Password visibility toggle
    const toggleCredentialBtn = document.getElementById('toggleCredential');
    if (toggleCredentialBtn) {
        toggleCredentialBtn.addEventListener('click', function() {
            const credentialField = document.getElementById('credential');
            if (credentialField.type === 'password') {
                credentialField.type = 'text';
                this.innerHTML = '<i class="fas fa-eye-slash"></i>';
            } else {
                credentialField.type = 'password';
                this.innerHTML = '<i class="fas fa-eye"></i>';
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
