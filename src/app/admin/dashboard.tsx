import React, { Suspense, lazy } from 'react';
import DashboardSkeleton from '../../admin/components/DashboardSkeleton';

const AdminDashboardContent = lazy(() => import('../../admin/components/AdminDashboardContent'));

export default function AdminDashboardScreen() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <AdminDashboardContent />
    </Suspense>
  );
}
