const { Report, Client } = require('../../models');
const { Op } = require('sequelize');
const notifier = require('../../utils/notifier');

async function sendWarrantyAlerts() {
    try {
        const currentDate = new Date();
        const sevenDaysFromNow = new Date(currentDate);
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

        console.log(`Checking for maintenance warranties ending between ${currentDate.toISOString().split('T')[0]} and ${sevenDaysFromNow.toISOString().split('T')[0]}...`);

        const reports = await Report.findAll({
            include: [{
                model: Client,
                as: 'client',
                attributes: ['id', 'name', 'phone']
            }],
            where: {
                status: ['completed', 'مكتمل']
            }
        });

        let notificationsSent = 0;

        for (const report of reports) {
            const inspectionDate = new Date(report.inspection_date);

            // Maintenance dates
            const m6 = new Date(inspectionDate); m6.setMonth(m6.getMonth() + 6);
            const m12 = new Date(inspectionDate); m12.setFullYear(m12.getFullYear() + 1);

            const warranties = [
                { type: '6-Month Maintenance', date: m6 },
                { type: 'Annual Maintenance', date: m12 }
            ];

            for (const w of warranties) {
                // Check if warranty date is exactly 7 days from now (to avoid duplicate alerts)
                // Or just within range if running weekly
                if (w.date >= currentDate && w.date <= sevenDaysFromNow) {
                    const phone = report.client_phone || report.client?.phone;
                    if (!phone) continue;

                    const message = `🛠️ *Maintenance Reminder*\n\n` +
                        `Hi ${report.client_name || 'Customer'},\n\n` +
                        `Your *${w.type}* for your device (*${report.device_model}*) is due on *${w.date.toISOString().split('T')[0]}*.\n\n` +
                        `Regular maintenance ensures your device stays in top condition. Please contact us to schedule your service.\n\n` +
                        `_Best regards, Laapak Service Team_`;

                    await notifier.sendText(phone, message);
                    notificationsSent++;
                }
            }
        }

        console.log(`Warranty Alerts Completed. Sent: ${notificationsSent}`);
    } catch (error) {
        console.error('Warranty Alert Cron Error:', error);
    }
}

// Run if called directly
if (require.main === module) {
    sendWarrantyAlerts();
}

module.exports = sendWarrantyAlerts;
