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
    }
    
    generateHeaderHTML() {
        let html = `
        <nav class="navbar navbar-expand-lg navbar-dark" style="background: linear-gradient(135deg, #0d964e 0%, #0a572b 100%); box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
            <div class="container-fluid py-2">
                <!-- Mobile toggle -->
                <button class="navbar-toggler border-0" type="button" data-bs-toggle="collapse" data-bs-target="#mainNavbar">
                    <span class="navbar-toggler-icon"></span>
                </button>
                
                <!-- Centered navigation items -->
                <div class="collapse navbar-collapse justify-content-center" id="mainNavbar">
                    <!-- Navigation items -->
                    <ul class="navbar-nav d-flex align-items-center">`;
                        
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
        
        // Add user profile dropdown in the center with navigation items
        html += `
                            <li class="nav-item px-1 ms-3">
                                <div class="dropdown">
                                    <a class="nav-link p-0" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                                        <div class="rounded-circle bg-white shadow-sm" style="width: 45px; height: 45px; display: flex; align-items: center; justify-content: center; border: 2px solid rgba(0, 117, 83, 0.2);">
                                            <i class="fas fa-user text-success" style="font-size: 1.4rem;"></i>
                                        </div>
                                    </a>
                                    <ul class="dropdown-menu dropdown-menu-end shadow border-0" style="min-width: 240px; border-radius: 12px; margin-top: 10px;">
                                        <li class="dropdown-header p-3 border-bottom">
                                            <div class="d-flex align-items-center">
                                                <div class="rounded-circle bg-light text-center me-3" style="width: 45px; height: 45px; line-height: 45px;">
                                                    <i class="fas fa-user-circle text-success" style="font-size: 1.8rem;"></i>
                                                </div>
                                                <div>
                                                    <h6 class="mb-0 fw-bold">المستخدم</h6>
                                                    <small class="text-muted">admin@laapak.com</small>
                                                </div>
                                            </div>
                                        </li>
                                        <li><a class="dropdown-item py-2" href="settings.html"><i class="fas fa-user-cog me-2 text-primary"></i> إعدادات الحساب</a></li>
                                        <li><a class="dropdown-item py-2" href="#"><i class="fas fa-bell me-2 text-warning"></i> الإشعارات</a></li>
                                        <li><hr class="dropdown-divider"></li>
                                        <li><a class="dropdown-item py-2 text-danger" href="#"><i class="fas fa-sign-out-alt me-2"></i> تسجيل الخروج</a></li>
                                    </ul>
                                </div>
                            </li>
                    </ul>
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
