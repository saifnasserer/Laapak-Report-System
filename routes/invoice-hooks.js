/**
 * Laapak Report System - Invoice Hooks
 * Handles automatic money location updates when invoices are paid
 */

const { MoneyLocation, MoneyMovement } = require('../models');
const { Op } = require('sequelize');

// Payment method to location type mapping
const PAYMENT_METHOD_MAPPING = {
    'cash': { locationTypes: ['cash'], apiName: 'cash' },
    'instapay': { locationTypes: ['digital_wallet'], apiName: 'instapay', locationName: 'محفظة انستاباي' },
    'Instapay': { locationTypes: ['digital_wallet'], apiName: 'instapay', locationName: 'محفظة انستاباي' },
    'محفظة': { locationTypes: ['digital_wallet'], apiName: 'محفظة', locationName: 'محفظة رقمية' },
    'محفظة رقمية': { locationTypes: ['digital_wallet'], apiName: 'محفظة', locationName: 'محفظة رقمية' },
    'بنك': { locationTypes: ['bank_account'], apiName: 'بنك' },
    'حساب بنكي': { locationTypes: ['bank_account'], apiName: 'بنك' }
};

/**
 * Handle invoice payment status change
 * @param {Object} invoice - The invoice object
 * @param {string} oldStatus - Previous payment status
 * @param {string} newStatus - New payment status
 */
async function handleInvoicePaymentStatusChange(invoice, oldStatus, newStatus) {
    try {
        console.log(`Invoice payment status changed: ${oldStatus} -> ${newStatus}`, {
            invoiceId: invoice.id,
            paymentMethod: invoice.paymentMethod,
            total: invoice.total
        });

        // Only process if status changed to 'paid' or 'completed'
        if (newStatus !== 'paid' && newStatus !== 'completed') {
            console.log('Payment status is not paid/completed, skipping money location update');
            return;
        }

        // Check if this invoice was already processed (to avoid double processing)
        const existingMovement = await MoneyMovement.findOne({
            where: {
                description: {
                    [Op.like]: `%فاتورة ${invoice.id}%`
                }
            }
        });

        if (existingMovement) {
            console.log(`Invoice ${invoice.id} already processed, skipping`);
            return;
        }

        // Find the appropriate money location based on payment method
        const location = await findLocationForPaymentMethod(invoice.paymentMethod);
        
        if (!location) {
            console.log(`No location found for payment method: ${invoice.paymentMethod}`);
            return;
        }

        console.log(`Found location for payment method ${invoice.paymentMethod}:`, {
            locationId: location.id,
            locationName: location.name_ar,
            locationType: location.type
        });

        // Create a money movement record
        const movementData = {
            movement_type: 'payment_received',
            amount: parseFloat(invoice.total),
            fromLocationId: null, // Money comes from external source
            toLocationId: location.id,
            description: `دفعة مستلمة من فاتورة ${invoice.id}`,
            movement_date: invoice.paymentDate || new Date(),
            reference_type: 'invoice',
            created_by: 10 // Superadmin ID, should be passed from context
        };

        const movement = await MoneyMovement.create(movementData);
        console.log('Created money movement:', movement.id);

        // Update the location balance
        const newBalance = parseFloat(location.balance || 0) + parseFloat(invoice.total);
        await location.update({ balance: newBalance });
        
        console.log(`Updated location ${location.name_ar} balance: ${location.balance} -> ${newBalance}`);
        
    } catch (error) {
        console.error('Error handling invoice payment status change:', error);
        // Don't throw error to avoid breaking the main invoice update process
    }
}

/**
 * Find the appropriate money location for a payment method
 * @param {string} paymentMethod - The payment method
 * @returns {Object|null} - The location object or null if not found
 */
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

/**
 * Handle invoice creation (for invoices created as paid)
 * @param {Object} invoice - The newly created invoice
 */
async function handleInvoiceCreation(invoice) {
    try {
        console.log('Handling invoice creation:', {
            invoiceId: invoice.id,
            paymentStatus: invoice.paymentStatus,
            paymentMethod: invoice.paymentMethod
        });

        // Only process if invoice is created as paid
        if (invoice.paymentStatus === 'paid' || invoice.paymentStatus === 'completed') {
            await handleInvoicePaymentStatusChange(invoice, null, invoice.paymentStatus);
        }
    } catch (error) {
        console.error('Error handling invoice creation:', error);
    }
}

/**
 * Handle invoice deletion (reverse the money movement)
 * @param {Object} invoice - The deleted invoice
 */
async function handleInvoiceDeletion(invoice) {
    try {
        console.log('Handling invoice deletion:', {
            invoiceId: invoice.id,
            paymentStatus: invoice.paymentStatus,
            paymentMethod: invoice.paymentMethod
        });

        // Only process if invoice was paid
        if (invoice.paymentStatus === 'paid' || invoice.paymentStatus === 'completed') {
            // Find the money movement for this invoice
            const movement = await MoneyMovement.findOne({
                where: {
                    description: {
                        [Op.like]: `%فاتورة ${invoice.id}%`
                    }
                }
            });

            if (movement) {
                // Reverse the movement
                const location = await MoneyLocation.findByPk(movement.toLocationId);
                if (location) {
                    const newBalance = parseFloat(location.balance || 0) - parseFloat(movement.amount);
                    await location.update({ balance: Math.max(0, newBalance) });
                    console.log(`Reversed balance for location ${location.name_ar}: ${location.balance} -> ${newBalance}`);
                }

                // Delete the movement
                await movement.destroy();
                console.log(`Deleted money movement for invoice ${invoice.id}`);
            }
        }
    } catch (error) {
        console.error('Error handling invoice deletion:', error);
    }
}

module.exports = {
    handleInvoicePaymentStatusChange,
    handleInvoiceCreation,
    handleInvoiceDeletion,
    findLocationForPaymentMethod
};
