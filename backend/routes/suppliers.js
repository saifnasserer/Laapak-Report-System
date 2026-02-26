const express = require('express');
const router = express.Router();
const { Supplier, Report, ProductCost, Expense, Admin, InvoiceItem, sequelize } = require('../models');
const { adminAuth, adminRoleAuth } = require('../middleware/auth');
const { Op, QueryTypes } = require('sequelize');

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
                (COALESCE(pc.total_cost, 0) + COALESCE(r.total_device_cost, 0)) as total_debt,
                COALESCE(e.total_paid, 0) as total_paid,
                ((COALESCE(pc.total_cost, 0) + COALESCE(r.total_device_cost, 0)) - COALESCE(e.total_paid, 0)) as balance
            FROM suppliers s
            LEFT JOIN (
                SELECT supplier_id, SUM(cost_price) as total_cost 
                FROM product_costs 
                GROUP BY supplier_id
            ) pc ON s.id = pc.supplier_id
            LEFT JOIN (
                SELECT 
                    r.supplier_id, 
                    SUM(COALESCE(ii.cost_price, r.device_price, r.amount, 0)) as total_device_cost 
                FROM reports r
                LEFT JOIN invoice_items ii ON r.id = ii.report_id
                GROUP BY r.supplier_id
            ) r ON s.id = r.supplier_id
            LEFT JOIN (
                SELECT supplier_id, SUM(amount) as total_paid 
                FROM expenses 
                WHERE status IN ('approved', 'paid')
                GROUP BY supplier_id
            ) e ON s.id = e.supplier_id
            GROUP BY s.id, s.name, s.code, s.phone, s.contact_person, s.status, pc.total_cost, r.total_device_cost, e.total_paid
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
 * GET /api/suppliers/:id
 * Get single supplier with details
 */
router.get('/:id', adminRoleAuth(['superadmin']), async (req, res) => {
    try {
        // Get financial summary only using SQL (safer against ONLY_FULL_GROUP_BY)
        const [financials] = await sequelize.query(`
            SELECT 
                (COALESCE(pc.total_cost, 0) + COALESCE(r.total_device_cost, 0)) as total_debt,
                COALESCE(e.total_paid, 0) as total_paid,
                ((COALESCE(pc.total_cost, 0) + COALESCE(r.total_device_cost, 0)) - COALESCE(e.total_paid, 0)) as balance
            FROM (SELECT 1 as dummy) d
            LEFT JOIN (
                SELECT SUM(cost_price) as total_cost 
                FROM product_costs 
                WHERE supplier_id = ?
            ) pc ON 1=1
            LEFT JOIN (
                SELECT SUM(COALESCE(ii.cost_price, r.device_price, r.amount, 0)) as total_device_cost 
                FROM reports r
                LEFT JOIN invoice_items ii ON r.id = ii.report_id
                WHERE r.supplier_id = ?
            ) r ON 1=1
            LEFT JOIN (
                SELECT SUM(amount) as total_paid 
                FROM expenses 
                WHERE supplier_id = ? AND status IN ('approved', 'paid')
            ) e ON 1=1
        `, {
            replacements: [req.params.id, req.params.id, req.params.id],
            type: QueryTypes.SELECT
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
                    limit: 20,
                    order: [['created_at', 'DESC']]
                },
                {
                    model: Expense,
                    as: 'expenses',
                    limit: 20,
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
            balance: summary.balance
        };

        res.json({
            success: true,
            data: supplierData
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
