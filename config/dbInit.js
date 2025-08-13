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
            console.log('Migrations directory not found, skipping migrations');
            return true;
        }
        
        // Get all migration files
        const files = await fs.readdir(migrationsDir);
        
        // Sort files by name to ensure correct order
        const migrationFiles = files
            .filter(file => file.endsWith('.sql'))
            .sort();
        
        if (migrationFiles.length === 0) {
            console.log('No migration files found');
            return true;
        }
        
        console.log(`Found ${migrationFiles.length} migration files`);
        
        // Execute each migration file
        for (const file of migrationFiles) {
            console.log(`Running migration: ${file}`);
            const filePath = path.join(migrationsDir, file);
            const sql = await fs.readFile(filePath, 'utf8');
            
            // Execute the SQL
            await sequelize.query(sql);
            console.log(`Migration ${file} completed successfully`);
        }
        
        return true;
    } catch (error) {
        console.error('Error running migrations:', error);
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
        console.log('Synchronizing database models...');
        
        // Use force:false, alter:false to prevent adding too many indexes
        // This is safer and won't try to add unique constraints that cause 'Too many keys'
        await sequelize.sync({ force: false, alter: false });
        
        console.log('Database synchronized successfully');
        
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
