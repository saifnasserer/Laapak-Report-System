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
        console.log('GET /api/reports - Fetching all reports');
        
        // First check if we can get a simple count to verify database connection
        const count = await Report.count();
        console.log(`Found ${count} reports in database`);
        
        // Use proper associations with correct field names
        const reports = await Report.findAll({
            include: [
                { model: Client } // Using the correct association defined in models/index.js
                // Admin association removed as it's not properly defined
            ],
            order: [['created_at', 'DESC']]
        });
        
        // Parse JSON fields stored as TEXT for each report
        const mappedReports = reports.map(report => {
            const reportJson = report.toJSON();
            
            // Parse hardware_status if it exists
            if (reportJson.hardware_status) {
                try {
                    reportJson.hardware_status = JSON.parse(reportJson.hardware_status);
                } catch (e) {
                    console.error(`Error parsing hardware_status for report ${reportJson.id}:`, e);
                    reportJson.hardware_status = [];
                }
            }
            
            // Parse external_images if it exists
            if (reportJson.external_images) {
                try {
                    reportJson.external_images = JSON.parse(reportJson.external_images);
                } catch (e) {
                    console.error(`Error parsing external_images for report ${reportJson.id}:`, e);
                    reportJson.external_images = [];
                }
            }
            
            return reportJson;
        });
        
        console.log(`Successfully mapped ${mappedReports.length} reports`);
        res.json(mappedReports);
    } catch (error) {
        console.error('Error fetching reports:', error);
        
        // Log detailed error information for debugging
        if (error.name) console.error('Error name:', error.name);
        if (error.message) console.error('Error message:', error.message);
        
        // Check for specific error types
        if (error.name === 'SequelizeConnectionError' || error.name === 'SequelizeConnectionRefusedError') {
            return res.status(503).json({
                message: 'Failed to connect to database',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
        
        // Association errors
        if (error.name === 'SequelizeEagerLoadingError') {
            return res.status(500).json({
                message: 'Failed to load associated data',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
        
        // Generic database errors
        if (error.name && error.name.includes('Sequelize')) {
            return res.status(500).json({
                message: 'Database error occurred',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
        
        // Generic error response
        res.status(500).json({ 
            message: 'Failed to fetch reports', 
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Get reports for a specific client
router.get('/client', clientAuth, async (req, res) => {
    try {
        // Use correct field name client_id instead of clientId
        const reports = await Report.findAll({
            where: { client_id: req.user.id },
            order: [['created_at', 'DESC']]
        });
        
        // Parse JSON fields stored as TEXT for each report
        const parsedReports = reports.map(report => {
            const reportJson = report.toJSON();
            
            // Parse hardware_status if it exists
            if (reportJson.hardware_status) {
                try {
                    reportJson.hardware_status = JSON.parse(reportJson.hardware_status);
                } catch (e) {
                    console.error(`Error parsing hardware_status for report ${reportJson.id}:`, e);
                    reportJson.hardware_status = [];
                }
            }
            
            // Parse external_images if it exists
            if (reportJson.external_images) {
                try {
                    reportJson.external_images = JSON.parse(reportJson.external_images);
                } catch (e) {
                    console.error(`Error parsing external_images for report ${reportJson.id}:`, e);
                    reportJson.external_images = [];
                }
            }
            
            return reportJson;
        });
        
        res.json(parsedReports);
    } catch (error) {
        console.error('Error fetching client reports:', error);
        
        // Improved error handling
        if (error.name && error.name.includes('Sequelize')) {
            return res.status(500).json({
                message: 'Database error occurred',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
        
        res.status(500).json({ 
            message: 'Failed to fetch client reports', 
            error: process.env.NODE_ENV === 'development' ? error.message : undefined 
        });
    }
});

// Get reports without invoices (for invoice creation)
router.get('/without-invoice', adminAuth, async (req, res) => {
    try {
        const reports = await Report.findAll({
            where: { billing_enabled: true },
            include: [
                { model: Client } // Using the correct association defined in models/index.js
                // Admin association removed as it's not properly defined
            ],
            order: [['created_at', 'DESC']]
        });
        
        // Parse JSON fields stored as TEXT for each report
        const parsedReports = reports.map(report => {
            const reportJson = report.toJSON();
            
            // Parse hardware_status if it exists
            if (reportJson.hardware_status) {
                try {
                    reportJson.hardware_status = JSON.parse(reportJson.hardware_status);
                } catch (e) {
                    console.error(`Error parsing hardware_status for report ${reportJson.id}:`, e);
                    reportJson.hardware_status = [];
                }
            }
            
            // Parse external_images if it exists
            if (reportJson.external_images) {
                try {
                    reportJson.external_images = JSON.parse(reportJson.external_images);
                } catch (e) {
                    console.error(`Error parsing external_images for report ${reportJson.id}:`, e);
                    reportJson.external_images = [];
                }
            }
            
            return reportJson;
        });
        
        res.json(parsedReports);
    } catch (error) {
        console.error('Error fetching reports without invoices:', error);
        
        // Improved error handling
        if (error.name === 'SequelizeEagerLoadingError') {
            return res.status(500).json({
                message: 'Failed to load associated data',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
        
        if (error.name && error.name.includes('Sequelize')) {
            return res.status(500).json({
                message: 'Database error occurred',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
        
        res.status(500).json({ 
            message: 'Failed to fetch reports without invoices', 
            error: process.env.NODE_ENV === 'development' ? error.message : undefined 
        });
    }
});

// Get a specific report
router.get('/:id', auth, async (req, res) => {
    try {
        // Include Client association with the query
        const report = await Report.findByPk(req.params.id, {
            include: [{ model: Client }]
        });
        
        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }
        
        // Parse JSON fields stored as TEXT
        const parsedReport = report.toJSON();
        
        // Parse hardware_status if it exists
        if (parsedReport.hardware_status) {
            try {
                parsedReport.hardware_status = JSON.parse(parsedReport.hardware_status);
            } catch (e) {
                console.error('Error parsing hardware_status:', e);
                parsedReport.hardware_status = [];
            }
        }
        
        // Parse external_images if it exists
        if (parsedReport.external_images) {
            try {
                parsedReport.external_images = JSON.parse(parsedReport.external_images);
            } catch (e) {
                console.error('Error parsing external_images:', e);
                parsedReport.external_images = [];
            }
        }
        
        res.json(parsedReport);
    } catch (error) {
        console.error('Error fetching report:', error);
        
        // Improved error handling
        if (error.name === 'SequelizeEagerLoadingError') {
            return res.status(500).json({
                message: 'Failed to load associated data',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
        
        if (error.name && error.name.includes('Sequelize')) {
            return res.status(500).json({
                message: 'Database error occurred',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
        
        res.status(500).json({ 
            message: 'Failed to fetch report', 
            error: process.env.NODE_ENV === 'development' ? error.message : undefined 
        });
    }
});

// Create a new report (accessible without authentication for now)
router.post('/', async (req, res) => {
    // Start a transaction to ensure data consistency
    const transaction = await sequelize.transaction();
    
    try {
        console.log('CREATE REPORT REQUEST BODY:', JSON.stringify(req.body, null, 2));
        
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
            hardware_status: hardwareComponents,
            external_images: externalImages,
            notes,
            billing_enabled: billingEnabled,
            amount,
            status
        } = req.body;
        
        // Validate required fields
        if (!clientId || !orderNumber || !deviceModel || !inspectionDate) {
            return res.status(400).json({ 
                message: 'جميع الحقول المطلوبة يجب أن تكون موجودة', // All required fields must be present
                requiredFields: ['clientId', 'orderNumber', 'deviceModel', 'inspectionDate']
            });
        }
        
        // Generate a unique report ID if not provided
        const reportId = id || 'RPT' + Date.now().toString() + Math.floor(Math.random() * 1000);
        console.log('Creating report with ID:', reportId);
        
        // Table fields from database:
        // id (varchar 50), client_id (int), client_name (varchar 100), client_phone (varchar 20),
        // client_email (varchar 100), client_address (text), order_number (varchar 20),
        // device_model (varchar 100), serial_number (varchar 100), inspection_date (datetime),
        // hardware_status (longtext), external_images (longtext), notes (text),
        
        // Validate client_id is a number
        const clientIdNum = Number(clientId);
        if (isNaN(clientIdNum)) {
            return res.status(400).json({
                message: 'معرف العميل يجب أن يكون رقمًا',
                error: 'client_id must be a number'
            });
        }
        
        // Handle empty email to be null (to pass validation)
        const validatedEmail = clientEmail?.trim() === '' ? null : clientEmail;
        
        // Parse inspection date
        let inspectionDateObj;
        try {
            if (inspectionDate) {
                inspectionDateObj = new Date(inspectionDate);
                if (isNaN(inspectionDateObj.getTime())) {
                    console.warn('Invalid inspection date format, using current date');
                    inspectionDateObj = new Date();
                }
            } else {
                inspectionDateObj = new Date();
            }
        } catch (e) {
            console.warn('Error parsing inspection date, using current date:', e);
            inspectionDateObj = new Date();
        }
        
        // Process hardware_status - ensure it's a properly formatted JSON string
        let processedHardwareStatus = null;
        if (hardwareComponents) {
            try {
                // If it's already a string, check if it's valid JSON
                if (typeof hardwareComponents === 'string') {
                    // Try to parse and re-stringify to ensure valid JSON format
                    const parsed = JSON.parse(hardwareComponents);
                    processedHardwareStatus = JSON.stringify(parsed);
                } else {
                    // If it's an object/array, stringify it
                    processedHardwareStatus = JSON.stringify(hardwareComponents);
                }
            } catch (e) {
                console.error('Error processing hardware_status:', e);
                processedHardwareStatus = '[]';
            }
        }
        
        // Process external_images - ensure it's a properly formatted JSON string
        let processedExternalImages = null;
        if (externalImages) {
            try {
                // If it's already a string, check if it's valid JSON
                if (typeof externalImages === 'string') {
                    // Try to parse and re-stringify to ensure valid JSON format
                    const parsed = JSON.parse(externalImages);
                    processedExternalImages = JSON.stringify(parsed);
                } else {
                    // If it's an object/array, stringify it
                    processedExternalImages = JSON.stringify(externalImages);
                }
            } catch (e) {
                console.error('Error processing external_images:', e);
                processedExternalImages = '[]';
            }
        }
        
        const reportData = {
            id: reportId,
            client_id: clientIdNum,
            client_name: clientName || '',
            client_phone: clientPhone || '',
            client_email: validatedEmail,
            client_address: clientAddress || '',
            order_number: orderNumber || '',
            device_model: deviceModel || '',
            serial_number: serialNumber || '',
            inspection_date: inspectionDateObj,
            hardware_status: processedHardwareStatus,
            external_images: processedExternalImages,
            notes: notes || '',
            billing_enabled: billingEnabled === true,
            amount: Number(amount || 0),
            status: status || 'active'
            // Let Sequelize handle created_at and updated_at
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
        
        // Fetch the complete report
        const completeReport = await Report.findByPk(report.id);
        
        // Parse JSON fields stored as TEXT
        const parsedReport = completeReport.toJSON();
        if (parsedReport.hardware_status) {
            try {
                parsedReport.hardware_status = JSON.parse(parsedReport.hardware_status);
            } catch (e) {
                console.error('Error parsing hardware_status:', e);
            }
        }
        
        if (parsedReport.external_images) {
            try {
                parsedReport.external_images = JSON.parse(parsedReport.external_images);
            } catch (e) {
                console.error('Error parsing external_images:', e);
            }
        }
        
        console.log('Report created successfully with ID:', reportId);
        res.status(201).json(parsedReport);
    } catch (error) {
        await transaction.rollback();
        console.error('CREATE REPORT ERROR:', error);
        
        // Log detailed error information for debugging
        if (error.name) console.error('Error name:', error.name);
        if (error.message) console.error('Error message:', error.message);
        if (error.parent) {
            console.error('Parent error:', error.parent.message);
            console.error('SQL error code:', error.parent.code);
            if (error.parent.sql) console.error('SQL query:', error.parent.sql);
        }
        if (error.errors) console.error('Validation errors:', JSON.stringify(error.errors, null, 2));
        
        // Check for specific error types
        if (error.name === 'SequelizeForeignKeyConstraintError') {
            return res.status(400).json({
                message: 'العميل المحدد غير موجود', // Selected client does not exist
                error: 'Foreign key constraint error: ' + error.message,
                details: {
                    field: error.fields?.[0] || 'client_id',
                    table: error.table,
                    value: error.value
                }
            });
        }
        
        // Validation error
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({
                message: 'خطأ في التحقق من صحة البيانات', // Data validation error
                error: error.message,
                details: error.errors.map(err => ({ field: err.path, message: err.message }))
            });
        }
        
        // Database connection error
        if (error.name === 'SequelizeConnectionError' || error.name === 'SequelizeConnectionRefusedError') {
            return res.status(503).json({
                message: 'فشل الاتصال بقاعدة البيانات', // Database connection failed
                error: error.message
            });
        }
        
        // Check for specific database errors
        if (error.parent) {
            if (error.parent.code === 'ER_NO_SUCH_TABLE') {
                return res.status(500).json({ 
                    message: 'جدول قاعدة البيانات غير موجود', // Database table does not exist
                    error: error.message,
                    details: 'Table does not exist. Make sure to run database setup script.'
                });
            }
            
            if (error.parent.code === 'ER_BAD_FIELD_ERROR') {
                return res.status(500).json({ 
                    message: 'خطأ في حقول قاعدة البيانات', // Database field error
                    error: error.message,
                    details: 'Field does not exist in database table. Check model definition.'
                });
            }
        }
        
        // Generic error
        res.status(500).json({
            message: 'خطأ في الخادم', // Server error
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
