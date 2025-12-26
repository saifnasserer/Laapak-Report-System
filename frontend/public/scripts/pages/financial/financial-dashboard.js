/**
 * Laapak Financial Dashboard
 * Handles week-navigation, data fetching, and chart rendering.
 */

document.addEventListener('DOMContentLoaded', () => {
    initDashboard();
});

let currentStartDate = new Date();
let currentEndDate = new Date();
let charts = {};

function initDashboard() {
    // 1. Initialize Month Navigator (Defaults to current month)
    setInitialMonth();

    // 2. Bind Events
    document.getElementById('prevWeekBtn').addEventListener('click', () => changeMonth(-1));
    document.getElementById('nextWeekBtn').addEventListener('click', () => changeMonth(1));

    // 3. Initial Data Load
    loadDashboardData();
}

/**
 * Sets the initial month range (1st to last day of current month)
 */
function setInitialMonth() {
    const today = new Date();

    // Start of current month
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    start.setHours(0, 0, 0, 0);

    // End of current month (or today if we're mid-month)
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const end = lastDayOfMonth > today ? today : lastDayOfMonth;
    end.setHours(23, 59, 59, 999);

    currentStartDate = start;
    currentEndDate = end;

    updateMonthDisplay();
}

function changeMonth(offset) {
    // Move to next/previous month
    currentStartDate = new Date(currentStartDate.getFullYear(), currentStartDate.getMonth() + offset, 1);
    currentStartDate.setHours(0, 0, 0, 0);

    // End of that month
    const lastDay = new Date(currentStartDate.getFullYear(), currentStartDate.getMonth() + 1, 0);
    const today = new Date();

    // If it's the current month, cap at today
    if (currentStartDate.getMonth() === today.getMonth() && currentStartDate.getFullYear() === today.getFullYear()) {
        currentEndDate = today;
    } else {
        currentEndDate = lastDay;
    }
    currentEndDate.setHours(23, 59, 59, 999);

    updateMonthDisplay();
    loadDashboardData();
}

function updateMonthDisplay() {
    const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    const monthName = monthNames[currentStartDate.getMonth()];
    const year = currentStartDate.getFullYear();
    document.getElementById('currentWeekDisplay').textContent = `${monthName} ${year}`;
}

async function loadDashboardData() {
    setLoadingState(true);

    try {
        // Format dates for API: YYYY-MM-DD
        const start = currentStartDate.toISOString().split('T')[0];
        const end = currentEndDate.toISOString().split('T')[0];

        console.log(`Fetching dashboard data for: ${start} to ${end}`);

        // Get authentication token
        const token = authMiddleware.getAdminToken();
        if (!token) {
            console.error('No authentication token found');
            throw new Error('Not authenticated');
        }

        // Fetch Financial Dashboard Data (Single Endpoint)
        const dashboardRes = await fetch(`/api/financial/dashboard?startDate=${start}&endDate=${end}`, {
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token
            }
        });
        const response = await dashboardRes.json();

        console.log('Dashboard API Response:', response);

        if (response.success && response.data) {
            const data = response.data;
            const kpis = data.kpis;

            // Update KPI Cards with proper field mapping
            // Backend returns: totalRevenue, totalExpenses (operating), totalCost (product costs), netProfit, profitMargin
            updateKPI('totalRevenue', kpis.totalRevenue || 0);

            // For "Total Expenses" display, we want operating expenses (not product costs)
            updateKPI('totalExpenses', kpis.totalExpenses || 0);

            updateKPI('netProfit', kpis.netProfit || 0);

            // Profit margin comes as a number (e.g., 25.5), format as percentage
            const marginValue = kpis.profitMargin ? kpis.profitMargin.toFixed(1) + '%' : '0%';
            updateKPI('profitMargin', marginValue);

            // Update change indicators using backend data if available
            const changes = data.changes || {};
            updateChangeIndicator('revenueChange', changes.revenue || 0);
            updateChangeIndicator('expenseChange', changes.expenses || 0);
            updateChangeIndicator('profitChange', changes.profit || 0);
            updateChangeIndicator('marginChange', changes.margin || 0);


            // Render Charts
            if (data.charts && data.charts.trend && data.charts.trend.length > 0) {
                const trendLabels = data.charts.trend.map(item => item.month);
                const trendRevenue = data.charts.trend.map(item => item.revenue || 0);
                const trendExpenses = data.charts.trend.map(item => item.expenses || 0);

                renderTrendChart({
                    labels: trendLabels,
                    revenue: trendRevenue,
                    expenses: trendExpenses
                });
            } else {
                console.warn('No trend data available');
            }

            // Expense Chart
            if (data.charts && data.charts.expenseBreakdown && data.charts.expenseBreakdown.length > 0) {
                const expenseLabels = data.charts.expenseBreakdown.map(item => item.category_name);
                const expenseValues = data.charts.expenseBreakdown.map(item => item.total);
                const expenseColors = data.charts.expenseBreakdown.map(item => item.color);

                renderExpenseChart({
                    labels: expenseLabels,
                    values: expenseValues,
                    colors: expenseColors
                });
            } else {
                console.warn('No expense breakdown data available');
            }

            // Load Notifications with the dashboard data
            loadNotifications(data);
        } else {
            console.error('Dashboard API returned unsuccessful response:', response);
            // Load empty notifications on error
            loadNotifications(null);
        }

    } catch (error) {
        console.error('Error loading dashboard data:', error);
        // Show error state to user
        document.getElementById('totalRevenue').textContent = 'خطأ';
        document.getElementById('totalExpenses').textContent = 'خطأ';
        document.getElementById('netProfit').textContent = 'خطأ';
        document.getElementById('profitMargin').textContent = 'خطأ';
    } finally {
        setLoadingState(false);
    }
}

function updateKPI(elementId, value) {
    const el = document.getElementById(elementId);
    if (el) {
        // If value is already formatted as string (like "25.5%"), use it directly
        if (typeof value === 'string') {
            el.textContent = value;
        } else {
            el.textContent = formatCurrency(value);
        }
    }
}

function updateChangeIndicator(elementId, changePercent) {
    const el = document.getElementById(elementId);
    if (el) {
        const parent = el.closest('.kpi-trend');
        if (parent) {
            // Show/hide based on whether we have data
            if (changePercent === 0) {
                parent.style.opacity = '0.3'; // Dim it when no change
            } else {
                parent.style.opacity = '1';

                // Update color based on positive/negative
                parent.classList.remove('positive', 'negative');
                if (changePercent > 0) {
                    parent.classList.add('positive');
                } else if (changePercent < 0) {
                    parent.classList.add('negative');
                }
            }
        }

        // Format the percentage
        const formatted = changePercent > 0 ? `+${changePercent.toFixed(1)}%` : `${changePercent.toFixed(1)}%`;
        el.textContent = formatted;
    }
}

function formatCurrency(value) {
    if (typeof value === 'string' && value.includes('%')) return value;
    const num = parseFloat(value) || 0;
    // Format without decimals if it's a whole number
    return new Intl.NumberFormat('ar-EG', {
        style: 'currency',
        currency: 'EGP',
        minimumFractionDigits: 0,
        maximumFractionDigits: num % 1 === 0 ? 0 : 2
    }).format(num);
}

function renderTrendChart(data) {
    const ctx = document.getElementById('trendChart').getContext('2d');

    if (charts.trend) charts.trend.destroy();

    charts.trend = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.labels,
            datasets: [{
                label: 'الإيرادات',
                data: data.revenue,
                borderColor: '#007553', // Brand Primary
                backgroundColor: 'rgba(0, 117, 83, 0.1)',
                fill: true,
                tension: 0.4
            }, {
                label: 'المصروفات',
                data: data.expenses,
                borderColor: '#dc3545',
                borderDash: [5, 5],
                tension: 0.4,
                fill: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top', align: 'end', labels: { font: { family: 'Tajawal' } } }
            },
            scales: {
                y: { beginAtZero: true, grid: { color: '#f0f0f0' } },
                x: { grid: { display: false } }
            }
        }
    });
}

function renderExpenseChart(data) {
    const ctx = document.getElementById('expenseChart').getContext('2d');

    if (charts.expense) charts.expense.destroy();

    charts.expense = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: data.labels,
            datasets: [{
                data: data.values,
                backgroundColor: data.colors || [
                    '#007553', '#198754', '#20c997', '#ffc107', '#dc3545', '#6c757d'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { font: { family: 'Tajawal' }, padding: 20 } }
            },
            cutout: '70%'
        }
    });
}

async function loadNotifications(dashboardData) {
    const container = document.getElementById('notificationsContainer');

    try {
        const alerts = dashboardData?.alerts || [];
        const kpis = dashboardData?.kpis || {};

        // Build notification cards
        const notifications = [];

        // Invoice count for the month
        if (kpis.invoiceCount !== undefined) {
            notifications.push({
                type: 'info',
                icon: 'fa-file-invoice',
                title: 'فواتير هذا الشهر',
                message: `${kpis.invoiceCount} فاتورة`,
                color: 'primary'
            });
        }

        // Items needing cost entry
        if (kpis.itemsWithoutCost && kpis.itemsWithoutCost > 0) {
            notifications.push({
                type: 'warning',
                icon: 'fa-exclamation-triangle',
                title: 'تنبيه: منتجات بدون تكلفة',
                message: `${kpis.itemsWithoutCost} منتج يحتاج إدخال سعر التكلفة`,
                color: 'warning',
                action: {
                    text: 'مراجعة',
                    link: 'financial-profit-management.html'
                }
            });
        }

        // Add backend alerts with proper handling
        alerts.forEach(alert => {
            // Determine title based on message content or use a default
            let title = 'تنبيه';
            let message = alert.message || alert;

            // If alert is just a string, use it as message
            if (typeof alert === 'string') {
                message = alert;
                // Try to extract a title from the message
                if (message.includes('فواتير بدون تكاليف')) {
                    title = 'تنبيه: فواتير تحتاج مراجعة';
                } else if (message.includes('منتجات بدون سعر تكلفة')) {
                    title = 'تنبيه: منتجات بدون تكلفة';
                }
            } else {
                // If it's an object, use its title or generate one
                title = alert.title || title;
            }

            notifications.push({
                type: alert.type || 'info',
                icon: alert.icon || 'fa-info-circle',
                title: title,
                message: message,
                color: alert.type === 'warning' ? 'warning' : alert.type === 'danger' ? 'danger' : 'info'
            });
        });

        if (notifications.length === 0) {
            container.innerHTML = '<div class="col-12 text-center py-3 text-muted">لا توجد تنبيهات</div>';
            return;
        }

        container.innerHTML = notifications.map(notif => `
            <div class="col-md-6 mb-3">
                <div class="alert alert-${notif.color} d-flex align-items-center mb-0" role="alert">
                    <i class="fas ${notif.icon} me-3 fs-4"></i>
                    <div class="flex-grow-1">
                        <strong>${notif.title}</strong>
                        <div class="small">${notif.message}</div>
                    </div>
                    ${notif.action ? `
                        <a href="${notif.action.link}" class="btn btn-sm btn-outline-${notif.color} ms-2">
                            ${notif.action.text}
                        </a>
                    ` : ''}
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading notifications:', error);
        container.innerHTML = '<div class="col-12 text-danger">فشل تحميل التنبيهات</div>';
    }
}

function setLoadingState(isLoading) {
    // Optional: Add global loading overlay or spinner logic
    const spinner = document.querySelector('.spinner-border');
    if (spinner) spinner.style.display = isLoading ? 'inline-block' : 'none';
}
