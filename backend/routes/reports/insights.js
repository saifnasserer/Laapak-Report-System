const express = require('express');
const router = express.Router();
const { 
  Report, Invoice, auth, Op, sequelize, 
  REPORT_BASE_ATTRIBUTES, getFrequentValues 
} = require('./_shared');

// GET /reports/stats/frequent-specs - Get the most frequent device specifications
router.get('/stats/frequent-specs', auth, async (req, res) => {
  try {
    const [cpu, gpu, ram, storage] = await Promise.all([
      getFrequentValues('cpu'),
      getFrequentValues('gpu'),
      getFrequentValues('ram'),
      getFrequentValues('storage')
    ]);

    res.json({
      cpu,
      gpu,
      ram,
      storage
    });
  } catch (error) {
    console.error('Error fetching frequent spec stats:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /reports/count - get count of reports
router.get('/count', auth, async (req, res) => {
  try {
    const { status, startDate, endDate, dateField } = req.query;

    let whereClause = {};

    if (status) {
      whereClause.status = status;
    }

    const dateFieldToUse = dateField || (status === 'completed' ? 'updated_at' : 'inspection_date');

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
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
      if (!endDate.includes('T') || endDate.endsWith('T00:00:00.000Z')) {
        end.setHours(23, 59, 59, 999);
      }
      whereClause[dateFieldToUse] = {
        [Op.lte]: end
      };
      console.log(`[COUNT] status=${status || 'all'}, dateField=${dateFieldToUse}, endDate=${end.toISOString()}`);
    }

    const count = await Report.count({ where: whereClause });
    res.json({ count });
  } catch (error) {
    console.error('Error counting reports:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /reports/search - search reports
router.get('/search', async (req, res) => {
  const { q } = req.query;
  if (!q) {
    return res.status(400).json({ error: 'Query parameter "q" is required' });
  }

  try {
    let whereClause = {
      [Op.or]: [
        { client_name: { [Op.like]: `%${q}%` } },
        { order_number: { [Op.like]: `%${q}%` } },
        { device_model: { [Op.like]: `%${q}%` } },
        { serial_number: { [Op.like]: `%${q}%` } }
      ],
    };

    const clientId = req.headers['x-client-id'];
    if (clientId) {
      whereClause.client_id = clientId;
    }

    const reports = await Report.findAll({
      where: whereClause,
      attributes: REPORT_BASE_ATTRIBUTES,
      include: {
        attributes: ['id', 'name', 'phone', 'email', 'address', 'orderCode'],
        where: {
          [Op.or]: [
            { phone: { [Op.like]: `%${q}%` } },
            { name: { [Op.like]: `%${q}%` } },
            { email: { [Op.like]: `%${q}%` } }
          ]
        },
        required: false
      },
      order: [['created_at', 'DESC']],
    });

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

    if (startDate && endDate) {
      startDateObj = new Date(startDate);
      endDateObj = new Date(endDate);
      endDateObj.setHours(23, 59, 59, 999);
    } else {
      const currentDate = new Date();
      startDateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      endDateObj = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      endDateObj.setHours(23, 59, 59, 999);
    }

    const whereClause = {
      created_at: {
        [Op.between]: [startDateObj, endDateObj]
      }
    };

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

    const [
      reportsToday,
      reportsYesterday,
      invoicesToday,
      invoicesYesterday,
      completedToday,
      completedYesterday,
      pendingCount
    ] = await Promise.all([
      Report.count({
        where: {
          inspection_date: {
            [Op.between]: [today, tomorrow]
          }
        }
      }),
      Report.count({
        where: {
          inspection_date: {
            [Op.between]: [yesterday, today]
          }
        }
      }),
      Invoice.count({
        where: {
          date: {
            [Op.between]: [today, tomorrow]
          }
        }
      }),
      Invoice.count({
        where: {
          date: {
            [Op.between]: [yesterday, today]
          }
        }
      }),
      Report.count({
        where: {
          status: 'completed',
          updated_at: {
            [Op.between]: [today, tomorrow]
          }
        }
      }),
      Report.count({
        where: {
          status: 'completed',
          updated_at: {
            [Op.between]: [yesterday, today]
          }
        }
      }),
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

module.exports = router;
