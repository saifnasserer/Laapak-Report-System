/**
 * Laapak Report System - Models Index
 * Exports all models and initializes database relationships
 */

const { sequelize } = require('../config/db');
const Admin = require('./Admin');
const Client = require('./Client');
const Report = require('./Report');
// Removed ReportTechnicalTest
const Invoice = require('./Invoice');
const InvoiceItem = require('./InvoiceItem');

// Define relationships between models

// Client relationships - removed direct relationship to Report
Client.hasMany(Invoice, { foreignKey: 'client_id' });

// Report relationships
Report.belongsTo(Client, { foreignKey: 'client_id' });
Report.belongsTo(Admin, { foreignKey: 'admin_id', as: 'technician' });
Report.hasOne(Invoice, { foreignKey: 'report_id' });

// Invoice relationships
Invoice.belongsTo(Report, { foreignKey: 'report_id' });
Invoice.belongsTo(Client, { foreignKey: 'client_id' });
Invoice.hasMany(InvoiceItem, { foreignKey: 'invoice_id', onDelete: 'CASCADE' });

// Invoice Item relationships
InvoiceItem.belongsTo(Invoice, { foreignKey: 'invoice_id' });

// Removed Technical Test relationships

// Export models
module.exports = {
    sequelize,
    Admin,
    Client,
    Report,
    // ReportTechnicalTest removed,
    Invoice,
    InvoiceItem
};
