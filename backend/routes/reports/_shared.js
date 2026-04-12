const { Sequelize, Op } = require('sequelize');
const { Report, Client, ReportTechnicalTest, Invoice, InvoiceReport, InvoiceItem, Setting } = require('../../models');
const { auth, clientAuth, adminAuth } = require('../../middleware/auth');
const { sequelize } = require('../../config/db');
const Notifier = require('../../utils/notifier');

// Base attributes for Report queries
const REPORT_BASE_ATTRIBUTES = [
  'id', 'client_id', 'client_name', 'client_phone', 'client_email', 'client_address',
  'order_number', 'device_brand', 'device_model', 'serial_number', 'cpu', 'gpu', 'ram', 'storage',
  'inspection_date', 'hardware_status', 'external_images', 'invoice_items', 'notes', 'billing_enabled', 'amount', 'device_price',
  'invoice_created', 'invoice_id', 'invoice_date', 'status', 'admin_id', 'tracking_code', 'tracking_method',
  'created_at', 'updated_at', 'warranty_alerts_log', 'is_confirmed', 'selected_accessories', 'payment_method', 'supplier_id', 'update_history'
];

/**
 * Check if device spec columns exist in the database
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
    return results.length === 4;
  } catch (error) {
    console.error('Error checking device spec columns:', error);
    return false;
  }
}

/**
 * Helper to get most frequent values for a report column
 */
async function getFrequentValues(column, limit = 10) {
  try {
    const results = await Report.findAll({
      attributes: [
        [column, 'value'],
        [sequelize.fn('COUNT', sequelize.col(column)), 'count']
      ],
      where: {
        [column]: { [Op.ne]: null, [Op.ne]: '' }
      },
      group: [column],
      order: [[sequelize.fn('COUNT', sequelize.col(column)), 'DESC']],
      limit: limit,
      raw: true
    });
    return results;
  } catch (error) {
    console.error(`Error fetching frequent values for ${column}:`, error);
    return [];
  }
}

module.exports = {
  Sequelize,
  Op,
  Report,
  Client,
  ReportTechnicalTest,
  Invoice,
  InvoiceReport,
  InvoiceItem,
  Setting,
  auth,
  clientAuth,
  adminAuth,
  sequelize,
  Notifier,
  REPORT_BASE_ATTRIBUTES,
  checkDeviceSpecColumnsExist,
  getFrequentValues
};
