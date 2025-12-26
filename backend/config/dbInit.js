/**
 * Laapak Report System - Database Initialization
 * Creates database tables and seeds initial data
 */

const fs = require('fs').promises;
const path = require('path');
const { sequelize } = require('./db');
const { Admin, Client, Report, ReportTechnicalTest, ReportExternalInspection, Invoice, InvoiceItem } = require('../models');

// Run SQL migrations from files
const runMigrations = async () => {
    try {
        const migrationsDir = path.join(__dirname, 'migrations');

        // Check if migrations directory exists
        try {
            await fs.access(migrationsDir);
        } catch (error) {
            return true;
        }

        // Create migrations tracking table if it doesn't exist
        await sequelize.query(`
            CREATE TABLE IF NOT EXISTS __migrations__ (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL UNIQUE,
                executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Get all migration files
        const files = await fs.readdir(migrationsDir);

        // Sort files by name to ensure correct order
        const migrationFiles = files
            .filter(file => file.endsWith('.sql'))
            .sort();

        if (migrationFiles.length === 0) {
            return true;
        }

        // Get already executed migrations
        const [executedMigrations] = await sequelize.query('SELECT name FROM __migrations__');
        const executedNames = executedMigrations.map(m => m.name);

        const newMigrations = migrationFiles.filter(file => !executedNames.includes(file));

        if (newMigrations.length === 0) {
            // updates default to silent
            return true;
        }

        console.log(`🚀 Found ${newMigrations.length} new migration files to apply.`);

        // Execute each migration file
        for (const file of newMigrations) {
            console.log(`▶️ Applying migration: ${file}`);
            const filePath = path.join(migrationsDir, file);
            const sql = await fs.readFile(filePath, 'utf8');

            // Split SQL into individual statements
            const statements = sql
                .split(';')
                .map(stmt => stmt.trim())
                .filter(stmt => {
                    const cleaned = stmt.replace(/--.*$/gm, '').trim();
                    return cleaned.length > 0 && !cleaned.match(/^\/\*/);
                });

            // Execute each statement separately
            for (let i = 0; i < statements.length; i++) {
                const statement = statements[i];
                if (statement) {
                    try {
                        await sequelize.query(statement);
                    } catch (error) {
                        const errorMsg = error.message || '';
                        const errorCode = error.original?.code || '';

                        // Ignore common "already exists" errors during migrations
                        if (errorMsg.includes('already exists') || errorCode === 'ER_TABLE_EXISTS_ERROR' ||
                            errorCode === 'ER_DUP_ENTRY' || errorMsg.includes('Duplicate entry') ||
                            errorMsg.includes('Duplicate column name') || errorCode === 'ER_DUP_FIELDNAME') {
                            continue;
                        } else {
                            console.error(`❌ Error in statement ${i + 1} of ${file}:`, errorMsg);
                            throw error;
                        }
                    }
                }
            }

            // Mark migration as executed
            await sequelize.query('INSERT INTO __migrations__ (name) VALUES (?)', {
                replacements: [file]
            });
            console.log(`✅ Applied ${file}`);
        }

        return true;
    } catch (error) {
        console.error('❌ Migration error:', error.message);
        return false;
    }
};

// Initialize database
const initDatabase = async () => {
    try {
        // Run migrations first
        const migrationsResult = await runMigrations();
        if (!migrationsResult) {
            console.warn('Migrations failed, falling back to automatic sync');
        }

        // Sync models individually to prevent index limit issues
        // console.log('Synchronizing database models...');

        // Use force:false, alter:false to prevent adding too many indexes
        // This is safer and won't try to add unique constraints that cause 'Too many keys'
        await sequelize.sync({ force: false, alter: false });

        // console.log('Database synchronized successfully');

        // Check if we need to seed initial data
        await seedInitialData();

        return true;
    } catch (error) {
        console.error('Database initialization error:', error);
        return false;
    }
};

// Seed initial data if tables are empty
const seedInitialData = async () => {
    try {
        // Check if admin table is empty
        const adminCount = await Admin.count();

        if (adminCount === 0) {
            console.log('Seeding initial admin data...');

            // Create default admin users
            await Admin.bulkCreate([
                {
                    username: 'Mekawy',
                    password: 'Mekawy123',
                    name: 'اسلام مكاوي',
                    role: 'admin',
                    email: 'Mekawy@laapak.com'
                },
                {
                    username: 'superadmin',
                    password: 'superadmin123',
                    name: 'سيف ناصر',
                    role: 'superadmin',
                    email: 'superadmin@laapak.com'
                }
            ]);

            console.log('Admin data seeded successfully');
        }

        // Check if client table is empty
        const clientCount = await Client.count();

        if (clientCount === 0) {
            console.log('Seeding initial client data...');

            // Create default client users
            await Client.bulkCreate([
                {
                    name: 'أحمد محمد',
                    phone: '0501234567',
                    orderCode: 'LP12345',
                    email: 'ahmed@example.com'
                },
                {
                    name: 'سارة علي',
                    phone: '0509876543',
                    orderCode: 'LP67890',
                    email: 'sara@example.com'
                },
                {
                    name: 'محمود خالد',
                    phone: '0553219876',
                    orderCode: 'LP54321',
                    email: 'mahmoud@example.com'
                }
            ]);

            console.log('Client data seeded successfully');
        }

        return true;
    } catch (error) {
        console.error('Error seeding initial data:', error);
        return false;
    }
};

module.exports = { initDatabase };
