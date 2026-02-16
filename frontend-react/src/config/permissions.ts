/**
 * Role-Based Access Control Configuration
 * Defines which sections each admin role can access
 */

export type AdminRole = 'superadmin' | 'admin';

export interface SectionPermissions {
    dashboard: boolean;
    salesOperations: boolean;
    inventoryAnalytics: boolean;
    financial: boolean;
    systemManagement: boolean;
}

export const ROLE_PERMISSIONS: Record<AdminRole, SectionPermissions> = {
    superadmin: {
        dashboard: true,
        salesOperations: true,
        inventoryAnalytics: true,
        financial: false, // Hidden by default, controlled by showFinancial state
        systemManagement: false, // Hidden by default, controlled by showFinancial state
    },
    admin: {
        dashboard: true,
        salesOperations: true,
        inventoryAnalytics: true,
        financial: false,
        systemManagement: false,
    },
};

/**
 * Check if a role has access to a specific section
 */
export const hasAccess = (role: AdminRole, section: keyof SectionPermissions): boolean => {
    return ROLE_PERMISSIONS[role]?.[section] ?? false;
};
