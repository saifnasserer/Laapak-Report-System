const express = require('express');
const router = express.Router();

// Import sub-routers
const crudRoutes = require('./reports/crud');
const clientRoutes = require('./reports/client');
const insightsRoutes = require('./reports/insights');
const warrantyRoutes = require('./reports/warranty');
const notificationRoutes = require('./reports/notifications');

/**
 * MOUNT SUB-ROUTERS
 * 
 * IMPORTANT: Mount order is critical in Express.
 * Specific paths (like /search, /stats, /me) MUST be mounted BEFORE
 * generic path parameters (like /:id) to avoid being incorrectly matched.
 */

// 1. Analytics & Search (/stats/*, /count, /search, /insights/*, /dashboard/*)
router.use('/', insightsRoutes);

// 2. Client-Specific Routes (/me, /client/me, /:id/confirm)
router.use('/', clientRoutes);

// 3. Warranty Alerts (/insights/warranty-alerts, /:id/send-warranty-reminder)
router.use('/', warrantyRoutes);

// 4. WhatsApp Notifications (/:id/share/whatsapp)
router.use('/', notificationRoutes);

// 5. Core CRUD (/, /:id) - Must be last because /:id matches almost anything
router.use('/', crudRoutes);

module.exports = router;
