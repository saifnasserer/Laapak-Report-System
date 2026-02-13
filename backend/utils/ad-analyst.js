const { sequelize } = require('../config/db');
const facebookService = require('./facebook-service');

/**
 * AI Ad Analyst Utility
 * Provides insights and scaling recommendations
 */
class AdAnalyst {
    /**
     * Get Product-Specific Performance Matrix
     * Joins ad spend with product sales by matching names
     */
    async getProductPerformanceMatrix() {
        try {
            // 1. Get ad spend grouped by campaign name
            const [campaignSpend] = await sequelize.query(`
                SELECT 
                    ad_account_name,
                    SUM(spend) as total_spend,
                    SUM(clicks) as total_clicks,
                    MIN(date) as first_date,
                    MAX(date) as last_date
                FROM facebook_ad_spend
                GROUP BY ad_account_name
            `);

            // 2. Get all products to match against campaign names
            const [products] = await sequelize.query(`SELECT id, name FROM reports`); // Assuming reports table has product info or similar

            // Note: In this system, 'reports' seem to represent technical jobs, 
            // but invoices have the actual sales data.
            const [salesData] = await sequelize.query(`
                SELECT 
                    ii.description as item_name,
                    SUM(ii.quantity) as total_units,
                    SUM(ii.price * ii.quantity) as total_revenue
                FROM invoice_items ii
                JOIN invoices i ON ii.invoice_id = i.id
                WHERE i.status = 'paid'
                GROUP BY ii.description
            `);

            // 3. Match and calculate ROAS
            const performanceMatrix = salesData.map(sale => {
                // Try to find a matching campaign (case insensitive fuzzy match)
                const matchingCampaign = campaignSpend.find(camp =>
                    camp.ad_account_name.toLowerCase().includes(sale.item_name.toLowerCase()) ||
                    sale.item_name.toLowerCase().includes(camp.ad_account_name.toLowerCase())
                );

                const spend = matchingCampaign ? matchingCampaign.total_spend : 0;
                const roas = spend > 0 ? (sale.total_revenue / spend).toFixed(2) : 0;

                return {
                    product: sale.item_name,
                    revenue: sale.total_revenue,
                    units_sold: sale.total_units,
                    ad_spend: spend,
                    roas: parseFloat(roas),
                    status: spend > 0 ? (roas > 3 ? 'PROFITABLE' : 'needs_optimization') : 'no_ads'
                };
            });

            return performanceMatrix;
        } catch (error) {
            console.error('AdAnalyst [getProductPerformanceMatrix] Error:', error);
            throw error;
        }
    }

    /**
     * Generate Scaling Recommendations
     */
    async getScalingRecommendations() {
        try {
            const matrix = await this.getProductPerformanceMatrix();
            const recommendations = [];

            for (const item of matrix) {
                if (item.roas > 4 && item.units_sold > 5) {
                    recommendations.push({
                        type: 'SCALE_UP',
                        product: item.product,
                        reason: `High ROAS (${item.roas}) and consistent volume.`,
                        action: 'Increase budget by 20%',
                        priority: 'high'
                    });
                } else if (item.roas < 1.5 && item.ad_spend > 500) {
                    recommendations.push({
                        type: 'OPTIMIZE',
                        product: item.product,
                        reason: `Low ROAS (${item.roas}) despite significant spend.`,
                        action: 'Consider pausing or refining ad creative.',
                        priority: 'medium'
                    });
                }
            }

            return recommendations;
        } catch (error) {
            console.error('AdAnalyst [getScalingRecommendations] Error:', error);
            throw error;
        }
    }
}

module.exports = new AdAnalyst();
