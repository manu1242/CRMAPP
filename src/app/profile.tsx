import React, { Suspense, lazy } from 'react';
import { Redirect } from 'expo-router';
import ScreenLoader from './components/ScreenLoader';
import { useAuthStore } from '../auth/store/authStore';

const ProfileContent = lazy(() => import('./components/ProfileContent'));

export default function ProfileScreen() {
  const user = useAuthStore((state) => state.user);
  const isSuperAdmin = user?.role?.trim()?.toLowerCase() === 'superadmin';

  if (isSuperAdmin) {
    return <Redirect href="/superadmin/profile" />;
  }

  return (
    <Suspense fallback={<ScreenLoader message="Loading Profile..." />}>
      <ProfileContent />
    </Suspense>
  );
}
