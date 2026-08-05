import React, { Suspense, lazy } from 'react';
import ScreenLoader from '../../components/ScreenLoader';

const AdminPaymentConfigContent = lazy(() => import('@/admin/components/AdminPaymentConfigContent'));

export default function PaymentGatewayConfigScreen() {
  return (
    <Suspense fallback={<ScreenLoader message="Loading Payment Config..." />}>
      <AdminPaymentConfigContent />
    </Suspense>
  );
}
