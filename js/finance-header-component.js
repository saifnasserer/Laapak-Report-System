/**
 * Unified Finance Header Component
 * Used across all financial management screens
 */
class FinanceHeaderComponent {
    constructor() {
        this.currentPage = this.getCurrentPage();
        this.navItems = [
            {
                href: 'financial-dashboard.html',
                icon: 'fas fa-tachometer-alt',
                title: 'لوحة التحكم',
                key: 'dashboard'
            },
            {
                href: 'financial-profit-management.html',
                icon: 'fas fa-coins',
                title: 'إدارة الأرباح',
                key: 'profit-management'
            },
            {
                href: 'financial-add-expense.html',
                icon: 'fas fa-plus',
                title: 'إضافة مصروف',
                key: 'add-expense'
            },
            {
                href: 'money-management.html',
                icon: 'fas fa-money-bill-wave',
                title: 'إدارة الأموال',
                key: 'money-management'
            },
            {
                href: 'expected-money.html',
                icon: 'fas fa-clock',
                title: 'فلوسك بس مش معاك',
                key: 'expected-money'
            }
        ];
    }

    /**
     * Get current page identifier
     */
    getCurrentPage() {
        const path = window.location.pathname;
        const filename = path.split('/').pop();
        
        if (filename === 'financial-dashboard.html') return 'dashboard';
        if (filename === 'financial-profit-management.html') return 'profit-management';
        if (filename === 'financial-add-expense.html') return 'add-expense';
        if (filename === 'money-management.html') return 'money-management';
        if (filename === 'expected-money.html') return 'expected-money';
        
        return 'dashboard'; // default
    }

    /**
     * Render the enhanced finance header
     */
    render() {
        const headerHTML = `
            <div class="row mb-4">
                <div class="col-12">
                    <nav class="navbar navbar-dark finance-navbar" style="background: linear-gradient(135deg, #0d964e 0%, #0a572b 100%); box-shadow: 0 8px 32px rgba(0,0,0,0.15); border-radius: 16px; position: relative; overflow: hidden;">
                        <!-- Enhanced background pattern -->
                        <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23ffffff%22 fill-opacity=%220.03%22%3E%3Ccircle cx=%2230%22 cy=%2230%22 r=%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E') repeat; opacity: 0.6;"></div>
                        
                        <!-- Top accent line -->
                        <div style="position: absolute; top: 0; left: 0; right: 0; height: 3px; background: linear-gradient(90deg, #00a67a, #007553, #00a67a);"></div>
                        
                        <div class="container py-3">
                            <div class="d-flex justify-content-center align-items-center w-100">
                                <!-- Enhanced navigation items -->
                                <ul class="navbar-nav d-flex flex-row align-items-center justify-content-center" style="gap: 1rem;">
                                    ${this.navItems.map(item => this.renderNavItem(item)).join('')}
                                </ul>
                            </div>
                        </div>
                        
                        <!-- Bottom accent line -->
                        <div style="position: absolute; bottom: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);"></div>
                    </nav>
                </div>
            </div>
        `;

        return headerHTML;
    }

    /**
     * Render enhanced individual navigation item
     */
    renderNavItem(item) {
        const isActive = this.currentPage === item.key;
        const activeClass = isActive ? 'active fw-bold' : '';
        const activeStyle = isActive 
            ? 'background: linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.15) 100%); box-shadow: 0 4px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3);' 
            : 'background: rgba(255,255,255,0.1); box-shadow: 0 2px 8px rgba(0,0,0,0.1); border: 1px solid rgba(255,255,255,0.1);';
        
        return `
            <li class="nav-item">
                <a href="${item.href}" class="nav-link ${activeClass} rounded-circle d-flex align-items-center justify-content-center finance-nav-link" 
                   style="width: 50px; height: 50px; ${activeStyle} transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); position: relative; backdrop-filter: blur(10px);" 
                   data-bs-toggle="tooltip" data-bs-placement="bottom" title="${item.title}">
                    <i class="${item.icon}" style="font-size: 1.1rem; color: ${isActive ? '#ffffff' : 'rgba(255,255,255,0.9)'}; transition: all 0.3s ease;"></i>
                    ${isActive ? '<div style="position: absolute; bottom: -2px; left: 50%; transform: translateX(-50%); width: 20px; height: 3px; background: #ffffff; border-radius: 2px;"></div>' : ''}
                </a>
            </li>
        `;
    }

    /**
     * Initialize the header component
     */
    init() {
        // Find the header container
        const headerContainer = document.querySelector('.finance-header-container');
        if (headerContainer) {
            headerContainer.innerHTML = this.render();
            this.setupInteractions();
            this.addEnhancedStyles();
        } else {
            console.warn('Finance header container not found. Add <div class="finance-header-container"></div> to your page.');
        }
    }

    /**
     * Add enhanced CSS styles
     */
    addEnhancedStyles() {
        if (!document.getElementById('finance-header-styles')) {
            const style = document.createElement('style');
            style.id = 'finance-header-styles';
            style.textContent = `
                .finance-nav-link {
                    position: relative;
                    overflow: hidden;
                }
                
                .finance-nav-link::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
                    transition: left 0.5s ease;
                }
                
                .finance-nav-link:hover::before {
                    left: 100%;
                }
                
                .finance-nav-link:hover {
                    transform: translateY(-2px) scale(1.05);
                    box-shadow: 0 6px 20px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.3) !important;
                    background: linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.1) 100%) !important;
                }
                
                .finance-nav-link.active {
                    animation: activePulse 2s ease-in-out infinite;
                }
                
                @keyframes activePulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.02); }
                }
                
                .finance-navbar {
                    position: relative;
                    z-index: 1000;
                }
                
                .finance-navbar::after {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 50%, rgba(255,255,255,0.05) 100%);
                    pointer-events: none;
                }
                
                @media (max-width: 768px) {
                    .finance-nav-link {
                        width: 45px !important;
                        height: 45px !important;
                    }
                    
                    .finance-nav-link i {
                        font-size: 1rem !important;
                    }
                }
                
                @media (max-width: 576px) {
                    .finance-nav-link {
                        width: 40px !important;
                        height: 40px !important;
                    }
                    
                    .finance-nav-link i {
                        font-size: 0.9rem !important;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    /**
     * Setup enhanced navigation interactions
     */
    setupInteractions() {
        const navLinks = document.querySelectorAll('.finance-navbar .nav-link');
        
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
            
            // Add hover sound effect (optional)
            link.addEventListener('mouseenter', () => {
                link.style.transform = 'translateY(-2px) scale(1.05)';
            });
            
            link.addEventListener('mouseleave', () => {
                if (!link.classList.contains('active')) {
                    link.style.transform = 'translateY(0) scale(1)';
                }
            });
        });
    }

    /**
     * Get navigation items for external use
     */
    getNavItems() {
        return this.navItems;
    }

    /**
     * Get current page key
     */
    getCurrentPageKey() {
        return this.currentPage;
    }

    /**
     * Check if a specific page is active
     */
    isPageActive(pageKey) {
        return this.currentPage === pageKey;
    }
}

/**
 * Auto-initialize the finance header when DOM is loaded
 */
document.addEventListener('DOMContentLoaded', function() {
    // Initialize tooltips for Bootstrap
    if (typeof bootstrap !== 'undefined') {
        const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
        tooltips.forEach(tooltip => {
            new bootstrap.Tooltip(tooltip);
        });
    }
    
    // Initialize finance header
    const financeHeader = new FinanceHeaderComponent();
    financeHeader.init();
    
    // Make it globally available
    window.FinanceHeader = financeHeader;
    
    console.log('🎯 Finance Header Component initialized successfully!');
    console.log('📍 Current page:', financeHeader.getCurrentPageKey());
});

/**
 * Export for module systems
 */
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FinanceHeaderComponent;
}
