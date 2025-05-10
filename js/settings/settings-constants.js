/**
 * Laapak Report System - Settings Constants
 * Contains all constants and default values used across the settings modules
 */

// User roles
export const ROLES = {
    ADMIN: 'admin',
    TECHNICIAN: 'technician',
    VIEWER: 'viewer'
};

// User permissions
export const PERMISSIONS = {
    MANAGE_USERS: 'manage_users',
    MANAGE_SETTINGS: 'manage_settings',
    CREATE_REPORTS: 'create_reports',
    EDIT_REPORTS: 'edit_reports',
    VIEW_REPORTS: 'view_reports',
    MANAGE_CLIENTS: 'manage_clients',
    MANAGE_BACKUPS: 'manage_backups'
};

// Default role permissions
export const ROLE_PERMISSIONS = {
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
export const sampleUsers = [
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
export const defaultSettings = {
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
