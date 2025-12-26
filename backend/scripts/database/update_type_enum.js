
const { sequelize } = require('../../config/db');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') }); // Explicitly load .env from root

async function updateEnum() {
    try {
        console.log('Connecting to database...');
        console.log(`Using DB Host: ${process.env.DB_HOST}`);
        console.log(`Using DB Name: ${process.env.DB_NAME}`);

        await sequelize.authenticate();
        console.log('Database connected.');

        // List tables to debug
        const [results] = await sequelize.query('SHOW TABLES');
        console.log('Tables in database:', results.map(r => Object.values(r)[0]));

        console.log('Updating type ENUM in expected_items table...');

        // Raw SQL to modify the column
        await sequelize.query(`
            ALTER TABLE expected_items 
            MODIFY COLUMN type ENUM('expected_payment', 'work_in_progress', 'inventory_item', 'liability') NOT NULL COMMENT 'Type of expected item';
        `);

        console.log('✅ Successfully updated type ENUM to include "liability".');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error updating database:', error);
        process.exit(1);
    }
}

updateEnum();
