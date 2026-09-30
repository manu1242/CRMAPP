/**
 * Configuration for Centralized Header Visibility
 */
export interface HeaderConfig {
    /**
     * Paths where the header should be VISIBLE.
     * Paths can be written with or without a leading slash.
     * Example: '/admin/dashboard', '/profile'
     */
    visiblePaths: string[];

    /**
     * Paths where the header should be HIDDEN.
     * Can be used to explicitly override visibility for single paths.
     * Example: '/register', '/login'
     */
    hiddenPaths: string[];

    /**
     * If true, nested routes will inherit the visibility of their parent route
     * unless they have a more specific override in visibility arrays.
     * E.g., if '/admin/settings' is visible, then '/admin/settings/notifications'
     * will be visible too.
     */
    inheritParentVisibility: boolean;
}

export const HEADER_CONFIG: HeaderConfig = {
    visiblePaths: [
        '/admin/dashboard',
        '/admin/PartnerDashboard',
        '/superadmin/dashboard',
        '/superadmin/profile',
        '/superadmin/inquiries',
        '/superadmin/tenants-hub',
        '/superadmin/subscriptions-hub',
        '/superadmin/payment-config',
        '/admin/sales',
        '/admin/properties',
        '/admin/leads',
        '/admin/unassigned',
        '/admin/payouts',
        '/admin/Tasks',
        '/admin/teammanagement',
        '/admin/leads/leads',
        '/admin/SalesUnit/bookings',
        '/admin/SalesUnit/invoice',
        '/admin/SalesUnit/payments',
        '/admin/finance/expenses',
        '/admin/finance/revenue',
        '/admin/finance/profit',
        '/admin/usemanagement/ManageUsers',
        '/admin/usemanagement/RolePermissions',
        '/admin/usemanagement/RolesManagement',
        '/admin/usemanagement/UsersRole',
        
        
    ],
    hiddenPaths: [
        '/login',
        '/main-login',
        '/register',
        '/forgot-password',
        '/reset-password',
        '/select-workspace',
        // '/index',
        // '/',
        '/profile',
        '/admin/settings',
        '/admin/SalesUnit',
        '/admin/SalesUnit/bookings/[id]',
        '/admin/SalesUnit/bookings/CreateBooking',
        '/admin/SalesUnit/invoice/[id]',
        '/admin/SalesUnit/invoice/GenerateInvoice',
        '/admin/SalesUnit/payments',
        '/admin/SalesUnit/quotation',
        '/admin/teammanagement/CreateAgent',
        '/admin/leads/AddLead',
        '/admin/leads/[id]',
        '/admin/properties/add-property',
        '/admin/properties/add-flat',
        '/admin/teammanagement/channelpartner/createchannel'
    ],
    inheritParentVisibility: true,
};

const normalizePath = (p: string): string => {
    let normalized = p.trim();
    if (!normalized.startsWith('/')) {
        normalized = '/' + normalized;
    }
    if (normalized.endsWith('/') && normalized.length > 1) {
        normalized = normalized.slice(0, -1);
    }
    if (normalized.endsWith('/index') && normalized.length > 6) {
        normalized = normalized.slice(0, -6);
    }
    return normalized;
};

/**
 * Checks whether the Header component should be shown for the given path.
 *
 * @param currentPath The current route/path pathname (e.g. from usePathname() or useSegments())
 * @returns boolean true if Header should be rendered, false otherwise.
 */
export const checkHeaderVisibility = (currentPath: string): boolean => {
    if (!currentPath) return false;

    const normCurrent = normalizePath(currentPath).toLowerCase();

    // 1. Check for exact match in hidden paths first (explicit overrides win)
    const isExplicitlyHidden = HEADER_CONFIG.hiddenPaths.some(
        (p) => normalizePath(p).toLowerCase() === normCurrent
    );

    const isExplicitlyVisible = HEADER_CONFIG.visiblePaths.some(
        (p) => normalizePath(p).toLowerCase() === normCurrent
    );

    console.log('[DEBUG Header] currentPath:', currentPath, 'normCurrent:', normCurrent, 'isExplicitlyHidden:', isExplicitlyHidden, 'isExplicitlyVisible:', isExplicitlyVisible);

    if (isExplicitlyHidden) {
        return false;
    }

    if (isExplicitlyVisible) {
        return true;
    }

    // 3. Fallback to parent path inheritance if enabled
    if (HEADER_CONFIG.inheritParentVisibility) {
        // Sort both sets of paths by length/depth-descending so the most specific matches first
        const sortedHidden = [...HEADER_CONFIG.hiddenPaths]
            .map(normalizePath)
            .sort((a, b) => b.length - a.length);

        const sortedVisible = [...HEADER_CONFIG.visiblePaths]
            .map(normalizePath)
            .sort((a, b) => b.length - a.length);

        // Find if a parent segment is explicitly configured to be hidden
        for (const parent of sortedHidden) {
            // Ensure we match '/parent' as a path segment boundary of '/parent/child'
            if (normCurrent.startsWith(parent.toLowerCase() + '/')) {
                return false;
            }
        }

        // Find if a parent segment is explicitly configured to be visible
        for (const parent of sortedVisible) {
            if (normCurrent.startsWith(parent.toLowerCase() + '/')) {
                return true;
            }
        }
    }

    return false;
};
