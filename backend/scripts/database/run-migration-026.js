/**
 * Run Migration 026 - Add Shipped Status and Tracking to Reports
 * This script manually runs the migration to add 'shipped' status and tracking columns
 */

const { sequelize } = require('../../config/db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    try {
        console.log('Connecting to database...');
        await sequelize.authenticate();
        console.log('Database connection established successfully.');

        const migrationPath = path.join(__dirname, '..', '..', 'config', 'migrations', '026_add_shipped_and_tracking_to_reports.sql');

        console.log('Reading migration file:', migrationPath);
        const sql = fs.readFileSync(migrationPath, 'utf8');

        // Split SQL into individual statements
        const statements = sql
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => {
                const cleaned = stmt.replace(/--.*$/gm, '').trim();
                return cleaned.length > 0 && !cleaned.match(/^\/\*/);
            });

        console.log(`Found ${statements.length} SQL statements to execute`);

        // Execute each statement
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            if (statement) {
                try {
                    console.log(`Executing statement ${i + 1}/${statements.length}...`);
                    await sequelize.query(statement);
                    console.log(`✓ Statement ${i + 1} executed successfully`);
                } catch (error) {
                    const errorMsg = error.message || '';
                    const errorCode = error.original?.code || '';

                    // If column already exists, that's okay
                    if (errorMsg.includes('Duplicate column name') || errorCode === 'ER_DUP_FIELDNAME') {
                        console.log(`⚠ Statement ${i + 1}: Column already exists, skipping`);
                    } else if (errorMsg.includes('Duplicate entry') || errorCode === 'ER_DUP_ENTRY') {
                        console.log(`⚠ Statement ${i + 1}: Duplicate entry, skipping`);
                    } else {
                        console.error(`✗ Error in statement ${i + 1}:`, errorMsg);
                        throw error;
                    }
                }
            }
        }

        console.log('\n✓ Migration 026 completed successfully!');

    } catch (error) {
        console.error('\n✗ Migration failed:', error.message);
        throw error;
    } finally {
        await sequelize.close();
        console.log('\nDatabase connection closed.');
    }
}

// Run the migration
if (require.main === module) {
    runMigration()
        .then(() => {
            console.log('\n✅ Migration script completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Migration script failed:', error);
            process.exit(1);
        });
}

module.exports = { runMigration };
