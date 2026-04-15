const { Supplier, Report, Admin, InvoiceItem } = require('./backend/models');
const { Op } = require('sequelize');

async function test() {
    const id = 1; // مصطفى المدينة
    try {
        const reports = await Report.findAll({
            where: {
                supplier_id: id,
                status: { [Op.notIn]: ['cancelled', 'canceled'] }
            },
            limit: 20,
            order: [['created_at', 'DESC']],
            attributes: ['id', 'device_model', 'status', 'client_name']
        });
        console.log('Reports for Supplier 1:');
        reports.forEach(r => console.log(`${r.id} | ${r.device_model} | ${r.status} | ${r.client_name}`));
    } catch (e) {
        console.error(e);
    }
    process.exit();
}

test();
