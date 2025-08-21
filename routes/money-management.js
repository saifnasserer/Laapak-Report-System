/**
 * Laapak Report System - Money Management Routes
 * Handles money location tracking and movements between locations
 */

const express = require('express');
const router = express.Router();
const { adminRoleAuth } = require('../middleware/auth');
const { 
    MoneyLocation, 
    MoneyMovement, 
    Invoice, 
    Expense,
    Admin 
} = require('../models');
const { Op } = require('sequelize');

// =============================================================================
// TEST ROUTE
// =============================================================================

/**
 * GET /api/money/test
 * Test route to verify money routes are loaded
 */
router.get('/test', (req, res) => {
    console.log('Money test route accessed');
    res.json({
        success: true,
        message: 'Money management routes are working',
        timestamp: new Date().toISOString()
    });
});

// =============================================================================
// MONEY LOCATIONS ROUTES
// =============================================================================

/**
 * GET /api/money/locations
 * Get all money locations with current balances
 * Access: Superadmin only
 */
router.get('/locations', adminRoleAuth(['superadmin']), async (req, res) => {
    try {
        console.log('Money locations route accessed');
        
        // Test if MoneyLocation model is available
        if (!MoneyLocation) {
            console.error('MoneyLocation model not found');
            return res.status(500).json({
                success: false,
                message: 'MoneyLocation model not available'
            });
        }
        
        const locations = await MoneyLocation.findAll({
            where: { is_active: true },
            order: [['name', 'ASC']]
        });

        console.log('Found locations:', locations.length);

        // Calculate total balance
        const totalBalance = await MoneyLocation.getTotalBalance();

        res.json({
            success: true,
            data: {
                locations,
                totalBalance
            }
        });
    } catch (error) {
        console.error('Error fetching money locations:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching money locations',
            error: error.message
        });
    }
});

/**
 * POST /api/money/locations
 * Create a new money location
 * Access: Superadmin only
 */
router.post('/locations', adminRoleAuth(['superadmin']), async (req, res) => {
    try {
        const { name, name_ar, type, description } = req.body;
        
        const location = await MoneyLocation.create({
            name,
            name_ar,
            type,
            description,
            balance: 0.00
        });

        res.json({
            success: true,
            data: location
        });
    } catch (error) {
        console.error('Error creating money location:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating money location',
            error: error.message
        });
    }
});

/**
 * PUT /api/money/locations/:id
 * Update a money location
 * Access: Superadmin only
 */
router.put('/locations/:id', adminRoleAuth(['superadmin']), async (req, res) => {
    try {
        const { id } = req.params;
        const { name, name_ar, type, description, is_active } = req.body;
        
        const location = await MoneyLocation.findByPk(id);
        if (!location) {
            return res.status(404).json({
                success: false,
                message: 'Money location not found'
            });
        }

        await location.update({
            name,
            name_ar,
            type,
            description,
            is_active
        });

        res.json({
            success: true,
            data: location
        });
    } catch (error) {
        console.error('Error updating money location:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating money location',
            error: error.message
        });
    }
});

// =============================================================================
// MONEY MOVEMENTS ROUTES
// =============================================================================

/**
 * GET /api/money/movements
 * Get money movements with filtering and pagination
 * Access: Superadmin only
 */
router.get('/movements', adminRoleAuth(['superadmin']), async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 20, 
            startDate, 
            endDate, 
            movementType,
            locationId 
        } = req.query;

        const offset = (page - 1) * limit;
        const whereClause = {};

        // Date range filter
        if (startDate && endDate) {
            whereClause.movement_date = {
                [Op.between]: [new Date(startDate), new Date(endDate)]
            };
        }

        // Movement type filter
        if (movementType) {
            whereClause.movement_type = movementType;
        }

        // Location filter
        if (locationId) {
            whereClause[Op.or] = [
                { from_location_id: locationId },
                { to_location_id: locationId }
            ];
        }

        const movements = await MoneyMovement.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: MoneyLocation,
                    as: 'fromLocation',
                    attributes: ['id', 'name', 'name_ar']
                },
                {
                    model: MoneyLocation,
                    as: 'toLocation',
                    attributes: ['id', 'name', 'name_ar']
                },
                {
                    model: Admin,
                    as: 'creator',
                    attributes: ['id', 'name']
                }
            ],
            order: [['movement_date', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.json({
            success: true,
            data: {
                movements: movements.rows,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: movements.count,
                    pages: Math.ceil(movements.count / limit)
                }
            }
        });
    } catch (error) {
        console.error('Error fetching money movements:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching money movements',
            error: error.message
        });
    }
});

/**
 * POST /api/money/transfer
 * Create a money transfer between locations
 * Access: Superadmin only
 */
router.post('/transfer', adminRoleAuth(['superadmin']), async (req, res) => {
    try {
        const { fromLocationId, toLocationId, amount, description } = req.body;
        const adminId = req.admin.id;

        if (!toLocationId || !amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid transfer parameters'
            });
        }

        const movement = await MoneyMovement.createTransfer(
            fromLocationId,
            toLocationId,
            parseFloat(amount),
            description,
            adminId
        );

        res.json({
            success: true,
            data: movement,
            message: 'Transfer completed successfully'
        });
    } catch (error) {
        console.error('Error creating transfer:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating transfer',
            error: error.message
        });
    }
});

/**
 * POST /api/money/deposit
 * Add money to a location (external deposit)
 * Access: Superadmin only
 */
router.post('/deposit', adminRoleAuth(['superadmin']), async (req, res) => {
    try {
        const { toLocationId, amount, description } = req.body;
        const adminId = req.admin.id;

        if (!toLocationId || !amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid deposit parameters'
            });
        }

        const movement = await MoneyMovement.createTransfer(
            null, // No from location for external deposits
            toLocationId,
            parseFloat(amount),
            description,
            adminId
        );

        res.json({
            success: true,
            data: movement,
            message: 'Deposit completed successfully'
        });
    } catch (error) {
        console.error('Error creating deposit:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating deposit',
            error: error.message
        });
    }
});

/**
 * POST /api/money/withdrawal
 * Remove money from a location (external withdrawal)
 * Access: Superadmin only
 */
router.post('/withdrawal', adminRoleAuth(['superadmin']), async (req, res) => {
    try {
        const { fromLocationId, amount, description } = req.body;
        const adminId = req.admin.id;

        if (!fromLocationId || !amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid withdrawal parameters'
            });
        }

        // Check if location has sufficient balance
        const location = await MoneyLocation.findByPk(fromLocationId);
        if (!location) {
            return res.status(404).json({
                success: false,
                message: 'Location not found'
            });
        }

        if (parseFloat(location.balance) < parseFloat(amount)) {
            return res.status(400).json({
                success: false,
                message: 'Insufficient balance for withdrawal'
            });
        }

        const movement = await MoneyMovement.createTransfer(
            fromLocationId,
            null, // No to location for external withdrawals
            parseFloat(amount),
            description,
            adminId
        );

        res.json({
            success: true,
            data: movement,
            message: 'Withdrawal completed successfully'
        });
    } catch (error) {
        console.error('Error creating withdrawal:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating withdrawal',
            error: error.message
        });
    }
});

// =============================================================================
// DASHBOARD ROUTES
// =============================================================================

/**
 * GET /api/money/dashboard
 * Get money management dashboard data
 * Access: Superadmin only
 */
router.get('/dashboard', adminRoleAuth(['superadmin']), async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        // Get all locations with balances
        const locations = await MoneyLocation.findAll({
            where: { is_active: true },
            order: [['balance', 'DESC']]
        });

        // Calculate total balance
        const totalBalance = await MoneyLocation.getTotalBalance();

        // Get recent movements
        const recentMovements = await MoneyMovement.findAll({
            include: [
                {
                    model: MoneyLocation,
                    as: 'fromLocation',
                    attributes: ['id', 'name', 'name_ar']
                },
                {
                    model: MoneyLocation,
                    as: 'toLocation',
                    attributes: ['id', 'name', 'name_ar']
                }
            ],
            order: [['movement_date', 'DESC']],
            limit: 10
        });

        // Get movement statistics for the period
        let movementStats = {};
        if (startDate && endDate) {
            const movements = await MoneyMovement.findAll({
                where: {
                    movement_date: {
                        [Op.between]: [new Date(startDate), new Date(endDate)]
                    }
                }
            });

            movementStats = {
                totalMovements: movements.length,
                totalAmount: movements.reduce((sum, m) => sum + parseFloat(m.amount), 0),
                transfers: movements.filter(m => m.movement_type === 'transfer').length,
                deposits: movements.filter(m => m.movement_type === 'deposit').length,
                withdrawals: movements.filter(m => m.movement_type === 'withdrawal').length
            };
        }

        // Get invoice statistics by payment method
        const invoiceStats = await getInvoiceStatsByPaymentMethod(startDate, endDate);

        res.json({
            success: true,
            data: {
                locations,
                totalBalance,
                recentMovements,
                movementStats,
                invoiceStats
            }
        });
    } catch (error) {
        console.error('Error fetching money dashboard:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching money dashboard',
            error: error.message
        });
    }
});

// Helper function to get invoice statistics by payment method
async function getInvoiceStatsByPaymentMethod(startDate, endDate) {
    const { Invoice } = require('../models');
    const { Op } = require('sequelize');
    
    let whereClause = {};
    
    // Filter by date range if provided
    if (startDate && endDate) {
        whereClause.date = {
            [Op.between]: [new Date(startDate), new Date(endDate)]
        };
    } else if (startDate) {
        whereClause.date = {
            [Op.gte]: new Date(startDate)
        };
    } else if (endDate) {
        whereClause.date = {
            [Op.lte]: new Date(endDate)
        };
    }
    
    // Get invoices with payment methods
    const invoices = await Invoice.findAll({
        where: whereClause,
        attributes: ['paymentMethod', 'total', 'paymentStatus'],
        order: [['date', 'DESC']]
    });
    
    // Calculate statistics
    const stats = {
        totalInvoices: invoices.length,
        totalAmount: 0,
        byPaymentMethod: {
            cash: { count: 0, amount: 0, paid: 0, pending: 0 },
            instapay: { count: 0, amount: 0, paid: 0, pending: 0 },
            محفظة: { count: 0, amount: 0, paid: 0, pending: 0 },
            بنك: { count: 0, amount: 0, paid: 0, pending: 0 },
            other: { count: 0, amount: 0, paid: 0, pending: 0 }
        }
    };
    
    invoices.forEach(invoice => {
        const amount = parseFloat(invoice.total) || 0;
        const method = invoice.paymentMethod || 'other';
        const status = invoice.paymentStatus || 'pending';
        
        // Add to total
        stats.totalAmount += amount;
        
        // Add to payment method stats
        if (stats.byPaymentMethod.hasOwnProperty(method)) {
            stats.byPaymentMethod[method].count++;
            stats.byPaymentMethod[method].amount += amount;
            
            if (status === 'paid' || status === 'completed') {
                stats.byPaymentMethod[method].paid += amount;
            } else {
                stats.byPaymentMethod[method].pending += amount;
            }
        } else {
            stats.byPaymentMethod.other.count++;
            stats.byPaymentMethod.other.amount += amount;
            
            if (status === 'paid' || status === 'completed') {
                stats.byPaymentMethod.other.paid += amount;
            } else {
                stats.byPaymentMethod.other.pending += amount;
            }
        }
    });
    
    return stats;
}

module.exports = router;
