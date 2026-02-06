const { Sequelize } = require('sequelize');
const config = require('./config/config');

// Initialize Sequelize with database configuration
const sequelize = new Sequelize(
    config.dbName || 'laapak_db',
    config.dbUser || 'root',
    config.dbPassword || '',
    {
        host: config.dbHost || 'localhost',
        dialect: 'mysql',
        logging: console.log
    }
);

async function migrate() {
    try {
        await sequelize.authenticate();
        console.log('Database connection established successfully.');

        const queryInterface = sequelize.getQueryInterface();
        const tableDescription = await queryInterface.describeTable('clients');

        if (!tableDescription.company_name) {
            console.log('Adding company_name column...');
            await queryInterface.addColumn('clients', 'company_name', {
                type: Sequelize.STRING,
                allowNull: true
            });
        }

        if (!tableDescription.tax_number) {
            console.log('Adding tax_number column...');
            await queryInterface.addColumn('clients', 'tax_number', {
                type: Sequelize.STRING,
                allowNull: true
            });
        }

        if (!tableDescription.notes) {
            console.log('Adding notes column...');
            await queryInterface.addColumn('clients', 'notes', {
                type: Sequelize.TEXT,
                allowNull: true
            });
        }

        console.log('Migration completed successfully.');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await sequelize.close();
    }
}

migrate();
