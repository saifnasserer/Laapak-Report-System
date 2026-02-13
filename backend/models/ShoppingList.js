const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const ShoppingList = sequelize.define('ShoppingList', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    public_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        unique: true
    },
    name: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    currency: {
        type: DataTypes.STRING(10),
        defaultValue: 'EGP',
        allowNull: false
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: true, // Optional: for admin owners
        references: {
            model: 'admins',
            key: 'id'
        }
    },
    settings: {
        type: DataTypes.JSON,
        defaultValue: {
            showCheckboxes: true,
            allowPublicCheck: false
        }
    }
}, {
    tableName: 'shopping_lists',
    underscored: true,
    timestamps: true
});

module.exports = ShoppingList;
