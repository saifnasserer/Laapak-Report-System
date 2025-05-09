/**
 * Laapak Report System - Admin Password Reset Script
 * This script resets the admin password in the database
 */

require('dotenv').config();
const { sequelize } = require('./config/db');
const { Admin } = require('./models');
const bcrypt = require('bcryptjs');

async function resetAdminPassword() {
    try {
        console.log('Starting admin password reset...');
        
        // Test database connection
        await sequelize.authenticate();
        console.log('Database connection established successfully.');
        
        // Find admin user
        const admin = await Admin.findOne({ where: { username: 'admin' } });
        
        if (!admin) {
            console.log('Admin user not found. Creating new admin user...');
            
            // Create admin user if not exists
            const newAdmin = await Admin.create({
                username: 'admin',
                password: 'admin123', // Will be hashed by model hooks
                name: 'مدير النظام',
                role: 'admin',
                email: 'admin@laapak.com'
            });
            
            console.log('New admin user created successfully with ID:', newAdmin.id);
        } else {
            console.log('Admin user found with ID:', admin.id);
            
            // Reset password
            const hashedPassword = await bcrypt.hash('admin123', 10);
            console.log('New hashed password:', hashedPassword);
            
            // Update password directly in database to bypass hooks
            await sequelize.query(
                'UPDATE admins SET password = ? WHERE username = ?',
                {
                    replacements: [hashedPassword, 'admin'],
                    type: sequelize.QueryTypes.UPDATE
                }
            );
            
            console.log('Admin password reset successfully.');
        }
        
        // Verify the password
        const updatedAdmin = await Admin.findOne({ where: { username: 'admin' } });
        console.log('Updated admin password hash:', updatedAdmin.password);
        
        const isMatch = await bcrypt.compare('admin123', updatedAdmin.password);
        console.log('Password verification test:', isMatch ? 'SUCCESS' : 'FAILED');
        
        console.log('Password reset completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error resetting admin password:', error);
        process.exit(1);
    }
}

// Run the reset function
resetAdminPassword();
