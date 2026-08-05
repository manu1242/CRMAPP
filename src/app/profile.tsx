import React, { Suspense, lazy } from 'react';
import ScreenLoader from './components/ScreenLoader';

const ProfileContent = lazy(() => import('./components/ProfileContent'));

export default function ProfileScreen() {
  return (
    <Suspense fallback={<ScreenLoader message="Loading Profile..." />}>
      <ProfileContent />
    </Suspense>
  );
}
