/**
 * Laapak Report System - Database Tables Initialization Script
 * This script ensures that all required database tables are created
 */

const { sequelize } = require('../../models');
const fs = require('fs');
const path = require('path');

// Path to SQL migration files
const migrationsPath = path.join(__dirname, '..', '..', 'config', 'migrations');

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
 * @param {boolean} closeConnection - Whether to close the connection after checking tables
 */
async function ensureTables(closeConnection = false) {
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
        
        // Technical tests and external inspection tables check removed as they're not used in the application
        
        console.log('All required tables exist.');
    } catch (error) {
        console.error('Error ensuring tables exist:', error);
        throw error; // Throw instead of exiting to allow caller to handle
    } finally {
        // Only close the connection if explicitly requested
        // This prevents closing when called from server.js
        if (closeConnection) {
            await sequelize.close();
        }
    }
}

// Run the function if this script is executed directly
if (require.main === module) {
    // Pass true to close the connection when run as a standalone script
    ensureTables(true)
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
