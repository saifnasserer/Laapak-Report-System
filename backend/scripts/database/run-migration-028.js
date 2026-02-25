const { sequelize } = require('../../config/db');

async function migrate() {
    console.log('Starting migration 028: Add supplier_id to product_costs and expenses...');
    try {
        // Update product_costs
        console.log('Updating product_costs table...');
        await sequelize.query('ALTER TABLE product_costs ADD COLUMN supplier_id INT NULL AFTER cost_price');
        await sequelize.query('ALTER TABLE product_costs ADD CONSTRAINT fk_product_cost_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL');

        // Update expenses
        console.log('Updating expenses table...');
        await sequelize.query('ALTER TABLE expenses ADD COLUMN supplier_id INT NULL AFTER money_location_id');
        await sequelize.query('ALTER TABLE expenses ADD CONSTRAINT fk_expense_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL');

        console.log('Migration successful.');
    } catch (error) {
        if (error.original && error.original.errno === 1060) {
            console.log('One or more columns already exist.');
        } else {
            console.error('Migration failed:', error);
            process.exit(1);
        }
    }
    process.exit(0);
}

migrate();
