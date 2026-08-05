export interface TaskLeadItem {
  leadId: number;
  encodeUrl?: string;
  name: string;
  contact: string;
  stage: string;
  status: string;
  followUpDate: string;
  comments?: string;
  isCompleted: boolean;
}

export interface TasksByDateDay {
  date: string;
  displayDate: string;
  dayName: string;
  isToday: boolean;
  isTomorrow: boolean;
  tasks: TaskLeadItem[];
}

export interface TasksDebugInfo {
  totalLeads?: number;
  leadsWithFollowUp?: number;
  sampleLead?: any;
  sampleTask?: any;
  totalTasks?: number;
  userRole?: string;
  userId?: number;
  weekRange?: string;
}

export interface GetTasksByDateResponse {
  weekStart: string;
  weekEnd: string;
  tasksByDate: TasksByDateDay[];
  debug?: TasksDebugInfo;
}

export interface UpdateTaskDateRequest {
  leadId: number;
  newDate: string;
}

export interface UpdateTaskDateResponse {
  success: boolean;
  message?: string;
  movedToToday?: boolean;
}

export interface MarkTaskCompleteRequest {
  leadId: number;
  isCompleted: boolean;
}

export interface MarkTaskCompleteResponse {
  success: boolean;
  message?: string;
}

export interface TodayTaskNotificationItem {
  leadId: number;
  encodedId?: string;
  followUpId?: number;
  name: string;
  contact: string;
  stage?: string;
  status?: string;
  followUpTime?: string;
  comments?: string;
}

export interface GetTodayTaskNotificationsResponse {
  count: number;
  tasks: TodayTaskNotificationItem[];
}

export interface MarkNotificationsReadResponse {
  success: boolean;
  message?: string;
}
