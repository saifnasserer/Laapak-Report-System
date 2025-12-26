const { sequelize } = require('../../config/db');
const ExpectedItem = require('../../models/ExpectedItem'); // Import the model
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

async function updateEnum() {
    try {
        console.log('Connecting to database...');
        console.log(`Using DB Host: ${process.env.DB_HOST}`);
        console.log(`Using DB Name: ${process.env.DB_NAME}`);

        await sequelize.authenticate();
        console.log('Database connected.');

        // 1. Check Table Existence & detailed info
        console.log('--- Debugging Table Info ---');
        const [tables] = await sequelize.query('SHOW TABLES');
        console.log('Tables:', tables.map(r => Object.values(r)[0]));

        try {
            const [createTable] = await sequelize.query("SHOW CREATE TABLE `expected_items`");
            console.log('Create Table SQL:', createTable[0]['Create Table']);
        } catch (e) {
            console.error('Failed to SHOW CREATE TABLE:', e.message);
        }
        console.log('----------------------------');

        console.log('Updating ExpectedItem schema using sync({ alter: true })...');

        // Use Sequelize Sync to handle the ALTER
        // This compares the model definition (which has 'liability') with the DB
        await ExpectedItem.sync({ alter: true });

        console.log('✅ Successfully synced ExpectedItem model. ENUM should now include "liability".');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error updating database:', error);

        // Fallback: Try raw SQL with explicit backticks if sync fails
        try {
            console.log('Attempting fallback raw SQL with backticks...');
            await sequelize.query("ALTER TABLE `expected_items` MODIFY COLUMN `type` ENUM('expected_payment', 'work_in_progress', 'inventory_item', 'liability') NOT NULL COMMENT 'Type of expected item'");
            console.log('✅ Fallback SQL successful.');
            process.exit(0);
        } catch (fallbackError) {
            console.error('❌ Fallback SQL also failed:', fallbackError.message);
            process.exit(1);
        }
    }
}

updateEnum();
