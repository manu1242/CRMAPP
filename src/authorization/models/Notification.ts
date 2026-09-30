export interface NotificationItem {
  id?: string | number;
  notificationId?: number;
  title: string;
  message: string;
  type?: string;
  link?: string;
  priority?: string;
  relatedEntityType?: string;
  relatedEntityId?: number | string;
  isRead?: boolean;
  createdOn: string;
  createdOnFormatted?: string;
}

export interface TodayTaskItem {
  leadId: number;
  encodedId?: string;
  followUpId: number;
  name: string;
  contact?: string;
  stage?: string;
  status?: string;
  followUpTime?: string;
  followUpDate?: string;
}

export type Notification = NotificationItem;