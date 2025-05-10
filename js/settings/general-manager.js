/**
 * Laapak Report System - General Settings Management Module
 * Handles general system settings including company info, language, and notifications
 */

import { defaultSettings } from './settings-constants.js';
import { showToast } from './settings-utils.js';

export class GeneralManager {
    constructor() {
        this.initializeGeneralSettings();
    }

    // Initialize general settings in localStorage if not present
    initializeGeneralSettings() {
        const settings = this.getSettings();
        if (!settings.general) {
            settings.general = defaultSettings.general;
            this.saveSettings(settings);
        }
        
        if (!settings.notifications) {
            settings.notifications = defaultSettings.notifications;
            this.saveSettings(settings);
        }
        
        if (!settings.security) {
            settings.security = defaultSettings.security;
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

    // Save general settings
    saveGeneralSettings(generalData) {
        try {
            // Get current settings
            const settings = this.getSettings();
            
            // Update general settings
            settings.general = {
                ...settings.general,
                ...generalData
            };
            
            // Save settings
            this.saveSettings(settings);
            
            // Show success message
            showToast('تم حفظ الإعدادات العامة بنجاح', 'success');
            
            return true;
        } catch (error) {
            console.error('Error saving general settings:', error);
            showToast('فشل في حفظ الإعدادات العامة', 'error');
            return false;
        }
    }

    // Save notification settings
    saveNotificationSettings(notificationData) {
        try {
            // Get current settings
            const settings = this.getSettings();
            
            // Update notification settings
            settings.notifications = {
                ...settings.notifications,
                ...notificationData
            };
            
            // Save settings
            this.saveSettings(settings);
            
            // Show success message
            showToast('تم حفظ إعدادات الإشعارات بنجاح', 'success');
            
            return true;
        } catch (error) {
            console.error('Error saving notification settings:', error);
            showToast('فشل في حفظ إعدادات الإشعارات', 'error');
            return false;
        }
    }

    // Save security settings
    saveSecuritySettings(securityData) {
        try {
            // Get current settings
            const settings = this.getSettings();
            
            // Update security settings
            settings.security = {
                ...settings.security,
                ...securityData
            };
            
            // Save settings
            this.saveSettings(settings);
            
            // Show success message
            showToast('تم حفظ إعدادات الأمان بنجاح', 'success');
            
            return true;
        } catch (error) {
            console.error('Error saving security settings:', error);
            showToast('فشل في حفظ إعدادات الأمان', 'error');
            return false;
        }
    }

    // Load general settings into form
    loadGeneralSettings(formId = 'generalSettingsForm') {
        const form = document.getElementById(formId);
        if (!form) return;
        
        const settings = this.getSettings();
        const general = settings.general || defaultSettings.general;
        
        // Set form values
        const companyNameInput = form.querySelector('#companyName');
        if (companyNameInput) {
            companyNameInput.value = general.companyName;
        }
        
        const contactEmailInput = form.querySelector('#contactEmail');
        if (contactEmailInput) {
            contactEmailInput.value = general.contactEmail;
        }
        
        const contactPhoneInput = form.querySelector('#contactPhone');
        if (contactPhoneInput) {
            contactPhoneInput.value = general.contactPhone;
        }
        
        const reportPrefixInput = form.querySelector('#reportPrefix');
        if (reportPrefixInput) {
            reportPrefixInput.value = general.reportPrefix;
        }
        
        const languageSelect = form.querySelector('#language');
        if (languageSelect) {
            languageSelect.value = general.language;
        }
        
        const dateFormatSelect = form.querySelector('#dateFormat');
        if (dateFormatSelect) {
            dateFormatSelect.value = general.dateFormat;
        }
        
        const enablePWASwitch = form.querySelector('#enablePWA');
        if (enablePWASwitch) {
            enablePWASwitch.checked = general.enablePWA;
        }
    }

    // Load notification settings into form
    loadNotificationSettings(formId = 'notificationSettingsForm') {
        const form = document.getElementById(formId);
        if (!form) return;
        
        const settings = this.getSettings();
        const notifications = settings.notifications || defaultSettings.notifications;
        
        // Set form values
        const emailNotificationsSwitch = form.querySelector('#emailNotifications');
        if (emailNotificationsSwitch) {
            emailNotificationsSwitch.checked = notifications.emailNotifications;
        }
        
        const browserNotificationsSwitch = form.querySelector('#browserNotifications');
        if (browserNotificationsSwitch) {
            browserNotificationsSwitch.checked = notifications.browserNotifications;
        }
        
        const reportRemindersSwitch = form.querySelector('#reportReminders');
        if (reportRemindersSwitch) {
            reportRemindersSwitch.checked = notifications.reportReminders;
        }
        
        const warrantyAlertsSwitch = form.querySelector('#warrantyAlerts');
        if (warrantyAlertsSwitch) {
            warrantyAlertsSwitch.checked = notifications.warrantyAlerts;
        }
        
        const clientRemindersSwitch = form.querySelector('#clientReminders');
        if (clientRemindersSwitch) {
            clientRemindersSwitch.checked = notifications.clientReminders;
        }
        
        const soundAlertsSwitch = form.querySelector('#soundAlerts');
        if (soundAlertsSwitch) {
            soundAlertsSwitch.checked = notifications.soundAlerts;
        }
    }

    // Load security settings into form
    loadSecuritySettings(formId = 'securitySettingsForm') {
        const form = document.getElementById(formId);
        if (!form) return;
        
        const settings = this.getSettings();
        const security = settings.security || defaultSettings.security;
        
        // Set form values
        const passwordMinLengthInput = form.querySelector('#passwordMinLength');
        if (passwordMinLengthInput) {
            passwordMinLengthInput.value = security.passwordMinLength;
        }
        
        const requireSpecialCharsSwitch = form.querySelector('#requireSpecialChars');
        if (requireSpecialCharsSwitch) {
            requireSpecialCharsSwitch.checked = security.requireSpecialChars;
        }
        
        const sessionTimeoutInput = form.querySelector('#sessionTimeout');
        if (sessionTimeoutInput) {
            sessionTimeoutInput.value = security.sessionTimeout;
        }
        
        const maxLoginAttemptsInput = form.querySelector('#maxLoginAttempts');
        if (maxLoginAttemptsInput) {
            maxLoginAttemptsInput.value = security.maxLoginAttempts;
        }
        
        const twoFactorAuthSwitch = form.querySelector('#twoFactorAuth');
        if (twoFactorAuthSwitch) {
            twoFactorAuthSwitch.checked = security.twoFactorAuth;
        }
    }

    // Upload company logo
    async uploadLogo(fileInput) {
        try {
            if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
                throw new Error('لم يتم اختيار ملف');
            }
            
            const file = fileInput.files[0];
            
            // Check file type
            if (!file.type.match('image.*')) {
                throw new Error('يرجى اختيار ملف صورة صالح');
            }
            
            // Check file size (max 2MB)
            if (file.size > 2 * 1024 * 1024) {
                throw new Error('حجم الملف كبير جدًا. الحد الأقصى هو 2 ميجابايت');
            }
            
            // In a real app, we would upload the file to the server
            // For this prototype, we'll use FileReader to get a data URL
            
            // Show loading indicator
            showToast('جاري رفع الشعار...', 'info');
            
            // Read file as data URL
            const reader = new FileReader();
            
            const logoUrl = await new Promise((resolve, reject) => {
                reader.onload = () => resolve(reader.result);
                reader.onerror = () => reject(new Error('فشل في قراءة الملف'));
                reader.readAsDataURL(file);
            });
            
            // Update settings
            const settings = this.getSettings();
            settings.general = settings.general || defaultSettings.general;
            settings.general.logoPath = logoUrl;
            this.saveSettings(settings);
            
            // Show success message
            showToast('تم رفع الشعار بنجاح', 'success');
            
            return logoUrl;
        } catch (error) {
            console.error('Error uploading logo:', error);
            showToast(error.message || 'فشل في رفع الشعار', 'error');
            throw error;
        }
    }

    // Request browser notifications permission
    async requestNotificationsPermission() {
        try {
            if (!('Notification' in window)) {
                throw new Error('هذا المتصفح لا يدعم الإشعارات');
            }
            
            // Check if permission is already granted
            if (Notification.permission === 'granted') {
                showToast('تم منح إذن الإشعارات بالفعل', 'success');
                return true;
            }
            
            // Request permission
            const permission = await Notification.requestPermission();
            
            if (permission === 'granted') {
                showToast('تم منح إذن الإشعارات بنجاح', 'success');
                return true;
            } else {
                showToast('تم رفض إذن الإشعارات', 'warning');
                return false;
            }
        } catch (error) {
            console.error('Error requesting notifications permission:', error);
            showToast('فشل في طلب إذن الإشعارات', 'error');
            return false;
        }
    }

    // Show a test notification
    showTestNotification() {
        try {
            if (!('Notification' in window)) {
                throw new Error('هذا المتصفح لا يدعم الإشعارات');
            }
            
            if (Notification.permission !== 'granted') {
                throw new Error('لم يتم منح إذن الإشعارات');
            }
            
            // Create notification
            const notification = new Notification('Laapak Report System', {
                body: 'هذا إشعار تجريبي من نظام Laapak للتقارير',
                icon: 'img/logo.png'
            });
            
            // Close notification after 5 seconds
            setTimeout(() => notification.close(), 5000);
            
            return true;
        } catch (error) {
            console.error('Error showing test notification:', error);
            showToast(error.message || 'فشل في عرض الإشعار التجريبي', 'error');
            return false;
        }
    }
}
