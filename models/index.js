/**
 * Laapak Report System - Models Index
 * Exports all models and initializes database relationships
 */

const { sequelize } = require('../config/db');
const Admin = require('./Admin');
const Client = require('./Client');
const Report = require('./Report');
const ReportTechnicalTest = require('./ReportTechnicalTest');
// ReportExternalInspection model is not used
const Invoice = require('./Invoice');
const InvoiceItem = require('./InvoiceItem');

// Define relationships between models

// Admin relationships
Admin.hasMany(Report, { foreignKey: 'technicianId' });

// Client relationships
Client.hasMany(Report, { foreignKey: 'clientId' });
Client.hasMany(Invoice, { foreignKey: 'clientId' });

// Report relationships
Report.belongsTo(Admin, { foreignKey: 'technicianId', as: 'Technician' });
Report.belongsTo(Client, { foreignKey: 'clientId' });
Report.hasMany(ReportTechnicalTest, { foreignKey: 'reportId', onDelete: 'CASCADE' });
// External inspection relationship removed
Report.hasOne(Invoice, { foreignKey: 'reportId' });

// Invoice relationships
Invoice.belongsTo(Report, { foreignKey: 'reportId' });
Invoice.belongsTo(Client, { foreignKey: 'clientId' });
Invoice.hasMany(InvoiceItem, { foreignKey: 'invoiceId', onDelete: 'CASCADE' });

// Invoice Item relationships
InvoiceItem.belongsTo(Invoice, { foreignKey: 'invoiceId' });

// Technical Test relationships
ReportTechnicalTest.belongsTo(Report, { foreignKey: 'reportId' });

// External Inspection relationships removed

// Export models
module.exports = {
    sequelize,
    Admin,
    Client,
    Report,
    ReportTechnicalTest,
    // ReportExternalInspection removed,
    Invoice,
    InvoiceItem
};
