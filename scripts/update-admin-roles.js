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
        
        // Update roles based on current values
        let updateCount = 0;
        
        for (const admin of currentAdmins) {
            let newRole = admin.role;
            
            // Map old roles to new roles
            switch (admin.role) {
                case 'admin':
                    // Keep as admin
                    newRole = 'admin';
                    break;
                case 'technician':
                    // Convert technician to admin
                    newRole = 'admin';
                    break;
                case 'viewer':
                    // Convert viewer to admin
                    newRole = 'admin';
                    break;
                case 'superadmin':
                    // Keep as superadmin
                    newRole = 'superadmin';
                    break;
                default:
                    // Default to admin for unknown roles
                    newRole = 'admin';
                    break;
            }
            
            // Update if role changed
            if (newRole !== admin.role) {
                await admin.update({ role: newRole });
                console.log(`  🔄 Updated ${admin.username}: ${admin.role} → ${newRole}`);
                updateCount++;
            }
        }
        
        // Create superadmin if it doesn't exist
        const superadminExists = await Admin.findOne({
            where: { role: 'superadmin' }
        });
        
        if (!superadminExists) {
            console.log('👑 Creating superadmin user...');
            await Admin.create({
                username: 'superadmin',
                password: 'superadmin123',
                name: 'مدير النظام الأعلى',
                role: 'superadmin',
                email: 'superadmin@laapak.com'
            });
            console.log('✅ Superadmin user created');
            updateCount++;
        }
        
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