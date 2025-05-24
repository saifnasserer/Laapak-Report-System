const express = require('express');
const { Sequelize, Op } = require('sequelize');
const { Report, Client, ReportTechnicalTest, Invoice, InvoiceReport } = require('../models'); // Added InvoiceReport
const { auth, clientAuth, adminAuth } = require('../middleware/auth'); // Import all auth middlewares

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

      const reports = await Report.findAll({
        where: {
          billing_enabled: true, // Only fetch reports marked for billing
          id: {
            [Op.notIn]: [
              Sequelize.literal(`SELECT report_id FROM invoice_reports WHERE report_id IS NOT NULL`)
            ]
          }
        },
        include: {
          model: Client,
          attributes: ['id', 'name', 'phone', 'email'],
        },
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
router.put('/:id', async (req, res) => {
  const { clientId, title, description, data } = req.body;

  try {
    const report = await Report.findByPk(req.params.id);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    if (clientId !== undefined) report.clientId = clientId;
    if (title !== undefined) report.title = title;
    if (description !== undefined) report.description = description;
    if (data !== undefined) report.data = data;

    await report.save();
    res.json(report);
  } catch (error) {
    console.error('Failed to update report:', error);
    res.status(500).json({ error: 'Internal server error' });
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

module.exports = router;
