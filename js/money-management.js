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
        this.invoiceStats = {};
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

    // Update invoice statistics
    setInvoiceStats(invoiceStats) {
        console.log('Setting invoice stats:', invoiceStats);
        this.invoiceStats = invoiceStats;
        this.notifySubscribers('invoiceStats');
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

// Global flag to track if balances have been initialized
let balancesInitialized = false;

// =============================================================================
// 2. API SERVICE LAYER
// =============================================================================
class MoneyApiService {
    constructor() {
        this.baseUrl = window.config ? window.config.api.baseUrl : window.location.origin;
        this.token = this.getAuthToken();
        console.log('MoneyApiService initialized with baseUrl:', this.baseUrl);
        console.log('Current window.location.origin:', window.location.origin);
        console.log('Window config:', window.config);
    }

    getAuthToken() {
        const adminInfo = JSON.parse(localStorage.getItem('adminInfo') || '{}');
        console.log('Admin info from localStorage:', adminInfo);
        
        // Try to use AuthMiddleware if available
        if (typeof AuthMiddleware !== 'undefined') {
            try {
                const authMiddleware = new AuthMiddleware();
                const token = authMiddleware.getAdminToken() || adminInfo.token || '';
                console.log('Token from AuthMiddleware:', token ? 'Present' : 'Missing');
                return token;
            } catch (error) {
                console.log('AuthMiddleware not available, using fallback');
            }
        }
        
        // Fallback to direct token access
        const token = adminInfo.token || '';
        console.log('Token from localStorage:', token ? 'Present' : 'Missing');
        return token;
    }

    getHeaders() {
        // Always get a fresh token
        const freshToken = this.getAuthToken();
        return {
            'Content-Type': 'application/json',
            'x-auth-token': freshToken
        };
    }

    async handleResponse(response) {
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Money management API not available on this server');
            }
            if (response.status === 401) {
                throw new Error('Authentication required. Please log in again.');
            }
            const error = await response.json().catch(() => ({ message: 'Network error' }));
            throw new Error(error.message || 'API request failed');
        }
        return response.json();
    }

    // Get all money locations
    async getLocations() {
        const url = `${this.baseUrl}/api/money/locations?_t=${Date.now()}`;
        const headers = this.getHeaders();
        console.log('Making request to:', url);
        console.log('Headers:', headers);
        
        try {
            const response = await fetch(url, {
                headers: headers,
                cache: 'no-cache' // Force fresh request
            });
            console.log('Response status:', response.status);
            return this.handleResponse(response);
        } catch (error) {
            console.log('Money locations API not available, using fallback data');
            // Return fallback data if API is not available
            return {
                success: true,
                data: {
                    locations: [
                        { id: 1, name_ar: 'نقداً', type: 'cash', balance: 0 },
                        { id: 2, name_ar: 'Instapay', type: 'digital_wallet', balance: 0 },
                        { id: 3, name_ar: 'محفظة رقمية', type: 'digital_wallet', balance: 0 },
                        { id: 4, name_ar: 'حساب بنكي', type: 'bank_account', balance: 0 }
                    ]
                }
            };
        }
    }

    // Get money movements with filters
    async getMovements(params = {}) {
        // Add cache-busting parameter to force fresh data
        params._t = Date.now();
        const queryString = new URLSearchParams(params).toString();
        const url = `${this.baseUrl}/api/money/movements?${queryString}`;
        console.log('Making movements request to:', url);
        console.log('Headers:', this.getHeaders());
        
        try {
            const response = await fetch(url, {
                headers: this.getHeaders(),
                cache: 'no-cache' // Force fresh request
            });
            console.log('Movements response status:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Movements API error:', response.status, errorText);
                throw new Error(`Movements API error: ${response.status} - ${errorText}`);
            }
            
            return this.handleResponse(response);
        } catch (error) {
            console.error('Money movements API error:', error);
            // Return fallback data if API is not available
            return {
                success: true,
                data: {
                    movements: []
                }
            };
        }
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

    // Get invoice statistics
    async getInvoiceStats(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const response = await fetch(`${this.baseUrl}/api/invoices/stats/payment-methods?${queryString}`, {
            headers: this.getHeaders()
        });
        return this.handleResponse(response);
    }

    // Get expense/profit statistics
    async getExpenseStats(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        try {
            const response = await fetch(`${this.baseUrl}/api/records/stats?${queryString}`, {
                headers: this.getHeaders()
            });
            return this.handleResponse(response);
        } catch (error) {
            console.log('Expense stats API not available, using fallback data');
            return {
                success: true,
                data: {
                    totalExpenses: 0,
                    totalProfits: 0,
                    netAmount: 0,
                    expenseCount: 0,
                    profitCount: 0
                }
            };
        }
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
        
        // Safely update elements only if they exist
        const totalBalanceEl = document.getElementById('totalBalance');
        const totalLocationsEl = document.getElementById('totalLocations');
        const totalMovementsEl = document.getElementById('totalMovements');
        const todayMovementsEl = document.getElementById('todayMovements');
        
        if (totalBalanceEl) totalBalanceEl.textContent = this.formatCurrency(totalBalance);
        if (totalLocationsEl) totalLocationsEl.textContent = totalLocations;
        if (totalMovementsEl) totalMovementsEl.textContent = totalMovements;
        if (todayMovementsEl) todayMovementsEl.textContent = todayMovements;
    }

    // Render money locations
    static renderLocations() {
        console.log('Rendering locations:', moneyState.locations);
        const container = document.getElementById('locationsContainer');
        
        if (!container) {
            console.error('Locations container not found');
            return;
        }
        
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
            <div class="movement-card-modern ${this.getMovementAmountClass(movement)}" data-movement-id="${movement.id}">
                <div class="row align-items-center">
                    <div class="col-md-2">
                        <div class="movement-icon">
                            <i class="fas ${this.getMovementIcon(movement.movement_type)}"></i>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="movement-amount-modern ${this.getMovementAmountClass(movement)}">
                            ${this.getMovementAmountSign(movement)}${this.formatCurrency(movement.amount)}
                        </div>
                        <small class="movement-type-modern badge bg-${this.getMovementTypeColor(movement.movement_type)}">
                            ${this.getMovementTypeName(movement.movement_type)}
                        </small>
                    </div>
                    <div class="col-md-4">
                        <div class="movement-locations-modern">
                            ${movement.fromLocation ? `<div class="location-tag from"><i class="fas fa-arrow-up me-1"></i>${movement.fromLocation.name_ar}</div>` : ''}
                            ${movement.toLocation ? `<div class="location-tag to"><i class="fas fa-arrow-down me-1"></i>${movement.toLocation.name_ar}</div>` : ''}
                        </div>
                        ${movement.description ? `<div class="movement-description-modern">${movement.description}</div>` : ''}
                    </div>
                    <div class="col-md-2">
                        <div class="movement-date-modern">
                            <i class="fas fa-calendar me-1"></i>
                            ${this.formatDate(movement.movement_date)}
                        </div>
                    </div>
                    <div class="col-md-1">
                        <button class="btn btn-sm btn-outline-primary rounded-circle" onclick="MoneyActions.showMovementDetails(${movement.id})" title="عرض التفاصيل">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // Render unified payment methods
    static renderUnifiedPaymentMethods() {
        console.log('Rendering unified payment methods');
        console.log('Locations:', moneyState.locations);
        console.log('Invoice Stats:', moneyState.invoiceStats);
        console.log('Invoice Stats by Payment Method:', moneyState.invoiceStats?.byPaymentMethod);
        
        const container = document.getElementById('unifiedPaymentMethodsContainer');
        
        if (!container) {
            console.error('Unified payment methods container not found');
            return;
        }

        // Add quick action buttons for expense/profit recording
        const quickActionsHtml = `
            <div class="quick-actions mb-4">
                <div class="row">
                    <div class="col-md-4 mb-2">
                        <a href="financial-add-expense.html" class="btn btn-success w-100">
                            <i class="fas fa-plus-circle me-2"></i>
                            تسجيل مصروف جديد
                        </a>
                    </div>
                    <div class="col-md-4 mb-2">
                        <a href="financial-add-expense.html?type=profit" class="btn btn-primary w-100">
                            <i class="fas fa-coins me-2"></i>
                            تسجيل ربح جديد
                        </a>
                    </div>
                    <div class="col-md-4 mb-2">
                        <button onclick="MoneyDataLoader.loadAll()" class="btn btn-info w-100">
                            <i class="fas fa-sync-alt me-2"></i>
                            تحديث البيانات
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Define payment methods with their configurations
        const paymentMethods = {
            cash: { 
                name: 'نقداً', 
                nameEn: 'cash',
                apiName: 'cash',
                icon: 'fa-money-bill-wave', 
                cssClass: 'cash',
                locationTypes: ['cash']
            },
            instapay: { 
                name: 'Instapay', 
                nameEn: 'instapay',
                apiName: 'instapay',
                icon: 'fa-mobile-alt', 
                cssClass: 'instapay',
                locationTypes: ['digital_wallet'],
                locationName: 'محفظة انستاباي'
            },
            wallet: { 
                name: 'محفظة رقمية', 
                nameEn: 'wallet',
                apiName: 'محفظة',
                icon: 'fa-wallet', 
                cssClass: 'wallet',
                locationTypes: ['digital_wallet'],
                locationName: 'محفظة رقمية'
            },
            bank: { 
                name: 'بنك', 
                nameEn: 'bank',
                apiName: 'بنك',
                icon: 'fa-university', 
                cssClass: 'bank',
                locationTypes: ['bank_account']
            }
        };

        // Combine location and invoice data for each payment method
        let combinedData = [];
        
        Object.entries(paymentMethods).forEach(([key, method]) => {
            console.log(`\nProcessing payment method: ${method.name} (${method.apiName})`);
            
            // Find matching locations with specific name matching for digital wallets
            const matchingLocations = moneyState.locations.filter(loc => {
                const typeMatch = method.locationTypes.includes(loc.type);
                
                // For digital wallets, use specific name matching
                if (method.locationTypes.includes('digital_wallet')) {
                    if (method.apiName === 'instapay') {
                        return typeMatch && loc.name_ar === 'محفظة انستاباي';
                    } else if (method.apiName === 'محفظة') {
                        return typeMatch && loc.name_ar === 'محفظة رقمية';
                    }
                }
                
                // For other types, use general matching
                const nameMatch = loc.name_ar.toLowerCase().includes(method.nameEn.toLowerCase());
                
                console.log(`  Checking location ${loc.name_ar}: typeMatch=${typeMatch}, nameMatch=${nameMatch}`);
                
                return typeMatch || nameMatch;
            });
            
            // Get invoice statistics using the correct API name
            const invoiceStats = moneyState.invoiceStats?.byPaymentMethod?.[method.apiName] || {
                count: 0,
                amount: 0,
                paid: 0,
                pending: 0
            };
            
            console.log(`${method.name} (${method.apiName}):`, {
                invoiceStats,
                matchingLocations: matchingLocations.length,
                foundInvoiceData: moneyState.invoiceStats?.byPaymentMethod?.[method.apiName]
            });
            
            // Calculate balance from locations (transactions only)
            const transactionBalance = matchingLocations.reduce((sum, loc) => 
                sum + parseFloat(loc.balance || 0), 0
            );
            
            // Current balance is the transaction balance (no automatic invoice initialization)
            const currentBalance = transactionBalance;
            
            console.log(`${method.name} final calculation:`, {
                invoiceAmount: invoiceStats.amount,
                transactionBalance,
                currentBalance
            });
            
            combinedData.push({
                key,
                method,
                locations: matchingLocations,
                currentBalance,
                invoiceStats,
                totalActivity: currentBalance + invoiceStats.amount
            });
            
            console.log(`Added ${method.name} to combinedData:`, {
                key,
                currentBalance,
                invoiceStats: invoiceStats.amount,
                totalActivity: currentBalance + invoiceStats.amount
            });
        });

        // Sort by total activity (most active first)
        combinedData.sort((a, b) => b.totalActivity - a.totalActivity);

        if (combinedData.length === 0 || combinedData.every(item => item.totalActivity === 0)) {
            container.innerHTML = `
                <div class="text-center py-5">
                    <i class="fas fa-credit-card text-muted" style="font-size: 4rem; opacity: 0.3;"></i>
                    <h5 class="mt-3 text-muted">لا توجد بيانات طرق دفع</h5>
                    <p class="text-muted">سيتم عرض البيانات عند إضافة مواقع أموال أو فواتير</p>
                </div>
            `;
            return;
        }

        console.log('Final combinedData before rendering:', combinedData);
        
        const htmlContent = `
            ${quickActionsHtml}
            <div class="payment-methods-grid">
                ${combinedData.map(item => {
                    console.log(`Rendering ${item.method.name}:`, {
                        currentBalance: item.currentBalance,
                        formattedBalance: this.formatCurrency(item.currentBalance),
                        invoiceAmount: item.invoiceStats.amount
                    });
                    return `
                    <div class="payment-method-card ${item.method.cssClass}">
                        <div class="payment-method-header">
                            <div class="payment-method-icon">
                                <i class="fas ${item.method.icon}"></i>
                            </div>
                            <div class="payment-method-info">
                                <h6 class="payment-method-name">${item.method.name}</h6>
                            </div>
                        </div>
                        
                        <div class="payment-method-balance">
                            <div class="balance-amount">${this.formatCurrency(item.currentBalance)}</div>
                            <div class="balance-label">الرصيد الإجمالي</div>
                        </div>
                        
                        <div class="balance-breakdown">
                            <div class="balance-breakdown-item">
                                <span class="balance-breakdown-label">الرصيد الحالي:</span>
                                <span class="balance-breakdown-value">${this.formatCurrency(item.currentBalance)}</span>
                            </div>
                            <div class="balance-breakdown-item">
                                <span class="balance-breakdown-label">إجمالي الفواتير:</span>
                                <span class="balance-breakdown-value">${this.formatCurrency(item.invoiceStats.amount)}</span>
                            </div>
                        </div>
                    </div>
                `}).join('')}
            </div>
        `;
        
        console.log('Generated HTML:', htmlContent);
        container.innerHTML = htmlContent;
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

    // Get movement icon based on type
    static getMovementIcon(type) {
        const icons = {
            'transfer': 'fa-exchange-alt',
            'deposit': 'fa-plus-circle',
            'withdrawal': 'fa-minus-circle',
            'payment_received': 'fa-arrow-down',
            'expense_paid': 'fa-arrow-up'
        };
        return icons[type] || 'fa-circle';
    }

    // Map our method names to API method names
    static mapMethodNameToAPI(methodName) {
        const mapping = {
            'cash': 'cash',
            'instapay': 'instapay', 
            'محفظة': 'محفظة',
            'بنك': 'بنك'
        };
        return mapping[methodName] || 'other';
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

    // Show deposit to specific payment method
    static showDepositToMethod(methodKey) {
        console.log('Deposit to method:', methodKey);
        this.showDepositModal();
        
        setTimeout(() => {
            const locationSelect = document.getElementById('depositLocation');
            if (locationSelect) {
                const paymentMethods = {
                    cash: { locationTypes: ['cash'] },
                    instapay: { locationTypes: ['digital_wallet'] },
                    wallet: { locationTypes: ['digital_wallet'] },
                    bank: { locationTypes: ['bank_account'] }
                };
                
                const method = paymentMethods[methodKey];
                if (method) {
                    const relevantLocations = moneyState.locations.filter(loc => 
                        method.locationTypes.includes(loc.type)
                    );
                    
                    if (relevantLocations.length > 0) {
                        locationSelect.value = relevantLocations[0].id;
                    }
                }
            }
        }, 100);
    }

    // Show withdrawal from specific payment method
    static showWithdrawFromMethod(methodKey) {
        console.log('Withdraw from method:', methodKey);
        this.showWithdrawalModal();
        
        setTimeout(() => {
            const locationSelect = document.getElementById('withdrawalLocation');
            if (locationSelect) {
                const paymentMethods = {
                    cash: { locationTypes: ['cash'] },
                    instapay: { locationTypes: ['digital_wallet'] },
                    wallet: { locationTypes: ['digital_wallet'] },
                    bank: { locationTypes: ['bank_account'] }
                };
                
                const method = paymentMethods[methodKey];
                if (method) {
                    const relevantLocations = moneyState.locations.filter(loc => 
                        method.locationTypes.includes(loc.type)
                    );
                    
                    if (relevantLocations.length > 0) {
                        locationSelect.value = relevantLocations[0].id;
                    }
                }
            }
        }, 100);
    }

    // Show transfer from specific payment method
    static showTransferFromMethod(methodKey) {
        console.log('Transfer from method:', methodKey);
        this.showTransferModal();
        
        setTimeout(() => {
            const fromLocationSelect = document.getElementById('fromLocation');
            if (fromLocationSelect) {
                const paymentMethods = {
                    cash: { locationTypes: ['cash'] },
                    instapay: { locationTypes: ['digital_wallet'] },
                    wallet: { locationTypes: ['digital_wallet'] },
                    bank: { locationTypes: ['bank_account'] }
                };
                
                const method = paymentMethods[methodKey];
                if (method) {
                    const relevantLocations = moneyState.locations.filter(loc => 
                        method.locationTypes.includes(loc.type)
                    );
                    
                    if (relevantLocations.length > 0) {
                        fromLocationSelect.value = relevantLocations[0].id;
                    }
                }
            }
        }, 100);
    }

    // Show payment method details
    static showMethodDetails(methodKey) {
        console.log('Show details for method:', methodKey);
        MoneyNotifications.info(`تفاصيل طريقة الدفع: ${methodKey}`);
    }

    // Show unified transfer modal
    static showUnifiedTransferModal() {
        console.log('Show unified transfer modal');
        this.showTransferModal();
    }

    // Refresh data
    static async refreshData() {
        await MoneyDataLoader.loadAll();
        MoneyNotifications.success('تم تحديث البيانات');
    }
    
    // Refresh movements specifically
    static async refreshMovements() {
        try {
            const movementsData = await moneyApi.getMovements({ limit: 50 });
            moneyState.setMovements(movementsData.data.movements || []);
            MoneyNotifications.success('تم تحديث الحركات');
        } catch (error) {
            MoneyNotifications.error('خطأ في تحديث الحركات');
        }
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

            console.log('Loading money management data...');

            const [locationsData, movementsData, invoiceStatsData, expenseStatsData] = await Promise.all([
                moneyApi.getLocations(),
                moneyApi.getMovements({ limit: 50 }),
                moneyApi.getInvoiceStats(),
                moneyApi.getExpenseStats()
            ]);

            console.log('Locations data:', locationsData);
            console.log('Movements data:', movementsData);
            console.log('Invoice stats data:', invoiceStatsData);
            console.log('Expense stats data:', expenseStatsData);

            // Initialize location balances with invoice totals if needed
            await this.initializeLocationBalances(locationsData.data.locations || [], invoiceStatsData.data || {});

            console.log('Setting locations:', locationsData.data.locations || []);
            moneyState.setLocations(locationsData.data.locations || []);
            console.log('Setting movements:', movementsData.data.movements || []);
            moneyState.setMovements(movementsData.data.movements || []);
            console.log('Setting invoice stats:', invoiceStatsData.data || {});
            moneyState.setInvoiceStats(invoiceStatsData.data || {});
            
            // Store expense stats for potential use
            moneyState.expenseStats = expenseStatsData.data || {};
            console.log('Setting expense stats:', expenseStatsData.data || {});

            console.log('State updated:', {
                locations: moneyState.locations.length,
                movements: moneyState.movements.length,
                invoiceStats: moneyState.invoiceStats
            });

            this.hideLoadingStates();
            moneyState.isLoading = false;

        } catch (error) {
            console.error('Error loading money data:', error);
            
            // Check if it's a 404 error (API not available)
            if (error.message.includes('not available')) {
                this.showApiNotAvailableMessage();
            } else if (error.message.includes('Authentication required')) {
                this.showAuthenticationError();
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

    // Initialize location balances with zeros (no automatic invoice initialization)
    static async initializeLocationBalances(locations, invoiceStats) {
        try {
            // Check if already initialized
            if (balancesInitialized) {
                console.log('Balances already initialized, skipping...');
                return;
            }
            
            console.log('Initializing location balances with zeros...');
            
            // Define payment method mapping for reference only
            const paymentMethodMapping = {
                'cash': { locationTypes: ['cash'], apiName: 'cash' },
                'instapay': { locationTypes: ['digital_wallet'], apiName: 'instapay' },
                'Instapay': { locationTypes: ['digital_wallet'], apiName: 'instapay' },
                'محفظة': { locationTypes: ['digital_wallet'], apiName: 'محفظة' },
                'بنك': { locationTypes: ['bank_account'], apiName: 'بنك' }
            };
            
            // Check each location and ensure it has a balance (initialize to 0 if null/undefined)
            for (const location of locations) {
                console.log(`Checking location: ${location.name_ar} (type: ${location.type})`);
                
                const currentBalance = parseFloat(location.balance || 0);
                
                console.log(`Location ${location.name_ar}:`, {
                    currentBalance,
                    balanceType: typeof location.balance
                });
                
                // If location has no balance set, ensure it's 0 (but don't create deposits)
                if (location.balance === null || location.balance === undefined) {
                    console.log(`Setting ${location.name_ar} balance to 0`);
                    location.balance = 0;
                }
            }
            
            // Mark as initialized
            balancesInitialized = true;
            console.log('Location balances initialization completed - all balances set to 0 or existing values');
        } catch (error) {
            console.error('Error initializing location balances:', error);
        }
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
        
        // Update stats to show zeros (only if elements exist)
        const totalBalanceEl = document.getElementById('totalBalance');
        const totalLocationsEl = document.getElementById('totalLocations');
        const totalMovementsEl = document.getElementById('totalMovements');
        const todayMovementsEl = document.getElementById('todayMovements');
        
        if (totalBalanceEl) totalBalanceEl.textContent = '0 ج.م';
        if (totalLocationsEl) totalLocationsEl.textContent = '0';
        if (totalMovementsEl) totalMovementsEl.textContent = '0';
        if (todayMovementsEl) todayMovementsEl.textContent = '0';
        
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
    
    // Show authentication error
    static showAuthenticationError() {
        const locationsContainer = document.getElementById('locationsContainer');
        const movementsContainer = document.getElementById('movementsContainer');
        
        // Get authentication info for debugging
        const adminInfo = JSON.parse(localStorage.getItem('adminInfo') || '{}');
        const isLoggedIn = adminInfo.token && adminInfo.role;
        
        if (locationsContainer) {
            locationsContainer.innerHTML = `
                <div class="col-12 text-center">
                    <i class="fas fa-lock text-warning" style="font-size: 3rem;"></i>
                    <h5 class="mt-3 text-muted">مطلوب تسجيل الدخول</h5>
                    <p class="text-muted">يرجى تسجيل الدخول مرة أخرى للوصول لنظام إدارة الأموال</p>
                    <div class="mt-3">
                        <p class="text-muted small">
                            حالة تسجيل الدخول: ${isLoggedIn ? 'مسجل دخول' : 'غير مسجل دخول'}<br>
                            الدور: ${adminInfo.role || 'غير محدد'}
                        </p>
                        <a href="admin-login.html" class="btn btn-primary">
                            <i class="fas fa-sign-in-alt me-2"></i>
                            تسجيل الدخول
                        </a>
                    </div>
                </div>
            `;
        }
        
        if (movementsContainer) {
            movementsContainer.innerHTML = `
                <div class="text-center">
                    <i class="fas fa-lock text-warning" style="font-size: 3rem;"></i>
                    <p class="text-muted mt-2">مطلوب تسجيل الدخول</p>
                </div>
            `;
        }
        
        // Disable action buttons
        this.disableActionButtons();
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
            MoneyUIRenderer.renderUnifiedPaymentMethods();
            MoneyCharts.updateAll();
        });
        moneyState.subscribe('movements', () => {
            MoneyUIRenderer.renderMovements();
            MoneyCharts.updateAll();
        });
        moneyState.subscribe('invoiceStats', () => {
            console.log('Invoice stats subscriber triggered');
            MoneyUIRenderer.renderUnifiedPaymentMethods();
        });

        // Bind global functions for onclick handlers
        window.showTransferModal = MoneyActions.showTransferModal;
        window.showDepositModal = MoneyActions.showDepositModal;
        window.showWithdrawalModal = MoneyActions.showWithdrawalModal;
        window.executeTransfer = MoneyActions.executeTransfer;
        window.executeDeposit = MoneyActions.executeDeposit;
        window.executeWithdrawal = MoneyActions.executeWithdrawal;
        window.MoneyActions = MoneyActions;
        
        // Bind unified payment method functions
        window.showDepositToMethod = (methodKey) => MoneyActions.showDepositToMethod(methodKey);
        window.showWithdrawFromMethod = (methodKey) => MoneyActions.showWithdrawFromMethod(methodKey);
        window.showTransferFromMethod = (methodKey) => MoneyActions.showTransferFromMethod(methodKey);
        window.showMethodDetails = (methodKey) => MoneyActions.showMethodDetails(methodKey);
        window.refreshPaymentMethods = () => MoneyDataLoader.loadAll();
        window.showUnifiedTransferModal = () => MoneyActions.showUnifiedTransferModal();
        window.refreshMovements = () => MoneyActions.refreshMovements();

        // Set up form validation
        this.setupFormValidation();

        // Initialize charts
        MoneyCharts.init();

        // Load initial data
        MoneyDataLoader.loadAll();
        
        // Setup navigation interactions
        this.setupNavigationInteractions();
    }
    
    static setupNavigationInteractions() {
        const navLinks = document.querySelectorAll('.navbar .nav-link');
        
        // Apply consistent inactive style to all links first
        navLinks.forEach(link => {
            link.style.backgroundColor = 'rgba(255,255,255,0.15)';
            link.style.boxShadow = '';
            link.classList.remove('active', 'fw-bold');
        });
        
        // Set active state for current page
        const currentPage = window.location.pathname.split('/').pop();
        if (currentPage === 'money-management.html') {
            const moneyLink = document.querySelector('a[href="money-management.html"]');
            if (moneyLink) {
                moneyLink.classList.add('active', 'fw-bold');
                moneyLink.style.backgroundColor = 'rgba(255,255,255,0.3)';
                moneyLink.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
            }
        }
        
        // Add click event listeners
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                // Remove active class from all links
                navLinks.forEach(l => {
                    l.classList.remove('active', 'fw-bold');
                    l.style.backgroundColor = 'rgba(255,255,255,0.15)';
                    l.style.boxShadow = '';
                });
                
                // Add active class to clicked link
                link.classList.add('active', 'fw-bold');
                link.style.backgroundColor = 'rgba(255,255,255,0.3)';
                link.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
            });
        });
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

// Listen for refresh messages from other pages
window.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'REFRESH_MONEY_DATA') {
        console.log('Received refresh message from expense page');
        if (!moneyState.isLoading) {
            MoneyDataLoader.loadAll();
        }
    }
});
