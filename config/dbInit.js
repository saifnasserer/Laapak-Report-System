/**
 * Laapak Report System - Database Initialization
 * Creates database tables and seeds initial data
 */

const { sequelize } = require('./db');
const { Admin, Client } = require('../models');

// Initialize database
const initDatabase = async () => {
    try {
        // Sync all models with database
        await sequelize.sync({ alter: true });
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
