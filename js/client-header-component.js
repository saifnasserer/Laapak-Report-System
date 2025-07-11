/**
 * Laapak Report System
 * Client Header Component
 */

class LpkClientHeader {
    constructor(options = {}) {
        this.containerId = options.containerId || 'client-header-container';
        this.options = {
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
    }
    
    generateHeaderHTML() {
        // Get client info from storage
        let clientName = this.options.clientName;
        let firstName = clientName;
        
        try {
            const clientInfo = JSON.parse(localStorage.getItem('clientInfo') || sessionStorage.getItem('clientInfo') || '{}');
            if (clientInfo && clientInfo.name) {
                clientName = clientInfo.name;
                // Extract first name (first word before any spaces)
                const nameParts = clientName.trim().split(' ');
                firstName = nameParts[0];
            }
        } catch (e) {
            console.error('Error parsing client info:', e);
        }
        
        let html = `
        <nav class="navbar navbar-dark" style="background: linear-gradient(135deg, #007553 0%, #004d35 100%); box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
            <div class="container py-2">
                <div class="d-flex w-100 justify-content-between align-items-center position-relative">
                    <!-- Empty div to balance the layout on the right -->
                    <div style="width: 40px;"></div>
                    
                    <!-- Centered Logo and title -->
                    <div class="position-absolute start-50 translate-middle-x">
                        <a class="navbar-brand d-flex align-items-center" href="client-dashboard.html">
                            <img src="img/cropped-Logo-mark.png.png" alt="Laapak" height="40">
                            <h4 class="ms-3 mb-0 fw-bold d-none d-sm-block">Laapak</h4>
                        </a>
                    </div>
                    
                    <!-- User dropdown on the right -->
                    <div class="ms-auto d-flex align-items-center">
                        <div class="dropdown">
                            <button class="btn btn-sm btn-outline-light rounded-pill dropdown-toggle" type="button" id="userDropdown" data-bs-toggle="dropdown" aria-expanded="false">
                                <i class="fas fa-user-circle"></i>
                            </button>
                            <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="userDropdown">
                                <li><div class="dropdown-item"><span id="clientNameDisplay">${firstName}</span></div></li>
                                <li><hr class="dropdown-divider"></li>
                                <li><a class="dropdown-item text-danger" href="#" id="clientLogoutBtn"><i class="fas fa-sign-out-alt me-1"></i> تسجيل الخروج</a></li>
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
    
    // Initialize if header container exists
    if (document.getElementById('client-header-container')) {
        new LpkClientHeader({
            clientName: clientName
        });
    }
});
