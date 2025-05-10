/**
 * Laapak Report System - Backup Management Module
 * Handles all backup-related functionality including backup creation and restoration
 */

import { showToast } from './settings-utils.js';

export class BackupManager {
    constructor() {
        this.initializeBackupSettings();
    }

    // Initialize backup settings in localStorage if not present
    initializeBackupSettings() {
        const settings = this.getSettings();
        if (!settings.backup) {
            settings.backup = {
                autoBackup: true,
                backupFrequency: 'daily',
                backupTime: '00:00',
                keepBackups: 30,
                lastBackup: null
            };
            this.saveSettings(settings);
        }
    }

    // Get settings from localStorage
    getSettings() {
        return JSON.parse(localStorage.getItem('lpk_settings') || '{}');
    }

    // Save settings to localStorage
    saveSettings(settings) {
        localStorage.setItem('lpk_settings', JSON.stringify(settings));
    }

    // Create a backup of all system data
    async createBackup() {
        try {
            // In a real app, this would create an actual backup file
            // For this prototype, we'll simulate the backup process
            
            // Show loading indicator
            showToast('جاري إنشاء نسخة احتياطية...', 'info');
            
            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Get all data from localStorage
            const backupData = {
                timestamp: new Date().toISOString(),
                version: '1.0.0',
                data: {
                    settings: localStorage.getItem('lpk_settings'),
                    users: localStorage.getItem('lpk_users'),
                    clients: localStorage.getItem('lpk_clients'),
                    reports: localStorage.getItem('lpk_reports'),
                    templates: localStorage.getItem('lpk_templates')
                }
            };
            
            // In a real app, we would send this data to the server or download it
            console.log('Backup created:', backupData);
            
            // Update last backup timestamp
            const settings = this.getSettings();
            settings.backup.lastBackup = new Date().toISOString();
            this.saveSettings(settings);
            
            // Show success message
            showToast('تم إنشاء نسخة احتياطية بنجاح', 'success');
            
            return true;
        } catch (error) {
            console.error('Error creating backup:', error);
            showToast('فشل في إنشاء نسخة احتياطية', 'error');
            return false;
        }
    }

    // Restore from a backup file
    async restoreBackup(backupFile = null) {
        try {
            // In a real app, this would upload and restore from a backup file
            // For this prototype, we'll simulate the restore process
            
            if (!confirm('هل أنت متأكد من استعادة النسخة الاحتياطية؟ سيتم استبدال جميع البيانات الحالية.')) {
                return false;
            }
            
            // Show loading indicator
            showToast('جاري استعادة البيانات...', 'info');
            
            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // In a real app, we would process the backup file and restore the data
            console.log('Backup restored');
            
            // Show success message
            showToast('تمت استعادة البيانات بنجاح', 'success');
            
            // Reload page after 2 seconds
            setTimeout(() => {
                window.location.reload();
            }, 2000);
            
            return true;
        } catch (error) {
            console.error('Error restoring backup:', error);
            showToast('فشل في استعادة البيانات', 'error');
            return false;
        }
    }

    // Schedule automatic backups
    setupAutoBackup() {
        const settings = this.getSettings();
        
        if (!settings.backup || !settings.backup.autoBackup) {
            console.log('Auto backup is disabled');
            return;
        }
        
        console.log('Auto backup is enabled, frequency:', settings.backup.backupFrequency);
        
        // In a real app, we would set up a scheduled task based on frequency
        // For this prototype, we'll just log the settings
        
        // Example of how this might work in a real app:
        switch (settings.backup.backupFrequency) {
            case 'daily':
                console.log('Daily backup scheduled at', settings.backup.backupTime);
                break;
            case 'weekly':
                console.log('Weekly backup scheduled');
                break;
            case 'monthly':
                console.log('Monthly backup scheduled');
                break;
        }
    }

    // Get backup history (in a real app, this would fetch from server)
    async getBackupHistory() {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Return sample backup history
        return [
            {
                id: 1,
                timestamp: '2025-05-09T12:30:45',
                size: '2.3 MB',
                status: 'success',
                type: 'auto'
            },
            {
                id: 2,
                timestamp: '2025-05-08T08:15:22',
                size: '2.2 MB',
                status: 'success',
                type: 'manual'
            },
            {
                id: 3,
                timestamp: '2025-05-07T00:00:12',
                size: '2.1 MB',
                status: 'success',
                type: 'auto'
            }
        ];
    }

    // Load backup history into the table
    async loadBackupHistory(tableBodyId = 'backupHistoryTable') {
        const tableBody = document.getElementById(tableBodyId);
        if (!tableBody) return;
        
        try {
            // Show loading indicator
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center py-4">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                        <p class="mt-2 mb-0">جاري تحميل سجل النسخ الاحتياطية...</p>
                    </td>
                </tr>
            `;
            
            // Get backup history
            const backupHistory = await this.getBackupHistory();
            tableBody.innerHTML = '';
            
            if (backupHistory.length === 0) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="5" class="text-center py-4">
                            <i class="fas fa-history fa-3x mb-3 text-muted"></i>
                            <p class="mb-0">لا يوجد سجل للنسخ الاحتياطية</p>
                        </td>
                    </tr>
                `;
                return;
            }
            
            // Add backup history rows
            backupHistory.forEach((backup, index) => {
                const row = document.createElement('tr');
                
                // Format date
                const date = new Date(backup.timestamp);
                const formattedDate = date.toLocaleDateString('ar-SA', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
                
                // Format type badge
                const typeBadgeClass = backup.type === 'auto' ? 'bg-info' : 'bg-primary';
                const typeText = backup.type === 'auto' ? 'تلقائي' : 'يدوي';
                
                // Format status badge
                const statusBadgeClass = backup.status === 'success' ? 'bg-success' : 'bg-danger';
                const statusText = backup.status === 'success' ? 'ناجح' : 'فاشل';
                
                row.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${formattedDate}</td>
                    <td>
                        <span class="badge ${typeBadgeClass}">${typeText}</span>
                    </td>
                    <td>
                        <span class="badge ${statusBadgeClass}">${statusText}</span>
                    </td>
                    <td>${backup.size}</td>
                `;
                
                tableBody.appendChild(row);
            });
            
        } catch (error) {
            console.error('Error loading backup history:', error);
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center py-4">
                        <i class="fas fa-exclamation-triangle fa-3x mb-3 text-warning"></i>
                        <p class="mb-0">فشل في تحميل سجل النسخ الاحتياطية</p>
                    </td>
                </tr>
            `;
        }
    }
}
