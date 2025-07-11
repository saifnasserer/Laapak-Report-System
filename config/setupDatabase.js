/**
 * Laapak Report System - Database Setup
 * Drops and recreates all tables in the database
 */

const { sequelize } = require('./db');
const { Admin, Client, Report, ReportTechnicalTest, ReportExternalInspection, Invoice, InvoiceItem } = require('../models');

// Setup database by force syncing all models
const setupDatabase = async () => {
    try {
        console.log('Starting database setup...');
        
        // Force sync all models with database (drops tables and recreates them)
        await sequelize.sync({ force: true });
        console.log('Database tables dropped and recreated successfully');
        
        // Seed initial data
        await seedInitialData();
        
        console.log('Database setup completed successfully');
        return true;
    } catch (error) {
        console.error('Database setup error:', error);
        return false;
    }
};

// Seed initial data
const seedInitialData = async () => {
    try {
        console.log('Seeding initial admin data...');
        
        // Create default admin users
        await Admin.bulkCreate([
            { 
                username: 'admin', 
                password: 'admin123', 
                name: 'مدير النظام', 
                role: 'admin',
                email: 'admin@laapak.com'
            },
            { 
                username: 'tech', 
                password: 'tech123', 
                name: 'فني الصيانة', 
                role: 'technician',
                email: 'tech@laapak.com'
            },
            { 
                username: 'viewer', 
                password: 'viewer123', 
                name: 'مشاهد', 
                role: 'viewer',
                email: 'viewer@laapak.com'
            }
        ]);
        
        console.log('Admin data seeded successfully');
        
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
        
        return true;
    } catch (error) {
        console.error('Error seeding initial data:', error);
        return false;
    }
};

// Run setup if this script is executed directly
if (require.main === module) {
    setupDatabase()
        .then(() => {
            console.log('Database setup complete');
            process.exit(0);
        })
        .catch(error => {
            console.error('Database setup failed:', error);
            process.exit(1);
        });
} else {
    module.exports = { setupDatabase };
}
