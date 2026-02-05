const { Report, Client } = require('../../models');
const { Op } = require('sequelize');
const notifier = require('../../utils/notifier');

// Base attributes for Report queries (same as in routes/reports.js)
const REPORT_BASE_ATTRIBUTES = [
    'id', 'client_id', 'client_name', 'client_phone', 'client_email', 'client_address',
    'order_number', 'device_model', 'serial_number', 'cpu', 'gpu', 'ram', 'storage',
    'inspection_date', 'hardware_status', 'external_images', 'notes', 'billing_enabled', 'amount',
    'invoice_created', 'invoice_id', 'invoice_date', 'status', 'admin_id',
    'created_at', 'updated_at', 'warranty_alerts_log'
];

/**
 * Get warranty alerts using the same logic as /api/reports/insights/warranty-alerts
 * This ensures consistency between the UI and the cron job
 */
async function getWarrantyAlerts() {
    const currentDate = new Date();
    const sevenDaysFromNow = new Date(currentDate);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    // Get all reports with their clients (same as endpoint)
    const reports = await Report.findAll({
        attributes: REPORT_BASE_ATTRIBUTES,
        include: [
            {
                model: Client,
                as: 'client',
                attributes: ['id', 'name', 'phone', 'email']
            }
        ],
        order: [['inspection_date', 'DESC']]
    });

    const warrantyAlerts = [];

    reports.forEach(report => {
        const inspectionDate = new Date(report.inspection_date);

        // Calculate maintenance warranty end dates (6 months and 12 months)
        const maintenance6MonthsEnd = new Date(inspectionDate);
        maintenance6MonthsEnd.setMonth(maintenance6MonthsEnd.getMonth() + 6);

        const maintenance12MonthsEnd = new Date(inspectionDate);
        maintenance12MonthsEnd.setFullYear(maintenance12MonthsEnd.getFullYear() + 1);

        // Check if maintenance warranty is ending within 7 days
        const maintenanceWarranties = [
            { type: 'maintenance_6months', endDate: maintenance6MonthsEnd, days: 180 },
            { type: 'maintenance_12months', endDate: maintenance12MonthsEnd, days: 365 }
        ];

        maintenanceWarranties.forEach(warranty => {
            if (warranty.endDate >= currentDate && warranty.endDate <= sevenDaysFromNow) {
                const daysRemaining = Math.ceil((warranty.endDate - currentDate) / (1000 * 60 * 60 * 24));

                // Check if alert was sent
                const alertKey = warranty.type === 'maintenance_12months' ? 'annual' : 'six_month';
                const sentDate = report.warranty_alerts_log ? report.warranty_alerts_log[alertKey] : null;

                warrantyAlerts.push({
                    report_id: report.id,
                    report: report, // Include full report object for updating
                    client_id: report.client_id,
                    client_name: report.client_name,
                    client_phone: report.client_phone,
                    device_model: report.device_model,
                    serial_number: report.serial_number,
                    inspection_date: report.inspection_date,
                    warranty_type: warranty.type,
                    warranty_end_date: warranty.endDate,
                    days_remaining: daysRemaining,
                    sent_at: sentDate,
                    is_sent: !!sentDate,
                    alert_key: alertKey
                });
            }
        });
    });

    // Sort by days remaining (most urgent first)
    warrantyAlerts.sort((a, b) => a.days_remaining - b.days_remaining);

    return warrantyAlerts;
}

/**
 * Send warranty alerts to urgent users only (not already sent)
 */
async function sendWarrantyAlerts() {
    try {
        console.log('🔍 Fetching warranty alerts...');

        // Get all warranty alerts using the same logic as the endpoint
        const allAlerts = await getWarrantyAlerts();

        console.log(`📊 Total alerts found: ${allAlerts.length}`);

        // Filter for urgent alerts only (≤ 3 days) that haven't been sent
        const urgentAlerts = allAlerts.filter(alert =>
            alert.days_remaining <= 3 && !alert.is_sent
        );

        console.log(`🚨 Urgent alerts (≤ 3 days, not sent): ${urgentAlerts.length}`);

        if (urgentAlerts.length === 0) {
            console.log('✅ No urgent alerts to send.');
            return;
        }

        let notificationsSent = 0;
        let notificationsFailed = 0;

        for (const alert of urgentAlerts) {
            const phone = alert.client_phone || alert.report.client?.phone;

            if (!phone) {
                console.log(`⚠️  Skipping ${alert.report_id}: No phone number`);
                notificationsFailed++;
                continue;
            }

            console.log(`📤 Sending ${alert.warranty_type} alert to ${alert.client_name} (${phone}) - ${alert.days_remaining} days remaining`);

            const wTypeArabic = alert.warranty_type === 'maintenance_12months' ? 'صيانة سنوية' : 'صيانة كل 6 أشهر';
            const warrantyEndDate = new Date(alert.warranty_end_date).toISOString().split('T')[0];

            const message = `🛠️ *تذكير بالصيانة الدورية*\n\n` +
                `أهلاً ${alert.client_name || 'عميلنا العزيز'}،\n\n` +
                `نود تذكيركم بموعد *${wTypeArabic}* لجهازكم (*${alert.device_model}*) في تاريخ *${warrantyEndDate}*.\n\n` +
                `الصيانة الدورية تضمن بقاء جهازك في حالة ممتازة وتطيل عمره الافتراضي. يرجى التواصل معنا لترتيب الموعد.\n\n` +
                `_مع تحيات فريق عمل لابك_`;

            try {
                await notifier.sendText(phone, message);

                // Update warranty_alerts_log
                const alertsLog = alert.report.warranty_alerts_log || {};
                alertsLog[alert.alert_key] = new Date().toISOString();
                await alert.report.update({ warranty_alerts_log: alertsLog });

                console.log(`✅ Sent to ${phone}`);
                notificationsSent++;
            } catch (error) {
                console.error(`❌ Failed to send to ${phone}:`, error.message);
                notificationsFailed++;
            }
        }

        console.log(`\n📊 Summary:`);
        console.log(`   ✅ Sent: ${notificationsSent}`);
        console.log(`   ❌ Failed: ${notificationsFailed}`);
        console.log(`   📋 Total urgent: ${urgentAlerts.length}`);

    } catch (error) {
        console.error('❌ Warranty Alert Cron Error:', error);
    }
}

// Run if called directly
if (require.main === module) {
    sendWarrantyAlerts().then(() => {
        console.log('✅ Warranty alerts cron completed');
        process.exit(0);
    }).catch(err => {
        console.error('❌ Warranty alerts cron failed:', err);
        process.exit(1);
    });
}

module.exports = sendWarrantyAlerts;
