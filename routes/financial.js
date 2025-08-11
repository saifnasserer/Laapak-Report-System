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
    Admin,
    Client
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
                
                // Use direct SQL query to bypass association issues
                const { sequelize } = require('../models');
                
                const query = `
                    SELECT 
                        i.id as invoice_id,
                        i.date as invoice_date,
                        i.total as invoice_total,
                        c.name as client_name,
                        c.id as client_id,
                        COUNT(ii.id) as items_count,
                        COALESCE(SUM(ii.cost_price * ii.quantity), 0) as total_cost,
                        COALESCE(SUM(ii.profit_amount), 0) as total_profit
                    FROM invoices i
                    LEFT JOIN clients c ON i.client_id = c.id
                    LEFT JOIN invoice_items ii ON i.id = ii.invoiceId
                    WHERE i.paymentStatus = 'paid'
                    GROUP BY i.id, i.date, i.total, c.name, c.id
                    ORDER BY i.date DESC
                    LIMIT ${parseInt(limit)}
                    OFFSET ${offset}
                `;
                
                const [rawResults] = await sequelize.query(query);
                console.log(`Raw SQL query returned ${rawResults.length} invoices`);
                
                for (const row of rawResults) {
                    results.push({
                        id: `invoice-${row.invoice_id}`,
                        type: 'invoice',
                        date: row.invoice_date,
                        invoice_id: row.invoice_id,
                        client_name: row.client_name,
                        client_id: row.client_id,
                        total: parseFloat(row.invoice_total),
                        items_count: parseInt(row.items_count),
                        total_cost: parseFloat(row.total_cost),
                        total_profit: parseFloat(row.total_profit)
                    });
                }
                
                console.log(`Total results from invoices: ${results.length}`);
            } catch (invoiceError) {
                console.error('Error fetching invoices:', invoiceError);
                console.error('Error details:', invoiceError.message);
                console.error('Error stack:', invoiceError.stack);
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
        console.log('Received bulk update request:', updates);
        console.log('Updates count:', updates ? updates.length : 0);
        
        const updatedItems = [];

        for (const update of updates) {
            try {
                console.log('Processing update:', update);
                
                // Update the invoice item
                console.log(`Updating InvoiceItem with id: ${update.item_id} (type: ${typeof update.item_id})`);
                
                // First check if the item exists
                const existingItem = await InvoiceItem.findByPk(parseInt(update.item_id));
                console.log(`Existing item found:`, existingItem ? 'Yes' : 'No');
                
                if (existingItem) {
                    const updateResult = await InvoiceItem.update(
                        { cost_price: update.cost_price },
                        { where: { id: parseInt(update.item_id) } }
                    );
                    console.log(`InvoiceItem update result:`, updateResult);
                    
                    if (updateResult[0] > 0) {
                        console.log(`Successfully updated item ${update.item_id} with cost price ${update.cost_price}`);
                    } else {
                        console.log(`No rows were updated for item ${update.item_id}`);
                    }
                } else {
                    console.log(`Item with id ${update.item_id} not found in database`);
                }

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

        console.log(`Successfully updated ${updatedItems.length} items:`, updatedItems);
        
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

        console.log(`Single cost price update - itemId: ${itemId}, cost_price: ${cost_price}`);

        // First check if the item exists
        const existingItem = await InvoiceItem.findByPk(parseInt(itemId));
        console.log(`Existing item found:`, existingItem ? 'Yes' : 'No');
        console.log(`Item details:`, existingItem ? {
            id: existingItem.id,
            description: existingItem.description,
            current_cost: existingItem.cost_price
        } : 'Not found');
        
        if (existingItem) {
            // Use Sequelize ORM approach like the working routes
            const updateResult = await InvoiceItem.update(
                { cost_price: parseFloat(cost_price) },
                { where: { id: parseInt(itemId) } }
            );
            console.log(`InvoiceItem update result:`, updateResult);
            
            if (updateResult[0] > 0) {
                console.log(`Successfully updated item ${itemId} with cost price ${cost_price}`);
                
                // Verify the update by fetching the item again
                const updatedItem = await InvoiceItem.findByPk(parseInt(itemId));
                console.log(`Updated item cost_price:`, updatedItem.cost_price);
            } else {
                console.log(`No rows were updated for item ${itemId}`);
            }
        } else {
            console.log(`Item with id ${itemId} not found in database`);
        }

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
 * GET /api/financial/invoice/:invoiceId/items
 * Get invoice items for a specific invoice
 */
router.get('/invoice/:invoiceId/items', adminAuth, async (req, res) => {
    try {
        const { invoiceId } = req.params;
        
        // Use the same approach as the working invoices route
        const invoice = await Invoice.findByPk(invoiceId, {
            include: [
                { model: InvoiceItem, as: 'InvoiceItems' }
            ]
        });
        
        if (!invoice) {
            return res.status(404).json({ 
                success: false, 
                message: 'Invoice not found' 
            });
        }
        
        // Transform the data to match the expected format
        const items = invoice.InvoiceItems.map(item => ({
            item_id: item.id,
            item_description: item.description,
            sale_price: parseFloat(item.amount),
            quantity: parseInt(item.quantity || 1),
            cost_price: item.cost_price ? parseFloat(item.cost_price) : null,
            profit_amount: item.profit_amount ? parseFloat(item.profit_amount) : null,
            profit_margin: item.profit_margin ? parseFloat(item.profit_margin) : null,
            serialNumber: item.serialNumber,
            item_type: item.type,
            needs_cost_price: !item.cost_price
        }));
        
        res.json({
            success: true,
            data: items
        });
        
    } catch (error) {
        console.error('Error fetching invoice items:', error);
        
        // Log detailed error information for debugging
        if (error.name) console.error('Error name:', error.name);
        if (error.message) console.error('Error message:', error.message);
        
        // Check for specific error types
        if (error.name === 'SequelizeEagerLoadingError') {
            return res.status(500).json({
                success: false,
                message: 'Failed to load associated data',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
        
        if (error.name && error.name.includes('Sequelize')) {
            return res.status(500).json({
                success: false,
                message: 'Database error occurred',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
        
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch invoice items',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined 
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
            FinancialSummary: typeof FinancialSummary !== 'undefined',
            Invoice: typeof Invoice !== 'undefined',
            InvoiceItem: typeof InvoiceItem !== 'undefined',
            Client: typeof Client !== 'undefined'
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

        try {
            const invoiceCount = await Invoice.count();
            tableTests.Invoice = true;
            tableTests.InvoiceCount = invoiceCount;
        } catch (error) {
            tableTests.Invoice = false;
            tableTests.InvoiceError = error.message;
        }

        try {
            const itemCount = await InvoiceItem.count();
            tableTests.InvoiceItem = true;
            tableTests.InvoiceItemCount = itemCount;
        } catch (error) {
            tableTests.InvoiceItem = false;
            tableTests.InvoiceItemError = error.message;
        }

        try {
            const paidInvoices = await Invoice.count({ where: { paymentStatus: 'paid' } });
            tableTests.PaidInvoices = paidInvoices;
        } catch (error) {
            tableTests.PaidInvoices = false;
            tableTests.PaidInvoicesError = error.message;
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