/**
 * Laapak Report System - Reports API Routes
 * Handles all report-related API endpoints
 */

const express = require('express');
const router = express.Router();
const { Report, Client, Admin, sequelize } = require('../models');
const { auth, adminAuth, clientAuth } = require('../middleware/auth');
const { Op } = require('sequelize');

// Get all reports (admin only)
router.get('/', adminAuth, async (req, res) => {
    try {
        const reports = await Report.findAll({
            include: [
                { model: Client },
                { model: Admin, as: 'Technician' }
            ],
            order: [['createdAt', 'DESC']]
        });
        res.json(reports);
    } catch (error) {
        console.error('Error fetching reports:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get reports for a specific client
router.get('/client', clientAuth, async (req, res) => {
    try {
        const reports = await Report.findAll({
            where: { clientId: req.user.id },
            include: [{ model: Admin, as: 'Technician' }],
            order: [['createdAt', 'DESC']]
        });
        res.json(reports);
    } catch (error) {
        console.error('Error fetching client reports:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get a specific report
router.get('/:id', auth, async (req, res) => {
    try {
        const report = await Report.findByPk(req.params.id, {
            include: [
                { model: Client },
                { model: Admin, as: 'Technician' }
            ]
        });
        
        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }
        
        // Check if user has permission to view this report
        if (req.user.isAdmin || req.user.id === report.clientId) {
            res.json(report);
        } else {
            res.status(403).json({ message: 'Not authorized to view this report' });
        }
    } catch (error) {
        console.error('Error fetching report:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create a new report (admin only)
router.post('/', adminAuth, async (req, res) => {
    try {
        const report = await Report.create({
            ...req.body,
            technicianId: req.user.id
        });
        
        res.status(201).json(report);
    } catch (error) {
        console.error('Error creating report:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update a report (admin only)
router.put('/:id', adminAuth, async (req, res) => {
    try {
        const report = await Report.findByPk(req.params.id);
        
        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }
        
        await report.update(req.body);
        res.json(report);
    } catch (error) {
        console.error('Error updating report:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete a report (admin only)
router.delete('/:id', adminAuth, async (req, res) => {
    try {
        const report = await Report.findByPk(req.params.id);
        
        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }
        
        await report.destroy();
        res.json({ message: 'Report deleted successfully' });
    } catch (error) {
        console.error('Error deleting report:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Search reports (admin only)
router.get('/search/:query', adminAuth, async (req, res) => {
    try {
        const { query } = req.params;
        const reports = await Report.findAll({
            where: {
                [Op.or]: [
                    { orderNumber: { [Op.like]: `%${query}%` } },
                    { deviceModel: { [Op.like]: `%${query}%` } },
                    { serialNumber: { [Op.like]: `%${query}%` } }
                ]
            },
            include: [
                { model: Client },
                { model: Admin, as: 'Technician' }
            ],
            order: [['createdAt', 'DESC']]
        });
        
        res.json(reports);
    } catch (error) {
        console.error('Error searching reports:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
