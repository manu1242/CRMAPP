import { create } from 'zustand';
import { MyPermissionsData, Permission } from '../models/Permission';
import { PermissionService } from '../services/PermissionService';

export const MODULE_ALIASES: Record<string, string[]> = {
  'Leads & Properties': [
    'Leads',
    'Properties',
    'SalesPipelines',
    'Tasks',
    'WebhookLeads',
    'Lead Management',
    'Property Management',
    'Leads & Props',
    'leads-properties',
  ],
  'Sales': ['Quotations', 'Bookings', 'Invoices', 'Payments', 'Sales', 'sales'],
  'Finance': ['Revenue', 'Expenses', 'Profit', 'Finance', 'finance'],
  'Team Management': [
    'Team Management',
    'Agents',
    'Agent',
    'PartnerTracking',
    'Employees',
    'Channel Partner',
    'Team Mgmt',
    'team-management',
  ],
  'User Management': [
    'Users',
    'User Management',
    'ManageUsers',
    'RolesManagement',
    'User Mgmt',
    'user-management',
  ],
  'Attendance': ['Attendance', 'attendance', 'AgentAttendance', 'My Attendance'],
  'Payouts': [
    'Payouts',
    'AgentPayout',
    'ChannelPartnerPayout',
    'PartnerCommission',
    'payouts',
  ],
  'Dashboard': ['Dashboard', 'dashboard'],
  'Settings': ['Settings', 'settings', 'Profile', 'EmailSettings', 'SystemSettings'],
  'Subscriptions': [
    'Subscriptions',
    'subscriptions',
    'SaasSubscription',
    'Subscription',
    'RazorpayTransactions',
    'PartnerTransactions',
    'Plans',
  ],
  'Financial Settings': [
    'Financial',
    'FinancialSettings',
    'Payment & Banking',
    'financial-settings',
    'bankaccountconfig',
    'paymentconfig',
  ],
  'Testimonials': ['Testimonials', 'testimonials', 'testimonial'],
  'Chatbot': ['Chatbot', 'chatbot', 'chatbot-dashboard'],
};

export const ROUTE_MAP: Record<string, { module: string; controller: string; defaultAction?: string }> = {
  // Dashboard
  '/admin/dashboard': { module: 'Dashboard', controller: 'Home' },
  '/admin/PartnerDashboard': { module: 'Dashboard', controller: 'Home' },

  // Leads & Properties
  '/admin/leads': { module: 'Leads & Properties', controller: 'Leads' },
  '/admin/leads/AddLead': { module: 'Leads & Properties', controller: 'Leads', defaultAction: 'Create' },
  '/admin/sales': { module: 'Leads & Properties', controller: 'SalesPipelines' },
  '/admin/Tasks': { module: 'Leads & Properties', controller: 'Tasks' },
  '/admin/unassigned': { module: 'Leads & Properties', controller: 'WebhookLeads' },
  '/admin/leads/LeadIntegrations': { module: 'Leads & Properties', controller: 'LeadIntegrations' },
  '/admin/properties': { module: 'Leads & Properties', controller: 'Properties' },
  '/admin/properties/add-property': { module: 'Leads & Properties', controller: 'Properties', defaultAction: 'Create' },

  // Sales
  '/admin/SalesUnit/quotation': { module: 'Sales', controller: 'Quotations' },
  '/admin/SalesUnit/bookings': { module: 'Sales', controller: 'Bookings' },
  '/admin/SalesUnit/invoice': { module: 'Sales', controller: 'Invoices' },
  '/admin/SalesUnit/payments': { module: 'Sales', controller: 'Payments' },

  // Finance
  '/admin/finance/expenses': { module: 'Finance', controller: 'Expenses' },
  '/admin/finance/revenue': { module: 'Finance', controller: 'Revenue' },
  '/admin/finance/profit': { module: 'Finance', controller: 'Profit' },

  // Team Management
  '/admin/teammanagement/Agent': { module: 'Team Management', controller: 'Agent' },
  '/admin/teammanagement/AgentLeadTracking': { module: 'Team Management', controller: 'Leads' },
  '/admin/teammanagement/channelpartner/channel': { module: 'Team Management', controller: 'ManageUsers' },

  // Attendance
  '/admin/attendance/AgentAttendance': { module: 'Attendance', controller: 'Attendance' },

  // Payouts
  '/admin/payouts/AgentPayout': { module: 'Payouts', controller: 'AgentPayout' },
  '/admin/payouts/PartnerPayout': { module: 'Payouts', controller: 'PartnerCommission' },

  // User Management
  '/admin/usemanagement/ManageUsers': { module: 'User Management', controller: 'ManageUsers' },
  '/admin/usemanagement/RolesManagement': { module: 'User Management', controller: 'ManageUsers' },

  // Settings
  '/admin/settings': { module: 'Settings', controller: 'Settings' },
  '/admin/settings/profile/Profile': { module: 'Settings', controller: 'Profile' },
  '/admin/settings/systemsettings/setting': { module: 'Settings', controller: 'Settings' },
  '/admin/settings/emailconfig/EmailConfig': { module: 'Settings', controller: 'EmailSettings' },

  // Subscriptions
  '/admin/subscriptions/plans/Plans': { module: 'Subscriptions', controller: 'Subscription' },
  '/admin/subscriptions/partnersubscriptions/PartnerSubscriptions': { module: 'Subscriptions', controller: 'Subscription' },
  '/admin/subscriptions/razaorpay/RazorpayTransactions': { module: 'Subscriptions', controller: 'RazorpayTransactions' },
  '/admin/subscriptions/pendingrefunds/PendingRefunds': { module: 'Subscriptions', controller: 'Subscription' },
  '/admin/subscriptions/crmplans/MyCrmPlan': { module: 'Subscriptions', controller: 'SaasSubscription' },
  '/admin/subscriptions/crmtransactions/CrmTransactions': { module: 'Subscriptions', controller: 'SaasSubscription' },

  // Financial Settings
  '/admin/paymentconfig': { module: 'Financial Settings', controller: 'Financial' },
  '/admin/bankaccountconfig': { module: 'Financial Settings', controller: 'Financial' },

  // Marketing & AI
  '/admin/testimonial': { module: 'Testimonials', controller: 'Settings' },
  '/admin/chatbot': { module: 'Chatbot', controller: 'Chatbot' },
};

export type ActionType = 'View' | 'Create' | 'Edit' | 'Delete' | 'Export' | 'BulkUpload';

interface PermissionState {
  myPermissions: MyPermissionsData | null;
  permissions: Permission[];
  isLoading: boolean;
  isLoaded: boolean;
  error: string | null;

  fetchMyPermissions: (force?: boolean) => Promise<MyPermissionsData | null>;
  fetchPermissions: (roleName: string) => Promise<void>;
  hasModuleAccess: (moduleNameOrId: string) => boolean;
  hasScreenAccess: (routeOrKey: string) => boolean;
  can: (action: ActionType, moduleOrKey: string) => boolean;
  canView: (moduleOrKey: string) => boolean;
  canCreate: (moduleOrKey: string) => boolean;
  canEdit: (moduleOrKey: string) => boolean;
  canDelete: (moduleOrKey: string) => boolean;
  canExport: (moduleOrKey: string) => boolean;
  resetPermissions: () => void;
}

export const usePermissionStore = create<PermissionState>((set, get) => ({
  myPermissions: null,
  permissions: [],
  isLoading: false,
  isLoaded: false,
  error: null,

  fetchMyPermissions: async (force = false) => {
    const state = get();
    if (state.myPermissions && state.isLoaded && !force) {
      return state.myPermissions;
    }

    set({ isLoading: true, error: null });
    try {
      const data = await PermissionService.getMyPermissions();
      set({ myPermissions: data, isLoaded: true, isLoading: false });
      return data;
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch user permissions', isLoading: false });
      return null;
    }
  },

  fetchPermissions: async (roleName: string) => {
    set({ isLoading: true, error: null });
    try {
      const permissions = await PermissionService.getRolePermissions(roleName);
      set({ permissions, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch permissions', isLoading: false });
    }
  },

  hasModuleAccess: (moduleNameOrId: string) => {
    const { myPermissions } = get();
    if (!myPermissions) return true; // optimistic default during hydration

    // SuperAdmin and Admin have unrestricted module access
    if (myPermissions.isSuperAdmin || myPermissions.isAdmin) {
      return true;
    }

    const target = moduleNameOrId.trim().toLowerCase();

    // Find the canonical module name
    let matchedCanonical: string | null = null;
    for (const [canonical, aliases] of Object.entries(MODULE_ALIASES)) {
      if (
        canonical.toLowerCase() === target ||
        aliases.some((a) => a.toLowerCase() === target)
      ) {
        matchedCanonical = canonical;
        break;
      }
    }

    const checkList = matchedCanonical
      ? [matchedCanonical, ...(MODULE_ALIASES[matchedCanonical] || [])]
      : [target];

    return myPermissions.allowedModules.some((allowed) => {
      const aLower = allowed.trim().toLowerCase();
      return checkList.some((c) => c.toLowerCase() === aLower);
    });
  },

  hasScreenAccess: (routeOrKey: string) => {
    const { myPermissions, hasModuleAccess, can } = get();
    if (!myPermissions) return true;

    // SuperAdmin and Admin have full screen access
    if (myPermissions.isSuperAdmin || myPermissions.isAdmin) {
      return true;
    }

    // Partner screen access scoping
    if (myPermissions.isPartner) {
      if (routeOrKey === '/admin/dashboard') return false; // Partner uses PartnerDashboard
      if (routeOrKey.includes('/admin/usemanagement')) return false; // Partner cannot manage global roles
    }

    // Agent screen access scoping
    if (myPermissions.isAgent) {
      const agentAllowedRoutes = [
        '/admin/leads',
        '/admin/sales',
        '/admin/Tasks',
        '/admin/properties',
        '/admin/attendance/AgentAttendance',
        '/admin/settings/profile/Profile',
      ];
      return agentAllowedRoutes.some((r) => routeOrKey.startsWith(r));
    }

    // Check route map
    const cleanRoute = (routeOrKey || '').split('?')[0];
    const mapped = ROUTE_MAP[cleanRoute] || ROUTE_MAP[routeOrKey];
    if (mapped) {
      if (!hasModuleAccess(mapped.module)) {
        return false;
      }
      return can('View', mapped.controller);
    }

    return true;
  },

  can: (action: ActionType, moduleOrKey: string) => {
    const { myPermissions, hasModuleAccess } = get();
    if (!myPermissions) return true;

    // Full system administrators can perform all actions
    if (myPermissions.isSuperAdmin || myPermissions.isAdmin || myPermissions.canCreateAll) {
      return true;
    }

    // If moduleOrKey is a known route, resolve controller and module
    const cleanKey = (moduleOrKey || '').split('?')[0];
    let controller = moduleOrKey;
    const mapped = ROUTE_MAP[cleanKey] || ROUTE_MAP[moduleOrKey];
    if (mapped) {
      if (!hasModuleAccess(mapped.module)) {
        return false;
      }
      controller = mapped.controller;
    } else {
      // Check if it's a module name directly
      if (!hasModuleAccess(moduleOrKey)) {
        return false;
      }
    }

    // View action: if module is allowed and no specific block exists, allow View
    if (action === 'View') {
      return true;
    }

    // Check granular pagePermissions dictionary
    const pages = myPermissions.pagePermissions || {};
    const controllerKey = Object.keys(pages).find(
      (k) => k.toLowerCase() === controller.toLowerCase() || k.toLowerCase().startsWith(`${controller.toLowerCase()}/`)
    );

    if (controllerKey && pages[controllerKey]) {
      const perms = pages[controllerKey];
      const matchKey = Object.keys(perms).find((p) => p.toLowerCase() === action.toLowerCase());
      if (matchKey !== undefined) {
        return Boolean(perms[matchKey]);
      }
    }

    // Default: Agents and Managers with Read-Only do not have Delete/BulkUpload unless granted
    if (myPermissions.isAgent && (action === 'Delete' || action === 'BulkUpload')) {
      return false;
    }

    return true;
  },

  canView: (key: string) => get().can('View', key),
  canCreate: (key: string) => get().can('Create', key),
  canEdit: (key: string) => get().can('Edit', key),
  canDelete: (key: string) => get().can('Delete', key),
  canExport: (key: string) => get().can('Export', key),

  resetPermissions: () => {
    set({ myPermissions: null, permissions: [], isLoaded: false, error: null });
  },
}));
