/**
 * Laapak Report System - Generate Specific Bcrypt Hashes
 * Generates bcrypt hashes for specific passwords
 */

const bcrypt = require('bcryptjs');

async function generateSpecificHashes() {
    const passwords = [
        'laapakglobal',
        'saif'
    ];
    
    console.log('Generated bcrypt hashes for specific passwords:');
    console.log('=============================================');
    
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
        console.log(`UPDATE admins SET password = '${hash}' WHERE username = '${password === 'laapakglobal' ? 'king' : 'saif'}' AND password = '${password}';`);
    }
}

generateSpecificHashes().then(() => {
    console.log('\nScript completed!');
    process.exit(0);
}).catch((error) => {
    console.error('Error:', error);
    process.exit(1);
}); 