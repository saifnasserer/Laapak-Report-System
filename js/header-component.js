/**
 * Laapak Report System
 * Reusable Header Component - Icon Only Version
 */

class LpkHeader {
    constructor(options = {}) {
        this.containerId = options.containerId || 'header-container';
        this.options = {
            navigationItems: options.navigationItems || [
                { text: 'الرئيسية', url: 'admin.html', icon: 'fas fa-tachometer-alt', id: 'dashboard' },
                { text: 'تقرير جديد', url: 'create-report.html', icon: 'fas fa-plus-circle', id: 'create-report' },
                { text: 'التقارير', url: 'reports.html', icon: 'fas fa-file-alt', id: 'reports' },
                { text: 'الفواتير', url: 'invoices.html', icon: 'fas fa-dollar-sign', id: 'invoices' },
                { text: 'إنشاء فاتورة', url: 'create-invoice.html', icon: 'fas fa-receipt', id: 'create-invoice' },
                { text: 'العملاء', url: 'clients.html', icon: 'fas fa-users', id: 'clients' }
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
        
        // Add event listeners for active state and tooltips
        this.setupActiveStateHandlers();
    }
    
    // Translate role from English to Arabic
    translateRole(role) {
        switch(role) {
            case 'admin': return 'مدير';
            case 'superadmin': return 'مدير النظام الأعلى';
            default: return role || 'مدير';
        }
    }
    
    setupActiveStateHandlers() {
        // Initialize tooltips
        const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
        tooltips.forEach(tooltip => {
            new bootstrap.Tooltip(tooltip);
        });
        
        // Get all navigation links
        const navLinks = document.querySelectorAll('.navbar .nav-link:not(.dropdown-toggle)');
        
        // Apply a consistent inactive style to all links first
        navLinks.forEach(link => {
            link.style.backgroundColor = 'rgba(255,255,255,0.15)';
            link.style.boxShadow = '';
        });
        
        // First try to match exactly with the current URL
        const currentPath = window.location.pathname;
        const currentPage = currentPath.split('/').pop();
        
        if (currentPage) {
            let activeLink = null;
            
            // Try to find an exact match
            navLinks.forEach(link => {
                const href = link.getAttribute('href');
                if (href === currentPage) {
                    activeLink = link;
                }
            });
            
            // If we found an active link, style it
            if (activeLink) {
                activeLink.classList.add('active', 'fw-bold');
                activeLink.style.backgroundColor = 'rgba(255,255,255,0.3)';
                activeLink.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
            } else if (this.options.activeItem) {
                // Use the activeItem from options as fallback
                const fallbackLink = document.getElementById(`nav-${this.options.activeItem}`);
                if (fallbackLink) {
                    fallbackLink.classList.add('active', 'fw-bold');
                    fallbackLink.style.backgroundColor = 'rgba(255,255,255,0.3)';
                    fallbackLink.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
                }
            }
        }
        
        // Add click event listener to each link
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                // Remove active class from all links
                navLinks.forEach(l => {
                    l.classList.remove('active', 'fw-bold');
                    l.style.backgroundColor = 'rgba(255,255,255,0.15)';
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
                    // Fallback logout
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
        let adminName = 'المستخدم';
        let adminFirstName = adminName;
        let adminRole = 'مسؤول';
        
        try {
            const adminInfo = JSON.parse(localStorage.getItem('adminInfo') || sessionStorage.getItem('adminInfo') || '{}');
            if (adminInfo) {
                adminName = adminInfo.name || 'المستخدم';
                
                // Extract first name (first word before any spaces)
                const nameParts = adminName.trim().split(' ');
                adminFirstName = nameParts[0];
                
                adminRole = this.translateRole(adminInfo.role) || 'مسؤول';
            }
        } catch (e) {
            console.error('Error parsing admin info:', e);
        }
        
        let html = `
        <nav class="navbar navbar-dark" style="background: linear-gradient(135deg, #0d964e 0%, #0a572b 100%); box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
            <div class="container py-2">
                <div class="d-flex justify-content-between align-items-center w-100">
                    <!-- Logo on left -->
                    <a class="navbar-brand d-flex align-items-center" href="admin.html">
                        <img src="img/cropped-Logo-mark.png.png" alt="Laapak" height="40">
                        <h4 class="ms-3 mb-0 fw-bold d-none d-md-block">Laapak</h4>
                    </a>
                    
                    <!-- Navigation items in center - visible on all devices -->
                    <ul class="navbar-nav d-flex flex-row align-items-center justify-content-center">`;
                        
        // Navigation items - Icon only version with consistent styling
        this.options.navigationItems.forEach(item => {
            const isActive = item.id === this.options.activeItem;
            const commonStyles = 'width: 40px; height: 40px; transition: all 0.3s ease;';
            const activeStyles = 'background-color: rgba(255,255,255,0.3); box-shadow: 0 2px 8px rgba(0,0,0,0.15);';
            const inactiveStyles = 'background-color: rgba(255,255,255,0.15);';
            
            html += `
                        <li class="nav-item mx-2">
                            <a href="${item.url}" id="nav-${item.id}" class="nav-link${isActive ? ' active fw-bold' : ''} rounded-circle d-flex align-items-center justify-content-center" 
                               style="${commonStyles} ${isActive ? activeStyles : inactiveStyles}" 
                               data-bs-toggle="tooltip" data-bs-placement="bottom" title="${item.text}">
                                <i class="${item.icon}"></i>
                            </a>
                        </li>`;
        });
        
        // Add user profile dropdown
        html += `
                    </ul>
                    
                    <!-- User profile on right -->
                    <div class="dropdown">
                        <a class="d-flex align-items-center justify-content-center text-decoration-none rounded-circle" 
                           href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false"
                           style="width: 40px; height: 40px; background-color: white; transition: all 0.3s ease; box-shadow: 0 1px 3px rgba(0,0,0,0.1);"
                           title="الحساب">
                            <i class="fas fa-user text-success" style="font-size: 1.2rem;"></i>
                        </a>
                        <ul class="dropdown-menu dropdown-menu-end shadow border-0" style="min-width: 240px; border-radius: 12px; margin-top: 10px;">
                            <li class="dropdown-header p-3 border-bottom">
                                <div class="d-flex align-items-center">
                                    <div class="rounded-circle bg-light d-flex align-items-center justify-content-center me-3" style="width: 42px; height: 42px;">
                                        <i class="fas fa-user text-success"></i>
                                    </div>
                                    <div>
                                        <h6 class="mb-0 fw-bold">${adminFirstName}</h6>
                                        <div class="mt-1"><span class="badge bg-success">${adminRole}</span></div>
                                    </div>
                                </div>
                            </li>
                            <li><a class="dropdown-item py-2 d-flex align-items-center" href="settings.html"><i class="fas fa-user-cog text-primary"></i><span class="ms-3">إعدادات الحساب</span></a></li>
                            <li><hr class="dropdown-divider my-1"></li>
                            <li><a class="dropdown-item py-2 d-flex align-items-center text-danger" href="#" id="adminLogoutBtn"><i class="fas fa-sign-out-alt"></i><span class="ms-3">تسجيل الخروج</span></a></li>
                        </ul>
                    </div>
                </div>
            </div>
        </nav>`;
        
        return html;
    }
}

/**
 * HeaderComponent class for managing headers across the application
 * This provides a simple interface that other files can use
 */
class HeaderComponent {
    /**
     * Load the admin header with the specified active item
     * @param {string} activeItem - ID of the active navigation item
     */
    static loadAdminHeader(activeItem) {
        // Initialize header with active item
        if (document.getElementById('header-container')) {
            new LpkHeader({
                activeItem: activeItem
            });
        }
    }
    
    /**
     * Load the client header with the specified active item
     * @param {string} activeItem - ID of the active navigation item
     */
    static loadClientHeader(activeItem) {
        // This would initialize a client-specific header (if implemented)
        console.log('Client header loading with active item:', activeItem);
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
    } else if (filename === 'invoices.html') {
        activeItem = 'invoices'; // Add support for invoices page
    } else if (filename === 'create-invoice.html') {
        activeItem = 'create-invoice'; // Add support for create-invoice page
    }
    
    // Initialize if header container exists
    if (document.getElementById('header-container')) {
        // Use the HeaderComponent class for consistency
        HeaderComponent.loadAdminHeader(activeItem);
    }
});
