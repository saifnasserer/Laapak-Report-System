/**
 * Test script for database report table structure
 * This script directly tests the database structure
 */

const mysql = require('mysql2/promise');

// Database connection configuration
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'laapak_report_system'
};

// Function to test database structure
async function testDatabaseStructure() {
    console.log('Testing database structure...');
    let connection;
    
    try {
        // Connect to the database
        console.log('Connecting to database...');
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to database successfully!');
        
        // Check if reports table exists
        console.log('\nChecking if reports table exists...');
        const [tables] = await connection.execute(
            "SHOW TABLES LIKE 'reports'"
        );
        
        if (tables.length === 0) {
            throw new Error('Reports table does not exist!');
        }
        
        console.log('✅ Reports table exists!');
        
        // Check reports table structure
        console.log('\nChecking reports table structure...');
        const [columns] = await connection.execute(
            "DESCRIBE reports"
        );
        
        console.log('Reports table columns:');
        columns.forEach(column => {
            console.log(`- ${column.Field} (${column.Type})`);
        });
        
        // Check if required columns exist
        const requiredColumns = [
            'id', 'clientId', 'clientName', 'orderNumber', 'deviceModel', 
            'serialNumber', 'inspectionDate', 'notes', 'billingEnabled', 
            'amount', 'status'
        ];
        
        const columnNames = columns.map(col => col.Field);
        const missingColumns = requiredColumns.filter(col => !columnNames.includes(col));
        
        if (missingColumns.length > 0) {
            throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
        }
        
        console.log('\n✅ All required columns exist in the reports table!');
        
        // Check related tables
        console.log('\nChecking related tables...');
        const [relatedTables] = await connection.execute(
            "SHOW TABLES LIKE 'report_%'"
        );
        
        console.log('Related tables:');
        relatedTables.forEach(table => {
            console.log(`- ${Object.values(table)[0]}`);
        });
        
        // Success message
        console.log('\n✅ Database structure test completed successfully!');
        return true;
    } catch (error) {
        console.error('❌ Error testing database structure:', error.message);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
            console.log('Database connection closed.');
        }
    }
}

// Run the test
testDatabaseStructure()
    .then(() => {
        console.log('\nAll tests passed! The database structure is ready for report creation.');
        process.exit(0);
    })
    .catch(error => {
        console.error('\nTest failed:', error);
        process.exit(1);
    });
