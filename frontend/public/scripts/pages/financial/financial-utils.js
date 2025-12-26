/**
 * Laapak Report System - Financial Utils
 * Shared utility functions for financial pages
 */

const FinancialUtils = {
    /**
     * Format number as currency (EGP)
     * Removes .00 decimals for whole numbers
     * @param {number|string} amount - The amount to format
     * @returns {string} Formatted currency string
     */
    formatCurrency: function (amount) {
        const num = parseFloat(amount) || 0;
        return new Intl.NumberFormat('ar-EG', {
            style: 'currency',
            currency: 'EGP',
            minimumFractionDigits: 0,
            maximumFractionDigits: num % 1 === 0 ? 0 : 2
        }).format(num);
    },

    /**
     * Format date string
     * @param {string} dateString - The date string to format
     * @param {object} options - Intl.DateTimeFormat options
     * @returns {string} Formatted date string
     */
    formatDate: function (dateString, options = { year: 'numeric', month: 'short', day: 'numeric' }) {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('ar-EG', options);
    },

    /**
     * Get HTML badge for items status/type
     * @param {string} type - The status or type key
     * @param {string} category - 'status' or 'type' or 'movement'
     * @returns {string} HTML string for the badge
     */
    getBadgeHtml: function (key, category = 'status') {
        const configs = {
            // Status badges
            status: {
                'pending': { class: 'bg-warning text-dark', icon: 'fa-clock', text: 'في الانتظار' },
                'in_progress': { class: 'bg-info text-white', icon: 'fa-spinner fa-spin', text: 'قيد التنفيذ' },
                'completed': { class: 'bg-success', icon: 'fa-check', text: 'مكتمل' },
                'cancelled': { class: 'bg-danger', icon: 'fa-times', text: 'ملغي' },
                'paid': { class: 'bg-success', icon: 'fa-check-circle', text: 'مدفوع' },
                'unpaid': { class: 'bg-danger', icon: 'fa-times-circle', text: 'غير مدفوع' },
                'partially_paid': { class: 'bg-warning', icon: 'fa-adjust', text: 'مدفوع جزئياً' }
            },
            // Item Type badges
            type: {
                'expected_payment': { class: 'bg-primary', icon: 'fa-money-bill-wave', text: 'دفعة متوقعة' },
                'work_in_progress': { class: 'bg-info text-dark', icon: 'fa-tools', text: 'عمل جاري' },
                'inventory_item': { class: 'bg-secondary', icon: 'fa-box', text: 'مخزون' }
            },
            // Movement Type badges
            movement: {
                'deposit': { class: 'bg-success', icon: 'fa-arrow-down', text: 'إيداع' },
                'withdrawal': { class: 'bg-danger', icon: 'fa-arrow-up', text: 'سحب' },
                'transfer': { class: 'bg-info text-dark', icon: 'fa-exchange-alt', text: 'تحويل' }
            }
        };

        const config = configs[category]?.[key] || { class: 'bg-secondary', icon: 'fa-question', text: key };

        return `<span class="badge ${config.class} d-inline-flex align-items-center gap-2">
            <i class="fas ${config.icon}"></i> ${config.text}
        </span>`;
    }
};

// Export to window for browser usage
window.FinancialUtils = FinancialUtils;
