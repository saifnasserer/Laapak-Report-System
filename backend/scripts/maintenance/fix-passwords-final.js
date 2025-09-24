/**
 * Final Password Fix Script
 * This script fixes passwords by directly updating the database, bypassing model hooks
 */

const { sequelize } = require('../config/db');
const bcrypt = require('bcryptjs');

async function fixPasswordsFinal() {
    try {
        console.log('🔐 Final password fix...');
        
        // Connect to database
        await sequelize.authenticate();
        console.log('✅ Database connection established');
        
        // Create fresh hashes
        const mekawyHash = await bcrypt.hash('Mekawy123', 10);
        const superadminHash = await bcrypt.hash('superadmin123', 10);
        
        console.log('✅ Created fresh hashes:');
        console.log(`  Mekawy: ${mekawyHash.substring(0, 20)}...`);
        console.log(`  Superadmin: ${superadminHash.substring(0, 20)}...`);
        
        // Test the hashes immediately
        const mekawyTest = await bcrypt.compare('Mekawy123', mekawyHash);
        const superadminTest = await bcrypt.compare('superadmin123', superadminHash);
        
        console.log('✅ Hash tests:');
        console.log(`  Mekawy test: ${mekawyTest}`);
        console.log(`  Superadmin test: ${superadminTest}`);
        
        // Update passwords directly in database using raw SQL
        console.log('🔐 Updating passwords in database...');
        
        await sequelize.query(`
            UPDATE admins 
            SET password = ?, updatedAt = NOW() 
            WHERE username = 'Mekawy'
        `, {
            replacements: [mekawyHash]
        });
        
        await sequelize.query(`
            UPDATE admins 
            SET password = ?, updatedAt = NOW() 
            WHERE username = 'superadmin'
        `, {
            replacements: [superadminHash]
        });
        
        console.log('✅ Passwords updated in database');
        
        // Verify the updates
        console.log('🔐 Verifying updates...');
        const [admins] = await sequelize.query(`
            SELECT username, password FROM admins 
            WHERE username IN ('Mekawy', 'superadmin')
        `);
        
        for (const admin of admins) {
            let testPassword = '';
            if (admin.username === 'Mekawy') {
                testPassword = 'Mekawy123';
            } else if (admin.username === 'superadmin') {
                testPassword = 'superadmin123';
            }
            
            const testResult = await bcrypt.compare(testPassword, admin.password);
            console.log(`✅ ${admin.username} verification: ${testResult}`);
            
            if (!testResult) {
                console.log(`❌ WARNING: ${admin.username} verification failed!`);
            }
        }
        
        console.log('\n✅ Final password fix completed successfully!');
        
    } catch (error) {
        console.error('❌ Error in final password fix:', error);
        throw error;
    } finally {
        // Close database connection
        await sequelize.close();
        console.log('🔌 Database connection closed');
    }
}

// Run the script if called directly
if (require.main === module) {
    fixPasswordsFinal()
        .then(() => {
            console.log('🎉 Final password fix completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Final password fix failed:', error);
            process.exit(1);
        });
}

module.exports = { fixPasswordsFinal }; 