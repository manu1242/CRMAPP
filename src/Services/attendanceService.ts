import { apiClient } from '../api/apiClient';
import { API_ENDPOINTS } from '../api/endpoints';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// 1. Agent Attendance Overview Types
export interface HeaderStats {
  totalAgents: number;
  workingDays: number;
  avgAttendancePercentage: number;
  currentMonthName: string;
  currentMonthShort: string;
  year: number;
  month: number;
}

export interface AgentOverviewItem {
  agentId: number;
  encodedAgentId: string;
  username: string;
  email: string;
  role: string;
  profileImage: string | null;
  attendancePercentage: number;
  presentDays: number;
  absentDays: number;
  workingDays: number;
  performance: string;
  performanceKey: string;
}

export interface AgentOverviewData {
  headerStats: HeaderStats;
  agents: AgentOverviewItem[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

export interface AgentOverviewParams {
  search?: string;
  role?: string;
  performance?: string;
  year?: number;
  month?: number;
  page?: number;
  pageSize?: number;
}

// 2. Selected Employee Calendar Details Types
export interface SelectableAgent {
  userId: number;
  encodedUserId: string;
  username: string;
  email: string;
  role: string;
}

export interface CalendarHeaderStats {
  todayTotalLogins: number;
  todayTotalLogouts: number;
  todayTotalHours: number;
  hasActiveSession: boolean;
  todayAttendanceId: number;
}

export interface CalendarDayItem {
  date: string;
  dayNumber: number;
  status: string;
  statusKey: string;
  totalHours: number;
  loginTime: string | null;
  logoutTime: string | null;
  hasLogin: boolean;
  hasLogout: boolean;
  correctionRequested: boolean;
  correctionStatus: string;
  correctionReason: string | null;
  attendanceId: number;
  isToday: boolean;
  isFuture: boolean;
}

export interface DayIntervalItem {
  index: number;
  login: string;
  logout: string | null;
  duration: string;
}

export interface PendingCorrectionRequest {
  attendanceId: number;
  agentId: number;
  encodedAgentId: string;
  agentName: string;
  date: string;
  formattedDate: string;
  reason: string;
  status: string;
}

export interface CalendarData {
  selectedAgent: AgentOverviewItem;
  selectableAgents: SelectableAgent[];
  year: number;
  month: number;
  daysInMonth: number;
  headerStats: CalendarHeaderStats;
  calendarDays: CalendarDayItem[];
  todayIntervals: DayIntervalItem[];
  pendingCorrectionRequests: PendingCorrectionRequest[];
  canManageAttendance: boolean;
}

export interface CalendarParams {
  agentId?: string | number;
  year?: number;
  month?: number;
}

// 3. Date Intervals Types
export interface DateIntervalsData {
  date: string;
  attendanceId: number;
  hasActiveSession: boolean;
  intervals: DayIntervalItem[];
}

export interface DateIntervalsParams {
  agentId: string | number;
  date: string;
}

// 4-8. Action Payloads & Responses
export interface LoginPayload {
  agentId?: string | number;
  attendanceId?: number;
  date?: string;
}

export interface LoginResultData {
  attendanceId: number;
  agentId: number;
  encodedAgentId: string;
  loginTime: string;
  status: string;
}

export interface LogoutPayload {
  attendanceId: number;
}

export interface LogoutResultData {
  attendanceId: number;
  agentId: number;
  encodedAgentId: string;
  logoutTime: string;
  status: string;
}

export interface RequestCorrectionPayload {
  attendanceId: number;
  reason: string;
  agentId?: string | number;
  date?: string;
}

export interface ApproveCorrectionPayload {
  attendanceId: number;
  approvedHours: number;
}

export interface RejectCorrectionPayload {
  attendanceId: number;
}

export const attendanceService = {
  /**
   * 1. Retrieve total agent stats, agent cards with attendance rates, working days, present/absent counts, and performance classifications.
   */
  getAgentOverview: async (params?: AgentOverviewParams): Promise<ApiResponse<AgentOverviewData>> => {
    return await apiClient.get<ApiResponse<AgentOverviewData>>(
      API_ENDPOINTS.ATTENDANCE.AGENT_OVERVIEW,
      params
    );
  },

  /**
   * 2. Retrieve complete calendar grid for the month, individual date attendance status, login/logout intervals for today, header activity stats, employee selector list, and pending correction requests.
   */
  getCalendar: async (params?: CalendarParams): Promise<ApiResponse<CalendarData>> => {
    return await apiClient.get<ApiResponse<CalendarData>>(
      API_ENDPOINTS.ATTENDANCE.CALENDAR,
      params
    );
  },

  /**
   * 3. Retrieve all login and logout session intervals for a selected agent on a specific date.
   */
  getIntervals: async (params: DateIntervalsParams): Promise<ApiResponse<DateIntervalsData>> => {
    return await apiClient.get<ApiResponse<DateIntervalsData>>(
      API_ENDPOINTS.ATTENDANCE.INTERVALS,
      params
    );
  },

  /**
   * 4. Clock in an agent for the current day.
   */
  login: async (payload: LoginPayload): Promise<ApiResponse<LoginResultData>> => {
    return await apiClient.post<ApiResponse<LoginResultData>>(
      API_ENDPOINTS.ATTENDANCE.LOGIN,
      payload
    );
  },

  /**
   * 5. Clock out an agent for the current day.
   */
  logout: async (payload: LogoutPayload): Promise<ApiResponse<LogoutResultData>> => {
    return await apiClient.post<ApiResponse<LogoutResultData>>(
      API_ENDPOINTS.ATTENDANCE.LOGOUT,
      payload
    );
  },

  /**
   * 6. Submit a correction request for incomplete or missing attendance.
   */
  requestCorrection: async (payload: RequestCorrectionPayload): Promise<ApiResponse<Record<string, any>>> => {
    return await apiClient.post<ApiResponse<Record<string, any>>>(
      API_ENDPOINTS.ATTENDANCE.REQUEST_CORRECTION,
      payload
    );
  },

  /**
   * 7. Approve a pending attendance correction request.
   */
  approveCorrection: async (payload: ApproveCorrectionPayload): Promise<ApiResponse<Record<string, any>>> => {
    return await apiClient.post<ApiResponse<Record<string, any>>>(
      API_ENDPOINTS.ATTENDANCE.APPROVE_CORRECTION,
      payload
    );
  },

  /**
   * 8. Reject a pending attendance correction request.
   */
  rejectCorrection: async (payload: RejectCorrectionPayload): Promise<ApiResponse<Record<string, any>>> => {
    return await apiClient.post<ApiResponse<Record<string, any>>>(
      API_ENDPOINTS.ATTENDANCE.REJECT_CORRECTION,
      payload
    );
  },
};
