const { sequelize } = require('./backend/config/db');

async function checkSchema() {
    try {
        const [results] = await sequelize.query('DESCRIBE clients');
        console.log('Schema for clients table:');
        console.table(results);
    } catch (error) {
        console.error('Error describing clients table:', error);
    } finally {
        await sequelize.close();
    }
}

checkSchema();
