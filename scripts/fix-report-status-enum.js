const { sequelize } = require('../config/db');

async function fixReportStatusEnum() {
    try {
        console.log('Fixing report status ENUM...');
        
        // First, let's see what statuses we have
        const [currentStatuses] = await sequelize.query('SELECT DISTINCT status FROM reports');
        console.log('Current statuses in database:', currentStatuses.map(s => s.status));
        
        // Convert any English statuses to Arabic equivalents
        await sequelize.query(`
            UPDATE reports 
            SET status = 'مكتمل' 
            WHERE status = 'completed'
        `);
        
        await sequelize.query(`
            UPDATE reports 
            SET status = 'قيد الانتظار' 
            WHERE status = 'pending'
        `);
        
        await sequelize.query(`
            UPDATE reports 
            SET status = 'ملغى' 
            WHERE status = 'cancelled'
        `);
        
        // Convert 'active' to 'قيد الانتظار'
        await sequelize.query(`
            UPDATE reports 
            SET status = 'قيد الانتظار' 
            WHERE status = 'active'
        `);
        
        // Now we need to drop the old ENUM and create a new one
        // First, create a temporary column
        await sequelize.query(`
            ALTER TABLE reports 
            ADD COLUMN status_new VARCHAR(20) DEFAULT 'قيد الانتظار'
        `);
        
        // Copy data to the new column
        await sequelize.query(`
            UPDATE reports 
            SET status_new = status 
            WHERE status IS NOT NULL
        `);
        
        // Drop the old column
        await sequelize.query(`
            ALTER TABLE reports 
            DROP COLUMN status
        `);
        
        // Rename the new column to status
        await sequelize.query(`
            ALTER TABLE reports 
            CHANGE status_new status VARCHAR(20) DEFAULT 'قيد الانتظار'
        `);
        
        // Now create the new ENUM with Arabic values
        await sequelize.query(`
            ALTER TABLE reports 
            MODIFY COLUMN status ENUM('قيد الانتظار', 'قيد المعالجة', 'مكتمل', 'ملغى', 'pending', 'in-progress', 'completed', 'cancelled', 'canceled', 'active') 
            DEFAULT 'قيد الانتظار'
        `);
        
        // Verify the changes
        const [newStatuses] = await sequelize.query('SELECT DISTINCT status FROM reports');
        console.log('Statuses after fix:', newStatuses.map(s => s.status));
        
        // Check the column definition
        const [columnDef] = await sequelize.query("SHOW COLUMNS FROM reports LIKE 'status'");
        console.log('New column definition:', columnDef[0]);
        
        console.log('Report status ENUM fixed successfully!');
        
    } catch (error) {
        console.error('Error fixing report status ENUM:', error);
    } finally {
        await sequelize.close();
    }
}

fixReportStatusEnum(); 