const { sequelize } = require('../../config/db');

async function migrate() {
    console.log('Starting migration: Add supplier_id to reports table...');
    try {
        // Add supplier_id column
        await sequelize.query('ALTER TABLE reports ADD COLUMN supplier_id INT NULL AFTER payment_method');

        // Add foreign key constraint
        await sequelize.query('ALTER TABLE reports ADD CONSTRAINT fk_report_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL');

        console.log('Migration successful: supplier_id added to reports table.');
    } catch (error) {
        if (error.original && error.original.errno === 1060) {
            console.log('Column supplier_id already exists.');
        } else {
            console.error('Migration failed:', error);
            process.exit(1);
        }
    }
    process.exit(0);
}

migrate();
