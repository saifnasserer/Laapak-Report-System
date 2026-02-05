const { Report } = require('../../models/index');
const { Op } = require('sequelize');

const reportIds = ['RPT424694862', 'RPT961115525', 'RPT96538697'];

async function verifyStatus() {
    try {
        console.log(`🔍 Checking status for ${reportIds.length} reports...`);

        const reports = await Report.findAll({
            where: {
                id: {
                    [Op.in]: reportIds
                }
            },
            attributes: ['id', 'client_name', 'warranty_alerts_log']
        });

        if (reports.length === 0) {
            console.log('❌ No reports found with these IDs.');

            // Try searching by order_number just in case
            const byOrder = await Report.findAll({
                where: {
                    order_number: {
                        [Op.in]: reportIds
                    }
                },
                attributes: ['id', 'order_number', 'client_name', 'warranty_alerts_log']
            });

            if (byOrder.length > 0) {
                console.log(`💡 Found ${byOrder.length} reports matching these as order_numbers:`);
                byOrder.forEach(r => {
                    console.log(`- ID: ${r.id}, Order: ${r.order_number}, Status:`, JSON.stringify(r.warranty_alerts_log));
                });
            }
        } else {
            console.log(`✅ Found ${reports.length} reports:`);
            reports.forEach(r => {
                console.log(`- ID: ${r.id}, Name: ${r.client_name}, Status:`, JSON.stringify(r.warranty_alerts_log));
            });
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error checking reports:', error);
        process.exit(1);
    }
}

verifyStatus();
