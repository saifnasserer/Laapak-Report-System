const { Invoice, Expense, InvoiceItem, Report, Client } = require('../../models');
const { Op } = require('sequelize');
const notifier = require('../../utils/notifier');
const { sequelize } = require('../../config/db');

async function sendDailySummary() {
    try {
        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0));
        const endOfDay = new Date(today.setHours(23, 59, 59, 999));

        const formatDateForDB = (date) => date.toISOString().split('T')[0];
        const todayStr = formatDateForDB(startOfDay);

        console.log(`Starting Daily Summary for ${todayStr}...`);

        // 1. Calculate Revenue
        const invoices = await Invoice.findAll({
            where: {
                date: { [Op.between]: [startOfDay, endOfDay] },
                paymentStatus: ['paid', 'completed']
            }
        });

        let totalRevenue = 0;
        invoices.forEach(inv => {
            totalRevenue += parseFloat(inv.total) || 0;
        });

        // 2. Calculate Expenses
        const expenses = await Expense.findAll({
            where: {
                date: { [Op.between]: [startOfDay, endOfDay] },
                status: ['approved', 'paid'],
                type: 'variable'
            }
        });

        let totalExpenses = 0;
        expenses.forEach(exp => {
            totalExpenses += parseFloat(exp.amount) || 0;
        });

        // 3. Calculate Pending Orders for the current month
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const pendingInvoices = await Invoice.findAll({
            where: {
                date: { [Op.between]: [firstDayOfMonth, endOfDay] },
                paymentStatus: { [Op.in]: ['pending', 'unpaid', 'partial'] }
            }
        });

        let pendingAmount = 0;
        pendingInvoices.forEach(inv => {
            pendingAmount += parseFloat(inv.total) || 0;
        });

        // 4. Calculate Pending Reports for the month (Tasks)
        const pendingReports = await Report.findAll({
            where: {
                inspection_date: { [Op.between]: [firstDayOfMonth, endOfDay] },
                status: { [Op.notIn]: ['completed', 'مكتمل', 'cancelled', 'ملغى', 'canceled'] }
            },
            include: [{ model: Client, as: 'client', attributes: ['name'] }],
            limit: 5
        });

        // 5. Calculate Profit (Simplified for daily summary)
        const netProfit = totalRevenue - totalExpenses;

        // 6. Construct Message
        let message = `📊 *ملخص الأعمال اليومي (${todayStr})*\n\n` +
            `💰 *الإيرادات:* ${totalRevenue.toLocaleString()} ج.م\n` +
            `💸 *المصروفات:* ${totalExpenses.toLocaleString()} ج.م\n` +
            `📈 *صافي الربح اليومي:* ${netProfit.toLocaleString()} ج.م\n\n`;

        if (pendingReports.length > 0) {
            message += `✅ *مهام بانتظار التنفيذ (تقارير هذا الشهر):*\n`;
            pendingReports.forEach(rpt => {
                message += `• ${rpt.device_model} - ${rpt.client?.name || 'غير معروف'}\n`;
            });
            message += `\n`;
        }

        message += `⚠️ *فواتير معلقة (هذا الشهر):*\n` +
            `• *المبلغ المعلق:* ${pendingAmount.toLocaleString()} ج.م\n` +
            `• *العدد:* ${pendingInvoices.length} فاتورة\n\n` +
            `📝 *نشاط اليوم:* ${invoices.length} فواتير، ${expenses.length} مصروفات.\n\n` +
            `_تم الإنشاء بواسطة نظام لابك_`;

        // 5. Send to Management (Owner's number from instance fetch was 201013148007)
        const managerNumber = '201013148007'; // User's number from instance
        await notifier.sendText(managerNumber, message);

        console.log('Daily Summary sent successfully!');
    } catch (error) {
        console.error('Daily Summary Cron Error:', error);
    }
}

// Run if called directly
if (require.main === module) {
    sendDailySummary();
}

module.exports = sendDailySummary;
