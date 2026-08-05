import React, { Suspense, lazy } from 'react';
import ScreenLoader from '../components/ScreenLoader';

const SuperAdminDashboardContent = lazy(() => import('@/superadmin/components/SuperAdminDashboardContent'));

export default function SuperAdminDashboardScreen() {
  return (
    <Suspense fallback={<ScreenLoader message="Loading SuperAdmin Dashboard..." />}>
      <SuperAdminDashboardContent />
    </Suspense>
  );
}
