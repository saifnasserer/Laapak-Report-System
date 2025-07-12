/**
 * Laapak Report System - Generate Bcrypt Hashes
 * Generates bcrypt hashes for passwords to use in SQL update script
 */

const bcrypt = require('bcryptjs');

async function generateHashes() {
    const passwords = [
        'admin123',
        'tech123', 
        'viewer123',
        'password',
        '123456'
    ];
    
    console.log('Generated bcrypt hashes for passwords:');
    console.log('=====================================');
    
    for (const password of passwords) {
        const hash = await bcrypt.hash(password, 10);
        console.log(`Password: "${password}"`);
        console.log(`Hash: "${hash}"`);
        console.log('---');
    }
    
    console.log('\nSQL UPDATE statements:');
    console.log('======================');
    
    for (const password of passwords) {
        const hash = await bcrypt.hash(password, 10);
        console.log(`UPDATE admins SET password = '${hash}' WHERE username = 'admin' AND password = '${password}';`);
    }
}

generateHashes().then(() => {
    console.log('\nScript completed!');
    process.exit(0);
}).catch((error) => {
    console.error('Error:', error);
    process.exit(1);
}); 