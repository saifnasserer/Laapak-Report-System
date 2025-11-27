/**
 * Quick Stats Component
 * Displays animated statistics cards
 * @class QuickStats
 */
class QuickStats {
    constructor(stateManager, eventBus) {
        this.stateManager = stateManager;
        this.eventBus = eventBus;
        this.container = null;
        
        this.setupEventListeners();
    }
    
    /**
     * Initialize the component
     */
    init() {
        this.render();
        this.subscribeToState();
    }
    
    /**
     * Setup event listeners
     * @private
     */
    setupEventListeners() {
        this.eventBus.on('data:loaded', () => this.update());
        this.eventBus.on('data:loaded:cache', () => this.update());
    }
    
    /**
     * Subscribe to state changes
     * @private
     */
    subscribeToState() {
        this.stateManager.subscribe('reports', () => this.update());
        this.stateManager.subscribe('invoices', () => this.update());
    }
    
    /**
     * Render the component
     */
    render() {
        const welcomeCard = document.querySelector('.container .row:first-of-type .card');
        if (!welcomeCard) return;
        
        const statsHTML = `
            <div class="row g-3 mb-4" id="quickStatsContainer">
                <div class="col-md-3 col-sm-6">
                    <div class="stat-card glass-card" data-stat="reports">
                        <div class="stat-icon"><i class="fas fa-laptop-medical"></i></div>
                        <div class="stat-content">
                            <div class="stat-value" id="statReports">0</div>
                            <div class="stat-label">تقارير الفحص</div>
                        </div>
                        <div class="stat-wave"></div>
                    </div>
                </div>
                <div class="col-md-3 col-sm-6">
                    <div class="stat-card glass-card" data-stat="warranty">
                        <div class="stat-icon"><i class="fas fa-shield-alt"></i></div>
                        <div class="stat-content">
                            <div class="stat-value" id="statWarranty">0</div>
                            <div class="stat-label">ضمانات نشطة</div>
                        </div>
                        <div class="stat-wave"></div>
                    </div>
                </div>
                <div class="col-md-3 col-sm-6">
                    <div class="stat-card glass-card" data-stat="maintenance">
                        <div class="stat-icon"><i class="fas fa-tools"></i></div>
                        <div class="stat-content">
                            <div class="stat-value" id="statMaintenance">0</div>
                            <div class="stat-label">صيانة قادمة</div>
                        </div>
                        <div class="stat-wave"></div>
                    </div>
                </div>
                <div class="col-md-3 col-sm-6">
                    <div class="stat-card glass-card" data-stat="invoices">
                        <div class="stat-icon"><i class="fas fa-dollar-sign"></i></div>
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
        this.container = document.getElementById('quickStatsContainer');
        this.injectStyles();
    }
    
    /**
     * Inject component styles
     * @private
     */
    injectStyles() {
        if (document.getElementById('quickStatsStyles')) return;
        
        const style = document.createElement('style');
        style.id = 'quickStatsStyles';
        style.textContent = `
            .stat-card {
                background: var(--glass-bg-primary, rgba(255, 255, 255, 0.7));
                backdrop-filter: blur(40px) saturate(180%);
                -webkit-backdrop-filter: blur(40px) saturate(180%);
                border: 1px solid rgba(255, 255, 255, 0.5);
                border-radius: 16px;
                padding: 1.5rem;
                position: relative;
                overflow: hidden;
                transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                cursor: pointer;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
            }
            .stat-card:hover {
                transform: translateY(-8px) scale(1.02);
                box-shadow: 0 20px 60px rgba(14, 175, 84, 0.15);
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
                background: linear-gradient(90deg, 
                    var(--laapak-medium-green, #0eaf54) 0%, 
                    var(--laapak-light-green, #36d278) 100%);
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
    
    /**
     * Update statistics
     */
    update() {
        const state = this.stateManager.getState();
        const reports = state.reports || [];
        const invoices = state.invoices || [];
        
        const activeWarranties = this.calculateActiveWarranties(reports);
        const upcomingMaintenance = this.calculateUpcomingMaintenance(reports);
        
        this.animateValue('statReports', reports.length);
        this.animateValue('statWarranty', activeWarranties);
        this.animateValue('statMaintenance', upcomingMaintenance);
        this.animateValue('statInvoices', invoices.length);
    }
    
    /**
     * Animate value counting up
     * @private
     * @param {string} elementId - Element ID
     * @param {number} targetValue - Target value
     */
    animateValue(elementId, targetValue) {
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
     * @private
     * @param {Array} reports - Reports array
     * @returns {number} Count of active warranties
     */
    calculateActiveWarranties(reports) {
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
     * @private
     * @param {Array} reports - Reports array
     * @returns {number} Count of upcoming maintenance
     */
    calculateUpcomingMaintenance(reports) {
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
}

// Export class
window.QuickStats = QuickStats;

