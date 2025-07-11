/**
 * Laapak Report System - Admin Dashboard
 * Enhanced dashboard with goals, achievements, and insights
 */

// Check if admin is authenticated
function checkAdminAuth() {
    // Check if authMiddleware is available
    if (typeof authMiddleware === 'undefined') {
        console.error('AuthMiddleware not available');
        return;
    }
    
    console.log('Checking admin authentication...');
    
    // Use authMiddleware to check if admin is logged in
    if (!authMiddleware.isAdminLoggedIn()) {
        console.log('Admin not authenticated, redirecting to login page');
        window.location.href = 'index.html';
        return;
    }
    
    console.log('Admin authenticated, access granted');
    
    // Optional: Validate token with server
    const adminToken = authMiddleware.getAdminToken();
    if (adminToken) {
        const apiBaseUrl = window.config ? window.config.api.baseUrl : window.location.origin;
        
        fetch(`${apiBaseUrl}/api/auth/me`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': adminToken
            }
        })
        .then(response => {
            if (!response.ok) {
                console.log('Token validation failed, clearing admin session');
                localStorage.removeItem('adminToken');
                localStorage.removeItem('adminInfo');
                sessionStorage.removeItem('adminToken');
                sessionStorage.removeItem('adminInfo');
                window.location.href = 'index.html';
            } else {
                console.log('Admin token validation successful');
            }
        })
        .catch(error => {
            console.error('Token validation error:', error);
            // On network error, don't clear sessions immediately
        });
    }
}

// Enhanced Admin Dashboard JavaScript
class AdminDashboard {
    constructor() {
        this.currentPeriod = 'month';
        this.currentDaysAhead = 7;
        this.currentWarrantyType = 'all';
        this.authMiddleware = typeof authMiddleware !== 'undefined' ? authMiddleware : null;
        
        console.log('AdminDashboard constructor - authMiddleware available:', !!this.authMiddleware);
        console.log('AdminDashboard constructor - global authMiddleware available:', typeof authMiddleware !== 'undefined');
        
        this.init();
    }

    init() {
        this.loadDashboard();
        this.setupEventListeners();
        this.loadBannerGoal();
        
        // Load dashboard stats and charts
        loadDashboardStats();
        initializeCharts();
    }

    setupEventListeners() {
        // Device models filtering
        document.querySelectorAll('[data-period]').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                this.currentPeriod = e.target.dataset.period;
                this.loadDeviceModels();
                this.updateActiveFilter(e.target);
            });
        });

        // Warranty alerts filtering
        document.querySelectorAll('[data-days]').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                this.currentDaysAhead = parseInt(e.target.dataset.days);
                this.loadWarrantyAlerts();
                this.updateActiveFilter(e.target);
            });
        });

        // Sort and filter controls
        document.getElementById('deviceSortBy')?.addEventListener('change', () => this.loadDeviceModels());
        document.getElementById('deviceLimit')?.addEventListener('change', () => this.loadDeviceModels());
        document.getElementById('warrantyType')?.addEventListener('change', () => this.loadWarrantyAlerts());
        document.getElementById('warrantySortBy')?.addEventListener('change', () => this.loadWarrantyAlerts());

        // Banner goal edit
        document.getElementById('editBannerGoalBtn')?.addEventListener('click', () => this.editBannerGoal());

        // Goals management
        document.getElementById('editGoalBtn')?.addEventListener('click', () => this.editBannerGoal());
        document.getElementById('saveGoalBtn')?.addEventListener('click', () => this.saveGoal());
        // Add New Goal button
        document.getElementById('addGoalBtn')?.addEventListener('click', () => {
            document.getElementById('goalId').value = '';
            document.getElementById('goalTitle').value = '';
            document.getElementById('goalType').value = 'reports';
            document.getElementById('goalPeriod').value = 'monthly';
            document.getElementById('goalTarget').value = '';
            document.getElementById('goalUnit').value = 'تقرير';
            const modal = new bootstrap.Modal(document.getElementById('editGoalModal'));
            modal.show();
        });
    }

    updateActiveFilter(clickedElement) {
        // Remove active class from all siblings
        clickedElement.parentElement.querySelectorAll('.dropdown-item').forEach(item => {
            item.classList.remove('active');
        });
        // Add active class to clicked element
        clickedElement.classList.add('active');
    }

    async loadDashboard() {
        try {
            await Promise.all([
                this.loadGoals(),
                this.loadDeviceModels(),
                this.loadWarrantyAlerts()
            ]);
        } catch (error) {
            console.error('Error loading dashboard:', error);
        }
    }

    async loadBannerGoal() {
        try {
            // Get token from multiple sources
            let token = null;
            if (this.authMiddleware) {
                token = this.authMiddleware.getAdminToken();
            } else if (typeof authMiddleware !== 'undefined') {
                token = authMiddleware.getAdminToken();
            } else {
                // Fallback to direct localStorage access
                token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
            }
            
            console.log('Token for banner goal request:', token ? 'Present' : 'Missing');
            
            const baseUrl = window.config?.api?.baseUrl || 'https://reports.laapak.com';
            const response = await fetch(`${baseUrl}/api/goals/current`, {
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const goal = await response.json();
            
            if (goal) {
                const progress = (goal.current / goal.target) * 100;
                document.getElementById('banner-goal-progress').style.width = `${Math.min(progress, 100)}%`;
                document.getElementById('banner-goal-current').textContent = goal.current;
                document.getElementById('banner-goal-target').textContent = goal.target;
            }
        } catch (error) {
            console.error('Error loading banner goal:', error);
        }
    }

    async loadDeviceModels() {
        const container = document.getElementById('deviceModelsContainer');
        const sortBy = document.getElementById('deviceSortBy')?.value || 'count';
        const limit = document.getElementById('deviceLimit')?.value || 10;

        // Validate period - only allow supported periods
        const supportedPeriods = ['week', 'month', 'quarter', 'year'];
        const period = supportedPeriods.includes(this.currentPeriod) ? this.currentPeriod : 'month';

        try {
            // Get token from multiple sources
            let token = null;
            if (this.authMiddleware) {
                token = this.authMiddleware.getAdminToken();
            } else if (typeof authMiddleware !== 'undefined') {
                token = authMiddleware.getAdminToken();
            } else {
                // Fallback to direct localStorage access
                token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
            }
            
            const baseUrl = window.config?.api?.baseUrl || 'https://reports.laapak.com';
            const params = new URLSearchParams({
                period: period,
                sortBy,
                limit
            });
            const apiUrl = `${baseUrl}/api/reports/insights/device-models?${params}`;
            
            console.log('Token for device models request:', token ? 'Present' : 'Missing');
            console.log('Requesting device models with period:', period);
            console.log('Device models API URL:', apiUrl);
            console.log('Query params:', { period, sortBy, limit });
            
            const response = await fetch(apiUrl, {
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('Device models data received from backend:', data);

            // Handle different response formats
            let deviceModels = [];
            let totalDevices = 0;
            
            if (data.deviceModels && Array.isArray(data.deviceModels)) {
                deviceModels = data.deviceModels;
                totalDevices = data.totalDevices || deviceModels.reduce((sum, device) => sum + (device.count || 0), 0);
            } else if (Array.isArray(data)) {
                deviceModels = data;
                totalDevices = deviceModels.reduce((sum, device) => sum + (device.count || 0), 0);
            } else {
                console.error('Unexpected device models data format:', data);
                throw new Error('Invalid data format received from server');
            }

            this.renderDeviceModels({ deviceModels, totalDevices });
            this.updateDevicePeriodInfo({ totalDevices });
        } catch (error) {
            console.error('Error loading device models:', error);
            if (container) {
                container.innerHTML = '<div class="text-center text-danger">خطأ في تحميل البيانات</div>';
            }
        }
    }

    renderDeviceModels(data) {
        const container = document.getElementById('deviceModelsContainer');
        
        console.log('Rendering device models:', data);

        if (!data.deviceModels || data.deviceModels.length === 0) {
            container.innerHTML = '<div class="text-center text-muted py-4">لا توجد بيانات متاحة</div>';
            return;
        }

        const html = data.deviceModels.map((device, index) => {
            const trendIcon = device.trend_direction === 'up' ? 'fa-arrow-up text-success' : 
                            device.trend_direction === 'down' ? 'fa-arrow-down text-danger' : 
                            'fa-minus text-muted';
            
            const trendClass = device.trend_direction === 'up' ? 'text-success' : 
                             device.trend_direction === 'down' ? 'text-danger' : 'text-muted';
            
            const count = (device.count === null || device.count === undefined) ? 0 : device.count;
            console.log(`Device: ${device.device_model}, Count: ${count}, Raw device data:`, device);
            return `
                <div class="d-flex justify-content-between align-items-center mb-3 p-3 border rounded-3 bg-light bg-opacity-50">
                    <div class="d-flex align-items-center">
                        <div class="me-3">
                            <div class="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center" style="width: 40px; height: 40px;">
                                <span class="fw-bold text-primary">${index + 1}</span>
                            </div>
                        </div>
                        <div>
                            <h6 class="mb-1 fw-bold">${device.device_model || 'غير محدد'}</h6>
                            <small class="text-muted">${count} جهاز مباع</small>
                        </div>
                    </div>
                    <div class="text-end">
                        <div class="d-flex align-items-center">
                            <i class="fas ${trendIcon} me-2"></i>
                            <span class="badge ${trendClass} bg-opacity-10">${device.trend || device.trend_percentage || 0}%</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = html;
    }

    updateDevicePeriodInfo(data) {
        const infoElement = document.getElementById('devicePeriodInfo');
        const periodNames = {
            week: 'الأسبوع الحالي',
            month: 'الشهر الحالي',
            quarter: 'الربع الحالي',
            year: 'السنة الحالية',
            custom: 'الفترة المخصصة'
        };
        
        infoElement.textContent = `${periodNames[this.currentPeriod]} - إجمالي: ${data.totalDevices} جهاز`;
    }

    async loadWarrantyAlerts() {
        const container = document.getElementById('warrantyAlertsContainer');
        const warrantyType = document.getElementById('warrantyType')?.value || 'all';
        const sortBy = document.getElementById('warrantySortBy')?.value || 'urgency';

        // Validate days ahead - only allow supported values
        const supportedDays = [3, 7, 14, 30];
        const daysAhead = supportedDays.includes(this.currentDaysAhead) ? this.currentDaysAhead : 7;

        try {
            // Get token from multiple sources
            let token = null;
            if (this.authMiddleware) {
                token = this.authMiddleware.getAdminToken();
            } else if (typeof authMiddleware !== 'undefined') {
                token = authMiddleware.getAdminToken();
            } else {
                // Fallback to direct localStorage access
                token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
            }
            
            console.log('Token for warranty alerts request:', token ? 'Present' : 'Missing');
            console.log('Requesting warranty alerts with days ahead:', daysAhead);
            
            const baseUrl = window.config?.api?.baseUrl || 'https://reports.laapak.com';
            const params = new URLSearchParams({
                daysAhead: daysAhead,
                warrantyType,
                sortBy
            });

            const response = await fetch(`${baseUrl}/api/reports/insights/warranty-alerts?${params}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();

            this.renderWarrantyAlerts(data);
            this.updateWarrantyPeriodInfo(data);
        } catch (error) {
            console.error('Error loading warranty alerts:', error);
            if (container) {
                container.innerHTML = '<div class="text-center text-danger">خطأ في تحميل البيانات</div>';
            }
        }
    }

    renderWarrantyAlerts(data) {
        const container = document.getElementById('warrantyAlertsContainer');
        
        if (!data.alerts || data.alerts.length === 0) {
            container.innerHTML = '<div class="text-center text-muted py-4">لا توجد تنبيهات ضمان</div>';
            return;
        }

        // Group by urgency level
        const criticalAlerts = data.alerts.filter(alert => alert.urgency_level === 'critical');
        const highAlerts = data.alerts.filter(alert => alert.urgency_level === 'high');
        const mediumAlerts = data.alerts.filter(alert => alert.urgency_level === 'medium');

        let html = '';

        // Critical alerts
        if (criticalAlerts.length > 0) {
            html += '<div class="mb-3"><h6 class="text-danger fw-bold"><i class="fas fa-exclamation-circle me-1"></i>حرجة</h6>';
            html += this.renderAlertGroup(criticalAlerts, 'danger');
            html += '</div>';
        }

        // High alerts
        if (highAlerts.length > 0) {
            html += '<div class="mb-3"><h6 class="text-warning fw-bold"><i class="fas fa-exclamation-triangle me-1"></i>عالية</h6>';
            html += this.renderAlertGroup(highAlerts, 'warning');
            html += '</div>';
        }

        // Medium alerts
        if (mediumAlerts.length > 0) {
            html += '<div class="mb-3"><h6 class="text-info fw-bold"><i class="fas fa-info-circle me-1"></i>متوسطة</h6>';
            html += this.renderAlertGroup(mediumAlerts, 'info');
            html += '</div>';
        }

        container.innerHTML = html;
    }

    renderAlertGroup(alerts, alertClass) {
        return alerts.map(alert => `
            <div class="alert alert-${alertClass} alert-dismissible fade show mb-3 border-0 shadow-sm" role="alert">
                <div class="d-flex justify-content-between align-items-start">
                    <div class="d-flex align-items-center">
                        <div class="me-3">
                            <div class="bg-${alertClass} bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center" style="width: 35px; height: 35px;">
                                <i class="fas fa-exclamation-triangle text-${alertClass}"></i>
                            </div>
                        </div>
                        <div>
                            <strong class="d-block">${alert.client_name}</strong>
                            <small class="text-muted">${alert.device_model} - ${alert.warranty_type}</small>
                        </div>
                    </div>
                    <div class="text-end">
                        <span class="badge bg-${alertClass} rounded-pill">${alert.days_remaining} يوم</span>
                    </div>
                </div>
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `).join('');
    }

    updateWarrantyPeriodInfo(data) {
        const infoElement = document.getElementById('warrantyPeriodInfo');
        const warrantyTypeNames = {
            all: 'جميع أنواع الضمان',
            manufacturing: 'ضمان التصنيع',
            replacement: 'ضمان الاستبدال',
            maintenance: 'ضمان الصيانة'
        };
        
        infoElement.textContent = `${warrantyTypeNames[data.warranty_type_filter]} - ${data.total_alerts} تنبيه خلال ${data.days_ahead} أيام`;
    }

    async editBannerGoal() {
        try {
            // Clear the form first
            document.getElementById('goalId').value = '';
            document.getElementById('goalTitle').value = '';
            document.getElementById('goalType').value = 'reports';
            document.getElementById('goalPeriod').value = 'monthly';
            document.getElementById('goalTarget').value = '';
            document.getElementById('goalUnit').value = 'تقرير';

            // Get current goal data first
            const token = typeof authMiddleware !== 'undefined' ? authMiddleware.getAdminToken() : null;
            const baseUrl = window.config?.api?.baseUrl || 'https://reports.laapak.com';
            const response = await fetch(`${baseUrl}/api/goals/current`, {
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                }
            });

            if (response.ok) {
                const goal = await response.json();
                
                // Populate modal fields
                document.getElementById('goalTitle').value = goal.title || '';
                document.getElementById('goalType').value = goal.type || 'reports';
                document.getElementById('goalPeriod').value = goal.period || 'monthly';
                document.getElementById('goalTarget').value = goal.target || '';
                document.getElementById('goalUnit').value = goal.unit || 'تقرير';
            } else {
                // Set default values if no current goal
                document.getElementById('goalTitle').value = 'هدف الشهر';
                document.getElementById('goalType').value = 'reports';
                document.getElementById('goalPeriod').value = 'monthly';
                document.getElementById('goalTarget').value = '15';
                document.getElementById('goalUnit').value = 'تقرير';
            }

            // Open goal edit modal
            const modal = new bootstrap.Modal(document.getElementById('editGoalModal'));
            modal.show();
        } catch (error) {
            console.error('Error loading current goal for edit:', error);
            
            // Set default values on error
            document.getElementById('goalTitle').value = 'هدف الشهر';
            document.getElementById('goalType').value = 'reports';
            document.getElementById('goalPeriod').value = 'monthly';
            document.getElementById('goalTarget').value = '15';
            document.getElementById('goalUnit').value = 'تقرير';
            
            // Open modal anyway
            const modal = new bootstrap.Modal(document.getElementById('editGoalModal'));
            modal.show();
        }
    }

    showGoalDialogError(message) {
        let feedback = document.getElementById('goalDialogFeedback');
        if (!feedback) {
            feedback = document.createElement('div');
            feedback.id = 'goalDialogFeedback';
            feedback.className = 'alert alert-danger mt-2';
            const modalBody = document.querySelector('#editGoalModal .modal-body');
            if (modalBody) modalBody.prepend(feedback);
        }
        feedback.textContent = message;
        feedback.style.display = 'block';
    }

    async saveGoal() {
        try {
            const goalId = document.getElementById('goalId')?.value;
            const title = document.getElementById('goalTitle')?.value;
            const type = document.getElementById('goalType')?.value;
            const period = document.getElementById('goalPeriod')?.value;
            const targetRaw = document.getElementById('goalTarget')?.value;
            const unit = document.getElementById('goalUnit')?.value;
            const target = parseInt(targetRaw);

            // Debug log for payload
            console.log('Goal payload:', { title, type, target, unit, period });

            const feedback = document.getElementById('goalDialogFeedback');
            if (feedback) feedback.style.display = 'none';

            // Enhanced validation
            const validTypes = ['reports', 'clients', 'revenue', 'custom'];
            const validPeriods = ['monthly', 'quarterly', 'yearly'];
            if (!title || !type || !unit || !period || isNaN(target) || target < 1 || !validTypes.includes(type) || !validPeriods.includes(period)) {
                this.showGoalDialogError('يرجى ملء جميع الحقول المطلوبة بشكل صحيح');
                return;
            }

            // Get token from multiple sources
            let token = null;
            if (this.authMiddleware) {
                token = this.authMiddleware.getAdminToken();
            } else if (typeof authMiddleware !== 'undefined') {
                token = authMiddleware.getAdminToken();
            } else {
                token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
            }

            const baseUrl = window.config?.api?.baseUrl || 'https://reports.laapak.com';
            
            // Determine if this is an edit or new goal
            const isEdit = goalId && goalId.trim() !== '';
            const url = isEdit ? `${baseUrl}/api/goals/${goalId}` : `${baseUrl}/api/goals`;
            const method = isEdit ? 'PUT' : 'POST';
            
            const body = JSON.stringify({
                title,
                type,
                target,
                unit,
                period
            });
            
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body
            });

            if (!response.ok) {
                let errorMsg = 'خطأ في حفظ الهدف';
                try {
                    const err = await response.json();
                    if (err.details && Array.isArray(err.details)) {
                        errorMsg = err.details.join(', ');
                    } else {
                        errorMsg = err.message || errorMsg;
                    }
                } catch {}
                this.showGoalDialogError(errorMsg);
                throw new Error(errorMsg);
            }

            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('editGoalModal'));
            if (modal) {
                modal.hide();
            }

            // Clear the form
            document.getElementById('goalId').value = '';
            document.getElementById('goalTitle').value = '';
            document.getElementById('goalType').value = 'reports';
            document.getElementById('goalPeriod').value = 'monthly';
            document.getElementById('goalTarget').value = '';
            document.getElementById('goalUnit').value = 'تقرير';

            // Reload goals
            this.loadGoals();
            this.loadBannerGoal();

            alert('تم حفظ الهدف بنجاح');
        } catch (error) {
            console.error('Error saving goal:', error);
        }
    }

    async loadGoals() {
        try {
            // Get token from multiple sources
            let token = null;
            if (this.authMiddleware) {
                token = this.authMiddleware.getAdminToken();
            } else if (typeof authMiddleware !== 'undefined') {
                token = authMiddleware.getAdminToken();
            } else {
                // Fallback to direct localStorage access
                token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
            }
            
            console.log('Token for goals request:', token ? 'Present' : 'Missing');
            
            const baseUrl = window.config?.api?.baseUrl || 'https://reports.laapak.com';
            const response = await fetch(`${baseUrl}/api/goals`, {
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const goals = await response.json();
            this.renderGoals(goals);
        } catch (error) {
            console.error('Error loading goals:', error);
            const container = document.getElementById('goalsContainer');
            if (container) {
                container.innerHTML = '<div class="text-center text-danger">خطأ في تحميل الأهداف</div>';
            }
        }
    }



    renderGoals(goals) {
        const container = document.getElementById('goalsContainer');
        if (!container) return;

        if (!goals || goals.length === 0) {
            container.innerHTML = '<div class="text-center text-muted">لا توجد أهداف محددة</div>';
            return;
        }

        // Find the banner goal (isBanner)
        const bannerGoalId = goals.find(g => g.isBanner)?.id;

        const periodLabels = {
            monthly: 'شهري',
            quarterly: 'ربع سنوي',
            yearly: 'سنوي'
        };

        const html = goals.map(goal => `
            <div class="card mb-3 border-0 shadow-sm${goal.id === bannerGoalId ? ' border-primary' : ''}">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <h6 class="card-title mb-0">
                            ${goal.title}
                            ${goal.id === bannerGoalId ? '<span class="badge bg-primary ms-2">هدف البانر</span>' : ''}
                        </h6>
                        <div class="dropdown">
                            <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
                                <i class="fas fa-ellipsis-v"></i>
                            </button>
                            <ul class="dropdown-menu">
                                <li><a class="dropdown-item" href="#" onclick="editGoal(${goal.id})">
                                    <i class="fas fa-edit me-2"></i>تعديل
                                </a></li>
                                <li><a class="dropdown-item text-danger" href="#" onclick="deleteGoal(${goal.id})">
                                    <i class="fas fa-trash me-2"></i>حذف
                                </a></li>
                                ${goal.id !== bannerGoalId ? `<li><a class="dropdown-item text-primary" href="#" onclick="setBannerGoal(${goal.id})"><i class="fas fa-bullseye me-2"></i>تعيين كهدف البانر</a></li>` : ''}
                            </ul>
                        </div>
                    </div>
                    <div class="mb-2"><span class="badge bg-secondary">${periodLabels[goal.period] || ''}</span></div>
                    ${goal.description ? `<p class="card-text small text-muted">${goal.description}</p>` : ''}
                    <div class="progress mb-2" style="height: 8px;">
                        <div class="progress-bar bg-primary" role="progressbar" 
                             style="width: ${Math.min((goal.current / goal.target) * 100, 100)}%"></div>
                    </div>
                    <div class="d-flex justify-content-between small">
                        <span>${goal.current} / ${goal.target}</span>
                        <span>${Math.round((goal.current / goal.target) * 100)}%</span>
                    </div>
                </div>
            </div>
        `).join('');

        container.innerHTML = html;
    }



    // ... existing methods for goals and achievements ...
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    new AdminDashboard();
});

// Global functions for goal and achievement management
async function editGoal(goalId) {
    try {
        const token = typeof authMiddleware !== 'undefined' ? authMiddleware.getAdminToken() : null;
        const baseUrl = window.config?.api?.baseUrl || 'https://reports.laapak.com';
        const response = await fetch(`${baseUrl}/api/goals/${goalId}`, {
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token
            }
        });
        const goal = await response.json();
        
        // Check if modal elements exist before populating
        const goalIdInput = document.getElementById('goalId');
        const goalTitle = document.getElementById('goalTitle');
        const goalType = document.getElementById('goalType');
        const goalPeriod = document.getElementById('goalPeriod');
        const goalTarget = document.getElementById('goalTarget');
        const goalUnit = document.getElementById('goalUnit');
        const editGoalModal = document.getElementById('editGoalModal');
        
        if (!goalIdInput || !goalTitle || !goalType || !goalPeriod || !goalTarget || !goalUnit || !editGoalModal) {
            console.error('Edit goal modal elements not found');
            alert('خطأ في تحميل نافذة التعديل');
            return;
        }
        
        // Populate edit modal
        goalIdInput.value = goal.id || '';
        goalTitle.value = goal.title || '';
        goalType.value = goal.type || 'reports';
        goalPeriod.value = goal.period || 'monthly';
        goalTarget.value = goal.target || '';
        goalUnit.value = goal.unit || 'تقرير';
        
        console.log('Populated goal modal with:', { 
            id: goal.id, 
            title: goal.title, 
            type: goal.type, 
            period: goal.period, 
            target: goal.target, 
            unit: goal.unit 
        });
        
        // Show modal
        const modal = new bootstrap.Modal(editGoalModal);
        modal.show();
    } catch (error) {
        console.error('Error loading goal for edit:', error);
        alert('خطأ في تحميل بيانات الهدف');
    }
}

async function deleteGoal(goalId) {
    if (!confirm('هل أنت متأكد من حذف هذا الهدف؟')) return;
    
    try {
        const token = typeof authMiddleware !== 'undefined' ? authMiddleware.getAdminToken() : null;
        const baseUrl = window.config?.api?.baseUrl || 'https://reports.laapak.com';
        const response = await fetch(`${baseUrl}/api/goals/${goalId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token
            }
        });
        
        if (response.ok) {
            alert('تم حذف الهدف بنجاح');
            location.reload();
        } else {
            alert('خطأ في حذف الهدف');
        }
    } catch (error) {
        console.error('Error deleting goal:', error);
        alert('خطأ في حذف الهدف');
    }
}

// Add global function to set banner goal
window.setBannerGoal = async function(goalId) {
    try {
        const token = typeof authMiddleware !== 'undefined' ? authMiddleware.getAdminToken() : null;
        const baseUrl = window.config?.api?.baseUrl || 'https://reports.laapak.com';
        const response = await fetch(`${baseUrl}/api/goals/${goalId}/set-banner`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token
            }
        });
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        alert('تم تعيين الهدف كهدف البانر بنجاح');
        // Reload goals and banner
        if (window.dashboard) {
            window.dashboard.loadGoals();
            window.dashboard.loadBannerGoal();
        } else {
            location.reload();
        }
    } catch (error) {
        console.error('Error setting banner goal:', error);
        alert('خطأ في تعيين هدف البانر');
    }
}

/**
 * Load dashboard statistics from API
 */
function loadDashboardStats() {
    console.log('Loading dashboard stats from API');
    
    // Get admin info from localStorage
    const adminInfo = JSON.parse(localStorage.getItem('adminInfo') || '{}');
    const authMiddleware = new AuthMiddleware();
    const token = authMiddleware.getAdminToken() || adminInfo.token || '';
    
    console.log('Admin info:', adminInfo);
    console.log('Token available:', !!token);
    
    // API base URL
    const baseUrl = window.config ? window.config.api.baseUrl : window.location.origin;
    console.log('API Base URL:', baseUrl);
    
    // Make simultaneous API requests to get statistics
    Promise.all([
        // Total reports count
        fetch(`${baseUrl}/api/reports/count`, {
            headers: {
                'x-auth-token': token
            }
        }).then(response => {
            console.log('Reports count response:', response.status, response.statusText);
            return response;
        }),
        // Total invoices count
        fetch(`${baseUrl}/api/invoices/count`, {
            headers: {
                'x-auth-token': token
            }
        }).then(response => {
            console.log('Invoices count response:', response.status, response.statusText);
            return response;
        }),
        // Total clients count
        fetch(`${baseUrl}/api/clients/count`, {
            headers: {
                'x-auth-token': token
            }
        }).then(response => {
            console.log('Clients count response:', response.status, response.statusText);
            return response;
        }),
        // Unpaid invoices count
        fetch(`${baseUrl}/api/invoices/count?paymentStatus=unpaid`, {
            headers: {
                'x-auth-token': token
            }
        }).then(response => {
            console.log('Unpaid invoices count response:', response.status, response.statusText);
            return response;
        })
    ])
    .then(responses => {
        // Check if all responses are ok
        const failedResponses = responses.filter(resp => !resp.ok);
        if (failedResponses.length > 0) {
            console.error('Failed responses:', failedResponses);
            throw new Error(`Failed to load dashboard stats: ${failedResponses.length} requests failed`);
        }
        return Promise.all(responses.map(resp => resp.json()));
    })
    .then(data => {
        console.log('Dashboard stats data:', data);
        // Process data [totalReports, totalInvoices, totalClients, unpaidInvoices]
        // Add element existence checks to prevent errors
        const totalReportsEl = document.getElementById('total-reports');
        const totalInvoicesEl = document.getElementById('total-invoices');
        const totalClientsEl = document.getElementById('total-clients');
        const pendingReportsEl = document.getElementById('pending-reports');
        
        if (totalReportsEl) totalReportsEl.textContent = data[0].count || '0';
        if (totalInvoicesEl) totalInvoicesEl.textContent = data[1].count || '0';
        if (totalClientsEl) totalClientsEl.textContent = data[2].count || '0';
        if (pendingReportsEl) pendingReportsEl.textContent = data[3].count || '0';
        
        console.log('Updated dashboard elements with data');
    })
    .catch(error => {
        console.error('Error loading dashboard stats:', error);
        
        // Set placeholder values on error (only if elements exist)
        const totalReportsEl = document.getElementById('total-reports');
        const totalInvoicesEl = document.getElementById('total-invoices');
        const totalClientsEl = document.getElementById('total-clients');
        const pendingReportsEl = document.getElementById('pending-reports');
        
        if (totalReportsEl) totalReportsEl.textContent = '0';
        if (totalInvoicesEl) totalInvoicesEl.textContent = '0';
        if (totalClientsEl) totalClientsEl.textContent = '0';
        if (pendingReportsEl) pendingReportsEl.textContent = '0';
        
        // Show error toast
        if (typeof toastr !== 'undefined') {
            toastr.error('فشل في تحميل إحصائيات لوحة التحكم');
        }
    });
}

/**
 * Load recent reports from API
 */
function loadRecentReports() {
    console.log('Loading recent reports from API');
    
    // Get admin info from localStorage
    const adminInfo = JSON.parse(localStorage.getItem('adminInfo') || '{}');
    const authMiddleware = new AuthMiddleware();
    const token = authMiddleware.getAdminToken() || adminInfo.token || '';
    
    // API base URL
    const baseUrl = window.config ? window.config.api.baseUrl : window.location.origin;
    
    // Make API request to get recent reports
    fetch(`${baseUrl}/api/reports?limit=5&sort=desc`, {
        headers: {
            'x-auth-token': token,
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to load recent reports');
        }
        return response.json();
    })
    .then(data => {
        console.log('Recent reports:', data);
        
        const reportsTable = document.getElementById('recent-reports-table');
        
        // Check if element exists before manipulating it
        if (!reportsTable) {
            console.log('Recent reports table element not found in this page');
            return;
        }
        
        // Clear loading spinner
        reportsTable.innerHTML = '';
        
        if (!data || data.length === 0) {
            reportsTable.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-4">لا توجد تقارير حديثة</td>
                </tr>
            `;
            return;
        }
        
        // Add reports to table
        data.forEach(report => {
            const statusClass = getStatusClass(report.status);
            const inspectionDateObj = new Date(report.inspection_date);
            const year = inspectionDateObj.getFullYear();
            const month = ('0' + (inspectionDateObj.getMonth() + 1)).slice(-2);
            const day = ('0' + inspectionDateObj.getDate()).slice(-2);
            const formattedDate = `${year}-${month}-${day}`;
            
            reportsTable.innerHTML += `
                <tr>
                    <td class="ps-4">${report.id}</td>
                    <td>${report.client_name}</td>
                    <td>${report.device_model}</td>
                    <td>${formattedDate}</td>
                    <td><span class="badge ${statusClass}">${translateStatus(report.status)}</span></td>
                    <td class="text-center">
                        <a href="view-report.html?id=${report.id}" class="btn btn-sm btn-outline-primary me-1">
                            <i class="fas fa-eye"></i>
                        </a>
                        <a href="edit-report.html?id=${report.id}" class="btn btn-sm btn-outline-success me-1">
                            <i class="fas fa-edit"></i>
                        </a>
                    </td>
                </tr>
            `;
        });
    })
    .catch(error => {
        console.error('Error loading recent reports:', error);
        
        const reportsTable = document.getElementById('recent-reports-table');
        reportsTable.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-4">
                    <div class="alert alert-warning mb-0">
                        <i class="fas fa-exclamation-triangle me-2"></i> تعذر تحميل التقارير
                    </div>
                </td>
            </tr>
        `;
    });
}

/**
 * Load recent invoices from API
 */
function loadRecentInvoices() {
    console.log('Loading recent invoices from API');
    
    // Get admin info from localStorage
    const adminInfo = JSON.parse(localStorage.getItem('adminInfo') || '{}');
    const authMiddleware = new AuthMiddleware();
    const token = authMiddleware.getAdminToken() || adminInfo.token || '';
    
    // API base URL
    const baseUrl = window.config ? window.config.api.baseUrl : window.location.origin;
    
    // Make API request to get recent invoices
    fetch(`${baseUrl}/api/invoices?limit=5&sort=desc`, {
        headers: {
            'x-auth-token': token,
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to load recent invoices');
        }
        return response.json();
    })
    .then(data => {
        console.log('Recent invoices:', data);
        
        const invoicesTable = document.getElementById('recent-invoices-table');
        
        // Check if element exists before manipulating it
        if (!invoicesTable) {
            console.log('Recent invoices table element not found in this page');
            return;
        }
        
        // Clear loading spinner
        invoicesTable.innerHTML = '';
        
        if (!data || data.length === 0) {
            invoicesTable.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-4">لا توجد فواتير حديثة</td>
                </tr>
            `;
            return;
        }
        
        // Add invoices to table
        // data.forEach(invoice => {
        //     const formattedDate = new Date(invoice.date).toLocaleDateString('ar-SA');
        //     const formattedAmount = invoice.total.toLocaleString('ar-SA') + ' ر.س';
            
        //     invoicesTable.innerHTML += `
        //         <tr>
        //             <td class="ps-4">${invoice.id}</td>
        //             <td>${invoice.client?.name || 'غير معروف'}</td>
        //             <td>${formattedDate}</td>
        //             <td>${formattedAmount}</td>
        //             <td><span class="badge ${getPaymentStatusClass(invoice.paymentStatus)}">${translatePaymentStatus(invoice.paymentStatus)}</span></td>
        //             <td class="text-center">
        //                 <a href="view-invoice.html?id=${invoice.id}" class="btn btn-sm btn-outline-primary me-1">
        //                     <i class="fas fa-eye"></i>
        //                 </a>
        //                 <a href="edit-invoice.html?id=${invoice.id}" class="btn btn-sm btn-outline-success me-1">
        //                     <i class="fas fa-edit"></i>
        //                 </a>
        //             </td>
        //         </tr>
        //     `;
        // });
    })
    .catch(error => {
        console.error('Error loading recent invoices:', error);
        
        const invoicesTable = document.getElementById('recent-invoices-table');
        invoicesTable.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-4">
                    <div class="alert alert-warning mb-0">
                        <i class="fas fa-exclamation-triangle me-2"></i> تعذر تحميل الفواتير
                    </div>
                </td>
            </tr>
        `;
    });
}

/**
 * Get CSS class for report status
 */
function getStatusClass(status) {
    switch(status) {
        case 'pending':
            return 'bg-warning';
        case 'in-progress':
            return 'bg-info';
        case 'completed':
            return 'bg-success';
        case 'cancelled':
            return 'bg-danger';
        case 'active':
            return 'bg-primary';
        default:
            return 'bg-secondary';
    }
}

/**
 * Get CSS class for payment status
 */
function getPaymentStatusClass(status) {
    switch(status) {
        case 'paid':
            return 'bg-success';
        case 'partial':
            return 'bg-warning';
        case 'unpaid':
            return 'bg-danger';
        default:
            return 'bg-secondary';
    }
}

/**
 * Translate report status to Arabic
 */
function translateStatus(status) {
    switch(status) {
        case 'pending':
            return 'قيد الانتظار';
        case 'in-progress':
            return 'قيد التنفيذ';
        case 'completed':
            return 'مكتمل';
        case 'cancelled':
            return 'ملغي';
        case 'active':
            return 'نشط';
        default:
            return status;
    }
}

/**
 * Translate payment status to Arabic
 */
function translatePaymentStatus(status) {
    switch(status) {
        case 'paid':
            return 'مدفوعة';
        case 'partial':
            return 'مدفوعة جزئياً';
        case 'unpaid':
            return 'غير مدفوعة';
        default:
            return status || 'غير معروف';
    }
}

/**
 * Display current date in Arabic format
 */
function displayCurrentDate() {
    const dateElement = document.getElementById('current-date');
    if (!dateElement) return;
    
    // Options for Arabic date format
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric', 
        calendar: 'gregory' 
    };
    
    // Create date in Arabic locale
    const today = new Date();
    const arabicDate = today.toLocaleDateString('ar-EG', options);
    
    // Display the date
    dateElement.textContent = arabicDate;
}

/**
 * Initialize dashboard charts
 */
function initializeCharts() {
    // Get admin token for API requests
    const adminInfo = JSON.parse(localStorage.getItem('adminInfo') || '{}');
    const authMiddleware = new AuthMiddleware();
    const token = authMiddleware.getAdminToken() || adminInfo.token || '';
    const baseUrl = window.config ? window.config.api.baseUrl : window.location.origin;
    
    // Performance chart - Line chart for reports and invoices
    const performanceChartCanvas = document.getElementById('performanceChart');
    if (performanceChartCanvas) {
        // Last 6 months in Arabic
        const months = [
            'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
            'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
        ];
        
        // Get last 6 months
        const currentMonth = new Date().getMonth();
        const last6Months = [];
        const last6MonthsDate = [];
        
        for (let i = 5; i >= 0; i--) {
            const monthIndex = (currentMonth - i + 12) % 12;
            last6Months.push(months[monthIndex]);
            
            // Create date objects for API query
            const date = new Date();
            date.setMonth(currentMonth - i);
            date.setDate(1); // First day of month
            date.setHours(0, 0, 0, 0);
            last6MonthsDate.push(date);
        }
        
        // Get report and invoice counts by month
        const reportsPromises = [];
        const invoicesPromises = [];
        
        // For each month, query the API for reports and invoices created in that month
        last6MonthsDate.forEach((startDate, index) => {
            // Calculate end date (first day of next month)
            const endDate = new Date(startDate);
            endDate.setMonth(endDate.getMonth() + 1);
            
            // Query for reports in this month
            const reportPromise = fetch(`${baseUrl}/api/reports/count?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`, {
                headers: {
                    'x-auth-token': token
                }
            }).then(res => res.json());
            
            // Query for invoices in this month
            const invoicePromise = fetch(`${baseUrl}/api/invoices/count?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`, {
                headers: {
                    'x-auth-token': token
                }
            }).then(res => res.json());
            
            reportsPromises.push(reportPromise);
            invoicesPromises.push(invoicePromise);
        });
        
        // Process all the data and create the chart
        Promise.all([Promise.all(reportsPromises), Promise.all(invoicesPromises)])
            .then(([reportResults, invoiceResults]) => {
                // Extract counts from results
                const reportsData = reportResults.map(result => result.count || 0);
                const invoicesData = invoiceResults.map(result => result.count || 0);
                
                // Create the chart
                new Chart(performanceChartCanvas, {
                    type: 'line',
                    data: {
                        labels: last6Months,
                        datasets: [
                            {
                                label: 'التقارير',
                                data: reportsData,
                                borderColor: '#007553',
                                backgroundColor: 'rgba(0, 117, 83, 0.1)',
                                borderWidth: 2,
                                pointBackgroundColor: '#007553',
                                tension: 0.4,
                                fill: true
                            },
                            {
                                label: 'الفواتير',
                                data: invoicesData,
                                borderColor: '#0d6efd',
                                backgroundColor: 'rgba(13, 110, 253, 0.1)',
                                borderWidth: 2,
                                pointBackgroundColor: '#0d6efd',
                                tension: 0.4,
                                fill: true
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'top',
                                align: 'end',
                                labels: {
                                    boxWidth: 10,
                                    usePointStyle: true,
                                    pointStyle: 'circle'
                                }
                            },
                            tooltip: {
                                mode: 'index',
                                intersect: false,
                                rtl: true,
                                titleAlign: 'right',
                                bodyAlign: 'right'
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                grid: {
                                    drawBorder: false,
                                    display: true,
                                    drawOnChartArea: true,
                                    drawTicks: false,
                                    borderDash: [5, 5]
                                },
                                ticks: {
                                    display: true,
                                    padding: 10,
                                    color: '#b2b9bf',
                                    font: {
                                        size: 11,
                                        family: 'Cairo, sans-serif',
                                        style: 'normal',
                                        lineHeight: 2
                                    }
                                }
                            },
                            x: {
                                grid: {
                                    drawBorder: false,
                                    display: false,
                                    drawOnChartArea: false,
                                    drawTicks: false,
                                    borderDash: [5, 5]
                                },
                                ticks: {
                                    display: true,
                                    color: '#b2b9bf',
                                    padding: 20,
                                    font: {
                                        size: 11,
                                        family: 'Cairo, sans-serif',
                                        style: 'normal',
                                        lineHeight: 2
                                    }
                                }
                            }
                        }
                    }
                });
            })
            .catch(error => {
                console.error('Error loading chart data:', error);
                // Show error message on the chart
                new Chart(performanceChartCanvas, {
                    type: 'line',
                    data: {
                        labels: last6Months,
                        datasets: []
                    },
                    options: {
                        plugins: {
                            title: {
                                display: true,
                                text: 'فشل في تحميل البيانات',
                                color: '#dc3545',
                                font: {
                                    size: 14,
                                    family: 'Cairo, sans-serif'
                                }
                            }
                        }
                    }
                });
            });
    }
    
    // Invoice Status Chart - Doughnut chart
    const invoiceStatusChartCanvas = document.getElementById('invoiceStatusChart');
    if (invoiceStatusChartCanvas) {
        // Fetch real invoice data by payment status
        Promise.all([
            // Paid invoices
            fetch(`${baseUrl}/api/invoices/count?paymentStatus=paid`, {
                headers: {
                    'x-auth-token': token
                }
            }),
            // Partially paid invoices
            fetch(`${baseUrl}/api/invoices/count?paymentStatus=partial`, {
                headers: {
                    'x-auth-token': token
                }
            }),
            // Unpaid invoices
            fetch(`${baseUrl}/api/invoices/count?paymentStatus=unpaid`, {
                headers: {
                    'x-auth-token': token
                }
            })
        ])
        .then(responses => {
            // Check if all responses are ok
            const failedResponses = responses.filter(resp => !resp.ok);
            if (failedResponses.length > 0) {
                throw new Error(`Failed to load invoice status data: ${failedResponses.length} requests failed`);
            }
            return Promise.all(responses.map(resp => resp.json()));
        })
        .then(data => {
            // Extract counts from results [paid, partial, unpaid]
            const invoiceStatusData = data.map(result => result.count || 0);
            
            // Create the chart
            new Chart(invoiceStatusChartCanvas, {
                type: 'doughnut',
                data: {
                    labels: ['مدفوعة', 'مدفوعة جزئياً', 'غير مدفوعة'],
                    datasets: [{
                        data: invoiceStatusData,
                        backgroundColor: ['#198754', '#ffc107', '#dc3545'],
                        borderWidth: 0,
                        cutout: '75%',
                        borderRadius: 5
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                padding: 15,
                                usePointStyle: true,
                                pointStyle: 'circle'
                            }
                        },
                        tooltip: {
                            rtl: true,
                            titleAlign: 'right',
                            bodyAlign: 'right'
                        }
                    }
                }
            });
        })
        .catch(error => {
            console.error('Error loading invoice status data:', error);
            // Show error message on the chart
            new Chart(invoiceStatusChartCanvas, {
                type: 'doughnut',
                data: {
                    labels: [],
                    datasets: []
                },
                options: {
                    plugins: {
                        title: {
                            display: true,
                            text: 'فشل في تحميل البيانات',
                            color: '#dc3545',
                            font: {
                                size: 14,
                                family: 'Cairo, sans-serif'
                            }
                        }
                    }
                }
            });
        });
    }
}

/**
 * Load goals and achievements
 */
function loadGoalsAndAchievements() {
    console.log('Loading goals and achievements');
    
    const authMiddleware = new AuthMiddleware();
    const token = authMiddleware.getAdminToken();
    const baseUrl = window.config ? window.config.api.baseUrl : window.location.origin;
    
    console.log('Goals API - Token:', !!token, 'Base URL:', baseUrl);
    
    // Load current goal
    console.log('Fetching current goal from:', `${baseUrl}/api/goals/current`);
    fetch(`${baseUrl}/api/goals/current`, {
        headers: {
            'x-auth-token': token
        }
    })
    .then(response => {
        console.log('Goal response status:', response.status, response.statusText);
        if (!response.ok) {
            throw new Error(`Failed to load goal: ${response.status} ${response.statusText}`);
        }
        return response.json();
    })
    .then(goal => {
        console.log('Goal data received:', goal);
        displayGoal(goal);
    })
    .catch(error => {
        console.error('Error loading goal:', error);
        displayGoalError();
    });
    
    // Load achievements
    console.log('Fetching achievements from:', `${baseUrl}/api/goals/achievements`);
    fetch(`${baseUrl}/api/goals/achievements`, {
        headers: {
            'x-auth-token': token
        }
    })
    .then(response => {
        console.log('Achievements response status:', response.status, response.statusText);
        if (!response.ok) {
            throw new Error(`Failed to load achievements: ${response.status} ${response.statusText}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Achievements data received:', data);
        displayAchievements(data.achievements, data.newAchievements);
    })
    .catch(error => {
        console.error('Error loading achievements:', error);
        displayAchievementsError();
    });
}

/**
 * Display goal information
 */
function displayGoal(goal) {
    const goalContent = document.getElementById('goalContent');
    if (!goalContent) return;
    
    const progress = Math.min((goal.current / goal.target) * 100, 100);
    const progressClass = progress >= 100 ? 'bg-success' : progress >= 75 ? 'bg-warning' : 'bg-primary';
    
    goalContent.innerHTML = `
        <div class="text-center mb-4">
            <h4 class="fw-bold text-primary mb-2">${goal.title}</h4>
            <div class="d-flex justify-content-between align-items-center mb-2">
                <span class="text-muted">التقدم</span>
                <span class="fw-bold">${goal.current} / ${goal.target} ${goal.unit}</span>
            </div>
            <div class="progress mb-3" style="height: 10px;">
                <div class="progress-bar ${progressClass}" role="progressbar" 
                     style="width: ${progress}%" 
                     aria-valuenow="${progress}" 
                     aria-valuemin="0" 
                     aria-valuemax="100">
                </div>
            </div>
            <div class="d-flex justify-content-between">
                <small class="text-muted">0</small>
                <small class="text-muted">${goal.target}</small>
            </div>
        </div>
        <div class="text-center">
            <p class="text-muted mb-0">
                ${progress >= 100 ? '🎉 تم تحقيق الهدف!' : 
                  progress >= 75 ? '🔥 أنت قريب من الهدف!' : 
                  '💪 استمر في العمل الجيد!'}
            </p>
        </div>
    `;
    
    // Store current goal data for editing
    window.currentGoal = goal;
}

/**
 * Display goal error
 */
function displayGoalError() {
    const goalContent = document.getElementById('goalContent');
    if (!goalContent) return;
    
    goalContent.innerHTML = `
        <div class="text-center py-4">
            <i class="fas fa-exclamation-triangle text-warning fa-2x mb-3"></i>
            <p class="text-muted">تعذر تحميل الهدف</p>
        </div>
    `;
}

/**
 * Display achievements
 */
function displayAchievements(achievements, newAchievements = []) {
    const achievementsContent = document.getElementById('achievementsContent');
    if (!achievementsContent) return;
    
    if (!achievements || achievements.length === 0) {
        achievementsContent.innerHTML = `
            <div class="text-center py-4">
                <i class="fas fa-trophy text-muted fa-2x mb-3"></i>
                <p class="text-muted">لا توجد إنجازات بعد</p>
            </div>
        `;
        return;
    }
    
    let achievementsHtml = '';
    
    // Show new achievements first
    if (newAchievements && newAchievements.length > 0) {
        achievementsHtml += `
            <div class="alert alert-success mb-3">
                <i class="fas fa-star me-2"></i>
                <strong>إنجازات جديدة!</strong>
            </div>
        `;
    }
    
    // Display achievements
    achievements.forEach(achievement => {
        const isNew = newAchievements.some(newAchievement => newAchievement.id === achievement.id);
        const badgeClass = isNew ? 'badge-success' : 'badge-secondary';
        
        achievementsHtml += `
            <div class="d-flex align-items-center mb-3 p-3 rounded" 
                 style="background-color: ${achievement.color}15; border-left: 4px solid ${achievement.color};">
                <div class="me-3">
                    <i class="${achievement.icon}" style="color: ${achievement.color}; font-size: 1.5rem;"></i>
                </div>
                <div class="flex-grow-1">
                    <h6 class="mb-1 fw-bold">${achievement.title}</h6>
                    <p class="text-muted mb-1 small">${achievement.description || ''}</p>
                    <div class="d-flex align-items-center">
                        <span class="badge ${badgeClass} me-2">${achievement.value}</span>
                        <small class="text-muted">${achievement.metric}</small>
                    </div>
                </div>
                ${isNew ? '<span class="badge bg-success">جديد</span>' : ''}
            </div>
        `;
    });
    
    achievementsContent.innerHTML = achievementsHtml;
}