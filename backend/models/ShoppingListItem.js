const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const ShoppingListItem = sequelize.define('ShoppingListItem', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    list_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'shopping_lists',
            key: 'id'
        }
    },
    brand: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    model: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    quantity: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        allowNull: false
    },
    price: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00
    },
    is_checked: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: 'shopping_list_items',
    underscored: true,
    timestamps: true
});

module.exports = ShoppingListItem;
