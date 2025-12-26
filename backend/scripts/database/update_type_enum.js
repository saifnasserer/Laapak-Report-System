
const { sequelize } = require('../../config/db');

async function updateEnum() {
    try {
        console.log('Connecting to database...');
        await sequelize.authenticate();
        console.log('Database connected.');

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
