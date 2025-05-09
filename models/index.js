/**
 * Laapak Report System - Models Index
 * Exports all models and initializes database relationships
 */

const { sequelize } = require('../config/db');
const Admin = require('./Admin');
const Client = require('./Client');

// Define any relationships between models here if needed
// For example:
// Admin.hasMany(Report);
// Client.hasMany(Report);

// Export models
module.exports = {
    sequelize,
    Admin,
    Client
};
