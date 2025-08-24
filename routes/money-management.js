/**
 * Laapak Report System - Money Management API Routes
 * Handles money locations, movements, and financial tracking
 */

const express = require('express');
const router = express.Router();
const { adminAuth } = require('../middleware/auth');
const { MoneyLocation, MoneyMovement, Invoice } = require('../models');
const { Op } = require('sequelize');

// =============================================================================
// MONEY LOCATIONS ROUTES
// =============================================================================

/**
 * GET /api/money/locations
 * Get all money locations with their current balances
 */
router.get('/locations', adminAuth, async (req, res) => {
    try {
        const locations = await MoneyLocation.findAll({
            where: { is_active: true },
            order: [['created_at', 'ASC']]
        });

        res.json({
            success: true,
            data: {
                locations: locations
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
 */
router.post('/locations', adminAuth, async (req, res) => {
    try {
        const { name_ar, type, balance, description } = req.body;

        // Validate required fields
        if (!name_ar || !type) {
            return res.status(400).json({
                success: false,
                message: 'Name and type are required'
            });
        }

        const location = await MoneyLocation.create({
            name: name_ar, // Use name_ar for both name and name_ar fields
            name_ar,
            type,
            balance: parseFloat(balance || 0),
            description: description || '',
            is_active: true
        });

        res.status(201).json({
            success: true,
            data: {
                location: location
            }
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
 */
router.put('/locations/:id', adminAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { name_ar, type, balance, description, is_active } = req.body;

        const location = await MoneyLocation.findByPk(id);
        if (!location) {
            return res.status(404).json({
                success: false,
                message: 'Money location not found'
            });
        }

        await location.update({
            name: name_ar || location.name,
            name_ar: name_ar || location.name_ar,
            type: type || location.type,
            balance: balance !== undefined ? parseFloat(balance) : location.balance,
            description: description !== undefined ? description : location.description,
            is_active: is_active !== undefined ? is_active : location.is_active
        });

        res.json({
            success: true,
            data: {
                location: location
            }
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
 * Get money movements with optional filters
 */
router.get('/movements', adminAuth, async (req, res) => {
    try {
        const { 
            startDate, 
            endDate, 
            locationId, 
            movementType, 
            limit = 50,
            offset = 0 
        } = req.query;

        let whereClause = {};

        // Filter by date range
        if (startDate && endDate) {
            whereClause.movement_date = {
                [Op.between]: [new Date(startDate), new Date(endDate)]
            };
        }

        // Filter by location
        if (locationId) {
            whereClause[Op.or] = [
                { from_location_id: locationId },
                { to_location_id: locationId }
            ];
        }

        // Filter by movement type
        if (movementType) {
            whereClause.movement_type = movementType;
        }

        const movements = await MoneyMovement.findAll({
            where: whereClause,
            include: [
                {
                    model: MoneyLocation,
                    as: 'fromLocation',
                    attributes: ['id', 'name_ar', 'type'],
                    foreignKey: 'from_location_id'
                },
                {
                    model: MoneyLocation,
                    as: 'toLocation',
                    attributes: ['id', 'name_ar', 'type'],
                    foreignKey: 'to_location_id'
                }
            ],
            order: [['movement_date', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        const totalCount = await MoneyMovement.count({ where: whereClause });

        res.json({
            success: true,
            data: {
                movements: movements,
                pagination: {
                    total: totalCount,
                    limit: parseInt(limit),
                    offset: parseInt(offset),
                    hasMore: (parseInt(offset) + parseInt(limit)) < totalCount
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
 * Create a transfer between money locations
 */
router.post('/transfer', adminAuth, async (req, res) => {
    const transaction = await require('../models').sequelize.transaction();
    
    try {
        const { fromLocationId, toLocationId, amount, description } = req.body;

        // Validate required fields
        if (!toLocationId || !amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Valid destination location and amount are required'
            });
        }

        // Validate locations exist
        const toLocation = await MoneyLocation.findByPk(toLocationId);
        if (!toLocation) {
            return res.status(404).json({
                success: false,
                message: 'Destination location not found'
            });
        }

        let fromLocation = null;
        if (fromLocationId) {
            fromLocation = await MoneyLocation.findByPk(fromLocationId);
            if (!fromLocation) {
                return res.status(404).json({
                    success: false,
                    message: 'Source location not found'
                });
            }

            // Check if source location has sufficient balance
            if (parseFloat(fromLocation.balance) < parseFloat(amount)) {
                return res.status(400).json({
                    success: false,
                    message: 'Insufficient balance in source location'
                });
            }
        }

        // Create movement record
        const movement = await MoneyMovement.create({
            movement_type: fromLocationId ? 'transfer' : 'deposit',
            amount: parseFloat(amount),
            from_location_id: fromLocationId || null,
            to_location_id: toLocationId,
            reference_type: 'manual',
            description: description || (fromLocationId ? 'تحويل بين المواقع' : 'إيداع'),
            movement_date: new Date(),
            created_by: req.user.id
        }, { transaction });

        // Update location balances
        if (fromLocation) {
            await fromLocation.update({
                balance: parseFloat(fromLocation.balance) - parseFloat(amount)
            }, { transaction });
        }

        await toLocation.update({
            balance: parseFloat(toLocation.balance) + parseFloat(amount)
        }, { transaction });

        await transaction.commit();

        res.status(201).json({
            success: true,
            data: {
                movement: movement
            }
        });
    } catch (error) {
        await transaction.rollback();
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
 * Create a deposit to a money location
 */
router.post('/deposit', adminAuth, async (req, res) => {
    const transaction = await require('../models').sequelize.transaction();
    
    try {
        const { toLocationId, amount, description } = req.body;

        // Validate required fields
        if (!toLocationId || !amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Valid destination location and amount are required'
            });
        }

        // Validate location exists
        const toLocation = await MoneyLocation.findByPk(toLocationId);
        if (!toLocation) {
            return res.status(404).json({
                success: false,
                message: 'Destination location not found'
            });
        }

        // Create movement record
        const movement = await MoneyMovement.create({
            movement_type: 'deposit',
            amount: parseFloat(amount),
            from_location_id: null,
            to_location_id: toLocationId,
            reference_type: 'manual',
            description: description || 'إيداع',
            movement_date: new Date(),
            created_by: req.user.id
        }, { transaction });

        // Update location balance
        await toLocation.update({
            balance: parseFloat(toLocation.balance) + parseFloat(amount)
        }, { transaction });

        await transaction.commit();

        res.status(201).json({
            success: true,
            data: {
                movement: movement
            }
        });
    } catch (error) {
        await transaction.rollback();
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
 * Create a withdrawal from a money location
 */
router.post('/withdrawal', adminAuth, async (req, res) => {
    const transaction = await require('../models').sequelize.transaction();
    
    try {
        const { fromLocationId, amount, description } = req.body;

        // Validate required fields
        if (!fromLocationId || !amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Valid source location and amount are required'
            });
        }

        // Validate location exists
        const fromLocation = await MoneyLocation.findByPk(fromLocationId);
        if (!fromLocation) {
            return res.status(404).json({
                success: false,
                message: 'Source location not found'
            });
        }

        // Check if location has sufficient balance
        if (parseFloat(fromLocation.balance) < parseFloat(amount)) {
            return res.status(400).json({
                success: false,
                message: 'Insufficient balance in source location'
            });
        }

        // Create movement record
        const movement = await MoneyMovement.create({
            movement_type: 'withdrawal',
            amount: parseFloat(amount),
            from_location_id: fromLocationId,
            to_location_id: null,
            reference_type: 'manual',
            description: description || 'سحب',
            movement_date: new Date(),
            created_by: req.user.id
        }, { transaction });

        // Update location balance
        await fromLocation.update({
            balance: parseFloat(fromLocation.balance) - parseFloat(amount)
        }, { transaction });

        await transaction.commit();

        res.status(201).json({
            success: true,
            data: {
                movement: movement
            }
        });
    } catch (error) {
        await transaction.rollback();
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
 */
router.get('/dashboard', adminAuth, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        let whereClause = {};
        if (startDate && endDate) {
            whereClause.movement_date = {
                [Op.between]: [new Date(startDate), new Date(endDate)]
            };
        }

        // Get locations with balances
        const locations = await MoneyLocation.findAll({
            where: { is_active: true },
            order: [['created_at', 'ASC']]
        });

        // Get recent movements
        const recentMovements = await MoneyMovement.findAll({
            where: whereClause,
            include: [
                {
                    model: MoneyLocation,
                    as: 'fromLocation',
                    attributes: ['id', 'name_ar', 'type'],
                    foreignKey: 'from_location_id'
                },
                {
                    model: MoneyLocation,
                    as: 'toLocation',
                    attributes: ['id', 'name_ar', 'type'],
                    foreignKey: 'to_location_id'
                }
            ],
            order: [['movement_date', 'DESC']],
            limit: 10
        });

        // Calculate statistics
        const totalBalance = locations.reduce((sum, loc) => sum + parseFloat(loc.balance || 0), 0);
        const totalMovements = await MoneyMovement.count({ where: whereClause });

        // Get today's movements
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todayMovements = await MoneyMovement.count({
            where: {
                movement_date: {
                    [Op.between]: [today, tomorrow]
                }
            }
        });

        res.json({
            success: true,
            data: {
                locations: locations,
                recentMovements: recentMovements,
                statistics: {
                    totalBalance: totalBalance,
                    totalLocations: locations.length,
                    totalMovements: totalMovements,
                    todayMovements: todayMovements
                }
            }
        });
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching dashboard data',
            error: error.message
        });
    }
});

/**
 * DELETE /api/money/movements/:id
 * Revert a money movement by reversing the balance changes
 */
router.delete('/movements/:id', adminAuth, async (req, res) => {
    const transaction = await require('../models').sequelize.transaction();
    
    try {
        const { id } = req.params;
        console.log('Reverting money movement:', id);

        // Find the movement
        const movement = await MoneyMovement.findByPk(id, {
            include: [
                {
                    model: MoneyLocation,
                    as: 'fromLocation',
                    attributes: ['id', 'name_ar', 'balance', 'type'],
                    foreignKey: 'from_location_id'
                },
                {
                    model: MoneyLocation,
                    as: 'toLocation',
                    attributes: ['id', 'name_ar', 'balance', 'type'],
                    foreignKey: 'to_location_id'
                }
            ],
            transaction
        });

        if (!movement) {
            await transaction.rollback();
            return res.status(404).json({
                success: false,
                message: 'Money movement not found'
            });
        }

        console.log('Found movement to revert:', {
            id: movement.id,
            movement_type: movement.movement_type,
            amount: movement.amount,
            from_location_id: movement.from_location_id,
            to_location_id: movement.to_location_id,
            reference_type: movement.reference_type,
            reference_id: movement.reference_id
        });

        // Check if this movement can be reverted
        // Don't allow reverting expense/income movements that are linked to records
        if (movement.reference_type === 'expense' || movement.reference_type === 'manual') {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: 'لا يمكن إلغاء حركة مرتبطة بتسجيل مالي. يرجى حذف التسجيل المالي بدلاً من ذلك.'
            });
        }

        // Reverse the balance changes
        let balanceChanges = [];

        // Handle from location (money was taken from here)
        if (movement.fromLocation) {
            const currentBalance = parseFloat(movement.fromLocation.balance || 0);
            const newBalance = currentBalance + parseFloat(movement.amount);
            
            console.log(`Reverting from location ${movement.fromLocation.name_ar}:`, {
                currentBalance,
                amount: movement.amount,
                newBalance
            });

            await movement.fromLocation.update({
                balance: newBalance
            }, { transaction });

            balanceChanges.push({
                location: movement.fromLocation.name_ar,
                oldBalance: currentBalance,
                newBalance: newBalance,
                change: `+${movement.amount}`
            });
        }

        // Handle to location (money was added here)
        if (movement.toLocation) {
            const currentBalance = parseFloat(movement.toLocation.balance || 0);
            const newBalance = currentBalance - parseFloat(movement.amount);
            
            // Prevent negative balance
            const finalBalance = Math.max(0, newBalance);
            
            console.log(`Reverting to location ${movement.toLocation.name_ar}:`, {
                currentBalance,
                amount: movement.amount,
                newBalance,
                finalBalance
            });

            await movement.toLocation.update({
                balance: finalBalance
            }, { transaction });

            balanceChanges.push({
                location: movement.toLocation.name_ar,
                oldBalance: currentBalance,
                newBalance: finalBalance,
                change: `-${movement.amount}`
            });
        }

        // Delete the movement
        await movement.destroy({ transaction });

        // Commit transaction
        await transaction.commit();

        console.log('Successfully reverted money movement:', {
            movementId: id,
            balanceChanges
        });

        res.json({
            success: true,
            message: 'تم إلغاء الحركة بنجاح',
            data: {
                revertedMovementId: id,
                balanceChanges
            }
        });

    } catch (error) {
        await transaction.rollback();
        console.error('Error reverting money movement:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في إلغاء الحركة',
            error: error.message
        });
    }
});

module.exports = router;
