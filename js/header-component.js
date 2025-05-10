/**
 * Laapak Report System
 * Reusable Header Component
 */

class LpkHeader {
    constructor(options = {}) {
        this.containerId = options.containerId || 'header-container';
        this.options = {
            showNavigation: options.showNavigation !== undefined ? options.showNavigation : true,
            navigationItems: options.navigationItems || [
                { text: 'الرئيسية', url: 'admin.html', icon: 'fas fa-tachometer-alt', id: 'dashboard' },
                { text: 'تقرير جديد', url: 'create-report.html', icon: 'fas fa-plus-circle', id: 'create-report' },
                { text: 'التقارير', url: 'reports.html', icon: 'fas fa-file-alt', id: 'reports' },
                { text: 'إنشاء فاتورة', url: 'create-invoice.html', icon: 'fas fa-file-invoice-dollar', id: 'create-invoice' },
                { text: 'العملاء', url: 'clients.html', icon: 'fas fa-users', id: 'clients' },
                { text: 'الإعدادات', url: 'settings.html', icon: 'fas fa-cog', id: 'settings' }
            ],
            showUserMenu: options.showUserMenu !== undefined ? options.showUserMenu : true,
            userMenuItems: options.userMenuItems || [
                { text: 'الملف الشخصي', url: '#', icon: 'fas fa-user-circle' },
                { text: 'الإعدادات', url: 'settings.html', icon: 'fas fa-cog', id: 'settings' },
                { text: 'تسجيل الخروج', url: 'index.html', icon: 'fas fa-sign-out-alt' }
            ],
            activeItem: options.activeItem || ''
        };
        
        this.render();
    }
    
    render() {
        // Find container
        const container = document.getElementById(this.containerId);
        if (!container) {
            console.error(`Header container with ID '${this.containerId}' not found`);
            return;
        }
        
        // Generate header HTML
        const headerHTML = this.generateHeaderHTML();
        
        // Insert into container
        container.innerHTML = headerHTML;
        
        // Add event listeners for active state
        this.setupActiveStateHandlers();
    }
    
    setupActiveStateHandlers() {
        // Get all navigation links
        const navLinks = document.querySelectorAll('#mainNavbar .nav-link:not(.dropdown-toggle)');
        
        // Add click event listener to each link
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                // Remove active class from all links
                navLinks.forEach(l => {
                    l.classList.remove('active', 'fw-bold');
                    l.style.backgroundColor = '';
                    l.style.boxShadow = '';
                });
                
                // Add active class to clicked link
                link.classList.add('active', 'fw-bold');
                link.style.backgroundColor = 'rgba(255,255,255,0.3)';
                link.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
            });
        });
        
        // Setup logout button
        const logoutBtn = document.getElementById('adminLogoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Admin logout button clicked');
                // Use auth-middleware for logout if available
                if (typeof authMiddleware !== 'undefined' && authMiddleware.logout) {
                    authMiddleware.logout();
                } else {
                    // Fallback logout if auth-middleware is not available
                    console.log('Auth middleware not available, using fallback logout');
                    localStorage.removeItem('adminToken');
                    localStorage.removeItem('adminInfo');
                    sessionStorage.removeItem('adminToken');
                    sessionStorage.removeItem('adminInfo');
                    window.location.href = 'index.html';
                }
            });
        }
    }
    
    generateHeaderHTML() {
        // Get admin info from storage
        let adminName = 'المدير';
        let adminEmail = 'admin@laapak.com';
        let adminRole = 'مدير';
        
        try {
            const adminInfo = JSON.parse(localStorage.getItem('adminInfo') || sessionStorage.getItem('adminInfo') || '{}');
            if (adminInfo) {
                if (adminInfo.name) adminName = adminInfo.name;
                if (adminInfo.username) adminEmail = adminInfo.username;
                if (adminInfo.role) {
                    switch(adminInfo.role) {
                        case 'admin': adminRole = 'مدير'; break;
                        case 'technician': adminRole = 'فني'; break;
                        case 'viewer': adminRole = 'مشاهد'; break;
                        default: adminRole = adminInfo.role;
                    }
                }
            }
        } catch (e) {
            console.error('Error parsing admin info:', e);
        }
        
        let html = `
        <nav class="navbar navbar-expand-lg navbar-dark" style="background: linear-gradient(135deg, #0d964e 0%, #0a572b 100%); box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
            <div class="container py-2">
                <!-- Logo and title -->
                <a class="navbar-brand d-flex align-items-center" href="admin.html">
                    <img src="img/logo-white.png" alt="Laapak" height="40">
                    <h4 class="ms-3 mb-0 fw-bold d-none d-md-block">لوحة التحكم</h4>
                </a>
                
                <!-- Mobile toggle -->
                <button class="navbar-toggler border-0" type="button" data-bs-toggle="collapse" data-bs-target="#mainNavbar">
                    <span class="navbar-toggler-icon"></span>
                </button>
                
                <!-- Navigation and user info -->
                <div class="collapse navbar-collapse" id="mainNavbar">
                    <!-- Navigation items -->
                    <ul class="navbar-nav mx-auto">`;
                        
        // Navigation items
        this.options.navigationItems.forEach(item => {
            const isActive = item.id === this.options.activeItem;
            html += `
                        <li class="nav-item px-1">
                            <a href="${item.url}" class="nav-link${isActive ? ' active fw-bold' : ''} rounded-pill px-3 py-2 mx-1" 
                               style="${isActive ? 'background-color: rgba(255,255,255,0.3); box-shadow: 0 2px 8px rgba(0,0,0,0.15);' : 'transition: all 0.3s ease;'}">
                                <i class="${item.icon} me-2"></i>${item.text}
                            </a>
                        </li>`;
        });
        
        // Add user profile dropdown
        html += `
                    </ul>
                    <div class="d-flex align-items-center">
                        <div class="dropdown">
                            <a class="d-flex align-items-center text-white text-decoration-none dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                                <div class="rounded-circle bg-white text-success d-flex align-items-center justify-content-center me-2" 
                                     style="width: 32px; height: 32px;">
                                    <i class="fas fa-user-circle"></i>
                                </div>
                                <span class="d-none d-md-inline">${adminName}</span>
                            </a>
                            <ul class="dropdown-menu dropdown-menu-end shadow border-0" style="min-width: 240px; border-radius: 12px; margin-top: 10px;">
                                <li class="dropdown-header p-3 border-bottom">
                                    <div class="d-flex align-items-center">
                                        <div class="rounded-circle bg-light text-center me-3" style="width: 45px; height: 45px; line-height: 45px;">
                                            <i class="fas fa-user-circle text-success" style="font-size: 1.8rem;"></i>
                                        </div>
                                        <div>
                                            <h6 class="mb-0 fw-bold">${adminName}</h6>
                                            <small class="text-muted">${adminEmail}</small>
                                            <div><span class="badge bg-success">${adminRole}</span></div>
                                        </div>
                                    </div>
                                </li>
                                <li><a class="dropdown-item py-2" href="settings.html"><i class="fas fa-user-cog me-2 text-primary"></i> إعدادات الحساب</a></li>
                                <li><a class="dropdown-item py-2" href="#"><i class="fas fa-bell me-2 text-warning"></i> الإشعارات</a></li>
                                <li><hr class="dropdown-divider"></li>
                                <li><a class="dropdown-item py-2 text-danger" href="#" id="adminLogoutBtn"><i class="fas fa-sign-out-alt me-2"></i> تسجيل الخروج</a></li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </nav>`;
        
        return html;
    }
}

// Initialize the header when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Determine current page from URL
    const currentPath = window.location.pathname;
    const filename = currentPath.split('/').pop();
    
    // Determine active item based on current page
    let activeItem = '';
    if (filename === 'admin.html' || filename === '' || filename === 'index.html') {
        activeItem = 'dashboard';
    } else if (filename === 'reports.html') {
        activeItem = 'reports';
    } else if (filename === 'create-report.html') {
        activeItem = 'create-report';
    } else if (filename === 'clients.html') {
        activeItem = 'clients';
    } else if (filename === 'settings.html') {
        activeItem = 'settings';
    } else if (filename === 'report.html') {
        activeItem = 'reports'; // On individual report page, highlight reports
    }
    
    // Initialize if header container exists
    if (document.getElementById('header-container')) {
        new LpkHeader({
            activeItem: activeItem
        });
    }
});
