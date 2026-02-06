/**
 * Laapak Report System - Financial Management Routes
 * Handles all financial operations: dashboard, expenses, product costs, analytics
 */

const express = require('express');
const router = express.Router();
const { adminRoleAuth } = require('../middleware/auth');
const {
    ExpenseCategory,
    Expense,
    ProductCost,
    FinancialSummary,
    Invoice,
    InvoiceItem,
    Admin,
    Client,
    MoneyLocation,
    MoneyMovement
} = require('../models');
const { findLocationForPaymentMethod } = require('./invoice-hooks');
const { Op } = require('sequelize');

// =============================================================================
// DASHBOARD ROUTES
// =============================================================================

/**
 * GET /api/financial/dashboard
 * Get financial dashboard data with KPIs and charts
 * Access: Superadmin only
 */
router.get('/dashboard', adminRoleAuth(['superadmin']), async (req, res) => {
    try {
        const { startDate, endDate, month, year } = req.query;

        console.log('Dashboard received query params:', { startDate, endDate, month, year });

        // Determine date range
        let startDateObj, endDateObj;

        if (startDate && endDate) {
            // Use provided date range
            startDateObj = new Date(startDate);
            endDateObj = new Date(endDate);
        } else {
            // Use month/year or default to current month
            const currentDate = new Date();
            const targetMonth = month || (currentDate.getMonth() + 1);
            const targetYear = year || currentDate.getFullYear();

            startDateObj = new Date(targetYear, targetMonth - 1, 1);
            endDateObj = new Date(targetYear, targetMonth, 0);
        }

        // Format dates for database queries (avoid timezone issues)
        const formatDateForDB = (date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        const startDateStr = formatDateForDB(startDateObj);
        const endDateStr = formatDateForDB(endDateObj);

        console.log('Dashboard date range:', {
            startDate: startDateStr,
            endDate: endDateStr,
            startDateObj: startDateObj.toISOString(),
            endDateObj: endDateObj.toISOString()
        });

        // Calculate KPIs from invoices and expenses for the date range
        let totalRevenue = 0;
        let totalCost = 0;
        let totalExpenses = 0;
        let invoiceCount = 0;
        let expenseCount = 0;

        // Get revenue and cost from ALL invoices (not just those with cost prices)
        try {
            const invoices = await Invoice.findAll({
                where: {
                    date: {
                        [Op.between]: [startDateStr, endDateStr]
                    },
                    paymentStatus: ['paid', 'completed']
                },
                include: [{
                    model: InvoiceItem,
                    as: 'InvoiceItems'
                }]
            });

            console.log(`Found ${invoices.length} invoices in date range`);

            for (const invoice of invoices) {
                // Count ALL invoices for revenue (not just those with cost prices)
                totalRevenue += parseFloat(invoice.total) || 0;
                invoiceCount++;

                // Calculate total cost from invoice items (only if cost price exists)
                if (invoice.InvoiceItems && invoice.InvoiceItems.length > 0) {
                    for (const item of invoice.InvoiceItems) {
                        if (item.cost_price) {
                            const costPrice = parseFloat(item.cost_price) || 0;
                            const quantity = parseInt(item.quantity) || 1;
                            totalCost += costPrice * quantity;
                        }
                    }
                }
            }

            console.log(`Dashboard calculations: Revenue=${totalRevenue}, Cost=${totalCost}, InvoiceCount=${invoiceCount}`);
        } catch (error) {
            console.error('Error fetching invoices:', error);
        }

        // Get expenses
        try {
            const expenses = await Expense.findAll({
                where: {
                    date: {
                        [Op.between]: [startDateStr, endDateStr]
                    },
                    status: ['approved', 'paid'],
                    type: 'variable' // Only get variable expenses, not fixed profits
                }
            });

            for (const expense of expenses) {
                totalExpenses += parseFloat(expense.amount) || 0;
                expenseCount++;
            }

            console.log(`Found ${expenseCount} expenses totaling ${totalExpenses}`);
        } catch (error) {
            console.error('Error fetching expenses:', error);
        }

        // Calculate revenue breakdown FIRST
        let revenueWithCost = 0;
        let revenueWithoutCost = 0;

        try {
            // Get revenue from invoices WITH cost prices
            const invoicesWithCostData = await Invoice.findAll({
                where: {
                    date: {
                        [Op.between]: [startDateStr, endDateStr]
                    },
                    paymentStatus: ['paid', 'completed']
                },
                include: [{
                    model: InvoiceItem,
                    as: 'InvoiceItems',
                    where: {
                        cost_price: {
                            [Op.not]: null
                        }
                    }
                }]
            });

            // Get revenue from invoices WITHOUT cost prices
            const invoicesWithoutCostData = await Invoice.findAll({
                where: {
                    date: {
                        [Op.between]: [startDateStr, endDateStr]
                    },
                    paymentStatus: ['paid', 'completed']
                },
                include: [{
                    model: InvoiceItem,
                    as: 'InvoiceItems',
                    where: {
                        cost_price: null
                    }
                }]
            });

            // Calculate revenue from invoices with cost prices
            for (const invoice of invoicesWithCostData) {
                if (invoice.InvoiceItems && invoice.InvoiceItems.length > 0) {
                    revenueWithCost += parseFloat(invoice.total) || 0;
                }
            }

            // Calculate revenue from invoices without cost prices
            for (const invoice of invoicesWithoutCostData) {
                if (invoice.InvoiceItems && invoice.InvoiceItems.length > 0) {
                    revenueWithoutCost += parseFloat(invoice.total) || 0;
                }
            }

            console.log(`Revenue breakdown: WithCost=${revenueWithCost}, WithoutCost=${revenueWithoutCost}, Total=${totalRevenue}`);
        } catch (error) {
            console.error('Error calculating revenue breakdown:', error);
        }

        // Calculate profits - only for items with cost prices
        const grossProfit = totalCost > 0 ? revenueWithCost - totalCost : 0;
        const netProfit = grossProfit - totalExpenses;

        // Calculate profit margin only for invoices with cost prices
        let profitMargin = 0;
        if (totalCost > 0 && revenueWithCost > 0) {
            profitMargin = (grossProfit / revenueWithCost) * 100;
        }

        // Additional calculations for better insights
        const invoicesWithCost = await Invoice.count({
            where: {
                date: {
                    [Op.between]: [startDateStr, endDateStr]
                },
                paymentStatus: ['paid', 'completed']
            },
            include: [{
                model: InvoiceItem,
                as: 'InvoiceItems',
                where: {
                    cost_price: {
                        [Op.not]: null
                    }
                }
            }]
        });

        const invoicesWithoutCost = invoiceCount - invoicesWithCost;



        console.log(`Profit calculations: GrossProfit=${grossProfit}, NetProfit=${netProfit}, Margin=${profitMargin}%`);
        console.log(`Invoice breakdown: Total=${invoiceCount}, WithCost=${invoicesWithCost}, WithoutCost=${invoicesWithoutCost}`);
        console.log(`Revenue breakdown: Total=${totalRevenue}, WithCost=${revenueWithCost}, WithoutCost=${revenueWithoutCost}`);
        console.log(`Cost breakdown: TotalCost=${totalCost}, Expenses=${totalExpenses}`);

        // Verify profit calculation
        const expectedGrossProfit = revenueWithCost - totalCost;
        const expectedNetProfit = expectedGrossProfit - totalExpenses;
        console.log(`Profit verification: ExpectedGrossProfit=${expectedGrossProfit}, ExpectedNetProfit=${expectedNetProfit}`);
        console.log(`Profit verification: ActualGrossProfit=${grossProfit}, ActualNetProfit=${netProfit}`);
        console.log(`Profit calculation breakdown: RevenueWithCost=${revenueWithCost} - TotalCost=${totalCost} = GrossProfit=${grossProfit}`);
        console.log(`Net profit calculation: GrossProfit=${grossProfit} - Expenses=${totalExpenses} = NetProfit=${netProfit}`);

        // Get alerts
        const alerts = [];

        // Check for products without cost prices
        try {
            const itemsWithoutCost = await InvoiceItem.count({
                where: {
                    cost_price: null,
                    '$invoice.date$': {
                        [Op.between]: [startDateStr, endDateStr]
                    },
                    '$invoice.paymentStatus$': ['paid', 'completed']
                },
                include: [{
                    model: Invoice,
                    as: 'invoice'
                }]
            });

            if (itemsWithoutCost > 0) {
                alerts.push({
                    type: 'warning',
                    message: `${itemsWithoutCost} منتجات بدون سعر تكلفة في الفترة المحددة`,
                    message_en: `${itemsWithoutCost} products without cost price in selected period`,
                    action: 'profit-management'
                });
            }

            console.log(`Found ${itemsWithoutCost} items without cost prices in date range`);

            // Add alert for invoices without cost prices
            if (invoicesWithoutCost > 0) {
                alerts.push({
                    type: 'info',
                    message: `${invoicesWithoutCost} فواتير بدون تكاليف (${((invoicesWithoutCost / invoiceCount) * 100).toFixed(1)}%) - الربح محسوب فقط للفواتير مع التكاليف`,
                    message_en: `${invoicesWithoutCost} invoices without costs (${((invoicesWithoutCost / invoiceCount) * 100).toFixed(1)}%) - Profit calculated only for invoices with costs`,
                    action: 'profit-management'
                });
            }

            // Add alert if no costs are set
            if (totalCost === 0 && totalRevenue > 0) {
                alerts.push({
                    type: 'warning',
                    message: 'لا توجد تكاليف محددة - الربح غير محسوب',
                    message_en: 'No costs set - Profit not calculated',
                    action: 'profit-management'
                });
            }
        } catch (error) {
            console.error('Error checking items without cost:', error);
        }

        // Check for upcoming fixed expenses
        try {
            const upcomingExpenses = await Expense.findAll({
                where: {
                    type: 'fixed',
                    repeat_monthly: true,
                    status: 'approved'
                },
                include: [{ model: ExpenseCategory, as: 'category' }]
            });

            const nextMonthDate = new Date(endDateObj.getFullYear(), endDateObj.getMonth() + 1, 5);
            for (const expense of upcomingExpenses) {
                alerts.push({
                    type: 'info',
                    message: `${expense.name_ar} سيتم خصمه في ${nextMonthDate.getDate()}/${nextMonthDate.getMonth() + 1}`,
                    message_en: `${expense.name} will be deducted on ${nextMonthDate.getDate()}/${nextMonthDate.getMonth() + 1}`,
                    action: 'expenses'
                });
            }
        } catch (error) {
            console.error('Error fetching upcoming expenses:', error);
        }

        // Get trend data for charts based on the selected date range
        const trendData = [];
        try {
            // Calculate the number of months in the selected date range
            const startMonth = new Date(startDateObj.getFullYear(), startDateObj.getMonth(), 1);
            const endMonth = new Date(endDateObj.getFullYear(), endDateObj.getMonth(), 1);
            const monthDiff = (endMonth.getFullYear() - startMonth.getFullYear()) * 12 + (endMonth.getMonth() - startMonth.getMonth()) + 1;

            console.log(`Generating trend data for ${monthDiff} months from ${startMonth.toISOString()} to ${endMonth.toISOString()}`);

            // Generate monthly data points for the selected period
            for (let i = 0; i < monthDiff; i++) {
                const date = new Date(startMonth.getFullYear(), startMonth.getMonth() + i, 1);
                const trendStartDate = new Date(date.getFullYear(), date.getMonth(), 1);
                const trendEndDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);

                const trendStartStr = formatDateForDB(trendStartDate);
                const trendEndStr = formatDateForDB(trendEndDate);

                // Get revenue for this month (ALL invoices, not just those with cost prices)
                const monthInvoices = await Invoice.findAll({
                    where: {
                        date: {
                            [Op.between]: [trendStartStr, trendEndStr]
                        },
                        paymentStatus: ['paid', 'completed']
                    },
                    include: [{
                        model: InvoiceItem,
                        as: 'InvoiceItems'
                    }]
                });

                let monthRevenue = 0;
                let monthCost = 0;

                for (const invoice of monthInvoices) {
                    // Count ALL invoices for revenue
                    monthRevenue += parseFloat(invoice.total) || 0;

                    // Calculate cost only if cost prices exist
                    if (invoice.InvoiceItems && invoice.InvoiceItems.length > 0) {
                        for (const item of invoice.InvoiceItems) {
                            if (item.cost_price) {
                                const costPrice = parseFloat(item.cost_price) || 0;
                                const quantity = parseInt(item.quantity) || 1;
                                monthCost += costPrice * quantity;
                            }
                        }
                    }
                }

                // Get expenses for this month
                const monthExpenses = await Expense.findAll({
                    where: {
                        date: {
                            [Op.between]: [trendStartStr, trendEndStr]
                        },
                        status: ['approved', 'paid'],
                        type: 'variable' // Only get variable expenses, not fixed profits
                    }
                });

                let monthExpensesTotal = 0;
                for (const expense of monthExpenses) {
                    monthExpensesTotal += parseFloat(expense.amount) || 0;
                }

                // Calculate profit only if there are costs (same logic as main calculation)
                const monthProfit = monthCost > 0 ? monthRevenue - monthCost - monthExpensesTotal : 0;

                trendData.push({
                    month: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
                    revenue: monthRevenue,
                    expenses: monthExpensesTotal,
                    profit: monthProfit
                });
            }
        } catch (error) {
            console.error('Error calculating trend data:', error);
        }

        // Get expense breakdown by category
        let expenseBreakdown = [];
        try {
            // Get all expenses for the date range with category information
            const expenses = await Expense.findAll({
                where: {
                    date: {
                        [Op.between]: [startDateStr, endDateStr]
                    },
                    status: ['approved', 'paid'],
                    type: 'variable' // Only get variable expenses, not fixed profits
                },
                include: [{
                    model: ExpenseCategory,
                    as: 'category',
                    attributes: ['id', 'name_ar', 'name', 'color']
                }]
            });

            // Group expenses by category
            const expenseGroups = {};

            for (const expense of expenses) {
                const categoryId = expense.category_id;
                const categoryName = expense.category ? expense.category.name_ar : 'غير محدد';
                const categoryColor = expense.category ? expense.category.color : '#6c757d';
                const amount = parseFloat(expense.amount) || 0;

                if (expenseGroups[categoryId]) {
                    expenseGroups[categoryId].total += amount;
                } else {
                    expenseGroups[categoryId] = {
                        category_id: categoryId,
                        category_name: categoryName,
                        category_color: categoryColor,
                        total: amount
                    };
                }
            }

            // Convert to chart format
            expenseBreakdown = Object.values(expenseGroups).map((group, index) => ({
                category_id: group.category_id,
                category_name: group.category_name,
                category_color: group.category_color,
                total: group.total,
                color: group.category_color || getExpenseColor(index) // Use category color or generate dynamically
            }));

            console.log('Expense breakdown by categories:', expenseBreakdown);

        } catch (error) {
            console.error('Error fetching expense breakdown:', error);
        }

        // Helper function to generate colors for expenses
        function getExpenseColor(index) {
            const colors = [
                '#dc3545', '#ffc107', '#0dcaf0', '#6f42c1',
                '#fd7e14', '#20c997', '#e83e8c', '#6c757d'
            ];
            return colors[index % colors.length];
        }

        // Calculate period-over-period changes (compare with previous period)
        let changes = {
            revenue: 0,
            expenses: 0,
            profit: 0,
            margin: 0
        };

        try {
            // Calculate previous period dates (same duration as current period)
            const periodDuration = Math.abs(endDateObj - startDateObj);
            const prevEndDate = new Date(startDateObj.getTime() - 1); // Day before current period
            const prevStartDate = new Date(prevEndDate.getTime() - periodDuration);

            const prevStartStr = formatDateForDB(prevStartDate);
            const prevEndStr = formatDateForDB(prevEndDate);

            console.log(`Calculating changes vs previous period: ${prevStartStr} to ${prevEndStr}`);

            // Get previous period data
            const prevInvoices = await Invoice.findAll({
                where: {
                    date: { [Op.between]: [prevStartStr, prevEndStr] },
                    paymentStatus: ['paid', 'completed']
                },
                include: [{ model: InvoiceItem, as: 'InvoiceItems' }]
            });

            const prevExpenses = await Expense.findAll({
                where: {
                    date: { [Op.between]: [prevStartStr, prevEndStr] },
                    status: 'approved'
                }
            });

            let prevRevenue = 0;
            let prevCost = 0;
            let prevExpensesTotal = 0;

            prevInvoices.forEach(inv => {
                prevRevenue += parseFloat(inv.total) || 0;
                if (inv.InvoiceItems) {
                    inv.InvoiceItems.forEach(item => {
                        if (item.cost_price) {
                            prevCost += (parseFloat(item.cost_price) || 0) * (parseInt(item.quantity) || 1);
                        }
                    });
                }
            });

            prevExpenses.forEach(exp => {
                prevExpensesTotal += parseFloat(exp.amount) || 0;
            });

            const prevGrossProfit = prevCost > 0 ? prevRevenue - prevCost : 0;
            const prevNetProfit = prevGrossProfit - prevExpensesTotal;
            const prevMargin = prevCost > 0 && prevRevenue > 0 ? (prevGrossProfit / prevRevenue) * 100 : 0;

            // Calculate percentage changes
            changes.revenue = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;
            changes.expenses = prevExpensesTotal > 0 ? ((totalExpenses - prevExpensesTotal) / prevExpensesTotal) * 100 : 0;
            changes.profit = prevNetProfit !== 0 ? ((netProfit - prevNetProfit) / Math.abs(prevNetProfit)) * 100 : 0;
            changes.margin = prevMargin !== 0 ? profitMargin - prevMargin : 0; // Absolute change for margin

            console.log('Period-over-period changes:', changes);
        } catch (error) {
            console.error('Error calculating period changes:', error);
            // Keep changes at 0 if calculation fails
        }


        res.json({
            success: true,
            data: {
                kpis: {
                    totalRevenue: totalRevenue,
                    totalExpenses: totalExpenses,
                    totalCost: totalCost,
                    grossProfit: grossProfit,
                    netProfit: netProfit,
                    profitMargin: profitMargin,
                    invoiceCount: invoiceCount,
                    expenseCount: expenseCount,
                    invoicesWithCost: invoicesWithCost,
                    invoicesWithoutCost: invoicesWithoutCost,
                    revenueWithCost: revenueWithCost,
                    revenueWithoutCost: revenueWithoutCost
                },
                charts: {
                    trend: trendData,
                    expenseBreakdown: expenseBreakdown
                },
                changes: changes,
                alerts: alerts,
                dateRange: {
                    startDate: startDateStr,
                    endDate: endDateStr
                },
                summary: {
                    totalInvoices: invoiceCount,
                    totalExpenses: expenseCount,
                    revenuePerInvoice: invoiceCount > 0 ? totalRevenue / invoiceCount : 0,
                    expensePerExpense: expenseCount > 0 ? totalExpenses / expenseCount : 0
                }
            }
        });

    } catch (error) {
        console.error('Dashboard error:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Error loading dashboard data',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

/**
 * GET /api/financial/dashboard-debug
 * Debug endpoint to check dashboard data without filtering
 */
router.get('/dashboard-debug', adminRoleAuth(['superadmin']), async (req, res) => {
    try {
        console.log('=== DASHBOARD DEBUG ENDPOINT ===');

        // Get all invoices without any filtering
        const allInvoices = await Invoice.findAll({
            include: [{
                model: InvoiceItem,
                as: 'InvoiceItems'
            }]
        });

        console.log(`Total invoices in database: ${allInvoices.length}`);

        // Get all expenses without any filtering
        const allExpenses = await Expense.findAll();
        console.log(`Total expenses in database: ${allExpenses.length}`);

        // Sample data
        const sampleInvoices = allInvoices.slice(0, 3).map(invoice => ({
            id: invoice.id,
            total: invoice.total,
            date: invoice.date,
            paymentStatus: invoice.paymentStatus,
            itemsCount: invoice.InvoiceItems ? invoice.InvoiceItems.length : 0,
            itemsWithCost: invoice.InvoiceItems ? invoice.InvoiceItems.filter(item => item.cost_price).length : 0
        }));

        const sampleExpenses = allExpenses.slice(0, 3).map(expense => ({
            id: expense.id,
            amount: expense.amount,
            date: expense.date,
            status: expense.status
        }));

        res.json({
            success: true,
            debug: {
                totalInvoices: allInvoices.length,
                totalExpenses: allExpenses.length,
                sampleInvoices,
                sampleExpenses,
                queryParams: req.query
            }
        });

    } catch (error) {
        console.error('Dashboard debug error:', error);
        res.status(500).json({
            success: false,
            message: 'Debug endpoint failed',
            error: error.message
        });
    }
});

/**
 * GET /api/financial/dashboard-simple
 * Simple dashboard endpoint for testing
 */
router.get('/dashboard-simple', adminRoleAuth(['superadmin']), async (req, res) => {
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
router.get('/profit-management', adminRoleAuth(['superadmin']), async (req, res) => {
    try {
        const { page = 1, limit = 1000, search, startDate, endDate, type } = req.query;
        const offset = (page - 1) * limit;

        let whereClause = {};
        let expenseWhere = {};

        // Date filtering
        if (startDate && endDate) {
            console.log('Profit management date filtering:', { startDate, endDate });
            whereClause.date = {
                [Op.between]: [startDate, endDate]
            };
            expenseWhere.date = {
                [Op.between]: [startDate, endDate]
            };
        } else {
            console.log('No date filtering applied to profit management');
        }

        // Check if we should show all data (no date filter)
        const showAll = req.query.showAll === 'true';
        const showOnlyWithCost = req.query.showOnlyWithCost === 'false'; // Note: we're checking for 'false' since frontend sends 'false'
        console.log('Show all data:', showAll);
        console.log('Show only with cost:', showOnlyWithCost);
        console.log('Query parameters:', req.query);

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
                console.log('Fetching completed/paid invoices first, then filtering...');

                // Use direct SQL query to get ALL invoices with their data
                const { sequelize } = require('../models');

                // Fetch completed/paid invoices with their cost data (or all if explicitly requested)
                const showAllInvoices = req.query.showAllInvoices === 'true';
                const allInvoicesQuery = `
                    SELECT 
                        i.id as invoice_id,
                        i.date as invoice_date,
                        i.total as invoice_total,
                        i.paymentStatus as payment_status,
                        c.name as client_name,
                        c.id as client_id,
                        COUNT(ii.id) as items_count,
                        COALESCE(SUM(ii.cost_price * ii.quantity), 0) as total_cost,
                        CASE 
                            WHEN COALESCE(SUM(ii.cost_price * ii.quantity), 0) > 0 
                            THEN (i.total - COALESCE(SUM(ii.cost_price * ii.quantity), 0))
                            ELSE NULL
                        END as total_profit
                    FROM invoices i
                    LEFT JOIN clients c ON i.client_id = c.id
                    LEFT JOIN invoice_items ii ON i.id = ii.invoiceId
                    ${showAllInvoices ? '' : 'WHERE i.paymentStatus IN (\'completed\', \'paid\')'}
                    GROUP BY i.id, i.date, i.total, i.paymentStatus, c.name, c.id
                    ORDER BY i.date DESC
                `;

                console.log(`Fetching ${showAllInvoices ? 'ALL' : 'completed/paid'} invoices...`);
                const [allInvoices] = await sequelize.query(allInvoicesQuery);
                console.log(`Total ${showAllInvoices ? 'invoices' : 'completed/paid invoices'} in database: ${allInvoices.length}`);

                // Now filter the results in application layer
                let filteredInvoices = allInvoices;

                // Filter by payment status - ALWAYS show only completed/paid invoices by default
                if (req.query.paymentStatus && req.query.paymentStatus !== 'all') {
                    filteredInvoices = filteredInvoices.filter(invoice =>
                        invoice.payment_status === req.query.paymentStatus
                    );
                    console.log(`After payment status filter: ${filteredInvoices.length} invoices`);
                } else {
                    // Default to completed/paid invoices only
                    filteredInvoices = filteredInvoices.filter(invoice =>
                        ['completed', 'paid'].includes(invoice.payment_status)
                    );
                    console.log(`After default completed/paid filter: ${filteredInvoices.length} invoices`);
                }

                // Filter by date range
                if (startDate && endDate) {
                    filteredInvoices = filteredInvoices.filter(invoice => {
                        const invoiceDate = new Date(invoice.invoice_date);
                        const start = new Date(startDate);
                        const end = new Date(endDate);
                        return invoiceDate >= start && invoiceDate <= end;
                    });
                    console.log(`After date filter: ${filteredInvoices.length} invoices`);
                }

                // Filter by cost prices (if requested)
                const showOnlyWithCost = req.query.showOnlyWithCost === 'true';
                if (showOnlyWithCost) {
                    filteredInvoices = filteredInvoices.filter(invoice =>
                        parseFloat(invoice.total_cost) > 0
                    );
                    console.log(`After cost filter: ${filteredInvoices.length} invoices`);
                }

                // Apply pagination
                const startIndex = offset;
                const endIndex = offset + parseInt(limit);
                const paginatedInvoices = filteredInvoices.slice(startIndex, endIndex);

                console.log(`Pagination: ${startIndex} to ${endIndex} of ${filteredInvoices.length} filtered invoices`);
                console.log(`Returning ${paginatedInvoices.length} invoices`);

                // Convert to results format
                for (const row of paginatedInvoices) {
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
                        total_profit: parseFloat(row.total_profit),
                        payment_status: row.payment_status
                    });
                }

                console.log(`Total results from invoices: ${results.length}`);

                // Calculate hasMore based on filtered results
                const hasMore = endIndex < filteredInvoices.length;
                console.log(`hasMore calculation: ${endIndex} < ${filteredInvoices.length} = ${hasMore}`);

                // Store hasMore for later use
                results.hasMore = hasMore;

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

        // Check if there are more results available
        let hasMore = false;

        // Use the hasMore value calculated in the invoices section if available
        if (results.hasMore !== undefined) {
            hasMore = results.hasMore;
            console.log('Using hasMore from invoices calculation:', hasMore);
        } else {
            console.log('No hasMore value from invoices, defaulting to false');
        }

        console.log(`Sending ${results.length} total results, hasMore: ${hasMore}`);
        console.log('Sample result:', results[0]);

        res.json({
            success: true,
            data: {
                items: results,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: results.length,
                    hasMore: hasMore
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
router.put('/cost-prices/bulk', adminRoleAuth(['superadmin']), async (req, res) => {
    try {
        const { updates } = req.body; // Array of { item_id, cost_price, product_name, product_model, serial_number }
        console.log('Received bulk update request:', updates);
        console.log('Updates count:', updates ? updates.length : 0);

        const updatedItems = [];

        for (const update of updates) {
            try {
                console.log('Processing update:', update);

                // First check if the item exists
                const existingItem = await InvoiceItem.findByPk(parseInt(update.item_id));

                if (existingItem) {
                    const oldCostPrice = parseFloat(existingItem.cost_price || 0);
                    const newCostPrice = parseFloat(update.cost_price);
                    const quantity = parseInt(existingItem.quantity || 1);
                    const costDiff = (newCostPrice - oldCostPrice) * quantity;

                    const updateResult = await InvoiceItem.update(
                        { cost_price: update.cost_price },
                        { where: { id: parseInt(update.item_id) } }
                    );

                    if (updateResult[0] > 0 && costDiff !== 0) {
                        try {
                            const invoice = await Invoice.findByPk(existingItem.invoiceId);
                            if (invoice) {
                                const location = await findLocationForPaymentMethod(invoice.paymentMethod);
                                if (location) {
                                    const movementType = costDiff > 0 ? 'expense_paid' : 'payment_received';
                                    const absDiff = Math.abs(costDiff);

                                    await MoneyMovement.create({
                                        movement_type: movementType,
                                        amount: absDiff,
                                        from_location_id: costDiff > 0 ? location.id : null,
                                        to_location_id: costDiff > 0 ? null : location.id,
                                        reference_type: 'invoice',
                                        reference_id: invoice.id,
                                        description: `تحديث تكلفة (بالجملة): ${existingItem.description} (فاتورة ${invoice.id})`,
                                        created_by: req.user.id
                                    });

                                    await location.updateBalance(absDiff, movementType);
                                }
                            }
                        } catch (finError) {
                            console.error('Financial tracking error in bulk update:', finError);
                        }
                    }
                }
                // ... (existing ProductCost upsert)
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
router.put('/cost-price/:itemId', adminRoleAuth(['superadmin']), async (req, res) => {
    console.log('=== COST PRICE UPDATE ROUTE HIT ===');
    console.log('Params:', req.params);
    console.log('Body:', req.body);

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
            const oldCostPrice = parseFloat(existingItem.cost_price || 0);
            const newCostPrice = parseFloat(cost_price);
            const quantity = parseInt(existingItem.quantity || 1);
            const costDiff = (newCostPrice - oldCostPrice) * quantity;

            // Use Sequelize ORM approach like the working routes
            const updateResult = await InvoiceItem.update(
                { cost_price: parseFloat(cost_price) },
                { where: { id: parseInt(itemId) } }
            );
            console.log(`InvoiceItem update result:`, updateResult);

            if (updateResult[0] > 0) {
                console.log(`Successfully updated item ${itemId} with cost price ${cost_price}`);

                // Track financial movement if cost changed
                if (costDiff !== 0) {
                    try {
                        const invoice = await Invoice.findByPk(existingItem.invoiceId);
                        if (invoice) {
                            const location = await findLocationForPaymentMethod(invoice.paymentMethod);
                            if (location) {
                                const movementType = costDiff > 0 ? 'expense_paid' : 'payment_received';
                                const absDiff = Math.abs(costDiff);

                                await MoneyMovement.create({
                                    movement_type: movementType,
                                    amount: absDiff,
                                    from_location_id: costDiff > 0 ? location.id : null,
                                    to_location_id: costDiff > 0 ? null : location.id,
                                    reference_type: 'invoice',
                                    reference_id: invoice.id,
                                    description: `تحديث تكلفة: ${existingItem.description} (فاتورة ${invoice.id})`,
                                    created_by: req.user.id
                                });

                                await location.updateBalance(absDiff, movementType);
                                console.log(`Financial movement recorded: ${movementType} of ${absDiff} for location ${location.id}`);
                            }
                        }
                    } catch (finError) {
                        console.error('Financial tracking error:', finError);
                        // Don't fail the whole request
                    }
                }

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
router.get('/invoice/:invoiceId/items', adminRoleAuth(['superadmin']), async (req, res) => {
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
        const items = invoice.InvoiceItems.map(item => {
            const salePrice = parseFloat(item.amount);
            const costPrice = item.cost_price ? parseFloat(item.cost_price) : 0;
            const quantity = parseInt(item.quantity || 1);

            // Calculate profit manually instead of relying on generated columns
            const profitAmount = costPrice > 0 ? (salePrice - costPrice) * quantity : null;
            const profitMargin = costPrice > 0 && salePrice > 0 ? ((salePrice - costPrice) / salePrice) * 100 : null;

            return {
                item_id: item.id,
                item_description: item.description,
                sale_price: salePrice,
                quantity: quantity,
                cost_price: item.cost_price ? parseFloat(item.cost_price) : null,
                profit_amount: profitAmount,
                profit_margin: profitMargin,
                serialNumber: item.serialNumber,
                item_type: item.type,
                needs_cost_price: !item.cost_price
            };
        });

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
router.post('/calculate-profits', adminRoleAuth(['superadmin']), async (req, res) => {
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
router.get('/expenses', adminRoleAuth(['superadmin']), async (req, res) => {
    try {
        const { page = 1, limit = 20, category, type, status, search, startDate, endDate } = req.query;
        const offset = (page - 1) * limit;

        let whereClause = {};

        if (category) whereClause.category_id = category;
        if (type) whereClause.type = type;
        if (status) whereClause.status = status;

        if (startDate && endDate) {
            whereClause.date = {
                [Op.between]: [startDate, endDate]
            };
        } else if (startDate) {
            whereClause.date = {
                [Op.gte]: startDate
            };
        } else if (endDate) {
            whereClause.date = {
                [Op.lte]: endDate
            };
        }

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
router.post('/expenses', adminRoleAuth(['superadmin']), async (req, res) => {
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
            receipt_url,
            money_location_id
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
            money_location_id,
            created_by: req.user.id,
            status: 'approved' // Auto-approve for now
        });

        // Record money movement if location is selected
        if (money_location_id) {
            try {
                await MoneyMovement.recordExpensePaid(
                    money_location_id,
                    amount,
                    expense.id,
                    req.user.id
                );
            } catch (finError) {
                console.error('Financial tracking error during expense creation:', finError);
                // We don't fail the whole request but we should handle it
            }
        }

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
 * PUT /api/financial/expenses/:id
 * Update an existing expense
 */
router.put('/expenses/:id', adminRoleAuth(['superadmin']), async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name,
            name_ar,
            amount,
            category_id,
            type,
            date,
            repeat_monthly,
            description,
            receipt_url,
            money_location_id
        } = req.body;

        const expense = await Expense.findByPk(id);
        if (!expense) {
            return res.status(404).json({
                success: false,
                message: 'Expense not found'
            });
        }

        const oldAmount = parseFloat(expense.amount);
        const oldLocationId = expense.money_location_id;
        const newAmount = parseFloat(amount);
        const newLocationId = money_location_id;

        // Handle balance correction if amount or location changed
        if (oldLocationId || newLocationId) {
            try {
                // If location changed
                if (oldLocationId !== newLocationId) {
                    // Refund old location
                    if (oldLocationId) {
                        const oldLoc = await MoneyLocation.findByPk(oldLocationId);
                        if (oldLoc) {
                            await oldLoc.updateBalance(oldAmount, 'deposit'); // Refund
                            await MoneyMovement.create({
                                movement_type: 'payment_received',
                                amount: oldAmount,
                                to_location_id: oldLocationId,
                                reference_type: 'expense',
                                reference_id: expense.id,
                                description: `استرداد مصروف (تعديل الحساب): ${expense.name_ar}`,
                                created_by: req.user.id
                            });
                        }
                    }
                    // Deduct from new location
                    if (newLocationId) {
                        await MoneyMovement.recordExpensePaid(
                            newLocationId,
                            newAmount,
                            expense.id,
                            req.user.id
                        );
                    }
                }
                // Same location but amount changed
                else if (oldLocationId && oldAmount !== newAmount) {
                    const diff = newAmount - oldAmount;
                    const location = await MoneyLocation.findByPk(oldLocationId);
                    if (location) {
                        if (diff > 0) {
                            // Extra deduction
                            await MoneyMovement.recordExpensePaid(
                                oldLocationId,
                                diff,
                                expense.id,
                                req.user.id
                            );
                        } else {
                            // Partial refund
                            const refundAmount = Math.abs(diff);
                            await location.updateBalance(refundAmount, 'deposit');
                            await MoneyMovement.create({
                                movement_type: 'payment_received',
                                amount: refundAmount,
                                to_location_id: oldLocationId,
                                reference_type: 'expense',
                                reference_id: expense.id,
                                description: `استرداد فرق مبلغ مصروف: ${expense.name_ar}`,
                                created_by: req.user.id
                            });
                        }
                    }
                }
            } catch (finError) {
                console.error('Financial tracking error during expense update:', finError);
            }
        }

        await expense.update({
            name,
            name_ar,
            amount,
            category_id,
            type,
            date,
            repeat_monthly: repeat_monthly || false,
            description,
            receipt_url,
            money_location_id
        });

        const updatedExpense = await Expense.findByPk(expense.id, {
            include: [{ model: ExpenseCategory, as: 'category' }]
        });

        res.json({
            success: true,
            message: 'تم تحديث المصروف بنجاح',
            data: { expense: updatedExpense }
        });

    } catch (error) {
        console.error('Update expense error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating expense',
            error: error.message
        });
    }
});

/**
 * DELETE /api/financial/expenses/:id
 * Delete an expense
 */
router.delete('/expenses/:id', adminRoleAuth(['superadmin']), async (req, res) => {
    try {
        const { id } = req.params;
        const expense = await Expense.findByPk(id);

        if (!expense) {
            return res.status(404).json({
                success: false,
                message: 'Expense not found'
            });
        }

        // Refund the balance if a location was used
        if (expense.money_location_id) {
            try {
                const location = await MoneyLocation.findByPk(expense.money_location_id);
                if (location) {
                    const amount = parseFloat(expense.amount);
                    await location.updateBalance(amount, 'deposit');
                    await MoneyMovement.create({
                        movement_type: 'payment_received',
                        amount: amount,
                        to_location_id: expense.money_location_id,
                        reference_type: 'expense',
                        reference_id: expense.id,
                        description: `استرداد مصروف (حذف): ${expense.name_ar}`,
                        created_by: req.user.id
                    });
                }
            } catch (finError) {
                console.error('Financial tracking error during expense deletion:', finError);
            }
        }

        await expense.destroy();

        res.json({
            success: true,
            message: 'تم حذف المصروف بنجاح'
        });

    } catch (error) {
        console.error('Delete expense error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting expense',
            error: error.message
        });
    }
});

/**
 * GET /api/financial/expense-categories
 * Get all expense categories
 */
router.get('/expense-categories', adminRoleAuth(['superadmin']), async (req, res) => {
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
router.get('/recent-expenses', adminRoleAuth(['superadmin']), async (req, res) => {
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
router.get('/product-costs', adminRoleAuth(['superadmin']), async (req, res) => {
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
router.get('/analytics/monthly-summary/:monthYear', adminRoleAuth(['superadmin']), async (req, res) => {
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
router.get('/test', adminRoleAuth(['superadmin']), async (req, res) => {
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

/**
 * PATCH /api/financial/invoice-items/:id/cost
 * Update cost price for an invoice item
 * Access: Admin/Superadmin
 */
router.patch('/invoice-items/:id/cost', adminRoleAuth(['admin', 'superadmin']), async (req, res) => {
    try {
        const { id } = req.params;
        const { cost_price } = req.body;

        if (cost_price === undefined || cost_price === null) {
            return res.status(400).json({
                success: false,
                message: 'Cost price is required'
            });
        }

        const item = await InvoiceItem.findByPk(id);
        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Invoice item not found'
            });
        }

        // Update cost price
        item.cost_price = cost_price;
        await item.save();

        res.json({
            success: true,
            message: 'Cost price updated successfully',
            data: {
                id: item.id,
                cost_price: item.cost_price
            }
        });

    } catch (error) {
        console.error('Error updating cost price:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating cost price',
            error: error.message
        });
    }
});

module.exports = router; 