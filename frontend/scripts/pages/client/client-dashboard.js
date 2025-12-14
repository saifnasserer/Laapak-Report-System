/**
 * Laapak Report System - Client Dashboard JavaScript
 * Main entry point - Uses new modular Dashboard architecture
 * 
 * Architecture:
 * - DashboardStateManager: Centralized state management
 * - EventBus: Decoupled event system
 * - DataManager: API calls, caching, filtering
 * - NotificationManager: Notification queue system
 * - UI Components: QuickStats, SearchAndFilter, etc.
 * - Dashboard: Main orchestrator class
 */

// Global dashboard instance
let dashboardInstance = null;

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Check if new modular architecture is available
        if (typeof Dashboard !== 'undefined') {
            // Use new modular architecture
            dashboardInstance = new Dashboard();
            await dashboardInstance.init();
        } else {
            // Fallback to legacy initialization
            console.warn('New Dashboard class not found, using legacy initialization');
            initializeLegacyDashboard();
        }
    } catch (error) {
        console.error('Error initializing dashboard:', error);
        // Fallback to legacy
        initializeLegacyDashboard();
    }
});

/**
 * Legacy dashboard initialization (fallback)
 * @private
 */
function initializeLegacyDashboard() {
    // Check if client is logged in using auth-middleware
    if (!authMiddleware.isClientLoggedIn()) {
        console.log('Client not logged in, redirecting to login page');
        window.location.href = 'index.html';
        return;
    }
    
    // Get client info from storage
    const clientInfo = JSON.parse(localStorage.getItem('clientInfo') || sessionStorage.getItem('clientInfo') || '{}');
    
    // Display client information
    const clientNameEl = document.getElementById('clientName');
    const welcomeClientNameEl = document.getElementById('welcomeClientName');
    
    if (clientNameEl && clientInfo.name) {
        clientNameEl.textContent = clientInfo.name;
    }
    
    if (welcomeClientNameEl && clientInfo.name) {
        welcomeClientNameEl.textContent = clientInfo.name;
    }
    
    // Initialize enhanced features (if functions exist)
    if (typeof initializeQuickStats === 'function') initializeQuickStats();
    if (typeof initializeSearchAndFilter === 'function') initializeSearchAndFilter();
    if (typeof initializePullToRefresh === 'function') initializePullToRefresh();
    if (typeof initializeTabBadges === 'function') initializeTabBadges();
    if (typeof initializeSortOptions === 'function') initializeSortOptions();
    
    // Load client data
    if (typeof loadClientReports === 'function') {
        loadClientReports();
    }
    
    // Restore last active tab
    if (typeof restoreLastActiveTab === 'function') {
        restoreLastActiveTab();
    }
}

/**
 * Get client info from storage
 */
function getClientInfo() {
    // First check sessionStorage
    let clientInfo = sessionStorage.getItem('clientInfo');
    
    // If not in sessionStorage, check localStorage
    if (!clientInfo) {
        clientInfo = localStorage.getItem('clientInfo');
    }
    
    // If found, parse and return
    if (clientInfo) {
        return JSON.parse(clientInfo);
    }
    
    return null;
}

/**
 * Log out the client
 */
function logout() {
    sessionStorage.removeItem('clientInfo');
    localStorage.removeItem('clientInfo');
}

/**
 * Show glass-style loading indicator
 */
function showLoading(show, message = 'جاري تحميل البيانات...') {
    let loadingOverlay = document.getElementById('glassLoadingOverlay');
    
    if (show) {
        if (!loadingOverlay) {
            // Create glass loading overlay
            loadingOverlay = document.createElement('div');
            loadingOverlay.id = 'glassLoadingOverlay';
            loadingOverlay.className = 'glass-loading-overlay';
            loadingOverlay.innerHTML = `
                <div class="glass-spinner" role="status" aria-label="Loading"></div>
                <p class="glass-loading-text">${message}</p>
            `;
            document.body.appendChild(loadingOverlay);
        } else {
            // Update message if overlay exists
            const textEl = loadingOverlay.querySelector('.glass-loading-text');
            if (textEl) {
                textEl.textContent = message;
            }
            loadingOverlay.classList.remove('hide');
        }
    } else if (loadingOverlay) {
        // Hide with animation
        loadingOverlay.classList.add('hide');
        setTimeout(() => {
            if (loadingOverlay && loadingOverlay.parentNode) {
                loadingOverlay.remove();
            }
        }, 300);
    }
}

/**
 * Show glass-style notification (error, success, warning)
 */
function showErrorMessage(message, type = 'error', duration = 5000) {
    showGlassNotification(message, type, duration);
}

/**
 * Show glass-style notification with queue support
 */
function showGlassNotification(message, type = 'error', duration = 5000) {
    const notificationId = 'notification-' + Date.now();
    
    // Add to queue
    window.notificationQueue.push({
        id: notificationId,
        message,
        type,
        duration
    });
    
    // Show notifications from queue
    showNextNotification();
}

/**
 * Show next notification from queue
 */
function showNextNotification() {
    // Remove old notifications that are hidden
    document.querySelectorAll('.glass-notification.hide').forEach(n => {
        setTimeout(() => n.remove(), 300);
    });
    
    // Count visible notifications
    const visibleNotifications = document.querySelectorAll('.glass-notification:not(.hide)').length;
    
    // Show next notification if we have space
    if (window.notificationQueue.length > 0 && visibleNotifications < window.maxNotifications) {
        const notificationData = window.notificationQueue.shift();
        createNotificationElement(notificationData);
    }
}

/**
 * Create and display notification element
 */
function createNotificationElement({ id, message, type, duration }) {
    const notification = document.createElement('div');
    notification.id = id;
    notification.className = `glass-notification ${type}`;
    notification.setAttribute('role', 'alert');
    notification.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');
    
    // Calculate top position based on existing notifications
    const existingNotifications = document.querySelectorAll('.glass-notification:not(.hide)');
    const topOffset = 2 + (existingNotifications.length * 5.5); // 2rem base + 5.5rem per notification
    
    notification.style.top = `${topOffset}rem`;
    
    // Determine icon based on type
    let iconClass = 'fas fa-exclamation-circle';
    if (type === 'success') {
        iconClass = 'fas fa-check-circle';
    } else if (type === 'warning') {
        iconClass = 'fas fa-exclamation-triangle';
    }
    
    notification.innerHTML = `
        <i class="${iconClass} glass-notification-icon"></i>
        <div class="glass-notification-content">${message}</div>
        <button class="glass-notification-close" aria-label="إغلاق" type="button">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    document.body.appendChild(notification);
    
    // Close button handler
    const closeBtn = notification.querySelector('.glass-notification-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            notification.classList.add('hide');
            setTimeout(() => {
                notification.remove();
                showNextNotification(); // Show next in queue
            }, 300);
        });
    }
    
    // Auto-dismiss
    if (duration > 0) {
        setTimeout(() => {
            if (notification.parentNode) {
                notification.classList.add('hide');
                setTimeout(() => {
                    notification.remove();
                    showNextNotification(); // Show next in queue
                }, 300);
            }
        }, duration);
    }
}

/**
 * Load cached reports from localStorage when offline
 */
function loadCachedReports() {
    try {
        const cachedReports = JSON.parse(localStorage.getItem('cached_client_reports') || '[]');
        const cachedInvoices = JSON.parse(localStorage.getItem('cached_client_invoices') || '[]');
        
        if (cachedReports.length > 0) {
            console.log('Loaded cached reports:', cachedReports.length);
            displayReportsAndInvoices(cachedReports, cachedInvoices);
        } else {
            // If no cached data, use mock data as last resort
            const clientInfo = JSON.parse(localStorage.getItem('clientInfo') || '{}');
            displayReportsAndInvoices(getMockReports(clientInfo.id), getMockInvoices(clientInfo.id));
        }
    } catch (error) {
        console.error('Error loading cached reports:', error);
        // Fall back to mock data
        const clientInfo = JSON.parse(localStorage.getItem('clientInfo') || '{}');
        displayReportsAndInvoices(getMockReports(clientInfo.id), getMockInvoices(clientInfo.id));
    }
}

/**
 * Cache reports for offline use
 */
function cacheReportsForOffline(reports, invoices) {
    try {
        localStorage.setItem('cached_client_reports', JSON.stringify(reports));
        localStorage.setItem('cached_client_invoices', JSON.stringify(invoices));
        console.log('Reports cached for offline use');
    } catch (error) {
        console.error('Error caching reports:', error);
    }
}

/**
 * Display reports and invoices in the UI with animations
 * This function is called by the Dashboard class via eventBus
 */
function displayReportsAndInvoices(reportsArray, invoicesArray) {
    // Remove any skeleton loaders first
    const skeletonLoaders = document.querySelectorAll('.skeleton-card');
    skeletonLoaders.forEach(skeleton => {
        skeleton.style.opacity = '0';
        skeleton.style.transform = 'translateY(-20px)';
        setTimeout(() => skeleton.remove(), 300);
    });
    
    // Check if we're filtering - use state manager if available
    let isFiltered = false;
    if (window.dashboardStateManager) {
        const state = window.dashboardStateManager.getState();
        isFiltered = state.searchTerm && state.searchTerm.trim() !== '';
    } else if (window.dashboardState) {
        isFiltered = window.dashboardState.searchTerm && window.dashboardState.searchTerm.trim() !== '';
    }
    
    // Call functions from client-display.js (which should now be globally available)
    if (typeof displayReports === 'function') {
        if (reportsArray.length === 0) {
            if (typeof showEnhancedEmptyState === 'function') {
                showEnhancedEmptyState('reportsList', 'reports', isFiltered);
            }
        } else {
            displayReports(reportsArray);
            // Trigger card animations
            setTimeout(() => {
                const cards = document.querySelectorAll('.report-card, .card');
                cards.forEach((card, index) => {
                    card.style.animationDelay = `${index * 0.1}s`;
                });
            }, 100);
        }
    } else {
        console.error('displayReports function is not defined. Check script loading order.');
        if (window.eventBus) {
            window.eventBus.emit('notification:show', {
                message: 'خطأ في عرض محتوى التقارير.',
                type: 'error'
            });
        } else if (typeof showErrorMessage === 'function') {
            showErrorMessage('خطأ في عرض محتوى التقارير.');
        }
    }

    // Call function from client-warranty.js to populate warranty tab
    if (typeof displayWarrantyInfo === 'function') {
        displayWarrantyInfo(reportsArray);
    } else {
        console.error('displayWarrantyInfo function is not defined. Check script loading order.');
    }

    // Call function from client-maintenance.js to populate maintenance tab
    if (typeof displayMaintenanceSchedule === 'function') {
        displayMaintenanceSchedule(reportsArray);
    } else {
        console.error('displayMaintenanceSchedule function is not defined. Check script loading order.');
    }

    if (typeof displayInvoices === 'function') {
        if (invoicesArray.length === 0) {
            if (typeof showEnhancedEmptyState === 'function') {
                showEnhancedEmptyState('invoicesList', 'invoices', isFiltered);
            }
        } else {
            displayInvoices(invoicesArray);
            // Trigger invoice card animations
            setTimeout(() => {
                const invoiceCards = document.querySelectorAll('#invoicesList .card');
                invoiceCards.forEach((card, index) => {
                    card.style.animationDelay = `${index * 0.1}s`;
                });
            }, 100);
        }
    } else {
        console.error('displayInvoices function is not defined. Check script loading order.');
    }
}

/**
 * Show enhanced empty state
 */
function showEnhancedEmptyState(containerId, type, isFiltered = false) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const emptyStates = {
        reports: {
            icon: 'fa-laptop-medical',
            title: isFiltered ? 'لا توجد نتائج للبحث' : 'لا توجد تقارير صيانة حالياً',
            message: isFiltered 
                ? 'لم نتمكن من العثور على تقارير تطابق بحثك. جرب كلمات مفتاحية أخرى.'
                : 'لم يتم إنشاء أي تقارير صيانة بعد. سيتم عرض التقارير هنا عند توفرها.',
            animation: 'bounce'
        },
        invoices: {
            icon: 'fa-file-invoice-dollar',
            title: isFiltered ? 'لا توجد نتائج للبحث' : 'لا توجد فواتير حالياً',
            message: isFiltered
                ? 'لم نتمكن من العثور على فواتير تطابق بحثك. جرب كلمات مفتاحية أخرى.'
                : 'لم يتم إنشاء أي فواتير بعد. سيتم عرض الفواتير هنا عند توفرها.',
            animation: 'pulse'
        }
    };
    
    const state = emptyStates[type] || emptyStates.reports;
    
    container.innerHTML = `
        <div class="col-12">
            <div class="enhanced-empty-state">
                <div class="empty-state-icon-wrapper">
                    <i class="fas ${state.icon} empty-state-icon ${state.animation}"></i>
                    <div class="empty-state-ripple"></div>
                </div>
                <h4 class="empty-state-title">${state.title}</h4>
                <p class="empty-state-message">${state.message}</p>
                ${isFiltered ? `
                    <button class="btn btn-outline-primary mt-3" onclick="clearSearch()">
                        <i class="fas fa-times me-2"></i> مسح البحث
                    </button>
                ` : ''}
            </div>
        </div>
    `;
    
    // Add CSS if not already added
    if (!document.getElementById('enhancedEmptyStateStyles')) {
        const style = document.createElement('style');
        style.id = 'enhancedEmptyStateStyles';
        style.textContent = `
            .enhanced-empty-state {
                text-align: center;
                padding: 4rem 2rem;
                background: var(--glass-bg-primary, rgba(255, 255, 255, 0.7));
                backdrop-filter: blur(40px) saturate(180%);
                -webkit-backdrop-filter: blur(40px) saturate(180%);
                border-radius: 24px;
                border: 1px solid rgba(255, 255, 255, 0.5);
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
                position: relative;
                overflow: hidden;
            }
            .enhanced-empty-state::before {
                content: '';
                position: absolute;
                top: -50%;
                left: -50%;
                width: 200%;
                height: 200%;
                background: radial-gradient(circle, rgba(14, 175, 84, 0.05) 0%, transparent 70%);
                animation: rotate 20s linear infinite;
            }
            .empty-state-icon-wrapper {
                position: relative;
                display: inline-block;
                margin-bottom: 2rem;
            }
            .empty-state-icon {
                font-size: 5rem;
                color: var(--laapak-medium-green, #0eaf54);
                position: relative;
                z-index: 2;
                opacity: 0.8;
            }
            .empty-state-ripple {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 100px;
                height: 100px;
                border: 3px solid var(--laapak-medium-green, #0eaf54);
                border-radius: 50%;
                opacity: 0.3;
                animation: ripple 2s ease-out infinite;
            }
            .empty-state-ripple::before {
                content: '';
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 100px;
                height: 100px;
                border: 3px solid var(--laapak-medium-green, #0eaf54);
                border-radius: 50%;
                opacity: 0.2;
                animation: ripple 2s ease-out infinite 0.5s;
            }
            .empty-state-title {
                color: var(--text-primary, rgba(0, 0, 0, 0.9));
                font-weight: 600;
                margin-bottom: 1rem;
                position: relative;
                z-index: 1;
            }
            .empty-state-message {
                color: var(--text-secondary, rgba(0, 0, 0, 0.7));
                font-size: 1rem;
                line-height: 1.6;
                max-width: 500px;
                margin: 0 auto;
                position: relative;
                z-index: 1;
            }
            @keyframes bounce {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-20px); }
            }
            @keyframes pulse {
                0%, 100% { transform: scale(1); opacity: 0.8; }
                50% { transform: scale(1.1); opacity: 1; }
            }
            @keyframes ripple {
                0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.3; }
                100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
}

/**
 * Clear search function
 */
function clearSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchClear = document.getElementById('searchClear');
    
    if (searchInput) {
        searchInput.value = '';
        window.dashboardState.searchTerm = '';
        filterAndDisplayData();
    }
    
    if (searchClear) {
        searchClear.classList.add('d-none');
    }
}

/**
 * Show skeleton loaders while data is loading
 */
function showSkeletonLoaders(containerId, count = 3) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // Clear existing content
    container.innerHTML = '';
    
    // Create skeleton cards
    for (let i = 0; i < count; i++) {
        const skeletonCard = document.createElement('div');
        skeletonCard.className = 'skeleton-card';
        skeletonCard.innerHTML = `
            <div class="skeleton-line long"></div>
            <div class="skeleton-line medium"></div>
            <div class="skeleton-line short"></div>
            <div class="skeleton-line medium" style="margin-top: 1rem;"></div>
        `;
        container.appendChild(skeletonCard);
    }
}

/**
 * Initialize Quick Stats Dashboard
 */
function initializeQuickStats() {
    const welcomeCard = document.querySelector('.container .row:first-of-type .card');
    if (!welcomeCard) return;
    
    const statsHTML = `
        <div class="row g-3 mb-4" id="quickStatsContainer">
            <div class="col-md-3 col-sm-6">
                <div class="stat-card glass-card" data-stat="reports">
                    <div class="stat-icon">
                        <i class="fas fa-laptop-medical"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-value" id="statReports">0</div>
                        <div class="stat-label">تقرير الفحص</div>
                    </div>
                    <div class="stat-wave"></div>
                </div>
            </div>
            <div class="col-md-3 col-sm-6">
                <div class="stat-card glass-card" data-stat="warranty">
                    <div class="stat-icon">
                        <i class="fas fa-shield-alt"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-value" id="statWarranty">0</div>
                        <div class="stat-label">ضمانات نشطة</div>
                    </div>
                    <div class="stat-wave"></div>
                </div>
            </div>
            <div class="col-md-3 col-sm-6">
                <div class="stat-card glass-card" data-stat="maintenance">
                    <div class="stat-icon">
                        <i class="fas fa-tools"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-value" id="statMaintenance">0</div>
                        <div class="stat-label">صيانة قادمة</div>
                    </div>
                    <div class="stat-wave"></div>
                </div>
            </div>
            <div class="col-md-3 col-sm-6">
                <div class="stat-card glass-card" data-stat="invoices">
                    <div class="stat-icon">
                        <i class="fas fa-dollar-sign"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-value" id="statInvoices">0</div>
                        <div class="stat-label">إجمالي الفواتير</div>
                    </div>
                    <div class="stat-wave"></div>
                </div>
            </div>
        </div>
    `;
    
    welcomeCard.insertAdjacentHTML('afterend', statsHTML);
    
    // Add CSS for stats cards
    if (!document.getElementById('statsCardStyles')) {
        const style = document.createElement('style');
        style.id = 'statsCardStyles';
        style.textContent = `
            .stat-card {
                background: rgba(255, 255, 255, 0.15);
                backdrop-filter: blur(30px) saturate(180%);
                -webkit-backdrop-filter: blur(30px) saturate(180%);
                border: 1px solid rgba(255, 255, 255, 0.3);
                border-radius: 24px;
                padding: 1.5rem;
                position: relative;
                overflow: hidden;
                transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                cursor: pointer;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.06);
            }
            .stat-card:hover {
                transform: translateY(-8px) scale(1.02);
                background: rgba(255, 255, 255, 0.25);
                border-color: rgba(255, 255, 255, 0.5);
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
            }
            .stat-card .stat-icon {
                font-size: 2.5rem;
                color: var(--laapak-medium-green, #0eaf54);
                margin-bottom: 1rem;
                animation: float 3s ease-in-out infinite;
            }
            .stat-card .stat-value {
                font-size: 2rem;
                font-weight: 700;
                color: var(--text-primary, rgba(0, 0, 0, 0.9));
                line-height: 1.2;
                margin-bottom: 0.5rem;
            }
            .stat-card .stat-label {
                font-size: 0.875rem;
                color: var(--text-secondary, rgba(0, 0, 0, 0.7));
                font-weight: 500;
            }
            .stat-card .stat-wave {
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                height: 4px;
                background: #0eaf54;
                transform: scaleX(0);
                transform-origin: left;
                transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
            }
            .stat-card:hover .stat-wave {
                transform: scaleX(1);
            }
            @keyframes float {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-10px); }
            }
            @keyframes countUp {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }
            .stat-value.animating {
                animation: countUp 0.6s cubic-bezier(0.4, 0, 0.2, 1);
            }
        `;
        document.head.appendChild(style);
    }
}

/**
 * Update Quick Stats
 */
function updateQuickStats(reports, invoices) {
    const activeWarranties = calculateActiveWarranties(reports);
    const upcomingMaintenance = calculateUpcomingMaintenance(reports);
    
    animateValue('statReports', reports.length);
    animateValue('statWarranty', activeWarranties);
    animateValue('statMaintenance', upcomingMaintenance);
    animateValue('statInvoices', invoices.length);
}

/**
 * Animate value counting up
 */
function animateValue(elementId, targetValue) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const currentValue = parseInt(element.textContent) || 0;
    const duration = 1000;
    const steps = 30;
    const increment = (targetValue - currentValue) / steps;
    let current = currentValue;
    let step = 0;
    
    element.classList.add('animating');
    
    const timer = setInterval(() => {
        step++;
        current += increment;
        if (step >= steps) {
            element.textContent = targetValue;
            clearInterval(timer);
            setTimeout(() => element.classList.remove('animating'), 300);
        } else {
            element.textContent = Math.round(current);
        }
    }, duration / steps);
}

/**
 * Calculate active warranties
 */
function calculateActiveWarranties(reports) {
    const now = new Date();
    return reports.filter(report => {
        const reportDate = new Date(report.inspection_date || report.created_at);
        const warrantyEnd = new Date(reportDate);
        warrantyEnd.setMonth(warrantyEnd.getMonth() + 6);
        return warrantyEnd > now;
    }).length;
}

/**
 * Calculate upcoming maintenance
 */
function calculateUpcomingMaintenance(reports) {
    const now = new Date();
    const nextMonth = new Date(now);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    
    return reports.filter(report => {
        const reportDate = new Date(report.inspection_date || report.created_at);
        const nextMaintenance = new Date(reportDate);
        nextMaintenance.setMonth(nextMaintenance.getMonth() + 6);
        return nextMaintenance >= now && nextMaintenance <= nextMonth;
    }).length;
}

/**
 * Initialize Search and Filter
 */
function initializeSearchAndFilter() {
    const welcomeCard = document.querySelector('.container .row:first-of-type');
    if (!welcomeCard) return;
    
    const searchHTML = `
        <div class="row mb-4" id="searchFilterContainer">
            <div class="col-12">
                <div class="glass-card p-3">
                    <div class="row g-3 align-items-center">
                        <div class="col-md-6">
                            <div class="search-box position-relative">
                                <i class="fas fa-search search-icon"></i>
                                <input type="text" 
                                       id="searchInput" 
                                       class="form-control search-input" 
                                       placeholder="ابحث في التقارير والفواتير...">
                                <button class="btn btn-link search-clear d-none" id="searchClear">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <select id="sortSelect" class="form-select">
                                <option value="date-desc">الأحدث أولاً</option>
                                <option value="date-asc">الأقدم أولاً</option>
                                <option value="status">حسب الحالة</option>
                            </select>
                        </div>
                        <div class="col-md-3 text-end">
                            <div class="last-updated-text">
                                <small class="text-muted">
                                    <i class="fas fa-clock me-1"></i>
                                    <span id="lastUpdatedText">لم يتم التحديث بعد</span>
                                </small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    const statsContainer = document.getElementById('quickStatsContainer');
    if (statsContainer) {
        statsContainer.insertAdjacentHTML('afterend', searchHTML);
    } else {
        welcomeCard.insertAdjacentHTML('afterend', searchHTML);
    }
    
    // Add CSS for search
    if (!document.getElementById('searchStyles')) {
        const style = document.createElement('style');
        style.id = 'searchStyles';
        style.textContent = `
            .glass-card {
                background: rgba(255, 255, 255, 0.15);
                backdrop-filter: blur(30px) saturate(180%);
                -webkit-backdrop-filter: blur(30px) saturate(180%);
                border: 1px solid rgba(255, 255, 255, 0.3);
                border-radius: 24px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.06);
            }
            .search-box {
                position: relative;
            }
            .search-icon {
                position: absolute;
                right: 1rem;
                top: 50%;
                transform: translateY(-50%);
                color: var(--text-tertiary, rgba(0, 0, 0, 0.5));
                z-index: 2;
            }
            .search-input {
                padding-right: 3rem;
                padding-left: 1rem;
                border: 1px solid rgba(255, 255, 255, 0.3);
                background: rgba(255, 255, 255, 0.15);
                backdrop-filter: blur(30px) saturate(180%);
                -webkit-backdrop-filter: blur(30px) saturate(180%);
                border-radius: 16px;
                transition: all 0.3s ease;
            }
            .search-input:focus {
                background: rgba(255, 255, 255, 0.25);
                border-color: rgba(14, 175, 84, 0.5);
                box-shadow: 0 0 0 3px rgba(14, 175, 84, 0.1);
            }
            .search-clear {
                position: absolute;
                left: 0.5rem;
                top: 50%;
                transform: translateY(-50%);
                padding: 0.25rem;
                color: var(--text-tertiary, rgba(0, 0, 0, 0.5));
                z-index: 2;
            }
            .search-clear:hover {
                color: var(--text-primary, rgba(0, 0, 0, 0.9));
            }
        `;
        document.head.appendChild(style);
    }
    
    // Event listeners
    const searchInput = document.getElementById('searchInput');
    const searchClear = document.getElementById('searchClear');
    const sortSelect = document.getElementById('sortSelect');
    
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                window.dashboardState.searchTerm = e.target.value;
                filterAndDisplayData();
                if (e.target.value) {
                    searchClear?.classList.remove('d-none');
                } else {
                    searchClear?.classList.add('d-none');
                }
            }, 300);
        });
    }
    
    if (searchClear) {
        searchClear.addEventListener('click', () => {
            if (searchInput) {
                searchInput.value = '';
                window.dashboardState.searchTerm = '';
                filterAndDisplayData();
                searchClear.classList.add('d-none');
            }
        });
    }
    
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            const [sortBy, sortOrder] = e.target.value.split('-');
            window.dashboardState.sortBy = sortBy;
            window.dashboardState.sortOrder = sortOrder;
            filterAndDisplayData();
        });
    }
}

/**
 * Filter and display data based on search and sort
 */
function filterAndDisplayData() {
    let filteredReports = [...window.dashboardState.reports];
    let filteredInvoices = [...window.dashboardState.invoices];
    
    // Apply search filter
    if (window.dashboardState.searchTerm) {
        const searchLower = window.dashboardState.searchTerm.toLowerCase();
        filteredReports = filteredReports.filter(report => {
            const deviceModel = (report.device_model || '').toLowerCase();
            const serialNumber = (report.serial_number || '').toLowerCase();
            const status = (report.status || '').toLowerCase();
            const notes = (report.notes || '').toLowerCase();
            return deviceModel.includes(searchLower) ||
                   serialNumber.includes(searchLower) ||
                   status.includes(searchLower) ||
                   notes.includes(searchLower);
        });
        
        filteredInvoices = filteredInvoices.filter(invoice => {
            const invoiceId = (invoice.id || '').toLowerCase();
            const paymentMethod = (invoice.paymentMethod || '').toLowerCase();
            return invoiceId.includes(searchLower) ||
                   paymentMethod.includes(searchLower);
        });
    }
    
    // Apply sorting
    if (window.dashboardState.sortBy === 'date') {
        filteredReports.sort((a, b) => {
            const dateA = new Date(a.inspection_date || a.created_at);
            const dateB = new Date(b.inspection_date || b.created_at);
            return window.dashboardState.sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
        });
        
        filteredInvoices.sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return window.dashboardState.sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
        });
    }
    
    window.dashboardState.filteredReports = filteredReports;
    window.dashboardState.filteredInvoices = filteredInvoices;
    
    // Display filtered data
    displayReportsAndInvoices(filteredReports, filteredInvoices);
}

/**
 * Initialize Pull-to-Refresh
 */
function initializePullToRefresh() {
    let touchStartY = 0;
    let touchEndY = 0;
    let isPulling = false;
    let pullDistance = 0;
    
    const pullIndicator = document.createElement('div');
    pullIndicator.id = 'pullToRefreshIndicator';
    pullIndicator.className = 'pull-to-refresh-indicator';
    pullIndicator.innerHTML = '<i class="fas fa-sync-alt"></i><span>اسحب للتحديث</span>';
    document.body.appendChild(pullIndicator);
    
    // Add CSS
    if (!document.getElementById('pullToRefreshStyles')) {
        const style = document.createElement('style');
        style.id = 'pullToRefreshStyles';
        style.textContent = `
            .pull-to-refresh-indicator {
                position: fixed;
                top: -60px;
                left: 50%;
                transform: translateX(-50%);
                background: var(--glass-bg-elevated, rgba(255, 255, 255, 0.9));
                backdrop-filter: blur(20px);
                padding: 0.75rem 1.5rem;
                border-radius: 0 0 16px 16px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                z-index: 10000;
                display: flex;
                align-items: center;
                gap: 0.5rem;
                color: var(--laapak-medium-green, #0eaf54);
                font-weight: 500;
                transition: top 0.3s ease;
            }
            .pull-to-refresh-indicator.active {
                top: 0;
            }
            .pull-to-refresh-indicator.refreshing i {
                animation: spin 1s linear infinite;
            }
        `;
        document.head.appendChild(style);
    }
    
    document.addEventListener('touchstart', (e) => {
        if (window.scrollY === 0) {
            touchStartY = e.touches[0].clientY;
            isPulling = true;
        }
    });
    
    document.addEventListener('touchmove', (e) => {
        if (!isPulling) return;
        
        touchEndY = e.touches[0].clientY;
        pullDistance = touchEndY - touchStartY;
        
        if (pullDistance > 0 && window.scrollY === 0) {
            e.preventDefault();
            if (pullDistance > 60) {
                pullIndicator.classList.add('active');
                pullIndicator.innerHTML = '<i class="fas fa-sync-alt"></i><span>حرر للتحديث</span>';
            } else {
                pullIndicator.classList.remove('active');
                pullIndicator.innerHTML = '<i class="fas fa-sync-alt"></i><span>اسحب للتحديث</span>';
            }
        }
    });
    
    document.addEventListener('touchend', () => {
        if (isPulling && pullDistance > 60) {
            pullIndicator.classList.add('refreshing');
            pullIndicator.innerHTML = '<i class="fas fa-sync-alt"></i><span>جاري التحديث...</span>';
            
            if (typeof loadClientReports === 'function') {
                loadClientReports().finally(() => {
                    setTimeout(() => {
                        pullIndicator.classList.remove('active', 'refreshing');
                        pullIndicator.innerHTML = '<i class="fas fa-sync-alt"></i><span>اسحب للتحديث</span>';
                    }, 500);
                });
            }
        }
        
        isPulling = false;
        pullDistance = 0;
    });
}

/**
 * Initialize Tab Badges
 */
function initializeTabBadges() {
    // This will be called after data loads
}

/**
 * Update Tab Badges
 */
function updateTabBadges(reports, invoices) {
    const reportsTab = document.getElementById('reports-tab');
    const invoicesTab = document.getElementById('invoices-tab');
    const warrantyTab = document.getElementById('warranty-tab');
    const maintenanceTab = document.getElementById('maintenance-tab');
    
    const activeWarranties = calculateActiveWarranties(reports);
    const upcomingMaintenance = calculateUpcomingMaintenance(reports);
    
    updateTabBadge(reportsTab, reports.length);
    updateTabBadge(invoicesTab, invoices.length);
    updateTabBadge(warrantyTab, activeWarranties);
    updateTabBadge(maintenanceTab, upcomingMaintenance);
}

/**
 * Update individual tab badge
 */
function updateTabBadge(tab, count) {
    if (!tab) return;
    
    let badge = tab.querySelector('.tab-badge');
    if (!badge && count > 0) {
        badge = document.createElement('span');
        badge.className = 'tab-badge';
        tab.appendChild(badge);
    }
    
    if (badge) {
        badge.textContent = count;
        if (count === 0) {
            badge.style.display = 'none';
        } else {
            badge.style.display = 'inline-flex';
        }
    }
}

/**
 * Initialize Sort Options
 */
function initializeSortOptions() {
    // Already handled in initializeSearchAndFilter
}

/**
 * Restore Last Active Tab
 */
function restoreLastActiveTab() {
    const lastTab = localStorage.getItem('clientDashboardLastTab');
    if (lastTab) {
        const tab = document.querySelector(`[data-bs-target="${lastTab}"]`);
        if (tab) {
            setTimeout(() => {
                tab.click();
            }, 100);
        }
    }
}

/**
 * Save Last Active Tab
 */
function saveLastActiveTab() {
    const activeTab = document.querySelector('#clientTabs .nav-link.active');
    if (activeTab) {
        const targetId = activeTab.getAttribute('data-bs-target');
        localStorage.setItem('clientDashboardLastTab', targetId);
    }
}

/**
 * Load client reports and related data
 */
async function loadClientReports() {
    try {
        showLoading(true, 'جاري تحميل البيانات...');
        
        // Show skeleton loaders
        showSkeletonLoaders('reportsList', 3);
        showSkeletonLoaders('invoicesList', 2);
        
        // Check if apiService exists, use window.apiService as fallback
        let service = typeof apiService !== 'undefined' ? apiService : window.apiService;
        
        if (!service) {
            console.error('API Service not available - creating emergency instance');
            // Create emergency instance if needed
            window.apiService = new ApiService();
            // Use the newly created instance
            service = window.apiService;
        }
        
        console.log('Using API service with base URL:', service.baseUrl);
        
        // Fetch reports from API
        const apiResponse = await service.getClientReports();
        console.log('Reports data from API:', apiResponse);
        
        // Hide loading indicator
        showLoading(false);

        if (apiResponse && apiResponse.success && Array.isArray(apiResponse.data)) {
            const reportsArray = apiResponse.data;
            
            // Fetch invoices from API for the client
            let invoicesArray = [];
            try {
                const invoiceApiResponse = await apiService.getClientInvoices(); // Fetch invoices for the authenticated client
                if (invoiceApiResponse && invoiceApiResponse.success && Array.isArray(invoiceApiResponse.data)) {
                    invoicesArray = invoiceApiResponse.data;
                    console.log('Invoices data from API:', invoicesArray);
                } else if (invoiceApiResponse && Array.isArray(invoiceApiResponse)) { // If API returns array directly
                    invoicesArray = invoiceApiResponse;
                    console.log('Invoices data from API (direct array):', invoicesArray);
                } else {
                    console.warn('API response for invoices was not a valid array or success object:', invoiceApiResponse);
                }
            } catch (invoiceError) {
                console.error('Error fetching client invoices:', invoiceError);
                // Optionally show a non-blocking error for invoices, or proceed with empty invoicesArray
            }
            
            // Update global state
            window.dashboardState.reports = reportsArray;
            window.dashboardState.invoices = invoicesArray;
            window.dashboardState.lastUpdated = new Date();
            
            // Update last updated timestamp
            updateLastUpdatedText();
            
            // Update quick stats
            updateQuickStats(reportsArray, invoicesArray);
            
            // Update tab badges
            updateTabBadges(reportsArray, invoicesArray);
            
            // Display the reports and invoices with animations
            displayReportsAndInvoices(reportsArray, invoicesArray);
            
            // Cache reports and invoices for offline use
            cacheReportsForOffline(reportsArray, invoicesArray); // Pass both arrays
            
            // Show success notification if data loaded successfully
            if (reportsArray.length > 0 || invoicesArray.length > 0) {
                showGlassNotification(`تم تحميل ${reportsArray.length} تقرير و ${invoicesArray.length} فاتورة`, 'success', 3000);
            }
        } else {
            console.error('API response did not contain a valid reports array:', apiResponse);
            showErrorMessage('فشل في معالجة بيانات التقارير من الخادم.');
        }
    } catch (error) {
        console.error('Error loading client reports:', error);
        showLoading(false);
        
        // Show error message with glass notification
        const errorMsg = navigator.onLine 
            ? 'فشل تحميل التقارير. يرجى المحاولة مرة أخرى لاحقاً.' 
            : 'أنت غير متصل بالإنترنت حالياً. جاري تحميل البيانات المحفوظة محلياً.';
        showErrorMessage(errorMsg);
        
        // Try to load cached reports if offline
        loadCachedReports();
    }
}

/**
 * Load client reports and related data
 */
function loadClientReportsFromCacheOrMock(clientId) {
    // Get reports - try localStorage first, fall back to mock data
    let reports = [];
    let invoices = [];
    
    // Try to get real reports from localStorage
    const storedReports = localStorage.getItem(`lpk_client_${clientId}_reports`);
    if (storedReports) {
        try {
            reports = JSON.parse(storedReports);
            console.log('Loaded reports from localStorage:', reports.length);
        } catch (e) {
            console.error('Error parsing reports from localStorage:', e);
            reports = getMockReports(clientId);
        }
    } else {
        // Fall back to mock data
        reports = getMockReports(clientId);
    }
    
    // Try to get real invoices from localStorage
    const storedInvoices = localStorage.getItem(`lpk_client_${clientId}_invoices`);
    if (storedInvoices) {
        try {
            invoices = JSON.parse(storedInvoices);
            console.log('Loaded invoices from localStorage:', invoices.length);
        } catch (e) {
            console.error('Error parsing invoices from localStorage:', e);
            invoices = getMockInvoices(clientId);
        }
    } else {
        // Fall back to mock data
        invoices = getMockInvoices(clientId);
    }
    
    // Set up tab change handlers
    setupTabHandlers();
    
    // Display the reports
    displayReports(reports);
    
    // Display warranty information
    displayWarrantyInfo(reports);
    
    // Display maintenance schedule
    displayMaintenanceSchedule(reports);
    
    // Display invoices
    displayInvoices(invoices);
}

/**
 * Get mock reports for a client
 */
function getMockReports(clientId) {
    // Common reports for all clients
    const reports = [
        {
            id: 'RPT1001',
            clientId: '1',
            creationDate: '2025-01-15',
            deviceType: 'لابتوب',
            brand: 'HP',
            model: 'Pavilion 15',
            serialNumber: 'HP12345678',
            problem: 'مشكلة في الشاشة والبطارية',
            diagnosis: 'تلف في كابل الشاشة وضعف في البطارية',
            solution: 'تم استبدال كابل الشاشة وتغيير البطارية',
            parts: [
                { name: 'كابل شاشة', cost: 150 },
                { name: 'بطارية جديدة', cost: 250 }
            ],
            technicianName: 'أحمد علي',
            status: 'مكتمل'
        },
        {
            id: 'RPT1002',
            clientId: '1',
            creationDate: '2024-11-20',
            deviceType: 'لابتوب',
            brand: 'Dell',
            model: 'XPS 13',
            serialNumber: 'DL98765432',
            problem: 'مشكلة في لوحة المفاتيح ونظام التشغيل',
            diagnosis: 'تلف في بعض أزرار لوحة المفاتيح وتلف في ملفات النظام',
            solution: 'تم استبدال لوحة المفاتيح وإعادة تثبيت نظام التشغيل',
            parts: [
                { name: 'لوحة مفاتيح', cost: 320 }
            ],
            technicianName: 'محمود خالد',
            status: 'مكتمل'
        },
        {
            id: 'RPT1003',
            clientId: '2',
            creationDate: '2025-03-05',
            deviceType: 'لابتوب',
            brand: 'Lenovo',
            model: 'ThinkPad X1',
            serialNumber: 'LN45678901',
            problem: 'مشكلة في التبريد والصوت',
            diagnosis: 'انسداد في نظام التبريد وتلف في مكبر الصوت',
            solution: 'تم تنظيف نظام التبريد واستبدال مكبر الصوت',
            parts: [
                { name: 'مكبر صوت', cost: 120 }
            ],
            technicianName: 'سامي علي',
            status: 'مكتمل'
        },
        {
            id: 'RPT1004',
            clientId: '3',
            creationDate: '2025-04-10',
            deviceType: 'لابتوب',
            brand: 'Apple',
            model: 'MacBook Pro',
            serialNumber: 'AP87654321',
            problem: 'مشكلة في القرص الصلب والشحن',
            diagnosis: 'تلف في القرص الصلب وعطل في شاحن الطاقة',
            solution: 'تم استبدال القرص الصلب بنوع SSD وإصلاح شاحن الطاقة',
            parts: [
                { name: 'قرص SSD', cost: 450 },
                { name: 'قطع غيار للشاحن', cost: 80 }
            ],
            technicianName: 'فهد محمد',
            status: 'مكتمل'
        }
    ];
    
    // Filter reports by client ID
    return reports.filter(report => report.clientId === clientId);
}

/**
 * Get mock invoices for a client
 */
function getMockInvoices(clientId) {
    const invoices = [
        {
            id: 'INV5001',
            reportId: 'RPT1001',
            clientId: '1',
            date: '2025-01-15',
            items: [
                { description: 'كابل شاشة', amount: 150 },
                { description: 'بطارية جديدة', amount: 250 },
                { description: 'أجور فني', amount: 200 }
            ],
            subtotal: 600,
            tax: 90,
            total: 690,
            paid: true,
            paymentMethod: 'بطاقة ائتمان',
            paymentDate: '2025-01-15'
        },
        {
            id: 'INV5002',
            reportId: 'RPT1002',
            clientId: '1',
            date: '2024-11-20',
            items: [
                { description: 'لوحة مفاتيح', amount: 320 },
                { description: 'إعادة تثبيت نظام التشغيل', amount: 150 },
                { description: 'أجور فني', amount: 200 }
            ],
            subtotal: 670,
            tax: 100.5,
            total: 770.5,
            paid: true,
            paymentMethod: 'نقداً',
            paymentDate: '2024-11-20'
        },
        {
            id: 'INV5003',
            reportId: 'RPT1003',
            clientId: '2',
            date: '2025-03-05',
            items: [
                { description: 'مكبر صوت', amount: 120 },
                { description: 'تنظيف نظام التبريد', amount: 100 },
                { description: 'أجور فني', amount: 200 }
            ],
            subtotal: 420,
            tax: 63,
            total: 483,
            paid: true,
            paymentMethod: 'بطاقة ائتمان',
            paymentDate: '2025-03-05'
        },
        {
            id: 'INV5004',
            reportId: 'RPT1004',
            clientId: '3',
            date: '2025-04-10',
            items: [
                { description: 'قرص SSD', amount: 450 },
                { description: 'قطع غيار للشاحن', amount: 80 },
                { description: 'أجور فني', amount: 200 }
            ],
            subtotal: 730,
            tax: 109.5,
            total: 839.5,
            paid: true,
            paymentMethod: 'نقداً',
            paymentDate: '2025-04-10'
        }
    ];
    
    // Filter invoices by client ID
    return invoices.filter(invoice => invoice.clientId === clientId);
}

/**
 * Update Last Updated Text
 */
function updateLastUpdatedText() {
    const lastUpdatedText = document.getElementById('lastUpdatedText');
    if (!lastUpdatedText || !window.dashboardState.lastUpdated) return;
    
    const now = new Date();
    const diff = Math.floor((now - window.dashboardState.lastUpdated) / 1000);
    
    let text = '';
    if (diff < 60) {
        text = 'منذ لحظات';
    } else if (diff < 3600) {
        const minutes = Math.floor(diff / 60);
        text = `منذ ${minutes} ${minutes === 1 ? 'دقيقة' : 'دقائق'}`;
    } else if (diff < 86400) {
        const hours = Math.floor(diff / 3600);
        text = `منذ ${hours} ${hours === 1 ? 'ساعة' : 'ساعات'}`;
    } else {
        const days = Math.floor(diff / 86400);
        text = `منذ ${days} ${days === 1 ? 'يوم' : 'أيام'}`;
    }
    
    lastUpdatedText.textContent = `آخر تحديث: ${text}`;
}

/**
 * Set up tab change handlers
 */
function setupTabHandlers() {
    // Handle tab changes
    const tabElements = document.querySelectorAll('#clientTabs .nav-link');
    
    if (tabElements.length > 0) {
        tabElements.forEach(tab => {
            tab.addEventListener('click', function(e) {
                const targetId = this.getAttribute('data-bs-target');
                if (!targetId) {
                    return;
                }
                
                e.preventDefault();
                
                // Remove active class from all tabs
                tabElements.forEach(t => t.classList.remove('active'));
                
                // Add active class to clicked tab
                this.classList.add('active');
                
                // Hide all tab content
                const tabContents = document.querySelectorAll('.tab-pane');
                tabContents.forEach(content => {
                    content.classList.remove('show', 'active');
                });
                
                // Show target tab content
                const targetContent = document.querySelector(targetId);
                if (targetContent) {
                    targetContent.classList.add('show', 'active');
                }
                
                // Save last active tab
                saveLastActiveTab();
            });
        });
    }
    
    // Add CSS for tab badges
    if (!document.getElementById('tabBadgeStyles')) {
        const style = document.createElement('style');
        style.id = 'tabBadgeStyles';
        style.textContent = `
            .tab-badge {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                min-width: 20px;
                height: 20px;
                padding: 0 6px;
                background: linear-gradient(135deg, #ff3b30 0%, #ff6b5a 100%);
                color: white;
                border-radius: 10px;
                font-size: 0.75rem;
                font-weight: 600;
                margin-right: 0.5rem;
                animation: badgePop 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                box-shadow: 0 2px 8px rgba(255, 59, 48, 0.3);
            }
            @keyframes badgePop {
                0% { transform: scale(0); }
                50% { transform: scale(1.2); }
                100% { transform: scale(1); }
            }
        `;
        document.head.appendChild(style);
    }
}

// Ensure the DOM is fully loaded before trying to access elements
document.addEventListener('DOMContentLoaded', async (event) => {
    // Set up tab handlers
    setupTabHandlers();
    
    // Update last updated text periodically
    setInterval(() => {
        if (window.dashboardState.lastUpdated) {
            updateLastUpdatedText();
        }
    }, 60000); // Update every minute
    
    // Ensure we are calling the API-fetching version
    if (typeof loadClientReports === 'function') {
        await loadClientReports(); 
    } else {
        console.error('Main loadClientReports function not found!');
    }
});
