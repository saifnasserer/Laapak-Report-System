const express = require('express');
const router = express.Router();
const { Report, Client, Invoice } = require('../models');
const { auth, adminAuth } = require('../middleware/auth');
const { Op, fn, col, literal } = require('sequelize');

/**
 * Helper to calculate percentage change
 */
const calculateTrend = (current, previous) => {
    if (!previous || previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
};

/**
 * Normalizes model names to group variations (e.g. EliteBook 840 vs 840)
 */
const normalizeModelName = (brand, model) => {
    if (!model) return 'Unknown';
    let normalized = model.toLowerCase();
    const brandLower = brand?.toLowerCase() || '';

    // Remove brand from model if included
    if (brandLower && normalized.startsWith(brandLower)) {
        normalized = normalized.replace(brandLower, '').trim();
    }

    // List of series names to strip
    const seriesKeywords = [
        'elitebook', 'probook', 'zbook', 'latitude', 'precision', 'vostro', 'inspiron',
        'thinkpad', 'ideapad', 'yoga', 'xps', 'macbook', 'pavilion', 'envy', 'victus', 'omen'
    ];

    seriesKeywords.forEach(k => {
        normalized = normalized.replace(k, '').trim();
    });

    // Remove common generation markings or "g" suffix (e.g. 840 g3 -> 840)
    normalized = normalized.replace(/\s+g\d+.*$/, '').trim();

    return normalized.toUpperCase() || 'Other';
};

/**
 * GET /api/analysis/dashboard
 * Get operational analysis data: reports, device sales, and productivity
 * Access: Superadmin only
 */
router.get('/dashboard', adminAuth, async (req, res) => {
    try {
        const { startDate, endDate, month, year } = req.query;

        // Date range handling
        let startDateObj, endDateObj, prevStartDateObj, prevEndDateObj;
        const currentDate = new Date();

        if (startDate && endDate) {
            startDateObj = new Date(startDate);
            endDateObj = new Date(endDate);
            // Previous period same duration
            const duration = endDateObj.getTime() - startDateObj.getTime();
            prevStartDateObj = new Date(startDateObj.getTime() - duration - 1);
            prevEndDateObj = new Date(startDateObj.getTime() - 1);
        } else if (month && year) {
            startDateObj = new Date(year, month - 1, 1);
            endDateObj = new Date(year, month, 0, 23, 59, 59);
            // Previous month
            prevStartDateObj = new Date(year, month - 2, 1);
            prevEndDateObj = new Date(year, month - 1, 0, 23, 59, 59);
        } else {
            // Default to current month
            startDateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
            endDateObj = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59);
            // Previous month
            prevStartDateObj = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
            prevEndDateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0, 23, 59, 59);
        }

        const dateRange = { created_at: { [Op.between]: [startDateObj, endDateObj] } };
        const prevDateRange = { created_at: { [Op.between]: [prevStartDateObj, prevEndDateObj] } };

        // 1. KPI Metrics with Trends
        const getKpis = async (range) => {
            const completed = await Report.count({
                where: { ...range, status: { [Op.in]: ['مكتمل', 'completed'] } }
            });
            const cancelled = await Report.count({
                where: { ...range, status: { [Op.in]: ['ملغى', 'cancelled', 'canceled'] } }
            });
            const activeClients = await Report.count({
                distinct: true,
                col: 'client_id',
                where: range
            });
            const total = completed + cancelled;
            const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

            return { completed, cancelled, activeClients, total, rate };
        };

        const currentKpis = await getKpis(dateRange);
        const prevKpis = await getKpis(prevDateRange);

        // 2. Device Sales Analytics (All Models for Table)
        const rawDeviceSales = await Report.findAll({
            attributes: [
                'device_brand',
                'device_model',
                [fn('COUNT', col('id')), 'count']
            ],
            where: {
                ...dateRange,
                status: { [Op.in]: ['مكتمل', 'completed'] }
            },
            group: ['device_brand', 'device_model'],
            order: [[literal('count'), 'DESC']]
        });

        // Normalize and merge duplicates
        const mergedSalesMap = new Map();

        rawDeviceSales.forEach(item => {
            const brand = item.device_brand || 'Unknown';
            const rawModel = item.device_model || 'Unknown';
            const count = parseInt(item.get ? item.get('count') : item.count);

            const normalizedModel = normalizeModelName(brand, rawModel);
            const key = `${brand}:${normalizedModel}`;

            if (mergedSalesMap.has(key)) {
                const existing = mergedSalesMap.get(key);
                existing.count += count;
            } else {
                mergedSalesMap.set(key, {
                    device_brand: brand,
                    device_model: normalizedModel,
                    count: count
                });
            }
        });

        const deviceSales = Array.from(mergedSalesMap.values())
            .sort((a, b) => b.count - a.count);

        // 3. Reports by Status Breakdown
        const statusBreakdown = await Report.findAll({
            attributes: [
                'status',
                [fn('COUNT', col('id')), 'count']
            ],
            where: dateRange,
            group: ['status']
        });

        // 4. Time-based Trends (Daily logic)
        const trendsRaw = await Report.findAll({
            attributes: [
                [fn('DATE', col('created_at')), 'date'],
                [fn('COUNT', literal("CASE WHEN status IN ('مكتمل', 'completed') THEN 1 END")), 'completed'],
                [fn('COUNT', literal("CASE WHEN status IN ('ملغى', 'cancelled', 'canceled') THEN 1 END")), 'cancelled']
            ],
            where: dateRange,
            group: [fn('DATE', col('created_at'))],
            order: [[fn('DATE', col('created_at')), 'ASC']]
        });

        // Fill Gaps in Trends
        const reportTrends = [];
        let curr = new Date(startDateObj);
        const end = new Date(endDateObj);

        while (curr <= end) {
            const dateStr = curr.toISOString().split('T')[0];
            const existing = trendsRaw.find(t => {
                const d = t.get ? t.get('date') : t.date;
                return d === dateStr;
            });

            reportTrends.push({
                date: dateStr,
                completed: existing ? parseInt(existing.get ? existing.get('completed') : existing.completed) : 0,
                cancelled: existing ? parseInt(existing.get ? existing.get('cancelled') : existing.cancelled) : 0
            });
            curr.setDate(curr.getDate() + 1);
        }

        // 5. Get Earliest Report Date (for default from-filter)
        const earliestReport = await Report.findOne({
            attributes: [[fn('MIN', col('created_at')), 'minDate']],
            raw: true
        });
        const firstReportDate = earliestReport?.minDate || currentDate;

        res.json({
            success: true,
            data: {
                kpis: {
                    completedReports: {
                        value: currentKpis.completed,
                        trend: calculateTrend(currentKpis.completed, prevKpis.completed)
                    },
                    cancelledReports: {
                        value: currentKpis.cancelled,
                        trend: calculateTrend(currentKpis.cancelled, prevKpis.cancelled)
                    },
                    devicesSold: {
                        value: currentKpis.completed, // 1 report = 1 device
                        trend: calculateTrend(currentKpis.completed, prevKpis.completed)
                    },
                    completionRate: {
                        value: currentKpis.rate,
                        trend: calculateTrend(currentKpis.rate, prevKpis.rate)
                    },
                    activeClientsCount: {
                        value: currentKpis.activeClients,
                        trend: calculateTrend(currentKpis.activeClients, prevKpis.activeClients)
                    },
                    totalReports: currentKpis.total
                },
                deviceSales,
                firstReportDate,
                dateRange: {
                    start: startDateObj,
                    end: endDateObj
                }
            }
        });

    } catch (error) {
        console.error('Analysis API CRITICAL Error:', error);
        console.error('Error Stack:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Internal server error during analysis data aggregation',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

module.exports = router;
