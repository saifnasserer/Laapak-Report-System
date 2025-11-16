/**
 * Search and Filter Component
 * Handles search input and sorting
 * @class SearchAndFilter
 */
class SearchAndFilter {
    constructor(stateManager, eventBus, dataManager) {
        this.stateManager = stateManager;
        this.eventBus = eventBus;
        this.dataManager = dataManager;
        this.searchInput = null;
        this.searchClear = null;
        this.sortSelect = null;
        this.lastUpdatedText = null;
        this.searchTimeout = null;
    }
    
    /**
     * Initialize the component
     */
    init() {
        this.render();
        this.attachEventListeners();
        this.startLastUpdatedTimer();
    }
    
    /**
     * Render the component
     */
    render() {
        const welcomeCard = document.querySelector('.container .row:first-of-type');
        const statsContainer = document.getElementById('quickStatsContainer');
        
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
        
        if (statsContainer) {
            statsContainer.insertAdjacentHTML('afterend', searchHTML);
        } else {
            welcomeCard.insertAdjacentHTML('afterend', searchHTML);
        }
        
        this.injectStyles();
    }
    
    /**
     * Inject component styles
     * @private
     */
    injectStyles() {
        if (document.getElementById('searchFilterStyles')) return;
        
        const style = document.createElement('style');
        style.id = 'searchFilterStyles';
        style.textContent = `
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
                border: 1px solid rgba(255, 255, 255, 0.5);
                background: rgba(255, 255, 255, 0.5);
                backdrop-filter: blur(10px);
                transition: all 0.3s ease;
            }
            .search-input:focus {
                background: rgba(255, 255, 255, 0.8);
                border-color: var(--laapak-medium-green, #0eaf54);
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
    
    /**
     * Attach event listeners
     * @private
     */
    attachEventListeners() {
        this.searchInput = document.getElementById('searchInput');
        this.searchClear = document.getElementById('searchClear');
        this.sortSelect = document.getElementById('sortSelect');
        this.lastUpdatedText = document.getElementById('lastUpdatedText');
        
        if (this.searchInput) {
            this.searchInput.addEventListener('input', (e) => {
                this.handleSearch(e.target.value);
            });
        }
        
        if (this.searchClear) {
            this.searchClear.addEventListener('click', () => {
                this.clearSearch();
            });
        }
        
        if (this.sortSelect) {
            this.sortSelect.addEventListener('change', (e) => {
                this.handleSort(e.target.value);
            });
        }
        
        // Listen to state changes
        this.stateManager.subscribe('searchTerm', (value) => {
            if (this.searchInput && this.searchInput.value !== value) {
                this.searchInput.value = value;
            }
            this.updateClearButton();
        });
        
        this.stateManager.subscribe('lastUpdated', () => {
            this.updateLastUpdatedText();
        });
    }
    
    /**
     * Handle search input
     * @private
     * @param {string} value - Search value
     */
    handleSearch(value) {
        clearTimeout(this.searchTimeout);
        
        this.searchTimeout = setTimeout(() => {
            this.dataManager.setSearchTerm(value);
            this.updateClearButton();
        }, 300);
    }
    
    /**
     * Clear search
     */
    clearSearch() {
        if (this.searchInput) {
            this.searchInput.value = '';
            this.dataManager.setSearchTerm('');
            this.updateClearButton();
        }
    }
    
    /**
     * Handle sort change
     * @private
     * @param {string} value - Sort value (format: "field-order")
     */
    handleSort(value) {
        const [sortBy, sortOrder] = value.split('-');
        this.dataManager.setSort(sortBy, sortOrder);
    }
    
    /**
     * Update clear button visibility
     * @private
     */
    updateClearButton() {
        const state = this.stateManager.getState();
        if (this.searchClear) {
            if (state.searchTerm) {
                this.searchClear.classList.remove('d-none');
            } else {
                this.searchClear.classList.add('d-none');
            }
        }
    }
    
    /**
     * Update last updated text
     */
    updateLastUpdatedText() {
        if (!this.lastUpdatedText) return;
        
        const lastUpdated = this.stateManager.getState('lastUpdated');
        if (!lastUpdated) {
            this.lastUpdatedText.textContent = 'لم يتم التحديث بعد';
            return;
        }
        
        const now = new Date();
        const diff = Math.floor((now - new Date(lastUpdated)) / 1000);
        
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
        
        this.lastUpdatedText.textContent = `آخر تحديث: ${text}`;
    }
    
    /**
     * Start timer to update last updated text
     * @private
     */
    startLastUpdatedTimer() {
        setInterval(() => {
            this.updateLastUpdatedText();
        }, 60000); // Update every minute
    }
}

// Export class
window.SearchAndFilter = SearchAndFilter;

