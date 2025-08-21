/**
 * Laapak Report System - Money Location Model
 * Tracks different locations where money is stored (cash, digital wallets, bank accounts)
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const MoneyLocation = sequelize.define('MoneyLocation', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: true
        }
    },
    name_ar: {
        type: DataTypes.STRING(100),
        allowNull: false,
        field: 'name_ar',
        validate: {
            notEmpty: true
        }
    },
    type: {
        type: DataTypes.ENUM('cash', 'digital_wallet', 'bank_account', 'other'),
        allowNull: false
    },
    balance: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0.00,
        validate: {
            min: 0
        }
    },
    currency: {
        type: DataTypes.STRING(3),
        defaultValue: 'EGP'
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'is_active'
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'money_locations',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

// Instance method to update balance
MoneyLocation.prototype.updateBalance = async function(amount, movementType) {
    if (movementType === 'deposit' || movementType === 'payment_received') {
        this.balance = parseFloat(this.balance) + parseFloat(amount);
    } else if (movementType === 'withdrawal' || movementType === 'expense_paid') {
        this.balance = parseFloat(this.balance) - parseFloat(amount);
    }
    await this.save();
    return this.balance;
};

// Static method to get total balance across all locations
MoneyLocation.getTotalBalance = async function() {
    const locations = await this.findAll({
        where: { is_active: true }
    });
    
    return locations.reduce((total, location) => {
        return total + parseFloat(location.balance || 0);
    }, 0);
};

module.exports = MoneyLocation;
