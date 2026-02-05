const { Report } = require('../../models/index');
const { Op } = require('sequelize');

const reportIds = ['RPT424694862', 'RPT961115525', 'RPT96538697'];

async function markAsSent() {
    try {
        console.log(`🚀 Starting update for ${reportIds.length} reports...`);

        const now = new Date();
        const [updatedCount] = await Report.update(
            {
                warranty_alerts_log: {
                    six_month: now,
                    annual: now
                }
            },
            {
                where: {
                    id: {
                        [Op.in]: reportIds
                    }
                }
            }
        );

        console.log(`✅ Successfully updated ${updatedCount} reports.`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Error updating reports:', error);
        process.exit(1);
    }
}

markAsSent();
