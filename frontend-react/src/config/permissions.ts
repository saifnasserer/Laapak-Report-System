/**
 * Role-Based Access Control Configuration
 * Defines which sections each admin role can access
 */

export type AdminRole = 'superadmin' | 'admin';

export interface SectionPermissions {
    dashboard: boolean;
    salesOperations: boolean;
    inventoryAnalytics: boolean;
    suppliers: boolean;
    financial: boolean;
    systemManagement: boolean;
}

export const ROLE_PERMISSIONS: Record<AdminRole, SectionPermissions> = {
    superadmin: {
        dashboard: true,
        salesOperations: true,
        inventoryAnalytics: true,
        suppliers: true,
        financial: true, // Controlled by showFinancial state in Sidebar
        systemManagement: true, // Controlled by showFinancial state in Sidebar
    },
    admin: {
        dashboard: true,
        salesOperations: true,
        inventoryAnalytics: true,
        suppliers: false,
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
