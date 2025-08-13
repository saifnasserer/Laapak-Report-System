const express = require('express');
const { Sequelize, Op } = require('sequelize');
const { Report, Client, ReportTechnicalTest, Invoice, InvoiceReport } = require('../models'); // Added InvoiceReport
const { auth, clientAuth, adminAuth } = require('../middleware/auth'); // Import all auth middlewares
const { sequelize } = require('../config/db');

const router = express.Router();

// GET /reports/count - get count of reports
router.get('/count', auth, async (req, res) => {
    try {
        const { status, startDate, endDate } = req.query;
        
        let whereClause = {};
        
        // If status filter is provided
        if (status) {
            whereClause.status = status;
        }
        
        // If date range is provided
        if (startDate && endDate) {
            whereClause.inspection_date = {
                [Op.between]: [new Date(startDate), new Date(endDate)]
            };
        } else if (startDate) {
            whereClause.inspection_date = {
                [Op.gte]: new Date(startDate)
            };
        } else if (endDate) {
            whereClause.inspection_date = {
                [Op.lte]: new Date(endDate)
            };
        }
        
        const count = await Report.count({ where: whereClause });
        
        res.json({ count });
    } catch (error) {
        console.error('Error counting reports:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// GET /reports - get all reports or a single report by query ID (e.g., /reports?id=REPORT_ID)
router.get('/', async (req, res) => {
    console.log('Backend: Received request to /api/reports');
    console.log('Backend: req.query:', JSON.stringify(req.query, null, 2));
  const { id } = req.query;
  console.log(`Backend: Extracted id: ${id}`);

  if (id) {
    console.log('Backend: Processing request for a SINGLE report with ID:', id);
    // Fetch a single report by ID
    try {
      console.log(`Fetching report with ID from query: ${id}`);
      const reportInstance = await Report.findByPk(id, {
        include: [
          {
            model: Client,
            attributes: ['id', 'name', 'phone', 'email', 'address'], // Ensure all needed client fields are here
          },
          {
            model: ReportTechnicalTest, // Assuming 'ReportTechnicalTest' is the correct model name
            as: 'technical_tests', // Assuming this alias is defined in your Report model associations
            attributes: ['componentName', 'status', 'notes', 'type', 'icon'], // Specify attributes needed by frontend
          }
        ],
      });

      if (!reportInstance) {
        console.log(`Report with ID ${id} not found`);
        return res.status(404).json({ error: 'Report not found' });
      }

      console.log(`Found report: ${reportInstance.id}`);
      
      // Structure the response to match the frontend's expected format { report: {}, technical_tests: [] }
      const responseData = {
        report: {
          id: reportInstance.id,
          client_name: reportInstance.client_name,
          order_number: reportInstance.order_number,
          inspection_date: reportInstance.inspection_date,
          device_model: reportInstance.device_model,
          device_serial: reportInstance.serial_number,
          status_badge: reportInstance.status, // Map DB 'status' to 'status_badge'
          external_images: reportInstance.external_images, // Will be parsed by frontend
          hardware_status: reportInstance.hardware_status, // Will be parsed by frontend
          notes: reportInstance.notes,
          // You can add other fields from reportInstance as needed
          // If client details are preferred from the association:
          // client_info_associated: reportInstance.Client ? reportInstance.Client.toJSON() : null
        },
        technical_tests: reportInstance.technical_tests ? reportInstance.technical_tests.map(tt => tt.toJSON()) : []
      };
      
      res.json(responseData);

    } catch (error) {
      console.error(`Failed to fetch report with ID ${id}:`, error);
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  } else {
    console.log('Backend: ID not provided or falsy. Processing request for ALL reports.');
    // Fetch all reports (existing logic)
    try {
      console.log('Fetching all reports eligible for invoicing');
      // We need to import the Invoice model at the top of the file
      // const { Report, Client, ReportTechnicalTest, Invoice } = require('../models');
      const { Invoice } = require('../models'); // Assuming Invoice is already destructured or add it.

      const whereClause = {}; // Start with an empty where clause

      // Handle 'billing_enabled' filter
      if (req.query.billing_enabled !== undefined) {
        const beParam = req.query.billing_enabled.toString().toLowerCase();
        if (beParam === 'false' || beParam === '0') {
          whereClause.billing_enabled = false;
        } else if (beParam === 'true' || beParam === '1') {
          whereClause.billing_enabled = true;
        }
      }

      // Handle 'fetch_mode' for invoiced reports
      // Default: exclude invoiced reports (e.g., for create-invoice page)
      // If fetch_mode is 'all_reports', then don't add this Op.notIn condition.
      if (req.query.fetch_mode !== 'all_reports') {
        whereClause.id = { // Report ID
          [Op.notIn]: [
            Sequelize.literal(`SELECT report_id FROM invoice_reports WHERE report_id IS NOT NULL`)
          ]
        };
      }

      const reports = await Report.findAll({
        where: whereClause,
        include: [
          {
            model: Client,
            as: 'client',
            attributes: ['id', 'name', 'phone', 'email'],
          },
          {
            model: Invoice,
            as: 'invoices',
            through: { attributes: [] }, // Don't include junction table attributes
            attributes: ['id', 'total', 'paymentStatus'],
            required: false // Left join to include reports without invoices
          }
        ],
        order: [['created_at', 'DESC']],
      });
      console.log(`Found ${reports.length} reports`);
      res.json(reports);
    } catch (error) {
      console.error('Failed to fetch all reports:', error);
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  }
});

// GET /reports/:id - get report by ID
router.get('/:id', async (req, res) => {
  try {
    console.log(`Fetching report with ID: ${req.params.id}`);
    const report = await Report.findByPk(req.params.id, {
      include: {
        model: Client,
        as: 'client',
        attributes: ['id', 'name', 'phone', 'email', 'address'],
      },
    });
    if (!report) {
      console.log(`Report with ID ${req.params.id} not found`);
      return res.status(404).json({ error: 'Report not found' });
    }
    console.log(`Found report: ${report.id}`);
    res.json({ success: true, report: report });
  } catch (error) {
    console.error('Failed to fetch report:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// GET /reports/client/me - get reports for the authenticated client
router.get('/client/me', clientAuth, async (req, res) => {
  try {
    const clientId = req.user.id; // clientAuth middleware sets req.user
    if (!clientId) {
      console.error('Client ID not found in token after auth middleware');
      return res.status(401).json({ error: 'Authentication error: Client ID missing.' });
    }

    console.log(`Fetching reports for authenticated client ID: ${clientId}`);
    const reports = await Report.findAll({
      where: { client_id: clientId }, // Ensure 'client_id' matches your Report model's foreign key field name
      include: [
        {
          model: Client,
          as: 'client',
          attributes: ['id', 'name', 'phone', 'email', 'address'],
        },
        // Optional: Include ReportTechnicalTest if needed for client dashboard preview
        // {
        //   model: ReportTechnicalTest,
        //   as: 'technical_tests',
        //   attributes: ['componentName', 'status', 'notes', 'type', 'icon'],
        // }
      ],
      order: [['inspection_date', 'DESC']], // Order by inspection_date, or 'created_at' if preferred
    });

    // It's not an error if a client has no reports, return empty array
    console.log(`Found ${reports ? reports.length : 0} reports for client ID ${clientId}`);
    res.json({ success: true, data: reports || [] });

  } catch (error) {
    console.error('Failed to fetch reports for authenticated client:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// POST /reports - create a new report
router.post('/', async (req, res) => {
  try {
    console.log('Received report data:', JSON.stringify(req.body, null, 2));
    
    // Check if we're receiving data in the direct database schema format
    if (req.body.client_id && req.body.device_model) {
      try {
        // Direct database schema format
        const reportData = req.body;
        
        // Log the data being used to create the report
        console.log('Creating report with direct schema:', reportData);
        
        const newReport = await Report.create(reportData);
        console.log('Report created successfully:', newReport.id);
        res.status(201).json(newReport);
      } catch (error) {
        console.error('Failed to create report with direct schema:', error.message);
        console.error('Error stack:', error.stack);
        if (error.name === 'SequelizeValidationError') {
          return res.status(400).json({ error: 'Validation error', details: error.errors.map(e => e.message) });
        } else if (error.name === 'SequelizeDatabaseError') {
          return res.status(500).json({ error: 'Database error', details: error.message });
        }
        res.status(500).json({ error: 'Internal server error', details: error.message });
      }
    } else {
      // Original format with clientId, title, description, data
      const { clientId, title, description, data } = req.body;

      if (!clientId || !title) {
        return res.status(400).json({ error: 'clientId and title are required' });
      }

      // Log the data being used to create the report
      console.log('Creating report with:', { clientId, title, description, data });

      try {
        const newReport = await Report.create({
          clientId,
          title,
          description,
          data,
        });
        console.log('Report created successfully:', newReport.id);
        res.status(201).json(newReport);
      } catch (error) {
        console.error('Failed to create report:', error.message);
        console.error('Error stack:', error.stack);
        if (error.name === 'SequelizeValidationError') {
          return res.status(400).json({ error: 'Validation error', details: error.errors.map(e => e.message) });
        } else if (error.name === 'SequelizeDatabaseError') {
          return res.status(500).json({ error: 'Database error', details: error.message });
        }
        res.status(500).json({ error: 'Internal server error', details: error.message });
      }
    }
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// PUT /reports/:id - update a report
router.put('/:id', auth, async (req, res) => {
  try {
    console.log(`Updating report ${req.params.id} with data:`, req.body);
    
    const report = await Report.findByPk(req.params.id);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Update all fields that can be updated
    const updateFields = [
      'client_id', 'client_name', 'client_phone', 'client_email', 'client_address',
      'order_number', 'device_model', 'serial_number', 'inspection_date',
      'hardware_status', 'external_images', 'notes', 'billing_enabled', 'amount', 'status'
    ];

    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        report[field] = req.body[field];
      }
    });

    // Handle special fields
    if (req.body.inspection_date) {
      report.inspection_date = new Date(req.body.inspection_date);
    }

    // Handle JSON fields
    if (req.body.hardware_status && typeof req.body.hardware_status === 'string') {
      try {
        JSON.parse(req.body.hardware_status); // Validate JSON
        report.hardware_status = req.body.hardware_status;
      } catch (error) {
        console.error('Invalid hardware_status JSON:', error);
        return res.status(400).json({ error: 'Invalid hardware_status format' });
      }
    }

    if (req.body.external_images && typeof req.body.external_images === 'string') {
      try {
        JSON.parse(req.body.external_images); // Validate JSON
        report.external_images = req.body.external_images;
      } catch (error) {
        console.error('Invalid external_images JSON:', error);
        return res.status(400).json({ error: 'Invalid external_images format' });
      }
    }

    await report.save();
    
    console.log(`Report ${req.params.id} updated successfully`);
    res.json({ 
      message: 'Report updated successfully',
      report: report 
    });
  } catch (error) {
    console.error('Failed to update report:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// DELETE /reports/:id - delete a report
router.delete('/:id', async (req, res) => {
  try {
    const deletedCount = await Report.destroy({
      where: { id: req.params.id },
    });
    if (deletedCount === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }
    res.json({ message: 'Report deleted successfully' });
  } catch (error) {
    console.error('Failed to delete report:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /reports/search?q=term - search reports by client name, order number, or device model
router.get('/search', async (req, res) => {
  const { q } = req.query;
  if (!q) {
    return res.status(400).json({ error: 'Query parameter "q" is required' });
  }

  try {
    console.log(`Searching reports with query: ${q}`);
    const reports = await Report.findAll({
      where: {
        [Op.or]: [
          { client_name: { [Op.like]: `%${q}%` } },
          { order_number: { [Op.like]: `%${q}%` } },
          { device_model: { [Op.like]: `%${q}%` } },
          { serial_number: { [Op.like]: `%${q}%` } }
        ],
      },
      include: {
        model: Client,
        attributes: ['id', 'name', 'phone', 'email'],
      },
      order: [['created_at', 'DESC']],
    });
    console.log(`Found ${reports.length} reports matching query: ${q}`);
    res.json(reports);
  } catch (error) {
    console.error('Failed to search reports:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// GET /reports/insights/device-models - get device models sold this month
router.get('/insights/device-models', auth, async (req, res) => {
    try {
        const currentDate = new Date();
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

        const deviceModels = await Report.findAll({
            where: {
                created_at: {
                    [Op.between]: [startOfMonth, endOfMonth]
                }
            },
            attributes: [
                'device_model',
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            group: ['device_model'],
            order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
            limit: 10
        });

        res.json(deviceModels);
    } catch (error) {
        console.error('Error getting device models insights:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// GET /reports/insights/warranty-alerts - get clients with warranty ending soon
router.get('/insights/warranty-alerts', auth, async (req, res) => {
    try {
        const currentDate = new Date();
        const sevenDaysFromNow = new Date(currentDate);
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

        // Get all reports with their clients
        const reports = await Report.findAll({
            include: [
                {
                    model: Client,
                    as: 'client',
                    attributes: ['id', 'name', 'phone', 'email']
                }
            ],
            order: [['inspection_date', 'DESC']]
        });

        const warrantyAlerts = [];

        reports.forEach(report => {
            const inspectionDate = new Date(report.inspection_date);
            
            // Calculate warranty end dates
            const manufacturingEnd = new Date(inspectionDate);
            manufacturingEnd.setMonth(manufacturingEnd.getMonth() + 6);
            
            const replacementEnd = new Date(inspectionDate);
            replacementEnd.setDate(replacementEnd.getDate() + 14);
            
            const maintenanceEnd = new Date(inspectionDate);
            maintenanceEnd.setFullYear(maintenanceEnd.getFullYear() + 1);

            // Check if any warranty is ending within 7 days
            const warranties = [
                { type: 'manufacturing', endDate: manufacturingEnd, days: 180 },
                { type: 'replacement', endDate: replacementEnd, days: 14 },
                { type: 'maintenance', endDate: maintenanceEnd, days: 365 }
            ];

            warranties.forEach(warranty => {
                if (warranty.endDate >= currentDate && warranty.endDate <= sevenDaysFromNow) {
                    const daysRemaining = Math.ceil((warranty.endDate - currentDate) / (1000 * 60 * 60 * 24));
                    
                    warrantyAlerts.push({
                        client_id: report.client_id,
                        client_name: report.client_name,
                        client_phone: report.client_phone,
                        device_model: report.device_model,
                        serial_number: report.serial_number,
                        inspection_date: report.inspection_date,
                        warranty_type: warranty.type,
                        warranty_end_date: warranty.endDate,
                        days_remaining: daysRemaining,
                        report_id: report.id
                    });
                }
            });
        });

        // Sort by days remaining (most urgent first)
        warrantyAlerts.sort((a, b) => a.days_remaining - b.days_remaining);

        res.json(warrantyAlerts);
    } catch (error) {
        console.error('Error getting warranty alerts:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
