const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Client = sequelize.define('Client', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { notEmpty: true }
    },
    orderCode: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { notEmpty: true },
        field: 'orderCode'
    },
    email: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
            isEmail: function (value) {
                if (value && value.trim() !== '') {
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(value)) {
                        throw new Error('Invalid email format');
                    }
                }
            }
        },
        field: 'email'
    },
    address: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'address'
    },
    companyName: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'company_name'
    },
    taxNumber: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'tax_number'
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'notes'
    },
    status: {
        type: DataTypes.ENUM('active', 'inactive'),
        defaultValue: 'active',
        allowNull: false,
        field: 'status'
    },
    lastLogin: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'lastLogin'
    }
}, {
    tableName: 'clients',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
});

module.exports = Client;
