/**
 * Laapak Report System - Supplier Model
 * Tracks information about device suppliers and financial entities
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Supplier = sequelize.define('Supplier', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    code: {
        type: DataTypes.STRING(50),
        allowNull: true,
        unique: true
    },
    phone: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    contact_person: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    address: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    contact_info: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('active', 'inactive'),
        defaultValue: 'active'
    },
    created_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'created_by',
        references: { model: 'admins', key: 'id' }
    }
}, {
    tableName: 'suppliers',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = Supplier;
