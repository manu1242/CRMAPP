import React, { Suspense, lazy } from 'react';
import ScreenLoader from '../components/ScreenLoader';

const SuperAdminSettingsContent = lazy(() => import('../../superadmin/components/SuperAdminSettingsContent'));

export default function SettingsScreen() {
  return (
    <Suspense fallback={<ScreenLoader message="Loading SuperAdmin Settings..." />}>
      <SuperAdminSettingsContent />
    </Suspense>
  );
}