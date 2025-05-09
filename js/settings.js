/**
 * Laapak Report System - Settings Management JavaScript
 * Handles all system settings, user management, backups, and configuration
 * 
 * Features:
 * - General system settings management
 * - User management (create, edit, delete admins/technicians)
 * - User permissions and roles
 * - Notification settings
 * - Data backup and restore
 * - System theme and appearance
 */

// Models and data structures
const ROLES = {
    ADMIN: 'admin',
    TECHNICIAN: 'technician',
    VIEWER: 'viewer'
};

const PERMISSIONS = {
    MANAGE_USERS: 'manage_users',
    MANAGE_SETTINGS: 'manage_settings',
    CREATE_REPORTS: 'create_reports',
    EDIT_REPORTS: 'edit_reports',
    VIEW_REPORTS: 'view_reports',
    MANAGE_CLIENTS: 'manage_clients',
    MANAGE_BACKUPS: 'manage_backups'
};

// Default role permissions
const ROLE_PERMISSIONS = {
    [ROLES.ADMIN]: [
        PERMISSIONS.MANAGE_USERS,
        PERMISSIONS.MANAGE_SETTINGS,
        PERMISSIONS.CREATE_REPORTS,
        PERMISSIONS.EDIT_REPORTS,
        PERMISSIONS.VIEW_REPORTS,
        PERMISSIONS.MANAGE_CLIENTS,
        PERMISSIONS.MANAGE_BACKUPS
    ],
    [ROLES.TECHNICIAN]: [
        PERMISSIONS.CREATE_REPORTS,
        PERMISSIONS.EDIT_REPORTS,
        PERMISSIONS.VIEW_REPORTS,
        PERMISSIONS.MANAGE_CLIENTS
    ],
    [ROLES.VIEWER]: [
        PERMISSIONS.VIEW_REPORTS
    ]
};

// Sample users (will be stored in localStorage)
const sampleUsers = [
    {
        id: 1,
        username: 'admin',
        fullName: 'أحمد محمد',
        email: 'admin@laapak.com',
        passwordHash: 'hashed_password_here', // In a real app, this would be properly hashed
        role: ROLES.ADMIN,
        status: 'active',
        avatar: null,
        lastLogin: '2025-05-08T18:30:00',
        createdAt: '2025-01-01T00:00:00'
    },
    {
        id: 2,
        username: 'tech1',
        fullName: 'سارة علي',
        email: 'sara@laapak.com',
        passwordHash: 'hashed_password_here',
        role: ROLES.TECHNICIAN,
        status: 'active',
        avatar: null,
        lastLogin: '2025-05-07T14:22:10',
        createdAt: '2025-01-15T00:00:00'
    },
    {
        id: 3,
        username: 'tech2',
        fullName: 'محمد خالد',
        email: 'mohamed@laapak.com',
        passwordHash: 'hashed_password_here',
        role: ROLES.TECHNICIAN,
        status: 'suspended',
        avatar: null,
        lastLogin: '2025-04-20T09:15:45',
        createdAt: '2025-02-01T00:00:00'
    }
];

// Default system settings
const defaultSettings = {
    general: {
        companyName: 'Laapak',
        contactEmail: 'info@laapak.com',
        contactPhone: '+966 123456789',
        reportPrefix: 'LAP-',
        language: 'ar',
        dateFormat: 'DD-MM-YYYY',
        enablePWA: true,
        logoPath: 'img/logo.png',
        theme: 'light'
    },
    appearance: {
        primaryColor: '#007553',
        secondaryColor: '#6c757d',
        darkMode: false,
        rtl: true,
        fontSize: 'medium'
    },
    notifications: {
        emailNotifications: true,
        browserNotifications: true,
        reportReminders: true,
        warrantyAlerts: true,
        clientReminders: true,
        soundAlerts: true
    },
    backup: {
        autoBackup: true,
        backupFrequency: 'daily',
        backupTime: '00:00',
        keepBackups: 30,
        lastBackup: null
    },
    security: {
        passwordMinLength: 8,
        requireSpecialChars: true,
        sessionTimeout: 30, // minutes
        maxLoginAttempts: 5,
        twoFactorAuth: false
    }
};

// Utility functions
function generateAvatarUrl(fullName) {
    if (!fullName) return null;
    const initials = fullName.split(' ')
        .map(name => name.charAt(0).toUpperCase())
        .join('')
        .substring(0, 2);
    return `https://ui-avatars.com/api/?name=${initials}&background=007553&color=fff&size=128&rounded=true&bold=true`;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Main settings controller class
class SettingsManager {
    constructor() {
        this.initializeData();
        this.setupEventListeners();
        this.loadSettings();
        this.loadUsers();
    }

    // Initialize data in localStorage if not present
    initializeData() {
        if (!localStorage.getItem('lpk_users')) {
            localStorage.setItem('lpk_users', JSON.stringify(sampleUsers));
        }

        if (!localStorage.getItem('lpk_settings')) {
            localStorage.setItem('lpk_settings', JSON.stringify(defaultSettings));
        }
    }
    
    // Get users from localStorage
    getUsers() {
        return JSON.parse(localStorage.getItem('lpk_users') || '[]');
    }

    // Save users to localStorage
    saveUsers(users) {
        localStorage.setItem('lpk_users', JSON.stringify(users));
    }

    // Get settings from localStorage
    getSettings() {
        return JSON.parse(localStorage.getItem('lpk_settings') || JSON.stringify(defaultSettings));
    }

    // Save settings to localStorage
    saveSettings(settings) {
        localStorage.setItem('lpk_settings', JSON.stringify(settings));
    }
    
    // Load all settings into the forms
    loadSettings() {
        const settings = this.getSettings();
        
        // General settings
        const companyNameField = document.getElementById('companyName');
        const contactEmailField = document.getElementById('contactEmail');
        const contactPhoneField = document.getElementById('contactPhone');
        const reportPrefixField = document.getElementById('reportPrefix');
        const languageField = document.getElementById('language');
        const dateFormatField = document.getElementById('dateFormat');
        const enablePWAField = document.getElementById('enablePWA');
        
        if (companyNameField) companyNameField.value = settings.general.companyName;
        if (contactEmailField) contactEmailField.value = settings.general.contactEmail;
        if (contactPhoneField) contactPhoneField.value = settings.general.contactPhone;
        if (reportPrefixField) reportPrefixField.value = settings.general.reportPrefix;
        if (languageField) this.setSelectValue(languageField, settings.general.language);
        if (dateFormatField) this.setSelectValue(dateFormatField, settings.general.dateFormat);
        if (enablePWAField) enablePWAField.checked = settings.general.enablePWA;
        
        // Appearance settings
        const primaryColorField = document.getElementById('primaryColor');
        const darkModeField = document.getElementById('darkMode');
        const fontSizeField = document.getElementById('fontSize');
        
        if (primaryColorField) primaryColorField.value = settings.appearance.primaryColor;
        if (darkModeField) darkModeField.checked = settings.appearance.darkMode;
        if (fontSizeField) this.setSelectValue(fontSizeField, settings.appearance.fontSize);
        
        // Notification settings
        const emailNotificationsField = document.getElementById('emailNotifications');
        const browserNotificationsField = document.getElementById('browserNotifications');
        const reportRemindersField = document.getElementById('reportReminders');
        const warrantyAlertsField = document.getElementById('warrantyAlerts');
        const soundAlertsField = document.getElementById('soundAlerts');
        
        if (emailNotificationsField) emailNotificationsField.checked = settings.notifications.emailNotifications;
        if (browserNotificationsField) browserNotificationsField.checked = settings.notifications.browserNotifications;
        if (reportRemindersField) reportRemindersField.checked = settings.notifications.reportReminders;
        if (warrantyAlertsField) warrantyAlertsField.checked = settings.notifications.warrantyAlerts;
        if (soundAlertsField) soundAlertsField.checked = settings.notifications.soundAlerts;
        
        // Backup settings
        const autoBackupField = document.getElementById('autoBackup');
        const backupFrequencyField = document.getElementById('backupFrequency');
        const keepBackupsField = document.getElementById('keepBackups');
        
        if (autoBackupField) autoBackupField.checked = settings.backup.autoBackup;
        if (backupFrequencyField) this.setSelectValue(backupFrequencyField, settings.backup.backupFrequency);
        if (keepBackupsField) keepBackupsField.value = settings.backup.keepBackups;
        
        // Apply theme if dark mode is enabled
        if (settings.appearance.darkMode) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
        
        // Apply custom CSS variables for primary color
        document.documentElement.style.setProperty('--primary-color', settings.appearance.primaryColor);
    }
    
    // Load users into the users table
    loadUsers() {
        const users = this.getUsers();
        const usersTableBody = document.getElementById('usersTableBody');
        
        if (!usersTableBody) return;
        
        // Clear existing rows
        usersTableBody.innerHTML = '';
        
        // Add user rows
        users.forEach(user => {
            const row = document.createElement('tr');
            
            // Create avatar with initials
            const avatarUrl = user.avatar || generateAvatarUrl(user.fullName);
            
            // Format status badge
            const statusBadgeClass = user.status === 'active' ? 'bg-success' : 'bg-warning text-dark';
            const statusText = user.status === 'active' ? 'نشط' : 'معلق';
            
            // Format role badge
            const roleBadgeClass = user.role === ROLES.ADMIN ? 'bg-primary' : user.role === ROLES.TECHNICIAN ? 'bg-info' : 'bg-secondary';
            const roleText = user.role === ROLES.ADMIN ? 'مدير' : user.role === ROLES.TECHNICIAN ? 'فني' : 'مستخدم';
            
            // Create row content
            row.innerHTML = `
                <td>${user.id}</td>
                <td>
                    <div class="d-flex align-items-center">
                        <div class="avatar-circle me-3" style="background-image: url('${avatarUrl}'); width: 40px; height: 40px;"></div>
                        <div>
                            <div class="fw-bold">${user.fullName}</div>
                            <div class="small text-muted">${user.username}</div>
                        </div>
                    </div>
                </td>
                <td>${user.email}</td>
                <td><span class="badge ${roleBadgeClass}">${roleText}</span></td>
                <td><span class="badge ${statusBadgeClass}">${statusText}</span></td>
                <td class="text-center">
                    <div class="dropdown">
                        <button class="btn btn-sm btn-light rounded-circle p-1 border-0 shadow-sm" data-bs-toggle="dropdown" aria-expanded="false" style="width: 28px; height: 28px;">
                            <i class="fas fa-ellipsis-v" style="font-size: 12px;"></i>
                        </button>
                        <ul class="dropdown-menu dropdown-menu-end shadow" style="border-radius: 10px; border: none;">
                            <li><a class="dropdown-item py-2" href="#" onclick="settingsManager.editUser(${user.id}); return false;"><i class="fas fa-edit me-2 text-warning"></i> تعديل</a></li>
                            <li><a class="dropdown-item py-2" href="#" onclick="settingsManager.changePassword(${user.id}); return false;"><i class="fas fa-key me-2 text-primary"></i> تغيير كلمة المرور</a></li>
                            <li><hr class="dropdown-divider"></li>
                            <li>
                                <a class="dropdown-item py-2 ${user.role === ROLES.ADMIN && users.filter(u => u.role === ROLES.ADMIN).length <= 1 ? 'disabled' : ''}" 
                                   href="#" onclick="${user.role === ROLES.ADMIN && users.filter(u => u.role === ROLES.ADMIN).length <= 1 ? 'alert(\'لا يمكن حذف المدير الوحيد\')' : `settingsManager.deleteUser(${user.id})`}; return false;">
                                    <i class="fas fa-trash me-2 text-danger"></i> حذف
                                </a>
                            </li>
                        </ul>
                    </div>
                </td>
            `;
            
            usersTableBody.appendChild(row);
        });
    }
    
    // Helper function to set select field value
    setSelectValue(selectElement, value) {
        for (let i = 0; i < selectElement.options.length; i++) {
            if (selectElement.options[i].value === value) {
                selectElement.selectedIndex = i;
                break;
            }
        }
    }
    
    // Setup all event listeners for settings functionality
    setupEventListeners() {
        // General settings form
        const generalSettingsForm = document.getElementById('generalSettingsForm');
        if (generalSettingsForm) {
            generalSettingsForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveGeneralSettings();
            });
        }
        
        // Add user button
        const addUserBtn = document.getElementById('addUserBtn');
        if (addUserBtn) {
            addUserBtn.addEventListener('click', () => {
                this.showAddUserModal();
            });
        }
        
        // Add user form
        const addUserForm = document.getElementById('addUserForm');
        if (addUserForm) {
            addUserForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveNewUser();
            });
        }
        
        // Appearance settings form
        const appearanceForm = document.getElementById('appearanceSettingsForm');
        if (appearanceForm) {
            appearanceForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveAppearanceSettings();
            });
        }
        
        // Notification settings form
        const notificationsForm = document.getElementById('notificationsForm');
        if (notificationsForm) {
            notificationsForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveNotificationSettings();
            });
        }
        
        // Backup settings form
        const backupForm = document.getElementById('backupForm');
        if (backupForm) {
            backupForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveBackupSettings();
            });
        }
        
        // Manual backup button
        const manualBackupBtn = document.getElementById('manualBackupBtn');
        if (manualBackupBtn) {
            manualBackupBtn.addEventListener('click', () => {
                this.createBackup();
            });
        }
        
        // Restore backup button
        const restoreBackupBtn = document.getElementById('restoreBackupBtn');
        if (restoreBackupBtn) {
            restoreBackupBtn.addEventListener('click', () => {
                this.restoreBackup();
            });
        }
        
        // Live preview of appearance changes
        const primaryColorField = document.getElementById('primaryColor');
        if (primaryColorField) {
            primaryColorField.addEventListener('input', () => {
                document.documentElement.style.setProperty('--primary-color', primaryColorField.value);
            });
        }
        
        const darkModeField = document.getElementById('darkMode');
        if (darkModeField) {
            darkModeField.addEventListener('change', () => {
                if (darkModeField.checked) {
                    document.body.classList.add('dark-mode');
                } else {
                    document.body.classList.remove('dark-mode');
                }
            });
        }
        
        // Handle tab navigation and keep state in local storage
        const settingsTabs = document.getElementById('settingsTabs');
        if (settingsTabs) {
            const tabLinks = settingsTabs.querySelectorAll('[data-bs-toggle="tab"]');
            
            // Restore active tab from local storage if available
            const activeTabId = localStorage.getItem('activeSettingsTab');
            if (activeTabId) {
                const tabToActivate = document.getElementById(activeTabId);
                if (tabToActivate) {
                    const tab = new bootstrap.Tab(tabToActivate);
                    tab.show();
                }
            }
            
            // Store active tab in local storage when changed
            tabLinks.forEach(tabLink => {
                tabLink.addEventListener('shown.bs.tab', (e) => {
                    localStorage.setItem('activeSettingsTab', e.target.id);
                });
            });
        }
    }
    
    // Save general settings
    saveGeneralSettings() {
        const settings = this.getSettings();
        
        // Get form values
        const companyName = document.getElementById('companyName').value;
        const contactEmail = document.getElementById('contactEmail').value;
        const contactPhone = document.getElementById('contactPhone').value;
        const reportPrefix = document.getElementById('reportPrefix').value;
        const language = document.getElementById('language').value;
        const dateFormat = document.getElementById('dateFormat').value;
        const enablePWA = document.getElementById('enablePWA').checked;
        
        // Update settings object
        settings.general.companyName = companyName;
        settings.general.contactEmail = contactEmail;
        settings.general.contactPhone = contactPhone;
        settings.general.reportPrefix = reportPrefix;
        settings.general.language = language;
        settings.general.dateFormat = dateFormat;
        settings.general.enablePWA = enablePWA;
        
        // Save settings
        this.saveSettings(settings);
        
        // Show success message
        this.showToast('تم حفظ الإعدادات العامة بنجاح');
    }
    
    // Save appearance settings
    saveAppearanceSettings() {
        const settings = this.getSettings();
        
        // Get form values
        const primaryColor = document.getElementById('primaryColor').value;
        const darkMode = document.getElementById('darkMode').checked;
        const fontSize = document.getElementById('fontSize').value;
        
        // Update settings object
        settings.appearance.primaryColor = primaryColor;
        settings.appearance.darkMode = darkMode;
        settings.appearance.fontSize = fontSize;
        
        // Save settings
        this.saveSettings(settings);
        
        // Show success message
        this.showToast('تم حفظ إعدادات المظهر بنجاح');
    }
    
    // Save notification settings
    saveNotificationSettings() {
        const settings = this.getSettings();
        
        // Get form values
        const emailNotifications = document.getElementById('emailNotifications').checked;
        const browserNotifications = document.getElementById('browserNotifications').checked;
        const reportReminders = document.getElementById('reportReminders').checked;
        const warrantyAlerts = document.getElementById('warrantyAlerts').checked;
        const soundAlerts = document.getElementById('soundAlerts').checked;
        
        // Update settings object
        settings.notifications.emailNotifications = emailNotifications;
        settings.notifications.browserNotifications = browserNotifications;
        settings.notifications.reportReminders = reportReminders;
        settings.notifications.warrantyAlerts = warrantyAlerts;
        settings.notifications.soundAlerts = soundAlerts;
        
        // Save settings
        this.saveSettings(settings);
        
        // Show success message
        this.showToast('تم حفظ إعدادات الإشعارات بنجاح');
    }
    
    // Save backup settings
    saveBackupSettings() {
        const settings = this.getSettings();
        
        // Get form values
        const autoBackup = document.getElementById('autoBackup').checked;
        const backupFrequency = document.getElementById('backupFrequency').value;
        const keepBackups = parseInt(document.getElementById('keepBackups').value);
        
        // Update settings object
        settings.backup.autoBackup = autoBackup;
        settings.backup.backupFrequency = backupFrequency;
        settings.backup.keepBackups = keepBackups;
        
        // Save settings
        this.saveSettings(settings);
        
        // Show success message
        this.showToast('تم حفظ إعدادات النسخ الاحتياطي بنجاح');
    }
    
    // Show add user modal
    showAddUserModal() {
        // Create modal if it doesn't exist
        if (!document.getElementById('addUserModal')) {
            const modalHTML = `
            <div class="modal fade" id="addUserModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content border-0 shadow">
                        <div class="modal-header" style="background: linear-gradient(135deg, #007553 0%, #004d35 100%); color: white;">
                            <h5 class="modal-title"><i class="fas fa-user-plus me-2"></i> إضافة مستخدم جديد</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body p-4">
                            <form id="addUserForm">
                                <div class="mb-3">
                                    <label for="userFullName" class="form-label">الاسم الكامل</label>
                                    <input type="text" class="form-control" id="userFullName" required>
                                </div>
                                <div class="mb-3">
                                    <label for="userUsername" class="form-label">اسم المستخدم</label>
                                    <input type="text" class="form-control" id="userUsername" required>
                                </div>
                                <div class="mb-3">
                                    <label for="userEmail" class="form-label">البريد الإلكتروني</label>
                                    <input type="email" class="form-control" id="userEmail" required>
                                </div>
                                <div class="mb-3">
                                    <label for="userRole" class="form-label">الدور</label>
                                    <select class="form-select" id="userRole" required>
                                        <option value="admin">مدير</option>
                                        <option value="technician" selected>فني</option>
                                        <option value="viewer">مستخدم</option>
                                    </select>
                                </div>
                                <div class="mb-3">
                                    <label for="userPassword" class="form-label">كلمة المرور</label>
                                    <input type="password" class="form-control" id="userPassword" required>
                                </div>
                                <div class="mb-3">
                                    <label for="userConfirmPassword" class="form-label">تأكيد كلمة المرور</label>
                                    <input type="password" class="form-control" id="userConfirmPassword" required>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">إلغاء</button>
                            <button type="submit" form="addUserForm" class="btn btn-success">
                                <i class="fas fa-save me-2"></i> حفظ
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', modalHTML);
            
            // Add event listener to the form
            document.getElementById('addUserForm').addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveNewUser();
            });
        }
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('addUserModal'));
        modal.show();
    }
    
    // Save new user
    saveNewUser() {
        // Get form values
        const fullName = document.getElementById('userFullName').value;
        const username = document.getElementById('userUsername').value;
        const email = document.getElementById('userEmail').value;
        const role = document.getElementById('userRole').value;
        const password = document.getElementById('userPassword').value;
        const confirmPassword = document.getElementById('userConfirmPassword').value;
        
        // Validate passwords match
        if (password !== confirmPassword) {
            alert('كلمات المرور غير متطابقة');
            return;
        }
        
        // Get users array
        const users = this.getUsers();
        
        // Check if username already exists
        const usernameExists = users.some(user => user.username.toLowerCase() === username.toLowerCase());
        if (usernameExists) {
            alert('اسم المستخدم موجود بالفعل، الرجاء اختيار اسم آخر');
            return;
        }
        
        // Generate new ID
        const maxId = users.reduce((max, user) => Math.max(max, user.id), 0);
        const newId = maxId + 1;
        
        // Create new user object
        const newUser = {
            id: newId,
            username: username,
            fullName: fullName,
            email: email,
            passwordHash: 'hashed_' + password, // In a real app, this would be properly hashed
            role: role,
            status: 'active',
            avatar: null,
            lastLogin: null,
            createdAt: new Date().toISOString()
        };
        
        // Add to users array
        users.push(newUser);
        
        // Save users
        this.saveUsers(users);
        
        // Reload users list
        this.loadUsers();
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('addUserModal'));
        if (modal) {
            modal.hide();
            
            // Reset form
            document.getElementById('addUserForm').reset();
        }
        
        // Show success message
        this.showToast('تم إضافة المستخدم بنجاح');
    }
    
    // Edit user
    editUser(userId) {
        const users = this.getUsers();
        const user = users.find(u => u.id === userId);
        
        if (!user) {
            alert('لم يتم العثور على المستخدم');
            return;
        }
        
        // Create modal if it doesn't exist
        if (!document.getElementById('editUserModal')) {
            const modalHTML = `
            <div class="modal fade" id="editUserModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content border-0 shadow">
                        <div class="modal-header" style="background: linear-gradient(135deg, #007553 0%, #004d35 100%); color: white;">
                            <h5 class="modal-title"><i class="fas fa-user-edit me-2"></i> تعديل بيانات المستخدم</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body p-4">
                            <form id="editUserForm">
                                <input type="hidden" id="editUserId">
                                <div class="mb-3">
                                    <label for="editUserFullName" class="form-label">الاسم الكامل</label>
                                    <input type="text" class="form-control" id="editUserFullName" required>
                                </div>
                                <div class="mb-3">
                                    <label for="editUserUsername" class="form-label">اسم المستخدم</label>
                                    <input type="text" class="form-control" id="editUserUsername" required>
                                </div>
                                <div class="mb-3">
                                    <label for="editUserEmail" class="form-label">البريد الإلكتروني</label>
                                    <input type="email" class="form-control" id="editUserEmail" required>
                                </div>
                                <div class="mb-3">
                                    <label for="editUserRole" class="form-label">الدور</label>
                                    <select class="form-select" id="editUserRole" required>
                                        <option value="admin">مدير</option>
                                        <option value="technician">فني</option>
                                        <option value="viewer">مستخدم</option>
                                    </select>
                                </div>
                                <div class="mb-3">
                                    <label for="editUserStatus" class="form-label">الحالة</label>
                                    <select class="form-select" id="editUserStatus" required>
                                        <option value="active">نشط</option>
                                        <option value="suspended">معلق</option>
                                    </select>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">إلغاء</button>
                            <button type="submit" form="editUserForm" class="btn btn-primary">
                                <i class="fas fa-save me-2"></i> حفظ التغييرات
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', modalHTML);
            
            // Add event listener to the form
            document.getElementById('editUserForm').addEventListener('submit', (e) => {
                e.preventDefault();
                this.updateUser();
            });
        }
        
        // Fill form with user data
        document.getElementById('editUserId').value = user.id;
        document.getElementById('editUserFullName').value = user.fullName;
        document.getElementById('editUserUsername').value = user.username;
        document.getElementById('editUserEmail').value = user.email;
        this.setSelectValue(document.getElementById('editUserRole'), user.role);
        this.setSelectValue(document.getElementById('editUserStatus'), user.status);
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('editUserModal'));
        modal.show();
    }
    
    // Update user
    updateUser() {
        const userId = parseInt(document.getElementById('editUserId').value);
        const fullName = document.getElementById('editUserFullName').value;
        const username = document.getElementById('editUserUsername').value;
        const email = document.getElementById('editUserEmail').value;
        const role = document.getElementById('editUserRole').value;
        const status = document.getElementById('editUserStatus').value;
        
        // Get users array
        const users = this.getUsers();
        const userIndex = users.findIndex(u => u.id === userId);
        
        if (userIndex === -1) {
            alert('لم يتم العثور على المستخدم');
            return;
        }
        
        // Check if username is already taken by another user
        const usernameExists = users.some(u => u.id !== userId && u.username.toLowerCase() === username.toLowerCase());
        if (usernameExists) {
            alert('اسم المستخدم موجود بالفعل، الرجاء اختيار اسم آخر');
            return;
        }
        
        // Check if this is the last admin user and trying to change role
        if (users[userIndex].role === ROLES.ADMIN && role !== ROLES.ADMIN) {
            const adminCount = users.filter(u => u.role === ROLES.ADMIN).length;
            if (adminCount <= 1) {
                alert('لا يمكن تغيير دور المدير الوحيد!');
                return;
            }
        }
        
        // Update user object
        users[userIndex].fullName = fullName;
        users[userIndex].username = username;
        users[userIndex].email = email;
        users[userIndex].role = role;
        users[userIndex].status = status;
        
        // Save users
        this.saveUsers(users);
        
        // Reload users list
        this.loadUsers();
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('editUserModal'));
        if (modal) {
            modal.hide();
        }
        
        // Show success message
        this.showToast('تم تحديث بيانات المستخدم بنجاح');
    }
    
    // Change user password
    changePassword(userId) {
        const users = this.getUsers();
        const user = users.find(u => u.id === userId);
        
        if (!user) {
            alert('لم يتم العثور على المستخدم');
            return;
        }
        
        // Create modal if it doesn't exist
        if (!document.getElementById('changePasswordModal')) {
            const modalHTML = `
            <div class="modal fade" id="changePasswordModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content border-0 shadow">
                        <div class="modal-header" style="background: linear-gradient(135deg, #007553 0%, #004d35 100%); color: white;">
                            <h5 class="modal-title"><i class="fas fa-key me-2"></i> تغيير كلمة المرور</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body p-4">
                            <form id="changePasswordForm">
                                <input type="hidden" id="changePasswordUserId">
                                <div class="mb-3">
                                    <label for="newPassword" class="form-label">كلمة المرور الجديدة</label>
                                    <input type="password" class="form-control" id="newPassword" required>
                                </div>
                                <div class="mb-3">
                                    <label for="confirmNewPassword" class="form-label">تأكيد كلمة المرور</label>
                                    <input type="password" class="form-control" id="confirmNewPassword" required>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">إلغاء</button>
                            <button type="submit" form="changePasswordForm" class="btn btn-primary">
                                <i class="fas fa-save me-2"></i> حفظ كلمة المرور
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', modalHTML);
            
            // Add event listener to the form
            document.getElementById('changePasswordForm').addEventListener('submit', (e) => {
                e.preventDefault();
                this.updatePassword();
            });
        }
        
        // Fill user ID field
        document.getElementById('changePasswordUserId').value = user.id;
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('changePasswordModal'));
        modal.show();
    }
    
    // Update user password
    updatePassword() {
        const userId = parseInt(document.getElementById('changePasswordUserId').value);
        const newPassword = document.getElementById('newPassword').value;
        const confirmNewPassword = document.getElementById('confirmNewPassword').value;
        
        // Validate passwords match
        if (newPassword !== confirmNewPassword) {
            alert('كلمات المرور غير متطابقة');
            return;
        }
        
        // Get users array
        const users = this.getUsers();
        const userIndex = users.findIndex(u => u.id === userId);
        
        if (userIndex === -1) {
            alert('لم يتم العثور على المستخدم');
            return;
        }
        
        // Update password hash
        users[userIndex].passwordHash = 'hashed_' + newPassword; // In a real app, this would be properly hashed
        
        // Save users
        this.saveUsers(users);
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('changePasswordModal'));
        if (modal) {
            modal.hide();
            
            // Reset form
            document.getElementById('changePasswordForm').reset();
        }
        
        // Show success message
        this.showToast('تم تغيير كلمة المرور بنجاح');
    }
    
    // Delete user
    deleteUser(userId) {
        if (!confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
            return;
        }
        
        // Get users array
        const users = this.getUsers();
        const userIndex = users.findIndex(u => u.id === userId);
        
        if (userIndex === -1) {
            alert('لم يتم العثور على المستخدم');
            return;
        }
        
        // Check if this is the last admin user
        const user = users[userIndex];
        if (user.role === ROLES.ADMIN && users.filter(u => u.role === ROLES.ADMIN).length <= 1) {
            alert('لا يمكن حذف المدير الوحيد!');
            return;
        }
        
        // Remove user
        users.splice(userIndex, 1);
        
        // Save users
        this.saveUsers(users);
        
        // Reload users list
        this.loadUsers();
        
        // Show success message
        this.showToast('تم حذف المستخدم بنجاح');
    }
    
    // Create backup
    createBackup() {
        // In a real app, this would create an actual backup file
        // For this prototype, we'll just pretend
        
        // Update last backup timestamp
        const settings = this.getSettings();
        settings.backup.lastBackup = new Date().toISOString();
        this.saveSettings(settings);
        
        // Show success message
        this.showToast('تم إنشاء نسخة احتياطية بنجاح');
    }
    
    // Restore backup
    restoreBackup() {
        // In a real app, this would upload and restore from a backup file
        // For this prototype, we'll just pretend
        
        if (!confirm('هل أنت متأكد من استعادة النسخة الاحتياطية؟ سيتم استبدال جميع البيانات الحالية.')) {
            return;
        }
        
        // Show success message after "restoring"
        this.showToast('تمت استعادة البيانات بنجاح');
        
        // Reload page after 2 seconds
        setTimeout(() => {
            window.location.reload();
        }, 2000);
    }
    
    // Show toast notification
    showToast(message) {
        // Create toast container if it doesn't exist
        if (!document.getElementById('toastContainer')) {
            const toastContainerHTML = `
            <div id="toastContainer" style="position: fixed; bottom: 20px; left: 20px; z-index: 9999;">
            </div>
            `;
            document.body.insertAdjacentHTML('beforeend', toastContainerHTML);
        }
        
        // Create a random ID for this toast
        const toastId = 'toast-' + Math.random().toString(36).substring(2, 9);
        
        // Create toast HTML
        const toastHTML = `
        <div id="${toastId}" class="toast bg-white shadow-lg border-0" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header" style="background: linear-gradient(135deg, #007553 0%, #004d35 100%); color: white;">
                <i class="fas fa-check-circle me-2"></i>
                <strong class="me-auto">الإعدادات</strong>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
            <div class="toast-body">
                ${message}
            </div>
        </div>
        `;
        
        // Add toast to container
        document.getElementById('toastContainer').insertAdjacentHTML('beforeend', toastHTML);
        
        // Initialize and show toast
        const toastElement = document.getElementById(toastId);
        const toast = new bootstrap.Toast(toastElement, { delay: 3000 });
        toast.show();
        
        // Remove toast element after it's hidden
        toastElement.addEventListener('hidden.bs.toast', () => {
            toastElement.remove();
        });
    }
}

// Initialize settings manager when document is ready
let settingsManager;
document.addEventListener('DOMContentLoaded', function() {
    // Initialize settings manager
    settingsManager = new SettingsManager();
    
    // Check for offline status
    function updateOfflineStatus() {
        const offlineAlert = document.getElementById('offlineAlert');
        if (offlineAlert) {
            if (navigator.onLine) {
                offlineAlert.style.display = 'none';
            } else {
                offlineAlert.style.display = 'block';
            }
        }
    }

    // Initial check
    updateOfflineStatus();

    // Listen for online/offline events
    window.addEventListener('online', updateOfflineStatus);
    window.addEventListener('offline', updateOfflineStatus);
});
