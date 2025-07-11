const Admin = require('./Admin');
const Client = require('./Client');
const Invoice = require('./Invoice');
const InvoiceItem = require('./InvoiceItem');
const Report = require('./Report');
const ReportTechnicalTest = require('./ReportTechnicalTest');
const InvoiceReport = require('./invoicereport'); 
const Login = require('./login');
const Goal = require('./Goal');
const Achievement = require('./Achievement');

// Import the sequelize instance from the config/db.js file
const { sequelize } = require('../config/db');

module.exports = {
  Admin,
  Client,
  Invoice,
  InvoiceItem,
  Report,
  ReportTechnicalTest,
  InvoiceReport, 
  Login,
  Goal,
  Achievement,
  sequelize, // Export the sequelize instance
};
