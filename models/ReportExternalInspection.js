/**
 * Laapak Report System - Report External Inspection Model
 * Defines the structure for external physical inspection in reports
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const ReportExternalInspection = sequelize.define('ReportExternalInspection', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  reportId: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: 'Reports',
      key: 'id'
    }
  },
  componentName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  conditionStatus: {
    type: DataTypes.STRING,
    allowNull: false
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'report_external_inspection',
  timestamps: false
});

module.exports = ReportExternalInspection;
