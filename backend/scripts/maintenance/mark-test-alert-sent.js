const { sequelize } = require('../../config/db');
const { QueryTypes } = require('sequelize');

async function markAlertAsSent() {
    try {
        console.log('Checking database connection...');
        await sequelize.authenticate();
        console.log('Database connected.');

        // Get the first report that has warranty ending soon
        const [report] = await sequelize.query(
            `SELECT id, client_name, device_model, inspection_date, warranty_alerts_log 
             FROM reports 
             WHERE inspection_date IS NOT NULL 
             ORDER BY inspection_date DESC 
             LIMIT 1;`,
            { type: QueryTypes.SELECT }
        );

        if (!report) {
            console.log("No reports found.");
            return;
        }

        console.log(`Found report ID: ${report.id} for ${report.client_name}`);

        // Update the warranty_alerts_log to mark the 6-month alert as sent
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

        console.log(`✅ Marked 6-month warranty alert as sent for report ID: ${report.id}`);
        console.log(`Alert log:`, alertLog);

    } catch (error) {
        console.error('Script Error:', error);
    } finally {
        await sequelize.close();
    }
}

markAlertAsSent();
