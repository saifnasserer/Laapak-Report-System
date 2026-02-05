const { sequelize } = require('../../config/db');
const { QueryTypes } = require('sequelize');

async function addAlertColumn() {
    try {
        console.log('Checking database connection...');
        await sequelize.authenticate();
        console.log('Database connected.');

        // Check if column exists
        const [results] = await sequelize.query(
            "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'laapak_report_system' AND TABLE_NAME = 'reports' AND COLUMN_NAME = 'warranty_alerts_log';",
            { type: QueryTypes.SELECT }
        );

        if (results && results.length > 0) {
            console.log("Column 'warranty_alerts_log' already exists. Skipping.");
        } else {
            console.log("Adding 'warranty_alerts_log' column to 'reports' table...");
            await sequelize.query(
                "ALTER TABLE reports ADD COLUMN warranty_alerts_log JSON DEFAULT NULL;"
            );
            console.log("Column added successfully.");
        }

    } catch (error) {
        console.error('Migration Error:', error);
    } finally {
        await sequelize.close();
    }
}

addAlertColumn();
