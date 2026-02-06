const { sequelize } = require('../../config/db');

async function addAccessoriesColumn() {
    try {
        console.log('Checking for selected_accessories column in reports table...');

        // Check if column exists
        const [results] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'reports' 
      AND COLUMN_NAME = 'selected_accessories'
    `);

        if (results.length === 0) {
            console.log('Adding selected_accessories column...');
            await sequelize.query('ALTER TABLE reports ADD COLUMN selected_accessories JSON AFTER is_confirmed');
            console.log('Column selected_accessories added successfully.');
        } else {
            console.log('Column selected_accessories already exists.');
        }

    } catch (error) {
        console.error('Error adding selected_accessories column:', error);
        process.exit(1);
    } finally {
        process.exit(0);
    }
}

addAccessoriesColumn();
