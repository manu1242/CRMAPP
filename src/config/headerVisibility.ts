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
        '/admin/sales',
        '/admin/properties',
        '/admin/leads',
        '/admin/unassigned',
        '/admin/payouts',
        '/admin/Tasks',
        '/admin/teammanagement',
    ],
    hiddenPaths: [
        '/login',
        '/main-login',
        '/register',
        '/forgot-password',
        '/reset-password',
        '/select-workspace',
        '/index',
        '/',
        '/profile',
        '/admin/settings',
        '/admin/SalesUnit',
        '/admin/SalesUnit/bookings',
        '/admin/SalesUnit/invoice',
        '/admin/SalesUnit/payments',
        '/admin/SalesUnit/quotation',
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

    const normCurrent = normalizePath(currentPath);

    // 1. Check for exact match in hidden paths first (explicit overrides win)
    const isExplicitlyHidden = HEADER_CONFIG.hiddenPaths.some(
        (p) => normalizePath(p) === normCurrent
    );
    if (isExplicitlyHidden) {
        return false;
    }

    // 2. Check for exact match in visible paths
    const isExplicitlyVisible = HEADER_CONFIG.visiblePaths.some(
        (p) => normalizePath(p) === normCurrent
    );
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
            if (normCurrent.startsWith(parent + '/')) {
                return false;
            }
        }

        // Find if a parent segment is explicitly configured to be visible
        for (const parent of sortedVisible) {
            if (normCurrent.startsWith(parent + '/')) {
                return true;
            }
        }
    }

    return false;
};
