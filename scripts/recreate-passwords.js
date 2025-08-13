/**
 * Recreate Admin Passwords Script
 * This script recreates the admin passwords with fresh bcrypt hashes
 */

const { sequelize } = require('../config/db');
const { Admin } = require('../models');
const bcrypt = require('bcryptjs');

async function recreatePasswords() {
    try {
        console.log('🔐 Recreating admin passwords...');
        
        // Connect to database
        await sequelize.authenticate();
        console.log('✅ Database connection established');
        
        // Get all admin users
        const admins = await Admin.findAll({
            attributes: ['id', 'username', 'password', 'name', 'role', 'email']
        });
        
        console.log('📋 Current admin users:');
        admins.forEach(admin => {
            console.log(`  - ${admin.username} (${admin.name}): ${admin.role}`);
        });
        
        // Recreate passwords with fresh hashes
        console.log('🔐 Creating fresh password hashes...');
        
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
            
            // Create fresh hash
            const freshHash = await bcrypt.hash(newPassword, 10);
            console.log(`✅ Created fresh hash for ${admin.username}: ${freshHash.substring(0, 20)}...`);
            
            // Test the hash immediately
            const testResult = await bcrypt.compare(newPassword, freshHash);
            console.log(`✅ Hash test for ${admin.username}: ${testResult}`);
            
            // Update the admin with the fresh hash
            await admin.update({ password: freshHash });
            console.log(`✅ Updated ${admin.username} with fresh hash`);
        }
        
        // Verify all passwords work
        console.log('\n🔐 Verifying all passwords work...');
        for (const admin of admins) {
            let testPassword = '';
            
            if (admin.username === 'Mekawy') {
                testPassword = 'Mekawy123';
            } else if (admin.username === 'superadmin') {
                testPassword = 'superadmin123';
            } else {
                continue;
            }
            
            // Reload the admin to get the updated password
            await admin.reload();
            
            // Test the password
            const testResult = await admin.checkPassword(testPassword);
            console.log(`✅ ${admin.username} password test: ${testResult}`);
            
            if (!testResult) {
                console.log(`❌ WARNING: ${admin.username} password test failed!`);
            }
        }
        
        console.log('\n✅ Admin password recreation completed successfully!');
        
    } catch (error) {
        console.error('❌ Error recreating admin passwords:', error);
        throw error;
    } finally {
        // Close database connection
        await sequelize.close();
        console.log('🔌 Database connection closed');
    }
}

// Run the script if called directly
if (require.main === module) {
    recreatePasswords()
        .then(() => {
            console.log('🎉 Password recreation completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Password recreation failed:', error);
            process.exit(1);
        });
}

module.exports = { recreatePasswords }; 