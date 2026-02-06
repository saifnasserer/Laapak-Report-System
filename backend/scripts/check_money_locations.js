
const { MoneyLocation } = require('../models');

async function checkMoneyLocations() {
    try {
        const locations = await MoneyLocation.findAll({
            order: [['created_at', 'ASC']]
        });

        console.log('--- Money Locations in DB ---');
        console.log(`Total Count: ${locations.length}`);
        locations.forEach(loc => {
            console.log(`ID: ${loc.id} | Name: ${loc.name} | Name (AR): ${loc.name_ar} | Type: ${loc.type} | Balance: ${loc.balance} | Active: ${loc.is_active}`);
        });
        console.log('-----------------------------');
    } catch (error) {
        console.error('Error fetching locations:', error);
    } finally {
        process.exit();
    }
}

checkMoneyLocations();
