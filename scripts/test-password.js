/**
 * Test Password Script
 * This script tests the password comparison functionality
 */

const { sequelize } = require('../config/db');
const { Admin } = require('../models');
const bcrypt = require('bcryptjs');

async function testPassword() {
    try {
        console.log('🧪 Testing password functionality...');
        
        // Connect to database
        await sequelize.authenticate();
        console.log('✅ Database connection established');
        
        // Get the superadmin user
        const admin = await Admin.findOne({
            where: { username: 'superadmin' }
        });
        
        if (!admin) {
            console.log('❌ Superadmin user not found');
            return;
        }
        
        console.log('📋 Admin found:', {
            username: admin.username,
            role: admin.role,
            passwordHash: admin.password.substring(0, 20) + '...'
        });
        
        // Test direct bcrypt comparison
        console.log('\n🔐 Testing direct bcrypt comparison...');
        const testPassword = 'superadmin123';
        const directResult = await bcrypt.compare(testPassword, admin.password);
        console.log(`Direct bcrypt.compare('${testPassword}', hash): ${directResult}`);
        
        // Test the model's checkPassword method
        console.log('\n🔐 Testing model checkPassword method...');
        const modelResult = await admin.checkPassword(testPassword);
        console.log(`Model checkPassword('${testPassword}'): ${modelResult}`);
        
        // Test with wrong password
        console.log('\n🔐 Testing with wrong password...');
        const wrongPassword = 'wrongpassword';
        const wrongResult = await admin.checkPassword(wrongPassword);
        console.log(`Model checkPassword('${wrongPassword}'): ${wrongResult}`);
        
        // Test creating a new hash and comparing
        console.log('\n🔐 Testing new hash creation...');
        const newHash = await bcrypt.hash(testPassword, 10);
        console.log(`New hash for '${testPassword}': ${newHash.substring(0, 20)}...`);
        const newHashResult = await bcrypt.compare(testPassword, newHash);
        console.log(`Compare with new hash: ${newHashResult}`);
        
        console.log('\n✅ Password test completed!');
        
    } catch (error) {
        console.error('❌ Error testing password:', error);
        throw error;
    } finally {
        // Close database connection
        await sequelize.close();
        console.log('🔌 Database connection closed');
    }
}

// Run the script if called directly
if (require.main === module) {
    testPassword()
        .then(() => {
            console.log('🎉 Password test completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Password test failed:', error);
            process.exit(1);
        });
}

module.exports = { testPassword }; 