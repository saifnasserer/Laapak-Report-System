/**
 * Laapak Report System - Expense Money Management Hooks
 * Automatic money movement tracking for expense payments
 */

const { MoneyMovement, MoneyLocation } = require('../models');

/**
 * Hook to record money movement when expense is paid
 * @param {Object} expense - Expense object
 * @param {Object} paymentData - Payment information
 * @param {number} adminId - Admin ID who processed the payment
 */
async function recordExpensePayment(expense, paymentData, adminId) {
    try {
        const { money_location_id, amount } = paymentData;
        
        if (!money_location_id || !amount) {
            console.log('No money location specified for expense payment, skipping money movement');
            return;
        }

        // Record expense paid movement
        await MoneyMovement.recordExpensePaid(
            money_location_id,
            parseFloat(amount),
            expense.id,
            adminId
        );

        console.log(`Money movement recorded for expense ${expense.id}: -${amount} from location ${money_location_id}`);
        
    } catch (error) {
        console.error('Error recording expense payment movement:', error);
        // Don't throw error to avoid breaking expense creation
    }
}

/**
 * Hook to update expense payment status and record money movement
 * @param {number} expenseId - Expense ID
 * @param {Object} updateData - Update data including payment info
 * @param {number} adminId - Admin ID who updated the expense
 */
async function updateExpensePaymentStatus(expenseId, updateData, adminId) {
    try {
        const { status, money_location_id } = updateData;
        
        // Only record movement for paid expenses
        if (status !== 'paid') {
            return;
        }

        if (!money_location_id) {
            console.log('No money location specified for expense payment update');
            return;
        }

        // Find the expense to get payment amount
        const { Expense } = require('../models');
        const expense = await Expense.findByPk(expenseId);
        
        if (!expense) {
            console.error('Expense not found for payment status update');
            return;
        }

        // Check if movement already exists for this expense
        const existingMovement = await MoneyMovement.findOne({
            where: {
                reference_type: 'expense',
                reference_id: expenseId.toString(),
                movement_type: 'expense_paid'
            }
        });

        if (existingMovement) {
            console.log(`Money movement already exists for expense ${expenseId}`);
            return;
        }

        // Record expense paid movement
        await MoneyMovement.recordExpensePaid(
            money_location_id,
            parseFloat(expense.amount),
            expenseId,
            adminId
        );

        console.log(`Money movement recorded for expense payment update ${expenseId}: -${expense.amount} from location ${money_location_id}`);
        
    } catch (error) {
        console.error('Error recording expense payment status update movement:', error);
    }
}

/**
 * Get default money location for expense payments
 * @param {string} expenseType - Type of expense
 * @returns {number|null} Money location ID
 */
async function getDefaultExpenseLocation(expenseType = 'variable') {
    try {
        // Default to cash register for most expenses
        const location = await MoneyLocation.findOne({
            where: { 
                name: 'Cash Register', 
                is_active: true 
            }
        });

        return location ? location.id : null;
        
    } catch (error) {
        console.error('Error getting default expense location:', error);
        return null;
    }
}

/**
 * Automatically assign money location for expense
 * @param {Object} expenseData - Expense data
 * @returns {Object} Updated expense data with money_location_id
 */
async function autoAssignExpenseLocation(expenseData) {
    try {
        if (expenseData.money_location_id) {
            return expenseData; // Already has location assigned
        }

        // Auto-assign based on expense type or category
        const locationId = await getDefaultExpenseLocation(expenseData.type);
        if (locationId) {
            expenseData.money_location_id = locationId;
        }

        return expenseData;
        
    } catch (error) {
        console.error('Error auto-assigning expense location:', error);
        return expenseData;
    }
}

/**
 * Get expense payment summary by location
 * @param {string} startDate - Start date
 * @param {string} endDate - End date
 * @returns {Array} Payment summary by location
 */
async function getExpensePaymentSummary(startDate, endDate) {
    try {
        const { sequelize } = require('../config/db');
        
        const query = `
            SELECT 
                ml.id as location_id,
                ml.name as location_name,
                ml.name_ar as location_name_ar,
                COUNT(mm.id) as expense_count,
                SUM(mm.amount) as total_amount
            FROM money_locations ml
            LEFT JOIN money_movements mm ON ml.id = mm.from_location_id
                AND mm.movement_type = 'expense_paid'
                AND mm.movement_date BETWEEN ? AND ?
            WHERE ml.is_active = 1
            GROUP BY ml.id, ml.name, ml.name_ar
            ORDER BY total_amount DESC
        `;

        const [results] = await sequelize.query(query, {
            replacements: [startDate, endDate]
        });

        return results;
        
    } catch (error) {
        console.error('Error getting expense payment summary:', error);
        return [];
    }
}

module.exports = {
    recordExpensePayment,
    updateExpensePaymentStatus,
    getDefaultExpenseLocation,
    autoAssignExpenseLocation,
    getExpensePaymentSummary
};
