import React, { Suspense, lazy } from 'react';
import ScreenLoader from '../../components/ScreenLoader';

const TasksContent = lazy(() => import('@/admin/components/TasksContent'));

export default function AdminTasksScreen() {
  return (
    <Suspense fallback={<ScreenLoader message="Loading Tasks..." />}>
      <TasksContent />
    </Suspense>
  );
}
