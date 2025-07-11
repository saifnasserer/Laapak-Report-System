/**
 * Laapak Report System - Goal Model
 * Defines the Goal schema for monthly goals and achievements
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

// Define Goal model
const Goal = sequelize.define('Goal', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    month: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: true
        }
    },
    year: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    type: {
        type: DataTypes.ENUM('reports', 'clients', 'revenue', 'custom'),
        allowNull: false,
        defaultValue: 'reports'
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: true
        }
    },
    target: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 1
        }
    },
    current: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: 0
        }
    },
    unit: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'تقرير'
    },
    period: {
        type: DataTypes.ENUM('monthly', 'quarterly', 'yearly'),
        allowNull: false,
        defaultValue: 'monthly'
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    },
    isBanner: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    createdBy: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    tableName: 'goals',
    timestamps: true,
    indexes: [
        {
            fields: ['month', 'year'],
            unique: true
        }
    ]
});

module.exports = Goal; 