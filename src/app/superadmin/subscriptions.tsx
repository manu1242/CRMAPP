import React, { Suspense, lazy } from 'react';
import ScreenLoader from '../components/ScreenLoader';

const SubscriptionsContent = lazy(() => import('@/superadmin/subscriptions/components/SubscriptionsContent'));

export default function SubscriptionsScreen() {
  return (
    <Suspense fallback={<ScreenLoader message="Loading Subscriptions..." />}>
      <SubscriptionsContent />
    </Suspense>
  );
}
