/**
 * Laapak Report System - Invoice Money Management Hooks
 * Automatic money movement tracking for invoice payments
 */

const { MoneyMovement, MoneyLocation } = require('../models');

/**
 * Hook to record money movement when invoice payment is received
 * @param {Object} invoice - Invoice object
 * @param {Object} paymentData - Payment information
 * @param {number} adminId - Admin ID who processed the payment
 */
async function recordInvoicePayment(invoice, paymentData, adminId) {
    try {
        const { money_location_id, amount } = paymentData;
        
        if (!money_location_id || !amount) {
            console.log('No money location specified for invoice payment, skipping money movement');
            return;
        }

        // Record payment received movement
        await MoneyMovement.recordPaymentReceived(
            money_location_id,
            parseFloat(amount),
            invoice.id,
            adminId
        );

        console.log(`Money movement recorded for invoice ${invoice.id}: +${amount} to location ${money_location_id}`);
        
    } catch (error) {
        console.error('Error recording invoice payment movement:', error);
        // Don't throw error to avoid breaking invoice creation
    }
}

/**
 * Hook to update invoice payment status and record money movement
 * @param {string} invoiceId - Invoice ID
 * @param {Object} updateData - Update data including payment info
 * @param {number} adminId - Admin ID who updated the invoice
 */
async function updateInvoicePaymentStatus(invoiceId, updateData, adminId) {
    try {
        const { paymentStatus, money_location_id, paymentMethod } = updateData;
        
        // Only record movement for completed/paid invoices
        if (!['completed', 'paid'].includes(paymentStatus)) {
            return;
        }

        if (!money_location_id) {
            console.log('No money location specified for invoice payment update');
            return;
        }

        // Find the invoice to get payment amount
        const { Invoice } = require('../models');
        const invoice = await Invoice.findByPk(invoiceId);
        
        if (!invoice) {
            console.error('Invoice not found for payment status update');
            return;
        }

        // Check if movement already exists for this invoice
        const existingMovement = await MoneyMovement.findOne({
            where: {
                reference_type: 'invoice',
                reference_id: invoiceId,
                movement_type: 'payment_received'
            }
        });

        if (existingMovement) {
            console.log(`Money movement already exists for invoice ${invoiceId}`);
            return;
        }

        // Record payment received movement
        await MoneyMovement.recordPaymentReceived(
            money_location_id,
            parseFloat(invoice.total),
            invoiceId,
            adminId
        );

        console.log(`Money movement recorded for invoice payment update ${invoiceId}: +${invoice.total} to location ${money_location_id}`);
        
    } catch (error) {
        console.error('Error recording invoice payment status update movement:', error);
    }
}

/**
 * Get money location ID based on payment method
 * @param {string} paymentMethod - Payment method
 * @returns {number|null} Money location ID
 */
async function getLocationIdByPaymentMethod(paymentMethod) {
    try {
        let locationName;
        
        switch (paymentMethod?.toLowerCase()) {
            case 'cash':
                locationName = 'Cash Register';
                break;
            case 'instapay':
                locationName = 'Instapay Wallet';
                break;
            case 'محفظة':
                locationName = 'Digital Wallet';
                break;
            case 'بنك':
                locationName = 'Bank Account';
                break;
            default:
                return null;
        }

        const location = await MoneyLocation.findOne({
            where: { name: locationName, is_active: true }
        });

        return location ? location.id : null;
        
    } catch (error) {
        console.error('Error getting location by payment method:', error);
        return null;
    }
}

/**
 * Automatically assign money location based on payment method
 * @param {Object} invoiceData - Invoice data
 * @returns {Object} Updated invoice data with money_location_id
 */
async function autoAssignMoneyLocation(invoiceData) {
    try {
        if (invoiceData.money_location_id) {
            return invoiceData; // Already has location assigned
        }

        if (invoiceData.paymentMethod) {
            const locationId = await getLocationIdByPaymentMethod(invoiceData.paymentMethod);
            if (locationId) {
                invoiceData.money_location_id = locationId;
            }
        }

        return invoiceData;
        
    } catch (error) {
        console.error('Error auto-assigning money location:', error);
        return invoiceData;
    }
}

module.exports = {
    recordInvoicePayment,
    updateInvoicePaymentStatus,
    getLocationIdByPaymentMethod,
    autoAssignMoneyLocation
};
