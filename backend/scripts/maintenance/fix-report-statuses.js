const { sequelize } = require('../config/db');

async function fixReportStatuses() {
    try {
        console.log('Fixing report status values...');
        
        // First, let's see what statuses we have
        const [currentStatuses] = await sequelize.query('SELECT DISTINCT status FROM reports');
        console.log('Current statuses in database:', currentStatuses.map(s => s.status));
        
        // Update Arabic statuses to English equivalents
        await sequelize.query(`
            UPDATE reports 
            SET status = 'completed' 
            WHERE status = 'مكتمل'
        `);
        
        await sequelize.query(`
            UPDATE reports 
            SET status = 'pending' 
            WHERE status = 'في المخزن'
        `);
        
        await sequelize.query(`
            UPDATE reports 
            SET status = 'cancelled' 
            WHERE status = 'ملغي'
        `);
        
        // Update 'active' to 'pending' (since 'active' is not in our new ENUM)
        await sequelize.query(`
            UPDATE reports 
            SET status = 'pending' 
            WHERE status = 'active'
        `);
        
        // Now update the ENUM to include all the values we need
        await sequelize.query(`
            ALTER TABLE reports 
            MODIFY COLUMN status ENUM('pending', 'in-progress', 'completed', 'cancelled', 'canceled', 'active') 
            DEFAULT 'pending'
        `);
        
        // Verify the changes
        const [newStatuses] = await sequelize.query('SELECT DISTINCT status FROM reports');
        console.log('Statuses after fix:', newStatuses.map(s => s.status));
        
        console.log('Report statuses fixed successfully!');
        
    } catch (error) {
        console.error('Error fixing report statuses:', error);
    } finally {
        await sequelize.close();
    }
}

fixReportStatuses(); 