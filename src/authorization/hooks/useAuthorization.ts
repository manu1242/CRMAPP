import { useRole } from './useRole';
import { usePermission } from './usePermission';
import { useCan } from './useCan';

export const useAuthorization = () => {
  const { role, hasRole } = useRole();
  const { permissions, hasPermission } = usePermission();
  const { can, canAny, canAll } = useCan();

  return {
    role,
    permissions,
    hasRole,
    hasPermission,
    can,
    canAny,
    canAll,
  };
};
