/**
 * Laapak Report System
 * Client Header Component - Enhanced Version v2.0
 */

class LpkClientHeader {
    constructor(options = {}) {
        this.containerId = options.containerId || 'client-header-container';
        this.options = {
            clientName: options.clientName || 'العميل'
        };
        
        this.render();
        this.addEnhancedStyles();
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
    
    /**
     * Add enhanced CSS styles
     */
    addEnhancedStyles() {
        if (!document.getElementById('client-header-enhanced-styles')) {
            const style = document.createElement('style');
            style.id = 'client-header-enhanced-styles';
            style.textContent = `
                .client-header-navbar {
                    position: relative;
                    z-index: 1000;
                }
                
                .client-header-navbar::after {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 50%, rgba(255,255,255,0.05) 100%);
                    pointer-events: none;
                }
                
                .client-header-user-dropdown .btn {
                    transition: all 0.3s ease;
                }
                
                .client-header-user-dropdown .btn:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                }
                
                .client-header-brand {
                    transition: all 0.3s ease;
                }
                
                .client-header-brand:hover {
                    transform: translateY(-1px);
                    filter: brightness(1.1);
                }
                
                @media (max-width: 768px) {
                    .client-header-brand img {
                        height: 35px !important;
                    }
                    
                    .client-header-brand h4 {
                        font-size: 1.1rem !important;
                    }
                }
                
                @media (max-width: 576px) {
                    .client-header-brand img {
                        height: 30px !important;
                    }
                    
                    .client-header-brand h4 {
                        font-size: 1rem !important;
                    }
                }
            `;
            document.head.appendChild(style);
        }
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
        <nav class="navbar navbar-dark client-header-navbar" style="background: linear-gradient(135deg, #007553 0%, #004d35 100%); box-shadow: 0 8px 32px rgba(0,0,0,0.15); border-radius: 16px; position: relative; overflow: hidden;">
            <!-- Enhanced background pattern -->
            <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23ffffff%22 fill-opacity=%220.03%22%3E%3Ccircle cx=%2230%22 cy=%2230%22 r=%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E') repeat; opacity: 0.6;"></div>
            
            <!-- Top accent line -->
            <div style="position: absolute; top: 0; left: 0; right: 0; height: 3px; background: linear-gradient(90deg, #00a67a, #007553, #00a67a);"></div>
            
            <div class="container py-3">
                <div class="d-flex w-100 justify-content-between align-items-center position-relative">
                    <!-- Empty div to balance the layout on the right -->
                    <div style="width: 50px; position: relative; z-index: 2;"></div>
                    
                    <!-- Centered Logo and title -->
                    <div class="position-absolute start-50 translate-middle-x" style="position: relative; z-index: 2;">
                        <a class="navbar-brand d-flex align-items-center client-header-brand" href="client-dashboard.html">
                            <img src="img/cropped-Logo-mark.png.png" alt="Laapak" height="40">
                            <h4 class="ms-3 mb-0 fw-bold d-none d-sm-block">Laapak</h4>
                        </a>
                    </div>
                    
                    <!-- User dropdown on the right -->
                    <div class="ms-auto d-flex align-items-center" style="position: relative; z-index: 2;">
                        <div class="dropdown client-header-user-dropdown">
                            <button class="btn btn-sm btn-outline-light rounded-pill dropdown-toggle" type="button" id="userDropdown" data-bs-toggle="dropdown" aria-expanded="false" style="backdrop-filter: blur(10px);">
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
            
            <!-- Bottom accent line -->
            <div style="position: absolute; bottom: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);"></div>
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
        console.log('🎯 Client Header Component initialized successfully!');
        console.log('👤 Client name:', clientName);
    }
});
