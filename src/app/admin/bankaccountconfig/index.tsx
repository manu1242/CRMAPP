import React, { Suspense, lazy } from 'react';
import ScreenLoader from '../../components/ScreenLoader';

const BankAccountConfigContent = lazy(() => import('@/admin/components/BankAccountConfigContent'));

export default function BankAccountConfigScreen() {
  return (
    <Suspense fallback={<ScreenLoader message="Loading Bank Config..." />}>
      <BankAccountConfigContent />
    </Suspense>
  );
}
