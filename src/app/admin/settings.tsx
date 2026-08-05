import React, { Suspense, lazy } from 'react';
import ScreenLoader from '../components/ScreenLoader';

const AdminSettingsContent = lazy(() => import('@/admin/components/AdminSettingsContent'));

export default function AdminSettings() {
  return (
    <Suspense fallback={<ScreenLoader message="Loading Settings..." />}>
      <AdminSettingsContent />
    </Suspense>
  );
}
