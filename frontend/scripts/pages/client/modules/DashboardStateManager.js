/**
 * Dashboard State Manager
 * Centralized state management for the client dashboard
 * @class DashboardStateManager
 */
class DashboardStateManager {
    constructor() {
        this.state = {
            reports: [],
            invoices: [],
            filteredReports: [],
            filteredInvoices: [],
            searchTerm: '',
            sortBy: 'date',
            sortOrder: 'desc',
            lastUpdated: null,
            activeTab: null,
            isLoading: false,
            isOffline: false
        };
        
        this.listeners = new Map();
    }
    
    /**
     * Get current state
     * @param {string} key - Optional key to get specific state property
     * @returns {Object|*} State object or specific property
     */
    getState(key = null) {
        if (key) {
            return this.state[key];
        }
        return { ...this.state }; // Return copy to prevent direct mutation
    }
    
    /**
     * Update state
     * @param {Object} updates - State updates
     * @param {boolean} silent - If true, don't trigger listeners
     */
    setState(updates, silent = false) {
        const prevState = { ...this.state };
        this.state = { ...this.state, ...updates };
        
        if (!silent) {
            this.notifyListeners(prevState, this.state);
        }
    }
    
    /**
     * Subscribe to state changes
     * @param {string} key - State key to listen to (null for all)
     * @param {Function} callback - Callback function
     * @returns {Function} Unsubscribe function
     */
    subscribe(key, callback) {
        if (!this.listeners.has(key)) {
            this.listeners.set(key, new Set());
        }
        
        this.listeners.get(key).add(callback);
        
        // Return unsubscribe function
        return () => {
            const callbacks = this.listeners.get(key);
            if (callbacks) {
                callbacks.delete(callback);
            }
        };
    }
    
    /**
     * Notify listeners of state changes
     * @private
     * @param {Object} prevState - Previous state
     * @param {Object} newState - New state
     */
    notifyListeners(prevState, newState) {
        // Notify specific key listeners
        Object.keys(newState).forEach(key => {
            if (prevState[key] !== newState[key] && this.listeners.has(key)) {
                this.listeners.get(key).forEach(callback => {
                    try {
                        callback(newState[key], prevState[key], newState);
                    } catch (error) {
                        console.error(`Error in state listener for ${key}:`, error);
                    }
                });
            }
        });
        
        // Notify global listeners
        if (this.listeners.has(null)) {
            this.listeners.get(null).forEach(callback => {
                try {
                    callback(newState, prevState);
                } catch (error) {
                    console.error('Error in global state listener:', error);
                }
            });
        }
    }
    
    /**
     * Reset state to initial values
     */
    reset() {
        this.setState({
            reports: [],
            invoices: [],
            filteredReports: [],
            filteredInvoices: [],
            searchTerm: '',
            sortBy: 'date',
            sortOrder: 'desc',
            lastUpdated: null,
            activeTab: null,
            isLoading: false
        });
    }
}

// Export singleton instance
window.DashboardStateManager = DashboardStateManager;
window.dashboardStateManager = new DashboardStateManager();

