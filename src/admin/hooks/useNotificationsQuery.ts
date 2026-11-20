import { useQuery } from '@tanstack/react-query';
import { NotificationService } from '../../Services/NotificationService';
import { useAuthStore } from '../../auth/store/authStore';

/**
 * Shared notification queries.
 * Keys match the ones `_layout.tsx` invalidates when a push arrives / is tapped,
 * so the header badge, bottom-nav dot and notification screen stay in sync automatically.
 */
export const NOTIFICATION_KEYS = {
  unread: ['unread-notifications-count'] as const,
  list: ['admin-notifications'] as const,
};

/** Lightweight unread count (one small request, shared by Header + BottomNav). */
export function useUnreadNotificationsCount() {
  const user = useAuthStore((s) => s.user);
  const { data } = useQuery({
    queryKey: [...NOTIFICATION_KEYS.unread, user?.userId],
    queryFn: () => NotificationService.getUnreadCount(),
    // Header mounts briefly during session restore — never call the API before auth is settled
    enabled: !!user,
    staleTime: 60 * 1000,
    refetchOnMount: false,
  });
  return data?.unreadCount ?? 0;
}

/** Full notification list + today's tasks for the notification screen. */
export function useAdminNotificationsQuery() {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: [...NOTIFICATION_KEYS.list, user?.userId],
    queryFn: () => NotificationService.getNotifications(),
    enabled: !!user,
    staleTime: 30 * 1000,
  });
}
