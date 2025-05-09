/**
 * Laapak Report System
 * Reusable Sidebar Component
 */

class LpkSidebar {
    constructor(options = {}) {
        this.options = {
            containerId: options.containerId || 'sidebar-container',
            activeItem: options.activeItem || '',
            items: options.items || [
                { id: 'dashboard', href: 'admin.html', icon: 'tachometer-alt', text: 'الرئيسية' },
                { id: 'reports', href: 'reports.html', icon: 'file-alt', text: 'التقارير' },
                { id: 'clients', href: 'clients.html', icon: 'users', text: 'العملاء' },
                { id: 'create-report', href: 'create-report.html', icon: 'plus-circle', text: 'تقرير جديد' },
                { id: 'settings', href: 'settings.html', icon: 'cog', text: 'الإعدادات' }
            ],
            showLogo: options.showLogo !== undefined ? options.showLogo : true,
            logoPath: options.logoPath || 'img/cropped-Logo-mark.png',
            logoWidth: options.logoWidth || '70px',
            collapsed: localStorage.getItem('sidebarCollapsed') === 'true' || false
        };
        
        this.init();
    }
    
    init() {
        // Find container
        const container = document.getElementById(this.options.containerId);
        if (!container) {
            console.error(`Sidebar container with ID '${this.options.containerId}' not found`);
            return;
        }
        
        // Generate sidebar HTML
        const sidebarHTML = this.generateSidebarHTML();
        
        // Insert into container
        container.innerHTML = sidebarHTML;
        
        // Add event listeners if needed
        this.setupEventListeners();
    }
    
    generateSidebarHTML() {
        // Determine sidebar initial visibility class based on collapsed state
        const visibilityClass = this.options.collapsed ? 'd-none' : 'd-none d-lg-block';
        
        // Note: No column div here, just the sidebar content
        let html = `
            <div class="admin-sidebar ${visibilityClass} shadow-sm" id="sidebar-inner">
            <button id="toggle-sidebar" class="btn btn-sm btn-dark-green position-absolute" style="right: -40px; top: 10px; z-index: 1000;">
                <i class="fas ${this.options.collapsed ? 'fa-expand-alt' : 'fa-thumbtack'}"></i>
            </button>`;
        
        // Logo and title section
        if (this.options.showLogo) {
            html += `
                <div class="p-3 text-center bg-gradient-success rounded mb-4 mt-3 shadow-sm">
                    <div class="bg-white rounded-circle p-2 d-inline-block mb-3 shadow-sm">
                        <img src="${this.options.logoPath}" alt="Laapak" width="${this.options.logoWidth}" class="img-fluid">
                    </div>
                    <h5 class="text-white mb-0 fw-bold">نظام تقارير Laapak</h5>
                </div>`;
        }
        
        // Navigation items
        html += `
                <div class="nav flex-column px-2">`;
        
        // Generate menu items
        this.options.items.forEach(item => {
            const isActive = item.id === this.options.activeItem;
            html += `
                    <a href="${item.href}" class="nav-link mb-2 rounded-pill${isActive ? ' active shadow-sm' : ''}">
                        <i class="fas fa-${item.icon} me-2"></i> ${item.text}
                    </a>`;
        });
        
        // Logout section
        html += `
                    <div class="border-top my-3 opacity-25"></div>
                    <a href="index.html" class="nav-link mb-2 rounded-pill text-danger">
                        <i class="fas fa-sign-out-alt me-2"></i> تسجيل الخروج
                    </a>
                </div>
            </div>`;
        
        return html;
    }
    
    setupEventListeners() {
        // Toggle sidebar visibility when the toggle button is clicked
        const toggleBtn = document.getElementById('toggle-sidebar');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                this.toggleSidebar();
            });
        }
    }
    
    toggleSidebar() {
        const sidebar = document.getElementById('sidebar-inner');
        const toggleBtn = document.getElementById('toggle-sidebar');
        
        if (!sidebar || !toggleBtn) return;
        
        // Check if sidebar is currently shown
        const isCollapsed = sidebar.classList.contains('d-none');
        
        if (isCollapsed) {
            // Show sidebar
            sidebar.classList.remove('d-none');
            sidebar.classList.add('d-none', 'd-lg-block');
            toggleBtn.innerHTML = '<i class="fas fa-thumbtack"></i>';
            localStorage.setItem('sidebarCollapsed', 'false');
        } else {
            // Hide sidebar
            sidebar.classList.remove('d-none', 'd-lg-block');
            sidebar.classList.add('d-none');
            toggleBtn.innerHTML = '<i class="fas fa-expand-alt"></i>';
            localStorage.setItem('sidebarCollapsed', 'true');
        }
    }
}

// Initialize the sidebar when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Determine current page from URL
    const currentPath = window.location.pathname;
    const filename = currentPath.split('/').pop();
    
    // Determine active item based on current page
    let activeItem = '';
    if (filename === 'admin.html' || filename === '') {
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
    
    // Initialize if sidebar container exists
    if (document.getElementById('sidebar-container')) {
        new LpkSidebar({
            activeItem: activeItem
        });
    }
    
    // Add mobile toggle button to the navbar for small screens
    const mobileNav = document.querySelector('.navbar-nav');
    if (mobileNav) {
        const toggleItem = document.createElement('li');
        toggleItem.className = 'nav-item d-lg-none';
        toggleItem.innerHTML = `
            <a class="nav-link" href="javascript:void(0)" id="mobile-sidebar-toggle">
                <i class="fas fa-bars me-1"></i> القائمة
            </a>
        `;
        mobileNav.appendChild(toggleItem);
        
        // Add click event to mobile toggle
        setTimeout(() => {
            const mobileToggle = document.getElementById('mobile-sidebar-toggle');
            if (mobileToggle) {
                mobileToggle.addEventListener('click', function() {
                    const sidebar = document.getElementById('sidebar-inner');
                    if (sidebar) {
                        if (sidebar.classList.contains('d-none')) {
                            sidebar.classList.remove('d-none');
                            sidebar.classList.add('d-block');
                        } else {
                            sidebar.classList.remove('d-block');
                            sidebar.classList.add('d-none');
                        }
                    }
                });
            }
        }, 100);
    }
});
