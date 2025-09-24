/**
 * Laapak Report System - Financial Summary Model
 * Pre-calculated monthly financial summaries for dashboard performance
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const FinancialSummary = sequelize.define('FinancialSummary', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    month_year: {
        type: DataTypes.STRING(7),
        allowNull: false,
        unique: true,
        field: 'month_year',
        validate: {
            is: /^\d{4}-\d{2}$/ // Format: 2025-01
        }
    },
    total_revenue: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0.00,
        field: 'total_revenue'
    },
    total_cost: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0.00,
        field: 'total_cost'
    },
    total_expenses: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0.00,
        field: 'total_expenses'
    },
    gross_profit: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0.00,
        field: 'gross_profit'
    },
    net_profit: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0.00,
        field: 'net_profit'
    },
    profit_margin: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 0.00,
        field: 'profit_margin'
    },
    invoice_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'invoice_count'
    },
    expense_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'expense_count'
    },
    last_calculated: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: 'last_calculated'
    }
}, {
    tableName: 'financial_summaries',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

// Static method to calculate and update summary for a given month
FinancialSummary.calculateForMonth = async function(monthYear) {
    const { Invoice, InvoiceItem, Expense } = require('./index');
    
    // Get invoices for the month
    const startDate = `${monthYear}-01`;
    const endDate = `${monthYear}-31`;
    
    // Calculate revenue and costs from invoices
    const invoices = await Invoice.findAll({
        where: {
            date: {
                [sequelize.Op.between]: [startDate, endDate]
            },
            paymentStatus: 'paid'
        },
        include: [InvoiceItem]
    });
    
    let totalRevenue = 0;
    let totalCost = 0;
    let invoiceCount = invoices.length;
    
    for (const invoice of invoices) {
        totalRevenue += parseFloat(invoice.total || 0);
        for (const item of invoice.InvoiceItems || []) {
            if (item.cost_price) {
                totalCost += parseFloat(item.cost_price) * (item.quantity || 1);
            }
        }
    }
    
    // Calculate expenses for the month
    const expenses = await Expense.findAll({
        where: {
            date: {
                [sequelize.Op.between]: [startDate, endDate]
            },
            status: ['approved', 'paid']
        }
    });
    
    let totalExpenses = 0;
    for (const expense of expenses) {
        totalExpenses += parseFloat(expense.amount || 0);
    }
    
    // Calculate profits
    const grossProfit = totalRevenue - totalCost;
    const netProfit = grossProfit - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    
    // Update or create summary
    const [summary] = await this.upsert({
        month_year: monthYear,
        total_revenue: totalRevenue,
        total_cost: totalCost,
        total_expenses: totalExpenses,
        gross_profit: grossProfit,
        net_profit: netProfit,
        profit_margin: profitMargin,
        invoice_count: invoiceCount,
        expense_count: expenses.length,
        last_calculated: new Date()
    });
    
    return summary;
};

// Static method to get current month summary
FinancialSummary.getCurrentMonth = async function() {
    const now = new Date();
    const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    let summary = await this.findOne({
        where: { month_year: monthYear }
    });
    
    if (!summary) {
        summary = await this.calculateForMonth(monthYear);
    }
    
    return summary;
};

module.exports = FinancialSummary; 