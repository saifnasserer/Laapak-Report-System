/**
 * Laapak Report System - Financial Management Routes
 * Handles all financial operations: dashboard, expenses, product costs, analytics
 */

const express = require('express');
const router = express.Router();
const { adminAuth } = require('../middleware/auth');
const { 
    ExpenseCategory, 
    Expense, 
    ProductCost, 
    FinancialSummary,
    Invoice,
    InvoiceItem,
    Admin
} = require('../models');
const { Op } = require('sequelize');

// =============================================================================
// DASHBOARD ROUTES
// =============================================================================

/**
 * GET /api/financial/dashboard
 * Get financial dashboard data with KPIs and charts
 */
router.get('/dashboard', adminAuth, async (req, res) => {
    try {
        const { month, year } = req.query;
        const currentDate = new Date();
        const targetMonth = month || (currentDate.getMonth() + 1);
        const targetYear = year || currentDate.getFullYear();
        const monthYear = `${targetYear}-${String(targetMonth).padStart(2, '0')}`;

        // Get or calculate current month summary
        let summary = await FinancialSummary.findOne({
            where: { month_year: monthYear }
        });

        if (!summary) {
            try {
                summary = await FinancialSummary.calculateForMonth(monthYear);
            } catch (calcError) {
                console.error('Error calculating financial summary:', calcError);
                // Create a default summary if calculation fails
                summary = await FinancialSummary.create({
                    month_year: monthYear,
                    total_revenue: 0,
                    total_cost: 0,
                    total_expenses: 0,
                    gross_profit: 0,
                    net_profit: 0,
                    profit_margin: 0,
                    invoice_count: 0,
                    expense_count: 0
                });
            }
        }

        // Get alerts
        const alerts = [];

        // Check for products without cost prices
        let itemsWithoutCost = 0;
        try {
            itemsWithoutCost = await InvoiceItem.count({
                where: {
                    cost_price: null,
                    '$Invoice.paymentStatus$': 'paid'
                },
                include: [{
                    model: Invoice,
                    where: {
                        date: {
                            [Op.gte]: `${monthYear}-01`,
                            [Op.lte]: `${monthYear}-31`
                        }
                    }
                }]
            });
        } catch (error) {
            console.error('Error checking items without cost:', error);
        }

        if (itemsWithoutCost > 0) {
            alerts.push({
                type: 'warning',
                message: `${itemsWithoutCost} منتجات بدون سعر تكلفة`,
                message_en: `${itemsWithoutCost} products without cost price`,
                action: 'profit-management'
            });
        }

        // Check for upcoming fixed expenses
        let upcomingExpenses = [];
        try {
            upcomingExpenses = await Expense.findAll({
                where: {
                    type: 'fixed',
                    repeat_monthly: true,
                    status: 'approved'
                },
                include: [{ model: ExpenseCategory, as: 'category' }]
            });
        } catch (error) {
            console.error('Error fetching upcoming expenses:', error);
        }

        const nextMonthDate = new Date(targetYear, targetMonth, 5);
        for (const expense of upcomingExpenses) {
            alerts.push({
                type: 'info',
                message: `${expense.name_ar} سيتم خصمه في ${nextMonthDate.getDate()}/${nextMonthDate.getMonth() + 1}`,
                message_en: `${expense.name} will be deducted on ${nextMonthDate.getDate()}/${nextMonthDate.getMonth() + 1}`,
                action: 'expenses'
            });
        }

        // Get 6-month trend data for charts
        const trendData = [];
        try {
            for (let i = 5; i >= 0; i--) {
                const date = new Date(targetYear, targetMonth - 1 - i, 1);
                const trendMonthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                
                const trendSummary = await FinancialSummary.findOne({
                    where: { month_year: trendMonthYear }
                });

                trendData.push({
                    month: trendMonthYear,
                    revenue: trendSummary ? parseFloat(trendSummary.total_revenue) : 0,
                    expenses: trendSummary ? parseFloat(trendSummary.total_expenses) : 0,
                    profit: trendSummary ? parseFloat(trendSummary.net_profit) : 0
                });
            }
        } catch (error) {
            console.error('Error calculating trend data:', error);
        }

        // Get expense breakdown by category
        let expenseBreakdown = [];
        try {
            expenseBreakdown = await Expense.findAll({
                attributes: [
                    [ExpenseCategory.sequelize.col('category.name_ar'), 'category_name'],
                    [ExpenseCategory.sequelize.col('category.color'), 'color'],
                    [ExpenseCategory.sequelize.fn('SUM', ExpenseCategory.sequelize.col('Expense.amount')), 'total']
                ],
                where: {
                    date: {
                        [Op.gte]: `${monthYear}-01`,
                        [Op.lte]: `${monthYear}-31`
                    },
                    status: ['approved', 'paid']
                },
                include: [{
                    model: ExpenseCategory,
                    as: 'category',
                    attributes: []
                }],
                group: ['category.id'],
                raw: true
            });
        } catch (error) {
            console.error('Error fetching expense breakdown:', error);
        }

        res.json({
            success: true,
            data: {
                kpis: {
                    totalRevenue: parseFloat(summary.total_revenue),
                    totalExpenses: parseFloat(summary.total_expenses),
                    netProfit: parseFloat(summary.net_profit),
                    profitMargin: parseFloat(summary.profit_margin),
                    invoiceCount: summary.invoice_count,
                    expenseCount: summary.expense_count
                },
                charts: {
                    trend: trendData,
                    expenseBreakdown: expenseBreakdown
                },
                alerts: alerts,
                lastCalculated: summary.last_calculated
            }
        });

    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error loading dashboard data',
            error: error.message 
        });
    }
});

/**
 * GET /api/financial/dashboard-simple
 * Simple dashboard endpoint for testing
 */
router.get('/dashboard-simple', adminAuth, async (req, res) => {
    try {
        // Simple test - just return basic data
        const basicData = {
            totalProfit: 0,
            totalExpenses: 0,
            netProfit: 0,
            alerts: [],
            trendData: [],
            expenseBreakdown: []
        };

        // Try to get some basic counts
        try {
            const expenseCount = await Expense.count();
            const categoryCount = await ExpenseCategory.count();
            
            basicData.expenseCount = expenseCount;
            basicData.categoryCount = categoryCount;
        } catch (dbError) {
            console.error('Database error in simple dashboard:', dbError);
            basicData.dbError = dbError.message;
        }

        res.json({
            success: true,
            message: 'Simple dashboard data',
            data: basicData
        });

    } catch (error) {
        console.error('Simple dashboard error:', error);
        res.status(500).json({
            success: false,
            message: 'Simple dashboard failed',
            error: error.message,
            stack: error.stack
        });
    }
});

// =============================================================================
// PROFIT & COST MANAGEMENT ROUTES
// =============================================================================

/**
 * GET /api/financial/profit-management
 * Get combined data for profit and cost management page
 */
router.get('/profit-management', adminAuth, async (req, res) => {
    try {
        const { page = 1, limit = 50, search, startDate, endDate, type } = req.query;
        const offset = (page - 1) * limit;

        let whereClause = {};
        let expenseWhere = {};

        // Date filtering
        if (startDate && endDate) {
            whereClause.date = {
                [Op.between]: [startDate, endDate]
            };
            expenseWhere.date = {
                [Op.between]: [startDate, endDate]
            };
        }

        // Search filtering
        if (search) {
            whereClause[Op.or] = [
                { '$Client.name$': { [Op.like]: `%${search}%` } },
                { '$InvoiceItems.description$': { [Op.like]: `%${search}%` } }
            ];
        }

        // Type filtering (show only invoices, only expenses, or both)
        const results = [];

        if (!type || type === 'invoices') {
            try {
                console.log('Fetching invoices with whereClause:', whereClause);
                
                // Get completed invoices with profit calculations
                const invoices = await Invoice.findAll({
                    where: {
                        ...whereClause,
                        paymentStatus: 'paid'
                    },
                    include: [
                        {
                            model: InvoiceItem,
                            attributes: ['id', 'description', 'amount', 'quantity', 'cost_price', 'profit_amount', 'profit_margin', 'serialNumber', 'type']
                        },
                        {
                            model: Client,
                            attributes: ['name']
                        }
                    ],
                    order: [['date', 'DESC']],
                    limit: parseInt(limit),
                    offset: offset
                });

                console.log(`Found ${invoices.length} invoices`);
                
                for (const invoice of invoices) {
                    console.log(`Invoice ${invoice.id} has ${invoice.InvoiceItems.length} items`);
                    for (const item of invoice.InvoiceItems) {
                        results.push({
                            id: `invoice-${invoice.id}-${item.id}`,
                            type: 'invoice',
                            date: invoice.date,
                            description: item.description,
                            client_name: invoice.Client?.name,
                            sale_price: parseFloat(item.amount),
                            cost_price: item.cost_price ? parseFloat(item.cost_price) : null,
                            quantity: item.quantity,
                            profit_amount: item.profit_amount ? parseFloat(item.profit_amount) : null,
                            profit_margin: item.profit_margin ? parseFloat(item.profit_margin) : null,
                            serial_number: item.serialNumber,
                            item_id: item.id,
                            item_type: item.type, // laptop, item, service
                            needs_cost_price: !item.cost_price
                        });
                    }
                }
                
                console.log(`Total results from invoices: ${results.length}`);
            } catch (invoiceError) {
                console.error('Error fetching invoices:', invoiceError);
            }
        }

        if (!type || type === 'expenses') {
            try {
                // Get expenses
                const expenses = await Expense.findAll({
                    where: {
                        ...expenseWhere,
                        status: ['approved', 'paid']
                    },
                    include: [
                        {
                            model: ExpenseCategory,
                            as: 'category',
                            attributes: ['name_ar', 'color']
                        }
                    ],
                    order: [['date', 'DESC']],
                    limit: parseInt(limit),
                    offset: offset
                });

                for (const expense of expenses) {
                    results.push({
                        id: `expense-${expense.id}`,
                        type: 'expense',
                        date: expense.date,
                        description: expense.name_ar,
                        category: expense.category?.name_ar,
                        amount: parseFloat(expense.amount),
                        expense_type: expense.type,
                        color: expense.category?.color
                    });
                }
            } catch (expenseError) {
                console.error('Error fetching expenses:', expenseError);
            }
        }

        // Sort combined results by date
        results.sort((a, b) => new Date(b.date) - new Date(a.date));

        console.log(`Sending ${results.length} total results`);
        console.log('Sample result:', results[0]);

        res.json({
            success: true,
            data: {
                items: results,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: results.length
                }
            }
        });

    } catch (error) {
        console.error('Profit management error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error loading profit management data',
            error: error.message 
        });
    }
});

/**
 * PUT /api/financial/cost-prices/bulk
 * Bulk update cost prices for invoice items
 */
router.put('/cost-prices/bulk', adminAuth, async (req, res) => {
    try {
        const { updates } = req.body; // Array of { item_id, cost_price, product_name, product_model, serial_number }
        const updatedItems = [];

        for (const update of updates) {
            try {
                // Update the invoice item
                await InvoiceItem.update(
                    { cost_price: update.cost_price },
                    { where: { id: update.item_id } }
                );

                // Create/update product cost record
                if (update.product_name && update.product_model) {
                    await ProductCost.upsert({
                        product_name: update.product_name,
                        product_model: update.product_model,
                        serial_number: update.serial_number,
                        cost_price: update.cost_price,
                        effective_date: new Date(),
                        created_by: req.user.id,
                        updated_by: req.user.id
                    });
                }

                updatedItems.push(update.item_id);
            } catch (itemError) {
                console.error(`Error updating item ${update.item_id}:`, itemError);
            }
        }

        res.json({
            success: true,
            message: `تم تحديث ${updatedItems.length} عنصر بنجاح`,
            data: { updated_items: updatedItems }
        });

    } catch (error) {
        console.error('Bulk cost price update error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error updating cost prices',
            error: error.message 
        });
    }
});

/**
 * PUT /api/financial/cost-price/:itemId
 * Update cost price for a single invoice item
 */
router.put('/cost-price/:itemId', adminAuth, async (req, res) => {
    try {
        const { itemId } = req.params;
        const { cost_price, product_name, product_model, serial_number } = req.body;

        // Update the invoice item
        await InvoiceItem.update(
            { cost_price: cost_price },
            { where: { id: itemId } }
        );

        // Create/update product cost record if product details provided
        if (product_name && product_model) {
            await ProductCost.upsert({
                product_name: product_name,
                product_model: product_model,
                serial_number: serial_number,
                cost_price: cost_price,
                effective_date: new Date(),
                created_by: req.user.id,
                updated_by: req.user.id
            });
        }

        res.json({
            success: true,
            message: 'تم تحديث تكلفة المنتج بنجاح',
            data: { item_id: itemId, cost_price: cost_price }
        });

    } catch (error) {
        console.error('Cost price update error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error updating cost price',
            error: error.message 
        });
    }
});

/**
 * POST /api/financial/calculate-profits
 * Calculate profits for all invoice items with cost prices
 */
router.post('/calculate-profits', adminAuth, async (req, res) => {
    try {
        // Get all invoice items with cost prices but no profit calculation
        const items = await InvoiceItem.findAll({
            where: {
                cost_price: { [Op.not]: null },
                profit_amount: null
            },
            include: [{
                model: Invoice,
                where: { paymentStatus: 'paid' }
            }]
        });

        let calculatedCount = 0;
        for (const item of items) {
            // Profit calculation is handled by database triggers
            // Just refresh the item to get calculated values
            await item.reload();
            calculatedCount++;
        }

        res.json({
            success: true,
            message: `تم حساب الأرباح لـ ${calculatedCount} منتج`,
            data: { calculated_count: calculatedCount }
        });

    } catch (error) {
        console.error('Profit calculation error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error calculating profits',
            error: error.message 
        });
    }
});

// =============================================================================
// EXPENSE MANAGEMENT ROUTES
// =============================================================================

/**
 * GET /api/financial/expenses
 * Get all expenses with filtering and pagination
 */
router.get('/expenses', adminAuth, async (req, res) => {
    try {
        const { page = 1, limit = 20, category, type, status, search } = req.query;
        const offset = (page - 1) * limit;

        let whereClause = {};

        if (category) whereClause.category_id = category;
        if (type) whereClause.type = type;
        if (status) whereClause.status = status;
        if (search) {
            whereClause[Op.or] = [
                { name: { [Op.like]: `%${search}%` } },
                { name_ar: { [Op.like]: `%${search}%` } }
            ];
        }

        const { count, rows: expenses } = await Expense.findAndCountAll({
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

        res.json({
            success: true,
            data: {
                expenses: expenses,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: count,
                    pages: Math.ceil(count / limit)
                }
            }
        });

    } catch (error) {
        console.error('Get expenses error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error loading expenses',
            error: error.message 
        });
    }
});

/**
 * POST /api/financial/expenses
 * Create a new expense
 */
router.post('/expenses', adminAuth, async (req, res) => {
    try {
        const {
            name,
            name_ar,
            amount,
            category_id,
            type,
            date,
            repeat_monthly,
            description,
            receipt_url
        } = req.body;

        const expense = await Expense.create({
            name,
            name_ar,
            amount,
            category_id,
            type,
            date,
            repeat_monthly: repeat_monthly || false,
            description,
            receipt_url,
            created_by: req.user.id,
            status: 'approved' // Auto-approve for now
        });

        const expenseWithCategory = await Expense.findByPk(expense.id, {
            include: [
                {
                    model: ExpenseCategory,
                    as: 'category',
                    attributes: ['name', 'name_ar', 'color']
                }
            ]
        });

        res.status(201).json({
            success: true,
            message: 'تم إضافة المصروف بنجاح',
            data: { expense: expenseWithCategory }
        });

    } catch (error) {
        console.error('Create expense error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error creating expense',
            error: error.message 
        });
    }
});

/**
 * GET /api/financial/expense-categories
 * Get all expense categories
 */
router.get('/expense-categories', adminAuth, async (req, res) => {
    try {
        const categories = await ExpenseCategory.findAll({
            where: { is_active: true },
            order: [['name_ar', 'ASC']]
        });

        res.json({
            success: true,
            data: { categories }
        });

    } catch (error) {
        console.error('Get expense categories error:', error);
        // Return empty categories array instead of error
        res.json({
            success: true,
            data: { categories: [] }
        });
    }
});

/**
 * GET /api/financial/recent-expenses
 * Get recent expenses for the add expense form
 */
router.get('/recent-expenses', adminAuth, async (req, res) => {
    try {
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

        res.json({
            success: true,
            data: { expenses: recentExpenses }
        });

    } catch (error) {
        console.error('Get recent expenses error:', error);
        // Return empty expenses array instead of error
        res.json({
            success: true,
            data: { expenses: [] }
        });
    }
});

// =============================================================================
// PRODUCT COST ROUTES
// =============================================================================

/**
 * GET /api/financial/product-costs
 * Get product costs with search and pagination
 */
router.get('/product-costs', adminAuth, async (req, res) => {
    try {
        const { page = 1, limit = 20, search } = req.query;
        const offset = (page - 1) * limit;

        let whereClause = {};
        if (search) {
            whereClause[Op.or] = [
                { product_name: { [Op.like]: `%${search}%` } },
                { product_model: { [Op.like]: `%${search}%` } },
                { serial_number: { [Op.like]: `%${search}%` } }
            ];
        }

        const { count, rows: productCosts } = await ProductCost.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: Admin,
                    as: 'creator',
                    attributes: ['name']
                }
            ],
            order: [['effective_date', 'DESC']],
            limit: parseInt(limit),
            offset: offset
        });

        res.json({
            success: true,
            data: {
                productCosts,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: count,
                    pages: Math.ceil(count / limit)
                }
            }
        });

    } catch (error) {
        console.error('Get product costs error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error loading product costs',
            error: error.message 
        });
    }
});

// =============================================================================
// ANALYTICS ROUTES
// =============================================================================

/**
 * GET /api/financial/analytics/monthly-summary/:monthYear
 * Recalculate and get monthly summary
 */
router.get('/analytics/monthly-summary/:monthYear', adminAuth, async (req, res) => {
    try {
        const { monthYear } = req.params;
        const summary = await FinancialSummary.calculateForMonth(monthYear);

        res.json({
            success: true,
            data: { summary }
        });

    } catch (error) {
        console.error('Monthly summary error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error calculating monthly summary',
            error: error.message 
        });
    }
});

// =============================================================================
// TEST ROUTES
// =============================================================================

/**
 * GET /api/financial/test
 * Test endpoint to check if financial tables and models exist
 */
router.get('/test', adminAuth, async (req, res) => {
    try {
        // Test if models are loaded
        const modelTests = {
            ExpenseCategory: typeof ExpenseCategory !== 'undefined',
            Expense: typeof Expense !== 'undefined',
            ProductCost: typeof ProductCost !== 'undefined',
            FinancialSummary: typeof FinancialSummary !== 'undefined'
        };

        // Test if tables exist by trying to count records
        const tableTests = {};
        
        try {
            await ExpenseCategory.count();
            tableTests.ExpenseCategory = true;
        } catch (error) {
            tableTests.ExpenseCategory = false;
            tableTests.ExpenseCategoryError = error.message;
        }

        try {
            await Expense.count();
            tableTests.Expense = true;
        } catch (error) {
            tableTests.Expense = false;
            tableTests.ExpenseError = error.message;
        }

        try {
            await ProductCost.count();
            tableTests.ProductCost = true;
        } catch (error) {
            tableTests.ProductCost = false;
            tableTests.ProductCostError = error.message;
        }

        try {
            await FinancialSummary.count();
            tableTests.FinancialSummary = true;
        } catch (error) {
            tableTests.FinancialSummary = false;
            tableTests.FinancialSummaryError = error.message;
        }

        res.json({
            success: true,
            message: 'Financial module test results',
            modelTests,
            tableTests
        });

    } catch (error) {
        console.error('Financial test error:', error);
        res.status(500).json({
            success: false,
            message: 'Financial test failed',
            error: error.message,
            stack: error.stack
        });
    }
});

// =============================================================================

module.exports = router; 