/**
 * Laapak Report System - Main Settings Manager
 * Coordinates all settings modules and provides a unified interface
 */

import { UserManager } from './user-manager.js';
import { BackupManager } from './backup-manager.js';
import { AppearanceManager } from './appearance-manager.js';
import { GeneralManager } from './general-manager.js';
import { showToast } from './settings-utils.js';

export class SettingsManager {
    constructor() {
        // Initialize all managers
        this.userManager = new UserManager();
        this.backupManager = new BackupManager();
        this.appearanceManager = new AppearanceManager();
        this.generalManager = new GeneralManager();
        
        // Set up event listeners
        this.setupEventListeners();
    }

    // Set up event listeners for settings page
    setupEventListeners() {
        document.addEventListener('DOMContentLoaded', () => {
            // Load all settings data
            this.loadAllSettings();
            
            // Set up tab navigation
            this.setupTabNavigation();
            
            // Set up form submissions
            this.setupFormSubmissions();
            
            // Set up user management
            this.setupUserManagement();
            
            // Set up backup management
            this.setupBackupManagement();
        });
    }

    // Load all settings data
    loadAllSettings() {
        // Load users
        this.userManager.loadUsers();
        
        // Load backup history
        this.backupManager.loadBackupHistory();
        
        // Load general settings
        this.generalManager.loadGeneralSettings();
        this.generalManager.loadNotificationSettings();
        this.generalManager.loadSecuritySettings();
        
        // Load appearance settings
        this.appearanceManager.loadAppearanceSettings();
    }

    // Set up tab navigation
    setupTabNavigation() {
        // Get all tab links
        const tabLinks = document.querySelectorAll('.nav-link[data-bs-toggle="tab"]');
        
        // Add click event listener to each tab link
        tabLinks.forEach(link => {
            link.addEventListener('click', () => {
                // Get the target tab
                const targetTab = link.getAttribute('data-bs-target');
                
                // Update URL hash
                if (targetTab) {
                    window.location.hash = targetTab.replace('#', '');
                }
            });
        });
        
        // Check if there's a hash in the URL
        if (window.location.hash) {
            // Get the tab link for the hash
            const tabLink = document.querySelector(`.nav-link[data-bs-target="${window.location.hash}"]`);
            
            // Activate the tab if it exists
            if (tabLink) {
                const tab = new bootstrap.Tab(tabLink);
                tab.show();
            }
        }
    }

    // Set up form submissions
    setupFormSubmissions() {
        // General settings form
        const generalSettingsForm = document.getElementById('generalSettingsForm');
        if (generalSettingsForm) {
            generalSettingsForm.addEventListener('submit', (event) => {
                event.preventDefault();
                
                // Get form data
                const formData = new FormData(generalSettingsForm);
                const generalData = {
                    companyName: formData.get('companyName'),
                    contactEmail: formData.get('contactEmail'),
                    contactPhone: formData.get('contactPhone'),
                    reportPrefix: formData.get('reportPrefix'),
                    language: formData.get('language'),
                    dateFormat: formData.get('dateFormat'),
                    enablePWA: formData.get('enablePWA') === 'on'
                };
                
                // Save general settings
                this.generalManager.saveGeneralSettings(generalData);
            });
        }
        
        // Notification settings form
        const notificationSettingsForm = document.getElementById('notificationSettingsForm');
        if (notificationSettingsForm) {
            notificationSettingsForm.addEventListener('submit', (event) => {
                event.preventDefault();
                
                // Get form data
                const formData = new FormData(notificationSettingsForm);
                const notificationData = {
                    emailNotifications: formData.get('emailNotifications') === 'on',
                    browserNotifications: formData.get('browserNotifications') === 'on',
                    reportReminders: formData.get('reportReminders') === 'on',
                    warrantyAlerts: formData.get('warrantyAlerts') === 'on',
                    clientReminders: formData.get('clientReminders') === 'on',
                    soundAlerts: formData.get('soundAlerts') === 'on'
                };
                
                // Save notification settings
                this.generalManager.saveNotificationSettings(notificationData);
            });
        }
        
        // Security settings form
        const securitySettingsForm = document.getElementById('securitySettingsForm');
        if (securitySettingsForm) {
            securitySettingsForm.addEventListener('submit', (event) => {
                event.preventDefault();
                
                // Get form data
                const formData = new FormData(securitySettingsForm);
                const securityData = {
                    passwordMinLength: parseInt(formData.get('passwordMinLength')),
                    requireSpecialChars: formData.get('requireSpecialChars') === 'on',
                    sessionTimeout: parseInt(formData.get('sessionTimeout')),
                    maxLoginAttempts: parseInt(formData.get('maxLoginAttempts')),
                    twoFactorAuth: formData.get('twoFactorAuth') === 'on'
                };
                
                // Save security settings
                this.generalManager.saveSecuritySettings(securityData);
            });
        }
        
        // Appearance settings form
        const appearanceSettingsForm = document.getElementById('appearanceSettingsForm');
        if (appearanceSettingsForm) {
            appearanceSettingsForm.addEventListener('submit', (event) => {
                event.preventDefault();
                
                // Get form data
                const formData = new FormData(appearanceSettingsForm);
                const appearanceData = {
                    darkMode: formData.get('darkMode') === 'on',
                    rtl: formData.get('rtl') === 'on',
                    fontSize: formData.get('fontSize'),
                    primaryColor: formData.get('primaryColor'),
                    secondaryColor: formData.get('secondaryColor')
                };
                
                // Save appearance settings
                this.appearanceManager.saveAppearanceSettings(appearanceData);
            });
        }
        
        // Logo upload form
        const logoUploadForm = document.getElementById('logoUploadForm');
        if (logoUploadForm) {
            logoUploadForm.addEventListener('submit', async (event) => {
                event.preventDefault();
                
                // Get file input
                const fileInput = document.getElementById('logoFile');
                
                // Upload logo
                try {
                    await this.generalManager.uploadLogo(fileInput);
                    
                    // Clear file input
                    fileInput.value = '';
                    
                    // Update logo preview if it exists
                    const logoPreview = document.getElementById('logoPreview');
                    if (logoPreview) {
                        const settings = this.generalManager.getSettings();
                        logoPreview.src = settings.general.logoPath;
                    }
                } catch (error) {
                    console.error('Error uploading logo:', error);
                }
            });
        }
    }

    // Set up user management
    setupUserManagement() {
        // Add user form
        const addUserForm = document.getElementById('addUserForm');
        if (addUserForm) {
            addUserForm.addEventListener('submit', async (event) => {
                event.preventDefault();
                
                // Get form data
                const formData = new FormData(addUserForm);
                const userData = {
                    username: formData.get('username'),
                    fullName: formData.get('fullName'),
                    email: formData.get('email'),
                    password: formData.get('password'),
                    role: formData.get('role')
                };
                
                // Validate password
                const confirmPassword = formData.get('confirmPassword');
                if (userData.password !== confirmPassword) {
                    showToast('كلمات المرور غير متطابقة', 'error');
                    return;
                }
                
                try {
                    // Add user
                    await this.userManager.addUser(userData);
                    
                    // Clear form
                    addUserForm.reset();
                    
                    // Close modal
                    const modal = bootstrap.Modal.getInstance(document.getElementById('addUserModal'));
                    if (modal) {
                        modal.hide();
                    }
                    
                    // Reload users
                    await this.userManager.loadUsers();
                } catch (error) {
                    console.error('Error adding user:', error);
                }
            });
        }
        
        // Edit user form
        const editUserForm = document.getElementById('editUserForm');
        if (editUserForm) {
            editUserForm.addEventListener('submit', async (event) => {
                event.preventDefault();
                
                // Get form data
                const formData = new FormData(editUserForm);
                const userId = parseInt(formData.get('userId'));
                const userData = {
                    username: formData.get('username'),
                    fullName: formData.get('fullName'),
                    email: formData.get('email'),
                    role: formData.get('role'),
                    status: formData.get('status')
                };
                
                try {
                    // Update user
                    await this.userManager.updateUser(userId, userData);
                    
                    // Clear form
                    editUserForm.reset();
                    
                    // Close modal
                    const modal = bootstrap.Modal.getInstance(document.getElementById('editUserModal'));
                    if (modal) {
                        modal.hide();
                    }
                    
                    // Reload users
                    await this.userManager.loadUsers();
                } catch (error) {
                    console.error('Error updating user:', error);
                }
            });
        }
        
        // Change password form
        const changePasswordForm = document.getElementById('changePasswordForm');
        if (changePasswordForm) {
            changePasswordForm.addEventListener('submit', async (event) => {
                event.preventDefault();
                
                // Get form data
                const formData = new FormData(changePasswordForm);
                const userId = parseInt(formData.get('userId'));
                const newPassword = formData.get('newPassword');
                const confirmPassword = formData.get('confirmPassword');
                
                // Validate password
                if (newPassword !== confirmPassword) {
                    showToast('كلمات المرور غير متطابقة', 'error');
                    return;
                }
                
                try {
                    // Change password
                    await this.userManager.changePassword(userId, newPassword);
                    
                    // Clear form
                    changePasswordForm.reset();
                    
                    // Close modal
                    const modal = bootstrap.Modal.getInstance(document.getElementById('changePasswordModal'));
                    if (modal) {
                        modal.hide();
                    }
                } catch (error) {
                    console.error('Error changing password:', error);
                }
            });
        }
        
        // Set up user table event delegation
        const usersTableBody = document.getElementById('usersTableBody');
        if (usersTableBody) {
            usersTableBody.addEventListener('click', async (event) => {
                // Edit user
                if (event.target.closest('.edit-user')) {
                    event.preventDefault();
                    
                    const link = event.target.closest('.edit-user');
                    const userId = parseInt(link.getAttribute('data-id'));
                    
                    // Get user data
                    const user = await this.userManager.getUserById(userId);
                    if (!user) {
                        showToast('لم يتم العثور على المستخدم', 'error');
                        return;
                    }
                    
                    // Populate edit form
                    const editUserForm = document.getElementById('editUserForm');
                    if (editUserForm) {
                        editUserForm.elements['userId'].value = user.id;
                        editUserForm.elements['username'].value = user.username;
                        editUserForm.elements['fullName'].value = user.fullName;
                        editUserForm.elements['email'].value = user.email;
                        editUserForm.elements['role'].value = user.role;
                        editUserForm.elements['status'].value = user.status;
                    }
                    
                    // Show edit modal
                    const modal = new bootstrap.Modal(document.getElementById('editUserModal'));
                    modal.show();
                }
                
                // Change password
                if (event.target.closest('.change-password')) {
                    event.preventDefault();
                    
                    const link = event.target.closest('.change-password');
                    const userId = parseInt(link.getAttribute('data-id'));
                    
                    // Populate change password form
                    const changePasswordForm = document.getElementById('changePasswordForm');
                    if (changePasswordForm) {
                        changePasswordForm.elements['userId'].value = userId;
                    }
                    
                    // Show change password modal
                    const modal = new bootstrap.Modal(document.getElementById('changePasswordModal'));
                    modal.show();
                }
                
                // Delete user
                if (event.target.closest('.delete-user')) {
                    event.preventDefault();
                    
                    const link = event.target.closest('.delete-user');
                    const userId = parseInt(link.getAttribute('data-id'));
                    
                    // Confirm deletion
                    if (confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
                        try {
                            // Delete user
                            await this.userManager.deleteUser(userId);
                            
                            // Reload users
                            await this.userManager.loadUsers();
                        } catch (error) {
                            console.error('Error deleting user:', error);
                        }
                    }
                }
            });
        }
    }

    // Set up backup management
    setupBackupManagement() {
        // Create backup button
        const createBackupBtn = document.getElementById('createBackupBtn');
        if (createBackupBtn) {
            createBackupBtn.addEventListener('click', async () => {
                await this.backupManager.createBackup();
                await this.backupManager.loadBackupHistory();
            });
        }
        
        // Restore backup button
        const restoreBackupBtn = document.getElementById('restoreBackupBtn');
        if (restoreBackupBtn) {
            restoreBackupBtn.addEventListener('click', async () => {
                await this.backupManager.restoreBackup();
            });
        }
        
        // Backup settings form
        const backupSettingsForm = document.getElementById('backupSettingsForm');
        if (backupSettingsForm) {
            backupSettingsForm.addEventListener('submit', (event) => {
                event.preventDefault();
                
                // Get form data
                const formData = new FormData(backupSettingsForm);
                const backupData = {
                    autoBackup: formData.get('autoBackup') === 'on',
                    backupFrequency: formData.get('backupFrequency'),
                    backupTime: formData.get('backupTime'),
                    keepBackups: parseInt(formData.get('keepBackups'))
                };
                
                // Save backup settings
                const settings = this.backupManager.getSettings();
                settings.backup = {
                    ...settings.backup,
                    ...backupData
                };
                this.backupManager.saveSettings(settings);
                
                // Show success message
                showToast('تم حفظ إعدادات النسخ الاحتياطي بنجاح', 'success');
                
                // Set up auto backup
                this.backupManager.setupAutoBackup();
            });
        }
    }
}
