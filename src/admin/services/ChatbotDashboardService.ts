import { apiClient } from '../../api/apiClient';
import { API_ENDPOINTS } from '../../api/endpoints';

export interface ChatbotConversation {
  conversationId: string;
  assignedAt?: string;
  status: string; // e.g. "Assigned", "Unassigned", "Closed"
  priority: string; // e.g. "Low", "Medium", "High"
  lastActivity?: string;
  assignedAgentName?: string;
}

export interface ChatbotAgent {
  agentId?: number;
  agentName: string;
  status: string; // e.g. "Online", "Offline", "Busy"
  currentChats: number;
  maxChats: number;
  avgResponseTime?: string | number | null;
}

export interface ChatbotMessage {
  id: number;
  conversationId: string;
  messageText: string;
  messageType: 'User' | 'Bot' | 'Agent';
  senderName: string;
  sentAt: string;
}

export interface ChatbotNotification {
  notificationId: string | number;
  title: string;
  message: string;
  sentAt: string;
  isRead: boolean;
}

export interface ChatbotDashboardStats {
  totalActiveConversations: number;
  unassignedConversationsCount: number;
  onlineAgentsCount: number;
  unreadNotificationsCount: number;
  todayTotalMessages: number;
  todayUserMessages: number;
  todayAgentMessages: number;
  todayAverageResponseTime?: string | number | null;
  todayLeadsGenerated: boolean;
  memberLoginCount: number;
}

export interface ChatbotDashboardData {
  myActiveConversations: ChatbotConversation[];
  unassignedConversations: ChatbotConversation[];
  onlineAgents: ChatbotAgent[];
  recentMessages: ChatbotMessage[];
  unreadNotifications: ChatbotNotification[];
  stats: ChatbotDashboardStats;
}

export interface GetDashboardResponse {
  success: boolean;
  message?: string;
  data: ChatbotDashboardData;
}

export interface ConversationAssignment {
  conversationId: string;
  assignedAgentId: number;
  assignedAt: string;
  status: string;
  priority: string;
}

export interface ConversationDetails {
  conversationId: string;
  messages: ChatbotMessage[];
  assignment?: ConversationAssignment | null;
}

export interface GetConversationDetailsResponse {
  success: boolean;
  message?: string;
  data: ConversationDetails;
}

export interface AssignPayload {
  conversationId: string;
  agentId: number;
  priority?: string; // Optional
}

export interface SendMessagePayload {
  conversationId: string;
  messageText: string;
}

export interface ChatbotAnalyticsMetric {
  date: string;
  totalConversations: number;
  leadsGenerated: number;
  avgResponseTimeSeconds: number;
}

export interface GetAnalyticsResponse {
  success: boolean;
  message?: string;
  data: ChatbotAnalyticsMetric[];
}

export const chatbotDashboardService = {
  /**
   * 1. Get Chatbot Dashboard statistics and listings
   */
  getDashboardData: async (): Promise<GetDashboardResponse> => {
    return await apiClient.get<GetDashboardResponse>(
      API_ENDPOINTS.CHATBOT_DASHBOARD_API.GET_DASHBOARD
    );
  },

  /**
   * 2. Get detailed conversation log (messages & assignments)
   */
  getConversationDetails: async (conversationId: string): Promise<GetConversationDetailsResponse> => {
    return await apiClient.get<GetConversationDetailsResponse>(
      API_ENDPOINTS.CHATBOT_DASHBOARD_API.CONVERSATION_DETAILS(conversationId)
    );
  },

  /**
   * 3. Assign a conversation session to an agent
   */
  assignConversation: async (payload: AssignPayload): Promise<any> => {
    return await apiClient.post<any>(
      API_ENDPOINTS.CHATBOT_DASHBOARD_API.ASSIGN,
      payload
    );
  },

  /**
   * 4. Send manual agent message
   */
  sendMessage: async (payload: SendMessagePayload): Promise<any> => {
    return await apiClient.post<any>(
      API_ENDPOINTS.CHATBOT_DASHBOARD_API.SEND_MESSAGE,
      payload
    );
  },

  /**
   * 5. Get chatbot analytics logs
   */
  getAnalytics: async (): Promise<GetAnalyticsResponse> => {
    return await apiClient.get<GetAnalyticsResponse>(
      API_ENDPOINTS.CHATBOT_DASHBOARD_API.ANALYTICS
    );
  },
};
