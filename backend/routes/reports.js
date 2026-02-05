const express = require('express');
const { Sequelize, Op } = require('sequelize');
const { Report, Client, ReportTechnicalTest, Invoice, InvoiceReport } = require('../models'); // Added InvoiceReport
const { auth, clientAuth, adminAuth } = require('../middleware/auth'); // Import all auth middlewares
const { sequelize } = require('../config/db');

const router = express.Router();

// Base attributes for Report queries (includes all fields including device specs)
const REPORT_BASE_ATTRIBUTES = [
  'id', 'client_id', 'client_name', 'client_phone', 'client_email', 'client_address',
  'order_number', 'device_model', 'serial_number', 'cpu', 'gpu', 'ram', 'storage',
  'inspection_date', 'hardware_status', 'external_images', 'notes', 'billing_enabled', 'amount',
  'invoice_created', 'invoice_id', 'invoice_date', 'status', 'admin_id',
  'created_at', 'updated_at', 'warranty_alerts_log'
];



/**
 * Check if device spec columns exist in the database
 * @returns {Promise<boolean>} True if columns exist, false otherwise
 */
async function checkDeviceSpecColumnsExist() {
  try {
    const [results] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'reports' 
      AND COLUMN_NAME IN ('cpu', 'gpu', 'ram', 'storage')
    `);
    return results.length === 4; // All 4 columns must exist
  } catch (error) {
    console.error('Error checking device spec columns:', error);
    return false;
  }
}

// GET /reports/count - get count of reports
router.get('/count', auth, async (req, res) => {
  try {
    const { status, startDate, endDate, dateField } = req.query;

    let whereClause = {};

    // If status filter is provided
    if (status) {
      whereClause.status = status;
    }

    // Determine which date field to use for filtering
    // For completed reports, use updated_at (when status was changed to completed)
    // For other reports, use inspection_date (when report was created/inspected)
    const dateFieldToUse = dateField || (status === 'completed' ? 'updated_at' : 'inspection_date');

    // If date range is provided
    if (startDate && endDate) {
      const start = new Date(startDate);
      // Ensure end date includes the full day (23:59:59.999)
      const end = new Date(endDate);
      // If end date doesn't already include time, add end of day
      if (!endDate.includes('T') || endDate.endsWith('T00:00:00.000Z')) {
        end.setHours(23, 59, 59, 999);
      }
      whereClause[dateFieldToUse] = {
        [Op.between]: [start, end]
      };
      console.log(`[COUNT] status=${status || 'all'}, dateField=${dateFieldToUse}, start=${start.toISOString()}, end=${end.toISOString()}`);
    } else if (startDate) {
      const start = new Date(startDate);
      whereClause[dateFieldToUse] = {
        [Op.gte]: start
      };
      console.log(`[COUNT] status=${status || 'all'}, dateField=${dateFieldToUse}, startDate=${start.toISOString()}`);
    } else if (endDate) {
      const end = new Date(endDate);
      // Ensure end date includes the full day
      if (!endDate.includes('T') || endDate.endsWith('T00:00:00.000Z')) {
        end.setHours(23, 59, 59, 999);
      }
      whereClause[dateFieldToUse] = {
        [Op.lte]: end
      };
      console.log(`[COUNT] status=${status || 'all'}, dateField=${dateFieldToUse}, endDate=${end.toISOString()}`);
    } else {
      console.log(`[COUNT] status=${status || 'all'}, no date filter`);
    }

    const count = await Report.count({ where: whereClause });
    console.log(`[COUNT] Result: ${count} reports found`);

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
        attributes: REPORT_BASE_ATTRIBUTES, // Explicitly exclude cpu, gpu, ram, storage until migration runs
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
          cpu: reportInstance.cpu || null,
          gpu: reportInstance.gpu || null,
          ram: reportInstance.ram || null,
          storage: reportInstance.storage || null,
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
      const whereConditions = []; // Array to collect all conditions

      // Handle 'billing_enabled' filter
      if (req.query.billing_enabled !== undefined) {
        const beParam = req.query.billing_enabled.toString().toLowerCase();
        if (beParam === 'false' || beParam === '0') {
          whereConditions.push({ billing_enabled: false });
        } else if (beParam === 'true' || beParam === '1') {
          whereConditions.push({ billing_enabled: true });
        }
      }

      // Handle date range filters
      // Special logic: Show ALL pending reports regardless of date (they're still active work)
      // For completed/cancelled reports, filter by date range
      if (req.query.startDate || req.query.endDate) {
        const startDate = req.query.startDate ? new Date(req.query.startDate) : null;
        const endDate = req.query.endDate ? new Date(req.query.endDate + 'T23:59:59') : null;

        // Build date range condition for inspection_date
        let inspectionDateCondition = {};
        if (startDate && endDate) {
          inspectionDateCondition = { [Op.between]: [startDate, endDate] };
        } else if (startDate) {
          inspectionDateCondition = { [Op.gte]: startDate };
        } else if (endDate) {
          inspectionDateCondition = { [Op.lte]: endDate };
        }

        // Build date range condition for created_at
        let createdDateCondition = {};
        if (startDate && endDate) {
          createdDateCondition = { [Op.between]: [startDate, endDate] };
        } else if (startDate) {
          createdDateCondition = { [Op.gte]: startDate };
        } else if (endDate) {
          createdDateCondition = { [Op.lte]: endDate };
        }

        // Show ALL pending/active reports (regardless of date) OR completed/cancelled reports within date range
        // Split into two separate conditions to avoid complex nesting
        const pendingStatusCondition = {
          [Op.or]: [
            { status: 'قيد الانتظار' },
            { status: 'pending' },
            { status: 'active' },
            { status: null }
          ]
        };

        const completedStatusCondition = {
          [Op.or]: [
            { status: 'مكتمل' },
            { status: 'completed' },
            { status: 'ملغي' },
            { status: 'ملغى' },
            { status: 'cancelled' },
            { status: 'canceled' }
          ]
        };

        const dateRangeCondition = {
          [Op.or]: [
            { inspection_date: inspectionDateCondition },
            {
              [Op.and]: [
                { inspection_date: { [Op.is]: null } },
                { created_at: createdDateCondition }
              ]
            }
          ]
        };

        // Show: (ALL pending) OR (completed/cancelled in date range)
        whereConditions.push({
          [Op.or]: [
            // All pending reports - no date restriction
            pendingStatusCondition,
            // Completed/cancelled reports in date range
            {
              [Op.and]: [
                completedStatusCondition,
                dateRangeCondition
              ]
            }
          ]
        });
      }

      // Handle status filter
      if (req.query.status) {
        whereConditions.push({ status: req.query.status });
      }

      // Handle 'fetch_mode' for invoiced reports
      // Default: exclude invoiced reports (e.g., for create-invoice page)
      // If fetch_mode is 'all_reports', then don't add this Op.notIn condition.
      if (req.query.fetch_mode !== 'all_reports') {
        whereConditions.push({
          id: { // Report ID
            [Op.notIn]: [
              Sequelize.literal(`SELECT report_id FROM invoice_reports WHERE report_id IS NOT NULL`)
            ]
          }
        });
      }

      // Combine all conditions with AND
      if (whereConditions.length > 0) {
        whereClause[Op.and] = whereConditions;
      }

      // Debug logging
      console.log('=== BACKEND REPORTS QUERY DEBUG ===');
      console.log('Query parameters:', req.query);
      console.log('Where conditions array length:', whereConditions.length);
      console.log('Where conditions:', JSON.stringify(whereConditions, null, 2));
      console.log('Final where clause:', JSON.stringify(whereClause, null, 2));

      // First, let's check what statuses exist in the database for current month
      if (req.query.startDate && req.query.endDate) {
        const startDate = new Date(req.query.startDate);
        const endDate = new Date(req.query.endDate + 'T23:59:59');

        // Check pending reports in date range
        const pendingInRange = await Report.findAll({
          where: {
            [Op.or]: [
              { inspection_date: { [Op.between]: [startDate, endDate] } },
              {
                [Op.and]: [
                  { inspection_date: { [Op.is]: null } },
                  { created_at: { [Op.between]: [startDate, endDate] } }
                ]
              },
              { created_at: { [Op.between]: [startDate, endDate] } }
            ],
            [Op.or]: [
              { status: 'قيد الانتظار' },
              { status: 'pending' },
              { status: 'active' },
              { status: null }
            ]
          },
          attributes: ['id', 'status', 'inspection_date', 'created_at'],
          raw: true
        });
        console.log(`Pending reports in date range (${req.query.startDate} to ${req.query.endDate}):`, pendingInRange.length);
        if (pendingInRange.length > 0) {
          console.log('Sample pending reports:', pendingInRange.slice(0, 5));
        }
      }

      // Check all unique statuses in database
      const allStatuses = await Report.findAll({
        attributes: ['status'],
        group: ['status'],
        raw: true
      });
      console.log('All unique statuses in database:', allStatuses.map(s => s.status || 'NULL'));

      // Log the where clause structure before query
      console.log('=== BEFORE QUERY ===');
      console.log('Where clause structure:', JSON.stringify(whereClause, null, 2));
      console.log('Where clause keys:', Object.keys(whereClause));

      const reports = await Report.findAll({
        where: whereClause,
        attributes: REPORT_BASE_ATTRIBUTES, // Explicitly exclude cpu, gpu, ram, storage until migration runs
        include: [
          {
            model: Client,
            as: 'client',
            attributes: ['id', 'name', 'phone', 'email'],
          },
          {
            model: Invoice,
            as: 'relatedInvoices',
            through: { attributes: [] }, // Don't include junction table attributes
            attributes: ['id', 'total', 'paymentStatus'],
            required: false // Left join to include reports without invoices
          }
        ],
        order: [['created_at', 'DESC']],
        logging: (sql) => {
          console.log('=== SQL QUERY ===');
          console.log(sql);
          console.log('=== END SQL QUERY ===');
        }
      });

      // Debug: Status breakdown
      const statusBreakdown = {};
      reports.forEach(report => {
        const status = report.status || 'undefined';
        statusBreakdown[status] = (statusBreakdown[status] || 0) + 1;
      });
      console.log(`Found ${reports.length} reports`);
      console.log('Status breakdown:', statusBreakdown);

      // Debug: Show pending reports
      const pendingReports = reports.filter(r => {
        const status = r.status;
        return status === 'pending' ||
          status === 'قيد الانتظار' ||
          status === 'active' ||
          status === null ||
          status === undefined ||
          status === '';
      });
      console.log('Pending reports in result:', pendingReports.length);
      console.log('All statuses in result:', [...new Set(reports.map(r => r.status))]);
      if (pendingReports.length > 0) {
        console.log('Sample pending reports:', pendingReports.slice(0, 5).map(r => ({
          id: r.id,
          status: r.status,
          inspection_date: r.inspection_date,
          created_at: r.created_at,
          order_number: r.order_number,
          hasInspectionDate: !!r.inspection_date,
          inspectionDateInRange: r.inspection_date ? checkDateInRange(r.inspection_date, req.query.startDate, req.query.endDate) : 'N/A',
          createdDateInRange: r.created_at ? checkDateInRange(r.created_at, req.query.startDate, req.query.endDate) : 'N/A'
        })));
      } else {
        console.log('⚠️ NO PENDING REPORTS IN RESULT!');
        // Check if there are pending reports in DB for this month
        if (req.query.startDate && req.query.endDate) {
          const startDate = new Date(req.query.startDate);
          const endDate = new Date(req.query.endDate + 'T23:59:59');

          const allPendingThisMonth = await Report.findAll({
            where: {
              [Op.or]: [
                { status: 'قيد الانتظار' },
                { status: 'pending' },
                { status: 'active' },
                { status: null }
              ]
            },
            attributes: ['id', 'status', 'inspection_date', 'created_at'],
            raw: true
          });

          const pendingInMonth = allPendingThisMonth.filter(r => {
            const inspDate = r.inspection_date ? new Date(r.inspection_date) : null;
            const crDate = r.created_at ? new Date(r.created_at) : null;
            const dateToCheck = inspDate || crDate;
            if (!dateToCheck) return false;
            return dateToCheck >= startDate && dateToCheck <= endDate;
          });

          console.log(`Total pending reports in DB: ${allPendingThisMonth.length}`);
          console.log(`Pending reports in current month range: ${pendingInMonth.length}`);
          if (pendingInMonth.length > 0) {
            console.log('Pending reports that should be included:', pendingInMonth.slice(0, 5));
          }
        }
      }

      // Helper function to check if date is in range
      function checkDateInRange(dateStr, startStr, endStr) {
        if (!dateStr) return false;
        const date = new Date(dateStr);
        if (startStr) {
          const start = new Date(startStr);
          if (date < start) return false;
        }
        if (endStr) {
          const end = new Date(endStr + 'T23:59:59');
          if (date > end) return false;
        }
        return true;
      }

      // Debug: Show date information for first few reports
      console.log('Sample reports with dates:', reports.slice(0, 5).map(r => ({
        id: r.id,
        status: r.status,
        inspection_date: r.inspection_date,
        created_at: r.created_at
      })));
      console.log('=== END BACKEND REPORTS QUERY DEBUG ===');

      res.json(reports);
    } catch (error) {
      console.error('Failed to fetch all reports:', error);

      // Check if error is related to missing columns (migration not run)
      if (error.message && (
        error.message.includes("Unknown column 'cpu'") ||
        error.message.includes("Unknown column 'gpu'") ||
        error.message.includes("Unknown column 'ram'") ||
        error.message.includes("Unknown column 'storage'")
      )) {
        console.error('Database migration not run. Please restart the server to run migrations.');
        res.status(500).json({
          error: 'Database schema mismatch',
          details: 'The database columns for CPU, GPU, RAM, and Storage do not exist. Please restart the server to run the migration.',
          migration_required: true
        });
        return;
      }

      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  }
});

// GET /reports/me - get reports for the authenticated client (JWT only)
// Supports filtering, pagination, and sorting
// IMPORTANT: This route must come BEFORE /:id to avoid route conflicts
router.get('/me', auth, async (req, res) => {
  try {
    // Extract client_id from JWT token
    // The auth middleware sets req.user, which contains the decoded token
    const userId = req.user.id;
    const userType = req.user.type || (req.user.isClient ? 'client' : 'admin');

    // Only clients can use this endpoint to get their own reports
    if (userType !== 'client') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. This endpoint is for clients only.'
      });
    }

    const clientId = userId;
    if (!clientId) {
      console.error('Client ID not found in token after auth middleware');
      return res.status(401).json({
        success: false,
        message: 'Authentication error: Client ID missing.'
      });
    }

    console.log(`Fetching reports for authenticated client ID: ${clientId}`);

    // Build where clause
    const whereClause = { client_id: clientId };

    // Handle status filter
    if (req.query.status) {
      whereClause.status = req.query.status;
    }

    // Handle device model filter
    if (req.query.deviceModel) {
      whereClause.device_model = { [Op.like]: `%${req.query.deviceModel}%` };
    }

    // Handle date range filters
    if (req.query.startDate || req.query.endDate) {
      const dateCondition = {};
      if (req.query.startDate) {
        dateCondition[Op.gte] = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        const endDate = new Date(req.query.endDate);
        // Ensure end date includes the full day
        if (!req.query.endDate.includes('T')) {
          endDate.setHours(23, 59, 59, 999);
        }
        dateCondition[Op.lte] = endDate;
      }
      whereClause.inspection_date = dateCondition;
    }

    // Handle pagination
    const limit = Math.min(parseInt(req.query.limit) || 50, 100); // Default 50, max 100
    const offset = parseInt(req.query.offset) || 0;

    // Handle sorting
    const sortBy = req.query.sortBy || 'created_at';
    const sortOrder = (req.query.sortOrder || 'DESC').toUpperCase();
    const validSortFields = ['created_at', 'inspection_date', 'status', 'device_model'];
    const validSortOrder = ['ASC', 'DESC'];

    const finalSortBy = validSortFields.includes(sortBy) ? sortBy : 'created_at';
    const finalSortOrder = validSortOrder.includes(sortOrder) ? sortOrder : 'DESC';

    // Get total count for pagination
    const total = await Report.count({ where: whereClause });

    // Fetch reports
    const reports = await Report.findAll({
      where: whereClause,
      attributes: REPORT_BASE_ATTRIBUTES, // Explicitly exclude cpu, gpu, ram, storage until migration runs
      include: [
        {
          model: Client,
          as: 'client',
          attributes: ['id', 'name', 'phone', 'email', 'address'],
        },
        {
          model: Invoice,
          as: 'relatedInvoices',
          through: { attributes: [] },
          attributes: ['id', 'total', 'paymentStatus'],
          required: false
        }
      ],
      order: [[finalSortBy, finalSortOrder]],
      limit: limit,
      offset: offset,
    });

    // Format response to match recommendation
    const formattedReports = reports.map(report => {
      const reportData = report.toJSON ? report.toJSON() : report;
      return {
        id: reportData.id,
        device_model: reportData.device_model,
        serial_number: reportData.serial_number,
        cpu: reportData.cpu || null,
        gpu: reportData.gpu || null,
        ram: reportData.ram || null,
        storage: reportData.storage || null,
        inspection_date: reportData.inspection_date,
        hardware_status: reportData.hardware_status,
        external_images: reportData.external_images,
        notes: reportData.notes,
        status: reportData.status,
        billing_enabled: reportData.billing_enabled,
        amount: reportData.amount ? reportData.amount.toString() : '0.00',
        invoice_created: reportData.invoice_created || (reportData.relatedInvoices && reportData.relatedInvoices.length > 0),
        invoice_id: reportData.invoice_id || (reportData.relatedInvoices && reportData.relatedInvoices.length > 0 ? reportData.relatedInvoices[0].id : null),
        created_at: reportData.created_at
      };
    });

    const hasMore = offset + limit < total;

    console.log(`Found ${reports.length} reports for client ID ${clientId} (total: ${total})`);

    res.json({
      success: true,
      reports: formattedReports,
      pagination: {
        total: total,
        limit: limit,
        offset: offset,
        hasMore: hasMore
      }
    });

  } catch (error) {
    console.error('Failed to fetch reports for authenticated client:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// GET /reports/:id - get report by ID
router.get('/:id', async (req, res) => {
  try {
    console.log(`Fetching report with ID: ${req.params.id}`);
    const report = await Report.findByPk(req.params.id, {
      attributes: REPORT_BASE_ATTRIBUTES, // Explicitly exclude cpu, gpu, ram, storage until migration runs
      include: [
        {
          model: Client,
          as: 'client',
          attributes: ['id', 'name', 'phone', 'email', 'address'],
        },
        {
          model: Invoice,
          as: 'relatedInvoices',
          through: { attributes: [] }, // Don't include junction table attributes
          attributes: ['id', 'total', 'paymentStatus', 'paymentMethod', 'date'],
          required: false // Left join to include reports without invoices
        }
      ],
    });
    if (!report) {
      console.log(`Report with ID ${req.params.id} not found`);
      return res.status(404).json({ error: 'Report not found' });
    }
    console.log(`Found report: ${report.id}`);
    console.log(`Report has ${report.relatedInvoices ? report.relatedInvoices.length : 0} linked invoices`);

    // Ensure relatedInvoices is properly serialized
    const reportData = report.toJSON ? report.toJSON() : report;
    console.log('Report data keys:', Object.keys(reportData));
    console.log('Report data relatedInvoices:', reportData.relatedInvoices);

    res.json({ success: true, report: reportData });
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
      attributes: REPORT_BASE_ATTRIBUTES, // Explicitly exclude cpu, gpu, ram, storage until migration runs
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
        const reportData = { ...req.body };

        // LOG DEVICE SPECS TO DEBUG
        console.log('========== DEVICE SPECS DEBUG ==========');
        console.log('Received device specs in request:');
        console.log('  cpu:', req.body.cpu);
        console.log('  gpu:', req.body.gpu);
        console.log('  ram:', req.body.ram);
        console.log('  storage:', req.body.storage);
        console.log('========================================');

        // Remove device spec fields if columns don't exist yet (migration not run)
        // This prevents errors when creating reports before migration runs
        const deviceSpecFields = ['cpu', 'gpu', 'ram', 'storage'];
        const hasDeviceSpecColumns = await checkDeviceSpecColumnsExist();

        if (!hasDeviceSpecColumns) {
          console.warn('Device spec columns (cpu, gpu, ram, storage) do not exist. Migration may not have run yet. Omitting these fields.');
          deviceSpecFields.forEach(field => {
            delete reportData[field];
          });
        } else {
          console.log('Device spec columns exist in database. Including specs in report creation.');
        }

        // Log the data being used to create the report
        console.log('Creating report with direct schema:', reportData);

        const newReport = await Report.create(reportData);
        console.log('Report created successfully:', newReport.id);
        res.status(201).json(newReport);
      } catch (error) {
        console.error('Failed to create report with direct schema:', error.message);
        console.error('Error stack:', error.stack);

        // Check if error is about missing columns
        if (error.message && (
          error.message.includes("Unknown column 'cpu'") ||
          error.message.includes("Unknown column 'gpu'") ||
          error.message.includes("Unknown column 'ram'") ||
          error.message.includes("Unknown column 'storage'")
        )) {
          console.error('Database migration not run. Please restart the server to run migrations.');
          return res.status(500).json({
            error: 'Database schema mismatch',
            details: 'The database columns for CPU, GPU, RAM, and Storage do not exist. Please restart the server to run the migration.',
            migration_required: true
          });
        }

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

    const report = await Report.findByPk(req.params.id, {
      attributes: REPORT_BASE_ATTRIBUTES // Explicitly exclude cpu, gpu, ram, storage until migration runs
    });
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Convert Arabic status values to English before processing (ENUM only allows: completed, pending, shipped, cancelled)
    if (req.body.status !== undefined) {
      const statusMap = {
        'مكتمل': 'completed',
        'قيد الانتظار': 'pending',
        'ملغي': 'cancelled',
        'ملغى': 'cancelled',
        'قيد المعالجة': 'pending',
        'completed': 'completed',
        'pending': 'pending',
        'cancelled': 'cancelled',
        'canceled': 'cancelled',
        'shipped': 'shipped',
        'active': 'pending', // Map 'active' to 'pending'
        'in-progress': 'pending' // Map 'in-progress' to 'pending'
      };

      const originalStatus = req.body.status;
      const englishStatus = statusMap[originalStatus];

      if (englishStatus) {
        if (englishStatus !== originalStatus) {
          console.log(`Converting status from '${originalStatus}' to '${englishStatus}'`);
        }
        req.body.status = englishStatus;
      } else {
        console.warn(`Unknown status value '${originalStatus}', keeping as is`);
      }
    }

    // Update all fields that can be updated
    // Base fields (always available)
    const baseUpdateFields = [
      'client_id', 'client_name', 'client_phone', 'client_email', 'client_address',
      'order_number', 'device_model', 'serial_number',
      'inspection_date', 'hardware_status', 'external_images', 'notes', 'billing_enabled', 'amount', 'status'
    ];

    // New device spec fields (may not exist until migration runs)
    const deviceSpecFields = ['cpu', 'gpu', 'ram', 'storage'];

    // First, update base fields
    baseUpdateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        report[field] = req.body[field];
      }
    });

    // Check if device spec columns exist in database before trying to update them
    const hasDeviceSpecColumns = await checkDeviceSpecColumnsExist();

    // Then, conditionally update device spec fields only if columns exist
    if (hasDeviceSpecColumns) {
      deviceSpecFields.forEach(field => {
        if (req.body[field] !== undefined) {
          report[field] = req.body[field];
        }
      });
    } else {
      // Columns don't exist - log warning but don't fail
      // Don't set these fields on the report object at all
      deviceSpecFields.forEach(field => {
        if (req.body[field] !== undefined) {
          console.warn(`Field ${field} received but column does not exist in database. Migration may not have run yet. Skipping this field.`);
        }
      });
    }

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

    const oldStatus = report.status;

    // Build update object with only fields that should be updated
    const updateData = {};
    baseUpdateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = report[field]; // Use the value we already set
      }
    });

    // Only include device spec fields if columns exist
    if (hasDeviceSpecColumns) {
      deviceSpecFields.forEach(field => {
        if (req.body[field] !== undefined) {
          updateData[field] = report[field]; // Use the value we already set
        }
      });
    }

    // Use update() with explicit fields to avoid trying to update non-existent columns
    try {
      await report.update(updateData, {
        fields: Object.keys(updateData) // Only update the fields we specify
      });
    } catch (saveError) {
      // Check if error is about missing columns
      if (saveError.message && (
        saveError.message.includes("Unknown column 'cpu'") ||
        saveError.message.includes("Unknown column 'gpu'") ||
        saveError.message.includes("Unknown column 'ram'") ||
        saveError.message.includes("Unknown column 'storage'")
      )) {
        console.error('Database migration not run. Please restart the server to run migrations.');
        return res.status(500).json({
          error: 'Database schema mismatch',
          details: 'The database columns for CPU, GPU, RAM, and Storage do not exist. Please restart the server to run the migration, or run: node backend/scripts/database/run-migration-016.js',
          migration_required: true
        });
      }
      // Check if error is about invalid ENUM value for status
      if (saveError.message && (
        saveError.message.includes("status") && (
          saveError.message.includes("ENUM") ||
          saveError.message.includes("not valid") ||
          saveError.message.includes("does not exist")
        )
      )) {
        console.error('Invalid status value:', saveError.message);
        console.error('Attempted status value:', updateData.status);
        return res.status(400).json({
          error: 'Invalid status value',
          details: `The status value '${updateData.status}' is not valid. Allowed values are: completed, pending, shipped, cancelled`,
          attempted_value: updateData.status
        });
      }
      throw saveError;
    }

    console.log(`Report ${req.params.id} updated successfully`);

    // Sync invoice status if report status changed to completed or cancelled
    // Note: req.body.status is already converted to English at this point
    if (req.body.status && req.body.status !== oldStatus) {
      try {
        const newStatus = req.body.status; // This is already in English format
        console.log(`Report status changed from '${oldStatus}' to '${newStatus}', syncing invoices...`);

        // Map English report status to invoice payment status
        let invoicePaymentStatus = null;
        if (newStatus === 'completed') {
          invoicePaymentStatus = 'completed';
        } else if (newStatus === 'cancelled') {
          invoicePaymentStatus = 'cancelled';
        } else if (newStatus === 'pending' || newStatus === 'shipped') {
          invoicePaymentStatus = 'pending';
        }

        if (invoicePaymentStatus) {
          // Find all invoices linked to this report through InvoiceItem
          const { InvoiceItem, Invoice } = require('../models');

          // Find invoice items for this report
          const invoiceItems = await InvoiceItem.findAll({
            where: { report_id: report.id },
            attributes: ['invoiceId']
          });

          // Get unique invoice IDs
          const invoiceIds = [...new Set(invoiceItems.map(item => item.invoiceId).filter(id => id))];

          console.log(`Found ${invoiceIds.length} unique invoice(s) linked to report ${report.id}`);

          if (invoiceIds.length > 0) {
            // Find all invoices
            const invoices = await Invoice.findAll({
              where: { id: { [Op.in]: invoiceIds } },
              attributes: ['id', 'paymentStatus']
            });

            // Update each linked invoice
            let updatedCount = 0;
            for (const invoice of invoices) {
              if (invoice.paymentStatus !== invoicePaymentStatus) {
                console.log(`Updating invoice ${invoice.id} paymentStatus from '${invoice.paymentStatus}' to '${invoicePaymentStatus}'`);
                await invoice.update({ paymentStatus: invoicePaymentStatus });
                updatedCount++;
              } else {
                console.log(`Invoice ${invoice.id} already has status '${invoice.paymentStatus}', skipping`);
              }
            }

            console.log(`Synchronized ${updatedCount} invoice(s) to status '${invoicePaymentStatus}'`);
          }
        }
      } catch (syncError) {
        console.error('Error syncing invoice status (non-fatal):', syncError);
        // Don't fail the report update if invoice sync fails
      }
    }

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

// GET /reports/search?q=term - search reports by client name, order number, device model, or phone number
router.get('/search', async (req, res) => {
  const { q } = req.query;
  if (!q) {
    return res.status(400).json({ error: 'Query parameter "q" is required' });
  }

  try {
    console.log(`Searching reports with query: ${q}`);

    // Build the search query
    let whereClause = {
      [Op.or]: [
        { client_name: { [Op.like]: `%${q}%` } },
        { order_number: { [Op.like]: `%${q}%` } },
        { device_model: { [Op.like]: `%${q}%` } },
        { serial_number: { [Op.like]: `%${q}%` } }
      ],
    };

    // If client_id is provided in headers (for API key authentication)
    const clientId = req.headers['x-client-id'];
    if (clientId) {
      whereClause.client_id = clientId;
      console.log(`Filtering by client ID: ${clientId}`);
    }

    const reports = await Report.findAll({
      where: whereClause,
      attributes: REPORT_BASE_ATTRIBUTES, // Explicitly exclude cpu, gpu, ram, storage until migration runs
      include: {
        model: Client,
        attributes: ['id', 'name', 'phone', 'email'],
        where: {
          [Op.or]: [
            { phone: { [Op.like]: `%${q}%` } },
            { name: { [Op.like]: `%${q}%` } },
            { email: { [Op.like]: `%${q}%` } }
          ]
        },
        required: false // Left join to include reports even if client search doesn't match
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

// GET /reports/insights/device-models - get device models sold in a specific time period
router.get('/insights/device-models', auth, async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;

    let startDateObj, endDateObj;

    // If date range is provided, use it
    if (startDate && endDate) {
      startDateObj = new Date(startDate);
      endDateObj = new Date(endDate);
      // Set end date to end of day
      endDateObj.setHours(23, 59, 59, 999);
    } else {
      // Default to current month
      const currentDate = new Date();
      startDateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      endDateObj = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      endDateObj.setHours(23, 59, 59, 999);
    }

    // Build where clause
    const whereClause = {
      created_at: {
        [Op.between]: [startDateObj, endDateObj]
      }
    };

    // Add status filter if provided
    if (status) {
      whereClause.status = status;
    }

    const deviceModels = await Report.findAll({
      where: whereClause,
      attributes: [
        'device_model',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('MIN', sequelize.col('created_at')), 'first_sale'],
        [sequelize.fn('MAX', sequelize.col('created_at')), 'last_sale']
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

// GET /reports/dashboard/today-summary - get today's summary statistics
router.get('/dashboard/today-summary', auth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Get today's statistics
    const [
      reportsToday,
      reportsYesterday,
      invoicesToday,
      invoicesYesterday,
      completedToday,
      completedYesterday,
      pendingCount
    ] = await Promise.all([
      // Reports today (created/inspected today)
      Report.count({
        where: {
          inspection_date: {
            [Op.between]: [today, tomorrow]
          }
        }
      }),
      // Reports yesterday
      Report.count({
        where: {
          inspection_date: {
            [Op.between]: [yesterday, today]
          }
        }
      }),
      // Invoices today (using Invoice model)
      Invoice.count({
        where: {
          date: {
            [Op.between]: [today, tomorrow]
          }
        }
      }),
      // Invoices yesterday
      Invoice.count({
        where: {
          date: {
            [Op.between]: [yesterday, today]
          }
        }
      }),
      // Completed reports today (completed status changed today)
      Report.count({
        where: {
          status: 'completed',
          updated_at: {
            [Op.between]: [today, tomorrow]
          }
        }
      }),
      // Completed reports yesterday
      Report.count({
        where: {
          status: 'completed',
          updated_at: {
            [Op.between]: [yesterday, today]
          }
        }
      }),
      // Pending reports count
      Report.count({
        where: {
          status: 'pending'
        }
      })
    ]);

    res.json({
      reports: {
        today: reportsToday,
        yesterday: reportsYesterday,
        trend: reportsToday - reportsYesterday
      },
      invoices: {
        today: invoicesToday,
        yesterday: invoicesYesterday,
        trend: invoicesToday - invoicesYesterday
      },
      completed: {
        today: completedToday,
        yesterday: completedYesterday,
        trend: completedToday - completedYesterday
      },
      pending: pendingCount
    });
  } catch (error) {
    console.error('Error getting today summary:', error);
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
      attributes: REPORT_BASE_ATTRIBUTES, // Explicitly exclude cpu, gpu, ram, storage until migration runs
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

      // Calculate maintenance warranty end dates (6 months and 12 months)
      const maintenance6MonthsEnd = new Date(inspectionDate);
      maintenance6MonthsEnd.setMonth(maintenance6MonthsEnd.getMonth() + 6);

      const maintenance12MonthsEnd = new Date(inspectionDate);
      maintenance12MonthsEnd.setFullYear(maintenance12MonthsEnd.getFullYear() + 1);

      // Check if maintenance warranty is ending within 7 days
      const maintenanceWarranties = [
        { type: 'maintenance_6months', endDate: maintenance6MonthsEnd, days: 180 },
        { type: 'maintenance_12months', endDate: maintenance12MonthsEnd, days: 365 }
      ];

      maintenanceWarranties.forEach(warranty => {
        if (warranty.endDate >= currentDate && warranty.endDate <= sevenDaysFromNow) {
          const daysRemaining = Math.ceil((warranty.endDate - currentDate) / (1000 * 60 * 60 * 24));

          // Check if alert was sent
          const alertKey = warranty.type === 'maintenance_12months' ? 'annual' : 'six_month';
          const sentDate = report.warranty_alerts_log ? report.warranty_alerts_log[alertKey] : null;

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
            report_id: report.id,
            sent_at: sentDate,
            is_sent: !!sentDate
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

// POST /reports/:id/send-warranty-reminder - manually send warranty reminder
router.post('/:id/send-warranty-reminder', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { warranty_type, message: customMessage } = req.body; // 'maintenance_6months' or 'maintenance_12months'

    console.log(`[WarrantyReminder] Processing request for report ${id}, type: ${warranty_type}`);

    if (!warranty_type || !['maintenance_6months', 'maintenance_12months'].includes(warranty_type)) {
      return res.status(400).json({ message: 'Invalid warranty_type. Must be maintenance_6months or maintenance_12months' });
    }

    const report = await Report.findByPk(id, {
      include: [{
        model: Client,
        as: 'client',
        attributes: ['id', 'name', 'phone']
      }]
    });

    if (!report) {
      console.error(`[WarrantyReminder] Report ${id} not found`);
      return res.status(404).json({ message: 'Report not found' });
    }

    const phone = report.client_phone || report.client?.phone;
    if (!phone) {
      console.error(`[WarrantyReminder] No phone number for report ${id}`);
      return res.status(400).json({ message: 'No phone number found for this client' });
    }

    let finalMessage = customMessage;

    if (!finalMessage) {
      // Calculate warranty end date
      const inspectionDate = new Date(report.inspection_date);
      let warrantyEndDate;
      let wTypeArabic;

      if (warranty_type === 'maintenance_6months') {
        warrantyEndDate = new Date(inspectionDate);
        warrantyEndDate.setMonth(warrantyEndDate.getMonth() + 6);
        wTypeArabic = 'صيانة كل 6 أشهر';
      } else {
        warrantyEndDate = new Date(inspectionDate);
        warrantyEndDate.setFullYear(warrantyEndDate.getFullYear() + 1);
        wTypeArabic = 'صيانة سنوية';
      }

      // Prepare default message
      finalMessage = `🛠️ *تذكير بالصيانة الدورية*\n\n` +
        `أهلاً ${report.client_name || 'عميلنا العزيز'}،\n\n` +
        `نود تذكيركم بموعد *${wTypeArabic}* لجهازكم (*${report.device_model}*) في تاريخ *${warrantyEndDate.toISOString().split('T')[0]}*.\n\n` +
        `الصيانة الدورية تضمن بقاء جهازك في حالة ممتازة وتطيل عمره الافتراضي. يرجى التواصل معنا لترتيب الموعد.\n\n` +
        `_مع تحيات فريق عمل لابك_`;
    }

    console.log(`[WarrantyReminder] Sending message to ${phone}`);

    // Send message
    const notifier = require('../utils/notifier');
    const result = await notifier.sendText(phone, finalMessage);

    console.log(`[WarrantyReminder] Notification result:`, JSON.stringify(result));

    // Update warranty_alerts_log
    const alertKey = warranty_type === 'maintenance_12months' ? 'annual' : 'six_month';
    const alertsLog = report.warranty_alerts_log || {};
    alertsLog[alertKey] = new Date().toISOString();

    await report.update({ warranty_alerts_log: alertsLog });

    res.json({
      message: 'Warranty reminder sent successfully',
      sent_to: phone,
      sent_at: alertsLog[alertKey]
    });

  } catch (error) {
    console.error('Error sending warranty reminder:', error);
    res.status(500).json({
      message: 'Failed to send reminder',
      error: error.message,
      details: error.response?.data || null
    });
  }
});

module.exports = router;
