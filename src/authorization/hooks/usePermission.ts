import { useShallow } from 'zustand/react/shallow';
import { useEffect } from 'react';
import { useAuthStore } from '../../auth/store/authStore';
import { usePermissionStore, ActionType } from '../store/permissionStore';

export const usePermission = () => {
  const user = useAuthStore((state) => state.user);
  const {
    myPermissions,
    isLoading,
    isLoaded,
    fetchMyPermissions,
    hasModuleAccess,
    hasScreenAccess,
    can,
    canView,
    canCreate,
    canEdit,
    canDelete,
    canExport,
    resetPermissions,
  } = usePermissionStore(
    // Re-render only when these change (used by many screens + the menu)
    useShallow((s) => ({
      myPermissions: s.myPermissions,
      isLoading: s.isLoading,
      isLoaded: s.isLoaded,
      fetchMyPermissions: s.fetchMyPermissions,
      hasModuleAccess: s.hasModuleAccess,
      hasScreenAccess: s.hasScreenAccess,
      can: s.can,
      canView: s.canView,
      canCreate: s.canCreate,
      canEdit: s.canEdit,
      canDelete: s.canDelete,
      canExport: s.canExport,
      resetPermissions: s.resetPermissions,
    }))
  );

  useEffect(() => {
    if (user && !isLoaded && !isLoading) {
      fetchMyPermissions();
    }
  }, [user, isLoaded, isLoading]);

  return {
    user,
    role: myPermissions?.role || user?.role || '',
    isSuperAdmin: myPermissions?.isSuperAdmin || user?.role?.toLowerCase() === 'superadmin',
    isAdmin: myPermissions?.isAdmin || user?.role?.toLowerCase() === 'admin',
    isManager: myPermissions?.isManager || user?.role?.toLowerCase().includes('manager'),
    isAgent: myPermissions?.isAgent || ['agent', 'sales'].includes(user?.role?.toLowerCase() || ''),
    isPartner: myPermissions?.isPartner || user?.role?.toLowerCase() === 'partner',
    isCustomRole: myPermissions?.isCustomRole || false,
    hasPartnerFeature:
      myPermissions?.hasPartnerFeature ??
      user?.hasPartnerFeature ??
      (myPermissions?.isSuperAdmin || user?.role?.toLowerCase() === 'superadmin' ? true : false),
    maxPartners: myPermissions?.maxPartners ?? user?.maxPartners ?? 0,
    allowedModules: myPermissions?.allowedModules || [],
    isLoading,
    isLoaded,
    hasModuleAccess,
    hasScreenAccess,
    can,
    canView,
    canCreate,
    canEdit,
    canDelete,
    canExport,
    refreshPermissions: () => fetchMyPermissions(true),
    resetPermissions,
    // Backward compatibility
    permissions: user?.permissions || [],
    hasPermission: (perm: string) => can('View', perm),
  };
};

export const usePermissions = usePermission;
export default usePermission;
