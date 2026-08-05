import React, { Suspense, lazy } from 'react';
import ScreenLoader from '../components/ScreenLoader';

const SuperAdminPaymentConfigContent = lazy(() => import('@/superadmin/components/SuperAdminPaymentConfigContent'));

export default function PaymentConfigScreen() {
  return (
    <Suspense fallback={<ScreenLoader message="Loading Payment Config..." />}>
      <SuperAdminPaymentConfigContent />
    </Suspense>
  );
}
