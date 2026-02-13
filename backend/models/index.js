const Admin = require('./Admin');
const Client = require('./Client');
const Invoice = require('./Invoice');
const InvoiceItem = require('./InvoiceItem');
const Report = require('./Report');
const ReportTechnicalTest = require('./ReportTechnicalTest');
const InvoiceReport = require('./invoicereport');
const InvoiceReportSummary = require('./InvoiceReportSummary');
const BudgetAllocation = require('./BudgetAllocation');
const ApiKey = require('./ApiKey');
const ApiUsageLog = require('./ApiUsageLog');
const Goal = require('./Goal');
const Achievement = require('./Achievement');
const WebhookLog = require('./WebhookLog');
const OutgoingWebhook = require('./OutgoingWebhook');
const OutgoingWebhookLog = require('./OutgoingWebhookLog');
const ShoppingList = require('./ShoppingList');
const ShoppingListItem = require('./ShoppingListItem');

// Financial Management Models
const ExpenseCategory = require('./ExpenseCategory');
const Expense = require('./Expense');
const ProductCost = require('./ProductCost');
const FinancialSummary = require('./FinancialSummary');
const MoneyLocation = require('./MoneyLocation');
const MoneyMovement = require('./MoneyMovement');
const ExpectedItem = require('./ExpectedItem');
const Setting = require('./Setting');

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

// Expected Items associations
Admin.hasMany(ExpectedItem, { foreignKey: 'created_by', as: 'createdExpectedItems' });
ExpectedItem.belongsTo(Admin, { foreignKey: 'created_by', as: 'creator' });

// Product Cost associations with Invoice Items (optional)
ProductCost.hasMany(InvoiceItem, { foreignKey: 'product_cost_id', as: 'invoiceItems' });
InvoiceItem.belongsTo(ProductCost, { foreignKey: 'product_cost_id', as: 'productCost' });

// Client associations
Client.hasMany(Report, { foreignKey: 'client_id', as: 'reports' });
Report.belongsTo(Client, { foreignKey: 'client_id', as: 'client' });

Client.hasMany(Invoice, { foreignKey: 'client_id', as: 'clientInvoices' });
Invoice.belongsTo(Client, { foreignKey: 'client_id', as: 'client' });

// Invoice and InvoiceItem associations
Invoice.hasMany(InvoiceItem, { foreignKey: 'invoiceId', as: 'InvoiceItems' });
InvoiceItem.belongsTo(Invoice, { foreignKey: 'invoiceId', as: 'invoice' });

// Report and Invoice many-to-many associations through InvoiceReport junction table
Report.belongsToMany(Invoice, {
  through: InvoiceReport,
  foreignKey: 'report_id',
  otherKey: 'invoice_id',
  as: 'relatedInvoices'
});
Invoice.belongsToMany(Report, {
  through: InvoiceReport,
  foreignKey: 'invoice_id',
  otherKey: 'report_id',
  as: 'relatedReports'
});

// BudgetAllocation associations
Admin.hasMany(BudgetAllocation, { foreignKey: 'created_by', as: 'createdBudgetAllocations' });
BudgetAllocation.belongsTo(Admin, { foreignKey: 'created_by', as: 'creator' });

ExpenseCategory.hasMany(BudgetAllocation, { foreignKey: 'category_id', as: 'budgetAllocations' });
BudgetAllocation.belongsTo(ExpenseCategory, { foreignKey: 'category_id', as: 'category' });

// API Key associations
Admin.hasMany(ApiKey, { foreignKey: 'created_by', as: 'createdApiKeys' });
ApiKey.belongsTo(Admin, { foreignKey: 'created_by', as: 'creator' });

Client.hasMany(ApiKey, { foreignKey: 'client_id', as: 'apiKeys' });
ApiKey.belongsTo(Client, { foreignKey: 'client_id', as: 'client' });

ApiKey.hasMany(ApiUsageLog, { foreignKey: 'api_key_id', as: 'usageLogs' });
ApiUsageLog.belongsTo(ApiKey, { foreignKey: 'api_key_id', as: 'apiKey' });

// Shopping List associations
ShoppingList.hasMany(ShoppingListItem, { foreignKey: 'list_id', as: 'items', onDelete: 'CASCADE' });
ShoppingListItem.belongsTo(ShoppingList, { foreignKey: 'list_id', as: 'list' });

Admin.hasMany(ShoppingList, { foreignKey: 'user_id', as: 'shoppingLists' });
ShoppingList.belongsTo(Admin, { foreignKey: 'user_id', as: 'owner' });

module.exports = {
  Admin,
  Client,
  Invoice,
  InvoiceItem,
  Report,
  ReportTechnicalTest,
  InvoiceReport,
  InvoiceReportSummary,
  BudgetAllocation,
  ApiKey,
  ApiUsageLog,
  Goal,
  Achievement,
  // Financial Management Models
  ExpenseCategory,
  Expense,
  ProductCost,
  FinancialSummary,
  MoneyLocation,
  MoneyMovement,
  ExpectedItem,
  Setting,
  WebhookLog,
  OutgoingWebhook,
  OutgoingWebhookLog,
  ShoppingList,
  ShoppingListItem,
  sequelize, // Export the sequelize instance
};
