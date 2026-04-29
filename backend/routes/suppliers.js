const express = require('express');
const router = express.Router();
const { Supplier, Report, ProductCost, Expense, Admin, InvoiceItem, Client, sequelize } = require('../models');
const { adminAuth, adminRoleAuth } = require('../middleware/auth');
const { Op, QueryTypes } = require('sequelize');

const EXCLUDED_STATUSES = ['cancelled', 'canceled', 'ملغى', 'ملغي'];
const EXCLUDED_STATUSES_SQL = "'cancelled', 'canceled', 'ملغى', 'ملغي'";

/**
 * GET /api/suppliers
 * List all suppliers
 */
router.get('/', adminRoleAuth(['admin', 'superadmin']), async (req, res) => {
    try {
        const suppliers = await Supplier.findAll({
            order: [['name', 'ASC']],
            include: [
                {
                    model: Admin,
                    as: 'creator',
                    attributes: ['name']
                }
            ]
        });

        res.json({
            success: true,
            data: suppliers
        });
    } catch (error) {
        console.error('Get suppliers error:', error);
        res.status(500).json({
            success: false,
            message: 'Error loading suppliers',
            error: error.message
        });
    }
});

/**
 * GET /api/suppliers/summary
 * Get financial summary for all suppliers
 */
router.get('/summary', adminRoleAuth(['superadmin']), async (req, res) => {
    try {
        // We calculate total debt (ProductCost) and total paid (Expense) for each supplier
        // Note: this is a simplified calculation. Real logic might need more nuance.

        const [results] = await sequelize.query(`
            SELECT 
                s.id,
                s.name,
                s.code,
                s.phone,
                s.contact_person,
                s.status,
                (COALESCE(pc.total_cost, 0) + COALESCE(rc.total_device_cost, 0)) as total_debt,
                COALESCE(e.total_paid, 0) as total_paid,
                ((COALESCE(pc.total_cost, 0) + COALESCE(rc.total_device_cost, 0)) - COALESCE(e.total_paid, 0)) as balance
            FROM suppliers s
            LEFT JOIN (
                SELECT supplier_id, SUM(cost_price) as total_cost 
                FROM product_costs 
                GROUP BY supplier_id
            ) pc ON s.id = pc.supplier_id
            LEFT JOIN (
                SELECT 
                    r.supplier_id, 
                    SUM(COALESCE(ri.report_cost, r.device_price, r.amount, 0)) as total_device_cost 
                FROM reports r
                LEFT JOIN (
                    SELECT report_id, SUM(cost_price) as report_cost
                    FROM invoice_items
                    WHERE report_id IS NOT NULL
                    GROUP BY report_id
                ) ri ON r.id = ri.report_id
                WHERE r.status NOT IN (${EXCLUDED_STATUSES_SQL})
                GROUP BY r.supplier_id
            ) rc ON s.id = rc.supplier_id
            LEFT JOIN (
                SELECT supplier_id, SUM(amount) as total_paid 
                FROM expenses 
                WHERE status IN ('approved', 'paid')
                GROUP BY supplier_id
            ) e ON s.id = e.supplier_id
            ORDER BY s.name ASC
        `);

        res.json({
            success: true,
            data: results.map(r => ({
                ...r,
                total_debt: Number(r.total_debt || 0),
                total_paid: Number(r.total_paid || 0),
                balance: Number(r.balance || 0)
            }))
        });
    } catch (error) {
        console.error('Get suppliers summary error:', error);
        res.status(500).json({
            success: false,
            message: 'Error loading suppliers summary',
            error: error.message
        });
    }
});

/**
 * GET /api/suppliers/:id/reports
 * Get paginated and searchable reports for a specific supplier
 */
router.get('/:id/reports', adminRoleAuth(['superadmin']), async (req, res) => {
    try {
        const { id } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        const search = req.query.q || '';
        const { startDate, endDate } = req.query;

        const whereConditions = {
            supplier_id: id,
            status: { [Op.notIn]: EXCLUDED_STATUSES }
        };

        if (search) {
            whereConditions[Op.or] = [
                { id: { [Op.like]: `%${search}%` } },
                { device_model: { [Op.like]: `%${search}%` } },
                { serial_number: { [Op.like]: `%${search}%` } },
                { client_name: { [Op.like]: `%${search}%` } },
                { '$client.name$': { [Op.like]: `%${search}%` } }
            ];
        }

        if (startDate && endDate) {
            // If there's already an Op.or from search, we need to combine them properly using Op.and
            const dateCondition = {
                [Op.or]: [
                    { inspection_date: { [Op.between]: [startDate + ' 00:00:00', endDate + ' 23:59:59'] } },
                    { 
                        inspection_date: null,
                        created_at: { [Op.between]: [startDate + ' 00:00:00', endDate + ' 23:59:59'] }
                    }
                ]
            };
            
            if (whereConditions[Op.or]) {
                const searchCondition = { [Op.or]: whereConditions[Op.or] };
                delete whereConditions[Op.or];
                whereConditions[Op.and] = [searchCondition, dateCondition];
            } else {
                whereConditions[Op.or] = dateCondition[Op.or];
            }
        }

        const include = [
            {
                model: InvoiceItem,
                as: 'invoiceItems',
                attributes: ['id', 'cost_price', 'totalAmount', 'report_id']
            },
            {
                model: Client,
                as: 'client',
                attributes: ['id', 'name']
            }
        ];

        const { count, rows: reports } = await Report.findAndCountAll({
            where: whereConditions,
            limit,
            offset,
            order: [['created_at', 'DESC']],
            attributes: ['id', 'device_model', 'serial_number', 'inspection_date', 'status', 'device_price', 'amount', 'client_name'],
            include,
            subQuery: false
        });

        res.json({
            success: true,
            data: reports,
            pagination: {
                total: count,
                page,
                limit,
                totalPages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        console.error('Get supplier reports error:', error);
        res.status(500).json({
            success: false,
            message: 'Error loading supplier reports',
            error: error.message
        });
    }
});

/**
 * GET /api/suppliers/:id
 * Get single supplier with details
 */
router.get('/:id', adminRoleAuth(['superadmin']), async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        const dateSelects = startDate && endDate ? `
            ,
            (COALESCE(pc.period_cost, 0) + COALESCE(rc.period_device_cost, 0)) as period_debt,
            COALESCE(e.period_paid, 0) as period_paid,
            ((COALESCE(pc.period_cost, 0) + COALESCE(rc.period_device_cost, 0)) - COALESCE(e.period_paid, 0)) as period_balance,
            (COALESCE(pc.rolled_cost, 0) + COALESCE(rc.rolled_device_cost, 0)) as rolled_over_debt,
            COALESCE(e.rolled_paid, 0) as rolled_over_paid,
            ((COALESCE(pc.rolled_cost, 0) + COALESCE(rc.rolled_device_cost, 0)) - COALESCE(e.rolled_paid, 0)) as rolled_over_balance
        ` : `
            ,
            (COALESCE(pc.total_cost, 0) + COALESCE(rc.total_device_cost, 0)) as period_debt,
            COALESCE(e.total_paid, 0) as period_paid,
            ((COALESCE(pc.total_cost, 0) + COALESCE(rc.total_device_cost, 0)) - COALESCE(e.total_paid, 0)) as period_balance,
            0 as rolled_over_debt,
            0 as rolled_over_paid,
            0 as rolled_over_balance
        `;

        const pcSelects = startDate && endDate ? `
            SUM(cost_price) as total_cost,
            SUM(CASE WHEN DATE(COALESCE(purchase_date, created_at)) >= :startDate AND DATE(COALESCE(purchase_date, created_at)) <= :endDate THEN cost_price ELSE 0 END) as period_cost,
            SUM(CASE WHEN DATE(COALESCE(purchase_date, created_at)) < :startDate THEN cost_price ELSE 0 END) as rolled_cost
        ` : `SUM(cost_price) as total_cost`;

        const rcSelects = startDate && endDate ? `
            SUM(COALESCE(ri.report_cost, r.device_price, r.amount, 0)) as total_device_cost,
            SUM(CASE WHEN DATE(COALESCE(r.inspection_date, r.created_at)) >= :startDate AND DATE(COALESCE(r.inspection_date, r.created_at)) <= :endDate THEN COALESCE(ri.report_cost, r.device_price, r.amount, 0) ELSE 0 END) as period_device_cost,
            SUM(CASE WHEN DATE(COALESCE(r.inspection_date, r.created_at)) < :startDate THEN COALESCE(ri.report_cost, r.device_price, r.amount, 0) ELSE 0 END) as rolled_device_cost
        ` : `SUM(COALESCE(ri.report_cost, r.device_price, r.amount, 0)) as total_device_cost`;

        const eSelects = startDate && endDate ? `
            SUM(amount) as total_paid,
            SUM(CASE WHEN DATE(date) >= :startDate AND DATE(date) <= :endDate THEN amount ELSE 0 END) as period_paid,
            SUM(CASE WHEN DATE(date) < :startDate THEN amount ELSE 0 END) as rolled_paid
        ` : `SUM(amount) as total_paid`;

        // Get financial summary using SQL with optional date range
        const [financials] = await sequelize.query(`
            SELECT 
                (COALESCE(pc.total_cost, 0) + COALESCE(rc.total_device_cost, 0)) as total_debt,
                COALESCE(e.total_paid, 0) as total_paid,
                ((COALESCE(pc.total_cost, 0) + COALESCE(rc.total_device_cost, 0)) - COALESCE(e.total_paid, 0)) as balance
                ${dateSelects}
            FROM (SELECT 1 as dummy) d
            LEFT JOIN (
                SELECT ${pcSelects} 
                FROM product_costs 
                WHERE supplier_id = :id
            ) pc ON 1=1
            LEFT JOIN (
                SELECT ${rcSelects}
                FROM reports r
                LEFT JOIN (
                    SELECT report_id, SUM(cost_price) as report_cost
                    FROM invoice_items
                    WHERE report_id IS NOT NULL
                    GROUP BY report_id
                ) ri ON r.id = ri.report_id
                WHERE r.supplier_id = :id AND r.status NOT IN (${EXCLUDED_STATUSES_SQL})
            ) rc ON 1=1
            LEFT JOIN (
                SELECT ${eSelects}
                FROM expenses 
                WHERE supplier_id = :id AND status IN ('approved', 'paid')
            ) e ON 1=1
        `, {
            replacements: { id: req.params.id, startDate, endDate },
            type: QueryTypes.SELECT
        });

        // Date conditions for relations
        const reportWhere = { supplier_id: req.params.id, status: { [Op.notIn]: EXCLUDED_STATUSES } };
        const expenseWhere = {};

        if (startDate && endDate) {
            reportWhere[Op.or] = [
                { inspection_date: { [Op.between]: [startDate + ' 00:00:00', endDate + ' 23:59:59'] } },
                { 
                    inspection_date: null,
                    created_at: { [Op.between]: [startDate + ' 00:00:00', endDate + ' 23:59:59'] }
                }
            ];
            expenseWhere.date = { [Op.between]: [startDate, endDate] };
        }

        // Get total reports count separately for the tab label
        const totalReportsCount = await Report.count({
            where: reportWhere
        });

        const summary = financials || { total_debt: 0, total_paid: 0, balance: 0 };

        if (!summary) {
            return res.status(404).json({
                success: false,
                message: 'Supplier not found'
            });
        }

        // Get the full supplier object with relations using Sequelize
        const supplier = await Supplier.findByPk(req.params.id, {
            include: [
                {
                    model: Admin,
                    as: 'creator',
                    attributes: ['name']
                },
                {
                    model: Report,
                    as: 'reports',
                    where: reportWhere,
                    required: false,
                    limit: 20,
                    order: [['created_at', 'DESC']],
                    attributes: ['id', 'device_model', 'serial_number', 'inspection_date', 'status', 'device_price', 'amount'],
                    include: [
                        {
                            model: InvoiceItem,
                            as: 'invoiceItems',
                            attributes: ['id', 'cost_price', 'totalAmount', 'report_id']
                        }
                    ]
                },
                {
                    model: ProductCost,
                    as: 'productCosts',
                    limit: 100,
                    order: [['created_at', 'DESC']]
                },
                {
                    model: Expense,
                    as: 'expenses',
                    where: Object.keys(expenseWhere).length ? expenseWhere : undefined,
                    required: false,
                    limit: 100,
                    order: [['date', 'DESC']]
                }
            ]
        });

        if (!supplier) {
            return res.status(404).json({
                success: false,
                message: 'Supplier not found'
            });
        }

        // Merge aggregation data into the supplier object
        const supplierData = {
            ...supplier.toJSON(),
            total_debt: summary.total_debt,
            total_paid: summary.total_paid,
            balance: summary.balance,
            period_debt: summary.period_debt,
            period_paid: summary.period_paid,
            period_balance: summary.period_balance,
            rolled_over_debt: summary.rolled_over_debt,
            rolled_over_paid: summary.rolled_over_paid,
            rolled_over_balance: summary.rolled_over_balance
        };

        res.json({
            success: true,
            data: {
                ...supplierData,
                total_reports_count: totalReportsCount
            }
        });
    } catch (error) {
        console.error('Get supplier error:', error);
        res.status(500).json({
            success: false,
            message: 'Error loading supplier details',
            error: error.message
        });
    }
});

/**
 * POST /api/suppliers
 * Create a new supplier
 */
router.post('/', adminRoleAuth(['superadmin']), async (req, res) => {
    try {
        const { name, code, phone, contact_person, address, notes } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Supplier name is required'
            });
        }

        const supplier = await Supplier.create({
            name,
            code,
            phone,
            contact_person,
            address,
            notes,
            created_by: req.user.id
        });

        res.status(201).json({
            success: true,
            message: 'تم إضافة المورد بنجاح',
            data: supplier
        });
    } catch (error) {
        console.error('Create supplier error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating supplier',
            error: error.message
        });
    }
});

/**
 * PUT /api/suppliers/:id
 * Update a supplier
 */
router.put('/:id', adminRoleAuth(['superadmin']), async (req, res) => {
    try {
        const { name, code, phone, contact_person, address, notes, status } = req.body;
        const supplier = await Supplier.findByPk(req.params.id);

        if (!supplier) {
            return res.status(404).json({
                success: false,
                message: 'Supplier not found'
            });
        }

        await supplier.update({
            name,
            code,
            phone,
            contact_person,
            address,
            notes,
            status
        });

        res.json({
            success: true,
            message: 'تم تحديث بيانات المورد بنجاح',
            data: supplier
        });
    } catch (error) {
        console.error('Update supplier error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating supplier',
            error: error.message
        });
    }
});

/**
 * DELETE /api/suppliers/:id
 * Delete a supplier
 */
router.delete('/:id', adminRoleAuth(['superadmin']), async (req, res) => {
    try {
        const supplier = await Supplier.findByPk(req.params.id);

        if (!supplier) {
            return res.status(404).json({
                success: false,
                message: 'Supplier not found'
            });
        }

        // Check for associations before deleting
        const reportCount = await Report.count({ where: { supplier_id: supplier.id } });
        const costCount = await ProductCost.count({ where: { supplier_id: supplier.id } });
        const expenseCount = await Expense.count({ where: { supplier_id: supplier.id } });

        if (reportCount > 0 || costCount > 0 || expenseCount > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete supplier with associated reports, costs, or expenses. Deactivate instead.'
            });
        }

        await supplier.destroy();

        res.json({
            success: true,
            message: 'تم حذف المورد بنجاح'
        });
    } catch (error) {
        console.error('Delete supplier error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting supplier',
            error: error.message
        });
    }
});

module.exports = router;
