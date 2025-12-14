/**
 * Laapak Report System
 * Client Header Component - Enhanced Version v3.0 - Transparent Floating Design
 */

class LpkClientHeader {
    constructor(options = {}) {
        this.placement = options.placement === 'footer' ? 'footer' : 'header';
        this.containerId = options.containerId || (this.placement === 'footer' ? 'client-footer-container' : 'client-header-container');
        this.options = {
            clientName: options.clientName || 'العميل',
            placement: this.placement
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
     * Add enhanced CSS styles with transparent glass morphism
     */
    addEnhancedStyles() {
        if (!document.getElementById('client-header-enhanced-styles')) {
            const style = document.createElement('style');
            style.id = 'client-header-enhanced-styles';
            style.textContent = `
                /* Floating Header Container - Transparent */
                .floating-header-container {
                    position: relative;
                    z-index: 1000;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 1.5rem 2rem;
                    margin-bottom: 2rem;
                    min-height: 80px;
                    background: transparent;
                    overflow: visible;
                }

                .floating-header-container.footer-placement {
                    position: fixed;
                    bottom: 1rem;
                    left: 50%;
                    transform: translateX(-50%);
                    width: min(1100px, calc(100% - 2rem));
                    margin-bottom: 0;
                    z-index: 1052;
                    pointer-events: none;
                }

                .floating-header-container.footer-placement > * {
                    pointer-events: all;
                }

                @media (max-width: 768px) {
                    .floating-header-container.footer-placement {
                        width: calc(100% - 1rem);
                        bottom: 0.75rem;
                        padding: 1rem 1.25rem;
                    }
                }
                
                /* Floating Glass Cards - Transparent */
                .glass-card-float {
                    background: rgba(255, 255, 255, 0.15);
                    backdrop-filter: blur(30px) saturate(180%);
                    -webkit-backdrop-filter: blur(30px) saturate(180%);
                    border: 1px solid rgba(255, 255, 255, 0.3);
                    border-radius: 24px;
                    box-shadow: 
                        0 8px 32px rgba(0, 0, 0, 0.06),
                        0 0 0 1px rgba(255, 255, 255, 0.2) inset;
                    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                    position: relative;
                    overflow: visible;
                }
                
                .glass-card-float::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(14, 175, 84, 0.05);
                    opacity: 0;
                    transition: opacity 0.4s ease;
                    pointer-events: none;
                }
                
                .glass-card-float:hover::before {
                    opacity: 1;
                }
                
                .glass-card-float:hover {
                    transform: translateY(-8px) scale(1.02);
                    background: rgba(255, 255, 255, 0.25);
                    border-color: rgba(255, 255, 255, 0.5);
                    box-shadow: 
                        0 20px 60px rgba(0, 0, 0, 0.1),
                        0 0 0 1px rgba(255, 255, 255, 0.3) inset;
                }
                
                /* Floating Logo Card */
                .floating-logo-card {
                    padding: 1rem 1.5rem;
                }
                
                .floating-brand-link {
                    text-decoration: none;
                    color: inherit;
                    display: block;
                }
                
                .floating-logo-wrapper {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }
                
                .logo-orb {
                    position: relative;
                    width: 60px;
                    height: 60px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #0eaf54;
                    border-radius: 50%;
                    box-shadow: 
                        0 8px 24px rgba(14, 175, 84, 0.25),
                        0 0 0 4px rgba(255, 255, 255, 0.3),
                        inset 0 2px 4px rgba(255, 255, 255, 0.4),
                        inset 0 -2px 4px rgba(0, 0, 0, 0.1);
                    transition: all 0.4s ease;
                    overflow: visible;
                }
                
                .floating-logo-card:hover .logo-orb {
                    transform: scale(1.1) rotate(5deg);
                    background: #0fa85a;
                    box-shadow: 
                        0 12px 32px rgba(14, 175, 84, 0.35),
                        0 0 0 6px rgba(255, 255, 255, 0.4),
                        inset 0 2px 4px rgba(255, 255, 255, 0.5),
                        inset 0 -2px 4px rgba(0, 0, 0, 0.1);
                }
                
                .floating-logo-img {
                    width: 40px;
                    height: 40px;
                    object-fit: contain;
                    filter: none;
                    position: relative;
                    z-index: 2;
                    transition: all 0.3s ease;
                }
                
                .orb-glow {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 80px;
                    height: 80px;
                    background: radial-gradient(circle, rgba(255, 255, 255, 0.4) 0%, transparent 70%);
                    border-radius: 50%;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                    animation: orbPulse 3s ease-in-out infinite;
                }
                
                @keyframes orbPulse {
                    0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.3; }
                    50% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.6; }
                }
                
                .floating-brand-text {
                    display: flex;
                    flex-direction: column;
                }
                
                .floating-brand-title {
                    font-size: 1.75rem;
                    font-weight: 800;
                    color: #0eaf54;
                    margin: 0;
                    line-height: 1.2;
                    text-shadow: 0 2px 8px rgba(14, 175, 84, 0.15);
                    transition: color 0.3s ease;
                }
                
                .floating-logo-card:hover .floating-brand-title {
                    color: #0fa85a;
                }
                
                .floating-brand-subtitle {
                    font-size: 0.75rem;
                    color: rgba(0, 0, 0, 0.6);
                    font-weight: 500;
                    margin-top: -4px;
                    letter-spacing: 0.5px;
                }
                
                /* Floating User Card */
                .floating-user-card {
                    padding: 0.75rem 1.25rem;
                }
                
                .floating-user-content {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }
                
                .floating-avatar-container {
                    position: relative;
                }
                
                .floating-avatar {
                    width: 50px;
                    height: 50px;
                    border-radius: 50%;
                    background: #0eaf54;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-weight: 700;
                    font-size: 1.2rem;
                    position: relative;
                    box-shadow: 
                        0 8px 24px rgba(14, 175, 84, 0.25),
                        0 0 0 3px rgba(255, 255, 255, 0.4),
                        inset 0 2px 4px rgba(255, 255, 255, 0.3),
                        inset 0 -2px 4px rgba(0, 0, 0, 0.1);
                    transition: all 0.4s ease;
                    overflow: visible;
                }
                
                .floating-avatar::before {
                    content: attr(data-initials);
                }
                
                .floating-user-card:hover .floating-avatar {
                    transform: scale(1.15) rotate(-5deg);
                    background: #0fa85a;
                    box-shadow: 
                        0 12px 32px rgba(14, 175, 84, 0.35),
                        0 0 0 5px rgba(255, 255, 255, 0.5),
                        inset 0 2px 4px rgba(255, 255, 255, 0.4),
                        inset 0 -2px 4px rgba(0, 0, 0, 0.1);
                }
                
               
                @keyframes avatarGlow {
                    0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.3; }
                    50% { transform: translate(-50%, -50%) scale(1.3); opacity: 0.6; }
                }
                
                .floating-status-dot {
                    position: absolute;
                    bottom: 2px;
                    right: 2px;
                    width: 14px;
                    height: 14px;
                    background: #4ade80;
                    border: 3px solid white;
                    border-radius: 50%;
                    box-shadow: 0 0 12px rgba(74, 222, 128, 0.8);
                    animation: statusPulse 2s ease-in-out infinite;
                }
                
                @keyframes statusPulse {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.3); opacity: 0.8; }
                }
                
                .floating-user-details {
                    display: flex;
                    flex-direction: column;
                    min-width: 100px;
                }
                
                .floating-user-name {
                    font-weight: 700;
                    color: #1a1a1a;
                    font-size: 1rem;
                    line-height: 1.2;
                }
                
                
                .floating-dropdown-btn {
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(14, 175, 84, 0.08);
                    border: 1.5px solid rgba(14, 175, 84, 0.25);
                    color: #0eaf54;
                    transition: all 0.3s ease;
                    padding: 0;
                    cursor: pointer;
                }
                
                .floating-dropdown-btn:hover {
                    background: rgba(14, 175, 84, 0.15);
                    border-color: rgba(14, 175, 84, 0.4);
                    transform: rotate(90deg);
                    color: #0fa85a;
                }
                
                /* Connection Lines (Decorative) - Solid Color */
                .floating-connections {
                    position: absolute;
                    top: 50%;
                    left: 0;
                    right: 0;
                    height: 2px;
                    width: 100%;
                    z-index: 0;
                    pointer-events: none;
                    opacity: 0.2;
                }
                
                .connection-path {
                    stroke: #0eaf54;
                    stroke-dasharray: 200;
                    stroke-dashoffset: 200;
                    animation: drawPath 3s ease-in-out infinite;
                }
                
                @keyframes drawPath {
                    0% { stroke-dashoffset: 200; }
                    50% { stroke-dashoffset: 0; }
                    100% { stroke-dashoffset: -200; }
                }
                
                /* Enhanced Dropdown */
                .floating-dropdown {
                    position: relative;
                    z-index: 1050;
                }
                
                .floating-dropdown-menu {
                    position: absolute !important;
                    bottom: calc(100% + 0.35rem);
                    right: 0;
                    left: auto;
                    display: none;
                    opacity: 0;
                    transform: translateY(6px);
                    transition: opacity 0.2s ease, transform 0.2s ease;
                    pointer-events: none;
                    margin: 0 !important;
                }

                .floating-dropdown-menu.show {
                    display: block;
                    opacity: 1;
                    transform: translateY(0);
                    pointer-events: auto;
                }

                .floating-dropdown.dropup .floating-dropdown-menu {
                    bottom: calc(100% + 0.5rem);
                }

                .floating-dropdown:not(.dropup) .floating-dropdown-menu {
                    top: calc(100% + 0.5rem);
                    bottom: auto;
                }
                
                /* Mobile: Always open upward for footer placement */
                @media (max-width: 768px) {
                    .floating-dropdown.dropup .floating-dropdown-menu,
                    .footer-placement .floating-dropdown-menu {
                        bottom: calc(100% + 0.5rem) !important;
                        top: auto !important;
                        transform: translateY(6px);
                    }
                    
                    .floating-dropdown.dropup .floating-dropdown-menu.show,
                    .footer-placement .floating-dropdown-menu.show {
                        transform: translateY(0);
                    }
                }
                
                .glass-dropdown {
                    background: rgba(255, 255, 255, 0.95) !important;
                    backdrop-filter: blur(40px) saturate(180%);
                    -webkit-backdrop-filter: blur(40px) saturate(180%);
                    border: 1px solid rgba(255, 255, 255, 0.5);
                    border-radius: 16px !important;
                    box-shadow: 
                        0 20px 60px rgba(0, 0, 0, 0.15),
                        0 0 0 1px rgba(255, 255, 255, 0.1) inset;
                    padding: 0.5rem;
                    min-width: 250px;
                    max-width: calc(100vw - 2rem);
                    z-index: 9999 !important;
                    animation: dropdownSlideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    overflow: visible !important;
                    position: absolute;
                    transform-origin: top right;
                }
                
                /* Ensure dropdown items are visible */
                .glass-dropdown .dropdown-item {
                    white-space: nowrap;
                    overflow: visible;
                    text-overflow: ellipsis;
                }
                
                @media (max-width: 768px) {
                    .glass-dropdown {
                        min-width: 200px !important;
                        max-width: calc(100vw - 1rem) !important;
                        width: auto !important;
                        left: auto !important;
                        transform-origin: bottom right;
                        margin: 0 !important;
                        inset-inline-start: auto !important;
                    }
                    
                    /* Ensure footer dropdown opens upward on mobile */
                    .footer-placement .glass-dropdown,
                    .floating-dropdown.dropup .glass-dropdown {
                        bottom: auto !important;
                        top: auto !important;
                        transform-origin: bottom right;
                    }
                    
                    /* Prevent body from scrolling when dropdown is open */
                    body[style*="position: fixed"] {
                        overflow: hidden !important;
                        width: 100% !important;
                    }
                    
                    /* Force RTL alignment - dropdown should align to right */
                    .dropdown-menu-end {
                        left: auto !important;
                        inset-inline-start: auto !important;
                    }
                    
                    /* Override Bootstrap's RTL positioning */
                    [dir="rtl"] .dropdown-menu-end,
                    [dir="rtl"] .mobile-dropdown-fix {
                        left: auto !important;
                        right: auto !important;
                    }
                    
                    /* Force right alignment for mobile dropdown */
                    .mobile-dropdown-fix {
                        right: auto !important;
                        left: auto !important;
                        inset-inline-start: auto !important;
                        inset-inline-end: auto !important;
                    }
                }
                
                /* Fix for Bootstrap dropdown positioning */
                .dropdown-menu-end {
                    right: 0 !important;
                    left: auto !important;
                }
                
                @keyframes dropdownSlideIn {
                    from {
                        opacity: 0;
                        transform: translateY(-10px) scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }
                
                .glass-dropdown-header {
                    padding: 1rem;
                    background: rgba(14, 175, 84, 0.08);
                    border: 1px solid rgba(14, 175, 84, 0.15);
                    border-radius: 12px;
                    margin-bottom: 0.5rem;
                }
                
                .dropdown-avatar {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    background: #0eaf54;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-weight: 700;
                    font-size: 1rem;
                    box-shadow: 
                        0 4px 12px rgba(14, 175, 84, 0.25),
                        inset 0 1px 2px rgba(255, 255, 255, 0.3);
                }
                
                .dropdown-avatar::before {
                    content: attr(data-initials);
                }
                
                .glass-dropdown-item {
                    padding: 0.75rem 1rem;
                    border-radius: 10px;
                    transition: all 0.2s ease;
                    color: #333;
                    display: flex;
                    align-items: center;
                }
                
                .glass-dropdown-item:hover {
                    background: rgba(14, 175, 84, 0.1);
                    border-right: 3px solid #0eaf54;
                    transform: translateX(-4px);
                    color: #0eaf54;
                }
                
                .glass-dropdown-item.text-danger:hover {
                    background: rgba(255, 59, 48, 0.1);
                    border-right: 3px solid #ff3b30;
                    color: #ff3b30;
                }
                
                /* Responsive Design */
                @media (max-width: 992px) {
                    .floating-header-container {
                        padding: 1rem 1.25rem;
                        gap: 1rem;
                    }
                    
                    .floating-user-details {
                        display: none !important;
                    }
                    
                    .floating-logo-card {
                        padding: 0.75rem 1rem;
                        flex: 1;
                    }
                    
                    .floating-user-card {
                        padding: 0.6rem 0.75rem;
                    }
                    
                    .floating-logo-wrapper {
                        gap: 0.75rem;
                    }
                    
                    .logo-orb {
                        width: 50px;
                        height: 50px;
                    }
                    
                    .floating-logo-img {
                        width: 32px;
                        height: 32px;
                    }
                    
                    .floating-brand-title {
                        font-size: 1.4rem;
                    }
                    
                    .floating-avatar {
                        width: 45px;
                        height: 45px;
                        font-size: 1.1rem;
                    }
                }
                
                @media (max-width: 768px) {
                    .floating-header-container {
                        flex-direction: row;
                        justify-content: space-between;
                        align-items: center;
                        padding: 0.75rem 1rem;
                        gap: 0.75rem;
                        margin-bottom: 1.5rem;
                    }
                    
                    .floating-logo-card {
                        padding: 0.6rem 0.75rem;
                        flex: 0 0 auto;
                    }
                    
                    .floating-user-card {
                        padding: 0.5rem 0.75rem;
                        flex: 0 0 auto;
                    }
                    
                    .floating-logo-wrapper {
                        gap: 0.5rem;
                    }
                    
                    .floating-brand-text {
                        margin-right: 0;
                    }
                    
                    .logo-orb {
                        width: 45px;
                        height: 45px;
                    }
                    
                    .floating-logo-img {
                        width: 28px;
                        height: 28px;
                    }
                    
                    .floating-brand-title {
                        font-size: 1.2rem;
                    }
                    
                    .floating-brand-subtitle {
                        display: none !important;
                    }
                    
                    .floating-avatar {
                        width: 40px;
                        height: 40px;
                        font-size: 1rem;
                    }
                    
                    .floating-dropdown-btn {
                        width: 32px;
                        height: 32px;
                    }
                    
                    .floating-connections {
                        display: none;
                    }
                }
                
                @media (max-width: 576px) {
                    .floating-header-container {
                        padding: 0.6rem 0.75rem;
                        gap: 0.5rem;
                    }
                    
                    .floating-logo-card {
                        padding: 0.5rem 0.6rem;
                    }
                    
                    .floating-user-card {
                        padding: 0.4rem 0.6rem;
                    }
                    
                    .floating-logo-wrapper {
                        gap: 0.4rem;
                    }
                    
                    .logo-orb {
                        width: 40px;
                        height: 40px;
                    }
                    
                    .floating-logo-img {
                        width: 24px;
                        height: 24px;
                    }
                    
                    .floating-brand-title {
                        font-size: 1rem;
                    }
                    
                    .floating-avatar {
                        width: 36px;
                        height: 36px;
                        font-size: 0.9rem;
                    }
                    
                    .floating-dropdown-btn {
                        width: 28px;
                        height: 28px;
                        font-size: 0.75rem;
                    }
                    
                    .floating-status-dot {
                        width: 10px;
                        height: 10px;
                        border-width: 2px;
                    }
                }
                
                @media (max-width: 400px) {
                    .floating-brand-title {
                        font-size: 0.9rem;
                    }
                    
                    .logo-orb {
                        width: 36px;
                        height: 36px;
                    }
                    
                    .floating-logo-img {
                        width: 20px;
                        height: 20px;
                    }
                    
                    .floating-avatar {
                        width: 32px;
                        height: 32px;
                        font-size: 0.85rem;
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
                    window.location.href = '/';
                }
            });
        }
        
        // Setup profile button (placeholder)
        const profileBtn = document.getElementById('clientProfileBtn');
        if (profileBtn) {
            profileBtn.addEventListener('click', (e) => {
                e.preventDefault();
                // TODO: Navigate to profile page
                console.log('Profile button clicked');
            });
        }
        
        // Setup settings button (placeholder)
        const settingsBtn = document.getElementById('clientSettingsBtn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', (e) => {
                e.preventDefault();
                // TODO: Navigate to settings page
                console.log('Settings button clicked');
            });
        }
        
        // Popup dropdown that opens upward from the floating icon
        const dropdownToggle = document.getElementById('userDropdown');
        const dropdownMenu = document.querySelector('.floating-dropdown-menu');
        const dropdownWrapper = document.querySelector('.floating-dropdown');

        if (dropdownToggle && dropdownMenu && dropdownWrapper) {
            const toggleDropdown = (forceState) => {
                const isOpen = dropdownMenu.classList.contains('show');
                const nextState = typeof forceState === 'boolean' ? forceState : !isOpen;
                dropdownMenu.classList.toggle('show', nextState);
                dropdownToggle.setAttribute('aria-expanded', nextState ? 'true' : 'false');
            };

            const handleDocumentClick = (event) => {
                if (dropdownWrapper && !dropdownWrapper.contains(event.target)) {
                    toggleDropdown(false);
                }
            };

            dropdownToggle.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                toggleDropdown();
            });

            document.addEventListener('click', handleDocumentClick);
            document.addEventListener('keydown', (event) => {
                if (event.key === 'Escape') {
                    toggleDropdown(false);
                }
            });
        }
    }
    
    generateHeaderHTML() {
        // Get client info from storage
        let clientName = this.options.clientName;
        let firstName = clientName;
        let clientEmail = '';
        let clientPhone = '';
        
        try {
            const clientInfo = JSON.parse(localStorage.getItem('clientInfo') || sessionStorage.getItem('clientInfo') || '{}');
            if (clientInfo && clientInfo.name) {
                clientName = clientInfo.name;
                // Extract first name (first word before any spaces)
                const nameParts = clientName.trim().split(' ');
                firstName = nameParts[0];
                clientEmail = clientInfo.email || '';
                clientPhone = clientInfo.phone || '';
            }
        } catch (e) {
            console.error('Error parsing client info:', e);
        }
        
        // Get initials for avatar
        const initials = firstName.length > 0 ? firstName.charAt(0).toUpperCase() : 'U';
        
        const placementClass = this.options.placement === 'footer' ? ' footer-placement' : '';
        const dropdownDirectionClass = this.options.placement === 'footer' ? ' dropup' : '';
        let html = `
        <!-- Floating Header Design - No Solid Bar -->
        <div class="floating-header-container${placementClass}">
            <!-- Floating Logo Card -->
            <div class="floating-logo-card glass-card-float">
                <a class="floating-brand-link" href="client-dashboard.html">
                    <div class="floating-logo-wrapper">
                        <img src="assets/images/cropped-Logo-mark.png.png" alt="Laapak" class="floating-logo-img">
                        <div class="floating-brand-text">
                            <h3 class="floating-brand-title">Laapak</h3>
                            <span class="floating-brand-subtitle d-none d-md-inline">نظام التقارير</span>
                        </div>
                    </div>
                </a>
            </div>
            
            <!-- Floating User Card -->
            <div class="floating-user-card glass-card-float">
                <div class="floating-user-content">
                    
                    <div class="floating-user-details d-none d-lg-block">
                        <div class="floating-user-name">${firstName}</div>
                    </div>
                    <div class="dropdown floating-dropdown${dropdownDirectionClass}">
                        <button class="floating-dropdown-btn" type="button" id="userDropdown" aria-haspopup="true" aria-expanded="false">
                            <i class="fas fa-ellipsis-v"></i>
                        </button>
                        <ul class="dropdown-menu dropdown-menu-end glass-dropdown floating-dropdown-menu mobile-dropdown-fix" aria-labelledby="userDropdown">
                            <li class="dropdown-header glass-dropdown-header">
                                <div class="d-flex align-items-center">
                                    <div class="dropdown-avatar" data-initials="${initials}"></div>
                                    <div class="ms-2">
                                        <div class="fw-bold">${clientName}</div>
                                        ${clientEmail ? `<div class="text-muted small">${clientEmail}</div>` : ''}
                                    </div>
                                </div>
                            </li>
                            <li><hr class="dropdown-divider"></li>
                            <li>
                                <a class="dropdown-item glass-dropdown-item" href="#" id="clientProfileBtn">
                                    <i class="fas fa-user me-2"></i>
                                    <span>الملف الشخصي</span>
                                </a>
                            </li>
                            <li>
                                <a class="dropdown-item glass-dropdown-item" href="#" id="clientSettingsBtn">
                                    <i class="fas fa-cog me-2"></i>
                                    <span>الإعدادات</span>
                                </a>
                            </li>
                            <li><hr class="dropdown-divider"></li>
                            <li>
                                <a class="dropdown-item glass-dropdown-item text-danger" href="#" id="clientLogoutBtn">
                                    <i class="fas fa-sign-out-alt me-2"></i>
                                    <span>تسجيل الخروج</span>
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
            
            <!-- Floating Connection Lines (Decorative) - Solid Color -->
            <svg class="floating-connections" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path class="connection-path" d="M 20 50 Q 50 30, 80 50" stroke-width="2" fill="none"/>
            </svg>
        </div>`;
        
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
    
    // Initialize header or footer placement based on DOM
    const headerContainer = document.getElementById('client-header-container');
    const footerContainer = document.getElementById('client-footer-container');
    let initializationTarget = null;
    let placement = 'header';

    if (headerContainer) {
        initializationTarget = 'client-header-container';
        placement = 'header';
    } else if (footerContainer) {
        initializationTarget = 'client-footer-container';
        placement = 'footer';
    }

    if (initializationTarget) {
        new LpkClientHeader({
            clientName: clientName,
            placement,
            containerId: initializationTarget
        });
        console.log(`🎯 Client Header Component initialized successfully! Placement: ${placement}`);
        console.log('👤 Client name:', clientName);
    }
});
