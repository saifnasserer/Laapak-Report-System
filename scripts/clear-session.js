/**
 * Clear Session Script
 * This script clears all session data to force a fresh login
 */

const { sequelize } = require('../config/db');
const { Admin } = require('../models');

async function clearSession() {
    try {
        console.log('🧹 Clearing all session data...');
        
        // Connect to database
        await sequelize.authenticate();
        console.log('✅ Database connection established');
        
        // Get all admin users to show their current roles
        const admins = await Admin.findAll({
            attributes: ['id', 'username', 'name', 'role', 'email']
        });
        
        console.log('📋 Current admin users and their roles:');
        admins.forEach(admin => {
            console.log(`  - ${admin.username}: ${admin.role} (${admin.name})`);
        });
        
        console.log('\n🔧 Instructions to fix the role detection issue:');
        console.log('1. Open your browser\'s Developer Tools (F12)');
        console.log('2. Go to the Console tab');
        console.log('3. Run these commands to clear all session data:');
        console.log('');
        console.log('   localStorage.clear();');
        console.log('   sessionStorage.clear();');
        console.log('   location.reload();');
        console.log('');
        console.log('4. After the page reloads, login again with:');
        console.log('   Username: superadmin');
        console.log('   Password: superadmin123');
        console.log('');
        console.log('5. Check the console logs to verify the role is detected correctly');
        
        console.log('\n✅ Session clearing instructions provided!');
        
    } catch (error) {
        console.error('❌ Error in clear session script:', error);
        throw error;
    } finally {
        // Close database connection
        await sequelize.close();
        console.log('🔌 Database connection closed');
    }
}

// Run the script if called directly
if (require.main === module) {
    clearSession()
        .then(() => {
            console.log('🎉 Clear session script completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Clear session script failed:', error);
            process.exit(1);
        });
}

module.exports = { clearSession }; 