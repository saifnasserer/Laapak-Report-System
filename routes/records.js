const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const adminAuth = require('../middleware/auth');
const { Expense, ExpenseCategory, Admin } = require('../models');

/**
 * GET /api/records/recent
 * Get recent financial records (expenses and profits) for quick reference
 */
router.get('/recent', adminAuth, async (req, res) => {
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
            category: expense.category
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
 * Create a new financial record (expense or profit)
 */
router.post('/', adminAuth, async (req, res) => {
    try {
        const {
            name,
            amount,
            type,
            date,
            notes
        } = req.body;

        // Validate required fields
        if (!name || !amount || !type || !date) {
            return res.status(400).json({
                success: false,
                message: 'جميع الحقول مطلوبة'
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

        // Create the record
        const record = await Expense.create({
            name: name,
            name_ar: name, // Use the same name for both fields
            amount: amount,
            category_id: 1, // Default category (you might want to make this configurable)
            type: type === 'profit' ? 'profit' : 'variable', // Use 'profit' type for profits, 'variable' for expenses
            date: date,
            description: notes || '',
            created_by: req.user.id,
            status: 'approved'
        });

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
            data: { record: recordWithCategory }
        });

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
router.get('/', adminAuth, async (req, res) => {
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
            created_at: record.created_at
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
 * PUT /api/records/:id
 * Update a financial record
 */
router.put('/:id', adminAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name,
            amount,
            type,
            date,
            notes
        } = req.body;

        // Find the record
        const record = await Expense.findByPk(id);
        if (!record) {
            return res.status(404).json({
                success: false,
                message: 'التسجيل غير موجود'
            });
        }

        // Update the record
        await record.update({
            name: name || record.name,
            name_ar: name || record.name_ar,
            amount: amount || record.amount,
            type: type === 'profit' ? 'profit' : 'variable',
            date: date || record.date,
            description: notes || record.description
        });

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
 * Delete a financial record
 */
router.delete('/:id', adminAuth, async (req, res) => {
    try {
        const { id } = req.params;

        // Find the record
        const record = await Expense.findByPk(id);
        if (!record) {
            return res.status(404).json({
                success: false,
                message: 'التسجيل غير موجود'
            });
        }

        // Delete the record
        await record.destroy();

        res.json({
            success: true,
            message: 'تم حذف التسجيل بنجاح'
        });

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
 * GET /api/records/stats
 * Get financial statistics
 */
router.get('/stats', adminAuth, async (req, res) => {
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

module.exports = router; 