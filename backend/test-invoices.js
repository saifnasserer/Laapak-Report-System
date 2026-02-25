const { Invoice, Report } = require('./models');

async function testQuery() {
    try {
        const invoices = await Invoice.findAll({
            where: { client_id: 238 },
            include: [
                { model: Report, as: 'relatedReports', attributes: ['id', 'device_model', 'serial_number', 'order_number'] }
            ],
            order: [['date', 'DESC']]
        });
        console.log(JSON.stringify(invoices, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}

testQuery();
