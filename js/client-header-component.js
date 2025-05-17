/**
 * Laapak Report System
 * Client Header Component
 */

class LpkClientHeader {
    constructor(options = {}) {
        this.containerId = options.containerId || 'client-header-container';
        this.options = {
            showNavigation: options.showNavigation !== undefined ? options.showNavigation : true,
            navigationItems: options.navigationItems || [
                { text: 'الرئيسية', href: 'client-dashboard.html', target: '#reports', icon: 'fas fa-home', id: 'dashboard-tab' },
                { text: 'تقارير الصيانة', target: '#reports', icon: 'fas fa-laptop-medical', id: 'reports-tab' },
                { text: 'تفاصيل الضمان', target: '#warranty', icon: 'fas fa-shield-alt', id: 'warranty-tab' },
                { text: 'مواعيد الصيانة', target: '#maintenance', icon: 'fas fa-tools', id: 'maintenance-tab' },
                { text: 'الفواتير', target: '#invoices', icon: 'fas fa-file-invoice-dollar', id: 'invoices-tab' }
            ],
            activeItem: options.activeItem || 'dashboard-tab',
            clientName: options.clientName || 'العميل'
        };
        
        this.render();
        this.setupEventListeners();
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
    }
    
    setupEventListeners() {
        // Setup logout button using auth-middleware
        const logoutBtn = document.getElementById('clientLogoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Client logout button clicked');
                // Use auth-middleware for logout if available
                if (typeof authMiddleware !== 'undefined' && authMiddleware.logout) {
                    authMiddleware.logout();
                } else {
                    // Fallback logout if auth-middleware is not available
                    console.log('Auth middleware not available, using fallback logout');
                    localStorage.removeItem('clientToken');
                    localStorage.removeItem('clientInfo');
                    sessionStorage.removeItem('clientToken');
                    sessionStorage.removeItem('clientInfo');
                    window.location.href = 'index.html';
                }
            });
        }
        
        // Setup tab navigation
        const tabLinks = document.querySelectorAll('.client-nav-link');
        tabLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                // Remove active class from all links
                tabLinks.forEach(l => l.classList.remove('active'));
                // Add active class to clicked link
                link.classList.add('active');
            });
        });
    }
    
    generateHeaderHTML() {
        // Get client info from storage
        let clientName = this.options.clientName;
        try {
            const clientInfo = JSON.parse(localStorage.getItem('clientInfo') || sessionStorage.getItem('clientInfo') || '{}');
            if (clientInfo && clientInfo.name) {
                clientName = clientInfo.name;
            }
        } catch (e) {
            console.error('Error parsing client info:', e);
        }
        
        let html = `
        <nav class="navbar navbar-expand-lg navbar-dark" style="background: linear-gradient(135deg, #007553 0%, #004d35 100%); box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
            <div class="container py-2">
                <!-- Logo and title -->
                <a class="navbar-brand d-flex align-items-center" href="#">
                    <img src="img/cropped-Logo-mark.png.png" alt="Laapak" height="40">
                    <h4 class="ms-3 mb-0 fw-bold d-none d-md-block">Laapak</h4>
                </a>
                
                <!-- Mobile toggle -->
                <button class="navbar-toggler border-0" type="button" data-bs-toggle="collapse" data-bs-target="#clientNavbar">
                    <span class="navbar-toggler-icon"></span>
                </button>
                
                <!-- Navigation and user info -->
                <div class="collapse navbar-collapse" id="clientNavbar">
                    <!-- Navigation tabs -->
                    <ul class="navbar-nav mx-auto">`;
                    
        // Navigation items
        this.options.navigationItems.forEach(item => {
            const isActive = item.id === this.options.activeItem;
            
            // Check if this is a direct page link or a tab
            const isPageLink = item.href && !item.target.startsWith('#');
            
            html += `
                        <li class="nav-item px-1">
                            <a href="${isPageLink ? item.href : item.target}" 
                               class="nav-link client-nav-link${isActive ? ' active fw-bold' : ''} rounded-pill px-3 py-2 mx-1" 
                               id="${item.id}" 
                               ${!isPageLink ? 'data-bs-toggle="tab" data-bs-target="' + item.target + '" role="tab"' : ''}
                               style="${isActive ? 'background-color: rgba(255,255,255,0.3); box-shadow: 0 2px 8px rgba(0,0,0,0.15);' : 'transition: all 0.3s ease;'}">
                                <i class="${item.icon} me-2"></i>${item.text}
                            </a>
                        </li>`;
        });
        
        // Add user info and logout button
        html += `
                    </ul>
                    <div class="d-flex align-items-center">
                        <div class="d-flex align-items-center me-3">
                            <div class="rounded-circle bg-white text-success d-flex align-items-center justify-content-center me-2" 
                                 style="width: 32px; height: 32px;">
                                <i class="fas fa-user-circle"></i>
                            </div>
                            <span class="text-white" id="clientNameDisplay">${clientName}</span>
                        </div>
                        <a href="#" id="clientLogoutBtn" class="btn btn-outline-light btn-sm rounded-pill">
                            <i class="fas fa-sign-out-alt me-1"></i> تسجيل الخروج
                        </a>
                    </div>
                </div>
            </div>
        </nav>`;
        
        return html;
    }
}

// Initialize the header when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Get client info from storage
    let clientName = 'العميل';
    try {
        const clientInfo = JSON.parse(localStorage.getItem('clientInfo') || sessionStorage.getItem('clientInfo') || '{}');
        if (clientInfo && clientInfo.name) {
            clientName = clientInfo.name;
            
            // Also update the welcome message if it exists
            const welcomeClientName = document.getElementById('welcomeClientName');
            if (welcomeClientName) {
                welcomeClientName.textContent = clientName;
            }
        }
    } catch (e) {
        console.error('Error parsing client info:', e);
    }
    
    // Determine active tab
    const activeTabId = document.querySelector('.nav-link.active')?.id || 'reports-tab';
    
    // Initialize if header container exists
    if (document.getElementById('client-header-container')) {
        new LpkClientHeader({
            activeItem: activeTabId,
            clientName: clientName
        });
    }
});
