/**
 * Laapak Report System - Password Reset Routes
 * Provides endpoints for resetting user passwords
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { Admin } = require('../models');

// Reset admin password
router.post('/admin', async (req, res) => {
    try {
        const { username, newPassword } = req.body;
        
        if (!username || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'يرجى توفير اسم المستخدم وكلمة المرور الجديدة'
            });
        }
        
        // Find admin user
        const admin = await Admin.findOne({ where: { username } });
        
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'المستخدم غير موجود'
            });
        }
        
        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        // Update admin password
        await admin.update({ password: hashedPassword });
        
        return res.status(200).json({
            success: true,
            message: 'تم إعادة تعيين كلمة المرور بنجاح'
        });
    } catch (error) {
        console.error('Error resetting admin password:', error);
        return res.status(500).json({
            success: false,
            message: 'حدث خطأ أثناء إعادة تعيين كلمة المرور'
        });
    }
});

module.exports = router;
