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

// Financial Management Models
const ExpenseCategory = require('./ExpenseCategory');
const Expense = require('./Expense');
const ProductCost = require('./ProductCost');
const FinancialSummary = require('./FinancialSummary');

// Import the sequelize instance from the config/db.js file
const { sequelize } = require('../config/db');

// Define associations
// Expense Category associations
ExpenseCategory.hasMany(Expense, { foreignKey: 'category_id', as: 'expenses' });
Expense.belongsTo(ExpenseCategory, { foreignKey: 'category_id', as: 'category' });

// Admin associations for financial models
Admin.hasMany(Expense, { foreignKey: 'created_by', as: 'createdExpenses' });
Admin.hasMany(Expense, { foreignKey: 'approved_by', as: 'approvedExpenses' });
Expense.belongsTo(Admin, { foreignKey: 'created_by', as: 'creator' });
Expense.belongsTo(Admin, { foreignKey: 'approved_by', as: 'approver' });

Admin.hasMany(ProductCost, { foreignKey: 'created_by', as: 'createdProductCosts' });
Admin.hasMany(ProductCost, { foreignKey: 'updated_by', as: 'updatedProductCosts' });
ProductCost.belongsTo(Admin, { foreignKey: 'created_by', as: 'creator' });
ProductCost.belongsTo(Admin, { foreignKey: 'updated_by', as: 'updater' });

// Product Cost associations with Invoice Items (optional)
ProductCost.hasMany(InvoiceItem, { foreignKey: 'product_cost_id', as: 'invoiceItems' });
InvoiceItem.belongsTo(ProductCost, { foreignKey: 'product_cost_id', as: 'productCost' });

// Report and Invoice associations through InvoiceReport junction table
Report.belongsToMany(Invoice, { 
    through: InvoiceReport, 
    foreignKey: 'report_id', 
    otherKey: 'invoice_id',
    as: 'invoices' 
});
Invoice.belongsToMany(Report, { 
    through: InvoiceReport, 
    foreignKey: 'invoice_id', 
    otherKey: 'report_id',
    as: 'reports' 
});

// Client associations
Client.hasMany(Report, { foreignKey: 'client_id', as: 'reports' });
Report.belongsTo(Client, { foreignKey: 'client_id', as: 'client' });

Client.hasMany(Invoice, { foreignKey: 'client_id', as: 'invoices' });
Invoice.belongsTo(Client, { foreignKey: 'client_id', as: 'client' });

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
  // Financial Management Models
  ExpenseCategory,
  Expense,
  ProductCost,
  FinancialSummary,
  sequelize, // Export the sequelize instance
};
