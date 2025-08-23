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
        const { name_ar, name_en, type, balance, description } = req.body;

        // Validate required fields
        if (!name_ar || !type) {
            return res.status(400).json({
                success: false,
                message: 'Name and type are required'
            });
        }

        const location = await MoneyLocation.create({
            name_ar,
            name_en: name_en || name_ar,
            type,
            balance: parseFloat(balance || 0),
            description: description || '',
            created_by: req.user.id,
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
        const { name_ar, name_en, type, balance, description, is_active } = req.body;

        const location = await MoneyLocation.findByPk(id);
        if (!location) {
            return res.status(404).json({
                success: false,
                message: 'Money location not found'
            });
        }

        await location.update({
            name_ar: name_ar || location.name_ar,
            name_en: name_en || location.name_en,
            type: type || location.type,
            balance: balance !== undefined ? parseFloat(balance) : location.balance,
            description: description !== undefined ? description : location.description,
            is_active: is_active !== undefined ? is_active : location.is_active,
            updated_by: req.user.id
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
                { fromLocationId: locationId },
                { toLocationId: locationId }
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
                    attributes: ['id', 'name_ar', 'type']
                },
                {
                    model: MoneyLocation,
                    as: 'toLocation',
                    attributes: ['id', 'name_ar', 'type']
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
            fromLocationId: fromLocationId || null,
            toLocationId: toLocationId,
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
            fromLocationId: null,
            toLocationId: toLocationId,
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
            fromLocationId: fromLocationId,
            toLocationId: null,
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
                    attributes: ['id', 'name_ar', 'type']
                },
                {
                    model: MoneyLocation,
                    as: 'toLocation',
                    attributes: ['id', 'name_ar', 'type']
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

module.exports = router;
