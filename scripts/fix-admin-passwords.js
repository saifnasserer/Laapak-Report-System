/**
 * Laapak Report System - Fix Admin Passwords Script
 * Updates existing admin users with plain text passwords to use bcrypt hashed passwords
 */

const bcrypt = require('bcryptjs');
const { Admin } = require('../models');

async function fixAdminPasswords() {
    try {
        console.log('Starting admin password fix...');
        
        // Get all admin users
        const admins = await Admin.findAll();
        console.log(`Found ${admins.length} admin users`);
        
        let updatedCount = 0;
        
        for (const admin of admins) {
            const password = admin.password;
            
            // Check if password is already hashed (bcrypt hashes start with $2a$, $2b$, or $2y$)
            const isHashed = password.startsWith('$2a$') || password.startsWith('$2b$') || password.startsWith('$2y$');
            
            if (!isHashed) {
                console.log(`Fixing password for admin: ${admin.username}`);
                console.log(`Old password (plain text): ${password}`);
                
                // Hash the plain text password
                const hashedPassword = await bcrypt.hash(password, 10);
                console.log(`New password (hashed): ${hashedPassword}`);
                
                // Update the admin with the hashed password
                await admin.update({ password: hashedPassword });
                
                updatedCount++;
                console.log(`✅ Updated password for admin: ${admin.username}`);
            } else {
                console.log(`✅ Admin ${admin.username} already has hashed password`);
            }
        }
        
        console.log(`\n🎉 Password fix completed!`);
        console.log(`Updated ${updatedCount} admin users`);
        
        if (updatedCount === 0) {
            console.log('All admin passwords are already properly hashed.');
        }
        
    } catch (error) {
        console.error('Error fixing admin passwords:', error);
        process.exit(1);
    }
}

// Run the script
fixAdminPasswords().then(() => {
    console.log('Script completed successfully');
    process.exit(0);
}).catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
}); 