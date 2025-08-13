/**
 * Update Database Schema Script
 * This script updates the role ENUM values in the admins table
 */

const { sequelize } = require('../config/db');

async function updateDatabaseSchema() {
    try {
        console.log('🔄 Starting database schema update...');
        
        // Connect to database
        await sequelize.authenticate();
        console.log('✅ Database connection established');
        
        // Check current ENUM values
        console.log('📋 Checking current role ENUM values...');
        const [currentEnum] = await sequelize.query(`
            SELECT COLUMN_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'laapak_report_system' 
            AND TABLE_NAME = 'admins' 
            AND COLUMN_NAME = 'role'
        `);
        
        console.log('Current role ENUM:', currentEnum[0]?.COLUMN_TYPE);
        
        // Update the ENUM values
        console.log('🔄 Updating role ENUM values...');
        await sequelize.query(`
            ALTER TABLE \`admins\` 
            MODIFY COLUMN \`role\` ENUM('admin', 'superadmin') NOT NULL DEFAULT 'admin'
        `);
        
        console.log('✅ Role ENUM updated successfully');
        
        // Verify the change
        console.log('📋 Verifying the change...');
        const [newEnum] = await sequelize.query(`
            SELECT COLUMN_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'laapak_report_system' 
            AND TABLE_NAME = 'admins' 
            AND COLUMN_NAME = 'role'
        `);
        
        console.log('New role ENUM:', newEnum[0]?.COLUMN_TYPE);
        
        console.log('✅ Database schema update completed successfully!');
        
    } catch (error) {
        console.error('❌ Error updating database schema:', error);
        throw error;
    } finally {
        // Close database connection
        await sequelize.close();
        console.log('🔌 Database connection closed');
    }
}

// Run the script if called directly
if (require.main === module) {
    updateDatabaseSchema()
        .then(() => {
            console.log('🎉 Schema update completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Schema update failed:', error);
            process.exit(1);
        });
}

module.exports = { updateDatabaseSchema }; 