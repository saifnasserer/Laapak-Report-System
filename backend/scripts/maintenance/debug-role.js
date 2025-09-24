/**
 * Debug Role Storage Script
 * This script helps debug why the role is not being detected correctly
 */

const { sequelize } = require('../config/db');
const { Admin } = require('../models');
const jwt = require('jsonwebtoken');
const config = require('../config/config');

async function debugRole() {
    try {
        console.log('🔍 Debugging role storage issue...');
        
        // Connect to database
        await sequelize.authenticate();
        console.log('✅ Database connection established');
        
        // Get all admin users
        const admins = await Admin.findAll({
            attributes: ['id', 'username', 'name', 'role', 'email']
        });
        
        console.log('📋 All admin users in database:');
        admins.forEach(admin => {
            console.log(`  - ID: ${admin.id}, Username: ${admin.username}, Role: ${admin.role}, Name: ${admin.name}`);
        });
        
        // Test JWT token creation for superadmin
        const superadmin = admins.find(a => a.username === 'superadmin');
        if (superadmin) {
            console.log('\n🔐 Testing JWT token for superadmin:');
            console.log(`  - ID: ${superadmin.id}`);
            console.log(`  - Username: ${superadmin.username}`);
            console.log(`  - Role: ${superadmin.role}`);
            
            // Create a JWT token like the login process does
            const payload = {
                id: superadmin.id,
                username: superadmin.username,
                name: superadmin.name,
                role: superadmin.role,
                email: superadmin.email,
                type: 'admin'
            };
            
            const token = jwt.sign(payload, config.jwtSecret, { expiresIn: '1d' });
            console.log(`  - Generated token: ${token.substring(0, 50)}...`);
            
            // Decode the token to verify the payload
            const decoded = jwt.verify(token, config.jwtSecret);
            console.log('  - Decoded token payload:', {
                id: decoded.id,
                username: decoded.username,
                role: decoded.role,
                type: decoded.type
            });
            
            // Test what should be stored in localStorage
            const adminInfo = {
                id: decoded.id,
                username: decoded.username,
                name: decoded.name,
                role: decoded.role,
                email: decoded.email,
                token: token
            };
            
            console.log('  - What should be in localStorage (adminInfo):', adminInfo);
            console.log('  - Role from localStorage should be:', adminInfo.role);
            
        } else {
            console.log('❌ Superadmin user not found in database');
        }
        
        // Test JWT token creation for regular admin
        const regularAdmin = admins.find(a => a.username === 'Mekawy');
        if (regularAdmin) {
            console.log('\n🔐 Testing JWT token for regular admin:');
            console.log(`  - ID: ${regularAdmin.id}`);
            console.log(`  - Username: ${regularAdmin.username}`);
            console.log(`  - Role: ${regularAdmin.role}`);
            
            const payload = {
                id: regularAdmin.id,
                username: regularAdmin.username,
                name: regularAdmin.name,
                role: regularAdmin.role,
                email: regularAdmin.email,
                type: 'admin'
            };
            
            const token = jwt.sign(payload, config.jwtSecret, { expiresIn: '1d' });
            const decoded = jwt.verify(token, config.jwtSecret);
            
            console.log('  - Decoded token payload:', {
                id: decoded.id,
                username: decoded.username,
                role: decoded.role,
                type: decoded.type
            });
        }
        
        console.log('\n✅ Role debugging completed!');
        
    } catch (error) {
        console.error('❌ Error debugging role:', error);
        throw error;
    } finally {
        // Close database connection
        await sequelize.close();
        console.log('🔌 Database connection closed');
    }
}

// Run the script if called directly
if (require.main === module) {
    debugRole()
        .then(() => {
            console.log('🎉 Role debugging completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Role debugging failed:', error);
            process.exit(1);
        });
}

module.exports = { debugRole }; 