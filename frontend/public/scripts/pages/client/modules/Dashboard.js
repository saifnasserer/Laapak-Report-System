/**
 * Main Dashboard Class
 * Orchestrates all dashboard components and functionality
 * @class Dashboard
 */
class Dashboard {
    constructor() {
        // Core managers
        this.stateManager = window.dashboardStateManager;
        this.eventBus = window.eventBus;
        this.dataManager = null;
        this.notificationManager = null;
        
        // UI Components
        this.quickStats = null;
        this.searchAndFilter = null;
        
        // Configuration
        this.config = {
            autoRefreshInterval: 5 * 60 * 1000, // 5 minutes
            cacheEnabled: true
        };
        
        this.initialized = false;
    }
    
    /**
     * Initialize the dashboard
     */
    async init() {
        if (this.initialized) {
            console.warn('Dashboard already initialized');
            return;
        }
        
        try {
            // Check authentication
            if (!this.checkAuthentication()) {
                return;
            }
            
            // Initialize core managers
            this.initializeManagers();
            
            // Initialize UI components
            this.initializeComponents();
            
            // Setup event handlers
            this.setupEventHandlers();
            
            // Setup offline handling
            this.setupOfflineHandling();
            
            // Load initial data
            await this.loadData();
            
            // Setup auto-refresh
            this.setupAutoRefresh();
            
            // Restore last active tab
            this.restoreLastActiveTab();
            
            this.initialized = true;
            this.eventBus.emit('dashboard:initialized');
            
        } catch (error) {
            console.error('Error initializing dashboard:', error);
            this.eventBus.emit('dashboard:error', { error });
        }
    }
    
    /**
     * Check authentication
     * @private
     * @returns {boolean} True if authenticated
     */
    checkAuthentication() {
        if (typeof authMiddleware === 'undefined' || !authMiddleware.isClientLoggedIn()) {
            console.log('Client not logged in, redirecting to login page');
            window.location.href = 'index.html';
            return false;
        }
        return true;
    }
    
    /**
     * Initialize core managers
     * @private
     */
    initializeManagers() {
        // Initialize data manager
        this.dataManager = new DataManager(this.stateManager, this.eventBus);
        
        // Initialize notification manager
        this.notificationManager = new NotificationManager(this.eventBus);
        
        // Display client info
        this.displayClientInfo();
    }
    
    /**
     * Initialize UI components
     * @private
     */
    initializeComponents() {
        // Initialize Quick Stats
        this.quickStats = new QuickStats(this.stateManager, this.eventBus);
        this.quickStats.init();
        
        // Initialize Search and Filter
        this.searchAndFilter = new SearchAndFilter(
            this.stateManager, 
            this.eventBus, 
            this.dataManager
        );
        this.searchAndFilter.init();
    }
    
    /**
     * Display client information
     * @private
     */
    displayClientInfo() {
        const clientInfo = this.getClientInfo();
        
        const clientNameEl = document.getElementById('clientName');
        const welcomeClientNameEl = document.getElementById('welcomeClientName');
        
        if (clientNameEl && clientInfo.name) {
            clientNameEl.textContent = clientInfo.name;
        }
        
        if (welcomeClientNameEl && clientInfo.name) {
            welcomeClientNameEl.textContent = clientInfo.name;
        }
    }
    
    /**
     * Get client info from storage
     * @private
     * @returns {Object} Client info
     */
    getClientInfo() {
        let clientInfo = sessionStorage.getItem('clientInfo');
        if (!clientInfo) {
            clientInfo = localStorage.getItem('clientInfo');
        }
        return clientInfo ? JSON.parse(clientInfo) : {};
    }
    
    /**
     * Setup event handlers
     * @private
     */
    setupEventHandlers() {
        // Data loaded event
        this.eventBus.on('data:loaded', (data) => {
            this.handleDataLoaded(data);
        });
        
        // Data filtered event - update UI when filters change
        this.eventBus.on('data:filtered', (data) => {
            if (typeof displayReportsAndInvoices === 'function') {
                displayReportsAndInvoices(
                    data.filteredReports || [],
                    data.filteredInvoices || []
                );
            }
        });
        
        // Data error event
        this.eventBus.on('data:error', (error) => {
            this.handleDataError(error);
        });
        
       
        // Tab change handlers
        this.setupTabHandlers();
    }
    
    /**
     * Handle data loaded
     * @private
     * @param {Object} data - Loaded data
     */
    handleDataLoaded(data) {
        const { reports, invoices } = data;
        
        // Update UI
        if (typeof displayReportsAndInvoices === 'function') {
            const state = this.stateManager.getState();
            displayReportsAndInvoices(
                state.filteredReports || reports, 
                state.filteredInvoices || invoices
            );
        }
        
        // Show success notification
        if (reports.length > 0 || invoices.length > 0) {
            this.eventBus.emit('notification:show', {
                message: `تم تحميل ${reports.length} تقرير و ${invoices.length} فاتورة`,
                type: 'success',
                duration: 3000
            });
        }
    }
    
    /**
     * Handle data error
     * @private
     * @param {Object} error - Error object
     */
    handleDataError(error) {
        const errorMsg = navigator.onLine 
            ? 'فشل تحميل البيانات. يرجى المحاولة مرة أخرى لاحقاً.' 
            : 'أنت غير متصل بالإنترنت حالياً. جاري تحميل البيانات المحفوظة محلياً.';
        
        this.eventBus.emit('notification:show', {
            message: errorMsg,
            type: 'error',
            duration: 5000
        });
    }
    
    /**
     * Setup tab handlers
     * @private
     */
    setupTabHandlers() {
        const tabElements = document.querySelectorAll('#clientTabs .nav-link');
        
        tabElements.forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Remove active class from all tabs
                tabElements.forEach(t => t.classList.remove('active'));
                
                // Add active class to clicked tab
                tab.classList.add('active');
                
                // Get the target tab content ID
                const targetId = tab.getAttribute('data-bs-target');
                
                // Hide all tab content
                document.querySelectorAll('.tab-pane').forEach(pane => {
                    pane.classList.remove('show', 'active');
                });
                
                // Show target tab content
                const targetContent = document.querySelector(targetId);
                if (targetContent) {
                    targetContent.classList.add('show', 'active');
                }
                
                // Save active tab
                this.saveActiveTab(targetId);
            });
        });
    }
    
    /**
     * Save active tab
     * @private
     * @param {string} tabId - Tab ID
     */
    saveActiveTab(tabId) {
        localStorage.setItem('clientDashboardLastTab', tabId);
        this.stateManager.setState({ activeTab: tabId });
    }
    
    /**
     * Restore last active tab
     * @private
     */
    restoreLastActiveTab() {
        const lastTab = localStorage.getItem('clientDashboardLastTab');
        if (lastTab) {
            const tab = document.querySelector(`[data-bs-target="${lastTab}"]`);
            if (tab) {
                setTimeout(() => tab.click(), 100);
            }
        }
    }
    
    /**
     * Setup offline handling
     * @private
     */
    setupOfflineHandling() {
        const updateOfflineStatus = () => {
            const offlineAlert = document.getElementById('offlineAlert');
            if (offlineAlert) {
                if (navigator.onLine) {
                    offlineAlert.classList.remove('show');
                    this.stateManager.setState({ isOffline: false });
                    this.eventBus.emit('notification:show', {
                        message: 'تم استعادة الاتصال بنجاح',
                        type: 'success',
                        duration: 3000
                    });
                } else {
                    offlineAlert.classList.add('show');
                    this.stateManager.setState({ isOffline: true });
                }
            }
        };
        
        updateOfflineStatus();
        window.addEventListener('online', updateOfflineStatus);
        window.addEventListener('offline', updateOfflineStatus);
    }
    
    /**
     * Load data
     * @returns {Promise<void>}
     */
    async loadData() {
        await this.dataManager.loadData();
    }
    
    /**
     * Refresh data
     * @returns {Promise<void>}
     */
    
    /**
     * Setup auto-refresh
     * @private
     */
    setupAutoRefresh() {
        if (this.config.autoRefreshInterval > 0) {
            setInterval(() => {
                if (navigator.onLine && !this.stateManager.getState('isLoading')) {
                    this.loadData();
                }
            }, this.config.autoRefreshInterval);
        }
    }
    
    /**
     * Destroy dashboard instance
     */
    destroy() {
        this.eventBus.clear();
        this.stateManager.reset();
        this.initialized = false;
    }
}

// Export class
window.Dashboard = Dashboard;

