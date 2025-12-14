/**
 * Laapak Report System - Achievement Model
 * Defines the Achievement schema for tracking system milestones
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

// Define Achievement model
const Achievement = sequelize.define('Achievement', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    type: {
        type: DataTypes.ENUM('milestone', 'record', 'streak', 'custom'),
        allowNull: false,
        defaultValue: 'milestone'
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: true
        }
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    metric: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: true
        }
    },
    value: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 0
        }
    },
    icon: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: 'fas fa-trophy'
    },
    color: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: '#007553'
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    },
    achievedAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    createdBy: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    tableName: 'achievements',
    timestamps: true
});

module.exports = Achievement; 