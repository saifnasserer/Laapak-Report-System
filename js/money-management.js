/**
 * Laapak Report System - Money Management JavaScript
 * Comprehensive money location and movement management
 * Using divide and conquer approach for better organization
 */

// =============================================================================
// 1. GLOBAL STATE MANAGEMENT
// =============================================================================
class MoneyState {
    constructor() {
        this.locations = [];
        this.movements = [];
        this.stats = {
            totalBalance: 0,
            totalLocations: 0,
            totalMovements: 0,
            todayMovements: 0
        };
        this.filters = {
            startDate: null,
            endDate: null,
            locationId: null,
            movementType: null
        };
        this.charts = {};
        this.isLoading = false;
    }

    // Update locations
    setLocations(locations) {
        this.locations = locations;
        this.updateStats();
        this.notifySubscribers('locations');
    }

    // Update movements
    setMovements(movements) {
        this.movements = movements;
        this.updateStats();
        this.notifySubscribers('movements');
    }

    // Update statistics
    updateStats() {
        this.stats.totalBalance = this.locations.reduce((sum, loc) => sum + parseFloat(loc.balance || 0), 0);
        this.stats.totalLocations = this.locations.length;
        this.stats.totalMovements = this.movements.length;
        
        // Calculate today's movements
        const today = new Date().toDateString();
        this.stats.todayMovements = this.movements.filter(m => 
            new Date(m.movement_date).toDateString() === today
        ).length;
        
        this.notifySubscribers('stats');
    }

    // Observer pattern for state changes
    subscribe(type, callback) {
        if (!this.subscribers) this.subscribers = {};
        if (!this.subscribers[type]) this.subscribers[type] = [];
        this.subscribers[type].push(callback);
    }

    notifySubscribers(type) {
        if (this.subscribers && this.subscribers[type]) {
            this.subscribers[type].forEach(callback => callback());
        }
    }
}

// Global state instance
const moneyState = new MoneyState();

// =============================================================================
// 2. API SERVICE LAYER
// =============================================================================
class MoneyApiService {
    constructor() {
        this.baseUrl = window.config ? window.config.api.baseUrl : window.location.origin;
        this.token = this.getAuthToken();
    }

    getAuthToken() {
        const adminInfo = JSON.parse(localStorage.getItem('adminInfo') || '{}');
        
        // Try to use AuthMiddleware if available
        if (typeof AuthMiddleware !== 'undefined') {
            try {
                const authMiddleware = new AuthMiddleware();
                return authMiddleware.getAdminToken() || adminInfo.token || '';
            } catch (error) {
                console.log('AuthMiddleware not available, using fallback');
            }
        }
        
        // Fallback to direct token access
        return adminInfo.token || '';
    }

    getHeaders() {
        return {
            'Content-Type': 'application/json',
            'x-auth-token': this.token
        };
    }

    async handleResponse(response) {
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Money management API not available on this server');
            }
            const error = await response.json().catch(() => ({ message: 'Network error' }));
            throw new Error(error.message || 'API request failed');
        }
        return response.json();
    }

    // Get all money locations
    async getLocations() {
        const response = await fetch(`${this.baseUrl}/api/money/locations`, {
            headers: this.getHeaders()
        });
        return this.handleResponse(response);
    }

    // Get money movements with filters
    async getMovements(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const response = await fetch(`${this.baseUrl}/api/money/movements?${queryString}`, {
            headers: this.getHeaders()
        });
        return this.handleResponse(response);
    }

    // Create transfer
    async createTransfer(transferData) {
        const response = await fetch(`${this.baseUrl}/api/money/transfer`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(transferData)
        });
        return this.handleResponse(response);
    }

    // Create deposit
    async createDeposit(depositData) {
        const response = await fetch(`${this.baseUrl}/api/money/deposit`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(depositData)
        });
        return this.handleResponse(response);
    }

    // Create withdrawal
    async createWithdrawal(withdrawalData) {
        const response = await fetch(`${this.baseUrl}/api/money/withdrawal`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(withdrawalData)
        });
        return this.handleResponse(response);
    }

    // Get dashboard data
    async getDashboardData(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const response = await fetch(`${this.baseUrl}/api/money/dashboard?${queryString}`, {
            headers: this.getHeaders()
        });
        return this.handleResponse(response);
    }
}

// Global API service instance
let moneyApi;
try {
    moneyApi = new MoneyApiService();
} catch (error) {
    console.error('Failed to initialize MoneyApiService:', error);
    // Create a fallback service
    moneyApi = {
        getAuthToken: () => {
            const adminInfo = JSON.parse(localStorage.getItem('adminInfo') || '{}');
            return adminInfo.token || '';
        },
        getHeaders: () => ({
            'Content-Type': 'application/json',
            'x-auth-token': moneyApi.getAuthToken()
        }),
        getLocations: async () => ({ success: false, message: 'Service not available' }),
        getMovements: async () => ({ success: false, message: 'Service not available' }),
        createTransfer: async () => ({ success: false, message: 'Service not available' }),
        createDeposit: async () => ({ success: false, message: 'Service not available' }),
        createWithdrawal: async () => ({ success: false, message: 'Service not available' }),
        getDashboardData: async () => ({ success: false, message: 'Service not available' })
    };
}

// =============================================================================
// 3. UI RENDERING COMPONENTS
// =============================================================================
class MoneyUIRenderer {
    // Format currency for display
    static formatCurrency(amount) {
        return new Intl.NumberFormat('ar-EG', {
            style: 'currency',
            currency: 'EGP',
            minimumFractionDigits: 0
        }).format(amount);
    }

    // Format date for display
    static formatDate(date) {
        return new Date(date).toLocaleDateString('ar-EG');
    }

    // Render statistics cards
    static renderStats() {
        const { totalBalance, totalLocations, totalMovements, todayMovements } = moneyState.stats;
        
        document.getElementById('totalBalance').textContent = this.formatCurrency(totalBalance);
        document.getElementById('totalLocations').textContent = totalLocations;
        document.getElementById('totalMovements').textContent = totalMovements;
        document.getElementById('todayMovements').textContent = todayMovements;
    }

    // Render money locations
    static renderLocations() {
        const container = document.getElementById('locationsContainer');
        
        if (moneyState.locations.length === 0) {
            container.innerHTML = `
                <div class="text-center">
                    <i class="fas fa-map-marker-alt text-muted" style="font-size: 3rem;"></i>
                    <p class="text-muted mt-2">لا توجد مواقع أموال</p>
                </div>
            `;
            return;
        }

        container.innerHTML = moneyState.locations.map(location => `
            <div class="location-card" data-location-id="${location.id}">
                <div class="text-center">
                    <div class="location-icon ${location.type}">
                        <i class="fas ${this.getLocationIcon(location.type)}"></i>
                    </div>
                    <h6 class="location-name">${location.name_ar}</h6>
                    <p class="location-type text-muted">${this.getLocationTypeName(location.type)}</p>
                    <h5 class="location-balance text-primary">${this.formatCurrency(location.balance)}</h5>
                    <div class="location-actions mt-2">
                        <button class="btn btn-sm btn-outline-primary me-1" onclick="MoneyActions.showTransferFrom(${location.id})">
                            <i class="fas fa-arrow-up"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-success me-1" onclick="MoneyActions.showTransferTo(${location.id})">
                            <i class="fas fa-arrow-down"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-info" onclick="MoneyActions.showLocationHistory(${location.id})">
                            <i class="fas fa-history"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // Render movements
    static renderMovements() {
        const container = document.getElementById('movementsContainer');
        
        if (moneyState.movements.length === 0) {
            container.innerHTML = `
                <div class="text-center">
                    <i class="fas fa-history text-muted" style="font-size: 3rem;"></i>
                    <p class="text-muted mt-2">لا توجد حركات</p>
                </div>
            `;
            return;
        }

        container.innerHTML = moneyState.movements.map(movement => `
            <div class="movement-card" data-movement-id="${movement.id}">
                <div class="row align-items-center">
                    <div class="col-md-3">
                        <div class="movement-amount ${this.getMovementAmountClass(movement)}">
                            ${this.getMovementAmountSign(movement)}${this.formatCurrency(movement.amount)}
                        </div>
                        <small class="movement-type badge bg-${this.getMovementTypeColor(movement.movement_type)}">
                            ${this.getMovementTypeName(movement.movement_type)}
                        </small>
                    </div>
                    <div class="col-md-5">
                        <div class="movement-locations">
                            ${movement.fromLocation ? `<small class="text-muted">من: ${movement.fromLocation.name_ar}</small><br>` : ''}
                            ${movement.toLocation ? `<small class="text-muted">إلى: ${movement.toLocation.name_ar}</small>` : ''}
                        </div>
                        ${movement.description ? `<small class="movement-description">${movement.description}</small>` : ''}
                    </div>
                    <div class="col-md-3">
                        <small class="text-muted">
                            ${this.formatDate(movement.movement_date)}
                        </small>
                    </div>
                    <div class="col-md-1">
                        <button class="btn btn-sm btn-outline-secondary" onclick="MoneyActions.showMovementDetails(${movement.id})">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // Get location icon based on type
    static getLocationIcon(type) {
        const icons = {
            'cash': 'fa-money-bill-wave',
            'digital_wallet': 'fa-mobile-alt',
            'bank_account': 'fa-university',
            'other': 'fa-ellipsis-h'
        };
        return icons[type] || 'fa-map-marker-alt';
    }

    // Get location type name in Arabic
    static getLocationTypeName(type) {
        const names = {
            'cash': 'نقدي',
            'digital_wallet': 'محفظة رقمية',
            'bank_account': 'حساب بنكي',
            'other': 'أخرى'
        };
        return names[type] || 'غير محدد';
    }

    // Get movement amount class for styling
    static getMovementAmountClass(movement) {
        if (movement.movement_type === 'deposit' || movement.movement_type === 'payment_received') {
            return 'positive';
        } else if (movement.movement_type === 'withdrawal' || movement.movement_type === 'expense_paid') {
            return 'negative';
        }
        return '';
    }

    // Get movement amount sign
    static getMovementAmountSign(movement) {
        if (movement.movement_type === 'deposit' || movement.movement_type === 'payment_received') {
            return '+';
        } else if (movement.movement_type === 'withdrawal' || movement.movement_type === 'expense_paid') {
            return '-';
        }
        return '';
    }

    // Get movement type name in Arabic
    static getMovementTypeName(type) {
        const names = {
            'transfer': 'تحويل',
            'deposit': 'إيداع',
            'withdrawal': 'سحب',
            'payment_received': 'دفعة مستلمة',
            'expense_paid': 'مصروف مدفوع'
        };
        return names[type] || type;
    }

    // Get movement type color for badges
    static getMovementTypeColor(type) {
        const colors = {
            'transfer': 'info',
            'deposit': 'success',
            'withdrawal': 'danger',
            'payment_received': 'success',
            'expense_paid': 'warning'
        };
        return colors[type] || 'secondary';
    }

    // Populate location select options
    static populateLocationSelects(modalType = 'transfer') {
        const options = moneyState.locations.map(location => 
            `<option value="${location.id}">${location.name_ar} (${this.formatCurrency(location.balance)})</option>`
        ).join('');

        if (modalType === 'transfer') {
            const fromSelect = document.getElementById('fromLocation');
            const toSelect = document.getElementById('toLocation');
            if (fromSelect) fromSelect.innerHTML = '<option value="">اختر الموقع المصدر</option>' + options;
            if (toSelect) toSelect.innerHTML = '<option value="">اختر الموقع الهدف</option>' + options;
        } else if (modalType === 'deposit') {
            const depositSelect = document.getElementById('depositLocation');
            if (depositSelect) depositSelect.innerHTML = '<option value="">اختر الموقع</option>' + options;
        } else if (modalType === 'withdrawal') {
            const withdrawalSelect = document.getElementById('withdrawalLocation');
            if (withdrawalSelect) withdrawalSelect.innerHTML = '<option value="">اختر الموقع</option>' + options;
        }
    }
}

// =============================================================================
// 4. CHART AND VISUALIZATION COMPONENTS
// =============================================================================
class MoneyCharts {
    static charts = {};

    // Initialize all charts
    static init() {
        this.initMovementsChart();
        this.initBalanceChart();
    }

    // Initialize movements chart
    static initMovementsChart() {
        const ctx = document.getElementById('movementsChart');
        if (!ctx) return;

        // Group movements by type
        const movementTypes = {};
        moneyState.movements.forEach(movement => {
            const type = movement.movement_type;
            if (!movementTypes[type]) {
                movementTypes[type] = 0;
            }
            movementTypes[type]++;
        });

        const labels = Object.keys(movementTypes).map(type => MoneyUIRenderer.getMovementTypeName(type));
        const data = Object.values(movementTypes);
        const colors = ['#007553', '#198754', '#dc3545', '#0dcaf0', '#ffc107'];

        if (this.charts.movements) {
            this.charts.movements.destroy();
        }

        this.charts.movements = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors,
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            font: {
                                family: 'Tajawal'
                            }
                        }
                    }
                }
            }
        });
    }

    // Initialize balance chart
    static initBalanceChart() {
        const ctx = document.getElementById('balanceChart');
        if (!ctx) return;

        const labels = moneyState.locations.map(loc => loc.name_ar);
        const data = moneyState.locations.map(loc => parseFloat(loc.balance));
        const colors = moneyState.locations.map(loc => {
            switch (loc.type) {
                case 'cash': return '#198754';
                case 'digital_wallet': return '#007553';
                case 'bank_account': return '#0dcaf0';
                default: return '#ffc107';
            }
        });

        if (this.charts.balance) {
            this.charts.balance.destroy();
        }

        this.charts.balance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'الرصيد',
                    data: data,
                    backgroundColor: colors,
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return MoneyUIRenderer.formatCurrency(value);
                            }
                        }
                    }
                }
            }
        });
    }

    // Update all charts
    static updateAll() {
        this.initMovementsChart();
        this.initBalanceChart();
    }
}

// =============================================================================
// 5. USER ACTIONS AND FORM HANDLERS
// =============================================================================
class MoneyActions {
    // Show transfer modal
    static showTransferModal() {
        MoneyUIRenderer.populateLocationSelects('transfer');
        const modal = new bootstrap.Modal(document.getElementById('transferModal'));
        modal.show();
    }

    // Show deposit modal
    static showDepositModal() {
        MoneyUIRenderer.populateLocationSelects('deposit');
        const modal = new bootstrap.Modal(document.getElementById('depositModal'));
        modal.show();
    }

    // Show withdrawal modal
    static showWithdrawalModal() {
        MoneyUIRenderer.populateLocationSelects('withdrawal');
        const modal = new bootstrap.Modal(document.getElementById('withdrawalModal'));
        modal.show();
    }

    // Show transfer from specific location
    static showTransferFrom(locationId) {
        this.showTransferModal();
        setTimeout(() => {
            document.getElementById('fromLocation').value = locationId;
        }, 100);
    }

    // Show transfer to specific location
    static showTransferTo(locationId) {
        this.showTransferModal();
        setTimeout(() => {
            document.getElementById('toLocation').value = locationId;
        }, 100);
    }

    // Show location history
    static async showLocationHistory(locationId) {
        try {
            const movements = await moneyApi.getMovements({ locationId });
            // Implementation for showing location-specific history
            MoneyNotifications.success('تم تحميل تاريخ الموقع');
        } catch (error) {
            MoneyNotifications.error('خطأ في تحميل تاريخ الموقع');
        }
    }

    // Show movement details
    static showMovementDetails(movementId) {
        const movement = moneyState.movements.find(m => m.id === movementId);
        if (movement) {
            // Implementation for showing movement details
            MoneyNotifications.info('تفاصيل الحركة');
        }
    }

    // Execute transfer
    static async executeTransfer() {
        const form = document.getElementById('transferForm');
        const formData = new FormData(form);
        
        const transferData = {
            fromLocationId: document.getElementById('fromLocation').value || null,
            toLocationId: document.getElementById('toLocation').value,
            amount: parseFloat(document.getElementById('transferAmount').value),
            description: document.getElementById('transferDescription').value
        };

        // Validation
        if (!transferData.toLocationId || !transferData.amount || transferData.amount <= 0) {
            MoneyNotifications.error('يرجى ملء جميع الحقول المطلوبة');
            return;
        }

        if (transferData.fromLocationId === transferData.toLocationId) {
            MoneyNotifications.error('لا يمكن التحويل لنفس الموقع');
            return;
        }

        try {
            await moneyApi.createTransfer(transferData);
            MoneyNotifications.success('تم التحويل بنجاح');
            bootstrap.Modal.getInstance(document.getElementById('transferModal')).hide();
            form.reset();
            await MoneyDataLoader.loadAll();
        } catch (error) {
            MoneyNotifications.error(`خطأ في التحويل: ${error.message}`);
        }
    }

    // Execute deposit
    static async executeDeposit() {
        const form = document.getElementById('depositForm');
        
        const depositData = {
            toLocationId: document.getElementById('depositLocation').value,
            amount: parseFloat(document.getElementById('depositAmount').value),
            description: document.getElementById('depositDescription').value
        };

        // Validation
        if (!depositData.toLocationId || !depositData.amount || depositData.amount <= 0) {
            MoneyNotifications.error('يرجى ملء جميع الحقول المطلوبة');
            return;
        }

        try {
            await moneyApi.createDeposit(depositData);
            MoneyNotifications.success('تم الإيداع بنجاح');
            bootstrap.Modal.getInstance(document.getElementById('depositModal')).hide();
            form.reset();
            await MoneyDataLoader.loadAll();
        } catch (error) {
            MoneyNotifications.error(`خطأ في الإيداع: ${error.message}`);
        }
    }

    // Execute withdrawal
    static async executeWithdrawal() {
        const form = document.getElementById('withdrawalForm');
        
        const withdrawalData = {
            fromLocationId: document.getElementById('withdrawalLocation').value,
            amount: parseFloat(document.getElementById('withdrawalAmount').value),
            description: document.getElementById('withdrawalDescription').value
        };

        // Validation
        if (!withdrawalData.fromLocationId || !withdrawalData.amount || withdrawalData.amount <= 0) {
            MoneyNotifications.error('يرجى ملء جميع الحقول المطلوبة');
            return;
        }

        try {
            await moneyApi.createWithdrawal(withdrawalData);
            MoneyNotifications.success('تم السحب بنجاح');
            bootstrap.Modal.getInstance(document.getElementById('withdrawalModal')).hide();
            form.reset();
            await MoneyDataLoader.loadAll();
        } catch (error) {
            MoneyNotifications.error(`خطأ في السحب: ${error.message}`);
        }
    }

    // Refresh data
    static async refreshData() {
        await MoneyDataLoader.loadAll();
        MoneyNotifications.success('تم تحديث البيانات');
    }
}

// =============================================================================
// 6. DATA LOADING AND MANAGEMENT
// =============================================================================
class MoneyDataLoader {
    // Load all data
    static async loadAll() {
        try {
            moneyState.isLoading = true;
            this.showLoadingStates();

            const [locationsData, movementsData] = await Promise.all([
                moneyApi.getLocations(),
                moneyApi.getMovements({ limit: 50 })
            ]);

            moneyState.setLocations(locationsData.data.locations || []);
            moneyState.setMovements(movementsData.data.movements || []);

            this.hideLoadingStates();
            moneyState.isLoading = false;

        } catch (error) {
            console.error('Error loading money data:', error);
            
            // Check if it's a 404 error (API not available)
            if (error.message.includes('not available')) {
                this.showApiNotAvailableMessage();
            } else {
                MoneyNotifications.error('خطأ في تحميل البيانات');
            }
            
            this.hideLoadingStates();
            moneyState.isLoading = false;
        }
    }

    // Show loading states
    static showLoadingStates() {
        const containers = ['locationsContainer', 'movementsContainer'];
        containers.forEach(id => {
            const container = document.getElementById(id);
            if (container) {
                container.innerHTML = `
                    <div class="text-center">
                        <div class="spinner-border text-primary" role="status"></div>
                        <p class="mt-2 text-muted">جاري التحميل...</p>
                    </div>
                `;
            }
        });
    }

    // Hide loading states
    static hideLoadingStates() {
        // Loading states will be replaced by actual content through state observers
    }

    // Show API not available message
    static showApiNotAvailableMessage() {
        const locationsContainer = document.getElementById('locationsContainer');
        const movementsContainer = document.getElementById('movementsContainer');
        
        if (locationsContainer) {
            locationsContainer.innerHTML = `
                <div class="col-12 text-center">
                    <i class="fas fa-tools text-muted" style="font-size: 3rem;"></i>
                    <h5 class="mt-3 text-muted">نظام إدارة الأموال</h5>
                    <p class="text-muted">هذه الميزة قيد التطوير وستكون متاحة قريباً</p>
                    <div class="mt-3">
                        <a href="financial-dashboard.html" class="btn btn-primary">
                            <i class="fas fa-arrow-left me-2"></i>
                            العودة للوحة التحكم المالية
                        </a>
                    </div>
                </div>
            `;
        }
        
        if (movementsContainer) {
            movementsContainer.innerHTML = `
                <div class="text-center">
                    <i class="fas fa-clock text-muted" style="font-size: 3rem;"></i>
                    <p class="text-muted mt-2">سيتم إضافة تتبع الحركات قريباً</p>
                </div>
            `;
        }
        
        // Update stats to show zeros
        document.getElementById('totalBalance').textContent = '0 ج.م';
        document.getElementById('totalLocations').textContent = '0';
        document.getElementById('totalMovements').textContent = '0';
        document.getElementById('todayMovements').textContent = '0';
        
        // Disable action buttons
        this.disableActionButtons();
    }
    
    // Disable action buttons when API is not available
    static disableActionButtons() {
        const buttons = document.querySelectorAll('button[onclick*="showTransferModal"], button[onclick*="showDepositModal"], button[onclick*="showWithdrawalModal"]');
        buttons.forEach(button => {
            button.disabled = true;
            button.classList.add('btn-secondary');
            button.classList.remove('btn-primary', 'btn-success', 'btn-danger');
            button.title = 'الميزة غير متاحة حالياً';
        });
    }
}

// =============================================================================
// 7. SIMPLE NOTIFICATION SYSTEM
// =============================================================================
class MoneyNotifications {
    static success(message) {
        console.log('Success:', message);
    }

    static error(message) {
        console.error('Error:', message);
    }

    static info(message) {
        console.log('Info:', message);
    }

    static warning(message) {
        console.warn('Warning:', message);
    }
}

// =============================================================================
// 8. INITIALIZATION AND EVENT BINDING
// =============================================================================
class MoneyManager {
    static init() {
        // Set up state observers
        moneyState.subscribe('stats', () => MoneyUIRenderer.renderStats());
        moneyState.subscribe('locations', () => {
            MoneyUIRenderer.renderLocations();
            MoneyCharts.updateAll();
        });
        moneyState.subscribe('movements', () => {
            MoneyUIRenderer.renderMovements();
            MoneyCharts.updateAll();
        });

        // Bind global functions for onclick handlers
        window.showTransferModal = MoneyActions.showTransferModal;
        window.showDepositModal = MoneyActions.showDepositModal;
        window.showWithdrawalModal = MoneyActions.showWithdrawalModal;
        window.executeTransfer = MoneyActions.executeTransfer;
        window.executeDeposit = MoneyActions.executeDeposit;
        window.executeWithdrawal = MoneyActions.executeWithdrawal;
        window.MoneyActions = MoneyActions;

        // Set up form validation
        this.setupFormValidation();

        // Initialize charts
        MoneyCharts.init();

        // Load initial data
        MoneyDataLoader.loadAll();
    }

    static setupFormValidation() {
        // Add form validation event listeners
        const forms = ['transferForm', 'depositForm', 'withdrawalForm'];
        forms.forEach(formId => {
            const form = document.getElementById(formId);
            if (form) {
                form.addEventListener('submit', (e) => {
                    e.preventDefault();
                });
            }
        });

        // Add amount validation
        const amountInputs = ['transferAmount', 'depositAmount', 'withdrawalAmount'];
        amountInputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            if (input) {
                input.addEventListener('input', (e) => {
                    const value = parseFloat(e.target.value);
                    if (value <= 0) {
                        e.target.setCustomValidity('المبلغ يجب أن يكون أكبر من صفر');
                    } else {
                        e.target.setCustomValidity('');
                    }
                });
            }
        });
    }
}

// =============================================================================
// 9. AUTO-INITIALIZATION
// =============================================================================
document.addEventListener('DOMContentLoaded', function() {
    try {
        MoneyManager.init();
    } catch (error) {
        console.error('Error initializing MoneyManager:', error);
        // Show error state
        document.getElementById('locationsContainer').innerHTML = `
            <div class="col-12 text-center">
                <i class="fas fa-exclamation-triangle text-warning" style="font-size: 3rem;"></i>
                <p class="text-muted mt-2">خطأ في تحميل النظام</p>
                <button class="btn btn-primary" onclick="location.reload()">إعادة المحاولة</button>
            </div>
        `;
        document.getElementById('movementsContainer').innerHTML = `
            <div class="text-center">
                <i class="fas fa-exclamation-triangle text-warning" style="font-size: 3rem;"></i>
                <p class="text-muted mt-2">خطأ في تحميل البيانات</p>
            </div>
        `;
    }
});

// Auto-refresh data every 5 minutes
setInterval(() => {
    if (!moneyState.isLoading) {
        MoneyDataLoader.loadAll();
    }
}, 5 * 60 * 1000);
