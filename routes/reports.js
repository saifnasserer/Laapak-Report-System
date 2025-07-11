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

// GET /reports/insights/device-models - get device models with advanced filtering
router.get('/insights/device-models', auth, async (req, res) => {
    try {
        const { 
            period = 'month', // month, quarter, year, custom
            startDate, 
            endDate,
            limit = 10,
            sortBy = 'count' // count, name, trend
        } = req.query;

        let startOfPeriod, endOfPeriod;
        const currentDate = new Date();

        // Calculate date range based on period
        switch (period) {
            case 'week':
                startOfPeriod = new Date(currentDate);
                startOfPeriod.setDate(currentDate.getDate() - 7);
                endOfPeriod = currentDate;
                break;
            case 'month':
                startOfPeriod = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
                endOfPeriod = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
                break;
            case 'quarter':
                const quarter = Math.floor(currentDate.getMonth() / 3);
                startOfPeriod = new Date(currentDate.getFullYear(), quarter * 3, 1);
                endOfPeriod = new Date(currentDate.getFullYear(), (quarter + 1) * 3, 0);
                break;
            case 'year':
                startOfPeriod = new Date(currentDate.getFullYear(), 0, 1);
                endOfPeriod = new Date(currentDate.getFullYear(), 11, 31);
                break;
            case 'custom':
                if (!startDate || !endDate) {
                    return res.status(400).json({ message: 'startDate and endDate required for custom period' });
                }
                startOfPeriod = new Date(startDate);
                endOfPeriod = new Date(endDate);
                break;
            default:
                startOfPeriod = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
                endOfPeriod = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        }

        // Get device models with count and trend
        const deviceModels = await Report.findAll({
            where: {
                created_at: {
                    [Op.between]: [startOfPeriod, endOfPeriod]
                }
            },
            attributes: [
                'device_model',
                [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
                [sequelize.fn('DATE', sequelize.col('created_at')), 'date']
            ],
            group: ['device_model', sequelize.fn('DATE', sequelize.col('created_at'))],
            order: sortBy === 'name' ? [['device_model', 'ASC']] : [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
            limit: parseInt(limit)
        });

        // Calculate trends (compare with previous period)
        const previousStart = new Date(startOfPeriod);
        const previousEnd = new Date(endOfPeriod);
        const periodLength = endOfPeriod - startOfPeriod;
        previousStart.setTime(previousStart.getTime() - periodLength);
        previousEnd.setTime(previousEnd.getTime() - periodLength);

        const previousPeriodData = await Report.findAll({
            where: {
                created_at: {
                    [Op.between]: [previousStart, previousEnd]
                }
            },
            attributes: [
                'device_model',
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            group: ['device_model']
        });

        // Create trend mapping
        const trendMap = {};
        previousPeriodData.forEach(item => {
            trendMap[item.device_model] = parseInt(item.count);
        });

        // Add trend data to current results
        const results = deviceModels.map(item => {
            const currentCount = parseInt(item.count) || 0;
            const previousCount = trendMap[item.device_model] || 0;
            const trend = previousCount === 0 ? 100 : ((currentCount - previousCount) / previousCount) * 100;
            
            return {
                device_model: item.device_model,
                count: isNaN(currentCount) ? 0 : currentCount,
                trend: Math.round(trend * 100) / 100,
                trend_direction: trend > 0 ? 'up' : trend < 0 ? 'down' : 'stable'
            };
        });

        res.json({
            period,
            startDate: startOfPeriod,
            endDate: endOfPeriod,
            totalDevices: results.reduce((sum, item) => sum + item.count, 0),
            deviceModels: results
        });
    } catch (error) {
        console.error('Error getting device models insights:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// GET /reports/insights/warranty-alerts - get clients with warranty ending soon with advanced filtering
router.get('/insights/warranty-alerts', auth, async (req, res) => {
    try {
        const { 
            daysAhead = 7,
            warrantyType, // manufacturing, replacement, maintenance, all
            sortBy = 'urgency' // urgency, client_name, device_model
        } = req.query;

        const currentDate = new Date();
        const daysFromNow = new Date(currentDate);
        daysFromNow.setDate(currentDate.getDate() + parseInt(daysAhead));

        // Get all reports with their clients
        const reports = await Report.findAll({
            include: [
                {
                    model: Client,
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

            // Check warranties based on type filter
            const warranties = [];
            if (!warrantyType || warrantyType === 'manufacturing' || warrantyType === 'all') {
                warranties.push({ type: 'manufacturing', endDate: manufacturingEnd, days: 180 });
            }
            if (!warrantyType || warrantyType === 'replacement' || warrantyType === 'all') {
                warranties.push({ type: 'replacement', endDate: replacementEnd, days: 14 });
            }
            if (!warrantyType || warrantyType === 'maintenance' || warrantyType === 'all') {
                warranties.push({ type: 'maintenance', endDate: maintenanceEnd, days: 365 });
            }

            warranties.forEach(warranty => {
                if (warranty.endDate >= currentDate && warranty.endDate <= daysFromNow) {
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
                        urgency_level: daysRemaining <= 3 ? 'critical' : daysRemaining <= 5 ? 'high' : 'medium',
                        report_id: report.id
                    });
                }
            });
        });

        // Sort based on criteria
        switch (sortBy) {
            case 'client_name':
                warrantyAlerts.sort((a, b) => a.client_name.localeCompare(b.client_name));
                break;
            case 'device_model':
                warrantyAlerts.sort((a, b) => a.device_model.localeCompare(b.device_model));
                break;
            case 'urgency':
            default:
                warrantyAlerts.sort((a, b) => a.days_remaining - b.days_remaining);
                break;
        }

        // Group by urgency level
        const groupedAlerts = {
            critical: warrantyAlerts.filter(alert => alert.urgency_level === 'critical'),
            high: warrantyAlerts.filter(alert => alert.urgency_level === 'high'),
            medium: warrantyAlerts.filter(alert => alert.urgency_level === 'medium')
        };

        res.json({
            total_alerts: warrantyAlerts.length,
            days_ahead: parseInt(daysAhead),
            warranty_type_filter: warrantyType || 'all',
            grouped_alerts: groupedAlerts,
            alerts: warrantyAlerts
        });
    } catch (error) {
        console.error('Error getting warranty alerts:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// GET /reports/insights/revenue-trends - get revenue trends with filtering
router.get('/insights/revenue-trends', auth, async (req, res) => {
    try {
        const { period = 'month', groupBy = 'day' } = req.query;
        
        const currentDate = new Date();
        let startDate, endDate;
        
        switch (period) {
            case 'week':
                startDate = new Date(currentDate);
                startDate.setDate(currentDate.getDate() - 7);
                endDate = currentDate;
                break;
            case 'month':
                startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
                endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
                break;
            case 'quarter':
                const quarter = Math.floor(currentDate.getMonth() / 3);
                startDate = new Date(currentDate.getFullYear(), quarter * 3, 1);
                endDate = new Date(currentDate.getFullYear(), (quarter + 1) * 3, 0);
                break;
            case 'year':
                startDate = new Date(currentDate.getFullYear(), 0, 1);
                endDate = new Date(currentDate.getFullYear(), 11, 31);
                break;
            default:
                startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
                endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        }

        // Get revenue data from invoices
        const revenueData = await Invoice.findAll({
            where: {
                created_at: {
                    [Op.between]: [startDate, endDate]
                },
                status: 'paid'
            },
            attributes: [
                [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
                [sequelize.fn('SUM', sequelize.col('total_amount')), 'total_revenue'],
                [sequelize.fn('COUNT', sequelize.col('id')), 'invoice_count']
            ],
            group: [sequelize.fn('DATE', sequelize.col('created_at'))],
            order: [[sequelize.fn('DATE', sequelize.col('created_at')), 'ASC']]
        });

        const totalRevenue = revenueData.reduce((sum, item) => sum + parseFloat(item.total_revenue), 0);
        const totalInvoices = revenueData.reduce((sum, item) => sum + parseInt(item.invoice_count), 0);

        res.json({
            period,
            startDate,
            endDate,
            totalRevenue,
            totalInvoices,
            averageRevenue: totalInvoices > 0 ? totalRevenue / totalInvoices : 0,
            dailyData: revenueData.map(item => ({
                date: item.date,
                revenue: parseFloat(item.total_revenue),
                invoiceCount: parseInt(item.invoice_count)
            }))
        });
    } catch (error) {
        console.error('Error getting revenue trends:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// GET /reports/insights/client-performance - get top performing clients
router.get('/insights/client-performance', auth, async (req, res) => {
    try {
        const { period = 'month', limit = 10, metric = 'revenue' } = req.query;
        
        const currentDate = new Date();
        let startDate, endDate;
        
        switch (period) {
            case 'month':
                startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
                endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
                break;
            case 'quarter':
                const quarter = Math.floor(currentDate.getMonth() / 3);
                startDate = new Date(currentDate.getFullYear(), quarter * 3, 1);
                endDate = new Date(currentDate.getFullYear(), (quarter + 1) * 3, 0);
                break;
            case 'year':
                startDate = new Date(currentDate.getFullYear(), 0, 1);
                endDate = new Date(currentDate.getFullYear(), 11, 31);
                break;
            default:
                startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
                endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        }

        let orderBy;
        let attributes;

        if (metric === 'revenue') {
            attributes = [
                'client_id',
                [sequelize.fn('SUM', sequelize.col('total_amount')), 'total_revenue'],
                [sequelize.fn('COUNT', sequelize.col('id')), 'invoice_count']
            ];
            orderBy = [[sequelize.fn('SUM', sequelize.col('total_amount')), 'DESC']];
        } else if (metric === 'devices') {
            attributes = [
                'client_id',
                [sequelize.fn('COUNT', sequelize.col('id')), 'device_count']
            ];
            orderBy = [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']];
        }

        const clientPerformance = await Report.findAll({
            where: {
                created_at: {
                    [Op.between]: [startDate, endDate]
                }
            },
            include: [
                {
                    model: Client,
                    attributes: ['id', 'name', 'phone', 'email']
                }
            ],
            attributes,
            group: ['client_id'],
            order: orderBy,
            limit: parseInt(limit)
        });

        res.json({
            period,
            metric,
            startDate,
            endDate,
            topClients: clientPerformance
        });
    } catch (error) {
        console.error('Error getting client performance:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// GET /reports/insights/technical-analysis - get technical issues and solutions
router.get('/insights/technical-analysis', auth, async (req, res) => {
    try {
        const { period = 'month', issueType } = req.query;
        
        const currentDate = new Date();
        let startDate, endDate;
        
        switch (period) {
            case 'month':
                startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
                endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
                break;
            case 'quarter':
                const quarter = Math.floor(currentDate.getMonth() / 3);
                startDate = new Date(currentDate.getFullYear(), quarter * 3, 1);
                endDate = new Date(currentDate.getFullYear(), (quarter + 1) * 3, 0);
                break;
            case 'year':
                startDate = new Date(currentDate.getFullYear(), 0, 1);
                endDate = new Date(currentDate.getFullYear(), 11, 31);
                break;
            default:
                startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
                endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        }

        // Analyze technical issues from reports
        const technicalIssues = await Report.findAll({
            where: {
                created_at: {
                    [Op.between]: [startDate, endDate]
                }
            },
            attributes: [
                'technical_issues',
                'solutions_applied',
                'device_model',
                [sequelize.fn('COUNT', sequelize.col('id')), 'issue_count']
            ],
            group: ['technical_issues', 'solutions_applied', 'device_model'],
            order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']]
        });

        // Group issues by type
        const issueTypes = {
            hardware: technicalIssues.filter(issue => 
                issue.technical_issues && 
                issue.technical_issues.toLowerCase().includes('hardware')
            ),
            software: technicalIssues.filter(issue => 
                issue.technical_issues && 
                issue.technical_issues.toLowerCase().includes('software')
            ),
            network: technicalIssues.filter(issue => 
                issue.technical_issues && 
                issue.technical_issues.toLowerCase().includes('network')
            ),
            other: technicalIssues.filter(issue => 
                issue.technical_issues && 
                !issue.technical_issues.toLowerCase().includes('hardware') &&
                !issue.technical_issues.toLowerCase().includes('software') &&
                !issue.technical_issues.toLowerCase().includes('network')
            )
        };

        res.json({
            period,
            startDate,
            endDate,
            totalIssues: technicalIssues.length,
            issueTypes,
            topIssues: technicalIssues.slice(0, 10),
            deviceModelIssues: technicalIssues.reduce((acc, issue) => {
                if (!acc[issue.device_model]) {
                    acc[issue.device_model] = 0;
                }
                acc[issue.device_model] += parseInt(issue.issue_count);
                return acc;
            }, {})
        });
    } catch (error) {
        console.error('Error getting technical analysis:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
