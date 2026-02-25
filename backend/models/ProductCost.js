/**
 * Laapak Report System - Product Cost Model
 * Defines product cost prices for profit calculations
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const ProductCost = sequelize.define('ProductCost', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    product_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'product_name',
        validate: {
            notEmpty: true
        }
    },
    product_model: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'product_model',
        validate: {
            notEmpty: true
        }
    },
    serial_number: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'serial_number'
    },
    cost_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        field: 'cost_price',
        validate: {
            min: 0
        }
    },
    supplier: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    supplier_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'supplier_id',
        references: { model: 'suppliers', key: 'id' }
    },
    purchase_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        field: 'purchase_date'
    },
    effective_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        field: 'effective_date',
        defaultValue: DataTypes.NOW
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    created_by: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'created_by',
        references: { model: 'admins', key: 'id' }
    },
    updated_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'updated_by',
        references: { model: 'admins', key: 'id' }
    }
}, {
    tableName: 'product_costs',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

// Instance method to get the most recent cost for a product
ProductCost.getLatestCostByProduct = async function (productName, productModel) {
    return await this.findOne({
        where: {
            product_name: productName,
            product_model: productModel
        },
        order: [['effective_date', 'DESC']],
        limit: 1
    });
};

// Instance method to get cost by serial number
ProductCost.getCostBySerial = async function (serialNumber) {
    return await this.findOne({
        where: {
            serial_number: serialNumber
        },
        order: [['effective_date', 'DESC']],
        limit: 1
    });
};

module.exports = ProductCost; 