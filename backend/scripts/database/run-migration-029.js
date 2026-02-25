const { sequelize } = require('../../config/db');

async function migrate() {
    console.log('Starting migration 029: Add device_price to reports table...');
    try {
        await sequelize.query('ALTER TABLE reports ADD COLUMN device_price DECIMAL(10, 2) DEFAULT 0 AFTER amount');
        console.log('Migration successful: device_price added to reports table.');
    } catch (error) {
        if (error.original && error.original.errno === 1060) {
            console.log('Column device_price already exists.');
        } else {
            console.error('Migration failed:', error);
            process.exit(1);
        }
    }
    process.exit(0);
}

migrate();
