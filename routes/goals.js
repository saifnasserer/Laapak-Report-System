/**
 * Laapak Report System - Goals Routes
 * Handles all goals and achievements related endpoints
 */

const express = require('express');
const router = express.Router();
const { Goal, Achievement, Report, Client, Invoice } = require('../models');
const { adminAuth } = require('../middleware/auth');

// Get current month's goals
router.get('/current', adminAuth, async (req, res) => {
    try {
        const currentDate = new Date();
        const currentMonth = currentDate.toLocaleString('ar-SA', { month: 'long' });
        const currentYear = currentDate.getFullYear();

        // Get current month's goal
        let goal = await Goal.findOne({
            where: {
                month: currentMonth,
                year: currentYear,
                isActive: true
            }
        });

        // If no goal exists for current month, create a default one
        if (!goal) {
            // Get current month's statistics
            const startOfMonth = new Date(currentYear, currentDate.getMonth(), 1);
            const endOfMonth = new Date(currentYear, currentDate.getMonth() + 1, 0);

            const reportsCount = await Report.count({
                where: {
                    createdAt: {
                        [require('sequelize').Op.between]: [startOfMonth, endOfMonth]
                    }
                }
            });

            const clientsCount = await Client.count({
                where: {
                    createdAt: {
                        [require('sequelize').Op.between]: [startOfMonth, endOfMonth]
                    }
                }
            });

            // Create default goal based on current performance
            const defaultTarget = Math.max(15, reportsCount + 5); // At least 15 or current + 5

            goal = await Goal.create({
                month: currentMonth,
                year: currentYear,
                type: 'reports',
                title: `هدف ${currentMonth} ${currentYear}`,
                target: defaultTarget,
                current: reportsCount,
                unit: 'تقرير',
                createdBy: req.user.id
            });
        }

        // Update current value with real-time data
        const startOfMonth = new Date(currentYear, new Date().getMonth(), 1);
        const endOfMonth = new Date(currentYear, new Date().getMonth() + 1, 0);

        const currentReports = await Report.count({
            where: {
                createdAt: {
                    [require('sequelize').Op.between]: [startOfMonth, endOfMonth]
                }
            }
        });

        const currentClients = await Client.count({
            where: {
                createdAt: {
                    [require('sequelize').Op.between]: [startOfMonth, endOfMonth]
                }
            }
        });

        // Update goal with current values
        await goal.update({
            current: goal.type === 'reports' ? currentReports : currentClients
        });

        res.json(goal);
    } catch (error) {
        console.error('Error getting current goal:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update current month's goal
router.put('/current', adminAuth, async (req, res) => {
    try {
        const { target, title, type, unit } = req.body;
        const currentDate = new Date();
        const currentMonth = currentDate.toLocaleString('ar-SA', { month: 'long' });
        const currentYear = currentDate.getFullYear();

        let goal = await Goal.findOne({
            where: {
                month: currentMonth,
                year: currentYear,
                isActive: true
            }
        });

        if (!goal) {
            return res.status(404).json({ message: 'Goal not found' });
        }

        // Update goal
        await goal.update({
            target: target || goal.target,
            title: title || goal.title,
            type: type || goal.type,
            unit: unit || goal.unit
        });

        res.json(goal);
    } catch (error) {
        console.error('Error updating goal:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get achievements
router.get('/achievements', adminAuth, async (req, res) => {
    try {
        const achievements = await Achievement.findAll({
            where: { isActive: true },
            order: [['createdAt', 'DESC']],
            limit: 10
        });

        // Check for new achievements based on current data
        const newAchievements = await checkForNewAchievements(req.user.id);

        res.json({
            achievements: achievements,
            newAchievements: newAchievements
        });
    } catch (error) {
        console.error('Error getting achievements:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create new achievement
router.post('/achievements', adminAuth, async (req, res) => {
    try {
        const { title, description, metric, value, icon, color, type } = req.body;

        const achievement = await Achievement.create({
            title,
            description,
            metric,
            value,
            icon: icon || 'fas fa-trophy',
            color: color || '#007553',
            type: type || 'milestone',
            createdBy: req.user.id
        });

        res.json(achievement);
    } catch (error) {
        console.error('Error creating achievement:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Helper function to check for new achievements
async function checkForNewAchievements(adminId) {
    const newAchievements = [];

    try {
        // Get current statistics
        const totalReports = await Report.count();
        const totalClients = await Client.count();
        const totalInvoices = await Invoice.count();

        // Check for milestone achievements
        const milestones = [
            { value: 100, title: '100 تقرير', description: 'وصلنا لـ 100 تقرير!' },
            { value: 500, title: '500 تقرير', description: 'وصلنا لـ 500 تقرير!' },
            { value: 1000, title: '1000 تقرير', description: 'وصلنا لـ 1000 تقرير!' },
            { value: 50, title: '50 عميل', description: 'وصلنا لـ 50 عميل!' },
            { value: 100, title: '100 عميل', description: 'وصلنا لـ 100 عميل!' },
            { value: 200, title: '200 عميل', description: 'وصلنا لـ 200 عميل!' },
            { value: 500, title: '500 عميل', description: 'وصلنا لـ 500 عميل!' }
        ];

        for (const milestone of milestones) {
            // Check if this achievement already exists
            const existingAchievement = await Achievement.findOne({
                where: {
                    title: milestone.title,
                    metric: 'total_reports',
                    isActive: true
                }
            });

            if (!existingAchievement) {
                // Check if milestone is reached
                if (totalReports >= milestone.value && milestone.title.includes('تقرير')) {
                    const achievement = await Achievement.create({
                        title: milestone.title,
                        description: milestone.description,
                        metric: 'total_reports',
                        value: milestone.value,
                        type: 'milestone',
                        achievedAt: new Date(),
                        createdBy: adminId
                    });
                    newAchievements.push(achievement);
                }

                if (totalClients >= milestone.value && milestone.title.includes('عميل')) {
                    const achievement = await Achievement.create({
                        title: milestone.title,
                        description: milestone.description,
                        metric: 'total_clients',
                        value: milestone.value,
                        type: 'milestone',
                        achievedAt: new Date(),
                        createdBy: adminId
                    });
                    newAchievements.push(achievement);
                }
            }
        }

        // Check for monthly records
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const startOfMonth = new Date(currentYear, currentMonth, 1);
        const endOfMonth = new Date(currentYear, currentMonth + 1, 0);

        const monthlyReports = await Report.count({
            where: {
                createdAt: {
                    [require('sequelize').Op.between]: [startOfMonth, endOfMonth]
                }
            }
        });

        if (monthlyReports >= 20) {
            const existingRecord = await Achievement.findOne({
                where: {
                    title: 'رقم قياسي شهري',
                    metric: 'monthly_reports',
                    isActive: true
                }
            });

            if (!existingRecord) {
                const achievement = await Achievement.create({
                    title: 'رقم قياسي شهري',
                    description: `حققنا ${monthlyReports} تقرير في هذا الشهر!`,
                    metric: 'monthly_reports',
                    value: monthlyReports,
                    type: 'record',
                    achievedAt: new Date(),
                    createdBy: adminId
                });
                newAchievements.push(achievement);
            }
        }

    } catch (error) {
        console.error('Error checking for new achievements:', error);
    }

    return newAchievements;
}

module.exports = router; 