/**
 * Laapak Report System - Models Index
 * Exports all models and initializes database relationships
 */

const { sequelize } = require('../config/db');
const Admin = require('./Admin');
const Client = require('./Client');
const Report = require('./Report');

// Define relationships between models
Admin.hasMany(Report, { foreignKey: 'technicianId' });
Report.belongsTo(Admin, { foreignKey: 'technicianId', as: 'Technician' });

Client.hasMany(Report, { foreignKey: 'clientId' });
Report.belongsTo(Client, { foreignKey: 'clientId' });

// Export models
module.exports = {
    sequelize,
    Admin,
    Client,
    Report
};
