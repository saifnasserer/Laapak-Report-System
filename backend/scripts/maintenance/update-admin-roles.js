/**
 * Update Admin Roles Script
 * This script updates the admin roles from the old system (admin, technician, viewer)
 * to the new system (admin, superadmin)
 */

const { sequelize } = require('../config/db');
const { Admin } = require('../models');

async function updateAdminRoles() {
    try {
        console.log('🔄 Starting admin roles update...');
        
        // Connect to database
        await sequelize.authenticate();
        console.log('✅ Database connection established');
        
        // First, let's see what roles currently exist
        const currentAdmins = await Admin.findAll({
            attributes: ['id', 'username', 'name', 'role', 'email']
        });
        
        console.log('📋 Current admin users:');
        currentAdmins.forEach(admin => {
            console.log(`  - ${admin.username} (${admin.name}): ${admin.role}`);
        });
        
        // Clear all existing admin users
        console.log('🗑️ Clearing all existing admin users...');
        await Admin.destroy({ where: {} });
        console.log(`✅ Deleted ${currentAdmins.length} existing admin users`);
        
        // Create new admin users
        console.log('👥 Creating new admin users...');
        
        const newAdmins = [
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
        ];
        
        await Admin.bulkCreate(newAdmins);
        console.log(`✅ Created ${newAdmins.length} new admin users`);
        
        let updateCount = newAdmins.length;
        
        // Verify the final state
        const finalAdmins = await Admin.findAll({
            attributes: ['id', 'username', 'name', 'role', 'email']
        });
        
        console.log('\n📋 Final admin users:');
        finalAdmins.forEach(admin => {
            console.log(`  - ${admin.username} (${admin.name}): ${admin.role}`);
        });
        
        console.log(`\n✅ Admin roles update completed! ${updateCount} changes made.`);
        
    } catch (error) {
        console.error('❌ Error updating admin roles:', error);
        throw error;
    } finally {
        // Close database connection
        await sequelize.close();
        console.log('🔌 Database connection closed');
    }
}

// Run the script if called directly
if (require.main === module) {
    updateAdminRoles()
        .then(() => {
            console.log('🎉 Script completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Script failed:', error);
            process.exit(1);
        });
}

module.exports = { updateAdminRoles }; 