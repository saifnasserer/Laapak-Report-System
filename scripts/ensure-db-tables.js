/**
 * Laapak Report System - Database Tables Initialization Script
 * This script ensures that all required database tables are created
 */

const { sequelize } = require('../models');
const fs = require('fs');
const path = require('path');

// Path to SQL migration files
const migrationsPath = path.join(__dirname, '..', 'config', 'migrations');

/**
 * Execute SQL file
 * @param {string} filePath - Path to SQL file
 * @returns {Promise<void>}
 */
async function executeSqlFile(filePath) {
    try {
        console.log(`Executing SQL file: ${filePath}`);
        const sql = fs.readFileSync(filePath, 'utf8');
        
        // Split SQL by semicolons to execute multiple statements
        const statements = sql.split(';').filter(stmt => stmt.trim());
        
        for (const statement of statements) {
            if (statement.trim()) {
                await sequelize.query(statement);
            }
        }
        
        console.log(`Successfully executed SQL file: ${filePath}`);
    } catch (error) {
        console.error(`Error executing SQL file ${filePath}:`, error);
        throw error;
    }
}

/**
 * Check if table exists in database
 * @param {string} tableName - Name of table to check
 * @returns {Promise<boolean>} - True if table exists, false otherwise
 */
async function tableExists(tableName) {
    try {
        // Use raw query to check if table exists
        const [results] = await sequelize.query(`
            SELECT COUNT(*) as count 
            FROM information_schema.tables 
            WHERE table_schema = '${sequelize.config.database}' 
            AND table_name = '${tableName}'
        `);
        
        return results[0].count > 0;
    } catch (error) {
        console.error(`Error checking if table ${tableName} exists:`, error);
        return false;
    }
}

/**
 * Ensure all required tables exist
 */
async function ensureTables() {
    try {
        console.log('Checking database connection...');
        await sequelize.authenticate();
        console.log('Database connection established successfully.');
        
        // Check if reports table exists
        const reportsExists = await tableExists('reports');
        if (!reportsExists) {
            console.log('Reports table does not exist. Creating...');
            await executeSqlFile(path.join(migrationsPath, '001_create_reports_table.sql'));
        } else {
            console.log('Reports table already exists.');
        }
        
        // Check if report_technical_tests table exists
        const technicalTestsExists = await tableExists('report_technical_tests');
        if (!technicalTestsExists) {
            console.log('Report technical tests table does not exist. Creating...');
            await executeSqlFile(path.join(migrationsPath, '002_create_report_technical_tests_table.sql'));
        } else {
            console.log('Report technical tests table already exists.');
        }
        
        // Check if report_external_inspection table exists
        const externalInspectionExists = await tableExists('report_external_inspection');
        if (!externalInspectionExists) {
            console.log('Report external inspection table does not exist. Creating...');
            await executeSqlFile(path.join(migrationsPath, '003_create_report_external_inspection_table.sql'));
        } else {
            console.log('Report external inspection table already exists.');
        }
        
        console.log('All required tables exist.');
    } catch (error) {
        console.error('Error ensuring tables exist:', error);
        process.exit(1);
    } finally {
        // Close database connection
        await sequelize.close();
    }
}

// Run the function if this script is executed directly
if (require.main === module) {
    ensureTables()
        .then(() => {
            console.log('Database initialization completed successfully.');
            process.exit(0);
        })
        .catch(error => {
            console.error('Database initialization failed:', error);
            process.exit(1);
        });
}

// Export for use in other modules
module.exports = {
    ensureTables,
    tableExists,
    executeSqlFile
};
