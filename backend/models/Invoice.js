const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Invoice = sequelize.define('Invoice', {
    id: {
        type: DataTypes.STRING,
        primaryKey: true
    },
    reportId: {
        type: DataTypes.STRING(50),
        allowNull: true, // Make this optional for bulk invoices
        field: 'reportId',
        references: {
            model: 'reports',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    },
    client_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'client_id',
        references: { model: 'clients', key: 'id' }
    },
    date: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    subtotal: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    discount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0
    },
    taxRate: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 14.00
    },
    tax: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    total: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    paymentStatus: {
        type: DataTypes.ENUM('pending', 'completed', 'cancelled', 'unpaid', 'partial', 'paid'),
        defaultValue: 'pending'
    },
    paymentMethod: {
        type: DataTypes.STRING,
        allowNull: true
    },
    paymentDate: {
        type: DataTypes.DATE,
        allowNull: true
    },
    money_location_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'money_location_id',
        references: { model: 'money_locations', key: 'id' }
    },
    // Add metadata for better tracking
    created_from_report: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: 'Indicates if invoice was created from a report'
    },
    report_order_number: {
        type: DataTypes.STRING(20),
        allowNull: true,
        comment: 'Copy of report order number for quick reference'
    },
    report_id: {
        type: DataTypes.STRING(50),
        allowNull: true,
        field: 'report_id',
        references: { model: 'reports', key: 'id' },
        comment: 'Alternative report reference field'
    }
}, {
    tableName: 'invoices',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        {
            fields: ['reportId']
        },
        {
            fields: ['client_id']
        },
        {
            fields: ['date']
        }
    ]
});

/**
 * Static method to record payment for an invoice in the financial system
 */
Invoice.recordPayment = async function (invoiceId, method, createdBy, transaction) {
    const { MoneyLocation, MoneyMovement } = require('./index');
    const { Op } = require('sequelize');

    try {
        const invoice = await Invoice.findByPk(invoiceId, { transaction });
        if (!invoice) throw new Error('Invoice not found');

        const amount = parseFloat(invoice.total || 0);
        if (amount <= 0) return;

        // Find location
        const methodLower = (method || 'cash').toLowerCase();
        let location = await MoneyLocation.findOne({
            where: {
                [Op.and]: [
                    { is_active: true },
                    {
                        [Op.or]: [
                            { name: { [Op.like]: `%${methodLower}%` } },
                            { name_ar: { [Op.like]: `%${methodLower}%` } },
                            { description: { [Op.like]: `%${methodLower}%` } }
                        ]
                    }
                ]
            },
            transaction
        });

        if (!location) {
            // Default to first active location (usually Cash)
            location = await MoneyLocation.findOne({
                where: { is_active: true },
                order: [['id', 'ASC']],
                transaction
            });
        }

        if (!location) {
            console.warn('No active MoneyLocation found to record invoice payment');
            return;
        }

        // Create movement
        const movement = await MoneyMovement.create({
            movement_type: 'payment_received',
            amount: amount,
            to_location_id: location.id,
            reference_type: 'invoice',
            reference_id: String(invoice.id),
            description: `تحصيل فاتورة رقم ${invoice.id} (${method || 'نقدي'})`,
            movement_date: new Date(),
            created_by: createdBy
        }, { transaction });

        // Update location balance
        await location.update({
            balance: parseFloat(location.balance || 0) + amount
        }, { transaction });

        // Update invoice with the method and location for future reversal
        await invoice.update({
            paymentMethod: method,
            money_location_id: location.id,
            paymentDate: new Date()
        }, { transaction });

        return movement;

    } catch (error) {
        console.error('Failed to record invoice payment helper:', error);
        throw error;
    }
};

/**
 * Static method to revert (deduct) payment for an invoice in the financial system
 */
Invoice.revertPayment = async function (invoiceId, createdBy, transaction) {
    const { MoneyLocation, MoneyMovement } = require('./index');

    try {
        const invoice = await Invoice.findByPk(invoiceId, { transaction });
        if (!invoice) throw new Error('Invoice not found');

        const amount = parseFloat(invoice.total || 0);
        if (amount <= 0) return;

        // Find location - use stored ID or fallback to default
        let location = null;
        if (invoice.money_location_id) {
            location = await MoneyLocation.findByPk(invoice.money_location_id, { transaction });
        }

        if (!location) {
            // Default to first active location (usually Cash) if no location recorded
            location = await MoneyLocation.findOne({
                where: { is_active: true },
                order: [['id', 'ASC']],
                transaction
            });
        }

        if (!location) {
            console.warn('No active MoneyLocation found to revert invoice payment');
            return;
        }

        // Create movement (withdrawal to deduct money)
        const movement = await MoneyMovement.create({
            movement_type: 'withdrawal',
            amount: amount,
            from_location_id: location.id,
            reference_type: 'invoice',
            reference_id: String(invoice.id),
            description: `إلغاء تحصيل فاتورة رقم ${invoice.id} (دفع مسترد/تعديل حالة)`,
            movement_date: new Date(),
            created_by: createdBy
        }, { transaction });

        // Update location balance (deduct)
        await location.update({
            balance: parseFloat(location.balance || 0) - amount
        }, { transaction });

        return movement;

    } catch (error) {
        console.error('Failed to revert invoice payment:', error);
        throw error;
    }
};

module.exports = Invoice;
