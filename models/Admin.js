/**
 * Laapak Report System - Admin Model
 * Defines the Admin user schema for the database
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const bcrypt = require('bcryptjs');

// Define Admin model
const Admin = sequelize.define('Admin', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            notEmpty: true
        }
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: true
        }
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    role: {
        type: DataTypes.ENUM('admin', 'technician', 'viewer'),
        defaultValue: 'viewer',
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
            isEmail: true
        }
    },
    lastLogin: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    tableName: 'admins',
    timestamps: true,
    hooks: {
        // Hash password before saving
        beforeCreate: async (admin) => {
            if (admin.password) {
                admin.password = await bcrypt.hash(admin.password, 10);
            }
        },
        beforeUpdate: async (admin) => {
            if (admin.changed('password')) {
                admin.password = await bcrypt.hash(admin.password, 10);
            }
        }
    }
});

// Instance method to check password
Admin.prototype.checkPassword = async function(password) {
    try {
        console.log('Comparing passwords:');
        console.log('Input password:', password);
        console.log('Stored password hash:', this.password);
        const result = await bcrypt.compare(password, this.password);
        console.log('Comparison result:', result);
        return result;
    } catch (error) {
        console.error('Error comparing passwords:', error);
        return false;
    }
};

module.exports = Admin;
