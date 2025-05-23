/**
 * Laapak Report System - Models Index
 * Exports all models and initializes database relationships
 */

const { sequelize } = require('../config/db');
const Admin = require('./Admin');
const Client = require('./Client');
const Report = require('./Report');
const ReportTechnicalTest = require('./ReportTechnicalTest');
const Invoice = require('./Invoice');
const InvoiceItem = require('./InvoiceItem');
const InvoiceReport = require('./invoicereport');

// Define relationships between models

// Client relationships - removed direct relationship to Report
Client.hasMany(Invoice, { foreignKey: 'client_id' });

// Report relationships
Report.belongsTo(Client, { foreignKey: 'client_id' });
Report.belongsTo(Admin, { foreignKey: 'admin_id', as: 'technician' });
// Report.hasOne(Invoice, { foreignKey: 'report_id' }); // Removed old one-to-one relationship
Report.hasMany(ReportTechnicalTest, { foreignKey: 'reportId', as: 'technical_tests' });
// Add many-to-many relationship through junction table
Report.belongsToMany(Invoice, { through: InvoiceReport, foreignKey: 'report_id', otherKey: 'invoice_id', as: 'invoices' });

// Invoice relationships
// Invoice.belongsTo(Report, { foreignKey: 'report_id' }); // Removed old one-to-one relationship
Invoice.belongsTo(Client, { foreignKey: 'client_id' });
Invoice.hasMany(InvoiceItem, { foreignKey: 'invoiceId', as: 'InvoiceItems', onDelete: 'CASCADE' });
// Add many-to-many relationship through junction table
Invoice.belongsToMany(Report, { through: InvoiceReport, foreignKey: 'invoice_id', otherKey: 'report_id', as: 'reports' });

// ReportTechnicalTest relationships
ReportTechnicalTest.belongsTo(Report, { foreignKey: 'reportId' });

// Invoice Item relationships
InvoiceItem.belongsTo(Invoice, { foreignKey: 'invoiceId' });

// Removed Technical Test relationships

// Export models
module.exports = {
    sequelize,
    Admin,
    Client,
    Report,
    ReportTechnicalTest,
    Invoice,
    InvoiceItem,
    InvoiceReport
};
