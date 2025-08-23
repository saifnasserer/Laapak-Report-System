const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { adminRoleAuth } = require('../middleware/auth');
const { Expense, ExpenseCategory, Admin, MoneyMovement, MoneyLocation } = require('../models');

/**
 * Helper function to find money location for payment method
 */
async function findLocationForPaymentMethod(paymentMethod, transaction = null) {
    if (!paymentMethod) {
        console.log('No payment method provided');
        return null;
    }

    console.log(`Finding location for payment method: ${paymentMethod}`);

    // Payment method to location mapping (same as in invoice-hooks.js)
    const PAYMENT_METHOD_MAPPING = {
        'cash': { locationTypes: ['cash'], apiName: 'cash' },
        'instapay': { locationTypes: ['digital_wallet'], apiName: 'instapay', locationName: 'محفظة انستاباي' },
        'Instapay': { locationTypes: ['digital_wallet'], apiName: 'instapay', locationName: 'محفظة انستاباي' },
        'wallet': { locationTypes: ['digital_wallet'], apiName: 'محفظة', locationName: 'محفظة رقمية' },
        'محفظة': { locationTypes: ['digital_wallet'], apiName: 'محفظة', locationName: 'محفظة رقمية' },
        'محفظة رقمية': { locationTypes: ['digital_wallet'], apiName: 'محفظة', locationName: 'محفظة رقمية' },
        'bank': { locationTypes: ['bank_account'], apiName: 'بنك' },
        'بنك': { locationTypes: ['bank_account'], apiName: 'بنك' },
        'حساب بنكي': { locationTypes: ['bank_account'], apiName: 'بنك' }
    };

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
            },
            ...(transaction && { transaction })
        });
    } else {
        // Fallback to type-only matching
        location = await MoneyLocation.findOne({
            where: {
                type: {
                    [Op.in]: matchingConfig.locationTypes
                }
            },
            ...(transaction && { transaction })
        });
    }

    if (!location) {
        console.log(`No location found for types: ${matchingConfig.locationTypes.join(', ')}`);
        return null;
    }

    return location;
}

/**
 * GET /api/records/recent
 * Get recent financial records (expenses and profits) for quick reference
 */
router.get('/recent', adminRoleAuth(['superadmin']), async (req, res) => {
    try {
        // Get recent expenses
        const recentExpenses = await Expense.findAll({
            include: [
                {
                    model: ExpenseCategory,
                    as: 'category',
                    attributes: ['name_ar', 'color']
                }
            ],
            order: [['created_at', 'DESC']],
            limit: 10
        });

        // Transform expenses into unified record format
        const records = recentExpenses.map(expense => ({
            id: expense.id,
            name: expense.name_ar || expense.name,
            amount: expense.amount,
            type: expense.type === 'profit' ? 'profit' : 'expense',
            date: expense.date,
            notes: expense.description,
            category: expense.category,
            created_at: expense.created_at,
            updated_at: expense.updated_at
        }));

        res.json({
            success: true,
            data: { records: records }
        });

    } catch (error) {
        console.error('Get recent records error:', error);
        // Return empty records array instead of error
        res.json({
            success: true,
            data: { records: [] }
        });
    }
});

/**
 * POST /api/records
 * Create a new financial record (expense or profit) and automatically create money movement
 */
router.post('/', adminRoleAuth(['superadmin']), async (req, res) => {
    try {
        const {
            category_id,
            amount,
            type,
            date,
            description,
            paymentMethod = 'cash' // Default payment method
        } = req.body;

        // Validate required fields
        if (!category_id || !amount || !type || !date || !description) {
            return res.status(400).json({
                success: false,
                message: 'جميع الحقول المطلوبة يجب ملؤها'
            });
        }

        // Validate amount
        if (isNaN(amount) || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'المبلغ يجب أن يكون رقم موجب'
            });
        }

        // Validate type
        if (!['expense', 'profit'].includes(type)) {
            return res.status(400).json({
                success: false,
                message: 'نوع التسجيل غير صحيح'
            });
        }

        // Start transaction to ensure data consistency
        const transaction = await Expense.sequelize.transaction();

        try {
            console.log('Starting transaction for record creation:', {
                category_id, amount, type, date, description, paymentMethod
            });
            // Get category name for the record
            const category = await ExpenseCategory.findByPk(category_id, { transaction });
            if (!category) {
                throw new Error('Category not found');
            }

            // Create the expense record
            const record = await Expense.create({
                name: category.name,
                name_ar: category.name_ar,
                amount: amount,
                category_id: category_id,
                type: type === 'profit' ? 'fixed' : 'variable', // Use 'fixed' for profits, 'variable' for expenses
                date: date,
                description: description,
                created_by: req.user.id,
                status: 'approved'
            }, { transaction });

            // Find money location based on payment method
            console.log('Looking for money location with payment method:', paymentMethod);
            const moneyLocation = await findLocationForPaymentMethod(paymentMethod, transaction);
            
            console.log('Found money location:', moneyLocation ? moneyLocation.id : 'Not found');

            if (!moneyLocation) {
                throw new Error(`No money location found for payment method: ${paymentMethod}`);
            }

            // Create money movement
            const movementType = type === 'expense' ? 'expense_paid' : 'payment_received';
            const referenceType = type === 'expense' ? 'expense' : 'manual';

            console.log('Creating money movement:', {
                amount: Math.abs(amount),
                movement_type: movementType,
                reference_type: referenceType,
                reference_id: record.id.toString(),
                from_location_id: type === 'expense' ? moneyLocation.id : null,
                to_location_id: type === 'profit' ? moneyLocation.id : null,
                created_by: req.user.id
            });

            // Ensure we have at least one location set
            if (type === 'expense' && !moneyLocation.id) {
                throw new Error('Money location is required for expenses');
            }
            if (type === 'profit' && !moneyLocation.id) {
                throw new Error('Money location is required for profits');
            }

            try {
                const movement = await MoneyMovement.create({
                    amount: Math.abs(amount),
                    movement_type: movementType,
                    reference_type: referenceType,
                    reference_id: record.id.toString(), // Convert to string as per database schema
                    description: `${type === 'expense' ? 'مصروف' : 'ربح'}: ${category.name_ar} - ${description}`,
                    from_location_id: type === 'expense' ? moneyLocation.id : null,
                    to_location_id: type === 'profit' ? moneyLocation.id : null,
                    movement_date: date,
                    created_by: req.user.id
                }, { transaction });
                
                console.log('Successfully created money movement:', movement.id);
            } catch (movementError) {
                console.error('Error creating money movement:', movementError);
                throw new Error(`Failed to create money movement: ${movementError.message}`);
            }

            // Update money location balance
            const balanceChange = type === 'expense' ? -amount : amount;
            const newBalance = parseFloat(moneyLocation.balance || 0) + balanceChange;
            console.log('Updating money location balance:', {
                locationId: moneyLocation.id,
                currentBalance: moneyLocation.balance,
                balanceChange,
                newBalance
            });
            
            await moneyLocation.update({
                balance: newBalance
            }, { transaction });

            // Commit transaction
            await transaction.commit();

            // Get the record with category information
            const recordWithCategory = await Expense.findByPk(record.id, {
                include: [
                    {
                        model: ExpenseCategory,
                        as: 'category',
                        attributes: ['name', 'name_ar', 'color']
                    }
                ]
            });

            const message = type === 'expense' ? 'تم حفظ المصروف بنجاح' : 'تم حفظ الربح بنجاح';

            res.json({
                success: true,
                message: message,
                data: { 
                    record: recordWithCategory,
                    moneyMovement: {
                        locationId: moneyLocation.id,
                        balanceChange: balanceChange,
                        newBalance: parseFloat(moneyLocation.balance || 0) + balanceChange
                    }
                }
            });

        } catch (error) {
            // Rollback transaction on error
            console.error('Error in transaction, rolling back:', error);
            await transaction.rollback();
            throw error;
        }

    } catch (error) {
        console.error('Create record error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'خطأ في حفظ التسجيل',
            error: error.message 
        });
    }
});

/**
 * GET /api/records
 * Get all financial records with pagination and filtering
 */
router.get('/', adminRoleAuth(['superadmin']), async (req, res) => {
    try {
        const { page = 1, limit = 20, type, search, startDate, endDate } = req.query;
        const offset = (page - 1) * limit;

        let whereClause = {};

        // Filter by type
        if (type && ['expense', 'profit'].includes(type)) {
            whereClause.type = type === 'profit' ? 'profit' : { [Op.ne]: 'profit' };
        }

        // Filter by search term
        if (search) {
            whereClause[Op.or] = [
                { name: { [Op.like]: `%${search}%` } },
                { name_ar: { [Op.like]: `%${search}%` } },
                { description: { [Op.like]: `%${search}%` } }
            ];
        }

        // Filter by date range
        if (startDate && endDate) {
            whereClause.date = {
                [Op.between]: [startDate, endDate]
            };
        }

        const { count, rows: records } = await Expense.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: ExpenseCategory,
                    as: 'category',
                    attributes: ['name', 'name_ar', 'color']
                },
                {
                    model: Admin,
                    as: 'creator',
                    attributes: ['name']
                }
            ],
            order: [['date', 'DESC']],
            limit: parseInt(limit),
            offset: offset
        });

        // Transform records to unified format
        const transformedRecords = records.map(record => ({
            id: record.id,
            name: record.name_ar || record.name,
            amount: record.amount,
            type: record.type === 'profit' ? 'profit' : 'expense',
            date: record.date,
            notes: record.description,
            category: record.category,
            creator: record.creator,
            created_at: record.created_at,
            updated_at: record.updated_at
        }));

        res.json({
            success: true,
            data: {
                records: transformedRecords,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: count,
                    pages: Math.ceil(count / limit)
                }
            }
        });

    } catch (error) {
        console.error('Get records error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'خطأ في تحميل التسجيلات',
            error: error.message 
        });
    }
});

/**
 * GET /api/records/stats
 * Get financial statistics
 */
router.get('/stats', adminRoleAuth(['superadmin']), async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        let whereClause = {};

        // Filter by date range if provided
        if (startDate && endDate) {
            whereClause.date = {
                [Op.between]: [startDate, endDate]
            };
        }

        // Get expenses
        const expenses = await Expense.findAll({
            where: {
                ...whereClause,
                type: { [Op.ne]: 'profit' }
            },
            attributes: ['amount']
        });

        // Get profits
        const profits = await Expense.findAll({
            where: {
                ...whereClause,
                type: 'profit'
            },
            attributes: ['amount']
        });

        // Calculate totals
        const totalExpenses = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
        const totalProfits = profits.reduce((sum, profit) => sum + parseFloat(profit.amount), 0);
        const netAmount = totalProfits - totalExpenses;

        res.json({
            success: true,
            data: {
                totalExpenses,
                totalProfits,
                netAmount,
                expenseCount: expenses.length,
                profitCount: profits.length
            }
        });

    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'خطأ في تحميل الإحصائيات',
            error: error.message 
        });
    }
});

/**
 * GET /api/records/categories
 * Get all expense categories
 */
router.get('/categories', adminRoleAuth(['superadmin']), async (req, res) => {
    try {
        const categories = await ExpenseCategory.findAll({
            where: { is_active: true },
            order: [['name_ar', 'ASC']]
        });

        res.json({
            success: true,
            data: { categories: categories }
        });

    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'خطأ في تحميل الفئات',
            error: error.message 
        });
    }
});

/**
 * GET /api/records/:id
 * Get a single financial record by ID
 */
router.get('/:id', adminRoleAuth(['superadmin']), async (req, res) => {
    try {
        const { id } = req.params;

        const record = await Expense.findByPk(id, {
            include: [
                {
                    model: ExpenseCategory,
                    as: 'category',
                    attributes: ['id', 'name', 'name_ar', 'color']
                }
            ]
        });

        if (!record) {
            return res.status(404).json({
                success: false,
                message: 'التسجيل غير موجود'
            });
        }

        res.json({
            success: true,
            data: { record }
        });

    } catch (error) {
        console.error('Get record error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'خطأ في تحميل التسجيل',
            error: error.message 
        });
    }
});

/**
 * PUT /api/records/:id
 * Update a financial record
 */
router.put('/:id', adminRoleAuth(['superadmin']), async (req, res) => {
    try {
        const { id } = req.params;
        const {
            category_id,
            amount,
            type,
            date,
            description,
            paymentMethod = 'cash'
        } = req.body;

        // Validate required fields
        if (!category_id || !amount || !type || !date || !description) {
            return res.status(400).json({
                success: false,
                message: 'جميع الحقول المطلوبة يجب ملؤها'
            });
        }

        // Validate amount
        if (isNaN(amount) || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'المبلغ يجب أن يكون رقم موجب'
            });
        }

        // Validate type
        if (!['expense', 'profit'].includes(type)) {
            return res.status(400).json({
                success: false,
                message: 'نوع التسجيل غير صحيح'
            });
        }

        // Find the record
        const record = await Expense.findByPk(id);
        if (!record) {
            return res.status(404).json({
                success: false,
                message: 'التسجيل غير موجود'
            });
        }

        // Start transaction to ensure data consistency
        const transaction = await Expense.sequelize.transaction();

        try {
            // Get category name for the record
            const category = await ExpenseCategory.findByPk(category_id, { transaction });
            if (!category) {
                throw new Error('Category not found');
            }

            // Find existing money movement for this record
            const existingMovement = await MoneyMovement.findOne({
                where: { 
                    reference_type: 'expense',
                    reference_id: id.toString()
                },
                transaction
            });

            // Find new money location based on payment method
            const newMoneyLocation = await findLocationForPaymentMethod(paymentMethod, transaction);
            if (!newMoneyLocation) {
                throw new Error(`No money location found for payment method: ${paymentMethod}`);
            }

            // If there's an existing movement, reverse it first
            if (existingMovement) {
                const oldLocationId = existingMovement.from_location_id || existingMovement.to_location_id;
                if (oldLocationId) {
                    const oldLocation = await MoneyLocation.findByPk(oldLocationId, { transaction });
                    if (oldLocation) {
                        // Reverse the old balance change
                        const oldBalanceChange = record.type === 'profit' ? -record.amount : record.amount;
                        const oldNewBalance = parseFloat(oldLocation.balance || 0) + oldBalanceChange;
                        await oldLocation.update({ balance: oldNewBalance }, { transaction });
                        console.log(`Reversed balance for old location ${oldLocation.name_ar}: ${oldLocation.balance} -> ${oldNewBalance}`);
                    }
                }
            }

            // Update the expense record
            await record.update({
                name: category.name,
                name_ar: category.name_ar,
                amount: amount,
                category_id: category_id,
                type: type === 'profit' ? 'fixed' : 'variable',
                date: date,
                description: description
            }, { transaction });

            // Create new money movement or update existing one
            const movementType = type === 'expense' ? 'expense_paid' : 'payment_received';
            const balanceChange = type === 'expense' ? -amount : amount;

            if (existingMovement) {
                // Update existing movement
                await existingMovement.update({
                    amount: Math.abs(amount),
                    movement_type: movementType,
                    description: `${type === 'expense' ? 'مصروف' : 'ربح'}: ${category.name_ar} - ${description}`,
                    from_location_id: type === 'expense' ? newMoneyLocation.id : null,
                    to_location_id: type === 'profit' ? newMoneyLocation.id : null,
                    movement_date: date
                }, { transaction });
            } else {
                // Create new movement
                await MoneyMovement.create({
                    amount: Math.abs(amount),
                    movement_type: movementType,
                    reference_type: 'expense',
                    reference_id: id.toString(),
                    description: `${type === 'expense' ? 'مصروف' : 'ربح'}: ${category.name_ar} - ${description}`,
                    from_location_id: type === 'expense' ? newMoneyLocation.id : null,
                    to_location_id: type === 'profit' ? newMoneyLocation.id : null,
                    movement_date: date,
                    created_by: req.user.id
                }, { transaction });
            }

            // Update new money location balance
            const newBalance = parseFloat(newMoneyLocation.balance || 0) + balanceChange;
            await newMoneyLocation.update({ balance: newBalance }, { transaction });
            console.log(`Updated balance for new location ${newMoneyLocation.name_ar}: ${newMoneyLocation.balance} -> ${newBalance}`);

            // Commit transaction
            await transaction.commit();

            // Get updated record with category
            const updatedRecord = await Expense.findByPk(id, {
                include: [
                    {
                        model: ExpenseCategory,
                        as: 'category',
                        attributes: ['name', 'name_ar', 'color']
                    }
                ]
            });

            res.json({
                success: true,
                message: 'تم تحديث التسجيل بنجاح',
                data: { record: updatedRecord }
            });

        } catch (error) {
            // Rollback transaction on error
            console.error('Error in transaction, rolling back:', error);
            await transaction.rollback();
            throw error;
        }

    } catch (error) {
        console.error('Update record error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'خطأ في تحديث التسجيل',
            error: error.message 
        });
    }
});

/**
 * DELETE /api/records/:id
 * Delete a financial record and reverse money movement
 */
router.delete('/:id', adminRoleAuth(['superadmin']), async (req, res) => {
    try {
        const { id } = req.params;

        // Start transaction
        const transaction = await Expense.sequelize.transaction();

        try {
            // Find the record
            const record = await Expense.findByPk(id, { transaction });
            if (!record) {
                await transaction.rollback();
                return res.status(404).json({
                    success: false,
                    message: 'التسجيل غير موجود'
                });
            }

            // Find associated money movement (check both 'expense' and 'manual' reference types)
            const moneyMovement = await MoneyMovement.findOne({
                where: { 
                    reference_type: { [Op.in]: ['expense', 'manual'] },
                    reference_id: id.toString()
                },
                transaction
            });

            console.log('Delete operation - Found money movement:', moneyMovement ? moneyMovement.id : 'None');

            if (moneyMovement) {
                // Reverse the money location balance
                const locationId = moneyMovement.from_location_id || moneyMovement.to_location_id;
                console.log('Delete operation - Location ID for reversal:', locationId);
                
                if (locationId) {
                    const moneyLocation = await MoneyLocation.findByPk(locationId, { transaction });
                    if (moneyLocation) {
                        // For expenses (variable): money was taken from location, so we add it back
                        // For profits (fixed): money was added to location, so we subtract it
                        const balanceChange = record.type === 'fixed' ? -record.amount : record.amount;
                        const newBalance = parseFloat(moneyLocation.balance || 0) + balanceChange;
                        
                        console.log('Delete operation - Reversing balance:', {
                            locationName: moneyLocation.name_ar,
                            currentBalance: moneyLocation.balance,
                            balanceChange,
                            newBalance,
                            recordType: record.type
                        });
                        
                        await moneyLocation.update({ balance: newBalance }, { transaction });
                        console.log(`Reversed balance for location ${moneyLocation.name_ar}: ${moneyLocation.balance} -> ${newBalance}`);
                    } else {
                        console.log('Delete operation - Money location not found for ID:', locationId);
                    }
                } else {
                    console.log('Delete operation - No location ID found in money movement');
                }

                // Delete the money movement
                await moneyMovement.destroy({ transaction });
                console.log('Delete operation - Money movement deleted successfully');
            } else {
                console.log('Delete operation - No money movement found for record ID:', id);
            }

            // Delete the record
            await record.destroy({ transaction });

            // Commit transaction
            await transaction.commit();

            res.json({
                success: true,
                message: 'تم حذف التسجيل بنجاح'
            });

        } catch (error) {
            await transaction.rollback();
            throw error;
        }

    } catch (error) {
        console.error('Delete record error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'خطأ في حذف التسجيل',
            error: error.message 
        });
    }
});

module.exports = router; 