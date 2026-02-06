
const { MoneyLocation, MoneyMovement, Invoice, Expense } = require('../models');
const { Op } = require('sequelize');

async function cleanupMoneyLocations() {
    const transaction = await require('../config/db').sequelize.transaction();
    try {
        const locations = await MoneyLocation.findAll({
            order: [['created_at', 'ASC']]
        });

        console.log(`Scanning ${locations.length} locations for cleanup...`);
        const uniqueSets = {};
        let deletedCount = 0;
        let retainedCount = 0;

        for (const loc of locations) {
            // Check usage
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

            if (!uniqueSets[key]) {
                // Keep the first one we see (oldest)
                uniqueSets[key] = loc.id;
                retainedCount++;
            } else {
                // This is a duplicate (same name and type)
                if (totalUsage === 0) {
                    // Safe to delete
                    await loc.destroy({ transaction });
                    deletedCount++;
                } else {
                    console.warn(`WARNING: Duplicate location ID ${loc.id} (${loc.name_ar}) has usage but is not the primary! Skipping delete.`);
                }
            }
        }

        await transaction.commit();
        console.log(`Cleanup complete.`);
        console.log(`Deleted: ${deletedCount}`);
        console.log(`Retained: ${retainedCount}`);

    } catch (error) {
        await transaction.rollback();
        console.error('Error during cleanup:', error);
    } finally {
        process.exit();
    }
}

cleanupMoneyLocations();
