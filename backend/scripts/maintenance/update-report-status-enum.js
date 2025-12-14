const { sequelize } = require('../config/db');

async function updateReportStatusEnum() {
    try {
        console.log('Updating report status ENUM...');
        
        // Update the ENUM values
        await sequelize.query(`
            ALTER TABLE reports 
            MODIFY COLUMN status ENUM('pending', 'in-progress', 'completed', 'cancelled', 'canceled', 'active') 
            DEFAULT 'pending'
        `);
        
        console.log('Report status ENUM updated successfully!');
        
        // Update existing records to use 'pending' instead of 'active' as default
        await sequelize.query(`
            UPDATE reports 
            SET status = 'pending' 
            WHERE status = 'active' OR status IS NULL
        `);
        
        console.log('Existing records updated to use pending status!');
        
    } catch (error) {
        console.error('Error updating report status ENUM:', error);
    } finally {
        await sequelize.close();
    }
}

updateReportStatusEnum(); 