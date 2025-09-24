/**
 * Laapak Report System
 * Reusable Header Component - Enhanced Version v2.0
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
        
        // Add enhanced styles
        this.addEnhancedStyles();
        
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
    
    /**
     * Add enhanced CSS styles
     */
    addEnhancedStyles() {
        if (!document.getElementById('header-enhanced-styles')) {
            const style = document.createElement('style');
            style.id = 'header-enhanced-styles';
            style.textContent = `
                .header-nav-link {
                    position: relative;
                    overflow: hidden;
                }
                
                .header-nav-link::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
                    transition: left 0.5s ease;
                }
                
                .header-nav-link:hover::before {
                    left: 100%;
                }
                
                .header-nav-link:hover {
                    transform: translateY(-2px) scale(1.05);
                    box-shadow: 0 6px 20px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.3) !important;
                    background: linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.1) 100%) !important;
                }
                
                .header-nav-link.active {
                    animation: activePulse 2s ease-in-out infinite;
                }
                
                @keyframes activePulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.02); }
                }
                
                .header-navbar {
                    position: relative;
                    z-index: 1000;
                }
                
                .header-user-dropdown {
                    position: relative;
                    z-index: 1001;
                }
                
                .header-user-dropdown .dropdown-menu {
                    z-index: 1002 !important;
                    position: absolute !important;
                    transform: none !important;
                    top: 100% !important;
                    left: auto !important;
                    right: 0 !important;
                    margin-top: 8px !important;
                    overflow: visible !important;
                }
                
                .header-user-dropdown {
                    overflow: visible !important;
                }
                
                .header-navbar::after {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 50%, rgba(255,255,255,0.05) 100%);
                    pointer-events: none;
                }
                
                .header-user-dropdown .btn {
                    transition: all 0.3s ease;
                }
                
                .header-user-dropdown .btn:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                }
                
                .header-brand {
                    transition: all 0.3s ease;
                }
                
                .header-brand:hover {
                    transform: translateY(-1px);
                    filter: brightness(1.1);
                }
                
                @media (max-width: 768px) {
                    .header-nav-link {
                        width: 40px !important;
                        height: 40px !important;
                    }
                    
                    .header-nav-link i {
                        font-size: 0.9rem !important;
                    }
                    
                    .header-brand img {
                        height: 35px !important;
                    }
                    
                    .header-brand h4 {
                        font-size: 1.1rem !important;
                    }
                }
                
                @media (max-width: 576px) {
                    .header-nav-link {
                        width: 36px !important;
                        height: 36px !important;
                    }
                    
                    .header-nav-link i {
                        font-size: 0.8rem !important;
                    }
                    
                    .header-brand img {
                        height: 30px !important;
                    }
                    
                    .header-brand h4 {
                        font-size: 1rem !important;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    setupActiveStateHandlers() {
        // Initialize tooltips
        const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
        tooltips.forEach(tooltip => {
            new bootstrap.Tooltip(tooltip);
        });
        
        // Get all navigation links
        const navLinks = document.querySelectorAll('.header-navbar .nav-link:not(.dropdown-toggle)');
        
        // Apply a consistent inactive style to all links first
        navLinks.forEach(link => {
            link.style.background = 'rgba(255,255,255,0.1)';
            link.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
            link.style.border = '1px solid rgba(255,255,255,0.1)';
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
                activeLink.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.15) 100%)';
                activeLink.style.boxShadow = '0 4px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.2)';
                activeLink.style.border = '1px solid rgba(255,255,255,0.3)';
                
                // Add active indicator
                const indicator = document.createElement('div');
                indicator.style.cssText = 'position: absolute; bottom: -2px; left: 50%; transform: translateX(-50%); width: 20px; height: 3px; background: #ffffff; border-radius: 2px;';
                activeLink.appendChild(indicator);
                
                // Set icon color
                const icon = activeLink.querySelector('i');
                if (icon) icon.style.color = '#ffffff';
            } else if (this.options.activeItem) {
                // Use the activeItem from options as fallback
                const fallbackLink = document.getElementById(`nav-${this.options.activeItem}`);
                if (fallbackLink) {
                    fallbackLink.classList.add('active', 'fw-bold');
                    fallbackLink.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.15) 100%)';
                    fallbackLink.style.boxShadow = '0 4px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.2)';
                    fallbackLink.style.border = '1px solid rgba(255,255,255,0.3)';
                    
                    // Add active indicator
                    const indicator = document.createElement('div');
                    indicator.style.cssText = 'position: absolute; bottom: -2px; left: 50%; transform: translateX(-50%); width: 20px; height: 3px; background: #ffffff; border-radius: 2px;';
                    fallbackLink.appendChild(indicator);
                    
                    // Set icon color
                    const icon = fallbackLink.querySelector('i');
                    if (icon) icon.style.color = '#ffffff';
                }
            }
        }
        
        // Add click event listener to each link
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                // Remove active class from all links
                navLinks.forEach(l => {
                    l.classList.remove('active', 'fw-bold');
                    l.style.background = 'rgba(255,255,255,0.1)';
                    l.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                    l.style.border = '1px solid rgba(255,255,255,0.1)';
                    
                    // Remove active indicator
                    const indicator = l.querySelector('div[style*="position: absolute; bottom: -2px"]');
                    if (indicator) indicator.remove();
                    
                    // Reset icon color
                    const icon = l.querySelector('i');
                    if (icon) icon.style.color = 'rgba(255,255,255,0.9)';
                });
                
                // Add active class to clicked link
                link.classList.add('active', 'fw-bold');
                link.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.15) 100%)';
                link.style.boxShadow = '0 4px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.2)';
                link.style.border = '1px solid rgba(255,255,255,0.3)';
                
                // Add active indicator
                const indicator = document.createElement('div');
                indicator.style.cssText = 'position: absolute; bottom: -2px; left: 50%; transform: translateX(-50%); width: 20px; height: 3px; background: #ffffff; border-radius: 2px;';
                link.appendChild(indicator);
                
                // Set icon color
                const icon = link.querySelector('i');
                if (icon) icon.style.color = '#ffffff';
            });
            
            // Add hover effects
            link.addEventListener('mouseenter', () => {
                link.style.transform = 'translateY(-2px) scale(1.05)';
            });
            
            link.addEventListener('mouseleave', () => {
                if (!link.classList.contains('active')) {
                    link.style.transform = 'translateY(0) scale(1)';
                }
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
        let userRole = 'admin';
        
        try {
            const adminInfo = JSON.parse(localStorage.getItem('adminInfo') || sessionStorage.getItem('adminInfo') || '{}');
            if (adminInfo) {
                adminName = adminInfo.name || 'المستخدم';
                
                // Extract first name (first word before any spaces)
                const nameParts = adminName.trim().split(' ');
                adminFirstName = nameParts[0];
                
                adminRole = this.translateRole(adminInfo.role) || 'مسؤول';
                userRole = adminInfo.role || 'admin';
            }
        } catch (e) {
            console.error('Error parsing admin info:', e);
        }
        
        // Filter navigation items based on user role
        const filteredNavigationItems = this.options.navigationItems.filter(item => {
            // If user is not superadmin, hide financial pages
            if (userRole !== 'superadmin') {
                const financialPages = [
                    'financial-dashboard.html',
                    'financial-profit-management.html', 
                    'financial-add-expense.html'
                ];
                
                if (financialPages.includes(item.url)) {
                    return false; // Hide this item
                }
            }
            return true; // Show this item
        });
        
        let html = `
        <nav class="navbar navbar-dark header-navbar" style="background: linear-gradient(135deg, #0d964e 0%, #0a572b 100%); box-shadow: 0 8px 32px rgba(0,0,0,0.15); border-radius: 16px; position: relative; overflow: visible;">
            <!-- Enhanced background pattern -->
            <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23ffffff%22 fill-opacity=%220.03%22%3E%3Ccircle cx=%2230%22 cy=%2230%22 r=%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E') repeat; opacity: 0.6;"></div>
            
            <!-- Top accent line -->
            <div style="position: absolute; top: 0; left: 0; right: 0; height: 3px; background: linear-gradient(90deg, #00a67a, #007553, #00a67a);"></div>
            
            <div class="container py-3">
                <div class="d-flex justify-content-between align-items-center w-100">
                    <!-- Logo on left -->
                    <a class="navbar-brand d-flex align-items-center header-brand" href="admin.html" style="position: relative; z-index: 2;">
                        <img src="img/cropped-Logo-mark.png.png" alt="Laapak" height="40">
                        <h4 class="ms-3 mb-0 fw-bold d-none d-md-block">Laapak</h4>
                    </a>
                    
                    <!-- Navigation items in center - visible on all devices -->
                    <ul class="navbar-nav d-flex flex-row align-items-center justify-content-center" style="gap: 0.75rem; position: relative; z-index: 2;">`;
                        
        // Navigation items - Enhanced version with consistent styling
        filteredNavigationItems.forEach(item => {
            const isActive = item.id === this.options.activeItem;
            const activeStyle = isActive 
                ? 'background: linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.15) 100%); box-shadow: 0 4px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3);' 
                : 'background: rgba(255,255,255,0.1); box-shadow: 0 2px 8px rgba(0,0,0,0.1); border: 1px solid rgba(255,255,255,0.1);';
            
            html += `
                        <li class="nav-item">
                            <a href="${item.url}" id="nav-${item.id}" class="nav-link${isActive ? ' active fw-bold' : ''} rounded-circle d-flex align-items-center justify-content-center header-nav-link" 
                               style="width: 50px; height: 50px; ${activeStyle} transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); position: relative; backdrop-filter: blur(10px);" 
                               data-bs-toggle="tooltip" data-bs-placement="bottom" title="${item.text}">
                                <i class="${item.icon}" style="font-size: 1.1rem; color: ${isActive ? '#ffffff' : 'rgba(255,255,255,0.9)'}; transition: all 0.3s ease;"></i>
                                ${isActive ? '<div style="position: absolute; bottom: -2px; left: 50%; transform: translateX(-50%); width: 20px; height: 3px; background: #ffffff; border-radius: 2px;"></div>' : ''}
                            </a>
                        </li>`;
        });
        
        // Add user profile dropdown
        html += `
                    </ul>
                    
                    <!-- User profile on right -->
                    <div class="dropdown header-user-dropdown" style="position: relative; z-index: 2;">
                        <a class="d-flex align-items-center justify-content-center text-decoration-none rounded-circle" 
                           href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false"
                           style="width: 50px; height: 50px; background: linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.1) 100%); transition: all 0.3s ease; box-shadow: 0 4px 12px rgba(0,0,0,0.15); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.2);"
                           title="الحساب">
                            <i class="fas fa-user text-white" style="font-size: 1.3rem;"></i>
                        </a>
                        <ul class="dropdown-menu dropdown-menu-end shadow border-0" style="min-width: 240px; border-radius: 12px; margin-top: 8px; z-index: 1002;">
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
            
            <!-- Bottom accent line -->
            <div style="position: absolute; bottom: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);"></div>
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
        console.log('🎯 Admin Header Component initialized successfully!');
        console.log('📍 Current page:', filename, 'Active item:', activeItem);
    }
});
