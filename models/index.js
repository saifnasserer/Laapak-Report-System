const Admin = require('./Admin');
const Client = require('./Client');
const Invoice = require('./Invoice');
const InvoiceItem = require('./InvoiceItem');
const Report = require('./Report');
const ReportTechnicalTest = require('./ReportTechnicalTest');
const InvoiceReport = require('./invoicereport'); 
const Goal = require('./Goal');
const Achievement = require('./Achievement');

// Financial Management Models
const ExpenseCategory = require('./ExpenseCategory');
const Expense = require('./Expense');
const ProductCost = require('./ProductCost');
const FinancialSummary = require('./FinancialSummary');
const MoneyLocation = require('./MoneyLocation');
const MoneyMovement = require('./MoneyMovement');

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

// Money Location and Movement associations
Admin.hasMany(MoneyMovement, { foreignKey: 'created_by', as: 'createdMoneyMovements' });
MoneyMovement.belongsTo(Admin, { foreignKey: 'created_by', as: 'creator' });

MoneyLocation.hasMany(MoneyMovement, { foreignKey: 'from_location_id', as: 'outgoingMovements' });
MoneyLocation.hasMany(MoneyMovement, { foreignKey: 'to_location_id', as: 'incomingMovements' });
MoneyMovement.belongsTo(MoneyLocation, { foreignKey: 'from_location_id', as: 'fromLocation' });
MoneyMovement.belongsTo(MoneyLocation, { foreignKey: 'to_location_id', as: 'toLocation' });

// Invoice and Expense associations with Money Location
Invoice.belongsTo(MoneyLocation, { foreignKey: 'money_location_id', as: 'moneyLocation' });
MoneyLocation.hasMany(Invoice, { foreignKey: 'money_location_id', as: 'invoices' });

Expense.belongsTo(MoneyLocation, { foreignKey: 'money_location_id', as: 'moneyLocation' });
MoneyLocation.hasMany(Expense, { foreignKey: 'money_location_id', as: 'expenses' });

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

Client.hasMany(Invoice, { foreignKey: 'client_id', as: 'clientInvoices' });
Invoice.belongsTo(Client, { foreignKey: 'client_id', as: 'client' });

// Invoice and InvoiceItem associations
Invoice.hasMany(InvoiceItem, { foreignKey: 'invoiceId', as: 'InvoiceItems' });
InvoiceItem.belongsTo(Invoice, { foreignKey: 'invoiceId', as: 'invoice' });

module.exports = {
  Admin,
  Client,
  Invoice,
  InvoiceItem,
  Report,
  ReportTechnicalTest,
  InvoiceReport, 
  Goal,
  Achievement,
  // Financial Management Models
  ExpenseCategory,
  Expense,
  ProductCost,
  FinancialSummary,
  MoneyLocation,
  MoneyMovement,
  sequelize, // Export the sequelize instance
};
