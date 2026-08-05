import React, { Suspense, lazy } from 'react';
import ScreenLoader from '../components/ScreenLoader';

const PartnerDashboardContent = lazy(() => import('@/admin/components/PartnerDashboardContent'));

export default function PartnerDashboard() {
  return (
    <Suspense fallback={<ScreenLoader message="Loading Partner Dashboard..." />}>
      <PartnerDashboardContent />
    </Suspense>
  );
}
