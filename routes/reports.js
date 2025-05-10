/**
 * Laapak Report System - Reports API Routes
 * Handles all report-related API endpoints
 */

const express = require('express');
const router = express.Router();
const { Report, Client, Admin, ReportTechnicalTest, ReportExternalInspection, sequelize } = require('../models');
const { auth, adminAuth, clientAuth } = require('../middleware/auth');
const { Op } = require('sequelize');

// Get all reports (admin only)
router.get('/', adminAuth, async (req, res) => {
    try {
        console.log('GET /api/reports - Fetching all reports');
        
        // First check if we can get a simple count to verify database connection
        const count = await Report.count();
        console.log(`Found ${count} reports in database`);
        
        // Use a simpler query first to avoid potential issues with associations
        const reports = await Report.findAll({
            attributes: ['id', 'orderCode', 'deviceModel', 'serialNumber', 'inspectionDate', 'status', 'createdAt'],
            order: [['createdAt', 'DESC']]
        });
        
        // Map the results to include client and technician names if needed
        const mappedReports = await Promise.all(reports.map(async (report) => {
            const reportJson = report.toJSON();
            
            try {
                // Get client info if available
                if (report.clientId) {
                    const client = await Client.findByPk(report.clientId);
                    if (client) {
                        reportJson.clientName = client.name;
                    }
                }
                
                // Get technician info if available
                if (report.technicianId) {
                    const technician = await Admin.findByPk(report.technicianId);
                    if (technician) {
                        reportJson.technicianName = technician.name;
                    }
                }
            } catch (innerError) {
                console.error('Error fetching related data for report:', innerError);
                // Continue even if we can't get related data
            }
            
            return reportJson;
        }));
        
        console.log(`Successfully mapped ${mappedReports.length} reports`);
        res.json(mappedReports);
    } catch (error) {
        console.error('Error fetching reports:', error);
        // Send more detailed error information for debugging
        res.status(500).json({ 
            message: 'Server error', 
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
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

// Get reports without invoices (for invoice creation)
router.get('/without-invoice', adminAuth, async (req, res) => {
    try {
        const reports = await Report.findAll({
            where: { hasInvoice: false },
            include: [
                { model: Client },
                { model: Admin, as: 'Technician' }
            ],
            order: [['createdAt', 'DESC']]
        });
        res.json(reports);
    } catch (error) {
        console.error('Error fetching reports without invoices:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get a specific report
router.get('/:id', auth, async (req, res) => {
    try {
        const report = await Report.findByPk(req.params.id, {
            include: [
                { model: Client },
                { model: Admin, as: 'Technician' },
                { model: ReportTechnicalTest },
                { model: ReportExternalInspection }
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
    const transaction = await sequelize.transaction();
    
    try {
        const {
            clientId,
            orderCode,
            deviceModel,
            serialNumber,
            inspectionDate,
            problemDescription,
            diagnosis,
            solution,
            notes,
            technicalTests,
            externalInspection
        } = req.body;
        
        // Generate a unique report ID
        const reportId = 'RPT' + Date.now().toString().slice(-6);
        
        // Create report
        const report = await Report.create({
            id: reportId,
            clientId,
            orderCode,
            deviceModel,
            serialNumber,
            inspectionDate,
            problemDescription,
            diagnosis,
            solution,
            notes,
            hasInvoice: false,
            technicianId: req.user.id
        }, { transaction });
        
        // Create technical tests if provided
        if (technicalTests && technicalTests.length > 0) {
            await Promise.all(technicalTests.map(test => 
                ReportTechnicalTest.create({
                    reportId: report.id,
                    componentName: test.componentName,
                    status: test.status,
                    notes: test.notes
                }, { transaction })
            ));
        }
        
        // Create external inspection items if provided
        if (externalInspection && externalInspection.length > 0) {
            await Promise.all(externalInspection.map(item => 
                ReportExternalInspection.create({
                    reportId: report.id,
                    componentName: item.componentName,
                    conditionStatus: item.conditionStatus || item.status, // Support both formats
                    notes: item.notes
                }, { transaction })
            ));
        }
        
        await transaction.commit();
        
        // Fetch the complete report with all associations
        const completeReport = await Report.findByPk(report.id, {
            include: [
                { model: Client },
                { model: Admin, as: 'Technician' },
                { model: ReportTechnicalTest },
                { model: ReportExternalInspection }
            ]
        });
        
        res.status(201).json(completeReport);
    } catch (error) {
        await transaction.rollback();
        console.error('Error creating report:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update a report (admin only)
router.put('/:id', adminAuth, async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
        const report = await Report.findByPk(req.params.id);
        
        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }
        
        // Update report fields
        await report.update(req.body, { transaction });
        
        // Update technical tests if provided
        if (req.body.technicalTests) {
            // Delete existing tests
            await ReportTechnicalTest.destroy({ 
                where: { reportId: report.id },
                transaction 
            });
            
            // Create new tests
            await Promise.all(req.body.technicalTests.map(test => 
                ReportTechnicalTest.create({
                    reportId: report.id,
                    componentName: test.componentName,
                    status: test.status,
                    notes: test.notes
                }, { transaction })
            ));
        }
        
        // Update external inspection items if provided
        if (req.body.externalInspection) {
            // Delete existing inspection items
            await ReportExternalInspection.destroy({ 
                where: { reportId: report.id },
                transaction 
            });
            
            // Create new inspection items
            await Promise.all(req.body.externalInspection.map(item => 
                ReportExternalInspection.create({
                    reportId: report.id,
                    componentName: item.componentName,
                    conditionStatus: item.conditionStatus || item.status, // Support both formats
                    notes: item.notes
                }, { transaction })
            ));
        }
        
        await transaction.commit();
        
        // Fetch the complete updated report with all associations
        const updatedReport = await Report.findByPk(report.id, {
            include: [
                { model: Client },
                { model: Admin, as: 'Technician' },
                { model: ReportTechnicalTest },
                { model: ReportExternalInspection }
            ]
        });
        
        res.json(updatedReport);
    } catch (error) {
        await transaction.rollback();
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
                    { orderCode: { [Op.like]: `%${query}%` } },
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
