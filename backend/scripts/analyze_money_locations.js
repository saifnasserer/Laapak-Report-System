
const { MoneyLocation, MoneyMovement, Invoice, Expense } = require('../models');
const { Op } = require('sequelize');

async function analyzeMoneyLocations() {
    try {
        const locations = await MoneyLocation.findAll({
            order: [['created_at', 'ASC']]
        });

        console.log(`Analyzing ${locations.length} locations...`);
        console.log('ID | Name (AR) | Balance | Movements (From/To) | Invoices | Expenses | Action');
        console.log('-'.repeat(100));

        const uniqueSets = {};

        for (const loc of locations) {
            const movementCount = await MoneyMovement.count({
                where: {
                    [Op.or]: [
                        { from_location_id: loc.id },
                        { to_location_id: loc.id }
                    ]
                }
            });

            const invoiceCount = await Invoice.count({ where: { money_location_id: loc.id } });
            const expenseCount = await Expense.count({ where: { money_location_id: loc.id } });

            const totalUsage = movementCount + invoiceCount + expenseCount;
            const key = `${loc.name_ar}-${loc.type}`;

            let action = '';
            if (!uniqueSets[key]) {
                uniqueSets[key] = loc.id;
                action = 'KEEP (Primary)';
            } else {
                if (totalUsage > 0) {
                    action = 'MERGE NEEDED';
                } else {
                    action = 'DELETE';
                }
            }

            console.log(`${loc.id} | ${loc.name_ar} | ${loc.balance} | ${movementCount} | ${invoiceCount} | ${expenseCount} | ${action}`);
        }

    } catch (error) {
        console.error('Error analyzing locations:', error);
    } finally {
        process.exit();
    }
}

analyzeMoneyLocations();
