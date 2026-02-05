const { sequelize } = require('../../config/db');
const { QueryTypes } = require('sequelize');

async function markSecondAlertAsSent() {
    try {
        console.log('Checking database connection...');
        await sequelize.authenticate();
        console.log('Database connected.');

        // Find the report for اسامة محمد with phone 01090353891
        const [report] = await sequelize.query(
            `SELECT id, client_name, client_phone, device_model, inspection_date, warranty_alerts_log 
             FROM reports 
             WHERE client_phone LIKE '%01090353891%' OR client_name LIKE '%اسامة محمد%'
             ORDER BY inspection_date DESC 
             LIMIT 1;`,
            { type: QueryTypes.SELECT }
        );

        if (!report) {
            console.log("No report found for اسامة محمد (01090353891).");
            return;
        }

        console.log(`Found report ID: ${report.id} for ${report.client_name} (${report.client_phone})`);

        // Update the warranty_alerts_log to mark the alert as sent
        const alertLog = {
            six_month: new Date().toISOString(),
            annual: null
        };

        await sequelize.query(
            `UPDATE reports 
             SET warranty_alerts_log = :alertLog 
             WHERE id = :reportId;`,
            {
                replacements: {
                    alertLog: JSON.stringify(alertLog),
                    reportId: report.id
                }
            }
        );

        console.log(`✅ Marked warranty alert as sent for report ID: ${report.id}`);
        console.log(`Alert log:`, alertLog);

    } catch (error) {
        console.error('Script Error:', error);
    } finally {
        await sequelize.close();
    }
}

markSecondAlertAsSent();
