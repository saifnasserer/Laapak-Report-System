/**
 * Laapak Profit Management Logic
 * Handles week-navigation, invoice listing, and detailed cost editing via modal.
 */

document.addEventListener('DOMContentLoaded', () => {
    initProfitManager();
});

let currentStartDate = new Date();
let currentEndDate = new Date();
let invoicesData = [];
let isReviewMode = false;
let invoiceDetailsModal = null;
let costModal = null;

function initProfitManager() {
    setInitialWeek();

    // Initialize Modals
    invoiceDetailsModal = new bootstrap.Modal(document.getElementById('invoiceDetailsModal'));
    costModal = new bootstrap.Modal(document.getElementById('costModal'));

    // Bind Controls
    document.getElementById('prevWeekBtn').addEventListener('click', () => changeWeek(-1));
    document.getElementById('nextWeekBtn').addEventListener('click', () => changeWeek(1));

    document.getElementById('reviewModeToggle').addEventListener('change', (e) => {
        isReviewMode = e.target.checked;
        renderTable();
    });

    document.getElementById('searchInput').addEventListener('input', (e) => {
        renderTable(e.target.value);
    });

    document.getElementById('costForm').addEventListener('submit', handleCostSubmit);

    loadProfitData();
}

function setInitialWeek() {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - today.getDay()); // Sunday as start (adjust if needed)
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    currentStartDate = start;
    currentEndDate = end;

    updateWeekDisplay();
}

function changeWeek(offset) {
    currentStartDate.setDate(currentStartDate.getDate() + (offset * 7));
    currentEndDate.setDate(currentEndDate.getDate() + (offset * 7));
    updateWeekDisplay();
    loadProfitData();
}

function updateWeekDisplay() {
    const options = { month: 'short', day: 'numeric' };
    const startStr = currentStartDate.toLocaleDateString('ar-EG', options);
    const endStr = currentEndDate.toLocaleDateString('ar-EG', options);
    document.getElementById('currentWeekDisplay').textContent = `${startStr} - ${endStr}`;
}

async function loadProfitData() {
    const tbody = document.getElementById('dataTableBody');
    tbody.innerHTML = '<tr><td colspan="8" class="text-center py-5"><div class="spinner-border text-secondary"></div></td></tr>';

    try {
        const start = currentStartDate.toISOString().split('T')[0];
        const end = currentEndDate.toISOString().split('T')[0];

        // Get authentication token
        const token = authMiddleware.getAdminToken();
        if (!token) {
            throw new Error('No token, authorization denied');
        }

        // Correct API Endpoint with auth header
        const res = await fetch(`/api/financial/profit-management?type=invoices&startDate=${start}&endDate=${end}&limit=100`, {
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token
            }
        });
        const response = await res.json();

        if (response.success) {
            invoicesData = response.data.items;
            updateSummaryStats();
            renderTable();
        } else {
            throw new Error(response.message);
        }

    } catch (error) {
        console.error('Error loading profit data:', error);
        tbody.innerHTML = '<tr><td colspan="8" class="text-center text-danger py-4">فشل تحميل البيانات. حاول مرة أخرى.</td></tr>';
    }
}

function updateSummaryStats() {
    const totalRev = invoicesData.reduce((sum, inv) => sum + (inv.total || 0), 0);
    const totalCost = invoicesData.reduce((sum, inv) => sum + (inv.total_cost || 0), 0);
    const profit = totalRev - totalCost;

    document.getElementById('weekRevenue').textContent = formatCurrency(totalRev);
    document.getElementById('weekCosts').textContent = formatCurrency(totalCost);
    document.getElementById('weekProfit').textContent = formatCurrency(profit);
}

function renderTable(searchTerm = '') {
    const tbody = document.getElementById('dataTableBody');
    let filtered = invoicesData;

    // Filter 1: Search
    if (searchTerm) {
        filtered = filtered.filter(inv => inv.client_name.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    // Filter 2: Review Mode (Show items where total_cost is 0 or low compared to total)
    if (isReviewMode) {
        filtered = filtered.filter(inv => !inv.total_cost || inv.total_cost === 0);
    }

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center py-4 text-muted">لا يوجد بيانات للعرض</td></tr>';
        return;
    }

    tbody.innerHTML = filtered.map(inv => {
        const hasMissingCost = !inv.total_cost || inv.total_cost === 0;
        const statusBadge = `<span class="badge ${inv.payment_status === 'paid' || inv.payment_status === 'completed' ? 'bg-success' : 'bg-warning'}">${translateStatus(inv.payment_status)}</span>`;

        return `
        <tr class="${isReviewMode && hasMissingCost ? 'bg-light-warning' : ''} align-middle">
            <td>${new Date(inv.date).toLocaleDateString('ar-EG')}</td>
            <td class="fw-bold">${inv.client_name}</td>
            <td>${inv.items_count || '-'} منتجات</td>
            <td class="fw-bold text-primary">${formatCurrency(inv.total)}</td>
            <td class="${hasMissingCost ? 'text-danger fw-bold' : ''}">${formatCurrency(inv.total_cost)}</td>
            <td class="fw-bold text-success">${formatCurrency(inv.total_profit || (inv.total - (inv.total_cost || 0)))}</td>
            <td>${statusBadge}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary" onclick="openInvoiceDetails('${inv.invoice_id}')">
                    <i class="fas fa-list"></i> تفاصيل وتكلفة
                </button>
            </td>
        </tr>
        `;
    }).join('');
}

async function openInvoiceDetails(invoiceId) {
    document.getElementById('modalInvoiceId').textContent = `#${invoiceId}`;
    const tbody = document.getElementById('invoiceItemsTableBody');
    tbody.innerHTML = '<tr><td colspan="6" class="text-center py-3"><div class="spinner-border spinner-border-sm text-secondary"></div></td></tr>';

    invoiceDetailsModal.show();

    try {
        const token = authMiddleware.getAdminToken();
        const res = await fetch(`/api/financial/invoice/${invoiceId}/items`, {
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token
            }
        });
        const response = await res.json();

        console.log('Invoice items response:', response);
        console.log('Items data:', response.data);

        if (response.success) {
            renderInvoiceItems(response.data);
        } else {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">فشل تحميل المنتجات</td></tr>';
        }
    } catch (e) {
        console.error('Error fetching invoice items:', e);
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">خطأ في الاتصال</td></tr>';
    }
}

function renderInvoiceItems(items) {
    const tbody = document.getElementById('invoiceItemsTableBody');
    if (!items || items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">لا يوجد منتجات</td></tr>';
        return;
    }

    tbody.innerHTML = items.map(item => `
        <tr>
            <td>
                <div class="fw-bold">${item.item_description}</div>
                ${item.serialNumber ? `<small class="text-muted">${item.serialNumber}</small>` : ''}
            </td>
            <td>${item.quantity}</td>
            <td>${formatCurrency(item.sale_price)}</td>
            <td>
                 ${item.cost_price !== null && item.cost_price !== undefined
            ? `<span class="fw-bold">${formatCurrency(item.cost_price)}</span>`
            : '<span class="badge bg-danger">غير محدد</span>'}
            </td>
            <td class="text-success fw-bold">${formatCurrency(item.profit_amount || 0)}</td>
            <td>
                <button class="btn btn-sm btn-outline-secondary" 
                    onclick="openCostModal(${item.item_id}, '${item.item_description.replace(/'/g, "\\'")}', ${item.cost_price || 0})">
                    <i class="fas fa-edit"></i> تعديل
                </button>
            </td>
        </tr>
    `).join('');
}

window.openInvoiceDetails = openInvoiceDetails;

window.openCostModal = function (itemId, itemName, currentCost) {
    document.getElementById('costItemId').value = itemId;
    document.getElementById('costItemName').value = itemName;
    document.getElementById('itemCost').value = currentCost || '';

    // Hide details modal temporarily or stack them? Bootstrap supports stacked modals.
    // Let's keep detail modal open.
    costModal.show();
}

async function handleCostSubmit(e) {
    e.preventDefault();
    const itemId = document.getElementById('costItemId').value;
    const newCost = document.getElementById('itemCost').value;

    const btn = e.submitter;
    const originalText = btn.innerHTML;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> جاري الحفظ...';
    btn.disabled = true;

    try {
        const token = authMiddleware.getAdminToken();
        const res = await fetch(`/api/financial/invoice-items/${itemId}/cost`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token
            },
            body: JSON.stringify({ cost_price: newCost })
        });

        if (res.ok) {
            costModal.hide();
            // Refresh details modal content
            // Need invoice ID. Wait, we don't have it easily here unless we store it.
            // But we can just reload the current open invoice details using the ID from the modal title or store it.
            const invoiceId = document.getElementById('modalInvoiceId').textContent.replace('#', '');
            if (invoiceId) openInvoiceDetails(invoiceId);

            // Also reload main table data in background to update totals
            loadProfitData();
        } else {
            alert('حدث خطأ أثناء حفظ التكلفة');
        }
    } catch (error) {
        console.error(error);
        alert('فشل الاتصال بالخادم');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

function formatCurrency(val) {
    const num = parseFloat(val) || 0;
    return new Intl.NumberFormat('ar-EG', {
        style: 'currency',
        currency: 'EGP',
        minimumFractionDigits: 0,
        maximumFractionDigits: num % 1 === 0 ? 0 : 2
    }).format(num);

}

function translateStatus(status) {
    const map = {
        'paid': 'مدفوع',
        'completed': 'مكتمل',
        'pending': 'معلق',
        'overdue': 'متأخر'
    };
    return map[status] || status;
}
