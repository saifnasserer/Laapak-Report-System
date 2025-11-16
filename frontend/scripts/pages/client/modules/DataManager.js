/**
 * Data Manager
 * Handles all data operations: API calls, caching, filtering, sorting
 * @class DataManager
 */
class DataManager {
    constructor(stateManager, eventBus) {
        this.stateManager = stateManager;
        this.eventBus = eventBus;
        this.apiService = null;
        this.cacheKey = {
            reports: 'cached_client_reports',
            invoices: 'cached_client_invoices'
        };
        
        this.initializeApiService();
    }
    
    /**
     * Initialize API service
     * @private
     */
    initializeApiService() {
        if (typeof apiService !== 'undefined') {
            this.apiService = apiService;
        } else if (window.apiService) {
            this.apiService = window.apiService;
        } else if (window.ApiService) {
            this.apiService = new ApiService();
            window.apiService = this.apiService;
        } else {
            console.warn('API Service not available');
        }
    }
    
    /**
     * Load reports and invoices from API
     * @returns {Promise<Object>} Object with reports and invoices arrays
     */
    async loadData() {
        this.stateManager.setState({ isLoading: true });
        this.eventBus.emit('data:loading:start');
        
        try {
            // Load reports
            const reportsResponse = await this.apiService.getClientReports();
            const reports = reportsResponse?.success && Array.isArray(reportsResponse.data) 
                ? reportsResponse.data 
                : [];
            
            // Load invoices
            let invoices = [];
            try {
                const invoicesResponse = await this.apiService.getClientInvoices();
                if (invoicesResponse?.success && Array.isArray(invoicesResponse.data)) {
                    invoices = invoicesResponse.data;
                } else if (Array.isArray(invoicesResponse)) {
                    invoices = invoicesResponse;
                }
            } catch (invoiceError) {
                console.error('Error fetching invoices:', invoiceError);
                this.eventBus.emit('data:error', { type: 'invoices', error: invoiceError });
            }
            
            // Update state
            this.stateManager.setState({
                reports,
                invoices,
                lastUpdated: new Date(),
                isLoading: false
            });
            
            // Cache data
            this.cacheData(reports, invoices);
            
            // Apply current filters
            this.applyFilters();
            
            // Emit success event
            this.eventBus.emit('data:loaded', { reports, invoices });
            
            return { reports, invoices };
            
        } catch (error) {
            console.error('Error loading data:', error);
            this.stateManager.setState({ isLoading: false });
            this.eventBus.emit('data:error', { type: 'general', error });
            
            // Try to load from cache
            return this.loadFromCache();
        }
    }
    
    /**
     * Load data from cache
     * @returns {Promise<Object>} Cached data
     */
    async loadFromCache() {
        try {
            const cachedReports = JSON.parse(
                localStorage.getItem(this.cacheKey.reports) || '[]'
            );
            const cachedInvoices = JSON.parse(
                localStorage.getItem(this.cacheKey.invoices) || '[]'
            );
            
            if (cachedReports.length > 0 || cachedInvoices.length > 0) {
                this.stateManager.setState({
                    reports: cachedReports,
                    invoices: cachedInvoices,
                    isLoading: false
                });
                
                this.applyFilters();
                this.eventBus.emit('data:loaded:cache', { 
                    reports: cachedReports, 
                    invoices: cachedInvoices 
                });
                
                return { reports: cachedReports, invoices: cachedInvoices };
            }
        } catch (error) {
            console.error('Error loading from cache:', error);
        }
        
        return { reports: [], invoices: [] };
    }
    
    /**
     * Cache data for offline use
     * @param {Array} reports - Reports array
     * @param {Array} invoices - Invoices array
     */
    cacheData(reports, invoices) {
        try {
            localStorage.setItem(this.cacheKey.reports, JSON.stringify(reports));
            localStorage.setItem(this.cacheKey.invoices, JSON.stringify(invoices));
            this.eventBus.emit('data:cached');
        } catch (error) {
            console.error('Error caching data:', error);
        }
    }
    
    /**
     * Apply filters and sorting to data
     */
    applyFilters() {
        const state = this.stateManager.getState();
        let filteredReports = [...state.reports];
        let filteredInvoices = [...state.invoices];
        
        // Apply search filter
        if (state.searchTerm) {
            const searchLower = state.searchTerm.toLowerCase();
            
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
        if (state.sortBy === 'date') {
            filteredReports.sort((a, b) => {
                const dateA = new Date(a.inspection_date || a.created_at);
                const dateB = new Date(b.inspection_date || b.created_at);
                return state.sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
            });
            
            filteredInvoices.sort((a, b) => {
                const dateA = new Date(a.date);
                const dateB = new Date(b.date);
                return state.sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
            });
        }
        
        // Update filtered data in state
        this.stateManager.setState({
            filteredReports,
            filteredInvoices
        });
        
        this.eventBus.emit('data:filtered', { filteredReports, filteredInvoices });
    }
    
    /**
     * Set search term
     * @param {string} searchTerm - Search term
     */
    setSearchTerm(searchTerm) {
        this.stateManager.setState({ searchTerm });
        this.applyFilters();
    }
    
    /**
     * Set sort options
     * @param {string} sortBy - Sort field
     * @param {string} sortOrder - Sort order (asc/desc)
     */
    setSort(sortBy, sortOrder) {
        this.stateManager.setState({ sortBy, sortOrder });
        this.applyFilters();
    }
}

// Export class
window.DataManager = DataManager;

