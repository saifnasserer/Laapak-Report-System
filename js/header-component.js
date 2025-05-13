/**
 * Header Component for Laapak Report System
 * Creates a consistent header across all pages with dynamic navigation based on user role
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize header
    initHeader();
    
    /**
     * Initialize header component
     */
    function initHeader() {
        const headerContainer = document.getElementById('header-container');
        
        if (!headerContainer) {
            console.error('Header container not found');
            return;
        }
        
        // Create header HTML
        headerContainer.innerHTML = createHeaderHTML();
        
        // Add event listeners
        addHeaderEventListeners();
        
        // Update header based on authentication status
        updateHeaderForAuthStatus();
    }
    
    /**
     * Create header HTML
     * @returns {string} - Header HTML
     */
    function createHeaderHTML() {
        return `
            <header class="header shadow-sm">
                <nav class="navbar navbar-expand-lg navbar-dark bg-success">
                    <div class="container-fluid">
                        <a class="navbar-brand d-flex align-items-center" href="index.html">
                            <img src="img/logo-white.png" alt="Laapak" width="40" class="me-2">
                            <span class="fw-bold">Laapak</span>
                        </a>
                        
                        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                            <span class="navbar-toggler-icon"></span>
                        </button>
                        
                        <div class="collapse navbar-collapse" id="navbarNav">
                            <!-- Admin Navigation -->
                            <ul class="navbar-nav me-auto admin-only" style="display: none;">
                                <li class="nav-item">
                                    <a class="nav-link" href="admin.html">
                                        <i class="fas fa-tachometer-alt me-1"></i> لوحة التحكم
                                    </a>
                                </li>
                                <li class="nav-item">
                                    <a class="nav-link" href="reports.html">
                                        <i class="fas fa-clipboard-list me-1"></i> التقارير
                                    </a>
                                </li>
                                <li class="nav-item">
                                    <a class="nav-link" href="clients.html">
                                        <i class="fas fa-users me-1"></i> العملاء
                                    </a>
                                </li>
                                <li class="nav-item">
                                    <a class="nav-link" href="create-report.html">
                                        <i class="fas fa-plus-circle me-1"></i> تقرير جديد
                                    </a>
                                </li>
                                <li class="nav-item">
                                    <a class="nav-link" href="settings.html">
                                        <i class="fas fa-cog me-1"></i> الإعدادات
                                    </a>
                                </li>
                            </ul>
                            
                            <!-- Client Navigation -->
                            <ul class="navbar-nav me-auto client-only" style="display: none;">
                                <li class="nav-item">
                                    <a class="nav-link" href="client-dashboard.html">
                                        <i class="fas fa-tachometer-alt me-1"></i> لوحة العميل
                                    </a>
                                </li>
                                <li class="nav-item">
                                    <a class="nav-link" href="client-dashboard.html#reports">
                                        <i class="fas fa-clipboard-list me-1"></i> تقاريري
                                    </a>
                                </li>
                                <li class="nav-item">
                                    <a class="nav-link" href="client-dashboard.html#warranty">
                                        <i class="fas fa-shield-alt me-1"></i> الضمان
                                    </a>
                                </li>
                                <li class="nav-item">
                                    <a class="nav-link" href="client-dashboard.html#maintenance">
                                        <i class="fas fa-tools me-1"></i> الصيانة
                                    </a>
                                </li>
                            </ul>
                            
                            <!-- Unauthenticated Navigation -->
                            <ul class="navbar-nav me-auto unauth-only">
                                <li class="nav-item">
                                    <a class="nav-link" href="index.html">
                                        <i class="fas fa-home me-1"></i> الرئيسية
                                    </a>
                                </li>
                            </ul>
                            
                            <!-- User Menu -->
                            <ul class="navbar-nav auth-only" style="display: none;">
                                <li class="nav-item dropdown">
                                    <a class="nav-link dropdown-toggle" href="#" id="userDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                                        <i class="fas fa-user-circle me-1"></i> <span class="user-name">المستخدم</span>
                                    </a>
                                    <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="userDropdown">
                                        <li><a class="dropdown-item" href="settings.html"><i class="fas fa-cog me-2"></i> الإعدادات</a></li>
                                        <li><hr class="dropdown-divider"></li>
                                        <li><a class="dropdown-item" href="#" id="logoutBtn"><i class="fas fa-sign-out-alt me-2"></i> تسجيل الخروج</a></li>
                                    </ul>
                                </li>
                            </ul>
                            
                            <!-- Login Button for Unauthenticated Users -->
                            <ul class="navbar-nav unauth-only">
                                <li class="nav-item">
                                    <a class="nav-link btn btn-outline-light btn-sm px-3 py-1 mt-1" href="index.html">
                                        <i class="fas fa-sign-in-alt me-1"></i> تسجيل الدخول
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>
                </nav>
            </header>
        `;
    }
    
    /**
     * Add event listeners to header elements
     */
    function addHeaderEventListeners() {
        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function(e) {
                e.preventDefault();
                handleLogout();
            });
        }
        
        // Add active class to current page link
        const currentPage = window.location.pathname.split('/').pop();
        const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
        
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href === currentPage) {
                link.classList.add('active');
            }
        });
    }
    
    /**
     * Update header based on authentication status
     */
    function updateHeaderForAuthStatus() {
        if (window.authUtils) {
            window.authUtils.updateUIForAuthStatus();
        } else {
            // Fallback if authUtils is not available
            const isAuthenticated = !!localStorage.getItem('auth_token') || !!sessionStorage.getItem('auth_token');
            const userType = localStorage.getItem('user_type') || sessionStorage.getItem('user_type');
            
            // Elements that should only be visible to authenticated users
            const authElements = document.querySelectorAll('.auth-only');
            
            // Elements that should only be visible to unauthenticated users
            const unauthElements = document.querySelectorAll('.unauth-only');
            
            // Elements that should only be visible to admin users
            const adminElements = document.querySelectorAll('.admin-only');
            
            // Elements that should only be visible to client users
            const clientElements = document.querySelectorAll('.client-only');
            
            // Update visibility based on authentication status
            authElements.forEach(el => {
                el.style.display = isAuthenticated ? '' : 'none';
            });
            
            unauthElements.forEach(el => {
                el.style.display = isAuthenticated ? 'none' : '';
            });
            
            // Update visibility based on user type
            adminElements.forEach(el => {
                el.style.display = (isAuthenticated && userType === 'admin') ? '' : 'none';
            });
            
            clientElements.forEach(el => {
                el.style.display = (isAuthenticated && userType === 'client') ? '' : 'none';
            });
            
            // Update user name if available
            const userNameElements = document.querySelectorAll('.user-name');
            const userDataStr = localStorage.getItem('user_data') || sessionStorage.getItem('user_data');
            
            if (userDataStr) {
                try {
                    const userData = JSON.parse(userDataStr);
                    userNameElements.forEach(el => {
                        if (userType === 'admin') {
                            el.textContent = userData.name || userData.username;
                        } else if (userType === 'client') {
                            el.textContent = userData.name;
                        }
                    });
                } catch (e) {
                    console.error('Error parsing user data:', e);
                }
            }
        }
    }
    
    /**
     * Handle logout
     */
    async function handleLogout() {
        try {
            if (window.authUtils) {
                await window.authUtils.logout();
            } else if (window.apiService) {
                await window.apiService.logout();
                
                // Clear auth data
                localStorage.removeItem('auth_token');
                localStorage.removeItem('user_type');
                localStorage.removeItem('user_data');
                localStorage.removeItem('remember_me');
                
                sessionStorage.removeItem('auth_token');
                sessionStorage.removeItem('user_type');
                sessionStorage.removeItem('user_data');
                
                // Redirect to login page
                window.location.href = 'index.html';
            } else {
                // Fallback logout
                localStorage.clear();
                sessionStorage.clear();
                window.location.href = 'index.html';
            }
        } catch (error) {
            console.error('Logout error:', error);
            alert('حدث خطأ أثناء تسجيل الخروج. يرجى المحاولة مرة أخرى.');
        }
    }
});
