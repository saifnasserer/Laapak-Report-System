const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { adminRoleAuth } = require('../middleware/auth');
const { Expense, ExpenseCategory, Admin, MoneyMovement, MoneyLocation } = require('../models');

/**
 * Helper function to map payment method to money location type
 */
function mapPaymentMethodToLocationType(paymentMethod) {
    const mapping = {
        'cash': 'cash',
        'instapay': 'digital_wallet',
        'wallet': 'digital_wallet',
        'محفظة': 'digital_wallet',
        'بنك': 'bank_account',
        'bank': 'bank_account'
    };
    return mapping[paymentMethod] || 'cash';
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

            // Find or create money location based on payment method
            console.log('Looking for money location with payment method:', paymentMethod);
            let moneyLocation = await MoneyLocation.findOne({
                where: {
                    [Op.or]: [
                        { name_ar: { [Op.like]: `%${paymentMethod}%` } },
                        { type: mapPaymentMethodToLocationType(paymentMethod) }
                    ]
                },
                transaction
            });
            
            console.log('Found money location:', moneyLocation ? moneyLocation.id : 'Not found');

            // If no location found, create a default one
            if (!moneyLocation) {
                console.log('Creating new money location for payment method:', paymentMethod);
                moneyLocation = await MoneyLocation.create({
                    name: paymentMethod === 'cash' ? 'Cash' : 
                          paymentMethod === 'instapay' ? 'Instapay' :
                          paymentMethod === 'wallet' ? 'Digital Wallet' : 'Bank Account',
                    name_ar: paymentMethod === 'cash' ? 'نقداً' : 
                            paymentMethod === 'instapay' ? 'Instapay' :
                            paymentMethod === 'wallet' ? 'محفظة رقمية' : 'حساب بنكي',
                    type: mapPaymentMethodToLocationType(paymentMethod),
                    balance: 0
                }, { transaction });
                console.log('Created money location with ID:', moneyLocation.id);
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

            await MoneyMovement.create({
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

            // Find associated money movement
            const moneyMovement = await MoneyMovement.findOne({
                where: { 
                    reference_type: 'expense',
                    reference_id: id.toString()
                },
                transaction
            });

            if (moneyMovement) {
                // Reverse the money location balance
                const locationId = moneyMovement.from_location_id || moneyMovement.to_location_id;
                if (locationId) {
                    const moneyLocation = await MoneyLocation.findByPk(locationId, { transaction });
                    if (moneyLocation) {
                        const balanceChange = record.type === 'profit' ? -record.amount : record.amount;
                        await moneyLocation.update({
                            balance: parseFloat(moneyLocation.balance || 0) + balanceChange
                        }, { transaction });
                    }
                }

                // Delete the money movement
                await moneyMovement.destroy({ transaction });
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

module.exports = router; 