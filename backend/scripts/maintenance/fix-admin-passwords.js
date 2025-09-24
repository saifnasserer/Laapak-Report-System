/**
 * Fix Admin Passwords Script
 * This script updates the admin passwords with proper bcrypt hashes
 */

const { sequelize } = require('../config/db');
const { Admin } = require('../models');
const bcrypt = require('bcryptjs');

async function fixAdminPasswords() {
    try {
        console.log('🔐 Starting admin password fix...');
        
        // Connect to database
        await sequelize.authenticate();
        console.log('✅ Database connection established');
        
        // Get all admin users
        const admins = await Admin.findAll({
            attributes: ['id', 'username', 'password', 'name', 'role', 'email']
        });
        
        console.log('📋 Current admin users:');
        admins.forEach(admin => {
            console.log(`  - ${admin.username} (${admin.name}): ${admin.role} - Password: ${admin.password}`);
        });
        
        // Update passwords with proper hashes
        console.log('🔐 Updating passwords with proper hashes...');
        
        for (const admin of admins) {
            let newPassword = '';
            
            // Set the correct password based on username
            if (admin.username === 'Mekawy') {
                newPassword = 'Mekawy123';
            } else if (admin.username === 'superadmin') {
                newPassword = 'superadmin123';
            } else {
                console.log(`⚠️ Unknown username: ${admin.username}, skipping...`);
                continue;
            }
            
            // Hash the password
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            
            // Update the admin
            await admin.update({ password: hashedPassword });
            console.log(`✅ Updated ${admin.username} password`);
        }
        
        // Verify the changes
        console.log('\n📋 Verifying password updates...');
        const updatedAdmins = await Admin.findAll({
            attributes: ['id', 'username', 'password', 'name', 'role', 'email']
        });
        
        updatedAdmins.forEach(admin => {
            const isHashed = admin.password.startsWith('$2b$') || admin.password.startsWith('$2a$');
            console.log(`  - ${admin.username}: ${isHashed ? '✅ Hashed' : '❌ Not hashed'} (${admin.password.substring(0, 20)}...)`);
        });
        
        console.log('\n✅ Admin password fix completed successfully!');
        
    } catch (error) {
        console.error('❌ Error fixing admin passwords:', error);
        throw error;
    } finally {
        // Close database connection
        await sequelize.close();
        console.log('🔌 Database connection closed');
    }
}

// Run the script if called directly
if (require.main === module) {
    fixAdminPasswords()
        .then(() => {
            console.log('🎉 Password fix completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Password fix failed:', error);
            process.exit(1);
        });
}

module.exports = { fixAdminPasswords }; 