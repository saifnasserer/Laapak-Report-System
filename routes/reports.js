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
router.post('/', async (req, res) => {
    // Start a transaction to ensure data consistency
    const transaction = await sequelize.transaction();
    
    try {
        // Extract only the fields that exist in the database from request body
        const { 
            id, 
            client_id: clientId, 
            client_name: clientName,
            client_phone: clientPhone,
            client_email: clientEmail,
            client_address: clientAddress,
            order_number: orderNumber, 
            device_model: deviceModel, 
            serial_number: serialNumber, 
            inspection_date: inspectionDate, 
            notes, 
            billing_enabled: billingEnabled, 
            amount,
            status,
            hardware_status: hardwareComponents,
            external_images: externalImages
        } = req.body;
        
        // Validate required fields
        if (!clientId || !orderNumber || !deviceModel || !inspectionDate) {
            return res.status(400).json({ 
                message: 'جميع الحقول المطلوبة يجب أن تكون موجودة', // All required fields must be present
                requiredFields: ['clientId', 'orderNumber', 'deviceModel', 'inspectionDate']
            });
        }
        
        // Generate a unique report ID if not provided
        const reportId = id || `RPT${Math.floor(Math.random() * 1000000000)}`;
        
        console.log('Creating report with ID:', reportId);
        
        // Prepare the report data - ONLY include fields that exist in the database table
        // Table fields from database:
        // id (varchar 50), client_id (int), client_name (varchar 100), client_phone (varchar 20),
        // client_email (varchar 100), client_address (text), order_number (varchar 20),
        // device_model (varchar 100), serial_number (varchar 100), inspection_date (datetime),
        // hardware_status (longtext), external_images (longtext), notes (text),
        // billing_enabled (tinyint), amount (decimal 10,2), status (enum),
        // created_at (datetime), updated_at (datetime)
        
        // Ensure inspection_date is a proper datetime object
        let inspectionDateObj;
        try {
            inspectionDateObj = new Date(inspectionDate);
            if (isNaN(inspectionDateObj.getTime())) {
                // If invalid date, use current date
                console.warn('Invalid inspection date received, using current date');
                inspectionDateObj = new Date();
            }
        } catch (e) {
            console.warn('Error parsing inspection date, using current date:', e);
            inspectionDateObj = new Date();
        }
        
        const reportData = {
            id: reportId,
            client_id: clientId,
            client_name: clientName || '',
            client_phone: clientPhone || '',
            client_email: clientEmail || '',
            client_address: clientAddress || '',
            order_number: orderNumber,
            device_model: deviceModel,
            serial_number: serialNumber || '',
            inspection_date: inspectionDateObj, // Proper datetime object
            // The hardware_status and external_images are already stringified on the client side
            // We're receiving them as JSON strings, which matches our longtext database field type
            hardware_status: hardwareComponents,
            external_images: externalImages,
            notes: notes || '',
            billing_enabled: billingEnabled === true,
            amount: parseFloat(amount || 0),
            status: status || 'active'
            // created_at and updated_at are handled automatically by Sequelize
        };
        
        // Log the exact data being sent to the database
        console.log('Exact data being sent to database:', JSON.stringify(reportData, null, 2));
        
        // Create the main report record with explicit error handling
        let report;
        try {
            // First check database connection
            try {
                await sequelize.authenticate();
                console.log('Database connection verified before creating report');
            } catch (connError) {
                console.error('Database connection failed:', connError);
                throw new Error('Database connection failed: ' + connError.message);
            }
            
            // Log the exact model definition to debug field mismatches
            console.log('Report model definition:', JSON.stringify(Report.rawAttributes, null, 2));
            
            // Log each field being sent to identify which one might be causing issues
            Object.keys(reportData).forEach(key => {
                console.log(`Field ${key}: ${typeof reportData[key]} = ${JSON.stringify(reportData[key])}`);
            });
            
            // Try to create the report with explicit error handling
            try {
                report = await Report.create(reportData, { transaction });
                console.log('Report created successfully with ID:', report.id);
                
                // Hardware components and external images are now stored as JSON in the main report table
                // No need to process them separately
                console.log('Hardware components and external images stored as JSON in the main report record');
            } catch (createError) {
                console.error('Specific error in Report.create():', createError);
                if (createError.name === 'SequelizeValidationError') {
                    console.error('Validation errors:', createError.errors);
                }
                throw createError; // Re-throw to be caught by the outer catch block
            }
        } catch (createError) {
            console.error('Specific error creating report record:', createError);
            console.error('Error name:', createError.name);
            console.error('Error message:', createError.message);
            if (createError.errors) {
                console.error('Validation errors:', JSON.stringify(createError.errors, null, 2));
            }
            if (createError.parent) {
                console.error('Parent error:', createError.parent.message);
                console.error('SQL:', createError.parent.sql);
            }
            // Throw with more details to help diagnose the issue
            throw new Error(`Failed to create report: ${createError.message}. Check field mappings.`);
        }
        
        await transaction.commit();
        console.log('Transaction committed successfully');
        
        // Fetch the complete report with all associations
        const completeReport = await Report.findByPk(report.id, {
            include: [
                { model: Client },
                { model: ReportTechnicalTest },
                { model: ReportExternalInspection }
            ]
        });
        
        console.log('Report created successfully with ID:', reportId);
        res.status(201).json(completeReport);
    } catch (error) {
        await transaction.rollback();
        console.error('Error creating report:', error);
        
        // Check for specific error types
        if (error.name === 'SequelizeForeignKeyConstraintError') {
            return res.status(400).json({
                message: 'العميل المحدد غير موجود', // Selected client does not exist
                error: 'Foreign key constraint error: ' + error.message
            });
        }
        
        // Validation error
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({
                message: 'بيانات التقرير غير صالحة', // Invalid report data
                error: 'Validation error: ' + error.message
            });
        }
        
        // Hardware components error
        if (error.message && error.message.includes('hardware components')) {
            return res.status(500).json({
                message: 'حدث خطأ أثناء معالجة مكونات الأجهزة', // Error processing hardware components
                error: error.message
            });
        }
        
        // External images error
        if (error.message && error.message.includes('external images')) {
            return res.status(500).json({
                message: 'حدث خطأ أثناء معالجة الصور الخارجية', // Error processing external images
                error: error.message
            });
        }
        
        // Database connection error
        if (error.message && error.message.includes('Database connection failed')) {
            console.error('Database connection error:', error);
            return res.status(500).json({ 
                message: 'فشل الاتصال بقاعدة البيانات', // Database connection failed
                error: error.message,
                details: 'Check that MySQL is running and credentials are correct.'
            });
        }
        
        // Generic database error
        if (error.name && error.name.includes('Sequelize')) {
            console.error('Database error details:', error);
            if (error.parent) {
                console.error('SQL error code:', error.parent.code);
                console.error('SQL error message:', error.parent.message);
                console.error('SQL statement:', error.parent.sql);
            }
            
            // Check for specific database errors
            if (error.parent && error.parent.code === 'ER_NO_SUCH_TABLE') {
                return res.status(500).json({ 
                    message: 'جدول قاعدة البيانات غير موجود', // Database table does not exist
                    error: error.message,
                    details: 'Table does not exist. Make sure to run database setup script.'
                });
            }
            
            if (error.parent && error.parent.code === 'ER_BAD_FIELD_ERROR') {
                return res.status(500).json({ 
                    message: 'خطأ في حقول قاعدة البيانات', // Database field error
                    error: error.message,
                    details: 'Field does not exist in database table. Check model definition.'
                });
            }
            
            // Connection error
            if (error.parent && (error.parent.code === 'ECONNREFUSED' || error.parent.code === 'ER_ACCESS_DENIED_ERROR')) {
                return res.status(500).json({ 
                    message: 'فشل الاتصال بقاعدة البيانات', // Database connection failed
                    error: error.message,
                    details: 'Check that MySQL is running and credentials are correct.'
                });
            }
            
            return res.status(500).json({ 
                message: 'حدث خطأ في قاعدة البيانات', // Database error
                error: error.message,
                details: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
        
        // Generic error
        return res.status(500).json({ 
            message: 'حدث خطأ أثناء إنشاء التقرير', // An error occurred while creating the report
            error: error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
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
