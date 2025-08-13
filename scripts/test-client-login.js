/**
 * Test Client Login Script
 * This script tests the client authentication functionality
 */

const { sequelize } = require('../config/db');
const { Client } = require('../models');

async function testClientLogin() {
    try {
        console.log('🧪 Testing client login functionality...');
        
        // Connect to database
        await sequelize.authenticate();
        console.log('✅ Database connection established');
        
        // Get a sample client
        const client = await Client.findOne({
            attributes: ['id', 'name', 'phone', 'orderCode']
        });
        
        if (!client) {
            console.log('❌ No clients found in database');
            return;
        }
        
        console.log('📋 Sample client found:', {
            id: client.id,
            name: client.name,
            phone: client.phone,
            orderCode: client.orderCode
        });
        
        // Test phone number pattern matching
        const phonePattern = /^(01|02|03|04|05)[0-9]{8,9}$/;
        const isPhoneNumber = phonePattern.test(client.phone);
        
        console.log('📱 Phone number test:', {
            phone: client.phone,
            isPhoneNumber: isPhoneNumber
        });
        
        // Test order code pattern matching
        const orderCodePattern = /^[A-Za-z]|^\d{3,}$/;
        const isOrderCode = orderCodePattern.test(client.orderCode);
        
        console.log('🔑 Order code test:', {
            orderCode: client.orderCode,
            isOrderCode: isOrderCode
        });
        
        // Test password pattern matching
        const passwordPattern = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]|.{8,}/;
        const isPassword = passwordPattern.test(client.orderCode);
        
        console.log('🔐 Password pattern test:', {
            orderCode: client.orderCode,
            isPassword: isPassword
        });
        
        // Test detection logic
        let detectedType = null;
        
        if (isPhoneNumber) {
            detectedType = 'client';
        } else if (!isPhoneNumber && isPassword) {
            detectedType = 'employee';
        } else if (client.phone && client.orderCode) {
            if (isOrderCode && !isPassword) {
                detectedType = 'client';
            } else {
                detectedType = 'employee';
            }
        }
        
        console.log('🎯 Detection result:', {
            detectedType: detectedType,
            expectedType: 'client'
        });
        
        console.log('\n✅ Client login test completed!');
        
    } catch (error) {
        console.error('❌ Error testing client login:', error);
        throw error;
    } finally {
        // Close database connection
        await sequelize.close();
        console.log('🔌 Database connection closed');
    }
}

// Run the script if called directly
if (require.main === module) {
    testClientLogin()
        .then(() => {
            console.log('🎉 Client login test completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Client login test failed:', error);
            process.exit(1);
        });
}

module.exports = { testClientLogin }; 