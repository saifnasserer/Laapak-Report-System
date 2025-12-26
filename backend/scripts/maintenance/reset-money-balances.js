/**
 * Reset Money Balances Script
 * This script resets all money location balances to zero and processes only recent paid invoices
 */

const { MoneyLocation, MoneyMovement, Invoice } = require('../models');
const { Op } = require('sequelize');

// Payment method to location type mapping
const PAYMENT_METHOD_MAPPING = {
    'cash': { locationTypes: ['cash'], apiName: 'cash' },
    'instapay': { locationTypes: ['digital_wallet'], apiName: 'instapay', locationName: 'محفظة انستاباي' },
    'Instapay': { locationTypes: ['digital_wallet'], apiName: 'instapay', locationName: 'محفظة انستاباي' },
    'محفظة': { locationTypes: ['digital_wallet'], apiName: 'محفظة', locationName: 'محفظة' },
    'محفظة': { locationTypes: ['digital_wallet'], apiName: 'محفظة', locationName: 'محفظة' },
    'بنك': { locationTypes: ['bank_account'], apiName: 'بنك' },
    'بنك': { locationTypes: ['bank_account'], apiName: 'بنك' }
};

async function findLocationForPaymentMethod(paymentMethod) {
    if (!paymentMethod) {
        console.log('No payment method provided');
        return null;
    }

    console.log(`Finding location for payment method: ${paymentMethod}`);

    // Find matching payment method configuration
    let matchingConfig = null;
    for (const [methodName, config] of Object.entries(PAYMENT_METHOD_MAPPING)) {
        if (paymentMethod.toLowerCase().includes(methodName.toLowerCase())) {
            matchingConfig = config;
            console.log(`Matched payment method "${paymentMethod}" with config "${methodName}"`);
            break;
        }
    }

    if (!matchingConfig) {
        console.log(`No matching config found for payment method: ${paymentMethod}`);
        return null;
    }

    // Find location with matching type and name (if specified)
    let location;
    if (matchingConfig.locationName) {
        // Use specific location name for digital wallets
        location = await MoneyLocation.findOne({
            where: {
                type: {
                    [Op.in]: matchingConfig.locationTypes
                },
                name_ar: matchingConfig.locationName
            }
        });
    } else {
        // Fallback to type-only matching
        location = await MoneyLocation.findOne({
            where: {
                type: {
                    [Op.in]: matchingConfig.locationTypes
                }
            }
        });
    }

    if (!location) {
        console.log(`No location found for types: ${matchingConfig.locationTypes.join(', ')}`);
        return null;
    }

    return location;
}

async function resetMoneyBalances() {
    try {
        console.log('Starting money balance reset...');

        // 1. Reset all money location balances to zero
        console.log('Resetting all money location balances to zero...');
        await MoneyLocation.update(
            { balance: 0 },
            { where: {} }
        );

        // 2. Delete all existing money movements
        console.log('Deleting all existing money movements...');
        await MoneyMovement.destroy({
            where: {}
        });

        // 3. Get all paid invoices created after a certain date (e.g., after money management was implemented)
        // We'll use a date that's reasonable - let's say after August 1st, 2025
        const cutoffDate = new Date('2025-08-01');

        console.log('Finding paid invoices created after:', cutoffDate);
        const paidInvoices = await Invoice.findAll({
            where: {
                paymentStatus: {
                    [Op.in]: ['paid', 'completed']
                },
                created_at: {
                    [Op.gte]: cutoffDate
                },
                paymentMethod: {
                    [Op.ne]: null
                }
            },
            order: [['created_at', 'ASC']]
        });

        console.log(`Found ${paidInvoices.length} paid invoices to process`);

        // 4. Process each paid invoice
        for (const invoice of paidInvoices) {
            console.log(`Processing invoice ${invoice.id}: ${invoice.total} via ${invoice.paymentMethod}`);

            // Find the appropriate money location
            const location = await findLocationForPaymentMethod(invoice.paymentMethod);

            if (!location) {
                console.log(`Skipping invoice ${invoice.id} - no location found for payment method: ${invoice.paymentMethod}`);
                continue;
            }

            // Create money movement
            const movementData = {
                movement_type: 'payment_received',
                amount: parseFloat(invoice.total),
                fromLocationId: null, // Money comes from external source
                toLocationId: location.id,
                description: `دفعة مستلمة من فاتورة ${invoice.id}`,
                movement_date: invoice.paymentDate || invoice.created_at,
                reference_type: 'invoice',
                created_by: 10 // Superadmin ID
            };

            const movement = await MoneyMovement.create(movementData);
            console.log(`Created movement ${movement.id} for invoice ${invoice.id}`);

            // Update location balance
            const newBalance = parseFloat(location.balance || 0) + parseFloat(invoice.total);
            await location.update({ balance: newBalance });
            console.log(`Updated location ${location.name_ar} balance: ${location.balance} -> ${newBalance}`);
        }

        // 5. Show final balances
        const finalLocations = await MoneyLocation.findAll();
        console.log('\nFinal money location balances:');
        for (const location of finalLocations) {
            console.log(`${location.name_ar}: ${location.balance} ج.م`);
        }

        console.log('\nMoney balance reset completed successfully!');

    } catch (error) {
        console.error('Error resetting money balances:', error);
        throw error;
    }
}

// Run the script if called directly
if (require.main === module) {
    resetMoneyBalances()
        .then(() => {
            console.log('Script completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Script failed:', error);
            process.exit(1);
        });
}

module.exports = { resetMoneyBalances };
